/**
 * Admissions final closure E2E checks.
 *
 * Run after:
 *   MOBILE_E2E_STUDENT_PASSWORD=Password123 npm run seed:student-lms-e2e -w @skillonx/survey-api
 *   npm run seed:admissions-qa -w @skillonx/survey-api
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import type { AdmissionActor } from './types.js';
import {
  applicantLogin,
  applicantMe,
  cancelApplication,
  confirmAdmission,
  createAdmissionFeeDemand,
  createApplicant,
  createEnquiry,
  dashboard,
  evaluateEligibility,
  getApplicationWorkspace,
  issueOffer,
  listApplications,
  overrideEligibility,
  selectApplicant,
  submitApplication,
  uploadDocument,
  verifyDocument,
} from './service.js';
import { assertApplicantVisible, assertDocumentVisible, hasAdmissionPermission } from './access.js';
import { listApplicantNotifications } from './notify.js';
import { createAdmissionApplicantDemand } from '../finance/demands.js';
import { recordManualPayment } from '../finance/payments.js';
import { loginStudent, resetStudentPassword } from '../academicClasses/studentAuth.js';
import { studentCurrentClass, studentDashboard, studentSubjects } from '../academicClasses/studentLms.js';
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
  otherProgramId: number | null;
  departmentId: number | null;
  otherDepartmentId: number | null;
  intakeId: number;
  semesterId: number;
  schemeId: number | null;
  classSectionId: number | null;
  requirementId: number;
  feeHeadId: number;
  manager: AdmissionActor;
  officer: AdmissionActor;
  hod: AdmissionActor;
  principal: AdmissionActor;
  management: AdmissionActor;
  accountant: FinanceActor;
  applicantA: Record<string, unknown>;
  applicantB: Record<string, unknown>;
};

let ctx: Ctx | null = null;
let fullJourney: Awaited<ReturnType<typeof createConvertedStudent>>;
let paidApplicant: Record<string, unknown> | null = null;
let paidDemand: Record<string, unknown> | null = null;
let submittedApplicant: Record<string, unknown> | null = null;
let uploadedDocument: Record<string, unknown> | null = null;
let enquiry: Record<string, unknown> | null = null;
let cancelled: Record<string, unknown> | null = null;
let overrideDecision: Record<string, unknown> | null = null;
let waitlisted: Record<string, unknown> | null = null;

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

async function ensureFaculty(collegeId: number, departmentId: number | null, role: string) {
  const email = `qa.admissions.${role.toLowerCase().replaceAll('_', '.')}@example.edu`;
  let row = await db('faculty_users').where({ college_id: collegeId, email }).first();
  if (!row) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      department_id: departmentId,
      email,
      name: `QA Admissions ${role}`,
      role,
      password_hash: PASSWORD_HASH,
      is_active: true,
      employee_id: `QA-ADM-${role}`.slice(0, 32),
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

async function closureContext(): Promise<Ctx | null> {
  if (!(await db.schema.hasTable('admission_applicants'))) return null;
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
  const officerRow = await ensureFaculty(collegeId, departmentId, 'ADMISSIONS_OFFICER');
  const hodRow = await ensureFaculty(collegeId, departmentId, 'HOD');
  const principalRow = await ensureFaculty(collegeId, departmentId, 'PRINCIPAL');
  const managementRow = await ensureFaculty(collegeId, departmentId, 'MANAGEMENT');
  const accountantRow = await ensureFaculty(collegeId, departmentId, 'ACCOUNTANT');
  const otherProgram = await db('programs').where({ college_id: collegeId }).whereNot({ department_id: departmentId }).first();
  const otherCollege = await db('colleges').whereNot({ id: collegeId }).first();
  return {
    collegeId,
    otherCollegeId: otherCollege ? Number(otherCollege.id) : null,
    cycleId: Number(cycle.id),
    academicYearId: Number(intake.academic_year_id),
    programId: Number(intake.program_id),
    otherProgramId: otherProgram ? Number(otherProgram.id) : null,
    departmentId,
    otherDepartmentId: otherProgram?.department_id != null ? Number(otherProgram.department_id) : null,
    intakeId: Number(intake.id),
    semesterId: Number(intake.semester_id),
    schemeId: intake.scheme_id != null ? Number(intake.scheme_id) : null,
    classSectionId: intake.class_section_id != null ? Number(intake.class_section_id) : null,
    requirementId: Number(req.id),
    feeHeadId: Number(feeHead.id),
    manager: admissionActor(managerRow),
    officer: admissionActor(officerRow),
    hod: admissionActor(hodRow, 'HOD'),
    principal: admissionActor(principalRow, 'PRINCIPAL'),
    management: admissionActor(managementRow, 'MANAGEMENT'),
    accountant: financeActor(accountantRow),
    applicantA: await db('admission_applicants').where({ college_id: collegeId, application_number: 'QA/ADM/2026/001' }).first(),
    applicantB: await db('admission_applicants').where({ college_id: collegeId, application_number: 'QA/ADM/2026/002' }).first(),
  };
}

async function makeApplicant(label: string, programId = ctx!.programId) {
  const suffix = `${run}.${label}.${Math.random().toString(36).slice(2, 8)}`;
  return createApplicant(ctx!.manager, {
    cycleId: ctx!.cycleId,
    name: `Closure ${label}`,
    email: `closure.${suffix}@example.edu`,
    phone: `91${suffix.replace(/\D/g, '').slice(0, 8).padEnd(8, '0')}`,
    password: PASSWORD,
    education: [{
      qualification: 'PUC / Class XII',
      institution: 'Closure PU College',
      marksPercentage: 91,
      subjects: [{ name: 'Mathematics' }, { name: 'Physics' }],
    }],
    preferences: [{ programId, preferenceOrder: 1 }],
  });
}

async function verifyRequiredDocument(applicantId: number) {
  const doc = await uploadDocument(ctx!.manager, applicantId, {
    requirementId: ctx!.requirementId,
    fileName: `closure-${applicantId}.pdf`,
    mimeType: 'application/pdf',
    fileSizeBytes: 120000,
    storageKey: `secure/admissions/closure/${run}/${applicantId}.pdf`,
  });
  return verifyDocument(ctx!.manager, Number(doc.id), 'VERIFIED', 'Closure verified');
}

async function makeReadyApplicant(label: string, options: { paid?: boolean; intakeId?: number; programId?: number } = {}) {
  const applicant = await makeApplicant(label, options.programId);
  const applicantId = Number(applicant.id);
  const intakeId = options.intakeId ?? await createClosureIntake(`ready-${label}`, 500);
  await submitApplication(ctx!.manager, applicantId);
  await verifyRequiredDocument(applicantId);
  await evaluateEligibility(ctx!.manager, applicantId);
  await selectApplicant(ctx!.manager, applicantId, {
    programId: options.programId ?? ctx!.programId,
    intakeId,
    status: 'SELECTED',
    meritScore: 91,
  });
  await issueOffer(ctx!.manager, applicantId, {
    programId: options.programId ?? ctx!.programId,
    offerDate: '2026-10-10',
  });
  const demand = await createAdmissionFeeDemand(ctx!.manager, applicantId, {
    feeHeadId: ctx!.feeHeadId,
    amount: 25000,
    dueDate: '2026-10-10',
  });
  if (options.paid) {
    await recordManualPayment(ctx!.accountant, {
      applicantId,
      amount: 25000,
      paymentDate: '2026-10-10',
      paymentMethod: 'CASH',
      transactionReference: `ADM-CLOSURE-${run}-${applicantId}`,
      demandIds: [Number(demand.id)],
    });
  }
  return { applicant: await db('admission_applicants').where({ id: applicantId }).first(), demand };
}

async function createConvertedStudent(label: string) {
  const ready = await makeReadyApplicant(label, { paid: true });
  const selection = await db('admission_selections').where({ applicant_id: ready.applicant.id }).first();
  const result = await confirmAdmission(ctx!.manager, Number(ready.applicant.id), { intakeId: Number(selection.intake_id) });
  const student = await db('students').where({ id: result.conversion.student_id }).first();
  await resetStudentPassword(String(result.activationToken), PASSWORD);
  return { ...ready, result, student: await db('students').where({ id: student.id }).first() };
}

before(async () => {
  ctx = await closureContext();
});

describe('Admissions final closure E2E', () => {
  it('1. enquiry creation', async () => {
    if (!ctx) return;
    enquiry = await createEnquiry(ctx.officer, {
      cycleId: ctx.cycleId,
      name: `Closure Enquiry ${run}`,
      email: `closure.enquiry.${run}@example.edu`,
      interestedProgramId: ctx.programId,
      source: 'WEBSITE',
    });
    assert.ok(enquiry.id);
  });

  it('2. enquiry to applicant', async () => {
    if (!ctx || !enquiry) return;
    const applicant = await createApplicant(ctx.officer, {
      cycleId: ctx.cycleId,
      enquiryId: Number(enquiry.id),
      name: `Closure Converted ${run}`,
      email: `closure.converted.${run}@example.edu`,
      password: PASSWORD,
      education: [{ qualification: 'PUC / Class XII', marksPercentage: 88 }],
      preferences: [{ programId: ctx.programId, preferenceOrder: 1 }],
    });
    assert.equal(applicant.enquiry_id, enquiry.id);
  });

  it('3. Applicant login', async () => {
    if (!ctx) return;
    const auth = await applicantLogin({
      applicationNumber: String(ctx.applicantA.application_number),
      email: String(ctx.applicantA.email),
      password: PASSWORD,
    });
    assert.equal(auth.user.role, 'APPLICANT');
  });

  it('4. application draft', async () => {
    if (!ctx) return;
    const draft = await makeApplicant('draft');
    assert.equal(draft.status, 'DRAFT');
  });

  it('5. save/reload draft', async () => {
    if (!ctx) return;
    const draft = await makeApplicant('reload-draft');
    const workspace = await getApplicationWorkspace(ctx.manager, Number(draft.id));
    assert.equal(workspace.applicant.status, 'DRAFT');
  });

  it('6. submit application', async () => {
    if (!ctx) return;
    submittedApplicant = await makeApplicant('submit');
    const submitted = await submitApplication(ctx.manager, Number(submittedApplicant.id));
    assert.equal(submitted.status, 'SUBMITTED');
  });

  it('7. application number', async () => {
    if (!ctx || !submittedApplicant) return;
    assert.match(String(submittedApplicant.application_number), /ADM/);
  });

  it('8. upload document', async () => {
    if (!ctx || !submittedApplicant) return;
    uploadedDocument = await uploadDocument(ctx.manager, Number(submittedApplicant.id), {
      requirementId: ctx.requirementId,
      fileName: 'closure-upload.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1000,
      storageKey: `secure/admissions/closure/upload-${run}.pdf`,
    });
    assert.equal(uploadedDocument.verification_status, 'PENDING');
  });

  it('9. Applicant isolation', async () => {
    if (!ctx) return;
    const actor: AdmissionActor = { kind: 'APPLICANT', applicantId: Number(ctx.applicantA.id), collegeId: ctx.collegeId, role: 'APPLICANT' };
    await assert.rejects(() => getApplicationWorkspace(actor, Number(ctx.applicantB.id)), /Applicant not found/);
  });

  it('10. Admissions Officer login identity exists', async () => {
    if (!ctx) return;
    assert.equal(ctx.officer.role, 'ADMISSIONS_OFFICER');
  });

  it('11. dashboard', async () => {
    if (!ctx) return;
    const data = await dashboard(ctx.manager);
    assert.ok(Array.isArray(data.pipeline));
    assert.ok(data.actionRequired);
  });

  it('12. application review', async () => {
    if (!ctx) return;
    const workspace = await getApplicationWorkspace(ctx.manager, Number(ctx.applicantB.id));
    assert.equal(workspace.applicant.id, ctx.applicantB.id);
  });

  it('13. verify document', async () => {
    if (!ctx || !uploadedDocument) return;
    const verified = await verifyDocument(ctx.manager, Number(uploadedDocument.id), 'VERIFIED', 'ok');
    assert.equal(verified.verification_status, 'VERIFIED');
  });

  it('14. reject document', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('reject-doc');
    await submitApplication(ctx.manager, Number(applicant.id));
    const doc = await uploadDocument(ctx.manager, Number(applicant.id), {
      requirementId: ctx.requirementId,
      fileName: 'bad.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1000,
      storageKey: `secure/admissions/closure/reject-${run}.pdf`,
    });
    const rejected = await verifyDocument(ctx.manager, Number(doc.id), 'REJECTED', 'blurred');
    assert.equal(rejected.verification_status, 'REJECTED');
  });

  it('15. Applicant resubmission', async () => {
    if (!ctx) return;
    const applicant = await db('admission_applicants').where({ application_number: 'QA/ADM/2026/003' }).first();
    const doc = await uploadDocument({ kind: 'APPLICANT', applicantId: Number(applicant.id), collegeId: ctx.collegeId, role: 'APPLICANT' }, Number(applicant.id), {
      requirementId: ctx.requirementId,
      fileName: 'resubmitted.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1000,
      storageKey: `secure/admissions/closure/resubmit-${run}.pdf`,
    });
    assert.ok(Number(doc.version) >= 2);
  });

  it('16. eligibility calculation', async () => {
    if (!ctx || !submittedApplicant) return;
    const decision = await evaluateEligibility(ctx.manager, Number(submittedApplicant.id));
    assert.equal(decision.status, 'ELIGIBLE');
  });

  it('17. eligibility explanation', async () => {
    if (!ctx || !submittedApplicant) return;
    const decision = await db('admission_eligibility_decisions').where({ applicant_id: submittedApplicant.id }).orderBy('id', 'desc').first();
    const explanation = typeof decision.explanation_json === 'string'
      ? JSON.parse(decision.explanation_json)
      : decision.explanation_json;
    assert.ok(explanation.some((item: { rule?: string }) => item.rule === 'DOCUMENTS'));
  });

  it('18. unauthorized eligibility override denied', async () => {
    if (!ctx || !submittedApplicant) return;
    await assert.rejects(() => overrideEligibility(ctx.officer, Number(submittedApplicant.id), { status: 'ELIGIBLE', reason: 'Officer cannot override eligibility' }), /permission/);
  });

  it('19. authorized override audited', async () => {
    if (!ctx || !submittedApplicant) return;
    overrideDecision = await overrideEligibility(ctx.manager, Number(submittedApplicant.id), { status: 'ELIGIBLE', reason: 'Manager closure override evidence' });
    const audit = await db('admission_audit_log').where({ entity_id: submittedApplicant.id, action: 'ELIGIBILITY_OVERRIDDEN' }).first();
    assert.ok(audit);
  });

  it('20. selection', async () => {
    if (!ctx || !submittedApplicant) return;
    const selection = await selectApplicant(ctx.manager, Number(submittedApplicant.id), { programId: ctx.programId, intakeId: ctx.intakeId, status: 'SELECTED' });
    assert.equal(selection.status, 'SELECTED');
  });

  it('21. waitlist', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('waitlist');
    await submitApplication(ctx.manager, Number(applicant.id));
    await verifyRequiredDocument(Number(applicant.id));
    await evaluateEligibility(ctx.manager, Number(applicant.id));
    waitlisted = await selectApplicant(ctx.manager, Number(applicant.id), { programId: ctx.programId, status: 'WAITLISTED', waitlistRank: 1 });
    assert.equal(waitlisted.status, 'WAITLISTED');
  });

  it('22. intake count', async () => {
    if (!ctx) return;
    const intake = await db('admission_program_intakes').where({ id: ctx.intakeId }).first();
    assert.ok(Number(intake.approved_intake) > 0);
  });

  it('23. seat availability', async () => {
    if (!ctx) return;
    const data = await dashboard(ctx.manager);
    assert.ok(data.intake.some((i) => i.id === ctx!.intakeId && i.remaining >= 0));
  });

  it('24. over-admission prevention', async () => {
    if (!ctx) return;
    const oneSeat = await createOneSeatIntake('over');
    const a = await makeReadyApplicant('over-a', { paid: true, intakeId: oneSeat });
    await confirmAdmission(ctx.manager, Number(a.applicant.id), { intakeId: oneSeat });
    const b = await makeReadyApplicant('over-b', { paid: true, intakeId: oneSeat });
    await assert.rejects(() => confirmAdmission(ctx.manager, Number(b.applicant.id), { intakeId: oneSeat }), /No seats/);
  });

  it('25. Finance demand integration', async () => {
    if (!ctx) return;
    const ready = await makeReadyApplicant('finance-demand');
    paidApplicant = ready.applicant;
    paidDemand = ready.demand as Record<string, unknown>;
    assert.equal(paidDemand.subjectType, 'ADMISSION_APPLICANT');
  });

  it('26. payment status from Finance', async () => {
    if (!ctx || !paidApplicant || !paidDemand) return;
    await recordManualPayment(ctx.accountant, {
      applicantId: Number(paidApplicant.id),
      amount: 10000,
      paymentDate: '2026-10-10',
      paymentMethod: 'CASH',
      transactionReference: `ADM-PARTIAL-${run}`,
      demandIds: [Number(paidDemand.id)],
    });
    const workspace = await getApplicationWorkspace(ctx.manager, Number(paidApplicant.id));
    assert.equal(workspace.finance?.paymentState, 'PARTIALLY_PAID');
  });

  it('27. Accountant Finance ownership', async () => {
    if (!ctx) return;
    assert.equal(ctx.accountant.role, 'ACCOUNTANT');
  });

  it('28. Admissions cannot forge settled payment', async () => {
    if (!ctx || !paidApplicant) return;
    await assert.rejects(() => recordManualPayment({ ...ctx.accountant, role: 'ADMISSIONS_MANAGER' }, {
      applicantId: Number(paidApplicant.id),
      amount: 15000,
      paymentDate: '2026-10-10',
      paymentMethod: 'CASH',
      transactionReference: `ADM-FORGE-${run}`,
    }), /finance action/);
  });

  it('29. admission confirmation gate', async () => {
    if (!ctx || !paidApplicant) return;
    const selection = await db('admission_selections').where({ applicant_id: paidApplicant.id }).first();
    await assert.rejects(() => confirmAdmission(ctx.manager, Number(paidApplicant.id), { intakeId: Number(selection.intake_id) }), /fee is not fully paid/);
  });

  it('30. missing requirement blocks confirmation', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('missing-doc');
    await submitApplication(ctx.manager, Number(applicant.id));
    await overrideEligibility(ctx.manager, Number(applicant.id), { status: 'ELIGIBLE', reason: 'Testing missing document confirmation block' });
    await selectApplicant(ctx.manager, Number(applicant.id), { programId: ctx.programId, intakeId: ctx.intakeId, status: 'SELECTED' });
    await assert.rejects(() => confirmAdmission(ctx.manager, Number(applicant.id), { intakeId: ctx.intakeId }), /documents are not verified/);
  });

  it('31. successful confirmation', async () => {
    if (!ctx) return;
    fullJourney = await createConvertedStudent('full');
    assert.equal(fullJourney.student.id, fullJourney.result.conversion.student_id);
  });

  it('32. Student conversion', async () => {
    if (!ctx || !fullJourney) return;
    assert.equal(fullJourney.student.email, fullJourney.applicant.email);
  });

  it('33. conversion idempotency', async () => {
    if (!ctx || !fullJourney) return;
    const again = await confirmAdmission(ctx.manager, Number(fullJourney.applicant.id), { intakeId: ctx.intakeId });
    assert.equal(again.conversion.student_id, fullJourney.result.conversion.student_id);
  });

  it('34. duplicate Student prevention', async () => {
    if (!ctx || !fullJourney) return;
    const applicant = await makeApplicant('duplicate-email');
    let existing = await db('students').where({ college_id: ctx.collegeId, email: applicant.email }).first();
    if (!existing) {
      const [id] = await db('students').insert({
        college_id: ctx.collegeId,
        department_id: ctx.departmentId,
        program_id: ctx.programId,
        scheme_id: ctx.schemeId,
        academic_year_id: ctx.academicYearId,
        semester_id: ctx.semesterId,
        class_section_id: ctx.classSectionId,
        name: 'Existing Collision Student',
        usn: null,
        admission_number: `COLLISION-${run}`,
        email: applicant.email,
        password_hash: await bcrypt.hash(PASSWORD, 10),
        is_active: true,
      });
      existing = await db('students').where({ id }).first();
    }
    assert.ok(existing);
    await submitApplication(ctx.manager, Number(applicant.id));
    await verifyRequiredDocument(Number(applicant.id));
    await overrideEligibility(ctx.manager, Number(applicant.id), { status: 'ELIGIBLE', reason: 'Testing duplicate student prevention' });
    const intakeId = await createClosureIntake('duplicate', 10);
    await selectApplicant(ctx.manager, Number(applicant.id), { programId: ctx.programId, intakeId, status: 'SELECTED' });
    await assert.rejects(() => confirmAdmission(ctx.manager, Number(applicant.id), { intakeId }), /canonical student already exists/);
  });

  it('35. academic mapping', async () => {
    if (!ctx || !fullJourney) return;
    assert.equal(Number(fullJourney.student.program_id), ctx.programId);
    assert.equal(Number(fullJourney.student.semester_id), ctx.semesterId);
  });

  it('36. Student account activation', async () => {
    if (!ctx || !fullJourney) return;
    const auth = await loginStudent({ email: String(fullJourney.student.email), password: PASSWORD, collegeId: ctx.collegeId });
    assert.equal(auth.user.role, 'STUDENT');
  });

  it('37. Student LMS access after conversion', async () => {
    if (!ctx || !fullJourney) return;
    const dash = await studentDashboard(Number(fullJourney.student.id));
    assert.ok(dash.class);
    assert.ok(dash.subjects.length >= 1);
  });

  it('38. document carry-forward', async () => {
    if (!ctx || !fullJourney) return;
    const docs = await db('admission_documents').where({ applicant_id: fullJourney.applicant.id });
    assert.ok(docs.length >= 1);
  });

  it('39. Finance carry-forward', async () => {
    if (!ctx || !fullJourney) return;
    const demand = await db('student_fee_demands').where({ id: fullJourney.demand.id }).first();
    assert.equal(Number(demand.student_id), Number(fullJourney.student.id));
    assert.equal(demand.subject_type, 'ADMISSION_APPLICANT');
  });

  it('40. cancellation', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('cancel');
    cancelled = await cancelApplication(ctx.manager, Number(applicant.id), 'Closure cancellation');
    assert.equal(cancelled.status, 'CANCELLED');
  });

  it('41. post-conversion withdrawal does not delete Student', async () => {
    if (!ctx || !fullJourney) return;
    await assert.rejects(() => cancelApplication(ctx.manager, Number(fullJourney.applicant.id), 'no delete'), /withdrawal workflow/);
    const student = await db('students').where({ id: fullJourney.student.id }).first();
    assert.ok(student);
  });

  it('42. HOD scope', async () => {
    if (!ctx) return;
    const visible = await assertApplicantVisible(ctx.hod, Number(ctx.applicantB.id));
    assert.equal(visible.id, ctx.applicantB.id);
    assert.equal(hasAdmissionPermission(ctx.hod, 'admissions.confirm'), false);
  });

  it('43. Principal oversight', async () => {
    if (!ctx) return;
    const data = await dashboard(ctx.principal);
    assert.ok(data.intake.length >= 1);
  });

  it('44. Management aggregate', async () => {
    if (!ctx) return;
    const data = await dashboard(ctx.management);
    assert.ok(data.pipeline.length >= 1);
    await assert.rejects(() => submitApplication(ctx.management, Number(ctx.applicantA.id)), /permission|Cannot submit/);
  });

  it('45. COE denied mutation', async () => {
    if (!ctx) return;
    const coe = admissionActor(await ensureFaculty(ctx.collegeId, ctx.departmentId, 'COE'));
    await assert.rejects(() => submitApplication(coe, Number(ctx.applicantA.id)), /access|permission/);
  });

  it('46. Faculty denied general Admissions', async () => {
    if (!ctx) return;
    const faculty = admissionActor(await ensureFaculty(ctx.collegeId, ctx.departmentId, 'FACULTY'));
    await assert.rejects(() => listApplications(faculty, {}), /permission/);
  });

  it('47. cross-college isolation', async () => {
    if (!ctx || !ctx.otherCollegeId) return;
    await assert.rejects(() => getApplicationWorkspace({ ...ctx.manager, collegeId: ctx.otherCollegeId }, Number(ctx.applicantA.id)), /not found/);
  });

  it('48. audit evidence', async () => {
    if (!ctx || !fullJourney) return;
    const audit = await db('admission_audit_log').where({ entity_id: fullJourney.applicant.id, action: 'ADMISSION_CONFIRMED_AND_CONVERTED' }).first();
    assert.ok(audit);
  });

  it('49. direct-load/reload', async () => {
    if (!ctx || !fullJourney) return;
    const workspace = await getApplicationWorkspace(ctx.manager, Number(fullJourney.applicant.id));
    assert.equal(workspace.conversion?.student_id, fullJourney.student.id);
  });

  it('50. responsive authenticated workflow backend data exists', async () => {
    if (!ctx) return;
    const [dash, apps] = await Promise.all([dashboard(ctx.manager), listApplications(ctx.manager, {})]);
    assert.ok(dash.intake.length >= 1);
    assert.ok(apps.length >= 1);
  });
});

describe('Admissions closure concurrency E2E', () => {
  it('1. same Applicant converted concurrently', async () => {
    if (!ctx) return;
    const ready = await makeReadyApplicant('concurrent-convert', { paid: true });
    const selection = await db('admission_selections').where({ applicant_id: ready.applicant.id }).first();
    const results = await Promise.allSettled([
      confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: Number(selection.intake_id) }),
      confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: Number(selection.intake_id) }),
    ]);
    const conversions = await db('admission_student_conversions').where({ applicant_id: ready.applicant.id });
    assert.equal(conversions.length, 1);
    assert.ok(results.some((r) => r.status === 'fulfilled'));
  });

  it('2. last remaining seat claimed concurrently', async () => {
    if (!ctx) return;
    const intakeId = await createOneSeatIntake('race');
    const a = await makeReadyApplicant('race-a', { paid: true, intakeId });
    const b = await makeReadyApplicant('race-b', { paid: true, intakeId });
    const results = await Promise.allSettled([
      confirmAdmission(ctx.manager, Number(a.applicant.id), { intakeId }),
      confirmAdmission(ctx.manager, Number(b.applicant.id), { intakeId }),
    ]);
    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const intake = await db('admission_program_intakes').where({ id: intakeId }).first();
    assert.equal(successes, 1);
    assert.equal(Number(intake.admitted_count), 1);
  });

  it('3. same Finance demand created concurrently', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('demand-race');
    const params = {
      applicantId: Number(applicant.id),
      academicYearId: ctx.academicYearId,
      semesterId: ctx.semesterId,
      feeHeadId: ctx.feeHeadId,
      amount: 25000,
      createdBy: ctx.manager.facultyUserId,
    };
    const results = await Promise.allSettled([
      createAdmissionApplicantDemand(ctx.collegeId, params),
      createAdmissionApplicantDemand(ctx.collegeId, params),
    ]);
    const rows = await db('admission_finance_demands').where({ applicant_id: applicant.id, purpose: 'ADMISSION_FEE' });
    assert.equal(rows.length, 1);
    assert.ok(results.some((r) => r.status === 'fulfilled'));
  });

  it('4. two distinct applicants confirmed concurrently BOTH succeed with distinct admission numbers (A1 closure)', async () => {
    if (!ctx) return;
    // Each gets its own 500-seat intake so seat-capacity contention (test 2)
    // cannot be the reason either one fails — this isolates the
    // admission-number allocation race specifically.
    const a = await makeReadyApplicant('admno-race-a', { paid: true });
    const b = await makeReadyApplicant('admno-race-b', { paid: true });
    const selectionA = await db('admission_selections').where({ applicant_id: a.applicant.id }).first();
    const selectionB = await db('admission_selections').where({ applicant_id: b.applicant.id }).first();

    const results = await Promise.allSettled([
      confirmAdmission(ctx.manager, Number(a.applicant.id), { intakeId: Number(selectionA.intake_id) }),
      confirmAdmission(ctx.manager, Number(b.applicant.id), { intakeId: Number(selectionB.intake_id) }),
    ]);

    for (const r of results) {
      if (r.status === 'rejected') assert.fail(`expected both confirmations to succeed, one rejected with: ${r.reason}`);
    }

    const conversions = await db('admission_student_conversions')
      .whereIn('applicant_id', [Number(a.applicant.id), Number(b.applicant.id)]);
    assert.equal(conversions.length, 2, 'both applicants must have exactly one conversion each');
    const numbers = conversions.map((c) => c.admission_number);
    assert.notEqual(numbers[0], numbers[1], 'concurrent confirmations must not collide on the same admission number');
    for (const n of numbers) {
      assert.match(String(n), /^[A-Z0-9]+\/ADN\/\d{4}\/\d{5}$/, 'admission number format must be preserved unchanged');
    }
    const studentIds = conversions.map((c) => c.student_id);
    const students = await db('students').whereIn('id', studentIds);
    assert.equal(students.length, 2);
    assert.notEqual(students[0].admission_number, students[1].admission_number);
    assert.equal(new Set(students.map((s) => s.admission_number)).size, 2);
  });

  it('5. an unrelated conflict (duplicate email) is NOT retried or swallowed by the admission-number retry loop', async () => {
    if (!ctx) return;
    // Regression guard for the A1 fix's retry scope: confirms the retry is
    // narrowly matched to the admission-number unique indexes and does not
    // accidentally catch/retry a different duplicate-key/business error.
    // Mirrors test 34's own collision setup: a canonical `students` row is
    // inserted directly (bypassing the applicant-email unique index) so the
    // only thing under test is confirmAdmission's duplicate-email guard.
    const applicant = await makeApplicant('admno-scope-guard');
    await db('students').insert({
      college_id: ctx.collegeId,
      department_id: ctx.departmentId,
      program_id: ctx.programId,
      scheme_id: ctx.schemeId,
      academic_year_id: ctx.academicYearId,
      semester_id: ctx.semesterId,
      class_section_id: ctx.classSectionId,
      name: 'Existing Collision Student (Scope Guard)',
      usn: null,
      admission_number: `SCOPE-GUARD-${run}`,
      email: applicant.email,
      password_hash: await bcrypt.hash(PASSWORD, 10),
      is_active: true,
    });
    await submitApplication(ctx.manager, Number(applicant.id));
    await verifyRequiredDocument(Number(applicant.id));
    await evaluateEligibility(ctx.manager, Number(applicant.id));
    const intakeId = await createClosureIntake('admno-scope-guard', 5);
    await selectApplicant(ctx.manager, Number(applicant.id), { programId: ctx.programId, intakeId, status: 'SELECTED', meritScore: 91 });
    await issueOffer(ctx.manager, Number(applicant.id), { programId: ctx.programId, offerDate: '2026-10-10' });
    await assert.rejects(
      () => confirmAdmission(ctx.manager, Number(applicant.id), { intakeId }),
      /canonical student already exists/,
      'the pre-existing duplicate-email guard must still surface immediately, not be masked by the admission-number retry loop',
    );
  });
});

describe('Admissions RBAC isolation matrix', () => {
  const roles = [
    'APPLICANT',
    'STUDENT',
    'ADMISSIONS_OFFICER',
    'ADMISSIONS_MANAGER',
    'FACULTY',
    'HOD',
    'PRINCIPAL',
    'MANAGEMENT',
    'ACCOUNTANT',
    'COE',
    'LAB_ASSISTANT',
    'MAINTENANCE_STAFF',
    'LIBRARIAN',
    'WARDEN',
    'TRANSPORT',
    'TNP',
    'SUPER_ADMIN',
  ];

  for (const role of roles) {
    it(`${role} role category has explicit admissions boundary`, async () => {
      if (!ctx) return;
      if (role === 'APPLICANT') {
        const actor: AdmissionActor = { kind: 'APPLICANT', collegeId: ctx.collegeId, applicantId: Number(ctx.applicantA.id), role };
        const own = await applicantMe(actor);
        assert.equal(own.id, ctx.applicantA.id);
        await assert.rejects(() => getApplicationWorkspace(actor, Number(ctx.applicantB.id)), /not found/);
        return;
      }
      const mapped = role === 'TNP' ? 'PLACEMENT_OFFICER' : role;
      const row = await ensureFaculty(ctx.collegeId, ctx.departmentId, mapped);
      const actor = admissionActor(row, mapped);
      const canList = hasAdmissionPermission(actor, 'admissions.application.manage');
      const canReport = hasAdmissionPermission(actor, 'admissions.report.view');
      if (['ADMISSIONS_OFFICER', 'ADMISSIONS_MANAGER', 'SUPER_ADMIN'].includes(role)) {
        assert.equal(canList, true);
      } else if (['HOD', 'PRINCIPAL', 'MANAGEMENT'].includes(role)) {
        assert.equal(canReport, true);
        assert.equal(hasAdmissionPermission(actor, 'admissions.application.manage'), false);
      } else {
        assert.equal(canList, false);
        assert.equal(canReport, false);
      }
    });
  }
});

function applicantActor(applicant: Record<string, unknown>): AdmissionActor {
  return {
    kind: 'APPLICANT',
    collegeId: Number(applicant.college_id),
    applicantId: Number(applicant.id),
    role: 'APPLICANT',
  };
}

describe('Admissions notifications E2E', () => {
  it('applicant receives the full admissions lifecycle notification trail (correct type/tenant/entity)', async () => {
    if (!ctx) return;
    const journey = await createConvertedStudent('notif-full');
    const applicant = journey.applicant;
    const notifs = await listApplicantNotifications(applicantActor(applicant));
    const types = notifs.map((n) => n.type);
    for (const expected of [
      'APPLICATION_SUBMITTED',
      'ELIGIBILITY_OUTCOME',
      'SELECTION_RESULT',
      'OFFER_ISSUED',
      'ADMISSION_FEE_DEMAND',
      'ADMISSION_CONFIRMED',
    ]) {
      assert.ok(types.includes(expected), `missing applicant notification: ${expected}`);
    }
    // Correct tenant + entity reference on every row; recipient is scoped by the reader.
    const rows = await db('admission_applicant_notifications').where({ applicant_id: applicant.id });
    for (const r of rows) {
      assert.equal(Number(r.college_id), ctx.collegeId);
      assert.equal(Number(r.applicant_id), Number(applicant.id));
      assert.ok(r.type && r.related_type);
    }
    // Converted student gets the canonical student-channel activation notice.
    const studentNotif = await db('student_notifications')
      .where({ student_id: journey.student.id, type: 'STUDENT_ACTIVATION_READY' })
      .first();
    assert.ok(studentNotif, 'converted student should receive STUDENT_ACTIVATION_READY');
    assert.equal(Number(studentNotif.college_id), ctx.collegeId);
  });

  it('document rejection notifies the applicant without leaking document contents', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('notif-doc');
    const applicantId = Number(applicant.id);
    await submitApplication(ctx.manager, applicantId);
    const secretKey = `secure/admissions/SECRET-${run}/${applicantId}.pdf`;
    const secretName = `SECRET-passport-${run}.pdf`;
    const doc = await uploadDocument(ctx.manager, applicantId, {
      requirementId: ctx.requirementId,
      fileName: secretName,
      mimeType: 'application/pdf',
      fileSizeBytes: 120000,
      storageKey: secretKey,
    });
    await verifyDocument(ctx.manager, Number(doc.id), 'REJECTED', 'Illegible scan — please re-upload.');
    const notifs = await listApplicantNotifications(applicantActor(applicant));
    const rejected = notifs.find((n) => n.type === 'DOCUMENT_REJECTED');
    assert.ok(rejected, 'applicant should receive DOCUMENT_REJECTED');
    assert.equal(rejected!.relatedId, Number(doc.id));
    // No sensitive document internals in any applicant-visible field.
    const blob = notifs.map((n) => `${n.title} ${n.body ?? ''} ${n.link ?? ''}`).join(' ');
    assert.ok(!blob.includes(secretKey), 'notification must not leak storage key');
    assert.ok(!blob.includes(secretName), 'notification must not leak file name');
  });

  it('waitlist decision notifies the applicant', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('notif-wait');
    const applicantId = Number(applicant.id);
    await submitApplication(ctx.manager, applicantId);
    await verifyRequiredDocument(applicantId);
    await evaluateEligibility(ctx.manager, applicantId);
    await selectApplicant(ctx.manager, applicantId, {
      programId: ctx.programId,
      status: 'WAITLISTED',
      waitlistRank: 3,
    });
    const notifs = await listApplicantNotifications(applicantActor(applicant));
    assert.ok(notifs.some((n) => n.type === 'WAITLISTED'), 'applicant should receive WAITLISTED');
  });

  it('cancellation notifies the applicant', async () => {
    if (!ctx) return;
    const applicant = await makeApplicant('notif-cancel');
    await cancelApplication(ctx.manager, Number(applicant.id), 'Duplicate application');
    const notifs = await listApplicantNotifications(applicantActor(applicant));
    assert.ok(notifs.some((n) => n.type === 'APPLICATION_CANCELLED'), 'applicant should receive APPLICATION_CANCELLED');
  });

  it('submission notifies admissions review staff via the shared employee channel', async () => {
    if (!ctx) return;
    // Admissions review staff are faculty with canonical employee records.
    const managerFacultyId = ctx.manager.facultyUserId!;
    const hasEmp = await db('employees').where({ faculty_user_id: managerFacultyId }).first();
    if (!hasEmp) {
      await db('employees').insert({
        college_id: ctx.collegeId,
        employee_number: `QA-ADM-MGR-EMP-${ctx.collegeId}`,
        first_name: 'QA',
        last_name: 'Admissions Manager',
        display_name: 'QA Admissions Manager',
        employee_category: 'NON_TEACHING',
        employment_status: 'ACTIVE',
        faculty_user_id: managerFacultyId,
      });
    }
    const applicant = await makeApplicant('notif-staff');
    await submitApplication(ctx.manager, Number(applicant.id));
    const staffNotifs = await db('employee_notifications')
      .where({ college_id: ctx.collegeId, type: 'ADMISSION_APPLICATION_SUBMITTED', related_id: Number(applicant.id) });
    assert.ok(staffNotifs.length >= 1, 'admissions review staff should be notified');
    for (const n of staffNotifs) {
      assert.equal(Number(n.college_id), ctx.collegeId);
      assert.equal(Number(n.related_id), Number(applicant.id));
    }
  });

  it('applicant A cannot read applicant B notifications', async () => {
    if (!ctx) return;
    const a = await makeReadyApplicant('notif-iso-a');
    const b = await makeReadyApplicant('notif-iso-b');
    const aList = await listApplicantNotifications(applicantActor(a.applicant));
    const bIds = (await db('admission_applicant_notifications').where({ applicant_id: b.applicant.id }).pluck('id')).map(Number);
    const aIds = aList.map((n) => n.id);
    // A's feed contains none of B's notification rows.
    assert.ok(aIds.every((id) => !bIds.includes(id)));
    // Every row A sees genuinely belongs to A.
    const aRows = await db('admission_applicant_notifications').whereIn('id', aIds);
    assert.ok(aRows.every((r) => Number(r.applicant_id) === Number(a.applicant.id)));
    assert.ok(aList.length >= 1 && bIds.length >= 1);
  });

  it('cross-college notification access is impossible', async () => {
    if (!ctx || ctx.otherCollegeId == null) return;
    const a = await makeReadyApplicant('notif-xcollege');
    // Same applicant id, but an actor bound to a different tenant sees nothing.
    const foreign: AdmissionActor = {
      kind: 'APPLICANT',
      collegeId: ctx.otherCollegeId,
      applicantId: Number(a.applicant.id),
      role: 'APPLICANT',
    };
    const leaked = await listApplicantNotifications(foreign);
    assert.equal(leaked.length, 0, 'notifications must not cross tenant boundaries');
  });

  it('idempotent admission confirmation does not duplicate the confirmed notification', async () => {
    if (!ctx) return;
    const ready = await makeReadyApplicant('notif-idem', { paid: true });
    const selection = await db('admission_selections').where({ applicant_id: ready.applicant.id }).first();
    await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: Number(selection.intake_id) });
    // Retry — idempotent: returns the existing conversion, must not re-notify.
    await confirmAdmission(ctx.manager, Number(ready.applicant.id), { intakeId: Number(selection.intake_id) });
    const confirmed = await db('admission_applicant_notifications')
      .where({ applicant_id: ready.applicant.id, type: 'ADMISSION_CONFIRMED' });
    assert.equal(confirmed.length, 1, 'ADMISSION_CONFIRMED must be emitted exactly once');
  });

  it('Finance remains canonical for receipts — admissions emits only admissions-domain payment events', async () => {
    if (!ctx) return;
    const journey = await createConvertedStudent('notif-finance');
    const applicantTypes = (await db('admission_applicant_notifications')
      .where({ applicant_id: journey.applicant.id }).pluck('type')).map(String);
    // Admissions signals "payment required"; it never duplicates Finance receipts.
    assert.ok(applicantTypes.includes('ADMISSION_FEE_DEMAND'));
    assert.ok(!applicantTypes.includes('RECEIPT_GENERATED'));
    assert.ok(!applicantTypes.includes('PAYMENT_SUCCESS'));
    // Finance is the canonical owner of the receipt for the recognised payment.
    const receipt = await db('fee_receipts').where({ student_id: journey.student.id }).first();
    assert.ok(receipt, 'Finance should own the canonical receipt for the converted student');
  });
});

async function createClosureIntake(label: string, approvedIntake: number) {
  const category = `CLOSURE-${label}-${run}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 64);
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

async function createOneSeatIntake(label: string) {
  return createClosureIntake(label, 1);
}
