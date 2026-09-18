export declare function asISODate(value: unknown): string;
export declare function asHHMM(value: unknown): string;
export declare function minutesOf(hhmm: string): number;
export declare function hoursBetween(start: string, end: string): number;
export declare function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean;
export declare function dateRangesOverlap(aFrom: string, aTo: string | null | undefined, bFrom: string, bTo: string | null | undefined): boolean;
export declare function dateInRange(date: string, from: string, to?: string | null): boolean;
export declare function collegeTimezone(raw?: string | null): string;
export declare function todayInTimezone(timeZone: string, now?: Date): string;
/** Civil weekday of a YYYY-MM-DD timetable date (0=Sun … 6=Sat). */
export declare function weekdayInTimezone(iso: string, _timeZone?: string): number;
export declare function dayLabel(dayOfWeek: number): string;
export declare function eachDate(from: string, to: string): string[];
export declare function startOfWeek(iso: string, timeZone: string): string;
export declare function weekRange(iso: string, timeZone: string): {
    from: string;
    to: string;
};
export declare function formatClock(hhmm: string): string;
