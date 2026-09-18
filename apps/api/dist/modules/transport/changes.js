import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertTransportPermission } from './access.js';
import { recordTransportAudit } from './audit.js';
import { notifyTransportEvent } from './notifications.js';
import { getTransportPolicy } from './defaults.js';
export async function createChangeRequest(studentId, collegeId, input) {
    const policy = await getTransportPolicy(collegeId);
    if (!policy.allowStopChange && ['PICKUP_STOP_CHANGE', 'DROP_STOP_CHANGE', 'TEMPORARY_STOP_CHANGE'].includes(input.changeType)) {
        throw new AppError(400, 'Stop changes are not allowed by policy');
    }
    if (!policy.allowRouteChange && input.changeType === 'ROUTE_CHANGE') {
        throw new AppError(400, 'Route changes are not allowed by policy');
    }
    const member = await db('transport_members')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
        .first();
    if (!member)
        throw new AppError(403, 'Active transport membership required');
    const assignment = await db('student_transport_assignments')
        .where({ transport_member_id: member.id, status: 'ACTIVE' })
        .first();
    const [id] = await db('transport_change_requests').insert({
        college_id: collegeId,
        transport_member_id: member.id,
        student_id: studentId,
        old_assignment_id: assignment?.id ?? null,
        change_type: input.changeType,
        requested_route_id: input.requestedRouteId ?? null,
        requested_pickup_stop_id: input.requestedPickupStopId ?? null,
        requested_drop_stop_id: input.requestedDropStopId ?? null,
        requested_service_type: input.requestedServiceType ?? null,
        effective_date: input.effectiveDate ?? null,
        reason: input.reason,
        status: policy.changeApprovalRequired ? 'REQUESTED' : 'APPROVED',
    });
    if (!policy.changeApprovalRequired) {
        await completeChangeRequest({ collegeId, changeId: id, actorId: null });
    }
    return { id, status: policy.changeApprovalRequired ? 'REQUESTED' : 'COMPLETED' };
}
export async function approveChangeRequest(actor, changeId) {
    assertTransportPermission(actor, 'transport.change.approve');
    const change = await db('transport_change_requests')
        .where({ id: changeId, college_id: actor.collegeId })
        .first();
    if (!change)
        throw new AppError(404, 'Change request not found');
    if (!['REQUESTED', 'UNDER_REVIEW'].includes(change.status)) {
        throw new AppError(400, 'Change request is not pending');
    }
    await db('transport_change_requests').where({ id: changeId }).update({
        status: 'APPROVED',
        reviewed_by: actor.facultyUserId,
        reviewed_at: db.fn.now(),
    });
    return completeChangeRequest({ collegeId: actor.collegeId, changeId, actorId: actor.facultyUserId });
}
async function completeChangeRequest(input) {
    const change = await db('transport_change_requests').where({ id: input.changeId }).first();
    if (!change)
        throw new AppError(404, 'Change request not found');
    return db.transaction(async (trx) => {
        const oldAssignment = change.old_assignment_id
            ? await trx('student_transport_assignments').where({ id: change.old_assignment_id }).first()
            : await trx('student_transport_assignments')
                .where({ transport_member_id: change.transport_member_id, status: 'ACTIVE' })
                .first();
        if (oldAssignment && change.change_type !== 'TEMPORARY_STOP_CHANGE') {
            await trx('student_transport_assignments').where({ id: oldAssignment.id }).update({
                status: 'CHANGED',
                end_at: trx.fn.now(),
            });
        }
        const routeId = change.requested_route_id ?? oldAssignment?.route_id;
        const pickupId = change.requested_pickup_stop_id ?? oldAssignment?.pickup_stop_id;
        const dropId = change.requested_drop_stop_id ?? oldAssignment?.drop_stop_id;
        const serviceType = change.requested_service_type ?? oldAssignment?.service_type ?? 'TWO_WAY';
        let newAssignmentId = oldAssignment?.id;
        if (change.change_type !== 'TEMPORARY_STOP_CHANGE') {
            const [aid] = await trx('student_transport_assignments').insert({
                college_id: input.collegeId,
                transport_member_id: change.transport_member_id,
                student_id: change.student_id,
                route_id: routeId,
                pickup_stop_id: pickupId,
                drop_stop_id: dropId,
                service_type: serviceType,
                start_at: change.effective_date ?? trx.fn.now(),
                status: 'ACTIVE',
                assigned_by: input.actorId,
                reason: change.reason,
            });
            newAssignmentId = aid;
        }
        await trx('transport_change_requests').where({ id: input.changeId }).update({
            status: 'COMPLETED',
            new_assignment_id: newAssignmentId ?? null,
        });
        await recordTransportAudit({
            collegeId: input.collegeId,
            actorId: input.actorId,
            action: 'ROUTE_CHANGE_COMPLETED',
            entityType: 'TRANSPORT_CHANGE_REQUEST',
            entityId: input.changeId,
            afterState: { newAssignmentId },
        });
        await notifyTransportEvent({
            studentId: Number(change.student_id),
            collegeId: input.collegeId,
            type: 'TRANSPORT_ROUTE_CHANGED',
            title: 'Transport assignment updated',
            body: 'Your transport route or stop has been updated.',
            relatedType: 'TRANSPORT_CHANGE',
            relatedId: input.changeId,
        });
        return { changeId: input.changeId, status: 'COMPLETED', newAssignmentId };
    });
}
export async function listStudentChanges(studentId, collegeId) {
    const rows = await db('transport_change_requests')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('created_at', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        changeType: r.change_type,
        status: r.status,
        reason: r.reason,
        effectiveDate: r.effective_date,
        createdAt: r.created_at,
    }));
}
export async function requestCancellation(studentId, collegeId, reason, effectiveDate) {
    const member = await db('transport_members')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
        .first();
    if (!member)
        throw new AppError(403, 'Active transport membership required');
    const existing = await db('transport_cancellation_requests')
        .where({ transport_member_id: member.id })
        .whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])
        .first();
    if (existing)
        throw new AppError(400, 'Cancellation request already pending');
    const [id] = await db('transport_cancellation_requests').insert({
        college_id: collegeId,
        transport_member_id: member.id,
        student_id: studentId,
        reason,
        requested_effective_date: effectiveDate ?? null,
        status: 'REQUESTED',
    });
    await db('transport_members').where({ id: member.id }).update({ status: 'CANCELLATION_PENDING' });
    return { id, status: 'REQUESTED' };
}
export async function completeCancellation(actor, requestId) {
    assertTransportPermission(actor, 'transport.member.manage');
    return db.transaction(async (trx) => {
        const req = await trx('transport_cancellation_requests')
            .where({ id: requestId, college_id: actor.collegeId })
            .forUpdate()
            .first();
        if (!req)
            throw new AppError(404, 'Cancellation request not found');
        if (req.status === 'COMPLETED')
            return { id: requestId, status: 'COMPLETED' };
        if (!['REQUESTED', 'UNDER_REVIEW'].includes(req.status)) {
            throw new AppError(400, 'Cancellation request is not pending');
        }
        await trx('transport_members').where({ id: req.transport_member_id }).forUpdate().first();
        await trx('student_transport_assignments')
            .where({ transport_member_id: req.transport_member_id, status: 'ACTIVE' })
            .update({ status: 'CANCELLED', end_at: trx.fn.now() });
        await trx('transport_passes')
            .where({ transport_member_id: req.transport_member_id, status: 'ACTIVE' })
            .update({ status: 'REVOKED', revoked_at: trx.fn.now() });
        await trx('transport_members').where({ id: req.transport_member_id }).update({
            status: 'CANCELLED',
            deactivated_at: trx.fn.now(),
        });
        await trx('transport_cancellation_requests').where({ id: requestId }).update({
            status: 'COMPLETED',
            reviewed_by: actor.facultyUserId,
            approved_effective_date: trx.fn.now(),
        });
        await recordTransportAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'TRANSPORT_CANCELLED',
            entityType: 'TRANSPORT_CANCELLATION',
            entityId: requestId,
        });
        await notifyTransportEvent({
            studentId: Number(req.student_id),
            collegeId: actor.collegeId,
            type: 'TRANSPORT_CANCELLED',
            title: 'Transport cancelled',
            body: 'Your transport membership has been cancelled.',
            relatedType: 'TRANSPORT_CANCELLATION',
            relatedId: requestId,
        });
        return { id: requestId, status: 'COMPLETED' };
    });
}
