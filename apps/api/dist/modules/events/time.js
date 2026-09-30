import { AppError } from '../../utils/errors.js';
/**
 * College-local wall-clock datetimes. Stored in DATETIME columns as
 * "YYYY-MM-DD HH:MM:SS"; arithmetic treats the wall time as UTC so buffers
 * never shift with the server timezone. Canonical strings compare correctly
 * with plain string comparison.
 */
const WALL = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
function pad(n) {
    return String(n).padStart(2, '0');
}
export function normalizeWall(value) {
    const m = WALL.exec(value.trim());
    if (!m)
        throw new AppError(400, `Invalid datetime "${value}" — use YYYY-MM-DDTHH:MM`);
    const [, y, mo, d, h, mi, s] = m;
    const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
    const out = msToWall(ms);
    if (out.slice(0, 16) !== `${y}-${mo}-${d} ${h}:${mi}`)
        throw new AppError(400, `Invalid datetime "${value}"`);
    return out;
}
export function wallToMs(wall) {
    const m = WALL.exec(wall);
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
}
export function msToWall(ms) {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
export function addMinutes(wall, minutes) {
    return msToWall(wallToMs(wall) + minutes * 60_000);
}
/** mysql2 returns DATETIME as a Date built in the process timezone; read it back with local getters. */
export function fromDb(value) {
    if (value == null)
        return null;
    if (value instanceof Date) {
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
    }
    return normalizeWall(String(value));
}
export function toApi(wall) {
    return wall ? `${wall.slice(0, 10)}T${wall.slice(11, 16)}` : null;
}
export function datePart(wall) {
    return wall.slice(0, 10);
}
export function nowWall(timeZone, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const get = (t) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}
/** Half-open interval overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅, so back-to-back slots do not conflict. */
export function windowsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
}
export function assertValidRange(start, end, maxDays) {
    if (end <= start)
        throw new AppError(400, 'End time must be after start time');
    if (wallToMs(end) - wallToMs(start) > maxDays * 86_400_000) {
        throw new AppError(400, `A booking window cannot exceed ${maxDays} days`);
    }
}
