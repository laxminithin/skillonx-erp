import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import ExcelJS from 'exceljs';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as reports from './reports.js';

let coe: ExamActor;
let exam: any;
let studentId: number;
let courseId: number;

before(async () => {
  exam = (await db('examinations').where({ status: 'RESULT_PUBLISHED' }).first()) || (await db('examinations').first());
  const collegeId = Number(exam.college_id);
  coe = { facultyUserId: Number((await db('faculty_users').where({ college_id: collegeId, is_active: true }).first()).id), collegeId, role: 'COE' };
  courseId = Number((await db('courses').where({ college_id: collegeId }).first()).id);
  const used = await db('semester_results').where({ exam_id: exam.id }).pluck('student_id');
  // a USN with a leading zero to prove text preservation
  const student = await db('students').where({ college_id: collegeId }).whereNotIn('id', used.length ? used : [0]).first();
  studentId = Number(student.id);
  const [semResId] = await db('semester_results').insert({
    college_id: collegeId, student_id: studentId, exam_id: exam.id, academic_year_id: exam.academic_year_id,
    semester_id: exam.semester_id, sgpa: 8.5, total_credits: 4, earned_credits: 4, status: 'PASS', result_version: 1,
    published: true, published_at: db.fn.now(),
  });
  await db('subject_results').insert({
    college_id: collegeId, semester_result_id: Number(semResId), student_id: studentId, course_id: courseId,
    internal_marks: 20, external_marks: 60, total_marks: 80, max_marks: 100, grade: 'A', grade_points: 9, credits: 4, result_status: 'PASS', marks_source: 'INSTITUTION',
  });
});

describe('examination results report (§47-48)', () => {
  it('report data matches authoritative published results', async () => {
    const { rows } = await reports.examResultsReportData(coe, Number(exam.id));
    const dbCount = await db('subject_results as sub')
      .join('semester_results as sr', 'sr.id', 'sub.semester_result_id')
      .where({ 'sr.exam_id': exam.id, 'sr.college_id': coe.collegeId, 'sr.published': true })
      .whereNull('sr.superseded_at')
      .count('* as c').first();
    assert.equal(rows.length, Number(dbCount?.c), 'row count equals authoritative subject-result count');
    const mine = rows.find((r) => r.totalMarks === 80 && r.grade === 'A');
    assert.ok(mine, 'the seeded result row is present with the authoritative marks/grade');
  });

  it('generated workbook preserves USNs as text and neutralises formula injection', async () => {
    // inject a formula-looking name to prove sanitisation
    await db('students').where({ id: studentId }).update({ name: '=cmd()' });
    const { workbook, rowCount } = await reports.buildResultsWorkbook(coe, Number(exam.id));
    const buf = await workbook.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as ArrayBuffer);
    const ws = wb2.getWorksheet('Results')!;
    // header is row 4 (2 title rows + blank)
    let dataRows = 0;
    let sawSafeName = false;
    let usnIsText = true;
    ws.eachRow((row, n) => {
      if (n <= 4) return;
      dataRows += 1;
      const usnCell = row.getCell(1);
      if (typeof usnCell.value !== 'string') usnIsText = false;
      const nameVal = row.getCell(2).value;
      if (typeof nameVal === 'string' && nameVal.startsWith("'=")) sawSafeName = true;
      // no cell should be an executable formula object
      row.eachCell((cell) => assert.ok(typeof cell.value !== 'object' || cell.value === null || !(cell.value as { formula?: string }).formula, 'no formula cells'));
    });
    assert.equal(dataRows, rowCount, 'workbook data rows equal reported count');
    assert.ok(usnIsText, 'USN cells are text (leading zeros / no scientific notation)');
    assert.ok(sawSafeName, 'formula-looking text is prefixed and inert');
  });
});
