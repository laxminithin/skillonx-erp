import type { AlumniAdminActor } from './service.js';
import { type ImpactPeriod, type MetricDefinitionSeed, type MetricResult, type PeriodType } from './typesImpact.js';
export type ImpactFilters = {
    periodType?: PeriodType;
    periodLabel?: string | null;
    start?: string | null;
    end?: string | null;
    academicYearId?: number | null;
    departmentId?: number | null;
    programmeId?: number | null;
    batch?: string | null;
    graduationYear?: number | null;
    impactDomain?: string | null;
    metricKeys?: string[] | null;
};
export declare function getMetricDef(metricKey: string, version?: number): MetricDefinitionSeed | null;
export declare function listMetricRegistry(activeOnly?: boolean): {
    definitionVersion: number;
    metricKey: string;
    name: string;
    description: string;
    impactDomain: import("./typesImpact.js").ImpactDomain;
    calculationType: typeof import("./typesImpact.js").CALCULATION_TYPES[number];
    numeratorDefinition?: string | null;
    denominatorDefinition?: string | null;
    unit: typeof import("./typesImpact.js").METRIC_UNITS[number];
    sourceModules: string[];
    evidenceRequirements: string;
    supportedDimensions: string[];
    freshnessExpectations: string;
    version: number;
    activeFrom: string;
}[];
/** Resolve reporting period. Prefer academic_years.is_current when unspecified. */
export declare function resolvePeriod(collegeId: number, filters?: ImpactFilters): Promise<ImpactPeriod>;
declare function getConfig(collegeId: number): Promise<{
    smallCohortThreshold: number;
    engagementLookbackMonths: number;
}>;
export declare function computeAllMetrics(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    period: ImpactPeriod;
    metrics: MetricResult[];
    config: Awaited<ReturnType<typeof getConfig>>;
}>;
export declare function computeFunnels(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    period: ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    note: string;
    engagementFunnel: {
        stage: string;
        value: number;
        note: string;
    }[];
    programFunnel: {
        stage: string;
        value: number;
    }[];
    needFunnel: {
        stage: string;
        value: number;
    }[];
}>;
export declare function drilldownMetric(actor: AlumniAdminActor, metricKey: string, filters?: ImpactFilters, opts?: {
    allowPersonal?: boolean;
    smallCohortThreshold?: number;
}): Promise<{
    error: string;
    metricKey: string;
    definition?: undefined;
    period?: undefined;
    count?: undefined;
    attributionNote?: undefined;
    privacy?: undefined;
    rows?: undefined;
    correctionHint?: undefined;
} | {
    metricKey: string;
    definition: MetricDefinitionSeed;
    period: ImpactPeriod;
    count: number;
    attributionNote: string;
    privacy: {
        suppressed: boolean;
        reason: string;
    } | {
        suppressed: boolean;
        reason?: undefined;
    };
    rows: any[];
    correctionHint: string;
    error?: undefined;
}>;
export declare function departmentBreakdown(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    period: ImpactPeriod;
    departments: {
        departmentId: number;
        departmentName: any;
        departmentCode: any;
        metrics: MetricResult[];
    }[];
    truncated: boolean;
    note: string;
}>;
export declare function trendSeries(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    series: {
        academicYearId: number;
        label: any;
        isCurrent: boolean;
        periodComplete: boolean;
        coverageNote: string | null | undefined;
        metrics: {
            metricKey: string;
            value: number | null;
            numerator: number | null;
            denominator: number | null;
            version: number;
        }[];
    }[];
    note: string;
}>;
export {};
