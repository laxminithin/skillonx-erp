import type { CanteenActor, CanteenPermission } from './types.js';
export declare function canteenPermissionsForRole(role: string): CanteenPermission[];
export declare function hasCanteenPermission(actor: CanteenActor, permission: CanteenPermission): boolean;
export declare function assertCanteenPermission(actor: CanteenActor, permission: CanteenPermission): void;
