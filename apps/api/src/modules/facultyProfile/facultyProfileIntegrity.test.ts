/**
 * Faculty Academic Record — data-integrity unit tests (spec §B30).
 * Pure calculation logic; no DB dependency, so these always run.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergedCoveredDays,
  daysToYears,
  experienceTotals,
  inclusiveDays,
  certificationStatus,
  academicYearForDate,
  normalizeRef,
} from './calc.js';

describe('Faculty record — experience overlap calculation', () => {
  it('merges overlapping appointments so periods are not double-counted', () => {
    // Two fully overlapping 1-year periods -> ~1 year, not 2.
    const days = mergedCoveredDays([
      { start: '2020-01-01', end: '2021-01-01' },
      { start: '2020-06-01', end: '2021-06-01' },
    ]);
    assert.equal(daysToYears(days), 1.4); // merged span 2020-01-01 .. 2021-06-01 (~1.4y), not 2y
  });

  it('sums disjoint periods fully', () => {
    const days = mergedCoveredDays([
      { start: '2018-01-01', end: '2019-01-01' },
      { start: '2020-01-01', end: '2021-01-01' },
    ]);
    assert.equal(daysToYears(days), 2.0);
  });

  it('closes an open (current) period at asOf', () => {
    const asOf = new Date('2024-01-01T00:00:00Z');
    const days = mergedCoveredDays([{ start: '2023-01-01', isCurrent: true }], asOf);
    assert.equal(daysToYears(days), 1.0);
  });

  it('experienceTotals reports per-category and overlap-aware overall', () => {
    const asOf = new Date('2024-01-01T00:00:00Z');
    const totals = experienceTotals(
      [
        { category: 'TEACHING', period: { start: '2020-01-01', end: '2022-01-01' } },
        { category: 'INDUSTRY', period: { start: '2021-01-01', end: '2023-01-01' } },
      ],
      asOf,
    );
    assert.equal(totals.byCategory.TEACHING, 2.0);
    assert.equal(totals.byCategory.INDUSTRY, 2.0);
    // Overall merges 2020-01-01 .. 2023-01-01 = 3 years (not 4).
    assert.equal(totals.overallYears, 3.0);
  });
});

describe('Faculty record — FDP duration', () => {
  it('counts inclusive days', () => {
    assert.equal(inclusiveDays('2024-03-01', '2024-03-05'), 5);
    assert.equal(inclusiveDays('2024-03-01', '2024-03-01'), 1);
  });
  it('single date (no end) counts as one day', () => {
    assert.equal(inclusiveDays('2024-03-01', null), 1);
  });
  it('rejects reversed ranges', () => {
    assert.equal(inclusiveDays('2024-03-05', '2024-03-01'), null);
  });
});

describe('Faculty record — certification expiry', () => {
  const asOf = new Date('2024-06-01T00:00:00Z');
  it('flags expired certifications', () => {
    assert.equal(certificationStatus('2023-01-01', false, asOf), 'EXPIRED');
  });
  it('current when not yet expired', () => {
    assert.equal(certificationStatus('2025-01-01', false, asOf), 'CURRENT');
  });
  it('lifetime overrides expiry', () => {
    assert.equal(certificationStatus('2000-01-01', true, asOf), 'LIFETIME');
  });
});

describe('Faculty record — academic-year boundary', () => {
  it('assigns July-start academic years deterministically', () => {
    assert.equal(academicYearForDate('2024-07-01'), '2024-2025');
    assert.equal(academicYearForDate('2024-06-30'), '2023-2024');
    assert.equal(academicYearForDate('2024-12-31'), '2024-2025');
    assert.equal(academicYearForDate('2025-01-01'), '2024-2025');
  });
});

describe('Faculty record — dedupe key normalization', () => {
  it('normalizes DOI variants to the same key', () => {
    const a = normalizeRef('https://doi.org/10.1000/XYZ');
    const b = normalizeRef('10.1000/xyz');
    assert.equal(a, b);
    assert.equal(a, '10.1000/xyz');
  });
  it('returns null for empty', () => {
    assert.equal(normalizeRef(''), null);
    assert.equal(normalizeRef(null), null);
  });
});
