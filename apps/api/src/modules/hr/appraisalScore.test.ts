import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  roundScore,
  validateTemplateWeights,
  computeWeightedScore,
  mapScoreToRating,
} from './appraisalScore.js';
import { AppError } from '../../utils/errors.js';

describe('appraisalScore', () => {
  it('roundScore uses 2-decimal rounding', () => {
    assert.equal(roundScore(1.234), 1.23);
    assert.equal(roundScore(1.235), 1.24);
    assert.equal(roundScore(99.996), 100);
    assert.equal(roundScore(0), 0);
  });

  it('validateTemplateWeights accepts balanced sections', () => {
    assert.doesNotThrow(() =>
      validateTemplateWeights(
        [
          {
            code: 'A',
            weight: 60,
            criteria: [
              { code: 'A1', weight: 40 },
              { code: 'A2', weight: 20 },
            ],
          },
          {
            code: 'B',
            weight: 40,
            criteria: [{ code: 'B1', weight: 40 }],
          },
        ],
        100,
      ),
    );
  });

  it('validateTemplateWeights rejects section sum mismatch', () => {
    assert.throws(
      () =>
        validateTemplateWeights(
          [{ code: 'A', weight: 50, criteria: [{ code: 'A1', weight: 50 }] }],
          100,
        ),
      (err: unknown) => err instanceof AppError && err.code === 'APPRAISAL_WEIGHTS_INVALID',
    );
  });

  it('validateTemplateWeights rejects criteria sum mismatch', () => {
    assert.throws(
      () =>
        validateTemplateWeights(
          [
            {
              code: 'A',
              weight: 100,
              criteria: [
                { code: 'A1', weight: 40 },
                { code: 'A2', weight: 40 },
              ],
            },
          ],
          100,
        ),
      (err: unknown) => err instanceof AppError && err.code === 'APPRAISAL_WEIGHTS_INVALID',
    );
  });

  it('validateTemplateWeights rejects duplicate codes', () => {
    assert.throws(
      () =>
        validateTemplateWeights(
          [
            {
              code: 'A',
              weight: 50,
              criteria: [
                { code: 'X', weight: 25 },
                { code: 'x', weight: 25 },
              ],
            },
            { code: 'B', weight: 50, criteria: [{ code: 'Y', weight: 50 }] },
          ],
          100,
        ),
      (err: unknown) => err instanceof AppError && err.code === 'APPRAISAL_DUPLICATE_CODE',
    );
  });

  it('computeWeightedScore normalizes by scaleMax and skips nulls', () => {
    const score = computeWeightedScore(
      [
        { weight: 50, rating: 5 },
        { weight: 50, rating: null },
      ],
      5,
    );
    assert.equal(score, 100);

    const mixed = computeWeightedScore(
      [
        { weight: 60, rating: 4 },
        { weight: 40, rating: 2 },
      ],
      5,
    );
    // (0.6*(4/5*100) + 0.4*(2/5*100)) = 48+16 = 64
    assert.equal(mixed, 64);
  });

  it('computeWeightedScore returns null when nothing rated', () => {
    assert.equal(computeWeightedScore([{ weight: 100, rating: null }], 5), null);
    assert.equal(computeWeightedScore([], 5), null);
  });

  it('mapScoreToRating uses min/max bands including edges', () => {
    const levels = [
      { score: 1, label: 'Unsatisfactory', minScore: 0, maxScore: 39.99 },
      { score: 2, label: 'Needs Improvement', minScore: 40, maxScore: 54.99 },
      { score: 3, label: 'Meets Expectations', minScore: 55, maxScore: 74.99 },
      { score: 4, label: 'Exceeds Expectations', minScore: 75, maxScore: 89.99 },
      { score: 5, label: 'Outstanding', minScore: 90, maxScore: 100 },
    ];
    assert.equal(mapScoreToRating(0, levels).label, 'Unsatisfactory');
    assert.equal(mapScoreToRating(39.99, levels).label, 'Unsatisfactory');
    assert.equal(mapScoreToRating(40, levels).label, 'Needs Improvement');
    assert.equal(mapScoreToRating(74.99, levels).label, 'Meets Expectations');
    assert.equal(mapScoreToRating(75, levels).label, 'Exceeds Expectations');
    assert.equal(mapScoreToRating(90, levels).label, 'Outstanding');
    assert.equal(mapScoreToRating(100, levels).label, 'Outstanding');
  });

  it('mapScoreToRating falls back to nearest discrete score without bands', () => {
    const levels = [
      { score: 1, label: 'Low' },
      { score: 3, label: 'Mid' },
      { score: 5, label: 'High' },
    ];
    assert.equal(mapScoreToRating(1.4, levels).label, 'Low');
    assert.equal(mapScoreToRating(2.1, levels).label, 'Mid'); // closer to 3 than 1
    assert.equal(mapScoreToRating(2.6, levels).label, 'Mid');
    assert.equal(mapScoreToRating(4.6, levels).label, 'High');
  });
});
