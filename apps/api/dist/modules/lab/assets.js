import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, assertAssetCollege, scopedLabIds } from './access.js';
import { auditFromActor, recordLabAudit } from './audit.js';
function shapeAsset(row) {
    return {
        id: Number(row.id),
        assetTag: row.asset_tag,
        serialNumber: row.serial_number ?? null,
        category: row.category,
        assetClass: row.asset_class,
        name: row.name,
        make: row.make ?? null,
        model: row.model ?? null,
        labId: row.lab_id ? Number(row.lab_id) : null,
        labName: row.lab_name ?? null,
        departmentId: row.department_id ? Number(row.department_id) : null,
        purchaseDate: row.purchase_date ?? null,
        cost: row.cost != null ? Number(row.cost) : null,
        vendor: row.vendor ?? null,
        warrantyStart: row.warranty_start ?? null,
        warrantyEnd: row.warranty_end ?? null,
        amcStart: row.amc_start ?? null,
        amcEnd: row.amc_end ?? null,
        operationalStatus: row.operational_status,
        condition: row.condition,
        custodianFacultyId: row.custodian_faculty_id ? Number(row.custodian_faculty_id) : null,
        custodianName: row.custodian_name ?? null,
        hostname: row.hostname ?? null,
        systemNumber: row.system_number ?? null,
        processor: row.processor ?? null,
        ram: row.ram ?? null,
        storage: row.storage ?? null,
        os: row.os ?? null,
        remarks: row.remarks ?? null,
    };
}
export async function listAssets(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
    const base = () => {
        let q = db('lab_assets as a')
            .leftJoin('labs as l', 'l.id', 'a.lab_id')
            .leftJoin('faculty_users as f', 'f.id', 'a.custodian_faculty_id')
            .where('a.college_id', actor.collegeId);
        if (ids !== 'ALL') {
            // Assets with no lab (college pool) are visible only to admins (ids==='ALL').
            q = q.whereIn('a.lab_id', ids.length ? ids : [-1]);
        }
        if (filters.labId)
            q = q.where('a.lab_id', filters.labId);
        if (filters.category)
            q = q.where('a.category', filters.category);
        if (filters.status)
            q = q.where('a.operational_status', filters.status);
        if (filters.condition)
            q = q.where('a.condition', filters.condition);
        if (filters.assetClass)
            q = q.where('a.asset_class', filters.assetClass);
        if (filters.q) {
            q = q.where((b) => b
                .whereILike('a.asset_tag', `%${filters.q}%`)
                .orWhereILike('a.serial_number', `%${filters.q}%`)
                .orWhereILike('a.name', `%${filters.q}%`));
        }
        return q;
    };
    if (ids !== 'ALL' && ids.length === 0)
        return { rows: [], total: 0, page, pageSize };
    const countRow = await base().count({ c: 'a.id' });
    const total = Number(countRow[0]?.c ?? 0);
    const rows = await base()
        .select('a.*', 'l.name as lab_name', 'f.name as custodian_name')
        .orderBy('a.updated_at', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize);
    return { rows: rows.map(shapeAsset), total, page, pageSize };
}
export async function getAsset(actor, assetId) {
    assertLabPermission(actor, 'lab.view');
    const row = await db('lab_assets as a')
        .leftJoin('labs as l', 'l.id', 'a.lab_id')
        .leftJoin('faculty_users as f', 'f.id', 'a.custodian_faculty_id')
        .where('a.id', assetId).where('a.college_id', actor.collegeId)
        .select('a.*', 'l.name as lab_name', 'f.name as custodian_name')
        .first();
    if (!row)
        throw new AppError(404, 'Asset not found');
    const history = await db('lab_asset_history')
        .where({ college_id: actor.collegeId, asset_id: assetId })
        .orderBy('created_at', 'desc')
        .limit(100);
    return {
        ...shapeAsset(row),
        history: history.map((h) => ({
            id: Number(h.id), action: h.action, fromStatus: h.from_status, toStatus: h.to_status,
            note: h.note, actorId: h.actor_id ? Number(h.actor_id) : null, createdAt: h.created_at,
        })),
    };
}
export async function createAsset(actor, input) {
    assertLabPermission(actor, 'lab.asset.manage');
    if (input.labId)
        await assertLabAccess(actor, input.labId, 'operate');
    else if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'COLLEGE_ADMIN') {
        throw new AppError(400, 'A lab is required for this asset');
    }
    const dupe = await db('lab_assets').where({ college_id: actor.collegeId, asset_tag: input.assetTag }).first();
    if (dupe)
        throw new AppError(409, 'Asset tag already exists');
    const [id] = await db('lab_assets').insert({
        college_id: actor.collegeId,
        lab_id: input.labId ?? null,
        department_id: input.departmentId ?? null,
        asset_tag: input.assetTag,
        serial_number: input.serialNumber ?? null,
        category: input.category ?? 'EQUIPMENT',
        asset_class: input.assetClass ?? 'ASSET',
        name: input.name,
        make: input.make ?? null,
        model: input.model ?? null,
        purchase_date: input.purchaseDate ?? null,
        cost: input.cost ?? null,
        vendor: input.vendor ?? null,
        warranty_start: input.warrantyStart ?? null,
        warranty_end: input.warrantyEnd ?? null,
        amc_start: input.amcStart ?? null,
        amc_end: input.amcEnd ?? null,
        condition: input.condition ?? 'GOOD',
        custodian_faculty_id: input.custodianFacultyId ?? null,
        hostname: input.hostname ?? null,
        system_number: input.systemNumber ?? null,
        processor: input.processor ?? null,
        ram: input.ram ?? null,
        storage: input.storage ?? null,
        os: input.os ?? null,
        remarks: input.remarks ?? null,
        created_by: actor.facultyUserId,
    });
    await db('lab_asset_history').insert({
        college_id: actor.collegeId, asset_id: Number(id), action: 'CREATED',
        to_status: 'AVAILABLE', to_lab_id: input.labId ?? null, actor_id: actor.facultyUserId,
        note: 'Asset registered',
    });
    await auditFromActor(actor, 'ASSET_CREATE', 'lab_asset', Number(id), { after: input });
    return getAsset(actor, Number(id));
}
export async function updateAsset(actor, assetId, input) {
    assertLabPermission(actor, 'lab.asset.manage');
    const before = await assertAssetCollege(assetId, actor.collegeId);
    if (before.lab_id)
        await assertLabAccess(actor, Number(before.lab_id), 'operate');
    const patch = {};
    const map = {
        serialNumber: 'serial_number', category: 'category', name: 'name', make: 'make', model: 'model',
        purchaseDate: 'purchase_date', cost: 'cost', vendor: 'vendor', warrantyStart: 'warranty_start',
        warrantyEnd: 'warranty_end', amcStart: 'amc_start', amcEnd: 'amc_end', hostname: 'hostname',
        systemNumber: 'system_number', processor: 'processor', ram: 'ram', storage: 'storage', os: 'os',
        remarks: 'remarks', assetClass: 'asset_class',
    };
    for (const [k, col] of Object.entries(map))
        if (input[k] !== undefined)
            patch[col] = input[k];
    if (Object.keys(patch).length) {
        patch.updated_at = db.fn.now();
        await db('lab_assets').where({ id: assetId }).update(patch);
    }
    await auditFromActor(actor, 'ASSET_UPDATE', 'lab_asset', assetId, { before, after: patch });
    return getAsset(actor, assetId);
}
/** Explicit lifecycle: status / condition / location / custodian change with history. */
export async function changeAssetStatus(actor, assetId, input) {
    assertLabPermission(actor, 'lab.asset.manage');
    const before = await assertAssetCollege(assetId, actor.collegeId);
    if (before.lab_id)
        await assertLabAccess(actor, Number(before.lab_id), 'operate');
    if (String(before.operational_status) === 'RETIRED' && input.operationalStatus && input.operationalStatus !== 'RETIRED') {
        throw new AppError(400, 'A retired asset cannot be reactivated');
    }
    if (input.labId != null && input.labId !== Number(before.lab_id)) {
        await assertLabAccess(actor, input.labId, 'operate');
    }
    const patch = { updated_at: db.fn.now() };
    const historyRows = [];
    if (input.operationalStatus && input.operationalStatus !== before.operational_status) {
        patch.operational_status = input.operationalStatus;
        historyRows.push({ action: 'STATUS_CHANGE', from_status: before.operational_status, to_status: input.operationalStatus });
    }
    if (input.condition && input.condition !== before.condition) {
        patch.condition = input.condition;
        historyRows.push({ action: 'CONDITION_CHANGE', note: `${before.condition} → ${input.condition}` });
    }
    if (input.labId !== undefined && input.labId !== Number(before.lab_id)) {
        patch.lab_id = input.labId;
        historyRows.push({ action: 'TRANSFER', from_lab_id: before.lab_id, to_lab_id: input.labId });
    }
    if (input.custodianFacultyId !== undefined && input.custodianFacultyId !== (before.custodian_faculty_id ?? null)) {
        patch.custodian_faculty_id = input.custodianFacultyId;
        historyRows.push({ action: 'CUSTODIAN_CHANGE', from_custodian: before.custodian_faculty_id, to_custodian: input.custodianFacultyId });
    }
    await db('lab_assets').where({ id: assetId }).update(patch);
    for (const h of historyRows) {
        await db('lab_asset_history').insert({
            college_id: actor.collegeId, asset_id: assetId, actor_id: actor.facultyUserId,
            note: input.note ?? null, ...h,
        });
    }
    await recordLabAudit({
        collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'ASSET_STATUS_CHANGE',
        entityType: 'lab_asset', entityId: assetId, beforeState: before, afterState: patch, reason: input.note ?? null,
    });
    return getAsset(actor, assetId);
}
