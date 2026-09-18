import type { FinanceActor } from './types.js';
type Row = Record<string, unknown>;
export declare function ensurePayrollFinanceDefaults(collegeId: number): Promise<void>;
export declare function buildPayrollPostingPreview(collegeId: number, run: Row): Promise<{
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
export declare function postPayrollRun(actor: FinanceActor, run: Row): Promise<{
    id: number;
    postingNumber: any;
    status: string;
    idempotent: boolean;
}>;
export declare function reversePayrollPosting(actor: FinanceActor, run: Row, reason: string): Promise<{
    postingId: number;
    reversalNumber: string;
    status: string;
}>;
export {};
