import { db } from '../../db/index.js';
/** Config / system-level audit (non-ticket). Ticket audit lives in service_ticket_events. */
export async function recordMaintAudit(input) {
    if (!(await db.schema.hasTable('maintenance_audit_log')))
        return;
    await db('maintenance_audit_log').insert({
        college_id: input.collegeId,
        actor_id: input.actorId ?? null,
        actor_type: input.actorType ?? 'FACULTY',
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        before_state: input.before ? JSON.stringify(input.before) : null,
        after_state: input.after ? JSON.stringify(input.after) : null,
        reason: input.reason ?? null,
    });
}
export function auditConfig(actor, action, entityType, entityId, extra) {
    return recordMaintAudit({
        collegeId: actor.collegeId,
        actorId: actor.kind === 'FACULTY' ? actor.facultyUserId : actor.studentId,
        actorType: actor.kind,
        action,
        entityType,
        entityId,
        before: extra?.before,
        after: extra?.after,
        reason: extra?.reason ?? null,
    });
}
/**
 * Append a ticket timeline / audit event. This IS the ticket audit trail —
 * every routing, assignment, status, priority, SLA, comment, part, resolution,
 * reopen and closure action records one row. `visibility` gates requester
 * exposure.
 */
export async function recordEvent(input) {
    await db('service_ticket_events').insert({
        college_id: input.collegeId,
        ticket_id: input.ticketId,
        event_type: input.eventType,
        visibility: input.visibility ?? 'PUBLIC',
        actor_type: input.actorTypeOverride ?? input.actor?.kind ?? 'SYSTEM',
        actor_id: input.actor ? (input.actor.kind === 'FACULTY' ? input.actor.facultyUserId : input.actor.studentId) ?? null : null,
        actor_name: input.actor?.name ?? 'System',
        from_value: input.fromValue ?? null,
        to_value: input.toValue ?? null,
        note: input.note ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
    });
}
