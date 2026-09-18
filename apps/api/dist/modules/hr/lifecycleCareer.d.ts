import type { HrActor } from './types.js';
type Row = Record<string, unknown>;
export declare function recommendProbation(actor: HrActor, reviewId: number, input: {
    recommendation: string;
    performanceSummary?: string;
    remarks?: string;
}): Promise<{
    reviewId: number;
    recommendation: string;
}>;
export declare function confirmEmployee(actor: HrActor, reviewId: number, input: {
    effectiveDate?: string;
    reference?: string;
}): Promise<{
    employeeId: number;
    status: string;
}>;
export declare function extendProbation(actor: HrActor, reviewId: number, input: {
    newEndDate: string;
    reason: string;
}): Promise<{
    reviewId: number;
    newEndDate: string;
}>;
export declare function listProbation(actor: HrActor, scope: 'admin' | 'manager'): Promise<any[]>;
export declare function promoteEmployee(actor: HrActor, employeeId: number, input: {
    newDesignationId: number;
    effectiveDate: string;
    newGradeId?: number | null;
    reason?: string;
    approvalReference?: string;
}): Promise<{
    scheduled: boolean;
    careerActionId: number;
    effectiveDate: string;
    payload?: undefined;
} | {
    scheduled: boolean;
    effectiveDate: string;
    payload: Row;
    careerActionId?: undefined;
} | {
    promotionId: number;
    effectiveDate: string;
}>;
export declare function transferEmployee(actor: HrActor, employeeId: number, input: {
    toDepartmentId: number;
    effectiveDate: string;
    newReportingManagerEmployeeId?: number | null;
    newDesignationId?: number | null;
    reason?: string;
}): Promise<{
    transferId: number;
    effectiveDate: string;
    academicAssignmentWarning: boolean;
} | {
    academicAssignmentWarning: boolean;
    scheduled: boolean;
    careerActionId: number;
    effectiveDate: string;
    payload?: undefined;
} | {
    academicAssignmentWarning: boolean;
    scheduled: boolean;
    effectiveDate: string;
    payload: Row;
    careerActionId?: undefined;
}>;
export declare function changeReportingManager(actor: HrActor, employeeId: number, input: {
    reportingManagerEmployeeId: number | null;
    effectiveDate: string;
    reason?: string;
}): Promise<{
    scheduled: boolean;
    careerActionId: number;
    effectiveDate: string;
    payload?: undefined;
} | {
    scheduled: boolean;
    effectiveDate: string;
    payload: Row;
    careerActionId?: undefined;
} | {
    employeeId: number;
    reportingManagerEmployeeId: number | null;
}>;
export declare function changeDesignation(actor: HrActor, employeeId: number, input: {
    newDesignationId: number;
    effectiveDate: string;
    reason: string;
}): Promise<{
    scheduled: boolean;
    careerActionId: number;
    effectiveDate: string;
    payload?: undefined;
} | {
    scheduled: boolean;
    effectiveDate: string;
    payload: Row;
    careerActionId?: undefined;
} | {
    employeeId: number;
    newDesignationId: number;
}>;
export declare function listCareerActions(actor: HrActor, employeeId: number): Promise<any[]>;
export declare function createContract(actor: HrActor, employeeId: number, input: {
    contractType: string;
    startDate: string;
    endDate: string;
    noticePeriodDays?: number;
    reference?: string;
    remarks?: string;
}): Promise<{
    id: number;
}>;
export declare function renewContract(actor: HrActor, contractId: number, input: {
    startDate: string;
    endDate: string;
    reference?: string;
}): Promise<{
    oldContractId: number;
    newContractId: number;
}>;
export declare function terminateContract(actor: HrActor, contractId: number, reason: string): Promise<{
    contractId: number;
    status: string;
}>;
export declare function listContracts(actor: HrActor, employeeId: number): Promise<any[]>;
export declare function suspendEmployee(actor: HrActor, employeeId: number, input: {
    effectiveDate: string;
    reason: string;
}): Promise<{
    employeeId: number;
    status: string;
}>;
export declare function reinstateEmployee(actor: HrActor, employeeId: number, input: {
    effectiveDate: string;
    reason: string;
    toStatus?: string;
}): Promise<{
    employeeId: number;
    status: string;
}>;
export {};
