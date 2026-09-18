import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
export function decideAssignmentAccess(actor, assignment) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (assignment.collegeId !== actor.collegeId)
        return 'NOT_FOUND';
    if (isAdminRole(actor.role))
        return 'ALLOW';
    if (assignment.createdBy === actor.facultyUserId)
        return 'ALLOW';
    return 'FORBIDDEN';
}
export function canManageAllAssignments(role) {
    return isAdminRole(role);
}
async function loadOwnership(assignmentId) {
    const row = await db('assignments')
        .where({ id: assignmentId })
        .whereNull('deleted_at')
        .select('college_id as collegeId', 'created_by as createdBy')
        .first();
    if (!row)
        return null;
    return { collegeId: Number(row.collegeId), createdBy: Number(row.createdBy) };
}
export async function assertAssignmentAccessForActor(assignmentId, actor) {
    if (!Number.isFinite(assignmentId))
        throw new AppError(404, 'Assignment not found');
    const ownership = await loadOwnership(assignmentId);
    if (!ownership)
        throw new AppError(404, 'Assignment not found');
    const decision = decideAssignmentAccess(actor, ownership);
    if (decision === 'ALLOW')
        return ownership;
    if (decision === 'NOT_FOUND')
        throw new AppError(404, 'Assignment not found');
    throw new AppError(403, "You don't have access to this assignment.", undefined, 'ASSIGNMENT_FORBIDDEN');
}
