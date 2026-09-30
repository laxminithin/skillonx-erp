/**
 * Alumni Matching & Connect (C5) — types and Zod schemas.
 * Deterministic / evidence-based matching only. No opaque scores or AI claims.
 */
import { z } from 'zod';
export const CONNECT_NEED_TYPES = [
    'MENTORSHIP',
    'RECRUITMENT',
    'INTERNSHIP',
    'EXPERT_SESSION',
    'RESOURCE_PERSON',
    'PROJECT_MENTORING',
    'INDUSTRY_PROJECT',
    'RESEARCH_COLLABORATION',
    'BOS_ADVISORY',
    'CURRICULUM_REVIEW',
    'STARTUP_MENTORING',
    'INDUSTRIAL_VISIT',
    'MOU_COLLABORATION',
    'CAREER_GUIDANCE',
    'MOCK_INTERVIEW',
    'TECHNICAL_REVIEW',
    'HACKATHON_JUDGE',
    'PROJECT_EVALUATOR',
    'OTHER',
];
export const NEED_STATUSES = [
    'DRAFT',
    'OPEN',
    'MATCHING',
    'SHORTLISTED',
    'ENGAGEMENT_IN_PROGRESS',
    'FULFILLED',
    'PARTIALLY_FULFILLED',
    'CLOSED',
    'CANCELLED',
];
export const NEED_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const NEED_MODES = ['IN_PERSON', 'ONLINE', 'HYBRID', 'ANY'];
/** Where the need originates — prefer source-linked over ADHOC when a module exists. */
export const NEED_SOURCE_TYPES = [
    'ADHOC',
    'MENTORING',
    'TPMS',
    'STUDENT_PROJECT',
    'ALUMNI_EVENT',
    'TRAINING_MOCK_INTERVIEW',
    'CRM_OPPORTUNITY',
    'OTHER',
];
export const SHORTLIST_STATUSES = [
    'SUGGESTED',
    'SHORTLISTED',
    'ENGAGEMENT_REQUESTED',
    'ACCEPTED',
    'DECLINED',
    'REMOVED',
    'COMPLETED',
];
export const DISMISS_REASONS = [
    'NOT_RELEVANT',
    'INSUFFICIENT_CAPABILITY',
    'TIMING',
    'ALREADY_ENGAGED',
    'DATA_STALE',
    'RELATIONSHIP_CONCERN',
    'OTHER',
];
export const MATCH_QUALITIES = ['STRONG', 'MODERATE', 'LIMITED'];
export const MATCH_STATUSES = [
    'READY_TO_SHORTLIST',
    'REVIEW_BEFORE_CONTACT',
    'CAPABILITY_ONLY',
    'RELATIONSHIP_CAUTION',
    'ENGAGEMENT_SUPPRESSED',
];
export const BENEFICIARY_TYPES = [
    'STUDENT',
    'STUDENT_GROUP',
    'PROJECT',
    'DEPARTMENT',
    'PROGRAMME',
    'FACULTY',
    'STARTUP_TEAM',
    'OTHER',
];
export const WORKSPACE_VIEWS = [
    'OPEN_NEEDS',
    'MATCHING',
    'SHORTLISTED',
    'ENGAGEMENT_IN_PROGRESS',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'NEEDS_ATTENTION',
];
/** Map need type → C1 willingness column. */
export const NEED_WILLINGNESS_KEY = {
    MENTORSHIP: 'open_to_mentoring',
    CAREER_GUIDANCE: 'open_to_mentoring',
    MOCK_INTERVIEW: 'open_to_mentoring',
    RECRUITMENT: 'open_to_recruitment',
    INTERNSHIP: 'open_to_internships',
    EXPERT_SESSION: 'open_to_expert_sessions',
    RESOURCE_PERSON: 'open_to_expert_sessions',
    HACKATHON_JUDGE: 'open_to_expert_sessions',
    PROJECT_EVALUATOR: 'open_to_project_mentoring',
    TECHNICAL_REVIEW: 'open_to_project_mentoring',
    PROJECT_MENTORING: 'open_to_project_mentoring',
    INDUSTRY_PROJECT: 'open_to_industry_collaboration',
    RESEARCH_COLLABORATION: 'open_to_research_collaboration',
    BOS_ADVISORY: 'open_to_bos_advisory',
    CURRICULUM_REVIEW: 'open_to_bos_advisory',
    STARTUP_MENTORING: 'open_to_startup_mentoring',
    INDUSTRIAL_VISIT: 'open_to_industry_collaboration',
    MOU_COLLABORATION: 'open_to_industry_collaboration',
};
/** Map need type → C1 capability domains that strengthen evidence. */
export const NEED_CAPABILITY_DOMAINS = {
    MENTORSHIP: ['MENTORING'],
    CAREER_GUIDANCE: ['MENTORING', 'INDUSTRY'],
    MOCK_INTERVIEW: ['MENTORING', 'RECRUITMENT'],
    RECRUITMENT: ['RECRUITMENT'],
    INTERNSHIP: ['RECRUITMENT', 'INDUSTRY'],
    EXPERT_SESSION: ['ACADEMIC', 'INDUSTRY'],
    RESOURCE_PERSON: ['ACADEMIC', 'INDUSTRY'],
    HACKATHON_JUDGE: ['ACADEMIC', 'INDUSTRY', 'INNOVATION'],
    PROJECT_EVALUATOR: ['ACADEMIC', 'INDUSTRY'],
    TECHNICAL_REVIEW: ['ACADEMIC', 'INDUSTRY'],
    PROJECT_MENTORING: ['MENTORING', 'INDUSTRY'],
    INDUSTRY_PROJECT: ['INDUSTRY'],
    RESEARCH_COLLABORATION: ['ACADEMIC'],
    BOS_ADVISORY: ['ACADEMIC', 'INDUSTRY'],
    CURRICULUM_REVIEW: ['ACADEMIC', 'INDUSTRY'],
    STARTUP_MENTORING: ['INNOVATION'],
    INDUSTRIAL_VISIT: ['INDUSTRY'],
    MOU_COLLABORATION: ['INDUSTRY'],
};
/** Map need type → C2 opportunity / outcome types for evidence & handoff. */
export const NEED_OPPORTUNITY_TYPES = {
    MENTORSHIP: ['MENTORSHIP'],
    CAREER_GUIDANCE: ['MENTORSHIP'],
    MOCK_INTERVIEW: ['MENTORSHIP', 'RECRUITMENT'],
    RECRUITMENT: ['RECRUITMENT'],
    INTERNSHIP: ['INTERNSHIP'],
    EXPERT_SESSION: ['EXPERT_SESSION'],
    RESOURCE_PERSON: ['EXPERT_SESSION'],
    HACKATHON_JUDGE: ['EXPERT_SESSION'],
    PROJECT_EVALUATOR: ['PROJECT_MENTORING'],
    TECHNICAL_REVIEW: ['PROJECT_MENTORING'],
    PROJECT_MENTORING: ['PROJECT_MENTORING'],
    INDUSTRY_PROJECT: ['INDUSTRY_PROJECT'],
    RESEARCH_COLLABORATION: ['RESEARCH_COLLABORATION'],
    BOS_ADVISORY: ['BOS_ADVISORY'],
    CURRICULUM_REVIEW: ['BOS_ADVISORY'],
    STARTUP_MENTORING: ['STARTUP_SUPPORT'],
    INDUSTRIAL_VISIT: ['INDUSTRIAL_VISIT'],
    MOU_COLLABORATION: ['MOU_COLLABORATION'],
};
export const NEED_OUTCOME_TYPES = {
    MENTORSHIP: ['STUDENTS_MENTORED'],
    CAREER_GUIDANCE: ['STUDENTS_MENTORED'],
    MOCK_INTERVIEW: ['STUDENTS_MENTORED'],
    RECRUITMENT: ['PLACEMENTS_SUPPORTED', 'JOBS_REFERRED'],
    INTERNSHIP: ['INTERNSHIPS_ENABLED'],
    EXPERT_SESSION: ['EXPERT_SESSIONS_DELIVERED'],
    RESOURCE_PERSON: ['EXPERT_SESSIONS_DELIVERED'],
    HACKATHON_JUDGE: ['EXPERT_SESSIONS_DELIVERED'],
    PROJECT_EVALUATOR: ['PROJECTS_SUPPORTED'],
    TECHNICAL_REVIEW: ['PROJECTS_SUPPORTED'],
    PROJECT_MENTORING: ['PROJECTS_SUPPORTED'],
    INDUSTRY_PROJECT: ['PROJECTS_SUPPORTED'],
    RESEARCH_COLLABORATION: ['RESEARCH_COLLABORATIONS'],
    BOS_ADVISORY: ['BOS_PARTICIPATION'],
    CURRICULUM_REVIEW: ['BOS_PARTICIPATION'],
    STARTUP_MENTORING: ['STARTUP_SUPPORT'],
    INDUSTRIAL_VISIT: ['INDUSTRY_VISITS'],
    MOU_COLLABORATION: ['OTHER'],
};
/** Map need type → C4 engagement category for eligibility/suppression. */
export const NEED_ENGAGEMENT_CATEGORY = {
    MENTORSHIP: 'MENTORSHIP',
    CAREER_GUIDANCE: 'MENTORSHIP',
    MOCK_INTERVIEW: 'MENTORSHIP',
    RECRUITMENT: 'RECRUITMENT',
    INTERNSHIP: 'INTERNSHIP',
    EXPERT_SESSION: 'EXPERT_SESSION',
    RESOURCE_PERSON: 'EXPERT_SESSION',
    HACKATHON_JUDGE: 'EXPERT_SESSION',
    PROJECT_EVALUATOR: 'LEARNING',
    TECHNICAL_REVIEW: 'LEARNING',
    PROJECT_MENTORING: 'MENTORSHIP',
    INDUSTRY_PROJECT: 'INDUSTRY_CONNECT',
    RESEARCH_COLLABORATION: 'RESEARCH',
    BOS_ADVISORY: 'INDUSTRY_CONNECT',
    CURRICULUM_REVIEW: 'INDUSTRY_CONNECT',
    STARTUP_MENTORING: 'ENTREPRENEURSHIP',
    INDUSTRIAL_VISIT: 'INDUSTRY_CONNECT',
    MOU_COLLABORATION: 'INDUSTRY_CONNECT',
};
/**
 * Source-of-truth matrix (audit C5.0).
 * authoritative = module/table that owns demand data when present.
 * c5OwnsNeed = C5 may create lightweight need when no source record.
 */
export const SOURCE_OF_TRUTH_MATRIX = [
    { needType: 'MENTORSHIP', authoritative: 'mentor_assignments (faculty mentoring); alumni mentorship demand → C5', linkable: true, c5OwnsNeed: true },
    { needType: 'RECRUITMENT', authoritative: 'placement_opportunities (TPMS)', linkable: true, c5OwnsNeed: true },
    { needType: 'INTERNSHIP', authoritative: 'placement_opportunities (TPMS, opportunity_type INTERNSHIP)', linkable: true, c5OwnsNeed: true },
    { needType: 'EXPERT_SESSION', authoritative: 'alumni_events (partial)', linkable: true, c5OwnsNeed: true },
    { needType: 'RESOURCE_PERSON', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'PROJECT_MENTORING', authoritative: 'student_projects (portfolio; beneficiary link)', linkable: true, c5OwnsNeed: true },
    { needType: 'INDUSTRY_PROJECT', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'RESEARCH_COLLABORATION', authoritative: 'none (faculty research fields only)', linkable: false, c5OwnsNeed: true },
    { needType: 'BOS_ADVISORY', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'CURRICULUM_REVIEW', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'STARTUP_MENTORING', authoritative: 'none (no incubation module)', linkable: false, c5OwnsNeed: true },
    { needType: 'INDUSTRIAL_VISIT', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'MOU_COLLABORATION', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'CAREER_GUIDANCE', authoritative: 'mentoring / T&P training (partial)', linkable: true, c5OwnsNeed: true },
    { needType: 'MOCK_INTERVIEW', authoritative: 'training_mock_interviews', linkable: true, c5OwnsNeed: true },
    { needType: 'TECHNICAL_REVIEW', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'HACKATHON_JUDGE', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'PROJECT_EVALUATOR', authoritative: 'none', linkable: false, c5OwnsNeed: true },
    { needType: 'OTHER', authoritative: 'none', linkable: false, c5OwnsNeed: true },
];
/** Forbidden matching attributes — never used in evaluation. */
export const FORBIDDEN_MATCH_ATTRIBUTES = [
    'religion',
    'caste',
    'ethnicity',
    'politics',
    'health',
    'sexual_orientation',
    'wealth',
    'family_status',
    'donation_history',
];
const beneficiarySchema = z.object({
    beneficiaryType: z.enum(BENEFICIARY_TYPES),
    beneficiaryRef: z.string().trim().min(1).max(128),
    label: z.string().trim().max(255).optional().nullable(),
}).strict();
export const needCreateSchema = z.object({
    type: z.enum(CONNECT_NEED_TYPES),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(8000).optional().nullable(),
    sourceType: z.enum(NEED_SOURCE_TYPES).optional(),
    sourceReference: z.string().trim().max(255).optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    programme: z.string().trim().max(128).optional().nullable(),
    domain: z.string().trim().max(128).optional().nullable(),
    skillsTopics: z.array(z.string().trim().min(1).max(128)).max(40).optional(),
    targetBeneficiaries: z
        .object({
        summary: z.string().trim().max(500).optional().nullable(),
        refs: z.array(beneficiarySchema).max(200).optional(),
    })
        .optional()
        .nullable(),
    quantityRequired: z.number().int().positive().max(100000).optional().nullable(),
    mode: z.enum(NEED_MODES).optional().nullable(),
    location: z.string().trim().max(255).optional().nullable(),
    startDate: z.string().min(8).max(16).optional().nullable(),
    targetDate: z.string().min(8).max(16).optional().nullable(),
    deadline: z.string().min(8).max(16).optional().nullable(),
    priority: z.enum(NEED_PRIORITIES).optional(),
    ownerFacultyId: z.number().int().positive().optional().nullable(),
    status: z.enum(['DRAFT', 'OPEN', 'MATCHING']).optional(),
}).strict();
export const needPatchSchema = needCreateSchema.partial().extend({
    status: z.enum(NEED_STATUSES).optional(),
}).strict();
export const shortlistSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    reasonNotes: z.string().trim().max(2000).optional().nullable(),
    allocatedQuantity: z.number().int().positive().max(100000).optional().nullable(),
    matchSnapshot: z.record(z.string(), z.unknown()).optional().nullable(),
}).strict();
export const dismissSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    reason: z.enum(DISMISS_REASONS),
    notes: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const engageHandoffSchema = z.object({
    channel: z.enum(['EMAIL', 'PHONE', 'MANUAL', 'IN_PERSON', 'OTHER']).optional(),
    purpose: z.string().trim().max(500).optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    createProgramIfMissing: z.boolean().optional(),
}).strict();
export const opportunityHandoffSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(4000).optional().nullable(),
    expectedOutcome: z.string().trim().max(255).optional().nullable(),
    targetDate: z.string().min(8).max(16).optional().nullable(),
    allocatedQuantity: z.number().int().positive().max(100000).optional().nullable(),
}).strict();
export const fulfilmentSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    shortlistId: z.number().int().positive().optional().nullable(),
    promisedQuantity: z.number().int().nonnegative().max(100000).optional(),
    confirmedQuantity: z.number().int().nonnegative().max(100000).optional(),
    verifiedQuantity: z.number().int().nonnegative().max(100000).optional(),
    crmOpportunityId: z.number().int().positive().optional().nullable(),
    crmOutcomeId: z.number().int().positive().optional().nullable(),
    status: z.enum(['PROMISED', 'CONFIRMED', 'VERIFIED', 'WITHDRAWN']).optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const evaluateOptsSchema = z.object({
    limit: z.number().int().positive().max(500).optional(),
    includeLimited: z.boolean().optional(),
    alumniProfileIds: z.array(z.number().int().positive()).max(500).optional(),
}).strict();
