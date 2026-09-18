import { db } from '../../db/index.js';
export async function resolveRoute(input) {
    const rules = await db('service_routing_rules')
        .where({ college_id: input.collegeId, is_active: true })
        .orderBy('priority', 'asc')
        .orderBy('id', 'asc');
    for (const rule of rules) {
        if (rule.match_category_id != null && Number(rule.match_category_id) !== input.categoryId)
            continue;
        if (rule.match_source_module != null && String(rule.match_source_module) !== input.sourceModule)
            continue;
        if (rule.match_building != null && String(rule.match_building).toLowerCase() !== String(input.building ?? '').toLowerCase())
            continue;
        if (rule.match_department_id != null && Number(rule.match_department_id) !== input.departmentId)
            continue;
        const team = await db('service_teams').where({ id: rule.target_team_id, college_id: input.collegeId, status: 'ACTIVE' }).first();
        if (!team)
            continue;
        const why = rule.explanation
            ? String(rule.explanation)
            : `Routing rule "${rule.name}" matched → ${team.name}`;
        return { teamId: Number(team.id), explanation: why, triaged: Boolean(team.is_triage) };
    }
    // Category default team.
    if (input.categoryId) {
        const cat = await db('service_categories').where({ id: input.categoryId, college_id: input.collegeId }).first();
        if (cat?.default_team_id) {
            const team = await db('service_teams').where({ id: cat.default_team_id, college_id: input.collegeId, status: 'ACTIVE' }).first();
            if (team) {
                return {
                    teamId: Number(team.id),
                    explanation: `Category "${cat.name}" default team → ${team.name}`,
                    triaged: Boolean(team.is_triage),
                };
            }
        }
    }
    // Triage fallback.
    const triage = await db('service_teams').where({ college_id: input.collegeId, is_triage: true, status: 'ACTIVE' }).first();
    if (triage) {
        return {
            teamId: Number(triage.id),
            explanation: 'No routing rule or category default matched — sent to Triage queue for manual routing.',
            triaged: true,
        };
    }
    return { teamId: null, explanation: 'No team resolved — awaiting triage configuration.', triaged: true };
}
