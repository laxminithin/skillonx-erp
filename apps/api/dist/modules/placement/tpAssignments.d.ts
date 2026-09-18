import type { PlacementActor } from './types.js';
export declare const TP_ROLES: readonly ["T&P_OFFICER", "T&P_COORDINATOR", "DEPARTMENT_TP_COORDINATOR"];
export type TpRole = (typeof TP_ROLES)[number];
export declare function tpAssignmentSchemaReady(): Promise<boolean>;
export declare function listTpAssignments(collegeId: number, filters?: {
    role?: TpRole;
    departmentId?: number | null;
    status?: string;
}): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    role: TpRole;
    departmentId: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    remarks: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    facultyUserId: number | null;
}[]>;
export declare function createTpAssignment(actor: PlacementActor, input: {
    employeeId: number;
    role: TpRole;
    departmentId?: number | null;
    effectiveFrom: string;
    effectiveTo?: string | null;
    remarks?: string | null;
}): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    role: TpRole;
    departmentId: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    remarks: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    facultyUserId: number | null;
}>;
export declare function updateTpAssignment(actor: PlacementActor, assignmentId: number, input: {
    effectiveTo?: string | null;
    status?: 'ACTIVE' | 'ENDED' | 'REVOKED';
    remarks?: string | null;
}): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    role: TpRole;
    departmentId: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    remarks: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    facultyUserId: number | null;
}>;
export declare function listActiveTpForFaculty(facultyUserId: number, collegeId: number, asOf?: string): Promise<{
    id: number;
    collegeId: number;
    employeeId: number;
    role: TpRole;
    departmentId: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    remarks: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    facultyUserId: number | null;
}[]>;
