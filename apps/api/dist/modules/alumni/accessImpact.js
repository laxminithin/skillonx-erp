/**
 * Access control for Alumni Impact & Accreditation Analytics (C7).
 */
import { isAdminRole } from '../../utils/permissions.js';
import { canAccessCrm } from './accessCrm.js';
import { canAccessRecognition } from './accessRecognition.js';
const EXECUTIVE_ROLES = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'VICE_PRINCIPAL',
    'DEAN',
];
const IMPACT_OPERATOR_ROLES = [
    ...EXECUTIVE_ROLES,
    'ALUMNI_COORDINATOR',
];
const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'];
const QUALITY_ROLES = ['IQAC_COORDINATOR', 'NBA_COORDINATOR'];
export function canAccessImpact(actor) {
    return (canAccessCrm(actor) ||
        canAccessRecognition(actor) ||
        IMPACT_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        QUALITY_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'FACULTY');
}
export function canViewExecutiveImpact(actor) {
    return (EXECUTIVE_ROLES.includes(actor.role) ||
        actor.role === 'ALUMNI_COORDINATOR' ||
        QUALITY_ROLES.includes(actor.role) ||
        isAdminRole(actor.role));
}
export function canViewDepartmentImpact(actor) {
    return canAccessImpact(actor);
}
export function canOperateImpact(actor) {
    return (IMPACT_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        isAdminRole(actor.role));
}
export function canManageAccreditationMappings(actor) {
    return (IMPACT_OPERATOR_ROLES.includes(actor.role) ||
        QUALITY_ROLES.includes(actor.role) ||
        isAdminRole(actor.role));
}
export function canVerifyAccreditationMappings(actor) {
    return (['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR', 'IQAC_COORDINATOR', 'NBA_COORDINATOR'].includes(actor.role) || isAdminRole(actor.role));
}
export function canExportImpact(actor) {
    return (EXECUTIVE_ROLES.includes(actor.role) ||
        actor.role === 'ALUMNI_COORDINATOR' ||
        QUALITY_ROLES.includes(actor.role) ||
        isAdminRole(actor.role));
}
export function canCreateSnapshot(actor) {
    return canExportImpact(actor);
}
export function canDrillPersonal(actor) {
    return (IMPACT_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        isAdminRole(actor.role));
}
export function isDepartmentScopedImpact(actor) {
    return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
export function isIqacScoped(actor) {
    return QUALITY_ROLES.includes(actor.role);
}
