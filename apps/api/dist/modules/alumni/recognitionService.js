/**
 * Alumni Recognition, Value & Community service (C6).
 * Human recognition decisions only. Never auto-awards or invents VIEWED participation.
 */
import crypto from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canAccessRecognition, canApproveRecognition, canManageCommunities, canManageValueOfferings, canNominate, canOperateRecognition, canPublishSpotlight, canReviewNomination, isDepartmentScopedRecognition, } from './accessRecognition.js';
import { assistEligibility, buildReciprocityView, discoverAchievementCandidates, discoverContributionSuggestions, parseEligibilityRules, } from './recognitionEngine.js';
import { DEFAULT_REVIEW_STAGES, RECOGNITION_CATEGORY_CODES, SOURCE_OF_TRUTH_MATRIX, SYSTEM_CATEGORY_LABELS, categoryUpsertSchema, communityCreateSchema, communityPatchSchema, connectionRequestSchema, connectionRespondSchema, correctRecognitionSchema, evidenceSchema, issueRecognitionSchema, membershipSchema, nominationCreateSchema, nominationPatchSchema, participationSchema, programCreateSchema, programPatchSchema, reviewSchema, spotlightCreateSchema, spotlightPatchSchema, valueOfferingCreateSchema, valueOfferingPatchSchema, } from './typesRecognition.js';
export function assertAccess(actor) {
    if (!canAccessRecognition(actor))
        throw new AppError(403, 'Recognition access denied');
}
export function assertOperate(actor) {
    if (!canOperateRecognition(actor))
        throw new AppError(403, 'Recognition operate denied');
}
export function assertApprove(actor) {
    if (!canApproveRecognition(actor))
        throw new AppError(403, 'Recognition approve denied');
}
export async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: input.actorType ?? (input.actorAlumniId ? 'ALUMNI' : 'FACULTY'),
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: input.actorAlumniId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
export function parseJson(raw, fallback) {
    if (raw == null)
        return fallback;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    return raw;
}
function serializeJson(value) {
    if (value == null)
        return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
}
async function requireTables() {
    if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
        throw new AppError(503, 'Run migration alumni_recognition_c6 first');
    }
}
function scopeProgramsQuery(actor, q) {
    q = q.where('p.college_id', actor.collegeId);
    if (isDepartmentScopedRecognition(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('p.department_id', actor.departmentId).orWhereNull('p.department_id');
        });
    }
    return q;
}
function randomToken(bytes = 24) {
    return crypto.randomBytes(bytes).toString('hex');
}
function certificateReference(collegeId) {
    return `ARC-${collegeId}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
function mapReviewDecisionToStatus(decision, next) {
    if (next) {
        if (next === 'APPROVED' && decision !== 'APPROVE')
            return null;
        return next;
    }
    switch (decision) {
        case 'APPROVE':
            return 'UNDER_REVIEW';
        case 'REJECT':
            return 'REJECTED';
        case 'REQUEST_EVIDENCE':
            return 'MORE_EVIDENCE_REQUIRED';
        case 'SHORTLIST':
            return 'SHORTLISTED';
        default:
            return null;
    }
}
function consentedContact(profile) {
    const canSee = (visibility) => visibility === 'PUBLIC' || visibility === 'ALUMNI_NETWORK';
    return {
        name: profile.historical_name ?? null,
        email: canSee(profile.email_visibility) ? profile.email ?? null : null,
        phone: canSee(profile.phone_visibility) ? profile.phone ?? profile.student_phone ?? null : null,
        linkedinUrl: canSee(profile.social_visibility) ? profile.linkedin_url ?? null : null,
        currentCity: profile.current_city ?? null,
        headline: profile.headline ?? null,
    };
}
async function markC4Recorded(collegeId, c4NominationId) {
    if (!c4NominationId)
        return;
    if (!(await db.schema.hasTable('alumni_engagement_recognition_noms')))
        return;
    await db('alumni_engagement_recognition_noms')
        .where({ id: c4NominationId, college_id: collegeId })
        .update({ status: 'RECORDED', updated_at: db.fn.now() });
}
async function assertAlumniOwn(actor, alumniProfileId) {
    if (actor.alumniProfileId !== alumniProfileId) {
        throw new AppError(403, 'Alumni may only access their own profile');
    }
}
export function serializeCategory(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        code: row.code,
        label: row.label,
        description: row.description,
        isSystem: Boolean(row.is_system),
        isActive: Boolean(row.is_active),
        sortOrder: Number(row.sort_order || 0),
    };
}
export function serializeProgram(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        name: row.name,
        category: row.category,
        description: row.description,
        academicYear: row.academic_year,
        eligibilityRules: parseEligibilityRules(row.eligibility_rules),
        nominationStart: row.nomination_start,
        nominationEnd: row.nomination_end,
        reviewStart: row.review_start,
        reviewEnd: row.review_end,
        awardDate: row.award_date,
        publicationDate: row.publication_date,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        scope: row.scope,
        status: row.status,
        createdByFacultyId: row.created_by_faculty_id != null ? Number(row.created_by_faculty_id) : null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export function serializeNomination(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        programId: row.program_id != null ? Number(row.program_id) : null,
        category: row.category,
        title: row.title,
        reason: row.reason,
        source: row.source,
        nominatorFacultyId: row.nominator_faculty_id != null ? Number(row.nominator_faculty_id) : null,
        nominatorAlumniId: row.nominator_alumni_id != null ? Number(row.nominator_alumni_id) : null,
        c4NominationId: row.c4_nomination_id != null ? Number(row.c4_nomination_id) : null,
        submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export function serializeEvidence(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        nominationId: row.nomination_id != null ? Number(row.nomination_id) : null,
        recognitionId: row.recognition_id != null ? Number(row.recognition_id) : null,
        sourceType: row.source_type,
        sourceReference: row.source_reference,
        label: row.label,
        notes: row.notes,
        verificationStatus: row.verification_status,
        verifiedByFacultyId: row.verified_by_faculty_id != null ? Number(row.verified_by_faculty_id) : null,
        verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null,
    };
}
export function serializeReview(row) {
    return {
        id: Number(row.id),
        nominationId: Number(row.nomination_id),
        stageCode: row.stage_code,
        reviewerFacultyId: row.reviewer_faculty_id != null ? Number(row.reviewer_faculty_id) : null,
        decision: row.decision,
        comments: row.comments,
        decidedAt: row.decided_at ? new Date(row.decided_at).toISOString() : null,
    };
}
export function serializeRecognition(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        programId: row.program_id != null ? Number(row.program_id) : null,
        nominationId: row.nomination_id != null ? Number(row.nomination_id) : null,
        title: row.title,
        category: row.category,
        citation: row.citation,
        awardDate: row.award_date,
        academicYear: row.academic_year,
        approvedByFacultyId: row.approved_by_faculty_id != null ? Number(row.approved_by_faculty_id) : null,
        publicationVisibility: row.publication_visibility,
        publicationConsent: Boolean(row.publication_consent),
        publicationConsentAt: row.publication_consent_at
            ? new Date(row.publication_consent_at).toISOString()
            : null,
        certificateReference: row.certificate_reference,
        verificationToken: row.verification_token,
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export function serializeCertificate(row) {
    return {
        id: Number(row.id),
        recognitionId: Number(row.recognition_id),
        alumniProfileId: Number(row.alumni_profile_id),
        certificateType: row.certificate_type,
        referenceCode: row.reference_code,
        issueDate: row.issue_date,
        verificationToken: row.verification_token,
        status: row.status,
    };
}
export function serializeSpotlight(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        recognitionId: row.recognition_id != null ? Number(row.recognition_id) : null,
        headline: row.headline,
        professionalSummary: row.professional_summary,
        achievement: row.achievement,
        institutionConnection: row.institution_connection,
        graduationDetails: row.graduation_details,
        imageUrl: row.image_url,
        storyContent: row.story_content,
        publicationStatus: row.publication_status,
        publicationConsent: Boolean(row.publication_consent),
        publicationConsentAt: row.publication_consent_at
            ? new Date(row.publication_consent_at).toISOString()
            : null,
        publishAt: row.publish_at,
        unpublishAt: row.unpublish_at,
        approvedByFacultyId: row.approved_by_faculty_id != null ? Number(row.approved_by_faculty_id) : null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export function serializeValueOffering(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        title: row.title,
        category: row.category,
        description: row.description,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        providerLabel: row.provider_label,
        eligibility: row.eligibility,
        capacity: row.capacity != null ? Number(row.capacity) : null,
        registeredCount: Number(row.registered_count || 0),
        deliveryMode: row.delivery_mode,
        location: row.location,
        startDate: row.start_date,
        endDate: row.end_date,
        registrationDeadline: row.registration_deadline,
        status: row.status,
        visibility: row.visibility,
        benefits: row.benefits,
        terms: row.terms,
        engagementCampaignId: row.engagement_campaign_id != null ? Number(row.engagement_campaign_id) : null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export function serializeParticipation(row) {
    return {
        id: Number(row.id),
        offeringId: Number(row.offering_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        offeringTitle: row.offering_title ?? undefined,
        status: row.status,
        notes: row.notes,
        registeredAt: row.registered_at ? new Date(row.registered_at).toISOString() : null,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    };
}
export function serializeCommunity(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        name: row.name,
        type: row.type,
        scope: row.scope,
        description: row.description,
        coordinatorFacultyId: row.coordinator_faculty_id != null ? Number(row.coordinator_faculty_id) : null,
        coordinatorAlumniId: row.coordinator_alumni_id != null ? Number(row.coordinator_alumni_id) : null,
        city: row.city,
        region: row.region,
        country: row.country,
        batchYear: row.batch_year,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        industry: row.industry,
        status: row.status,
    };
}
export function serializeMembership(row) {
    return {
        id: Number(row.id),
        communityId: Number(row.community_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        status: row.status,
        joinedAt: row.joined_at ? new Date(row.joined_at).toISOString() : null,
    };
}
export function serializeConnection(row, opts) {
    const base = {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        fromAlumniId: Number(row.from_alumni_id),
        toAlumniId: Number(row.to_alumni_id),
        fromName: row.from_name ?? undefined,
        toName: row.to_name ?? undefined,
        message: row.message,
        status: row.status,
        respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    };
    if (opts?.includeContact && opts.contact)
        base.contact = opts.contact;
    return base;
}
export function serializeSuggestion(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        alumniProfileId: Number(row.alumni_profile_id),
        alumniName: row.alumni_name ?? undefined,
        suggestionType: row.suggestion_type,
        category: row.category,
        title: row.title,
        rationale: row.rationale,
        evidenceRefs: parseJson(row.evidence_refs, []),
        status: row.status,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    };
}
export function getSourceOfTruthMatrix() {
    return {
        matrix: SOURCE_OF_TRUTH_MATRIX,
        categories: RECOGNITION_CATEGORY_CODES,
        note: 'Human recognition decisions only — no popularity or donor ranking',
    };
}
export async function ensureDefaultCategories(collegeId) {
    await requireTables();
    if (!(await db.schema.hasTable('alumni_recognition_categories')))
        return;
    const existing = await db('alumni_recognition_categories').where({ college_id: collegeId }).select('code');
    const have = new Set(existing.map((r) => r.code));
    let sort = 10;
    for (const code of RECOGNITION_CATEGORY_CODES) {
        if (have.has(code))
            continue;
        await db('alumni_recognition_categories').insert({
            college_id: collegeId,
            code,
            label: SYSTEM_CATEGORY_LABELS[code],
            is_system: true,
            is_active: true,
            sort_order: sort,
        });
        sort += 10;
    }
}
export async function ensureDefaultReviewStages(collegeId, programId) {
    await requireTables();
    const pid = programId ?? null;
    for (const stage of DEFAULT_REVIEW_STAGES) {
        const exists = await db('alumni_recognition_review_stages')
            .where({ college_id: collegeId, code: stage.code })
            .andWhere((qb) => {
            if (pid == null)
                qb.whereNull('program_id');
            else
                qb.where('program_id', pid);
        })
            .first();
        if (exists)
            continue;
        await db('alumni_recognition_review_stages').insert({
            college_id: collegeId,
            program_id: pid,
            code: stage.code,
            label: stage.label,
            sort_order: stage.sortOrder,
            is_active: true,
        });
    }
}
export async function listCategories(actor) {
    await requireTables();
    assertAccess(actor);
    await ensureDefaultCategories(actor.collegeId);
    const rows = await db('alumni_recognition_categories')
        .where({ college_id: actor.collegeId })
        .orderBy('sort_order', 'asc')
        .orderBy('id', 'asc');
    return { categories: rows.map(serializeCategory) };
}
export async function upsertCategory(actor, body) {
    await requireTables();
    assertOperate(actor);
    const input = categoryUpsertSchema.parse(body);
    const existing = await db('alumni_recognition_categories')
        .where({ college_id: actor.collegeId, code: input.code })
        .first();
    if (existing) {
        await db('alumni_recognition_categories').where({ id: existing.id }).update({
            label: input.label,
            description: input.description ?? existing.description,
            is_active: input.isActive ?? existing.is_active,
            sort_order: input.sortOrder ?? existing.sort_order,
            updated_at: db.fn.now(),
        });
        return { category: serializeCategory(await db('alumni_recognition_categories').where({ id: existing.id }).first()) };
    }
    const [id] = await db('alumni_recognition_categories').insert({
        college_id: actor.collegeId,
        code: input.code,
        label: input.label,
        description: input.description ?? null,
        is_system: false,
        is_active: input.isActive ?? true,
        sort_order: input.sortOrder ?? 1000,
    });
    return { category: serializeCategory(await db('alumni_recognition_categories').where({ id }).first()) };
}
export async function listPrograms(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_recognition_programs as p').select('p.*');
    q = scopeProgramsQuery(actor, q);
    if (query.status)
        q = q.where('p.status', String(query.status));
    if (query.category)
        q = q.where('p.category', String(query.category));
    if (query.academicYear)
        q = q.where('p.academic_year', String(query.academicYear));
    const rows = await q.orderBy('p.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { programs: rows.map(serializeProgram) };
}
export async function createProgram(actor, body) {
    await requireTables();
    assertOperate(actor);
    const input = programCreateSchema.parse(body);
    const [id] = await db('alumni_recognition_programs').insert({
        college_id: actor.collegeId,
        name: input.name,
        category: input.category || 'OTHER',
        description: input.description ?? null,
        academic_year: input.academicYear ?? null,
        eligibility_rules: serializeJson(input.eligibilityRules),
        nomination_start: input.nominationStart ?? null,
        nomination_end: input.nominationEnd ?? null,
        review_start: input.reviewStart ?? null,
        review_end: input.reviewEnd ?? null,
        award_date: input.awardDate ?? null,
        publication_date: input.publicationDate ?? null,
        owner_faculty_id: input.ownerFacultyId ?? actor.facultyUserId,
        department_id: input.departmentId ?? (isDepartmentScopedRecognition(actor) ? actor.departmentId : null),
        scope: input.scope || 'COLLEGE',
        status: input.status || 'DRAFT',
        created_by_faculty_id: actor.facultyUserId,
    });
    await ensureDefaultReviewStages(actor.collegeId, Number(id));
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_PROGRAM_CREATE',
        entityType: 'alumni_recognition_programs',
        entityId: Number(id),
    });
    return { program: serializeProgram(await db('alumni_recognition_programs').where({ id }).first()) };
}
export async function patchProgram(actor, programId, body) {
    await requireTables();
    assertOperate(actor);
    const input = programPatchSchema.parse(body);
    let q = db('alumni_recognition_programs as p').where('p.id', programId);
    q = scopeProgramsQuery(actor, q);
    const row = await q.first();
    if (!row)
        throw new AppError(404, 'Program not found');
    const patch = { updated_at: db.fn.now() };
    if (input.name !== undefined)
        patch.name = input.name;
    if (input.category !== undefined)
        patch.category = input.category;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.academicYear !== undefined)
        patch.academic_year = input.academicYear;
    if (input.eligibilityRules !== undefined)
        patch.eligibility_rules = serializeJson(input.eligibilityRules);
    if (input.nominationStart !== undefined)
        patch.nomination_start = input.nominationStart;
    if (input.nominationEnd !== undefined)
        patch.nomination_end = input.nominationEnd;
    if (input.reviewStart !== undefined)
        patch.review_start = input.reviewStart;
    if (input.reviewEnd !== undefined)
        patch.review_end = input.reviewEnd;
    if (input.awardDate !== undefined)
        patch.award_date = input.awardDate;
    if (input.publicationDate !== undefined)
        patch.publication_date = input.publicationDate;
    if (input.ownerFacultyId !== undefined)
        patch.owner_faculty_id = input.ownerFacultyId;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.scope !== undefined)
        patch.scope = input.scope;
    if (input.status !== undefined)
        patch.status = input.status;
    await db('alumni_recognition_programs').where({ id: programId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_PROGRAM_PATCH',
        entityType: 'alumni_recognition_programs',
        entityId: programId,
    });
    return { program: serializeProgram(await db('alumni_recognition_programs').where({ id: programId }).first()) };
}
export async function getProgramDetail(actor, programId, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_recognition_programs as p').where('p.id', programId);
    q = scopeProgramsQuery(actor, q);
    const row = await q.first();
    if (!row)
        throw new AppError(404, 'Program not found');
    await ensureDefaultReviewStages(actor.collegeId, programId);
    const stages = await db('alumni_recognition_review_stages')
        .where({ college_id: actor.collegeId })
        .andWhere((qb) => qb.where('program_id', programId).orWhereNull('program_id'))
        .orderBy('sort_order', 'asc');
    const noms = await db('alumni_recognition_nominations')
        .where({ college_id: actor.collegeId, program_id: programId })
        .orderBy('id', 'desc')
        .limit(50);
    let eligibilityAssistance = null;
    const alumniProfileId = query.alumniProfileId ? Number(query.alumniProfileId) : null;
    if (alumniProfileId) {
        eligibilityAssistance = await assistEligibility({
            collegeId: actor.collegeId,
            alumniProfileId,
            rules: parseEligibilityRules(row.eligibility_rules),
        });
    }
    return {
        program: serializeProgram(row),
        stages,
        nominations: noms.map(serializeNomination),
        eligibilityAssistance,
    };
}
export async function listNominations(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_recognition_nominations as n')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id')
        .where('n.college_id', actor.collegeId)
        .select('n.*', 'ap.historical_name as alumni_name');
    if (isDepartmentScopedRecognition(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('ap.historical_department_id', actor.departmentId).orWhereNull('ap.historical_department_id');
        });
    }
    if (query.status)
        q = q.where('n.status', String(query.status));
    if (query.programId)
        q = q.where('n.program_id', Number(query.programId));
    if (query.alumniProfileId)
        q = q.where('n.alumni_profile_id', Number(query.alumniProfileId));
    if (query.category)
        q = q.where('n.category', String(query.category));
    const rows = await q.orderBy('n.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { nominations: rows.map(serializeNomination) };
}
export async function createNomination(actor, body) {
    await requireTables();
    if (!canNominate(actor))
        throw new AppError(403, 'Nomination denied');
    const input = nominationCreateSchema.parse(body);
    const profile = await db('alumni_profiles')
        .where({ id: input.alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    if (input.programId) {
        const prog = await db('alumni_recognition_programs')
            .where({ id: input.programId, college_id: actor.collegeId })
            .first();
        if (!prog)
            throw new AppError(404, 'Program not found');
    }
    const status = input.status || 'DRAFT';
    const [id] = await db('alumni_recognition_nominations').insert({
        college_id: actor.collegeId,
        alumni_profile_id: input.alumniProfileId,
        program_id: input.programId ?? null,
        category: input.category || 'OTHER',
        title: input.title,
        reason: input.reason ?? null,
        source: input.source || 'ALUMNI_OFFICE',
        nominator_faculty_id: actor.facultyUserId,
        nominator_alumni_id: input.nominatorAlumniId ?? null,
        c4_nomination_id: input.c4NominationId ?? null,
        submitted_at: status === 'SUBMITTED' ? db.fn.now() : null,
        status,
    });
    if (input.evidence?.length) {
        for (const ev of input.evidence) {
            await db('alumni_recognition_evidence').insert({
                college_id: actor.collegeId,
                nomination_id: id,
                source_type: ev.sourceType,
                source_reference: ev.sourceReference ?? null,
                label: ev.label ?? null,
                notes: ev.notes ?? null,
                verification_status: ev.verificationStatus || 'UNVERIFIED',
            });
        }
    }
    if (input.c4NominationId)
        await markC4Recorded(actor.collegeId, input.c4NominationId);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_NOMINATION_CREATE',
        entityType: 'alumni_recognition_nominations',
        entityId: Number(id),
    });
    return { nomination: serializeNomination(await db('alumni_recognition_nominations').where({ id }).first()) };
}
export async function patchNomination(actor, nominationId, body) {
    await requireTables();
    assertOperate(actor);
    const input = nominationPatchSchema.parse(body);
    const row = await db('alumni_recognition_nominations')
        .where({ id: nominationId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Nomination not found');
    if (['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(row.status) && input.status && input.status !== row.status) {
        throw new AppError(400, 'Terminal nomination cannot change status via patch');
    }
    const patch = { updated_at: db.fn.now() };
    if (input.programId !== undefined)
        patch.program_id = input.programId;
    if (input.category !== undefined)
        patch.category = input.category;
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.reason !== undefined)
        patch.reason = input.reason;
    if (input.status !== undefined) {
        patch.status = input.status;
        if (input.status === 'SUBMITTED' && !row.submitted_at)
            patch.submitted_at = db.fn.now();
    }
    await db('alumni_recognition_nominations').where({ id: nominationId }).update(patch);
    return {
        nomination: serializeNomination(await db('alumni_recognition_nominations').where({ id: nominationId }).first()),
    };
}
export async function getNominationDetail(actor, nominationId) {
    await requireTables();
    assertAccess(actor);
    const row = await db('alumni_recognition_nominations as n')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id')
        .where('n.id', nominationId)
        .where('n.college_id', actor.collegeId)
        .select('n.*', 'ap.historical_name as alumni_name')
        .first();
    if (!row)
        throw new AppError(404, 'Nomination not found');
    const evidence = await db('alumni_recognition_evidence').where({
        college_id: actor.collegeId,
        nomination_id: nominationId,
    });
    const reviews = await db('alumni_recognition_reviews')
        .where({ college_id: actor.collegeId, nomination_id: nominationId })
        .orderBy('decided_at', 'asc');
    let eligibilityAssistance = null;
    if (row.program_id) {
        const prog = await db('alumni_recognition_programs').where({ id: row.program_id }).first();
        if (prog) {
            eligibilityAssistance = await assistEligibility({
                collegeId: actor.collegeId,
                alumniProfileId: Number(row.alumni_profile_id),
                rules: parseEligibilityRules(prog.eligibility_rules),
            });
        }
    }
    return {
        nomination: serializeNomination(row),
        evidence: evidence.map(serializeEvidence),
        reviews: reviews.map(serializeReview),
        eligibilityAssistance,
    };
}
export async function submitNomination(actor, nominationId) {
    await requireTables();
    assertOperate(actor);
    const row = await db('alumni_recognition_nominations')
        .where({ id: nominationId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Nomination not found');
    if (!['DRAFT', 'MORE_EVIDENCE_REQUIRED'].includes(row.status)) {
        throw new AppError(400, 'Nomination cannot be submitted from current status');
    }
    await db('alumni_recognition_nominations').where({ id: nominationId }).update({
        status: 'SUBMITTED',
        submitted_at: row.submitted_at || db.fn.now(),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_NOMINATION_SUBMIT',
        entityType: 'alumni_recognition_nominations',
        entityId: nominationId,
    });
    return {
        nomination: serializeNomination(await db('alumni_recognition_nominations').where({ id: nominationId }).first()),
    };
}
export async function addEvidence(actor, body) {
    await requireTables();
    assertOperate(actor);
    const input = evidenceSchema.parse(body);
    if (!input.nominationId && !input.recognitionId) {
        throw new AppError(400, 'nominationId or recognitionId required');
    }
    if (input.nominationId) {
        const nom = await db('alumni_recognition_nominations')
            .where({ id: input.nominationId, college_id: actor.collegeId })
            .first();
        if (!nom)
            throw new AppError(404, 'Nomination not found');
    }
    if (input.recognitionId) {
        const rec = await db('alumni_recognition_records')
            .where({ id: input.recognitionId, college_id: actor.collegeId })
            .first();
        if (!rec)
            throw new AppError(404, 'Recognition not found');
    }
    const [id] = await db('alumni_recognition_evidence').insert({
        college_id: actor.collegeId,
        nomination_id: input.nominationId ?? null,
        recognition_id: input.recognitionId ?? null,
        source_type: input.sourceType,
        source_reference: input.sourceReference ?? null,
        label: input.label ?? null,
        notes: input.notes ?? null,
        verification_status: input.verificationStatus || 'UNVERIFIED',
    });
    return { evidence: serializeEvidence(await db('alumni_recognition_evidence').where({ id }).first()) };
}
export async function verifyEvidence(actor, evidenceId, verificationStatus) {
    await requireTables();
    assertOperate(actor);
    if (!['UNVERIFIED', 'SELF_DECLARED', 'INSTITUTIONAL', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
        throw new AppError(400, 'Invalid verification status');
    }
    const row = await db('alumni_recognition_evidence')
        .where({ id: evidenceId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Evidence not found');
    await db('alumni_recognition_evidence').where({ id: evidenceId }).update({
        verification_status: verificationStatus,
        verified_by_faculty_id: actor.facultyUserId,
        verified_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    return { evidence: serializeEvidence(await db('alumni_recognition_evidence').where({ id: evidenceId }).first()) };
}
export async function reviewNomination(actor, nominationId, body) {
    await requireTables();
    if (!canReviewNomination(actor))
        throw new AppError(403, 'Review denied');
    const input = reviewSchema.parse(body);
    const nom = await db('alumni_recognition_nominations')
        .where({ id: nominationId, college_id: actor.collegeId })
        .first();
    if (!nom)
        throw new AppError(404, 'Nomination not found');
    // NEVER auto-issue recognition from review
    const nextStatus = mapReviewDecisionToStatus(input.decision, input.nextNominationStatus);
    if (input.nextNominationStatus === 'APPROVED' && input.decision !== 'APPROVE') {
        throw new AppError(400, 'Cannot set APPROVED without APPROVE decision');
    }
    const [id] = await db('alumni_recognition_reviews').insert({
        college_id: actor.collegeId,
        nomination_id: nominationId,
        stage_code: input.stageCode,
        reviewer_faculty_id: actor.facultyUserId,
        decision: input.decision,
        comments: input.comments ?? null,
        decided_at: db.fn.now(),
    });
    if (nextStatus) {
        await db('alumni_recognition_nominations').where({ id: nominationId }).update({
            status: nextStatus === 'APPROVED' ? 'APPROVED' : nextStatus,
            updated_at: db.fn.now(),
        });
    }
    else if (['SUBMITTED', 'DRAFT'].includes(nom.status) && input.decision !== 'COMMENT' && input.decision !== 'ABSTAIN') {
        await db('alumni_recognition_nominations').where({ id: nominationId }).update({
            status: 'UNDER_REVIEW',
            updated_at: db.fn.now(),
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_NOMINATION_REVIEW',
        entityType: 'alumni_recognition_nominations',
        entityId: nominationId,
        metadata: { decision: input.decision, nextStatus },
    });
    return {
        review: serializeReview(await db('alumni_recognition_reviews').where({ id }).first()),
        nomination: serializeNomination(await db('alumni_recognition_nominations').where({ id: nominationId }).first()),
        note: 'Review recorded — recognition is never auto-issued',
    };
}
export async function issueRecognition(actor, body) {
    await requireTables();
    assertApprove(actor);
    const input = issueRecognitionSchema.parse(body);
    let alumniProfileId = input.alumniProfileId;
    let programId = input.programId ?? null;
    let nominationId = input.nominationId ?? null;
    let category = input.category || 'OTHER';
    let c4NominationId = null;
    if (nominationId) {
        const nom = await db('alumni_recognition_nominations')
            .where({ id: nominationId, college_id: actor.collegeId })
            .first();
        if (!nom)
            throw new AppError(404, 'Nomination not found');
        alumniProfileId = Number(nom.alumni_profile_id);
        programId = nom.program_id != null ? Number(nom.program_id) : programId;
        category = input.category || nom.category || category;
        c4NominationId = nom.c4_nomination_id != null ? Number(nom.c4_nomination_id) : null;
    }
    if (!alumniProfileId)
        throw new AppError(400, 'alumniProfileId required');
    const profile = await db('alumni_profiles')
        .where({ id: alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    let visibility = input.publicationVisibility || 'INSTITUTION';
    const consent = Boolean(input.publicationConsent);
    if (visibility === 'PUBLIC' && !consent) {
        visibility = 'INSTITUTION';
    }
    const verificationToken = randomToken(24);
    const certRef = input.issueCertificate ? certificateReference(actor.collegeId) : null;
    const [id] = await db('alumni_recognition_records').insert({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        program_id: programId,
        nomination_id: nominationId,
        title: input.title,
        category,
        citation: input.citation ?? null,
        award_date: input.awardDate ?? null,
        academic_year: input.academicYear ?? null,
        approved_by_faculty_id: actor.facultyUserId,
        publication_visibility: visibility,
        publication_consent: consent,
        publication_consent_at: consent ? db.fn.now() : null,
        certificate_reference: certRef,
        verification_token: verificationToken,
        status: 'ISSUED',
    });
    const after = await db('alumni_recognition_records').where({ id }).first();
    await db('alumni_recognition_issuance_log').insert({
        college_id: actor.collegeId,
        recognition_id: id,
        action: 'ISSUED',
        before_snapshot: null,
        after_snapshot: serializeJson(after),
        reason: 'Human issuance',
        actor_faculty_id: actor.facultyUserId,
        acted_at: db.fn.now(),
    });
    let certificate = null;
    if (input.issueCertificate) {
        const certToken = randomToken(24);
        const [certId] = await db('alumni_recognition_certificates').insert({
            college_id: actor.collegeId,
            recognition_id: id,
            alumni_profile_id: alumniProfileId,
            certificate_type: input.certificateType || 'RECOGNITION',
            reference_code: certRef,
            issue_date: input.awardDate || new Date().toISOString().slice(0, 10),
            verification_token: certToken,
            status: 'ISSUED',
        });
        certificate = serializeCertificate(await db('alumni_recognition_certificates').where({ id: certId }).first());
    }
    if (nominationId) {
        await db('alumni_recognition_nominations').where({ id: nominationId }).update({
            status: 'APPROVED',
            updated_at: db.fn.now(),
        });
        await markC4Recorded(actor.collegeId, c4NominationId);
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_ISSUE',
        entityType: 'alumni_recognition_records',
        entityId: Number(id),
        metadata: { nominationId, visibility, consent },
    });
    return {
        recognition: serializeRecognition(after),
        certificate,
        note: 'Issued by human approver — no crypto signature',
    };
}
export async function correctRecognition(actor, recognitionId, body) {
    await requireTables();
    assertApprove(actor);
    const input = correctRecognitionSchema.parse(body);
    const before = await db('alumni_recognition_records')
        .where({ id: recognitionId, college_id: actor.collegeId })
        .first();
    if (!before)
        throw new AppError(404, 'Recognition not found');
    let visibility = input.publicationVisibility ?? before.publication_visibility;
    const consent = input.publicationConsent !== undefined ? Boolean(input.publicationConsent) : Boolean(before.publication_consent);
    if (visibility === 'PUBLIC' && !consent)
        visibility = 'INSTITUTION';
    const patch = {
        updated_at: db.fn.now(),
        status: input.revoke ? 'REVOKED' : 'CORRECTED',
    };
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.citation !== undefined)
        patch.citation = input.citation;
    if (input.category !== undefined)
        patch.category = input.category;
    if (input.awardDate !== undefined)
        patch.award_date = input.awardDate;
    if (input.academicYear !== undefined)
        patch.academic_year = input.academicYear;
    if (input.publicationVisibility !== undefined || visibility !== before.publication_visibility) {
        patch.publication_visibility = visibility;
    }
    if (input.publicationConsent !== undefined) {
        patch.publication_consent = consent;
        patch.publication_consent_at = consent ? db.fn.now() : null;
    }
    await db('alumni_recognition_records').where({ id: recognitionId }).update(patch);
    const after = await db('alumni_recognition_records').where({ id: recognitionId }).first();
    await db('alumni_recognition_issuance_log').insert({
        college_id: actor.collegeId,
        recognition_id: recognitionId,
        action: input.revoke ? 'REVOKED' : 'CORRECTED',
        before_snapshot: serializeJson(before),
        after_snapshot: serializeJson(after),
        reason: input.reason,
        actor_faculty_id: actor.facultyUserId,
        acted_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: input.revoke ? 'RECOGNITION_REVOKE' : 'RECOGNITION_CORRECT',
        entityType: 'alumni_recognition_records',
        entityId: recognitionId,
    });
    return { recognition: serializeRecognition(after) };
}
export async function ingestC4Nomination(actor, c4NominationId) {
    await requireTables();
    assertOperate(actor);
    if (!(await db.schema.hasTable('alumni_engagement_recognition_noms'))) {
        throw new AppError(503, 'C4 recognition noms table missing');
    }
    const c4 = await db('alumni_engagement_recognition_noms')
        .where({ id: c4NominationId, college_id: actor.collegeId })
        .first();
    if (!c4)
        throw new AppError(404, 'C4 nomination not found');
    const existing = await db('alumni_recognition_nominations')
        .where({ college_id: actor.collegeId, c4_nomination_id: c4NominationId })
        .first();
    if (existing) {
        return { nomination: serializeNomination(existing), alreadyIngested: true };
    }
    const evidenceRefs = parseJson(c4.evidence_refs, []);
    const [id] = await db('alumni_recognition_nominations').insert({
        college_id: actor.collegeId,
        alumni_profile_id: c4.alumni_profile_id,
        program_id: null,
        category: 'OTHER',
        title: c4.title,
        reason: c4.rationale ?? null,
        source: 'C4_HANDOFF',
        nominator_faculty_id: c4.nominated_by_faculty_id ?? actor.facultyUserId,
        nominator_alumni_id: null,
        c4_nomination_id: c4NominationId,
        submitted_at: db.fn.now(),
        status: 'SUBMITTED',
    });
    for (const ref of evidenceRefs) {
        await db('alumni_recognition_evidence').insert({
            college_id: actor.collegeId,
            nomination_id: id,
            source_type: String(ref.sourceType || 'OTHER'),
            source_reference: ref.sourceReference != null ? String(ref.sourceReference) : null,
            label: ref.label != null ? String(ref.label) : null,
            notes: null,
            verification_status: String(ref.verificationStatus || 'UNVERIFIED'),
        });
    }
    await markC4Recorded(actor.collegeId, c4NominationId);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'RECOGNITION_C4_INGEST',
        entityType: 'alumni_recognition_nominations',
        entityId: Number(id),
        metadata: { c4NominationId },
    });
    return {
        nomination: serializeNomination(await db('alumni_recognition_nominations').where({ id }).first()),
        alreadyIngested: false,
    };
}
export async function listRecognitions(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_recognition_records as r')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .where('r.college_id', actor.collegeId)
        .select('r.*', 'ap.historical_name as alumni_name');
    if (query.status)
        q = q.where('r.status', String(query.status));
    if (query.alumniProfileId)
        q = q.where('r.alumni_profile_id', Number(query.alumniProfileId));
    if (query.category)
        q = q.where('r.category', String(query.category));
    if (query.programId)
        q = q.where('r.program_id', Number(query.programId));
    const rows = await q.orderBy('r.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { recognitions: rows.map(serializeRecognition) };
}
export async function getRecognitionDetail(actor, recognitionId) {
    await requireTables();
    assertAccess(actor);
    const row = await db('alumni_recognition_records as r')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .where('r.id', recognitionId)
        .where('r.college_id', actor.collegeId)
        .select('r.*', 'ap.historical_name as alumni_name')
        .first();
    if (!row)
        throw new AppError(404, 'Recognition not found');
    const evidence = await db('alumni_recognition_evidence').where({
        college_id: actor.collegeId,
        recognition_id: recognitionId,
    });
    const log = await db('alumni_recognition_issuance_log')
        .where({ college_id: actor.collegeId, recognition_id: recognitionId })
        .orderBy('acted_at', 'asc');
    const certificates = await db('alumni_recognition_certificates').where({
        college_id: actor.collegeId,
        recognition_id: recognitionId,
    });
    return {
        recognition: serializeRecognition(row),
        evidence: evidence.map(serializeEvidence),
        issuanceLog: log.map((l) => ({
            id: Number(l.id),
            action: l.action,
            reason: l.reason,
            actedAt: l.acted_at ? new Date(l.acted_at).toISOString() : null,
            actorFacultyId: l.actor_faculty_id != null ? Number(l.actor_faculty_id) : null,
        })),
        certificates: certificates.map(serializeCertificate),
    };
}
export async function createSpotlight(actor, body) {
    await requireTables();
    assertOperate(actor);
    const input = spotlightCreateSchema.parse(body);
    const profile = await db('alumni_profiles')
        .where({ id: input.alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    const status = input.publicationStatus || 'DRAFT';
    const [id] = await db('alumni_spotlights').insert({
        college_id: actor.collegeId,
        alumni_profile_id: input.alumniProfileId,
        recognition_id: input.recognitionId ?? null,
        headline: input.headline,
        professional_summary: input.professionalSummary ?? null,
        achievement: input.achievement ?? null,
        institution_connection: input.institutionConnection ?? null,
        graduation_details: input.graduationDetails ?? null,
        image_url: input.imageUrl ?? null,
        story_content: input.storyContent ?? null,
        publication_status: status,
        publication_consent: false,
        publish_at: input.publishAt ?? null,
        unpublish_at: input.unpublishAt ?? null,
    });
    return { spotlight: serializeSpotlight(await db('alumni_spotlights').where({ id }).first()) };
}
export async function patchSpotlight(actor, spotlightId, body) {
    await requireTables();
    assertOperate(actor);
    const input = spotlightPatchSchema.parse(body);
    const row = await db('alumni_spotlights').where({ id: spotlightId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Spotlight not found');
    if (input.publicationStatus === 'PUBLISHED') {
        throw new AppError(400, 'Use publishSpotlight to publish');
    }
    const patch = { updated_at: db.fn.now() };
    if (input.recognitionId !== undefined)
        patch.recognition_id = input.recognitionId;
    if (input.headline !== undefined)
        patch.headline = input.headline;
    if (input.professionalSummary !== undefined)
        patch.professional_summary = input.professionalSummary;
    if (input.achievement !== undefined)
        patch.achievement = input.achievement;
    if (input.institutionConnection !== undefined)
        patch.institution_connection = input.institutionConnection;
    if (input.graduationDetails !== undefined)
        patch.graduation_details = input.graduationDetails;
    if (input.imageUrl !== undefined)
        patch.image_url = input.imageUrl;
    if (input.storyContent !== undefined)
        patch.story_content = input.storyContent;
    if (input.publicationStatus !== undefined)
        patch.publication_status = input.publicationStatus;
    if (input.publicationConsent !== undefined) {
        patch.publication_consent = input.publicationConsent;
        patch.publication_consent_at = input.publicationConsent ? db.fn.now() : null;
    }
    if (input.publishAt !== undefined)
        patch.publish_at = input.publishAt;
    if (input.unpublishAt !== undefined)
        patch.unpublish_at = input.unpublishAt;
    await db('alumni_spotlights').where({ id: spotlightId }).update(patch);
    return { spotlight: serializeSpotlight(await db('alumni_spotlights').where({ id: spotlightId }).first()) };
}
export async function publishSpotlight(actor, spotlightId) {
    await requireTables();
    if (!canPublishSpotlight(actor))
        throw new AppError(403, 'Publish denied');
    const row = await db('alumni_spotlights').where({ id: spotlightId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Spotlight not found');
    if (!row.publication_consent) {
        throw new AppError(400, 'publication_consent must be true before PUBLISHED');
    }
    await db('alumni_spotlights').where({ id: spotlightId }).update({
        publication_status: 'PUBLISHED',
        approved_by_faculty_id: actor.facultyUserId,
        publish_at: row.publish_at || new Date().toISOString().slice(0, 10),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'SPOTLIGHT_PUBLISH',
        entityType: 'alumni_spotlights',
        entityId: spotlightId,
    });
    return { spotlight: serializeSpotlight(await db('alumni_spotlights').where({ id: spotlightId }).first()) };
}
export async function listSpotlights(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_spotlights as s')
        .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
        .where('s.college_id', actor.collegeId)
        .select('s.*', 'ap.historical_name as alumni_name');
    if (query.status)
        q = q.where('s.publication_status', String(query.status));
    if (query.alumniProfileId)
        q = q.where('s.alumni_profile_id', Number(query.alumniProfileId));
    const rows = await q.orderBy('s.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { spotlights: rows.map(serializeSpotlight) };
}
export async function listValueOfferings(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_value_offerings').where({ college_id: actor.collegeId });
    if (query.status)
        q = q.where('status', String(query.status));
    if (query.category)
        q = q.where('category', String(query.category));
    const rows = await q.orderBy('id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { offerings: rows.map(serializeValueOffering) };
}
export async function createValueOffering(actor, body) {
    await requireTables();
    if (!canManageValueOfferings(actor))
        throw new AppError(403, 'Value offering manage denied');
    const input = valueOfferingCreateSchema.parse(body);
    const [id] = await db('alumni_value_offerings').insert({
        college_id: actor.collegeId,
        title: input.title,
        category: input.category || 'OTHER',
        description: input.description ?? null,
        owner_faculty_id: input.ownerFacultyId ?? actor.facultyUserId,
        provider_label: input.providerLabel ?? null,
        eligibility: input.eligibility ?? null,
        capacity: input.capacity ?? null,
        delivery_mode: input.deliveryMode ?? null,
        location: input.location ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        registration_deadline: input.registrationDeadline ?? null,
        status: input.status || 'DRAFT',
        visibility: input.visibility || 'ALUMNI_NETWORK',
        benefits: input.benefits ?? null,
        terms: input.terms ?? null,
        engagement_campaign_id: input.engagementCampaignId ?? null,
        created_by_faculty_id: actor.facultyUserId,
    });
    return { offering: serializeValueOffering(await db('alumni_value_offerings').where({ id }).first()) };
}
export async function patchValueOffering(actor, offeringId, body) {
    await requireTables();
    if (!canManageValueOfferings(actor))
        throw new AppError(403, 'Value offering manage denied');
    const input = valueOfferingPatchSchema.parse(body);
    const row = await db('alumni_value_offerings').where({ id: offeringId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Offering not found');
    const patch = { updated_at: db.fn.now() };
    const map = {
        title: 'title',
        category: 'category',
        description: 'description',
        ownerFacultyId: 'owner_faculty_id',
        providerLabel: 'provider_label',
        eligibility: 'eligibility',
        capacity: 'capacity',
        deliveryMode: 'delivery_mode',
        location: 'location',
        startDate: 'start_date',
        endDate: 'end_date',
        registrationDeadline: 'registration_deadline',
        status: 'status',
        visibility: 'visibility',
        benefits: 'benefits',
        terms: 'terms',
        engagementCampaignId: 'engagement_campaign_id',
    };
    for (const [k, col] of Object.entries(map)) {
        if (input[k] !== undefined)
            patch[col] = input[k];
    }
    await db('alumni_value_offerings').where({ id: offeringId }).update(patch);
    return { offering: serializeValueOffering(await db('alumni_value_offerings').where({ id: offeringId }).first()) };
}
export async function recordParticipation(actor, offeringId, body) {
    await requireTables();
    assertOperate(actor);
    const input = participationSchema.parse(body);
    // Never invent VIEWED — schema excludes it
    const offering = await db('alumni_value_offerings')
        .where({ id: offeringId, college_id: actor.collegeId })
        .first();
    if (!offering)
        throw new AppError(404, 'Offering not found');
    const profile = await db('alumni_profiles')
        .where({ id: input.alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    const existing = await db('alumni_value_participations')
        .where({ offering_id: offeringId, alumni_profile_id: input.alumniProfileId })
        .first();
    const registeredStatuses = ['REGISTERED', 'ACCEPTED', 'PARTICIPATED', 'COMPLETED'];
    if (existing) {
        const wasReg = registeredStatuses.includes(existing.status);
        const nowReg = registeredStatuses.includes(input.status);
        await db('alumni_value_participations').where({ id: existing.id }).update({
            status: input.status,
            notes: input.notes ?? existing.notes,
            registered_at: nowReg && !existing.registered_at ? db.fn.now() : existing.registered_at,
            completed_at: ['COMPLETED', 'PARTICIPATED'].includes(input.status) ? db.fn.now() : existing.completed_at,
            recorded_by_faculty_id: actor.facultyUserId,
            updated_at: db.fn.now(),
        });
        if (!wasReg && nowReg) {
            await db('alumni_value_offerings')
                .where({ id: offeringId })
                .update({ registered_count: Number(offering.registered_count || 0) + 1, updated_at: db.fn.now() });
        }
        return {
            participation: serializeParticipation(await db('alumni_value_participations').where({ id: existing.id }).first()),
        };
    }
    const [id] = await db('alumni_value_participations').insert({
        college_id: actor.collegeId,
        offering_id: offeringId,
        alumni_profile_id: input.alumniProfileId,
        status: input.status,
        notes: input.notes ?? null,
        registered_at: registeredStatuses.includes(input.status) ? db.fn.now() : null,
        completed_at: ['COMPLETED', 'PARTICIPATED'].includes(input.status) ? db.fn.now() : null,
        recorded_by_faculty_id: actor.facultyUserId,
    });
    if (registeredStatuses.includes(input.status)) {
        await db('alumni_value_offerings')
            .where({ id: offeringId })
            .update({ registered_count: Number(offering.registered_count || 0) + 1, updated_at: db.fn.now() });
    }
    return { participation: serializeParticipation(await db('alumni_value_participations').where({ id }).first()) };
}
export async function listParticipations(actor, offeringId, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_value_participations as p')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'p.alumni_profile_id')
        .where('p.college_id', actor.collegeId)
        .where('p.offering_id', offeringId)
        .select('p.*', 'ap.historical_name as alumni_name');
    if (query.status)
        q = q.where('p.status', String(query.status));
    const rows = await q.orderBy('p.id', 'desc').limit(200);
    return { participations: rows.map(serializeParticipation) };
}
export async function listCommunities(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_communities').where({ college_id: actor.collegeId });
    if (query.type)
        q = q.where('type', String(query.type));
    if (query.status)
        q = q.where('status', String(query.status));
    const rows = await q.orderBy('id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { communities: rows.map(serializeCommunity) };
}
export async function createCommunity(actor, body) {
    await requireTables();
    if (!canManageCommunities(actor))
        throw new AppError(403, 'Community manage denied');
    const input = communityCreateSchema.parse(body);
    const [id] = await db('alumni_communities').insert({
        college_id: actor.collegeId,
        name: input.name,
        type: input.type || 'OTHER',
        scope: input.scope ?? null,
        description: input.description ?? null,
        coordinator_faculty_id: input.coordinatorFacultyId ?? actor.facultyUserId,
        coordinator_alumni_id: input.coordinatorAlumniId ?? null,
        city: input.city ?? null,
        region: input.region ?? null,
        country: input.country ?? null,
        batch_year: input.batchYear ?? null,
        department_id: input.departmentId ?? null,
        industry: input.industry ?? null,
        status: input.status || 'ACTIVE',
    });
    return { community: serializeCommunity(await db('alumni_communities').where({ id }).first()) };
}
export async function patchCommunity(actor, communityId, body) {
    await requireTables();
    if (!canManageCommunities(actor))
        throw new AppError(403, 'Community manage denied');
    const input = communityPatchSchema.parse(body);
    const row = await db('alumni_communities').where({ id: communityId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Community not found');
    const patch = { updated_at: db.fn.now() };
    const map = {
        name: 'name',
        type: 'type',
        scope: 'scope',
        description: 'description',
        coordinatorFacultyId: 'coordinator_faculty_id',
        coordinatorAlumniId: 'coordinator_alumni_id',
        city: 'city',
        region: 'region',
        country: 'country',
        batchYear: 'batch_year',
        departmentId: 'department_id',
        industry: 'industry',
        status: 'status',
    };
    for (const [k, col] of Object.entries(map)) {
        if (input[k] !== undefined)
            patch[col] = input[k];
    }
    await db('alumni_communities').where({ id: communityId }).update(patch);
    return { community: serializeCommunity(await db('alumni_communities').where({ id: communityId }).first()) };
}
export async function addMembership(actor, communityId, body) {
    await requireTables();
    if (!canManageCommunities(actor))
        throw new AppError(403, 'Community manage denied');
    const input = membershipSchema.parse(body);
    const community = await db('alumni_communities')
        .where({ id: communityId, college_id: actor.collegeId })
        .first();
    if (!community)
        throw new AppError(404, 'Community not found');
    const profile = await db('alumni_profiles')
        .where({ id: input.alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    // Never infer membership from location — explicit only
    const existing = await db('alumni_community_memberships')
        .where({ community_id: communityId, alumni_profile_id: input.alumniProfileId })
        .first();
    const status = input.status || 'INVITED';
    if (existing) {
        await db('alumni_community_memberships').where({ id: existing.id }).update({
            status,
            joined_at: ['OPT_IN', 'ACTIVE'].includes(status) ? existing.joined_at || db.fn.now() : existing.joined_at,
            updated_at: db.fn.now(),
        });
        return {
            membership: serializeMembership(await db('alumni_community_memberships').where({ id: existing.id }).first()),
        };
    }
    const [id] = await db('alumni_community_memberships').insert({
        college_id: actor.collegeId,
        community_id: communityId,
        alumni_profile_id: input.alumniProfileId,
        status,
        joined_at: ['OPT_IN', 'ACTIVE'].includes(status) ? db.fn.now() : null,
        invited_by_faculty_id: actor.facultyUserId,
    });
    return { membership: serializeMembership(await db('alumni_community_memberships').where({ id }).first()) };
}
export async function listMemberships(actor, communityId) {
    await requireTables();
    assertAccess(actor);
    const rows = await db('alumni_community_memberships as m')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'm.alumni_profile_id')
        .where('m.college_id', actor.collegeId)
        .where('m.community_id', communityId)
        .select('m.*', 'ap.historical_name as alumni_name')
        .orderBy('m.id', 'desc');
    return { memberships: rows.map(serializeMembership) };
}
export async function requestConnection(actor, body) {
    await requireTables();
    const input = connectionRequestSchema.parse(body);
    if (input.toAlumniId === actor.alumniProfileId) {
        throw new AppError(400, 'Cannot connect to self');
    }
    const to = await db('alumni_profiles')
        .where({ id: input.toAlumniId, college_id: actor.collegeId })
        .first();
    if (!to)
        throw new AppError(404, 'Alumni not found');
    const existing = await db('alumni_connection_requests')
        .where({ from_alumni_id: actor.alumniProfileId, to_alumni_id: input.toAlumniId })
        .first();
    if (existing) {
        return { connection: serializeConnection(existing) };
    }
    const [id] = await db('alumni_connection_requests').insert({
        college_id: actor.collegeId,
        from_alumni_id: actor.alumniProfileId,
        to_alumni_id: input.toAlumniId,
        message: input.message ?? null,
        status: 'PENDING',
    });
    // Never expose email/phone before ACCEPTED
    return { connection: serializeConnection(await db('alumni_connection_requests').where({ id }).first()) };
}
export async function respondConnection(actor, connectionId, body) {
    await requireTables();
    const input = connectionRespondSchema.parse(body);
    const row = await db('alumni_connection_requests')
        .where({ id: connectionId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Connection not found');
    const isTo = Number(row.to_alumni_id) === actor.alumniProfileId;
    const isFrom = Number(row.from_alumni_id) === actor.alumniProfileId;
    if (input.status === 'CANCELLED') {
        if (!isFrom)
            throw new AppError(403, 'Only requester can cancel');
    }
    else if (!isTo) {
        throw new AppError(403, 'Only recipient can accept/decline');
    }
    await db('alumni_connection_requests').where({ id: connectionId }).update({
        status: input.status,
        responded_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    const updated = await db('alumni_connection_requests').where({ id: connectionId }).first();
    let contact = undefined;
    if (input.status === 'ACCEPTED') {
        const otherId = isTo ? Number(row.from_alumni_id) : Number(row.to_alumni_id);
        const other = await db('alumni_profiles').where({ id: otherId, college_id: actor.collegeId }).first();
        if (other)
            contact = consentedContact(other);
    }
    return { connection: serializeConnection(updated, { includeContact: Boolean(contact), contact }) };
}
export async function listConnections(actor) {
    await requireTables();
    const rows = await db('alumni_connection_requests as c')
        .leftJoin('alumni_profiles as f', 'f.id', 'c.from_alumni_id')
        .leftJoin('alumni_profiles as t', 't.id', 'c.to_alumni_id')
        .where('c.college_id', actor.collegeId)
        .andWhere((qb) => {
        qb.where('c.from_alumni_id', actor.alumniProfileId).orWhere('c.to_alumni_id', actor.alumniProfileId);
    })
        .select('c.*', 'f.historical_name as from_name', 't.historical_name as to_name', 'f.email as from_email', 'f.phone as from_phone', 'f.email_visibility as from_email_vis', 'f.phone_visibility as from_phone_vis', 'f.social_visibility as from_social_vis', 'f.linkedin_url as from_linkedin', 'f.current_city as from_city', 'f.headline as from_headline', 't.email as to_email', 't.phone as to_phone', 't.email_visibility as to_email_vis', 't.phone_visibility as to_phone_vis', 't.social_visibility as to_social_vis', 't.linkedin_url as to_linkedin', 't.current_city as to_city', 't.headline as to_headline')
        .orderBy('c.id', 'desc');
    return {
        connections: rows.map((r) => {
            if (r.status !== 'ACCEPTED')
                return serializeConnection(r);
            const iAmFrom = Number(r.from_alumni_id) === actor.alumniProfileId;
            const peer = iAmFrom
                ? {
                    historical_name: r.to_name,
                    email: r.to_email,
                    phone: r.to_phone,
                    email_visibility: r.to_email_vis,
                    phone_visibility: r.to_phone_vis,
                    social_visibility: r.to_social_vis,
                    linkedin_url: r.to_linkedin,
                    current_city: r.to_city,
                    headline: r.to_headline,
                }
                : {
                    historical_name: r.from_name,
                    email: r.from_email,
                    phone: r.from_phone,
                    email_visibility: r.from_email_vis,
                    phone_visibility: r.from_phone_vis,
                    social_visibility: r.from_social_vis,
                    linkedin_url: r.from_linkedin,
                    current_city: r.from_city,
                    headline: r.from_headline,
                };
            return serializeConnection(r, { includeContact: true, contact: consentedContact(peer) });
        }),
    };
}
export async function refreshSuggestions(actor, query = {}) {
    await requireTables();
    assertOperate(actor);
    const alumniProfileId = query.alumniProfileId ? Number(query.alumniProfileId) : undefined;
    const contrib = await discoverContributionSuggestions({
        collegeId: actor.collegeId,
        alumniProfileId,
        limit: 50,
    });
    const achieve = await discoverAchievementCandidates({
        collegeId: actor.collegeId,
        alumniProfileId,
        limit: 50,
    });
    let created = 0;
    for (const s of [...contrib, ...achieve]) {
        const evidenceRefs = s.evidenceRefs || [];
        const primaryRef = evidenceRefs[0]?.sourceReference != null
            ? `${evidenceRefs[0].sourceType}:${evidenceRefs[0].sourceReference}`
            : null;
        let duplicate = null;
        if (primaryRef) {
            const open = await db('alumni_recognition_suggestions')
                .where({
                college_id: actor.collegeId,
                alumni_profile_id: s.alumniProfileId,
                suggestion_type: s.suggestionType,
                status: 'OPEN',
            })
                .select('id', 'evidence_refs');
            duplicate = open.find((r) => {
                const refs = parseJson(r.evidence_refs, []);
                return refs.some((ref) => `${ref.sourceType}:${ref.sourceReference}` === primaryRef);
            });
        }
        if (duplicate)
            continue;
        await db('alumni_recognition_suggestions').insert({
            college_id: actor.collegeId,
            alumni_profile_id: s.alumniProfileId,
            suggestion_type: s.suggestionType,
            category: s.category,
            title: s.title,
            rationale: s.rationale,
            evidence_refs: serializeJson(evidenceRefs),
            status: 'OPEN',
        });
        created += 1;
    }
    return { created, note: 'Suggestions are not awards — human review required' };
}
export async function listSuggestions(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_recognition_suggestions as s')
        .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
        .where('s.college_id', actor.collegeId)
        .select('s.*', 'ap.historical_name as alumni_name');
    if (query.status)
        q = q.where('s.status', String(query.status));
    else
        q = q.where('s.status', 'OPEN');
    if (query.alumniProfileId)
        q = q.where('s.alumni_profile_id', Number(query.alumniProfileId));
    const rows = await q.orderBy('s.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { suggestions: rows.map(serializeSuggestion) };
}
export async function dismissSuggestion(actor, suggestionId) {
    await requireTables();
    assertOperate(actor);
    const row = await db('alumni_recognition_suggestions')
        .where({ id: suggestionId, college_id: actor.collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Suggestion not found');
    await db('alumni_recognition_suggestions').where({ id: suggestionId }).update({
        status: 'DISMISSED',
        updated_at: db.fn.now(),
    });
    return {
        suggestion: serializeSuggestion(await db('alumni_recognition_suggestions').where({ id: suggestionId }).first()),
    };
}
export async function getReciprocity(actor, alumniProfileId, months) {
    await requireTables();
    assertAccess(actor);
    const profile = await db('alumni_profiles')
        .where({ id: alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    return buildReciprocityView({
        collegeId: actor.collegeId,
        alumniProfileId,
        months,
    });
}
export async function getEngagementGuardrail(actor, alumniProfileId) {
    const view = await getReciprocity(actor, alumniProfileId, 12);
    return {
        alumniProfileId,
        guardrail: view.guardrail,
        windowMonths: view.windowMonths,
        note: view.note,
    };
}
export async function getBenefitHistory(collegeId, alumniProfileId, viewer) {
    if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
        return { available: false };
    }
    const recognitions = await db('alumni_recognition_records')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .whereIn('status', ['ISSUED', 'CORRECTED'])
        .orderBy('id', 'desc')
        .limit(50);
    const participations = await db('alumni_value_participations as p')
        .leftJoin('alumni_value_offerings as o', 'o.id', 'p.offering_id')
        .where('p.college_id', collegeId)
        .where('p.alumni_profile_id', alumniProfileId)
        .select('p.*', 'o.title as offering_title')
        .orderBy('p.id', 'desc')
        .limit(50);
    const memberships = await db('alumni_community_memberships as m')
        .leftJoin('alumni_communities as c', 'c.id', 'm.community_id')
        .where('m.college_id', collegeId)
        .where('m.alumni_profile_id', alumniProfileId)
        .select('m.*', 'c.name as community_name', 'c.type as community_type')
        .orderBy('m.id', 'desc')
        .limit(50);
    const certificates = await db('alumni_recognition_certificates')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId, status: 'ISSUED' })
        .orderBy('id', 'desc')
        .limit(50);
    let reviews = [];
    if (viewer === 'admin') {
        const nomIds = await db('alumni_recognition_nominations')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .pluck('id');
        if (nomIds.length) {
            reviews = await db('alumni_recognition_reviews')
                .where({ college_id: collegeId })
                .whereIn('nomination_id', nomIds)
                .orderBy('decided_at', 'desc')
                .limit(30);
        }
    }
    return {
        available: true,
        recognitions: recognitions.map(serializeRecognition),
        participations: participations.map(serializeParticipation),
        communities: memberships.map((m) => ({
            ...serializeMembership(m),
            communityName: m.community_name,
            communityType: m.community_type,
        })),
        certificates: certificates.map(serializeCertificate),
        reviews: viewer === 'admin' ? reviews.map(serializeReview) : undefined,
    };
}
export async function buildRecognition360Section(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
        return { available: false };
    }
    const history = await getBenefitHistory(collegeId, alumniProfileId, 'admin');
    const reciprocity = await buildReciprocityView({ collegeId, alumniProfileId, months: 12 });
    return {
        available: true,
        recognitionCount: history.recognitions?.length || 0,
        recognitions: history.recognitions?.slice(0, 10) || [],
        valueParticipations: history.participations?.slice(0, 10) || [],
        communities: history.communities?.slice(0, 10) || [],
        certificates: history.certificates?.slice(0, 5) || [],
        reciprocityGuardrail: reciprocity.guardrail,
        note: 'C6 summary — recognition decisions remain human',
    };
}
// ── Alumni self helpers ───────────────────────────────────────────────────
export async function alumniListValueCatalogue(actor) {
    await requireTables();
    const rows = await db('alumni_value_offerings')
        .where({ college_id: actor.collegeId })
        .whereIn('status', ['OPEN', 'FULL'])
        .whereIn('visibility', ['ALUMNI_NETWORK', 'PUBLIC', 'INSTITUTION'])
        .orderBy('id', 'desc')
        .limit(100);
    return { offerings: rows.map(serializeValueOffering) };
}
export async function alumniRegisterInterest(actor, offeringId, status = 'INTERESTED') {
    await requireTables();
    const offering = await db('alumni_value_offerings')
        .where({ id: offeringId, college_id: actor.collegeId })
        .whereIn('status', ['OPEN', 'FULL'])
        .first();
    if (!offering)
        throw new AppError(404, 'Offering not found');
    if (!['INTERESTED', 'REGISTERED'].includes(status)) {
        throw new AppError(400, 'Alumni may only set INTERESTED or REGISTERED');
    }
    const existing = await db('alumni_value_participations')
        .where({ offering_id: offeringId, alumni_profile_id: actor.alumniProfileId })
        .first();
    if (existing) {
        await db('alumni_value_participations').where({ id: existing.id }).update({
            status,
            registered_at: status === 'REGISTERED' ? existing.registered_at || db.fn.now() : existing.registered_at,
            updated_at: db.fn.now(),
        });
        return {
            participation: serializeParticipation(await db('alumni_value_participations').where({ id: existing.id }).first()),
        };
    }
    const [id] = await db('alumni_value_participations').insert({
        college_id: actor.collegeId,
        offering_id: offeringId,
        alumni_profile_id: actor.alumniProfileId,
        status,
        registered_at: status === 'REGISTERED' ? db.fn.now() : null,
    });
    if (status === 'REGISTERED') {
        await db('alumni_value_offerings')
            .where({ id: offeringId })
            .update({ registered_count: Number(offering.registered_count || 0) + 1 });
    }
    return { participation: serializeParticipation(await db('alumni_value_participations').where({ id }).first()) };
}
export async function alumniListCommunities(actor) {
    await requireTables();
    const rows = await db('alumni_communities')
        .where({ college_id: actor.collegeId, status: 'ACTIVE' })
        .orderBy('name', 'asc')
        .limit(200);
    return { communities: rows.map(serializeCommunity) };
}
export async function alumniJoinCommunity(actor, communityId) {
    await requireTables();
    const community = await db('alumni_communities')
        .where({ id: communityId, college_id: actor.collegeId, status: 'ACTIVE' })
        .first();
    if (!community)
        throw new AppError(404, 'Community not found');
    const existing = await db('alumni_community_memberships')
        .where({ community_id: communityId, alumni_profile_id: actor.alumniProfileId })
        .first();
    if (existing) {
        await db('alumni_community_memberships').where({ id: existing.id }).update({
            status: 'OPT_IN',
            joined_at: existing.joined_at || db.fn.now(),
            updated_at: db.fn.now(),
        });
        return {
            membership: serializeMembership(await db('alumni_community_memberships').where({ id: existing.id }).first()),
        };
    }
    const [id] = await db('alumni_community_memberships').insert({
        college_id: actor.collegeId,
        community_id: communityId,
        alumni_profile_id: actor.alumniProfileId,
        status: 'OPT_IN',
        joined_at: db.fn.now(),
    });
    return { membership: serializeMembership(await db('alumni_community_memberships').where({ id }).first()) };
}
export async function alumniMyRecognition(actor) {
    return getBenefitHistory(actor.collegeId, actor.alumniProfileId, 'self');
}
export async function alumniMyContributions(actor, months) {
    const view = await buildReciprocityView({
        collegeId: actor.collegeId,
        alumniProfileId: actor.alumniProfileId,
        months,
    });
    return {
        windowMonths: view.windowMonths,
        contributions: view.alumniToInstitution,
        note: 'Factual alumni→institution contributions only — no reciprocity score',
    };
}
export async function alumniConsentSpotlight(actor, spotlightId, consent) {
    await requireTables();
    const row = await db('alumni_spotlights')
        .where({ id: spotlightId, college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId })
        .first();
    if (!row)
        throw new AppError(404, 'Spotlight not found');
    await assertAlumniOwn(actor, Number(row.alumni_profile_id));
    const patch = {
        publication_consent: consent,
        publication_consent_at: consent ? db.fn.now() : null,
        updated_at: db.fn.now(),
    };
    if (consent && row.publication_status === 'DRAFT') {
        patch.publication_status = 'APPROVED';
    }
    if (!consent && row.publication_status === 'PUBLISHED') {
        patch.publication_status = 'UNPUBLISHED';
    }
    await db('alumni_spotlights').where({ id: spotlightId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorAlumniId: actor.alumniProfileId,
        actorType: 'ALUMNI',
        action: 'SPOTLIGHT_CONSENT',
        entityType: 'alumni_spotlights',
        entityId: spotlightId,
        metadata: { consent },
    });
    return { spotlight: serializeSpotlight(await db('alumni_spotlights').where({ id: spotlightId }).first()) };
}
