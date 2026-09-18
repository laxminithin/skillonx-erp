export declare const PAYROLL_SNAPSHOT_VERSION = "1";
export type SnapshotComponent = {
    componentId: number;
    code: string;
    name: string;
    componentType: string;
    calculationType: string;
    amount: number | null;
    percentage: number | null;
    percentageOfComponentId: number | null;
    lopAffected: boolean;
    isProratable: boolean;
    isStatutory: boolean;
};
export type PayrollInputSnapshot = {
    version: typeof PAYROLL_SNAPSHOT_VERSION;
    calculatedAt: string;
    employee: {
        employeeId: number;
        employeeNumber: string | null;
        displayName: string | null;
        employmentStatus: string;
        departmentId: number | null;
        departmentName: string | null;
        designationId: number | null;
        designationName: string | null;
        dateOfJoining: string | null;
        lastWorkingDate: string | null;
    };
    assignment: {
        assignmentId: number;
        structureId: number;
        structureCode: string;
        structureName: string;
        effectiveFrom: string;
        effectiveTo: string | null;
    };
    components: SnapshotComponent[];
    attendance: {
        closureId: number | null;
        calculationVersion: number | null;
        year: number;
        month: number;
        workingDays: number;
        payableDays: number;
        lopDays: number;
        employmentApplicableDays: number;
    };
    adjustments: Array<{
        id: number;
        adjustmentType: string;
        componentId: number | null;
        amount: number;
        reason: string;
        sourcePeriodId: number | null;
        sourceComponentId: number | null;
    }>;
};
export type CalcComponentResult = {
    componentId: number;
    code: string;
    name: string;
    componentType: string;
    calculationType: string;
    lopAffected: boolean;
    isProratable: boolean;
    baseAmount: string;
    amount: string;
    calcDetail: Record<string, unknown>;
};
export type EmployeeCalcResult = {
    gross: string;
    deductions: string;
    employerContributions: string;
    net: string;
    components: CalcComponentResult[];
    trace: {
        workingDays: number;
        payableDays: number;
        lopDays: number;
        prorationFactor: number;
        steps: string[];
    };
    validationErrors: string[];
    calculationStatus: 'OK' | 'ERROR' | 'SKIPPED';
};
export declare function calculateEmployeePayroll(snapshot: PayrollInputSnapshot): EmployeeCalcResult;
