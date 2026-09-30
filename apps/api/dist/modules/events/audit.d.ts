import type { Knex } from 'knex';
import { db } from '../../db/index.js';
/** Same shape as `research/audit.ts`, backed by `campus_events_audit_log`. */
export declare function recordEventsAudit(input: {
    collegeId: number;
    actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
    actorId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}, trx?: Knex.Transaction | typeof db): Promise<void>;
