import type { HostelActor } from './types.js';
export declare function listStudentLeaves(studentId: number, collegeId: number): Promise<{
    id: number;
    leaveType: unknown;
    fromAt: unknown;
    toAt: unknown;
    destination: unknown;
    reason: unknown;
    guardianConfirmed: boolean;
    status: unknown;
    approvedAt: unknown;
    actualDepartureAt: unknown;
    actualReturnAt: unknown;
}[]>;
export declare function createLeave(studentId: number, collegeId: number, input: {
    leaveType?: string;
    fromAt: string;
    toAt: string;
    destination?: string;
    reason?: string;
    guardianConfirmed?: boolean;
}): Promise<{
    id: number;
    leaveType: unknown;
    fromAt: unknown;
    toAt: unknown;
    destination: unknown;
    reason: unknown;
    guardianConfirmed: boolean;
    status: unknown;
    approvedAt: unknown;
    actualDepartureAt: unknown;
    actualReturnAt: unknown;
}>;
export declare function cancelLeave(studentId: number, collegeId: number, leaveId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function approveLeave(actor: HostelActor, leaveId: number, action: 'APPROVE' | 'REJECT', reason?: string): Promise<{
    id: number;
    status: string;
}>;
