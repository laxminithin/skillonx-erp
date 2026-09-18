import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

export type AttainmentActor = {
  facultyUserId: number;
  collegeId: number;
  role: string;
  departmentId?: number | null;
};

export type OwnedRecord = {
  collegeId: number;
  createdBy: number;
  departmentId?: number | null;
};

export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';

export function canManageAllAttainment(role: string) {
  return isAdminRole(role);
}

export function canViewCollegeAttainment(role: string) {
  return (
    isSuperAdmin(role) ||
    isAdminRole(role) ||
    role === 'HOD' ||
    role === 'NBA_COORDINATOR' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'PRINCIPAL' ||
    role === 'MANAGEMENT' ||
    role === 'CHAIRMAN'
  );
}

export function decideAttainmentAccess(actor: AttainmentActor, record: OwnedRecord): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (record.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllAttainment(actor.role)) return 'ALLOW';
  if (canViewCollegeAttainment(actor.role)) {
    if (actor.role === 'HOD') {
      if (!actor.departmentId || record.departmentId == null) return 'ALLOW';
      return actor.departmentId === record.departmentId ? 'ALLOW' : 'FORBIDDEN';
    }
    return 'ALLOW';
  }
  if (record.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function decideAttainmentMutateAccess(actor: AttainmentActor, record: OwnedRecord): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (record.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (canManageAllAttainment(actor.role)) return 'ALLOW';
  if (record.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

async function loadRun(runId: number) {
  const row = await db('attainment_runs as r')
    .leftJoin('courses as c', 'c.id', 'r.course_id')
    .where({ 'r.id': runId })
    .select(
      'r.id',
      'r.college_id as collegeId',
      'r.created_by as createdBy',
      'r.department_id as departmentId',
      'r.status',
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
    status: String(row.status),
  };
}

export async function assertRunAccess(runId: number, actor: AttainmentActor, mode: 'read' | 'mutate' = 'read') {
  if (!Number.isFinite(runId)) throw new AppError(404, 'Attainment run not found');
  const record = await loadRun(runId);
  if (!record) throw new AppError(404, 'Attainment run not found');
  const decision = mode === 'mutate' ? decideAttainmentMutateAccess(actor, record) : decideAttainmentAccess(actor, record);
  if (decision === 'ALLOW') return record;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Attainment run not found');
  throw new AppError(403, "You don't have access to this attainment record.", undefined, 'ATTAINMENT_FORBIDDEN');
}

async function loadCycle(cycleId: number) {
  const row = await db('continuous_improvement_cycles as x')
    .leftJoin('courses as c', 'c.id', 'x.course_id')
    .where({ 'x.id': cycleId })
    .select(
      'x.id',
      'x.college_id as collegeId',
      'x.created_by as createdBy',
      'x.department_id as departmentId',
      'x.state',
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
    state: String(row.state),
  };
}

export async function assertCycleAccess(
  cycleId: number,
  actor: AttainmentActor,
  mode: 'read' | 'mutate' | 'review' = 'read',
) {
  if (!Number.isFinite(cycleId)) throw new AppError(404, 'Improvement cycle not found');
  const record = await loadCycle(cycleId);
  if (!record) throw new AppError(404, 'Improvement cycle not found');
  const decision =
    mode === 'mutate'
      ? decideAttainmentMutateAccess(actor, record)
      : mode === 'review'
        ? decideAttainmentAccess(actor, record)
        : decideAttainmentAccess(actor, record);
  if (decision === 'ALLOW') return record;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Improvement cycle not found');
  throw new AppError(403, "You don't have access to this improvement cycle.", undefined, 'ATTAINMENT_FORBIDDEN');
}

async function loadSheet(sheetId: number) {
  const row = await db('assessment_mark_sheets as s')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .where({ 's.id': sheetId })
    .select(
      's.id',
      's.college_id as collegeId',
      's.created_by as createdBy',
      's.department_id as departmentId',
      's.status',
      's.frozen',
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
    status: String(row.status),
    frozen: Boolean(row.frozen),
  };
}

export async function assertSheetAccess(sheetId: number, actor: AttainmentActor, mode: 'read' | 'mutate' = 'read') {
  if (!Number.isFinite(sheetId)) throw new AppError(404, 'Mark sheet not found');
  const record = await loadSheet(sheetId);
  if (!record) throw new AppError(404, 'Mark sheet not found');
  const decision = mode === 'mutate' ? decideAttainmentMutateAccess(actor, record) : decideAttainmentAccess(actor, record);
  if (decision === 'ALLOW') return record;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Mark sheet not found');
  throw new AppError(403, "You don't have access to this mark sheet.", undefined, 'ATTAINMENT_FORBIDDEN');
}
