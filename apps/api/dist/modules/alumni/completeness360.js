import { db } from '../../db/index.js';
function parseJsonArr(raw) {
    if (raw == null)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === 'string') {
        try {
            const v = JSON.parse(raw);
            return Array.isArray(v) ? v : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
export async function computeAlumniCompleteness(input) {
    const p = input.profile;
    const sections = [];
    // Identity
    {
        const messages = [];
        let status = 'COMPLETE';
        if (!p.historical_name || !p.historical_usn || !p.email) {
            status = 'PARTIAL';
            messages.push('Core identity fields missing.');
        }
        else if (!p.current_city && !p.profile_photo_url) {
            status = 'PARTIAL';
            messages.push('Add location and/or profile photo.');
        }
        if (!p.contact_verified_at)
            messages.push('Contact not recently confirmed.');
        sections.push({ key: 'IDENTITY', label: 'Identity', status, messages });
    }
    // Academic — authoritative snapshot
    {
        const ok = Boolean(p.graduation_year && (p.historical_department_id || p.historical_program_id));
        sections.push({
            key: 'ACADEMIC',
            label: 'Academic',
            status: ok ? 'AUTHORITATIVE' : 'PARTIAL',
            messages: ok ? ['Linked to institutional academic record.'] : ['Graduation year or programme linkage incomplete.'],
        });
    }
    // Career
    {
        const current = input.employment.find((e) => e.is_current);
        let status = 'NOT_PROVIDED';
        const messages = [];
        if (input.employment.length === 0) {
            status = 'NOT_PROVIDED';
            messages.push('No employment history provided.');
        }
        else if (!current) {
            status = 'NEEDS_UPDATE';
            messages.push('Employment history present but no current role marked.');
        }
        else if (!current.organization || !current.designation) {
            status = 'PARTIAL';
            messages.push('Current role incomplete.');
        }
        else {
            status = 'COMPLETE';
        }
        sections.push({ key: 'CAREER', label: 'Career', status, messages });
    }
    // Skills
    {
        const skills = parseJsonArr(p.skills);
        const tech = parseJsonArr(p.technologies);
        const domains = parseJsonArr(p.domains_expertise);
        const total = skills.length + tech.length + domains.length + parseJsonArr(p.certifications).length;
        let status = 'NOT_PROVIDED';
        if (total === 0)
            status = 'NOT_PROVIDED';
        else if (total < 3)
            status = 'PARTIAL';
        else
            status = 'COMPLETE';
        sections.push({
            key: 'SKILLS',
            label: 'Skills',
            status,
            messages: total === 0 ? ['Skills and expertise not provided.'] : [],
        });
    }
    // Achievements
    {
        const n = input.achievements.length + input.entrepreneurship.length + input.higherStudies.length;
        sections.push({
            key: 'ACHIEVEMENTS',
            label: 'Achievements',
            status: n === 0 ? 'NOT_PROVIDED' : n < 2 ? 'PARTIAL' : 'COMPLETE',
            messages: n === 0 ? ['No achievements, entrepreneurship, or higher studies recorded.'] : [],
        });
    }
    // Engagement preferences
    {
        const explicit = [
            p.open_to_mentoring,
            p.open_to_recruitment,
            p.open_to_internships,
            p.open_to_project_mentoring,
            p.open_to_expert_sessions,
            p.open_to_bos_advisory,
            p.open_to_research_collaboration,
            p.open_to_startup_mentoring,
            p.open_to_industry_collaboration,
            p.open_to_institutional_contribution,
        ].filter((v) => v != null).length;
        const caps = input.capabilities.filter((c) => c.is_active !== false).length;
        let status = 'NOT_PROVIDED';
        if (explicit === 0 && caps === 0 && !p.mentorship_available && !p.networking_available) {
            status = 'NOT_PROVIDED';
        }
        else if (explicit < 3 && caps === 0) {
            status = 'PARTIAL';
        }
        else {
            status = 'COMPLETE';
        }
        sections.push({
            key: 'ENGAGEMENT_PREFERENCES',
            label: 'Engagement Preferences',
            status,
            messages: status === 'NOT_PROVIDED' ? ['Engagement interests not provided.'] : [],
        });
    }
    // Institutional relationship
    {
        const r = input.relationship;
        const total = r.eventsAttended + r.contributions + r.mentoringInteractions;
        sections.push({
            key: 'INSTITUTIONAL_RELATIONSHIP',
            label: 'Institutional Relationship',
            status: total === 0 ? 'NOT_PROVIDED' : total < 2 ? 'PARTIAL' : 'COMPLETE',
            messages: total === 0 ? ['No recorded institutional interactions yet.'] : [],
        });
    }
    const scored = sections.filter((s) => s.status !== 'AUTHORITATIVE' || true);
    const scoreOf = (s) => {
        if (s === 'COMPLETE' || s === 'AUTHORITATIVE')
            return 1;
        if (s === 'PARTIAL' || s === 'NEEDS_UPDATE')
            return 0.5;
        return 0;
    };
    const coveragePercent = Math.round((scored.reduce((a, s) => a + scoreOf(s.status), 0) / scored.length) * 100);
    const result = {
        coveragePercent,
        sections,
        computedAt: new Date().toISOString(),
    };
    if (await db.schema.hasColumn('alumni_profiles', 'completeness_cache')) {
        await db('alumni_profiles')
            .where({ id: p.id, college_id: p.college_id })
            .update({
            completeness_cache: JSON.stringify(result),
            completeness_updated_at: db.fn.now(),
        });
    }
    return result;
}
