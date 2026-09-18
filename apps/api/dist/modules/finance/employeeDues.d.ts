import { db } from '../../db/index.js';
import type { FinanceActor } from './types.js';
export declare function registerEmployeeDue(actor: FinanceActor, input: {
    employeeId: number;
    dueType: string;
    amount: number;
    sourceRef?: string | null;
    remarks?: string | null;
}): Promise<{
    id: number;
    amount: string;
    outstanding: string;
    status: string;
}>;
export declare function listOpenEmployeeDues(collegeId: number, employeeId: number): Promise<{
    id: number;
    dueType: string;
    sourceRef: string | null;
    amount: string;
    outstanding: string;
    status: string;
    settledByPayrollRunId: number | null;
    remarks: string | null;
}[]>;
export declare function getEmployeeFinanceDueTotal(collegeId: number, employeeId: number): Promise<{
    dues: {
        id: number;
        dueType: string;
        sourceRef: string | null;
        amount: string;
        outstanding: string;
        status: string;
        settledByPayrollRunId: number | null;
        remarks: string | null;
    }[];
    total: string;
}>;
export declare function markDuesSettledBySettlement(trx: import('knex').Knex.Transaction | typeof db, collegeId: number, employeeId: number, settlementId: number, dueIds: number[]): Promise<void>;
