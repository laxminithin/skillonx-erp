/**
 * Academic Leadership (HOD + Principal) E2E.
 * Uses unique employee/department namespaces — does not reuse Anita/Ravi leave fixtures.
 */
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from '../hr/types.js';
import { ensureCollegeHrmsDefaults } from '../hr/defaults.js';
import { backfillFacultyToEmployees } from '../hr/employees.js';
import { createLeaveRequest, submitLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from '../hr/leave.js';
import { assertLeadershipCapability, leadershipSchemaReady, resolveLeadershipContext } from './leadership.js';
import { createAssignment, updateAssignment, listAssignments } from './assignments.js';
import { ensureQaLeadershipUsers } from './qaUsers.js';
import { resolveLeaveAcademicApprover } from './leaveApprover.js';
import {
  hodDashboard,
  principalDashboard,
  listDepartmentFaculty,
  listWorkload,
  listTeachingAllocation,
  listTimetable,
  listFacultyAttendance,
  listAcademicProgress,
  listContinuity,
  listDepartmentsForPrincipal,
  departmentOverview,
} from './queries.js';
import { listLeadershipLeaveInbox, getLeadershipLeaveDetail } from './leaveInbox.js';
import { buildLecturerDashboard } from '../dashboard/lecturerService.js';
import { AppError } from '../../utils/errors.js';

function hrActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@vviet.edu.in`;
}

function ymd(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function e2eContext() {
  try {
    if (!(await leadershipSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    await ensureCollegeHrmsDefaults(collegeId);
    await backfillFacultyToEmployees(collegeId);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first()
      ?? await db('hr_designations').where({ college_id: collegeId }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first()
      ?? await db('employment_types').where({ college_id: collegeId }).first();
    if (!admin || !des || !empType) return null;
    return { collegeId, admin, des, empType, adminActor: hrActor(admin) };
  } catch {
    return null;
  }
}

type Ctx = NonNullable<Awaited<ReturnType<typeof e2eContext>>>;

async function uniqueDept(ctx: Ctx, label: string) {
  const [id] = await db('departments').insert({
    college_id: ctx.collegeId,
    name: `${label} ${Date.now()}`,
    code: `${label.replace(/\s+/g, '').slice(0, 8)}-${Date.now()}`.slice(0, 32),
  });
  return db('departments').where({ id }).first();
}

async function makeFaculty(ctx: Ctx, opts: { firstName: string; lastName: string; departmentId: number }) {
  const email = uniqueEmail(`al.${opts.firstName.toLowerCase()}`);
  const employeeNumber = `AL-${Date.now()}-${Math.floor(Math.random() * 10000)}`.slice(0, 32);
  const displayName = `${opts.firstName} ${opts.lastName}`;
  // Known bcrypt hash for Password123 — avoid CREATE_LOGIN bcrypt + notification lock contention in suite runs.
  const passwordHash = '$2b$10$cr3x..qXChDlVfZKceooAeT9k/cT/HZN89DGlRa6hJhfKuxpA8qya';
  const [facultyUserId] = await db('faculty_users').insert({
    college_id: ctx.collegeId,
    department_id: opts.departmentId,
    name: displayName,
    email,
    password_hash: passwordHash,
    role: 'FACULTY',
    is_active: true,
    employee_id: employeeNumber,
  });
  const [employeeId] = await db('employees').insert({
    college_id: ctx.collegeId,
    employee_number: employeeNumber,
    first_name: opts.firstName,
    last_name: opts.lastName,
    display_name: displayName,
    official_email: email,
    employee_category: 'FACULTY',
    department_id: opts.departmentId,
    designation_id: Number(ctx.des.id),
    employment_type_id: Number(ctx.empType.id),
    employment_status: 'ACTIVE',
    date_of_joining: ymd(-30),
    faculty_user_id: facultyUserId,
  });
  await db('employee_employment_records').insert({
    college_id: ctx.collegeId,
    employee_id: employeeId,
    department_id: opts.departmentId,
    designation_id: Number(ctx.des.id),
    employment_type_id: Number(ctx.empType.id),
    effective_from: ymd(-30),
    effective_to: null,
    status: 'ACTIVE',
    remarks: 'AL E2E fixture',
    created_by: Number(ctx.admin.id),
  }).catch(() => undefined);

  const emp = await db('employees').where({ id: employeeId }).first();
  const user = await db('faculty_users').where({ id: facultyUserId }).first();
  const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
  if (cl) {
    const year = new Date().getFullYear();
    const existing = await db('employee_leave_balances').where({ employee_id: emp.id, leave_type_id: cl.id, year }).first();
    if (!existing) {
      await db('employee_leave_balances').insert({
        college_id: ctx.collegeId,
        employee_id: emp.id,
        leave_type_id: cl.id,
        year,
        opening_balance: 0,
        credited: 12,
        availed: 0,
        adjusted: 0,
        carried_forward: 0,
        available_balance: 12,
      });
    }
  }
  return { emp, user, actor: hrActor(user), cl };
}

async function uniqueLeaveDay(employeeId: number, startOffset = 14) {
  for (let i = startOffset; i < startOffset + 40; i++) {
    const date = ymd(i);
    const existing = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', ['DRAFT', 'REJECTED', 'CANCELLED', 'WITHDRAWN'])
      .andWhere('from_date', '<=', date)
      .andWhere('to_date', '>=', date)
      .first();
    if (!existing) return date;
  }
  throw new Error('No free leave date');
}

async function assignHod(ctx: Ctx, employeeId: number, departmentId: number, from = ymd(-1), to: string | null = null) {
  return createAssignment(ctx.adminActor, {
    employeeId,
    role: 'HOD',
    departmentId,
    effectiveFrom: from,
    effectiveTo: to,
  });
}

async function assignPrincipal(ctx: Ctx, employeeId: number) {
  const existing = await listAssignments(ctx.collegeId, { role: 'PRINCIPAL', status: 'ACTIVE' });
  for (const row of existing) {
    await updateAssignment(ctx.adminActor, row.id, { status: 'ENDED', effectiveTo: ymd(-1), remarks: 'e2e isolate principal' });
  }
  return createAssignment(ctx.adminActor, {
    employeeId,
    role: 'PRINCIPAL',
    effectiveFrom: ymd(-1),
  });
}

async function cleanupAcademicLeadershipE2eAssignments() {
  if (!(await leadershipSchemaReady())) return;
  const rows = await db('academic_leadership_assignments as a')
    .join('employees as e', 'e.id', 'a.employee_id')
    .where('e.employee_number', 'like', 'AL-%')
    .where('a.status', 'ACTIVE')
    .select('a.id');
  if (!rows.length) return;
  await db('academic_leadership_assignments')
    .whereIn(
      'id',
      rows.map((row: { id: number }) => Number(row.id)),
    )
    .update({
      status: 'REVOKED',
      remarks: 'AL E2E cleanup',
      updated_at: db.fn.now(),
    });
}

describe('academic leadership HOD + Principal E2E', { timeout: 600_000 }, () => {
  after(async () => {
    await cleanupAcademicLeadershipE2eAssignments();
    await db.destroy();
  });

  it('1 faculty retains faculty capabilities without leadership assignment', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'FacSelf');
    const fac = await makeFaculty(ctx, { firstName: 'FacSelf', lastName: 'One', departmentId: Number(dept.id) });
    assert.equal(fac.user.role, 'FACULTY');
    const dash = await buildLecturerDashboard({
      facultyUserId: Number(fac.user.id),
      collegeId: ctx.collegeId,
      role: 'FACULTY',
      name: fac.user.name,
    });
    assert.ok(dash);
    const date = await uniqueLeaveDay(Number(fac.emp.id));
    const leave = await createLeaveRequest(fac.actor, {
      leaveTypeId: Number(fac.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'AL faculty capability',
    });
    assert.ok(leave.id);
  });

  it('2 HOD assignment keeps faculty role and faculty capabilities', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'KeepFac');
    const hod = await makeFaculty(ctx, { firstName: 'HodKeep', lastName: 'Fac', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(hod.emp.id), Number(dept.id));
    const user = await db('faculty_users').where({ id: hod.user.id }).first();
    assert.equal(user.role, 'FACULTY');
    const dash = await buildLecturerDashboard({
      facultyUserId: Number(hod.user.id),
      collegeId: ctx.collegeId,
      role: String(user.role),
      name: user.name,
    });
    assert.ok(dash);
    const date = await uniqueLeaveDay(Number(hod.emp.id));
    const leave = await createLeaveRequest(hod.actor, {
      leaveTypeId: Number(hod.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'HOD still faculty leave',
    });
    assert.ok(leave.id);
  });

  it('3 ending HOD assignment does not remove faculty identity', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'HodEnd');
    const hod = await makeFaculty(ctx, { firstName: 'HodEnd', lastName: 'Fac', departmentId: Number(dept.id) });
    const assigned = await assignHod(ctx, Number(hod.emp.id), Number(dept.id), ymd(-10));
    await updateAssignment(ctx.adminActor, assigned.id, { effectiveTo: ymd(-1), status: 'ENDED', remarks: 'tenure ended' });
    const user = await db('faculty_users').where({ id: hod.user.id }).first();
    assert.equal(user.role, 'FACULTY');
    const emp = await db('employees').where({ id: hod.emp.id }).first();
    assert.ok(['ACTIVE', 'PROBATION', 'CONFIRMED'].includes(String(emp.employment_status)));
    const dash = await buildLecturerDashboard({
      facultyUserId: Number(hod.user.id),
      collegeId: ctx.collegeId,
      role: 'FACULTY',
      name: user.name,
    });
    assert.ok(dash);
  });

  it('4-9 HOD can view own department academic data and cannot access another department', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cse = await uniqueDept(ctx, 'ScopeCSE');
    const ece = await uniqueDept(ctx, 'ScopeECE');
    const hod = await makeFaculty(ctx, { firstName: 'HodScope', lastName: 'Cse', departmentId: Number(cse.id) });
    await assignHod(ctx, Number(hod.emp.id), Number(cse.id));
    const dash = await hodDashboard(hod.actor, Number(cse.id));
    assert.equal(dash.department.id, Number(cse.id));
    assert.ok(dash.metrics.facultyCount >= 1);
    const faculty = await listDepartmentFaculty(hod.actor, Number(cse.id));
    assert.ok(faculty.some((f) => f.id === Number(hod.emp.id)));
    await listWorkload(hod.actor, Number(cse.id));
    await listTeachingAllocation(hod.actor, Number(cse.id));
    await listTimetable(hod.actor, Number(cse.id));
    await listFacultyAttendance(hod.actor, Number(cse.id));
    await listAcademicProgress(hod.actor, Number(cse.id));
    await listContinuity(hod.actor, Number(cse.id));

    await assert.rejects(
      () => hodDashboard(hod.actor, Number(ece.id)),
      (err: AppError) => err.code === 'DEPARTMENT_SCOPE' || err.status === 403 || err.status === 404,
    );
    await assert.rejects(
      () => listDepartmentFaculty(hod.actor, Number(ece.id)),
      (err: AppError) => err.code === 'DEPARTMENT_SCOPE' || err.status === 403 || err.status === 404,
    );
    await assert.rejects(
      () => listContinuity(hod.actor, Number(ece.id)),
      (err: AppError) => err.code === 'DEPARTMENT_SCOPE' || err.status === 403 || err.status === 404,
    );
  });

  it('10-15 faculty leave routes to department HOD then HR; wrong HOD denied; HOD approval is not final', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cse = await uniqueDept(ctx, 'LvCSE');
    const ece = await uniqueDept(ctx, 'LvECE');
    const hodCse = await makeFaculty(ctx, { firstName: 'HodCseLv', lastName: 'Lead', departmentId: Number(cse.id) });
    const hodEce = await makeFaculty(ctx, { firstName: 'HodEceLv', lastName: 'Lead', departmentId: Number(ece.id) });
    const fac = await makeFaculty(ctx, { firstName: 'LectCse', lastName: 'Leave', departmentId: Number(cse.id) });
    await assignHod(ctx, Number(hodCse.emp.id), Number(cse.id));
    await assignHod(ctx, Number(hodEce.emp.id), Number(ece.id));

    const date = await uniqueLeaveDay(Number(fac.emp.id));
    const created = await createLeaveRequest(fac.actor, {
      leaveTypeId: Number(fac.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'AL faculty hod flow',
    });
    const submitted = await submitLeaveRequest(fac.actor, created.id);
    assert.equal(submitted.status, 'SUBMITTED');

    const approver = await resolveLeaveAcademicApprover(Number(fac.emp.id), ctx.collegeId, date);
    assert.equal(approver?.employeeId, Number(hodCse.emp.id));

    const inbox = await listLeadershipLeaveInbox(hodCse.actor, 'pending', Number(cse.id));
    assert.ok(inbox.items.some((i) => i.id === created.id));

    await assert.rejects(
      () => approveLeaveRequest(hodEce.actor, created.id),
      (err: AppError) => err.code === 'WRONG_APPROVER' || err.code === 'DEPARTMENT_SCOPE' || err.status === 403,
    );

    const academic = await approveLeaveRequest(hodCse.actor, created.id, 'dept ok');
    assert.equal(academic.status, 'UNDER_APPROVAL');
    const afterHod = await db('hr_leave_requests').where({ id: created.id }).first();
    assert.equal(afterHod.status, 'UNDER_APPROVAL');
    assert.equal(await db('hr_leave_requests').where({ id: created.id, status: 'APPROVED' }).first(), undefined);

    const final = await approveLeaveRequest(ctx.adminActor, created.id, 'hr final');
    assert.equal(final.status, 'APPROVED');
  });

  it('14 HOD reject does not proceed to HR', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'Rej');
    const hodCse = await makeFaculty(ctx, { firstName: 'HodRej', lastName: 'Lead', departmentId: Number(dept.id) });
    const fac = await makeFaculty(ctx, { firstName: 'LectRej', lastName: 'Fac', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(hodCse.emp.id), Number(dept.id));
    const date = await uniqueLeaveDay(Number(fac.emp.id));
    const created = await createLeaveRequest(fac.actor, {
      leaveTypeId: Number(fac.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'reject path',
    });
    await submitLeaveRequest(fac.actor, created.id);
    const rejected = await rejectLeaveRequest(hodCse.actor, created.id, 'not possible');
    assert.equal(rejected.status, 'REJECTED');
    await assert.rejects(
      () => approveLeaveRequest(ctx.adminActor, created.id),
      (err: AppError) => err.status === 409 || err.status === 400,
    );
  });

  it('16-21 HOD leave goes to Principal then HR; self-approval denied', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'HodOwn');
    const hod = await makeFaculty(ctx, { firstName: 'HodOwn', lastName: 'Lv', departmentId: Number(dept.id) });
    const principal = await makeFaculty(ctx, { firstName: 'Prin', lastName: 'Lead', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(hod.emp.id), Number(dept.id));
    await assignPrincipal(ctx, Number(principal.emp.id));

    const date = await uniqueLeaveDay(Number(hod.emp.id));
    const created = await createLeaveRequest(hod.actor, {
      leaveTypeId: Number(hod.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'HOD own leave',
    });
    await submitLeaveRequest(hod.actor, created.id);

    await assert.rejects(
      () => approveLeaveRequest(hod.actor, created.id),
      (err: AppError) => err.code === 'SELF_APPROVAL' || err.status === 403,
    );

    const approver = await resolveLeaveAcademicApprover(Number(hod.emp.id), ctx.collegeId, date);
    assert.equal(approver?.role, 'PRINCIPAL');
    assert.equal(approver?.employeeId, Number(principal.emp.id));

    const inbox = await listLeadershipLeaveInbox(principal.actor, 'pending');
    assert.ok(inbox.items.some((i) => i.id === created.id));

    const academic = await approveLeaveRequest(principal.actor, created.id, 'principal ok');
    assert.equal(academic.status, 'UNDER_APPROVAL');
    const final = await approveLeaveRequest(ctx.adminActor, created.id, 'hr');
    assert.equal(final.status, 'APPROVED');
  });

  it('20 Principal reject does not proceed', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'PrinRej');
    const hod = await makeFaculty(ctx, { firstName: 'HodPrj', lastName: 'Lv', departmentId: Number(dept.id) });
    const principal = await makeFaculty(ctx, { firstName: 'PrinRej', lastName: 'Lead', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(hod.emp.id), Number(dept.id));
    await assignPrincipal(ctx, Number(principal.emp.id));
    const date = await uniqueLeaveDay(Number(hod.emp.id));
    const created = await createLeaveRequest(hod.actor, {
      leaveTypeId: Number(hod.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'principal reject',
    });
    await submitLeaveRequest(hod.actor, created.id);
    const rejected = await rejectLeaveRequest(principal.actor, created.id, 'no');
    assert.equal(rejected.status, 'REJECTED');
  });

  it('22-24 Principal views multiple departments and cannot access another college', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const d1 = await uniqueDept(ctx, 'PView1');
    const d2 = await uniqueDept(ctx, 'PView2');
    const principal = await makeFaculty(ctx, { firstName: 'PrinView', lastName: 'Inst', departmentId: Number(d1.id) });
    await assignPrincipal(ctx, Number(principal.emp.id));
    const dash = await principalDashboard(principal.actor);
    assert.ok(dash.metrics.departmentCount >= 2);
    const departments = await listDepartmentsForPrincipal(principal.actor);
    assert.ok(departments.length >= 2);
    await departmentOverview(principal.actor, Number(d1.id));
    await departmentOverview(principal.actor, Number(d2.id));

    const peer = await db('colleges').whereNot('id', ctx.collegeId).first();
    if (peer) {
      const foreignDept = await db('departments').where({ college_id: peer.id }).first();
      if (foreignDept) {
        await assert.rejects(
          () => departmentOverview(principal.actor, Number(foreignDept.id)),
          (err: AppError) => err.status === 403 || err.status === 404,
        );
      }
    }
  });

  it('25-27 effective dating changeover routes new approvals to the new HOD', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'Chg');
    const hodA = await makeFaculty(ctx, { firstName: 'HodA', lastName: 'Old', departmentId: Number(dept.id) });
    const hodB = await makeFaculty(ctx, { firstName: 'HodB', lastName: 'New', departmentId: Number(dept.id) });
    const fac = await makeFaculty(ctx, { firstName: 'FacChg', lastName: 'One', departmentId: Number(dept.id) });
    const cut = ymd(5);
    const before = ymd(3);
    const after = ymd(8);
    await assignHod(ctx, Number(hodA.emp.id), Number(dept.id), ymd(-20), cut);
    await assignHod(ctx, Number(hodB.emp.id), Number(dept.id), ymd(6), null);
    const a = await resolveLeaveAcademicApprover(Number(fac.emp.id), ctx.collegeId, before);
    assert.equal(a?.employeeId, Number(hodA.emp.id));
    const b = await resolveLeaveAcademicApprover(Number(fac.emp.id), ctx.collegeId, after);
    assert.equal(b?.employeeId, Number(hodB.emp.id));
  });

  it('28-30 direct API cross-department, cross-college, and self-approval are denied', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cse = await uniqueDept(ctx, 'SecCSE');
    const ece = await uniqueDept(ctx, 'SecECE');
    const hodCse = await makeFaculty(ctx, { firstName: 'HodSec', lastName: 'Cse', departmentId: Number(cse.id) });
    const facEce = await makeFaculty(ctx, { firstName: 'FacSec', lastName: 'Ece', departmentId: Number(ece.id) });
    await assignHod(ctx, Number(hodCse.emp.id), Number(cse.id));
    const date = await uniqueLeaveDay(Number(facEce.emp.id));
    const created = await createLeaveRequest(facEce.actor, {
      leaveTypeId: Number(facEce.cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'isolation',
    });
    await submitLeaveRequest(facEce.actor, created.id);
    await assert.rejects(
      () => getLeadershipLeaveDetail(hodCse.actor, created.id),
      (err: AppError) => err.code === 'DEPARTMENT_SCOPE' || err.status === 404 || err.status === 403,
    );
    await assert.rejects(
      () => approveLeaveRequest(hodCse.actor, created.id),
      (err: AppError) => err.status === 403,
    );

    const peer = await db('colleges').whereNot('id', ctx.collegeId).first();
    if (peer) {
      const foreignLeave = await db('hr_leave_requests').where({ college_id: peer.id }).first();
      if (foreignLeave) {
        const before = await db('hr_leave_requests').where({ id: foreignLeave.id }).first();
        await assert.rejects(
          () => approveLeaveRequest(hodCse.actor, Number(foreignLeave.id)),
          (err: AppError) => err.status === 403 || err.status === 404,
        );
        const after = await db('hr_leave_requests').where({ id: foreignLeave.id }).first();
        assert.equal(String(after.status), String(before.status));
      }
    }

    await assert.rejects(
      () => approveLeaveRequest(hodCse.actor, created.id),
      (err: AppError) => err.status === 403,
    );
  });

  it('overlapping HOD assignments are rejected', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'OvHod');
    const a = await makeFaculty(ctx, { firstName: 'OvA', lastName: 'Hod', departmentId: Number(dept.id) });
    const b = await makeFaculty(ctx, { firstName: 'OvB', lastName: 'Hod', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(a.emp.id), Number(dept.id), ymd(-2), ymd(20));
    await assert.rejects(
      () => assignHod(ctx, Number(b.emp.id), Number(dept.id), ymd(0), ymd(10)),
      (err: AppError) => err.code === 'DUPLICATE_ACTIVE_HOD',
    );
  });

  it('overlapping Principal assignments are rejected', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'OvPrin');
    const a = await makeFaculty(ctx, { firstName: 'PrA', lastName: 'One', departmentId: Number(dept.id) });
    const b = await makeFaculty(ctx, { firstName: 'PrB', lastName: 'Two', departmentId: Number(dept.id) });
    await assignPrincipal(ctx, Number(a.emp.id));
    await assert.rejects(
      () =>
        createAssignment(ctx.adminActor, {
          employeeId: Number(b.emp.id),
          role: 'PRINCIPAL',
          effectiveFrom: ymd(0),
        }),
      (err: AppError) => err.code === 'DUPLICATE_ACTIVE_PRINCIPAL',
    );
  });

  it('QA leadership seeder isolates when active HOD/Principal fixtures already own the requested college', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'QaIso');
    const existingHod = await makeFaculty(ctx, { firstName: 'IsoHod', lastName: 'Owner', departmentId: Number(dept.id) });
    const existingPrincipal = await makeFaculty(ctx, { firstName: 'IsoPrin', lastName: 'Owner', departmentId: Number(dept.id) });
    await assignHod(ctx, Number(existingHod.emp.id), Number(dept.id));
    const principalAssignment = await assignPrincipal(ctx, Number(existingPrincipal.emp.id));

    const seeded = await ensureQaLeadershipUsers({ ...ctx.adminActor, collegeId: ctx.collegeId });
    assert.notEqual(seeded.collegeId, ctx.collegeId);
    assert.equal(seeded.isolatedCollege, true);

    const stillActive = await db('academic_leadership_assignments')
      .where({ id: principalAssignment.id, status: 'ACTIVE' })
      .first();
    assert.ok(stillActive);

    const qaPrincipal = await db('faculty_users').where({ email: 'qa.principal@vviet.edu.in' }).first();
    const qaHod = await db('faculty_users').where({ email: 'qa.hod.cse@vviet.edu.in' }).first();
    const principalCtx = await resolveLeadershipContext(hrActor(qaPrincipal));
    const hodCtx = await resolveLeadershipContext(hrActor(qaHod));
    assert.equal(principalCtx.isPrincipal, true);
    assert.equal(hodCtx.isHod, true);
    assert.equal(hodCtx.isPrincipal, false);
  });

  it('Principal HOD list capability allows only active Principal institution scope', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'HodList');
    const principal = await makeFaculty(ctx, { firstName: 'HodListPrin', lastName: 'Owner', departmentId: Number(dept.id) });
    const hod = await makeFaculty(ctx, { firstName: 'HodListHod', lastName: 'Only', departmentId: Number(dept.id) });
    const faculty = await makeFaculty(ctx, { firstName: 'HodListFac', lastName: 'Only', departmentId: Number(dept.id) });
    await assignPrincipal(ctx, Number(principal.emp.id));
    await assignHod(ctx, Number(hod.emp.id), Number(dept.id));

    await assert.doesNotReject(() =>
      assertLeadershipCapability(principal.actor, 'academic.institution.departments.view'),
    );
    const hods = await listAssignments(ctx.collegeId, { role: 'HOD', status: 'ACTIVE' });
    assert.ok(hods.some((row) => row.employeeId === Number(hod.emp.id)));

    await assert.rejects(
      () => assertLeadershipCapability(hod.actor, 'academic.institution.departments.view'),
      (err: AppError) => err.code === 'LEADERSHIP_FORBIDDEN' || err.status === 403,
    );
    await assert.rejects(
      () => assertLeadershipCapability(faculty.actor, 'academic.institution.departments.view'),
      (err: AppError) => err.code === 'LEADERSHIP_FORBIDDEN' || err.status === 403,
    );

    const inactivePrincipal = await makeFaculty(ctx, { firstName: 'HodListOld', lastName: 'Principal', departmentId: Number(dept.id) });
    const inactive = await createAssignment(ctx.adminActor, {
      employeeId: Number(inactivePrincipal.emp.id),
      role: 'PRINCIPAL',
      effectiveFrom: ymd(-30),
      effectiveTo: ymd(-10),
      remarks: 'inactive Principal denial',
    });
    assert.equal(inactive.status, 'ACTIVE');
    await assert.rejects(
      () => assertLeadershipCapability(inactivePrincipal.actor, 'academic.institution.departments.view'),
      (err: AppError) => err.code === 'LEADERSHIP_FORBIDDEN' || err.status === 403,
    );
  });

  it('audit records leadership assignment', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const dept = await uniqueDept(ctx, 'Aud');
    const hod = await makeFaculty(ctx, { firstName: 'AudHod', lastName: 'X', departmentId: Number(dept.id) });
    const assigned = await assignHod(ctx, Number(hod.emp.id), Number(dept.id));
    const audit = await db('hr_audit_log').where({
      entity_type: 'academic_leadership_assignments',
      entity_id: assigned.id,
      action: 'HOD_ASSIGNED',
    }).first();
    assert.ok(audit);
  });
});
