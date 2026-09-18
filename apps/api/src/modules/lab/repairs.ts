import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { LabActor } from './types.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
import { notifyFaculty } from './notify.js';

function shapeRepair(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    labId: Number(row.lab_id),
    labName: (row.lab_name as string) ?? null,
    assetId: row.asset_id ? Number(row.asset_id) : null,
    assetTag: (row.asset_tag as string) ?? null,
    faultId: row.fault_id ? Number(row.fault_id) : null,
    requestedAction: row.requested_action,
    priority: row.priority,
    vendor: row.vendor ?? null,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    actualCost: row.actual_cost != null ? Number(row.actual_cost) : null,
    approvalStatus: row.approval_status,
    status: row.status,
    postRepairCondition: row.post_repair_condition ?? null,
    maintenanceRef: row.maintenance_ref ?? null,
    requestedBy: row.requested_by ? Number(row.requested_by) : null,
    requesterName: (row.requester_name as string) ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
  };
}

const repairQuery = (collegeId: number) => db('lab_repairs as rp')
  .leftJoin('labs as l', 'l.id', 'rp.lab_id')
  .leftJoin('lab_assets as a', 'a.id', 'rp.asset_id')
  .leftJoin('faculty_users as f', 'f.id', 'rp.requested_by')
  .where('rp.college_id', collegeId)
  .select('rp.*', 'l.name as lab_name', 'a.asset_tag as asset_tag', 'f.name as requester_name');

export async function listRepairs(actor: LabActor, filters: { labId?: number; status?: string; approvalStatus?: string } = {}) {
  assertLabPermission(actor, 'lab.view');
  const ids = await scopedLabIds(actor);
  if (ids !== 'ALL' && ids.length === 0) return [];
  let q = repairQuery(actor.collegeId).orderBy('rp.created_at', 'desc');
  if (ids !== 'ALL') q = q.whereIn('rp.lab_id', ids);
  if (filters.labId) q = q.where('rp.lab_id', filters.labId);
  if (filters.status) q = q.where('rp.status', filters.status);
  if (filters.approvalStatus) q = q.where('rp.approval_status', filters.approvalStatus);
  return (await q).map(shapeRepair);
}

export async function createRepair(actor: LabActor, input: {
  labId: number; assetId?: number | null; faultId?: number | null; requestedAction: string;
  priority?: string; vendor?: string | null; estimatedCost?: number | null;
}) {
  assertLabPermission(actor, 'lab.repair.manage');
  await assertLabAccess(actor, input.labId, 'operate');
  if (input.assetId) {
    const asset = await db('lab_assets').where({ id: input.assetId, college_id: actor.collegeId }).first();
    if (!asset) throw new AppError(404, 'Asset not found');
  }
  if (input.faultId) {
    const fault = await db('lab_faults').where({ id: input.faultId, college_id: actor.collegeId }).first();
    if (!fault) throw new AppError(404, 'Fault not found');
  }
  const [id] = await db('lab_repairs').insert({
    college_id: actor.collegeId, lab_id: input.labId, asset_id: input.assetId ?? null,
    fault_id: input.faultId ?? null, requested_action: input.requestedAction,
    priority: input.priority ?? 'NORMAL', vendor: input.vendor ?? null,
    estimated_cost: input.estimatedCost ?? null, approval_status: 'PENDING', status: 'REQUESTED',
    requested_by: actor.facultyUserId,
  });
  await auditFromActor(actor, 'REPAIR_CREATE', 'lab_repair', Number(id), { after: input });
  // Notify Lab In-charge(s) of the lab that an approval is pending.
  const incharges = await db('lab_assignments')
    .where({ college_id: actor.collegeId, lab_id: input.labId, assignment_role: 'LAB_INCHARGE', status: 'ACTIVE' })
    .select('faculty_id');
  for (const inc of incharges) {
    await notifyFaculty({
      collegeId: actor.collegeId, facultyUserId: Number(inc.faculty_id), type: 'LAB_REPAIR_PENDING',
      title: 'Repair approval pending', body: input.requestedAction.slice(0, 180),
      relatedType: 'lab_repair', relatedId: Number(id), dedupeKey: `lab_repair_${Number(id)}`,
    });
  }
  return shapeRepair((await repairQuery(actor.collegeId).where('rp.id', Number(id)).first())!);
}

export async function updateRepair(actor: LabActor, repairId: number, input: {
  status?: string; approvalStatus?: 'APPROVED' | 'REJECTED'; actualCost?: number | null;
  postRepairCondition?: string | null; vendor?: string | null; remarks?: string | null;
}) {
  const repair = await db('lab_repairs').where({ id: repairId, college_id: actor.collegeId }).first();
  if (!repair) throw new AppError(404, 'Repair not found');
  const patch: Record<string, unknown> = { updated_at: db.fn.now() };

  if (input.approvalStatus) {
    // Approval is an oversight action (In-charge / HOD / admin).
    assertLabPermission(actor, 'lab.repair.approve');
    await assertLabAccess(actor, Number(repair.lab_id), 'oversight');
    patch.approval_status = input.approvalStatus;
    patch.approved_by = actor.facultyUserId;
    if (input.approvalStatus === 'REJECTED') patch.status = 'CANCELLED';
  }

  if (input.status || input.actualCost !== undefined || input.postRepairCondition !== undefined || input.vendor !== undefined || input.remarks !== undefined) {
    assertLabPermission(actor, 'lab.repair.manage');
    await assertLabAccess(actor, Number(repair.lab_id), 'operate');
    if (input.status) {
      if (input.status !== 'CANCELLED' && repair.approval_status !== 'APPROVED' && !patch.approval_status) {
        throw new AppError(400, 'Repair must be approved before progressing');
      }
      patch.status = input.status;
      if (input.status === 'COMPLETED') {
        patch.completed_at = db.fn.now();
        // Restore asset to available/repaired condition.
        if (repair.asset_id) {
          const toCond = input.postRepairCondition ?? 'GOOD';
          await db('lab_assets').where({ id: repair.asset_id }).update({
            operational_status: 'AVAILABLE', condition: toCond, updated_at: db.fn.now(),
          });
          await db('lab_asset_history').insert({
            college_id: actor.collegeId, asset_id: Number(repair.asset_id), action: 'STATUS_CHANGE',
            to_status: 'AVAILABLE', actor_id: actor.facultyUserId, note: `Repair completed (#${repairId})`,
          });
        }
        if (repair.fault_id) {
          await db('lab_faults').where({ id: repair.fault_id }).update({ status: 'RESOLVED', resolved_at: db.fn.now(), resolved_by: actor.facultyUserId, updated_at: db.fn.now() });
        }
      } else if (input.status === 'IN_PROGRESS' && repair.asset_id) {
        await db('lab_assets').where({ id: repair.asset_id }).update({ operational_status: 'UNDER_REPAIR', updated_at: db.fn.now() });
        await db('lab_asset_history').insert({
          college_id: actor.collegeId, asset_id: Number(repair.asset_id), action: 'STATUS_CHANGE',
          to_status: 'UNDER_REPAIR', actor_id: actor.facultyUserId, note: `Repair in progress (#${repairId})`,
        });
      }
    }
    if (input.actualCost !== undefined) patch.actual_cost = input.actualCost;
    if (input.postRepairCondition !== undefined) patch.post_repair_condition = input.postRepairCondition;
    if (input.vendor !== undefined) patch.vendor = input.vendor;
    if (input.remarks !== undefined) patch.remarks = input.remarks;
  }

  if (Object.keys(patch).length <= 1) throw new AppError(400, 'No changes supplied');
  await db('lab_repairs').where({ id: repairId }).update(patch);
  await auditFromActor(actor, 'REPAIR_UPDATE', 'lab_repair', repairId, { before: repair, after: patch });
  return shapeRepair((await repairQuery(actor.collegeId).where('rp.id', repairId).first())!);
}
