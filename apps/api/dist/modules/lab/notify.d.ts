/**
 * Best-effort faculty notification via the existing employee_notifications
 * table. Never throws — a notification failure must not break a lab mutation.
 * De-duplicates on dedupe_key when supplied.
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
