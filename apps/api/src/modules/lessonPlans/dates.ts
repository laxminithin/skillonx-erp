/** Local-calendar date helpers. Avoid UTC parsing of YYYY-MM-DD strings. */

export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) throw new Error(`Invalid date: ${iso}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function compareISODate(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function weekdayOf(iso: string): number {
  return parseISODate(iso).getDay();
}

export function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseISODate(iso);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function sqlDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return toISODate(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}
