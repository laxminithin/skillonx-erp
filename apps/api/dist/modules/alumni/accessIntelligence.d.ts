import type { AlumniAdminActor } from './service.js';
import { isDepartmentScoped, isTpScoped } from './accessCrm.js';
import { canAdminAlumni } from './access360.js';
export declare function canViewIntelligence(actor: AlumniAdminActor): boolean;
export declare function canCreateSavedSegments(actor: AlumniAdminActor): boolean;
export declare function canEditInstitutionalSegments(actor: AlumniAdminActor): boolean;
export declare function canExportIntelligence(actor: AlumniAdminActor): boolean;
export declare function canViewContactDetails(actor: AlumniAdminActor): boolean;
export { isDepartmentScoped, isTpScoped, canAdminAlumni };
