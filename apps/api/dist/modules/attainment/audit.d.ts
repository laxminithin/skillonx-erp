import type { Knex } from 'knex';
export declare function recordAttainmentAudit(entry: {
    collegeId: number;
    runId?: number | null;
    cycleId?: number | null;
    sheetId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
}, trx?: Knex.Transaction): Promise<void>;
export declare function listAttainmentAudit(collegeId: number, opts: {
    runId?: number;
    cycleId?: number;
}): Promise<{
    id: any;
    action: any;
    createdAt: any;
    runId: number | null;
    cycleId: number | null;
    actor: any;
    metadata: Record<string, unknown> | null;
}[]>;
