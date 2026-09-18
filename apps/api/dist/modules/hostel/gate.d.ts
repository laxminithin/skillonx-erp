import type { HostelActor } from './types.js';
export declare function searchResident(collegeId: number, query: string): Promise<{
    residentId: number;
    studentId: number;
    usn: any;
    studentName: any;
    hostelName: any;
    roomNumber: any;
    bedCode: any;
    status: any;
}[]>;
export declare function recordGateExit(actor: HostelActor, input: {
    residentId: number;
    outpassId?: number;
    leaveId?: number;
    gate?: string;
    source?: string;
    remarks?: string;
}): Promise<{
    residentId: number;
    movementType: string;
    recorded: boolean;
}>;
export declare function recordGateEntry(actor: HostelActor, input: {
    residentId: number;
    outpassId?: number;
    leaveId?: number;
    gate?: string;
    remarks?: string;
}): Promise<{
    residentId: number;
    movementType: string;
    recorded: boolean;
}>;
export declare function emergencyOverride(actor: HostelActor, residentId: number, movementType: 'EXIT' | 'ENTRY', reason: string, gate?: string): Promise<{
    residentId: number;
    movementType: "EXIT" | "ENTRY";
    source: string;
}>;
export declare function listResidentsOutside(actor: HostelActor, hostelId?: number): Promise<{
    outpassId: number;
    residentId: number;
    usn: any;
    studentName: any;
    outpassNumber: any;
    expectedReturnAt: any;
    actualExitAt: any;
}[]>;
export declare function listOverdueReturns(actor: HostelActor, hostelId?: number): Promise<{
    outpassId: number;
    residentId: number;
    usn: any;
    studentName: any;
    outpassNumber: any;
    expectedReturnAt: any;
    minutesOverdue: number;
}[]>;
export declare function verifyOutpassByToken(actor: HostelActor, token: string): Promise<{
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
