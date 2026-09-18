import { addDays, compareISODate, toISODate, weekdayOf } from '../lessonPlans/dates.js';
import { DAY_LABELS } from './types.js';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
export function asISODate(value) {
    if (value instanceof Date)
        return toISODate(value);
    const s = String(value ?? '');
    if (ISO_DATE.test(s.slice(0, 10)))
        return s.slice(0, 10);
    return s;
}
export function asHHMM(value) {
    if (value instanceof Date) {
        const h = String(value.getHours()).padStart(2, '0');
        const m = String(value.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }
    const s = String(value ?? '').trim();
    const m = HHMM.exec(s);
    if (!m)
        return s.slice(0, 5);
    return `${m[1].padStart(2, '0')}:${m[2]}`;
}
export function minutesOf(hhmm) {
    const [h, m] = asHHMM(hhmm).split(':').map(Number);
    return h * 60 + m;
}
export function hoursBetween(start, end) {
    const diff = minutesOf(end) - minutesOf(start);
    return Math.max(0, Math.round((diff / 60) * 100) / 100);
}
export function timesOverlap(aStart, aEnd, bStart, bEnd) {
    return minutesOf(aStart) < minutesOf(bEnd) && minutesOf(bStart) < minutesOf(aEnd);
}
export function dateRangesOverlap(aFrom, aTo, bFrom, bTo) {
    const aEnd = aTo && aTo.length ? aTo : '9999-12-31';
    const bEnd = bTo && bTo.length ? bTo : '9999-12-31';
    return compareISODate(aFrom, bEnd) <= 0 && compareISODate(bFrom, aEnd) <= 0;
}
export function dateInRange(date, from, to) {
    if (compareISODate(date, from) < 0)
        return false;
    if (to && compareISODate(date, to) > 0)
        return false;
    return true;
}
export function collegeTimezone(raw) {
    return raw && raw.trim() ? raw.trim() : 'Asia/Kolkata';
}
export function todayInTimezone(timeZone, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d)
        return `${y}-${m}-${d}`;
    return toISODate(now);
}
/** Civil weekday of a YYYY-MM-DD timetable date (0=Sun … 6=Sat). */
export function weekdayInTimezone(iso, _timeZone) {
    return weekdayOf(iso);
}
export function dayLabel(dayOfWeek) {
    return DAY_LABELS[dayOfWeek] ?? `Day ${dayOfWeek}`;
}
export function eachDate(from, to) {
    const out = [];
    let cursor = from;
    while (compareISODate(cursor, to) <= 0) {
        out.push(cursor);
        cursor = addDays(cursor, 1);
    }
    return out;
}
export function startOfWeek(iso, timeZone) {
    const weekday = weekdayInTimezone(iso, timeZone);
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    return addDays(iso, mondayOffset);
}
export function weekRange(iso, timeZone) {
    const from = startOfWeek(iso, timeZone);
    return { from, to: addDays(from, 5) };
}
export function formatClock(hhmm) {
    const [hStr, m] = asHHMM(hhmm).split(':');
    const h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = ((h + 11) % 12) + 1;
    return `${hour}:${m} ${suffix}`;
}
