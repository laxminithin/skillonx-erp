import type { serializeRun } from './service.js';
type RunDetail = Awaited<ReturnType<typeof serializeRun>>;
export declare function buildPrintModel(detail: RunDetail, extra?: {
    kind?: string;
    nba?: unknown;
}): {
    documentTitle: string;
    institutionPolicy: string;
    formulaVersion: any;
    courseName: any;
    courseCode: any;
    programName: any;
    academicYearLabel: any;
    semesterLabel: any;
    facultyName: any;
    seeMethod: any;
    seeConfidence: any;
    seeEstimated: boolean;
    calculatedAt: any;
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
    nba: {} | null;
};
export declare function exportAttainmentXlsx(detail: RunDetail, extra?: {
    nba811?: unknown;
    nba812?: unknown;
    students?: unknown;
}): Promise<Buffer<ArrayBuffer>>;
export {};
