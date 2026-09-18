import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type AssignmentActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
};

export type AssignmentOwnership = {
  collegeId: number;
  createdBy: number;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function decideAssignmentAccess(
  actor: AssignmentActor,
  assignment: AssignmentOwnership,
): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (assignment.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (isAdminRole(actor.role)) return 'ALLOW';
  if (assignment.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function canManageAllAssignments(role: string): boolean {
  return isAdminRole(role);
}

async function loadOwnership(assignmentId: number): Promise<AssignmentOwnership | null> {
  const row = await db('assignments')
    .where({ id: assignmentId })
    .whereNull('deleted_at')
    .select('college_id as collegeId', 'created_by as createdBy')
    .first();
  if (!row) return null;
  return { collegeId: Number(row.collegeId), createdBy: Number(row.createdBy) };
}

export async function assertAssignmentAccessForActor(
  assignmentId: number,
  actor: AssignmentActor,
): Promise<AssignmentOwnership> {
  if (!Number.isFinite(assignmentId)) throw new AppError(404, 'Assignment not found');
  const ownership = await loadOwnership(assignmentId);
  if (!ownership) throw new AppError(404, 'Assignment not found');

  const decision = decideAssignmentAccess(actor, ownership);
  if (decision === 'ALLOW') return ownership;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Assignment not found');
  throw new AppError(403, "You don't have access to this assignment.", undefined, 'ASSIGNMENT_FORBIDDEN');
}
