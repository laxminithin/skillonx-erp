import type { HrActor } from './types.js';
export declare function fnfSchemaReady(): Promise<boolean>;
export declare function createSettlementCase(actor: HrActor, separationRequestId: number): Promise<Record<string, unknown>>;
export declare function syncSettlementSources(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function setNoticeWaiver(actor: HrActor, settlementId: number, waived: boolean, reason: string): Promise<Record<string, unknown>>;
export declare function addAssetItem(actor: HrActor, settlementId: number, input: {
    itemCode: string;
    itemName: string;
    recoveryAmount?: number;
}): Promise<Record<string, unknown>>;
export declare function updateAssetItem(actor: HrActor, settlementId: number, itemId: number, input: {
    status: string;
    recoveryAmount?: number;
    remarks?: string;
}): Promise<Record<string, unknown>>;
export declare function addManualAdjustment(actor: HrActor, settlementId: number, input: {
    side: 'PAYABLE' | 'RECOVERY';
    code?: string;
    amount: number;
    reason: string;
    supportingReference?: string;
}): Promise<Record<string, unknown>>;
export declare function calculateSettlement(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function submitForReview(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function approveSettlement(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function rejectSettlement(actor: HrActor, settlementId: number, reason: string): Promise<Record<string, unknown>>;
export declare function holdSettlement(actor: HrActor, settlementId: number, reason: string): Promise<Record<string, unknown>>;
export declare function postSettlementToFinance(actor: HrActor, settlementId: number): Promise<{
    posting: {
        id: number;
        postingNumber: any;
        postingKey: string;
        status: string;
        idempotent: boolean;
    };
}>;
export declare function markSettled(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function closeSettlement(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function reopenSettlement(actor: HrActor, settlementId: number, reason: string): Promise<Record<string, unknown>>;
export declare function mutateLockedBlocked(settlementId: number): Promise<{
    blocked: boolean;
}>;
export declare function dashboard(actor: HrActor): Promise<{
    pendingCases: number;
    clearancePending: number;
    readyForCalculation: number;
    calculated: number;
    awaitingApproval: number;
    awaitingFinancePosting: number;
    settled: number;
    onHold: number;
    netPayables: string | null;
    netRecoverables: string | null;
}>;
export declare function listCases(actor: HrActor, status?: string): Promise<Record<string, unknown>[]>;
export declare function getCase(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function getPostingPreview(actor: HrActor, settlementId: number): Promise<{
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
export declare function presentCase(actor: HrActor, settlementId: number): Promise<Record<string, unknown>>;
export declare function getMySettlement(actor: HrActor): Promise<{
    id: number;
    caseNumber: any;
    status: any;
    lastWorkingDate: any;
    separationType: any;
    clearances: {
        domain: string;
        status: string;
        dueAmount: string;
    }[];
    documents: {
        id: number;
        docType: unknown;
        releasedAt: unknown;
    }[];
    netAmount: string | null;
    settlementDirection: any;
} | null>;
export declare function assertEmployeeOwnsSettlement(actor: HrActor, settlementId: number): Promise<any>;
export declare function getAudit(actor: HrActor, settlementId: number): Promise<{
    id: number;
    action: unknown;
    entityType: unknown;
    actorFacultyId: unknown;
    reason: unknown;
    createdAt: unknown;
}[]>;
