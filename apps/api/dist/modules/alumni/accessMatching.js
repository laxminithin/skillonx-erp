/**
 * Access control for Alumni Matching & Connect (C5).
 */
import { isAdminRole } from '../../utils/permissions.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
import { canAccessCrm, canOperateCrm } from './accessCrm.js';
import { canAccessEngagement, canOperateEngagement } from './accessEngagement.js';
const MATCHING_OPERATOR_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'ALUMNI_COORDINATOR',
    'VICE_PRINCIPAL',
    'DEAN',
];
const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'];
const DEPT_ROLES = ['HOD', 'FACULTY'];
export function canAccessMatching(actor) {
    return (canAccessCrm(actor) ||
        canAccessEngagement(actor) ||
        canSuggestAlumni(actor) ||
        MATCHING_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        DEPT_ROLES.includes(actor.role));
}
export function canOperateMatching(actor) {
    return (canOperateCrm(actor) ||
        canOperateEngagement(actor) ||
        canAdminAlumni(actor) ||
        MATCHING_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'FACULTY');
}
export function canFulfilNeed(actor) {
    return (canAdminAlumni(actor) ||
        ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'VICE_PRINCIPAL', ...TP_ROLES].includes(actor.role));
}
export function isDepartmentScopedMatching(actor) {
    return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
