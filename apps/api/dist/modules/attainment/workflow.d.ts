import type { CiState } from './types.js';
export declare const INDEPENDENT_REVIEW_STATES: Set<"CLOSED" | "APPROVED" | "REOPENED" | "IN_PROGRESS" | "ACTION_PLANNED" | "DETECTED" | "FACULTY_REVIEW_REQUIRED" | "APPROVED_FOR_IMPLEMENTATION" | "IMPLEMENTED" | "EVIDENCE_INCOMPLETE" | "READY_FOR_REASSESSMENT" | "REASSESSED" | "TARGET_ACHIEVED" | "TARGET_NOT_ACHIEVED" | "SUBMITTED_FOR_REVIEW">;
export declare function canTransition(from: CiState, to: CiState): boolean;
export declare function assertTransition(from: CiState, to: CiState): void;
export declare function isCiState(value: string): value is CiState;
export declare function reviewerRoles(role: string): role is "HOD" | "PRINCIPAL" | "IQAC_COORDINATOR" | "NBA_COORDINATOR" | "COLLEGE_ADMIN" | "SUPER_ADMIN";
export declare function canApproveClosure(actor: {
    facultyUserId: number;
    role: string;
}, cycle: {
    createdBy: number;
}): boolean;
export declare function requiresIndependentReview(to: CiState): boolean;
export declare function nextAfterImplemented(evidenceComplete: boolean): CiState;
export declare function nextAfterReassessed(targetAchieved: boolean): CiState;
