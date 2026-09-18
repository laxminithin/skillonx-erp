import { AppError } from '../../utils/errors.js';
/** Non-negotiable Master Question Bank source. Textbooks are never a question source. */
export declare const MASTER_QUESTION_SOURCE_TYPE: "PREVIOUS_YEAR_QUESTION_PAPER";
export type MasterQuestionSourceType = typeof MASTER_QUESTION_SOURCE_TYPE;
export declare const FORBIDDEN_QUESTION_SOURCES: readonly ["AI_GENERATED", "LECTURER_CREATED", "SYLLABUS_GENERATED", "NOTES", "PPT", "WEBSITE", "INTERNET_QUESTION_BANK", "TEXTBOOK", "GENERIC_LLM", "SYNTHETIC", "QUESTION_BANK", "QUIZ_BANK", "CUSTOM", "ASSIGNMENT_BANK"];
export declare const LEGACY_SOURCE_CLASSIFICATIONS: readonly ["PYQ_EXTRACTED", "AI_GENERATED", "LECTURER_CREATED", "LECTURER_OR_BANK_LEGACY", "UNKNOWN_NON_PYQ"];
export type LegacySourceClassification = (typeof LEGACY_SOURCE_CLASSIFICATIONS)[number];
export declare const MQB_STATUSES: readonly ["PYQ_EXTRACTED", "MARKS_UNRESOLVED", "MODULE_MAPPING_NEEDS_REVIEW", "CO_MAPPING_NEEDS_REVIEW", "MAPPING_DISCREPANCY", "TEXTBOOK_SOURCE_REQUIRED", "SOLUTION_PENDING", "SCHEME_PENDING", "SCHEME_NEEDS_REVIEW", "READY", "READY_FOR_INTERNAL_PAPER"];
export type MqbStatus = (typeof MQB_STATUSES)[number];
export declare const READY_STATUSES: Set<string>;
export declare const INCOMPLETE_STATUSES: Set<string>;
export declare const INSUFFICIENT_PYQ_MESSAGE = "Insufficient eligible previous-year questions for the selected syllabus scope.";
export declare const INSUFFICIENT_PYQ_COVERAGE_MESSAGE = "Insufficient PYQ Coverage";
export declare const TEXTBOOK_REQUIRED_MESSAGE = "Prescribed textbook source is required to generate the model solution.";
export declare const PYQ_BUILD_MODE: "BUILD_FROM_PYQ_BANK";
export declare const SUGGESTED_PYQ_ACTIONS: readonly ["Upload more previous-year question papers", "Include additional eligible PYQ years", "Change selected modules / topics", "Review pending extracted questions"];
export type ReadinessInput = {
    sourceType?: string | null;
    sourcePaperId?: string | number | null;
    originalQuestionText?: string | null;
    questionText?: string | null;
    marks?: number | null;
    marksStatus?: string | null;
    marksMissing?: boolean | null;
    moduleId?: number | null;
    moduleName?: string | null;
    moduleMappingStatus?: string | null;
    moduleMappingNeedsReview?: boolean | null;
    coCode?: string | null;
    coVerified?: boolean | null;
    coMappingStatus?: string | null;
    mappingDiscrepancy?: boolean | null;
    poDerived?: boolean | null;
    psoDerived?: boolean | null;
    rbtLevel?: string | null;
    bloomLevel?: string | null;
    textbookId?: number | null;
    hasTextbookSource?: boolean | null;
    hasTextbookSolution?: boolean | null;
    solutionStatus?: string | null;
    hasScheme?: boolean | null;
    schemeStatus?: string | null;
    schemeValid?: boolean | null;
    isOrChoice?: boolean | null;
    orPairId?: string | null;
    requiresSubquestion?: boolean | null;
    subquestionLetter?: string | null;
};
export type ReadinessResult = {
    status: MqbStatus;
    ready: boolean;
    checks: {
        pyqSource: boolean;
        originalQuestion: boolean;
        marksFromPyq: boolean;
        moduleMapped: boolean;
        coVerified: boolean;
        poPsoVerified: boolean;
        rbt: boolean;
        textbookSource: boolean;
        textbookSolution: boolean;
        scheme: boolean;
        orPaired: boolean;
        subquestionPresent: boolean;
    };
    reason: string | null;
};
export declare function isPyqSource(sourceType?: string | null, sourceKind?: string | null): boolean;
/**
 * Normalized Internal-Paper sources. Only these two may be used for AUTOMATIC
 * Internal Paper generation, in strict priority order:
 *   1. VTU_SEE_PYQ         — genuine VTU Previous-Year SEE / university-exam questions
 *   2. MODULE_QUESTION_BANK — genuine subject module-wise question-bank questions
 * Everything else (previous IA/internal/model/unit-test/practice papers, custom,
 * AI, legacy quiz/assignment banks, …) is OTHER_SOURCE and must NEVER be selected
 * automatically. The distinction is real provenance — NOT `exam_type != SEE`.
 */
export declare const MASTER_SOURCES: readonly ["VTU_SEE_PYQ", "MODULE_QUESTION_BANK"];
export type MasterSource = (typeof MASTER_SOURCES)[number];
export declare const INTERNAL_SOURCE_CLASSES: readonly ["VTU_SEE_PYQ", "MODULE_QUESTION_BANK", "OTHER_SOURCE"];
export type InternalSourceClass = (typeof INTERNAL_SOURCE_CLASSES)[number];
/** `previous_year_questions.source_type` value that marks a genuine module-bank record. */
export declare const MODULE_QUESTION_BANK_SOURCE_TYPE: "MODULE_QUESTION_BANK";
/** Exam types that count as a VTU Semester-End / University examination. */
export declare function isSeeExamType(examType?: string | null): boolean;
/**
 * Classify a candidate by its ACTUAL provenance (never by `exam_type != SEE`):
 * - explicit module-bank provenance → MODULE_QUESTION_BANK
 * - genuine VTU SEE / university PYQ → VTU_SEE_PYQ
 * - anything else (non-SEE PYQs, legacy banks, …) → OTHER_SOURCE (auto-excluded)
 */
export declare function classifyMasterSource(opts: {
    sourceType?: string | null;
    examType?: string | null;
    university?: string | null;
}): InternalSourceClass;
/** Only VTU SEE PYQ and genuine Module Question Bank may participate in generation. */
export declare function isAutoEligibleSource(source?: string | null): boolean;
export declare function isAllowedInternalSource(source?: string | null): boolean;
export declare const INSUFFICIENT_QUESTION_COVERAGE_MESSAGE = "Insufficient Question Coverage";
export declare function insufficientQuestionCoverageError(detail: {
    seeCandidates: number;
    moduleBankCandidates: number;
    required: number;
    filledSlots?: number;
    missingSlots?: number;
    slotLabel?: string | null;
    moduleName?: string | null;
    moduleId?: number | null;
    subjectName?: string | null;
    reason?: string | null;
}): AppError;
export declare function isReadyForInternalPaper(status?: string | null): boolean;
export declare function computeReadiness(input: ReadinessInput): ReadinessResult;
export declare function readinessReasonFromChecks(status: string, checks: ReadinessResult['checks']): string;
export type PyqCoverage = {
    eligibleQuestions: number;
    availableUsableMarks: number;
    required: number;
    filledSlots: number;
    missingSlots: number;
    suggestedActions: string[];
};
export declare function pyqCoverageReport(opts: {
    eligibleQuestions: number;
    availableUsableMarks: number;
    required: number;
    filledSlots?: number;
    missingSlots?: number;
}): PyqCoverage;
export declare function insufficientPyqCoverageError(coverage: PyqCoverage): AppError;
export declare function noSourceNoMasterError(): AppError;
export declare function textbookRequiredError(): AppError;
export declare function customQuestionForbiddenError(): AppError;
export declare function nonPyqSourceForbiddenError(source?: string | null): AppError;
export type AcademicProvenance = {
    questionLabel: string;
    questionSource: string;
    marksSource: string;
    co: string | null;
    poPso: string | null;
    solutionSource: string | null;
    schemeSource: string | null;
    pyqPaperId?: string | null;
    examType?: string | null;
    examYear?: number | null;
    textbookTitle?: string | null;
    textbookChapter?: string | null;
    textbookSection?: string | null;
};
export declare function formatQuestionSourceLabel(opts: {
    examType?: string | null;
    examYear?: number | null;
    examMonth?: string | null;
    academicYear?: string | null;
}): string;
export declare function cleanDisplayText(original: string): string;
export declare function textbookCitation(opts: {
    title?: string | null;
    chapter?: string | number | null;
    section?: string | null;
}): string | null;
