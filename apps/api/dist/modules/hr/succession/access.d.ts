import type { HrActor } from '../types.js';
import { assertHrPermission, hasHrPermission } from '../access.js';
import { requireSelfEmployee, selfEmployee, employeeInCollege, managesEmployee, assertManagesEmployee, isSelf, type EmployeeRow } from '../ld/access.js';
export { assertHrPermission, hasHrPermission, requireSelfEmployee, selfEmployee, employeeInCollege, managesEmployee, assertManagesEmployee, isSelf, };
export type { EmployeeRow };
/** Load a succession record inside the actor's college, or 404 (tenant isolation). */
export declare function rowInCollege(actor: HrActor, table: string, id: number): Promise<any>;
/** Departments the actor may see for succession reporting (null = college-wide). */
export declare function successionScope(actor: HrActor): number[] | null;
/** A critical role is visible to the actor iff college-wide or within their department scope. */
export declare function roleVisible(scope: number[] | null, role: {
    department_id: number | null;
}): boolean;
export declare function assertRoleVisible(actor: HrActor, role: {
    department_id: number | null;
}): void;
/** Successor nominations require an in-service employee (never terminated/exited). */
export declare function assertNominable(emp: EmployeeRow): void;
