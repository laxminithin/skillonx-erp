import type { MaintActor } from './types.js';
/** Config / system-level audit (non-ticket). Ticket audit lives in service_ticket_events. */
export declare function recordMaintAudit(input: {
    collegeId: number;
    actorId?: number | null;
    actorType?: string;
    action: string;
    entityType: string;
    entityId?: number | null;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
export declare function auditConfig(actor: MaintActor, action: string, entityType: string, entityId: number | null, extra?: {
    before?: unknown;
    after?: unknown;
    reason?: string | null;
}): Promise<void>;
/**
 * Append a ticket timeline / audit event. This IS the ticket audit trail —
 * every routing, assignment, status, priority, SLA, comment, part, resolution,
 * reopen and closure action records one row. `visibility` gates requester
 * exposure.
 */
export declare function recordEvent(input: {
    collegeId: number;
    ticketId: number;
    eventType: string;
    visibility?: 'PUBLIC' | 'INTERNAL';
    actor?: MaintActor | null;
    actorTypeOverride?: 'SYSTEM';
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
    meta?: unknown;
}): Promise<void>;
