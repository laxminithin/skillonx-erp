import ExcelJS from 'exceljs';
import type { getEvaluation } from './service.js';
type Detail = Awaited<ReturnType<typeof getEvaluation>>;
export declare function buildPrintModel(detail: Detail): {
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
    status: string;
    courseType: any;
    summary: {
        courseOutcomes: number;
        assessmentComponents: number;
        allocatedMarks: number;
        expectedMarks: number | null;
        evaluationAllocation: number;
        modifiedValues: number;
        status: any;
    };
    validation: import("./matrixValidation.js").ValidationResult;
    matrix: {
        columns: {
            id: string;
            name: string;
            officialMaxMarks: number | null;
        }[];
        rows: {
            coCode: string;
            coStatement: any;
            values: {
                assessmentComponentId: string;
                value: number | null;
            }[];
            marksDistribution: number | null;
            evaluationPercent: number | null;
        }[];
        totals: {
            assessmentComponentId: string;
            allocated: number;
            expected: number | null;
        }[];
        evaluationPercentTotal: number;
    };
    assessmentStructure: unknown;
    justifications: {
        coCode: string;
        assessmentComponentId: string;
        componentName: string;
        standardValue: number | null;
        currentValue: number | null;
        masterJustification: any;
        lecturerChangeJustification: any;
        sourceStatus: any;
        modified: boolean;
    }[];
    sourceNotes: {
        verificationStatus: any;
        sourceStatus: any;
        snapshotMeta: unknown;
    };
};
export declare function exportCoEvaluationXlsx(detail: Detail): Promise<{
    buffer: Buffer<ExcelJS.Buffer>;
    fileName: string;
}>;
export {};
