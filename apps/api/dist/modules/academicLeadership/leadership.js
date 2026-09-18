import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { resolveEmployeeForActor } from '../hr/access.js';
import { FACULTY_CAPABILITIES, HOD_CAPABILITIES, PRINCIPAL_CAPABILITIES, MANAGEMENT_CAPABILITIES, asDateOnly, isEffectiveOn, } from './types.js';
export async function leadershipSchemaReady() {
    try {
        return await db.schema.hasTable('academic_leadership_assignments');
    }
    catch {
        return false;
    }
}
export function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function serializeAssignment(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        employeeId: Number(row.employee_id),
        role: String(row.leadership_role),
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        effectiveFrom: asDateOnly(row.effective_from),
        effectiveTo: row.effective_to ? asDateOnly(row.effective_to) : null,
        status: String(row.status),
        remarks: row.remarks ?? null,
        createdBy: row.created_by != null ? Number(row.created_by) : null,
        updatedBy: row.updated_by != null ? Number(row.updated_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        employeeName: row.employee_name ?? null,
        employeeNumber: row.employee_number ?? null,
        departmentName: row.department_name ?? null,
        departmentCode: row.department_code ?? null,
    };
}
export async function listActiveAssignmentsForEmployee(employeeId, collegeId, asOf = todayISO()) {
    if (!(await leadershipSchemaReady()))
        return [];
    const rows = await db('academic_leadership_assignments as a')
        .leftJoin('employees as e', 'e.id', 'a.employee_id')
        .leftJoin('departments as d', 'd.id', 'a.department_id')
        .where({ 'a.employee_id': employeeId, 'a.college_id': collegeId, 'a.status': 'ACTIVE' })
        .andWhere('a.effective_from', '<=', asOf)
        .andWhere((q) => q.whereNull('a.effective_to').orWhere('a.effective_to', '>=', asOf))
        .select('a.*', 'e.display_name as employee_name', 'e.employee_number as employee_number', 'd.name as department_name', 'd.code as department_code');
    return rows.map(serializeAssignment).filter((a) => isEffectiveOn(a.effectiveFrom, a.effectiveTo, asOf));
}
function unionCapabilities(...lists) {
    return [...new Set(lists.flat())];
}
export async function resolveLeadershipContext(actor, asOf = todayISO()) {
    const emp = actor.employeeId != null
        ? { id: actor.employeeId }
        : await resolveEmployeeForActor(actor);
    const employeeId = emp ? Number(emp.id) : null;
    const assignments = employeeId
        ? await listActiveAssignmentsForEmployee(employeeId, actor.collegeId, asOf)
        : [];
    const roles = [...new Set(assignments.map((a) => a.role))];
    const hodDepartmentIds = [
        ...new Set(assignments.filter((a) => a.role === 'HOD' && a.departmentId != null).map((a) => a.departmentId)),
    ];
    // Legacy faculty_users.role remains valid for already-seeded HOD/Principal accounts.
    if (actor.role === 'HOD' && actor.departmentId && !hodDepartmentIds.includes(actor.departmentId)) {
        hodDepartmentIds.push(actor.departmentId);
        if (!roles.includes('HOD'))
            roles.push('HOD');
    }
    if (actor.role === 'PRINCIPAL' && !roles.includes('PRINCIPAL'))
        roles.push('PRINCIPAL');
    const isHod = roles.includes('HOD');
    const isPrincipal = roles.includes('PRINCIPAL');
    // Executive leadership roles get institution-level VIEW capabilities (no
    // academic approvals) so the Management command center can consume the same
    // canonical academic aggregation as the Principal dashboard.
    const isExecutive = actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN';
    const capabilityLists = [FACULTY_CAPABILITIES];
    if (isHod)
        capabilityLists.push(HOD_CAPABILITIES);
    if (isPrincipal)
        capabilityLists.push(PRINCIPAL_CAPABILITIES);
    if (isExecutive)
        capabilityLists.push(MANAGEMENT_CAPABILITIES);
    return {
        employeeId,
        roles,
        isHod,
        isPrincipal,
        hodDepartmentIds,
        assignments,
        capabilities: unionCapabilities(...capabilityLists),
    };
}
export async function enrichHrActor(actor, asOf) {
    const ctx = await resolveLeadershipContext(actor, asOf);
    return {
        ...actor,
        employeeId: ctx.employeeId,
        leadershipRoles: ctx.roles,
        hodDepartmentIds: ctx.hodDepartmentIds,
    };
}
export function hasAcademicCapability(ctx, capability) {
    return ctx.capabilities.includes(capability);
}
export async function assertLeadershipCapability(actor, capability, asOf) {
    const ctx = await resolveLeadershipContext(actor, asOf);
    const enriched = {
        ...actor,
        employeeId: ctx.employeeId,
        leadershipRoles: ctx.roles,
        hodDepartmentIds: ctx.hodDepartmentIds,
    };
    if (isAdminRole(actor.role))
        return { actor: enriched, ctx };
    if (!hasAcademicCapability(ctx, capability)) {
        throw new AppError(403, 'You do not have permission for this academic leadership action', undefined, 'LEADERSHIP_FORBIDDEN');
    }
    return { actor: enriched, ctx };
}
export function assertDepartmentScope(ctx, departmentId, actorRole) {
    if (isAdminRole(actorRole) || ctx.isPrincipal)
        return;
    if (ctx.isHod && ctx.hodDepartmentIds.includes(departmentId))
        return;
    throw new AppError(403, 'Department is outside your leadership scope', undefined, 'DEPARTMENT_SCOPE');
}
export async function assertCollegeTenant(collegeId, actorCollegeId, actorRole) {
    if (isAdminRole(actorRole) && actorRole === 'SUPER_ADMIN')
        return;
    if (collegeId !== actorCollegeId) {
        throw new AppError(404, 'Record not found', undefined, 'TENANT_MISMATCH');
    }
}
export async function loadDepartmentInCollege(departmentId, collegeId) {
    const dept = await db('departments').where({ id: departmentId, college_id: collegeId }).first();
    if (!dept)
        throw new AppError(404, 'Department not found', undefined, 'DEPARTMENT_SCOPE');
    return dept;
}
export async function serializeMeLeadership(actor) {
    const ctx = await resolveLeadershipContext(actor);
    return {
        isHod: ctx.isHod,
        isPrincipal: ctx.isPrincipal,
        hodDepartmentIds: ctx.hodDepartmentIds,
        roles: ctx.roles,
        capabilities: ctx.capabilities,
        assignments: ctx.assignments,
        employeeId: ctx.employeeId,
    };
}
export { serializeAssignment };
