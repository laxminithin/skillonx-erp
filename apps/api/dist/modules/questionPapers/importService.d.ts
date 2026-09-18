import { catalog as copoCatalog } from '../copo/masters.js';
import { type Enricher } from './extractPipeline.js';
export type ImportReport = {
    batchId: string;
    dryRun: boolean;
    filesDiscovered: number;
    papers: number;
    questions: number;
    subquestions: number;
    orGroups: number;
    coMapped: number;
    blocked: number;
    needsReview: number;
    ocrRequired: number;
    unmatchedSubjects: string[];
    inserted: number;
    updated: number;
    unchanged: number;
    masterPath: string;
};
declare function parseJson<T>(value: unknown, fallback: T): T;
export declare function makeEnricher(collegeId: number): Promise<Enricher>;
export declare function applyPreviousYearImport(opts: {
    collegeId: number;
    importedBy?: number | null;
    dryRun?: boolean;
    root?: string;
    writeWorkbook?: boolean;
}): Promise<ImportReport>;
export declare function ensurePreviousYearLibrary(collegeId: number, importedBy?: number | null): Promise<ImportReport | null>;
export declare function rebuildQuestionOccurrences(collegeId: number): Promise<void>;
export declare function classifyLegacyQuestionSources(collegeId: number): Promise<{
    previousYearQuestions: number;
    assignmentBankQuestions: number;
    quizBankQuestions: number;
    note: string;
}>;
export { parseJson, copoCatalog };
