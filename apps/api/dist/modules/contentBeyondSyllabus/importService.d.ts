export type CbsImportSummary = {
    discovered: {
        items: number;
        coLinks: number;
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
export declare function importCbsMaster(collegeId: number, actor: {
    facultyUserId: number;
}, bufferOrPath: Buffer | string, sourceFile: string, options?: {
    dryRun?: boolean;
}): Promise<CbsImportSummary>;
