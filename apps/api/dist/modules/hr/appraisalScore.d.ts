/** Deterministic 2-decimal rounding for appraisal scores. */
export declare function roundScore(n: number): number;
export type TemplateWeightSection = {
    code?: string;
    weight: number;
    criteria: {
        code?: string;
        weight: number;
    }[];
};
/**
 * Validates section weights sum to totalWeight (±0.01) and criteria within
 * each section sum to that section's weight. Rejects duplicate section/criterion codes.
 */
export declare function validateTemplateWeights(sections: TemplateWeightSection[], totalWeight: number): void;
/**
 * Weighted score on 0–100 scale.
 * When scaleMax is provided and > 0, ratings are normalized: (rating / scaleMax) * 100.
 * Null ratings are skipped; remaining weights are renormalized proportionally.
 */
export declare function computeWeightedScore(items: {
    weight: number;
    rating: number | null;
}[], scaleMax: number): number | null;
export type RatingLevel = {
    score: number;
    label: string;
    minScore?: number | null;
    maxScore?: number | null;
};
/**
 * Map a 0–100 score to a rating label.
 * Prefer min/max bands when present; otherwise nearest discrete score level.
 */
export declare function mapScoreToRating(score: number, levels: RatingLevel[]): {
    value: number;
    label: string;
};
