import { db } from '../../db/index.js';
/**
 * Read-only institutional relationship summary.
 * Every metric traces to source records — no fabricated counters.
 */
export async function buildRelationshipSummary(collegeId, alumniProfileId, studentId) {
    const sources = [];
    async function safeCount(metric, source, build) {
        try {
            const row = await build();
            const count = Number(row?.c ?? 0);
            const lastAt = row?.last_at ? new Date(row.last_at).toISOString() : null;
            sources.push({ metric, source, count, lastAt });
            return { count, lastAt };
        }
        catch {
            sources.push({ metric, source, count: 0, lastAt: null });
            return { count: 0, lastAt: null };
        }
    }
    const events = await safeCount('eventsAttended', 'alumni_event_registrations', async () => {
        if (!(await db.schema.hasTable('alumni_event_registrations')))
            return { c: 0 };
        return db('alumni_event_registrations')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['REGISTERED', 'ATTENDED', 'CHECKED_IN'])
            .count({ c: '*' })
            .max('registered_at as last_at')
            .first();
    });
    const mentoring = await safeCount('mentoringInteractions', 'mentor_assignments+mentor_meetings', async () => {
        if (!(await db.schema.hasTable('mentor_assignments')))
            return { c: 0 };
        const assignments = await db('mentor_assignments')
            .where({ college_id: collegeId, student_id: studentId })
            .select('id');
        const ids = assignments.map((a) => Number(a.id));
        if (!ids.length)
            return { c: 0 };
        if (!(await db.schema.hasTable('mentor_meetings')))
            return { c: ids.length, last_at: null };
        return db('mentor_meetings')
            .whereIn('assignment_id', ids)
            .count({ c: '*' })
            .max('meeting_date as last_at')
            .first()
            .then((r) => ({ c: Number(r?.c ?? 0) || ids.length, last_at: r?.last_at ?? null }));
    });
    const studentsMentored = await safeCount('studentsMentored', 'alumni_engagement:MENTORING', async () => {
        if (!(await db.schema.hasTable('alumni_engagement')))
            return { c: 0 };
        return db('alumni_engagement')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('engagement_type', ['MENTORING', 'STUDENT_MENTORED', 'MENTORSHIP'])
            .count({ c: '*' })
            .max('occurred_at as last_at')
            .first();
    });
    const recruitment = await safeCount('recruitmentInteractions', 'placement_offers|alumni_opportunities', async () => {
        let placementCount = 0;
        let lastAt = null;
        if (await db.schema.hasTable('placement_offers')) {
            const po = await db('placement_offers')
                .where({ college_id: collegeId, student_id: studentId })
                .count({ c: '*' })
                .max('updated_at as last_at')
                .first();
            placementCount = Number(po?.c ?? 0);
            lastAt = po?.last_at ?? null;
        }
        let oppCount = 0;
        if (await db.schema.hasTable('alumni_opportunities')) {
            const ao = await db('alumni_opportunities')
                .where({ college_id: collegeId, submitted_by_alumni_id: alumniProfileId })
                .whereIn('opportunity_type', ['JOB', 'INTERNSHIP', 'REFERRAL'])
                .count({ c: '*' })
                .max('created_at as last_at')
                .first();
            oppCount = Number(ao?.c ?? 0);
            if (ao?.last_at && (!lastAt || new Date(ao.last_at) > new Date(lastAt)))
                lastAt = ao.last_at;
        }
        return { c: placementCount + oppCount, last_at: lastAt };
    });
    const internships = await safeCount('internshipsEnabled', 'student_experiences|alumni_opportunities:INTERNSHIP', async () => {
        let c = 0;
        let lastAt = null;
        if (await db.schema.hasTable('student_experiences')) {
            const se = await db('student_experiences')
                .where({ college_id: collegeId, student_id: studentId })
                .whereIn('experience_type', ['INTERNSHIP', 'INTERN', 'INTERNSHIP_TRAINING'])
                .count({ c: '*' })
                .max('updated_at as last_at')
                .first();
            c += Number(se?.c ?? 0);
            lastAt = se?.last_at ?? null;
        }
        if (await db.schema.hasTable('alumni_opportunities')) {
            const ao = await db('alumni_opportunities')
                .where({ college_id: collegeId, submitted_by_alumni_id: alumniProfileId, opportunity_type: 'INTERNSHIP', status: 'APPROVED' })
                .count({ c: '*' })
                .max('created_at as last_at')
                .first();
            c += Number(ao?.c ?? 0);
            if (ao?.last_at && (!lastAt || new Date(ao.last_at) > new Date(lastAt)))
                lastAt = ao.last_at;
        }
        return { c, last_at: lastAt };
    });
    const placements = await safeCount('placementsSupported', 'placement_offers:ACCEPTED|JOINED', async () => {
        if (!(await db.schema.hasTable('placement_offers')))
            return { c: 0 };
        return db('placement_offers')
            .where({ college_id: collegeId, student_id: studentId })
            .whereIn('offer_status', ['ACCEPTED', 'JOINED'])
            .count({ c: '*' })
            .max('updated_at as last_at')
            .first();
    });
    const expertSessions = await safeCount('expertSessions', 'alumni_engagement:EXPERT_TALK', async () => {
        if (!(await db.schema.hasTable('alumni_engagement')))
            return { c: 0 };
        return db('alumni_engagement')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('engagement_type', ['EXPERT_TALK', 'GUEST_LECTURE', 'WORKSHOP'])
            .count({ c: '*' })
            .max('occurred_at as last_at')
            .first();
    });
    const projects = await safeCount('projectsSupported', 'alumni_engagement:PROJECT|alumni_opportunities:PROJECT', async () => {
        let c = 0;
        let lastAt = null;
        if (await db.schema.hasTable('alumni_engagement')) {
            const eg = await db('alumni_engagement')
                .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
                .whereIn('engagement_type', ['PROJECT', 'PROJECT_SUPPORT'])
                .count({ c: '*' })
                .max('occurred_at as last_at')
                .first();
            c += Number(eg?.c ?? 0);
            lastAt = eg?.last_at ?? null;
        }
        if (await db.schema.hasTable('alumni_opportunities')) {
            const ao = await db('alumni_opportunities')
                .where({ college_id: collegeId, submitted_by_alumni_id: alumniProfileId, opportunity_type: 'PROJECT' })
                .count({ c: '*' })
                .max('created_at as last_at')
                .first();
            c += Number(ao?.c ?? 0);
            if (ao?.last_at && (!lastAt || new Date(ao.last_at) > new Date(lastAt)))
                lastAt = ao.last_at;
        }
        return { c, last_at: lastAt };
    });
    const contributions = await safeCount('contributions', 'alumni_contributions', async () => {
        if (!(await db.schema.hasTable('alumni_contributions')))
            return { c: 0 };
        return db('alumni_contributions')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .count({ c: '*' })
            .max('created_at as last_at')
            .first();
    });
    const recognition = await safeCount('recognitionReceived', 'alumni_achievements:INSTITUTION', async () => {
        if (!(await db.schema.hasTable('alumni_achievements')))
            return { c: 0 };
        return db('alumni_achievements')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('achievement_type', ['INSTITUTIONAL_RECOGNITION', 'AWARD', 'RECOGNITION'])
            .count({ c: '*' })
            .max('achievement_date as last_at')
            .first();
    });
    const lastDates = sources.map((s) => s.lastAt).filter(Boolean).map((d) => new Date(d).getTime());
    const lastInstitutionalInteraction = lastDates.length
        ? new Date(Math.max(...lastDates)).toISOString()
        : null;
    return {
        lastInstitutionalInteraction,
        eventsAttended: events.count,
        mentoringInteractions: mentoring.count,
        studentsMentored: studentsMentored.count,
        recruitmentInteractions: recruitment.count,
        internshipsEnabled: internships.count,
        placementsSupported: placements.count,
        expertSessions: expertSessions.count,
        projectsSupported: projects.count,
        contributions: contributions.count,
        recognitionReceived: recognition.count,
        sources,
    };
}
