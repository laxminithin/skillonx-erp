import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateCoverageSatisfaction,
  coverageSatisfactionPercent,
  isValidCoverageLevel,
  parseCoverageLevel,
} from './coverage.js';

describe('coverage satisfaction', () => {
  it('computes expected 3 / actual 2 = 66.7%', () => {
    assert.equal(coverageSatisfactionPercent(2, 3), 66.7);
  });

  it('caps expected 3 / actual 4 at 100%', () => {
    assert.equal(coverageSatisfactionPercent(4, 3), 100);
  });

  it('never divides by zero or returns NaN', () => {
    assert.equal(coverageSatisfactionPercent(2, 0), null);
    assert.equal(coverageSatisfactionPercent(2, null), null);
    assert.equal(coverageSatisfactionPercent(null, 3), null);
  });

  it('validates 0–4 scale', () => {
    for (const n of [0, 1, 2, 3, 4]) assert.equal(isValidCoverageLevel(n), true);
    assert.equal(isValidCoverageLevel(5), false);
    assert.equal(parseCoverageLevel('3'), 3);
    assert.equal(parseCoverageLevel('x'), null);
  });

  it('aggregates applicable items only', () => {
    const result = aggregateCoverageSatisfaction([
      { actualCoverageLevel: 2, expectedCoverageLevel: 3 },
      { actualCoverageLevel: 4, expectedCoverageLevel: 3 },
      { actualCoverageLevel: 0, expectedCoverageLevel: 3, applicability: 'NOT_APPLICABLE' },
      { actualCoverageLevel: 1, expectedCoverageLevel: null },
    ]);
    assert.equal(result.included, 2);
    assert.equal(result.percent, 83.4);
  });
});
