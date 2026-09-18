/**
 * Management & Executive Portal — Finance + Payroll executive summaries.
 *
 * Fee/collection figures come from the canonical Finance dashboard. Payroll is
 * sourced from `hr/analytics.payrollCostTrend`, which reads locked/approved
 * runs and NEVER recalculates — and is gated on `hr.analytics.payroll.aggregate`
 * so individual salaries stay highly-restricted. Detail-level payroll requires
 * the explicit `management.payroll.detail` capability (not held by
 * MANAGEMENT / CHAIRMAN by default).
 */
import * as financeReports from '../finance/reports.js';
import * as hrAnalytics from '../hr/analytics.js';
import { assertManagementPermission, hasManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
export async function financeOverview(actor) {
    assertManagementPermission(actor, 'management.finance.view');
    const a = domainActor(actor);
    const [summary, outstanding] = await Promise.all([
        safe(() => financeReports.financeDashboard(a)),
        safe(() => financeReports.outstandingReport(a, {})),
    ]);
    return { summary, outstanding };
}
export async function payrollSummary(actor) {
    assertManagementPermission(actor, 'management.payroll.summary');
    const a = domainActor(actor);
    const trend = await safe(() => hrAnalytics.payrollCostTrend(a));
    return {
        trend,
        canSeeDetail: hasManagementPermission(actor, 'management.payroll.detail'),
        classification: 'AGGREGATE_ONLY',
        note: 'Individual salaries are highly-restricted and excluded by default.',
    };
}
