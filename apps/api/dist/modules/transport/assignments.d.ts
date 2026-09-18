import type { TransportActor } from './types.js';
export declare function assignRoute(actor: TransportActor, input: {
    applicationId: number;
    routeId: number;
    pickupStopId: number;
    dropStopId: number;
    serviceType?: string;
    reason?: string;
    capacityOverride?: boolean;
    capacityOverrideReason?: string;
}): Promise<{
    assignmentId: number;
    memberId: number;
    passId: number | null;
    status: string;
}>;
export declare function getStudentAssignment(studentId: number, collegeId: number): Promise<{
    id: number;
    routeId: number;
    routeName: any;
    routeCode: any;
    pickupStop: {
        id: number;
        name: any;
        code: any;
    } | null;
    dropStop: {
        id: number;
        name: any;
        code: any;
    } | null;
    serviceType: any;
    vehicle: {
        id: number;
        vehicleNumber: any;
        capacity: any;
    } | null;
    stops: {
        sequenceNumber: number;
        stopName: any;
        stopCode: any;
        scheduledPickupTime: any;
        scheduledDropTime: any;
    }[];
    startAt: any;
} | null>;
export declare function getAssignmentHistory(studentId: number, collegeId: number): Promise<{
    id: number;
    routeName: any;
    pickupStop: any;
    dropStop: any;
    serviceType: any;
    status: any;
    startAt: any;
    endAt: any;
}[]>;
export declare function bulkAssignDryRun(actor: TransportActor, assignments: Array<{
    applicationId: number;
    routeId: number;
    pickupStopId: number;
    dropStopId: number;
}>): Promise<{
    dryRun: boolean;
    results: {
        applicationId: number;
        studentId: number | null;
        routeId: number;
        suggested: boolean;
        warnings: string[];
        capacityImpact: {
            routeId: number;
            passengerCount: number;
            vehicleCapacity: number;
            availableCapacity: number;
            utilizationPercent: number;
        };
    }[];
}>;
