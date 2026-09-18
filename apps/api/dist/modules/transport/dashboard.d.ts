import type { TransportActor } from './types.js';
export declare function getAdminDashboard(actor: TransportActor): Promise<{
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
export declare function getOperationsDashboard(actor: TransportActor): Promise<{
    todayTrips: number;
    unassignedTrips: number;
    delayedTrips: number;
    cancelledTrips: number;
    activeIncidents: number;
    trips: {
        id: number;
        routeName: any;
        tripType: any;
        status: any;
        vehicleNumber: any;
        scheduledStartAt: any;
    }[];
    gpsConfigured: boolean;
}>;
export declare function getManagementDashboard(actor: TransportActor): Promise<{
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
export declare function getRouteDemandReport(actor: TransportActor): Promise<{
    applicationsByStop: {
        count?: string | number | undefined;
    }[];
}>;
