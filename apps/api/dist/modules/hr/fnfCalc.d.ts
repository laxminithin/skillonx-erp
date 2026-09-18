import type { FnfPolicy } from './fnfPolicy.js';
import type { FnfComponentInput } from './fnfTypes.js';
export type SalaryBasis = {
    basic: string;
    gross: string;
    assignmentId: number | null;
    structureId: number | null;
    structureCode: string | null;
};
export type LeaveSnap = {
    leaveTypeId: number;
    leaveTypeCode: string;
    leaveTypeName: string;
    availableBalance: number;
    encashmentEligible: boolean;
};
export type PayrollSnap = {
    payrollRunId: number;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    netAmount: string;
    lopDays: number;
} | null;
export declare function computeLeaveEncashment(policy: FnfPolicy, leaves: LeaveSnap[], salary: SalaryBasis): FnfComponentInput[];
export declare function computeNoticePay(policy: FnfPolicy, input: {
    requiredDays: number;
    noticeDate: string | null;
    lastWorkingDate: string;
    waived: boolean;
    waiverReason?: string | null;
}, salary: SalaryBasis): {
    component: FnfComponentInput | null;
    served: number;
    shortfall: number;
};
export declare function computeUnpaidSalary(lastPayroll: PayrollSnap, lastWorkingDate: string, salary: SalaryBasis, divisor: number): FnfComponentInput | null;
export declare function computeGratuity(policy: FnfPolicy, salary: SalaryBasis, dateOfJoining: string | null, lastWorkingDate: string): FnfComponentInput | null;
export declare function summarizeComponents(components: FnfComponentInput[]): {
    grossPayable: string;
    totalRecoveries: string;
    netAmount: string;
    direction: string;
};
