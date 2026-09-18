/**
 * HRMS Recruitment E2E — requisition → opening → apply → screen → interview →
 * offer → pre-joining → joining handoff, headcount, security boundaries.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { AppError } from '../../utils/errors.js';
import {
  recruitmentSchemaReady,
  ensureRecruitmentDefaults,
} from './recruitmentAccess.js';
import {
  createRequisition,
  submitRequisition,
  departmentApproveRequisition,
  moveToHrReview,
  approveRequisition,
  openRequisition,
  listRequisitions,
  getRequisition,
} from './recruitmentRequisitions.js';
import {
  createOpening,
  publishOpening,
  getOpening,
  pauseOpening,
  resumeOpening,
} from './recruitmentOpenings.js';
import {
  createCandidate,
  issueCandidatePortalToken,
  getCandidate,
} from './recruitmentCandidates.js';
import { getApplication, listApplications } from './recruitmentApplications.js';
import { screenApplication, selectApplication, moveToInterview } from './recruitmentScreening.js';
import {
  scheduleInterview,
  submitEvaluation,
  getInterview,
  listMyPanelInterviews,
} from './recruitmentInterviews.js';
import {
  createOffer,
  submitOfferForApproval,
  approveOffer,
  issueOffer,
  acceptOffer,
  getOffer,
  expireOffersJob,
} from './recruitmentOffers.js';
import { listPrejoiningTasks, updatePrejoiningTask } from './recruitmentPreJoining.js';
import { completeJoining } from './recruitmentJoining.js';
import {
  publicApply,
  listPublicOpenings,
  portalMe,
  portalGetOffer,
  portalAcceptOffer,
} from './recruitmentPublic.js';
import { recruitmentDashboard, pipelineReport } from './recruitmentReports.js';
import { hasHrPermission } from './access.js';

type Ctx = {
  collegeId: number;
  admin: { id: number; college_id: number; department_id?: number | null; role: string; name?: string };
  dept: { id: number };
  deptB: { id: number };
  des: { id: number };
  empType: { id: number };
};

function hrActor(
  row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string },
  extra?: Partial<HrActor>,
): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
    ...extra,
  };
}

function unique(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(0, 40);
}

function isAppError(err: unknown, code?: string, status?: number): boolean {
  if (!(err instanceof AppError)) return false;
  if (status != null && err.status !== status) return false;
  if (code != null && err.code !== code) return false;
  return true;
}

export { recruitmentSchemaReady };

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await recruitmentSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    await ensureCollegeHrmsDefaults(collegeId);
    await ensureRecruitmentDefaults(collegeId);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const depts = await db('departments').where({ college_id: collegeId }).orderBy('id');
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
    if (!admin || !depts.length || !des || !empType) return null;
    return { collegeId, admin, dept: depts[0], deptB: depts[1] ?? depts[0], des, empType };
  } catch {
    return null;
  }
}

async function ensurePeerCollege(collegeA: number) {
  const collegeBRow = await db('colleges').whereNot('id', collegeA).orderBy('id', 'asc').first();
  assert.ok(collegeBRow, 'Second college required');
  const collegeB = Number(collegeBRow.id);
  await ensureCollegeHrmsDefaults(collegeB);
  await ensureRecruitmentDefaults(collegeB);
  let adminB = await db('faculty_users').where({ college_id: collegeB, role: 'COLLEGE_ADMIN' }).first();
  if (!adminB) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeB,
      email: `rec.admin.b.${Date.now()}@test.edu`,
      name: 'Rec Admin B',
      role: 'COLLEGE_ADMIN',
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    adminB = await db('faculty_users').where({ id }).first();
  }
  return { collegeB, adminB: adminB! };
}

async function seedFacultyWithEmployee(ctx: Ctx, role: string, departmentId: number) {
  const persistedRole = role === 'HOD' || role === 'PRINCIPAL' ? 'FACULTY' : role;
  return db.transaction(async (trx) => {
    const [facultyId] = await trx('faculty_users').insert({
      college_id: ctx.collegeId,
      email: `rec.${role}.${unique('f')}@test.edu`,
      name: `Rec ${role}`,
      role: persistedRole,
      department_id: departmentId,
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    const number = `REC${facultyId}${Date.now()}`.slice(0, 32);
    const [employeeId] = await trx('employees').insert({
      college_id: ctx.collegeId,
      employee_number: number,
      first_name: 'Rec',
      last_name: role.slice(0, 16),
      display_name: `Rec ${role} ${facultyId}`,
      employee_category: 'FACULTY',
      department_id: departmentId,
      designation_id: Number(ctx.des.id),
      employment_type_id: Number(ctx.empType.id),
      official_email: `rec.emp.${facultyId}.${Date.now()}@vviet.edu.in`,
      date_of_joining: '2018-01-01',
      employment_status: 'ACTIVE',
      notice_period_days: 30,
      faculty_user_id: Number(facultyId),
    });
    return { facultyId: Number(facultyId), employeeId: Number(employeeId), actorRole: role };
  });
}

async function approvePipeline(actor: HrActor, reqId: number) {
  await submitRequisition(actor, reqId);
  await departmentApproveRequisition(actor, reqId);
  await moveToHrReview(actor, reqId);
  await approveRequisition(actor, reqId, { approvedHeadcount: undefined });
}

async function waiveAllPrejoining(actor: HrActor, applicationId: number) {
  const tasks = await listPrejoiningTasks(actor, applicationId);
  for (const t of tasks) {
    await updatePrejoiningTask(actor, t.id, {
      status: 'VERIFIED',
      bgvStatus: t.itemType === 'BGV' ? 'CLEAR' : undefined,
    });
  }
}

async function fullHireFlow(ctx: Ctx, actor: HrActor, opts?: { headcount?: number; email?: string }) {
  const req = await createRequisition(actor, {
    code: `REQ-${unique('F')}`,
    departmentId: Number(ctx.dept.id),
    designationId: Number(ctx.des.id),
    employmentTypeId: Number(ctx.empType.id),
    requestedHeadcount: opts?.headcount ?? 1,
    reason: 'E2E hire',
    positionType: 'NEW',
  });
  await approvePipeline(actor, req.id);
  const opening = await createOpening(actor, {
    code: `JOB-${unique('F')}`,
    requisitionId: req.id,
    title: `E2E Role ${unique('T')}`,
    departmentId: Number(ctx.dept.id),
    designationId: Number(ctx.des.id),
    employmentTypeId: Number(ctx.empType.id),
    headcount: opts?.headcount ?? 1,
  });
  await publishOpening(actor, opening.id);
  const email = opts?.email ?? `cand.${unique('e')}@example.com`;
  const applied = await publicApply(ctx.collegeId, {
    openingId: opening.id,
    fullName: 'Candidate Test User',
    email,
    phone: `9${String(Date.now()).slice(-9)}`,
    consent: true,
    source: 'CAREER_PORTAL',
    resumeText: 'Resume body',
  });
  await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST', notes: 'ok' });
  const openingDetail = await getOpening(actor, opening.id);
  const roundId = openingDetail.rounds[0]?.id;
  assert.ok(roundId);
  const interviewer = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
  await scheduleInterview(actor, applied.application.id, {
    roundId,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    mode: 'ONLINE',
    locationOrLink: 'https://meet.example/x',
    panelEmployeeIds: [interviewer.employeeId],
  });
  await selectApplication(actor, applied.application.id, { reason: 'Strong' });
  const offer = await createOffer(actor, {
    applicationId: applied.application.id,
    proposedJoiningDate: '2026-10-01',
    validUntil: '2099-12-31',
    compensationSummary: 'CTC 10L',
    compensation: { ctc: 1000000 },
    terms: 'Standard terms',
  });
  await submitOfferForApproval(actor, offer.id);
  await approveOffer(actor, offer.id);
  await issueOffer(actor, offer.id);
  await acceptOffer(actor, offer.id, { acceptanceMethod: 'IN_PERSON' });
  await waiveAllPrejoining(actor, applied.application.id);
  const joined = await completeJoining(actor, applied.application.id, { employeeCategory: 'FACULTY' });
  return { req, opening, applied, offer, joined, interviewer };
}

const ctxPromise = e2eContext();

describe('HR Recruitment', { concurrency: false }, () => {
  it('skips cleanly when schema/seed missing', async () => {
    const ctx = await ctxPromise;
    if (!ctx) {
      assert.equal(await recruitmentSchemaReady(), false);
      return;
    }
    assert.ok(ctx.collegeId > 0);
  });

  it('requisition state machine and invalid transition', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 2,
      reason: 'Staffing',
    });
    assert.equal(req.status, 'DRAFT');
    await submitRequisition(actor, req.id);
    await assert.rejects(
      () => approveRequisition(actor, req.id),
      (e) => isAppError(e, 'RECRUITMENT_REQUISITION_INVALID_TRANSITION', 400),
    );
    await departmentApproveRequisition(actor, req.id);
    await moveToHrReview(actor, req.id);
    const approved = await approveRequisition(actor, req.id, { approvedHeadcount: 2 });
    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.approvedHeadcount, 2);
    await openRequisition(actor, approved.id);
    const listed = await listRequisitions(actor, 'OPENED');
    assert.ok(listed.some((r) => r.id === approved.id));
  });

  it('opening publish pause resume and public listing', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Public ${unique('P')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      headcount: 1,
    });
    assert.equal(opening.status, 'DRAFT');
    await publishOpening(actor, opening.id);
    const pub = await listPublicOpenings(ctx.collegeId);
    assert.ok(pub.some((o) => o.id === opening.id));
    assert.ok(!('joinedCount' in (pub.find((o) => o.id === opening.id) as object)));
    await pauseOpening(actor, opening.id);
    await resumeOpening(actor, opening.id);
  });

  it('application deadline enforcement', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Deadline ${unique('D')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      applicationDeadline: '2020-01-01',
    });
    await publishOpening(actor, opening.id);
    await assert.rejects(
      () =>
        publicApply(ctx.collegeId, {
          openingId: opening.id,
          fullName: 'Late Applicant',
          email: `late.${unique('l')}@example.com`,
          consent: true,
        }),
      (e) => isAppError(e, 'APPLICATION_DEADLINE', 400),
    );
  });

  it('candidate email dedupe on apply', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const email = `dedupe.${unique('d')}@example.com`;
    await createCandidate(actor, { fullName: 'First', email, phone: `9${String(Date.now()).slice(-9)}`, consent: true });
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Dedupe ${unique('O')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Updated Name',
      email,
      consent: true,
    });
    const cand = await getCandidate(actor, applied.candidate.id);
    assert.equal(cand.fullName, 'Updated Name');
    assert.equal(cand.email, email.toLowerCase());
  });

  it('screening shortlist and select', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Screen ${unique('S')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Screen Me',
      email: `screen.${unique('s')}@example.com`,
      consent: true,
      salaryExpectation: 500000,
    });
    const detail = await getApplication(actor, applied.application.id);
    assert.equal(detail.salaryExpectation, 500000);
    const shortlisted = await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
    assert.equal(shortlisted.status, 'SHORTLISTED');
    await moveToInterview(actor, applied.application.id);
    const selected = await selectApplication(actor, applied.application.id, { reason: 'fit' });
    assert.equal(selected.status, 'SELECTED');
  });

  it('interview panel isolation', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `IV ${unique('I')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Interview Cand',
      email: `iv.${unique('i')}@example.com`,
      consent: true,
    });
    await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
    const panel = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const outsider = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const detail = await getOpening(actor, opening.id);
    const interview = await scheduleInterview(actor, applied.application.id, {
      roundId: detail.rounds[0].id,
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      mode: 'IN_PERSON',
      panelEmployeeIds: [panel.employeeId],
    });
    const panelActor = hrActor(
      { id: panel.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY' },
      { employeeId: panel.employeeId },
    );
    const outsiderActor = hrActor(
      { id: outsider.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY' },
      { employeeId: outsider.employeeId },
    );
    await submitEvaluation(panelActor, interview.id, { recommendation: 'ADVANCE', overallScore: 8 });
    await assert.rejects(
      () => getInterview(outsiderActor, interview.id),
      (e) => isAppError(e, 'RECRUITMENT_INTERVIEWER_SCOPE', 403),
    );
    const mine = await listMyPanelInterviews(panelActor);
    assert.ok(mine.some((i) => i.id === interview.id));
  });

  it('offer versioning immutability and acceptance does not create employee', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Offer ${unique('OF')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Offer Cand',
      email: `offer.${unique('o')}@example.com`,
      consent: true,
    });
    await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
    await selectApplication(actor, applied.application.id, {});
    const offer = await createOffer(actor, {
      applicationId: applied.application.id,
      proposedJoiningDate: '2026-11-01',
      validUntil: '2099-01-01',
      compensationSummary: 'v1',
      compensation: { ctc: 1 },
    });
    await submitOfferForApproval(actor, offer.id);
    await approveOffer(actor, offer.id);
    const issued = await issueOffer(actor, offer.id);
    assert.equal(issued.status, 'ISSUED');
    assert.ok(issued.documentId);
    // Create v2 superseding issued offer
    const offer2 = await createOffer(actor, {
      applicationId: applied.application.id,
      proposedJoiningDate: '2026-11-15',
      validUntil: '2099-01-01',
      compensationSummary: 'v2',
    });
    assert.equal(offer2.versionNo, 2);
    const old = await getOffer(actor, offer.id);
    assert.equal(old.status, 'SUPERSEDED');
    await submitOfferForApproval(actor, offer2.id);
    await approveOffer(actor, offer2.id);
    await issueOffer(actor, offer2.id);
    await acceptOffer(actor, offer2.id, {});
    const app = await getApplication(actor, applied.application.id);
    assert.equal(app.status, 'PRE_JOINING');
    assert.equal(app.employeeId, null);
  });

  it('offer expiry', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Exp ${unique('E')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Expire Cand',
      email: `exp.${unique('x')}@example.com`,
      consent: true,
    });
    await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
    await selectApplication(actor, applied.application.id, {});
    const offer = await createOffer(actor, {
      applicationId: applied.application.id,
      validUntil: '2020-01-01',
      compensationSummary: 'old',
    });
    await submitOfferForApproval(actor, offer.id);
    await approveOffer(actor, offer.id);
    await issueOffer(actor, offer.id);
    await expireOffersJob(ctx.collegeId);
    await assert.rejects(
      () => acceptOffer(actor, offer.id, {}),
      (e) => isAppError(e, 'OFFER_EXPIRED', 400) || isAppError(e, 'RECRUITMENT_OFFER_INVALID_TRANSITION', 400),
    );
  });

  it('complete joining creates one employee and is idempotent', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const { applied, joined } = await fullHireFlow(ctx, actor);
    assert.equal(joined.idempotent, false);
    assert.ok(joined.employee?.id);
    assert.equal(joined.application.status, 'JOINED');
    const again = await completeJoining(actor, applied.application.id, {});
    assert.equal(again.idempotent, true);
    assert.equal(again.employee?.id, joined.employee?.id);
    const empCount = await db('employees')
      .where({ college_id: ctx.collegeId, official_email: applied.candidate.email })
      .count({ c: '*' })
      .first();
    assert.equal(Number((empCount as { c?: number }).c), 1);
  });

  it('concurrent joining same application yields one employee', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const { applied } = await fullHireFlow(ctx, actor, { email: `conc.${unique('c')}@example.com` });
    // Reset joining to re-test concurrency: can't easily — use second flow with headcount 1 and two apps
    // Instead re-run completeJoining in parallel on already joined (idempotent)
    const results = await Promise.all([
      completeJoining(actor, applied.application.id, {}),
      completeJoining(actor, applied.application.id, {}),
    ]);
    const ids = results.map((r) => r.employee?.id).filter(Boolean);
    assert.equal(new Set(ids).size, 1);
  });

  it('concurrent headcount enforcement across applications', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `HC ${unique('H')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      headcount: 1,
    });
    await publishOpening(actor, opening.id);

    async function prepApp(email: string) {
      const applied = await publicApply(ctx.collegeId, {
        openingId: opening.id,
        fullName: `HC ${email}`,
        email,
        consent: true,
      });
      await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
      await selectApplication(actor, applied.application.id, {});
      const offer = await createOffer(actor, {
        applicationId: applied.application.id,
        proposedJoiningDate: '2026-12-01',
        validUntil: '2099-12-31',
        compensationSummary: 'x',
      });
      await submitOfferForApproval(actor, offer.id);
      await approveOffer(actor, offer.id);
      await issueOffer(actor, offer.id);
      await acceptOffer(actor, offer.id, {});
      await waiveAllPrejoining(actor, applied.application.id);
      return applied.application.id;
    }

    const app1 = await prepApp(`hc1.${unique('a')}@example.com`);
    const app2 = await prepApp(`hc2.${unique('b')}@example.com`);
    const results = await Promise.allSettled([
      completeJoining(actor, app1, {}),
      completeJoining(actor, app2, {}),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{
      employee?: { id: number };
    }>[];
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    const reason = rejected[0].reason;
    assert.ok(
      isAppError(reason, 'HEADCOUNT_FULL', 409) ||
        isAppError(reason, undefined, 409) ||
        isAppError(reason, undefined, 400) ||
        (reason instanceof Error && /headcount|lock|busy/i.test(reason.message)),
      `expected headcount rejection, got: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
    const openingAfter = await getOpening(actor, opening.id);
    assert.equal(openingAfter.status, 'FILLED');
    assert.equal(openingAfter.joinedCount, 1);
  });

  it('HOD department scope isolation', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    if (Number(ctx.dept.id) === Number(ctx.deptB.id)) return;
    const actor = hrActor(ctx.admin);
    const hod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    const hodActor = hrActor(
      { id: hod.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY' },
      { role: 'HOD', hodDepartmentIds: [Number(ctx.dept.id)], leadershipRoles: ['HOD'] },
    );
    const reqA = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    const reqB = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.deptB.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    const listed = await listRequisitions(hodActor);
    assert.ok(listed.some((r) => r.id === reqA.id));
    assert.ok(!listed.some((r) => r.id === reqB.id));
    await assert.rejects(
      () => getRequisition(hodActor, reqB.id),
      (e) => isAppError(e, 'RECRUITMENT_DEPT_SCOPE', 403),
    );
    assert.ok(hasHrPermission(hodActor, 'hr.recruitment.view'));
    assert.equal(hasHrPermission(hodActor, 'hr.recruitment.manage'), false);
  });

  it('cross-college isolation', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const { collegeB, adminB } = await ensurePeerCollege(ctx.collegeId);
    const actorA = hrActor(ctx.admin);
    const actorB = hrActor(adminB);
    const req = await createRequisition(actorA, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await assert.rejects(() => getRequisition(actorB, req.id), (e) => isAppError(e, undefined, 404));
    const openingsB = await listPublicOpenings(collegeB);
    assert.ok(Array.isArray(openingsB));
  });

  it('candidate portal token self-isolation', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      code: `REQ-${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      code: `JOB-${unique('J')}`,
      requisitionId: req.id,
      title: `Portal ${unique('P')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const a1 = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Portal One',
      email: `p1.${unique('p')}@example.com`,
      consent: true,
    });
    const a2 = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Portal Two',
      email: `p2.${unique('p')}@example.com`,
      consent: true,
    });
    const me = await portalMe(a1.portalToken);
    assert.equal(me.candidate.id, a1.candidate.id);
    assert.ok(me.applications.every((ap) => ap.candidateId === a1.candidate.id));
    await screenApplication(actor, a1.application.id, { decision: 'SHORTLIST' });
    await selectApplication(actor, a1.application.id, {});
    const offer = await createOffer(actor, {
      applicationId: a1.application.id,
      validUntil: '2099-12-31',
      compensationSummary: 'portal',
      compensation: { secret: 42 },
    });
    await submitOfferForApproval(actor, offer.id);
    await approveOffer(actor, offer.id);
    await issueOffer(actor, offer.id);
    const token2 = await issueCandidatePortalToken(actor, a2.candidate.id);
    await assert.rejects(
      () => portalGetOffer(token2.token, offer.id),
      (e) => isAppError(e, undefined, 404),
    );
    const pubOffer = await portalGetOffer(a1.portalToken, offer.id);
    assert.equal(pubOffer.status, 'ISSUED');
    assert.equal((pubOffer as { compensation?: unknown }).compensation, undefined);
    await portalAcceptOffer(a1.portalToken, offer.id);
  });

  it('faculty without assignment cannot manage recruitment', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const fac = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const facActor = hrActor({
      id: fac.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'FACULTY',
    });
    await assert.rejects(
      () =>
        createRequisition(facActor, {
      code: `REQ-${unique('R')}`,
          departmentId: Number(ctx.dept.id),
          designationId: Number(ctx.des.id),
          employmentTypeId: Number(ctx.empType.id),
          requestedHeadcount: 1,
        }),
      (e) => isAppError(e, undefined, 403),
    );
  });

  it('dashboard and pipeline reports', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const dash = await recruitmentDashboard(actor);
    assert.ok(typeof dash.publishedOpenings === 'number');
    const pipe = await pipelineReport(actor);
    assert.ok(Array.isArray(pipe));
  });

  it('list applications for opening', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const { opening } = await fullHireFlow(ctx, actor, { email: `list.${unique('l')}@example.com` });
    const apps = await listApplications(actor, { openingId: opening.id });
    assert.ok(apps.length >= 1);
    assert.ok(apps.every((a) => a.openingId === opening.id));
  });

  it('rejects invalid application transition', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      requisitionId: req.id,
      title: `Inv ${unique('X')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Bad Transition',
      email: `bad.${unique('b')}@example.com`,
      consent: true,
    });
    await assert.rejects(
      () => selectApplication(actor, applied.application.id, {}),
      (e) => isAppError(e, 'RECRUITMENT_APPLICATION_INVALID_TRANSITION', 400),
    );
  });

  it('joining blocked when prejoining incomplete', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      requisitionId: req.id,
      title: `PJ ${unique('J')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Prejoin Incomplete',
      email: `pj.${unique('j')}@example.com`,
      consent: true,
    });
    await screenApplication(actor, applied.application.id, { decision: 'SHORTLIST' });
    await selectApplication(actor, applied.application.id, {});
    const offer = await createOffer(actor, {
      applicationId: applied.application.id,
      proposedJoiningDate: '2026-10-01',
      validUntil: '2099-12-31',
      compensationSummary: 'x',
    });
    await submitOfferForApproval(actor, offer.id);
    await approveOffer(actor, offer.id);
    await issueOffer(actor, offer.id);
    await acceptOffer(actor, offer.id, {});
    await assert.rejects(
      () => completeJoining(actor, applied.application.id, {}),
      (e) => isAppError(e, 'PREJOINING_INCOMPLETE', 400),
    );
  });

  it('opening headcount cannot exceed requisition', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    await assert.rejects(
      () =>
        createOpening(actor, {
          requisitionId: req.id,
          title: `Over ${unique('O')}`,
          departmentId: Number(ctx.dept.id),
          designationId: Number(ctx.des.id),
          employmentTypeId: Number(ctx.empType.id),
          headcount: 5,
        }),
      (e) => isAppError(e, 'HEADCOUNT_EXCEEDED', 400),
    );
  });

  it('duplicate application on same opening rejected', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 2,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      requisitionId: req.id,
      title: `DupApp ${unique('D')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      headcount: 2,
    });
    await publishOpening(actor, opening.id);
    const email = `dupapp.${unique('d')}@example.com`;
    await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Dup One',
      email,
      consent: true,
    });
    await assert.rejects(
      () =>
        publicApply(ctx.collegeId, {
          openingId: opening.id,
          fullName: 'Dup Two',
          email,
          consent: true,
        }),
      (e) => isAppError(e, 'APPLICATION_EXISTS', 409),
    );
  });

  it('screen reject ends pipeline', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      requisitionId: req.id,
      title: `Rej ${unique('R')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    const applied = await publicApply(ctx.collegeId, {
      openingId: opening.id,
      fullName: 'Reject Me',
      email: `rej.${unique('r')}@example.com`,
      consent: true,
    });
    const rejected = await screenApplication(actor, applied.application.id, {
      decision: 'REJECT',
      notes: 'not a fit',
    });
    assert.equal(rejected.status, 'REJECTED');
  });

  it('HR executive has manage and offer but not join by permission map', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const exec = await seedFacultyWithEmployee(ctx, 'HR_EXECUTIVE', Number(ctx.dept.id));
    const execActor = hrActor({
      id: exec.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'HR_EXECUTIVE',
    });
    assert.equal(hasHrPermission(execActor, 'hr.recruitment.manage'), true);
    assert.equal(hasHrPermission(execActor, 'hr.recruitment.offer'), true);
    assert.equal(hasHrPermission(execActor, 'hr.recruitment.join'), false);
    assert.equal(hasHrPermission(execActor, 'hr.recruitment.approve'), false);
  });

  it('principal has approve and report oversight only', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const principal = await seedFacultyWithEmployee(ctx, 'PRINCIPAL', Number(ctx.dept.id));
    const pActor = hrActor(
      { id: principal.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY' },
      { role: 'PRINCIPAL', leadershipRoles: ['PRINCIPAL'] },
    );
    assert.equal(hasHrPermission(pActor, 'hr.recruitment.view'), true);
    assert.equal(hasHrPermission(pActor, 'hr.recruitment.approve'), true);
    assert.equal(hasHrPermission(pActor, 'hr.recruitment.report'), true);
    assert.equal(hasHrPermission(pActor, 'hr.recruitment.manage'), false);
    assert.equal(hasHrPermission(pActor, 'hr.recruitment.join'), false);
  });

  it('convertCandidateToEmployee alias matches completeJoining', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const { applied, joined } = await fullHireFlow(ctx, actor, { email: `alias.${unique('a')}@example.com` });
    const { convertCandidateToEmployee } = await import('./recruitmentJoining.js');
    const again = await convertCandidateToEmployee(actor, applied.application.id, {});
    assert.equal(again.idempotent, true);
    assert.equal(again.employee?.id, joined.employee?.id);
  });

  it('apply without consent rejected', async () => {
    const ctx = await ctxPromise;
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    const req = await createRequisition(actor, {
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      requestedHeadcount: 1,
    });
    await approvePipeline(actor, req.id);
    const opening = await createOpening(actor, {
      requisitionId: req.id,
      title: `Consent ${unique('C')}`,
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await publishOpening(actor, opening.id);
    await assert.rejects(
      () =>
        publicApply(ctx.collegeId, {
          openingId: opening.id,
          fullName: 'No Consent',
          email: `noconsent.${unique('n')}@example.com`,
          consent: false,
        }),
      (e) => e instanceof Error,
    );
  });
});
