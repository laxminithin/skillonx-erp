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
export type ResidentListFilters = {
    page?: number;
    pageSize?: number;
    search?: string;
    hostelId?: number;
    blockId?: number;
    floorId?: number;
    roomId?: number;
    programme?: string;
    semester?: string;
    status?: string;
};
export declare function listResidents(actor: HostelActor, filters?: ResidentListFilters): Promise<{
    residents: {
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
        blockId: number | null;
        blockCode: any;
        floorId: number | null;
        floorNumber: any;
        programName: any;
        semesterName: any;
    }[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function wardenReportSummary(actor: HostelActor, hostelId?: number): Promise<{
    generatedAt: string;
    hostelId: number | null;
    residents: {
        active: number;
        rows: number;
    };
    occupancy: {
        totalBeds: number;
        usableBeds: number;
        occupiedBeds: number;
        reservedBeds: number;
        availableBeds: number;
        maintenanceBeds: number;
        blockedBeds: number;
        occupancyPercent: number;
    };
    applications: {
        pending: number;
        allocationPending: number;
    };
    waitlist: number;
    movement: {
        outside: number;
        overdue: number;
        pendingLeave: number;
    };
    complaints: {
        open: number;
    };
    clearance: {
        pendingVacating: number;
    };
    limitations: string[];
}>;
export declare function getResidentProfile(actor: HostelActor, residentId: number): Promise<{
    resident: {
        id: number;
        studentId: number;
        residentNumber: any;
        status: any;
        admittedAt: any;
        hostelName: any;
    };
    student: {
        usn: any;
        name: any;
        email: any;
        phone: any;
        guardianName: any;
        guardianPhone: any;
        emergencyContactName: any;
        emergencyContactPhone: any;
        programName: any;
        semesterName: any;
    };
    room: {
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
    } | null;
    movement: {
        currentPresence: string;
        expectedReturnAt: any;
        activeOutpass: {
            id: number;
            outpassNumber: any;
            status: any;
            purpose: any;
            expectedReturnAt: any;
        } | null;
        recent: {
            id: number;
            movementType: any;
            source: any;
            gate: any;
            at: any;
            remarks: any;
        }[];
    };
    finance: {
        totalOutstanding: any;
        items: {
            demandType: any;
            description: any;
            amount: number;
            paid: number;
            outstanding: number;
            status: any;
            demandId: number;
        }[];
    };
    clearance: {
        hostel: {
            status: import("./types.js").HostelNoDueStatus;
            reasons: import("./types.js").HostelNoDueReason[];
            label: string;
        };
        overallClear: boolean;
    };
    complaints: {
        id: number;
        category: any;
        priority: any;
        status: any;
        createdAt: any;
        resolvedAt: any;
    }[];
    history: {
        id: number;
        hostelName: any;
        roomNumber: any;
        bedCode: any;
        allocationType: any;
        startAt: any;
        endAt: any;
        status: any;
    }[];
} | null>;
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
