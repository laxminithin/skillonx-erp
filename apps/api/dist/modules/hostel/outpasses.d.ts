import type { HostelActor } from './types.js';
export declare function listStudentOutpasses(studentId: number, collegeId: number): Promise<{
    id: number;
    outpassNumber: unknown;
    purpose: unknown;
    destination: unknown;
    expectedExitAt: unknown;
    expectedReturnAt: unknown;
    status: unknown;
    approvedAt: unknown;
    actualExitAt: unknown;
    actualReturnAt: unknown;
    lateReturnMinutes: number | null;
    qrToken: unknown;
}[]>;
export declare function createOutpass(studentId: number, collegeId: number, input: {
    purpose: string;
    destination?: string;
    expectedExitAt: string;
    expectedReturnAt: string;
}): Promise<{
    id: number;
    outpassNumber: unknown;
    purpose: unknown;
    destination: unknown;
    expectedExitAt: unknown;
    expectedReturnAt: unknown;
    status: unknown;
    approvedAt: unknown;
    actualExitAt: unknown;
    actualReturnAt: unknown;
    lateReturnMinutes: number | null;
    qrToken: unknown;
}>;
export declare function cancelOutpass(studentId: number, collegeId: number, outpassId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function approveOutpass(actor: HostelActor, outpassId: number, action: 'APPROVE' | 'REJECT', reason?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function verifyOutpassToken(collegeId: number, token: string): Promise<{
    id: number;
    outpassNumber: any;
    studentName: any;
    usn: any;
    hostelName: any;
    roomNumber: any;
    purpose: any;
    destination: any;
    expectedExitAt: any;
    expectedReturnAt: any;
    status: any;
    actualExitAt: any;
    actualReturnAt: any;
}>;
