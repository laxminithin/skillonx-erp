import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
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
] as const;

const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'] as const;
const DEPT_ROLES = ['HOD', 'FACULTY'] as const;

export function canAccessEngagement(actor: AlumniAdminActor) {
  return (
    canAccessCrm(actor) ||
    canSuggestAlumni(actor) ||
    ENGAGEMENT_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    DEPT_ROLES.includes(actor.role as any)
  );
}

export function canOperateEngagement(actor: AlumniAdminActor) {
  return (
    canOperateCrm(actor) ||
    canAdminAlumni(actor) ||
    ENGAGEMENT_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'FACULTY'
  );
}

export function canApproveDepartmentCampaign(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['HOD', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', ...TP_ROLES].includes(actor.role);
}

export function canApproveInstitutionalCampaign(actor: AlumniAdminActor) {
  return (
    canAdminAlumni(actor) ||
    ['PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', 'MANAGEMENT', 'CHAIRMAN', ...TP_ROLES].includes(actor.role)
  );
}

export function canManageTemplates(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'VICE_PRINCIPAL', ...TP_ROLES].includes(actor.role);
}

export function canOverrideSuppression(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'HOD', ...TP_ROLES].includes(actor.role);
}

export function canExportEngagement(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['ALUMNI_COORDINATOR', 'PRINCIPAL', ...TP_ROLES].includes(actor.role);
}

export function isDepartmentScopedEngagement(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}

export function approvalStepsForCampaign(opts: { scope: string; departmentId?: number | null }) {
  const steps: Array<'HOD_REVIEW' | 'ALUMNI_TP_REVIEW' | 'INSTITUTIONAL'> = [];
  if (opts.scope === 'DEPARTMENT' || opts.departmentId) {
    steps.push('HOD_REVIEW');
  }
  steps.push('ALUMNI_TP_REVIEW');
  if (opts.scope === 'INSTITUTION' && !opts.departmentId) {
    steps.push('INSTITUTIONAL');
  }
  return steps;
}
