/**
 * Alumni Relationship CRM (C2) — shared types and Zod schemas.
 * No scoring / AI / campaign orchestration.
 */
import { z } from 'zod';
export declare const RELATIONSHIP_STAGES: readonly ["IDENTIFIED", "REACHABLE", "CONTACTED", "RESPONDED", "ENGAGED", "OPPORTUNITY_IDENTIFIED", "ACTION_IN_PROGRESS", "OUTCOME_ACHIEVED", "REPEAT_ENGAGEMENT"];
export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number];
export declare const STAGE_RANK: Record<RelationshipStage, number>;
export declare const RELATIONSHIP_STATUSES: readonly ["ACTIVE", "DORMANT", "CLOSED", "ON_HOLD"];
export declare const OWNER_TYPES: readonly ["ALUMNI_OFFICER", "TP_OFFICER", "FACULTY", "HOD", "PRINCIPAL_TEAM", "OTHER"];
export declare const INTERACTION_TYPES: readonly ["PHONE_CALL", "EMAIL", "WHATSAPP", "SMS", "IN_PERSON", "VIDEO_CALL", "EVENT", "MENTORING", "RECRUITMENT", "INTERNSHIP", "PROJECT", "EXPERT_SESSION", "BOS_ADVISORY", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "CONTRIBUTION", "RECOGNITION", "PROFILE_UPDATE", "OTHER"];
export declare const CONTACT_OUTCOMES: readonly ["CONTACTED", "NO_RESPONSE", "RESPONDED", "DECLINED", "WRONG_CONTACT", "FOLLOW_UP", "COMPLETED"];
export declare const CAPTURE_MODES: readonly ["MANUAL", "SYSTEM_PROJECTED", "INTEGRATED"];
export declare const FOLLOWUP_STATUSES: readonly ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"];
export declare const FOLLOWUP_PRIORITIES: readonly ["LOW", "NORMAL", "HIGH", "URGENT"];
export declare const CRM_OPPORTUNITY_TYPES: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CONTRIBUTION", "OTHER"];
export declare const CRM_OPPORTUNITY_STATUSES: readonly ["IDENTIFIED", "QUALIFYING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "DECLINED", "CANCELLED"];
export declare const OUTCOME_TYPES: readonly ["STUDENTS_MENTORED", "INTERNSHIPS_ENABLED", "PLACEMENTS_SUPPORTED", "JOBS_REFERRED", "EXPERT_SESSIONS_DELIVERED", "PROJECTS_SUPPORTED", "RESEARCH_COLLABORATIONS", "INDUSTRY_VISITS", "STARTUP_SUPPORT", "BOS_PARTICIPATION", "FINANCIAL_CONTRIBUTION", "NON_FINANCIAL_CONTRIBUTION", "OTHER"];
export declare const OUTCOME_VERIFICATION: readonly ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];
export declare const NOTE_TYPES: readonly ["GENERAL_RELATIONSHIP_NOTE", "FOLLOW_UP_NOTE", "OPPORTUNITY_NOTE", "INTERNAL_NOTE"];
export declare const NOTE_VISIBILITY: readonly ["INSTITUTIONAL", "INTERNAL", "ALUMNI_VISIBLE"];
export declare const interactionCreateSchema: z.ZodObject<{
    interactionType: z.ZodEnum<["PHONE_CALL", "EMAIL", "WHATSAPP", "SMS", "IN_PERSON", "VIDEO_CALL", "EVENT", "MENTORING", "RECRUITMENT", "INTERNSHIP", "PROJECT", "EXPERT_SESSION", "BOS_ADVISORY", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "CONTRIBUTION", "RECOGNITION", "PROFILE_UPDATE", "OTHER"]>;
    channel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    direction: z.ZodOptional<z.ZodEnum<["OUTBOUND", "INBOUND", "INTERNAL"]>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    summary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    outcomeStatus: z.ZodNullable<z.ZodOptional<z.ZodEnum<["CONTACTED", "NO_RESPONSE", "RESPONDED", "DECLINED", "WRONG_CONTACT", "FOLLOW_UP", "COMPLETED"]>>>;
    occurredAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    participantFacultyIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    followUpRequired: z.ZodOptional<z.ZodBoolean>;
    nextActionAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nextActionSummary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    relatedOpportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    visibility: z.ZodOptional<z.ZodEnum<["INSTITUTIONAL", "ALUMNI_VISIBLE", "INTERNAL"]>>;
    evidenceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isContactAttempt: z.ZodOptional<z.ZodBoolean>;
    isMeaningfulEngagement: z.ZodOptional<z.ZodBoolean>;
    /** INTEGRATED only when a real integration is wired — default MANUAL. */
    captureMode: z.ZodOptional<z.ZodEnum<["MANUAL", "INTEGRATED"]>>;
}, "strict", z.ZodTypeAny, {
    interactionType: "EVENT" | "OTHER" | "INTERNSHIP" | "PROJECT" | "IN_PERSON" | "MENTORING" | "EMAIL" | "RECRUITMENT" | "CONTRIBUTION" | "RECOGNITION" | "PHONE_CALL" | "WHATSAPP" | "SMS" | "VIDEO_CALL" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROFILE_UPDATE";
    occurredAt: string;
    direction?: "INTERNAL" | "INBOUND" | "OUTBOUND" | undefined;
    summary?: string | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    purpose?: string | null | undefined;
    evidenceReference?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    channel?: string | null | undefined;
    outcomeStatus?: "COMPLETED" | "DECLINED" | "FOLLOW_UP" | "CONTACTED" | "RESPONDED" | "NO_RESPONSE" | "WRONG_CONTACT" | null | undefined;
    participantFacultyIds?: number[] | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    relatedOpportunityId?: number | null | undefined;
    isContactAttempt?: boolean | undefined;
    isMeaningfulEngagement?: boolean | undefined;
    captureMode?: "MANUAL" | "INTEGRATED" | undefined;
}, {
    interactionType: "EVENT" | "OTHER" | "INTERNSHIP" | "PROJECT" | "IN_PERSON" | "MENTORING" | "EMAIL" | "RECRUITMENT" | "CONTRIBUTION" | "RECOGNITION" | "PHONE_CALL" | "WHATSAPP" | "SMS" | "VIDEO_CALL" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROFILE_UPDATE";
    occurredAt: string;
    direction?: "INTERNAL" | "INBOUND" | "OUTBOUND" | undefined;
    summary?: string | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    purpose?: string | null | undefined;
    evidenceReference?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    channel?: string | null | undefined;
    outcomeStatus?: "COMPLETED" | "DECLINED" | "FOLLOW_UP" | "CONTACTED" | "RESPONDED" | "NO_RESPONSE" | "WRONG_CONTACT" | null | undefined;
    participantFacultyIds?: number[] | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    relatedOpportunityId?: number | null | undefined;
    isContactAttempt?: boolean | undefined;
    isMeaningfulEngagement?: boolean | undefined;
    captureMode?: "MANUAL" | "INTEGRATED" | undefined;
}>;
export declare const interactionPatchSchema: z.ZodObject<{
    interactionType: z.ZodOptional<z.ZodEnum<["PHONE_CALL", "EMAIL", "WHATSAPP", "SMS", "IN_PERSON", "VIDEO_CALL", "EVENT", "MENTORING", "RECRUITMENT", "INTERNSHIP", "PROJECT", "EXPERT_SESSION", "BOS_ADVISORY", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "CONTRIBUTION", "RECOGNITION", "PROFILE_UPDATE", "OTHER"]>>;
    channel: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    direction: z.ZodOptional<z.ZodOptional<z.ZodEnum<["OUTBOUND", "INBOUND", "INTERNAL"]>>>;
    purpose: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    outcomeStatus: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<["CONTACTED", "NO_RESPONSE", "RESPONDED", "DECLINED", "WRONG_CONTACT", "FOLLOW_UP", "COMPLETED"]>>>>;
    occurredAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    participantFacultyIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    followUpRequired: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    nextActionAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    nextActionSummary: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    relatedOpportunityId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodEnum<["INSTITUTIONAL", "ALUMNI_VISIBLE", "INTERNAL"]>>>;
    evidenceReference: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    isContactAttempt: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isMeaningfulEngagement: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    captureMode: z.ZodOptional<z.ZodOptional<z.ZodEnum<["MANUAL", "INTEGRATED"]>>>;
}, "strict", z.ZodTypeAny, {
    direction?: "INTERNAL" | "INBOUND" | "OUTBOUND" | undefined;
    summary?: string | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    purpose?: string | null | undefined;
    evidenceReference?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    interactionType?: "EVENT" | "OTHER" | "INTERNSHIP" | "PROJECT" | "IN_PERSON" | "MENTORING" | "EMAIL" | "RECRUITMENT" | "CONTRIBUTION" | "RECOGNITION" | "PHONE_CALL" | "WHATSAPP" | "SMS" | "VIDEO_CALL" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROFILE_UPDATE" | undefined;
    channel?: string | null | undefined;
    outcomeStatus?: "COMPLETED" | "DECLINED" | "FOLLOW_UP" | "CONTACTED" | "RESPONDED" | "NO_RESPONSE" | "WRONG_CONTACT" | null | undefined;
    occurredAt?: string | undefined;
    participantFacultyIds?: number[] | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    relatedOpportunityId?: number | null | undefined;
    isContactAttempt?: boolean | undefined;
    isMeaningfulEngagement?: boolean | undefined;
    captureMode?: "MANUAL" | "INTEGRATED" | undefined;
}, {
    direction?: "INTERNAL" | "INBOUND" | "OUTBOUND" | undefined;
    summary?: string | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    purpose?: string | null | undefined;
    evidenceReference?: string | null | undefined;
    followUpRequired?: boolean | undefined;
    interactionType?: "EVENT" | "OTHER" | "INTERNSHIP" | "PROJECT" | "IN_PERSON" | "MENTORING" | "EMAIL" | "RECRUITMENT" | "CONTRIBUTION" | "RECOGNITION" | "PHONE_CALL" | "WHATSAPP" | "SMS" | "VIDEO_CALL" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROFILE_UPDATE" | undefined;
    channel?: string | null | undefined;
    outcomeStatus?: "COMPLETED" | "DECLINED" | "FOLLOW_UP" | "CONTACTED" | "RESPONDED" | "NO_RESPONSE" | "WRONG_CONTACT" | null | undefined;
    occurredAt?: string | undefined;
    participantFacultyIds?: number[] | undefined;
    nextActionAt?: string | null | undefined;
    nextActionSummary?: string | null | undefined;
    relatedOpportunityId?: number | null | undefined;
    isContactAttempt?: boolean | undefined;
    isMeaningfulEngagement?: boolean | undefined;
    captureMode?: "MANUAL" | "INTEGRATED" | undefined;
}>;
export declare const followupCreateSchema: z.ZodObject<{
    reason: z.ZodString;
    dueDate: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    interactionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    opportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    reason: string;
    dueDate: string;
    departmentId?: number | null | undefined;
    notes?: string | null | undefined;
    opportunityId?: number | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    ownerFacultyId?: number | undefined;
    interactionId?: number | null | undefined;
}, {
    reason: string;
    dueDate: string;
    departmentId?: number | null | undefined;
    notes?: string | null | undefined;
    opportunityId?: number | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    ownerFacultyId?: number | undefined;
    interactionId?: number | null | undefined;
}>;
export declare const followupPatchSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodOptional<z.ZodNumber>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN" | "OVERDUE" | undefined;
    departmentId?: number | null | undefined;
    reason?: string | undefined;
    notes?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    dueDate?: string | undefined;
    ownerFacultyId?: number | undefined;
}, {
    status?: "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "OPEN" | "OVERDUE" | undefined;
    departmentId?: number | null | undefined;
    reason?: string | undefined;
    notes?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    dueDate?: string | undefined;
    ownerFacultyId?: number | undefined;
}>;
export declare const opportunityCreateSchema: z.ZodObject<{
    opportunityType: z.ZodEnum<["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CONTRIBUTION", "OTHER"]>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ownerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    expectedOutcome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceInteractionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["IDENTIFIED", "QUALIFYING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "DECLINED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    opportunityType: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION";
    status?: "IDENTIFIED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "DECLINED" | "IN_PROGRESS" | "QUALIFYING" | undefined;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    expectedOutcome?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    sourceInteractionId?: number | null | undefined;
}, {
    title: string;
    opportunityType: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION";
    status?: "IDENTIFIED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "DECLINED" | "IN_PROGRESS" | "QUALIFYING" | undefined;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    expectedOutcome?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    sourceInteractionId?: number | null | undefined;
}>;
export declare const opportunityPatchSchema: z.ZodObject<{
    opportunityType: z.ZodOptional<z.ZodEnum<["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CONTRIBUTION", "OTHER"]>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ownerFacultyId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    expectedOutcome: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    targetDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    sourceInteractionId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["IDENTIFIED", "QUALIFYING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "DECLINED", "CANCELLED"]>>;
}, "strict", z.ZodTypeAny, {
    status?: "IDENTIFIED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "DECLINED" | "IN_PROGRESS" | "QUALIFYING" | undefined;
    title?: string | undefined;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    opportunityType?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | undefined;
    expectedOutcome?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    sourceInteractionId?: number | null | undefined;
}, {
    status?: "IDENTIFIED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "DECLINED" | "IN_PROGRESS" | "QUALIFYING" | undefined;
    title?: string | undefined;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    description?: string | null | undefined;
    opportunityType?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | undefined;
    expectedOutcome?: string | null | undefined;
    ownerFacultyId?: number | null | undefined;
    sourceInteractionId?: number | null | undefined;
}>;
export declare const outcomeCreateSchema: z.ZodObject<{
    outcomeType: z.ZodEnum<["STUDENTS_MENTORED", "INTERNSHIPS_ENABLED", "PLACEMENTS_SUPPORTED", "JOBS_REFERRED", "EXPERT_SESSIONS_DELIVERED", "PROJECTS_SUPPORTED", "RESEARCH_COLLABORATIONS", "INDUSTRY_VISITS", "STARTUP_SUPPORT", "BOS_PARTICIPATION", "FINANCIAL_CONTRIBUTION", "NON_FINANCIAL_CONTRIBUTION", "OTHER"]>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    beneficiaryType: z.ZodNullable<z.ZodOptional<z.ZodEnum<["STUDENT", "DEPARTMENT", "INSTITUTION", "OTHER"]>>>;
    beneficiaryRefs: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>>;
    sourceType: z.ZodOptional<z.ZodString>;
    sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    outcomeDate: z.ZodString;
    interactionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    outcomeType: "OTHER" | "STARTUP_SUPPORT" | "STUDENTS_MENTORED" | "INTERNSHIPS_ENABLED" | "PLACEMENTS_SUPPORTED" | "JOBS_REFERRED" | "EXPERT_SESSIONS_DELIVERED" | "PROJECTS_SUPPORTED" | "RESEARCH_COLLABORATIONS" | "INDUSTRY_VISITS" | "BOS_PARTICIPATION" | "FINANCIAL_CONTRIBUTION" | "NON_FINANCIAL_CONTRIBUTION";
    outcomeDate: string;
    description?: string | null | undefined;
    sourceReference?: string | null | undefined;
    sourceType?: string | undefined;
    evidenceReference?: string | null | undefined;
    quantity?: number | null | undefined;
    interactionId?: number | null | undefined;
    beneficiaryType?: "STUDENT" | "OTHER" | "INSTITUTION" | "DEPARTMENT" | null | undefined;
    beneficiaryRefs?: Record<string, unknown>[] | null | undefined;
}, {
    title: string;
    outcomeType: "OTHER" | "STARTUP_SUPPORT" | "STUDENTS_MENTORED" | "INTERNSHIPS_ENABLED" | "PLACEMENTS_SUPPORTED" | "JOBS_REFERRED" | "EXPERT_SESSIONS_DELIVERED" | "PROJECTS_SUPPORTED" | "RESEARCH_COLLABORATIONS" | "INDUSTRY_VISITS" | "BOS_PARTICIPATION" | "FINANCIAL_CONTRIBUTION" | "NON_FINANCIAL_CONTRIBUTION";
    outcomeDate: string;
    description?: string | null | undefined;
    sourceReference?: string | null | undefined;
    sourceType?: string | undefined;
    evidenceReference?: string | null | undefined;
    quantity?: number | null | undefined;
    interactionId?: number | null | undefined;
    beneficiaryType?: "STUDENT" | "OTHER" | "INSTITUTION" | "DEPARTMENT" | null | undefined;
    beneficiaryRefs?: Record<string, unknown>[] | null | undefined;
}>;
export declare const outcomeVerifySchema: z.ZodObject<{
    action: z.ZodEnum<["VERIFY", "REJECT"]>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "REJECT" | "VERIFY";
    notes?: string | null | undefined;
}, {
    action: "REJECT" | "VERIFY";
    notes?: string | null | undefined;
}>;
export declare const noteCreateSchema: z.ZodObject<{
    noteType: z.ZodEnum<["GENERAL_RELATIONSHIP_NOTE", "FOLLOW_UP_NOTE", "OPPORTUNITY_NOTE", "INTERNAL_NOTE"]>;
    body: z.ZodString;
    visibility: z.ZodOptional<z.ZodEnum<["INSTITUTIONAL", "INTERNAL", "ALUMNI_VISIBLE"]>>;
    followupId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    opportunityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    body: string;
    noteType: "GENERAL_RELATIONSHIP_NOTE" | "FOLLOW_UP_NOTE" | "OPPORTUNITY_NOTE" | "INTERNAL_NOTE";
    opportunityId?: number | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    followupId?: number | null | undefined;
}, {
    body: string;
    noteType: "GENERAL_RELATIONSHIP_NOTE" | "FOLLOW_UP_NOTE" | "OPPORTUNITY_NOTE" | "INTERNAL_NOTE";
    opportunityId?: number | null | undefined;
    visibility?: "INTERNAL" | "INSTITUTIONAL" | "ALUMNI_VISIBLE" | undefined;
    followupId?: number | null | undefined;
}>;
export declare const ownershipReassignSchema: z.ZodObject<{
    ownerFacultyId: z.ZodNullable<z.ZodNumber>;
    ownerType: z.ZodNullable<z.ZodEnum<["ALUMNI_OFFICER", "TP_OFFICER", "FACULTY", "HOD", "PRINCIPAL_TEAM", "OTHER"]>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reason: z.ZodString;
    collaboratorFacultyIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    reason: string;
    ownerFacultyId: number | null;
    ownerType: "FACULTY" | "HOD" | "OTHER" | "ALUMNI_OFFICER" | "TP_OFFICER" | "PRINCIPAL_TEAM" | null;
    departmentId?: number | null | undefined;
    collaboratorFacultyIds?: number[] | undefined;
}, {
    reason: string;
    ownerFacultyId: number | null;
    ownerType: "FACULTY" | "HOD" | "OTHER" | "ALUMNI_OFFICER" | "TP_OFFICER" | "PRINCIPAL_TEAM" | null;
    departmentId?: number | null | undefined;
    collaboratorFacultyIds?: number[] | undefined;
}>;
export declare const stageTransitionSchema: z.ZodObject<{
    toStage: z.ZodEnum<["IDENTIFIED", "REACHABLE", "CONTACTED", "RESPONDED", "ENGAGED", "OPPORTUNITY_IDENTIFIED", "ACTION_IN_PROGRESS", "OUTCOME_ACHIEVED", "REPEAT_ENGAGEMENT"]>;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    toStage: "IDENTIFIED" | "ACTION_IN_PROGRESS" | "CONTACTED" | "REACHABLE" | "RESPONDED" | "ENGAGED" | "OPPORTUNITY_IDENTIFIED" | "OUTCOME_ACHIEVED" | "REPEAT_ENGAGEMENT";
}, {
    reason: string;
    toStage: "IDENTIFIED" | "ACTION_IN_PROGRESS" | "CONTACTED" | "REACHABLE" | "RESPONDED" | "ENGAGED" | "OPPORTUNITY_IDENTIFIED" | "OUTCOME_ACHIEVED" | "REPEAT_ENGAGEMENT";
}>;
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
