export type DerivedOutcome = {
    code: string;
    statement?: string | null;
    strength?: string | number | null;
};
export type DerivedOutcomes = {
    pos: DerivedOutcome[];
    psos: DerivedOutcome[];
    sdgs: DerivedOutcome[];
    provenance: 'DERIVED_FROM_CO_MAPPING';
    mappingVersionId: number | null;
    blocked: boolean;
    blockReason: string | null;
};
/**
 * Resolve PO/PSO/SDG from existing CO→outcome academic mapping.
 * Never invents independent per-question mappings.
 */
export declare function resolveDerivedOutcomes(opts: {
    collegeId: number;
    courseId: number;
    primaryCoCode: string | null | undefined;
    primaryCoId?: number | null;
}): Promise<DerivedOutcomes>;
export declare function snapshotDerivedOutcomes(derived: DerivedOutcomes): {
    provenance: "DERIVED_FROM_CO_MAPPING";
    mappingVersionId: number | null;
    pos: string[];
    psos: string[];
    sdgs: string[];
};
export declare function parseSecondaryCos(value: unknown): string[];
export declare function tokenizeAcademicText(text: string): string[];
export type CoIntentRef = {
    id: number;
    coCode: string;
    statement: string;
};
export type PrimaryCoInference = {
    primaryCoCode: string | null;
    primaryCoId: number | null;
    score: number;
    runnerUpScore: number;
    mappingBasis: string | null;
    verificationStatus: 'ACADEMIC_ANALYSIS' | 'NEEDS_REVIEW' | 'CO_MAPPING_BLOCKED';
    coMappingBlocked: boolean;
    coMappingBlockReason: string | null;
    needsReview: boolean;
};
/**
 * Map a question to a Primary CO by intent keyword overlap with CO statements.
 * Never uses Module N → CO N positional mapping.
 */
export declare function inferPrimaryCoFromIntent(opts: {
    questionText: string;
    modelAnswer?: string | null;
    moduleHint?: string | null;
    outcomes: CoIntentRef[];
}): PrimaryCoInference;
