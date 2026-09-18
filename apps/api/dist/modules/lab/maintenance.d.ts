import type { LabActor } from './types.js';
export declare function listMaintenance(actor: LabActor, filters?: {
    labId?: number;
    status?: string;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    maintenanceType: unknown;
    dueDate: string | null;
    completedDate: {} | null;
    result: {} | null;
    status: unknown;
    overdue: boolean;
}[]>;
export declare function createMaintenance(actor: LabActor, input: {
    labId: number;
    assetId?: number | null;
    maintenanceType: string;
    dueDate: string;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    maintenanceType: unknown;
    dueDate: string | null;
    completedDate: {} | null;
    result: {} | null;
    status: unknown;
    overdue: boolean;
}>;
export declare function completeMaintenance(actor: LabActor, id: number, input: {
    result?: string | null;
}): Promise<{
    id: number;
    labId: number;
    labName: string;
    assetId: number | null;
    assetTag: string;
    maintenanceType: unknown;
    dueDate: string | null;
    completedDate: {} | null;
    result: {} | null;
    status: unknown;
    overdue: boolean;
}>;
