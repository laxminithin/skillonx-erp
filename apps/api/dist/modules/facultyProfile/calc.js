/**
 * Pure calculation helpers for the Faculty Academic Record.
 * No DB access -> unit-testable in isolation (spec §B30 data-integrity).
 */
const MS_PER_DAY = 24 * 3600 * 1000;
const DAYS_PER_YEAR = 365.25;
function toDate(v) {
    if (v == null)
        return null;
    const d = v instanceof Date ? v : new Date(String(v).slice(0, 10) + 'T00:00:00Z');
    return Number.isNaN(d.getTime()) ? null : d;
}
/**
 * Merge overlapping [start,end] intervals and return total covered days.
 * Open-ended (isCurrent / no end) periods are closed at `asOf` (default now).
 * Overlapping appointments are counted once (spec §B5 "avoid double counting").
 */
export function mergedCoveredDays(periods, asOf = new Date()) {
    const intervals = [];
    for (const p of periods) {
        const s = toDate(p.start);
        if (!s)
            continue;
        const eRaw = p.isCurrent ? asOf : toDate(p.end) ?? (p.end === undefined ? null : null);
        const e = eRaw ?? (p.isCurrent ? asOf : null);
        // If no end and not current, treat as a single-day marker (cannot infer span).
        const end = e ?? s;
        if (end.getTime() < s.getTime())
            continue;
        intervals.push([s.getTime(), end.getTime()]);
    }
    if (!intervals.length)
        return 0;
    intervals.sort((a, b) => a[0] - b[0]);
    let total = 0;
    let [curS, curE] = intervals[0];
    for (let i = 1; i < intervals.length; i += 1) {
        const [s, e] = intervals[i];
        if (s <= curE) {
            if (e > curE)
                curE = e;
        }
        else {
            total += curE - curS;
            [curS, curE] = [s, e];
        }
    }
    total += curE - curS;
    return Math.round(total / MS_PER_DAY);
}
export function daysToYears(days) {
    return Math.round((days / DAYS_PER_YEAR) * 10) / 10;
}
/**
 * Experience totals per category + overall, overlap-aware. Overall merges ALL
 * periods across categories so a person holding two concurrent roles is not
 * double-counted in the headline figure.
 */
export function experienceTotals(records, asOf = new Date()) {
    const buckets = {};
    const all = [];
    for (const r of records) {
        const cat = (r.category || 'OTHER').toUpperCase();
        (buckets[cat] ??= []).push(r.period);
        all.push(r.period);
    }
    const byCategory = {};
    for (const [cat, periods] of Object.entries(buckets)) {
        byCategory[cat] = daysToYears(mergedCoveredDays(periods, asOf));
    }
    return { byCategory, overallYears: daysToYears(mergedCoveredDays(all, asOf)) };
}
/** Inclusive day count between two dates (spec §B11 FDP duration). */
export function inclusiveDays(start, end) {
    const s = toDate(start);
    const e = toDate(end) ?? s;
    if (!s || !e)
        return null;
    if (e.getTime() < s.getTime())
        return null;
    return Math.round((e.getTime() - s.getTime()) / MS_PER_DAY) + 1;
}
/** Certification currency (spec §B12). Lifetime -> always CURRENT. */
export function certificationStatus(expiryDate, lifetime, asOf = new Date()) {
    if (lifetime)
        return 'LIFETIME';
    const e = toDate(expiryDate);
    if (!e)
        return 'CURRENT';
    return e.getTime() >= asOf.getTime() ? 'CURRENT' : 'EXPIRED';
}
/**
 * Academic-year label for a date given AY starts in July (India convention).
 * A date on/after July 1 belongs to "<Y>-<Y+1>"; before to "<Y-1>-<Y>".
 * Deterministic boundary handling (spec §B30).
 */
export function academicYearForDate(date, startMonth = 7) {
    const d = toDate(date);
    if (!d)
        return null;
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const startYear = m >= startMonth ? y : y - 1;
    return `${startYear}-${startYear + 1}`;
}
/** Normalize a dedupe key (DOI, application no, credential id) for comparison. */
export function normalizeRef(value) {
    if (value == null)
        return null;
    const s = String(value).trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return s.length ? s : null;
}
