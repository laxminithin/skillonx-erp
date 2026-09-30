/**
 * Faculty/staff actor (the original, still the only HTTP-router-reachable
 * shape) or a student actor — student uploads are in-process only, used by
 * modules like Finance's scholarship application flow. Exactly one of
 * facultyUserId/studentId is ever set; callers never populate both.
 */
export type DocumentActor = {
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
} & ({
    facultyUserId: number;
    studentId?: undefined;
} | {
    studentId: number;
    facultyUserId?: undefined;
});
export type DocumentPermission = 'document.upload' | 'document.manage';
/** MIME allow-list — never trust a client-supplied filename extension. */
export declare const ALLOWED_MIME_TYPES: Record<string, string>;
/** Raw decoded byte cap — comfortably under the API's global express.json 12mb limit once base64-inflated. */
export declare const MAX_DOCUMENT_BYTES: number;
export declare const DOCUMENT_STATUSES: readonly ["ACTIVE", "SUPERSEDED", "ARCHIVED"];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
