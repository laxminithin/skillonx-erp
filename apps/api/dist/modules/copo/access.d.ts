import { type MappingStatus } from './types.js';
export type CopoActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId?: number | null;
    role: string;
};
export type MappingOwnership = {
    collegeId: number;
    departmentId?: number | null;
    createdBy?: number | null;
    assignedFacultyIds?: number[];
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function canManageOfficialMasters(role: string): role is "COLLEGE_ADMIN" | "SUPER_ADMIN";
export declare function canReviewMappings(role: string): boolean;
export declare function canApproveMappings(role: string): boolean;
export declare function canViewCollegeMappings(role: string): boolean;
/** True when the actor may manage all operational mappings in their institution. */
export declare function canManageAllOperationalMappings(role: string): boolean;
export declare function canEditMapping(role: string, status: MappingStatus, isAssigned: boolean): boolean;
export declare function canSubmitMapping(role: string, isAssigned: boolean): boolean;
export declare function isFacultyScoped(role: string): role is "FACULTY";
export declare function isDepartmentScoped(role: string): role is "HOD";
export declare function decideMasterWriteAccess(actor: CopoActor, collegeId: number): AccessDecision;
/**
 * Workspace / legacy mapping read access.
 * Kept for non-operational workspace flows. Faculty may read if assigned OR creator.
 */
export declare function decideMappingReadAccess(actor: CopoActor, mapping: MappingOwnership): AccessDecision;
/**
 * Hardened operational mapping ownership (Survey-aligned).
 *
 * FACULTY (and non-admin roles that are not intentional reviewers): creator only.
 * COLLEGE_ADMIN / SUPER_ADMIN: institution / cross-institution per policy.
 * HOD / NBA / IQAC / PRINCIPAL: retain existing broader college/department review access.
 */
export declare function decideOperationalMappingAccess(actor: CopoActor, mapping: MappingOwnership): AccessDecision;
export declare function decideOperationalMappingMutateAccess(actor: CopoActor, mapping: MappingOwnership): AccessDecision;
/**
 * Assert the actor may access an operational mapping.
 * Cross-tenant → 404. Same-college non-owner faculty → 403 MAPPING_FORBIDDEN.
 */
export declare function assertOperationalMappingAccess(mappingId: number, actor: CopoActor, mode?: 'read' | 'mutate'): Promise<MappingOwnership & {
    id: number;
    courseId: number;
    academicYearId: number | null;
    status: string;
}>;
