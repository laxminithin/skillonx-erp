export const FORMULA_VERSION = 'skillonx-attainment-formula-v1.0';
export const QUALITY_SCORE_VERSION = 'skillonx-qp-quality-v1.0';
export const STANDARD_CODE = 'SKILLONX_ACADEMIC_STANDARD';
export const STANDARD_VERSION = '1.0';

export const SEE_METHODS = ['ACTUAL', 'PAPER_WEIGHTED', 'EQUAL_WEIGHT'] as const;
export type SeeMethod = (typeof SEE_METHODS)[number];

export const SEE_CONFIDENCE = {
  ACTUAL: 'HIGH',
  PAPER_WEIGHTED: 'MEDIUM',
  EQUAL_WEIGHT: 'LOW',
} as const;

export const SEE_METHOD_LABELS: Record<SeeMethod, string> = {
  ACTUAL: 'Actual — High Confidence',
  PAPER_WEIGHTED: 'Paper-Weighted Estimate — Medium Confidence',
  EQUAL_WEIGHT: 'Equal-Weight Estimate — Low Confidence',
};

export const CO_STATUSES = ['GREEN', 'AMBER', 'RED', 'INSUFFICIENT_DATA'] as const;
export type CoStatus = (typeof CO_STATUSES)[number];

export const RUN_STATUSES = ['PREVIEW', 'COMMITTED', 'SUPERSEDED'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const MARK_SHEET_KINDS = [
  'INTERNAL_PAPER',
  'SEE',
  'LAB',
  'PROJECT',
  'QUIZ',
  'ASSIGNMENT',
  'REASSESSMENT',
] as const;
export type MarkSheetKind = (typeof MARK_SHEET_KINDS)[number];

export const STUDENT_MARK_STATUSES = [
  'PRESENT',
  'ATTEMPTED',
  'NOT_ATTEMPTED_DUE_TO_OR',
  'ABSENT',
  'NOT_EVALUATED',
  'EXEMPT',
] as const;
export type StudentMarkStatus = (typeof STUDENT_MARK_STATUSES)[number];

/** A mark counts toward CO evidence only when the alternative was actually attempted. */
export function isAttemptedMarkStatus(status: StudentMarkStatus | string | null | undefined) {
  const s = String(status || 'PRESENT').toUpperCase();
  return s === 'PRESENT' || s === 'ATTEMPTED';
}

/** Statuses whose marks are excluded from both numerator and denominator of a CO. */
export function isExcludedMarkStatus(status: StudentMarkStatus | string | null | undefined) {
  const s = String(status || '').toUpperCase();
  return s === 'ABSENT' || s === 'EXEMPT' || s === 'NOT_EVALUATED' || s === 'NOT_ATTEMPTED_DUE_TO_OR';
}

export const CYCLE_KINDS = ['CO', 'PO', 'PSO'] as const;
export type CycleKind = (typeof CYCLE_KINDS)[number];

export const CI_STATES = [
  'DETECTED',
  'FACULTY_REVIEW_REQUIRED',
  'ACTION_PLANNED',
  'APPROVED_FOR_IMPLEMENTATION',
  'IN_PROGRESS',
  'IMPLEMENTED',
  'EVIDENCE_INCOMPLETE',
  'READY_FOR_REASSESSMENT',
  'REASSESSED',
  'TARGET_ACHIEVED',
  'TARGET_NOT_ACHIEVED',
  'SUBMITTED_FOR_REVIEW',
  'APPROVED',
  'CLOSED',
  'REOPENED',
] as const;
export type CiState = (typeof CI_STATES)[number];

export type StudentLevelThreshold = {
  minPercent: number;
  level: number;
};

export type AcademicPolicy = {
  code: string;
  version: string;
  name: string;
  coAttainmentScaleLevels: number;
  scaleMax: number;
  defaultCoTarget: number;
  defaultPoTarget: number;
  defaultPsoTarget: number;
  directWeight: number;
  indirectWeight: number;
  feedbackBenchmarkPercent: number;
  studentLevelThresholds: StudentLevelThreshold[];
  studentWeakPercent: number;
  amberBand: number;
  amberWeakStudentRatio: number;
  amberComponentGap: number;
  greenComfortMargin: number;
  deteriorationThreshold: number;
  coBelowTargetRequiresImprovement: boolean;
  poBelowTargetRequiresImprovement: boolean;
  reassessmentMandatoryForRed: boolean;
  evidenceMandatoryByIntervention: boolean;
  beforeAfterComparisonMandatory: boolean;
  facultyCannotSelfClose: boolean;
  closureRequiresApproval: boolean;
  seeMethodPriority: SeeMethod[];
  defaultCieSeeSplitWhenMissing: { cie: number; see: number };
  formulaVersion: string;
  qualityScoreVersion: string;
};

export type WeightedPart = {
  key: string;
  label: string;
  value: number | null;
  weight: number;
};

export type WeightedResult = {
  result: number | null;
  usedWeight: number;
  missing: string[];
  formula: string;
  parts: Array<{ key: string; label: string; value: number | null; weight: number; included: boolean }>;
};

export type CoStatusInput = {
  actual: number | null;
  target: number;
  weakStudentRatio: number;
  weakComponentGap: number;
  previousActual?: number | null;
};

export type StudentQuestionMark = {
  studentKey: string;
  questionKey: string;
  coCode: string | null;
  awarded: number | null;
  maxMarks: number;
  status: StudentMarkStatus;
  bloomLevel?: string | null;
  difficulty?: string | null;
  topic?: string | null;
  module?: string | null;
  orGroupId?: string | null;
  orAlternative?: string | null;
};

export type StudentRow = {
  studentKey: string;
  usn: string;
  name?: string | null;
  status: StudentMarkStatus;
  totalAwarded?: number | null;
  totalMax?: number | null;
};

export type AssessmentSourceInput = {
  sourceKind: string;
  sourceId: number | string;
  sourceLabel: string;
  category: 'CIE' | 'SEE' | 'INDIRECT' | 'OTHER';
  weight: number;
  questions: Array<{
    questionKey: string;
    maxMarks: number;
    coCode: string | null;
    bloomLevel?: string | null;
    difficulty?: string | null;
    topic?: string | null;
    module?: string | null;
    orGroupId?: string | null;
    orAlternative?: string | null;
  }>;
  students: StudentRow[];
  marks: StudentQuestionMark[];
};

export type SeePaperQuestion = {
  questionKey: string;
  coCode: string | null;
  maxMarks: number;
};

export type MappingCell = {
  coCode: string;
  outcomeCode: string;
  strength: number;
};
