import { z } from 'zod';
import { AppError } from '../../utils/errors.js';
import {
  type AssignmentQuestionType,
  normalizeQuestionText,
} from '../../types/assignment.js';

export const evaluationCriterionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(255),
  maxMarks: z.number().positive().max(100),
  guidance: z.string().max(2000).optional().nullable(),
});

export const evaluationSchemeSchema = z.object({
  criteria: z.array(evaluationCriterionSchema).min(1),
  expectedKeyPoints: z.array(z.string().min(1).max(500)).optional().default([]),
  facultyNotes: z.string().max(4000).optional().nullable(),
});

export type EvaluationCriterion = z.output<typeof evaluationCriterionSchema>;
export type EvaluationScheme = z.output<typeof evaluationSchemeSchema>;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function schemeTotalMarks(scheme: EvaluationScheme | null | undefined): number {
  if (!scheme?.criteria?.length) return 0;
  return round2(scheme.criteria.reduce((sum, c) => sum + Number(c.maxMarks || 0), 0));
}

export function parseEvaluationScheme(raw: unknown): EvaluationScheme | null {
  if (raw == null) return null;
  const value =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;
  if (!value || typeof value !== 'object') return null;
  const parsed = evaluationSchemeSchema.safeParse(value);
  if (parsed.success) return parsed.data;

  // Compat with synthesizeEvaluationRubric shape: { criterion, marks }
  const alt = value as {
    criteria?: Array<{ id?: string; label?: string; criterion?: string; maxMarks?: number; marks?: number; guidance?: string }>;
  };
  if (!Array.isArray(alt.criteria) || !alt.criteria.length) return null;
  const criteria = alt.criteria.map((c, i) => ({
    id: c.id || `c${i + 1}`,
    label: c.label || c.criterion || `Criterion ${i + 1}`,
    maxMarks: Number(c.maxMarks ?? c.marks ?? 0),
    guidance: c.guidance ?? null,
  }));
  if (criteria.some((c) => !(c.maxMarks > 0))) return null;
  const normalized = evaluationSchemeSchema.safeParse({ criteria, expectedKeyPoints: [] });
  return normalized.success ? normalized.data : null;
}

/** Build a sensible default rubric for a question type / marks total. */
export function buildDefaultScheme(
  questionType: AssignmentQuestionType,
  marks: number,
): EvaluationScheme {
  const total = Math.max(1, Number(marks) || 10);
  const mk = (id: string, label: string, weight: number, guidance?: string): EvaluationCriterion => ({
    id,
    label,
    maxMarks: round2(total * weight),
    guidance: guidance ?? null,
  });

  const templates: Record<AssignmentQuestionType, EvaluationCriterion[]> = {
    DESCRIPTIVE: [
      mk('clarity', 'Clarity & completeness', 0.5, 'Covers the asked concept with correct terminology'),
      mk('depth', 'Depth of explanation', 0.3),
      mk('examples', 'Relevant examples', 0.2),
    ],
    SHORT_ANALYSIS: [
      mk('analysis', 'Quality of analysis', 0.6),
      mk('evidence', 'Supporting points', 0.4),
    ],
    USE_CASE: [
      mk('context', 'Problem context', 0.25),
      mk('approach', 'Proposed approach', 0.45),
      mk('feasibility', 'Feasibility / impact', 0.3),
    ],
    CASE_STUDY: [
      mk('understanding', 'Case understanding', 0.25),
      mk('analysis', 'Critical analysis', 0.4),
      mk('recommendation', 'Recommendations', 0.35),
    ],
    PROBLEM_SOLVING: [
      mk('method', 'Method / steps', 0.4),
      mk('working', 'Working / calculations', 0.4),
      mk('result', 'Final result', 0.2),
    ],
    DESIGN: [
      mk('requirements', 'Requirements capture', 0.25),
      mk('design', 'Design quality', 0.5),
      mk('tradeoffs', 'Trade-offs discussed', 0.25),
    ],
    COMPARE_JUSTIFY: [
      mk('comparison', 'Comparison dimensions', 0.4),
      mk('justification', 'Justification', 0.4),
      mk('conclusion', 'Conclusion', 0.2),
    ],
    APPLICATION: [
      mk('mapping', 'Concept → application mapping', 0.5),
      mk('realism', 'Real-world realism', 0.5),
    ],
    RESEARCH_TASK: [
      mk('sources', 'Sources & credibility', 0.3),
      mk('synthesis', 'Synthesis', 0.4),
      mk('insight', 'Insight / conclusion', 0.3),
    ],
    CODE_EXPLANATION: [
      mk('correctness', 'Correctness of explanation', 0.5),
      mk('complexity', 'Complexity / edge cases', 0.3),
      mk('clarity', 'Clarity', 0.2),
    ],
    SCENARIO: [
      mk('understanding', 'Scenario understanding', 0.3),
      mk('response', 'Appropriate response', 0.5),
      mk('risks', 'Risks / alternatives', 0.2),
    ],
    ALGORITHM: [
      mk('correctness', 'Algorithm correctness', 0.45),
      mk('complexity', 'Time/space reasoning', 0.3),
      mk('clarity', 'Steps clarity', 0.25),
    ],
    INTERPRETATION: [
      mk('reading', 'Correct reading of data/artifact', 0.4),
      mk('inference', 'Inference quality', 0.4),
      mk('limits', 'Limitations noted', 0.2),
    ],
  };

  let criteria = templates[questionType] ?? templates.DESCRIPTIVE;
  // Fix floating remainder so sum === marks
  const sum = schemeTotalMarks({ criteria, expectedKeyPoints: [] });
  if (criteria.length && Math.abs(sum - total) > 0.001) {
    const last = criteria[criteria.length - 1];
    const adjusted = [...criteria];
    adjusted[adjusted.length - 1] = {
      ...last,
      maxMarks: round2(last.maxMarks + (total - sum)),
    };
    criteria = adjusted;
  }
  return { criteria, expectedKeyPoints: [], facultyNotes: null };
}

export function validateSchemeMatchesMarks(
  scheme: unknown,
  marks: number,
  opts: { required?: boolean } = {},
): EvaluationScheme {
  const parsed = parseEvaluationScheme(scheme);
  if (!parsed) {
    if (opts.required) throw new AppError(400, 'Evaluation scheme is required');
    throw new AppError(400, 'Invalid evaluation scheme');
  }
  const total = schemeTotalMarks(parsed);
  if (Math.abs(total - Number(marks)) > 0.01) {
    throw new AppError(
      400,
      `Evaluation scheme total (${total}) must equal question marks (${marks})`,
      { schemeTotal: total, marks },
      'SCHEME_MARKS_MISMATCH',
    );
  }
  const ids = parsed.criteria.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, 'Evaluation scheme criteria must have unique ids');
  }
  return parsed;
}

export function hasModelSolution(guidance: string | null | undefined) {
  return Boolean(guidance && guidance.trim().length >= 8);
}

export function findDuplicateNormalizedTexts(texts: string[]): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];
  for (const text of texts) {
    const key = normalizeQuestionText(text);
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) dupes.push(key);
  }
  return dupes;
}
