import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
/**
 * Least-privilege RBAC for Campus OS Phase 6 (Research grants
 * administration), following the exact per-module pattern used elsewhere
 * (see `security/access.ts`, `facultyProfile/access.ts`).
 *
 * - RESEARCH_COORDINATOR (new, institutional-level): reviews proposals at
 *   the coordinator workflow step, records awards, manages the funding
 *   agency master, manages project lifecycle/closure, and records
 *   utilization entries.
 * - HOD: proposal view/review, but department-scoped only — reuses the
 *   canonical HOD department-resolution helper (`hodDepartmentIds`), the
 *   same pattern `facultyProfile/access.ts` and Academic Leadership use, so
 *   this module does not re-derive HOD status a different way.
 * - FACULTY: can create proposals and view their own (PI or team member).
 * - PRINCIPAL/MANAGEMENT/CHAIRMAN: institution-wide view only.
 * - COLLEGE_ADMIN/SUPER_ADMIN: institution-wide view + full manage
 *   (matching the "admin can always act" convention `isAdminRole` already
 *   provides elsewhere).
 */
const ROLE_PERMISSIONS = {
    SUPER_ADMIN: [
        'research.proposal.create', 'research.proposal.view', 'research.proposal.review',
        'research.award.manage', 'research.project.manage', 'research.project.view',
        'research.utilization.manage', 'research.fundingAgency.manage',
    ],
    COLLEGE_ADMIN: [
        'research.proposal.create', 'research.proposal.view', 'research.proposal.review',
        'research.award.manage', 'research.project.manage', 'research.project.view',
        'research.utilization.manage', 'research.fundingAgency.manage',
    ],
    RESEARCH_COORDINATOR: [
        'research.proposal.view', 'research.proposal.review',
        'research.award.manage', 'research.project.manage', 'research.project.view',
        'research.utilization.manage', 'research.fundingAgency.manage',
    ],
    HOD: ['research.proposal.view', 'research.proposal.review'],
    FACULTY: ['research.proposal.create', 'research.proposal.view', 'research.project.view', 'research.utilization.manage'],
    PRINCIPAL: ['research.proposal.view', 'research.project.view'],
    MANAGEMENT: ['research.proposal.view', 'research.project.view'],
    CHAIRMAN: ['research.proposal.view', 'research.project.view'],
};
export function researchPermissionsForRole(role) {
    if (isSuperAdmin(role))
        return ROLE_PERMISSIONS.SUPER_ADMIN;
    return ROLE_PERMISSIONS[role] ?? [];
}
export function hasResearchPermission(actor, permission) {
    if (isAdminRole(actor.role))
        return true;
    return researchPermissionsForRole(actor.role).includes(permission);
}
export function assertResearchPermission(actor, permission) {
    if (!hasResearchPermission(actor, permission)) {
        throw new AppError(403, 'You do not have permission for this research action');
    }
}
/**
 * Departments the actor is HOD of. Same canonical source used across the
 * codebase: prefers Academic Leadership enrichment (`hodDepartmentIds`),
 * falls back to the legacy `role === 'HOD'` + `departmentId` representation.
 * Mirrors `facultyProfile/access.ts`'s `hodDepartmentIds` exactly.
 */
export function hodDepartmentIds(actor) {
    if (actor.hodDepartmentIds != null)
        return actor.hodDepartmentIds.map(Number);
    if (actor.role === 'HOD' && actor.departmentId != null)
        return [Number(actor.departmentId)];
    return [];
}
export function isHodOfDepartment(actor, departmentId) {
    if (departmentId == null)
        return false;
    return hodDepartmentIds(actor).includes(Number(departmentId));
}
/**
 * Can the actor view this proposal? Owner (PI/team) always; admins and
 * institution-tier roles institution-wide; HOD only within their own
 * department; plain FACULTY only when PI or team member.
 */
export async function canViewProposal(actor, proposal) {
    if (proposal.collegeId !== actor.collegeId)
        return false;
    if (isAdminRole(actor.role))
        return true;
    if (['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'RESEARCH_COORDINATOR'].includes(actor.role))
        return true;
    if (isHodOfDepartment(actor, proposal.departmentId))
        return true;
    if (Number(proposal.piFacultyId) === Number(actor.facultyUserId))
        return true;
    const team = await db('research_proposal_team').where({ proposal_id: proposal.id, faculty_id: actor.facultyUserId }).first();
    return !!team;
}
/**
 * Hard self-approval guard: a person cannot act on a proposal's HOD/
 * Coordinator review step if they are listed as PI/Co-PI/Co-Investigator/
 * Team-Member on that same proposal, even if their role would otherwise be
 * allowed to act at that step. This is a named, tested requirement.
 */
export async function assertNotProposalTeamMember(actor, proposalId) {
    const membership = await db('research_proposal_team')
        .where({ proposal_id: proposalId, faculty_id: actor.facultyUserId })
        .first();
    if (membership) {
        throw new AppError(403, 'You cannot review a proposal you are a team member on (self-approval is not allowed)');
    }
}
