import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { TransportActor } from './types.js';
import { assertTransportPermission } from './access.js';
import { recordTransportAudit } from './audit.js';
import { nextTransportMemberNumber } from './numbers.js';
import { canAssignAfterPayment } from './integration.js';
import { checkRouteCapacity } from './capacity.js';
import { activatePass } from './passes.js';
import { notifyTransportEvent } from './notifications.js';
import { getTransportPolicy } from './defaults.js';

export async function assignRoute(
  actor: TransportActor,
  input: {
    applicationId: number;
    routeId: number;
    pickupStopId: number;
    dropStopId: number;
    serviceType?: string;
    reason?: string;
    capacityOverride?: boolean;
    capacityOverrideReason?: string;
  },
) {
  assertTransportPermission(actor, 'transport.assignment.manage');

  return db.transaction(async (trx) => {
    // Serialize all allocations for the route and student. The application row
    // alone is insufficient: two different approved applications can target the
    // same last seat concurrently.
    const route = await trx('transport_routes')
      .where({ id: input.routeId, college_id: actor.collegeId, status: 'ACTIVE' })
      .forUpdate()
      .first();
    if (!route) throw new AppError(400, 'Active route required');
    const app = await trx('transport_applications')
      .where({ id: input.applicationId, college_id: actor.collegeId, status: 'APPROVED' })
      .forUpdate()
      .first();
    if (!app) throw new AppError(400, 'Approved application required');

    await trx('students').where({ id: app.student_id, college_id: actor.collegeId }).forUpdate().first();
    const stops = await trx('transport_route_stops')
      .where({ route_id: input.routeId, college_id: actor.collegeId })
      .whereIn('stop_id', [input.pickupStopId, input.dropStopId]);
    if (stops.length !== 2) throw new AppError(400, 'Pickup and drop stops must belong to the route');

    const paymentOk = await canAssignAfterPayment(Number(app.student_id), actor.collegeId);
    const policy = await getTransportPolicy(actor.collegeId);
    if (policy.assignmentPaymentPolicy === 'PAY_BEFORE_ASSIGNMENT' && !paymentOk) {
      throw new AppError(400, 'Transport fee payment required before assignment');
    }

    const cap = await checkRouteCapacity(actor.collegeId, input.routeId, input.capacityOverride, trx);
    if (!cap.ok) {
      throw new AppError(409, 'Route capacity exceeded', { code: cap.code });
    }

    const existingAssignment = await trx('student_transport_assignments')
      .where({ student_id: app.student_id, status: 'ACTIVE' })
      .first();
    if (existingAssignment) throw new AppError(409, 'Student already has an active transport assignment');

    let member = await trx('transport_members')
      .where({ application_id: input.applicationId, college_id: actor.collegeId })
      .whereNot('status', 'CANCELLED')
      .first();

    if (!member) {
      const cycle = await trx('transport_application_cycles').where({ id: app.application_cycle_id }).first();
      const memberNumber = await nextTransportMemberNumber(trx, actor.collegeId);
      const [memberId] = await trx('transport_members').insert({
        college_id: actor.collegeId,
        student_id: app.student_id,
        academic_year_id: cycle!.academic_year_id,
        application_id: input.applicationId,
        member_number: memberNumber,
        status: 'ACTIVE',
        activated_at: trx.fn.now(),
      });
      member = await trx('transport_members').where({ id: memberId }).first();
    } else {
      await trx('transport_members').where({ id: member.id }).update({
        status: 'ACTIVE',
        activated_at: trx.fn.now(),
      });
    }

    const [assignmentId] = await trx('student_transport_assignments').insert({
      college_id: actor.collegeId,
      transport_member_id: member!.id,
      student_id: app.student_id,
      route_id: input.routeId,
      pickup_stop_id: input.pickupStopId,
      drop_stop_id: input.dropStopId,
      service_type: input.serviceType ?? app.service_type ?? 'TWO_WAY',
      start_at: trx.fn.now(),
      status: 'ACTIVE',
      assigned_by: actor.facultyUserId,
      reason: input.reason ?? null,
    });

    await trx('transport_applications').where({ id: input.applicationId }).update({ status: 'ASSIGNED' });
    await trx('transport_waitlist_entries').where({ application_id: input.applicationId }).update({ status: 'ASSIGNED' });

    await recordTransportAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: input.capacityOverride ? 'ROUTE_ASSIGNED_WITH_OVERRIDE' : 'ROUTE_ASSIGNED',
      entityType: 'STUDENT_TRANSPORT_ASSIGNMENT',
      entityId: assignmentId,
      afterState: { routeId: input.routeId, studentId: app.student_id },
      reason: input.capacityOverrideReason,
    });

    const pass = await activatePass(trx, {
      collegeId: actor.collegeId,
      transportMemberId: Number(member!.id),
      studentId: Number(app.student_id),
      routeAssignmentId: assignmentId,
    });

    await notifyTransportEvent({
      studentId: Number(app.student_id),
      collegeId: actor.collegeId,
      type: 'TRANSPORT_ASSIGNED',
      title: 'Transport route assigned',
      body: 'Your transport route and stop have been assigned.',
      link: '/lms/transport',
      relatedType: 'TRANSPORT_ASSIGNMENT',
      relatedId: assignmentId,
    });

    return {
      assignmentId,
      memberId: Number(member!.id),
      passId: pass.id,
      status: 'ACTIVE',
    };
  });
}

export async function getStudentAssignment(studentId: number, collegeId: number) {
  const assignment = await db('student_transport_assignments')
    .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
    .first();
  if (!assignment) return null;

  const route = await db('transport_routes').where({ id: assignment.route_id }).first();
  const pickup = await db('transport_stops').where({ id: assignment.pickup_stop_id }).first();
  const drop = await db('transport_stops').where({ id: assignment.drop_stop_id }).first();
  const routeStops = await db('transport_route_stops as rs')
    .join('transport_stops as s', 's.id', 'rs.stop_id')
    .where({ 'rs.route_id': assignment.route_id })
    .orderBy('rs.sequence_number')
    .select('rs.*', 's.name as stop_name', 's.code as stop_code');

  const vehicleAssignment = await db('transport_route_vehicle_assignments')
    .where({ route_id: assignment.route_id, status: 'ACTIVE' })
    .first();
  const vehicle = vehicleAssignment
    ? await db('transport_vehicles').where({ id: vehicleAssignment.vehicle_id }).first()
    : null;

  return {
    id: Number(assignment.id),
    routeId: Number(assignment.route_id),
    routeName: route?.name,
    routeCode: route?.code,
    pickupStop: pickup ? { id: Number(pickup.id), name: pickup.name, code: pickup.code } : null,
    dropStop: drop ? { id: Number(drop.id), name: drop.name, code: drop.code } : null,
    serviceType: assignment.service_type,
    vehicle: vehicle ? { id: Number(vehicle.id), vehicleNumber: vehicle.vehicle_number, capacity: vehicle.total_capacity } : null,
    stops: routeStops.map((rs) => ({
      sequenceNumber: Number(rs.sequence_number),
      stopName: rs.stop_name,
      stopCode: rs.stop_code,
      scheduledPickupTime: rs.scheduled_pickup_time,
      scheduledDropTime: rs.scheduled_drop_time,
    })),
    startAt: assignment.start_at,
  };
}

export async function getAssignmentHistory(studentId: number, collegeId: number) {
  const rows = await db('student_transport_assignments as a')
    .leftJoin('transport_routes as r', 'r.id', 'a.route_id')
    .leftJoin('transport_stops as ps', 'ps.id', 'a.pickup_stop_id')
    .leftJoin('transport_stops as ds', 'ds.id', 'a.drop_stop_id')
    .where({ 'a.student_id': studentId, 'a.college_id': collegeId })
    .orderBy('a.start_at', 'desc')
    .select('a.*', 'r.name as route_name', 'ps.name as pickup_name', 'ds.name as drop_name');
  return rows.map((r) => ({
    id: Number(r.id),
    routeName: r.route_name,
    pickupStop: r.pickup_name,
    dropStop: r.drop_name,
    serviceType: r.service_type,
    status: r.status,
    startAt: r.start_at,
    endAt: r.end_at,
  }));
}

export async function bulkAssignDryRun(
  actor: TransportActor,
  assignments: Array<{ applicationId: number; routeId: number; pickupStopId: number; dropStopId: number }>,
) {
  assertTransportPermission(actor, 'transport.assignment.manage');
  const results = [];
  for (const a of assignments) {
    const app = await db('transport_applications').where({ id: a.applicationId, college_id: actor.collegeId }).first();
    const cap = await checkRouteCapacity(actor.collegeId, a.routeId);
    const warnings: string[] = [];
    if (!cap.ok) warnings.push('CAPACITY_EXCEEDED');
    if (!app) warnings.push('APPLICATION_NOT_FOUND');
    else if (app.status !== 'APPROVED') warnings.push('NOT_APPROVED');
    results.push({
      applicationId: a.applicationId,
      studentId: app ? Number(app.student_id) : null,
      routeId: a.routeId,
      suggested: warnings.length === 0,
      warnings,
      capacityImpact: cap.capacity,
    });
  }
  return { dryRun: true, results };
}
