export const PLAN_STATUSES = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const ITEM_STATUSES = ['PLANNED', 'DELIVERED', 'ASSESSED', 'COMPLETED', 'CANCELLED'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ORIGIN_TYPES = [
  'GAP_ANALYSIS',
  'FACULTY_ENRICHMENT',
  'INDUSTRY_REQUIREMENT',
  'EMERGING_TECHNOLOGY',
  'ADVANCED_LEARNING',
  'PRACTICAL_EXPOSURE',
  'INTERDISCIPLINARY_ENRICHMENT',
] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const ORIGIN_LABELS: Record<OriginType, string> = {
  GAP_ANALYSIS: 'Gap Analysis',
  FACULTY_ENRICHMENT: 'Faculty Enrichment',
  INDUSTRY_REQUIREMENT: 'Industry Requirement',
  EMERGING_TECHNOLOGY: 'Emerging Technology',
  ADVANCED_LEARNING: 'Advanced Learning',
  PRACTICAL_EXPOSURE: 'Practical Exposure',
  INTERDISCIPLINARY_ENRICHMENT: 'Interdisciplinary Enrichment',
};

export const DELIVERY_METHODS = [
  'ADDITIONAL_LECTURE',
  'HANDS_ON_SESSION',
  'DEMONSTRATION',
  'CASE_STUDY',
  'TUTORIAL',
  'SEMINAR',
  'WORKSHOP',
  'INDUSTRY_EXPERT_SESSION',
  'GUEST_LECTURE',
  'STUDENT_PRESENTATION',
  'GROUP_DISCUSSION',
  'MINI_PROJECT',
  'SELF_LEARNING',
  'INDUSTRIAL_VISIT',
  'HACKATHON',
  'CODING_EXERCISE',
  'MOOC_NPTEL',
  'OTHER',
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const ASSESSMENT_TYPES = [
  'NONE',
  'QUIZ',
  'ASSIGNMENT',
  'ACTIVITY',
  'PRESENTATION',
  'MINI_PROJECT',
  'CASE_ANALYSIS',
  'LAB_EXERCISE',
  'VIVA',
  'REFLECTION',
  'OTHER',
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const EVIDENCE_TYPES = [
  'TEACHING_MATERIAL',
  'ATTENDANCE',
  'PHOTOS',
  'SCREENSHOTS',
  'PPT',
  'CASE_STUDY',
  'LAB_SHEET',
  'STUDENT_WORK',
  'QUIZ_RESULT',
  'ASSIGNMENT_RESULT',
  'FEEDBACK',
  'RESOURCE_PERSON_PROFILE',
  'CERTIFICATE',
  'REPORT',
  'URL',
  'OTHER',
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  TEACHING_MATERIAL: 'Teaching Material',
  ATTENDANCE: 'Attendance',
  PHOTOS: 'Photos',
  SCREENSHOTS: 'Screenshots',
  PPT: 'PPT',
  CASE_STUDY: 'Case Study',
  LAB_SHEET: 'Lab Sheet',
  STUDENT_WORK: 'Student Work',
  QUIZ_RESULT: 'Quiz Result',
  ASSIGNMENT_RESULT: 'Assignment Result',
  FEEDBACK: 'Feedback',
  RESOURCE_PERSON_PROFILE: 'Resource Person Profile',
  CERTIFICATE: 'Certificate',
  REPORT: 'Report',
  URL: 'URL',
  OTHER: 'Other',
};

export const REVIEW_MARKED_STATUSES = new Set([
  'NEEDS_REVIEW',
  'ACADEMIC_ANALYSIS',
  'SOURCE_MISSING',
  'REVIEW_REQUIRED',
]);

export function isReviewMarked(status: string | null | undefined) {
  if (!status) return false;
  const u = String(status).toUpperCase();
  return u === 'NEEDS_REVIEW' || u === 'SOURCE_MISSING' || u === 'REVIEW_REQUIRED';
}

export function friendlyOrigin(type: string | null | undefined) {
  if (!type) return 'Other';
  return ORIGIN_LABELS[type as OriginType] || String(type).replace(/_/g, ' ');
}

export function friendlyDelivery(method: string | null | undefined) {
  if (!method) return null;
  return String(method).replace(/_/g, ' ');
}

export function normalizeOrigin(raw: string | null | undefined): string {
  if (!raw) return 'FACULTY_ENRICHMENT';
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((ORIGIN_TYPES as readonly string[]).includes(cleaned)) return cleaned;
  return cleaned || 'FACULTY_ENRICHMENT';
}

export function normalizeDelivery(raw: string | null | undefined): string {
  if (!raw) return 'OTHER';
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((DELIVERY_METHODS as readonly string[]).includes(cleaned)) return cleaned;
  return cleaned || 'OTHER';
}

export function normalizeAssessment(raw: string | null | undefined): string {
  if (!raw) return 'NONE';
  const cleaned = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((ASSESSMENT_TYPES as readonly string[]).includes(cleaned)) return cleaned;
  return cleaned || 'NONE';
}
