import ExcelJS from 'exceljs';
import type { HrActor } from './types.js';
export type AnalyticsFilters = {
    from?: string;
    to?: string;
    asOf?: string;
    academicYear?: string;
    financialYear?: string;
    departmentId?: number | null;
    employmentTypeId?: number | null;
    employeeCategory?: string | null;
};
export declare function metricCatalog(actor: HrActor): {
    metrics: import("./analyticsCatalog.js").MetricDefinition[];
};
/** Current in-service headcount as of a date, with breakdowns. */
export declare function currentHeadcount(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    asOf: string;
    total: number;
    facultyStaffMix: {
        faculty: number;
        staff: number;
    };
    byDepartment: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
    byDesignation: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
    byEmploymentType: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
    byCategory: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
}>;
export declare function historicalHeadcount(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    asOf: string;
    total: number;
    basis: string;
}>;
export declare function joinersTrend(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    total: number;
    byMonth: {
        month: string;
        count: number;
    }[];
    byDepartment: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
}>;
export declare function separationsTrend(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    total: number;
    byMonth: {
        month: string;
        count: number;
    }[];
    byType: {
        label: string;
        count: number;
    }[];
    byDepartment: {
        label: string;
        departmentId: number | undefined;
        count: number;
    }[];
}>;
export declare function attrition(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    separations: number;
    avgHeadcount: number;
    attritionRate: number;
    definition: string;
    headcountStart?: undefined;
    headcountEnd?: undefined;
} | {
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    separations: number;
    headcountStart: number;
    headcountEnd: number;
    avgHeadcount: number;
    attritionRate: number;
    definition: string;
}>;
export declare function retention(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    baseAtStart: number;
    retained: number;
    retentionRate: number;
    definition: string;
}>;
export declare function tenureBands(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    asOf: string;
    bands: {
        key: "<1y" | "1-3y" | "3-5y" | "5-10y" | "10y+";
        label: "< 1 year" | "1–3 years" | "3–5 years" | "5–10 years" | "10+ years";
        count: number;
    }[];
}>;
/** Department workforce distribution: headcount + faculty/staff + joiners/separations. */
export declare function departmentDistribution(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    asOf: string;
    from: string;
    to: string;
    departments: {
        departmentId: number | undefined;
        department: string;
        headcount: number;
        faculty: number;
        staff: number;
        joiners: number;
        separations: number;
    }[];
}>;
/** Internal workforce movement from canonical career actions. */
export declare function workforceMovement(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    byType: {
        label: string;
        count: number;
    }[];
}>;
export declare function attendanceTrend(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    byMonth: {
        month: string;
        present: number;
        payable: number;
        absence: number;
        lopDays: number;
        leaveDays: number;
        employees: number;
        attendanceRate: number;
    }[];
}>;
export declare function leaveUtilisation(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    byType: {
        leaveType: string;
        isPaid: boolean;
        days: number;
        requests: number;
    }[];
    totalApprovedDays: number;
    pending: number;
}>;
export declare function payrollCostTrend(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    byPeriod: {
        runId: number;
        period: string;
        endDate: unknown;
        gross: number;
        deduction: number;
        net: number;
        lopDays: number;
        employees: number;
        status: string;
    }[];
    totals: {
        gross: number;
        deduction: number;
        net: number;
        lopDays: number;
    };
    note: string;
}>;
/**
 * Department-level payroll cost aggregate, with small-group suppression to
 * prevent trivial inference of an individual's salary.
 */
export declare function payrollByDepartment(actor: HrActor, payrollRunId: number): Promise<{
    payrollRunId: number;
    departments: {
        departmentId: number | undefined;
        department: string;
        employees: number;
        gross: number | null;
        deduction: number | null;
        net: number | null;
        suppressed: boolean;
        suppressionReason: string | undefined;
    }[];
    minGroupSize: number;
}>;
export declare function payrollVariance(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    previousRunId: number | null;
    previousPeriodLabel: any;
    flags: Record<string, unknown>[];
}>;
export declare function recruitmentFunnel(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    stages: {
        stage: string;
        count: number;
    }[];
}>;
export declare function timeToFill(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    filled: number;
    avgDays: number | null;
    definition?: undefined;
} | {
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    filled: number;
    avgDays: number | null;
    definition: string;
}>;
export declare function offerAcceptance(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    issued: number;
    accepted: number;
    declined: number;
    expired: number;
    acceptanceRate: number;
    definition?: undefined;
} | {
    from: string;
    to: string;
    basis: import("./analyticsCatalog.js").DateBasis;
    issued: number;
    accepted: number;
    declined: number;
    expired: number;
    acceptanceRate: number;
    definition: string;
}>;
/** Approved open positions (vacancy) vs published openings. */
export declare function vacancyOverview(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    approvedOpenPositions: number;
    publishedOpenings: number;
    note?: undefined;
} | {
    approvedOpenPositions: number;
    publishedOpenings: number;
    note: string;
}>;
export declare function performanceCompletion(actor: HrActor, cycleId: number | undefined, filters?: AnalyticsFilters): Promise<{
    cycleId: number | null;
    total: number;
    selfSubmitted: number;
    reviewed: number;
    finalized: number;
    completionRate?: undefined;
} | {
    cycleId: number | null;
    total: number;
    selfSubmitted: number;
    reviewed: number;
    finalized: number;
    completionRate: number;
}>;
export declare function ratingDistribution(actor: HrActor, cycleId: number | undefined, filters?: AnalyticsFilters): Promise<{
    cycleId: number | null;
    buckets: never[];
    suppressed: boolean;
    total?: undefined;
    minGroupSize?: undefined;
} | {
    cycleId: number | null;
    total: number;
    suppressed: boolean;
    minGroupSize: number;
    buckets: {
        label: string;
        count: number;
    }[];
}>;
export declare function fnfAnalytics(actor: HrActor, filters?: AnalyticsFilters): Promise<{
    pending: number;
    settled: number;
    byStatus: never[];
    payableTotal: number;
    receivableTotal: number;
    note?: undefined;
} | {
    pending: number;
    settled: number;
    byStatus: {
        status: string;
        count: number;
    }[];
    payableTotal: number;
    receivableTotal: number;
    note: string;
}>;
export declare function reconciliation(actor: HrActor): Promise<{
    checks: {
        key: string;
        description: string;
        valueA: number;
        valueB: number;
        mode: "eq" | "lte";
        ok: boolean;
        delta: number;
    }[];
    ok: boolean;
}>;
/** Payroll reconciliation: run header totals must equal the sum of employee lines. */
export declare function payrollReconciliation(actor: HrActor, payrollRunId: number): Promise<{
    payrollRunId: number;
    status: any;
    checks: {
        key: string;
        description: string;
        valueA: number;
        valueB: number;
        mode: "eq" | "lte";
        ok: boolean;
        delta: number;
    }[];
    ok: boolean;
}>;
export declare function dataQuality(actor: HrActor): Promise<{
    flags: {
        key: string;
        label: string;
        count: number;
    }[];
    totalIssues: number;
    clean: boolean;
}>;
export declare function overview(actor: HrActor, filters?: AnalyticsFilters): Promise<Record<string, unknown>>;
export declare function exportReport(actor: HrActor, report: string, format: 'csv' | 'xlsx', filters?: AnalyticsFilters): Promise<{
    contentType: string;
    filename: string;
    body: string;
} | {
    contentType: string;
    filename: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
