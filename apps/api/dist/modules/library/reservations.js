import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { addDaysPreservingWallClock } from '../../utils/timezone.js';
import { collegeTimezone } from '../timetable/time.js';
import { resolvePolicyForMember } from './policies.js';
import { notifyReservationReady } from './notifications.js';
function serializeReservation(row, title) {
    return {
        id: Number(row.id),
        memberId: Number(row.member_id),
        catalogItemId: Number(row.catalog_item_id),
        copyId: row.copy_id != null ? Number(row.copy_id) : null,
        status: row.status,
        queuePosition: Number(row.queue_position),
        requestedAt: row.requested_at,
        expiresAt: row.expires_at,
        fulfilledAt: row.fulfilled_at,
        readyAt: row.ready_at,
        title: title ?? null,
    };
}
export async function createReservation(memberId, collegeId, catalogItemId) {
    const member = await db('library_members').where({ id: memberId, college_id: collegeId }).first();
    if (!member || member.status !== 'ACTIVE')
        throw new AppError(400, 'Membership not active');
    const catalog = await db('library_catalog_items').where({ id: catalogItemId, college_id: collegeId }).first();
    if (!catalog)
        throw new AppError(404, 'Catalog item not found');
    const policy = await resolvePolicyForMember(memberId, collegeId);
    const activeRes = await db('library_reservations')
        .where({ member_id: memberId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'READY'])
        .count({ c: '*' })
        .first();
    if (Number(activeRes?.c ?? 0) >= policy.reservationLimit) {
        throw new AppError(400, 'Reservation limit reached');
    }
    const dup = await db('library_reservations')
        .where({ member_id: memberId, catalog_item_id: catalogItemId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'READY'])
        .first();
    if (dup)
        throw new AppError(409, 'Already reserved this title');
    const maxPos = await db('library_reservations')
        .where({ catalog_item_id: catalogItemId, college_id: collegeId, status: 'ACTIVE' })
        .max('queue_position as maxPos')
        .first();
    const queuePosition = Number(maxPos?.maxPos ?? 0) + 1;
    const [id] = await db('library_reservations').insert({
        college_id: collegeId,
        member_id: memberId,
        catalog_item_id: catalogItemId,
        status: 'ACTIVE',
        queue_position: queuePosition,
        requested_at: new Date(),
    });
    const row = await db('library_reservations').where({ id }).first();
    return serializeReservation(row, catalog.title);
}
export async function cancelReservation(memberId, collegeId, reservationId) {
    const res = await db('library_reservations')
        .where({ id: reservationId, member_id: memberId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'READY'])
        .first();
    if (!res)
        throw new AppError(404, 'Reservation not found');
    await db('library_reservations').where({ id: reservationId }).update({ status: 'CANCELLED' });
    if (res.copy_id && res.status === 'READY') {
        await db('library_copies').where({ id: res.copy_id }).update({ status: 'AVAILABLE' });
        await promoteReservationQueue(db, collegeId, Number(res.catalog_item_id), Number(res.copy_id));
    }
    await reorderQueue(collegeId, Number(res.catalog_item_id));
    return { cancelled: true };
}
async function reorderQueue(collegeId, catalogItemId) {
    const active = await db('library_reservations')
        .where({ catalog_item_id: catalogItemId, college_id: collegeId, status: 'ACTIVE' })
        .orderBy('queue_position');
    for (let i = 0; i < active.length; i++) {
        await db('library_reservations').where({ id: active[i].id }).update({ queue_position: i + 1 });
    }
}
export async function promoteReservationQueue(trx, collegeId, catalogItemId, copyId) {
    const next = await trx('library_reservations')
        .where({ catalog_item_id: catalogItemId, college_id: collegeId, status: 'ACTIVE' })
        .orderBy('queue_position')
        .first();
    if (!next)
        return 'AVAILABLE';
    const policy = await resolvePolicyForMember(Number(next.member_id), collegeId);
    const college = await db('colleges').where({ id: collegeId }).select('timezone').first();
    const tz = collegeTimezone(college?.timezone);
    const expiresAt = addDaysPreservingWallClock(new Date(), policy.pickupHoldDays, tz);
    await trx('library_reservations').where({ id: next.id }).update({
        status: 'READY',
        copy_id: copyId,
        ready_at: new Date(),
        expires_at: expiresAt,
    });
    const member = await trx('library_members').where({ id: next.member_id }).first();
    if (member?.student_id) {
        const catalog = await trx('library_catalog_items').where({ id: catalogItemId }).first();
        await notifyReservationReady(Number(member.student_id), collegeId, Number(next.id), catalog?.title ?? 'Book');
    }
    return 'RESERVED';
}
export async function listMemberReservations(memberId, collegeId) {
    const rows = await db('library_reservations as r')
        .join('library_catalog_items as ci', 'ci.id', 'r.catalog_item_id')
        .where({ 'r.member_id': memberId, 'r.college_id': collegeId })
        .whereNotIn('r.status', ['CANCELLED', 'EXPIRED', 'FULFILLED'])
        .select('r.*', 'ci.title')
        .orderBy('r.requested_at', 'desc');
    return rows.map((r) => serializeReservation(r, r.title));
}
export async function expireReadyReservations(collegeId) {
    const expired = await db('library_reservations')
        .where({ college_id: collegeId, status: 'READY' })
        .where('expires_at', '<', new Date());
    for (const res of expired) {
        await db('library_reservations').where({ id: res.id }).update({ status: 'EXPIRED' });
        if (res.copy_id) {
            await db('library_copies').where({ id: res.copy_id }).update({ status: 'AVAILABLE' });
            await promoteReservationQueue(db, collegeId, Number(res.catalog_item_id), Number(res.copy_id));
        }
    }
    return { expired: expired.length };
}
export async function staffListReservations(actor, status) {
    let query = db('library_reservations as r')
        .join('library_catalog_items as ci', 'ci.id', 'r.catalog_item_id')
        .join('library_members as m', 'm.id', 'r.member_id')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .leftJoin('faculty_users as f', 'f.id', 'm.faculty_id')
        .where('r.college_id', actor.collegeId)
        .select('r.*', 'ci.title', db.raw('COALESCE(s.name, f.name) as member_name'), db.raw('COALESCE(s.usn, f.employee_id) as member_id_display'))
        .orderBy(['r.status', 'r.queue_position']);
    if (status)
        query = query.where('r.status', status);
    const rows = await query.limit(200);
    return rows.map((r) => ({
        ...serializeReservation(r, r.title),
        memberName: r.member_name,
        memberIdentifier: r.member_id_display,
    }));
}
