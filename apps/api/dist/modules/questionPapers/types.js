export const EXAM_TYPES = [
    'SEE',
    'MAKEUP',
    'SUPPLEMENTARY',
    'MODEL',
    'INTERNAL',
    'CIE',
    'IA-1',
    'IA-2',
    'CUSTOM',
];
export const EXTRACTION_STATUSES = [
    'EXTRACTED',
    'PARTIAL',
    'NEEDS_REVIEW',
    'OCR_REQUIRED',
    'FAILED',
];
export const VERIFICATION_STATUSES = [
    'ACADEMIC_ANALYSIS',
    'NEEDS_REVIEW',
    'VERIFIED_SOURCE',
    'CO_MAPPING_BLOCKED',
    'MARKS_MISSING',
    'QUESTION_TEXT_INCOMPLETE',
    'OR_STRUCTURE_AMBIGUOUS',
];
export const BLOOM_LEVELS = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
];
export const DIFFICULTIES = ['EASY', 'INTERMEDIATE', 'DIFFICULT'];
export const QUESTION_TYPES = [
    'DESCRIPTIVE',
    'SHORT_ANSWER',
    'NUMERICAL',
    'MCQ',
    'CASE_STUDY',
    'PROBLEM',
];
export const INTERNAL_PAPER_STATUSES = ['DRAFT', 'FINALIZED', 'ARCHIVED'];
export const INTERNAL_EXAM_TYPES = [
    'IA-1',
    'IA-2',
    'IA-3',
    'CIE',
    'MODEL_INTERNAL',
    'MAKEUP',
    'CUSTOM',
];
export const WORKFLOW_STEPS = [
    'SETUP',
    'PORTIONS',
    'PATTERN',
    'BLUEPRINT',
    'QUESTIONS',
    'SCHEME',
    'REVIEW',
];
export const QUESTION_SOURCES = ['PREVIOUS_YEAR', 'QUESTION_BANK', 'QUIZ_BANK', 'CUSTOM'];
export const MASTER_BANK_SOURCE_TYPE = 'PREVIOUS_YEAR_QUESTION_PAPER';
export const MQB_READINESS_STATUSES = [
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
export const MODULE_ASSIGNMENT_METHODS = [
    'SOURCE_EXPLICIT',
    'VTU_STANDARD_PAIR_PATTERN',
    'SYLLABUS_TOPIC_VERIFIED',
    'MANUAL_REVIEW',
];
export function normalizeCourseCode(code) {
    return String(code || '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .replace(/[–—]/g, '/');
}
export function monthKey(label) {
    if (!label)
        return { month: null, year: null };
    const s = String(label);
    const yearMatch = s.match(/(20\d{2})/g);
    const year = yearMatch ? Number(yearMatch[yearMatch.length - 1]) : null;
    if (/june|july|jun|jul/i.test(s))
        return { month: 'JUN', year };
    if (/dec|jan/i.test(s))
        return { month: 'JAN', year };
    if (/feb|february/i.test(s))
        return { month: 'FEB', year };
    if (/mar|march/i.test(s))
        return { month: 'MAR', year };
    if (/apr|april/i.test(s))
        return { month: 'APR', year };
    if (/aug|august/i.test(s))
        return { month: 'AUG', year };
    if (/sep/i.test(s))
        return { month: 'SEP', year };
    if (/oct/i.test(s))
        return { month: 'OCT', year };
    if (/nov/i.test(s))
        return { month: 'NOV', year };
    if (/may/i.test(s))
        return { month: 'MAY', year };
    return { month: null, year };
}
export function academicYearFromExam(month, year) {
    if (!year)
        return null;
    if (month === 'JAN' || month === 'FEB' || month === 'MAR') {
        return `${year - 1}-${String(year).slice(2)}`;
    }
    return `${year}-${String(year + 1).slice(2)}`;
}
export function durationMinutesFromText(text) {
    const hours = text.match(/Time\s*:\s*(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i);
    if (hours)
        return Math.round(Number(hours[1]) * 60);
    const mins = text.match(/Time\s*:\s*(\d+)\s*(?:min|minutes)/i);
    if (mins)
        return Number(mins[1]);
    return null;
}
export function maxMarksFromText(text) {
    const m = text.match(/Max\.?\s*Marks\s*:\s*(\d+)/i) || text.match(/\[\s*Max\.?\s*Marks\s*:\s*(\d+)\s*\]/i);
    return m ? Number(m[1]) : null;
}
export function flattenText(text) {
    return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function normalizeQuestionFingerprint(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9+\-./\s]/g, '')
        .trim()
        .slice(0, 512);
}
