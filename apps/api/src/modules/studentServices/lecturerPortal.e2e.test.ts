/**
 * Lecturer Portal — Student Permission/Leave Requests E2E (spec §2).
 * Validates mentor/coordinator routing, relationship-scoped inbox, cross-mentor
 * IDOR protection, and idempotent Attendance integration. Skips when the E2E
 * seed is absent (run after `npm run seed:student-lms-e2e`).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import * as requests from './requestEngine.js';
import { ensureCollegeServicesDefaults } from './defaults.js';
import { canActAsRole } from './permissions.js';
import type { ServicesActor } from './types.js';
import { listMentees } from '../mentoring/dashboard.js';
import * as coordinator from '../academicClasses/coordinator.js';
import type { MentoringActor } from '../mentoring/types.js';
import type { ClassActor } from '../academicClasses/access.js';

async function ctx() {
  try {
    if (!(await db.schema.hasTable('student_service_requests'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const student = await db('students').where({ usn: '4VV24CS001', college_id: collegeId }).first();
    if (!student) return null;
    const assignment = await db('mentor_assignments')
      .where({ student_id: student.id, status: 'ACTIVE', is_primary: true })
      .first();
    if (!assignment) return null;
    const mentor = await db('faculty_users').where({ id: assignment.mentor_faculty_id }).first();
    const nonMentor = await db('faculty_users')
      .where({ college_id: collegeId, role: 'FACULTY' })
      .whereNot({ id: mentor.id })
      .whereNotExists(function () {
        this.select('*')
          .from('mentor_assignments as ma')
          .whereRaw('ma.mentor_faculty_id = faculty_users.id')
          .andWhere('ma.student_id', Number(student.id))
          .andWhere('ma.status', 'ACTIVE');
      })
      .first();
    const coordRow = await db('academic_class_coordinators')
      .where({ academic_class_id: cls.id, role: 'COORDINATOR' })
      .first();
    const coordinator = coordRow ? await db('faculty_users').where({ id: coordRow.faculty_id }).first() : null;
    return { collegeId, cls, student, mentor, nonMentor, coordinator };
  } catch {
    return null;
  }
}

function actorOf(row: Record<string, unknown>): ServicesActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: (row.department_id as number) ?? null,
    role: String(row.role),
    name: String(row.name),
  };
}

describe('Lecturer Portal — student leave/permission requests E2E', () => {
  it('leave and permission types are installed and route to mentor / coordinator', async () => {
    const c = await ctx();
    if (!c) return;
    await ensureCollegeServicesDefaults(c.collegeId);
    const leave = await db('student_service_request_types').where({ college_id: c.collegeId, code: 'STUDENT_LEAVE_REQUEST' }).first();
    const perm = await db('student_service_request_types').where({ college_id: c.collegeId, code: 'STUDENT_PERMISSION_REQUEST' }).first();
    assert.ok(leave, 'leave type installed');
    assert.ok(perm, 'permission type installed');
    const leaveStep = await db('student_request_workflow_steps as s')
      .join('student_request_workflows as w', 'w.id', 's.workflow_id')
      .where({ 'w.request_type_id': leave.id })
      .first();
    assert.equal(leaveStep.actor_role, 'MENTOR');
    const permStep = await db('student_request_workflow_steps as s')
      .join('student_request_workflows as w', 'w.id', 's.workflow_id')
      .where({ 'w.request_type_id': perm.id })
      .first();
    assert.equal(permStep.actor_role, 'CLASS_COORDINATOR');
  });

  it('canActAsRole enforces the mentor relationship (no cross-mentor act)', async () => {
    const c = await ctx();
    if (!c || !c.nonMentor) return;
    const mentorCan = await canActAsRole(actorOf(c.mentor), 'MENTOR', Number(c.student.id));
    const strangerCan = await canActAsRole(actorOf(c.nonMentor), 'MENTOR', Number(c.student.id));
    assert.equal(mentorCan, true);
    assert.equal(strangerCan, false, 'a non-mentor faculty must NOT act on a mentor step');
  });

  it('leave approval reconciles attendance idempotently (ABSENT → EXCUSED, no duplicates)', async () => {
    const c = await ctx();
    if (!c) return;
    await ensureCollegeServicesDefaults(c.collegeId);
    const studentActor = { studentId: Number(c.student.id), collegeId: c.collegeId };

    // Seed a dedicated absent attendance mark on a unique probe date.
    const probeDate = '2099-03-15';
    const anyFaculty = await db('academic_class_subject_faculty').where({ academic_class_id: c.cls.id }).first();
    const anyCourse = anyFaculty ? Number(anyFaculty.course_id) : Number((await db('courses').where({ college_id: c.collegeId }).first()).id);
    const [sessionId] = await db('attendance_sessions').insert({
      college_id: c.collegeId,
      academic_class_id: Number(c.cls.id),
      course_id: anyCourse,
      faculty_id: Number(c.mentor.id),
      session_date: probeDate,
      period_number: 7,
      status: 'COMPLETED',
    });
    await db('attendance_records').insert({
      attendance_session_id: sessionId,
      college_id: c.collegeId,
      student_id: Number(c.student.id),
      status: 'ABSENT',
    });

    const created = await requests.createRequest(studentActor, {
      requestTypeCode: 'STUDENT_LEAVE_REQUEST',
      title: 'Medical leave',
      formData: { leaveType: 'Medical', fromDate: probeDate, toDate: probeDate, days: 1, reason: 'Fever' },
    });
    await requests.submitRequest(studentActor, created.id);

    // IDOR: a non-mentor faculty cannot action it.
    if (c.nonMentor) {
      await assert.rejects(
        () => requests.mentorActionOnRequest(actorOf(c.nonMentor), created.id, { action: 'APPROVE' }),
        /not for one of your students|not authorized/i,
      );
    }

    // Mentor approves → completed + attendance reconciled.
    const done = await requests.mentorActionOnRequest(actorOf(c.mentor), created.id, { action: 'APPROVE', remarks: 'Approved' });
    assert.ok(['COMPLETED', 'APPROVED'].includes(done.status));

    const rec = await db('attendance_records').where({ attendance_session_id: sessionId, student_id: Number(c.student.id) }).first();
    assert.equal(rec.status, 'EXCUSED', 'absent mark within leave window is excused');
    assert.match(String(rec.remarks ?? ''), /Approved leave/);

    const auditCount1 = await db('attendance_record_audits').where({ attendance_record_id: rec.id }).count({ c: '*' }).first();

    // Idempotency: re-running reconciliation must not double-apply.
    const { applyApprovedLeaveToAttendance } = await import('./leaveAttendance.js');
    const second = await applyApprovedLeaveToAttendance(c.collegeId, created.id, Number(c.mentor.id));
    assert.equal(second.reclassified, 0, 're-apply reclassifies nothing');
    const auditCount2 = await db('attendance_record_audits').where({ attendance_record_id: rec.id }).count({ c: '*' }).first();
    assert.equal(Number(auditCount1?.c), Number(auditCount2?.c), 'no duplicate audit rows on re-apply');

    // Cleanup probe rows.
    await db('attendance_record_audits').where({ attendance_record_id: rec.id }).del();
    await db('attendance_records').where({ id: rec.id }).del();
    await db('attendance_sessions').where({ id: sessionId }).del();
  });

  it('mentor inbox is relationship-scoped', async () => {
    const c = await ctx();
    if (!c) return;
    const inbox = await requests.mentorInboxRequests(actorOf(c.mentor));
    assert.ok(inbox.counts.TOTAL >= 0);
    // A non-mentor's inbox must not contain this student's requests.
    if (c.nonMentor) {
      const strangerInbox = await requests.mentorInboxRequests(actorOf(c.nonMentor));
      const leaked = (strangerInbox.requests as Array<{ usn?: string }>).some((r) => r.usn === c.student.usn);
      assert.equal(leaked, false, 'a non-mentor must not see this student in their inbox');
    }
  });
});

describe('Lecturer Portal — mentee snapshot (§1)', () => {
  it('enriched mentee snapshot exposes portfolio + academic indicators and filters', async () => {
    const c = await ctx();
    if (!c) return;
    const mentorActor: MentoringActor = {
      facultyUserId: Number(c.mentor.id),
      collegeId: c.collegeId,
      departmentId: (c.mentor.department_id as number) ?? null,
      role: String(c.mentor.role),
      name: String(c.mentor.name),
    };
    const all = await listMentees(mentorActor);
    if (!all.length) return;
    const m = all[0];
    // Enriched fields present (composed from authoritative modules).
    for (const key of ['ciePct', 'certifications', 'achievements', 'internships', 'placementStatus', 'academicTrend', 'attendanceShortage', 'activeAlerts', 'pendingRequests']) {
      assert.ok(key in m, `snapshot exposes ${key}`);
    }
    // Filter narrows, never invents: filtered ⊆ all.
    const highOnly = await listMentees(mentorActor, { riskLevel: 'HIGH' });
    assert.ok(highOnly.every((x) => x.attention === 'HIGH'));
    assert.ok(highOnly.length <= all.length);
  });
});

describe('Lecturer Portal — class coordinator (§3)', () => {
  it('coordinator workspace is scoped, non-coordinator faculty is denied, banner is authoritative', async () => {
    const c = await ctx();
    if (!c || !c.coordinator) return;
    const coordActor: ClassActor = {
      facultyUserId: Number(c.coordinator.id),
      collegeId: c.collegeId,
      departmentId: (c.coordinator.department_id as number) ?? null,
      role: String(c.coordinator.role),
    };
    const classId = Number(c.cls.id);

    const ws = await coordinator.coordinatorWorkspace(coordActor, classId);
    assert.equal(ws.class.id, classId);
    assert.ok(ws.strength >= 0);
    assert.ok('averagePct' in ws.attendance);
    assert.ok('unassigned' in ws.mentorAllocation);

    const info = await coordinator.classCoordinatorInfo(coordActor, classId);
    assert.ok(info.coordinator, 'banner resolves the authoritative coordinator');
    assert.equal(info.isCoordinator, true);

    // IDOR: a plain faculty who is not this class's coordinator is denied the workspace.
    if (c.nonMentor && String(c.nonMentor.role) === 'FACULTY') {
      const strangerActor: ClassActor = {
        facultyUserId: Number(c.nonMentor.id),
        collegeId: c.collegeId,
        departmentId: (c.nonMentor.department_id as number) ?? null,
        role: 'FACULTY',
      };
      await assert.rejects(
        () => coordinator.coordinatorWorkspace(strangerActor, classId),
        /not the coordinator/i,
      );
    }
  });
});
