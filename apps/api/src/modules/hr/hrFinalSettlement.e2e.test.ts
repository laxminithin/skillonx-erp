/**
 * HRMS Final Settlement / Full & Final E2E.
 * Proves orchestration, snapshots, no double-pay, clearance, Finance idempotency, privacy.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { hrInitiateSeparation } from './lifecycleSeparation.js';
import { assignEmployeeSalary, createSalaryStructure, listSalaryComponents } from './salaryStructures.js';
import { getEmployee360 } from './lifecycleEmployee.js';
import { ensureFnfFinanceDefaults } from '../finance/fnfPosting.js';
import { getOrCreateFacultyMember } from '../library/members.js';
import {
  fnfSchemaReady,
  createSettlementCase,
  calculateSettlement,
  approveSettlement,
  postSettlementToFinance,
  markSettled,
  closeSettlement,
  reopenSettlement,
  addManualAdjustment,
  setNoticeWaiver,
  mutateLockedBlocked,
  getCase,
  getMySettlement,
  dashboard,
} from './fnf.js';
import { decideClearance, getHodClearanceDetail, listHodClearanceInbox } from './fnfClearance.js';
import { generateDocuments, getDocument } from './fnfDocuments.js';
import { settlementRegister } from './fnfReports.js';

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

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await fnfSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const depts = await db('departments').where({ college_id: collegeId }).orderBy('id');
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
    if (!admin || !depts.length || !des || !empType) return null;
    const deptB = depts[1] ?? depts[0];
    return { collegeId, admin, dept: depts[0], deptB, des, empType };
  } catch {
    return null;
  }
}

async function otherFacultyId(ctx: Ctx) {
  const row = await db('faculty_users').where({ college_id: ctx.collegeId }).whereNot('id', ctx.admin.id).first();
  assert.ok(row, 'Need a second faculty user');
  return Number(row.id);
}

async function approveAsChecker(ctx: Ctx, actor: HrActor, settlementId: number) {
  await db('hr_final_settlements').where({ id: settlementId }).update({ created_by: await otherFacultyId(ctx) });
  return approveSettlement(actor, settlementId);
}

async function seedFacultyWithEmployee(ctx: Ctx, role: string, departmentId: number) {
  return db.transaction(async (trx) => {
    // Avoid polluting leaveApprover legacyHodEmployees / legacyPrincipalEmployees.
    const persistedRole = role === 'HOD' || role === 'PRINCIPAL' ? 'FACULTY' : role;
    const [facultyId] = await trx('faculty_users').insert({
      college_id: ctx.collegeId,
      email: `fnf.${role}.${unique('f')}@test.edu`,
      name: `FNF ${role}`,
      role: persistedRole,
      department_id: departmentId,
      password_hash: '$2b$10$abcdefghijklmnopqrstuv',
      is_active: true,
    });
    const number = `FNF${facultyId}${Date.now()}`.slice(0, 32);
    const [employeeId] = await trx('employees').insert({
      college_id: ctx.collegeId,
      employee_number: number,
      first_name: 'Fnf',
      last_name: role.slice(0, 16),
      display_name: `Fnf ${role} ${facultyId}`,
      employee_category: 'NON_TEACHING',
      department_id: departmentId,
      designation_id: Number(ctx.des.id),
      employment_type_id: Number(ctx.empType.id),
      official_email: `fnf.emp.${facultyId}.${Date.now()}@vviet.edu.in`,
      date_of_joining: '2018-01-01',
      employment_status: 'ACTIVE',
      notice_period_days: 0,
      faculty_user_id: Number(facultyId),
    });
    return { facultyId: Number(facultyId), employeeId: Number(employeeId) };
  });
}

async function ensurePeerCollege(collegeA: number) {
  const collegeBRow = await db('colleges').whereNot('id', collegeA).orderBy('id', 'asc').first();
  assert.ok(collegeBRow, 'Second college required');
  const collegeB = Number(collegeBRow.id);
  await ensureCollegeHrmsDefaults(collegeB);
  await ensureFnfFinanceDefaults(collegeB);
  let adminB = await db('faculty_users').where({ college_id: collegeB, role: 'COLLEGE_ADMIN' }).first();
  if (!adminB) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeB,
      email: `fnf.admin.b.${Date.now()}@test.edu`,
      name: 'FNF Admin B',
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
  opts: { doj: string; lwd?: string; noticeDays?: number; facultyUserId?: number | null; departmentId?: number; emailPrefix: string },
) {
  const number = `FNF${Date.now()}${Math.floor(Math.random() * 999)}`.slice(0, 32);
  const [id] = await db('employees').insert({
    college_id: ctx.collegeId,
    employee_number: number,
    first_name: 'Fnf',
    last_name: unique('Emp').slice(0, 32),
    display_name: `Fnf Emp ${number}`,
    employee_category: 'NON_TEACHING',
    department_id: opts.departmentId ?? Number(ctx.dept.id),
    designation_id: Number(ctx.des.id),
    employment_type_id: Number(ctx.empType.id),
    official_email: `${opts.emailPrefix}.${Date.now()}@vviet.edu.in`,
    date_of_joining: opts.doj,
    employment_status: 'ACTIVE',
    notice_period_days: opts.noticeDays ?? 30,
    faculty_user_id: opts.facultyUserId ?? null,
    last_working_date: opts.lwd ?? null,
  });
  return Number(id);
}

async function seedFaculty(ctx: Ctx, role: string, departmentId: number) {
  const [id] = await db('faculty_users').insert({
    college_id: ctx.collegeId,
    email: `fnf.${role}.${unique('f')}@test.edu`,
    name: `FNF ${role}`,
    role,
    department_id: departmentId,
    password_hash: '$2b$10$abcdefghijklmnopqrstuv',
    is_active: true,
  });
  return Number(id);
}

async function seedStructure(actor: HrActor, code: string, basicAmount: number) {
  const comps = await listSalaryComponents(actor);
  const basic = comps.find((c) => c.code === 'BASIC');
  assert.ok(basic, 'BASIC component required');
  return createSalaryStructure(actor, {
    code: code.slice(0, 32),
    name: `FNF ${code}`,
    components: [{ componentId: basic.id, calculationType: 'FIXED', amount: basicAmount }],
  });
}

async function seedElBalance(ctx: Ctx, employeeId: number, days: number) {
  const el = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'EL' }).first();
  if (!el) return;
  await db('hr_leave_policies').where({ college_id: ctx.collegeId, leave_type_id: el.id }).update({ encashment_eligible: true });
  const year = new Date().getFullYear();
  const existing = await db('employee_leave_balances').where({ employee_id: employeeId, leave_type_id: el.id, year }).first();
  const payload = {
    college_id: ctx.collegeId,
    employee_id: employeeId,
    leave_type_id: Number(el.id),
    year,
    opening_balance: days,
    credited: days,
    availed: 0,
    adjusted: 0,
    carried_forward: 0,
    available_balance: days,
  };
  if (existing) await db('employee_leave_balances').where({ id: existing.id }).update(payload);
  else await db('employee_leave_balances').insert(payload);
}

async function seedLockedPayroll(ctx: Ctx, actor: HrActor, employeeId: number, lwd: string, net: number) {
  void actor;
  const periodLabel = `FNF-${employeeId}`.slice(0, 64);
  const start = `${lwd.slice(0, 7)}-01`;
  let period = await db('payroll_periods').where({ college_id: ctx.collegeId, label: periodLabel }).first();
  if (!period) {
    const [pid] = await db('payroll_periods').insert({
      college_id: ctx.collegeId,
      label: periodLabel,
      start_date: start,
      end_date: lwd,
      status: 'LOCKED',
    });
    period = await db('payroll_periods').where({ id: pid }).first();
  }
  let run = await db('payroll_runs').where({ college_id: ctx.collegeId, period_id: period.id }).first();
  if (!run) {
    const [runId] = await db('payroll_runs').insert({
      college_id: ctx.collegeId,
      period_id: period.id,
      run_number: unique('PAYFNF'),
      status: 'LOCKED',
    });
    run = await db('payroll_runs').where({ id: runId }).first();
  }
  const existingEmp = await db('payroll_run_employees').where({ payroll_run_id: run.id, employee_id: employeeId }).first();
  if (!existingEmp) {
    await db('payroll_run_employees').insert({
      payroll_run_id: run.id,
      employee_id: employeeId,
      gross_amount: net,
      deduction_amount: 0,
      net_amount: net,
      status: 'CALCULATED',
      lop_days: 2,
      calculation_status: 'OK',
    });
  }
  return Number(run.id);
}

async function seedFinanceDue(ctx: Ctx, employeeId: number, amount: number, sourceRef: string, status = 'OPEN') {
  const [id] = await db('employee_finance_dues').insert({
    college_id: ctx.collegeId,
    employee_id: employeeId,
    due_type: 'ADVANCE',
    source_ref: sourceRef,
    amount,
    outstanding: status === 'OPEN' ? amount : 0,
    status,
  });
  return Number(id);
}

async function seedLibraryFine(ctx: Ctx, facultyUserId: number, amount: number) {
  const member = await getOrCreateFacultyMember(facultyUserId, ctx.collegeId);
  await db('library_fines').insert({
    college_id: ctx.collegeId,
    member_id: member.id,
    fine_type: 'OVERDUE',
    amount,
    outstanding_amount: amount,
    status: 'DUE',
  });
  return member.id;
}

async function clearHuman(actor: HrActor, settlementId: number) {
  for (const domain of ['DEPARTMENT', 'HR', 'IT']) {
    await decideClearance(actor, settlementId, domain, { status: 'CLEARED', remarks: 'e2e clear' });
  }
}

async function startCase(ctx: Ctx, actor: HrActor, opts?: { noticeDays?: number; lwd?: string; employeeId?: number }) {
  const today = ymd(new Date());
  const doj = '2020-01-01';
  const lwd = opts?.lwd ?? today;
  const employeeId = opts?.employeeId ?? await seedEmployee(ctx, {
    doj,
    lwd,
    noticeDays: opts?.noticeDays ?? 30,
    facultyUserId: null,
    emailPrefix: unique('fnf.emp'),
  });
  if (opts?.employeeId) {
    await db('employees').where({ id: employeeId }).update({
      last_working_date: lwd,
      notice_period_days: opts?.noticeDays ?? 0,
      employment_status: 'ACTIVE',
    });
  }
  const structure = await seedStructure(actor, unique('FS'), 30000);
  await assignEmployeeSalary(actor, employeeId, { structureId: structure.id, effectiveFrom: doj });
  await seedElBalance(ctx, employeeId, 10);
  const sep = await hrInitiateSeparation(actor, employeeId, {
    separationType: 'RESIGNATION',
    lastWorkingDate: lwd,
    reason: 'E2E F&F',
    noticePeriodDays: opts?.noticeDays ?? 30,
  });
  const created = await createSettlementCase(actor, Number(sep.id));
  return { employeeId, separationId: Number(sep.id), settlementId: Number(created.id), lwd, created };
}

describe('hr final settlement E2E', { timeout: 180_000 }, () => {
  it('creates one F&F case per separation and is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensureFnfFinanceDefaults(ctx.collegeId);
    const { separationId, settlementId, created } = await startCase(ctx, actor);
    assert.equal(created.status, 'CLEARANCE_PENDING');
    assert.ok(created.lastWorkingDate);
    const again = await createSettlementCase(actor, separationId);
    assert.equal(Number(again.id), settlementId);
    assert.equal(again.idempotent, true);
    const [a, b] = await Promise.all([
      createSettlementCase(actor, separationId),
      createSettlementCase(actor, separationId),
    ]);
    assert.equal(Number(a.id), settlementId);
    assert.equal(Number(b.id), settlementId);
    const dash = await dashboard(actor);
    assert.ok(dash.clearancePending >= 1);
  });

  it('detects library and finance dues; unresolved clearance blocks approval', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const pair = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const { settlementId, employeeId } = await startCase(ctx, actor, { employeeId: pair.employeeId, noticeDays: 0 });
    await seedLibraryFine(ctx, pair.facultyId, 250);
    await seedFinanceDue(ctx, employeeId, 1000, unique('ADV'));
    const synced = await (await import('./fnf.js')).syncSettlementSources(actor, settlementId);
    const lib = (synced.clearances as Array<{ domain: string; status: string }>).find((c) => c.domain === 'LIBRARY');
    const fin = (synced.clearances as Array<{ domain: string; status: string }>).find((c) => c.domain === 'FINANCE');
    assert.equal(lib?.status, 'DUE');
    assert.equal(fin?.status, 'DUE');
    await calculateSettlement(actor, settlementId);
    await clearHuman(actor, settlementId);
    await assert.rejects(
      () => approveAsChecker(ctx, actor, settlementId),
      (err: Error & { code?: string }) => err.code === 'FNF_CLEARANCE_BLOCKED',
    );
    await decideClearance(actor, settlementId, 'LIBRARY', { status: 'WAIVED', waive: true, remarks: 'override fine for e2e', override: true, overrideReason: 'Authorized library waiver for e2e' });
    await decideClearance(actor, settlementId, 'FINANCE', { status: 'CLEARED', override: true, overrideReason: 'Recover via settlement' });
  });

  it('calculates encashment, notice pay, recoveries, net payable and receivable', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const { settlementId, employeeId, lwd } = await startCase(ctx, actor, { noticeDays: 30 });
    await seedLockedPayroll(ctx, actor, employeeId, lwd, 28000);
    await seedFinanceDue(ctx, employeeId, 500, unique('ADV'));
    await calculateSettlement(actor, settlementId);
    let view = await getCase(actor, settlementId);
    const unpaid = (view.payables as Array<{ code: string; amount: string; trace?: { doublePayPrevented?: boolean } }>).find((c) => c.code === 'UNPAID_SALARY');
    assert.ok(unpaid);
    assert.equal(unpaid.amount, '0.00');
    assert.equal(unpaid.trace?.doublePayPrevented, true);
    const encash = (view.payables as Array<{ code: string; amount: string }>).find((c) => c.code === 'LEAVE_ENCASHMENT');
    assert.ok(encash);
    assert.ok(Number(encash.amount) > 0);
    const notice = (view.recoveries as Array<{ code: string; amount: string; quantity?: number }>).find((c) => c.code === 'NOTICE_PAY');
    assert.ok(notice);
    assert.ok(Number(notice.amount) > 0);
    const due = (view.recoveries as Array<{ code: string }>).find((c) => String(c.code).startsWith('FINANCE_'));
    assert.ok(due);
    assert.equal(view.settlementDirection, 'RECEIVABLE_FROM_EMPLOYEE');
    assert.ok(Number(view.netAmount) < 0);

    await setNoticeWaiver(actor, settlementId, true, 'Notice waived by HR for e2e');
    await addManualAdjustment(actor, settlementId, { side: 'PAYABLE', amount: 50000, reason: 'Approved bonus adjustment', code: 'BONUS' });
    view = await calculateSettlement(actor, settlementId);
    const waived = (view.recoveries as Array<{ code: string; amount: string }>).find((c) => c.code === 'NOTICE_PAY');
    assert.equal(waived?.amount, '0.00');
    assert.equal(view.settlementDirection, 'PAYABLE_TO_EMPLOYEE');
    assert.ok(Number(view.grossPayable) > Number(view.totalRecoveries));
  });

  it('snapshots inputs; later source changes do not alter approved F&F; lock blocks mutation', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensureFnfFinanceDefaults(ctx.collegeId);
    const { settlementId, employeeId } = await startCase(ctx, actor, { noticeDays: 0 });
    await calculateSettlement(actor, settlementId);
    await clearHuman(actor, settlementId);
    await assert.rejects(() => approveSettlement(actor, settlementId), (err: Error & { code?: string }) => err.code === 'FNF_SELF_APPROVAL');
    const before = await approveAsChecker(ctx, actor, settlementId);
    const beforeNet = String(before.netAmount);
    const beforeSnap = before.inputSnapshot as { leaves?: Array<{ availableBalance: number }> };

    await seedElBalance(ctx, employeeId, 99);
    await db('employee_finance_dues').insert({
      college_id: ctx.collegeId,
      employee_id: employeeId,
      due_type: 'MISC',
      source_ref: unique('LATE'),
      amount: 9999,
      outstanding: 9999,
      status: 'OPEN',
    });
    await assert.rejects(() => calculateSettlement(actor, settlementId), (err: Error & { code?: string }) => err.code === 'FNF_LOCKED');
    await assert.rejects(() => mutateLockedBlocked(settlementId), (err: Error & { code?: string }) => err.code === 'FNF_LOCKED');
    const after = await getCase(actor, settlementId);
    assert.equal(String(after.netAmount), beforeNet);
    assert.deepEqual(
      (after.inputSnapshot as { leaves?: Array<{ availableBalance: number }> }).leaves?.map((l) => l.availableBalance),
      beforeSnap.leaves?.map((l) => l.availableBalance),
    );
  });

  it('maker-checker, finance posting idempotent including concurrent, reopen versioned', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensureFnfFinanceDefaults(ctx.collegeId);
    const { settlementId } = await startCase(ctx, actor, { noticeDays: 0 });
    await addManualAdjustment(actor, settlementId, { side: 'PAYABLE', amount: 1000, reason: 'Approved residual payable' });
    await calculateSettlement(actor, settlementId);
    await clearHuman(actor, settlementId);
    await assert.rejects(() => approveSettlement(actor, settlementId), (err: Error & { code?: string }) => err.code === 'FNF_SELF_APPROVAL');
    await approveAsChecker(ctx, actor, settlementId);
    const first = await postSettlementToFinance(actor, settlementId);
    const second = await postSettlementToFinance(actor, settlementId);
    assert.equal(second.posting.idempotent, true);
    assert.equal(Number(second.posting.id), Number(first.posting.id));
    const [p1, p2] = await Promise.all([
      postSettlementToFinance(actor, settlementId),
      postSettlementToFinance(actor, settlementId),
    ]);
    assert.equal(Number(p1.posting.id), Number(p2.posting.id));
    const posts = await db('finance_fnf_postings').where({ settlement_id: settlementId, status: 'POSTED' });
    assert.equal(posts.length, 1);
    await markSettled(actor, settlementId);
    const docs = await generateDocuments(actor, settlementId);
    assert.ok((docs.documents as unknown[]).length >= 3);
    await closeSettlement(actor, settlementId);
    const reopened = await reopenSettlement(actor, settlementId, 'Correction after posting for e2e');
    assert.equal(reopened.status, 'REOPENED');
    const reversed = await db('finance_fnf_postings').where({ settlement_id: settlementId, status: 'REVERSED' });
    assert.ok(reversed.length >= 1);
  });

  it('HOD department clearance scoped; salary hidden; employee self isolation; tenant isolation', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensureFnfFinanceDefaults(ctx.collegeId);

    const hod = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.dept.id));
    const hodOther = await seedFacultyWithEmployee(ctx, 'HOD', Number(ctx.deptB.id));
    const emp = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const otherEmpPair = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.deptB.id));

    const { settlementId, employeeId } = await startCase(ctx, actor, { employeeId: emp.employeeId, noticeDays: 0 });

    const otherSep = await hrInitiateSeparation(actor, otherEmpPair.employeeId, {
      separationType: 'RESIGNATION',
      lastWorkingDate: ymd(new Date()),
      reason: 'other dept',
      noticePeriodDays: 0,
    });
    const otherCase = await createSettlementCase(actor, Number(otherSep.id));

    const hodActor = hrActor(
      { id: hod.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'HOD', name: 'HOD A' },
      { hodDepartmentIds: [Number(ctx.dept.id)], leadershipRoles: ['HOD'] },
    );
    const hodB = hrActor(
      { id: hodOther.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.deptB.id), role: 'HOD', name: 'HOD B' },
      { hodDepartmentIds: [Number(ctx.deptB.id)], leadershipRoles: ['HOD'] },
    );

    const inbox = await listHodClearanceInbox(hodActor);
    assert.ok(inbox.some((i) => i.settlementId === settlementId));
    assert.ok(!inbox.some((i) => i.settlementId === Number(otherCase.id)));
    const detail = await getHodClearanceDetail(hodActor, settlementId);
    assert.equal((detail as { payables?: unknown }).payables, undefined);
    await assert.rejects(() => getHodClearanceDetail(hodActor, Number(otherCase.id)));
    await assert.rejects(() => getCase(hodActor, settlementId));
    const emp360 = await getEmployee360(hodActor, employeeId);
    assert.equal(emp360.salaryCompensation, null);

    await decideClearance(hodActor, settlementId, 'DEPARTMENT', { status: 'CLEARED', remarks: 'dept handover done' });
    await assert.rejects(() => decideClearance(hodB, settlementId, 'DEPARTMENT', { status: 'CLEARED', remarks: 'no' }));

    const self = hrActor({ id: emp.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY', name: 'Emp A' });
    const otherSelf = hrActor({ id: otherEmpPair.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.deptB.id), role: 'FACULTY', name: 'Emp B' });
    const mine = await getMySettlement(self);
    assert.ok(mine);
    assert.equal(mine.id, settlementId);
    const otherView = await getMySettlement(otherSelf);
    assert.ok(!otherView || otherView.id !== settlementId);
    await assert.rejects(() => getDocument(otherSelf, settlementId, 'STATEMENT'));

    const { collegeB, adminB } = await ensurePeerCollege(ctx.collegeId);
    const actorB = hrActor(adminB);
    await assert.rejects(() => getCase(actorB, settlementId));
    await assert.rejects(() => calculateSettlement(actorB, settlementId));
    await assert.rejects(() => approveSettlement(actorB, settlementId));
    await assert.rejects(() => postSettlementToFinance(actorB, settlementId));
    const reg = await settlementRegister(actorB);
    assert.ok(Array.isArray(reg));
    assert.ok(!reg.some((r: { caseNumber?: string }) => r.caseNumber === mine?.caseNumber));
    void collegeB;
  });

  it('released documents use historical employment facts', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const actor = hrActor(ctx.admin);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    await ensureFnfFinanceDefaults(ctx.collegeId);
    const pair = await seedFacultyWithEmployee(ctx, 'FACULTY', Number(ctx.dept.id));
    const { settlementId, employeeId } = await startCase(ctx, actor, { employeeId: pair.employeeId, noticeDays: 0 });
    await calculateSettlement(actor, settlementId);
    await clearHuman(actor, settlementId);
    await approveAsChecker(ctx, actor, settlementId);
    await postSettlementToFinance(actor, settlementId);
    await generateDocuments(actor, settlementId);
    const stmt = await getDocument(actor, settlementId, 'STATEMENT');
    assert.equal(stmt.releaseStatus, 'RELEASED');
    assert.ok(stmt.fields.lastWorkingDate);
    const letter = await getDocument(actor, settlementId, 'RELIEVING_LETTER');
    assert.match(String(letter.body), /RELIEVING LETTER/);
    const exp = await getDocument(actor, settlementId, 'EXPERIENCE_CERTIFICATE');
    assert.match(String(exp.body), /EXPERIENCE/);
    const originalJoin = stmt.fields.joiningDate;
    await db('employees').where({ id: employeeId }).update({ date_of_joining: '2010-01-01', display_name: 'Mutated Name' });
    const stmt2 = await getDocument(actor, settlementId, 'STATEMENT');
    assert.equal(stmt2.fields.joiningDate, originalJoin);
    const self = hrActor({ id: pair.facultyId, college_id: ctx.collegeId, department_id: Number(ctx.dept.id), role: 'FACULTY' });
    const own = await getDocument(self, settlementId, 'STATEMENT');
    assert.equal(own.releaseStatus, 'RELEASED');
  });
});
