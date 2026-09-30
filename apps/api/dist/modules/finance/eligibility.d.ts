/**
 * Structured, deterministic eligibility criteria only — no executable code
 * or eval (directive §18). Every field is optional; an absent field is not
 * evaluated at all (it neither passes nor fails anything).
 */
export type EligibilityCriteria = {
    programIds?: number[];
    minSemester?: number;
    minCgpa?: number;
    maxIncome?: number;
    categories?: string[];
    minAttendancePercent?: number;
    requiredDocumentCategories?: string[];
};
export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_DATA' | 'SOURCE_ERROR';
export type EligibilityCheck = {
    criterion: string;
    status: EligibilityStatus;
    detail: string;
};
export type EligibilityResult = {
    status: EligibilityStatus;
    checks: EligibilityCheck[];
    snapshot: Record<string, unknown>;
};
/**
 * Evaluate one student against one frozen criteria set. Missing source data
 * is reported as PENDING_DATA/SOURCE_ERROR, never silently treated as
 * INELIGIBLE, ELIGIBLE, or zero (directive §21). The overall status is the
 * worst of: any INELIGIBLE -> INELIGIBLE; else any SOURCE_ERROR ->
 * SOURCE_ERROR; else any PENDING_DATA -> PENDING_DATA; else ELIGIBLE.
 */
export declare function evaluateEligibility(studentId: number, collegeId: number, criteria: EligibilityCriteria, selfDeclared: {
    income?: number | null;
    category?: string | null;
}): Promise<EligibilityResult>;
export declare function parseCriteria(raw: unknown): EligibilityCriteria;
