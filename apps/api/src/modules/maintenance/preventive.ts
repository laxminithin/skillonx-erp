import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { MaintActor, FrequencyUnit } from './types.js';
import { assertMaintPermission } from './access.js';
import { findAssetRef } from '../assetManagement/service.js';
import { createTicket } from './tickets.js';
import { recordMaintAudit } from './audit.js';

/**
 * Preventive maintenance scheduling — the one proven Phase 3 gap (see
 * docs/CAMPUS_OS_PHASE3_PREIMPLEMENTATION_AUDIT.md). A plan describes a
 * recurring maintenance need; `generateDue` turns each due occurrence into an
 * ordinary `service_tickets` row through the existing, frozen ticket engine
 * (`createTicket`) — never a parallel work-order model.
 *
 * Idempotency: `maintenance_preventive_occurrences` has a UNIQUE(plan_id,
 * occurrence_date) constraint. Concurrency: the plan row is locked
 * (`forUpdate`) before its `next_due_date` is read/advanced, so two
 * concurrent `generateDue` calls can never generate the same occurrence twice
 * or skip one.
 */

function addFrequency(date: Date, unit: FrequencyUnit, value: number): Date {
  const d = new Date(date);
  if (unit === 'DAYS') d.setDate(d.getDate() + value);
  else if (unit === 'WEEKS') d.setDate(d.getDate() + value * 7);
  else if (unit === 'MONTHS') d.setMonth(d.getMonth() + value);
  else d.setFullYear(d.getFullYear() + value);
  return d;
}

function toDateOnly(v: unknown): string {
  const d = v instanceof Date ? v : new Date(String(v));
  return d.toISOString().slice(0, 10);
}

function shapePlan(row: Record<string, unknown>) {
  return {
    id: Number(row.id), name: row.name, description: row.description ?? null,
    assetId: row.asset_id ? Number(row.asset_id) : null, assetTag: (row.asset_tag as string) ?? null,
    categoryId: row.category_id ? Number(row.category_id) : null, categoryName: (row.category_name as string) ?? null,
    teamId: row.team_id ? Number(row.team_id) : null, teamName: (row.team_name as string) ?? null,
    vendorId: row.vendor_id ? Number(row.vendor_id) : null, vendorName: (row.vendor_name as string) ?? null,
    roomId: row.room_id ? Number(row.room_id) : null, building: row.building ?? null,
    frequencyUnit: row.frequency_unit, frequencyValue: Number(row.frequency_value),
    priority: row.priority, checklist: row.checklist ? JSON.parse(String(row.checklist)) : [],
    nextDueDate: row.next_due_date, lastGeneratedDate: row.last_generated_date ?? null,
    status: row.status, notes: row.notes ?? null, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const planQuery = (collegeId: number) => db('maintenance_preventive_plans as p')
  .leftJoin('campus_assets as a', 'a.id', 'p.asset_id')
  .leftJoin('service_categories as c', 'c.id', 'p.category_id')
  .leftJoin('service_teams as tm', 'tm.id', 'p.team_id')
  .leftJoin('procurement_vendors as v', 'v.id', 'p.vendor_id')
  .where('p.college_id', collegeId)
  .select('p.*', 'a.asset_tag', 'c.name as category_name', 'tm.name as team_name', 'v.name as vendor_name');

export async function listPlans(actor: MaintActor, filters: { status?: string; assetId?: number } = {}) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  let q = planQuery(actor.collegeId);
  if (filters.status) q = q.where('p.status', filters.status);
  if (filters.assetId) q = q.where('p.asset_id', filters.assetId);
  const rows = await q.orderBy('p.next_due_date', 'asc');
  return rows.map(shapePlan);
}

export async function getPlan(actor: MaintActor, planId: number) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  const row = await planQuery(actor.collegeId).where('p.id', planId).first();
  if (!row) throw new AppError(404, 'Preventive plan not found');
  return shapePlan(row);
}

export async function createPlan(actor: MaintActor, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.preventive.manage');

  if (input.assetId) {
    const asset = await findAssetRef(actor.collegeId, Number(input.assetId));
    if (!asset) throw new AppError(404, 'Asset not found');
  }
  if (input.categoryId) {
    const cat = await db('service_categories').where({ id: input.categoryId, college_id: actor.collegeId }).first();
    if (!cat) throw new AppError(404, 'Category not found');
  }
  if (input.teamId) {
    const team = await db('service_teams').where({ id: input.teamId, college_id: actor.collegeId }).first();
    if (!team) throw new AppError(404, 'Team not found');
  }
  if (input.roomId) {
    const room = await db('rooms').where({ id: input.roomId, college_id: actor.collegeId }).first();
    if (!room) throw new AppError(404, 'Room not found');
  }

  const [id] = await db('maintenance_preventive_plans').insert({
    college_id: actor.collegeId, name: input.name, description: input.description ?? null,
    asset_id: input.assetId ?? null, category_id: input.categoryId ?? null, team_id: input.teamId ?? null,
    vendor_id: input.vendorId ?? null, room_id: input.roomId ?? null, building: input.building ?? null,
    frequency_unit: input.frequencyUnit ?? 'MONTHS', frequency_value: input.frequencyValue ?? 1,
    priority: input.priority ?? 'NORMAL',
    checklist: input.checklist ? JSON.stringify(input.checklist) : null,
    next_due_date: toDateOnly(input.nextDueDate), status: 'ACTIVE', notes: input.notes ?? null,
    created_by: actor.kind === 'FACULTY' ? actor.facultyUserId : null,
  });
  await recordMaintAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'PREVENTIVE_PLAN_CREATED', entityType: 'preventive_plan', entityId: Number(id), after: input });
  return getPlan(actor, Number(id));
}

export async function updatePlan(actor: MaintActor, planId: number, input: Record<string, unknown>) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  const existing = await db('maintenance_preventive_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!existing) throw new AppError(404, 'Preventive plan not found');

  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  for (const [key, col] of [
    ['name', 'name'], ['description', 'description'], ['assetId', 'asset_id'], ['categoryId', 'category_id'],
    ['teamId', 'team_id'], ['vendorId', 'vendor_id'], ['roomId', 'room_id'], ['building', 'building'],
    ['frequencyUnit', 'frequency_unit'], ['frequencyValue', 'frequency_value'], ['priority', 'priority'],
    ['notes', 'notes'], ['status', 'status'],
  ] as const) {
    if (input[key] !== undefined) patch[col] = input[key];
  }
  if (input.checklist !== undefined) patch.checklist = input.checklist ? JSON.stringify(input.checklist) : null;
  if (input.nextDueDate !== undefined) patch.next_due_date = toDateOnly(input.nextDueDate);

  await db('maintenance_preventive_plans').where({ id: planId, college_id: actor.collegeId }).update(patch);
  await recordMaintAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'PREVENTIVE_PLAN_UPDATED', entityType: 'preventive_plan', entityId: planId, before: existing, after: patch });
  return getPlan(actor, planId);
}

export async function listOccurrences(actor: MaintActor, planId: number) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  const plan = await db('maintenance_preventive_plans').where({ id: planId, college_id: actor.collegeId }).first();
  if (!plan) throw new AppError(404, 'Preventive plan not found');
  const rows = await db('maintenance_preventive_occurrences as o')
    .leftJoin('service_tickets as t', 't.id', 'o.ticket_id')
    .where('o.plan_id', planId).where('o.college_id', actor.collegeId)
    .select('o.*', 't.ticket_no', 't.status as ticket_status')
    .orderBy('o.occurrence_date', 'desc');
  return rows.map((r) => ({
    id: Number(r.id), occurrenceDate: r.occurrence_date, status: r.status,
    ticketId: r.ticket_id ? Number(r.ticket_id) : null, ticketNo: r.ticket_no ?? null, ticketStatus: r.ticket_status ?? null,
    generatedAt: r.generated_at ?? null,
  }));
}

/**
 * Generate a ticket for one occurrence of one plan whose `next_due_date` is
 * on/before `asOf`, and advance the plan to its next occurrence.
 *
 * Concurrency-safe: the plan row is locked FOR UPDATE for the
 * read-check-advance, inside one transaction. A second concurrent caller
 * blocks on the lock, then (after commit) sees the already-advanced
 * `next_due_date` and correctly finds nothing due — no duplicate occurrence,
 * no skipped occurrence. The occurrence table's UNIQUE(plan_id, occurrence_date)
 * is a second, independent backstop against a duplicate row.
 */
async function generateOnePlan(actor: MaintActor, planId: number, asOf: Date): Promise<{ generated: boolean; occurrenceId?: number; ticketId?: number; reason?: string }> {
  return db.transaction(async (trx) => {
    const plan = await trx('maintenance_preventive_plans').where({ id: planId, college_id: actor.collegeId }).forUpdate().first();
    if (!plan) return { generated: false, reason: 'NOT_FOUND' };
    if (plan.status !== 'ACTIVE') return { generated: false, reason: 'NOT_ACTIVE' };
    const dueDate = new Date(plan.next_due_date);
    if (dueDate.getTime() > asOf.getTime()) return { generated: false, reason: 'NOT_DUE' };

    const occurrenceDate = toDateOnly(dueDate);
    let occurrenceId: number;
    try {
      const [id] = await trx('maintenance_preventive_occurrences').insert({
        college_id: actor.collegeId, plan_id: planId, occurrence_date: occurrenceDate, status: 'PENDING',
      });
      occurrenceId = Number(id);
    } catch {
      // Unique-constraint hit: another caller already recorded this occurrence.
      return { generated: false, reason: 'ALREADY_GENERATED' };
    }

    const nextDue = addFrequency(dueDate, plan.frequency_unit as FrequencyUnit, Number(plan.frequency_value));
    await trx('maintenance_preventive_plans').where({ id: planId }).update({
      next_due_date: toDateOnly(nextDue), last_generated_date: occurrenceDate, updated_at: trx.fn.now(),
    });
    return { generated: true, occurrenceId };
  });
}

export async function generateDue(actor: MaintActor, input: { asOf?: string } = {}) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  const asOf = input.asOf ? new Date(input.asOf) : new Date();

  const duePlans = await db('maintenance_preventive_plans')
    .where({ college_id: actor.collegeId, status: 'ACTIVE' })
    .where('next_due_date', '<=', toDateOnly(asOf))
    .select('id');

  const results: Array<{ planId: number; generated: boolean; ticketNo?: string; reason?: string }> = [];
  for (const p of duePlans) {
    const planId = Number(p.id);
    const outcome = await generateOnePlan(actor, planId, asOf);
    if (!outcome.generated) {
      results.push({ planId, generated: false, reason: outcome.reason });
      continue;
    }
    // Ticket creation happens after the occurrence is durably recorded, so a
    // failure here is recoverable via retryOccurrenceTicket — never a duplicate.
    try {
      const ticket = await ticketForOccurrence(actor, planId, outcome.occurrenceId!);
      results.push({ planId, generated: true, ticketNo: String(ticket.ticketNo) });
    } catch (err) {
      results.push({ planId, generated: false, reason: `TICKET_CREATE_FAILED: ${(err as Error).message}` });
    }
  }
  return { asOf: toDateOnly(asOf), results };
}

async function ticketForOccurrence(actor: MaintActor, planId: number, occurrenceId: number) {
  const plan = await planQuery(actor.collegeId).where('p.id', planId).first();
  if (!plan) throw new AppError(404, 'Preventive plan not found');

  const ticket = await createTicket(actor, {
    title: `Preventive maintenance: ${plan.name}`,
    description: `Scheduled preventive maintenance occurrence for plan "${plan.name}".${plan.notes ? `\n${plan.notes}` : ''}`,
    categoryId: plan.category_id ?? undefined,
    priority: plan.priority,
    roomId: plan.room_id ?? undefined,
    building: plan.building ?? undefined,
    assetId: plan.asset_id ?? undefined,
    sourceModule: 'GENERAL', sourceEntityType: 'PREVENTIVE_PLAN', sourceEntityId: planId,
  });

  await db('maintenance_preventive_occurrences').where({ id: occurrenceId, college_id: actor.collegeId })
    .update({ status: 'GENERATED', ticket_id: ticket.id, generated_at: db.fn.now() });
  return ticket;
}

/** Manual recovery: create the ticket for an occurrence that was recorded but never got one (e.g. a prior failure). */
export async function retryOccurrenceTicket(actor: MaintActor, occurrenceId: number) {
  assertMaintPermission(actor, 'maint.preventive.manage');
  const occ = await db('maintenance_preventive_occurrences').where({ id: occurrenceId, college_id: actor.collegeId }).first();
  if (!occ) throw new AppError(404, 'Occurrence not found');
  if (occ.ticket_id) throw new AppError(409, 'A ticket already exists for this occurrence');
  const ticket = await ticketForOccurrence(actor, Number(occ.plan_id), occurrenceId);
  return ticket;
}

/** Plans due within the next N days — for the manager dashboard / reports. */
export async function upcomingDue(collegeId: number, withinDays = 14) {
  const until = new Date(); until.setDate(until.getDate() + withinDays);
  const rows = await planQuery(collegeId).where('p.status', 'ACTIVE').where('p.next_due_date', '<=', toDateOnly(until))
    .orderBy('p.next_due_date', 'asc').limit(50);
  return rows.map(shapePlan);
}
