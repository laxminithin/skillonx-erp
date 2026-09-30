/**
 * Alumni Matching & Connect (C5) — types and Zod schemas.
 * Deterministic / evidence-based matching only. No opaque scores or AI claims.
 */
import { z } from 'zod';
export declare const CONNECT_NEED_TYPES: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "RESOURCE_PERSON", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_REVIEW", "STARTUP_MENTORING", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CAREER_GUIDANCE", "MOCK_INTERVIEW", "TECHNICAL_REVIEW", "HACKATHON_JUDGE", "PROJECT_EVALUATOR", "OTHER"];
export type ConnectNeedType = (typeof CONNECT_NEED_TYPES)[number];
export declare const NEED_STATUSES: readonly ["DRAFT", "OPEN", "MATCHING", "SHORTLISTED", "ENGAGEMENT_IN_PROGRESS", "FULFILLED", "PARTIALLY_FULFILLED", "CLOSED", "CANCELLED"];
export type NeedStatus = (typeof NEED_STATUSES)[number];
export declare const NEED_PRIORITIES: readonly ["LOW", "NORMAL", "HIGH", "URGENT"];
export declare const NEED_MODES: readonly ["IN_PERSON", "ONLINE", "HYBRID", "ANY"];
/** Where the need originates — prefer source-linked over ADHOC when a module exists. */
export declare const NEED_SOURCE_TYPES: readonly ["ADHOC", "MENTORING", "TPMS", "STUDENT_PROJECT", "ALUMNI_EVENT", "TRAINING_MOCK_INTERVIEW", "CRM_OPPORTUNITY", "OTHER"];
export declare const SHORTLIST_STATUSES: readonly ["SUGGESTED", "SHORTLISTED", "ENGAGEMENT_REQUESTED", "ACCEPTED", "DECLINED", "REMOVED", "COMPLETED"];
export declare const DISMISS_REASONS: readonly ["NOT_RELEVANT", "INSUFFICIENT_CAPABILITY", "TIMING", "ALREADY_ENGAGED", "DATA_STALE", "RELATIONSHIP_CONCERN", "OTHER"];
export declare const MATCH_QUALITIES: readonly ["STRONG", "MODERATE", "LIMITED"];
export type MatchQuality = (typeof MATCH_QUALITIES)[number];
export declare const MATCH_STATUSES: readonly ["READY_TO_SHORTLIST", "REVIEW_BEFORE_CONTACT", "CAPABILITY_ONLY", "RELATIONSHIP_CAUTION", "ENGAGEMENT_SUPPRESSED"];
export type MatchStatus = (typeof MATCH_STATUSES)[number];
export declare const BENEFICIARY_TYPES: readonly ["STUDENT", "STUDENT_GROUP", "PROJECT", "DEPARTMENT", "PROGRAMME", "FACULTY", "STARTUP_TEAM", "OTHER"];
export declare const WORKSPACE_VIEWS: readonly ["OPEN_NEEDS", "MATCHING", "SHORTLISTED", "ENGAGEMENT_IN_PROGRESS", "PARTIALLY_FULFILLED", "FULFILLED", "NEEDS_ATTENTION"];
/** Map need type → C1 willingness column. */
export declare const NEED_WILLINGNESS_KEY: Partial<Record<ConnectNeedType, string>>;
/** Map need type → C1 capability domains that strengthen evidence. */
export declare const NEED_CAPABILITY_DOMAINS: Partial<Record<ConnectNeedType, string[]>>;
/** Map need type → C2 opportunity / outcome types for evidence & handoff. */
export declare const NEED_OPPORTUNITY_TYPES: Partial<Record<ConnectNeedType, string[]>>;
export declare const NEED_OUTCOME_TYPES: Partial<Record<ConnectNeedType, string[]>>;
/** Map need type → C4 engagement category for eligibility/suppression. */
export declare const NEED_ENGAGEMENT_CATEGORY: Partial<Record<ConnectNeedType, string>>;
/**
 * Source-of-truth matrix (audit C5.0).
 * authoritative = module/table that owns demand data when present.
 * c5OwnsNeed = C5 may create lightweight need when no source record.
 */
export declare const SOURCE_OF_TRUTH_MATRIX: readonly [{
    readonly needType: "MENTORSHIP";
    readonly authoritative: "mentor_assignments (faculty mentoring); alumni mentorship demand → C5";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "RECRUITMENT";
    readonly authoritative: "placement_opportunities (TPMS)";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "INTERNSHIP";
    readonly authoritative: "placement_opportunities (TPMS, opportunity_type INTERNSHIP)";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "EXPERT_SESSION";
    readonly authoritative: "alumni_events (partial)";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "RESOURCE_PERSON";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "PROJECT_MENTORING";
    readonly authoritative: "student_projects (portfolio; beneficiary link)";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "INDUSTRY_PROJECT";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "RESEARCH_COLLABORATION";
    readonly authoritative: "none (faculty research fields only)";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "BOS_ADVISORY";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "CURRICULUM_REVIEW";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "STARTUP_MENTORING";
    readonly authoritative: "none (no incubation module)";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "INDUSTRIAL_VISIT";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "MOU_COLLABORATION";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "CAREER_GUIDANCE";
    readonly authoritative: "mentoring / T&P training (partial)";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "MOCK_INTERVIEW";
    readonly authoritative: "training_mock_interviews";
    readonly linkable: true;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "TECHNICAL_REVIEW";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "HACKATHON_JUDGE";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "PROJECT_EVALUATOR";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}, {
    readonly needType: "OTHER";
    readonly authoritative: "none";
    readonly linkable: false;
    readonly c5OwnsNeed: true;
}];
/** Forbidden matching attributes — never used in evaluation. */
export declare const FORBIDDEN_MATCH_ATTRIBUTES: readonly ["religion", "caste", "ethnicity", "politics", "health", "sexual_orientation", "wealth", "family_status", "donation_history"];
export declare const needCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "RESOURCE_PERSON", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_REVIEW", "STARTUP_MENTORING", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CAREER_GUIDANCE", "MOCK_INTERVIEW", "TECHNICAL_REVIEW", "HACKATHON_JUDGE", "PROJECT_EVALUATOR", "OTHER"]>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceType: z.ZodOptional<z.ZodEnum<["ADHOC", "MENTORING", "TPMS", "STUDENT_PROJECT", "ALUMNI_EVENT", "TRAINING_MOCK_INTERVIEW", "CRM_OPPORTUNITY", "OTHER"]>>;
    sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programme: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    domain: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    skillsTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetBeneficiaries: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        refs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            beneficiaryType: z.ZodEnum<["STUDENT", "STUDENT_GROUP", "PROJECT", "DEPARTMENT", "PROGRAMME", "FACULTY", "STARTUP_TEAM", "OTHER"]>;
            beneficiaryRef: z.ZodString;
            label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strict", z.ZodTypeAny, {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }, {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    }, {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    }>>>;
    quantityRequired: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    mode: z.ZodNullable<z.ZodOptional<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "ANY"]>>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "OPEN", "MATCHING"]>>;
}, "strict", z.ZodTypeAny, {
    type: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "RESOURCE_PERSON" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_REVIEW" | "STARTUP_MENTORING" | "CAREER_GUIDANCE" | "MOCK_INTERVIEW" | "TECHNICAL_REVIEW" | "HACKATHON_JUDGE" | "PROJECT_EVALUATOR";
    title: string;
    status?: "DRAFT" | "OPEN" | "MATCHING" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    mode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "ANY" | null | undefined;
    sourceReference?: string | null | undefined;
    domain?: string | null | undefined;
    programme?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    sourceType?: "OTHER" | "MENTORING" | "ADHOC" | "STUDENT_PROJECT" | "TPMS" | "ALUMNI_EVENT" | "TRAINING_MOCK_INTERVIEW" | "CRM_OPPORTUNITY" | undefined;
    location?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    skillsTopics?: string[] | undefined;
    targetBeneficiaries?: {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    } | null | undefined;
    quantityRequired?: number | null | undefined;
}, {
    type: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "RESOURCE_PERSON" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_REVIEW" | "STARTUP_MENTORING" | "CAREER_GUIDANCE" | "MOCK_INTERVIEW" | "TECHNICAL_REVIEW" | "HACKATHON_JUDGE" | "PROJECT_EVALUATOR";
    title: string;
    status?: "DRAFT" | "OPEN" | "MATCHING" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    mode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "ANY" | null | undefined;
    sourceReference?: string | null | undefined;
    domain?: string | null | undefined;
    programme?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    sourceType?: "OTHER" | "MENTORING" | "ADHOC" | "STUDENT_PROJECT" | "TPMS" | "ALUMNI_EVENT" | "TRAINING_MOCK_INTERVIEW" | "CRM_OPPORTUNITY" | undefined;
    location?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    skillsTopics?: string[] | undefined;
    targetBeneficiaries?: {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    } | null | undefined;
    quantityRequired?: number | null | undefined;
}>;
export declare const needPatchSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "RESOURCE_PERSON", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_REVIEW", "STARTUP_MENTORING", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CAREER_GUIDANCE", "MOCK_INTERVIEW", "TECHNICAL_REVIEW", "HACKATHON_JUDGE", "PROJECT_EVALUATOR", "OTHER"]>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    sourceType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["ADHOC", "MENTORING", "TPMS", "STUDENT_PROJECT", "ALUMNI_EVENT", "TRAINING_MOCK_INTERVIEW", "CRM_OPPORTUNITY", "OTHER"]>>>;
    sourceReference: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    programme: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    domain: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    skillsTopics: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    targetBeneficiaries: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodObject<{
        summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        refs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            beneficiaryType: z.ZodEnum<["STUDENT", "STUDENT_GROUP", "PROJECT", "DEPARTMENT", "PROGRAMME", "FACULTY", "STARTUP_TEAM", "OTHER"]>;
            beneficiaryRef: z.ZodString;
            label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strict", z.ZodTypeAny, {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }, {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    }, {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    }>>>>;
    quantityRequired: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    mode: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "ANY"]>>>>;
    location: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    targetDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    deadline: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    priority: z.ZodOptional<z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "OPEN", "MATCHING", "SHORTLISTED", "ENGAGEMENT_IN_PROGRESS", "FULFILLED", "PARTIALLY_FULFILLED", "CLOSED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    type?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "RESOURCE_PERSON" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_REVIEW" | "STARTUP_MENTORING" | "CAREER_GUIDANCE" | "MOCK_INTERVIEW" | "TECHNICAL_REVIEW" | "HACKATHON_JUDGE" | "PROJECT_EVALUATOR" | undefined;
    status?: "DRAFT" | "CLOSED" | "CANCELLED" | "OPEN" | "FULFILLED" | "SHORTLISTED" | "MATCHING" | "ENGAGEMENT_IN_PROGRESS" | "PARTIALLY_FULFILLED" | undefined;
    title?: string | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    mode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "ANY" | null | undefined;
    sourceReference?: string | null | undefined;
    domain?: string | null | undefined;
    programme?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    sourceType?: "OTHER" | "MENTORING" | "ADHOC" | "STUDENT_PROJECT" | "TPMS" | "ALUMNI_EVENT" | "TRAINING_MOCK_INTERVIEW" | "CRM_OPPORTUNITY" | undefined;
    location?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    skillsTopics?: string[] | undefined;
    targetBeneficiaries?: {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    } | null | undefined;
    quantityRequired?: number | null | undefined;
}, {
    type?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "RESOURCE_PERSON" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_REVIEW" | "STARTUP_MENTORING" | "CAREER_GUIDANCE" | "MOCK_INTERVIEW" | "TECHNICAL_REVIEW" | "HACKATHON_JUDGE" | "PROJECT_EVALUATOR" | undefined;
    status?: "DRAFT" | "CLOSED" | "CANCELLED" | "OPEN" | "FULFILLED" | "SHORTLISTED" | "MATCHING" | "ENGAGEMENT_IN_PROGRESS" | "PARTIALLY_FULFILLED" | undefined;
    title?: string | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    mode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "ANY" | null | undefined;
    sourceReference?: string | null | undefined;
    domain?: string | null | undefined;
    programme?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    sourceType?: "OTHER" | "MENTORING" | "ADHOC" | "STUDENT_PROJECT" | "TPMS" | "ALUMNI_EVENT" | "TRAINING_MOCK_INTERVIEW" | "CRM_OPPORTUNITY" | undefined;
    location?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    skillsTopics?: string[] | undefined;
    targetBeneficiaries?: {
        summary?: string | null | undefined;
        refs?: {
            beneficiaryType: "STUDENT" | "FACULTY" | "OTHER" | "PROJECT" | "DEPARTMENT" | "STUDENT_GROUP" | "PROGRAMME" | "STARTUP_TEAM";
            beneficiaryRef: string;
            label?: string | null | undefined;
        }[] | undefined;
    } | null | undefined;
    quantityRequired?: number | null | undefined;
}>;
export declare const shortlistSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    reasonNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    allocatedQuantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    matchSnapshot: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strict", z.ZodTypeAny, {
    alumniProfileId: number;
    reasonNotes?: string | null | undefined;
    allocatedQuantity?: number | null | undefined;
    matchSnapshot?: Record<string, unknown> | null | undefined;
}, {
    alumniProfileId: number;
    reasonNotes?: string | null | undefined;
    allocatedQuantity?: number | null | undefined;
    matchSnapshot?: Record<string, unknown> | null | undefined;
}>;
export declare const dismissSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    reason: z.ZodEnum<["NOT_RELEVANT", "INSUFFICIENT_CAPABILITY", "TIMING", "ALREADY_ENGAGED", "DATA_STALE", "RELATIONSHIP_CONCERN", "OTHER"]>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason: "OTHER" | "NOT_RELEVANT" | "INSUFFICIENT_CAPABILITY" | "TIMING" | "ALREADY_ENGAGED" | "DATA_STALE" | "RELATIONSHIP_CONCERN";
    alumniProfileId: number;
    notes?: string | null | undefined;
}, {
    reason: "OTHER" | "NOT_RELEVANT" | "INSUFFICIENT_CAPABILITY" | "TIMING" | "ALREADY_ENGAGED" | "DATA_STALE" | "RELATIONSHIP_CONCERN";
    alumniProfileId: number;
    notes?: string | null | undefined;
}>;
export declare const engageHandoffSchema: z.ZodObject<{
    channel: z.ZodOptional<z.ZodEnum<["EMAIL", "PHONE", "MANUAL", "IN_PERSON", "OTHER"]>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    createProgramIfMissing: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    programId?: number | null | undefined;
    purpose?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | undefined;
    createProgramIfMissing?: boolean | undefined;
}, {
    programId?: number | null | undefined;
    purpose?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | undefined;
    createProgramIfMissing?: boolean | undefined;
}>;
export declare const opportunityHandoffSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedOutcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    allocatedQuantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    expectedOutcome?: string | null | undefined;
    allocatedQuantity?: number | null | undefined;
}, {
    title?: string | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    expectedOutcome?: string | null | undefined;
    allocatedQuantity?: number | null | undefined;
}>;
export declare const fulfilmentSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    shortlistId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    promisedQuantity: z.ZodOptional<z.ZodNumber>;
    confirmedQuantity: z.ZodOptional<z.ZodNumber>;
    verifiedQuantity: z.ZodOptional<z.ZodNumber>;
    crmOpportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    crmOutcomeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["PROMISED", "CONFIRMED", "VERIFIED", "WITHDRAWN"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    alumniProfileId: number;
    status?: "VERIFIED" | "CONFIRMED" | "WITHDRAWN" | "PROMISED" | undefined;
    notes?: string | null | undefined;
    shortlistId?: number | null | undefined;
    promisedQuantity?: number | undefined;
    confirmedQuantity?: number | undefined;
    verifiedQuantity?: number | undefined;
    crmOpportunityId?: number | null | undefined;
    crmOutcomeId?: number | null | undefined;
}, {
    alumniProfileId: number;
    status?: "VERIFIED" | "CONFIRMED" | "WITHDRAWN" | "PROMISED" | undefined;
    notes?: string | null | undefined;
    shortlistId?: number | null | undefined;
    promisedQuantity?: number | undefined;
    confirmedQuantity?: number | undefined;
    verifiedQuantity?: number | undefined;
    crmOpportunityId?: number | null | undefined;
    crmOutcomeId?: number | null | undefined;
}>;
export declare const evaluateOptsSchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodNumber>;
    includeLimited: z.ZodOptional<z.ZodBoolean>;
    alumniProfileIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    limit?: number | undefined;
    alumniProfileIds?: number[] | undefined;
    includeLimited?: boolean | undefined;
}, {
    limit?: number | undefined;
    alumniProfileIds?: number[] | undefined;
    includeLimited?: boolean | undefined;
}>;
