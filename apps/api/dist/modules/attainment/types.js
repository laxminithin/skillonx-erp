export const FORMULA_VERSION = 'skillonx-attainment-formula-v1.0';
export const QUALITY_SCORE_VERSION = 'skillonx-qp-quality-v1.0';
export const STANDARD_CODE = 'SKILLONX_ACADEMIC_STANDARD';
export const STANDARD_VERSION = '1.0';
export const SEE_METHODS = ['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT'];
export const SEE_CONFIDENCE = {
    ACTUAL: 'HIGH',
    PAPER_WEIGHTED: 'MEDIUM',
    EQUAL_WEIGHT: 'LOW',
};
export const SEE_METHOD_LABELS = {
    ACTUAL: 'Actual — High Confidence',
    PAPER_WEIGHTED: 'Paper-Weighted Estimate — Medium Confidence',
    EQUAL_WEIGHT: 'Equal-Weight Estimate — Low Confidence',
};
export const CO_STATUSES = ['GREEN', 'AMBER', 'RED', 'INSUFFICIENT_DATA'];
export const RUN_STATUSES = ['PREVIEW', 'COMMITTED', 'SUPERSEDED'];
export const MARK_SHEET_KINDS = [
    'INTERNAL_PAPER',
    'SEE',
    'LAB',
    'PROJECT',
    'QUIZ',
    'ASSIGNMENT',
    'REASSESSMENT',
];
export const STUDENT_MARK_STATUSES = [
    'PRESENT',
    'ATTEMPTED',
    'NOT_ATTEMPTED_DUE_TO_OR',
    'ABSENT',
    'NOT_EVALUATED',
    'EXEMPT',
];
/** A mark counts toward CO evidence only when the alternative was actually attempted. */
export function isAttemptedMarkStatus(status) {
    const s = String(status || 'PRESENT').toUpperCase();
    return s === 'PRESENT' || s === 'ATTEMPTED';
}
/** Statuses whose marks are excluded from both numerator and denominator of a CO. */
export function isExcludedMarkStatus(status) {
    const s = String(status || '').toUpperCase();
    return s === 'ABSENT' || s === 'EXEMPT' || s === 'NOT_EVALUATED' || s === 'NOT_ATTEMPTED_DUE_TO_OR';
}
export const CYCLE_KINDS = ['CO', 'PO', 'PSO'];
export const CI_STATES = [
    'DETECTED',
    'FACULTY_REVIEW_REQUIRED',
    'ACTION_PLANNED',
    'APPROVED_FOR_IMPLEMENTATION',
    'IN_PROGRESS',
    'IMPLEMENTED',
    'EVIDENCE_INCOMPLETE',
    'READY_FOR_REASSESSMENT',
    'REASSESSED',
    'TARGET_ACHIEVED',
    'TARGET_NOT_ACHIEVED',
    'SUBMITTED_FOR_REVIEW',
    'APPROVED',
    'CLOSED',
    'REOPENED',
];
