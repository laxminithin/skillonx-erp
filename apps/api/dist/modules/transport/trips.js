import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertTransportPermission } from './access.js';
import { checkDriverConflict, checkVehicleConflict, isVehicleCompliant } from './capacity.js';
export async function generateDailyTrips(collegeId, tripDate) {
    const dayOfWeek = new Date(tripDate).getDay();
    const schedules = await db('transport_route_schedules')
        .where({ college_id: collegeId, day_of_week: dayOfWeek, status: 'ACTIVE' });
    const created = [];
    for (const schedule of schedules) {
        const idempotencyKey = `${collegeId}:${schedule.route_id}:${tripDate}:${schedule.trip_type}`;
        const existing = await db('transport_trips')
            .where({ college_id: collegeId, idempotency_key: idempotencyKey })
            .first();
        if (existing) {
            created.push({ tripId: Number(existing.id), skipped: true });
            continue;
        }
        const vehicleAssignment = await db('transport_route_vehicle_assignments')
            .where({ route_id: schedule.route_id, status: 'ACTIVE' })
            .first();
        const [startH, startM] = String(schedule.start_time).split(':').map(Number);
        const scheduledStart = new Date(tripDate);
        scheduledStart.setHours(startH, startM, 0, 0);
        let scheduledEnd = new Date(scheduledStart);
        if (schedule.expected_end_time) {
            const [endH, endM] = String(schedule.expected_end_time).split(':').map(Number);
            scheduledEnd = new Date(tripDate);
            scheduledEnd.setHours(endH, endM, 0, 0);
        }
        else {
            scheduledEnd.setHours(scheduledStart.getHours() + 2);
        }
        const [tripId] = await db('transport_trips').insert({
            college_id: collegeId,
            route_id: schedule.route_id,
            vehicle_id: vehicleAssignment?.vehicle_id ?? null,
            trip_date: tripDate,
            trip_type: schedule.trip_type,
            idempotency_key: idempotencyKey,
            scheduled_start_at: scheduledStart,
            scheduled_end_at: scheduledEnd,
            status: 'SCHEDULED',
        });
        created.push({ tripId, skipped: false });
    }
    return created;
}
export async function getTodayTripsForStudent(studentId, collegeId) {
    const assignment = await db('student_transport_assignments')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
        .first();
    if (!assignment)
        return [];
    const today = new Date().toISOString().slice(0, 10);
    const trips = await db('transport_trips as t')
        .leftJoin('transport_vehicles as v', 'v.id', 't.vehicle_id')
        .where({ 't.college_id': collegeId, 't.route_id': assignment.route_id, 't.trip_date': today })
        .whereNot('t.status', 'CANCELLED')
        .select('t.*', 'v.vehicle_number')
        .orderBy('t.scheduled_start_at');
    return trips.map((t) => ({
        id: Number(t.id),
        tripType: t.trip_type,
        status: t.status,
        scheduledStartAt: t.scheduled_start_at,
        scheduledEndAt: t.scheduled_end_at,
        actualStartAt: t.actual_start_at,
        actualEndAt: t.actual_end_at,
        vehicleNumber: t.vehicle_number,
    }));
}
export async function getDriverTodayTrips(personnelId, collegeId) {
    const today = new Date().toISOString().slice(0, 10);
    const assignments = await db('transport_staff_assignments')
        .where({ personnel_id: personnelId, college_id: collegeId, status: 'ACTIVE' });
    const routeIds = assignments.map((a) => a.route_id).filter(Boolean);
    const tripIds = assignments.map((a) => a.trip_id).filter(Boolean);
    let q = db('transport_trips as t')
        .leftJoin('transport_routes as r', 'r.id', 't.route_id')
        .leftJoin('transport_vehicles as v', 'v.id', 't.vehicle_id')
        .where({ 't.college_id': collegeId, 't.trip_date': today })
        .whereNot('t.status', 'CANCELLED');
    if (tripIds.length > 0) {
        q = q.where(function () {
            this.whereIn('t.id', tripIds);
            if (routeIds.length > 0)
                this.orWhereIn('t.route_id', routeIds);
        });
    }
    else if (routeIds.length > 0) {
        q = q.whereIn('t.route_id', routeIds);
    }
    else {
        return [];
    }
    const trips = await q.select('t.*', 'r.name as route_name', 'r.code as route_code', 'v.vehicle_number');
    return trips.map((t) => ({
        id: Number(t.id),
        routeName: t.route_name,
        routeCode: t.route_code,
        tripType: t.trip_type,
        status: t.status,
        scheduledStartAt: t.scheduled_start_at,
        vehicleNumber: t.vehicle_number,
    }));
}
export async function getTripManifest(tripId, collegeId) {
    const trip = await db('transport_trips').where({ id: tripId, college_id: collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    const passengers = await db('student_transport_assignments as a')
        .join('students as s', 's.id', 'a.student_id')
        .leftJoin('transport_stops as ps', 'ps.id', 'a.pickup_stop_id')
        .leftJoin('transport_stops as ds', 'ds.id', 'a.drop_stop_id')
        .where({ 'a.route_id': trip.route_id, 'a.status': 'ACTIVE', 'a.college_id': collegeId })
        .select('s.id as student_id', 's.name', 's.usn', 'ps.name as pickup_stop', 'ds.name as drop_stop');
    const boarding = await db('transport_boarding_events')
        .where({ trip_id: tripId, college_id: collegeId });
    return {
        tripId: Number(trip.id),
        routeId: Number(trip.route_id),
        status: trip.status,
        passengers: passengers.map((p) => {
            const events = boarding.filter((b) => Number(b.student_id) === Number(p.student_id));
            const boarded = events.some((e) => e.event_type === 'BOARDED');
            const alighted = events.some((e) => e.event_type === 'ALIGHTED');
            return {
                studentId: Number(p.student_id),
                name: p.name,
                usn: p.usn,
                pickupStop: p.pickup_stop,
                dropStop: p.drop_stop,
                boardingStatus: alighted ? 'ALIGHTED' : boarded ? 'BOARDED' : 'NOT_BOARDED',
            };
        }),
    };
}
export async function startTrip(tripId, collegeId, actorId) {
    const trip = await db('transport_trips').where({ id: tripId, college_id: collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    if (!['SCHEDULED', 'DELAYED'].includes(trip.status)) {
        throw new AppError(400, 'Trip cannot be started from current status');
    }
    await db('transport_trips').where({ id: tripId }).update({
        status: 'BOARDING',
        actual_start_at: db.fn.now(),
    });
    return { id: tripId, status: 'BOARDING' };
}
export async function completeTrip(tripId, collegeId) {
    const trip = await db('transport_trips').where({ id: tripId, college_id: collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    if (!['BOARDING', 'IN_PROGRESS'].includes(trip.status)) {
        throw new AppError(400, 'Trip cannot be completed from current status');
    }
    await db('transport_trips').where({ id: tripId }).update({
        status: 'COMPLETED',
        actual_end_at: db.fn.now(),
    });
    return { id: tripId, status: 'COMPLETED' };
}
export async function assignVehicleToTrip(actor, tripId, vehicleId) {
    assertTransportPermission(actor, 'transport.trip.manage');
    const trip = await db('transport_trips').where({ id: tripId, college_id: actor.collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    const compliant = await isVehicleCompliant(vehicleId, actor.collegeId);
    if (!compliant)
        throw new AppError(400, 'Vehicle compliance blocked', { code: 'COMPLIANCE_BLOCKED' });
    const start = new Date(trip.scheduled_start_at);
    const end = new Date(trip.scheduled_end_at);
    const conflict = await checkVehicleConflict(actor.collegeId, vehicleId, start, end, tripId);
    if (conflict.conflict) {
        throw new AppError(409, 'Vehicle conflict', { code: conflict.code });
    }
    await db('transport_trips').where({ id: tripId }).update({ vehicle_id: vehicleId });
    return { tripId, vehicleId, status: 'updated' };
}
export async function assignDriverToTrip(actor, tripId, personnelId, role = 'DRIVER') {
    assertTransportPermission(actor, 'transport.driver.manage');
    const trip = await db('transport_trips').where({ id: tripId, college_id: actor.collegeId }).first();
    if (!trip)
        throw new AppError(404, 'Trip not found');
    const start = new Date(trip.scheduled_start_at);
    const end = new Date(trip.scheduled_end_at);
    const conflict = await checkDriverConflict(actor.collegeId, personnelId, start, end, tripId);
    if (conflict.conflict) {
        throw new AppError(409, 'Driver conflict', { code: conflict.code });
    }
    await db('transport_staff_assignments').insert({
        college_id: actor.collegeId,
        route_id: trip.route_id,
        vehicle_id: trip.vehicle_id,
        trip_id: tripId,
        personnel_id: personnelId,
        role,
        status: 'ACTIVE',
    });
    return { tripId, personnelId, role };
}
