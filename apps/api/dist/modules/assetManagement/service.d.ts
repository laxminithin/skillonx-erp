import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { type AssetActor, type AssetStatus } from './types.js';
export declare const registerAssetSchema: z.ZodObject<{
    assetTag: z.ZodString;
    name: z.ZodString;
    category: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    manufacturer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    model: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serialNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vendorId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    purchaseReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    custodianFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationRoomId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    acquisitionDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    warrantyStartDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    warrantyEndDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amcReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amcExpiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    condition: z.ZodNullable<z.ZodOptional<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    category: string;
    assetTag: string;
    departmentId?: number | null | undefined;
    notes?: string | null | undefined;
    description?: string | null | undefined;
    manufacturer?: string | null | undefined;
    model?: string | null | undefined;
    serialNumber?: string | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
    custodianFacultyId?: number | null | undefined;
    locationNote?: string | null | undefined;
    vendorId?: number | null | undefined;
    locationRoomId?: number | null | undefined;
    purchaseReference?: string | null | undefined;
    acquisitionDate?: string | null | undefined;
    warrantyStartDate?: string | null | undefined;
    warrantyEndDate?: string | null | undefined;
    amcReference?: string | null | undefined;
    amcExpiryDate?: string | null | undefined;
}, {
    name: string;
    category: string;
    assetTag: string;
    departmentId?: number | null | undefined;
    notes?: string | null | undefined;
    description?: string | null | undefined;
    manufacturer?: string | null | undefined;
    model?: string | null | undefined;
    serialNumber?: string | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
    custodianFacultyId?: number | null | undefined;
    locationNote?: string | null | undefined;
    vendorId?: number | null | undefined;
    locationRoomId?: number | null | undefined;
    purchaseReference?: string | null | undefined;
    acquisitionDate?: string | null | undefined;
    warrantyStartDate?: string | null | undefined;
    warrantyEndDate?: string | null | undefined;
    amcReference?: string | null | undefined;
    amcExpiryDate?: string | null | undefined;
}>;
export declare const assignSchema: z.ZodObject<{
    custodianFacultyId: z.ZodNullable<z.ZodNumber>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    custodianFacultyId: number | null;
    departmentId?: number | null | undefined;
    reason?: string | null | undefined;
}, {
    custodianFacultyId: number | null;
    departmentId?: number | null | undefined;
    reason?: string | null | undefined;
}>;
export declare const transferSchema: z.ZodObject<{
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationRoomId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    departmentId?: number | null | undefined;
    reason?: string | null | undefined;
    locationNote?: string | null | undefined;
    locationRoomId?: number | null | undefined;
}, {
    departmentId?: number | null | undefined;
    reason?: string | null | undefined;
    locationNote?: string | null | undefined;
    locationRoomId?: number | null | undefined;
}>;
export declare const conditionSchema: z.ZodObject<{
    condition: z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    condition: "GOOD" | "DAMAGED" | "FAIR" | "POOR";
    reason?: string | null | undefined;
}, {
    condition: "GOOD" | "DAMAGED" | "FAIR" | "POOR";
    reason?: string | null | undefined;
}>;
export declare const statusSchema: z.ZodObject<{
    status: z.ZodEnum<["IN_STOCK", "ACTIVE", "ASSIGNED", "UNDER_MAINTENANCE", "LOST", "DAMAGED", "RETIRED", "DISPOSED"]>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    status: "ACTIVE" | "RETIRED" | "LOST" | "DAMAGED" | "ASSIGNED" | "IN_STOCK" | "UNDER_MAINTENANCE" | "DISPOSED";
    reason?: string | null | undefined;
}, {
    status: "ACTIVE" | "RETIRED" | "LOST" | "DAMAGED" | "ASSIGNED" | "IN_STOCK" | "UNDER_MAINTENANCE" | "DISPOSED";
    reason?: string | null | undefined;
}>;
/**
 * Cross-module read-only accessor (Phase 3 Facilities/Maintenance integration —
 * see docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md §7/§8/§31). Mirrors the
 * existing `procurement/service.ts:findVendorRef` convention: a lightweight,
 * tenant-scoped lookup for another module to reference this frozen module's
 * canonical data without duplicating it. Never throws on a missing/foreign id.
 */
export declare function findAssetRef(collegeId: number, assetId: number): Promise<{
    id: number;
    assetTag: string;
    name: string;
    category: string;
    status: AssetStatus;
    warrantyEndDate: any;
    amcReference: any;
    amcExpiryDate: any;
} | null>;
/**
 * Additive, append-only history entry recording that a maintenance ticket
 * touched this asset. NEVER mutates `campus_assets.status` or any other asset
 * field — that stays exclusively behind `changeStatus`'s validated state
 * machine. This is the minimal integration point so maintenance history is
 * traceable from the asset (audit §8) without a second work-order ledger
 * living inside Asset Management.
 */
export declare function recordMaintenanceHistory(collegeId: number, assetId: number, action: 'MAINTENANCE_TICKET_LINKED' | 'MAINTENANCE_COMPLETED', meta: Record<string, unknown>, actorFacultyId: number | null): Promise<boolean>;
export declare function registerAsset(actor: AssetActor, input: z.infer<typeof registerAssetSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function listAssets(actor: AssetActor, filters?: {
    category?: string;
    status?: string;
    departmentId?: number;
    custodianFacultyId?: number;
}): Promise<{
    [k: string]: unknown;
}[]>;
export declare function getAsset(actor: AssetActor, assetId: number, trx?: Knex.Transaction | typeof db): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function assignAsset(actor: AssetActor, assetId: number, input: z.infer<typeof assignSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function transferAsset(actor: AssetActor, assetId: number, input: z.infer<typeof transferSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function updateCondition(actor: AssetActor, assetId: number, input: z.infer<typeof conditionSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function changeStatus(actor: AssetActor, assetId: number, input: z.infer<typeof statusSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
