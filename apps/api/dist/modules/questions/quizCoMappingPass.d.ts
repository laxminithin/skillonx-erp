export type CoMasterRow = {
    id: number;
    co_code: string;
    statement: string | null;
    co_number: number | null;
};
export type MappingPassReport = {
    total: number;
    mapped: number;
    needsReview: number;
    blocked: number;
    attainmentReady: 'YES' | 'NO';
    skippedAlreadyMapped: number;
    perSubject: Array<{
        courseId: number;
        courseName: string;
        total: number;
        mapped: number;
        needsReview: number;
        blocked: number;
        coDistribution: Record<string, number>;
    }>;
};
/** Test / quality-gate helper: score question cognitive intent vs CO statement. */
export declare function scoreQuestionAgainstCo(questionText: string, coStatement: string, moduleName?: string | null): {
    score: number;
    basis: string;
};
export declare function suggestPrimaryCo(questionText: string, cos: CoMasterRow[], moduleName?: string | null): {
    primaryCoCode: string | null;
    primaryCoId: number | null;
    verificationStatus: 'ACADEMIC_ANALYSIS' | 'NEEDS_REVIEW' | 'CO_MAPPING_BLOCKED' | 'VERIFIED_SOURCE';
    mappingBasis: string | null;
    score: number;
};
/**
 * Map entire quiz bank (or one course). Preserves existing VERIFIED_* mappings unless force=true.
 */
export declare function runQuizCoMappingPass(opts: {
    collegeId: number;
    courseId?: number;
    force?: boolean;
    dryRun?: boolean;
}): Promise<MappingPassReport>;
