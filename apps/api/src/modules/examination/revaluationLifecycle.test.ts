import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as reval from './revaluation.js';

let coe: ExamActor;
let examiner: ExamActor;
let exam: any;
let studentId: number;
let courseId: number;
let subjectResultId: number;

before(async () => {
  exam = (await db('examinations').where({ status: 'RESULT_PUBLISHED' }).first()) || (await db('examinations').first());
  const collegeId = Number(exam.college_id);
  const users = await db('faculty_users').where({ college_id: collegeId, is_active: true }).limit(2);
  coe = { facultyUserId: Number(users[0].id), collegeId, role: 'COE' };
  examiner = { facultyUserId: Number(users[1].id), collegeId, role: 'FACULTY' };
  courseId = Number((await db('courses').where({ college_id: collegeId }).first()).id);
  const used = await db('semester_results').where({ exam_id: exam.id }).pluck('student_id');
  const student = await db('students').where({ college_id: collegeId }).whereNotIn('id', used.length ? used : [0]).first();
  studentId = Number(student.id);
  const [semResId] = await db('semester_results').insert({
    college_id: collegeId, student_id: studentId, exam_id: exam.id, academic_year_id: exam.academic_year_id,
    semester_id: exam.semester_id, sgpa: 6.0, total_credits: 4, earned_credits: 4, status: 'PASS', result_version: 1,
    published: true, published_at: db.fn.now(),
    grade_bands_snapshot: JSON.stringify([
      { min: 80, max: 100, grade: 'A', gradePoints: 9 },
      { min: 40, max: 79, grade: 'C', gradePoints: 6 },
      { min: 0, max: 39, grade: 'F', gradePoints: 0 },
    ]),
  });
  const [subResId] = await db('subject_results').insert({
    college_id: collegeId, semester_result_id: Number(semResId), student_id: studentId, course_id: courseId,
    total_marks: 45, max_marks: 100, grade: 'C', grade_points: 6, credits: 4, result_status: 'PASS', marks_source: 'INSTITUTION',
  });
  subjectResultId = Number(subResId);
});

describe('autonomous revaluation lifecycle (§29)', () => {
  it('drives apply -> review -> assign -> revaluate -> decision -> versioned consequence', async () => {
    const [reqId] = await db('exam_revaluation_requests').insert({
      college_id: coe.collegeId, student_id: studentId, subject_result_id: subjectResultId,
      request_type: 'REVALUATION', status: 'REQUESTED', reason: 'Expecting higher marks',
    });
    const id = Number(reqId);

    // cannot assign before acceptance
    await assert.rejects(() => reval.assignRevaluationExaminer(coe, id, examiner.facultyUserId), /ACCEPTED before assignment/i);
    await reval.reviewRevaluation(coe, id, true, 'Within window, eligible');
    await reval.assignRevaluationExaminer(coe, id, examiner.facultyUserId);

    // only the assigned examiner may submit
    const otherExaminer: ExamActor = { ...examiner, facultyUserId: coe.facultyUserId };
    await assert.rejects(() => reval.submitRevaluation(otherExaminer, id, 85, 100), /not the assigned examiner/i);
    await reval.submitRevaluation(examiner, id, 85, 100);

    // decision REVISED produces a versioned result consequence (new current version)
    const decided = await reval.decideRevaluation(coe, id, 'REVISED', 'Revaluation raised the marks');
    assert.equal(decided.status, 'COMPLETED');
    assert.ok(decided.newSemesterResultId && decided.newSemesterResultId > 0);

    // the new version is current; base is superseded
    const newRow = await db('semester_results').where({ id: decided.newSemesterResultId }).first();
    assert.equal(newRow.superseded_at, null);
    assert.equal(Number(newRow.result_version), 2);
    const newSubject = await db('subject_results').where({ semester_result_id: decided.newSemesterResultId, course_id: courseId }).first();
    assert.equal(Number(newSubject.total_marks), 85);
    assert.equal(newSubject.grade, 'A');

    // student outcome view reflects the completed decision
    const outcomes = await reval.studentRevaluationOutcomes(studentId, coe.collegeId);
    const mine = outcomes.find((o) => o.id === id);
    assert.equal(mine?.status, 'COMPLETED');
    assert.equal(mine?.decision, 'REVISED');
    assert.equal(mine?.revisedMarks, 85);
  });
});
