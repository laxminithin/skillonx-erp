import { z } from 'zod';
import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generateQuizCode } from '../../utils/codes.js';
import {
  deriveStoredStatusAfterSchedule,
  getQuizAvailabilityStatus,
  isValidSchedule,
  resolveExtendResult,
} from '../../utils/quizStatus.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';
import {
  CORRECT_ANSWER_VISIBILITY,
  QUIZ_CO_VERIFICATION_STATUSES,
  QUIZ_QUESTION_TYPES,
  isSelectableReviewStatus,
  type QuizQuestionType,
} from '../../types/quiz.js';
import { listQuizAudit } from './audit.js';
import { validateGradableQuestion } from './bankService.js';
import type { SnapshotOption, SnapshotQuestion } from './grading.js';
import { parseSecondaryCos } from '../questions/coMapping.js';
import {
  computeAcademicCoverage,
  resolvePrimaryCoForSubject,
} from '../questions/coValidation.js';

export const quizMetaSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(255),
  description: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  courseId: z.number().int().positive().optional().nullable(),
  moduleId: z.number().int().positive().optional().nullable(),
  academicYearId: z.number().int().positive().optional().nullable(),
  semesterId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  classSectionId: z.number().int().positive().optional().nullable(),
  durationMinutes: z.number().int().positive().max(600).optional().nullable(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  attemptsAllowed: z.number().int().min(0).max(20).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showScoreImmediately: z.boolean().optional(),
  showCorrectAnswers: z.enum(CORRECT_ANSWER_VISIBILITY).optional(),
  showExplanation: z.boolean().optional(),
  passPercentage: z.number().min(0).max(100).optional(),
  randomSelection: z
    .array(z.object({ moduleId: z.number().int().positive(), count: z.number().int().min(0).max(200) }))
    .optional()
    .nullable(),
});

export const quizQuestionOptionSchema = z.object({
  label: z.string().min(1).max(500),
  isCorrect: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional(),
});

export const quizQuestionSchema = z.object({
  bankQuestionId: z.number().int().positive().optional().nullable(),
  moduleId: z.number().int().positive().optional().nullable(),
  questionText: z.string().min(1),
  questionType: z.enum(QUIZ_QUESTION_TYPES),
  marks: z.number().positive().max(100).optional().default(1),
  difficulty: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  numericAnswer: z.number().finite().optional().nullable(),
  numericTolerance: z.number().min(0).optional().nullable(),
  options: z.array(quizQuestionOptionSchema).optional().default([]),
  primaryCoCode: z.string().max(32).optional().nullable(),
  secondaryCoCodes: z.array(z.string().max(32)).optional().nullable(),
  mappingBasis: z.string().max(512).optional().nullable(),
  mappingSource: z.string().max(255).optional().nullable(),
  verificationStatus: z.enum(QUIZ_CO_VERIFICATION_STATUSES).optional().nullable(),
});

export const reorderSchema = z.object({
  questions: z.array(z.object({ id: z.number().int().positive(), sortOrder: z.number().int() })),
});

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

async function assertQuizRow(quizId: number, collegeId: number) {
  const quiz = await db('quizzes').where({ id: quizId, college_id: collegeId }).whereNull('deleted_at').first();
  if (!quiz) throw new AppError(404, 'Quiz not found');
  return quiz;
}

function assertStructureEditable(quiz: Record<string, unknown>) {
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be edited');
  if (quiz.structure_locked) {
    throw new AppError(
      400,
      'This quiz structure is locked because students have already started attempting it. Duplicate the quiz to make changes.',
      undefined,
      'QUIZ_LOCKED',
    );
  }
}

function mapQuizRow(row: Record<string, unknown>) {
  const effectiveStatus = getQuizAvailabilityStatus({
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
    createdByName: row.created_by_name,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    courseId: row.course_id,
    moduleId: row.module_id,
    academicYearId: row.academic_year_id,
    semesterId: row.semester_id,
    departmentId: row.department_id,
    classSectionId: row.class_section_id,
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    effectiveStatus,
    attemptsAllowed: Number(row.attempts_allowed ?? 1),
    shuffleQuestions: !!row.shuffle_questions,
    shuffleOptions: !!row.shuffle_options,
    showScoreImmediately: row.show_score_immediately == null ? true : !!row.show_score_immediately,
    showCorrectAnswers: row.show_correct_answers ?? 'AFTER_END',
    showExplanation: row.show_explanation == null ? true : !!row.show_explanation,
    passPercentage: Number(row.pass_percentage ?? 40),
    randomSelection: parseJson(row.random_selection, null),
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    archivedAt: row.archived_at,
    structureLocked: !!row.structure_locked,
    structureVersion: Number(row.structure_version ?? 1),
    canEditStructure: !row.structure_locked && row.status !== 'ARCHIVED',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attemptCount: row.attempt_count != null ? Number(row.attempt_count) : undefined,
    questionCount: row.question_count != null ? Number(row.question_count) : undefined,
    totalMarks: row.total_marks != null ? Number(row.total_marks) : undefined,
    departmentName: row.department_name ?? undefined,
    courseName: row.course_name ?? undefined,
    courseCode: row.course_code ?? undefined,
    moduleName: row.module_name ?? undefined,
    academicYearLabel: row.academic_year_label ?? undefined,
    semesterLabel: row.semester_label ?? undefined,
    shareCode: row.share_code ?? undefined,
    timezone: (row.timezone as string | undefined) ?? DEFAULT_TIMEZONE,
  };
}

const quizSelect = [
  'q.*',
  'd.name as department_name',
  'c.name as course_name',
  'c.code as course_code',
  'm.name as module_name',
  'ay.label as academic_year_label',
  'se.label as semester_label',
  'col.timezone as timezone',
  'fu.name as created_by_name',
  'ql.code as share_code',
];

function quizBaseQuery() {
  return db('quizzes as q')
    .leftJoin('departments as d', 'd.id', 'q.department_id')
    .leftJoin('courses as c', 'c.id', 'q.course_id')
    .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
    .leftJoin('academic_years as ay', 'ay.id', 'q.academic_year_id')
    .leftJoin('semesters as se', 'se.id', 'q.semester_id')
    .leftJoin('colleges as col', 'col.id', 'q.college_id')
    .leftJoin('faculty_users as fu', 'fu.id', 'q.created_by')
    .leftJoin('quiz_links as ql', function joinLink() {
      this.on('ql.quiz_id', '=', 'q.id').andOn('ql.is_active', '=', db.raw('1'));
    });
}

export async function listQuizzes(
  collegeId: number,
  opts: { status?: string; createdBy?: number } = {},
) {
  let query = quizBaseQuery().where('q.college_id', collegeId).whereNull('q.deleted_at');
  if (opts.createdBy) query = query.andWhere('q.created_by', opts.createdBy);
  if (opts.status) query = query.andWhere('q.status', opts.status);

  const rows = await query
    .select(...quizSelect)
    .select(
      db.raw(
        `(select count(*) from quiz_questions qq where qq.quiz_id = q.id) as question_count`,
      ),
      db.raw(
        `(select coalesce(sum(qq.marks), 0) from quiz_questions qq where qq.quiz_id = q.id) as total_marks`,
      ),
      db.raw(
        `(select count(*) from quiz_attempts qa where qa.quiz_id = q.id and qa.status in ('SUBMITTED','EXPIRED_SUBMITTED')) as attempt_count`,
      ),
    )
    .orderBy('q.created_at', 'desc');

  return rows.map((r) => mapQuizRow(r));
}

export async function getQuiz(quizId: number, collegeId: number) {
  const row = await quizBaseQuery()
    .where({ 'q.id': quizId, 'q.college_id': collegeId })
    .whereNull('q.deleted_at')
    .select(...quizSelect)
    .first();
  if (!row) throw new AppError(404, 'Quiz not found');

  const questions = await db('quiz_questions').where({ quiz_id: quizId }).orderBy('sort_order', 'asc');
  const qids = questions.map((q) => q.id);
  const options = qids.length
    ? await db('quiz_question_options').whereIn('quiz_question_id', qids).orderBy('sort_order', 'asc')
    : [];
  const moduleIds = [...new Set(questions.map((q) => q.module_id).filter(Boolean))] as number[];
  const moduleRows = moduleIds.length
    ? await db('subject_modules').whereIn('id', moduleIds).select('id', 'name')
    : [];
  const moduleNames = new Map(moduleRows.map((m) => [m.id, m.name]));
  const byQ = new Map<number, typeof options>();
  for (const opt of options) {
    const list = byQ.get(opt.quiz_question_id) ?? [];
    list.push(opt);
    byQ.set(opt.quiz_question_id, list);
  }

  const attemptCount = await db('quiz_attempts')
    .where({ quiz_id: quizId })
    .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
    .count({ c: '*' })
    .first();

  const mappedQuestions = questions.map((q) => {
    const opts = byQ.get(q.id) ?? [];
    return {
      id: q.id,
      bankQuestionId: q.bank_question_id,
      moduleId: q.module_id,
      moduleName: q.module_id ? moduleNames.get(q.module_id) ?? null : null,
      questionText: q.question_text,
      questionType: q.question_type as QuizQuestionType,
      marks: Number(q.marks),
      difficulty: q.difficulty,
      explanation: q.explanation,
      numericAnswer: q.numeric_answer != null ? Number(q.numeric_answer) : null,
      numericTolerance: q.numeric_tolerance != null ? Number(q.numeric_tolerance) : null,
      sortOrder: q.sort_order,
      primaryCoCode: q.primary_co_code ? String(q.primary_co_code).toUpperCase() : null,
      primaryCoId: q.primary_co_id != null ? Number(q.primary_co_id) : null,
      secondaryCoCodes: parseSecondaryCos(q.secondary_co_codes),
      mappingBasis: q.mapping_basis ?? null,
      mappingSource: q.mapping_source ?? null,
      verificationStatus: q.verification_status ?? null,
      coMappingBlocked: !!q.co_mapping_blocked,
      coMappingBlockReason: q.co_mapping_block_reason ?? null,
      derivedOutcomes: parseJson(q.derived_outcomes_snapshot, null),
      options: opts.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: !!o.is_correct,
        sortOrder: o.sort_order,
      })),
      correctOptionIds: opts.filter((o) => o.is_correct).map((o) => o.id),
    };
  });

  const totalMarks = mappedQuestions.reduce((sum, q) => sum + q.marks, 0);
  const academicCoverage = computeAcademicCoverage(mappedQuestions);
  return {
    ...mapQuizRow({
      ...row,
      attempt_count: Number(attemptCount?.c ?? 0),
      question_count: mappedQuestions.length,
      total_marks: totalMarks,
    }),
    questions: mappedQuestions,
    academicCoverage,
  };
}

export async function createQuiz(
  collegeId: number,
  createdBy: number,
  input: z.output<typeof quizMetaSchema>,
) {
  if (!isValidSchedule(input.startAt ?? null, input.endAt ?? null)) {
    throw new AppError(400, 'End date/time must be after the start date/time');
  }
  const [id] = await db('quizzes').insert({
    college_id: collegeId,
    created_by: createdBy,
    title: input.title.trim(),
    description: input.description ?? null,
    instructions: input.instructions ?? null,
    course_id: input.courseId ?? null,
    module_id: input.moduleId ?? null,
    academic_year_id: input.academicYearId ?? null,
    semester_id: input.semesterId ?? null,
    department_id: input.departmentId ?? null,
    class_section_id: input.classSectionId ?? null,
    duration_minutes: input.durationMinutes ?? 20,
    start_at: input.startAt ? new Date(input.startAt) : null,
    end_at: input.endAt ? new Date(input.endAt) : null,
    status: 'DRAFT',
    attempts_allowed: input.attemptsAllowed ?? 1,
    shuffle_questions: input.shuffleQuestions ?? false,
    shuffle_options: input.shuffleOptions ?? false,
    show_score_immediately: input.showScoreImmediately ?? true,
    show_correct_answers: input.showCorrectAnswers ?? 'AFTER_END',
    show_explanation: input.showExplanation ?? true,
    pass_percentage: input.passPercentage ?? 40,
    random_selection: input.randomSelection ? JSON.stringify(input.randomSelection) : null,
  });
  return getQuiz(id, collegeId);
}

export async function updateQuiz(
  quizId: number,
  collegeId: number,
  input: Partial<z.output<typeof quizMetaSchema>>,
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be edited');

  const nextStart = input.startAt !== undefined ? input.startAt : quiz.start_at;
  const nextEnd = input.endAt !== undefined ? input.endAt : quiz.end_at;
  if (!isValidSchedule(nextStart ?? null, nextEnd ?? null)) {
    throw new AppError(400, 'End date/time must be after the start date/time');
  }

  const locked = !!quiz.structure_locked;
  const patch: Record<string, unknown> = {
    title: input.title?.trim() ?? quiz.title,
    description: input.description !== undefined ? input.description : quiz.description,
    instructions: input.instructions !== undefined ? input.instructions : quiz.instructions,
    academic_year_id: input.academicYearId !== undefined ? input.academicYearId : quiz.academic_year_id,
    semester_id: input.semesterId !== undefined ? input.semesterId : quiz.semester_id,
    department_id: input.departmentId !== undefined ? input.departmentId : quiz.department_id,
    class_section_id: input.classSectionId !== undefined ? input.classSectionId : quiz.class_section_id,
    start_at: input.startAt !== undefined ? (input.startAt ? new Date(input.startAt) : null) : quiz.start_at,
    end_at: input.endAt !== undefined ? (input.endAt ? new Date(input.endAt) : null) : quiz.end_at,
  };

  if (!locked) {
    patch.course_id = input.courseId !== undefined ? input.courseId : quiz.course_id;
    patch.module_id = input.moduleId !== undefined ? input.moduleId : quiz.module_id;
    patch.duration_minutes =
      input.durationMinutes !== undefined ? input.durationMinutes : quiz.duration_minutes;
    patch.attempts_allowed =
      input.attemptsAllowed !== undefined ? input.attemptsAllowed : quiz.attempts_allowed;
    patch.shuffle_questions =
      input.shuffleQuestions !== undefined ? input.shuffleQuestions : quiz.shuffle_questions;
    patch.shuffle_options =
      input.shuffleOptions !== undefined ? input.shuffleOptions : quiz.shuffle_options;
    patch.show_score_immediately =
      input.showScoreImmediately !== undefined
        ? input.showScoreImmediately
        : quiz.show_score_immediately;
    patch.show_correct_answers =
      input.showCorrectAnswers !== undefined ? input.showCorrectAnswers : quiz.show_correct_answers;
    patch.show_explanation =
      input.showExplanation !== undefined ? input.showExplanation : quiz.show_explanation;
    patch.pass_percentage =
      input.passPercentage !== undefined ? input.passPercentage : quiz.pass_percentage;
    patch.random_selection =
      input.randomSelection !== undefined
        ? input.randomSelection
          ? JSON.stringify(input.randomSelection)
          : null
        : quiz.random_selection;
  }

  await db('quizzes').where({ id: quizId }).update(patch);
  return getQuiz(quizId, collegeId);
}

export async function softDeleteQuiz(quizId: number, collegeId: number) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.structure_locked) {
    throw new AppError(400, 'Quizzes with student attempts cannot be deleted. Archive them instead.');
  }
  await db('quizzes').where({ id: quizId }).update({ deleted_at: db.fn.now(), status: 'ARCHIVED' });
  return { ok: true };
}

async function insertQuestion(
  quizId: number,
  collegeId: number,
  courseId: number | null | undefined,
  input: z.output<typeof quizQuestionSchema>,
  sortOrder: number,
  opts: { requirePrimaryCo?: boolean; defaultMappingSource?: string } = {},
) {
  const validation = validateGradableQuestion({
    questionType: input.questionType,
    options: input.options ?? [],
    numericAnswer: input.numericAnswer,
  });
  if (!validation.ok && input.questionType !== 'SHORT_ANSWER') {
    throw new AppError(400, 'Correct answer is incomplete', { notes: validation.notes });
  }

  const isCustom = !input.bankQuestionId;
  const requireCo = opts.requirePrimaryCo ?? isCustom;
  const resolved = await resolvePrimaryCoForSubject({
    collegeId,
    courseId,
    primaryCoCode: input.primaryCoCode,
    strict: requireCo,
    require: requireCo,
  });

  const [id] = await db('quiz_questions').insert({
    quiz_id: quizId,
    bank_question_id: input.bankQuestionId ?? null,
    module_id: input.moduleId ?? null,
    question_text: input.questionText.trim(),
    question_type: input.questionType,
    marks: input.marks ?? 1,
    difficulty: input.difficulty ?? null,
    explanation: input.explanation ?? null,
    numeric_answer: input.numericAnswer ?? null,
    numeric_tolerance: input.numericTolerance ?? 0,
    sort_order: sortOrder,
    primary_co_code: resolved.primaryCoCode,
    primary_co_id: resolved.primaryCoId,
    secondary_co_codes: input.secondaryCoCodes
      ? JSON.stringify(parseSecondaryCos(input.secondaryCoCodes))
      : null,
    mapping_basis: input.mappingBasis ?? null,
    mapping_source:
      input.mappingSource ??
      opts.defaultMappingSource ??
      (isCustom ? 'FACULTY_CUSTOM' : 'QUESTION_BANK'),
    verification_status:
      input.verificationStatus ??
      (resolved.blocked
        ? 'CO_MAPPING_BLOCKED'
        : resolved.primaryCoCode
          ? 'ACADEMIC_ANALYSIS'
          : null),
    co_mapping_blocked: resolved.blocked,
    co_mapping_block_reason: resolved.blockReason,
    derived_outcomes_snapshot: resolved.derived ? JSON.stringify(resolved.derived) : null,
  });
  for (const [i, opt] of (input.options ?? []).entries()) {
    await db('quiz_question_options').insert({
      quiz_question_id: id,
      label: opt.label.trim(),
      is_correct: !!opt.isCorrect,
      sort_order: opt.sortOrder ?? i,
    });
  }
  return id;
}

export async function addQuestion(
  quizId: number,
  collegeId: number,
  input: z.output<typeof quizQuestionSchema>,
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  assertStructureEditable(quiz);
  if (!input.primaryCoCode?.trim()) {
    throw new AppError(400, 'Primary Course Outcome (CO) is required for custom quiz questions', undefined, 'PRIMARY_CO_REQUIRED');
  }
  const max = await db('quiz_questions').where({ quiz_id: quizId }).max('sort_order as m').first();
  await insertQuestion(quizId, collegeId, quiz.course_id, input, Number(max?.m ?? -1) + 1, {
    requirePrimaryCo: true,
    defaultMappingSource: 'FACULTY_CUSTOM',
  });
  return getQuiz(quizId, collegeId);
}

export async function updateQuestion(
  quizId: number,
  collegeId: number,
  questionId: number,
  input: Partial<z.output<typeof quizQuestionSchema>>,
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  assertStructureEditable(quiz);
  const existing = await db('quiz_questions').where({ id: questionId, quiz_id: quizId }).first();
  if (!existing) throw new AppError(404, 'Question not found');

  const nextType = (input.questionType ?? existing.question_type) as QuizQuestionType;
  const nextOptions =
    input.options ??
    (await db('quiz_question_options').where({ quiz_question_id: questionId })).map((o) => ({
      label: o.label,
      isCorrect: !!o.is_correct,
    }));
  const validation = validateGradableQuestion({
    questionType: nextType,
    options: nextOptions,
    numericAnswer:
      input.numericAnswer !== undefined
        ? input.numericAnswer
        : existing.numeric_answer != null
          ? Number(existing.numeric_answer)
          : null,
  });
  if (!validation.ok && nextType !== 'SHORT_ANSWER') {
    throw new AppError(400, 'Correct answer is incomplete', { notes: validation.notes });
  }

  await db('quiz_questions')
    .where({ id: questionId })
    .update({
      question_text: input.questionText?.trim() ?? existing.question_text,
      question_type: nextType,
      marks: input.marks ?? existing.marks,
      difficulty: input.difficulty !== undefined ? input.difficulty : existing.difficulty,
      explanation: input.explanation !== undefined ? input.explanation : existing.explanation,
      numeric_answer: input.numericAnswer !== undefined ? input.numericAnswer : existing.numeric_answer,
      numeric_tolerance:
        input.numericTolerance !== undefined ? input.numericTolerance : existing.numeric_tolerance,
      module_id: input.moduleId !== undefined ? input.moduleId : existing.module_id,
    });

  if (
    input.primaryCoCode !== undefined ||
    input.secondaryCoCodes !== undefined ||
    input.mappingBasis !== undefined ||
    input.mappingSource !== undefined ||
    input.verificationStatus !== undefined
  ) {
    const resolved = await resolvePrimaryCoForSubject({
      collegeId,
      courseId: quiz.course_id,
      primaryCoCode:
        input.primaryCoCode !== undefined ? input.primaryCoCode : existing.primary_co_code,
      strict: true,
      require: true,
    });
    await db('quiz_questions')
      .where({ id: questionId })
      .update({
        primary_co_code: resolved.primaryCoCode,
        primary_co_id: resolved.primaryCoId,
        secondary_co_codes:
          input.secondaryCoCodes !== undefined
            ? JSON.stringify(parseSecondaryCos(input.secondaryCoCodes))
            : existing.secondary_co_codes,
        mapping_basis: input.mappingBasis !== undefined ? input.mappingBasis : existing.mapping_basis,
        mapping_source:
          input.mappingSource !== undefined ? input.mappingSource : existing.mapping_source,
        verification_status:
          input.verificationStatus ??
          (resolved.blocked
            ? 'CO_MAPPING_BLOCKED'
            : existing.verification_status ?? 'ACADEMIC_ANALYSIS'),
        co_mapping_blocked: resolved.blocked,
        co_mapping_block_reason: resolved.blockReason,
        derived_outcomes_snapshot: resolved.derived ? JSON.stringify(resolved.derived) : null,
      });
  }

  if (input.options) {
    await db('quiz_question_options').where({ quiz_question_id: questionId }).del();
    for (const [i, opt] of input.options.entries()) {
      await db('quiz_question_options').insert({
        quiz_question_id: questionId,
        label: opt.label.trim(),
        is_correct: !!opt.isCorrect,
        sort_order: opt.sortOrder ?? i,
      });
    }
  }
  return getQuiz(quizId, collegeId);
}

export async function deleteQuestion(quizId: number, collegeId: number, questionId: number) {
  const quiz = await assertQuizRow(quizId, collegeId);
  assertStructureEditable(quiz);
  await db('quiz_questions').where({ id: questionId, quiz_id: quizId }).del();
  return getQuiz(quizId, collegeId);
}

export async function addFromBank(
  quizId: number,
  collegeId: number,
  bankQuestionIds: number[],
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  assertStructureEditable(quiz);
  const items = await db('quiz_bank_questions')
    .where({ college_id: collegeId, is_active: true })
    .whereIn('id', bankQuestionIds);
  if (items.length !== bankQuestionIds.length) {
    throw new AppError(400, 'One or more question bank items were not found');
  }
  const notReady = items.filter((i) => !isSelectableReviewStatus(String(i.review_status)));
  if (notReady.length) {
    throw new AppError(400, 'Questions marked Needs Review cannot be added to a graded quiz');
  }

  const max = await db('quiz_questions').where({ quiz_id: quizId }).max('sort_order as m').first();
  let sort = Number(max?.m ?? -1) + 1;
  for (const item of items) {
    const options = await db('quiz_bank_options').where({ question_id: item.id }).orderBy('sort_order');
    await insertQuestion(
      quizId,
      collegeId,
      quiz.course_id ?? item.course_id,
      {
        bankQuestionId: item.id,
        moduleId: item.module_id,
        questionText: item.question_text,
        questionType: item.question_type,
        marks: Number(item.marks),
        difficulty: item.difficulty,
        explanation: item.explanation,
        numericAnswer: item.numeric_answer != null ? Number(item.numeric_answer) : null,
        numericTolerance: item.numeric_tolerance != null ? Number(item.numeric_tolerance) : 0,
        options: options.map((o) => ({ label: o.label, isCorrect: !!o.is_correct })),
        primaryCoCode: item.primary_co_code,
        secondaryCoCodes: parseSecondaryCos(item.secondary_co_codes),
        mappingBasis: item.mapping_basis,
        mappingSource: item.mapping_source ?? 'QUESTION_BANK',
        verificationStatus: item.verification_status,
      },
      sort,
      { requirePrimaryCo: false, defaultMappingSource: 'QUESTION_BANK' },
    );
    // Prefer bank's already-resolved derived snapshot when present (historical consistency)
    if (item.derived_outcomes_snapshot && item.primary_co_code) {
      const latest = await db('quiz_questions')
        .where({ quiz_id: quizId, bank_question_id: item.id })
        .orderBy('id', 'desc')
        .first();
      if (latest) {
        await db('quiz_questions').where({ id: latest.id }).update({
          primary_co_code: item.primary_co_code,
          primary_co_id: item.primary_co_id,
          secondary_co_codes: item.secondary_co_codes,
          mapping_basis: item.mapping_basis,
          mapping_source: item.mapping_source,
          verification_status: item.verification_status,
          co_mapping_blocked: !!item.co_mapping_blocked,
          co_mapping_block_reason: item.co_mapping_block_reason,
          derived_outcomes_snapshot: item.derived_outcomes_snapshot,
        });
      }
    }
    sort += 1;
  }
  return getQuiz(quizId, collegeId);
}

export async function addRandomFromBank(
  quizId: number,
  collegeId: number,
  selections: Array<{ moduleId: number; count: number }>,
) {
  const ids: number[] = [];
  for (const sel of selections) {
    const pool = await db('quiz_bank_questions')
      .where({
        college_id: collegeId,
        module_id: sel.moduleId,
        is_active: true,
      })
      .whereIn('review_status', ['READY', 'APPROVED'])
      .select('id');
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    ids.push(...shuffled.slice(0, sel.count).map((r) => r.id));
  }
  if (!ids.length) throw new AppError(400, 'No ready questions matched that selection');
  return addFromBank(quizId, collegeId, ids);
}

export async function reorderQuestions(
  quizId: number,
  collegeId: number,
  body: z.output<typeof reorderSchema>,
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  assertStructureEditable(quiz);
  await db.transaction(async (trx) => {
    for (const q of body.questions) {
      await trx('quiz_questions').where({ id: q.id, quiz_id: quizId }).update({ sort_order: q.sortOrder });
    }
  });
  return getQuiz(quizId, collegeId);
}

export async function buildSnapshot(quizId: number, collegeId: number): Promise<SnapshotQuestion[]> {
  const detail = await getQuiz(quizId, collegeId);
  const moduleIds = [...new Set(detail.questions.map((q) => q.moduleId).filter(Boolean))] as number[];
  const modules = moduleIds.length
    ? await db('subject_modules').whereIn('id', moduleIds).select('id', 'name')
    : [];
  const names = new Map(modules.map((m) => [m.id, m.name]));
  return detail.questions.map((q) => ({
    id: q.id,
    bankQuestionId: q.bankQuestionId,
    moduleId: q.moduleId,
    moduleName: q.moduleId ? names.get(q.moduleId) ?? null : null,
    questionText: q.questionText,
    questionType: q.questionType,
    marks: q.marks,
    maxMarks: q.marks,
    explanation: q.explanation,
    difficulty: q.difficulty,
    options: q.options.map(
      (o): SnapshotOption => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      }),
    ),
    correctOptionIds: q.correctOptionIds,
    numericAnswer: q.numericAnswer,
    numericTolerance: q.numericTolerance,
    primaryCoCode: q.primaryCoCode,
    primaryCoId: q.primaryCoId,
    secondaryCoCodes: q.secondaryCoCodes,
    mappingBasis: q.mappingBasis,
    mappingSource: q.mappingSource,
    verificationStatus: q.verificationStatus,
    derivedOutcomes: q.derivedOutcomes,
  }));
}

async function ensureShareCode(quizId: number) {
  let link = await db('quiz_links').where({ quiz_id: quizId, is_active: true }).first();
  if (link) return link;
  let code = generateQuizCode();
  while (await db('quiz_links').where({ code }).first()) code = generateQuizCode();
  const [id] = await db('quiz_links').insert({ quiz_id: quizId, code, is_active: true });
  return db('quiz_links').where({ id }).first();
}

export async function publishQuiz(quizId: number, collegeId: number) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be published');
  const count = await db('quiz_questions').where({ quiz_id: quizId }).count({ c: '*' }).first();
  if (Number(count?.c ?? 0) < 1) {
    throw new AppError(400, 'Add at least one question before publishing');
  }
  const snapshot = await buildSnapshot(quizId, collegeId);
  const ungradable = snapshot.filter(
    (q) =>
      q.questionType !== 'SHORT_ANSWER' &&
      !validateGradableQuestion({
        questionType: q.questionType,
        options: q.options,
        numericAnswer: q.numericAnswer,
      }).ok,
  );
  if (ungradable.length) {
    throw new AppError(400, 'Every auto-graded question must have a verified correct answer');
  }

  const link = await ensureShareCode(quizId);
  const now = new Date();
  const status = deriveStoredStatusAfterSchedule(quiz.start_at, quiz.end_at, now);
  await db('quizzes').where({ id: quizId }).update({
    status,
    published_at: quiz.published_at ?? now,
    closed_at: null,
    published_snapshot: JSON.stringify({
      capturedAt: now.toISOString(),
      structureVersion: Number(quiz.structure_version ?? 1),
      questions: snapshot,
    }),
  });
  return { quiz: await getQuiz(quizId, collegeId), shareCode: link.code };
}

export async function closeQuiz(
  quizId: number,
  collegeId: number,
  opts: { terminateActiveAttempts?: boolean } = {},
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be closed');
  if (quiz.status === 'DRAFT') throw new AppError(400, 'Only a published quiz can be closed');
  await db('quizzes').where({ id: quizId }).update({ status: 'CLOSED', closed_at: db.fn.now() });
  if (opts.terminateActiveAttempts) {
    await db('quiz_attempts')
      .where({ quiz_id: quizId, status: 'IN_PROGRESS' })
      .update({ expires_at: db.fn.now() });
  }
  return getQuiz(quizId, collegeId);
}

export async function reopenQuiz(quizId: number, collegeId: number) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be reopened');
  const now = new Date();
  const end = quiz.end_at ? new Date(quiz.end_at) : null;
  if (end && now.getTime() >= end.getTime()) {
    throw new AppError(400, 'Extend or update the end date before reopening this quiz', undefined, 'QUIZ_ENDED');
  }
  const status = deriveStoredStatusAfterSchedule(quiz.start_at, quiz.end_at, now);
  await db('quizzes').where({ id: quizId }).update({ status, closed_at: null });
  return getQuiz(quizId, collegeId);
}

export async function extendQuiz(
  quizId: number,
  collegeId: number,
  endAt: string,
  opts: { reopen?: boolean } = {},
) {
  const quiz = await assertQuizRow(quizId, collegeId);
  if (quiz.status === 'ARCHIVED') throw new AppError(400, 'Archived quizzes cannot be extended');
  if (!isValidSchedule(quiz.start_at, endAt)) {
    throw new AppError(400, 'End date/time must be after the start date/time');
  }
  const resolved = resolveExtendResult({
    startAt: quiz.start_at,
    endAt,
    currentClosedAt: quiz.closed_at,
    reopen: !!opts.reopen,
  });
  await db('quizzes').where({ id: quizId }).update({
    end_at: new Date(endAt),
    closed_at: resolved.closedAt,
    status: resolved.storedStatus,
  });
  return getQuiz(quizId, collegeId);
}

export async function archiveQuiz(quizId: number, collegeId: number) {
  await assertQuizRow(quizId, collegeId);
  await db('quizzes').where({ id: quizId }).update({
    status: 'ARCHIVED',
    archived_at: db.fn.now(),
  });
  return getQuiz(quizId, collegeId);
}

export async function duplicateQuiz(quizId: number, collegeId: number, createdBy: number) {
  const source = await getQuiz(quizId, collegeId);
  const copy = await createQuiz(collegeId, createdBy, {
    title: `${String(source.title)} (Copy)`,
    description: source.description != null ? String(source.description) : null,
    instructions: source.instructions != null ? String(source.instructions) : null,
    courseId: source.courseId != null ? Number(source.courseId) : null,
    moduleId: source.moduleId != null ? Number(source.moduleId) : null,
    academicYearId: source.academicYearId != null ? Number(source.academicYearId) : null,
    semesterId: source.semesterId != null ? Number(source.semesterId) : null,
    departmentId: source.departmentId != null ? Number(source.departmentId) : null,
    classSectionId: source.classSectionId != null ? Number(source.classSectionId) : null,
    durationMinutes: source.durationMinutes != null ? Number(source.durationMinutes) : 20,
    startAt: null,
    endAt: null,
    attemptsAllowed: source.attemptsAllowed,
    shuffleQuestions: source.shuffleQuestions,
    shuffleOptions: source.shuffleOptions,
    showScoreImmediately: source.showScoreImmediately,
    showCorrectAnswers: source.showCorrectAnswers as (typeof CORRECT_ANSWER_VISIBILITY)[number],
    showExplanation: source.showExplanation,
    passPercentage: source.passPercentage,
    randomSelection: source.randomSelection,
  });
  await db('quizzes').where({ id: copy.id }).update({ duplicated_from_id: quizId });
  for (const q of source.questions) {
    await insertQuestion(
      Number(copy.id),
      collegeId,
      source.courseId != null ? Number(source.courseId) : null,
      {
        bankQuestionId: q.bankQuestionId,
        moduleId: q.moduleId,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        difficulty: q.difficulty,
        explanation: q.explanation,
        numericAnswer: q.numericAnswer,
        numericTolerance: q.numericTolerance,
        options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })),
        primaryCoCode: q.primaryCoCode,
        secondaryCoCodes: q.secondaryCoCodes,
        mappingBasis: q.mappingBasis,
        mappingSource: q.mappingSource,
        verificationStatus: q.verificationStatus,
      },
      q.sortOrder,
      { requirePrimaryCo: false },
    );
  }
  return getQuiz(Number(copy.id), collegeId);
}

export async function getQuizAudit(quizId: number, collegeId: number) {
  await assertQuizRow(quizId, collegeId);
  return listQuizAudit(quizId, collegeId);
}

export async function lockStructureIfNeeded(quizId: number, trx: Knex | Knex.Transaction = db) {
  await trx('quizzes').where({ id: quizId, structure_locked: false }).update({ structure_locked: true });
}
