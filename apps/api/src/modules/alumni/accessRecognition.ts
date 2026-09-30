/**
 * Access control for Alumni Recognition, Value & Community (C6).
 */
import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
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
] as const;

const APPROVER_ROLES = [
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'PRINCIPAL',
  'MANAGEMENT',
  'CHAIRMAN',
  'ALUMNI_COORDINATOR',
  'VICE_PRINCIPAL',
] as const;

const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'] as const;
const DEPT_ROLES = ['HOD', 'FACULTY'] as const;

export function canAccessRecognition(actor: AlumniAdminActor) {
  return (
    canAccessCrm(actor) ||
    canAccessEngagement(actor) ||
    canSuggestAlumni(actor) ||
    RECOGNITION_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    DEPT_ROLES.includes(actor.role as any)
  );
}

export function canOperateRecognition(actor: AlumniAdminActor) {
  return (
    canOperateCrm(actor) ||
    canOperateEngagement(actor) ||
    canAdminAlumni(actor) ||
    RECOGNITION_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'FACULTY'
  );
}

export function canNominate(actor: AlumniAdminActor) {
  return canOperateRecognition(actor);
}

export function canReviewNomination(actor: AlumniAdminActor) {
  return (
    canAdminAlumni(actor) ||
    APPROVER_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'DEAN'
  );
}

export function canApproveRecognition(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || APPROVER_ROLES.includes(actor.role as any);
}

export function canPublishSpotlight(actor: AlumniAdminActor) {
  return canApproveRecognition(actor);
}

export function canManageValueOfferings(actor: AlumniAdminActor) {
  return canOperateRecognition(actor);
}

export function canManageCommunities(actor: AlumniAdminActor) {
  return (
    canAdminAlumni(actor) ||
    RECOGNITION_OPERATOR_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD'
  );
}

export function isDepartmentScopedRecognition(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}
