/**
 * Unified relationship timeline — manual CRM interactions + source projections.
 * Does NOT copy authoritative Event/Mentoring/T&P/Finance records.
 */
import { db } from '../../db/index.js';
import { loadAlumniInScope } from './crmService.js';
function item(partial) {
    return {
        id: partial.id ?? `${partial.sourceType}:${partial.sourceReference ?? partial.timestamp}`,
        timestamp: partial.timestamp,
        interactionType: partial.interactionType,
        summary: partial.summary,
        sourceType: partial.sourceType,
        sourceReference: partial.sourceReference,
        captureMode: partial.captureMode,
        visibility: partial.visibility,
        evidence: partial.evidence,
        actorName: partial.actorName,
        outcomeStatus: partial.outcomeStatus,
        drillPath: partial.drillPath,
        isContactAttempt: partial.isContactAttempt,
    };
}
async function projectEvents(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_event_registrations')))
        return [];
    const rows = await db('alumni_event_registrations as r')
        .join('alumni_events as e', 'e.id', 'r.event_id')
        .where({ 'r.college_id': collegeId, 'r.alumni_profile_id': alumniProfileId })
        .whereIn('r.status', ['REGISTERED', 'ATTENDED', 'CHECKED_IN'])
        .select('r.id as reg_id', 'r.status', 'r.registered_at', 'r.checked_in_at', 'e.id as event_id', 'e.title', 'e.event_type', 'e.starts_at');
    return rows.map((r) => item({
        id: `EVENT_REG:${r.reg_id}`,
        timestamp: new Date(r.checked_in_at || r.registered_at || r.starts_at).toISOString(),
        interactionType: 'EVENT',
        summary: `${r.status === 'CHECKED_IN' || r.status === 'ATTENDED' ? 'Attended' : 'Registered for'} event: ${r.title}`,
        sourceType: 'ALUMNI_EVENT',
        sourceReference: `alumni_event_registrations:${r.reg_id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'ALUMNI_VISIBLE',
        evidence: null,
        actorName: null,
        outcomeStatus: r.status,
        drillPath: `/alumni-admin?tab=events&eventId=${r.event_id}`,
        isContactAttempt: false,
    }));
}
async function projectMentoring(collegeId, studentId) {
    if (!(await db.schema.hasTable('mentor_assignments')))
        return [];
    const assignments = await db('mentor_assignments')
        .where({ college_id: collegeId, student_id: studentId })
        .select('id', 'created_at', 'status');
    const items = assignments.map((a) => item({
        id: `MENTOR_ASSIGN:${a.id}`,
        timestamp: new Date(a.created_at).toISOString(),
        interactionType: 'MENTORING',
        summary: `Mentoring assignment (${a.status || 'ACTIVE'})`,
        sourceType: 'MENTORING',
        sourceReference: `mentor_assignments:${a.id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'INSTITUTIONAL',
        evidence: null,
        actorName: null,
        outcomeStatus: a.status ?? null,
        drillPath: `/mentoring`,
        isContactAttempt: false,
    }));
    if (!(await db.schema.hasTable('mentor_meetings')) || !assignments.length)
        return items;
    const ids = assignments.map((a) => Number(a.id));
    const meetings = await db('mentor_meetings')
        .whereIn('assignment_id', ids)
        .select('id', 'assignment_id', 'meeting_date', 'notes');
    for (const m of meetings) {
        items.push(item({
            id: `MENTOR_MEET:${m.id}`,
            timestamp: new Date(m.meeting_date).toISOString(),
            interactionType: 'MENTORING',
            summary: 'Mentoring session recorded',
            sourceType: 'MENTORING',
            sourceReference: `mentor_meetings:${m.id}`,
            captureMode: 'SYSTEM_PROJECTED',
            visibility: 'INSTITUTIONAL',
            evidence: null,
            actorName: null,
            outcomeStatus: 'COMPLETED',
            drillPath: `/mentoring`,
            isContactAttempt: false,
        }));
    }
    return items;
}
async function projectPlacements(collegeId, studentId) {
    if (!(await db.schema.hasTable('placement_offers')))
        return [];
    const rows = await db('placement_offers as po')
        .leftJoin('placement_companies as pc', 'pc.id', 'po.company_id')
        .where({ 'po.college_id': collegeId, 'po.student_id': studentId })
        .select('po.id', 'po.offer_status', 'po.updated_at', 'po.created_at', 'pc.name as company_name');
    return rows.map((r) => item({
        id: `PLACEMENT:${r.id}`,
        timestamp: new Date(r.updated_at || r.created_at).toISOString(),
        interactionType: 'RECRUITMENT',
        summary: `Placement offer (${r.offer_status})${r.company_name ? ` — ${r.company_name}` : ''}`,
        sourceType: 'TPMS',
        sourceReference: `placement_offers:${r.id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'INSTITUTIONAL',
        evidence: null,
        actorName: null,
        outcomeStatus: r.offer_status,
        drillPath: `/tnp`,
        isContactAttempt: false,
    }));
}
async function projectContributions(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_contributions')))
        return [];
    const rows = await db('alumni_contributions')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .select('id', 'purpose', 'amount', 'status', 'finance_receipt_id', 'created_at');
    return rows.map((r) => item({
        id: `CONTRIB:${r.id}`,
        timestamp: new Date(r.created_at).toISOString(),
        interactionType: 'CONTRIBUTION',
        summary: `Contribution intent: ${r.purpose}${r.amount != null ? ` (${r.amount})` : ''} — ${r.status}`,
        sourceType: r.finance_receipt_id ? 'FINANCE' : 'ALUMNI_CONTRIBUTION',
        sourceReference: r.finance_receipt_id
            ? `fee_receipts:${r.finance_receipt_id}`
            : `alumni_contributions:${r.id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'ALUMNI_VISIBLE',
        evidence: r.finance_receipt_id ? `fee_receipts:${r.finance_receipt_id}` : null,
        actorName: null,
        outcomeStatus: r.status,
        drillPath: null,
        isContactAttempt: false,
    }));
}
async function projectRecognition(collegeId, alumniProfileId) {
    const items = [];
    // C1 self / institutional achievements (existing projection)
    if (await db.schema.hasTable('alumni_achievements')) {
        const rows = await db('alumni_achievements')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('achievement_type', ['INSTITUTIONAL_RECOGNITION', 'AWARD', 'RECOGNITION'])
            .whereIn('moderation_state', ['APPROVED', 'PUBLISHED', 'PENDING'])
            .select('id', 'title', 'achievement_type', 'achievement_date', 'moderation_state', 'created_at');
        for (const r of rows) {
            items.push(item({
                id: `RECOG:${r.id}`,
                timestamp: new Date(r.achievement_date || r.created_at).toISOString(),
                interactionType: 'RECOGNITION',
                summary: `Recognition: ${r.title}`,
                sourceType: 'ALUMNI_ACHIEVEMENT',
                sourceReference: `alumni_achievements:${r.id}`,
                captureMode: 'SYSTEM_PROJECTED',
                visibility: 'ALUMNI_VISIBLE',
                evidence: null,
                actorName: null,
                outcomeStatus: r.moderation_state,
                drillPath: null,
                isContactAttempt: false,
            }));
        }
    }
    // C6 issued / corrected recognition records (authoritative institutional awards)
    if (await db.schema.hasTable('alumni_recognition_records')) {
        const rows = await db('alumni_recognition_records')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['ISSUED', 'CORRECTED'])
            .select('id', 'title', 'category', 'status', 'award_date', 'created_at');
        for (const r of rows) {
            items.push(item({
                id: `C6_RECOG:${r.id}`,
                timestamp: new Date(r.award_date || r.created_at).toISOString(),
                interactionType: 'RECOGNITION',
                summary: `Institutional recognition: ${r.title}`,
                sourceType: 'C6',
                sourceReference: `alumni_recognition_records:${r.id}`,
                captureMode: 'SYSTEM_PROJECTED',
                visibility: 'ALUMNI_VISIBLE',
                evidence: r.category ? `category:${r.category}` : null,
                actorName: null,
                outcomeStatus: r.status,
                drillPath: null,
                isContactAttempt: false,
            }));
        }
    }
    return items;
}
async function projectEngagement(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_engagement')))
        return [];
    const rows = await db('alumni_engagement')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .select('id', 'engagement_type', 'source_type', 'source_id', 'notes', 'occurred_at');
    return rows.map((r) => {
        const typeMap = {
            MENTORING: 'MENTORING',
            STUDENT_MENTORED: 'MENTORING',
            MENTORSHIP: 'MENTORING',
            EXPERT_TALK: 'EXPERT_SESSION',
            GUEST_LECTURE: 'EXPERT_SESSION',
            WORKSHOP: 'EXPERT_SESSION',
            PROJECT: 'PROJECT',
            PROJECT_SUPPORT: 'PROJECT',
        };
        return item({
            id: `ENGAGE:${r.id}`,
            timestamp: new Date(r.occurred_at).toISOString(),
            interactionType: typeMap[r.engagement_type] || 'OTHER',
            summary: r.notes || `Engagement: ${r.engagement_type}`,
            sourceType: 'ALUMNI_ENGAGEMENT',
            sourceReference: `alumni_engagement:${r.id}`,
            captureMode: 'SYSTEM_PROJECTED',
            visibility: 'INSTITUTIONAL',
            evidence: r.source_type && r.source_id ? `${r.source_type}:${r.source_id}` : null,
            actorName: null,
            outcomeStatus: null,
            drillPath: null,
            isContactAttempt: false,
        });
    });
}
async function projectJobBoardOpportunities(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_opportunities')))
        return [];
    const rows = await db('alumni_opportunities')
        .where({ college_id: collegeId, submitted_by_alumni_id: alumniProfileId })
        .select('id', 'title', 'opportunity_type', 'status', 'created_at');
    return rows.map((r) => item({
        id: `JOBBOARD_OPP:${r.id}`,
        timestamp: new Date(r.created_at).toISOString(),
        interactionType: r.opportunity_type === 'INTERNSHIP' ? 'INTERNSHIP' : r.opportunity_type === 'PROJECT' ? 'PROJECT' : 'RECRUITMENT',
        summary: `Submitted opportunity: ${r.title} (${r.status})`,
        sourceType: 'ALUMNI_JOB_BOARD',
        sourceReference: `alumni_opportunities:${r.id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'ALUMNI_VISIBLE',
        evidence: null,
        actorName: null,
        outcomeStatus: r.status,
        drillPath: null,
        isContactAttempt: false,
    }));
}
async function projectProfileUpdates(collegeId, alumniProfileId) {
    if (!(await db.schema.hasTable('alumni_contact_history')))
        return [];
    const rows = await db('alumni_contact_history')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('created_at', 'desc')
        .limit(50)
        .select('id', 'field_name', 'source_type', 'created_at');
    return rows.map((r) => item({
        id: `CONTACT_HIST:${r.id}`,
        timestamp: new Date(r.created_at).toISOString(),
        interactionType: 'PROFILE_UPDATE',
        summary: `Contact field updated: ${r.field_name}`,
        sourceType: 'ALUMNI_CONTACT_HISTORY',
        sourceReference: `alumni_contact_history:${r.id}`,
        captureMode: 'SYSTEM_PROJECTED',
        visibility: 'INSTITUTIONAL',
        evidence: null,
        actorName: null,
        outcomeStatus: null,
        drillPath: null,
        isContactAttempt: false,
    }));
}
async function loadManualInteractions(collegeId, alumniProfileId, opts) {
    if (!(await db.schema.hasTable('alumni_crm_interactions')))
        return [];
    let q = db('alumni_crm_interactions as i')
        .leftJoin('faculty_users as f', 'f.id', 'i.actor_faculty_id')
        .where({ 'i.college_id': collegeId, 'i.alumni_profile_id': alumniProfileId });
    if (opts.alumniVisibleOnly) {
        q = q.where('i.visibility', 'ALUMNI_VISIBLE');
    }
    const rows = await q.select('i.*', 'f.name as actor_name');
    return rows.map((r) => item({
        id: `CRM_IX:${r.id}`,
        timestamp: new Date(r.occurred_at).toISOString(),
        interactionType: r.interaction_type,
        summary: r.summary || r.purpose || `${r.interaction_type} (${r.outcome_status || r.direction})`,
        sourceType: 'CRM_INTERACTION',
        sourceReference: `alumni_crm_interactions:${r.id}`,
        captureMode: r.capture_mode,
        visibility: r.visibility,
        evidence: r.evidence_reference,
        actorName: r.actor_name,
        outcomeStatus: r.outcome_status,
        drillPath: null,
        isContactAttempt: Boolean(r.is_contact_attempt),
    }));
}
async function projectCrmOutcomes(collegeId, alumniProfileId, alumniVisible) {
    if (!(await db.schema.hasTable('alumni_crm_outcomes')))
        return [];
    let q = db('alumni_crm_outcomes')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId });
    if (alumniVisible)
        q = q.where({ verification_status: 'VERIFIED' });
    const rows = await q.select('*');
    return rows.map((r) => item({
        id: `CRM_OUT:${r.id}`,
        timestamp: new Date(r.outcome_date).toISOString(),
        interactionType: 'OTHER',
        summary: `Outcome (${r.verification_status}): ${r.title}`,
        sourceType: 'CRM_OUTCOME',
        sourceReference: `alumni_crm_outcomes:${r.id}`,
        captureMode: 'MANUAL',
        visibility: r.verification_status === 'VERIFIED' ? 'ALUMNI_VISIBLE' : 'INSTITUTIONAL',
        evidence: r.evidence_reference,
        actorName: null,
        outcomeStatus: r.verification_status,
        drillPath: null,
        isContactAttempt: false,
    }));
}
async function buildTimelineCore(collegeId, alumniProfileId, studentId, opts) {
    const alumniVisibleOnly = opts.viewer === 'self';
    const batches = await Promise.all([
        loadManualInteractions(collegeId, alumniProfileId, { alumniVisibleOnly }),
        projectEvents(collegeId, alumniProfileId),
        projectMentoring(collegeId, studentId),
        projectPlacements(collegeId, studentId),
        projectContributions(collegeId, alumniProfileId),
        projectRecognition(collegeId, alumniProfileId),
        projectEngagement(collegeId, alumniProfileId),
        projectJobBoardOpportunities(collegeId, alumniProfileId),
        opts.viewer === 'admin' ? projectProfileUpdates(collegeId, alumniProfileId) : Promise.resolve([]),
        projectCrmOutcomes(collegeId, alumniProfileId, alumniVisibleOnly),
    ]);
    let items = batches.flat();
    if (opts.viewer === 'self') {
        items = items.filter((i) => i.visibility === 'ALUMNI_VISIBLE' || i.sourceType === 'ALUMNI_EVENT' || i.sourceType === 'ALUMNI_CONTRIBUTION' || i.sourceType === 'ALUMNI_ACHIEVEMENT' || i.sourceType === 'C6' || i.sourceType === 'ALUMNI_JOB_BOARD' || (i.sourceType === 'CRM_OUTCOME' && i.outcomeStatus === 'VERIFIED'));
    }
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
}
export async function getTimelineForAdmin(actor, alumniProfileId) {
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const items = await buildTimelineCore(actor.collegeId, alumniProfileId, Number(profile.student_id), { viewer: 'admin' });
    return {
        timeline: items,
        meta: {
            projectedSources: [
                'alumni_crm_interactions',
                'alumni_event_registrations',
                'mentor_assignments/mentor_meetings',
                'placement_offers',
                'alumni_contributions',
                'alumni_achievements',
                'alumni_recognition_records (C6)',
                'alumni_engagement',
                'alumni_opportunities (job board)',
                'alumni_contact_history',
                'alumni_crm_outcomes',
            ],
            note: 'SYSTEM_PROJECTED items reference authoritative sources; data is not duplicated into CRM.',
        },
    };
}
export async function getTimelineForSelf(actor) {
    const profile = await db('alumni_profiles')
        .where({ id: actor.alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        return { timeline: [] };
    const items = await buildTimelineCore(actor.collegeId, actor.alumniProfileId, Number(profile.student_id), { viewer: 'self' });
    return { timeline: items };
}
