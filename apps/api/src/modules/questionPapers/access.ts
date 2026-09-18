import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type QpActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

export type PaperOwnership = {
  collegeId: number;
  createdBy: number;
  departmentId?: number | null;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function canManageAllInternalPapers(role: string) {
  return isAdminRole(role);
}

export function canViewCollegeInternalPapers(role: string) {
  return (
    isSuperAdmin(role) ||
    isAdminRole(role) ||
    role === 'HOD' ||
    role === 'NBA_COORDINATOR' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'PRINCIPAL'
  );
}

export function canViewPreviousYearLibrary(role: string) {
  return Boolean(role);
}

export function decideInternalPaperAccess(actor: QpActor, paper: PaperOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (paper.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllInternalPapers(actor.role)) return 'ALLOW';
  if (canViewCollegeInternalPapers(actor.role)) {
    if (actor.role === 'HOD') {
      if (!actor.departmentId || paper.departmentId == null) return 'ALLOW';
      return actor.departmentId === paper.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    return 'ALLOW';
  }
  if (paper.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function decideInternalPaperMutateAccess(actor: QpActor, paper: PaperOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (paper.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllInternalPapers(actor.role)) return 'ALLOW';
  if (paper.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

async function loadOwnership(paperId: number): Promise<(PaperOwnership & { id: number; status: string }) | null> {
  const row = await db('internal_question_papers as p')
    .leftJoin('courses as c', 'c.id', 'p.course_id')
    .where({ 'p.id': paperId })
    .select(
      'p.id',
      'p.college_id as collegeId',
      'p.created_by as createdBy',
      'p.department_id as departmentId',
      'p.status',
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

export async function assertInternalPaperAccess(paperId: number, actor: QpActor, mode: 'read' | 'mutate' = 'read') {
  if (!Number.isFinite(paperId)) throw new AppError(404, 'Internal question paper not found');
  const paper = await loadOwnership(paperId);
  if (!paper) throw new AppError(404, 'Internal question paper not found');
  const decision =
    mode === 'mutate' ? decideInternalPaperMutateAccess(actor, paper) : decideInternalPaperAccess(actor, paper);
  if (decision === 'ALLOW') return paper;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Internal question paper not found');
  throw new AppError(403, "You don't have access to this internal question paper.", undefined, 'QP_FORBIDDEN');
}
