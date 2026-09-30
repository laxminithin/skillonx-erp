import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HostelActor } from './types.js';
import { assertActiveResident, assertHostelPermission, assertWardenHostelAccess } from './access.js';
import { recordHostelAudit } from './audit.js';
import { notifyHostelEvent } from './notifications.js';

function mysqlDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'Invalid leave date');
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function listStudentLeaves(studentId: number, collegeId: number) {
  const resident = await assertActiveResident(studentId, collegeId);
  const rows = await db('hostel_leave_requests')
    .where({ resident_id: resident.id, college_id: collegeId })
    .orderBy('created_at', 'desc')
    .limit(50);
  return rows.map(serializeLeave);
}

function serializeLeave(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    leaveType: row.leave_type,
    fromAt: row.from_at,
    toAt: row.to_at,
    destination: row.destination,
    reason: row.reason,
    guardianConfirmed: !!row.guardian_confirmed,
    status: row.status,
    approvedAt: row.approved_at,
    actualDepartureAt: row.actual_departure_at,
    actualReturnAt: row.actual_return_at,
  };
}

export async function createLeave(
  studentId: number,
  collegeId: number,
  input: { leaveType?: string; fromAt: string; toAt: string; destination?: string; reason?: string; guardianConfirmed?: boolean },
) {
  const resident = await assertActiveResident(studentId, collegeId);
  const [id] = await db('hostel_leave_requests').insert({
    college_id: collegeId,
    resident_id: resident.id,
    student_id: studentId,
    leave_type: input.leaveType ?? 'HOME_VISIT',
    from_at: mysqlDateTime(input.fromAt),
    to_at: mysqlDateTime(input.toAt),
    destination: input.destination ?? null,
    reason: input.reason ?? null,
    guardian_confirmed: input.guardianConfirmed ?? false,
    status: 'SUBMITTED',
  });
  return serializeLeave((await db('hostel_leave_requests').where({ id }).first())!);
}

export async function cancelLeave(studentId: number, collegeId: number, leaveId: number) {
  const leave = await db('hostel_leave_requests')
    .where({ id: leaveId, student_id: studentId, college_id: collegeId })
    .whereIn('status', ['DRAFT', 'SUBMITTED'])
    .first();
  if (!leave) throw new AppError(404, 'Leave cannot be cancelled');
  await db('hostel_leave_requests').where({ id: leaveId }).update({ status: 'CANCELLED' });
  return { id: leaveId, status: 'CANCELLED' };
}

export async function approveLeave(actor: HostelActor, leaveId: number, action: 'APPROVE' | 'REJECT', reason?: string) {
  assertHostelPermission(actor, 'hostel.leave.approve');
  const leave = await db('hostel_leave_requests').where({ id: leaveId, college_id: actor.collegeId }).first();
  if (!leave || leave.status !== 'SUBMITTED') throw new AppError(400, 'Leave not pending approval');

  const resident = await db('hostel_residents').where({ id: leave.resident_id }).first();
  if (resident) await assertWardenHostelAccess(actor, Number(resident.hostel_id));

  if (action === 'REJECT') {
    await db('hostel_leave_requests').where({ id: leaveId }).update({
      status: 'REJECTED',
      rejection_reason: reason ?? null,
    });
  } else {
    await db('hostel_leave_requests').where({ id: leaveId }).update({
      status: 'APPROVED',
      approved_by: actor.facultyUserId,
      approved_at: db.fn.now(),
    });
    await notifyHostelEvent({
      studentId: Number(leave.student_id),
      collegeId: actor.collegeId,
      type: 'HOSTEL_LEAVE_APPROVED',
      title: 'Leave approved',
      body: 'Your hostel leave request has been approved.',
      link: '/lms/hostel/leave',
      relatedType: 'HOSTEL_LEAVE',
      relatedId: leaveId,
    });
  }

  await recordHostelAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: `LEAVE_${action}`,
    entityType: 'HOSTEL_LEAVE',
    entityId: leaveId,
    reason,
  });

  return { id: leaveId, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
}
