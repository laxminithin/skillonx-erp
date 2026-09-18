import type { ManagementActor } from './types.js';
export declare function financeOverview(actor: ManagementActor): Promise<{
    summary: import("./sources.js").SourceResult<{
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
    }>;
    outstanding: import("./sources.js").SourceResult<{
        studentName: any;
        usn: any;
        programName: any;
        semesterLabel: any;
        demandNumber: any;
        totalDemand: string;
        paid: string;
        outstanding: string;
        dueDate: any;
        status: any;
    }[]>;
}>;
export declare function payrollSummary(actor: ManagementActor): Promise<{
    trend: import("./sources.js").SourceResult<{
        from: string;
        to: string;
        basis: import("../hr/analyticsCatalog.js").DateBasis;
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
    canSeeDetail: boolean;
    classification: string;
    note: string;
}>;
