import type { BuiltSlot } from './pattern.js';
export type GeneratorSlot = {
    key: string;
    section: string;
    questionNumber: number;
    subLetter: string | null;
    marks: number;
    moduleName?: string | null;
    moduleId?: number | null;
    topicId?: number | null;
    topicName?: string | null;
    coCode?: string | null;
    rbtLevel?: string | null;
    orGroupId?: string | null;
    isOrChoice?: boolean;
    orAlternative?: 'A' | 'B' | null;
    countsTowardRequired?: boolean;
};
export type Blueprint = {
    examType: string;
    maxMarks: number;
    requiredAnswerMarks?: number;
    printedMarks?: number;
    durationMinutes: number | null;
    modules: string[];
    selectedModuleIds?: number[];
    selectedTopicIds?: number[] | null;
    excludedTopicIds?: number[];
    moduleTargets?: Array<{
        moduleId: number | null;
        moduleName: string;
        marks: number;
        coCode?: string | null;
    }>;
    coTargets: Array<{
        coCode: string;
        marks: number;
    }>;
    rbtTargets?: Array<{
        level: string;
        marks: number;
    }>;
    patternCode?: string;
    patternLabel: string;
    slots: GeneratorSlot[];
    allowOrChoices: boolean;
    sourceMix: {
        previousYear: boolean;
        questionBank: boolean;
        quizBank: boolean;
    };
    previousYearWeight: number;
    allowPreviousYearRepeats: boolean;
    recentYearExclusion: number;
    difficultyMix?: Partial<Record<'EASY' | 'INTERMEDIATE' | 'DIFFICULT', number>>;
    modifiedFromCoEvaluation: boolean;
    changeJustification?: string | null;
    coEvaluationId?: number | null;
    workflowVersion?: number;
};
export type PoolQuestion = {
    id: string;
    source: 'PREVIOUS_YEAR' | 'QUESTION_BANK' | 'QUIZ_BANK' | 'CUSTOM';
    sourceType?: string | null;
    sourceQuestionId: number | null;
    sourcePaperId?: string | null;
    questionText: string;
    originalQuestionText?: string | null;
    marks: number;
    moduleName: string | null;
    moduleId: number | null;
    topicId?: number | null;
    topicName?: string | null;
    coCode: string | null;
    difficulty: string | null;
    bloomLevel: string | null;
    rbtLevel?: string | null;
    fingerprint: string;
    examYear: number | null;
    examType?: string | null;
    examMonth?: string | null;
    academicYear?: string | null;
    appearanceCount: number;
    lastAppeared: string | null;
    yearsAppeared?: number[];
    examsAppeared?: string[];
    isOrChoice: boolean;
    orGroupId: string | null;
    orPairId?: string | null;
    orAlternative?: 'A' | 'B' | null;
    /** Normalized source: VTU SEE PYQ (primary), Module Question Bank (fallback), or OTHER_SOURCE (never auto-selected). */
    masterSource?: 'VTU_SEE_PYQ' | 'MODULE_QUESTION_BANK' | 'OTHER_SOURCE';
    eligible: boolean;
    verificationStatus?: string | null;
    reviewStatus?: string | null;
    readinessStatus?: string | null;
    sourceVerified?: boolean | null;
    coMappingBlocked?: boolean;
    hasScheme?: boolean;
    hasSolution?: boolean;
    needsReview?: boolean;
    textbookId?: number | null;
    textbookCitation?: string | null;
    modelSolution?: string | null;
    scheme?: Array<{
        code: string;
        label: string;
        maxMarks: number;
    }>;
    provenance?: Record<string, unknown> | null;
    canonicalQuestionId?: string | number | null;
    lastInternalUsage?: string | Date | null;
    internalUsageCount?: number;
};
export type SelectedItem = {
    slot: GeneratorSlot;
    question: PoolQuestion;
};
export declare function moduleNumberFromName(name: string | null | undefined): number | null;
export declare function inSelectedScope(q: PoolQuestion, blueprint: Blueprint): boolean;
/** Hard module filter for a blueprint slot — never borrow from another module. */
export declare function slotMatchesModule(q: PoolQuestion, slot: GeneratorSlot): boolean;
export declare function crossModuleMessage(label: string, moduleName: string | null | undefined): string;
export declare function replacementModuleMismatchMessage(slotModule: string | null | undefined, questionModule: string | null | undefined): string;
export declare function isBlockedForFinalize(q: PoolQuestion): boolean;
export declare function eligiblePool(pool: PoolQuestion[], blueprint: Blueprint, opts?: {
    allowNeedsReview?: boolean;
}): PoolQuestion[];
/**
 * Source priority is structural (SEE pool first, Module Bank second) — not a fragile
 * score bonus. Kept for replacement ranking / back-compat diagnostics.
 */
export declare const SEE_SOURCE_PRIORITY_BONUS = 1000;
export declare function sourcePriority(q: PoolQuestion): number;
/**
 * A candidate may be used for automatic generation only if its source is a genuine
 * VTU SEE PYQ or a genuine Module Question Bank question. OTHER_SOURCE (non-SEE
 * PYQs, legacy banks, custom, AI) is never selected automatically. Undefined
 * masterSource is treated as allowed for back-compat with directly-built pools.
 */
export declare function isAutoSelectable(q: PoolQuestion): boolean;
/** Academic ranking within a single source tier (module + marks already hard-filtered). */
export declare function academicScore(q: PoolQuestion, slot: GeneratorSlot, blueprint: Blueprint, partner?: PoolQuestion | null): number;
/**
 * Two-tier selection: exhaust VTU SEE PYQ for the slot, then fill only the missing
 * requirement from Module Question Bank. Never soft-rank Module Bank above SEE.
 */
export declare function selectForBlueprint(pool: PoolQuestion[], blueprint: Blueprint, rng?: () => number, opts?: {
    usedFingerprints?: Iterable<string>;
    slots?: GeneratorSlot[];
    requireFullTotal?: boolean;
    allowNeedsReview?: boolean;
}): SelectedItem[];
export declare function replacementCandidates(pool: PoolQuestion[], blueprint: Blueprint, current: SelectedItem, selected: SelectedItem[]): PoolQuestion[];
export declare function orPairBalance(a: {
    marks: number;
    coCode?: string | null;
    difficulty?: string | null;
    bloomLevel?: string | null;
    rbtLevel?: string | null;
    moduleId?: number | null;
    moduleName?: string | null;
}, b: {
    marks: number;
    coCode?: string | null;
    difficulty?: string | null;
    bloomLevel?: string | null;
    rbtLevel?: string | null;
    moduleId?: number | null;
    moduleName?: string | null;
}): {
    marksBalanced: boolean;
    coCompatible: boolean;
    difficultyCompatible: boolean;
    rbtCompatible: boolean;
    moduleCompatible: boolean;
    ok: boolean;
};
/** Legacy 10-mark slot builder kept so existing papers and tests remain valid. */
export declare function defaultSlotsForMarks(maxMarks: number, coTargets: Array<{
    coCode: string;
    marks: number;
}>): GeneratorSlot[];
export declare function slotsFromBuilt(built: BuiltSlot[], extras?: Partial<GeneratorSlot>): GeneratorSlot[];
export declare function itemLabel(item: {
    questionNumber: number;
    subLetter?: string | null;
    orAlternative?: string | null;
}): string;
export declare function validateBlueprint(blueprint: Blueprint, items: Array<{
    marks: number;
    fingerprint: string;
    coCode?: string | null;
    orGroupId?: string | null;
    orAlternative?: string | null;
    countsTowardRequired?: boolean;
    moduleId?: number | null;
    moduleName?: string | null;
    topicId?: number | null;
    label?: string;
}>): {
    ok: boolean;
    errors: string[];
    requiredMarks: number;
    printedMarks: number;
};
/**
 * Question Source Summary shown before finalization (spec §8 / §19). Counts OR
 * alternatives for the primary ratio, plus raw component counts for transparency
 * when a 20-mark alternative mixes SEE + Module Bank parts.
 */
export declare function sourceSummaryFromItems(items: Array<{
    questionNumber: number;
    orAlternative?: string | null;
    orGroupId?: string | null;
    sourceKind?: string | null;
    moduleName?: string | null;
}>): {
    total: number;
    vtuSeePyq: number;
    moduleQuestionBank: number;
    seeComponents: number;
    moduleBankComponents: number;
    fallbackReasons: string[];
    label: string;
};
export declare function coverageFromItems(items: Array<{
    marks: number;
    coCode?: string | null;
    source?: string;
    examYear?: number | null;
    moduleName?: string | null;
    rbtLevel?: string | null;
    bloomLevel?: string | null;
    orAlternative?: string | null;
}>): {
    totalMarks: number;
    byCo: {
        coCode: string;
        marks: number;
    }[];
    byYear: {
        year: number;
        count: number;
    }[];
    bySource: {
        source: string;
        count: number;
    }[];
    byModule: {
        moduleName: string;
        marks: number;
    }[];
    byRbt: {
        level: string;
        marks: number;
    }[];
};
export declare function recommendModuleTargets(selected: Array<{
    id: number;
    name: string;
    hours?: number;
    coveragePercent?: number;
    coCode?: string | null;
}>, requiredMarks: number): {
    moduleId: number;
    moduleName: string;
    marks: number;
    coCode: string | null;
}[];
