import ExcelJS from 'exceljs';
import type { CopoActor } from './access.js';
export declare function exportMappingWorkbook(actor: CopoActor, versionId: number, kind?: 'matrix' | 'justification' | 'all'): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportCoverageWorkbook(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportBloomsWorkbook(collegeId: number, schemeId?: number, semesterId?: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function reportPayload(actor: CopoActor, versionId: number): Promise<{
    mappingKind: "PO" | "PSO" | "SDG";
    course: {
        id: number;
        code: unknown;
        name: unknown;
        departmentId: {} | null;
        departmentName: {} | null;
        schemeId: {} | null;
        schemeName: {} | null;
        schemeCode: {} | null;
        semesterId: {} | null;
        semesterLabel: {} | null;
        courseType: {} | null;
        lectureHours: {} | null;
        tutorialHours: {} | null;
        practicalHours: {} | null;
        credits: {} | null;
        cieMarks: {} | null;
        seeMarks: {} | null;
        totalMarks: {} | null;
        status: {};
    };
    program: {
        id: number;
        name: any;
        code: any;
    } | null;
    academicYear: {
        id: number;
        label: any;
    } | null;
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: import("./helpers.js").ProgramOutcomeRecord[];
    programSpecificOutcomes: import("./helpers.js").ProgramSpecificOutcomeRecord[];
    sdgs: import("./helpers.js").SdgRecord[];
    visibleSdgs: import("./helpers.js").SdgRecord[];
    relevantSdgIds: number[];
    showAllSdgs: boolean;
    poFramework: {
        id: number;
        versionNumber: any;
        label: any;
    } | null;
    mapping: {
        id: number;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
        mappingKind: "PO" | "PSO" | "SDG";
        isCurrent: boolean;
        createdBy: unknown;
        updatedBy: unknown;
        submittedAt: unknown;
        approvedAt: unknown;
        returnedAt: unknown;
    } | {
        id: null;
        versionNumber: number;
        status: "NOT_STARTED";
        mappingKind: "PO" | "PSO" | "SDG";
        isCurrent: boolean;
        createdBy?: undefined;
        updatedBy?: undefined;
        submittedAt?: undefined;
        approvedAt?: undefined;
        returnedAt?: undefined;
    };
    items: {
        id: number;
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        strength: number | null;
        justification: any;
        mappingOrigin: string | null;
        verificationStatus: string | null;
        aiSuggested: boolean;
        facultyReviewed: boolean;
    }[];
    summary: import("./quality.js").MappingSummary;
    coverage: import("./quality.js").PoCoverageRow[];
    qualityFlags: import("./quality.js").QualityFlag[];
    comments: {
        id: number;
        action: any;
        comment: any;
        authorName: any;
        courseOutcomeId: any;
        programOutcomeId: any;
        programSpecificOutcomeId: any;
        sdgId: any;
        createdAt: any;
    }[];
    sourceDocuments: {
        id: number;
        title: any;
        sourceLabel: any;
        externalUrl: any;
    }[];
    permissions: {
        canEdit: boolean;
        canSubmit: boolean;
        canReview: boolean;
        canManageMasters: boolean;
    };
    officialDataPending: {
        outcomes: boolean;
        programmeOutcomes: boolean;
        poStatements: boolean;
        programSpecificOutcomes: boolean;
        psoStatements: boolean;
    };
}>;
export declare function exportKindWorkbook(actor: CopoActor, versionId: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportAlignmentWorkbook(actor: CopoActor, query: {
    courseId: number;
    programId?: number | null;
    academicYearId?: number | null;
    schemeId?: number | null;
}): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportPsoCoverageWorkbook(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportSdgCoverageWorkbook(actor: CopoActor, filters: {
    schemeId?: number;
    programId?: number;
    academicYearId?: number;
}): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
