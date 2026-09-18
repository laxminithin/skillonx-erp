import type { LabActor } from './types.js';
export declare function recordLabAudit(input: {
    collegeId: number;
    actorId?: number | null;
    actorType?: string;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
}): Promise<void>;
export declare function auditFromActor(actor: LabActor, action: string, entityType: string, entityId: number | null, extra?: {
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
