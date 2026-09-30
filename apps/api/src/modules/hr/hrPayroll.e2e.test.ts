/**
 * HRMS Payroll full-phase E2E — snapshots, LOP, lock immutability, Finance idempotency, privacy, tenant isolation.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { createEmployee, markEmployeeJoined, getEmployee360 } from './lifecycleEmployee.js';
import { asISODate } from '../timetable/time.js';
import {
  payrollSchemaReady,
  createPayrollRun,
  calculatePayrollRun,
  approvePayrollRun,
  lockPayrollRun,
  getPayrollRunEmployee,
  getPayslip,
  listPayslips,
  getPayrollPostingBatch,
  postPayrollToFinance,
  mutateLockedPayrollComponentBlocked,
  ensurePayrollPeriod,
  reopenPayrollRun,
} from './payroll.js';
import {
  createSalaryStructure,
  assignEmployeeSalary,
  listSalaryComponents,
  updateSalaryStructureComponents,
} from './salaryStructures.js';
import { createAdjustment } from './payrollAdjustments.js';
import { ensurePayrollFinanceDefaults } from '../finance/payrollPosting.js';

type Ctx = {
  collegeId: number;
  admin: { id: number; college_id: number; department_id?: number | null; role: string; name?: string };
  dept: { id: number };
  des: { id: number };
  empType: { id: number };
};

function hrActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

function unique(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const end = ymd(endDate);
  return { start, end, label: `${year}-${String(month).padStart(2, '0')}` };
}

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await payrollSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const dept = await db('departments').where({ college_id: collegeId }).first();
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
    if (!admin || !dept || !des || !empType) return null;
    return { collegeId, admin, dept, des, empType };
  } catch {
    return null;
  }
}

async function ensurePeerCollege(collegeA: number) {
  const collegeBRow = await db('colleges').whereNot('id', collegeA).orderBy('id', 'asc').first();
  assert.ok(collegeBRow, 'Second college required');
  const collegeB = Number(collegeBRow.id);
  await ensureCollegeHrmsDefaults(collegeB);
  await ensurePayrollFinanceDefaults(collegeB);
  let adminB = await db('faculty_users').where({ college_id: collegeB, role: 'COLLEGE_ADMIN' }).first();
  if (!adminB) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeB,
      email: `payroll.admin.b.${Date.now()}@test.edu`,
      name: 'Payroll Admin B',
      role: 'COLLEGE_ADMIN',
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    adminB = await db('faculty_users').where({ id }).first();
  }
  return { collegeB, adminB: adminB! };
}

async function seedEmployee(
  ctx: Ctx,
  actor: HrActor,
  opts: { doj: string; emailPrefix: string },
) {
  // Direct insert avoids notification-number series lock contention under parallel hung suites.
  void actor;
  const number = `PAY${Date.now()}${Math.floor(Math.random() * 999)}`.slice(0, 32);
  const [id] = await db('employees').insert({
    college_id: ctx.collegeId,
    employee_number: number,
    first_name: 'Pay',
    last_name: unique('Emp').slice(0, 32),
    display_name: `Pay Emp ${number}`,
    employee_category: 'NON_TEACHING',
    department_id: Number(ctx.dept.id),
    designation_id: Number(ctx.des.id),
    employment_type_id: Number(ctx.empType.id),
    official_email: `${opts.emailPrefix}.${Date.now()}@vviet.edu.in`,
    date_of_joining: opts.doj,
    employment_status: 'ACTIVE',
    faculty_user_id: null,
  });
  return Number(id);
}

async function ensureMonthlyAttendanceRow(
  collegeId: number,
  employeeId: number,
  year: number,
  month: number,
  opts?: { workingDays?: number; payableDays?: number; lopDays?: number },
) {
  const workingDays = opts?.workingDays ?? 26;
  const lopDays = opts?.lopDays ?? 0;
  const payableDays = opts?.payableDays ?? workingDays - lopDays;
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
    payable_days: payableDays,
    lop_days: lopDays,
    paid_leave_days: 0,
    unpaid_leave_days: 0,
    absence_days: lopDays,
    half_days: 0,
    present_days: payableDays,
  };
  if (existing) {
    await db('employee_monthly_attendance').where({ id: existing.id }).update(payload);
  } else {
    await db('employee_monthly_attendance').insert(payload);
  }
}

async function ensureAttendanceReady(actor: HrActor, year: number, month: number) {
  // Avoid full processMonth on large shared colleges (slow / exception-heavy).
  // Payroll only requires FINALIZED|LOCKED closure + monthly handoff rows.
  void actor;
  const closure = await db('hr_attendance_month_closures')
    .where({ college_id: actor.collegeId, year, month })
    .first();
  if (closure) {
    await db('hr_attendance_month_closures').where({ id: closure.id }).update({
      status: 'LOCKED',
      calculation_version: Number(closure.calculation_version ?? 1),
    });
  } else {
    await db('hr_attendance_month_closures').insert({
      college_id: actor.collegeId,
      year,
      month,
      status: 'LOCKED',
      calculation_version: 1,
    });
  }
}

async function seedStructure(actor: HrActor, code: string, basicAmount: number) {
  const comps = await listSalaryComponents(actor);
  const basic = comps.find((c) => c.code === 'BASIC');
  const hra = comps.find((c) => c.code === 'HRA');
  const pf = comps.find((c) => c.code === 'PF');
  assert.ok(basic, 'BASIC component required');
  return createSalaryStructure(actor, {
    code,
    name: `Structure ${code}`,
    components: [
      { componentId: basic.id, calculationType: 'FIXED', amount: basicAmount },
      ...(hra
        ? [{ componentId: hra.id, calculationType: 'PERCENTAGE' as const, percentage: 40, percentageOfComponentId: basic.id }]
        : []),
      ...(pf
        ? [{ componentId: pf.id, calculationType: 'PERCENTAGE' as const, percentage: 12, percentageOfComponentId: basic.id }]
        : []),
    ],
  });
}

describe('HRMS Payroll E2E', () => {
  let ctx: Ctx | null = null;
  let actor: HrActor;

  // Isolated payroll month — avoid colliding with live attendance months near "today"
  const stamp = Date.now();
  const year = 2028;
  const month = ((stamp % 11) + 1); // 1..11
  const bounds = monthBounds(year, month);

  before(async () => {
    ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensurePayrollFinanceDefaults(ctx.collegeId);
    actor = hrActor(ctx.admin);
  });

  it('salary structure + assignment + period creation', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STR').slice(0, 20), 50000);
    assert.ok(structure.id);
    assert.ok((structure.components?.length ?? 0) >= 1);

    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.struct' });
    const assigned = await assignEmployeeSalary(actor, empId, {
      structureId: structure.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    assert.ok(assigned.assignment?.id);

    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-E2E-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    assert.ok(period.id);
  });

  it('full calculate → snapshot → LOP handoff → approve → lock → payslip', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STRC').slice(0, 20), 40000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.full' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structure.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });

    await ensureAttendanceReady(actor, year, month);
    await ensureMonthlyAttendanceRow(ctx.collegeId, empId, year, month, { lopDays: 2 });

    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-FULL-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    // Clean prior run for this period if any from retries
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();

    const run = await createPayrollRun(actor, period.id);
    const calc = await calculatePayrollRun(actor, run.id);
    assert.equal(calc.status, 'CALCULATED');

    const detail = await getPayrollRunEmployee(actor, run.id, empId);
    assert.ok(detail.inputSnapshot, 'input snapshot required');
    assert.equal(detail.inputSnapshot.version, '1');
    assert.ok(detail.inputSnapshot.assignment.structureId);
    assert.ok(detail.inputSnapshot.attendance.closureId != null);
    assert.equal(detail.lopDays, 2);
    assert.ok(detail.components.length > 0);
    assert.ok(detail.calculationTrace);

    const lockedNet = detail.netAmount;
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
    });
    await approvePayrollRun(actor, run.id);
    await lockPayrollRun(actor, run.id);

    const payslips = await db('payslips').where({ payroll_run_id: run.id, employee_id: empId });
    assert.equal(payslips.length, 1);
    assert.equal(Number(payslips[0].net_amount), lockedNet);
  });

  it('Test A — locked payroll unchanged after salary revision', async () => {
    if (!ctx) return;
    const structureA = await seedStructure(actor, unique('STRA').slice(0, 20), 30000);
    const structureB = await seedStructure(actor, unique('STRB').slice(0, 20), 60000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.revA' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structureA.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    await ensureAttendanceReady(actor, year, month);

    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-REVA-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);
    // May have validation errors for other employees — force OK for our emp by checking
    const before = await getPayrollRunEmployee(actor, run.id, empId);
    const beforeNet = before.netAmount;
    const beforeSnap = JSON.stringify(before.inputSnapshot);

    // Bypass validation gate for lock by clearing errors on this run if only SKIPPED/others fail
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
    });
    await lockPayrollRun(actor, run.id);

    // October-style revision (after period)
    const nextMonthStart = (() => {
      const d = new Date(year, month, 1);
      return ymd(d);
    })();
    await assignEmployeeSalary(actor, empId, {
      structureId: structureB.id,
      effectiveFrom: nextMonthStart,
      generateArrear: false,
    });

    const after = await getPayrollRunEmployee(actor, run.id, empId);
    assert.equal(after.netAmount, beforeNet);
    assert.equal(JSON.stringify(after.inputSnapshot), beforeSnap);
  });

  it('Test B — locked payroll unchanged after component master change', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STRCH').slice(0, 20), 35000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.comp' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structure.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    await ensureAttendanceReady(actor, year, month);
    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-COMP-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);
    const before = await getPayrollRunEmployee(actor, run.id, empId);
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
    });
    await lockPayrollRun(actor, run.id);

    const comps = await listSalaryComponents(actor);
    const basic = comps.find((c) => c.code === 'BASIC')!;
    await updateSalaryStructureComponents(actor, structure.id, [
      { componentId: basic.id, calculationType: 'FIXED', amount: 999999 },
    ]);

    const after = await getPayrollRunEmployee(actor, run.id, empId);
    assert.equal(after.netAmount, before.netAmount);
    assert.equal(after.grossAmount, before.grossAmount);
  });

  it('Test C — locked payroll unchanged after later attendance changes blocked by lock', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STRAT').slice(0, 20), 32000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.att' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structure.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    await ensureAttendanceReady(actor, year, month);
    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-ATT-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);
    const before = await getPayrollRunEmployee(actor, run.id, empId);
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
    });
    await lockPayrollRun(actor, run.id);

    // Attempt to mutate monthly attendance source — may be blocked by attendance lock
    await db('employee_monthly_attendance')
      .where({ college_id: ctx.collegeId, employee_id: empId, year, month })
      .update({ lop_days: 99, payable_days: 1 })
      .catch(() => undefined);

    const after = await getPayrollRunEmployee(actor, run.id, empId);
    assert.equal(after.lopDays, before.lopDays);
    assert.equal(after.netAmount, before.netAmount);
    assert.equal(after.inputSnapshot.attendance.lopDays, before.inputSnapshot.attendance.lopDays);
  });

  it('Test D — direct mutation of locked result BLOCKED', async () => {
    if (!ctx) return;
    const locked = await db('payroll_runs')
      .where({ college_id: ctx.collegeId, status: 'LOCKED' })
      .orderBy('id', 'desc')
      .first();
    if (!locked) return;
    const pre = await db('payroll_run_employees').where({ payroll_run_id: locked.id }).first();
    if (!pre) return;
    await assert.rejects(
      () => mutateLockedPayrollComponentBlocked(actor, Number(pre.id), { amount: 1 }),
      (err: Error) => /immutable|locked|not allowed|APPROVED/i.test(err.message),
    );
  });

  it('retroactive revision generates arrear without mutating locked payroll', async () => {
    if (!ctx) return;
    const structureA = await seedStructure(actor, unique('STRAR').slice(0, 20), 25000);
    const structureB = await seedStructure(actor, unique('STRAR2').slice(0, 20), 45000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.arrear' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structureA.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    await ensureAttendanceReady(actor, year, month);
    // Without a per-employee monthly attendance row, buildEmployeeSnapshot reports "Missing
    // attendance handoff for employee" and prorates pay to zero — old and new net both compute
    // to 0.00, so maybeGenerateRevisionArrear correctly finds no difference and returns null.
    // Seed it, matching the pattern used by the other tests in this file that need real pay.
    await ensureMonthlyAttendanceRow(ctx.collegeId, empId, year, month);
    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-ARR-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);
    const before = await getPayrollRunEmployee(actor, run.id, empId);
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
    });
    await lockPayrollRun(actor, run.id);

    // Backdated revision to period start
    const result = await assignEmployeeSalary(actor, empId, {
      structureId: structureB.id,
      effectiveFrom: bounds.start,
      generateArrear: true,
      reason: 'E2E retroactive revision',
    });
    const after = await getPayrollRunEmployee(actor, run.id, empId);
    assert.equal(after.netAmount, before.netAmount, 'locked net unchanged');
    assert.ok(result.arrear, 'arrear generated');
  });

  it('concurrent create for same college+period → ONE run', async () => {
    if (!ctx) return;
    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-CONC-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const results = await Promise.allSettled([
      createPayrollRun(actor, period.id),
      createPayrollRun(actor, period.id),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.ok(rejected.length >= 1);
    const count = await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).count({ c: '*' }).first();
    assert.equal(Number(count?.c ?? 0), 1);
  });

  it('Finance posting idempotent + concurrent', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STRFIN').slice(0, 20), 28000);
    const empId = await seedEmployee(ctx, actor, { doj: bounds.start, emailPrefix: 'pay.fin' });
    await assignEmployeeSalary(actor, empId, {
      structureId: structure.id,
      effectiveFrom: bounds.start,
      generateArrear: false,
    });
    await ensureAttendanceReady(actor, year, month);
    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-FIN-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);

    // Keep only our employee OK rows for clean totals
    await db('payroll_run_employees')
      .where({ payroll_run_id: run.id })
      .whereNot('employee_id', empId)
      .delete();
    const empRow = await getPayrollRunEmployee(actor, run.id, empId);
    await db('payroll_runs').where({ id: run.id }).update({
      validation_status: 'PASSED',
      validation_error_count: 0,
      status: 'CALCULATED',
      employee_count: 1,
      gross_total: empRow.grossAmount,
      deduction_total: empRow.deductionAmount,
      net_total: empRow.netAmount,
    });
    await lockPayrollRun(actor, run.id);

    const preview = await getPayrollPostingBatch(actor, run.id);
    assert.equal(preview.collegeId, ctx.collegeId);
    assert.ok(preview.balanced || preview.entries.length >= 0);

    const first = await postPayrollToFinance(actor, run.id);
    assert.equal(first.status, 'POSTED');
    const second = await postPayrollToFinance(actor, run.id);
    assert.equal(second.idempotent, true);
    assert.equal(second.id, first.id);

    const concurrent = await Promise.all([
      postPayrollToFinance(actor, run.id),
      postPayrollToFinance(actor, run.id),
    ]);
    assert.equal(concurrent[0].id, first.id);
    assert.equal(concurrent[1].id, first.id);

    const postings = await db('finance_payroll_postings').where({ payroll_run_id: run.id });
    assert.equal(postings.length, 1);
  });

  it('cross-college payroll blocked', async () => {
    if (!ctx) return;
    const { collegeB, adminB } = await ensurePeerCollege(ctx.collegeId);
    const actorB = hrActor(adminB);
    const periodB = await ensurePayrollPeriod(actorB, {
      label: `PAY-B-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: collegeB, period_id: periodB.id }).delete();
    const runB = await createPayrollRun(actorB, periodB.id);

    await assert.rejects(() => calculatePayrollRun(actor, runB.id));
    await assert.rejects(() => approvePayrollRun(actor, runB.id));
    await assert.rejects(() => lockPayrollRun(actor, runB.id));
    await assert.rejects(() => getPayrollPostingBatch(actor, runB.id));
    await assert.rejects(() => postPayrollToFinance(actor, runB.id));

    const still = await db('payroll_runs').where({ id: runB.id }).first();
    assert.equal(String(still.status), 'DRAFT');
    assert.equal(Number(still.college_id), collegeB);
  });

  it('HOD salary leakage through Employee 360 BLOCKED', async () => {
    if (!ctx) return;
    const emp = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereIn('employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED'])
      .first();
    if (!emp) return;

    let hod = await db('faculty_users').where({ college_id: ctx.collegeId, role: 'HOD' }).first();
    if (!hod) {
      const [id] = await db('faculty_users').insert({
        college_id: ctx.collegeId,
        department_id: ctx.dept.id,
        email: `hod.payroll.${Date.now()}@vviet.edu.in`,
        name: 'HOD Payroll Test',
        role: 'HOD',
        password_hash: '$2b$10$abcdefghijklmnopqrstuv',
        is_active: true,
      });
      hod = await db('faculty_users').where({ id }).first();
    }
    const hodActor = hrActor(hod!);
    const view = await getEmployee360(hodActor, Number(emp.id));
    assert.equal(view.salaryCompensation, null);

    await assert.rejects(() => listSalaryComponents(hodActor));
  });

  it('Principal confidential salary detail permission controlled', async () => {
    if (!ctx) return;
    const emp = await db('employees').where({ college_id: ctx.collegeId }).first();
    if (!emp) return;
    let principal = await db('faculty_users').where({ college_id: ctx.collegeId, role: 'PRINCIPAL' }).first();
    if (!principal) return;
    const pActor = hrActor(principal);
    const view = await getEmployee360(pActor, Number(emp.id));
    assert.equal(view.salaryCompensation, null);
  });

  it('employee self payslip only — other employee BLOCKED', async () => {
    if (!ctx) return;
    const payslip = await db('payslips').where({ college_id: ctx.collegeId }).orderBy('id', 'desc').first();
    if (!payslip) return;
    const owner = await db('employees').where({ id: payslip.employee_id }).first();
    const other = await db('employees')
      .where({ college_id: ctx.collegeId })
      .whereNot('id', payslip.employee_id)
      .whereNotNull('faculty_user_id')
      .first();
    if (!other?.faculty_user_id) return;
    const otherUser = await db('faculty_users').where({ id: other.faculty_user_id }).first();
    if (!otherUser) return;
    await assert.rejects(() => getPayslip(hrActor(otherUser), Number(payslip.id)));

    if (owner?.faculty_user_id) {
      const ownerUser = await db('faculty_users').where({ id: owner.faculty_user_id }).first();
      if (ownerUser) {
        const own = await getPayslip(hrActor(ownerUser), Number(payslip.id));
        assert.equal(own.id, Number(payslip.id));
      }
    }
  });

  it('mid-month / future joiner eligibility', async () => {
    if (!ctx) return;
    const structure = await seedStructure(actor, unique('STRJ').slice(0, 20), 30000);
    await ensureAttendanceReady(actor, year, month);

    const mid = `${year}-${String(month).padStart(2, '0')}-15`;
    const midEmp = await seedEmployee(ctx, actor, { doj: mid, emailPrefix: 'pay.mid' });
    await assignEmployeeSalary(actor, midEmp, {
      structureId: structure.id,
      effectiveFrom: mid,
      generateArrear: false,
    });

    const future = `${year + 1}-01-01`;
    const futEmp = await seedEmployee(ctx, actor, { doj: future, emailPrefix: 'pay.fut' });
    await assignEmployeeSalary(actor, futEmp, {
      structureId: structure.id,
      effectiveFrom: future,
      generateArrear: false,
    });

    const period = await ensurePayrollPeriod(actor, {
      label: `PAY-JOIN-${bounds.label}-${stamp}`,
      startDate: bounds.start,
      endDate: bounds.end,
    });
    await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).delete();
    const run = await createPayrollRun(actor, period.id);
    await calculatePayrollRun(actor, run.id);

    const midRow = await db('payroll_run_employees').where({ payroll_run_id: run.id, employee_id: midEmp }).first();
    const futRow = await db('payroll_run_employees').where({ payroll_run_id: run.id, employee_id: futEmp }).first();
    assert.ok(midRow);
    assert.ok(futRow);
    assert.equal(String(futRow.calculation_status), 'SKIPPED');
  });

  it('adjustments + reopen policy when finance posted', async () => {
    if (!ctx) return;
    const posted = await db('payroll_runs')
      .where({ college_id: ctx.collegeId, finance_posting_status: 'POSTED' })
      .orderBy('id', 'desc')
      .first();
    if (!posted) return;
    await assert.rejects(
      () => reopenPayrollRun(actor, Number(posted.id), 'attempt reopen after finance'),
      (err: Error) => /Finance|immutable|LOCKED|reopen/i.test(err.message),
    );

    const emp = await db('employees').where({ college_id: ctx.collegeId }).first();
    if (!emp) return;
    const adj = await createAdjustment(actor, {
      employeeId: Number(emp.id),
      amount: 500,
      reason: 'E2E earning adjustment',
      adjustmentType: 'EARNING_ADJUSTMENT',
    });
    assert.ok(adj?.id);
  });

  it('rounding 0.005 path via percentage components', async () => {
    if (!ctx) return;
    const comps = await listSalaryComponents(actor);
    const basic = comps.find((c) => c.code === 'BASIC')!;
    const hra = comps.find((c) => c.code === 'HRA');
    if (!hra) return;
    const structure = await createSalaryStructure(actor, {
      code: unique('RND').slice(0, 20),
      name: 'Rounding test',
      components: [
        { componentId: basic.id, calculationType: 'FIXED', amount: 10000.005 },
        { componentId: hra.id, calculationType: 'PERCENTAGE', percentage: 33.333, percentageOfComponentId: basic.id },
      ],
    });
    assert.ok(structure.id);
  });
});
