export const QUIZ_QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_SELECT',
  'TRUE_FALSE',
  'NUMERIC',
  'SHORT_ANSWER',
] as const;
export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const QUIZ_DIFFICULTIES = ['EASY', 'INTERMEDIATE', 'DIFFICULT'] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export const QUIZ_REVIEW_STATUSES = ['APPROVED', 'NEEDS_REVIEW'] as const;
export type QuizReviewStatus = (typeof QUIZ_REVIEW_STATUSES)[number];

/** Shared with Assignment — prefer VERIFIED_SOURCE; VERIFIED is legacy alias. */
export const QUIZ_CO_VERIFICATION_STATUSES = [
  'VERIFIED_SOURCE',
  'VERIFIED',
  'ACADEMIC_ANALYSIS',
  'NEEDS_REVIEW',
  'CO_MAPPING_BLOCKED',
] as const;
export type QuizCoVerificationStatus = (typeof QUIZ_CO_VERIFICATION_STATUSES)[number];

/** Validated questions that may enter a generated quiz. READY is a legacy alias. */
export const QUIZ_SELECTABLE_STATUSES = ['APPROVED', 'READY'] as const;

export const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  EASY: 'Easy',
  INTERMEDIATE: 'Intermediate',
  DIFFICULT: 'Difficult',
};

export function normalizeDifficulty(raw: string | null | undefined): QuizDifficulty | null {
  if (!raw) return null;
  const token = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (['easy', 'basic', 'beginner'].includes(token)) return 'EASY';
  if (['intermediate', 'medium', 'moderate'].includes(token)) return 'INTERMEDIATE';
  if (['difficult', 'hard', 'advanced'].includes(token)) return 'DIFFICULT';
  return null;
}

export function isSelectableReviewStatus(status: string | null | undefined) {
  return status === 'APPROVED' || status === 'READY';
}

export function normalizeSubjectName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const QUIZ_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const;
export type QuizStoredStatus = (typeof QUIZ_STATUSES)[number];

export const QUIZ_ATTEMPT_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED_SUBMITTED'] as const;
export type QuizAttemptStatus = (typeof QUIZ_ATTEMPT_STATUSES)[number];

export const CORRECT_ANSWER_VISIBILITY = ['IMMEDIATELY', 'AFTER_END', 'NEVER'] as const;
export type CorrectAnswerVisibility = (typeof CORRECT_ANSWER_VISIBILITY)[number];

export const AUTO_GRADABLE_TYPES = new Set<QuizQuestionType>([
  'SINGLE_CHOICE',
  'MULTIPLE_SELECT',
  'TRUE_FALSE',
  'NUMERIC',
]);

export const QUIZ_QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_SELECT: 'Multiple Select',
  TRUE_FALSE: 'True / False',
  NUMERIC: 'Numeric Answer',
  SHORT_ANSWER: 'Short Answer',
};

export function normalizeQuestionText(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

export const ANSWER_KEY_LEAK_KEYS = [
  'correctAnswer',
  'correctOption',
  'correctOptionId',
  'correctOptionIds',
  'answerKey',
  'isCorrect',
  'is_correct',
  'numericTolerance',
  'grading',
  'gradingKey',
] as const;
