/**
 * HRMS Attendance & Leave Closure E2E tests.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { createEmployee, markEmployeeJoined } from './lifecycleEmployee.js';
import {
  attendanceSchemaReady,
  calculateDailyAttendance,
  calculateEmployeeDay,
  upsertDailyRecord,
  recalculateEmployeeRange,
} from './attendanceEngine.js';
import { importPunch } from './attendancePunches.js';
import { submitRegularization, approveRegularization } from './attendanceRegularization.js';
import { processMonth, finalizeMonth, lockMonth, reopenMonth, detectExceptions } from './attendanceClosure.js';
import { computeMonthlySummary } from './attendanceMonthly.js';
import { getPayrollAttendanceHandoff } from './attendancePayrollHandoff.js';
import { createHoliday } from './attendanceConfig.js';
import {
  getEmployeeAttendanceAdmin,
  listAdminAttendanceRegister,
  recordAttendance,
  overrideAttendance,
} from './attendance.js';
import { asISODate } from '../timetable/time.js';

export async function attendanceClosureSchemaReady(): Promise<boolean> {
  return attendanceSchemaReady();
}

type Ctx = {
  collegeId: number;
  admin: { id: number; college_id: number; department_id?: number | null; role: string; name?: string };
  dept: { id: number };
  des: { id: number };
  empType: { id: number };
  anita?: { id: number; faculty_user_id?: number };
};

async function e2eContext(): Promise<Ctx | null> {
  try {
    if (!(await attendanceClosureSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita.cse@vviet.edu.in' }).first();
    const dept = await db('departments').where({ college_id: collegeId }).first();
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
    if (!admin || !dept || !des || !empType) return null;
    return { collegeId, admin, anita, dept, des, empType };
  } catch {
    return null;
  }
}

function hrActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

function localYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}@vviet.edu.in`;
}

let sharedCtx: Ctx | null = null;
let sharedEmployeeId: number | null = null;
let sharedDoj: string | null = null;

async function ensureSharedEmployee(): Promise<{ ctx: Ctx; employeeId: number; doj: string } | null> {
  const ctx = sharedCtx ?? (await e2eContext());
  if (!ctx) return null;
  sharedCtx = ctx;
  await ensureCollegeHrmsDefaults(ctx.collegeId);

  if (ctx.anita) {
    const linked = await db('employees').where({ faculty_user_id: ctx.anita.id, college_id: ctx.collegeId }).first();
    if (linked && ['ACTIVE', 'PROBATION', 'CONFIRMED'].includes(String(linked.employment_status))) {
      const doj = asISODate(linked.date_of_joining) || localYmd(new Date());
      sharedEmployeeId = Number(linked.id);
      sharedDoj = doj;
      return { ctx, employeeId: Number(linked.id), doj };
    }
  }

  const active = await db('employees')
    .where({ college_id: ctx.collegeId })
    .whereIn('employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED'])
    .whereNotNull('date_of_joining')
    .orderBy('date_of_joining', 'asc')
    .first();
  if (active) {
    const doj = asISODate(active.date_of_joining) || localYmd(new Date());
    sharedEmployeeId = Number(active.id);
    sharedDoj = doj;
    return { ctx, employeeId: Number(active.id), doj };
  }

  if (sharedEmployeeId && sharedDoj) return { ctx, employeeId: sharedEmployeeId, doj: sharedDoj };

  const actor = hrActor(ctx.admin);
  const doj = localYmd(new Date());
  const created = await createEmployee(actor, {
    firstName: 'Att',
    lastName: `Shared${Date.now()}`,
    employeeCategory: 'NON_TEACHING',
    departmentId: Number(ctx.dept.id),
    designationId: Number(ctx.des.id),
    employmentTypeId: Number(ctx.empType.id),
    officialEmail: uniqueEmail('att.shared'),
    dateOfJoining: doj,
    authMode: 'NO_LOGIN',
    employmentStatus: 'PRE_JOINING',
  });
  await markEmployeeJoined(actor, created.id, { overrideOnboarding: true, reason: 'E2E shared employee' });
  sharedEmployeeId = created.id;
  sharedDoj = doj;
  return { ctx, employeeId: created.id, doj };
}

/**
 * Seeds a second college with COLLEGE_ADMIN + ACTIVE employee so tenant isolation
 * assertions cannot silently skip when peer college HR fixtures are empty.
 */
async function ensurePeerCollegeFixture(collegeA: number): Promise<{
  collegeB: number;
  adminB: { id: number; college_id: number; department_id?: number | null; role: string; name?: string };
  empB: { id: number };
}> {
  const collegeBRow = await db('colleges').whereNot('id', collegeA).orderBy('id', 'asc').first();
  assert.ok(collegeBRow, 'Second college required for two-college tenant isolation');
  const collegeB = Number(collegeBRow.id);

  await ensureCollegeHrmsDefaults(collegeB);

  let dept = await db('departments').where({ college_id: collegeB }).first();
  if (!dept) {
    const [deptId] = await db('departments').insert({
      college_id: collegeB,
      name: 'E2E Peer Department',
      code: `E2E-PEER-${collegeB}`,
    });
    dept = await db('departments').where({ id: deptId }).first();
  }
  assert.ok(dept, 'Peer college department required');

  const des = await db('hr_designations').where({ college_id: collegeB, code: 'ASST_PROF' }).first()
    ?? await db('hr_designations').where({ college_id: collegeB }).first();
  const empType = await db('employment_types').where({ college_id: collegeB, code: 'PERMANENT' }).first()
    ?? await db('employment_types').where({ college_id: collegeB }).first();
  assert.ok(des && empType, 'Peer college designation and employment type required');

  let adminB = await db('faculty_users').where({ college_id: collegeB, role: 'COLLEGE_ADMIN' }).first();
  if (!adminB) {
    const email = `e2e.peer.admin.${collegeB}@example.test`;
    const existing = await db('faculty_users').where({ email }).first();
    if (existing) {
      await db('faculty_users').where({ id: existing.id }).update({
        college_id: collegeB,
        role: 'COLLEGE_ADMIN',
        is_active: true,
        department_id: Number(dept.id),
      });
      adminB = await db('faculty_users').where({ id: existing.id }).first();
    } else {
      const [fuId] = await db('faculty_users').insert({
        college_id: collegeB,
        department_id: Number(dept.id),
        name: 'E2E Peer College Admin',
        email,
        password_hash: '$2b$10$cr3x..qXChDlVfZKceooAeT9k/cT/HZN89DGlRa6hJhfKuxpA8qya',
        role: 'COLLEGE_ADMIN',
        is_active: true,
        employee_id: `E2E-ADMIN-${collegeB}`,
      });
      adminB = await db('faculty_users').where({ id: fuId }).first();
    }
  }
  assert.ok(adminB, 'Peer college COLLEGE_ADMIN required');

  let empB = await db('employees')
    .where({ college_id: collegeB })
    .whereIn('employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED'])
    .first();
  if (!empB) {
    const actorB = hrActor(adminB);
    const doj = localYmd(new Date());
    const created = await createEmployee(actorB, {
      firstName: 'Peer',
      lastName: `College${collegeB}`,
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(dept.id),
      designationId: Number(des.id),
      employmentTypeId: Number(empType.id),
      officialEmail: uniqueEmail(`att.peer.${collegeB}`),
      dateOfJoining: doj,
      authMode: 'NO_LOGIN',
      employmentStatus: 'PRE_JOINING',
    });
    await markEmployeeJoined(actorB, created.id, { overrideOnboarding: true, reason: 'E2E peer college employee' });
    empB = await db('employees').where({ id: created.id }).first();
  }
  assert.ok(empB, 'Peer college ACTIVE employee required');

  return { collegeB, adminB, empB: { id: Number(empB.id) } };
}

async function ensureSmallClosureContext(): Promise<{
  actor: HrActor;
  collegeId: number;
  employeeId: number;
} | null> {
  const ctx = await e2eContext();
  if (!ctx) return null;
  const peer = await ensurePeerCollegeFixture(ctx.collegeId);
  return {
    actor: hrActor(peer.adminB),
    collegeId: peer.collegeB,
    employeeId: peer.empB.id,
  };
}

async function pickApplicableDate(employeeId: number, minDate: string, offset = 0): Promise<string> {
  const start = new Date(minDate);
  start.setDate(start.getDate() + offset);
  for (let i = 0; i < 45; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = localYmd(d);
    const result = await calculateEmployeeDay(employeeId, date);
    if (!['HOLIDAY', 'WEEKLY_OFF', 'NOT_JOINED', 'SEPARATED', 'SUSPENDED'].includes(result.status)) {
      return date;
    }
    if (result.status === 'NOT_JOINED' && date >= minDate) {
      // try next day if before joining
      continue;
    }
  }
  return localYmd(start);
}

describe('HR Attendance Closure E2E', () => {
  after(async () => {
    await db.destroy();
  });

  before(async () => {
    sharedCtx = await e2eContext();
    if (sharedCtx) await ensureCollegeHrmsDefaults(sharedCtx.collegeId);
  });

  it('schema ready', async () => {
    assert.equal(await attendanceClosureSchemaReady(), true);
  });

  it('Scenario 1 — Normal Present Day', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const { ctx, employeeId, doj } = pack;
    const date = await pickApplicableDate(employeeId, doj, 0);
    const ext = Date.now();
    await importPunch(ctx.collegeId, { employeeId, punchAt: `${date}T09:00:00`, punchType: 'IN', externalEventId: `P1-IN-${ext}` });
    await importPunch(ctx.collegeId, { employeeId, punchAt: `${date}T17:00:00`, punchType: 'OUT', externalEventId: `P1-OUT-${ext}` });
    const result = await calculateEmployeeDay(employeeId, date);
    assert.equal(result.status, 'PRESENT');
  });

  it('Scenario 2 — Half Day', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const { ctx, employeeId, doj } = pack;
    const date = await pickApplicableDate(employeeId, doj, 1);
    const ext = Date.now();
    await db('employee_attendance_punches').where({ employee_id: employeeId, college_id: ctx.collegeId }).whereRaw('DATE(punch_at) = ?', [date]).delete();
    await importPunch(ctx.collegeId, { employeeId, punchAt: `${date}T09:00:00`, punchType: 'IN', externalEventId: `HD-IN-${ext}` });
    await importPunch(ctx.collegeId, { employeeId, punchAt: `${date}T13:00:00`, punchType: 'OUT', externalEventId: `HD-OUT-${ext}` });
    const result = await calculateEmployeeDay(employeeId, date);
    assert.equal(result.status, 'HALF_DAY');
  });

  it('Scenario 3 — Absence', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const date = await pickApplicableDate(pack.employeeId, pack.doj, 2);
    const result = await calculateEmployeeDay(pack.employeeId, date);
    assert.equal(result.status, 'ABSENT');
  });

  it('Scenario 6 — Holiday', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const actor = hrActor(pack.ctx.admin);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const date = localYmd(d);
    await createHoliday(actor, { name: `E2E Hol ${Date.now()}`, holidayDate: date, holidayType: 'INSTITUTION' });
    const result = await calculateEmployeeDay(pack.employeeId, date);
    assert.equal(result.status, 'HOLIDAY');
  });

  it('Scenario 9 — Incomplete Punch', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const date = await pickApplicableDate(pack.employeeId, pack.doj, 3);
    await db('employee_attendance_punches').where({ employee_id: pack.employeeId, college_id: pack.ctx.collegeId }).whereRaw('DATE(punch_at) = ?', [date]).delete();
    await importPunch(pack.ctx.collegeId, { employeeId: pack.employeeId, punchAt: `${date}T09:00:00`, punchType: 'IN', externalEventId: `INC-${Date.now()}` });
    const result = await calculateEmployeeDay(pack.employeeId, date);
    assert.equal(result.status, 'MISSING_PUNCH');
    assert.equal(result.isUnresolved, true);
  });

  it('Scenario 11 — Joining Mid-Month', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const mid = new Date();
    mid.setDate(14);
    const doj = localYmd(mid);
    const before = new Date(mid);
    before.setDate(10);
    const result = await calculateEmployeeDay(pack.employeeId, localYmd(before));
    if (asISODate(await db('employees').where({ id: pack.employeeId }).first().then((e) => e?.date_of_joining)) <= localYmd(before)) {
      assert.notEqual(result.status, 'NOT_JOINED');
    } else {
      assert.equal(result.status, 'NOT_JOINED');
    }
    const summary = await computeMonthlySummary(pack.employeeId, mid.getFullYear(), mid.getMonth() + 1);
    assert.ok(summary);
  });

  it('Scenario 12 — Separation after LWD', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const lwd = new Date();
    lwd.setDate(21);
    const after = new Date(lwd);
    after.setDate(25);
    await db('employees').where({ id: pack.employeeId }).update({ last_working_date: localYmd(lwd), employment_status: 'ON_NOTICE' });
    const result = await calculateEmployeeDay(pack.employeeId, localYmd(after));
    assert.equal(result.status, 'SEPARATED');
    await db('employees').where({ id: pack.employeeId }).update({ last_working_date: null, employment_status: 'ACTIVE' });
  });

  it('Scenario 16 — Explicit two-college tenant isolation E2E', async () => {
    const ctx = await e2eContext();
    assert.ok(ctx, 'Attendance E2E college context required');
    const collegeA = ctx.collegeId;
    const peer = await ensurePeerCollegeFixture(collegeA);
    const { collegeB, adminB, empB } = peer;

    const empA = await db('employees').where({ college_id: collegeA }).whereIn('employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED']).first();
    assert.ok(empA, 'Active employee required in College A');

    const actorA = hrActor(ctx.admin);
    const actorB = hrActor(adminB);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = localYmd(now);

    const summaryBBefore = await computeMonthlySummary(Number(empB.id), year, month);
    const dailyBBefore = await db('employee_attendance_records')
      .where({ employee_id: empB.id, college_id: collegeB })
      .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
      .count('* as c')
      .first();
    const closureBBefore = await db('hr_attendance_month_closures').where({ college_id: collegeB, year, month }).first();

    // College A cannot read / modify College B attendance (and vice versa)
    await assert.rejects(
      () => getEmployeeAttendanceAdmin(actorA, Number(empB.id), year, month),
      (err: Error & { status?: number }) => err.status === 404,
    );
    await assert.rejects(
      () => getEmployeeAttendanceAdmin(actorB, Number(empA.id), year, month),
      (err: Error & { status?: number }) => err.status === 404,
    );
    await assert.rejects(
      () => importPunch(collegeA, { employeeId: Number(empB.id), punchAt: `${date}T09:00:00`, externalEventId: `XCOL-A-${Date.now()}` }),
      (err: Error & { status?: number }) => err.status === 404,
    );
    await assert.rejects(
      () => importPunch(collegeB, { employeeId: Number(empA.id), punchAt: `${date}T09:00:00`, externalEventId: `XCOL-B-${Date.now()}` }),
      (err: Error & { status?: number }) => err.status === 404,
    );
    await assert.rejects(
      () => recordAttendance(actorA, { employeeId: Number(empB.id), date, status: 'PRESENT' }),
      (err: Error & { status?: number }) => err.status === 404,
    );
    await assert.rejects(
      () => recordAttendance(actorB, { employeeId: Number(empA.id), date, status: 'PRESENT' }),
      (err: Error & { status?: number }) => err.status === 404,
    );

    const regB = await db('employee_attendance_adjustments')
      .where({ college_id: collegeB, employee_id: empB.id, status: 'PENDING' })
      .first();
    if (regB) {
      await assert.rejects(
        () => approveRegularization(actorA, Number(regB.id), 'cross-college'),
        (err: Error & { status?: number }) => err.status === 404,
      );
    }
    const regA = await db('employee_attendance_adjustments')
      .where({ college_id: collegeA, employee_id: empA.id, status: 'PENDING' })
      .first();
    if (regA) {
      await assert.rejects(
        () => approveRegularization(actorB, Number(regA.id), 'cross-college'),
        (err: Error & { status?: number }) => err.status === 404,
      );
    }

    // Forbidden attempts must leave College B daily/monthly/closure data unchanged
    const summaryBAfterForbidden = await computeMonthlySummary(Number(empB.id), year, month);
    const dailyBAfterForbidden = await db('employee_attendance_records')
      .where({ employee_id: empB.id, college_id: collegeB })
      .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
      .count('* as c')
      .first();
    const closureBAfterForbidden = await db('hr_attendance_month_closures').where({ college_id: collegeB, year, month }).first();
    assert.equal(Number(dailyBAfterForbidden?.c ?? 0), Number(dailyBBefore?.c ?? 0));
    assert.equal(Number(summaryBAfterForbidden?.payableDays ?? 0), Number(summaryBBefore?.payableDays ?? 0));
    assert.equal(Number(summaryBAfterForbidden?.lopDays ?? 0), Number(summaryBBefore?.lopDays ?? 0));
    assert.equal(String(closureBAfterForbidden?.status ?? ''), String(closureBBefore?.status ?? ''));
    assert.equal(Number(closureBAfterForbidden?.id ?? 0), Number(closureBBefore?.id ?? 0));

    // Month process/finalize/reopen bind to actor.collegeId. Process the
    // deliberately tiny peer college and prove College A is untouched.
    const closureABeforeBProcess = await db('hr_attendance_month_closures').where({ college_id: collegeA, year, month }).first();
    await processMonth(actorB, year, month);
    const closureBOnly = await db('hr_attendance_month_closures').where({ college_id: collegeB, year, month }).first();
    const closureAAfter = await db('hr_attendance_month_closures').where({ college_id: collegeA, year, month }).first();
    assert.ok(closureBOnly);
    assert.equal(Number(closureBOnly!.college_id), collegeB);
    assert.equal(String(closureAAfter?.status ?? ''), String(closureABeforeBProcess?.status ?? ''));
    assert.equal(Number(closureAAfter?.id ?? 0), Number(closureABeforeBProcess?.id ?? 0));
    assert.notEqual(Number(closureAAfter?.id ?? 0), Number(closureBOnly!.id));

    // Register lists are college-scoped (after process, summaries already refreshed)
    const registerB = await listAdminAttendanceRegister(actorB, year, month);
    assert.ok(!registerB.summaries.some((s) => s.employeeId === Number(empA.id)));
    assert.ok(registerB.summaries.some((s) => s.employeeId === Number(empB.id)));
  });

  it('Scenario 18 — Punch Idempotency', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const d = new Date();
    d.setDate(d.getDate() - 4);
    const date = localYmd(d);
    const extId = `DUP-${Date.now()}`;
    const a = await importPunch(pack.ctx.collegeId, { employeeId: pack.employeeId, punchAt: `${date}T09:00:00`, externalEventId: extId });
    const b = await importPunch(pack.ctx.collegeId, { employeeId: pack.employeeId, punchAt: `${date}T09:00:00`, externalEventId: extId });
    assert.equal(a.duplicate, false);
    assert.equal(b.duplicate, true);
    assert.equal(a.id, b.id);
  });

  it('Scenario 19 — No duplicate daily records', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    const date = localYmd(new Date());
    const result = await calculateEmployeeDay(pack.employeeId, date);
    await upsertDailyRecord(pack.employeeId, date, result);
    await Promise.all([
      recalculateEmployeeRange(pack.employeeId, date, date),
      recalculateEmployeeRange(pack.employeeId, date, date),
    ]);
    const count = await db('employee_attendance_records').where({ employee_id: pack.employeeId, attendance_date: date }).count('* as c').first();
    assert.equal(Number(count?.c), 1);
  });

  it('Scenario 14-15 — Month lock and reopen', async () => {
    const pack = await ensureSmallClosureContext();
    if (!pack) return;
    const { actor, collegeId } = pack;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const existingClosure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
    if (existingClosure && ['FINALIZED', 'LOCKED'].includes(String(existingClosure.status))) {
      await reopenMonth(actor, year, month, 'E2E prep reopen before process test');
    }
    await processMonth(actor, year, month);
    const exceptions = await detectExceptions(collegeId, year, month);
    const critical = exceptions.filter((e) =>
      ['BEFORE_JOINING', 'AFTER_LWD', 'UNRESOLVED', 'INCOMPLETE_PUNCH', 'PENDING_REGULARIZATION'].includes(e.type),
    );
    if (critical.length === 0) {
      await finalizeMonth(actor, year, month);
      await lockMonth(actor, year, month);
      const closure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
      assert.equal(closure?.status, 'LOCKED');
      await reopenMonth(actor, year, month, 'E2E test reopen for validation');
      const reopened = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
      assert.equal(reopened?.status, 'OPEN');
    } else {
      const closure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
      assert.ok(closure);
      assert.ok(['REVIEW', 'PROCESSING'].includes(String(closure?.status)));
    }
  });

  it('Scenario 41 — Payroll handoff', async () => {
    const pack = await ensureSmallClosureContext();
    if (!pack) return;
    const { actor, collegeId } = pack;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const closure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
    if (!closure || !['FINALIZED', 'LOCKED'].includes(String(closure.status))) {
      await processMonth(actor, year, month);
      try {
        await finalizeMonth(actor, year, month);
        await lockMonth(actor, year, month);
      } catch {
        return;
      }
    }
    const handoff = await getPayrollAttendanceHandoff(collegeId, year, month);
    assert.ok(handoff.closureId);
    assert.ok(['FINALIZED', 'LOCKED'].includes(String(handoff.closureStatus)));
    assert.ok(handoff.calculationVersion >= 1);
    assert.equal(handoff.year, year);
    assert.equal(handoff.month, month);
    assert.ok(Array.isArray(handoff.employees));
    if (handoff.employees.length) {
      const row = handoff.employees[0];
      assert.ok(row.employeeId);
      assert.ok('employeeNumber' in row);
      assert.ok('employmentApplicableDays' in row);
      assert.ok('workingDays' in row);
      assert.ok('payableDays' in row);
      assert.ok('lopDays' in row);
      assert.ok('paidLeaveDays' in row);
      assert.ok('unpaidLeaveDays' in row);
      assert.ok('absenceDays' in row);
      assert.ok('halfDays' in row);
    }
  });

  it('Scenario 42 — Payroll handoff rejects OPEN month', async () => {
    const pack = await ensureSmallClosureContext();
    if (!pack) return;
    const { actor, collegeId } = pack;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const closure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
    if (closure && ['FINALIZED', 'LOCKED'].includes(String(closure.status))) {
      await reopenMonth(actor, year, month, 'Payroll handoff OPEN month E2E');
    }
    await assert.rejects(
      () => getPayrollAttendanceHandoff(collegeId, year, month),
      (err: Error & { status?: number; message?: string }) =>
        err.status === 400 && /not finalized|locked/i.test(err.message ?? ''),
    );
  });

  it('Scenario 43 — Locked month blocks silent attendance mutation', async () => {
    const pack = await ensureSmallClosureContext();
    if (!pack) return;
    const { actor, collegeId, employeeId } = pack;
    const target = new Date();
    target.setMonth(target.getMonth() - 1);
    const year = target.getFullYear();
    const month = target.getMonth() + 1;
    const date = `${year}-${String(month).padStart(2, '0')}-15`;

    const existingClosure = await db('hr_attendance_month_closures').where({ college_id: collegeId, year, month }).first();
    if (existingClosure && ['FINALIZED', 'LOCKED'].includes(String(existingClosure.status))) {
      await reopenMonth(actor, year, month, 'Month lock E2E prep reopen');
    }
    await importPunch(collegeId, { employeeId, punchAt: `${date}T09:00:00`, punchType: 'IN', externalEventId: `LOCK-IN-${Date.now()}` });
    await importPunch(collegeId, { employeeId, punchAt: `${date}T17:00:00`, punchType: 'OUT', externalEventId: `LOCK-OUT-${Date.now()}` });
    await calculateEmployeeDay(employeeId, date);
    await processMonth(actor, year, month);
    const critical = (await detectExceptions(collegeId, year, month)).filter((e) =>
      ['BEFORE_JOINING', 'AFTER_LWD', 'UNRESOLVED', 'INCOMPLETE_PUNCH', 'PENDING_REGULARIZATION'].includes(e.type),
    );
    if (critical.length > 0) return;

    await finalizeMonth(actor, year, month);
    await lockMonth(actor, year, month);

    const lockedSummary = await computeMonthlySummary(employeeId, year, month);
    const lockedRecord = await db('employee_attendance_records').where({ employee_id: employeeId, attendance_date: date }).first();
    if (!lockedRecord) return;
    assert.ok(lockedRecord.is_locked);

    await importPunch(collegeId, { employeeId, punchAt: `${date}T10:00:00`, externalEventId: `LOCK-MUT-${Date.now()}` });

    const processed = await recalculateEmployeeRange(employeeId, date, date);
    assert.equal(processed, 0);

    if (lockedRecord) {
      await assert.rejects(
        () => overrideAttendance(actor, Number(lockedRecord.id), { status: 'ABSENT', reason: 'Should fail when locked' }),
        (err: Error & { status?: number; message?: string }) => err.status === 400 && /locked/i.test(err.message ?? ''),
      );
    }

    const afterSummary = await computeMonthlySummary(employeeId, year, month);
    assert.equal(Number(afterSummary.payableDays), Number(lockedSummary.payableDays));
    assert.equal(Number(afterSummary.lopDays), Number(lockedSummary.lopDays));

    await reopenMonth(actor, year, month, 'Month lock E2E cleanup reopen');
  });

  it('Scenario 44 — Attendance does not rewrite academic substitution tables', async () => {
    if (!(await db.schema.hasTable('hr_leave_academic_coverage'))) return;
    const ctx = await e2eContext();
    if (!ctx) return;
    const cov = await db('hr_leave_academic_coverage')
      .join('timetable_overrides as o', 'o.id', 'hr_leave_academic_coverage.timetable_override_id')
      .where({ 'hr_leave_academic_coverage.college_id': ctx.collegeId, 'o.status': 'ACTIVE' })
      .select('hr_leave_academic_coverage.*')
      .first();
    if (!cov) return;

    const beforeOverrides = await db('timetable_overrides').where({ id: cov.timetable_override_id }).first();
    const beforeAssignments = await db('academic_class_subject_faculty')
      .where({ college_id: ctx.collegeId, status: 'ACTIVE' })
      .count('* as c')
      .first();

    const pack = await ensureSharedEmployee();
    if (!pack) return;
    await calculateEmployeeDay(pack.employeeId, localYmd(new Date()));
    await recalculateEmployeeRange(pack.employeeId, localYmd(new Date()), localYmd(new Date()));

    const afterOverride = await db('timetable_overrides').where({ id: cov.timetable_override_id }).first();
    assert.equal(String(afterOverride?.status), String(beforeOverrides?.status));
    assert.equal(Number(afterOverride?.substitute_faculty_id), Number(beforeOverrides?.substitute_faculty_id));

    const afterAssignments = await db('academic_class_subject_faculty')
      .where({ college_id: ctx.collegeId, status: 'ACTIVE' })
      .count('* as c')
      .first();
    assert.equal(Number(afterAssignments?.c ?? 0), Number(beforeAssignments?.c ?? 0));
  });

  it('Scenario 10 — Regularization with faculty employee', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const empActor: HrActor = {
      facultyUserId: Number(ctx.anita.id),
      collegeId: ctx.collegeId,
      departmentId: ctx.anita.department_id ?? null,
      role: 'FACULTY',
    };
    const date = localYmd(new Date());
    const reg = await submitRegularization(empActor, {
      attendanceDate: date,
      regularizationReason: 'MISSED_PUNCH',
      reason: 'E2E regularization test',
      requestedInAt: `${date}T09:00:00`,
      requestedOutAt: `${date}T17:00:00`,
    });
    assert.equal(reg.status, 'PENDING');
    const approved = await approveRegularization(hrActor(ctx.admin), reg.id, 'E2E approved');
    assert.equal(approved.status, 'APPROVED');
  });

  it('Engine — suspended status', async () => {
    const pack = await ensureSharedEmployee();
    if (!pack) return;
    await db('employees').where({ id: pack.employeeId }).update({ employment_status: 'SUSPENDED' });
    const result = await calculateEmployeeDay(pack.employeeId, pack.doj);
    assert.equal(result.status, 'SUSPENDED');
    await db('employees').where({ id: pack.employeeId }).update({ employment_status: 'ACTIVE' });
  });
});

describe('HR Attendance Engine precedence unit', () => {
  it('precedence order', () => {
    const baseInput = {
      collegeId: 1,
      employeeId: 1,
      date: '2026-09-15',
      employmentStatus: 'ACTIVE',
      dateOfJoining: '2026-09-01',
      lastWorkingDate: null,
      schedule: { workingDays: [1, 2, 3, 4, 5, 6], weeklyOff: [0], graceMinutes: 15, halfDayThresholdMinutes: 240, fullDayMinutes: 480 },
      shift: null,
      holiday: null,
      leave: null,
      punches: [],
      approvedAdjustment: null,
      existingRecord: null,
      settings: { sandwichLeavePolicy: 'DISABLED', lateMarksCountAsLop: false, autoFlagMissingPunch: true },
    };
    assert.equal(calculateDailyAttendance({ ...baseInput, date: '2026-08-01' }).status, 'NOT_JOINED');
    assert.equal(calculateDailyAttendance({ ...baseInput, lastWorkingDate: '2026-09-10', date: '2026-09-20' }).status, 'SEPARATED');
    assert.equal(calculateDailyAttendance({ ...baseInput, employmentStatus: 'SUSPENDED' }).status, 'SUSPENDED');
    assert.equal(calculateDailyAttendance({ ...baseInput, holiday: { id: 1 } }).status, 'HOLIDAY');
    assert.equal(
      calculateDailyAttendance({
        ...baseInput,
        schedule: { workingDays: [1, 2, 3, 4, 5], weeklyOff: [0, 6], graceMinutes: 15, halfDayThresholdMinutes: 240, fullDayMinutes: 480 },
        date: '2026-09-06',
      }).status,
      'WEEKLY_OFF',
    );
  });
});
