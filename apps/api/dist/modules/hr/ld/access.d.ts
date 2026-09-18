import type { Knex } from 'knex';
import type { HrActor } from '../types.js';
import { hasHrPermission, assertHrPermission } from '../access.js';
export type EmployeeRow = {
    id: number;
    college_id: number;
    department_id: number | null;
    employee_category: string;
    employment_status: string;
    employment_type_id: number | null;
    designation_id: number | null;
    reporting_manager_employee_id: number | null;
};
/** The actor's own employee record (or throw). */
export declare function requireSelfEmployee(actor: HrActor): Promise<EmployeeRow>;
export declare function selfEmployee(actor: HrActor): Promise<EmployeeRow | null>;
/** Load an employee inside the actor's college, or 404 (tenant isolation). */
export declare function employeeInCollege(actor: HrActor, employeeId: number): Promise<EmployeeRow>;
/** Load a program inside the actor's college, or 404. */
export declare function programInCollege(actor: HrActor, programId: number): Promise<any>;
export declare function ldRowInCollege(actor: HrActor, table: string, id: number): Promise<any>;
export declare function isSelf(self: EmployeeRow | null, employeeId: number): boolean;
/** True when the actor manages the target employee (HR-wide, HOD dept, or reporting manager). */
export declare function managesEmployee(actor: HrActor, target: EmployeeRow): Promise<boolean>;
/** Assert the actor may nominate/act on the target employee (used by nomination/approval/reviews). */
export declare function assertManagesEmployee(actor: HrActor, target: EmployeeRow): Promise<void>;
/** Trainer scope: assigned as program trainer or a session trainer, or an L&D admin. */
export declare function assertTrainerForProgram(actor: HrActor, program: {
    id: number;
    trainer_employee_id: number | null;
}): Promise<void>;
/** Applicability check against canonical employee attributes. */
export declare function isApplicable(program: Record<string, unknown>, emp: EmployeeRow): boolean;
export declare function parseJson(v: unknown): unknown;
/** Departments the actor may see for L&D reporting (null = college-wide). */
export declare function ldReportScope(actor: HrActor): number[] | null;
export { assertHrPermission, hasHrPermission };
export type { Knex };
