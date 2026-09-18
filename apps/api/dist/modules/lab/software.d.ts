import type { LabActor } from './types.js';
export declare function listSoftware(actor: LabActor, filters?: {
    labId?: number;
    q?: string;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    name: unknown;
    version: {} | null;
    licenseType: unknown;
    licenseCount: number | null;
    expiryDate: {} | null;
    installationStatus: unknown;
    vendorRef: {} | null;
    remarks: {} | null;
}[]>;
export declare function createSoftware(actor: LabActor, input: Record<string, any>): Promise<{
    id: number;
    labId: number;
    labName: string;
    name: unknown;
    version: {} | null;
    licenseType: unknown;
    licenseCount: number | null;
    expiryDate: {} | null;
    installationStatus: unknown;
    vendorRef: {} | null;
    remarks: {} | null;
}>;
export declare function updateSoftware(actor: LabActor, id: number, input: Record<string, any>): Promise<{
    id: number;
    labId: number;
    labName: string;
    name: unknown;
    version: {} | null;
    licenseType: unknown;
    licenseCount: number | null;
    expiryDate: {} | null;
    installationStatus: unknown;
    vendorRef: {} | null;
    remarks: {} | null;
}>;
export declare function listSoftwareRequests(actor: LabActor, filters?: {
    labId?: number;
    status?: string;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    softwareName: unknown;
    version: {} | null;
    courseId: number | null;
    reason: {} | null;
    neededBy: {} | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    resolution: {} | null;
    createdAt: unknown;
}[]>;
export declare function createSoftwareRequest(actor: LabActor, input: {
    labId: number;
    softwareName: string;
    version?: string | null;
    courseId?: number | null;
    reason?: string | null;
    neededBy?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    softwareName: unknown;
    version: {} | null;
    courseId: number | null;
    reason: {} | null;
    neededBy: {} | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    resolution: {} | null;
    createdAt: unknown;
}>;
export declare function reviewSoftwareRequest(actor: LabActor, id: number, input: {
    status: string;
    resolution?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    softwareName: unknown;
    version: {} | null;
    courseId: number | null;
    reason: {} | null;
    neededBy: {} | null;
    status: unknown;
    requestedBy: number | null;
    requesterName: string;
    resolution: {} | null;
    createdAt: unknown;
}>;
