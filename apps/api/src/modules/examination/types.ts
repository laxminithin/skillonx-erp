export const EXAM_TYPES = [
  'CIE',
  'INTERNAL',
  'LAB',
  'SEE',
  'SUPPLEMENTARY',
  'MAKEUP',
  'BACKLOG',
  'IMPROVEMENT',
  'PRACTICAL',
  'VIVA',
  'PROJECT',
] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

export const EXAM_STATUSES = [
  'DRAFT',
  'PLANNING',
  'REGISTRATION',
  'READY',
  'SCHEDULED',
  'IN_PROGRESS',
  'ONGOING',
  'VALUATION',
  'COMPLETED',
  'RESULT_PROCESSING',
  'PUBLISHED',
  'RESULT_PUBLISHED',
  'CLOSED',
  'ARCHIVED',
  'CANCELLED',
] as const;

export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const ELIGIBILITY_STATUSES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'CONDITIONALLY_ELIGIBLE', 'CONDONED', 'WITHHELD'] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const MARK_STATUSES = ['PRESENT', 'ABSENT', 'MALPRACTICE', 'MPC', 'WITHHELD', 'SPECIAL_PERMISSION'] as const;
export type MarkStatus = (typeof MARK_STATUSES)[number];

export const MARKS_SHEET_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED', 'RELEASED'] as const;
export type MarksSheetStatus = (typeof MARKS_SHEET_STATUSES)[number];

export const INVIGILATION_ROLES = [
  'CONTROLLER_OF_EXAMINATIONS',
  'CHIEF_SUPERINTENDENT',
  'DEPUTY_CHIEF_SUPERINTENDENT_INTERNAL',
  'DEPUTY_CHIEF_SUPERINTENDENT_EXTERNAL',
  'EXAM_COORDINATOR',
  'ROOM_SUPERINTENDENT',
  'RELIEVING_SUPERINTENDENT',
  'SQUAD_MEMBER',
  'SQUAD_CHAIRMAN',
  'OBSERVER',
  'INTERNAL_EXAMINER',
  'EXTERNAL_EXAMINER',
  'VALUER',
  'MODERATOR',
  'SCRUTINIZER',
  'QUESTION_PAPER_SETTER',
  'SUPPORT_STAFF',
  'CHIEF',
  'INVIGILATOR',
  'RELIEVER',
  'SQUAD',
  'OTHER',
] as const;
export type InvigilationRole = (typeof INVIGILATION_ROLES)[number];

export const RESULT_STATUSES = ['PASS', 'FAIL', 'WITHHELD', 'MPC', 'ABSENT', 'INCOMPLETE'] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const SUBJECT_RESULT_STATUSES = ['PASS', 'FAIL', 'ABSENT', 'WITHHELD', 'MALPRACTICE', 'INCOMPLETE'] as const;
export type SubjectResultStatus = (typeof SUBJECT_RESULT_STATUSES)[number];

export const REVALUATION_TYPES = ['RETOTALING', 'REVALUATION', 'PHOTOCOPY'] as const;
export type RevaluationType = (typeof REVALUATION_TYPES)[number];

export const REVALUATION_STATUSES = ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'] as const;
export type RevaluationStatus = (typeof REVALUATION_STATUSES)[number];

export const MARKS_SOURCES = ['INSTITUTION', 'UNIVERSITY_IMPORT', 'MANUAL_VERIFIED'] as const;
export type MarksSource = (typeof MARKS_SOURCES)[number];

export type CieComponent = {
  kind: 'IA' | 'ASSIGNMENT' | 'QUIZ' | 'INTERNAL_ASSESSMENT';
  label: string;
  weight: number;
  aggregation?: 'SUM' | 'BEST_OF' | 'AVERAGE';
  sourceIds?: number[];
};

export type GradeBand = {
  min: number;
  max: number;
  grade: string;
  gradePoints: number;
};

export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { min: 90, max: 100, grade: 'O', gradePoints: 10 },
  { min: 80, max: 89.99, grade: 'A+', gradePoints: 9 },
  { min: 70, max: 79.99, grade: 'A', gradePoints: 8 },
  { min: 60, max: 69.99, grade: 'B+', gradePoints: 7 },
  { min: 55, max: 59.99, grade: 'B', gradePoints: 6 },
  { min: 50, max: 54.99, grade: 'C', gradePoints: 5 },
  { min: 40, max: 49.99, grade: 'P', gradePoints: 4 },
  { min: 0, max: 39.99, grade: 'F', gradePoints: 0 },
];

export const EXAM_PERMISSIONS = [
  'exam.create',
  'exam.schedule',
  'exam.eligibility',
  'exam.registration',
  'exam.rooms',
  'exam.invigilation',
  'exam.questionPapers',
  'exam.attendance',
  'exam.malpractice',
  'exam.custody',
  'exam.valuation',
  'exam.marks.verify',
  'exam.result.process',
  'exam.result.publish',
  'exam.documents',
  'exam.finance',
  'exam.reports',
] as const;

export type ExamPermission = (typeof EXAM_PERMISSIONS)[number];

export const EXAMINATION_GOVERNANCE_TYPES = ['VTU_AFFILIATED', 'AUTONOMOUS'] as const;
export type ExaminationGovernanceType = (typeof EXAMINATION_GOVERNANCE_TYPES)[number];

export const EXAMINATION_CAPABILITY_OWNERSHIPS = ['INSTITUTIONAL', 'UNIVERSITY', 'SHARED', 'OPTIONAL'] as const;
export type ExaminationCapabilityOwnership = (typeof EXAMINATION_CAPABILITY_OWNERSHIPS)[number];

export type ExaminationCapabilityKey =
  | 'CIE_MANAGEMENT'
  | 'EXAM_REGISTRATION'
  | 'EXAM_ELIGIBILITY'
  | 'SEE_TIMETABLE'
  | 'HALL_TICKET'
  | 'CENTRE_MANAGEMENT'
  | 'SEATING'
  | 'INVIGILATION'
  | 'QUESTION_PAPER_SETTING'
  | 'QUESTION_PAPER_CUSTODY'
  | 'FORM_A'
  | 'MALPRACTICE'
  | 'ANSWER_BOOK_INVENTORY'
  | 'SCRIPT_CUSTODY'
  | 'PRACTICAL_EXAM'
  | 'MARKS_ENTRY'
  | 'VALUATION'
  | 'RESULT_PROCESSING'
  | 'REVALUATION'
  | 'GRADE_CARD'
  | 'REMUNERATION'
  | 'REPORTS';
