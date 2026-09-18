import { z } from 'zod';

export type TransportPermission =
  | 'transport.view'
  | 'transport.config.manage'
  | 'transport.application.review'
  | 'transport.member.manage'
  | 'transport.route.manage'
  | 'transport.stop.manage'
  | 'transport.vehicle.manage'
  | 'transport.assignment.manage'
  | 'transport.trip.manage'
  | 'transport.pass.manage'
  | 'transport.driver.manage'
  | 'transport.boarding.manage'
  | 'transport.change.approve'
  | 'transport.complaint.manage'
  | 'transport.incident.manage'
  | 'transport.maintenance.manage'
  | 'transport.clearance.manage'
  | 'transport.report.view';

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

export type TransportVisibility =
  | 'HIDDEN'
  | 'APPLICATION_AVAILABLE'
  | 'APPLICATION_DRAFT'
  | 'APPLICATION_PENDING'
  | 'WAITLISTED'
  | 'APPROVED'
  | 'PAYMENT_PENDING'
  | 'ASSIGNMENT_PENDING'
  | 'ACTIVE'
  | 'CHANGE_PENDING'
  | 'CANCELLATION_PENDING'
  | 'FORMER_USER';

export type TransportNoDueStatus = 'CLEAR' | 'DUE' | 'BLOCKED' | 'NOT_APPLICABLE';

export type TransportNoDueReason =
  | 'ACTIVE_TRANSPORT_ASSIGNMENT'
  | 'CANCELLATION_PENDING'
  | 'TRANSPORT_FINANCIAL_DUE'
  | 'PASS_RETURN_PENDING'
  | 'DAMAGE_DUE'
  | 'OTHER';

export type EligibilityResult = {
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
  reasons: Array<{ code: string; message: string; passed: boolean }>;
};

export type ConflictCode =
  | 'DRIVER_CONFLICT'
  | 'VEHICLE_CONFLICT'
  | 'CAPACITY_EXCEEDED'
  | 'VEHICLE_UNAVAILABLE'
  | 'COMPLIANCE_BLOCKED';

export const transportApplicationSchema = z.object({
  pickupStopPreferenceId: z.number().int().positive(),
  dropStopPreferenceId: z.number().int().positive(),
  preferredRouteId: z.number().int().positive().optional(),
  serviceType: z.enum(['ONE_WAY', 'TWO_WAY']).optional(),
  transportPeriod: z.string().trim().max(64).optional(),
  specialRequirement: z.string().trim().max(2000).optional(),
  emergencyContactName: z.string().trim().max(255).optional(),
  emergencyContactPhone: z.string().trim().max(32).optional(),
  rulesAccepted: z.boolean().optional(),
  declarationAccepted: z.boolean().optional(),
});

export const changeRequestSchema = z.object({
  changeType: z.enum([
    'ROUTE_CHANGE', 'PICKUP_STOP_CHANGE', 'DROP_STOP_CHANGE',
    'TEMPORARY_STOP_CHANGE', 'SERVICE_TYPE_CHANGE',
  ]),
  requestedRouteId: z.number().int().positive().optional(),
  requestedPickupStopId: z.number().int().positive().optional(),
  requestedDropStopId: z.number().int().positive().optional(),
  requestedServiceType: z.enum(['ONE_WAY', 'TWO_WAY']).optional(),
  effectiveDate: z.string().optional(),
  reason: z.string().trim().min(1).max(2000),
});

export const complaintSchema = z.object({
  category: z.enum([
    'DELAY', 'DRIVER_BEHAVIOR', 'CONDUCTOR_BEHAVIOR', 'OVERCROWDING',
    'ROUTE', 'STOP', 'VEHICLE_CONDITION', 'SAFETY', 'OTHER',
  ]),
  description: z.string().trim().min(1).max(5000),
  routeId: z.number().int().positive().optional(),
  tripId: z.number().int().positive().optional(),
});

export const stopSchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(255),
  landmark: z.string().trim().max(255).optional(),
  address: z.string().trim().max(1000).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zoneId: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED']).optional(),
});

export const routeSchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(255),
  origin: z.string().trim().min(1).max(255),
  destination: z.string().trim().min(1).max(255),
  directionType: z.enum(['BIDIRECTIONAL', 'INBOUND', 'OUTBOUND']).optional(),
  estimatedDistance: z.number().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED']).optional(),
});

export const vehicleSchema = z.object({
  vehicleNumber: z.string().trim().min(1).max(32),
  internalCode: z.string().trim().max(32).optional(),
  vehicleType: z.enum(['BUS', 'MINIBUS', 'VAN', 'OTHER']).optional(),
  manufacturer: z.string().trim().max(128).optional(),
  model: z.string().trim().max(128).optional(),
  year: z.number().int().optional(),
  seatingCapacity: z.number().int().positive(),
  standingCapacity: z.number().int().nonnegative().optional(),
  totalCapacity: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE', 'RETIRED']).optional(),
});

export const assignmentSchema = z.object({
  applicationId: z.number().int().positive(),
  routeId: z.number().int().positive(),
  pickupStopId: z.number().int().positive(),
  dropStopId: z.number().int().positive(),
  serviceType: z.enum(['ONE_WAY', 'TWO_WAY']).optional(),
  reason: z.string().trim().max(2000).optional(),
  capacityOverride: z.boolean().optional(),
  capacityOverrideReason: z.string().trim().max(2000).optional(),
});
