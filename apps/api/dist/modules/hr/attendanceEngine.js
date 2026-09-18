/**
 * Attendance calculation engine.
 *
 * PRECEDENCE (first applicable rule wins for non-punch states):
 * 1. NOT_JOINED — date before employee date_of_joining
 * 2. SEPARATED — date after last_working_date
 * 3. SUSPENDED — employment_status is SUSPENDED
 * 4. HOLIDAY — institution holiday on date
 * 5. WEEKLY_OFF — not a working day per assigned schedule
 * 6. LEAVE — approved leave (full/half based on session + leave type)
 * 7. HR_OVERRIDE — manual override on locked daily record (preserved)
 * 8. REGULARIZATION — approved adjustment with requested times
 * 9. PUNCH_CALC — derive from punches + shift thresholds
 * 10. ABSENT — working day with no qualifying attendance
 */
import { db } from '../../db/index.js';
import { eachDate, asISODate } from '../timetable/time.js';
export const CALCULATION_VERSION = 1;
function parseTimeOnDate(date, timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, m, s || 0, 0);
    return d;
}
function weekday(date) {
    return new Date(`${date}T12:00:00`).getDay();
}
export function leaveSessionForDate(fromDate, toDate, fromSession, toSession, date) {
    if (fromDate === toDate) {
        if (fromSession === 'FULL_DAY' || toSession === 'FULL_DAY')
            return 'FULL_DAY';
        return fromSession;
    }
    if (date === fromDate) {
        return fromSession === 'SECOND_HALF' ? 'SECOND_HALF' : 'FULL_DAY';
    }
    if (date === toDate) {
        return toSession === 'FIRST_HALF' ? 'FIRST_HALF' : 'FULL_DAY';
    }
    return 'FULL_DAY';
}
export function sessionPortion(session) {
    if (session === 'FULL_DAY')
        return 1;
    return 0.5;
}
export function calculateDailyAttendance(input) {
    const base = {
        status: 'UNRESOLVED',
        firstInAt: null,
        lastOutAt: null,
        workMinutes: 0,
        lateMinutes: 0,
        earlyOutMinutes: 0,
        overtimeMinutes: 0,
        leaveRequestId: null,
        holidayId: null,
        shiftId: input.shift?.id ?? null,
        source: 'SYSTEM',
        isUnresolved: false,
    };
    if (input.existingRecord?.is_manual_override) {
        return {
            ...base,
            status: String(input.existingRecord.attendance_status),
            firstInAt: input.existingRecord.first_in_at ? new Date(String(input.existingRecord.first_in_at)) : null,
            lastOutAt: input.existingRecord.last_out_at ? new Date(String(input.existingRecord.last_out_at)) : null,
            workMinutes: Number(input.existingRecord.work_minutes ?? 0),
            lateMinutes: Number(input.existingRecord.late_minutes ?? 0),
            earlyOutMinutes: Number(input.existingRecord.early_exit_minutes ?? input.existingRecord.early_out_minutes ?? 0),
            shiftId: input.existingRecord.shift_id ? Number(input.existingRecord.shift_id) : base.shiftId,
            source: 'HR_OVERRIDE',
            isUnresolved: false,
        };
    }
    if (input.dateOfJoining && input.date < input.dateOfJoining) {
        return { ...base, status: 'NOT_JOINED', source: 'SYSTEM' };
    }
    if (input.lastWorkingDate && input.date > input.lastWorkingDate) {
        return { ...base, status: 'SEPARATED', source: 'SYSTEM' };
    }
    if (input.employmentStatus === 'SUSPENDED') {
        return { ...base, status: 'SUSPENDED', source: 'SYSTEM' };
    }
    if (input.holiday) {
        return {
            ...base,
            status: 'HOLIDAY',
            holidayId: Number(input.holiday.id),
            source: 'HOLIDAY',
        };
    }
    const sched = input.schedule;
    if (sched) {
        const dow = weekday(input.date);
        if (!sched.workingDays.includes(dow) || sched.weeklyOff.includes(dow)) {
            return { ...base, status: 'WEEKLY_OFF', source: 'SYSTEM' };
        }
    }
    if (input.leave) {
        const code = input.leave.leaveTypeCode;
        let status = 'ON_LEAVE';
        if (code === 'OD')
            status = 'ON_DUTY';
        else if (code === 'WFH')
            status = 'WORK_FROM_HOME';
        const portion = input.leave.portion;
        if (portion < 1 && portion > 0) {
            // half-day leave — may combine with punch for other half
            const punchResult = calcFromPunches(input);
            if (punchResult.status === 'PRESENT' || punchResult.status === 'HALF_DAY') {
                return {
                    ...punchResult,
                    status: 'HALF_DAY',
                    leaveRequestId: input.leave.leaveRequestId,
                    source: 'LEAVE',
                };
            }
            return {
                ...base,
                status: 'HALF_DAY',
                leaveRequestId: input.leave.leaveRequestId,
                source: 'LEAVE',
            };
        }
        return {
            ...base,
            status,
            leaveRequestId: input.leave.leaveRequestId,
            source: 'LEAVE',
        };
    }
    if (input.approvedAdjustment) {
        const inAt = input.approvedAdjustment.requested_in_at
            ? new Date(String(input.approvedAdjustment.requested_in_at))
            : null;
        const outAt = input.approvedAdjustment.requested_out_at
            ? new Date(String(input.approvedAdjustment.requested_out_at))
            : null;
        const adjStatus = String(input.approvedAdjustment.new_status ?? 'PRESENT');
        const workMin = inAt && outAt ? Math.max(0, Math.round((outAt.getTime() - inAt.getTime()) / 60000)) : 0;
        return {
            ...base,
            status: adjStatus,
            firstInAt: inAt,
            lastOutAt: outAt,
            workMinutes: workMin,
            source: 'REGULARIZATION',
        };
    }
    return calcFromPunches(input);
}
function calcFromPunches(input) {
    const base = {
        status: 'ABSENT',
        firstInAt: null,
        lastOutAt: null,
        workMinutes: 0,
        lateMinutes: 0,
        earlyOutMinutes: 0,
        overtimeMinutes: 0,
        leaveRequestId: null,
        holidayId: null,
        shiftId: input.shift?.id ?? null,
        source: 'SYSTEM',
        isUnresolved: false,
    };
    const punches = [...input.punches].sort((a, b) => a.punchAt.getTime() - b.punchAt.getTime());
    if (punches.length === 0) {
        return { ...base, status: 'ABSENT', source: 'SYSTEM' };
    }
    const firstIn = punches[0].punchAt;
    const lastOut = punches.length > 1 ? punches[punches.length - 1].punchAt : null;
    if (!lastOut || punches.length === 1) {
        return {
            ...base,
            status: 'MISSING_PUNCH',
            firstInAt: firstIn,
            lastOutAt: lastOut,
            source: punches[0].punchType ? 'BIOMETRIC' : 'SYSTEM',
            isUnresolved: true,
        };
    }
    const workMinutes = Math.max(0, Math.round((lastOut.getTime() - firstIn.getTime()) / 60000));
    const shift = input.shift;
    const sched = input.schedule;
    let lateMinutes = 0;
    let earlyOutMinutes = 0;
    let overtimeMinutes = 0;
    if (shift) {
        const shiftStart = parseTimeOnDate(input.date, shift.startTime);
        const shiftEnd = parseTimeOnDate(input.date, shift.endTime);
        if (shift.crossesMidnight)
            shiftEnd.setDate(shiftEnd.getDate() + 1);
        const graceIn = shift.graceInMinutes ?? sched?.graceMinutes ?? 15;
        const allowedStart = new Date(shiftStart.getTime() + graceIn * 60000);
        if (firstIn > allowedStart) {
            lateMinutes = Math.round((firstIn.getTime() - shiftStart.getTime()) / 60000);
        }
        const graceOut = shift.graceOutMinutes ?? 0;
        const allowedEnd = new Date(shiftEnd.getTime() - graceOut * 60000);
        if (lastOut < allowedEnd) {
            earlyOutMinutes = Math.round((shiftEnd.getTime() - lastOut.getTime()) / 60000);
        }
        const expectedMinutes = shift.minimumFullDayMinutes ?? sched?.fullDayMinutes ?? 480;
        const halfThreshold = shift.minimumHalfDayMinutes ?? sched?.halfDayThresholdMinutes ?? 240;
        const breakMin = shift.breakDurationMinutes ?? 0;
        const netWork = Math.max(0, workMinutes - breakMin);
        if (netWork >= expectedMinutes) {
            overtimeMinutes = Math.max(0, netWork - expectedMinutes);
            return {
                ...base,
                status: 'PRESENT',
                firstInAt: firstIn,
                lastOutAt: lastOut,
                workMinutes: netWork,
                lateMinutes,
                earlyOutMinutes,
                overtimeMinutes,
                source: 'BIOMETRIC',
            };
        }
        if (netWork >= halfThreshold) {
            return {
                ...base,
                status: 'HALF_DAY',
                firstInAt: firstIn,
                lastOutAt: lastOut,
                workMinutes: netWork,
                lateMinutes,
                earlyOutMinutes,
                source: 'BIOMETRIC',
            };
        }
        return {
            ...base,
            status: 'ABSENT',
            firstInAt: firstIn,
            lastOutAt: lastOut,
            workMinutes: netWork,
            lateMinutes,
            earlyOutMinutes,
            source: 'BIOMETRIC',
        };
    }
    const fullDay = sched?.fullDayMinutes ?? 480;
    const halfDay = sched?.halfDayThresholdMinutes ?? 240;
    if (workMinutes >= fullDay) {
        return { ...base, status: 'PRESENT', firstInAt: firstIn, lastOutAt: lastOut, workMinutes, source: 'BIOMETRIC' };
    }
    if (workMinutes >= halfDay) {
        return { ...base, status: 'HALF_DAY', firstInAt: firstIn, lastOutAt: lastOut, workMinutes, source: 'BIOMETRIC' };
    }
    return { ...base, status: 'ABSENT', firstInAt: firstIn, lastOutAt: lastOut, workMinutes, source: 'BIOMETRIC' };
}
export async function attendanceSchemaReady() {
    try {
        return ((await db.schema.hasTable('employee_attendance_records')) &&
            (await db.schema.hasTable('hr_attendance_month_closures')));
    }
    catch {
        return false;
    }
}
export async function isMonthLocked(collegeId, year, month) {
    if (!(await db.schema.hasTable('hr_attendance_month_closures')))
        return false;
    const row = await db('hr_attendance_month_closures')
        .where({ college_id: collegeId, year, month })
        .first();
    return row && ['FINALIZED', 'LOCKED'].includes(String(row.status));
}
export async function getAttendanceSettings(collegeId) {
    if (!(await db.schema.hasTable('hr_attendance_settings'))) {
        return {
            id: 0,
            sandwichLeavePolicy: 'DISABLED',
            lateMarksCountAsLop: false,
            autoFlagMissingPunch: true,
        };
    }
    const row = await db('hr_attendance_settings').where({ college_id: collegeId }).first();
    if (!row) {
        return {
            id: 0,
            sandwichLeavePolicy: 'DISABLED',
            lateMarksCountAsLop: false,
            autoFlagMissingPunch: true,
        };
    }
    return {
        id: Number(row.id),
        sandwichLeavePolicy: String(row.sandwich_leave_policy ?? 'DISABLED'),
        lateMarksCountAsLop: !!row.late_marks_count_as_lop,
        autoFlagMissingPunch: !!row.auto_flag_missing_punch,
    };
}
export async function getWorkScheduleForEmployee(employeeId, date) {
    const assignment = await db('employee_work_schedule_assignments as a')
        .join('hr_work_schedules as s', 's.id', 'a.work_schedule_id')
        .where('a.employee_id', employeeId)
        .where('a.effective_from', '<=', date)
        .andWhere((b) => b.whereNull('a.effective_to').orWhere('a.effective_to', '>=', date))
        .orderBy('a.effective_from', 'desc')
        .select('s.*')
        .first();
    if (!assignment) {
        const emp = await db('employees').where({ id: employeeId }).first();
        if (!emp)
            return null;
        const settings = await db('hr_attendance_settings').where({ college_id: emp.college_id }).first();
        if (settings?.default_work_schedule_id) {
            const s = await db('hr_work_schedules').where({ id: settings.default_work_schedule_id }).first();
            if (s)
                return parseSchedule(s);
        }
        const general = await db('hr_work_schedules')
            .where({ college_id: emp.college_id, code: 'GENERAL', is_active: true })
            .first();
        if (general)
            return parseSchedule(general);
        return null;
    }
    return parseSchedule(assignment);
}
function parseSchedule(row) {
    const workingDays = typeof row.working_days === 'string' ? JSON.parse(row.working_days) : row.working_days;
    const weeklyOff = row.weekly_off
        ? typeof row.weekly_off === 'string'
            ? JSON.parse(row.weekly_off)
            : row.weekly_off
        : [];
    return {
        workingDays: workingDays ?? [1, 2, 3, 4, 5, 6],
        weeklyOff: weeklyOff ?? [0],
        graceMinutes: Number(row.grace_minutes ?? 15),
        halfDayThresholdMinutes: Number(row.half_day_threshold_minutes ?? 240),
        fullDayMinutes: Number(row.full_day_minutes ?? 480),
    };
}
export async function getShiftForEmployee(employeeId, date) {
    const assignment = await db('employee_shift_assignments as a')
        .join('hr_shifts as s', 's.id', 'a.shift_id')
        .where('a.employee_id', employeeId)
        .where('a.effective_from', '<=', date)
        .andWhere((b) => b.whereNull('a.effective_to').orWhere('a.effective_to', '>=', date))
        .orderBy('a.effective_from', 'desc')
        .select('s.*')
        .first();
    let shiftRow = assignment;
    if (!shiftRow) {
        const emp = await db('employees').where({ id: employeeId }).first();
        if (!emp)
            return null;
        const settings = await db('hr_attendance_settings').where({ college_id: emp.college_id }).first();
        if (settings?.default_shift_id) {
            shiftRow = await db('hr_shifts').where({ id: settings.default_shift_id }).first();
        }
        if (!shiftRow) {
            shiftRow = await db('hr_shifts').where({ college_id: emp.college_id, code: 'GENERAL', is_active: true }).first();
        }
    }
    if (!shiftRow)
        return null;
    return parseShift(shiftRow);
}
function parseShift(row) {
    return {
        id: Number(row.id),
        startTime: String(row.start_time).slice(0, 8),
        endTime: String(row.end_time).slice(0, 8),
        breakDurationMinutes: Number(row.break_duration_minutes ?? 0),
        graceInMinutes: Number(row.grace_in_minutes ?? row.grace_minutes ?? 15),
        graceOutMinutes: Number(row.grace_out_minutes ?? 0),
        lateThresholdMinutes: Number(row.late_threshold_minutes ?? 0),
        earlyOutThresholdMinutes: Number(row.early_out_threshold_minutes ?? 0),
        minimumFullDayMinutes: Number(row.minimum_full_day_minutes ?? row.full_day_minutes ?? 480),
        minimumHalfDayMinutes: Number(row.minimum_half_day_minutes ?? row.half_day_threshold_minutes ?? 240),
        crossesMidnight: !!row.crosses_midnight,
    };
}
export async function getHolidayForDate(collegeId, date, departmentId) {
    if (!(await db.schema.hasTable('hr_attendance_holidays')))
        return null;
    let q = db('hr_attendance_holidays')
        .where({ college_id: collegeId, holiday_date: date, is_active: true });
    if (departmentId) {
        q = q.andWhere((b) => b.whereNull('department_id').orWhere('department_id', departmentId));
    }
    return q.first();
}
export async function getApprovedLeaveForDate(employeeId, date) {
    const row = await db('hr_leave_requests as r')
        .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
        .where('r.employee_id', employeeId)
        .where('r.status', 'APPROVED')
        .where('r.from_date', '<=', date)
        .where('r.to_date', '>=', date)
        .select('r.*', 't.code as leave_type_code', 't.is_paid')
        .first();
    if (!row)
        return null;
    const session = leaveSessionForDate(String(row.from_date), String(row.to_date), String(row.from_session), String(row.to_session), date);
    return {
        leaveRequestId: Number(row.id),
        leaveTypeCode: String(row.leave_type_code),
        isPaid: !!row.is_paid,
        session,
        portion: sessionPortion(session),
    };
}
export async function getPunchesForDate(employeeId, date) {
    if (!(await db.schema.hasTable('employee_attendance_punches'))) {
        const rec = await db('employee_attendance_records')
            .where({ employee_id: employeeId, attendance_date: date })
            .first();
        if (!rec?.first_in_at)
            return [];
        const punches = [{ punchAt: new Date(String(rec.first_in_at)), punchType: 'IN' }];
        if (rec.last_out_at)
            punches.push({ punchAt: new Date(String(rec.last_out_at)), punchType: 'OUT' });
        return punches;
    }
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59.999`;
    const rows = await db('employee_attendance_punches')
        .where('employee_id', employeeId)
        .whereRaw('DATE(punch_at) = ?', [date])
        .orderBy('punch_at');
    return rows.map((r) => ({
        punchAt: new Date(String(r.punch_at)),
        punchType: r.punch_type ? String(r.punch_type) : null,
    }));
}
export async function getApprovedAdjustment(employeeId, date) {
    return db('employee_attendance_adjustments')
        .where({ employee_id: employeeId, attendance_date: date, status: 'APPROVED' })
        .orderBy('updated_at', 'desc')
        .first();
}
export async function calculateEmployeeDay(employeeId, date) {
    const emp = await db('employees').where({ id: employeeId }).first();
    if (!emp)
        throw new Error('Employee not found');
    const existing = await db('employee_attendance_records')
        .where({ employee_id: employeeId, attendance_date: date })
        .first();
    const settings = await getAttendanceSettings(Number(emp.college_id));
    const schedule = await getWorkScheduleForEmployee(employeeId, date);
    const shift = await getShiftForEmployee(employeeId, date);
    const holiday = await getHolidayForDate(Number(emp.college_id), date, emp.department_id);
    const leave = await getApprovedLeaveForDate(employeeId, date);
    const punches = await getPunchesForDate(employeeId, date);
    const adjustment = await getApprovedAdjustment(employeeId, date);
    return calculateDailyAttendance({
        collegeId: Number(emp.college_id),
        employeeId,
        date,
        employmentStatus: String(emp.employment_status),
        dateOfJoining: emp.date_of_joining ? asISODate(emp.date_of_joining) : null,
        lastWorkingDate: emp.last_working_date ? asISODate(emp.last_working_date) : null,
        schedule,
        shift,
        holiday,
        leave,
        punches,
        approvedAdjustment: adjustment,
        existingRecord: existing,
        settings,
    });
}
export async function upsertDailyRecord(employeeId, date, result) {
    const emp = await db('employees').where({ id: employeeId }).first();
    if (!emp)
        throw new Error('Employee not found');
    const existing = await db('employee_attendance_records')
        .where({ employee_id: employeeId, attendance_date: date })
        .first();
    const payload = {
        college_id: emp.college_id,
        employee_id: employeeId,
        attendance_date: date,
        first_in_at: result.firstInAt,
        last_out_at: result.lastOutAt,
        work_minutes: result.workMinutes,
        late_minutes: result.lateMinutes,
        early_exit_minutes: result.earlyOutMinutes,
        overtime_minutes: result.overtimeMinutes,
        attendance_status: result.status,
        source: result.source,
        shift_id: result.shiftId,
        leave_request_id: result.leaveRequestId,
        holiday_id: result.holidayId,
        calculation_version: CALCULATION_VERSION,
        updated_at: db.fn.now(),
    };
    if (existing) {
        if (existing.is_manual_override)
            return Number(existing.id);
        if (existing.is_locked)
            return Number(existing.id);
        await db('employee_attendance_records').where({ id: existing.id }).update(payload);
        return Number(existing.id);
    }
    const [id] = await db('employee_attendance_records').insert({
        ...payload,
        is_manual_override: false,
        is_locked: false,
    });
    return Number(id);
}
export async function recalculateEmployeeRange(employeeId, fromDate, toDate) {
    const emp = await db('employees').where({ id: employeeId }).first();
    if (!emp)
        return 0;
    let count = 0;
    for (const date of eachDate(fromDate, toDate)) {
        const [y, m] = date.split('-').map(Number);
        if (await isMonthLocked(Number(emp.college_id), y, m))
            continue;
        const result = await calculateEmployeeDay(employeeId, date);
        await upsertDailyRecord(employeeId, date, result);
        count++;
    }
    return count;
}
export async function recalculateCollegeMonth(collegeId, year, month) {
    if (await isMonthLocked(collegeId, year, month)) {
        return { processed: 0 };
    }
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const employees = await db('employees')
        .where({ college_id: collegeId })
        .whereNotIn('employment_status', ['DRAFT', 'INACTIVE'])
        .select('id');
    let processed = 0;
    for (const emp of employees) {
        processed += await recalculateEmployeeRange(Number(emp.id), fromDate, toDate);
    }
    return { processed };
}
