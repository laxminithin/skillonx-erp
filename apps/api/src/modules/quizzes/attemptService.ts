import { z } from 'zod';
import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generateAttemptToken } from '../../utils/codes.js';
import { normalizeUsn } from '../../types/domain.js';
import {
  getQuizAvailabilityStatus,
  isStudentAccessible,
  quizAvailabilityMessage,
  quizAvailabilityReason,
  type AvailabilityStatus,
} from '../../utils/quizStatus.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';
import {
  canStartNewAttempt,
  computeExpiresAt,
  gradeAttempt,
  isAttemptExpired,
  pickRandom,
  remainingSeconds,
  shuffled,
  type AttemptAnswerInput,
  type SnapshotQuestion,
} from './grading.js';
import {
  canShowCorrectAnswers,
  canShowScore,
  toPublicQuestion,
  toReviewQuestion,
  assertNoAnswerKeyLeak,
} from './serialize.js';
import { lockStructureIfNeeded } from './service.js';

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

export const attemptAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOptionIds: z.array(z.number().int().positive()).optional().nullable(),
  numericAnswer: z.number().finite().optional().nullable(),
  textAnswer: z.string().max(2000).optional().nullable(),
});

export const saveAnswersSchema = z.object({
  attemptToken: z.string().min(8).max(32),
  answers: z.array(attemptAnswerSchema),
});

export const submitSchema = z.object({
  attemptToken: z.string().min(8).max(32),
  answers: z.array(attemptAnswerSchema).optional().default([]),
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

async function getQuizByCode(code: string) {
  const row = await db('quiz_links as ql')
    .join('quizzes as q', 'q.id', 'ql.quiz_id')
    .leftJoin('courses as c', 'c.id', 'q.course_id')
    .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
    .leftJoin('colleges as col', 'col.id', 'q.college_id')
    .where({ 'ql.code': code, 'ql.is_active': true })
    .whereNull('q.deleted_at')
    .select(
      'q.*',
      'ql.code as share_code',
      'c.name as course_name',
      'c.code as course_code',
      'm.name as module_name',
      'col.timezone as college_timezone',
    )
    .first();
  if (!row) throw new AppError(404, 'Quiz not found');
  return row;
}

function quizAvailability(quiz: Record<string, unknown>, now = new Date()) {
  return getQuizAvailabilityStatus(
    {
      status: String(quiz.status),
      startAt: (quiz.start_at as Date | null) ?? null,
      endAt: (quiz.end_at as Date | null) ?? null,
      closedAt: (quiz.closed_at as Date | null) ?? null,
      archivedAt: (quiz.archived_at as Date | null) ?? null,
      deletedAt: (quiz.deleted_at as Date | null) ?? null,
    },
    now,
  );
}

function publicSummary(quiz: Record<string, unknown>, effective: AvailabilityStatus) {
  return {
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    courseName: quiz.course_name,
    courseCode: quiz.course_code,
    moduleName: quiz.module_name,
    durationMinutes: quiz.duration_minutes != null ? Number(quiz.duration_minutes) : null,
    attemptsAllowed: Number(quiz.attempts_allowed ?? 1),
    passPercentage: Number(quiz.pass_percentage ?? 40),
    shuffleQuestions: !!quiz.shuffle_questions,
    showScoreImmediately: quiz.show_score_immediately == null ? true : !!quiz.show_score_immediately,
    effectiveStatus: effective,
    availabilityReason: quizAvailabilityReason(effective),
    startAt: quiz.start_at ?? null,
    endAt: quiz.end_at ?? null,
    timezone: (quiz.college_timezone as string) || DEFAULT_TIMEZONE,
  };
}

async function questionStats(quizId: number) {
  const row = await db('quiz_questions')
    .where({ quiz_id: quizId })
    .count({ c: '*' })
    .sum({ marks: 'marks' })
    .first();
  return { questionCount: Number(row?.c ?? 0), totalMarks: Number(row?.marks ?? 0) };
}

export async function getPublicQuiz(code: string) {
  const quiz = await getQuizByCode(code);
  const effective = quizAvailability(quiz);
  if (effective === 'DRAFT' || effective === 'ARCHIVED') {
    throw new AppError(404, 'Quiz not found', undefined, quizAvailabilityReason(effective));
  }

  const stats = await questionStats(quiz.id);
  const summary = { ...publicSummary(quiz, effective), ...stats };

  if (!isStudentAccessible(effective)) {
    return {
      accessible: false,
      reason: quizAvailabilityReason(effective),
      message: quizAvailabilityMessage(effective),
      quiz: summary,
    };
  }

  return {
    accessible: true,
    reason: quizAvailabilityReason(effective),
    quiz: summary,
  };
}

export async function upsertIdentifiedStudent(
  collegeId: number,
  info: z.infer<typeof studentInfoSchema>,
  departmentId: number | null,
  trx: Knex | Knex.Transaction = db,
) {
  const usn = normalizeUsn(info.usn);
  const existing = await trx('students').where({ college_id: collegeId, usn }).first();
  if (existing) {
    await trx('students')
      .where({ id: existing.id })
      .update({
        name: info.name.trim(),
        email: info.email.trim().toLowerCase(),
        department_id: departmentId ?? existing.department_id,
        updated_at: trx.fn.now(),
      });
    return existing.id as number;
  }
  const [id] = await trx('students').insert({
    college_id: collegeId,
    department_id: departmentId,
    name: info.name.trim(),
    usn,
    email: info.email.trim().toLowerCase(),
  });
  return id as number;
}

function snapshotQuestions(quiz: Record<string, unknown>): SnapshotQuestion[] {
  const published = parseJson<{ questions?: SnapshotQuestion[] }>(quiz.published_snapshot, {});
  return published.questions ?? [];
}

function buildAttemptSnapshot(quiz: Record<string, unknown>): SnapshotQuestion[] {
  let questions = snapshotQuestions(quiz);
  const recipe = parseJson<Array<{ moduleId: number; count: number }>>(quiz.random_selection, []);
  if (recipe.length) {
    const selected: SnapshotQuestion[] = [];
    const used = new Set<number>();
    for (const rule of recipe) {
      const pool = questions.filter((q) => q.moduleId === rule.moduleId && !used.has(q.id));
      const picked = pickRandom(pool, rule.count);
      for (const q of picked) used.add(q.id);
      selected.push(...picked);
    }
    questions = selected.length ? selected : questions;
  }
  if (quiz.shuffle_questions) questions = shuffled(questions);
  if (quiz.shuffle_options) {
    questions = questions.map((q) => ({ ...q, options: shuffled(q.options) }));
  }
  return questions;
}

function publicAttemptPayload(
  attempt: Record<string, unknown>,
  questions: SnapshotQuestion[],
  saved: AttemptAnswerInput[],
) {
  const answersById = new Map(saved.map((a) => [a.questionId, a]));
  const payload = {
    attemptToken: attempt.public_token,
    attemptNumber: Number(attempt.attempt_number),
    startedAt: attempt.started_at,
    expiresAt: attempt.expires_at,
    remainingSeconds: remainingSeconds(attempt.expires_at as Date | null),
    status: attempt.status,
    questions: questions.map(toPublicQuestion),
    answers: questions.map((q) => {
      const a = answersById.get(q.id);
      return {
        questionId: q.id,
        selectedOptionIds: a?.selectedOptionIds ?? [],
        numericAnswer: a?.numericAnswer ?? null,
        textAnswer: a?.textAnswer ?? null,
      };
    }),
  };
  assertNoAnswerKeyLeak(payload, 'student-attempt');
  return payload;
}

async function loadSavedAnswers(
  attemptId: number,
  trx: Knex | Knex.Transaction = db,
): Promise<AttemptAnswerInput[]> {
  const rows = await trx('quiz_attempt_answers').where({ attempt_id: attemptId });
  return rows.map((r) => ({
    questionId: Number(r.snapshot_question_id),
    selectedOptionIds: parseJson<number[]>(r.selected_option_ids, []),
    numericAnswer: r.numeric_answer != null ? Number(r.numeric_answer) : null,
    textAnswer: r.text_answer,
  }));
}

async function persistAnswers(
  trx: Knex | Knex.Transaction,
  attemptId: number,
  answers: AttemptAnswerInput[],
) {
  for (const answer of answers) {
    const payload = {
      selected_option_ids: JSON.stringify(answer.selectedOptionIds ?? []),
      numeric_answer: answer.numericAnswer ?? null,
      text_answer: answer.textAnswer ?? null,
    };
    const existing = await trx('quiz_attempt_answers')
      .where({ attempt_id: attemptId, snapshot_question_id: String(answer.questionId) })
      .first();
    if (existing) {
      await trx('quiz_attempt_answers').where({ id: existing.id }).update(payload);
    } else {
      await trx('quiz_attempt_answers').insert({
        attempt_id: attemptId,
        snapshot_question_id: String(answer.questionId),
        ...payload,
      });
    }
  }
}

export async function startAttempt(
  code: string,
  info: z.infer<typeof studentInfoSchema>,
  meta: { ip?: string; userAgent?: string },
) {
  const quiz = await getQuizByCode(code);
  const effective = quizAvailability(quiz);

  return db.transaction(async (trx) => {
    const studentId = await upsertIdentifiedStudent(
      Number(quiz.college_id),
      info,
      quiz.department_id,
      trx,
    );
    const inProgress = await trx('quiz_attempts')
      .where({ quiz_id: quiz.id, student_id: studentId, status: 'IN_PROGRESS' })
      .forUpdate()
      .first();

    if (inProgress) {
      const questions = parseJson<SnapshotQuestion[]>(inProgress.question_snapshot, []);
      const saved = await loadSavedAnswers(inProgress.id, trx);
      if (isAttemptExpired(inProgress.expires_at)) {
        return finalizeAttempt(trx, quiz, inProgress, saved, true);
      }
      return {
        resumed: true,
        quiz: publicSummary(quiz, effective),
        ...publicAttemptPayload(inProgress, questions, saved),
      };
    }

    if (!isStudentAccessible(effective)) {
      throw new AppError(400, quizAvailabilityMessage(effective), { effectiveStatus: effective }, quizAvailabilityReason(effective));
    }

    const submitted = await trx('quiz_attempts')
      .where({ quiz_id: quiz.id, student_id: studentId })
      .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
      .count({ c: '*' })
      .first();
    const decision = canStartNewAttempt({
      attemptsAllowed: Number(quiz.attempts_allowed ?? 1),
      submittedCount: Number(submitted?.c ?? 0),
      inProgressCount: 0,
    });
    if (!decision.ok) {
      throw new AppError(409, 'You have no remaining attempts for this quiz.', undefined, 'ATTEMPT_LIMIT');
    }

    const snapshot = buildAttemptSnapshot(quiz);
    if (!snapshot.length) throw new AppError(400, 'This quiz has no questions');

    const startedAt = new Date();
    const expiresAt = computeExpiresAt(startedAt, quiz.duration_minutes != null ? Number(quiz.duration_minutes) : null);
    let token = generateAttemptToken();
    while (await trx('quiz_attempts').where({ public_token: token }).first()) token = generateAttemptToken();

    const attemptNumber = Number(submitted?.c ?? 0) + 1;
    let attemptId: number;
    try {
      const inserted = await trx('quiz_attempts').insert({
        quiz_id: quiz.id,
        student_id: studentId,
        college_id: quiz.college_id,
        attempt_number: attemptNumber,
        public_token: token,
        started_at: startedAt,
        expires_at: expiresAt,
        status: 'IN_PROGRESS',
        question_snapshot: JSON.stringify(snapshot),
        ip_address: meta.ip ?? null,
        device_information: meta.userAgent?.slice(0, 512) ?? null,
      });
      attemptId = inserted[0] as number;
    } catch (err) {
      const dbErr = err as { code?: string; errno?: number };
      if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
        const existing = await trx('quiz_attempts')
          .where({ quiz_id: quiz.id, student_id: studentId, status: 'IN_PROGRESS' })
          .first();
        if (!existing) throw err;
        const questions = parseJson<SnapshotQuestion[]>(existing.question_snapshot, []);
        const saved = await loadSavedAnswers(existing.id, trx);
        return {
          resumed: true,
          quiz: publicSummary(quiz, effective),
          ...publicAttemptPayload(existing, questions, saved),
        };
      }
      throw err;
    }

    await lockStructureIfNeeded(quiz.id, trx);

    const attempt = await trx('quiz_attempts').where({ id: attemptId }).first();
    return {
      resumed: false,
      quiz: publicSummary(quiz, effective),
      ...publicAttemptPayload(attempt, snapshot, []),
    };
  });
}

export async function saveAttemptAnswers(code: string, body: z.output<typeof saveAnswersSchema>) {
  const quiz = await getQuizByCode(code);
  return db.transaction(async (trx) => {
    const attempt = await trx('quiz_attempts')
      .where({ public_token: body.attemptToken, quiz_id: quiz.id })
      .forUpdate()
      .first();
    if (!attempt) throw new AppError(404, 'Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') {
      return { saved: false, status: attempt.status };
    }
    if (isAttemptExpired(attempt.expires_at)) {
      const saved = await loadSavedAnswers(attempt.id, trx);
      const merged = mergeAnswers(saved, body.answers);
      return finalizeAttempt(trx, quiz, attempt, merged, true);
    }
    await persistAnswers(trx, attempt.id, body.answers);
    return {
      saved: true,
      remainingSeconds: remainingSeconds(attempt.expires_at),
      status: 'IN_PROGRESS',
    };
  });
}

function mergeAnswers(saved: AttemptAnswerInput[], incoming: AttemptAnswerInput[]) {
  const map = new Map(saved.map((a) => [a.questionId, a]));
  for (const a of incoming) map.set(a.questionId, a);
  return [...map.values()];
}

async function finalizeAttempt(
  trx: Knex | Knex.Transaction,
  quiz: Record<string, unknown>,
  attempt: Record<string, unknown>,
  answers: AttemptAnswerInput[],
  expired: boolean,
) {
    if (attempt.status !== 'IN_PROGRESS') {
      return resultPayload(
        quiz,
        attempt,
        parseJson<SnapshotQuestion[]>(attempt.question_snapshot, []),
        trx,
      );
    }

  const questions = parseJson<SnapshotQuestion[]>(attempt.question_snapshot, []);
  const graded = gradeAttempt(questions, answers, Number(quiz.pass_percentage ?? 40));
  const submittedAt = new Date();
  const startedAt = new Date(attempt.started_at as string);
  const timeTaken = Math.max(0, Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000));

  await trx('quiz_attempts')
    .where({ id: attempt.id })
    .update({
      status: expired ? 'EXPIRED_SUBMITTED' : 'SUBMITTED',
      submitted_at: submittedAt,
      obtained_marks: graded.obtainedMarks,
      total_marks: graded.totalMarks,
      percentage: graded.percentage,
      passed: graded.passed,
      time_taken_seconds: timeTaken,
      needs_manual_grading: graded.needsManualGrading,
    });

  for (const a of graded.answers) {
    const payload = {
      selected_option_ids: JSON.stringify(a.selectedOptionIds),
      numeric_answer: a.numericAnswer,
      text_answer: a.textAnswer,
      awarded_marks: a.awardedMarks,
      max_marks: a.maxMarks,
      primary_co_code: a.primaryCoCode,
      primary_co_id: a.primaryCoId,
      is_correct: a.isCorrect,
      needs_manual_grading: a.needsManualGrading,
    };
    const existing = await trx('quiz_attempt_answers')
      .where({ attempt_id: attempt.id, snapshot_question_id: String(a.questionId) })
      .first();
    if (existing) {
      await trx('quiz_attempt_answers').where({ id: existing.id }).update(payload);
    } else {
      await trx('quiz_attempt_answers').insert({
        attempt_id: attempt.id,
        snapshot_question_id: String(a.questionId),
        ...payload,
      });
    }
  }

  const updated = await trx('quiz_attempts').where({ id: attempt.id }).first();
  return resultPayload(quiz, updated, questions, trx);
}

export async function submitAttempt(code: string, body: z.output<typeof submitSchema>) {
  const quiz = await getQuizByCode(code);
  return db.transaction(async (trx) => {
    const attempt = await trx('quiz_attempts')
      .where({ public_token: body.attemptToken, quiz_id: quiz.id })
      .forUpdate()
      .first();
    if (!attempt) throw new AppError(404, 'Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') {
      return resultPayload(
        quiz,
        attempt,
        parseJson<SnapshotQuestion[]>(attempt.question_snapshot, []),
        trx,
      );
    }
    const saved = await loadSavedAnswers(attempt.id, trx);
    const merged = mergeAnswers(saved, body.answers ?? []);
    const expired = isAttemptExpired(attempt.expires_at);
    return finalizeAttempt(trx, quiz, attempt, merged, expired);
  });
}

export async function getAttempt(code: string, token: string) {
  const quiz = await getQuizByCode(code);
  const attempt = await db('quiz_attempts').where({ public_token: token, quiz_id: quiz.id }).first();
  if (!attempt) throw new AppError(404, 'Attempt not found');
  const questions = parseJson<SnapshotQuestion[]>(attempt.question_snapshot, []);
  if (attempt.status === 'IN_PROGRESS') {
    if (isAttemptExpired(attempt.expires_at)) {
      return db.transaction(async (trx) => {
        const locked = await trx('quiz_attempts').where({ id: attempt.id }).forUpdate().first();
        const saved = await loadSavedAnswers(locked.id, trx);
        return finalizeAttempt(trx, quiz, locked, saved, true);
      });
    }
    const saved = await loadSavedAnswers(attempt.id);
    return {
      resumed: true,
      quiz: publicSummary(quiz, quizAvailability(quiz)),
      ...publicAttemptPayload(attempt, questions, saved),
    };
  }
  return resultPayload(quiz, attempt, questions);
}

function quizHasEnded(quiz: Record<string, unknown>, now = new Date()) {
  const effective = quizAvailability(quiz, now);
  return effective === 'ENDED' || effective === 'CLOSED' || effective === 'ARCHIVED';
}

async function resultPayload(
  quiz: Record<string, unknown>,
  attempt: Record<string, unknown>,
  questions: SnapshotQuestion[],
  trx: Knex | Knex.Transaction = db,
) {
  const ended = quizHasEnded(quiz);
  const showScore = canShowScore({
    showScoreImmediately: quiz.show_score_immediately == null ? true : !!quiz.show_score_immediately,
    quizEnded: ended,
  });
  const showKey = canShowCorrectAnswers({
    visibility: String(quiz.show_correct_answers ?? 'AFTER_END'),
    quizEnded: ended,
  });
  const showExplanation = showKey && (quiz.show_explanation == null ? true : !!quiz.show_explanation);

  const answerRows = await trx('quiz_attempt_answers').where({ attempt_id: attempt.id });
  const byQ = new Map(answerRows.map((r) => [Number(r.snapshot_question_id), r]));

  const result = showScore
    ? {
        obtainedMarks: Number(attempt.obtained_marks ?? 0),
        totalMarks: Number(attempt.total_marks ?? 0),
        percentage: Number(attempt.percentage ?? 0),
        passed: !!attempt.passed,
        timeTakenSeconds: Number(attempt.time_taken_seconds ?? 0),
        needsManualGrading: !!attempt.needs_manual_grading,
      }
    : null;

  const review = showKey
    ? questions.map((q) => {
        const row = byQ.get(q.id);
        const item = toReviewQuestion(
          q,
          {
            selectedOptionIds: parseJson<number[]>(row?.selected_option_ids, []),
            numericAnswer: row?.numeric_answer != null ? Number(row.numeric_answer) : null,
            textAnswer: row?.text_answer ?? null,
            awardedMarks: row?.awarded_marks != null ? Number(row.awarded_marks) : 0,
            isCorrect: row?.is_correct == null ? null : !!row.is_correct,
            unanswered: !row || (!parseJson<number[]>(row.selected_option_ids, []).length && row.numeric_answer == null && !row.text_answer),
          },
          true,
        );
        if (!showExplanation) delete item.explanation;
        return item;
      })
    : undefined;

  return {
    submitted: true,
    attemptToken: attempt.public_token,
    attemptNumber: Number(attempt.attempt_number),
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,
    status: attempt.status,
    quiz: {
      title: quiz.title,
      courseName: quiz.course_name,
      moduleName: quiz.module_name,
    },
    result,
    review: review ?? null,
    scoreReleased: showScore,
    answersReleased: showKey,
    message: showScore
      ? undefined
      : 'Your quiz was submitted. Marks will be available after the quiz ends.',
  };
}
