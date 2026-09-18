/** Local-calendar date helpers. Avoid UTC parsing of YYYY-MM-DD strings. */
export declare function parseISODate(iso: string): Date;
export declare function toISODate(date: Date): string;
export declare function addDays(iso: string, days: number): string;
export declare function compareISODate(a: string, b: string): number;
export declare function todayISO(now?: Date): string;
export declare function weekdayOf(iso: string): number;
export declare function formatDisplayDate(iso: string | null | undefined): string;
export declare function sqlDate(value: unknown): string | null;
