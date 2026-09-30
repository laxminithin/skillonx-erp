/**
 * Alumni Intelligence (C3) — shared types and Zod schemas.
 * Explainable dimensions only; no opaque scores / wealth / sensitive profiling.
 */
import { z } from 'zod';
export declare const INTELLIGENCE_DIMENSIONS: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_SUPPORT", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "INSTITUTIONAL_NETWORKING", "CONTRIBUTION", "OTHER"];
export type IntelligenceDimension = (typeof INTELLIGENCE_DIMENSIONS)[number];
export declare const EVIDENCE_STATES: readonly ["STRONG_EVIDENCE", "MODERATE_EVIDENCE", "LIMITED_EVIDENCE", "INSUFFICIENT_DATA"];
export type EvidenceState = (typeof EVIDENCE_STATES)[number];
export declare const WILLINGNESS_STATES: readonly ["WILLING", "MAYBE", "NOT_WILLING", "NOT_ASKED", "TEMPORARILY_UNAVAILABLE"];
export type WillingnessState = (typeof WILLINGNESS_STATES)[number];
export declare const RELATIONSHIP_READINESS: readonly ["READY_FOR_REVIEW", "FOLLOW_UP_DUE", "RECENTLY_CONTACTED", "ACTIVE_ENGAGEMENT", "NEEDS_REACTIVATION", "DO_NOT_CONTACT"];
export type RelationshipReadiness = (typeof RELATIONSHIP_READINESS)[number];
export declare const CAPABILITY_INTENT_CELLS: readonly ["HIGH_EVIDENCE_WILLING", "HIGH_EVIDENCE_NOT_ASKED", "HIGH_EVIDENCE_NOT_WILLING", "LIMITED_EVIDENCE_WILLING", "INSUFFICIENT_DATA", "OTHER"];
export type CapabilityIntentCell = (typeof CAPABILITY_INTENT_CELLS)[number];
/** Built-in dynamic segment presets (rules evaluated at runtime). */
export declare const PRESET_SEGMENTS: readonly ["POTENTIAL_MENTORS", "POTENTIAL_RECRUITERS", "INTERNSHIP_ENABLERS", "EXPERT_RESOURCE_PERSONS", "PROJECT_MENTORS", "RESEARCH_COLLABORATORS", "BOS_CURRICULUM_ADVISORS", "STARTUP_INCUBATION_SUPPORTERS", "INDUSTRY_VISIT_FACILITATORS", "INSTITUTIONAL_COLLABORATION_LEADS", "ACTIVE_CONTRIBUTORS", "REPEAT_ENGAGERS", "RECENTLY_RECONNECTED", "DORMANT_HIGH_CAPABILITY", "NEEDS_DATA_REFRESH"];
export type PresetSegment = (typeof PRESET_SEGMENTS)[number];
export declare const WORKSPACE_VIEWS: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIPS", "EXPERTS", "PROJECTS", "RESEARCH", "BOS", "STARTUPS", "INDUSTRY_CONNECT", "REACTIVATION", "DATA_REFRESH"];
/** Map intelligence dimension → C1 willingness column key. */
export declare const DIMENSION_WILLINGNESS_KEY: Partial<Record<IntelligenceDimension, string>>;
/** Map dimension → C1 capability_domain values that strengthen evidence. */
export declare const DIMENSION_CAPABILITY_DOMAINS: Partial<Record<IntelligenceDimension, string[]>>;
/** Map dimension → CRM opportunity types. */
export declare const DIMENSION_OPPORTUNITY_TYPES: Partial<Record<IntelligenceDimension, string[]>>;
/** Map dimension → verified outcome types. */
export declare const DIMENSION_OUTCOME_TYPES: Partial<Record<IntelligenceDimension, string[]>>;
export declare const SENIORITY_STRONG: Set<string>;
export type EvidenceItem = {
    code: string;
    label: string;
    positive: boolean;
    sourceType: string;
    sourceReference: string | null;
    caution?: boolean;
};
export type DimensionIntelligence = {
    dimension: IntelligenceDimension;
    evidenceState: EvidenceState;
    willingnessState: WillingnessState;
    relationshipReadiness: RelationshipReadiness;
    capabilityIntentCell: CapabilityIntentCell;
    evidence: EvidenceItem[];
    cautions: EvidenceItem[];
    why: string[];
    sources: {
        label: string;
        sourceType: string;
        sourceReference: string | null;
    }[];
    dataQualityWarnings: string[];
    qualifies: boolean;
};
export type ProfileIntelligence = {
    alumniProfileId: number;
    dimensions: DimensionIntelligence[];
    relationshipContext: {
        stage: string | null;
        status: string | null;
        ownerFacultyId: number | null;
        ownerName: string | null;
        lastContactAt: string | null;
        lastEngagementAt: string | null;
        openFollowUp: boolean;
        activeOpportunityCount: number;
        recentDecline: boolean;
        engagementLoad: number;
    };
    matrixSummary: Record<CapabilityIntentCell, number>;
    generatedAt: string;
    note: string;
};
export declare const segmentRuleSchema: z.ZodObject<{
    combinator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
    filters: z.ZodArray<z.ZodObject<{
        field: z.ZodEnum<["graduationYear", "graduationYearMin", "graduationYearMax", "programmeId", "departmentId", "location", "city", "country", "industry", "company", "designation", "seniority", "careerLevel", "isEntrepreneur", "capabilityDomain", "willingnessKey", "willingnessValue", "relationshipStage", "lastInteractionDaysMin", "lastInteractionDaysMax", "lastEngagementDaysMin", "lastEngagementDaysMax", "hasOpportunityType", "hasOutcomeType", "hasMentoringHistory", "hasRecruitmentHistory", "freshnessDomain", "freshnessState", "verificationState", "completenessMin", "dimension", "evidenceState", "willingnessState", "relationshipReadiness", "capabilityIntentCell", "preset"]>;
        op: z.ZodOptional<z.ZodEnum<["eq", "neq", "in", "contains", "gte", "lte", "exists"]>>;
        value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">, z.ZodNull]>>;
    }, "strict", z.ZodTypeAny, {
        field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
        value?: string | number | boolean | (string | number)[] | null | undefined;
        op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
    }, {
        field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
        value?: string | number | boolean | (string | number)[] | null | undefined;
        op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    combinator: "AND" | "OR";
    filters: {
        field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
        value?: string | number | boolean | (string | number)[] | null | undefined;
        op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
    }[];
}, {
    filters: {
        field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
        value?: string | number | boolean | (string | number)[] | null | undefined;
        op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
    }[];
    combinator?: "AND" | "OR" | undefined;
}>;
export declare const segmentCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ruleDefinition: z.ZodObject<{
        combinator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        filters: z.ZodArray<z.ZodObject<{
            field: z.ZodEnum<["graduationYear", "graduationYearMin", "graduationYearMax", "programmeId", "departmentId", "location", "city", "country", "industry", "company", "designation", "seniority", "careerLevel", "isEntrepreneur", "capabilityDomain", "willingnessKey", "willingnessValue", "relationshipStage", "lastInteractionDaysMin", "lastInteractionDaysMax", "lastEngagementDaysMin", "lastEngagementDaysMax", "hasOpportunityType", "hasOutcomeType", "hasMentoringHistory", "hasRecruitmentHistory", "freshnessDomain", "freshnessState", "verificationState", "completenessMin", "dimension", "evidenceState", "willingnessState", "relationshipReadiness", "capabilityIntentCell", "preset"]>;
            op: z.ZodOptional<z.ZodEnum<["eq", "neq", "in", "contains", "gte", "lte", "exists"]>>;
            value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">, z.ZodNull]>>;
        }, "strict", z.ZodTypeAny, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    }, {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    }>;
    scope: z.ZodOptional<z.ZodEnum<["INSTITUTION", "DEPARTMENT", "PERSONAL"]>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    isInstitutional: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    name: string;
    ruleDefinition: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    };
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    scope?: "INSTITUTION" | "PERSONAL" | "DEPARTMENT" | undefined;
    isInstitutional?: boolean | undefined;
}, {
    name: string;
    ruleDefinition: {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    };
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    scope?: "INSTITUTION" | "PERSONAL" | "DEPARTMENT" | undefined;
    isInstitutional?: boolean | undefined;
}>;
export declare const segmentPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ruleDefinition: z.ZodOptional<z.ZodObject<{
        combinator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        filters: z.ZodArray<z.ZodObject<{
            field: z.ZodEnum<["graduationYear", "graduationYearMin", "graduationYearMax", "programmeId", "departmentId", "location", "city", "country", "industry", "company", "designation", "seniority", "careerLevel", "isEntrepreneur", "capabilityDomain", "willingnessKey", "willingnessValue", "relationshipStage", "lastInteractionDaysMin", "lastInteractionDaysMax", "lastEngagementDaysMin", "lastEngagementDaysMax", "hasOpportunityType", "hasOutcomeType", "hasMentoringHistory", "hasRecruitmentHistory", "freshnessDomain", "freshnessState", "verificationState", "completenessMin", "dimension", "evidenceState", "willingnessState", "relationshipReadiness", "capabilityIntentCell", "preset"]>;
            op: z.ZodOptional<z.ZodEnum<["eq", "neq", "in", "contains", "gte", "lte", "exists"]>>;
            value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">, z.ZodNull]>>;
        }, "strict", z.ZodTypeAny, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    }, {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    }>>;
    scope: z.ZodOptional<z.ZodEnum<["INSTITUTION", "DEPARTMENT", "PERSONAL"]>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    isInstitutional: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    scope?: "INSTITUTION" | "PERSONAL" | "DEPARTMENT" | undefined;
    isActive?: boolean | undefined;
    ruleDefinition?: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    } | undefined;
    isInstitutional?: boolean | undefined;
}, {
    departmentId?: number | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    scope?: "INSTITUTION" | "PERSONAL" | "DEPARTMENT" | undefined;
    isActive?: boolean | undefined;
    ruleDefinition?: {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    } | undefined;
    isInstitutional?: boolean | undefined;
}>;
export declare const evaluateAdhocSchema: z.ZodObject<{
    ruleDefinition: z.ZodOptional<z.ZodObject<{
        combinator: z.ZodDefault<z.ZodEnum<["AND", "OR"]>>;
        filters: z.ZodArray<z.ZodObject<{
            field: z.ZodEnum<["graduationYear", "graduationYearMin", "graduationYearMax", "programmeId", "departmentId", "location", "city", "country", "industry", "company", "designation", "seniority", "careerLevel", "isEntrepreneur", "capabilityDomain", "willingnessKey", "willingnessValue", "relationshipStage", "lastInteractionDaysMin", "lastInteractionDaysMax", "lastEngagementDaysMin", "lastEngagementDaysMax", "hasOpportunityType", "hasOutcomeType", "hasMentoringHistory", "hasRecruitmentHistory", "freshnessDomain", "freshnessState", "verificationState", "completenessMin", "dimension", "evidenceState", "willingnessState", "relationshipReadiness", "capabilityIntentCell", "preset"]>;
            op: z.ZodOptional<z.ZodEnum<["eq", "neq", "in", "contains", "gte", "lte", "exists"]>>;
            value: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">, z.ZodNull]>>;
        }, "strict", z.ZodTypeAny, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }, {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    }, {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    }>>;
    preset: z.ZodOptional<z.ZodEnum<["POTENTIAL_MENTORS", "POTENTIAL_RECRUITERS", "INTERNSHIP_ENABLERS", "EXPERT_RESOURCE_PERSONS", "PROJECT_MENTORS", "RESEARCH_COLLABORATORS", "BOS_CURRICULUM_ADVISORS", "STARTUP_INCUBATION_SUPPORTERS", "INDUSTRY_VISIT_FACILITATORS", "INSTITUTIONAL_COLLABORATION_LEADS", "ACTIVE_CONTRIBUTORS", "REPEAT_ENGAGERS", "RECENTLY_RECONNECTED", "DORMANT_HIGH_CAPABILITY", "NEEDS_DATA_REFRESH"]>>;
    dimension: z.ZodOptional<z.ZodEnum<["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_SUPPORT", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "INSTITUTIONAL_NETWORKING", "CONTRIBUTION", "OTHER"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    includeContacts: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    preset?: "POTENTIAL_MENTORS" | "POTENTIAL_RECRUITERS" | "INTERNSHIP_ENABLERS" | "EXPERT_RESOURCE_PERSONS" | "PROJECT_MENTORS" | "RESEARCH_COLLABORATORS" | "BOS_CURRICULUM_ADVISORS" | "STARTUP_INCUBATION_SUPPORTERS" | "INDUSTRY_VISIT_FACILITATORS" | "INSTITUTIONAL_COLLABORATION_LEADS" | "ACTIVE_CONTRIBUTORS" | "REPEAT_ENGAGERS" | "RECENTLY_RECONNECTED" | "DORMANT_HIGH_CAPABILITY" | "NEEDS_DATA_REFRESH" | undefined;
    dimension?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_SUPPORT" | "INSTITUTIONAL_NETWORKING" | undefined;
    ruleDefinition?: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    } | undefined;
    includeContacts?: boolean | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    preset?: "POTENTIAL_MENTORS" | "POTENTIAL_RECRUITERS" | "INTERNSHIP_ENABLERS" | "EXPERT_RESOURCE_PERSONS" | "PROJECT_MENTORS" | "RESEARCH_COLLABORATORS" | "BOS_CURRICULUM_ADVISORS" | "STARTUP_INCUBATION_SUPPORTERS" | "INDUSTRY_VISIT_FACILITATORS" | "INSTITUTIONAL_COLLABORATION_LEADS" | "ACTIVE_CONTRIBUTORS" | "REPEAT_ENGAGERS" | "RECENTLY_RECONNECTED" | "DORMANT_HIGH_CAPABILITY" | "NEEDS_DATA_REFRESH" | undefined;
    dimension?: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_SUPPORT" | "INSTITUTIONAL_NETWORKING" | undefined;
    ruleDefinition?: {
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
        combinator?: "AND" | "OR" | undefined;
    } | undefined;
    includeContacts?: boolean | undefined;
}>;
