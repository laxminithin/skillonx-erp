import type { HrActor } from '../hr/types.js';
import { type AcademicCapability, type LeadershipAssignment, type LeadershipContext } from './types.js';
type Row = Record<string, unknown>;
export declare function leadershipSchemaReady(): Promise<boolean>;
export declare function todayISO(): string;
declare function serializeAssignment(row: Row): LeadershipAssignment;
export declare function listActiveAssignmentsForEmployee(employeeId: number, collegeId: number, asOf?: string): Promise<LeadershipAssignment[]>;
export declare function resolveLeadershipContext(actor: Pick<HrActor, 'facultyUserId' | 'collegeId' | 'role' | 'departmentId' | 'employeeId'>, asOf?: string): Promise<LeadershipContext>;
export declare function enrichHrActor(actor: HrActor, asOf?: string): Promise<HrActor>;
export declare function hasAcademicCapability(ctx: LeadershipContext, capability: AcademicCapability): boolean;
export declare function assertLeadershipCapability(actor: HrActor, capability: AcademicCapability, asOf?: string): Promise<{
    actor: HrActor;
    ctx: LeadershipContext;
}>;
export declare function assertDepartmentScope(ctx: LeadershipContext, departmentId: number, actorRole: string): void;
export declare function assertCollegeTenant(collegeId: number, actorCollegeId: number, actorRole: string): Promise<void>;
export declare function loadDepartmentInCollege(departmentId: number, collegeId: number): Promise<any>;
export declare function serializeMeLeadership(actor: HrActor): Promise<{
    isHod: boolean;
    isPrincipal: boolean;
    hodDepartmentIds: number[];
    roles: ("HOD" | "PRINCIPAL")[];
    capabilities: AcademicCapability[];
    assignments: LeadershipAssignment[];
    employeeId: number | null;
}>;
export { serializeAssignment };
