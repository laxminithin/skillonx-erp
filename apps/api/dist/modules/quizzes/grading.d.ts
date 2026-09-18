import { type QuizQuestionType } from '../../types/quiz.js';
export type SnapshotOption = {
    id: number;
    label: string;
    isCorrect: boolean;
};
export type SnapshotDerivedOutcomes = {
    provenance?: string;
    mappingVersionId?: number | null;
    pos?: string[];
    psos?: string[];
    sdgs?: string[];
};
export type SnapshotQuestion = {
    id: number;
    bankQuestionId?: number | null;
    moduleId?: number | null;
    moduleName?: string | null;
    questionText: string;
    questionType: QuizQuestionType;
    marks: number;
    /** Explicit max marks (defaults to marks; preserved on attempt answers). */
    maxMarks?: number;
    explanation?: string | null;
    difficulty?: string | null;
    options: SnapshotOption[];
    correctOptionIds: number[];
    numericAnswer?: number | null;
    numericTolerance?: number | null;
    /** Frozen at publish/start — stable if master Academic Mapping later changes. */
    primaryCoCode?: string | null;
    primaryCoId?: number | null;
    secondaryCoCodes?: string[];
    mappingBasis?: string | null;
    mappingSource?: string | null;
    verificationStatus?: string | null;
    derivedOutcomes?: SnapshotDerivedOutcomes | null;
    coStatement?: string | null;
};
export type AttemptAnswerInput = {
    questionId: number;
    selectedOptionIds?: number[] | null;
    numericAnswer?: number | null;
    textAnswer?: string | null;
};
export type GradedAnswer = {
    questionId: number;
    selectedOptionIds: number[];
    numericAnswer: number | null;
    textAnswer: string | null;
    awardedMarks: number;
    maxMarks: number;
    primaryCoCode: string | null;
    primaryCoId: number | null;
    isCorrect: boolean | null;
    needsManualGrading: boolean;
    unanswered: boolean;
};
export type GradeResult = {
    answers: GradedAnswer[];
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    needsManualGrading: boolean;
};
export declare function isAnswered(question: SnapshotQuestion, answer?: AttemptAnswerInput | null): boolean;
export declare function gradeQuestion(question: SnapshotQuestion, answer?: AttemptAnswerInput | null): GradedAnswer;
export declare function gradeAttempt(questions: SnapshotQuestion[], answers: AttemptAnswerInput[], passPercentage: number): GradeResult;
export declare function remainingSeconds(expiresAt: Date | string | null | undefined, now?: Date): number | null;
export declare function isAttemptExpired(expiresAt: Date | string | null | undefined, now?: Date): boolean;
export declare function shuffled<T>(items: T[]): T[];
export declare function pickRandom<T>(items: T[], count: number): T[];
export declare function computeExpiresAt(startedAt: Date, durationMinutes: number | null | undefined): Date | null;
export declare function canStartNewAttempt(params: {
    attemptsAllowed: number;
    submittedCount: number;
    inProgressCount: number;
}): {
    ok: boolean;
    reason?: 'IN_PROGRESS' | 'LIMIT';
};
