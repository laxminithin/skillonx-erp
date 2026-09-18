import type { HrActor } from './types.js';
export declare function recordHrAudit(params: {
    actor: HrActor;
    action: string;
    entityType: string;
    entityId?: number | null;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
