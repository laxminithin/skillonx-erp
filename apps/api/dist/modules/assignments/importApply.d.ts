export type AssignmentImportApplyOptions = {
    collegeId: number;
    createdBy: number;
    createMissingSubjects?: boolean;
    dryRun?: boolean;
    root?: string;
};
export type AssignmentSubjectImportSummary = {
    subject: string;
    courseId: number | null;
    mapping: 'matched' | 'created' | 'unmatched';
    modules: Array<{
        name: string;
        easy: number;
        intermediate: number;
        difficult: number;
        needsReview: number;
        imported: number;
        coMapped: number;
        coBlocked: number;
    }>;
};
export type AssignmentImportApplyReport = {
    batchId: string;
    dryRun: boolean;
    filesDiscovered: number;
    subjectsFound: number;
    questionsDiscovered: number;
    validated: number;
    imported: number;
    needsReview: number;
    duplicates: number;
    coMapped: number;
    coNeedsReview: number;
    coBlocked: number;
    unmatchedSubjects: string[];
    createdSubjects: string[];
    subjects: AssignmentSubjectImportSummary[];
};
export declare function applyAssignmentBankImport(opts: AssignmentImportApplyOptions): Promise<AssignmentImportApplyReport>;
