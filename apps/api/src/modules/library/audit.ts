import { db } from '../../db/index.js';

type AuditParams = {
  collegeId: number;
  actorId?: number | null;
  actorType?: 'FACULTY' | 'STUDENT' | 'SYSTEM';
  action: string;
  entityType: string;
  entityId?: number | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
};

export async function recordLibraryAudit(params: AuditParams) {
  try {
    if (!(await db.schema.hasTable('library_audit_log'))) return;
    await db('library_audit_log').insert({
      college_id: params.collegeId,
      actor_id: params.actorId ?? null,
      actor_type: params.actorType ?? 'FACULTY',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      before_state: params.beforeState != null ? JSON.stringify(params.beforeState) : null,
      after_state: params.afterState != null ? JSON.stringify(params.afterState) : null,
      reason: params.reason ?? null,
    });
  } catch {
    /* non-blocking */
  }
}
