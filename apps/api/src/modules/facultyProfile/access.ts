import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { FacultyProfileActor } from './types.js';

export type EmployeeScope = {
  id: number;
  collegeId: number;
  facultyUserId: number | null;
  departmentId: number | null;
  employmentStatus: string;
};

// Roles that may verify institutional evidence (spec §B23). Never the owner;
// SUPER_ADMIN is platform governance only and is excluded from the academic
// verification workflow.
const INSTITUTION_VERIFIER_ROLES = new Set([
  'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'IQAC_COORDINATOR', 'NBA_COORDINATOR', 'COLLEGE_ADMIN',
]);

// Roles that may view any faculty profile in their college (oversight).
const INSTITUTION_VIEWER_ROLES = new Set([
  'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'IQAC_COORDINATOR', 'NBA_COORDINATOR', 'COLLEGE_ADMIN',
]);

async function loadEmployee(collegeId: number, employeeId: number): Promise<EmployeeScope | null> {
  const row = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
  if (!row) return null;
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    facultyUserId: row.faculty_user_id ? Number(row.faculty_user_id) : null,
    departmentId: row.department_id ? Number(row.department_id) : null,
    employmentStatus: String(row.employment_status ?? 'ACTIVE'),
  };
}

/** The employee row backing the logged-in faculty (their own academic record owner). */
export async function actorEmployee(actor: FacultyProfileActor): Promise<EmployeeScope | null> {
  const row = await db('employees')
    .where({ college_id: actor.collegeId, faculty_user_id: actor.facultyUserId })
    .first();
  if (!row) return null;
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    facultyUserId: row.faculty_user_id ? Number(row.faculty_user_id) : null,
    departmentId: row.department_id ? Number(row.department_id) : null,
    employmentStatus: String(row.employment_status ?? 'ACTIVE'),
  };
}

export function isOwner(actor: FacultyProfileActor, employee: EmployeeScope): boolean {
  return employee.facultyUserId != null && Number(employee.facultyUserId) === Number(actor.facultyUserId);
}

/**
 * Departments the actor is HOD of. Prefers the canonical Academic Leadership
 * authority (`hodDepartmentIds`, populated by the router's leadership
 * enrichment); falls back to the legacy `faculty_users.role === 'HOD'` +
 * `departmentId` representation when the actor was not enriched (unit fixtures,
 * already-seeded role-based HODs). This is the single source of HOD scope for
 * Faculty Profile — it does not introduce a second HOD model.
 */
export function hodDepartmentIds(actor: FacultyProfileActor): number[] {
  if (actor.hodDepartmentIds != null) return actor.hodDepartmentIds.map(Number);
  if (actor.role === 'HOD' && actor.departmentId != null) return [Number(actor.departmentId)];
  return [];
}

/** True when the actor is HOD of the employee's department (department-scoped). */
function isHodOfDepartment(actor: FacultyProfileActor, employee: EmployeeScope): boolean {
  if (employee.departmentId == null) return false;
  return hodDepartmentIds(actor).includes(Number(employee.departmentId));
}

/** True when the actor can act as a verifier for anyone (UI capability hint). */
export function canActAsVerifier(actor: FacultyProfileActor): boolean {
  if (isSuperAdmin(actor.role)) return false;
  if (INSTITUTION_VERIFIER_ROLES.has(actor.role)) return true;
  return hodDepartmentIds(actor).length > 0;
}

/**
 * Can the actor view this employee's academic profile?
 * - owner: always
 * - HOD: only within their own department
 * - institution viewer roles + admins: college-wide
 */
export function canViewProfile(actor: FacultyProfileActor, employee: EmployeeScope): boolean {
  if (employee.collegeId !== actor.collegeId && !isSuperAdmin(actor.role)) return false;
  if (isOwner(actor, employee)) return true;
  if (isAdminRole(actor.role)) return true; // COLLEGE_ADMIN / SUPER_ADMIN (tenant-checked above)
  if (INSTITUTION_VIEWER_ROLES.has(actor.role)) return true;
  return isHodOfDepartment(actor, employee);
}

/**
 * Can the actor verify records on this employee's profile?
 * Never the owner (no self-verification). SUPER_ADMIN excluded (platform only).
 */
export function canVerify(actor: FacultyProfileActor, employee: EmployeeScope): boolean {
  if (employee.collegeId !== actor.collegeId) return false;
  if (isSuperAdmin(actor.role)) return false;
  if (isOwner(actor, employee)) return false; // hard self-verify guard
  if (INSTITUTION_VERIFIER_ROLES.has(actor.role)) return true;
  return isHodOfDepartment(actor, employee);
}

/** Only the owning faculty edits their own eligible records. */
export function canEditOwnRecords(actor: FacultyProfileActor, employee: EmployeeScope): boolean {
  return isOwner(actor, employee);
}

/**
 * Resolve the target employee for a request. Defaults to the actor's own
 * employee; a different employeeId requires view permission (403 otherwise,
 * 404 when the id does not exist within the tenant — no cross-tenant leak).
 */
export async function resolveTarget(
  actor: FacultyProfileActor,
  employeeId?: number | null,
): Promise<EmployeeScope> {
  if (employeeId == null) {
    const own = await actorEmployee(actor);
    if (!own) throw new AppError(404, 'No employee record is linked to your account');
    return own;
  }
  const emp = await loadEmployee(actor.collegeId, employeeId);
  if (!emp) throw new AppError(404, 'Faculty not found');
  if (!canViewProfile(actor, emp)) throw new AppError(403, 'You do not have access to this faculty profile');
  return emp;
}

/** Load an employee strictly within the actor's tenant (no cross-college). */
export async function requireEmployeeInTenant(
  actor: FacultyProfileActor,
  employeeId: number,
): Promise<EmployeeScope> {
  const emp = await loadEmployee(actor.collegeId, employeeId);
  if (!emp) throw new AppError(404, 'Faculty not found');
  return emp;
}
