/**
 * Alumni 360 — shared types, enums, and Zod schemas.
 * C1 foundation only; no CRM/scoring/campaigns.
 */
import { z } from 'zod';
export declare const SOURCE_TYPES: readonly ["ERP", "ALUMNI_SELF", "FACULTY", "STAFF", "TPMS", "FINANCE", "EVENT", "IMPORT", "REFERRAL", "EXTERNAL", "SYSTEM_INFERENCE", "ENGAGEMENT_RESPONSE"];
export type SourceType = (typeof SOURCE_TYPES)[number];
export declare const VERIFICATION_STATUSES: readonly ["AUTHORITATIVE", "SELF_DECLARED", "INSTITUTION_VERIFIED", "EXTERNALLY_VERIFIED", "INFERRED", "UNVERIFIED", "STALE"];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export declare const FRESHNESS_STATES: readonly ["VERIFIED_RECENTLY", "NEEDS_CONFIRMATION", "STALE", "UNVERIFIED"];
export type FreshnessState = (typeof FRESHNESS_STATES)[number];
export declare const COMPLETENESS_STATES: readonly ["COMPLETE", "PARTIAL", "NEEDS_UPDATE", "NOT_PROVIDED", "AUTHORITATIVE"];
export type CompletenessState = (typeof COMPLETENESS_STATES)[number];
export declare const WILLINGNESS_KEYS: readonly ["openToMentoring", "openToRecruitment", "openToInternships", "openToProjectMentoring", "openToExpertSessions", "openToBosAdvisory", "openToResearchCollaboration", "openToStartupMentoring", "openToIndustryCollaboration", "openToInstitutionalContribution"];
export declare const WILLINGNESS_DB: Record<(typeof WILLINGNESS_KEYS)[number], string>;
export declare const CAPABILITY_DOMAINS: readonly ["MENTORING", "RECRUITMENT", "ACADEMIC", "INNOVATION", "INDUSTRY", "CONTRIBUTION"];
export declare const DEFAULT_FRESHNESS: Record<string, {
    staleAfterDays: number;
    confirmAfterDays: number;
}>;
/** Authoritative fields alumni must never mutate. */
export declare const AUTHORITATIVE_PROFILE_FIELDS: Set<string>;
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
export declare const provenanceWriteSchema: z.ZodObject<{
    sourceType: z.ZodOptional<z.ZodEnum<["ERP", "ALUMNI_SELF", "FACULTY", "STAFF", "TPMS", "FINANCE", "EVENT", "IMPORT", "REFERRAL", "EXTERNAL", "SYSTEM_INFERENCE", "ENGAGEMENT_RESPONSE"]>>;
    sourceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    verificationStatus: z.ZodOptional<z.ZodEnum<["AUTHORITATIVE", "SELF_DECLARED", "INSTITUTION_VERIFIED", "EXTERNALLY_VERIFIED", "INFERRED", "UNVERIFIED", "STALE"]>>;
    confidence: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    evidenceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    sourceReference?: string | null | undefined;
    verificationStatus?: "INFERRED" | "SELF_DECLARED" | "AUTHORITATIVE" | "INSTITUTION_VERIFIED" | "EXTERNALLY_VERIFIED" | "UNVERIFIED" | "STALE" | undefined;
    confidence?: number | null | undefined;
    sourceType?: "EVENT" | "FACULTY" | "FINANCE" | "STAFF" | "ERP" | "REFERRAL" | "EXTERNAL" | "ALUMNI_SELF" | "TPMS" | "IMPORT" | "SYSTEM_INFERENCE" | "ENGAGEMENT_RESPONSE" | undefined;
    evidenceReference?: string | null | undefined;
}, {
    sourceReference?: string | null | undefined;
    verificationStatus?: "INFERRED" | "SELF_DECLARED" | "AUTHORITATIVE" | "INSTITUTION_VERIFIED" | "EXTERNALLY_VERIFIED" | "UNVERIFIED" | "STALE" | undefined;
    confidence?: number | null | undefined;
    sourceType?: "EVENT" | "FACULTY" | "FINANCE" | "STAFF" | "ERP" | "REFERRAL" | "EXTERNAL" | "ALUMNI_SELF" | "TPMS" | "IMPORT" | "SYSTEM_INFERENCE" | "ENGAGEMENT_RESPONSE" | undefined;
    evidenceReference?: string | null | undefined;
}>;
export declare const employment360Schema: z.ZodObject<{
    organization: z.ZodString;
    designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    industry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    functionalArea: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    seniority: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isCurrent: z.ZodOptional<z.ZodBoolean>;
    employmentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    organization: string;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    employmentType?: string | null | undefined;
    designation?: string | null | undefined;
    isCurrent?: boolean | undefined;
    location?: string | null | undefined;
    functionalArea?: string | null | undefined;
    seniority?: string | null | undefined;
}, {
    organization: string;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    employmentType?: string | null | undefined;
    designation?: string | null | undefined;
    isCurrent?: boolean | undefined;
    location?: string | null | undefined;
    functionalArea?: string | null | undefined;
    seniority?: string | null | undefined;
}>;
export declare const willingnessSchema: z.ZodObject<{
    openToMentoring: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToRecruitment: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToInternships: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToProjectMentoring: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToExpertSessions: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToBosAdvisory: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToResearchCollaboration: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToStartupMentoring: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToIndustryCollaboration: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    openToInstitutionalContribution: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    confirmNow: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    openToMentoring?: boolean | null | undefined;
    openToRecruitment?: boolean | null | undefined;
    openToInternships?: boolean | null | undefined;
    openToProjectMentoring?: boolean | null | undefined;
    openToExpertSessions?: boolean | null | undefined;
    openToBosAdvisory?: boolean | null | undefined;
    openToResearchCollaboration?: boolean | null | undefined;
    openToStartupMentoring?: boolean | null | undefined;
    openToIndustryCollaboration?: boolean | null | undefined;
    openToInstitutionalContribution?: boolean | null | undefined;
    confirmNow?: boolean | undefined;
}, {
    openToMentoring?: boolean | null | undefined;
    openToRecruitment?: boolean | null | undefined;
    openToInternships?: boolean | null | undefined;
    openToProjectMentoring?: boolean | null | undefined;
    openToExpertSessions?: boolean | null | undefined;
    openToBosAdvisory?: boolean | null | undefined;
    openToResearchCollaboration?: boolean | null | undefined;
    openToStartupMentoring?: boolean | null | undefined;
    openToIndustryCollaboration?: boolean | null | undefined;
    openToInstitutionalContribution?: boolean | null | undefined;
    confirmNow?: boolean | undefined;
}>;
export declare const capabilitySchema: z.ZodObject<{
    capabilityDomain: z.ZodEnum<["MENTORING", "RECRUITMENT", "ACADEMIC", "INNOVATION", "INDUSTRY", "CONTRIBUTION"]>;
    details: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    capabilityDomain: "ACADEMIC" | "MENTORING" | "INDUSTRY" | "INNOVATION" | "RECRUITMENT" | "CONTRIBUTION";
    isActive?: boolean | undefined;
    details?: Record<string, unknown> | null | undefined;
}, {
    capabilityDomain: "ACADEMIC" | "MENTORING" | "INDUSTRY" | "INNOVATION" | "RECRUITMENT" | "CONTRIBUTION";
    isActive?: boolean | undefined;
    details?: Record<string, unknown> | null | undefined;
}>;
export declare const expertiseSchema: z.ZodObject<{
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    domainsExpertise: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    industryExpertise: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    researchExpertise: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    certifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    technologies?: string[] | undefined;
    certifications?: string[] | undefined;
    skills?: string[] | undefined;
    domainsExpertise?: string[] | undefined;
    industryExpertise?: string[] | undefined;
    researchExpertise?: string[] | undefined;
}, {
    technologies?: string[] | undefined;
    certifications?: string[] | undefined;
    skills?: string[] | undefined;
    domainsExpertise?: string[] | undefined;
    industryExpertise?: string[] | undefined;
    researchExpertise?: string[] | undefined;
}>;
export declare const privacy360Schema: z.ZodObject<{
    emailVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    phoneVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    bioVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    employmentVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    socialVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    networkingVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    directoryVisible: z.ZodOptional<z.ZodBoolean>;
    connectionVisible: z.ZodOptional<z.ZodBoolean>;
    professionalDataVisible: z.ZodOptional<z.ZodBoolean>;
    commEmailOptIn: z.ZodOptional<z.ZodBoolean>;
    commSmsOptIn: z.ZodOptional<z.ZodBoolean>;
    commPhoneOptIn: z.ZodOptional<z.ZodBoolean>;
    commWhatsappOptIn: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    emailVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    phoneVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    bioVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    employmentVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    socialVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    networkingVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    directoryVisible?: boolean | undefined;
    connectionVisible?: boolean | undefined;
    professionalDataVisible?: boolean | undefined;
    commEmailOptIn?: boolean | undefined;
    commSmsOptIn?: boolean | undefined;
    commPhoneOptIn?: boolean | undefined;
    commWhatsappOptIn?: boolean | undefined;
}, {
    emailVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    phoneVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    bioVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    employmentVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    socialVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    networkingVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    directoryVisible?: boolean | undefined;
    connectionVisible?: boolean | undefined;
    professionalDataVisible?: boolean | undefined;
    commEmailOptIn?: boolean | undefined;
    commSmsOptIn?: boolean | undefined;
    commPhoneOptIn?: boolean | undefined;
    commWhatsappOptIn?: boolean | undefined;
}>;
export declare const suggestionCreateSchema: z.ZodObject<{
    alumniProfileId: z.ZodNumber;
    suggestionType: z.ZodEnum<["EMPLOYMENT_UPDATE", "CONTACT", "ACHIEVEMENT", "HIGHER_STUDIES", "OTHER"]>;
    title: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    rationale: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    payload: Record<string, unknown>;
    alumniProfileId: number;
    suggestionType: "OTHER" | "HIGHER_STUDIES" | "CONTACT" | "EMPLOYMENT_UPDATE" | "ACHIEVEMENT";
    rationale?: string | null | undefined;
}, {
    title: string;
    payload: Record<string, unknown>;
    alumniProfileId: number;
    suggestionType: "OTHER" | "HIGHER_STUDIES" | "CONTACT" | "EMPLOYMENT_UPDATE" | "ACHIEVEMENT";
    rationale?: string | null | undefined;
}>;
export declare const suggestionReviewSchema: z.ZodObject<{
    action: z.ZodEnum<["ACCEPT", "REJECT"]>;
    reviewNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "REJECT" | "ACCEPT";
    reviewNotes?: string | null | undefined;
}, {
    action: "REJECT" | "ACCEPT";
    reviewNotes?: string | null | undefined;
}>;
export declare const mergeSchema: z.ZodObject<{
    survivorProfileId: z.ZodNumber;
    mergedProfileId: z.ZodNumber;
    reason: z.ZodString;
    confirmAmbiguous: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    reason: string;
    survivorProfileId: number;
    mergedProfileId: number;
    confirmAmbiguous?: boolean | undefined;
}, {
    reason: string;
    survivorProfileId: number;
    mergedProfileId: number;
    confirmAmbiguous?: boolean | undefined;
}>;
export declare const contactConfirmSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phoneOverride: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currentCity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currentCountry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    confirmContact: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    email?: string | undefined;
    currentCity?: string | null | undefined;
    currentCountry?: string | null | undefined;
    phoneOverride?: string | null | undefined;
    confirmContact?: boolean | undefined;
}, {
    email?: string | undefined;
    currentCity?: string | null | undefined;
    currentCountry?: string | null | undefined;
    phoneOverride?: string | null | undefined;
    confirmContact?: boolean | undefined;
}>;
