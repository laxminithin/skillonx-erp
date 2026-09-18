import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generateSurveyCode } from '../../utils/codes.js';
import {
  getSurveyAvailabilityStatus,
  deriveStoredStatusAfterSchedule,
  isValidSchedule,
  resolveExtendResult,
} from '../../utils/surveyStatus.js';
import { DEFAULT_TIMEZONE, addDaysPreservingWallClock } from '../../utils/timezone.js';
import { listSurveyAudit } from './audit.js';
import {
  IDENTITY_MODES,
  LIKERT_DEFAULT_OPTIONS,
  QUESTION_TYPES,
  RESPONSE_POLICIES,
  SMILE_DEFAULT_OPTIONS,
  STAR_DEFAULT_LABELS,
  SURVEY_TYPES,
  YES_NO_NA_OPTIONS,
  YES_NO_OPTIONS,
  normalizeQuestionType,
  type QuestionType,
} from '../../types/domain.js';

export const surveyMetaSchema = z.object({
  title: z.string().min(1, 'Survey title is required').max(255),
  description: z.string().optional().nullable(),
  surveyType: z.enum(SURVEY_TYPES),
  academicYearId: z.number().int().positive().optional().nullable(),
  semesterId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  courseId: z.number().int().positive().optional().nullable(),
  subjectFacultyId: z.number().int().positive().optional().nullable(),
  classSectionId: z.number().int().positive().optional().nullable(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  responsePolicy: z.enum(RESPONSE_POLICIES).optional().default('ONE_PER_STUDENT'),
  identityMode: z.enum(IDENTITY_MODES).optional().default('IDENTIFIED'),
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const questionOptionSchema = z.object({
  label: z.string().min(1),
  value: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
  emoji: z.string().optional().nullable(),
});

export const questionSchema = z.object({
  sectionId: z.number().int().positive(),
  questionType: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1, 'Question text is required'),
  helpText: z.string().optional().nullable(),
  isRequired: z.boolean().optional().default(true),
  allowComment: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional(),
  config: z.record(z.unknown()).optional().nullable(),
  options: z.array(questionOptionSchema).optional(),
  questionBankItemId: z.number().int().positive().optional().nullable(),
});

export const reorderSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sortOrder: z.number().int(),
      }),
    )
    .optional(),
  questions: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sectionId: z.number().int().positive(),
        sortOrder: z.number().int(),
      }),
    )
    .optional(),
});

function mapSurveyRow(row: Record<string, unknown>) {
  const effectiveStatus = getSurveyAvailabilityStatus({
    status: String(row.status),
    startAt: (row.start_at as Date | null) ?? null,
    endAt: (row.end_at as Date | null) ?? null,
    closedAt: (row.closed_at as Date | null) ?? null,
    archivedAt: (row.archived_at as Date | null) ?? null,
    deletedAt: (row.deleted_at as Date | null) ?? null,
  });
  return {
    id: row.id,
    collegeId: row.college_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    surveyType: row.survey_type,
    academicYearId: row.academic_year_id,
    semesterId: row.semester_id,
    departmentId: row.department_id,
    courseId: row.course_id,
    subjectFacultyId: row.subject_faculty_id,
    classSectionId: row.class_section_id,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    effectiveStatus,
    responsePolicy: row.response_policy,
    identityMode: row.identity_mode,
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    archivedAt: row.archived_at,
    structureLocked: !!row.structure_locked,
    structureVersion: Number(row.structure_version ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    responseCount: row.response_count ?? undefined,
    departmentName: row.department_name ?? undefined,
    courseName: row.course_name ?? undefined,
    courseCode: row.course_code ?? undefined,
    academicYearLabel: row.academic_year_label ?? undefined,
    semesterLabel: row.semester_label ?? undefined,
    shareCode: row.share_code ?? undefined,
    timezone: (row.timezone as string | undefined) ?? DEFAULT_TIMEZONE,
  };
}

async function assertSurveyAccess(surveyId: number, collegeId: number) {
  const survey = await db('surveys')
    .where({ id: surveyId, college_id: collegeId })
    .whereNull('deleted_at')
    .first();
  if (!survey) throw new AppError(404, 'Survey not found');
  return survey;
}

async function countCompletedResponses(surveyId: number) {
  const row = await db('survey_submissions')
    .where({ survey_id: surveyId, status: 'COMPLETED' })
    .count({ c: '*' })
    .first();
  return Number(row?.c ?? 0);
}

async function assertStructureEditable(survey: Record<string, unknown>) {
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be edited');
  }
  if (survey.structure_locked) {
    throw new AppError(
      400,
      'This survey structure is locked because responses already exist. Duplicate the survey to make changes.',
    );
  }
  const responses = await countCompletedResponses(Number(survey.id));
  if (responses > 0) {
    throw new AppError(
      400,
      'Cannot change questions after responses have been collected. Duplicate the survey for a new cycle.',
    );
  }
}

function parseJson(value: unknown) {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export function buildDefaultOptions(
  type: QuestionType,
  config: Record<string, unknown> = {},
  provided?: z.infer<typeof questionOptionSchema>[],
) {
  if (provided && provided.length) return provided;

  const normalized = normalizeQuestionType(type);

  if (normalized === 'LIKERT') return LIKERT_DEFAULT_OPTIONS;

  if (normalized === 'YES_NO') {
    return config.includeNotApplicable ? YES_NO_NA_OPTIONS : YES_NO_OPTIONS;
  }

  if (normalized === 'STAR_RATING') {
    const max = Number(config.maxStars ?? config.scale ?? 5);
    const labels = (config.labels as Record<string, string> | undefined) ?? {};
    return Array.from({ length: max }, (_, i) => {
      const value = i + 1;
      const fallback = STAR_DEFAULT_LABELS[value] ?? String(value);
      return { label: labels[String(value)] ?? fallback, value };
    });
  }

  if (normalized === 'SMILE_RATING') {
    const custom = config.options as Array<{ label: string; value: number; emoji?: string }> | undefined;
    return custom?.length ? custom : SMILE_DEFAULT_OPTIONS;
  }

  if (normalized === 'NUMERICAL') {
    const min = Number(config.min ?? 1);
    const max = Number(config.max ?? 10);
    if (min > max) throw new AppError(400, 'Rating minimum cannot exceed maximum');
    const minLabel = String(config.minLabel ?? '');
    const maxLabel = String(config.maxLabel ?? '');
    return Array.from({ length: max - min + 1 }, (_, i) => {
      const value = min + i;
      let label = String(value);
      if (value === min && minLabel) label = minLabel;
      if (value === max && maxLabel) label = maxLabel;
      return { label, value };
    });
  }

  return [];
}

function validateChoiceOptions(type: QuestionType, options: Array<{ label: string }>) {
  const normalized = normalizeQuestionType(type);
  if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(normalized) && options.length < 2) {
    throw new AppError(400, 'Please add at least two options for this question type');
  }
}

export async function listSurveys(
  collegeId: number,
  filters: { status?: string; createdBy?: number } = {},
) {
  let q = db('surveys as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .leftJoin(
      db('survey_submissions')
        .where('status', 'COMPLETED')
        .groupBy('survey_id')
        .select('survey_id')
        .count('* as response_count')
        .as('rc'),
      'rc.survey_id',
      's.id',
    )
    .where('s.college_id', collegeId)
    .whereNull('s.deleted_at')
    .select(
      's.*',
      'd.name as department_name',
      'c.name as course_name',
      'c.code as course_code',
      db.raw('COALESCE(rc.response_count, 0) as response_count'),
    )
    .orderBy('s.created_at', 'desc');

  if (filters.createdBy) q = q.andWhere('s.created_by', filters.createdBy);
  if (filters.status === 'DRAFT') q = q.andWhere('s.status', 'DRAFT');
  if (filters.status === 'ARCHIVED') q = q.andWhere('s.status', 'ARCHIVED');
  if (filters.status === 'CLOSED') {
    q = q.andWhere((builder) => {
      builder.where('s.status', 'CLOSED').orWhereNotNull('s.closed_at');
    });
  }
  if (filters.status === 'ACTIVE') {
    q = q
      .whereIn('s.status', ['PUBLISHED', 'ACTIVE'])
      .whereNull('s.closed_at')
      .andWhere((builder) => {
        builder.whereNull('s.start_at').orWhere('s.start_at', '<=', db.fn.now());
      })
      .andWhere((builder) => {
        builder.whereNull('s.end_at').orWhere('s.end_at', '>', db.fn.now());
      });
  }

  const rows = await q;
  return rows.map(mapSurveyRow);
}

export async function getSurvey(surveyId: number, collegeId: number) {
  const row = await db('surveys as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .leftJoin('academic_years as ay', 'ay.id', 's.academic_year_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .leftJoin('colleges as col', 'col.id', 's.college_id')
    .leftJoin(
      db('survey_links')
        .where('is_active', true)
        .select('survey_id')
        .max('code as share_code')
        .groupBy('survey_id')
        .as('sl'),
      'sl.survey_id',
      's.id',
    )
    .leftJoin(
      db('survey_submissions')
        .where('status', 'COMPLETED')
        .groupBy('survey_id')
        .select('survey_id')
        .count('* as response_count')
        .as('rc'),
      'rc.survey_id',
      's.id',
    )
    .where('s.id', surveyId)
    .andWhere('s.college_id', collegeId)
    .whereNull('s.deleted_at')
    .select(
      's.*',
      'd.name as department_name',
      'c.name as course_name',
      'c.code as course_code',
      'ay.label as academic_year_label',
      'sem.label as semester_label',
      'sl.share_code as share_code',
      'col.timezone as timezone',
      db.raw('COALESCE(rc.response_count, 0) as response_count'),
    )
    .first();

  if (!row) throw new AppError(404, 'Survey not found');

  const sections = await db('survey_sections')
    .where({ survey_id: surveyId })
    .orderBy('sort_order', 'asc');

  const questions = await db('questions')
    .where({ survey_id: surveyId })
    .orderBy('sort_order', 'asc');

  const options = questions.length
    ? await db('question_options')
        .whereIn(
          'question_id',
          questions.map((q) => q.id),
        )
        .orderBy('sort_order', 'asc')
    : [];

  const optionsByQ = new Map<number, typeof options>();
  for (const opt of options) {
    const list = optionsByQ.get(opt.question_id) ?? [];
    list.push(opt);
    optionsByQ.set(opt.question_id, list);
  }

  const questionsBySection = new Map<number, unknown[]>();
  for (const q of questions) {
    const list = questionsBySection.get(q.section_id) ?? [];
    list.push({
      id: q.id,
      sectionId: q.section_id,
      questionType: normalizeQuestionType(q.question_type),
      prompt: q.prompt,
      helpText: q.help_text,
      isRequired: !!q.is_required,
      allowComment: !!q.allow_comment,
      sortOrder: q.sort_order,
      structureVersion: Number(q.structure_version ?? 1),
      config: parseJson(q.config) ?? {},
      options: (optionsByQ.get(q.id) ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        sortOrder: o.sort_order,
      })),
    });
    questionsBySection.set(q.section_id, list);
  }

  return {
    ...mapSurveyRow(row),
    canEditStructure: !row.structure_locked && Number(row.response_count ?? 0) === 0 && row.status !== 'ARCHIVED',
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      sortOrder: s.sort_order,
      questions: questionsBySection.get(s.id) ?? [],
    })),
  };
}

export async function createSurvey(
  collegeId: number,
  createdBy: number,
  input: z.output<typeof surveyMetaSchema>,
) {
  const [id] = await db('surveys').insert({
    college_id: collegeId,
    created_by: createdBy,
    title: input.title,
    description: input.description ?? null,
    survey_type: input.surveyType,
    academic_year_id: input.academicYearId ?? null,
    semester_id: input.semesterId ?? null,
    department_id: input.departmentId ?? null,
    course_id: input.courseId ?? null,
    subject_faculty_id: input.subjectFacultyId ?? null,
    class_section_id: input.classSectionId ?? null,
    start_at: input.startAt ? new Date(input.startAt) : null,
    end_at: input.endAt ? new Date(input.endAt) : null,
    status: 'DRAFT',
    response_policy: input.responsePolicy ?? 'ONE_PER_STUDENT',
    identity_mode: input.identityMode ?? 'IDENTIFIED',
  });

  await db('survey_sections').insert({
    survey_id: id,
    title: 'Section 1',
    description: 'General feedback',
    sort_order: 0,
  });

  return getSurvey(id, collegeId);
}

export async function updateSurvey(
  surveyId: number,
  collegeId: number,
  input: Partial<z.infer<typeof surveyMetaSchema>>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be edited');
  }

  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.surveyType !== undefined) patch.survey_type = input.surveyType;
  if (input.academicYearId !== undefined) patch.academic_year_id = input.academicYearId;
  if (input.semesterId !== undefined) patch.semester_id = input.semesterId;
  if (input.departmentId !== undefined) patch.department_id = input.departmentId;
  if (input.courseId !== undefined) patch.course_id = input.courseId;
  if (input.subjectFacultyId !== undefined) patch.subject_faculty_id = input.subjectFacultyId;
  if (input.classSectionId !== undefined) patch.class_section_id = input.classSectionId;
  if (input.startAt !== undefined) patch.start_at = input.startAt ? new Date(input.startAt) : null;
  if (input.endAt !== undefined) patch.end_at = input.endAt ? new Date(input.endAt) : null;

  // Guard the response window: end must be strictly after start (section 8).
  const nextStart = 'start_at' in patch ? (patch.start_at as Date | null) : survey.start_at;
  const nextEnd = 'end_at' in patch ? (patch.end_at as Date | null) : survey.end_at;
  if (!isValidSchedule(nextStart, nextEnd)) {
    throw new AppError(400, 'The survey end time must be after its start time.');
  }

  if (input.responsePolicy !== undefined) patch.response_policy = input.responsePolicy;
  if (input.identityMode !== undefined) {
    const responses = await countCompletedResponses(surveyId);
    if (responses > 0 && input.identityMode !== survey.identity_mode) {
      throw new AppError(400, 'Identity mode cannot be changed after responses exist');
    }
    patch.identity_mode = input.identityMode;
  }

  await db('surveys').where({ id: surveyId }).update(patch);
  return getSurvey(surveyId, collegeId);
}

export async function softDeleteSurvey(surveyId: number, collegeId: number) {
  await assertSurveyAccess(surveyId, collegeId);

  // Never let a delete discard historical student responses. Once responses
  // exist the only safe removal is Archive, which preserves all records.
  const responses = await countCompletedResponses(surveyId);
  if (responses > 0) {
    throw new AppError(
      400,
      'This survey has responses and cannot be deleted. Archive it instead to preserve the records.',
      undefined,
      'SURVEY_HAS_RESPONSES',
    );
  }

  await db('surveys').where({ id: surveyId }).update({
    deleted_at: db.fn.now(),
    status: 'ARCHIVED',
    archived_at: db.fn.now(),
  });
  return { ok: true };
}

export async function addSection(
  surveyId: number,
  collegeId: number,
  input: z.infer<typeof sectionSchema>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  const max = await db('survey_sections').where({ survey_id: surveyId }).max('sort_order as m').first();
  const [id] = await db('survey_sections').insert({
    survey_id: surveyId,
    title: input.title,
    description: input.description ?? null,
    sort_order: input.sortOrder ?? Number(max?.m ?? -1) + 1,
  });
  return db('survey_sections').where({ id }).first();
}

export async function updateSection(
  surveyId: number,
  collegeId: number,
  sectionId: number,
  input: Partial<z.infer<typeof sectionSchema>>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  const section = await db('survey_sections').where({ id: sectionId, survey_id: surveyId }).first();
  if (!section) throw new AppError(404, 'Section not found');

  await db('survey_sections')
    .where({ id: sectionId })
    .update({
      title: input.title ?? section.title,
      description: input.description !== undefined ? input.description : section.description,
      sort_order: input.sortOrder ?? section.sort_order,
    });
  return db('survey_sections').where({ id: sectionId }).first();
}

export async function deleteSection(surveyId: number, collegeId: number, sectionId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  const count = await db('survey_sections').where({ survey_id: surveyId }).count({ c: '*' }).first();
  if (Number(count?.c ?? 0) <= 1) {
    throw new AppError(400, 'Survey must have at least one section');
  }
  await db('survey_sections').where({ id: sectionId, survey_id: surveyId }).del();
  return { ok: true };
}

async function insertQuestionOptions(
  questionId: number,
  options: Array<{ label: string; value?: number | null; sortOrder?: number; emoji?: string | null }>,
) {
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    await db('question_options').insert({
      question_id: questionId,
      label: opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label,
      value: opt.value ?? null,
      sort_order: opt.sortOrder ?? i,
    });
  }
}

export async function addQuestion(
  surveyId: number,
  collegeId: number,
  input: z.output<typeof questionSchema>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);

  const section = await db('survey_sections')
    .where({ id: input.sectionId, survey_id: surveyId })
    .first();
  if (!section) throw new AppError(400, 'Invalid section');

  const questionType = normalizeQuestionType(input.questionType);
  const config = input.config ?? {};
  const options = buildDefaultOptions(questionType, config, input.options);
  validateChoiceOptions(questionType, options);

  const max = await db('questions')
    .where({ section_id: input.sectionId })
    .max('sort_order as m')
    .first();

  const [qid] = await db('questions').insert({
    survey_id: surveyId,
    section_id: input.sectionId,
    question_type: questionType,
    prompt: input.prompt,
    help_text: input.helpText ?? null,
    is_required: input.isRequired ?? true,
    allow_comment: input.allowComment ?? false,
    sort_order: input.sortOrder ?? Number(max?.m ?? -1) + 1,
    config: JSON.stringify(config),
    question_bank_item_id: input.questionBankItemId ?? null,
    structure_version: 1,
  });

  await insertQuestionOptions(qid, options);
  return getSurvey(surveyId, collegeId);
}

export async function updateQuestion(
  surveyId: number,
  collegeId: number,
  questionId: number,
  input: Partial<z.infer<typeof questionSchema>>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);

  const question = await db('questions').where({ id: questionId, survey_id: surveyId }).first();
  if (!question) throw new AppError(404, 'Question not found');

  const nextType = input.questionType
    ? normalizeQuestionType(input.questionType)
    : normalizeQuestionType(question.question_type);
  const nextConfig =
    input.config !== undefined ? input.config ?? {} : (parseJson(question.config) as Record<string, unknown>) ?? {};

  const bumpVersion =
    (input.prompt !== undefined && input.prompt !== question.prompt) ||
    (input.questionType !== undefined && nextType !== normalizeQuestionType(question.question_type)) ||
    input.options !== undefined ||
    input.config !== undefined;

  await db('questions')
    .where({ id: questionId })
    .update({
      prompt: input.prompt ?? question.prompt,
      help_text: input.helpText !== undefined ? input.helpText : question.help_text,
      is_required: input.isRequired ?? question.is_required,
      allow_comment: input.allowComment ?? question.allow_comment,
      sort_order: input.sortOrder ?? question.sort_order,
      config: input.config !== undefined ? JSON.stringify(input.config ?? {}) : question.config,
      question_type: nextType,
      section_id: input.sectionId ?? question.section_id,
      structure_version: bumpVersion
        ? Number(question.structure_version ?? 1) + 1
        : question.structure_version,
    });

  if (input.options || input.questionType || input.config) {
    const options = buildDefaultOptions(nextType, nextConfig, input.options);
    validateChoiceOptions(nextType, options);
    await db('question_options').where({ question_id: questionId }).del();
    await insertQuestionOptions(questionId, options);
  }

  return getSurvey(surveyId, collegeId);
}

export async function deleteQuestion(surveyId: number, collegeId: number, questionId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  await db('questions').where({ id: questionId, survey_id: surveyId }).del();
  return getSurvey(surveyId, collegeId);
}

export async function duplicateQuestion(surveyId: number, collegeId: number, questionId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  const question = await db('questions').where({ id: questionId, survey_id: surveyId }).first();
  if (!question) throw new AppError(404, 'Question not found');

  const options = await db('question_options')
    .where({ question_id: questionId })
    .orderBy('sort_order', 'asc');

  const max = await db('questions')
    .where({ section_id: question.section_id })
    .max('sort_order as m')
    .first();

  const [qid] = await db('questions').insert({
    survey_id: surveyId,
    section_id: question.section_id,
    question_type: question.question_type,
    prompt: `${question.prompt} (Copy)`,
    help_text: question.help_text,
    is_required: question.is_required,
    allow_comment: question.allow_comment,
    sort_order: Number(max?.m ?? -1) + 1,
    config: typeof question.config === 'string' ? question.config : JSON.stringify(question.config ?? {}),
    question_bank_item_id: question.question_bank_item_id,
    structure_version: 1,
  });

  for (const opt of options) {
    await db('question_options').insert({
      question_id: qid,
      label: opt.label,
      value: opt.value,
      sort_order: opt.sort_order,
    });
  }

  return getSurvey(surveyId, collegeId);
}

export async function reorderSurvey(
  surveyId: number,
  collegeId: number,
  input: z.infer<typeof reorderSchema>,
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);

  await db.transaction(async (trx) => {
    if (input.sections) {
      for (const section of input.sections) {
        await trx('survey_sections')
          .where({ id: section.id, survey_id: surveyId })
          .update({ sort_order: section.sortOrder });
      }
    }
    if (input.questions) {
      for (const question of input.questions) {
        await trx('questions')
          .where({ id: question.id, survey_id: surveyId })
          .update({
            section_id: question.sectionId,
            sort_order: question.sortOrder,
          });
      }
    }
  });

  return getSurvey(surveyId, collegeId);
}

export async function addFromQuestionBank(
  surveyId: number,
  collegeId: number,
  sectionId: number,
  bankItemIds: number[],
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  await assertStructureEditable(survey);
  const section = await db('survey_sections').where({ id: sectionId, survey_id: surveyId }).first();
  if (!section) throw new AppError(400, 'Invalid section');

  const items = await db('question_bank_items')
    .whereIn('id', bankItemIds)
    .andWhere({ college_id: collegeId, is_active: true });

  for (const item of items) {
    const options =
      typeof item.options === 'string' ? JSON.parse(item.options) : item.options ?? [];
    await addQuestion(surveyId, collegeId, {
      sectionId,
      questionType: item.question_type,
      prompt: item.prompt,
      helpText: item.help_text,
      isRequired: true,
      allowComment: false,
      config: typeof item.config === 'string' ? JSON.parse(item.config) : item.config ?? {},
      options,
      questionBankItemId: item.id,
    });
  }

  return getSurvey(surveyId, collegeId);
}

export async function publishSurvey(surveyId: number, collegeId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be published');
  }

  const questionCount = await db('questions').where({ survey_id: surveyId }).count({ c: '*' }).first();
  if (Number(questionCount?.c ?? 0) < 1) {
    throw new AppError(400, 'Add at least one question before publishing');
  }

  let link = await db('survey_links').where({ survey_id: surveyId, is_active: true }).first();
  if (!link) {
    let code = generateSurveyCode();
    while (await db('survey_links').where({ code }).first()) {
      code = generateSurveyCode();
    }
    const [linkId] = await db('survey_links').insert({
      survey_id: surveyId,
      code,
      is_active: true,
    });
    link = await db('survey_links').where({ id: linkId }).first();
  }

  const detail = await getSurvey(surveyId, collegeId);
  const snapshot = {
    capturedAt: new Date().toISOString(),
    structureVersion: detail.structureVersion,
    title: detail.title,
    sections: detail.sections,
  };

  const now = new Date();
  const status = deriveStoredStatusAfterSchedule(
    survey.start_at ? new Date(survey.start_at) : null,
    survey.end_at ? new Date(survey.end_at) : null,
    now,
  );

  await db('surveys').where({ id: surveyId }).update({
    status,
    published_at: survey.published_at ?? now,
    closed_at: null,
    published_snapshot: JSON.stringify(snapshot),
    structure_version: Number(survey.structure_version ?? 1),
  });

  return {
    survey: await getSurvey(surveyId, collegeId),
    shareCode: link.code,
  };
}

export async function closeSurvey(surveyId: number, collegeId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be closed');
  }
  if (survey.status === 'DRAFT') {
    throw new AppError(400, 'Only a published survey can be closed');
  }
  // Manual close is recorded on closed_at and never touches end_at, so the
  // scheduled end time survives for audit and reopen.
  await db('surveys').where({ id: surveyId }).update({
    status: 'CLOSED',
    closed_at: db.fn.now(),
  });
  return getSurvey(surveyId, collegeId);
}

export async function reopenSurvey(surveyId: number, collegeId: number) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be reopened');
  }
  const now = new Date();
  const end = survey.end_at ? new Date(survey.end_at) : null;
  if (end && now.getTime() >= end.getTime()) {
    throw new AppError(
      400,
      'Extend or update the end date before reopening this survey',
      undefined,
      'SURVEY_ENDED',
    );
  }

  const status = deriveStoredStatusAfterSchedule(
    survey.start_at ? new Date(survey.start_at) : null,
    survey.end_at ? new Date(survey.end_at) : null,
    now,
  );

  await db('surveys').where({ id: surveyId }).update({
    status,
    closed_at: null,
  });
  return getSurvey(surveyId, collegeId);
}

export async function extendSurvey(
  surveyId: number,
  collegeId: number,
  endAt: string,
  opts: { reopen?: boolean } = {},
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  if (survey.status === 'ARCHIVED') {
    throw new AppError(400, 'Archived surveys cannot be extended');
  }

  // Accept ISO UTC from client; store as Date
  const nextEnd = new Date(endAt);
  if (Number.isNaN(nextEnd.getTime())) {
    throw new AppError(400, 'Invalid end date');
  }

  const start = survey.start_at ? new Date(survey.start_at) : null;
  if (!isValidSchedule(start, nextEnd)) {
    throw new AppError(400, 'The new end time must be after the start time.');
  }

  // Extending alone never resurrects a manually closed survey — the caller must
  // opt in with reopen (the "Extend & Reopen" action) to clear closed_at.
  const { closedAt, storedStatus } = resolveExtendResult({
    startAt: start,
    endAt: nextEnd,
    currentClosedAt: survey.closed_at ?? null,
    reopen: Boolean(opts.reopen),
  });

  await db('surveys').where({ id: surveyId }).update({
    end_at: nextEnd,
    status: storedStatus,
    closed_at: closedAt,
  });

  return getSurvey(surveyId, collegeId);
}

/** Extend endAt by N calendar days in the institution timezone, preserving local wall clock. */
export async function extendSurveyByDays(
  surveyId: number,
  collegeId: number,
  days = 14,
  opts: { reopen?: boolean } = {},
) {
  const survey = await assertSurveyAccess(surveyId, collegeId);
  const college = await db('colleges').where({ id: collegeId }).first();
  const timezone = (college?.timezone as string) || DEFAULT_TIMEZONE;
  const now = new Date();
  const base =
    survey.end_at && new Date(survey.end_at).getTime() > now.getTime()
      ? new Date(survey.end_at)
      : now;
  const nextEnd = addDaysPreservingWallClock(base, days, timezone);
  return extendSurvey(surveyId, collegeId, nextEnd.toISOString(), opts);
}

export async function archiveSurvey(surveyId: number, collegeId: number) {
  await assertSurveyAccess(surveyId, collegeId);
  await db('surveys').where({ id: surveyId }).update({
    status: 'ARCHIVED',
    archived_at: db.fn.now(),
  });
  return getSurvey(surveyId, collegeId);
}

export async function getSurveyAudit(surveyId: number, collegeId: number) {
  await assertSurveyAccess(surveyId, collegeId);
  return listSurveyAudit(surveyId, collegeId);
}

export async function lockStructureIfNeeded(surveyId: number) {
  const responses = await countCompletedResponses(surveyId);
  if (responses > 0) {
    await db('surveys').where({ id: surveyId }).update({ structure_locked: true });
  }
}

export async function duplicateSurvey(surveyId: number, collegeId: number, createdBy: number) {
  const original = await getSurvey(surveyId, collegeId);

  const [newId] = await db('surveys').insert({
    college_id: collegeId,
    created_by: createdBy,
    title: `${original.title} (Copy)`,
    description: original.description,
    survey_type: original.surveyType,
    academic_year_id: original.academicYearId,
    semester_id: original.semesterId,
    department_id: original.departmentId,
    course_id: original.courseId,
    subject_faculty_id: original.subjectFacultyId,
    class_section_id: original.classSectionId,
    start_at: null,
    end_at: null,
    status: 'DRAFT',
    response_policy: original.responsePolicy,
    identity_mode: original.identityMode,
    duplicated_from_id: surveyId,
    structure_locked: false,
    structure_version: 1,
  });

  for (const section of original.sections) {
    const [sectionId] = await db('survey_sections').insert({
      survey_id: newId,
      title: section.title,
      description: section.description,
      sort_order: section.sortOrder,
    });

    for (const q of section.questions as Array<{
      questionType: QuestionType;
      prompt: string;
      helpText?: string;
      isRequired: boolean;
      allowComment?: boolean;
      sortOrder: number;
      config?: Record<string, unknown>;
      options?: Array<{ label: string; value: number | null; sortOrder: number }>;
    }>) {
      const [qid] = await db('questions').insert({
        survey_id: newId,
        section_id: sectionId,
        question_type: normalizeQuestionType(q.questionType),
        prompt: q.prompt,
        help_text: q.helpText ?? null,
        is_required: q.isRequired,
        allow_comment: q.allowComment ?? false,
        sort_order: q.sortOrder,
        config: JSON.stringify(q.config ?? {}),
        structure_version: 1,
      });
      for (const opt of q.options ?? []) {
        await db('question_options').insert({
          question_id: qid,
          label: opt.label,
          value: opt.value,
          sort_order: opt.sortOrder,
        });
      }
    }
  }

  return getSurvey(newId, collegeId);
}
