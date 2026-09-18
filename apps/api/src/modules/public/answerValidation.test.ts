import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateAnswerAgainstQuestion } from './service.js';

const ratingOptions = [
  { id: 101, value: 1 },
  { id: 102, value: 2 },
  { id: 103, value: 3 },
  { id: 104, value: 4 },
  { id: 105, value: 5 },
];

function answer(overrides: Record<string, unknown> = {}) {
  return {
    questionId: 1,
    textAnswer: null,
    numericAnswer: null,
    selectedOptionId: null,
    jsonAnswer: null,
    comment: null,
    ...overrides,
  } as never;
}

describe('validateAnswerAgainstQuestion', () => {
  it('accepts a valid selected option', () => {
    assert.doesNotThrow(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'STAR_RATING', prompt: 'Rate', config: {} },
        answer({ selectedOptionId: 103 }),
        ratingOptions,
      ),
    );
  });

  it('rejects a selected option that does not belong to the question', () => {
    assert.throws(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'MULTIPLE_CHOICE', prompt: 'Pick', config: {} },
        answer({ selectedOptionId: 999 }),
        ratingOptions,
      ),
    );
  });

  it('accepts an in-range numeric rating answer', () => {
    assert.doesNotThrow(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'STAR_RATING', prompt: 'Rate', config: {} },
        answer({ numericAnswer: 4 }),
        ratingOptions,
      ),
    );
  });

  it('rejects an out-of-range numeric rating answer', () => {
    assert.throws(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'STAR_RATING', prompt: 'Rate', config: {} },
        answer({ numericAnswer: 9999 }),
        ratingOptions,
      ),
    );
  });

  it('rejects an empty required text answer', () => {
    assert.throws(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'SHORT_ANSWER', prompt: 'Explain', config: {} },
        answer({ textAnswer: '   ' }),
        [],
      ),
    );
  });

  it('rejects checkbox options outside the question', () => {
    assert.throws(() =>
      validateAnswerAgainstQuestion(
        { question_type: 'CHECKBOX', prompt: 'Select', config: {} },
        answer({ jsonAnswer: [101, 999] }),
        ratingOptions,
      ),
    );
  });
});
