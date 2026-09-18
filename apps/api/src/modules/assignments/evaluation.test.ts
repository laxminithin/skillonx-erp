import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../../utils/errors.js';
import {
  applyCriterionMarks,
  evaluateSubmissionSchema,
  resolveSchemeFromSnapshotQuestion,
  summarizeEvaluation,
} from './evaluation.js';
import { buildDefaultScheme } from './scheme.js';
import { parseSnapshotQuestions } from './serialize.js';

describe('scheme-based evaluation', () => {
  const scheme = {
    criteria: [
      { id: 'clarity', label: 'Clarity', maxMarks: 4 },
      { id: 'depth', label: 'Depth', maxMarks: 6 },
    ],
    expectedKeyPoints: [],
  };

  it('awards sum of criteria within max', () => {
    const marks = applyCriterionMarks(scheme, [
      { id: 'clarity', awarded: 3 },
      { id: 'depth', awarded: 5 },
    ]);
    assert.equal(marks.awardedTotal, 8);
    assert.equal(marks.maxTotal, 10);
  });

  it('accepts zero awarded marks', () => {
    const marks = applyCriterionMarks(scheme, [
      { id: 'clarity', awarded: 0 },
      { id: 'depth', awarded: 0 },
    ]);
    assert.equal(marks.awardedTotal, 0);
  });

  it('rejects criterion above max', () => {
    assert.throws(
      () =>
        applyCriterionMarks(scheme, [
          { id: 'clarity', awarded: 5 },
          { id: 'depth', awarded: 1 },
        ]),
      (err) => err instanceof AppError && err.code === 'ASSIGNMENT_CRITERION_MARKS_INVALID',
    );
  });

  it('rejects negative awards', () => {
    assert.throws(
      () =>
        applyCriterionMarks(scheme, [
          { id: 'clarity', awarded: -1 },
          { id: 'depth', awarded: 1 },
        ]),
      (err) => err instanceof AppError,
    );
  });

  it('summarizes draft/finalize totals and pass', () => {
    const summary = summarizeEvaluation(
      [
        { awarded: 8, max: 10 },
        { awarded: 12, max: 15 },
      ],
      40,
    );
    assert.equal(summary.obtainedMarks, 20);
    assert.equal(summary.totalMarks, 25);
    assert.equal(summary.percentage, 80);
    assert.equal(summary.passed, true);
  });

  it('works with type-default schemes', () => {
    const built = buildDefaultScheme('ALGORITHM', 10);
    const marks = applyCriterionMarks(
      built,
      built.criteria.map((c) => ({ id: c.id, awarded: c.maxMarks })),
    );
    assert.equal(marks.awardedTotal, 10);
  });

  it('scheme mode example totals 9/10', () => {
    const ten = {
      criteria: [
        { id: 'a', label: 'A', maxMarks: 2 },
        { id: 'b', label: 'B', maxMarks: 4 },
        { id: 'c', label: 'C', maxMarks: 2 },
        { id: 'd', label: 'D', maxMarks: 1 },
        { id: 'e', label: 'E', maxMarks: 1 },
      ],
      expectedKeyPoints: [],
    };
    const marks = applyCriterionMarks(ten, [
      { id: 'a', awarded: 2 },
      { id: 'b', awarded: 3 },
      { id: 'c', awarded: 2 },
      { id: 'd', awarded: 1 },
      { id: 'e', awarded: 1 },
    ]);
    assert.equal(marks.awardedTotal, 9);
    assert.equal(marks.maxTotal, 10);
  });
});

describe('parseSnapshotQuestions', () => {
  it('reads flat array snapshots used by submissions', () => {
    const qs = parseSnapshotQuestions([
      { id: 1, questionText: 'Q', questionType: 'DESCRIPTIVE', responseFormat: 'LONG_TEXT', marks: 10, difficulty: null },
    ]);
    assert.equal(qs.length, 1);
    assert.equal(qs[0].id, 1);
  });

  it('reads wrapped published snapshot shape', () => {
    const qs = parseSnapshotQuestions({
      questions: [
        { id: 2, questionText: 'Q', questionType: 'DESCRIPTIVE', responseFormat: 'LONG_TEXT', marks: 5, difficulty: null },
      ],
    });
    assert.equal(qs.length, 1);
    assert.equal(qs[0].id, 2);
  });

  it('parses JSON string arrays', () => {
    const qs = parseSnapshotQuestions(
      JSON.stringify([{ id: 3, questionText: 'Q', questionType: 'DESCRIPTIVE', responseFormat: 'LONG_TEXT', marks: 4, difficulty: null }]),
    );
    assert.equal(qs.length, 1);
  });
});

describe('evaluateSubmissionSchema', () => {
  it('rejects empty questions for finalize', () => {
    const result = evaluateSubmissionSchema.safeParse({
      mode: 'FINALIZE',
      questions: [],
    });
    assert.equal(result.success, false);
  });

  it('allows empty questions for release mode', () => {
    const result = evaluateSubmissionSchema.safeParse({
      mode: 'RELEASE',
      questions: [],
    });
    assert.equal(result.success, true);
  });

  it('coerces string awarded marks and accepts 0', () => {
    const result = evaluateSubmissionSchema.safeParse({
      mode: 'DRAFT',
      questions: [
        {
          snapshotQuestionId: 1,
          criteria: [{ id: 'overall', awarded: '0' }],
        },
      ],
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.questions[0].criteria[0].awarded, 0);
    }
  });
});

describe('resolveSchemeFromSnapshotQuestion', () => {
  it('flags scheme total mismatch', () => {
    assert.throws(
      () =>
        resolveSchemeFromSnapshotQuestion({
          marks: 10,
          evaluationScheme: {
            criteria: [{ id: 'a', label: 'A', maxMarks: 9 }],
            expectedKeyPoints: [],
          },
        }),
      (err) => err instanceof AppError && err.code === 'ASSIGNMENT_SCHEME_TOTAL_MISMATCH',
    );
  });

  it('falls back to overall criterion when scheme missing', () => {
    const scheme = resolveSchemeFromSnapshotQuestion({ marks: 10 });
    assert.equal(scheme.criteria.length, 1);
    assert.equal(scheme.criteria[0].id, 'overall');
    assert.equal(scheme.criteria[0].maxMarks, 10);
  });
});
