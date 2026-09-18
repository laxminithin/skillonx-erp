import type { HrActor } from '../types.js';
import { roleVisible } from './access.js';
import type { z } from 'zod';
import type { criticalRoleSchema, criticalRoleUpdateSchema } from './types.js';
export declare function createRole(actor: HrActor, input: z.infer<typeof criticalRoleSchema>): Promise<{
    id: number;
}>;
export declare function updateRole(actor: HrActor, roleId: number, input: z.infer<typeof criticalRoleUpdateSchema>): Promise<{
    id: number;
}>;
export declare function setRoleActive(actor: HrActor, roleId: number, active: boolean): Promise<{
    id: number;
    isActive: boolean;
}>;
export declare function listRoles(actor: HrActor, filters?: {
    criticality?: string;
    active?: boolean;
    departmentId?: number;
}): Promise<any[]>;
export declare function getRole(actor: HrActor, roleId: number): Promise<any>;
export { roleVisible };
