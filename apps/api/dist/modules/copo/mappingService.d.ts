import { z } from 'zod';
import { type CopoActor } from './access.js';
import { type MappingKind } from './types.js';
export declare const workspaceQuerySchema: z.ZodObject<{
    courseId: z.ZodNumber;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    schemeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    mappingKind: z.ZodDefault<z.ZodOptional<z.ZodEnum<["PO", "PSO", "SDG"]>>>;
}, "strip", z.ZodTypeAny, {
    courseId: number;
    mappingKind: "PO" | "PSO" | "SDG";
    academicYearId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
}, {
    courseId: number;
    academicYearId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    mappingKind?: "PO" | "PSO" | "SDG" | undefined;
}>;
export declare const cellSchema: z.ZodObject<{
    courseOutcomeId: z.ZodNumber;
    programOutcomeId: z.ZodOptional<z.ZodNumber>;
    programSpecificOutcomeId: z.ZodOptional<z.ZodNumber>;
    sdgId: z.ZodOptional<z.ZodNumber>;
    strength: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodNull]>;
}, "strip", z.ZodTypeAny, {
    courseOutcomeId: number;
    strength: 1 | 3 | 2 | null;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
}, {
    courseOutcomeId: number;
    strength: 1 | 3 | 2 | null;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
}>;
export declare const justificationSchema: z.ZodObject<{
    courseOutcomeId: z.ZodNumber;
    programOutcomeId: z.ZodOptional<z.ZodNumber>;
    programSpecificOutcomeId: z.ZodOptional<z.ZodNumber>;
    sdgId: z.ZodOptional<z.ZodNumber>;
    justification: z.ZodString;
}, "strip", z.ZodTypeAny, {
    justification: string;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
}, {
    justification: string;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
}>;
export declare function findCurrentVersion(opts: {
    collegeId: number;
    courseId: number;
    programId?: number | null;
    academicYearId?: number | null;
    mappingKind?: MappingKind | null;
}): Promise<any>;
export declare function ensureDraftVersion(actor: CopoActor, opts: {
    courseId: number;
    programId?: number | null;
    academicYearId?: number | null;
    schemeId?: number | null;
    mappingKind?: MappingKind | null;
}): Promise<any>;
export declare function getWorkspace(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>): Promise<{
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
export declare function getWorkspaceByVersion(actor: CopoActor, versionId: number): Promise<{
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
export declare function setCell(actor: CopoActor, versionId: number, input: z.infer<typeof cellSchema>): Promise<{
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
export declare function setJustification(actor: CopoActor, versionId: number, input: z.infer<typeof justificationSchema>): Promise<{
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
export declare function bulkJustifications(actor: CopoActor, versionId: number, items: Array<z.infer<typeof justificationSchema>>): Promise<{
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
export declare function submitMapping(actor: CopoActor, versionId: number): Promise<{
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
export declare function returnMapping(actor: CopoActor, versionId: number, comment: string): Promise<{
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
export declare function approveMapping(actor: CopoActor, versionId: number, comment?: string): Promise<{
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
export declare function reopenMapping(actor: CopoActor, versionId: number): Promise<{
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
export declare function copyPrevious(actor: CopoActor, versionId: number, fromVersionId: number): Promise<{
    comparison: {
        fromCo: any;
        fromTarget: string;
        strength: any;
        justification: any;
        compatible: boolean;
        targetCourseOutcomeId: number | null;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
    }[];
    copied: number;
    skipped: number;
    workspace: {
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
    };
}>;
export declare function previewCopy(actor: CopoActor, courseId: number, academicYearId?: number | null, programId?: number | null, mappingKind?: MappingKind): Promise<{
    current: {
        id: any;
        status: any;
        versionNumber: any;
        mappingKind: "PO" | "PSO" | "SDG";
    } | null;
    previous: {
        id: any;
        status: any;
        versionNumber: any;
        academicYearId: any;
        mappingKind: "PO" | "PSO" | "SDG";
    } | null;
}>;
export declare function suggestForVersion(actor: CopoActor, versionId: number): Promise<{
    label: string;
    suggestions: {
        programSpecificOutcomeId: number | undefined;
        sdgId: number | undefined;
        courseOutcomeId: number;
        programOutcomeId: number;
        coCode: string;
        poCode: string;
        suggested: import("./types.js").CorrelationStrength;
        confidence: "High" | "Medium" | "Low";
        rationale: string;
    }[];
}>;
export declare function justificationDraft(actor: CopoActor, versionId: number, courseOutcomeId: number, targetId: number): Promise<{
    draft: string;
    similar: {
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
}>;
export declare function acceptSuggestions(actor: CopoActor, versionId: number, accepted: Array<{
    courseOutcomeId: number;
    programOutcomeId?: number;
    programSpecificOutcomeId?: number;
    sdgId?: number;
    strength: 1 | 2 | 3;
}>): Promise<{
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
export declare function listDashboard(actor: CopoActor, filters: {
    schemeId?: number;
    programId?: number;
    semesterId?: number;
    academicYearId?: number;
    status?: string;
    facultyId?: number;
}): Promise<{
    subjects: {
        courseId: number;
        subjectCode: unknown;
        subjectName: unknown;
        semesterLabel: unknown;
        schemeName: unknown;
        schemeCode: string | null;
        departmentName: unknown;
        mappingId: number | null;
        versionNumber: number;
        status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
        po: {
            mappingId: number | null;
            versionNumber: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            mappingPercent: number;
        };
        pso: {
            mappingId: number | null;
            versionNumber: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            mappingPercent: number;
        };
        sdg: {
            mappingId: number | null;
            versionNumber: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            mappingPercent: number;
        };
        overall: string;
        coCount: number;
        mappedPoCount: number;
        correlationCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
        mappingPercent: number;
        justificationPercent: number;
    }[];
}>;
export declare function listReviewQueue(actor: CopoActor, filters?: {
    mappingKind?: string;
    schemeId?: number;
    programId?: number;
    semesterId?: number;
    academicYearId?: number;
    status?: string;
    facultyId?: number;
}): Promise<{
    mappings: {
        id: number;
        courseId: number;
        subjectCode: unknown;
        subjectName: unknown;
        status: unknown;
        mappingKind: {};
        mappingType: string;
        versionNumber: number;
        submittedAt: unknown;
        submittedByName: unknown;
        academicYearLabel: unknown;
        programName: unknown;
        schemeName: unknown;
        semesterLabel: unknown;
    }[];
}>;
export declare function programCoverage(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    programmeOutcomes: import("./helpers.js").ProgramOutcomeRecord[];
    rows: {
        po: import("./helpers.js").ProgramOutcomeRecord;
        subjectsContributing: number;
        contributingCos: number;
        high: number;
        moderate: number;
        low: number;
        drilldown: {
            courseId: number;
            subjectCode: unknown;
            subjectName: unknown;
            semesterLabel: unknown;
            coCode: unknown;
            coStatement: unknown;
            mappingVersionId: number;
            strength: number;
            justification: unknown;
        }[];
    }[];
}>;
export declare function bloomsDistribution(collegeId: number, filters?: {
    schemeId?: number;
    semesterId?: number;
}): Promise<{
    courses: {
        courseId: number;
        code: string;
        name: string;
        levels: Record<string, number>;
    }[];
}>;
export declare function listAudit(collegeId: number, filters?: {
    courseId?: number;
    mappingVersionId?: number;
}): Promise<{
    id: number;
    action: any;
    actorName: any;
    actorId: any;
    courseId: any;
    mappingKind: any;
    mappingVersionId: any;
    courseOutcomeId: any;
    programOutcomeId: any;
    programSpecificOutcomeId: any;
    sdgId: any;
    previousValue: any;
    newValue: any;
    createdAt: any;
}[]>;
export declare function listVersions(actor: CopoActor, courseId: number, programId?: number, academicYearId?: number, mappingKind?: MappingKind): Promise<{
    id: number;
    mappingKind: {};
    versionNumber: number;
    status: unknown;
    isCurrent: boolean;
    academicYearId: unknown;
    createdAt: unknown;
    submittedAt: unknown;
    approvedAt: unknown;
}[]>;
export declare function getUnifiedWorkspace(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>): Promise<{
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
    po: {
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
    };
    pso: {
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
    };
    sdg: {
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
    };
    progress: {
        po: {
            label: string;
            percent: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
        };
        pso: {
            label: string;
            percent: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
        };
        sdg: {
            label: string;
            percent: number;
            status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
        };
        overall: string;
    };
    alignment: {
        courseOutcome: import("./helpers.js").CourseOutcomeRecord;
        po: {
            code: string;
            strength: number | null;
            justification: any;
        }[];
        pso: {
            code: string;
            strength: number | null;
            justification: any;
        }[];
        sdg: {
            code: string;
            title: string | undefined;
            strength: number | null;
            justification: any;
        }[];
    }[];
}>;
export declare function submitAllOutcomeMappings(actor: CopoActor, query: z.infer<typeof workspaceQuerySchema>, confirm?: boolean): Promise<{
    ready: {
        mappingKind: MappingKind;
        versionId: number;
    }[];
    blocked: {
        mappingKind: MappingKind;
        reason: string;
    }[];
    skipped: {
        mappingKind: MappingKind;
        reason: string;
    }[];
    submitted: MappingKind[];
    workspace?: undefined;
} | {
    ready: {
        mappingKind: MappingKind;
        versionId: number;
    }[];
    blocked: {
        mappingKind: MappingKind;
        reason: string;
    }[];
    skipped: {
        mappingKind: MappingKind;
        reason: string;
    }[];
    submitted: ("PO" | "PSO" | "SDG")[];
    workspace: {
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
        po: {
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
        };
        pso: {
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
        };
        sdg: {
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
        };
        progress: {
            po: {
                label: string;
                percent: number;
                status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            };
            pso: {
                label: string;
                percent: number;
                status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            };
            sdg: {
                label: string;
                percent: number;
                status: "DRAFT" | "ARCHIVED" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "NOT_STARTED";
            };
            overall: string;
        };
        alignment: {
            courseOutcome: import("./helpers.js").CourseOutcomeRecord;
            po: {
                code: string;
                strength: number | null;
                justification: any;
            }[];
            pso: {
                code: string;
                strength: number | null;
                justification: any;
            }[];
            sdg: {
                code: string;
                title: string | undefined;
                strength: number | null;
                justification: any;
            }[];
        }[];
    };
}>;
export declare function setRelevantSdgs(actor: CopoActor, versionId: number, sdgIds: number[], showAll?: boolean): Promise<{
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
