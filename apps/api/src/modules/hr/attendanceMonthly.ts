import { db } from '../../db/index.js';
import { eachDate, asISODate } from '../timetable/time.js';
import {
  getWorkScheduleForEmployee,
  getHolidayForDate,
  getApprovedLeaveForDate,
  leaveSessionForDate,
  sessionPortion,
} from './attendanceEngine.js';

type Row = Record<string, unknown>;

const COUNTABLE_PRESENT = ['PRESENT', 'ON_DUTY', 'WORK_FROM_HOME'];
const LOP_STATUSES = ['ABSENT'];
const UNPAID_LEAVE_CODE = 'LOP';

export async function computeMonthlySummary(employeeId: number, year: number, month: number) {
  const emp = await db('employees').where({ id: employeeId }).first();
  if (!emp) return null;

  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const doj = emp.date_of_joining ? asISODate(emp.date_of_joining) : null;
  const lwd = emp.last_working_date ? asISODate(emp.last_working_date) : null;

  let calendarDays = lastDay;
  let employmentApplicableDays = 0;
  let workingDays = 0;
  let holidays = 0;
  let weeklyOffs = 0;
  let presentDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let halfDays = 0;
  let absenceDays = 0;
  let odWfhDays = 0;
  let lateCount = 0;
  let earlyOutCount = 0;
  let unresolvedCount = 0;

  const records = await db('employee_attendance_records')
    .where('employee_id', employeeId)
    .whereBetween('attendance_date', [fromDate, toDate]);

  const recordMap = new Map<string, Row>();
  for (const r of records) {
    recordMap.set(String(r.attendance_date).slice(0, 10), r);
  }

  for (const date of eachDate(fromDate, toDate)) {
    if (doj && date < doj) continue;
    if (lwd && date > lwd) continue;
    employmentApplicableDays++;

    const schedule = await getWorkScheduleForEmployee(employeeId, date);
    const holiday = await getHolidayForDate(Number(emp.college_id), date, emp.department_id);
    const dow = new Date(`${date}T12:00:00`).getDay();

    const isWeeklyOff =
      schedule &&
      (!schedule.workingDays.includes(dow) || schedule.weeklyOff.includes(dow));
    const isHoliday = !!holiday;

    if (isHoliday) {
      holidays++;
      continue;
    }
    if (isWeeklyOff) {
      weeklyOffs++;
      continue;
    }

    workingDays++;

    const rec = recordMap.get(date);
    if (!rec) {
      const leave = await getApprovedLeaveForDate(employeeId, date);
      if (leave) {
        if (leave.isPaid && leave.leaveTypeCode !== UNPAID_LEAVE_CODE) {
          paidLeaveDays += leave.portion;
        } else {
          unpaidLeaveDays += leave.portion;
        }
      } else {
        absenceDays += 1;
      }
      continue;
    }

    const status = String(rec.attendance_status);
    if (Number(rec.late_minutes ?? 0) > 0) lateCount++;
    if (Number(rec.early_exit_minutes ?? 0) > 0) earlyOutCount++;
    if (status === 'MISSING_PUNCH' || status === 'UNRESOLVED') unresolvedCount++;

    if (COUNTABLE_PRESENT.includes(status)) {
      presentDays += 1;
    } else if (status === 'HALF_DAY') {
      halfDays += 0.5;
      presentDays += 0.5;
    } else if (status === 'ON_LEAVE') {
      const leave = await getApprovedLeaveForDate(employeeId, date);
      if (leave?.isPaid && leave.leaveTypeCode !== UNPAID_LEAVE_CODE) {
        paidLeaveDays += leave?.portion ?? 1;
      } else {
        unpaidLeaveDays += leave?.portion ?? 1;
      }
    } else if (status === 'ON_DUTY') {
      odWfhDays += 1;
      presentDays += 1;
    } else if (status === 'WORK_FROM_HOME') {
      odWfhDays += 1;
      presentDays += 1;
    } else if (LOP_STATUSES.includes(status)) {
      absenceDays += 1;
    }
  }

  const payableDays = presentDays + paidLeaveDays + odWfhDays;
  const lopDays = absenceDays + unpaidLeaveDays + halfDays; // half days may be partial LOP per policy

  return {
    collegeId: Number(emp.college_id),
    employeeId,
    year,
    month,
    calendarDays,
    employmentApplicableDays,
    workingDays,
    holidays,
    weeklyOffs,
    presentDays,
    paidLeaveDays,
    unpaidLeaveDays,
    halfDays,
    absenceDays,
    odWfhDays,
    payableDays: Math.min(payableDays + halfDays, workingDays),
    lopDays: Math.min(lopDays, workingDays),
    lateCount,
    earlyOutCount,
    unresolvedCount,
  };
}

export async function upsertMonthlySummary(employeeId: number, year: number, month: number) {
  const summary = await computeMonthlySummary(employeeId, year, month);
  if (!summary) return null;

  const existing = await db('employee_monthly_attendance')
    .where({ employee_id: employeeId, year, month })
    .first();

  const payload = {
    college_id: summary.collegeId,
    employee_id: employeeId,
    year,
    month,
    calendar_days: summary.calendarDays,
    employment_applicable_days: summary.employmentApplicableDays,
    working_days: summary.workingDays,
    holidays: summary.holidays,
    weekly_offs: summary.weeklyOffs,
    present_days: summary.presentDays,
    paid_leave_days: summary.paidLeaveDays,
    unpaid_leave_days: summary.unpaidLeaveDays,
    half_days: summary.halfDays,
    absence_days: summary.absenceDays,
    od_wfh_days: summary.odWfhDays,
    payable_days: summary.payableDays,
    lop_days: summary.lopDays,
    late_count: summary.lateCount,
    early_out_count: summary.earlyOutCount,
    unresolved_count: summary.unresolvedCount,
    calculated_at: db.fn.now(),
    updated_at: db.fn.now(),
  };

  if (existing) {
    await db('employee_monthly_attendance').where({ id: existing.id }).update(payload);
    return Number(existing.id);
  }

  const [id] = await db('employee_monthly_attendance').insert({
    ...payload,
    status: 'OPEN',
    calculation_version: 1,
  });
  return Number(id);
}

export async function refreshCollegeMonthlySummaries(collegeId: number, year: number, month: number) {
  const employees = await db('employees')
    .where({ college_id: collegeId })
    .whereNotIn('employment_status', ['DRAFT', 'INACTIVE'])
    .select('id');

  for (const emp of employees) {
    await upsertMonthlySummary(Number(emp.id), year, month);
  }
}

export async function getMonthlySummaryForEmployee(employeeId: number, year: number, month: number) {
  const row = await db('employee_monthly_attendance')
    .where({ employee_id: employeeId, year, month })
    .first();
  if (!row) {
    await upsertMonthlySummary(employeeId, year, month);
    const refreshed = await db('employee_monthly_attendance')
      .where({ employee_id: employeeId, year, month })
      .first();
    if (!refreshed) return null;
    return serializeMonthly(refreshed);
  }
  return serializeMonthly(row);
}

function serializeMonthly(row: Row) {
  return {
    id: Number(row.id),
    employeeId: Number(row.employee_id),
    year: Number(row.year),
    month: Number(row.month),
    calendarDays: Number(row.calendar_days),
    employmentApplicableDays: Number(row.employment_applicable_days),
    workingDays: Number(row.working_days),
    holidays: Number(row.holidays),
    weeklyOffs: Number(row.weekly_offs),
    presentDays: Number(row.present_days),
    paidLeaveDays: Number(row.paid_leave_days),
    unpaidLeaveDays: Number(row.unpaid_leave_days),
    halfDays: Number(row.half_days),
    absenceDays: Number(row.absence_days),
    odWfhDays: Number(row.od_wfh_days),
    payableDays: Number(row.payable_days),
    lopDays: Number(row.lop_days),
    lateCount: Number(row.late_count),
    earlyOutCount: Number(row.early_out_count),
    unresolvedCount: Number(row.unresolved_count),
    status: row.status,
    calculatedAt: row.calculated_at,
  };
}

export async function listCollegeMonthlySummaries(collegeId: number, year: number, month: number, filters?: { departmentId?: number }) {
  let q = db('employee_monthly_attendance as m')
    .join('employees as e', 'e.id', 'm.employee_id')
    .where({ 'm.college_id': collegeId, 'm.year': year, 'm.month': month })
    .select('m.*', 'e.display_name', 'e.employee_number', 'e.department_id');

  if (filters?.departmentId) q = q.andWhere('e.department_id', filters.departmentId);

  const rows = await q.orderBy('e.display_name');
  return rows.map((r: Row) => ({
    ...serializeMonthly(r),
    employeeName: r.display_name,
    employeeNumber: r.employee_number,
    departmentId: r.department_id ? Number(r.department_id) : null,
  }));
}

export { serializeMonthly };
