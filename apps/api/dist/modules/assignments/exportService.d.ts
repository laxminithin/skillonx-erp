import ExcelJS from 'exceljs';
export declare function exportAssignmentXlsx(assignmentId: number, collegeId: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function exportAssignment(assignmentId: number, collegeId: number, _format?: 'xlsx' | 'csv'): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
