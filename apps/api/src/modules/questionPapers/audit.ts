import { db } from '../../db/index.js';

export async function recordQpAudit(input: {
  collegeId: number;
  paperId: number;
  itemId?: number | null;
  actorId?: number | null;
  actorName?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
}) {
  await db('internal_question_paper_audit').insert({
    college_id: input.collegeId,
    paper_id: input.paperId,
    item_id: input.itemId ?? null,
    actor_id: input.actorId ?? null,
    actor_name: input.actorName ?? null,
    action: input.action,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}
