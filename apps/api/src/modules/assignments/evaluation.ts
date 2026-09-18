import { z } from 'zod';
import { AppError } from '../../utils/errors.js';
import {
  parseEvaluationScheme,
  schemeTotalMarks,
  type EvaluationScheme,
} from './scheme.js';

/** Coerce HTML/number-input strings safely; treat blank as missing (not 0) at the schema layer. */
const awardedMarksSchema = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
}, z.coerce.number({ invalid_type_error: 'Awarded marks must be a number' }).min(0));

export const criterionAwardSchema = z.object({
  id: z.string().min(1),
  awarded: awardedMarksSchema,
  feedback: z.string().max(2000).optional().nullable(),
});

export const questionEvaluationSchema = z.object({
  snapshotQuestionId: z.union([z.string(), z.number()]),
  criteria: z.array(criterionAwardSchema).min(1),
  feedback: z.string().max(4000).optional().nullable(),
  /** Optional simple-mode total; ignored when criteria are present (scheme mode). */
  awardedMarks: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
  }, z.coerce.number().min(0).optional()),
});

export const evaluateSubmissionSchema = z
  .object({
    mode: z.enum(['DRAFT', 'FINALIZE', 'RELEASE']).default('DRAFT'),
    overallFeedback: z.string().max(8000).optional().nullable(),
    /** @deprecated Prefer mode: 'RELEASE'. Kept for older clients that finalize+release together. */
    releaseResults: z.boolean().optional().default(false),
    questions: z.array(questionEvaluationSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'RELEASE') return;
    if (!data.questions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions'],
        message: 'At least one question evaluation is required.',
        params: { code: 'ASSIGNMENT_EVALUATION_EMPTY' },
      });
    }
  });

export type CriterionAwardInput = z.output<typeof criterionAwardSchema>;
export type QuestionEvaluationInput = z.output<typeof questionEvaluationSchema>;
export type EvaluateSubmissionInput = z.output<typeof evaluateSubmissionSchema>;

export type SchemeMarkCriterion = {
  id: string;
  label: string;
  maxMarks: number;
  awarded: number;
  feedback: string | null;
};

export type SchemeMarks = {
  criteria: SchemeMarkCriterion[];
  awardedTotal: number;
  maxTotal: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function applyCriterionMarks(
  scheme: EvaluationScheme,
  awards: CriterionAwardInput[],
): SchemeMarks {
  const byId = new Map(awards.map((a) => [a.id, a]));
  const criteria: SchemeMarkCriterion[] = [];
  let awardedTotal = 0;

  for (const criterion of scheme.criteria) {
    const award = byId.get(criterion.id);
    if (!award || award.awarded === undefined || award.awarded === null) {
      throw new AppError(
        400,
        `Missing marks for criterion "${criterion.label}" (${criterion.id})`,
        { criterionId: criterion.id },
        'ASSIGNMENT_CRITERION_MARKS_INVALID',
      );
    }
    const awarded = Number(award.awarded);
    if (!Number.isFinite(awarded)) {
      throw new AppError(
        400,
        `Invalid awarded marks for criterion ${criterion.id}`,
        { criterionId: criterion.id },
        'ASSIGNMENT_CRITERION_MARKS_INVALID',
      );
    }
    // Explicit numeric compare — 0 is valid.
    if (awarded < 0 || awarded > Number(criterion.maxMarks) + 1e-9) {
      throw new AppError(
        400,
        `Criterion "${criterion.label}" awarded (${awarded}) must be between 0 and ${criterion.maxMarks}`,
        {
          criterionId: criterion.id,
          awarded,
          maxMarks: Number(criterion.maxMarks),
        },
        'ASSIGNMENT_CRITERION_MARKS_INVALID',
      );
    }
    const capped = round2(Math.min(awarded, Number(criterion.maxMarks)));
    criteria.push({
      id: criterion.id,
      label: criterion.label,
      maxMarks: Number(criterion.maxMarks),
      awarded: capped,
      feedback: award.feedback ?? null,
    });
    awardedTotal += capped;
  }

  const unknown = awards.filter((a) => !scheme.criteria.some((c) => c.id === a.id));
  if (unknown.length) {
    throw new AppError(
      400,
      `Unknown criteria: ${unknown.map((u) => u.id).join(', ')}`,
      { criterionIds: unknown.map((u) => u.id) },
      'ASSIGNMENT_CRITERION_MARKS_INVALID',
    );
  }

  const maxTotal = schemeTotalMarks(scheme);
  awardedTotal = round2(awardedTotal);
  if (awardedTotal > maxTotal + 1e-9) {
    throw new AppError(
      400,
      `Question awarded marks (${awardedTotal}) exceed question max (${maxTotal})`,
      { awarded: awardedTotal, max: maxTotal },
      'ASSIGNMENT_MARKS_OUT_OF_RANGE',
    );
  }

  return { criteria, awardedTotal, maxTotal };
}

/** Resolve scheme from published snapshot; fall back to type default for legacy rows. */
export function resolveSchemeFromSnapshotQuestion(question: {
  evaluationRubric?: unknown;
  evaluationScheme?: unknown;
  marks: number;
  questionType?: string;
}): EvaluationScheme {
  const scheme =
    parseEvaluationScheme(question.evaluationScheme) ??
    parseEvaluationScheme(question.evaluationRubric);
  if (scheme) {
    const total = schemeTotalMarks(scheme);
    const marks = Number(question.marks);
    if (Math.abs(total - marks) > 0.01) {
      throw new AppError(
        400,
        `Evaluation scheme total (${total}) does not match question marks (${marks}). Re-publish or repair this assignment question.`,
        { schemeTotal: total, marks },
        'ASSIGNMENT_SCHEME_TOTAL_MISMATCH',
      );
    }
    return scheme;
  }

  // Legacy / missing scheme: single overall criterion (matches faculty UI fallback).
  const marks = Math.max(0, Number(question.marks) || 0);
  if (marks <= 0) {
    throw new AppError(
      400,
      'Question is missing an evaluation scheme and has no marks',
      undefined,
      'ASSIGNMENT_SCHEME_TOTAL_MISMATCH',
    );
  }
  return {
    criteria: [{ id: 'overall', label: 'Overall', maxMarks: marks, guidance: null }],
    expectedKeyPoints: [],
    facultyNotes: null,
  };
}

export function summarizeEvaluation(
  questionMarks: Array<{ awarded: number; max: number }>,
  passPercentage: number,
) {
  const obtained = round2(questionMarks.reduce((s, q) => s + q.awarded, 0));
  const total = round2(questionMarks.reduce((s, q) => s + q.max, 0));
  const percentage = total > 0 ? round2((obtained / total) * 100) : 0;
  return {
    obtainedMarks: obtained,
    totalMarks: total,
    percentage,
    passed: percentage >= Number(passPercentage ?? 40),
  };
}

/** Map Zod flatten to a faculty-readable evaluation validation error. */
export function evaluationZodToAppError(err: z.ZodError): AppError {
  const flat = err.flatten();
  const custom = err.issues.find((i) => i.code === 'custom');
  const fieldMessages = Object.entries(flat.fieldErrors).flatMap(([field, msgs]) =>
    (msgs || []).map((m) => (field === 'questions' ? m : `${field}: ${m}`)),
  );
  const formMessages = flat.formErrors || [];
  const message =
    custom?.message ||
    formMessages[0] ||
    fieldMessages[0] ||
    'Evaluation payload is invalid.';
  const code =
    (custom?.params as { code?: string } | undefined)?.code || 'ASSIGNMENT_EVALUATION_INVALID';
  return new AppError(400, message, flat, code);
}
