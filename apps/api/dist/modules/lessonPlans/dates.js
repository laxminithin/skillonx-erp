/** Local-calendar date helpers. Avoid UTC parsing of YYYY-MM-DD strings. */
export function parseISODate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!match)
        throw new Error(`Invalid date: ${iso}`);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
export function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
export function addDays(iso, days) {
    const date = parseISODate(iso);
    date.setDate(date.getDate() + days);
    return toISODate(date);
}
export function compareISODate(a, b) {
    if (a === b)
        return 0;
    return a < b ? -1 : 1;
}
export function todayISO(now = new Date()) {
    return toISODate(now);
}
export function weekdayOf(iso) {
    return parseISODate(iso).getDay();
}
export function formatDisplayDate(iso) {
    if (!iso)
        return '—';
    const date = parseISODate(iso);
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}
export function sqlDate(value) {
    if (value == null)
        return null;
    if (value instanceof Date)
        return toISODate(value);
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s))
        return s.slice(0, 10);
    return null;
}
