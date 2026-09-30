/**
 * Guardian/Parent-portal provisioning on admission confirmation.
 *
 * Exercises the gap closed on top of the frozen Admissions module:
 * confirmAdmission() now best-effort provisions a parent_users account
 * and a parent_student_links row from admission_applicants.guardian_json,
 * and staff can capture guardian data via PATCH /applications/:id/guardian.
 *
 * Relies on the same seeded fixtures as admissions.closure.e2e.test.ts
 * (QA Admissions Cycle 2026 / SX-E2E-CSE-3A) — tests no-op (return early)
 * when that seed data is not present in the target database.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { AdmissionActor } from './types.js';
import {
  confirmAdmission,
  createAdmissionFeeDemand,
  createApplicant,
  evaluateEligibility,
  issueOffer,
  selectApplicant,
  submitApplication,
  updateApplicantGuardian,
  uploadDocument,
  verifyDocument,
} from './service.js';
import { recordManualPayment } from '../finance/payments.js';
import type { FinanceActor } from '../finance/types.js';

const PASSWORD = 'Password123';
const PASSWORD_HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq';
const run = `${Date.now()}`;

type Ctx = {
  collegeId: number;
  otherCollegeId: number | null;
  cycleId: number;
  academicYearId: number;
  programId: number;
  departmentId: number | null;
  semesterId: number;
  schemeId: number | null;
  classSectionId: number | null;
  requirementId: number;
  feeHeadId: number;
  manager: AdmissionActor;
  faculty: AdmissionActor;
  accountant: FinanceActor;
};

let ctx: Ctx | null = null;

function admissionActor(row: Record<string, unknown>, role?: string): AdmissionActor {
  return {
    kind: 'FACULTY',
    collegeId: Number(row.college_id),
    facultyUserId: Number(row.id),
    role: String(role ?? row.role),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    name: String(row.name),
  };
}

function financeActor(row: Record<string, unknown>): FinanceActor {
  return {
    collegeId: Number(row.college_id),
    facultyUserId: Number(row.id),
    role: String(row.role),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    name: String(row.name),
  };
}

async function ensureFaculty(collegeId: number, departmentId: number | null, role: string, tag = '') {
  const email = `qa.guardian.${role.toLowerCase().replaceAll('_', '.')}${tag}@example.edu`;
  let row = await db('faculty_users').where({ college_id: collegeId, email }).first();
  if (!row) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      department_id: departmentId,
      email,
      name: `QA Guardian ${role}`,
      role,
      password_hash: PASSWORD_HASH,
      is_active: true,
      employee_id: `QA-GRD-${role}${tag}`.slice(0, 32),
    });
    row = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: row.id }).update({
      role,
      department_id: departmentId,
      password_hash: PASSWORD_HASH,
      is_active: true,
      updated_at: db.fn.now(),
    });
    row = await db('faculty_users').where({ id: row.id }).first();
  }
  return row!;
}

async function guardianContext(): Promise<Ctx | null> {
  if (!(await db.schema.hasTable('admission_applicants'))) return null;
  if (!(await db.schema.hasTable('parent_users'))) return null;
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  if (!cls) return null;
  const cycle = await db('admission_cycles').where({ college_id: cls.college_id, name: 'QA Admissions Cycle 2026' }).first();
  if (!cycle) return null;
  const intake = await db('admission_program_intakes').where({ college_id: cls.college_id, cycle_id: cycle.id }).first();
  const req = await db('admission_document_requirements').where({ college_id: cls.college_id, cycle_id: cycle.id }).first();
  const feeHead = await db('fee_heads').where({ college_id: cls.college_id }).first();
  if (!intake || !req || !feeHead) return null;
  const collegeId = Number(cls.college_id);
  const departmentId = cls.department_id != null ? Number(cls.department_id) : null;
  const managerRow = await ensureFaculty(collegeId, departmentId, 'ADMISSIONS_MANAGER');
  const facultyRow = await ensureFaculty(collegeId, departmentId, 'FACULTY');
  const accountantRow = await ensureFaculty(collegeId, departmentId, 'ACCOUNTANT');
  const otherCollege = await db('colleges').whereNot({ id: collegeId }).first();
  return {
    collegeId,
    otherCollegeId: otherCollege ? Number(otherCollege.id) : null,
    cycleId: Number(cycle.id),
    academicYearId: Number(intake.academic_year_id),
    programId: Number(intake.program_id),
    departmentId,
    semesterId: Number(intake.semester_id),
    schemeId: intake.scheme_id != null ? Number(intake.scheme_id) : null,
    classSectionId: intake.class_section_id != null ? Number(intake.class_section_id) : null,
    requirementId: Number(req.id),
    feeHeadId: Number(feeHead.id),
    manager: admissionActor(managerRow),
    faculty: admissionActor(facultyRow, 'FACULTY'),
    accountant: financeActor(accountantRow),
  };
}

async function createGuardianIntake(label: string, approvedIntake: number) {
  const category = `GUARDIAN-${label}-${run}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 64);
  const [id] = await db('admission_program_intakes').insert({
    college_id: ctx!.collegeId,
    cycle_id: ctx!.cycleId,
    academic_year_id: ctx!.academicYearId,
    program_id: ctx!.programId,
    department_id: ctx!.departmentId,
    scheme_id: ctx!.schemeId,
    semester_id: ctx!.semesterId,
    class_section_id: ctx!.classSectionId,
    category,
    approved_intake: approvedIntake,
    selected_count: 0,
    admitted_count: 0,
  });
  return Number(id);
}

async function makeApplicant(label: string, guardian?: Record<string, unknown> | null) {
  const suffix = `${run}.${label}.${Math.random().toString(36).slice(2, 8)}`;
  return createApplicant(ctx!.manager, {
    cycleId: ctx!.cycleId,
    name: `Guardian ${label}`,
    email: `guardian.${suffix}@example.edu`,
    phone: `91${suffix.replace(/\D/g, '').slice(0, 8).padEnd(8, '0')}`,
    password: PASSWORD,
    guardian: guardian as any,
    education: [{
      qualification: 'PUC / Class XII',
      institution: 'Guardian PU College',
      marksPercentage: 88,
      subjects: [{ name: 'Mathematics' }, { name: 'Physics' }],
    }],
    preferences: [{ programId: ctx!.programId, preferenceOrder: 1 }],
  });
}

async function makeReadyApplicant(label: string, options: { guardian?: Record<string, unknown> | null; intakeId?: number } = {}) {
  const applicant = await makeApplicant(label, options.guardian ?? null);
  const applicantId = Number(applicant.id);
  const intakeId = options.intakeId ?? await createGuardianIntake(`ready-${label}`, 500);
  await submitApplication(ctx!.manager, applicantId);
  const doc = await uploadDocument(ctx!.manager, applicantId, {
    requirementId: ctx!.requirementId,
    fileName: `guardian-${applicantId}.pdf`,
    mimeType: 'application/pdf',
    fileSizeBytes: 120000,
    storageKey: `secure/admissions/guardian/${run}/${applicantId}.pdf`,
  });
  await verifyDocument(ctx!.manager, Number(doc.id), 'VERIFIED', 'Guardian test verified');
  await evaluateEligibility(ctx!.manager, applicantId);
  await selectApplicant(ctx!.manager, applicantId, {
    programId: ctx!.programId,
    intakeId,
    status: 'SELECTED',
    meritScore: 88,
  });
  await issueOffer(ctx!.manager, applicantId, {
    programId: ctx!.programId,
    offerDate: '2026-10-10',
  });
  const demand = await createAdmissionFeeDemand(ctx!.manager, applicantId, {
    feeHeadId: ctx!.feeHeadId,
    amount: 25000,
    dueDate: '2026-10-10',
  });
  await recordManualPayment(ctx!.accountant, {
    applicantId,
    amount: 25000,
    paymentDate: '2026-10-10',
    paymentMethod: 'CASH',
    transactionReference: `ADM-GUARDIAN-${run}-${applicantId}`,
    demandIds: [Number(demand.id)],
  });
  return { applicant: await db('admission_applicants').where({ id: applicantId }).first(), intakeId };
}

before(async () => {
  ctx = await guardianContext();
});

describe('Admissions guardian/parent provisioning', () => {
  it('1. confirmAdmission with complete guardian provisions a verified parent account and link', async () => {
    if (!ctx) return;
    const email = `guardian.complete.${run}@example.edu`;
    const ready = await makeReadyApplicant('complete', {
      guardian: { name: 'Complete Guardian', email, phone: '9876500001', relationship: 'Father' },
    });
    const result = await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: ready.intakeId });
    const studentId = Number(result.conversion.student_id);

    const parent = await db('parent_users').where({ email }).first();
    assert.ok(parent, 'parent_users row should be created');
    assert.equal(Number(parent.identity_verified), 1);
    assert.equal(Number(parent.is_active), 1);

    const link = await db('parent_student_links').where({ parent_user_id: parent.id, student_id: studentId }).first();
    assert.ok(link, 'parent_student_links row should be created');
    assert.equal(link.verification_state, 'VERIFIED');
    assert.equal(Number(link.is_active), 1);
  });

  it('2. retrying confirmAdmission on an already-converted applicant does not duplicate parent rows', async () => {
    if (!ctx) return;
    const email = `guardian.retry.${run}@example.edu`;
    const ready = await makeReadyApplicant('retry', {
      guardian: { name: 'Retry Guardian', email, phone: '9876500002', relationship: 'Mother' },
    });
    const first = await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: ready.intakeId });
    const second = await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: ready.intakeId });
    assert.equal(String(first.conversion.id), String(second.conversion.id));

    const parents = await db('parent_users').where({ email });
    assert.equal(parents.length, 1);
    const links = await db('parent_student_links').where({ parent_user_id: parents[0].id, student_id: Number(first.conversion.student_id) });
    assert.equal(links.length, 1);
  });

  it('3. second applicant at the same college with the same guardian email reuses the parent row', async () => {
    if (!ctx) return;
    const email = `guardian.shared.${run}@example.edu`;
    const readyA = await makeReadyApplicant('shared-a', {
      guardian: { name: 'Shared Guardian', email, phone: '9876500003', relationship: 'Father' },
    });
    const resultA = await confirmAdmission(ctx.manager, Number(readyA.applicant.id), { intakeId: readyA.intakeId });

    const readyB = await makeReadyApplicant('shared-b', {
      guardian: { name: 'Shared Guardian', email, phone: '9876500003', relationship: 'Father' },
    });
    const resultB = await confirmAdmission(ctx.manager, Number(readyB.applicant.id), { intakeId: readyB.intakeId });

    const parents = await db('parent_users').where({ email });
    assert.equal(parents.length, 1, 'guardian email should map to a single parent_users row');

    const links = await db('parent_student_links').where({ parent_user_id: parents[0].id });
    const studentIds = links.map((l) => Number(l.student_id));
    assert.ok(studentIds.includes(Number(resultA.conversion.student_id)));
    assert.ok(studentIds.includes(Number(resultB.conversion.student_id)));
  });

  it('4. guardian email belonging to a different college does not block conversion and logs a conflict', async () => {
    if (!ctx || !ctx.otherCollegeId) return;
    const email = `guardian.crosscollege.${run}@example.edu`;
    await db('parent_users').insert({
      college_id: ctx.otherCollegeId,
      name: 'Other College Guardian',
      email,
      phone: '9876500004',
      password_hash: PASSWORD_HASH,
      identity_verified: true,
      is_active: true,
    });
    const existingParent = await db('parent_users').where({ email }).first();

    const ready = await makeReadyApplicant('crosscollege', {
      guardian: { name: 'Cross College Guardian', email, phone: '9876500004', relationship: 'Father' },
    });
    const result = await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: ready.intakeId });
    assert.ok(result.conversion, 'student conversion must still succeed');

    const links = await db('parent_student_links').where({ student_id: Number(result.conversion.student_id) });
    assert.equal(links.length, 0, 'no link should be created against the conflicting email');

    const parentsAfter = await db('parent_users').where({ email });
    assert.equal(parentsAfter.length, 1, 'no new parent_users row should be created');
    assert.equal(Number(parentsAfter[0].id), Number(existingParent.id));

    const conflictAudit = await db('admission_audit_log')
      .where({ entity_type: 'admission_applicant', entity_id: Number(ready.applicant.id), action: 'APPLICANT_GUARDIAN_LINK_CONFLICT' })
      .first();
    assert.ok(conflictAudit, 'conflict audit entry should be recorded');
  });

  it('5. applicant with no guardian data converts successfully with no parent side effects', async () => {
    if (!ctx) return;
    const ready = await makeReadyApplicant('none', { guardian: null });
    const result = await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: ready.intakeId });
    assert.ok(result.conversion);
    const links = await db('parent_student_links').where({ student_id: Number(result.conversion.student_id) });
    assert.equal(links.length, 0);
  });

  it('6. concurrent confirmAdmission for two applicants sharing a guardian email creates exactly one parent row', async () => {
    if (!ctx) return;
    const email = `guardian.concurrent.${run}@example.edu`;
    const readyA = await makeReadyApplicant('concurrent-a', {
      guardian: { name: 'Concurrent Guardian', email, phone: '9876500006', relationship: 'Father' },
    });
    const readyB = await makeReadyApplicant('concurrent-b', {
      guardian: { name: 'Concurrent Guardian', email, phone: '9876500006', relationship: 'Father' },
    });
    const results = await Promise.allSettled([
      confirmAdmission(ctx.manager, Number(readyA.applicant.id), { intakeId: readyA.intakeId }),
      confirmAdmission(ctx.manager, Number(readyB.applicant.id), { intakeId: readyB.intakeId }),
    ]);
    // NOTE: confirmAdmission's own admission-number allocation (nextAdmissionNumber, a
    // pre-existing, out-of-scope count()+1 without row locking) can make one of two truly
    // concurrent conversions at the same college fail on a unique-constraint race — that is
    // unrelated to guardian provisioning. What this test verifies is the provisioning
    // invariant: however many conversions land, the shared guardian email never produces
    // more than one parent_users row.
    assert.ok(results.some((r) => r.status === 'fulfilled'), 'at least one student conversion should succeed');
    const parents = await db('parent_users').where({ email });
    assert.equal(parents.length, 1, 'exactly one parent_users row should exist for the shared email');
  });

  it('7. PATCH guardian succeeds for ADMISSIONS_MANAGER and updates guardian_json', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('patch-manager');
    const updated = await updateApplicantGuardian(ctx.manager, Number(applicant.id), {
      name: 'Patched Guardian',
      email: `guardian.patched.${run}@example.edu`,
      phone: '9876500007',
      relationship: 'Mother',
    });
    const guardian = typeof updated.guardian_json === 'string' ? JSON.parse(updated.guardian_json) : updated.guardian_json;
    assert.equal(guardian.name, 'Patched Guardian');
    assert.equal(guardian.email, `guardian.patched.${run}@example.edu`);
  });

  it('8. PATCH guardian is denied for an unrelated FACULTY role', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('patch-denied');
    await assert.rejects(
      () => updateApplicantGuardian(ctx!.faculty, Number(applicant.id), { name: 'Nope', email: null, phone: null, relationship: null }),
      /permission/i,
    );
  });

  it('9. PATCH guardian enforces tenant isolation for a cross-college applicant id', async () => {
    if (!ctx || !ctx.otherCollegeId) return;
    const otherApplicant = await db('admission_applicants').where({ college_id: ctx.otherCollegeId }).first();
    if (!otherApplicant) return;
    await assert.rejects(
      () => updateApplicantGuardian(ctx!.manager, Number(otherApplicant.id), { name: 'Nope', email: null, phone: null, relationship: null }),
      /not found/i,
    );
  });
});
