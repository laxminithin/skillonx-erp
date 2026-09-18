import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
function today() { return new Date().toISOString().slice(0, 10); }
function shape(row) {
    const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
    return {
        id: Number(row.id), labId: Number(row.lab_id), labName: row.lab_name ?? null,
        assetId: row.asset_id ? Number(row.asset_id) : null, assetTag: row.asset_tag ?? null,
        maintenanceType: row.maintenance_type, dueDate: due, completedDate: row.completed_date ?? null,
        result: row.result ?? null, status: row.status,
        overdue: row.status === 'SCHEDULED' && due != null && due < today(),
    };
}
const q = (collegeId) => db('lab_maintenance_schedules as m')
    .leftJoin('labs as l', 'l.id', 'm.lab_id')
    .leftJoin('lab_assets as a', 'a.id', 'm.asset_id')
    .where('m.college_id', collegeId)
    .select('m.*', 'l.name as lab_name', 'a.asset_tag as asset_tag');
export async function listMaintenance(actor, filters = {}) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    let query = q(actor.collegeId).orderBy('m.due_date', 'asc');
    if (ids !== 'ALL')
        query = query.whereIn('m.lab_id', ids);
    if (filters.labId)
        query = query.where('m.lab_id', filters.labId);
    if (filters.status)
        query = query.where('m.status', filters.status);
    return (await query).map(shape);
}
export async function createMaintenance(actor, input) {
    assertLabPermission(actor, 'lab.asset.manage');
    await assertLabAccess(actor, input.labId, 'operate');
    const [id] = await db('lab_maintenance_schedules').insert({
        college_id: actor.collegeId, lab_id: input.labId, asset_id: input.assetId ?? null,
        maintenance_type: input.maintenanceType, due_date: input.dueDate, status: 'SCHEDULED',
    });
    await auditFromActor(actor, 'MAINTENANCE_CREATE', 'lab_maintenance', Number(id), { after: input });
    return shape((await q(actor.collegeId).where('m.id', Number(id)).first()));
}
export async function completeMaintenance(actor, id, input) {
    assertLabPermission(actor, 'lab.asset.manage');
    const row = await db('lab_maintenance_schedules').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Maintenance schedule not found');
    await assertLabAccess(actor, Number(row.lab_id), 'operate');
    await db('lab_maintenance_schedules').where({ id }).update({
        status: 'DONE', completed_date: today(), performed_by: actor.facultyUserId, result: input.result ?? null, updated_at: db.fn.now(),
    });
    await auditFromActor(actor, 'MAINTENANCE_COMPLETE', 'lab_maintenance', id, { before: row, after: input });
    return shape((await q(actor.collegeId).where('m.id', id).first()));
}
