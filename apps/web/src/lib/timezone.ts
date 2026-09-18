export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

function pad(n: number, width = 2) {
  return String(n).padStart(width, '0');
}

export function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string) => {
    const value = parts.find((p) => p.type === type)?.value;
    if (!value) throw new Error(`Missing datetime part: ${type}`);
    return Number(value);
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** Interpret datetime-local wall time in institution timezone → UTC ISO string. */
export function zonedLocalToUtcIso(
  localDateTime: string,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const trimmed = localDateTime.trim();
  const match = LOCAL_INPUT_RE.exec(trimmed);
  if (!match) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid local datetime: ${localDateTime}`);
    return parsed.toISOString();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);

  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i += 1) {
    const parts = getZonedParts(new Date(utcGuess), timeZone);
    const asUtcFromParts = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = desiredAsUtc - asUtcFromParts;
    utcGuess += diff;
    if (diff === 0) break;
  }

  return new Date(utcGuess).toISOString();
}

export function utcToZonedLocalInput(
  value: Date | string | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatInTimeZone(
  value: Date | string | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE,
  opts?: { includeZone?: boolean; dateOnly?: boolean },
): string {
  if (value == null || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const includeZone = opts?.includeZone ?? true;
  const dateOnly = opts?.dateOnly ?? false;

  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(dateOnly
      ? {}
      : {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
  }).format(date);

  const normalized = formatted.replace(',', ' ·').replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());

  if (!includeZone) return normalized;
  const zone =
    timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta' ? 'IST' : timeZone;
  return `${normalized} ${zone}`;
}

export function addDaysPreservingWallClockIso(
  utcInstant: Date | string,
  days: number,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const date = utcInstant instanceof Date ? utcInstant : new Date(utcInstant);
  const local = utcToZonedLocalInput(date, timeZone);
  const match = LOCAL_INPUT_RE.exec(local);
  if (!match) {
    const copy = new Date(date.getTime());
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy.toISOString();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const base = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const shifted = `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(hour)}:${pad(minute)}`;
  return zonedLocalToUtcIso(shifted, timeZone);
}
