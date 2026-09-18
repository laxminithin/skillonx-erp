import type { Knex } from 'knex';
export type CoEvalAuditAction = 'CO_EVALUATION_CREATED' | 'CELL_CHANGED' | 'EVALUATION_PERCENT_CHANGED' | 'MARKS_DISTRIBUTION_CHANGED' | 'RESET_TO_STANDARD' | 'CELL_RESET' | 'DRAFT_SAVED' | 'FINALIZED' | 'REOPENED' | 'ARCHIVED';
export declare function recordCoEvalAudit(entry: {
    collegeId: number;
    evaluationId: number;
    cellId?: number | null;
    coRowId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: CoEvalAuditAction;
    metadata?: Record<string, unknown> | null;
}, trx?: Knex.Transaction): Promise<void>;
export declare function listCoEvalAudit(evaluationId: number, collegeId: number): Promise<{
    id: any;
    action: any;
    createdAt: any;
    cellId: number | null;
    coRowId: number | null;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
