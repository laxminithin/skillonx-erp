import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
/**
 * Payroll handoff contract — consume only finalized/locked attendance months.
 */
export async function getPayrollAttendanceHandoff(collegeId, year, month) {
    const closure = await db('hr_attendance_month_closures')
        .where({ college_id: collegeId, year, month })
        .first();
    if (!closure || !['FINALIZED', 'LOCKED'].includes(String(closure.status))) {
        throw new AppError(400, 'Attendance month is not finalized or locked for payroll consumption');
    }
    const rows = await db('employee_monthly_attendance as m')
        .join('employees as e', 'e.id', 'm.employee_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where({ 'm.college_id': collegeId, 'm.year': year, 'm.month': month })
        .select('m.*', 'e.employee_number', 'e.display_name', 'd.name as department_name');
    return {
        closureId: Number(closure.id),
        closureStatus: closure.status,
        calculationVersion: Number(closure.calculation_version ?? 1),
        year,
        month,
        employees: rows.map((r) => ({
            employeeId: Number(r.employee_id),
            employeeNumber: r.employee_number,
            employeeName: r.display_name,
            departmentName: r.department_name,
            employmentApplicableDays: Number(r.employment_applicable_days),
            workingDays: Number(r.working_days),
            payableDays: Number(r.payable_days),
            lopDays: Number(r.lop_days),
            paidLeaveDays: Number(r.paid_leave_days),
            unpaidLeaveDays: Number(r.unpaid_leave_days),
            absenceDays: Number(r.absence_days),
            halfDays: Number(r.half_days),
            presentDays: Number(r.present_days),
        })),
    };
}
export async function payrollHandoffForActor(actor, year, month) {
    assertHrPermission(actor, 'hr.payroll.view');
    return getPayrollAttendanceHandoff(actor.collegeId, year, month);
}
