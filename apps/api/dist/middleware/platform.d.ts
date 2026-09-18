import type { Response, NextFunction } from 'express';
import type { AuthedRequest } from './auth.js';
/**
 * Whether a role holds a platform capability. SUPER_ADMIN always passes (a
 * bootstrap-safety guarantee so the platform can never lock itself out of
 * governance); any other role must be explicitly granted via the governance
 * table. This is the single RBAC engine — no SUPER_ADMIN=true bypass leaks
 * into domain services.
 */
export declare function roleHasPlatformCapability(role: string, capability: string): Promise<boolean>;
/**
 * Guard for `/api/platform/*`. Requires an authenticated faculty user whose
 * role holds the given platform capability. Tenant-scoped users (COLLEGE_ADMIN,
 * PRINCIPAL, HOD, FACULTY, MANAGEMENT, HR_*, ...) are denied unless explicitly
 * granted a platform capability.
 */
export declare function requirePlatformCapability(capability: string): (req: AuthedRequest, _res: Response, next: NextFunction) => Promise<void>;
