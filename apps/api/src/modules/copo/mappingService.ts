import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { writeCopoAudit } from './audit.js';
import {
  assertOperationalMappingAccess,
  canApproveMappings,
  canEditMapping,
  canSubmitMapping,
  decideMappingReadAccess,
  type CopoActor,
} from './access.js';
import { isFacultyScoped } from './access.js';
import {
  applicablePos,
  applicablePsos,
  assignedCourseIds,
  assertCourseInCollege,
  currentCourseOutcomes,
  facultyCanAccessCourse,
  listOfficialSdgs,
  loadActorProfile,
  mapPso,
  mapSubject,
  targetColumn,
} from './helpers.js';
import {
  detectPsoQualityIssues,
  detectQualityIssues,
  detectSdgQualityIssues,
  overallMappingLabel,
  poCoverage,
  summarizeMapping,
} from './quality.js';
import { suggestJustification, suggestMappings } from './suggest.js';
import { EDITABLE_MAPPING_STATUSES, isMappingKind, isValidCorrelation, type MappingKind, type MappingStatus } from './types.js';

type DbRow = Record<string, unknown>;

export const workspaceQuerySchema = z.object({
  courseId: z.number().int().positive(),
  programId: z.number().int().positive().optional().nullable(),
  academicYearId: z.number().int().positive().optional().nullable(),
  schemeId: z.number().int().positive().optional().nullable(),
  mappingKind: z.enum(['PO', 'PSO', 'SDG']).optional().default('PO'),
});

export const cellSchema = z.object({
  courseOutcomeId: z.number().int().positive(),
  programOutcomeId: z.number().int().positive().optional(),
  programSpecificOutcomeId: z.number().int().positive().optional(),
  sdgId: z.number().int().positive().optional(),
  strength: z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]),
});

export const justificationSchema = z.object({
  courseOutcomeId: z.number().int().positive(),
  programOutcomeId: z.number().int().positive().optional(),
  programSpecificOutcomeId: z.number().int().positive().optional(),
  sdgId: z.number().int().positive().optional(),
  justification: z.string().max(4000),
});

function versionKind(version?: Record<string, unknown> | null): MappingKind {
  const raw = version?.mapping_kind;
  return isMappingKind(raw) ? raw : 'PO';
}

function targetIdFromInput(kind: MappingKind, input: { programOutcomeId?: number; programSpecificOutcomeId?: number; sdgId?: number }) {
  if (kind === 'PSO') return input.programSpecificOutcomeId ?? input.programOutcomeId;
  if (kind === 'SDG') return input.sdgId ?? input.programOutcomeId;
  return input.programOutcomeId;
}

function displayStatus(hasVersion: boolean, status?: string | null): MappingStatus {
  if (!hasVersion) return 'NOT_STARTED';
  return (status as MappingStatus) || 'DRAFT';
}

async function mappingFacultyIds(collegeId: number, courseId: number, academicYearId?: number | null) {
  const rows = await db('faculty_subject_assignments')
    .where({ college_id: collegeId, course_id: courseId, status: 'ACTIVE' })
    .modify((q) => {
      if (academicYearId) q.andWhere((b) => b.where({ academic_year_id: academicYearId }).orWhereNull('academic_year_id'));
    })
    .select('faculty_id');
  return rows.map((r: { faculty_id: number }) => Number(r.faculty_id));
}

async function loadVersion(collegeId: number, versionId: number) {
  const version = await db('copo_mapping_versions').where({ id: versionId, college_id: collegeId }).first();
  if (!version) throw new AppError(404, 'Mapping version not found');
  return version;
}

async function assertCanRead(actor: CopoActor, version: Record<string, unknown>) {
  // Operational faculty-owned mappings: Survey-aligned creator ownership.
  if (version.source_mapping_version_id != null) {
    await assertOperationalMappingAccess(Number(version.id), actor, 'read');
    return;
  }
  const course = await db('courses').where({ id: version.course_id }).first();
  const assigned = await mappingFacultyIds(Number(version.college_id), Number(version.course_id), version.academic_year_id as number | null);
  const decision = decideMappingReadAccess(actor, {
    collegeId: Number(version.college_id),
    departmentId: course?.department_id != null ? Number(course.department_id) : null,
    createdBy: version.created_by != null ? Number(version.created_by) : null,
    assignedFacultyIds: assigned,
  });
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Mapping version not found');
  if (decision === 'FORBIDDEN') {
    throw new AppError(403, "You don't have access to this mapping.", undefined, 'MAPPING_FORBIDDEN');
  }
}

function isAssignedTo(actor: CopoActor, assigned: number[]) {
  if (assigned.includes(actor.facultyUserId)) return true;
  if (assigned.length === 0) return true;
  return false;
}

export async function findCurrentVersion(opts: {
  collegeId: number;
  courseId: number;
  programId?: number | null;
  academicYearId?: number | null;
  mappingKind?: MappingKind | null;
}) {
  const kind = opts.mappingKind || 'PO';
  return db('copo_mapping_versions')
    .where({
      college_id: opts.collegeId,
      course_id: opts.courseId,
      is_current: true,
      mapping_kind: kind,
    })
    .modify((q) => {
      if (opts.programId) q.andWhere({ program_id: opts.programId });
      else q.whereNull('program_id');
      if (opts.academicYearId) q.andWhere({ academic_year_id: opts.academicYearId });
      else q.whereNull('academic_year_id');
    })
    .orderBy('version_number', 'desc')
    .first();
}

export async function ensureDraftVersion(
  actor: CopoActor,
  opts: {
    courseId: number;
    programId?: number | null;
    academicYearId?: number | null;
    schemeId?: number | null;
    mappingKind?: MappingKind | null;
  },
) {
  const course = await assertCourseInCollege(opts.courseId, actor.collegeId);
  const mappingKind: MappingKind = opts.mappingKind || 'PO';
  const existing = await findCurrentVersion({
    collegeId: actor.collegeId,
    courseId: opts.courseId,
    programId: opts.programId,
    academicYearId: opts.academicYearId,
    mappingKind,
  });
  if (existing && EDITABLE_MAPPING_STATUSES.includes(existing.status)) return existing;
  if (existing && existing.status === 'SUBMITTED') {
    throw new AppError(409, 'This mapping has been submitted and is locked until a reviewer returns it.');
  }
  if (existing && existing.status === 'APPROVED') {
    throw new AppError(409, 'Approved mappings are locked. Reopen them to create a new version.');
  }

  const schemeId = opts.schemeId ?? course.scheme_id ?? null;
  const poFramework =
    mappingKind === 'PO' && schemeId
      ? await db('program_outcome_versions')
          .where({ college_id: actor.collegeId, scheme_id: schemeId, status: 'ACTIVE' })
          .orderBy('version_number', 'desc')
          .first()
      : null;
  const [id] = await db('copo_mapping_versions').insert({
    college_id: actor.collegeId,
    scheme_id: schemeId,
    program_id: opts.programId ?? null,
    course_id: opts.courseId,
    academic_year_id: opts.academicYearId ?? null,
    semester_id: course.semester_id ?? null,
    po_framework_version_id: poFramework?.id ?? null,
    mapping_kind: mappingKind,
    version_number: existing ? Number(existing.version_number) + 1 : 1,
    status: 'DRAFT',
    is_current: true,
    created_by: actor.facultyUserId,
    updated_by: actor.facultyUserId,
  });
  if (existing) {
    await db('copo_mapping_versions').where({ id: existing.id }).update({ is_current: false, updated_at: db.fn.now() });
  }
  await writeCopoAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'MAPPING_CREATE',
    mappingKind,
    mappingVersionId: id,
    courseId: opts.courseId,
    academicYearId: opts.academicYearId ?? null,
  });
  return db('copo_mapping_versions').where({ id }).first();
}

async function serializeWorkspace(
  actor: CopoActor,
  version: Record<string, unknown> | null,
  courseId: number,
  programId?: number | null,
  mappingKind?: MappingKind | null,
) {
  const courseRow = await db('courses as c')
    .leftJoin('departments as d', 'd.id', 'c.department_id')
    .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
    .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
    .where('c.id', courseId)
    .select('c.*', 'd.name as department_name', 's.name as scheme_name', 's.code as scheme_code', 'sem.label as semester_label')
    .first();
  if (!courseRow) throw new AppError(404, 'Subject not found');
  const course = mapSubject(courseRow);
  const schemeId = Number(version?.scheme_id ?? course.schemeId ?? 0) || null;
  const kind = mappingKind || versionKind(version);
  const cos = await currentCourseOutcomes(actor.collegeId, courseId);
  const pos = schemeId && kind === 'PO' ? await applicablePos(actor.collegeId, schemeId, programId) : { framework: null, outcomes: [] };
  const psos =
    schemeId && programId && (kind === 'PSO' || !version)
      ? await applicablePsos(actor.collegeId, schemeId, programId)
      : schemeId && programId
        ? await applicablePsos(actor.collegeId, schemeId, programId)
        : [];
  const allSdgs = kind === 'SDG' || !version ? await listOfficialSdgs(true) : [];
  const relevantRows =
    version && kind === 'SDG'
      ? await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: version.id })
      : [];
  const items = version ? await db('copo_mapping_items').where({ mapping_version_id: version.id }) : [];
  const mappedItems = items.map((item) => {
    const programOutcomeId = item.program_outcome_id == null ? null : Number(item.program_outcome_id);
    const programSpecificOutcomeId = item.program_specific_outcome_id == null ? null : Number(item.program_specific_outcome_id);
    const sdgId = item.sdg_id == null ? null : Number(item.sdg_id);
    const targetId = kind === 'PSO' ? programSpecificOutcomeId : kind === 'SDG' ? sdgId : programOutcomeId;
    return {
      id: Number(item.id),
      courseOutcomeId: Number(item.course_outcome_id),
      programOutcomeId: programOutcomeId ?? targetId,
      programSpecificOutcomeId,
      sdgId,
      targetId,
      strength: item.correlation_strength == null ? null : Number(item.correlation_strength),
      justification: item.justification ?? null,
      mappingOrigin: item.mapping_origin == null ? null : String(item.mapping_origin),
      verificationStatus: item.verification_status == null ? null : String(item.verification_status),
      aiSuggested: Boolean(item.ai_suggested),
      facultyReviewed: Boolean(item.faculty_reviewed),
    };
  });
  const qualityTargets =
    kind === 'PSO'
      ? psos.map((p) => ({
          id: p.id,
          code: p.code,
          isCurrent: p.isCurrent,
          status: p.status,
          officialTextPending: p.officialTextPending,
        }))
      : kind === 'SDG'
        ? allSdgs.map((s) => ({ id: s.id, code: s.code, isCurrent: true, status: s.active ? 'ACTIVE' : 'ARCHIVED' }))
        : pos.outcomes.map((p) => ({ id: p.id, code: p.code, officialTextPending: p.officialTextPending }));
  const qualityInput = {
    courseOutcomes: cos.map((c) => ({ id: c.id, code: c.code, isCurrent: c.isCurrent, status: c.status })),
    programOutcomes: qualityTargets,
    items: mappedItems.map((i) => ({
      courseOutcomeId: i.courseOutcomeId,
      programOutcomeId: Number(i.targetId || i.programOutcomeId),
      strength: i.strength,
      justification: i.justification,
    })),
  };
  const qualityFlags =
    kind === 'PSO'
      ? detectPsoQualityIssues(qualityInput)
      : kind === 'SDG'
        ? detectSdgQualityIssues(qualityInput)
        : detectQualityIssues(qualityInput);
  const comments = version
    ? await db('mapping_review_comments').where({ mapping_version_id: version.id }).orderBy('created_at', 'desc')
    : [];
  const year = version?.academic_year_id
    ? await db('academic_years').where({ id: version.academic_year_id }).first()
    : null;
  const program = programId || version?.program_id
    ? await db('programs').where({ id: programId || version?.program_id }).first()
    : null;
  const assigned = await mappingFacultyIds(actor.collegeId, courseId, version?.academic_year_id as number | null);
  const status = displayStatus(Boolean(version), version?.status as string);
  const sourceDocs = await db('syllabus_documents').where({ college_id: actor.collegeId, course_id: courseId }).orderBy('id', 'desc');
  const mappedSdgIds = new Set(mappedItems.filter((i) => i.sdgId).map((i) => i.sdgId as number));
  const relevantSdgIds = relevantRows.length
    ? relevantRows.map((r) => Number(r.sdg_id))
    : [...mappedSdgIds];
  const showAllSdgs = Boolean(version?.show_all_sdgs);
  const visibleSdgs =
    kind === 'SDG'
      ? showAllSdgs || !relevantSdgIds.length
        ? allSdgs
        : allSdgs.filter((s) => relevantSdgIds.includes(s.id))
      : [];

  if (kind === 'PSO' && mappedItems.length) {
    const usedIds = [...new Set(mappedItems.map((i) => i.programSpecificOutcomeId).filter(Boolean))] as number[];
    const extra = usedIds.filter((id) => !psos.some((p) => p.id === id));
    if (extra.length) {
      const extraRows = await db('program_specific_outcomes').whereIn('id', extra);
      for (const row of extraRows) {
        const mapped = mapPso(row);
        if (!psos.some((p) => p.id === mapped.id)) psos.push(mapped);
      }
    }
  }

  return {
    mappingKind: kind,
    course,
    program: program ? { id: Number(program.id), name: program.name, code: program.code } : null,
    academicYear: year ? { id: Number(year.id), label: year.label } : null,
    courseOutcomes: cos,
    programOutcomes: pos.outcomes,
    programSpecificOutcomes: psos,
    sdgs: allSdgs,
    visibleSdgs,
    relevantSdgIds,
    showAllSdgs,
    poFramework: pos.framework
      ? { id: Number(pos.framework.id), versionNumber: pos.framework.version_number, label: pos.framework.label }
      : null,
    mapping: version
      ? {
          id: Number(version.id),
          versionNumber: Number(version.version_number),
          status,
          mappingKind: kind,
          isCurrent: Boolean(version.is_current),
          createdBy: version.created_by,
          updatedBy: version.updated_by,
          submittedAt: version.submitted_at,
          approvedAt: version.approved_at,
          returnedAt: version.returned_at,
        }
      : { id: null, versionNumber: 0, status: 'NOT_STARTED' as const, mappingKind: kind, isCurrent: true },
    items: mappedItems,
    summary: summarizeMapping({
      ...qualityInput,
      programOutcomes: kind === 'SDG' ? visibleSdgs.map((s) => ({ id: s.id, code: s.code })) : qualityTargets,
    }),
    coverage: poCoverage(qualityInput),
    qualityFlags,
    comments: comments.map((c) => ({
      id: Number(c.id),
      action: c.action,
      comment: c.comment,
      authorName: c.author_name,
      courseOutcomeId: c.course_outcome_id,
      programOutcomeId: c.program_outcome_id,
      programSpecificOutcomeId: c.program_specific_outcome_id,
      sdgId: c.sdg_id,
      createdAt: c.created_at,
    })),
    sourceDocuments: sourceDocs.map((d) => ({
      id: Number(d.id),
      title: d.title,
      sourceLabel: d.source_label,
      externalUrl: d.external_url,
    })),
    permissions: {
      canEdit: canEditMapping(actor.role, status, isAssignedTo(actor, assigned) || (await facultyCanAccessCourse(actor, courseId))),
      canSubmit: canSubmitMapping(actor.role, isAssignedTo(actor, assigned) || (await facultyCanAccessCourse(actor, courseId))),
      canReview: canApproveMappings(actor.role),
      canManageMasters: actor.role === 'SUPER_ADMIN' || actor.role === 'COLLEGE_ADMIN',
    },
    officialDataPending: {
      outcomes: cos.length === 0,
      programmeOutcomes: kind === 'PO' && pos.outcomes.length === 0,
      poStatements: pos.outcomes.some((p) => p.officialTextPending || !p.officialStatement),
      programSpecificOutcomes: kind === 'PSO' && psos.length === 0,
      psoStatements: psos.some((p) => p.officialTextPending || !p.officialStatement),
    },
  };
}

export async function getWorkspace(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>) {
  await assertCourseInCollege(query.courseId, actor.collegeId);
  if (!(await facultyCanAccessCourse(actor, query.courseId, query.academicYearId))) {
    throw new AppError(403, 'You are not assigned to this subject');
  }
  const mappingKind = query.mappingKind || 'PO';
  const version = await findCurrentVersion({
    collegeId: actor.collegeId,
    courseId: query.courseId,
    programId: query.programId,
    academicYearId: query.academicYearId,
    mappingKind,
  });
  return serializeWorkspace(actor, version || null, query.courseId, query.programId, mappingKind);
}

export async function getWorkspaceByVersion(actor: CopoActor, versionId: number) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  return serializeWorkspace(actor, version, Number(version.course_id), version.program_id as number | null);
}

async function validatePair(version: Record<string, unknown>, courseOutcomeId: number, targetId: number) {
  const kind = versionKind(version);
  const co = await db('course_outcomes').where({ id: courseOutcomeId }).first();
  if (!co || Number(co.course_id) !== Number(version.course_id)) {
    throw new AppError(400, 'Course outcome does not belong to this subject');
  }
  if (!co.is_current || co.status === 'ARCHIVED') {
    throw new AppError(400, 'Cannot map an archived course outcome version');
  }
  if (kind === 'PSO') {
    const pso = await db('program_specific_outcomes').where({ id: targetId, college_id: version.college_id }).first();
    if (!pso) throw new AppError(400, 'Program specific outcome not found');
    if (version.scheme_id && Number(pso.scheme_id) !== Number(version.scheme_id)) {
      throw new AppError(400, 'PSO does not belong to this scheme');
    }
    if (version.program_id && Number(pso.program_id) !== Number(version.program_id)) {
      throw new AppError(400, 'Cannot map a PSO from a different program');
    }
    if (pso.status === 'ARCHIVED') {
      throw new AppError(400, 'Cannot map an archived PSO');
    }
    return { co, pso, sdg: null, po: null };
  }
  if (kind === 'SDG') {
    const sdg = await db('sustainable_development_goals').where({ id: targetId, active: true }).first();
    if (!sdg) throw new AppError(400, 'Sustainable Development Goal not found');
    return { co, pso: null, sdg, po: null };
  }
  const po = await db('program_outcomes').where({ id: targetId }).first();
  if (!po) throw new AppError(400, 'Programme outcome not found');
  if (version.scheme_id && Number(po.scheme_id) !== Number(version.scheme_id)) {
    throw new AppError(400, 'Programme outcome does not belong to this scheme');
  }
  if (version.po_framework_version_id && Number(po.framework_version_id) !== Number(version.po_framework_version_id)) {
    throw new AppError(400, 'Programme outcome is from a different PO framework version');
  }
  return { co, po, pso: null, sdg: null };
}

export async function setCell(
  actor: CopoActor,
  versionId: number,
  input: z.infer<typeof cellSchema>,
) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  const assigned = await mappingFacultyIds(actor.collegeId, Number(version.course_id), version.academic_year_id as number | null);
  if (!canEditMapping(actor.role, version.status, isAssignedTo(actor, assigned) || (await facultyCanAccessCourse(actor, Number(version.course_id))))) {
    throw new AppError(403, 'This mapping is locked');
  }
  if (input.strength !== null && !isValidCorrelation(input.strength)) {
    throw new AppError(400, 'Correlation must be 1, 2, 3, or not mapped');
  }
  const kind = versionKind(version);
  const targetId = targetIdFromInput(kind, input);
  if (!targetId) throw new AppError(400, 'A mapping target is required');
  await validatePair(version, input.courseOutcomeId, targetId);
  const col = targetColumn(kind);
  const existing = await db('copo_mapping_items')
    .where({
      mapping_version_id: versionId,
      course_outcome_id: input.courseOutcomeId,
      [col]: targetId,
    })
    .first();

  await db.transaction(async (trx) => {
    if (input.strength === null) {
      if (existing) await trx('copo_mapping_items').where({ id: existing.id }).del();
    } else if (existing) {
      await trx('copo_mapping_items')
        .where({ id: existing.id })
        .update({
          correlation_strength: input.strength,
          ai_suggested: false,
          faculty_reviewed: true,
          updated_by: actor.facultyUserId,
          updated_at: trx.fn.now(),
        });
    } else {
      await trx('copo_mapping_items').insert({
        college_id: actor.collegeId,
        mapping_version_id: versionId,
        course_id: version.course_id,
        course_outcome_id: input.courseOutcomeId,
        program_outcome_id: kind === 'PO' ? targetId : null,
        program_specific_outcome_id: kind === 'PSO' ? targetId : null,
        sdg_id: kind === 'SDG' ? targetId : null,
        correlation_strength: input.strength,
        justification: null,
        ai_suggested: false,
        faculty_reviewed: true,
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
      });
    }
    if (kind === 'SDG' && input.strength != null) {
      const already = await trx('copo_mapping_relevant_sdgs').where({ mapping_version_id: versionId, sdg_id: targetId }).first();
      if (!already) {
        await trx('copo_mapping_relevant_sdgs').insert({
          college_id: actor.collegeId,
          mapping_version_id: versionId,
          sdg_id: targetId,
        });
      }
    }
    await trx('copo_mapping_versions').where({ id: versionId }).update({ updated_by: actor.facultyUserId, updated_at: trx.fn.now() });
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MAPPING_CELL',
        mappingKind: kind,
        mappingVersionId: versionId,
        courseId: Number(version.course_id),
        courseOutcomeId: input.courseOutcomeId,
        programOutcomeId: kind === 'PO' ? targetId : null,
        programSpecificOutcomeId: kind === 'PSO' ? targetId : null,
        sdgId: kind === 'SDG' ? targetId : null,
        academicYearId: version.academic_year_id as number | null,
        previousValue: existing?.correlation_strength != null ? String(existing.correlation_strength) : '–',
        newValue: input.strength == null ? '–' : String(input.strength),
      },
      trx,
    );
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function setJustification(actor: CopoActor, versionId: number, input: z.infer<typeof justificationSchema>) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  const assigned = await mappingFacultyIds(actor.collegeId, Number(version.course_id), version.academic_year_id as number | null);
  if (!canEditMapping(actor.role, version.status, isAssignedTo(actor, assigned) || (await facultyCanAccessCourse(actor, Number(version.course_id))))) {
    throw new AppError(403, 'This mapping is locked');
  }
  const kind = versionKind(version);
  const targetId = targetIdFromInput(kind, input);
  if (!targetId) throw new AppError(400, 'A mapping target is required');
  const col = targetColumn(kind);
  const item = await db('copo_mapping_items')
    .where({
      mapping_version_id: versionId,
      course_outcome_id: input.courseOutcomeId,
      [col]: targetId,
    })
    .first();
  if (!item || item.correlation_strength == null) {
    throw new AppError(400, 'Add a mapping strength before writing a justification');
  }
  await db('copo_mapping_items')
    .where({ id: item.id })
    .update({
      justification: input.justification.trim() || null,
      faculty_reviewed: true,
      updated_by: actor.facultyUserId,
      updated_at: db.fn.now(),
    });
  await writeCopoAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'MAPPING_JUSTIFICATION',
    mappingKind: kind,
    mappingVersionId: versionId,
    courseId: Number(version.course_id),
    courseOutcomeId: input.courseOutcomeId,
    programOutcomeId: kind === 'PO' ? targetId : null,
    programSpecificOutcomeId: kind === 'PSO' ? targetId : null,
    sdgId: kind === 'SDG' ? targetId : null,
    previousValue: item.justification,
    newValue: input.justification.trim() || null,
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function bulkJustifications(
  actor: CopoActor,
  versionId: number,
  items: Array<z.infer<typeof justificationSchema>>,
) {
  for (const item of items) {
    await setJustification(actor, versionId, item);
  }
  return getWorkspaceByVersion(actor, versionId);
}

export async function submitMapping(actor: CopoActor, versionId: number) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  const assigned = await mappingFacultyIds(actor.collegeId, Number(version.course_id), version.academic_year_id as number | null);
  if (!canSubmitMapping(actor.role, isAssignedTo(actor, assigned) || (await facultyCanAccessCourse(actor, Number(version.course_id))))) {
    throw new AppError(403, 'You cannot submit this mapping');
  }
  if (!EDITABLE_MAPPING_STATUSES.includes(version.status) && version.status !== 'NOT_STARTED') {
    throw new AppError(409, 'Only draft or returned mappings can be submitted');
  }
  const workspace = await serializeWorkspace(actor, version, Number(version.course_id), version.program_id as number | null);
  const kind = versionKind(version);
  if (workspace.courseOutcomes.length === 0) {
    throw new AppError(400, 'Official COs must be available before submission');
  }
  if (kind === 'PO' && workspace.programOutcomes.length === 0) {
    throw new AppError(400, 'Official POs must be available before submission');
  }
  if (kind === 'PSO' && workspace.programSpecificOutcomes.length === 0) {
    throw new AppError(400, 'Approved PSO data is pending. PSO mapping cannot be submitted until official PSOs are available.');
  }
  await db('copo_mapping_versions')
    .where({ id: versionId })
    .update({
      status: 'SUBMITTED',
      submitted_by: actor.facultyUserId,
      submitted_at: db.fn.now(),
      updated_by: actor.facultyUserId,
      updated_at: db.fn.now(),
    });
  await writeCopoAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'MAPPING_SUBMIT',
    mappingKind: kind,
    mappingVersionId: versionId,
    courseId: Number(version.course_id),
    previousValue: version.status,
    newValue: 'SUBMITTED',
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function returnMapping(actor: CopoActor, versionId: number, comment: string) {
  if (!canApproveMappings(actor.role)) throw new AppError(403, 'Reviewer access required');
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  if (version.status !== 'SUBMITTED' && version.status !== 'APPROVED') {
    throw new AppError(409, 'Only submitted mappings can be returned for correction');
  }
  const profile = await loadActorProfile(actor);
  await db.transaction(async (trx) => {
    await trx('copo_mapping_versions').where({ id: versionId }).update({
      status: 'NEEDS_REVISION',
      returned_by: actor.facultyUserId,
      returned_at: trx.fn.now(),
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
    await trx('mapping_review_comments').insert({
      college_id: actor.collegeId,
      mapping_version_id: versionId,
      author_id: actor.facultyUserId,
      author_name: profile.name,
      action: 'RETURN',
      comment,
    });
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorName: profile.name,
        action: 'MAPPING_RETURN',
        mappingVersionId: versionId,
        courseId: Number(version.course_id),
        previousValue: version.status,
        newValue: 'NEEDS_REVISION',
        metadata: { comment },
      },
      trx,
    );
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function approveMapping(actor: CopoActor, versionId: number, comment?: string) {
  if (!canApproveMappings(actor.role)) throw new AppError(403, 'Reviewer access required');
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  if (version.status !== 'SUBMITTED' && version.status !== 'NEEDS_REVISION') {
    throw new AppError(409, 'Only submitted mappings can be approved');
  }
  const profile = await loadActorProfile(actor);
  await db.transaction(async (trx) => {
    await trx('copo_mapping_versions').where({ id: versionId }).update({
      status: 'APPROVED',
      approved_by: actor.facultyUserId,
      approved_at: trx.fn.now(),
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
    if (comment) {
      await trx('mapping_review_comments').insert({
        college_id: actor.collegeId,
        mapping_version_id: versionId,
        author_id: actor.facultyUserId,
        author_name: profile.name,
        action: 'APPROVE',
        comment,
      });
    }
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorName: profile.name,
        action: 'MAPPING_APPROVE',
        mappingVersionId: versionId,
        courseId: Number(version.course_id),
        previousValue: version.status,
        newValue: 'APPROVED',
      },
      trx,
    );
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function reopenMapping(actor: CopoActor, versionId: number) {
  if (!canApproveMappings(actor.role)) throw new AppError(403, 'Only reviewers can reopen an approved mapping');
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  if (version.status !== 'APPROVED') throw new AppError(409, 'Only approved mappings can be reopened');
  const profile = await loadActorProfile(actor);
  const items = await db('copo_mapping_items').where({ mapping_version_id: versionId });
  const newVersion = await db.transaction(async (trx) => {
    await trx('copo_mapping_versions').where({ id: versionId }).update({
      is_current: false,
      reopened_by: actor.facultyUserId,
      reopened_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
    const [id] = await trx('copo_mapping_versions').insert({
      college_id: actor.collegeId,
      scheme_id: version.scheme_id,
      program_id: version.program_id,
      course_id: version.course_id,
      academic_year_id: version.academic_year_id,
      semester_id: version.semester_id,
      po_framework_version_id: version.po_framework_version_id,
      mapping_kind: version.mapping_kind || 'PO',
      show_all_sdgs: version.show_all_sdgs || false,
      version_number: Number(version.version_number) + 1,
      status: 'DRAFT',
      is_current: true,
      copied_from_id: versionId,
      created_by: actor.facultyUserId,
      updated_by: actor.facultyUserId,
    });
    if (items.length) {
      await trx('copo_mapping_items').insert(
        items.map((item) => ({
          college_id: actor.collegeId,
          mapping_version_id: id,
          course_id: item.course_id,
          course_outcome_id: item.course_outcome_id,
          program_outcome_id: item.program_outcome_id,
          program_specific_outcome_id: item.program_specific_outcome_id,
          sdg_id: item.sdg_id,
          correlation_strength: item.correlation_strength,
          justification: item.justification,
          ai_suggested: false,
          faculty_reviewed: true,
          created_by: actor.facultyUserId,
          updated_by: actor.facultyUserId,
        })),
      );
    }
    const relevant = await trx('copo_mapping_relevant_sdgs').where({ mapping_version_id: versionId });
    if (relevant.length) {
      await trx('copo_mapping_relevant_sdgs').insert(
        relevant.map((row) => ({
          college_id: actor.collegeId,
          mapping_version_id: id,
          sdg_id: row.sdg_id,
        })),
      );
    }
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorName: profile.name,
        action: 'MAPPING_REOPEN',
        mappingVersionId: id,
        courseId: Number(version.course_id),
        previousValue: `v${version.version_number} APPROVED`,
        newValue: `v${Number(version.version_number) + 1} DRAFT`,
      },
      trx,
    );
    return id;
  });
  return getWorkspaceByVersion(actor, newVersion);
}

export async function copyPrevious(actor: CopoActor, versionId: number, fromVersionId: number) {
  const target = await loadVersion(actor.collegeId, versionId);
  const source = await loadVersion(actor.collegeId, fromVersionId);
  await assertCanRead(actor, target);
  await assertCanRead(actor, source);
  const kind = versionKind(target);
  if (versionKind(source) !== kind) {
    throw new AppError(400, 'Cannot copy mappings across different mapping types');
  }
  if (Number(target.course_id) !== Number(source.course_id)) {
    throw new AppError(400, 'Copy is only allowed for the same subject');
  }
  if (Number(target.scheme_id || 0) !== Number(source.scheme_id || 0)) {
    throw new AppError(400, 'Cannot copy mappings across different schemes');
  }
  if (Number(target.program_id || 0) !== Number(source.program_id || 0)) {
    throw new AppError(400, 'Cannot copy mappings across different programs');
  }
  if (kind === 'PO' && Number(target.po_framework_version_id || 0) !== Number(source.po_framework_version_id || 0)) {
    throw new AppError(400, 'Cannot copy mappings across different PO frameworks');
  }
  const assigned = await mappingFacultyIds(actor.collegeId, Number(target.course_id), target.academic_year_id as number | null);
  if (!canEditMapping(actor.role, target.status, isAssignedTo(actor, assigned))) {
    throw new AppError(403, 'This mapping is locked');
  }
  const currentCos = await currentCourseOutcomes(actor.collegeId, Number(target.course_id));
  const sourceItems = await db('copo_mapping_items as i')
    .join('course_outcomes as co', 'co.id', 'i.course_outcome_id')
    .where('i.mapping_version_id', fromVersionId)
    .select('i.*', 'co.co_code', 'co.statement as co_statement');
  const comparison = [];
  for (const item of sourceItems) {
    const match = currentCos.find((c) => c.code === item.co_code && c.statement === item.co_statement);
    let compatible = Boolean(match);
    let targetLabel = '';
    if (kind === 'PO') {
      targetLabel = `PO:${item.program_outcome_id}`;
    } else if (kind === 'PSO') {
      const pso = await db('program_specific_outcomes').where({ id: item.program_specific_outcome_id }).first();
      targetLabel = pso?.pso_code || 'PSO';
      if (!pso || !pso.is_current || pso.status === 'ARCHIVED') compatible = false;
    } else {
      targetLabel = `SDG:${item.sdg_id}`;
    }
    comparison.push({
      fromCo: item.co_code,
      fromTarget: targetLabel,
      strength: item.correlation_strength,
      justification: item.justification,
      compatible,
      targetCourseOutcomeId: match?.id ?? null,
      programOutcomeId: item.program_outcome_id == null ? null : Number(item.program_outcome_id),
      programSpecificOutcomeId: item.program_specific_outcome_id == null ? null : Number(item.program_specific_outcome_id),
      sdgId: item.sdg_id == null ? null : Number(item.sdg_id),
    });
  }
  const compatible = comparison.filter((c) => c.compatible && c.targetCourseOutcomeId);
  await db.transaction(async (trx) => {
    await trx('copo_mapping_items').where({ mapping_version_id: versionId }).del();
    if (compatible.length) {
      await trx('copo_mapping_items').insert(
        compatible.map((c) => ({
          college_id: actor.collegeId,
          mapping_version_id: versionId,
          course_id: target.course_id,
          course_outcome_id: c.targetCourseOutcomeId,
          program_outcome_id: c.programOutcomeId,
          program_specific_outcome_id: c.programSpecificOutcomeId,
          sdg_id: c.sdgId,
          correlation_strength: c.strength,
          justification: c.justification,
          ai_suggested: false,
          faculty_reviewed: true,
          created_by: actor.facultyUserId,
          updated_by: actor.facultyUserId,
        })),
      );
    }
    await trx('copo_mapping_versions').where({ id: versionId }).update({
      copied_from_id: fromVersionId,
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MAPPING_COPY',
        mappingKind: kind,
        mappingVersionId: versionId,
        courseId: Number(target.course_id),
        metadata: { fromVersionId, copied: compatible.length, skipped: comparison.length - compatible.length },
      },
      trx,
    );
  });
  return { comparison, copied: compatible.length, skipped: comparison.length - compatible.length, workspace: await getWorkspaceByVersion(actor, versionId) };
}

export async function previewCopy(
  actor: CopoActor,
  courseId: number,
  academicYearId?: number | null,
  programId?: number | null,
  mappingKind: MappingKind = 'PO',
) {
  const current = await findCurrentVersion({ collegeId: actor.collegeId, courseId, programId, academicYearId, mappingKind });
  const previous = await db('copo_mapping_versions')
    .where({ college_id: actor.collegeId, course_id: courseId, is_current: false, mapping_kind: mappingKind })
    .modify((q) => {
      if (programId) q.andWhere({ program_id: programId });
      if (academicYearId) q.whereNot({ academic_year_id: academicYearId });
    })
    .orderBy('id', 'desc')
    .first();
  return {
    current: current ? { id: current.id, status: current.status, versionNumber: current.version_number, mappingKind } : null,
    previous: previous
      ? { id: previous.id, status: previous.status, versionNumber: previous.version_number, academicYearId: previous.academic_year_id, mappingKind }
      : null,
  };
}

export async function suggestForVersion(actor: CopoActor, versionId: number) {
  const workspace = await getWorkspaceByVersion(actor, versionId);
  const targets =
    workspace.mappingKind === 'PSO'
      ? workspace.programSpecificOutcomes.map((p) => ({
          id: p.id,
          code: p.code,
          shortTitle: p.shortTitle,
          statement: p.officialStatement,
        }))
      : workspace.mappingKind === 'SDG'
        ? workspace.visibleSdgs.map((s) => ({
            id: s.id,
            code: s.code,
            shortTitle: s.officialTitle,
            statement: s.officialDescription,
          }))
        : workspace.programOutcomes.map((p) => ({
            id: p.id,
            code: p.code,
            shortTitle: p.shortTitle,
            statement: p.officialStatement,
          }));
  const raw = suggestMappings(
    workspace.courseOutcomes.map((c) => ({
      id: c.id,
      code: c.code,
      statement: c.statement,
      bloomsLevel: c.bloomsLevel,
      knowledgeLevel: c.knowledgeLevel,
    })),
    targets,
  );
  const suggestions = raw
    .filter((s) => !(workspace.mappingKind === 'SDG' && s.poCode === 'SDG4' && s.suggested === 1))
    .map((s) => ({
      ...s,
      programSpecificOutcomeId: workspace.mappingKind === 'PSO' ? s.programOutcomeId : undefined,
      sdgId: workspace.mappingKind === 'SDG' ? s.programOutcomeId : undefined,
    }));
  return { label: 'AI Suggested — Not Approved', suggestions };
}

export async function justificationDraft(
  actor: CopoActor,
  versionId: number,
  courseOutcomeId: number,
  targetId: number,
) {
  const workspace = await getWorkspaceByVersion(actor, versionId);
  const co = workspace.courseOutcomes.find((c) => c.id === courseOutcomeId);
  const item = workspace.items.find((i) => i.courseOutcomeId === courseOutcomeId && Number(i.targetId) === targetId);
  const target =
    workspace.mappingKind === 'PSO'
      ? workspace.programSpecificOutcomes.find((p) => p.id === targetId)
      : workspace.mappingKind === 'SDG'
        ? workspace.sdgs.find((s) => s.id === targetId)
        : workspace.programOutcomes.find((p) => p.id === targetId);
  if (!co || !target || !item?.strength) throw new AppError(400, 'Map the cell before requesting a justification suggestion');
  const code = 'code' in target ? target.code : '';
  const title =
    'shortTitle' in target
      ? target.shortTitle
      : 'officialTitle' in target
        ? target.officialTitle
        : null;
  const statement =
    'officialStatement' in target
      ? target.officialStatement
      : 'officialDescription' in target
        ? target.officialDescription
        : null;
  return {
    draft: suggestJustification({
      coCode: co.code,
      coStatement: co.statement,
      poCode: code,
      poTitle: title,
      poStatement: statement,
      strength: item.strength as 1 | 2 | 3,
      bloomsLevel: co.bloomsLevel,
      subjectName: String(workspace.course.name),
    }),
    similar: workspace.items.filter(
      (i) =>
        Number(i.targetId) === targetId &&
        i.courseOutcomeId !== courseOutcomeId &&
        i.justification &&
        i.strength === item.strength,
    ),
  };
}

export async function acceptSuggestions(
  actor: CopoActor,
  versionId: number,
  accepted: Array<{
    courseOutcomeId: number;
    programOutcomeId?: number;
    programSpecificOutcomeId?: number;
    sdgId?: number;
    strength: 1 | 2 | 3;
  }>,
) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  const assigned = await mappingFacultyIds(actor.collegeId, Number(version.course_id), version.academic_year_id as number | null);
  if (!canEditMapping(actor.role, version.status, isAssignedTo(actor, assigned))) {
    throw new AppError(403, 'This mapping is locked');
  }
  const kind = versionKind(version);
  const col = targetColumn(kind);
  await db.transaction(async (trx) => {
    for (const row of accepted) {
      const targetId = targetIdFromInput(kind, row);
      if (!targetId) continue;
      await validatePair(version, row.courseOutcomeId, targetId);
      const existing = await trx('copo_mapping_items')
        .where({
          mapping_version_id: versionId,
          course_outcome_id: row.courseOutcomeId,
          [col]: targetId,
        })
        .first();
      if (existing) {
        await trx('copo_mapping_items').where({ id: existing.id }).update({
          correlation_strength: row.strength,
          ai_suggested: true,
          faculty_reviewed: true,
          updated_by: actor.facultyUserId,
          updated_at: trx.fn.now(),
        });
      } else {
        await trx('copo_mapping_items').insert({
          college_id: actor.collegeId,
          mapping_version_id: versionId,
          course_id: version.course_id,
          course_outcome_id: row.courseOutcomeId,
          program_outcome_id: kind === 'PO' ? targetId : null,
          program_specific_outcome_id: kind === 'PSO' ? targetId : null,
          sdg_id: kind === 'SDG' ? targetId : null,
          correlation_strength: row.strength,
          ai_suggested: true,
          faculty_reviewed: true,
          created_by: actor.facultyUserId,
          updated_by: actor.facultyUserId,
        });
      }
    }
    await writeCopoAudit(
      {
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MAPPING_ACCEPT_SUGGESTIONS',
        mappingKind: kind,
        mappingVersionId: versionId,
        courseId: Number(version.course_id),
        metadata: { count: accepted.length },
      },
      trx,
    );
  });
  return getWorkspaceByVersion(actor, versionId);
}

export async function listDashboard(
  actor: CopoActor,
  filters: {
    schemeId?: number;
    programId?: number;
    semesterId?: number;
    academicYearId?: number;
    status?: string;
    facultyId?: number;
  },
) {
  const assigned = isFacultyScoped(actor.role) ? await assignedCourseIds(actor, filters.academicYearId) : null;
  const q = db('courses as c')
    .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
    .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
    .leftJoin('departments as d', 'd.id', 'c.department_id')
    .where('c.college_id', actor.collegeId)
    .modify((qb) => {
      if (filters.schemeId) qb.andWhere('c.scheme_id', filters.schemeId);
      if (filters.semesterId) qb.andWhere('c.semester_id', filters.semesterId);
      if (filters.programId) {
        qb.join('program_subjects as ps', 'ps.course_id', 'c.id').andWhere('ps.program_id', filters.programId);
      }
      if (assigned && assigned.length) qb.whereIn('c.id', assigned);
      if (actor.role === 'HOD' && actor.departmentId) qb.andWhere('c.department_id', actor.departmentId);
    })
    .select('c.*', 'sem.label as semester_label', 's.name as scheme_name', 's.code as scheme_code', 'd.name as department_name')
    .groupBy('c.id')
    .orderBy('c.code');
  const courses = (await q) as DbRow[];
  const courseIds = courses.map((c) => Number(c.id));
  const versions = (courseIds.length
    ? await db('copo_mapping_versions')
        .where({ college_id: actor.collegeId, is_current: true })
        .whereIn('course_id', courseIds)
        .modify((qb) => {
          if (filters.academicYearId) qb.andWhere({ academic_year_id: filters.academicYearId });
          if (filters.programId) qb.andWhere({ program_id: filters.programId });
        })
    : []) as DbRow[];
  const versionIds = versions.map((v) => Number(v.id));
  const items = (versionIds.length ? await db('copo_mapping_items').whereIn('mapping_version_id', versionIds) : []) as DbRow[];
  const coCounts = courseIds.length
    ? await db('course_outcomes')
        .where({ college_id: actor.collegeId, is_current: true })
        .whereIn('course_id', courseIds)
        .groupBy('course_id')
        .select('course_id')
        .count({ c: '*' })
    : [];
  const coMap = new Map(
    (coCounts as Array<{ course_id: number; c: string | number }>).map((r) => [Number(r.course_id), Number(r.c)]),
  );

  const rows = [];
  for (const course of courses) {
    const courseVersions = versions.filter((v) => Number(v.course_id) === Number(course.id));
    const byKind = (kind: MappingKind) => courseVersions.find((v) => (v.mapping_kind || 'PO') === kind);
    const poV = byKind('PO');
    const psoV = byKind('PSO');
    const sdgV = byKind('SDG');
    const version = poV || psoV || sdgV;
    const poStatus = displayStatus(Boolean(poV), poV?.status as string | undefined);
    const psoStatus = displayStatus(Boolean(psoV), psoV?.status as string | undefined);
    const sdgStatus = displayStatus(Boolean(sdgV), sdgV?.status as string | undefined);
    const overall = overallMappingLabel([poStatus, psoStatus, sdgStatus]);
    if (filters.status === 'NOT_STARTED' && version) continue;
    if (filters.status && filters.status !== 'NOT_STARTED' && !courseVersions.some((v) => v.status === filters.status)) continue;
    const versionItems = items.filter((i) => Number(i.mapping_version_id) === Number(poV?.id || 0) && i.correlation_strength != null);
    const coCount = coMap.get(Number(course.id)) ?? 0;
    const mappedCos = new Set(versionItems.map((i) => Number(i.course_outcome_id))).size;
    const mappedPos = new Set(versionItems.map((i) => Number(i.program_outcome_id))).size;
    const highCount = versionItems.filter((i) => Number(i.correlation_strength) === 3).length;
    const mediumCount = versionItems.filter((i) => Number(i.correlation_strength) === 2).length;
    const lowCount = versionItems.filter((i) => Number(i.correlation_strength) === 1).length;
    const missingJ = versionItems.filter((i) => !String(i.justification || '').trim()).length;
    const kindSlice = (kind: MappingKind, v?: DbRow) => {
      const kindItems = items.filter((i) => Number(i.mapping_version_id) === Number(v?.id || 0) && i.correlation_strength != null);
      return {
        mappingId: v ? Number(v.id) : null,
        versionNumber: v ? Number(v.version_number) : 0,
        status: displayStatus(Boolean(v), v?.status as string | undefined),
        mappingPercent: coCount === 0 ? 0 : Math.round((new Set(kindItems.map((i) => Number(i.course_outcome_id))).size / coCount) * 100),
      };
    };
    rows.push({
      courseId: Number(course.id),
      subjectCode: course.code,
      subjectName: course.name,
      semesterLabel: course.semester_label,
      schemeName: course.scheme_name,
      schemeCode: (course as { scheme_code?: string }).scheme_code || null,
      departmentName: course.department_name,
      mappingId: poV ? Number(poV.id) : version ? Number(version.id) : null,
      versionNumber: poV ? Number(poV.version_number) : 0,
      status: poStatus,
      po: kindSlice('PO', poV),
      pso: kindSlice('PSO', psoV),
      sdg: kindSlice('SDG', sdgV),
      overall,
      coCount,
      mappedPoCount: mappedPos,
      correlationCount: versionItems.length,
      highCount,
      mediumCount,
      lowCount,
      mappingPercent: coCount === 0 ? 0 : Math.round((mappedCos / coCount) * 100),
      justificationPercent:
        versionItems.length === 0 ? 0 : Math.round(((versionItems.length - missingJ) / versionItems.length) * 100),
    });
  }
  return { subjects: rows };
}

export async function listReviewQueue(
  actor: CopoActor,
  filters?: { mappingKind?: string; schemeId?: number; programId?: number; semesterId?: number; academicYearId?: number; status?: string; facultyId?: number },
) {
  if (!canApproveMappings(actor.role)) throw new AppError(403, 'Reviewer access required');
  const q = db('copo_mapping_versions as v')
    .join('courses as c', 'c.id', 'v.course_id')
    .leftJoin('faculty_users as f', 'f.id', 'v.submitted_by')
    .leftJoin('academic_years as y', 'y.id', 'v.academic_year_id')
    .leftJoin('programs as p', 'p.id', 'v.program_id')
    .leftJoin('academic_schemes as s', 's.id', 'v.scheme_id')
    .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
    .where('v.college_id', actor.collegeId)
    .where('v.is_current', true)
    .modify((qb) => {
      if (filters?.status) qb.andWhere('v.status', filters.status);
      else qb.whereIn('v.status', ['SUBMITTED', 'NEEDS_REVISION']);
      if (filters?.mappingKind) qb.andWhere('v.mapping_kind', filters.mappingKind);
      if (filters?.schemeId) qb.andWhere('v.scheme_id', filters.schemeId);
      if (filters?.programId) qb.andWhere('v.program_id', filters.programId);
      if (filters?.semesterId) qb.andWhere('c.semester_id', filters.semesterId);
      if (filters?.academicYearId) qb.andWhere('v.academic_year_id', filters.academicYearId);
      if (filters?.facultyId) qb.andWhere('v.submitted_by', filters.facultyId);
    })
    .select(
      'v.*',
      'c.code as course_code',
      'c.name as course_name',
      'c.department_id',
      'f.name as submitted_by_name',
      'y.label as academic_year_label',
      'p.name as program_name',
      's.name as scheme_name',
      'sem.label as semester_label',
    )
    .orderBy('v.submitted_at', 'desc');
  if (actor.role === 'HOD' && actor.departmentId) q.andWhere('c.department_id', actor.departmentId);
  const rows = (await q) as DbRow[];
  return {
    mappings: rows.map((r) => ({
      id: Number(r.id),
      courseId: Number(r.course_id),
      subjectCode: r.course_code,
      subjectName: r.course_name,
      status: r.status,
      mappingKind: r.mapping_kind || 'PO',
      mappingType: r.mapping_kind === 'PSO' ? 'CO–PSO' : r.mapping_kind === 'SDG' ? 'CO–SDG' : 'CO–PO',
      versionNumber: Number(r.version_number),
      submittedAt: r.submitted_at,
      submittedByName: r.submitted_by_name,
      academicYearLabel: r.academic_year_label,
      programName: r.program_name,
      schemeName: r.scheme_name,
      semesterLabel: r.semester_label,
    })),
  };
}

export async function programCoverage(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number) {
  const pos = await applicablePos(actor.collegeId, schemeId, programId);
  const versions = (await db('copo_mapping_versions')
    .where({ college_id: actor.collegeId, scheme_id: schemeId, is_current: true, status: 'APPROVED', mapping_kind: 'PO' })
    .modify((q) => {
      q.andWhere((b) => b.where({ program_id: programId }).orWhereNull('program_id'));
      if (academicYearId) q.andWhere({ academic_year_id: academicYearId });
    })) as DbRow[];
  const versionIds = versions.map((v) => Number(v.id));
  const items = (versionIds.length
    ? await db('copo_mapping_items as i')
        .join('courses as c', 'c.id', 'i.course_id')
        .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
        .leftJoin('course_outcomes as co', 'co.id', 'i.course_outcome_id')
        .whereIn('i.mapping_version_id', versionIds)
        .whereNotNull('i.correlation_strength')
        .select(
          'i.*',
          'c.code as course_code',
          'c.name as course_name',
          'sem.label as semester_label',
          'co.co_code',
          'co.statement as co_statement',
        )
    : []) as DbRow[];
  const rows = pos.outcomes.map((po) => {
    const related = items.filter((i) => Number(i.program_outcome_id) === po.id);
    const subjects = new Set(related.map((i) => Number(i.course_id)));
    return {
      po,
      subjectsContributing: subjects.size,
      contributingCos: new Set(related.map((i) => Number(i.course_outcome_id))).size,
      high: related.filter((i) => Number(i.correlation_strength) === 3).length,
      moderate: related.filter((i) => Number(i.correlation_strength) === 2).length,
      low: related.filter((i) => Number(i.correlation_strength) === 1).length,
      drilldown: related.map((i) => ({
        courseId: Number(i.course_id),
        subjectCode: i.course_code,
        subjectName: i.course_name,
        semesterLabel: i.semester_label,
        coCode: i.co_code,
        coStatement: i.co_statement,
        mappingVersionId: Number(i.mapping_version_id),
        strength: Number(i.correlation_strength),
        justification: i.justification,
      })),
    };
  });
  return { programmeOutcomes: pos.outcomes, rows };
}

export async function bloomsDistribution(collegeId: number, filters?: { schemeId?: number; semesterId?: number }) {
  const q = db('course_outcomes as co')
    .join('courses as c', 'c.id', 'co.course_id')
    .where('co.college_id', collegeId)
    .andWhere('co.is_current', true)
    .modify((qb) => {
      if (filters?.schemeId) qb.andWhere('c.scheme_id', filters.schemeId);
      if (filters?.semesterId) qb.andWhere('c.semester_id', filters.semesterId);
    })
    .select('c.id as course_id', 'c.code', 'c.name', 'c.semester_id', 'co.blooms_level');
  const rows = await q;
  const byCourse = new Map<number, { courseId: number; code: string; name: string; levels: Record<string, number> }>();
  for (const row of rows) {
    const rec = byCourse.get(Number(row.course_id)) ?? {
      courseId: Number(row.course_id),
      code: String(row.code),
      name: String(row.name),
      levels: { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0, UNSET: 0 },
    };
    const key = row.blooms_level ? String(row.blooms_level).toUpperCase() : 'UNSET';
    rec.levels[key] = (rec.levels[key] || 0) + 1;
    byCourse.set(Number(row.course_id), rec);
  }
  return { courses: [...byCourse.values()] };
}

export async function listAudit(collegeId: number, filters?: { courseId?: number; mappingVersionId?: number }) {
  const q = db('copo_audit_log').where({ college_id: collegeId }).orderBy('created_at', 'desc').limit(200);
  if (filters?.courseId) q.andWhere({ course_id: filters.courseId });
  if (filters?.mappingVersionId) q.andWhere({ mapping_version_id: filters.mappingVersionId });
  const rows = await q;
  return rows.map((r) => ({
    id: Number(r.id),
    action: r.action,
    actorName: r.actor_name,
    actorId: r.actor_id,
    courseId: r.course_id,
    mappingKind: r.mapping_kind,
    mappingVersionId: r.mapping_version_id,
    courseOutcomeId: r.course_outcome_id,
    programOutcomeId: r.program_outcome_id,
    programSpecificOutcomeId: r.program_specific_outcome_id,
    sdgId: r.sdg_id,
    previousValue: r.previous_value,
    newValue: r.new_value,
    createdAt: r.created_at,
  }));
}

export async function listVersions(
  actor: CopoActor,
  courseId: number,
  programId?: number,
  academicYearId?: number,
  mappingKind?: MappingKind,
) {
  await assertCourseInCollege(courseId, actor.collegeId);
  const rows = (await db('copo_mapping_versions')
    .where({ college_id: actor.collegeId, course_id: courseId })
    .modify((q) => {
      if (programId) q.andWhere({ program_id: programId });
      if (academicYearId) q.andWhere({ academic_year_id: academicYearId });
      if (mappingKind) q.andWhere({ mapping_kind: mappingKind });
    })
    .orderBy('mapping_kind')
    .orderBy('version_number', 'desc')) as DbRow[];
  return rows.map((r) => ({
    id: Number(r.id),
    mappingKind: r.mapping_kind || 'PO',
    versionNumber: Number(r.version_number),
    status: r.status,
    isCurrent: Boolean(r.is_current),
    academicYearId: r.academic_year_id,
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
  }));
}

function alignmentSummary(po: Awaited<ReturnType<typeof serializeWorkspace>>, pso: Awaited<ReturnType<typeof serializeWorkspace>>, sdg: Awaited<ReturnType<typeof serializeWorkspace>>) {
  return po.courseOutcomes.map((co) => ({
    courseOutcome: co,
    po: po.items
      .filter((i) => i.courseOutcomeId === co.id && i.strength)
      .map((i) => {
        const target = po.programOutcomes.find((p) => p.id === i.programOutcomeId);
        return { code: target?.code || 'PO', strength: i.strength, justification: i.justification };
      }),
    pso: pso.items
      .filter((i) => i.courseOutcomeId === co.id && i.strength)
      .map((i) => {
        const target = pso.programSpecificOutcomes.find((p) => p.id === i.programSpecificOutcomeId);
        return { code: target?.code || 'PSO', strength: i.strength, justification: i.justification };
      }),
    sdg: sdg.items
      .filter((i) => i.courseOutcomeId === co.id && i.strength)
      .map((i) => {
        const target = sdg.sdgs.find((s) => s.id === i.sdgId);
        return { code: target?.code || 'SDG', title: target?.officialTitle, strength: i.strength, justification: i.justification };
      }),
  }));
}

export async function getUnifiedWorkspace(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>) {
  const base = { ...query };
  const [po, pso, sdg] = await Promise.all([
    getWorkspace(actor, { ...base, mappingKind: 'PO' }),
    getWorkspace(actor, { ...base, mappingKind: 'PSO' }),
    getWorkspace(actor, { ...base, mappingKind: 'SDG' }),
  ]);
  const complete = (ws: typeof po) => {
    if (ws.mapping.status === 'APPROVED' || ws.mapping.status === 'SUBMITTED') return { label: 'Complete', percent: 100 };
    if (ws.courseOutcomes.length === 0) return { label: 'Not started', percent: 0 };
    const denom = ws.mappingKind === 'SDG' ? Math.max(ws.courseOutcomes.length, 1) : Math.max(ws.summary.possibleCells, 1);
    const percent = ws.mappingKind === 'SDG'
      ? Math.round((new Set(ws.items.filter((i) => i.strength).map((i) => i.courseOutcomeId)).size / denom) * 100)
      : ws.summary.mappedPercent;
    return { label: `${percent}%`, percent };
  };
  return {
    course: po.course,
    program: po.program || pso.program,
    academicYear: po.academicYear,
    courseOutcomes: po.courseOutcomes,
    sourceDocuments: po.sourceDocuments,
    permissions: po.permissions,
    po,
    pso,
    sdg,
    progress: {
      po: { status: po.mapping.status, ...complete(po) },
      pso: { status: pso.mapping.status, ...complete(pso) },
      sdg: { status: sdg.mapping.status, ...complete(sdg) },
      overall: overallMappingLabel([po.mapping.status, pso.mapping.status, sdg.mapping.status]),
    },
    alignment: alignmentSummary(po, pso, sdg),
  };
}

export async function submitAllOutcomeMappings(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>, confirm = false) {
  const kinds: MappingKind[] = ['PO', 'PSO', 'SDG'];
  const blocked: Array<{ mappingKind: MappingKind; reason: string }> = [];
  const ready: Array<{ mappingKind: MappingKind; versionId: number }> = [];
  const skipped: Array<{ mappingKind: MappingKind; reason: string }> = [];
  for (const kind of kinds) {
    const version = await findCurrentVersion({
      collegeId: actor.collegeId,
      courseId: query.courseId,
      programId: query.programId,
      academicYearId: query.academicYearId,
      mappingKind: kind,
    });
    if (!version) {
      skipped.push({ mappingKind: kind, reason: 'Not started' });
      continue;
    }
    if (!EDITABLE_MAPPING_STATUSES.includes(version.status) && version.status !== 'NOT_STARTED') {
      skipped.push({ mappingKind: kind, reason: `Currently ${version.status}` });
      continue;
    }
    try {
      const workspace = await serializeWorkspace(actor, version, query.courseId, query.programId, kind);
      if (workspace.courseOutcomes.length === 0) {
        blocked.push({ mappingKind: kind, reason: 'Official COs are not available' });
        continue;
      }
      if (kind === 'PO' && workspace.programOutcomes.length === 0) {
        blocked.push({ mappingKind: kind, reason: 'Official POs are not available' });
        continue;
      }
      if (kind === 'PSO' && workspace.programSpecificOutcomes.length === 0) {
        blocked.push({ mappingKind: kind, reason: 'Approved PSO data pending' });
        continue;
      }
      ready.push({ mappingKind: kind, versionId: Number(version.id) });
    } catch (err) {
      blocked.push({ mappingKind: kind, reason: err instanceof Error ? err.message : 'Cannot submit' });
    }
  }
  if (!confirm) {
    return { ready, blocked, skipped, submitted: [] as MappingKind[] };
  }
  if (blocked.length) {
    throw new AppError(400, `Cannot submit all mappings: ${blocked.map((b) => `${b.mappingKind} — ${b.reason}`).join('; ')}`);
  }
  const submitted: MappingKind[] = [];
  for (const row of ready) {
    await submitMapping(actor, row.versionId);
    submitted.push(row.mappingKind);
  }
  return { ready, blocked, skipped, submitted, workspace: await getUnifiedWorkspace(actor, query) };
}

export async function setRelevantSdgs(actor: CopoActor, versionId: number, sdgIds: number[], showAll = false) {
  const version = await loadVersion(actor.collegeId, versionId);
  await assertCanRead(actor, version);
  if (versionKind(version) !== 'SDG') throw new AppError(400, 'Relevant SDGs can only be set on a CO–SDG mapping');
  const assigned = await mappingFacultyIds(actor.collegeId, Number(version.course_id), version.academic_year_id as number | null);
  if (!canEditMapping(actor.role, version.status, isAssignedTo(actor, assigned))) {
    throw new AppError(403, 'This mapping is locked');
  }
  const official = await listOfficialSdgs(true);
  const valid = new Set(official.map((s) => s.id));
  for (const id of sdgIds) {
    if (!valid.has(id)) throw new AppError(400, 'Invalid SDG');
  }
  await db.transaction(async (trx) => {
    await trx('copo_mapping_relevant_sdgs').where({ mapping_version_id: versionId }).del();
    if (sdgIds.length) {
      await trx('copo_mapping_relevant_sdgs').insert(
        sdgIds.map((sdgId) => ({
          college_id: actor.collegeId,
          mapping_version_id: versionId,
          sdg_id: sdgId,
        })),
      );
    }
    await trx('copo_mapping_versions').where({ id: versionId }).update({
      show_all_sdgs: showAll,
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
  });
  return getWorkspaceByVersion(actor, versionId);
}
