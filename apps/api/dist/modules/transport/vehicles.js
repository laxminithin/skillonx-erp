import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertTransportCollege, assertTransportPermission } from './access.js';
import { serializeVehicle } from './defaults.js';
import { isVehicleCompliant } from './capacity.js';
export async function createVehicle(actor, input) {
    assertTransportPermission(actor, 'transport.vehicle.manage');
    const existing = await db('transport_vehicles')
        .where({ college_id: actor.collegeId, vehicle_number: input.vehicleNumber })
        .first();
    if (existing)
        throw new AppError(409, 'Vehicle number already exists');
    const [id] = await db('transport_vehicles').insert({
        college_id: actor.collegeId,
        vehicle_number: input.vehicleNumber,
        internal_code: input.internalCode ?? null,
        vehicle_type: input.vehicleType ?? 'BUS',
        manufacturer: input.manufacturer ?? null,
        model: input.model ?? null,
        year: input.year ?? null,
        seating_capacity: input.seatingCapacity,
        standing_capacity: input.standingCapacity ?? null,
        total_capacity: input.totalCapacity,
        status: input.status ?? 'ACTIVE',
        operational_status: 'AVAILABLE',
    });
    const row = await db('transport_vehicles').where({ id }).first();
    return serializeVehicle(row);
}
export async function listVehicles(actor) {
    assertTransportPermission(actor, 'transport.view');
    const rows = await db('transport_vehicles').where({ college_id: actor.collegeId }).orderBy('vehicle_number');
    return rows.map(serializeVehicle);
}
export async function getComplianceDashboard(actor) {
    assertTransportPermission(actor, 'transport.view');
    const vehicles = await db('transport_vehicles').where({ college_id: actor.collegeId, status: 'ACTIVE' });
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const alerts = [];
    for (const v of vehicles) {
        const fields = [
            { type: 'REGISTRATION', date: v.registration_expiry },
            { type: 'INSURANCE', date: v.insurance_expiry },
            { type: 'FITNESS', date: v.fitness_expiry },
            { type: 'PERMIT', date: v.permit_expiry },
            { type: 'POLLUTION', date: v.pollution_expiry },
        ];
        for (const f of fields) {
            if (!f.date)
                continue;
            const d = String(f.date).slice(0, 10);
            if (d < today) {
                alerts.push({ vehicleId: Number(v.id), vehicleNumber: v.vehicle_number, documentType: f.type, status: 'EXPIRED', expiryDate: d });
            }
            else if (d <= soon) {
                alerts.push({ vehicleId: Number(v.id), vehicleNumber: v.vehicle_number, documentType: f.type, status: 'EXPIRING_SOON', expiryDate: d });
            }
        }
    }
    return { alerts, totalVehicles: vehicles.length };
}
export async function assignVehicleToRoute(actor, routeId, vehicleId, shiftType) {
    assertTransportPermission(actor, 'transport.vehicle.manage');
    const route = await assertTransportCollege('transport_routes', routeId, actor.collegeId);
    if (route.status !== 'ACTIVE')
        throw new AppError(400, 'Active route required');
    const vehicle = await assertTransportCollege('transport_vehicles', vehicleId, actor.collegeId);
    if (vehicle.status !== 'ACTIVE' || vehicle.operational_status !== 'AVAILABLE') {
        throw new AppError(400, 'Vehicle is not operationally available', { code: 'VEHICLE_UNAVAILABLE' });
    }
    const compliant = await isVehicleCompliant(vehicleId, actor.collegeId);
    if (!compliant)
        throw new AppError(400, 'Vehicle compliance blocked', { code: 'COMPLIANCE_BLOCKED' });
    const existing = await db('transport_route_vehicle_assignments')
        .where({ college_id: actor.collegeId, route_id: routeId, vehicle_id: vehicleId, status: 'ACTIVE' })
        .first();
    if (existing)
        return { id: Number(existing.id), routeId, vehicleId, status: 'ACTIVE' };
    const [id] = await db('transport_route_vehicle_assignments').insert({
        college_id: actor.collegeId,
        route_id: routeId,
        vehicle_id: vehicleId,
        shift_type: shiftType ?? null,
        status: 'ACTIVE',
    });
    return { id, routeId, vehicleId, status: 'ACTIVE' };
}
export async function createMaintenanceRecord(actor, input) {
    assertTransportPermission(actor, 'transport.maintenance.manage');
    await assertTransportCollege('transport_vehicles', input.vehicleId, actor.collegeId);
    const [id] = await db('transport_vehicle_maintenance').insert({
        college_id: actor.collegeId,
        vehicle_id: input.vehicleId,
        maintenance_type: input.maintenanceType,
        description: input.description ?? null,
        scheduled_at: input.scheduledAt ?? null,
        status: 'SCHEDULED',
    });
    await db('transport_vehicles').where({ id: input.vehicleId }).update({
        status: 'MAINTENANCE',
        operational_status: 'MAINTENANCE',
    });
    return { id, status: 'SCHEDULED' };
}
