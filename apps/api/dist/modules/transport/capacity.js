import { db } from '../../db/index.js';
import { getTransportPolicy } from './defaults.js';
export async function getRouteCapacity(collegeId, routeId, executor = db) {
    const activeAssignments = await executor('student_transport_assignments')
        .where({ college_id: collegeId, route_id: routeId, status: 'ACTIVE' })
        .count({ c: '*' })
        .first();
    const passengerCount = Number(activeAssignments?.c ?? 0);
    const vehicleAssignment = await executor('transport_route_vehicle_assignments')
        .where({ college_id: collegeId, route_id: routeId, status: 'ACTIVE' })
        .first();
    let vehicleCapacity = 0;
    if (vehicleAssignment) {
        const vehicle = await executor('transport_vehicles').where({ id: vehicleAssignment.vehicle_id, college_id: collegeId }).first();
        vehicleCapacity = vehicle ? Number(vehicle.total_capacity) : 0;
    }
    return {
        routeId,
        passengerCount,
        vehicleCapacity,
        availableCapacity: Math.max(0, vehicleCapacity - passengerCount),
        utilizationPercent: vehicleCapacity > 0 ? Math.round((passengerCount / vehicleCapacity) * 100) : 0,
    };
}
export async function checkRouteCapacity(collegeId, routeId, override = false, executor = db) {
    const policy = await getTransportPolicy(collegeId);
    const capacity = await getRouteCapacity(collegeId, routeId, executor);
    if (!policy.vehicleCapacityEnforced || override) {
        return { ok: true, capacity };
    }
    if (capacity.vehicleCapacity > 0 && capacity.availableCapacity <= 0) {
        return { ok: false, code: 'CAPACITY_EXCEEDED', capacity };
    }
    return { ok: true, capacity };
}
export async function checkVehicleConflict(collegeId, vehicleId, startAt, endAt, excludeTripId) {
    let q = db('transport_trips')
        .where({ college_id: collegeId, vehicle_id: vehicleId })
        .whereNot('status', 'CANCELLED')
        .where(function () {
        this.where('scheduled_start_at', '<', endAt).andWhere('scheduled_end_at', '>', startAt);
    });
    if (excludeTripId)
        q = q.whereNot('id', excludeTripId);
    const conflict = await q.first();
    return conflict ? { conflict: true, code: 'VEHICLE_CONFLICT' } : { conflict: false };
}
export async function checkDriverConflict(collegeId, personnelId, startAt, endAt, excludeTripId) {
    const assignments = await db('transport_staff_assignments')
        .where({ college_id: collegeId, personnel_id: personnelId, status: 'ACTIVE' });
    for (const a of assignments) {
        if (!a.trip_id)
            continue;
        let q = db('transport_trips')
            .where({ id: a.trip_id, college_id: collegeId })
            .whereNot('status', 'CANCELLED')
            .where(function () {
            this.where('scheduled_start_at', '<', endAt).andWhere('scheduled_end_at', '>', startAt);
        });
        if (excludeTripId)
            q = q.whereNot('id', excludeTripId);
        const conflict = await q.first();
        if (conflict)
            return { conflict: true, code: 'DRIVER_CONFLICT' };
    }
    return { conflict: false };
}
export async function isVehicleCompliant(vehicleId, collegeId) {
    const vehicle = await db('transport_vehicles').where({ id: vehicleId, college_id: collegeId }).first();
    if (!vehicle || vehicle.status !== 'ACTIVE')
        return false;
    const today = new Date().toISOString().slice(0, 10);
    const expiries = [
        vehicle.registration_expiry,
        vehicle.insurance_expiry,
        vehicle.fitness_expiry,
        vehicle.permit_expiry,
        vehicle.pollution_expiry,
    ].filter(Boolean);
    for (const exp of expiries) {
        if (exp && String(exp).slice(0, 10) < today)
            return false;
    }
    return true;
}
