/**
 * Recognition workspace views & operational analytics (C6).
 * Operational counts only — not C7 institutional impact.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canAccessRecognition, isDepartmentScopedRecognition } from './accessRecognition.js';
import { getSourceOfTruthMatrix } from './recognitionService.js';
import { batchReciprocityGuardrails } from './recognitionEngine.js';
import { WORKSPACE_VIEWS } from './typesRecognition.js';
function assertAccess(actor) {
    if (!canAccessRecognition(actor))
        throw new AppError(403, 'Recognition access denied');
}
async function requireTables() {
    if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
        throw new AppError(503, 'Run migration alumni_recognition_c6 first');
    }
}
function scopePrograms(actor, q) {
    q = q.where('p.college_id', actor.collegeId);
    if (isDepartmentScopedRecognition(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('p.department_id', actor.departmentId).orWhereNull('p.department_id');
        });
    }
    return q;
}
function scopeNominations(actor, q) {
    q = q.where('n.college_id', actor.collegeId);
    if (isDepartmentScopedRecognition(actor) && actor.departmentId != null) {
        q = q.andWhere((qb) => {
            qb.where('ap.historical_department_id', actor.departmentId).orWhereNull('ap.historical_department_id');
        });
    }
    return q;
}
export async function getRecognitionWorkspace(actor, query = {}) {
    await requireTables();
    assertAccess(actor);
    const view = String(query.view || 'OVERVIEW').toUpperCase();
    const metrics = await getRecognitionAnalytics(actor);
    const base = {
        view,
        views: WORKSPACE_VIEWS,
        metrics,
        sourceOfTruth: getSourceOfTruthMatrix(),
    };
    if (view === 'OVERVIEW' || !WORKSPACE_VIEWS.includes(view)) {
        return {
            ...base,
            view: view === 'OVERVIEW' || WORKSPACE_VIEWS.includes(view) ? view : 'OVERVIEW',
            summary: await getManagementSummary(actor),
        };
    }
    if (view === 'PROGRAMS') {
        let q = scopePrograms(actor, db('alumni_recognition_programs as p'));
        if (query.status)
            q = q.where('p.status', String(query.status));
        if (query.category)
            q = q.where('p.category', String(query.category));
        const rows = await q.orderBy('p.award_date', 'asc').orderBy('p.id', 'desc').limit(150);
        return {
            ...base,
            programs: rows.map((r) => ({
                id: Number(r.id),
                name: r.name,
                category: r.category,
                status: r.status,
                academicYear: r.academic_year,
                nominationStart: r.nomination_start,
                nominationEnd: r.nomination_end,
                awardDate: r.award_date,
                departmentId: r.department_id != null ? Number(r.department_id) : null,
            })),
        };
    }
    if (view === 'NOMINATIONS' || view === 'REVIEW_QUEUE') {
        const statuses = view === 'REVIEW_QUEUE'
            ? ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED']
            : query.status
                ? [String(query.status)]
                : ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_EVIDENCE_REQUIRED', 'SHORTLISTED'];
        let q = scopeNominations(actor, db('alumni_recognition_nominations as n').leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id'))
            .whereIn('n.status', statuses)
            .select('n.*', 'ap.historical_name as alumni_name');
        if (query.programId)
            q = q.where('n.program_id', Number(query.programId));
        if (query.category)
            q = q.where('n.category', String(query.category));
        const rows = await q.orderBy('n.updated_at', 'desc').orderBy('n.id', 'desc').limit(150);
        return {
            ...base,
            nominations: rows.map((r) => ({
                id: Number(r.id),
                title: r.title,
                category: r.category,
                status: r.status,
                source: r.source,
                alumniProfileId: Number(r.alumni_profile_id),
                alumniName: r.alumni_name,
                programId: r.program_id != null ? Number(r.program_id) : null,
                submittedAt: r.submitted_at ? new Date(r.submitted_at).toISOString() : null,
                updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
            })),
        };
    }
    if (view === 'RECOGNITIONS') {
        let q = db('alumni_recognition_records as r')
            .leftJoin('alumni_profiles as ap', 'ap.id', 'r.alumni_profile_id')
            .where('r.college_id', actor.collegeId)
            .whereIn('r.status', query.status ? [String(query.status)] : ['ISSUED', 'CORRECTED'])
            .select('r.*', 'ap.historical_name as alumni_name');
        if (isDepartmentScopedRecognition(actor) && actor.departmentId != null) {
            q = q.andWhere((qb) => {
                qb.where('ap.historical_department_id', actor.departmentId).orWhereNull('ap.historical_department_id');
            });
        }
        const rows = await q.orderBy('r.award_date', 'desc').orderBy('r.id', 'desc').limit(150);
        return {
            ...base,
            recognitions: rows.map((r) => ({
                id: Number(r.id),
                title: r.title,
                category: r.category,
                status: r.status,
                alumniProfileId: Number(r.alumni_profile_id),
                alumniName: r.alumni_name,
                awardDate: r.award_date,
                academicYear: r.academic_year,
            })),
        };
    }
    if (view === 'SPOTLIGHTS') {
        let q = db('alumni_spotlights as s')
            .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
            .where('s.college_id', actor.collegeId)
            .select('s.*', 'ap.historical_name as alumni_name');
        if (query.status)
            q = q.where('s.publication_status', String(query.status));
        const rows = await q.orderBy('s.id', 'desc').limit(100);
        return {
            ...base,
            spotlights: rows.map((r) => ({
                id: Number(r.id),
                headline: r.headline,
                publicationStatus: r.publication_status,
                publicationConsent: Boolean(r.publication_consent),
                alumniProfileId: Number(r.alumni_profile_id),
                alumniName: r.alumni_name,
                publishAt: r.publish_at,
            })),
        };
    }
    if (view === 'VALUE_OFFERINGS') {
        let q = db('alumni_value_offerings').where({ college_id: actor.collegeId });
        if (query.status)
            q = q.where('status', String(query.status));
        else
            q = q.whereIn('status', ['DRAFT', 'OPEN', 'FULL']);
        const rows = await q.orderBy('id', 'desc').limit(100);
        return {
            ...base,
            offerings: rows.map((r) => ({
                id: Number(r.id),
                title: r.title,
                category: r.category,
                status: r.status,
                capacity: r.capacity != null ? Number(r.capacity) : null,
                registeredCount: Number(r.registered_count || 0),
                startDate: r.start_date,
                registrationDeadline: r.registration_deadline,
            })),
        };
    }
    if (view === 'COMMUNITIES') {
        let q = db('alumni_communities').where({ college_id: actor.collegeId });
        if (query.status)
            q = q.where('status', String(query.status));
        else
            q = q.where('status', 'ACTIVE');
        const rows = await q.orderBy('name', 'asc').limit(200);
        return {
            ...base,
            communities: rows.map((r) => ({
                id: Number(r.id),
                name: r.name,
                type: r.type,
                status: r.status,
                city: r.city,
                batchYear: r.batch_year,
                departmentId: r.department_id != null ? Number(r.department_id) : null,
            })),
        };
    }
    if (view === 'SUGGESTIONS') {
        const rows = await db('alumni_recognition_suggestions as s')
            .leftJoin('alumni_profiles as ap', 'ap.id', 's.alumni_profile_id')
            .where('s.college_id', actor.collegeId)
            .where('s.status', query.status ? String(query.status) : 'OPEN')
            .select('s.*', 'ap.historical_name as alumni_name')
            .orderBy('s.id', 'desc')
            .limit(100);
        return {
            ...base,
            suggestions: rows.map((r) => ({
                id: Number(r.id),
                suggestionType: r.suggestion_type,
                title: r.title,
                category: r.category,
                status: r.status,
                alumniProfileId: Number(r.alumni_profile_id),
                alumniName: r.alumni_name,
                rationale: r.rationale,
            })),
        };
    }
    if (view === 'RECIPROCITY') {
        const since = new Date(Date.now() - 12 * 30 * 86400000);
        let contributorIds = [];
        if (await db.schema.hasTable('alumni_crm_outcomes')) {
            const rows = await db('alumni_crm_outcomes')
                .where({ college_id: actor.collegeId, verification_status: 'VERIFIED' })
                .where('created_at', '>=', since)
                .groupBy('alumni_profile_id')
                .havingRaw('COUNT(*) >= 2')
                .select('alumni_profile_id')
                .count('* as c');
            contributorIds = rows.map((r) => Number(r.alumni_profile_id));
        }
        const guardrails = await batchReciprocityGuardrails({
            collegeId: actor.collegeId,
            alumniProfileIds: contributorIds,
            months: 12,
        });
        const triggered = contributorIds.filter((id) => guardrails.get(id)?.triggered);
        const profiles = triggered.length
            ? await db('alumni_profiles').whereIn('id', triggered).select('id', 'historical_name')
            : [];
        const nameMap = new Map(profiles.map((p) => [Number(p.id), p.historical_name]));
        return {
            ...base,
            reciprocityReminders: triggered.map((id) => ({
                alumniProfileId: id,
                alumniName: nameMap.get(id) || null,
                guardrail: guardrails.get(id),
            })),
            note: 'Factual reciprocity reminders only — never an automatic eligibility block',
        };
    }
    return base;
}
export async function getRecognitionAnalytics(actor) {
    await requireTables();
    assertAccess(actor);
    const pendingNominations = await scopeNominations(actor, db('alumni_recognition_nominations as n').leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id'))
        .whereIn('n.status', ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'])
        .countDistinct('n.id as c')
        .first()
        .then((r) => Number(r?.c || 0));
    const evidenceRequired = await scopeNominations(actor, db('alumni_recognition_nominations as n').leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id'))
        .where('n.status', 'MORE_EVIDENCE_REQUIRED')
        .countDistinct('n.id as c')
        .first()
        .then((r) => Number(r?.c || 0));
    const reviewDue = await scopeNominations(actor, db('alumni_recognition_nominations as n').leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id'))
        .whereIn('n.status', ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'])
        .countDistinct('n.id as c')
        .first()
        .then((r) => Number(r?.c || 0));
    const approvedRecognitions = await db('alumni_recognition_records')
        .where({ college_id: actor.collegeId })
        .whereIn('status', ['ISSUED', 'CORRECTED'])
        .count('* as c')
        .first()
        .then((r) => Number(r?.c || 0));
    const upcomingPrograms = await scopePrograms(actor, db('alumni_recognition_programs as p'))
        .whereIn('p.status', ['DRAFT', 'NOMINATIONS_OPEN', 'REVIEW', 'APPROVED'])
        .count('* as c')
        .first()
        .then((r) => Number(r?.c || 0));
    const openValueOfferings = (await db.schema.hasTable('alumni_value_offerings'))
        ? await db('alumni_value_offerings')
            .where({ college_id: actor.collegeId })
            .whereIn('status', ['OPEN', 'FULL'])
            .count('* as c')
            .first()
            .then((r) => Number(r?.c || 0))
        : 0;
    const recentContributionSuggestions = (await db.schema.hasTable('alumni_recognition_suggestions'))
        ? await db('alumni_recognition_suggestions')
            .where({ college_id: actor.collegeId, status: 'OPEN' })
            .where('suggestion_type', 'CONSIDER_FOR_RECOGNITION')
            .count('* as c')
            .first()
            .then((r) => Number(r?.c || 0))
        : 0;
    let reciprocityGuardrailCount = 0;
    if (await db.schema.hasTable('alumni_crm_outcomes')) {
        const since = new Date(Date.now() - 12 * 30 * 86400000);
        const rows = await db('alumni_crm_outcomes')
            .where({ college_id: actor.collegeId, verification_status: 'VERIFIED' })
            .where('created_at', '>=', since)
            .groupBy('alumni_profile_id')
            .havingRaw('COUNT(*) >= 2')
            .select('alumni_profile_id');
        const ids = rows.map((r) => Number(r.alumni_profile_id));
        if (ids.length) {
            const guardrails = await batchReciprocityGuardrails({
                collegeId: actor.collegeId,
                alumniProfileIds: ids,
                months: 12,
            });
            reciprocityGuardrailCount = ids.filter((id) => guardrails.get(id)?.triggered).length;
        }
    }
    return {
        pendingNominations,
        evidenceRequired,
        reviewDue,
        approvedRecognitions,
        upcomingPrograms,
        openValueOfferings,
        recentContributionSuggestions,
        reciprocityGuardrailCount,
    };
}
/**
 * C6.29 — operational management summary only (not institutional impact / C7).
 */
export async function getManagementSummary(actor) {
    await requireTables();
    assertAccess(actor);
    const metrics = await getRecognitionAnalytics(actor);
    const byProgramStatusRows = await scopePrograms(actor, db('alumni_recognition_programs as p'))
        .select('p.status')
        .count('* as c')
        .groupBy('p.status');
    const programsByStatus = {};
    for (const r of byProgramStatusRows) {
        programsByStatus[r.status] = Number(r.c || 0);
    }
    const byNomStatusRows = await scopeNominations(actor, db('alumni_recognition_nominations as n').leftJoin('alumni_profiles as ap', 'ap.id', 'n.alumni_profile_id'))
        .select('n.status')
        .countDistinct('n.id as c')
        .groupBy('n.status');
    const nominationsByStatus = {};
    for (const r of byNomStatusRows) {
        nominationsByStatus[r.status] = Number(r.c || 0);
    }
    const pendingConsentSpotlights = (await db.schema.hasTable('alumni_spotlights'))
        ? await db('alumni_spotlights')
            .where({ college_id: actor.collegeId, publication_status: 'PENDING_CONSENT' })
            .count('* as c')
            .first()
            .then((r) => Number(r?.c || 0))
        : 0;
    const activeCommunities = (await db.schema.hasTable('alumni_communities'))
        ? await db('alumni_communities')
            .where({ college_id: actor.collegeId, status: 'ACTIVE' })
            .count('* as c')
            .first()
            .then((r) => Number(r?.c || 0))
        : 0;
    return {
        metrics,
        programsByStatus,
        nominationsByStatus,
        pendingConsentSpotlights,
        activeCommunities,
        sourceOfTruth: getSourceOfTruthMatrix(),
        note: 'C6.29 operational summary only — recognition decisions remain human; not C7 impact reporting',
    };
}
