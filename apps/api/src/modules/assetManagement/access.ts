import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { AssetActor, AssetPermission } from './types.js';

// Least-privilege: only roles with a genuine, evidence-backed operational reason to
// register/move institutional assets get manage/assign/retire. Everyone with an
// operational relationship to campus infrastructure gets view.
const ROLE_PERMISSIONS: Record<string, AssetPermission[]> = {
  SUPER_ADMIN: ['asset.view', 'asset.manage', 'asset.assign', 'asset.retire'],
  COLLEGE_ADMIN: ['asset.view', 'asset.manage', 'asset.assign', 'asset.retire'],
  PRINCIPAL: ['asset.view'],
  MANAGEMENT: ['asset.view'],
  CHAIRMAN: ['asset.view'],
  HOD: ['asset.view'],
  FACULTY: ['asset.view'],
  MAINTENANCE_MANAGER: ['asset.view', 'asset.manage', 'asset.assign', 'asset.retire'],
  FACILITIES_OFFICER: ['asset.view', 'asset.manage', 'asset.assign', 'asset.retire'],
  PROCUREMENT_OFFICER: ['asset.view', 'asset.manage', 'asset.assign'],
  STORE_KEEPER: ['asset.view', 'asset.manage'],
  LAB_ASSISTANT: ['asset.view'],
  IT_SUPPORT: ['asset.view'],
};

export function assetPermissionsForRole(role: string): AssetPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasAssetPermission(actor: AssetActor, permission: AssetPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return assetPermissionsForRole(actor.role).includes(permission);
}

export function assertAssetPermission(actor: AssetActor, permission: AssetPermission) {
  if (!hasAssetPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this asset management action');
  }
}
