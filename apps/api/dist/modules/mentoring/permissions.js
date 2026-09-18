import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { resolveLeadershipContext } from '../academicLeadership/leadership.js';
/** Roles allowed to administer mentor allocation (assign / reassign / configure). */
const ALLOCATION_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD'];
export function canAdministerAllocation(actor) {
    return ALLOCATION_ROLES.includes(actor.role);
}
export function assertAllocationPermission(actor) {
    if (!canAdministerAllocation(actor)) {
        throw new AppError(403, 'You are not permitted to administer mentor allocation');
    }
}
/** Whether the acting faculty is the ACTIVE mentor of the given student. */
export async function isMentorOf(actor, studentId) {
    const row = await db('mentor_assignments')
        .where({
        student_id: studentId,
        mentor_faculty_id: actor.facultyUserId,
        college_id: actor.collegeId,
        status: 'ACTIVE',
    })
        .first();
    return !!row;
}
/**
 * Guard for mentor-scoped operations. A faculty member may only act on their
 * own assigned mentees. Admins are permitted for support/administration but are
 * NOT the routine mentoring operator.
 */
export async function assertMentorOf(actor, studentId) {
    // Student must belong to the actor's college first (tenant isolation).
    const student = await db('students')
        .where({ id: studentId, college_id: actor.collegeId })
        .first();
    if (!student)
        throw new AppError(404, 'Student not found');
    if (isAdminRole(actor.role))
        return;
    if (!(await isMentorOf(actor, studentId))) {
        throw new AppError(403, 'This student is not one of your assigned mentees');
    }
}
/** Resolve leadership context (HOD department scope, Principal, Management). */
export async function leadershipContext(actor) {
    return resolveLeadershipContext({
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        role: actor.role,
        departmentId: actor.departmentId ?? null,
    });
}
export function assertHodOrAbove(ctx, actor) {
    if (isAdminRole(actor.role) || ctx.isHod || ctx.isPrincipal || actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN') {
        return;
    }
    throw new AppError(403, 'Department mentoring oversight requires HOD or higher');
}
export function assertPrincipalOrAbove(ctx, actor) {
    if (isAdminRole(actor.role) || ctx.isPrincipal || actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN') {
        return;
    }
    throw new AppError(403, 'Institution mentoring oversight requires Principal or higher');
}
export function assertManagement(actor) {
    if (isAdminRole(actor.role) || actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN')
        return;
    throw new AppError(403, 'Management analytics access required');
}
export function canSeePrivateNarrative(viewer, visibility) {
    if (viewer === 'STUDENT' || viewer === 'AGGREGATE')
        return false;
    if (viewer === 'MENTOR')
        return true; // own mentee record
    // MENTORING_TEAM (authorised HOD / student-support leadership)
    return visibility === 'MENTORING_TEAM';
}
