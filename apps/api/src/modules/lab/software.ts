import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { LabActor } from './types.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';

function shapeSoftware(row: Record<string, unknown>) {
  return {
    id: Number(row.id), labId: Number(row.lab_id), labName: (row.lab_name as string) ?? null,
    name: row.name, version: row.version ?? null, licenseType: row.license_type,
    licenseCount: row.license_count != null ? Number(row.license_count) : null,
    expiryDate: row.expiry_date ?? null, installationStatus: row.installation_status,
    vendorRef: row.vendor_ref ?? null, remarks: row.remarks ?? null,
  };
}

export async function listSoftware(actor: LabActor, filters: { labId?: number; q?: string } = {}) {
  assertLabPermission(actor, 'lab.view');
  const ids = await scopedLabIds(actor);
  if (ids !== 'ALL' && ids.length === 0) return [];
  let q = db('lab_software as sw').leftJoin('labs as l', 'l.id', 'sw.lab_id')
    .where('sw.college_id', actor.collegeId).select('sw.*', 'l.name as lab_name').orderBy('sw.name');
  if (ids !== 'ALL') q = q.whereIn('sw.lab_id', ids);
  if (filters.labId) q = q.where('sw.lab_id', filters.labId);
  if (filters.q) q = q.whereILike('sw.name', `%${filters.q}%`);
  return (await q).map(shapeSoftware);
}

export async function createSoftware(actor: LabActor, input: Record<string, any>) {
  assertLabPermission(actor, 'lab.software.manage');
  await assertLabAccess(actor, input.labId, 'operate');
  const [id] = await db('lab_software').insert({
    college_id: actor.collegeId, lab_id: input.labId, name: input.name, version: input.version ?? null,
    license_type: input.licenseType ?? 'FREE', license_count: input.licenseCount ?? null,
    expiry_date: input.expiryDate ?? null, installation_status: input.installationStatus ?? 'INSTALLED',
    vendor_ref: input.vendorRef ?? null, remarks: input.remarks ?? null, created_by: actor.facultyUserId,
  });
  await auditFromActor(actor, 'SOFTWARE_CREATE', 'lab_software', Number(id), { after: input });
  return shapeSoftware((await db('lab_software as sw').leftJoin('labs as l', 'l.id', 'sw.lab_id').where('sw.id', Number(id)).select('sw.*', 'l.name as lab_name').first())!);
}

export async function updateSoftware(actor: LabActor, id: number, input: Record<string, any>) {
  assertLabPermission(actor, 'lab.software.manage');
  const before = await db('lab_software').where({ id, college_id: actor.collegeId }).first();
  if (!before) throw new AppError(404, 'Software not found');
  await assertLabAccess(actor, Number(before.lab_id), 'operate');
  const map: Record<string, string> = { name: 'name', version: 'version', licenseType: 'license_type', licenseCount: 'license_count', expiryDate: 'expiry_date', installationStatus: 'installation_status', vendorRef: 'vendor_ref', remarks: 'remarks' };
  const patch: Record<string, unknown> = {};
  for (const [k, col] of Object.entries(map)) if (input[k] !== undefined) patch[col] = input[k];
  if (Object.keys(patch).length) { patch.updated_at = db.fn.now(); await db('lab_software').where({ id }).update(patch); }
  await auditFromActor(actor, 'SOFTWARE_UPDATE', 'lab_software', id, { before, after: patch });
  return shapeSoftware((await db('lab_software as sw').leftJoin('labs as l', 'l.id', 'sw.lab_id').where('sw.id', id).select('sw.*', 'l.name as lab_name').first())!);
}

// ── Software installation requests ───────────────────────────────────────
function shapeReq(row: Record<string, unknown>) {
  return {
    id: Number(row.id), labId: Number(row.lab_id), labName: (row.lab_name as string) ?? null,
    softwareName: row.software_name, version: row.version ?? null, courseId: row.course_id ? Number(row.course_id) : null,
    reason: row.reason ?? null, neededBy: row.needed_by ?? null, status: row.status,
    requestedBy: row.requested_by ? Number(row.requested_by) : null, requesterName: (row.requester_name as string) ?? null,
    resolution: row.resolution ?? null, createdAt: row.created_at,
  };
}

export async function listSoftwareRequests(actor: LabActor, filters: { labId?: number; status?: string } = {}) {
  assertLabPermission(actor, 'lab.view');
  const ids = await scopedLabIds(actor);
  if (ids !== 'ALL' && ids.length === 0) return [];
  let q = db('lab_software_requests as r').leftJoin('labs as l', 'l.id', 'r.lab_id')
    .leftJoin('faculty_users as f', 'f.id', 'r.requested_by')
    .where('r.college_id', actor.collegeId).select('r.*', 'l.name as lab_name', 'f.name as requester_name')
    .orderBy('r.created_at', 'desc');
  if (ids !== 'ALL') q = q.whereIn('r.lab_id', ids);
  if (filters.labId) q = q.where('r.lab_id', filters.labId);
  if (filters.status) q = q.where('r.status', filters.status);
  return (await q).map(shapeReq);
}

export async function createSoftwareRequest(actor: LabActor, input: {
  labId: number; softwareName: string; version?: string | null; courseId?: number | null; reason?: string | null; neededBy?: string | null;
}) {
  assertLabPermission(actor, 'lab.software.request');
  // Requester must be the lab's assistant / in-charge (or admin).
  await assertLabAccess(actor, input.labId, 'operate');
  const [id] = await db('lab_software_requests').insert({
    college_id: actor.collegeId, lab_id: input.labId, software_name: input.softwareName,
    version: input.version ?? null, course_id: input.courseId ?? null, reason: input.reason ?? null,
    needed_by: input.neededBy ?? null, status: 'REQUESTED', requested_by: actor.facultyUserId,
  });
  await auditFromActor(actor, 'SOFTWARE_REQUEST_CREATE', 'lab_software_request', Number(id), { after: input });
  return shapeReq((await db('lab_software_requests as r').leftJoin('labs as l', 'l.id', 'r.lab_id').leftJoin('faculty_users as f', 'f.id', 'r.requested_by').where('r.id', Number(id)).select('r.*', 'l.name as lab_name', 'f.name as requester_name').first())!);
}

export async function reviewSoftwareRequest(actor: LabActor, id: number, input: { status: string; resolution?: string | null }) {
  assertLabPermission(actor, 'lab.software.manage');
  const before = await db('lab_software_requests').where({ id, college_id: actor.collegeId }).first();
  if (!before) throw new AppError(404, 'Request not found');
  await assertLabAccess(actor, Number(before.lab_id), 'operate');
  await db('lab_software_requests').where({ id }).update({
    status: input.status, resolution: input.resolution ?? null, reviewed_by: actor.facultyUserId, updated_at: db.fn.now(),
  });
  await auditFromActor(actor, 'SOFTWARE_REQUEST_REVIEW', 'lab_software_request', id, { before, after: input });
  return shapeReq((await db('lab_software_requests as r').leftJoin('labs as l', 'l.id', 'r.lab_id').leftJoin('faculty_users as f', 'f.id', 'r.requested_by').where('r.id', id).select('r.*', 'l.name as lab_name', 'f.name as requester_name').first())!);
}
