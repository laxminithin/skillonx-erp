import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { TransportActor } from './types.js';
import { assertTransportCollege, assertTransportPermission } from './access.js';
import { serializeRoute, serializeStop } from './defaults.js';

export async function createStop(actor: TransportActor, input: Record<string, unknown>) {
  assertTransportPermission(actor, 'transport.stop.manage');
  const existing = await db('transport_stops').where({ college_id: actor.collegeId, code: input.code }).first();
  if (existing) throw new AppError(409, 'Stop code already exists');
  const [id] = await db('transport_stops').insert({
    college_id: actor.collegeId,
    code: input.code,
    name: input.name,
    landmark: input.landmark ?? null,
    address: input.address ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    zone_id: input.zoneId ?? null,
    status: input.status ?? 'ACTIVE',
  });
  const row = await db('transport_stops').where({ id }).first();
  return serializeStop(row!);
}

export async function listStops(actor: TransportActor) {
  assertTransportPermission(actor, 'transport.view');
  const rows = await db('transport_stops').where({ college_id: actor.collegeId }).orderBy('name');
  return rows.map(serializeStop);
}

export async function createRoute(actor: TransportActor, input: Record<string, unknown>) {
  assertTransportPermission(actor, 'transport.route.manage');
  const existing = await db('transport_routes').where({ college_id: actor.collegeId, code: input.code }).first();
  if (existing) throw new AppError(409, 'Route code already exists');
  const [id] = await db('transport_routes').insert({
    college_id: actor.collegeId,
    code: input.code,
    name: input.name,
    origin: input.origin,
    destination: input.destination,
    direction_type: input.directionType ?? 'BIDIRECTIONAL',
    estimated_distance: input.estimatedDistance ?? null,
    estimated_duration: input.estimatedDuration ?? null,
    status: input.status ?? 'DRAFT',
  });
  const row = await db('transport_routes').where({ id }).first();
  return serializeRoute(row!);
}

export async function listRoutes(actor: TransportActor) {
  assertTransportPermission(actor, 'transport.view');
  const rows = await db('transport_routes').where({ college_id: actor.collegeId }).orderBy('code');
  return rows.map(serializeRoute);
}

export async function getRouteWithStops(routeId: number, collegeId: number) {
  const route = await db('transport_routes').where({ id: routeId, college_id: collegeId }).first();
  if (!route) throw new AppError(404, 'Route not found');
  const stops = await db('transport_route_stops as rs')
    .join('transport_stops as s', 's.id', 'rs.stop_id')
    .where({ 'rs.route_id': routeId })
    .orderBy('rs.sequence_number')
    .select('rs.*', 's.name as stop_name', 's.code as stop_code');
  return {
    ...serializeRoute(route),
    stops: stops.map((rs) => ({
      id: Number(rs.id),
      stopId: Number(rs.stop_id),
      stopName: rs.stop_name,
      stopCode: rs.stop_code,
      sequenceNumber: Number(rs.sequence_number),
      scheduledPickupTime: rs.scheduled_pickup_time,
      scheduledDropTime: rs.scheduled_drop_time,
      boardingAllowed: !!rs.boarding_allowed,
      alightingAllowed: !!rs.alighting_allowed,
    })),
  };
}

export async function setRouteStops(
  actor: TransportActor,
  routeId: number,
  stops: Array<{
    stopId: number;
    sequenceNumber: number;
    scheduledPickupTime?: string;
    scheduledDropTime?: string;
    boardingAllowed?: boolean;
    alightingAllowed?: boolean;
  }>,
) {
  assertTransportPermission(actor, 'transport.route.manage');
  await assertTransportCollege('transport_routes', routeId, actor.collegeId);
  await db.transaction(async (trx) => {
    await trx('transport_route_stops').where({ route_id: routeId }).delete();
    for (const s of stops) {
      await trx('transport_route_stops').insert({
        college_id: actor.collegeId,
        route_id: routeId,
        stop_id: s.stopId,
        sequence_number: s.sequenceNumber,
        scheduled_pickup_time: s.scheduledPickupTime ?? null,
        scheduled_drop_time: s.scheduledDropTime ?? null,
        boarding_allowed: s.boardingAllowed ?? true,
        alighting_allowed: s.alightingAllowed ?? true,
      });
    }
  });
  return getRouteWithStops(routeId, actor.collegeId);
}

export async function activateRoute(actor: TransportActor, routeId: number) {
  assertTransportPermission(actor, 'transport.route.manage');
  await assertTransportCollege('transport_routes', routeId, actor.collegeId);
  const stopCount = await db('transport_route_stops').where({ route_id: routeId }).count({ c: '*' }).first();
  if (Number(stopCount?.c ?? 0) < 2) throw new AppError(400, 'Route must have at least 2 stops');
  await db('transport_routes').where({ id: routeId }).update({ status: 'ACTIVE' });
  return { id: routeId, status: 'ACTIVE' };
}
