import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { nextDocumentNumber } from '../finance/feeHeads.js';
import { OFFER_TRANSITIONS, createOfferSchema, offerDecisionSchema, } from './recruitmentTypes.js';
import { assertRecruitmentTransition, redactSensitiveOffer, asYmd, } from './recruitmentAccess.js';
import { loadApplication, transitionApplication } from './recruitmentApplications.js';
import { storeOfferLetterDocument } from './recruitmentDocuments.js';
import { notifyCandidate } from './recruitmentNotify.js';
import { initializePrejoiningTasks } from './recruitmentPreJoining.js';
export function serializeOffer(row, actor) {
    const base = {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        applicationId: Number(row.application_id),
        candidateId: Number(row.candidate_id),
        openingId: Number(row.opening_id),
        offerNumber: row.offer_number,
        versionNo: Number(row.version_no),
        parentOfferId: row.parent_offer_id != null ? Number(row.parent_offer_id) : null,
        designationId: Number(row.designation_id),
        departmentId: Number(row.department_id),
        employmentTypeId: Number(row.employment_type_id),
        proposedJoiningDate: row.proposed_joining_date,
        offerDate: row.offer_date,
        validUntil: row.valid_until,
        compensationSummary: row.compensation_summary,
        compensation: row.compensation_json
            ? typeof row.compensation_json === 'string'
                ? JSON.parse(String(row.compensation_json))
                : row.compensation_json
            : null,
        terms: row.terms,
        status: row.status,
        issuedAt: row.issued_at,
        acceptedAt: row.accepted_at,
        acceptanceMethod: row.acceptance_method,
        declinedAt: row.declined_at,
        declineReason: row.decline_reason,
        documentId: row.document_id != null ? Number(row.document_id) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    return actor ? redactSensitiveOffer(base, actor) : base;
}
async function loadOffer(actor, id) {
    const row = await db('hr_recruitment_offers').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Offer not found');
    return row;
}
function assertOfferMutable(row) {
    if (['ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN', 'SUPERSEDED', 'REJECTED'].includes(String(row.status))) {
        if (String(row.status) === 'ISSUED') {
            throw new AppError(400, 'Issued offers are immutable; create a new version', undefined, 'OFFER_IMMUTABLE');
        }
    }
}
export async function createOffer(actor, raw) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const input = createOfferSchema.parse(raw);
    const app = await loadApplication(actor, input.applicationId);
    if (!['SELECTED', 'OFFERED', 'ACCEPTED'].includes(String(app.status))) {
        throw new AppError(400, 'Application must be SELECTED (or revising offer)', undefined, 'APPLICATION_NOT_OFFERABLE');
    }
    const opening = await db('hr_job_openings').where({ id: app.opening_id }).first();
    if (!opening)
        throw new AppError(404, 'Opening not found');
    return db.transaction(async (trx) => {
        const active = await trx('hr_recruitment_offers')
            .where({ application_id: input.applicationId })
            .whereIn('status', ['DRAFT', 'APPROVAL_PENDING', 'APPROVED', 'ISSUED', 'ACCEPTED'])
            .orderBy('version_no', 'desc')
            .first();
        let versionNo = 1;
        let parentOfferId = null;
        if (active) {
            if (['DRAFT', 'APPROVAL_PENDING', 'APPROVED'].includes(String(active.status))) {
                throw new AppError(409, 'An in-progress offer already exists', undefined, 'OFFER_IN_PROGRESS');
            }
            versionNo = Number(active.version_no) + 1;
            parentOfferId = Number(active.id);
            if (String(active.status) === 'ISSUED' || String(active.status) === 'ACCEPTED') {
                await trx('hr_recruitment_offers').where({ id: active.id }).update({ status: 'SUPERSEDED' });
            }
        }
        const offerNumber = await nextDocumentNumber(trx, actor.collegeId, 'HR/OFF');
        const [id] = await trx('hr_recruitment_offers').insert({
            college_id: actor.collegeId,
            application_id: input.applicationId,
            candidate_id: app.candidate_id,
            opening_id: app.opening_id,
            offer_number: offerNumber,
            version_no: versionNo,
            parent_offer_id: parentOfferId,
            designation_id: input.designationId ?? opening.designation_id,
            department_id: input.departmentId ?? opening.department_id,
            employment_type_id: input.employmentTypeId ?? opening.employment_type_id,
            proposed_joining_date: input.proposedJoiningDate ?? null,
            offer_date: input.offerDate ?? new Date().toISOString().slice(0, 10),
            valid_until: input.validUntil ?? null,
            compensation_summary: input.compensationSummary ?? null,
            compensation_json: input.compensation ? JSON.stringify(input.compensation) : null,
            terms: input.terms ?? null,
            status: 'DRAFT',
            created_by: actor.facultyUserId,
        });
        const row = await trx('hr_recruitment_offers').where({ id }).first();
        await recordHrAudit({
            actor,
            action: 'OFFER_CREATED',
            entityType: 'hr_recruitment_offers',
            entityId: id,
            after: serializeOffer(row, actor),
        });
        return serializeOffer(row, actor);
    });
}
export async function updateOfferDraft(actor, offerId, raw) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const row = await loadOffer(actor, offerId);
    if (String(row.status) !== 'DRAFT') {
        throw new AppError(400, 'Only draft offers can be edited', undefined, 'OFFER_NOT_EDITABLE');
    }
    const input = createOfferSchema.partial().omit({ applicationId: true }).parse(raw);
    const updates = {};
    if (input.designationId != null)
        updates.designation_id = input.designationId;
    if (input.departmentId != null)
        updates.department_id = input.departmentId;
    if (input.employmentTypeId != null)
        updates.employment_type_id = input.employmentTypeId;
    if (input.proposedJoiningDate !== undefined)
        updates.proposed_joining_date = input.proposedJoiningDate;
    if (input.offerDate !== undefined)
        updates.offer_date = input.offerDate;
    if (input.validUntil !== undefined)
        updates.valid_until = input.validUntil;
    if (input.compensationSummary !== undefined)
        updates.compensation_summary = input.compensationSummary;
    if (input.compensation !== undefined) {
        updates.compensation_json = input.compensation ? JSON.stringify(input.compensation) : null;
    }
    if (input.terms !== undefined)
        updates.terms = input.terms;
    if (Object.keys(updates).length)
        await db('hr_recruitment_offers').where({ id: offerId }).update(updates);
    return serializeOffer(await loadOffer(actor, offerId), actor);
}
async function transitionOffer(actor, id, to, extra = {}) {
    const row = await loadOffer(actor, id);
    const from = String(row.status);
    assertRecruitmentTransition('OFFER', from, to, OFFER_TRANSITIONS[from] ?? []);
    await db('hr_recruitment_offers').where({ id }).update({ status: to, ...extra });
    const after = await loadOffer(actor, id);
    await recordHrAudit({
        actor,
        action: `OFFER_${to}`,
        entityType: 'hr_recruitment_offers',
        entityId: id,
        before: { status: from },
        after: serializeOffer(after, actor),
    });
    return after;
}
export async function submitOfferForApproval(actor, offerId) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const after = await transitionOffer(actor, offerId, 'APPROVAL_PENDING');
    return serializeOffer(after, actor);
}
export async function approveOffer(actor, offerId) {
    assertHrPermission(actor, 'hr.recruitment.approve');
    const after = await transitionOffer(actor, offerId, 'APPROVED', {
        approved_by: actor.facultyUserId,
        approved_at: db.fn.now(),
    });
    return serializeOffer(after, actor);
}
export async function rejectOfferApproval(actor, offerId, reason) {
    assertHrPermission(actor, 'hr.recruitment.approve');
    const after = await transitionOffer(actor, offerId, 'REJECTED', {
        decline_reason: reason ?? null,
    });
    return serializeOffer(after, actor);
}
export async function issueOffer(actor, offerId) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const row = await loadOffer(actor, offerId);
    if (String(row.status) !== 'APPROVED' && String(row.status) !== 'DRAFT') {
        // Allow DRAFT→ need go through approval; require APPROVED
    }
    if (String(row.status) !== 'APPROVED') {
        throw new AppError(400, 'Offer must be APPROVED before issue', undefined, 'RECRUITMENT_OFFER_INVALID_TRANSITION');
    }
    const candidate = await db('hr_recruitment_candidates').where({ id: row.candidate_id }).first();
    const opening = await db('hr_job_openings').where({ id: row.opening_id }).first();
    const fields = {
        offerNumber: row.offer_number,
        versionNo: row.version_no,
        candidateName: candidate?.full_name,
        title: opening?.title,
        proposedJoiningDate: row.proposed_joining_date,
        compensationSummary: row.compensation_summary,
        validUntil: row.valid_until,
    };
    const body = [
        'OFFER OF EMPLOYMENT',
        `Offer No: ${row.offer_number} (v${row.version_no})`,
        `Candidate: ${candidate?.full_name}`,
        `Position: ${opening?.title}`,
        `Proposed joining: ${row.proposed_joining_date ?? 'TBD'}`,
        `Compensation: ${row.compensation_summary ?? 'As discussed'}`,
        `Valid until: ${row.valid_until ?? 'N/A'}`,
        row.terms ? `Terms:\n${row.terms}` : '',
    ]
        .filter(Boolean)
        .join('\n');
    const documentId = await storeOfferLetterDocument({
        collegeId: actor.collegeId,
        candidateId: Number(row.candidate_id),
        applicationId: Number(row.application_id),
        bodyText: body,
        fields,
        uploadedById: actor.facultyUserId,
    });
    const after = await transitionOffer(actor, offerId, 'ISSUED', {
        issued_at: db.fn.now(),
        document_id: documentId,
    });
    const app = await db('hr_recruitment_applications').where({ id: row.application_id }).first();
    if (app && !['OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'].includes(String(app.status))) {
        await transitionApplication(actor, Number(row.application_id), 'OFFERED');
    }
    await notifyCandidate({
        candidateId: Number(row.candidate_id),
        collegeId: actor.collegeId,
        type: 'OFFER_ISSUED',
        title: 'Offer of employment',
        body: `You have received offer ${row.offer_number}`,
        relatedType: 'hr_recruitment_offers',
        relatedId: offerId,
        dedupeKey: `offer-issued-${offerId}`,
    });
    return serializeOffer(after, actor);
}
export async function acceptOffer(actor, offerId, raw) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const input = offerDecisionSchema.parse(raw ?? {});
    const row = await loadOffer(actor, offerId);
    await expireIfNeeded(row);
    const fresh = await loadOffer(actor, offerId);
    const after = await transitionOffer(actor, offerId, 'ACCEPTED', {
        accepted_at: db.fn.now(),
        acceptance_method: input.acceptanceMethod ?? 'IN_PERSON',
    });
    await transitionApplication(actor, Number(fresh.application_id), 'ACCEPTED');
    await transitionApplication(actor, Number(fresh.application_id), 'PRE_JOINING');
    await initializePrejoiningTasks(actor, Number(fresh.application_id), offerId);
    await notifyCandidate({
        candidateId: Number(fresh.candidate_id),
        collegeId: actor.collegeId,
        type: 'OFFER_ACCEPTED',
        title: 'Offer accepted',
        relatedType: 'hr_recruitment_offers',
        relatedId: offerId,
        dedupeKey: `offer-accepted-${offerId}`,
    });
    return serializeOffer(after, actor);
}
export async function acceptOfferAsCandidate(collegeId, candidateId, offerId) {
    const row = await db('hr_recruitment_offers')
        .where({ id: offerId, college_id: collegeId, candidate_id: candidateId })
        .first();
    if (!row)
        throw new AppError(404, 'Offer not found');
    await expireIfNeeded(row);
    const fresh = await db('hr_recruitment_offers').where({ id: offerId }).first();
    if (String(fresh.status) !== 'ISSUED') {
        throw new AppError(400, 'Offer is not available for acceptance', undefined, 'RECRUITMENT_OFFER_INVALID_TRANSITION');
    }
    await db('hr_recruitment_offers').where({ id: offerId }).update({
        status: 'ACCEPTED',
        accepted_at: db.fn.now(),
        acceptance_method: 'PORTAL',
    });
    await db('hr_recruitment_applications').where({ id: fresh.application_id }).update({ status: 'ACCEPTED' });
    await db('hr_recruitment_applications').where({ id: fresh.application_id }).update({ status: 'PRE_JOINING' });
    const createdBy = fresh.created_by ? Number(fresh.created_by) : null;
    const systemActor = {
        facultyUserId: createdBy ?? 0,
        collegeId,
        departmentId: null,
        role: 'COLLEGE_ADMIN',
    };
    await initializePrejoiningTasks(systemActor, Number(fresh.application_id), offerId);
    return serializeOffer((await db('hr_recruitment_offers').where({ id: offerId }).first()));
}
export async function declineOffer(actor, offerId, raw) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const input = offerDecisionSchema.parse(raw ?? {});
    const after = await transitionOffer(actor, offerId, 'DECLINED', {
        declined_at: db.fn.now(),
        decline_reason: input.reason ?? null,
    });
    await transitionApplication(actor, Number(after.application_id), 'OFFER_DECLINED');
    return serializeOffer(after, actor);
}
export async function withdrawOffer(actor, offerId, reason) {
    assertHrPermission(actor, 'hr.recruitment.offer');
    const after = await transitionOffer(actor, offerId, 'WITHDRAWN', {
        decline_reason: reason ?? null,
    });
    return serializeOffer(after, actor);
}
async function expireIfNeeded(row) {
    if (String(row.status) !== 'ISSUED' || !row.valid_until)
        return;
    const until = asYmd(row.valid_until);
    const today = new Date().toISOString().slice(0, 10);
    if (until < today) {
        await db('hr_recruitment_offers').where({ id: row.id }).update({ status: 'EXPIRED' });
        throw new AppError(400, 'Offer has expired', undefined, 'OFFER_EXPIRED');
    }
}
export async function expireOffersJob(collegeId) {
    let q = db('hr_recruitment_offers').where({ status: 'ISSUED' }).whereNotNull('valid_until');
    if (collegeId)
        q = q.andWhere({ college_id: collegeId });
    const today = new Date().toISOString().slice(0, 10);
    const rows = await q.where('valid_until', '<', today);
    for (const row of rows) {
        await db('hr_recruitment_offers').where({ id: row.id }).update({ status: 'EXPIRED' });
    }
    return { expired: rows.length };
}
export async function getOffer(actor, offerId) {
    assertHrPermission(actor, 'hr.recruitment.view');
    const row = await loadOffer(actor, offerId);
    if (!hasHrPermission(actor, 'hr.recruitment.offer') && !hasHrPermission(actor, 'hr.recruitment.manage')) {
        return redactSensitiveOffer(serializeOffer(row), actor);
    }
    return serializeOffer(row, actor);
}
export async function listOffers(actor, applicationId) {
    assertHrPermission(actor, 'hr.recruitment.view');
    let q = db('hr_recruitment_offers').where({ college_id: actor.collegeId });
    if (applicationId)
        q = q.andWhere({ application_id: applicationId });
    const rows = await q.orderBy('id', 'desc');
    return rows.map((r) => serializeOffer(r, actor));
}
export async function getAcceptedValidOffer(applicationId, collegeId) {
    const offer = await db('hr_recruitment_offers')
        .where({ application_id: applicationId, college_id: collegeId, status: 'ACCEPTED' })
        .orderBy('version_no', 'desc')
        .first();
    return offer ?? null;
}
