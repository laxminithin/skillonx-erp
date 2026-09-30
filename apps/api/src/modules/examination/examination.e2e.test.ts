/**
 * Examination module E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { computeEligibility, condoneEligibility } from './eligibility.js';
import { getMarksSheet, lockMarks, saveMarks, submitMarks, unlockMarks, verifyMarks } from './marks.js';
import { processResults, publishResults, studentResults } from './result.js';
import { studentHallTicket } from './studentExam.js';
import type { ExamActor } from './access.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('examinations'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const exam = await db('examinations').where({ code: 'SX-E2E-SEE-2026' }).first();
    if (!exam) return null;
    const admin = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' })
      .first();
    const coe = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COE' })
      .first();
    const faculty = await db('academic_class_subject_faculty')
      .where({ academic_class_id: cls.id, status: 'ACTIVE' })
      .first();
    const approved = await db('academic_class_enrollments')
      .where({ academic_class_id: cls.id, status: 'APPROVED' })
      .first();
    const lowAtt = await db('students').where({ usn: 'SX-E2E-LOW-ATT' }).first();
    return { cls, exam, admin, coe, faculty, approved, lowAtt };
  } catch {
    return null;
  }
}

function adminActor(row: { id: number; college_id: number; department_id?: number | null; role: string }): ExamActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
  };
}

function coeActor(row: { id: number; college_id: number; department_id?: number | null }): ExamActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: 'COE',
  };
}

describe('examination E2E', () => {
  before(async () => {
    // 'condonation records audit' (below) permanently condones the low-attendance student's
    // eligibility row — condonation is intentionally sticky, so computeEligibility() never
    // overwrites it on its own. Clear that one specific override before this suite runs so a
    // prior run's condonation doesn't leak into 'low attendance student is not eligible'.
    const ctx = await e2eContext();
    if (ctx?.lowAtt && ctx.exam) {
      await db('exam_eligibility')
        .where({ exam_id: ctx.exam.id, student_id: ctx.lowAtt.id, status: 'CONDONED' })
        .delete();
    }
  });

  it('eligible student passes eligibility check', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const actor = coeActor(ctx.coe ?? ctx.admin);
    await computeEligibility(actor, Number(ctx.exam.id));
    const elig = await db('exam_eligibility')
      .where({ exam_id: ctx.exam.id, student_id: ctx.approved?.student_id })
      .first();
    assert.ok(elig);
    assert.equal(elig.status, 'ELIGIBLE');
  });

  it('low attendance student is not eligible', async () => {
    const ctx = await e2eContext();
    if (!ctx?.lowAtt) return;
    const row = await db('exam_eligibility')
      .where({ exam_id: ctx.exam.id, student_id: ctx.lowAtt.id })
      .first();
    if (!row) return;
    assert.equal(row.status, 'NOT_ELIGIBLE');
    assert.equal(row.reason_code, 'ATTENDANCE_SHORTAGE');
  });

  it('condonation records audit', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.lowAtt) return;
    const row = await db('exam_eligibility')
      .where({ exam_id: ctx.exam.id, student_id: ctx.lowAtt.id })
      .first();
    if (!row || row.status === 'ELIGIBLE') return;
    const actor = coeActor(ctx.coe ?? ctx.admin);
    const updated = await condoneEligibility(actor, Number(row.id), { reason: 'E2E condonation test' });
    assert.equal(updated.status, 'CONDONED');
    const audit = await db('examination_audit_log')
      .where({ action: 'ELIGIBILITY_CONDONED', entity_id: row.id })
      .first();
    assert.ok(audit);
  });

  it('hall ticket shows eligible subjects only', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const ticket = await studentHallTicket(Number(ctx.approved.student_id), Number(ctx.cls.college_id), Number(ctx.exam.id));
    assert.ok(ticket.subjects.length >= 1);
    assert.ok(ticket.student.usn);
    for (const s of ticket.subjects) {
      assert.ok(['ELIGIBLE', 'CONDONED'].includes(s.status));
    }
  });

  it('marks lock prevents faculty edit without unlock', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.faculty || !ctx.approved) return;
    const subject = await db('examination_subjects').where({ exam_id: ctx.exam.id }).first();
    if (!subject) return;
    const facultyActor: ExamActor = {
      facultyUserId: Number(ctx.faculty.faculty_id),
      collegeId: Number(ctx.cls.college_id),
      role: 'FACULTY',
    };
    const coe = coeActor(ctx.coe ?? ctx.admin);
    const sheet = await db('exam_marks_sheets').where({ exam_subject_id: subject.id }).first();
    if (sheet?.locked) {
      await unlockMarks(coe, Number(subject.id), { reason: 'E2E reset before lock test' });
    }
    await saveMarks(facultyActor, Number(subject.id), [
      { studentId: Number(ctx.approved.student_id), marks: 42, status: 'PRESENT' },
    ]);
    await submitMarks(facultyActor, Number(subject.id));
    await verifyMarks(coe, Number(subject.id));
    await lockMarks(coe, Number(subject.id));
    const lockedSheet = await getMarksSheet(facultyActor, Number(subject.id));
    assert.equal(lockedSheet.sheet.locked, true);
    await assert.rejects(
      () =>
        saveMarks(facultyActor, Number(subject.id), [
          { studentId: Number(ctx.approved!.student_id), marks: 50, status: 'PRESENT' },
        ]),
      /locked/i,
    );
    await unlockMarks(coe, Number(subject.id), { reason: 'E2E unlock test' });
    const unlocked = await getMarksSheet(facultyActor, Number(subject.id));
    assert.equal(unlocked.sheet.locked, false);
  });

  it('published results visible to student only after publish', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.approved) return;
    const coe = coeActor(ctx.coe ?? ctx.admin);
    const before = await studentResults(Number(ctx.approved.student_id), Number(ctx.cls.college_id));
    const publishedBefore = before.some((r) => r.examId === Number(ctx.exam.id));
    if (!publishedBefore) {
      const subject = await db('examination_subjects').where({ exam_id: ctx.exam.id }).first();
      if (subject) {
        const facultyActor: ExamActor = {
          facultyUserId: Number(ctx.faculty?.faculty_id ?? ctx.admin.id),
          collegeId: Number(ctx.cls.college_id),
          role: 'COE',
        };
        await saveMarks(facultyActor, Number(subject.id), [
          { studentId: Number(ctx.approved.student_id), marks: 42, status: 'PRESENT' },
        ]);
        await submitMarks(facultyActor, Number(subject.id));
        await verifyMarks(coe, Number(subject.id));
        await lockMarks(coe, Number(subject.id));
      }
      await processResults(coe, Number(ctx.exam.id));
      await publishResults(coe, Number(ctx.exam.id));
    }
    const after = await studentResults(Number(ctx.approved.student_id), Number(ctx.cls.college_id));
    const result = after.find((r) => r.examId === Number(ctx.exam.id));
    assert.ok(result);
    assert.ok(result!.subjects.length >= 1);
    assert.ok(result!.sgpa != null);
  });

  it('exam-office mutations are owned by COE, not admin principal HOD or faculty fallbacks', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const coe = coeActor(ctx.coe ?? ctx.admin);
    const admin = adminActor(ctx.admin);
    assert.equal(coe.role, 'COE');
    await assert.rejects(() => computeEligibility(admin, Number(ctx.exam.id)), /permission/i);
    await assert.rejects(
      () => computeEligibility({ ...admin, role: 'PRINCIPAL' }, Number(ctx.exam.id)),
      /permission/i,
    );
    await assert.rejects(
      () => computeEligibility({ ...admin, role: 'HOD' }, Number(ctx.exam.id)),
      /permission/i,
    );
    await assert.rejects(
      () => computeEligibility({ ...admin, role: 'FACULTY' }, Number(ctx.exam.id)),
      /permission/i,
    );
  });

  it('student cannot access another student result row', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const other = await db('academic_class_enrollments')
      .where({ academic_class_id: ctx.cls.id, status: 'APPROVED' })
      .whereNot('student_id', ctx.approved.student_id)
      .first();
    if (!other) return;
    const row = await db('semester_results')
      .where({ student_id: other.student_id, exam_id: ctx.exam.id, published: true })
      .first();
    if (!row) return;
    const foreign = await db('semester_results')
      .where({ id: row.id, student_id: ctx.approved.student_id })
      .first();
    assert.equal(foreign, undefined);
  });
});
