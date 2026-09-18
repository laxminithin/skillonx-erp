import { addDays, compareISODate, toISODate, weekdayOf } from './dates.js';

export type TeachingSlot = {
  weekday: number;
  startTime: string;
  endTime: string;
  hours: number;
};

export type TeachingPeriod = {
  date: string;
  weekday: number;
  startTime: string;
  endTime: string;
  hours: number;
};

export type ScheduleEntryInput = {
  key: string;
  hours: number;
};

export type ScheduledEntry = {
  key: string;
  plannedDate: string;
  actualDate: string;
  hours: number;
};

export type ScheduleOk = {
  ok: true;
  scheduled: ScheduledEntry[];
  requiredHours: number;
  availableHours: number;
  unusedHours: number;
  shortfallHours: number;
};

export type ScheduleShortfall = {
  ok: false;
  code: 'SHORTFALL';
  requiredHours: number;
  availableHours: number;
  shortfallHours: number;
  unusedHours: number;
};

export type ScheduleResult = ScheduleOk | ScheduleShortfall;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateSlot(slot: TeachingSlot): string | null {
  if (!Number.isInteger(slot.weekday) || slot.weekday < 0 || slot.weekday > 6) {
    return 'Weekday must be 0–6';
  }
  if (!TIME.test(slot.startTime) || !TIME.test(slot.endTime)) {
    return 'Times must be HH:MM';
  }
  if (!(slot.hours > 0)) return 'Hours must be greater than 0';
  return null;
}

export function enumeratePeriods(opts: {
  startDate: string;
  endDate: string;
  slots: TeachingSlot[];
  blockedDates: Iterable<string>;
}): TeachingPeriod[] {
  const blocked = new Set([...opts.blockedDates].map((d) => d.slice(0, 10)));
  const byWeekday = new Map<number, TeachingSlot[]>();
  for (const slot of opts.slots) {
    const list = byWeekday.get(slot.weekday) ?? [];
    list.push(slot);
    byWeekday.set(slot.weekday, list);
  }
  for (const list of byWeekday.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const periods: TeachingPeriod[] = [];
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

export function availableHours(periods: TeachingPeriod[]) {
  return periods.reduce((sum, p) => sum + Number(p.hours), 0);
}

/**
 * Pack each lesson onto the earliest day that still has unused teaching hours.
 * A 2-hour topic occupies two 1-hour periods; if they fall on one day the
 * entry keeps that date. If they span days, the entry uses the first date.
 */
export function scheduleEntries(
  entries: ScheduleEntryInput[],
  periods: TeachingPeriod[],
  options?: { allowShortfall?: boolean },
): ScheduleResult {
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
  const scheduled: ScheduledEntry[] = [];
  let periodIndex = 0;

  for (const entry of entries) {
    let need = Number(entry.hours);
    let firstDate: string | null = null;
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
      if (period.remaining <= 0) periodIndex += 1;
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

export function periodsFromDate(
  periods: TeachingPeriod[],
  fromDate: string,
  options?: { includeFromDate?: boolean },
): TeachingPeriod[] {
  const include = options?.includeFromDate !== false;
  return periods.filter((p) =>
    include ? compareISODate(p.date, fromDate) >= 0 : compareISODate(p.date, fromDate) > 0,
  );
}

export function isValidTeachingDate(date: string, periods: TeachingPeriod[]) {
  return periods.some((p) => p.date === date);
}

export function toDateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return toISODate(value);
}
