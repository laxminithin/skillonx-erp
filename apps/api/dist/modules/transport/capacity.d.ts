import type { Knex } from 'knex';
import type { ConflictCode } from './types.js';
export declare function getRouteCapacity(collegeId: number, routeId: number, executor?: Knex | Knex.Transaction): Promise<{
    routeId: number;
    passengerCount: number;
    vehicleCapacity: number;
    availableCapacity: number;
    utilizationPercent: number;
}>;
export declare function checkRouteCapacity(collegeId: number, routeId: number, override?: boolean, executor?: Knex | Knex.Transaction): Promise<{
    ok: boolean;
    code?: ConflictCode;
    capacity: Awaited<ReturnType<typeof getRouteCapacity>>;
}>;
export declare function checkVehicleConflict(collegeId: number, vehicleId: number, startAt: Date, endAt: Date, excludeTripId?: number): Promise<{
    conflict: boolean;
    code?: ConflictCode;
}>;
export declare function checkDriverConflict(collegeId: number, personnelId: number, startAt: Date, endAt: Date, excludeTripId?: number): Promise<{
    conflict: boolean;
    code?: ConflictCode;
}>;
export declare function isVehicleCompliant(vehicleId: number, collegeId: number): Promise<boolean>;
