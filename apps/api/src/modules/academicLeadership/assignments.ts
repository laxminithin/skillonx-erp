import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { recordHrAudit } from '../hr/audit.js';
import type { HrActor } from '../hr/types.js';
import {
  asDateOnly,
  rangesOverlap,
  type LeadershipAssignment,
  type LeadershipRole,
} from './types.js';
import { leadershipSchemaReady, serializeAssignment, todayISO } from './leadership.js';

type Row = Record<string, unknown>;

async function requireSchema() {
  if (!(await leadershipSchemaReady())) {
    throw new AppError(503, 'Academic leadership schema is not ready');
  }
}

function assignmentQuery() {
  return db('academic_leadership_assignments as a')
    .leftJoin('employees as e', 'e.id', 'a.employee_id')
    .leftJoin('departments as d', 'd.id', 'a.department_id')
    .select(
      'a.*',
      'e.display_name as employee_name',
      'e.employee_number as employee_number',
      'e.faculty_user_id as faculty_user_id',
      'd.name as department_name',
      'd.code as department_code',
    );
}

export async function listAssignments(
  collegeId: number,
  filters?: { role?: LeadershipRole; departmentId?: number | null; status?: string; asOf?: string },
): Promise<LeadershipAssignment[]> {
  await requireSchema();
  let q = assignmentQuery().where('a.college_id', collegeId);
  if (filters?.role) q = q.andWhere('a.leadership_role', filters.role);
  if (filters?.departmentId != null) q = q.andWhere('a.department_id', filters.departmentId);
  if (filters?.status) q = q.andWhere('a.status', filters.status);
  const rows = await q.orderBy('a.effective_from', 'desc');
  return rows.map((r: Row) => serializeAssignment(r));
}

export async function getAssignment(id: number, collegeId: number): Promise<LeadershipAssignment> {
  await requireSchema();
  const row = await assignmentQuery().where({ 'a.id': id, 'a.college_id': collegeId }).first();
  if (!row) throw new AppError(404, 'Leadership assignment not found');
  return serializeAssignment(row);
}

async function assertEmployeeInCollege(employeeId: number, collegeId: number) {
  const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
  if (!emp) throw new AppError(404, 'Employee not found');
  if (!['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'].includes(String(emp.employment_status))) {
    throw new AppError(400, 'Employee is not in an active employment status for leadership assignment');
  }
  return emp;
}

async function findOverlaps(params: {
  trx: import('knex').Knex | import('knex').Knex.Transaction;
  collegeId: number;
  role: LeadershipRole;
  departmentId: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  excludeId?: number;
}) {
  let q = params.trx('academic_leadership_assignments')
    .where({
      college_id: params.collegeId,
      leadership_role: params.role,
      status: 'ACTIVE',
    })
    .forUpdate();
  if (params.role === 'HOD') {
    q = q.andWhere('department_id', params.departmentId);
  } else {
    q = q.whereNull('department_id');
  }
  if (params.excludeId) q = q.andWhereNot('id', params.excludeId);
  const rows = await q;
  return rows.filter((row: Row) =>
    rangesOverlap(
      asDateOnly(row.effective_from),
      row.effective_to ? asDateOnly(row.effective_to) : null,
      params.effectiveFrom,
      params.effectiveTo,
    ),
  );
}

function leadershipLockKey(collegeId: number, role: LeadershipRole, departmentId: number | null) {
  return role === 'HOD'
    ? `academic-leadership:${collegeId}:HOD:${departmentId ?? 'none'}`
    : `academic-leadership:${collegeId}:PRINCIPAL`;
}

export async function createAssignment(
  actor: HrActor,
  input: {
    employeeId: number;
    role: LeadershipRole;
    departmentId?: number | null;
    effectiveFrom: string;
    effectiveTo?: string | null;
    remarks?: string | null;
  },
) {
  await requireSchema();
  if (!isAdminRole(actor.role)) {
    throw new AppError(403, 'Only college administrators can assign academic leadership');
  }
  if (input.role === 'HOD' && !input.departmentId) {
    throw new AppError(400, 'HOD assignment requires a department', undefined, 'HOD_DEPARTMENT_REQUIRED');
  }
  if (input.role === 'PRINCIPAL' && input.departmentId) {
    throw new AppError(400, 'Principal assignment is college-scoped and cannot have a department', undefined, 'PRINCIPAL_DEPARTMENT_FORBIDDEN');
  }
  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
    throw new AppError(400, 'effectiveTo cannot be before effectiveFrom');
  }

  const emp = await assertEmployeeInCollege(input.employeeId, actor.collegeId);
  if (input.departmentId) {
    const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
    if (!dept) throw new AppError(404, 'Department not found');
  }

  const created = await db.transaction(async (trx) => {
    const lockKey = leadershipLockKey(actor.collegeId, input.role, input.role === 'HOD' ? input.departmentId! : null);
    await trx.raw('select get_lock(?, 10)', [lockKey]);
    try {
      const overlaps = await findOverlaps({
        trx,
        collegeId: actor.collegeId,
        role: input.role,
        departmentId: input.role === 'HOD' ? input.departmentId! : null,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
      });
      if (overlaps.length) {
        throw new AppError(
          409,
          input.role === 'HOD'
            ? 'An active HOD already exists for this department in the overlapping date range'
            : 'An active Principal already exists for this college in the overlapping date range',
          { overlappingIds: overlaps.map((r: Row) => Number(r.id)) },
          input.role === 'HOD' ? 'DUPLICATE_ACTIVE_HOD' : 'DUPLICATE_ACTIVE_PRINCIPAL',
        );
      }

      const [id] = await trx('academic_leadership_assignments').insert({
        college_id: actor.collegeId,
        employee_id: input.employeeId,
        leadership_role: input.role,
        department_id: input.role === 'HOD' ? input.departmentId : null,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo ?? null,
        status: 'ACTIVE',
        created_by: actor.facultyUserId,
        updated_by: actor.facultyUserId,
        remarks: input.remarks ?? null,
      });
      return Number(id);
    } finally {
      await trx.raw('select release_lock(?)', [lockKey]).catch(() => undefined);
    }
  });

  await recordHrAudit({
    actor,
    action: input.role === 'HOD' ? 'HOD_ASSIGNED' : 'PRINCIPAL_ASSIGNED',
    entityType: 'academic_leadership_assignments',
    entityId: created,
    after: { employeeId: input.employeeId, role: input.role, departmentId: input.departmentId ?? null, effectiveFrom: input.effectiveFrom },
    reason: input.remarks ?? null,
  });

  void emp;
  return getAssignment(created, actor.collegeId);
}

export async function updateAssignment(
  actor: HrActor,
  assignmentId: number,
  input: { effectiveTo?: string | null; status?: 'ACTIVE' | 'ENDED' | 'REVOKED'; remarks?: string | null },
) {
  await requireSchema();
  if (!isAdminRole(actor.role)) {
    throw new AppError(403, 'Only college administrators can change academic leadership');
  }
  const existing = await db('academic_leadership_assignments')
    .where({ id: assignmentId, college_id: actor.collegeId })
    .first();
  if (!existing) throw new AppError(404, 'Leadership assignment not found');

  const nextTo = input.effectiveTo !== undefined ? input.effectiveTo : (existing.effective_to ? asDateOnly(existing.effective_to) : null);
  const nextStatus = input.status ?? String(existing.status);
  if (nextTo && nextTo < asDateOnly(existing.effective_from)) {
    throw new AppError(400, 'effectiveTo cannot be before effectiveFrom');
  }

  await db.transaction(async (trx) => {
    const locked = await trx('academic_leadership_assignments').where({ id: assignmentId }).forUpdate().first();
    if (!locked) throw new AppError(404, 'Leadership assignment not found');

    if (nextStatus === 'ACTIVE') {
      const role = String(locked.leadership_role) as LeadershipRole;
      const lockKey = leadershipLockKey(actor.collegeId, role, role === 'HOD' ? Number(locked.department_id) : null);
      await trx.raw('select get_lock(?, 10)', [lockKey]);
      try {
        const overlaps = await findOverlaps({
          trx,
          collegeId: actor.collegeId,
          role,
          departmentId: role === 'HOD' ? Number(locked.department_id) : null,
          effectiveFrom: asDateOnly(locked.effective_from),
          effectiveTo: nextTo,
          excludeId: assignmentId,
        });
        if (overlaps.length) {
          throw new AppError(
            409,
            'Updated assignment overlaps another active leadership assignment',
            { overlappingIds: overlaps.map((r: Row) => Number(r.id)) },
            role === 'HOD' ? 'DUPLICATE_ACTIVE_HOD' : 'DUPLICATE_ACTIVE_PRINCIPAL',
          );
        }
      } finally {
        await trx.raw('select release_lock(?)', [lockKey]).catch(() => undefined);
      }
    }

    await trx('academic_leadership_assignments').where({ id: assignmentId }).update({
      effective_to: nextTo,
      status: nextStatus,
      remarks: input.remarks !== undefined ? input.remarks : locked.remarks,
      updated_by: actor.facultyUserId,
      updated_at: trx.fn.now(),
    });
  });

  await recordHrAudit({
    actor,
    action: nextStatus === 'ACTIVE' ? 'LEADERSHIP_ASSIGNMENT_UPDATED' : nextStatus === 'REVOKED' ? 'LEADERSHIP_ASSIGNMENT_REVOKED' : 'LEADERSHIP_ASSIGNMENT_ENDED',
    entityType: 'academic_leadership_assignments',
    entityId: assignmentId,
    before: { status: existing.status, effectiveTo: existing.effective_to },
    after: { status: nextStatus, effectiveTo: nextTo },
    reason: input.remarks ?? null,
  });

  return getAssignment(assignmentId, actor.collegeId);
}

export async function endAssignment(actor: HrActor, assignmentId: number, effectiveTo: string, remarks?: string | null) {
  return updateAssignment(actor, assignmentId, { effectiveTo, status: effectiveTo < todayISO() ? 'ENDED' : 'ACTIVE', remarks });
}

export async function listActiveHodEmployees(collegeId: number, departmentId: number, asOf: string) {
  if (!(await leadershipSchemaReady())) return [];
  const rows = await db('academic_leadership_assignments')
    .where({
      college_id: collegeId,
      leadership_role: 'HOD',
      department_id: departmentId,
      status: 'ACTIVE',
    })
    .andWhere('effective_from', '<=', asOf)
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', asOf));
  return rows.map((r: Row) => Number(r.employee_id));
}

export async function listActivePrincipalEmployees(collegeId: number, asOf: string) {
  if (!(await leadershipSchemaReady())) return [];
  const rows = await db('academic_leadership_assignments')
    .where({
      college_id: collegeId,
      leadership_role: 'PRINCIPAL',
      status: 'ACTIVE',
    })
    .whereNull('department_id')
    .andWhere('effective_from', '<=', asOf)
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', asOf));
  return rows.map((r: Row) => Number(r.employee_id));
}
