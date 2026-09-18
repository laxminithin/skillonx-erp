import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../../utils/errors.js';
import {
  buildDefaultScheme,
  findDuplicateNormalizedTexts,
  hasModelSolution,
  schemeTotalMarks,
  validateSchemeMatchesMarks,
} from './scheme.js';

describe('assignment evaluation scheme helpers', () => {
  it('builds schemes whose criteria total equals marks', () => {
    for (const type of ['DESCRIPTIVE', 'ALGORITHM', 'INTERPRETATION', 'CASE_STUDY'] as const) {
      const scheme = buildDefaultScheme(type, 12);
      assert.equal(schemeTotalMarks(scheme), 12);
      const validated = validateSchemeMatchesMarks(scheme, 12);
      assert.equal(validated.criteria.length > 0, true);
    }
  });

  it('rejects mismatched scheme totals', () => {
    assert.throws(
      () =>
        validateSchemeMatchesMarks(
          {
            criteria: [{ id: 'a', label: 'A', maxMarks: 3 }],
            expectedKeyPoints: [],
          },
          10,
        ),
      (err) => err instanceof AppError && err.code === 'SCHEME_MARKS_MISMATCH',
    );
  });

  it('requires a non-trivial model solution', () => {
    assert.equal(hasModelSolution('short'), false);
    assert.equal(hasModelSolution('A complete model solution text'), true);
  });

  it('detects duplicate normalized question text', () => {
    const dupes = findDuplicateNormalizedTexts([
      'Explain  polymorphism',
      'explain polymorphism',
      'Something else',
    ]);
    assert.equal(dupes.length, 1);
  });
});
