import type { ManagementActor } from './types.js';
export declare function libraryOverview(actor: ManagementActor): Promise<import("./sources.js").SourceResult<{
    booksIssuedToday: number;
    returnsToday: number;
    overdueLoans: number;
    activeReservations: number;
    availableCopies: number;
    outstandingFines: string;
}>>;
export declare function hostelOverview(actor: ManagementActor): Promise<import("./sources.js").SourceResult<{
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
}>>;
export declare function transportOverview(actor: ManagementActor): Promise<import("./sources.js").SourceResult<{
    routeDemand: {
        routeId: number;
        passengerCount: number;
        vehicleCapacity: number;
        availableCapacity: number;
        utilizationPercent: number;
        routeName: any;
        routeCode: any;
    }[];
    stopDemand: {
        stopId: number;
        stopName: unknown;
        stopCode: unknown;
        studentCount: number;
    }[];
    financeNote: string;
    activeTransportStudents: number;
    applicationsPending: number;
    waitlisted: number;
    activeRoutes: number;
    activeStops: number;
    vehicles: number;
    vehiclesInMaintenance: number;
    tripsToday: number;
    delayedTrips: number;
    cancelledTrips: number;
    openComplaints: number;
    pendingRouteChanges: number;
    gpsConfigured: boolean;
    liveTrackingNote: string;
}>>;
export declare function campusOverview(actor: ManagementActor): Promise<{
    library: import("./sources.js").SourceResult<{
        booksIssuedToday: number;
        returnsToday: number;
        overdueLoans: number;
        activeReservations: number;
        availableCopies: number;
        outstandingFines: string;
    }>;
    hostel: import("./sources.js").SourceResult<{
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
    transport: import("./sources.js").SourceResult<{
        routeDemand: {
            routeId: number;
            passengerCount: number;
            vehicleCapacity: number;
            availableCapacity: number;
            utilizationPercent: number;
            routeName: any;
            routeCode: any;
        }[];
        stopDemand: {
            stopId: number;
            stopName: unknown;
            stopCode: unknown;
            studentCount: number;
        }[];
        financeNote: string;
        activeTransportStudents: number;
        applicationsPending: number;
        waitlisted: number;
        activeRoutes: number;
        activeStops: number;
        vehicles: number;
        vehiclesInMaintenance: number;
        tripsToday: number;
        delayedTrips: number;
        cancelledTrips: number;
        openComplaints: number;
        pendingRouteChanges: number;
        gpsConfigured: boolean;
        liveTrackingNote: string;
    }>;
}>;
