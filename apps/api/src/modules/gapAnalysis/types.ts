export const ANALYSIS_STATUSES = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const ITEM_STATUSES = [
  'OPEN',
  'ACTION_PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'NOT_APPLICABLE',
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ACTION_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const APPLICABILITY = ['APPLICABLE', 'NOT_APPLICABLE'] as const;
export type Applicability = (typeof APPLICABILITY)[number];

export const COVERAGE_LEVELS = [0, 1, 2, 3, 4] as const;
export type CoverageLevel = (typeof COVERAGE_LEVELS)[number];

export const COVERAGE_LABELS: Record<CoverageLevel, string> = {
  0: 'Not Covered',
  1: 'Introduced',
  2: 'Partially Covered',
  3: 'Adequately Covered',
  4: 'Extensively Covered',
};

export const ACTION_TYPES = [
  'ADD_ON_TOPIC',
  'HANDS_ON_LAB',
  'WORKSHOP',
  'GUEST_LECTURE',
  'INDUSTRY_EXPERT_SESSION',
  'CASE_STUDY',
  'MINI_PROJECT',
  'ASSIGNMENT',
  'TUTORIAL',
  'SEMINAR',
  'CERTIFICATION',
  'NPTEL_MOOC',
  'INDUSTRIAL_VISIT',
  'HACKATHON',
  'CODING_EXERCISE',
  'ADDITIONAL_LEARNING_MATERIAL',
  'QUIZ_ASSESSMENT',
  'SELF_LEARNING',
  'OTHER',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  ADD_ON_TOPIC: 'Add-on Topic',
  HANDS_ON_LAB: 'Hands-on Lab',
  WORKSHOP: 'Workshop',
  GUEST_LECTURE: 'Guest Lecture',
  INDUSTRY_EXPERT_SESSION: 'Industry Expert Session',
  CASE_STUDY: 'Case Study',
  MINI_PROJECT: 'Mini Project',
  ASSIGNMENT: 'Assignment',
  TUTORIAL: 'Tutorial',
  SEMINAR: 'Seminar',
  CERTIFICATION: 'Certification',
  NPTEL_MOOC: 'NPTEL / MOOC',
  INDUSTRIAL_VISIT: 'Industrial Visit',
  HACKATHON: 'Hackathon',
  CODING_EXERCISE: 'Coding Exercise',
  ADDITIONAL_LEARNING_MATERIAL: 'Additional Learning Material',
  QUIZ_ASSESSMENT: 'Quiz / Assessment',
  SELF_LEARNING: 'Self Learning',
  OTHER: 'Other',
};

export const EVIDENCE_TYPES = [
  'ATTENDANCE',
  'CIRCULAR',
  'PHOTOS',
  'PPT_MATERIAL',
  'LAB_SHEET',
  'ASSIGNMENT',
  'QUIZ_RESULT',
  'STUDENT_FEEDBACK',
  'RESOURCE_PERSON_DETAILS',
  'CERTIFICATE',
  'EVENT_REPORT',
  'LINK',
  'OTHER_DOCUMENT',
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  ATTENDANCE: 'Attendance',
  CIRCULAR: 'Circular',
  PHOTOS: 'Photos',
  PPT_MATERIAL: 'PPT / Material',
  LAB_SHEET: 'Lab Sheet',
  ASSIGNMENT: 'Assignment',
  QUIZ_RESULT: 'Quiz Result',
  STUDENT_FEEDBACK: 'Student Feedback',
  RESOURCE_PERSON_DETAILS: 'Resource Person Details',
  CERTIFICATE: 'Certificate',
  EVENT_REPORT: 'Event Report',
  LINK: 'Link',
  OTHER_DOCUMENT: 'Other Document',
};

export const REVIEW_MARKED_STATUSES = new Set([
  'NEEDS_REVIEW',
  'ACADEMIC_ANALYSIS',
  'SOURCE_MISSING',
  'REVIEW_REQUIRED',
  'OFFICIAL_DATA_PENDING',
]);

export function isReviewMarked(status: string | null | undefined) {
  if (!status) return false;
  return REVIEW_MARKED_STATUSES.has(String(status).toUpperCase());
}

export function friendlyActionType(type: string) {
  return ACTION_TYPE_LABELS[type as ActionType] || type.replace(/_/g, ' ');
}

export function friendlyCoverage(level: number | null | undefined) {
  if (level == null || !Number.isFinite(level)) return null;
  const n = Number(level) as CoverageLevel;
  return COVERAGE_LABELS[n] ?? `Level ${level}`;
}

export function normalizeActionType(raw: string | null | undefined): string {
  if (!raw) return 'OTHER';
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((ACTION_TYPES as readonly string[]).includes(cleaned)) return cleaned;
  // Map workbook friendly labels
  const alias: Record<string, string> = {
    HANDS_ON_LAB: 'HANDS_ON_LAB',
    CASE_STUDY: 'CASE_STUDY',
    QUIZ_ASSESSMENT: 'QUIZ_ASSESSMENT',
    WORKSHOP: 'WORKSHOP',
    GUEST_LECTURE: 'GUEST_LECTURE',
    ASSIGNMENT: 'ASSIGNMENT',
    MINI_PROJECT: 'MINI_PROJECT',
    SEMINAR: 'SEMINAR',
    TUTORIAL: 'TUTORIAL',
    SELF_LEARNING: 'SELF_LEARNING',
  };
  return alias[cleaned] || cleaned || 'OTHER';
}
