import type { FinancialClearanceResult, NoDueDomainStatus } from './types.js';
/** Central finance clearance API for other domains. */
export declare function getFinancialClearance(studentId: number, collegeId: number): Promise<FinancialClearanceResult>;
export declare function getStudentNoDueStatus(studentId: number, collegeId: number): Promise<{
    domains: {
        domain: string;
        status: NoDueDomainStatus;
        label: string;
    }[];
    overallClear: boolean;
}>;
export declare function hasOutstandingDues(studentId: number, collegeId: number): Promise<boolean>;
export declare function getStudentFinancialStatus(studentId: number, collegeId: number): Promise<{
    totalFees: string;
    paid: string;
    outstanding: string;
    nextDueDate: string | null;
    demandCount: number;
}>;
export declare function getExamFinancialEligibility(studentId: number, collegeId: number, examId?: number): Promise<{
    eligible: boolean;
    reasonCode?: string;
    outstandingAmount: string;
}>;
export declare function getExamFeeStatus(studentId: number, collegeId: number): Promise<{
    eligible: boolean;
    reasonCode?: string;
    outstandingAmount: string;
}>;
