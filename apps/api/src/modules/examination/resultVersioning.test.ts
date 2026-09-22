import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as result from './result.js';

let coe: ExamActor;
let exam: any;
let studentId: number;
let courseId: number;
let baseId: number;

before(async () => {
  exam = await db('examinations').where({ status: 'RESULT_PUBLISHED' }).first()
    || await db('examinations').first();
  assert.ok(exam, 'a seeded examination is required');
  const collegeId = Number(exam.college_id);
  const users = await db('faculty_users').where({ college_id: collegeId, is_active: true }).first();
  coe = { facultyUserId: Number(users.id), collegeId, role: 'COE' };
  courseId = Number((await db('courses').where({ college_id: collegeId }).first()).id);

  // Pick a student in this college without an existing result for this exam (isolated fixture).
  const used = await db('semester_results').where({ exam_id: exam.id }).pluck('student_id');
  const student = await db('students')
    .where({ college_id: collegeId })
    .whereNotIn('id', used.length ? used : [0])
    .first();
  assert.ok(student, 'a student without an existing result for this exam is required');
  studentId = Number(student.id);

  const [semResId] = await db('semester_results').insert({
    college_id: collegeId,
    student_id: studentId,
    exam_id: exam.id,
    academic_year_id: exam.academic_year_id,
    semester_id: exam.semester_id,
    sgpa: 6.0,
    total_credits: 4,
    earned_credits: 4,
    status: 'PASS',
    result_version: 1,
    published: true,
    published_at: db.fn.now(),
    grade_bands_snapshot: JSON.stringify([
      { min: 90, max: 100, grade: 'S', gradePoints: 10 },
      { min: 80, max: 89, grade: 'A', gradePoints: 9 },
      { min: 70, max: 79, grade: 'B', gradePoints: 8 },
      { min: 40, max: 69, grade: 'C', gradePoints: 6 },
      { min: 0, max: 39, grade: 'F', gradePoints: 0 },
    ]),
  });
  baseId = Number(semResId);
  await db('subject_results').insert({
    college_id: collegeId,
    semester_result_id: baseId,
    student_id: studentId,
    course_id: courseId,
    total_marks: 45,
    max_marks: 100,
    grade: 'C',
    grade_points: 6,
    credits: 4,
    result_status: 'PASS',
    marks_source: 'INSTITUTION',
  });
});

describe('versioned result correction (§28)', () => {
  it('creates V2, retains V1 as history, and recomputes grade/SGPA authoritatively', async () => {
    const corrected = await result.correctResult(coe, baseId, {
      reason: 'Re-totalling error on the answer script',
      subjectCorrections: [{ courseId, totalMarks: 85, maxMarks: 100 }],
    });
    assert.equal(corrected.baseVersion, 1);
    assert.equal(corrected.newVersion, 2);
    assert.ok(corrected.newSemesterResultId > baseId);

    // V1 retained but superseded
    const v1 = await db('semester_results').where({ id: baseId }).first();
    assert.ok(v1.superseded_at, 'V1 must be marked superseded');
    assert.equal(Number(v1.superseded_by_id), corrected.newSemesterResultId);
    assert.equal(v1.published, 1, 'V1 row is retained, not deleted');

    // V2 current
    const v2 = await db('semester_results').where({ id: corrected.newSemesterResultId }).first();
    assert.equal(Number(v2.result_version), 2);
    assert.equal(v2.superseded_at, null);
    assert.equal(v2.published, 1);

    // recomputed grade: 85% -> 'A' / 9 points; SGPA over 4 credits = 9.0
    const v2subject = await db('subject_results').where({ semester_result_id: corrected.newSemesterResultId, course_id: courseId }).first();
    assert.equal(v2subject.grade, 'A');
    assert.equal(Number(v2subject.total_marks), 85);
    assert.equal(Number(v2.sgpa), 9.0);

    // correction record preserves version/changes/reason/actors/timestamp
    const rec = await db('exam_result_corrections').where({ new_semester_result_id: corrected.newSemesterResultId }).first();
    assert.ok(rec);
    assert.equal(Number(rec.from_version), 1);
    assert.equal(Number(rec.to_version), 2);
    assert.equal(Number(rec.requested_by), coe.facultyUserId);
    assert.equal(Number(rec.approved_by), coe.facultyUserId);
    const changes = typeof rec.changes === 'string' ? JSON.parse(rec.changes) : rec.changes;
    assert.equal(changes[0].before.totalMarks, 45);
    assert.equal(changes[0].after.totalMarks, 85);

    // student read returns only the current version
    const student = await result.studentResults(studentId, coe.collegeId);
    const forExam = student.filter((r) => r.examId === Number(exam.id));
    assert.equal(forExam.length, 1, 'student sees exactly one (current) version');
    assert.equal(forExam[0].resultVersion, 2);
    assert.equal(forExam[0].subjects.find((s) => s.courseId === courseId)?.totalMarks, 85);
  });

  it('refuses to correct an already-superseded version (no destructive overwrite)', async () => {
    await assert.rejects(
      () => result.correctResult(coe, baseId, { reason: 'x', subjectCorrections: [{ courseId, totalMarks: 50 }] }),
      /superseded/i,
    );
  });
});
