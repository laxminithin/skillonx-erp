import type { IqacActor, IqacPermission } from './types.js';
export declare function iqacPermissionsForRole(role: string): IqacPermission[];
export declare function hasIqacPermission(actor: IqacActor, permission: IqacPermission): boolean;
export declare function assertIqacPermission(actor: IqacActor, permission: IqacPermission): void;
/**
 * Departments the actor is HOD of. Same canonical source used across the
 * codebase (mirrors `research/access.ts`'s `hodDepartmentIds` exactly):
 * prefers Academic Leadership enrichment, falls back to the legacy
 * `role === 'HOD'` + `departmentId` representation.
 */
export declare function hodDepartmentIds(actor: IqacActor): number[];
export declare function isHodOfDepartment(actor: IqacActor, departmentId: number | null): boolean;
export declare function isInstitutionWideViewer(role: string): boolean;
/**
 * Can the actor view/act on this department-scoped record (metric, evidence,
 * action plan, or audit row that carries a departmentId)? Admins and
 * institution-tier roles: always. HOD: only their own department(s). Plain
 * FACULTY/others: only when explicitly the assigned owner (checked by the
 * caller, not here — ownership is record-shaped, not role-shaped).
 */
export declare function canActOnDepartmentScopedRecord(actor: IqacActor, departmentId: number | null): boolean;
/**
 * Hard self-verification guard: the person who submitted a piece of evidence
 * cannot be the one who verifies it, even if their role would otherwise
 * permit `iqac.evidence.verify` (prompt §63). A named, tested requirement.
 */
export declare function assertNotSelfVerifying(actor: IqacActor, evidenceId: number): Promise<void>;
