import type { HrActor } from './types.js';
import { applyCoverageOverrides } from './academicContinuity.js';
export declare const RESOLVED_COVERAGE_STATUSES: Set<string>;
export type LeaveCoverageSummary = {
    totalAffected: number;
    resolved: number;
    unresolved: number;
    acceptedSubstitutions: number;
    swaps: number;
    rescheduled: number;
    hodArrangement: number;
    cancelled: number;
    teamTeaching: number;
    status: 'NOT_REQUIRED' | 'PENDING' | 'PARTIAL' | 'COMPLETE' | 'EMERGENCY_UNRESOLVED' | 'FAILED' | 'CANCELLED';
    unresolvedCoverageIds: number[];
};
export declare function getLeaveCoverageSummary(leaveRequestId: number): Promise<LeaveCoverageSummary>;
export declare function syncLeaveCoverageStatus(leaveRequestId: number): Promise<LeaveCoverageSummary>;
export declare function getCoverageForLeaveRequest(actor: HrActor, leaveRequestId: number): Promise<{
    leaveRequestId: number;
    coverages: {
        id: number;
        affectedDate: string;
        coverageType: unknown;
        status: unknown;
        priority: unknown;
        hodActionRequired: boolean;
        substituteName: unknown;
        substituteEmployeeId: number | null;
        subjectName: unknown;
        subjectCode: unknown;
        className: unknown;
        classCode: unknown;
        sectionName: unknown;
        roomName: unknown;
        periodNumber: unknown;
        startTime: unknown;
        endTime: unknown;
        makeupDate: string | null;
        makeupStartTime: string | null;
        makeupEndTime: string | null;
        swapId: number | null;
        timetableSlotId: number | null;
        plannedTopic: string | null;
    }[];
    summary: LeaveCoverageSummary;
}>;
export declare function proposeClassSwap(actor: HrActor, input: {
    coverageId: number;
    swapEmployeeId: number;
    targetTimetableSlotId: number;
    targetDate: string;
    message?: string | null;
}): Promise<{
    swapId: number;
    coverageRequestId: number;
}>;
export declare function respondToSwapRequest(actor: HrActor, coverageRequestId: number, accept: boolean): Promise<{
    coverageRequestId: number;
    status: string;
}>;
export declare function checkRescheduleAvailability(actor: HrActor, input: {
    coverageId: number;
    makeupDate: string;
    startTime: string;
    endTime: string;
    roomId?: number | null;
    facultyId?: number | null;
}): Promise<{
    available: boolean;
    code?: import("./academicContinuity.js").ConflictCode;
    message?: string;
}>;
export declare function managerReschedule(actor: HrActor, coverageId: number, input: {
    makeupDate: string;
    startTime: string;
    endTime: string;
    roomId?: number | null;
    makeupKind?: 'RESCHEDULE' | 'MAKEUP' | 'EXTRA_CLASS';
}): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function proposeReschedule(actor: HrActor, input: {
    coverageId: number;
    makeupDate: string;
    startTime: string;
    endTime: string;
    roomId?: number | null;
    makeupKind?: 'RESCHEDULE' | 'MAKEUP' | 'EXTRA_CLASS';
}): Promise<{
    coverageId: number;
    status: string;
    available: boolean;
}>;
export declare function requestHodArrangement(actor: HrActor, coverageId: number, reason?: string | null): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function managerVerifyCoverage(actor: HrActor, coverageId: number, notes?: string | null): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function managerAssignSubstitute(actor: HrActor, coverageId: number, substituteEmployeeId: number, options?: {
    skipConsent?: boolean;
    reason?: string | null;
}): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function managerAuthorizedCancel(actor: HrActor, coverageId: number, reason: string): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function managerMarkTeamTeaching(actor: HrActor, coverageId: number, notes?: string | null): Promise<{
    coverageId: number;
    status: string;
}>;
export declare function listManagerCoverage(actor: HrActor, filter?: 'attention' | 'today' | 'upcoming' | 'resolved'): Promise<{
    id: number;
    leaveRequestId: number;
    requestNumber: unknown;
    employeeName: unknown;
    isEmergency: boolean;
    affectedDate: unknown;
    coverageType: unknown;
    status: unknown;
    priority: {};
    subjectName: unknown;
    className: unknown;
    startTime: unknown;
    endTime: unknown;
    substituteName: unknown;
    hodActionRequired: boolean;
}[]>;
export declare function finalizeLeaveCoverageNotifications(leaveRequestId: number, collegeId: number): Promise<void>;
export declare function reverseLeaveCoverageOnCancel(leaveRequestId: number, actor: HrActor): Promise<void>;
export declare function listEligibleSubstitutes(actor: HrActor, coverageId: number, search?: string, opts?: {
    managerMode?: boolean;
}): Promise<{
    employeeId: number;
    displayName: any;
    employeeNumber: any;
    designationName: any;
    departmentName: any;
    available: boolean;
    unavailableReason: string | null | undefined;
    code: import("./academicContinuity.js").ConflictCode | null;
}[]>;
export declare function listSwapCompatibleSessions(actor: HrActor, coverageId: number, swapEmployeeId: number): Promise<{
    source: null;
    sessions: never[];
    swapEmployeeId?: undefined;
} | {
    source: {
        subjectName: any;
        subjectCode: any;
        className: any;
        date: string;
        startTime: string;
        endTime: string;
        periodNumber: any;
    };
    swapEmployeeId: number;
    sessions: {
        targetTimetableSlotId: number;
        targetDate: string;
        subjectName: any;
        subjectCode: any;
        className: any;
        startTime: string;
        endTime: string;
        periodNumber: any;
        available: boolean;
        conflictCode: import("./academicContinuity.js").ConflictCode | null | undefined;
        conflictMessage: string | null | undefined;
    }[];
}>;
export declare function getManagerCoverageDetail(actor: HrActor, coverageId: number): Promise<{
    id: number;
    leaveRequestId: number;
    requestNumber: any;
    employeeName: any;
    isEmergency: boolean;
    leaveReason: any;
    affectedDate: string;
    coverageType: any;
    status: any;
    priority: any;
    hodActionRequired: boolean;
    subjectName: any;
    subjectCode: any;
    className: any;
    roomName: any;
    periodNumber: any;
    startTime: any;
    endTime: any;
    substituteName: any;
    substituteEmployeeId: number | null;
    reason: any;
    makeupDate: string | null;
    makeupStartTime: string | null;
    makeupEndTime: string | null;
}>;
export { applyCoverageOverrides };
