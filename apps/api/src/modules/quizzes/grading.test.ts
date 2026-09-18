import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canStartNewAttempt,
  computeExpiresAt,
  gradeAttempt,
  gradeQuestion,
  isAttemptExpired,
  remainingSeconds,
  type SnapshotQuestion,
} from './grading.js';
import {
  assertNoAnswerKeyLeak,
  canShowCorrectAnswers,
  canShowScore,
  collectForbiddenKeys,
  toPublicQuestion,
} from './serialize.js';

const hdfs: SnapshotQuestion = {
  id: 1,
  questionText: 'Which component of Hadoop is responsible for distributed storage?',
  questionType: 'SINGLE_CHOICE',
  marks: 1,
  options: [
    { id: 11, label: 'MapReduce', isCorrect: false },
    { id: 12, label: 'HDFS', isCorrect: true },
    { id: 13, label: 'YARN', isCorrect: false },
    { id: 14, label: 'Spark', isCorrect: false },
  ],
  correctOptionIds: [12],
};

const multi: SnapshotQuestion = {
  id: 2,
  questionText: 'Which are Hadoop ecosystem components?',
  questionType: 'MULTIPLE_SELECT',
  marks: 2,
  options: [
    { id: 21, label: 'HDFS', isCorrect: true },
    { id: 22, label: 'YARN', isCorrect: true },
    { id: 23, label: 'PostgreSQL', isCorrect: false },
    { id: 24, label: 'MapReduce', isCorrect: true },
  ],
  correctOptionIds: [21, 22, 24],
};

const tf: SnapshotQuestion = {
  id: 3,
  questionText: 'HDFS provides distributed storage across Hadoop nodes.',
  questionType: 'TRUE_FALSE',
  marks: 1,
  options: [
    { id: 31, label: 'True', isCorrect: true },
    { id: 32, label: 'False', isCorrect: false },
  ],
  correctOptionIds: [31],
};

const numeric: SnapshotQuestion = {
  id: 4,
  questionText: 'Approximate value of pi to two decimals.',
  questionType: 'NUMERIC',
  marks: 1,
  options: [],
  correctOptionIds: [],
  numericAnswer: 3.14,
  numericTolerance: 0.01,
};

describe('single-choice grading', () => {
  it('awards full marks for the correct option', () => {
    const r = gradeQuestion(hdfs, { questionId: 1, selectedOptionIds: [12] });
    assert.equal(r.isCorrect, true);
    assert.equal(r.awardedMarks, 1);
  });

  it('awards 0 for an incorrect option', () => {
    const r = gradeQuestion(hdfs, { questionId: 1, selectedOptionIds: [11] });
    assert.equal(r.isCorrect, false);
    assert.equal(r.awardedMarks, 0);
  });

  it('awards 0 when unanswered', () => {
    const r = gradeQuestion(hdfs, { questionId: 1, selectedOptionIds: [] });
    assert.equal(r.unanswered, true);
    assert.equal(r.awardedMarks, 0);
  });
});

describe('multiple-select grading', () => {
  it('requires all correct selections and no incorrect ones', () => {
    const full = gradeQuestion(multi, { questionId: 2, selectedOptionIds: [21, 22, 24] });
    assert.equal(full.isCorrect, true);
    assert.equal(full.awardedMarks, 2);
    const partial = gradeQuestion(multi, { questionId: 2, selectedOptionIds: [21, 22] });
    assert.equal(partial.isCorrect, false);
    assert.equal(partial.awardedMarks, 0);
    const extra = gradeQuestion(multi, { questionId: 2, selectedOptionIds: [21, 22, 23, 24] });
    assert.equal(extra.isCorrect, false);
    assert.equal(extra.awardedMarks, 0);
  });
});

describe('true/false grading', () => {
  it('grades a true/false item as single choice', () => {
    assert.equal(gradeQuestion(tf, { questionId: 3, selectedOptionIds: [31] }).isCorrect, true);
    assert.equal(gradeQuestion(tf, { questionId: 3, selectedOptionIds: [32] }).isCorrect, false);
  });
});

describe('numeric grading', () => {
  it('accepts an answer within tolerance and rejects string-style mismatch outside it', () => {
    assert.equal(gradeQuestion(numeric, { questionId: 4, numericAnswer: 3.14 }).isCorrect, true);
    assert.equal(gradeQuestion(numeric, { questionId: 4, numericAnswer: 3.141 }).isCorrect, true);
    assert.equal(gradeQuestion(numeric, { questionId: 4, numericAnswer: 3.2 }).isCorrect, false);
    assert.equal(gradeQuestion(numeric, { questionId: 4, numericAnswer: 3 }).isCorrect, false);
  });
});

describe('score calculation', () => {
  it('sums marks, percentage, and pass/fail', () => {
    const result = gradeAttempt(
      [hdfs, multi, tf, numeric],
      [
        { questionId: 1, selectedOptionIds: [12] },
        { questionId: 2, selectedOptionIds: [21, 22] },
        { questionId: 3, selectedOptionIds: [31] },
        { questionId: 4, numericAnswer: 3.14 },
      ],
      40,
    );
    assert.equal(result.totalMarks, 5);
    assert.equal(result.obtainedMarks, 3);
    assert.equal(result.percentage, 60);
    assert.equal(result.passed, true);
  });

  it('fails below the pass percentage', () => {
    const result = gradeAttempt([hdfs, tf], [{ questionId: 1, selectedOptionIds: [11] }], 40);
    assert.equal(result.obtainedMarks, 0);
    assert.equal(result.passed, false);
  });
});

describe('attempt limits and timer', () => {
  it('resumes an in-progress attempt instead of consuming another', () => {
    const decision = canStartNewAttempt({
      attemptsAllowed: 1,
      submittedCount: 0,
      inProgressCount: 1,
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.reason, 'IN_PROGRESS');
  });

  it('blocks a second start when the attempt limit is reached', () => {
    const decision = canStartNewAttempt({
      attemptsAllowed: 1,
      submittedCount: 1,
      inProgressCount: 0,
    });
    assert.equal(decision.ok, false);
    assert.equal(decision.reason, 'LIMIT');
  });

  it('allows unlimited attempts when attemptsAllowed is 0', () => {
    const decision = canStartNewAttempt({
      attemptsAllowed: 0,
      submittedCount: 12,
      inProgressCount: 0,
    });
    assert.equal(decision.ok, true);
  });

  it('computes expiry from server start time, not the browser clock', () => {
    const started = new Date('2026-08-18T10:00:00.000Z');
    const expires = computeExpiresAt(started, 20);
    assert.equal(expires?.toISOString(), '2026-08-18T10:20:00.000Z');
    assert.equal(isAttemptExpired(expires, new Date('2026-08-18T10:19:59.000Z')), false);
    assert.equal(isAttemptExpired(expires, new Date('2026-08-18T10:20:00.000Z')), true);
    assert.equal(remainingSeconds(expires, new Date('2026-08-18T10:05:28.000Z')), 14 * 60 + 32);
  });
});

describe('answer-key leak prevention', () => {
  it('public question payloads contain none of the forbidden grading keys', () => {
    const publicQ = toPublicQuestion(hdfs);
    const json = JSON.stringify(publicQ);
    for (const key of [
      'correctAnswer',
      'correctOption',
      'correctOptionId',
      'correctOptionIds',
      'answerKey',
      'isCorrect',
      'is_correct',
      'grading',
    ]) {
      assert.equal(json.includes(key), false, `leaked ${key}`);
    }
    assert.deepEqual(collectForbiddenKeys(publicQ), []);
    assert.doesNotThrow(() => assertNoAnswerKeyLeak({ questions: [publicQ] }, 'attempt'));
  });

  it('detects a leak if grading metadata is accidentally included', () => {
    const leaked = { ...toPublicQuestion(hdfs), correctOptionIds: [12], isCorrect: true };
    assert.deepEqual(collectForbiddenKeys(leaked).sort(), ['correctOptionIds', 'isCorrect']);
  });

  it('hides the answer key until release policy allows it', () => {
    assert.equal(canShowCorrectAnswers({ visibility: 'NEVER', quizEnded: true }), false);
    assert.equal(canShowCorrectAnswers({ visibility: 'AFTER_END', quizEnded: false }), false);
    assert.equal(canShowCorrectAnswers({ visibility: 'AFTER_END', quizEnded: true }), true);
    assert.equal(canShowCorrectAnswers({ visibility: 'IMMEDIATELY', quizEnded: false }), true);
    assert.equal(canShowScore({ showScoreImmediately: true, quizEnded: false }), true);
    assert.equal(canShowScore({ showScoreImmediately: false, quizEnded: false }), false);
    assert.equal(canShowScore({ showScoreImmediately: false, quizEnded: true }), true);
  });
});

describe('question snapshot immutability', () => {
  it('later edits to the live question do not change a stored attempt snapshot', () => {
    const snapshot = structuredClone(hdfs);
    const live = hdfs;
    live.questionText = 'CHANGED';
    live.correctOptionIds = [11];
    live.options[1].isCorrect = false;
    live.options[0].isCorrect = true;
    assert.equal(snapshot.questionText.includes('distributed storage'), true);
    assert.deepEqual(snapshot.correctOptionIds, [12]);
    const graded = gradeQuestion(snapshot, { questionId: 1, selectedOptionIds: [12] });
    assert.equal(graded.isCorrect, true);
  });
});
