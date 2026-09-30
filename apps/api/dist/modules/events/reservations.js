import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { notifyFaculty } from '../maintenance/notify.js';
import { assertEventsPermission, hasEventsPermission } from './access.js';
import { recordEventsAudit } from './audit.js';
import { BOOKING_TRX, confirmReservationsInTrx, evaluateAvailability, getResource, isDupError, lockResources, shapeReservation, throwIfBlocked, windowFor, withDeadlockRetry, } from './booking.js';
import { assertValidRange, normalizeWall, nowWall } from './time.js';
import { MAX_EVENT_DAYS } from './types.js';
function n(v) {
    return Number(v ?? 0);
}
async function collegeNow(collegeId) {
    const row = await db('colleges').where({ id: collegeId }).select('timezone').first();
    return nowWall(row?.timezone && String(row.timezone).trim() ? String(row.timezone).trim() : 'Asia/Kolkata');
}
async function shape(collegeId, row, actor) {
    const resource = await getResource(db, collegeId, n(row.resource_id)).catch(() => null);
    const visible = n(row.requested_by) === actor.facultyUserId || hasEventsPermission(actor, 'events.reservation.decide');
    return shapeReservation(row, resource, { includePurpose: visible });
}
async function findByKey(collegeId, key) {
    return db('campus_resource_reservations').where({ college_id: collegeId, idempotency_key: key }).first();
}
/**
 * Ad-hoc (non-event) reservation, e.g. a conference room for a meeting.
 * Retrying with the same idempotency key returns the original reservation,
 * sequentially or concurrently. Resources that require approval stay
 * REQUESTED (non-blocking) until a resource manager confirms.
 */
export async function createReservation(actor, input) {
    assertEventsPermission(actor, 'events.reservation.request');
    const key = input.idempotencyKey ?? null;
    if (key) {
        const prior = await findByKey(actor.collegeId, key);
        if (prior) {
            if (n(prior.requested_by) !== actor.facultyUserId)
                throw new AppError(409, 'Idempotency key already used');
            return { ...(await shape(actor.collegeId, prior, actor)), idempotentReplay: true };
        }
    }
    const startsAt = normalizeWall(input.startsAt);
    const endsAt = normalizeWall(input.endsAt);
    assertValidRange(startsAt, endsAt, MAX_EVENT_DAYS);
    if (startsAt <= (await collegeNow(actor.collegeId)))
        throw new AppError(400, 'A reservation must start in the future');
    let result;
    try {
        result = await withDeadlockRetry(() => db.transaction(async (trx) => {
            const [resource] = await lockResources(trx, actor.collegeId, [input.resourceId]);
            if (key) {
                const prior = await trx('campus_resource_reservations').where({ college_id: actor.collegeId, idempotency_key: key }).first();
                if (prior)
                    return { id: n(prior.id), replay: true };
            }
            const w = windowFor(resource, startsAt, endsAt);
            throwIfBlocked(await evaluateAvailability(trx, actor.collegeId, [resource], new Map([[resource.id, w]])));
            const autoConfirm = !resource.requiresApproval;
            const [id] = await trx('campus_resource_reservations').insert({
                college_id: actor.collegeId,
                resource_id: resource.id,
                event_id: null,
                purpose: input.purpose,
                starts_at: startsAt,
                ends_at: endsAt,
                block_starts_at: w.blockStart,
                block_ends_at: w.blockEnd,
                status: autoConfirm ? 'CONFIRMED' : 'REQUESTED',
                idempotency_key: key,
                requested_by: actor.facultyUserId,
                decided_by: autoConfirm ? actor.facultyUserId : null,
                decided_at: autoConfirm ? trx.fn.now() : null,
            });
            await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: autoConfirm ? 'RESERVATION_CONFIRMED' : 'RESERVATION_REQUESTED', entityType: 'campus_resource_reservation', entityId: n(id), after: { resourceId: resource.id, startsAt, endsAt, purpose: input.purpose } }, trx);
            return { id: n(id), replay: false };
        }, BOOKING_TRX));
    }
    catch (err) {
        if (!(key && isDupError(err)))
            throw err;
        const prior = await findByKey(actor.collegeId, key);
        if (!prior)
            throw err;
        result = { id: n(prior.id), replay: true };
    }
    const row = await db('campus_resource_reservations').where({ id: result.id }).first();
    return { ...(await shape(actor.collegeId, row, actor)), idempotentReplay: result.replay };
}
export async function listMyReservations(actor) {
    assertEventsPermission(actor, 'events.reservation.request');
    const rows = await db('campus_resource_reservations').where({ college_id: actor.collegeId, requested_by: actor.facultyUserId }).whereNull('event_id')
        .orderBy('starts_at', 'desc').limit(200);
    return Promise.all(rows.map((r) => shape(actor.collegeId, r, actor)));
}
export async function reservationQueue(actor) {
    assertEventsPermission(actor, 'events.reservation.decide');
    const rows = await db('campus_resource_reservations as rr')
        .leftJoin('faculty_users as f', 'f.id', 'rr.requested_by')
        .where({ 'rr.college_id': actor.collegeId, 'rr.status': 'REQUESTED' })
        .whereNull('rr.event_id')
        .select('rr.*', 'f.name as requester_name')
        .orderBy('rr.starts_at').limit(200);
    return Promise.all(rows.map(async (r) => ({ ...(await shape(actor.collegeId, r, actor)), requesterName: r.requester_name ?? null })));
}
export async function decideReservation(actor, reservationId, input) {
    assertEventsPermission(actor, 'events.reservation.decide');
    const outcome = await withDeadlockRetry(() => db.transaction(async (trx) => {
        const row = await trx('campus_resource_reservations').where({ id: reservationId, college_id: actor.collegeId }).forUpdate().first();
        if (!row)
            throw new AppError(404, 'Reservation not found');
        if (row.event_id != null)
            throw new AppError(400, 'Event reservations are decided through the event approval workflow');
        if (n(row.requested_by) === actor.facultyUserId)
            throw new AppError(403, 'You cannot decide your own reservation request (self-approval is not allowed)');
        const target = input.action === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED';
        if (row.status === target)
            return { row, changed: false };
        if (row.status !== 'REQUESTED')
            throw new AppError(400, `Cannot ${input.action.toLowerCase()} a reservation in status ${row.status}`);
        if (input.action === 'CONFIRM') {
            await confirmReservationsInTrx(trx, actor.collegeId, [row], { actorId: actor.facultyUserId });
        }
        else {
            await trx('campus_resource_reservations').where({ id: reservationId }).update({ status: 'REJECTED', decided_by: actor.facultyUserId, decided_at: trx.fn.now(), updated_at: trx.fn.now() });
        }
        await trx('campus_resource_reservations').where({ id: reservationId }).update({ decision_remarks: input.remarks ?? null });
        await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: `RESERVATION_${target}`, entityType: 'campus_resource_reservation', entityId: reservationId, before: { status: row.status }, after: { status: target }, reason: input.remarks ?? null }, trx);
        return { row, changed: true };
    }, BOOKING_TRX));
    if (outcome.changed) {
        await notifyFaculty({
            collegeId: actor.collegeId,
            facultyUserId: n(outcome.row.requested_by),
            type: `RESERVATION_${input.action}`,
            title: input.action === 'CONFIRM' ? 'Reservation confirmed' : 'Reservation rejected',
            body: input.remarks ?? null,
            link: '/events/bookings',
            relatedType: 'campus_resource_reservation',
            relatedId: reservationId,
            dedupeKey: `RESERVATION_${input.action}:${reservationId}`,
        });
    }
    const row = await db('campus_resource_reservations').where({ id: reservationId }).first();
    return shape(actor.collegeId, row, actor);
}
export async function cancelReservation(actor, reservationId) {
    assertEventsPermission(actor, 'events.reservation.request');
    await db.transaction(async (trx) => {
        const row = await trx('campus_resource_reservations').where({ id: reservationId, college_id: actor.collegeId }).forUpdate().first();
        const mine = row != null && n(row.requested_by) === actor.facultyUserId;
        if (!row || (!mine && !isAdminRole(actor.role) && !hasEventsPermission(actor, 'events.reservation.decide')))
            throw new AppError(404, 'Reservation not found');
        if (row.event_id != null)
            throw new AppError(400, 'Event reservations are released through the event');
        if (row.status === 'CANCELLED')
            return;
        if (!['REQUESTED', 'CONFIRMED'].includes(String(row.status)))
            throw new AppError(400, `Cannot cancel a reservation in status ${row.status}`);
        await trx('campus_resource_reservations').where({ id: reservationId }).update({ status: 'CANCELLED', cancelled_at: trx.fn.now(), cancelled_by: actor.facultyUserId, updated_at: trx.fn.now() });
        await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'RESERVATION_CANCELLED', entityType: 'campus_resource_reservation', entityId: reservationId, before: { status: row.status }, after: { status: 'CANCELLED' } }, trx);
    });
    const row = await db('campus_resource_reservations').where({ id: reservationId }).first();
    return shape(actor.collegeId, row, actor);
}
