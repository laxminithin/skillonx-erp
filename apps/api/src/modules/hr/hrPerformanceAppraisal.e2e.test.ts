/**
 * HRMS Performance & Appraisal E2E.
 * Covers cycles/templates, eligibility, goals, self/review, calibration,
 * evidence snapshots, finalize/reopen, and security boundaries.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { AppError } from '../../utils/errors.js';
import {
  appraisalSchemaReady,
  createCycle,
  createTemplate,
  publishTemplate,
  versionTemplate,
  enrollEligibleEmployees,
  createGoal,
  updateGoal,
  submitGoals,
  decideGoal,
  lockGoals,
  getAppraisalDetail,
  saveSelfAppraisal,
  saveReview,
  calibrateAppraisal,
  finalizeAppraisal,
  lockAppraisal,
  reopenAppraisal,
  ensureDefaultRatingScale,
  listRatingScales,
} from './appraisal.js';
import { collectEvidenceForEmployee, getSnapshots } from './appraisalEvidence.js';
import { resolveAppraisalReviewer } from './appraisalReviewer.js';
import { validateTemplateWeights } from './appraisalScore.js';

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

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isAppError(err: unknown, code?: string, status?: number): boolean {
  if (!(err instanceof AppError)) return false;
  if (status != null && err.status !== status) return false;
  if (code != null && err.code !== code) return false;
  return true;
}

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await appraisalSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
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
  let adminB = await db('faculty_users').where({ college_id: collegeB, role: 'COLLEGE_ADMIN' }).first();
  if (!adminB) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeB,
      email: `perf.admin.b.${Date.now()}@test.edu`,
      name: 'Perf Admin B',
      role: 'COLLEGE_ADMIN',
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    adminB = await db('faculty_users').where({ id }).first();
  }
  return { collegeB, adminB: adminB! };
}

async function seedFacultyWithEmployee(
  ctx: Ctx,
  role: string,
  departmentId: number,
  opts?: { doj?: string; category?: string },
) {
  // Never persist HOD/PRINCIPAL on faculty_users.role — that pollutes
  // leaveApprover legacyHodEmployees / legacyPrincipalEmployees for shared depts.
  const persistedRole = role === 'HOD' || role === 'PRINCIPAL' ? 'FACULTY' : role;
  return db.transaction(async (trx) => {
    const [facultyId] = await trx('faculty_users').insert({
      college_id: ctx.collegeId,
      email: `perf.${role}.${unique('f')}@test.edu`,
      name: `Perf ${role}`,
      role: persistedRole,
      department_id: departmentId,
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    const number = `PERF${facultyId}${Date.now()}`.slice(0, 32);
    const [employeeId] = await trx('employees').insert({
      college_id: ctx.collegeId,
      employee_number: number,
      first_name: 'Perf',
      last_name: role.slice(0, 16),
      display_name: `Perf ${role} ${facultyId}`,
      employee_category: opts?.category ?? 'FACULTY',
      department_id: departmentId,
      designation_id: Number(ctx.des.id),
      employment_type_id: Number(ctx.empType.id),
      official_email: `perf.emp.${facultyId}.${Date.now()}@vviet.edu.in`,
      date_of_joining: opts?.doj ?? '2018-01-01',
      employment_status: 'ACTIVE',
      notice_period_days: 30,
      faculty_user_id: Number(facultyId),
    });
    return { facultyId: Number(facultyId), employeeId: Number(employeeId), actorRole: role };
  });
}

async function seedEmployeeOnly(
  ctx: Ctx,
  opts: { doj: string; lwd?: string | null; departmentId?: number; facultyUserId?: number | null },
) {
  const number = `PERF${Date.now()}${Math.floor(Math.random() * 999)}`.slice(0, 32);
  const [id] = await db('employees').insert({
    college_id: ctx.collegeId,
    employee_number: number,
    first_name: 'Perf',
    last_name: unique('Emp').slice(0, 32),
    display_name: `Perf Emp ${number}`,
    employee_category: 'NON_TEACHING',
    department_id: opts.departmentId ?? Number(ctx.dept.id),
    designation_id: Number(ctx.des.id),
    employment_type_id: Number(ctx.empType.id),
    official_email: `perf.only.${Date.now()}@vviet.edu.in`,
    date_of_joining: opts.doj,
    employment_status: 'ACTIVE',
    notice_period_days: 30,
    faculty_user_id: opts.facultyUserId ?? null,
    last_working_date: opts.lwd ?? null,
  });
  return Number(id);
}

function balancedTemplateSections(opts?: { withAttendance?: boolean }) {
  return [
    {
      code: 'CORE',
      name: 'Core',
      weight: 100,
      criteria: [
        {
          code: 'PERF',
          name: 'Performance',
          weight: 70,
          measurementType: 'RATING' as const,
          selfRatingAllowed: true,
          reviewerRatingAllowed: true,
        },
        {
          code: opts?.withAttendance ? 'ATT' : 'COND',
          name: opts?.withAttendance ? 'Attendance' : 'Conduct',
          weight: 30,
          measurementType: (opts?.withAttendance ? 'SYSTEM_DERIVED' : 'RATING') as 'SYSTEM_DERIVED' | 'RATING',
          selfRatingAllowed: !opts?.withAttendance,
          reviewerRatingAllowed: !opts?.withAttendance,
          evidenceSource: opts?.withAttendance ? ('ATTENDANCE' as const) : ('NONE' as const),
        },
      ],
    },
  ];
}

async function createPublishedTemplate(actor: HrActor, code: string, opts?: { withAttendance?: boolean }) {
  const tpl = await createTemplate(actor, {
    code,
    name: `Template ${code}`,
    totalWeight: 100,
    sections: balancedTemplateSections(opts),
  });
  return publishTemplate(actor, tpl.id);
}

async function createActiveCycle(
  actor: HrActor,
  opts?: {
    periodStart?: string;
    periodEnd?: string;
    reviewCutoffDate?: string;
    defaultTemplateId?: number;
  },
) {
  return createCycle(actor, {
    name: `Cycle ${unique('C')}`,
    code: unique('CYC'),
    periodStart: opts?.periodStart ?? '2025-01-01',
    periodEnd: opts?.periodEnd ?? '2025-12-31',
    reviewCutoffDate: opts?.reviewCutoffDate ?? '2025-12-15',
    defaultTemplateId: opts?.defaultTemplateId ?? null,
  });
}

async function seedMonthlyAttendance(
  collegeId: number,
  employeeId: number,
  year: number,
  month: number,
  presentDays: number,
  workingDays = 22,
) {
  if (!(await db.schema.hasTable('employee_monthly_attendance'))) return;
  const existing = await db('employee_monthly_attendance')
    .where({ college_id: collegeId, employee_id: employeeId, year, month })
    .first();
  const payload = {
    college_id: collegeId,
    employee_id: employeeId,
    year,
    month,
    employment_applicable_days: workingDays,
    working_days: workingDays,
    payable_days: presentDays,
    lop_days: Math.max(0, workingDays - presentDays),
    paid_leave_days: 0,
    unpaid_leave_days: 0,
    absence_days: Math.max(0, workingDays - presentDays),
    half_days: 0,
    present_days: presentDays,
    od_wfh_days: 0,
  };
  if (existing) await db('employee_monthly_attendance').where({ id: existing.id }).update(payload);
  else await db('employee_monthly_attendance').insert(payload);
}

async function seedHodAssignment(
  ctx: Ctx,
  employeeId: number,
  departmentId: number,
  effectiveFrom: string,
  effectiveTo: string | null,
) {
  if (!(await db.schema.hasTable('academic_leadership_assignments'))) return null;
  // End any overlapping ACTIVE HOD assignments for this dept to avoid MULTIPLE_ACTIVE_HOD pollution.
  const dayBefore = (() => {
    const d = new Date(`${effectiveFrom}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return ymd(d);
  })();
  await db('academic_leadership_assignments')
    .where({
      college_id: ctx.collegeId,
      department_id: departmentId,
      leadership_role: 'HOD',
      status: 'ACTIVE',
    })
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', effectiveFrom))
    .update({ effective_to: dayBefore, updated_by: ctx.admin.id });

  const [id] = await db('academic_leadership_assignments').insert({
    college_id: ctx.collegeId,
    employee_id: employeeId,
    leadership_role: 'HOD',
    department_id: departmentId,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    status: 'ACTIVE',
    created_by: ctx.admin.id,
    updated_by: ctx.admin.id,
  });
  return Number(id);
}

async function criterionIds(templateId: number) {
  const rows = await db('hr_appraisal_template_criteria').where({ template_id: templateId }).orderBy('sort_order');
  return rows.map((r: { id: number; code: string }) => ({ id: Number(r.id), code: String(r.code) }));
}

async function enrollPair(ctx: Ctx, actor: HrActor, opts?: { withAttendance?: boolean; reviewCutoffDate?: string }) {
  const emp = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
  const hod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
  await db('employees').where({ id: emp.employeeId }).update({ reporting_manager_employee_id: hod.employeeId });
  const tpl = await createPublishedTemplate(actor, unique('T'), opts);
  const cycle = await createActiveCycle(actor, {
    defaultTemplateId: tpl.id,
    reviewCutoffDate: opts?.reviewCutoffDate,
  });
  const { createdIds } = await enrollEligibleEmployees(actor, cycle.id, {
    employeeIds: [emp.employeeId],
    templateId: tpl.id,
  });
  const appraisalId = createdIds[0];
  assert.ok(appraisalId);
  const crits = await criterionIds(tpl.id);
  const ratingCrit = crits.find((c) => c.code === 'PERF')!;
  const empActor = hrActor({
    id: emp.facultyId,
    college_id: ctx.collegeId,
    department_id: Number(ctx.dept.id),
    role: 'FACULTY',
  });
  const hodActor = hrActor(
    {
      id: hod.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'HOD',
    },
    { leadershipRoles: ['HOD'], hodDepartmentIds: [Number(ctx.dept.id)] },
  );
  return { emp, hod, tpl, cycle, appraisalId, ratingCrit, empActor, hodActor };
}

async function advanceToReviewed(
  empActor: HrActor,
  hodActor: HrActor,
  appraisalId: number,
  criterionId: number,
  selfRating = 5,
  reviewerRating = 4,
) {
  await saveSelfAppraisal(empActor, appraisalId, {
    criteria: [{ criterionId, selfRating }],
    submit: true,
  });
  return saveReview(hodActor, appraisalId, {
    criteria: [{ criterionId, reviewerRating }],
    reviewerPrivateNotes: 'reviewer only notes',
    submit: true,
  });
}

describe('hr performance appraisal E2E', { timeout: 180_000 }, () => {
  it('ensures default rating scale and lists scales', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const id = await ensureDefaultRatingScale(ctx.collegeId, actor);
    assert.ok(id > 0);
    const scales = await listRatingScales(actor);
    assert.ok(scales.length >= 1);
    assert.ok(scales[0].levels.length >= 2);
  });

  it('rejects invalid template section weights', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    assert.throws(
      () =>
        validateTemplateWeights(
          [{ code: 'X', weight: 50, criteria: [{ code: 'X1', weight: 40 }] }],
          100,
        ),
      (err: unknown) => isAppError(err, 'APPRAISAL_WEIGHTS_INVALID'),
    );
  });

  it('createTemplate rejects unbalanced criteria weights', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await assert.rejects(
      () =>
        createTemplate(actor, {
          code: unique('BAD'),
          name: 'Bad weights',
          totalWeight: 100,
          sections: [{ code: 'S', name: 'S', weight: 100, criteria: [{ code: 'C', name: 'C', weight: 40 }] }],
        }),
      (err: unknown) => isAppError(err, 'APPRAISAL_WEIGHTS_INVALID', 400),
    );
  });

  it('creates cycle with default rating scale', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const cycle = await createActiveCycle(actor);
    assert.equal(cycle.status, 'DRAFT');
    assert.ok(cycle.ratingScaleId);
  });

  it('publishes template and versions without mutating prior ACTIVE history', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const tpl = await createPublishedTemplate(actor, unique('TPL'));
    assert.equal(tpl.status, 'ACTIVE');
    assert.equal(tpl.versionNo, 1);
    const v2 = await versionTemplate(actor, tpl.id);
    assert.equal(v2.versionNo, 2);
    assert.equal(v2.parentTemplateId, tpl.id);
    assert.equal(v2.status, 'DRAFT');
    const old = await db('hr_appraisal_templates').where({ id: tpl.id }).first();
    assert.equal(String(old.status), 'ACTIVE');
    assert.equal(Number(old.version_no), 1);
  });

  it('excludes employees who joined after period_end', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const tpl = await createPublishedTemplate(actor, unique('ELG1'));
    const cycle = await createActiveCycle(actor, {
      periodStart: '2025-01-01',
      periodEnd: '2025-06-30',
      defaultTemplateId: tpl.id,
    });
    const late = await seedEmployeeOnly(ctx, { doj: '2025-07-15' });
    const ok = await seedEmployeeOnly(ctx, { doj: '2020-01-01' });
    const result = await enrollEligibleEmployees(actor, cycle.id, {
      employeeIds: [late, ok],
      templateId: tpl.id,
    });
    assert.equal(result.createdIds.length, 1);
    const row = await db('hr_employee_appraisals').where({ id: result.createdIds[0] }).first();
    assert.equal(Number(row.employee_id), ok);
  });

  it('excludes employees separated before period_start', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const tpl = await createPublishedTemplate(actor, unique('ELG2'));
    const cycle = await createActiveCycle(actor, {
      periodStart: '2025-01-01',
      periodEnd: '2025-06-30',
      defaultTemplateId: tpl.id,
    });
    const earlySep = await seedEmployeeOnly(ctx, { doj: '2020-01-01', lwd: '2024-12-15' });
    const ok = await seedEmployeeOnly(ctx, { doj: '2020-01-01' });
    const result = await enrollEligibleEmployees(actor, cycle.id, {
      employeeIds: [earlySep, ok],
      templateId: tpl.id,
    });
    assert.equal(result.createdIds.length, 1);
    const row = await db('hr_employee_appraisals').where({ id: result.createdIds[0] }).first();
    assert.equal(Number(row.employee_id), ok);
  });

  it('employee creates goals and rejects weight over 100', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor } = await enrollPair(ctx, actor);
    await createGoal(empActor, appraisalId, { title: 'Teach well', weight: 60 });
    await assert.rejects(
      () => createGoal(empActor, appraisalId, { title: 'Overweight', weight: 50 }),
      (err: unknown) => err instanceof AppError && err.status === 400,
    );
    await createGoal(empActor, appraisalId, { title: 'Research', weight: 40 });
  });

  it('blocks unauthorized employee from creating goals on another appraisal', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId } = await enrollPair(ctx, actor);
    const other = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const otherActor = hrActor({
      id: other.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'FACULTY',
    });
    await assert.rejects(
      () => createGoal(otherActor, appraisalId, { title: 'Hijack', weight: 10 }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('reviewer approves submitted goals; lock blocks further edits', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor } = await enrollPair(ctx, actor);
    const g1 = await createGoal(empActor, appraisalId, { title: 'Goal A', weight: 50 });
    const g2 = await createGoal(empActor, appraisalId, { title: 'Goal B', weight: 50 });
    await submitGoals(empActor, appraisalId);
    await decideGoal(hodActor, g1.id, { decision: 'APPROVE' });
    await decideGoal(hodActor, g2.id, { decision: 'APPROVE' });
    await lockGoals(actor, appraisalId);
    await assert.rejects(
      () => updateGoal(empActor, g1.id, { title: 'Changed after lock' }),
      (err: unknown) => err instanceof AppError && err.status === 400,
    );
  });

  it('blocks non-reviewer from deciding goals', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor } = await enrollPair(ctx, actor);
    const g1 = await createGoal(empActor, appraisalId, { title: 'Only one', weight: 100 });
    await submitGoals(empActor, appraisalId);
    const stranger = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const strangerActor = hrActor({
      id: stranger.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'FACULTY',
    });
    await assert.rejects(
      () => decideGoal(strangerActor, g1.id, { decision: 'APPROVE' }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('employee can view own appraisal; peer employee blocked', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, emp, empActor } = await enrollPair(ctx, actor);
    const detail = await getAppraisalDetail(empActor, appraisalId, 'employee');
    assert.equal(detail.employeeId, emp.employeeId);
    const other = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const otherActor = hrActor({
      id: other.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'FACULTY',
    });
    await assert.rejects(
      () => getAppraisalDetail(otherActor, appraisalId, 'employee'),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('self appraisal submit computes self score; duplicate submit is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, ratingCrit } = await enrollPair(ctx, actor);
    const saved = await saveSelfAppraisal(empActor, appraisalId, {
      employeeSummary: 'Did well',
      criteria: [{ criterionId: ratingCrit.id, selfRating: 4, selfComments: 'solid' }],
      submit: true,
    });
    assert.equal(saved.status, 'SELF_SUBMITTED');
    assert.ok(saved.selfScore != null);
    const again = await saveSelfAppraisal(empActor, appraisalId, { submit: true });
    assert.equal(again.status, 'SELF_SUBMITTED');
  });

  it('blocks other employee from saving self appraisal', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, ratingCrit } = await enrollPair(ctx, actor);
    const other = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const otherActor = hrActor({
      id: other.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'FACULTY',
    });
    await assert.rejects(
      () =>
        saveSelfAppraisal(otherActor, appraisalId, {
          criteria: [{ criterionId: ratingCrit.id, selfRating: 1 }],
        }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('HOD reviews department faculty; reviewer and self scores stay separate', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    const reviewed = await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id, 5, 3);
    assert.equal(reviewed.status, 'REVIEW_SUBMITTED');
    assert.ok(reviewed.reviewerScore != null);
    assert.notEqual(reviewed.reviewerScore, reviewed.selfScore);
  });

  it('blocks HOD self-review', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const hod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    const principal = await seedFacultyWithEmployee(ctx, 'PRINCIPAL', Number(ctx.dept.id));
    await db('employees').where({ id: hod.employeeId }).update({
      reporting_manager_employee_id: principal.employeeId,
    });
    const tpl = await createPublishedTemplate(actor, unique('SELFREV'));
    const cycle = await createActiveCycle(actor, { defaultTemplateId: tpl.id, reviewCutoffDate: ymd(new Date()) });
    const { createdIds } = await enrollEligibleEmployees(actor, cycle.id, {
      employeeIds: [hod.employeeId],
      templateId: tpl.id,
    });
    const appraisalId = createdIds[0];
    await db('hr_employee_appraisals').where({ id: appraisalId }).update({ status: 'SELF_SUBMITTED' });
    const crits = await criterionIds(tpl.id);
    const ratingCrit = crits.find((c) => c.code === 'PERF')!;
    const hodActor = hrActor(
      {
        id: hod.facultyId,
        college_id: ctx.collegeId,
        department_id: Number(ctx.dept.id),
        role: 'HOD',
      },
      { leadershipRoles: ['HOD'], hodDepartmentIds: [Number(ctx.dept.id)] },
    );
    await assert.rejects(
      () =>
        saveReview(hodActor, appraisalId, {
          criteria: [{ criterionId: ratingCrit.id, reviewerRating: 4 }],
          submit: true,
        }),
      (err: unknown) =>
        isAppError(err, 'APPRAISAL_SELF_REVIEW', 403) || (err instanceof AppError && err.status === 403),
    );
  });

  it('blocks other-department HOD from reviewing when not assigned', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, ratingCrit } = await enrollPair(ctx, actor);
    await saveSelfAppraisal(empActor, appraisalId, {
      criteria: [{ criterionId: ratingCrit.id, selfRating: 4 }],
      submit: true,
    });
    const otherHod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.deptB.id));
    const otherHodActor = hrActor(
      {
        id: otherHod.facultyId,
        college_id: ctx.collegeId,
        department_id: Number(ctx.deptB.id),
        role: 'HOD',
      },
      { leadershipRoles: ['HOD'], hodDepartmentIds: [Number(ctx.deptB.id)] },
    );
    await assert.rejects(
      () =>
        saveReview(otherHodActor, appraisalId, {
          criteria: [{ criterionId: ratingCrit.id, reviewerRating: 2 }],
          submit: true,
        }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('routes HOD appraisal reviewer to Principal', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const hod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    const principal = await seedFacultyWithEmployee(ctx, 'PRINCIPAL', Number(ctx.dept.id));
    await db('employees').where({ id: hod.employeeId }).update({
      reporting_manager_employee_id: principal.employeeId,
    });
    await seedHodAssignment(ctx, hod.employeeId, Number(ctx.dept.id), '2024-01-01', null);
    const tpl = await createPublishedTemplate(actor, unique('HODPR'));
    const cycle = await createActiveCycle(actor, {
      defaultTemplateId: tpl.id,
      reviewCutoffDate: ymd(new Date()),
    });
    const { createdIds } = await enrollEligibleEmployees(actor, cycle.id, {
      employeeIds: [hod.employeeId],
      templateId: tpl.id,
    });
    const row = await db('hr_employee_appraisals').where({ id: createdIds[0] }).first();
    assert.equal(Number(row.reviewer_employee_id), principal.employeeId);

    const crits = await criterionIds(tpl.id);
    const ratingCrit = crits.find((c) => c.code === 'PERF')!;
    const hodEmpActor = hrActor({
      id: hod.facultyId,
      college_id: ctx.collegeId,
      department_id: Number(ctx.dept.id),
      role: 'HOD',
    });
    const prinActor = hrActor(
      {
        id: principal.facultyId,
        college_id: ctx.collegeId,
        department_id: Number(ctx.dept.id),
        role: 'PRINCIPAL',
      },
      { leadershipRoles: ['PRINCIPAL'] },
    );
    await saveSelfAppraisal(hodEmpActor, Number(row.id), {
      criteria: [{ criterionId: ratingCrit.id, selfRating: 4 }],
      submit: true,
    });
    const reviewed = await saveReview(prinActor, Number(row.id), {
      criteria: [{ criterionId: ratingCrit.id, reviewerRating: 4 }],
      submit: true,
    });
    assert.equal(reviewed.status, 'REVIEW_SUBMITTED');
  });

  it('calibration changes final score, preserves reviewer score, writes reason/audit', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id);
    const before = await db('hr_employee_appraisals').where({ id: appraisalId }).first();
    const reviewerScore = Number(before.reviewer_score);
    const cal = await calibrateAppraisal(actor, appraisalId, {
      calibratedScore: 88,
      reason: 'Peer calibration adjustment for cohort fairness',
    });
    assert.equal(cal.status, 'CALIBRATION');
    assert.equal(cal.calibratedScore, 88);
    assert.equal(cal.reviewerScore, reviewerScore);
    const calRow = await db('hr_appraisal_calibrations').where({ appraisal_id: appraisalId }).first();
    assert.ok(calRow);
    assert.match(String(calRow.reason), /Peer calibration/);
    if (await db.schema.hasTable('hr_audit_log')) {
      const audit = await db('hr_audit_log')
        .where({ entity_type: 'hr_employee_appraisals', entity_id: appraisalId, action: 'APPRAISAL_CALIBRATED' })
        .orderBy('id', 'desc')
        .first();
      assert.ok(audit);
    }
  });

  it('blocks unauthorized actor from calibrating', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id);
    await assert.rejects(
      () => calibrateAppraisal(hodActor, appraisalId, { calibratedScore: 95, reason: 'inflate illegally' }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('pulls attendance evidence into collectEvidence', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const emp = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    await seedMonthlyAttendance(ctx.collegeId, emp.employeeId, 2025, 3, 20, 22);
    const items = await collectEvidenceForEmployee(
      ctx.collegeId,
      emp.employeeId,
      '2025-01-01',
      '2025-12-31',
      emp.facultyId,
    );
    const att = items.find((i) => i.sourceModule === 'ATTENDANCE');
    assert.ok(att);
    assert.ok(att!.valueNumeric != null && att!.valueNumeric > 0);
  });

  it('survey evidence payload stays anonymous (no student identity)', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const emp = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const items = await collectEvidenceForEmployee(
      ctx.collegeId,
      emp.employeeId,
      '2025-01-01',
      '2025-12-31',
      emp.facultyId,
    );
    const survey = items.find((i) => i.sourceModule === 'SURVEY_FEEDBACK');
    if (!survey?.payload) return;
    const blob = JSON.stringify(survey.payload);
    assert.equal(/studentId|student_id|rollNo|usn|phone/i.test(blob), false);
  });

  it('evidence snapshot is immutable after later attendance mutation', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, emp, empActor, ratingCrit } = await enrollPair(ctx, actor, { withAttendance: true });
    await seedMonthlyAttendance(ctx.collegeId, emp.employeeId, 2025, 3, 20, 22);
    await saveSelfAppraisal(empActor, appraisalId, {
      criteria: [{ criterionId: ratingCrit.id, selfRating: 4 }],
      submit: true,
    });
    const snapsBefore = await getSnapshots(appraisalId);
    const attSnap = snapsBefore.find((s) => s.sourceModule === 'ATTENDANCE');
    assert.ok(attSnap);
    const snapValue = attSnap!.valueNumeric;
    await seedMonthlyAttendance(ctx.collegeId, emp.employeeId, 2025, 3, 5, 22);
    const snapsAfter = await getSnapshots(appraisalId);
    const attAfter = snapsAfter.find((s) => s.sourceModule === 'ATTENDANCE' && s.id === attSnap!.id);
    assert.equal(attAfter!.valueNumeric, snapValue);
  });

  it('finalize maps server score to rating label', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id, 5, 5);
    const finalized = await finalizeAppraisal(actor, appraisalId);
    assert.equal(finalized.status, 'FINALIZED');
    assert.equal(finalized.finalScore, 100);
    assert.equal(finalized.finalRatingLabel, 'Outstanding');
  });

  it('lock blocks mutation; reopen creates new version', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id, 5, 5);
    await finalizeAppraisal(actor, appraisalId);
    await lockAppraisal(actor, appraisalId);
    await assert.rejects(
      () =>
        saveSelfAppraisal(empActor, appraisalId, {
          criteria: [{ criterionId: ratingCrit.id, selfRating: 1 }],
        }),
      (err: unknown) =>
        isAppError(err, 'APPRAISAL_LOCKED', 400) || (err instanceof AppError && err.status === 400),
    );
    const reopened = await reopenAppraisal(actor, appraisalId, {
      reason: 'Correction after grievance hearing',
    });
    assert.equal(reopened.versionNo, 2);
    assert.equal(reopened.parentAppraisalId, appraisalId);
    const old = await db('hr_employee_appraisals').where({ id: appraisalId }).first();
    assert.equal(String(old.status), 'LOCKED');
  });

  it('blocks cross-college access to appraisal', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId } = await enrollPair(ctx, actor);
    const { adminB } = await ensurePeerCollege(ctx.collegeId);
    const actorB = hrActor(adminB);
    await assert.rejects(
      () => getAppraisalDetail(actorB, appraisalId, 'hr'),
      (err: unknown) => err instanceof AppError && (err.status === 403 || err.status === 404),
    );
  });

  it('expired HOD assignment before review cutoff is not resolved as reviewer', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const emp = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const expiredHod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    await db('employees').where({ id: emp.employeeId }).update({ reporting_manager_employee_id: null });
    await seedHodAssignment(ctx, expiredHod.employeeId, Number(ctx.dept.id), '2024-01-01', '2025-06-01');
    const resolved = await resolveAppraisalReviewer(emp.employeeId, ctx.collegeId, '2025-12-15');
    assert.notEqual(resolved.reviewerEmployeeId, expiredHod.employeeId);
  });

  it('expired/unassigned HOD cannot submit review', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, ratingCrit } = await enrollPair(ctx, actor);
    await saveSelfAppraisal(empActor, appraisalId, {
      criteria: [{ criterionId: ratingCrit.id, selfRating: 4 }],
      submit: true,
    });
    const expiredHod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    await seedHodAssignment(ctx, expiredHod.employeeId, Number(ctx.dept.id), '2024-01-01', '2025-06-01');
    const expiredHodActor = hrActor(
      {
        id: expiredHod.facultyId,
        college_id: ctx.collegeId,
        department_id: Number(ctx.dept.id),
        role: 'HOD',
      },
      { leadershipRoles: ['HOD'], hodDepartmentIds: [Number(ctx.dept.id)] },
    );
    await assert.rejects(
      () =>
        saveReview(expiredHodActor, appraisalId, {
          criteria: [{ criterionId: ratingCrit.id, reviewerRating: 2 }],
          submit: true,
        }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('employee view hides reviewer-only private notes', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { appraisalId, empActor, hodActor, ratingCrit } = await enrollPair(ctx, actor);
    await advanceToReviewed(empActor, hodActor, appraisalId, ratingCrit.id);
    const empView = await getAppraisalDetail(empActor, appraisalId, 'employee');
    assert.equal(empView.reviewerPrivateNotes, undefined);
    const reviewerView = await getAppraisalDetail(hodActor, appraisalId, 'reviewer');
    assert.equal(reviewerView.reviewerPrivateNotes, 'reviewer only notes');
  });
});
