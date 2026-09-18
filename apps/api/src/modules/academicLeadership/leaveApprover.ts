import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { asDateOnly } from './types.js';
import { leadershipSchemaReady, todayISO } from './leadership.js';
import { listActiveHodEmployees, listActivePrincipalEmployees } from './assignments.js';

export type LeaveAcademicApprover = {
  employeeId: number;
  facultyUserId: number | null;
  role: 'HOD' | 'PRINCIPAL';
  departmentId: number | null;
  source: 'ASSIGNMENT' | 'LEGACY_ROLE';
};

async function employeeRow(employeeId: number, collegeId: number) {
  const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
  if (!emp) throw new AppError(404, 'Employee not found');
  return emp;
}

async function isEmployeeActiveHod(employeeId: number, collegeId: number, asOf: string): Promise<boolean> {
  const assigned = await db('academic_leadership_assignments')
    .where({
      employee_id: employeeId,
      college_id: collegeId,
      leadership_role: 'HOD',
      status: 'ACTIVE',
    })
    .andWhere('effective_from', '<=', asOf)
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', asOf))
    .first();
  if (assigned) return true;

  const emp = await db('employees as e')
    .leftJoin('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({ 'e.id': employeeId, 'e.college_id': collegeId })
    .select('f.role')
    .first();
  return String(emp?.role) === 'HOD';
}

async function legacyHodEmployees(collegeId: number, departmentId: number) {
  const rows = await db('employees as e')
    .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({ 'e.college_id': collegeId, 'e.department_id': departmentId, 'f.role': 'HOD', 'f.is_active': true })
    .select('e.id', 'e.faculty_user_id');
  return rows.map((r) => ({ employeeId: Number(r.id), facultyUserId: r.faculty_user_id ? Number(r.faculty_user_id) : null }));
}

async function legacyPrincipalEmployees(collegeId: number) {
  const rows = await db('employees as e')
    .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({ 'e.college_id': collegeId, 'f.role': 'PRINCIPAL', 'f.is_active': true })
    .select('e.id', 'e.faculty_user_id');
  return rows.map((r) => ({ employeeId: Number(r.id), facultyUserId: r.faculty_user_id ? Number(r.faculty_user_id) : null }));
}

async function hydrateApprover(
  employeeId: number,
  role: 'HOD' | 'PRINCIPAL',
  departmentId: number | null,
  source: 'ASSIGNMENT' | 'LEGACY_ROLE',
): Promise<LeaveAcademicApprover> {
  const emp = await db('employees').where({ id: employeeId }).first();
  return {
    employeeId,
    facultyUserId: emp?.faculty_user_id ? Number(emp.faculty_user_id) : null,
    role,
    departmentId,
    source,
  };
}

/**
 * Resolve the academic approver for a leave request.
 * Normal faculty → active HOD of the employee's department.
 * Active HOD → active Principal of the college.
 */
export async function resolveLeaveAcademicApprover(
  employeeId: number,
  collegeId: number,
  leaveRequestDate?: string,
): Promise<LeaveAcademicApprover | null> {
  const asOf = leaveRequestDate ? asDateOnly(leaveRequestDate) : todayISO();
  const emp = await employeeRow(employeeId, collegeId);
  const departmentId = emp.department_id != null ? Number(emp.department_id) : null;

  const requesterIsHod = await isEmployeeActiveHod(employeeId, collegeId, asOf);

  if (requesterIsHod) {
    if (await leadershipSchemaReady()) {
      const principals = await listActivePrincipalEmployees(collegeId, asOf);
      if (principals.length > 1) {
        throw new AppError(409, 'Multiple active Principals are configured for this date', { employeeIds: principals }, 'MULTIPLE_ACTIVE_PRINCIPAL');
      }
      if (principals.length === 1) {
        return hydrateApprover(principals[0], 'PRINCIPAL', null, 'ASSIGNMENT');
      }
    }
    const legacy = await legacyPrincipalEmployees(collegeId);
    if (legacy.length > 1) {
      throw new AppError(409, 'Multiple Principal user roles are configured', { employeeIds: legacy.map((l) => l.employeeId) }, 'MULTIPLE_ACTIVE_PRINCIPAL');
    }
    if (legacy.length === 1) {
      return hydrateApprover(legacy[0].employeeId, 'PRINCIPAL', null, 'LEGACY_ROLE');
    }
    throw new AppError(409, 'No Principal is configured to approve HOD leave', undefined, 'NO_PRINCIPAL_CONFIGURED');
  }

  if (!departmentId) {
    throw new AppError(409, 'Employee has no department; HOD cannot be resolved', undefined, 'NO_HOD_CONFIGURED');
  }

  if (await leadershipSchemaReady()) {
    const hods = await listActiveHodEmployees(collegeId, departmentId, asOf);
    if (hods.length > 1) {
      throw new AppError(409, 'Multiple active HODs are configured for this department and date', { employeeIds: hods, departmentId }, 'MULTIPLE_ACTIVE_HOD');
    }
    if (hods.length === 1) {
      return hydrateApprover(hods[0], 'HOD', departmentId, 'ASSIGNMENT');
    }
  }

  const legacy = await legacyHodEmployees(collegeId, departmentId);
  if (legacy.length > 1) {
    throw new AppError(409, 'Multiple HOD user roles are configured for this department', { employeeIds: legacy.map((l) => l.employeeId), departmentId }, 'MULTIPLE_ACTIVE_HOD');
  }
  if (legacy.length === 1) {
    return hydrateApprover(legacy[0].employeeId, 'HOD', departmentId, 'LEGACY_ROLE');
  }

  return null;
}

export async function tryResolveLeaveAcademicApprover(
  employeeId: number,
  collegeId: number,
  leaveRequestDate?: string,
): Promise<{ approver: LeaveAcademicApprover | null; error?: AppError }> {
  try {
    const approver = await resolveLeaveAcademicApprover(employeeId, collegeId, leaveRequestDate);
    return { approver };
  } catch (err) {
    if (err instanceof AppError && ['NO_PRINCIPAL_CONFIGURED', 'NO_HOD_CONFIGURED', 'MULTIPLE_ACTIVE_HOD', 'MULTIPLE_ACTIVE_PRINCIPAL'].includes(String(err.code))) {
      return { approver: null, error: err };
    }
    throw err;
  }
}
