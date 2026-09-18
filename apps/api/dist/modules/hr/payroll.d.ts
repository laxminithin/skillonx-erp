import type { HrActor } from './types.js';
import { toMoney } from './payrollMoney.js';
type Row = Record<string, unknown>;
declare const MUTABLE_STATUSES: Set<string>;
export declare function payrollSchemaReady(): Promise<boolean>;
/** Hard write guard — every mutation path must resolve run state. */
export declare function assertPayrollRunMutable(run: Row, opts?: {
    allowApproved?: boolean;
    action?: string;
}): Promise<void>;
export declare function listPayslips(actor: HrActor): Promise<{
    id: number;
    payslipNumber: unknown;
    periodLabel: unknown;
    grossAmount: number;
    deductionAmount: number;
    netAmount: number;
    breakdown: any;
    createdAt: unknown;
}[]>;
export declare function getPayslip(actor: HrActor, payslipId: number): Promise<{
    id: number;
    payslipNumber: any;
    grossAmount: number;
    deductionAmount: number;
    netAmount: number;
    breakdown: any;
    employeeSnapshot: any;
}>;
/** Admin payslip read — requires payroll view; college scoped. */
export declare function getPayslipAdmin(actor: HrActor, payslipId: number): Promise<{
    id: number;
    employeeId: number;
    payslipNumber: any;
    grossAmount: number;
    deductionAmount: number;
    netAmount: number;
    breakdown: any;
    employeeSnapshot: any;
}>;
export declare function listPayrollRuns(actor: HrActor): Promise<{
    id: number;
    runNumber: unknown;
    status: unknown;
    periodId: number;
    periodLabel: unknown;
    startDate: unknown;
    endDate: unknown;
    employeeCount: number;
    validationStatus: {};
    validationErrorCount: number;
    grossTotal: number;
    deductionTotal: number;
    netTotal: number;
    lopDaysTotal: number;
    financePostingStatus: {};
    financePostingId: number | null;
    lockedAt: unknown;
    approvedAt: unknown;
    postedAt: unknown;
}[]>;
export declare function getPayrollRun(actor: HrActor, payrollRunId: number): Promise<{
    validationSummary: any;
    employees: {
        id: number;
        employeeId: number;
        employeeNumber: unknown;
        employeeName: unknown;
        departmentName: unknown;
        grossAmount: number;
        deductionAmount: number;
        netAmount: number;
        workingDays: number | null;
        payableDays: number | null;
        lopDays: number | null;
        calculationStatus: unknown;
        validationErrors: any;
    }[];
    id: number;
    runNumber: unknown;
    status: unknown;
    periodId: number;
    periodLabel: unknown;
    startDate: unknown;
    endDate: unknown;
    employeeCount: number;
    validationStatus: {};
    validationErrorCount: number;
    grossTotal: number;
    deductionTotal: number;
    netTotal: number;
    lopDaysTotal: number;
    financePostingStatus: {};
    financePostingId: number | null;
    lockedAt: unknown;
    approvedAt: unknown;
    postedAt: unknown;
}>;
export declare function getPayrollRunEmployee(actor: HrActor, payrollRunId: number, employeeId: number): Promise<{
    id: number;
    employeeId: number;
    employeeNumber: any;
    employeeName: any;
    grossAmount: number;
    deductionAmount: number;
    netAmount: number;
    workingDays: number | null;
    payableDays: number | null;
    lopDays: number | null;
    structureId: number | null;
    assignmentId: number | null;
    snapshotVersion: any;
    inputSnapshot: any;
    calculationTrace: any;
    calculationStatus: any;
    validationErrors: any;
    components: {
        componentId: number;
        code: unknown;
        name: unknown;
        type: unknown;
        calculationType: unknown;
        lopAffected: unknown;
        isProratable: unknown;
        baseAmount: number | null;
        amount: number;
        calcDetail: any;
    }[];
}>;
export declare function createPayrollRun(actor: HrActor, periodId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function calculatePayrollRun(actor: HrActor, payrollRunId: number): Promise<{
    id: number;
    status: string;
    validationStatus: string;
    validationErrorCount: number;
    employeeCount: number;
}>;
export declare function approvePayrollRun(actor: HrActor, payrollRunId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function lockPayrollRun(actor: HrActor, payrollRunId: number): Promise<{
    id: number;
    status: string;
}>;
/**
 * Reopen policy:
 *   - Block if Finance posting is POSTED (must reverse first).
 *   - Only COLLEGE_ADMIN / payroll lock permission from LOCKED → APPROVED (pre-post) is not allowed;
 *     reopen only from APPROVED back to CALCULATED when not posted.
 */
export declare function reopenPayrollRun(actor: HrActor, payrollRunId: number, reason: string): Promise<{
    id: number;
    status: string;
}>;
/** Block direct mutation of locked run employee/component rows. */
export declare function assertCanMutateRunEmployee(actor: HrActor, payrollRunEmployeeId: number): Promise<any>;
export declare function mutateLockedPayrollComponentBlocked(actor: HrActor, payrollRunEmployeeId: number, _patch: {
    amount?: number;
}): Promise<void>;
/**
 * Build Finance posting batch preview — real entries from locked payroll + mappings.
 * College-scoped; requires payroll view.
 */
export declare function getPayrollPostingBatch(actor: HrActor, payrollRunId: number): Promise<{
    payrollRunId: number;
    collegeId: number;
    financePostingStatus: {};
    existingPostingId: number | null;
    existingPostingNumber: any;
    validationErrors: string[];
    debitTotal: string;
    creditTotal: string;
    balanced: boolean;
    entries: {
        accountId: number;
        side: "DEBIT" | "CREDIT";
        amount: string;
        lineKey: string;
        description: string;
    }[];
}>;
export declare function postPayrollToFinance(actor: HrActor, payrollRunId: number): Promise<{
    id: number;
    postingNumber: any;
    status: string;
    idempotent: boolean;
}>;
export declare function reversePayrollFinance(actor: HrActor, payrollRunId: number, reason: string): Promise<{
    postingId: number;
    reversalNumber: string;
    status: string;
}>;
export declare function listPayrollPeriods(actor: HrActor): Promise<{
    id: number;
    label: unknown;
    startDate: unknown;
    endDate: unknown;
    status: unknown;
}[]>;
export declare function ensurePayrollPeriod(actor: HrActor, input: {
    label: string;
    startDate: string;
    endDate: string;
}): Promise<{
    id: number;
    label: any;
    created: boolean;
}>;
export declare function canViewPayrollCompensation(actor: HrActor): boolean;
export { MUTABLE_STATUSES, toMoney };
