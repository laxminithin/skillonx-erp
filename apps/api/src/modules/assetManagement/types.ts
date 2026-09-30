export type AssetActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
};

export type AssetPermission =
  | 'asset.view'
  | 'asset.manage'
  | 'asset.assign'
  | 'asset.retire';

export const ASSET_STATUSES = [
  'IN_STOCK',
  'ACTIVE',
  'ASSIGNED',
  'UNDER_MAINTENANCE',
  'LOST',
  'DAMAGED',
  'RETIRED',
  'DISPOSED',
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

/** Terminal statuses cannot transition further. */
export const TERMINAL_ASSET_STATUSES: ReadonlySet<AssetStatus> = new Set(['RETIRED', 'DISPOSED']);

/** Explicit allowed status transitions. Anything not listed here is rejected. */
export const ASSET_STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  IN_STOCK: ['ASSIGNED', 'ACTIVE', 'UNDER_MAINTENANCE', 'LOST', 'DAMAGED', 'RETIRED', 'DISPOSED'],
  ACTIVE: ['ASSIGNED', 'IN_STOCK', 'UNDER_MAINTENANCE', 'LOST', 'DAMAGED', 'RETIRED', 'DISPOSED'],
  ASSIGNED: ['IN_STOCK', 'ACTIVE', 'UNDER_MAINTENANCE', 'LOST', 'DAMAGED', 'RETIRED', 'DISPOSED'],
  UNDER_MAINTENANCE: ['IN_STOCK', 'ACTIVE', 'ASSIGNED', 'LOST', 'DAMAGED', 'RETIRED', 'DISPOSED'],
  LOST: ['IN_STOCK', 'RETIRED', 'DISPOSED'],
  DAMAGED: ['IN_STOCK', 'UNDER_MAINTENANCE', 'RETIRED', 'DISPOSED'],
  RETIRED: [],
  DISPOSED: [],
};

export const ASSET_CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED'] as const;
