import type { AcademicPolicy, SeeMethod, SeePaperQuestion, StudentRow } from './types.js';
import { SEE_CONFIDENCE, SEE_METHOD_LABELS } from './types.js';
import { average, percentToLevel, round2, round4 } from './formula.js';

export type SeeCoWeight = {
  coCode: string;
  marks: number;
  weight: number;
};

export type SeeModeDecision = {
  method: SeeMethod;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  label: string;
  reason: string;
  estimated: boolean;
};

export function paperCoWeights(questions: SeePaperQuestion[]): SeeCoWeight[] {
  const byCo = new Map<string, number>();
  let total = 0;
  for (const q of questions) {
    const co = (q.coCode || '').toUpperCase();
    if (!co) continue;
    const marks = Number(q.maxMarks) || 0;
    byCo.set(co, (byCo.get(co) || 0) + marks);
    total += marks;
  }
  if (total <= 0) return [];
  return [...byCo.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([coCode, marks]) => ({
      coCode,
      marks: round2(marks),
      weight: round4(marks / total),
    }));
}

export function equalWeights(coCodes: string[]): SeeCoWeight[] {
  const unique = [...new Set(coCodes.map((c) => c.toUpperCase()).filter(Boolean))].sort();
  if (!unique.length) return [];
  const weight = round4(1 / unique.length);
  return unique.map((coCode) => ({ coCode, marks: 0, weight }));
}

export function decideSeeMethod(input: {
  hasQuestionWiseSeeMarks: boolean;
  hasSeePaperWithCoMapping: boolean;
  preferred?: SeeMethod | null;
}): SeeModeDecision {
  const order: SeeMethod[] = ['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT'];
  const preferred = input.preferred && order.includes(input.preferred) ? input.preferred : null;
  let method: SeeMethod = 'EQUAL_WEIGHT';
  let reason = 'Only final SEE marks are available and the question paper CO exposure cannot be established.';
  if (input.hasQuestionWiseSeeMarks) {
    method = 'ACTUAL';
    reason = 'Question-wise SEE marks are available.';
  } else if (input.hasSeePaperWithCoMapping) {
    method = 'PAPER_WEIGHTED';
    reason = 'SEE question paper is CO-mapped but only total student SEE marks are available.';
  }
  if (preferred) {
    const prefRank = order.indexOf(preferred);
    const autoRank = order.indexOf(method);
    if (prefRank > autoRank) {
      method = preferred;
      reason = `Authorized override to ${SEE_METHOD_LABELS[preferred]} (lower quality than automatically available data).`;
    } else {
      method = preferred;
      reason = `Using ${SEE_METHOD_LABELS[preferred]} as requested; higher-quality data is not required.`;
    }
  }
  return {
    method,
    confidence: SEE_CONFIDENCE[method],
    label: SEE_METHOD_LABELS[method],
    reason,
    estimated: method !== 'ACTUAL',
  };
}

export type EstimatedSeeStudent = {
  studentKey: string;
  seePercent: number;
  coLevels: Record<string, number>;
};

/**
 * Paper-weighted / equal-weight estimate:
 * student overall SEE percent is applied uniformly to every CO that has exposure.
 * Paper weights are stored for audit (CO exposure of the paper) and do not
 * invent different per-CO scores from a single total mark.
 */
export function estimateSeeFromTotals(
  students: Array<StudentRow & { seePercent: number | null }>,
  weights: SeeCoWeight[],
  policy: AcademicPolicy,
): { classAttainment: Array<{ coCode: string; attainment: number | null; studentCount: number }>; students: EstimatedSeeStudent[] } {
  const evaluated = students.filter(
    (s) => s.status === 'PRESENT' && s.seePercent != null && Number.isFinite(s.seePercent),
  );
  const studentRows: EstimatedSeeStudent[] = evaluated.map((s) => {
    const coLevels: Record<string, number> = {};
    const level = percentToLevel(s.seePercent as number, policy);
    for (const w of weights) coLevels[w.coCode] = level;
    return { studentKey: s.studentKey, seePercent: s.seePercent as number, coLevels };
  });
  const classAttainment = weights.map((w) => {
    const levels = studentRows.map((s) => s.coLevels[w.coCode]).filter((n) => n != null);
    return {
      coCode: w.coCode,
      attainment: average(levels),
      studentCount: levels.length,
    };
  });
  return { classAttainment, students: studentRows };
}

export function seePercentFromTotals(awarded: number | null, max: number | null): number | null {
  if (awarded == null || max == null || max <= 0) return null;
  return round2((awarded / max) * 100);
}
