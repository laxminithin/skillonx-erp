/**
 * Alumni Recognition, Value & Community (C6) — types and Zod schemas.
 * Human recognition decisions only. No popularity/wealth/donor ranking.
 */
import { z } from 'zod';
export declare const RECOGNITION_CATEGORY_CODES: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
export type RecognitionCategoryCode = (typeof RECOGNITION_CATEGORY_CODES)[number];
export declare const SYSTEM_CATEGORY_LABELS: Record<RecognitionCategoryCode, string>;
export declare const PROGRAM_STATUSES: readonly ["DRAFT", "NOMINATIONS_OPEN", "REVIEW", "APPROVED", "PUBLISHED", "COMPLETED", "CANCELLED"];
export declare const NOMINATION_SOURCES: readonly ["FACULTY", "HOD", "ALUMNI_OFFICE", "TPMS", "PRINCIPAL_AUTHORISED", "MANAGEMENT_AUTHORISED", "ALUMNI_SELF", "OTHER_ALUMNUS", "C4_HANDOFF", "OTHER"];
export declare const NOMINATION_STATUSES: readonly ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "MORE_EVIDENCE_REQUIRED", "SHORTLISTED", "APPROVED", "REJECTED", "WITHDRAWN"];
export declare const EVIDENCE_SOURCE_TYPES: readonly ["C1_ACHIEVEMENT", "CAREER_MILESTONE", "PUBLICATION", "PATENT", "ENTREPRENEURSHIP", "C2_OUTCOME", "C5_FULFILMENT", "INSTITUTIONAL_RECORD", "UPLOADED", "EXTERNAL_REF", "OTHER"];
export declare const EVIDENCE_VERIFICATION: readonly ["UNVERIFIED", "SELF_DECLARED", "INSTITUTIONAL", "VERIFIED", "REJECTED"];
export declare const REVIEW_DECISIONS: readonly ["APPROVE", "REJECT", "REQUEST_EVIDENCE", "SHORTLIST", "ABSTAIN", "COMMENT"];
export declare const RECOGNITION_RECORD_STATUSES: readonly ["ISSUED", "CORRECTED", "REVOKED"];
export declare const PUBLICATION_VISIBILITY: readonly ["PRIVATE", "INSTITUTION", "ALUMNI_NETWORK", "PUBLIC"];
export declare const SPOTLIGHT_STATUSES: readonly ["DRAFT", "PENDING_CONSENT", "APPROVED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"];
export declare const VALUE_OFFERING_CATEGORIES: readonly ["PROFESSIONAL_NETWORKING", "CONTINUOUS_LEARNING", "EXPERT_VISIBILITY", "SPEAKING_OPPORTUNITY", "MENTOR_RECOGNITION", "FOUNDER_SHOWCASE", "STARTUP_NETWORK", "RESEARCH_COLLABORATION", "FACULTY_COLLABORATION", "TALENT_ACCESS", "RECRUITMENT_ACCESS", "CAREER_NETWORKING", "INSTITUTIONAL_FACILITY_ACCESS", "EVENT_ACCESS", "ALUMNI_COMMUNITY", "VOLUNTEERING", "OTHER"];
export declare const VALUE_OFFERING_STATUSES: readonly ["DRAFT", "OPEN", "FULL", "CLOSED", "COMPLETED", "CANCELLED"];
/** VIEWED excluded — no telemetry claim without actual tracking. */
export declare const PARTICIPATION_STATUSES: readonly ["INTERESTED", "REGISTERED", "ACCEPTED", "WAITLISTED", "PARTICIPATED", "COMPLETED", "DECLINED", "CANCELLED"];
export declare const COMMUNITY_TYPES: readonly ["BATCH", "DEPARTMENT", "INDUSTRY", "LOCATION", "FOUNDER", "RESEARCH", "MENTOR", "CHAPTER", "OTHER"];
export declare const MEMBERSHIP_STATUSES: readonly ["OPT_IN", "INVITED", "ACTIVE", "INACTIVE", "DECLINED"];
export declare const CONNECTION_STATUSES: readonly ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED"];
export declare const SUGGESTION_TYPES: readonly ["CONSIDER_FOR_RECOGNITION", "POTENTIAL_RECOGNITION_CANDIDATE"];
export declare const CERTIFICATE_TYPES: readonly ["RECOGNITION", "APPRECIATION", "MENTORSHIP", "EXPERT_SESSION", "INDUSTRY_CONNECT", "OTHER"];
export declare const WORKSPACE_VIEWS: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
export declare const DEFAULT_REVIEW_STAGES: readonly [{
    readonly code: "NOMINATION";
    readonly label: "Nomination";
    readonly sortOrder: 10;
}, {
    readonly code: "DEPARTMENT_REVIEW";
    readonly label: "Department Review";
    readonly sortOrder: 20;
}, {
    readonly code: "ALUMNI_COMMITTEE";
    readonly label: "Alumni Committee Review";
    readonly sortOrder: 30;
}, {
    readonly code: "INSTITUTIONAL_APPROVAL";
    readonly label: "Institutional Approval";
    readonly sortOrder: 40;
}, {
    readonly code: "RECOGNITION_ISSUED";
    readonly label: "Recognition Issued";
    readonly sortOrder: 50;
}];
/**
 * Source-of-truth matrix (C6.0 audit).
 * C6 owns recognition/value/community workflows; projects C1–C5 facts.
 */
export declare const SOURCE_OF_TRUTH_MATRIX: readonly [{
    readonly capability: "Career / employment / higher studies / entrepreneurship";
    readonly authoritative: "C1 alumni_* tables";
    readonly c6Role: "PROJECT";
    readonly notes: "Never re-store career facts";
}, {
    readonly capability: "Self / institutional achievements ledger";
    readonly authoritative: "C1 alumni_achievements";
    readonly c6Role: "PROJECT + evidence ref";
    readonly notes: "C6 awards may project; do not fork achievement rows";
}, {
    readonly capability: "Privacy / directory / contact visibility";
    readonly authoritative: "C1 alumni_profiles visibility cols";
    readonly c6Role: "ENFORCE";
    readonly notes: "Consent required for public spotlight";
}, {
    readonly capability: "CRM outcomes / interactions / timeline";
    readonly authoritative: "C2 alumni_crm_*";
    readonly c6Role: "PROJECT + evidence";
    readonly notes: "Verified outcomes → eligibility assistance / suggestions";
}, {
    readonly capability: "Intelligence dimensions / segments";
    readonly authoritative: "C3 computed + config";
    readonly c6Role: "ISOLATE";
    readonly notes: "Recognition must not auto-inflate capability";
}, {
    readonly capability: "Engagement programs / campaigns / prefs";
    readonly authoritative: "C4";
    readonly c6Role: "HANDOFF";
    readonly notes: "C4 remains campaign authority; C6 consumes noms";
}, {
    readonly capability: "Recognition nomination handoff";
    readonly authoritative: "C4 alumni_engagement_recognition_noms";
    readonly c6Role: "CONSUME → C6 nomination";
    readonly notes: "Mark C4 RECORDED when ingested/awarded";
}, {
    readonly capability: "Value-exchange program classification";
    readonly authoritative: "C4 engagement programs";
    readonly c6Role: "PROJECT";
    readonly notes: "C6 owns alumni-facing value offerings catalogue";
}, {
    readonly capability: "Connect needs / fulfilment";
    readonly authoritative: "C5";
    readonly c6Role: "PROJECT + evidence";
    readonly notes: "Verified fulfilment → recognition eligibility";
}, {
    readonly capability: "Finance receipts / contributions";
    readonly authoritative: "Finance fee_receipts + alumni_contributions";
    readonly c6Role: "PROJECT only";
    readonly notes: "No donor/wealth ranking";
}, {
    readonly capability: "Event attendance";
    readonly authoritative: "alumni_events / registrations";
    readonly c6Role: "PROJECT";
    readonly notes: "Do not duplicate attendance";
}, {
    readonly capability: "Institutional recognition awards";
    readonly authoritative: "C6 alumni_recognition_records";
    readonly c6Role: "OWN";
    readonly notes: "Human issuance + immutable log";
}, {
    readonly capability: "Nominations / evidence / review";
    readonly authoritative: "C6";
    readonly c6Role: "OWN";
    readonly notes: "Nomination ≠ award";
}, {
    readonly capability: "Spotlight publication";
    readonly authoritative: "C6 alumni_spotlights";
    readonly c6Role: "OWN";
    readonly notes: "Explicit consent gate";
}, {
    readonly capability: "Value offerings & participation";
    readonly authoritative: "C6";
    readonly c6Role: "OWN";
    readonly notes: "No VIEWED without telemetry";
}, {
    readonly capability: "Communities / chapters / connections";
    readonly authoritative: "C6";
    readonly c6Role: "OWN";
    readonly notes: "No social feed; no inferred membership";
}, {
    readonly capability: "Student certificates / faculty awards";
    readonly authoritative: "Student Services / Faculty Profile";
    readonly c6Role: "PATTERN only";
    readonly notes: "Separate alumni certificate table";
}, {
    readonly capability: "Website / CMS / LinkedIn scrape";
    readonly authoritative: "NONE";
    readonly c6Role: "OUT_OF_SCOPE";
    readonly notes: "Zero fabrication";
}];
/** Forbidden ranking / scoring attributes — never used in C6. */
export declare const FORBIDDEN_RECOGNITION_ATTRIBUTES: readonly ["popularity", "wealth", "donation_amount", "donor_tier", "social_media_followers", "linkedin_connections", "best_alumni_score", "reciprocity_score", "fairness_score"];
export declare const programCreateSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    eligibilityRules: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    nominationStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nominationEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reviewStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reviewEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    awardDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publicationDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    scope: z.ZodOptional<z.ZodEnum<["COLLEGE", "DEPARTMENT", "PROGRAMME", "BATCH", "OTHER"]>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "NOMINATIONS_OPEN"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    status?: "DRAFT" | "NOMINATIONS_OPEN" | undefined;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    eligibilityRules?: Record<string, unknown> | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    scope?: "OTHER" | "DEPARTMENT" | "PROGRAMME" | "BATCH" | "COLLEGE" | undefined;
    academicYear?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    nominationStart?: string | null | undefined;
    nominationEnd?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationDate?: string | null | undefined;
}, {
    name: string;
    status?: "DRAFT" | "NOMINATIONS_OPEN" | undefined;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    eligibilityRules?: Record<string, unknown> | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    scope?: "OTHER" | "DEPARTMENT" | "PROGRAMME" | "BATCH" | "COLLEGE" | undefined;
    academicYear?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    nominationStart?: string | null | undefined;
    nominationEnd?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationDate?: string | null | undefined;
}>;
export declare const programPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    academicYear: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    eligibilityRules: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    nominationStart: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    nominationEnd: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    reviewStart: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    reviewEnd: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    awardDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    publicationDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    scope: z.ZodOptional<z.ZodOptional<z.ZodEnum<["COLLEGE", "DEPARTMENT", "PROGRAMME", "BATCH", "OTHER"]>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "NOMINATIONS_OPEN", "REVIEW", "APPROVED", "PUBLISHED", "COMPLETED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "DRAFT" | "PUBLISHED" | "COMPLETED" | "APPROVED" | "CANCELLED" | "REVIEW" | "NOMINATIONS_OPEN" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    eligibilityRules?: Record<string, unknown> | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    scope?: "OTHER" | "DEPARTMENT" | "PROGRAMME" | "BATCH" | "COLLEGE" | undefined;
    academicYear?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    nominationStart?: string | null | undefined;
    nominationEnd?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationDate?: string | null | undefined;
}, {
    status?: "DRAFT" | "PUBLISHED" | "COMPLETED" | "APPROVED" | "CANCELLED" | "REVIEW" | "NOMINATIONS_OPEN" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    eligibilityRules?: Record<string, unknown> | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    scope?: "OTHER" | "DEPARTMENT" | "PROGRAMME" | "BATCH" | "COLLEGE" | undefined;
    academicYear?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    nominationStart?: string | null | undefined;
    nominationEnd?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationDate?: string | null | undefined;
}>;
export declare const nominationCreateSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>;
    title: z.ZodString;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodEnum<["FACULTY", "HOD", "ALUMNI_OFFICE", "TPMS", "PRINCIPAL_AUTHORISED", "MANAGEMENT_AUTHORISED", "ALUMNI_SELF", "OTHER_ALUMNUS", "C4_HANDOFF", "OTHER"]>>;
    nominatorAlumniId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    c4NominationId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "SUBMITTED"]>>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
        sourceType: z.ZodEnum<["C1_ACHIEVEMENT", "CAREER_MILESTONE", "PUBLICATION", "PATENT", "ENTREPRENEURSHIP", "C2_OUTCOME", "C5_FULFILMENT", "INSTITUTIONAL_RECORD", "UPLOADED", "EXTERNAL_REF", "OTHER"]>;
        sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        verificationStatus: z.ZodOptional<z.ZodEnum<["UNVERIFIED", "SELF_DECLARED", "INSTITUTIONAL", "VERIFIED", "REJECTED"]>>;
    }, "strict", z.ZodTypeAny, {
        sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
        notes?: string | null | undefined;
        label?: string | null | undefined;
        sourceReference?: string | null | undefined;
        verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    }, {
        sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
        notes?: string | null | undefined;
        label?: string | null | undefined;
        sourceReference?: string | null | undefined;
        verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    title: string;
    alumniProfileId: number;
    status?: "DRAFT" | "SUBMITTED" | undefined;
    reason?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    source?: "FACULTY" | "HOD" | "OTHER" | "ALUMNI_SELF" | "TPMS" | "ALUMNI_OFFICE" | "PRINCIPAL_AUTHORISED" | "MANAGEMENT_AUTHORISED" | "OTHER_ALUMNUS" | "C4_HANDOFF" | undefined;
    evidence?: {
        sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
        notes?: string | null | undefined;
        label?: string | null | undefined;
        sourceReference?: string | null | undefined;
        verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    }[] | undefined;
    programId?: number | null | undefined;
    nominatorAlumniId?: number | null | undefined;
    c4NominationId?: number | null | undefined;
}, {
    title: string;
    alumniProfileId: number;
    status?: "DRAFT" | "SUBMITTED" | undefined;
    reason?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    source?: "FACULTY" | "HOD" | "OTHER" | "ALUMNI_SELF" | "TPMS" | "ALUMNI_OFFICE" | "PRINCIPAL_AUTHORISED" | "MANAGEMENT_AUTHORISED" | "OTHER_ALUMNUS" | "C4_HANDOFF" | undefined;
    evidence?: {
        sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
        notes?: string | null | undefined;
        label?: string | null | undefined;
        sourceReference?: string | null | undefined;
        verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    }[] | undefined;
    programId?: number | null | undefined;
    nominatorAlumniId?: number | null | undefined;
    c4NominationId?: number | null | undefined;
}>;
export declare const nominationPatchSchema: z.ZodObject<{
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>;
    title: z.ZodOptional<z.ZodString>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "SUBMITTED", "UNDER_REVIEW", "MORE_EVIDENCE_REQUIRED", "SHORTLISTED", "APPROVED", "REJECTED", "WITHDRAWN"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW" | "SHORTLISTED" | "MORE_EVIDENCE_REQUIRED" | undefined;
    title?: string | undefined;
    reason?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    programId?: number | null | undefined;
}, {
    status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW" | "SHORTLISTED" | "MORE_EVIDENCE_REQUIRED" | undefined;
    title?: string | undefined;
    reason?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    programId?: number | null | undefined;
}>;
export declare const evidenceSchema: z.ZodObject<{
    nominationId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    recognitionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    sourceType: z.ZodEnum<["C1_ACHIEVEMENT", "CAREER_MILESTONE", "PUBLICATION", "PATENT", "ENTREPRENEURSHIP", "C2_OUTCOME", "C5_FULFILMENT", "INSTITUTIONAL_RECORD", "UPLOADED", "EXTERNAL_REF", "OTHER"]>;
    sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    verificationStatus: z.ZodOptional<z.ZodEnum<["UNVERIFIED", "SELF_DECLARED", "INSTITUTIONAL", "VERIFIED", "REJECTED"]>>;
}, "strict", z.ZodTypeAny, {
    sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
    notes?: string | null | undefined;
    label?: string | null | undefined;
    sourceReference?: string | null | undefined;
    verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    nominationId?: number | null | undefined;
    recognitionId?: number | null | undefined;
}, {
    sourceType: "OTHER" | "ENTREPRENEURSHIP" | "PUBLICATION" | "PATENT" | "C2_OUTCOME" | "C5_FULFILMENT" | "C1_ACHIEVEMENT" | "CAREER_MILESTONE" | "INSTITUTIONAL_RECORD" | "UPLOADED" | "EXTERNAL_REF";
    notes?: string | null | undefined;
    label?: string | null | undefined;
    sourceReference?: string | null | undefined;
    verificationStatus?: "VERIFIED" | "REJECTED" | "INSTITUTIONAL" | "SELF_DECLARED" | "UNVERIFIED" | undefined;
    nominationId?: number | null | undefined;
    recognitionId?: number | null | undefined;
}>;
export declare const reviewSchema: z.ZodObject<{
    stageCode: z.ZodString;
    decision: z.ZodEnum<["APPROVE", "REJECT", "REQUEST_EVIDENCE", "SHORTLIST", "ABSTAIN", "COMMENT"]>;
    comments: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    /** Optional nomination status transition after review — never auto-ISSUED */
    nextNominationStatus: z.ZodNullable<z.ZodOptional<z.ZodEnum<["DRAFT", "SUBMITTED", "UNDER_REVIEW", "MORE_EVIDENCE_REQUIRED", "SHORTLISTED", "APPROVED", "REJECTED", "WITHDRAWN"]>>>;
}, "strict", z.ZodTypeAny, {
    decision: "APPROVE" | "REJECT" | "COMMENT" | "SHORTLIST" | "REQUEST_EVIDENCE" | "ABSTAIN";
    stageCode: string;
    comments?: string | null | undefined;
    nextNominationStatus?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW" | "SHORTLISTED" | "MORE_EVIDENCE_REQUIRED" | null | undefined;
}, {
    decision: "APPROVE" | "REJECT" | "COMMENT" | "SHORTLIST" | "REQUEST_EVIDENCE" | "ABSTAIN";
    stageCode: string;
    comments?: string | null | undefined;
    nextNominationStatus?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "UNDER_REVIEW" | "SHORTLISTED" | "MORE_EVIDENCE_REQUIRED" | null | undefined;
}>;
export declare const issueRecognitionSchema: z.ZodObject<{
    nominationId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    alumniProfileId: z.ZodOptional<z.ZodNumber>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>;
    citation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    awardDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publicationVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION", "ALUMNI_NETWORK", "PUBLIC"]>>;
    publicationConsent: z.ZodOptional<z.ZodBoolean>;
    issueCertificate: z.ZodOptional<z.ZodBoolean>;
    certificateType: z.ZodOptional<z.ZodEnum<["RECOGNITION", "APPRECIATION", "MENTORSHIP", "EXPERT_SESSION", "INDUSTRY_CONNECT", "OTHER"]>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    programId?: number | null | undefined;
    citation?: string | null | undefined;
    academicYear?: string | null | undefined;
    alumniProfileId?: number | undefined;
    awardDate?: string | null | undefined;
    nominationId?: number | null | undefined;
    publicationVisibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    publicationConsent?: boolean | undefined;
    issueCertificate?: boolean | undefined;
    certificateType?: "OTHER" | "MENTORSHIP" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "APPRECIATION" | undefined;
}, {
    title: string;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    programId?: number | null | undefined;
    citation?: string | null | undefined;
    academicYear?: string | null | undefined;
    alumniProfileId?: number | undefined;
    awardDate?: string | null | undefined;
    nominationId?: number | null | undefined;
    publicationVisibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    publicationConsent?: boolean | undefined;
    issueCertificate?: boolean | undefined;
    certificateType?: "OTHER" | "MENTORSHIP" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "APPRECIATION" | undefined;
}>;
export declare const correctRecognitionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    citation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"]>>;
    awardDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publicationVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION", "ALUMNI_NETWORK", "PUBLIC"]>>;
    publicationConsent: z.ZodOptional<z.ZodBoolean>;
    reason: z.ZodString;
    revoke: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    reason: string;
    title?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    citation?: string | null | undefined;
    academicYear?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationVisibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    publicationConsent?: boolean | undefined;
    revoke?: boolean | undefined;
}, {
    reason: string;
    title?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PUBLICATION" | "PROJECT_SUPPORT" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "MENTORSHIP_CONTRIBUTION" | "EXPERT_CONTRIBUTION" | "INTERNSHIP_SUPPORT" | "RECRUITMENT_CONTRIBUTION" | "INSTITUTIONAL_SERVICE" | "PATENT_IP" | "PROFESSIONAL_ACHIEVEMENT" | "RESEARCH_INNOVATION" | "HIGHER_EDUCATION" | "INDUSTRY_ACHIEVEMENT" | "SOCIAL_IMPACT" | "ACADEMIC_ACHIEVEMENT" | "COMMUNITY_SERVICE" | "DISTINGUISHED_ALUMNUS" | "YOUNG_ACHIEVER" | undefined;
    citation?: string | null | undefined;
    academicYear?: string | null | undefined;
    awardDate?: string | null | undefined;
    publicationVisibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    publicationConsent?: boolean | undefined;
    revoke?: boolean | undefined;
}>;
export declare const spotlightCreateSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    recognitionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    headline: z.ZodString;
    professionalSummary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    achievement: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    institutionConnection: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    graduationDetails: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    storyContent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    publicationStatus: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_CONSENT"]>>;
    publishAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unpublishAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    headline: string;
    alumniProfileId: number;
    publishAt?: string | null | undefined;
    recognitionId?: number | null | undefined;
    professionalSummary?: string | null | undefined;
    achievement?: string | null | undefined;
    institutionConnection?: string | null | undefined;
    graduationDetails?: string | null | undefined;
    imageUrl?: string | null | undefined;
    storyContent?: string | null | undefined;
    publicationStatus?: "DRAFT" | "PENDING_CONSENT" | undefined;
    unpublishAt?: string | null | undefined;
}, {
    headline: string;
    alumniProfileId: number;
    publishAt?: string | null | undefined;
    recognitionId?: number | null | undefined;
    professionalSummary?: string | null | undefined;
    achievement?: string | null | undefined;
    institutionConnection?: string | null | undefined;
    graduationDetails?: string | null | undefined;
    imageUrl?: string | null | undefined;
    storyContent?: string | null | undefined;
    publicationStatus?: "DRAFT" | "PENDING_CONSENT" | undefined;
    unpublishAt?: string | null | undefined;
}>;
export declare const spotlightPatchSchema: z.ZodObject<{
    headline: z.ZodOptional<z.ZodString>;
    publishAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    recognitionId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    professionalSummary: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    achievement: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    institutionConnection: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    graduationDetails: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    storyContent: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    unpublishAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
} & {
    publicationStatus: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_CONSENT", "APPROVED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]>>;
    publicationConsent: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    headline?: string | undefined;
    publishAt?: string | null | undefined;
    recognitionId?: number | null | undefined;
    publicationConsent?: boolean | undefined;
    professionalSummary?: string | null | undefined;
    achievement?: string | null | undefined;
    institutionConnection?: string | null | undefined;
    graduationDetails?: string | null | undefined;
    imageUrl?: string | null | undefined;
    storyContent?: string | null | undefined;
    publicationStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "APPROVED" | "PENDING_CONSENT" | "UNPUBLISHED" | undefined;
    unpublishAt?: string | null | undefined;
}, {
    headline?: string | undefined;
    publishAt?: string | null | undefined;
    recognitionId?: number | null | undefined;
    publicationConsent?: boolean | undefined;
    professionalSummary?: string | null | undefined;
    achievement?: string | null | undefined;
    institutionConnection?: string | null | undefined;
    graduationDetails?: string | null | undefined;
    imageUrl?: string | null | undefined;
    storyContent?: string | null | undefined;
    publicationStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "APPROVED" | "PENDING_CONSENT" | "UNPUBLISHED" | undefined;
    unpublishAt?: string | null | undefined;
}>;
export declare const valueOfferingCreateSchema: z.ZodObject<{
    title: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["PROFESSIONAL_NETWORKING", "CONTINUOUS_LEARNING", "EXPERT_VISIBILITY", "SPEAKING_OPPORTUNITY", "MENTOR_RECOGNITION", "FOUNDER_SHOWCASE", "STARTUP_NETWORK", "RESEARCH_COLLABORATION", "FACULTY_COLLABORATION", "TALENT_ACCESS", "RECRUITMENT_ACCESS", "CAREER_NETWORKING", "INSTITUTIONAL_FACILITY_ACCESS", "EVENT_ACCESS", "ALUMNI_COMMUNITY", "VOLUNTEERING", "OTHER"]>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    providerLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    eligibility: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    deliveryMode: z.ZodNullable<z.ZodOptional<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "ASYNC", "OTHER"]>>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registrationDeadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "OPEN"]>>;
    visibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION", "ALUMNI_NETWORK", "PUBLIC"]>>;
    benefits: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    terms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    engagementCampaignId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    status?: "DRAFT" | "OPEN" | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: "OTHER" | "RESEARCH_COLLABORATION" | "PROFESSIONAL_NETWORKING" | "CONTINUOUS_LEARNING" | "EXPERT_VISIBILITY" | "SPEAKING_OPPORTUNITY" | "MENTOR_RECOGNITION" | "FOUNDER_SHOWCASE" | "STARTUP_NETWORK" | "FACULTY_COLLABORATION" | "TALENT_ACCESS" | "RECRUITMENT_ACCESS" | "CAREER_NETWORKING" | "INSTITUTIONAL_FACILITY_ACCESS" | "EVENT_ACCESS" | "ALUMNI_COMMUNITY" | "VOLUNTEERING" | undefined;
    capacity?: number | null | undefined;
    visibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    deliveryMode?: "OTHER" | "ONLINE" | "HYBRID" | "IN_PERSON" | "ASYNC" | null | undefined;
    location?: string | null | undefined;
    terms?: string | null | undefined;
    eligibility?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    providerLabel?: string | null | undefined;
    registrationDeadline?: string | null | undefined;
    benefits?: string | null | undefined;
    engagementCampaignId?: number | null | undefined;
}, {
    title: string;
    status?: "DRAFT" | "OPEN" | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: "OTHER" | "RESEARCH_COLLABORATION" | "PROFESSIONAL_NETWORKING" | "CONTINUOUS_LEARNING" | "EXPERT_VISIBILITY" | "SPEAKING_OPPORTUNITY" | "MENTOR_RECOGNITION" | "FOUNDER_SHOWCASE" | "STARTUP_NETWORK" | "FACULTY_COLLABORATION" | "TALENT_ACCESS" | "RECRUITMENT_ACCESS" | "CAREER_NETWORKING" | "INSTITUTIONAL_FACILITY_ACCESS" | "EVENT_ACCESS" | "ALUMNI_COMMUNITY" | "VOLUNTEERING" | undefined;
    capacity?: number | null | undefined;
    visibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    deliveryMode?: "OTHER" | "ONLINE" | "HYBRID" | "IN_PERSON" | "ASYNC" | null | undefined;
    location?: string | null | undefined;
    terms?: string | null | undefined;
    eligibility?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    providerLabel?: string | null | undefined;
    registrationDeadline?: string | null | undefined;
    benefits?: string | null | undefined;
    engagementCampaignId?: number | null | undefined;
}>;
export declare const valueOfferingPatchSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<["PROFESSIONAL_NETWORKING", "CONTINUOUS_LEARNING", "EXPERT_VISIBILITY", "SPEAKING_OPPORTUNITY", "MENTOR_RECOGNITION", "FOUNDER_SHOWCASE", "STARTUP_NETWORK", "RESEARCH_COLLABORATION", "FACULTY_COLLABORATION", "TALENT_ACCESS", "RECRUITMENT_ACCESS", "CAREER_NETWORKING", "INSTITUTIONAL_FACILITY_ACCESS", "EVENT_ACCESS", "ALUMNI_COMMUNITY", "VOLUNTEERING", "OTHER"]>>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    providerLabel: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    eligibility: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    capacity: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    deliveryMode: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "ASYNC", "OTHER"]>>>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    registrationDeadline: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION", "ALUMNI_NETWORK", "PUBLIC"]>>>;
    benefits: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    terms: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    engagementCampaignId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "OPEN", "FULL", "CLOSED", "COMPLETED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "DRAFT" | "CLOSED" | "COMPLETED" | "CANCELLED" | "OPEN" | "FULL" | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: "OTHER" | "RESEARCH_COLLABORATION" | "PROFESSIONAL_NETWORKING" | "CONTINUOUS_LEARNING" | "EXPERT_VISIBILITY" | "SPEAKING_OPPORTUNITY" | "MENTOR_RECOGNITION" | "FOUNDER_SHOWCASE" | "STARTUP_NETWORK" | "FACULTY_COLLABORATION" | "TALENT_ACCESS" | "RECRUITMENT_ACCESS" | "CAREER_NETWORKING" | "INSTITUTIONAL_FACILITY_ACCESS" | "EVENT_ACCESS" | "ALUMNI_COMMUNITY" | "VOLUNTEERING" | undefined;
    capacity?: number | null | undefined;
    visibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    deliveryMode?: "OTHER" | "ONLINE" | "HYBRID" | "IN_PERSON" | "ASYNC" | null | undefined;
    location?: string | null | undefined;
    terms?: string | null | undefined;
    eligibility?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    providerLabel?: string | null | undefined;
    registrationDeadline?: string | null | undefined;
    benefits?: string | null | undefined;
    engagementCampaignId?: number | null | undefined;
}, {
    status?: "DRAFT" | "CLOSED" | "COMPLETED" | "CANCELLED" | "OPEN" | "FULL" | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: "OTHER" | "RESEARCH_COLLABORATION" | "PROFESSIONAL_NETWORKING" | "CONTINUOUS_LEARNING" | "EXPERT_VISIBILITY" | "SPEAKING_OPPORTUNITY" | "MENTOR_RECOGNITION" | "FOUNDER_SHOWCASE" | "STARTUP_NETWORK" | "FACULTY_COLLABORATION" | "TALENT_ACCESS" | "RECRUITMENT_ACCESS" | "CAREER_NETWORKING" | "INSTITUTIONAL_FACILITY_ACCESS" | "EVENT_ACCESS" | "ALUMNI_COMMUNITY" | "VOLUNTEERING" | undefined;
    capacity?: number | null | undefined;
    visibility?: "INSTITUTION" | "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    deliveryMode?: "OTHER" | "ONLINE" | "HYBRID" | "IN_PERSON" | "ASYNC" | null | undefined;
    location?: string | null | undefined;
    terms?: string | null | undefined;
    eligibility?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    providerLabel?: string | null | undefined;
    registrationDeadline?: string | null | undefined;
    benefits?: string | null | undefined;
    engagementCampaignId?: number | null | undefined;
}>;
export declare const participationSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    status: z.ZodEnum<["INTERESTED", "REGISTERED", "ACCEPTED", "WAITLISTED", "PARTICIPATED", "COMPLETED", "DECLINED", "CANCELLED"]>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    status: "COMPLETED" | "CANCELLED" | "ACCEPTED" | "DECLINED" | "REGISTERED" | "WAITLISTED" | "INTERESTED" | "PARTICIPATED";
    alumniProfileId: number;
    notes?: string | null | undefined;
}, {
    status: "COMPLETED" | "CANCELLED" | "ACCEPTED" | "DECLINED" | "REGISTERED" | "WAITLISTED" | "INTERESTED" | "PARTICIPATED";
    alumniProfileId: number;
    notes?: string | null | undefined;
}>;
export declare const communityCreateSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["BATCH", "DEPARTMENT", "INDUSTRY", "LOCATION", "FOUNDER", "RESEARCH", "MENTOR", "CHAPTER", "OTHER"]>>;
    scope: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    coordinatorFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    coordinatorAlumniId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    region: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batchYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    industry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "ARCHIVED"]>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    type?: "OTHER" | "RESEARCH" | "MENTOR" | "DEPARTMENT" | "INDUSTRY" | "FOUNDER" | "BATCH" | "LOCATION" | "CHAPTER" | undefined;
    status?: "ACTIVE" | "ARCHIVED" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    city?: string | null | undefined;
    scope?: string | null | undefined;
    country?: string | null | undefined;
    coordinatorFacultyId?: number | null | undefined;
    coordinatorAlumniId?: number | null | undefined;
    region?: string | null | undefined;
    batchYear?: string | null | undefined;
}, {
    name: string;
    type?: "OTHER" | "RESEARCH" | "MENTOR" | "DEPARTMENT" | "INDUSTRY" | "FOUNDER" | "BATCH" | "LOCATION" | "CHAPTER" | undefined;
    status?: "ACTIVE" | "ARCHIVED" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    city?: string | null | undefined;
    scope?: string | null | undefined;
    country?: string | null | undefined;
    coordinatorFacultyId?: number | null | undefined;
    coordinatorAlumniId?: number | null | undefined;
    region?: string | null | undefined;
    batchYear?: string | null | undefined;
}>;
export declare const communityPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodEnum<["BATCH", "DEPARTMENT", "INDUSTRY", "LOCATION", "FOUNDER", "RESEARCH", "MENTOR", "CHAPTER", "OTHER"]>>>;
    scope: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    coordinatorFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    coordinatorAlumniId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    city: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    region: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    country: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    batchYear: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    industry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "ARCHIVED"]>>>;
}, "strict", z.ZodTypeAny, {
    type?: "OTHER" | "RESEARCH" | "MENTOR" | "DEPARTMENT" | "INDUSTRY" | "FOUNDER" | "BATCH" | "LOCATION" | "CHAPTER" | undefined;
    status?: "ACTIVE" | "ARCHIVED" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    city?: string | null | undefined;
    scope?: string | null | undefined;
    country?: string | null | undefined;
    coordinatorFacultyId?: number | null | undefined;
    coordinatorAlumniId?: number | null | undefined;
    region?: string | null | undefined;
    batchYear?: string | null | undefined;
}, {
    type?: "OTHER" | "RESEARCH" | "MENTOR" | "DEPARTMENT" | "INDUSTRY" | "FOUNDER" | "BATCH" | "LOCATION" | "CHAPTER" | undefined;
    status?: "ACTIVE" | "ARCHIVED" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    city?: string | null | undefined;
    scope?: string | null | undefined;
    country?: string | null | undefined;
    coordinatorFacultyId?: number | null | undefined;
    coordinatorAlumniId?: number | null | undefined;
    region?: string | null | undefined;
    batchYear?: string | null | undefined;
}>;
export declare const membershipSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    status: z.ZodOptional<z.ZodEnum<["OPT_IN", "INVITED", "ACTIVE", "INACTIVE", "DECLINED"]>>;
}, "strict", z.ZodTypeAny, {
    alumniProfileId: number;
    status?: "ACTIVE" | "INACTIVE" | "DECLINED" | "INVITED" | "OPT_IN" | undefined;
}, {
    alumniProfileId: number;
    status?: "ACTIVE" | "INACTIVE" | "DECLINED" | "INVITED" | "OPT_IN" | undefined;
}>;
export declare const connectionRequestSchema: z.ZodObject<{
    toAlumniId: z.ZodNumber;
    message: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    toAlumniId: number;
    message?: string | null | undefined;
}, {
    toAlumniId: number;
    message?: string | null | undefined;
}>;
export declare const connectionRespondSchema: z.ZodObject<{
    status: z.ZodEnum<["ACCEPTED", "DECLINED", "CANCELLED"]>;
}, "strict", z.ZodTypeAny, {
    status: "CANCELLED" | "ACCEPTED" | "DECLINED";
}, {
    status: "CANCELLED" | "ACCEPTED" | "DECLINED";
}>;
export declare const categoryUpsertSchema: z.ZodObject<{
    code: z.ZodString;
    label: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    code: string;
    label: string;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
}, {
    code: string;
    label: string;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    isActive?: boolean | undefined;
}>;
