import { isAdminRole } from '../../utils/permissions.js';
const ADMIN_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR'];
/** Roles that may suggest alumni information (department-scoped for HOD/FACULTY). */
const SUGGESTER_ROLES = [...ADMIN_ROLES, 'HOD', 'FACULTY', 'DEAN', 'VICE_PRINCIPAL'];
/** Roles that may merge identities / verify suggestions institutionally. */
const MERGE_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'ALUMNI_COORDINATOR'];
export function canAdminAlumni(actor) {
    return isAdminRole(actor.role) || ADMIN_ROLES.includes(actor.role);
}
export function canSuggestAlumni(actor) {
    return canAdminAlumni(actor) || SUGGESTER_ROLES.includes(actor.role);
}
export function canMergeAlumni(actor) {
    return MERGE_ROLES.includes(actor.role) || actor.role === 'SUPER_ADMIN';
}
export function canVerifyAlumniRecords(actor) {
    return canAdminAlumni(actor);
}
