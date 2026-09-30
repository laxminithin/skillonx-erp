import type { AlumniAdminActor } from './service.js';
import { type IntelligenceDimension } from './typesIntelligence.js';
export declare function getIntelligenceWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    view: string;
    views: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIPS", "EXPERTS", "PROJECTS", "RESEARCH", "BOS", "STARTUPS", "INDUSTRY_CONNECT", "REACTIVATION", "DATA_REFRESH"];
    dimensions: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_SUPPORT", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "INSTITUTIONAL_NETWORKING", "CONTRIBUTION", "OTHER"];
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
    results: any[];
    totalMatchedInWindow: number;
    note: string;
    focusDimension?: undefined;
    truncated?: undefined;
} | {
    view: string;
    views: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIPS", "EXPERTS", "PROJECTS", "RESEARCH", "BOS", "STARTUPS", "INDUSTRY_CONNECT", "REACTIVATION", "DATA_REFRESH"];
    dimensions: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_SUPPORT", "STARTUP_SUPPORT", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "INSTITUTIONAL_NETWORKING", "CONTRIBUTION", "OTHER"];
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
    focusDimension: "OTHER" | "INTERNSHIP" | "INDUSTRIAL_VISIT" | "INDUSTRY_PROJECT" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "EXPERT_SESSION" | "BOS_ADVISORY" | "RESEARCH_COLLABORATION" | "STARTUP_SUPPORT" | "PROJECT_MENTORING" | "MOU_COLLABORATION" | "CURRICULUM_SUPPORT" | "INSTITUTIONAL_NETWORKING";
    results: any[];
    totalMatchedInWindow: number;
    truncated: boolean;
    note: string;
}>;
export declare function getDimensionBoard(actor: AlumniAdminActor, dimension: IntelligenceDimension, query?: Record<string, unknown>): Promise<{
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
/** Lightweight matrix counts for workspace header (bounded sample). */
export declare function getMatrixOverview(actor: AlumniAdminActor): Promise<{
    matrix: {
        HIGH_EVIDENCE_WILLING: number;
        HIGH_EVIDENCE_NOT_ASKED: number;
        HIGH_EVIDENCE_NOT_WILLING: number;
        LIMITED_EVIDENCE_WILLING: number;
        INSUFFICIENT_DATA: number;
        OTHER: number;
        sampled: number;
    };
    note: string;
}>;
