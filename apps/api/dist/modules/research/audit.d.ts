import type { ResearchActor } from './types.js';
/** Mirrors `admissions/audit.ts`'s exact pattern, backed by `research_audit_log`. */
export declare function recordResearchAudit(input: {
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
export declare function auditFromActor(actor: ResearchActor, action: string, entityType: string, entityId: number | null, extra?: {
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
