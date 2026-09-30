import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canAdminAlumni, canMergeAlumni, canSuggestAlumni, canVerifyAlumniRecords } from './access360.js';
import { upsertProvenance } from './provenance.js';
import { capabilitySchema, contactConfirmSchema, employment360Schema, expertiseSchema, mergeSchema, privacy360Schema, suggestionCreateSchema, suggestionReviewSchema, WILLINGNESS_DB, willingnessSchema, } from './types360.js';
async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: input.actorType,
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: input.actorAlumniId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
async function recordContactHistory(opts) {
    if (!(await db.schema.hasTable('alumni_contact_history')))
        return;
    if (String(opts.oldValue ?? '') === String(opts.newValue ?? ''))
        return;
    await db('alumni_contact_history').insert({
        college_id: opts.collegeId,
        alumni_profile_id: opts.alumniProfileId,
        field_name: opts.fieldName,
        old_value: opts.oldValue != null ? String(opts.oldValue) : null,
        new_value: opts.newValue != null ? String(opts.newValue) : null,
        source_type: opts.sourceType,
        changed_by_alumni_id: opts.changedByAlumniId ?? null,
        changed_by_faculty_id: opts.changedByFacultyId ?? null,
    });
}
export async function upsertEmployment360(actor, body, id) {
    const patch = {
        organization: body.organization,
        designation: body.designation ?? null,
        industry: body.industry ?? null,
        location: body.location ?? null,
        start_date: body.startDate ?? null,
        end_date: body.endDate ?? null,
        is_current: body.isCurrent ?? false,
        employment_type: body.employmentType ?? null,
        description: body.description ?? null,
        updated_at: db.fn.now(),
    };
    if (await db.schema.hasColumn('alumni_employment', 'functional_area')) {
        patch.functional_area = body.functionalArea ?? null;
        patch.seniority = body.seniority ?? null;
        patch.source_type = 'ALUMNI_SELF';
        patch.verification_status = 'SELF_DECLARED';
        if (!id)
            patch.captured_at = db.fn.now();
    }
    if (patch.is_current) {
        await db('alumni_employment')
            .where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId })
            .update({ is_current: false });
    }
    let entityId = id;
    if (id) {
        const before = await db('alumni_employment')
            .where({ id, college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId })
            .first();
        if (!before)
            throw new AppError(404, 'Employment record not found');
        await db('alumni_employment').where({ id }).update(patch);
    }
    else {
        const [newId] = await db('alumni_employment').insert({
            college_id: actor.collegeId,
            alumni_profile_id: actor.alumniProfileId,
            ...patch,
        });
        entityId = Number(newId);
    }
    if (await db.schema.hasColumn('alumni_profiles', 'employment_confirmed_at')) {
        await db('alumni_profiles').where({ id: actor.alumniProfileId }).update({ employment_confirmed_at: db.fn.now() });
    }
    await upsertProvenance({
        collegeId: actor.collegeId,
        alumniProfileId: actor.alumniProfileId,
        entityType: 'alumni_employment',
        entityId: entityId,
        fieldName: 'organization',
        sourceType: 'ALUMNI_SELF',
        verificationStatus: 'SELF_DECLARED',
        valueSnapshot: body.organization,
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'ALUMNI',
        actorAlumniId: actor.alumniProfileId,
        action: id ? 'ALUMNI_EMPLOYMENT_UPDATED' : 'ALUMNI_EMPLOYMENT_CREATED',
        entityType: 'alumni_employment',
        entityId: entityId,
        metadata: { before: id ? 'updated' : null, after: body },
    });
    return db('alumni_employment').where({ id: entityId }).first();
}
export async function updateWillingness(actor, body) {
    if (!(await db.schema.hasColumn('alumni_profiles', 'open_to_mentoring'))) {
        throw new AppError(503, 'Willingness fields not migrated yet');
    }
    const patch = { updated_at: db.fn.now() };
    for (const [key, col] of Object.entries(WILLINGNESS_DB)) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            patch[col] = body[key];
        }
    }
    if (body.confirmNow || Object.keys(patch).length > 1) {
        patch.willingness_confirmed_at = db.fn.now();
    }
    // Keep legacy mentorship flag in sync when explicitly set
    if (body.openToMentoring != null)
        patch.mentorship_available = Boolean(body.openToMentoring);
    await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).update(patch);
    await upsertProvenance({
        collegeId: actor.collegeId,
        alumniProfileId: actor.alumniProfileId,
        entityType: 'alumni_profile',
        entityId: actor.alumniProfileId,
        fieldName: 'willingness',
        sourceType: 'ALUMNI_SELF',
        verificationStatus: 'SELF_DECLARED',
        valueSnapshot: body,
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'ALUMNI',
        actorAlumniId: actor.alumniProfileId,
        action: 'ALUMNI_WILLINGNESS_UPDATED',
        entityType: 'alumni_profile',
        entityId: actor.alumniProfileId,
        metadata: body,
    });
    return db('alumni_profiles').where({ id: actor.alumniProfileId }).first();
}
export async function upsertCapability(actor, body) {
    if (!(await db.schema.hasTable('alumni_interest_capabilities'))) {
        throw new AppError(503, 'Interest capabilities not migrated yet');
    }
    const existing = await db('alumni_interest_capabilities')
        .where({ alumni_profile_id: actor.alumniProfileId, capability_domain: body.capabilityDomain })
        .first();
    const patch = {
        details: body.details ? JSON.stringify(body.details) : null,
        is_active: body.isActive ?? true,
        source_type: 'ALUMNI_SELF',
        verification_status: 'SELF_DECLARED',
        confirmed_at: db.fn.now(),
        updated_at: db.fn.now(),
    };
    if (existing) {
        await db('alumni_interest_capabilities').where({ id: existing.id }).update(patch);
        return db('alumni_interest_capabilities').where({ id: existing.id }).first();
    }
    const [id] = await db('alumni_interest_capabilities').insert({
        college_id: actor.collegeId,
        alumni_profile_id: actor.alumniProfileId,
        capability_domain: body.capabilityDomain,
        ...patch,
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'ALUMNI',
        actorAlumniId: actor.alumniProfileId,
        action: 'ALUMNI_CAPABILITY_UPSERTED',
        entityType: 'alumni_interest_capability',
        entityId: Number(id),
    });
    return db('alumni_interest_capabilities').where({ id }).first();
}
export async function updateExpertise(actor, body) {
    const patch = { updated_at: db.fn.now() };
    if (body.skills)
        patch.skills = JSON.stringify(body.skills);
    if (body.technologies && (await db.schema.hasColumn('alumni_profiles', 'technologies'))) {
        patch.technologies = JSON.stringify(body.technologies);
    }
    if (body.domainsExpertise && (await db.schema.hasColumn('alumni_profiles', 'domains_expertise'))) {
        patch.domains_expertise = JSON.stringify(body.domainsExpertise);
    }
    if (body.industryExpertise && (await db.schema.hasColumn('alumni_profiles', 'industry_expertise'))) {
        patch.industry_expertise = JSON.stringify(body.industryExpertise);
    }
    if (body.researchExpertise && (await db.schema.hasColumn('alumni_profiles', 'research_expertise'))) {
        patch.research_expertise = JSON.stringify(body.researchExpertise);
    }
    if (body.certifications && (await db.schema.hasColumn('alumni_profiles', 'certifications'))) {
        patch.certifications = JSON.stringify(body.certifications);
    }
    await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).update(patch);
    await upsertProvenance({
        collegeId: actor.collegeId,
        alumniProfileId: actor.alumniProfileId,
        entityType: 'alumni_profile',
        entityId: actor.alumniProfileId,
        fieldName: 'expertise',
        sourceType: 'ALUMNI_SELF',
        verificationStatus: 'SELF_DECLARED',
        valueSnapshot: body,
    });
    return db('alumni_profiles').where({ id: actor.alumniProfileId }).first();
}
export async function updatePrivacy360(actor, body) {
    const before = await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).first();
    if (!before)
        throw new AppError(404, 'Alumni profile not found');
    const map = {
        emailVisibility: 'email_visibility',
        phoneVisibility: 'phone_visibility',
        bioVisibility: 'bio_visibility',
        employmentVisibility: 'employment_visibility',
        socialVisibility: 'social_visibility',
        networkingVisibility: 'networking_visibility',
        directoryVisible: 'directory_visible',
        connectionVisible: 'connection_visible',
        professionalDataVisible: 'professional_data_visible',
        commEmailOptIn: 'comm_email_opt_in',
        commSmsOptIn: 'comm_sms_opt_in',
        commPhoneOptIn: 'comm_phone_opt_in',
        commWhatsappOptIn: 'comm_whatsapp_opt_in',
    };
    const patch = { updated_at: db.fn.now() };
    for (const [k, v] of Object.entries(body)) {
        const col = map[k];
        if (!col)
            continue;
        if (!(await db.schema.hasColumn('alumni_profiles', col)) && !['email_visibility', 'phone_visibility', 'bio_visibility', 'employment_visibility', 'social_visibility', 'networking_visibility'].includes(col)) {
            continue;
        }
        patch[col] = v;
    }
    await db('alumni_profiles').where({ id: actor.alumniProfileId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorType: 'ALUMNI',
        actorAlumniId: actor.alumniProfileId,
        action: 'ALUMNI_PRIVACY_UPDATED',
        entityType: 'alumni_profile',
        entityId: actor.alumniProfileId,
        metadata: { before: {
                email: before.email_visibility,
                phone: before.phone_visibility,
                directory: before.directory_visible,
            }, after: body },
    });
    return db('alumni_profiles').where({ id: actor.alumniProfileId }).first();
}
export async function confirmContact(actor, body) {
    const before = await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).first();
    if (!before)
        throw new AppError(404, 'Alumni profile not found');
    const patch = { updated_at: db.fn.now() };
    if (body.email && body.email !== before.email) {
        await recordContactHistory({
            collegeId: actor.collegeId,
            alumniProfileId: actor.alumniProfileId,
            fieldName: 'email',
            oldValue: before.email,
            newValue: body.email,
            sourceType: 'ALUMNI_SELF',
            changedByAlumniId: actor.alumniProfileId,
        });
        patch.email = body.email.trim().toLowerCase();
    }
    if (body.phoneOverride !== undefined && (await db.schema.hasColumn('alumni_profiles', 'phone_override'))) {
        await recordContactHistory({
            collegeId: actor.collegeId,
            alumniProfileId: actor.alumniProfileId,
            fieldName: 'phone_override',
            oldValue: before.phone_override,
            newValue: body.phoneOverride,
            sourceType: 'ALUMNI_SELF',
            changedByAlumniId: actor.alumniProfileId,
        });
        patch.phone_override = body.phoneOverride;
    }
    if (body.currentCity !== undefined) {
        await recordContactHistory({
            collegeId: actor.collegeId,
            alumniProfileId: actor.alumniProfileId,
            fieldName: 'current_city',
            oldValue: before.current_city,
            newValue: body.currentCity,
            sourceType: 'ALUMNI_SELF',
            changedByAlumniId: actor.alumniProfileId,
        });
        patch.current_city = body.currentCity;
    }
    if (body.currentCountry !== undefined) {
        patch.current_country = body.currentCountry;
    }
    if (body.confirmContact !== false && (await db.schema.hasColumn('alumni_profiles', 'contact_verified_at'))) {
        patch.contact_verified_at = db.fn.now();
    }
    await db('alumni_profiles').where({ id: actor.alumniProfileId }).update(patch);
    await upsertProvenance({
        collegeId: actor.collegeId,
        alumniProfileId: actor.alumniProfileId,
        entityType: 'alumni_profile',
        entityId: actor.alumniProfileId,
        fieldName: 'contact',
        sourceType: 'ALUMNI_SELF',
        verificationStatus: 'SELF_DECLARED',
    });
    return db('alumni_profiles').where({ id: actor.alumniProfileId }).first();
}
export async function createSuggestion(actor, body) {
    if (!canSuggestAlumni(actor))
        throw new AppError(403, 'Not authorised to suggest alumni updates');
    if (!(await db.schema.hasTable('alumni_profile_suggestions'))) {
        throw new AppError(503, 'Suggestions not migrated yet');
    }
    const profile = await db('alumni_profiles').where({ id: body.alumniProfileId, college_id: actor.collegeId }).first();
    if (!profile)
        throw new AppError(404, 'Alumni profile not found');
    if (['HOD', 'FACULTY'].includes(actor.role) && actor.departmentId != null) {
        if (profile.historical_department_id != null && Number(profile.historical_department_id) !== actor.departmentId) {
            throw new AppError(403, 'Alumni outside your department scope');
        }
    }
    const [id] = await db('alumni_profile_suggestions').insert({
        college_id: actor.collegeId,
        alumni_profile_id: body.alumniProfileId,
        suggested_by_faculty_id: actor.facultyUserId,
        suggested_by_department_id: actor.departmentId,
        suggestion_type: body.suggestionType,
        title: body.title,
        payload: JSON.stringify(body.payload),
        rationale: body.rationale ?? null,
        status: 'PENDING',
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'FACULTY',
        actorFacultyId: actor.facultyUserId,
        action: 'ALUMNI_SUGGESTION_CREATED',
        entityType: 'alumni_profile_suggestion',
        entityId: Number(id),
        metadata: { alumniProfileId: body.alumniProfileId, suggestionType: body.suggestionType },
    });
    return db('alumni_profile_suggestions').where({ id }).first();
}
export async function listSuggestions(actor, filters = {}) {
    if (!canSuggestAlumni(actor))
        throw new AppError(403, 'Not authorised');
    if (!(await db.schema.hasTable('alumni_profile_suggestions')))
        return { suggestions: [] };
    let q = db('alumni_profile_suggestions as s')
        .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
        .where('s.college_id', actor.collegeId)
        .select('s.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn');
    if (filters.status)
        q = q.andWhere('s.status', filters.status);
    if (filters.alumniProfileId)
        q = q.andWhere('s.alumni_profile_id', filters.alumniProfileId);
    if (['HOD', 'FACULTY'].includes(actor.role) && actor.departmentId != null) {
        q = q.andWhere('ap.historical_department_id', actor.departmentId);
    }
    const rows = await q.orderBy('s.created_at', 'desc').limit(100);
    return { suggestions: rows };
}
export async function reviewSuggestion(actor, suggestionId, body) {
    if (!canVerifyAlumniRecords(actor))
        throw new AppError(403, 'Verification privilege required');
    const suggestion = await db('alumni_profile_suggestions')
        .where({ id: suggestionId, college_id: actor.collegeId, status: 'PENDING' })
        .first();
    if (!suggestion)
        throw new AppError(404, 'Pending suggestion not found');
    if (body.action === 'REJECT') {
        await db('alumni_profile_suggestions').where({ id: suggestionId }).update({
            status: 'REJECTED',
            reviewed_by: actor.facultyUserId,
            reviewed_at: db.fn.now(),
            review_notes: body.reviewNotes ?? null,
            updated_at: db.fn.now(),
        });
        await audit({
            collegeId: actor.collegeId,
            actorType: 'FACULTY',
            actorFacultyId: actor.facultyUserId,
            action: 'ALUMNI_SUGGESTION_REJECTED',
            entityType: 'alumni_profile_suggestion',
            entityId: suggestionId,
        });
        return db('alumni_profile_suggestions').where({ id: suggestionId }).first();
    }
    // ACCEPT — apply carefully; never silently overwrite without provenance
    let payload = {};
    try {
        payload = typeof suggestion.payload === 'string' ? JSON.parse(suggestion.payload) : suggestion.payload;
    }
    catch {
        throw new AppError(400, 'Invalid suggestion payload');
    }
    let appliedEntityId = null;
    if (suggestion.suggestion_type === 'EMPLOYMENT_UPDATE') {
        const emp = employment360Schema.partial().extend({ organization: z.string().min(1) }).parse(payload);
        const [empId] = await db('alumni_employment').insert({
            college_id: actor.collegeId,
            alumni_profile_id: suggestion.alumni_profile_id,
            organization: emp.organization,
            designation: emp.designation ?? null,
            industry: emp.industry ?? null,
            location: emp.location ?? null,
            start_date: emp.startDate ?? null,
            end_date: emp.endDate ?? null,
            is_current: emp.isCurrent ?? true,
            employment_type: emp.employmentType ?? null,
            description: emp.description ?? null,
            functional_area: emp.functionalArea ?? null,
            seniority: emp.seniority ?? null,
            source_type: 'FACULTY',
            verification_status: 'INSTITUTION_VERIFIED',
            verified_by: actor.facultyUserId,
            last_verified_at: db.fn.now(),
            captured_at: db.fn.now(),
        });
        appliedEntityId = Number(empId);
        if (emp.isCurrent !== false) {
            await db('alumni_employment')
                .where({ alumni_profile_id: suggestion.alumni_profile_id, college_id: actor.collegeId })
                .whereNot('id', appliedEntityId)
                .update({ is_current: false });
        }
        await upsertProvenance({
            collegeId: actor.collegeId,
            alumniProfileId: Number(suggestion.alumni_profile_id),
            entityType: 'alumni_employment',
            entityId: appliedEntityId,
            fieldName: 'organization',
            sourceType: 'FACULTY',
            verificationStatus: 'INSTITUTION_VERIFIED',
            verifiedBy: actor.facultyUserId,
            sourceReference: `suggestion:${suggestionId}`,
            valueSnapshot: emp,
        });
    }
    await db('alumni_profile_suggestions').where({ id: suggestionId }).update({
        status: 'ACCEPTED',
        reviewed_by: actor.facultyUserId,
        reviewed_at: db.fn.now(),
        review_notes: body.reviewNotes ?? null,
        applied_entity_id: appliedEntityId,
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'FACULTY',
        actorFacultyId: actor.facultyUserId,
        action: 'ALUMNI_SUGGESTION_ACCEPTED',
        entityType: 'alumni_profile_suggestion',
        entityId: suggestionId,
        metadata: { appliedEntityId },
    });
    return db('alumni_profile_suggestions').where({ id: suggestionId }).first();
}
function normalizeName(n) {
    return n.toLowerCase().replace(/[^a-z0-9]/g, '');
}
export async function detectIdentityCandidates(actor) {
    if (!canAdminAlumni(actor))
        throw new AppError(403, 'Alumni administration access required');
    if (!(await db.schema.hasTable('alumni_identity_candidates'))) {
        return { candidates: [], detected: 0 };
    }
    const profiles = await db('alumni_profiles').where({ college_id: actor.collegeId }).select('*');
    let detected = 0;
    const emailMap = new Map();
    for (const p of profiles) {
        const key = String(p.email).toLowerCase();
        if (!emailMap.has(key))
            emailMap.set(key, []);
        emailMap.get(key).push(p);
    }
    // Same email across different profiles shouldn't happen due to unique constraint,
    // but name+grad year and phone overlaps can.
    for (let i = 0; i < profiles.length; i++) {
        for (let j = i + 1; j < profiles.length; j++) {
            const a = profiles[i];
            const b = profiles[j];
            const reasons = [];
            let score = 0;
            if (normalizeName(a.historical_name) === normalizeName(b.historical_name) && a.graduation_year === b.graduation_year) {
                reasons.push('NAME_GRAD_YEAR');
                score += 60;
            }
            if (a.phone_override && b.phone_override && String(a.phone_override).replace(/\D/g, '') === String(b.phone_override).replace(/\D/g, '')) {
                reasons.push('PHONE');
                score += 40;
            }
            if (score < 60)
                continue;
            const primary = Number(a.id) < Number(b.id) ? a : b;
            const candidate = primary === a ? b : a;
            const existing = await db('alumni_identity_candidates')
                .where({ primary_profile_id: primary.id, candidate_profile_id: candidate.id })
                .first();
            if (existing)
                continue;
            await db('alumni_identity_candidates').insert({
                college_id: actor.collegeId,
                primary_profile_id: primary.id,
                candidate_profile_id: candidate.id,
                match_reason: reasons.join('+'),
                match_score: score,
                evidence: JSON.stringify({ reasons, score }),
                status: score >= 90 ? 'OPEN' : 'AMBIGUOUS',
            });
            detected += 1;
        }
    }
    const candidates = await db('alumni_identity_candidates')
        .where({ college_id: actor.collegeId })
        .whereIn('status', ['OPEN', 'AMBIGUOUS'])
        .orderBy('match_score', 'desc')
        .limit(100);
    return { candidates, detected };
}
export async function mergeAlumniIdentities(actor, body) {
    if (!canMergeAlumni(actor))
        throw new AppError(403, 'Merge privilege required');
    if (body.survivorProfileId === body.mergedProfileId)
        throw new AppError(400, 'Cannot merge a profile into itself');
    if (!(await db.schema.hasTable('alumni_merge_audit')))
        throw new AppError(503, 'Merge audit not migrated yet');
    return db.transaction(async (trx) => {
        const survivor = await trx('alumni_profiles')
            .where({ id: body.survivorProfileId, college_id: actor.collegeId })
            .forUpdate()
            .first();
        const merged = await trx('alumni_profiles')
            .where({ id: body.mergedProfileId, college_id: actor.collegeId })
            .forUpdate()
            .first();
        if (!survivor || !merged)
            throw new AppError(404, 'Profile not found');
        const candidate = await trx('alumni_identity_candidates')
            .where({ college_id: actor.collegeId })
            .where((q) => {
            q.where({ primary_profile_id: survivor.id, candidate_profile_id: merged.id })
                .orWhere({ primary_profile_id: merged.id, candidate_profile_id: survivor.id });
        })
            .first();
        if (candidate?.status === 'AMBIGUOUS' && !body.confirmAmbiguous) {
            throw new AppError(409, 'Ambiguous identity match — set confirmAmbiguous=true to proceed', undefined, 'AMBIGUOUS_MERGE');
        }
        const beforeSnapshot = { survivor, merged };
        // Re-home child rows (do not invent data — move existing)
        for (const table of [
            'alumni_employment',
            'alumni_higher_studies',
            'alumni_entrepreneurship',
            'alumni_achievements',
            'alumni_contributions',
            'alumni_event_registrations',
            'alumni_engagement',
        ]) {
            if (await trx.schema.hasTable(table)) {
                await trx(table)
                    .where({ college_id: actor.collegeId, alumni_profile_id: merged.id })
                    .update({ alumni_profile_id: survivor.id });
            }
        }
        // Archive merged profile — never auto-delete student link
        await trx('alumni_profiles').where({ id: merged.id }).update({
            is_active: false,
            lifecycle_state: 'ARCHIVED',
            verification_state: 'REJECTED',
            rejection_reason: `Merged into alumni profile ${survivor.id}`,
            updated_at: trx.fn.now(),
        });
        if (candidate) {
            await trx('alumni_identity_candidates').where({ id: candidate.id }).update({ status: 'MERGED', updated_at: trx.fn.now() });
        }
        const after = await trx('alumni_profiles').where({ id: survivor.id }).first();
        const [auditId] = await trx('alumni_merge_audit').insert({
            college_id: actor.collegeId,
            survivor_profile_id: survivor.id,
            merged_profile_id: merged.id,
            acted_by_faculty_id: actor.facultyUserId,
            before_snapshot: JSON.stringify(beforeSnapshot),
            after_snapshot: JSON.stringify(after),
            reason: body.reason,
            status: 'COMPLETED',
        });
        await trx('alumni_audit_log').insert({
            college_id: actor.collegeId,
            actor_type: 'FACULTY',
            actor_faculty_id: actor.facultyUserId,
            action: 'ALUMNI_IDENTITY_MERGED',
            entity_type: 'alumni_merge_audit',
            entity_id: auditId,
            metadata: JSON.stringify({ survivor: survivor.id, merged: merged.id, reason: body.reason }),
        });
        return { survivorProfileId: Number(survivor.id), mergedProfileId: Number(merged.id), mergeAuditId: Number(auditId) };
    });
}
export async function verifyEmploymentRecord(actor, employmentId) {
    if (!canVerifyAlumniRecords(actor))
        throw new AppError(403, 'Verification privilege required');
    const row = await db('alumni_employment').where({ id: employmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Employment not found');
    const patch = {
        verification_status: 'INSTITUTION_VERIFIED',
        updated_at: db.fn.now(),
    };
    if (await db.schema.hasColumn('alumni_employment', 'last_verified_at')) {
        patch.last_verified_at = db.fn.now();
        patch.verified_by = actor.facultyUserId;
    }
    await db('alumni_employment').where({ id: employmentId }).update(patch);
    await upsertProvenance({
        collegeId: actor.collegeId,
        alumniProfileId: Number(row.alumni_profile_id),
        entityType: 'alumni_employment',
        entityId: employmentId,
        fieldName: 'organization',
        sourceType: 'FACULTY',
        verificationStatus: 'INSTITUTION_VERIFIED',
        verifiedBy: actor.facultyUserId,
    });
    await audit({
        collegeId: actor.collegeId,
        actorType: 'FACULTY',
        actorFacultyId: actor.facultyUserId,
        action: 'ALUMNI_EMPLOYMENT_VERIFIED',
        entityType: 'alumni_employment',
        entityId: employmentId,
    });
    return db('alumni_employment').where({ id: employmentId }).first();
}
// Re-export schemas used by controller
export { employment360Schema, willingnessSchema, capabilitySchema, expertiseSchema, privacy360Schema, suggestionCreateSchema, suggestionReviewSchema, mergeSchema, contactConfirmSchema, };
