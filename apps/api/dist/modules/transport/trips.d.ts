import type { TransportActor } from './types.js';
export declare function generateDailyTrips(collegeId: number, tripDate: string): Promise<{
    tripId: number;
    skipped: boolean;
}[]>;
export declare function getTodayTripsForStudent(studentId: number, collegeId: number): Promise<{
    id: number;
    tripType: any;
    status: any;
    scheduledStartAt: any;
    scheduledEndAt: any;
    actualStartAt: any;
    actualEndAt: any;
    vehicleNumber: any;
}[]>;
export declare function getDriverTodayTrips(personnelId: number, collegeId: number): Promise<{
    id: number;
    routeName: any;
    routeCode: any;
    tripType: any;
    status: any;
    scheduledStartAt: any;
    vehicleNumber: any;
}[]>;
export declare function getTripManifest(tripId: number, collegeId: number): Promise<{
    tripId: number;
    routeId: number;
    status: any;
    passengers: {
        studentId: number;
        name: any;
        usn: any;
        pickupStop: any;
        dropStop: any;
        boardingStatus: string;
    }[];
}>;
export declare function startTrip(tripId: number, collegeId: number, actorId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function completeTrip(tripId: number, collegeId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function assignVehicleToTrip(actor: TransportActor, tripId: number, vehicleId: number): Promise<{
    tripId: number;
    vehicleId: number;
    status: string;
}>;
export declare function assignDriverToTrip(actor: TransportActor, tripId: number, personnelId: number, role?: 'DRIVER' | 'CONDUCTOR'): Promise<{
    tripId: number;
    personnelId: number;
    role: "DRIVER" | "CONDUCTOR";
}>;
