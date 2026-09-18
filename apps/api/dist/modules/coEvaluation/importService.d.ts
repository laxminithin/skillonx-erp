export type CoEvalImportSummary = {
    discovered: {
        assessmentComponents: number;
        structures: number;
        courseComponents: number;
        coRows: number;
        componentMappings: number;
        justifications: number;
        sources: number;
        reviewQueue: number;
        subjects: number;
        evaluableSubjects: number;
        blockedSubjects: number;
    };
    inserted: number;
    updated: number;
    unchanged: number;
    skipped: number;
    needsReview: number;
    blockedSubjects: Array<{
        courseCode: string;
        subjectName: string;
        reason: string;
    }>;
    errors: string[];
    warnings: string[];
    batchId: string;
    sheets: string[];
};
export declare function importCoEvalMaster(collegeId: number, actor: {
    facultyUserId: number;
}, bufferOrPath: Buffer | string, sourceFile: string, options?: {
    dryRun?: boolean;
}): Promise<CoEvalImportSummary>;
