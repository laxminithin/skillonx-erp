/**
 * Alumni Recognition, Value & Community (C6) — types and Zod schemas.
 * Human recognition decisions only. No popularity/wealth/donor ranking.
 */
import { z } from 'zod';
export const RECOGNITION_CATEGORY_CODES = [
    'PROFESSIONAL_ACHIEVEMENT',
    'ENTREPRENEURSHIP',
    'RESEARCH_INNOVATION',
    'PUBLICATION',
    'PATENT_IP',
    'LEADERSHIP',
    'SOCIAL_IMPACT',
    'ACADEMIC_ACHIEVEMENT',
    'HIGHER_EDUCATION',
    'INDUSTRY_ACHIEVEMENT',
    'MENTORSHIP_CONTRIBUTION',
    'RECRUITMENT_CONTRIBUTION',
    'INTERNSHIP_SUPPORT',
    'EXPERT_CONTRIBUTION',
    'PROJECT_SUPPORT',
    'RESEARCH_COLLABORATION',
    'STARTUP_SUPPORT',
    'INSTITUTIONAL_SERVICE',
    'COMMUNITY_SERVICE',
    'DISTINGUISHED_ALUMNUS',
    'YOUNG_ACHIEVER',
    'OTHER',
];
export const SYSTEM_CATEGORY_LABELS = {
    PROFESSIONAL_ACHIEVEMENT: 'Professional Achievement',
    ENTREPRENEURSHIP: 'Entrepreneurship',
    RESEARCH_INNOVATION: 'Research & Innovation',
    PUBLICATION: 'Publication',
    PATENT_IP: 'Patent / IP',
    LEADERSHIP: 'Leadership',
    SOCIAL_IMPACT: 'Social Impact',
    ACADEMIC_ACHIEVEMENT: 'Academic Achievement',
    HIGHER_EDUCATION: 'Higher Education',
    INDUSTRY_ACHIEVEMENT: 'Industry Achievement',
    MENTORSHIP_CONTRIBUTION: 'Mentorship Contribution',
    RECRUITMENT_CONTRIBUTION: 'Recruitment Contribution',
    INTERNSHIP_SUPPORT: 'Internship Support',
    EXPERT_CONTRIBUTION: 'Expert Contribution',
    PROJECT_SUPPORT: 'Project Support',
    RESEARCH_COLLABORATION: 'Research Collaboration',
    STARTUP_SUPPORT: 'Startup Support',
    INSTITUTIONAL_SERVICE: 'Institutional Service',
    COMMUNITY_SERVICE: 'Community Service',
    DISTINGUISHED_ALUMNUS: 'Distinguished Alumnus',
    YOUNG_ACHIEVER: 'Young Achiever',
    OTHER: 'Other',
};
export const PROGRAM_STATUSES = [
    'DRAFT',
    'NOMINATIONS_OPEN',
    'REVIEW',
    'APPROVED',
    'PUBLISHED',
    'COMPLETED',
    'CANCELLED',
];
export const NOMINATION_SOURCES = [
    'FACULTY',
    'HOD',
    'ALUMNI_OFFICE',
    'TPMS',
    'PRINCIPAL_AUTHORISED',
    'MANAGEMENT_AUTHORISED',
    'ALUMNI_SELF',
    'OTHER_ALUMNUS',
    'C4_HANDOFF',
    'OTHER',
];
export const NOMINATION_STATUSES = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'MORE_EVIDENCE_REQUIRED',
    'SHORTLISTED',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN',
];
export const EVIDENCE_SOURCE_TYPES = [
    'C1_ACHIEVEMENT',
    'CAREER_MILESTONE',
    'PUBLICATION',
    'PATENT',
    'ENTREPRENEURSHIP',
    'C2_OUTCOME',
    'C5_FULFILMENT',
    'INSTITUTIONAL_RECORD',
    'UPLOADED',
    'EXTERNAL_REF',
    'OTHER',
];
export const EVIDENCE_VERIFICATION = [
    'UNVERIFIED',
    'SELF_DECLARED',
    'INSTITUTIONAL',
    'VERIFIED',
    'REJECTED',
];
export const REVIEW_DECISIONS = [
    'APPROVE',
    'REJECT',
    'REQUEST_EVIDENCE',
    'SHORTLIST',
    'ABSTAIN',
    'COMMENT',
];
export const RECOGNITION_RECORD_STATUSES = ['ISSUED', 'CORRECTED', 'REVOKED'];
export const PUBLICATION_VISIBILITY = ['PRIVATE', 'INSTITUTION', 'ALUMNI_NETWORK', 'PUBLIC'];
export const SPOTLIGHT_STATUSES = [
    'DRAFT',
    'PENDING_CONSENT',
    'APPROVED',
    'PUBLISHED',
    'UNPUBLISHED',
    'ARCHIVED',
];
export const VALUE_OFFERING_CATEGORIES = [
    'PROFESSIONAL_NETWORKING',
    'CONTINUOUS_LEARNING',
    'EXPERT_VISIBILITY',
    'SPEAKING_OPPORTUNITY',
    'MENTOR_RECOGNITION',
    'FOUNDER_SHOWCASE',
    'STARTUP_NETWORK',
    'RESEARCH_COLLABORATION',
    'FACULTY_COLLABORATION',
    'TALENT_ACCESS',
    'RECRUITMENT_ACCESS',
    'CAREER_NETWORKING',
    'INSTITUTIONAL_FACILITY_ACCESS',
    'EVENT_ACCESS',
    'ALUMNI_COMMUNITY',
    'VOLUNTEERING',
    'OTHER',
];
export const VALUE_OFFERING_STATUSES = [
    'DRAFT',
    'OPEN',
    'FULL',
    'CLOSED',
    'COMPLETED',
    'CANCELLED',
];
/** VIEWED excluded — no telemetry claim without actual tracking. */
export const PARTICIPATION_STATUSES = [
    'INTERESTED',
    'REGISTERED',
    'ACCEPTED',
    'WAITLISTED',
    'PARTICIPATED',
    'COMPLETED',
    'DECLINED',
    'CANCELLED',
];
export const COMMUNITY_TYPES = [
    'BATCH',
    'DEPARTMENT',
    'INDUSTRY',
    'LOCATION',
    'FOUNDER',
    'RESEARCH',
    'MENTOR',
    'CHAPTER',
    'OTHER',
];
export const MEMBERSHIP_STATUSES = ['OPT_IN', 'INVITED', 'ACTIVE', 'INACTIVE', 'DECLINED'];
export const CONNECTION_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'];
export const SUGGESTION_TYPES = [
    'CONSIDER_FOR_RECOGNITION',
    'POTENTIAL_RECOGNITION_CANDIDATE',
];
export const CERTIFICATE_TYPES = [
    'RECOGNITION',
    'APPRECIATION',
    'MENTORSHIP',
    'EXPERT_SESSION',
    'INDUSTRY_CONNECT',
    'OTHER',
];
export const WORKSPACE_VIEWS = [
    'OVERVIEW',
    'PROGRAMS',
    'NOMINATIONS',
    'REVIEW_QUEUE',
    'RECOGNITIONS',
    'SPOTLIGHTS',
    'VALUE_OFFERINGS',
    'COMMUNITIES',
    'RECIPROCITY',
    'SUGGESTIONS',
];
export const DEFAULT_REVIEW_STAGES = [
    { code: 'NOMINATION', label: 'Nomination', sortOrder: 10 },
    { code: 'DEPARTMENT_REVIEW', label: 'Department Review', sortOrder: 20 },
    { code: 'ALUMNI_COMMITTEE', label: 'Alumni Committee Review', sortOrder: 30 },
    { code: 'INSTITUTIONAL_APPROVAL', label: 'Institutional Approval', sortOrder: 40 },
    { code: 'RECOGNITION_ISSUED', label: 'Recognition Issued', sortOrder: 50 },
];
/**
 * Source-of-truth matrix (C6.0 audit).
 * C6 owns recognition/value/community workflows; projects C1–C5 facts.
 */
export const SOURCE_OF_TRUTH_MATRIX = [
    { capability: 'Career / employment / higher studies / entrepreneurship', authoritative: 'C1 alumni_* tables', c6Role: 'PROJECT', notes: 'Never re-store career facts' },
    { capability: 'Self / institutional achievements ledger', authoritative: 'C1 alumni_achievements', c6Role: 'PROJECT + evidence ref', notes: 'C6 awards may project; do not fork achievement rows' },
    { capability: 'Privacy / directory / contact visibility', authoritative: 'C1 alumni_profiles visibility cols', c6Role: 'ENFORCE', notes: 'Consent required for public spotlight' },
    { capability: 'CRM outcomes / interactions / timeline', authoritative: 'C2 alumni_crm_*', c6Role: 'PROJECT + evidence', notes: 'Verified outcomes → eligibility assistance / suggestions' },
    { capability: 'Intelligence dimensions / segments', authoritative: 'C3 computed + config', c6Role: 'ISOLATE', notes: 'Recognition must not auto-inflate capability' },
    { capability: 'Engagement programs / campaigns / prefs', authoritative: 'C4', c6Role: 'HANDOFF', notes: 'C4 remains campaign authority; C6 consumes noms' },
    { capability: 'Recognition nomination handoff', authoritative: 'C4 alumni_engagement_recognition_noms', c6Role: 'CONSUME → C6 nomination', notes: 'Mark C4 RECORDED when ingested/awarded' },
    { capability: 'Value-exchange program classification', authoritative: 'C4 engagement programs', c6Role: 'PROJECT', notes: 'C6 owns alumni-facing value offerings catalogue' },
    { capability: 'Connect needs / fulfilment', authoritative: 'C5', c6Role: 'PROJECT + evidence', notes: 'Verified fulfilment → recognition eligibility' },
    { capability: 'Finance receipts / contributions', authoritative: 'Finance fee_receipts + alumni_contributions', c6Role: 'PROJECT only', notes: 'No donor/wealth ranking' },
    { capability: 'Event attendance', authoritative: 'alumni_events / registrations', c6Role: 'PROJECT', notes: 'Do not duplicate attendance' },
    { capability: 'Institutional recognition awards', authoritative: 'C6 alumni_recognition_records', c6Role: 'OWN', notes: 'Human issuance + immutable log' },
    { capability: 'Nominations / evidence / review', authoritative: 'C6', c6Role: 'OWN', notes: 'Nomination ≠ award' },
    { capability: 'Spotlight publication', authoritative: 'C6 alumni_spotlights', c6Role: 'OWN', notes: 'Explicit consent gate' },
    { capability: 'Value offerings & participation', authoritative: 'C6', c6Role: 'OWN', notes: 'No VIEWED without telemetry' },
    { capability: 'Communities / chapters / connections', authoritative: 'C6', c6Role: 'OWN', notes: 'No social feed; no inferred membership' },
    { capability: 'Student certificates / faculty awards', authoritative: 'Student Services / Faculty Profile', c6Role: 'PATTERN only', notes: 'Separate alumni certificate table' },
    { capability: 'Website / CMS / LinkedIn scrape', authoritative: 'NONE', c6Role: 'OUT_OF_SCOPE', notes: 'Zero fabrication' },
];
/** Forbidden ranking / scoring attributes — never used in C6. */
export const FORBIDDEN_RECOGNITION_ATTRIBUTES = [
    'popularity',
    'wealth',
    'donation_amount',
    'donor_tier',
    'social_media_followers',
    'linkedin_connections',
    'best_alumni_score',
    'reciprocity_score',
    'fairness_score',
];
export const programCreateSchema = z.object({
    name: z.string().trim().min(1).max(255),
    category: z.enum(RECOGNITION_CATEGORY_CODES).optional(),
    description: z.string().trim().max(8000).optional().nullable(),
    academicYear: z.string().trim().max(32).optional().nullable(),
    eligibilityRules: z.record(z.string(), z.unknown()).optional().nullable(),
    nominationStart: z.string().min(8).max(16).optional().nullable(),
    nominationEnd: z.string().min(8).max(16).optional().nullable(),
    reviewStart: z.string().min(8).max(16).optional().nullable(),
    reviewEnd: z.string().min(8).max(16).optional().nullable(),
    awardDate: z.string().min(8).max(16).optional().nullable(),
    publicationDate: z.string().min(8).max(16).optional().nullable(),
    ownerFacultyId: z.number().int().positive().optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    scope: z.enum(['COLLEGE', 'DEPARTMENT', 'PROGRAMME', 'BATCH', 'OTHER']).optional(),
    status: z.enum(['DRAFT', 'NOMINATIONS_OPEN']).optional(),
}).strict();
export const programPatchSchema = programCreateSchema.partial().extend({
    status: z.enum(PROGRAM_STATUSES).optional(),
}).strict();
export const nominationCreateSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    programId: z.number().int().positive().optional().nullable(),
    category: z.enum(RECOGNITION_CATEGORY_CODES).optional(),
    title: z.string().trim().min(1).max(255),
    reason: z.string().trim().max(8000).optional().nullable(),
    source: z.enum(NOMINATION_SOURCES).optional(),
    nominatorAlumniId: z.number().int().positive().optional().nullable(),
    c4NominationId: z.number().int().positive().optional().nullable(),
    status: z.enum(['DRAFT', 'SUBMITTED']).optional(),
    evidence: z.array(z.object({
        sourceType: z.enum(EVIDENCE_SOURCE_TYPES),
        sourceReference: z.string().trim().max(255).optional().nullable(),
        label: z.string().trim().max(255).optional().nullable(),
        notes: z.string().trim().max(4000).optional().nullable(),
        verificationStatus: z.enum(EVIDENCE_VERIFICATION).optional(),
    }).strict()).max(40).optional(),
}).strict();
export const nominationPatchSchema = z.object({
    programId: z.number().int().positive().optional().nullable(),
    category: z.enum(RECOGNITION_CATEGORY_CODES).optional(),
    title: z.string().trim().min(1).max(255).optional(),
    reason: z.string().trim().max(8000).optional().nullable(),
    status: z.enum(NOMINATION_STATUSES).optional(),
}).strict();
export const evidenceSchema = z.object({
    nominationId: z.number().int().positive().optional().nullable(),
    recognitionId: z.number().int().positive().optional().nullable(),
    sourceType: z.enum(EVIDENCE_SOURCE_TYPES),
    sourceReference: z.string().trim().max(255).optional().nullable(),
    label: z.string().trim().max(255).optional().nullable(),
    notes: z.string().trim().max(4000).optional().nullable(),
    verificationStatus: z.enum(EVIDENCE_VERIFICATION).optional(),
}).strict();
export const reviewSchema = z.object({
    stageCode: z.string().trim().min(1).max(48),
    decision: z.enum(REVIEW_DECISIONS),
    comments: z.string().trim().max(8000).optional().nullable(),
    /** Optional nomination status transition after review — never auto-ISSUED */
    nextNominationStatus: z.enum(NOMINATION_STATUSES).optional().nullable(),
}).strict();
export const issueRecognitionSchema = z.object({
    nominationId: z.number().int().positive().optional().nullable(),
    alumniProfileId: z.number().int().positive().optional(),
    programId: z.number().int().positive().optional().nullable(),
    title: z.string().trim().min(1).max(255),
    category: z.enum(RECOGNITION_CATEGORY_CODES).optional(),
    citation: z.string().trim().max(8000).optional().nullable(),
    awardDate: z.string().min(8).max(16).optional().nullable(),
    academicYear: z.string().trim().max(32).optional().nullable(),
    publicationVisibility: z.enum(PUBLICATION_VISIBILITY).optional(),
    publicationConsent: z.boolean().optional(),
    issueCertificate: z.boolean().optional(),
    certificateType: z.enum(CERTIFICATE_TYPES).optional(),
}).strict();
export const correctRecognitionSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    citation: z.string().trim().max(8000).optional().nullable(),
    category: z.enum(RECOGNITION_CATEGORY_CODES).optional(),
    awardDate: z.string().min(8).max(16).optional().nullable(),
    academicYear: z.string().trim().max(32).optional().nullable(),
    publicationVisibility: z.enum(PUBLICATION_VISIBILITY).optional(),
    publicationConsent: z.boolean().optional(),
    reason: z.string().trim().min(1).max(2000),
    revoke: z.boolean().optional(),
}).strict();
export const spotlightCreateSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    recognitionId: z.number().int().positive().optional().nullable(),
    headline: z.string().trim().min(1).max(255),
    professionalSummary: z.string().trim().max(4000).optional().nullable(),
    achievement: z.string().trim().max(4000).optional().nullable(),
    institutionConnection: z.string().trim().max(4000).optional().nullable(),
    graduationDetails: z.string().trim().max(255).optional().nullable(),
    imageUrl: z.string().trim().max(512).optional().nullable(),
    storyContent: z.string().trim().max(20000).optional().nullable(),
    publicationStatus: z.enum(['DRAFT', 'PENDING_CONSENT']).optional(),
    publishAt: z.string().min(8).max(16).optional().nullable(),
    unpublishAt: z.string().min(8).max(16).optional().nullable(),
}).strict();
export const spotlightPatchSchema = spotlightCreateSchema.partial().omit({ alumniProfileId: true }).extend({
    publicationStatus: z.enum(SPOTLIGHT_STATUSES).optional(),
    publicationConsent: z.boolean().optional(),
}).strict();
export const valueOfferingCreateSchema = z.object({
    title: z.string().trim().min(1).max(255),
    category: z.enum(VALUE_OFFERING_CATEGORIES).optional(),
    description: z.string().trim().max(8000).optional().nullable(),
    ownerFacultyId: z.number().int().positive().optional().nullable(),
    providerLabel: z.string().trim().max(255).optional().nullable(),
    eligibility: z.string().trim().max(4000).optional().nullable(),
    capacity: z.number().int().positive().max(100000).optional().nullable(),
    deliveryMode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID', 'ASYNC', 'OTHER']).optional().nullable(),
    location: z.string().trim().max(255).optional().nullable(),
    startDate: z.string().min(8).max(16).optional().nullable(),
    endDate: z.string().min(8).max(16).optional().nullable(),
    registrationDeadline: z.string().min(8).max(16).optional().nullable(),
    status: z.enum(['DRAFT', 'OPEN']).optional(),
    visibility: z.enum(PUBLICATION_VISIBILITY).optional(),
    benefits: z.string().trim().max(4000).optional().nullable(),
    terms: z.string().trim().max(4000).optional().nullable(),
    engagementCampaignId: z.number().int().positive().optional().nullable(),
}).strict();
export const valueOfferingPatchSchema = valueOfferingCreateSchema.partial().extend({
    status: z.enum(VALUE_OFFERING_STATUSES).optional(),
}).strict();
export const participationSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    status: z.enum(PARTICIPATION_STATUSES),
    notes: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const communityCreateSchema = z.object({
    name: z.string().trim().min(1).max(255),
    type: z.enum(COMMUNITY_TYPES).optional(),
    scope: z.string().trim().max(128).optional().nullable(),
    description: z.string().trim().max(4000).optional().nullable(),
    coordinatorFacultyId: z.number().int().positive().optional().nullable(),
    coordinatorAlumniId: z.number().int().positive().optional().nullable(),
    city: z.string().trim().max(128).optional().nullable(),
    region: z.string().trim().max(128).optional().nullable(),
    country: z.string().trim().max(128).optional().nullable(),
    batchYear: z.string().trim().max(32).optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    industry: z.string().trim().max(128).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
}).strict();
export const communityPatchSchema = communityCreateSchema.partial().strict();
export const membershipSchema = z.object({
    alumniProfileId: z.number().int().positive(),
    status: z.enum(MEMBERSHIP_STATUSES).optional(),
}).strict();
export const connectionRequestSchema = z.object({
    toAlumniId: z.number().int().positive(),
    message: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const connectionRespondSchema = z.object({
    status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED']),
}).strict();
export const categoryUpsertSchema = z.object({
    code: z.string().trim().min(1).max(48),
    label: z.string().trim().min(1).max(128),
    description: z.string().trim().max(2000).optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10000).optional(),
}).strict();
