import ExcelJS from 'exceljs';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import { assertExamCollege, assertExamPermission } from './access.js';

type Row = Record<string, any>;

// Neutralise spreadsheet formula-injection for user-controlled text cells (§48).
function safeText(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export type ExamResultRow = {
  usn: string; studentName: string; courseCode: string; courseName: string;
  internalMarks: number | null; externalMarks: number | null; totalMarks: number | null;
  maxMarks: number | null; grade: string | null; resultStatus: string; sgpa: number | null; version: number;
};

// Authoritative, current published results for an exam (used by the report AND its validation).
export async function examResultsReportData(actor: ExamActor, examId: number): Promise<{ exam: Row; rows: ExamResultRow[] }> {
  assertExamPermission(actor, 'exam.reports');
  const exam = await assertExamCollege(examId, actor.collegeId);
  const rows = await db('semester_results as sr')
    .join('subject_results as sub', 'sub.semester_result_id', 'sr.id')
    .join('students as s', 's.id', 'sr.student_id')
    .join('courses as c', 'c.id', 'sub.course_id')
    .where({ 'sr.exam_id': examId, 'sr.college_id': actor.collegeId, 'sr.published': true })
    .whereNull('sr.superseded_at')
    .select(
      's.usn', 's.name as student_name', 'c.code as course_code', 'c.name as course_name',
      'sub.internal_marks', 'sub.external_marks', 'sub.total_marks', 'sub.max_marks',
      'sub.grade', 'sub.result_status', 'sr.sgpa', 'sr.result_version',
    )
    .orderBy([{ column: 's.usn', order: 'asc' }, { column: 'c.code', order: 'asc' }]);
  return {
    exam,
    rows: rows.map((r: Row) => ({
      usn: String(r.usn),
      studentName: r.student_name,
      courseCode: r.course_code,
      courseName: r.course_name,
      internalMarks: r.internal_marks != null ? Number(r.internal_marks) : null,
      externalMarks: r.external_marks != null ? Number(r.external_marks) : null,
      totalMarks: r.total_marks != null ? Number(r.total_marks) : null,
      maxMarks: r.max_marks != null ? Number(r.max_marks) : null,
      grade: r.grade,
      resultStatus: r.result_status,
      sgpa: r.sgpa != null ? Number(r.sgpa) : null,
      version: Number(r.result_version),
    })),
  };
}

export async function buildResultsWorkbook(actor: ExamActor, examId: number): Promise<{ workbook: ExcelJS.Workbook; filename: string; rowCount: number }> {
  const { exam, rows } = await examResultsReportData(actor, examId);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX Examination';
  const ws = wb.addWorksheet('Results');
  ws.addRow([`Examination: ${exam.name}`]);
  ws.addRow([`Exam code: ${exam.code}`]);
  ws.addRow([]);
  const header = ['USN', 'Student', 'Course Code', 'Course Name', 'Internal', 'External', 'Total', 'Max', 'Grade', 'Result', 'SGPA', 'Version'];
  ws.addRow(header).font = { bold: true };
  for (const r of rows) {
    const row = ws.addRow([
      safeText(r.usn), safeText(r.studentName), safeText(r.courseCode), safeText(r.courseName),
      r.internalMarks, r.externalMarks, r.totalMarks, r.maxMarks, safeText(r.grade), safeText(r.resultStatus), r.sgpa, r.version,
    ]);
    row.getCell(1).numFmt = '@'; // USN as text — preserve leading zeros, no scientific notation
  }
  ws.columns.forEach((col) => { col.width = 16; });
  return { workbook: wb, filename: `${String(exam.code).replace(/[^A-Za-z0-9_-]/g, '_')}-Results.xlsx`, rowCount: rows.length };
}
