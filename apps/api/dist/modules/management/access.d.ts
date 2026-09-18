import type { ManagementActor, ManagementPermission } from './types.js';
export declare function managementPermissionsForRole(role: string): ManagementPermission[];
export declare function hasManagementPermission(actor: ManagementActor, permission: ManagementPermission): boolean;
export declare function assertManagementPermission(actor: ManagementActor, permission: ManagementPermission): void;
/** Is this actor allowed into the Management Portal at all? */
export declare function isManagementActor(actor: ManagementActor): boolean;
export declare function assertManagementActor(actor: ManagementActor): void;
/** The set of capabilities this actor holds — surfaced to the web app so it can
 * render only the sections the executive is permitted to see. */
export declare function managementCapabilities(actor: ManagementActor): ManagementPermission[];
