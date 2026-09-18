/**
 * Assignment bank question selection — same algorithm as quizzes/generator.ts,
 * plus presets for SHORT / STANDARD / DEEP_DIVE / CUSTOM.
 */
export { mulberry32, shuffleCopy, eligiblePool, countAvailable, selectQuestions, pickReplacement, type GeneratorDistribution, type GeneratorPoolItem, type GeneratorCriteria, type GeneratorResult, } from '../quizzes/generator.js';
import type { GeneratorCriteria, GeneratorDistribution } from '../quizzes/generator.js';
import type { GeneratorPreset } from '../../types/assignment.js';
export type AssignmentPresetCounts = {
    easyCount: number;
    intermediateCount: number;
    difficultCount: number;
    total: number;
};
/** Preset totals: SHORT(5) / STANDARD(8) / DEEP-DIVE(10) / CUSTOM. */
export declare function resolvePresetCounts(preset: GeneratorPreset, custom?: Partial<Pick<GeneratorCriteria, 'easyCount' | 'intermediateCount' | 'difficultCount'>>): AssignmentPresetCounts;
export declare function criteriaFromPreset(opts: {
    courseId: number;
    moduleIds: number[];
    preset: GeneratorPreset;
    distribution?: GeneratorDistribution;
    easyCount?: number;
    intermediateCount?: number;
    difficultCount?: number;
    excludeIds?: number[];
}): GeneratorCriteria;
