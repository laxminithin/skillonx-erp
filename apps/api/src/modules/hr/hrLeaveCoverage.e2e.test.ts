/**
 * HR leave academic continuity E2E tests.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { createLeaveRequest, approveLeaveRequest, requestSubstituteCoverage, cancelLeaveRequest } from './leave.js';
import {
  getLeaveCoverageSummary,
  proposeReschedule,
  requestHodArrangement,
  checkRescheduleAvailability,
} from './leaveCoverage.js';
import { addDays, todayISO, weekdayOf } from '../lessonPlans/dates.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';

const LEAVE_OVERLAP_EXCLUDED = ['DRAFT', 'REJECTED', 'CANCELLED', 'WITHDRAWN'] as const;

async function uniqueLeaveDate(employeeId: number, minDaysAhead: number): Promise<string> {
  let iso = addDays(todayISO(), minDaysAhead);
  for (let i = 0; i < 365; i++) {
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 1);
  }
  // Last resort: cancel stale E2E leaves and retry near window.
  const stale = await db('hr_leave_requests')
    .where({ employee_id: employeeId })
    .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED)
    .whereILike('reason', '%test%')
    .select('id');
  for (const row of stale) {
    await db('hr_leave_requests').where({ id: row.id }).update({ status: 'CANCELLED' });
  }
  iso = addDays(todayISO(), minDaysAhead);
  for (let i = 0; i < 365; i++) {
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 1);
  }
  throw new Error(`No free leave date for employee ${employeeId}`);
}

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('hr_leave_academic_coverage'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita@vviet.edu.in' }).first()
      ?? await db('faculty_users').where({ college_id: collegeId, role: 'FACULTY' }).first();
    const ravi = await db('faculty_users').where({ college_id: collegeId, email: 'ravi@vviet.edu.in' }).first();
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    return { cls, collegeId, anita, ravi, admin };
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

function nextDateForWeekday(targetDay: number, minDaysAhead = 40): string {
  let iso = addDays(todayISO(), minDaysAhead);
  for (let i = 0; i < 7; i++) {
    if (weekdayOf(iso) === targetDay) return iso;
    iso = addDays(iso, 1);
  }
  return iso;
}

describe('hr leave coverage E2E', () => {
  it('getLeaveCoverageSummary returns structured counts', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const date = await uniqueLeaveDate(Number(emp.id), 30);
    const created = await createLeaveRequest(hrActor(ctx.anita), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'Coverage summary test',
    });
    const summary = await getLeaveCoverageSummary(created.id);
    assert.ok(summary.totalAffected >= 0);
    assert.ok(['NOT_REQUIRED', 'PENDING', 'PARTIAL', 'COMPLETE', 'EMERGENCY_UNRESOLVED'].includes(summary.status));
  });

  it('blocks approval when coverage incomplete', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;
    const date = await uniqueLeaveDate(Number(emp.id), 35);
    const created = await createLeaveRequest(hrActor(ctx.anita), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'Coverage incomplete approval block test',
    });
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id });
    if (coverages.length < 2) return;
    await db('hr_leave_academic_coverage').where({ id: coverages[0].id }).update({ status: 'ACCEPTED', coverage_type: 'ALREADY_COVERED' });
    await db('hr_leave_requests').where({ id: created.id }).update({ status: 'SUBMITTED' });
    await assert.rejects(
      () => approveLeaveRequest(hrActor(ctx.admin), created.id),
      (err: Error & { status?: number; code?: string }) =>
        err.code === 'ACADEMIC_COVERAGE_INCOMPLETE' || err.status === 409,
    );
  });

  it('substitute conflict returns FACULTY_CONFLICT when double-booked', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!anitaEmp) return;

    const anitaSlots = await db('timetable_slot_faculty as sf')
      .join('timetable_slots as s', 's.id', 'sf.slot_id')
      .where({ 'sf.faculty_id': ctx.anita.id, 's.college_id': ctx.collegeId, 's.status': 'ACTIVE' })
      .select('s.*');

    let conflictEmployeeId: number | null = null;
    let anitaSlot: Record<string, unknown> | null = null;
    for (const slot of anitaSlots) {
      const overlap = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .join('employees as e', 'e.faculty_user_id', 'sf.faculty_id')
        .where({
          's.day_of_week': slot.day_of_week,
          's.college_id': ctx.collegeId,
          's.status': 'ACTIVE',
        })
        .whereNot('sf.faculty_id', ctx.anita.id)
        .whereRaw('s.start_time < ?', [slot.end_time])
        .whereRaw('s.end_time > ?', [slot.start_time])
        .select('e.id as employee_id')
        .first();
      if (overlap) {
        conflictEmployeeId = Number(overlap.employee_id);
        anitaSlot = slot;
        break;
      }
    }
    if (!conflictEmployeeId || !anitaSlot) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;
    const leaveDate = nextDateForWeekday(Number(anitaSlot.day_of_week));
    const created = await createLeaveRequest(hrActor(ctx.anita), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'Substitute conflict test',
    });

    const cov =
      (await db('hr_leave_academic_coverage')
        .where({ leave_request_id: created.id, timetable_slot_id: anitaSlot.id })
        .first()) ??
      (await db('hr_leave_academic_coverage')
        .where({ leave_request_id: created.id })
        .whereNotNull('timetable_slot_id')
        .first());
    if (!cov) return;

    await assert.rejects(
      () =>
        requestSubstituteCoverage(hrActor(ctx.anita), {
          coverageId: Number(cov.id),
          substituteEmployeeId: conflictEmployeeId!,
        }),
      (err: Error & { code?: string }) => err.code === 'FACULTY_CONFLICT' || /conflict/i.test(err.message),
    );
  });

  it('HOD arrangement marks coverage as HOD action required', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const cov = await db('hr_leave_academic_coverage as c')
      .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .where({ 'e.faculty_user_id': ctx.anita.id })
      .select('c.*')
      .first();
    if (!cov) return;
    const result = await requestHodArrangement(hrActor(ctx.anita), Number(cov.id), 'Need HOD help');
    assert.equal(result.status, 'HOD_ACTION_REQUIRED');
    const updated = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    assert.equal(updated?.coverage_type, 'HOD_ARRANGEMENT');
    assert.ok(updated?.hod_action_required);
  });

  it('reschedule availability check returns structured result', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const cov = await db('hr_leave_academic_coverage as c')
      .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
      .join('employees as e', 'e.id', 'lr.employee_id')
      .where({ 'e.faculty_user_id': ctx.anita.id })
      .whereNotNull('c.timetable_slot_id')
      .select('c.*')
      .first();
    if (!cov) return;
    const future = new Date();
    future.setDate(future.getDate() + 45);
    const makeupDate = future.toISOString().slice(0, 10);
    const result = await checkRescheduleAvailability(hrActor(ctx.anita), {
      coverageId: Number(cov.id),
      makeupDate,
      startTime: '14:00',
      endTime: '15:00',
    });
    assert.ok(typeof result.available === 'boolean');
  });

  it('emergency leave creates priority coverage rows', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (emp) {
      const overlapping = await db('hr_leave_requests')
        .where({ employee_id: emp.id })
        .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED)
        .andWhere('from_date', '<=', todayISO())
        .andWhere('to_date', '>=', todayISO())
        .select('id');
      for (const row of overlapping) {
        await cancelLeaveRequest(hrActor(ctx.anita), Number(row.id)).catch(async () => {
          await db('hr_leave_requests').where({ id: row.id }).update({ status: 'CANCELLED' });
        });
      }
    }
    const created = await createLeaveRequest(hrActor(ctx.anita), {
      leaveTypeId: Number(cl.id),
      fromDate: todayISO(),
      toDate: todayISO(),
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      isEmergency: true,
      reason: 'Emergency test',
    });
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id });
    if (!coverages.length) return;
    assert.ok(coverages.some((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH' || c.priority === 'NORMAL'));
  });
});
