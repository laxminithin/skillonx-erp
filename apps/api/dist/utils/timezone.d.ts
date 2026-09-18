/** Default institution timezone (India). Colleges may override via colleges.timezone. */
export declare const DEFAULT_TIMEZONE = "Asia/Kolkata";
/**
 * Returns the wall-clock parts of an instant in a given IANA timezone.
 */
export declare function getZonedParts(date: Date, timeZone: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};
/**
 * Convert a timezone-local wall time to a UTC Date.
 * `localDateTime` must be `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss` (no Z / offset).
 */
export declare function zonedLocalToUtc(localDateTime: string, timeZone?: string): Date;
/**
 * Format a UTC instant as `YYYY-MM-DDTHH:mm` in the given timezone (for datetime-local inputs).
 */
export declare function utcToZonedLocalInput(value: Date | string, timeZone?: string): string;
/**
 * Human-readable institution-local datetime, e.g. "13 Aug 2026 · 11:47 PM IST"
 */
export declare function formatInTimeZone(value: Date | string | null | undefined, timeZone?: string, opts?: {
    includeZone?: boolean;
    dateOnly?: boolean;
}): string;
/** Add calendar days while preserving the institution wall-clock time. */
export declare function addDaysPreservingWallClock(utcInstant: Date | string, days: number, timeZone?: string): Date;
