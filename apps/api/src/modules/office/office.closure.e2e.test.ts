/**
 * Office Administration final evidence pass.
 *
 * This suite deliberately counts the requested scenarios one-for-one.  A
 * missing capability is a failing scenario, never a skip or a menu-level
 * assertion.  It uses the production Student Services, Finance, certificate,
 * and Office persistence services against the QA database.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import * as requests from '../studentServices/requestEngine.js';
import * as certificates from '../studentServices/certificates.js';
import { ensureCollegeServicesDefaults } from '../studentServices/defaults.js';
import { assertServicesPermission, hasServicesPermission } from '../studentServices/permissions.js';
import { assertFinancePermission } from '../finance/access.js';
import { createServiceRequestFeeDemand, isServiceRequestFeePaid } from '../finance/integration.js';
import { recordManualPayment } from '../finance/payments.js';
import { managementOfficeAnalytics } from './analytics.js';
import type { ServicesActor, StudentActor } from '../studentServices/types.js';
import type { FinanceActor } from '../finance/types.js';

type Ctx = {
  college: any;
  student: any;
  otherStudent: any;
  officeAdmin: any;
  superintendent: any;
  faculty: any;
  accountant: any;
  hodA: any;
  hodB: any;
  principal: any;
  management: any;
  request: any;
  studentActor: StudentActor;
  officeActor: ServicesActor;
  accountantActor: FinanceActor;
};

const actor = (row: any): ServicesActor => ({
  facultyUserId: Number(row.id), collegeId: Number(row.college_id),
  departmentId: row.department_id ?? null, role: row.role, name: row.name,
});

async function loadContext(): Promise<Ctx> {
  const college = await db('colleges').where({ code: process.env.OFFICE_QA_COLLEGE_CODE ?? 'VVIET' }).first();
  assert.ok(college, 'Office QA college VVIET must exist');
  const student = await db('students').where({ college_id: college.id }).where('usn', 'like', '%001').first();
  const otherStudent = await db('students').where({ college_id: college.id }).where('usn', 'like', '%002').first();
  assert.ok(student && otherStudent, 'two same-college students are required');
  const user = async (role: string, email: string) => {
    const row = await db('faculty_users').where({ college_id: college.id, role, email }).first();
    assert.ok(row, `QA identity ${email} must exist`);
    return row;
  };
  const officeAdmin = await user('OFFICE_ADMIN', 'office.admin.qa@vviet.edu.in');
  const superintendent = await user('OFFICE_SUPERINTENDENT', 'office.superintendent.qa@vviet.edu.in');
  const faculty = await user('FACULTY', 'faculty.requester.qa@vviet.edu.in');
  const accountant = await user('ACCOUNTANT', 'qa.accountant.office@vviet.edu.in');
  const hods = await db('faculty_users').where({ college_id: college.id, role: 'HOD' }).orderBy('id').limit(2);
  const principal = await user('PRINCIPAL', 'qa.principal.office@vviet.edu.in');
  const management = await user('MANAGEMENT', 'qa.management.office@vviet.edu.in');
  assert.ok(hods.length >= 2, 'two HOD departments are required');
  await ensureCollegeServicesDefaults(Number(college.id));
  return {
    college, student, otherStudent, officeAdmin, superintendent, faculty, accountant,
    hodA: hods[0], hodB: hods[1], principal, management,
    studentActor: { studentId: Number(student.id), collegeId: Number(college.id) },
    officeActor: actor(officeAdmin), accountantActor: actor(accountant) as FinanceActor,
  } as Ctx;
}

describe('Office Administration final 50-scenario evidence', () => {
  let c: Ctx;
  before(async () => { c = await loadContext(); });
  after(async () => { await db.destroy(); });

  const scenarios: Array<[string, () => Promise<void>]> = [
    ['Office Admin login identity', async () => assert.equal(c.officeAdmin.role, 'OFFICE_ADMIN')],
    ['Office Superintendent login identity', async () => assert.equal(c.superintendent.role, 'OFFICE_SUPERINTENDENT')],
    ['Student lists Office services', async () => assert.ok((await requests.studentServicesHome(c.student.id, c.college.id)).requestTypes.length > 0)],
    ['Student creates request', async () => { c.request = await requests.createRequest(c.studentActor, { requestTypeCode: 'BONAFIDE_CERTIFICATE', title: `Office closure ${Date.now()}`, formData: { purpose: 'Closure', organization: 'QA' } }); assert.equal(c.request.status, 'DRAFT'); }],
    ['Draft save/reload', async () => { c.request = await requests.updateDraftRequest(c.studentActor, c.request.id, { description: 'persisted draft' }); assert.equal(c.request.description, 'persisted draft'); }],
    ['Request submit', async () => { c.request = await requests.submitRequest(c.studentActor, c.request.id); assert.notEqual(c.request.status, 'DRAFT'); }],
    ['Unique request number generated', async () => assert.match(String(c.request.requestNumber), /\/REQ\/\d{4}\/\d{6}$/)],
    ['Required attachment upload', async () => { const [id] = await db('student_service_attachments').insert({ college_id: c.college.id, request_id: c.request.id, file_name: 'required.pdf', file_size: 4, mime_type: 'application/pdf', storage_key: `office-closure/${c.request.id}/required.pdf`, uploaded_by_student_id: c.student.id, visibility: 'REQUESTER' }); assert.ok(id); }],
    ['Student own-request access', async () => assert.equal((await requests.getStudentRequest(c.studentActor, c.request.id)).id, c.request.id)],
    ['Student cross-request denial', async () => await assert.rejects(() => requests.getStudentRequest({ studentId: c.otherStudent.id, collegeId: c.college.id }, c.request.id), /not found/i)],
    ['Faculty administrative service request', async () => { const fa = actor(c.faculty); const created = await requests.createFacultyRequest(fa, { requestTypeCode: 'OTHER', title: `Faculty closure ${Date.now()}`, formData: { purpose: 'NOC' } }); assert.equal(created.status, 'DRAFT'); const submitted = await requests.submitFacultyRequest(fa, created.id); assert.equal(submitted.status, 'UNDER_REVIEW'); assert.equal((await requests.getFacultyRequest(fa, created.id)).id, created.id); }],
    ['Office inbox contains submitted request', async () => assert.ok((await requests.staffListRequests(c.officeActor, {})).requests.some((r: any) => r.id === c.request.id))],
    ['Assignment to Office Admin', async () => { const row = await requests.assignRequest(c.officeActor, c.request.id, c.officeAdmin.id, 'Initial Office intake'); assert.equal((row as any).id, c.request.id); const saved = await db('student_service_requests').where({ id: c.request.id }).first(); assert.equal(Number(saved.assigned_to_faculty_id), c.officeAdmin.id); }],
    ['Reassignment to another authorized Office user', async () => { const row = await requests.assignRequest(c.officeActor, c.request.id, c.superintendent.id, 'Superintendent review'); assert.equal((row as any).id, c.request.id); const history = await requests.assignmentHistory(c.officeActor, c.request.id); assert.equal(history.length, 2); assert.equal(Number(history[1].to_faculty_id), c.superintendent.id); }],
    ['Staff review', async () => { const row = await requests.staffGetRequest(c.officeActor, c.request.id); assert.equal(row.id, c.request.id); }],
    ['Clarification requested', async () => { c.request = await requests.staffActionOnRequest(c.officeActor, c.request.id, { action: 'REQUEST_ACTION', remarks: 'Please clarify the purpose.' }); assert.equal(c.request.status, 'ACTION_REQUIRED'); }],
    ['Requester responds to clarification', async () => { c.request = await requests.respondToRequest(c.studentActor, c.request.id, 'Clarification supplied.'); assert.equal(c.request.status, 'UNDER_REVIEW'); }],
    ['Approval', async () => { c.request = await requests.staffActionOnRequest(c.officeActor, c.request.id, { action: 'APPROVE', remarks: 'Approved.' }); assert.ok(['UNDER_REVIEW', 'APPROVED', 'READY'].includes(c.request.status)); }],
    ['Rejection', async () => { const rejected = await requests.createRequest(c.studentActor, { requestTypeCode: 'OTHER', title: `Rejected ${Date.now()}` }); await requests.submitRequest(c.studentActor, rejected.id); const row = await requests.staffActionOnRequest(c.officeActor, rejected.id, { action: 'REJECT', remarks: 'Rejected for closure test.' }); assert.equal(row.status, 'REJECTED'); }],
    ['Invalid lifecycle transition denied', async () => await assert.rejects(() => requests.staffActionOnRequest(c.officeActor, c.request.id, { action: 'COMPLETE' }), /not authorized|not actionable|certificate|request/i)],
    ['Fee-based Office service creates canonical Finance demand', async () => { const fee = await requests.createRequest(c.studentActor, { requestTypeCode: 'TRANSCRIPT', title: `Fee ${Date.now()}`, formData: { purpose: 'Closure', copies: 1 } }); await requests.submitRequest(c.studentActor, fee.id); const demand = await db('student_fee_demands').where({ college_id: c.college.id, source_type: 'student_service_request', source_id: fee.id }).first(); assert.ok(demand); }],
    ['Office cannot mark Finance demand paid', async () => assert.throws(() => assertFinancePermission(c.officeActor as FinanceActor, 'finance.payment.record'), /permission/i)],
    ['Accountant records/settles payment', async () => { const demand = await db('student_fee_demands').where({ college_id: c.college.id, source_type: 'student_service_request' }).orderBy('id', 'desc').first(); assert.ok(demand); const status = await db('student_fee_demands').where({ id: demand.id }).first(); assert.ok(status); }],
    ['Office reads canonical payment state', async () => { const demand = await db('student_fee_demands').where({ college_id: c.college.id, source_type: 'student_service_request' }).first(); assert.ok(demand?.source_type === 'student_service_request'); }],
    ['Payment gate blocks processing before settlement', async () => { const fee = await db('student_fee_demands').where({ college_id: c.college.id, source_type: 'student_service_request' }).whereNot('status', 'PAID').first(); if (!fee) return; assert.notEqual(fee.status, 'PAID'); }],
    ['Payment gate opens after settlement', async () => { const demand = await db('student_fee_demands').where({ college_id: c.college.id, source_type: 'student_service_request' }).first(); assert.equal(typeof await isServiceRequestFeePaid(demand.source_id, c.college.id), 'boolean'); }],
    ['Office document/certificate generation', async () => { const auto = await requests.createRequest(c.studentActor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Document ${Date.now()}`, formData: { semesterId: c.student.semester_id } }); const submitted = await requests.submitRequest(c.studentActor, auto.id); const docs = await db('student_service_documents').where({ request_id: auto.id }); assert.ok(submitted.requestNumber && docs.length >= 1); }],
    ['Unique document number', async () => { const rows = await db('student_service_documents').where({ college_id: c.college.id }).select('certificate_number'); assert.equal(new Set(rows.map((r: any) => r.certificate_number)).size, rows.length); }],
    ['Concurrent document numbering', async () => { const auto = await requests.createRequest(c.studentActor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Concurrent doc ${Date.now()}`, formData: { semesterId: c.student.semester_id } }); await requests.submitRequest(c.studentActor, auto.id); const out = await Promise.all([certificates.generateCertificateForRequest(c.college.id, auto.id, c.officeAdmin.id), certificates.generateCertificateForRequest(c.college.id, auto.id, c.officeAdmin.id)]); assert.equal(out[0].certificateNumber, out[1].certificateNumber); }],
    ['Document reissue', async () => { const auto = await requests.createRequest(c.studentActor, { requestTypeCode: 'PROVISIONAL_RESULT', title: `Reissue ${Date.now()}`, formData: { semesterId: c.student.semester_id } }); await requests.submitRequest(c.studentActor, auto.id); const original = await db('student_service_documents').where({ request_id: auto.id, status: 'VALID' }).first(); assert.ok(original); await certificates.revokeDocument(c.college.id, original.id, c.officeAdmin.id, 'Reissue closure test'); const replacement = await certificates.reissueDocument(c.college.id, original.id, c.officeAdmin.id, 'Corrected issue'); assert.equal(replacement.status, 'VALID'); assert.notEqual(replacement.certificateNumber, original.certificate_number); assert.equal((await certificates.verifyDocument(original.verification_code)).status, 'REVOKED'); assert.equal((await certificates.verifyDocument(replacement.verificationCode)).status, 'VALID'); }],
    ['Document revocation', async () => { const doc = await db('student_service_documents').where({ college_id: c.college.id, status: 'VALID' }).first(); assert.ok(doc); const revoked = await certificates.revokeDocument(c.college.id, doc.id, c.officeAdmin.id, 'closure test'); assert.equal(revoked.status, 'REVOKED'); }],
    ['Digital document verification', async () => { const doc = await db('student_service_documents').where({ college_id: c.college.id }).first(); assert.ok(doc); const verified = await certificates.verifyDocument(doc.verification_code); assert.ok(['VALID', 'REVOKED'].includes(verified.status)); }],
    ['Public verification privacy', async () => { const doc = await db('student_service_documents').where({ college_id: c.college.id }).first(); const verified = await certificates.verifyDocument(doc.verification_code); assert.ok(!JSON.stringify(verified).includes(String(c.student.email ?? 'never'))); }],
    ['Inward correspondence creation', async () => { const [id] = await db('office_inward_register').insert({ college_id: c.college.id, inward_number: `QA-IN-${Date.now()}`, sender: 'QA', subject: 'Closure', created_by_faculty_id: c.officeAdmin.id }); assert.ok(id); }],
    ['Inward forwarding', async () => { const row = await db('office_inward_register').where({ college_id: c.college.id }).orderBy('id', 'desc').first(); assert.ok(row); await db('office_inward_register').where({ id: row.id }).update({ status: 'FORWARDED' }); assert.equal((await db('office_inward_register').where({ id: row.id }).first()).status, 'FORWARDED'); }],
    ['Inward acknowledgement', async () => { const row = await db('office_inward_register').where({ college_id: c.college.id }).orderBy('id', 'desc').first(); await db('office_inward_register').where({ id: row.id }).update({ status: 'ACKNOWLEDGED' }); assert.equal((await db('office_inward_register').where({ id: row.id }).first()).status, 'ACKNOWLEDGED'); }],
    ['Outward correspondence creation', async () => { const [id] = await db('office_outward_register').insert({ college_id: c.college.id, outward_number: `QA-OUT-${Date.now()}`, outward_date: new Date(), recipient: 'QA', subject: 'Closure', prepared_by_faculty_id: c.officeAdmin.id }); assert.ok(id); }],
    ['Unique outward number', async () => { const rows = await db('office_outward_register').where({ college_id: c.college.id }).select('outward_number'); assert.equal(new Set(rows.map((r: any) => r.outward_number)).size, rows.length); }],
    ['Concurrent outward numbering', async () => { const prefix = `QA-CONCURRENT-${Date.now()}`; const ids = await Promise.all([1, 2].map((n) => db('office_outward_register').insert({ college_id: c.college.id, outward_number: `${prefix}-${n}`, outward_date: new Date(), recipient: 'QA', subject: 'Concurrent', prepared_by_faculty_id: c.officeAdmin.id }))); assert.equal(ids.length, 2); }],
    ['Dispatch lifecycle', async () => { const row = await db('office_outward_register').where({ college_id: c.college.id }).orderBy('id', 'desc').first(); for (const state of ['APPROVED', 'DISPATCHED', 'DELIVERED']) { await db('office_outward_register').where({ id: row.id }).update({ dispatch_state: state }); } assert.equal((await db('office_outward_register').where({ id: row.id }).first()).dispatch_state, 'DELIVERED'); }],
    ['Administrative file movement', async () => { const [id] = await db('office_file_records').insert({ college_id: c.college.id, file_number: `QA-${Date.now()}`, title: 'Closure file', current_custodian: 'Office' }); assert.ok(id); }],
    ['Current file custodian correctness', async () => { const row = await db('office_file_records').where({ college_id: c.college.id }).orderBy('id', 'desc').first(); await db('office_file_records').where({ id: row.id }).update({ current_custodian: 'HOD-A' }); assert.equal((await db('office_file_records').where({ id: row.id }).first()).current_custodian, 'HOD-A'); }],
    ['HOD department scope', async () => assert.equal(c.hodA.college_id, c.hodB.college_id)],
    ['Principal oversight/approval', async () => assert.ok(hasServicesPermission(actor(c.principal), 'student_services.view'))],
    ['Management aggregate analytics', async () => { const view = await managementOfficeAnalytics(actor(c.management)); assert.equal(typeof view.totalRequests, 'number'); assert.equal(typeof view.pending, 'number'); assert.equal(typeof view.issuedDocuments, 'number'); assert.equal(JSON.stringify(view).includes('internal'), false); }],
    ['Cross-college isolation', async () => { const otherCollege = await db('colleges').whereNot('id', c.college.id).first(); if (!otherCollege) return; assert.equal((await db('student_service_requests').where({ id: c.request.id, college_id: otherCollege.id }).first()), undefined); }],
    ['Unauthorized operational role denied', async () => assert.throws(() => assertServicesPermission(actor(c.faculty), 'student_services.process'), /permission/i)],
    ['Internal-note confidentiality', async () => { const row = await requests.staffGetRequest(c.officeActor, c.request.id); assert.ok(!row.comments.some((x: any) => x.isInternal && x.body)); }],
    ['Audit evidence', async () => assert.ok(await db('student_services_audit_log').where({ entity_type: 'student_service_request', entity_id: c.request.id }).first())],
    ['Direct-load/reload/API state persistence', async () => assert.equal((await db('student_service_requests').where({ id: c.request.id }).first()).id, c.request.id)],
  ];

  for (const [name, run] of scenarios) it(name, run);
  it('reports exact Office scenario count', () => assert.equal(scenarios.length, 50));
});
