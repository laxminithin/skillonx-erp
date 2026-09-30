import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { IqacActor, IqacPermission } from './types.js';

/**
 * Least-privilege RBAC for Campus OS Phase 7 (IQAC & Accreditation),
 * following the exact per-module pattern used elsewhere (`research/access.ts`,
 * `facultyProfile/access.ts`). Both `IQAC_COORDINATOR` and `NBA_COORDINATOR`
 * already exist as roles (`apps/api/src/types/domain.ts`) — no new roles are
 * introduced (prompt §57).
 *
 * - IQAC_COORDINATOR: owns framework/metric/cycle/evidence/action-plan/
 *   audit/committee/compliance day-to-day management. Deliberately CANNOT
 *   approve a cycle (`iqac.cycle.approve`) — approval is a Principal/
 *   Management/Admin sign-off, a genuine two-party control (prompt §58).
 * - NBA_COORDINATOR: narrower — view frameworks/metrics, submit evidence,
 *   manage action plans, view audits. No cycle/committee/compliance manage.
 * - PRINCIPAL/MANAGEMENT: institution-wide view + cycle approval (Principal
 *   reviews/approves/freezes per policy; Management gets governance insight,
 *   neither performs routine evidence entry — prompt §58-59).
 * - HOD: department-scoped metric/evidence/action-plan/audit view+contribute
 *   (scoping enforced by the department-membership helpers below, mirroring
 *   `research/access.ts`'s `hodDepartmentIds` convention exactly).
 * - FACULTY: can submit evidence and manage action plans assigned to them
 *   (ownership enforced in service.ts, not here).
 * - COLLEGE_ADMIN/SUPER_ADMIN: full manage, matching the "admin can always
 *   act" convention `isAdminRole` already provides elsewhere.
 */
const ROLE_PERMISSIONS: Record<string, IqacPermission[]> = {
  SUPER_ADMIN: [
    'iqac.framework.manage', 'iqac.framework.view', 'iqac.metric.manage', 'iqac.metric.override', 'iqac.metric.view',
    'iqac.cycle.manage', 'iqac.cycle.approve', 'iqac.evidence.submit', 'iqac.evidence.verify', 'iqac.evidence.view',
    'iqac.actionPlan.manage', 'iqac.actionPlan.close', 'iqac.actionPlan.reopen', 'iqac.audit.manage', 'iqac.audit.view',
    'iqac.committee.manage', 'iqac.committee.view', 'iqac.meeting.manage', 'iqac.compliance.manage', 'iqac.compliance.view',
    'iqac.dashboard.view',
  ],
  COLLEGE_ADMIN: [
    'iqac.framework.manage', 'iqac.framework.view', 'iqac.metric.manage', 'iqac.metric.override', 'iqac.metric.view',
    'iqac.cycle.manage', 'iqac.cycle.approve', 'iqac.evidence.submit', 'iqac.evidence.verify', 'iqac.evidence.view',
    'iqac.actionPlan.manage', 'iqac.actionPlan.close', 'iqac.actionPlan.reopen', 'iqac.audit.manage', 'iqac.audit.view',
    'iqac.committee.manage', 'iqac.committee.view', 'iqac.meeting.manage', 'iqac.compliance.manage', 'iqac.compliance.view',
    'iqac.dashboard.view',
  ],
  IQAC_COORDINATOR: [
    'iqac.framework.manage', 'iqac.framework.view', 'iqac.metric.manage', 'iqac.metric.override', 'iqac.metric.view',
    'iqac.cycle.manage', 'iqac.evidence.submit', 'iqac.evidence.verify', 'iqac.evidence.view',
    'iqac.actionPlan.manage', 'iqac.actionPlan.close', 'iqac.actionPlan.reopen', 'iqac.audit.manage', 'iqac.audit.view',
    'iqac.committee.manage', 'iqac.committee.view', 'iqac.meeting.manage', 'iqac.compliance.manage', 'iqac.compliance.view',
    'iqac.dashboard.view',
  ],
  NBA_COORDINATOR: [
    'iqac.framework.view', 'iqac.metric.manage', 'iqac.metric.view', 'iqac.evidence.submit', 'iqac.evidence.view',
    'iqac.actionPlan.manage', 'iqac.audit.view', 'iqac.committee.view', 'iqac.compliance.view', 'iqac.dashboard.view',
  ],
  PRINCIPAL: [
    'iqac.framework.view', 'iqac.metric.view', 'iqac.cycle.approve', 'iqac.evidence.view', 'iqac.evidence.verify',
    'iqac.audit.view', 'iqac.committee.view', 'iqac.compliance.view', 'iqac.dashboard.view',
  ],
  MANAGEMENT: ['iqac.framework.view', 'iqac.metric.view', 'iqac.evidence.view', 'iqac.audit.view', 'iqac.committee.view', 'iqac.compliance.view', 'iqac.dashboard.view'],
  CHAIRMAN: ['iqac.framework.view', 'iqac.metric.view', 'iqac.evidence.view', 'iqac.audit.view', 'iqac.committee.view', 'iqac.compliance.view', 'iqac.dashboard.view'],
  HOD: [
    'iqac.metric.view', 'iqac.metric.manage', 'iqac.evidence.submit', 'iqac.evidence.view',
    'iqac.actionPlan.manage', 'iqac.audit.view', 'iqac.dashboard.view',
  ],
  FACULTY: ['iqac.metric.view', 'iqac.evidence.submit', 'iqac.evidence.view', 'iqac.actionPlan.manage', 'iqac.dashboard.view'],
};

export function iqacPermissionsForRole(role: string): IqacPermission[] {
  if (isSuperAdmin(role)) return ROLE_PERMISSIONS.SUPER_ADMIN;
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasIqacPermission(actor: IqacActor, permission: IqacPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return iqacPermissionsForRole(actor.role).includes(permission);
}

export function assertIqacPermission(actor: IqacActor, permission: IqacPermission) {
  if (!hasIqacPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this IQAC/accreditation action');
  }
}

/**
 * Departments the actor is HOD of. Same canonical source used across the
 * codebase (mirrors `research/access.ts`'s `hodDepartmentIds` exactly):
 * prefers Academic Leadership enrichment, falls back to the legacy
 * `role === 'HOD'` + `departmentId` representation.
 */
export function hodDepartmentIds(actor: IqacActor): number[] {
  if (actor.hodDepartmentIds != null) return actor.hodDepartmentIds.map(Number);
  if (actor.role === 'HOD' && actor.departmentId != null) return [Number(actor.departmentId)];
  return [];
}

export function isHodOfDepartment(actor: IqacActor, departmentId: number | null): boolean {
  if (departmentId == null) return false;
  return hodDepartmentIds(actor).includes(Number(departmentId));
}

export function isInstitutionWideViewer(role: string): boolean {
  return ['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'IQAC_COORDINATOR', 'NBA_COORDINATOR'].includes(role);
}

/**
 * Can the actor view/act on this department-scoped record (metric, evidence,
 * action plan, or audit row that carries a departmentId)? Admins and
 * institution-tier roles: always. HOD: only their own department(s). Plain
 * FACULTY/others: only when explicitly the assigned owner (checked by the
 * caller, not here — ownership is record-shaped, not role-shaped).
 */
export function canActOnDepartmentScopedRecord(actor: IqacActor, departmentId: number | null): boolean {
  if (isAdminRole(actor.role)) return true;
  if (isInstitutionWideViewer(actor.role)) return true;
  if (departmentId == null) return false;
  return isHodOfDepartment(actor, departmentId);
}

/**
 * Hard self-verification guard: the person who submitted a piece of evidence
 * cannot be the one who verifies it, even if their role would otherwise
 * permit `iqac.evidence.verify` (prompt §63). A named, tested requirement.
 */
export async function assertNotSelfVerifying(actor: IqacActor, evidenceId: number) {
  const evidence = await db('iqac_evidence').where({ id: evidenceId }).first();
  if (evidence && Number(evidence.submitted_by) === Number(actor.facultyUserId)) {
    throw new AppError(403, 'You cannot verify evidence you submitted yourself (self-verification is not allowed)');
  }
}
