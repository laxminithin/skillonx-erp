import type { ParsedQuestion, ReviewItem } from './types.js';
export type SyllabusModuleRef = {
    id: number | null;
    name: string;
    code?: string | null;
    description?: string | null;
};
export declare const MODULE_ASSIGNMENT_METHODS: readonly ["SOURCE_EXPLICIT", "VTU_STANDARD_PAIR_PATTERN", "SYLLABUS_TOPIC_VERIFIED", "MANUAL_REVIEW"];
export type ModuleAssignmentMethod = (typeof MODULE_ASSIGNMENT_METHODS)[number];
export declare const VTU_STANDARD_PAIRS: Array<{
    module: number;
    questions: number[];
    pairId: string;
}>;
export declare function vtuPairForQuestion(questionNumber: number): {
    module: number;
    questions: number[];
    pairId: string;
} | null;
export declare function moduleNumberFromLabel(label: string | null | undefined): number | null;
export declare function looksLikeStandardFiveModulePaper(questions: ParsedQuestion[]): boolean;
/**
 * Inspect a VTU paper and attach module / OR-pair metadata.
 * Prefers printed module headings. Uses Q1/Q2→M1 … Q9/Q10→M5 only when the paper
 * matches the standard five-module shape. Never invents missing alternatives.
 */
export declare function assignVtuOrStructure(questions: ParsedQuestion[]): ParsedQuestion[];
export declare function missingOrAlternatives(questions: ParsedQuestion[]): ReviewItem[];
export declare function marksMismatchReviews(questions: ParsedQuestion[]): ReviewItem[];
export declare function scoreModuleTopicOverlap(question: ParsedQuestion, mod: SyllabusModuleRef): {
    score: number;
    matched: string[];
};
/**
 * After paper-position assignment, verify topics against the subject syllabus.
 * Explicit paper headings stay. Standard-pair guesses may be overridden.
 */
export declare function verifyModuleAgainstSyllabus(question: ParsedQuestion, modules: SyllabusModuleRef[]): {
    moduleName: string | null;
    moduleId: number | null;
    assignmentMethod: ModuleAssignmentMethod;
    needsReview: boolean;
    mappingBasis: string;
    confidence: number;
    topicName: string | null;
};
