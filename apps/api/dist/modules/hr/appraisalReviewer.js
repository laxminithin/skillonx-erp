import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { tryResolveLeaveAcademicApprover } from '../academicLeadership/leaveApprover.js';
import { leadershipSchemaReady } from '../academicLeadership/leadership.js';
import { listActivePrincipalEmployees } from '../academicLeadership/assignments.js';
import { assertHrPermission, hasHrPermission, resolveEmployeeForActor } from './access.js';
const ACTIVE_EMPLOYMENT = new Set(['ACTIVE', 'PROBATION', 'ON_NOTICE', 'CONFIRMED']);
async function isEmployeeActive(employeeId, collegeId) {
    const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
    if (!emp)
        return false;
    const status = String(emp.employment_status ?? '');
    if (status === 'INACTIVE' || status === 'SEPARATED' || status === 'TERMINATED' || status === 'RETIRED' || status === 'DRAFT') {
        return false;
    }
    return ACTIVE_EMPLOYMENT.has(status) || !status;
}
async function isActivePrincipal(employeeId, collegeId, asOf) {
    if (await leadershipSchemaReady()) {
        const principals = await listActivePrincipalEmployees(collegeId, asOf);
        if (principals.includes(employeeId))
            return true;
    }
    const emp = await db('employees as e')
        .leftJoin('faculty_users as f', 'f.id', 'e.faculty_user_id')
        .where({ 'e.id': employeeId, 'e.college_id': collegeId })
        .select('f.role')
        .first();
    return String(emp?.role) === 'PRINCIPAL';
}
async function isActiveHod(employeeId, collegeId, asOf) {
    if (await leadershipSchemaReady()) {
        const assigned = await db('academic_leadership_assignments')
            .where({
            employee_id: employeeId,
            college_id: collegeId,
            leadership_role: 'HOD',
            status: 'ACTIVE',
        })
            .andWhere('effective_from', '<=', asOf)
            .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', asOf))
            .first();
        if (assigned)
            return true;
    }
    const emp = await db('employees as e')
        .leftJoin('faculty_users as f', 'f.id', 'e.faculty_user_id')
        .where({ 'e.id': employeeId, 'e.college_id': collegeId })
        .select('f.role')
        .first();
    return String(emp?.role) === 'HOD';
}
/**
 * Resolve appraisal reviewer for an employee as of a cutoff date.
 *
 * Transfer policy: caller should pass cycle.review_cutoff_date ?? cycle.review_end
 * ?? cycle.period_end so department / reporting_manager as of that date is used.
 *
 * Prefer reporting_manager_employee_id when set, active, and not the subject.
 * Else faculty/HOD path via academic leave approver (HOD for faculty, Principal for HOD).
 * Principal: only configured reporting manager; otherwise null (HR must assign).
 * NEVER returns the subject as reviewer.
 */
export async function resolveAppraisalReviewer(employeeId, collegeId, asOfDate) {
    const asOf = String(asOfDate).slice(0, 10);
    const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const mgrId = emp.reporting_manager_employee_id != null ? Number(emp.reporting_manager_employee_id) : null;
    if (mgrId && mgrId !== employeeId && (await isEmployeeActive(mgrId, collegeId))) {
        return { reviewerEmployeeId: mgrId, source: 'REPORTING_MANAGER', asOf };
    }
    const subjectIsPrincipal = await isActivePrincipal(employeeId, collegeId, asOf);
    if (subjectIsPrincipal) {
        // Principal has no academic reviewer above them; HR must assign if no manager.
        return { reviewerEmployeeId: null, source: null, asOf };
    }
    const category = String(emp.employee_category ?? '').toUpperCase();
    const isFacultyPath = category === 'FACULTY' ||
        (await isActiveHod(employeeId, collegeId, asOf)) ||
        emp.faculty_user_id != null;
    if (isFacultyPath) {
        const { approver } = await tryResolveLeaveAcademicApprover(employeeId, collegeId, asOf);
        if (approver && approver.employeeId !== employeeId) {
            return {
                reviewerEmployeeId: approver.employeeId,
                source: approver.role === 'PRINCIPAL' ? 'PRINCIPAL' : 'HOD',
                asOf,
            };
        }
    }
    return { reviewerEmployeeId: null, source: null, asOf };
}
function hodDepartments(actor) {
    if (actor.hodDepartmentIds?.length)
        return actor.hodDepartmentIds.map(Number);
    if (actor.role === 'HOD' && actor.departmentId != null)
        return [Number(actor.departmentId)];
    return [];
}
function isPrincipalActor(actor) {
    return actor.role === 'PRINCIPAL' || (actor.leadershipRoles ?? []).includes('PRINCIPAL');
}
function isHodActor(actor) {
    return actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD');
}
/**
 * Assert actor may submit/edit a review for this appraisal.
 * Blocks self-review. Reviewer match, HR calibrate/manage, or Principal→HOD / HOD dept scope.
 */
export async function assertCanReviewAppraisal(actor, appraisalRow) {
    const subjectId = Number(appraisalRow.employee_id);
    const self = await resolveEmployeeForActor(actor);
    if (self && Number(self.id) === subjectId) {
        throw new AppError(403, 'Self-review is not allowed', undefined, 'APPRAISAL_SELF_REVIEW');
    }
    if (hasHrPermission(actor, 'hr.performance.calibrate') ||
        hasHrPermission(actor, 'hr.performance.manage') ||
        isAdminRole(actor.role)) {
        return;
    }
    const reviewerId = appraisalRow.reviewer_employee_id != null ? Number(appraisalRow.reviewer_employee_id) : null;
    if (self && reviewerId && Number(self.id) === reviewerId) {
        return;
    }
    // Principal may review HOD appraisals in the institution
    if (isPrincipalActor(actor)) {
        const subjectIsHod = await isActiveHod(subjectId, actor.collegeId, String(appraisalRow.reviewer_resolved_as_of ?? new Date().toISOString().slice(0, 10)));
        if (subjectIsHod)
            return;
    }
    // HOD may review only when assigned as reviewer and subject is in own department
    if (isHodActor(actor) && self && reviewerId && Number(self.id) === reviewerId) {
        const depts = hodDepartments(actor);
        const deptId = appraisalRow.department_id != null ? Number(appraisalRow.department_id) : null;
        if (deptId != null && depts.includes(deptId))
            return;
    }
    throw new AppError(403, 'You are not the assigned reviewer for this appraisal');
}
/**
 * Assert actor may view an appraisal.
 * Employee (self), assigned reviewer, HR view, or Principal institution overview.
 */
export async function assertCanViewAppraisal(actor, appraisal, opts) {
    const subjectId = Number(appraisal.employee_id);
    const self = await resolveEmployeeForActor(actor);
    const isOwner = self && Number(self.id) === subjectId;
    const isReviewer = self &&
        appraisal.reviewer_employee_id != null &&
        Number(self.id) === Number(appraisal.reviewer_employee_id);
    const isHr = hasHrPermission(actor, 'hr.performance.view') ||
        hasHrPermission(actor, 'hr.performance.manage') ||
        isAdminRole(actor.role);
    const isPrincipal = isPrincipalActor(actor);
    let allowed = !!(isOwner || isReviewer || isHr || isPrincipal);
    if (!allowed && isHodActor(actor)) {
        const depts = hodDepartments(actor);
        const deptId = appraisal.department_id != null ? Number(appraisal.department_id) : null;
        if (deptId != null && depts.includes(deptId) && hasHrPermission(actor, 'hr.performance.view')) {
            allowed = true;
        }
    }
    if (!allowed && self) {
        // Reporting manager viewing assigned review
        if (isReviewer)
            allowed = true;
    }
    if (!allowed) {
        throw new AppError(403, 'You do not have permission to view this appraisal');
    }
    const canSeeHrNotes = !!(isHr && opts?.includePrivateNotes !== false);
    const canSeeReviewerPrivateNotes = !!((isReviewer || isHr || isPrincipal) &&
        !isOwner &&
        opts?.includePrivateNotes !== false);
    // Employee never sees reviewer_private_notes or hr_notes
    if (isOwner && !isHr) {
        return { canSeeReviewerPrivateNotes: false, canSeeHrNotes: false };
    }
    return {
        canSeeReviewerPrivateNotes: canSeeReviewerPrivateNotes && !isOwner,
        canSeeHrNotes,
    };
}
export async function assertNotSelfReview(actor, employeeId) {
    const self = await resolveEmployeeForActor(actor);
    if (self && Number(self.id) === employeeId) {
        throw new AppError(403, 'Self-review is not allowed', undefined, 'APPRAISAL_SELF_REVIEW');
    }
}
/** Require performance view permission for HR-scoped reads. */
export function requirePerformanceView(actor) {
    assertHrPermission(actor, 'hr.performance.view');
}
