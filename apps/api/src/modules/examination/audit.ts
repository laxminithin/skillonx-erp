import { db } from '../../db/index.js';

type AuditInput = {
  collegeId: number;
  actorId?: number | null;
  actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
};

function safeJson(value: unknown) {
  if (value == null) return null;
  try {
    return JSON.stringify(value, (_key, v) => {
      if (typeof v === 'function' || (v && typeof v === 'object' && 'isImmutable' in v)) return undefined;
      return v;
    });
  } catch {
    return JSON.stringify({ note: 'unserializable state' });
  }
}

export async function recordExamAudit(input: AuditInput) {
  if (!(await db.schema.hasTable('examination_audit_log'))) return;
  await db('examination_audit_log').insert({
    college_id: input.collegeId,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? 'FACULTY',
    actor_name: input.actorName ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: safeJson(input.beforeState),
    after_state: safeJson(input.afterState),
    reason: input.reason ?? null,
  });
}
