import type { Knex } from 'knex';
import type { LibraryActor } from './types.js';
export declare function generateOverdueFine(loanId: number, collegeId: number, trx?: Knex.Transaction): Promise<{
    id: number;
    memberId: number;
    loanId: number | null;
    fineType: unknown;
    amount: string;
    waivedAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    remarks: unknown;
    financeDemandId: number | null;
} | null>;
export declare function createLostFine(trx: Knex.Transaction, params: {
    collegeId: number;
    memberId: number;
    loanId: number;
    amount: number;
    assessedBy: number;
    remarks?: string;
}): Promise<{
    id: number;
    memberId: number;
    loanId: number | null;
    fineType: unknown;
    amount: string;
    waivedAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    remarks: unknown;
    financeDemandId: number | null;
}>;
export declare function listMemberFines(memberId: number, collegeId: number): Promise<{
    id: number;
    memberId: number;
    loanId: number | null;
    fineType: unknown;
    amount: string;
    waivedAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    remarks: unknown;
    financeDemandId: number | null;
}[]>;
export declare function waiveFine(actor: LibraryActor, fineId: number, amount: number, reason: string): Promise<{
    id: number;
    memberId: number;
    loanId: number | null;
    fineType: unknown;
    amount: string;
    waivedAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    remarks: unknown;
    financeDemandId: number | null;
}>;
export declare function syncFineFromFinance(fineId: number, collegeId: number): Promise<void>;
export declare function syncAllFinesForStudent(studentId: number, collegeId: number): Promise<void>;
/**
 * Retries the Finance handoff for fines whose demand creation previously failed or was
 * never attempted (e.g. process restart between insert and the fire-and-forget call).
 * Idempotent: createLibraryFineDemand no-ops once finance_demand_id is set.
 */
export declare function reconcilePendingFineFinanceHandoffs(collegeId: number): Promise<{
    attempted: number;
    succeeded: number;
    failed: number;
}>;
export declare function getMemberOutstanding(memberId: number, collegeId: number): Promise<string>;
export declare function staffListFines(actor: LibraryActor, status?: string): Promise<{
    memberName: any;
    memberIdentifier: any;
    id: number;
    memberId: number;
    loanId: number | null;
    fineType: unknown;
    amount: string;
    waivedAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    status: unknown;
    remarks: unknown;
    financeDemandId: number | null;
}[]>;
