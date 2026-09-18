import { db } from '../../db/index.js';

export type LessonAuditAction =
  | 'CREATED'
  | 'GENERATED'
  | 'ACTIVATED'
  | 'RESCHEDULED'
  | 'FUTURE_SCHEDULE_SHIFTED'
  | 'TOPIC_ADDED'
  | 'TOPIC_EDITED'
  | 'TOPIC_SPLIT'
  | 'TOPIC_MERGED'
  | 'TOPIC_REORDERED'
  | 'LESSON_COMPLETED'
  | 'LESSON_SKIPPED'
  | 'COMPLETED_ENTRY_CORRECTED'
  | 'ARCHIVED'
  | 'DELETED'
  | 'HOLIDAY_CONFLICT_FLAGGED';

export async function recordLessonAudit(entry: {
  collegeId: number;
  planId: number;
  actorId?: number | null;
  actorName?: string | null;
  action: LessonAuditAction;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await db('lesson_plan_audit_log').insert({
      college_id: entry.collegeId,
      plan_id: entry.planId,
      actor_id: entry.actorId ?? null,
      actor_name: entry.actorName ?? null,
      action: entry.action,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });
  } catch (err) {
    console.error('[lesson-audit] failed to record event', entry.action, err);
  }
}

function parseJson(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return value as Record<string, unknown>;
}

export async function listLessonAudit(planId: number, collegeId: number) {
  const rows = await db('lesson_plan_audit_log as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
    .where({ 'a.plan_id': planId, 'a.college_id': collegeId })
    .orderBy('a.created_at', 'desc')
    .limit(100)
    .select(
      'a.id',
      'a.action',
      'a.metadata',
      'a.created_at as createdAt',
      'a.actor_name as actorName',
      'f.name as actorCurrentName',
    );

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    createdAt: r.createdAt,
    actor: r.actorCurrentName ?? r.actorName ?? 'System',
    metadata: parseJson(r.metadata),
  }));
}
