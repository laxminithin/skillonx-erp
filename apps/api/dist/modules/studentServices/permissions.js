import { isAdminRole } from '../../utils/permissions.js';
import { AppError } from '../../utils/errors.js';
const ROLE_PERMISSIONS = {
    OFFICE_ADMIN: ['student_services.view', 'student_services.process', 'certificate.issue'],
    OFFICE_SUPERINTENDENT: ['student_services.view', 'student_services.process', 'certificate.approve', 'certificate.issue'],
    SUPER_ADMIN: [
        'student_services.view',
        'student_services.process',
        'certificate.approve',
        'certificate.issue',
        'profile_correction.approve',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
        'mentor.manage',
    ],
    COLLEGE_ADMIN: [
        'student_services.view',
        'student_services.process',
        'certificate.approve',
        'certificate.issue',
        'profile_correction.approve',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
        'mentor.manage',
    ],
    PRINCIPAL: [
        'student_services.view',
        'student_services.process',
        'certificate.approve',
        'certificate.issue',
        'profile_correction.approve',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
        'mentor.manage',
    ],
    HOD: [
        'student_services.view',
        'student_services.process',
        'certificate.approve',
        'profile_correction.approve',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
        'mentor.manage',
    ],
    GRIEVANCE_OFFICER: [
        'student_services.view',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
    ],
    STUDENT_WELFARE_OFFICER: [
        'student_services.view',
        'grievance.assign',
        'grievance.resolve',
        'grievance.triage',
        'grievance.note',
        'grievance.refer',
    ],
    FACULTY: ['student_services.view', 'mentor.manage'],
    IQAC_COORDINATOR: ['student_services.view'],
    NBA_COORDINATOR: ['student_services.view'],
};
const WORKFLOW_ROLE_MAP = {
    CLASS_COORDINATOR: ['FACULTY', 'HOD'],
    MENTOR: ['FACULTY'],
    FACULTY: ['FACULTY'],
    HOD: ['HOD'],
    COLLEGE_ADMIN: ['COLLEGE_ADMIN', 'SUPER_ADMIN'],
    PRINCIPAL: ['PRINCIPAL'],
    EXAM_COORDINATOR: ['COLLEGE_ADMIN', 'HOD'],
};
export function hasServicesPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    const perms = ROLE_PERMISSIONS[actor.role] ?? [];
    return perms.includes(permission);
}
export function assertServicesPermission(actor, permission) {
    if (!hasServicesPermission(actor, permission)) {
        throw new AppError(403, 'Insufficient permissions for this action');
    }
}
export function canActOnWorkflowStep(actor, actorRole) {
    if (isAdminRole(actor.role) || actor.role === 'OFFICE_ADMIN' || actor.role === 'OFFICE_SUPERINTENDENT')
        return true;
    const allowed = WORKFLOW_ROLE_MAP[actorRole] ?? [actorRole];
    return allowed.includes(actor.role);
}
export async function isClassCoordinator(facultyId, collegeId, studentId) {
    const { db } = await import('../../db/index.js');
    const enrollment = await db('academic_class_enrollments as e')
        .join('academic_classes as c', 'c.id', 'e.academic_class_id')
        .join('academic_class_coordinators as cc', 'cc.academic_class_id', 'c.id')
        .where({
        'e.student_id': studentId,
        'e.status': 'APPROVED',
        'c.college_id': collegeId,
        'cc.faculty_id': facultyId,
        'cc.role': 'COORDINATOR',
    })
        .first();
    return !!enrollment;
}
/** Whether the acting faculty is the student's ACTIVE mentor. */
export async function isMentorOfStudent(facultyId, collegeId, studentId) {
    const { db } = await import('../../db/index.js');
    const row = await db('mentor_assignments')
        .where({
        mentor_faculty_id: facultyId,
        college_id: collegeId,
        student_id: studentId,
        status: 'ACTIVE',
    })
        .first();
    return !!row;
}
export async function canActAsRole(actor, actorRole, studentId) {
    if (isAdminRole(actor.role) || actor.role === 'OFFICE_ADMIN' || actor.role === 'OFFICE_SUPERINTENDENT')
        return true;
    // Relationship-scoped workflow steps: the acting faculty must actually hold the
    // relationship (mentor of / class coordinator of the requesting student), not
    // merely carry the FACULTY role. This prevents cross-mentor / cross-class IDOR
    // on mentor- and coordinator-routed approvals.
    if (actorRole === 'CLASS_COORDINATOR' && studentId) {
        return isClassCoordinator(actor.facultyUserId, actor.collegeId, studentId);
    }
    if (actorRole === 'MENTOR') {
        if (!studentId)
            return false;
        return isMentorOfStudent(actor.facultyUserId, actor.collegeId, studentId);
    }
    return canActOnWorkflowStep(actor, actorRole);
}
