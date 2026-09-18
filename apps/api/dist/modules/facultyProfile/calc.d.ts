/**
 * Pure calculation helpers for the Faculty Academic Record.
 * No DB access -> unit-testable in isolation (spec §B30 data-integrity).
 */
export type Period = {
    start: string | Date | null;
    end?: string | Date | null;
    isCurrent?: boolean;
};
/**
 * Merge overlapping [start,end] intervals and return total covered days.
 * Open-ended (isCurrent / no end) periods are closed at `asOf` (default now).
 * Overlapping appointments are counted once (spec §B5 "avoid double counting").
 */
export declare function mergedCoveredDays(periods: Period[], asOf?: Date): number;
export declare function daysToYears(days: number): number;
/**
 * Experience totals per category + overall, overlap-aware. Overall merges ALL
 * periods across categories so a person holding two concurrent roles is not
 * double-counted in the headline figure.
 */
export declare function experienceTotals(records: {
    category?: string | null;
    period: Period;
}[], asOf?: Date): {
    byCategory: Record<string, number>;
    overallYears: number;
};
/** Inclusive day count between two dates (spec §B11 FDP duration). */
export declare function inclusiveDays(start: string | Date | null, end: string | Date | null): number | null;
/** Certification currency (spec §B12). Lifetime -> always CURRENT. */
export declare function certificationStatus(expiryDate: string | Date | null, lifetime: boolean, asOf?: Date): 'CURRENT' | 'EXPIRED' | 'LIFETIME';
/**
 * Academic-year label for a date given AY starts in July (India convention).
 * A date on/after July 1 belongs to "<Y>-<Y+1>"; before to "<Y-1>-<Y>".
 * Deterministic boundary handling (spec §B30).
 */
export declare function academicYearForDate(date: string | Date | null, startMonth?: number): string | null;
/** Normalize a dedupe key (DOI, application no, credential id) for comparison. */
export declare function normalizeRef(value: unknown): string | null;
