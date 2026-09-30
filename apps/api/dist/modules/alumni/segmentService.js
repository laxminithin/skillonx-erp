/**
 * Alumni Intelligence — saved segments & dynamic evaluation (C3).
 * Segments store RULES only; membership is always recomputed.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canCreateSavedSegments, canEditInstitutionalSegments, canExportIntelligence, canViewContactDetails, isDepartmentScoped, } from './accessIntelligence.js';
import { assertIntelligenceAccess, buildProfileIntelligence, loadSignalBundlesBatch, } from './intelligenceEngine.js';
import { DIMENSION_WILLINGNESS_KEY, PRESET_SEGMENTS, evaluateAdhocSchema, segmentCreateSchema, segmentPatchSchema, segmentRuleSchema, } from './typesIntelligence.js';
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
function parseRules(raw) {
    if (typeof raw === 'string') {
        try {
            return segmentRuleSchema.parse(JSON.parse(raw));
        }
        catch {
            throw new AppError(400, 'Invalid segment rule definition');
        }
    }
    return segmentRuleSchema.parse(raw);
}
export function serializeSegment(row) {
    return {
        id: Number(row.id),
        name: row.name,
        description: row.description,
        ruleDefinition: parseRules(row.rule_definition),
        scope: row.scope,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        isActive: Boolean(row.is_active),
        isInstitutional: Boolean(row.is_institutional),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function applyProfileSqlFilters(q, actor, filters) {
    if (isDepartmentScoped(actor) && actor.departmentId != null) {
        q = q.where('ap.historical_department_id', actor.departmentId);
    }
    for (const f of filters) {
        const op = f.op || 'eq';
        switch (f.field) {
            case 'graduationYear':
                if (op === 'eq')
                    q = q.where('ap.graduation_year', f.value);
                break;
            case 'graduationYearMin':
                q = q.where('ap.graduation_year', '>=', Number(f.value));
                break;
            case 'graduationYearMax':
                q = q.where('ap.graduation_year', '<=', Number(f.value));
                break;
            case 'programmeId':
                q = q.where('ap.historical_program_id', f.value);
                break;
            case 'departmentId':
                q = q.where('ap.historical_department_id', f.value);
                break;
            case 'city':
            case 'location':
                q = q.where('ap.current_city', 'like', `%${String(f.value)}%`);
                break;
            case 'country':
                q = q.where('ap.current_country', 'like', `%${String(f.value)}%`);
                break;
            case 'verificationState':
                q = q.where('ap.verification_state', f.value);
                break;
            case 'willingnessKey': {
                const key = String(f.value);
                const dbCol = DIMENSION_WILLINGNESS_KEY[key] ||
                    (key.startsWith('open_to_') ? key : null);
                if (dbCol) {
                    const wantTrue = f.op !== 'neq';
                    q = q.where(`ap.${dbCol}`, wantTrue);
                }
                break;
            }
            case 'willingnessValue':
                // handled with willingnessKey in pair — skip lone
                break;
            default:
                break;
        }
    }
    return q;
}
function presetToRule(preset) {
    const map = {
        POTENTIAL_MENTORS: {
            combinator: 'AND',
            filters: [
                { field: 'dimension', value: 'MENTORSHIP' },
                { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] },
                { field: 'willingnessState', op: 'neq', value: 'NOT_WILLING' },
            ],
        },
        POTENTIAL_RECRUITERS: {
            combinator: 'AND',
            filters: [
                { field: 'dimension', value: 'RECRUITMENT' },
                { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] },
                { field: 'willingnessState', op: 'neq', value: 'NOT_WILLING' },
            ],
        },
        INTERNSHIP_ENABLERS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'INTERNSHIP' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        EXPERT_RESOURCE_PERSONS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'EXPERT_SESSION' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        PROJECT_MENTORS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'PROJECT_MENTORING' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        RESEARCH_COLLABORATORS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'RESEARCH_COLLABORATION' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        BOS_CURRICULUM_ADVISORS: {
            combinator: 'OR',
            filters: [
                { field: 'dimension', value: 'BOS_ADVISORY' },
                { field: 'dimension', value: 'CURRICULUM_SUPPORT' },
            ],
        },
        STARTUP_INCUBATION_SUPPORTERS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'STARTUP_SUPPORT' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        INDUSTRY_VISIT_FACILITATORS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'INDUSTRIAL_VISIT' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        INSTITUTIONAL_COLLABORATION_LEADS: {
            combinator: 'AND',
            filters: [{ field: 'dimension', value: 'MOU_COLLABORATION' }, { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] }],
        },
        ACTIVE_CONTRIBUTORS: {
            combinator: 'AND',
            filters: [{ field: 'hasOutcomeType', value: 'NON_FINANCIAL_CONTRIBUTION' }],
        },
        REPEAT_ENGAGERS: {
            combinator: 'AND',
            filters: [{ field: 'relationshipStage', value: 'REPEAT_ENGAGEMENT' }],
        },
        RECENTLY_RECONNECTED: {
            combinator: 'AND',
            filters: [{ field: 'lastInteractionDaysMax', value: 30 }],
        },
        DORMANT_HIGH_CAPABILITY: {
            combinator: 'AND',
            filters: [
                { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE'] },
                { field: 'relationshipReadiness', value: 'NEEDS_REACTIVATION' },
            ],
        },
        NEEDS_DATA_REFRESH: {
            combinator: 'AND',
            filters: [{ field: 'freshnessState', value: 'STALE' }],
        },
    };
    return map[preset];
}
function matchFilter(filter, bundle, intel) {
    const op = filter.op || 'eq';
    const val = filter.value;
    const dims = intel.dimensions;
    const dimFilter = (predicate) => {
        // If a dimension field is also present in sibling filters, evaluation is at rule level.
        return dims.some(predicate);
    };
    switch (filter.field) {
        case 'industry': {
            const hit = bundle.employment.some((e) => String(e.industry || '').toLowerCase().includes(String(val).toLowerCase()));
            return op === 'neq' ? !hit : hit;
        }
        case 'company': {
            const hit = bundle.employment.some((e) => String(e.organization || '').toLowerCase().includes(String(val).toLowerCase()));
            return op === 'neq' ? !hit : hit;
        }
        case 'designation': {
            const hit = bundle.employment.some((e) => String(e.designation || '').toLowerCase().includes(String(val).toLowerCase()));
            return op === 'neq' ? !hit : hit;
        }
        case 'seniority':
        case 'careerLevel': {
            const hit = bundle.employment.some((e) => String(e.seniority || '').toLowerCase().includes(String(val).toLowerCase()));
            return op === 'neq' ? !hit : hit;
        }
        case 'isEntrepreneur':
            return Boolean(bundle.entrepreneurship.length) === Boolean(val);
        case 'capabilityDomain':
            return bundle.capabilities.some((c) => String(c.capability_domain) === String(val));
        case 'relationshipStage':
            return String(bundle.relationship?.relationship_stage || '') === String(val);
        case 'lastInteractionDaysMin': {
            const last = bundle.relationship?.last_contact_at;
            if (!last)
                return true;
            const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
            return days >= Number(val);
        }
        case 'lastInteractionDaysMax': {
            const last = bundle.relationship?.last_contact_at;
            if (!last)
                return false;
            const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
            return days <= Number(val);
        }
        case 'lastEngagementDaysMin': {
            const last = bundle.relationship?.last_engagement_at;
            if (!last)
                return true;
            const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
            return days >= Number(val);
        }
        case 'lastEngagementDaysMax': {
            const last = bundle.relationship?.last_engagement_at;
            if (!last)
                return false;
            const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
            return days <= Number(val);
        }
        case 'hasOpportunityType':
            return bundle.opportunities.some((o) => String(o.opportunity_type) === String(val));
        case 'hasOutcomeType':
            return bundle.outcomes.some((o) => String(o.outcome_type) === String(val));
        case 'hasMentoringHistory':
            return bundle.mentoringCount > 0 || bundle.outcomes.some((o) => o.outcome_type === 'STUDENTS_MENTORED');
        case 'hasRecruitmentHistory':
            return bundle.outcomes.some((o) => ['PLACEMENTS_SUPPORTED', 'JOBS_REFERRED'].includes(String(o.outcome_type)));
        case 'freshnessDomain':
            return bundle.freshness.some((f) => f.domain === String(val));
        case 'freshnessState':
            return bundle.freshness.some((f) => f.state === String(val));
        case 'dimension': {
            const d = dims.find((x) => x.dimension === String(val));
            return Boolean(d && d.qualifies);
        }
        case 'evidenceState': {
            if (op === 'in' && Array.isArray(val)) {
                return dimFilter((d) => val.includes(d.evidenceState));
            }
            return dimFilter((d) => d.evidenceState === String(val));
        }
        case 'willingnessState': {
            if (op === 'neq')
                return dimFilter((d) => d.willingnessState !== String(val));
            if (op === 'in' && Array.isArray(val))
                return dimFilter((d) => val.includes(d.willingnessState));
            return dimFilter((d) => d.willingnessState === String(val));
        }
        case 'relationshipReadiness':
            return dimFilter((d) => d.relationshipReadiness === String(val));
        case 'capabilityIntentCell':
            return dimFilter((d) => d.capabilityIntentCell === String(val));
        case 'preset':
            return true; // expanded earlier
        case 'graduationYear':
        case 'graduationYearMin':
        case 'graduationYearMax':
        case 'programmeId':
        case 'departmentId':
        case 'location':
        case 'city':
        case 'country':
        case 'verificationState':
        case 'willingnessKey':
        case 'willingnessValue':
        case 'completenessMin':
            return true; // SQL-prefiltered
        default:
            return true;
    }
}
function matchesRule(rule, bundle, intel) {
    // Dimension-scoped evaluation: when filters include a dimension + evidence/willingness,
    // require the SAME dimension row to satisfy those predicates.
    const dimensionFilters = rule.filters.filter((f) => f.field === 'dimension');
    const postFilters = rule.filters.filter((f) => !['graduationYear', 'graduationYearMin', 'graduationYearMax', 'programmeId', 'departmentId', 'location', 'city', 'country', 'verificationState', 'willingnessKey', 'willingnessValue', 'completenessMin', 'preset'].includes(f.field));
    if (dimensionFilters.length && rule.combinator === 'AND') {
        const targetDims = dimensionFilters.map((f) => String(f.value));
        return targetDims.some((dim) => {
            const row = intel.dimensions.find((d) => d.dimension === dim);
            if (!row || !row.qualifies)
                return false;
            return postFilters.every((f) => {
                if (f.field === 'dimension')
                    return true;
                if (f.field === 'evidenceState') {
                    if (f.op === 'in' && Array.isArray(f.value))
                        return f.value.includes(row.evidenceState);
                    return row.evidenceState === String(f.value);
                }
                if (f.field === 'willingnessState') {
                    if (f.op === 'neq')
                        return row.willingnessState !== String(f.value);
                    if (f.op === 'in' && Array.isArray(f.value))
                        return f.value.includes(row.willingnessState);
                    return row.willingnessState === String(f.value);
                }
                if (f.field === 'relationshipReadiness')
                    return row.relationshipReadiness === String(f.value);
                if (f.field === 'capabilityIntentCell')
                    return row.capabilityIntentCell === String(f.value);
                return matchFilter(f, bundle, intel);
            });
        });
    }
    const results = postFilters.map((f) => matchFilter(f, bundle, intel));
    if (!results.length)
        return true;
    return rule.combinator === 'OR' ? results.some(Boolean) : results.every(Boolean);
}
export async function listSegments(actor) {
    assertIntelligenceAccess(actor);
    if (!(await db.schema.hasTable('alumni_intelligence_segments'))) {
        return { segments: [], presets: PRESET_SEGMENTS };
    }
    let q = db('alumni_intelligence_segments').where({ college_id: actor.collegeId, is_active: true });
    if (isDepartmentScoped(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('scope', 'INSTITUTION')
                .orWhere({ scope: 'DEPARTMENT', department_id: actor.departmentId })
                .orWhere({ scope: 'PERSONAL', owner_faculty_id: actor.facultyUserId });
        });
    }
    const rows = await q.orderBy('updated_at', 'desc').limit(200);
    return { segments: rows.map(serializeSegment), presets: PRESET_SEGMENTS };
}
export async function createSegment(actor, body) {
    assertIntelligenceAccess(actor);
    if (!canCreateSavedSegments(actor))
        throw new AppError(403, 'Cannot create saved segments');
    if (!(await db.schema.hasTable('alumni_intelligence_segments'))) {
        throw new AppError(503, 'Alumni intelligence schema not migrated');
    }
    const input = segmentCreateSchema.parse(body);
    if (input.isInstitutional && !canEditInstitutionalSegments(actor)) {
        throw new AppError(403, 'Cannot create institutional segments');
    }
    let scope = input.scope || 'PERSONAL';
    if (input.isInstitutional)
        scope = 'INSTITUTION';
    if (isDepartmentScoped(actor) && scope === 'INSTITUTION') {
        scope = 'DEPARTMENT';
    }
    const [id] = await db('alumni_intelligence_segments').insert({
        college_id: actor.collegeId,
        name: input.name,
        description: input.description ?? null,
        rule_definition: JSON.stringify(input.ruleDefinition),
        scope,
        department_id: input.departmentId ?? actor.departmentId ?? null,
        owner_faculty_id: actor.facultyUserId,
        is_active: true,
        is_institutional: Boolean(input.isInstitutional) && canEditInstitutionalSegments(actor),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'INTELLIGENCE_SEGMENT_CREATE',
        entityType: 'alumni_intelligence_segments',
        entityId: Number(id),
        metadata: { name: input.name, scope },
    });
    const row = await db('alumni_intelligence_segments').where({ id }).first();
    return { segment: serializeSegment(row) };
}
export async function patchSegment(actor, segmentId, body) {
    assertIntelligenceAccess(actor);
    if (!canCreateSavedSegments(actor))
        throw new AppError(403, 'Cannot edit saved segments');
    const row = await db('alumni_intelligence_segments').where({ id: segmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Segment not found');
    if (row.is_institutional && !canEditInstitutionalSegments(actor)) {
        throw new AppError(403, 'Cannot edit institutional segments');
    }
    if (row.scope === 'PERSONAL' && Number(row.owner_faculty_id) !== actor.facultyUserId && !canEditInstitutionalSegments(actor)) {
        throw new AppError(403, 'Cannot edit another user\'s personal segment');
    }
    const input = segmentPatchSchema.parse(body);
    const patch = { updated_at: db.fn.now() };
    if (input.name != null)
        patch.name = input.name;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.ruleDefinition)
        patch.rule_definition = JSON.stringify(input.ruleDefinition);
    if (input.scope)
        patch.scope = input.scope;
    if (input.departmentId !== undefined)
        patch.department_id = input.departmentId;
    if (input.isInstitutional != null) {
        if (input.isInstitutional && !canEditInstitutionalSegments(actor))
            throw new AppError(403, 'Cannot mark institutional');
        patch.is_institutional = input.isInstitutional;
    }
    if (input.isActive != null)
        patch.is_active = input.isActive;
    await db('alumni_intelligence_segments').where({ id: segmentId }).update(patch);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'INTELLIGENCE_SEGMENT_UPDATE',
        entityType: 'alumni_intelligence_segments',
        entityId: segmentId,
        metadata: input,
    });
    const updated = await db('alumni_intelligence_segments').where({ id: segmentId }).first();
    return { segment: serializeSegment(updated) };
}
export async function deleteSegment(actor, segmentId) {
    assertIntelligenceAccess(actor);
    const row = await db('alumni_intelligence_segments').where({ id: segmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Segment not found');
    if (row.is_institutional && !canEditInstitutionalSegments(actor)) {
        throw new AppError(403, 'Cannot delete institutional segments');
    }
    if (row.scope === 'PERSONAL' && Number(row.owner_faculty_id) !== actor.facultyUserId && !canEditInstitutionalSegments(actor)) {
        throw new AppError(403, 'Cannot delete another user\'s personal segment');
    }
    await db('alumni_intelligence_segments').where({ id: segmentId }).update({ is_active: false, updated_at: db.fn.now() });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'INTELLIGENCE_SEGMENT_DELETE',
        entityType: 'alumni_intelligence_segments',
        entityId: segmentId,
    });
    return { ok: true };
}
export async function evaluateRules(actor, opts) {
    assertIntelligenceAccess(actor);
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    let rule;
    if (opts.preset) {
        rule = presetToRule(opts.preset);
    }
    else if (opts.dimension) {
        rule = {
            combinator: 'AND',
            filters: [
                { field: 'dimension', value: opts.dimension },
                { field: 'evidenceState', op: 'in', value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] },
                { field: 'willingnessState', op: 'neq', value: 'NOT_WILLING' },
            ],
        };
    }
    else if (opts.ruleDefinition) {
        rule = segmentRuleSchema.parse(opts.ruleDefinition);
    }
    else {
        throw new AppError(400, 'ruleDefinition, preset, or dimension required');
    }
    // Candidate pool — SQL prefilter then in-memory intelligence match (page-bounded)
    let q = db('alumni_profiles as ap')
        .leftJoin('departments as d', 'd.id', 'ap.historical_department_id')
        .where('ap.college_id', actor.collegeId)
        .where('ap.is_active', true)
        .whereNot('ap.lifecycle_state', 'MERGED');
    q = applyProfileSqlFilters(q, actor, rule.filters);
    // Fetch a bounded candidate window larger than page to allow post-filter.
    // Prefer newest profiles so recent alumni (and tests) are not starved when the tenant grows.
    const candidateLimit = Math.min(offset + limit * 5, 500);
    const candidates = await q
        .select('ap.*', 'd.name as department_name', 'd.code as department_code')
        .orderBy('ap.id', 'desc')
        .limit(candidateLimit);
    const bundles = await loadSignalBundlesBatch(actor.collegeId, candidates);
    const matched = [];
    const showContacts = opts.includeContacts && canViewContactDetails(actor);
    for (const profile of candidates) {
        const bundle = bundles.get(Number(profile.id));
        if (!bundle)
            continue;
        const intel = buildProfileIntelligence(bundle);
        if (!matchesRule(rule, bundle, intel))
            continue;
        const focusDim = (opts.dimension && intel.dimensions.find((d) => d.dimension === opts.dimension)) ||
            intel.dimensions.find((d) => d.qualifies) ||
            intel.dimensions[0];
        matched.push({
            alumniProfileId: Number(profile.id),
            name: profile.historical_name,
            usn: profile.historical_usn,
            graduationYear: profile.graduation_year,
            department: profile.department_name,
            departmentId: profile.historical_department_id,
            email: showContacts ? profile.email : undefined,
            phone: showContacts ? (profile.phone_override || null) : undefined,
            relationship: intel.relationshipContext,
            focus: focusDim
                ? {
                    dimension: focusDim.dimension,
                    evidenceState: focusDim.evidenceState,
                    willingnessState: focusDim.willingnessState,
                    relationshipReadiness: focusDim.relationshipReadiness,
                    capabilityIntentCell: focusDim.capabilityIntentCell,
                    why: focusDim.why,
                    cautions: focusDim.cautions.map((c) => c.label),
                    dataQualityWarnings: focusDim.dataQualityWarnings,
                }
                : null,
            matrixSummary: intel.matrixSummary,
        });
    }
    const page = matched.slice(offset, offset + limit);
    return {
        totalMatchedInWindow: matched.length,
        truncated: candidates.length >= candidateLimit,
        offset,
        limit,
        rule,
        results: page,
        note: 'Membership is derived dynamically from rules. No alumni list is persisted.',
    };
}
export async function evaluateSavedSegment(actor, segmentId, query = {}) {
    assertIntelligenceAccess(actor);
    const row = await db('alumni_intelligence_segments').where({ id: segmentId, college_id: actor.collegeId }).first();
    if (!row || !row.is_active)
        throw new AppError(404, 'Segment not found');
    return evaluateRules(actor, {
        ruleDefinition: parseRules(row.rule_definition),
        limit: query.limit ? Number(query.limit) : 50,
        offset: query.offset ? Number(query.offset) : 0,
        includeContacts: query.includeContacts === true || query.includeContacts === 'true',
    });
}
export async function exportSegmentResults(actor, opts) {
    if (!canExportIntelligence(actor))
        throw new AppError(403, 'Export not permitted');
    const result = await evaluateRules(actor, { ...opts, includeContacts: canViewContactDetails(actor), limit: opts.limit ?? 200 });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'INTELLIGENCE_SEGMENT_EXPORT',
        entityType: 'alumni_intelligence_export',
        metadata: { count: result.results.length, rule: result.rule },
    });
    return {
        exportedAt: new Date().toISOString(),
        count: result.results.length,
        rows: result.results.map((r) => ({
            alumniProfileId: r.alumniProfileId,
            name: r.name,
            usn: r.usn,
            graduationYear: r.graduationYear,
            department: r.department,
            email: r.email ?? null,
            dimension: r.focus?.dimension,
            evidenceState: r.focus?.evidenceState,
            willingnessState: r.focus?.willingnessState,
            relationshipReadiness: r.focus?.relationshipReadiness,
            why: r.focus?.why?.join('; '),
            cautions: r.focus?.cautions?.join('; '),
            dataQualityWarnings: r.focus?.dataQualityWarnings?.join('; '),
            lastContactAt: r.relationship?.lastContactAt,
            ownerName: r.relationship?.ownerName,
        })),
        note: 'Export includes explainable evidence states — no opaque scores.',
    };
}
export { evaluateAdhocSchema, segmentCreateSchema, segmentPatchSchema, presetToRule };
