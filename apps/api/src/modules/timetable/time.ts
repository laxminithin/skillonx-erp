import { addDays, compareISODate, toISODate, weekdayOf } from '../lessonPlans/dates.js';
import { DAY_LABELS } from './types.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

export function asISODate(value: unknown): string {
  if (value instanceof Date) return toISODate(value);
  const s = String(value ?? '');
  if (ISO_DATE.test(s.slice(0, 10))) return s.slice(0, 10);
  return s;
}

export function asHHMM(value: unknown): string {
  if (value instanceof Date) {
    const h = String(value.getHours()).padStart(2, '0');
    const m = String(value.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(value ?? '').trim();
  const m = HHMM.exec(s);
  if (!m) return s.slice(0, 5);
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

export function minutesOf(hhmm: string): number {
  const [h, m] = asHHMM(hhmm).split(':').map(Number);
  return h * 60 + m;
}

export function hoursBetween(start: string, end: string): number {
  const diff = minutesOf(end) - minutesOf(start);
  return Math.max(0, Math.round((diff / 60) * 100) / 100);
}

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return minutesOf(aStart) < minutesOf(bEnd) && minutesOf(bStart) < minutesOf(aEnd);
}

export function dateRangesOverlap(
  aFrom: string,
  aTo: string | null | undefined,
  bFrom: string,
  bTo: string | null | undefined,
): boolean {
  const aEnd = aTo && aTo.length ? aTo : '9999-12-31';
  const bEnd = bTo && bTo.length ? bTo : '9999-12-31';
  return compareISODate(aFrom, bEnd) <= 0 && compareISODate(bFrom, aEnd) <= 0;
}

export function dateInRange(date: string, from: string, to?: string | null): boolean {
  if (compareISODate(date, from) < 0) return false;
  if (to && compareISODate(date, to) > 0) return false;
  return true;
}

export function collegeTimezone(raw?: string | null): string {
  return raw && raw.trim() ? raw.trim() : 'Asia/Kolkata';
}

export function todayInTimezone(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (y && m && d) return `${y}-${m}-${d}`;
  return toISODate(now);
}

/** Civil weekday of a YYYY-MM-DD timetable date (0=Sun … 6=Sat). */
export function weekdayInTimezone(iso: string, _timeZone?: string): number {
  return weekdayOf(iso);
}

export function dayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  let cursor = from;
  while (compareISODate(cursor, to) <= 0) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function startOfWeek(iso: string, timeZone: string): string {
  const weekday = weekdayInTimezone(iso, timeZone);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(iso, mondayOffset);
}

export function weekRange(iso: string, timeZone: string): { from: string; to: string } {
  const from = startOfWeek(iso, timeZone);
  return { from, to: addDays(from, 5) };
}

export function formatClock(hhmm: string): string {
  const [hStr, m] = asHHMM(hhmm).split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${m} ${suffix}`;
}
