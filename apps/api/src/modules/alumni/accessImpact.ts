/**
 * Access control for Alumni Impact & Accreditation Analytics (C7).
 */
import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
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
] as const;

const IMPACT_OPERATOR_ROLES = [
  ...EXECUTIVE_ROLES,
  'ALUMNI_COORDINATOR',
] as const;

const TP_ROLES = ['TNP_OFFICER', 'PLACEMENT_OFFICER', 'TRAINING_PLACEMENT', 'TPO'] as const;

const QUALITY_ROLES = ['IQAC_COORDINATOR', 'NBA_COORDINATOR'] as const;

export function canAccessImpact(actor: AlumniAdminActor) {
  return (
    canAccessCrm(actor) ||
    canAccessRecognition(actor) ||
    IMPACT_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    QUALITY_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    actor.role === 'FACULTY'
  );
}

export function canViewExecutiveImpact(actor: AlumniAdminActor) {
  return (
    EXECUTIVE_ROLES.includes(actor.role as any) ||
    actor.role === 'ALUMNI_COORDINATOR' ||
    QUALITY_ROLES.includes(actor.role as any) ||
    isAdminRole(actor.role)
  );
}

export function canViewDepartmentImpact(actor: AlumniAdminActor) {
  return canAccessImpact(actor);
}

export function canOperateImpact(actor: AlumniAdminActor) {
  return (
    IMPACT_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    isAdminRole(actor.role)
  );
}

export function canManageAccreditationMappings(actor: AlumniAdminActor) {
  return (
    IMPACT_OPERATOR_ROLES.includes(actor.role as any) ||
    QUALITY_ROLES.includes(actor.role as any) ||
    isAdminRole(actor.role)
  );
}

export function canVerifyAccreditationMappings(actor: AlumniAdminActor) {
  return (
    ['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR', 'IQAC_COORDINATOR', 'NBA_COORDINATOR'].includes(
      actor.role,
    ) || isAdminRole(actor.role)
  );
}

export function canExportImpact(actor: AlumniAdminActor) {
  return (
    EXECUTIVE_ROLES.includes(actor.role as any) ||
    actor.role === 'ALUMNI_COORDINATOR' ||
    QUALITY_ROLES.includes(actor.role as any) ||
    isAdminRole(actor.role)
  );
}

export function canCreateSnapshot(actor: AlumniAdminActor) {
  return canExportImpact(actor);
}

export function canDrillPersonal(actor: AlumniAdminActor) {
  return (
    IMPACT_OPERATOR_ROLES.includes(actor.role as any) ||
    TP_ROLES.includes(actor.role as any) ||
    actor.role === 'HOD' ||
    isAdminRole(actor.role)
  );
}

export function isDepartmentScopedImpact(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}

export function isIqacScoped(actor: AlumniAdminActor) {
  return QUALITY_ROLES.includes(actor.role as any);
}
