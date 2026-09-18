import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { TransportActor } from './types.js';
import { assertTransportCollege, assertTransportPermission } from './access.js';
import { recordTransportAudit } from './audit.js';
import { evaluateTransportEligibility, getOpenApplicationCycle } from './eligibility.js';
import { getTransportPolicy } from './defaults.js';
import { nextTransportApplicationNumber } from './numbers.js';
import { notifyTransportEvent } from './notifications.js';
import { createTransportFeeDemand } from './integration.js';
import { checkRouteCapacity } from './capacity.js';

export async function getStudentApplication(studentId: number, collegeId: number) {
  const app = await db('transport_applications')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNotIn('status', ['REJECTED', 'CANCELLED'])
    .orderBy('created_at', 'desc')
    .first();
  if (!app) return null;

  const pickupStop = app.pickup_stop_preference_id
    ? await db('transport_stops').where({ id: app.pickup_stop_preference_id }).first()
    : null;
  const dropStop = app.drop_stop_preference_id
    ? await db('transport_stops').where({ id: app.drop_stop_preference_id }).first()
    : null;
  const route = app.preferred_route_id
    ? await db('transport_routes').where({ id: app.preferred_route_id }).first()
    : null;
  const cycle = await db('transport_application_cycles').where({ id: app.application_cycle_id }).first();

  return serializeApplication(app, pickupStop, dropStop, route, cycle);
}

function serializeApplication(
  app: Record<string, unknown>,
  pickupStop?: Record<string, unknown> | null,
  dropStop?: Record<string, unknown> | null,
  route?: Record<string, unknown> | null,
  cycle?: Record<string, unknown> | null,
) {
  return {
    id: Number(app.id),
    applicationNumber: app.application_number,
    status: app.status,
    pickupStopPreferenceId: app.pickup_stop_preference_id ? Number(app.pickup_stop_preference_id) : null,
    pickupStopName: pickupStop?.name ?? null,
    dropStopPreferenceId: app.drop_stop_preference_id ? Number(app.drop_stop_preference_id) : null,
    dropStopName: dropStop?.name ?? null,
    preferredRouteId: app.preferred_route_id ? Number(app.preferred_route_id) : null,
    preferredRouteName: route?.name ?? null,
    serviceType: app.service_type,
    transportPeriod: app.transport_period,
    specialRequirement: app.special_requirement,
    emergencyContactName: app.emergency_contact_name,
    emergencyContactPhone: app.emergency_contact_phone,
    rulesAccepted: !!app.rules_accepted,
    declarationAccepted: !!app.declaration_accepted,
    submittedAt: app.submitted_at,
    reviewedAt: app.reviewed_at,
    rejectionReason: app.rejection_reason,
    cycleName: cycle?.name ?? null,
    createdAt: app.created_at,
  };
}

export async function createOrUpdateApplication(
  studentId: number,
  collegeId: number,
  input: Record<string, unknown>,
  applicationId?: number,
) {
  const cycle = await getOpenApplicationCycle(collegeId);
  if (!cycle) throw new AppError(400, 'No open transport application window');

  const eligibility = await evaluateTransportEligibility(studentId, Number(cycle.id), collegeId);
  if (eligibility.status === 'NOT_ELIGIBLE' && !applicationId) {
    throw new AppError(400, 'Not eligible for transport application', { eligibility });
  }

  return db.transaction(async (trx) => {
    let app;
    if (applicationId) {
      app = await trx('transport_applications')
        .where({ id: applicationId, student_id: studentId, college_id: collegeId, status: 'DRAFT' })
        .first();
      if (!app) throw new AppError(404, 'Draft application not found');
      await trx('transport_applications').where({ id: applicationId }).update({
        pickup_stop_preference_id: input.pickupStopPreferenceId ?? app.pickup_stop_preference_id,
        drop_stop_preference_id: input.dropStopPreferenceId ?? app.drop_stop_preference_id,
        preferred_route_id: input.preferredRouteId ?? app.preferred_route_id,
        service_type: input.serviceType ?? app.service_type,
        transport_period: input.transportPeriod ?? app.transport_period,
        special_requirement: input.specialRequirement ?? app.special_requirement,
        emergency_contact_name: input.emergencyContactName ?? app.emergency_contact_name,
        emergency_contact_phone: input.emergencyContactPhone ?? app.emergency_contact_phone,
        rules_accepted: input.rulesAccepted ?? app.rules_accepted,
        declaration_accepted: input.declarationAccepted ?? app.declaration_accepted,
        updated_at: trx.fn.now(),
      });
      app = await trx('transport_applications').where({ id: applicationId }).first();
    } else {
      const existing = await trx('transport_applications')
        .where({ student_id: studentId, application_cycle_id: cycle.id, college_id: collegeId })
        .whereNotIn('status', ['REJECTED', 'CANCELLED'])
        .first();
      if (existing) throw new AppError(400, 'Active application already exists for this cycle');

      const appNumber = await nextTransportApplicationNumber(trx, collegeId);
      const [id] = await trx('transport_applications').insert({
        college_id: collegeId,
        student_id: studentId,
        application_cycle_id: cycle.id,
        application_number: appNumber,
        pickup_stop_preference_id: input.pickupStopPreferenceId ?? null,
        drop_stop_preference_id: input.dropStopPreferenceId ?? null,
        preferred_route_id: input.preferredRouteId ?? null,
        service_type: input.serviceType ?? 'TWO_WAY',
        transport_period: input.transportPeriod ?? null,
        special_requirement: input.specialRequirement ?? null,
        emergency_contact_name: input.emergencyContactName ?? null,
        emergency_contact_phone: input.emergencyContactPhone ?? null,
        rules_accepted: input.rulesAccepted ?? false,
        declaration_accepted: input.declarationAccepted ?? false,
        status: 'DRAFT',
      });
      app = await trx('transport_applications').where({ id }).first();
    }

    return serializeApplication(app!);
  });
}

export async function submitApplication(studentId: number, collegeId: number, applicationId: number) {
  const app = await db('transport_applications')
    .where({ id: applicationId, student_id: studentId, college_id: collegeId, status: 'DRAFT' })
    .first();
  if (!app) throw new AppError(404, 'Draft application not found');
  if (!app.pickup_stop_preference_id || !app.drop_stop_preference_id) {
    throw new AppError(400, 'Pickup and drop stops are required');
  }
  if (!app.rules_accepted || !app.declaration_accepted) {
    throw new AppError(400, 'Rules and declaration must be accepted');
  }

  await db('transport_applications').where({ id: applicationId }).update({
    status: 'SUBMITTED',
    submitted_at: db.fn.now(),
  });

  await notifyTransportEvent({
    studentId,
    collegeId,
    type: 'TRANSPORT_APPLICATION_SUBMITTED',
    title: 'Transport application submitted',
    body: `Your transport application ${app.application_number} has been submitted.`,
    relatedType: 'TRANSPORT_APPLICATION',
    relatedId: applicationId,
  });

  return { id: applicationId, status: 'SUBMITTED', applicationNumber: app.application_number };
}

export async function cancelApplication(studentId: number, collegeId: number, applicationId: number) {
  const app = await db('transport_applications')
    .where({ id: applicationId, student_id: studentId, college_id: collegeId })
    .whereIn('status', ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'])
    .first();
  if (!app) throw new AppError(404, 'Application cannot be cancelled');
  await db('transport_applications').where({ id: applicationId }).update({ status: 'CANCELLED' });
  return { id: applicationId, status: 'CANCELLED' };
}

export async function listApplications(actor: TransportActor, filters: { status?: string; cycleId?: number } = {}) {
  assertTransportPermission(actor, 'transport.application.review');
  let q = db('transport_applications as a')
    .leftJoin('students as s', 's.id', 'a.student_id')
    .where({ 'a.college_id': actor.collegeId })
    .select('a.*', 's.usn', 's.name as student_name');
  if (filters.status) q = q.andWhere('a.status', filters.status);
  if (filters.cycleId) q = q.andWhere('a.application_cycle_id', filters.cycleId);
  const rows = await q.orderBy('a.created_at', 'desc');
  return rows.map((r) => ({
    id: Number(r.id),
    applicationNumber: r.application_number,
    status: r.status,
    studentId: Number(r.student_id),
    studentName: r.student_name,
    usn: r.usn,
    pickupStopPreferenceId: r.pickup_stop_preference_id ? Number(r.pickup_stop_preference_id) : null,
    dropStopPreferenceId: r.drop_stop_preference_id ? Number(r.drop_stop_preference_id) : null,
    preferredRouteId: r.preferred_route_id ? Number(r.preferred_route_id) : null,
    serviceType: r.service_type,
    submittedAt: r.submitted_at,
    createdAt: r.created_at,
  }));
}

export async function reviewApplication(
  actor: TransportActor,
  applicationId: number,
  decision: 'APPROVE' | 'REJECT' | 'WAITLIST',
  input: { rejectionReason?: string; routeId?: number } = {},
) {
  assertTransportPermission(actor, 'transport.application.review');
  const app = await assertTransportCollege('transport_applications', applicationId, actor.collegeId);
  if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
    throw new AppError(400, 'Application is not pending review');
  }

  const cycle = await db('transport_application_cycles').where({ id: app.application_cycle_id }).first();

  if (decision === 'APPROVE') {
    const routeId = input.routeId ?? app.preferred_route_id;
    if (routeId) {
      const cap = await checkRouteCapacity(actor.collegeId, Number(routeId));
      if (!cap.ok) {
        decision = 'WAITLIST';
      }
    }
  }

  if (decision === 'WAITLIST') {
    await db.transaction(async (trx) => {
      await trx('transport_applications').where({ id: applicationId }).update({
        status: 'WAITLISTED',
        reviewed_by: actor.facultyUserId,
        reviewed_at: trx.fn.now(),
      });
      const count = await trx('transport_waitlist_entries')
        .where({ college_id: actor.collegeId, route_id: input.routeId ?? app.preferred_route_id, status: 'ACTIVE' })
        .count({ c: '*' })
        .first();
      await trx('transport_waitlist_entries').insert({
        college_id: actor.collegeId,
        application_id: applicationId,
        route_id: input.routeId ?? app.preferred_route_id,
        stop_id: app.pickup_stop_preference_id,
        position: Number(count?.c ?? 0) + 1,
        status: 'ACTIVE',
      });
    });
    await notifyTransportEvent({
      studentId: Number(app.student_id),
      collegeId: actor.collegeId,
      type: 'TRANSPORT_WAITLISTED',
      title: 'Transport waitlisted',
      body: 'Your transport application has been waitlisted due to capacity.',
      relatedType: 'TRANSPORT_APPLICATION',
      relatedId: applicationId,
    });
    return { id: applicationId, status: 'WAITLISTED' };
  }

  if (decision === 'REJECT') {
    await db('transport_applications').where({ id: applicationId }).update({
      status: 'REJECTED',
      reviewed_by: actor.facultyUserId,
      reviewed_at: db.fn.now(),
      rejection_reason: input.rejectionReason ?? null,
    });
    await notifyTransportEvent({
      studentId: Number(app.student_id),
      collegeId: actor.collegeId,
      type: 'TRANSPORT_REJECTED',
      title: 'Transport application rejected',
      body: input.rejectionReason ?? 'Your transport application was not approved.',
      relatedType: 'TRANSPORT_APPLICATION',
      relatedId: applicationId,
    });
    return { id: applicationId, status: 'REJECTED' };
  }

  await db('transport_applications').where({ id: applicationId }).update({
    status: 'APPROVED',
    reviewed_by: actor.facultyUserId,
    reviewed_at: db.fn.now(),
  });

  const policy = await getTransportPolicy(actor.collegeId);
  if (policy.assignmentPaymentPolicy !== 'NO_PAYMENT_BLOCK') {
    await createTransportFeeDemand(
      actor.collegeId,
      Number(app.student_id),
      applicationId,
      Number(cycle?.academic_year_id),
      input.routeId ? Number(input.routeId) : undefined,
    );
  }

  await recordTransportAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'APPLICATION_APPROVED',
    entityType: 'TRANSPORT_APPLICATION',
    entityId: applicationId,
  });

  await notifyTransportEvent({
    studentId: Number(app.student_id),
    collegeId: actor.collegeId,
    type: 'TRANSPORT_APPROVED',
    title: 'Transport application approved',
    body: 'Your transport application has been approved.',
    relatedType: 'TRANSPORT_APPLICATION',
    relatedId: applicationId,
  });

  return { id: applicationId, status: 'APPROVED' };
}
