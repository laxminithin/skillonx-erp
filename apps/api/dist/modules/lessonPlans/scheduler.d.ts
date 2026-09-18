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
export declare function validateSlot(slot: TeachingSlot): string | null;
export declare function enumeratePeriods(opts: {
    startDate: string;
    endDate: string;
    slots: TeachingSlot[];
    blockedDates: Iterable<string>;
}): TeachingPeriod[];
export declare function availableHours(periods: TeachingPeriod[]): number;
/**
 * Pack each lesson onto the earliest day that still has unused teaching hours.
 * A 2-hour topic occupies two 1-hour periods; if they fall on one day the
 * entry keeps that date. If they span days, the entry uses the first date.
 */
export declare function scheduleEntries(entries: ScheduleEntryInput[], periods: TeachingPeriod[], options?: {
    allowShortfall?: boolean;
}): ScheduleResult;
export declare function periodsFromDate(periods: TeachingPeriod[], fromDate: string, options?: {
    includeFromDate?: boolean;
}): TeachingPeriod[];
export declare function isValidTeachingDate(date: string, periods: TeachingPeriod[]): boolean;
export declare function toDateOnly(value: Date | string): string;
