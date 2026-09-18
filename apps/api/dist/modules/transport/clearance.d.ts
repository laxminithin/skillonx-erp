import type { TransportNoDueReason, TransportNoDueStatus } from './types.js';
export declare function getTransportNoDueStatus(studentId: number, collegeId: number): Promise<{
    status: TransportNoDueStatus;
    reasons: TransportNoDueReason[];
}>;
export declare function getStudentClearance(studentId: number, collegeId: number): Promise<{
    transport: {
        status: TransportNoDueStatus;
        reasons: TransportNoDueReason[];
        label: string;
    };
    overallClear: boolean;
}>;
