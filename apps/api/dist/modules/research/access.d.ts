import type { ResearchActor, ResearchPermission } from './types.js';
export declare function researchPermissionsForRole(role: string): ResearchPermission[];
export declare function hasResearchPermission(actor: ResearchActor, permission: ResearchPermission): boolean;
export declare function assertResearchPermission(actor: ResearchActor, permission: ResearchPermission): void;
/**
 * Departments the actor is HOD of. Same canonical source used across the
 * codebase: prefers Academic Leadership enrichment (`hodDepartmentIds`),
 * falls back to the legacy `role === 'HOD'` + `departmentId` representation.
 * Mirrors `facultyProfile/access.ts`'s `hodDepartmentIds` exactly.
 */
export declare function hodDepartmentIds(actor: ResearchActor): number[];
export declare function isHodOfDepartment(actor: ResearchActor, departmentId: number | null): boolean;
/**
 * Can the actor view this proposal? Owner (PI/team) always; admins and
 * institution-tier roles institution-wide; HOD only within their own
 * department; plain FACULTY only when PI or team member.
 */
export declare function canViewProposal(actor: ResearchActor, proposal: {
    collegeId: number;
    departmentId: number | null;
    piFacultyId: number;
}): Promise<boolean>;
/**
 * Hard self-approval guard: a person cannot act on a proposal's HOD/
 * Coordinator review step if they are listed as PI/Co-PI/Co-Investigator/
 * Team-Member on that same proposal, even if their role would otherwise be
 * allowed to act at that step. This is a named, tested requirement.
 */
export declare function assertNotProposalTeamMember(actor: ResearchActor, proposalId: number): Promise<void>;
