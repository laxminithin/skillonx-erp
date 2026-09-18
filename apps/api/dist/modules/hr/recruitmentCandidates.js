import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { createCandidateSchema } from './recruitmentTypes.js';
import { ensureRecruitmentDefaults, normalizeEmail, normalizePhone } from './recruitmentAccess.js';
import { generateCandidateToken } from './recruitmentAccess.js';
export function serializeCandidate(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        location: row.location,
        qualificationSummary: row.qualification_summary,
        experienceSummary: row.experience_summary,
        source: row.source,
        referrerEmployeeId: row.referrer_employee_id != null ? Number(row.referrer_employee_id) : null,
        linkedEmployeeId: row.linked_employee_id != null ? Number(row.linked_employee_id) : null,
        consentAt: row.consent_at,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export async function findCandidateByEmail(collegeId, email) {
    return db('hr_recruitment_candidates')
        .where({ college_id: collegeId, email: normalizeEmail(email) })
        .first();
}
export async function findCandidateByPhone(collegeId, phone) {
    const p = normalizePhone(phone);
    if (!p)
        return null;
    return db('hr_recruitment_candidates').where({ college_id: collegeId, phone: p }).first();
}
export async function upsertCandidate(collegeId, input, trx = db) {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const existing = await trx('hr_recruitment_candidates').where({ college_id: collegeId, email }).first();
    if (existing) {
        const updates = {
            full_name: input.fullName,
            phone: phone ?? existing.phone,
        };
        if (input.location !== undefined)
            updates.location = input.location;
        if (input.qualificationSummary !== undefined)
            updates.qualification_summary = input.qualificationSummary;
        if (input.experienceSummary !== undefined)
            updates.experience_summary = input.experienceSummary;
        if (input.consent)
            updates.consent_at = trx.fn.now();
        await trx('hr_recruitment_candidates').where({ id: existing.id }).update(updates);
        return trx('hr_recruitment_candidates').where({ id: existing.id }).first();
    }
    if (phone) {
        const byPhone = await trx('hr_recruitment_candidates').where({ college_id: collegeId, phone }).first();
        if (byPhone) {
            throw new AppError(409, 'A candidate with this phone already exists under a different email', { candidateId: Number(byPhone.id) }, 'CANDIDATE_PHONE_DUP');
        }
    }
    const [id] = await trx('hr_recruitment_candidates').insert({
        college_id: collegeId,
        full_name: input.fullName,
        email,
        phone,
        location: input.location ?? null,
        qualification_summary: input.qualificationSummary ?? null,
        experience_summary: input.experienceSummary ?? null,
        source: input.source ?? 'CAREER_PORTAL',
        referrer_employee_id: input.referrerEmployeeId ?? null,
        linked_employee_id: input.linkedEmployeeId ?? null,
        consent_at: input.consent === false ? null : trx.fn.now(),
        status: 'ACTIVE',
    });
    return trx('hr_recruitment_candidates').where({ id }).first();
}
export async function createCandidate(actor, raw) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    await ensureRecruitmentDefaults(actor.collegeId);
    const input = createCandidateSchema.parse(raw);
    const row = await upsertCandidate(actor.collegeId, input);
    await recordHrAudit({
        actor,
        action: 'CANDIDATE_UPSERTED',
        entityType: 'hr_recruitment_candidates',
        entityId: Number(row.id),
        after: serializeCandidate(row),
    });
    return serializeCandidate(row);
}
export async function getCandidate(actor, id) {
    assertHrPermission(actor, 'hr.recruitment.view');
    const row = await db('hr_recruitment_candidates').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Candidate not found');
    return serializeCandidate(row);
}
export async function listCandidates(actor, q) {
    assertHrPermission(actor, 'hr.recruitment.view');
    let query = db('hr_recruitment_candidates').where({ college_id: actor.collegeId });
    if (q?.trim()) {
        const like = `%${q.trim()}%`;
        query = query.andWhere((b) => {
            b.whereILike('full_name', like).orWhereILike('email', like).orWhereILike('phone', like);
        });
    }
    const rows = await query.orderBy('id', 'desc').limit(200);
    return rows.map(serializeCandidate);
}
export async function issueCandidatePortalToken(actor, candidateId, opts) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    const candidate = await db('hr_recruitment_candidates')
        .where({ id: candidateId, college_id: actor.collegeId })
        .first();
    if (!candidate)
        throw new AppError(404, 'Candidate not found');
    const { raw, hash } = generateCandidateToken();
    const days = opts?.expiresInDays ?? 14;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const [id] = await db('hr_candidate_access_tokens').insert({
        college_id: actor.collegeId,
        candidate_id: candidateId,
        token_hash: hash,
        purpose: opts?.purpose ?? 'PORTAL',
        expires_at: expires,
    });
    await recordHrAudit({
        actor,
        action: 'CANDIDATE_TOKEN_ISSUED',
        entityType: 'hr_candidate_access_tokens',
        entityId: id,
        after: { candidateId, expiresAt: expires.toISOString() },
    });
    return { tokenId: id, token: raw, expiresAt: expires.toISOString() };
}
export async function revokeCandidateToken(actor, tokenId) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    const row = await db('hr_candidate_access_tokens')
        .where({ id: tokenId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Token not found');
    await db('hr_candidate_access_tokens').where({ id: tokenId }).update({ revoked_at: db.fn.now() });
    return { ok: true };
}
