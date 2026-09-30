import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import * as workflowEngine from '../workflowEngine/service.js';
import { assertResearchPermission, hodDepartmentIds, isHodOfDepartment, assertNotProposalTeamMember, } from './access.js';
import { auditFromActor } from './audit.js';
import { fundingAgencySchema, proposalSchema, awardSchema, utilizationEntrySchema, projectClosureSchema, reviewSchema, withdrawSchema, } from './types.js';
export { fundingAgencySchema, proposalSchema, awardSchema, utilizationEntrySchema, projectClosureSchema, reviewSchema, withdrawSchema, };
// ── Workflow definition codes ────────────────────────────────────────────
// Two definitions cover proposals with and without a department, since a
// proposal without `department_id` has no HOD to route to. This is the
// documented fallback decision for the "department-less proposal" case
// (the alternative — forcing every proposal to carry a department — would
// block cross-department/central-institute proposals, so we route those
// straight to the coordinator instead of inventing a fake department).
const WF_CODE_WITH_DEPT = 'RESEARCH_PROPOSAL';
const WF_CODE_NO_DEPT = 'RESEARCH_PROPOSAL_NO_DEPT';
const WF_ENTITY_TYPE = 'research_proposal';
function n(v) {
    return Number(v ?? 0);
}
function isDupError(err) {
    return err?.code === 'ER_DUP_ENTRY' || /duplicate/i.test(String(err?.message ?? ''));
}
function isDeadlockError(err) {
    return err?.code === 'ER_LOCK_DEADLOCK' || err?.errno === 1213;
}
/**
 * The very first insert into a not-yet-populated `research_code_sequences`
 * row (or `research_projects.proposal_id` unique constraint) can hit a
 * genuine InnoDB deadlock under real concurrency — not just a duplicate key
 * — because two transactions racing to insert the same not-yet-existing
 * unique key can each hold a gap lock the other needs. MySQL resolves this
 * by rolling back one full transaction as the deadlock victim, so recovery
 * cannot happen from inside that same transaction; the whole attempt must
 * be retried as a fresh transaction. This is the standard, safe retry
 * pattern for first-row-insert races and does not mask any other class of
 * error (only ER_LOCK_DEADLOCK is retried).
 */
async function withDeadlockRetry(fn, attempts = 5) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (err) {
            if (!isDeadlockError(err))
                throw err;
            lastErr = err;
        }
    }
    throw lastErr;
}
function toWorkflowActor(actor) {
    return {
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        departmentId: actor.departmentId,
        role: actor.role,
        name: actor.name,
    };
}
/**
 * Bootstrapping a Workflow Engine definition (creating a new template,
 * publishing it) requires `workflow.definition.manage`, which only
 * SUPER_ADMIN/COLLEGE_ADMIN hold. A FACULTY member submitting the very
 * first proposal at their college should not need admin rights just to
 * trigger this one-time setup, so we use a synthetic, college-scoped
 * elevated actor for the definition-management calls ONLY — never for
 * starting/acting on instances, which always uses the real actor. This
 * mirrors the "system bootstrap" idiom: the action itself (defining the
 * institution's standard proposal-review chain) is inherently an
 * admin-tier concern regardless of who happens to trigger it lazily.
 */
function systemActorFor(actor) {
    return { facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId, role: 'COLLEGE_ADMIN' };
}
async function ensureProposalWorkflowDefinition(actor, code) {
    const existing = await db('workflow_definitions')
        .where({ college_id: actor.collegeId, code, entity_type: WF_ENTITY_TYPE, is_active: true })
        .first();
    if (existing)
        return existing;
    const sys = systemActorFor(actor);
    const isWithDept = code === WF_CODE_WITH_DEPT;
    const steps = isWithDept
        ? [
            { stepKey: 'HOD_REVIEW', name: 'HOD Review', allowedRoles: ['HOD'], isInitial: true },
            { stepKey: 'COORDINATOR_REVIEW', name: 'Research Coordinator Review', allowedRoles: ['RESEARCH_COORDINATOR'] },
            { stepKey: 'RETURNED_TO_PI', name: 'Returned to PI', allowedRoles: ['FACULTY'] },
            { stepKey: 'APPROVED', name: 'Approved', allowedRoles: ['RESEARCH_COORDINATOR'], isTerminal: true, terminalStatus: 'APPROVED' },
            { stepKey: 'REJECTED', name: 'Rejected', allowedRoles: ['RESEARCH_COORDINATOR'], isTerminal: true, terminalStatus: 'REJECTED' },
            { stepKey: 'CANCELLED', name: 'Cancelled', allowedRoles: ['FACULTY'], isTerminal: true, terminalStatus: 'CANCELLED' },
        ]
        : [
            { stepKey: 'COORDINATOR_REVIEW', name: 'Research Coordinator Review', allowedRoles: ['RESEARCH_COORDINATOR'], isInitial: true },
            { stepKey: 'RETURNED_TO_PI', name: 'Returned to PI', allowedRoles: ['FACULTY'] },
            { stepKey: 'APPROVED', name: 'Approved', allowedRoles: ['RESEARCH_COORDINATOR'], isTerminal: true, terminalStatus: 'APPROVED' },
            { stepKey: 'REJECTED', name: 'Rejected', allowedRoles: ['RESEARCH_COORDINATOR'], isTerminal: true, terminalStatus: 'REJECTED' },
            { stepKey: 'CANCELLED', name: 'Cancelled', allowedRoles: ['FACULTY'], isTerminal: true, terminalStatus: 'CANCELLED' },
        ];
    const transitions = isWithDept
        ? [
            { fromStepKey: 'HOD_REVIEW', action: 'APPROVE', toStepKey: 'COORDINATOR_REVIEW' },
            { fromStepKey: 'HOD_REVIEW', action: 'REJECT', toStepKey: 'REJECTED' },
            { fromStepKey: 'HOD_REVIEW', action: 'RETURN', toStepKey: 'RETURNED_TO_PI' },
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'APPROVE', toStepKey: 'APPROVED' },
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'REJECT', toStepKey: 'REJECTED' },
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'RETURN', toStepKey: 'RETURNED_TO_PI' },
            { fromStepKey: 'RETURNED_TO_PI', action: 'SUBMIT', toStepKey: 'HOD_REVIEW' },
            { fromStepKey: 'RETURNED_TO_PI', action: 'CANCEL', toStepKey: 'CANCELLED' },
        ]
        : [
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'APPROVE', toStepKey: 'APPROVED' },
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'REJECT', toStepKey: 'REJECTED' },
            { fromStepKey: 'COORDINATOR_REVIEW', action: 'RETURN', toStepKey: 'RETURNED_TO_PI' },
            { fromStepKey: 'RETURNED_TO_PI', action: 'SUBMIT', toStepKey: 'COORDINATOR_REVIEW' },
            { fromStepKey: 'RETURNED_TO_PI', action: 'CANCEL', toStepKey: 'CANCELLED' },
        ];
    let definition;
    try {
        definition = await workflowEngine.createDefinition(sys, { code, name: `Research Proposal Review (${isWithDept ? 'departmental' : 'no department'})`, entityType: WF_ENTITY_TYPE, steps, transitions });
    }
    catch (err) {
        if (!isDupError(err))
            throw err;
        definition = await db('workflow_definitions').where({ college_id: actor.collegeId, code, entity_type: WF_ENTITY_TYPE }).orderBy('version', 'desc').first();
        if (definition?.is_active)
            return definition;
    }
    await workflowEngine.publishDefinition(sys, n(definition.id));
    return db('workflow_definitions').where({ id: n(definition.id) }).first();
}
// ── Funding agencies ────────────────────────────────────────────────────
export async function createFundingAgency(actor, input) {
    assertResearchPermission(actor, 'research.fundingAgency.manage');
    const [id] = await db('research_funding_agencies').insert({
        college_id: actor.collegeId,
        name: input.name,
        agency_type: input.agencyType ?? 'OTHER',
        contact_name: input.contactName ?? null,
        contact_email: input.contactEmail ?? null,
        contact_phone: input.contactPhone ?? null,
    });
    const row = await db('research_funding_agencies').where({ id }).first();
    await auditFromActor(actor, 'FUNDING_AGENCY_CREATED', 'research_funding_agency', n(id));
    return row;
}
export async function listFundingAgencies(actor, filters = {}) {
    assertResearchPermission(actor, 'research.proposal.view');
    let q = db('research_funding_agencies').where({ college_id: actor.collegeId });
    if (filters.activeOnly)
        q = q.andWhere({ is_active: true });
    return q.orderBy('name');
}
async function requireFundingAgencyInTenant(collegeId, id) {
    const row = await db('research_funding_agencies').where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Funding agency not found');
    return row;
}
// ── Proposal creation ─────────────────────────────────────────────────────
export async function createProposal(actor, input) {
    assertResearchPermission(actor, 'research.proposal.create');
    const pi = input.team.find((m) => m.roleInProject === 'PI');
    const facultyIds = input.team.map((m) => m.facultyId);
    const facultyRows = await db('faculty_users').where({ college_id: actor.collegeId }).whereIn('id', facultyIds);
    if (facultyRows.length !== new Set(facultyIds).size) {
        throw new AppError(400, 'One or more team members do not belong to your college');
    }
    if (input.departmentId != null) {
        const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
        if (!dept)
            throw new AppError(404, 'Department not found');
    }
    if (input.fundingAgencyId != null) {
        await requireFundingAgencyInTenant(actor.collegeId, input.fundingAgencyId);
    }
    return db.transaction(async (trx) => {
        const [id] = await trx('research_proposals').insert({
            college_id: actor.collegeId,
            title: input.title,
            project_type: input.projectType,
            department_id: input.departmentId ?? null,
            pi_faculty_id: pi.facultyId,
            funding_agency_id: input.fundingAgencyId ?? null,
            requested_amount: input.requestedAmount ?? null,
            duration_months: input.durationMonths ?? null,
            abstract: input.abstract ?? null,
            status: 'DRAFT',
            created_by: actor.facultyUserId,
        });
        for (const member of input.team) {
            await trx('research_proposal_team').insert({
                college_id: actor.collegeId,
                proposal_id: n(id),
                faculty_id: member.facultyId,
                role_in_project: member.roleInProject,
            });
        }
        await auditFromActor(actor, 'PROPOSAL_CREATED', 'research_proposal', n(id), { after: { title: input.title, projectType: input.projectType } });
        const created = await trx('research_proposals').where({ id: n(id) }).first();
        const team = await trx('research_proposal_team').where({ proposal_id: n(id) });
        return shapeProposal(created, team);
    });
}
async function loadProposalRow(collegeId, proposalId) {
    const row = await db('research_proposals').where({ id: proposalId, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Proposal not found');
    return row;
}
async function proposalTeam(collegeId, proposalId) {
    return db('research_proposal_team').where({ college_id: collegeId, proposal_id: proposalId });
}
function shapeProposal(row, team) {
    return {
        id: n(row.id),
        collegeId: n(row.college_id),
        title: row.title,
        projectType: row.project_type,
        departmentId: row.department_id != null ? n(row.department_id) : null,
        piFacultyId: n(row.pi_faculty_id),
        fundingAgencyId: row.funding_agency_id != null ? n(row.funding_agency_id) : null,
        requestedAmount: row.requested_amount != null ? Number(row.requested_amount) : null,
        durationMonths: row.duration_months != null ? n(row.duration_months) : null,
        abstract: row.abstract ?? null,
        status: row.status,
        workflowInstanceId: row.workflow_instance_id != null ? n(row.workflow_instance_id) : null,
        sanctionedAmount: row.sanctioned_amount != null ? Number(row.sanctioned_amount) : null,
        sanctionReference: row.sanction_reference ?? null,
        sanctionDate: row.sanction_date ?? null,
        createdBy: row.created_by != null ? n(row.created_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        team: team.map((m) => ({ facultyId: n(m.faculty_id), roleInProject: m.role_in_project })),
    };
}
async function assertCanAccessProposal(actor, row) {
    if (isAdminRole(actor.role))
        return;
    if (['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'RESEARCH_COORDINATOR'].includes(actor.role))
        return;
    if (isHodOfDepartment(actor, row.department_id != null ? n(row.department_id) : null))
        return;
    if (n(row.pi_faculty_id) === n(actor.facultyUserId))
        return;
    const team = await db('research_proposal_team').where({ proposal_id: n(row.id), faculty_id: actor.facultyUserId }).first();
    if (team)
        return;
    throw new AppError(404, 'Proposal not found');
}
export async function getProposal(actor, proposalId) {
    assertResearchPermission(actor, 'research.proposal.view');
    const row = await loadProposalRow(actor.collegeId, proposalId);
    await assertCanAccessProposal(actor, row);
    const team = await proposalTeam(actor.collegeId, proposalId);
    return shapeProposal(row, team);
}
export async function listProposals(actor, filters = {}) {
    assertResearchPermission(actor, 'research.proposal.view');
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    let q = db('research_proposals').where({ college_id: actor.collegeId });
    if (filters.status)
        q = q.andWhere({ status: filters.status });
    if (!isAdminRole(actor.role) && !['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'RESEARCH_COORDINATOR'].includes(actor.role)) {
        const hodDepts = hodDepartmentIds(actor);
        const ownTeamProposalIds = (await db('research_proposal_team').where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId }).select('proposal_id')).map((r) => n(r.proposal_id));
        q = q.andWhere((builder) => {
            builder.where('pi_faculty_id', actor.facultyUserId);
            if (ownTeamProposalIds.length)
                builder.orWhereIn('id', ownTeamProposalIds);
            if (hodDepts.length)
                builder.orWhereIn('department_id', hodDepts);
        });
    }
    const rows = await q.clone().orderBy('id', 'desc').limit(pageSize).offset((page - 1) * pageSize);
    const totalRow = await q.clone().clearSelect().clearOrder().count({ c: '*' }).first();
    const teams = await db('research_proposal_team').where({ college_id: actor.collegeId }).whereIn('proposal_id', rows.map((r) => r.id));
    return {
        page, pageSize, total: n(totalRow?.c),
        items: rows.map((r) => shapeProposal(r, teams.filter((t) => n(t.proposal_id) === n(r.id)))),
    };
}
// ── Submit / withdraw ──────────────────────────────────────────────────────
export async function submitProposalForReview(actor, proposalId) {
    const proposal = await loadProposalRow(actor.collegeId, proposalId);
    await assertCanAccessProposal(actor, proposal);
    if (!['DRAFT', 'RETURNED'].includes(String(proposal.status))) {
        throw new AppError(400, `Cannot submit a proposal in status ${proposal.status}`);
    }
    const wfCode = proposal.department_id != null ? WF_CODE_WITH_DEPT : WF_CODE_NO_DEPT;
    await ensureProposalWorkflowDefinition(actor, wfCode);
    if (proposal.status === 'DRAFT') {
        const instance = await workflowEngine.startInstance(toWorkflowActor(actor), {
            definitionCode: wfCode, entityType: WF_ENTITY_TYPE, entityId: proposalId,
        });
        await db('research_proposals').where({ id: proposalId }).update({ status: 'UNDER_REVIEW', workflow_instance_id: n(instance.id), updated_at: db.fn.now() });
    }
    else {
        if (proposal.workflow_instance_id == null)
            throw new AppError(500, 'Returned proposal is missing its workflow instance');
        await workflowEngine.performAction(toWorkflowActor(actor), n(proposal.workflow_instance_id), { action: 'SUBMIT', remarks: null });
        await db('research_proposals').where({ id: proposalId }).update({ status: 'UNDER_REVIEW', updated_at: db.fn.now() });
    }
    await auditFromActor(actor, 'PROPOSAL_SUBMITTED', 'research_proposal', proposalId, { before: { status: proposal.status }, after: { status: 'UNDER_REVIEW' } });
    return getProposal(actor, proposalId);
}
export async function withdrawProposal(actor, proposalId, input) {
    const proposal = await loadProposalRow(actor.collegeId, proposalId);
    if (n(proposal.pi_faculty_id) !== n(actor.facultyUserId) && !isAdminRole(actor.role)) {
        throw new AppError(403, 'Only the PI can withdraw a proposal');
    }
    if (!['DRAFT', 'RETURNED'].includes(String(proposal.status))) {
        throw new AppError(400, `Cannot withdraw a proposal in status ${proposal.status}`);
    }
    if (proposal.workflow_instance_id != null) {
        await workflowEngine.performAction(toWorkflowActor(actor), n(proposal.workflow_instance_id), { action: 'CANCEL', remarks: input.reason ?? null });
    }
    await db('research_proposals').where({ id: proposalId }).update({ status: 'WITHDRAWN', updated_at: db.fn.now() });
    await auditFromActor(actor, 'PROPOSAL_WITHDRAWN', 'research_proposal', proposalId, { before: { status: proposal.status }, after: { status: 'WITHDRAWN' }, reason: input.reason ?? null });
    return getProposal(actor, proposalId);
}
// ── Review (HOD / Research Coordinator act on the workflow instance) ──────
//
// NOTE on transactionality: `workflowEngine.performAction` is itself fully
// transactional (it row-locks the instance and commits atomically). This
// codebase does not thread a shared `Knex.Transaction` across module
// boundaries anywhere (every module owns its own `db.transaction(...)`
// calls, e.g. `admissions/service.ts`'s `confirmAdmission` followed by a
// separate `provisionGuardianAccount` transaction). We follow that same
// idiom here: `performAction` commits first, then we immediately (within
// the same request, no intervening await on anything else) open our own
// `db.transaction` to row-lock the proposal and sync its status. This is
// "immediately consistent" rather than a single atomic transaction — if the
// process crashed between the two commits, the workflow instance could be
// terminal while the proposal row still says UNDER_REVIEW. We accept this
// (matching the risk profile already accepted elsewhere in this codebase
// for the same reason) rather than reimplementing performAction's internals
// with a passed-in trx, which would require forking a frozen module.
export async function reviewProposal(actor, proposalId, input) {
    assertResearchPermission(actor, 'research.proposal.review');
    const proposal = await loadProposalRow(actor.collegeId, proposalId);
    if (proposal.status !== 'UNDER_REVIEW') {
        throw new AppError(400, `Cannot review a proposal in status ${proposal.status}`);
    }
    if (proposal.department_id != null && !isAdminRole(actor.role) && actor.role === 'HOD' && !isHodOfDepartment(actor, n(proposal.department_id))) {
        throw new AppError(403, 'You are not the HOD of this proposal\'s department');
    }
    if (proposal.workflow_instance_id == null)
        throw new AppError(500, 'Proposal is missing its workflow instance');
    await assertNotProposalTeamMember(actor, proposalId);
    const instance = await workflowEngine.performAction(toWorkflowActor(actor), n(proposal.workflow_instance_id), {
        action: input.action, remarks: input.remarks ?? null,
    });
    let newStatus;
    if (input.action === 'RETURN')
        newStatus = 'RETURNED';
    else if (input.action === 'REJECT')
        newStatus = 'REJECTED_INTERNALLY';
    else
        newStatus = instance.status === 'APPROVED' ? 'APPROVED_INTERNALLY' : 'UNDER_REVIEW';
    await db.transaction(async (trx) => {
        await trx('research_proposals').where({ id: proposalId, college_id: actor.collegeId }).forUpdate();
        await trx('research_proposals').where({ id: proposalId }).update({ status: newStatus, updated_at: trx.fn.now() });
    });
    await auditFromActor(actor, `PROPOSAL_${input.action}D`, 'research_proposal', proposalId, {
        before: { status: proposal.status }, after: { status: newStatus }, reason: input.remarks ?? null,
    });
    return getProposal(actor, proposalId);
}
// ── Award ──────────────────────────────────────────────────────────────────
export async function recordAward(actor, proposalId, input) {
    assertResearchPermission(actor, 'research.award.manage');
    if (input.fundingAgencyId != null)
        await requireFundingAgencyInTenant(actor.collegeId, input.fundingAgencyId);
    return db.transaction(async (trx) => {
        const proposal = await trx('research_proposals').where({ id: proposalId, college_id: actor.collegeId }).forUpdate().first();
        if (!proposal)
            throw new AppError(404, 'Proposal not found');
        if (proposal.status !== 'APPROVED_INTERNALLY') {
            throw new AppError(400, `Cannot award a proposal in status ${proposal.status} (already awarded or not yet internally approved)`);
        }
        await trx('research_proposals').where({ id: proposalId }).update({
            status: 'AWARDED',
            sanctioned_amount: input.sanctionedAmount,
            sanction_reference: input.sanctionReference,
            sanction_date: input.sanctionDate,
            funding_agency_id: input.fundingAgencyId ?? proposal.funding_agency_id,
            updated_at: trx.fn.now(),
        });
        await auditFromActor(actor, 'PROPOSAL_AWARDED', 'research_proposal', proposalId, {
            before: { status: proposal.status },
            after: { status: 'AWARDED', sanctionedAmount: input.sanctionedAmount, sanctionReference: input.sanctionReference },
        });
        const updated = await trx('research_proposals').where({ id: proposalId }).first();
        const team = await trx('research_proposal_team').where({ proposal_id: proposalId });
        return shapeProposal(updated, team);
    });
}
// ── Convert to project (idempotent, concurrency-safe) ──────────────────────
async function nextProjectCode(trx, collegeId) {
    let seq = await trx('research_code_sequences').where({ college_id: collegeId, sequence_key: 'PROJECT' }).forUpdate().first();
    if (!seq) {
        try {
            await trx('research_code_sequences').insert({ college_id: collegeId, sequence_key: 'PROJECT', next_value: 1 });
        }
        catch (err) {
            if (!isDupError(err))
                throw err;
        }
        seq = await trx('research_code_sequences').where({ college_id: collegeId, sequence_key: 'PROJECT' }).forUpdate().first();
        if (!seq)
            throw new AppError(500, 'Failed to initialize project code sequence');
    }
    const value = n(seq.next_value);
    await trx('research_code_sequences').where({ id: seq.id }).update({ next_value: value + 1, updated_at: trx.fn.now() });
    const year = new Date().getFullYear();
    return `RP-${collegeId}-${year}-${String(value).padStart(5, '0')}`;
}
export async function convertToProject(actor, proposalId) {
    assertResearchPermission(actor, 'research.project.manage');
    return withDeadlockRetry(() => db.transaction(async (trx) => {
        const proposal = await trx('research_proposals').where({ id: proposalId, college_id: actor.collegeId }).forUpdate().first();
        if (!proposal)
            throw new AppError(404, 'Proposal not found');
        const existingProject = await trx('research_projects').where({ proposal_id: proposalId }).first();
        if (existingProject) {
            return shapeProject(existingProject, await trx('research_project_team').where({ project_id: existingProject.id }));
        }
        if (proposal.status !== 'AWARDED') {
            throw new AppError(400, `Cannot convert a proposal in status ${proposal.status} to a project (must be AWARDED)`);
        }
        const projectCode = await nextProjectCode(trx, actor.collegeId);
        let projectId;
        try {
            const [id] = await trx('research_projects').insert({
                college_id: actor.collegeId,
                proposal_id: proposalId,
                project_code: projectCode,
                title: proposal.title,
                project_type: proposal.project_type,
                department_id: proposal.department_id,
                pi_faculty_id: proposal.pi_faculty_id,
                funding_agency_id: proposal.funding_agency_id,
                sanctioned_amount: proposal.sanctioned_amount,
                sanction_reference: proposal.sanction_reference,
                sanction_date: proposal.sanction_date,
                status: 'ACTIVE',
                created_by: actor.facultyUserId,
            });
            projectId = n(id);
        }
        catch (err) {
            if (!isDupError(err))
                throw err;
            // Someone else already converted this proposal in a concurrent
            // transaction and won the race on `research_projects.proposal_id`'s
            // unique constraint — reselect and return that row (mirrors
            // `admissions/service.ts`'s `provisionGuardianAccount` duplicate-key idiom).
            const winner = await trx('research_projects').where({ proposal_id: proposalId }).first();
            if (!winner)
                throw new AppError(500, 'Project conversion race could not be resolved');
            return shapeProject(winner, await trx('research_project_team').where({ project_id: winner.id }));
        }
        const team = await trx('research_proposal_team').where({ proposal_id: proposalId });
        for (const member of team) {
            await trx('research_project_team').insert({
                college_id: actor.collegeId,
                project_id: projectId,
                faculty_id: member.faculty_id,
                role_in_project: member.role_in_project,
            });
        }
        await trx('research_proposals').where({ id: proposalId }).update({ status: 'CONVERTED_TO_PROJECT', updated_at: trx.fn.now() });
        await auditFromActor(actor, 'PROPOSAL_CONVERTED_TO_PROJECT', 'research_proposal', proposalId, { after: { projectId, projectCode } });
        const project = await trx('research_projects').where({ id: projectId }).first();
        return shapeProject(project, await trx('research_project_team').where({ project_id: projectId }));
    }));
}
function shapeProject(row, team) {
    return {
        id: n(row.id),
        collegeId: n(row.college_id),
        proposalId: n(row.proposal_id),
        projectCode: row.project_code,
        title: row.title,
        projectType: row.project_type,
        departmentId: row.department_id != null ? n(row.department_id) : null,
        piFacultyId: n(row.pi_faculty_id),
        fundingAgencyId: row.funding_agency_id != null ? n(row.funding_agency_id) : null,
        sanctionedAmount: row.sanctioned_amount != null ? Number(row.sanctioned_amount) : null,
        sanctionReference: row.sanction_reference ?? null,
        sanctionDate: row.sanction_date ?? null,
        startDate: row.start_date ?? null,
        endDate: row.end_date ?? null,
        status: row.status,
        closedAt: row.closed_at ?? null,
        closedBy: row.closed_by != null ? n(row.closed_by) : null,
        createdBy: row.created_by != null ? n(row.created_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        team: team.map((m) => ({ facultyId: n(m.faculty_id), roleInProject: m.role_in_project })),
    };
}
async function loadProjectRow(collegeId, projectId) {
    const row = await db('research_projects').where({ id: projectId, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Project not found');
    return row;
}
async function isProjectMember(collegeId, projectId, facultyId, piFacultyId) {
    if (n(piFacultyId) === n(facultyId))
        return true;
    const team = await db('research_project_team').where({ college_id: collegeId, project_id: projectId, faculty_id: facultyId }).first();
    return !!team;
}
async function assertCanAccessProject(actor, row) {
    if (isAdminRole(actor.role))
        return;
    if (['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'RESEARCH_COORDINATOR'].includes(actor.role))
        return;
    if (isHodOfDepartment(actor, row.department_id != null ? n(row.department_id) : null))
        return;
    if (await isProjectMember(actor.collegeId, n(row.id), actor.facultyUserId, n(row.pi_faculty_id)))
        return;
    throw new AppError(404, 'Project not found');
}
export async function getProject(actor, projectId) {
    assertResearchPermission(actor, 'research.project.view');
    const row = await loadProjectRow(actor.collegeId, projectId);
    await assertCanAccessProject(actor, row);
    const team = await db('research_project_team').where({ project_id: projectId });
    const utilizedRow = await db('research_project_utilization_entries').where({ project_id: projectId }).sum({ total: 'amount' }).first();
    return { ...shapeProject(row, team), amountUtilized: Number(utilizedRow?.total ?? 0) };
}
export async function listProjects(actor, filters = {}) {
    assertResearchPermission(actor, 'research.project.view');
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    let q = db('research_projects').where({ college_id: actor.collegeId });
    if (filters.status)
        q = q.andWhere({ status: filters.status });
    if (!isAdminRole(actor.role) && !['PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'RESEARCH_COORDINATOR'].includes(actor.role)) {
        const hodDepts = hodDepartmentIds(actor);
        const ownTeamProjectIds = (await db('research_project_team').where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId }).select('project_id')).map((r) => n(r.project_id));
        q = q.andWhere((builder) => {
            builder.where('pi_faculty_id', actor.facultyUserId);
            if (ownTeamProjectIds.length)
                builder.orWhereIn('id', ownTeamProjectIds);
            if (hodDepts.length)
                builder.orWhereIn('department_id', hodDepts);
        });
    }
    const rows = await q.clone().orderBy('id', 'desc').limit(pageSize).offset((page - 1) * pageSize);
    const totalRow = await q.clone().clearSelect().clearOrder().count({ c: '*' }).first();
    const teams = await db('research_project_team').where({ college_id: actor.collegeId }).whereIn('project_id', rows.map((r) => r.id));
    return {
        page, pageSize, total: n(totalRow?.c),
        items: rows.map((r) => shapeProject(r, teams.filter((t) => n(t.project_id) === n(r.id)))),
    };
}
// ── Utilization ──────────────────────────────────────────────────────────
export async function addUtilizationEntry(actor, projectId, input) {
    const project = await loadProjectRow(actor.collegeId, projectId);
    const isCoordinatorOrAdmin = isAdminRole(actor.role) || actor.role === 'RESEARCH_COORDINATOR';
    if (!isCoordinatorOrAdmin) {
        assertResearchPermission(actor, 'research.utilization.manage');
        const member = await isProjectMember(actor.collegeId, projectId, actor.facultyUserId, n(project.pi_faculty_id));
        if (!member)
            throw new AppError(403, 'Only the project PI/team or a Research Coordinator can record utilization');
    }
    const [id] = await db('research_project_utilization_entries').insert({
        college_id: actor.collegeId,
        project_id: projectId,
        amount: input.amount,
        description: input.description ?? null,
        recorded_at: input.recordedAt,
        recorded_by: actor.facultyUserId,
    });
    await auditFromActor(actor, 'PROJECT_UTILIZATION_RECORDED', 'research_project', projectId, { after: { entryId: n(id), amount: input.amount } });
    return getProject(actor, projectId);
}
// ── Closure (idempotent) ────────────────────────────────────────────────
export async function closeProject(actor, projectId, input) {
    assertResearchPermission(actor, 'research.project.manage');
    return db.transaction(async (trx) => {
        const project = await trx('research_projects').where({ id: projectId, college_id: actor.collegeId }).forUpdate().first();
        if (!project)
            throw new AppError(404, 'Project not found');
        if (project.status === 'CLOSED') {
            const team = await trx('research_project_team').where({ project_id: projectId });
            return shapeProject(project, team);
        }
        if (!['ACTIVE', 'ON_HOLD', 'COMPLETION_PENDING'].includes(String(project.status))) {
            throw new AppError(400, `Cannot close a project in status ${project.status}`);
        }
        await trx('research_projects').where({ id: projectId }).update({
            status: 'CLOSED', closed_at: trx.fn.now(), closed_by: actor.facultyUserId, updated_at: trx.fn.now(),
        });
        await auditFromActor(actor, 'PROJECT_CLOSED', 'research_project', projectId, { before: { status: project.status }, after: { status: 'CLOSED' }, reason: input.reason ?? null });
        const updated = await trx('research_projects').where({ id: projectId }).first();
        const team = await trx('research_project_team').where({ project_id: projectId });
        return shapeProject(updated, team);
    });
}
