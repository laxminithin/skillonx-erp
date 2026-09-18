import type { EligibilityResult } from './types.js';
export declare function evaluatePlacementEligibility(studentId: number, opportunityId: number, collegeId: number): Promise<EligibilityResult>;
export declare function bulkEvaluateEligibility(opportunityId: number, collegeId: number, studentIds: number[]): Promise<{
    eligible: number[];
    notEligible: number[];
    eligibleCount: number;
    notEligibleCount: number;
}>;
