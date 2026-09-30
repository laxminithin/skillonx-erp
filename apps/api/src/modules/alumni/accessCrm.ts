import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
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
] as const;

/** T&P and placement coordinators — institutional CRM scope. */
const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'] as const;

/** Department-scoped CRM collaborators. */
const DEPT_CRM_ROLES = ['HOD', 'FACULTY'] as const;

export function canAccessCrm(actor: AlumniAdminActor) {
  return (
    canSuggestAlumni(actor) ||
    CRM_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    DEPT_CRM_ROLES.includes(actor.role as any)
  );
}

export function canOperateCrm(actor: AlumniAdminActor) {
  return (
    canAdminAlumni(actor) ||
    CRM_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'FACULTY'
  );
}

export function canReassignOwnership(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['PRINCIPAL', 'VICE_PRINCIPAL', 'ALUMNI_COORDINATOR', 'HOD'].includes(actor.role);
}

export function canVerifyOutcomes(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || ['PRINCIPAL', 'ALUMNI_COORDINATOR', 'HOD', ...TP_ROLES].includes(actor.role);
}

export function canWriteInternalNotes(actor: AlumniAdminActor) {
  return canOperateCrm(actor);
}

export function isDepartmentScoped(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}

export function isTpScoped(actor: AlumniAdminActor) {
  return TP_ROLES.includes(actor.role as any);
}

export function ownerTypeForRole(role: string): string {
  if (['ALUMNI_COORDINATOR', 'COLLEGE_ADMIN'].includes(role)) return 'ALUMNI_OFFICER';
  if (TP_ROLES.includes(role as any)) return 'TP_OFFICER';
  if (role === 'HOD') return 'HOD';
  if (role === 'FACULTY') return 'FACULTY';
  if (['PRINCIPAL', 'VICE_PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(role)) return 'PRINCIPAL_TEAM';
  return 'OTHER';
}
