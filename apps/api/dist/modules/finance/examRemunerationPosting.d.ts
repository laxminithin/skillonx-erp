import type { FinanceActor } from './types.js';
export declare function ensureExamRemunerationDefaults(collegeId: number): Promise<Record<string, number>>;
export declare function previewExamRemunerationPosting(collegeId: number, remunerationItemId: number): Promise<{
    remunerationItemId: number;
    obligationStatus: any;
    amount: string;
    debitTotal: string;
    creditTotal: string;
    balanced: boolean;
    existingPostingId: number | null;
    existingPostingStatus: any;
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
/**
 * Idempotent post: the same approved obligation, posted once, twice, or concurrently,
 * produces exactly ONE financial posting (§7). Amount is read from the obligation (§6).
 */
export declare function postExamRemuneration(actor: FinanceActor, remunerationItemId: number): Promise<{
    id: number;
    postingNumber: any;
    status: string;
    amount: number;
    idempotent: boolean;
}>;
export declare function reverseExamRemuneration(actor: FinanceActor, remunerationItemId: number, reason: string): Promise<{
    postingId: number;
    status: "REVERSED";
}>;
/** Finance-authoritative readback of the payable state. */
export declare function getExamRemunerationReadback(collegeId: number, remunerationItemId: number): Promise<{
    remunerationItemId: number;
    obligationStatus: any;
    amount: number;
    posting: {
        id: number;
        postingNumber: any;
        status: any;
        debitTotal: number;
        creditTotal: number;
        postedAt: any;
    } | null;
    lines: {
        side: any;
        amount: number;
        lineKey: any;
        description: any;
    }[];
}>;
