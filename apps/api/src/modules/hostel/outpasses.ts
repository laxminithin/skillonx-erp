import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HostelActor } from './types.js';
import { assertActiveResident, assertHostelPermission, assertWardenHostelAccess } from './access.js';
import { recordHostelAudit } from './audit.js';
import { nextOutpassNumber, generateOutpassToken } from './numbers.js';
import { getHostelPolicy } from './defaults.js';
import { notifyHostelEvent } from './notifications.js';

export async function listStudentOutpasses(studentId: number, collegeId: number) {
  const resident = await assertActiveResident(studentId, collegeId);
  const rows = await db('hostel_outpasses')
    .where({ resident_id: resident.id, college_id: collegeId })
    .orderBy('created_at', 'desc')
    .limit(50);
  return rows.map(serializeOutpass);
}

function serializeOutpass(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    outpassNumber: row.outpass_number,
    purpose: row.purpose,
    destination: row.destination,
    expectedExitAt: row.expected_exit_at,
    expectedReturnAt: row.expected_return_at,
    status: row.status,
    approvedAt: row.approved_at,
    actualExitAt: row.actual_exit_at,
    actualReturnAt: row.actual_return_at,
    lateReturnMinutes: row.late_return_minutes != null ? Number(row.late_return_minutes) : null,
    qrToken: ['APPROVED', 'ACTIVE', 'RETURNED', 'OVERDUE'].includes(String(row.status)) ? row.qr_token : undefined,
  };
}

export async function createOutpass(
  studentId: number,
  collegeId: number,
  input: { purpose: string; destination?: string; expectedExitAt: string; expectedReturnAt: string },
) {
  const policy = await getHostelPolicy(collegeId);
  if (!policy.allowOutpass) throw new AppError(400, 'Outpass not allowed by hostel policy');

  const resident = await assertActiveResident(studentId, collegeId);

  return db.transaction(async (trx) => {
    const outpassNumber = await nextOutpassNumber(trx, collegeId);
    const qrToken = generateOutpassToken();
    const [id] = await trx('hostel_outpasses').insert({
      college_id: collegeId,
      resident_id: resident.id,
      student_id: studentId,
      outpass_number: outpassNumber,
      qr_token: qrToken,
      purpose: input.purpose,
      destination: input.destination ?? null,
      expected_exit_at: input.expectedExitAt,
      expected_return_at: input.expectedReturnAt,
      status: policy.outpassApprovalMode === 'NO_APPROVAL' ? 'APPROVED' : 'REQUESTED',
      approved_at: policy.outpassApprovalMode === 'NO_APPROVAL' ? trx.fn.now() : null,
    });
    return serializeOutpass((await trx('hostel_outpasses').where({ id }).first())!);
  });
}

export async function cancelOutpass(studentId: number, collegeId: number, outpassId: number) {
  const outpass = await db('hostel_outpasses')
    .where({ id: outpassId, student_id: studentId, college_id: collegeId })
    .whereIn('status', ['REQUESTED', 'APPROVED'])
    .first();
  if (!outpass) throw new AppError(404, 'Outpass cannot be cancelled');
  await db('hostel_outpasses').where({ id: outpassId }).update({ status: 'CANCELLED' });
  return { id: outpassId, status: 'CANCELLED' };
}

export async function approveOutpass(actor: HostelActor, outpassId: number, action: 'APPROVE' | 'REJECT', reason?: string) {
  assertHostelPermission(actor, 'hostel.outpass.approve');
  const outpass = await db('hostel_outpasses').where({ id: outpassId, college_id: actor.collegeId }).first();
  if (!outpass || outpass.status !== 'REQUESTED') throw new AppError(400, 'Outpass not pending approval');

  const resident = await db('hostel_residents').where({ id: outpass.resident_id }).first();
  if (resident) await assertWardenHostelAccess(actor, Number(resident.hostel_id));

  if (action === 'REJECT') {
    await db('hostel_outpasses').where({ id: outpassId }).update({
      status: 'REJECTED',
      rejection_reason: reason ?? null,
    });
    await notifyHostelEvent({
      studentId: Number(outpass.student_id),
      collegeId: actor.collegeId,
      type: 'HOSTEL_OUTPASS_REJECTED',
      title: 'Outpass rejected',
      body: reason ?? 'Your outpass request was rejected.',
      relatedType: 'HOSTEL_OUTPASS',
      relatedId: outpassId,
    });
  } else {
    await db('hostel_outpasses').where({ id: outpassId }).update({
      status: 'APPROVED',
      approved_by: actor.facultyUserId,
      approved_at: db.fn.now(),
    });
    await notifyHostelEvent({
      studentId: Number(outpass.student_id),
      collegeId: actor.collegeId,
      type: 'HOSTEL_OUTPASS_APPROVED',
      title: 'Outpass approved',
      body: `Your outpass ${outpass.outpass_number} has been approved.`,
      link: '/lms/hostel/outpass',
      relatedType: 'HOSTEL_OUTPASS',
      relatedId: outpassId,
    });
  }

  await recordHostelAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: `OUTPASS_${action}`,
    entityType: 'HOSTEL_OUTPASS',
    entityId: outpassId,
    reason,
  });

  return { id: outpassId, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
}

export async function verifyOutpassToken(collegeId: number, token: string) {
  const outpass = await db('hostel_outpasses as o')
    .join('students as s', 's.id', 'o.student_id')
    .join('hostel_residents as r', 'r.id', 'o.resident_id')
    .join('hostels as h', 'h.id', 'r.hostel_id')
    .leftJoin('hostel_bed_allocations as a', function join() {
      this.on('a.resident_id', '=', 'r.id').andOn('a.status', '=', db.raw('?', ['ACTIVE']));
    })
    .leftJoin('hostel_rooms as rm', 'rm.id', 'a.room_id')
    .where({ 'o.college_id': collegeId, 'o.qr_token': token })
    .select('o.*', 's.name as student_name', 's.usn', 'h.name as hostel_name', 'rm.room_number')
    .first();

  if (!outpass) throw new AppError(404, 'Invalid outpass token');
  return {
    id: Number(outpass.id),
    outpassNumber: outpass.outpass_number,
    studentName: outpass.student_name,
    usn: outpass.usn,
    hostelName: outpass.hostel_name,
    roomNumber: outpass.room_number,
    purpose: outpass.purpose,
    destination: outpass.destination,
    expectedExitAt: outpass.expected_exit_at,
    expectedReturnAt: outpass.expected_return_at,
    status: outpass.status,
    actualExitAt: outpass.actual_exit_at,
    actualReturnAt: outpass.actual_return_at,
  };
}
