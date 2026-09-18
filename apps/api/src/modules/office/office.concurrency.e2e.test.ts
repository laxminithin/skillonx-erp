import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import * as requests from '../studentServices/requestEngine.js';
import * as certificates from '../studentServices/certificates.js';
import { ensureCollegeServicesDefaults } from '../studentServices/defaults.js';
import { nextOfficeNumber } from './controller.js';

describe('Office closure concurrency evidence', () => {
  let college: any; let student: any; let faculty: any;
  before(async () => {
    college = await db('colleges').where({ code: process.env.OFFICE_QA_COLLEGE_CODE ?? 'VVIET' }).first();
    student = await db('students').where({ college_id: college.id }).where('usn', 'like', '%001').first();
    faculty = await db('faculty_users').where({ college_id: college.id, role: 'OFFICE_ADMIN' }).first();
    await ensureCollegeServicesDefaults(college.id);
  });
  after(async () => db.destroy());

  it('1. document numbering is unique under concurrent issuance', async () => {
    const actor = { studentId: Number(student.id), collegeId: Number(college.id) };
    const a = await requests.createRequest(actor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Concurrent number A ${Date.now()}`, formData: { semesterId: student.semester_id } });
    const b = await requests.createRequest(actor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Concurrent number B ${Date.now()}`, formData: { semesterId: student.semester_id } });
    await Promise.all([requests.submitRequest(actor, a.id), requests.submitRequest(actor, b.id)]);
    const docs = await Promise.all([certificates.generateCertificateForRequest(college.id, a.id, faculty.id), certificates.generateCertificateForRequest(college.id, b.id, faculty.id)]);
    assert.notEqual(docs[0].certificateNumber, docs[1].certificateNumber);
  });

  it('2. outward numbering is unique under concurrent transactions', async () => {
    const numbers = await Promise.all([1, 2].map(() => db.transaction((trx) => nextOfficeNumber(trx, college.id, 'OUT'))));
    assert.equal(new Set(numbers).size, 2);
  });

  it('3. final issuance is idempotent under concurrent retries', async () => {
    const actor = { studentId: Number(student.id), collegeId: Number(college.id) };
    const request = await requests.createRequest(actor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Concurrent issue ${Date.now()}`, formData: { semesterId: student.semester_id } });
    await requests.submitRequest(actor, request.id);
    const docs = await Promise.all([1, 2, 3].map(() => certificates.generateCertificateForRequest(college.id, request.id, faculty.id)));
    assert.equal(new Set(docs.map((d) => d.id)).size, 1);
    assert.equal(await db('student_service_documents').where({ request_id: request.id, status: 'VALID' }).count({ c: '*' }).first().then((r) => Number(r?.c)), 1);
  });
});
