import type { AlumniAdminActor } from './service.js';
export declare function canAccessAssistant(actor: AlumniAdminActor): boolean;
export declare function canProposeAssistantDrafts(actor: AlumniAdminActor): boolean;
export declare function canViewAssistantInternalNotes(actor: AlumniAdminActor): boolean;
export declare function isDepartmentScopedAssistant(actor: AlumniAdminActor): boolean;
export declare function toolPermissionAllowed(actor: AlumniAdminActor, required: string): boolean;
