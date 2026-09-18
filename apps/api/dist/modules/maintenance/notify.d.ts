/**
 * Best-effort faculty notification via the shared employee_notifications table.
 * Never throws — a notification failure must not break a ticket mutation.
 * Students are not notified through this table (no student notification table
 * in scope); their timeline is the source of truth for status changes.
 */
export declare function notifyFaculty(input: {
    collegeId: number;
    facultyUserId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeKey?: string | null;
}): Promise<void>;
