import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, requireEmployeeForActor } from './access.js';
import { recordHrAudit } from './audit.js';
import { calculateEmployeeDay, recalculateEmployeeRange, recalculateCollegeMonth, isMonthLocked, } from './attendanceEngine.js';
import { listCollegeMonthlySummaries, getMonthlySummaryForEmployee } from './attendanceMonthly.js';
import { getMonthClosure, detectExceptions } from './attendanceClosure.js';
import { asISODate } from '../timetable/time.js';
function serializeAttendance(row) {
    return {
        id: Number(row.id),
        employeeId: Number(row.employee_id),
        date: row.attendance_date,
        firstInAt: row.first_in_at,
        lastOutAt: row.last_out_at,
        workMinutes: row.work_minutes != null ? Number(row.work_minutes) : null,
        lateMinutes: Number(row.late_minutes ?? 0),
        earlyOutMinutes: Number(row.early_exit_minutes ?? row.early_out_minutes ?? 0),
        overtimeMinutes: Number(row.overtime_minutes ?? 0),
        attendanceStatus: row.attendance_status,
        source: row.source,
        remarks: row.remarks,
        shiftId: row.shift_id ? Number(row.shift_id) : null,
        leaveRequestId: row.leave_request_id ? Number(row.leave_request_id) : null,
        holidayId: row.holiday_id ? Number(row.holiday_id) : null,
        isLocked: !!row.is_locked,
        isManualOverride: !!row.is_manual_override,
    };
}
export async function getMyAttendance(actor, from, to) {
    const emp = await requireEmployeeForActor(actor);
    let q = db('employee_attendance_records').where({ employee_id: emp.id });
    if (from)
        q = q.andWhere('attendance_date', '>=', from);
    if (to)
        q = q.andWhere('attendance_date', '<=', to);
    const rows = await q.orderBy('attendance_date', 'desc').limit(90);
    return rows.map(serializeAttendance);
}
export async function getMyAttendanceSummary(actor, year, month) {
    const emp = await requireEmployeeForActor(actor);
    const summary = await getMonthlySummaryForEmployee(Number(emp.id), year, month);
    const records = await db('employee_attendance_records')
        .where('employee_id', emp.id)
        .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
        .orderBy('attendance_date');
    return { summary, days: records.map(serializeAttendance) };
}
export async function getMyAttendanceForDate(actor, date) {
    const emp = await requireEmployeeForActor(actor);
    const row = await db('employee_attendance_records')
        .where({ employee_id: emp.id, attendance_date: date })
        .first();
    if (!row) {
        const calc = await calculateEmployeeDay(Number(emp.id), date);
        return { date, calculated: calc, persisted: null };
    }
    return { date, persisted: serializeAttendance(row), calculated: null };
}
export async function listTeamAttendance(actor, date) {
    assertHrPermission(actor, 'hr.attendance.view');
    const self = await requireEmployeeForActor(actor).catch(() => null);
    let q = db('employee_attendance_records as a')
        .join('employees as e', 'e.id', 'a.employee_id')
        .where({ 'a.college_id': actor.collegeId, 'a.attendance_date': date })
        .select('a.*', 'e.display_name', 'e.employee_number');
    if (self && !['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(actor.role)) {
        q = q.andWhere('e.reporting_manager_employee_id', self.id);
    }
    const rows = await q.orderBy('e.display_name');
    return rows.map((r) => ({
        ...serializeAttendance(r),
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
    }));
}
export async function listAdminAttendanceRegister(actor, year, month, filters) {
    assertHrPermission(actor, 'hr.attendance.view');
    await recalculateCollegeMonth(actor.collegeId, year, month).catch(() => null);
    let summaries = await listCollegeMonthlySummaries(actor.collegeId, year, month, {
        departmentId: filters?.departmentId,
    });
    if (filters?.employeeId) {
        summaries = summaries.filter((s) => s.employeeId === filters.employeeId);
    }
    const closure = await getMonthClosure(actor, year, month);
    return { closure, summaries };
}
export async function getEmployeeAttendanceAdmin(actor, employeeId, year, month) {
    assertHrPermission(actor, 'hr.attendance.view');
    const emp = await db('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const summary = await getMonthlySummaryForEmployee(employeeId, year, month);
    const days = await db('employee_attendance_records')
        .where('employee_id', employeeId)
        .whereRaw('YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?', [year, month])
        .orderBy('attendance_date');
    return { employee: { id: employeeId, name: emp.display_name, number: emp.employee_number }, summary, days: days.map(serializeAttendance) };
}
export async function recalculateAttendance(actor, input) {
    assertHrPermission(actor, 'hr.attendance.manage');
    if (input.employeeId) {
        const emp = await db('employees').where({ id: input.employeeId, college_id: actor.collegeId }).first();
        if (!emp)
            throw new AppError(404, 'Employee not found');
        const processed = await recalculateEmployeeRange(input.employeeId, input.fromDate, input.toDate);
        return { processed };
    }
    const [y, m] = input.fromDate.split('-').map(Number);
    return recalculateCollegeMonth(actor.collegeId, y, m);
}
export async function overrideAttendance(actor, recordId, input) {
    assertHrPermission(actor, 'hr.attendance.adjust');
    const rec = await db('employee_attendance_records').where({ id: recordId, college_id: actor.collegeId }).first();
    if (!rec)
        throw new AppError(404, 'Attendance record not found');
    const date = asISODate(rec.attendance_date);
    const [y, m] = date.split('-').map(Number);
    if (await isMonthLocked(actor.collegeId, y, m)) {
        throw new AppError(400, 'Month is locked');
    }
    const beforeStatus = String(rec.attendance_status);
    await db('employee_attendance_records').where({ id: recordId }).update({
        attendance_status: input.status,
        is_manual_override: true,
        override_reason: input.reason,
        source: 'HR_OVERRIDE',
    });
    if (await db.schema.hasTable('hr_attendance_overrides')) {
        await db('hr_attendance_overrides').insert({
            college_id: actor.collegeId,
            attendance_record_id: recordId,
            employee_id: rec.employee_id,
            attendance_date: rec.attendance_date,
            before_status: beforeStatus,
            after_status: input.status,
            reason: input.reason,
            actor_faculty_id: actor.facultyUserId,
        });
    }
    await recordHrAudit({
        actor,
        action: 'ATTENDANCE_OVERRIDE',
        entityType: 'employee_attendance_records',
        entityId: recordId,
        before: { status: beforeStatus },
        after: { status: input.status },
        reason: input.reason,
    });
    const updated = await db('employee_attendance_records').where({ id: recordId }).first();
    return serializeAttendance(updated);
}
export async function getAttendanceExceptions(actor, year, month) {
    assertHrPermission(actor, 'hr.attendance.view');
    return detectExceptions(actor.collegeId, year, month);
}
export async function recordAttendance(actor, input) {
    assertHrPermission(actor, 'hr.attendance.manage');
    const emp = await db('employees').where({ id: input.employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const existing = await db('employee_attendance_records')
        .where({ employee_id: input.employeeId, attendance_date: input.date })
        .first();
    if (existing) {
        await db('employee_attendance_records').where({ id: existing.id }).update({
            attendance_status: input.status,
            remarks: input.remarks ?? existing.remarks,
            source: 'HR_ADJUSTMENT',
        });
        return serializeAttendance({ ...existing, attendance_status: input.status });
    }
    const [id] = await db('employee_attendance_records').insert({
        college_id: actor.collegeId,
        employee_id: input.employeeId,
        attendance_date: input.date,
        attendance_status: input.status,
        source: 'MANUAL',
        remarks: input.remarks ?? null,
    });
    const row = await db('employee_attendance_records').where({ id }).first();
    return serializeAttendance(row);
}
export async function getAttendanceDashboardStats(actor) {
    assertHrPermission(actor, 'hr.attendance.view');
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const presentToday = await db('employee_attendance_records')
        .where({ college_id: actor.collegeId, attendance_date: today, attendance_status: 'PRESENT' })
        .count('* as c')
        .first();
    const absentToday = await db('employee_attendance_records')
        .where({ college_id: actor.collegeId, attendance_date: today, attendance_status: 'ABSENT' })
        .count('* as c')
        .first();
    const onLeaveToday = await db('employee_attendance_records')
        .where({ college_id: actor.collegeId, attendance_date: today })
        .whereIn('attendance_status', ['ON_LEAVE', 'HALF_DAY'])
        .count('* as c')
        .first();
    const incompletePunch = await db('employee_attendance_records')
        .where({ college_id: actor.collegeId, attendance_date: today, attendance_status: 'MISSING_PUNCH' })
        .count('* as c')
        .first();
    const pendingRegularizations = await db('employee_attendance_adjustments')
        .where({ college_id: actor.collegeId, status: 'PENDING' })
        .count('* as c')
        .first();
    const closure = await getMonthClosure(actor, year, month);
    const exceptions = await detectExceptions(actor.collegeId, year, month);
    return {
        presentToday: Number(presentToday?.c ?? 0),
        absentToday: Number(absentToday?.c ?? 0),
        onLeaveToday: Number(onLeaveToday?.c ?? 0),
        incompletePunch: Number(incompletePunch?.c ?? 0),
        pendingRegularizations: Number(pendingRegularizations?.c ?? 0),
        monthClosureStatus: closure.status,
        unresolvedExceptions: exceptions.length,
    };
}
