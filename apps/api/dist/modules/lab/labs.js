import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, scopedLabIds, loadLab, hodDepartmentIds, } from './access.js';
import { isAdminRole } from '../../utils/permissions.js';
import { auditFromActor } from './audit.js';
function shapeLab(row) {
    return {
        id: Number(row.id),
        name: row.name,
        code: row.code,
        departmentId: row.department_id ? Number(row.department_id) : null,
        departmentName: row.department_name ?? null,
        roomId: row.room_id ? Number(row.room_id) : null,
        roomName: row.room_name ?? null,
        building: row.building ?? null,
        labType: row.lab_type,
        capacity: row.capacity ? Number(row.capacity) : null,
        status: row.status,
        description: row.description ?? null,
    };
}
export async function listLabs(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let q = db('labs as l')
        .leftJoin('departments as d', 'd.id', 'l.department_id')
        .leftJoin('rooms as r', 'r.id', 'l.room_id')
        .where('l.college_id', actor.collegeId)
        .select('l.*', 'd.name as department_name', 'r.name as room_name', 'r.building as building')
        .orderBy('l.name');
    if (ids !== 'ALL')
        q = q.whereIn('l.id', ids);
    if (filters.status)
        q = q.where('l.status', filters.status);
    if (filters.departmentId)
        q = q.where('l.department_id', filters.departmentId);
    if (filters.q)
        q = q.where((b) => b.whereILike('l.name', `%${filters.q}%`).orWhereILike('l.code', `%${filters.q}%`));
    const rows = await q;
    return rows.map(shapeLab);
}
export async function getLab(actor, labId) {
    assertLabPermission(actor, 'lab.view');
    const row = await db('labs as l')
        .leftJoin('departments as d', 'd.id', 'l.department_id')
        .leftJoin('rooms as r', 'r.id', 'l.room_id')
        .where('l.id', labId)
        .where('l.college_id', actor.collegeId)
        .select('l.*', 'd.name as department_name', 'r.name as room_name', 'r.building as building')
        .first();
    if (!row)
        throw new AppError(404, 'Lab not found');
    const assignments = await listAssignments(actor, labId);
    return { ...shapeLab(row), assignments };
}
export async function createLab(actor, input) {
    assertLabPermission(actor, 'lab.master.manage');
    const dupe = await db('labs').where({ college_id: actor.collegeId, code: input.code }).first();
    if (dupe)
        throw new AppError(409, 'A lab with this code already exists');
    if (input.roomId) {
        const room = await db('rooms').where({ id: input.roomId, college_id: actor.collegeId }).first();
        if (!room)
            throw new AppError(400, 'Room not found in this college');
    }
    if (input.departmentId) {
        const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
        if (!dept)
            throw new AppError(400, 'Department not found in this college');
    }
    const [id] = await db('labs').insert({
        college_id: actor.collegeId,
        department_id: input.departmentId ?? null,
        room_id: input.roomId ?? null,
        name: input.name,
        code: input.code,
        lab_type: input.labType ?? 'GENERAL',
        capacity: input.capacity ?? null,
        status: input.status ?? 'ACTIVE',
        description: input.description ?? null,
        created_by: actor.facultyUserId,
    });
    await auditFromActor(actor, 'LAB_CREATE', 'lab', Number(id), { after: input });
    return getLab(actor, Number(id));
}
export async function updateLab(actor, labId, input) {
    assertLabPermission(actor, 'lab.master.manage');
    const before = await loadLab(labId, actor.collegeId);
    const patch = {};
    if (input.name !== undefined)
        patch.name = input.name;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.roomId !== undefined)
        patch.room_id = input.roomId;
    if (input.labType !== undefined)
        patch.lab_type = input.labType;
    if (input.capacity !== undefined)
        patch.capacity = input.capacity;
    if (input.status !== undefined)
        patch.status = input.status;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.code !== undefined && input.code !== before.code) {
        const dupe = await db('labs').where({ college_id: actor.collegeId, code: input.code }).whereNot({ id: labId }).first();
        if (dupe)
            throw new AppError(409, 'A lab with this code already exists');
        patch.code = input.code;
    }
    if (Object.keys(patch).length > 0) {
        patch.updated_at = db.fn.now();
        await db('labs').where({ id: labId }).update(patch);
    }
    await auditFromActor(actor, 'LAB_UPDATE', 'lab', labId, { before, after: patch });
    return getLab(actor, labId);
}
// ── Assignments (history preserving) ─────────────────────────────────────
export async function listAssignments(actor, labId, includeEnded = false) {
    let q = db('lab_assignments as a')
        .join('faculty_users as f', 'f.id', 'a.faculty_id')
        .where('a.college_id', actor.collegeId)
        .where('a.lab_id', labId)
        .select('a.*', 'f.name as faculty_name', 'f.email as faculty_email', 'f.designation as faculty_designation')
        .orderBy([{ column: 'a.status', order: 'asc' }, { column: 'a.created_at', order: 'desc' }]);
    if (!includeEnded)
        q = q.where('a.status', 'ACTIVE');
    const rows = await q;
    return rows.map((r) => ({
        id: Number(r.id),
        facultyId: Number(r.faculty_id),
        facultyName: r.faculty_name,
        facultyEmail: r.faculty_email,
        designation: r.faculty_designation,
        assignmentRole: r.assignment_role,
        isPrimary: Boolean(r.is_primary),
        status: r.status,
        effectiveFrom: r.effective_from,
        effectiveTo: r.effective_to,
    }));
}
export async function assignLab(actor, labId, input) {
    assertLabPermission(actor, 'lab.assignment.manage');
    const lab = await loadLab(labId, actor.collegeId);
    // HOD can only manage assignments within labs of their department.
    if (actor.role === 'HOD' && !isAdminRole(actor.role)) {
        const depts = await hodDepartmentIds(actor);
        if (!lab.department_id || !depts.includes(Number(lab.department_id))) {
            throw new AppError(403, 'This lab is outside your department');
        }
    }
    const faculty = await db('faculty_users').where({ id: input.facultyId, college_id: actor.collegeId, is_active: true }).first();
    if (!faculty)
        throw new AppError(400, 'Faculty not found in this college');
    // End any existing active assignment of the same role for idempotence + history.
    const existing = await db('lab_assignments')
        .where({ college_id: actor.collegeId, lab_id: labId, faculty_id: input.facultyId, assignment_role: input.assignmentRole, status: 'ACTIVE' })
        .first();
    if (existing)
        return { id: Number(existing.id), unchanged: true };
    if (input.isPrimary) {
        await db('lab_assignments')
            .where({ college_id: actor.collegeId, lab_id: labId, assignment_role: input.assignmentRole, status: 'ACTIVE' })
            .update({ is_primary: false });
    }
    const [id] = await db('lab_assignments').insert({
        college_id: actor.collegeId,
        lab_id: labId,
        faculty_id: input.facultyId,
        assignment_role: input.assignmentRole,
        is_primary: input.isPrimary ?? true,
        status: 'ACTIVE',
        effective_from: db.fn.now(),
        assigned_by: actor.facultyUserId,
        remarks: input.remarks ?? null,
    });
    await auditFromActor(actor, 'LAB_ASSIGN', 'lab_assignment', Number(id), { after: { labId, ...input } });
    return { id: Number(id), unchanged: false };
}
export async function endAssignment(actor, assignmentId) {
    assertLabPermission(actor, 'lab.assignment.manage');
    const row = await db('lab_assignments').where({ id: assignmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Assignment not found');
    if (actor.role === 'HOD' && !isAdminRole(actor.role)) {
        const lab = await loadLab(Number(row.lab_id), actor.collegeId);
        const depts = await hodDepartmentIds(actor);
        if (!lab.department_id || !depts.includes(Number(lab.department_id))) {
            throw new AppError(403, 'This lab is outside your department');
        }
    }
    await db('lab_assignments').where({ id: assignmentId }).update({ status: 'ENDED', effective_to: db.fn.now(), updated_at: db.fn.now() });
    await auditFromActor(actor, 'LAB_ASSIGN_END', 'lab_assignment', assignmentId, { before: row });
    return { ok: true };
}
/** Rooms of type LAB available in this college for lab master creation. */
export async function listLabRooms(actor) {
    assertLabPermission(actor, 'lab.view');
    const rows = await db('rooms')
        .where({ college_id: actor.collegeId })
        .where(function () { this.where('type', 'LAB').orWhere('type', 'CLASSROOM'); })
        .select('id', 'name', 'code', 'building', 'type', 'capacity')
        .orderBy('name');
    return rows.map((r) => ({ id: Number(r.id), name: r.name, code: r.code, building: r.building, type: r.type, capacity: r.capacity ? Number(r.capacity) : null }));
}
