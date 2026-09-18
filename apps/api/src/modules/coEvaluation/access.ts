import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type CoEvalActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

export type CoEvalOwnership = {
  collegeId: number;
  createdBy: number;
  departmentId?: number | null;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function canManageAllCoEvaluations(role: string) {
  return isAdminRole(role);
}

export function canViewCollegeCoEvaluations(role: string) {
  return (
    isSuperAdmin(role) ||
    isAdminRole(role) ||
    role === 'HOD' ||
    role === 'NBA_COORDINATOR' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'PRINCIPAL'
  );
}

export function decideCoEvaluationAccess(actor: CoEvalActor, evaluation: CoEvalOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (evaluation.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllCoEvaluations(actor.role)) return 'ALLOW';
  if (canViewCollegeCoEvaluations(actor.role)) {
    if (actor.role === 'HOD') {
      if (!actor.departmentId || evaluation.departmentId == null) return 'ALLOW';
      return actor.departmentId === evaluation.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    return 'ALLOW';
  }
  if (evaluation.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function decideCoEvaluationMutateAccess(
  actor: CoEvalActor,
  evaluation: CoEvalOwnership,
): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (evaluation.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllCoEvaluations(actor.role)) return 'ALLOW';
  if (evaluation.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

async function loadOwnership(
  evaluationId: number,
): Promise<(CoEvalOwnership & { id: number; status: string }) | null> {
  const row = await db('faculty_co_evaluations as e')
    .leftJoin('courses as c', 'c.id', 'e.course_id')
    .where({ 'e.id': evaluationId })
    .select(
      'e.id',
      'e.college_id as collegeId',
      'e.created_by as createdBy',
      'e.department_id as departmentId',
      'e.status',
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

export async function assertCoEvaluationAccess(
  evaluationId: number,
  actor: CoEvalActor,
  mode: 'read' | 'mutate' = 'read',
) {
  if (!Number.isFinite(evaluationId)) throw new AppError(404, 'CO Evaluation not found');
  const evaluation = await loadOwnership(evaluationId);
  if (!evaluation) throw new AppError(404, 'CO Evaluation not found');

  const decision =
    mode === 'mutate'
      ? decideCoEvaluationMutateAccess(actor, evaluation)
      : decideCoEvaluationAccess(actor, evaluation);

  if (decision === 'ALLOW') return evaluation;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'CO Evaluation not found');
  throw new AppError(403, "You don't have access to this CO Evaluation.", undefined, 'CO_EVALUATION_FORBIDDEN');
}
