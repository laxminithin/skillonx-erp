import type { FinanceActor } from './types.js';
type ManualPaymentBody = {
    studentId?: number;
    applicantId?: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
    bankReference?: string;
    chequeStatus?: string;
    remarks?: string;
    demandIds?: number[];
};
export declare function recordManualPayment(actor: FinanceActor, body: ManualPaymentBody): Promise<{
    paymentId: number;
    paymentNumber: string;
    status: string;
    receipt: {
        id: number;
        receiptNumber: string;
        studentId: number;
        paymentId: number;
        receiptDate: unknown;
        amount: string;
        paymentMethod: unknown;
        transactionReference: unknown;
        outstandingBalance: string;
        status: unknown;
        snapshot: unknown;
        voidedAt: unknown;
        voidReason: unknown;
    } | null;
    allocation: {
        allocated: string;
        remaining: string;
    } | null;
}>;
export declare function allocatePayment(trx: import('knex').Knex.Transaction, params: {
    paymentId: number;
    collegeId: number;
    studentId?: number | null;
    subjectType?: string;
    subjectId?: number;
    amount: number;
    demandIds?: number[];
    demandItemIds?: number[];
}): Promise<{
    allocated: string;
    remaining: string;
}>;
export declare function completeChequePayment(actor: FinanceActor, paymentId: number, chequeStatus: 'CLEARED' | 'BOUNCED'): Promise<{
    status: string;
    receipt: {
        id: number;
        receiptNumber: string;
        studentId: number;
        paymentId: number;
        receiptDate: unknown;
        amount: string;
        paymentMethod: unknown;
        transactionReference: unknown;
        outstandingBalance: string;
        status: unknown;
        snapshot: unknown;
        voidedAt: unknown;
        voidReason: unknown;
    };
} | {
    status: string;
}>;
export declare function listPayments(actor: FinanceActor, filters?: {
    studentId?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
}): Promise<{
    id: number;
    paymentNumber: unknown;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    studentName: {} | null;
    applicantName: {} | null;
    applicationNumber: {} | null;
    usn: {} | null;
    amount: string;
    paymentDate: unknown;
    paymentMethod: unknown;
    transactionReference: unknown;
    status: unknown;
    chequeStatus: unknown;
    createdAt: unknown;
}[]>;
export declare function listStudentPayments(studentId: number, collegeId: number): Promise<{
    id: number;
    paymentNumber: unknown;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    studentName: {} | null;
    applicantName: {} | null;
    applicationNumber: {} | null;
    usn: {} | null;
    amount: string;
    paymentDate: unknown;
    paymentMethod: unknown;
    transactionReference: unknown;
    status: unknown;
    chequeStatus: unknown;
    createdAt: unknown;
}[]>;
export declare function serializePayment(row: Record<string, unknown>): {
    id: number;
    paymentNumber: unknown;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    studentName: {} | null;
    applicantName: {} | null;
    applicationNumber: {} | null;
    usn: {} | null;
    amount: string;
    paymentDate: unknown;
    paymentMethod: unknown;
    transactionReference: unknown;
    status: unknown;
    chequeStatus: unknown;
    createdAt: unknown;
};
export declare function getPayment(actor: FinanceActor, paymentId: number): Promise<{
    allocations: {
        demandId: number;
        demandNumber: any;
        amount: string;
    }[];
    id: number;
    paymentNumber: unknown;
    studentId: number | null;
    subjectType: {};
    subjectId: number | null;
    studentName: {} | null;
    applicantName: {} | null;
    applicationNumber: {} | null;
    usn: {} | null;
    amount: string;
    paymentDate: unknown;
    paymentMethod: unknown;
    transactionReference: unknown;
    status: unknown;
    chequeStatus: unknown;
    createdAt: unknown;
}>;
export {};
