import type { ServicesActor, StudentServicesPermission } from './types.js';
export declare function hasServicesPermission(actor: ServicesActor, permission: StudentServicesPermission): boolean;
export declare function assertServicesPermission(actor: ServicesActor, permission: StudentServicesPermission): void;
export declare function canActOnWorkflowStep(actor: ServicesActor, actorRole: string): boolean;
export declare function isClassCoordinator(facultyId: number, collegeId: number, studentId: number): Promise<boolean>;
/** Whether the acting faculty is the student's ACTIVE mentor. */
export declare function isMentorOfStudent(facultyId: number, collegeId: number, studentId: number): Promise<boolean>;
export declare function canActAsRole(actor: ServicesActor, actorRole: string, studentId?: number): Promise<boolean>;
