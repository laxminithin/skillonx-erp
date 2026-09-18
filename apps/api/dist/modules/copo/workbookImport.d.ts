import type { CopoActor } from './access.js';
export type WorkbookPreview = {
    batchId: string;
    fileName: string;
    summary: {
        subjectsInFile: number;
        existingSubjectsMatched: number;
        newSubjects: number;
        officialCos: number;
        newCos: number;
        existingCosMatched: number;
        coDifferences: number;
        pos: number;
        newPos: number;
        poDifferences: number;
        mappingRelationships: number;
        newMappings: number;
        changedMappings: number;
        psos: number;
        coPsoMappings: number;
        sdgs: number;
        coSdgMappings: number;
        warnings: number;
        errors: number;
        importReadySubjects: number;
        notImportReadySubjects: number;
        courseCodeConflicts: number;
        schemeConflicts: number;
        ambiguous: number;
    };
    warnings: string[];
    errors: string[];
    subjects: Array<{
        code: string;
        name: string;
        scheme: string;
        program: string;
        importReady: boolean;
        matchStatus: string;
        courseId: number | null;
        existingName: string | null;
        existingCode: string | null;
        conflict?: {
            existing: {
                name: string;
                code: string;
                scheme: string | null;
            };
            mapper: {
                name: string;
                code: string;
                scheme: string;
            };
        };
        outcomes: Array<{
            code: string;
            status: 'NEW' | 'UNCHANGED' | 'CHANGED' | 'SKIPPED_NOT_READY';
            existingStatement?: string;
            importedStatement?: string;
        }>;
    }>;
    programOutcomes: Array<{
        code: string;
        scheme: string;
        status: 'NEW' | 'UNCHANGED' | 'CHANGED';
        existingStatement?: string;
        importedStatement?: string;
    }>;
};
export declare function previewWorkbookImport(collegeId: number, actor: CopoActor, buffer: Buffer, fileName: string): Promise<WorkbookPreview>;
type Resolution = {
    courseId: number;
    coCode: string;
    action: 'KEEP_EXISTING' | 'CREATE_NEW_VERSION' | 'REVIEW_LATER';
};
export declare function commitWorkbookImport(collegeId: number, actor: CopoActor, batchId: string, resolutions?: Resolution[]): Promise<{
    subjects: number;
    subjectsCreated: number;
    outcomes: number;
    outcomesUnchanged: number;
    mappings: number;
    mappingsUnchanged: number;
    psosCreated: number;
    psosUpdated: number;
    psosUnchanged: number;
    coPsoMappings: number;
    coPsoMappingsUnchanged: number;
    sdgsUpserted: number;
    coSdgMappings: number;
    coSdgMappingsUnchanged: number;
    skipped: number;
    needsReview: number;
    warnings: number;
    errors: number;
}>;
export declare function workbookErrorReport(preview: WorkbookPreview): Buffer<ArrayBuffer>;
export declare function importCopoMasterFile(collegeId: number, actor: CopoActor, buffer: Buffer, fileName: string): Promise<{
    preview: WorkbookPreview;
    committed: Awaited<ReturnType<typeof commitWorkbookImport>> | null;
}>;
export {};
