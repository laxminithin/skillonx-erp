import ExcelJS from 'exceljs';
import { getAnalysis } from './service.js';
export declare function exportGapAnalysisXlsx(analysisId: number, collegeId: number): Promise<{
    filename: string;
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    body: Buffer<ExcelJS.Buffer>;
    preparedBy: any;
}>;
export declare function buildPrintModel(detail: Awaited<ReturnType<typeof getAnalysis>>): {
    documentTitle: string;
    institutionName: any;
    logoUrl: any;
    departmentName: any;
    programName: any;
    subjectName: any;
    subjectCode: any;
    schemeName: any;
    semesterLabel: any;
    academicYearLabel: any;
    preparedBy: any;
    status: "DRAFT" | "ARCHIVED" | "COMPLETED" | "IN_PROGRESS";
    summary: {
        actionsTotal: number;
        actionsCompleted: number;
        evidenceCount: number;
        totalGaps: number;
        applicable: number;
        closed: number;
        open: number;
        notApplicable: number;
        covered: number;
        partiallyCovered: number;
        notCovered: number;
        coveragePercent: number | null;
        byType: Record<string, number>;
    };
    gaps: {
        serialNo: number;
        gapId: any;
        gapStatement: any;
        gapType: any;
        moduleUnit: any;
        relatedCos: string;
        expectedCoverage: string | null;
        actualCoverage: string | null;
        action: any;
        outcome: any;
        status: any;
        justification: any;
        sourceBasis: any;
        evidence: unknown[];
        traceability: {
            gapId: any;
            cos: {
                code: any;
                statement: any;
            }[];
            outcomes: {
                coCode: string | null;
                outcomeType: string;
                outcomeCode: string;
                strength: number | null;
                derivedFrom: string | null;
                verificationStatus: string | null;
                source: "SNAPSHOT" | "ACADEMIC_MAPPING";
            }[];
        };
    }[];
    evidenceIndex: {
        slNo: number;
        gapId: any;
        action: {};
        evidenceType: unknown;
        title: unknown;
        date: string;
    }[];
};
