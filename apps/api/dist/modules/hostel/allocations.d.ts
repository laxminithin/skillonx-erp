import type { HostelActor } from './types.js';
export declare function allocateBed(actor: HostelActor, input: {
    applicationId?: number;
    residentId?: number;
    studentId: number;
    bedId: number;
    reason?: string;
}): Promise<{
    allocationId: number;
    residentId: number;
    bedId: number;
    bedCode: any;
    roomNumber: any;
    status: string;
}>;
export declare function transferBed(actor: HostelActor, residentId: number, newBedId: number, transferType: string, reason?: string): Promise<{
    allocationId: number;
    oldAllocationId: number;
    status: string;
}>;
export declare function getStudentRoom(studentId: number, collegeId: number): Promise<{
    hostelName: any;
    hostelCode: any;
    blockCode: any;
    blockName: any;
    floorNumber: any;
    roomNumber: any;
    roomType: any;
    bedCode: any;
    residentNumber: any;
    admittedAt: any;
    residentStatus: any;
    allocationId: number;
    roommates: {
        name: any;
        usn: any;
        bedCode: any;
    }[];
} | null>;
export declare function getAllocationHistory(studentId: number, collegeId: number): Promise<{
    id: number;
    hostelName: any;
    roomNumber: any;
    bedCode: any;
    allocationType: any;
    startAt: any;
    endAt: any;
    status: any;
}[]>;
export declare function getRoomOccupancy(actor: HostelActor, hostelId: number): Promise<{
    id: number;
    code: any;
    name: any;
    floors: {
        id: number;
        floorNumber: any;
        rooms: {
            id: number;
            roomNumber: any;
            roomType: any;
            status: any;
            beds: {
                id: number;
                bedCode: any;
                status: any;
                studentName: any;
                usn: any;
            }[];
        }[];
    }[];
}[]>;
export declare function getHostelCapacity(collegeId: number, hostelId?: number): Promise<{
    totalBeds: number;
    usableBeds: number;
    occupiedBeds: number;
    reservedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    blockedBeds: number;
    occupancyPercent: number;
}>;
