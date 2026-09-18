import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { getTransportPolicy } from './defaults.js';
export async function recordBoarding(input) {
    const policy = await getTransportPolicy(input.collegeId);
    if (!policy.boardingTrackingEnabled) {
        throw new AppError(400, 'Boarding tracking is not enabled');
    }
    const trip = await db('transport_trips').where({ id: input.tripId, college_id: input.collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    if (!['BOARDING', 'IN_PROGRESS', 'SCHEDULED'].includes(trip.status)) {
        throw new AppError(400, 'Trip is not accepting boarding events');
    }
    const member = await db('transport_members')
        .where({ student_id: input.studentId, college_id: input.collegeId, status: 'ACTIVE' })
        .first();
    if (!member)
        throw new AppError(400, 'Active transport membership required');
    const assignment = await db('student_transport_assignments')
        .where({ student_id: input.studentId, status: 'ACTIVE', route_id: trip.route_id })
        .first();
    if (!assignment)
        throw new AppError(400, 'Student is not assigned to this route');
    const pass = await db('transport_passes')
        .where({ student_id: input.studentId, status: 'ACTIVE' })
        .first();
    if (!pass)
        throw new AppError(400, 'Valid transport pass required');
    if (input.idempotencyKey) {
        const existing = await db('transport_boarding_events')
            .where({ college_id: input.collegeId, idempotency_key: input.idempotencyKey })
            .first();
        if (existing)
            return { id: Number(existing.id), eventType: existing.event_type, duplicate: true };
    }
    const duplicate = await db('transport_boarding_events')
        .where({ trip_id: input.tripId, student_id: input.studentId, event_type: 'BOARDED' })
        .first();
    if (duplicate)
        throw new AppError(409, 'Student already boarded on this trip');
    const [id] = await db('transport_boarding_events').insert({
        college_id: input.collegeId,
        trip_id: input.tripId,
        student_id: input.studentId,
        transport_member_id: member.id,
        route_stop_id: input.routeStopId ?? null,
        event_type: 'BOARDED',
        recorded_by: input.recordedBy ?? null,
        source: input.source ?? 'MANUAL',
        idempotency_key: input.idempotencyKey ?? null,
    });
    if (trip.status === 'SCHEDULED') {
        await db('transport_trips').where({ id: input.tripId }).update({ status: 'BOARDING' });
    }
    return { id, eventType: 'BOARDED', duplicate: false };
}
export async function recordAlighting(input) {
    const boarded = await db('transport_boarding_events')
        .where({ trip_id: input.tripId, student_id: input.studentId, event_type: 'BOARDED' })
        .first();
    if (!boarded)
        throw new AppError(400, 'Student must board before alighting');
    const duplicate = await db('transport_boarding_events')
        .where({ trip_id: input.tripId, student_id: input.studentId, event_type: 'ALIGHTED' })
        .first();
    if (duplicate)
        throw new AppError(409, 'Student already alighted on this trip');
    if (input.idempotencyKey) {
        const existing = await db('transport_boarding_events')
            .where({ college_id: input.collegeId, idempotency_key: input.idempotencyKey })
            .first();
        if (existing)
            return { id: Number(existing.id), eventType: existing.event_type, duplicate: true };
    }
    const member = await db('transport_members')
        .where({ student_id: input.studentId, college_id: input.collegeId })
        .first();
    const [id] = await db('transport_boarding_events').insert({
        college_id: input.collegeId,
        trip_id: input.tripId,
        student_id: input.studentId,
        transport_member_id: member?.id ?? null,
        route_stop_id: input.routeStopId ?? null,
        event_type: 'ALIGHTED',
        recorded_by: input.recordedBy ?? null,
        source: input.source ?? 'MANUAL',
        idempotency_key: input.idempotencyKey ?? null,
    });
    return { id, eventType: 'ALIGHTED', duplicate: false };
}
