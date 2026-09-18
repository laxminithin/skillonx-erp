export declare function parseJson<T>(raw: unknown, fallback: T): T;
export declare function getEmployeeLibraryObligations(employeeId: number, collegeId: number): Promise<{
    applicable: boolean;
    memberId: number | null;
    activeLoans: number;
    overdueLoans: number;
    lostLoans: number;
    fineAmount: string;
    loanRefs: Array<{
        id: number;
        status: string;
    }>;
    status: "NOT_APPLICABLE" | "CLEARED" | "DUE";
} | {
    applicable: boolean;
    memberId: number;
    activeLoans: number;
    overdueLoans: number;
    lostLoans: number;
    fineAmount: any;
    loanRefs: {
        id: number;
        status: string;
    }[];
    status: "DUE" | "CLEARED";
}>;
export declare function getLastLockedPayroll(employeeId: number, collegeId: number): Promise<{
    payrollRunId: number;
    payrollRunEmployeeId: number;
    periodId: number;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    netAmount: string;
    grossAmount: string;
    lopDays: number;
    runStatus: string;
    snapshot: null;
} | null>;
export declare function getSalaryBasisAsOf(employeeId: number, collegeId: number, asOf: string): Promise<{
    assignmentId: number | null;
    structureId: number | null;
    structureCode: string | null;
    basic: string;
    gross: string;
    components: Array<{
        code: string;
        type: string;
        amount: string;
    }>;
}>;
export declare function getLeaveBalanceSnapshot(employeeId: number, collegeId: number, year: number): Promise<{
    leaveTypeId: number;
    leaveTypeCode: string;
    leaveTypeName: string;
    year: number;
    availableBalance: number;
    isPaid: boolean;
    encashmentEligible: boolean;
    negativeAllowed: boolean;
}[]>;
export declare function getHostelClearanceSnapshot(employeeId: number, collegeId: number): Promise<{
    domain: "HOSTEL";
    status: string;
    source: string;
}>;
export declare function getTransportClearanceSnapshot(employeeId: number, collegeId: number): Promise<{
    domain: "TRANSPORT";
    status: string;
    source: string;
}>;
export declare function getFinanceDuesSnapshot(employeeId: number, collegeId: number): Promise<{
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
    status: "NOT_APPLICABLE" | "DUE" | "CLEARED";
}>;
export declare function daysBetween(from: string, to: string): number;
