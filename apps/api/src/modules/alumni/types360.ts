/**
 * Alumni 360 — shared types, enums, and Zod schemas.
 * C1 foundation only; no CRM/scoring/campaigns.
 */
import { z } from 'zod';

export const SOURCE_TYPES = [
  'ERP',
  'ALUMNI_SELF',
  'FACULTY',
  'STAFF',
  'TPMS',
  'FINANCE',
  'EVENT',
  'IMPORT',
  'REFERRAL',
  'EXTERNAL',
  'SYSTEM_INFERENCE',
  'ENGAGEMENT_RESPONSE',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const VERIFICATION_STATUSES = [
  'AUTHORITATIVE',
  'SELF_DECLARED',
  'INSTITUTION_VERIFIED',
  'EXTERNALLY_VERIFIED',
  'INFERRED',
  'UNVERIFIED',
  'STALE',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const FRESHNESS_STATES = ['VERIFIED_RECENTLY', 'NEEDS_CONFIRMATION', 'STALE', 'UNVERIFIED'] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

export const COMPLETENESS_STATES = ['COMPLETE', 'PARTIAL', 'NEEDS_UPDATE', 'NOT_PROVIDED', 'AUTHORITATIVE'] as const;
export type CompletenessState = (typeof COMPLETENESS_STATES)[number];

export const WILLINGNESS_KEYS = [
  'openToMentoring',
  'openToRecruitment',
  'openToInternships',
  'openToProjectMentoring',
  'openToExpertSessions',
  'openToBosAdvisory',
  'openToResearchCollaboration',
  'openToStartupMentoring',
  'openToIndustryCollaboration',
  'openToInstitutionalContribution',
] as const;

export const WILLINGNESS_DB: Record<(typeof WILLINGNESS_KEYS)[number], string> = {
  openToMentoring: 'open_to_mentoring',
  openToRecruitment: 'open_to_recruitment',
  openToInternships: 'open_to_internships',
  openToProjectMentoring: 'open_to_project_mentoring',
  openToExpertSessions: 'open_to_expert_sessions',
  openToBosAdvisory: 'open_to_bos_advisory',
  openToResearchCollaboration: 'open_to_research_collaboration',
  openToStartupMentoring: 'open_to_startup_mentoring',
  openToIndustryCollaboration: 'open_to_industry_collaboration',
  openToInstitutionalContribution: 'open_to_institutional_contribution',
};

export const CAPABILITY_DOMAINS = [
  'MENTORING',
  'RECRUITMENT',
  'ACADEMIC',
  'INNOVATION',
  'INDUSTRY',
  'CONTRIBUTION',
] as const;

export const DEFAULT_FRESHNESS: Record<string, { staleAfterDays: number; confirmAfterDays: number }> = {
  EMPLOYMENT: { staleAfterDays: 365, confirmAfterDays: 180 },
  CONTACT: { staleAfterDays: 730, confirmAfterDays: 365 },
  WILLINGNESS: { staleAfterDays: 365, confirmAfterDays: 180 },
  SKILLS: { staleAfterDays: 730, confirmAfterDays: 365 },
};

/** Authoritative fields alumni must never mutate. */
export const AUTHORITATIVE_PROFILE_FIELDS = new Set([
  'historical_usn',
  'historical_name',
  'historical_department_id',
  'historical_program_id',
  'student_id',
  'college_id',
  'graduation_year',
  'admission_year',
  'batch_label',
  'verification_state',
  'lifecycle_state',
  'verified_by',
  'verified_at',
]);

export type ProvenanceRecord = {
  sourceType: SourceType;
  sourceReference: string | null;
  capturedAt: string | null;
  updatedAt: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy: number | null;
  confidence: number | null;
  evidenceReference: string | null;
};

export const provenanceWriteSchema = z.object({
  sourceType: z.enum(SOURCE_TYPES).optional(),
  sourceReference: z.string().trim().max(255).optional().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  confidence: z.number().min(0).max(100).optional().nullable(),
  evidenceReference: z.string().trim().max(512).optional().nullable(),
});

export const employment360Schema = z.object({
  organization: z.string().trim().min(1).max(255),
  designation: z.string().trim().max(128).optional().nullable(),
  industry: z.string().trim().max(128).optional().nullable(),
  functionalArea: z.string().trim().max(128).optional().nullable(),
  seniority: z.string().trim().max(64).optional().nullable(),
  location: z.string().trim().max(128).optional().nullable(),
  startDate: z.string().trim().max(16).optional().nullable(),
  endDate: z.string().trim().max(16).optional().nullable(),
  isCurrent: z.boolean().optional(),
  employmentType: z.string().trim().max(32).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const willingnessSchema = z.object({
  openToMentoring: z.boolean().optional().nullable(),
  openToRecruitment: z.boolean().optional().nullable(),
  openToInternships: z.boolean().optional().nullable(),
  openToProjectMentoring: z.boolean().optional().nullable(),
  openToExpertSessions: z.boolean().optional().nullable(),
  openToBosAdvisory: z.boolean().optional().nullable(),
  openToResearchCollaboration: z.boolean().optional().nullable(),
  openToStartupMentoring: z.boolean().optional().nullable(),
  openToIndustryCollaboration: z.boolean().optional().nullable(),
  openToInstitutionalContribution: z.boolean().optional().nullable(),
  confirmNow: z.boolean().optional(),
}).strict();

export const capabilitySchema = z.object({
  capabilityDomain: z.enum(CAPABILITY_DOMAINS),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().optional(),
}).strict();

export const expertiseSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  technologies: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  domainsExpertise: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  industryExpertise: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  researchExpertise: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  certifications: z.array(z.string().trim().min(1).max(128)).max(40).optional(),
}).strict();

export const privacy360Schema = z.object({
  emailVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  phoneVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  bioVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  employmentVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  socialVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  networkingVisibility: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC']).optional(),
  directoryVisible: z.boolean().optional(),
  connectionVisible: z.boolean().optional(),
  professionalDataVisible: z.boolean().optional(),
  commEmailOptIn: z.boolean().optional(),
  commSmsOptIn: z.boolean().optional(),
  commPhoneOptIn: z.boolean().optional(),
  commWhatsappOptIn: z.boolean().optional(),
}).strict();

export const suggestionCreateSchema = z.object({
  alumniProfileId: z.number().int().positive(),
  suggestionType: z.enum(['EMPLOYMENT_UPDATE', 'CONTACT', 'ACHIEVEMENT', 'HIGHER_STUDIES', 'OTHER']),
  title: z.string().trim().min(1).max(255),
  payload: z.record(z.string(), z.unknown()),
  rationale: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const suggestionReviewSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
  reviewNotes: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const mergeSchema = z.object({
  survivorProfileId: z.number().int().positive(),
  mergedProfileId: z.number().int().positive(),
  reason: z.string().trim().min(3).max(2000),
  confirmAmbiguous: z.boolean().optional(),
}).strict();

export const contactConfirmSchema = z.object({
  email: z.string().email().optional(),
  phoneOverride: z.string().trim().max(32).optional().nullable(),
  currentCity: z.string().trim().max(128).optional().nullable(),
  currentCountry: z.string().trim().max(128).optional().nullable(),
  confirmContact: z.boolean().optional(),
}).strict();
