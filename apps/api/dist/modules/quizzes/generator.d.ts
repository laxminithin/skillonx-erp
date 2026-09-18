import { type QuizDifficulty } from '../../types/quiz.js';
export type GeneratorDistribution = 'BALANCED' | 'RANDOM';
export type GeneratorPoolItem = {
    id: number;
    courseId: number;
    moduleId: number;
    difficulty: QuizDifficulty | string | null;
    fingerprint: string;
    reviewStatus: string;
    primaryCoCode?: string | null;
};
export type GeneratorCriteria = {
    courseId: number;
    moduleIds: number[];
    easyCount: number;
    intermediateCount: number;
    difficultCount: number;
    distribution: GeneratorDistribution;
    excludeIds?: number[];
};
export type GeneratorResult = {
    selectedIds: number[];
    byDifficulty: Record<QuizDifficulty, number>;
    byModule: Record<number, number>;
};
export declare function mulberry32(seed: number): () => number;
export declare function shuffleCopy<T>(items: T[], rng?: () => number): T[];
export declare function eligiblePool(pool: GeneratorPoolItem[], criteria: GeneratorCriteria): GeneratorPoolItem[];
export declare function countAvailable(pool: GeneratorPoolItem[], criteria: Omit<GeneratorCriteria, 'easyCount' | 'intermediateCount' | 'difficultCount' | 'distribution'>, rng?: () => number): {
    totals: Record<"INTERMEDIATE" | "EASY" | "DIFFICULT", number>;
    byModule: Record<number, Record<"INTERMEDIATE" | "EASY" | "DIFFICULT", number>>;
    items: GeneratorPoolItem[];
};
export declare function selectQuestions(pool: GeneratorPoolItem[], criteria: GeneratorCriteria, rng?: () => number): GeneratorResult;
export declare function pickReplacement(pool: GeneratorPoolItem[], params: {
    courseId: number;
    moduleIds: number[];
    difficulty: QuizDifficulty;
    excludeIds: number[];
    preferredModuleId?: number | null;
    preferredPrimaryCo?: string | null;
}, rng?: () => number): GeneratorPoolItem | null;
