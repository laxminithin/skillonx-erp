/**
 * Management & Executive Portal — RBAC.
 *
 * Two-layer authorization:
 *   1. The executive request must hold the relevant `management.*` capability
 *      (checked here). This is the Management-vs-Principal governance boundary.
 *   2. The canonical domain read the aggregation service then calls enforces
 *      its OWN capability (finance.view, hr.succession.view, …). MANAGEMENT /
 *      CHAIRMAN are granted read-only entries in each domain's access map, so
 *      no privilege is forged — the executive actor is passed through as-is.
 *
 * No role receives a capability merely because it is "management": grants are
 * explicit per role below.
 */
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { ManagementActor, ManagementPermission } from './types.js';

const VIEW_BASE: ManagementPermission[] = [
  'management.dashboard.view',
  'management.academics.view',
  'management.hr.view',
  'management.recruitment.view',
  'management.performance.view',
  'management.ld.view',
  'management.succession.view',
  'management.placement.view',
  'management.finance.view',
  'management.payroll.summary',
  'management.campus.view',
  'management.approvals.view',
  'management.exceptions.view',
  'management.departments.view',
  'management.reports.view',
  'management.reports.export',
  'management.audit.view',
  'management.search',
];

const ALL: ManagementPermission[] = [
  ...VIEW_BASE,
  'management.approvals.act',
  'management.payroll.detail',
];

/**
 * Executive leadership: full institution-level VIEW, reports, approvals inbox
 * VIEW, exceptions and audit. Deliberately WITHOUT `management.payroll.detail`
 * (individual salaries stay highly-restricted) and WITHOUT
 * `management.approvals.act` by default — acting on a governance approval is an
 * explicitly-configured grant, not an automatic property of the role.
 */
const MANAGEMENT_CAPS: ManagementPermission[] = [...VIEW_BASE];

/**
 * Principal: academic + administrative leadership. Retains the executive view
 * surface AND the ability to act on approvals routed through the portal, since
 * the Principal already holds canonical approval authority (leave, recruitment,
 * succession). Payroll stays summary-only.
 */
const PRINCIPAL_CAPS: ManagementPermission[] = [...VIEW_BASE, 'management.approvals.act'];

const ROLE_MANAGEMENT_PERMISSIONS: Record<string, ManagementPermission[]> = {
  SUPER_ADMIN: ALL,
  COLLEGE_ADMIN: ALL,
  MANAGEMENT: MANAGEMENT_CAPS,
  CHAIRMAN: MANAGEMENT_CAPS,
  PRINCIPAL: PRINCIPAL_CAPS,
};

export function managementPermissionsForRole(role: string): ManagementPermission[] {
  if (isSuperAdmin(role)) return ROLE_MANAGEMENT_PERMISSIONS.SUPER_ADMIN;
  return ROLE_MANAGEMENT_PERMISSIONS[role] ?? [];
}

export function hasManagementPermission(
  actor: ManagementActor,
  permission: ManagementPermission,
): boolean {
  if (isAdminRole(actor.role)) return true;
  const roles = [actor.role, ...(actor.leadershipRoles ?? [])];
  return roles.some((r) => managementPermissionsForRole(r).includes(permission));
}

export function assertManagementPermission(
  actor: ManagementActor,
  permission: ManagementPermission,
) {
  if (!hasManagementPermission(actor, permission)) {
    throw new AppError(403, 'You do not have access to this executive view', undefined, 'MANAGEMENT_FORBIDDEN');
  }
}

/** Is this actor allowed into the Management Portal at all? */
export function isManagementActor(actor: ManagementActor): boolean {
  return hasManagementPermission(actor, 'management.dashboard.view');
}

export function assertManagementActor(actor: ManagementActor) {
  if (!isManagementActor(actor)) {
    throw new AppError(403, 'Management & Executive Portal access required', undefined, 'MANAGEMENT_FORBIDDEN');
  }
}

/** The set of capabilities this actor holds — surfaced to the web app so it can
 * render only the sections the executive is permitted to see. */
export function managementCapabilities(actor: ManagementActor): ManagementPermission[] {
  if (isAdminRole(actor.role)) return ALL;
  const roles = [actor.role, ...(actor.leadershipRoles ?? [])];
  const set = new Set<ManagementPermission>();
  for (const r of roles) for (const p of managementPermissionsForRole(r)) set.add(p);
  return [...set];
}
