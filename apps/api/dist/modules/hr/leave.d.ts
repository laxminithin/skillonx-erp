import type { HrActor } from './types.js';
export declare function getLeaveBalances(actor: HrActor): Promise<{
    leaveTypeId: number;
    leaveTypeCode: unknown;
    leaveTypeName: unknown;
    year: number;
    openingBalance: number;
    credited: number;
    availed: number;
    adjusted: number;
    carriedForward: number;
    availableBalance: number;
}[]>;
export declare function listLeaveTypes(collegeId: number): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    isPaid: boolean;
    requiresDocument: boolean;
}[]>;
export declare function createLeaveRequest(actor: HrActor, input: {
    leaveTypeId: number;
    fromDate: string;
    toDate: string;
    fromSession: string;
    toSession: string;
    reason?: string | null;
    isEmergency?: boolean;
}): Promise<{
    requestedDays: number;
    id: number;
    requestNumber: string;
    academicImpact: {
        affectedSessions: unknown[];
        totalAffected: number;
        coverageRequired: boolean;
    };
}>;
export declare function getLeaveAcademicImpactForRequest(actor: HrActor, leaveRequestId: number): Promise<{
    affectedSessions: import("./academicImpact.js").AffectedSession[];
    totalAffected: number;
    coverageRequired: boolean;
}>;
export declare function listMyLeaveRequests(actor: HrActor): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    requestNumber: unknown;
    leaveTypeId: number;
    fromDate: unknown;
    toDate: unknown;
    fromSession: unknown;
    toSession: unknown;
    requestedDays: number;
    reason: unknown;
    isEmergency: boolean;
    status: unknown;
    submittedAt: unknown;
    currentApprovalStep: unknown;
    academicCoverageStatus: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    leaveTypeName: unknown;
    leaveTypeCode: unknown;
    employeeName: unknown;
    academicApproverEmployeeId: number | null;
    academicApprovedByEmployeeId: number | null;
    academicApprovedAt: {} | null;
    approvalStage: string | null;
}[]>;
export declare function submitLeaveRequest(actor: HrActor, leaveRequestId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function requestSubstituteCoverage(actor: HrActor, input: {
    coverageId: number;
    substituteEmployeeId: number;
    message?: string | null;
}): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function respondToCoverageRequest(actor: HrActor, coverageRequestId: number, accept: boolean): Promise<{
    coverageRequestId: number;
    status: string;
}>;
export declare function getCoverageRequestType(coverageRequestId: number): Promise<string | null>;
export declare function listCoverageRequestsForActor(actor: HrActor): Promise<{
    id: number;
    coverageId: number;
    requestType: {};
    status: unknown;
    message: unknown;
    affectedDate: unknown;
    startTime: unknown;
    endTime: unknown;
    className: unknown;
    subjectName: unknown;
    subjectCode: unknown;
    requestedByName: unknown;
    swapTargetDate: unknown;
    swapClassName: unknown;
    swapSubjectName: unknown;
    swapStartTime: unknown;
    swapEndTime: unknown;
}[]>;
export declare function listPendingLeaveForManager(actor: HrActor): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    requestNumber: unknown;
    leaveTypeId: number;
    fromDate: unknown;
    toDate: unknown;
    fromSession: unknown;
    toSession: unknown;
    requestedDays: number;
    reason: unknown;
    isEmergency: boolean;
    status: unknown;
    submittedAt: unknown;
    currentApprovalStep: unknown;
    academicCoverageStatus: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    leaveTypeName: unknown;
    leaveTypeCode: unknown;
    employeeName: unknown;
    academicApproverEmployeeId: number | null;
    academicApprovedByEmployeeId: number | null;
    academicApprovedAt: {} | null;
    approvalStage: string | null;
}[]>;
export declare function getLeaveRequestDetail(actor: HrActor, leaveRequestId: number): Promise<{
    coverages: {
        id: number;
        affectedDate: unknown;
        coverageType: unknown;
        status: unknown;
        substituteName: unknown;
        subjectName: unknown;
        className: unknown;
        startTime: unknown;
        endTime: unknown;
    }[];
    availableBalance: number | null;
    id: number;
    collegeId: number;
    employeeId: number;
    requestNumber: unknown;
    leaveTypeId: number;
    fromDate: unknown;
    toDate: unknown;
    fromSession: unknown;
    toSession: unknown;
    requestedDays: number;
    reason: unknown;
    isEmergency: boolean;
    status: unknown;
    submittedAt: unknown;
    currentApprovalStep: unknown;
    academicCoverageStatus: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    leaveTypeName: unknown;
    leaveTypeCode: unknown;
    employeeName: unknown;
    academicApproverEmployeeId: number | null;
    academicApprovedByEmployeeId: number | null;
    academicApprovedAt: {} | null;
    approvalStage: string | null;
}>;
export declare function approveLeaveRequest(actor: HrActor, leaveRequestId: number, notes?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function rejectLeaveRequest(actor: HrActor, leaveRequestId: number, notes?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function cancelLeaveRequest(actor: HrActor, leaveRequestId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function listUnresolvedCoverage(actor: HrActor): Promise<any[]>;
