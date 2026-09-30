import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';

const ADMIN_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR'] as const;

/** Roles that may suggest alumni information (department-scoped for HOD/FACULTY). */
const SUGGESTER_ROLES = [...ADMIN_ROLES, 'HOD', 'FACULTY', 'DEAN', 'VICE_PRINCIPAL'] as const;

/** Roles that may merge identities / verify suggestions institutionally. */
const MERGE_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'ALUMNI_COORDINATOR'] as const;

export function canAdminAlumni(actor: AlumniAdminActor) {
  return isAdminRole(actor.role) || ADMIN_ROLES.includes(actor.role as any);
}

export function canSuggestAlumni(actor: AlumniAdminActor) {
  return canAdminAlumni(actor) || SUGGESTER_ROLES.includes(actor.role as any);
}

export function canMergeAlumni(actor: AlumniAdminActor) {
  return MERGE_ROLES.includes(actor.role as any) || actor.role === 'SUPER_ADMIN';
}

export function canVerifyAlumniRecords(actor: AlumniAdminActor) {
  return canAdminAlumni(actor);
}
