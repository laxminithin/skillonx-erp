import type { TransportActor } from './types.js';
export declare function createChangeRequest(studentId: number, collegeId: number, input: {
    changeType: string;
    requestedRouteId?: number;
    requestedPickupStopId?: number;
    requestedDropStopId?: number;
    requestedServiceType?: string;
    effectiveDate?: string;
    reason: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function approveChangeRequest(actor: TransportActor, changeId: number): Promise<{
    changeId: number;
    status: string;
    newAssignmentId: any;
}>;
export declare function listStudentChanges(studentId: number, collegeId: number): Promise<{
    id: number;
    changeType: any;
    status: any;
    reason: any;
    effectiveDate: any;
    createdAt: any;
}[]>;
export declare function requestCancellation(studentId: number, collegeId: number, reason: string, effectiveDate?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function completeCancellation(actor: TransportActor, requestId: number): Promise<{
    id: number;
    status: string;
}>;
