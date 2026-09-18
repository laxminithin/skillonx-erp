import { db } from '../../db/index.js';

export async function recordCbsAudit(input: {
  collegeId: number;
  planId: number;
  itemId?: number | null;
  actorId?: number | null;
  actorName?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
}) {
  await db('faculty_cbs_audit_log').insert({
    college_id: input.collegeId,
    plan_id: input.planId,
    item_id: input.itemId ?? null,
    actor_id: input.actorId ?? null,
    actor_name: input.actorName ?? null,
    action: input.action,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function listCbsAudit(planId: number, collegeId: number) {
  const rows = await db('faculty_cbs_audit_log')
    .where({ plan_id: planId, college_id: collegeId })
    .orderBy('created_at', 'desc')
    .select(
      'id',
      'item_id as itemId',
      'actor_id as actorId',
      'actor_name as actorName',
      'action',
      'metadata',
      'created_at as createdAt',
    );
  return rows.map((r) => ({
    ...r,
    metadata:
      typeof r.metadata === 'string'
        ? (() => {
            try {
              return JSON.parse(r.metadata as string);
            } catch {
              return r.metadata;
            }
          })()
        : r.metadata,
  }));
}
