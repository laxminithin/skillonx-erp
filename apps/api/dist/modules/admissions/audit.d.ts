import type { AdmissionActor } from './types.js';
export declare function recordAdmissionAudit(input: {
    collegeId: number;
    actorType?: string;
    actorId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    beforeState?: unknown;
    afterState?: unknown;
    reason?: string | null;
}): Promise<void>;
export declare function auditFromActor(actor: AdmissionActor, action: string, entityType: string, entityId: number | null, extra?: {
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
