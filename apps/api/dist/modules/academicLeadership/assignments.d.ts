import type { HrActor } from '../hr/types.js';
import { type LeadershipAssignment, type LeadershipRole } from './types.js';
export declare function listAssignments(collegeId: number, filters?: {
    role?: LeadershipRole;
    departmentId?: number | null;
    status?: string;
    asOf?: string;
}): Promise<LeadershipAssignment[]>;
export declare function getAssignment(id: number, collegeId: number): Promise<LeadershipAssignment>;
export declare function createAssignment(actor: HrActor, input: {
    employeeId: number;
    role: LeadershipRole;
    departmentId?: number | null;
    effectiveFrom: string;
    effectiveTo?: string | null;
    remarks?: string | null;
}): Promise<LeadershipAssignment>;
export declare function updateAssignment(actor: HrActor, assignmentId: number, input: {
    effectiveTo?: string | null;
    status?: 'ACTIVE' | 'ENDED' | 'REVOKED';
    remarks?: string | null;
}): Promise<LeadershipAssignment>;
export declare function endAssignment(actor: HrActor, assignmentId: number, effectiveTo: string, remarks?: string | null): Promise<LeadershipAssignment>;
export declare function listActiveHodEmployees(collegeId: number, departmentId: number, asOf: string): Promise<number[]>;
export declare function listActivePrincipalEmployees(collegeId: number, asOf: string): Promise<number[]>;
