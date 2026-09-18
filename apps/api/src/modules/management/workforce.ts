/**
 * Management & Executive Portal — People / Workforce aggregation.
 *
 * Consumes the frozen HRMS read layer (management dashboard, analytics,
 * recruitment/appraisal/L&D/succession reports). Every figure is produced by a
 * canonical HR service; this module composes them behind the executive
 * capability wall and never writes HR state.
 */
import * as hrManagement from '../hr/management.js';
import * as hrAnalytics from '../hr/analytics.js';
import * as recruitmentReports from '../hr/recruitmentReports.js';
import * as appraisalReports from '../hr/appraisalReports.js';
import * as ldHistory from '../hr/ld/history.js';
import * as successionDash from '../hr/succession/dashboard.js';
import { assertManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
import type { ManagementActor } from './types.js';

export async function workforceOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.hr.view');
  const a = domainActor(actor);
  const [headcount, workforce, attrition, joiners, separations] = await Promise.all([
    safe(() => hrAnalytics.currentHeadcount(a)),
    safe(() => hrManagement.managementDashboard(a)),
    safe(() => hrAnalytics.attrition(a)),
    safe(() => hrAnalytics.joinersTrend(a)),
    safe(() => hrAnalytics.separationsTrend(a)),
  ]);
  return { headcount, workforce, attrition, joiners, separations };
}

export async function recruitmentOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.recruitment.view');
  const a = domainActor(actor);
  return { funnel: await safe(() => recruitmentReports.recruitmentDashboard(a)) };
}

export async function performanceOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.performance.view');
  const a = domainActor(actor);
  const [completion, ratings, byDepartment, pending] = await Promise.all([
    safe(() => appraisalReports.completionReport(a)),
    safe(() => appraisalReports.ratingDistribution(a)),
    safe(() => appraisalReports.departmentSummary(a)),
    safe(() => appraisalReports.pendingReviews(a)),
  ]);
  // Note: confidential reviewer comments are never included — only aggregates.
  return { completion, ratings, byDepartment, pending };
}

export async function ldOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.ld.view');
  const a = domainActor(actor);
  return { dashboard: await safe(() => ldHistory.adminDashboard(a)) };
}

export async function successionOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.succession.view');
  const a = domainActor(actor);
  const [dashboard, coverage, risk] = await Promise.all([
    safe(() => successionDash.dashboard(a)),
    safe(() => successionDash.coverageMetrics(a)),
    safe(() => successionDash.talentRisk(a)),
  ]);
  // Confidential talent-assessment narrative is NOT surfaced — coverage +
  // readiness aggregates only.
  return { dashboard, coverage, risk };
}
