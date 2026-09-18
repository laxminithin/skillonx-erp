import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { MaintActor } from './types.js';
import { recordEvent } from './audit.js';

/**
 * Source-module integration boundary.
 *
 * Maintenance is a CENTRAL service layer. Source modules keep domain ownership.
 * Integration is by reference only:
 *   - LAB: reuses `lab_faults.maintenance_ref` (the frozen Lab boundary). We
 *     NEVER create a second lab fault and NEVER mutate lab asset lifecycle.
 *   - HOSTEL / LIBRARY / TRANSPORT / CLASSROOM: linked via source_module /
 *     source_entity_type / source_entity_id on the ticket — no duplicate rows.
 */

/** Link an existing frozen-module Lab fault to a central maintenance ticket. */
export async function linkLabFault(actor: MaintActor, faultId: number, extra?: { priority?: string; note?: string }) {
  if (!(await db.schema.hasTable('lab_faults'))) throw new AppError(400, 'Lab module not available');
  const fault = await db('lab_faults as ft')
    .leftJoin('labs as l', 'l.id', 'ft.lab_id')
    .leftJoin('lab_assets as a', 'a.id', 'ft.asset_id')
    .where('ft.id', faultId).where('ft.college_id', actor.collegeId)
    .select('ft.*', 'l.name as lab_name', 'l.room_id as room_id', 'l.department_id as department_id', 'a.asset_tag as asset_tag')
    .first();
  if (!fault) throw new AppError(404, 'Lab fault not found');

  // Idempotent: if already linked to a live ticket, return it (never duplicate).
  if (fault.maintenance_ref) {
    const existing = await db('service_tickets').where({ college_id: actor.collegeId, ticket_no: fault.maintenance_ref }).first();
    if (existing && !['CLOSED', 'CANCELLED'].includes(existing.status)) {
      const { getTicket } = await import('./tickets.js');
      return getTicket(actor, Number(existing.id));
    }
  }

  const { createTicket } = await import('./tickets.js');
  const severityToPriority: Record<string, string> = { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'NORMAL', LOW: 'LOW' };
  const ticket = await createTicket(actor, {
    title: `Lab fault: ${fault.lab_name ?? 'Lab'}${fault.asset_tag ? ` (${fault.asset_tag})` : ''}`,
    description: `${fault.description}\n\n[Linked from Lab fault #${fault.id}, severity ${fault.severity}]${extra?.note ? `\n${extra.note}` : ''}`,
    categoryCode: 'LAB_EQUIPMENT',
    priority: extra?.priority ?? severityToPriority[String(fault.severity)] ?? 'NORMAL',
    roomId: fault.room_id ?? undefined,
    sourceModule: 'LAB', sourceEntityType: 'LAB_FAULT', sourceEntityId: Number(fault.id),
    assetRef: fault.asset_tag ?? undefined,
  });

  // Store the central ticket number back on the frozen Lab fault (the boundary field).
  await db('lab_faults').where({ id: faultId }).update({ maintenance_ref: ticket.ticketNo, updated_at: db.fn.now() });
  await recordEvent({ collegeId: actor.collegeId, ticketId: ticket.id, eventType: 'STATUS_CHANGE', actor, visibility: 'INTERNAL', note: `Linked to Lab fault #${faultId} (maintenance_ref set)` });
  return ticket;
}

/**
 * On resolution, safely sync back to the source module. For Lab, we record the
 * resolution against the fault's maintenance_ref context. We do NOT flip the
 * lab fault status or asset lifecycle — the Lab Assistant verifies operational
 * condition and closes the fault through the frozen Lab workflow.
 */
export async function onTicketResolvedSyncSource(actor: MaintActor, ticket: Record<string, unknown>) {
  try {
    if (ticket.source_module === 'LAB' && ticket.source_entity_type === 'LAB_FAULT' && ticket.source_entity_id) {
      if (!(await db.schema.hasTable('lab_faults'))) return;
      const fault = await db('lab_faults').where({ id: Number(ticket.source_entity_id), college_id: actor.collegeId }).first();
      if (!fault) return;
      // Ensure the boundary ref is set; leave status to the Lab workflow.
      if (!fault.maintenance_ref) {
        await db('lab_faults').where({ id: fault.id }).update({ maintenance_ref: ticket.ticket_no, updated_at: db.fn.now() });
      }
      // Best-effort audit into the lab audit log so Lab Assistant sees context.
      if (await db.schema.hasTable('lab_audit_log')) {
        await db('lab_audit_log').insert({
          college_id: actor.collegeId, actor_id: actor.facultyUserId ?? null, actor_type: 'MAINTENANCE',
          action: 'MAINTENANCE_RESOLVED', entity_type: 'lab_fault', entity_id: Number(fault.id),
          after_state: JSON.stringify({ maintenanceRef: ticket.ticket_no, resolution: ticket.resolution_summary }),
          reason: 'Central Maintenance resolved the linked service ticket; awaiting Lab verification.',
        });
      }
    }
  } catch {
    /* best-effort — never break resolution on a source-sync failure */
  }
}

/** Source entities a requester can attach for a given module (for the create UX). */
export async function sourceOptions(actor: MaintActor, module: string) {
  if (module === 'LAB') {
    if (!(await db.schema.hasTable('lab_faults'))) return [];
    const rows = await db('lab_faults as ft')
      .leftJoin('labs as l', 'l.id', 'ft.lab_id')
      .where('ft.college_id', actor.collegeId).whereNotIn('ft.status', ['RESOLVED', 'CLOSED'])
      .whereNull('ft.maintenance_ref')
      .select('ft.id', 'ft.description', 'ft.severity', 'l.name as lab_name')
      .orderBy('ft.created_at', 'desc').limit(50);
    return rows.map((r) => ({ id: Number(r.id), type: 'LAB_FAULT', label: `${r.lab_name}: ${String(r.description).slice(0, 60)} (${r.severity})` }));
  }
  return [];
}
