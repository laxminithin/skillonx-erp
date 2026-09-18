import type { SnapshotQuestion } from './grading.js';
export type PublicQuizOption = {
    id: number;
    label: string;
};
export type PublicQuizQuestion = {
    id: number;
    questionText: string;
    questionType: string;
    marks: number;
    options: PublicQuizOption[];
};
export declare function toPublicQuestion(question: SnapshotQuestion): PublicQuizQuestion;
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
export declare function toReviewQuestion(question: SnapshotQuestion, answer: {
    selectedOptionIds: number[];
    numericAnswer: number | null;
    textAnswer: string | null;
    awardedMarks: number;
    isCorrect: boolean | null;
    unanswered: boolean;
}, includeKey: boolean): ReviewQuestion;
export declare function collectForbiddenKeys(value: unknown, found?: Set<string>): string[];
export declare function assertNoAnswerKeyLeak(payload: unknown, context: string): void;
export declare function canShowScore(params: {
    showScoreImmediately: boolean;
    quizEnded: boolean;
}): boolean;
export declare function canShowCorrectAnswers(params: {
    visibility: string;
    quizEnded: boolean;
}): boolean;
