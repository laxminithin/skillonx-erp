/**
 * Access control for Alumni Recognition, Value & Community (C6).
 */
import { isAdminRole } from '../../utils/permissions.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
import { canAccessCrm, canOperateCrm } from './accessCrm.js';
import { canAccessEngagement, canOperateEngagement } from './accessEngagement.js';
const RECOGNITION_OPERATOR_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'ALUMNI_COORDINATOR',
    'VICE_PRINCIPAL',
    'DEAN',
];
const APPROVER_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'ALUMNI_COORDINATOR',
    'VICE_PRINCIPAL',
];
const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'];
const DEPT_ROLES = ['HOD', 'FACULTY'];
export function canAccessRecognition(actor) {
    return (canAccessCrm(actor) ||
        canAccessEngagement(actor) ||
        canSuggestAlumni(actor) ||
        RECOGNITION_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        DEPT_ROLES.includes(actor.role));
}
export function canOperateRecognition(actor) {
    return (canOperateCrm(actor) ||
        canOperateEngagement(actor) ||
        canAdminAlumni(actor) ||
        RECOGNITION_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'FACULTY');
}
export function canNominate(actor) {
    return canOperateRecognition(actor);
}
export function canReviewNomination(actor) {
    return (canAdminAlumni(actor) ||
        APPROVER_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'DEAN');
}
export function canApproveRecognition(actor) {
    return canAdminAlumni(actor) || APPROVER_ROLES.includes(actor.role);
}
export function canPublishSpotlight(actor) {
    return canApproveRecognition(actor);
}
export function canManageValueOfferings(actor) {
    return canOperateRecognition(actor);
}
export function canManageCommunities(actor) {
    return (canAdminAlumni(actor) ||
        RECOGNITION_OPERATOR_ROLES.includes(actor.role) ||
        actor.role === 'HOD');
}
export function isDepartmentScopedRecognition(actor) {
    return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
