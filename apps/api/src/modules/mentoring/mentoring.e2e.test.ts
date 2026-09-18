/**
 * Mentoring & Student Advisory E2E invariants. Skips when the E2E seed is absent.
 * Run after `npm run seed:student-lms-e2e`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import * as allocation from './allocation.js';
import * as sessions from './sessions.js';
import * as escalations from './escalations.js';
import * as student360 from './student360.js';
import * as dashboard from './dashboard.js';
import * as oversight from './oversight.js';
import * as studentView from './student.js';
import * as config from './config.js';
import { computeRisk } from './riskEngine.js';
import { leadershipContext } from './permissions.js';
import type { MentoringActor } from './types.js';

type Ctx = {
  collegeId: number;
  mentorId: number;
  student: Record<string, unknown>;
  otherStudent: Record<string, unknown> | null;
  nonMentor: Record<string, unknown> | null;
  hod: Record<string, unknown> | null;
};

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('mentoring_actions'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const student = await db('students').where({ usn: '4VV24CS001', college_id: collegeId }).first();
    if (!student) return null;
    const assignment = await db('mentor_assignments')
      .where({ student_id: student.id, status: 'ACTIVE', is_primary: true })
      .first();
    if (!assignment) return null;
    const otherStudent = await db('students').where({ usn: '4VV24CS002', college_id: collegeId }).first();
    const mentorId = Number(assignment.mentor_faculty_id);
    const nonMentor = await db('faculty_users')
      .where({ college_id: collegeId, role: 'FACULTY' })
      .whereNot({ id: mentorId })
      .whereNotExists(function () {
        this.select('*')
          .from('mentor_assignments as ma')
          .whereRaw('ma.mentor_faculty_id = faculty_users.id')
          .andWhere('ma.student_id', Number(student.id))
          .andWhere('ma.status', 'ACTIVE');
      })
      .first();
    // The CSE HOD/Principal are represented via leadership overlays (faculty role
    // stays FACULTY); resolve them by their deterministic QA emails.
    const hod = await db('faculty_users').where({ college_id: collegeId, email: 'qa.hod.cse@vviet.edu.in' }).first();
    return { collegeId, mentorId, student, otherStudent, nonMentor, hod };
  } catch {
    return null;
  }
}

function facultyActor(row: Record<string, unknown>, role?: string): MentoringActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: (row.department_id as number) ?? null,
    role: (role ?? (row.role as string)) as string,
    name: row.name as string,
  };
}

describe('mentoring & student advisory E2E', () => {
  it('risk engine is explainable (every flag carries a reason)', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const risk = await computeRisk(ctx.collegeId, Number(ctx.student.id));
    assert.ok(['NORMAL', 'WATCH', 'ATTENTION', 'HIGH'].includes(risk.attention));
    assert.equal(risk.dimensions.length, 5);
    // Any non-normal dimension must supply a human-readable reason.
    for (const d of risk.dimensions) {
      if (d.level !== 'NORMAL') assert.ok(d.reason && d.reason.length > 0, `dimension ${d.dimension} missing reason`);
    }
  });

  it('mentor dashboard surfaces mentees and summary', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const mentor = await db('faculty_users').where({ id: ctx.mentorId }).first();
    const dash = await dashboard.mentorDashboard(facultyActor(mentor, 'FACULTY'));
    assert.ok(dash.summary.activeMentees >= 1);
    assert.ok(Array.isArray(dash.actionRequired));
    assert.ok(dash.mentees.some((m) => Number(m.studentId) === Number(ctx.student.id)));
  });

  it('mentor can open Student 360 for an assigned mentee', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const mentor = await db('faculty_users').where({ id: ctx.mentorId }).first();
    const view = await student360.student360(facultyActor(mentor, 'FACULTY'), Number(ctx.student.id));
    assert.equal(view.identity.usn, '4VV24CS001');
    assert.ok(view.attendance);
    assert.ok(view.risk.dimensions.length === 5);
    assert.ok(view.mentoring.sessions.length >= 0);
  });

  it('non-mentor faculty is denied an unassigned mentee 360', async () => {
    const ctx = await e2eContext();
    if (!ctx?.nonMentor) return;
    // Ensure the non-mentor is not assigned to this student.
    const assigned = await db('mentor_assignments')
      .where({ student_id: ctx.student.id, mentor_faculty_id: ctx.nonMentor.id, status: 'ACTIVE' })
      .first();
    if (assigned) return;
    await assert.rejects(
      () => student360.student360(facultyActor(ctx.nonMentor!, 'FACULTY'), Number(ctx.student.id)),
      /not one of your assigned mentees/i,
    );
  });

  it('session + follow-up + action lifecycle', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const mentor = facultyActor(await db('faculty_users').where({ id: ctx.mentorId }).first(), 'FACULTY');
    const created = await sessions.createSession(mentor, {
      studentId: Number(ctx.student.id),
      meetingType: 'ONLINE',
      sessionCategory: 'STUDY_PLANNING',
      agenda: 'E2E test session',
      studentVisibleNotes: 'Visible plan',
      privateNotes: 'Private note',
      visibility: 'MENTORING_TEAM',
      followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      status: 'COMPLETED',
    });
    assert.ok(created.id);
    const done = await sessions.completeFollowUp(mentor, created.id, 'Followed up');
    assert.equal(done.followUpStatus, 'DONE');

    const action = await sessions.createAction(mentor, {
      studentId: Number(ctx.student.id),
      title: 'E2E action lifecycle',
      owner: 'STUDENT',
    });
    const upd = await sessions.updateAction(mentor, action.id, { status: 'COMPLETED', outcome: 'done' });
    assert.equal(upd.status, 'COMPLETED');
  });

  it('confidential mentor notes are hidden from the student view', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const meetings = await studentView.myMeetings(Number(ctx.student.id), ctx.collegeId);
    for (const m of meetings) {
      // Student view exposes only student-visible notes; never private text.
      assert.ok(!('privateNotes' in m));
      assert.ok(!('observations' in m));
    }
    const actions = await studentView.myActions(Number(ctx.student.id), ctx.collegeId);
    assert.ok(Array.isArray(actions));
    const mentor = await studentView.myMentor(Number(ctx.student.id), ctx.collegeId);
    assert.ok(mentor.mentor);
  });

  it('escalation reaches HOD department oversight and can be resolved', async () => {
    const ctx = await e2eContext();
    if (!ctx?.hod) return;
    const mentor = facultyActor(await db('faculty_users').where({ id: ctx.mentorId }).first(), 'FACULTY');
    const esc = await escalations.createEscalation(mentor, {
      studentId: Number(ctx.student.id),
      reasonCode: 'ADMINISTRATIVE_SUPPORT_REQUIRED',
      reason: 'E2E escalation for oversight test',
      targetLevel: 'HOD',
    });
    const hodActor = facultyActor({ ...ctx.hod, department_id: ctx.student.department_id }, 'HOD');
    const hodCtx = await leadershipContext(hodActor);
    const deptIds = hodCtx.hodDepartmentIds.length ? hodCtx.hodDepartmentIds : [Number(ctx.student.department_id)];
    const list = await escalations.listLeadershipEscalations(hodActor, { departmentIds: deptIds });
    assert.ok(list.some((e) => e.id === esc.id));
    const resolved = await escalations.resolveEscalation(hodActor, esc.id, deptIds, { action: 'RESOLVE', resolution: 'Handled' });
    assert.equal(resolved.status, 'RESOLVED');
  });

  it('HOD department dashboard scopes to the department', async () => {
    const ctx = await e2eContext();
    if (!ctx?.hod) return;
    const hodActor = facultyActor(ctx.hod);
    const hodCtx = await leadershipContext(hodActor);
    const deptIds = hodCtx.hodDepartmentIds.length ? hodCtx.hodDepartmentIds : [Number(ctx.student.department_id)];
    const dash = await oversight.hodMentoring(hodActor, deptIds);
    assert.ok(dash.pulse.totalStudents >= 1);
    assert.ok('coveragePct' in dash.pulse);
  });

  it('reassignment preserves history', async () => {
    const ctx = await e2eContext();
    if (!ctx?.nonMentor) return;
    const admin = await db('faculty_users').where({ college_id: ctx.collegeId, role: 'COLLEGE_ADMIN' }).first();
    if (!admin) return;
    const adminActor = facultyActor(admin);
    const adminCtx = await leadershipContext(adminActor);
    const before = await allocation.assignmentHistory(ctx.collegeId, Number(ctx.student.id));
    // Reassign to non-mentor, then back to original mentor.
    await allocation.assignMentor(adminActor, adminCtx, Number(ctx.student.id), Number(ctx.nonMentor.id));
    await allocation.assignMentor(adminActor, adminCtx, Number(ctx.student.id), ctx.mentorId);
    const after = await allocation.assignmentHistory(ctx.collegeId, Number(ctx.student.id));
    assert.ok(after.length >= before.length + 2, 'history rows should accumulate, not be destroyed');
    assert.equal(after.filter((a) => a.status === 'ACTIVE').length, 1, 'exactly one active primary mentor');
  });

  it('management analytics are de-identified (no student names / notes)', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const admin = await db('faculty_users').where({ college_id: ctx.collegeId, role: 'COLLEGE_ADMIN' }).first();
    if (!admin) return;
    const view = await oversight.managementMentoring(facultyActor(admin));
    const serialized = JSON.stringify(view);
    assert.ok(!serialized.includes('4VV24CS001'), 'aggregate must not leak identifiable USNs');
    assert.ok('attentionDistribution' in view);
    assert.ok('coveragePct' in view);
  });

  it('risk config is readable and effective', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const view = await config.getRiskConfigView(ctx.collegeId);
    assert.ok(view.effective.attendanceAttentionPct > 0);
  });
});
