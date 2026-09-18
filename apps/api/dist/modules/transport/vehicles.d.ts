import type { TransportActor } from './types.js';
export declare function createVehicle(actor: TransportActor, input: Record<string, unknown>): Promise<{
    id: number;
    collegeId: number;
    vehicleNumber: unknown;
    internalCode: unknown;
    vehicleType: unknown;
    manufacturer: unknown;
    model: unknown;
    year: number | null;
    seatingCapacity: number;
    standingCapacity: number | null;
    totalCapacity: number;
    status: unknown;
    operationalStatus: unknown;
}>;
export declare function listVehicles(actor: TransportActor): Promise<{
    id: number;
    collegeId: number;
    vehicleNumber: unknown;
    internalCode: unknown;
    vehicleType: unknown;
    manufacturer: unknown;
    model: unknown;
    year: number | null;
    seatingCapacity: number;
    standingCapacity: number | null;
    totalCapacity: number;
    status: unknown;
    operationalStatus: unknown;
}[]>;
export declare function getComplianceDashboard(actor: TransportActor): Promise<{
    alerts: {
        vehicleId: number;
        vehicleNumber: any;
        documentType: string;
        status: string;
        expiryDate: string;
    }[];
    totalVehicles: number;
}>;
export declare function assignVehicleToRoute(actor: TransportActor, routeId: number, vehicleId: number, shiftType?: string): Promise<{
    id: number;
    routeId: number;
    vehicleId: number;
    status: string;
}>;
export declare function createMaintenanceRecord(actor: TransportActor, input: {
    vehicleId: number;
    maintenanceType: string;
    description?: string;
    scheduledAt?: string;
}): Promise<{
    id: number;
    status: string;
}>;
