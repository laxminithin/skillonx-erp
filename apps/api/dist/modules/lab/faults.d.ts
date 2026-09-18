import type { LabActor } from './types.js';
export declare function listFaults(actor: LabActor, filters?: {
    labId?: number;
    status?: string;
    severity?: string;
    assetId?: number;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    reportedBy: number | null;
    reporterName: string;
    faultCategory: unknown;
    description: unknown;
    severity: unknown;
    impact: {} | null;
    status: unknown;
    maintenanceRef: {} | null;
    resolvedAt: {} | null;
    createdAt: unknown;
}[]>;
export declare function createFault(actor: LabActor, input: {
    labId: number;
    assetId?: number | null;
    faultCategory?: string;
    description: string;
    severity?: string;
    impact?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    reportedBy: number | null;
    reporterName: string;
    faultCategory: unknown;
    description: unknown;
    severity: unknown;
    impact: {} | null;
    status: unknown;
    maintenanceRef: {} | null;
    resolvedAt: {} | null;
    createdAt: unknown;
}>;
export declare function updateFaultStatus(actor: LabActor, faultId: number, input: {
    status: string;
    note?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    reportedBy: number | null;
    reporterName: string;
    faultCategory: unknown;
    description: unknown;
    severity: unknown;
    impact: {} | null;
    status: unknown;
    maintenanceRef: {} | null;
    resolvedAt: {} | null;
    createdAt: unknown;
}>;
