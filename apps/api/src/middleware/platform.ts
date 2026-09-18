import type { Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { AppError } from '../utils/errors.js';
import { isSuperAdmin } from '../utils/permissions.js';
import type { AuthedRequest } from './auth.js';

/**
 * Whether a role holds a platform capability. SUPER_ADMIN always passes (a
 * bootstrap-safety guarantee so the platform can never lock itself out of
 * governance); any other role must be explicitly granted via the governance
 * table. This is the single RBAC engine — no SUPER_ADMIN=true bypass leaks
 * into domain services.
 */
export async function roleHasPlatformCapability(role: string, capability: string): Promise<boolean> {
  if (isSuperAdmin(role)) return true;
  const row = await db('platform_role_capabilities')
    .where({ role, capability_key: capability })
    .first();
  return Boolean(row);
}

/**
 * Guard for `/api/platform/*`. Requires an authenticated faculty user whose
 * role holds the given platform capability. Tenant-scoped users (COLLEGE_ADMIN,
 * PRINCIPAL, HOD, FACULTY, MANAGEMENT, HR_*, ...) are denied unless explicitly
 * granted a platform capability.
 */
export function requirePlatformCapability(capability: string) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');
      const ok = await roleHasPlatformCapability(req.user.role, capability);
      if (!ok) {
        throw new AppError(403, 'Platform governance access required', undefined, 'PLATFORM_FORBIDDEN');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
