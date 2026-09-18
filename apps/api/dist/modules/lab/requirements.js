import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertLabPermission, assertLabAccess, scopedLabIds, actorLabAssignmentRoles, hodDepartmentIds, isPrincipal, loadLab } from './access.js';
import { auditFromActor } from './audit.js';
function shape(row) {
    return {
        id: Number(row.id), labId: Number(row.lab_id), labName: row.lab_name ?? null,
        departmentId: row.department_id ? Number(row.department_id) : null,
        requestType: row.request_type, item: row.item, quantity: Number(row.quantity),
        reason: row.reason ?? null, academicJustification: row.academic_justification ?? null,
        priority: row.priority, estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
        semester: row.semester ?? null, studentStrength: row.student_strength != null ? Number(row.student_strength) : null,
        currentStock: row.current_stock != null ? Number(row.current_stock) : null,
        shortfall: row.shortfall != null ? Number(row.shortfall) : null,
        status: row.status, requestedBy: row.requested_by ? Number(row.requested_by) : null,
        requesterName: row.requester_name ?? null,
        purchaseRef: row.purchase_ref ?? null, remarks: row.remarks ?? null, createdAt: row.created_at,
    };
}
const reqQuery = (collegeId) => db('lab_requirements as r')
    .leftJoin('labs as l', 'l.id', 'r.lab_id')
    .leftJoin('faculty_users as f', 'f.id', 'r.requested_by')
    .where('r.college_id', collegeId)
    .select('r.*', 'l.name as lab_name', 'f.name as requester_name');
export async function listRequirements(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let q = reqQuery(actor.collegeId).orderBy('r.created_at', 'desc');
    if (ids !== 'ALL')
        q = q.whereIn('r.lab_id', ids);
    if (filters.labId)
        q = q.where('r.lab_id', filters.labId);
    if (filters.status)
        q = q.where('r.status', filters.status);
    if (filters.departmentId)
        q = q.where('r.department_id', filters.departmentId);
    return (await q).map(shape);
}
export async function createRequirement(actor, input) {
    assertLabPermission(actor, 'lab.requirement.create');
    const lab = await assertLabAccess(actor, input.labId, 'operate');
    const qty = Number(input.quantity ?? 1);
    const current = input.currentStock != null ? Number(input.currentStock) : null;
    const shortfall = current != null ? Math.max(0, qty - current) : null;
    const [id] = await db('lab_requirements').insert({
        college_id: actor.collegeId, lab_id: input.labId, department_id: lab.department_id ?? null,
        request_type: input.requestType, item: input.item, quantity: qty, reason: input.reason ?? null,
        academic_justification: input.academicJustification ?? null, priority: input.priority ?? 'NORMAL',
        estimated_cost: input.estimatedCost ?? null, course_id: input.courseId ?? null,
        semester: input.semester ?? null, student_strength: input.studentStrength ?? null,
        current_stock: current, shortfall, status: 'SUBMITTED', requested_by: actor.facultyUserId,
    });
    await auditFromActor(actor, 'REQUIREMENT_CREATE', 'lab_requirement', Number(id), { after: input });
    return shape((await reqQuery(actor.collegeId).where('r.id', Number(id)).first()));
}
/**
 * Advance the approval chain. Which transition is allowed depends on the
 * actor's role and the current status:
 *   SUBMITTED         → INCHARGE_APPROVED   (Lab In-charge / admin)
 *   INCHARGE_APPROVED → HOD_APPROVED        (HOD of the lab's department / admin)
 *   HOD_APPROVED      → PRINCIPAL_APPROVED  (Principal / admin)
 *   PRINCIPAL_APPROVED→ FULFILLED           (admin — Stores/Purchase handoff)
 * REJECT is allowed by any approver in the chain. FULFILL records purchase_ref.
 */
export async function decideRequirement(actor, id, input) {
    assertLabPermission(actor, 'lab.requirement.approve');
    const req = await db('lab_requirements').where({ id, college_id: actor.collegeId }).first();
    if (!req)
        throw new AppError(404, 'Requirement not found');
    const lab = await loadLab(Number(req.lab_id), actor.collegeId);
    const admin = isAdminRole(actor.role);
    const status = String(req.status);
    const isIncharge = admin || (actor.role === 'FACULTY' && (await actorLabAssignmentRoles(actor, Number(req.lab_id))).includes('LAB_INCHARGE'));
    const isHod = admin || (actor.role === 'HOD' && lab.department_id != null && (await hodDepartmentIds(actor)).includes(Number(lab.department_id)));
    const isPrin = admin || (await isPrincipal(actor));
    if (input.decision === 'REJECT') {
        if (!(isIncharge || isHod || isPrin))
            throw new AppError(403, 'You cannot reject this requirement');
        await db('lab_requirements').where({ id }).update({ status: 'REJECTED', remarks: input.remarks ?? req.remarks, updated_at: db.fn.now() });
        await auditFromActor(actor, 'REQUIREMENT_REJECT', 'lab_requirement', id, { before: req, reason: input.remarks ?? null });
        return shape((await reqQuery(actor.collegeId).where('r.id', id).first()));
    }
    if (input.decision === 'FULFILL') {
        if (!admin)
            throw new AppError(403, 'Only Stores/Admin can mark a requirement fulfilled');
        if (status !== 'PRINCIPAL_APPROVED' && status !== 'HOD_APPROVED')
            throw new AppError(400, 'Requirement is not fully approved yet');
        await db('lab_requirements').where({ id }).update({ status: 'FULFILLED', purchase_ref: input.purchaseRef ?? null, remarks: input.remarks ?? req.remarks, updated_at: db.fn.now() });
        await auditFromActor(actor, 'REQUIREMENT_FULFILL', 'lab_requirement', id, { before: req, after: { purchaseRef: input.purchaseRef } });
        return shape((await reqQuery(actor.collegeId).where('r.id', id).first()));
    }
    // APPROVE — role must match the current stage.
    let next = null;
    const patch = { updated_at: db.fn.now() };
    if (status === 'SUBMITTED' && isIncharge) {
        next = 'INCHARGE_APPROVED';
        patch.incharge_by = actor.facultyUserId;
    }
    else if (status === 'INCHARGE_APPROVED' && isHod) {
        next = 'HOD_APPROVED';
        patch.hod_by = actor.facultyUserId;
    }
    else if (status === 'HOD_APPROVED' && isPrin) {
        next = 'PRINCIPAL_APPROVED';
        patch.principal_by = actor.facultyUserId;
    }
    else if (status === 'SUBMITTED' && isHod && !isIncharge) {
        // Labs without an In-charge: HOD approval subsumes the first stage.
        const hasIncharge = await db('lab_assignments').where({ college_id: actor.collegeId, lab_id: Number(req.lab_id), assignment_role: 'LAB_INCHARGE', status: 'ACTIVE' }).first();
        if (!hasIncharge) {
            next = 'HOD_APPROVED';
            patch.incharge_by = actor.facultyUserId;
            patch.hod_by = actor.facultyUserId;
        }
    }
    if (!next)
        throw new AppError(403, `You cannot approve a requirement in ${status} state`);
    patch.status = next;
    if (input.remarks)
        patch.remarks = input.remarks;
    await db('lab_requirements').where({ id }).update(patch);
    await auditFromActor(actor, 'REQUIREMENT_APPROVE', 'lab_requirement', id, { before: req, after: patch });
    return shape((await reqQuery(actor.collegeId).where('r.id', id).first()));
}
