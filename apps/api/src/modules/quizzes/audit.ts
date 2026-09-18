import { db } from '../../db/index.js';

export type QuizAuditAction =
  | 'CREATED'
  | 'PUBLISHED'
  | 'SCHEDULE_CHANGED'
  | 'EXTENDED'
  | 'CLOSED'
  | 'REOPENED'
  | 'ARCHIVED'
  | 'DELETED'
  | 'DUPLICATED'
  | 'ANSWER_KEY_CHANGED'
  | 'QUESTION_ADDED'
  | 'QUESTION_REMOVED';

export async function recordQuizAudit(entry: {
  collegeId: number;
  quizId: number;
  actorId?: number | null;
  actorName?: string | null;
  action: QuizAuditAction;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await db('quiz_audit_log').insert({
      college_id: entry.collegeId,
      quiz_id: entry.quizId,
      actor_id: entry.actorId ?? null,
      actor_name: entry.actorName ?? null,
      action: entry.action,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });
  } catch (err) {
    console.error('[quiz-audit] failed to record event', entry.action, err);
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

export async function listQuizAudit(quizId: number, collegeId: number) {
  const rows = await db('quiz_audit_log as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
    .where({ 'a.quiz_id': quizId, 'a.college_id': collegeId })
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
