import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
/**
 * Least-privilege RBAC for Campus OS Phase 4 (Security, Gate & Visitor
 * Management). Two new roles are introduced here, following the exact
 * per-module pattern used by every other Campus OS module (see
 * `hostel/access.ts`, `assetManagement/access.ts`): role is a free-text
 * string on the faculty user, and each module owns its own permission map.
 *
 * - SECURITY_MANAGER: full operational control — gate master, visitor
 *   approval, check-in/out, and incident management/closure.
 * - SECURITY_GUARD: front-line duty — can request/check-in/check-out
 *   visitors and log incidents, but cannot approve visits, manage the gate
 *   master, or close out incidents. (Gate-level scoping for guards was
 *   evaluated per the approved scope and intentionally left out — the
 *   tenant-wide role check here is the "don't over-engineer" cut; a future
 *   phase can add a `security_guard_gate_assignments` table the same way
 *   Hostel scopes wardens to hostels via `hostel_warden_assignments`.)
 *
 * Institution-wide read (Principal/Management/Chairman) mirrors the same
 * convention already used across every other Campus OS module.
 */
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: [
        'security.gate.manage', 'security.gate.view',
        'security.visitor.request', 'security.visitor.approve', 'security.visitor.checkinout', 'security.visitor.view',
        'security.incident.report', 'security.incident.manage', 'security.incident.view',
    ],
    COLLEGE_ADMIN: [
        'security.gate.manage', 'security.gate.view',
        'security.visitor.request', 'security.visitor.approve', 'security.visitor.checkinout', 'security.visitor.view',
        'security.incident.report', 'security.incident.manage', 'security.incident.view',
    ],
    PRINCIPAL: ['security.gate.view', 'security.visitor.view', 'security.incident.view'],
    MANAGEMENT: ['security.gate.view', 'security.visitor.view', 'security.incident.view'],
    CHAIRMAN: ['security.gate.view', 'security.visitor.view', 'security.incident.view'],
    // Full operational control: gate master, visit approval, and incident
    // reporting + resolution/closure.
    SECURITY_MANAGER: [
        'security.gate.manage', 'security.gate.view',
        'security.visitor.request', 'security.visitor.approve', 'security.visitor.checkinout', 'security.visitor.view',
        'security.incident.report', 'security.incident.manage', 'security.incident.view',
    ],
    // Front-line duty: can request/check-in/check-out visitors and report
    // incidents, but cannot approve visits, manage the gate master, or
    // resolve/close incidents (that stays a manager-tier action).
    SECURITY_GUARD: [
        'security.gate.view',
        'security.visitor.request', 'security.visitor.checkinout', 'security.visitor.view',
        'security.incident.report', 'security.incident.view',
    ],
};
export function securityPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_PERMISSIONS.SUPER_ADMIN;
    return ROLE_PERMISSIONS[role] ?? [];
}
export function hasSecurityPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    return securityPermissionsForRole(actor.role).includes(permission);
}
export function assertSecurityPermission(actor, permission) {
    if (!hasSecurityPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this security action');
    }
}
/**
 * Incident detail is privacy-scoped: only Security roles + admin/management
 * tier may see full incident detail (per the approved scope). General
 * Faculty/Student roles never reach this module's routes at all (no route is
 * mounted for them), but this guard is kept explicit for any internal
 * cross-module caller that might try to read incident detail on someone
 * else's behalf.
 */
export function assertIncidentReadAccess(actor) {
    assertSecurityPermission(actor, 'security.incident.view');
}
