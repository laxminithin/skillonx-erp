import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { applySchema } from './recruitmentTypes.js';
import { resolveCandidateToken, assertCandidateOwns, ensureRecruitmentDefaults, } from './recruitmentAccess.js';
import { serializeOpening } from './recruitmentOpenings.js';
import { upsertCandidate, serializeCandidate } from './recruitmentCandidates.js';
import { createApplicationRecord, serializeApplication } from './recruitmentApplications.js';
import { uploadCandidateDocument, getCandidateDocument } from './recruitmentDocuments.js';
import { acceptOfferAsCandidate } from './recruitmentOffers.js';
import { listCandidatePrejoiningTasks } from './recruitmentPreJoining.js';
import { notifyCandidate } from './recruitmentNotify.js';
import { generateCandidateToken } from './recruitmentAccess.js';
export async function listPublicOpenings(collegeId) {
    if (!collegeId)
        throw new AppError(400, 'collegeId required');
    const rows = await db('hr_job_openings')
        .where({ college_id: collegeId, status: 'PUBLISHED' })
        .orderBy('published_at', 'desc');
    return rows.map((r) => serializeOpening(r, true));
}
export async function getPublicOpening(collegeId, openingId) {
    const row = await db('hr_job_openings')
        .where({ id: openingId, college_id: collegeId, status: 'PUBLISHED' })
        .first();
    if (!row)
        throw new AppError(404, 'Job opening not found');
    return serializeOpening(row, true);
}
export async function publicApply(collegeId, raw) {
    await ensureRecruitmentDefaults(collegeId);
    const input = applySchema.parse(raw);
    if (!input.consent)
        throw new AppError(400, 'Consent is required to apply');
    const { raw: token, hash } = generateCandidateToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await db.transaction(async (trx) => {
        const candidate = await upsertCandidate(collegeId, {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            location: input.location,
            qualificationSummary: input.qualificationSummary,
            experienceSummary: input.experienceSummary,
            source: input.source,
            consent: true,
        }, trx);
        const app = await createApplicationRecord(collegeId, {
            candidateId: Number(candidate.id),
            openingId: input.openingId,
            source: input.source,
            salaryExpectation: input.salaryExpectation,
            coverLetter: input.coverLetter,
        }, trx);
        await trx('hr_candidate_access_tokens').insert({
            college_id: collegeId,
            candidate_id: candidate.id,
            token_hash: hash,
            purpose: 'PORTAL',
            expires_at: expires,
        });
        return { candidate: candidate, app: app };
    });
    if (input.resumeText) {
        await uploadCandidateDocument(collegeId, Number(result.candidate.id), {
            applicationId: Number(result.app.id),
            docType: 'RESUME',
            fileName: input.resumeFileName ?? 'resume.txt',
            contentType: 'text/plain',
            bodyText: input.resumeText,
        });
    }
    await notifyCandidate({
        candidateId: Number(result.candidate.id),
        collegeId,
        type: 'APPLICATION_RECEIVED',
        title: 'Application received',
        body: 'We have received your application.',
        relatedType: 'hr_recruitment_applications',
        relatedId: Number(result.app.id),
        dedupeKey: `applied-${result.app.id}`,
    });
    return {
        application: serializeApplication(result.app),
        candidate: serializeCandidate(result.candidate),
        portalToken: token,
        tokenExpiresAt: expires.toISOString(),
    };
}
export async function portalMe(rawToken) {
    const auth = await resolveCandidateToken(rawToken);
    const candidate = await db('hr_recruitment_candidates')
        .where({ id: auth.candidateId, college_id: auth.collegeId })
        .first();
    if (!candidate)
        throw new AppError(404, 'Candidate not found');
    const apps = await db('hr_recruitment_applications')
        .where({ candidate_id: auth.candidateId, college_id: auth.collegeId })
        .orderBy('id', 'desc');
    return {
        candidate: serializeCandidate(candidate),
        applications: apps.map((a) => serializeApplication(a)),
    };
}
export async function portalGetOffer(rawToken, offerId) {
    const auth = await resolveCandidateToken(rawToken);
    const offer = await db('hr_recruitment_offers')
        .where({ id: offerId, college_id: auth.collegeId, candidate_id: auth.candidateId })
        .first();
    if (!offer)
        throw new AppError(404, 'Offer not found');
    return {
        id: Number(offer.id),
        offerNumber: offer.offer_number,
        versionNo: Number(offer.version_no),
        status: offer.status,
        proposedJoiningDate: offer.proposed_joining_date,
        validUntil: offer.valid_until,
        compensationSummary: offer.compensation_summary,
        terms: offer.terms,
        documentId: offer.document_id != null ? Number(offer.document_id) : null,
        // Never expose compensation_json on public portal
    };
}
export async function portalAcceptOffer(rawToken, offerId) {
    const auth = await resolveCandidateToken(rawToken);
    return acceptOfferAsCandidate(auth.collegeId, auth.candidateId, offerId);
}
export async function portalPrejoining(rawToken, applicationId) {
    const auth = await resolveCandidateToken(rawToken);
    await assertCandidateOwns(auth, { applicationId });
    return listCandidatePrejoiningTasks(auth.collegeId, auth.candidateId, applicationId);
}
export async function portalGetDocument(rawToken, documentId) {
    const auth = await resolveCandidateToken(rawToken);
    return getCandidateDocument(auth.collegeId, auth.candidateId, documentId);
}
export async function portalListNotifications(rawToken) {
    const auth = await resolveCandidateToken(rawToken);
    if (!(await db.schema.hasTable('hr_candidate_notifications')))
        return [];
    const rows = await db('hr_candidate_notifications')
        .where({ candidate_id: auth.candidateId, college_id: auth.collegeId })
        .orderBy('id', 'desc')
        .limit(50);
    return rows.map((r) => ({
        id: Number(r.id),
        type: r.type,
        title: r.title,
        body: r.body,
        createdAt: r.created_at,
        readAt: r.read_at,
    }));
}
