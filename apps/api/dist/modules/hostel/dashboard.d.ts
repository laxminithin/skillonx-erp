import type { HostelActor } from './types.js';
export declare function wardenDashboard(actor: HostelActor, hostelId?: number): Promise<{
    capacity: {
        totalBeds: number;
        usableBeds: number;
        occupiedBeds: number;
        reservedBeds: number;
        availableBeds: number;
        maintenanceBeds: number;
        blockedBeds: number;
        occupancyPercent: number;
    };
    applicationsPending: number;
    waitlistedStudents: number;
    allocationPending: number;
    residentsActive: number;
    residentsCurrentlyOutside: number;
    activeOutpasses: number;
    lateReturns: number;
    pendingLeave: number;
    visitorsCurrentlyInside: number;
    openComplaints: number;
    maintenanceBeds: number;
    pendingVacating: number;
}>;
export declare function managementDashboard(actor: HostelActor): Promise<{
    totalHostels: number;
    capacity: {
        totalBeds: number;
        usableBeds: number;
        occupiedBeds: number;
        reservedBeds: number;
        availableBeds: number;
        maintenanceBeds: number;
        blockedBeds: number;
        occupancyPercent: number;
    };
    applications: number;
    approved: number;
    waitlisted: number;
    residents: number;
    openComplaints: number;
    pendingVacating: number;
    readOnly: boolean;
}>;
export declare function listResidents(actor: HostelActor, hostelId?: number): Promise<{
    id: number;
    studentId: number;
    usn: any;
    studentName: any;
    hostelName: any;
    residentNumber: any;
    status: any;
    roomNumber: any;
    bedCode: any;
    admittedAt: any;
}[]>;
export declare function listWaitlist(actor: HostelActor, hostelId?: number): Promise<{
    id: number;
    applicationId: number;
    applicationNumber: any;
    usn: any;
    studentName: any;
    roomTypePreference: any;
    position: any;
    priority: any;
    status: any;
}[]>;
