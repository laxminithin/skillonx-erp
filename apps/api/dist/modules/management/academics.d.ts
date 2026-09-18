import type { ManagementActor } from './types.js';
/** Institution academic overview: institution KPIs + department comparison,
 * computed by the efficient set-based provider (no per-department N+1). */
export declare function academicOverview(actor: ManagementActor): Promise<{
    institution: import("./metrics.js").InstitutionKpis;
    departmentComparison: import("./metrics.js").DeptRow[];
}>;
export declare function studentPerformance(actor: ManagementActor, departmentId?: number): Promise<{
    results: import("./sources.js").SourceResult<{
        id: number;
        status: unknown;
        courseName: unknown;
        courseCode: unknown;
        facultyName: unknown;
    }[]>;
    students: import("./sources.js").SourceResult<{
        count: number;
        classes: {
            classId: number;
            className: any;
            classCode: any;
            departmentId: number;
            studentCount: number;
        }[];
    }>;
}>;
export declare function courseDelivery(actor: ManagementActor, departmentId?: number): Promise<{
    progress: import("./sources.js").SourceResult<{
        planId: number;
        courseName: any;
        courseCode: any;
        facultyName: any;
        plannedProgress: number;
        actualProgress: number;
        completionPct: number;
        pendingUnits: number;
        status: any;
    }[]>;
    assessments: import("./sources.js").SourceResult<Record<string, unknown>[]>;
}>;
export declare function outcomeAttainment(actor: ManagementActor): Promise<{
    dashboard: import("./sources.js").SourceResult<{
        summary: {
            courses: number;
            cosMonitored: number;
            green: number;
            amber: number;
            red: number;
            openCycles: number;
            awaitingReassessment: number;
            awaitingApproval: number;
            closedSuccessfully: number;
            evidenceCompleteness: number;
        };
        courses: {
            id: number;
            courseId: number;
            courseCode: string;
            courseName: string;
            status: string;
            seeMethod: string | null;
            seeConfidence: string | null;
            seeEstimated: boolean;
            formulaVersion: string;
            calculatedAt: Date;
            green: number;
            amber: number;
            red: number;
            coCount: number;
            coStatuses: {
                coCode: string;
                status: string;
            }[];
        }[];
        cycles: {
            id: number;
            courseId: number;
            kind: string;
            outcomeCode: string;
            state: string;
            target: number | null;
            actual: number | null;
            gap: number | null;
        }[];
    }>;
    programmeHealth: import("./sources.js").SourceResult<{
        po: {
            courseId: number;
            poCode: any;
            target: number | null;
            attainment: number | null;
            gap: number | null;
            status: any;
        }[];
        summary: {
            courses: number;
            cosMonitored: number;
            green: number;
            amber: number;
            red: number;
            openCycles: number;
            awaitingReassessment: number;
            awaitingApproval: number;
            closedSuccessfully: number;
            evidenceCompleteness: number;
        };
        courses: {
            id: number;
            courseId: number;
            courseCode: string;
            courseName: string;
            status: string;
            seeMethod: string | null;
            seeConfidence: string | null;
            seeEstimated: boolean;
            formulaVersion: string;
            calculatedAt: Date;
            green: number;
            amber: number;
            red: number;
            coCount: number;
            coStatuses: {
                coCode: string;
                status: string;
            }[];
        }[];
        cycles: {
            id: number;
            courseId: number;
            kind: string;
            outcomeCode: string;
            state: string;
            target: number | null;
            actual: number | null;
            gap: number | null;
        }[];
    }>;
}>;
