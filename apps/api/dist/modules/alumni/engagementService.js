import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { approvalStepsForCampaign, canAccessEngagement, canApproveDepartmentCampaign, canApproveInstitutionalCampaign, canManageTemplates, canOperateEngagement, canOverrideSuppression, isDepartmentScopedEngagement, } from './accessEngagement.js';
import { getAdapter, getChannelCapability, listChannelCapabilities } from './channels.js';
import { evaluateEligibilityBatch, ensureDefaultFatigueRules, getFatigueRule } from './eligibility.js';
import * as segments from './segmentService.js';
import * as crm from './crmService.js';
import { ENGAGEMENT_CATEGORIES, SAFE_TEMPLATE_VARS, audienceSourceSchema, campaignCreateSchema, campaignPatchSchema, fatigueRuleSchema, manualExecutionSchema, preferenceCentreSchema, programCreateSchema, programPatchSchema, recognitionNomSchema, suppressOverrideSchema, templateCreateSchema, templatePatchSchema, approvalDecisionSchema, } from './typesEngagement.js';
function assertAccess(actor) {
    if (!canAccessEngagement(actor))
        throw new AppError(403, 'Engagement access denied');
}
function assertOperate(actor) {
    if (!canOperateEngagement(actor))
        throw new AppError(403, 'Engagement operate denied');
}
async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: input.actorType ?? 'FACULTY',
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: input.actorAlumniId ?? null,
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
async function ensureSchema() {
    if (!(await db.schema.hasTable('alumni_engagement_programs'))) {
        throw new AppError(503, 'Alumni engagement schema not migrated');
    }
}
export async function ensureDefaultCategories(collegeId) {
    if (!(await db.schema.hasTable('alumni_engagement_categories')))
        return;
    const count = await db('alumni_engagement_categories').where({ college_id: collegeId }).count({ c: '*' }).first();
    if (Number(count?.c || 0) > 0)
        return;
    let order = 0;
    for (const code of ENGAGEMENT_CATEGORIES) {
        await db('alumni_engagement_categories').insert({
            college_id: collegeId,
            code,
            label: code.replace(/_/g, ' '),
            is_system: true,
            is_active: true,
            sort_order: order++,
        });
    }
}
export function serializeProgram(row) {
    return {
        id: Number(row.id),
        name: row.name,
        objective: row.objective,
        category: row.category,
        academicYear: row.academic_year,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        scope: row.scope,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        targetDefinition: parseJson(row.target_definition, null),
        successDefinition: row.success_definition,
        valueExchange: row.value_exchange,
        valueToAlumni: row.value_to_alumni,
        valueToInstitution: row.value_to_institution,
        createdByFacultyId: row.created_by_faculty_id != null ? Number(row.created_by_faculty_id) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function serializeCampaign(row) {
    const channel = row.channel;
    return {
        id: Number(row.id),
        programId: Number(row.program_id),
        name: row.name,
        purpose: row.purpose,
        channel,
        channelCapability: getChannelCapability(channel),
        templateId: row.template_id != null ? Number(row.template_id) : null,
        audienceSource: parseJson(row.audience_source, null),
        scheduledAt: row.scheduled_at,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        status: row.status,
        requiresApproval: Boolean(row.requires_approval),
        approvalComplete: Boolean(row.approval_complete),
        audienceSnapshottedAt: row.audience_snapshotted_at,
        createdByFacultyId: row.created_by_faculty_id != null ? Number(row.created_by_faculty_id) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function serializeTemplate(row) {
    return {
        id: Number(row.id),
        name: row.name,
        category: row.category,
        channel: row.channel,
        subject: row.subject,
        body: row.body,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function renderTemplate(body, vars) {
    const allowed = new Set(SAFE_TEMPLATE_VARS);
    return body.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_m, key) => {
        const k = key.toLowerCase();
        if (!allowed.has(k))
            return '';
        const v = vars[k];
        return v == null ? '' : String(v);
    });
}
export function previewTemplate(body, subject, sample) {
    const vars = {
        alumni_name: sample?.alumni_name ?? 'Nithin K',
        programme: sample?.programme ?? 'B.E. CSE',
        graduation_year: sample?.graduation_year ?? '2021',
        institution_name: sample?.institution_name ?? 'Sample Institution',
        event_name: sample?.event_name ?? 'Alumni Meet',
        response_link: sample?.response_link ?? 'https://example.invalid/engage/token',
        department: sample?.department ?? 'CSE',
        campaign_name: sample?.campaign_name ?? 'Sample Campaign',
        program_name: sample?.program_name ?? 'Sample Program',
    };
    // Reject unrestricted expressions
    if (/\{\{[^}]*[();=][^}]*\}\}/.test(body) || /\$\{/.test(body)) {
        throw new AppError(400, 'Template contains unsafe expressions');
    }
    return {
        subject: subject ? renderTemplate(subject, vars) : null,
        body: renderTemplate(body, vars),
        safeVariables: [...SAFE_TEMPLATE_VARS],
    };
}
// ── Programs ──────────────────────────────────────────────────────────────
export async function listPrograms(actor, query = {}) {
    assertAccess(actor);
    await ensureSchema();
    await ensureDefaultCategories(actor.collegeId);
    await ensureDefaultFatigueRules(actor.collegeId);
    let q = db('alumni_engagement_programs').where({ college_id: actor.collegeId });
    if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where({ scope: 'INSTITUTION' }).orWhere({ department_id: actor.departmentId });
        });
    }
    if (query.status)
        q = q.andWhere({ status: String(query.status) });
    if (query.category)
        q = q.andWhere({ category: String(query.category) });
    if (query.academicYear)
        q = q.andWhere({ academic_year: String(query.academicYear) });
    const rows = await q.orderBy('updated_at', 'desc').limit(200);
    return { programs: rows.map(serializeProgram), categories: ENGAGEMENT_CATEGORIES, channels: listChannelCapabilities() };
}
export async function createProgram(actor, body) {
    assertOperate(actor);
    await ensureSchema();
    const input = programCreateSchema.parse(body);
    let scope = input.scope || 'INSTITUTION';
    let departmentId = input.departmentId ?? null;
    if (isDepartmentScopedEngagement(actor)) {
        scope = 'DEPARTMENT';
        departmentId = actor.departmentId ?? departmentId;
    }
    const [id] = await db('alumni_engagement_programs').insert({
        college_id: actor.collegeId,
        name: input.name,
        objective: input.objective ?? null,
        category: input.category ?? 'OTHER',
        academic_year: input.academicYear ?? null,
        owner_faculty_id: input.ownerFacultyId ?? actor.facultyUserId,
        department_id: departmentId,
        scope,
        start_date: input.startDate ? input.startDate.slice(0, 10) : null,
        end_date: input.endDate ? input.endDate.slice(0, 10) : null,
        status: input.status ?? 'DRAFT',
        target_definition: input.targetDefinition ? JSON.stringify(input.targetDefinition) : null,
        success_definition: input.successDefinition ?? null,
        value_exchange: input.valueExchange ?? 'MUTUAL_VALUE',
        value_to_alumni: input.valueToAlumni ?? null,
        value_to_institution: input.valueToInstitution ?? null,
        created_by_faculty_id: actor.facultyUserId,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_PROGRAM_CREATE',
        entityType: 'alumni_engagement_programs',
        entityId: Number(id),
        metadata: { name: input.name },
    });
    const row = await db('alumni_engagement_programs').where({ id }).first();
    return { program: serializeProgram(row) };
}
export async function patchProgram(actor, programId, body) {
    assertOperate(actor);
    const row = await db('alumni_engagement_programs').where({ id: programId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Program not found');
    if (isDepartmentScopedEngagement(actor) && row.department_id && Number(row.department_id) !== actor.departmentId) {
        throw new AppError(403, 'Program out of department scope');
    }
    const input = programPatchSchema.parse(body);
    const patch = { updated_at: db.fn.now() };
    if (input.name != null)
        patch.name = input.name;
    if (input.objective !== undefined)
        patch.objective = input.objective;
    if (input.category)
        patch.category = input.category;
    if (input.academicYear !== undefined)
        patch.academic_year = input.academicYear;
    if (input.ownerFacultyId !== undefined)
        patch.owner_faculty_id = input.ownerFacultyId;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.scope)
        patch.scope = input.scope;
    if (input.startDate !== undefined)
        patch.start_date = input.startDate ? input.startDate.slice(0, 10) : null;
    if (input.endDate !== undefined)
        patch.end_date = input.endDate ? input.endDate.slice(0, 10) : null;
    if (input.status)
        patch.status = input.status;
    if (input.targetDefinition !== undefined) {
        patch.target_definition = input.targetDefinition ? JSON.stringify(input.targetDefinition) : null;
    }
    if (input.successDefinition !== undefined)
        patch.success_definition = input.successDefinition;
    if (input.valueExchange)
        patch.value_exchange = input.valueExchange;
    if (input.valueToAlumni !== undefined)
        patch.value_to_alumni = input.valueToAlumni;
    if (input.valueToInstitution !== undefined)
        patch.value_to_institution = input.valueToInstitution;
    await db('alumni_engagement_programs').where({ id: programId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_PROGRAM_UPDATE',
        entityType: 'alumni_engagement_programs',
        entityId: programId,
        metadata: input,
    });
    return { program: serializeProgram(await db('alumni_engagement_programs').where({ id: programId }).first()) };
}
export async function getProgram(actor, programId) {
    assertAccess(actor);
    const row = await db('alumni_engagement_programs').where({ id: programId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Program not found');
    const campaigns = await db('alumni_engagement_campaigns')
        .where({ college_id: actor.collegeId, program_id: programId })
        .orderBy('updated_at', 'desc');
    return { program: serializeProgram(row), campaigns: campaigns.map(serializeCampaign) };
}
// ── Templates ─────────────────────────────────────────────────────────────
export async function listTemplates(actor) {
    assertAccess(actor);
    await ensureSchema();
    const rows = await db('alumni_engagement_templates')
        .where({ college_id: actor.collegeId, is_active: true })
        .orderBy('updated_at', 'desc')
        .limit(200);
    return { templates: rows.map(serializeTemplate), safeVariables: [...SAFE_TEMPLATE_VARS] };
}
export async function createTemplate(actor, body) {
    assertOperate(actor);
    if (!canManageTemplates(actor))
        throw new AppError(403, 'Cannot manage templates');
    const input = templateCreateSchema.parse(body);
    previewTemplate(input.body, input.subject); // validate
    const [id] = await db('alumni_engagement_templates').insert({
        college_id: actor.collegeId,
        name: input.name,
        category: input.category ?? 'OTHER',
        channel: input.channel ?? 'MANUAL',
        subject: input.subject ?? null,
        body: input.body,
        is_active: true,
        created_by_faculty_id: actor.facultyUserId,
    });
    return { template: serializeTemplate(await db('alumni_engagement_templates').where({ id }).first()) };
}
export async function patchTemplate(actor, templateId, body) {
    assertOperate(actor);
    if (!canManageTemplates(actor))
        throw new AppError(403, 'Cannot manage templates');
    const row = await db('alumni_engagement_templates').where({ id: templateId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Template not found');
    const input = templatePatchSchema.parse(body);
    if (input.body || input.subject) {
        previewTemplate(input.body ?? row.body, input.subject !== undefined ? input.subject : row.subject);
    }
    const patch = { updated_at: db.fn.now() };
    if (input.name != null)
        patch.name = input.name;
    if (input.category)
        patch.category = input.category;
    if (input.channel)
        patch.channel = input.channel;
    if (input.subject !== undefined)
        patch.subject = input.subject;
    if (input.body != null)
        patch.body = input.body;
    await db('alumni_engagement_templates').where({ id: templateId }).update(patch);
    return { template: serializeTemplate(await db('alumni_engagement_templates').where({ id: templateId }).first()) };
}
export async function previewTemplateById(actor, templateId, sample) {
    assertAccess(actor);
    const row = await db('alumni_engagement_templates').where({ id: templateId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Template not found');
    return previewTemplate(row.body, row.subject, sample);
}
// ── Audience resolution ───────────────────────────────────────────────────
export async function resolveAudienceIds(actor, source) {
    const parsed = audienceSourceSchema.parse(source);
    switch (parsed.type) {
        case 'EXPLICIT_IDS':
            return [...new Set((parsed.alumniProfileIds || []).map(Number))];
        case 'SAVED_SEGMENT': {
            if (!parsed.savedSegmentId)
                throw new AppError(400, 'savedSegmentId required');
            const result = await segments.evaluateSavedSegment(actor, parsed.savedSegmentId, { limit: 200, offset: 0 });
            return result.results.map((m) => Number(m.alumniProfileId ?? m.id));
        }
        case 'DYNAMIC_RULES': {
            const result = await segments.evaluateRules(actor, {
                ruleDefinition: parsed.ruleDefinition,
                preset: parsed.preset,
                dimension: parsed.dimension,
                limit: 200,
                offset: 0,
            });
            return result.results.map((m) => Number(m.alumniProfileId ?? m.id));
        }
        case 'FILTERS': {
            let q = db('alumni_profiles')
                .where({ college_id: actor.collegeId, is_active: true, verification_state: 'VERIFIED' })
                .select('id');
            if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
                q = q.andWhere({ historical_department_id: actor.departmentId });
            }
            const f = parsed.filters || {};
            if (f.graduationYear)
                q = q.andWhere({ graduation_year: f.graduationYear });
            if (f.graduationYearMin)
                q = q.andWhere('graduation_year', '>=', f.graduationYearMin);
            if (f.graduationYearMax)
                q = q.andWhere('graduation_year', '<=', f.graduationYearMax);
            if (f.departmentId)
                q = q.andWhere({ historical_department_id: f.departmentId });
            if (f.programmeId)
                q = q.andWhere({ historical_program_id: f.programmeId });
            if (f.batchLabel)
                q = q.andWhere({ batch_label: f.batchLabel });
            const rows = await q.limit(500);
            return rows.map((r) => Number(r.id));
        }
        case 'EVENT_PARTICIPANTS': {
            if (!parsed.eventId)
                throw new AppError(400, 'eventId required');
            const rows = await db('alumni_event_registrations as r')
                .join('alumni_events as e', 'e.id', 'r.event_id')
                .where('e.college_id', actor.collegeId)
                .where('r.event_id', parsed.eventId)
                .select('r.alumni_profile_id');
            return rows.map((r) => Number(r.alumni_profile_id));
        }
        case 'RELATIONSHIP_CONTEXT': {
            if (!parsed.opportunityId)
                throw new AppError(400, 'opportunityId required');
            const opp = await db('alumni_crm_opportunities')
                .where({ id: parsed.opportunityId, college_id: actor.collegeId })
                .first();
            if (!opp)
                throw new AppError(404, 'Opportunity not found');
            return [Number(opp.alumni_profile_id)];
        }
        default:
            throw new AppError(400, 'Unknown audience source type');
    }
}
export async function snapshotCampaignAudience(actor, campaignId) {
    assertOperate(actor);
    const campaign = await db('alumni_engagement_campaigns').where({ id: campaignId, college_id: actor.collegeId }).first();
    if (!campaign)
        throw new AppError(404, 'Campaign not found');
    const program = await db('alumni_engagement_programs').where({ id: campaign.program_id }).first();
    if (!program)
        throw new AppError(404, 'Program not found');
    const source = parseJson(campaign.audience_source, null);
    if (!source)
        throw new AppError(400, 'Campaign has no audience source');
    const ids = await resolveAudienceIds(actor, source);
    const eligibility = await evaluateEligibilityBatch({
        actor,
        alumniProfileIds: ids,
        category: program.category,
        channel: campaign.channel,
        excludeCampaignId: campaignId,
    });
    await db('alumni_engagement_recipients').where({ campaign_id: campaignId }).del();
    const rows = eligibility.map((e) => ({
        college_id: actor.collegeId,
        campaign_id: campaignId,
        alumni_profile_id: e.alumniProfileId,
        eligibility: e.eligibility,
        eligibility_reasons: JSON.stringify(e.reasons),
        funnel_stage: e.eligibility === 'ELIGIBLE' ? 'ELIGIBLE' : 'TARGETED',
        contact_status: 'NOT_CONTACTED',
    }));
    if (rows.length) {
        // chunk inserts
        for (let i = 0; i < rows.length; i += 100) {
            await db('alumni_engagement_recipients').insert(rows.slice(i, i + 100));
        }
    }
    await db('alumni_engagement_campaigns').where({ id: campaignId }).update({
        audience_snapshotted_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_AUDIENCE_SNAPSHOT',
        entityType: 'alumni_engagement_campaigns',
        entityId: campaignId,
        metadata: {
            targeted: ids.length,
            eligible: eligibility.filter((e) => e.eligibility === 'ELIGIBLE').length,
            suppressed: eligibility.filter((e) => e.eligibility === 'SUPPRESSED').length,
            requiresReview: eligibility.filter((e) => e.eligibility === 'REQUIRES_REVIEW').length,
        },
    });
    return summarizeRecipients(actor.collegeId, campaignId);
}
async function summarizeRecipients(collegeId, campaignId) {
    const rows = await db('alumni_engagement_recipients').where({ college_id: collegeId, campaign_id: campaignId });
    const counts = {
        targeted: rows.length,
        eligible: 0,
        suppressed: 0,
        requiresReview: 0,
        notContacted: 0,
        contacted: 0,
        responded: 0,
        interested: 0,
        declined: 0,
        noResponse: 0,
        followUps: 0,
        opportunities: 0,
    };
    for (const r of rows) {
        if (r.eligibility === 'ELIGIBLE')
            counts.eligible++;
        if (r.eligibility === 'SUPPRESSED')
            counts.suppressed++;
        if (r.eligibility === 'REQUIRES_REVIEW')
            counts.requiresReview++;
        if (r.contact_status === 'NOT_CONTACTED')
            counts.notContacted++;
        if (['CONTACTED', 'NO_RESPONSE', 'RESPONDED', 'INTERESTED', 'DECLINED', 'FOLLOW_UP', 'WRONG_CONTACT'].includes(r.contact_status)) {
            counts.contacted++;
        }
        if (r.contact_status === 'RESPONDED' || r.contact_status === 'INTERESTED' || r.contact_status === 'DECLINED')
            counts.responded++;
        if (r.contact_status === 'INTERESTED')
            counts.interested++;
        if (r.contact_status === 'DECLINED')
            counts.declined++;
        if (r.contact_status === 'NO_RESPONSE')
            counts.noResponse++;
        if (r.crm_followup_id)
            counts.followUps++;
        if (r.crm_opportunity_id)
            counts.opportunities++;
    }
    return { counts, recipients: rows.map(serializeRecipient) };
}
function serializeRecipient(row) {
    return {
        id: Number(row.id),
        campaignId: Number(row.campaign_id),
        alumniProfileId: Number(row.alumni_profile_id),
        eligibility: row.eligibility,
        reasons: parseJson(row.eligibility_reasons, []),
        funnelStage: row.funnel_stage,
        contactStatus: row.contact_status,
        responseStatus: row.response_status,
        suppressionOverridden: Boolean(row.suppression_overridden),
        overrideReason: row.override_reason,
        crmInteractionId: row.crm_interaction_id != null ? Number(row.crm_interaction_id) : null,
        crmOpportunityId: row.crm_opportunity_id != null ? Number(row.crm_opportunity_id) : null,
        crmFollowupId: row.crm_followup_id != null ? Number(row.crm_followup_id) : null,
        contactedAt: row.contacted_at,
        respondedAt: row.responded_at,
    };
}
// ── Campaigns ─────────────────────────────────────────────────────────────
export async function listCampaigns(actor, query = {}) {
    assertAccess(actor);
    await ensureSchema();
    let q = db('alumni_engagement_campaigns as c')
        .leftJoin('alumni_engagement_programs as p', 'p.id', 'c.program_id')
        .where('c.college_id', actor.collegeId)
        .select('c.*', 'p.name as program_name', 'p.category as program_category');
    if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.whereNull('c.department_id').orWhere('c.department_id', actor.departmentId);
        });
    }
    if (query.status)
        q = q.andWhere('c.status', String(query.status));
    if (query.programId)
        q = q.andWhere('c.program_id', Number(query.programId));
    const rows = await q.orderBy('c.updated_at', 'desc').limit(200);
    return {
        campaigns: rows.map((r) => ({
            ...serializeCampaign(r),
            programName: r.program_name,
            programCategory: r.program_category,
        })),
    };
}
export async function createCampaign(actor, body) {
    assertOperate(actor);
    await ensureSchema();
    const input = campaignCreateSchema.parse(body);
    const program = await db('alumni_engagement_programs')
        .where({ id: input.programId, college_id: actor.collegeId })
        .first();
    if (!program)
        throw new AppError(404, 'Program not found');
    const channel = (input.channel ?? 'MANUAL');
    const cap = getChannelCapability(channel);
    if (cap.capability === 'UNAVAILABLE') {
        throw new AppError(400, `Channel ${channel} is UNAVAILABLE: ${cap.reason}. Use MANUAL, PHONE, or IN_PERSON.`);
    }
    // Never auto-send
    const status = input.status && input.status !== 'IN_PROGRESS' ? input.status : 'DRAFT';
    const [id] = await db('alumni_engagement_campaigns').insert({
        college_id: actor.collegeId,
        program_id: input.programId,
        name: input.name,
        purpose: input.purpose ?? null,
        channel,
        template_id: input.templateId ?? null,
        audience_source: JSON.stringify(input.audienceSource),
        scheduled_at: input.scheduledAt ? new Date(input.scheduledAt) : null,
        owner_faculty_id: input.ownerFacultyId ?? actor.facultyUserId,
        department_id: input.departmentId ?? program.department_id ?? actor.departmentId ?? null,
        status,
        requires_approval: input.requiresApproval !== false,
        approval_complete: false,
        created_by_faculty_id: actor.facultyUserId,
    });
    if (input.requiresApproval !== false) {
        const steps = approvalStepsForCampaign({
            scope: program.scope,
            departmentId: input.departmentId ?? program.department_id,
        });
        for (const step of steps) {
            await db('alumni_engagement_approvals').insert({
                college_id: actor.collegeId,
                campaign_id: id,
                step,
                decision: 'PENDING',
            });
        }
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_CAMPAIGN_CREATE',
        entityType: 'alumni_engagement_campaigns',
        entityId: Number(id),
        metadata: { name: input.name, channel, capability: cap.capability },
    });
    return { campaign: serializeCampaign(await db('alumni_engagement_campaigns').where({ id }).first()) };
}
export async function patchCampaign(actor, campaignId, body) {
    assertOperate(actor);
    const row = await db('alumni_engagement_campaigns').where({ id: campaignId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Campaign not found');
    const input = campaignPatchSchema.parse(body);
    if (input.channel) {
        const cap = getChannelCapability(input.channel);
        if (cap.capability === 'UNAVAILABLE') {
            throw new AppError(400, `Channel ${input.channel} is UNAVAILABLE`);
        }
    }
    // Block auto-jump to IN_PROGRESS without approval when required
    if (input.status === 'IN_PROGRESS' || input.status === 'SCHEDULED') {
        if (row.requires_approval && !row.approval_complete) {
            throw new AppError(400, 'Campaign requires approval before scheduling/execution');
        }
    }
    if (input.status === 'APPROVED' && row.requires_approval && !row.approval_complete) {
        throw new AppError(400, 'Use approval workflow to approve');
    }
    const patch = { updated_at: db.fn.now() };
    if (input.name != null)
        patch.name = input.name;
    if (input.purpose !== undefined)
        patch.purpose = input.purpose;
    if (input.channel)
        patch.channel = input.channel;
    if (input.templateId !== undefined)
        patch.template_id = input.templateId;
    if (input.audienceSource)
        patch.audience_source = JSON.stringify(input.audienceSource);
    if (input.scheduledAt !== undefined)
        patch.scheduled_at = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (input.ownerFacultyId !== undefined)
        patch.owner_faculty_id = input.ownerFacultyId;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.status)
        patch.status = input.status;
    if (input.requiresApproval != null)
        patch.requires_approval = input.requiresApproval;
    await db('alumni_engagement_campaigns').where({ id: campaignId }).update(patch);
    return { campaign: serializeCampaign(await db('alumni_engagement_campaigns').where({ id: campaignId }).first()) };
}
export async function getCampaignDetail(actor, campaignId) {
    assertAccess(actor);
    const row = await db('alumni_engagement_campaigns').where({ id: campaignId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Campaign not found');
    const program = await db('alumni_engagement_programs').where({ id: row.program_id }).first();
    const approvals = await db('alumni_engagement_approvals')
        .where({ campaign_id: campaignId, college_id: actor.collegeId })
        .orderBy('id', 'asc');
    const summary = await summarizeRecipients(actor.collegeId, campaignId);
    let templatePreview = null;
    if (row.template_id) {
        const tpl = await db('alumni_engagement_templates').where({ id: row.template_id }).first();
        if (tpl)
            templatePreview = previewTemplate(tpl.body, tpl.subject);
    }
    const prepared = getAdapter(row.channel).prepare({
        subject: templatePreview?.subject,
        body: templatePreview?.body || row.purpose || '',
    });
    return {
        campaign: serializeCampaign(row),
        program: program ? serializeProgram(program) : null,
        approvals: approvals.map((a) => ({
            id: Number(a.id),
            step: a.step,
            decision: a.decision,
            notes: a.notes,
            actedByFacultyId: a.acted_by_faculty_id != null ? Number(a.acted_by_faculty_id) : null,
            actedAt: a.acted_at,
        })),
        funnel: summary.counts,
        recipients: summary.recipients,
        prepareOnly: prepared,
        note: 'No delivery/open/read telemetry — channels are MANUAL_ONLY or UNAVAILABLE.',
    };
}
export async function decideApproval(actor, campaignId, body) {
    assertOperate(actor);
    const input = approvalDecisionSchema.parse(body);
    const campaign = await db('alumni_engagement_campaigns').where({ id: campaignId, college_id: actor.collegeId }).first();
    if (!campaign)
        throw new AppError(404, 'Campaign not found');
    const program = await db('alumni_engagement_programs').where({ id: campaign.program_id }).first();
    let pending = await db('alumni_engagement_approvals')
        .where({ campaign_id: campaignId, college_id: actor.collegeId, decision: 'PENDING' })
        .orderBy('id', 'asc')
        .first();
    if (input.step) {
        pending = await db('alumni_engagement_approvals')
            .where({ campaign_id: campaignId, college_id: actor.collegeId, step: input.step, decision: 'PENDING' })
            .first();
    }
    if (!pending)
        throw new AppError(400, 'No pending approval step');
    if (pending.step === 'HOD_REVIEW' && !canApproveDepartmentCampaign(actor)) {
        throw new AppError(403, 'Cannot approve department campaign step');
    }
    if (['ALUMNI_TP_REVIEW', 'INSTITUTIONAL'].includes(pending.step) && !canApproveInstitutionalCampaign(actor)) {
        throw new AppError(403, 'Cannot approve institutional campaign step');
    }
    await db('alumni_engagement_approvals').where({ id: pending.id }).update({
        decision: input.decision,
        notes: input.notes ?? null,
        acted_by_faculty_id: actor.facultyUserId,
        acted_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    if (input.decision === 'REJECTED') {
        await db('alumni_engagement_campaigns').where({ id: campaignId }).update({
            status: 'CANCELLED',
            approval_complete: false,
            updated_at: db.fn.now(),
        });
    }
    else {
        const stillPending = await db('alumni_engagement_approvals')
            .where({ campaign_id: campaignId, decision: 'PENDING' })
            .first();
        if (!stillPending) {
            await db('alumni_engagement_campaigns').where({ id: campaignId }).update({
                status: 'APPROVED',
                approval_complete: true,
                updated_at: db.fn.now(),
            });
        }
        else if (campaign.status === 'DRAFT') {
            await db('alumni_engagement_campaigns').where({ id: campaignId }).update({
                status: 'READY_FOR_REVIEW',
                updated_at: db.fn.now(),
            });
        }
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_CAMPAIGN_APPROVAL',
        entityType: 'alumni_engagement_campaigns',
        entityId: campaignId,
        metadata: { step: pending.step, decision: input.decision, programId: program?.id },
    });
    return getCampaignDetail(actor, campaignId);
}
export async function overrideSuppression(actor, recipientId, body) {
    assertOperate(actor);
    if (!canOverrideSuppression(actor))
        throw new AppError(403, 'Cannot override suppression');
    const input = suppressOverrideSchema.parse(body);
    const row = await db('alumni_engagement_recipients').where({ id: recipientId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Recipient not found');
    await db('alumni_engagement_recipients').where({ id: recipientId }).update({
        eligibility: 'ELIGIBLE',
        funnel_stage: 'ELIGIBLE',
        suppression_overridden: true,
        override_reason: input.reason,
        override_by_faculty_id: actor.facultyUserId,
        override_at: db.fn.now(),
        eligibility_reasons: JSON.stringify([
            ...parseJson(row.eligibility_reasons, []),
            `OVERRIDE: ${input.reason}`,
        ]),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_SUPPRESSION_OVERRIDE',
        entityType: 'alumni_engagement_recipients',
        entityId: recipientId,
        metadata: { reason: input.reason, alumniProfileId: row.alumni_profile_id, campaignId: row.campaign_id },
    });
    return { recipient: serializeRecipient(await db('alumni_engagement_recipients').where({ id: recipientId }).first()) };
}
/** Manual execution — first-class workflow (C4.17). */
export async function executeManualOutreach(actor, recipientId, body) {
    assertOperate(actor);
    const input = manualExecutionSchema.parse(body);
    const recipient = await db('alumni_engagement_recipients').where({ id: recipientId, college_id: actor.collegeId }).first();
    if (!recipient)
        throw new AppError(404, 'Recipient not found');
    if (recipient.eligibility === 'SUPPRESSED' && !recipient.suppression_overridden) {
        throw new AppError(400, 'Recipient is suppressed — override with reason first');
    }
    const campaign = await db('alumni_engagement_campaigns').where({ id: recipient.campaign_id }).first();
    const program = await db('alumni_engagement_programs').where({ id: campaign.program_id }).first();
    const outcomeMap = {
        NO_ANSWER: { contactStatus: 'NO_RESPONSE', funnel: 'CONTACTED', crmOutcome: 'NO_RESPONSE' },
        RESPONDED: { contactStatus: 'RESPONDED', funnel: 'RESPONDED', crmOutcome: 'RESPONDED' },
        INTERESTED: { contactStatus: 'INTERESTED', funnel: 'INTERESTED', crmOutcome: 'RESPONDED', interested: true },
        NOT_INTERESTED: { contactStatus: 'DECLINED', funnel: 'RESPONDED', crmOutcome: 'DECLINED' },
        FOLLOW_UP: { contactStatus: 'FOLLOW_UP', funnel: 'CONTACTED', crmOutcome: 'FOLLOW_UP' },
        WRONG_CONTACT: { contactStatus: 'WRONG_CONTACT', funnel: 'CONTACTED', crmOutcome: 'WRONG_CONTACT' },
    };
    const mapped = outcomeMap[input.outcome];
    const interactionType = campaign.channel === 'EMAIL'
        ? 'EMAIL'
        : campaign.channel === 'WHATSAPP'
            ? 'WHATSAPP'
            : campaign.channel === 'SMS'
                ? 'SMS'
                : campaign.channel === 'IN_PERSON'
                    ? 'IN_PERSON'
                    : 'PHONE_CALL';
    const interaction = await crm.createInteraction(actor, Number(recipient.alumni_profile_id), {
        interactionType,
        channel: campaign.channel,
        direction: 'OUTBOUND',
        purpose: campaign.purpose || program?.name || campaign.name,
        summary: input.summary || `Manual outreach: ${input.outcome}`,
        outcomeStatus: mapped.crmOutcome,
        occurredAt: new Date().toISOString(),
        followUpRequired: input.followUpRequired || input.outcome === 'FOLLOW_UP',
        nextActionAt: input.nextActionAt,
        nextActionSummary: input.nextActionSummary,
        isContactAttempt: true,
        isMeaningfulEngagement: mapped.interested || input.outcome === 'RESPONDED',
        captureMode: 'MANUAL',
        evidenceReference: `engagement:campaign:${campaign.id}:recipient:${recipient.id}`,
    });
    const interactionId = interaction.interaction.id;
    let followupId = null;
    if (input.followUpRequired || input.outcome === 'FOLLOW_UP') {
        const due = (input.nextActionAt || new Date(Date.now() + 7 * 86400000).toISOString()).slice(0, 10);
        const fu = await crm.createFollowup(actor, Number(recipient.alumni_profile_id), {
            reason: input.nextActionSummary || `Follow-up from campaign ${campaign.name}`,
            dueDate: due,
            interactionId,
        });
        followupId = fu.followup.id;
    }
    let opportunityId = null;
    if (input.createOpportunity || mapped.interested) {
        const oppType = input.opportunityType || mapCategoryToOppType(program?.category);
        const opp = await crm.createOpportunity(actor, Number(recipient.alumni_profile_id), {
            opportunityType: oppType,
            title: input.opportunityTitle || `${program?.name || campaign.name} — interest`,
            description: input.summary || null,
            sourceInteractionId: interactionId,
            status: 'IDENTIFIED',
        });
        opportunityId = opp.opportunity.id;
    }
    let funnel = mapped.funnel;
    if (opportunityId)
        funnel = 'OPPORTUNITY_CREATED';
    await db('alumni_engagement_recipients').where({ id: recipientId }).update({
        contact_status: mapped.contactStatus,
        response_status: mapped.contactStatus,
        funnel_stage: funnel,
        crm_interaction_id: interactionId,
        crm_followup_id: followupId,
        crm_opportunity_id: opportunityId,
        contacted_at: db.fn.now(),
        responded_at: ['RESPONDED', 'INTERESTED', 'DECLINED'].includes(mapped.contactStatus) ? db.fn.now() : null,
        updated_at: db.fn.now(),
    });
    if (campaign.status === 'APPROVED' || campaign.status === 'SCHEDULED') {
        await db('alumni_engagement_campaigns').where({ id: campaign.id }).update({
            status: 'IN_PROGRESS',
            updated_at: db.fn.now(),
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_MANUAL_EXECUTION',
        entityType: 'alumni_engagement_recipients',
        entityId: recipientId,
        metadata: { outcome: input.outcome, campaignId: campaign.id },
    });
    return {
        recipient: serializeRecipient(await db('alumni_engagement_recipients').where({ id: recipientId }).first()),
        interaction,
        followupId,
        opportunityId,
    };
}
function mapCategoryToOppType(category) {
    const map = {
        MENTORSHIP: 'MENTORSHIP',
        RECRUITMENT: 'RECRUITMENT',
        INTERNSHIP: 'INTERNSHIP',
        EXPERT_SESSION: 'EXPERT_SESSION',
        RESEARCH: 'RESEARCH_COLLABORATION',
        ENTREPRENEURSHIP: 'STARTUP_SUPPORT',
        INDUSTRY_CONNECT: 'INDUSTRY_PROJECT',
        CONTRIBUTION: 'CONTRIBUTION',
    };
    return map[category || ''] || 'OTHER';
}
export async function listManualOutreachQueue(actor, query = {}) {
    assertAccess(actor);
    let q = db('alumni_engagement_recipients as r')
        .join('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
        .join('alumni_engagement_programs as p', 'p.id', 'c.program_id')
        .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
        .leftJoin('alumni_relationships as rel', function () {
        this.on('rel.alumni_profile_id', '=', 'r.alumni_profile_id').andOn('rel.college_id', '=', 'r.college_id');
    })
        .where('r.college_id', actor.collegeId)
        .whereIn('r.eligibility', ['ELIGIBLE', 'REQUIRES_REVIEW'])
        .where('r.contact_status', 'NOT_CONTACTED')
        .whereIn('c.status', ['APPROVED', 'SCHEDULED', 'IN_PROGRESS'])
        .select('r.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn', 'ap.email as alumni_email', 'c.name as campaign_name', 'c.channel', 'c.purpose as campaign_purpose', 'p.name as program_name', 'p.category', 'rel.last_contact_at');
    if (query.campaignId)
        q = q.andWhere('r.campaign_id', Number(query.campaignId));
    if (isDepartmentScopedEngagement(actor) && actor.departmentId != null) {
        q = q.andWhere('ap.historical_department_id', actor.departmentId);
    }
    const rows = await q.orderBy('r.id', 'asc').limit(100);
    return {
        items: rows.map((r) => ({
            recipientId: Number(r.id),
            alumniProfileId: Number(r.alumni_profile_id),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
            channel: r.channel,
            purpose: r.campaign_purpose || r.program_name,
            campaignName: r.campaign_name,
            programName: r.program_name,
            category: r.category,
            eligibility: r.eligibility,
            reasons: parseJson(r.eligibility_reasons, []),
            lastContactAt: r.last_contact_at,
            lastContactDays: r.last_contact_at
                ? Math.floor((Date.now() - new Date(r.last_contact_at).getTime()) / 86400000)
                : null,
            action: r.channel === 'PHONE' ? 'Call' : r.channel === 'EMAIL' ? 'Email manually' : 'Contact manually',
        })),
        note: 'Manual outreach is the supported execution mode. No auto-send.',
    };
}
// ── Recognition nominations (C4.16 — not full C6) ─────────────────────────
export async function nominateRecognition(actor, body) {
    assertOperate(actor);
    const input = recognitionNomSchema.parse(body);
    const profile = await db('alumni_profiles').where({ id: input.alumniProfileId, college_id: actor.collegeId }).first();
    if (!profile)
        throw new AppError(404, 'Alumni not found');
    const [id] = await db('alumni_engagement_recognition_noms').insert({
        college_id: actor.collegeId,
        alumni_profile_id: input.alumniProfileId,
        program_id: input.programId ?? null,
        campaign_id: input.campaignId ?? null,
        title: input.title,
        rationale: input.rationale ?? null,
        evidence_refs: input.evidenceRefs ? JSON.stringify(input.evidenceRefs) : null,
        status: 'NOMINATED',
        nominated_by_faculty_id: actor.facultyUserId,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'ENGAGEMENT_RECOGNITION_NOMINATE',
        entityType: 'alumni_engagement_recognition_noms',
        entityId: Number(id),
    });
    return { nomination: await db('alumni_engagement_recognition_noms').where({ id }).first() };
}
// ── Fatigue rules ─────────────────────────────────────────────────────────
export async function upsertFatigueRule(actor, body) {
    assertOperate(actor);
    if (!canManageTemplates(actor))
        throw new AppError(403, 'Cannot manage fatigue rules');
    const input = fatigueRuleSchema.parse(body);
    await ensureDefaultFatigueRules(actor.collegeId);
    const existing = await db('alumni_engagement_fatigue_rules')
        .where({ college_id: actor.collegeId, category_code: input.categoryCode })
        .first();
    if (existing) {
        await db('alumni_engagement_fatigue_rules').where({ id: existing.id }).update({
            min_days_between_equivalent: input.minDaysBetweenEquivalent ?? existing.min_days_between_equivalent,
            warn_recent_contact_days: input.warnRecentContactDays ?? existing.warn_recent_contact_days,
            suppress_active_opportunity: input.suppressActiveOpportunity ?? existing.suppress_active_opportunity,
            suppress_open_followup: input.suppressOpenFollowup ?? existing.suppress_open_followup,
            warn_open_followup: input.warnOpenFollowup ?? existing.warn_open_followup,
            is_active: input.isActive ?? true,
            updated_at: db.fn.now(),
        });
        return { rule: await db('alumni_engagement_fatigue_rules').where({ id: existing.id }).first() };
    }
    const [id] = await db('alumni_engagement_fatigue_rules').insert({
        college_id: actor.collegeId,
        category_code: input.categoryCode,
        min_days_between_equivalent: input.minDaysBetweenEquivalent ?? 30,
        warn_recent_contact_days: input.warnRecentContactDays ?? 14,
        suppress_active_opportunity: input.suppressActiveOpportunity ?? true,
        suppress_open_followup: input.suppressOpenFollowup ?? false,
        warn_open_followup: input.warnOpenFollowup ?? true,
        is_active: input.isActive ?? true,
    });
    return { rule: await db('alumni_engagement_fatigue_rules').where({ id }).first() };
}
export async function listFatigueRules(actor) {
    assertAccess(actor);
    await ensureDefaultFatigueRules(actor.collegeId);
    const rows = await db('alumni_engagement_fatigue_rules').where({ college_id: actor.collegeId, is_active: true });
    return { rules: rows };
}
// ── Preference centre (C4.20) ─────────────────────────────────────────────
function asOptIn(value, defaultTrue = true) {
    if (value == null)
        return defaultTrue;
    if (typeof value === 'boolean')
        return value;
    return Number(value) !== 0;
}
export async function getPreferenceCentre(actor) {
    const profile = await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).first();
    if (!profile)
        throw new AppError(404, 'Profile not found');
    return {
        preferences: {
            commEmailOptIn: asOptIn(profile.comm_email_opt_in, true),
            commSmsOptIn: asOptIn(profile.comm_sms_opt_in, false),
            commPhoneOptIn: asOptIn(profile.comm_phone_opt_in, false),
            commWhatsappOptIn: asOptIn(profile.comm_whatsapp_opt_in, false),
            prefEventsOptIn: asOptIn(profile.pref_events_opt_in, true),
            prefMentorshipOptIn: asOptIn(profile.pref_mentorship_opt_in, true),
            prefRecruitmentOptIn: asOptIn(profile.pref_recruitment_opt_in, true),
            prefNetworkingOptIn: asOptIn(profile.pref_networking_opt_in, true),
            prefResearchOptIn: asOptIn(profile.pref_research_opt_in, true),
            prefEntrepreneurshipOptIn: asOptIn(profile.pref_entrepreneurship_opt_in, true),
            prefContributionOptIn: asOptIn(profile.pref_contribution_opt_in, true),
            prefInstitutionUpdatesOptIn: asOptIn(profile.pref_institution_updates_opt_in, true),
            globalCommOptOut: asOptIn(profile.global_comm_opt_out, false),
            globalOptOutAt: profile.global_opt_out_at,
            globalOptOutReason: profile.global_opt_out_reason,
            temporaryUnavailableUntil: profile.temporary_unavailable_until,
            temporaryUnavailableReason: profile.temporary_unavailable_reason,
        },
    };
}
export async function updatePreferenceCentre(actor, body, meta) {
    const input = preferenceCentreSchema.parse(body);
    const before = await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).first();
    if (!before)
        throw new AppError(404, 'Profile not found');
    const map = {
        commEmailOptIn: 'comm_email_opt_in',
        commSmsOptIn: 'comm_sms_opt_in',
        commPhoneOptIn: 'comm_phone_opt_in',
        commWhatsappOptIn: 'comm_whatsapp_opt_in',
        prefEventsOptIn: 'pref_events_opt_in',
        prefMentorshipOptIn: 'pref_mentorship_opt_in',
        prefRecruitmentOptIn: 'pref_recruitment_opt_in',
        prefNetworkingOptIn: 'pref_networking_opt_in',
        prefResearchOptIn: 'pref_research_opt_in',
        prefEntrepreneurshipOptIn: 'pref_entrepreneurship_opt_in',
        prefContributionOptIn: 'pref_contribution_opt_in',
        prefInstitutionUpdatesOptIn: 'pref_institution_updates_opt_in',
        globalCommOptOut: 'global_comm_opt_out',
        globalOptOutReason: 'global_opt_out_reason',
        temporaryUnavailableUntil: 'temporary_unavailable_until',
        temporaryUnavailableReason: 'temporary_unavailable_reason',
    };
    const patch = { updated_at: db.fn.now() };
    for (const [k, col] of Object.entries(map)) {
        if (Object.prototype.hasOwnProperty.call(input, k)) {
            if (!(await db.schema.hasColumn('alumni_profiles', col)))
                continue;
            const val = input[k];
            patch[col] = k === 'temporaryUnavailableUntil' && val ? new Date(val) : val;
        }
    }
    if (input.globalCommOptOut === true) {
        patch.global_opt_out_at = db.fn.now();
    }
    else if (input.globalCommOptOut === false) {
        patch.global_opt_out_at = null;
    }
    await db('alumni_profiles').where({ id: actor.alumniProfileId }).update(patch);
    if (await db.schema.hasTable('alumni_engagement_pref_evidence')) {
        await db('alumni_engagement_pref_evidence').insert({
            college_id: actor.collegeId,
            alumni_profile_id: actor.alumniProfileId,
            change_type: 'PREFERENCE_CENTRE',
            before_snapshot: JSON.stringify(before),
            after_snapshot: JSON.stringify(input),
            source: 'ALUMNI_SELF',
            ip_hint: meta?.ipHint ?? null,
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorType: 'ALUMNI',
        actorAlumniId: actor.alumniProfileId,
        action: 'ENGAGEMENT_PREFERENCE_UPDATE',
        entityType: 'alumni_profiles',
        entityId: actor.alumniProfileId,
        metadata: input,
    });
    return getPreferenceCentre(actor);
}
/** Admin 360 engagement section. */
export async function buildEngagement360Section(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_engagement_recipients'))) {
        return { available: false };
    }
    const recipients = await db('alumni_engagement_recipients as r')
        .join('alumni_engagement_campaigns as c', 'c.id', 'r.campaign_id')
        .join('alumni_engagement_programs as p', 'p.id', 'c.program_id')
        .where('r.college_id', collegeId)
        .where('r.alumni_profile_id', alumniProfileId)
        .select('r.*', 'c.name as campaign_name', 'p.name as program_name', 'p.category', 'c.status as campaign_status')
        .orderBy('r.updated_at', 'desc')
        .limit(50);
    const responses = await db('alumni_engagement_responses')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('created_at', 'desc')
        .limit(30);
    const noms = await db('alumni_engagement_recognition_noms')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('created_at', 'desc')
        .limit(20);
    const profile = await db('alumni_profiles').where({ id: alumniProfileId }).first();
    return {
        available: true,
        programsParticipated: [...new Set(recipients.map((r) => r.program_name))],
        campaignHistory: recipients.map((r) => ({
            campaignName: r.campaign_name,
            programName: r.program_name,
            category: r.category,
            eligibility: r.eligibility,
            contactStatus: r.contact_status,
            funnelStage: r.funnel_stage,
            contactedAt: r.contacted_at,
        })),
        contactPreferences: {
            email: profile?.comm_email_opt_in !== false,
            sms: Boolean(profile?.comm_sms_opt_in),
            phone: Boolean(profile?.comm_phone_opt_in),
            whatsapp: Boolean(profile?.comm_whatsapp_opt_in),
            globalOptOut: Boolean(profile?.global_comm_opt_out),
        },
        responses: responses.map((r) => ({
            actionType: r.action_type,
            choice: r.choice,
            createdAt: r.created_at,
            requiresStaffAction: Boolean(r.requires_staff_action),
        })),
        recentEngagement: recipients.filter((r) => r.contacted_at).slice(0, 10),
        upcomingEngagement: recipients.filter((r) => r.contact_status === 'NOT_CONTACTED' && r.eligibility === 'ELIGIBLE'),
        suppressions: recipients.filter((r) => r.eligibility === 'SUPPRESSED'),
        recognitionNominations: noms.map((n) => ({
            id: Number(n.id),
            title: n.title,
            status: n.status,
            createdAt: n.created_at,
        })),
        opportunitiesGenerated: recipients.filter((r) => r.crm_opportunity_id).length,
    };
}
export { getFatigueRule };
