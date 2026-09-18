import { db } from '../../db/index.js';

/**
 * Best-effort faculty notification via the existing employee_notifications
 * table. Never throws — a notification failure must not break a lab mutation.
 * De-duplicates on dedupe_key when supplied.
 */
export async function notifyFaculty(input: {
  collegeId: number;
  facultyUserId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  dedupeKey?: string | null;
}): Promise<void> {
  try {
    if (!(await db.schema.hasTable('employee_notifications'))) return;
    if (input.dedupeKey) {
      const existing = await db('employee_notifications')
        .where({ college_id: input.collegeId, faculty_user_id: input.facultyUserId, dedupe_key: input.dedupeKey })
        .first();
      if (existing) return;
    }
    await db('employee_notifications').insert({
      college_id: input.collegeId,
      faculty_user_id: input.facultyUserId,
      employee_id: null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId ?? null,
      dedupe_key: input.dedupeKey ?? null,
    });
  } catch {
    /* best-effort */
  }
}
