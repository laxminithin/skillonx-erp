import { AppError } from '../../utils/errors.js';
import { SCORE_ROUNDING_DECIMALS } from './appraisalTypes.js';
/** Deterministic 2-decimal rounding for appraisal scores. */
export function roundScore(n) {
    const factor = 10 ** SCORE_ROUNDING_DECIMALS;
    return Math.round((Number(n) + Number.EPSILON) * factor) / factor;
}
/**
 * Validates section weights sum to totalWeight (±0.01) and criteria within
 * each section sum to that section's weight. Rejects duplicate section/criterion codes.
 */
export function validateTemplateWeights(sections, totalWeight) {
    if (!sections.length) {
        throw new AppError(400, 'Template must have at least one section', undefined, 'APPRAISAL_WEIGHTS_INVALID');
    }
    const sectionCodes = new Set();
    const criterionCodes = new Set();
    let sectionSum = 0;
    for (const section of sections) {
        const sc = section.code?.trim().toUpperCase();
        if (sc) {
            if (sectionCodes.has(sc)) {
                throw new AppError(400, `Duplicate section code: ${section.code}`, undefined, 'APPRAISAL_DUPLICATE_CODE');
            }
            sectionCodes.add(sc);
        }
        let criteriaSum = 0;
        for (const c of section.criteria ?? []) {
            const cc = c.code?.trim().toUpperCase();
            if (cc) {
                if (criterionCodes.has(cc)) {
                    throw new AppError(400, `Duplicate criterion code: ${c.code}`, undefined, 'APPRAISAL_DUPLICATE_CODE');
                }
                criterionCodes.add(cc);
            }
            criteriaSum += Number(c.weight) || 0;
        }
        const sectionWeight = Number(section.weight) || 0;
        if (Math.abs(criteriaSum - sectionWeight) > 0.01) {
            throw new AppError(400, `Criteria weights in section "${section.code ?? ''}" must sum to section weight ${sectionWeight}`, { sectionCode: section.code, criteriaSum, sectionWeight }, 'APPRAISAL_WEIGHTS_INVALID');
        }
        sectionSum += sectionWeight;
    }
    if (Math.abs(sectionSum - Number(totalWeight)) > 0.01) {
        throw new AppError(400, `Section weights must sum to total weight ${totalWeight}`, { sectionSum, totalWeight }, 'APPRAISAL_WEIGHTS_INVALID');
    }
}
/**
 * Weighted score on 0–100 scale.
 * When scaleMax is provided and > 0, ratings are normalized: (rating / scaleMax) * 100.
 * Null ratings are skipped; remaining weights are renormalized proportionally.
 */
export function computeWeightedScore(items, scaleMax) {
    const rated = items.filter((i) => i.rating != null && Number.isFinite(Number(i.rating)));
    if (!rated.length)
        return null;
    const totalWeight = rated.reduce((s, i) => s + Math.max(0, Number(i.weight) || 0), 0);
    if (totalWeight <= 0)
        return null;
    const max = Number(scaleMax);
    let score = 0;
    for (const item of rated) {
        const w = Math.max(0, Number(item.weight) || 0);
        const raw = Number(item.rating);
        const normalized = max > 0 ? (raw / max) * 100 : raw;
        score += (w / totalWeight) * normalized;
    }
    return roundScore(score);
}
/**
 * Map a 0–100 score to a rating label.
 * Prefer min/max bands when present; otherwise nearest discrete score level.
 */
export function mapScoreToRating(score, levels) {
    if (!levels.length) {
        return { value: roundScore(score), label: String(roundScore(score)) };
    }
    const withBands = levels.filter((l) => (l.minScore != null && Number.isFinite(Number(l.minScore))) ||
        (l.maxScore != null && Number.isFinite(Number(l.maxScore))));
    if (withBands.length) {
        const match = withBands.find((l) => {
            const min = l.minScore != null ? Number(l.minScore) : -Infinity;
            const max = l.maxScore != null ? Number(l.maxScore) : Infinity;
            return score >= min && score <= max;
        });
        if (match) {
            return { value: Number(match.score), label: match.label };
        }
    }
    let best = levels[0];
    let bestDist = Math.abs(Number(best.score) - score);
    for (let i = 1; i < levels.length; i += 1) {
        const dist = Math.abs(Number(levels[i].score) - score);
        if (dist < bestDist) {
            best = levels[i];
            bestDist = dist;
        }
    }
    return { value: Number(best.score), label: best.label };
}
