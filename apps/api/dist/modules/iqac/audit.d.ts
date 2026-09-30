import type { IqacActor } from './types.js';
/** Mirrors `research/audit.ts`'s exact pattern, backed by `iqac_audit_log`. */
export declare function recordIqacAudit(input: {
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
export declare function auditFromActor(actor: IqacActor, action: string, entityType: string, entityId: number | null, extra?: {
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
