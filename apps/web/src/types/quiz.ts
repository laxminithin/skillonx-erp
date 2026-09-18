export type QuizQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'NUMERIC'
  | 'SHORT_ANSWER';

export type QuizOption = {
  id?: number;
  label: string;
  isCorrect?: boolean;
  sortOrder?: number;
};

export type QuizQuestion = {
  id: number;
  bankQuestionId?: number | null;
  moduleId?: number | null;
  moduleName?: string | null;
  questionText: string;
  questionType: QuizQuestionType;
  marks: number;
  difficulty?: string | null;
  explanation?: string | null;
  numericAnswer?: number | null;
  numericTolerance?: number | null;
  sortOrder?: number;
  options: QuizOption[];
  correctOptionIds?: number[];
  primaryCoCode?: string | null;
  primaryCoId?: number | null;
  secondaryCoCodes?: string[];
  mappingBasis?: string | null;
  mappingSource?: string | null;
  verificationStatus?: string | null;
  derivedOutcomes?: {
    provenance?: string;
    mappingVersionId?: number | null;
    pos?: string[];
    psos?: string[];
    sdgs?: string[];
  } | null;
};

export type QuizAcademicCoverage = {
  byCo: Record<string, number>;
  total: number;
  unmapped: number;
};

export type QuizDetail = {
  id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  courseId?: number | null;
  moduleId?: number | null;
  academicYearId?: number | null;
  semesterId?: number | null;
  departmentId?: number | null;
  classSectionId?: number | null;
  durationMinutes?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status: string;
  effectiveStatus: string;
  attemptsAllowed: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showScoreImmediately: boolean;
  showCorrectAnswers: string;
  showExplanation: boolean;
  passPercentage: number;
  randomSelection?: {
    mode?: string;
    moduleIds?: number[];
    easyCount?: number;
    intermediateCount?: number;
    difficultCount?: number;
    distribution?: string;
  } | null;
  structureLocked?: boolean;
  canEditStructure?: boolean;
  shareCode?: string;
  timezone?: string;
  courseName?: string;
  courseCode?: string;
  moduleName?: string;
  departmentName?: string;
  academicYearLabel?: string;
  semesterLabel?: string;
  questionCount?: number;
  totalMarks?: number;
  attemptCount?: number;
  createdAt: string;
  questions: QuizQuestion[];
  academicCoverage?: QuizAcademicCoverage;
};

export type QuizAnswer = {
  questionId: number;
  selectedOptionIds?: number[];
  numericAnswer?: number | null;
  textAnswer?: string | null;
};

export const QUIZ_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_SELECT: 'Multiple Select',
  TRUE_FALSE: 'True / False',
  NUMERIC: 'Numeric Answer',
  SHORT_ANSWER: 'Short Answer',
};

export const QUIZ_DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  INTERMEDIATE: 'Intermediate',
  DIFFICULT: 'Difficult',
  MEDIUM: 'Intermediate',
  HARD: 'Difficult',
};

export function hasQuizAnswer(answer?: QuizAnswer) {
  return Boolean(
    answer &&
      ((answer.selectedOptionIds && answer.selectedOptionIds.length > 0) ||
        answer.numericAnswer != null ||
        answer.textAnswer?.trim()),
  );
}
