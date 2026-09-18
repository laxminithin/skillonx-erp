export const EVALUATION_STATUSES = ['DRAFT', 'FINALIZED', 'ARCHIVED'] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const REVIEW_MARKED_STATUSES = new Set([
  'NEEDS_REVIEW',
  'ACADEMIC_ANALYSIS',
  'SOURCE_MISSING',
  'REVIEW_REQUIRED',
  'OFFICIAL_DATA_PENDING',
  'BLOCKED_SOURCE',
  'CO_SOURCE_UNVERIFIED',
  'COURSE_TYPE_UNCERTAIN',
  'CO_COUNT_MISMATCH',
]);

export function isReviewMarked(status: string | null | undefined) {
  if (!status) return false;
  return REVIEW_MARKED_STATUSES.has(String(status).toUpperCase());
}

export function isYes(value: unknown) {
  const s = String(value ?? '')
    .trim()
    .toUpperCase();
  return s === 'YES' || s === 'Y' || s === 'TRUE' || s === '1';
}

export function parseCoOrder(coCode: string) {
  const m = String(coCode || '')
    .toUpperCase()
    .match(/CO\s*(\d+)/);
  return m ? Number(m[1]) : 999;
}

export function numOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function nearlyEqual(a: number, b: number, tol = 0.05) {
  return Math.abs(a - b) <= tol;
}

export function normalizeCode(code: string) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export function schemeKey(scheme: string | null | undefined) {
  return String(scheme ?? '').trim() || '';
}
