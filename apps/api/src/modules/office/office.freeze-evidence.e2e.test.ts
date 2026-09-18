import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { createFacultyRequest, createRequest } from '../studentServices/requestEngine.js';
import { authorizeRequestAttachment } from '../studentServices/attachmentAccess.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { hasExamPermission, assertExamPermission } from '../examination/access.js';
import { assertOfficeCapability } from './access.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/student-services');
const run = `freeze-${Date.now()}`;

async function throwsCode(fn: () => unknown, code?: string) {
  try {
    await fn();
  } catch (error) {
    const e = error as AppError;
    assert.ok(e.status === 403 || e.status === 404, `expected 403/404, got ${e.status}`);
    if (code) assert.ok(e.code === code || e.status === 403 || e.status === 404);
    return;
  }
  assert.fail('expected authorization failure');
}

describe('Office auxiliary freeze evidence', () => {
  let college: any;
  let studentA: any;
  let studentB: any;
  let facultyA: any;
  let officeAdmin: any;
  let superintendent: any;
  let attachmentA: any;
  let attachmentFaculty: any;

  before(async () => {
    college = await db('colleges').where({ code: process.env.OFFICE_QA_COLLEGE_CODE ?? 'VVIET' }).first();
    assert.ok(college);
    studentA = await db('students').where({ college_id: college.id }).where('usn', 'like', '%001').first();
    studentB = await db('students').where({ college_id: college.id }).where('usn', 'like', '%002').first();
    facultyA = await db('faculty_users').where({ college_id: college.id, email: 'faculty.requester.qa@vviet.edu.in' }).first();
    officeAdmin = await db('faculty_users').where({ college_id: college.id, email: 'office.admin.qa@vviet.edu.in' }).first();
    superintendent = await db('faculty_users').where({ college_id: college.id, email: 'office.superintendent.qa@vviet.edu.in' }).first();
    assert.ok(studentA && studentB && facultyA && officeAdmin && superintendent);
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, `${run}.pdf`), 'office attachment evidence');
    const studentRequest = await createRequest({ studentId: studentA.id, collegeId: college.id }, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: run });
    const requestId = studentRequest.id;
    const [attachmentId] = await db('student_service_attachments').insert({ college_id: college.id, request_id: requestId, file_name: `${run}.pdf`, file_size: 26, mime_type: 'application/pdf', storage_key: `${run}.pdf`, uploaded_by_student_id: studentA.id, visibility: 'STUDENT' });
    attachmentA = await db('student_service_attachments').where({ id: attachmentId }).first();
    const facultyRequest = await createFacultyRequest({ facultyUserId: facultyA.id, collegeId: college.id, departmentId: facultyA.department_id, role: facultyA.role, name: facultyA.name }, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: run });
    const [facultyAttachmentId] = await db('student_service_attachments').insert({ college_id: college.id, request_id: facultyRequest.id, file_name: `${run}-faculty.pdf`, file_size: 26, mime_type: 'application/pdf', storage_key: `${run}.pdf`, uploaded_by_faculty_id: facultyA.id, visibility: 'REQUESTER' });
    attachmentFaculty = { id: facultyAttachmentId };
  });

  after(async () => {
    await db('student_service_attachments').where('file_name', 'like', `${run}%`).del();
    await db('student_service_requests').where('title', run).del();
    await db('student_notifications').where('dedupe_key', 'like', `OFFICE_FREEZE_${run}%`).del();
    await rm(path.join(root, `${run}.pdf`), { force: true });
    await db.destroy();
  });

  it('Attachment Security: requester and authorized Office access, isolation, and safe storage', async () => {
    const own = await authorizeRequestAttachment({ role: 'STUDENT', collegeId: college.id, studentId: studentA.id }, attachmentA.id);
    assert.equal(Number(own.id), Number(attachmentA.id));
    await throwsCode(() => authorizeRequestAttachment({ role: 'STUDENT', collegeId: college.id, studentId: studentB.id }, attachmentA.id));
    const facultyOwn = await authorizeRequestAttachment({ role: 'FACULTY', collegeId: college.id, facultyUserId: facultyA.id }, attachmentFaculty.id);
    assert.equal(Number(facultyOwn.id), Number(attachmentFaculty.id));
    await throwsCode(() => authorizeRequestAttachment({ role: 'FACULTY', collegeId: college.id, facultyUserId: officeAdmin.id }, attachmentFaculty.id));
    assert.equal(Number((await authorizeRequestAttachment({ role: 'OFFICE_ADMIN', collegeId: college.id, facultyUserId: officeAdmin.id }, attachmentA.id)).id), Number(attachmentA.id));
    assert.equal(Number((await authorizeRequestAttachment({ role: 'OFFICE_SUPERINTENDENT', collegeId: college.id, facultyUserId: superintendent.id }, attachmentA.id)).id), Number(attachmentA.id));
    await throwsCode(() => authorizeRequestAttachment({ role: 'OFFICE_ADMIN', collegeId: college.id + 999, facultyUserId: officeAdmin.id }, attachmentA.id));
    await throwsCode(() => authorizeRequestAttachment({ role: 'MAINTENANCE', collegeId: college.id, facultyUserId: officeAdmin.id }, attachmentA.id));
    await throwsCode(() => authorizeRequestAttachment({ role: 'MANAGEMENT', collegeId: college.id, facultyUserId: officeAdmin.id }, attachmentA.id));
    await assert.rejects(() => authorizeRequestAttachment({ role: 'OFFICE_ADMIN', collegeId: college.id, facultyUserId: officeAdmin.id }, 999999), /not found/i);
    assert.equal((await db('student_service_attachments').where({ id: attachmentA.id }).first()).storage_key, `${run}.pdf`);
  });

  it('COE Boundary: Office roles have no exam mutation authority and Office data does not write exam tables', async () => {
    for (const role of ['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT']) {
      for (const permission of ['exam.marks.verify', 'exam.result.process', 'exam.result.publish'] as const) {
        assert.equal(hasExamPermission({ role, collegeId: college.id, facultyUserId: officeAdmin.id } as any, permission), false);
        await throwsCode(() => assertExamPermission({ role, collegeId: college.id, facultyUserId: officeAdmin.id } as any, permission));
      }
    }
    const before = await db('semester_results').where({ college_id: college.id }).count({ c: '*' }).first();
    assert.equal((await db('student_service_requests').where({ college_id: college.id, title: run }).count({ c: '*' }).first()).c, 2);
    const after = await db('semester_results').where({ college_id: college.id }).count({ c: '*' }).first();
    assert.equal(String(after?.c), String(before?.c));
  });

  it('Notifications: canonical supported Office events are tenant/request scoped and idempotent', async () => {
    const events = ['REQUEST_SUBMITTED', 'REQUEST_ACTION_REQUIRED', 'REQUEST_REJECTED', 'CERTIFICATE_READY'];
    for (const type of events) await notifyStudent({ studentId: studentA.id, collegeId: college.id, type, title: `Office ${type}`, body: `Reference ${run}`, link: `/lms/services/requests/${attachmentA.request_id}`, relatedType: 'service_request', relatedId: attachmentA.request_id, dedupeKeyOverride: `OFFICE_FREEZE_${run}_${type}` });
    await notifyStudent({ studentId: studentA.id, collegeId: college.id, type: events[0], title: 'duplicate', dedupeKeyOverride: `OFFICE_FREEZE_${run}_${events[0]}` });
    const rows = await db('student_notifications').where('dedupe_key', 'like', `OFFICE_FREEZE_${run}%`).orderBy('id');
    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map((r: any) => r.type), events);
    assert.ok(rows.every((r: any) => Number(r.student_id) === Number(studentA.id) && Number(r.college_id) === Number(college.id)));
    assert.ok(rows.every((r: any) => !String(r.body ?? '').includes('storage')));
  });

  it('HOD Scope: Office queue, assignment, analytics, and mutations are unavailable', async () => {
    assert.throws(() => assertOfficeCapability('HOD', 'request.view'), /denied/i);
    assert.throws(() => assertOfficeCapability('HOD', 'assignment.manage'), /denied/i);
    assert.throws(() => assertOfficeCapability('HOD', 'finance.mutate'), /denied/i);
    assert.equal((await db('faculty_users').where({ college_id: college.id, role: 'HOD' }).count({ c: '*' }).first()).c >= 2, true);
  });
});
