import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
export function decideLessonPlanAccess(actor, plan) {
    if (isSuperAdmin(actor.role))
        return 'ALLOW';
    if (plan.collegeId !== actor.collegeId)
        return 'NOT_FOUND';
    if (isAdminRole(actor.role))
        return 'ALLOW';
    if (plan.createdBy === actor.facultyUserId)
        return 'ALLOW';
    return 'FORBIDDEN';
}
export function canManageAllLessonPlans(role) {
    return isAdminRole(role);
}
async function loadPlanOwnership(planId) {
    const row = await db('faculty_lesson_plans')
        .where({ id: planId })
        .select('college_id as collegeId', 'created_by as createdBy')
        .first();
    if (!row)
        return null;
    return { collegeId: Number(row.collegeId), createdBy: Number(row.createdBy) };
}
export async function assertLessonPlanAccess(planId, actor) {
    if (!Number.isFinite(planId))
        throw new AppError(404, 'Lesson plan not found');
    const plan = await loadPlanOwnership(planId);
    if (!plan)
        throw new AppError(404, 'Lesson plan not found');
    const decision = decideLessonPlanAccess(actor, plan);
    if (decision === 'ALLOW')
        return plan;
    if (decision === 'NOT_FOUND')
        throw new AppError(404, 'Lesson plan not found');
    throw new AppError(403, "You don't have access to this lesson plan.", undefined, 'LESSON_PLAN_FORBIDDEN');
}
