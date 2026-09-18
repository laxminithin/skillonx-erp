import { z } from 'zod';
import { type CopoActor } from './access.js';
import { type MappingKind } from './types.js';
import { availableMappingTypes, type AcademicMappingType, type DomainFlags } from './academicMappingTypes.js';
export declare const createInstanceSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    programId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    semesterId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    schemeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    mappingKind: z.ZodOptional<z.ZodEnum<["PO", "PSO", "SDG"]>>;
    mappingType: z.ZodOptional<z.ZodEnum<["CO_PO", "CO_PSO", "CO_SDG", "CO_PO_PSO", "CO_PO_SDG", "CO_PO_PSO_SDG"]>>;
}, "strip", z.ZodTypeAny, {
    academicYearId: number;
    courseId: number;
    semesterId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    mappingKind?: "PO" | "PSO" | "SDG" | undefined;
    mappingType?: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG" | undefined;
}, {
    academicYearId: number;
    courseId: number;
    semesterId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    mappingKind?: "PO" | "PSO" | "SDG" | undefined;
    mappingType?: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG" | undefined;
}>;
export declare const setValueSchema: z.ZodEffects<z.ZodObject<{
    courseOutcomeId: z.ZodNumber;
    programOutcomeId: z.ZodOptional<z.ZodNumber>;
    programSpecificOutcomeId: z.ZodOptional<z.ZodNumber>;
    sdgId: z.ZodOptional<z.ZodNumber>;
    value: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodNull]>;
    overrideJustification: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    value: 1 | 3 | 2 | null;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
    overrideJustification?: string | null | undefined;
}, {
    value: 1 | 3 | 2 | null;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
    overrideJustification?: string | null | undefined;
}>, {
    value: 1 | 3 | 2 | null;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
    overrideJustification?: string | null | undefined;
}, {
    value: 1 | 3 | 2 | null;
    courseOutcomeId: number;
    programOutcomeId?: number | undefined;
    programSpecificOutcomeId?: number | undefined;
    sdgId?: number | undefined;
    overrideJustification?: string | null | undefined;
}>;
export declare function findMasterVersion(collegeId: number, courseId: number, kind: MappingKind, schemeId?: number | null, programId?: number | null): Promise<any>;
export declare function listInstances(actor: CopoActor, filters?: {
    academicYearId?: number;
    status?: string;
    mappingKind?: MappingKind | 'ALL';
    mappingType?: AcademicMappingType;
    programId?: number;
    courseId?: number;
}): Promise<{
    mappings: {
        id: number;
        mappingType: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG";
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeName: unknown;
        programName: {} | null;
        academicYearLabel: unknown;
        status: string;
        createdByName: {};
        coCount: number;
        poCoverageCount: number | undefined;
        psoCoverageCount: number | undefined;
        sdgCoverageCount: number | undefined;
        targetCoverageCount: number;
        relevantSdgCount: number | undefined;
        correlationCount: number;
    }[];
    mappingKind: "PO" | "PSO" | "SDG" | "ALL";
}>;
export declare function previewGeneration(actor: CopoActor, input: z.infer<typeof createInstanceSchema>): Promise<{
    found: boolean;
    reason: string;
    mappingType: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG";
    mappingKind: "PO" | "PSO" | "SDG";
    availability: DomainFlags;
    available: ("PO" | "PSO" | "SDG")[];
    missing: string[];
    mappingTypes: import("./academicMappingTypes.js").TypeAvailability[];
    message: string;
    subject: {
        id: number;
        name: unknown;
        code: unknown;
        schemeId: number | null;
    };
    counts?: undefined;
    source?: undefined;
    needsAcademicReview?: undefined;
    course?: undefined;
    sourceMasters?: undefined;
} | {
    found: boolean;
    reason: string;
    mappingType: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG";
    mappingKind: "PO" | "PSO" | "SDG";
    availability: DomainFlags;
    available: ("PO" | "PSO" | "SDG")[];
    missing: string[];
    mappingTypes: import("./academicMappingTypes.js").TypeAvailability[];
    counts: {
        courseOutcomes: number;
        domains: Record<string, unknown>;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
    };
    message: string;
    subject: {
        id: number;
        name: unknown;
        code: unknown;
        schemeId: number | null;
    };
    source?: undefined;
    needsAcademicReview?: undefined;
    course?: undefined;
    sourceMasters?: undefined;
} | {
    found: boolean;
    mappingType: "CO_PO" | "CO_PSO" | "CO_SDG" | "CO_PO_PSO" | "CO_PO_SDG" | "CO_PO_PSO_SDG";
    mappingKind: "PO" | "PSO" | "SDG";
    source: string;
    needsAcademicReview: boolean;
    availability: DomainFlags;
    available: ("PO" | "PSO" | "SDG")[];
    missing: never[];
    mappingTypes: import("./academicMappingTypes.js").TypeAvailability[];
    course: {
        id: number;
        name: unknown;
        code: unknown;
        schemeId: number | null;
        schemeName: {} | null;
    };
    counts: {
        courseOutcomes: number;
        domains: Record<string, unknown>;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
    };
    sourceMasters: {
        [k: string]: number;
    };
    reason?: undefined;
    message?: undefined;
    subject?: undefined;
}>;
export declare function createFromMaster(actor: CopoActor, input: z.infer<typeof createInstanceSchema>): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function upgradeMapping(actor: CopoActor, id: number, mappingType: AcademicMappingType): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function getInstance(actor: CopoActor, id: number): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function updateValue(actor: CopoActor, id: number, input: z.infer<typeof setValueSchema>): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function resetToMaster(actor: CopoActor, id: number, domain?: MappingKind): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function saveDraft(actor: CopoActor, id: number): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function finalize(actor: CopoActor, id: number): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export declare function deleteInstance(actor: CopoActor, id: number): Promise<{
    ok: boolean;
}>;
export declare function setShowAllSdgs(actor: CopoActor, id: number, showAll: boolean): Promise<{
    mapping: {
        id: number;
        mappingType: any;
        mappingTypeLabel: string;
        mappingKind: "PO" | "PSO" | "SDG";
        includePo: boolean;
        includePso: boolean;
        includeSdg: boolean;
        status: string;
        createdAt: any;
        finalizedAt: any;
        createdBy: number | null;
        createdByName: any;
        sourceMappingVersionId: number;
        showAllSdgs: boolean;
    };
    institution: {
        collegeId: number;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
    };
    context: {
        courseId: number;
        subjectName: unknown;
        subjectCode: unknown;
        schemeId: number | null;
        schemeName: any;
        programId: number | null;
        programName: any;
        semesterId: number | null;
        semesterLabel: any;
        academicYearId: number | null;
        academicYearLabel: any;
    };
    courseOutcomes: import("./helpers.js").CourseOutcomeRecord[];
    programOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    programSpecificOutcomes: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    sdgs: {
        id: number;
        code: string;
        shortTitle?: string | null;
        officialStatement?: string | null;
        verificationStatus?: string | null;
        number?: number;
    }[];
    relevantSdgIds: number[];
    /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
    groups: import("./combinedMatrix.js").MatrixGroup[];
    cells: {
        id: number;
        domain: "PO" | "PSO" | "SDG";
        courseOutcomeId: number;
        programOutcomeId: number | null;
        programSpecificOutcomeId: number | null;
        sdgId: number | null;
        targetId: number | null;
        masterValue: number | null;
        currentValue: number | null;
        modifiedFromMaster: boolean;
        rationale: string | null;
        overrideJustification: string | null;
        mappingOrigin: string | null;
        verificationStatus: string | null;
    }[];
    summary: {
        courseOutcomes: number;
        programOutcomes: number | undefined;
        programSpecificOutcomes: number | undefined;
        relevantSdgs: number | undefined;
        targetCount: number;
        poCoverage: number | undefined;
        psoCoverage: number | undefined;
        sdgCoverage: number | undefined;
        targetCoverage: number;
        activeCorrelations: number;
        high: number;
        medium: number;
        low: number;
        domains: {
            SDG?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PSO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
            PO?: {
                targetCount: number;
                targetCoverage: number;
                activeCorrelations: number;
                high: number;
                medium: number;
                low: number;
            } | undefined;
        };
    };
    permissions: {
        canEdit: boolean;
        canFinalize: boolean;
        canReset: boolean;
        canDelete: boolean;
        canPrint: boolean;
        canExport: boolean;
    };
}>;
export type SubjectAvailabilityRow = {
    courseId: number;
    subject: string;
    courseCode: string;
    scheme: string | null;
    schemeId: number | null;
    program: string | null;
    programId: number | null;
    semesterId: number | null;
    semesterLabel: string | null;
    co: boolean;
    po: boolean;
    pso: boolean;
    sdg: boolean;
    mappingTypes: ReturnType<typeof availableMappingTypes>;
    issues: string[];
};
/**
 * Server-side subject coverage for Create Mapping screens and hub diagnostics.
 * Does not fabricate availability — reports genuine master readiness.
 */
export declare function listSubjectAvailability(actor: CopoActor, filters?: {
    programId?: number;
    schemeId?: number;
    academicYearId?: number;
}): Promise<{
    subjects: SubjectAvailabilityRow[];
    totals: {
        activeSubjects: number;
        coPoReady: number;
        coPsoReady: number;
        coSdgReady: number;
        allThreeReady: number;
    };
}>;
