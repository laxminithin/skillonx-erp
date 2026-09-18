import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
function shapeFault(row) {
    return {
        id: Number(row.id),
        labId: Number(row.lab_id),
        labName: row.lab_name ?? null,
        assetId: row.asset_id ? Number(row.asset_id) : null,
        assetTag: row.asset_tag ?? null,
        reportedBy: row.reported_by ? Number(row.reported_by) : null,
        reporterName: row.reporter_name ?? null,
        faultCategory: row.fault_category,
        description: row.description,
        severity: row.severity,
        impact: row.impact ?? null,
        status: row.status,
        maintenanceRef: row.maintenance_ref ?? null,
        resolvedAt: row.resolved_at ?? null,
        createdAt: row.created_at,
    };
}
const faultQuery = (collegeId) => db('lab_faults as ft')
    .leftJoin('labs as l', 'l.id', 'ft.lab_id')
    .leftJoin('lab_assets as a', 'a.id', 'ft.asset_id')
    .leftJoin('faculty_users as f', 'f.id', 'ft.reported_by')
    .where('ft.college_id', collegeId)
    .select('ft.*', 'l.name as lab_name', 'a.asset_tag as asset_tag', 'f.name as reporter_name');
export async function listFaults(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let q = faultQuery(actor.collegeId).orderBy('ft.created_at', 'desc');
    if (ids !== 'ALL')
        q = q.whereIn('ft.lab_id', ids);
    if (filters.labId)
        q = q.where('ft.lab_id', filters.labId);
    if (filters.status)
        q = q.where('ft.status', filters.status);
    if (filters.severity)
        q = q.where('ft.severity', filters.severity);
    if (filters.assetId)
        q = q.where('ft.asset_id', filters.assetId);
    return (await q).map(shapeFault);
}
export async function createFault(actor, input) {
    assertLabPermission(actor, 'lab.fault.manage');
    await assertLabAccess(actor, input.labId, 'operate');
    if (input.assetId) {
        const asset = await db('lab_assets').where({ id: input.assetId, college_id: actor.collegeId }).first();
        if (!asset)
            throw new AppError(404, 'Asset not found');
    }
    const [id] = await db('lab_faults').insert({
        college_id: actor.collegeId, lab_id: input.labId, asset_id: input.assetId ?? null,
        reported_by: actor.facultyUserId, fault_category: input.faultCategory ?? 'GENERAL',
        description: input.description, severity: input.severity ?? 'MEDIUM', impact: input.impact ?? null,
        status: 'OPEN',
    });
    // Mark the affected asset FAULTY (with history) when linked.
    if (input.assetId) {
        const asset = await db('lab_assets').where({ id: input.assetId }).first();
        if (asset && !['RETIRED', 'LOST'].includes(String(asset.operational_status))) {
            await db('lab_assets').where({ id: input.assetId }).update({ operational_status: 'FAULTY', updated_at: db.fn.now() });
            await db('lab_asset_history').insert({
                college_id: actor.collegeId, asset_id: input.assetId, action: 'STATUS_CHANGE',
                from_status: asset.operational_status, to_status: 'FAULTY', actor_id: actor.facultyUserId,
                note: `Fault reported (#${Number(id)})`,
            });
        }
    }
    await auditFromActor(actor, 'FAULT_CREATE', 'lab_fault', Number(id), { after: input });
    return shapeFault((await faultQuery(actor.collegeId).where('ft.id', Number(id)).first()));
}
export async function updateFaultStatus(actor, faultId, input) {
    assertLabPermission(actor, 'lab.fault.manage');
    const fault = await db('lab_faults').where({ id: faultId, college_id: actor.collegeId }).first();
    if (!fault)
        throw new AppError(404, 'Fault not found');
    await assertLabAccess(actor, Number(fault.lab_id), 'operate');
    const patch = { status: input.status, updated_at: db.fn.now() };
    if (['RESOLVED', 'CLOSED'].includes(input.status)) {
        patch.resolved_at = db.fn.now();
        patch.resolved_by = actor.facultyUserId;
    }
    await db('lab_faults').where({ id: faultId }).update(patch);
    await auditFromActor(actor, 'FAULT_STATUS', 'lab_fault', faultId, { before: fault, after: patch, reason: input.note ?? null });
    return shapeFault((await faultQuery(actor.collegeId).where('ft.id', faultId).first()));
}
