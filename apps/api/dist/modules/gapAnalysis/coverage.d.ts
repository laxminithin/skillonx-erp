import type { CoverageLevel } from './types.js';
/**
 * Coverage satisfaction = min(100, actual/expected * 100).
 * Returns null when expected is missing or zero (exclude from aggregates).
 */
export declare function coverageSatisfactionPercent(actual: number | null | undefined, expected: number | null | undefined): number | null;
export declare function aggregateCoverageSatisfaction(items: Array<{
    actualCoverageLevel: number | null;
    expectedCoverageLevel: number | null;
    applicability?: string;
}>): {
    percent: number | null;
    included: number;
    excluded: number;
};
export declare function isValidCoverageLevel(value: unknown): value is CoverageLevel;
export declare function parseCoverageLevel(value: unknown): CoverageLevel | null;
