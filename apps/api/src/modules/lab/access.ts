import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { LabActor, LabPermission } from './types.js';

/**
 * Role → base lab capabilities.
 *
 * LAB_ASSISTANT owns operational activity on ASSIGNED labs (scope enforced
 * separately). FACULTY only gains oversight/request capabilities and, on labs
 * where they hold a LAB_INCHARGE assignment, first-level approval. HOD/Principal
 * are department/institution oversight via the leadership overlay. Accountant,
 * COE, Student get nothing.
 */
const ROLE_LAB_PERMISSIONS: Record<string, LabPermission[]> = {
  SUPER_ADMIN: [
    'lab.view', 'lab.master.manage', 'lab.assignment.manage', 'lab.asset.manage',
    'lab.stock.manage', 'lab.issue.manage', 'lab.session.manage', 'lab.fault.manage',
    'lab.repair.manage', 'lab.repair.approve', 'lab.software.manage', 'lab.software.request',
    'lab.requirement.create', 'lab.requirement.approve', 'lab.oversight.view', 'lab.report.view',
  ],
  COLLEGE_ADMIN: [
    'lab.view', 'lab.master.manage', 'lab.assignment.manage', 'lab.asset.manage',
    'lab.stock.manage', 'lab.issue.manage', 'lab.session.manage', 'lab.fault.manage',
    'lab.repair.manage', 'lab.repair.approve', 'lab.software.manage', 'lab.software.request',
    'lab.requirement.create', 'lab.requirement.approve', 'lab.oversight.view', 'lab.report.view',
  ],
  LAB_ASSISTANT: [
    'lab.view', 'lab.asset.manage', 'lab.stock.manage', 'lab.issue.manage',
    'lab.session.manage', 'lab.fault.manage', 'lab.repair.manage', 'lab.software.manage',
    'lab.requirement.create', 'lab.report.view',
  ],
  FACULTY: [
    'lab.view', 'lab.session.manage', 'lab.fault.manage', 'lab.software.request',
    'lab.requirement.create', 'lab.requirement.approve', 'lab.repair.approve', 'lab.oversight.view',
  ],
  HOD: [
    'lab.view', 'lab.oversight.view', 'lab.requirement.approve', 'lab.repair.approve',
    'lab.assignment.manage', 'lab.report.view',
  ],
  PRINCIPAL: ['lab.view', 'lab.oversight.view', 'lab.requirement.approve', 'lab.report.view'],
  MANAGEMENT: ['lab.view', 'lab.oversight.view', 'lab.report.view'],
};

export function labPermissionsForRole(role: string): LabPermission[] {
  if (isSuperAdmin(role)) return ROLE_LAB_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_LAB_PERMISSIONS.MANAGEMENT;
  return ROLE_LAB_PERMISSIONS[role] ?? [];
}

export function hasLabPermission(actor: LabActor, permission: LabPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return labPermissionsForRole(actor.role).includes(permission);
}

export function assertLabPermission(actor: LabActor, permission: LabPermission) {
  if (!hasLabPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this lab action');
  }
}

// ── Leadership resolution (reuse academic_leadership_assignments) ────────
/** Departments where this faculty is an active HOD. */
export async function hodDepartmentIds(actor: LabActor): Promise<number[]> {
  const rows = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, leadership_role: 'HOD', status: 'ACTIVE' })
    .where(function () {
      this.where('employee_id', actor.facultyUserId);
    })
    .whereNotNull('department_id')
    .select('department_id');
  const ids = rows.map((r) => Number(r.department_id));
  // Fall back to the faculty_users.role='HOD' + own department binding.
  if (actor.role === 'HOD' && actor.departmentId && !ids.includes(actor.departmentId)) {
    ids.push(actor.departmentId);
  }
  return [...new Set(ids)];
}

export async function isPrincipal(actor: LabActor): Promise<boolean> {
  if (actor.role === 'PRINCIPAL') return true;
  const row = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, leadership_role: 'PRINCIPAL', status: 'ACTIVE', employee_id: actor.facultyUserId })
    .first();
  return Boolean(row);
}

// ── Lab-level scope ──────────────────────────────────────────────────────
export async function loadLab(labId: number, collegeId: number) {
  const lab = await db('labs').where({ id: labId, college_id: collegeId }).first();
  if (!lab) throw new AppError(404, 'Lab not found');
  return lab;
}

export type LabAccessMode = 'operate' | 'oversight';

/** Active assignments this actor holds for a lab. */
export async function actorLabAssignmentRoles(actor: LabActor, labId: number): Promise<string[]> {
  const rows = await db('lab_assignments')
    .where({ college_id: actor.collegeId, lab_id: labId, faculty_id: actor.facultyUserId, status: 'ACTIVE' })
    .select('assignment_role');
  return rows.map((r) => String(r.assignment_role));
}

/**
 * Enforce that the actor may act on this lab.
 *  - admins: any lab in college
 *  - LAB_ASSISTANT: must hold an ACTIVE LAB_ASSISTANT assignment (operate)
 *  - FACULTY: must hold an ACTIVE LAB_INCHARGE assignment
 *  - HOD: lab must belong to a department they lead
 *  - PRINCIPAL / MANAGEMENT: read/oversight across the college only
 */
export async function assertLabAccess(actor: LabActor, labId: number, mode: LabAccessMode = 'operate') {
  const lab = await loadLab(labId, actor.collegeId);
  if (isAdminRole(actor.role)) return lab;

  if (actor.role === 'LAB_ASSISTANT') {
    const roles = await actorLabAssignmentRoles(actor, labId);
    if (!roles.includes('LAB_ASSISTANT')) {
      throw new AppError(403, 'You are not assigned to this lab');
    }
    return lab;
  }

  if (actor.role === 'FACULTY') {
    const roles = await actorLabAssignmentRoles(actor, labId);
    if (!roles.includes('LAB_INCHARGE')) {
      throw new AppError(403, 'You are not the In-charge of this lab');
    }
    return lab;
  }

  if (actor.role === 'HOD') {
    const depts = await hodDepartmentIds(actor);
    if (mode === 'operate') throw new AppError(403, 'HOD access to labs is oversight-only');
    if (!lab.department_id || !depts.includes(Number(lab.department_id))) {
      throw new AppError(403, 'This lab is outside your department');
    }
    return lab;
  }

  if (actor.role === 'PRINCIPAL' || actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN') {
    if (mode === 'operate') throw new AppError(403, 'Oversight roles cannot mutate lab operations');
    return lab; // college-scoped read already guaranteed by loadLab
  }

  throw new AppError(403, 'You do not have access to this lab');
}

/** Lab ids visible to this actor (assignment / department / college scoped). */
export async function scopedLabIds(actor: LabActor): Promise<number[] | 'ALL'> {
  if (isAdminRole(actor.role) || actor.role === 'PRINCIPAL' || actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN') {
    return 'ALL';
  }
  if (await isPrincipal(actor)) return 'ALL';
  if (actor.role === 'LAB_ASSISTANT' || actor.role === 'FACULTY') {
    const rows = await db('lab_assignments')
      .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId, status: 'ACTIVE' })
      .select('lab_id');
    return [...new Set(rows.map((r) => Number(r.lab_id)))];
  }
  if (actor.role === 'HOD') {
    const depts = await hodDepartmentIds(actor);
    if (depts.length === 0) return [];
    const rows = await db('labs').where({ college_id: actor.collegeId }).whereIn('department_id', depts).select('id');
    return rows.map((r) => Number(r.id));
  }
  return [];
}

/** Apply the scoped lab-id filter to a query on a table with a `lab_id` column. */
export function applyLabScope<Q extends { whereIn: (c: string, v: number[]) => Q; whereRaw: (s: string) => Q }>(
  query: Q,
  ids: number[] | 'ALL',
  column = 'lab_id',
): Q {
  if (ids === 'ALL') return query;
  if (ids.length === 0) return query.whereRaw('1 = 0');
  return query.whereIn(column, ids);
}

export async function assertAssetCollege(assetId: number, collegeId: number) {
  const asset = await db('lab_assets').where({ id: assetId, college_id: collegeId }).first();
  if (!asset) throw new AppError(404, 'Asset not found');
  return asset;
}
