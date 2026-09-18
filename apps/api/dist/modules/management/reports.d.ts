import type { ExecutiveMetric, ManagementActor } from './types.js';
export declare function executiveSnapshot(actor: ManagementActor): Promise<{
    generatedAt: string;
    collegeId: number;
    kpis: ExecutiveMetric[];
    academicHealth: import("./metrics.js").InstitutionKpis;
    finance: {
        expectedCollection: string;
        collected: string;
        outstanding: string;
        todayCollection: string;
        overdueAmount: string;
        scholarshipReceivable: string;
        refundPending: string;
        todayByMode: {
            method: string;
            amount: string;
        }[];
        actionRequired: {
            label: string;
            count: number;
        }[];
        recentTransactions: {
            id: number;
            paymentNumber: any;
            studentName: any;
            usn: any;
            amount: string;
            paymentDate: any;
            paymentMethod: any;
            status: any;
        }[];
    } | null;
    succession: {
        totalCriticalRoles: number;
        rolesWithSuccessor: number;
        rolesWithoutSuccessor: number;
        rolesWithReadyNow: number;
        coveragePct: number;
        readyNowCoveragePct: number;
        avgSuccessorsPerRole: number;
        criticalVacancyExposure: number;
    } | null;
    risks: {
        total: number;
        byCategory: Record<string, number>;
        top: import("./exceptions.js").ExceptionItem[];
    } | null;
    approvals: {
        total: number;
        byDomain: Record<string, number>;
        top: import("./approvals.js").ApprovalItem[];
    } | null;
    departmentComparison: import("./metrics.js").DeptRow[];
}>;
export declare function exportSnapshotCsv(actor: ManagementActor): Promise<{
    filename: string;
    csv: string;
}>;
export declare function availableReports(): {
    key: string;
    label: string;
    capability: string;
}[];
