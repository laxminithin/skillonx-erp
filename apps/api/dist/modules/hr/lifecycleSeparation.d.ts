import type { HrActor } from './types.js';
export declare function getEmployeeLibraryClearance(_employeeId: number, _collegeId: number): Promise<{
    domain: string;
    status: "NOT_APPLICABLE";
}>;
export declare function getEmployeeTransportClearance(employeeId: number, collegeId: number): Promise<{
    domain: string;
    status: "NOT_APPLICABLE";
} | {
    domain: string;
    status: "PENDING" | "CLEAR";
}>;
export declare function getEmployeeHostelClearance(employeeId: number, collegeId: number): Promise<{
    domain: string;
    status: "NOT_APPLICABLE";
} | {
    domain: string;
    status: "PENDING" | "CLEAR";
}>;
export declare function getEmployeeFinanceClearance(_employeeId: number, _collegeId: number): Promise<{
    domain: string;
    status: "NOT_APPLICABLE";
}>;
export declare function initializeClearance(separationRequestId: number, employeeId: number): Promise<void>;
export declare function submitResignation(actor: HrActor, input: {
    proposedLastWorkingDate: string;
    reason?: string;
    remarks?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function getMyResignation(actor: HrActor): Promise<any>;
export declare function withdrawResignation(actor: HrActor, requestId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function managerRecommendSeparation(actor: HrActor, requestId: number, input: {
    recommendation: 'ACCEPT' | 'REJECT';
    remarks?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function hrInitiateSeparation(actor: HrActor, employeeId: number, input: {
    separationType: string;
    lastWorkingDate: string;
    reason: string;
    noticePeriodDays?: number;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function approveSeparation(actor: HrActor, requestId: number, input: {
    approvedLastWorkingDate: string;
    notes?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function rejectSeparation(actor: HrActor, requestId: number, reason: string): Promise<{
    id: number;
    status: string;
}>;
export declare function updateClearance(actor: HrActor, requestId: number, domain: string, input: {
    status: string;
    notes?: string;
    waive?: boolean;
}): Promise<{
    requestId: number;
    domain: string;
    status: string;
}>;
export declare function checkClearanceComplete(requestId: number): Promise<{
    complete: boolean;
    blocking: unknown[];
}>;
export declare function getSeparationAssignmentSummary(actor: HrActor, employeeId: number): Promise<{
    academic: string;
    hostel: string;
    transport: string;
    placement: string;
    library: string;
}>;
export declare function completeSeparation(actor: HrActor, requestId: number): Promise<{
    requestId: number;
    employeeId: number;
    status: string;
}>;
export declare function listSeparations(actor: HrActor, scope: 'admin' | 'manager'): Promise<any[]>;
export declare function getSeparation(actor: HrActor, requestId: number): Promise<any>;
