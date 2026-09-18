import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { MaintActor, MaintPermission } from './types.js';

/**
 * Role → base Maintenance capabilities.
 *
 * REQUESTERS: every authenticated user (faculty of any role, students) may
 * create and view their OWN tickets. Operational capabilities are additive.
 *
 * MAINTENANCE_MANAGER / FACILITIES_OFFICER own the central queue, triage,
 * routing, assignment, escalation, parts approval, config and reports.
 * MAINTENANCE_STAFF and IT_SUPPORT work ASSIGNED tickets only (scope enforced
 * separately). HOD/PRINCIPAL/MANAGEMENT get scoped oversight. SUPER_ADMIN is
 * platform/config authority — NOT the routine facilities operator, and NOT the
 * unassigned-ticket fallback (that is the Triage team).
 */
const REQUESTER: MaintPermission[] = ['maint.ticket.create', 'maint.ticket.view.own'];

const ROLE_PERMISSIONS: Record<string, MaintPermission[]> = {
  SUPER_ADMIN: [
    'maint.ticket.create', 'maint.ticket.view.own', 'maint.queue.view', 'maint.triage',
    'maint.assign', 'maint.work', 'maint.parts.request', 'maint.parts.approve',
    'maint.config', 'maint.report.view', 'maint.oversight.view',
  ],
  COLLEGE_ADMIN: [
    'maint.ticket.create', 'maint.ticket.view.own', 'maint.queue.view', 'maint.triage',
    'maint.assign', 'maint.work', 'maint.parts.request', 'maint.parts.approve',
    'maint.config', 'maint.report.view', 'maint.oversight.view',
  ],
  MAINTENANCE_MANAGER: [
    'maint.ticket.create', 'maint.ticket.view.own', 'maint.queue.view', 'maint.triage',
    'maint.assign', 'maint.work', 'maint.parts.request', 'maint.parts.approve',
    'maint.config', 'maint.report.view', 'maint.oversight.view',
  ],
  FACILITIES_OFFICER: [
    'maint.ticket.create', 'maint.ticket.view.own', 'maint.queue.view', 'maint.triage',
    'maint.assign', 'maint.work', 'maint.parts.request', 'maint.parts.approve',
    'maint.config', 'maint.report.view', 'maint.oversight.view',
  ],
  MAINTENANCE_STAFF: [...REQUESTER, 'maint.work', 'maint.parts.request'],
  IT_SUPPORT: [...REQUESTER, 'maint.work', 'maint.parts.request'],
  PRINCIPAL: [...REQUESTER, 'maint.queue.view', 'maint.report.view', 'maint.oversight.view'],
  MANAGEMENT: [...REQUESTER, 'maint.report.view', 'maint.oversight.view'],
  HOD: [...REQUESTER, 'maint.oversight.view', 'maint.report.view'],
};

export function maintPermissionsForRole(role: string): MaintPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_PERMISSIONS.MANAGEMENT;
  return ROLE_PERMISSIONS[role] ?? [...REQUESTER];
}

export function hasMaintPermission(actor: MaintActor, permission: MaintPermission): boolean {
  if (actor.kind === 'STUDENT') {
    return permission === 'maint.ticket.create' || permission === 'maint.ticket.view.own';
  }
  if (isAdminRole(actor.role)) return true;
  return maintPermissionsForRole(actor.role).includes(permission);
}

export function assertMaintPermission(actor: MaintActor, permission: MaintPermission) {
  if (!hasMaintPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this maintenance action');
  }
}

/** A back-office operator can see/act beyond their own tickets. */
export function isOperator(actor: MaintActor): boolean {
  return hasMaintPermission(actor, 'maint.queue.view') || hasMaintPermission(actor, 'maint.work');
}

/** Manager-tier: owns the central queue, routing, assignment, config. */
export function isManager(actor: MaintActor): boolean {
  return hasMaintPermission(actor, 'maint.triage') && hasMaintPermission(actor, 'maint.assign');
}

/** A worker (technician / IT support) — sees only assigned/team tickets. */
export function isWorkerOnly(actor: MaintActor): boolean {
  return hasMaintPermission(actor, 'maint.work') && !isManager(actor);
}

// ── Leadership resolution (reuse academic_leadership_assignments) ────────
export async function hodDepartmentIds(actor: MaintActor): Promise<number[]> {
  if (actor.kind !== 'FACULTY' || !actor.facultyUserId) return [];
  const rows = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, leadership_role: 'HOD', status: 'ACTIVE', employee_id: actor.facultyUserId })
    .whereNotNull('department_id')
    .select('department_id');
  const ids = rows.map((r) => Number(r.department_id));
  if (actor.role === 'HOD' && actor.departmentId && !ids.includes(actor.departmentId)) {
    ids.push(actor.departmentId);
  }
  return [...new Set(ids)];
}

export async function isPrincipal(actor: MaintActor): Promise<boolean> {
  if (actor.role === 'PRINCIPAL') return true;
  if (actor.kind !== 'FACULTY' || !actor.facultyUserId) return false;
  const row = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, leadership_role: 'PRINCIPAL', status: 'ACTIVE', employee_id: actor.facultyUserId })
    .first();
  return Boolean(row);
}

/** Team ids this actor belongs to (as technician / support agent). */
export async function actorTeamIds(actor: MaintActor): Promise<number[]> {
  if (actor.kind !== 'FACULTY' || !actor.facultyUserId) return [];
  const rows = await db('service_team_members')
    .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId, status: 'ACTIVE' })
    .select('team_id');
  return [...new Set(rows.map((r) => Number(r.team_id)))];
}

/**
 * Enforce that the actor may VIEW a ticket row and return the visibility mode.
 *  - 'FULL'      → operator/manager/assignee: internal notes visible
 *  - 'REQUESTER' → the requester (or oversight): requester-visible content only
 * Throws 403 when the actor has no legitimate relationship to the ticket.
 */
export async function assertTicketVisibility(
  actor: MaintActor,
  ticket: Record<string, unknown>,
): Promise<'FULL' | 'REQUESTER'> {
  if (Number(ticket.college_id) !== actor.collegeId) {
    throw new AppError(403, 'You do not have access to this ticket');
  }
  // Own ticket?
  const own = actor.kind === 'FACULTY'
    ? Number(ticket.requester_faculty_id) === actor.facultyUserId
    : Number(ticket.requester_student_id) === actor.studentId;

  if (isManager(actor)) return 'FULL';

  // Assigned technician or member of the owning team → full.
  if (hasMaintPermission(actor, 'maint.work') && actor.kind === 'FACULTY') {
    if (ticket.assigned_to && Number(ticket.assigned_to) === actor.facultyUserId) return 'FULL';
    if (ticket.team_id) {
      const teams = await actorTeamIds(actor);
      if (teams.includes(Number(ticket.team_id))) return 'FULL';
    }
  }

  if (own) return 'REQUESTER';

  // Oversight: HOD (department), Principal/Management (college).
  if (await isPrincipal(actor)) return 'REQUESTER';
  if (hasMaintPermission(actor, 'maint.oversight.view')) {
    if (actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN' || actor.role === 'PRINCIPAL') return 'REQUESTER';
    if (actor.role === 'HOD') {
      const depts = await hodDepartmentIds(actor);
      if (ticket.department_id && depts.includes(Number(ticket.department_id))) return 'REQUESTER';
    }
  }

  throw new AppError(403, 'You do not have access to this ticket');
}

/** Assert the actor can perform work actions on a specific ticket (assignee or team member or manager). */
export async function assertCanWork(actor: MaintActor, ticket: Record<string, unknown>) {
  if (Number(ticket.college_id) !== actor.collegeId) throw new AppError(403, 'You do not have access to this ticket');
  if (isManager(actor)) return;
  if (actor.kind !== 'FACULTY' || !hasMaintPermission(actor, 'maint.work')) {
    throw new AppError(403, 'You cannot work on this ticket');
  }
  if (ticket.assigned_to && Number(ticket.assigned_to) === actor.facultyUserId) return;
  if (ticket.team_id) {
    const teams = await actorTeamIds(actor);
    if (teams.includes(Number(ticket.team_id))) return;
  }
  throw new AppError(403, 'This ticket is not assigned to you or your team');
}
