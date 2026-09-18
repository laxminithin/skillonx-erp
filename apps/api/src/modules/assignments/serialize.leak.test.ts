import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertNoAnswerLeak,
  collectForbiddenKeys,
  toPublicAssignmentQuestion,
} from './serialize.js';
import { ANSWER_LEAK_KEYS } from '../../types/assignment.js';

describe('assignment answer leak guards', () => {
  it('lists the critical faculty-only keys', () => {
    for (const key of [
      'modelSolution',
      'expectedAnswerGuidance',
      'evaluationRubric',
      'evaluationScheme',
      'expectedKeyPoints',
      'facultyNotes',
    ]) {
      assert.ok((ANSWER_LEAK_KEYS as readonly string[]).includes(key), key);
    }
  });

  it('strips solutions from public questions', () => {
    const publicQ = toPublicAssignmentQuestion({
      id: 1,
      questionText: 'Explain polymorphism',
      questionType: 'DESCRIPTIVE',
      responseFormat: 'LONG_TEXT',
      marks: 10,
      difficulty: 'EASY',
      expectedAnswerGuidance: 'SECRET MODEL SOLUTION',
      evaluationRubric: { criteria: [{ id: 'a', label: 'A', maxMarks: 10 }] },
      evaluationScheme: { criteria: [{ id: 'a', label: 'A', maxMarks: 10 }] },
      facultyNotes: 'do not show',
    });
    assert.equal(publicQ.questionText, 'Explain polymorphism');
    assert.equal(collectForbiddenKeys(publicQ).length, 0);
    assertNoAnswerLeak(publicQ, 'public-question');
  });

  it('detects nested leaks in student payloads', () => {
    const payload = {
      questions: [
        {
          id: 1,
          questionText: 'Q',
          nested: { expectedAnswerGuidance: 'leak' },
        },
      ],
    };
    assert.deepEqual(collectForbiddenKeys(payload), ['expectedAnswerGuidance']);
    assert.throws(() => assertNoAnswerLeak(payload, 'test'), /Answer leak/);
  });
});
