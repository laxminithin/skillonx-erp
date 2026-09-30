/**
 * Access control for Alumni Matching & Connect (C5).
 */
import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
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
] as const;

const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'] as const;
const DEPT_ROLES = ['HOD', 'FACULTY'] as const;

export function canAccessMatching(actor: AlumniAdminActor) {
  return (
    canAccessCrm(actor) ||
    canAccessEngagement(actor) ||
    canSuggestAlumni(actor) ||
    MATCHING_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    DEPT_ROLES.includes(actor.role as any)
  );
}

export function canOperateMatching(actor: AlumniAdminActor) {
  return (
    canOperateCrm(actor) ||
    canOperateEngagement(actor) ||
    canAdminAlumni(actor) ||
    MATCHING_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'FACULTY'
  );
}

export function canFulfilNeed(actor: AlumniAdminActor) {
  return (
    canAdminAlumni(actor) ||
    ['ALUMNI_COORDINATOR', 'PRINCIPAL', 'VICE_PRINCIPAL', ...TP_ROLES].includes(actor.role)
  );
}

export function isDepartmentScopedMatching(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
