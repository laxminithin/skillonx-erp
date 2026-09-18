import { WAITING_STATUSES } from './types.js';
const APPROACHING_FRACTION = 0.8; // within the last 20% of the window → "approaching"
export function isWaiting(status) {
    return WAITING_STATUSES.includes(status);
}
/** Total paused ms including the currently-open pause (if any) at time `now`. */
export function totalPausedMs(row, now = Date.now()) {
    const base = Number(row.sla_paused_ms ?? 0);
    if (row.sla_paused_at) {
        const startedAt = new Date(row.sla_paused_at).getTime();
        if (Number.isFinite(startedAt))
            return base + Math.max(0, now - startedAt);
    }
    return base;
}
/** Effective due timestamp (ms epoch) accounting for paused time. */
export function effectiveDue(dueAt, pausedMs) {
    if (!dueAt)
        return null;
    const t = new Date(dueAt).getTime();
    if (!Number.isFinite(t))
        return null;
    return t + pausedMs;
}
/**
 * Compute the live SLA state for one dimension (ack or resolve).
 * `completedAt` is the acknowledged/resolved timestamp if that milestone is done.
 */
export function computeState(input) {
    const now = input.now ?? Date.now();
    const due = effectiveDue(input.dueAt, input.pausedMs);
    if (due === null)
        return { state: 'NONE', dueAt: null, remainingMs: null };
    if (input.completedAt) {
        const done = new Date(input.completedAt).getTime();
        return { state: done <= due ? 'MET' : 'BREACHED', dueAt: due, remainingMs: null };
    }
    if (input.paused)
        return { state: 'PAUSED', dueAt: due, remainingMs: due - now };
    const start = new Date(input.createdAt).getTime();
    const window = due - start;
    const remaining = due - now;
    if (remaining < 0)
        return { state: 'BREACHED', dueAt: due, remainingMs: remaining };
    if (window > 0 && remaining <= window * (1 - APPROACHING_FRACTION)) {
        return { state: 'APPROACHING', dueAt: due, remainingMs: remaining };
    }
    return { state: 'WITHIN', dueAt: due, remainingMs: remaining };
}
/** Roll-up used in list/badge rendering: worst of ack/resolve. */
export function overallSlaState(ack, resolve) {
    const order = ['BREACHED', 'APPROACHING', 'PAUSED', 'WITHIN', 'MET', 'NONE'];
    for (const s of order)
        if (ack === s || resolve === s)
            return s;
    return 'NONE';
}
