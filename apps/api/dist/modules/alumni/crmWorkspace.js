/**
 * CRM operational workspace, next-best manual actions, and baseline analytics.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertCrmAccess, getCrmConfig, serializeFollowup, serializeOpportunity, serializeOutcome, serializeRelationship, } from './crmService.js';
import { isDepartmentScoped } from './accessCrm.js';
/** Deterministic, explainable workflow suggestions — no AI. */
export async function computeNextBestActions(collegeId, alumniProfileId, rel) {
    const suggestions = [];
    const config = await getCrmConfig(collegeId);
    const today = new Date().toISOString().slice(0, 10);
    if (await db.schema.hasTable('alumni_crm_followups')) {
        const overdue = await db('alumni_crm_followups')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
            .where('due_date', '<', today)
            .first();
        if (overdue) {
            suggestions.push({
                code: 'FOLLOWUP_OVERDUE',
                action: 'Follow up',
                reason: `Follow-up overdue since ${overdue.due_date}: ${overdue.reason}`,
                priority: 'URGENT',
            });
        }
    }
    // Profile stale + active relationship
    const profile = await db('alumni_profiles').where({ id: alumniProfileId }).first();
    if (profile && rel?.relationship_status === 'ACTIVE') {
        const empConfirmed = profile.employment_confirmed_at ? new Date(profile.employment_confirmed_at).getTime() : 0;
        const staleMs = config.noContactReviewDays * 86400000;
        if (!empConfirmed || Date.now() - empConfirmed > 365 * 86400000) {
            suggestions.push({
                code: 'REQUEST_PROFILE_UPDATE',
                action: 'Request profile update',
                reason: 'Profile employment data is stale or unconfirmed while relationship is active',
                priority: 'NORMAL',
            });
        }
        if (rel.last_contact_at) {
            const days = Math.floor((Date.now() - new Date(rel.last_contact_at).getTime()) / 86400000);
            if (days >= config.noContactReviewDays) {
                suggestions.push({
                    code: 'REVIEW_RELATIONSHIP',
                    action: 'Review relationship',
                    reason: `No contact for ${days} days (threshold ${config.noContactReviewDays})`,
                    priority: 'HIGH',
                });
            }
        }
        else if (STAGE_NEEDS_CONTACT.has(rel.relationship_stage)) {
            suggestions.push({
                code: 'INITIATE_CONTACT',
                action: 'Initiate contact',
                reason: `Relationship stage is ${rel.relationship_stage} with no recorded contact`,
                priority: 'NORMAL',
            });
        }
        void staleMs;
    }
    if (await db.schema.hasTable('alumni_crm_opportunities')) {
        const mentorship = await db('alumni_crm_opportunities')
            .where({
            college_id: collegeId,
            alumni_profile_id: alumniProfileId,
            opportunity_type: 'MENTORSHIP',
            status: 'CONFIRMED',
        })
            .first();
        if (mentorship) {
            suggestions.push({
                code: 'COORDINATE_MENTOR',
                action: 'Coordinate mentor assignment',
                reason: `Mentorship opportunity confirmed: ${mentorship.title}`,
                priority: 'HIGH',
            });
        }
        const recruitment = await db('alumni_crm_opportunities')
            .where({
            college_id: collegeId,
            alumni_profile_id: alumniProfileId,
            opportunity_type: 'RECRUITMENT',
        })
            .whereIn('status', ['IDENTIFIED', 'QUALIFYING'])
            .first();
        if (recruitment) {
            suggestions.push({
                code: 'SEND_TO_TP',
                action: 'Send to T&P',
                reason: `Recruitment opportunity identified: ${recruitment.title}`,
                priority: 'HIGH',
            });
        }
    }
    return suggestions;
}
const STAGE_NEEDS_CONTACT = new Set(['IDENTIFIED', 'REACHABLE']);
function applyAlumniScope(q, actor) {
    if (isDepartmentScoped(actor) && actor.departmentId != null) {
        q = q.where('ap.historical_department_id', actor.departmentId);
    }
    return q;
}
export async function getCrmWorkspace(actor, query = {}) {
    assertCrmAccess(actor);
    if (!(await db.schema.hasTable('alumni_relationships'))) {
        throw new AppError(503, 'Alumni CRM schema not migrated');
    }
    const view = String(query.view || 'MY_ALUMNI').toUpperCase();
    const today = new Date().toISOString().slice(0, 10);
    const config = await getCrmConfig(actor.collegeId);
    // Mark overdue follow-ups (projected status)
    if (await db.schema.hasTable('alumni_crm_followups')) {
        await db('alumni_crm_followups')
            .where({ college_id: actor.collegeId })
            .whereIn('status', ['OPEN', 'IN_PROGRESS'])
            .where('due_date', '<', today)
            .update({ status: 'OVERDUE' });
    }
    const filters = {
        departmentId: query.departmentId ? Number(query.departmentId) : null,
        batchLabel: query.batchLabel ? String(query.batchLabel) : null,
        programId: query.programId ? Number(query.programId) : null,
        graduationYear: query.graduationYear ? Number(query.graduationYear) : null,
        relationshipStage: query.relationshipStage ? String(query.relationshipStage) : null,
        ownerId: query.ownerId ? Number(query.ownerId) : null,
        opportunityType: query.opportunityType ? String(query.opportunityType) : null,
        limit: Math.min(Number(query.limit ?? 50), 200),
    };
    let items = [];
    let metrics = await computeBaselineMetrics(actor);
    if (view === 'MY_FOLLOWUPS' || view === 'DUE_TODAY' || view === 'OVERDUE' || view === 'DEPARTMENT_FOLLOWUPS') {
        let q = db('alumni_crm_followups as f')
            .join('alumni_profiles as ap', 'ap.id', 'f.alumni_profile_id')
            .leftJoin('faculty_users as o', 'o.id', 'f.owner_faculty_id')
            .where('f.college_id', actor.collegeId)
            .whereNotIn('f.status', ['COMPLETED', 'CANCELLED']);
        q = applyAlumniScope(q, actor);
        if (view === 'MY_FOLLOWUPS')
            q = q.where('f.owner_faculty_id', actor.facultyUserId);
        if (view === 'DEPARTMENT_FOLLOWUPS' && actor.departmentId)
            q = q.where('f.department_id', actor.departmentId);
        if (view === 'DUE_TODAY')
            q = q.where('f.due_date', today);
        if (view === 'OVERDUE')
            q = q.where('f.status', 'OVERDUE');
        if (filters.departmentId)
            q = q.where('ap.historical_department_id', filters.departmentId);
        items = await q
            .select('f.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn', 'ap.graduation_year', 'o.name as owner_name')
            .orderBy('f.due_date', 'asc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeFollowup(r),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
            graduationYear: r.graduation_year,
            ownerName: r.owner_name,
        })));
    }
    else if (view === 'ACTIVE_OPPORTUNITIES') {
        let q = db('alumni_crm_opportunities as opp')
            .join('alumni_profiles as ap', 'ap.id', 'opp.alumni_profile_id')
            .where('opp.college_id', actor.collegeId)
            .whereIn('opp.status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS']);
        q = applyAlumniScope(q, actor);
        if (filters.opportunityType)
            q = q.where('opp.opportunity_type', filters.opportunityType);
        if (filters.departmentId)
            q = q.where('ap.historical_department_id', filters.departmentId);
        items = await q
            .select('opp.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn')
            .orderBy('opp.identified_at', 'desc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeOpportunity(r),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
        })));
    }
    else if (view === 'OUTCOMES_AWAITING_VERIFICATION') {
        let q = db('alumni_crm_outcomes as out')
            .join('alumni_profiles as ap', 'ap.id', 'out.alumni_profile_id')
            .where('out.college_id', actor.collegeId)
            .whereIn('out.verification_status', ['UNVERIFIED', 'PENDING']);
        q = applyAlumniScope(q, actor);
        items = await q
            .select('out.*', 'ap.historical_name as alumni_name')
            .orderBy('out.outcome_date', 'desc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeOutcome(r),
            alumniName: r.alumni_name,
        })));
    }
    else if (view === 'NO_RESPONSE') {
        let q = db('alumni_crm_interactions as i')
            .join('alumni_profiles as ap', 'ap.id', 'i.alumni_profile_id')
            .where({ 'i.college_id': actor.collegeId, 'i.outcome_status': 'NO_RESPONSE', 'i.is_contact_attempt': true });
        q = applyAlumniScope(q, actor);
        items = await q
            .select('i.id', 'i.alumni_profile_id', 'i.occurred_at', 'i.channel', 'i.summary', 'ap.historical_name as alumni_name')
            .orderBy('i.occurred_at', 'desc')
            .limit(filters.limit);
    }
    else if (view === 'RECENTLY_CONTACTED') {
        let q = db('alumni_relationships as r')
            .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
            .where('r.college_id', actor.collegeId)
            .whereNotNull('r.last_contact_at');
        q = applyAlumniScope(q, actor);
        items = await q
            .select('r.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn', 'ap.graduation_year')
            .orderBy('r.last_contact_at', 'desc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeRelationship(r),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
            graduationYear: r.graduation_year,
        })));
    }
    else if (view === 'DORMANT_RELATIONSHIPS') {
        const cutoff = new Date(Date.now() - config.dormantAfterDays * 86400000);
        let q = db('alumni_relationships as r')
            .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
            .where('r.college_id', actor.collegeId)
            .where((b) => {
            b.where('r.relationship_status', 'DORMANT').orWhere((b2) => {
                b2.where('r.relationship_status', 'ACTIVE').andWhere((b3) => {
                    b3.whereNull('r.last_contact_at').orWhere('r.last_contact_at', '<', cutoff);
                });
            });
        });
        q = applyAlumniScope(q, actor);
        items = await q
            .select('r.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn')
            .orderBy('r.last_contact_at', 'asc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeRelationship(r),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
        })));
    }
    else {
        // MY_ALUMNI default
        let q = db('alumni_relationships as r')
            .join('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
            .where('r.college_id', actor.collegeId);
        q = applyAlumniScope(q, actor);
        if (view === 'MY_ALUMNI')
            q = q.where('r.relationship_owner_id', actor.facultyUserId);
        if (filters.relationshipStage)
            q = q.where('r.relationship_stage', filters.relationshipStage);
        if (filters.ownerId)
            q = q.where('r.relationship_owner_id', filters.ownerId);
        if (filters.departmentId)
            q = q.where('ap.historical_department_id', filters.departmentId);
        if (filters.graduationYear)
            q = q.where('ap.graduation_year', filters.graduationYear);
        if (filters.programId)
            q = q.where('ap.historical_program_id', filters.programId);
        if (filters.batchLabel)
            q = q.where('ap.batch_label', filters.batchLabel);
        items = await q
            .select('r.*', 'ap.historical_name as alumni_name', 'ap.historical_usn as alumni_usn', 'ap.graduation_year', 'ap.batch_label', 'ap.historical_department_id')
            .orderBy('r.updated_at', 'desc')
            .limit(filters.limit)
            .then((rows) => rows.map((r) => ({
            ...serializeRelationship(r),
            alumniName: r.alumni_name,
            alumniUsn: r.alumni_usn,
            graduationYear: r.graduation_year,
            batchLabel: r.batch_label,
            // Intentionally omit email/phone from CRM search/list
        })));
    }
    return {
        view,
        filters,
        items,
        metrics,
        config,
        note: 'CRM workspace lists never expose alumni email/phone contact fields.',
    };
}
async function computeBaselineMetrics(actor) {
    const collegeId = actor.collegeId;
    const today = new Date().toISOString().slice(0, 10);
    const empty = {
        alumniContacted: 0,
        responseCount: 0,
        responseRate: 0,
        engagedAlumni: 0,
        openFollowups: 0,
        overdueFollowups: 0,
        activeOpportunities: 0,
        completedOpportunities: 0,
        verifiedOutcomes: 0,
        repeatEngagements: 0,
    };
    if (!(await db.schema.hasTable('alumni_relationships')))
        return empty;
    const contacted = await db('alumni_relationships')
        .where({ college_id: collegeId })
        .whereNotNull('last_contact_at')
        .count({ c: '*' })
        .first();
    const responded = await db('alumni_relationships')
        .where({ college_id: collegeId })
        .whereNotNull('last_response_at')
        .count({ c: '*' })
        .first();
    const engaged = await db('alumni_relationships')
        .where({ college_id: collegeId })
        .whereNotNull('last_engagement_at')
        .count({ c: '*' })
        .first();
    const repeat = await db('alumni_relationships')
        .where({ college_id: collegeId, relationship_stage: 'REPEAT_ENGAGEMENT' })
        .count({ c: '*' })
        .first();
    let openFollowups = 0;
    let overdueFollowups = 0;
    if (await db.schema.hasTable('alumni_crm_followups')) {
        openFollowups = Number((await db('alumni_crm_followups').where({ college_id: collegeId }).whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE']).count({ c: '*' }).first())?.c ?? 0);
        overdueFollowups = Number((await db('alumni_crm_followups')
            .where({ college_id: collegeId })
            .where((b) => {
            b.where('status', 'OVERDUE').orWhere((b2) => {
                b2.whereIn('status', ['OPEN', 'IN_PROGRESS']).where('due_date', '<', today);
            });
        })
            .count({ c: '*' })
            .first())?.c ?? 0);
    }
    let activeOpportunities = 0;
    let completedOpportunities = 0;
    if (await db.schema.hasTable('alumni_crm_opportunities')) {
        activeOpportunities = Number((await db('alumni_crm_opportunities').where({ college_id: collegeId }).whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS']).count({ c: '*' }).first())?.c ?? 0);
        completedOpportunities = Number((await db('alumni_crm_opportunities').where({ college_id: collegeId, status: 'COMPLETED' }).count({ c: '*' }).first())?.c ?? 0);
    }
    let verifiedOutcomes = 0;
    if (await db.schema.hasTable('alumni_crm_outcomes')) {
        verifiedOutcomes = Number((await db('alumni_crm_outcomes').where({ college_id: collegeId, verification_status: 'VERIFIED' }).count({ c: '*' }).first())?.c ?? 0);
    }
    const alumniContacted = Number(contacted?.c ?? 0);
    const responseCount = Number(responded?.c ?? 0);
    return {
        alumniContacted,
        responseCount,
        responseRate: alumniContacted ? Math.round((responseCount / alumniContacted) * 1000) / 10 : 0,
        engagedAlumni: Number(engaged?.c ?? 0),
        openFollowups,
        overdueFollowups,
        activeOpportunities,
        completedOpportunities,
        verifiedOutcomes,
        repeatEngagements: Number(repeat?.c ?? 0),
    };
}
export async function buildCrm360Section(actor, alumniProfileId, profile) {
    assertCrmAccess(actor);
    const { ensureRelationship, buildDuplicateContactWarnings, listNotesForAdmin } = await import('./crmService.js');
    const { getTimelineForAdmin } = await import('./crmTimeline.js');
    if (!(await db.schema.hasTable('alumni_relationships'))) {
        return {
            available: false,
            note: 'CRM schema not migrated',
        };
    }
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    const config = await getCrmConfig(actor.collegeId);
    let ownerName = null;
    if (rel.relationship_owner_id) {
        const o = await db('faculty_users').where({ id: rel.relationship_owner_id }).select('name').first();
        ownerName = o?.name ?? null;
    }
    const [followups, opportunities, outcomes, timeline, notes, nextActions, warnings] = await Promise.all([
        db('alumni_crm_followups')
            .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
            .orderBy('due_date', 'asc')
            .limit(20)
            .then((rows) => rows.map(serializeFollowup)),
        db('alumni_crm_opportunities')
            .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
            .orderBy('identified_at', 'desc')
            .limit(20)
            .then((rows) => rows.map(serializeOpportunity)),
        db('alumni_crm_outcomes')
            .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
            .orderBy('outcome_date', 'desc')
            .limit(20)
            .then((rows) => rows.map(serializeOutcome)),
        getTimelineForAdmin(actor, alumniProfileId).then((r) => r.timeline.slice(0, 40)),
        listNotesForAdmin(actor, alumniProfileId).then((r) => r.notes),
        computeNextBestActions(actor.collegeId, alumniProfileId, rel),
        buildDuplicateContactWarnings(actor.collegeId, alumniProfileId, config.recentContactWarnDays),
    ]);
    return {
        available: true,
        relationshipStatus: {
            stage: rel.relationship_stage,
            status: rel.relationship_status,
            ownerId: rel.relationship_owner_id != null ? Number(rel.relationship_owner_id) : null,
            ownerType: rel.relationship_owner_type,
            ownerName,
            departmentId: rel.department_id != null ? Number(rel.department_id) : null,
            lastInteraction: rel.last_contact_at ? new Date(rel.last_contact_at).toISOString() : null,
            lastMeaningfulEngagement: rel.last_engagement_at ? new Date(rel.last_engagement_at).toISOString() : null,
            nextActionAt: rel.next_action_at ? new Date(rel.next_action_at).toISOString() : null,
        },
        timeline,
        openFollowups: followups,
        opportunities,
        outcomes,
        notes,
        nextBestActions: nextActions,
        duplicateContactWarnings: warnings,
    };
}
export async function buildCrmSelfSection(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_relationships'))) {
        return { available: false };
    }
    const { getTimelineForSelf } = await import('./crmTimeline.js');
    const actor = {
        alumniProfileId,
        studentId: 0,
        collegeId,
        role: 'ALUMNI',
        email: '',
        name: '',
    };
    const profile = await db('alumni_profiles').where({ id: alumniProfileId }).first();
    if (profile)
        actor.studentId = Number(profile.student_id);
    const timeline = (await getTimelineForSelf(actor)).timeline;
    const opportunities = await db.schema.hasTable('alumni_crm_opportunities')
        ? await db('alumni_crm_opportunities')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'])
            .select('id', 'opportunity_type', 'title', 'status', 'target_date', 'identified_at')
        : [];
    const outcomes = await db.schema.hasTable('alumni_crm_outcomes')
        ? await db('alumni_crm_outcomes')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId, verification_status: 'VERIFIED' })
            .select('id', 'outcome_type', 'title', 'outcome_date', 'quantity')
        : [];
    // Never expose internal notes
    return {
        available: true,
        upcomingEngagements: timeline.filter((t) => ['EVENT', 'MENTORING', 'EXPERT_SESSION'].includes(t.interactionType)).slice(0, 10),
        opportunitiesAccepted: opportunities,
        verifiedOutcomes: outcomes,
        timeline: timeline.slice(0, 30),
        note: 'Internal CRM notes, staff comments, and relationship scores are never shown to alumni.',
    };
}
