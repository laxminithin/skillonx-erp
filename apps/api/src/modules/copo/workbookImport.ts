import { nanoid } from 'nanoid';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { writeCopoAudit } from './audit.js';
import type { CopoActor } from './access.js';
import { currentPoFramework } from './helpers.js';
import { reconcileSubject, type CourseRef } from './reconcile.js';
import {
  normalizeSchemeCode,
  parseCopoWorkbook,
  programCodeFromName,
  type ParsedCo,
  type ParsedCoPsoMapping,
  type ParsedCoSdgMapping,
  type ParsedMapping,
  type ParsedPo,
  type ParsedPso,
  type ParsedSdg,
  type ParsedSubject,
  type WorkbookParseResult,
} from './workbookParser.js';

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function statementsDiffer(a: string, b: string) {
  return a.trim().replace(/\s+/g, ' ') !== b.trim().replace(/\s+/g, ' ');
}

function poNumber(code: string) {
  const n = Number(String(code).replace(/\D+/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function coNumber(code: string) {
  const n = Number(String(code).replace(/\D+/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export type WorkbookPreview = {
  batchId: string;
  fileName: string;
  summary: {
    subjectsInFile: number;
    existingSubjectsMatched: number;
    newSubjects: number;
    officialCos: number;
    newCos: number;
    existingCosMatched: number;
    coDifferences: number;
    pos: number;
    newPos: number;
    poDifferences: number;
    mappingRelationships: number;
    newMappings: number;
    changedMappings: number;
    psos: number;
    coPsoMappings: number;
    sdgs: number;
    coSdgMappings: number;
    warnings: number;
    errors: number;
    importReadySubjects: number;
    notImportReadySubjects: number;
    courseCodeConflicts: number;
    schemeConflicts: number;
    ambiguous: number;
  };
  warnings: string[];
  errors: string[];
  subjects: Array<{
    code: string;
    name: string;
    scheme: string;
    program: string;
    importReady: boolean;
    matchStatus: string;
    courseId: number | null;
    existingName: string | null;
    existingCode: string | null;
    conflict?: { existing: { name: string; code: string; scheme: string | null }; mapper: { name: string; code: string; scheme: string } };
    outcomes: Array<{
      code: string;
      status: 'NEW' | 'UNCHANGED' | 'CHANGED' | 'SKIPPED_NOT_READY';
      existingStatement?: string;
      importedStatement?: string;
    }>;
  }>;
  programOutcomes: Array<{
    code: string;
    scheme: string;
    status: 'NEW' | 'UNCHANGED' | 'CHANGED';
    existingStatement?: string;
    importedStatement?: string;
  }>;
};

function importableSubjects(parsed: WorkbookParseResult) {
  return parsed.subjects.filter((s) => s.importReady && s.verificationStatus === 'VERIFIED');
}

async function loadCollegeCourses(collegeId: number, trx: typeof db = db): Promise<CourseRef[]> {
  const rows = await trx('courses as c')
    .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
    .where('c.college_id', collegeId)
    .select('c.id', 'c.name', 'c.code', 'c.scheme_id', 's.code as scheme_code');
  return rows.map((c) => ({
    id: Number(c.id),
    name: String(c.name),
    code: String(c.code),
    schemeId: c.scheme_id != null ? Number(c.scheme_id) : null,
    schemeCode: c.scheme_code ? String(c.scheme_code) : null,
  }));
}

export async function previewWorkbookImport(
  collegeId: number,
  actor: CopoActor,
  buffer: Buffer,
  fileName: string,
) {
  const parsed = await parseCopoWorkbook(buffer);
  const ready = importableSubjects(parsed);

  let newSubjects = 0;
  let matchedSubjects = 0;
  let newCos = 0;
  let existingCosMatched = 0;
  let coDifferences = 0;
  let newPos = 0;
  let poDifferences = 0;
  let newMappings = 0;
  let changedMappings = 0;
  let courseCodeConflicts = 0;
  let schemeConflicts = 0;
  let ambiguous = 0;

  const courses = await loadCollegeCourses(collegeId);
  const subjectPreview = [];
  for (const subject of parsed.subjects) {
    const rec = reconcileSubject(
      { name: subject.name, code: subject.code, scheme: subject.scheme, aliasName: subject.slidesSubject },
      courses,
    );
    if (rec.status === 'NEW') newSubjects += 1;
    else if (rec.status === 'AMBIGUOUS') ambiguous += 1;
    else if (rec.status === 'COURSE_CODE_CONFLICT') {
      courseCodeConflicts += 1;
      parsed.warnings.push(
        `COURSE CODE CONFLICT ${subject.name}: existing ${rec.existing?.code} vs mapper ${subject.code}`,
      );
    } else if (rec.status === 'SCHEME_CONFLICT') {
      schemeConflicts += 1;
      parsed.warnings.push(`SCHEME CONFLICT ${subject.code}: existing ${rec.existing?.scheme} vs mapper ${subject.scheme}`);
    } else matchedSubjects += 1;

    const match = rec.course;
    const existingCos = match
      ? await db('course_outcomes').where({ college_id: collegeId, course_id: match.id, is_current: true })
      : [];
    const fileCos = parsed.outcomes.filter((c) => c.subjectCode === subject.code && c.scheme === subject.scheme);
    const outcomes = fileCos.map((co) => {
      const existing = existingCos.find((row) => String(row.co_code).toUpperCase() === co.coCode);
      if (!existing) {
        newCos += 1;
        return { code: co.coCode, status: 'NEW' as const, importedStatement: co.statement };
      }
      if (statementsDiffer(String(existing.statement), co.statement)) {
        coDifferences += 1;
        return {
          code: co.coCode,
          status: 'CHANGED' as const,
          existingStatement: String(existing.statement),
          importedStatement: co.statement,
        };
      }
      existingCosMatched += 1;
      return { code: co.coCode, status: 'UNCHANGED' as const, existingStatement: String(existing.statement) };
    });

    subjectPreview.push({
      code: normalizeCode(subject.code),
      name: subject.name,
      scheme: subject.scheme,
      program: subject.program,
      importReady: subject.importReady && subject.verificationStatus === 'VERIFIED',
      matchStatus: rec.status,
      courseId: match ? Number(match.id) : null,
      existingName: match?.name ?? null,
      existingCode: match?.code ?? null,
      conflict:
        rec.status === 'COURSE_CODE_CONFLICT' || rec.status === 'SCHEME_CONFLICT'
          ? { existing: rec.existing!, mapper: rec.mapper }
          : undefined,
      outcomes,
    });
  }

  const poPreview = [];
  for (const po of parsed.programOutcomes) {
    const schemeCode = normalizeSchemeCode(po.scheme);
    const scheme = await db('academic_schemes').where({ college_id: collegeId, code: schemeCode }).first();
    if (!scheme || po.status !== 'VERIFIED') {
      poPreview.push({
        code: po.poCode,
        scheme: po.scheme,
        status: 'NEW' as const,
        importedStatement: po.statement ?? undefined,
      });
      if (po.status === 'VERIFIED') newPos += 1;
      continue;
    }
    const framework = await currentPoFramework(collegeId, Number(scheme.id), null);
    const existing = framework
      ? await db('program_outcomes')
          .where({ college_id: collegeId, framework_version_id: framework.id, po_code: po.poCode, status: 'ACTIVE' })
          .first()
      : null;
    if (!existing) {
      newPos += 1;
      poPreview.push({ code: po.poCode, scheme: po.scheme, status: 'NEW' as const, importedStatement: po.statement ?? undefined });
      continue;
    }
    if (po.statement && statementsDiffer(String(existing.official_statement || ''), po.statement)) {
      poDifferences += 1;
      poPreview.push({
        code: po.poCode,
        scheme: po.scheme,
        status: 'CHANGED' as const,
        existingStatement: String(existing.official_statement || ''),
        importedStatement: po.statement,
      });
    } else {
      poPreview.push({ code: po.poCode, scheme: po.scheme, status: 'UNCHANGED' as const, existingStatement: String(existing.official_statement || '') });
    }
  }

  for (const mapping of parsed.mappings) {
    const subject = ready.find((s) => s.code === mapping.subjectCode && s.scheme === mapping.scheme);
    if (!subject) continue;
    newMappings += 1;
  }
  void changedMappings;

  const preview: WorkbookPreview = {
    batchId: nanoid(12),
    fileName,
    summary: {
      subjectsInFile: parsed.subjects.length,
      existingSubjectsMatched: matchedSubjects,
      newSubjects,
      officialCos: parsed.outcomes.length,
      newCos,
      existingCosMatched,
      coDifferences,
      pos: parsed.programOutcomes.length,
      newPos,
      poDifferences,
      mappingRelationships: parsed.mappings.length,
      newMappings,
      changedMappings,
      psos: parsed.programSpecificOutcomes.length,
      coPsoMappings: parsed.coPsoMappings.length,
      sdgs: parsed.sdgs.length,
      coSdgMappings: parsed.coSdgMappings.length,
      warnings: parsed.warnings.length,
      errors: parsed.errors.length,
      importReadySubjects: ready.length,
      notImportReadySubjects: parsed.subjects.length - ready.length,
      courseCodeConflicts,
      schemeConflicts,
      ambiguous,
    },
    warnings: parsed.warnings,
    errors: parsed.errors,
    subjects: subjectPreview,
    programOutcomes: poPreview,
  };

  await db('syllabus_import_batches').insert({
    college_id: collegeId,
    batch_id: preview.batchId,
    source_file: fileName,
    payload: JSON.stringify({ kind: 'VTU_CO_PO_MASTER', parsed, fileName }),
    preview: JSON.stringify(preview),
    status: 'PREVIEWED',
    dry_run: true,
    imported_by: actor.facultyUserId,
  });

  return preview;
}

type Resolution = { courseId: number; coCode: string; action: 'KEEP_EXISTING' | 'CREATE_NEW_VERSION' | 'REVIEW_LATER' };

async function ensureScheme(trx: typeof db, collegeId: number, subject: ParsedSubject) {
  const code = normalizeSchemeCode(subject.scheme);
  let scheme = await trx('academic_schemes').where({ college_id: collegeId, code }).first();
  if (!scheme) {
    const [id] = await trx('academic_schemes').insert({
      college_id: collegeId,
      name: `VTU ${subject.scheme} Scheme`,
      code,
      university: 'Visvesvaraya Technological University',
      start_year: Number(subject.scheme) || null,
      status: 'ACTIVE',
    });
    scheme = await trx('academic_schemes').where({ id }).first();
  }
  return scheme;
}

async function ensureProgram(trx: typeof db, collegeId: number, schemeId: number, programName: string) {
  const code = programCodeFromName(programName);
  let program = await trx('programs').where({ college_id: collegeId, code }).first();
  if (!program) {
    const [id] = await trx('programs').insert({
      college_id: collegeId,
      name: programName.trim(),
      code,
      scheme_id: schemeId,
      degree: code === 'MBA' ? 'MBA' : 'B.E.',
      status: 'ACTIVE',
    });
    program = await trx('programs').where({ id }).first();
  }
  await trx('scheme_programs')
    .insert({ college_id: collegeId, scheme_id: schemeId, program_id: program.id, status: 'ACTIVE' })
    .onConflict(['scheme_id', 'program_id'])
    .ignore();
  return program;
}

async function importSubjectBundle(
  trx: typeof db,
  collegeId: number,
  actor: CopoActor,
  subject: ParsedSubject,
  outcomes: ParsedCo[],
  mappings: ParsedMapping[],
  sources: WorkbookParseResult['sources'],
  pos: ParsedPo[],
  resolutions: Map<string, Resolution['action']>,
) {
  const scheme = await ensureScheme(trx, collegeId, subject);
  const program = await ensureProgram(trx, collegeId, Number(scheme.id), subject.program);
  const courses = await loadCollegeCourses(collegeId, trx);
  const rec = reconcileSubject(
    { name: subject.name, code: subject.code, scheme: subject.scheme, aliasName: subject.slidesSubject },
    courses,
  );
  if (rec.status === 'AMBIGUOUS') {
    return { skipped: true, createdCos: 0, unchangedCos: 0, createdMappings: 0, unchangedMappings: 0, createdSubject: false };
  }
  let course = rec.course ? await trx('courses').where({ id: rec.course.id, college_id: collegeId }).first() : null;
  let createdSubject = false;
  if (!course) {
    let semesterId = null;
    if (subject.semester) {
      const sem = await trx('semesters').where({ college_id: collegeId, number: subject.semester }).first();
      semesterId = sem?.id ?? null;
    }
    const [courseId] = await trx('courses').insert({
      college_id: collegeId,
      code: normalizeCode(subject.code),
      name: subject.name.trim(),
      scheme_id: scheme.id,
      semester_id: semesterId,
      course_type: subject.courseType ?? null,
      lecture_hours: subject.lectureHours ?? null,
      tutorial_hours: subject.tutorialHours ?? null,
      practical_hours: subject.practicalHours ?? null,
      credits: subject.credits ?? null,
      status: 'ACTIVE',
    });
    course = await trx('courses').where({ id: courseId }).first();
    createdSubject = true;
  } else {
    const patch: Record<string, unknown> = { updated_at: trx.fn.now() };
    if (course.scheme_id == null) patch.scheme_id = scheme.id;
    if (course.semester_id == null && subject.semester) {
      const sem = await trx('semesters').where({ college_id: collegeId, number: subject.semester }).first();
      if (sem) patch.semester_id = sem.id;
    }
    if (course.course_type == null && subject.courseType) patch.course_type = subject.courseType;
    await trx('courses').where({ id: course.id }).update(patch);
    course = await trx('courses').where({ id: course.id }).first();
  }
  await trx('program_subjects')
    .insert({
      college_id: collegeId,
      program_id: program.id,
      course_id: course.id,
      scheme_id: scheme.id,
      semester_id: course.semester_id,
      status: 'ACTIVE',
    })
    .onConflict(['program_id', 'course_id'])
    .ignore();

  const source = sources.find((s) => s.subjectCode === subject.code && s.scheme === subject.scheme);
  if (source?.url) {
    const existingDoc = await trx('syllabus_documents')
      .where({ college_id: collegeId, course_id: course.id, external_url: source.url })
      .first();
    if (!existingDoc) {
      await trx('syllabus_documents').insert({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        course_id: course.id,
        title: source.document || `${subject.code} official syllabus`,
        source_label: source.sourceType || 'VTU_OFFICIAL_SYLLABUS',
        external_url: source.url,
        uploaded_by: actor.facultyUserId,
      });
    }
  }

  const verifiedPos = pos.filter((p) => p.status === 'VERIFIED' && normalizeSchemeCode(p.scheme) === normalizeSchemeCode(subject.scheme));
  let framework = await currentPoFramework(collegeId, Number(scheme.id), null, trx);
  if (!framework && verifiedPos.length) {
    const [fid] = await trx('program_outcome_versions').insert({
      college_id: collegeId,
      scheme_id: scheme.id,
      program_id: null,
      version_number: 1,
      label: 'Version 1',
      source: verifiedPos[0].source || 'NBA Graduate Attributes for UG Engineering',
      status: 'ACTIVE',
      created_by: actor.facultyUserId,
    });
    framework = await trx('program_outcome_versions').where({ id: fid }).first();
  }
  if (framework) {
    for (const po of verifiedPos) {
      const existingPo = await trx('program_outcomes')
        .where({ college_id: collegeId, framework_version_id: framework.id, po_code: po.poCode, status: 'ACTIVE' })
        .first();
      if (!existingPo) {
        await trx('program_outcomes').insert({
          college_id: collegeId,
          framework_version_id: framework.id,
          scheme_id: scheme.id,
          po_number: poNumber(po.poCode),
          po_code: po.poCode,
          short_title: po.title,
          official_statement: po.statement,
          source: po.source,
          status: 'ACTIVE',
          official_text_pending: !po.statement,
          sort_order: poNumber(po.poCode),
        });
      } else if (po.statement && statementsDiffer(String(existingPo.official_statement || ''), po.statement)) {
        throw new AppError(409, `PO difference for ${po.poCode} requires resolution before import`);
      }
    }
  }

  let createdCos = 0;
  let unchangedCos = 0;
  for (const co of outcomes) {
    const existing = await trx('course_outcomes')
      .where({ college_id: collegeId, course_id: course.id, co_code: co.coCode, is_current: true })
      .first();
    const sourceRef = `CO_MASTER!R${co.sourceRow}`;
    if (!existing) {
      await trx('course_outcomes').insert({
        college_id: collegeId,
        course_id: course.id,
        scheme_id: scheme.id,
        co_number: coNumber(co.coCode),
        co_code: co.coCode,
        statement: co.statement,
        blooms_level: co.bloomsLevel,
        source: co.source || 'VTU Official Syllabus',
        source_page: co.page || sourceRef,
        version_number: 1,
        is_current: true,
        status: 'ACTIVE',
        official_text_pending: false,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
      });
      createdCos += 1;
      continue;
    }
    if (!statementsDiffer(String(existing.statement), co.statement)) {
      unchangedCos += 1;
      continue;
    }
    const action = resolutions.get(`${Number(course.id)}:${co.coCode}`) || 'REVIEW_LATER';
    if (action !== 'CREATE_NEW_VERSION') continue;
    await trx('course_outcomes').where({ id: existing.id }).update({ is_current: false, status: 'ARCHIVED', updated_at: trx.fn.now() });
    await trx('course_outcomes').insert({
      college_id: collegeId,
      course_id: course.id,
      scheme_id: scheme.id,
      co_number: existing.co_number,
      co_code: existing.co_code,
      statement: co.statement,
      blooms_level: co.bloomsLevel ?? existing.blooms_level,
      source: co.source || existing.source,
      source_page: co.page ?? existing.source_page,
      version_number: Number(existing.version_number) + 1,
      is_current: true,
      status: 'ACTIVE',
      official_text_pending: false,
      supersedes_id: existing.id,
      created_by: actor.facultyUserId,
      updated_by: actor.facultyUserId,
    });
    createdCos += 1;
  }

  const subjectMaps = mappings.filter((m) => m.subjectCode === subject.code && m.scheme === subject.scheme);
  let createdMappings = 0;
  let unchangedMappings = 0;
  if (subjectMaps.length && framework) {
    const currentCos = await trx('course_outcomes').where({ college_id: collegeId, course_id: course.id, is_current: true });
    const currentPos = await trx('program_outcomes').where({
      college_id: collegeId,
      framework_version_id: framework.id,
      status: 'ACTIVE',
    });
    const existingVersion = await trx('copo_mapping_versions')
      .where({ college_id: collegeId, course_id: course.id, mapping_kind: 'PO', is_current: true })
      .first();
    const mappingStatus = subject.importReady && subject.verificationStatus === 'VERIFIED' ? 'APPROVED' : 'NEEDS_REVISION';
    let versionId = existingVersion?.id;
    if (!existingVersion) {
      const [id] = await trx('copo_mapping_versions').insert({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        course_id: course.id,
        po_framework_version_id: framework.id,
        mapping_kind: 'PO',
        version_number: 1,
        status: mappingStatus,
        is_current: true,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
        approved_by: mappingStatus === 'APPROVED' ? actor.facultyUserId : null,
        approved_at: mappingStatus === 'APPROVED' ? trx.fn.now() : null,
      });
      versionId = id;
    }
    for (const mapping of subjectMaps) {
      const coRow = currentCos.find((c: { co_code: string }) => String(c.co_code).toUpperCase() === mapping.coCode);
      const poRow = currentPos.find((p: { po_code: string }) => String(p.po_code).toUpperCase() === mapping.poCode);
      if (!coRow || !poRow) continue;
      const item = await trx('copo_mapping_items')
        .where({ mapping_version_id: versionId, course_outcome_id: coRow.id, program_outcome_id: poRow.id })
        .first();
      if (item) {
        if (Number(item.correlation_strength) === mapping.strength) {
          unchangedMappings += 1;
          continue;
        }
        await trx('copo_mapping_items').where({ id: item.id }).update({
          correlation_strength: mapping.strength,
          justification: mapping.justification,
          updated_by: actor.facultyUserId,
          updated_at: trx.fn.now(),
        });
        createdMappings += 1;
      } else {
        await trx('copo_mapping_items').insert({
          college_id: collegeId,
          mapping_version_id: versionId,
          course_id: course.id,
          course_outcome_id: coRow.id,
          program_outcome_id: poRow.id,
          correlation_strength: mapping.strength,
          justification: mapping.justification,
          created_by: actor.facultyUserId,
          updated_by: actor.facultyUserId,
        });
        createdMappings += 1;
      }
    }
  }
  return { skipped: false, createdCos, unchangedCos, createdMappings, unchangedMappings, createdSubject };
}

async function upsertSdgs(trx: typeof db, sdgs: ParsedSdg[]) {
  let upserted = 0;
  for (const sdg of sdgs) {
    const existing = await trx('sustainable_development_goals').where({ sdg_number: sdg.sdgNumber }).first();
    const payload = {
      sdg_code: sdg.sdgCode,
      official_title: sdg.title,
      official_description: sdg.description || sdg.title,
      source: 'United Nations Sustainable Development Goals',
      source_url: sdg.officialReference,
      active: sdg.active,
      updated_at: trx.fn.now(),
    };
    if (existing) {
      await trx('sustainable_development_goals').where({ id: existing.id }).update(payload);
    } else {
      await trx('sustainable_development_goals').insert({
        sdg_number: sdg.sdgNumber,
        ...payload,
      });
    }
    upserted += 1;
  }
  return upserted;
}

async function upsertPsos(trx: typeof db, collegeId: number, actor: CopoActor, psos: ParsedPso[]) {
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const pso of psos) {
    const schemeCode = normalizeSchemeCode(pso.scheme);
    let scheme = await trx('academic_schemes').where({ college_id: collegeId, code: schemeCode }).first();
    if (!scheme) {
      const [sid] = await trx('academic_schemes').insert({
        college_id: collegeId,
        name: `VTU ${pso.scheme} Scheme`,
        code: schemeCode,
        university: 'Visvesvaraya Technological University',
        start_year: Number(pso.scheme) || null,
        status: 'ACTIVE',
      });
      scheme = await trx('academic_schemes').where({ id: sid }).first();
    }
    const program = await ensureProgram(trx, collegeId, Number(scheme.id), pso.program);
    // Never attach a PSO to a different program — resolve strictly by program code/name.
    if (String(program.name).trim().toLowerCase() !== pso.program.trim().toLowerCase() && program.code !== (pso.programCode || programCodeFromName(pso.program))) {
      throw new AppError(400, `PSO ${pso.psoCode} program resolution mismatch for ${pso.program}`);
    }
    const existing = await trx('program_specific_outcomes')
      .where({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        pso_code: pso.psoCode,
        is_current: true,
      })
      .first();
    const officialPending = pso.verificationStatus === 'SOURCE_MISSING' || !pso.statement;
    const payload = {
      pso_number: pso.psoNumber,
      short_title: pso.title,
      official_statement: pso.statement,
      source: pso.sourceType || pso.sourceReference || 'Workbook PSO_MASTER',
      approval_reference: pso.sourceReference,
      verification_status: pso.verificationStatus,
      external_pso_id: pso.externalId,
      official_text_pending: officialPending,
      status: officialPending && pso.verificationStatus === 'SOURCE_MISSING' ? 'PENDING' : 'ACTIVE',
      sort_order: pso.psoNumber,
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    };
    if (!existing) {
      await trx('program_specific_outcomes').insert({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        pso_code: pso.psoCode,
        version_number: 1,
        is_current: true,
        created_by: actor.facultyUserId,
        ...payload,
      });
      created += 1;
    } else if (
      statementsDiffer(String(existing.official_statement || ''), pso.statement) ||
      String(existing.verification_status || '') !== pso.verificationStatus ||
      String(existing.short_title || '') !== String(pso.title || '')
    ) {
      await trx('program_specific_outcomes').where({ id: existing.id }).update(payload);
      updated += 1;
    } else {
      unchanged += 1;
    }
  }
  return { created, updated, unchanged };
}

async function resolveCourseForImport(
  trx: typeof db,
  collegeId: number,
  subjectCode: string,
  subjectName: string | null,
  schemeRaw: string,
  programName: string,
) {
  const schemeCode = normalizeSchemeCode(schemeRaw);
  const scheme = await trx('academic_schemes').where({ college_id: collegeId, code: schemeCode }).first();
  if (!scheme) return null;
  const program = await ensureProgram(trx, collegeId, Number(scheme.id), programName);
  const courses = await loadCollegeCourses(collegeId, trx);
  const rec = reconcileSubject(
    { name: subjectName || subjectCode, code: subjectCode, scheme: schemeRaw },
    courses,
  );
  let course: Record<string, unknown> | null = null;
  if (rec.course) {
    course = (await trx('courses').where({ id: rec.course.id, college_id: collegeId }).first()) as Record<
      string,
      unknown
    > | null;
  } else {
    course = (await trx('courses')
      .where({ college_id: collegeId, code: normalizeCode(subjectCode), scheme_id: scheme.id })
      .first()) as Record<string, unknown> | null;
  }
  if (!course) return null;
  return { scheme, program, course };
}

async function importCoPsoMappings(
  trx: typeof db,
  collegeId: number,
  actor: CopoActor,
  parsed: WorkbookParseResult,
) {
  let created = 0;
  let unchanged = 0;
  const bySubject = new Map<string, ParsedCoPsoMapping[]>();
  for (const m of parsed.coPsoMappings) {
    const key = `${m.scheme}|${m.program}|${m.subjectCode}`;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(m);
  }
  for (const [, rows] of bySubject) {
    const sample = rows[0];
    const resolved = await resolveCourseForImport(
      trx,
      collegeId,
      sample.subjectCode,
      sample.subjectName,
      sample.scheme,
      sample.program,
    );
    if (!resolved) continue;
    const { scheme, program, course } = resolved;
    const cos = await trx('course_outcomes').where({ college_id: collegeId, course_id: course.id, is_current: true });
    const psos = await trx('program_specific_outcomes').where({
      college_id: collegeId,
      scheme_id: scheme.id,
      program_id: program.id,
      is_current: true,
    });
    if (!psos.length) continue;
    let version = await trx('copo_mapping_versions')
      .where({
        college_id: collegeId,
        course_id: course.id,
        mapping_kind: 'PSO',
        program_id: program.id,
        is_current: true,
      })
      .whereNull('source_mapping_version_id')
      .first();
    const allNeedsReview = rows.every((r) => r.verificationStatus === 'NEEDS_REVIEW' || r.verificationStatus === 'SOURCE_MISSING');
    const mappingStatus = allNeedsReview ? 'DRAFT' : 'APPROVED';
    if (!version) {
      const [vid] = await trx('copo_mapping_versions').insert({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        course_id: course.id,
        mapping_kind: 'PSO',
        version_number: 1,
        status: mappingStatus,
        is_current: true,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
        approved_by: mappingStatus === 'APPROVED' ? actor.facultyUserId : null,
        approved_at: mappingStatus === 'APPROVED' ? trx.fn.now() : null,
      });
      version = await trx('copo_mapping_versions').where({ id: vid }).first();
    } else {
      await trx('copo_mapping_versions').where({ id: version.id }).update({
        program_id: program.id,
        scheme_id: scheme.id,
        status: mappingStatus,
        updated_by: actor.facultyUserId,
        updated_at: trx.fn.now(),
      });
    }
    for (const mapping of rows) {
      const coRow = cos.find((c: { co_code: string }) => String(c.co_code).toUpperCase() === mapping.coCode);
      const psoRow = psos.find((p: { pso_code: string }) => String(p.pso_code).toUpperCase() === mapping.psoCode);
      if (!coRow || !psoRow) continue;
      const item = await trx('copo_mapping_items')
        .where({
          mapping_version_id: version.id,
          course_outcome_id: coRow.id,
          program_specific_outcome_id: psoRow.id,
        })
        .first();
      const payload = {
        correlation_strength: mapping.strength,
        justification: mapping.rationale,
        mapping_origin: mapping.mappingOrigin,
        verification_status: mapping.verificationStatus,
        updated_by: actor.facultyUserId,
        updated_at: trx.fn.now(),
      };
      if (item) {
        if (
          Number(item.correlation_strength) === mapping.strength &&
          String(item.justification || '') === String(mapping.rationale || '') &&
          String(item.mapping_origin || '') === mapping.mappingOrigin &&
          String(item.verification_status || '') === mapping.verificationStatus
        ) {
          unchanged += 1;
          continue;
        }
        await trx('copo_mapping_items').where({ id: item.id }).update(payload);
        created += 1;
      } else {
        await trx('copo_mapping_items').insert({
          college_id: collegeId,
          mapping_version_id: version.id,
          course_id: course.id,
          course_outcome_id: coRow.id,
          program_outcome_id: null,
          program_specific_outcome_id: psoRow.id,
          sdg_id: null,
          ...payload,
          created_by: actor.facultyUserId,
        });
        created += 1;
      }
    }
  }
  return { created, unchanged };
}

async function importCoSdgMappings(
  trx: typeof db,
  collegeId: number,
  actor: CopoActor,
  parsed: WorkbookParseResult,
) {
  let created = 0;
  let unchanged = 0;
  const bySubject = new Map<string, ParsedCoSdgMapping[]>();
  for (const m of parsed.coSdgMappings) {
    const key = `${m.scheme}|${m.program}|${m.subjectCode}`;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(m);
  }
  const allSdgs = await trx('sustainable_development_goals').select('*');
  for (const [, rows] of bySubject) {
    const sample = rows[0];
    const resolved = await resolveCourseForImport(
      trx,
      collegeId,
      sample.subjectCode,
      sample.subjectName,
      sample.scheme,
      sample.program,
    );
    if (!resolved) continue;
    const { scheme, program, course } = resolved;
    const cos = await trx('course_outcomes').where({ college_id: collegeId, course_id: course.id, is_current: true });
    let version = await trx('copo_mapping_versions')
      .where({
        college_id: collegeId,
        course_id: course.id,
        mapping_kind: 'SDG',
        is_current: true,
      })
      .whereNull('source_mapping_version_id')
      .first();
    const allNeedsReview = rows.every((r) => r.verificationStatus === 'NEEDS_REVIEW' || r.verificationStatus === 'SOURCE_MISSING');
    const mappingStatus = allNeedsReview ? 'DRAFT' : 'APPROVED';
    if (!version) {
      const [vid] = await trx('copo_mapping_versions').insert({
        college_id: collegeId,
        scheme_id: scheme.id,
        program_id: program.id,
        course_id: course.id,
        mapping_kind: 'SDG',
        version_number: 1,
        status: mappingStatus,
        is_current: true,
        show_all_sdgs: false,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
        approved_by: mappingStatus === 'APPROVED' ? actor.facultyUserId : null,
        approved_at: mappingStatus === 'APPROVED' ? trx.fn.now() : null,
      });
      version = await trx('copo_mapping_versions').where({ id: vid }).first();
    } else {
      await trx('copo_mapping_versions').where({ id: version.id }).update({
        program_id: program.id,
        scheme_id: scheme.id,
        status: mappingStatus,
        updated_by: actor.facultyUserId,
        updated_at: trx.fn.now(),
      });
    }
    const relevantSdgIds = new Set<number>();
    for (const mapping of rows) {
      const coRow = cos.find((c: { co_code: string }) => String(c.co_code).toUpperCase() === mapping.coCode);
      const sdgRow = allSdgs.find((s: { sdg_code: string }) => String(s.sdg_code).toUpperCase() === mapping.sdgCode);
      if (!coRow || !sdgRow) continue;
      relevantSdgIds.add(Number(sdgRow.id));
      const item = await trx('copo_mapping_items')
        .where({
          mapping_version_id: version.id,
          course_outcome_id: coRow.id,
          sdg_id: sdgRow.id,
        })
        .first();
      const payload = {
        correlation_strength: mapping.relevance,
        justification: mapping.rationale,
        mapping_origin: mapping.mappingOrigin,
        verification_status: mapping.verificationStatus,
        updated_by: actor.facultyUserId,
        updated_at: trx.fn.now(),
      };
      if (item) {
        if (
          Number(item.correlation_strength) === mapping.relevance &&
          String(item.justification || '') === String(mapping.rationale || '') &&
          String(item.mapping_origin || '') === mapping.mappingOrigin &&
          String(item.verification_status || '') === mapping.verificationStatus
        ) {
          unchanged += 1;
          continue;
        }
        await trx('copo_mapping_items').where({ id: item.id }).update(payload);
        created += 1;
      } else {
        await trx('copo_mapping_items').insert({
          college_id: collegeId,
          mapping_version_id: version.id,
          course_id: course.id,
          course_outcome_id: coRow.id,
          program_outcome_id: null,
          program_specific_outcome_id: null,
          sdg_id: sdgRow.id,
          ...payload,
          created_by: actor.facultyUserId,
        });
        created += 1;
      }
    }
    await trx('copo_mapping_relevant_sdgs').where({ mapping_version_id: version.id }).del();
    if (relevantSdgIds.size) {
      await trx('copo_mapping_relevant_sdgs').insert(
        [...relevantSdgIds].map((sdgId) => ({
          college_id: collegeId,
          mapping_version_id: version.id,
          sdg_id: sdgId,
        })),
      );
    }
  }
  return { created, unchanged };
}

export async function commitWorkbookImport(
  collegeId: number,
  actor: CopoActor,
  batchId: string,
  resolutions: Resolution[] = [],
) {
  const batch = await db('syllabus_import_batches').where({ college_id: collegeId, batch_id: batchId }).first();
  if (!batch) throw new AppError(404, 'Import preview not found');
  if (batch.status === 'COMMITTED') throw new AppError(409, 'This import has already been committed');
  const payload = typeof batch.payload === 'string' ? JSON.parse(batch.payload) : batch.payload;
  if (payload.kind !== 'VTU_CO_PO_MASTER') throw new AppError(400, 'This batch is not a workbook import');
  const parsed = payload.parsed as WorkbookParseResult;
  if (parsed.errors.length) throw new AppError(400, 'Workbook has blocking errors; download the error report and fix the file.');

  const unresolved = (typeof batch.preview === 'string' ? JSON.parse(batch.preview) : batch.preview) as WorkbookPreview;
  const resolutionMap = new Map(resolutions.map((r) => [`${r.courseId}:${r.coCode}`, r.action]));
  const blockingDiffs = unresolved.subjects.flatMap((s) =>
    s.outcomes
      .filter((o) => o.status === 'CHANGED' && s.importReady)
      .map((o) => ({ courseId: s.courseId, coCode: o.code })),
  );
  for (const diff of blockingDiffs) {
    const action = resolutionMap.get(`${diff.courseId}:${diff.coCode}`);
    if (!action || action === 'REVIEW_LATER') {
      throw new AppError(409, `CO difference for ${diff.coCode} must be resolved before import (KEEP_EXISTING or CREATE_NEW_VERSION).`);
    }
  }
  const poDiffs = unresolved.programOutcomes.filter((p) => p.status === 'CHANGED');
  if (poDiffs.length) {
    throw new AppError(409, `PO definition differences must be resolved before import: ${poDiffs.map((p) => p.code).join(', ')}`);
  }

  const created = {
    subjects: 0,
    subjectsCreated: 0,
    outcomes: 0,
    outcomesUnchanged: 0,
    mappings: 0,
    mappingsUnchanged: 0,
    psosCreated: 0,
    psosUpdated: 0,
    psosUnchanged: 0,
    coPsoMappings: 0,
    coPsoMappingsUnchanged: 0,
    sdgsUpserted: 0,
    coSdgMappings: 0,
    coSdgMappingsUnchanged: 0,
    skipped: 0,
    needsReview: 0,
    warnings: parsed.warnings.length,
    errors: 0,
  };

  await db.transaction(async (trx) => {
    for (const subject of parsed.subjects) {
      const fileCos = parsed.outcomes.filter((c) => c.subjectCode === subject.code && c.scheme === subject.scheme);
      const fileMaps = parsed.mappings.filter((m) => m.subjectCode === subject.code && m.scheme === subject.scheme);
      const hasPso = parsed.coPsoMappings.some((m) => m.subjectCode === subject.code && m.scheme === subject.scheme);
      const hasSdg = parsed.coSdgMappings.some((m) => m.subjectCode === subject.code && m.scheme === subject.scheme);
      if (!fileCos.length && !fileMaps.length && !hasPso && !hasSdg) {
        created.skipped += 1;
        continue;
      }
      const result = await importSubjectBundle(
        trx as unknown as typeof db,
        collegeId,
        actor,
        subject,
        fileCos,
        fileMaps,
        parsed.sources,
        parsed.programOutcomes,
        resolutionMap,
      );
      if (result.skipped) {
        created.skipped += 1;
        created.needsReview += 1;
        continue;
      }
      created.subjects += 1;
      if (result.createdSubject) created.subjectsCreated += 1;
      created.outcomes += result.createdCos;
      created.outcomesUnchanged += result.unchangedCos;
      created.mappings += result.createdMappings;
      created.mappingsUnchanged += result.unchangedMappings;
      if (!subject.importReady || subject.verificationStatus !== 'VERIFIED') created.needsReview += 1;
    }

    const sdgCount = await upsertSdgs(trx as unknown as typeof db, parsed.sdgs);
    created.sdgsUpserted = sdgCount;
    const psoResult = await upsertPsos(trx as unknown as typeof db, collegeId, actor, parsed.programSpecificOutcomes);
    created.psosCreated = psoResult.created;
    created.psosUpdated = psoResult.updated;
    created.psosUnchanged = psoResult.unchanged;
    const copsResult = await importCoPsoMappings(trx as unknown as typeof db, collegeId, actor, parsed);
    created.coPsoMappings = copsResult.created;
    created.coPsoMappingsUnchanged = copsResult.unchanged;
    const cosdgResult = await importCoSdgMappings(trx as unknown as typeof db, collegeId, actor, parsed);
    created.coSdgMappings = cosdgResult.created;
    created.coSdgMappingsUnchanged = cosdgResult.unchanged;
    created.needsReview += parsed.coPsoMappings.filter((m) => m.verificationStatus === 'NEEDS_REVIEW').length;
    created.needsReview += parsed.coSdgMappings.filter((m) => m.verificationStatus === 'NEEDS_REVIEW').length;

    await trx('syllabus_import_batches').where({ id: batch.id }).update({
      status: 'COMMITTED',
      dry_run: false,
      resolutions: JSON.stringify(resolutions),
      imported_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
    await writeCopoAudit(
      {
        collegeId,
        actorId: actor.facultyUserId,
        action: 'COPO_WORKBOOK_IMPORT',
        metadata: { batchId, fileName: payload.fileName, ...created },
      },
      trx,
    );
  });

  return created;
}

export function workbookErrorReport(preview: WorkbookPreview) {
  const lines = [
    'CO-PO MASTER IMPORT ERROR REPORT',
    `File: ${preview.fileName}`,
    `Batch: ${preview.batchId}`,
    '',
    'ERRORS',
    ...(preview.errors.length ? preview.errors.map((e) => `- ${e}`) : ['- none']),
    '',
    'WARNINGS',
    ...(preview.warnings.length ? preview.warnings.map((e) => `- ${e}`) : ['- none']),
    '',
    'CO DIFFERENCES (not imported until resolved)',
    ...preview.subjects.flatMap((s) =>
      s.outcomes
        .filter((o) => o.status === 'CHANGED')
        .map(
          (o) =>
            `${s.code} ${o.code}\n  Existing: ${o.existingStatement}\n  Excel: ${o.importedStatement}\n  Source: VTU Official Syllabus`,
        ),
    ),
    '',
    'PO DIFFERENCES',
    ...preview.programOutcomes
      .filter((p) => p.status === 'CHANGED')
      .map((p) => `${p.code} (${p.scheme})\n  Existing: ${p.existingStatement}\n  Excel: ${p.importedStatement}`),
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

export async function importCopoMasterFile(
  collegeId: number,
  actor: CopoActor,
  buffer: Buffer,
  fileName: string,
) {
  const preview = await previewWorkbookImport(collegeId, actor, buffer, fileName);
  if (preview.errors.length) {
    return { preview, committed: null as Awaited<ReturnType<typeof commitWorkbookImport>> | null };
  }
  const committed = await commitWorkbookImport(collegeId, actor, preview.batchId, []);
  return { preview, committed };
}
