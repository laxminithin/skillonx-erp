import type { LabActor, LabPermission } from './types.js';
export declare function labPermissionsForRole(role: string): LabPermission[];
export declare function hasLabPermission(actor: LabActor, permission: LabPermission): boolean;
export declare function assertLabPermission(actor: LabActor, permission: LabPermission): void;
/** Departments where this faculty is an active HOD. */
export declare function hodDepartmentIds(actor: LabActor): Promise<number[]>;
export declare function isPrincipal(actor: LabActor): Promise<boolean>;
export declare function loadLab(labId: number, collegeId: number): Promise<any>;
export type LabAccessMode = 'operate' | 'oversight';
/** Active assignments this actor holds for a lab. */
export declare function actorLabAssignmentRoles(actor: LabActor, labId: number): Promise<string[]>;
/**
 * Enforce that the actor may act on this lab.
 *  - admins: any lab in college
 *  - LAB_ASSISTANT: must hold an ACTIVE LAB_ASSISTANT assignment (operate)
 *  - FACULTY: must hold an ACTIVE LAB_INCHARGE assignment
 *  - HOD: lab must belong to a department they lead
 *  - PRINCIPAL / MANAGEMENT: read/oversight across the college only
 */
export declare function assertLabAccess(actor: LabActor, labId: number, mode?: LabAccessMode): Promise<any>;
/** Lab ids visible to this actor (assignment / department / college scoped). */
export declare function scopedLabIds(actor: LabActor): Promise<number[] | 'ALL'>;
/** Apply the scoped lab-id filter to a query on a table with a `lab_id` column. */
export declare function applyLabScope<Q extends {
    whereIn: (c: string, v: number[]) => Q;
    whereRaw: (s: string) => Q;
}>(query: Q, ids: number[] | 'ALL', column?: string): Q;
export declare function assertAssetCollege(assetId: number, collegeId: number): Promise<any>;
