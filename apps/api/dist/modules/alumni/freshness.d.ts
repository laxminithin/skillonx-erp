import { type FreshnessState } from './types360.js';
export type DomainFreshness = {
    domain: string;
    state: FreshnessState;
    lastVerifiedAt: string | null;
    lastUpdatedAt: string | null;
    staleAfterDays: number;
    confirmAfterDays: number;
    message: string;
};
export declare function ensureDefaultFreshnessConfig(collegeId: number): Promise<void>;
export declare function computeFreshness(collegeId: number, profile: Record<string, any>, employmentRows: Record<string, any>[]): Promise<DomainFreshness[]>;
export declare function attentionFromFreshness(freshness: DomainFreshness[]): DomainFreshness[];
