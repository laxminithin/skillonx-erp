import ExcelJS from 'exceljs';
import type { HrActor } from '../types.js';
export declare function coverageMetrics(actor: HrActor): Promise<{
    totalCriticalRoles: number;
    rolesWithSuccessor: number;
    rolesWithoutSuccessor: number;
    rolesWithReadyNow: number;
    coveragePct: number;
    readyNowCoveragePct: number;
    avgSuccessorsPerRole: number;
    criticalVacancyExposure: number;
}>;
export declare function talentRisk(actor: HrActor): Promise<{
    flags: {
        type: string;
        roleId: number;
        roleTitle: string;
        department: string | null;
        detail: string;
    }[];
    count: number;
}>;
export declare function dashboard(actor: HrActor): Promise<{
    kpis: {
        criticalRoles: number;
        coveredRoles: number;
        rolesWithoutSuccessor: number;
        readyNowCoveragePct: number;
        coveragePct: number;
        talentPools: number;
        openDevelopmentActions: number;
        criticalVacancyExposure: number;
    };
    criticalityDistribution: {
        criticality: unknown;
        count: number;
    }[];
    readinessDistribution: {
        readiness: unknown;
        count: number;
    }[];
    departmentCoverage: {
        department: string;
        roles: number;
        covered: number;
    }[];
    developmentActionStatus: {
        status: unknown;
        count: number;
    }[];
}>;
export declare function coverageReport(actor: HrActor): Promise<{
    rows: {
        roleTitle: any;
        department: any;
        criticality: any;
        incumbent: any;
        successors: number;
        readyNow: number;
        coverage: string;
    }[];
}>;
export declare function exportReport(actor: HrActor, report: string, format: 'csv' | 'xlsx'): Promise<{
    contentType: string;
    filename: string;
    body: string;
} | {
    contentType: string;
    filename: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
/**
 * An employee sees ONLY their own development actions, pool names and linked
 * learning — never succession rankings, slates, other candidates, or potential
 * assessments.
 */
export declare function myDevelopment(actor: HrActor): Promise<{
    linked: boolean;
    developmentActions: any[];
    talentPools: any[];
}>;
