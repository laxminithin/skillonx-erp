import { snapshotDerivedOutcomes, type DerivedOutcomes } from './coMapping.js';
/** Prefer VERIFIED_SOURCE (product term); VERIFIED kept as legacy alias. */
export declare const CO_VERIFICATION_STATUSES: readonly ["VERIFIED_SOURCE", "VERIFIED", "ACADEMIC_ANALYSIS", "NEEDS_REVIEW", "CO_MAPPING_BLOCKED"];
export type CoVerificationStatus = (typeof CO_VERIFICATION_STATUSES)[number];
export type ResolvedPrimaryCo = {
    primaryCoCode: string | null;
    primaryCoId: number | null;
    coStatement: string | null;
    derived: ReturnType<typeof snapshotDerivedOutcomes> | null;
    derivedFull: DerivedOutcomes | null;
    blocked: boolean;
    blockReason: string | null;
    subjectHasCos: boolean;
};
/**
 * Resolve a Primary CO against the shared course_outcomes master for a subject.
 * Rejects unknown codes and COs belonging to a different subject.
 */
export declare function resolvePrimaryCoForSubject(opts: {
    collegeId: number;
    courseId: number | null | undefined;
    primaryCoCode: string | null | undefined;
    primaryCoId?: number | null;
    require?: boolean;
    /** When true (custom/manual questions), invalid/missing CO throws. */
    strict?: boolean;
}): Promise<ResolvedPrimaryCo>;
export declare function coRowPatch(resolved: ResolvedPrimaryCo, extras?: {
    secondaryCoCodes?: string[] | null;
    mappingBasis?: string | null;
    mappingSource?: string | null;
    verificationStatus?: string | null;
}): {
    primary_co_code: string | null;
    primary_co_id: number | null;
    secondary_co_codes: string | undefined;
    mapping_basis: string | null | undefined;
    mapping_source: string | null | undefined;
    verification_status: string | null;
    co_mapping_blocked: boolean;
    co_mapping_block_reason: string | null;
    derived_outcomes_snapshot: string | null;
};
export declare function syncQuizQuestionCoLinks(bankQuestionId: number, primaryCoId: number | null, primaryCoCode: string | null, secondaryCodes?: string[]): Promise<void>;
export declare function computeAcademicCoverage(questions: Array<{
    primaryCoCode?: string | null;
}>): {
    byCo: Record<string, number>;
    total: number;
    unmapped: number;
};
