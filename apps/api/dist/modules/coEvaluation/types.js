export const EVALUATION_STATUSES = ['DRAFT', 'FINALIZED', 'ARCHIVED'];
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
export function isReviewMarked(status) {
    if (!status)
        return false;
    return REVIEW_MARKED_STATUSES.has(String(status).toUpperCase());
}
export function isYes(value) {
    const s = String(value ?? '')
        .trim()
        .toUpperCase();
    return s === 'YES' || s === 'Y' || s === 'TRUE' || s === '1';
}
export function parseCoOrder(coCode) {
    const m = String(coCode || '')
        .toUpperCase()
        .match(/CO\s*(\d+)/);
    return m ? Number(m[1]) : 999;
}
export function numOrNull(value) {
    if (value == null || value === '')
        return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}
export function nearlyEqual(a, b, tol = 0.05) {
    return Math.abs(a - b) <= tol;
}
export function normalizeCode(code) {
    return String(code || '')
        .replace(/\s+/g, '')
        .toUpperCase();
}
export function schemeKey(scheme) {
    return String(scheme ?? '').trim() || '';
}
