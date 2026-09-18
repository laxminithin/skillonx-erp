import { type TicketStatus } from './types.js';
/**
 * Deterministic, auditable SLA engine.
 *
 * Due times are computed from the category's ack/resolve minute targets at
 * creation and stored on the ticket. Elapsed clock excludes paused time:
 * whenever a ticket enters a WAITING_* state the pause clock starts, and on
 * leaving it the accumulated paused duration is added to sla_paused_ms. The
 * effective due time is therefore (stored due + total paused). No SLA number is
 * faked — everything derives from real timestamps.
 */
export type SlaState = 'WITHIN' | 'APPROACHING' | 'BREACHED' | 'MET' | 'PAUSED' | 'NONE';
export declare function isWaiting(status: TicketStatus | string): boolean;
/** Total paused ms including the currently-open pause (if any) at time `now`. */
export declare function totalPausedMs(row: {
    sla_paused_ms?: number | null;
    sla_paused_at?: Date | string | null;
}, now?: number): number;
/** Effective due timestamp (ms epoch) accounting for paused time. */
export declare function effectiveDue(dueAt: Date | string | null | undefined, pausedMs: number): number | null;
/**
 * Compute the live SLA state for one dimension (ack or resolve).
 * `completedAt` is the acknowledged/resolved timestamp if that milestone is done.
 */
export declare function computeState(input: {
    dueAt: Date | string | null | undefined;
    createdAt: Date | string;
    pausedMs: number;
    completedAt?: Date | string | null;
    paused?: boolean;
    now?: number;
}): {
    state: SlaState;
    dueAt: number | null;
    remainingMs: number | null;
};
/** Roll-up used in list/badge rendering: worst of ack/resolve. */
export declare function overallSlaState(ack: SlaState, resolve: SlaState): SlaState;
