import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { recordPlacementAudit } from './audit.js';
import { asDateOnly, rangesOverlap } from '../academicLeadership/types.js';
import { todayISO } from '../academicLeadership/leadership.js';
export const TP_ROLES = ['T&P_OFFICER', 'T&P_COORDINATOR', 'DEPARTMENT_TP_COORDINATOR'];
export async function tpAssignmentSchemaReady() {
    try {
        return await db.schema.hasTable('tp_leadership_assignments');
    }
    catch {
        return false;
    }
}
function serialize(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        employeeId: Number(row.employee_id),
        role: String(row.tp_role),
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        effectiveFrom: asDateOnly(row.effective_from),
        effectiveTo: row.effective_to ? asDateOnly(row.effective_to) : null,
        status: String(row.status),
        remarks: row.remarks ?? null,
        employeeName: row.employee_name ?? null,
        employeeNumber: row.employee_number ?? null,
        departmentName: row.department_name ?? null,
        facultyUserId: row.faculty_user_id != null ? Number(row.faculty_user_id) : null,
    };
}
function assignmentQuery() {
    return db('tp_leadership_assignments as a')
        .leftJoin('employees as e', 'e.id', 'a.employee_id')
        .leftJoin('departments as d', 'd.id', 'a.department_id')
        .select('a.*', 'e.display_name as employee_name', 'e.employee_number as employee_number', 'e.faculty_user_id as faculty_user_id', 'd.name as department_name');
}
export async function listTpAssignments(collegeId, filters) {
    if (!(await tpAssignmentSchemaReady()))
        return [];
    let q = assignmentQuery().where('a.college_id', collegeId);
    if (filters?.role)
        q = q.andWhere('a.tp_role', filters.role);
    if (filters?.departmentId != null)
        q = q.andWhere('a.department_id', filters.departmentId);
    if (filters?.status)
        q = q.andWhere('a.status', filters.status);
    const rows = await q.orderBy('a.effective_from', 'desc');
    return rows.map((r) => serialize(r));
}
async function findOverlaps(params) {
    let q = params.trx('tp_leadership_assignments')
        .where({ college_id: params.collegeId, tp_role: params.role, status: 'ACTIVE' })
        .forUpdate();
    if (params.role === 'DEPARTMENT_TP_COORDINATOR') {
        q = q.andWhere('department_id', params.departmentId);
    }
    else if (params.role === 'T&P_OFFICER') {
        q = q.whereNull('department_id');
    }
    if (params.excludeId)
        q = q.andWhereNot('id', params.excludeId);
    const rows = await q;
    return rows.filter((row) => rangesOverlap(asDateOnly(row.effective_from), row.effective_to ? asDateOnly(row.effective_to) : null, params.effectiveFrom, params.effectiveTo));
}
export async function createTpAssignment(actor, input) {
    if (!(await tpAssignmentSchemaReady()))
        throw new AppError(503, 'T&P assignment schema is not ready');
    if (!isAdminRole(actor.role)) {
        throw new AppError(403, 'Only college administrators can assign T&P leadership');
    }
    if (!TP_ROLES.includes(input.role))
        throw new AppError(400, 'Invalid T&P role');
    if (input.role === 'DEPARTMENT_TP_COORDINATOR' && !input.departmentId) {
        throw new AppError(400, 'Department T&P Coordinator requires a department', undefined, 'DEPT_TP_REQUIRED');
    }
    if (input.role === 'T&P_OFFICER' && input.departmentId) {
        throw new AppError(400, 'T&P Officer is college-scoped', undefined, 'OFFICER_DEPARTMENT_FORBIDDEN');
    }
    if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
        throw new AppError(400, 'effectiveTo cannot be before effectiveFrom');
    }
    const emp = await db('employees').where({ id: input.employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    if (!['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'].includes(String(emp.employment_status))) {
        throw new AppError(400, 'Employee is not in an active employment status for T&P assignment');
    }
    if (input.departmentId) {
        const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
        if (!dept)
            throw new AppError(404, 'Department not found');
    }
    const created = await db.transaction(async (trx) => {
        if (input.role === 'DEPARTMENT_TP_COORDINATOR' && input.departmentId) {
            await trx('departments').where({ id: input.departmentId }).forUpdate().first();
        }
        else if (input.role === 'T&P_OFFICER') {
            await trx('colleges').where({ id: actor.collegeId }).forUpdate().first();
        }
        if (input.role === 'T&P_OFFICER' || input.role === 'DEPARTMENT_TP_COORDINATOR') {
            const overlaps = await findOverlaps({
                trx,
                collegeId: actor.collegeId,
                role: input.role,
                departmentId: input.role === 'DEPARTMENT_TP_COORDINATOR' ? input.departmentId : null,
                effectiveFrom: input.effectiveFrom,
                effectiveTo: input.effectiveTo ?? null,
            });
            if (overlaps.length) {
                throw new AppError(409, input.role === 'T&P_OFFICER'
                    ? 'An active T&P Officer already exists for this college in the overlapping date range'
                    : 'An active Department T&P Coordinator already exists for this department in the overlapping date range', { overlappingIds: overlaps.map((r) => Number(r.id)) }, 'DUPLICATE_ACTIVE_TP_ASSIGNMENT');
            }
        }
        const [id] = await trx('tp_leadership_assignments').insert({
            college_id: actor.collegeId,
            employee_id: input.employeeId,
            tp_role: input.role,
            department_id: input.role === 'DEPARTMENT_TP_COORDINATOR' ? input.departmentId : input.departmentId ?? null,
            effective_from: input.effectiveFrom,
            effective_to: input.effectiveTo ?? null,
            status: 'ACTIVE',
            created_by: actor.facultyUserId,
            updated_by: actor.facultyUserId,
            remarks: input.remarks ?? null,
        });
        return Number(id);
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'TP_ASSIGNMENT_CREATED',
        entityType: 'tp_leadership_assignments',
        entityId: created,
        afterState: input,
    });
    const row = await assignmentQuery().where({ 'a.id': created }).first();
    return serialize(row);
}
export async function updateTpAssignment(actor, assignmentId, input) {
    if (!(await tpAssignmentSchemaReady()))
        throw new AppError(503, 'T&P assignment schema is not ready');
    if (!isAdminRole(actor.role)) {
        throw new AppError(403, 'Only college administrators can change T&P assignments');
    }
    const existing = await db('tp_leadership_assignments')
        .where({ id: assignmentId, college_id: actor.collegeId })
        .first();
    if (!existing)
        throw new AppError(404, 'T&P assignment not found');
    const nextTo = input.effectiveTo !== undefined
        ? input.effectiveTo
        : (existing.effective_to ? asDateOnly(existing.effective_to) : null);
    const nextStatus = input.status ?? String(existing.status);
    await db.transaction(async (trx) => {
        const locked = await trx('tp_leadership_assignments').where({ id: assignmentId }).forUpdate().first();
        if (!locked)
            throw new AppError(404, 'T&P assignment not found');
        await trx('tp_leadership_assignments').where({ id: assignmentId }).update({
            effective_to: nextTo,
            status: nextStatus,
            remarks: input.remarks !== undefined ? input.remarks : locked.remarks,
            updated_by: actor.facultyUserId,
            updated_at: trx.fn.now(),
        });
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: nextStatus === 'ACTIVE' ? 'TP_ASSIGNMENT_UPDATED' : 'TP_ASSIGNMENT_ENDED',
        entityType: 'tp_leadership_assignments',
        entityId: assignmentId,
        beforeState: { status: existing.status },
        afterState: { status: nextStatus, effectiveTo: nextTo },
    });
    const row = await assignmentQuery().where({ 'a.id': assignmentId }).first();
    return serialize(row);
}
export async function listActiveTpForFaculty(facultyUserId, collegeId, asOf = todayISO()) {
    if (!(await tpAssignmentSchemaReady()))
        return [];
    const emp = await db('employees').where({ faculty_user_id: facultyUserId, college_id: collegeId }).first();
    if (!emp)
        return [];
    const rows = await db('tp_leadership_assignments')
        .where({ employee_id: emp.id, college_id: collegeId, status: 'ACTIVE' })
        .andWhere('effective_from', '<=', asOf)
        .andWhere((q) => {
        q.whereNull('effective_to').orWhere('effective_to', '>=', asOf);
    });
    return rows.map((r) => serialize(r));
}
