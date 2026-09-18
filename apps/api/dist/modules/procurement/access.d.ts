import type { ProcurementActor, ProcurementPermission } from './types.js';
export declare function procurementPermissionsForRole(role: string): ProcurementPermission[];
export declare function hasProcurementPermission(actor: ProcurementActor, permission: ProcurementPermission): boolean;
export declare function assertProcurementPermission(actor: ProcurementActor, permission: ProcurementPermission): void;
export declare function assertDepartmentScope(actor: ProcurementActor, departmentId?: number | null): void;
