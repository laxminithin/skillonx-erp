/**
 * Succession Planning — scoping, eligibility & confidentiality helpers.
 * Reuses the generic HR employee-scope primitives; never a second employee master.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { isAdminRole } from '../../../utils/permissions.js';
import type { HrActor } from '../types.js';
import { assertHrPermission, hasHrPermission } from '../access.js';
import {
  requireSelfEmployee,
  selfEmployee,
  employeeInCollege,
  managesEmployee,
  assertManagesEmployee,
  isSelf,
  type EmployeeRow,
} from '../ld/access.js';
import { INELIGIBLE_STATUSES } from './types.js';

export {
  assertHrPermission,
  hasHrPermission,
  requireSelfEmployee,
  selfEmployee,
  employeeInCollege,
  managesEmployee,
  assertManagesEmployee,
  isSelf,
};
export type { EmployeeRow };

/** Load a succession record inside the actor's college, or 404 (tenant isolation). */
export async function rowInCollege(actor: HrActor, table: string, id: number) {
  const row = await db(table).where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Record not found');
  return row;
}

/** Departments the actor may see for succession reporting (null = college-wide). */
export function successionScope(actor: HrActor): number[] | null {
  if (isAdminRole(actor.role) || hasHrPermission(actor, 'hr.succession.manage') || hasHrPermission(actor, 'hr.succession.view')) {
    // View/manage holders that are also department-restricted HODs stay scoped.
    const collegeWide =
      isAdminRole(actor.role) ||
      hasHrPermission(actor, 'hr.succession.manage') ||
      hasHrPermission(actor, 'hr.report.view') ||
      hasHrPermission(actor, 'hr.management.view');
    if (collegeWide) return null;
  }
  const depts = actor.hodDepartmentIds?.length ? actor.hodDepartmentIds : actor.departmentId ? [actor.departmentId] : [];
  return [...new Set(depts.map(Number))];
}

/** A critical role is visible to the actor iff college-wide or within their department scope. */
export function roleVisible(scope: number[] | null, role: { department_id: number | null }): boolean {
  if (scope === null) return true;
  return role.department_id != null && scope.includes(Number(role.department_id));
}

export function assertRoleVisible(actor: HrActor, role: { department_id: number | null }) {
  if (!roleVisible(successionScope(actor), role)) throw new AppError(403, 'Critical role is outside your succession scope');
}

/** Successor nominations require an in-service employee (never terminated/exited). */
export function assertNominable(emp: EmployeeRow) {
  if (INELIGIBLE_STATUSES.includes(String(emp.employment_status) as (typeof INELIGIBLE_STATUSES)[number])) {
    throw new AppError(409, `Employee is not eligible for nomination (status ${emp.employment_status})`);
  }
}
