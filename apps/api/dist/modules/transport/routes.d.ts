import type { TransportActor } from './types.js';
export declare function createStop(actor: TransportActor, input: Record<string, unknown>): Promise<{
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    landmark: unknown;
    address: unknown;
    latitude: number | null;
    longitude: number | null;
    zoneId: number | null;
    status: unknown;
}>;
export declare function listStops(actor: TransportActor): Promise<{
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    landmark: unknown;
    address: unknown;
    latitude: number | null;
    longitude: number | null;
    zoneId: number | null;
    status: unknown;
}[]>;
export declare function createRoute(actor: TransportActor, input: Record<string, unknown>): Promise<{
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    origin: unknown;
    destination: unknown;
    directionType: unknown;
    estimatedDistance: number | null;
    estimatedDuration: number | null;
    status: unknown;
}>;
export declare function listRoutes(actor: TransportActor): Promise<{
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    origin: unknown;
    destination: unknown;
    directionType: unknown;
    estimatedDistance: number | null;
    estimatedDuration: number | null;
    status: unknown;
}[]>;
export declare function getRouteWithStops(routeId: number, collegeId: number): Promise<{
    stops: {
        id: number;
        stopId: number;
        stopName: any;
        stopCode: any;
        sequenceNumber: number;
        scheduledPickupTime: any;
        scheduledDropTime: any;
        boardingAllowed: boolean;
        alightingAllowed: boolean;
    }[];
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    origin: unknown;
    destination: unknown;
    directionType: unknown;
    estimatedDistance: number | null;
    estimatedDuration: number | null;
    status: unknown;
}>;
export declare function setRouteStops(actor: TransportActor, routeId: number, stops: Array<{
    stopId: number;
    sequenceNumber: number;
    scheduledPickupTime?: string;
    scheduledDropTime?: string;
    boardingAllowed?: boolean;
    alightingAllowed?: boolean;
}>): Promise<{
    stops: {
        id: number;
        stopId: number;
        stopName: any;
        stopCode: any;
        sequenceNumber: number;
        scheduledPickupTime: any;
        scheduledDropTime: any;
        boardingAllowed: boolean;
        alightingAllowed: boolean;
    }[];
    id: number;
    collegeId: number;
    code: unknown;
    name: unknown;
    origin: unknown;
    destination: unknown;
    directionType: unknown;
    estimatedDistance: number | null;
    estimatedDuration: number | null;
    status: unknown;
}>;
export declare function activateRoute(actor: TransportActor, routeId: number): Promise<{
    id: number;
    status: string;
}>;
