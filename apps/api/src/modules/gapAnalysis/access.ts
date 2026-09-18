import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type GapActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

export type GapOwnership = {
  collegeId: number;
  createdBy: number;
  departmentId?: number | null;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function canManageAllGapAnalyses(role: string) {
  return isAdminRole(role);
}

export function canViewCollegeGapAnalyses(role: string) {
  return (
    isSuperAdmin(role) ||
    isAdminRole(role) ||
    role === 'HOD' ||
    role === 'NBA_COORDINATOR' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'PRINCIPAL'
  );
}

export function decideGapAnalysisAccess(actor: GapActor, analysis: GapOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (analysis.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllGapAnalyses(actor.role)) return 'ALLOW';
  if (canViewCollegeGapAnalyses(actor.role)) {
    if (actor.role === 'HOD') {
      if (!actor.departmentId || analysis.departmentId == null) return 'ALLOW';
      return actor.departmentId === analysis.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    return 'ALLOW';
  }
  if (analysis.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function decideGapAnalysisMutateAccess(actor: GapActor, analysis: GapOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (analysis.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllGapAnalyses(actor.role)) return 'ALLOW';
  if (analysis.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

async function loadOwnership(analysisId: number): Promise<(GapOwnership & { id: number; status: string }) | null> {
  const row = await db('faculty_gap_analyses as a')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .where({ 'a.id': analysisId })
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

export async function assertGapAnalysisAccess(
  analysisId: number,
  actor: GapActor,
  mode: 'read' | 'mutate' = 'read',
) {
  if (!Number.isFinite(analysisId)) throw new AppError(404, 'Gap Analysis not found');
  const analysis = await loadOwnership(analysisId);
  if (!analysis) throw new AppError(404, 'Gap Analysis not found');

  const decision =
    mode === 'mutate'
      ? decideGapAnalysisMutateAccess(actor, analysis)
      : decideGapAnalysisAccess(actor, analysis);

  if (decision === 'ALLOW') return analysis;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Gap Analysis not found');
  throw new AppError(403, "You don't have access to this Gap Analysis.", undefined, 'GAP_ANALYSIS_FORBIDDEN');
}
