import type { HrActor } from './types.js';
/**
 * Payroll handoff contract — consume only finalized/locked attendance months.
 */
export declare function getPayrollAttendanceHandoff(collegeId: number, year: number, month: number): Promise<{
    closureId: number;
    closureStatus: any;
    calculationVersion: number;
    year: number;
    month: number;
    employees: {
        employeeId: number;
        employeeNumber: unknown;
        employeeName: unknown;
        departmentName: unknown;
        employmentApplicableDays: number;
        workingDays: number;
        payableDays: number;
        lopDays: number;
        paidLeaveDays: number;
        unpaidLeaveDays: number;
        absenceDays: number;
        halfDays: number;
        presentDays: number;
    }[];
}>;
export declare function payrollHandoffForActor(actor: HrActor, year: number, month: number): Promise<{
    closureId: number;
    closureStatus: any;
    calculationVersion: number;
    year: number;
    month: number;
    employees: {
        employeeId: number;
        employeeNumber: unknown;
        employeeName: unknown;
        departmentName: unknown;
        employmentApplicableDays: number;
        workingDays: number;
        payableDays: number;
        lopDays: number;
        paidLeaveDays: number;
        unpaidLeaveDays: number;
        absenceDays: number;
        halfDays: number;
        presentDays: number;
    }[];
}>;
