/**
 * Student Academic Services E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import * as requests from './requestEngine.js';
import * as certificates from './certificates.js';
import * as grievances from './grievances.js';
import * as mentoring from './mentoring.js';
import { ensureCollegeServicesDefaults } from './defaults.js';
import type { ServicesActor } from './types.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('student_service_requests'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const student = await db('students').where({ usn: '4VV24CS001' }).first();
    const otherStudent = await db('students').where({ usn: '4VV24CS002' }).first();
    const admin = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' })
      .first();
    const hod = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'HOD' })
      .first();
    const faculty = await db('academic_class_subject_faculty')
      .where({ academic_class_id: cls.id, status: 'ACTIVE' })
      .first();
    if (!student || !admin) return null;
    return { cls, student, otherStudent, admin, hod, faculty };
  } catch {
    return null;
  }
}

function adminActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): ServicesActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

describe('student services E2E', () => {
  it('student services home lists request types', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeServicesDefaults(Number(ctx.cls.college_id));
    const home = await requests.studentServicesHome(Number(ctx.student.id), Number(ctx.cls.college_id));
    assert.ok(home.requestTypes.length >= 1);
    assert.ok(home.requestTypes.some((t) => t.code === 'BONAFIDE_CERTIFICATE'));
  });

  it('bonafide request workflow: submit → approve → certificate', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = { studentId: Number(ctx.student.id), collegeId: Number(ctx.cls.college_id) };
    await ensureCollegeServicesDefaults(actor.collegeId);

    const created = await requests.createRequest(actor, {
      requestTypeCode: 'BONAFIDE_CERTIFICATE',
      title: 'Bonafide for internship',
      formData: { purpose: 'Internship', organization: 'Tech Corp' },
    });
    assert.equal(created.status, 'DRAFT');

    const submitted = await requests.submitRequest(actor, created.id);
    assert.ok(submitted.requestNumber);
    assert.ok(['UNDER_REVIEW', 'SUBMITTED'].includes(submitted.status));

    const admin = adminActor(ctx.admin);
    let current = await requests.staffGetRequest(admin, created.id);

    while (current.status === 'UNDER_REVIEW') {
      current = await requests.staffActionOnRequest(admin, created.id, { action: 'APPROVE', remarks: 'E2E approved' });
      if (current.status === 'APPROVED') break;
    }

    if (current.status === 'APPROVED') {
      const doc = await certificates.generateCertificateForRequest(actor.collegeId, created.id, admin.facultyUserId);
      assert.ok(doc.certificateNumber);
      assert.ok(doc.verificationCode);
      const verify = await certificates.verifyDocument(doc.verificationCode);
      assert.equal(verify.status, 'VALID');
    }
  });

  it('tenant isolation: student cannot access other student certificate', async () => {
    const ctx = await e2eContext();
    if (!ctx?.otherStudent) return;
    const doc = await db('student_service_documents')
      .where({ student_id: ctx.student.id, college_id: ctx.cls.college_id })
      .first();
    if (!doc) return;
    await assert.rejects(
      () =>
        certificates.getStudentCertificate(
          Number(ctx.otherStudent!.id),
          Number(ctx.cls.college_id),
          Number(doc.id),
        ),
      /not found/i,
    );
  });

  it('grievance: submit and staff resolve', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = { studentId: Number(ctx.student.id), collegeId: Number(ctx.cls.college_id) };
    const g = await grievances.createGrievance(actor, {
      category: 'ACADEMIC',
      subject: 'E2E test grievance',
      description: 'Testing grievance workflow',
    });
    assert.ok(g.grievanceNumber);
    assert.equal(g.status, 'SUBMITTED');

    const admin = adminActor(ctx.admin);
    const assigned = await grievances.assignGrievance(admin, g.id, admin.facultyUserId);
    assert.equal(assigned.status, 'ASSIGNED');

    const resolved = await grievances.resolveGrievance(admin, g.id, 'Issue addressed in E2E test');
    assert.equal(resolved.status, 'RESOLVED');
  });

  it('mentor meeting: request and schedule', async () => {
    const ctx = await e2eContext();
    if (!ctx?.faculty) return;
    const studentActor = { studentId: Number(ctx.student.id), collegeId: Number(ctx.cls.college_id) };
    const mentorFacultyId = Number(ctx.faculty.faculty_id);

    const existing = await db('mentor_assignments')
      .where({ student_id: studentActor.studentId, status: 'ACTIVE' })
      .first();
    if (!existing) {
      await mentoring.assignMentor(adminActor(ctx.admin), studentActor.studentId, mentorFacultyId);
    }

    const meeting = await mentoring.requestMeeting(studentActor, {
      agenda: 'E2E academic discussion',
      meetingType: 'ACADEMIC',
    });
    assert.equal(meeting.meeting.status, 'REQUESTED');

    const mentorActor: ServicesActor = {
      facultyUserId: mentorFacultyId,
      collegeId: studentActor.collegeId,
      role: 'FACULTY',
    };
    const scheduled = await mentoring.scheduleMeeting(mentorActor, meeting.meeting.id, {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      studentVisibleNotes: 'Discuss semester performance',
    });
    assert.equal(scheduled.status, 'SCHEDULED');

    const completed = await mentoring.completeMeeting(mentorActor, meeting.meeting.id, {
      studentVisibleNotes: 'Reviewed performance goals',
      privateNotes: 'Internal: follow up next month',
    });
    assert.equal(completed.status, 'COMPLETED');

    const studentView = await mentoring.getStudentMentor(studentActor.studentId, studentActor.collegeId);
    assert.ok(studentView.recentNotes?.some((n) => n.notes?.includes('performance goals')));
  });

  it('invalid verification code returns 404', async () => {
    await assert.rejects(() => certificates.verifyDocument('invalid-code-xyz'), /not found/i);
  });

  it('revoked document shows REVOKED status', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const doc = await db('student_service_documents')
      .where({ student_id: ctx.student.id, status: 'VALID' })
      .first();
    if (!doc) return;
    await certificates.revokeDocument(Number(ctx.cls.college_id), Number(doc.id), Number(ctx.admin.id), 'E2E revoke test');
    const verify = await certificates.verifyDocument(String(doc.verification_code));
    assert.equal(verify.status, 'REVOKED');
    assert.equal(verify.valid, false);
  });
});
