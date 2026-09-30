import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { EventsActor, EventsPermission } from './types.js';

/**
 * Least-privilege RBAC, same per-module pattern as `research/access.ts`.
 *
 * - Organisers (FACULTY, HOD, PRINCIPAL, coordinators, office admin) create
 *   events and request reservations; they see their own events plus
 *   published institution/department events.
 * - HOD reviews department events (department-scoped in the service).
 * - PRINCIPAL reviews/closes institutional events.
 * - FACILITIES_OFFICER configures bookable resources, decides ad-hoc
 *   reservations and acts on the Facilities approval step.
 * - MANAGEMENT/CHAIRMAN: institution-wide read only.
 * No new role is introduced.
 */
const ORGANIZER: EventsPermission[] = ['events.event.create', 'events.event.view', 'events.reservation.request'];

const ROLE_PERMISSIONS: Record<string, EventsPermission[]> = {
  SUPER_ADMIN: [
    'events.event.create', 'events.event.view', 'events.event.viewAll', 'events.event.review', 'events.event.close',
    'events.capacity.override', 'events.resource.manage', 'events.reservation.request', 'events.reservation.decide',
    'events.report.view',
  ],
  COLLEGE_ADMIN: [
    'events.event.create', 'events.event.view', 'events.event.viewAll', 'events.event.review', 'events.event.close',
    'events.capacity.override', 'events.resource.manage', 'events.reservation.request', 'events.reservation.decide',
    'events.report.view',
  ],
  PRINCIPAL: [...ORGANIZER, 'events.event.viewAll', 'events.event.review', 'events.event.close', 'events.capacity.override', 'events.report.view'],
  HOD: [...ORGANIZER, 'events.event.review', 'events.event.close', 'events.report.view'],
  FACULTY: ORGANIZER,
  IQAC_COORDINATOR: [...ORGANIZER, 'events.report.view'],
  NBA_COORDINATOR: ORGANIZER,
  RESEARCH_COORDINATOR: ORGANIZER,
  OFFICE_ADMIN: ORGANIZER,
  OFFICE_SUPERINTENDENT: ORGANIZER,
  FACILITIES_OFFICER: [
    'events.event.view', 'events.event.viewAll', 'events.event.review', 'events.capacity.override',
    'events.resource.manage', 'events.reservation.request', 'events.reservation.decide',
  ],
  MANAGEMENT: ['events.event.view', 'events.event.viewAll', 'events.report.view'],
  CHAIRMAN: ['events.event.view', 'events.event.viewAll', 'events.report.view'],
};

/** Roles allowed to act on the "returned to organiser" workflow step (any organiser role). */
export const ORGANIZER_ROLES = Object.entries(ROLE_PERMISSIONS)
  .filter(([role, perms]) => perms.includes('events.event.create') && !isAdminRole(role))
  .map(([role]) => role);

export function eventsPermissionsForRole(role: string): EventsPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasEventsPermission(actor: { role: string }, permission: EventsPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return eventsPermissionsForRole(actor.role).includes(permission);
}

export function assertEventsPermission(actor: { role: string }, permission: EventsPermission) {
  if (!hasEventsPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this events action');
  }
}

export function hodDepartmentIds(actor: EventsActor): number[] {
  if (actor.hodDepartmentIds != null) return actor.hodDepartmentIds.map(Number);
  if (actor.role === 'HOD' && actor.departmentId != null) return [Number(actor.departmentId)];
  return [];
}

export function isHodOfDepartment(actor: EventsActor, departmentId: number | null): boolean {
  if (departmentId == null) return false;
  return hodDepartmentIds(actor).includes(Number(departmentId));
}
