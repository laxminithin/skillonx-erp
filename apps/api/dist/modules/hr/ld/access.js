/**
 * Employee L&D — scoping & eligibility helpers. Reuses canonical HR access
 * primitives; never introduces a second employee master.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { isAdminRole } from '../../../utils/permissions.js';
import { hasHrPermission, assertHrPermission, resolveEmployeeForActor } from '../access.js';
/** The actor's own employee record (or throw). */
export async function requireSelfEmployee(actor) {
    const emp = await resolveEmployeeForActor(actor);
    if (!emp)
        throw new AppError(404, 'No employee record linked to your account');
    return emp;
}
export async function selfEmployee(actor) {
    const emp = await resolveEmployeeForActor(actor);
    return emp ?? null;
}
/** Load an employee inside the actor's college, or 404 (tenant isolation). */
export async function employeeInCollege(actor, employeeId) {
    const row = await db('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Employee not found');
    return row;
}
/** Load a program inside the actor's college, or 404. */
export async function programInCollege(actor, programId) {
    const row = await db('ld_programs').where({ id: programId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Program not found');
    return row;
}
export async function ldRowInCollege(actor, table, id) {
    const row = await db(table).where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    return row;
}
export function isSelf(self, employeeId) {
    return !!self && Number(self.id) === Number(employeeId);
}
/** True when the actor manages the target employee (HR-wide, HOD dept, or reporting manager). */
export async function managesEmployee(actor, target) {
    if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.ld.manage') || hasHrPermission(actor, 'hr.employee.manage'))
        return true;
    const self = await resolveEmployeeForActor(actor);
    if (self && Number(target.reporting_manager_employee_id) === Number(self.id))
        return true;
    const hodDepts = actor.hodDepartmentIds?.length
        ? actor.hodDepartmentIds
        : actor.role === 'HOD' && actor.departmentId
            ? [actor.departmentId]
            : [];
    const isHod = actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD');
    if (isHod && target.department_id != null && hodDepts.map(Number).includes(Number(target.department_id)))
        return true;
    return false;
}
/** Assert the actor may nominate/act on the target employee (used by nomination/approval/reviews). */
export async function assertManagesEmployee(actor, target) {
    if (!(await managesEmployee(actor, target))) {
        throw new AppError(403, 'Employee is outside your L&D scope');
    }
}
/** Trainer scope: assigned as program trainer or a session trainer, or an L&D admin. */
export async function assertTrainerForProgram(actor, program) {
    if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.ld.manage'))
        return;
    const self = await resolveEmployeeForActor(actor);
    if (self && Number(program.trainer_employee_id) === Number(self.id))
        return;
    if (self) {
        const session = await db('ld_program_sessions')
            .where({ program_id: program.id, trainer_employee_id: self.id })
            .first();
        if (session)
            return;
    }
    throw new AppError(403, 'You are not assigned to this program');
}
/** Applicability check against canonical employee attributes. */
export function isApplicable(program, emp) {
    const type = String(program.applicability_type ?? 'ALL');
    if (type === 'ALL')
        return true;
    const ref = parseJson(program.applicability_ref);
    switch (type) {
        case 'FACULTY':
            return emp.employee_category === 'FACULTY';
        case 'NON_FACULTY':
            return emp.employee_category !== 'FACULTY';
        case 'DEPARTMENT':
            return !!ref?.departmentIds?.map(Number).includes(Number(emp.department_id));
        case 'DESIGNATION':
            return !!ref?.designationIds?.map(Number).includes(Number(emp.designation_id));
        case 'EMPLOYMENT_TYPE':
            return !!ref?.employmentTypeIds?.map(Number).includes(Number(emp.employment_type_id));
        case 'SPECIFIC':
            return !!ref?.employeeIds?.map(Number).includes(Number(emp.id));
        default:
            return false;
    }
}
export function parseJson(v) {
    if (v == null)
        return null;
    if (typeof v === 'object')
        return v;
    try {
        return JSON.parse(String(v));
    }
    catch {
        return null;
    }
}
/** Departments the actor may see for L&D reporting (null = college-wide). */
export function ldReportScope(actor) {
    if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.ld.manage') || hasHrPermission(actor, 'hr.ld.view'))
        return null;
    const depts = actor.hodDepartmentIds?.length ? actor.hodDepartmentIds : actor.departmentId ? [actor.departmentId] : [];
    return [...new Set(depts.map(Number))];
}
export { assertHrPermission, hasHrPermission };
