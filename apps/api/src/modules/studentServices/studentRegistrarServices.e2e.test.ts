/**
 * Campus OS Phase 9 — Student Services, Registrar Services & Academic
 * Record Requests. Focused tests for the additive gaps closed in this
 * pass: Transfer Certificate, Migration Certificate, Course Completion
 * Certificate, Duplicate Certificate, DOB correction, and the no-due
 * auto-clearance gate on the FINANCE_CLEARANCE workflow step. Uses a
 * fully isolated college/student fixture (not the shared E2E seed) so the
 * outstanding-dues scenario never mutates shared fixture data.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as requests from './requestEngine.js';
import * as certificates from './certificates.js';
import { ensureCollegeServicesDefaults } from './defaults.js';
import type { ServicesActor, StudentActor } from './types.js';

async function setup(tag = `P9${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Registrar College ${tag}`, code: `RG${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Registrar College ${tag}`, code: `ORG${tag}`.slice(0, 60) });
  const [academicYearId] = await db('academic_years').insert({ college_id: collegeId, label: `AY-${tag}`.slice(0, 30), is_current: true });

  const [studentId] = await db('students').insert({ college_id: collegeId, name: 'Registrar Test Student', usn: `RG-${tag}`.slice(0, 60), email: `student.${tag}@test.edu` });
  const [otherStudentId] = await db('students').insert({ college_id: collegeId, name: 'Other Student', usn: `RG2-${tag}`.slice(0, 60), email: `student2.${tag}@test.edu` });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, name: 'Admin', email: `admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });

  await ensureCollegeServicesDefaults(Number(collegeId));

  const student: StudentActor = { studentId: Number(studentId), collegeId: Number(collegeId) };
  const otherStudent: StudentActor = { studentId: Number(otherStudentId), collegeId: Number(collegeId) };
  const admin: ServicesActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), role: 'COLLEGE_ADMIN' };
  const crossAdmin: ServicesActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), role: 'COLLEGE_ADMIN' };

  return { collegeId: Number(collegeId), otherCollegeId: Number(otherCollegeId), academicYearId: Number(academicYearId), student, otherStudent, admin, crossAdmin, tag };
}

async function giveOutstandingDue(collegeId: number, studentId: number, academicYearId: number, tag: string) {
  await db('student_fee_demands').insert({
    college_id: collegeId,
    student_id: studentId,
    academic_year_id: academicYearId,
    demand_number: `DEM-${tag}`.slice(0, 60),
    demand_type: 'SEMESTER_FEE',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    gross_amount: 5000,
    net_amount: 5000,
    outstanding_amount: 5000,
    status: 'ISSUED',
  });
}

/** Drives a request from SUBMITTED through every workflow step as the given admin actor (COLLEGE_ADMIN can act on any step). */
async function approveThrough(admin: ServicesActor, requestId: number) {
  let current = await requests.staffGetRequest(admin, requestId);
  while (current.status === 'UNDER_REVIEW') {
    current = await requests.staffActionOnRequest(admin, requestId, { action: 'APPROVE', remarks: 'E2E approved' });
  }
  return current;
}

describe('Campus OS Phase 9: Student & Registrar Services', () => {
  it('Transfer Certificate: blocked while dues are outstanding, then succeeds once cleared', async () => {
    const c = await setup();
    const created = await requests.createRequest(c.student, {
      requestTypeCode: 'TRANSFER_CERTIFICATE',
      title: 'TC request',
      formData: { reason: 'Relocating to another city', lastAttendanceDate: '2026-03-01' },
    });
    await requests.submitRequest(c.student, created.id);

    await giveOutstandingDue(c.collegeId, c.student.studentId, c.academicYearId, c.tag);
    await assert.rejects(
      () => requests.staffActionOnRequest(c.admin, created.id, { action: 'APPROVE' }),
      /outstanding dues/i,
    );

    // Clear the due, then the same FINANCE_CLEARANCE step must succeed.
    await db('student_fee_demands').where({ college_id: c.collegeId, student_id: c.student.studentId }).update({ status: 'PAID', outstanding_amount: 0 });
    const afterClearance = await requests.staffActionOnRequest(c.admin, created.id, { action: 'APPROVE' });
    assert.equal(afterClearance.currentStage, 'HOD Approval');

    const finalState = await approveThrough(c.admin, created.id);
    assert.equal(finalState.status, 'APPROVED');

    const doc = await certificates.generateCertificateForRequest(c.collegeId, created.id, c.admin.facultyUserId);
    assert.match(String(doc.certificateNumber), /\/TC\//);
    const verify = await certificates.verifyDocument(String(doc.verificationCode));
    assert.equal(verify.status, 'VALID');
  });

  it('Migration Certificate: institution-issued content generated end-to-end after clearance', async () => {
    const c = await setup();
    const created = await requests.createRequest(c.student, {
      requestTypeCode: 'MIGRATION_CERTIFICATE',
      title: 'Migration certificate request',
      formData: { destinationInstitution: 'Example University', reason: 'Programme transfer' },
    });
    await requests.submitRequest(c.student, created.id);
    // No outstanding due was created for this student — clearance passes immediately.
    const finalState = await approveThrough(c.admin, created.id);
    assert.equal(finalState.status, 'APPROVED');
    const doc = await certificates.generateCertificateForRequest(c.collegeId, created.id, c.admin.facultyUserId);
    assert.match(String(doc.certificateNumber), /\/MC\//);
    const data = doc.documentData as Record<string, unknown>;
    assert.equal(data.destinationInstitution, 'Example University');
    assert.match(String((data as any).renderedBody ?? ''), /does not constitute a university-issued migration certificate/);
  });

  it('Course Completion Certificate generates end-to-end', async () => {
    const c = await setup();
    const created = await requests.createRequest(c.student, {
      requestTypeCode: 'COURSE_COMPLETION_CERTIFICATE',
      title: 'Course completion request',
      formData: { purpose: 'Higher studies application' },
    });
    await requests.submitRequest(c.student, created.id);
    const finalState = await approveThrough(c.admin, created.id);
    assert.equal(finalState.status, 'APPROVED');
    const doc = await certificates.generateCertificateForRequest(c.collegeId, created.id, c.admin.facultyUserId);
    assert.match(String(doc.certificateNumber), /\/CP\//);
  });

  it('Duplicate Certificate: original stays VALID, new document is separately numbered and idempotent on retry', async () => {
    const c = await setup();
    const bonafide = await requests.createRequest(c.student, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: 'Bonafide', formData: { purpose: 'Bank', organization: 'Bank X' } });
    await requests.submitRequest(c.student, bonafide.id);
    await approveThrough(c.admin, bonafide.id);
    const original = await certificates.generateCertificateForRequest(c.collegeId, bonafide.id, c.admin.facultyUserId);
    assert.equal(original.status, 'VALID');

    const dup = await requests.createRequest(c.student, {
      requestTypeCode: 'DUPLICATE_CERTIFICATE',
      title: 'Duplicate of bonafide',
      formData: { originalDocumentId: original.id, reason: 'Lost' },
    });
    await requests.submitRequest(c.student, dup.id);
    const dupApproved = await requests.staffActionOnRequest(c.admin, dup.id, { action: 'APPROVE' });
    assert.equal(dupApproved.status, 'APPROVED');
    await requests.staffActionOnRequest(c.admin, dup.id, { action: 'PROCESS' });

    const dupDoc1 = await certificates.duplicateDocument(c.collegeId, dup.id, c.admin.facultyUserId);
    assert.notEqual(dupDoc1.id, original.id);
    assert.equal(dupDoc1.duplicateOfId, original.id);
    assert.notEqual(dupDoc1.certificateNumber, original.certificateNumber);

    const originalRefetched = await certificates.getStudentCertificate(c.student.studentId, c.collegeId, original.id);
    assert.equal(originalRefetched.status, 'VALID', 'the original document must remain untouched');

    // Idempotent retry — same request must not mint a second duplicate.
    const dupDoc2 = await certificates.duplicateDocument(c.collegeId, dup.id, c.admin.facultyUserId);
    assert.equal(dupDoc2.id, dupDoc1.id);
  });

  it('Duplicate Certificate rejects a REVOKED original (must be reissued, not duplicated)', async () => {
    const c = await setup();
    const bonafide = await requests.createRequest(c.student, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: 'Bonafide', formData: { purpose: 'Bank', organization: 'Bank X' } });
    await requests.submitRequest(c.student, bonafide.id);
    await approveThrough(c.admin, bonafide.id);
    const original = await certificates.generateCertificateForRequest(c.collegeId, bonafide.id, c.admin.facultyUserId);
    await certificates.revokeDocument(c.collegeId, original.id, c.admin.facultyUserId, 'Superseded');

    const dup = await requests.createRequest(c.student, {
      requestTypeCode: 'DUPLICATE_CERTIFICATE',
      title: 'Duplicate of revoked bonafide',
      formData: { originalDocumentId: original.id, reason: 'Lost' },
    });
    await requests.submitRequest(c.student, dup.id);
    await requests.staffActionOnRequest(c.admin, dup.id, { action: 'APPROVE' });
    await assert.rejects(
      () => certificates.duplicateDocument(c.collegeId, dup.id, c.admin.facultyUserId),
      /revoked document should be reissued/i,
    );
  });

  it('Duplicate Certificate: tenant isolation — cannot duplicate another college\'s document', async () => {
    const c = await setup();
    const bonafide = await requests.createRequest(c.student, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: 'Bonafide', formData: { purpose: 'Bank', organization: 'Bank X' } });
    await requests.submitRequest(c.student, bonafide.id);
    await approveThrough(c.admin, bonafide.id);
    const original = await certificates.generateCertificateForRequest(c.collegeId, bonafide.id, c.admin.facultyUserId);

    await assert.rejects(
      () => certificates.getStudentCertificate(c.student.studentId, c.otherCollegeId, original.id),
      /not found/i,
    );
  });

  it('DOB correction: applies to the authoritative Student record only through the controlled correction flow', async () => {
    const c = await setup();
    const created = await requests.createRequest(c.student, {
      requestTypeCode: 'PROFILE_CORRECTION',
      title: 'DOB correction',
      formData: { field: 'DOB', currentValue: '2000-01-01', requestedValue: '2000-06-15', reason: 'Admission-time typo' },
    });
    await requests.submitRequest(c.student, created.id);
    const finalState = await approveThrough(c.admin, created.id);
    assert.equal(finalState.status, 'COMPLETED');

    const updated = await db('students').where({ id: c.student.studentId }).select(db.raw("DATE_FORMAT(date_of_birth, '%Y-%m-%d') as dob")).first();
    assert.equal(updated.dob, '2000-06-15');
  });
});
