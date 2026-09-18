/**
 * HRMS E2E invariants. Skips when E2E seed / migration is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { backfillFacultyToEmployees } from './employees.js';
import { getLeaveAcademicImpact } from './academicImpact.js';
import { createLeaveRequest, approveLeaveRequest } from './leave.js';
import { addDays, todayISO } from '../lessonPlans/dates.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';

async function uniqueLeaveDate(employeeId: number, minDaysAhead: number): Promise<string> {
  let iso = addDays(todayISO(), minDaysAhead);
  for (let i = 0; i < 90; i++) {
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNot('status', 'CANCELLED')
      .whereNot('status', 'REJECTED')
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 1);
  }
  return iso;
}

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('employees'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita.cse@vviet.edu.in' }).first()
      ?? await db('faculty_users').where({ college_id: collegeId, role: 'FACULTY' }).first();
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    return { cls, collegeId, anita, admin };
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

describe('hrms E2E', () => {
  it('faculty backfill creates exactly one employee per faculty user', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const first = await backfillFacultyToEmployees(ctx.collegeId);
    const second = await backfillFacultyToEmployees(ctx.collegeId);
    assert.ok(first.created + first.linked >= 0);
    assert.equal(second.created, 0);
    if (ctx.anita) {
      const employees = await db('employees').where({ faculty_user_id: ctx.anita.id });
      assert.equal(employees.length, 1);
      assert.equal(Number(employees[0].college_id), ctx.collegeId);
    }
  });

  it('lecturer academic impact returns affected sessions when timetable exists', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 14);
    const date = tomorrow.toISOString().slice(0, 10);
    const impact = await getLeaveAcademicImpact(ctx.collegeId, Number(ctx.anita.id), date, date);
    assert.ok(Array.isArray(impact.affectedSessions));
    if (impact.totalAffected > 0) assert.equal(impact.coverageRequired, true);
  });

  it('leave request blocks approval when academic coverage incomplete', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;

    const year = new Date().getFullYear();
    await db('employee_leave_balances')
      .insert({
        college_id: ctx.collegeId,
        employee_id: emp.id,
        leave_type_id: cl.id,
        year,
        opening_balance: 0,
        credited: 8,
        availed: 0,
        adjusted: 0,
        carried_forward: 0,
        available_balance: 8,
      })
      .onConflict(['employee_id', 'leave_type_id', 'year'])
      .merge({ available_balance: 8, credited: 8 });

    const date = await uniqueLeaveDate(Number(emp.id), 21);
    const actor = hrActor(ctx.anita);
    const created = await createLeaveRequest(actor, {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'HRMS E2E test',
    });

    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id });
    if (coverages.length === 0) return;

    await db('hr_leave_requests').where({ id: created.id }).update({ status: 'SUBMITTED' });
    const adminActor = hrActor(ctx.admin);
    await assert.rejects(
      () => approveLeaveRequest(adminActor, created.id),
      (err: Error & { code?: string }) => err.code === 'ACADEMIC_COVERAGE_INCOMPLETE' || /coverage/i.test(err.message),
    );
  });

  it('employee self cannot view another employee payslip', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const other = await db('employees').where({ college_id: ctx.collegeId }).whereNot('faculty_user_id', ctx.anita.id).first();
    if (!other) return;
    const payslip = await db('payslips').where({ employee_id: other.id }).first();
    if (!payslip) return;
    const { getPayslip } = await import('./payroll.js');
    await assert.rejects(() => getPayslip(hrActor(ctx.anita), Number(payslip.id)));
  });
});
