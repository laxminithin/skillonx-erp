import type { Knex } from 'knex';
export type GapAuditAction = 'GAP_ANALYSIS_CREATED' | 'COVERAGE_CHANGED' | 'GAP_MARKED_NOT_APPLICABLE' | 'GAP_MARKED_APPLICABLE' | 'ACTION_ADDED' | 'ACTION_UPDATED' | 'ACTION_COMPLETED' | 'EVIDENCE_ADDED' | 'GAP_CLOSED' | 'GAP_REOPENED' | 'GAP_ANALYSIS_COMPLETED' | 'GAP_ANALYSIS_ARCHIVED' | 'GAP_ANALYSIS_REOPENED';
export declare function recordGapAudit(entry: {
    collegeId: number;
    analysisId: number;
    itemId?: number | null;
    actionId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: GapAuditAction;
    metadata?: Record<string, unknown> | null;
}, trx?: Knex.Transaction): Promise<void>;
export declare function listGapAudit(analysisId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    itemId: number | null;
    actionId: number | null;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
