import { isAdminRole } from '../../utils/permissions.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
import { canAccessCrm, canOperateCrm } from './accessCrm.js';
const ENGAGEMENT_OPERATOR_ROLES = [
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
export function canAccessEngagement(actor) {
    return (canAccessCrm(actor) ||
        canSuggestAlumni(actor) ||
        ENGAGEMENT_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        DEPT_ROLES.includes(actor.role));
}
export function canOperateEngagement(actor) {
    return (canOperateCrm(actor) ||
        canAdminAlumni(actor) ||
        ENGAGEMENT_OPERATOR_ROLES.includes(actor.role) ||
        TP_ROLES.includes(actor.role) ||
        actor.role === 'HOD' ||
        actor.role === 'FACULTY');
}
export function canApproveDepartmentCampaign(actor) {
    return canAdminAlumni(actor) || ['HOD', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', ...TP_ROLES].includes(actor.role);
}
export function canApproveInstitutionalCampaign(actor) {
    return (canAdminAlumni(actor) ||
        ['PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', 'MANAGEMENT', 'CHAIRMAN', ...TP_ROLES].includes(actor.role));
}
export function canManageTemplates(actor) {
    return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'VICE_PRINCIPAL', ...TP_ROLES].includes(actor.role);
}
export function canOverrideSuppression(actor) {
    return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'HOD', ...TP_ROLES].includes(actor.role);
}
export function canExportEngagement(actor) {
    return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', ...TP_ROLES].includes(actor.role);
}
export function isDepartmentScopedEngagement(actor) {
    return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
export function approvalStepsForCampaign(opts) {
    const steps = [];
    if (opts.scope === 'DEPARTMENT' || opts.departmentId) {
        steps.push('HOD_REVIEW');
    }
    steps.push('ALUMNI_TP_REVIEW');
    if (opts.scope === 'INSTITUTION' && !opts.departmentId) {
        steps.push('INSTITUTIONAL');
    }
    return steps;
}
