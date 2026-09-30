import type { CompletenessState } from './types360.js';
type Section = {
    key: string;
    label: string;
    status: CompletenessState;
    messages: string[];
};
export declare function computeAlumniCompleteness(input: {
    profile: Record<string, any>;
    employment: Record<string, any>[];
    higherStudies: Record<string, any>[];
    achievements: Record<string, any>[];
    entrepreneurship: Record<string, any>[];
    capabilities: Record<string, any>[];
    relationship: {
        eventsAttended: number;
        contributions: number;
        mentoringInteractions: number;
    };
}): Promise<{
    coveragePercent: number;
    sections: Section[];
    computedAt: string;
}>;
export {};
