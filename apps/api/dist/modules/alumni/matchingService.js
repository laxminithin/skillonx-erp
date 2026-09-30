import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canAccessMatching, canFulfilNeed, canOperateMatching, isDepartmentScopedMatching, } from './accessMatching.js';
import { evaluateNeedCandidates, generateCandidatePool } from './matchingEngine.js';
import * as engagement from './engagementService.js';
import * as crm from './crmService.js';
import { CONNECT_NEED_TYPES, NEED_ENGAGEMENT_CATEGORY, NEED_OPPORTUNITY_TYPES, NEED_SOURCE_TYPES, SOURCE_OF_TRUTH_MATRIX, dismissSchema, engageHandoffSchema, evaluateOptsSchema, fulfilmentSchema, needCreateSchema, needPatchSchema, opportunityHandoffSchema, shortlistSchema, } from './typesMatching.js';
function assertAccess(actor) {
    if (!canAccessMatching(actor))
        throw new AppError(403, 'Matching access denied');
}
function assertOperate(actor) {
    if (!canOperateMatching(actor))
        throw new AppError(403, 'Matching operate denied');
}
async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: 'FACULTY',
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
function parseJson(raw, fallback) {
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
function serializeNeed(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        sourceType: row.source_type,
        sourceReference: row.source_reference,
        type: row.type,
        title: row.title,
        description: row.description,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        programme: row.programme,
        domain: row.domain,
        skillsTopics: parseJson(row.skills_topics, []),
        targetBeneficiaries: parseJson(row.target_beneficiaries, null),
        quantityRequired: row.quantity_required != null ? Number(row.quantity_required) : null,
        quantityConfirmed: Number(row.quantity_confirmed || 0),
        quantityVerified: Number(row.quantity_verified || 0),
        mode: row.mode,
        location: row.location,
        startDate: row.start_date,
        targetDate: row.target_date,
        deadline: row.deadline,
        priority: row.priority,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        status: row.status,
        createdByFacultyId: row.created_by_faculty_id != null ? Number(row.created_by_faculty_id) : null,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
function serializeShortlist(row) {
    return {
        id: Number(row.id),
        needId: Number(row.need_id),
        alumniProfileId: Number(row.alumni_profile_id),
        status: row.status,
        reasonNotes: row.reason_notes,
        matchSnapshot: parseJson(row.match_snapshot, null),
        allocatedQuantity: row.allocated_quantity != null ? Number(row.allocated_quantity) : null,
        confirmedQuantity: Number(row.confirmed_quantity || 0),
        verifiedQuantity: Number(row.verified_quantity || 0),
        shortlistedByFacultyId: row.shortlisted_by_faculty_id != null ? Number(row.shortlisted_by_faculty_id) : null,
        shortlistedAt: row.shortlisted_at ? new Date(row.shortlisted_at).toISOString() : null,
        engagementCampaignId: row.engagement_campaign_id != null ? Number(row.engagement_campaign_id) : null,
        engagementRecipientId: row.engagement_recipient_id != null ? Number(row.engagement_recipient_id) : null,
        crmOpportunityId: row.crm_opportunity_id != null ? Number(row.crm_opportunity_id) : null,
        crmOutcomeId: row.crm_outcome_id != null ? Number(row.crm_outcome_id) : null,
        alumniName: row.alumni_name ?? undefined,
    };
}
async function requireTables() {
    if (!(await db.schema.hasTable('alumni_connect_needs'))) {
        throw new AppError(503, 'Run migration alumni_matching_c5 first');
    }
}
function scopeNeedsQuery(actor, q) {
    q = q.where('n.college_id', actor.collegeId);
    if (isDepartmentScopedMatching(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('n.department_id', actor.departmentId).orWhereNull('n.department_id');
        });
    }
    return q;
}
async function getNeedRow(actor, needId) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_connect_needs as n').where('n.id', needId);
    q = scopeNeedsQuery(actor, q);
    const row = await q.first();
    if (!row)
        throw new AppError(404, 'Need not found');
    return row;
}
async function createTask(input) {
    if (!(await db.schema.hasTable('alumni_matching_tasks')))
        return;
    await db('alumni_matching_tasks').insert({
        college_id: input.collegeId,
        need_id: input.needId ?? null,
        shortlist_id: input.shortlistId ?? null,
        assignee_faculty_id: input.assigneeFacultyId ?? null,
        task_type: input.taskType,
        title: input.title,
        body: input.body ?? null,
        status: 'OPEN',
        due_at: input.dueAt ?? null,
    });
}
async function refreshNeedFulfilmentAggregates(needId) {
    const need = await db('alumni_connect_needs').where({ id: needId }).first();
    if (!need)
        return;
    const aggs = await db('alumni_connect_fulfilment')
        .where({ need_id: needId })
        .whereNot('status', 'WITHDRAWN')
        .select(db.raw('COALESCE(SUM(confirmed_quantity),0) as confirmed'), db.raw('COALESCE(SUM(verified_quantity),0) as verified'))
        .first();
    const confirmed = Number(aggs?.confirmed || 0);
    const verified = Number(aggs?.verified || 0);
    const required = need.quantity_required != null ? Number(need.quantity_required) : null;
    let status = need.status;
    if (!['CLOSED', 'CANCELLED', 'DRAFT'].includes(status)) {
        if (required != null && required > 0) {
            if (verified >= required)
                status = 'FULFILLED';
            else if (verified > 0 || confirmed > 0)
                status = 'PARTIALLY_FULFILLED';
        }
        else if (verified > 0) {
            status = 'FULFILLED';
        }
    }
    await db('alumni_connect_needs').where({ id: needId }).update({
        quantity_confirmed: confirmed,
        quantity_verified: verified,
        status,
        updated_at: db.fn.now(),
    });
}
export function getSourceOfTruthMatrix() {
    return { matrix: SOURCE_OF_TRUTH_MATRIX, needTypes: CONNECT_NEED_TYPES, sourceTypes: NEED_SOURCE_TYPES };
}
export async function listNeeds(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    let q = db('alumni_connect_needs as n').select('n.*');
    q = scopeNeedsQuery(actor, q);
    if (query.status)
        q = q.where('n.status', String(query.status));
    if (query.type)
        q = q.where('n.type', String(query.type));
    if (query.departmentId)
        q = q.where('n.department_id', Number(query.departmentId));
    if (query.priority)
        q = q.where('n.priority', String(query.priority));
    if (query.ownerFacultyId)
        q = q.where('n.owner_faculty_id', Number(query.ownerFacultyId));
    if (query.domain)
        q = q.where('n.domain', 'like', `%${String(query.domain)}%`);
    if (query.programme)
        q = q.where('n.programme', 'like', `%${String(query.programme)}%`);
    const rows = await q.orderBy('n.deadline', 'asc').orderBy('n.id', 'desc').limit(Math.min(Number(query.limit) || 100, 300));
    return { needs: rows.map(serializeNeed) };
}
export async function createNeed(actor, body) {
    await requireTables();
    assertOperate(actor);
    const input = needCreateSchema.parse(body);
    // Validate source linkage when provided — do not invent source modules
    if (input.sourceType && input.sourceType !== 'ADHOC' && input.sourceReference) {
        await assertSourceLink(actor.collegeId, input.sourceType, input.sourceReference);
    }
    const [id] = await db('alumni_connect_needs').insert({
        college_id: actor.collegeId,
        source_type: input.sourceType || 'ADHOC',
        source_reference: input.sourceReference || null,
        type: input.type,
        title: input.title,
        description: input.description || null,
        department_id: input.departmentId ?? (isDepartmentScopedMatching(actor) ? actor.departmentId : null),
        programme: input.programme || null,
        domain: input.domain || null,
        skills_topics: input.skillsTopics ? JSON.stringify(input.skillsTopics) : null,
        target_beneficiaries: input.targetBeneficiaries ? JSON.stringify(input.targetBeneficiaries) : null,
        quantity_required: input.quantityRequired ?? null,
        mode: input.mode || null,
        location: input.location || null,
        start_date: input.startDate || null,
        target_date: input.targetDate || null,
        deadline: input.deadline || null,
        priority: input.priority || 'NORMAL',
        owner_faculty_id: input.ownerFacultyId ?? actor.facultyUserId,
        status: input.status || 'OPEN',
        created_by_faculty_id: actor.facultyUserId,
    });
    if (input.targetBeneficiaries?.refs?.length) {
        for (const ref of input.targetBeneficiaries.refs) {
            await db('alumni_connect_beneficiaries').insert({
                college_id: actor.collegeId,
                need_id: id,
                beneficiary_type: ref.beneficiaryType,
                beneficiary_ref: ref.beneficiaryRef,
                label: ref.label || null,
            });
        }
    }
    await createTask({
        collegeId: actor.collegeId,
        needId: id,
        assigneeFacultyId: input.ownerFacultyId ?? actor.facultyUserId,
        taskType: 'NEED_ASSIGNED',
        title: `New connect need: ${input.title}`,
        body: `${input.type} — review and evaluate matches`,
        dueAt: input.deadline || null,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_NEED_CREATE',
        entityType: 'alumni_connect_needs',
        entityId: id,
        metadata: { type: input.type, sourceType: input.sourceType || 'ADHOC' },
    });
    return { need: serializeNeed(await db('alumni_connect_needs').where({ id }).first()) };
}
async function assertSourceLink(collegeId, sourceType, sourceReference) {
    const refId = Number(String(sourceReference).replace(/^[^\d]*/, '')) || Number(sourceReference);
    if (sourceType === 'TPMS') {
        if (!(await db.schema.hasTable('placement_opportunities'))) {
            throw new AppError(400, 'TPMS source not available');
        }
        const row = await db('placement_opportunities').where({ id: refId, college_id: collegeId }).first();
        if (!row)
            throw new AppError(400, 'placement_opportunities source not found');
    }
    else if (sourceType === 'MENTORING') {
        if (!(await db.schema.hasTable('mentor_assignments'))) {
            throw new AppError(400, 'Mentoring source not available');
        }
        // Allow cohort/group refs as string without requiring numeric assignment
        if (Number.isFinite(refId) && refId > 0) {
            const row = await db('mentor_assignments').where({ id: refId }).first();
            if (row && Number(row.college_id) !== collegeId)
                throw new AppError(400, 'Mentoring source tenant mismatch');
        }
    }
    else if (sourceType === 'STUDENT_PROJECT') {
        if (!(await db.schema.hasTable('student_projects'))) {
            throw new AppError(400, 'Student project source not available');
        }
        const row = await db('student_projects').where({ id: refId }).first();
        if (!row)
            throw new AppError(400, 'student_projects source not found');
    }
    else if (sourceType === 'ALUMNI_EVENT') {
        if (!(await db.schema.hasTable('alumni_events'))) {
            throw new AppError(400, 'Alumni event source not available');
        }
        const row = await db('alumni_events').where({ id: refId, college_id: collegeId }).first();
        if (!row)
            throw new AppError(400, 'alumni_events source not found');
    }
    else if (sourceType === 'TRAINING_MOCK_INTERVIEW') {
        if (!(await db.schema.hasTable('training_mock_interviews'))) {
            throw new AppError(400, 'Mock interview source not available');
        }
    }
    else if (sourceType === 'CRM_OPPORTUNITY') {
        const row = await db('alumni_crm_opportunities').where({ id: refId, college_id: collegeId }).first();
        if (!row)
            throw new AppError(400, 'CRM opportunity source not found');
    }
}
export async function getNeedDetail(actor, needId) {
    const row = await getNeedRow(actor, needId);
    const beneficiaries = await db('alumni_connect_beneficiaries').where({ need_id: needId });
    const shortlist = await db('alumni_connect_shortlist as s')
        .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
        .where('s.need_id', needId)
        .whereNot('s.status', 'REMOVED')
        .select('s.*', 'ap.historical_name as alumni_name')
        .orderBy('s.shortlisted_at', 'desc');
    const dismissals = await db('alumni_connect_dismissals as d')
        .leftJoin('alumni_profiles as ap', 'ap.id', 'd.alumni_profile_id')
        .where('d.need_id', needId)
        .select('d.*', 'ap.historical_name as alumni_name');
    const fulfilment = await db('alumni_connect_fulfilment').where({ need_id: needId });
    const owner = row.owner_faculty_id
        ? await db('faculty_users').where({ id: row.owner_faculty_id }).first()
        : null;
    return {
        need: serializeNeed(row),
        ownerName: owner?.name || null,
        source: {
            type: row.source_type,
            reference: row.source_reference,
            matrix: SOURCE_OF_TRUTH_MATRIX.find((m) => m.needType === row.type) || null,
        },
        beneficiaries: beneficiaries.map((b) => ({
            id: Number(b.id),
            beneficiaryType: b.beneficiary_type,
            beneficiaryRef: b.beneficiary_ref,
            label: b.label,
        })),
        shortlist: shortlist.map(serializeShortlist),
        dismissals: dismissals.map((d) => ({
            id: Number(d.id),
            alumniProfileId: Number(d.alumni_profile_id),
            alumniName: d.alumni_name,
            reason: d.reason,
            notes: d.notes,
            dismissedAt: d.dismissed_at ? new Date(d.dismissed_at).toISOString() : null,
        })),
        fulfilment: fulfilment.map((f) => ({
            id: Number(f.id),
            alumniProfileId: Number(f.alumni_profile_id),
            shortlistId: f.shortlist_id != null ? Number(f.shortlist_id) : null,
            promisedQuantity: Number(f.promised_quantity || 0),
            confirmedQuantity: Number(f.confirmed_quantity || 0),
            verifiedQuantity: Number(f.verified_quantity || 0),
            status: f.status,
            crmOpportunityId: f.crm_opportunity_id != null ? Number(f.crm_opportunity_id) : null,
            crmOutcomeId: f.crm_outcome_id != null ? Number(f.crm_outcome_id) : null,
            notes: f.notes,
        })),
    };
}
export async function patchNeed(actor, needId, body) {
    await getNeedRow(actor, needId);
    assertOperate(actor);
    const input = needPatchSchema.parse(body);
    const patch = { updated_at: db.fn.now() };
    if (input.type !== undefined)
        patch.type = input.type;
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.sourceType !== undefined)
        patch.source_type = input.sourceType;
    if (input.sourceReference !== undefined)
        patch.source_reference = input.sourceReference;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.programme !== undefined)
        patch.programme = input.programme;
    if (input.domain !== undefined)
        patch.domain = input.domain;
    if (input.skillsTopics !== undefined)
        patch.skills_topics = JSON.stringify(input.skillsTopics);
    if (input.targetBeneficiaries !== undefined) {
        patch.target_beneficiaries = input.targetBeneficiaries ? JSON.stringify(input.targetBeneficiaries) : null;
    }
    if (input.quantityRequired !== undefined)
        patch.quantity_required = input.quantityRequired;
    if (input.mode !== undefined)
        patch.mode = input.mode;
    if (input.location !== undefined)
        patch.location = input.location;
    if (input.startDate !== undefined)
        patch.start_date = input.startDate;
    if (input.targetDate !== undefined)
        patch.target_date = input.targetDate;
    if (input.deadline !== undefined)
        patch.deadline = input.deadline;
    if (input.priority !== undefined)
        patch.priority = input.priority;
    if (input.ownerFacultyId !== undefined)
        patch.owner_faculty_id = input.ownerFacultyId;
    if (input.status !== undefined)
        patch.status = input.status;
    await db('alumni_connect_needs').where({ id: needId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_NEED_UPDATE',
        entityType: 'alumni_connect_needs',
        entityId: needId,
        metadata: input,
    });
    return getNeedDetail(actor, needId);
}
export async function evaluateNeed(actor, needId, body = {}) {
    const need = await getNeedRow(actor, needId);
    assertOperate(actor);
    const opts = evaluateOptsSchema.parse(body || {});
    // Bulk quantity: set-based pool, not N×all-alumni naive loops beyond one set evaluation
    const quantity = need.quantity_required != null ? Number(need.quantity_required) : null;
    if (quantity != null && quantity >= 20 && !opts.alumniProfileIds?.length) {
        const pool = await generateCandidatePool({
            actor,
            need,
            poolSize: Math.min(Math.max(quantity * 2, 50), 200),
        });
        if (need.status === 'OPEN' || need.status === 'DRAFT') {
            await db('alumni_connect_needs').where({ id: needId }).update({ status: 'MATCHING', updated_at: db.fn.now() });
        }
        return {
            needId,
            mode: 'SET_BASED_POOL',
            candidates: pool.pool.slice(0, opts.limit ?? 100),
            evaluated: pool.evaluated,
            excluded: pool.excluded,
            note: 'Bulk need uses one set-based candidate pool; individual student×alumni cartesian product is not run.',
        };
    }
    const result = await evaluateNeedCandidates({
        actor,
        need,
        limit: opts.limit ?? 50,
        includeLimited: opts.includeLimited ?? true,
        alumniProfileIds: opts.alumniProfileIds,
    });
    if (need.status === 'OPEN' || need.status === 'DRAFT') {
        await db('alumni_connect_needs').where({ id: needId }).update({ status: 'MATCHING', updated_at: db.fn.now() });
    }
    return {
        needId,
        mode: 'SET_BASED',
        candidates: result.candidates,
        evaluated: result.evaluated,
        excluded: result.excluded,
    };
}
export async function shortlistCandidate(actor, needId, body) {
    const need = await getNeedRow(actor, needId);
    assertOperate(actor);
    const input = shortlistSchema.parse(body);
    const profile = await db('alumni_profiles')
        .where({ id: input.alumniProfileId, college_id: actor.collegeId, is_active: true })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni profile not found');
    // Hard eligibility re-check — never shortlist NOT_WILLING / DO_NOT_CONTACT silently
    const evalResult = await evaluateNeedCandidates({
        actor,
        need,
        alumniProfileIds: [input.alumniProfileId],
        includeLimited: true,
        limit: 1,
    });
    const match = evalResult.candidates[0];
    if (!match || match.hardExcluded) {
        throw new AppError(400, `Candidate not eligible: ${(match?.hardExcludeReasons || ['hard eligibility failed']).join('; ')}`);
    }
    if (match.willingness === 'NOT_WILLING') {
        throw new AppError(400, 'Cannot shortlist — explicit NOT_WILLING');
    }
    const existing = await db('alumni_connect_shortlist')
        .where({ need_id: needId, alumni_profile_id: input.alumniProfileId })
        .first();
    let shortlistId;
    if (existing) {
        await db('alumni_connect_shortlist').where({ id: existing.id }).update({
            status: 'SHORTLISTED',
            reason_notes: input.reasonNotes || existing.reason_notes,
            match_snapshot: JSON.stringify(input.matchSnapshot || match),
            allocated_quantity: input.allocatedQuantity ?? existing.allocated_quantity,
            shortlisted_by_faculty_id: actor.facultyUserId,
            shortlisted_at: db.fn.now(),
            updated_at: db.fn.now(),
        });
        shortlistId = Number(existing.id);
    }
    else {
        const [id] = await db('alumni_connect_shortlist').insert({
            college_id: actor.collegeId,
            need_id: needId,
            alumni_profile_id: input.alumniProfileId,
            status: 'SHORTLISTED',
            reason_notes: input.reasonNotes || null,
            match_snapshot: JSON.stringify(input.matchSnapshot || match),
            allocated_quantity: input.allocatedQuantity ?? null,
            shortlisted_by_faculty_id: actor.facultyUserId,
            shortlisted_at: db.fn.now(),
        });
        shortlistId = id;
    }
    // Remove dismissal if re-shortlisted
    await db('alumni_connect_dismissals').where({ need_id: needId, alumni_profile_id: input.alumniProfileId }).del();
    if (!['SHORTLISTED', 'ENGAGEMENT_IN_PROGRESS', 'PARTIALLY_FULFILLED', 'FULFILLED'].includes(need.status)) {
        await db('alumni_connect_needs').where({ id: needId }).update({ status: 'SHORTLISTED', updated_at: db.fn.now() });
    }
    await createTask({
        collegeId: actor.collegeId,
        needId,
        shortlistId,
        assigneeFacultyId: need.owner_faculty_id || actor.facultyUserId,
        taskType: 'SHORTLIST_REVIEW',
        title: `Shortlist ready: ${profile.historical_name || 'Alumni'} for ${need.title}`,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_SHORTLIST',
        entityType: 'alumni_connect_shortlist',
        entityId: shortlistId,
        metadata: { needId, alumniProfileId: input.alumniProfileId },
    });
    return {
        shortlist: serializeShortlist(await db('alumni_connect_shortlist').where({ id: shortlistId }).first()),
        match,
    };
}
export async function dismissCandidate(actor, needId, body) {
    await getNeedRow(actor, needId);
    assertOperate(actor);
    const input = dismissSchema.parse(body);
    const profile = await db('alumni_profiles').where({ id: input.alumniProfileId, college_id: actor.collegeId }).first();
    if (!profile)
        throw new AppError(404, 'Alumni profile not found');
    const existing = await db('alumni_connect_dismissals')
        .where({ need_id: needId, alumni_profile_id: input.alumniProfileId })
        .first();
    if (existing) {
        await db('alumni_connect_dismissals').where({ id: existing.id }).update({
            reason: input.reason,
            notes: input.notes || null,
            dismissed_by_faculty_id: actor.facultyUserId,
            dismissed_at: db.fn.now(),
            updated_at: db.fn.now(),
        });
    }
    else {
        await db('alumni_connect_dismissals').insert({
            college_id: actor.collegeId,
            need_id: needId,
            alumni_profile_id: input.alumniProfileId,
            reason: input.reason,
            notes: input.notes || null,
            dismissed_by_faculty_id: actor.facultyUserId,
            dismissed_at: db.fn.now(),
        });
    }
    // Soft-remove shortlist entry for this need only — no global penalty
    await db('alumni_connect_shortlist')
        .where({ need_id: needId, alumni_profile_id: input.alumniProfileId })
        .update({ status: 'REMOVED', updated_at: db.fn.now() });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_DISMISS',
        entityType: 'alumni_connect_dismissals',
        entityId: needId,
        metadata: { alumniProfileId: input.alumniProfileId, reason: input.reason },
    });
    return { ok: true, needId, alumniProfileId: input.alumniProfileId, reason: input.reason };
}
/**
 * Hand off shortlisted candidate to C4 engagement — C4 owns eligibility/channel/approval.
 * Does not send messages.
 */
export async function engageShortlist(actor, shortlistId, body = {}) {
    await requireTables();
    assertOperate(actor);
    const input = engageHandoffSchema.parse(body || {});
    const sl = await db('alumni_connect_shortlist').where({ id: shortlistId, college_id: actor.collegeId }).first();
    if (!sl)
        throw new AppError(404, 'Shortlist entry not found');
    if (!['SHORTLISTED', 'ENGAGEMENT_REQUESTED', 'ACCEPTED'].includes(sl.status)) {
        throw new AppError(400, `Cannot engage from status ${sl.status}`);
    }
    const need = await getNeedRow(actor, Number(sl.need_id));
    const category = NEED_ENGAGEMENT_CATEGORY[need.type] || 'OTHER';
    let programId = input.programId || null;
    if (!programId) {
        const existing = await db('alumni_engagement_programs')
            .where({ college_id: actor.collegeId, category, status: 'ACTIVE' })
            .orderBy('id', 'desc')
            .first();
        if (existing) {
            programId = Number(existing.id);
        }
        else if (input.createProgramIfMissing !== false) {
            const created = await engagement.createProgram(actor, {
                name: `Connect: ${need.type.replace(/_/g, ' ')}`,
                category: category,
                objective: `Institutional connect handoff for needs of type ${need.type}`,
                status: 'ACTIVE',
                valueExchange: 'MUTUAL_VALUE',
                departmentId: need.department_id,
            });
            programId = created.program.id;
        }
        else {
            throw new AppError(400, 'No engagement program available — create one or set createProgramIfMissing');
        }
    }
    const channel = input.channel || 'MANUAL';
    const purpose = input.purpose ||
        `Institutional request: ${need.title}. Purpose: ${need.type}. Mode: ${need.mode || 'TBD'}.`;
    const campaign = await engagement.createCampaign(actor, {
        programId,
        name: `Connect need #${need.id} — ${need.title}`.slice(0, 255),
        purpose,
        channel: channel,
        audienceSource: {
            type: 'EXPLICIT_IDS',
            alumniProfileIds: [Number(sl.alumni_profile_id)],
        },
        requiresApproval: true,
        departmentId: need.department_id,
        status: 'DRAFT',
    });
    const snapshotSummary = await engagement.snapshotCampaignAudience(actor, campaign.campaign.id);
    const recipient = await db('alumni_engagement_recipients')
        .where({ campaign_id: campaign.campaign.id, alumni_profile_id: sl.alumni_profile_id })
        .first();
    await db('alumni_connect_shortlist').where({ id: shortlistId }).update({
        status: 'ENGAGEMENT_REQUESTED',
        engagement_campaign_id: campaign.campaign.id,
        engagement_recipient_id: recipient ? Number(recipient.id) : null,
        updated_at: db.fn.now(),
    });
    await db('alumni_connect_needs').where({ id: need.id }).update({
        status: 'ENGAGEMENT_IN_PROGRESS',
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_ENGAGEMENT_HANDOFF',
        entityType: 'alumni_connect_shortlist',
        entityId: shortlistId,
        metadata: {
            needId: need.id,
            campaignId: campaign.campaign.id,
            recipientId: recipient ? Number(recipient.id) : null,
            eligibility: recipient?.eligibility,
            snapshot: snapshotSummary,
        },
    });
    return {
        shortlist: serializeShortlist(await db('alumni_connect_shortlist').where({ id: shortlistId }).first()),
        campaign: campaign.campaign,
        recipient: recipient
            ? {
                id: Number(recipient.id),
                eligibility: recipient.eligibility,
                eligibilityReasons: parseJson(recipient.eligibility_reasons, []),
                contactStatus: recipient.contact_status,
            }
            : null,
        snapshotSummary,
        alumniFacingContext: {
            institutionalRequest: need.title,
            purpose: need.description || need.type,
            expectedCommitment: need.quantity_required ? `Support quantity up to ${need.quantity_required}` : null,
            timeRequirement: need.target_date || need.deadline || null,
            mode: need.mode,
            beneficiaryContext: parseJson(need.target_beneficiaries, null)?.summary || null,
            // Explicitly omit internal match evidence / staff comments / other candidates
        },
    };
}
/** When interest is confirmed — create/link C2 opportunity. */
export async function createOpportunityFromShortlist(actor, shortlistId, body = {}) {
    await requireTables();
    assertOperate(actor);
    const input = opportunityHandoffSchema.parse(body || {});
    const sl = await db('alumni_connect_shortlist').where({ id: shortlistId, college_id: actor.collegeId }).first();
    if (!sl)
        throw new AppError(404, 'Shortlist entry not found');
    const need = await getNeedRow(actor, Number(sl.need_id));
    const oppTypes = NEED_OPPORTUNITY_TYPES[need.type] || ['OTHER'];
    const opportunityType = oppTypes[0] || 'OTHER';
    if (sl.crm_opportunity_id) {
        const existingOpp = await db('alumni_crm_opportunities')
            .where({ id: sl.crm_opportunity_id, college_id: actor.collegeId })
            .first();
        return {
            opportunity: existingOpp
                ? {
                    id: Number(existingOpp.id),
                    opportunityType: existingOpp.opportunity_type,
                    title: existingOpp.title,
                    status: existingOpp.status,
                }
                : null,
            shortlist: serializeShortlist(sl),
            linked: true,
        };
    }
    const opp = await crm.createOpportunity(actor, Number(sl.alumni_profile_id), {
        opportunityType: opportunityType,
        title: input.title || `${need.title} — ${need.type}`,
        description: input.description || `Linked from connect need #${need.id}`,
        expectedOutcome: input.expectedOutcome || null,
        targetDate: input.targetDate || need.target_date || need.deadline || null,
        departmentId: need.department_id,
        status: 'IDENTIFIED',
    });
    await db('alumni_connect_shortlist').where({ id: shortlistId }).update({
        status: 'ACCEPTED',
        crm_opportunity_id: opp.opportunity.id,
        allocated_quantity: input.allocatedQuantity ?? sl.allocated_quantity,
        updated_at: db.fn.now(),
    });
    // Promised quantity is NOT fulfilment
    if (input.allocatedQuantity || sl.allocated_quantity) {
        await db('alumni_connect_fulfilment').insert({
            college_id: actor.collegeId,
            need_id: need.id,
            shortlist_id: shortlistId,
            alumni_profile_id: sl.alumni_profile_id,
            promised_quantity: input.allocatedQuantity || sl.allocated_quantity || 0,
            confirmed_quantity: 0,
            verified_quantity: 0,
            crm_opportunity_id: opp.opportunity.id,
            status: 'PROMISED',
            recorded_by_faculty_id: actor.facultyUserId,
            notes: 'Promised on opportunity creation — not yet verified fulfilment',
        });
        await refreshNeedFulfilmentAggregates(need.id);
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_OPPORTUNITY_HANDOFF',
        entityType: 'alumni_connect_shortlist',
        entityId: shortlistId,
        metadata: { opportunityId: opp.opportunity.id, needId: need.id },
    });
    return { opportunity: opp.opportunity, shortlist: serializeShortlist(await db('alumni_connect_shortlist').where({ id: shortlistId }).first()) };
}
export async function recordFulfilment(actor, needId, body) {
    const need = await getNeedRow(actor, needId);
    if (!canFulfilNeed(actor) && !canOperateMatching(actor)) {
        throw new AppError(403, 'Fulfilment update denied');
    }
    const input = fulfilmentSchema.parse(body);
    // Verified quantity requires linked verified C2 outcome when claiming verification
    if ((input.verifiedQuantity || 0) > 0) {
        if (!input.crmOutcomeId) {
            throw new AppError(400, 'Verified fulfilment requires linked verified C2 outcome (crmOutcomeId)');
        }
        const outcome = await db('alumni_crm_outcomes')
            .where({ id: input.crmOutcomeId, college_id: actor.collegeId, alumni_profile_id: input.alumniProfileId })
            .first();
        if (!outcome || outcome.verification_status !== 'VERIFIED') {
            throw new AppError(400, 'Fulfilment verification requires a VERIFIED CRM outcome');
        }
    }
    const required = need.quantity_required != null ? Number(need.quantity_required) : null;
    const existingVerified = Number(need.quantity_verified || 0);
    const addVerified = Number(input.verifiedQuantity || 0);
    if (required != null && existingVerified + addVerified > required) {
        // Prevent over-counting across multi-alumni fulfilment
        const room = Math.max(0, required - existingVerified);
        if (addVerified > room) {
            throw new AppError(400, `Verified quantity would over-count need (room left: ${room})`);
        }
    }
    const [id] = await db('alumni_connect_fulfilment').insert({
        college_id: actor.collegeId,
        need_id: needId,
        shortlist_id: input.shortlistId || null,
        alumni_profile_id: input.alumniProfileId,
        promised_quantity: input.promisedQuantity || 0,
        confirmed_quantity: input.confirmedQuantity || 0,
        verified_quantity: input.verifiedQuantity || 0,
        crm_opportunity_id: input.crmOpportunityId || null,
        crm_outcome_id: input.crmOutcomeId || null,
        status: input.status || ((input.verifiedQuantity || 0) > 0 ? 'VERIFIED' : (input.confirmedQuantity || 0) > 0 ? 'CONFIRMED' : 'PROMISED'),
        notes: input.notes || null,
        recorded_by_faculty_id: actor.facultyUserId,
    });
    if (input.shortlistId && (input.verifiedQuantity || 0) > 0) {
        const slRow = await db('alumni_connect_shortlist').where({ id: input.shortlistId }).first();
        if (slRow) {
            await db('alumni_connect_shortlist').where({ id: input.shortlistId }).update({
                verified_quantity: Number(slRow.verified_quantity || 0) + Number(input.verifiedQuantity),
                crm_outcome_id: input.crmOutcomeId || slRow.crm_outcome_id,
                status: 'COMPLETED',
                updated_at: db.fn.now(),
            });
        }
    }
    await refreshNeedFulfilmentAggregates(needId);
    await createTask({
        collegeId: actor.collegeId,
        needId,
        assigneeFacultyId: need.owner_faculty_id || actor.facultyUserId,
        taskType: 'FULFILMENT_PENDING',
        title: `Fulfilment recorded for need #${needId}`,
        body: input.notes || null,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'MATCHING_FULFILMENT',
        entityType: 'alumni_connect_fulfilment',
        entityId: id,
        metadata: input,
    });
    return getNeedDetail(actor, needId);
}
/** Sync verified quantities from linked C2 outcomes (evidence feedback). */
export async function syncFulfilmentFromOutcomes(actor, needId) {
    const need = await getNeedRow(actor, needId);
    assertOperate(actor);
    const shortlists = await db('alumni_connect_shortlist')
        .where({ need_id: needId })
        .whereNotNull('crm_opportunity_id');
    let synced = 0;
    for (const sl of shortlists) {
        const outcomes = await db('alumni_crm_outcomes')
            .where({
            college_id: actor.collegeId,
            alumni_profile_id: sl.alumni_profile_id,
            verification_status: 'VERIFIED',
        })
            .andWhere((qb) => {
            qb.where('source_reference', `connect_need:${needId}`).orWhere('opportunity_id', sl.crm_opportunity_id);
        });
        for (const o of outcomes) {
            const qty = Number(o.quantity || 1);
            const exists = await db('alumni_connect_fulfilment')
                .where({ need_id: needId, crm_outcome_id: o.id })
                .first();
            if (exists)
                continue;
            await db('alumni_connect_fulfilment').insert({
                college_id: actor.collegeId,
                need_id: needId,
                shortlist_id: sl.id,
                alumni_profile_id: sl.alumni_profile_id,
                promised_quantity: 0,
                confirmed_quantity: qty,
                verified_quantity: qty,
                crm_opportunity_id: sl.crm_opportunity_id,
                crm_outcome_id: o.id,
                status: 'VERIFIED',
                recorded_by_faculty_id: actor.facultyUserId,
                notes: 'Synced from verified C2 outcome',
            });
            synced += 1;
        }
    }
    await refreshNeedFulfilmentAggregates(needId);
    return { synced, need: serializeNeed(await db('alumni_connect_needs').where({ id: needId }).first()) };
}
export async function getProfileMatches(actor, profileId) {
    await requireTables();
    assertAccess(actor);
    const profile = await db('alumni_profiles').where({ id: profileId, college_id: actor.collegeId }).first();
    if (!profile)
        throw new AppError(404, 'Profile not found');
    const shortlisted = await db('alumni_connect_shortlist as s')
        .join('alumni_connect_needs as n', 'n.id', 's.need_id')
        .where('s.alumni_profile_id', profileId)
        .where('s.college_id', actor.collegeId)
        .whereNot('s.status', 'REMOVED')
        .select('s.*', 'n.title as need_title', 'n.type as need_type', 'n.status as need_status')
        .orderBy('s.updated_at', 'desc');
    const activeOpps = await db('alumni_crm_opportunities')
        .where({ college_id: actor.collegeId, alumni_profile_id: profileId })
        .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS']);
    const completed = await db('alumni_connect_shortlist as s')
        .join('alumni_connect_needs as n', 'n.id', 's.need_id')
        .where('s.alumni_profile_id', profileId)
        .whereIn('s.status', ['COMPLETED', 'ACCEPTED'])
        .select('s.*', 'n.title as need_title', 'n.type as need_type')
        .limit(30);
    const fulfilment = await db('alumni_connect_fulfilment as f')
        .join('alumni_connect_needs as n', 'n.id', 'f.need_id')
        .where('f.alumni_profile_id', profileId)
        .where('f.college_id', actor.collegeId)
        .select('f.*', 'n.title as need_title', 'n.type as need_type')
        .orderBy('f.updated_at', 'desc')
        .limit(30);
    return {
        available: true,
        shortlistedNeeds: shortlisted.map((r) => ({
            ...serializeShortlist(r),
            needTitle: r.need_title,
            needType: r.need_type,
            needStatus: r.need_status,
        })),
        activeOpportunities: activeOpps.map((o) => ({
            id: Number(o.id),
            type: o.opportunity_type,
            title: o.title,
            status: o.status,
        })),
        currentCommitments: activeOpps.map((o) => `${o.opportunity_type}: ${o.title} (${o.status})`),
        completedSupport: completed.map((r) => ({
            shortlistId: Number(r.id),
            needTitle: r.need_title,
            needType: r.need_type,
            verifiedQuantity: Number(r.verified_quantity || 0),
        })),
        fulfilmentHistory: fulfilment.map((f) => ({
            needTitle: f.need_title,
            needType: f.need_type,
            verifiedQuantity: Number(f.verified_quantity || 0),
            status: f.status,
        })),
        upcomingEngagements: shortlisted
            .filter((r) => r.status === 'ENGAGEMENT_REQUESTED')
            .map((r) => ({
            needTitle: r.need_title,
            campaignId: r.engagement_campaign_id,
        })),
    };
}
/** Admin 360 matching section. */
export async function buildMatching360Section(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_connect_needs'))) {
        return { available: false };
    }
    const actor = {
        facultyUserId: 0,
        collegeId,
        departmentId: null,
        role: 'COLLEGE_ADMIN',
        name: 'system',
    };
    try {
        return await getProfileMatches(actor, alumniProfileId);
    }
    catch {
        return { available: false };
    }
}
