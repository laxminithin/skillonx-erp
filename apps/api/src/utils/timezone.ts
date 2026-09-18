/** Default institution timezone (India). Colleges may override via colleges.timezone. */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;

function pad(n: number, width = 2) {
  return String(n).padStart(width, '0');
}

/**
 * Returns the wall-clock parts of an instant in a given IANA timezone.
 */
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

/**
 * Convert a timezone-local wall time to a UTC Date.
 * `localDateTime` must be `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss` (no Z / offset).
 */
export function zonedLocalToUtc(localDateTime: string, timeZone: string = DEFAULT_TIMEZONE): Date {
  const trimmed = localDateTime.trim();
  const match = LOCAL_INPUT_RE.exec(trimmed);
  if (!match) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid local datetime: ${localDateTime}`);
    }
    return parsed;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);

  // Guess as UTC, then correct by the timezone offset at that instant.
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

  return new Date(utcGuess);
}

/**
 * Format a UTC instant as `YYYY-MM-DDTHH:mm` in the given timezone (for datetime-local inputs).
 */
export function utcToZonedLocalInput(
  value: Date | string,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Human-readable institution-local datetime, e.g. "13 Aug 2026 · 11:47 PM IST"
 */
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

  // en-GB yields "13 Aug 2026, 11:47 pm" — normalize separator
  const normalized = formatted.replace(',', ' ·').replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());

  if (!includeZone) return normalized;

  const zone =
    timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta'
      ? 'IST'
      : timeZone;

  return `${normalized} ${zone}`;
}

/** Add calendar days while preserving the institution wall-clock time. */
export function addDaysPreservingWallClock(
  utcInstant: Date | string,
  days: number,
  timeZone: string = DEFAULT_TIMEZONE,
): Date {
  const date = utcInstant instanceof Date ? utcInstant : new Date(utcInstant);
  const local = utcToZonedLocalInput(date, timeZone);
  const match = LOCAL_INPUT_RE.exec(local);
  if (!match) {
    const copy = new Date(date.getTime());
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const base = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  const shifted = `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(hour)}:${pad(minute)}`;
  return zonedLocalToUtc(shifted, timeZone);
}
