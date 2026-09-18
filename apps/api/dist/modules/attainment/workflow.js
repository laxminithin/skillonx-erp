import { AppError } from '../../utils/errors.js';
import { CI_STATES } from './types.js';
const TRANSITIONS = {
    DETECTED: ['FACULTY_REVIEW_REQUIRED'],
    FACULTY_REVIEW_REQUIRED: ['ACTION_PLANNED'],
    ACTION_PLANNED: ['APPROVED_FOR_IMPLEMENTATION'],
    APPROVED_FOR_IMPLEMENTATION: ['IN_PROGRESS'],
    IN_PROGRESS: ['IMPLEMENTED', 'EVIDENCE_INCOMPLETE', 'READY_FOR_REASSESSMENT'],
    IMPLEMENTED: ['EVIDENCE_INCOMPLETE', 'READY_FOR_REASSESSMENT'],
    EVIDENCE_INCOMPLETE: ['READY_FOR_REASSESSMENT', 'IMPLEMENTED'],
    READY_FOR_REASSESSMENT: ['REASSESSED', 'TARGET_ACHIEVED', 'TARGET_NOT_ACHIEVED'],
    REASSESSED: ['TARGET_ACHIEVED', 'TARGET_NOT_ACHIEVED'],
    TARGET_ACHIEVED: ['SUBMITTED_FOR_REVIEW'],
    TARGET_NOT_ACHIEVED: ['ACTION_PLANNED', 'SUBMITTED_FOR_REVIEW'],
    SUBMITTED_FOR_REVIEW: ['APPROVED', 'FACULTY_REVIEW_REQUIRED'],
    APPROVED: ['CLOSED'],
    CLOSED: ['REOPENED'],
    REOPENED: ['FACULTY_REVIEW_REQUIRED'],
};
export const INDEPENDENT_REVIEW_STATES = new Set([
    'APPROVED_FOR_IMPLEMENTATION',
    'APPROVED',
    'CLOSED',
]);
export function canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
}
export function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new AppError(409, `Invalid continuous-improvement transition: ${from} → ${to}`);
    }
}
export function isCiState(value) {
    return CI_STATES.includes(value);
}
export function reviewerRoles(role) {
    return (role === 'HOD' ||
        role === 'PRINCIPAL' ||
        role === 'IQAC_COORDINATOR' ||
        role === 'NBA_COORDINATOR' ||
        role === 'COLLEGE_ADMIN' ||
        role === 'SUPER_ADMIN');
}
export function canApproveClosure(actor, cycle) {
    if (!reviewerRoles(actor.role))
        return false;
    if (actor.facultyUserId === cycle.createdBy && actor.role !== 'SUPER_ADMIN' && actor.role !== 'COLLEGE_ADMIN') {
        return false;
    }
    return true;
}
export function requiresIndependentReview(to) {
    return INDEPENDENT_REVIEW_STATES.has(to);
}
export function nextAfterImplemented(evidenceComplete) {
    return evidenceComplete ? 'READY_FOR_REASSESSMENT' : 'EVIDENCE_INCOMPLETE';
}
export function nextAfterReassessed(targetAchieved) {
    return targetAchieved ? 'TARGET_ACHIEVED' : 'TARGET_NOT_ACHIEVED';
}
