import type { AlumniAdminActor } from './service.js';
import { type DimensionIntelligence, type ProfileIntelligence } from './typesIntelligence.js';
export type IntelligenceConfig = {
    recentContactDays: number;
    reactivationIdleDays: number;
    heavyEngagementActiveOpps: number;
    noResponseStreakWarn: number;
};
export declare function getIntelligenceConfig(collegeId: number): Promise<IntelligenceConfig>;
export declare function assertIntelligenceAccess(actor: AlumniAdminActor): void;
export declare function loadAlumniInIntelScope(actor: AlumniAdminActor, alumniProfileId: number): Promise<any>;
export type SignalBundle = {
    profile: Record<string, any>;
    employment: Record<string, any>[];
    higherStudies: Record<string, any>[];
    entrepreneurship: Record<string, any>[];
    capabilities: Record<string, any>[];
    relationship: Record<string, any> | null;
    ownerName: string | null;
    opportunities: Record<string, any>[];
    outcomes: Record<string, any>[];
    followups: Record<string, any>[];
    recentInteractions: Record<string, any>[];
    mentoringCount: number;
    freshness: {
        domain: string;
        state: string;
        message: string;
        lastVerifiedAt: string | null;
    }[];
    config: IntelligenceConfig;
};
export declare function loadSignalBundle(collegeId: number, alumniProfileId: number, profile?: Record<string, any>): Promise<SignalBundle>;
export declare function evaluateAllDimensions(bundle: SignalBundle): DimensionIntelligence[];
export declare function buildProfileIntelligence(bundle: SignalBundle): ProfileIntelligence;
export declare function getProfileIntelligence(actor: AlumniAdminActor, alumniProfileId: number): Promise<ProfileIntelligence>;
/** Batch-load signal data for many profiles — avoids N+1 on workspace / segment evaluate. */
export declare function loadSignalBundlesBatch(collegeId: number, profiles: Record<string, any>[]): Promise<Map<number, SignalBundle>>;
