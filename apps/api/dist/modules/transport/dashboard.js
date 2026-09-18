import { db } from '../../db/index.js';
import { assertTransportPermission } from './access.js';
import { getRouteCapacity } from './capacity.js';
export async function getAdminDashboard(actor) {
    assertTransportPermission(actor, 'transport.view');
    const collegeId = actor.collegeId;
    const today = new Date().toISOString().slice(0, 10);
    const [activeMembers, pendingApps, waitlisted, activeRoutes, activeStops, vehicles, tripsToday] = await Promise.all([
        db('transport_members').where({ college_id: collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
        db('transport_applications').where({ college_id: collegeId }).whereIn('status', ['SUBMITTED', 'UNDER_REVIEW']).count({ c: '*' }).first(),
        db('transport_waitlist_entries').where({ college_id: collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
        db('transport_routes').where({ college_id: collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
        db('transport_stops').where({ college_id: collegeId, status: 'ACTIVE' }).count({ c: '*' }).first(),
        db('transport_vehicles').where({ college_id: collegeId }).count({ c: '*' }).first(),
        db('transport_trips').where({ college_id: collegeId, trip_date: today }).count({ c: '*' }).first(),
    ]);
    const delayedTrips = await db('transport_trips')
        .where({ college_id: collegeId, trip_date: today, status: 'DELAYED' })
        .count({ c: '*' })
        .first();
    const cancelledTrips = await db('transport_trips')
        .where({ college_id: collegeId, trip_date: today, status: 'CANCELLED' })
        .count({ c: '*' })
        .first();
    const openComplaints = await db('transport_complaints')
        .where({ college_id: collegeId })
        .whereIn('status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS'])
        .count({ c: '*' })
        .first();
    const pendingChanges = await db('transport_change_requests')
        .where({ college_id: collegeId })
        .whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])
        .count({ c: '*' })
        .first();
    const maintenanceVehicles = await db('transport_vehicles')
        .where({ college_id: collegeId, status: 'MAINTENANCE' })
        .count({ c: '*' })
        .first();
    return {
        activeTransportStudents: Number(activeMembers?.c ?? 0),
        applicationsPending: Number(pendingApps?.c ?? 0),
        waitlisted: Number(waitlisted?.c ?? 0),
        activeRoutes: Number(activeRoutes?.c ?? 0),
        activeStops: Number(activeStops?.c ?? 0),
        vehicles: Number(vehicles?.c ?? 0),
        vehiclesInMaintenance: Number(maintenanceVehicles?.c ?? 0),
        tripsToday: Number(tripsToday?.c ?? 0),
        delayedTrips: Number(delayedTrips?.c ?? 0),
        cancelledTrips: Number(cancelledTrips?.c ?? 0),
        openComplaints: Number(openComplaints?.c ?? 0),
        pendingRouteChanges: Number(pendingChanges?.c ?? 0),
        gpsConfigured: false,
        liveTrackingNote: 'Live Tracking Not Configured',
    };
}
export async function getOperationsDashboard(actor) {
    assertTransportPermission(actor, 'transport.view');
    const collegeId = actor.collegeId;
    const today = new Date().toISOString().slice(0, 10);
    const trips = await db('transport_trips as t')
        .leftJoin('transport_routes as r', 'r.id', 't.route_id')
        .leftJoin('transport_vehicles as v', 'v.id', 't.vehicle_id')
        .where({ 't.college_id': collegeId, 't.trip_date': today })
        .select('t.*', 'r.name as route_name', 'v.vehicle_number');
    const unassigned = trips.filter((t) => !t.vehicle_id && t.status !== 'CANCELLED');
    const delayed = trips.filter((t) => t.status === 'DELAYED');
    const cancelled = trips.filter((t) => t.status === 'CANCELLED');
    const incidents = await db('transport_incidents')
        .where({ college_id: collegeId, status: 'OPEN' })
        .count({ c: '*' })
        .first();
    return {
        todayTrips: trips.length,
        unassignedTrips: unassigned.length,
        delayedTrips: delayed.length,
        cancelledTrips: cancelled.length,
        activeIncidents: Number(incidents?.c ?? 0),
        trips: trips.map((t) => ({
            id: Number(t.id),
            routeName: t.route_name,
            tripType: t.trip_type,
            status: t.status,
            vehicleNumber: t.vehicle_number,
            scheduledStartAt: t.scheduled_start_at,
        })),
        gpsConfigured: false,
    };
}
export async function getManagementDashboard(actor) {
    assertTransportPermission(actor, 'transport.report.view');
    const collegeId = actor.collegeId;
    const dashboard = await getAdminDashboard(actor);
    const routes = await db('transport_routes').where({ college_id: collegeId, status: 'ACTIVE' });
    const routeDemand = [];
    for (const route of routes) {
        const cap = await getRouteCapacity(collegeId, Number(route.id));
        routeDemand.push({
            routeName: route.name,
            routeCode: route.code,
            ...cap,
        });
    }
    const stopDemandRows = await db('student_transport_assignments as a')
        .join('transport_stops as s', 's.id', 'a.pickup_stop_id')
        .where({ 'a.college_id': collegeId, 'a.status': 'ACTIVE' })
        .groupBy('a.pickup_stop_id', 's.name', 's.code')
        .select('a.pickup_stop_id', 's.name', 's.code')
        .count({ studentCount: 'a.id' });
    return {
        ...dashboard,
        routeDemand,
        stopDemand: stopDemandRows.map((s) => ({
            stopId: Number(s.pickup_stop_id),
            stopName: s.name,
            stopCode: s.code,
            studentCount: Number(s.studentCount),
        })),
        financeNote: 'Financial summary sourced from Finance service',
    };
}
export async function getRouteDemandReport(actor) {
    assertTransportPermission(actor, 'transport.report.view');
    const applicationsByStop = await db('transport_applications as a')
        .join('transport_stops as s', 's.id', 'a.pickup_stop_preference_id')
        .where({ 'a.college_id': actor.collegeId })
        .whereNotIn('a.status', ['CANCELLED', 'REJECTED'])
        .groupBy('a.pickup_stop_preference_id', 's.name')
        .select('s.name')
        .count({ count: 'a.id' });
    return { applicationsByStop };
}
