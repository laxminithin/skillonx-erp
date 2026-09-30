export type AssetActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
};
export type AssetPermission = 'asset.view' | 'asset.manage' | 'asset.assign' | 'asset.retire';
export declare const ASSET_STATUSES: readonly ["IN_STOCK", "ACTIVE", "ASSIGNED", "UNDER_MAINTENANCE", "LOST", "DAMAGED", "RETIRED", "DISPOSED"];
export type AssetStatus = (typeof ASSET_STATUSES)[number];
/** Terminal statuses cannot transition further. */
export declare const TERMINAL_ASSET_STATUSES: ReadonlySet<AssetStatus>;
/** Explicit allowed status transitions. Anything not listed here is rejected. */
export declare const ASSET_STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]>;
export declare const ASSET_CONDITIONS: readonly ["GOOD", "FAIR", "POOR", "DAMAGED"];
