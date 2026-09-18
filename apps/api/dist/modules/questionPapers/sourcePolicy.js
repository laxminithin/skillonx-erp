import { AppError } from '../../utils/errors.js';
import { rbtFromBloom } from './rbt.js';
/** Non-negotiable Master Question Bank source. Textbooks are never a question source. */
export const MASTER_QUESTION_SOURCE_TYPE = 'PREVIOUS_YEAR_QUESTION_PAPER';
export const FORBIDDEN_QUESTION_SOURCES = [
    'AI_GENERATED',
    'LECTURER_CREATED',
    'SYLLABUS_GENERATED',
    'NOTES',
    'PPT',
    'WEBSITE',
    'INTERNET_QUESTION_BANK',
    'TEXTBOOK',
    'GENERIC_LLM',
    'SYNTHETIC',
    'QUESTION_BANK',
    'QUIZ_BANK',
    'CUSTOM',
    'ASSIGNMENT_BANK',
];
export const LEGACY_SOURCE_CLASSIFICATIONS = [
    'PYQ_EXTRACTED',
    'AI_GENERATED',
    'LECTURER_CREATED',
    'LECTURER_OR_BANK_LEGACY',
    'UNKNOWN_NON_PYQ',
];
export const MQB_STATUSES = [
    'PYQ_EXTRACTED',
    'MARKS_UNRESOLVED',
    'MODULE_MAPPING_NEEDS_REVIEW',
    'CO_MAPPING_NEEDS_REVIEW',
    'MAPPING_DISCREPANCY',
    'TEXTBOOK_SOURCE_REQUIRED',
    'SOLUTION_PENDING',
    'SCHEME_PENDING',
    'SCHEME_NEEDS_REVIEW',
    'READY',
    'READY_FOR_INTERNAL_PAPER',
];
export const READY_STATUSES = new Set(['READY', 'READY_FOR_INTERNAL_PAPER']);
export const INCOMPLETE_STATUSES = new Set([
    'PYQ_EXTRACTED',
    'MARKS_UNRESOLVED',
    'MODULE_MAPPING_NEEDS_REVIEW',
    'CO_MAPPING_NEEDS_REVIEW',
    'MAPPING_DISCREPANCY',
    'TEXTBOOK_SOURCE_REQUIRED',
    'SOLUTION_PENDING',
    'SCHEME_PENDING',
    'SCHEME_NEEDS_REVIEW',
]);
export const INSUFFICIENT_PYQ_MESSAGE = 'Insufficient eligible previous-year questions for the selected syllabus scope.';
export const INSUFFICIENT_PYQ_COVERAGE_MESSAGE = 'Insufficient PYQ Coverage';
export const TEXTBOOK_REQUIRED_MESSAGE = 'Prescribed textbook source is required to generate the model solution.';
export const PYQ_BUILD_MODE = 'BUILD_FROM_PYQ_BANK';
export const SUGGESTED_PYQ_ACTIONS = [
    'Upload more previous-year question papers',
    'Include additional eligible PYQ years',
    'Change selected modules / topics',
    'Review pending extracted questions',
];
export function isPyqSource(sourceType, sourceKind) {
    const t = String(sourceType || sourceKind || '').toUpperCase();
    return (t === MASTER_QUESTION_SOURCE_TYPE ||
        t === 'PREVIOUS_YEAR' ||
        t === 'PREVIOUS_YEAR_QUESTION_PAPER' ||
        t === 'VTU_SEE_PYQ' ||
        t === 'MODULE_QUESTION_BANK');
}
/**
 * Normalized Internal-Paper sources. Only these two may be used for AUTOMATIC
 * Internal Paper generation, in strict priority order:
 *   1. VTU_SEE_PYQ         — genuine VTU Previous-Year SEE / university-exam questions
 *   2. MODULE_QUESTION_BANK — genuine subject module-wise question-bank questions
 * Everything else (previous IA/internal/model/unit-test/practice papers, custom,
 * AI, legacy quiz/assignment banks, …) is OTHER_SOURCE and must NEVER be selected
 * automatically. The distinction is real provenance — NOT `exam_type != SEE`.
 */
export const MASTER_SOURCES = ['VTU_SEE_PYQ', 'MODULE_QUESTION_BANK'];
export const INTERNAL_SOURCE_CLASSES = ['VTU_SEE_PYQ', 'MODULE_QUESTION_BANK', 'OTHER_SOURCE'];
/** `previous_year_questions.source_type` value that marks a genuine module-bank record. */
export const MODULE_QUESTION_BANK_SOURCE_TYPE = 'MODULE_QUESTION_BANK';
/** Exam types that count as a VTU Semester-End / University examination. */
export function isSeeExamType(examType) {
    const t = String(examType || '').toUpperCase();
    return /\b(SEE|SUPPLEMENTARY|SUPPLY|UNIVERSITY)\b/.test(t);
}
/**
 * Classify a candidate by its ACTUAL provenance (never by `exam_type != SEE`):
 * - explicit module-bank provenance → MODULE_QUESTION_BANK
 * - genuine VTU SEE / university PYQ → VTU_SEE_PYQ
 * - anything else (non-SEE PYQs, legacy banks, …) → OTHER_SOURCE (auto-excluded)
 */
export function classifyMasterSource(opts) {
    const st = String(opts.sourceType || '').toUpperCase();
    if (st === MODULE_QUESTION_BANK_SOURCE_TYPE || st === 'MODULE_BANK' || st === 'SUBJECT_MODULE_QUESTION_BANK') {
        return 'MODULE_QUESTION_BANK';
    }
    if (isSeeExamType(opts.examType))
        return 'VTU_SEE_PYQ';
    return 'OTHER_SOURCE';
}
/** Only VTU SEE PYQ and genuine Module Question Bank may participate in generation. */
export function isAutoEligibleSource(source) {
    const s = String(source || '').toUpperCase();
    return s === 'VTU_SEE_PYQ' || s === 'MODULE_QUESTION_BANK';
}
export function isAllowedInternalSource(source) {
    const s = String(source || '').toUpperCase();
    // Legacy PYQ markers stay allowed so already-generated papers still validate.
    return isAutoEligibleSource(s) || s === 'PREVIOUS_YEAR' || s === MASTER_QUESTION_SOURCE_TYPE;
}
export const INSUFFICIENT_QUESTION_COVERAGE_MESSAGE = 'Insufficient Question Coverage';
export function insufficientQuestionCoverageError(detail) {
    const subject = detail.subjectName ? `Subject: ${detail.subjectName}. ` : '';
    const module = detail.moduleName
        ? `Module: ${detail.moduleName}. `
        : detail.moduleId
            ? `Module id: ${detail.moduleId}. `
            : '';
    const where = detail.slotLabel ? `Required: ${detail.slotLabel}. ` : '';
    const reason = detail.reason ||
        'No compatible component with verified scheme/solution in either eligible source.';
    return new AppError(422, `${INSUFFICIENT_QUESTION_COVERAGE_MESSAGE}. ${subject}${module}${where}SEE eligible: ${detail.seeCandidates} component(s) / ${detail.required} marks. Module Question Bank eligible: ${detail.moduleBankCandidates} component(s). Reason: ${reason}`, {
        ...detail,
        suggestedActions: [
            'Add / review Module Question Bank questions for the selected module',
            'Load additional VTU SEE previous-year papers',
            'Review pending extracted questions',
        ],
    }, 'INSUFFICIENT_QUESTION_COVERAGE');
}
export function isReadyForInternalPaper(status) {
    return READY_STATUSES.has(String(status || '').toUpperCase());
}
export function computeReadiness(input) {
    const pyqSource = isPyqSource(input.sourceType) && Boolean(input.sourcePaperId);
    const originalQuestion = Boolean(String(input.originalQuestionText || input.questionText || '').trim());
    const marksUnresolved = input.marksMissing === true ||
        String(input.marksStatus || '').toUpperCase() === 'MARKS_UNRESOLVED' ||
        input.marks == null ||
        Number(input.marks) <= 0;
    const marksFromPyq = !marksUnresolved;
    const moduleNeedsReview = input.moduleMappingNeedsReview === true ||
        String(input.moduleMappingStatus || '').toUpperCase() === 'MODULE_MAPPING_NEEDS_REVIEW';
    const moduleMapped = Boolean(input.moduleId || input.moduleName) && !moduleNeedsReview;
    const mappingDiscrepancy = input.mappingDiscrepancy === true || String(input.coMappingStatus || '').toUpperCase() === 'MAPPING_DISCREPANCY';
    const coNeedsReview = mappingDiscrepancy ||
        input.coVerified === false ||
        String(input.coMappingStatus || '').toUpperCase() === 'CO_MAPPING_NEEDS_REVIEW';
    const coVerified = Boolean(input.coCode) && !coNeedsReview;
    const poPsoVerified = input.poDerived !== false && input.psoDerived !== false && coVerified;
    const rbt = Boolean(rbtFromBloom(input.rbtLevel || input.bloomLevel));
    const textbookSource = Boolean(input.textbookId || input.hasTextbookSource);
    const textbookSolution = input.hasTextbookSolution === true || String(input.solutionStatus || '').toUpperCase() === 'TEXTBOOK_GROUNDED';
    const scheme = (input.hasScheme === true || input.schemeValid === true) &&
        String(input.schemeStatus || '').toUpperCase() !== 'SCHEME_NEEDS_REVIEW' &&
        String(input.schemeStatus || '').toUpperCase() !== 'SCHEME_PENDING';
    const orPaired = input.isOrChoice !== true || Boolean(input.orPairId);
    const subquestionPresent = input.requiresSubquestion !== true || Boolean(input.subquestionLetter);
    const checks = {
        pyqSource,
        originalQuestion,
        marksFromPyq,
        moduleMapped,
        coVerified,
        poPsoVerified,
        rbt,
        textbookSource,
        textbookSolution,
        scheme,
        orPaired,
        subquestionPresent,
    };
    let status = 'PYQ_EXTRACTED';
    if (!pyqSource || !originalQuestion)
        status = 'PYQ_EXTRACTED';
    else if (!marksFromPyq)
        status = 'MARKS_UNRESOLVED';
    else if (moduleNeedsReview || !moduleMapped || !orPaired)
        status = 'MODULE_MAPPING_NEEDS_REVIEW';
    else if (!subquestionPresent)
        status = 'PYQ_EXTRACTED';
    else if (mappingDiscrepancy)
        status = 'MAPPING_DISCREPANCY';
    else if (coNeedsReview || !coVerified)
        status = 'CO_MAPPING_NEEDS_REVIEW';
    else if (!textbookSource)
        status = 'TEXTBOOK_SOURCE_REQUIRED';
    else if (!textbookSolution)
        status = 'SOLUTION_PENDING';
    else if (String(input.schemeStatus || '').toUpperCase() === 'SCHEME_NEEDS_REVIEW')
        status = 'SCHEME_NEEDS_REVIEW';
    else if (!scheme)
        status = 'SCHEME_PENDING';
    else
        status = 'READY_FOR_INTERNAL_PAPER';
    const ready = status === 'READY_FOR_INTERNAL_PAPER';
    return { status: ready ? 'READY_FOR_INTERNAL_PAPER' : status, ready, checks, reason: ready ? null : readinessReasonFromChecks(status, checks) };
}
export function readinessReasonFromChecks(status, checks) {
    const labels = [
        ['pyqSource', 'PYQ source missing'],
        ['originalQuestion', 'Question text missing'],
        ['marksFromPyq', 'Marks unresolved'],
        ['moduleMapped', 'Module missing'],
        ['orPaired', 'OR pair missing'],
        ['subquestionPresent', 'Subquestion missing'],
        ['coVerified', 'CO missing or unverified'],
        ['poPsoVerified', 'PO/PSO missing'],
        ['rbt', 'RBT missing'],
        ['textbookSource', 'Textbook source missing'],
        ['textbookSolution', 'Textbook solution missing'],
        ['scheme', 'Scheme missing'],
    ];
    const failed = labels.filter(([k]) => !checks[k]).map(([, l]) => l);
    return failed.length ? failed.join('; ') : status;
}
export function pyqCoverageReport(opts) {
    return {
        eligibleQuestions: opts.eligibleQuestions,
        availableUsableMarks: opts.availableUsableMarks,
        required: opts.required,
        filledSlots: opts.filledSlots ?? 0,
        missingSlots: opts.missingSlots ?? 0,
        suggestedActions: [...SUGGESTED_PYQ_ACTIONS],
    };
}
export function insufficientPyqCoverageError(coverage) {
    return new AppError(422, `${INSUFFICIENT_PYQ_COVERAGE_MESSAGE}. ${INSUFFICIENT_PYQ_MESSAGE} Eligible Questions: ${coverage.eligibleQuestions}. Available usable marks: ${coverage.availableUsableMarks}. Required: ${coverage.required}.`, coverage, 'INSUFFICIENT_PYQ_COVERAGE');
}
export function noSourceNoMasterError() {
    return new AppError(422, INSUFFICIENT_PYQ_MESSAGE, { suggestedActions: [...SUGGESTED_PYQ_ACTIONS] }, 'NO_PYQ_SOURCE');
}
export function textbookRequiredError() {
    return new AppError(422, TEXTBOOK_REQUIRED_MESSAGE, null, 'TEXTBOOK_SOURCE_REQUIRED');
}
export function customQuestionForbiddenError() {
    return new AppError(403, 'Internal Question Papers can only be built from READY previous-year questions. Creating a new question with AI or lecturer-authored text is not allowed.', { allowedMode: PYQ_BUILD_MODE }, 'CUSTOM_QUESTION_FORBIDDEN');
}
export function nonPyqSourceForbiddenError(source) {
    return new AppError(403, `Question source ${source || 'UNKNOWN'} is not allowed in Internal Question Paper generation. Only PREVIOUS_YEAR_QUESTION_PAPER questions with status READY_FOR_INTERNAL_PAPER may be used.`, { source }, 'NON_PYQ_SOURCE_FORBIDDEN');
}
export function formatQuestionSourceLabel(opts) {
    const exam = opts.examType || 'PYQ';
    const when = opts.examYear || opts.academicYear || opts.examMonth || '';
    return `${exam}${when ? ` ${when}` : ''} PYQ`;
}
export function cleanDisplayText(original) {
    return String(original || '')
        .replace(/\((\d+(?:\.\d+)?)\s*Marks?\)/gi, '')
        .replace(/\bM\s*:\s*\d+\b/g, '')
        .replace(/\bL\s*:\s*L?\d\b/gi, '')
        .replace(/\bC\s*:\s*CO?\d\b/gi, '')
        .replace(/\b\d{1,2}\s+L\s*[1-6]\s+CO\s*\d{1,2}\b/gi, '')
        .replace(/\bL\s*[1-6]\s+CO\s*\d{1,2}\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
export function textbookCitation(opts) {
    const title = String(opts.title || '').trim();
    if (!title)
        return null;
    const chapter = opts.chapter != null && String(opts.chapter).trim() ? `Chapter ${opts.chapter}` : null;
    const section = opts.section ? `Section ${opts.section}` : null;
    return ['Reference:', title, chapter, section].filter(Boolean).join(' ');
}
