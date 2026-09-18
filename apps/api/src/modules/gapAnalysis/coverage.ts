import type { CoverageLevel } from './types.js';

/**
 * Coverage satisfaction = min(100, actual/expected * 100).
 * Returns null when expected is missing or zero (exclude from aggregates).
 */
export function coverageSatisfactionPercent(
  actual: number | null | undefined,
  expected: number | null | undefined,
): number | null {
  if (expected == null || !Number.isFinite(expected) || Number(expected) <= 0) return null;
  if (actual == null || !Number.isFinite(actual)) return null;
  const pct = (Number(actual) / Number(expected)) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.min(100, Math.round(pct * 10) / 10);
}

export function aggregateCoverageSatisfaction(
  items: Array<{ actualCoverageLevel: number | null; expectedCoverageLevel: number | null; applicability?: string }>,
): { percent: number | null; included: number; excluded: number } {
  let sum = 0;
  let included = 0;
  let excluded = 0;
  for (const item of items) {
    if (item.applicability === 'NOT_APPLICABLE') {
      excluded += 1;
      continue;
    }
    const pct = coverageSatisfactionPercent(item.actualCoverageLevel, item.expectedCoverageLevel);
    if (pct == null) {
      excluded += 1;
      continue;
    }
    sum += pct;
    included += 1;
  }
  if (included === 0) return { percent: null, included, excluded };
  return { percent: Math.round((sum / included) * 10) / 10, included, excluded };
}

export function isValidCoverageLevel(value: unknown): value is CoverageLevel {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}

export function parseCoverageLevel(value: unknown): CoverageLevel | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!isValidCoverageLevel(n)) return null;
  return n;
}
