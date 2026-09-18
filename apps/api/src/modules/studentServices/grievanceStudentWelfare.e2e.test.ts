/**
 * Grievance & Student Welfare closure evidence.
 *
 * Self-seeds a dedicated QA college and verifies the canonical case engine:
 * tenant/requester isolation, restricted access, routing boundaries, lifecycle,
 * requester communication, internal-note confidentiality, appeal/reopen,
 * idempotent resolution, and concurrency-safe case numbering.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { db } from '../../db/index.js';
import * as g from './grievances.js';
import { authorizeGrievanceAttachment, readGrievanceAttachment } from './attachmentAccess.js';
import type { ServicesActor, StudentActor } from './types.js';

const HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq';
const COLLEGE_CODE = 'QA-GRV-E2E';
const OTHER_COLLEGE_CODE = 'QA-GRV-OTHER';

type Ctx = {
  collegeId: number;
  otherCollegeId: number;
  cseDeptId: number;
  eceDeptId: number;
  studentA: StudentActor;
  studentB: StudentActor;
  studentDeptB: StudentActor;
  crossCollegeStudent: StudentActor;
  grievanceOfficer: ServicesActor;
  welfareOfficer: ServicesActor;
  hodA: ServicesActor;
  hodB: ServicesActor;
  principal: ServicesActor;
  management: ServicesActor;
  accountant: ServicesActor;
  coe: ServicesActor;
  office: ServicesActor;
  maintenance: ServicesActor;
  librarian: ServicesActor;
  warden: ServicesActor;
  transport: ServicesActor;
  tp: ServicesActor;
  hr: ServicesActor;
  superAdmin: ServicesActor;
  faculty: ServicesActor;
  mentor: ServicesActor;
};

async function ensureCollege(code: string, name: string) {
  let row = await db('colleges').where({ code }).first();
  if (!row) {
    const [id] = await db('colleges').insert({ code, name, domain: `${code.toLowerCase()}.test` });
    row = await db('colleges').where({ id }).first();
  }
  return row;
}

async function ensureDept(collegeId: number, code: string, name: string) {
  let row = await db('departments').where({ college_id: collegeId, code }).first();
  if (!row) {
    const [id] = await db('departments').insert({ college_id: collegeId, code, name });
    row = await db('departments').where({ id }).first();
  }
  return row;
}

async function ensureStudent(collegeId: number, departmentId: number, usn: string, name: string) {
  let row = await db('students').where({ college_id: collegeId, usn }).first();
  if (!row) {
    const [id] = await db('students').insert({
      college_id: collegeId,
      department_id: departmentId,
      usn,
      name,
      email: `${usn.toLowerCase()}@grv.test`,
      semester: '5',
      section: 'A',
    });
    row = await db('students').where({ id }).first();
  } else {
    await db('students').where({ id: row.id }).update({ department_id: departmentId });
    row = await db('students').where({ id: row.id }).first();
  }
  return row;
}

async function ensureFaculty(collegeId: number, departmentId: number | null, role: string, key: string, name: string) {
  const email = `${key}@grv.test`;
  let row = await db('faculty_users').where({ college_id: collegeId, email }).first();
  if (!row) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      department_id: departmentId,
      role,
      name,
      email,
      password_hash: HASH,
      is_active: true,
    });
    row = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: row.id }).update({ department_id: departmentId, role, name, is_active: true });
    row = await db('faculty_users').where({ id: row.id }).first();
  }
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    role: String(row.role),
    name: String(row.name),
  } satisfies ServicesActor;
}

let cached: Ctx | null = null;
async function ctx(): Promise<Ctx> {
  if (cached) return cached;
  const college = await ensureCollege(COLLEGE_CODE, 'QA Grievance College');
  const otherCollege = await ensureCollege(OTHER_COLLEGE_CODE, 'QA Grievance Other College');
  const cse = await ensureDept(Number(college.id), 'CSE', 'Computer Science');
  const ece = await ensureDept(Number(college.id), 'ECE', 'Electronics');
  const otherDept = await ensureDept(Number(otherCollege.id), 'CSE', 'Other CSE');
  const a = await ensureStudent(Number(college.id), Number(cse.id), 'GRV24CS001', 'Case Student A');
  const b = await ensureStudent(Number(college.id), Number(cse.id), 'GRV24CS002', 'Case Student B');
  const deptB = await ensureStudent(Number(college.id), Number(ece.id), 'GRV24EC001', 'Case Student Dept B');
  const other = await ensureStudent(Number(otherCollege.id), Number(otherDept.id), 'GRV24OC001', 'Other College Student');

  cached = {
    collegeId: Number(college.id),
    otherCollegeId: Number(otherCollege.id),
    cseDeptId: Number(cse.id),
    eceDeptId: Number(ece.id),
    studentA: { studentId: Number(a.id), collegeId: Number(college.id) },
    studentB: { studentId: Number(b.id), collegeId: Number(college.id) },
    studentDeptB: { studentId: Number(deptB.id), collegeId: Number(college.id) },
    crossCollegeStudent: { studentId: Number(other.id), collegeId: Number(otherCollege.id) },
    grievanceOfficer: await ensureFaculty(Number(college.id), null, 'GRIEVANCE_OFFICER', 'grievance.officer', 'Grievance Officer'),
    welfareOfficer: await ensureFaculty(Number(college.id), null, 'STUDENT_WELFARE_OFFICER', 'welfare.officer', 'Welfare Officer'),
    hodA: await ensureFaculty(Number(college.id), Number(cse.id), 'HOD', 'hod.cse', 'HOD CSE'),
    hodB: await ensureFaculty(Number(college.id), Number(ece.id), 'HOD', 'hod.ece', 'HOD ECE'),
    principal: await ensureFaculty(Number(college.id), null, 'PRINCIPAL', 'principal', 'Principal'),
    management: await ensureFaculty(Number(college.id), null, 'MANAGEMENT', 'management', 'Management'),
    accountant: await ensureFaculty(Number(college.id), null, 'ACCOUNTANT', 'accountant', 'Accountant'),
    coe: await ensureFaculty(Number(college.id), null, 'COE', 'coe', 'COE'),
    office: await ensureFaculty(Number(college.id), null, 'OFFICE_ADMIN', 'office', 'Office Admin'),
    maintenance: await ensureFaculty(Number(college.id), null, 'MAINTENANCE_MANAGER', 'maintenance', 'Maintenance'),
    librarian: await ensureFaculty(Number(college.id), null, 'LIBRARIAN', 'librarian', 'Librarian'),
    warden: await ensureFaculty(Number(college.id), null, 'WARDEN', 'warden', 'Warden'),
    transport: await ensureFaculty(Number(college.id), null, 'TRANSPORT_MANAGER', 'transport', 'Transport'),
    tp: await ensureFaculty(Number(college.id), null, 'TP_OFFICER', 'tp', 'T&P'),
    hr: await ensureFaculty(Number(college.id), null, 'HR_MANAGER', 'hr', 'HR'),
    superAdmin: await ensureFaculty(Number(college.id), null, 'SUPER_ADMIN', 'superadmin', 'Super Admin'),
    faculty: await ensureFaculty(Number(college.id), Number(cse.id), 'FACULTY', 'faculty', 'Faculty'),
    mentor: await ensureFaculty(Number(college.id), Number(cse.id), 'FACULTY', 'mentor', 'Mentor'),
  };
  return cached;
}

async function makeCase(category = 'GENERAL_GRIEVANCE', input: Partial<Parameters<typeof g.createGrievance>[1]> = {}) {
  const c = await ctx();
  return g.createGrievance(c.studentA, {
    category,
    subject: `${category} case ${Date.now()} ${Math.random()}`,
    description: `Description for ${category}`,
    ...input,
  });
}

function grievanceUploadRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/student-services/grievances');
}

async function attachCase(
  grievanceId: number,
  collegeId: number,
  input: { fileName?: string; body?: string; visibility?: string; storageKey?: string; uploadedByStudentId?: number | null; uploadedByFacultyId?: number | null; skipWrite?: boolean } = {},
) {
  const storageKey = input.storageKey ?? `qa-${grievanceId}-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`;
  const body = input.body ?? `Attachment body for ${grievanceId}`;
  if (!input.skipWrite && !storageKey.includes('..')) {
    await mkdir(grievanceUploadRoot(), { recursive: true });
    await writeFile(path.join(grievanceUploadRoot(), storageKey), body);
  }
  const [id] = await db('student_grievance_attachments').insert({
    college_id: collegeId,
    grievance_id: grievanceId,
    file_name: input.fileName ?? 'evidence.txt',
    mime_type: 'text/plain',
    file_size: Buffer.byteLength(body),
    storage_key: storageKey,
    visibility: input.visibility ?? 'CASE',
    uploaded_by_student_id: input.uploadedByStudentId ?? null,
    uploaded_by_faculty_id: input.uploadedByFacultyId ?? null,
  });
  return { id: Number(id), body, storageKey };
}

describe('Grievance & Student Welfare closure', () => {
  it('1. student lists canonical categories', async () => {
    const c = await ctx();
    const cats = await g.listCategories(c.collegeId);
    assert.ok(cats.some((x) => x.code === 'STUDENT_WELFARE'));
    assert.ok(cats.some((x) => x.code === 'ANTI_RAGGING'));
  });

  it('2. student submits a normal case with a tenant-scoped case number', async () => {
    const created = await makeCase('GENERAL_GRIEVANCE');
    assert.match(String(created.caseNumber), /QAGRVE2E\/GRV\/\d{4}-\d{2}\/\d{6}/);
    assert.equal(created.status, 'SUBMITTED');
  });

  it('3. requester sees own case but not another student case', async () => {
    const c = await ctx();
    const created = await makeCase('ACADEMIC');
    assert.equal((await g.getStudentGrievance(c.studentA, created.id)).id, created.id);
    await assert.rejects(() => g.getStudentGrievance(c.studentB, created.id), /not found/i);
  });

  it('4. cross-college requester cannot read another college case', async () => {
    const c = await ctx();
    const created = await makeCase('ACADEMIC');
    await assert.rejects(() => g.getStudentGrievance(c.crossCollegeStudent, created.id), /not found/i);
  });

  it('5. HOD scope permits own department academic cases', async () => {
    const c = await ctx();
    const created = await makeCase('ACADEMIC');
    const row = await g.staffGetGrievance(c.hodA, created.id);
    assert.equal(row.id, created.id);
  });

  it('6. HOD department isolation denies other department cases', async () => {
    const c = await ctx();
    const created = await g.createGrievance(c.studentDeptB, { category: 'ACADEMIC', subject: 'ECE academic', description: 'Dept B' });
    await assert.rejects(() => g.staffGetGrievance(c.hodA, created.id), /access denied/i);
  });

  it('7. restricted welfare case routes to welfare and denies HOD', async () => {
    const c = await ctx();
    const created = await makeCase('SAFETY_CONCERN', { confidentiality: 'RESTRICTED' });
    assert.equal(created.confidentiality, 'RESTRICTED');
    assert.equal(created.assignedRole, 'STUDENT_WELFARE_OFFICER');
    assert.equal((await g.staffGetGrievance(c.welfareOfficer, created.id)).id, created.id);
    await assert.rejects(() => g.staffGetGrievance(c.hodA, created.id), /access denied/i);
  });

  it('8. management receives only de-identified aggregate analytics', async () => {
    const c = await ctx();
    await makeCase('FINANCE');
    const analytics = await g.managementAnalytics(c.management);
    assert.equal(analytics.deidentified, true);
    assert.equal(Object.prototype.hasOwnProperty.call(analytics, 'description'), false);
    assert.ok(analytics.total >= 1);
  });

  it('9. management raw-case access is denied', async () => {
    const c = await ctx();
    const created = await makeCase('FINANCE');
    await assert.rejects(() => g.staffGetGrievance(c.management, created.id), /access denied/i);
  });

  it('10. unauthorized ERP roles cannot browse raw grievance cases', async () => {
    const c = await ctx();
    const created = await makeCase('FINANCE');
    const denied = [c.accountant, c.coe, c.office, c.maintenance, c.librarian, c.warden, c.transport, c.tp, c.hr, c.faculty];
    for (const actor of denied) {
      await assert.rejects(() => g.staffGetGrievance(actor, created.id), /access denied/i);
    }
  });

  it('11. super admin is configuration-only, not default case handler', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await assert.rejects(() => g.staffGetGrievance(c.superAdmin, created.id), /access denied/i);
  });

  it('12. triage records classification and official priority', async () => {
    const c = await ctx();
    const created = await makeCase('OTHER', { priority: 'URGENT', studentUrgencyReason: 'Student stated urgency' });
    const triaged = await g.triageGrievance(c.grievanceOfficer, created.id, { category: 'ACADEMIC', priority: 'NORMAL', confidentiality: 'NORMAL', reason: 'Academic authority needed' });
    assert.equal(triaged.status, 'TRIAGED');
    assert.equal(triaged.category, 'ACADEMIC');
    assert.equal(triaged.priority, 'NORMAL');
  });

  it('13. assignment and reassignment preserve assignment history', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.assignGrievance(c.grievanceOfficer, created.id, c.grievanceOfficer.facultyUserId, 'Initial owner');
    const reassigned = await g.assignGrievance(c.grievanceOfficer, created.id, c.principal.facultyUserId, 'Escalate');
    assert.equal(reassigned.assignedToFacultyId, c.principal.facultyUserId);
    assert.ok(reassigned.assignments.length >= 2);
  });

  it('14. clarification request and student response use requester-visible messages', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const asked = await g.requestClarification(c.grievanceOfficer, created.id, 'Please share dates.');
    assert.equal(asked.status, 'PENDING_INFORMATION');
    const replied = await g.studentRespond(c.studentA, created.id, 'It happened yesterday.');
    assert.equal(replied.status, 'UNDER_REVIEW');
    assert.ok(replied.messages.some((m) => m.body.includes('yesterday')));
  });

  it('15. internal notes never appear in the student payload', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const staff = await g.addInternalNote(c.grievanceOfficer, created.id, 'Internal assessment only', 'TEAM');
    assert.ok(staff.internalNotes.some((n) => n.body.includes('Internal assessment')));
    const student = await g.getStudentGrievance(c.studentA, created.id);
    assert.equal(Object.prototype.hasOwnProperty.call(student, 'internalNotes'), false);
    assert.equal(JSON.stringify(student).includes('Internal assessment only'), false);
  });

  it('16. restricted internal notes are hidden from non-eligible HODs', async () => {
    const c = await ctx();
    const created = await makeCase('HARASSMENT', { confidentiality: 'RESTRICTED' });
    await g.addInternalNote(c.grievanceOfficer, created.id, 'Restricted committee note', 'RESTRICTED');
    await assert.rejects(() => g.staffGetGrievance(c.hodA, created.id), /access denied/i);
  });

  it('17. maintenance referral stores only safe reference, not duplicate maintenance workflow', async () => {
    const c = await ctx();
    const created = await makeCase('FACILITIES');
    const referred = await g.createReferral(c.grievanceOfficer, created.id, {
      targetModule: 'MAINTENANCE',
      targetEntityType: 'service_ticket',
      targetEntityId: 'SR-TEST-1',
      safeReference: 'SR-TEST-1',
      safeSummary: 'Operational issue routed to maintenance.',
    });
    assert.equal(referred.status, 'REFERRED');
    assert.equal(referred.linkedReference, 'SR-TEST-1');
    await assert.rejects(() => g.staffGetGrievance(c.maintenance, created.id), /access denied/i);
  });

  it('18. finance grievance cannot grant Accountant raw narrative access', async () => {
    const c = await ctx();
    const created = await makeCase('FINANCE', { sourceModule: 'FINANCE', sourceEntityType: 'fee_demand', sourceEntityId: '10' });
    await assert.rejects(() => g.staffGetGrievance(c.accountant, created.id), /access denied/i);
  });

  it('19. examination grievance cannot grant COE raw narrative access', async () => {
    const c = await ctx();
    const created = await makeCase('EXAMINATION', { sourceModule: 'COE', sourceEntityType: 'revaluation', sourceEntityId: '20' });
    await assert.rejects(() => g.staffGetGrievance(c.coe, created.id), /access denied/i);
  });

  it('20. mentoring referral does not expose confidential welfare details to mentor', async () => {
    const c = await ctx();
    const created = await makeCase('MENTORING_REFERRAL', { confidentiality: 'CONFIDENTIAL' });
    await assert.rejects(() => g.staffGetGrievance(c.mentor, created.id), /access denied/i);
  });

  it('21. valid lifecycle transition resolves case', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.assignGrievance(c.grievanceOfficer, created.id, c.grievanceOfficer.facultyUserId);
    const resolved = await g.resolveGrievance(c.grievanceOfficer, created.id, 'Safe public resolution', 'Internal handling detail');
    assert.equal(resolved.status, 'RESOLVED');
    assert.equal(resolved.resolutionSummary, 'Safe public resolution');
  });

  it('22. resolution is idempotent under retry', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await Promise.all([
      g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolved once'),
      g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolved once'),
    ]);
    const resolutions = await db('student_grievance_resolutions').where({ grievance_id: created.id });
    assert.equal(resolutions.length, 1);
  });

  it('23. student feedback can mark resolution unresolved without closing', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolution posted');
    const feedback = await g.studentFeedback(c.studentA, created.id, { feedback: 'UNRESOLVED', reason: 'Still happening' });
    assert.equal(feedback.status, 'RESOLVED');
    assert.equal(feedback.studentAcknowledged, false);
  });

  it('24. student can acknowledge and close a resolved case', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolution posted');
    const closed = await g.acknowledgeGrievance(c.studentA, created.id);
    assert.equal(closed.status, 'CLOSED');
    assert.equal(closed.studentAcknowledged, true);
  });

  it('25. reopen preserves history and increments counter', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolution posted');
    const reopened = await g.reopenCase(c.studentA, created.id, 'New information');
    assert.equal(reopened.status, 'REOPENED');
    assert.ok(reopened.reopenCount >= 1);
    assert.ok(reopened.timeline.some((e) => e.to === 'REOPENED'));
  });

  it('26. appeal preserves original history and routes upward', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.resolveGrievance(c.grievanceOfficer, created.id, 'Resolution posted');
    const appealed = await g.appealCase(c.studentA, created.id, 'Need higher review');
    assert.equal(appealed.status, 'REOPENED');
    assert.ok(appealed.appeals.some((a) => a.reason.includes('higher')));
  });

  it('27. principal oversight can see non-restricted escalated case', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.escalateGrievance(c.grievanceOfficer, created.id, 'PRINCIPAL', 'SLA risk');
    const principal = await g.staffGetGrievance(c.principal, created.id);
    assert.equal(principal.id, created.id);
  });

  it('28. principal does not automatically defeat restricted raw access', async () => {
    const c = await ctx();
    const created = await makeCase('ANTI_RAGGING', { confidentiality: 'RESTRICTED' });
    const principal = await g.staffGetGrievance(c.principal, created.id);
    assert.equal(principal.subject, 'Restricted case');
    assert.equal(Object.prototype.hasOwnProperty.call(principal, 'description'), true);
    assert.equal(principal.description, undefined);
  });

  it('29. anonymous reporting is deferred safely and not falsely advertised', async () => {
    const c = await ctx();
    await assert.rejects(
      () => g.createGrievance(c.studentA, { category: 'GENERAL_GRIEVANCE', subject: 'Anonymous', description: 'Do not fake identity', anonymous: true }),
      /anonymous reporting is not enabled/i,
    );
  });

  it('30. case numbering is concurrency-safe', async () => {
    const c = await ctx();
    const [a, b] = await Promise.all([
      g.createGrievance(c.studentA, { category: 'GENERAL_GRIEVANCE', subject: `Parallel A ${Date.now()}`, description: 'A' }),
      g.createGrievance(c.studentA, { category: 'GENERAL_GRIEVANCE', subject: `Parallel B ${Date.now()}`, description: 'B' }),
    ]);
    assert.notEqual(a.caseNumber, b.caseNumber);
  });

  it('31. assignment concurrency preserves final owner and history', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await Promise.all([
      g.assignGrievance(c.grievanceOfficer, created.id, c.grievanceOfficer.facultyUserId, 'A'),
      g.assignGrievance(c.grievanceOfficer, created.id, c.principal.facultyUserId, 'B'),
    ]);
    const row = await g.staffGetGrievance(c.grievanceOfficer, created.id);
    assert.ok([c.grievanceOfficer.facultyUserId, c.principal.facultyUserId].includes(Number(row.assignedToFacultyId)));
    assert.ok(row.assignments.length >= 2);
  });

  it('32. search respects restricted-case authorization', async () => {
    const c = await ctx();
    const created = await makeCase('HARASSMENT', { subject: `Restricted Unique ${Date.now()}`, confidentiality: 'RESTRICTED' });
    const hodRows = await g.staffListGrievances(c.hodA, { search: String(created.caseNumber) });
    assert.equal(hodRows.some((r) => r.id === created.id), false);
    const officerRows = await g.staffListGrievances(c.grievanceOfficer, { search: String(created.caseNumber) });
    assert.equal(officerRows.some((r) => r.id === created.id), true);
  });

  it('33. dashboard separates restricted counts from general queues', async () => {
    const c = await ctx();
    await makeCase('SAFETY_CONCERN', { confidentiality: 'RESTRICTED' });
    const dash = await g.dashboard(c.welfareOfficer);
    assert.ok(dash.health.restricted >= 1);
  });

  it('34. SLA fields are populated for submitted cases', async () => {
    const created = await makeCase('GENERAL_GRIEVANCE');
    assert.ok(created.responseSlaHours);
    assert.ok(created.resolutionSlaHours);
    assert.ok(created.dueAt);
  });

  it('35. notifications avoid confidential narrative in stored message body', async () => {
    const c = await ctx();
    const created = await makeCase('HARASSMENT', { description: 'Very sensitive narrative', confidentiality: 'RESTRICTED' });
    if (!(await db.schema.hasTable('student_notifications'))) return;
    const rows = await db('student_notifications').where({ related_type: 'grievance', related_id: String(created.id) });
    assert.equal(rows.some((r) => String(r.body ?? '').includes('Very sensitive narrative')), false);
  });

  it('36. audit records privileged mutation evidence', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.triageGrievance(c.grievanceOfficer, created.id, { priority: 'HIGH', reason: 'Audit test' });
    const rows = await db('student_services_audit_log').where({ entity_type: 'student_grievance', entity_id: created.id });
    assert.ok(rows.some((r) => r.action === 'GRIEVANCE_STATUS_CHANGED'));
  });

  it('37. requester-visible timeline excludes internal note text', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    await g.addInternalNote(c.grievanceOfficer, created.id, 'Timeline secret text', 'TEAM');
    const student = await g.getStudentGrievance(c.studentA, created.id);
    assert.equal(JSON.stringify(student.timeline).includes('Timeline secret text'), false);
  });

  it('38. hostel, transport, library, lab and placement categories route as references only', async () => {
    const c = await ctx();
    for (const category of ['HOSTEL', 'TRANSPORT', 'LIBRARY', 'LAB', 'PLACEMENT']) {
      const created = await makeCase(category, { sourceModule: category, sourceEntityType: 'external_ref', sourceEntityId: `${category}-1` });
      assert.equal(created.sourceModule, category);
      assert.equal((await g.staffGetGrievance(c.grievanceOfficer, created.id)).id, created.id);
    }
  });

  it('39. requester can download own grievance attachment', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { uploadedByStudentId: c.studentA.studentId, body: 'student evidence' });
    const result = await readGrievanceAttachment({ role: 'STUDENT', collegeId: c.collegeId, studentId: c.studentA.studentId }, attachment.id);
    assert.equal(result.body.toString(), 'student evidence');
  });

  it('40. another same-college student cannot download the attachment', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { uploadedByStudentId: c.studentA.studentId });
    await assert.rejects(() => authorizeGrievanceAttachment({ role: 'STUDENT', collegeId: c.collegeId, studentId: c.studentB.studentId }, attachment.id), /access denied/i);
  });

  it('41. cross-college student receives no attachment record', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: 'STUDENT', collegeId: c.otherCollegeId, studentId: c.crossCollegeStudent.studentId }, attachment.id), /not found/i);
  });

  it('42. grievance officer can download normal case attachment', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { uploadedByFacultyId: c.grievanceOfficer.facultyUserId, body: 'officer evidence' });
    const result = await readGrievanceAttachment({ role: c.grievanceOfficer.role, collegeId: c.collegeId, facultyUserId: c.grievanceOfficer.facultyUserId }, attachment.id);
    assert.equal(result.body.toString(), 'officer evidence');
  });

  it('43. unrelated finance role cannot read finance-category grievance attachment', async () => {
    const c = await ctx();
    const created = await makeCase('FINANCE');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.accountant.role, collegeId: c.collegeId, facultyUserId: c.accountant.facultyUserId }, attachment.id), /access denied/i);
  });

  it('44. HOD can read own-department academic grievance attachment', async () => {
    const c = await ctx();
    const created = await makeCase('ACADEMIC');
    const attachment = await attachCase(created.id, c.collegeId);
    const authorized = await authorizeGrievanceAttachment({ role: c.hodA.role, collegeId: c.collegeId, facultyUserId: c.hodA.facultyUserId, departmentId: c.hodA.departmentId }, attachment.id);
    assert.equal(Number(authorized.id), attachment.id);
  });

  it('45. HOD cannot read restricted grievance attachment', async () => {
    const c = await ctx();
    const created = await makeCase('HARASSMENT', { confidentiality: 'RESTRICTED' });
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.hodA.role, collegeId: c.collegeId, facultyUserId: c.hodA.facultyUserId }, attachment.id), /access denied/i);
  });

  it('46. welfare officer can read restricted welfare attachment', async () => {
    const c = await ctx();
    const created = await makeCase('SAFETY_CONCERN', { confidentiality: 'RESTRICTED' });
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    const authorized = await authorizeGrievanceAttachment({ role: c.welfareOfficer.role, collegeId: c.collegeId, facultyUserId: c.welfareOfficer.facultyUserId }, attachment.id);
    assert.equal(Number(authorized.id), attachment.id);
  });

  it('47. principal oversight does not grant restricted attachment download', async () => {
    const c = await ctx();
    const created = await makeCase('ANTI_RAGGING', { confidentiality: 'RESTRICTED' });
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.principal.role, collegeId: c.collegeId, facultyUserId: c.principal.facultyUserId }, attachment.id), /access denied/i);
  });

  it('48. grievance attachment storage keys cannot escape the grievance upload root', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { storageKey: '../escape.txt' });
    await assert.rejects(() => readGrievanceAttachment({ role: 'STUDENT', collegeId: c.collegeId, studentId: c.studentA.studentId }, attachment.id), /not found/i);
  });

  it('49. student case payload includes attachment metadata but never file body', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { body: 'private file body' });
    const student = await g.getStudentGrievance(c.studentA, created.id);
    assert.ok(student.attachments.some((a) => a.id === attachment.id && a.fileName === 'evidence.txt'));
    assert.equal(JSON.stringify(student).includes('private file body'), false);
  });

  it('50. raw-eligible officer sees restricted attachment metadata on restricted case', async () => {
    const c = await ctx();
    const created = await makeCase('HARASSMENT', { confidentiality: 'RESTRICTED' });
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    const staff = await g.staffGetGrievance(c.grievanceOfficer, created.id);
    assert.ok(staff.attachments.some((a) => a.id === attachment.id && a.visibility === 'RESTRICTED'));
  });

  it('51. redacted principal restricted view hides restricted attachment metadata', async () => {
    const c = await ctx();
    const created = await makeCase('ANTI_RAGGING', { confidentiality: 'RESTRICTED' });
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    const principal = await g.staffGetGrievance(c.principal, created.id);
    assert.equal(principal.attachments.some((a) => a.id === attachment.id), false);
  });

  it('52. super admin configuration role cannot download grievance attachments', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.superAdmin.role, collegeId: c.collegeId, facultyUserId: c.superAdmin.facultyUserId }, attachment.id), /access denied/i);
  });

  it('53. management cannot download raw grievance attachments', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.management.role, collegeId: c.collegeId, facultyUserId: c.management.facultyUserId }, attachment.id), /access denied/i);
  });

  it('54. office role cannot download administrative grievance attachments', async () => {
    const c = await ctx();
    const created = await makeCase('ADMINISTRATIVE');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.office.role, collegeId: c.collegeId, facultyUserId: c.office.facultyUserId }, attachment.id), /access denied/i);
  });

  it('55. COE role cannot download examination grievance attachments', async () => {
    const c = await ctx();
    const created = await makeCase('EXAMINATION');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.coe.role, collegeId: c.collegeId, facultyUserId: c.coe.facultyUserId }, attachment.id), /access denied/i);
  });

  it('56. transport role cannot download transport grievance attachments', async () => {
    const c = await ctx();
    const created = await makeCase('TRANSPORT');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.transport.role, collegeId: c.collegeId, facultyUserId: c.transport.facultyUserId }, attachment.id), /access denied/i);
  });

  it('57. assigned faculty cannot bypass restricted-case attachment controls', async () => {
    const c = await ctx();
    const created = await makeCase('SAFETY_CONCERN', { confidentiality: 'RESTRICTED' });
    await g.assignGrievance(c.welfareOfficer, created.id, c.faculty.facultyUserId, 'Consult only');
    const attachment = await attachCase(created.id, c.collegeId, { visibility: 'RESTRICTED' });
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.faculty.role, collegeId: c.collegeId, facultyUserId: c.faculty.facultyUserId }, attachment.id), /access denied/i);
  });

  it('58. college admin can download normal attachments but not restricted-case attachments', async () => {
    const c = await ctx();
    const admin = await ensureFaculty(c.collegeId, null, 'COLLEGE_ADMIN', 'college.admin', 'College Admin');
    const normal = await makeCase('GENERAL_GRIEVANCE');
    const normalAttachment = await attachCase(normal.id, c.collegeId);
    assert.equal(Number((await authorizeGrievanceAttachment({ role: admin.role, collegeId: c.collegeId, facultyUserId: admin.facultyUserId }, normalAttachment.id)).id), normalAttachment.id);
    const restricted = await makeCase('HARASSMENT', { confidentiality: 'RESTRICTED' });
    const restrictedAttachment = await attachCase(restricted.id, c.collegeId, { visibility: 'RESTRICTED' });
    await assert.rejects(() => authorizeGrievanceAttachment({ role: admin.role, collegeId: c.collegeId, facultyUserId: admin.facultyUserId }, restrictedAttachment.id), /access denied/i);
  });

  it('59. welfare officer cannot browse unrelated normal academic attachment', async () => {
    const c = await ctx();
    const created = await makeCase('ACADEMIC');
    const attachment = await attachCase(created.id, c.collegeId);
    await assert.rejects(() => authorizeGrievanceAttachment({ role: c.welfareOfficer.role, collegeId: c.collegeId, facultyUserId: c.welfareOfficer.facultyUserId }, attachment.id), /access denied/i);
  });

  it('60. authorized metadata does not mask a missing attachment file', async () => {
    const c = await ctx();
    const created = await makeCase('GENERAL_GRIEVANCE');
    const attachment = await attachCase(created.id, c.collegeId, { storageKey: `missing-${Date.now()}.txt`, skipWrite: true });
    await assert.rejects(() => readGrievanceAttachment({ role: 'STUDENT', collegeId: c.collegeId, studentId: c.studentA.studentId }, attachment.id), /file not found/i);
  });
});
