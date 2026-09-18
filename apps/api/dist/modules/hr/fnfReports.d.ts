import type { HrActor } from './types.js';
export declare function settlementRegister(actor: HrActor): Promise<{
    grossPayable?: string | undefined;
    totalRecoveries?: string | undefined;
    netAmount?: string | undefined;
    direction?: unknown;
    id: number;
    caseNumber: unknown;
    employeeName: unknown;
    employeeNumber: unknown;
    status: unknown;
    lastWorkingDate: unknown;
    separationType: unknown;
    financePostingStatus: unknown;
}[]>;
export declare function pendingClearanceReport(actor: HrActor): Promise<{
    settlementId: number;
    caseNumber: unknown;
    employeeName: unknown;
    employeeNumber: unknown;
    domain: unknown;
    status: unknown;
    blocking: boolean;
    dueAmount: string | null;
}[]>;
export declare function outstandingRecoveries(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    code: unknown;
    amount: string;
    source: unknown;
    caseStatus: unknown;
}[]>;
export declare function employeePayables(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    employeeNumber: unknown;
    netAmount: string;
    status: unknown;
}[]>;
export declare function employeeReceivables(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    employeeNumber: unknown;
    netAmount: string;
    status: unknown;
}[]>;
export declare function leaveEncashmentSummary(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    amount: string;
    quantity: unknown;
}[]>;
export declare function noticePaySummary(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    amount: string;
    quantity: unknown;
}[]>;
export declare function financePostingStatusReport(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    status: unknown;
    financePostingStatus: unknown;
    postingKey: unknown;
}[]>;
export declare function closedSeparationReport(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    employeeNumber: unknown;
    lastWorkingDate: unknown;
    status: unknown;
    closedAt: unknown;
}[]>;
export declare function settlementAging(actor: HrActor): Promise<{
    caseNumber: unknown;
    employeeName: unknown;
    status: unknown;
    ageDays: number;
}[]>;
