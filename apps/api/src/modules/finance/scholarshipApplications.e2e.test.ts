/**
 * Campus OS Phase 10 — Scholarship application lifecycle E2E invariants.
 * Skips when the shared E2E seed fixtures are absent.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { FinanceActor, StudentFinanceActor } from './types.js';
import * as apps from './scholarshipApplications.js';
import { AppError } from '../../utils/errors.js';

function financeActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): FinanceActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

async function ctx() {
  try {
    if (!(await db.schema.hasTable('scholarship_applications'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const admin = await db('faculty_users').where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' }).first();
    let accountant = await db('faculty_users').where({ college_id: cls.college_id, role: 'ACCOUNTANT' }).first();
    if (!accountant && admin) {
      const [id] = await db('faculty_users').insert({
        college_id: cls.college_id,
        department_id: null,
        name: 'Scholarship E2E Accountant',
        email: `scholarship.accountant.e2e.${cls.college_id}@skillonx.test`,
        password_hash: admin.password_hash,
        role: 'ACCOUNTANT',
        is_active: true,
        employee_id: `SCH-E2E-${cls.college_id}`,
      });
      accountant = await db('faculty_users').where({ id }).first();
    }
    const studentA = await db('students').where({ usn: '4VV24CS001' }).first();
    const studentB = await db('students').where({ usn: '4VV24CS002' }).first();

    const otherAdmin = await db('faculty_users').where({ college_id: 5, role: 'COLLEGE_ADMIN' }).first();
    let otherAccountant = await db('faculty_users').where({ college_id: 5, role: 'ACCOUNTANT' }).first();
    if (!otherAccountant && otherAdmin) {
      const [id] = await db('faculty_users').insert({
        college_id: 5,
        department_id: null,
        name: 'Cross-Tenant Accountant',
        email: `scholarship.accountant.e2e.tenantb@skillonx.test`,
        password_hash: otherAdmin.password_hash,
        role: 'ACCOUNTANT',
        is_active: true,
        employee_id: `SCH-E2E-TENANTB`,
      });
      otherAccountant = await db('faculty_users').where({ id }).first();
    }

    return { cls, admin, accountant, studentA, studentB, otherAccountant };
  } catch {
    return null;
  }
}

async function makeScheme(collegeId: number, opts: { allowMultiple?: boolean; treatment?: string } = {}) {
  const code = `E2E-SCH-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const [id] = await db('scholarship_schemes').insert({
    college_id: collegeId,
    code,
    name: `E2E Test Scheme ${code}`,
    provider_type: 'INSTITUTION',
    benefit_type: 'FEE_CONCESSION',
    is_active: true,
    allow_multiple_applications: !!opts.allowMultiple,
  });
  if (opts.treatment) {
    const existing = await db('college_finance_policies').where({ college_id: collegeId }).first();
    if (existing) {
      await db('college_finance_policies').where({ college_id: collegeId }).update({ scholarship_treatment: opts.treatment });
    } else {
      await db('college_finance_policies').insert({ college_id: collegeId, scholarship_treatment: opts.treatment });
    }
  }
  return Number(id);
}

describe('Campus OS Phase 10: scholarship application lifecycle', () => {
  let c: NonNullable<Awaited<ReturnType<typeof ctx>>> | null = null;

  before(async () => {
    c = await ctx();
  });

  it('runs the full DRAFT -> SUBMITTED -> UNDER_VERIFICATION -> VERIFIED -> APPROVED -> SANCTIONED/COMPLETED lifecycle with a real financial handoff', async (t) => {
    if (!c?.accountant || !c.studentA) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const staff = financeActor(c.accountant);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };

    const schemeId = await makeScheme(collegeId, { treatment: 'REDUCE_DEMAND' });

    const draft = await apps.createDraftApplication(student, { schemeId, academicYearId, requestedAmount: 1000 });
    assert.equal(draft.status, 'DRAFT');

    const submitted = await apps.submitApplication(student, draft.id);
    assert.equal(submitted.status, 'SUBMITTED');
    assert.equal(submitted.eligibilityStatus, 'ELIGIBLE'); // no policy configured => vacuously eligible

    await apps.startVerification(staff, draft.id);
    const verified = await apps.verifyApplication(staff, draft.id, 'Looks good');
    assert.equal(verified.status, 'VERIFIED');

    const approved = await apps.approveApplication(staff, draft.id);
    assert.equal(approved.status, 'APPROVED');

    const sanctioned = await apps.sanctionApplication(staff, draft.id, 500);
    // REDUCE_DEMAND policy => the handoff completes synchronously.
    assert.equal(sanctioned.status, 'COMPLETED');
    assert.ok(sanctioned.studentScholarshipId);

    const scholarship = await db('student_scholarships').where({ id: sanctioned.studentScholarshipId }).first();
    assert.equal(Number(scholarship.sanctioned_amount), 500);
    assert.equal(Number(scholarship.student_id), Number(c.studentA.id));
  });

  it('rejects a duplicate active application for a scheme that disallows multiple applications', async (t) => {
    if (!c?.studentA) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const schemeId = await makeScheme(collegeId, { allowMultiple: false });

    const first = await apps.createDraftApplication(student, { schemeId, academicYearId });
    await apps.submitApplication(student, first.id);

    const second = await apps.createDraftApplication(student, { schemeId, academicYearId });
    await assert.rejects(() => apps.submitApplication(student, second.id), (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.status, 409);
      return true;
    });
  });

  it('concurrent duplicate submissions: exactly one succeeds under real DB concurrency', async (t) => {
    if (!c?.studentA) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const schemeId = await makeScheme(collegeId, { allowMultiple: false });

    const d1 = await apps.createDraftApplication(student, { schemeId, academicYearId });
    const d2 = await apps.createDraftApplication(student, { schemeId, academicYearId });

    const results = await Promise.allSettled([
      apps.submitApplication(student, d1.id),
      apps.submitApplication(student, d2.id),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);

    const slots = await db('scholarship_application_slots').where({ college_id: collegeId, student_id: Number(c.studentA.id), scheme_id: schemeId, academic_year_id: academicYearId });
    assert.equal(slots.length, 1);
  });

  it('idempotent sanction: repeated/concurrent sanction calls create exactly one financial effect', async (t) => {
    if (!c?.accountant || !c.studentA) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const staff = financeActor(c.accountant);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const schemeId = await makeScheme(collegeId, { treatment: 'REDUCE_DEMAND' });

    const draft = await apps.createDraftApplication(student, { schemeId, academicYearId, requestedAmount: 300 });
    await apps.submitApplication(student, draft.id);
    await apps.startVerification(staff, draft.id);
    await apps.verifyApplication(staff, draft.id);
    await apps.approveApplication(staff, draft.id);

    const results = await Promise.allSettled([
      apps.sanctionApplication(staff, draft.id, 300),
      apps.sanctionApplication(staff, draft.id, 300),
    ]);
    assert.ok(results.every((r) => r.status === 'fulfilled'));

    const scholarshipRows = await db('student_scholarships').where({ application_id: draft.id });
    assert.equal(scholarshipRows.length, 1, 'sanction must never create more than one financial effect for the same application');

    // A third, sequential retry after both concurrent calls settled must also be a no-op.
    const third = await apps.sanctionApplication(staff, draft.id, 300);
    assert.equal(Number(third.studentScholarshipId), Number(scholarshipRows[0].id));
    const scholarshipRowsAfter = await db('student_scholarships').where({ application_id: draft.id });
    assert.equal(scholarshipRowsAfter.length, 1);
  });

  it('terminal-state protection: a REJECTED application cannot be verified, approved, or sanctioned', async (t) => {
    if (!c?.accountant || !c.studentA) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const staff = financeActor(c.accountant);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const schemeId = await makeScheme(collegeId);

    const draft = await apps.createDraftApplication(student, { schemeId, academicYearId });
    await apps.submitApplication(student, draft.id);
    await apps.startVerification(staff, draft.id);
    const rejected = await apps.rejectApplication(staff, draft.id, 'Does not meet criteria');
    assert.equal(rejected.status, 'REJECTED');

    await assert.rejects(() => apps.verifyApplication(staff, draft.id));
    await assert.rejects(() => apps.approveApplication(staff, draft.id));
    await assert.rejects(() => apps.sanctionApplication(staff, draft.id, 100));
    await assert.rejects(() => apps.withdrawApplication(student, draft.id));
  });

  it('student IDOR: student B cannot view or withdraw student A application', async (t) => {
    if (!c?.studentA || !c.studentB) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const studentAActor: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const studentBActor: StudentFinanceActor = { studentId: Number(c.studentB.id), collegeId };
    const schemeId = await makeScheme(collegeId);

    const draft = await apps.createDraftApplication(studentAActor, { schemeId, academicYearId });

    await assert.rejects(() => apps.getStudentApplication(studentBActor, draft.id), (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.status, 404);
      return true;
    });
    await assert.rejects(() => apps.withdrawApplication(studentBActor, draft.id));
    await assert.rejects(() => apps.submitApplication(studentBActor, draft.id));
  });

  it('tenant isolation: a staff actor from another college cannot view or act on this application', async (t) => {
    if (!c?.studentA || !c.otherAccountant) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const student: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const otherStaff = financeActor(c.otherAccountant);
    const schemeId = await makeScheme(collegeId);

    const draft = await apps.createDraftApplication(student, { schemeId, academicYearId });
    await apps.submitApplication(student, draft.id);

    await assert.rejects(() => apps.getApplicationForStaff(otherStaff, draft.id), (err: unknown) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.status, 404);
      return true;
    });
    await assert.rejects(() => apps.startVerification(otherStaff, draft.id));
    await assert.rejects(() => apps.approveApplication(otherStaff, draft.id));

    const otherCollegeQueue = await apps.listApplicationsForStaff(otherStaff);
    assert.ok(!otherCollegeQueue.some((a) => a.id === draft.id));
  });

  it('document evidence: student-uploaded documents are visible to staff and not to a different student', async (t) => {
    if (!c?.accountant || !c.studentA || !c.studentB) return t.skip('E2E seed fixtures not present');
    const collegeId = Number(c.cls.college_id);
    const academicYearId = Number(c.cls.academic_year_id);
    const staff = financeActor(c.accountant);
    const studentAActor: StudentFinanceActor = { studentId: Number(c.studentA.id), collegeId };
    const studentBActor: StudentFinanceActor = { studentId: Number(c.studentB.id), collegeId };
    const schemeId = await makeScheme(collegeId);

    const draft = await apps.createDraftApplication(studentAActor, { schemeId, academicYearId });
    const uploaded = await apps.uploadApplicationDocument(studentAActor, draft.id, {
      category: 'income_certificate',
      fileName: 'income.txt',
      mimeType: 'text/plain',
      contentBase64: Buffer.from('sample income certificate').toString('base64'),
    });
    assert.equal(uploaded.entityType, 'scholarship_application');

    const staffView = await apps.listApplicationDocumentsForStaff(staff, draft.id);
    assert.ok(staffView.some((d) => d.id === uploaded.id));

    // A different student's own application-scoped document listing must not see it.
    const otherDraft = await apps.createDraftApplication(studentBActor, { schemeId, academicYearId });
    const otherView = await apps.listApplicationDocuments(studentBActor, otherDraft.id);
    assert.ok(!otherView.some((d) => d.id === uploaded.id));
  });
});
