/**
 * Alumni Engagement & Campaign Orchestration (C4) — types & Zod schemas.
 * Orchestration only — no fake channel delivery telemetry.
 */
import { z } from 'zod';

export const ENGAGEMENT_CATEGORIES = [
  'NETWORKING',
  'RECOGNITION',
  'MENTORSHIP',
  'RECRUITMENT',
  'INTERNSHIP',
  'EXPERT_SESSION',
  'LEARNING',
  'CAREER',
  'ENTREPRENEURSHIP',
  'RESEARCH',
  'INDUSTRY_CONNECT',
  'INSTITUTION_UPDATE',
  'REUNION',
  'COMMUNITY',
  'DATA_REFRESH',
  'CONTRIBUTION',
  'OTHER',
] as const;
export type EngagementCategory = (typeof ENGAGEMENT_CATEGORIES)[number];

export const PROGRAM_STATUSES = [
  'DRAFT',
  'PLANNED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
] as const;

export const CAMPAIGN_STATUSES = [
  'DRAFT',
  'READY_FOR_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'PAUSED',
  'CANCELLED',
] as const;

export const VALUE_EXCHANGE = ['VALUE_TO_ALUMNI', 'VALUE_TO_INSTITUTION', 'MUTUAL_VALUE'] as const;

export const CHANNEL_TYPES = [
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'PHONE',
  'IN_PERSON',
  'PORTAL_NOTIFICATION',
  'MANUAL',
  'OTHER',
] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const CHANNEL_CAPABILITIES = ['MANUAL_ONLY', 'CONFIGURED', 'UNAVAILABLE'] as const;
export type ChannelCapability = (typeof CHANNEL_CAPABILITIES)[number];

export const ELIGIBILITY_STATES = ['ELIGIBLE', 'SUPPRESSED', 'REQUIRES_REVIEW'] as const;
export type EligibilityState = (typeof ELIGIBILITY_STATES)[number];

export const FUNNEL_STAGES = [
  'TARGETED',
  'ELIGIBLE',
  'CONTACTED',
  'RESPONDED',
  'INTERESTED',
  'OPPORTUNITY_CREATED',
  'ACTION_IN_PROGRESS',
  'OUTCOME_VERIFIED',
] as const;

export const CONTACT_STATUSES = [
  'NOT_CONTACTED',
  'CONTACTED',
  'NO_RESPONSE',
  'RESPONDED',
  'INTERESTED',
  'DECLINED',
  'WRONG_CONTACT',
  'FOLLOW_UP',
] as const;

export const MANUAL_OUTCOMES = [
  'NO_ANSWER',
  'RESPONDED',
  'INTERESTED',
  'NOT_INTERESTED',
  'FOLLOW_UP',
  'WRONG_CONTACT',
] as const;

export const AUDIENCE_SOURCE_TYPES = [
  'SAVED_SEGMENT',
  'DYNAMIC_RULES',
  'EXPLICIT_IDS',
  'FILTERS',
  'EVENT_PARTICIPANTS',
  'RELATIONSHIP_CONTEXT',
] as const;

export const SAFE_TEMPLATE_VARS = [
  'alumni_name',
  'programme',
  'graduation_year',
  'institution_name',
  'event_name',
  'response_link',
  'department',
  'campaign_name',
  'program_name',
] as const;

export const RESPONSE_ACTION_TYPES = [
  'MENTORSHIP_INTEREST',
  'RECRUITMENT_SUPPORT',
  'EVENT_RSVP',
  'EXPERT_SESSION_INTEREST',
  'RESEARCH_INTEREST',
  'DATA_REFRESH',
  'GENERIC_YES_NO',
  'PREFERENCE_UPDATE',
] as const;

export const audienceSourceSchema = z.object({
  type: z.enum(AUDIENCE_SOURCE_TYPES),
  savedSegmentId: z.number().int().positive().optional().nullable(),
  ruleDefinition: z.record(z.string(), z.unknown()).optional().nullable(),
  preset: z.string().optional().nullable(),
  dimension: z.string().optional().nullable(),
  alumniProfileIds: z.array(z.number().int().positive()).max(500).optional().nullable(),
  filters: z
    .object({
      graduationYear: z.number().int().optional().nullable(),
      graduationYearMin: z.number().int().optional().nullable(),
      graduationYearMax: z.number().int().optional().nullable(),
      departmentId: z.number().int().positive().optional().nullable(),
      programmeId: z.number().int().positive().optional().nullable(),
      batchLabel: z.string().max(64).optional().nullable(),
    })
    .optional()
    .nullable(),
  eventId: z.number().int().positive().optional().nullable(),
  opportunityId: z.number().int().positive().optional().nullable(),
}).strict();

export const programCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  objective: z.string().trim().max(4000).optional().nullable(),
  category: z.enum(ENGAGEMENT_CATEGORIES).optional(),
  academicYear: z.string().trim().max(32).optional().nullable(),
  ownerFacultyId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  scope: z.enum(['INSTITUTION', 'DEPARTMENT']).optional(),
  startDate: z.string().min(8).max(16).optional().nullable(),
  endDate: z.string().min(8).max(16).optional().nullable(),
  status: z.enum(PROGRAM_STATUSES).optional(),
  targetDefinition: z.record(z.string(), z.unknown()).optional().nullable(),
  successDefinition: z.string().trim().max(4000).optional().nullable(),
  valueExchange: z.enum(VALUE_EXCHANGE).optional(),
  valueToAlumni: z.string().trim().max(4000).optional().nullable(),
  valueToInstitution: z.string().trim().max(4000).optional().nullable(),
}).strict();

export const programPatchSchema = programCreateSchema.partial().strict();

export const campaignCreateSchema = z.object({
  programId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  purpose: z.string().trim().max(4000).optional().nullable(),
  channel: z.enum(CHANNEL_TYPES).optional(),
  templateId: z.number().int().positive().optional().nullable(),
  audienceSource: audienceSourceSchema,
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(8).max(40)).optional().nullable(),
  ownerFacultyId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  requiresApproval: z.boolean().optional(),
}).strict();

export const campaignPatchSchema = campaignCreateSchema.omit({ programId: true }).partial().extend({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
}).strict();

export const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  category: z.enum(ENGAGEMENT_CATEGORIES).optional(),
  channel: z.enum(CHANNEL_TYPES).optional(),
  subject: z.string().trim().max(255).optional().nullable(),
  body: z.string().trim().min(1).max(20000),
}).strict();

export const templatePatchSchema = templateCreateSchema.partial().strict();

export const approvalDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().trim().max(2000).optional().nullable(),
  step: z.enum(['HOD_REVIEW', 'ALUMNI_TP_REVIEW', 'INSTITUTIONAL']).optional(),
}).strict();

export const suppressOverrideSchema = z.object({
  reason: z.string().trim().min(3).max(2000),
}).strict();

export const manualExecutionSchema = z.object({
  outcome: z.enum(MANUAL_OUTCOMES),
  summary: z.string().trim().max(4000).optional().nullable(),
  followUpRequired: z.boolean().optional(),
  nextActionAt: z.string().optional().nullable(),
  nextActionSummary: z.string().trim().max(500).optional().nullable(),
  createOpportunity: z.boolean().optional(),
  opportunityType: z.string().trim().max(64).optional().nullable(),
  opportunityTitle: z.string().trim().max(255).optional().nullable(),
}).strict();

export const responseSubmitSchema = z.object({
  token: z.string().trim().min(32).max(256),
  choice: z.string().trim().max(64).optional().nullable(),
  form: z.record(z.string(), z.unknown()).optional().nullable(),
}).strict();

export const preferenceCentreSchema = z.object({
  commEmailOptIn: z.boolean().optional(),
  commSmsOptIn: z.boolean().optional(),
  commPhoneOptIn: z.boolean().optional(),
  commWhatsappOptIn: z.boolean().optional(),
  prefEventsOptIn: z.boolean().optional(),
  prefMentorshipOptIn: z.boolean().optional(),
  prefRecruitmentOptIn: z.boolean().optional(),
  prefNetworkingOptIn: z.boolean().optional(),
  prefResearchOptIn: z.boolean().optional(),
  prefEntrepreneurshipOptIn: z.boolean().optional(),
  prefContributionOptIn: z.boolean().optional(),
  prefInstitutionUpdatesOptIn: z.boolean().optional(),
  globalCommOptOut: z.boolean().optional(),
  globalOptOutReason: z.string().trim().max(255).optional().nullable(),
  temporaryUnavailableUntil: z.string().datetime({ offset: true }).or(z.string().min(8).max(40)).optional().nullable(),
  temporaryUnavailableReason: z.string().trim().max(255).optional().nullable(),
}).strict();

export const recognitionNomSchema = z.object({
  alumniProfileId: z.number().int().positive(),
  programId: z.number().int().positive().optional().nullable(),
  campaignId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(255),
  rationale: z.string().trim().max(4000).optional().nullable(),
  evidenceRefs: z.array(z.record(z.string(), z.unknown())).max(20).optional().nullable(),
}).strict();

export const fatigueRuleSchema = z.object({
  categoryCode: z.string().trim().min(1).max(48),
  minDaysBetweenEquivalent: z.number().int().min(0).max(3650).optional(),
  warnRecentContactDays: z.number().int().min(0).max(3650).optional(),
  suppressActiveOpportunity: z.boolean().optional(),
  suppressOpenFollowup: z.boolean().optional(),
  warnOpenFollowup: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const issueTokenSchema = z.object({
  alumniProfileId: z.number().int().positive(),
  campaignId: z.number().int().positive().optional().nullable(),
  recipientId: z.number().int().positive().optional().nullable(),
  actionType: z.enum(RESPONSE_ACTION_TYPES),
  actionPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  expiresInHours: z.number().int().min(1).max(24 * 90).optional(),
  maxUses: z.number().int().min(1).max(10).optional(),
}).strict();

/** Map engagement category → C1 willingness key / topic preference. */
export const CATEGORY_WILLINGNESS_KEY: Partial<Record<EngagementCategory, string>> = {
  MENTORSHIP: 'openToMentoring',
  RECRUITMENT: 'openToRecruitment',
  INTERNSHIP: 'openToInternships',
  EXPERT_SESSION: 'openToExpertSessions',
  RESEARCH: 'openToResearchCollaboration',
  ENTREPRENEURSHIP: 'openToStartupMentoring',
  INDUSTRY_CONNECT: 'openToIndustryCollaboration',
  CONTRIBUTION: 'openToInstitutionalContribution',
};

export const CATEGORY_PREF_COL: Partial<Record<EngagementCategory, string>> = {
  MENTORSHIP: 'pref_mentorship_opt_in',
  RECRUITMENT: 'pref_recruitment_opt_in',
  INTERNSHIP: 'pref_recruitment_opt_in',
  EXPERT_SESSION: 'pref_events_opt_in',
  RESEARCH: 'pref_research_opt_in',
  ENTREPRENEURSHIP: 'pref_entrepreneurship_opt_in',
  NETWORKING: 'pref_networking_opt_in',
  REUNION: 'pref_events_opt_in',
  COMMUNITY: 'pref_networking_opt_in',
  CONTRIBUTION: 'pref_contribution_opt_in',
  INSTITUTION_UPDATE: 'pref_institution_updates_opt_in',
  DATA_REFRESH: 'pref_institution_updates_opt_in',
  LEARNING: 'pref_events_opt_in',
  CAREER: 'pref_networking_opt_in',
  INDUSTRY_CONNECT: 'pref_networking_opt_in',
  RECOGNITION: 'pref_institution_updates_opt_in',
};

export const CHANNEL_PREF_COL: Partial<Record<ChannelType, string>> = {
  EMAIL: 'comm_email_opt_in',
  SMS: 'comm_sms_opt_in',
  PHONE: 'comm_phone_opt_in',
  WHATSAPP: 'comm_whatsapp_opt_in',
};
