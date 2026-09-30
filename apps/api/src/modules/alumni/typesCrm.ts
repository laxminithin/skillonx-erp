/**
 * Alumni Relationship CRM (C2) — shared types and Zod schemas.
 * No scoring / AI / campaign orchestration.
 */
import { z } from 'zod';

export const RELATIONSHIP_STAGES = [
  'IDENTIFIED',
  'REACHABLE',
  'CONTACTED',
  'RESPONDED',
  'ENGAGED',
  'OPPORTUNITY_IDENTIFIED',
  'ACTION_IN_PROGRESS',
  'OUTCOME_ACHIEVED',
  'REPEAT_ENGAGEMENT',
] as const;
export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number];

export const STAGE_RANK: Record<RelationshipStage, number> = {
  IDENTIFIED: 0,
  REACHABLE: 1,
  CONTACTED: 2,
  RESPONDED: 3,
  ENGAGED: 4,
  OPPORTUNITY_IDENTIFIED: 5,
  ACTION_IN_PROGRESS: 6,
  OUTCOME_ACHIEVED: 7,
  REPEAT_ENGAGEMENT: 8,
};

export const RELATIONSHIP_STATUSES = ['ACTIVE', 'DORMANT', 'CLOSED', 'ON_HOLD'] as const;
export const OWNER_TYPES = [
  'ALUMNI_OFFICER',
  'TP_OFFICER',
  'FACULTY',
  'HOD',
  'PRINCIPAL_TEAM',
  'OTHER',
] as const;

export const INTERACTION_TYPES = [
  'PHONE_CALL',
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'IN_PERSON',
  'VIDEO_CALL',
  'EVENT',
  'MENTORING',
  'RECRUITMENT',
  'INTERNSHIP',
  'PROJECT',
  'EXPERT_SESSION',
  'BOS_ADVISORY',
  'RESEARCH_COLLABORATION',
  'STARTUP_SUPPORT',
  'CONTRIBUTION',
  'RECOGNITION',
  'PROFILE_UPDATE',
  'OTHER',
] as const;

export const CONTACT_OUTCOMES = [
  'CONTACTED',
  'NO_RESPONSE',
  'RESPONDED',
  'DECLINED',
  'WRONG_CONTACT',
  'FOLLOW_UP',
  'COMPLETED',
] as const;

export const CAPTURE_MODES = ['MANUAL', 'SYSTEM_PROJECTED', 'INTEGRATED'] as const;

export const FOLLOWUP_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as const;
export const FOLLOWUP_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export const CRM_OPPORTUNITY_TYPES = [
  'MENTORSHIP',
  'RECRUITMENT',
  'INTERNSHIP',
  'EXPERT_SESSION',
  'PROJECT_MENTORING',
  'INDUSTRY_PROJECT',
  'RESEARCH_COLLABORATION',
  'BOS_ADVISORY',
  'STARTUP_SUPPORT',
  'INDUSTRIAL_VISIT',
  'MOU_COLLABORATION',
  'CONTRIBUTION',
  'OTHER',
] as const;

export const CRM_OPPORTUNITY_STATUSES = [
  'IDENTIFIED',
  'QUALIFYING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
] as const;

export const OUTCOME_TYPES = [
  'STUDENTS_MENTORED',
  'INTERNSHIPS_ENABLED',
  'PLACEMENTS_SUPPORTED',
  'JOBS_REFERRED',
  'EXPERT_SESSIONS_DELIVERED',
  'PROJECTS_SUPPORTED',
  'RESEARCH_COLLABORATIONS',
  'INDUSTRY_VISITS',
  'STARTUP_SUPPORT',
  'BOS_PARTICIPATION',
  'FINANCIAL_CONTRIBUTION',
  'NON_FINANCIAL_CONTRIBUTION',
  'OTHER',
] as const;

export const OUTCOME_VERIFICATION = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;

export const NOTE_TYPES = [
  'GENERAL_RELATIONSHIP_NOTE',
  'FOLLOW_UP_NOTE',
  'OPPORTUNITY_NOTE',
  'INTERNAL_NOTE',
] as const;

export const NOTE_VISIBILITY = ['INSTITUTIONAL', 'INTERNAL', 'ALUMNI_VISIBLE'] as const;

export const interactionCreateSchema = z.object({
  interactionType: z.enum(INTERACTION_TYPES),
  channel: z.string().trim().max(32).optional().nullable(),
  direction: z.enum(['OUTBOUND', 'INBOUND', 'INTERNAL']).optional(),
  purpose: z.string().trim().max(255).optional().nullable(),
  summary: z.string().trim().max(4000).optional().nullable(),
  outcomeStatus: z.enum(CONTACT_OUTCOMES).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }).or(z.string().min(8).max(40)),
  participantFacultyIds: z.array(z.number().int().positive()).max(20).optional(),
  followUpRequired: z.boolean().optional(),
  nextActionAt: z.string().optional().nullable(),
  nextActionSummary: z.string().trim().max(500).optional().nullable(),
  relatedOpportunityId: z.number().int().positive().optional().nullable(),
  visibility: z.enum(['INSTITUTIONAL', 'ALUMNI_VISIBLE', 'INTERNAL']).optional(),
  evidenceReference: z.string().trim().max(512).optional().nullable(),
  isContactAttempt: z.boolean().optional(),
  isMeaningfulEngagement: z.boolean().optional(),
  /** INTEGRATED only when a real integration is wired — default MANUAL. */
  captureMode: z.enum(['MANUAL', 'INTEGRATED']).optional(),
}).strict();

export const interactionPatchSchema = interactionCreateSchema.partial().strict();

export const followupCreateSchema = z.object({
  reason: z.string().trim().min(1).max(255),
  dueDate: z.string().min(8).max(16),
  priority: z.enum(FOLLOWUP_PRIORITIES).optional(),
  notes: z.string().trim().max(4000).optional().nullable(),
  ownerFacultyId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  interactionId: z.number().int().positive().optional().nullable(),
  opportunityId: z.number().int().positive().optional().nullable(),
}).strict();

export const followupPatchSchema = z.object({
  reason: z.string().trim().min(1).max(255).optional(),
  dueDate: z.string().min(8).max(16).optional(),
  priority: z.enum(FOLLOWUP_PRIORITIES).optional(),
  notes: z.string().trim().max(4000).optional().nullable(),
  ownerFacultyId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  status: z.enum(FOLLOWUP_STATUSES).optional(),
}).strict();

export const opportunityCreateSchema = z.object({
  opportunityType: z.enum(CRM_OPPORTUNITY_TYPES),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4000).optional().nullable(),
  ownerFacultyId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  expectedOutcome: z.string().trim().max(255).optional().nullable(),
  targetDate: z.string().min(8).max(16).optional().nullable(),
  sourceInteractionId: z.number().int().positive().optional().nullable(),
  status: z.enum(CRM_OPPORTUNITY_STATUSES).optional(),
}).strict();

export const opportunityPatchSchema = opportunityCreateSchema.partial().extend({
  status: z.enum(CRM_OPPORTUNITY_STATUSES).optional(),
}).strict();

export const outcomeCreateSchema = z.object({
  outcomeType: z.enum(OUTCOME_TYPES),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4000).optional().nullable(),
  quantity: z.number().int().nonnegative().optional().nullable(),
  beneficiaryType: z.enum(['STUDENT', 'DEPARTMENT', 'INSTITUTION', 'OTHER']).optional().nullable(),
  beneficiaryRefs: z.array(z.record(z.string(), z.unknown())).max(50).optional().nullable(),
  sourceType: z.string().trim().max(32).optional(),
  sourceReference: z.string().trim().max(255).optional().nullable(),
  evidenceReference: z.string().trim().max(512).optional().nullable(),
  outcomeDate: z.string().min(8).max(16),
  interactionId: z.number().int().positive().optional().nullable(),
}).strict();

export const outcomeVerifySchema = z.object({
  action: z.enum(['VERIFY', 'REJECT']),
  notes: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const noteCreateSchema = z.object({
  noteType: z.enum(NOTE_TYPES),
  body: z.string().trim().min(1).max(8000),
  visibility: z.enum(NOTE_VISIBILITY).optional(),
  followupId: z.number().int().positive().optional().nullable(),
  opportunityId: z.number().int().positive().optional().nullable(),
}).strict();

export const ownershipReassignSchema = z.object({
  ownerFacultyId: z.number().int().positive().nullable(),
  ownerType: z.enum(OWNER_TYPES).nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  reason: z.string().trim().min(3).max(2000),
  collaboratorFacultyIds: z.array(z.number().int().positive()).max(20).optional(),
}).strict();

export const stageTransitionSchema = z.object({
  toStage: z.enum(RELATIONSHIP_STAGES),
  reason: z.string().trim().min(3).max(255),
}).strict();

export type TimelineItem = {
  id: string;
  timestamp: string;
  interactionType: string;
  summary: string;
  sourceType: string;
  sourceReference: string | null;
  captureMode: (typeof CAPTURE_MODES)[number];
  visibility: string;
  evidence: string | null;
  actorName: string | null;
  outcomeStatus: string | null;
  drillPath: string | null;
  isContactAttempt: boolean;
};
