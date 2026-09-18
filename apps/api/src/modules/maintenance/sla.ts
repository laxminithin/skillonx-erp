import { WAITING_STATUSES, type TicketStatus } from './types.js';

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

const APPROACHING_FRACTION = 0.8; // within the last 20% of the window → "approaching"

export function isWaiting(status: TicketStatus | string): boolean {
  return WAITING_STATUSES.includes(status as TicketStatus);
}

/** Total paused ms including the currently-open pause (if any) at time `now`. */
export function totalPausedMs(row: { sla_paused_ms?: number | null; sla_paused_at?: Date | string | null }, now = Date.now()): number {
  const base = Number(row.sla_paused_ms ?? 0);
  if (row.sla_paused_at) {
    const startedAt = new Date(row.sla_paused_at).getTime();
    if (Number.isFinite(startedAt)) return base + Math.max(0, now - startedAt);
  }
  return base;
}

/** Effective due timestamp (ms epoch) accounting for paused time. */
export function effectiveDue(dueAt: Date | string | null | undefined, pausedMs: number): number | null {
  if (!dueAt) return null;
  const t = new Date(dueAt).getTime();
  if (!Number.isFinite(t)) return null;
  return t + pausedMs;
}

/**
 * Compute the live SLA state for one dimension (ack or resolve).
 * `completedAt` is the acknowledged/resolved timestamp if that milestone is done.
 */
export function computeState(input: {
  dueAt: Date | string | null | undefined;
  createdAt: Date | string;
  pausedMs: number;
  completedAt?: Date | string | null;
  paused?: boolean;
  now?: number;
}): { state: SlaState; dueAt: number | null; remainingMs: number | null } {
  const now = input.now ?? Date.now();
  const due = effectiveDue(input.dueAt, input.pausedMs);
  if (due === null) return { state: 'NONE', dueAt: null, remainingMs: null };

  if (input.completedAt) {
    const done = new Date(input.completedAt).getTime();
    return { state: done <= due ? 'MET' : 'BREACHED', dueAt: due, remainingMs: null };
  }
  if (input.paused) return { state: 'PAUSED', dueAt: due, remainingMs: due - now };

  const start = new Date(input.createdAt).getTime();
  const window = due - start;
  const remaining = due - now;
  if (remaining < 0) return { state: 'BREACHED', dueAt: due, remainingMs: remaining };
  if (window > 0 && remaining <= window * (1 - APPROACHING_FRACTION)) {
    return { state: 'APPROACHING', dueAt: due, remainingMs: remaining };
  }
  return { state: 'WITHIN', dueAt: due, remainingMs: remaining };
}

/** Roll-up used in list/badge rendering: worst of ack/resolve. */
export function overallSlaState(ack: SlaState, resolve: SlaState): SlaState {
  const order: SlaState[] = ['BREACHED', 'APPROACHING', 'PAUSED', 'WITHIN', 'MET', 'NONE'];
  for (const s of order) if (ack === s || resolve === s) return s;
  return 'NONE';
}
