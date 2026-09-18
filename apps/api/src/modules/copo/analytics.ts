import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { CopoActor } from './access.js';
import { applicablePos, applicablePsos, listOfficialSdgs } from './helpers.js';

type ItemRow = Record<string, unknown>;

async function approvedItems(actor: CopoActor, kind: 'PO' | 'PSO' | 'SDG', filters: {
  schemeId?: number;
  programId?: number;
  academicYearId?: number;
}) {
  const versions = (await db('copo_mapping_versions')
    .where({ college_id: actor.collegeId, is_current: true, status: 'APPROVED', mapping_kind: kind })
    .modify((q) => {
      if (filters.schemeId) q.andWhere({ scheme_id: filters.schemeId });
      if (filters.programId) q.andWhere((b) => b.where({ program_id: filters.programId }).orWhereNull('program_id'));
      if (filters.academicYearId) q.andWhere({ academic_year_id: filters.academicYearId });
    })) as ItemRow[];
  const versionIds = versions.map((v) => Number(v.id));
  if (!versionIds.length) return { versions, items: [] as ItemRow[] };
  const items = await db('copo_mapping_items as i')
    .join('courses as c', 'c.id', 'i.course_id')
    .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
    .leftJoin('course_outcomes as co', 'co.id', 'i.course_outcome_id')
    .whereIn('i.mapping_version_id', versionIds)
    .whereNotNull('i.correlation_strength')
    .select(
      'i.*',
      'c.code as course_code',
      'c.name as course_name',
      'c.scheme_id as course_scheme_id',
      'sem.label as semester_label',
      'sem.number as semester_number',
      'co.co_code',
      'co.statement as co_statement',
    );
  return { versions, items: items as ItemRow[] };
}

function strengthBuckets(related: ItemRow[]) {
  return {
    high: related.filter((i) => Number(i.correlation_strength) === 3).length,
    moderate: related.filter((i) => Number(i.correlation_strength) === 2).length,
    low: related.filter((i) => Number(i.correlation_strength) === 1).length,
  };
}

function drilldown(related: ItemRow[]) {
  return related.map((i) => ({
    courseId: Number(i.course_id),
    subjectCode: i.course_code,
    subjectName: i.course_name,
    semesterLabel: i.semester_label,
    semesterNumber: i.semester_number,
    coCode: i.co_code,
    coStatement: i.co_statement,
    mappingVersionId: Number(i.mapping_version_id),
    strength: Number(i.correlation_strength),
    justification: i.justification,
  }));
}

export async function psoCoverage(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number) {
  if (!schemeId || !programId) throw new AppError(400, 'schemeId and programId are required');
  const psos = await applicablePsos(actor.collegeId, schemeId, programId);
  const { items } = await approvedItems(actor, 'PSO', { schemeId, programId, academicYearId });
  const rows = psos.map((pso) => {
    const related = items.filter((i) => Number(i.program_specific_outcome_id) === pso.id);
    return {
      pso,
      subjectsContributing: new Set(related.map((i) => Number(i.course_id))).size,
      contributingCos: new Set(related.map((i) => Number(i.course_outcome_id))).size,
      ...strengthBuckets(related),
      drilldown: drilldown(related),
    };
  });
  return {
    disclaimer: 'PSO coverage is curriculum alignment from approved CO–PSO mappings. It is not attainment.',
    programSpecificOutcomes: psos,
    rows,
  };
}

export async function sdgCoverage(actor: CopoActor, filters: { schemeId?: number; programId?: number; academicYearId?: number }) {
  const sdgs = await listOfficialSdgs(true);
  const { items } = await approvedItems(actor, 'SDG', filters);
  const rows = sdgs.map((sdg) => {
    const related = items.filter((i) => Number(i.sdg_id) === sdg.id);
    return {
      sdg,
      subjectsContributing: new Set(related.map((i) => Number(i.course_id))).size,
      contributingCos: new Set(related.map((i) => Number(i.course_outcome_id))).size,
      ...strengthBuckets(related),
      drilldown: drilldown(related),
    };
  });
  return {
    disclaimer:
      'SDG coverage is curriculum alignment / contribution from approved CO–SDG mappings. Missing SDGs are not automatically deficiencies. This is not student attainment.',
    sdgs,
    rows,
  };
}

export async function semesterSdgMap(actor: CopoActor, filters: { schemeId?: number; programId?: number; academicYearId?: number }) {
  const sdgs = await listOfficialSdgs(true);
  const { items } = await approvedItems(actor, 'SDG', filters);
  const semesters = [...new Set(items.map((i) => Number(i.semester_number || 0)).filter((n) => n > 0))].sort((a, b) => a - b);
  const grid = sdgs.map((sdg) => ({
    sdg,
    semesters: Object.fromEntries(
      semesters.map((sem) => {
        const hit = items.some((i) => Number(i.sdg_id) === sdg.id && Number(i.semester_number) === sem);
        return [sem, hit];
      }),
    ),
  }));
  return {
    disclaimer: 'Semester-wise SDG coverage is derived from approved CO–SDG mappings. Absence is not automatically a curriculum deficiency.',
    semesters,
    grid,
  };
}

function derivedLabel(pairs: Array<{ poStrength: number; sdgStrength: number }>) {
  if (!pairs.length) return '–';
  if (pairs.some((p) => p.poStrength === 3 && p.sdgStrength === 3)) return 'Strong';
  if (pairs.some((p) => Math.min(p.poStrength, p.sdgStrength) >= 2)) return 'Moderate';
  return 'Supporting';
}

export async function derivedPoSdg(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number) {
  const pos = await applicablePos(actor.collegeId, schemeId, programId);
  const sdgs = await listOfficialSdgs(true);
  const poItems = await approvedItems(actor, 'PO', { schemeId, programId, academicYearId });
  const sdgItems = await approvedItems(actor, 'SDG', { schemeId, programId, academicYearId });
  const matrix = pos.outcomes.map((po) => {
    const cells = sdgs.map((sdg) => {
      const evidence = [];
      for (const poItem of poItems.items.filter((i) => Number(i.program_outcome_id) === po.id)) {
        const matches = sdgItems.items.filter(
          (s) => Number(s.course_outcome_id) === Number(poItem.course_outcome_id) && Number(s.sdg_id) === sdg.id,
        );
        for (const sdgItem of matches) {
          evidence.push({
            courseId: Number(poItem.course_id),
            subjectCode: poItem.course_code,
            coCode: poItem.co_code,
            poStrength: Number(poItem.correlation_strength),
            sdgStrength: Number(sdgItem.correlation_strength),
          });
        }
      }
      return {
        sdgId: sdg.id,
        sdgCode: sdg.code,
        label: derivedLabel(evidence),
        contributingCos: new Set(evidence.map((e) => `${e.courseId}:${e.coCode}`)).size,
        evidence,
      };
    });
    return { po, cells };
  });
  return {
    derived: true,
    disclaimer:
      'Derived from approved CO mappings. This is not a manually approved PO–SDG relationship and is not attainment.',
    programmeOutcomes: pos.outcomes,
    sdgs,
    matrix,
  };
}

export async function derivedPsoSdg(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number) {
  const psos = await applicablePsos(actor.collegeId, schemeId, programId);
  const sdgs = await listOfficialSdgs(true);
  const psoItems = await approvedItems(actor, 'PSO', { schemeId, programId, academicYearId });
  const sdgItems = await approvedItems(actor, 'SDG', { schemeId, programId, academicYearId });
  const matrix = psos.map((pso) => {
    const cells = sdgs.map((sdg) => {
      const evidence = [];
      for (const psoItem of psoItems.items.filter((i) => Number(i.program_specific_outcome_id) === pso.id)) {
        const matches = sdgItems.items.filter(
          (s) => Number(s.course_outcome_id) === Number(psoItem.course_outcome_id) && Number(s.sdg_id) === sdg.id,
        );
        for (const sdgItem of matches) {
          evidence.push({
            courseId: Number(psoItem.course_id),
            subjectCode: psoItem.course_code,
            coCode: psoItem.co_code,
            psoStrength: Number(psoItem.correlation_strength),
            sdgStrength: Number(sdgItem.correlation_strength),
          });
        }
      }
      return {
        sdgId: sdg.id,
        sdgCode: sdg.code,
        label: derivedLabel(evidence.map((e) => ({ poStrength: e.psoStrength, sdgStrength: e.sdgStrength }))),
        contributingCos: new Set(evidence.map((e) => `${e.courseId}:${e.coCode}`)).size,
        evidence,
      };
    });
    return { pso, cells };
  });
  return {
    derived: true,
    disclaimer:
      'Derived from approved CO mappings. This is not a manually approved PSO–SDG relationship and is not attainment.',
    programSpecificOutcomes: psos,
    sdgs,
    matrix,
  };
}
