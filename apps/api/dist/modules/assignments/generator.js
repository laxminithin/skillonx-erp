/**
 * Assignment bank question selection — same algorithm as quizzes/generator.ts,
 * plus presets for SHORT / STANDARD / DEEP_DIVE / CUSTOM.
 */
export { mulberry32, shuffleCopy, eligiblePool, countAvailable, selectQuestions, pickReplacement, } from '../quizzes/generator.js';
import { AppError } from '../../utils/errors.js';
/** Preset totals: SHORT(5) / STANDARD(8) / DEEP-DIVE(10) / CUSTOM. */
export function resolvePresetCounts(preset, custom) {
    if (preset === 'CUSTOM') {
        const easyCount = custom?.easyCount ?? 0;
        const intermediateCount = custom?.intermediateCount ?? 0;
        const difficultCount = custom?.difficultCount ?? 0;
        const total = easyCount + intermediateCount + difficultCount;
        if (total < 1)
            throw new AppError(400, 'CUSTOM preset requires at least one question');
        return { easyCount, intermediateCount, difficultCount, total };
    }
    // Default difficulty mix ≈ 40% Easy / 40% Intermediate / 20% Difficult
    const total = preset === 'SHORT' ? 5 : preset === 'STANDARD' ? 8 : 10;
    const easyCount = Math.round(total * 0.4);
    const difficultCount = Math.max(1, Math.round(total * 0.2));
    const intermediateCount = total - easyCount - difficultCount;
    return { easyCount, intermediateCount, difficultCount, total };
}
export function criteriaFromPreset(opts) {
    const counts = resolvePresetCounts(opts.preset, opts);
    return {
        courseId: opts.courseId,
        moduleIds: opts.moduleIds,
        easyCount: counts.easyCount,
        intermediateCount: counts.intermediateCount,
        difficultCount: counts.difficultCount,
        distribution: opts.distribution ?? 'BALANCED',
        excludeIds: opts.excludeIds,
    };
}
