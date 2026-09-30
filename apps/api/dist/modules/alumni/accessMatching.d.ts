import type { AlumniAdminActor } from './service.js';
export declare function canAccessMatching(actor: AlumniAdminActor): boolean;
export declare function canOperateMatching(actor: AlumniAdminActor): boolean;
export declare function canFulfilNeed(actor: AlumniAdminActor): boolean;
export declare function isDepartmentScopedMatching(actor: AlumniAdminActor): boolean;
