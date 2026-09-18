import { db } from '../../db/index.js';
import { notifyEmployee } from './notifications.js';

export async function notifyCandidate(params: {
  candidateId: number;
  collegeId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  dedupeKey?: string | null;
}) {
  if (!(await db.schema.hasTable('hr_candidate_notifications'))) return;
  try {
    if (params.dedupeKey) {
      const existing = await db('hr_candidate_notifications')
        .where({ candidate_id: params.candidateId, dedupe_key: params.dedupeKey })
        .first();
      if (existing) return;
    }
    await db('hr_candidate_notifications').insert({
      college_id: params.collegeId,
      candidate_id: params.candidateId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
      related_type: params.relatedType ?? null,
      related_id: params.relatedId ?? null,
      dedupe_key: params.dedupeKey ?? null,
    });
  } catch {
    /* dedupe race — non-blocking */
  }
}

export async function notifyRecruitmentEmployee(params: {
  employeeId: number;
  collegeId: number;
  type: string;
  title: string;
  body?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  dedupeKey?: string | null;
}) {
  await notifyEmployee(params);
}
