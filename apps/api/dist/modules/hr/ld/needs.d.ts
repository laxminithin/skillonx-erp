import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { devNeedSchema } from './types.js';
export declare function createNeed(actor: HrActor, input: z.infer<typeof devNeedSchema>): Promise<{
    id: number;
}>;
export declare function listNeeds(actor: HrActor, opts?: {
    employeeId?: number;
    status?: string;
}): Promise<any[]>;
export declare function transitionNeed(actor: HrActor, needId: number, status: string, reason?: string): Promise<{
    id: number;
    status: string;
}>;
