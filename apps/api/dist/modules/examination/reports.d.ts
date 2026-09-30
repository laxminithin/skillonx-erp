import ExcelJS from 'exceljs';
import type { ExamActor } from './access.js';
type Row = Record<string, any>;
export type ExamResultRow = {
    usn: string;
    studentName: string;
    courseCode: string;
    courseName: string;
    internalMarks: number | null;
    externalMarks: number | null;
    totalMarks: number | null;
    maxMarks: number | null;
    grade: string | null;
    resultStatus: string;
    sgpa: number | null;
    version: number;
};
export declare function examResultsReportData(actor: ExamActor, examId: number): Promise<{
    exam: Row;
    rows: ExamResultRow[];
}>;
export declare function buildResultsWorkbook(actor: ExamActor, examId: number): Promise<{
    workbook: ExcelJS.Workbook;
    filename: string;
    rowCount: number;
}>;
export {};
