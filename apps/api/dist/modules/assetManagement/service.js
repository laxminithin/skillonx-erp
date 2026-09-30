import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { findVendorRef } from '../procurement/service.js';
import { assertAssetPermission } from './access.js';
import { ASSET_CONDITIONS, ASSET_STATUSES, ASSET_STATUS_TRANSITIONS, TERMINAL_ASSET_STATUSES, } from './types.js';
export const registerAssetSchema = z.object({
    assetTag: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    category: z.string().trim().min(1).max(96),
    description: z.string().trim().max(4000).optional().nullable(),
    manufacturer: z.string().trim().max(160).optional().nullable(),
    model: z.string().trim().max(160).optional().nullable(),
    serialNumber: z.string().trim().max(160).optional().nullable(),
    vendorId: z.number().int().positive().optional().nullable(),
    purchaseReference: z.string().trim().max(191).optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    custodianFacultyId: z.number().int().positive().optional().nullable(),
    locationRoomId: z.number().int().positive().optional().nullable(),
    locationNote: z.string().trim().max(255).optional().nullable(),
    acquisitionDate: z.string().trim().max(16).optional().nullable(),
    warrantyStartDate: z.string().trim().max(16).optional().nullable(),
    warrantyEndDate: z.string().trim().max(16).optional().nullable(),
    amcReference: z.string().trim().max(191).optional().nullable(),
    amcExpiryDate: z.string().trim().max(16).optional().nullable(),
    condition: z.enum(ASSET_CONDITIONS).optional().nullable(),
    notes: z.string().trim().max(4000).optional().nullable(),
}).strict();
export const assignSchema = z.object({
    custodianFacultyId: z.number().int().positive().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const transferSchema = z.object({
    departmentId: z.number().int().positive().optional().nullable(),
    locationRoomId: z.number().int().positive().optional().nullable(),
    locationNote: z.string().trim().max(255).optional().nullable(),
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const conditionSchema = z.object({
    condition: z.enum(ASSET_CONDITIONS),
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const statusSchema = z.object({
    status: z.enum(ASSET_STATUSES),
    reason: z.string().trim().max(2000).optional().nullable(),
}).strict();
function n(value) {
    return Number(value ?? 0);
}
function shape(row) {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
}
async function assertCollegeRow(trx, table, collegeId, id) {
    const row = await trx(table).where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Record not found');
    return row;
}
async function recordHistory(trx, actor, assetId, action, previousValue, newValue, reason) {
    await trx('campus_asset_history').insert({
        college_id: actor.collegeId,
        asset_id: assetId,
        action,
        previous_value: previousValue !== undefined ? JSON.stringify(previousValue) : null,
        new_value: newValue !== undefined ? JSON.stringify(newValue) : null,
        actor_id: actor.facultyUserId,
        reason: reason ?? null,
    });
}
async function lockAsset(trx, collegeId, assetId) {
    const row = await trx('campus_assets').where({ id: assetId, college_id: collegeId }).forUpdate().first();
    if (!row)
        throw new AppError(404, 'Asset not found');
    return row;
}
/**
 * Cross-module read-only accessor (Phase 3 Facilities/Maintenance integration —
 * see docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md §7/§8/§31). Mirrors the
 * existing `procurement/service.ts:findVendorRef` convention: a lightweight,
 * tenant-scoped lookup for another module to reference this frozen module's
 * canonical data without duplicating it. Never throws on a missing/foreign id.
 */
export async function findAssetRef(collegeId, assetId) {
    const row = await db('campus_assets')
        .where({ id: assetId, college_id: collegeId })
        .select('id', 'asset_tag', 'name', 'category', 'status', 'warranty_end_date', 'amc_reference', 'amc_expiry_date')
        .first();
    if (!row)
        return null;
    return {
        id: Number(row.id),
        assetTag: row.asset_tag,
        name: row.name,
        category: row.category,
        status: row.status,
        warrantyEndDate: row.warranty_end_date ?? null,
        amcReference: row.amc_reference ?? null,
        amcExpiryDate: row.amc_expiry_date ?? null,
    };
}
/**
 * Additive, append-only history entry recording that a maintenance ticket
 * touched this asset. NEVER mutates `campus_assets.status` or any other asset
 * field — that stays exclusively behind `changeStatus`'s validated state
 * machine. This is the minimal integration point so maintenance history is
 * traceable from the asset (audit §8) without a second work-order ledger
 * living inside Asset Management.
 */
export async function recordMaintenanceHistory(collegeId, assetId, action, meta, actorFacultyId) {
    const asset = await db('campus_assets').where({ id: assetId, college_id: collegeId }).first();
    if (!asset)
        return false;
    await db('campus_asset_history').insert({
        college_id: collegeId,
        asset_id: assetId,
        action,
        previous_value: null,
        new_value: JSON.stringify(meta),
        actor_id: actorFacultyId,
        reason: 'Facilities/Maintenance integration',
    });
    return true;
}
export async function registerAsset(actor, input) {
    assertAssetPermission(actor, 'asset.manage');
    if (input.vendorId) {
        const vendor = await findVendorRef(actor.collegeId, input.vendorId);
        if (!vendor)
            throw new AppError(404, 'Vendor not found');
    }
    if (input.departmentId)
        await assertCollegeRow(db, 'departments', actor.collegeId, input.departmentId);
    if (input.custodianFacultyId)
        await assertCollegeRow(db, 'faculty_users', actor.collegeId, input.custodianFacultyId);
    if (input.locationRoomId)
        await assertCollegeRow(db, 'rooms', actor.collegeId, input.locationRoomId);
    return db.transaction(async (trx) => {
        const status = input.custodianFacultyId ? 'ASSIGNED' : 'IN_STOCK';
        const [id] = await trx('campus_assets').insert({
            college_id: actor.collegeId,
            asset_tag: input.assetTag.toUpperCase(),
            name: input.name,
            category: input.category,
            description: input.description ?? null,
            manufacturer: input.manufacturer ?? null,
            model: input.model ?? null,
            serial_number: input.serialNumber ?? null,
            vendor_id: input.vendorId ?? null,
            purchase_reference: input.purchaseReference ?? null,
            department_id: input.departmentId ?? null,
            custodian_faculty_id: input.custodianFacultyId ?? null,
            location_room_id: input.locationRoomId ?? null,
            location_note: input.locationNote ?? null,
            acquisition_date: input.acquisitionDate ?? null,
            warranty_start_date: input.warrantyStartDate ?? null,
            warranty_end_date: input.warrantyEndDate ?? null,
            amc_reference: input.amcReference ?? null,
            amc_expiry_date: input.amcExpiryDate ?? null,
            status,
            condition: input.condition ?? null,
            notes: input.notes ?? null,
            created_by: actor.facultyUserId,
        });
        await recordHistory(trx, actor, n(id), 'REGISTERED', null, { assetTag: input.assetTag, status });
        return getAsset(actor, n(id), trx);
    });
}
export async function listAssets(actor, filters = {}) {
    assertAssetPermission(actor, 'asset.view');
    let query = db('campus_assets as a')
        .leftJoin('procurement_vendors as v', 'v.id', 'a.vendor_id')
        .leftJoin('faculty_users as c', 'c.id', 'a.custodian_faculty_id')
        .where('a.college_id', actor.collegeId);
    if (filters.category)
        query = query.andWhere('a.category', filters.category);
    if (filters.status)
        query = query.andWhere('a.status', filters.status);
    if (filters.departmentId)
        query = query.andWhere('a.department_id', filters.departmentId);
    if (filters.custodianFacultyId)
        query = query.andWhere('a.custodian_faculty_id', filters.custodianFacultyId);
    const rows = await query
        .select('a.*', 'v.name as vendor_name', 'c.name as custodian_name')
        .orderBy('a.id', 'desc')
        .limit(500);
    return rows.map(shape);
}
export async function getAsset(actor, assetId, trx = db) {
    assertAssetPermission(actor, 'asset.view');
    const asset = await trx('campus_assets as a')
        .leftJoin('procurement_vendors as v', 'v.id', 'a.vendor_id')
        .leftJoin('faculty_users as c', 'c.id', 'a.custodian_faculty_id')
        .where({ 'a.id': assetId, 'a.college_id': actor.collegeId })
        .select('a.*', 'v.name as vendor_name', 'c.name as custodian_name')
        .first();
    if (!asset)
        throw new AppError(404, 'Asset not found');
    const history = await trx('campus_asset_history as h')
        .join('faculty_users as u', 'u.id', 'h.actor_id')
        .where({ 'h.college_id': actor.collegeId, 'h.asset_id': assetId })
        .select('h.*', 'u.name as actor_name')
        .orderBy('h.id', 'desc');
    return { ...shape(asset), history: history.map((row) => shape({ ...row, previous_value: row.previous_value ? JSON.parse(row.previous_value) : null, new_value: row.new_value ? JSON.parse(row.new_value) : null })) };
}
export async function assignAsset(actor, assetId, input) {
    assertAssetPermission(actor, 'asset.assign');
    if (input.custodianFacultyId)
        await assertCollegeRow(db, 'faculty_users', actor.collegeId, input.custodianFacultyId);
    if (input.departmentId)
        await assertCollegeRow(db, 'departments', actor.collegeId, input.departmentId);
    return db.transaction(async (trx) => {
        const asset = await lockAsset(trx, actor.collegeId, assetId);
        if (TERMINAL_ASSET_STATUSES.has(asset.status)) {
            throw new AppError(400, `Asset is ${asset.status} and cannot be reassigned`);
        }
        const previous = { custodianFacultyId: asset.custodian_faculty_id, departmentId: asset.department_id, status: asset.status };
        const nextStatus = input.custodianFacultyId ? 'ASSIGNED' : 'IN_STOCK';
        await trx('campus_assets').where({ id: assetId }).update({
            custodian_faculty_id: input.custodianFacultyId ?? null,
            department_id: input.departmentId ?? asset.department_id,
            status: nextStatus,
            updated_at: trx.fn.now(),
        });
        await recordHistory(trx, actor, assetId, input.custodianFacultyId ? 'ASSIGNED' : 'RETURNED', previous, { custodianFacultyId: input.custodianFacultyId ?? null, departmentId: input.departmentId ?? asset.department_id, status: nextStatus }, input.reason);
        return getAsset(actor, assetId, trx);
    });
}
export async function transferAsset(actor, assetId, input) {
    assertAssetPermission(actor, 'asset.assign');
    if (input.departmentId)
        await assertCollegeRow(db, 'departments', actor.collegeId, input.departmentId);
    if (input.locationRoomId)
        await assertCollegeRow(db, 'rooms', actor.collegeId, input.locationRoomId);
    return db.transaction(async (trx) => {
        const asset = await lockAsset(trx, actor.collegeId, assetId);
        if (TERMINAL_ASSET_STATUSES.has(asset.status)) {
            throw new AppError(400, `Asset is ${asset.status} and cannot be transferred`);
        }
        const previous = { departmentId: asset.department_id, locationRoomId: asset.location_room_id, locationNote: asset.location_note };
        await trx('campus_assets').where({ id: assetId }).update({
            department_id: input.departmentId ?? asset.department_id,
            location_room_id: input.locationRoomId ?? null,
            location_note: input.locationNote ?? null,
            updated_at: trx.fn.now(),
        });
        await recordHistory(trx, actor, assetId, 'TRANSFERRED', previous, { departmentId: input.departmentId ?? asset.department_id, locationRoomId: input.locationRoomId ?? null, locationNote: input.locationNote ?? null }, input.reason);
        return getAsset(actor, assetId, trx);
    });
}
export async function updateCondition(actor, assetId, input) {
    assertAssetPermission(actor, 'asset.manage');
    return db.transaction(async (trx) => {
        const asset = await lockAsset(trx, actor.collegeId, assetId);
        if (TERMINAL_ASSET_STATUSES.has(asset.status)) {
            throw new AppError(400, `Asset is ${asset.status}; condition can no longer be updated`);
        }
        const previous = { condition: asset.condition };
        await trx('campus_assets').where({ id: assetId }).update({ condition: input.condition, updated_at: trx.fn.now() });
        await recordHistory(trx, actor, assetId, 'CONDITION_UPDATED', previous, { condition: input.condition }, input.reason);
        return getAsset(actor, assetId, trx);
    });
}
export async function changeStatus(actor, assetId, input) {
    const permission = ['RETIRED', 'DISPOSED'].includes(input.status) ? 'asset.retire' : 'asset.manage';
    assertAssetPermission(actor, permission);
    return db.transaction(async (trx) => {
        const asset = await lockAsset(trx, actor.collegeId, assetId);
        const current = asset.status;
        if (TERMINAL_ASSET_STATUSES.has(current)) {
            throw new AppError(400, `Asset is already ${current}, a terminal state`);
        }
        const allowed = ASSET_STATUS_TRANSITIONS[current] ?? [];
        if (!allowed.includes(input.status)) {
            throw new AppError(400, `Invalid asset status transition from ${current} to ${input.status}`);
        }
        await trx('campus_assets').where({ id: assetId }).update({ status: input.status, updated_at: trx.fn.now() });
        await recordHistory(trx, actor, assetId, 'STATUS_CHANGED', { status: current }, { status: input.status }, input.reason);
        return getAsset(actor, assetId, trx);
    });
}
