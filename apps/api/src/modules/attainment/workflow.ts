import { AppError } from '../../utils/errors.js';
import type { CiState } from './types.js';
import { CI_STATES } from './types.js';

const TRANSITIONS: Record<CiState, CiState[]> = {
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

export const INDEPENDENT_REVIEW_STATES = new Set<CiState>([
  'APPROVED_FOR_IMPLEMENTATION',
  'APPROVED',
  'CLOSED',
]);

export function canTransition(from: CiState, to: CiState) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function assertTransition(from: CiState, to: CiState) {
  if (!canTransition(from, to)) {
    throw new AppError(409, `Invalid continuous-improvement transition: ${from} → ${to}`);
  }
}

export function isCiState(value: string): value is CiState {
  return (CI_STATES as readonly string[]).includes(value);
}

export function reviewerRoles(role: string) {
  return (
    role === 'HOD' ||
    role === 'PRINCIPAL' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'NBA_COORDINATOR' ||
    role === 'COLLEGE_ADMIN' ||
    role === 'SUPER_ADMIN'
  );
}

export function canApproveClosure(actor: { facultyUserId: number; role: string }, cycle: { createdBy: number }) {
  if (!reviewerRoles(actor.role)) return false;
  if (actor.facultyUserId === cycle.createdBy && actor.role !== 'SUPER_ADMIN' && actor.role !== 'COLLEGE_ADMIN') {
    return false;
  }
  return true;
}

export function requiresIndependentReview(to: CiState) {
  return INDEPENDENT_REVIEW_STATES.has(to);
}

export function nextAfterImplemented(evidenceComplete: boolean): CiState {
  return evidenceComplete ? 'READY_FOR_REASSESSMENT' : 'EVIDENCE_INCOMPLETE';
}

export function nextAfterReassessed(targetAchieved: boolean): CiState {
  return targetAchieved ? 'TARGET_ACHIEVED' : 'TARGET_NOT_ACHIEVED';
}
