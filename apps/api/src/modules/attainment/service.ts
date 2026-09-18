import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canViewCollegeAttainment, type AttainmentActor } from './access.js';
import { recordAttainmentAudit } from './audit.js';
import { ensureAcademicStandardAndLibraries } from './bootstrap.js';
import { calculateRun } from './calculate.js';
import { evidenceCompleteness, type EvidenceItem } from './evidence.js';
import {
  gatherAssignmentSources,
  gatherIndirectSources,
  gatherMarkSheetSources,
  gatherQuizSources,
  loadCourseAssessmentWeights,
  loadCourseOutcomes,
  loadMappingSnapshot,
  loadSeePaperQuestions,
} from './gather.js';
import { parseJson } from './json.js';
import { EVIDENCE_TEMPLATES, ACTIONS } from './libraries.js';
import { parsePolicy, SKILLONX_STANDARD_V1 } from './policy.js';
import { FORMULA_VERSION, STANDARD_CODE, type CiState, type SeeMethod } from './types.js';
import {
  assertTransition,
  canApproveClosure,
  nextAfterImplemented,
  nextAfterReassessed,
  requiresIndependentReview,
  reviewerRoles,
} from './workflow.js';
import { classifyCoStatus, improvementDelta } from './formula.js';

export const calculateSchema = z.object({
  courseId: z.number().int().positive(),
  academicYearId: z.number().int().positive().optional().nullable(),
  programId: z.number().int().positive().optional().nullable(),
  semesterId: z.number().int().positive().optional().nullable(),
  classSectionId: z.number().int().positive().optional().nullable(),
  seeMethod: z.enum(['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT']).optional().nullable(),
  commit: z.boolean().optional().default(false),
});

async function actorName(id: number) {
  const row = await db('faculty_users').where({ id }).first();
  return row?.name ? String(row.name) : null;
}

export async function resolveActivePolicy(collegeId: number) {
  await ensureAcademicStandardAndLibraries();
  const version = await db('academic_standard_versions as v')
    .join('academic_standards as s', 's.id', 'v.standard_id')
    .where({ 's.code': STANDARD_CODE, 's.scope_key': 'PLATFORM', 'v.is_current': true })
    .select('v.id', 'v.version', 'v.policy_json', 'v.formula_version')
    .first();
  if (!version) {
    return {
      id: null as number | null,
      policy: SKILLONX_STANDARD_V1,
      version: SKILLONX_STANDARD_V1.version,
      formulaVersion: FORMULA_VERSION,
    };
  }
  return {
    id: Number(version.id),
    policy: parsePolicy(parseJson(version.policy_json, SKILLONX_STANDARD_V1)),
    version: String(version.version),
    formulaVersion: String(version.formula_version || FORMULA_VERSION),
  };
}

function ownerFilter(actor: AttainmentActor) {
  return canViewCollegeAttainment(actor.role) ? null : actor.facultyUserId;
}

export async function getCatalog(collegeId: number) {
  const [academicYears, programs, semesters, courses] = await Promise.all([
    db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc'),
    db('programs').where({ college_id: collegeId }).orderBy('name'),
    db('semesters').where({ college_id: collegeId }).orderBy('number'),
    db('courses').where({ college_id: collegeId }).orderBy('code'),
  ]);
  const policy = await resolveActivePolicy(collegeId);
  return {
    academicYears,
    programs,
    semesters,
    courses: courses.map((c) => ({ id: c.id, code: c.code, name: c.name })),
    standard: {
      name: policy.policy.name,
      version: policy.version,
      formulaVersion: policy.formulaVersion,
      defaults: {
        coTarget: policy.policy.defaultCoTarget,
        poTarget: policy.policy.defaultPoTarget,
        directIndirect: `${policy.policy.directWeight * 100}:${policy.policy.indirectWeight * 100}`,
      },
    },
  };
}

async function buildCalculation(actor: AttainmentActor, input: z.infer<typeof calculateSchema>) {
  const course = await db('courses').where({ id: input.courseId, college_id: actor.collegeId }).first();
  if (!course) throw new AppError(404, 'Course not found');
  const owner = ownerFilter(actor);
  const ctx = {
    collegeId: actor.collegeId,
    courseId: input.courseId,
    createdBy: owner,
    academicYearId: input.academicYearId ?? null,
    semesterId: input.semesterId ?? null,
  };
  const [policy, outcomes, weights, mapping, seePaper, quizzes, assignments, cieSheets, seeSheets, indirect] =
    await Promise.all([
      resolveActivePolicy(actor.collegeId),
      loadCourseOutcomes(actor.collegeId, input.courseId),
      loadCourseAssessmentWeights(actor.collegeId, input.courseId, course.code),
      loadMappingSnapshot(actor.collegeId, input.courseId),
      loadSeePaperQuestions(actor.collegeId, input.courseId),
      gatherQuizSources(ctx),
      gatherAssignmentSources(ctx),
      gatherMarkSheetSources(ctx, 'CIE'),
      gatherMarkSheetSources(ctx, 'SEE'),
      gatherIndirectSources(ctx),
    ]);
  if (!outcomes.length) throw new AppError(422, 'This course has no current course outcomes to attain.');
  const poMappings = mapping.items
    .filter((i) => i.poCode && i.coCode)
    .map((i) => ({ coCode: String(i.coCode), outcomeCode: String(i.poCode), strength: Number(i.correlation_strength) }));
  const psoMappings = mapping.items
    .filter((i) => i.psoCode && i.coCode)
    .map((i) => ({ coCode: String(i.coCode), outcomeCode: String(i.psoCode), strength: Number(i.correlation_strength) }));
  const calculated = calculateRun({
    policyRaw: policy.policy,
    outcomes,
    cieSources: [...quizzes, ...assignments, ...cieSheets],
    seeSources: seeSheets,
    indirectSources: indirect,
    seePaperQuestions: seePaper.questions,
    preferredSeeMethod: (input.seeMethod as SeeMethod | null) ?? null,
    cieWeight: weights.cieWeight,
    seeWeight: weights.seeWeight,
    components: weights.components,
    poMappings,
    psoMappings,
  });
  return { course, policy, calculated, mapping, seePaper, weights };
}

async function persistRun(
  actor: AttainmentActor,
  input: z.infer<typeof calculateSchema>,
  built: Awaited<ReturnType<typeof buildCalculation>>,
  status: 'PREVIEW' | 'COMMITTED',
) {
  const { course, policy, calculated, mapping, seePaper, weights } = built;
  if (status === 'COMMITTED') {
    const current = await db('attainment_runs')
      .where({ college_id: actor.collegeId, course_id: input.courseId, status: 'COMMITTED' })
      .modify((q) => {
        if (input.academicYearId) q.andWhere({ academic_year_id: input.academicYearId });
      })
      .orderBy('id', 'desc')
      .first();
    if (current) {
      // keep history — supersede later once we have the new id
    }
    const insertIds = await db('attainment_runs').insert({
      college_id: actor.collegeId,
      created_by: actor.facultyUserId,
      department_id: actor.departmentId ?? course.department_id ?? null,
      course_id: input.courseId,
      academic_year_id: input.academicYearId ?? null,
      program_id: input.programId ?? null,
      semester_id: input.semesterId ?? null,
      class_section_id: input.classSectionId ?? null,
      policy_version_id: policy.id,
      policy_snapshot: JSON.stringify(calculated.policy),
      formula_version: calculated.policy.formulaVersion,
      status,
      see_method: calculated.seeDecision.method,
      see_confidence: calculated.seeDecision.confidence,
      see_estimated: calculated.seeDecision.estimated,
      see_paper_id: seePaper.paper ? Number(seePaper.paper.id) : null,
      see_marks_source: calculated.seeDecision.method,
      structure_snapshot: JSON.stringify(weights),
      mapping_snapshot: JSON.stringify(mapping),
      calculated_at: db.fn.now(),
    });
    const runId = Number(insertIds[0]);
    if (current) {
      await db('attainment_runs').where({ id: current.id }).update({ status: 'SUPERSEDED', superseded_by: runId, updated_at: db.fn.now() });
    }
    for (const w of calculated.seeWeights) {
      await db('see_co_weights').insert({
        run_id: runId,
        co_code: w.coCode,
        marks: w.marks,
        weight: w.weight,
        method: calculated.seeDecision.method,
      });
    }
    for (const co of calculated.cos) {
      const resultIds = await db('co_attainment_results').insert({
        run_id: runId,
        college_id: actor.collegeId,
        co_code: co.coCode,
        course_outcome_id: co.courseOutcomeId,
        statement_snapshot: co.statement,
        target: co.target,
        cie_attainment: co.cie,
        see_attainment: co.see,
        direct_attainment: co.direct,
        indirect_attainment: co.indirect,
        final_attainment: co.final,
        gap: co.gap,
        status: co.status,
        student_count: co.studentCount,
        weak_student_count: co.weakStudentCount,
        formula_json: JSON.stringify(co.formula),
        detail_json: JSON.stringify({ sources: co.sources, recommendation: co.recommendation }),
      });
      const resultId = Number(resultIds[0]);
      for (const src of co.sources) {
        await db('co_attainment_sources').insert({
          result_id: resultId,
          source_kind: src.sourceKind,
          source_id: String(src.sourceId),
          source_label: src.sourceLabel,
          category: src.category,
          weight: src.weight,
          attainment: src.attainment,
          student_count: src.studentCount,
          confidence: src.category === 'SEE' ? calculated.seeDecision.confidence : 'HIGH',
          detail_json: src.diagnostics ? JSON.stringify(src.diagnostics) : null,
        });
      }
      for (const student of co.students) {
        await db('co_attainment_students').insert({
          result_id: resultId,
          usn: student.usn || student.studentKey,
          below_threshold: student.belowThreshold,
          final_level: student.level,
        });
      }
      await db('attainment_calc_details').insert([
        { run_id: runId, result_id: resultId, step_key: 'CIE', formula: co.formula.cie, output: co.cie },
        { run_id: runId, result_id: resultId, step_key: 'SEE', formula: co.formula.see, output: co.see },
        { run_id: runId, result_id: resultId, step_key: 'DIRECT', formula: co.formula.direct, output: co.direct },
        { run_id: runId, result_id: resultId, step_key: 'FINAL', formula: co.formula.final, output: co.final },
      ]);
      if (co.status === 'RED' && calculated.policy.coBelowTargetRequiresImprovement) {
        await openCycleIfNeeded(actor, {
          courseId: input.courseId,
          runId,
          resultId,
          kind: 'CO',
          outcomeCode: co.coCode,
          target: co.target,
          actual: co.final,
          gap: co.gap,
          studentsIdentified: co.weakStudentCount,
          recommendation: co.recommendation,
          weakness: co.sources,
          departmentId: actor.departmentId ?? course.department_id ?? null,
        });
      }
    }
    for (const po of calculated.po) {
      const st = classifyCoStatus(
        { actual: po.attainment, target: calculated.policy.defaultPoTarget, weakStudentRatio: 0, weakComponentGap: 0 },
        calculated.policy,
      );
      await db('po_attainment_results').insert({
        run_id: runId,
        college_id: actor.collegeId,
        po_code: po.outcomeCode,
        target: calculated.policy.defaultPoTarget,
        attainment: po.attainment,
        gap: po.attainment == null ? null : calculated.policy.defaultPoTarget - po.attainment,
        status: st,
        contributing_json: JSON.stringify(po.contributing),
        formula: po.formula,
      });
      if (st === 'RED' && calculated.policy.poBelowTargetRequiresImprovement) {
        await openCycleIfNeeded(actor, {
          courseId: input.courseId,
          runId,
          resultId: null,
          kind: 'PO',
          outcomeCode: po.outcomeCode,
          target: calculated.policy.defaultPoTarget,
          actual: po.attainment,
          gap: po.attainment == null ? null : calculated.policy.defaultPoTarget - po.attainment,
          studentsIdentified: null,
          recommendation: { causes: [], actions: [], summary: `PO ${po.outcomeCode} below target.` },
          weakness: po.contributing,
          departmentId: actor.departmentId ?? course.department_id ?? null,
        });
      }
    }
    for (const pso of calculated.pso) {
      const st = classifyCoStatus(
        { actual: pso.attainment, target: calculated.policy.defaultPsoTarget, weakStudentRatio: 0, weakComponentGap: 0 },
        calculated.policy,
      );
      await db('pso_attainment_results').insert({
        run_id: runId,
        college_id: actor.collegeId,
        pso_code: pso.outcomeCode,
        target: calculated.policy.defaultPsoTarget,
        attainment: pso.attainment,
        gap: pso.attainment == null ? null : calculated.policy.defaultPsoTarget - pso.attainment,
        status: st,
        contributing_json: JSON.stringify(pso.contributing),
        formula: pso.formula,
      });
    }
    await recordAttainmentAudit({
      collegeId: actor.collegeId,
      runId,
      actorId: actor.facultyUserId,
      actorName: await actorName(actor.facultyUserId),
      action: 'ATTAINMENT_COMMITTED',
      metadata: { seeMethod: calculated.seeDecision.method, formulaVersion: calculated.policy.formulaVersion },
    });
    return serializeRun(runId, actor.collegeId);
  }

  return {
    preview: true,
    course: { id: course.id, code: course.code, name: course.name },
    policy: {
      name: calculated.policy.name,
      version: calculated.policy.version,
      formulaVersion: calculated.policy.formulaVersion,
    },
    see: calculated.seeDecision,
    structure: calculated.structure,
    cos: calculated.cos,
    po: calculated.po,
    pso: calculated.pso,
  };
}

export async function previewCalculation(actor: AttainmentActor, input: z.infer<typeof calculateSchema>) {
  const built = await buildCalculation(actor, input);
  return persistRun(actor, input, built, 'PREVIEW');
}

export async function commitCalculation(actor: AttainmentActor, input: z.infer<typeof calculateSchema>) {
  const built = await buildCalculation(actor, { ...input, commit: true });
  return persistRun(actor, input, built, 'COMMITTED');
}

async function openCycleIfNeeded(
  actor: AttainmentActor,
  payload: {
    courseId: number;
    runId: number;
    resultId: number | null;
    kind: 'CO' | 'PO' | 'PSO';
    outcomeCode: string;
    target: number;
    actual: number | null;
    gap: number | null;
    studentsIdentified: number | null;
    recommendation: unknown;
    weakness: unknown;
    departmentId: number | null;
  },
) {
  const open = await db('continuous_improvement_cycles')
    .where({
      college_id: actor.collegeId,
      course_id: payload.courseId,
      kind: payload.kind,
      outcome_code: payload.outcomeCode,
    })
    .whereNotIn('state', ['CLOSED', 'APPROVED'])
    .first();
  if (open) return Number(open.id);
  const ids = await db('continuous_improvement_cycles').insert({
    college_id: actor.collegeId,
    created_by: actor.facultyUserId,
    department_id: payload.departmentId,
    course_id: payload.courseId,
    run_id: payload.runId,
    result_id: payload.resultId,
    kind: payload.kind,
    outcome_code: payload.outcomeCode,
    state: 'FACULTY_REVIEW_REQUIRED',
    target: payload.target,
    actual: payload.actual,
    gap: payload.gap,
    students_identified: payload.studentsIdentified,
    recommendation_json: JSON.stringify(payload.recommendation),
    weakness_json: JSON.stringify(payload.weakness),
    suggested_root_cause: (payload.recommendation as { causes?: Array<{ code: string }> })?.causes?.[0]?.code ?? null,
  });
  return Number(ids[0]);
}

export async function serializeRun(runId: number, collegeId: number) {
  const run = await db('attainment_runs as r')
    .leftJoin('courses as c', 'c.id', 'r.course_id')
    .leftJoin('faculty_users as f', 'f.id', 'r.created_by')
    .leftJoin('academic_years as ay', 'ay.id', 'r.academic_year_id')
    .leftJoin('programs as p', 'p.id', 'r.program_id')
    .leftJoin('semesters as s', 's.id', 'r.semester_id')
    .where({ 'r.id': runId, 'r.college_id': collegeId })
    .select(
      'r.*',
      'c.code as courseCode',
      'c.name as courseName',
      'f.name as facultyName',
      'ay.label as academicYearLabel',
      'p.name as programName',
      's.label as semesterLabel',
    )
    .first();
  if (!run) throw new AppError(404, 'Attainment run not found');
  const cos = await db('co_attainment_results').where({ run_id: runId }).orderBy('co_code');
  const po = await db('po_attainment_results').where({ run_id: runId }).orderBy('po_code');
  const pso = await db('pso_attainment_results').where({ run_id: runId }).orderBy('pso_code');
  const weights = await db('see_co_weights').where({ run_id: runId });
  return {
    run: {
      id: Number(run.id),
      status: run.status,
      courseId: Number(run.course_id),
      courseCode: run.courseCode,
      courseName: run.courseName,
      facultyName: run.facultyName,
      academicYearLabel: run.academicYearLabel,
      programName: run.programName,
      semesterLabel: run.semesterLabel,
      formulaVersion: run.formula_version,
      policy: parseJson(run.policy_snapshot, SKILLONX_STANDARD_V1),
      seeMethod: run.see_method,
      seeConfidence: run.see_confidence,
      seeEstimated: Boolean(run.see_estimated),
      calculatedAt: run.calculated_at,
      createdBy: Number(run.created_by),
    },
    cos: cos.map((c) => ({
      id: Number(c.id),
      coCode: c.co_code,
      statement: c.statement_snapshot,
      target: num(c.target),
      cie: num(c.cie_attainment),
      see: num(c.see_attainment),
      direct: num(c.direct_attainment),
      indirect: num(c.indirect_attainment),
      final: num(c.final_attainment),
      gap: num(c.gap),
      status: c.status,
      studentCount: Number(c.student_count),
      weakStudentCount: Number(c.weak_student_count),
      formula: parseJson(c.formula_json, {}),
      detail: parseJson(c.detail_json, {}),
    })),
    po: po.map((p) => ({
      poCode: p.po_code,
      target: num(p.target),
      attainment: num(p.attainment),
      gap: num(p.gap),
      status: p.status,
      contributing: parseJson(p.contributing_json, []),
      formula: p.formula,
    })),
    pso: pso.map((p) => ({
      psoCode: p.pso_code,
      target: num(p.target),
      attainment: num(p.attainment),
      gap: num(p.gap),
      status: p.status,
      contributing: parseJson(p.contributing_json, []),
      formula: p.formula,
    })),
    seeWeights: weights.map((w) => ({ coCode: w.co_code, marks: num(w.marks), weight: num(w.weight), method: w.method })),
  };
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getRunDetail(runId: number, collegeId: number, coCode?: string) {
  const detail = await serializeRun(runId, collegeId);
  if (!coCode) return detail;
  const co = detail.cos.find((c) => c.coCode.toUpperCase() === coCode.toUpperCase());
  if (!co) throw new AppError(404, 'CO result not found');
  const students = await db('co_attainment_students').where({ result_id: co.id }).orderBy('usn');
  const sources = await db('co_attainment_sources').where({ result_id: co.id });
  const steps = await db('attainment_calc_details').where({ result_id: co.id });
  const cycle = await db('continuous_improvement_cycles')
    .where({ college_id: collegeId, run_id: runId, outcome_code: co.coCode })
    .orderBy('id', 'desc')
    .first();
  return {
    ...detail,
    co: {
      ...co,
      students: students.map((s) => ({
        usn: s.usn,
        name: s.student_name,
        belowThreshold: Boolean(s.below_threshold),
        finalLevel: num(s.final_level),
        ciePercent: num(s.cie_percent),
        seePercent: num(s.see_percent),
      })),
      sources: sources.map((s) => ({
        sourceKind: s.source_kind,
        sourceLabel: s.source_label,
        category: s.category,
        weight: num(s.weight),
        attainment: num(s.attainment),
        studentCount: s.student_count,
        confidence: s.confidence,
        detail: parseJson(s.detail_json, null),
      })),
      steps: steps.map((s) => ({ step: s.step_key, formula: s.formula, output: num(s.output) })),
      cycleId: cycle ? Number(cycle.id) : null,
      cycleState: cycle?.state ?? null,
    },
  };
}

export async function listRuns(
  actor: AttainmentActor,
  filters: { courseId?: number; academicYearId?: number; status?: string },
) {
  const q = db('attainment_runs as r')
    .leftJoin('courses as c', 'c.id', 'r.course_id')
    .where({ 'r.college_id': actor.collegeId })
    .modify((qb) => {
      const owner = ownerFilter(actor);
      if (owner != null) qb.andWhere('r.created_by', owner);
      if (filters.courseId) qb.andWhere('r.course_id', filters.courseId);
      if (filters.academicYearId) qb.andWhere('r.academic_year_id', filters.academicYearId);
      if (filters.status) qb.andWhere('r.status', filters.status);
      if (actor.role === 'HOD' && actor.departmentId) {
        qb.andWhere((inner) => inner.where('r.department_id', actor.departmentId).orWhereNull('r.department_id'));
      }
    })
    .orderBy('r.calculated_at', 'desc')
    .select('r.id', 'r.status', 'r.see_method', 'r.see_confidence', 'r.see_estimated', 'r.formula_version', 'r.calculated_at', 'c.code as courseCode', 'c.name as courseName', 'r.course_id as courseId');
  const rows = (await q) as Array<{
    id: number;
    courseId: number;
    courseCode: string;
    courseName: string;
    status: string;
    see_method: string | null;
    see_confidence: string | null;
    see_estimated: number | boolean;
    formula_version: string;
    calculated_at: Date;
  }>;
  const runIds = rows.map((r) => r.id);
  const results = (
    runIds.length ? await db('co_attainment_results').whereIn('run_id', runIds) : []
  ) as Array<{ run_id: number; status: string; co_code: string }>;
  return {
    runs: rows.map((r) => {
      const cos = results
        .filter((c) => Number(c.run_id) === Number(r.id))
        .slice()
        .sort((a, b) => String(a.co_code).localeCompare(String(b.co_code), undefined, { numeric: true }));
      return {
        id: Number(r.id),
        courseId: Number(r.courseId),
        courseCode: r.courseCode,
        courseName: r.courseName,
        status: r.status,
        seeMethod: r.see_method,
        seeConfidence: r.see_confidence,
        seeEstimated: Boolean(r.see_estimated),
        formulaVersion: r.formula_version,
        calculatedAt: r.calculated_at,
        green: cos.filter((c) => c.status === 'GREEN').length,
        amber: cos.filter((c) => c.status === 'AMBER').length,
        red: cos.filter((c) => c.status === 'RED').length,
        coCount: cos.length,
        coStatuses: cos.map((c) => ({ coCode: String(c.co_code), status: String(c.status) })),
      };
    }),
  };
}

export async function dashboard(actor: AttainmentActor) {
  const { runs } = await listRuns(actor, { status: 'COMMITTED' });
  const latestByCourse = new Map<number, (typeof runs)[number]>();
  for (const run of runs) {
    if (!latestByCourse.has(run.courseId)) latestByCourse.set(run.courseId, run);
  }
  const cards = [...latestByCourse.values()];
  const cycles = (await db('continuous_improvement_cycles')
    .where({ college_id: actor.collegeId })
    .modify((q) => {
      const owner = ownerFilter(actor);
      if (owner != null) q.andWhere({ created_by: owner });
    })) as Array<{
    id: number;
    course_id: number;
    kind: string;
    outcome_code: string;
    state: string;
    target: number | null;
    actual: number | null;
    gap: number | null;
  }>;
  const evidenceRows = (
    cycles.length
      ? await db('improvement_evidence').whereIn(
          'cycle_id',
          cycles.map((c) => c.id),
        )
      : []
  ) as Array<{
    cycle_id: number;
    requirement_code: string;
    label: string;
    required: number | boolean;
    satisfied: number | boolean;
  }>;
  const completeness = cycles.map((c) => {
    const items = evidenceRows.filter((e) => Number(e.cycle_id) === Number(c.id));
    return evidenceCompleteness(
      items.map((i) => ({
        code: String(i.requirement_code),
        label: String(i.label),
        required: Boolean(i.required),
        satisfied: Boolean(i.satisfied),
      })),
    );
  });
  const avgEvidence =
    completeness.length === 0 ? 100 : Math.round(completeness.reduce((s, c) => s + c.percent, 0) / completeness.length);
  return {
    summary: {
      courses: cards.length,
      cosMonitored: cards.reduce((s, c) => s + c.coCount, 0),
      green: cards.reduce((s, c) => s + c.green, 0),
      amber: cards.reduce((s, c) => s + c.amber, 0),
      red: cards.reduce((s, c) => s + c.red, 0),
      openCycles: cycles.filter((c) => !['CLOSED', 'APPROVED'].includes(String(c.state))).length,
      awaitingReassessment: cycles.filter((c) => c.state === 'READY_FOR_REASSESSMENT').length,
      awaitingApproval: cycles.filter((c) => ['SUBMITTED_FOR_REVIEW', 'ACTION_PLANNED'].includes(String(c.state))).length,
      closedSuccessfully: cycles.filter((c) => c.state === 'CLOSED').length,
      evidenceCompleteness: avgEvidence,
    },
    courses: cards,
    cycles: cycles.slice(0, 20).map((c) => ({
      id: Number(c.id),
      courseId: Number(c.course_id),
      kind: c.kind,
      outcomeCode: c.outcome_code,
      state: c.state,
      target: num(c.target),
      actual: num(c.actual),
      gap: num(c.gap),
    })),
  };
}

export async function programmeHealth(actor: AttainmentActor) {
  const dash = await dashboard(actor);
  const po = await db('po_attainment_results as p')
    .join('attainment_runs as r', 'r.id', 'p.run_id')
    .where({ 'r.college_id': actor.collegeId, 'r.status': 'COMMITTED' })
    .orderBy('r.calculated_at', 'desc')
    .select('p.*', 'r.course_id as courseId');
  const latestPo = new Map<string, (typeof po)[number]>();
  for (const row of po) {
    const key = `${row.courseId}:${row.po_code}`;
    if (!latestPo.has(key)) latestPo.set(key, row);
  }
  return {
    ...dash,
    po: [...latestPo.values()].map((p) => ({
      courseId: Number(p.courseId),
      poCode: p.po_code,
      target: num(p.target),
      attainment: num(p.attainment),
      gap: num(p.gap),
      status: p.status,
    })),
  };
}

export async function getCycle(cycleId: number, collegeId: number) {
  const cycle = await db('continuous_improvement_cycles as x')
    .leftJoin('courses as c', 'c.id', 'x.course_id')
    .leftJoin('attainment_root_causes as rc', 'rc.id', 'x.root_cause_id')
    .where({ 'x.id': cycleId, 'x.college_id': collegeId })
    .select('x.*', 'c.code as courseCode', 'c.name as courseName', 'rc.code as rootCauseCode', 'rc.label as rootCauseLabel')
    .first();
  if (!cycle) throw new AppError(404, 'Improvement cycle not found');
  const actions = await db('improvement_actions').where({ cycle_id: cycleId });
  const evidence = await db('improvement_evidence').where({ cycle_id: cycleId });
  const approvals = await db('improvement_approvals').where({ cycle_id: cycleId }).orderBy('created_at', 'desc');
  const reassessments = await db('improvement_reassessments').where({ cycle_id: cycleId });
  const completeness = evidenceCompleteness(
    evidence.map((e) => ({
      code: String(e.requirement_code),
      label: String(e.label),
      required: Boolean(e.required),
      satisfied: Boolean(e.satisfied),
      autoLinked: Boolean(e.auto_linked),
      sourceKind: e.source_kind,
      sourceId: e.source_id ? Number(e.source_id) : null,
    })),
  );
  return {
    cycle: {
      id: Number(cycle.id),
      courseId: Number(cycle.course_id),
      courseCode: cycle.courseCode,
      courseName: cycle.courseName,
      kind: cycle.kind,
      outcomeCode: cycle.outcome_code,
      state: cycle.state,
      target: num(cycle.target),
      actual: num(cycle.actual),
      gap: num(cycle.gap),
      previousAttainment: num(cycle.previous_attainment),
      revisedAttainment: num(cycle.revised_attainment),
      improvement: num(cycle.improvement),
      studentsIdentified: cycle.students_identified,
      rootCauseCode: cycle.rootCauseCode,
      rootCauseLabel: cycle.rootCauseLabel,
      rootCauseOther: cycle.root_cause_other,
      suggestedRootCause: cycle.suggested_root_cause,
      facultyNotes: cycle.faculty_notes,
      recommendation: parseJson(cycle.recommendation_json, null),
      weakness: parseJson(cycle.weakness_json, null),
      createdBy: Number(cycle.created_by),
    },
    actions: actions.map((a) => ({
      id: Number(a.id),
      code: a.action_code,
      label: a.label,
      planned: Boolean(a.planned),
      implemented: Boolean(a.implemented),
      date: a.activity_date,
      duration: a.duration,
      studentsBenefited: a.students_benefited,
    })),
    evidence: completeness,
    approvals: approvals.map((a) => ({
      from: a.from_state,
      to: a.to_state,
      decision: a.decision,
      comment: a.comment,
      createdAt: a.created_at,
    })),
    reassessments,
  };
}

export const planSchema = z.object({
  rootCauseCode: z.string().min(1),
  rootCauseOther: z.string().max(2000).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  actions: z.array(z.object({ code: z.string(), label: z.string().optional() })).min(1),
});

export async function acceptPlan(actor: AttainmentActor, cycleId: number, body: z.infer<typeof planSchema>) {
  const cycle = await db('continuous_improvement_cycles').where({ id: cycleId, college_id: actor.collegeId }).first();
  if (!cycle) throw new AppError(404, 'Improvement cycle not found');
  if (['CLOSED', 'APPROVED'].includes(String(cycle.state))) throw new AppError(409, 'Closed records cannot be modified');
  assertTransition(cycle.state as CiState, 'ACTION_PLANNED');
  if (body.rootCauseCode === 'OTHER' && !String(body.rootCauseOther || '').trim()) {
    throw new AppError(422, 'Justification is mandatory when choosing Other as the root cause.');
  }
  const cause = await db('attainment_root_causes').where({ code: body.rootCauseCode }).first();
  await db('improvement_actions').where({ cycle_id: cycleId }).del();
  await db('improvement_evidence').where({ cycle_id: cycleId }).del();
  for (const action of body.actions) {
    const master = await db('attainment_corrective_actions').where({ code: action.code }).first();
    const ids = await db('improvement_actions').insert({
      cycle_id: cycleId,
      action_id: master?.id ?? null,
      action_code: action.code,
      label: action.label || master?.label || action.code,
      planned: true,
    });
    const profile = (master?.evidence_profile || ACTIONS.find((a) => a.code === action.code)?.evidenceProfile || 'REMEDIAL') as string;
    const templates = EVIDENCE_TEMPLATES.filter((t) => t.actionProfile === profile);
    const auto = await autoLinkEvidence(actor, cycle, action.code);
    for (const tpl of templates) {
      const linked = auto.find((a) => a.code === tpl.code);
      await db('improvement_evidence').insert({
        cycle_id: cycleId,
        action_row_id: Number(ids[0]),
        requirement_code: tpl.code,
        label: tpl.label,
        required: tpl.required,
        satisfied: Boolean(linked),
        auto_linked: Boolean(linked),
        source_kind: linked?.sourceKind ?? tpl.autoLinkSource ?? null,
        source_id: linked?.sourceId ?? null,
      });
    }
  }
  await db('continuous_improvement_cycles').where({ id: cycleId }).update({
    state: 'ACTION_PLANNED',
    root_cause_id: cause?.id ?? null,
    root_cause_other: body.rootCauseOther ?? null,
    faculty_notes: body.notes ?? null,
    updated_at: db.fn.now(),
  });
  await db('improvement_approvals').insert({
    cycle_id: cycleId,
    from_state: cycle.state,
    to_state: 'ACTION_PLANNED',
    actor_id: actor.facultyUserId,
    actor_role: actor.role,
    decision: 'PLAN_ACCEPTED',
  });
  return getCycle(cycleId, actor.collegeId);
}

async function autoLinkEvidence(actor: AttainmentActor, cycle: Record<string, unknown>, _actionCode: string) {
  const linked: EvidenceItem[] = [];
  const courseId = Number(cycle.course_id);
  const quizzes = await db('quizzes').where({ college_id: actor.collegeId, course_id: courseId }).whereNull('deleted_at').limit(1);
  if (quizzes[0]) linked.push({ code: 'INSTRUMENT', label: 'Quiz', required: true, satisfied: true, autoLinked: true, sourceKind: 'QUIZ', sourceId: Number(quizzes[0].id) });
  const assignments = await db('assignments').where({ college_id: actor.collegeId, course_id: courseId }).whereNull('deleted_at').limit(1);
  if (assignments[0]) {
    linked.push({ code: 'ASSIGNMENT', label: 'Assignment', required: true, satisfied: true, autoLinked: true, sourceKind: 'ASSIGNMENT', sourceId: Number(assignments[0].id) });
    linked.push({ code: 'EVALUATION', label: 'Evaluation', required: true, satisfied: true, autoLinked: true, sourceKind: 'ASSIGNMENT', sourceId: Number(assignments[0].id) });
    linked.push({ code: 'RESULT', label: 'Result', required: true, satisfied: true, autoLinked: true, sourceKind: 'ASSIGNMENT', sourceId: Number(assignments[0].id) });
    linked.push({ code: 'RUBRIC', label: 'Rubric', required: true, satisfied: true, autoLinked: true, sourceKind: 'ASSIGNMENT_SCHEME', sourceId: Number(assignments[0].id) });
  }
  const papers = await db('internal_question_papers').where({ college_id: actor.collegeId, course_id: courseId }).limit(1);
  if (papers[0]) linked.push({ code: 'LEARNING_MATERIAL', label: 'Internal question paper', required: true, satisfied: true, autoLinked: true, sourceKind: 'INTERNAL_PAPER', sourceId: Number(papers[0].id) });
  const plans = await db('faculty_lesson_plans').where({ college_id: actor.collegeId, course_id: courseId }).limit(1);
  if (plans[0]) linked.push({ code: 'LEARNING_MATERIAL', label: 'Lesson plan', required: true, satisfied: true, autoLinked: true, sourceKind: 'LESSON_PLAN', sourceId: Number(plans[0].id) });
  linked.push({
    code: 'STUDENT_LIST',
    label: 'Identified students',
    required: true,
    satisfied: true,
    autoLinked: true,
    sourceKind: 'WEAK_STUDENTS',
    sourceId: Number(cycle.id),
  });
  linked.push({
    code: 'FACULTY',
    label: 'Faculty',
    required: true,
    satisfied: true,
    autoLinked: true,
    sourceKind: 'CYCLE_OWNER',
    sourceId: actor.facultyUserId,
  });
  return linked;
}

export async function transitionCycle(
  actor: AttainmentActor,
  cycleId: number,
  requested: CiState,
  comment?: string,
) {
  const cycle = await db('continuous_improvement_cycles').where({ id: cycleId, college_id: actor.collegeId }).first();
  if (!cycle) throw new AppError(404, 'Improvement cycle not found');
  if (String(cycle.state) === 'CLOSED' && requested !== 'REOPENED') {
    throw new AppError(409, 'Closed records cannot be silently modified');
  }
  let to = requested;
  assertTransition(cycle.state as CiState, to);
  if (requiresIndependentReview(requested)) {
    if (!canApproveClosure(actor, { createdBy: Number(cycle.created_by) }) && to !== 'REOPENED') {
      if (!(reviewerRoles(actor.role) && actor.facultyUserId !== Number(cycle.created_by))) {
        throw new AppError(403, 'Independent review is required. Faculty cannot close their own cycle.');
      }
    }
    if (to === 'CLOSED' || to === 'APPROVED') {
      if (!canApproveClosure(actor, { createdBy: Number(cycle.created_by) })) {
        throw new AppError(403, 'Independent review is required. Faculty cannot close their own cycle.');
      }
    }
  }
  if (to === 'READY_FOR_REASSESSMENT' || to === 'IMPLEMENTED') {
    const evidence = await db('improvement_evidence').where({ cycle_id: cycleId });
    const completeness = evidenceCompleteness(
      evidence.map((e) => ({
        code: String(e.requirement_code),
        label: String(e.label),
        required: Boolean(e.required),
        satisfied: Boolean(e.satisfied),
      })),
    );
    if (to === 'IMPLEMENTED') {
      to = nextAfterImplemented(completeness.complete);
    }
  }
  if (to === 'REASSESSED') {
    const reassess = await db('improvement_reassessments').where({ cycle_id: cycleId }).first();
    if (!reassess) throw new AppError(422, 'Reassessment is mandatory before this cycle can move forward.');
    const achieved = Number(reassess.revised_attainment) >= Number(cycle.target);
    to = nextAfterReassessed(achieved);
    await db('continuous_improvement_cycles').where({ id: cycleId }).update({
      revised_attainment: reassess.revised_attainment,
      previous_attainment: cycle.actual,
      improvement: improvementDelta(num(reassess.revised_attainment), num(cycle.actual)),
    });
  }
  await db('continuous_improvement_cycles').where({ id: cycleId }).update({
    state: to,
    closed_by: to === 'CLOSED' ? actor.facultyUserId : cycle.closed_by,
    closed_at: to === 'CLOSED' ? db.fn.now() : cycle.closed_at,
    updated_at: db.fn.now(),
  });
  await db('improvement_approvals').insert({
    cycle_id: cycleId,
    from_state: cycle.state,
    to_state: to,
    actor_id: actor.facultyUserId,
    actor_role: actor.role,
    decision: to === 'FACULTY_REVIEW_REQUIRED' ? 'REJECTED' : 'ADVANCED',
    comment: comment ?? null,
  });
  await recordAttainmentAudit({
    collegeId: actor.collegeId,
    cycleId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: `CYCLE_${to}`,
  });
  return getCycle(cycleId, actor.collegeId);
}

export const evidencePatchSchema = z.object({
  requirementCode: z.string(),
  satisfied: z.boolean(),
  note: z.string().max(2000).optional().nullable(),
  sourceKind: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
});

export async function patchEvidence(actor: AttainmentActor, cycleId: number, body: z.infer<typeof evidencePatchSchema>) {
  const cycle = await db('continuous_improvement_cycles').where({ id: cycleId, college_id: actor.collegeId }).first();
  if (!cycle) throw new AppError(404, 'Improvement cycle not found');
  if (['CLOSED', 'APPROVED'].includes(String(cycle.state))) throw new AppError(409, 'Closed records cannot be modified');
  await db('improvement_evidence')
    .where({ cycle_id: cycleId, requirement_code: body.requirementCode })
    .update({
      satisfied: body.satisfied,
      note: body.note ?? null,
      source_kind: body.sourceKind ?? undefined,
      source_id: body.sourceId ?? undefined,
      updated_at: db.fn.now(),
    });
  return getCycle(cycleId, actor.collegeId);
}

export const reassessSchema = z.object({
  sourceKind: z.enum(['QUIZ', 'ASSIGNMENT', 'INTERNAL_PAPER', 'REASSESSMENT']),
  sourceId: z.number().int().positive(),
  revisedAttainment: z.number(),
});

export async function recordReassessment(actor: AttainmentActor, cycleId: number, body: z.infer<typeof reassessSchema>) {
  const cycle = await db('continuous_improvement_cycles').where({ id: cycleId, college_id: actor.collegeId }).first();
  if (!cycle) throw new AppError(404, 'Improvement cycle not found');
  await db('improvement_reassessments').insert({
    cycle_id: cycleId,
    source_kind: body.sourceKind,
    source_id: body.sourceId,
    co_code: cycle.outcome_code,
    revised_attainment: body.revisedAttainment,
    completed_at: db.fn.now(),
  });
  await db('improvement_evidence')
    .where({ cycle_id: cycleId })
    .whereIn('requirement_code', ['REASSESSMENT_RESULT', 'RESULT', 'MARKS'])
    .update({ satisfied: true, auto_linked: true, source_kind: body.sourceKind, source_id: String(body.sourceId) });
  return getCycle(cycleId, actor.collegeId);
}

export async function nba811(actor: AttainmentActor, courseId?: number) {
  const q = db('continuous_improvement_cycles as x')
    .leftJoin('courses as c', 'c.id', 'x.course_id')
    .where({ 'x.college_id': actor.collegeId, 'x.kind': 'CO' })
    .modify((qb) => {
      const owner = ownerFilter(actor);
      if (owner != null) qb.andWhere('x.created_by', owner);
      if (courseId) qb.andWhere('x.course_id', courseId);
    })
    .select('x.*', 'c.code as courseCode', 'c.name as courseName');
  const rows = (await q) as Array<{
    id: number;
    courseCode: string | null;
    courseName: string | null;
    outcome_code: string;
    target: number | null;
    actual: number | null;
    gap: number | null;
    suggested_root_cause: string | null;
    students_identified: number | null;
    revised_attainment: number | null;
    improvement: number | null;
  }>;
  const actions = (
    rows.length ? await db('improvement_actions').whereIn('cycle_id', rows.map((r) => r.id)) : []
  ) as Array<{
    cycle_id: number;
    planned: number | boolean;
    implemented: number | boolean;
    label: string;
    students_benefited: number | null;
    activity_date: string | null;
    duration: string | null;
  }>;
  const evidence = (
    rows.length ? await db('improvement_evidence').whereIn('cycle_id', rows.map((r) => r.id)) : []
  ) as Array<{
    cycle_id: number;
    requirement_code: string;
    label: string;
    required: number | boolean;
    satisfied: number | boolean;
  }>;
  return {
    rows: rows.map((r, i) => {
      const planned = actions.filter((a) => Number(a.cycle_id) === Number(r.id) && a.planned);
      const implemented = actions.filter((a) => Number(a.cycle_id) === Number(r.id) && a.implemented);
      const ev = evidence.filter((e) => Number(e.cycle_id) === Number(r.id));
      const completeness = evidenceCompleteness(
        ev.map((e) => ({
          code: String(e.requirement_code),
          label: String(e.label),
          required: Boolean(e.required),
          satisfied: Boolean(e.satisfied),
        })),
      );
      return {
        slNo: i + 1,
        course: `${r.courseCode} ${r.courseName}`,
        co: r.outcome_code,
        target: num(r.target),
        actual: num(r.actual),
        gap: num(r.gap),
        rootCause: r.suggested_root_cause,
        actionPlanned: planned.map((a) => a.label).join('; '),
        actionImplemented: implemented.map((a) => a.label).join('; '),
        studentsBenefited: implemented.reduce((s, a) => s + Number(a.students_benefited || 0), 0) || r.students_identified,
        evidence: `${completeness.requiredSatisfied}/${completeness.requiredTotal}`,
        evidenceComplete: completeness.complete,
        revisedAttainment: num(r.revised_attainment),
        improvement: num(r.improvement),
        dateDuration: implemented.map((a) => [a.activity_date, a.duration].filter(Boolean).join(' ')).join('; '),
        cycleId: Number(r.id),
      };
    }),
  };
}

export async function nba812(actor: AttainmentActor) {
  const rows = (await db('continuous_improvement_cycles as x')
    .where({ 'x.college_id': actor.collegeId })
    .whereIn('x.kind', ['PO', 'PSO'])
    .modify((q) => {
      const owner = ownerFilter(actor);
      if (owner != null) q.andWhere('x.created_by', owner);
    })) as Array<{
    id: number;
    outcome_code: string;
    previous_attainment: number | null;
    actual: number | null;
    target: number | null;
    gap: number | null;
    suggested_root_cause: string | null;
    revised_attainment: number | null;
    improvement: number | null;
    state: string;
  }>;
  const actions = (
    rows.length ? await db('improvement_actions').whereIn('cycle_id', rows.map((r) => r.id)) : []
  ) as Array<{ cycle_id: number; planned: number | boolean; implemented: number | boolean; label: string }>;
  return {
    rows: rows.map((r) => ({
      poPso: r.outcome_code,
      previousAttainment: num(r.previous_attainment) ?? num(r.actual),
      target: num(r.target),
      gap: num(r.gap),
      rootCause: r.suggested_root_cause,
      actionPlanned: actions.filter((a) => Number(a.cycle_id) === Number(r.id) && a.planned).map((a) => a.label).join('; '),
      actionImplemented: actions.filter((a) => Number(a.cycle_id) === Number(r.id) && a.implemented).map((a) => a.label).join('; '),
      evidence: r.state,
      revisedAttainment: num(r.revised_attainment),
      improvement: num(r.improvement),
      cycleId: Number(r.id),
    })),
  };
}

export async function listLibraries() {
  await ensureAcademicStandardAndLibraries();
  const [causes, actions, po] = await Promise.all([
    db('attainment_root_causes').where({ is_active: true }).orderBy('category'),
    db('attainment_corrective_actions').where({ is_active: true }).orderBy('category'),
    db('attainment_po_action_recs').orderBy('po_code'),
  ]);
  return { causes, actions, poRecommendations: po };
}

export const surveyLinksSchema = z.object({
  links: z.array(
    z.object({
      questionId: z.number().int().positive(),
      coCode: z.string().min(1).max(32),
      approved: z.boolean().optional().default(true),
    }),
  ),
});

export async function getSurveyIndirectLinks(actor: AttainmentActor, surveyId: number) {
  const { assertSurveyAccessForActor } = await import('../surveys/access.js');
  await assertSurveyAccessForActor(surveyId, actor);
  const survey = await db('surveys').where({ id: surveyId, college_id: actor.collegeId }).whereNull('deleted_at').first();
  if (!survey) throw new AppError(404, 'Survey not found');
  const questions = await db('questions').where({ survey_id: surveyId }).orderBy('sort_order');
  const links = (await db.schema.hasTable('survey_question_co_links'))
    ? await db('survey_question_co_links').where({ survey_id: surveyId, college_id: actor.collegeId })
    : [];
  const outcomes = survey.course_id
    ? await db('course_outcomes').where({ college_id: actor.collegeId, course_id: survey.course_id, is_current: true }).orderBy('co_code')
    : [];
  return {
    surveyId,
    courseId: survey.course_id ? Number(survey.course_id) : null,
    courseBound: Boolean(survey.course_id),
    outcomes: outcomes.map((o) => ({ coCode: String(o.co_code), statement: o.statement })),
    questions: questions.map((q) => ({
      id: Number(q.id),
      prompt: String(q.prompt),
      questionType: String(q.question_type),
      coCodes: links.filter((l) => Number(l.question_id) === Number(q.id)).map((l) => String(l.co_code)),
      approved: links.some((l) => Number(l.question_id) === Number(q.id) && l.approved),
    })),
  };
}

export async function saveSurveyIndirectLinks(
  actor: AttainmentActor,
  surveyId: number,
  body: z.infer<typeof surveyLinksSchema>,
) {
  const { assertSurveyAccessForActor } = await import('../surveys/access.js');
  await assertSurveyAccessForActor(surveyId, actor);
  if (!(await db.schema.hasTable('survey_question_co_links'))) {
    throw new AppError(503, 'Survey CO links are not migrated yet');
  }
  const survey = await db('surveys').where({ id: surveyId, college_id: actor.collegeId }).whereNull('deleted_at').first();
  if (!survey) throw new AppError(404, 'Survey not found');
  if (!survey.course_id) {
    throw new AppError(422, 'Link this survey to a course before mapping questions to COs.');
  }
  const questionIds = new Set(
    (await db('questions').where({ survey_id: surveyId }).select('id')).map((q) => Number(q.id)),
  );
  for (const link of body.links) {
    if (!questionIds.has(link.questionId)) throw new AppError(404, 'Question not found on this survey');
  }
  await db('survey_question_co_links').where({ survey_id: surveyId, college_id: actor.collegeId }).del();
  if (body.links.length) {
    await db('survey_question_co_links').insert(
      body.links.map((l) => ({
        college_id: actor.collegeId,
        survey_id: surveyId,
        question_id: l.questionId,
        co_code: l.coCode.trim().toUpperCase(),
        approved: l.approved !== false,
        approved_by: l.approved !== false ? actor.facultyUserId : null,
      })),
    );
  }
  await recordAttainmentAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'SURVEY_CO_LINKS_UPDATED',
    metadata: { surveyId, count: body.links.length },
  });
  return getSurveyIndirectLinks(actor, surveyId);
}
