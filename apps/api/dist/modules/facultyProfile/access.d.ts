import type { FacultyProfileActor } from './types.js';
export type EmployeeScope = {
    id: number;
    collegeId: number;
    facultyUserId: number | null;
    departmentId: number | null;
    employmentStatus: string;
};
/** The employee row backing the logged-in faculty (their own academic record owner). */
export declare function actorEmployee(actor: FacultyProfileActor): Promise<EmployeeScope | null>;
export declare function isOwner(actor: FacultyProfileActor, employee: EmployeeScope): boolean;
/**
 * Can the actor view this employee's academic profile?
 * - owner: always
 * - HOD: only within their own department
 * - institution viewer roles + admins: college-wide
 */
export declare function canViewProfile(actor: FacultyProfileActor, employee: EmployeeScope): boolean;
/**
 * Can the actor verify records on this employee's profile?
 * Never the owner (no self-verification). SUPER_ADMIN excluded (platform only).
 */
export declare function canVerify(actor: FacultyProfileActor, employee: EmployeeScope): boolean;
/** Only the owning faculty edits their own eligible records. */
export declare function canEditOwnRecords(actor: FacultyProfileActor, employee: EmployeeScope): boolean;
/**
 * Resolve the target employee for a request. Defaults to the actor's own
 * employee; a different employeeId requires view permission (403 otherwise,
 * 404 when the id does not exist within the tenant — no cross-tenant leak).
 */
export declare function resolveTarget(actor: FacultyProfileActor, employeeId?: number | null): Promise<EmployeeScope>;
/** Load an employee strictly within the actor's tenant (no cross-college). */
export declare function requireEmployeeInTenant(actor: FacultyProfileActor, employeeId: number): Promise<EmployeeScope>;
