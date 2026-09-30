/** MIME allow-list — never trust a client-supplied filename extension. */
export const ALLOWED_MIME_TYPES = {
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
export const DOCUMENT_STATUSES = ['ACTIVE', 'SUPERSEDED', 'ARCHIVED'];
