import type { HrActor } from './types.js';
export declare function payrollRegisterReport(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    periodLabel: any;
    status: any;
    rows: {
        employeeNumber: unknown;
        employeeName: unknown;
        departmentName: unknown;
        workingDays: number | null;
        payableDays: number | null;
        lopDays: number | null;
        gross: number;
        deductions: number;
        net: number;
        status: unknown;
    }[];
}>;
export declare function departmentSummaryReport(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    rows: {
        departmentName: string;
        employees: number;
        gross: string;
        deductions: string;
        net: string;
        lopDays: number;
    }[];
}>;
export declare function earningsDeductionSummary(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    earnings: {
        code: string;
        name: string;
        total: string;
    }[];
    deductions: {
        code: string;
        name: string;
        total: string;
    }[];
}>;
export declare function lopSummaryReport(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    rows: {
        employeeNumber: unknown;
        employeeName: unknown;
        lopDays: number;
        payableDays: number;
        workingDays: number;
        net: number;
    }[];
}>;
export declare function arrearsReport(actor: HrActor, payrollRunId?: number): Promise<{
    report: string;
    rows: {
        id: number;
        employeeNumber: unknown;
        employeeName: unknown;
        type: unknown;
        amount: number;
        reason: unknown;
        sourcePeriodId: number | null;
        sourcePayrollRunId: number | null;
        payrollRunId: number | null;
        status: unknown;
    }[];
}>;
export declare function financePostingSummary(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    financePostingStatus: any;
    posting: null;
    lines: never[];
} | {
    report: string;
    runId: number;
    financePostingStatus: any;
    posting: {
        id: number;
        postingNumber: any;
        status: any;
        debitTotal: number;
        creditTotal: number;
        postedAt: any;
    };
    lines: {
        accountCode: unknown;
        accountName: unknown;
        side: unknown;
        amount: number;
        lineKey: unknown;
        description: unknown;
    }[];
}>;
export declare function payrollVarianceReport(actor: HrActor, payrollRunId: number): Promise<{
    report: string;
    runId: number;
    previousRunId: number | null;
    previousPeriodLabel: any;
    flags: Record<string, unknown>[];
}>;
