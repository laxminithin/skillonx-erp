import { db } from '../../db/index.js';
import { assertHrPermission } from './access.js';
export async function recruitmentDashboard(actor) {
    assertHrPermission(actor, 'hr.recruitment.view');
    const collegeId = actor.collegeId;
    const count = async (table, where = {}) => {
        const row = await db(table).where({ college_id: collegeId, ...where }).count({ c: '*' }).first();
        return Number(row?.c ?? 0);
    };
    const openRequisitions = await count('hr_recruitment_requisitions', { status: 'OPENED' });
    const publishedOpenings = await count('hr_job_openings', { status: 'PUBLISHED' });
    const activeApplications = await db('hr_recruitment_applications')
        .where({ college_id: collegeId })
        .whereNotIn('status', ['JOINED', 'REJECTED', 'WITHDRAWN', 'CANCELLED', 'OFFER_DECLINED', 'NO_SHOW'])
        .count({ c: '*' })
        .first();
    const issuedOffers = await count('hr_recruitment_offers', { status: 'ISSUED' });
    const acceptedOffers = await count('hr_recruitment_offers', { status: 'ACCEPTED' });
    const joined = await count('hr_recruitment_applications', { status: 'JOINED' });
    const interviewsScheduled = await count('hr_interviews', { status: 'SCHEDULED' });
    return {
        openRequisitions,
        publishedOpenings,
        activeApplications: Number(activeApplications?.c ?? 0),
        issuedOffers,
        acceptedOffers,
        joined,
        interviewsScheduled,
    };
}
export async function pipelineReport(actor, openingId) {
    assertHrPermission(actor, 'hr.recruitment.report');
    let q = db('hr_recruitment_applications')
        .where({ college_id: actor.collegeId })
        .select('status')
        .count({ c: '*' })
        .groupBy('status');
    if (openingId)
        q = q.andWhere({ opening_id: openingId });
    const rows = await q;
    return rows.map((r) => ({
        status: r.status,
        count: Number(r.c),
    }));
}
export async function timeToHireReport(actor) {
    assertHrPermission(actor, 'hr.recruitment.report');
    const rows = await db('hr_recruitment_applications')
        .where({ college_id: actor.collegeId, status: 'JOINED' })
        .whereNotNull('joined_at')
        .select('id', 'created_at', 'joined_at', 'opening_id')
        .orderBy('joined_at', 'desc')
        .limit(100);
    return rows.map((r) => {
        const start = new Date(String(r.created_at)).getTime();
        const end = new Date(String(r.joined_at)).getTime();
        const days = Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
        return {
            applicationId: Number(r.id),
            openingId: Number(r.opening_id),
            appliedAt: r.created_at,
            joinedAt: r.joined_at,
            daysToHire: days,
        };
    });
}
export async function sourceEffectivenessReport(actor) {
    assertHrPermission(actor, 'hr.recruitment.report');
    const rows = await db('hr_recruitment_candidates as c')
        .leftJoin('hr_recruitment_applications as a', 'a.candidate_id', 'c.id')
        .where({ 'c.college_id': actor.collegeId })
        .select('c.source')
        .countDistinct({ candidates: 'c.id' })
        .count({ applications: 'a.id' })
        .sum({ joined: db.raw("CASE WHEN a.status = 'JOINED' THEN 1 ELSE 0 END") })
        .groupBy('c.source');
    return rows.map((r) => ({
        source: r.source,
        candidates: Number(r.candidates ?? 0),
        applications: Number(r.applications ?? 0),
        joined: Number(r.joined ?? 0),
    }));
}
