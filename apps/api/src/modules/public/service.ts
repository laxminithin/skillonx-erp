import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import {
  getSurveyAvailabilityStatus,
  isStudentAccessible,
  availabilityReason,
  availabilityMessage,
  type AvailabilityStatus,
} from '../../utils/surveyStatus.js';
import {
  normalizeQuestionType,
  normalizeUsn,
  NUMERIC_QUESTION_TYPES,
} from '../../types/domain.js';
import { lockStructureIfNeeded } from '../surveys/service.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';

export const studentInfoSchema = z.object({
  name: z.string().min(1, 'Student name is required').max(255),
  usn: z
    .string()
    .min(5, 'Enter a valid USN')
    .max(64)
    .transform((v) => normalizeUsn(v))
    .refine((v) => /^[A-Z0-9]+$/.test(v), 'USN can only contain letters and numbers'),
  email: z.string().email('Enter a valid email address'),
});

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  textAnswer: z.string().max(5000, 'Answer is too long').optional().nullable(),
  numericAnswer: z.number().finite().optional().nullable(),
  selectedOptionId: z.number().int().positive().optional().nullable(),
  jsonAnswer: z.unknown().optional().nullable(),
  comment: z.string().max(2000, 'Comment is too long').optional().nullable(),
});

export const submitSchema = z.object({
  submissionId: z.number().int().positive(),
  answers: z.array(answerSchema).min(1),
});

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

async function getSurveyByCode(code: string) {
  const link = await db('survey_links as sl')
    .join('surveys as s', 's.id', 'sl.survey_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .leftJoin('colleges as col', 'col.id', 's.college_id')
    .where({ 'sl.code': code, 'sl.is_active': true })
    .whereNull('s.deleted_at')
    .select(
      's.*',
      'sl.code as share_code',
      'd.name as department_name',
      'c.name as course_name',
      'c.code as course_code',
      'col.timezone as college_timezone',
    )
    .first();

  if (!link) throw new AppError(404, 'Survey not found');
  return link;
}

function surveyAvailability(survey: Record<string, unknown>, now = new Date()) {
  return getSurveyAvailabilityStatus(
    {
      status: String(survey.status),
      startAt: (survey.start_at as Date | null) ?? null,
      endAt: (survey.end_at as Date | null) ?? null,
      closedAt: (survey.closed_at as Date | null) ?? null,
      archivedAt: (survey.archived_at as Date | null) ?? null,
      deletedAt: (survey.deleted_at as Date | null) ?? null,
    },
    now,
  );
}

function assertAcceptingResponses(survey: Record<string, unknown>) {
  const effective = surveyAvailability(survey);
  if (isStudentAccessible(effective)) return effective;

  const code = availabilityReason(effective);
  throw new AppError(400, availabilityMessage(effective), { effectiveStatus: effective }, code);
}

function publicSurveySummary(survey: Record<string, unknown>, effective: AvailabilityStatus) {
  return {
    title: survey.title,
    description: survey.description,
    surveyType: survey.survey_type,
    departmentName: survey.department_name,
    courseName: survey.course_name,
    courseCode: survey.course_code,
    identityMode: survey.identity_mode,
    effectiveStatus: effective,
    availabilityReason: availabilityReason(effective),
    startAt: survey.start_at ?? null,
    endAt: survey.end_at ?? null,
    closedAt: survey.closed_at ?? null,
    timezone: (survey.college_timezone as string) || DEFAULT_TIMEZONE,
  };
}

export async function getPublicSurvey(code: string) {
  const survey = await getSurveyByCode(code);
  const effective = surveyAvailability(survey);

  if (effective === 'DRAFT' || effective === 'ARCHIVED') {
    throw new AppError(404, 'Survey not found', undefined, availabilityReason(effective));
  }

  if (!isStudentAccessible(effective)) {
    return {
      accessible: false,
      reason: availabilityReason(effective),
      message: availabilityMessage(effective),
      survey: publicSurveySummary(survey, effective),
    };
  }

  const sections = await db('survey_sections')
    .where({ survey_id: survey.id })
    .orderBy('sort_order', 'asc');
  const questions = await db('questions')
    .where({ survey_id: survey.id })
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

  return {
    accessible: true,
    reason: availabilityReason(effective),
    survey: {
      ...publicSurveySummary(survey, effective),
      id: survey.id,
      responsePolicy: survey.response_policy,
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        questions: questions
          .filter((q) => q.section_id === s.id)
          .map((q) => ({
            id: q.id,
            questionType: normalizeQuestionType(q.question_type),
            prompt: q.prompt,
            helpText: q.help_text,
            isRequired: !!q.is_required,
            allowComment: !!q.allow_comment,
            config: parseJson(q.config) ?? {},
            options: (optionsByQ.get(q.id) ?? []).map((o) => ({
              id: o.id,
              label: o.label,
              value: o.value,
            })),
          })),
      })),
    },
  };
}

async function upsertStudent(
  collegeId: number,
  info: z.infer<typeof studentInfoSchema>,
  departmentId: number | null,
) {
  const usn = normalizeUsn(info.usn);
  const existing = await db('students').where({ college_id: collegeId, usn }).first();

  if (existing) {
    await db('students')
      .where({ id: existing.id })
      .update({
        name: info.name.trim(),
        email: info.email.trim().toLowerCase(),
        department_id: departmentId ?? existing.department_id,
        updated_at: db.fn.now(),
      });
    return existing.id as number;
  }

  const [id] = await db('students').insert({
    college_id: collegeId,
    department_id: departmentId,
    name: info.name.trim(),
    usn,
    email: info.email.trim().toLowerCase(),
  });
  return id;
}

async function assertCanStart(survey: Record<string, unknown>, studentId: number) {
  const policy = String(survey.response_policy);
  if (policy === 'MULTIPLE') return;

  const completed = await db('survey_submissions')
    .where({
      survey_id: survey.id,
      student_id: studentId,
      status: 'COMPLETED',
    })
    .orderBy('submitted_at', 'desc')
    .first();

  if (!completed) return;

  if (policy === 'ONE_PER_STUDENT' || policy === 'ONE_PER_CYCLE') {
    throw new AppError(
      409,
      'You have already submitted this survey.',
      { submittedAt: completed.submitted_at ?? null },
      'ALREADY_SUBMITTED',
    );
  }
}

function answerHasValue(answer: z.infer<typeof answerSchema>, type: string) {
  const normalized = normalizeQuestionType(type);
  if (normalized === 'SHORT_ANSWER' || normalized === 'LONG_ANSWER') {
    return Boolean(answer.textAnswer?.trim());
  }
  if (normalized === 'CHECKBOX') {
    return Array.isArray(answer.jsonAnswer) && (answer.jsonAnswer as unknown[]).length > 0;
  }
  if (
    normalized === 'NUMERICAL' ||
    NUMERIC_QUESTION_TYPES.has(normalized) ||
    normalized === 'MULTIPLE_CHOICE' ||
    normalized === 'DROPDOWN' ||
    normalized === 'YES_NO'
  ) {
    return answer.selectedOptionId != null || answer.numericAnswer != null;
  }
  return (
    answer.selectedOptionId != null ||
    answer.numericAnswer != null ||
    Boolean(answer.textAnswer?.trim()) ||
    answer.jsonAnswer != null
  );
}

const NUMERIC_RANGE_TYPES = new Set([
  'STAR_RATING',
  'SMILE_RATING',
  'NUMERICAL',
  'LIKERT',
  'RATING',
]);

export function validateAnswerAgainstQuestion(
  question: Record<string, unknown>,
  answer: z.infer<typeof answerSchema>,
  options: Array<{ id: number; value: number | null }>,
) {
  const type = normalizeQuestionType(String(question.question_type));
  const config = (parseJson(question.config) as Record<string, unknown>) ?? {};
  const optionIds = new Set(options.map((o) => o.id));

  if (type === 'SHORT_ANSWER' || type === 'LONG_ANSWER') {
    if (!answer.textAnswer?.trim()) {
      throw new AppError(400, `Please answer: ${question.prompt}`);
    }
    return;
  }

  if (type === 'CHECKBOX') {
    const selected = Array.isArray(answer.jsonAnswer) ? (answer.jsonAnswer as number[]) : [];
    if (!selected.length) throw new AppError(400, `Please answer: ${question.prompt}`);
    for (const id of selected) {
      if (!optionIds.has(id)) throw new AppError(400, 'Invalid option selected');
    }
    const min = Number(config.minSelections ?? 0);
    const max = Number(config.maxSelections ?? selected.length);
    if (selected.length < min) {
      throw new AppError(400, `Select at least ${min} option(s)`);
    }
    if (config.maxSelections != null && selected.length > max) {
      throw new AppError(400, `Select at most ${max} option(s)`);
    }
    return;
  }

  if (answer.selectedOptionId != null && !optionIds.has(answer.selectedOptionId)) {
    throw new AppError(400, 'Invalid option selected');
  }

  // Rating / numeric answers may arrive as a raw numericAnswer instead of an
  // option id. Never trust an arbitrary number — it must match one of the
  // question's configured option values (or the min/max range).
  if (
    NUMERIC_RANGE_TYPES.has(type) &&
    answer.selectedOptionId == null &&
    answer.numericAnswer != null
  ) {
    const allowedValues = options
      .map((o) => o.value)
      .filter((v): v is number => v != null);
    const inAllowedSet = allowedValues.length
      ? allowedValues.includes(answer.numericAnswer)
      : false;
    const min = Number(config.min ?? config.minValue ?? (allowedValues.length ? Math.min(...allowedValues) : 1));
    const max = Number(config.max ?? config.maxValue ?? config.maxStars ?? config.scale ?? (allowedValues.length ? Math.max(...allowedValues) : 5));
    const inRange = answer.numericAnswer >= min && answer.numericAnswer <= max;
    if (!inAllowedSet && !inRange) {
      throw new AppError(400, `Answer for "${question.prompt}" is outside the allowed range`);
    }
  }

  if (!answerHasValue(answer, type)) {
    throw new AppError(400, `Please answer: ${question.prompt}`);
  }
}

export async function startSubmission(
  code: string,
  info: z.infer<typeof studentInfoSchema>,
  meta: { ip?: string; userAgent?: string },
) {
  const survey = await getSurveyByCode(code);
  assertAcceptingResponses(survey);

  const studentId = await upsertStudent(survey.college_id, info, survey.department_id);
  await assertCanStart(survey, studentId);

  const priorAttempts = await db('survey_submissions')
    .where({ survey_id: survey.id, student_id: studentId })
    .count({ c: '*' })
    .first();

  const existingStarted = await db('survey_submissions')
    .where({ survey_id: survey.id, student_id: studentId, status: 'STARTED' })
    .first();

  if (existingStarted) {
    return { submissionId: existingStarted.id, studentId };
  }

  const [submissionId] = await db('survey_submissions').insert({
    survey_id: survey.id,
    student_id: studentId,
    college_id: survey.college_id,
    started_at: db.fn.now(),
    status: 'STARTED',
    ip_address: meta.ip ?? null,
    device_information: meta.userAgent?.slice(0, 512) ?? null,
    attempt_number: Number(priorAttempts?.c ?? 0) + 1,
  });

  return { submissionId, studentId };
}

export async function submitAnswers(code: string, input: z.infer<typeof submitSchema>) {
  const survey = await getSurveyByCode(code);
  assertAcceptingResponses(survey);

  const submission = await db('survey_submissions')
    .where({ id: input.submissionId, survey_id: survey.id })
    .first();

  if (!submission) throw new AppError(404, 'Submission not found');
  if (submission.status === 'COMPLETED') {
    throw new AppError(409, 'Submission already completed');
  }

  await assertCanStart(survey, submission.student_id);

  const questions = await db('questions').where({ survey_id: survey.id });
  const options = questions.length
    ? await db('question_options').whereIn(
        'question_id',
        questions.map((q) => q.id),
      )
    : [];

  const optionsByQuestion = new Map<number, Array<{ id: number; value: number | null }>>();
  for (const opt of options) {
    const list = optionsByQuestion.get(opt.question_id) ?? [];
    list.push({ id: opt.id, value: opt.value != null ? Number(opt.value) : null });
    optionsByQuestion.set(opt.question_id, list);
  }

  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]));

  for (const question of questions) {
    const answer = answerMap.get(question.id);
    if (question.is_required) {
      if (!answer || !answerHasValue(answer, String(question.question_type))) {
        throw new AppError(400, 'Please answer all required questions');
      }
    }
    if (answer) {
      validateAnswerAgainstQuestion(question, answer, optionsByQuestion.get(question.id) ?? []);
    }
  }

  await db.transaction(async (trx) => {
    await trx('survey_answers').where({ submission_id: submission.id }).del();

    for (const answer of input.answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      let numericAnswer = answer.numericAnswer ?? null;
      if (numericAnswer == null && answer.selectedOptionId != null) {
        const opt = options.find((o) => o.id === answer.selectedOptionId);
        if (opt?.value != null) numericAnswer = Number(opt.value);
      }

      await trx('survey_answers').insert({
        submission_id: submission.id,
        question_id: answer.questionId,
        text_answer: answer.textAnswer ?? null,
        numeric_answer: numericAnswer,
        selected_option_id: answer.selectedOptionId ?? null,
        json_answer: answer.jsonAnswer != null ? JSON.stringify(answer.jsonAnswer) : null,
        comment: answer.comment ?? null,
        question_structure_version: Number(question.structure_version ?? 1),
      });
    }

    await trx('survey_submissions').where({ id: submission.id }).update({
      status: 'COMPLETED',
      submitted_at: trx.fn.now(),
    });
  });

  await lockStructureIfNeeded(survey.id);

  return { ok: true, submissionId: submission.id };
}
