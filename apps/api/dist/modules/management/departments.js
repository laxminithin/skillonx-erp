/**
 * Management & Executive Portal — Department Scorecards.
 *
 * Transparent per-department metrics for leadership comparison. No arbitrary
 * composite "department score" is invented — each category stands on its own,
 * sourced from the efficient set-based metric provider. The single-department
 * drilldown reuses the canonical academic-leadership department overview.
 */
import * as leadershipQueries from '../academicLeadership/queries.js';
import { assertManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
import { departmentComparison } from './metrics.js';
export async function departmentScorecards(actor) {
    assertManagementPermission(actor, 'management.departments.view');
    const rows = await departmentComparison(actor.collegeId);
    return { departments: rows, count: rows.length };
}
export async function departmentDetail(actor, departmentId) {
    assertManagementPermission(actor, 'management.departments.view');
    const a = domainActor(actor);
    return await safe(() => leadershipQueries.departmentOverview(a, departmentId));
}
