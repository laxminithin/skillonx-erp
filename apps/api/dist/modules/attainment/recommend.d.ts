import type { SourceCoAttainment } from './formula.js';
export type SuggestedCause = {
    code: string;
    label: string;
    rationale: string;
    confidence: 'SUGGESTED';
    disclaimer: 'Suggested based on assessment evidence';
};
export type RecommendedPlan = {
    causes: SuggestedCause[];
    actions: Array<{
        code: string;
        label: string;
        description: string;
    }>;
    summary: string;
};
export declare function suggestRootCauses(input: {
    coCode: string;
    attainment: number | null;
    target: number;
    sourceDiagnostics: SourceCoAttainment[];
    assignmentNonCompletionRatio?: number | null;
}): SuggestedCause[];
export declare function recommendPlan(causes: SuggestedCause[]): RecommendedPlan;
