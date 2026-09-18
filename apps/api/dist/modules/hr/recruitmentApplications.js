import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { APPLICATION_TRANSITIONS, } from './recruitmentTypes.js';
import { assertDeptScope, assertRecruitmentTransition, redactSensitiveApplication, asYmd, } from './recruitmentAccess.js';
import { serializeOpening } from './recruitmentOpenings.js';
import { serializeCandidate } from './recruitmentCandidates.js';
export function serializeApplication(row, actor) {
    const base = {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        candidateId: Number(row.candidate_id),
        openingId: Number(row.opening_id),
        status: row.status,
        source: row.source,
        salaryExpectation: row.salary_expectation != null ? Number(row.salary_expectation) : null,
        coverLetter: row.cover_letter,
        screenedBy: row.screened_by != null ? Number(row.screened_by) : null,
        screeningNotes: row.screening_notes,
        screeningDecision: row.screening_decision,
        screenedAt: row.screened_at,
        shortlistBy: row.shortlist_by != null ? Number(row.shortlist_by) : null,
        shortlistReason: row.shortlist_reason,
        shortlistedAt: row.shortlisted_at,
        selectedBy: row.selected_by != null ? Number(row.selected_by) : null,
        selectionReason: row.selection_reason,
        selectedAt: row.selected_at,
        employeeId: row.employee_id != null ? Number(row.employee_id) : null,
        joinedAt: row.joined_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    return actor ? redactSensitiveApplication(base, actor) : base;
}
export async function loadApplication(actor, id) {
    const row = await db('hr_recruitment_applications').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Application not found');
    return row;
}
export function assertApplicationTransition(from, to) {
    assertRecruitmentTransition('APPLICATION', from, to, APPLICATION_TRANSITIONS[from] ?? []);
}
export async function createApplicationRecord(collegeId, input, trx = db) {
    const opening = await trx('hr_job_openings').where({ id: input.openingId, college_id: collegeId }).first();
    if (!opening)
        throw new AppError(404, 'Job opening not found');
    if (String(opening.status) !== 'PUBLISHED') {
        throw new AppError(400, 'Applications are only accepted for published openings', undefined, 'OPENING_NOT_PUBLISHED');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (opening.application_start && asYmd(opening.application_start) > today) {
        throw new AppError(400, 'Application window has not started', undefined, 'APPLICATION_NOT_OPEN');
    }
    if (opening.application_deadline && asYmd(opening.application_deadline) < today) {
        throw new AppError(400, 'Application deadline has passed', undefined, 'APPLICATION_DEADLINE');
    }
    if (Number(opening.joined_count ?? 0) >= Number(opening.headcount)) {
        throw new AppError(400, 'Opening is filled', undefined, 'HEADCOUNT_FULL');
    }
    const existing = await trx('hr_recruitment_applications')
        .where({ candidate_id: input.candidateId, opening_id: input.openingId })
        .first();
    if (existing) {
        throw new AppError(409, 'Application already exists for this opening', undefined, 'APPLICATION_EXISTS');
    }
    const [id] = await trx('hr_recruitment_applications').insert({
        college_id: collegeId,
        candidate_id: input.candidateId,
        opening_id: input.openingId,
        status: 'APPLIED',
        source: input.source ?? null,
        salary_expectation: input.salaryExpectation ?? null,
        cover_letter: input.coverLetter ?? null,
    });
    return trx('hr_recruitment_applications').where({ id }).first();
}
export async function getApplication(actor, id) {
    assertHrPermission(actor, 'hr.recruitment.view');
    const row = await loadApplication(actor, id);
    const opening = await db('hr_job_openings').where({ id: row.opening_id }).first();
    if (opening)
        assertDeptScope(actor, Number(opening.department_id));
    const candidate = await db('hr_recruitment_candidates').where({ id: row.candidate_id }).first();
    return {
        ...serializeApplication(row, actor),
        opening: opening ? serializeOpening(opening) : null,
        candidate: candidate ? serializeCandidate(candidate) : null,
    };
}
export async function listApplications(actor, filters) {
    assertHrPermission(actor, 'hr.recruitment.view');
    let q = db('hr_recruitment_applications as a')
        .join('hr_job_openings as o', 'o.id', 'a.opening_id')
        .where({ 'a.college_id': actor.collegeId })
        .select('a.*', 'o.department_id as opening_department_id');
    if (filters?.openingId)
        q = q.andWhere({ 'a.opening_id': filters.openingId });
    if (filters?.status)
        q = q.andWhere({ 'a.status': filters.status });
    if (filters?.candidateId)
        q = q.andWhere({ 'a.candidate_id': filters.candidateId });
    if (!hasHrPermission(actor, 'hr.recruitment.manage')) {
        // HOD scope applied via openings list elsewhere; still filter if HOD-only view
    }
    const rows = await q.orderBy('a.id', 'desc').limit(500);
    return rows.map((r) => serializeApplication(r, actor));
}
export async function transitionApplication(actor, id, to, extra = {}) {
    const row = await loadApplication(actor, id);
    const from = String(row.status);
    assertApplicationTransition(from, to);
    await db('hr_recruitment_applications').where({ id }).update({ status: to, ...extra });
    const after = await loadApplication(actor, id);
    await recordHrAudit({
        actor,
        action: `APPLICATION_${to}`,
        entityType: 'hr_recruitment_applications',
        entityId: id,
        before: { status: from },
        after: serializeApplication(after, actor),
    });
    return after;
}
export async function withdrawApplication(actor, id) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    const after = await transitionApplication(actor, id, 'WITHDRAWN');
    return serializeApplication(after, actor);
}
export async function rejectApplication(actor, id, reason) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    const after = await transitionApplication(actor, id, 'REJECTED', {
        screening_notes: reason ?? null,
    });
    return serializeApplication(after, actor);
}
