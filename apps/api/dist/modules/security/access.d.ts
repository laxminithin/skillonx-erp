import type { SecurityActor, SecurityPermission } from './types.js';
export declare function securityPermissionsForRole(role: string): SecurityPermission[];
export declare function hasSecurityPermission(actor: SecurityActor, permission: SecurityPermission): boolean;
export declare function assertSecurityPermission(actor: SecurityActor, permission: SecurityPermission): void;
/**
 * Incident detail is privacy-scoped: only Security roles + admin/management
 * tier may see full incident detail (per the approved scope). General
 * Faculty/Student roles never reach this module's routes at all (no route is
 * mounted for them), but this guard is kept explicit for any internal
 * cross-module caller that might try to read incident detail on someone
 * else's behalf.
 */
export declare function assertIncidentReadAccess(actor: SecurityActor): void;
