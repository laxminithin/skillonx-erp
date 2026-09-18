import type { ManagementActor } from './types.js';
export declare function workforceOverview(actor: ManagementActor): Promise<{
    headcount: import("./sources.js").SourceResult<{
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
    workforce: import("./sources.js").SourceResult<{
        totalHeadcount: number;
        byDepartment: any[];
        byDesignation: any[];
        byEmploymentType: any[];
    }>;
    attrition: import("./sources.js").SourceResult<{
        from: string;
        to: string;
        basis: import("../hr/analyticsCatalog.js").DateBasis;
        separations: number;
        avgHeadcount: number;
        attritionRate: number;
        definition: string;
        headcountStart?: undefined;
        headcountEnd?: undefined;
    } | {
        from: string;
        to: string;
        basis: import("../hr/analyticsCatalog.js").DateBasis;
        separations: number;
        headcountStart: number;
        headcountEnd: number;
        avgHeadcount: number;
        attritionRate: number;
        definition: string;
    }>;
    joiners: import("./sources.js").SourceResult<{
        from: string;
        to: string;
        basis: import("../hr/analyticsCatalog.js").DateBasis;
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
    separations: import("./sources.js").SourceResult<{
        from: string;
        to: string;
        basis: import("../hr/analyticsCatalog.js").DateBasis;
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
}>;
export declare function recruitmentOverview(actor: ManagementActor): Promise<{
    funnel: import("./sources.js").SourceResult<{
        openRequisitions: number;
        publishedOpenings: number;
        activeApplications: number;
        issuedOffers: number;
        acceptedOffers: number;
        joined: number;
        interviewsScheduled: number;
    }>;
}>;
export declare function performanceOverview(actor: ManagementActor): Promise<{
    completion: import("./sources.js").SourceResult<{
        total: any;
        byStatus: Record<string, number>;
        completionPct: number;
        selfSubmitPct: number;
        reviewSubmitPct: number;
    }>;
    ratings: import("./sources.js").SourceResult<{
        total: any;
        byLabel: Record<string, number>;
        scores: {
            label: unknown;
            value: number | null;
            score: number | null;
        }[];
    }>;
    byDepartment: import("./sources.js").SourceResult<{
        departmentId: number | null;
        departmentName: string | null;
        total: number;
        finalized: number;
        avgFinalScore: number | null;
    }[]>;
    pending: import("./sources.js").SourceResult<{
        appraisalId: number;
        status: unknown;
        employeeId: number;
        employeeName: unknown;
        employeeNumber: unknown;
        reviewerEmployeeId: number | null;
        reviewerName: {} | null;
        departmentId: number | null;
        selfSubmittedAt: unknown;
    }[]>;
}>;
export declare function ldOverview(actor: ManagementActor): Promise<{
    dashboard: import("./sources.js").SourceResult<{
        activePrograms: number;
        upcomingPrograms: number;
        employeesEnrolled: number;
        completions: number;
        certificatesIssued: number;
        developmentNeedsOpen: number;
        effectivenessReviewsPending: number;
        completionRate: number;
    }>;
}>;
export declare function successionOverview(actor: ManagementActor): Promise<{
    dashboard: import("./sources.js").SourceResult<{
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
    coverage: import("./sources.js").SourceResult<{
        totalCriticalRoles: number;
        rolesWithSuccessor: number;
        rolesWithoutSuccessor: number;
        rolesWithReadyNow: number;
        coveragePct: number;
        readyNowCoveragePct: number;
        avgSuccessorsPerRole: number;
        criticalVacancyExposure: number;
    }>;
    risk: import("./sources.js").SourceResult<{
        flags: {
            type: string;
            roleId: number;
            roleTitle: string;
            department: string | null;
            detail: string;
        }[];
        count: number;
    }>;
}>;
