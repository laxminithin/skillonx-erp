export const ASSIGNMENT_QUESTION_TYPES = [
  'DESCRIPTIVE',
  'SHORT_ANALYSIS',
  'USE_CASE',
  'CASE_STUDY',
  'PROBLEM_SOLVING',
  'DESIGN',
  'COMPARE_JUSTIFY',
  'APPLICATION',
  'RESEARCH_TASK',
  'CODE_EXPLANATION',
  'SCENARIO',
  'ALGORITHM',
  'INTERPRETATION',
] as const;
export type AssignmentQuestionType = (typeof ASSIGNMENT_QUESTION_TYPES)[number];

export const ASSIGNMENT_RESPONSE_FORMATS = [
  'LONG_TEXT',
  'SHORT_TEXT',
  'CODE_TEXT',
  'NUMERIC',
] as const;
export type AssignmentResponseFormat = (typeof ASSIGNMENT_RESPONSE_FORMATS)[number];

export const ASSIGNMENT_DIFFICULTIES = ['EASY', 'INTERMEDIATE', 'DIFFICULT'] as const;
export type AssignmentDifficulty = (typeof ASSIGNMENT_DIFFICULTIES)[number];

export const ASSIGNMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const;
export type AssignmentStoredStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_SUBMISSION_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'LATE_SUBMITTED',
] as const;
export type AssignmentSubmissionStatus = (typeof ASSIGNMENT_SUBMISSION_STATUSES)[number];

export const ASSIGNMENT_EVALUATION_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'EVALUATED',
  'RELEASED',
] as const;
export type AssignmentEvaluationStatus = (typeof ASSIGNMENT_EVALUATION_STATUSES)[number];

export const SOLUTION_RELEASE_POLICIES = [
  'NEVER',
  'AFTER_DUE_DATE',
  'AFTER_EVALUATION',
  'MANUAL_RELEASE',
] as const;
export type SolutionReleasePolicy = (typeof SOLUTION_RELEASE_POLICIES)[number];

export const GENERATOR_PRESETS = ['SHORT', 'STANDARD', 'DEEP_DIVE', 'CUSTOM'] as const;
export type GeneratorPreset = (typeof GENERATOR_PRESETS)[number];

export const PRINT_MODES = [
  'ASSIGNMENT',
  'EVALUATION_SCHEME',
  'MODEL_SOLUTION',
  'FACULTY_COPY',
] as const;
export type AssignmentPrintMode = (typeof PRINT_MODES)[number];

export type EvaluationCriterion = {
  id: string;
  label: string;
  maxMarks: number;
  guidance?: string | null;
};

export type EvaluationScheme = {
  criteria: EvaluationCriterion[];
  expectedKeyPoints?: string[];
  facultyNotes?: string | null;
};

export type SchemeMarkCriterion = {
  id: string;
  label: string;
  maxMarks: number;
  awarded: number;
  feedback: string | null;
};

export type SchemeMarks = {
  criteria: SchemeMarkCriterion[];
  awardedTotal: number;
  maxTotal: number;
};

export type DerivedOutcomes = {
  provenance?: string;
  mappingVersionId?: number | null;
  pos?: string[];
  psos?: string[];
  sdgs?: string[];
} | null;

export type AssignmentQuestion = {
  id: number;
  bankQuestionId?: number | null;
  moduleId?: number | null;
  moduleName?: string | null;
  questionText: string;
  questionType: AssignmentQuestionType | string;
  responseFormat?: AssignmentResponseFormat | string;
  marks: number;
  difficulty?: string | null;
  expectedAnswerGuidance?: string | null;
  modelSolution?: string | null;
  evaluationRubric?: unknown;
  evaluationScheme?: EvaluationScheme | null;
  primaryCoCode?: string | null;
  primaryCoId?: number | null;
  secondaryCoCodes?: string[];
  mappingBasis?: string | null;
  mappingSource?: string | null;
  verificationStatus?: string | null;
  derivedOutcomes?: DerivedOutcomes;
  sortOrder?: number;
};

export type AssignmentDetail = {
  id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  assignmentNumber?: string | null;
  courseId?: number | null;
  moduleId?: number | null;
  programId?: number | null;
  academicYearId?: number | null;
  semesterId?: number | null;
  departmentId?: number | null;
  classSectionId?: number | null;
  startAt?: string | null;
  dueAt?: string | null;
  lateSubmissionAllowed?: boolean;
  lateDeadlineAt?: string | null;
  status: string;
  effectiveStatus: string;
  attemptsAllowed?: number;
  showMarksImmediately?: boolean;
  showFeedbackAfterEvaluation?: boolean;
  passPercentage?: number;
  solutionReleasePolicy?: SolutionReleasePolicy | string;
  solutionsReleasedAt?: string | null;
  randomSelection?: {
    mode?: string;
    moduleIds?: number[];
    easyCount?: number;
    intermediateCount?: number;
    difficultCount?: number;
    distribution?: string;
    preset?: string;
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
  createdByName?: string;
  questionCount?: number;
  totalMarks?: number;
  submissionCount?: number;
  evaluatedCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  questions: AssignmentQuestion[];
  audit?: AssignmentAuditEvent[];
};

export type AssignmentListRow = {
  id: number;
  title: string;
  courseName?: string;
  courseCode?: string;
  moduleName?: string;
  questionCount?: number;
  totalMarks?: number;
  submissionCount?: number;
  evaluatedCount?: number;
  startAt?: string | null;
  dueAt?: string | null;
  effectiveStatus: string;
  status: string;
  updatedAt: string;
  randomSelection?: AssignmentDetail['randomSelection'];
};

export type AssignmentSubmissionRow = {
  id: number;
  submissionToken: string;
  attemptNumber?: number;
  studentName: string;
  usn?: string;
  studentUsn?: string;
  email?: string;
  status: string;
  isLate: boolean;
  startedAt?: string;
  submittedAt?: string;
  obtainedMarks?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  evaluationStatus: string;
  resultsReleased?: boolean;
  evaluatedAt?: string | null;
};

export type AssignmentSubmissionDetail = {
  submissionToken: string;
  attemptNumber?: number;
  studentName: string;
  usn?: string;
  email?: string;
  status: string;
  isLate: boolean;
  startedAt?: string;
  submittedAt?: string;
  obtainedMarks?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  evaluationStatus: string;
  resultsReleased?: boolean;
  overallFeedback?: string | null;
  evaluatedBy?: string | null;
  evaluatedAt?: string | null;
  questions: Array<
    AssignmentQuestion & {
      textAnswer?: string | null;
      wordCount?: number | null;
      awardedMarks?: number | null;
      feedback?: string | null;
      schemeMarks?: SchemeMarks | null;
    }
  >;
};

export type AssignmentAuditEvent = {
  id?: number;
  action: string;
  actor?: string | null;
  actorName?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
};

export type AssignmentCoPerformance = {
  assignmentId: number;
  evaluatedSubmissionCount: number;
  note?: string;
  cos: Array<{
    coCode: string;
    questionCount: number;
    availableMarks: number;
    classAverageMarks: number;
    averagePercent: number | null;
  }>;
};

export type AssignmentPrintModel = {
  documentTitle: string;
  title: string;
  assignmentNumber?: string | null;
  description?: string | null;
  instructions?: string | null;
  courseName?: string;
  courseCode?: string;
  moduleName?: string;
  departmentName?: string;
  academicYearLabel?: string;
  semesterLabel?: string;
  startAt?: string | null;
  dueAt?: string | null;
  passPercentage?: number;
  totalMarks: number;
  questions: Array<{
    number: number;
    questionText: string;
    questionType: string;
    marks: number;
    difficulty?: string | null;
    primaryCoCode?: string | null;
    modelSolution?: string | null;
    evaluationScheme?: EvaluationScheme | null;
  }>;
};

export type PublicAssignmentLanding = {
  code: string;
  title: string;
  courseName?: string;
  moduleName?: string;
  instructions?: string | null;
  questionCount: number;
  totalMarks: number;
  dueAt?: string | null;
  canStart: boolean;
  message?: string;
  accessible?: boolean;
};

export type PublicAssignmentSession = {
  submissionToken: string;
  status: string;
  questions: Array<{
    id: number;
    questionText: string;
    marks: number;
    questionType?: string;
    responseFormat?: string;
    textAnswer?: string;
    wordCount?: number;
    awardedMarks?: number;
    feedback?: string;
  }>;
  obtainedMarks?: number;
  totalMarks?: number;
  percentage?: number;
  resultsReleased?: boolean;
  assignment: {
    title: string;
    instructions?: string;
    courseName?: string;
    dueAt?: string;
  };
};

export const ASSIGNMENT_QUESTION_TYPE_LABELS: Record<string, string> = {
  DESCRIPTIVE: 'Descriptive',
  SHORT_ANALYSIS: 'Short Analysis',
  USE_CASE: 'Use Case',
  CASE_STUDY: 'Case Study',
  PROBLEM_SOLVING: 'Problem Solving',
  DESIGN: 'Design',
  COMPARE_JUSTIFY: 'Compare / Justify',
  APPLICATION: 'Application',
  RESEARCH_TASK: 'Research Task',
  CODE_EXPLANATION: 'Code Explanation',
  SCENARIO: 'Scenario',
  ALGORITHM: 'Algorithm',
  INTERPRETATION: 'Interpretation',
};

export const ASSIGNMENT_DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  INTERMEDIATE: 'Intermediate',
  DIFFICULT: 'Difficult',
};

export const SOLUTION_RELEASE_LABELS: Record<string, string> = {
  NEVER: 'Never release',
  AFTER_DUE_DATE: 'After due date',
  AFTER_EVALUATION: 'After evaluation',
  MANUAL_RELEASE: 'Manual release',
};

export const GENERATOR_PRESET_META: Record<
  GeneratorPreset,
  { label: string; total: number; easy: number; intermediate: number; difficult: number }
> = {
  SHORT: { label: 'Short (5)', total: 5, easy: 2, intermediate: 2, difficult: 1 },
  STANDARD: { label: 'Standard (8)', total: 8, easy: 3, intermediate: 3, difficult: 2 },
  DEEP_DIVE: { label: 'Deep-Dive (10)', total: 10, easy: 4, intermediate: 4, difficult: 2 },
  CUSTOM: { label: 'Custom', total: 8, easy: 2, intermediate: 4, difficult: 2 },
};

export function formatOutcomeCodes(list?: Array<{ code: string } | string> | null) {
  if (!list?.length) return '—';
  return list.map((x) => (typeof x === 'string' ? x : x.code)).join(', ');
}

export function schemeFromQuestion(q: {
  evaluationScheme?: EvaluationScheme | null;
  evaluationRubric?: unknown;
}): EvaluationScheme | null {
  if (q.evaluationScheme?.criteria?.length) return q.evaluationScheme;
  const raw = q.evaluationRubric as EvaluationScheme | null | undefined;
  if (raw && Array.isArray(raw.criteria) && raw.criteria.length) return raw;
  return null;
}
