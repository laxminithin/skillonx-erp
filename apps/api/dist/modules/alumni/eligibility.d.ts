import type { AlumniAdminActor } from './service.js';
import { type ChannelType, type EligibilityState, type EngagementCategory } from './typesEngagement.js';
export type EligibilityResult = {
    alumniProfileId: number;
    eligibility: EligibilityState;
    reasons: string[];
    /** Factual C6 reminder only — never used to block/suppress eligibility. */
    reciprocityGuardrail?: {
        triggered: boolean;
        message: string | null;
    };
};
type FatigueRule = {
    category_code: string;
    min_days_between_equivalent: number;
    warn_recent_contact_days: number;
    suppress_active_opportunity: boolean;
    suppress_open_followup: boolean;
    warn_open_followup: boolean;
};
export declare function ensureDefaultFatigueRules(collegeId: number): Promise<void>;
export declare function getFatigueRule(collegeId: number, category: string): Promise<FatigueRule>;
/**
 * Evaluate eligibility for a set of alumni profile IDs (batch).
 */
export declare function evaluateEligibilityBatch(opts: {
    actor: AlumniAdminActor;
    alumniProfileIds: number[];
    category: EngagementCategory | string;
    channel: ChannelType;
    campaignId?: number | null;
    excludeCampaignId?: number | null;
}): Promise<EligibilityResult[]>;
export {};
