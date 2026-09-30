import { isAdminRole } from '../../utils/permissions.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
/** Institutional CRM operators (alumni officers / admins / leadership). */
const CRM_OPERATOR_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'ALUMNI_COORDINATOR',
    'VICE_PRINCIPAL',
    'DEAN',
];
/** T&P and placement coordinators — institutional CRM scope. */
const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'];
/** Department-scoped CRM collaborators. */
const DEPT_CRM_ROLES = ['HOD', 'FACULTY'];
export function canAccessCrm(actor) {
    return (canSuggestAlumni(actor) ||
        CRM_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        DEPT_CRM_ROLES.includes(actor.role));
}
export function canOperateCrm(actor) {
    return (canAdminAlumni(actor) ||
        CRM_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'FACULTY');
}
export function canReassignOwnership(actor) {
    return canAdminAlumni(actor) || ['PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', 'HOD'].includes(actor.role);
}
export function canVerifyOutcomes(actor) {
    return canAdminAlumni(actor) || ['PRINCIPAL', 'ALUMNI_COORDINATOR', 'HOD', ...TP_ROLES].includes(actor.role);
}
export function canWriteInternalNotes(actor) {
    return canOperateCrm(actor);
}
export function isDepartmentScoped(actor) {
    return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
export function isTpScoped(actor) {
    return TP_ROLES.includes(actor.role);
}
export function ownerTypeForRole(role) {
    if (['ALUMNI_COORDINATOR', 'COLLEGE_ADMIN'].includes(role))
        return 'ALUMNI_OFFICER';
    if (TP_ROLES.includes(role))
        return 'TP_OFFICER';
    if (role === 'HOD')
        return 'HOD';
    if (role === 'FACULTY')
        return 'FACULTY';
    if (['PRINCIPAL', 'VICE_PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(role))
        return 'PRINCIPAL_TEAM';
    return 'OTHER';
}
