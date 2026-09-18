import type { HostelActor } from './types.js';
export declare function listStudentComplaints(studentId: number, collegeId: number): Promise<{
    id: number;
    category: unknown;
    description: unknown;
    priority: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}[]>;
export declare function createComplaint(studentId: number, collegeId: number, input: {
    category: string;
    description: string;
    roomId?: number;
}): Promise<{
    id: number;
    category: unknown;
    description: unknown;
    priority: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}>;
export declare function getComplaint(studentId: number, collegeId: number, complaintId: number): Promise<{
    id: number;
    category: unknown;
    description: unknown;
    priority: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}>;
export declare function listHostelComplaints(actor: HostelActor, hostelId?: number, status?: string): Promise<{
    usn: any;
    studentName: any;
    id: number;
    category: unknown;
    description: unknown;
    priority: unknown;
    status: unknown;
    resolutionNotes: unknown;
    resolvedAt: unknown;
    createdAt: unknown;
}[]>;
export declare function updateComplaintStatus(actor: HostelActor, complaintId: number, status: string, resolutionNotes?: string): Promise<{
    id: number;
    status: string;
}>;
