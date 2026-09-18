import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { catalog as copoCatalog } from '../copo/masters.js';
import {
  courseCodeVariants,
  loadScopedMasterRows,
  missingAcademicMasterPayload,
  overlayByNaturalKey,
  scopeMasterQuery,
} from '../academicMaster/lookup.js';
import { canManageAllCbsPlans, type CbsActor } from './access.js';
import { listCbsAudit, recordCbsAudit } from './audit.js';
import {
  ASSESSMENT_TYPES,
  DELIVERY_METHODS,
  EVIDENCE_TYPES,
  ORIGIN_TYPES,
  friendlyOrigin,
  normalizeAssessment,
  normalizeDelivery,
  normalizeOrigin,
} from './types.js';

export const createPlanSchema = z.object({
  courseId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  programId: z.number().int().positive().nullable().optional(),
  semesterId: z.number().int().positive().nullable().optional(),
  schemeId: z.number().int().positive().nullable().optional(),
  selectedCbsIds: z.array(z.string().min(1)).optional(),
  allowEmptyCustom: z.boolean().optional(),
});

export const customItemSchema = z.object({
  title: z.string().min(1).max(512),
  contentDescription: z.string().max(8000).optional().nullable(),
  originType: z.enum(ORIGIN_TYPES),
  moduleUnit: z.string().max(128).optional().nullable(),
  relatedTopic: z.string().max(512).optional().nullable(),
  relatedGapId: z.string().max(64).optional().nullable(),
  primaryCo: z.string().min(1).max(32),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  plannedHours: z.number().positive().max(500).optional().nullable(),
  plannedDate: z.string().max(32).optional().nullable(),
  assessmentRequired: z.boolean().optional(),
  assessmentType: z.enum(ASSESSMENT_TYPES).optional().nullable(),
  rationale: z.string().min(1).max(8000),
  expectedBenefit: z.string().max(8000).optional().nullable(),
});

export const recommendedItemsSchema = z.object({
  cbsIds: z.array(z.string().min(1)).min(1),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  contentDescription: z.string().max(8000).optional().nullable(),
  originType: z.enum(ORIGIN_TYPES).optional(),
  moduleUnit: z.string().max(128).optional().nullable(),
  relatedTopic: z.string().max(512).optional().nullable(),
  relatedGapId: z.string().max(64).optional().nullable(),
  primaryCo: z.string().max(32).optional().nullable(),
  deliveryMethod: z.enum(DELIVERY_METHODS).optional().nullable(),
  plannedHours: z.number().positive().max(500).optional().nullable(),
  plannedDate: z.string().max(32).optional().nullable(),
  assessmentRequired: z.boolean().optional(),
  assessmentType: z.enum(ASSESSMENT_TYPES).optional().nullable(),
  includeInFormalAttainment: z.boolean().optional(),
  rationale: z.string().max(8000).optional().nullable(),
  expectedBenefit: z.string().max(8000).optional().nullable(),
  resources: z.string().max(8000).optional().nullable(),
  status: z.enum(['PLANNED', 'DELIVERED', 'ASSESSED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const deliverSchema = z.object({
  actualDate: z.string().min(1).max(32),
  actualHours: z.number().positive().max(500),
  deliveryNotes: z.string().max(8000).optional().nullable(),
  resources: z.string().max(8000).optional().nullable(),
  participants: z.number().int().min(0).max(100000).optional().nullable(),
  deliveryMethod: z.enum(DELIVERY_METHODS).optional().nullable(),
});

export const completeSchema = z.object({
  actualOutcome: z.string().min(1).max(8000),
  assessmentMethod: z.string().max(255).optional().nullable(),
  assessmentResult: z.string().max(4000).optional().nullable(),
  facultyObservation: z.string().max(4000).optional().nullable(),
  studentFeedbackSummary: z.string().max(4000).optional().nullable(),
  impactBenefit: z.string().max(4000).optional().nullable(),
  participants: z.number().int().min(0).optional().nullable(),
});

export const evidenceSchema = z.object({
  evidenceType: z.enum(EVIDENCE_TYPES),
  title: z.string().min(1).max(512),
  description: z.string().max(4000).optional().nullable(),
  externalUrl: z.string().url().max(1024).optional().nullable(),
  itemId: z.number().int().positive().optional().nullable(),
  fileName: z.string().max(512).optional().nullable(),
  mimeType: z.string().max(128).optional().nullable(),
  fileBase64: z.string().max(15_000_000).optional().nullable(),
});

export const linkQuizSchema = z.object({
  quizId: z.number().int().positive(),
  includeInFormalAttainment: z.boolean().optional(),
});

export const linkAssignmentSchema = z.object({
  assignmentId: z.number().int().positive(),
  includeInFormalAttainment: z.boolean().optional(),
});

export const fromGapSchema = z.object({
  gapAnalysisId: z.number().int().positive(),
  gapItemId: z.number().int().positive(),
  planId: z.number().int().positive().optional().nullable(),
});

type Row = Record<string, unknown>;

async function actorName(actorId: number) {
  const row = await db('faculty_users').where({ id: actorId }).first('name');
  return row?.name ? String(row.name) : null;
}

async function loadCourseContext(collegeId: number, input: z.infer<typeof createPlanSchema>) {
  const course = await db('courses as c')
    .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
    .leftJoin('departments as d', 'd.id', 'c.department_id')
    .where({ 'c.id': input.courseId, 'c.college_id': collegeId })
    .select(
      'c.id',
      'c.name',
      'c.code',
      'c.scheme_id as schemeId',
      'c.department_id as departmentId',
      'c.semester_id as semesterId',
      's.name as schemeName',
      'd.name as departmentName',
    )
    .first();
  if (!course) throw new AppError(404, 'Subject not found');

  const year = await db('academic_years').where({ id: input.academicYearId, college_id: collegeId }).first('id', 'label');
  if (!year) throw new AppError(400, 'Academic year not found');

  let program: Row | null = null;
  if (input.programId) {
    program = await db('programs').where({ id: input.programId, college_id: collegeId }).first('id', 'name');
    if (!program) throw new AppError(400, 'Program not found');
  }

  let semester: Row | null = null;
  const semesterId = input.semesterId ?? (course.semesterId as number | null);
  if (semesterId) semester = await db('semesters').where({ id: semesterId }).first('id', 'label', 'number');

  let scheme: Row | null = null;
  const schemeId = input.schemeId ?? (course.schemeId as number | null);
  if (schemeId) {
    scheme = await db('academic_schemes').where({ id: schemeId, college_id: collegeId }).first('id', 'name', 'code');
  }

  return { course, year, program, semester, scheme, schemeId, semesterId };
}

function summarizeItems(items: Array<Row>) {
  const planned = items.filter((i) => i.status === 'PLANNED').length;
  const delivered = items.filter((i) => ['DELIVERED', 'ASSESSED', 'COMPLETED'].includes(String(i.status))).length;
  const assessed = items.filter((i) => ['ASSESSED', 'COMPLETED'].includes(String(i.status))).length;
  const completed = items.filter((i) => i.status === 'COMPLETED').length;
  const plannedHours = items.reduce((s, i) => s + (Number(i.plannedHours ?? i.planned_hours) || 0), 0);
  const actualHours = items.reduce((s, i) => s + (Number(i.actualHours ?? i.actual_hours) || 0), 0);
  const byOrigin: Record<string, number> = {};
  for (const i of items) {
    const t = String(i.originType || i.origin_type || 'OTHER');
    byOrigin[t] = (byOrigin[t] || 0) + 1;
  }
  return {
    totalItems: items.length,
    planned,
    delivered,
    assessed,
    completed,
    plannedHours,
    actualHours,
    byOrigin,
  };
}

async function findExistingActive(
  collegeId: number,
  facultyUserId: number,
  input: {
    courseId: number;
    academicYearId: number;
    programId?: number | null;
    semesterId?: number | null;
    schemeId?: number | null;
  },
) {
  let q = db('faculty_cbs_plans')
    .where({
      college_id: collegeId,
      created_by: facultyUserId,
      course_id: input.courseId,
      academic_year_id: input.academicYearId,
    })
    .whereNot('status', 'ARCHIVED');
  if (input.programId != null) q = q.andWhere('program_id', input.programId);
  else q = q.whereNull('program_id');
  if (input.semesterId != null) q = q.andWhere('semester_id', input.semesterId);
  else q = q.whereNull('semester_id');
  if (input.schemeId != null) q = q.andWhere('scheme_id', input.schemeId);
  else q = q.whereNull('scheme_id');
  return q.first('id');
}

async function loadMastersForCourse(collegeId: number, courseId: number, courseCode: string) {
  const rows = await loadScopedMasterRows(db, 'cbs_masters', collegeId, {
    courseId,
    courseCode,
    orderBy: 'cbs_id',
  });
  return overlayByNaturalKey(rows, (row) => String(row.cbs_id));
}

async function loadCbsChildren(
  table: string,
  collegeId: number,
  cbsIds: string[],
  keyFn: (row: Record<string, any>) => string,
) {
  if (!cbsIds.length) return [];
  const rows = await scopeMasterQuery(db(table), collegeId).whereIn('cbs_id', cbsIds);
  return overlayByNaturalKey(rows, keyFn);
}

async function deriveLiveOutcomes(collegeId: number, courseId: number, coCodes: string[]) {
  if (!coCodes.length) return [];
  const cos = await db('course_outcomes')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .whereIn('co_code', coCodes)
    .select('id', 'co_code as code');
  if (!cos.length) return [];
  const coIds = cos.map((c) => Number(c.id));
  const coById = new Map(cos.map((c) => [Number(c.id), String(c.code)]));

  const versions = await db('copo_mapping_versions')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .whereNull('source_mapping_version_id')
    .select('id');
  if (!versions.length) return [];

  const items = await db('copo_mapping_items')
    .whereIn(
      'mapping_version_id',
      versions.map((v) => Number(v.id)),
    )
    .whereIn('course_outcome_id', coIds)
    .whereNotNull('correlation_strength')
    .select('*');

  const out: Array<{ coCode: string; outcomeType: string; outcomeCode: string; strength: number; derivedFrom: string }> =
    [];
  for (const item of items) {
    const coCode = coById.get(Number(item.course_outcome_id));
    if (!coCode) continue;
    const strength = Number(item.correlation_strength);
    if (item.program_outcome_id) {
      const po = await db('program_outcomes').where({ id: item.program_outcome_id }).first('po_number');
      if (po) {
        out.push({
          coCode,
          outcomeType: 'PO',
          outcomeCode: `PO${po.po_number}`,
          strength,
          derivedFrom: 'Academic Mapping (CO→PO)',
        });
      }
    }
    if (item.program_specific_outcome_id) {
      const pso = await db('program_specific_outcomes').where({ id: item.program_specific_outcome_id }).first('pso_code');
      if (pso) {
        out.push({
          coCode,
          outcomeType: 'PSO',
          outcomeCode: String(pso.pso_code),
          strength,
          derivedFrom: 'Academic Mapping (CO→PSO)',
        });
      }
    }
    if (item.sdg_id) {
      const sdg = await db('sustainable_development_goals').where({ id: item.sdg_id }).first('sdg_code');
      if (sdg) {
        out.push({
          coCode,
          outcomeType: 'SDG',
          outcomeCode: String(sdg.sdg_code),
          strength,
          derivedFrom: 'Academic Mapping (CO→SDG)',
        });
      }
    }
  }
  return out;
}

function evidenceUploadDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../uploads/cbs-evidence');
}

export async function getCatalog(collegeId: number) {
  return copoCatalog(collegeId);
}

export async function listPlans(
  actor: CbsActor,
  filters: {
    academicYearId?: number;
    programId?: number;
    semesterId?: number;
    courseId?: number;
    status?: string;
    facultyId?: number;
    departmentId?: number;
  } = {},
) {
  const q = db('faculty_cbs_plans as a')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
    .where('a.college_id', actor.collegeId)
    .select(
      'a.id',
      'a.status',
      'a.subject_name as subjectName',
      'a.course_code as courseCode',
      'a.scheme_label as schemeLabel',
      'a.program_name as programName',
      'a.semester_label as semesterLabel',
      'a.academic_year_label as academicYearLabel',
      'a.updated_at as updatedAt',
      'a.created_by as createdBy',
      'f.name as facultyName',
      'c.department_id as departmentId',
    )
    .orderBy('a.updated_at', 'desc');

  if (!canManageAllCbsPlans(actor.role) && actor.role === 'FACULTY') {
    q.andWhere('a.created_by', actor.facultyUserId);
  } else if (filters.facultyId) {
    q.andWhere('a.created_by', filters.facultyId);
  }

  if (filters.academicYearId) q.andWhere('a.academic_year_id', filters.academicYearId);
  if (filters.programId) q.andWhere('a.program_id', filters.programId);
  if (filters.semesterId) q.andWhere('a.semester_id', filters.semesterId);
  if (filters.courseId) q.andWhere('a.course_id', filters.courseId);
  if (filters.status) q.andWhere('a.status', filters.status);
  if (filters.departmentId) q.andWhere('c.department_id', filters.departmentId);

  const rows = await q;
  const out = [];
  for (const row of rows) {
    const items = await db('faculty_cbs_plan_items')
      .where({ plan_id: row.id })
      .select('status', 'planned_hours as plannedHours', 'actual_hours as actualHours', 'origin_type as originType');
    const summary = summarizeItems(items);
    out.push({
      id: Number(row.id),
      subjectName: row.subjectName,
      courseCode: row.courseCode,
      schemeLabel: row.schemeLabel,
      programName: row.programName,
      semesterLabel: row.semesterLabel,
      academicYearLabel: row.academicYearLabel,
      status: row.status,
      updatedAt: row.updatedAt,
      createdBy: Number(row.createdBy),
      facultyName: row.facultyName,
      ...summary,
    });
  }
  return { plans: out };
}

export async function previewGeneration(actor: CbsActor, input: z.infer<typeof createPlanSchema>) {
  const ctx = await loadCourseContext(actor.collegeId, input);
  const masters = await loadMastersForCourse(actor.collegeId, input.courseId, String(ctx.course.code));
  const existing = await findExistingActive(actor.collegeId, actor.facultyUserId, {
    ...input,
    schemeId: input.schemeId ?? (ctx.schemeId as number | null) ?? undefined,
    semesterId: input.semesterId ?? (ctx.semesterId as number | null) ?? undefined,
  });

  if (!masters.length) {
    return {
      ...missingAcademicMasterPayload({
        subjectCode: String(ctx.course.code),
        subjectName: String(ctx.course.name),
        scheme: String(ctx.scheme?.name || ctx.course.schemeName || '') || null,
        semester: ctx.semester?.label
          ? String(ctx.semester.label)
          : ctx.semester?.number != null
            ? `Semester ${ctx.semester.number}`
            : null,
        missing: ['Beyond-Syllabus master'],
      }),
      course: {
        id: Number(ctx.course.id),
        name: ctx.course.name,
        code: ctx.course.code,
        schemeName: ctx.scheme?.name || ctx.course.schemeName,
      },
      existingPlanId: existing ? Number(existing.id) : null,
    };
  }

  const cbsIds = masters.map((m) => String(m.cbs_id));
  const coLinks = await loadCbsChildren(
    'cbs_master_co_links',
    actor.collegeId,
    cbsIds,
    (row) => `${row.cbs_id}:${row.co_code}`,
  );
  const gapLinked = masters.filter((m) => m.related_gap_id || m.origin_type === 'GAP_ANALYSIS').length;
  const industryEmerging = masters.filter((m) =>
    ['INDUSTRY_REQUIREMENT', 'EMERGING_TECHNOLOGY'].includes(String(m.origin_type)),
  ).length;
  const advanced = masters.filter((m) => m.origin_type === 'ADVANCED_LEARNING').length;
  const relatedCos = new Set(coLinks.map((c) => String(c.co_code))).size;

  return {
    found: true,
    course: {
      id: Number(ctx.course.id),
      name: ctx.course.name,
      code: ctx.course.code,
      schemeName: ctx.scheme?.name || ctx.course.schemeName || masters[0].scheme_label,
    },
    counts: {
      recommendedTopics: masters.length,
      gapLinked,
      industryEmerging,
      advancedLearning: advanced,
      relatedCos,
    },
    recommendations: masters.map((m) => ({
      cbsId: m.cbs_id,
      title: m.title,
      originType: m.origin_type,
      originLabel: friendlyOrigin(String(m.origin_type)),
      moduleUnit: m.module_unit,
      suggestedCo: m.suggested_co,
      suggestedHours: m.suggested_hours,
      relatedGapId: m.related_gap_id,
      verificationStatus: m.verification_status,
    })),
    existingPlanId: existing ? Number(existing.id) : null,
  };
}

export async function createFromMaster(actor: CbsActor, input: z.infer<typeof createPlanSchema>) {
  const ctx = await loadCourseContext(actor.collegeId, input);
  const schemeId = input.schemeId ?? (ctx.schemeId as number | null) ?? null;
  const semesterId = input.semesterId ?? (ctx.semesterId as number | null) ?? null;
  const normalizedInput = { ...input, schemeId: schemeId ?? undefined, semesterId: semesterId ?? undefined };

  const existing = await findExistingActive(actor.collegeId, actor.facultyUserId, normalizedInput);
  if (existing) {
    throw new AppError(
      409,
      'Beyond-Syllabus plan already exists.',
      { existingPlanId: Number(existing.id) },
      'DUPLICATE_CBS_PLAN',
    );
  }

  let masters = await loadMastersForCourse(actor.collegeId, input.courseId, String(ctx.course.code));
  if (input.selectedCbsIds?.length) {
    const set = new Set(input.selectedCbsIds);
    masters = masters.filter((m) => set.has(String(m.cbs_id)));
  }

  if (!masters.length && !input.allowEmptyCustom) {
    throw new AppError(
      400,
      'Academic master data for this subject has not yet been configured.',
      missingAcademicMasterPayload({
        subjectCode: String(ctx.course.code),
        subjectName: String(ctx.course.name),
        scheme: String(ctx.scheme?.name || ctx.course.schemeName || '') || null,
        semester: ctx.semester?.label
          ? String(ctx.semester.label)
          : ctx.semester?.number != null
            ? `Semester ${ctx.semester.number}`
            : null,
        missing: ['Beyond-Syllabus master'],
      }).diagnostics,
      'NO_CBS_MASTER',
    );
  }

  const cbsIds = masters.map((m) => String(m.cbs_id));
  const coLinks = cbsIds.length
    ? await loadCbsChildren('cbs_master_co_links', actor.collegeId, cbsIds, (row) => `${row.cbs_id}:${row.co_code}`)
    : [];
  const actions = cbsIds.length
    ? await loadCbsChildren('cbs_master_actions', actor.collegeId, cbsIds, (row) => String(row.action_id))
    : [];
  const sources = cbsIds.length
    ? await loadCbsChildren('cbs_master_sources', actor.collegeId, cbsIds, (row) => String(row.source_id))
    : [];

  const cos = await db('course_outcomes')
    .where({ college_id: actor.collegeId, course_id: input.courseId, is_current: true })
    .select('co_code as code', 'statement');
  const coMap = new Map(cos.map((c) => [String(c.code).toUpperCase(), String(c.statement || '')]));
  const name = await actorName(actor.facultyUserId);

  const planId = await db.transaction(async (trx) => {
    const [id] = await trx('faculty_cbs_plans').insert({
      college_id: actor.collegeId,
      created_by: actor.facultyUserId,
      course_id: input.courseId,
      academic_year_id: input.academicYearId,
      program_id: input.programId ?? null,
      semester_id: semesterId,
      scheme_id: schemeId,
      department_id: ctx.course.departmentId ?? null,
      subject_name: ctx.course.name,
      course_code: ctx.course.code,
      scheme_label: ctx.scheme?.name || ctx.course.schemeName || masters[0]?.scheme_label || null,
      program_name: ctx.program?.name || masters[0]?.program_name || null,
      semester_label:
        ctx.semester?.label ||
        (ctx.semester?.number != null ? `Semester ${ctx.semester.number}` : masters[0]?.semester_label || null),
      academic_year_label: ctx.year.label,
      status: masters.length ? 'IN_PROGRESS' : 'DRAFT',
      import_batch: masters[0]?.import_batch || null,
      snapshot_meta: JSON.stringify({
        cbsIds,
        masterCount: masters.length,
        importedAt: new Date().toISOString(),
      }),
    });

    let serial = 1;
    for (const master of masters) {
      const cbsId = String(master.cbs_id);
      const masterCos = coLinks.filter((c) => c.cbs_id === cbsId);
      const masterActions = actions.filter((a) => a.cbs_id === cbsId);
      const masterSources = sources.filter((s) => s.cbs_id === cbsId);
      const assessmentType = normalizeAssessment(master.suggested_assessment);
      const assessmentRequired = assessmentType !== 'NONE';

      const [itemId] = await trx('faculty_cbs_plan_items').insert({
        plan_id: id,
        cbs_master_id: master.id,
        cbs_id: cbsId,
        serial_no: serial++,
        title: master.title,
        content_description: master.content_description,
        origin_type: master.origin_type,
        related_gap_id: master.related_gap_id,
        rationale: master.rationale,
        expected_benefit: master.expected_benefit,
        module_unit: master.module_unit,
        related_topic: master.related_topic,
        primary_co: master.suggested_co,
        suggested_delivery_method: master.suggested_delivery_method,
        delivery_method: master.suggested_delivery_method,
        planned_hours: master.suggested_hours,
        assessment_required: assessmentRequired,
        assessment_type: assessmentType,
        include_in_formal_attainment: false,
        status: 'PLANNED',
        priority: master.priority,
        source_type: master.source_type,
        source_reference: master.source_reference,
        mapping_origin: master.mapping_origin,
        verification_status: master.verification_status,
        is_custom: false,
        snapshot_json: JSON.stringify({
          master,
          coLinks: masterCos,
          actions: masterActions,
          sources: masterSources,
        }),
      });

      const primary = master.suggested_co ? String(master.suggested_co).toUpperCase() : null;
      const linkedCos = masterCos.length
        ? masterCos
        : primary
          ? [{ co_code: primary, relationship: 'PRIMARY', verification_status: master.verification_status }]
          : [];

      for (const link of linkedCos) {
        await trx('faculty_cbs_item_co_links').insert({
          item_id: itemId,
          co_code: link.co_code,
          co_statement: coMap.get(String(link.co_code).toUpperCase()) || null,
          relationship: link.relationship || (String(link.co_code).toUpperCase() === primary ? 'PRIMARY' : 'SECONDARY'),
          verification_status: link.verification_status || null,
        });
      }
    }

    return Number(id);
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    actorId: actor.facultyUserId,
    actorName: name,
    action: 'CBS_PLAN_CREATED',
    metadata: { itemCount: masters.length, courseId: input.courseId },
  });

  return getPlan(planId, actor.collegeId);
}

export async function getPlan(planId: number, collegeId: number) {
  const header = await db('faculty_cbs_plans as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
    .leftJoin('colleges as col', 'col.id', 'a.college_id')
    .leftJoin('departments as d', 'd.id', 'a.department_id')
    .where({ 'a.id': planId, 'a.college_id': collegeId })
    .select('a.*', 'f.name as facultyName', 'col.name as collegeName', 'col.logo_url as logoUrl', 'd.name as departmentName')
    .first();
  if (!header) throw new AppError(404, 'Beyond-Syllabus plan not found');

  const items = await db('faculty_cbs_plan_items').where({ plan_id: planId }).orderBy('serial_no').select('*');
  const itemIds = items.map((i) => Number(i.id));
  const coLinks = itemIds.length ? await db('faculty_cbs_item_co_links').whereIn('item_id', itemIds) : [];
  const assessmentLinks = itemIds.length
    ? await db('faculty_cbs_assessment_links').whereIn('item_id', itemIds)
    : [];
  const evidence = await db('faculty_cbs_evidence').where({ plan_id: planId }).orderBy('id');

  const availableMaster = await loadMastersForCourse(collegeId, Number(header.course_id), String(header.course_code));
  const used = new Set(items.map((i) => String(i.cbs_id)));
  const availableRecommendations = availableMaster
    .filter((m) => !used.has(String(m.cbs_id)))
    .map((m) => ({
      cbsId: m.cbs_id,
      title: m.title,
      originType: m.origin_type,
      originLabel: friendlyOrigin(String(m.origin_type)),
      moduleUnit: m.module_unit,
      suggestedCo: m.suggested_co,
      suggestedHours: m.suggested_hours,
      relatedGapId: m.related_gap_id,
    }));

  const detailed = [];
  for (const item of items) {
    const cos = coLinks.filter((c) => Number(c.item_id) === Number(item.id));
    const coCodes = cos.map((c) => String(c.co_code));
    if (item.primary_co && !coCodes.includes(String(item.primary_co))) coCodes.push(String(item.primary_co));
    const outcomes = await deriveLiveOutcomes(collegeId, Number(header.course_id), coCodes);
    const links = assessmentLinks.filter((a) => Number(a.item_id) === Number(item.id));
    const itemEvidence = evidence.filter((e) => Number(e.item_id) === Number(item.id));

    detailed.push({
      id: Number(item.id),
      cbsId: item.cbs_id,
      serialNo: Number(item.serial_no),
      title: item.title,
      contentDescription: item.content_description,
      originType: item.origin_type,
      originLabel: friendlyOrigin(String(item.origin_type)),
      relatedGapId: item.related_gap_id,
      rationale: item.rationale,
      expectedBenefit: item.expected_benefit,
      moduleUnit: item.module_unit,
      relatedTopic: item.related_topic,
      primaryCo: item.primary_co,
      deliveryMethod: item.delivery_method,
      suggestedDeliveryMethod: item.suggested_delivery_method,
      plannedHours: item.planned_hours != null ? Number(item.planned_hours) : null,
      actualHours: item.actual_hours != null ? Number(item.actual_hours) : null,
      plannedDate: item.planned_date,
      actualDate: item.actual_date,
      assessmentRequired: Boolean(item.assessment_required),
      assessmentType: item.assessment_type,
      includeInFormalAttainment: Boolean(item.include_in_formal_attainment),
      status: item.status,
      resources: item.resources,
      deliveryNotes: item.delivery_notes,
      participants: item.participants,
      actualOutcome: item.actual_outcome,
      assessmentMethod: item.assessment_method,
      assessmentResult: item.assessment_result,
      facultyObservation: item.faculty_observation,
      studentFeedbackSummary: item.student_feedback_summary,
      impactBenefit: item.impact_benefit,
      priority: item.priority,
      verificationStatus: item.verification_status,
      isCustom: Boolean(item.is_custom),
      cos: cos.map((c) => ({
        coCode: c.co_code,
        statement: c.co_statement,
        relationship: c.relationship,
      })),
      outcomes,
      assessments: links.map((l) => ({
        id: Number(l.id),
        kind: l.assessment_kind,
        quizId: l.quiz_id,
        assignmentId: l.assignment_id,
        includeInFormalAttainment: Boolean(l.include_in_formal_attainment),
      })),
      evidence: itemEvidence.map((e) => ({
        id: Number(e.id),
        evidenceType: e.evidence_type,
        title: e.title,
        description: e.description,
        fileName: e.file_name,
        externalUrl: e.external_url,
        uploadedAt: e.created_at,
      })),
    });
  }

  const summary = summarizeItems(
    detailed.map((d) => ({
      status: d.status,
      plannedHours: d.plannedHours,
      actualHours: d.actualHours,
      originType: d.originType,
    })),
  );

  return {
    id: Number(header.id),
    status: header.status,
    subjectName: header.subject_name,
    courseCode: header.course_code,
    courseId: Number(header.course_id),
    schemeLabel: header.scheme_label,
    programName: header.program_name,
    semesterLabel: header.semester_label,
    academicYearLabel: header.academic_year_label,
    academicYearId: header.academic_year_id,
    preparedBy: header.facultyName,
    createdBy: Number(header.created_by),
    collegeName: header.collegeName,
    logoUrl: header.logoUrl,
    departmentName: header.departmentName,
    updatedAt: header.updated_at,
    completedAt: header.completed_at,
    summary,
    items: detailed,
    availableRecommendations,
    evidence: evidence.map((e) => ({
      id: Number(e.id),
      itemId: e.item_id,
      evidenceType: e.evidence_type,
      title: e.title,
      description: e.description,
      fileName: e.file_name,
      externalUrl: e.external_url,
      uploadedAt: e.created_at,
    })),
  };
}

async function nextSerial(planId: number) {
  const row = await db('faculty_cbs_plan_items').where({ plan_id: planId }).max<{ m: number | null }>('serial_no as m').first();
  return Number(row?.m || 0) + 1;
}

export async function addRecommendedItems(
  planId: number,
  actor: CbsActor,
  body: z.infer<typeof recommendedItemsSchema>,
) {
  const plan = await db('faculty_cbs_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');

  const q = scopeMasterQuery(db('cbs_masters').where({ is_active: true }).whereIn('cbs_id', body.cbsIds), actor.collegeId);
  const masters = overlayByNaturalKey(await q, (row) => String(row.cbs_id));
  if (!masters.length) throw new AppError(400, 'No matching master recommendations found');

  const existing = await db('faculty_cbs_plan_items').where({ plan_id: planId }).whereIn('cbs_id', body.cbsIds);
  if (existing.length) {
    throw new AppError(409, 'One or more recommendations are already in this plan');
  }

  const coLinks = await loadCbsChildren(
    'cbs_master_co_links',
    actor.collegeId,
    masters.map((m) => String(m.cbs_id)),
    (row) => `${row.cbs_id}:${row.co_code}`,
  );
  const cos = await db('course_outcomes')
    .where({ college_id: actor.collegeId, course_id: plan.course_id, is_current: true })
    .select('co_code as code', 'statement');
  const coMap = new Map(cos.map((c) => [String(c.code).toUpperCase(), String(c.statement || '')]));
  const name = await actorName(actor.facultyUserId);
  let serial = await nextSerial(planId);

  await db.transaction(async (trx) => {
    for (const master of masters) {
      const assessmentType = normalizeAssessment(master.suggested_assessment);
      const [itemId] = await trx('faculty_cbs_plan_items').insert({
        plan_id: planId,
        cbs_master_id: master.id,
        cbs_id: master.cbs_id,
        serial_no: serial++,
        title: master.title,
        content_description: master.content_description,
        origin_type: master.origin_type,
        related_gap_id: master.related_gap_id,
        rationale: master.rationale,
        expected_benefit: master.expected_benefit,
        module_unit: master.module_unit,
        related_topic: master.related_topic,
        primary_co: master.suggested_co,
        suggested_delivery_method: master.suggested_delivery_method,
        delivery_method: master.suggested_delivery_method,
        planned_hours: master.suggested_hours,
        assessment_required: assessmentType !== 'NONE',
        assessment_type: assessmentType,
        include_in_formal_attainment: false,
        status: 'PLANNED',
        priority: master.priority,
        source_type: master.source_type,
        source_reference: master.source_reference,
        mapping_origin: master.mapping_origin,
        verification_status: master.verification_status,
        is_custom: false,
        snapshot_json: JSON.stringify({ master }),
      });
      const links = coLinks.filter((c) => c.cbs_id === master.cbs_id);
      const primary = master.suggested_co ? String(master.suggested_co).toUpperCase() : null;
      const toInsert = links.length
        ? links
        : primary
          ? [{ co_code: primary, relationship: 'PRIMARY', verification_status: null }]
          : [];
      for (const link of toInsert) {
        await trx('faculty_cbs_item_co_links').insert({
          item_id: itemId,
          co_code: link.co_code,
          co_statement: coMap.get(String(link.co_code).toUpperCase()) || null,
          relationship: link.relationship || 'PRIMARY',
          verification_status: link.verification_status || null,
        });
      }
    }
    await trx('faculty_cbs_plans').where({ id: planId }).update({
      status: plan.status === 'DRAFT' ? 'IN_PROGRESS' : plan.status,
      updated_at: trx.fn.now(),
    });
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    actorId: actor.facultyUserId,
    actorName: name,
    action: 'CBS_ITEMS_ADDED_FROM_MASTER',
    metadata: { cbsIds: body.cbsIds },
  });

  return getPlan(planId, actor.collegeId);
}

export async function addCustomItem(planId: number, actor: CbsActor, body: z.infer<typeof customItemSchema>) {
  const plan = await db('faculty_cbs_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');

  const co = await db('course_outcomes')
    .where({
      college_id: actor.collegeId,
      course_id: plan.course_id,
      co_code: body.primaryCo.toUpperCase(),
      is_current: true,
    })
    .first('co_code', 'statement');
  if (!co) throw new AppError(400, 'Primary CO must be a valid course outcome for this subject');

  const cbsId = `CBS-CUSTOM-${nanoid(8).toUpperCase()}`;
  const assessmentType = body.assessmentType ? normalizeAssessment(body.assessmentType) : 'NONE';
  const name = await actorName(actor.facultyUserId);
  const serial = await nextSerial(planId);

  const [itemId] = await db('faculty_cbs_plan_items').insert({
    plan_id: planId,
    cbs_master_id: null,
    cbs_id: cbsId,
    serial_no: serial,
    title: body.title,
    content_description: body.contentDescription ?? null,
    origin_type: normalizeOrigin(body.originType),
    related_gap_id: body.relatedGapId ?? null,
    rationale: body.rationale,
    expected_benefit: body.expectedBenefit ?? null,
    module_unit: body.moduleUnit ?? null,
    related_topic: body.relatedTopic ?? null,
    primary_co: body.primaryCo.toUpperCase(),
    suggested_delivery_method: body.deliveryMethod,
    delivery_method: body.deliveryMethod,
    planned_hours: body.plannedHours ?? null,
    planned_date: body.plannedDate ?? null,
    assessment_required: body.assessmentRequired ?? assessmentType !== 'NONE',
    assessment_type: assessmentType,
    include_in_formal_attainment: false,
    status: 'PLANNED',
    is_custom: true,
    snapshot_json: JSON.stringify({ custom: true, createdAt: new Date().toISOString() }),
  });

  await db('faculty_cbs_item_co_links').insert({
    item_id: itemId,
    co_code: String(co.co_code),
    co_statement: co.statement || null,
    relationship: 'PRIMARY',
  });

  await db('faculty_cbs_plans').where({ id: planId }).update({
    status: plan.status === 'DRAFT' ? 'IN_PROGRESS' : plan.status,
    updated_at: db.fn.now(),
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId: Number(itemId),
    actorId: actor.facultyUserId,
    actorName: name,
    action: 'CBS_CUSTOM_ITEM_ADDED',
    metadata: { cbsId, title: body.title },
  });

  return getPlan(planId, actor.collegeId);
}

export async function updateItem(
  planId: number,
  itemId: number,
  actor: CbsActor,
  body: z.infer<typeof updateItemSchema>,
) {
  const item = await db('faculty_cbs_plan_items').where({ id: itemId, plan_id: planId }).first();
  if (!item) throw new AppError(404, 'Plan item not found');

  if (body.primaryCo) {
    const plan = await db('faculty_cbs_plans').where({ id: planId }).first('course_id', 'college_id');
    const co = await db('course_outcomes')
      .where({
        college_id: plan.college_id,
        course_id: plan.course_id,
        co_code: body.primaryCo.toUpperCase(),
        is_current: true,
      })
      .first('id');
    if (!co) throw new AppError(400, 'Primary CO must be a valid course outcome for this subject');
  }

  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  if (body.title != null) patch.title = body.title;
  if (body.contentDescription !== undefined) patch.content_description = body.contentDescription;
  if (body.originType != null) patch.origin_type = body.originType;
  if (body.moduleUnit !== undefined) patch.module_unit = body.moduleUnit;
  if (body.relatedTopic !== undefined) patch.related_topic = body.relatedTopic;
  if (body.relatedGapId !== undefined) patch.related_gap_id = body.relatedGapId;
  if (body.primaryCo !== undefined) patch.primary_co = body.primaryCo ? body.primaryCo.toUpperCase() : null;
  if (body.deliveryMethod !== undefined) patch.delivery_method = body.deliveryMethod;
  if (body.plannedHours !== undefined) patch.planned_hours = body.plannedHours;
  if (body.plannedDate !== undefined) patch.planned_date = body.plannedDate;
  if (body.assessmentRequired !== undefined) patch.assessment_required = body.assessmentRequired;
  if (body.assessmentType !== undefined) patch.assessment_type = body.assessmentType;
  if (body.includeInFormalAttainment !== undefined) {
    patch.include_in_formal_attainment = body.includeInFormalAttainment;
  }
  if (body.rationale !== undefined) patch.rationale = body.rationale;
  if (body.expectedBenefit !== undefined) patch.expected_benefit = body.expectedBenefit;
  if (body.resources !== undefined) patch.resources = body.resources;
  if (body.status != null) patch.status = body.status;

  await db('faculty_cbs_plan_items').where({ id: itemId }).update(patch);

  if (body.includeInFormalAttainment !== undefined) {
    await recordCbsAudit({
      collegeId: actor.collegeId,
      planId,
      itemId,
      actorId: actor.facultyUserId,
      actorName: await actorName(actor.facultyUserId),
      action: 'CBS_FORMAL_ATTAINMENT_FLAG',
      metadata: { includeInFormalAttainment: body.includeInFormalAttainment },
    });
  }

  return getPlan(planId, actor.collegeId);
}

export async function markDelivered(
  planId: number,
  itemId: number,
  actor: CbsActor,
  body: z.infer<typeof deliverSchema>,
) {
  const item = await db('faculty_cbs_plan_items').where({ id: itemId, plan_id: planId }).first();
  if (!item) throw new AppError(404, 'Plan item not found');
  if (item.status === 'CANCELLED') throw new AppError(400, 'Cancelled items cannot be delivered');

  await db('faculty_cbs_plan_items').where({ id: itemId }).update({
    actual_date: body.actualDate,
    actual_hours: body.actualHours,
    delivery_notes: body.deliveryNotes ?? null,
    resources: body.resources ?? item.resources,
    participants: body.participants ?? null,
    delivery_method: body.deliveryMethod ?? item.delivery_method,
    status: 'DELIVERED',
    delivered_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'CBS_ITEM_DELIVERED',
    metadata: { actualDate: body.actualDate, actualHours: body.actualHours },
  });

  return getPlan(planId, actor.collegeId);
}

export async function completeItem(
  planId: number,
  itemId: number,
  actor: CbsActor,
  body: z.infer<typeof completeSchema>,
) {
  const item = await db('faculty_cbs_plan_items').where({ id: itemId, plan_id: planId }).first();
  if (!item) throw new AppError(404, 'Plan item not found');
  if (!['DELIVERED', 'ASSESSED'].includes(String(item.status))) {
    throw new AppError(400, 'Item must be delivered before completion');
  }
  if (!item.actual_date || item.actual_hours == null) {
    throw new AppError(400, 'Actual delivery date and hours are required');
  }
  if (item.assessment_required) {
    const link = await db('faculty_cbs_assessment_links').where({ item_id: itemId }).first('id');
    if (!link) throw new AppError(400, 'Assessment is required — link a quiz or assignment first');
  }

  await db('faculty_cbs_plan_items').where({ id: itemId }).update({
    actual_outcome: body.actualOutcome,
    assessment_method: body.assessmentMethod ?? item.assessment_method,
    assessment_result: body.assessmentResult ?? null,
    faculty_observation: body.facultyObservation ?? null,
    student_feedback_summary: body.studentFeedbackSummary ?? null,
    impact_benefit: body.impactBenefit ?? null,
    participants: body.participants ?? item.participants,
    status: 'COMPLETED',
    completed_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'CBS_ITEM_COMPLETED',
    metadata: { outcome: body.actualOutcome.slice(0, 200) },
  });

  return getPlan(planId, actor.collegeId);
}

export async function addEvidence(planId: number, actor: CbsActor, body: z.infer<typeof evidenceSchema>) {
  const plan = await db('faculty_cbs_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');
  if (body.itemId) {
    const item = await db('faculty_cbs_plan_items').where({ id: body.itemId, plan_id: planId }).first('id');
    if (!item) throw new AppError(404, 'Plan item not found');
  }

  let storageKey: string | null = null;
  let fileSize: number | null = null;
  if (body.fileBase64 && body.fileName) {
    const dir = evidenceUploadDir();
    await mkdir(dir, { recursive: true });
    const safe = `${planId}-${nanoid(10)}-${body.fileName.replace(/[^\w.\-]+/g, '_')}`;
    const buf = Buffer.from(body.fileBase64, 'base64');
    await writeFile(path.join(dir, safe), buf);
    storageKey = safe;
    fileSize = buf.length;
  }

  const [id] = await db('faculty_cbs_evidence').insert({
    plan_id: planId,
    item_id: body.itemId ?? null,
    college_id: actor.collegeId,
    evidence_type: body.evidenceType,
    title: body.title,
    description: body.description ?? null,
    file_name: body.fileName ?? null,
    mime_type: body.mimeType ?? null,
    file_size: fileSize,
    storage_key: storageKey,
    external_url: body.externalUrl ?? null,
    uploaded_by: actor.facultyUserId,
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId: body.itemId ?? null,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'CBS_EVIDENCE_ADDED',
    metadata: { evidenceId: id, type: body.evidenceType },
  });

  return getPlan(planId, actor.collegeId);
}

export async function linkQuiz(
  planId: number,
  itemId: number,
  actor: CbsActor,
  body: z.infer<typeof linkQuizSchema>,
) {
  const plan = await db('faculty_cbs_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');
  const item = await db('faculty_cbs_plan_items').where({ id: itemId, plan_id: planId }).first();
  if (!item) throw new AppError(404, 'Plan item not found');

  const quiz = await db('quizzes').where({ id: body.quizId, college_id: actor.collegeId }).first();
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (Number(quiz.created_by) !== actor.facultyUserId && !canManageAllCbsPlans(actor.role)) {
    throw new AppError(403, 'You can only link your own quizzes');
  }
  if (Number(quiz.course_id) !== Number(plan.course_id)) {
    throw new AppError(400, 'Quiz must belong to the same subject');
  }

  const include = body.includeInFormalAttainment === true;
  await db('faculty_cbs_assessment_links').insert({
    plan_id: planId,
    item_id: itemId,
    assessment_kind: 'QUIZ',
    quiz_id: body.quizId,
    include_in_formal_attainment: include,
    linked_by: actor.facultyUserId,
  });

  const nextStatus = item.status === 'DELIVERED' || item.status === 'ASSESSED' ? 'ASSESSED' : item.status;
  await db('faculty_cbs_plan_items').where({ id: itemId }).update({
    status: nextStatus,
    assessment_required: true,
    assessment_type: item.assessment_type === 'NONE' ? 'QUIZ' : item.assessment_type,
    include_in_formal_attainment: include ? true : item.include_in_formal_attainment,
    updated_at: db.fn.now(),
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'CBS_QUIZ_LINKED',
    metadata: { quizId: body.quizId, includeInFormalAttainment: include },
  });

  return getPlan(planId, actor.collegeId);
}

export async function linkAssignment(
  planId: number,
  itemId: number,
  actor: CbsActor,
  body: z.infer<typeof linkAssignmentSchema>,
) {
  const plan = await db('faculty_cbs_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');
  const item = await db('faculty_cbs_plan_items').where({ id: itemId, plan_id: planId }).first();
  if (!item) throw new AppError(404, 'Plan item not found');

  const assignment = await db('assignments').where({ id: body.assignmentId, college_id: actor.collegeId }).first();
  if (!assignment) throw new AppError(404, 'Assignment not found');
  if (Number(assignment.created_by) !== actor.facultyUserId && !canManageAllCbsPlans(actor.role)) {
    throw new AppError(403, 'You can only link your own assignments');
  }
  if (Number(assignment.course_id) !== Number(plan.course_id)) {
    throw new AppError(400, 'Assignment must belong to the same subject');
  }

  const include = body.includeInFormalAttainment === true;
  await db('faculty_cbs_assessment_links').insert({
    plan_id: planId,
    item_id: itemId,
    assessment_kind: 'ASSIGNMENT',
    assignment_id: body.assignmentId,
    include_in_formal_attainment: include,
    linked_by: actor.facultyUserId,
  });

  const nextStatus = item.status === 'DELIVERED' || item.status === 'ASSESSED' ? 'ASSESSED' : item.status;
  await db('faculty_cbs_plan_items').where({ id: itemId }).update({
    status: nextStatus,
    assessment_required: true,
    assessment_type: item.assessment_type === 'NONE' ? 'ASSIGNMENT' : item.assessment_type,
    include_in_formal_attainment: include ? true : item.include_in_formal_attainment,
    updated_at: db.fn.now(),
  });

  await recordCbsAudit({
    collegeId: actor.collegeId,
    planId,
    itemId,
    actorId: actor.facultyUserId,
    actorName: await actorName(actor.facultyUserId),
    action: 'CBS_ASSIGNMENT_LINKED',
    metadata: { assignmentId: body.assignmentId, includeInFormalAttainment: include },
  });

  return getPlan(planId, actor.collegeId);
}

export async function quizPrefill(planId: number, itemId: number, collegeId: number) {
  const plan = await getPlan(planId, collegeId);
  const item = plan.items.find((i) => i.id === itemId);
  if (!item) throw new AppError(404, 'Plan item not found');
  return {
    courseId: plan.courseId,
    subjectName: plan.subjectName,
    courseCode: plan.courseCode,
    module: item.moduleUnit,
    primaryCo: item.primaryCo,
    cbsReference: item.cbsId,
    cbsTitle: item.title,
    planId,
    itemId,
    includeInFormalAttainmentDefault: false,
  };
}

export async function assignmentPrefill(planId: number, itemId: number, collegeId: number) {
  return quizPrefill(planId, itemId, collegeId);
}

export async function addFromGap(actor: CbsActor, body: z.infer<typeof fromGapSchema>) {
  const analysis = await db('faculty_gap_analyses')
    .where({ id: body.gapAnalysisId, college_id: actor.collegeId })
    .first();
  if (!analysis) throw new AppError(404, 'Gap Analysis not found');
  if (Number(analysis.created_by) !== actor.facultyUserId && !canManageAllCbsPlans(actor.role)) {
    throw new AppError(403, 'You can only use your own Gap Analysis items');
  }

  const gapItem = await db('faculty_gap_analysis_items')
    .where({ id: body.gapItemId, analysis_id: body.gapAnalysisId })
    .first();
  if (!gapItem) throw new AppError(404, 'Gap item not found');

  const coLink = await db('faculty_gap_item_co_links').where({ item_id: body.gapItemId }).first();
  const prefill = {
    title: `Enrichment for: ${String(gapItem.related_topic || gapItem.gap_statement).slice(0, 120)}`,
    contentDescription: gapItem.gap_statement,
    originType: 'GAP_ANALYSIS' as const,
    moduleUnit: gapItem.module_unit,
    relatedTopic: gapItem.related_topic,
    relatedGapId: gapItem.gap_id,
    primaryCo: coLink?.co_code || null,
    deliveryMethod: normalizeDelivery(gapItem.suggested_action_type) as (typeof DELIVERY_METHODS)[number],
    rationale: gapItem.gap_justification || gapItem.gap_statement,
    expectedBenefit: gapItem.suggested_action_title,
    courseId: Number(analysis.course_id),
    subjectName: analysis.subject_name,
    courseCode: analysis.course_code,
  };

  if (!body.planId) return { prefill, added: false };

  if (!prefill.primaryCo) throw new AppError(400, 'Gap item has no CO — select a CO before saving');
  const plan = await addCustomItem(body.planId, actor, {
    title: prefill.title,
    contentDescription: String(prefill.contentDescription || ''),
    originType: 'GAP_ANALYSIS',
    moduleUnit: prefill.moduleUnit ? String(prefill.moduleUnit) : null,
    relatedTopic: prefill.relatedTopic ? String(prefill.relatedTopic) : null,
    relatedGapId: String(prefill.relatedGapId),
    primaryCo: String(prefill.primaryCo),
    deliveryMethod: (DELIVERY_METHODS as readonly string[]).includes(prefill.deliveryMethod)
      ? (prefill.deliveryMethod as (typeof DELIVERY_METHODS)[number])
      : 'OTHER',
    rationale: String(prefill.rationale || prefill.contentDescription),
    expectedBenefit: prefill.expectedBenefit ? String(prefill.expectedBenefit) : null,
    assessmentRequired: false,
    assessmentType: 'NONE',
  });
  return { prefill, added: true, plan };
}

export async function getAudit(planId: number, collegeId: number) {
  return { audit: await listCbsAudit(planId, collegeId) };
}

export async function listMasterRecommendations(
  collegeId: number,
  filters: { courseId?: number; courseCode?: string } = {},
) {
  let q = scopeMasterQuery(db('cbs_masters').where({ is_active: true }), collegeId).orderBy('course_code').orderBy('cbs_id');
  if (filters.courseId || filters.courseCode) {
    const variants = courseCodeVariants(filters.courseCode);
    q = q.andWhere(function match(this: import('knex').Knex.QueryBuilder) {
      if (filters.courseId) this.orWhere('course_id', filters.courseId);
      if (variants.length) this.orWhereIn('course_code', variants);
    });
  }
  const rows = overlayByNaturalKey(await q.select('*'), (m) => String(m.cbs_id));
  return {
    recommendations: rows.map((m) => ({
      id: Number(m.id),
      cbsId: m.cbs_id,
      subjectName: m.subject_name,
      courseCode: m.course_code,
      title: m.title,
      originType: m.origin_type,
      originLabel: friendlyOrigin(String(m.origin_type)),
      moduleUnit: m.module_unit,
      suggestedCo: m.suggested_co,
      suggestedDeliveryMethod: m.suggested_delivery_method,
      suggestedHours: m.suggested_hours,
      suggestedAssessment: m.suggested_assessment,
      relatedGapId: m.related_gap_id,
      sourceType: m.source_type,
      sourceReference: m.source_reference,
      verificationStatus: m.verification_status,
      isActive: Boolean(m.is_active),
    })),
  };
}

export async function createEmptyCustomPlan(actor: CbsActor, input: z.infer<typeof createPlanSchema>) {
  return createFromMaster(actor, { ...input, selectedCbsIds: [], allowEmptyCustom: true });
}
