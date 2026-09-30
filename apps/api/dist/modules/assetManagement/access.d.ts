import type { AssetActor, AssetPermission } from './types.js';
export declare function assetPermissionsForRole(role: string): AssetPermission[];
export declare function hasAssetPermission(actor: AssetActor, permission: AssetPermission): boolean;
export declare function assertAssetPermission(actor: AssetActor, permission: AssetPermission): void;
