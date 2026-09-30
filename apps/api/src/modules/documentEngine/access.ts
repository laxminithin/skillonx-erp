import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { DocumentActor, DocumentPermission } from './types.js';

// Deliberately narrow by default (Phase 0 has no real consumer yet — see
// docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md). Any authenticated staff user may
// upload evidence for something they own; only admin-tier can read/archive ANY
// document in the tenant. A future consumer module (e.g. Security/Gate) extends this
// when it is actually built, rather than this phase guessing at its needs.
const ROLE_PERMISSIONS: Record<string, DocumentPermission[]> = {
  SUPER_ADMIN: ['document.upload', 'document.manage'],
  COLLEGE_ADMIN: ['document.upload', 'document.manage'],
  PRINCIPAL: ['document.upload', 'document.manage'],
  HOD: ['document.upload'],
  FACULTY: ['document.upload'],
  MAINTENANCE_MANAGER: ['document.upload'],
  FACILITIES_OFFICER: ['document.upload'],
  PROCUREMENT_OFFICER: ['document.upload'],
  // Accountant reviews student-uploaded scholarship evidence it did not
  // upload itself (income/category certificates, etc.), so it needs
  // document.manage, not just document.upload (directive Phase 10 §25/§26).
  ACCOUNTANT: ['document.upload', 'document.manage'],
  // Students may upload evidence for their own entities (e.g. a scholarship
  // application) but never gain 'document.manage' — assertReadAccess still
  // scopes a student to documents they themselves uploaded.
  STUDENT: ['document.upload'],
};

export function documentPermissionsForRole(role: string): DocumentPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasDocumentPermission(actor: DocumentActor, permission: DocumentPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return documentPermissionsForRole(actor.role).includes(permission);
}

export function assertDocumentPermission(actor: DocumentActor, permission: DocumentPermission) {
  if (!hasDocumentPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this document action');
  }
}
