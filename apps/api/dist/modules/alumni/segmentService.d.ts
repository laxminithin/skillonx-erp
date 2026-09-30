import type { AlumniAdminActor } from './service.js';
import { type IntelligenceDimension, type PresetSegment, evaluateAdhocSchema, segmentCreateSchema, segmentPatchSchema, segmentRuleSchema } from './typesIntelligence.js';
import { z } from 'zod';
export declare function serializeSegment(row: Record<string, any>): {
    id: number;
    name: any;
    description: any;
    ruleDefinition: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    };
    scope: any;
    departmentId: number | null;
    ownerFacultyId: number | null;
    isActive: boolean;
    isInstitutional: boolean;
    createdAt: any;
    updatedAt: any;
};
declare function presetToRule(preset: PresetSegment): z.infer<typeof segmentRuleSchema>;
export declare function listSegments(actor: AlumniAdminActor): Promise<{
    segments: {
        id: number;
        name: any;
        description: any;
        ruleDefinition: {
            combinator: "AND" | "OR";
            filters: {
                field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
                value?: string | number | boolean | (string | number)[] | null | undefined;
                op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
            }[];
        };
        scope: any;
        departmentId: number | null;
        ownerFacultyId: number | null;
        isActive: boolean;
        isInstitutional: boolean;
        createdAt: any;
        updatedAt: any;
    }[];
    presets: readonly ["POTENTIAL_MENTORS", "POTENTIAL_RECRUITERS", "INTERNSHIP_ENABLERS", "EXPERT_RESOURCE_PERSONS", "PROJECT_MENTORS", "RESEARCH_COLLABORATORS", "BOS_CURRICULUM_ADVISORS", "STARTUP_INCUBATION_SUPPORTERS", "INDUSTRY_VISIT_FACILITATORS", "INSTITUTIONAL_COLLABORATION_LEADS", "ACTIVE_CONTRIBUTORS", "REPEAT_ENGAGERS", "RECENTLY_RECONNECTED", "DORMANT_HIGH_CAPABILITY", "NEEDS_DATA_REFRESH"];
}>;
export declare function createSegment(actor: AlumniAdminActor, body: z.infer<typeof segmentCreateSchema>): Promise<{
    segment: {
        id: number;
        name: any;
        description: any;
        ruleDefinition: {
            combinator: "AND" | "OR";
            filters: {
                field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
                value?: string | number | boolean | (string | number)[] | null | undefined;
                op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
            }[];
        };
        scope: any;
        departmentId: number | null;
        ownerFacultyId: number | null;
        isActive: boolean;
        isInstitutional: boolean;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function patchSegment(actor: AlumniAdminActor, segmentId: number, body: z.infer<typeof segmentPatchSchema>): Promise<{
    segment: {
        id: number;
        name: any;
        description: any;
        ruleDefinition: {
            combinator: "AND" | "OR";
            filters: {
                field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
                value?: string | number | boolean | (string | number)[] | null | undefined;
                op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
            }[];
        };
        scope: any;
        departmentId: number | null;
        ownerFacultyId: number | null;
        isActive: boolean;
        isInstitutional: boolean;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function deleteSegment(actor: AlumniAdminActor, segmentId: number): Promise<{
    ok: boolean;
}>;
export type EvaluateOptions = {
    ruleDefinition?: z.infer<typeof segmentRuleSchema>;
    preset?: PresetSegment;
    dimension?: IntelligenceDimension;
    limit?: number;
    offset?: number;
    includeContacts?: boolean;
    exportMode?: boolean;
};
export declare function evaluateRules(actor: AlumniAdminActor, opts: EvaluateOptions): Promise<{
    totalMatchedInWindow: number;
    truncated: boolean;
    offset: number;
    limit: number;
    rule: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    };
    results: any[];
    note: string;
}>;
export declare function evaluateSavedSegment(actor: AlumniAdminActor, segmentId: number, query?: Record<string, unknown>): Promise<{
    totalMatchedInWindow: number;
    truncated: boolean;
    offset: number;
    limit: number;
    rule: {
        combinator: "AND" | "OR";
        filters: {
            field: "departmentId" | "industry" | "city" | "designation" | "preset" | "location" | "graduationYear" | "country" | "verificationState" | "seniority" | "capabilityDomain" | "relationshipStage" | "graduationYearMin" | "graduationYearMax" | "programmeId" | "company" | "careerLevel" | "isEntrepreneur" | "willingnessKey" | "willingnessValue" | "lastInteractionDaysMin" | "lastInteractionDaysMax" | "lastEngagementDaysMin" | "lastEngagementDaysMax" | "hasOpportunityType" | "hasOutcomeType" | "hasMentoringHistory" | "hasRecruitmentHistory" | "freshnessDomain" | "freshnessState" | "completenessMin" | "dimension" | "evidenceState" | "willingnessState" | "relationshipReadiness" | "capabilityIntentCell";
            value?: string | number | boolean | (string | number)[] | null | undefined;
            op?: "in" | "eq" | "lte" | "gte" | "neq" | "contains" | "exists" | undefined;
        }[];
    };
    results: any[];
    note: string;
}>;
export declare function exportSegmentResults(actor: AlumniAdminActor, opts: EvaluateOptions): Promise<{
    exportedAt: string;
    count: number;
    rows: {
        alumniProfileId: any;
        name: any;
        usn: any;
        graduationYear: any;
        department: any;
        email: any;
        dimension: any;
        evidenceState: any;
        willingnessState: any;
        relationshipReadiness: any;
        why: any;
        cautions: any;
        dataQualityWarnings: any;
        lastContactAt: any;
        ownerName: any;
    }[];
    note: string;
}>;
export { evaluateAdhocSchema, segmentCreateSchema, segmentPatchSchema, presetToRule };
