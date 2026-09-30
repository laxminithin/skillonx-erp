import type { Knex } from 'knex';
import type { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { roomAcademicOccupancy } from '../timetable/service.js';
import { assertEventsPermission } from './access.js';
import { recordEventsAudit } from './audit.js';
import { addMinutes, datePart, fromDb, toApi, windowsOverlap } from './time.js';
import {
  UNBOOKABLE_ASSET_STATUSES,
  type EventsActor,
  type resourceConfigSchema,
  type resourceConfigUpdateSchema,
} from './types.js';

type Conn = Knex.Transaction | typeof db;
type Row = Record<string, any>;

export const BOOKING_TRX = { isolationLevel: 'read committed' as const };

export type ResourceDetail = {
  id: number;
  collegeId: number;
  resourceKind: 'ROOM' | 'ASSET';
  roomId: number | null;
  assetId: number | null;
  name: string;
  code: string | null;
  roomType: string | null;
  building: string | null;
  floor: string | null;
  capacity: number | null;
  sourceStatus: string | null;
  isActive: boolean;
  requiresApproval: boolean;
  setupBufferMinutes: number;
  cleanupBufferMinutes: number;
  notes: string | null;
};

export type Blocker = {
  kind: 'RESERVATION' | 'ACADEMIC_TIMETABLE' | 'EXAMINATION' | 'ASSET_STATUS' | 'ROOM_INACTIVE' | 'RESOURCE_INACTIVE' | 'CAPACITY';
  message: string;
  resourceId: number;
  reservationId?: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type Window = { blockStart: string; blockEnd: string };

function n(v: unknown) {
  return Number(v ?? 0);
}

export function isDupError(err: any) {
  return err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062;
}

function isDeadlock(err: any) {
  return err?.code === 'ER_LOCK_DEADLOCK' || err?.errno === 1213;
}

/** InnoDB may pick a deadlock victim under real concurrency; the whole transaction is retried fresh. */
export async function withDeadlockRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!isDeadlock(err)) throw err;
      last = err;
    }
  }
  throw last;
}

function resourceQuery(conn: Conn, collegeId: number) {
  return conn('campus_bookable_resources as br')
    .leftJoin('rooms as r', 'r.id', 'br.room_id')
    .leftJoin('campus_assets as a', 'a.id', 'br.asset_id')
    .where('br.college_id', collegeId)
    .select(
      'br.*',
      'r.name as room_name', 'r.code as room_code', 'r.type as room_type', 'r.building as room_building',
      'r.floor as room_floor', 'r.capacity as room_capacity', 'r.status as room_status',
      'a.name as asset_name', 'a.asset_tag as asset_tag', 'a.category as asset_category', 'a.status as asset_status',
    );
}

function shapeResource(row: Row): ResourceDetail {
  const isRoom = row.resource_kind === 'ROOM';
  return {
    id: n(row.id),
    collegeId: n(row.college_id),
    resourceKind: row.resource_kind,
    roomId: row.room_id != null ? n(row.room_id) : null,
    assetId: row.asset_id != null ? n(row.asset_id) : null,
    name: String((isRoom ? row.room_name : row.asset_name) ?? 'Unknown resource'),
    code: (isRoom ? row.room_code : row.asset_tag) ?? null,
    roomType: isRoom ? row.room_type ?? null : null,
    building: isRoom ? row.room_building ?? null : null,
    floor: isRoom ? row.room_floor ?? null : null,
    capacity: isRoom && row.room_capacity != null ? n(row.room_capacity) : null,
    sourceStatus: (isRoom ? row.room_status : row.asset_status) ?? null,
    isActive: Boolean(row.is_active),
    requiresApproval: Boolean(row.requires_approval),
    setupBufferMinutes: n(row.setup_buffer_minutes),
    cleanupBufferMinutes: n(row.cleanup_buffer_minutes),
    notes: row.notes ?? null,
  };
}

export async function loadResources(conn: Conn, collegeId: number, ids: number[]) {
  if (!ids.length) return [];
  const rows = await resourceQuery(conn, collegeId).whereIn('br.id', ids);
  return rows.map(shapeResource);
}

export async function getResource(conn: Conn, collegeId: number, id: number) {
  const [res] = await loadResources(conn, collegeId, [id]);
  if (!res) throw new AppError(404, 'Bookable resource not found');
  return res;
}

/** Serialises every booking decision per resource: rows locked in ascending id order (deadlock-free ordering). */
export async function lockResources(trx: Knex.Transaction, collegeId: number, ids: number[]) {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  for (const id of sorted) {
    const row = await trx('campus_bookable_resources').where({ id, college_id: collegeId }).forUpdate().first();
    if (!row) throw new AppError(404, 'Bookable resource not found');
  }
  return loadResources(trx, collegeId, sorted);
}

export function windowFor(resource: ResourceDetail, start: string, end: string): Window {
  return {
    blockStart: addMinutes(start, -resource.setupBufferMinutes),
    blockEnd: addMinutes(end, resource.cleanupBufferMinutes),
  };
}

function wallOf(date: string, hhmm: string) {
  return `${date} ${hhmm.slice(0, 5)}:00`;
}

/**
 * Server-authoritative availability. Checks, per resource and window:
 * bookability config, authoritative room/asset status, room capacity,
 * overlapping CONFIRMED reservations (REQUESTED never blocks), academic
 * timetable occupancy and examination room allocations.
 */
export async function evaluateAvailability(
  conn: Conn,
  collegeId: number,
  resources: ResourceDetail[],
  windows: Map<number, Window>,
  opts: { excludeReservationIds?: number[]; requiredCapacity?: number | null; capacityOverride?: boolean } = {},
): Promise<Map<number, Blocker[]>> {
  const out = new Map<number, Blocker[]>();
  for (const r of resources) out.set(r.id, []);
  if (!resources.length) return out;
  const push = (b: Blocker) => out.get(b.resourceId)!.push(b);

  for (const r of resources) {
    if (!r.isActive) push({ kind: 'RESOURCE_INACTIVE', resourceId: r.id, message: `${r.name} is not currently bookable` });
    if (r.resourceKind === 'ROOM' && r.sourceStatus !== 'ACTIVE') {
      push({ kind: 'ROOM_INACTIVE', resourceId: r.id, message: `${r.name} is inactive in the room master` });
    }
    if (r.resourceKind === 'ASSET' && (r.sourceStatus == null || UNBOOKABLE_ASSET_STATUSES.has(r.sourceStatus))) {
      push({ kind: 'ASSET_STATUS', resourceId: r.id, message: `${r.name} is unavailable (asset status ${r.sourceStatus ?? 'UNKNOWN'})` });
    }
    if (
      r.resourceKind === 'ROOM' && r.capacity != null && opts.requiredCapacity != null &&
      opts.requiredCapacity > r.capacity && !opts.capacityOverride
    ) {
      push({ kind: 'CAPACITY', resourceId: r.id, message: `${r.name} holds ${r.capacity}; ${opts.requiredCapacity} expected` });
    }
  }

  const all = [...windows.values()];
  const minStart = all.reduce((m, w) => (w.blockStart < m ? w.blockStart : m), all[0].blockStart);
  const maxEnd = all.reduce((m, w) => (w.blockEnd > m ? w.blockEnd : m), all[0].blockEnd);

  const confirmed = await conn('campus_resource_reservations')
    .where({ college_id: collegeId, status: 'CONFIRMED' })
    .whereIn('resource_id', resources.map((r) => r.id))
    .andWhere('block_starts_at', '<', maxEnd)
    .andWhere('block_ends_at', '>', minStart)
    .modify((q) => {
      if (opts.excludeReservationIds?.length) q.whereNotIn('id', opts.excludeReservationIds);
    })
    .select('id', 'resource_id', 'starts_at', 'ends_at', 'block_starts_at', 'block_ends_at');
  for (const c of confirmed) {
    const w = windows.get(n(c.resource_id));
    if (!w) continue;
    const bs = fromDb(c.block_starts_at)!;
    const be = fromDb(c.block_ends_at)!;
    if (windowsOverlap(w.blockStart, w.blockEnd, bs, be)) {
      push({
        kind: 'RESERVATION',
        resourceId: n(c.resource_id),
        reservationId: n(c.id),
        startsAt: toApi(fromDb(c.starts_at)),
        endsAt: toApi(fromDb(c.ends_at)),
        message: 'Already reserved for an overlapping time',
      });
    }
  }

  const rooms = resources.filter((r) => r.resourceKind === 'ROOM' && r.roomId != null);
  if (rooms.length) {
    const roomToResource = new Map(rooms.map((r) => [r.roomId!, r.id]));
    const occupancy = await roomAcademicOccupancy(collegeId, [...roomToResource.keys()], datePart(minStart), datePart(maxEnd));
    for (const o of occupancy) {
      const resourceId = roomToResource.get(o.roomId)!;
      const w = windows.get(resourceId)!;
      if (windowsOverlap(w.blockStart, w.blockEnd, wallOf(o.date, o.startTime), wallOf(o.date, o.endTime))) {
        push({
          kind: 'ACADEMIC_TIMETABLE',
          resourceId,
          startsAt: `${o.date}T${o.startTime}`,
          endsAt: `${o.date}T${o.endTime}`,
          message: `Academic class ${o.className}${o.courseName ? ` (${o.courseName})` : ''} ${o.startTime}–${o.endTime} on ${o.date}`,
        });
      }
    }

    if (await db.schema.hasTable('exam_room_allocations')) {
      const exams = await db('exam_room_allocations as era')
        .join('examination_subjects as es', 'es.id', 'era.exam_subject_id')
        .join('examinations as e', 'e.id', 'es.exam_id')
        .where('era.college_id', collegeId)
        .whereIn('era.room_id', [...roomToResource.keys()])
        .whereNot('e.status', 'CANCELLED')
        .whereNotNull('es.exam_date')
        .whereNotNull('es.start_time')
        .whereNotNull('es.end_time')
        .andWhere('es.exam_date', '>=', datePart(minStart))
        .andWhere('es.exam_date', '<=', datePart(maxEnd))
        .select('era.room_id', 'es.exam_date', 'es.start_time', 'es.end_time', 'e.name as exam_name');
      for (const ex of exams) {
        const resourceId = roomToResource.get(n(ex.room_id))!;
        const w = windows.get(resourceId)!;
        const date = fromDb(ex.exam_date)?.slice(0, 10) ?? String(ex.exam_date).slice(0, 10);
        const s = String(ex.start_time).slice(0, 5);
        const e = String(ex.end_time).slice(0, 5);
        if (windowsOverlap(w.blockStart, w.blockEnd, wallOf(date, s), wallOf(date, e))) {
          push({ kind: 'EXAMINATION', resourceId, startsAt: `${date}T${s}`, endsAt: `${date}T${e}`, message: `Examination ${ex.exam_name} ${s}–${e} on ${date}` });
        }
      }
    }
  }
  return out;
}

export function flatten(blockers: Map<number, Blocker[]>) {
  return [...blockers.values()].flat();
}

export function throwIfBlocked(blockers: Map<number, Blocker[]>) {
  const list = flatten(blockers);
  if (list.length) throw new AppError(409, list[0].message, { conflicts: list }, `${list[0].kind}_CONFLICT`);
}

/**
 * Confirms the given REQUESTED reservations all-or-nothing. Caller owns the
 * transaction (READ COMMITTED) and must not have locked any resource yet.
 */
export async function confirmReservationsInTrx(
  trx: Knex.Transaction,
  collegeId: number,
  reservations: Row[],
  opts: { actorId: number; requiredCapacity?: number | null; capacityOverride?: boolean },
) {
  if (!reservations.length) return;
  const resources = await lockResources(trx, collegeId, reservations.map((r) => n(r.resource_id)));
  const windows = new Map<number, Window>();
  for (const r of reservations) {
    windows.set(n(r.resource_id), { blockStart: fromDb(r.block_starts_at)!, blockEnd: fromDb(r.block_ends_at)! });
  }
  const blockers = await evaluateAvailability(trx, collegeId, resources, windows, {
    excludeReservationIds: reservations.map((r) => n(r.id)),
    requiredCapacity: opts.requiredCapacity,
    capacityOverride: opts.capacityOverride,
  });
  throwIfBlocked(blockers);
  await trx('campus_resource_reservations')
    .whereIn('id', reservations.map((r) => n(r.id)))
    .update({ status: 'CONFIRMED', decided_by: opts.actorId, decided_at: trx.fn.now(), updated_at: trx.fn.now() });
}

export function shapeReservation(row: Row, resource?: ResourceDetail | null, opts: { includePurpose?: boolean } = {}) {
  return {
    id: n(row.id),
    resourceId: n(row.resource_id),
    resourceName: resource?.name ?? row.resource_name ?? null,
    resourceKind: resource?.resourceKind ?? row.resource_kind ?? null,
    eventId: row.event_id != null ? n(row.event_id) : null,
    purpose: opts.includePurpose === false ? null : row.purpose ?? null,
    startsAt: toApi(fromDb(row.starts_at)),
    endsAt: toApi(fromDb(row.ends_at)),
    blockStartsAt: toApi(fromDb(row.block_starts_at)),
    blockEndsAt: toApi(fromDb(row.block_ends_at)),
    status: row.status,
    requestedBy: n(row.requested_by),
    decidedBy: row.decided_by != null ? n(row.decided_by) : null,
    decidedAt: row.decided_at ?? null,
    decisionRemarks: opts.includePurpose === false ? null : row.decision_remarks ?? null,
  };
}

// ── Bookable resource configuration (opt-in; never auto-bookable) ──────────
export async function listResources(actor: EventsActor, filters: { kind?: string; activeOnly?: boolean } = {}) {
  assertEventsPermission(actor, 'events.event.view');
  const rows = await resourceQuery(db, actor.collegeId)
    .modify((q) => {
      if (filters.kind) q.andWhere('br.resource_kind', filters.kind);
      if (filters.activeOnly) q.andWhere('br.is_active', true);
    })
    .orderBy('br.resource_kind')
    .orderBy('br.id')
    .limit(500);
  return rows.map(shapeResource);
}

export async function configureResource(actor: EventsActor, input: z.infer<typeof resourceConfigSchema>) {
  assertEventsPermission(actor, 'events.resource.manage');
  if (input.resourceKind === 'ROOM') {
    const room = await db('rooms').where({ id: input.roomId!, college_id: actor.collegeId }).first();
    if (!room) throw new AppError(404, 'Room not found');
  } else {
    const asset = await db('campus_assets').where({ id: input.assetId!, college_id: actor.collegeId }).first();
    if (!asset) throw new AppError(404, 'Asset not found');
  }
  try {
    const [id] = await db('campus_bookable_resources').insert({
      college_id: actor.collegeId,
      resource_kind: input.resourceKind,
      room_id: input.resourceKind === 'ROOM' ? input.roomId : null,
      asset_id: input.resourceKind === 'ASSET' ? input.assetId : null,
      is_active: input.isActive ?? true,
      requires_approval: input.requiresApproval ?? false,
      setup_buffer_minutes: input.setupBufferMinutes ?? 0,
      cleanup_buffer_minutes: input.cleanupBufferMinutes ?? 0,
      notes: input.notes ?? null,
      created_by: actor.facultyUserId,
    });
    await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'RESOURCE_CONFIGURED', entityType: 'campus_bookable_resource', entityId: n(id), after: input });
    return getResource(db, actor.collegeId, n(id));
  } catch (err) {
    if (isDupError(err)) throw new AppError(409, 'This room/asset is already configured as a bookable resource');
    throw err;
  }
}

export async function updateResource(actor: EventsActor, resourceId: number, input: z.infer<typeof resourceConfigUpdateSchema>) {
  assertEventsPermission(actor, 'events.resource.manage');
  const before = await getResource(db, actor.collegeId, resourceId);
  const patch: Row = { updated_at: db.fn.now() };
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.requiresApproval !== undefined) patch.requires_approval = input.requiresApproval;
  if (input.setupBufferMinutes !== undefined) patch.setup_buffer_minutes = input.setupBufferMinutes;
  if (input.cleanupBufferMinutes !== undefined) patch.cleanup_buffer_minutes = input.cleanupBufferMinutes;
  if (input.notes !== undefined) patch.notes = input.notes;
  await db('campus_bookable_resources').where({ id: resourceId, college_id: actor.collegeId }).update(patch);
  const after = await getResource(db, actor.collegeId, resourceId);
  await recordEventsAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'RESOURCE_UPDATED', entityType: 'campus_bookable_resource', entityId: resourceId, before, after });
  return after;
}

/** Candidates the resource manager may opt in: canonical rooms/assets not yet configured. */
export async function listResourceCandidates(actor: EventsActor) {
  assertEventsPermission(actor, 'events.resource.manage');
  const configured = await db('campus_bookable_resources').where({ college_id: actor.collegeId }).select('room_id', 'asset_id');
  const roomIds = configured.filter((c) => c.room_id != null).map((c) => n(c.room_id));
  const assetIds = configured.filter((c) => c.asset_id != null).map((c) => n(c.asset_id));
  const rooms = await db('rooms').where({ college_id: actor.collegeId })
    .modify((q) => { if (roomIds.length) q.whereNotIn('id', roomIds); })
    .orderBy('name').limit(500)
    .select('id', 'name', 'code', 'type', 'building', 'capacity', 'status');
  const assets = await db('campus_assets').where({ college_id: actor.collegeId })
    .whereNotIn('status', [...UNBOOKABLE_ASSET_STATUSES])
    .modify((q) => { if (assetIds.length) q.whereNotIn('id', assetIds); })
    .orderBy('name').limit(500)
    .select('id', 'name', 'asset_tag', 'category', 'status');
  return {
    rooms: rooms.map((r: Row) => ({ id: n(r.id), name: r.name, code: r.code, type: r.type, building: r.building, capacity: r.capacity != null ? n(r.capacity) : null, status: r.status })),
    assets: assets.map((a: Row) => ({ id: n(a.id), name: a.name, assetTag: a.asset_tag, category: a.category, status: a.status })),
  };
}
