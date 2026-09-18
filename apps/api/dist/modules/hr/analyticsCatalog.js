/**
 * HR Analytics — Metric Catalog & shared semantics.
 *
 * This module is the single, canonical definition point for every HR Analytics
 * metric. Formulas, status sets, date semantics and permission gates live here
 * so that a metric (e.g. HEADCOUNT, ATTRITION) is computed one way everywhere —
 * dashboards, drilldowns and exports all consume these definitions.
 *
 * HR Analytics is a READ layer. It never mutates canonical source records
 * (Employee Lifecycle, Attendance, Payroll, Recruitment, Appraisal, F&F).
 */
import { isAdminRole } from '../../utils/permissions.js';
import { hasHrPermission } from './access.js';
import { AppError } from '../../utils/errors.js';
// ── Canonical status sets (reconcile with Employee Lifecycle) ────────────────
/**
 * "In service" = currently employed. Excludes people who have not joined
 * (DRAFT, PRE_JOINING) and people who have left (SEPARATED, RETIRED,
 * TERMINATED, INACTIVE). Matches lifecycle separation semantics where the
 * terminal states are SEPARATED / RETIRED / TERMINATED.
 */
export const IN_SERVICE_STATUSES = [
    'ACTIVE',
    'PROBATION',
    'CONFIRMED',
    'ON_NOTICE',
    'SUSPENDED',
    'ON_LONG_LEAVE',
];
/** Terminal separation statuses applied by lifecycleSeparation. */
export const SEPARATED_STATUSES = ['SEPARATED', 'RETIRED', 'TERMINATED'];
/** Not-yet-joined statuses (excluded from headcount). */
export const PRE_SERVICE_STATUSES = ['DRAFT', 'PRE_JOINING'];
export const EMPLOYEE_CATEGORIES = ['FACULTY', 'NON_TEACHING', 'MANAGEMENT', 'CONTRACTUAL', 'OTHER'];
export const FACULTY_CATEGORIES = ['FACULTY'];
/** Tenure bands (years). Upper bound is exclusive. */
export const TENURE_BANDS = [
    { key: '<1y', label: '< 1 year', minYears: 0, maxYears: 1 },
    { key: '1-3y', label: '1–3 years', minYears: 1, maxYears: 3 },
    { key: '3-5y', label: '3–5 years', minYears: 3, maxYears: 5 },
    { key: '5-10y', label: '5–10 years', minYears: 5, maxYears: 10 },
    { key: '10y+', label: '10+ years', minYears: 10, maxYears: null },
];
/**
 * Minimum group size for sensitive aggregates (Payroll, Performance). Groups
 * smaller than this are suppressed to prevent trivial inference of an
 * individual's salary / rating.
 */
export const MIN_GROUP_SIZE = 3;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function assertDate(value, field) {
    if (!value || !DATE_RE.test(value))
        throw new AppError(400, `Invalid ${field}; expected YYYY-MM-DD`);
    return value;
}
export function todayISO() {
    // Asia/Kolkata canonical institution timezone.
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
/** Resolve a [from, to] date window from query params with sensible defaults. */
export function resolveRange(params) {
    if (params.academicYear) {
        const y = Number(params.academicYear);
        if (!Number.isInteger(y) || y < 1900 || y > 3000)
            throw new AppError(400, 'Invalid academicYear');
        return { from: `${y}-06-01`, to: `${y + 1}-05-31`, basis: 'ACADEMIC_YEAR' };
    }
    if (params.financialYear) {
        const y = Number(params.financialYear);
        if (!Number.isInteger(y) || y < 1900 || y > 3000)
            throw new AppError(400, 'Invalid financialYear');
        return { from: `${y}-04-01`, to: `${y + 1}-03-31`, basis: 'FINANCIAL_YEAR' };
    }
    if (params.from || params.to) {
        const to = assertDate(params.to ?? todayISO(), 'to');
        const from = assertDate(params.from ?? `${to.slice(0, 4)}-01-01`, 'from');
        if (from > to)
            throw new AppError(400, 'from must be on or before to');
        return { from, to, basis: 'CUSTOM_RANGE' };
    }
    // Default: trailing 12 months ending today.
    const to = todayISO();
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    d.setUTCDate(d.getUTCDate() + 1);
    return { from: d.toISOString().slice(0, 10), to, basis: 'CUSTOM_RANGE' };
}
/** Enumerate the calendar months (YYYY-MM-01 first-day markers) within a range. */
export function monthsInRange(from, to) {
    const out = [];
    let y = Number(from.slice(0, 4));
    let m = Number(from.slice(5, 7));
    const endY = Number(to.slice(0, 4));
    const endM = Number(to.slice(5, 7));
    let guard = 0;
    while ((y < endY || (y === endY && m <= endM)) && guard++ < 600) {
        out.push({ year: y, month: m, key: `${y}-${String(m).padStart(2, '0')}` });
        m += 1;
        if (m > 12) {
            m = 1;
            y += 1;
        }
    }
    return out;
}
/**
 * Resolve the analytics data scope for an actor. HOD-type actors are restricted
 * to their own department(s). Anyone holding a college-wide reporting/management
 * capability (admins, HR managers, principal, HR executives, payroll officers)
 * sees the whole college.
 */
export function resolveAnalyticsScope(actor) {
    const collegeWide = isAdminRole(actor.role) ||
        hasHrPermission(actor, 'hr.report.view') ||
        hasHrPermission(actor, 'hr.management.view');
    if (collegeWide)
        return { collegeId: actor.collegeId, departmentIds: null };
    const depts = actor.hodDepartmentIds?.length
        ? actor.hodDepartmentIds
        : actor.departmentId
            ? [actor.departmentId]
            : [];
    return { collegeId: actor.collegeId, departmentIds: [...new Set(depts.map(Number))] };
}
/**
 * Narrow a scope by an optional requested department filter. A department-scoped
 * actor may only request a department inside their own scope.
 */
export function applyDepartmentFilter(scope, requestedDeptId) {
    if (requestedDeptId == null)
        return scope.departmentIds;
    const dept = Number(requestedDeptId);
    if (scope.departmentIds === null)
        return [dept];
    if (!scope.departmentIds.includes(dept)) {
        throw new AppError(403, 'Requested department is outside your analytics scope');
    }
    return [dept];
}
/** True when the resolved scope can see no data at all (e.g. HOD without a dept). */
export function isEmptyScope(departmentIds) {
    return Array.isArray(departmentIds) && departmentIds.length === 0;
}
const COMMON_FILTERS = ['department', 'employmentType', 'employeeCategory'];
export const METRIC_CATALOG = [
    {
        key: 'headcount.current',
        name: 'Current Headcount',
        description: 'Employees currently in service as of a date.',
        sourceDomain: 'Employee Lifecycle',
        calculation: `count(employees) where employment_status IN (${IN_SERVICE_STATUSES.join(', ')}) and date_of_joining <= as_of`,
        timeGrain: ['AS_OF'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: true,
    },
    {
        key: 'headcount.historical',
        name: 'Historical Headcount',
        description: 'In-service headcount as of a past date, derived from effective employment dates — never from today\'s active list.',
        sourceDomain: 'Employee Lifecycle',
        calculation: 'count(employees) where date_of_joining <= as_of AND (last_working_date IS NULL OR last_working_date > as_of) AND status not pre-service',
        timeGrain: ['AS_OF'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: true,
    },
    {
        key: 'joiners',
        name: 'Joiners',
        description: 'Employees whose canonical date_of_joining falls within the period. Recruitment offer acceptance is NOT a join.',
        sourceDomain: 'Employee Lifecycle',
        calculation: 'count(employees) where date_of_joining BETWEEN from AND to',
        timeGrain: ['CALENDAR_MONTH', 'CUSTOM_RANGE', 'ACADEMIC_YEAR', 'FINANCIAL_YEAR'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: true,
    },
    {
        key: 'separations',
        name: 'Separations',
        description: 'Approved/completed separations within the period, by type (resignation, termination, retirement, ...).',
        sourceDomain: 'Employee Lifecycle',
        calculation: 'count(employee_separation_requests) status COMPLETED with last_working_date within period',
        timeGrain: ['CALENDAR_MONTH', 'CUSTOM_RANGE', 'ACADEMIC_YEAR', 'FINANCIAL_YEAR'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: true,
    },
    {
        key: 'attrition',
        name: 'Attrition Rate',
        description: 'Separations during the period divided by average headcount during the period, expressed as a percentage.',
        sourceDomain: 'Employee Lifecycle',
        calculation: 'separations / ((headcount_start + headcount_end) / 2) * 100',
        timeGrain: ['CUSTOM_RANGE', 'ACADEMIC_YEAR', 'FINANCIAL_YEAR'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: false,
        rounding: '2 decimal places',
    },
    {
        key: 'retention',
        name: 'Retention Rate',
        description: 'Share of employees in service at the start of the period who are still in service at the end. Computed independently of attrition.',
        sourceDomain: 'Employee Lifecycle',
        calculation: '(employees in service at start AND still in service at end) / (in service at start) * 100',
        timeGrain: ['CUSTOM_RANGE', 'ACADEMIC_YEAR', 'FINANCIAL_YEAR'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: false,
        rounding: '2 decimal places',
    },
    {
        key: 'tenure.bands',
        name: 'Tenure Distribution',
        description: 'In-service employees bucketed by completed years of service (date_of_joining to as_of).',
        sourceDomain: 'Employee Lifecycle',
        calculation: 'bucket(as_of - date_of_joining) into configured tenure bands',
        timeGrain: ['AS_OF'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view',
        drilldown: true,
    },
    {
        key: 'attendance.rate',
        name: 'Attendance Rate',
        description: 'Present days over payable days from canonical monthly attendance. Never recomputed from raw punches.',
        sourceDomain: 'Attendance & Leave',
        calculation: 'sum(present_days) / sum(payable_days) * 100 over employee_monthly_attendance',
        timeGrain: ['CALENDAR_MONTH', 'CUSTOM_RANGE'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view + hr.attendance.view',
        drilldown: false,
        rounding: '2 decimal places',
    },
    {
        key: 'lop.days',
        name: 'LOP Days',
        description: 'Loss-of-pay days from canonical monthly attendance. Salary impact is owned by Payroll.',
        sourceDomain: 'Attendance & Leave',
        calculation: 'sum(lop_days) over employee_monthly_attendance',
        timeGrain: ['CALENDAR_MONTH', 'CUSTOM_RANGE'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view + hr.attendance.view',
        drilldown: false,
    },
    {
        key: 'leave.days',
        name: 'Leave Utilisation',
        description: 'Approved leave days by leave type (aggregate classification only — reasons are never surfaced).',
        sourceDomain: 'Attendance & Leave',
        calculation: 'sum(day-equivalents) of hr_leave_requests in APPROVED/COMPLETED by leave_type',
        timeGrain: ['CUSTOM_RANGE'],
        filters: COMMON_FILTERS,
        permission: 'hr.analytics.view + hr.leave.view',
        drilldown: false,
    },
    {
        key: 'payroll.cost',
        name: 'Payroll Cost',
        description: 'Gross / deduction / net totals from locked/approved payroll runs. Never recalculated.',
        sourceDomain: 'Payroll',
        calculation: 'sum over payroll_runs of gross_total, deduction_total, net_total (LOCKED/POSTED/APPROVED)',
        timeGrain: ['CALENDAR_MONTH', 'CUSTOM_RANGE', 'FINANCIAL_YEAR'],
        filters: ['department'],
        permission: 'hr.analytics.payroll.aggregate',
        drilldown: false,
        rounding: 'decimal(14,2) source precision',
    },
    {
        key: 'payroll.variance',
        name: 'Payroll Variance',
        description: 'Run-over-run change in gross/net/deductions/LOP. Uses Payroll\'s own variance service.',
        sourceDomain: 'Payroll',
        calculation: 'delegated to payrollReports.payrollVarianceReport',
        timeGrain: ['CALENDAR_MONTH'],
        filters: [],
        permission: 'hr.analytics.payroll.aggregate',
        drilldown: false,
    },
    {
        key: 'recruitment.funnel',
        name: 'Recruitment Funnel',
        description: 'Distinct candidates by furthest stage reached: applied → screened → shortlisted → interviewed → selected → offered → accepted → joined.',
        sourceDomain: 'Recruitment',
        calculation: 'stage counts over hr_recruitment_applications (a candidate counted once at their furthest stage)',
        timeGrain: ['CUSTOM_RANGE'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.recruitment.view',
        drilldown: true,
    },
    {
        key: 'recruitment.timeToFill',
        name: 'Time to Fill',
        description: 'Days from requisition approval to actual Lifecycle joining. Single definition shared with Recruitment.',
        sourceDomain: 'Recruitment',
        calculation: 'avg(joined_at - requisition.approved_at) for joined applications',
        timeGrain: ['CUSTOM_RANGE'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.recruitment.view',
        drilldown: false,
        rounding: '1 decimal place (days)',
    },
    {
        key: 'recruitment.offerAcceptance',
        name: 'Offer Acceptance Rate',
        description: 'Accepted offers over decided offers (accepted + declined + expired). Superseded versions excluded.',
        sourceDomain: 'Recruitment',
        calculation: 'accepted / (accepted + declined + expired) * 100 over latest offer per application',
        timeGrain: ['CUSTOM_RANGE'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.recruitment.view',
        drilldown: false,
        rounding: '2 decimal places',
    },
    {
        key: 'performance.completion',
        name: 'Appraisal Completion',
        description: 'Share of enrolled appraisals reaching each stage (self / review / finalized) within a cycle.',
        sourceDomain: 'Performance & Appraisal',
        calculation: 'stage counts over hr_employee_appraisals for a cycle',
        timeGrain: ['CUSTOM_RANGE'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.performance.view',
        drilldown: false,
    },
    {
        key: 'performance.distribution',
        name: 'Rating Distribution',
        description: 'Distribution of FINALIZED ratings only. Reviewer-only comments are never exposed.',
        sourceDomain: 'Performance & Appraisal',
        calculation: 'count by final_rating_label where finalized_at IS NOT NULL (min group size enforced)',
        timeGrain: ['CUSTOM_RANGE'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.performance.view',
        drilldown: false,
    },
    {
        key: 'fnf.aging',
        name: 'F&F Aging',
        description: 'Pending / settled F&F case counts and payable / receivable totals from canonical F&F.',
        sourceDomain: 'Final Settlement',
        calculation: 'case counts + sum(net) by status bucket over hr F&F cases',
        timeGrain: ['AS_OF'],
        filters: ['department'],
        permission: 'hr.analytics.view + hr.fnf.view',
        drilldown: false,
        rounding: 'source precision',
    },
];
export function getMetricCatalog() {
    return METRIC_CATALOG;
}
// ── Numeric helpers (percentages / rounding) ─────────────────────────────────
export function pct(numerator, denominator, dp = 2) {
    if (!denominator || denominator <= 0)
        return 0;
    const v = (numerator / denominator) * 100;
    return round(v, dp);
}
export function round(value, dp = 2) {
    if (!Number.isFinite(value))
        return 0;
    const f = 10 ** dp;
    return Math.round(value * f) / f;
}
export function toNum(v) {
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : 0;
}
