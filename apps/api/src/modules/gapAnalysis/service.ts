import { z } from 'zod';
import type { Knex } from 'knex';
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
import { canManageAllGapAnalyses, type GapActor } from './access.js';
import { recordGapAudit, listGapAudit } from './audit.js';
import {
  aggregateCoverageSatisfaction,
  coverageSatisfactionPercent,
  isValidCoverageLevel,
} from './coverage.js';
import {
  ACTION_STATUSES,
  ACTION_TYPES,
  ANALYSIS_STATUSES,
  APPLICABILITY,
  EVIDENCE_TYPES,
  friendlyActionType,
  friendlyCoverage,
  isReviewMarked,
  type ActionStatus,
  type AnalysisStatus,
  type Applicability,
} from './types.js';

export const createGapSchema = z.object({
  courseId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  programId: z.number().int().positive().nullable().optional(),
  semesterId: z.number().int().positive().nullable().optional(),
  schemeId: z.number().int().positive().nullable().optional(),
});

export const coverageSchema = z.object({
  actualCoverageLevel: z.number().int().min(0).max(4),
});

export const applicabilitySchema = z.object({
  applicability: z.enum(APPLICABILITY),
  reason: z.string().max(4000).optional().nullable(),
});

export const actionCreateSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  title: z.string().min(1).max(512),
  description: z.string().max(8000).optional().nullable(),
  plannedDate: z.string().max(32).optional().nullable(),
  actualDate: z.string().max(32).optional().nullable(),
  durationHours: z.number().positive().max(500).optional().nullable(),
  targetGroup: z.string().max(255).optional().nullable(),
  expectedOutcome: z.string().max(4000).optional().nullable(),
  responsibleFaculty: z.string().max(255).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  fromMasterRecommendation: z.boolean().optional(),
  masterActionId: z.string().max(64).optional().nullable(),
});

export const actionUpdateSchema = actionCreateSchema.partial().extend({
  status: z.enum(ACTION_STATUSES).optional(),
  actualOutcome: z.string().max(4000).optional().nullable(),
  participants: z.number().int().min(0).max(100000).optional().nullable(),
});

export const closeGapSchema = z.object({
  closureNote: z.string().min(1).max(4000),
  actualCoverageLevel: z.number().int().min(0).max(4).optional(),
  finalCoverageLevel: z.number().int().min(0).max(4).optional(),
  actualOutcome: z.string().max(4000).optional().nullable(),
  assessmentMethod: z.string().max(255).optional().nullable(),
  assessmentResult: z.string().max(4000).optional().nullable(),
  facultyObservation: z.string().max(4000).optional().nullable(),
  participants: z.number().int().min(0).optional().nullable(),
  actualDurationHours: z.number().positive().max(500).optional().nullable(),
  alternativeCoverageExplanation: z.string().max(4000).optional().nullable(),
});

export const evidenceSchema = z.object({
  evidenceType: z.enum(EVIDENCE_TYPES),
  title: z.string().min(1).max(512),
  description: z.string().max(4000).optional().nullable(),
  externalUrl: z.string().url().max(1024).optional().nullable(),
  itemId: z.number().int().positive().optional().nullable(),
  actionId: z.number().int().positive().optional().nullable(),
  fileName: z.string().max(512).optional().nullable(),
  mimeType: z.string().max(128).optional().nullable(),
  fileBase64: z.string().max(15_000_000).optional().nullable(),
});

type Row = Record<string, unknown>;

async function actorName(actorId: number) {
  const row = await db('faculty_users').where({ id: actorId }).first('name');
  return row?.name ? String(row.name) : null;
}

async function loadCourseContext(collegeId: number, input: z.infer<typeof createGapSchema>) {
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

  const year = await db('academic_years')
    .where({ id: input.academicYearId, college_id: collegeId })
    .first('id', 'label');
  if (!year) throw new AppError(400, 'Academic year not found');

  let program: Row | null = null;
  if (input.programId) {
    program = await db('programs').where({ id: input.programId, college_id: collegeId }).first('id', 'name');
    if (!program) throw new AppError(400, 'Program not found');
  }

  let semester: Row | null = null;
  const semesterId = input.semesterId ?? (course.semesterId as number | null);
  if (semesterId) {
    semester = await db('semesters').where({ id: semesterId }).first('id', 'label', 'number');
  }

  let scheme: Row | null = null;
  const schemeId = input.schemeId ?? (course.schemeId as number | null);
  if (schemeId) {
    scheme = await db('academic_schemes').where({ id: schemeId, college_id: collegeId }).first('id', 'name', 'code');
  }

  return { course, year, program, semester, scheme, schemeId, semesterId };
}

async function loadGapMastersForCourse(collegeId: number, courseId: number, courseCode: string) {
  const rows = await loadScopedMasterRows(db, 'gap_masters', collegeId, {
    courseId,
    courseCode,
    orderBy: 'gap_id',
  });
  return overlayByNaturalKey(rows, (row) => String(row.gap_id));
}

async function loadGapChildren(
  table: string,
  collegeId: number,
  gapIds: string[],
  keyFn: (row: Record<string, any>) => string,
) {
  if (!gapIds.length) return [];
  const rows = await scopeMasterQuery(db(table), collegeId).whereIn('gap_id', gapIds);
  return overlayByNaturalKey(rows, keyFn);
}

function summarizeItems(items: Array<Row>) {
  const applicable = items.filter((i) => i.applicability !== 'NOT_APPLICABLE');
  const closed = applicable.filter((i) => i.itemStatus === 'CLOSED').length;
  const open = applicable.filter((i) => i.itemStatus !== 'CLOSED').length;
  const notApplicable = items.filter((i) => i.applicability === 'NOT_APPLICABLE').length;
  const covered = applicable.filter((i) => Number(i.actualCoverageLevel) >= 3).length;
  const partially = applicable.filter((i) => Number(i.actualCoverageLevel) === 2).length;
  const notCovered = applicable.filter(
    (i) => i.actualCoverageLevel == null || Number(i.actualCoverageLevel) <= 1,
  ).length;
  const coverage = aggregateCoverageSatisfaction(
    applicable.map((i) => ({
      actualCoverageLevel: i.actualCoverageLevel == null ? null : Number(i.actualCoverageLevel),
      expectedCoverageLevel: i.expectedCoverageLevel == null ? null : Number(i.expectedCoverageLevel),
      applicability: String(i.applicability || 'APPLICABLE'),
    })),
  );

  const byType: Record<string, number> = {};
  for (const i of items) {
    const t = String(i.gapType || 'OTHER');
    byType[t] = (byType[t] || 0) + 1;
  }

  return {
    totalGaps: items.length,
    applicable: applicable.length,
    closed,
    open,
    notApplicable,
    covered,
    partiallyCovered: partially,
    notCovered,
    coveragePercent: coverage.percent,
    byType,
  };
}

export async function getCatalog(collegeId: number) {
  return copoCatalog(collegeId);
}

export async function listAnalyses(
  actor: GapActor,
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
  const q = db('faculty_gap_analyses as a')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
    .leftJoin('programs as p', 'p.id', 'a.program_id')
    .leftJoin('academic_years as y', 'y.id', 'a.academic_year_id')
    .leftJoin('semesters as sem', 'sem.id', 'a.semester_id')
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
      'p.name as programJoinName',
      'y.label as yearJoinLabel',
      'sem.label as semesterJoinName',
    )
    .orderBy('a.updated_at', 'desc');

  if (!canManageAllGapAnalyses(actor.role) && actor.role === 'FACULTY') {
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
    const items = await db('faculty_gap_analysis_items')
      .where({ analysis_id: row.id })
      .select(
        'applicability',
        'item_status as itemStatus',
        'actual_coverage_level as actualCoverageLevel',
        'expected_coverage_level as expectedCoverageLevel',
        'gap_type as gapType',
      );
    const summary = summarizeItems(items);
    out.push({
      id: Number(row.id),
      subjectName: row.subjectName,
      courseCode: row.courseCode,
      academicYearLabel: row.academicYearLabel || row.yearJoinLabel,
      programName: row.programName || row.programJoinName,
      semesterLabel: row.semesterLabel || row.semesterJoinName,
      schemeLabel: row.schemeLabel,
      status: row.status,
      facultyName: row.facultyName,
      createdBy: Number(row.createdBy),
      updatedAt: row.updatedAt,
      totalGaps: summary.totalGaps,
      closed: summary.closed,
      open: summary.open,
      coveragePercent: summary.coveragePercent,
    });
  }
  return { analyses: out };
}

async function findExistingActive(
  collegeId: number,
  createdBy: number,
  input: z.infer<typeof createGapSchema>,
) {
  const q = db('faculty_gap_analyses')
    .where({
      college_id: collegeId,
      created_by: createdBy,
      course_id: input.courseId,
      academic_year_id: input.academicYearId,
    })
    .whereNotIn('status', ['ARCHIVED']);
  if (input.programId) q.andWhere({ program_id: input.programId });
  else q.whereNull('program_id');
  if (input.semesterId) q.andWhere({ semester_id: input.semesterId });
  else q.whereNull('semester_id');
  if (input.schemeId) q.andWhere({ scheme_id: input.schemeId });
  else q.whereNull('scheme_id');
  return q.first('id', 'status');
}

export async function previewGeneration(actor: GapActor, input: z.infer<typeof createGapSchema>) {
  const ctx = await loadCourseContext(actor.collegeId, input);
  const masters = await loadGapMastersForCourse(actor.collegeId, input.courseId, String(ctx.course.code));

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
        missing: ['Gap Analysis master'],
      }),
      course: {
        id: Number(ctx.course.id),
        name: ctx.course.name,
        code: ctx.course.code,
        schemeName: ctx.scheme?.name || ctx.course.schemeName,
      },
      existingAnalysisId: existing ? Number(existing.id) : null,
    };
  }

  const gapIds = masters.map((m) => String(m.gap_id));
  const coLinks = await loadGapChildren(
    'gap_master_co_links',
    actor.collegeId,
    gapIds,
    (row) => `${row.gap_id}:${row.co_code}`,
  );
  const actions = await loadGapChildren('gap_master_actions', actor.collegeId, gapIds, (row) => String(row.action_id));

  const high = masters.filter((m) => String(m.priority || '').toUpperCase() === 'HIGH').length;
  const medium = masters.filter((m) => String(m.priority || '').toUpperCase() === 'MEDIUM').length;
  const relatedCos = new Set(coLinks.map((c) => String(c.co_code))).size;
  const needsReview = masters.some(
    (m) => isReviewMarked(m.verification_status) || isReviewMarked(m.mapping_origin),
  );

  return {
    found: true,
    course: {
      id: Number(ctx.course.id),
      name: ctx.course.name,
      code: ctx.course.code,
      schemeName: ctx.scheme?.name || ctx.course.schemeName || masters[0].scheme_label,
    },
    counts: {
      masterGaps: masters.length,
      relatedCos,
      highPriority: high,
      mediumPriority: medium,
      suggestedActions: actions.length,
    },
    needsReview,
    existingAnalysisId: existing ? Number(existing.id) : null,
  };
}

export async function createFromMaster(actor: GapActor, input: z.infer<typeof createGapSchema>) {
  const ctx = await loadCourseContext(actor.collegeId, input);
  const schemeId = input.schemeId ?? (ctx.schemeId as number | null) ?? null;
  const semesterId = input.semesterId ?? (ctx.semesterId as number | null) ?? null;
  const normalizedInput = { ...input, schemeId: schemeId ?? undefined, semesterId: semesterId ?? undefined };

  const existing = await findExistingActive(actor.collegeId, actor.facultyUserId, normalizedInput);
  if (existing) {
    throw new AppError(
      409,
      'Gap Analysis already exists.',
      { existingAnalysisId: Number(existing.id) },
      'DUPLICATE_GAP_ANALYSIS',
    );
  }

  const masters = await loadGapMastersForCourse(actor.collegeId, input.courseId, String(ctx.course.code));

  if (!masters.length) {
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
        missing: ['Gap Analysis master'],
      }).diagnostics,
      'NO_GAP_MASTER',
    );
  }

  const gapIds = masters.map((m) => String(m.gap_id));
  const coLinks = await loadGapChildren(
    'gap_master_co_links',
    actor.collegeId,
    gapIds,
    (row) => `${row.gap_id}:${row.co_code}`,
  );
  const outcomeLinks = await loadGapChildren(
    'gap_master_outcome_links',
    actor.collegeId,
    gapIds,
    (row) => `${row.gap_id}:${row.outcome_type}:${row.outcome_code}:${row.co_code ?? ''}`,
  );
  const actions = await loadGapChildren('gap_master_actions', actor.collegeId, gapIds, (row) => String(row.action_id));
  const sources = await loadGapChildren('gap_master_sources', actor.collegeId, gapIds, (row) => String(row.source_id));

  // Resolve CO statements once
  const cos = await db('course_outcomes')
    .where({ college_id: actor.collegeId, course_id: input.courseId, is_current: true })
    .select('co_code as code', 'statement');
  const coMap = new Map(cos.map((c) => [String(c.code).toUpperCase(), String(c.statement || '')]));

  const name = await actorName(actor.facultyUserId);

  const analysisId = await db.transaction(async (trx) => {
    const [id] = await trx('faculty_gap_analyses').insert({
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
      scheme_label: ctx.scheme?.name || ctx.course.schemeName || masters[0].scheme_label,
      program_name: ctx.program?.name || masters[0].program_name,
      semester_label:
        ctx.semester?.label ||
        (ctx.semester?.number != null ? `Semester ${ctx.semester.number}` : masters[0].semester_label),
      academic_year_label: ctx.year.label,
      status: 'DRAFT',
      import_batch: masters[0].import_batch,
      snapshot_meta: JSON.stringify({
        gapIds,
        masterCount: masters.length,
        importedAt: new Date().toISOString(),
      }),
    });

    let serial = 1;
    for (const master of masters) {
      const gapId = String(master.gap_id);
      const masterActions = actions.filter((a) => a.gap_id === gapId);
      const recommended = masterActions[0];
      const masterCos = coLinks.filter((c) => c.gap_id === gapId);
      const masterOutcomes = outcomeLinks.filter((o) => o.gap_id === gapId);
      const masterSources = sources.filter((s) => s.gap_id === gapId);

      const [itemId] = await trx('faculty_gap_analysis_items').insert({
        analysis_id: id,
        gap_master_id: master.id,
        gap_id: gapId,
        serial_no: serial++,
        gap_type: master.gap_type,
        gap_statement: master.gap_statement,
        gap_justification: master.gap_justification,
        module_unit: master.module_unit,
        related_topic: master.related_topic,
        priority: master.priority,
        expected_coverage_level: master.expected_coverage_level,
        suggested_action_type: recommended?.action_type || master.suggested_action_type,
        suggested_action_title: recommended?.recommended_action || null,
        source_basis: master.source_basis,
        mapping_origin: master.mapping_origin,
        verification_status: master.verification_status,
        applicability: 'APPLICABLE',
        item_status: 'OPEN',
        snapshot_json: JSON.stringify({
          master,
          coLinks: masterCos,
          outcomeLinks: masterOutcomes,
          actions: masterActions,
          sources: masterSources,
        }),
      });

      for (const link of masterCos) {
        await trx('faculty_gap_item_co_links').insert({
          item_id: itemId,
          co_code: link.co_code,
          co_statement: coMap.get(String(link.co_code).toUpperCase()) || null,
          relationship: link.relationship,
          verification_status: link.verification_status,
        });
      }

      // Prefer explicit master outcome links; otherwise leave empty (derive live from Academic Mapping at read time)
      for (const link of masterOutcomes) {
        await trx('faculty_gap_item_outcome_links').insert({
          item_id: itemId,
          co_code: link.co_code || null,
          outcome_type: link.outcome_type,
          outcome_code: link.outcome_code,
          strength: link.strength,
          derived_from: link.derived_from || 'Master GAP_OUTCOME_MAPPING',
          verification_status: link.verification_status,
        });
      }
    }

    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId: Number(id),
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'GAP_ANALYSIS_CREATED',
        metadata: { gapCount: masters.length, courseId: input.courseId },
      },
      trx,
    );

    return Number(id);
  });

  return getAnalysis(analysisId, actor.collegeId);
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

  // Use official/master mapping versions (source_mapping_version_id IS NULL) when available
  const versions = await db('copo_mapping_versions')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .whereNull('source_mapping_version_id')
    .select('id', 'mapping_kind', 'mapping_type');

  if (!versions.length) return [];

  const versionIds = versions.map((v) => Number(v.id));
  const items = await db('copo_mapping_items')
    .whereIn('mapping_version_id', versionIds)
    .whereIn('course_outcome_id', coIds)
    .whereNotNull('correlation_strength')
    .select('*');

  const out: Array<{
    coCode: string;
    outcomeType: string;
    outcomeCode: string;
    strength: number;
    derivedFrom: string;
  }> = [];

  for (const item of items) {
    const coCode = coById.get(Number(item.course_outcome_id));
    if (!coCode) continue;
    const strength = Number(item.correlation_strength);
    if (item.program_outcome_id) {
      const po = await db('program_outcomes').where({ id: item.program_outcome_id }).first('po_number', 'short_title');
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
      const pso = await db('program_specific_outcomes')
        .where({ id: item.program_specific_outcome_id })
        .first('pso_code');
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

async function lessonPlanContext(collegeId: number, courseId: number, createdBy: number, moduleUnit: string | null) {
  const plan = await db('faculty_lesson_plans')
    .where({ college_id: collegeId, course_id: courseId, created_by: createdBy })
    .whereNot('status', 'ARCHIVED')
    .orderBy('updated_at', 'desc')
    .first('id', 'status');
  if (!plan) return { planned: false, completed: false, planId: null as number | null };

  let entryQ = db('lesson_plan_entries').where({ plan_id: plan.id });
  if (moduleUnit) {
    entryQ = entryQ.andWhere((b) => {
      b.where('module_label', 'like', `%${moduleUnit.replace(/module\s*/i, '')}%`).orWhere(
        'module_name',
        'like',
        `%${moduleUnit}%`,
      );
    });
  }
  const entries = await entryQ.select('status');
  const planned = entries.length > 0;
  const completed = entries.some((e) => String(e.status) === 'COMPLETED');
  return { planned, completed, planId: Number(plan.id) };
}

async function assessmentContext(collegeId: number, courseId: number, createdBy: number) {
  const bank = await db('quiz_bank_questions')
    .where({ college_id: collegeId, course_id: courseId })
    .count({ c: '*' })
    .first();
  const quizzes = await db('quizzes')
    .where({ college_id: collegeId, course_id: courseId, created_by: createdBy })
    .count({ c: '*' })
    .first();
  return {
    questionBankCount: Number(bank?.c || 0),
    quizUsageCount: Number(quizzes?.c || 0),
  };
}

export async function getAnalysis(analysisId: number, collegeId: number) {
  const header = await db('faculty_gap_analyses as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
    .leftJoin('colleges as col', 'col.id', 'a.college_id')
    .leftJoin('departments as d', 'd.id', 'a.department_id')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .where({ 'a.id': analysisId, 'a.college_id': collegeId })
    .select(
      'a.*',
      'f.name as facultyName',
      'col.name as collegeName',
      'col.logo_url as logoUrl',
      'd.name as departmentName',
      'c.id as courseJoinId',
    )
    .first();
  if (!header) throw new AppError(404, 'Gap Analysis not found');

  const items = await db('faculty_gap_analysis_items')
    .where({ analysis_id: analysisId })
    .orderBy('serial_no')
    .select('*');

  const itemIds = items.map((i) => Number(i.id));
  const coLinks = itemIds.length
    ? await db('faculty_gap_item_co_links').whereIn('item_id', itemIds)
    : [];
  const snapOutcomes = itemIds.length
    ? await db('faculty_gap_item_outcome_links').whereIn('item_id', itemIds)
    : [];
  const actions = await db('gap_filling_actions').where({ analysis_id: analysisId }).orderBy('id');
  const evidence = await db('gap_evidence').where({ analysis_id: analysisId }).orderBy('id');

  const assessment = await assessmentContext(collegeId, Number(header.course_id), Number(header.created_by));

  const detailedItems = [];
  for (const item of items) {
    const cos = coLinks.filter((c) => Number(c.item_id) === Number(item.id));
    let outcomes: Array<{
      coCode: string | null;
      outcomeType: string;
      outcomeCode: string;
      strength: number | null;
      derivedFrom: string | null;
      verificationStatus: string | null;
      source: 'SNAPSHOT' | 'ACADEMIC_MAPPING';
    }> = snapOutcomes
      .filter((o) => Number(o.item_id) === Number(item.id))
      .map((o) => ({
        coCode: o.co_code == null ? null : String(o.co_code),
        outcomeType: String(o.outcome_type),
        outcomeCode: String(o.outcome_code),
        strength: o.strength == null ? null : Number(o.strength),
        derivedFrom: o.derived_from == null ? null : String(o.derived_from),
        verificationStatus: o.verification_status == null ? null : String(o.verification_status),
        source: 'SNAPSHOT' as const,
      }));

    if (!outcomes.length && cos.length) {
      const live = await deriveLiveOutcomes(
        collegeId,
        Number(header.course_id),
        cos.map((c) => String(c.co_code)),
      );
      outcomes = live.map((o) => ({
        ...o,
        verificationStatus: null,
        source: 'ACADEMIC_MAPPING' as const,
      }));
    }

    const itemActions = actions.filter((a) => Number(a.item_id) === Number(item.id));
    const itemEvidence = evidence.filter((e) => Number(e.item_id) === Number(item.id));
    const lesson = await lessonPlanContext(
      collegeId,
      Number(header.course_id),
      Number(header.created_by),
      item.module_unit ? String(item.module_unit) : null,
    );

    const coveragePct = coverageSatisfactionPercent(
      item.actual_coverage_level == null ? null : Number(item.actual_coverage_level),
      item.expected_coverage_level == null ? null : Number(item.expected_coverage_level),
    );

    detailedItems.push({
      id: Number(item.id),
      gapId: item.gap_id,
      serialNo: Number(item.serial_no),
      gapType: item.gap_type,
      gapStatement: item.gap_statement,
      gapJustification: item.gap_justification,
      moduleUnit: item.module_unit,
      relatedTopic: item.related_topic,
      priority: item.priority,
      expectedCoverageLevel: item.expected_coverage_level == null ? null : Number(item.expected_coverage_level),
      expectedCoverageLabel: friendlyCoverage(
        item.expected_coverage_level == null ? null : Number(item.expected_coverage_level),
      ),
      actualCoverageLevel: item.actual_coverage_level == null ? null : Number(item.actual_coverage_level),
      actualCoverageLabel: friendlyCoverage(
        item.actual_coverage_level == null ? null : Number(item.actual_coverage_level),
      ),
      coveragePercent: coveragePct,
      suggestedActionType: item.suggested_action_type,
      suggestedActionTitle: item.suggested_action_title,
      suggestedActionLabel: item.suggested_action_type
        ? friendlyActionType(String(item.suggested_action_type))
        : null,
      sourceBasis: item.source_basis,
      mappingOrigin: item.mapping_origin,
      verificationStatus: item.verification_status,
      needsReview: isReviewMarked(item.verification_status) || isReviewMarked(item.mapping_origin),
      applicability: item.applicability,
      notApplicableReason: item.not_applicable_reason,
      itemStatus: item.item_status,
      closureNote: item.closure_note,
      actualOutcome: item.actual_outcome,
      assessmentMethod: item.assessment_method,
      assessmentResult: item.assessment_result,
      facultyObservation: item.faculty_observation,
      finalCoverageLevel: item.final_coverage_level == null ? null : Number(item.final_coverage_level),
      participants: item.participants == null ? null : Number(item.participants),
      actualDurationHours: item.actual_duration_hours == null ? null : Number(item.actual_duration_hours),
      closedAt: item.closed_at,
      relatedCos: cos.map((c) => ({
        coCode: c.co_code,
        coStatement: c.co_statement,
        relationship: c.relationship,
        verificationStatus: c.verification_status,
      })),
      outcomes,
      actions: itemActions.map(mapAction),
      evidence: itemEvidence.map(mapEvidence),
      lessonPlan: {
        module: item.module_unit,
        topic: item.related_topic,
        planned: lesson.planned,
        completed: lesson.completed,
        planId: lesson.planId,
      },
    });
  }

  const summary = summarizeItems(
    detailedItems.map((i) => ({
      applicability: i.applicability,
      itemStatus: i.itemStatus,
      actualCoverageLevel: i.actualCoverageLevel,
      expectedCoverageLevel: i.expectedCoverageLevel,
      gapType: i.gapType,
    })),
  );

  const actionsCompleted = actions.filter((a) => a.status === 'COMPLETED').length;

  return {
    id: Number(header.id),
    status: header.status as AnalysisStatus,
    subjectName: header.subject_name,
    courseCode: header.course_code,
    courseId: Number(header.course_id),
    schemeLabel: header.scheme_label,
    programName: header.program_name,
    semesterLabel: header.semester_label,
    academicYearLabel: header.academic_year_label,
    academicYearId: header.academic_year_id == null ? null : Number(header.academic_year_id),
    programId: header.program_id == null ? null : Number(header.program_id),
    semesterId: header.semester_id == null ? null : Number(header.semester_id),
    schemeId: header.scheme_id == null ? null : Number(header.scheme_id),
    preparedBy: header.facultyName,
    createdBy: Number(header.created_by),
    collegeName: header.collegeName,
    logoUrl: header.logoUrl,
    departmentName: header.departmentName,
    createdAt: header.created_at,
    updatedAt: header.updated_at,
    completedAt: header.completed_at,
    importBatch: header.import_batch,
    summary: {
      ...summary,
      actionsTotal: actions.length,
      actionsCompleted,
      evidenceCount: evidence.length,
    },
    assessment,
    items: detailedItems,
    actions: actions.map(mapAction),
    evidence: evidence.map(mapEvidence),
  };
}

function mapAction(a: Row) {
  return {
    id: Number(a.id),
    itemId: Number(a.item_id),
    analysisId: Number(a.analysis_id),
    actionType: a.action_type,
    actionTypeLabel: friendlyActionType(String(a.action_type)),
    title: a.title,
    description: a.description,
    plannedDate: a.planned_date,
    actualDate: a.actual_date,
    durationHours: a.duration_hours == null ? null : Number(a.duration_hours),
    targetGroup: a.target_group,
    expectedOutcome: a.expected_outcome,
    actualOutcome: a.actual_outcome,
    participants: a.participants == null ? null : Number(a.participants),
    responsibleFaculty: a.responsible_faculty,
    status: a.status,
    notes: a.notes,
    fromMasterRecommendation: Boolean(a.from_master_recommendation),
    masterActionId: a.master_action_id,
    completedAt: a.completed_at,
  };
}

function mapEvidence(e: Row) {
  return {
    id: Number(e.id),
    analysisId: Number(e.analysis_id),
    itemId: e.item_id == null ? null : Number(e.item_id),
    actionId: e.action_id == null ? null : Number(e.action_id),
    evidenceType: e.evidence_type,
    title: e.title,
    description: e.description,
    fileName: e.file_name,
    mimeType: e.mime_type,
    fileSize: e.file_size == null ? null : Number(e.file_size),
    hasFile: Boolean(e.storage_key),
    externalUrl: e.external_url,
    uploadedBy: e.uploaded_by == null ? null : Number(e.uploaded_by),
    createdAt: e.created_at,
  };
}

async function touchAnalysis(trx: Knex.Transaction | typeof db, analysisId: number, status?: AnalysisStatus) {
  const patch: Row = { updated_at: trx.fn.now() };
  if (status) patch.status = status;
  await trx('faculty_gap_analyses').where({ id: analysisId }).update(patch);
}

async function syncItemStatusFromActions(trx: Knex.Transaction, itemId: number) {
  const item = await trx('faculty_gap_analysis_items').where({ id: itemId }).first();
  if (!item || item.item_status === 'CLOSED' || item.applicability === 'NOT_APPLICABLE') return;
  const actions = await trx('gap_filling_actions').where({ item_id: itemId }).whereNot('status', 'CANCELLED');
  if (!actions.length) {
    await trx('faculty_gap_analysis_items').where({ id: itemId }).update({ item_status: 'OPEN' });
    return;
  }
  if (actions.some((a) => a.status === 'COMPLETED') && actions.every((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED')) {
    await trx('faculty_gap_analysis_items').where({ id: itemId }).update({ item_status: 'COMPLETED' });
    return;
  }
  if (actions.some((a) => a.status === 'IN_PROGRESS' || a.status === 'COMPLETED')) {
    await trx('faculty_gap_analysis_items').where({ id: itemId }).update({ item_status: 'IN_PROGRESS' });
    return;
  }
  await trx('faculty_gap_analysis_items').where({ id: itemId }).update({ item_status: 'ACTION_PLANNED' });
}

export async function updateCoverage(
  analysisId: number,
  itemId: number,
  actor: GapActor,
  body: z.infer<typeof coverageSchema>,
) {
  if (!isValidCoverageLevel(body.actualCoverageLevel)) {
    throw new AppError(400, 'Invalid coverage level');
  }
  const item = await db('faculty_gap_analysis_items').where({ id: itemId, analysis_id: analysisId }).first();
  if (!item) throw new AppError(404, 'Gap item not found');
  if (item.item_status === 'CLOSED') throw new AppError(400, 'Closed gaps cannot change coverage until reopened');

  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analysis_items')
      .where({ id: itemId })
      .update({ actual_coverage_level: body.actualCoverageLevel, updated_at: trx.fn.now() });
    const header = await trx('faculty_gap_analyses').where({ id: analysisId }).first('status');
    if (header?.status === 'DRAFT') await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    else await touchAnalysis(trx, analysisId);
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'COVERAGE_CHANGED',
        metadata: { from: item.actual_coverage_level, to: body.actualCoverageLevel },
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function updateApplicability(
  analysisId: number,
  itemId: number,
  actor: GapActor,
  body: z.infer<typeof applicabilitySchema>,
) {
  const item = await db('faculty_gap_analysis_items').where({ id: itemId, analysis_id: analysisId }).first();
  if (!item) throw new AppError(404, 'Gap item not found');
  if (body.applicability === 'NOT_APPLICABLE' && !String(body.reason || '').trim()) {
    throw new AppError(400, 'Reason is required when marking a gap Not Applicable');
  }
  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analysis_items')
      .where({ id: itemId })
      .update({
        applicability: body.applicability,
        not_applicable_reason: body.applicability === 'NOT_APPLICABLE' ? body.reason : null,
        item_status: body.applicability === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : item.item_status === 'NOT_APPLICABLE' ? 'OPEN' : item.item_status,
        updated_at: trx.fn.now(),
      });
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: body.applicability === 'NOT_APPLICABLE' ? 'GAP_MARKED_NOT_APPLICABLE' : 'GAP_MARKED_APPLICABLE',
        metadata: { reason: body.reason },
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function addAction(
  analysisId: number,
  itemId: number,
  actor: GapActor,
  body: z.infer<typeof actionCreateSchema>,
) {
  const item = await db('faculty_gap_analysis_items').where({ id: itemId, analysis_id: analysisId }).first();
  if (!item) throw new AppError(404, 'Gap item not found');
  if (item.applicability === 'NOT_APPLICABLE') {
    throw new AppError(400, 'Cannot add actions to a Not Applicable gap');
  }
  const name = await actorName(actor.facultyUserId);
  let actionId = 0;
  await db.transaction(async (trx) => {
    const [id] = await trx('gap_filling_actions').insert({
      analysis_id: analysisId,
      item_id: itemId,
      action_type: body.actionType,
      title: body.title,
      description: body.description ?? null,
      planned_date: body.plannedDate || null,
      actual_date: body.actualDate || null,
      duration_hours: body.durationHours ?? null,
      target_group: body.targetGroup ?? null,
      expected_outcome: body.expectedOutcome ?? null,
      responsible_faculty: body.responsibleFaculty ?? name,
      status: 'PLANNED',
      notes: body.notes ?? null,
      from_master_recommendation: Boolean(body.fromMasterRecommendation),
      master_action_id: body.masterActionId ?? null,
    });
    actionId = Number(id);
    await syncItemStatusFromActions(trx, itemId);
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId,
        actionId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'ACTION_ADDED',
        metadata: { title: body.title, actionType: body.actionType },
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function updateAction(
  analysisId: number,
  actionId: number,
  actor: GapActor,
  body: z.infer<typeof actionUpdateSchema>,
) {
  const action = await db('gap_filling_actions').where({ id: actionId, analysis_id: analysisId }).first();
  if (!action) throw new AppError(404, 'Action not found');

  if (body.status) {
    const from = String(action.status) as ActionStatus;
    const to = body.status;
    const allowed: Record<ActionStatus, ActionStatus[]> = {
      PLANNED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'PLANNED'],
      COMPLETED: [],
      CANCELLED: ['PLANNED'],
    };
    if (to !== from && !allowed[from]?.includes(to)) {
      throw new AppError(400, `Invalid action status transition ${from} → ${to}`);
    }
    if (to === 'COMPLETED' && !body.actualDate && !action.actual_date) {
      throw new AppError(400, 'Actual date is required when completing an action');
    }
  }

  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    const patch: Row = { updated_at: trx.fn.now() };
    if (body.actionType != null) patch.action_type = body.actionType;
    if (body.title != null) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.plannedDate !== undefined) patch.planned_date = body.plannedDate;
    if (body.actualDate !== undefined) patch.actual_date = body.actualDate;
    if (body.durationHours !== undefined) patch.duration_hours = body.durationHours;
    if (body.targetGroup !== undefined) patch.target_group = body.targetGroup;
    if (body.expectedOutcome !== undefined) patch.expected_outcome = body.expectedOutcome;
    if (body.actualOutcome !== undefined) patch.actual_outcome = body.actualOutcome;
    if (body.participants !== undefined) patch.participants = body.participants;
    if (body.responsibleFaculty !== undefined) patch.responsible_faculty = body.responsibleFaculty;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.status) {
      patch.status = body.status;
      if (body.status === 'COMPLETED') patch.completed_at = trx.fn.now();
    }
    await trx('gap_filling_actions').where({ id: actionId }).update(patch);
    await syncItemStatusFromActions(trx, Number(action.item_id));
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId: Number(action.item_id),
        actionId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: body.status === 'COMPLETED' ? 'ACTION_COMPLETED' : 'ACTION_UPDATED',
        metadata: body,
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function addEvidence(analysisId: number, actor: GapActor, body: z.infer<typeof evidenceSchema>) {
  if (!body.externalUrl && !body.fileBase64) {
    throw new AppError(400, 'Provide a file or URL for evidence');
  }
  if (body.actionId) {
    const action = await db('gap_filling_actions').where({ id: body.actionId, analysis_id: analysisId }).first();
    if (!action) throw new AppError(404, 'Action not found');
  }
  if (body.itemId) {
    const item = await db('faculty_gap_analysis_items').where({ id: body.itemId, analysis_id: analysisId }).first();
    if (!item) throw new AppError(404, 'Gap item not found');
  }

  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { randomUUID } = await import('node:crypto');

  let storageKey: string | null = null;
  let fileSize: number | null = null;
  let fileName = body.fileName || null;
  let mimeType = body.mimeType || null;

  if (body.fileBase64) {
    const allowed = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]);
    if (mimeType && !allowed.has(mimeType)) {
      throw new AppError(400, 'Unsupported evidence file type');
    }
    const buf = Buffer.from(body.fileBase64, 'base64');
    if (buf.length > 8 * 1024 * 1024) throw new AppError(400, 'Evidence file must be under 8 MB');
    fileSize = buf.length;
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/gap-evidence');
    const dir = path.join(root, String(actor.collegeId), String(analysisId));
    await mkdir(dir, { recursive: true });
    const safe = (fileName || 'evidence.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
    storageKey = path.join(String(actor.collegeId), String(analysisId), `${randomUUID()}-${safe}`);
    await writeFile(path.join(root, storageKey), buf);
  }

  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    const [id] = await trx('gap_evidence').insert({
      analysis_id: analysisId,
      item_id: body.itemId ?? null,
      action_id: body.actionId ?? null,
      college_id: actor.collegeId,
      evidence_type: body.evidenceType,
      title: body.title,
      description: body.description ?? null,
      file_name: fileName,
      mime_type: mimeType,
      file_size: fileSize,
      storage_key: storageKey,
      external_url: body.externalUrl ?? null,
      uploaded_by: actor.facultyUserId,
    });
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId: body.itemId ?? null,
        actionId: body.actionId ?? null,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'EVIDENCE_ADDED',
        metadata: { evidenceId: id, title: body.title, evidenceType: body.evidenceType },
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function closeGap(
  analysisId: number,
  itemId: number,
  actor: GapActor,
  body: z.infer<typeof closeGapSchema>,
) {
  const item = await db('faculty_gap_analysis_items').where({ id: itemId, analysis_id: analysisId }).first();
  if (!item) throw new AppError(404, 'Gap item not found');
  if (item.applicability === 'NOT_APPLICABLE') {
    throw new AppError(400, 'Not Applicable gaps do not need closure');
  }
  if (item.item_status === 'CLOSED') throw new AppError(400, 'Gap is already closed');

  const coverage = body.finalCoverageLevel ?? body.actualCoverageLevel ?? item.actual_coverage_level;
  if (coverage == null || !isValidCoverageLevel(Number(coverage))) {
    throw new AppError(400, 'Actual coverage is required to close a gap');
  }

  const completedActions = await db('gap_filling_actions')
    .where({ item_id: itemId, status: 'COMPLETED' })
    .count({ c: '*' })
    .first();
  const hasCompleted = Number(completedActions?.c || 0) > 0;
  if (!hasCompleted && !String(body.alternativeCoverageExplanation || '').trim()) {
    throw new AppError(
      400,
      'Close requires at least one completed action, or an alternative coverage explanation',
    );
  }

  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analysis_items')
      .where({ id: itemId })
      .update({
        actual_coverage_level: Number(coverage),
        final_coverage_level: body.finalCoverageLevel ?? Number(coverage),
        closure_note: body.closureNote,
        actual_outcome: body.actualOutcome ?? body.alternativeCoverageExplanation ?? null,
        assessment_method: body.assessmentMethod ?? null,
        assessment_result: body.assessmentResult ?? null,
        faculty_observation: body.facultyObservation ?? null,
        participants: body.participants ?? null,
        actual_duration_hours: body.actualDurationHours ?? null,
        item_status: 'CLOSED',
        closed_at: trx.fn.now(),
        closed_by: actor.facultyUserId,
        updated_at: trx.fn.now(),
      });
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'GAP_CLOSED',
        metadata: body,
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function reopenGap(analysisId: number, itemId: number, actor: GapActor) {
  const header = await db('faculty_gap_analyses').where({ id: analysisId }).first('status');
  if (!header) throw new AppError(404, 'Gap Analysis not found');
  if (header.status === 'COMPLETED' || header.status === 'ARCHIVED') {
    throw new AppError(400, 'Cannot reopen gaps on a completed or archived analysis');
  }
  const item = await db('faculty_gap_analysis_items').where({ id: itemId, analysis_id: analysisId }).first();
  if (!item) throw new AppError(404, 'Gap item not found');
  if (item.item_status !== 'CLOSED') throw new AppError(400, 'Only closed gaps can be reopened');

  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analysis_items')
      .where({ id: itemId })
      .update({
        item_status: 'IN_PROGRESS',
        closed_at: null,
        closed_by: null,
        updated_at: trx.fn.now(),
      });
    await touchAnalysis(trx, analysisId, 'IN_PROGRESS');
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        itemId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'GAP_REOPENED',
        metadata: { previousClosureNote: item.closure_note },
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function completeAnalysis(analysisId: number, actor: GapActor) {
  const detail = await getAnalysis(analysisId, actor.collegeId);
  const unresolved = detail.items.filter(
    (i) => i.applicability === 'APPLICABLE' && i.itemStatus !== 'CLOSED',
  );
  if (unresolved.length) {
    throw new AppError(
      400,
      `Cannot complete Gap Analysis. ${unresolved.length} applicable gap${unresolved.length === 1 ? ' is' : 's are'} still open.`,
      { openGapIds: unresolved.map((i) => i.gapId) },
      'GAPS_UNRESOLVED',
    );
  }
  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analyses')
      .where({ id: analysisId })
      .update({ status: 'COMPLETED', completed_at: trx.fn.now(), updated_at: trx.fn.now() });
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'GAP_ANALYSIS_COMPLETED',
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function archiveAnalysis(analysisId: number, actor: GapActor) {
  const name = await actorName(actor.facultyUserId);
  await db.transaction(async (trx) => {
    await trx('faculty_gap_analyses')
      .where({ id: analysisId })
      .update({ status: 'ARCHIVED', archived_at: trx.fn.now(), updated_at: trx.fn.now() });
    await recordGapAudit(
      {
        collegeId: actor.collegeId,
        analysisId,
        actorId: actor.facultyUserId,
        actorName: name,
        action: 'GAP_ANALYSIS_ARCHIVED',
      },
      trx,
    );
  });
  return getAnalysis(analysisId, actor.collegeId);
}

export async function getAudit(analysisId: number, collegeId: number) {
  return { events: await listGapAudit(analysisId, collegeId) };
}

export async function listMasterGaps(collegeId: number, filters: { courseId?: number; courseCode?: string } = {}) {
  const q = scopeMasterQuery(db('gap_masters').where({ is_active: true }), collegeId).orderBy('course_code').orderBy('gap_id');
  if (filters.courseId || filters.courseCode) {
    const variants = courseCodeVariants(filters.courseCode);
    q.andWhere(function match(this: Knex.QueryBuilder) {
      if (filters.courseId) this.orWhere('course_id', filters.courseId);
      if (variants.length) this.orWhereIn('course_code', variants);
    });
  }
  const raw = await q;
  const gaps = overlayByNaturalKey(raw, (g) => String(g.gap_id));
  const gapIds = gaps.map((g) => String(g.gap_id));
  const coLinks = await loadGapChildren(
    'gap_master_co_links',
    collegeId,
    gapIds,
    (row) => `${row.gap_id}:${row.co_code}`,
  );
  const actions = await loadGapChildren('gap_master_actions', collegeId, gapIds, (row) => String(row.action_id));
  const sources = await loadGapChildren('gap_master_sources', collegeId, gapIds, (row) => String(row.source_id));
  const reviewRaw = await scopeMasterQuery(db('gap_master_review_queue'), collegeId).orderBy('id');
  const review = overlayByNaturalKey(reviewRaw, (r) => `${r.review_id}:${r.entity_id ?? ''}`);

  const bySubject = new Map<string, Row[]>();
  for (const g of gaps) {
    const key = String(g.course_code);
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(g);
  }

  return {
    subjects: [...bySubject.entries()].map(([code, rows]) => ({
      courseCode: code,
      subjectName: rows[0].subject_name,
      schemeLabel: rows[0].scheme_label,
      programName: rows[0].program_name,
      gapCount: rows.length,
      highPriority: rows.filter((r) => String(r.priority).toUpperCase() === 'HIGH').length,
      needsReview: rows.some((r) => isReviewMarked(r.verification_status == null ? null : String(r.verification_status))),
      gaps: rows.map((r) => ({
        id: Number(r.id),
        gapId: r.gap_id,
        gapType: r.gap_type,
        gapStatement: r.gap_statement,
        moduleUnit: r.module_unit,
        priority: r.priority,
        expectedCoverageLevel: r.expected_coverage_level,
        verificationStatus: r.verification_status,
        mappingOrigin: r.mapping_origin,
        coLinks: coLinks.filter((c) => c.gap_id === r.gap_id),
        actions: actions.filter((a) => a.gap_id === r.gap_id),
        sources: sources.filter((s) => s.gap_id === r.gap_id),
      })),
    })),
    reviewQueue: review,
    totals: {
      subjects: bySubject.size,
      gaps: gaps.length,
      coLinks: coLinks.length,
      actions: actions.length,
      sources: sources.length,
      reviewItems: review.length,
    },
  };
}

export { ANALYSIS_STATUSES, APPLICABILITY };
