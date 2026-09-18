export declare const QUIZ_QUESTION_TYPES: readonly ["SINGLE_CHOICE", "MULTIPLE_SELECT", "TRUE_FALSE", "NUMERIC", "SHORT_ANSWER"];
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];
export declare const QUIZ_DIFFICULTIES: readonly ["EASY", "INTERMEDIATE", "DIFFICULT"];
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];
export declare const QUIZ_REVIEW_STATUSES: readonly ["APPROVED", "NEEDS_REVIEW"];
export type QuizReviewStatus = (typeof QUIZ_REVIEW_STATUSES)[number];
/** Shared with Assignment — prefer VERIFIED_SOURCE; VERIFIED is legacy alias. */
export declare const QUIZ_CO_VERIFICATION_STATUSES: readonly ["VERIFIED_SOURCE", "VERIFIED", "ACADEMIC_ANALYSIS", "NEEDS_REVIEW", "CO_MAPPING_BLOCKED"];
export type QuizCoVerificationStatus = (typeof QUIZ_CO_VERIFICATION_STATUSES)[number];
/** Validated questions that may enter a generated quiz. READY is a legacy alias. */
export declare const QUIZ_SELECTABLE_STATUSES: readonly ["APPROVED", "READY"];
export declare const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string>;
export declare function normalizeDifficulty(raw: string | null | undefined): QuizDifficulty | null;
export declare function isSelectableReviewStatus(status: string | null | undefined): status is "APPROVED" | "READY";
export declare function normalizeSubjectName(name: string): string;
export declare const QUIZ_STATUSES: readonly ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"];
export type QuizStoredStatus = (typeof QUIZ_STATUSES)[number];
export declare const QUIZ_ATTEMPT_STATUSES: readonly ["IN_PROGRESS", "SUBMITTED", "EXPIRED_SUBMITTED"];
export type QuizAttemptStatus = (typeof QUIZ_ATTEMPT_STATUSES)[number];
export declare const CORRECT_ANSWER_VISIBILITY: readonly ["IMMEDIATELY", "AFTER_END", "NEVER"];
export type CorrectAnswerVisibility = (typeof CORRECT_ANSWER_VISIBILITY)[number];
export declare const AUTO_GRADABLE_TYPES: Set<"SHORT_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "NUMERIC">;
export declare const QUIZ_QUESTION_TYPE_LABELS: Record<QuizQuestionType, string>;
export declare function normalizeQuestionText(text: string): string;
export declare const ANSWER_KEY_LEAK_KEYS: readonly ["correctAnswer", "correctOption", "correctOptionId", "correctOptionIds", "answerKey", "isCorrect", "is_correct", "numericTolerance", "grading", "gradingKey"];
