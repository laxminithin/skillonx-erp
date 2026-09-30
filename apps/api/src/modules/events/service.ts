import type { Knex } from 'knex';
import type { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import * as workflowEngine from '../workflowEngine/service.js';
import { hasWorkflowPermission } from '../workflowEngine/access.js';
import type { WorkflowActor } from '../workflowEngine/types.js';
import * as documentEngine from '../documentEngine/service.js';
import type { DocumentActor } from '../documentEngine/types.js';
import { notifyFaculty } from '../maintenance/notify.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import {
  ORGANIZER_ROLES,
  assertEventsPermission,
  hasEventsPermission,
  hodDepartmentIds,
  isHodOfDepartment,
} from './access.js';
import { recordEventsAudit } from './audit.js';
import {
  BOOKING_TRX,
  confirmReservationsInTrx,
  evaluateAvailability,
  flatten,
  getResource,
  isDupError,
  loadResources,
  lockResources,
  shapeReservation,
  throwIfBlocked,
  windowFor,
  withDeadlockRetry,
  type Window,
} from './booking.js';
import { assertValidRange, fromDb, normalizeWall, nowWall, toApi, wallToMs } from './time.js';
import {
  DEFAULT_EVENT_TYPES,
  EDITABLE_EVENT_STATUSES,
  FROZEN_EVENT_STATUSES,
  MAX_CALENDAR_DAYS,
  MAX_EVENT_DAYS,
  type EventsActor,
  type StudentEventsActor,
  type attendanceSchema,
  type completeSchema,
  type eventDocumentSchema,
  type eventSchema,
  type eventTypeSchema,
  type externalParticipantSchema,
  type rescheduleSchema,
  type reviewSchema,
} from './types.js';

type Row = Record<string, any>;
type Conn = Knex.Transaction | typeof db;

const WF_ENTITY_TYPE = 'campus_event';
const DOC_ENTITY_TYPE = 'campus_event';
const PUBLISHED_STATUSES = ['SCHEDULED', 'COMPLETED', 'CLOSED'];

function n(v: unknown) {
  return Number(v ?? 0);
}

// ── Notifications (best-effort, always after commit) ───────────────────────
type Notifier = {
  faculty: typeof notifyFaculty;
  student: typeof notifyStudent;
};
const defaultNotifier: Notifier = { faculty: notifyFaculty, student: notifyStudent };
let notifier: Notifier = defaultNotifier;

/** Test seam for failure-recovery tests (notification failure must never roll back state). */
export function setEventsNotifierForTests(next: Partial<Notifier> | null) {
  notifier = next ? { ...defaultNotifier, ...next } : defaultNotifier;
}

async function safeNotify(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.warn('[events] notification failed', (err as Error)?.message);
  }
}

async function notifyOrganizer(ev: Row, type: string, title: string, body?: string) {
  await safeNotify(() => notifier.faculty({
    collegeId: n(ev.college_id),
    facultyUserId: n(ev.organizer_faculty_id),
    type,
    title,
    body: body ?? null,
    link: `/events/${n(ev.id)}`,
    relatedType: 'campus_event',
    relatedId: n(ev.id),
    dedupeKey: `${type}:${n(ev.id)}:${n(ev.reschedule_count)}`,
  }));
}

async function notifyStudentParticipants(ev: Row, type: string, title: string, body: string) {
  const regs = await db('campus_event_registrations')
    .where({ event_id: n(ev.id), status: 'REGISTERED', participant_type: 'STUDENT' })
    .select('student_id');
  for (const r of regs) {
    await safeNotify(() => notifier.student({
      studentId: n(r.student_id),
      collegeId: n(ev.college_id),
      type,
      title,
      body,
      link: `/lms/events/${n(ev.id)}`,
      relatedType: 'campus_event',
      relatedId: n(ev.id),
      dedupeKeyOverride: `${type}:${n(ev.id)}:${n(ev.reschedule_count)}`,
    }));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
async function collegeNow(collegeId: number) {
  const row = await db('colleges').where({ id: collegeId }).select('timezone').first();
  const tz = row?.timezone && String(row.timezone).trim() ? String(row.timezone).trim() : 'Asia/Kolkata';
  return nowWall(tz);
}

function toWorkflowActor(actor: EventsActor): WorkflowActor {
  return { facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId, role: actor.role, name: actor.name ?? null };
}

function systemWorkflowActor(actor: EventsActor): WorkflowActor {
  return { facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId, role: 'COLLEGE_ADMIN' };
}

/**
 * Organiser-side engine calls (start / resubmit / withdraw). Events RBAC has
 * already authorised the organiser; some organiser roles (e.g. PRINCIPAL,
 * OFFICE_ADMIN) lack the engine's start/act capability, so those calls run as
 * the system actor while keeping the real user id in engine history.
 */
function organizerWorkflowActor(actor: EventsActor, permission: 'workflow.instance.start' | 'workflow.instance.act'): WorkflowActor {
  const real = toWorkflowActor(actor);
  return hasWorkflowPermission(real, permission) ? real : systemWorkflowActor(actor);
}

/** Event authorization is enforced here first; the elevated actor only reads documents of the already-authorized event. */
function systemDocumentActor(collegeId: number, facultyUserId: number): DocumentActor {
  return { facultyUserId, collegeId, departmentId: null, role: 'COLLEGE_ADMIN' };
}

function isOwner(actor: EventsActor, ev: Row) {
  return n(ev.organizer_faculty_id) === actor.facultyUserId || n(ev.created_by) === actor.facultyUserId;
}

function canViewInternal(actor: EventsActor, ev: Row) {
  if (isAdminRole(actor.role) || hasEventsPermission(actor, 'events.event.viewAll')) return true;
  if (isOwner(actor, ev)) return true;
  return isHodOfDepartment(actor, ev.department_id != null ? n(ev.department_id) : null);
}

function canViewPublished(actor: EventsActor, ev: Row) {
  if (!PUBLISHED_STATUSES.includes(String(ev.status))) return false;
  if (ev.visibility === 'INSTITUTION') return true;
  return ev.department_id != null && (n(ev.department_id) === n(actor.departmentId) || isHodOfDepartment(actor, n(ev.department_id)));
}

async function loadEvent(conn: Conn, collegeId: number, eventId: number, lock = false) {
  let q = conn('campus_events').where({ id: eventId, college_id: collegeId });
  if (lock) q = q.forUpdate();
  const row = await q.first();
  if (!row) throw new AppError(404, 'Event not found');
  return row as Row;
}

function assertCanManage(actor: EventsActor, ev: Row) {
  if (!canViewInternal(actor, ev) && !canViewPublished(actor, ev)) throw new AppError(404, 'Event not found');
  if (!isOwner(actor, ev) && !isAdminRole(actor.role)) {
    throw new AppError(403, 'Only the organiser can manage this event');
  }
}

function requiredCapacity(ev: Row) {
  const expected = ev.expected_participants != null ? n(ev.expected_participants) : 0;
  const reg = ev.registration_enabled && ev.registration_capacity != null ? n(ev.registration_capacity) : 0;
  const max = Math.max(expected, reg);
  return max > 0 ? max : null;
}

// ── Event types (configuration, lazily seeded per college) ────────────────
async function ensureEventTypes(collegeId: number) {
  const existing = await db('campus_event_types').where({ college_id: collegeId }).first();
  if (existing) return;
  for (const [i, t] of DEFAULT_EVENT_TYPES.entries()) {
    try {
      await db('campus_event_types').insert({ college_id: collegeId, code: t.code, name: t.name, sort_order: i });
    } catch (err) {
      if (!isDupError(err)) throw err;
    }
  }
}

export async function listEventTypes(actor: { collegeId: number; role: string }) {
  await ensureEventTypes(actor.collegeId);
  const rows = await db('campus_event_types').where({ college_id: actor.collegeId }).orderBy('sort_order').orderBy('name');
  return rows.map((r) => ({ id: n(r.id), code: r.code, name: r.name, isActive: Boolean(r.is_active) }));
}

export async function saveEventType(actor: EventsActor, input: z.infer<typeof eventTypeSchema>) {
  assertEventsPermission(actor, 'events.resource.manage');
  await ensureEventTypes(actor.collegeId);
  const existing = await db('campus_event_types').where({ college_id: actor.collegeId, code: input.code }).first();
  if (existing) {
    await db('campus_event_types').where({ id: existing.id }).update({ name: input.name, is_active: input.isActive ?? true, updated_at: db.fn.now() });
  } else {
    await db('campus_event_types').insert({ college_id: actor.collegeId, code: input.code, name: input.name, is_active: input.isActive ?? true, sort_order: 100 });
  }
  await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_TYPE_SAVED', entityType: 'campus_event_type', entityId: existing ? n(existing.id) : null, after: input });
  return listEventTypes(actor);
}

// ── Shaping ───────────────────────────────────────────────────────────────
async function eventContext(ev: Row) {
  const [reservations, dept, organizer, regCounts] = await Promise.all([
    db('campus_resource_reservations').where({ event_id: n(ev.id) }).orderBy('id'),
    ev.department_id != null ? db('departments').where({ id: n(ev.department_id) }).select('name').first() : null,
    db('faculty_users').where({ id: n(ev.organizer_faculty_id) }).select('name').first(),
    db('campus_event_registrations').where({ event_id: n(ev.id), status: 'REGISTERED' })
      .select(db.raw('COUNT(*) as registered'), db.raw("SUM(CASE WHEN attendance_status = 'ATTENDED' THEN 1 ELSE 0 END) as attended"))
      .first(),
  ]);
  const resources = await loadResources(db, n(ev.college_id), [...new Set(reservations.map((r: Row) => n(r.resource_id)))]);
  const byId = new Map(resources.map((r) => [r.id, r]));
  return {
    reservations,
    byId,
    departmentName: dept?.name ?? null,
    organizerName: organizer?.name ?? null,
    registered: n(regCounts?.registered),
    attended: n(regCounts?.attended),
  };
}

function publicShape(ev: Row, ctx: Awaited<ReturnType<typeof eventContext>>) {
  const venues = ctx.reservations
    .filter((r: Row) => r.status === 'CONFIRMED' && ctx.byId.get(n(r.resource_id))?.resourceKind === 'ROOM')
    .map((r: Row) => ctx.byId.get(n(r.resource_id))!.name);
  const capacity = ev.registration_capacity != null ? n(ev.registration_capacity) : null;
  return {
    id: n(ev.id),
    title: ev.title,
    eventType: ev.event_type,
    description: ev.description ?? null,
    objective: ev.objective ?? null,
    organizerUnitType: ev.organizer_unit_type,
    organizerUnitName: ev.organizer_unit_name ?? null,
    departmentId: ev.department_id != null ? n(ev.department_id) : null,
    departmentName: ctx.departmentName,
    organizerName: ctx.organizerName,
    startsAt: toApi(fromDb(ev.starts_at)),
    endsAt: toApi(fromDb(ev.ends_at)),
    venues,
    externalVenue: ev.external_venue ?? null,
    visibility: ev.visibility,
    status: ev.status,
    registrationEnabled: Boolean(ev.registration_enabled),
    registrationAudience: ev.registration_audience,
    registrationCapacity: capacity,
    registrationClosesAt: toApi(fromDb(ev.registration_closes_at)),
    seatsRemaining: capacity != null ? Math.max(0, capacity - ctx.registered) : null,
  };
}

async function internalShape(actor: EventsActor, ev: Row) {
  const ctx = await eventContext(ev);
  let workflow: unknown = null;
  if (ev.workflow_instance_id != null) {
    const inst = await db('workflow_instances').where({ id: n(ev.workflow_instance_id), college_id: n(ev.college_id) }).first();
    if (inst) {
      const step = await db('workflow_steps').where({ id: inst.current_step_id }).first();
      const history = await db('workflow_instance_history as h')
        .leftJoin('faculty_users as f', 'f.id', 'h.actor_id')
        .where({ 'h.instance_id': inst.id })
        .orderBy('h.id')
        .select('h.action', 'h.role_at_action', 'h.remarks', 'h.resulting_status', 'h.created_at', 'f.name as actor_name');
      workflow = {
        instanceId: n(inst.id),
        status: inst.status,
        currentStep: step ? { key: step.step_key, name: step.name, allowedRoles: typeof step.allowed_roles === 'string' ? JSON.parse(step.allowed_roles) : step.allowed_roles } : null,
        history: history.map((h) => ({ action: h.action, role: h.role_at_action, actorName: h.actor_name, remarks: h.remarks, resultingStatus: h.resulting_status, at: h.created_at })),
      };
    }
  }
  return {
    ...publicShape(ev, ctx),
    view: 'INTERNAL' as const,
    organizerFacultyId: n(ev.organizer_faculty_id),
    createdBy: n(ev.created_by),
    expectedParticipants: ev.expected_participants != null ? n(ev.expected_participants) : null,
    hasExternalParticipants: Boolean(ev.has_external_participants),
    plannedBudget: ev.planned_budget != null ? Number(ev.planned_budget) : null,
    reviewRemarks: ev.review_remarks ?? null,
    lastSchedulingError: ev.last_scheduling_error ?? null,
    capacityOverride: Boolean(ev.capacity_override),
    capacityOverrideReason: ev.capacity_override_reason ?? null,
    outcomeSummary: ev.outcome_summary ?? null,
    actualParticipants: ev.actual_participants != null ? n(ev.actual_participants) : null,
    cancellationReason: ev.cancellation_reason ?? null,
    rescheduleCount: n(ev.reschedule_count),
    registeredCount: ctx.registered,
    attendedCount: ctx.attended,
    reservations: ctx.reservations.map((r: Row) => shapeReservation(r, ctx.byId.get(n(r.resource_id)))),
    workflow,
    canManage: isOwner(actor, ev) || isAdminRole(actor.role),
    submittedAt: ev.submitted_at ?? null,
    approvedAt: ev.approved_at ?? null,
    scheduledAt: ev.scheduled_at ?? null,
    completedAt: ev.completed_at ?? null,
    closedAt: ev.closed_at ?? null,
    cancelledAt: ev.cancelled_at ?? null,
    createdAt: ev.created_at,
  };
}

async function shapeFor(actor: EventsActor, ev: Row) {
  if (canViewInternal(actor, ev)) return internalShape(actor, ev);
  if (canViewPublished(actor, ev)) return { ...publicShape(ev, await eventContext(ev)), view: 'PUBLIC' as const };
  throw new AppError(404, 'Event not found');
}

// ── Create / update ───────────────────────────────────────────────────────
async function validateEventInput(actor: EventsActor, input: z.infer<typeof eventSchema>) {
  await ensureEventTypes(actor.collegeId);
  const type = await db('campus_event_types').where({ college_id: actor.collegeId, code: input.eventType, is_active: true }).first();
  if (!type) throw new AppError(400, `Unknown or inactive event type ${input.eventType}`);
  if (input.organizerUnitType === 'DEPARTMENT' && input.departmentId == null) {
    throw new AppError(400, 'A department event needs a department');
  }
  if (input.departmentId != null) {
    const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
    if (!dept) throw new AppError(404, 'Department not found');
  }
  if (input.visibility === 'DEPARTMENT' && input.departmentId == null) {
    throw new AppError(400, 'Department visibility needs a department');
  }
  const startsAt = normalizeWall(input.startsAt);
  const endsAt = normalizeWall(input.endsAt);
  assertValidRange(startsAt, endsAt, MAX_EVENT_DAYS);
  if (startsAt <= (await collegeNow(actor.collegeId))) throw new AppError(400, 'An event must start in the future');
  const registrationClosesAt = input.registrationClosesAt ? normalizeWall(input.registrationClosesAt) : null;
  if (registrationClosesAt && registrationClosesAt > startsAt) {
    throw new AppError(400, 'Registration must close before the event starts');
  }
  return { startsAt, endsAt, registrationClosesAt };
}

function eventPayload(input: z.infer<typeof eventSchema>, times: { startsAt: string; endsAt: string; registrationClosesAt: string | null }) {
  return {
    title: input.title,
    event_type: input.eventType,
    description: input.description ?? null,
    objective: input.objective ?? null,
    organizer_unit_type: input.organizerUnitType,
    organizer_unit_name: input.organizerUnitName ?? null,
    department_id: input.departmentId ?? null,
    starts_at: times.startsAt,
    ends_at: times.endsAt,
    external_venue: input.externalVenue ?? null,
    expected_participants: input.expectedParticipants ?? null,
    visibility: input.visibility ?? 'INSTITUTION',
    registration_enabled: input.registrationEnabled ?? false,
    registration_audience: input.registrationAudience ?? 'ALL',
    registration_capacity: input.registrationCapacity ?? null,
    registration_closes_at: times.registrationClosesAt,
    has_external_participants: input.hasExternalParticipants ?? false,
    planned_budget: input.plannedBudget ?? null,
  };
}

export async function createEvent(actor: EventsActor, input: z.infer<typeof eventSchema>) {
  assertEventsPermission(actor, 'events.event.create');
  const times = await validateEventInput(actor, input);
  const id = await db.transaction(async (trx) => {
    const [newId] = await trx('campus_events').insert({
      college_id: actor.collegeId,
      ...eventPayload(input, times),
      organizer_faculty_id: actor.facultyUserId,
      created_by: actor.facultyUserId,
      status: 'DRAFT',
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_CREATED', entityType: 'campus_event', entityId: n(newId), after: { title: input.title, eventType: input.eventType, startsAt: times.startsAt, endsAt: times.endsAt } }, trx);
    return n(newId);
  });
  return getEvent(actor, id);
}

export async function updateEvent(actor: EventsActor, eventId: number, input: z.infer<typeof eventSchema>) {
  assertEventsPermission(actor, 'events.event.create');
  const times = await validateEventInput(actor, input);
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    if (!EDITABLE_EVENT_STATUSES.has(String(ev.status))) {
      throw new AppError(400, `An event in status ${ev.status} cannot be edited — use reschedule or cancel`);
    }
    const payload = eventPayload(input, times);
    await trx('campus_events').where({ id: eventId }).update({ ...payload, updated_at: trx.fn.now() });
    const active = await trx('campus_resource_reservations').where({ event_id: eventId }).whereIn('status', ['REQUESTED']);
    if (active.length) {
      const resources = await loadResources(trx, actor.collegeId, active.map((r) => n(r.resource_id)));
      for (const res of resources) {
        const w = windowFor(res, times.startsAt, times.endsAt);
        await trx('campus_resource_reservations').where({ event_id: eventId, resource_id: res.id }).update({
          starts_at: times.startsAt, ends_at: times.endsAt, block_starts_at: w.blockStart, block_ends_at: w.blockEnd, updated_at: trx.fn.now(),
        });
      }
    }
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_UPDATED', entityType: 'campus_event', entityId: eventId, before: { title: ev.title, startsAt: fromDb(ev.starts_at), endsAt: fromDb(ev.ends_at) }, after: { title: input.title, startsAt: times.startsAt, endsAt: times.endsAt } }, trx);
  });
  return getEvent(actor, eventId);
}

export async function getEvent(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  return shapeFor(actor, ev);
}

export async function listEvents(
  actor: EventsActor,
  filters: { status?: string; eventType?: string; departmentId?: number; from?: string; to?: string; q?: string; mine?: boolean; page?: number; pageSize?: number } = {},
) {
  assertEventsPermission(actor, 'events.event.view');
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  let q = db('campus_events as e').where('e.college_id', actor.collegeId);
  if (filters.status) q = q.andWhere('e.status', filters.status);
  if (filters.eventType) q = q.andWhere('e.event_type', filters.eventType);
  if (filters.departmentId) q = q.andWhere('e.department_id', filters.departmentId);
  if (filters.from) q = q.andWhere('e.ends_at', '>=', normalizeWall(`${filters.from.slice(0, 10)}T00:00`));
  if (filters.to) q = q.andWhere('e.starts_at', '<=', normalizeWall(`${filters.to.slice(0, 10)}T23:59`));
  if (filters.q) q = q.andWhere('e.title', 'like', `%${filters.q.replace(/[%_]/g, '')}%`);
  if (filters.mine) q = q.andWhere((b) => b.where('e.organizer_faculty_id', actor.facultyUserId).orWhere('e.created_by', actor.facultyUserId));
  if (!isAdminRole(actor.role) && !hasEventsPermission(actor, 'events.event.viewAll')) {
    const hodDepts = hodDepartmentIds(actor);
    q = q.andWhere((b) => {
      b.where('e.organizer_faculty_id', actor.facultyUserId)
        .orWhere('e.created_by', actor.facultyUserId)
        .orWhere((pub) => {
          pub.whereIn('e.status', PUBLISHED_STATUSES).andWhere((vis) => {
            vis.where('e.visibility', 'INSTITUTION');
            if (actor.departmentId != null) vis.orWhere('e.department_id', actor.departmentId);
          });
        });
      if (hodDepts.length) b.orWhereIn('e.department_id', hodDepts);
    });
  }
  const totalRow = await q.clone().count({ c: '*' }).first();
  const direction = filters.from && !filters.to ? 'asc' : 'desc';
  const rows = await q.clone()
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.organizer_faculty_id')
    .select('e.id', 'e.title', 'e.event_type', 'e.status', 'e.starts_at', 'e.ends_at', 'e.department_id', 'e.organizer_unit_type',
      'e.organizer_unit_name', 'e.organizer_faculty_id', 'e.created_by', 'e.visibility', 'e.registration_enabled', 'd.name as department_name', 'f.name as organizer_name')
    .orderBy('e.starts_at', direction)
    .orderBy('e.id', direction)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    page,
    pageSize,
    total: n(totalRow?.c),
    items: rows.map((r) => ({
      id: n(r.id),
      title: r.title,
      eventType: r.event_type,
      status: r.status,
      startsAt: toApi(fromDb(r.starts_at)),
      endsAt: toApi(fromDb(r.ends_at)),
      departmentId: r.department_id != null ? n(r.department_id) : null,
      departmentName: r.department_name ?? null,
      organizerUnitType: r.organizer_unit_type,
      organizerUnitName: r.organizer_unit_name ?? null,
      organizerName: r.organizer_name ?? null,
      visibility: r.visibility,
      registrationEnabled: Boolean(r.registration_enabled),
      isMine: n(r.organizer_faculty_id) === actor.facultyUserId || n(r.created_by) === actor.facultyUserId,
    })),
  };
}

// ── Capacity override (permission + reason + audit) ───────────────────────
export async function overrideCapacity(actor: EventsActor, eventId: number, reason: string) {
  assertEventsPermission(actor, 'events.capacity.override');
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
    if (FROZEN_EVENT_STATUSES.has(String(ev.status))) throw new AppError(400, `Cannot override capacity for an event in status ${ev.status}`);
    await trx('campus_events').where({ id: eventId }).update({
      capacity_override: true, capacity_override_reason: reason, capacity_override_by: actor.facultyUserId, updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_CAPACITY_OVERRIDDEN', entityType: 'campus_event', entityId: eventId, before: { capacityOverride: Boolean(ev.capacity_override) }, after: { capacityOverride: true }, reason }, trx);
  });
  return getEvent(actor, eventId);
}

// ── Event resources (venue + equipment) ───────────────────────────────────
export async function addEventResource(actor: EventsActor, eventId: number, resourceId: number) {
  assertEventsPermission(actor, 'events.reservation.request');
  await withDeadlockRetry(() => db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    const status = String(ev.status);
    if (!['DRAFT', 'RETURNED', 'APPROVED', 'SCHEDULED'].includes(status)) {
      throw new AppError(400, `Resources cannot be changed for an event in status ${status}`);
    }
    const [resource] = await lockResources(trx, actor.collegeId, [resourceId]);
    if (['APPROVED', 'SCHEDULED'].includes(status) && resource.requiresApproval) {
      throw new AppError(400, `${resource.name} needs facilities approval and cannot be added after the event was approved`);
    }
    const start = fromDb(ev.starts_at)!;
    const end = fromDb(ev.ends_at)!;
    const w = windowFor(resource, start, end);
    const existing = await trx('campus_resource_reservations').where({ event_id: eventId, resource_id: resourceId }).first();
    const blockers = await evaluateAvailability(trx, actor.collegeId, [resource], new Map([[resource.id, w]]), {
      excludeReservationIds: existing ? [n(existing.id)] : [],
      requiredCapacity: requiredCapacity(ev),
      capacityOverride: Boolean(ev.capacity_override),
    });
    throwIfBlocked(blockers);
    let reservationId: number;
    if (existing) {
      if (['REQUESTED', 'CONFIRMED'].includes(String(existing.status))) return;
      await trx('campus_resource_reservations').where({ id: existing.id }).update({
        status: 'REQUESTED', starts_at: start, ends_at: end, block_starts_at: w.blockStart, block_ends_at: w.blockEnd,
        decided_by: null, decided_at: null, cancelled_at: null, cancelled_by: null, requested_by: actor.facultyUserId, updated_at: trx.fn.now(),
      });
      reservationId = n(existing.id);
    } else {
      const [id] = await trx('campus_resource_reservations').insert({
        college_id: actor.collegeId, resource_id: resourceId, event_id: eventId, purpose: ev.title,
        starts_at: start, ends_at: end, block_starts_at: w.blockStart, block_ends_at: w.blockEnd,
        status: 'REQUESTED', requested_by: actor.facultyUserId,
      });
      reservationId = n(id);
    }
    if (status === 'SCHEDULED') {
      await trx('campus_resource_reservations').where({ id: reservationId }).update({ status: 'CONFIRMED', decided_by: actor.facultyUserId, decided_at: trx.fn.now() });
    }
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_RESOURCE_ADDED', entityType: 'campus_event', entityId: eventId, after: { resourceId, reservationId, confirmed: status === 'SCHEDULED' } }, trx);
  }, BOOKING_TRX));
  return getEvent(actor, eventId);
}

export async function removeEventResource(actor: EventsActor, eventId: number, reservationId: number) {
  assertEventsPermission(actor, 'events.reservation.request');
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    if (FROZEN_EVENT_STATUSES.has(String(ev.status)) || ev.status === 'UNDER_REVIEW') {
      throw new AppError(400, `Resources cannot be changed for an event in status ${ev.status}`);
    }
    const res = await trx('campus_resource_reservations').where({ id: reservationId, event_id: eventId, college_id: actor.collegeId }).first();
    if (!res) throw new AppError(404, 'Reservation not found');
    if (res.status === 'CANCELLED') return;
    await trx('campus_resource_reservations').where({ id: reservationId }).update({ status: 'CANCELLED', cancelled_at: trx.fn.now(), cancelled_by: actor.facultyUserId, updated_at: trx.fn.now() });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_RESOURCE_RELEASED', entityType: 'campus_event', entityId: eventId, before: { reservationId, status: res.status }, after: { status: 'CANCELLED' } }, trx);
  });
  return getEvent(actor, eventId);
}

// ── Approval via Workflow Engine ──────────────────────────────────────────
function workflowCodeFor(hasDepartment: boolean, needsFacilities: boolean) {
  return `CAMPUS_EVENT_${hasDepartment ? 'DEPT' : 'INST'}${needsFacilities ? '_FAC' : ''}`;
}

async function ensureWorkflowDefinition(actor: EventsActor, code: string) {
  const existing = await db('workflow_definitions').where({ college_id: actor.collegeId, code, entity_type: WF_ENTITY_TYPE, is_active: true }).first();
  if (existing) return existing;
  const hasDept = code.includes('_DEPT');
  const needsFac = code.endsWith('_FAC');
  const reviewSteps = [
    ...(hasDept ? [{ stepKey: 'HOD_REVIEW', name: 'HOD Review', allowedRoles: ['HOD'] }] : []),
    { stepKey: 'PRINCIPAL_REVIEW', name: 'Principal Review', allowedRoles: ['PRINCIPAL'] },
    ...(needsFac ? [{ stepKey: 'FACILITIES_REVIEW', name: 'Facilities Review', allowedRoles: ['FACILITIES_OFFICER'] }] : []),
  ];
  const approverRoles = ['HOD', 'PRINCIPAL', 'FACILITIES_OFFICER'];
  const steps = [
    ...reviewSteps.map((s, i) => ({ ...s, isInitial: i === 0 })),
    { stepKey: 'RETURNED', name: 'Returned to Organiser', allowedRoles: ORGANIZER_ROLES },
    { stepKey: 'APPROVED', name: 'Approved', allowedRoles: approverRoles, isTerminal: true, terminalStatus: 'APPROVED' as const },
    { stepKey: 'REJECTED', name: 'Rejected', allowedRoles: approverRoles, isTerminal: true, terminalStatus: 'REJECTED' as const },
    { stepKey: 'CANCELLED', name: 'Cancelled', allowedRoles: ORGANIZER_ROLES, isTerminal: true, terminalStatus: 'CANCELLED' as const },
  ];
  const transitions = [
    ...reviewSteps.flatMap((s, i) => [
      { fromStepKey: s.stepKey, action: 'APPROVE' as const, toStepKey: reviewSteps[i + 1]?.stepKey ?? 'APPROVED' },
      { fromStepKey: s.stepKey, action: 'REJECT' as const, toStepKey: 'REJECTED' },
      { fromStepKey: s.stepKey, action: 'RETURN' as const, toStepKey: 'RETURNED' },
    ]),
    { fromStepKey: 'RETURNED', action: 'SUBMIT' as const, toStepKey: reviewSteps[0].stepKey },
    { fromStepKey: 'RETURNED', action: 'CANCEL' as const, toStepKey: 'CANCELLED' },
  ];
  const sys = systemWorkflowActor(actor);
  let definition: Row | undefined;
  try {
    definition = await workflowEngine.createDefinition(sys, { code, name: `Institutional Event Approval (${code})`, entityType: WF_ENTITY_TYPE, steps, transitions }) as Row;
  } catch (err) {
    if (!isDupError(err)) throw err;
    definition = await db('workflow_definitions').where({ college_id: actor.collegeId, code, entity_type: WF_ENTITY_TYPE }).orderBy('version', 'desc').first();
    if (definition?.is_active) return definition;
  }
  await workflowEngine.publishDefinition(sys, n(definition!.id));
  return db('workflow_definitions').where({ id: n(definition!.id) }).first();
}

export async function submitEvent(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.create');
  const pre = await loadEvent(db, actor.collegeId, eventId);
  assertCanManage(actor, pre);
  const reservations = await db('campus_resource_reservations').where({ event_id: eventId }).whereIn('status', ['REQUESTED', 'CONFIRMED']);
  const resources = await loadResources(db, actor.collegeId, reservations.map((r) => n(r.resource_id)));
  // A HOD cannot approve their own department event, so the HOD step is skipped for it (Principal still reviews).
  const deptChain = pre.department_id != null && !isHodOfDepartment(actor, n(pre.department_id));
  const code = workflowCodeFor(deptChain, resources.some((r) => r.requiresApproval));
  await ensureWorkflowDefinition(actor, code);

  const result = await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    if (ev.status === 'UNDER_REVIEW') return { ev, changed: false };
    if (!EDITABLE_EVENT_STATUSES.has(String(ev.status))) throw new AppError(400, `Cannot submit an event in status ${ev.status}`);
    const cap = requiredCapacity(ev);
    if (cap != null && !ev.capacity_override) {
      const tooSmall = resources.find((r) => r.resourceKind === 'ROOM' && r.capacity != null && cap > r.capacity);
      if (tooSmall) throw new AppError(409, `${tooSmall.name} holds ${tooSmall.capacity}; ${cap} expected — reduce attendance or request a capacity override`, undefined, 'CAPACITY_CONFLICT');
    }
    let instanceId: number | null = ev.workflow_instance_id != null ? n(ev.workflow_instance_id) : null;
    if (ev.status === 'RETURNED' && instanceId != null && ev.workflow_code === code) {
      await workflowEngine.performAction(organizerWorkflowActor(actor, 'workflow.instance.act'), instanceId, { action: 'SUBMIT', remarks: null });
    } else {
      if (ev.status === 'RETURNED' && instanceId != null) {
        // Requested resources changed the required chain: close the old instance, start the right one.
        await workflowEngine.performAction(organizerWorkflowActor(actor, 'workflow.instance.act'), instanceId, { action: 'CANCEL', remarks: 'Approval chain changed on resubmission' });
      }
      const orphan = await db('workflow_instances')
        .join('workflow_definitions as d', 'd.id', 'workflow_instances.definition_id')
        .where({ 'workflow_instances.college_id': actor.collegeId, 'workflow_instances.entity_type': WF_ENTITY_TYPE, 'workflow_instances.entity_id': eventId, 'workflow_instances.status': 'IN_PROGRESS', 'd.code': code })
        .select('workflow_instances.id')
        .first();
      if (orphan) instanceId = n(orphan.id);
      else {
        const inst = await workflowEngine.startInstance(organizerWorkflowActor(actor, 'workflow.instance.start'), { definitionCode: code, entityType: WF_ENTITY_TYPE, entityId: eventId });
        instanceId = n((inst as Row).id);
      }
    }
    await trx('campus_events').where({ id: eventId }).update({
      status: 'UNDER_REVIEW', workflow_instance_id: instanceId, workflow_code: code, submitted_at: trx.fn.now(), updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_SUBMITTED', entityType: 'campus_event', entityId: eventId, before: { status: ev.status }, after: { status: 'UNDER_REVIEW', workflowCode: code, workflowInstanceId: instanceId } }, trx);
    return { ev, changed: true };
  });
  return getEvent(actor, eventId).then((out) => ({ ...out, idempotentReplay: !result.changed }));
}

export async function reviewEvent(actor: EventsActor, eventId: number, input: z.infer<typeof reviewSchema>) {
  assertEventsPermission(actor, 'events.event.review');
  const outcome = await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
    if (ev.status !== 'UNDER_REVIEW') throw new AppError(400, `Cannot review an event in status ${ev.status}`);
    if (isOwner(actor, ev)) throw new AppError(403, 'You cannot review an event you organise (self-approval is not allowed)');
    if (actor.role === 'HOD' && !isAdminRole(actor.role) && !isHodOfDepartment(actor, ev.department_id != null ? n(ev.department_id) : null)) {
      throw new AppError(403, "You are not the HOD of this event's department");
    }
    if ((input.action === 'RETURN' || input.action === 'REJECT') && !input.remarks) {
      throw new AppError(400, 'Remarks are required to return or reject an event');
    }
    const instance = await workflowEngine.performAction(toWorkflowActor(actor), n(ev.workflow_instance_id), { action: input.action, remarks: input.remarks ?? null }) as Row;
    let status = 'UNDER_REVIEW';
    if (input.action === 'RETURN') status = 'RETURNED';
    else if (input.action === 'REJECT') status = 'REJECTED';
    else if (instance.status === 'APPROVED') status = 'APPROVED';
    await trx('campus_events').where({ id: eventId }).update({
      status,
      review_remarks: input.remarks ?? ev.review_remarks ?? null,
      approved_at: status === 'APPROVED' ? trx.fn.now() : ev.approved_at,
      updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: `EVENT_REVIEW_${input.action}`, entityType: 'campus_event', entityId: eventId, before: { status: ev.status }, after: { status }, reason: input.remarks ?? null }, trx);
    return { ev, status };
  });
  const ev = outcome.ev;
  if (outcome.status === 'APPROVED') {
    try {
      await scheduleEventInternal(actor, eventId);
      await notifyOrganizer(ev, 'EVENT_SCHEDULED', `Event approved and scheduled: ${ev.title}`);
    } catch (err) {
      await notifyOrganizer(ev, 'EVENT_APPROVED_UNSCHEDULED', `Event approved but not yet scheduled: ${ev.title}`, (err as Error).message);
    }
  } else if (outcome.status === 'RETURNED') {
    await notifyOrganizer(ev, 'EVENT_RETURNED', `Event returned for changes: ${ev.title}`, input.remarks ?? undefined);
  } else if (outcome.status === 'REJECTED') {
    await notifyOrganizer(ev, 'EVENT_REJECTED', `Event rejected: ${ev.title}`, input.remarks ?? undefined);
  }
  return getEvent(actor, eventId);
}

/** Pending approvals the actor can act on right now (role at current step, dept scope, not own). */
export async function reviewQueue(actor: EventsActor) {
  assertEventsPermission(actor, 'events.event.review');
  const rows = await db('campus_events as e')
    .join('workflow_instances as wi', 'wi.id', 'e.workflow_instance_id')
    .join('workflow_steps as ws', 'ws.id', 'wi.current_step_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.organizer_faculty_id')
    .where({ 'e.college_id': actor.collegeId, 'e.status': 'UNDER_REVIEW', 'wi.status': 'IN_PROGRESS' })
    .select('e.*', 'ws.step_key', 'ws.name as step_name', 'ws.allowed_roles', 'd.name as department_name', 'f.name as organizer_name')
    .orderBy('e.submitted_at', 'asc')
    .limit(200);
  return rows
    .filter((r) => {
      if (isOwner(actor, r)) return false;
      const roles: string[] = typeof r.allowed_roles === 'string' ? JSON.parse(r.allowed_roles) : r.allowed_roles;
      if (!isAdminRole(actor.role) && !roles.includes(actor.role)) return false;
      if (actor.role === 'HOD' && !isHodOfDepartment(actor, r.department_id != null ? n(r.department_id) : null)) return false;
      return true;
    })
    .map((r) => ({
      id: n(r.id),
      title: r.title,
      eventType: r.event_type,
      startsAt: toApi(fromDb(r.starts_at)),
      endsAt: toApi(fromDb(r.ends_at)),
      departmentName: r.department_name ?? null,
      organizerName: r.organizer_name ?? null,
      step: { key: r.step_key, name: r.step_name },
      submittedAt: r.submitted_at,
    }));
}

// ── Scheduling (all-or-nothing reservation confirmation) ──────────────────
async function scheduleEventInternal(actor: EventsActor, eventId: number) {
  try {
    await withDeadlockRetry(() => db.transaction(async (trx) => {
      const ev = await loadEvent(trx, actor.collegeId, eventId, true);
      if (ev.status === 'SCHEDULED') return;
      if (ev.status !== 'APPROVED') throw new AppError(400, `Only an approved event can be scheduled (status ${ev.status})`);
      const requested = await trx('campus_resource_reservations').where({ event_id: eventId, status: 'REQUESTED' });
      await confirmReservationsInTrx(trx, actor.collegeId, requested, {
        actorId: actor.facultyUserId,
        requiredCapacity: requiredCapacity(ev),
        capacityOverride: Boolean(ev.capacity_override),
      });
      await trx('campus_events').where({ id: eventId }).update({ status: 'SCHEDULED', scheduled_at: trx.fn.now(), last_scheduling_error: null, updated_at: trx.fn.now() });
      await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_SCHEDULED', entityType: 'campus_event', entityId: eventId, before: { status: 'APPROVED' }, after: { status: 'SCHEDULED', confirmedReservationIds: requested.map((r) => n(r.id)) } }, trx);
    }, BOOKING_TRX));
  } catch (err) {
    if (err instanceof AppError && err.status === 409) {
      await db('campus_events').where({ id: eventId, college_id: actor.collegeId, status: 'APPROVED' }).update({ last_scheduling_error: err.message.slice(0, 2000), updated_at: db.fn.now() });
    }
    throw err;
  }
}

export async function scheduleEvent(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
  if (!isOwner(actor, ev) && !hasEventsPermission(actor, 'events.event.review')) {
    throw new AppError(403, 'Only the organiser or an approver can schedule this event');
  }
  await scheduleEventInternal(actor, eventId);
  return getEvent(actor, eventId);
}

// ── Reschedule (always re-validates conflicts, atomic across resources) ───
export async function rescheduleEvent(actor: EventsActor, eventId: number, input: z.infer<typeof rescheduleSchema>) {
  assertEventsPermission(actor, 'events.event.create');
  const startsAt = normalizeWall(input.startsAt);
  const endsAt = normalizeWall(input.endsAt);
  assertValidRange(startsAt, endsAt, MAX_EVENT_DAYS);
  if (startsAt <= (await collegeNow(actor.collegeId))) throw new AppError(400, 'An event must start in the future');
  const before = await withDeadlockRetry(() => db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    if (!['APPROVED', 'SCHEDULED'].includes(String(ev.status))) {
      throw new AppError(400, EDITABLE_EVENT_STATUSES.has(String(ev.status)) ? 'Edit the draft instead of rescheduling' : `Cannot reschedule an event in status ${ev.status}`);
    }
    const active = await trx('campus_resource_reservations').where({ event_id: eventId }).whereIn('status', ['REQUESTED', 'CONFIRMED']);
    const resources = await lockResources(trx, actor.collegeId, active.map((r) => n(r.resource_id)));
    const windows = new Map<number, Window>(resources.map((r) => [r.id, windowFor(r, startsAt, endsAt)]));
    if (ev.status === 'SCHEDULED' && resources.length) {
      const blockers = await evaluateAvailability(trx, actor.collegeId, resources, windows, {
        excludeReservationIds: active.map((r) => n(r.id)),
        requiredCapacity: requiredCapacity(ev),
        capacityOverride: Boolean(ev.capacity_override),
      });
      throwIfBlocked(blockers);
    }
    for (const r of resources) {
      const w = windows.get(r.id)!;
      await trx('campus_resource_reservations').where({ event_id: eventId, resource_id: r.id }).whereIn('status', ['REQUESTED', 'CONFIRMED']).update({
        starts_at: startsAt, ends_at: endsAt, block_starts_at: w.blockStart, block_ends_at: w.blockEnd, updated_at: trx.fn.now(),
      });
    }
    const closes = fromDb(ev.registration_closes_at);
    await trx('campus_events').where({ id: eventId }).update({
      starts_at: startsAt,
      ends_at: endsAt,
      registration_closes_at: closes && closes > startsAt ? startsAt : closes,
      reschedule_count: n(ev.reschedule_count) + 1,
      updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_RESCHEDULED', entityType: 'campus_event', entityId: eventId, before: { startsAt: fromDb(ev.starts_at), endsAt: fromDb(ev.ends_at) }, after: { startsAt, endsAt }, reason: input.reason }, trx);
    return ev;
  }, BOOKING_TRX));
  const updated = await loadEvent(db, actor.collegeId, eventId);
  await notifyStudentParticipants(updated, 'EVENT_RESCHEDULED', `Event rescheduled: ${before.title}`, `New time: ${toApi(startsAt)} – ${toApi(endsAt)}`);
  return getEvent(actor, eventId);
}

// ── Cancel (idempotent; releases reservations in the same transaction) ────
export async function cancelEvent(actor: EventsActor, eventId: number, reason: string) {
  assertEventsPermission(actor, 'events.event.view');
  const ev0 = await loadEvent(db, actor.collegeId, eventId);
  const canCancel = isOwner(actor, ev0) || isAdminRole(actor.role) ||
    (hasEventsPermission(actor, 'events.event.close') && canViewInternal(actor, ev0) && !['DRAFT', 'RETURNED'].includes(String(ev0.status)));
  if (!canCancel) {
    if (!canViewInternal(actor, ev0) && !canViewPublished(actor, ev0)) throw new AppError(404, 'Event not found');
    throw new AppError(403, 'You cannot cancel this event');
  }
  const changed = await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    if (ev.status === 'CANCELLED') return false;
    if (ev.status === 'UNDER_REVIEW') throw new AppError(400, 'An event under review cannot be cancelled — ask the reviewer to return it first');
    if (!['DRAFT', 'RETURNED', 'APPROVED', 'SCHEDULED'].includes(String(ev.status))) {
      throw new AppError(400, `Cannot cancel an event in status ${ev.status}`);
    }
    if (ev.status === 'RETURNED' && ev.workflow_instance_id != null) {
      await workflowEngine.performAction(organizerWorkflowActor(actor, 'workflow.instance.act'), n(ev.workflow_instance_id), { action: 'CANCEL', remarks: reason });
    }
    const released = await trx('campus_resource_reservations').where({ event_id: eventId }).whereIn('status', ['REQUESTED', 'CONFIRMED']).select('id');
    await trx('campus_resource_reservations').where({ event_id: eventId }).whereIn('status', ['REQUESTED', 'CONFIRMED']).update({
      status: 'CANCELLED', cancelled_at: trx.fn.now(), cancelled_by: actor.facultyUserId, updated_at: trx.fn.now(),
    });
    await trx('campus_events').where({ id: eventId }).update({
      status: 'CANCELLED', cancelled_at: trx.fn.now(), cancelled_by: actor.facultyUserId, cancellation_reason: reason, updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_CANCELLED', entityType: 'campus_event', entityId: eventId, before: { status: ev.status }, after: { status: 'CANCELLED', releasedReservationIds: released.map((r) => n(r.id)) }, reason }, trx);
    return true;
  });
  const ev = await loadEvent(db, actor.collegeId, eventId);
  // Retrying cancel re-attempts notifications; dedupe keys prevent duplicates.
  await notifyOrganizer(ev, 'EVENT_CANCELLED', `Event cancelled: ${ev.title}`, ev.cancellation_reason ?? undefined);
  await notifyStudentParticipants(ev, 'EVENT_CANCELLED', `Event cancelled: ${ev.title}`, 'This event has been cancelled.');
  return getEvent(actor, eventId).then((out) => ({ ...out, idempotentReplay: !changed }));
}

// ── Registration (capacity enforced under the event row lock) ─────────────
type Registrant =
  | { type: 'STUDENT'; studentId: number; departmentId: number | null }
  | { type: 'STAFF'; facultyUserId: number; departmentId: number | null }
  | { type: 'EXTERNAL'; name: string; email: string | null; organization: string | null; byFacultyId: number };

async function registerInternal(collegeId: number, eventId: number, who: Registrant) {
  const attempt = () => db.transaction(async (trx) => {
    const ev = await loadEvent(trx, collegeId, eventId, true);
    if (ev.status !== 'SCHEDULED') throw new AppError(400, 'Registration is only open for scheduled events');
    if (!ev.registration_enabled) throw new AppError(400, 'Registration is not enabled for this event');
    const now = await collegeNow(collegeId);
    const closes = fromDb(ev.registration_closes_at) ?? fromDb(ev.starts_at)!;
    if (who.type !== 'EXTERNAL') {
      if (now >= closes) throw new AppError(400, 'Registration is closed');
      const audience = String(ev.registration_audience);
      if (who.type === 'STUDENT' && audience === 'STAFF') throw new AppError(403, 'This event is open to staff only');
      if (who.type === 'STAFF' && audience === 'STUDENTS') throw new AppError(403, 'This event is open to students only');
      if (ev.visibility === 'DEPARTMENT' && n(ev.department_id) !== n(who.departmentId)) {
        throw new AppError(404, 'Event not found');
      }
    }
    let existing: Row | undefined;
    if (who.type === 'STUDENT') existing = await trx('campus_event_registrations').where({ event_id: eventId, student_id: who.studentId }).first();
    if (who.type === 'STAFF') existing = await trx('campus_event_registrations').where({ event_id: eventId, faculty_user_id: who.facultyUserId }).first();
    if (existing?.status === 'REGISTERED') return { id: n(existing.id), created: false };
    if (ev.registration_capacity != null) {
      const count = await trx('campus_event_registrations').where({ event_id: eventId, status: 'REGISTERED' }).count({ c: '*' }).first();
      if (n(count?.c) >= n(ev.registration_capacity)) throw new AppError(409, 'Event registration is full', undefined, 'REGISTRATION_FULL');
    }
    let id: number;
    if (existing) {
      await trx('campus_event_registrations').where({ id: existing.id }).update({ status: 'REGISTERED', cancelled_at: null, registered_at: trx.fn.now(), updated_at: trx.fn.now() });
      id = n(existing.id);
    } else {
      const [newId] = await trx('campus_event_registrations').insert({
        college_id: collegeId,
        event_id: eventId,
        participant_type: who.type,
        student_id: who.type === 'STUDENT' ? who.studentId : null,
        faculty_user_id: who.type === 'STAFF' ? who.facultyUserId : null,
        external_name: who.type === 'EXTERNAL' ? who.name : null,
        external_email: who.type === 'EXTERNAL' ? who.email : null,
        external_organization: who.type === 'EXTERNAL' ? who.organization : null,
        registered_via: who.type === 'EXTERNAL' ? 'ORGANIZER' : 'SELF',
      });
      id = n(newId);
    }
    await recordEventsAudit({
      collegeId,
      actorType: who.type === 'STUDENT' ? 'STUDENT' : 'FACULTY',
      actorId: who.type === 'STUDENT' ? who.studentId : who.type === 'STAFF' ? who.facultyUserId : who.byFacultyId,
      action: 'EVENT_REGISTRATION_CREATED',
      entityType: 'campus_event',
      entityId: eventId,
      after: { registrationId: id, participantType: who.type },
    }, trx);
    return { id, created: true };
  });
  try {
    return await withDeadlockRetry(attempt);
  } catch (err) {
    if (!isDupError(err)) throw err;
    // A concurrent identical registration won the unique index; return it.
    const row = who.type === 'STUDENT'
      ? await db('campus_event_registrations').where({ event_id: eventId, student_id: who.studentId }).first()
      : who.type === 'STAFF' ? await db('campus_event_registrations').where({ event_id: eventId, faculty_user_id: who.facultyUserId }).first() : null;
    if (!row) throw err;
    return { id: n(row.id), created: false };
  }
}

async function cancelRegistrationInternal(collegeId: number, eventId: number, where: Row, actorType: 'STUDENT' | 'FACULTY', actorId: number) {
  return db.transaction(async (trx) => {
    const ev = await loadEvent(trx, collegeId, eventId, true);
    const reg = await trx('campus_event_registrations').where({ event_id: eventId, ...where }).first();
    if (!reg) throw new AppError(404, 'Registration not found');
    if (reg.status === 'CANCELLED') return;
    if (FROZEN_EVENT_STATUSES.has(String(ev.status)) && ev.status !== 'CANCELLED') throw new AppError(400, `Registrations are locked for an event in status ${ev.status}`);
    if ((await collegeNow(collegeId)) >= fromDb(ev.starts_at)!) throw new AppError(400, 'The event has already started');
    await trx('campus_event_registrations').where({ id: reg.id }).update({ status: 'CANCELLED', cancelled_at: trx.fn.now(), updated_at: trx.fn.now() });
    await recordEventsAudit({ collegeId, actorType, actorId, action: 'EVENT_REGISTRATION_CANCELLED', entityType: 'campus_event', entityId: eventId, before: { registrationId: n(reg.id), status: 'REGISTERED' }, after: { status: 'CANCELLED' } }, trx);
  });
}

export async function staffRegister(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!canViewInternal(actor, ev) && !canViewPublished(actor, ev)) throw new AppError(404, 'Event not found');
  const out = await registerInternal(actor.collegeId, eventId, { type: 'STAFF', facultyUserId: actor.facultyUserId, departmentId: actor.departmentId });
  return { registrationId: out.id, created: out.created };
}

export async function staffCancelRegistration(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.view');
  await cancelRegistrationInternal(actor.collegeId, eventId, { faculty_user_id: actor.facultyUserId }, 'FACULTY', actor.facultyUserId);
  return { ok: true };
}

export async function addExternalParticipant(actor: EventsActor, eventId: number, input: z.infer<typeof externalParticipantSchema>) {
  const ev = await loadEvent(db, actor.collegeId, eventId);
  assertCanManage(actor, ev);
  if (!ev.has_external_participants) throw new AppError(400, 'This event is not configured for external participants');
  const out = await registerInternal(actor.collegeId, eventId, { type: 'EXTERNAL', name: input.name, email: input.email ?? null, organization: input.organization ?? null, byFacultyId: actor.facultyUserId });
  return { registrationId: out.id, created: out.created };
}

/** Participant list — organiser/managers only (never public, never other participants). */
export async function listRegistrations(actor: EventsActor, eventId: number, filters: { page?: number; pageSize?: number } = {}) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 100));
  const base = db('campus_event_registrations as r').where({ 'r.event_id': eventId, 'r.college_id': actor.collegeId });
  const totalRow = await base.clone().count({ c: '*' }).first();
  const rows = await base.clone()
    .leftJoin('students as s', 's.id', 'r.student_id')
    .leftJoin('faculty_users as f', 'f.id', 'r.faculty_user_id')
    .select('r.*', 's.name as student_name', 's.usn as student_usn', 'f.name as faculty_name')
    .orderBy('r.id')
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    page,
    pageSize,
    total: n(totalRow?.c),
    items: rows.map((r) => ({
      id: n(r.id),
      participantType: r.participant_type,
      name: r.student_name ?? r.faculty_name ?? r.external_name ?? null,
      usn: r.student_usn ?? null,
      externalEmail: r.external_email ?? null,
      externalOrganization: r.external_organization ?? null,
      status: r.status,
      attendanceStatus: r.attendance_status,
      registeredVia: r.registered_via,
      registeredAt: r.registered_at,
    })),
  };
}

// ── Event participation (NOT academic attendance) ─────────────────────────
export async function markAttendance(actor: EventsActor, eventId: number, input: z.infer<typeof attendanceSchema>) {
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    if (!['SCHEDULED', 'COMPLETED'].includes(String(ev.status))) throw new AppError(400, `Participation cannot be marked for an event in status ${ev.status}`);
    if ((await collegeNow(actor.collegeId)) < fromDb(ev.starts_at)!) throw new AppError(400, 'Participation can be marked only after the event starts');
    const ids = input.entries.map((e) => e.registrationId);
    const regs = await trx('campus_event_registrations').where({ event_id: eventId, status: 'REGISTERED' }).whereIn('id', ids).select('id');
    if (regs.length !== new Set(ids).size) throw new AppError(400, 'One or more registrations do not belong to this event');
    for (const entry of input.entries) {
      await trx('campus_event_registrations').where({ id: entry.registrationId }).update({
        attendance_status: entry.attendance, attendance_marked_at: trx.fn.now(), attendance_marked_by: actor.facultyUserId, updated_at: trx.fn.now(),
      });
    }
    if (ev.status === 'COMPLETED') {
      const attended = await trx('campus_event_registrations').where({ event_id: eventId, status: 'REGISTERED', attendance_status: 'ATTENDED' }).count({ c: '*' }).first();
      await trx('campus_events').where({ id: eventId }).update({ actual_participants: n(attended?.c), updated_at: trx.fn.now() });
    }
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_PARTICIPATION_MARKED', entityType: 'campus_event', entityId: eventId, after: { entries: input.entries.length, attended: input.entries.filter((e) => e.attendance === 'ATTENDED').length } }, trx);
  });
  return listRegistrations(actor, eventId);
}

// ── Completion / report / closure ─────────────────────────────────────────
export async function completeEvent(actor: EventsActor, eventId: number, input: z.infer<typeof completeSchema>) {
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    assertCanManage(actor, ev);
    const attended = await trx('campus_event_registrations').where({ event_id: eventId, status: 'REGISTERED', attendance_status: 'ATTENDED' }).count({ c: '*' }).first();
    if (ev.status === 'COMPLETED') {
      await trx('campus_events').where({ id: eventId }).update({ outcome_summary: input.outcomeSummary, actual_participants: n(attended?.c), updated_at: trx.fn.now() });
      await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_REPORT_CORRECTED', entityType: 'campus_event', entityId: eventId, before: { outcomeSummary: ev.outcome_summary }, after: { outcomeSummary: input.outcomeSummary } }, trx);
      return;
    }
    if (ev.status !== 'SCHEDULED') throw new AppError(400, `Cannot complete an event in status ${ev.status}`);
    if ((await collegeNow(actor.collegeId)) < fromDb(ev.ends_at)!) throw new AppError(400, 'An event can be completed only after it ends');
    await trx('campus_events').where({ id: eventId }).update({
      status: 'COMPLETED', outcome_summary: input.outcomeSummary, actual_participants: n(attended?.c), completed_at: trx.fn.now(), updated_at: trx.fn.now(),
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_COMPLETED', entityType: 'campus_event', entityId: eventId, before: { status: ev.status }, after: { status: 'COMPLETED', actualParticipants: n(attended?.c) } }, trx);
  });
  return getEvent(actor, eventId);
}

export async function closeEvent(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.close');
  await db.transaction(async (trx) => {
    const ev = await loadEvent(trx, actor.collegeId, eventId, true);
    if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
    if (ev.status === 'CLOSED') return;
    if (isOwner(actor, ev)) throw new AppError(403, 'The organiser cannot close their own event');
    if (actor.role === 'HOD' && !isHodOfDepartment(actor, ev.department_id != null ? n(ev.department_id) : null)) {
      throw new AppError(403, "You are not the HOD of this event's department");
    }
    if (ev.status !== 'COMPLETED') throw new AppError(400, `Only a completed event can be closed (status ${ev.status})`);
    if (!ev.outcome_summary) throw new AppError(400, 'An event report is required before closure');
    await trx('campus_events').where({ id: eventId }).update({ status: 'CLOSED', closed_at: trx.fn.now(), closed_by: actor.facultyUserId, updated_at: trx.fn.now() });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_CLOSED', entityType: 'campus_event', entityId: eventId, before: { status: 'COMPLETED' }, after: { status: 'CLOSED' } }, trx);
  });
  return getEvent(actor, eventId);
}

// ── Documents / evidence via Document Engine (event-scoped authorization) ─
export async function uploadEventDocument(actor: EventsActor, eventId: number, input: z.infer<typeof eventDocumentSchema>) {
  const ev = await loadEvent(db, actor.collegeId, eventId);
  assertCanManage(actor, ev);
  if (['CLOSED', 'REJECTED', 'CANCELLED'].includes(String(ev.status))) throw new AppError(400, `Documents are locked for an event in status ${ev.status}`);
  const doc = await documentEngine.uploadDocument({ facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, departmentId: actor.departmentId, role: actor.role }, {
    entityType: DOC_ENTITY_TYPE,
    entityId: eventId,
    category: input.category,
    fileName: input.fileName,
    mimeType: input.mimeType,
    contentBase64: input.contentBase64,
    description: input.description ?? null,
  }) as Row;
  await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'EVENT_DOCUMENT_UPLOADED', entityType: 'campus_event', entityId: eventId, after: { documentId: n(doc.id), category: input.category } });
  return doc;
}

export async function listEventDocuments(actor: EventsActor, eventId: number) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
  return documentEngine.listDocumentsForEntity(systemDocumentActor(actor.collegeId, actor.facultyUserId), DOC_ENTITY_TYPE, eventId);
}

/** Knowing a document id is never enough: the caller must pass event authorization and the document must belong to that event. */
export async function downloadEventDocument(actor: EventsActor, eventId: number, documentId: number) {
  assertEventsPermission(actor, 'events.event.view');
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!canViewInternal(actor, ev)) throw new AppError(404, 'Event not found');
  const sys = systemDocumentActor(actor.collegeId, actor.facultyUserId);
  const meta = await documentEngine.getDocumentMetadata(sys, documentId).catch(() => null) as Row | null;
  if (!meta || meta.entityType !== DOC_ENTITY_TYPE || n(meta.entityId) !== eventId) throw new AppError(404, 'Document not found');
  return documentEngine.downloadDocument(sys, documentId);
}

// ── Calendar projection (no second calendar authority) ────────────────────
export async function calendar(actor: EventsActor, from: string, to: string) {
  assertEventsPermission(actor, 'events.event.view');
  const start = normalizeWall(`${from.slice(0, 10)}T00:00`);
  const end = normalizeWall(`${to.slice(0, 10)}T23:59`);
  if (end < start) throw new AppError(400, 'Invalid range');
  if (wallToMs(end) - wallToMs(start) > MAX_CALENDAR_DAYS * 86_400_000) throw new AppError(400, `Calendar range cannot exceed ${MAX_CALENDAR_DAYS} days`);
  const events = await listEvents(actor, { from, to, pageSize: 100 });
  const canSeePurpose = hasEventsPermission(actor, 'events.reservation.decide') || hasEventsPermission(actor, 'events.event.viewAll');
  const reservations = await db('campus_resource_reservations as rr')
    .join('campus_bookable_resources as br', 'br.id', 'rr.resource_id')
    .leftJoin('rooms as r', 'r.id', 'br.room_id')
    .leftJoin('campus_assets as a', 'a.id', 'br.asset_id')
    .where({ 'rr.college_id': actor.collegeId, 'rr.status': 'CONFIRMED' })
    .andWhere('rr.starts_at', '<', end)
    .andWhere('rr.ends_at', '>', start)
    .select('rr.*', db.raw('COALESCE(r.name, a.name) as resource_name'), 'br.resource_kind')
    .orderBy('rr.starts_at')
    .limit(1000);
  return {
    from: start.slice(0, 10),
    to: end.slice(0, 10),
    events: events.items,
    reservations: reservations.map((r) => shapeReservation(r, null, { includePurpose: canSeePurpose || n(r.requested_by) === actor.facultyUserId })),
  };
}

// ── Availability search ───────────────────────────────────────────────────
export async function availability(
  actor: EventsActor,
  query: { startsAt: string; endsAt: string; kind?: string; roomType?: string; minCapacity?: number },
) {
  assertEventsPermission(actor, 'events.event.view');
  const startsAt = normalizeWall(query.startsAt);
  const endsAt = normalizeWall(query.endsAt);
  assertValidRange(startsAt, endsAt, MAX_EVENT_DAYS);
  const all = await db('campus_bookable_resources').where({ college_id: actor.collegeId, is_active: true })
    .modify((q) => { if (query.kind) q.andWhere('resource_kind', query.kind); })
    .select('id').limit(500);
  let resources = await loadResources(db, actor.collegeId, all.map((r: Row) => n(r.id)));
  if (query.roomType) resources = resources.filter((r) => r.roomType === query.roomType);
  const windows = new Map<number, Window>(resources.map((r) => [r.id, windowFor(r, startsAt, endsAt)]));
  const blockers = await evaluateAvailability(db, actor.collegeId, resources, windows, { requiredCapacity: query.minCapacity ?? null });
  return {
    startsAt: toApi(startsAt),
    endsAt: toApi(endsAt),
    items: resources.map((r) => {
      const b = blockers.get(r.id) ?? [];
      return { resource: r, available: b.length === 0, blockers: b };
    }),
  };
}

// ── Reports / dashboard (aggregates only; no staff rankings) ──────────────
export async function eventsReport(actor: EventsActor, filters: { from?: string; to?: string } = {}) {
  assertEventsPermission(actor, 'events.report.view');
  const scopeAll = isAdminRole(actor.role) || hasEventsPermission(actor, 'events.event.viewAll') || actor.role === 'IQAC_COORDINATOR';
  const hodDepts = hodDepartmentIds(actor);
  if (!scopeAll && !hodDepts.length) throw new AppError(403, 'No reporting scope');
  const from = normalizeWall(`${(filters.from ?? '2000-01-01').slice(0, 10)}T00:00`);
  const to = normalizeWall(`${(filters.to ?? '2999-12-31').slice(0, 10)}T23:59`);
  const base = () => db('campus_events as e').where('e.college_id', actor.collegeId)
    .andWhere('e.starts_at', '<=', to).andWhere('e.ends_at', '>=', from)
    .modify((q) => { if (!scopeAll) q.whereIn('e.department_id', hodDepts); });
  const [byStatus, byType, byDepartment, participation, utilization] = await Promise.all([
    base().groupBy('e.status').select('e.status', db.raw('COUNT(*) as c')),
    base().groupBy('e.event_type').select('e.event_type', db.raw('COUNT(*) as c')),
    base().leftJoin('departments as d', 'd.id', 'e.department_id').groupBy('e.department_id', 'd.name').select('e.department_id', 'd.name', db.raw('COUNT(*) as c')),
    base().whereIn('e.status', ['COMPLETED', 'CLOSED']).select(db.raw('COUNT(*) as events'), db.raw('COALESCE(SUM(e.actual_participants),0) as participants')).first(),
    db('campus_resource_reservations as rr')
      .join('campus_bookable_resources as br', 'br.id', 'rr.resource_id')
      .leftJoin('rooms as r', 'r.id', 'br.room_id')
      .leftJoin('campus_assets as a', 'a.id', 'br.asset_id')
      .where({ 'rr.college_id': actor.collegeId, 'rr.status': 'CONFIRMED' })
      .andWhere('rr.starts_at', '<=', to).andWhere('rr.ends_at', '>=', from)
      .modify((q) => {
        if (!scopeAll) q.whereIn('rr.event_id', base().select('e.id'));
      })
      .groupBy('rr.resource_id', 'r.name', 'a.name', 'br.resource_kind')
      .select('rr.resource_id', 'br.resource_kind', db.raw('COALESCE(r.name, a.name) as name'), db.raw('COUNT(*) as bookings'),
        db.raw('ROUND(SUM(TIMESTAMPDIFF(MINUTE, rr.starts_at, rr.ends_at))/60, 2) as hours')),
  ]);
  return {
    scope: scopeAll ? 'INSTITUTION' : 'DEPARTMENT',
    byStatus: byStatus.map((r: Row) => ({ status: r.status, count: n(r.c) })),
    byType: byType.map((r: Row) => ({ eventType: r.event_type, count: n(r.c) })),
    byDepartment: byDepartment.map((r: Row) => ({ departmentId: r.department_id != null ? n(r.department_id) : null, name: r.name ?? 'Institution-level', count: n(r.c) })),
    completedEvents: n((participation as Row)?.events),
    totalParticipants: n((participation as Row)?.participants),
    resourceUtilization: utilization.map((r: Row) => ({ resourceId: n(r.resource_id), kind: r.resource_kind, name: r.name, bookings: n(r.bookings), hours: Number(r.hours ?? 0) })),
  };
}

// ── Student portal (public projection only) ───────────────────────────────
async function loadStudent(actor: StudentEventsActor) {
  const s = await db('students').where({ id: actor.studentId, college_id: actor.collegeId }).select('id', 'department_id').first();
  if (!s) throw new AppError(404, 'Student not found');
  return { id: n(s.id), departmentId: s.department_id != null ? n(s.department_id) : null };
}

function studentVisible(ev: Row, departmentId: number | null) {
  if (!PUBLISHED_STATUSES.includes(String(ev.status))) return false;
  if (ev.registration_audience === 'STAFF') return false;
  if (ev.visibility === 'DEPARTMENT' && n(ev.department_id) !== n(departmentId)) return false;
  return true;
}

export async function studentListEvents(actor: StudentEventsActor, filters: { page?: number; pageSize?: number } = {}) {
  const student = await loadStudent(actor);
  const now = await collegeNow(actor.collegeId);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const q = db('campus_events as e')
    .where({ 'e.college_id': actor.collegeId, 'e.status': 'SCHEDULED' })
    .whereNot('e.registration_audience', 'STAFF')
    .andWhere('e.ends_at', '>=', now)
    .andWhere((b) => {
      b.where('e.visibility', 'INSTITUTION');
      if (student.departmentId != null) b.orWhere('e.department_id', student.departmentId);
    });
  const totalRow = await q.clone().count({ c: '*' }).first();
  const rows = await q.clone()
    .leftJoin('campus_event_registrations as r', function joinReg() {
      this.on('r.event_id', '=', 'e.id').andOn('r.student_id', '=', db.raw('?', [student.id]));
    })
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .select('e.id', 'e.title', 'e.event_type', 'e.starts_at', 'e.ends_at', 'e.registration_enabled', 'e.registration_closes_at', 'e.organizer_unit_type', 'e.organizer_unit_name', 'd.name as department_name', 'r.status as my_status')
    .orderBy('e.starts_at', 'asc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    page,
    pageSize,
    total: n(totalRow?.c),
    items: rows.map((r) => ({
      id: n(r.id),
      title: r.title,
      eventType: r.event_type,
      startsAt: toApi(fromDb(r.starts_at)),
      endsAt: toApi(fromDb(r.ends_at)),
      organizerUnitType: r.organizer_unit_type,
      organizerUnitName: r.organizer_unit_name ?? null,
      departmentName: r.department_name ?? null,
      registrationEnabled: Boolean(r.registration_enabled),
      registrationClosesAt: toApi(fromDb(r.registration_closes_at)),
      myRegistrationStatus: r.my_status ?? null,
    })),
  };
}

export async function studentGetEvent(actor: StudentEventsActor, eventId: number) {
  const student = await loadStudent(actor);
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!studentVisible(ev, student.departmentId)) throw new AppError(404, 'Event not found');
  const reg = await db('campus_event_registrations').where({ event_id: eventId, student_id: student.id }).first();
  return {
    ...publicShape(ev, await eventContext(ev)),
    myRegistration: reg ? { id: n(reg.id), status: reg.status, attendanceStatus: reg.attendance_status } : null,
  };
}

export async function studentRegister(actor: StudentEventsActor, eventId: number) {
  const student = await loadStudent(actor);
  const ev = await loadEvent(db, actor.collegeId, eventId);
  if (!studentVisible(ev, student.departmentId)) throw new AppError(404, 'Event not found');
  const out = await registerInternal(actor.collegeId, eventId, { type: 'STUDENT', studentId: student.id, departmentId: student.departmentId });
  if (out.created) {
    await safeNotify(() => notifier.student({
      studentId: student.id,
      collegeId: actor.collegeId,
      type: 'EVENT_REGISTRATION_CONFIRMED',
      title: `Registered: ${ev.title}`,
      body: `Starts ${toApi(fromDb(ev.starts_at))}`,
      link: `/lms/events/${eventId}`,
      relatedType: 'campus_event',
      relatedId: eventId,
      dedupeKeyOverride: `EVENT_REGISTRATION_CONFIRMED:${eventId}:${out.id}`,
    }));
  }
  return studentGetEvent(actor, eventId);
}

export async function studentCancelRegistration(actor: StudentEventsActor, eventId: number) {
  const student = await loadStudent(actor);
  await cancelRegistrationInternal(actor.collegeId, eventId, { student_id: student.id }, 'STUDENT', student.id);
  return studentGetEvent(actor, eventId).catch(() => ({ ok: true }));
}

export async function studentMyRegistrations(actor: StudentEventsActor) {
  const student = await loadStudent(actor);
  const rows = await db('campus_event_registrations as r')
    .join('campus_events as e', 'e.id', 'r.event_id')
    .where({ 'r.student_id': student.id, 'r.college_id': actor.collegeId })
    .select('r.id', 'r.status', 'r.attendance_status', 'e.id as event_id', 'e.title', 'e.event_type', 'e.status as event_status', 'e.starts_at', 'e.ends_at')
    .orderBy('e.starts_at', 'desc')
    .limit(200);
  return rows.map((r) => ({
    registrationId: n(r.id),
    status: r.status,
    attendanceStatus: r.attendance_status,
    event: { id: n(r.event_id), title: r.title, eventType: r.event_type, status: r.event_status, startsAt: toApi(fromDb(r.starts_at)), endsAt: toApi(fromDb(r.ends_at)) },
  }));
}

export { getResource, flatten };
