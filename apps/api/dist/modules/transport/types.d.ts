import { z } from 'zod';
export type TransportPermission = 'transport.view' | 'transport.config.manage' | 'transport.application.review' | 'transport.member.manage' | 'transport.route.manage' | 'transport.stop.manage' | 'transport.vehicle.manage' | 'transport.assignment.manage' | 'transport.trip.manage' | 'transport.pass.manage' | 'transport.driver.manage' | 'transport.boarding.manage' | 'transport.change.approve' | 'transport.complaint.manage' | 'transport.incident.manage' | 'transport.maintenance.manage' | 'transport.clearance.manage' | 'transport.report.view';
export type TransportActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string;
};
export type DriverActor = {
    personnelId: number;
    collegeId: number;
    facultyUserId?: number;
    name?: string;
};
export type TransportVisibility = 'HIDDEN' | 'APPLICATION_AVAILABLE' | 'APPLICATION_DRAFT' | 'APPLICATION_PENDING' | 'WAITLISTED' | 'APPROVED' | 'PAYMENT_PENDING' | 'ASSIGNMENT_PENDING' | 'ACTIVE' | 'CHANGE_PENDING' | 'CANCELLATION_PENDING' | 'FORMER_USER';
export type TransportNoDueStatus = 'CLEAR' | 'DUE' | 'BLOCKED' | 'NOT_APPLICABLE';
export type TransportNoDueReason = 'ACTIVE_TRANSPORT_ASSIGNMENT' | 'CANCELLATION_PENDING' | 'TRANSPORT_FINANCIAL_DUE' | 'PASS_RETURN_PENDING' | 'DAMAGE_DUE' | 'OTHER';
export type EligibilityResult = {
    status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
    reasons: Array<{
        code: string;
        message: string;
        passed: boolean;
    }>;
};
export type ConflictCode = 'DRIVER_CONFLICT' | 'VEHICLE_CONFLICT' | 'CAPACITY_EXCEEDED' | 'VEHICLE_UNAVAILABLE' | 'COMPLIANCE_BLOCKED';
export declare const transportApplicationSchema: z.ZodObject<{
    pickupStopPreferenceId: z.ZodNumber;
    dropStopPreferenceId: z.ZodNumber;
    preferredRouteId: z.ZodOptional<z.ZodNumber>;
    serviceType: z.ZodOptional<z.ZodEnum<["ONE_WAY", "TWO_WAY"]>>;
    transportPeriod: z.ZodOptional<z.ZodString>;
    specialRequirement: z.ZodOptional<z.ZodString>;
    emergencyContactName: z.ZodOptional<z.ZodString>;
    emergencyContactPhone: z.ZodOptional<z.ZodString>;
    rulesAccepted: z.ZodOptional<z.ZodBoolean>;
    declarationAccepted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    pickupStopPreferenceId: number;
    dropStopPreferenceId: number;
    specialRequirement?: string | undefined;
    emergencyContactName?: string | undefined;
    emergencyContactPhone?: string | undefined;
    rulesAccepted?: boolean | undefined;
    declarationAccepted?: boolean | undefined;
    preferredRouteId?: number | undefined;
    serviceType?: "ONE_WAY" | "TWO_WAY" | undefined;
    transportPeriod?: string | undefined;
}, {
    pickupStopPreferenceId: number;
    dropStopPreferenceId: number;
    specialRequirement?: string | undefined;
    emergencyContactName?: string | undefined;
    emergencyContactPhone?: string | undefined;
    rulesAccepted?: boolean | undefined;
    declarationAccepted?: boolean | undefined;
    preferredRouteId?: number | undefined;
    serviceType?: "ONE_WAY" | "TWO_WAY" | undefined;
    transportPeriod?: string | undefined;
}>;
export declare const changeRequestSchema: z.ZodObject<{
    changeType: z.ZodEnum<["ROUTE_CHANGE", "PICKUP_STOP_CHANGE", "DROP_STOP_CHANGE", "TEMPORARY_STOP_CHANGE", "SERVICE_TYPE_CHANGE"]>;
    requestedRouteId: z.ZodOptional<z.ZodNumber>;
    requestedPickupStopId: z.ZodOptional<z.ZodNumber>;
    requestedDropStopId: z.ZodOptional<z.ZodNumber>;
    requestedServiceType: z.ZodOptional<z.ZodEnum<["ONE_WAY", "TWO_WAY"]>>;
    effectiveDate: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    changeType: "ROUTE_CHANGE" | "PICKUP_STOP_CHANGE" | "DROP_STOP_CHANGE" | "TEMPORARY_STOP_CHANGE" | "SERVICE_TYPE_CHANGE";
    effectiveDate?: string | undefined;
    requestedRouteId?: number | undefined;
    requestedPickupStopId?: number | undefined;
    requestedDropStopId?: number | undefined;
    requestedServiceType?: "ONE_WAY" | "TWO_WAY" | undefined;
}, {
    reason: string;
    changeType: "ROUTE_CHANGE" | "PICKUP_STOP_CHANGE" | "DROP_STOP_CHANGE" | "TEMPORARY_STOP_CHANGE" | "SERVICE_TYPE_CHANGE";
    effectiveDate?: string | undefined;
    requestedRouteId?: number | undefined;
    requestedPickupStopId?: number | undefined;
    requestedDropStopId?: number | undefined;
    requestedServiceType?: "ONE_WAY" | "TWO_WAY" | undefined;
}>;
export declare const complaintSchema: z.ZodObject<{
    category: z.ZodEnum<["DELAY", "DRIVER_BEHAVIOR", "CONDUCTOR_BEHAVIOR", "OVERCROWDING", "ROUTE", "STOP", "VEHICLE_CONDITION", "SAFETY", "OTHER"]>;
    description: z.ZodString;
    routeId: z.ZodOptional<z.ZodNumber>;
    tripId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: "OTHER" | "DELAY" | "DRIVER_BEHAVIOR" | "CONDUCTOR_BEHAVIOR" | "OVERCROWDING" | "ROUTE" | "STOP" | "VEHICLE_CONDITION" | "SAFETY";
    routeId?: number | undefined;
    tripId?: number | undefined;
}, {
    description: string;
    category: "OTHER" | "DELAY" | "DRIVER_BEHAVIOR" | "CONDUCTOR_BEHAVIOR" | "OVERCROWDING" | "ROUTE" | "STOP" | "VEHICLE_CONDITION" | "SAFETY";
    routeId?: number | undefined;
    tripId?: number | undefined;
}>;
export declare const stopSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    landmark: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    zoneId: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"]>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED" | undefined;
    address?: string | undefined;
    landmark?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    zoneId?: number | undefined;
}, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED" | undefined;
    address?: string | undefined;
    landmark?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    zoneId?: number | undefined;
}>;
export declare const routeSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    origin: z.ZodString;
    destination: z.ZodString;
    directionType: z.ZodOptional<z.ZodEnum<["BIDIRECTIONAL", "INBOUND", "OUTBOUND"]>>;
    estimatedDistance: z.ZodOptional<z.ZodNumber>;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "SUSPENDED", "INACTIVE", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    destination: string;
    origin: string;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SUSPENDED" | "INACTIVE" | undefined;
    directionType?: "BIDIRECTIONAL" | "INBOUND" | "OUTBOUND" | undefined;
    estimatedDistance?: number | undefined;
    estimatedDuration?: number | undefined;
}, {
    code: string;
    name: string;
    destination: string;
    origin: string;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | "SUSPENDED" | "INACTIVE" | undefined;
    directionType?: "BIDIRECTIONAL" | "INBOUND" | "OUTBOUND" | undefined;
    estimatedDistance?: number | undefined;
    estimatedDuration?: number | undefined;
}>;
export declare const vehicleSchema: z.ZodObject<{
    vehicleNumber: z.ZodString;
    internalCode: z.ZodOptional<z.ZodString>;
    vehicleType: z.ZodOptional<z.ZodEnum<["BUS", "MINIBUS", "VAN", "OTHER"]>>;
    manufacturer: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    seatingCapacity: z.ZodNumber;
    standingCapacity: z.ZodOptional<z.ZodNumber>;
    totalCapacity: z.ZodNumber;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE", "INACTIVE", "RETIRED"]>>;
}, "strip", z.ZodTypeAny, {
    vehicleNumber: string;
    seatingCapacity: number;
    totalCapacity: number;
    status?: "ACTIVE" | "RETIRED" | "INACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE" | undefined;
    year?: number | undefined;
    internalCode?: string | undefined;
    vehicleType?: "OTHER" | "BUS" | "MINIBUS" | "VAN" | undefined;
    manufacturer?: string | undefined;
    model?: string | undefined;
    standingCapacity?: number | undefined;
}, {
    vehicleNumber: string;
    seatingCapacity: number;
    totalCapacity: number;
    status?: "ACTIVE" | "RETIRED" | "INACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE" | undefined;
    year?: number | undefined;
    internalCode?: string | undefined;
    vehicleType?: "OTHER" | "BUS" | "MINIBUS" | "VAN" | undefined;
    manufacturer?: string | undefined;
    model?: string | undefined;
    standingCapacity?: number | undefined;
}>;
export declare const assignmentSchema: z.ZodObject<{
    applicationId: z.ZodNumber;
    routeId: z.ZodNumber;
    pickupStopId: z.ZodNumber;
    dropStopId: z.ZodNumber;
    serviceType: z.ZodOptional<z.ZodEnum<["ONE_WAY", "TWO_WAY"]>>;
    reason: z.ZodOptional<z.ZodString>;
    capacityOverride: z.ZodOptional<z.ZodBoolean>;
    capacityOverrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    applicationId: number;
    routeId: number;
    pickupStopId: number;
    dropStopId: number;
    reason?: string | undefined;
    serviceType?: "ONE_WAY" | "TWO_WAY" | undefined;
    capacityOverride?: boolean | undefined;
    capacityOverrideReason?: string | undefined;
}, {
    applicationId: number;
    routeId: number;
    pickupStopId: number;
    dropStopId: number;
    reason?: string | undefined;
    serviceType?: "ONE_WAY" | "TWO_WAY" | undefined;
    capacityOverride?: boolean | undefined;
    capacityOverrideReason?: string | undefined;
}>;
