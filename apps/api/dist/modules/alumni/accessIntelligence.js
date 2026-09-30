/**
 * Alumni Intelligence (C3) — access control.
 * Reuses C1/C2 role families; adds segment + export privileges.
 */
import { isAdminRole } from '../../utils/permissions.js';
import { canAccessCrm, isDepartmentScoped, isTpScoped } from './accessCrm.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
const INTEL_VIEW_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'ALUMNI_COORDINATOR',
    'VICE_PRINCIPAL',
    'DEAN',
    'HOD',
    'FACULTY',
    'TNP_OFFICER',
    'PLACEMENT_OFFICER',
    'TRAINING_PLACEMENT',
    'TPO',
];
const SEGMENT_EDIT_INSTITUTIONAL = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'ALUMNI_COORDINATOR',
];
const EXPORT_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'ALUMNI_COORDINATOR',
    'MANAGEMENT',
    'CHAIRMAN',
];
export function canViewIntelligence(actor) {
    return (canAccessCrm(actor) ||
        canSuggestAlumni(actor) ||
        INTEL_VIEW_ROLES.includes(actor.role) ||
        isAdminRole(actor.role));
}
export function canCreateSavedSegments(actor) {
    return canViewIntelligence(actor) && actor.role !== 'MANAGEMENT';
}
export function canEditInstitutionalSegments(actor) {
    return SEGMENT_EDIT_INSTITUTIONAL.includes(actor.role) || actor.role === 'SUPER_ADMIN';
}
export function canExportIntelligence(actor) {
    return EXPORT_ROLES.includes(actor.role) || actor.role === 'SUPER_ADMIN';
}
export function canViewContactDetails(actor) {
    if (canAdminAlumni(actor))
        return true;
    return [
        'ALUMNI_COORDINATOR',
        'PRINCIPAL',
        'HOD',
        'TNP_OFFICER',
        'PLACEMENT_OFFICER',
        'TRAINING_PLACEMENT',
        'TPO',
    ].includes(actor.role);
}
export { isDepartmentScoped, isTpScoped, canAdminAlumni };
