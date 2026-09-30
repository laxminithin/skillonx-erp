import { db } from '../../db/index.js';
import type { IqacActor } from './types.js';

/** Mirrors `research/audit.ts`'s exact pattern, backed by `iqac_audit_log`. */
export async function recordIqacAudit(input: {
  collegeId: number;
  actorType?: string;
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
}) {
  if (!(await db.schema.hasTable('iqac_audit_log'))) return;
  await db('iqac_audit_log').insert({
    college_id: input.collegeId,
    actor_type: input.actorType ?? 'FACULTY',
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: input.beforeState != null ? JSON.stringify(input.beforeState) : null,
    after_state: input.afterState != null ? JSON.stringify(input.afterState) : null,
    reason: input.reason ?? null,
  });
}

export function auditFromActor(
  actor: IqacActor,
  action: string,
  entityType: string,
  entityId: number | null,
  extra?: { before?: unknown; after?: unknown; reason?: string | null },
) {
  return recordIqacAudit({
    collegeId: actor.collegeId,
    actorType: 'FACULTY',
    actorId: actor.facultyUserId,
    action,
    entityType,
    entityId,
    beforeState: extra?.before,
    afterState: extra?.after,
    reason: extra?.reason ?? null,
  });
}
