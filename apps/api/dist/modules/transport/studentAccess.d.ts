import type { TransportVisibility } from './types.js';
export declare function getStudentTransportAccess(studentId: number, collegeId: number): Promise<{
    visibility: TransportVisibility;
    canApply: boolean;
    canAccessOperations: boolean;
    transportMemberId?: undefined;
    applicationId?: undefined;
    routeId?: undefined;
    stopId?: undefined;
    transportPassId?: undefined;
} | {
    visibility: TransportVisibility;
    canApply: boolean;
    transportMemberId: number;
    applicationId: number | undefined;
    routeId: number | undefined;
    stopId: number | undefined;
    transportPassId: number | undefined;
    canAccessOperations: boolean;
} | {
    visibility: TransportVisibility;
    canApply: boolean;
    applicationId: number;
    canAccessOperations: boolean;
    transportMemberId?: undefined;
    routeId?: undefined;
    stopId?: undefined;
    transportPassId?: undefined;
} | {
    visibility: TransportVisibility;
    canApply: boolean;
    applicationId: number;
    transportMemberId: number | undefined;
    canAccessOperations: boolean;
    routeId?: undefined;
    stopId?: undefined;
    transportPassId?: undefined;
} | {
    visibility: TransportVisibility;
    canApply: boolean;
    transportMemberId: number;
    canAccessOperations: boolean;
    applicationId?: undefined;
    routeId?: undefined;
    stopId?: undefined;
    transportPassId?: undefined;
}>;
