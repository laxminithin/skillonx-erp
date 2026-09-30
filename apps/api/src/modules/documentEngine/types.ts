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
} & (
  | { facultyUserId: number; studentId?: undefined }
  | { studentId: number; facultyUserId?: undefined }
);

export type DocumentPermission = 'document.upload' | 'document.manage';

/** MIME allow-list — never trust a client-supplied filename extension. */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
};

/** Raw decoded byte cap — comfortably under the API's global express.json 12mb limit once base64-inflated. */
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export const DOCUMENT_STATUSES = ['ACTIVE', 'SUPERSEDED', 'ARCHIVED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
