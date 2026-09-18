import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type CbsActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

export type CbsOwnership = {
  collegeId: number;
  createdBy: number;
  departmentId?: number | null;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function canManageAllCbsPlans(role: string) {
  return isAdminRole(role);
}

export function canViewCollegeCbsPlans(role: string) {
  return (
    isSuperAdmin(role) ||
    isAdminRole(role) ||
    role === 'HOD' ||
    role === 'NBA_COORDINATOR' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'PRINCIPAL'
  );
}

export function decideCbsPlanAccess(actor: CbsActor, plan: CbsOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (plan.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllCbsPlans(actor.role)) return 'ALLOW';
  if (canViewCollegeCbsPlans(actor.role)) {
    if (actor.role === 'HOD') {
      if (!actor.departmentId || plan.departmentId == null) return 'ALLOW';
      return actor.departmentId === plan.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    return 'ALLOW';
  }
  if (plan.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function decideCbsPlanMutateAccess(actor: CbsActor, plan: CbsOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (plan.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllCbsPlans(actor.role)) return 'ALLOW';
  if (plan.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

async function loadOwnership(planId: number): Promise<(CbsOwnership & { id: number; status: string }) | null> {
  const row = await db('faculty_cbs_plans as a')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .where({ 'a.id': planId })
    .select(
      'a.id',
      'a.college_id as collegeId',
      'a.created_by as createdBy',
      'a.department_id as departmentId',
      'a.status',
      'c.department_id as courseDepartmentId',
    )
    .first();
  if (!row) return null;
  return {
    id: Number(row.id),
    collegeId: Number(row.collegeId),
    createdBy: Number(row.createdBy),
    departmentId:
      row.departmentId != null
        ? Number(row.departmentId)
        : row.courseDepartmentId != null
          ? Number(row.courseDepartmentId)
          : null,
    status: String(row.status || 'DRAFT'),
  };
}

export async function assertCbsPlanAccess(planId: number, actor: CbsActor, mode: 'read' | 'mutate' = 'read') {
  if (!Number.isFinite(planId)) throw new AppError(404, 'Beyond-Syllabus plan not found');
  const plan = await loadOwnership(planId);
  if (!plan) throw new AppError(404, 'Beyond-Syllabus plan not found');

  const decision =
    mode === 'mutate' ? decideCbsPlanMutateAccess(actor, plan) : decideCbsPlanAccess(actor, plan);

  if (decision === 'ALLOW') return plan;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Beyond-Syllabus plan not found');
  throw new AppError(403, "You don't have access to this Beyond-Syllabus plan.", undefined, 'CBS_FORBIDDEN');
}
