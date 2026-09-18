import { db } from '../../db/index.js';
import type { LabActor } from './types.js';

function safeJson(value: unknown) {
  if (!value) return null;
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, inner) => {
    if (typeof inner === 'function') return undefined;
    if (typeof inner === 'object' && inner !== null) {
      if (seen.has(inner)) return '[Circular]';
      seen.add(inner);
    }
    return inner;
  });
}

export async function recordLabAudit(input: {
  collegeId: number;
  actorId?: number | null;
  actorType?: string;
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
}) {
  if (!(await db.schema.hasTable('lab_audit_log'))) return;
  await db('lab_audit_log').insert({
    college_id: input.collegeId,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? 'FACULTY',
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: safeJson(input.beforeState),
    after_state: safeJson(input.afterState),
    reason: input.reason ?? null,
  });
}

export function auditFromActor(
  actor: LabActor,
  action: string,
  entityType: string,
  entityId: number | null,
  extra?: { before?: unknown; after?: unknown; reason?: string | null },
) {
  return recordLabAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action,
    entityType,
    entityId,
    beforeState: extra?.before,
    afterState: extra?.after,
    reason: extra?.reason ?? null,
  });
}
