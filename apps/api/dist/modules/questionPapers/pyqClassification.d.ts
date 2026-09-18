/**
 * Paper-level QA classification for the Previous-Year Question Paper rebuild.
 *
 * Categories (§6 / §20):
 *   VERIFIED                 standard SEE, Q1–Q10 complete
 *   VERIFIED_SPECIAL_FORMAT  legitimate non-standard structure (MBA, MCQ, 50-mark design, …)
 *   PARSER_DEFECT            source complete but parser missed content — must be fixed
 *   SOURCE_TRUNCATION        fewer pages than printed N-of-K
 *   MANUAL_REVIEW_REQUIRED   ambiguous / cannot decide automatically
 */
import type { ExtractedPaper } from './types.js';
import type { readPaperPageSpan } from './parser.js';
export type PaperClassification = 'VERIFIED' | 'VERIFIED_SPECIAL_FORMAT' | 'PARSER_DEFECT' | 'SOURCE_TRUNCATION' | 'MANUAL_REVIEW_REQUIRED';
export type PaperQaResult = {
    classification: PaperClassification;
    expectedQuestions: number | null;
    isStandardSee: boolean;
    warnings: string[];
    reviewNote: string;
    missingQ: number[];
    duplicateQ: number[];
    missingOrPairs: string[];
};
type PageSpan = ReturnType<typeof readPaperPageSpan>;
/** Printed instruction that signals the classic five-module SEE pattern. */
export declare function hasStandardFiveModuleNote(text: string): boolean;
/** Design / elective papers that ask for TWO 50-mark questions, etc. */
export declare function hasReducedModuleNote(text: string): boolean;
/**
 * Decide whether this paper is intended to be a standard five-module SEE
 * (Q1 OR Q2 … Q9 OR Q10), vs a legitimate special format.
 */
export declare function isIntendedStandardSee(p: ExtractedPaper): boolean;
export declare function classifyExtractedPaper(p: ExtractedPaper, span: PageSpan): PaperQaResult;
export {};
