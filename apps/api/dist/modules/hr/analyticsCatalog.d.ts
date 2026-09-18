import type { HrActor } from './types.js';
/**
 * "In service" = currently employed. Excludes people who have not joined
 * (DRAFT, PRE_JOINING) and people who have left (SEPARATED, RETIRED,
 * TERMINATED, INACTIVE). Matches lifecycle separation semantics where the
 * terminal states are SEPARATED / RETIRED / TERMINATED.
 */
export declare const IN_SERVICE_STATUSES: readonly ["ACTIVE", "PROBATION", "CONFIRMED", "ON_NOTICE", "SUSPENDED", "ON_LONG_LEAVE"];
/** Terminal separation statuses applied by lifecycleSeparation. */
export declare const SEPARATED_STATUSES: readonly ["SEPARATED", "RETIRED", "TERMINATED"];
/** Not-yet-joined statuses (excluded from headcount). */
export declare const PRE_SERVICE_STATUSES: readonly ["DRAFT", "PRE_JOINING"];
export declare const EMPLOYEE_CATEGORIES: readonly ["FACULTY", "NON_TEACHING", "MANAGEMENT", "CONTRACTUAL", "OTHER"];
export declare const FACULTY_CATEGORIES: readonly ["FACULTY"];
/** Tenure bands (years). Upper bound is exclusive. */
export declare const TENURE_BANDS: readonly [{
    readonly key: "<1y";
    readonly label: "< 1 year";
    readonly minYears: 0;
    readonly maxYears: 1;
}, {
    readonly key: "1-3y";
    readonly label: "1–3 years";
    readonly minYears: 1;
    readonly maxYears: 3;
}, {
    readonly key: "3-5y";
    readonly label: "3–5 years";
    readonly minYears: 3;
    readonly maxYears: 5;
}, {
    readonly key: "5-10y";
    readonly label: "5–10 years";
    readonly minYears: 5;
    readonly maxYears: 10;
}, {
    readonly key: "10y+";
    readonly label: "10+ years";
    readonly minYears: 10;
    readonly maxYears: null;
}];
/**
 * Minimum group size for sensitive aggregates (Payroll, Performance). Groups
 * smaller than this are suppressed to prevent trivial inference of an
 * individual's salary / rating.
 */
export declare const MIN_GROUP_SIZE = 3;
export type DateBasis = 'AS_OF' | 'CALENDAR_MONTH' | 'CUSTOM_RANGE' | 'ACADEMIC_YEAR' | 'FINANCIAL_YEAR';
export declare function assertDate(value: string | undefined, field: string): string;
export declare function todayISO(): string;
/** Resolve a [from, to] date window from query params with sensible defaults. */
export declare function resolveRange(params: {
    from?: string;
    to?: string;
    academicYear?: string;
    financialYear?: string;
}): {
    from: string;
    to: string;
    basis: DateBasis;
};
/** Enumerate the calendar months (YYYY-MM-01 first-day markers) within a range. */
export declare function monthsInRange(from: string, to: string): Array<{
    year: number;
    month: number;
    key: string;
}>;
export type AnalyticsScope = {
    collegeId: number;
    /** null = college-wide; otherwise the department ids the actor may see. */
    departmentIds: number[] | null;
};
/**
 * Resolve the analytics data scope for an actor. HOD-type actors are restricted
 * to their own department(s). Anyone holding a college-wide reporting/management
 * capability (admins, HR managers, principal, HR executives, payroll officers)
 * sees the whole college.
 */
export declare function resolveAnalyticsScope(actor: HrActor): AnalyticsScope;
/**
 * Narrow a scope by an optional requested department filter. A department-scoped
 * actor may only request a department inside their own scope.
 */
export declare function applyDepartmentFilter(scope: AnalyticsScope, requestedDeptId?: number | null): number[] | null;
/** True when the resolved scope can see no data at all (e.g. HOD without a dept). */
export declare function isEmptyScope(departmentIds: number[] | null): boolean;
export type MetricDefinition = {
    key: string;
    name: string;
    description: string;
    sourceDomain: string;
    calculation: string;
    timeGrain: DateBasis[];
    filters: string[];
    permission: string;
    drilldown: boolean;
    rounding?: string;
};
export declare const METRIC_CATALOG: MetricDefinition[];
export declare function getMetricCatalog(): MetricDefinition[];
export declare function pct(numerator: number, denominator: number, dp?: number): number;
export declare function round(value: number, dp?: number): number;
export declare function toNum(v: unknown): number;
