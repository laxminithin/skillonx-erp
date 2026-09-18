import { db } from '../../db/index.js';

export async function recordHostelAudit(input: {
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
  if (!(await db.schema.hasTable('hostel_audit_log'))) return;
  await db('hostel_audit_log').insert({
    college_id: input.collegeId,
    actor_id: input.actorId ?? null,
    actor_type: input.actorType ?? 'FACULTY',
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: input.beforeState ? JSON.stringify(input.beforeState) : null,
    after_state: input.afterState ? JSON.stringify(input.afterState) : null,
    reason: input.reason ?? null,
  });
}
