import type { LabActor } from './types.js';
export declare function listLabs(actor: LabActor, filters?: {
    status?: string;
    departmentId?: number;
    q?: string;
}): Promise<{
    id: number;
    name: unknown;
    code: unknown;
    departmentId: number | null;
    departmentName: string;
    roomId: number | null;
    roomName: string;
    building: string;
    labType: unknown;
    capacity: number | null;
    status: unknown;
    description: {} | null;
}[]>;
export declare function getLab(actor: LabActor, labId: number): Promise<{
    assignments: {
        id: number;
        facultyId: number;
        facultyName: any;
        facultyEmail: any;
        designation: any;
        assignmentRole: any;
        isPrimary: boolean;
        status: any;
        effectiveFrom: any;
        effectiveTo: any;
    }[];
    id: number;
    name: unknown;
    code: unknown;
    departmentId: number | null;
    departmentName: string;
    roomId: number | null;
    roomName: string;
    building: string;
    labType: unknown;
    capacity: number | null;
    status: unknown;
    description: {} | null;
}>;
export declare function createLab(actor: LabActor, input: {
    name: string;
    code: string;
    departmentId?: number | null;
    roomId?: number | null;
    labType?: string;
    capacity?: number | null;
    status?: string;
    description?: string | null;
}): Promise<{
    assignments: {
        id: number;
        facultyId: number;
        facultyName: any;
        facultyEmail: any;
        designation: any;
        assignmentRole: any;
        isPrimary: boolean;
        status: any;
        effectiveFrom: any;
        effectiveTo: any;
    }[];
    id: number;
    name: unknown;
    code: unknown;
    departmentId: number | null;
    departmentName: string;
    roomId: number | null;
    roomName: string;
    building: string;
    labType: unknown;
    capacity: number | null;
    status: unknown;
    description: {} | null;
}>;
export declare function updateLab(actor: LabActor, labId: number, input: Record<string, unknown>): Promise<{
    assignments: {
        id: number;
        facultyId: number;
        facultyName: any;
        facultyEmail: any;
        designation: any;
        assignmentRole: any;
        isPrimary: boolean;
        status: any;
        effectiveFrom: any;
        effectiveTo: any;
    }[];
    id: number;
    name: unknown;
    code: unknown;
    departmentId: number | null;
    departmentName: string;
    roomId: number | null;
    roomName: string;
    building: string;
    labType: unknown;
    capacity: number | null;
    status: unknown;
    description: {} | null;
}>;
export declare function listAssignments(actor: LabActor, labId: number, includeEnded?: boolean): Promise<{
    id: number;
    facultyId: number;
    facultyName: any;
    facultyEmail: any;
    designation: any;
    assignmentRole: any;
    isPrimary: boolean;
    status: any;
    effectiveFrom: any;
    effectiveTo: any;
}[]>;
export declare function assignLab(actor: LabActor, labId: number, input: {
    facultyId: number;
    assignmentRole: 'LAB_ASSISTANT' | 'LAB_INCHARGE';
    isPrimary?: boolean;
    remarks?: string | null;
}): Promise<{
    id: number;
    unchanged: boolean;
}>;
export declare function endAssignment(actor: LabActor, assignmentId: number): Promise<{
    ok: boolean;
}>;
/** Rooms of type LAB available in this college for lab master creation. */
export declare function listLabRooms(actor: LabActor): Promise<{
    id: number;
    name: any;
    code: any;
    building: any;
    type: any;
    capacity: number | null;
}[]>;
