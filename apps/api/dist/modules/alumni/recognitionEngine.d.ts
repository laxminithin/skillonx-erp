import type { AlumniAdminActor } from './service.js';
export type EligibilityCheck = {
    rule: string;
    met: boolean;
    detail: string;
};
export type ReciprocityItem = {
    direction: 'ALUMNI_TO_INSTITUTION' | 'INSTITUTION_TO_ALUMNI';
    kind: string;
    label: string;
    count: number;
    refs?: Array<{
        type: string;
        id: number | string;
    }>;
};
/**
 * Assist reviewers with factual eligibility — never auto-approve.
 */
export declare function assistEligibility(opts: {
    collegeId: number;
    alumniProfileId: number;
    rules?: Record<string, unknown> | null;
}): Promise<{
    checks: EligibilityCheck[];
    note: string;
}>;
/**
 * Factual reciprocity view — no numeric score.
 */
export declare function buildReciprocityView(opts: {
    collegeId: number;
    alumniProfileId: number;
    months?: number;
}): Promise<{
    windowMonths: number;
    alumniToInstitution: ReciprocityItem[];
    institutionToAlumni: ReciprocityItem[];
    guardrail: {
        triggered: boolean;
        message: string | null;
    };
    note: string;
}>;
/**
 * Batch reciprocity guardrail for C4 engagement (set-based, no N+1 360).
 */
export declare function batchReciprocityGuardrails(opts: {
    collegeId: number;
    alumniProfileIds: number[];
    months?: number;
}): Promise<Map<number, {
    triggered: boolean;
    message: string | null;
}>>;
/**
 * Discover contribution-based CONSIDER_FOR_RECOGNITION suggestions from C2/C5.
 * Does not auto-award.
 */
export declare function discoverContributionSuggestions(opts: {
    collegeId: number;
    alumniProfileId?: number;
    limit?: number;
}): Promise<Array<{
    alumniProfileId: number;
    suggestionType: 'CONSIDER_FOR_RECOGNITION';
    category: string;
    title: string;
    rationale: string;
    evidenceRefs: Array<Record<string, unknown>>;
}>>;
/**
 * Surface C1 achievements as POTENTIAL_RECOGNITION_CANDIDATE — no external scrape.
 */
export declare function discoverAchievementCandidates(opts: {
    collegeId: number;
    alumniProfileId?: number;
    limit?: number;
}): Promise<Array<{
    alumniProfileId: number;
    suggestionType: 'POTENTIAL_RECOGNITION_CANDIDATE';
    category: string;
    title: string;
    rationale: string;
    evidenceRefs: Array<Record<string, unknown>>;
}>>;
export declare function parseEligibilityRules(raw: unknown): Record<string, unknown> | null;
/** Stub actor for system projections. */
export declare function systemActor(collegeId: number): AlumniAdminActor;
