import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMarkColumns, resolveOrMarkEntry, type OrMarkQuestion } from './orMarks.js';
import { computeSourceCoAttainment } from './formula.js';
import { SKILLONX_STANDARD_V1 } from './policy.js';
import type { AssessmentSourceInput } from './types.js';

// A 20 OR 20 slot (Q1) where A→CO2 and B→CO3, plus a standalone Q3.
const orQuestions: OrMarkQuestion[] = [
  { questionKey: 'Q1-A', label: 'Q1(A)', maxMarks: 20, orGroupId: 'Q1', orAlternative: 'A', questionNumber: 1 },
  { questionKey: 'Q1-B', label: 'Q1(B)', maxMarks: 20, orGroupId: 'Q1', orAlternative: 'B', questionNumber: 1 },
];

describe('resolveOrMarkEntry', () => {
  it('records the attempted alternative and marks the other NOT_ATTEMPTED_DUE_TO_OR', () => {
    const res = resolveOrMarkEntry({
      questions: orQuestions,
      attempts: { Q1: 'B' },
      marks: { 'Q1-B': 14 },
    });
    assert.equal(res.ok, true);
    const a = res.perQuestion.find((p) => p.questionKey === 'Q1-A')!;
    const b = res.perQuestion.find((p) => p.questionKey === 'Q1-B')!;
    assert.equal(a.status, 'NOT_ATTEMPTED_DUE_TO_OR');
    assert.equal(a.awarded, null);
    assert.equal(b.status, 'ATTEMPTED');
    assert.equal(b.awarded, 14);
    assert.equal(res.total, 14);
  });

  it('accepts a student who selects A instead', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, attempts: { Q1: 'A' }, marks: { 'Q1-A': 18 } });
    assert.equal(res.ok, true);
    assert.equal(res.perQuestion.find((p) => p.questionKey === 'Q1-A')!.status, 'ATTEMPTED');
    assert.equal(res.perQuestion.find((p) => p.questionKey === 'Q1-B')!.status, 'NOT_ATTEMPTED_DUE_TO_OR');
  });

  it('rejects marks entered for both alternatives', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, marks: { 'Q1-A': 10, 'Q1-B': 12 } });
    assert.equal(res.ok, false);
    assert.ok(res.issues.some((i) => i.code === 'OR_BOTH_MARKED'));
  });

  it('rejects marks against the unselected alternative', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, attempts: { Q1: 'B' }, marks: { 'Q1-A': 5, 'Q1-B': 14 } });
    assert.equal(res.ok, false);
    assert.ok(res.issues.some((i) => i.code === 'OR_UNSELECTED_HAS_MARKS'));
  });

  it('flags a slot with no attempt and no marks', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, marks: {} });
    assert.equal(res.ok, false);
    assert.ok(res.issues.some((i) => i.code === 'OR_NO_ATTEMPT'));
  });

  it('rejects marks above the maximum', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, attempts: { Q1: 'A' }, marks: { 'Q1-A': 21 } });
    assert.equal(res.ok, false);
    assert.ok(res.issues.some((i) => i.code === 'MARKS_EXCEED_MAX'));
  });

  it('supports subquestion totals within an alternative', () => {
    const subQuestions: OrMarkQuestion[] = [
      { questionKey: 'Q1-A-a', label: 'Q1(A)(a)', maxMarks: 10, orGroupId: 'Q1', orAlternative: 'A', questionNumber: 1 },
      { questionKey: 'Q1-A-b', label: 'Q1(A)(b)', maxMarks: 10, orGroupId: 'Q1', orAlternative: 'A', questionNumber: 1 },
      { questionKey: 'Q1-B-a', label: 'Q1(B)(a)', maxMarks: 10, orGroupId: 'Q1', orAlternative: 'B', questionNumber: 1 },
      { questionKey: 'Q1-B-b', label: 'Q1(B)(b)', maxMarks: 10, orGroupId: 'Q1', orAlternative: 'B', questionNumber: 1 },
    ];
    const res = resolveOrMarkEntry({ questions: subQuestions, attempts: { Q1: 'B' }, marks: { 'Q1-B-a': 7, 'Q1-B-b': 8 } });
    assert.equal(res.ok, true);
    assert.equal(res.total, 15);
    assert.ok(res.perQuestion.filter((p) => p.status === 'NOT_ATTEMPTED_DUE_TO_OR').length === 2);
  });

  it('marks every alternative ABSENT without requiring an attempt when the row is absent', () => {
    const res = resolveOrMarkEntry({ questions: orQuestions, marks: {}, rowStatus: 'ABSENT' });
    assert.equal(res.ok, true);
    assert.ok(res.perQuestion.every((p) => p.status === 'ABSENT'));
    assert.equal(res.total, null);
  });
});

describe('buildMarkColumns', () => {
  it('emits Attempted + both alternative columns per OR slot', () => {
    const columns = buildMarkColumns([
      ...orQuestions,
      { questionKey: 'Q3-A', label: 'Q3(A)', maxMarks: 10, orGroupId: 'Q3', orAlternative: 'A', questionNumber: 3 },
      { questionKey: 'Q3-B', label: 'Q3(B)', maxMarks: 10, orGroupId: 'Q3', orAlternative: 'B', questionNumber: 3 },
    ]);
    const kinds = columns.map((c) => (c.kind === 'ATTEMPT' ? `${c.orGroupId}:ATTEMPT` : `${c.questionKey}`));
    assert.deepEqual(kinds, ['Q1:ATTEMPT', 'Q1-A', 'Q1-B', 'Q3:ATTEMPT', 'Q3-A', 'Q3-B']);
  });
});

// Attainment must follow the attempted alternative's CO, not both.
function orSource(marks: AssessmentSourceInput['marks'], students: AssessmentSourceInput['students']): AssessmentSourceInput {
  return {
    sourceKind: 'INTERNAL_PAPER',
    sourceId: 1,
    sourceLabel: 'IA-1',
    category: 'CIE',
    weight: 1,
    questions: [
      { questionKey: 'Q1-A', maxMarks: 20, coCode: 'CO2', orGroupId: 'Q1', orAlternative: 'A' },
      { questionKey: 'Q1-B', maxMarks: 20, coCode: 'CO3', orGroupId: 'Q1', orAlternative: 'B' },
    ],
    students,
    marks,
  };
}

describe('CO attainment with OR alternatives', () => {
  it('credits only the attempted alternative CO and excludes the unchosen one', () => {
    const source = orSource(
      [
        { studentKey: 'S1', questionKey: 'Q1-A', coCode: 'CO2', awarded: null, maxMarks: 20, status: 'NOT_ATTEMPTED_DUE_TO_OR' },
        { studentKey: 'S1', questionKey: 'Q1-B', coCode: 'CO3', awarded: 18, maxMarks: 20, status: 'ATTEMPTED' },
      ],
      [{ studentKey: 'S1', usn: 'S1', status: 'PRESENT' }],
    );
    const rows = computeSourceCoAttainment(source, SKILLONX_STANDARD_V1);
    const co2 = rows.find((r) => r.coCode === 'CO2');
    const co3 = rows.find((r) => r.coCode === 'CO3');
    // CO2's only question was not attempted → no student scored → attainment null.
    assert.equal(co2?.studentScores.length ?? 0, 0);
    assert.equal(co2?.attainment ?? null, null);
    // CO3 scored 18/20 = 90% → level 3.
    assert.equal(co3?.studentScores.length, 1);
    assert.equal(co3?.studentScores[0].percent, 90);
  });

  it('aggregates a class where students split across OR alternatives', () => {
    const source = orSource(
      [
        // S1, S2 attempt A (CO2); S3 attempts B (CO3).
        { studentKey: 'S1', questionKey: 'Q1-A', coCode: 'CO2', awarded: 16, maxMarks: 20, status: 'ATTEMPTED' },
        { studentKey: 'S1', questionKey: 'Q1-B', coCode: 'CO3', awarded: null, maxMarks: 20, status: 'NOT_ATTEMPTED_DUE_TO_OR' },
        { studentKey: 'S2', questionKey: 'Q1-A', coCode: 'CO2', awarded: 14, maxMarks: 20, status: 'ATTEMPTED' },
        { studentKey: 'S2', questionKey: 'Q1-B', coCode: 'CO3', awarded: null, maxMarks: 20, status: 'NOT_ATTEMPTED_DUE_TO_OR' },
        { studentKey: 'S3', questionKey: 'Q1-A', coCode: 'CO2', awarded: null, maxMarks: 20, status: 'NOT_ATTEMPTED_DUE_TO_OR' },
        { studentKey: 'S3', questionKey: 'Q1-B', coCode: 'CO3', awarded: 19, maxMarks: 20, status: 'ATTEMPTED' },
      ],
      [
        { studentKey: 'S1', usn: 'S1', status: 'PRESENT' },
        { studentKey: 'S2', usn: 'S2', status: 'PRESENT' },
        { studentKey: 'S3', usn: 'S3', status: 'PRESENT' },
      ],
    );
    const rows = computeSourceCoAttainment(source, SKILLONX_STANDARD_V1);
    const co2 = rows.find((r) => r.coCode === 'CO2')!;
    const co3 = rows.find((r) => r.coCode === 'CO3')!;
    // Only the actual attempters contribute to each CO.
    assert.deepEqual(co2.studentScores.map((s) => s.studentKey).sort(), ['S1', 'S2']);
    assert.deepEqual(co3.studentScores.map((s) => s.studentKey), ['S3']);
    assert.equal(co2.studentScores.every((s) => s.maxMarks === 20), true);
  });
});
