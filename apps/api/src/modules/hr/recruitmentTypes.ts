import { z } from 'zod';

export const REQUISITION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'DEPARTMENT_APPROVED',
  'HR_REVIEW',
  'APPROVED',
  'OPENED',
  'CLOSED',
  'REJECTED',
  'CANCELLED',
] as const;
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

export const REQUISITION_TRANSITIONS: Record<RequisitionStatus, RequisitionStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['DEPARTMENT_APPROVED', 'REJECTED', 'CANCELLED'],
  DEPARTMENT_APPROVED: ['HR_REVIEW', 'REJECTED', 'CANCELLED'],
  HR_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['OPENED', 'CANCELLED'],
  OPENED: ['CLOSED', 'CANCELLED'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};

export const OPENING_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'PAUSED',
  'CLOSED',
  'FILLED',
  'CANCELLED',
] as const;
export type OpeningStatus = (typeof OPENING_STATUSES)[number];

export const OPENING_TRANSITIONS: Record<OpeningStatus, OpeningStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['PAUSED', 'CLOSED', 'FILLED', 'CANCELLED'],
  PAUSED: ['PUBLISHED', 'CLOSED', 'CANCELLED'],
  CLOSED: [],
  FILLED: [],
  CANCELLED: [],
};

export const APPLICATION_STATUSES = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'OFFERED',
  'ACCEPTED',
  'PRE_JOINING',
  'JOINED',
  'REJECTED',
  'WITHDRAWN',
  'OFFER_DECLINED',
  'NO_SHOW',
  'CANCELLED',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ['SCREENING', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  SCREENING: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  SHORTLISTED: ['INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  INTERVIEW: ['SELECTED', 'REJECTED', 'WITHDRAWN', 'NO_SHOW', 'CANCELLED'],
  SELECTED: ['OFFERED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  OFFERED: ['ACCEPTED', 'OFFER_DECLINED', 'REJECTED', 'WITHDRAWN', 'CANCELLED'],
  ACCEPTED: ['PRE_JOINING', 'JOINED', 'NO_SHOW', 'WITHDRAWN', 'CANCELLED'],
  PRE_JOINING: ['JOINED', 'NO_SHOW', 'WITHDRAWN', 'CANCELLED'],
  JOINED: [],
  REJECTED: [],
  WITHDRAWN: [],
  OFFER_DECLINED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

export const OFFER_STATUSES = [
  'DRAFT',
  'APPROVAL_PENDING',
  'APPROVED',
  'ISSUED',
  'ACCEPTED',
  'REJECTED',
  'DECLINED',
  'EXPIRED',
  'WITHDRAWN',
  'SUPERSEDED',
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: ['APPROVAL_PENDING', 'WITHDRAWN'],
  APPROVAL_PENDING: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
  APPROVED: ['ISSUED', 'WITHDRAWN'],
  ISSUED: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN', 'SUPERSEDED'],
  ACCEPTED: ['SUPERSEDED'],
  REJECTED: [],
  DECLINED: [],
  EXPIRED: ['SUPERSEDED'],
  WITHDRAWN: [],
  SUPERSEDED: [],
};

export const CANDIDATE_SOURCES = [
  'CAREER_PORTAL',
  'EMPLOYEE_REFERRAL',
  'JOB_PORTAL',
  'CAMPUS',
  'AGENCY',
  'WALK_IN',
  'INTERNAL',
  'OTHER',
] as const;

export const DOC_TYPES = [
  'RESUME',
  'CERTIFICATE',
  'EXPERIENCE',
  'IDENTITY',
  'PORTFOLIO',
  'OTHER',
  'OFFER_LETTER',
] as const;

export const INTERVIEW_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'RESCHEDULED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export const PREJOINING_TASK_STATUSES = [
  'PENDING',
  'SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'WAIVED',
  'NOT_APPLICABLE',
] as const;

export const BGV_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'CLEAR',
  'ADVERSE',
  'WAIVED',
] as const;

export const POSITION_TYPES = ['NEW', 'REPLACEMENT'] as const;

export const createRequisitionSchema = z.object({
  departmentId: z.number().int().positive(),
  designationId: z.number().int().positive(),
  employmentTypeId: z.number().int().positive(),
  requestedHeadcount: z.number().int().positive().default(1),
  reason: z.string().max(4000).nullable().optional(),
  positionType: z.enum(POSITION_TYPES).default('NEW'),
  replacementEmployeeId: z.number().int().positive().nullable().optional(),
  budgetReference: z.string().max(128).nullable().optional(),
  desiredJoiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  code: z.string().trim().min(2).max(48).optional(),
});

export const updateRequisitionSchema = createRequisitionSchema.partial();

export const requisitionDecisionSchema = z.object({
  reason: z.string().max(2000).optional(),
  approvedHeadcount: z.number().int().positive().optional(),
});

export const createOpeningSchema = z.object({
  requisitionId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2).max(200),
  departmentId: z.number().int().positive(),
  designationId: z.number().int().positive(),
  employmentTypeId: z.number().int().positive(),
  headcount: z.number().int().positive().default(1),
  location: z.string().max(200).nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  responsibilities: z.string().max(20000).nullable().optional(),
  qualification: z.string().max(8000).nullable().optional(),
  experience: z.string().max(4000).nullable().optional(),
  skills: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  applicationStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  applicationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  jobCategory: z.string().max(64).nullable().optional(),
  code: z.string().trim().min(2).max(48).optional(),
  rounds: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        sequence: z.number().int().positive().optional(),
        roundType: z.string().max(32).default('TECHNICAL'),
        required: z.boolean().optional(),
        evaluationTemplate: z.unknown().optional(),
      }),
    )
    .optional(),
});

export const updateOpeningSchema = createOpeningSchema.partial().omit({ rounds: true });

export const createCandidateSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().email().max(255),
  phone: z.string().trim().max(32).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  qualificationSummary: z.string().max(4000).nullable().optional(),
  experienceSummary: z.string().max(4000).nullable().optional(),
  source: z.enum(CANDIDATE_SOURCES).default('CAREER_PORTAL'),
  referrerEmployeeId: z.number().int().positive().nullable().optional(),
  linkedEmployeeId: z.number().int().positive().nullable().optional(),
  consent: z.boolean().optional(),
});

export const applySchema = z.object({
  openingId: z.number().int().positive(),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().email().max(255),
  phone: z.string().trim().max(32).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  qualificationSummary: z.string().max(4000).nullable().optional(),
  experienceSummary: z.string().max(4000).nullable().optional(),
  source: z.enum(CANDIDATE_SOURCES).default('CAREER_PORTAL'),
  coverLetter: z.string().max(8000).nullable().optional(),
  salaryExpectation: z.number().nonnegative().nullable().optional(),
  consent: z.boolean().default(true),
  resumeText: z.string().max(100000).nullable().optional(),
  resumeFileName: z.string().max(255).nullable().optional(),
});

export const screenApplicationSchema = z.object({
  decision: z.enum(['SHORTLIST', 'REJECT', 'HOLD']),
  notes: z.string().max(4000).nullable().optional(),
});

export const shortlistSchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
});

export const selectCandidateSchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
});

export const scheduleInterviewSchema = z.object({
  roundId: z.number().int().positive(),
  scheduledAt: z.string().min(8),
  timezone: z.string().max(64).optional(),
  mode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).default('IN_PERSON'),
  locationOrLink: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  panelEmployeeIds: z.array(z.number().int().positive()).default([]),
  externalPanel: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        email: z.string().email().optional(),
      }),
    )
    .optional(),
});

export const evaluateInterviewSchema = z.object({
  scores: z.record(z.union([z.number(), z.string()])).optional(),
  overallScore: z.number().min(0).max(100).nullable().optional(),
  comments: z.string().max(8000).nullable().optional(),
  privateNotes: z.string().max(8000).nullable().optional(),
  recommendation: z.enum(['ADVANCE', 'HOLD', 'REJECT', 'STRONG_HIRE']),
});

export const createOfferSchema = z.object({
  applicationId: z.number().int().positive(),
  designationId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  employmentTypeId: z.number().int().positive().optional(),
  proposedJoiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  offerDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  compensationSummary: z.string().max(4000).nullable().optional(),
  compensation: z.record(z.unknown()).nullable().optional(),
  terms: z.string().max(20000).nullable().optional(),
});

export const offerDecisionSchema = z.object({
  reason: z.string().max(2000).optional(),
  acceptanceMethod: z.enum(['PORTAL', 'EMAIL', 'IN_PERSON', 'OTHER']).optional(),
});

export const updatePrejoiningTaskSchema = z.object({
  status: z.enum(PREJOINING_TASK_STATUSES).optional(),
  notes: z.string().max(2000).nullable().optional(),
  bgvStatus: z.enum(BGV_STATUSES).nullable().optional(),
  documentId: z.number().int().positive().nullable().optional(),
});

export const completeJoiningSchema = z.object({
  employeeCategory: z.enum(['FACULTY', 'NON_TEACHING', 'MANAGEMENT', 'CONTRACTUAL', 'OTHER']).optional(),
  markJoined: z.boolean().optional(),
  authMode: z.enum(['LINK_EXISTING', 'CREATE_LOGIN', 'NO_LOGIN']).optional(),
});

export const uploadDocumentSchema = z.object({
  candidateId: z.number().int().positive(),
  applicationId: z.number().int().positive().nullable().optional(),
  docType: z.enum(DOC_TYPES),
  fileName: z.string().max(255).nullable().optional(),
  contentType: z.string().max(128).nullable().optional(),
  bodyText: z.string().max(500000).nullable().optional(),
  contentBase64: z.string().max(2000000).nullable().optional(),
  fields: z.record(z.unknown()).nullable().optional(),
  isSensitive: z.boolean().optional(),
});

export type Row = Record<string, unknown>;
