import type { FinanceActor } from './types.js';
type Row = Record<string, unknown>;
export declare function ensureFnfFinanceDefaults(collegeId: number): Promise<void>;
export declare function buildFnfPostingPreview(collegeId: number, settlement: Row): Promise<{
    settlementId: number;
    collegeId: number;
    postingKey: string;
    direction: string;
    amount: string;
    debitTotal: string;
    creditTotal: string;
    balanced: boolean;
    validationErrors: string[];
    existingPostingId: number | null;
    entries: ({
        accountId: number;
        side: "DEBIT";
        amount: string;
        lineKey: string;
        description: string;
    } | {
        accountId: number;
        side: "CREDIT";
        amount: string;
        lineKey: string;
        description: string;
    })[];
}>;
export declare function postFnfSettlement(actor: FinanceActor, settlement: Row): Promise<{
    id: number;
    postingNumber: any;
    postingKey: string;
    status: string;
    idempotent: boolean;
}>;
export declare function reverseFnfPosting(actor: FinanceActor, settlement: Row, reason: string): Promise<{
    id: number;
    status: "REVERSED";
}>;
export {};
