import type { AlumniAdminActor } from './service.js';
import { type MatchQuality, type MatchStatus } from './typesMatching.js';
export type MatchEvidence = {
    code: string;
    label: string;
    positive: boolean;
    caution?: boolean;
    dimension?: string;
};
export type CandidateMatch = {
    alumniProfileId: number;
    identity: {
        name: string | null;
        graduationYear: number | null;
        historicalUsn: string | null;
        departmentId: number | null;
    };
    currentRole: string | null;
    currentOrganization: string | null;
    industry: string | null;
    location: string | null;
    matchQuality: MatchQuality;
    matchStatus: MatchStatus;
    capabilityStrength: 'STRONG' | 'MODERATE' | 'LIMITED' | 'INSUFFICIENT';
    willingness: 'WILLING' | 'MAYBE' | 'NOT_WILLING' | 'NOT_ASKED' | 'TEMPORARILY_UNAVAILABLE';
    relationship: {
        stage: string | null;
        status: string | null;
        ownerId: number | null;
        ownerName: string | null;
        lastContactAt: string | null;
        lastEngagementAt: string | null;
        readiness: string;
    };
    engagementLoad: {
        activeOpportunities: Array<{
            id: number;
            type: string;
            title: string;
            status: string;
        }>;
        openFollowups: number;
        shortlistedElsewhere: number;
    };
    dataFreshness: Array<{
        domain: string;
        state: string;
        message?: string;
    }>;
    whyMatched: MatchEvidence[];
    considerations: MatchEvidence[];
    engagementEligibility: {
        eligibility: string;
        reasons: string[];
    } | null;
    hardExcluded: boolean;
    hardExcludeReasons: string[];
};
type NeedRow = {
    id: number;
    college_id: number;
    type: string;
    domain: string | null;
    skills_topics: string | null;
    mode: string | null;
    location: string | null;
    department_id: number | null;
    start_date?: string | null;
    target_date?: string | null;
    deadline?: string | null;
};
type ProfileBundle = {
    profile: any;
    employment: any[];
    capabilities: any[];
    relationship: any | null;
    ownerName: string | null;
    opportunities: any[];
    outcomes: any[];
    followups: any[];
    shortlistedElsewhere: number;
    dismissed: boolean;
};
/**
 * Load set-based signal bundles for a college (optionally limited profile IDs).
 */
export declare function loadMatchingBundles(opts: {
    actor: AlumniAdminActor;
    alumniProfileIds?: number[];
    limitProfiles?: number;
}): Promise<Map<number, ProfileBundle>>;
/**
 * Evaluate candidates for a need (set-based).
 */
export declare function evaluateNeedCandidates(opts: {
    actor: AlumniAdminActor;
    need: NeedRow;
    limit?: number;
    includeLimited?: boolean;
    alumniProfileIds?: number[];
}): Promise<{
    candidates: CandidateMatch[];
    evaluated: number;
    excluded: number;
}>;
/** Bulk / set-based pool generation for high-quantity needs (e.g. 50 mentors). */
export declare function generateCandidatePool(opts: {
    actor: AlumniAdminActor;
    need: NeedRow;
    poolSize?: number;
}): Promise<{
    pool: CandidateMatch[];
    evaluated: number;
    excluded: number;
}>;
export {};
