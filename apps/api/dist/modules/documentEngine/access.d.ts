import type { DocumentActor, DocumentPermission } from './types.js';
export declare function documentPermissionsForRole(role: string): DocumentPermission[];
export declare function hasDocumentPermission(actor: DocumentActor, permission: DocumentPermission): boolean;
export declare function assertDocumentPermission(actor: DocumentActor, permission: DocumentPermission): void;
