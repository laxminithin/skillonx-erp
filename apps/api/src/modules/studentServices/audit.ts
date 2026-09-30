import { db } from '../../db/index.js';

type AuditInput = {
  collegeId: number;
  actorId?: number | null;
  actorType?: 'FACULTY' | 'STUDENT' | 'PARENT' | 'SYSTEM';
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
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ note: 'unserializable state' });
  }
}

export async function recordServicesAudit(input: AuditInput) {
  if (!(await db.schema.hasTable('student_services_audit_log'))) return;
  try {
    await db('student_services_audit_log').insert({
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
  } catch {
    /* non-blocking */
  }
}
