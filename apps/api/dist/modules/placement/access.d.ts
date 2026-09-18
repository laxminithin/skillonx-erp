import type { PlacementActor, PlacementPermission, RecruiterActor } from './types.js';
export declare function placementPermissionsForRole(role: string): PlacementPermission[];
export declare function enrichPlacementActor(actor: PlacementActor): Promise<PlacementActor>;
export declare function hasPlacementPermission(actor: PlacementActor, permission: PlacementPermission): boolean;
export declare function assertPlacementPermission(actor: PlacementActor, permission: PlacementPermission): void;
export declare function isCollegeTpOperator(actor: PlacementActor): boolean;
export declare function assertManagementReadOnly(actor: PlacementActor): void;
export declare function assertPlacementCollege(table: string, id: number, collegeId: number): Promise<any>;
export declare function assertStudentCollege(studentId: number, collegeId: number): Promise<any>;
export declare function assertStudentOwnsApplication(studentId: number, applicationId: number, collegeId: number): Promise<any>;
export declare function getCoordinatorScope(actor: PlacementActor): Promise<{
    departmentIds: number[];
    programIds: number[];
}>;
export declare function assertCoordinatorStudentAccess(actor: PlacementActor, studentId: number): Promise<any>;
export declare function getTrainerProgramIds(actor: PlacementActor): Promise<number[]>;
export declare function assertTrainerProgramAccess(actor: PlacementActor, programId: number): Promise<void>;
export declare function assertRecruiterCompany(recruiter: RecruiterActor, companyId: number): Promise<void>;
export declare function assertRecruiterOpportunity(recruiter: RecruiterActor, opportunityId: number): Promise<any>;
