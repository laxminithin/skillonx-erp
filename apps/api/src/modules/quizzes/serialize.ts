import { ANSWER_KEY_LEAK_KEYS } from '../../types/quiz.js';
import type { SnapshotQuestion } from './grading.js';

const FORBIDDEN = new Set<string>(ANSWER_KEY_LEAK_KEYS);

export type PublicQuizOption = { id: number; label: string };

export type PublicQuizQuestion = {
  id: number;
  questionText: string;
  questionType: string;
  marks: number;
  options: PublicQuizOption[];
};

export function toPublicQuestion(question: SnapshotQuestion): PublicQuizQuestion {
  return {
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    marks: Number(question.marks),
    options: question.options.map((o) => ({ id: o.id, label: o.label })),
  };
}

export type ReviewQuestion = PublicQuizQuestion & {
  yourOptionIds: number[];
  yourNumericAnswer: number | null;
  yourTextAnswer: string | null;
  awardedMarks: number;
  isCorrect: boolean | null;
  unanswered: boolean;
  correctOptionIds?: number[];
  explanation?: string | null;
  numericAnswer?: number | null;
};

export function toReviewQuestion(
  question: SnapshotQuestion,
  answer: {
    selectedOptionIds: number[];
    numericAnswer: number | null;
    textAnswer: string | null;
    awardedMarks: number;
    isCorrect: boolean | null;
    unanswered: boolean;
  },
  includeKey: boolean,
): ReviewQuestion {
  const base: ReviewQuestion = {
    ...toPublicQuestion(question),
    yourOptionIds: answer.selectedOptionIds,
    yourNumericAnswer: answer.numericAnswer,
    yourTextAnswer: answer.textAnswer,
    awardedMarks: answer.awardedMarks,
    isCorrect: includeKey ? answer.isCorrect : null,
    unanswered: answer.unanswered,
  };
  if (!includeKey) return base;
  return {
    ...base,
    correctOptionIds: question.correctOptionIds,
    explanation: question.explanation ?? null,
    numericAnswer: question.numericAnswer ?? null,
  };
}

export function collectForbiddenKeys(value: unknown, found = new Set<string>()): string[] {
  if (value == null) return [...found];
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenKeys(item, found);
    return [...found];
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN.has(key)) found.add(key);
      collectForbiddenKeys(child, found);
    }
  }
  return [...found];
}

export function assertNoAnswerKeyLeak(payload: unknown, context: string) {
  const leaks = collectForbiddenKeys(payload);
  if (leaks.length) {
    throw new Error(`Answer-key leak in ${context}: ${leaks.join(', ')}`);
  }
}

export function canShowScore(params: {
  showScoreImmediately: boolean;
  quizEnded: boolean;
}): boolean {
  return params.showScoreImmediately || params.quizEnded;
}

export function canShowCorrectAnswers(params: {
  visibility: string;
  quizEnded: boolean;
}): boolean {
  if (params.visibility === 'IMMEDIATELY') return true;
  if (params.visibility === 'AFTER_END') return params.quizEnded;
  return false;
}
