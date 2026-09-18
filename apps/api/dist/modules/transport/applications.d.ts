import type { TransportActor } from './types.js';
export declare function getStudentApplication(studentId: number, collegeId: number): Promise<{
    id: number;
    applicationNumber: unknown;
    status: unknown;
    pickupStopPreferenceId: number | null;
    pickupStopName: {} | null;
    dropStopPreferenceId: number | null;
    dropStopName: {} | null;
    preferredRouteId: number | null;
    preferredRouteName: {} | null;
    serviceType: unknown;
    transportPeriod: unknown;
    specialRequirement: unknown;
    emergencyContactName: unknown;
    emergencyContactPhone: unknown;
    rulesAccepted: boolean;
    declarationAccepted: boolean;
    submittedAt: unknown;
    reviewedAt: unknown;
    rejectionReason: unknown;
    cycleName: {} | null;
    createdAt: unknown;
} | null>;
export declare function createOrUpdateApplication(studentId: number, collegeId: number, input: Record<string, unknown>, applicationId?: number): Promise<{
    id: number;
    applicationNumber: unknown;
    status: unknown;
    pickupStopPreferenceId: number | null;
    pickupStopName: {} | null;
    dropStopPreferenceId: number | null;
    dropStopName: {} | null;
    preferredRouteId: number | null;
    preferredRouteName: {} | null;
    serviceType: unknown;
    transportPeriod: unknown;
    specialRequirement: unknown;
    emergencyContactName: unknown;
    emergencyContactPhone: unknown;
    rulesAccepted: boolean;
    declarationAccepted: boolean;
    submittedAt: unknown;
    reviewedAt: unknown;
    rejectionReason: unknown;
    cycleName: {} | null;
    createdAt: unknown;
}>;
export declare function submitApplication(studentId: number, collegeId: number, applicationId: number): Promise<{
    id: number;
    status: string;
    applicationNumber: any;
}>;
export declare function cancelApplication(studentId: number, collegeId: number, applicationId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function listApplications(actor: TransportActor, filters?: {
    status?: string;
    cycleId?: number;
}): Promise<{
    id: number;
    applicationNumber: any;
    status: any;
    studentId: number;
    studentName: any;
    usn: any;
    pickupStopPreferenceId: number | null;
    dropStopPreferenceId: number | null;
    preferredRouteId: number | null;
    serviceType: any;
    submittedAt: any;
    createdAt: any;
}[]>;
export declare function reviewApplication(actor: TransportActor, applicationId: number, decision: 'APPROVE' | 'REJECT' | 'WAITLIST', input?: {
    rejectionReason?: string;
    routeId?: number;
}): Promise<{
    id: number;
    status: string;
}>;
