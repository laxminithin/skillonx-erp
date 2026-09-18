import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import {
  recalculateCollegeMonth,
  isMonthLocked,
  calculateEmployeeDay,
  upsertDailyRecord,
  getWorkScheduleForEmployee,
  getShiftForEmployee,
  attendanceSchemaReady,
} from './attendanceEngine.js';
import { computeMonthlySummary, refreshCollegeMonthlySummaries } from './attendanceMonthly.js';
import { asISODate } from '../timetable/time.js';

type Row = Record<string, unknown>;

const CLOSURE_STATUSES = ['OPEN', 'PROCESSING', 'REVIEW', 'FINALIZED', 'LOCKED'] as const;

export async function getMonthClosure(actor: HrActor, year: number, month: number) {
  assertHrPermission(actor, 'hr.attendance.view');
  const row = await db('hr_attendance_month_closures')
    .where({ college_id: actor.collegeId, year, month })
    .first();
  if (!row) {
    return { collegeId: actor.collegeId, year, month, status: 'OPEN', exceptionCount: 0 };
  }
  return serializeClosure(row);
}

function serializeClosure(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    year: Number(row.year),
    month: Number(row.month),
    status: row.status,
    exceptionCount: Number(row.exception_count ?? 0),
    processedAt: row.processed_at,
    finalizedAt: row.finalized_at,
    lockedAt: row.locked_at,
    reopenedAt: row.reopened_at,
    reopenReason: row.reopen_reason,
    calculationVersion: Number(row.calculation_version ?? 1),
  };
}

export async function detectExceptions(collegeId: number, year: number, month: number): Promise<Array<{ type: string; employeeId: number; date?: string; message: string }>> {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const exceptions: Array<{ type: string; employeeId: number; date?: string; message: string }> = [];

  const employees = await db('employees')
    .where({ college_id: collegeId })
    .whereNotIn('employment_status', ['DRAFT', 'INACTIVE'])
    .select('id', 'date_of_joining', 'last_working_date', 'employment_status');

  const defaultShiftId = await db('hr_attendance_settings')
    .where({ college_id: collegeId })
    .first()
    .then((s) => s?.default_shift_id);

  for (const emp of employees) {
    const employeeId = Number(emp.id);
    const schedule = await getWorkScheduleForEmployee(employeeId, fromDate);
    const shift = await getShiftForEmployee(employeeId, fromDate);
    if (!schedule) {
      exceptions.push({ type: 'NO_WORKING_CALENDAR', employeeId, message: 'No work schedule assigned' });
    }
    if (!shift && !defaultShiftId) {
      exceptions.push({ type: 'NO_SHIFT', employeeId, message: 'No shift assigned' });
    }

    const records = await db('employee_attendance_records')
      .where('employee_id', employeeId)
      .whereBetween('attendance_date', [fromDate, toDate]);

    for (const rec of records) {
      const date = String(rec.attendance_date).slice(0, 10);
      const doj = emp.date_of_joining ? asISODate(emp.date_of_joining) : null;
      const lwd = emp.last_working_date ? asISODate(emp.last_working_date) : null;
      if (doj && date < doj && rec.attendance_status === 'ABSENT') {
        exceptions.push({ type: 'BEFORE_JOINING', employeeId, date, message: 'Absence before joining date' });
      }
      if (lwd && date > lwd && rec.attendance_status === 'ABSENT') {
        exceptions.push({ type: 'AFTER_LWD', employeeId, date, message: 'Absence after last working date' });
      }
      if (rec.attendance_status === 'MISSING_PUNCH') {
        exceptions.push({ type: 'INCOMPLETE_PUNCH', employeeId, date, message: 'Incomplete punch' });
      }
      if (rec.attendance_status === 'UNRESOLVED') {
        exceptions.push({ type: 'UNRESOLVED', employeeId, date, message: 'Unresolved attendance' });
      }
    }

    const pending = await db('employee_attendance_adjustments')
      .where({ employee_id: employeeId, status: 'PENDING' })
      .whereBetween('attendance_date', [fromDate, toDate])
      .count('* as c')
      .first();
    if (Number(pending?.c ?? 0) > 0) {
      exceptions.push({ type: 'PENDING_REGULARIZATION', employeeId, message: 'Pending regularization exists' });
    }
  }

  return exceptions;
}

async function upsertClosure(collegeId: number, year: number, month: number, updates: Row) {
  const existing = await db('hr_attendance_month_closures')
    .where({ college_id: collegeId, year, month })
    .first();
  if (existing) {
    await db('hr_attendance_month_closures').where({ id: existing.id }).update(updates);
    return Number(existing.id);
  }
  const [id] = await db('hr_attendance_month_closures').insert({
    college_id: collegeId,
    year,
    month,
    status: 'OPEN',
    ...updates,
  });
  return Number(id);
}

export async function processMonth(actor: HrActor, year: number, month: number) {
  assertHrPermission(actor, 'hr.attendance.manage');
  if (await isMonthLocked(actor.collegeId, year, month)) {
    throw new AppError(400, 'Month is locked');
  }

  await upsertClosure(actor.collegeId, year, month, {
    status: 'PROCESSING',
    processed_by: actor.facultyUserId,
    processed_at: db.fn.now(),
  });

  const { processed } = await recalculateCollegeMonth(actor.collegeId, year, month);
  await refreshCollegeMonthlySummaries(actor.collegeId, year, month);

  const exceptions = await detectExceptions(actor.collegeId, year, month);
  const closureId = await upsertClosure(actor.collegeId, year, month, {
    status: 'REVIEW',
    exception_count: exceptions.length,
  });

  await recordHrAudit({ actor, action: 'ATTENDANCE_MONTH_PROCESSED', entityType: 'hr_attendance_month_closures', entityId: closureId, after: { processed, exceptions: exceptions.length } });
  return {
    closure: await getMonthClosure(actor, year, month),
    processed,
    exceptions,
  };
}

export async function finalizeMonth(actor: HrActor, year: number, month: number) {
  assertHrPermission(actor, 'hr.attendance.manage');
  const closure = await db('hr_attendance_month_closures')
    .where({ college_id: actor.collegeId, year, month })
    .first();

  const exceptions = await detectExceptions(actor.collegeId, year, month);
  const critical = exceptions.filter((e) =>
    ['BEFORE_JOINING', 'AFTER_LWD', 'UNRESOLVED', 'INCOMPLETE_PUNCH', 'PENDING_REGULARIZATION'].includes(e.type),
  );
  if (critical.length > 0) {
    throw new AppError(400, `Cannot finalize: ${critical.length} critical exceptions remain`);
  }

  const closureId = await upsertClosure(actor.collegeId, year, month, {
    status: 'FINALIZED',
    finalized_by: actor.facultyUserId,
    finalized_at: db.fn.now(),
    exception_count: exceptions.length,
  });

  await db('employee_attendance_records')
    .where({ college_id: actor.collegeId })
    .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
    .update({ is_locked: true });

  await recordHrAudit({ actor, action: 'ATTENDANCE_MONTH_FINALIZED', entityType: 'hr_attendance_month_closures', entityId: closureId });
  return getMonthClosure(actor, year, month);
}

export async function lockMonth(actor: HrActor, year: number, month: number) {
  assertHrPermission(actor, 'hr.attendance.manage');
  const closure = await db('hr_attendance_month_closures')
    .where({ college_id: actor.collegeId, year, month })
    .first();
  if (!closure || closure.status !== 'FINALIZED') {
    throw new AppError(400, 'Month must be finalized before locking');
  }

  const closureId = await upsertClosure(actor.collegeId, year, month, {
    status: 'LOCKED',
    locked_by: actor.facultyUserId,
    locked_at: db.fn.now(),
  });

  await recordHrAudit({ actor, action: 'ATTENDANCE_MONTH_LOCKED', entityType: 'hr_attendance_month_closures', entityId: closureId });
  return getMonthClosure(actor, year, month);
}

export async function reopenMonth(actor: HrActor, year: number, month: number, reason: string) {
  assertHrPermission(actor, 'hr.attendance.manage');
  if (!reason || reason.length < 5) throw new AppError(400, 'Reopen reason is required');

  const closure = await db('hr_attendance_month_closures')
    .where({ college_id: actor.collegeId, year, month })
    .first();
  if (!closure || !['FINALIZED', 'LOCKED'].includes(String(closure.status))) {
    throw new AppError(400, 'Month is not in a reopenable state');
  }

  const closureId = await upsertClosure(actor.collegeId, year, month, {
    status: 'OPEN',
    reopened_by: actor.facultyUserId,
    reopened_at: db.fn.now(),
    reopen_reason: reason,
    finalized_at: null,
    finalized_by: null,
    locked_at: null,
    locked_by: null,
  });

  await db('employee_attendance_records')
    .where({ college_id: actor.collegeId })
    .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
    .update({ is_locked: false });

  await recordHrAudit({ actor, action: 'ATTENDANCE_MONTH_REOPENED', entityType: 'hr_attendance_month_closures', entityId: closureId, reason });
  return getMonthClosure(actor, year, month);
}

export { CLOSURE_STATUSES, attendanceSchemaReady };
