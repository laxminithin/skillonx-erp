import type { ManagementActor } from './types.js';
export type DomainActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string;
    employeeId?: number | null;
    leadershipRoles?: string[];
    hodDepartmentIds?: number[];
};
export declare function effectiveRole(actor: ManagementActor): string;
export declare function domainActor(actor: ManagementActor): DomainActor;
export type SourceResult<T> = {
    available: true;
    data: T;
} | {
    available: false;
    reason: string;
};
/**
 * Run a canonical read, returning an unavailable marker instead of throwing
 * when the domain schema is not provisioned for this tenant. A genuine
 * authorization error (403) is re-thrown — the portal must not silently
 * swallow a permission failure into an empty state.
 */
export declare function safe<T>(fn: () => Promise<T>): Promise<SourceResult<T>>;
export declare function tableExists(name: string): Promise<boolean>;
/** Percentage helper that never emits NaN/Infinity and marks true no-data. */
export declare function pct(numerator: number, denominator: number): number | null;
export declare function num(v: unknown): number;
