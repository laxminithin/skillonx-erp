/**
 * Deterministic Admissions QA seed.
 *
 * Idempotent. Reuses the Student-LMS E2E academic setup where available and
 * creates only admissions-specific applicants plus role users.
 */
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import { createAdmissionApplicantDemand } from '../modules/finance/demands.js';

const QA_PASSWORD_HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq'; // Password123

async function ensureFaculty(collegeId: number, departmentId: number | null, email: string, name: string, role: string) {
  let user = await db('faculty_users').where({ email }).first();
  if (!user) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      department_id: departmentId,
      email,
      name,
      role,
      password_hash: QA_PASSWORD_HASH,
      is_active: true,
      employee_id: `QA-${role}-${Date.now()}`.slice(0, 32),
    });
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update({ role, department_id: departmentId, password_hash: QA_PASSWORD_HASH, is_active: true });
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user!;
}

async function ensureCycle(collegeId: number, academicYearId: number) {
  let cycle = await db('admission_cycles').where({ college_id: collegeId, name: 'QA Admissions Cycle 2026' }).first();
  if (!cycle) {
    const [id] = await db('admission_cycles').insert({
      college_id: collegeId,
      academic_year_id: academicYearId,
      name: 'QA Admissions Cycle 2026',
      application_start: '2026-09-01',
      application_end: '2026-12-31',
      admission_start: '2026-09-15',
      admission_end: '2027-01-15',
      status: 'OPEN',
    });
    cycle = await db('admission_cycles').where({ id }).first();
  }
  return cycle!;
}

async function ensureIntake(collegeId: number, cycleId: number, cls: Record<string, unknown>) {
  let intake = await db('admission_program_intakes')
    .where({ college_id: collegeId, cycle_id: cycleId, program_id: cls.program_id, category: 'GENERAL' })
    .first();
  if (!intake) {
    const [id] = await db('admission_program_intakes').insert({
      college_id: collegeId,
      cycle_id: cycleId,
      academic_year_id: cls.academic_year_id,
      program_id: cls.program_id,
      department_id: cls.department_id,
      scheme_id: cls.scheme_id,
      semester_id: cls.semester_id,
      class_section_id: cls.class_section_id,
      category: 'GENERAL',
      approved_intake: 60,
    });
    intake = await db('admission_program_intakes').where({ id }).first();
  }
  return intake!;
}

async function ensureRequirement(collegeId: number, cycleId: number, programId: number) {
  let req = await db('admission_document_requirements').where({ college_id: collegeId, cycle_id: cycleId, program_id: programId, document_code: 'MARKS_CARD' }).first();
  if (!req) {
    const [id] = await db('admission_document_requirements').insert({
      college_id: collegeId,
      cycle_id: cycleId,
      program_id: programId,
      document_code: 'MARKS_CARD',
      name: 'Qualifying Examination Marks Card',
      is_required: true,
      allowed_mime_types: JSON.stringify(['application/pdf', 'image/png', 'image/jpeg']),
      max_size_bytes: 5_000_000,
    });
    req = await db('admission_document_requirements').where({ id }).first();
  }
  return req!;
}

async function ensureApplicant(collegeId: number, cycleId: number, programId: number, index: number, name: string, status: string) {
  const applicationNumber = `QA/ADM/2026/${String(index).padStart(3, '0')}`;
  const email = `qa.admission.${index}@example.edu`;
  let applicant = await db('admission_applicants').where({ college_id: collegeId, application_number: applicationNumber }).first();
  if (!applicant) {
    const [id] = await db('admission_applicants').insert({
      college_id: collegeId,
      cycle_id: cycleId,
      application_number: applicationNumber,
      name,
      email,
      phone: `90000000${String(index).padStart(2, '0')}`,
      status,
      submitted_at: status === 'DRAFT' ? null : db.fn.now(),
      password_hash: QA_PASSWORD_HASH,
      portal_status: 'ACTIVE',
    });
    await db('admission_applicant_education').insert({
      college_id: collegeId,
      applicant_id: id,
      qualification: 'PUC / Class XII',
      institution: 'QA PU College',
      marks_percentage: 88,
      subjects_json: JSON.stringify([{ name: 'Mathematics' }, { name: 'Physics' }]),
    });
    await db('admission_program_preferences').insert({ college_id: collegeId, applicant_id: id, program_id: programId, preference_order: 1 });
    applicant = await db('admission_applicants').where({ id }).first();
  } else {
    await db('admission_applicants').where({ id: applicant.id }).update({ status, password_hash: QA_PASSWORD_HASH, portal_status: 'ACTIVE' });
    applicant = await db('admission_applicants').where({ id: applicant.id }).first();
  }
  return applicant!;
}

export async function seedAdmissionsQa(options: { closeDb?: boolean } = {}) {
  if (!(await db.schema.hasTable('admission_applicants'))) {
    console.log('Admissions tables absent; run migrations first.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  if (!cls) {
    console.log('SX-E2E-CSE-3A class absent; run seed:student-lms-e2e first.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const collegeId = Number(cls.college_id);
  const departmentId = cls.department_id != null ? Number(cls.department_id) : null;
  await ensureFaculty(collegeId, departmentId, 'qa.admissions.officer@example.edu', 'QA Admissions Officer', 'ADMISSIONS_OFFICER');
  const manager = await ensureFaculty(collegeId, departmentId, 'qa.admissions.manager@example.edu', 'QA Admissions Manager', 'ADMISSIONS_MANAGER');
  await ensureFaculty(collegeId, departmentId, 'qa.admissions.accountant@example.edu', 'QA Admissions Accountant', 'ACCOUNTANT');
  await ensureFaculty(collegeId, departmentId, 'qa.admissions.management@example.edu', 'QA Admissions Management', 'MANAGEMENT');

  const cycle = await ensureCycle(collegeId, Number(cls.academic_year_id));
  const intake = await ensureIntake(collegeId, Number(cycle.id), cls);
  const requirement = await ensureRequirement(collegeId, Number(cycle.id), Number(cls.program_id));

  const states = [
    ['Applicant A Draft', 'DRAFT'],
    ['Applicant B Submitted', 'SUBMITTED'],
    ['Applicant C Rejected Document', 'DOCUMENTS_PENDING'],
    ['Applicant D Eligible', 'ELIGIBLE'],
    ['Applicant E Selected', 'SELECTED'],
    ['Applicant F Payment Pending', 'PAYMENT_PENDING'],
    ['Applicant G Ready To Confirm', 'OFFERED'],
    ['Applicant H Converted', 'CONVERTED_TO_STUDENT'],
    ['Applicant I Waitlisted', 'WAITLISTED'],
    ['Applicant J Cancelled', 'CANCELLED'],
  ] as const;

  const applicants = [];
  for (let i = 0; i < states.length; i++) {
    const applicant = await ensureApplicant(collegeId, Number(cycle.id), Number(cls.program_id), i + 1, states[i][0], states[i][1]);
    applicants.push(applicant);
    const existingDoc = await db('admission_documents').where({ applicant_id: applicant.id, requirement_id: requirement.id }).first();
    if (!existingDoc && states[i][1] !== 'DRAFT') {
      await db('admission_documents').insert({
        college_id: collegeId,
        applicant_id: applicant.id,
        requirement_id: requirement.id,
        file_name: `${applicant.application_number}-marks.pdf`,
        mime_type: 'application/pdf',
        file_size_bytes: 120000,
        storage_key: `secure/admissions/${applicant.id}/marks.pdf`,
        verification_status: i === 2 ? 'RESUBMISSION_REQUIRED' : 'VERIFIED',
        verified_by: Number(manager.id),
      });
    }
  }

  const feeHead = await db('fee_heads').where({ college_id: collegeId }).first();
  if (feeHead) {
    await createAdmissionApplicantDemand(collegeId, {
      applicantId: Number(applicants[5].id),
      academicYearId: Number(intake.academic_year_id),
      semesterId: intake.semester_id != null ? Number(intake.semester_id) : undefined,
      feeHeadId: Number(feeHead.id),
      amount: 25000,
      createdBy: Number(manager.id),
    });
  }

  console.log('Admissions QA seed ready:', { collegeId, cycleId: Number(cycle.id), intakeId: Number(intake.id), applicants: applicants.length });
  if (options.closeDb) await db.destroy();
  return { collegeId, cycleId: Number(cycle.id), intakeId: Number(intake.id), applicants: applicants.length };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  seedAdmissionsQa({ closeDb: true }).catch(async (err) => {
    console.error(err);
    await db.destroy();
    process.exit(1);
  });
}
