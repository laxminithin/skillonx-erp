/**
 * Alumni Engagement & Campaign Orchestration (C4) — types & Zod schemas.
 * Orchestration only — no fake channel delivery telemetry.
 */
import { z } from 'zod';
export declare const ENGAGEMENT_CATEGORIES: readonly ["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"];
export type EngagementCategory = (typeof ENGAGEMENT_CATEGORIES)[number];
export declare const PROGRAM_STATUSES: readonly ["DRAFT", "PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
export declare const CAMPAIGN_STATUSES: readonly ["DRAFT", "READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"];
export declare const VALUE_EXCHANGE: readonly ["VALUE_TO_ALUMNI", "VALUE_TO_INSTITUTION", "MUTUAL_VALUE"];
export declare const CHANNEL_TYPES: readonly ["EMAIL", "WHATSAPP", "SMS", "PHONE", "IN_PERSON", "PORTAL_NOTIFICATION", "MANUAL", "OTHER"];
export type ChannelType = (typeof CHANNEL_TYPES)[number];
export declare const CHANNEL_CAPABILITIES: readonly ["MANUAL_ONLY", "CONFIGURED", "UNAVAILABLE"];
export type ChannelCapability = (typeof CHANNEL_CAPABILITIES)[number];
export declare const ELIGIBILITY_STATES: readonly ["ELIGIBLE", "SUPPRESSED", "REQUIRES_REVIEW"];
export type EligibilityState = (typeof ELIGIBILITY_STATES)[number];
export declare const FUNNEL_STAGES: readonly ["TARGETED", "ELIGIBLE", "CONTACTED", "RESPONDED", "INTERESTED", "OPPORTUNITY_CREATED", "ACTION_IN_PROGRESS", "OUTCOME_VERIFIED"];
export declare const CONTACT_STATUSES: readonly ["NOT_CONTACTED", "CONTACTED", "NO_RESPONSE", "RESPONDED", "INTERESTED", "DECLINED", "WRONG_CONTACT", "FOLLOW_UP"];
export declare const MANUAL_OUTCOMES: readonly ["NO_ANSWER", "RESPONDED", "INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "WRONG_CONTACT"];
export declare const AUDIENCE_SOURCE_TYPES: readonly ["SAVED_SEGMENT", "DYNAMIC_RULES", "EXPLICIT_IDS", "FILTERS", "EVENT_PARTICIPANTS", "RELATIONSHIP_CONTEXT"];
export declare const SAFE_TEMPLATE_VARS: readonly ["alumni_name", "programme", "graduation_year", "institution_name", "event_name", "response_link", "department", "campaign_name", "program_name"];
export declare const RESPONSE_ACTION_TYPES: readonly ["MENTORSHIP_INTEREST", "RECRUITMENT_SUPPORT", "EVENT_RSVP", "EXPERT_SESSION_INTEREST", "RESEARCH_INTEREST", "DATA_REFRESH", "GENERIC_YES_NO", "PREFERENCE_UPDATE"];
export declare const audienceSourceSchema: z.ZodObject<{
    type: z.ZodEnum<["SAVED_SEGMENT", "DYNAMIC_RULES", "EXPLICIT_IDS", "FILTERS", "EVENT_PARTICIPANTS", "RELATIONSHIP_CONTEXT"]>;
    savedSegmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ruleDefinition: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    preset: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dimension: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    alumniProfileIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    filters: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        graduationYearMin: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        graduationYearMax: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        batchLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        departmentId?: number | null | undefined;
        graduationYear?: number | null | undefined;
        batchLabel?: string | null | undefined;
        graduationYearMin?: number | null | undefined;
        graduationYearMax?: number | null | undefined;
        programmeId?: number | null | undefined;
    }, {
        departmentId?: number | null | undefined;
        graduationYear?: number | null | undefined;
        batchLabel?: string | null | undefined;
        graduationYearMin?: number | null | undefined;
        graduationYearMax?: number | null | undefined;
        programmeId?: number | null | undefined;
    }>>>;
    eventId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    opportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
    opportunityId?: number | null | undefined;
    preset?: string | null | undefined;
    eventId?: number | null | undefined;
    dimension?: string | null | undefined;
    filters?: {
        departmentId?: number | null | undefined;
        graduationYear?: number | null | undefined;
        batchLabel?: string | null | undefined;
        graduationYearMin?: number | null | undefined;
        graduationYearMax?: number | null | undefined;
        programmeId?: number | null | undefined;
    } | null | undefined;
    ruleDefinition?: Record<string, unknown> | null | undefined;
    savedSegmentId?: number | null | undefined;
    alumniProfileIds?: number[] | null | undefined;
}, {
    type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
    opportunityId?: number | null | undefined;
    preset?: string | null | undefined;
    eventId?: number | null | undefined;
    dimension?: string | null | undefined;
    filters?: {
        departmentId?: number | null | undefined;
        graduationYear?: number | null | undefined;
        batchLabel?: string | null | undefined;
        graduationYearMin?: number | null | undefined;
        graduationYearMax?: number | null | undefined;
        programmeId?: number | null | undefined;
    } | null | undefined;
    ruleDefinition?: Record<string, unknown> | null | undefined;
    savedSegmentId?: number | null | undefined;
    alumniProfileIds?: number[] | null | undefined;
}>;
export declare const programCreateSchema: z.ZodObject<{
    name: z.ZodString;
    objective: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodEnum<["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"]>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    scope: z.ZodOptional<z.ZodEnum<["INSTITUTION", "DEPARTMENT"]>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]>>;
    targetDefinition: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    successDefinition: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    valueExchange: z.ZodOptional<z.ZodEnum<["VALUE_TO_ALUMNI", "VALUE_TO_INSTITUTION", "MUTUAL_VALUE"]>>;
    valueToAlumni: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    valueToInstitution: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "PLANNED" | "PAUSED" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    scope?: "INSTITUTION" | "DEPARTMENT" | undefined;
    academicYear?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    objective?: string | null | undefined;
    targetDefinition?: Record<string, unknown> | null | undefined;
    successDefinition?: string | null | undefined;
    valueExchange?: "VALUE_TO_ALUMNI" | "VALUE_TO_INSTITUTION" | "MUTUAL_VALUE" | undefined;
    valueToAlumni?: string | null | undefined;
    valueToInstitution?: string | null | undefined;
}, {
    name: string;
    status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "PLANNED" | "PAUSED" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    scope?: "INSTITUTION" | "DEPARTMENT" | undefined;
    academicYear?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    objective?: string | null | undefined;
    targetDefinition?: Record<string, unknown> | null | undefined;
    successDefinition?: string | null | undefined;
    valueExchange?: "VALUE_TO_ALUMNI" | "VALUE_TO_INSTITUTION" | "MUTUAL_VALUE" | undefined;
    valueToAlumni?: string | null | undefined;
    valueToInstitution?: string | null | undefined;
}>;
export declare const programPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    objective: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"]>>>;
    academicYear: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    scope: z.ZodOptional<z.ZodOptional<z.ZodEnum<["INSTITUTION", "DEPARTMENT"]>>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["DRAFT", "PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]>>>;
    targetDefinition: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    successDefinition: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    valueExchange: z.ZodOptional<z.ZodOptional<z.ZodEnum<["VALUE_TO_ALUMNI", "VALUE_TO_INSTITUTION", "MUTUAL_VALUE"]>>>;
    valueToAlumni: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    valueToInstitution: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strict", z.ZodTypeAny, {
    status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "PLANNED" | "PAUSED" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    name?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    scope?: "INSTITUTION" | "DEPARTMENT" | undefined;
    academicYear?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    objective?: string | null | undefined;
    targetDefinition?: Record<string, unknown> | null | undefined;
    successDefinition?: string | null | undefined;
    valueExchange?: "VALUE_TO_ALUMNI" | "VALUE_TO_INSTITUTION" | "MUTUAL_VALUE" | undefined;
    valueToAlumni?: string | null | undefined;
    valueToInstitution?: string | null | undefined;
}, {
    status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "PLANNED" | "PAUSED" | undefined;
    departmentId?: number | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    name?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    scope?: "INSTITUTION" | "DEPARTMENT" | undefined;
    academicYear?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    objective?: string | null | undefined;
    targetDefinition?: Record<string, unknown> | null | undefined;
    successDefinition?: string | null | undefined;
    valueExchange?: "VALUE_TO_ALUMNI" | "VALUE_TO_INSTITUTION" | "MUTUAL_VALUE" | undefined;
    valueToAlumni?: string | null | undefined;
    valueToInstitution?: string | null | undefined;
}>;
export declare const campaignCreateSchema: z.ZodObject<{
    programId: z.ZodNumber;
    name: z.ZodString;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    channel: z.ZodOptional<z.ZodEnum<["EMAIL", "WHATSAPP", "SMS", "PHONE", "IN_PERSON", "PORTAL_NOTIFICATION", "MANUAL", "OTHER"]>>;
    templateId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    audienceSource: z.ZodObject<{
        type: z.ZodEnum<["SAVED_SEGMENT", "DYNAMIC_RULES", "EXPLICIT_IDS", "FILTERS", "EVENT_PARTICIPANTS", "RELATIONSHIP_CONTEXT"]>;
        savedSegmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        ruleDefinition: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        preset: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dimension: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        alumniProfileIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
        filters: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            graduationYearMin: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            graduationYearMax: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            batchLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        }, {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        }>>>;
        eventId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        opportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strict", z.ZodTypeAny, {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    }, {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    }>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"]>>;
    requiresApproval: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    name: string;
    programId: number;
    audienceSource: {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    };
    status?: "DRAFT" | "COMPLETED" | "APPROVED" | "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "READY_FOR_REVIEW" | undefined;
    departmentId?: number | null | undefined;
    scheduledAt?: string | null | undefined;
    purpose?: string | null | undefined;
    requiresApproval?: boolean | undefined;
    templateId?: number | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
    ownerFacultyId?: number | null | undefined;
}, {
    name: string;
    programId: number;
    audienceSource: {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    };
    status?: "DRAFT" | "COMPLETED" | "APPROVED" | "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "READY_FOR_REVIEW" | undefined;
    departmentId?: number | null | undefined;
    scheduledAt?: string | null | undefined;
    purpose?: string | null | undefined;
    requiresApproval?: boolean | undefined;
    templateId?: number | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
    ownerFacultyId?: number | null | undefined;
}>;
export declare const campaignPatchSchema: z.ZodObject<{
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    name: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>>;
    purpose: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    requiresApproval: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    templateId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    channel: z.ZodOptional<z.ZodOptional<z.ZodEnum<["EMAIL", "WHATSAPP", "SMS", "PHONE", "IN_PERSON", "PORTAL_NOTIFICATION", "MANUAL", "OTHER"]>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    audienceSource: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["SAVED_SEGMENT", "DYNAMIC_RULES", "EXPLICIT_IDS", "FILTERS", "EVENT_PARTICIPANTS", "RELATIONSHIP_CONTEXT"]>;
        savedSegmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        ruleDefinition: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        preset: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dimension: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        alumniProfileIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
        filters: z.ZodNullable<z.ZodOptional<z.ZodObject<{
            graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            graduationYearMin: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            graduationYearMax: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            batchLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        }, {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        }>>>;
        eventId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        opportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strict", z.ZodTypeAny, {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    }, {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    }>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "READY_FOR_REVIEW", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "DRAFT" | "COMPLETED" | "APPROVED" | "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "READY_FOR_REVIEW" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    scheduledAt?: string | null | undefined;
    purpose?: string | null | undefined;
    requiresApproval?: boolean | undefined;
    templateId?: number | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
    ownerFacultyId?: number | null | undefined;
    audienceSource?: {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    } | undefined;
}, {
    status?: "DRAFT" | "COMPLETED" | "APPROVED" | "CANCELLED" | "SCHEDULED" | "IN_PROGRESS" | "PAUSED" | "READY_FOR_REVIEW" | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    scheduledAt?: string | null | undefined;
    purpose?: string | null | undefined;
    requiresApproval?: boolean | undefined;
    templateId?: number | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
    ownerFacultyId?: number | null | undefined;
    audienceSource?: {
        type: "SAVED_SEGMENT" | "DYNAMIC_RULES" | "EXPLICIT_IDS" | "FILTERS" | "EVENT_PARTICIPANTS" | "RELATIONSHIP_CONTEXT";
        opportunityId?: number | null | undefined;
        preset?: string | null | undefined;
        eventId?: number | null | undefined;
        dimension?: string | null | undefined;
        filters?: {
            departmentId?: number | null | undefined;
            graduationYear?: number | null | undefined;
            batchLabel?: string | null | undefined;
            graduationYearMin?: number | null | undefined;
            graduationYearMax?: number | null | undefined;
            programmeId?: number | null | undefined;
        } | null | undefined;
        ruleDefinition?: Record<string, unknown> | null | undefined;
        savedSegmentId?: number | null | undefined;
        alumniProfileIds?: number[] | null | undefined;
    } | undefined;
}>;
export declare const templateCreateSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"]>>;
    channel: z.ZodOptional<z.ZodEnum<["EMAIL", "WHATSAPP", "SMS", "PHONE", "IN_PERSON", "PORTAL_NOTIFICATION", "MANUAL", "OTHER"]>>;
    subject: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    body: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
    body: string;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    subject?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
}, {
    name: string;
    body: string;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    subject?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
}>;
export declare const templatePatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodOptional<z.ZodEnum<["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"]>>>;
    channel: z.ZodOptional<z.ZodOptional<z.ZodEnum<["EMAIL", "WHATSAPP", "SMS", "PHONE", "IN_PERSON", "PORTAL_NOTIFICATION", "MANUAL", "OTHER"]>>>;
    subject: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    body: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    body?: string | undefined;
    subject?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
}, {
    name?: string | undefined;
    category?: "OTHER" | "ENTREPRENEURSHIP" | "INTERNSHIP" | "RESEARCH" | "CAREER" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "RECOGNITION" | "EXPERT_SESSION" | "INDUSTRY_CONNECT" | "DATA_REFRESH" | "NETWORKING" | "LEARNING" | "INSTITUTION_UPDATE" | "REUNION" | undefined;
    body?: string | undefined;
    subject?: string | null | undefined;
    channel?: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION" | undefined;
}>;
export declare const approvalDecisionSchema: z.ZodObject<{
    decision: z.ZodEnum<["APPROVED", "REJECTED"]>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    step: z.ZodOptional<z.ZodEnum<["HOD_REVIEW", "ALUMNI_TP_REVIEW", "INSTITUTIONAL"]>>;
}, "strict", z.ZodTypeAny, {
    decision: "APPROVED" | "REJECTED";
    notes?: string | null | undefined;
    step?: "INSTITUTIONAL" | "HOD_REVIEW" | "ALUMNI_TP_REVIEW" | undefined;
}, {
    decision: "APPROVED" | "REJECTED";
    notes?: string | null | undefined;
    step?: "INSTITUTIONAL" | "HOD_REVIEW" | "ALUMNI_TP_REVIEW" | undefined;
}>;
export declare const suppressOverrideSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const manualExecutionSchema: z.ZodObject<{
    outcome: z.ZodEnum<["NO_ANSWER", "RESPONDED", "INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "WRONG_CONTACT"]>;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    followUpRequired: z.ZodOptional<z.ZodBoolean>;
    nextActionAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nextActionSummary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    createOpportunity: z.ZodOptional<z.ZodBoolean>;
    opportunityType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    opportunityTitle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    outcome: "FOLLOW_UP" | "RESPONDED" | "WRONG_CONTACT" | "INTERESTED" | "NO_ANSWER" | "NOT_INTERESTED";
    opportunityType?: string | null | undefined;
    summary?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    createOpportunity?: boolean | undefined;
    opportunityTitle?: string | null | undefined;
}, {
    outcome: "FOLLOW_UP" | "RESPONDED" | "WRONG_CONTACT" | "INTERESTED" | "NO_ANSWER" | "NOT_INTERESTED";
    opportunityType?: string | null | undefined;
    summary?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    createOpportunity?: boolean | undefined;
    opportunityTitle?: string | null | undefined;
}>;
export declare const responseSubmitSchema: z.ZodObject<{
    token: z.ZodString;
    choice: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    form: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strict", z.ZodTypeAny, {
    token: string;
    choice?: string | null | undefined;
    form?: Record<string, unknown> | null | undefined;
}, {
    token: string;
    choice?: string | null | undefined;
    form?: Record<string, unknown> | null | undefined;
}>;
export declare const preferenceCentreSchema: z.ZodObject<{
    commEmailOptIn: z.ZodOptional<z.ZodBoolean>;
    commSmsOptIn: z.ZodOptional<z.ZodBoolean>;
    commPhoneOptIn: z.ZodOptional<z.ZodBoolean>;
    commWhatsappOptIn: z.ZodOptional<z.ZodBoolean>;
    prefEventsOptIn: z.ZodOptional<z.ZodBoolean>;
    prefMentorshipOptIn: z.ZodOptional<z.ZodBoolean>;
    prefRecruitmentOptIn: z.ZodOptional<z.ZodBoolean>;
    prefNetworkingOptIn: z.ZodOptional<z.ZodBoolean>;
    prefResearchOptIn: z.ZodOptional<z.ZodBoolean>;
    prefEntrepreneurshipOptIn: z.ZodOptional<z.ZodBoolean>;
    prefContributionOptIn: z.ZodOptional<z.ZodBoolean>;
    prefInstitutionUpdatesOptIn: z.ZodOptional<z.ZodBoolean>;
    globalCommOptOut: z.ZodOptional<z.ZodBoolean>;
    globalOptOutReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    temporaryUnavailableUntil: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    temporaryUnavailableReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    commEmailOptIn?: boolean | undefined;
    commSmsOptIn?: boolean | undefined;
    commPhoneOptIn?: boolean | undefined;
    commWhatsappOptIn?: boolean | undefined;
    prefEventsOptIn?: boolean | undefined;
    prefMentorshipOptIn?: boolean | undefined;
    prefRecruitmentOptIn?: boolean | undefined;
    prefNetworkingOptIn?: boolean | undefined;
    prefResearchOptIn?: boolean | undefined;
    prefEntrepreneurshipOptIn?: boolean | undefined;
    prefContributionOptIn?: boolean | undefined;
    prefInstitutionUpdatesOptIn?: boolean | undefined;
    globalCommOptOut?: boolean | undefined;
    globalOptOutReason?: string | null | undefined;
    temporaryUnavailableUntil?: string | null | undefined;
    temporaryUnavailableReason?: string | null | undefined;
}, {
    commEmailOptIn?: boolean | undefined;
    commSmsOptIn?: boolean | undefined;
    commPhoneOptIn?: boolean | undefined;
    commWhatsappOptIn?: boolean | undefined;
    prefEventsOptIn?: boolean | undefined;
    prefMentorshipOptIn?: boolean | undefined;
    prefRecruitmentOptIn?: boolean | undefined;
    prefNetworkingOptIn?: boolean | undefined;
    prefResearchOptIn?: boolean | undefined;
    prefEntrepreneurshipOptIn?: boolean | undefined;
    prefContributionOptIn?: boolean | undefined;
    prefInstitutionUpdatesOptIn?: boolean | undefined;
    globalCommOptOut?: boolean | undefined;
    globalOptOutReason?: string | null | undefined;
    temporaryUnavailableUntil?: string | null | undefined;
    temporaryUnavailableReason?: string | null | undefined;
}>;
export declare const recognitionNomSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    campaignId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodString;
    rationale: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceRefs: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    alumniProfileId: number;
    programId?: number | null | undefined;
    rationale?: string | null | undefined;
    campaignId?: number | null | undefined;
    evidenceRefs?: Record<string, unknown>[] | null | undefined;
}, {
    title: string;
    alumniProfileId: number;
    programId?: number | null | undefined;
    rationale?: string | null | undefined;
    campaignId?: number | null | undefined;
    evidenceRefs?: Record<string, unknown>[] | null | undefined;
}>;
export declare const fatigueRuleSchema: z.ZodObject<{
    categoryCode: z.ZodString;
    minDaysBetweenEquivalent: z.ZodOptional<z.ZodNumber>;
    warnRecentContactDays: z.ZodOptional<z.ZodNumber>;
    suppressActiveOpportunity: z.ZodOptional<z.ZodBoolean>;
    suppressOpenFollowup: z.ZodOptional<z.ZodBoolean>;
    warnOpenFollowup: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    categoryCode: string;
    isActive?: boolean | undefined;
    minDaysBetweenEquivalent?: number | undefined;
    warnRecentContactDays?: number | undefined;
    suppressActiveOpportunity?: boolean | undefined;
    suppressOpenFollowup?: boolean | undefined;
    warnOpenFollowup?: boolean | undefined;
}, {
    categoryCode: string;
    isActive?: boolean | undefined;
    minDaysBetweenEquivalent?: number | undefined;
    warnRecentContactDays?: number | undefined;
    suppressActiveOpportunity?: boolean | undefined;
    suppressOpenFollowup?: boolean | undefined;
    warnOpenFollowup?: boolean | undefined;
}>;
export declare const issueTokenSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    campaignId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    recipientId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    actionType: z.ZodEnum<["MENTORSHIP_INTEREST", "RECRUITMENT_SUPPORT", "EVENT_RSVP", "EXPERT_SESSION_INTEREST", "RESEARCH_INTEREST", "DATA_REFRESH", "GENERIC_YES_NO", "PREFERENCE_UPDATE"]>;
    actionPayload: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    expiresInHours: z.ZodOptional<z.ZodNumber>;
    maxUses: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    actionType: "DATA_REFRESH" | "MENTORSHIP_INTEREST" | "RECRUITMENT_SUPPORT" | "EVENT_RSVP" | "EXPERT_SESSION_INTEREST" | "RESEARCH_INTEREST" | "GENERIC_YES_NO" | "PREFERENCE_UPDATE";
    alumniProfileId: number;
    campaignId?: number | null | undefined;
    recipientId?: number | null | undefined;
    actionPayload?: Record<string, unknown> | null | undefined;
    expiresInHours?: number | undefined;
    maxUses?: number | undefined;
}, {
    actionType: "DATA_REFRESH" | "MENTORSHIP_INTEREST" | "RECRUITMENT_SUPPORT" | "EVENT_RSVP" | "EXPERT_SESSION_INTEREST" | "RESEARCH_INTEREST" | "GENERIC_YES_NO" | "PREFERENCE_UPDATE";
    alumniProfileId: number;
    campaignId?: number | null | undefined;
    recipientId?: number | null | undefined;
    actionPayload?: Record<string, unknown> | null | undefined;
    expiresInHours?: number | undefined;
    maxUses?: number | undefined;
}>;
/** Map engagement category → C1 willingness key / topic preference. */
export declare const CATEGORY_WILLINGNESS_KEY: Partial<Record<EngagementCategory, string>>;
export declare const CATEGORY_PREF_COL: Partial<Record<EngagementCategory, string>>;
export declare const CHANNEL_PREF_COL: Partial<Record<ChannelType, string>>;
