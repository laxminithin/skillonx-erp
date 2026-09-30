import type { AlumniAdminActor } from './service.js';
export declare function canAccessCrm(actor: AlumniAdminActor): boolean;
export declare function canOperateCrm(actor: AlumniAdminActor): boolean;
export declare function canReassignOwnership(actor: AlumniAdminActor): boolean;
export declare function canVerifyOutcomes(actor: AlumniAdminActor): boolean;
export declare function canWriteInternalNotes(actor: AlumniAdminActor): boolean;
export declare function isDepartmentScoped(actor: AlumniAdminActor): boolean;
export declare function isTpScoped(actor: AlumniAdminActor): boolean;
export declare function ownerTypeForRole(role: string): string;
