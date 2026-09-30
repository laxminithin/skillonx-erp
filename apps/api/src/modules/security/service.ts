import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { findVendorRef } from '../procurement/service.js';
import { assertSecurityPermission } from './access.js';
import {
  INCIDENT_STATUS_TRANSITIONS,
  TERMINAL_INCIDENT_STATUSES,
  TERMINAL_VISIT_STATUSES,
  VISIT_STATUS_TRANSITIONS,
  type IncidentStatus,
  type SecurityActor,
  type VisitStatus,
  gateSchema,
  gateStatusSchema,
  incidentSchema,
  incidentStatusSchema,
  visitCancelSchema,
  visitCheckInSchema,
  visitCheckOutSchema,
  visitDecisionSchema,
  visitorRequestSchema,
} from './types.js';

export {
  gateSchema,
  gateStatusSchema,
  incidentSchema,
  incidentStatusSchema,
  visitCancelSchema,
  visitCheckInSchema,
  visitCheckOutSchema,
  visitDecisionSchema,
  visitorRequestSchema,
};

function n(value: unknown) {
  return Number(value ?? 0);
}

function shape(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), v]));
}

async function assertCollegeRow(trx: Knex.Transaction | typeof db, table: string, collegeId: number, id: number) {
  const row = await trx(table).where({ id, college_id: collegeId }).first();
  if (!row) throw new AppError(404, 'Record not found');
  return row;
}

async function recordVisitEvent(
  trx: Knex.Transaction,
  actor: SecurityActor,
  visitId: number,
  eventType: string,
  gateId: number | null | undefined,
  remarks?: string | null,
) {
  await trx('security_visit_events').insert({
    college_id: actor.collegeId,
    visit_id: visitId,
    event_type: eventType,
    gate_id: gateId ?? null,
    recorded_by_faculty_id: actor.facultyUserId,
    remarks: remarks ?? null,
  });
}

// ── Gate / Location master ────────────────────────────────────────────────

export async function createGate(actor: SecurityActor, input: z.infer<typeof gateSchema>) {
  assertSecurityPermission(actor, 'security.gate.manage');
  const [id] = await db('security_gates').insert({
    college_id: actor.collegeId,
    name: input.name,
    code: input.code ?? null,
    gate_type: input.gateType ?? 'GENERAL',
    location_note: input.locationNote ?? null,
    is_active: true,
    created_by: actor.facultyUserId,
  });
  return getGate(actor, n(id));
}

export async function listGates(actor: SecurityActor, opts: { activeOnly?: boolean } = {}) {
  assertSecurityPermission(actor, 'security.gate.view');
  let query = db('security_gates').where({ college_id: actor.collegeId });
  if (opts.activeOnly) query = query.andWhere({ is_active: true });
  const rows = await query.select('*').orderBy('name');
  return rows.map(shape);
}

export async function getGate(actor: SecurityActor, gateId: number) {
  assertSecurityPermission(actor, 'security.gate.view');
  const row = await db('security_gates').where({ id: gateId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Gate not found');
  return shape(row);
}

export async function setGateStatus(actor: SecurityActor, gateId: number, input: z.infer<typeof gateStatusSchema>) {
  assertSecurityPermission(actor, 'security.gate.manage');
  await assertCollegeRow(db, 'security_gates', actor.collegeId, gateId);
  await db('security_gates').where({ id: gateId }).update({ is_active: input.isActive, updated_at: db.fn.now() });
  return getGate(actor, gateId);
}

/**
 * Cross-module read-only accessor, mirroring the established convention
 * (`procurement/service.ts:findVendorRef`, `assetManagement/service.ts:findAssetRef`)
 * for another module to reference the gate master without duplicating it.
 */
export async function findGateRef(collegeId: number, gateId: number | null | undefined) {
  if (!gateId) return null;
  const row = await db('security_gates').where({ id: gateId, college_id: collegeId }).select('id', 'name', 'gate_type', 'is_active').first();
  return row ? shape(row) : null;
}

// ── Host / vendor validation (never trust the client) ────────────────────

async function resolveHost(collegeId: number, hostType: 'FACULTY' | 'STUDENT', hostFacultyId?: number | null, hostStudentId?: number | null) {
  if (hostType === 'FACULTY') {
    if (!hostFacultyId) throw new AppError(400, 'hostFacultyId is required for a FACULTY host');
    const row = await db('faculty_users').where({ id: hostFacultyId, college_id: collegeId }).first();
    if (!row) throw new AppError(400, 'Host does not resolve to an active user in this college');
    if (!row.is_active) throw new AppError(400, 'Host account is not active');
    return { hostFacultyId: n(row.id), hostStudentId: null };
  }
  if (!hostStudentId) throw new AppError(400, 'hostStudentId is required for a STUDENT host');
  const row = await db('students').where({ id: hostStudentId, college_id: collegeId }).first();
  if (!row) throw new AppError(400, 'Host does not resolve to an active user in this college');
  return { hostFacultyId: null, hostStudentId: n(row.id) };
}

// ── Visit lifecycle ────────────────────────────────────────────────────────

export async function requestVisit(actor: SecurityActor, input: z.infer<typeof visitorRequestSchema>) {
  assertSecurityPermission(actor, 'security.visitor.request');

  const hostType = input.hostType ?? 'FACULTY';
  const host = await resolveHost(actor.collegeId, hostType, input.hostFacultyId, input.hostStudentId);

  const visitType = input.visitType ?? 'GUEST';
  if ((visitType === 'VENDOR' || visitType === 'CONTRACTOR') && !input.vendorId) {
    throw new AppError(400, 'vendorId is required for a VENDOR/CONTRACTOR visit');
  }
  if (input.vendorId) {
    const vendor = await findVendorRef(actor.collegeId, input.vendorId);
    if (!vendor) throw new AppError(404, 'Vendor not found');
    if (!vendor.isActive) throw new AppError(400, 'Vendor is not active');
  }
  if (input.gateId) await assertCollegeRow(db, 'security_gates', actor.collegeId, input.gateId);

  return db.transaction(async (trx) => {
    const [visitorId] = await trx('security_visitors').insert({
      college_id: actor.collegeId,
      name: input.visitorName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      id_type: input.idType ?? null,
      id_reference_masked: input.idReferenceMasked ?? null,
      photo_document_id: input.photoDocumentId ?? null,
    });

    const [visitId] = await trx('security_visits').insert({
      college_id: actor.collegeId,
      visitor_id: n(visitorId),
      gate_id: input.gateId ?? null,
      visit_type: visitType,
      purpose: input.purpose ?? null,
      host_type: hostType,
      host_faculty_id: host.hostFacultyId,
      host_student_id: host.hostStudentId,
      vendor_id: input.vendorId ?? null,
      requested_by_faculty_id: actor.facultyUserId,
      status: 'REQUESTED',
      expected_entry_at: input.expectedEntryAt ?? null,
      expected_exit_at: input.expectedExitAt ?? null,
      valid_until: input.validUntil ?? null,
    });

    await recordVisitEvent(trx, actor, n(visitId), 'REQUESTED', input.gateId, input.purpose);
    return getVisit(actor, n(visitId), trx);
  });
}

async function lockVisit(trx: Knex.Transaction, collegeId: number, visitId: number) {
  const row = await trx('security_visits').where({ id: visitId, college_id: collegeId }).forUpdate().first();
  if (!row) throw new AppError(404, 'Visit not found');
  return row;
}

function isExpired(visit: Record<string, unknown>) {
  return !!visit.valid_until && new Date(visit.valid_until as string).getTime() < Date.now();
}

function assertTransition(current: VisitStatus, next: VisitStatus) {
  if (TERMINAL_VISIT_STATUSES.has(current)) {
    throw new AppError(400, `Visit is already ${current}, a terminal state`);
  }
  const allowed = VISIT_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new AppError(400, `Invalid visit status transition from ${current} to ${next}`);
  }
}

/**
 * Runs in its own, short-lived transaction (not the caller's) so that when a
 * stale request/approval is found to be past `valid_until`, the EXPIRED
 * transition and its event row are committed even though the caller's own
 * transaction subsequently throws and rolls back — an error thrown after a
 * write inside `db.transaction` rolls back that write too, so auto-expiry
 * must not share a transaction with the rejection it triggers.
 */
async function autoExpireIfNeeded(actor: SecurityActor, visitId: number) {
  await db.transaction(async (trx) => {
    const visit = await trx('security_visits').where({ id: visitId, college_id: actor.collegeId }).forUpdate().first();
    if (!visit) return;
    const current = visit.status as VisitStatus;
    if (current !== 'EXPIRED' && !TERMINAL_VISIT_STATUSES.has(current) && isExpired(visit)) {
      await trx('security_visits').where({ id: visitId }).update({ status: 'EXPIRED', updated_at: trx.fn.now() });
      await recordVisitEvent(trx, actor, visitId, 'EXPIRED', null);
    }
  });
}

export async function decideVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitDecisionSchema>) {
  assertSecurityPermission(actor, 'security.visitor.approve');
  await autoExpireIfNeeded(actor, visitId);
  return db.transaction(async (trx) => {
    const visit = await lockVisit(trx, actor.collegeId, visitId);
    const current = visit.status as VisitStatus;
    const next: VisitStatus = input.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    assertTransition(current, next);
    await trx('security_visits').where({ id: visitId }).update({
      status: next,
      approved_by_faculty_id: actor.facultyUserId,
      rejected_reason: next === 'REJECTED' ? (input.reason ?? null) : null,
      updated_at: trx.fn.now(),
    });
    await recordVisitEvent(trx, actor, visitId, next, null, input.reason);
    return getVisit(actor, visitId, trx);
  });
}

export async function cancelVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCancelSchema>) {
  assertSecurityPermission(actor, 'security.visitor.request');
  return db.transaction(async (trx) => {
    const visit = await lockVisit(trx, actor.collegeId, visitId);
    const current = visit.status as VisitStatus;
    assertTransition(current, 'CANCELLED');
    await trx('security_visits').where({ id: visitId }).update({ status: 'CANCELLED', updated_at: trx.fn.now() });
    await recordVisitEvent(trx, actor, visitId, 'CANCELLED', null, input.reason);
    return getVisit(actor, visitId, trx);
  });
}

/**
 * Concurrency-safe check-in: a row lock (`forUpdate`) inside a transaction
 * guarantees that if two check-in requests race for the same visit, only the
 * first to acquire the lock observes status === 'APPROVED' and transitions
 * it; the second sees the already-updated status and is rejected. This
 * mirrors `transport/passes.ts:activatePass` and
 * `assetManagement/service.ts:lockAsset`, the codebase's own precedent for
 * this exact class of problem.
 */
export async function checkInVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCheckInSchema>) {
  assertSecurityPermission(actor, 'security.visitor.checkinout');
  if (input.gateId) await assertCollegeRow(db, 'security_gates', actor.collegeId, input.gateId);
  await autoExpireIfNeeded(actor, visitId);

  return db.transaction(async (trx) => {
    const visit = await lockVisit(trx, actor.collegeId, visitId);
    const current = visit.status as VisitStatus;

    assertTransition(current, 'CHECKED_IN');

    // The conditional row lock above already prevents a second concurrent
    // caller from reading a stale 'APPROVED' row; this WHERE clause is a
    // second, belt-and-braces guard so the UPDATE itself is a no-op if
    // anything else changed the status between the lock and this write.
    const updated = await trx('security_visits')
      .where({ id: visitId, status: 'APPROVED' })
      .update({ status: 'CHECKED_IN', gate_id: input.gateId ?? visit.gate_id, entry_at: trx.fn.now(), updated_at: trx.fn.now() });
    if (!updated) throw new AppError(400, 'Visit must be approved before check-in');

    await recordVisitEvent(trx, actor, visitId, 'CHECKED_IN', input.gateId ?? (visit.gate_id as number | null), input.remarks);
    return getVisit(actor, visitId, trx);
  });
}

/**
 * Idempotent, race-safe checkout: the same row-lock + conditional-update
 * pattern as `checkInVisit`. A second concurrent (or accidental duplicate)
 * checkout call sees status already CHECKED_OUT and is rejected rather than
 * writing a second exit event or overwriting `exit_at`.
 */
export async function checkOutVisit(actor: SecurityActor, visitId: number, input: z.infer<typeof visitCheckOutSchema>) {
  assertSecurityPermission(actor, 'security.visitor.checkinout');
  if (input.gateId) await assertCollegeRow(db, 'security_gates', actor.collegeId, input.gateId);

  return db.transaction(async (trx) => {
    const visit = await lockVisit(trx, actor.collegeId, visitId);
    const current = visit.status as VisitStatus;
    assertTransition(current, 'CHECKED_OUT');

    const updated = await trx('security_visits')
      .where({ id: visitId, status: 'CHECKED_IN' })
      .update({ status: 'CHECKED_OUT', gate_id: input.gateId ?? visit.gate_id, exit_at: trx.fn.now(), updated_at: trx.fn.now() });
    if (!updated) throw new AppError(400, 'Visit must be checked in before check-out');

    await recordVisitEvent(trx, actor, visitId, 'CHECKED_OUT', input.gateId ?? (visit.gate_id as number | null), input.remarks);
    return getVisit(actor, visitId, trx);
  });
}

export async function getVisit(actor: SecurityActor, visitId: number, trx: Knex.Transaction | typeof db = db) {
  assertSecurityPermission(actor, 'security.visitor.view');
  const visit = await trx('security_visits as v')
    .join('security_visitors as vis', 'vis.id', 'v.visitor_id')
    .leftJoin('security_gates as g', 'g.id', 'v.gate_id')
    .leftJoin('faculty_users as hf', 'hf.id', 'v.host_faculty_id')
    .leftJoin('students as hs', 'hs.id', 'v.host_student_id')
    .where({ 'v.id': visitId, 'v.college_id': actor.collegeId })
    .select(
      'v.*',
      'vis.name as visitor_name', 'vis.phone as visitor_phone', 'vis.email as visitor_email',
      'vis.id_type as visitor_id_type', 'vis.id_reference_masked as visitor_id_reference_masked',
      'vis.photo_document_id as visitor_photo_document_id',
      'g.name as gate_name',
      'hf.name as host_faculty_name', 'hs.name as host_student_name',
    )
    .first();
  if (!visit) throw new AppError(404, 'Visit not found');

  let vendorName: string | null = null;
  if (visit.vendor_id) {
    const vendor = await findVendorRef(actor.collegeId, n(visit.vendor_id));
    vendorName = (vendor?.name as string | undefined) ?? null;
  }

  const events = await trx('security_visit_events as e')
    .leftJoin('security_gates as g', 'g.id', 'e.gate_id')
    .leftJoin('faculty_users as u', 'u.id', 'e.recorded_by_faculty_id')
    .where({ 'e.college_id': actor.collegeId, 'e.visit_id': visitId })
    .select('e.*', 'g.name as gate_name', 'u.name as recorded_by_name')
    .orderBy('e.id', 'desc');

  return {
    ...shape(visit),
    vendorName,
    events: events.map(shape),
  };
}

export async function listVisits(
  actor: SecurityActor,
  filters: { status?: string; gateId?: number; visitType?: string } = {},
) {
  assertSecurityPermission(actor, 'security.visitor.view');
  let query = db('security_visits as v')
    .join('security_visitors as vis', 'vis.id', 'v.visitor_id')
    .leftJoin('security_gates as g', 'g.id', 'v.gate_id')
    .where('v.college_id', actor.collegeId);
  if (filters.status) query = query.andWhere('v.status', filters.status);
  if (filters.gateId) query = query.andWhere('v.gate_id', filters.gateId);
  if (filters.visitType) query = query.andWhere('v.visit_type', filters.visitType);
  const rows = await query
    .select('v.*', 'vis.name as visitor_name', 'vis.phone as visitor_phone', 'g.name as gate_name')
    .orderBy('v.id', 'desc')
    .limit(500);
  return rows.map(shape);
}

// ── Security Incident log ─────────────────────────────────────────────────

export async function reportIncident(actor: SecurityActor, input: z.infer<typeof incidentSchema>) {
  assertSecurityPermission(actor, 'security.incident.report');
  if (input.gateId) await assertCollegeRow(db, 'security_gates', actor.collegeId, input.gateId);

  const [id] = await db('security_incidents').insert({
    college_id: actor.collegeId,
    category: input.category,
    gate_id: input.gateId ?? null,
    location_note: input.locationNote ?? null,
    reported_by_faculty_id: actor.facultyUserId,
    description: input.description,
    severity: input.severity ?? 'LOW',
    occurred_at: input.occurredAt ?? new Date(),
    status: 'OPEN',
    evidence_document_id: input.evidenceDocumentId ?? null,
  });
  return getIncident(actor, n(id));
}

export async function updateIncidentStatus(actor: SecurityActor, incidentId: number, input: z.infer<typeof incidentStatusSchema>) {
  assertSecurityPermission(actor, 'security.incident.manage');
  return db.transaction(async (trx) => {
    const incident = await trx('security_incidents').where({ id: incidentId, college_id: actor.collegeId }).forUpdate().first();
    if (!incident) throw new AppError(404, 'Incident not found');
    const current = incident.status as IncidentStatus;
    if (TERMINAL_INCIDENT_STATUSES.has(current)) {
      throw new AppError(400, `Incident is already ${current}, a terminal state`);
    }
    const allowed = INCIDENT_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(input.status)) {
      throw new AppError(400, `Invalid incident status transition from ${current} to ${input.status}`);
    }
    await trx('security_incidents').where({ id: incidentId }).update({
      status: input.status,
      resolution_notes: input.resolutionNotes ?? incident.resolution_notes,
      resolved_by_faculty_id: ['RESOLVED', 'CLOSED'].includes(input.status) ? actor.facultyUserId : incident.resolved_by_faculty_id,
      resolved_at: ['RESOLVED', 'CLOSED'].includes(input.status) ? trx.fn.now() : incident.resolved_at,
      updated_at: trx.fn.now(),
    });
    return getIncident(actor, incidentId, trx);
  });
}

/**
 * Incident detail is privacy-scoped by RBAC alone (`security.incident.view`
 * — only Security Manager/Guard + admin/management tier hold it; general
 * Faculty/Student roles have no permission for it and no route ever exposes
 * this to them), matching the approved scope's privacy requirement.
 */
export async function getIncident(actor: SecurityActor, incidentId: number, trx: Knex.Transaction | typeof db = db) {
  assertSecurityPermission(actor, 'security.incident.view');
  const row = await trx('security_incidents as i')
    .leftJoin('security_gates as g', 'g.id', 'i.gate_id')
    .leftJoin('faculty_users as r', 'r.id', 'i.reported_by_faculty_id')
    .leftJoin('faculty_users as rv', 'rv.id', 'i.resolved_by_faculty_id')
    .where({ 'i.id': incidentId, 'i.college_id': actor.collegeId })
    .select('i.*', 'g.name as gate_name', 'r.name as reported_by_name', 'rv.name as resolved_by_name')
    .first();
  if (!row) throw new AppError(404, 'Incident not found');
  return shape(row);
}

export async function listIncidents(actor: SecurityActor, filters: { status?: string; severity?: string; category?: string } = {}) {
  assertSecurityPermission(actor, 'security.incident.view');
  let query = db('security_incidents as i')
    .leftJoin('security_gates as g', 'g.id', 'i.gate_id')
    .where('i.college_id', actor.collegeId);
  if (filters.status) query = query.andWhere('i.status', filters.status);
  if (filters.severity) query = query.andWhere('i.severity', filters.severity);
  if (filters.category) query = query.andWhere('i.category', filters.category);
  const rows = await query.select('i.*', 'g.name as gate_name').orderBy('i.id', 'desc').limit(500);
  return rows.map(shape);
}
