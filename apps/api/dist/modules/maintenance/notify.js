import { db } from '../../db/index.js';
/**
 * Best-effort faculty notification via the shared employee_notifications table.
 * Never throws — a notification failure must not break a ticket mutation.
 * Students are not notified through this table (no student notification table
 * in scope); their timeline is the source of truth for status changes.
 */
export async function notifyFaculty(input) {
    try {
        if (!input.facultyUserId)
            return;
        if (!(await db.schema.hasTable('employee_notifications')))
            return;
        if (input.dedupeKey) {
            const existing = await db('employee_notifications')
                .where({ college_id: input.collegeId, faculty_user_id: input.facultyUserId, dedupe_key: input.dedupeKey })
                .first();
            if (existing)
                return;
        }
        await db('employee_notifications').insert({
            college_id: input.collegeId,
            faculty_user_id: input.facultyUserId,
            employee_id: null,
            type: input.type,
            title: input.title,
            body: input.body ?? null,
            link: input.link ?? null,
            related_type: input.relatedType ?? 'service_ticket',
            related_id: input.relatedId ?? null,
            dedupe_key: input.dedupeKey ?? null,
        });
    }
    catch {
        /* best-effort */
    }
}
