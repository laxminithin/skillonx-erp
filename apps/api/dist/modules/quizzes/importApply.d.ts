export type ImportApplyOptions = {
    collegeId: number;
    createdBy: number;
    createMissingSubjects?: boolean;
    dryRun?: boolean;
};
export type SubjectImportSummary = {
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
    }>;
};
export type ImportApplyReport = {
    batchId: string;
    dryRun: boolean;
    filesDiscovered: number;
    subjectsFound: number;
    questionsDiscovered: number;
    validated: number;
    imported: number;
    needsReview: number;
    duplicates: number;
    missingAnswer: number;
    malformed: number;
    unmatchedSubjects: string[];
    createdSubjects: string[];
    subjects: SubjectImportSummary[];
};
export declare function applyQuestionBankImport(opts: ImportApplyOptions): Promise<ImportApplyReport>;
