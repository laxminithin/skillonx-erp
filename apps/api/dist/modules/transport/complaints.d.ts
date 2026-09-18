import type { TransportActor } from './types.js';
export declare function listStudentComplaints(studentId: number, collegeId: number): Promise<{
    id: number;
    category: unknown;
    description: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}[]>;
export declare function createStudentComplaint(studentId: number, collegeId: number, input: {
    category: string;
    description: string;
    routeId?: number;
    tripId?: number;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function listComplaints(actor: TransportActor, status?: string): Promise<{
    studentName: any;
    usn: any;
    id: number;
    category: unknown;
    description: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}[]>;
export declare function resolveComplaint(actor: TransportActor, complaintId: number, resolutionNotes: string): Promise<{
    id: number;
    status: string;
}>;
export declare function createIncident(actor: TransportActor | {
    collegeId: number;
    reportedBy: number;
    reportedByType?: string;
}, input: {
    incidentType: string;
    description: string;
    routeId?: number;
    tripId?: number;
    vehicleId?: number;
    studentId?: number;
    severity?: string;
    occurredAt?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function listIncidents(actor: TransportActor): Promise<{
    id: number;
    incidentType: any;
    severity: any;
    description: any;
    status: any;
    occurredAt: any;
}[]>;
