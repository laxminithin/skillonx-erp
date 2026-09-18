import { addDays, compareISODate, toISODate, weekdayOf } from './dates.js';
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function validateSlot(slot) {
    if (!Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) {
        return 'Weekday must be 0–6';
    }
    if (!TIME.test(slot.startTime) || !TIME.test(slot.endTime)) {
        return 'Times must be HH:MM';
    }
    if (!(slot.hours > 0))
        return 'Hours must be greater than 0';
    return null;
}
export function enumeratePeriods(opts) {
    const blocked = new Set([...opts.blockedDates].map((d) => d.slice(0, 10)));
    const byWeekday = new Map();
    for (const slot of opts.slots) {
        const list = byWeekday.get(slot.weekday) ?? [];
        list.push(slot);
        byWeekday.set(slot.weekday, list);
    }
    for (const list of byWeekday.values()) {
        list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    const periods = [];
    let cursor = opts.startDate;
    while (compareISODate(cursor, opts.endDate) <= 0) {
        if (!blocked.has(cursor)) {
            const weekday = weekdayOf(cursor);
            for (const slot of byWeekday.get(weekday) ?? []) {
                periods.push({
                    date: cursor,
                    weekday,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    hours: Number(slot.hours),
                });
            }
        }
        cursor = addDays(cursor, 1);
    }
    return periods;
}
export function availableHours(periods) {
    return periods.reduce((sum, p) => sum + Number(p.hours), 0);
}
/**
 * Pack each lesson onto the earliest day that still has unused teaching hours.
 * A 2-hour topic occupies two 1-hour periods; if they fall on one day the
 * entry keeps that date. If they span days, the entry uses the first date.
 */
export function scheduleEntries(entries, periods, options) {
    const requiredHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const avail = availableHours(periods);
    const unusedHours = Math.max(0, avail - requiredHours);
    const shortfallHours = Math.max(0, requiredHours - avail);
    if (shortfallHours > 0 && !options?.allowShortfall) {
        return {
            ok: false,
            code: 'SHORTFALL',
            requiredHours,
            availableHours: avail,
            shortfallHours,
            unusedHours: 0,
        };
    }
    const remaining = periods.map((p) => ({ ...p, remaining: Number(p.hours) }));
    const scheduled = [];
    let periodIndex = 0;
    for (const entry of entries) {
        let need = Number(entry.hours);
        let firstDate = null;
        while (need > 0 && periodIndex < remaining.length) {
            const period = remaining[periodIndex];
            if (period.remaining <= 0) {
                periodIndex += 1;
                continue;
            }
            const take = Math.min(need, period.remaining);
            period.remaining -= take;
            need -= take;
            firstDate ??= period.date;
            if (period.remaining <= 0)
                periodIndex += 1;
        }
        if (!firstDate) {
            if (!options?.allowShortfall) {
                return {
                    ok: false,
                    code: 'SHORTFALL',
                    requiredHours,
                    availableHours: avail,
                    shortfallHours: Math.max(shortfallHours, need),
                    unusedHours: 0,
                };
            }
            continue;
        }
        scheduled.push({
            key: entry.key,
            plannedDate: firstDate,
            actualDate: firstDate,
            hours: Number(entry.hours),
        });
    }
    return {
        ok: true,
        scheduled,
        requiredHours,
        availableHours: avail,
        unusedHours,
        shortfallHours,
    };
}
export function periodsFromDate(periods, fromDate, options) {
    const include = options?.includeFromDate !== false;
    return periods.filter((p) => include ? compareISODate(p.date, fromDate) >= 0 : compareISODate(p.date, fromDate) > 0);
}
export function isValidTeachingDate(date, periods) {
    return periods.some((p) => p.date === date);
}
export function toDateOnly(value) {
    if (typeof value === 'string')
        return value.slice(0, 10);
    return toISODate(value);
}
