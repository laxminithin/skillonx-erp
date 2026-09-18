import { type ParsedGapWorkbook } from './workbookParser.js';
export type GapImportSummary = {
    discovered: {
        gaps: number;
        coLinks: number;
        outcomeLinks: number;
        actions: number;
        sources: number;
        reviewQueue: number;
        subjects: number;
    };
    inserted: number;
    updated: number;
    unchanged: number;
    skipped: number;
    needsReview: number;
    errors: string[];
    warnings: string[];
    batchId: string;
    sheets: string[];
};
export declare function importGapMaster(collegeId: number, actor: {
    facultyUserId: number;
}, bufferOrPath: Buffer | string, sourceFile: string, options?: {
    dryRun?: boolean;
}): Promise<GapImportSummary>;
export type { ParsedGapWorkbook };
