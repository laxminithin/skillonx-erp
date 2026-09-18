/**
 * Management & Executive Portal — Institution Command Center.
 *
 * Answers: what's happening, is the institution healthy, where are the risks,
 * what needs leadership attention. Institution KPIs and the department
 * comparison come from the efficient executive metric provider (set-based, no
 * N+1); finance and succession come from their canonical single-pass reads.
 * Each KPI carries value + provenance + drilldown.
 */
import * as financeReports from '../finance/reports.js';
import * as successionDash from '../hr/succession/dashboard.js';
import { assertManagementPermission, hasManagementPermission, managementCapabilities } from './access.js';
import { domainActor, num, safe } from './sources.js';
import { institutionKpis, departmentComparison } from './metrics.js';
import { listExceptions } from './exceptions.js';
import { listApprovals } from './approvals.js';
export async function commandCenter(actor) {
    assertManagementPermission(actor, 'management.dashboard.view');
    const a = domainActor(actor);
    const [kpiBase, comparison, finance, succession] = await Promise.all([
        institutionKpis(a.collegeId),
        hasManagementPermission(actor, 'management.departments.view')
            ? departmentComparison(a.collegeId)
            : Promise.resolve([]),
        hasManagementPermission(actor, 'management.finance.view')
            ? safe(() => financeReports.financeDashboard(a))
            : Promise.resolve({ available: false, reason: 'FORBIDDEN' }),
        hasManagementPermission(actor, 'management.succession.view')
            ? safe(() => successionDash.coverageMetrics(a))
            : Promise.resolve({ available: false, reason: 'FORBIDDEN' }),
    ]);
    const exceptions = hasManagementPermission(actor, 'management.exceptions.view')
        ? await listExceptions(actor)
        : null;
    const approvals = hasManagementPermission(actor, 'management.approvals.view')
        ? await listApprovals(actor)
        : null;
    const kpis = [
        metric('students', 'Students', kpiBase.students, 'count', 'academics', '/management/academics'),
        metric('faculty', 'Faculty', kpiBase.faculty, 'count', 'academics', '/management/workforce'),
        metric('programs', 'Active Programs', kpiBase.programs, 'count', 'academics', '/management/academics'),
        pctMetric('studentAttendance', 'Student Attendance', kpiBase.studentAttendancePct, 'academics', '/management/academics/attendance'),
        pctMetric('facultyAttendance', 'Faculty Attendance', kpiBase.facultyAttendancePct, 'hr', '/management/workforce'),
    ];
    if (finance.available) {
        kpis.push(currencyMetric('collected', 'Fees Collected', finance.data.collected, '/management/finance'), currencyMetric('outstanding', 'Fees Outstanding', finance.data.outstanding, '/management/finance/outstanding'));
    }
    if (succession.available) {
        kpis.push(pctMetric('successionCoverage', 'Succession Coverage', succession.data.coveragePct, 'hr', '/management/succession'));
    }
    if (exceptions)
        kpis.push(metric('exceptions', 'Open Risks', exceptions.total, 'count', 'governance', '/management/exceptions'));
    if (approvals)
        kpis.push(metric('approvals', 'Pending Approvals', approvals.total, 'count', 'governance', '/management/approvals'));
    return {
        capabilities: managementCapabilities(actor),
        kpis,
        academicHealth: kpiBase,
        departmentComparison: comparison,
        finance: finance.available ? finance.data : null,
        succession: succession.available ? succession.data : null,
        exceptions: exceptions ? { total: exceptions.total, byCategory: exceptions.byCategory, top: exceptions.items.slice(0, 5) } : null,
        approvals: approvals ? { total: approvals.total, byDomain: approvals.byDomain, top: approvals.items.slice(0, 5) } : null,
        generatedAt: new Date().toISOString(),
    };
}
function metric(key, label, value, unit, sourceDomain, drilldown) {
    return { key, label, value, unit, sourceDomain, drilldown };
}
function pctMetric(key, label, raw, sourceDomain, drilldown) {
    const noData = raw == null;
    return { key, label, value: noData ? null : num(raw), unit: 'percent', sourceDomain, drilldown, noData };
}
function currencyMetric(key, label, raw, drilldown) {
    return { key, label, value: num(raw), unit: 'currency', sourceDomain: 'finance', drilldown };
}
