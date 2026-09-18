import ExcelJS from 'exceljs';
export declare function exportLessonPlanXlsx(planId: number, collegeId: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
