import type { Knex } from 'knex';
import { db } from '../../db/index.js';

/** Same shape as `research/audit.ts`, backed by `campus_events_audit_log`. */
export async function recordEventsAudit(
  input: {
    collegeId: number;
    actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
    actorId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
  },
  trx: Knex.Transaction | typeof db = db,
) {
  await trx('campus_events_audit_log').insert({
    college_id: input.collegeId,
    actor_type: input.actorType ?? 'FACULTY',
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: input.before != null ? JSON.stringify(input.before) : null,
    after_state: input.after != null ? JSON.stringify(input.after) : null,
    reason: input.reason ?? null,
  });
}
