import type { CopoActor } from './access.js';
export declare function psoCoverage(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    disclaimer: string;
    programSpecificOutcomes: import("./helpers.js").ProgramSpecificOutcomeRecord[];
    rows: {
        drilldown: {
            courseId: number;
            subjectCode: unknown;
            subjectName: unknown;
            semesterLabel: unknown;
            semesterNumber: unknown;
            coCode: unknown;
            coStatement: unknown;
            mappingVersionId: number;
            strength: number;
            justification: unknown;
        }[];
        high: number;
        moderate: number;
        low: number;
        pso: import("./helpers.js").ProgramSpecificOutcomeRecord;
        subjectsContributing: number;
        contributingCos: number;
    }[];
}>;
export declare function sdgCoverage(actor: CopoActor, filters: {
    schemeId?: number;
    programId?: number;
    academicYearId?: number;
}): Promise<{
    disclaimer: string;
    sdgs: import("./helpers.js").SdgRecord[];
    rows: {
        drilldown: {
            courseId: number;
            subjectCode: unknown;
            subjectName: unknown;
            semesterLabel: unknown;
            semesterNumber: unknown;
            coCode: unknown;
            coStatement: unknown;
            mappingVersionId: number;
            strength: number;
            justification: unknown;
        }[];
        high: number;
        moderate: number;
        low: number;
        sdg: import("./helpers.js").SdgRecord;
        subjectsContributing: number;
        contributingCos: number;
    }[];
}>;
export declare function semesterSdgMap(actor: CopoActor, filters: {
    schemeId?: number;
    programId?: number;
    academicYearId?: number;
}): Promise<{
    disclaimer: string;
    semesters: number[];
    grid: {
        sdg: import("./helpers.js").SdgRecord;
        semesters: {
            [k: string]: boolean;
        };
    }[];
}>;
export declare function derivedPoSdg(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    derived: boolean;
    disclaimer: string;
    programmeOutcomes: import("./helpers.js").ProgramOutcomeRecord[];
    sdgs: import("./helpers.js").SdgRecord[];
    matrix: {
        po: import("./helpers.js").ProgramOutcomeRecord;
        cells: {
            sdgId: number;
            sdgCode: string;
            label: string;
            contributingCos: number;
            evidence: {
                courseId: number;
                subjectCode: unknown;
                coCode: unknown;
                poStrength: number;
                sdgStrength: number;
            }[];
        }[];
    }[];
}>;
export declare function derivedPsoSdg(actor: CopoActor, schemeId: number, programId: number, academicYearId?: number): Promise<{
    derived: boolean;
    disclaimer: string;
    programSpecificOutcomes: import("./helpers.js").ProgramSpecificOutcomeRecord[];
    sdgs: import("./helpers.js").SdgRecord[];
    matrix: {
        pso: import("./helpers.js").ProgramSpecificOutcomeRecord;
        cells: {
            sdgId: number;
            sdgCode: string;
            label: string;
            contributingCos: number;
            evidence: {
                courseId: number;
                subjectCode: unknown;
                coCode: unknown;
                psoStrength: number;
                sdgStrength: number;
            }[];
        }[];
    }[];
}>;
