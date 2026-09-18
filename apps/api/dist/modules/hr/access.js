import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
const ROLE_HR_PERMISSIONS = {
    SUPER_ADMIN: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.employee.manage', 'hr.employee.onboard', 'hr.employee.transfer',
        'hr.employee.promote', 'hr.employee.separate', 'hr.attendance.view', 'hr.attendance.manage',
        'hr.attendance.adjust', 'hr.leave.view', 'hr.leave.approve', 'hr.leave.override',
        'hr.leave.balance.adjust', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.calculate',
        'hr.payroll.approve', 'hr.payroll.lock',
        'hr.fnf.view', 'hr.fnf.manage', 'hr.fnf.calculate', 'hr.fnf.approve', 'hr.fnf.post',
        'hr.fnf.override', 'hr.fnf.document.release', 'hr.fnf.reopen', 'hr.fnf.clearance.department',
        'hr.performance.view', 'hr.performance.manage', 'hr.performance.calibrate',
        'hr.performance.finalize', 'hr.performance.reopen', 'hr.performance.report',
        'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.approve',
        'hr.recruitment.offer', 'hr.recruitment.join', 'hr.recruitment.report',
        'hr.document.view', 'hr.document.manage',
        'hr.config.manage', 'hr.report.view', 'hr.management.view',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate', 'hr.analytics.payroll.detail', 'hr.analytics.export',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.manage', 'hr.ld.nominate', 'hr.ld.approve', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.manage', 'hr.succession.nominate', 'hr.succession.assess', 'hr.succession.approve', 'hr.succession.report',
        'academic.leave.coverage.manage',
    ],
    COLLEGE_ADMIN: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.employee.manage', 'hr.employee.onboard', 'hr.employee.transfer',
        'hr.employee.promote', 'hr.employee.separate', 'hr.attendance.view', 'hr.attendance.manage',
        'hr.attendance.adjust', 'hr.leave.view', 'hr.leave.approve', 'hr.leave.override',
        'hr.leave.balance.adjust', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.calculate',
        'hr.payroll.approve', 'hr.payroll.lock',
        'hr.fnf.view', 'hr.fnf.manage', 'hr.fnf.calculate', 'hr.fnf.approve', 'hr.fnf.post',
        'hr.fnf.override', 'hr.fnf.document.release', 'hr.fnf.reopen', 'hr.fnf.clearance.department',
        'hr.performance.view', 'hr.performance.manage', 'hr.performance.calibrate',
        'hr.performance.finalize', 'hr.performance.reopen', 'hr.performance.report',
        'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.approve',
        'hr.recruitment.offer', 'hr.recruitment.join', 'hr.recruitment.report',
        'hr.document.view', 'hr.document.manage',
        'hr.config.manage', 'hr.report.view', 'hr.management.view',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate', 'hr.analytics.payroll.detail', 'hr.analytics.export',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.manage', 'hr.ld.nominate', 'hr.ld.approve', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.manage', 'hr.succession.nominate', 'hr.succession.assess', 'hr.succession.approve', 'hr.succession.report',
        'academic.leave.coverage.manage',
    ],
    PRINCIPAL: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.leave.view', 'hr.leave.approve', 'hr.attendance.view',
        'hr.report.view', 'hr.management.view', 'academic.leave.coverage.manage',
        'hr.fnf.view',
        'hr.performance.view', 'hr.performance.report',
        'hr.recruitment.view', 'hr.recruitment.approve', 'hr.recruitment.report',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate', 'hr.analytics.export',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.approve', 'hr.succession.report',
    ],
    // Executive leadership: read-only strategic visibility. No manage/approve/
    // finalize/calculate/lock, and no hr.analytics.payroll.detail (individual
    // salaries stay highly-restricted). Source-of-truth invariant safe.
    MANAGEMENT: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.attendance.view', 'hr.leave.view',
        'hr.report.view', 'hr.management.view',
        'hr.fnf.view',
        'hr.performance.view', 'hr.performance.report',
        'hr.recruitment.view', 'hr.recruitment.report',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.report',
    ],
    HR_MANAGER: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.employee.manage', 'hr.employee.onboard', 'hr.employee.transfer',
        'hr.employee.promote', 'hr.employee.separate', 'hr.attendance.view', 'hr.attendance.manage',
        'hr.attendance.adjust', 'hr.leave.view', 'hr.leave.approve', 'hr.leave.override',
        'hr.leave.balance.adjust', 'hr.payroll.view', 'hr.payroll.manage', 'hr.payroll.calculate',
        'hr.payroll.approve', 'hr.payroll.lock',
        'hr.fnf.view', 'hr.fnf.manage', 'hr.fnf.calculate', 'hr.fnf.approve', 'hr.fnf.post',
        'hr.fnf.override', 'hr.fnf.document.release', 'hr.fnf.reopen',
        'hr.performance.view', 'hr.performance.manage', 'hr.performance.calibrate',
        'hr.performance.finalize', 'hr.performance.reopen', 'hr.performance.report',
        'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.approve',
        'hr.recruitment.offer', 'hr.recruitment.join', 'hr.recruitment.report',
        'hr.document.view', 'hr.document.manage',
        'hr.config.manage', 'hr.report.view',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate', 'hr.analytics.payroll.detail', 'hr.analytics.export',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.manage', 'hr.ld.nominate', 'hr.ld.approve', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.manage', 'hr.succession.nominate', 'hr.succession.assess', 'hr.succession.approve', 'hr.succession.report',
    ],
    HR_EXECUTIVE: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.employee.manage', 'hr.employee.onboard', 'hr.attendance.view',
        'hr.attendance.manage', 'hr.leave.view', 'hr.leave.approve', 'hr.document.view',
        'hr.document.manage', 'hr.report.view',
        'hr.fnf.view', 'hr.fnf.manage', 'hr.fnf.calculate',
        'hr.performance.view', 'hr.performance.manage',
        'hr.recruitment.view', 'hr.recruitment.manage', 'hr.recruitment.offer',
        'hr.analytics.view', 'hr.analytics.export',
        'hr.ld.self', 'hr.ld.view', 'hr.ld.manage', 'hr.ld.nominate', 'hr.ld.approve', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.manage', 'hr.succession.nominate', 'hr.succession.assess', 'hr.succession.report',
    ],
    PAYROLL_OFFICER: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.attendance.view', 'hr.payroll.view', 'hr.payroll.manage',
        'hr.payroll.calculate', 'hr.payroll.approve', 'hr.payroll.lock', 'hr.report.view',
        'hr.analytics.view', 'hr.analytics.payroll.aggregate', 'hr.analytics.payroll.detail', 'hr.analytics.export',
        'hr.ld.self',
    ],
    HOD: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.leave.view', 'hr.leave.approve', 'hr.attendance.view',
        'academic.leave.coverage.manage',
        'hr.fnf.clearance.department',
        'hr.performance.view',
        'hr.recruitment.view',
        'hr.analytics.view',
        'hr.ld.self', 'hr.ld.nominate', 'hr.ld.approve', 'hr.ld.report',
        'hr.succession.self', 'hr.succession.view', 'hr.succession.nominate', 'hr.succession.assess', 'hr.succession.report',
    ],
    REPORTING_MANAGER: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.employee.view', 'hr.leave.view', 'hr.leave.approve', 'hr.attendance.view',
        'hr.performance.view',
        'hr.ld.self', 'hr.ld.nominate', 'hr.ld.approve',
        'hr.succession.self', 'hr.succession.nominate', 'hr.succession.assess',
    ],
    FACULTY: [
        'hr.self.view', 'hr.self.leave.apply', 'hr.self.attendance.view', 'hr.self.payslip.view',
        'hr.ld.self',
        'hr.succession.self',
    ],
};
export function hrPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_HR_PERMISSIONS.SUPER_ADMIN;
    if (role === 'CHAIRMAN')
        return ROLE_HR_PERMISSIONS.MANAGEMENT;
    return ROLE_HR_PERMISSIONS[role] ?? ROLE_HR_PERMISSIONS.FACULTY;
}
export function hasHrPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    const roles = [actor.role, ...(actor.leadershipRoles ?? [])];
    return roles.some((role) => hrPermissionsForRole(role).includes(permission));
}
export function assertHrPermission(actor, permission) {
    if (!hasHrPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this HR action');
    }
}
export async function assertHrCollege(table, id, collegeId) {
    const row = await db(table).where({ id }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    if (Number(row.college_id) !== collegeId)
        throw new AppError(404, 'Record not found');
    return row;
}
export async function resolveEmployeeForActor(actor) {
    if (!(await db.schema.hasTable('employees')))
        return null;
    const row = await db('employees')
        .where({ faculty_user_id: actor.facultyUserId, college_id: actor.collegeId })
        .first();
    return row ? { id: Number(row.id), ...row } : null;
}
export async function requireEmployeeForActor(actor) {
    const emp = await resolveEmployeeForActor(actor);
    if (!emp)
        throw new AppError(404, 'No employee record linked to your account');
    return emp;
}
export async function assertEmployeeSelfOrPermission(actor, targetEmployeeId, permission) {
    const self = await resolveEmployeeForActor(actor);
    if (self && Number(self.id) === targetEmployeeId)
        return;
    assertHrPermission(actor, permission);
    await assertHrCollege('employees', targetEmployeeId, actor.collegeId);
}
export async function assertManagerScope(actor, targetEmployeeId) {
    if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.employee.manage'))
        return;
    const self = await resolveEmployeeForActor(actor);
    if (!self)
        throw new AppError(403, 'Manager scope denied');
    const target = await db('employees').where({ id: targetEmployeeId, college_id: actor.collegeId }).first();
    if (!target)
        throw new AppError(404, 'Employee not found');
    if (Number(target.reporting_manager_employee_id) === Number(self.id))
        return;
    const hodDepartments = actor.hodDepartmentIds?.length
        ? actor.hodDepartmentIds
        : actor.role === 'HOD' && actor.departmentId
            ? [actor.departmentId]
            : [];
    const isHod = actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD');
    if (isHod && hodDepartments.includes(Number(target.department_id)))
        return;
    throw new AppError(403, 'Employee is outside your management scope');
}
export async function getEmployeeReportingChain(employeeId) {
    const chain = [];
    let currentId = employeeId;
    const seen = new Set();
    while (currentId && !seen.has(currentId)) {
        seen.add(currentId);
        const row = await db('employees')
            .where({ id: currentId })
            .select('reporting_manager_employee_id')
            .first();
        if (!row?.reporting_manager_employee_id)
            break;
        const managerId = Number(row.reporting_manager_employee_id);
        chain.push(managerId);
        currentId = managerId;
    }
    return chain;
}
