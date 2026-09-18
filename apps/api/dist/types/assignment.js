export const ASSIGNMENT_QUESTION_TYPES = [
    'DESCRIPTIVE',
    'SHORT_ANALYSIS',
    'USE_CASE',
    'CASE_STUDY',
    'PROBLEM_SOLVING',
    'DESIGN',
    'COMPARE_JUSTIFY',
    'APPLICATION',
    'RESEARCH_TASK',
    'CODE_EXPLANATION',
    'SCENARIO',
    'ALGORITHM',
    'INTERPRETATION',
];
export const ASSIGNMENT_RESPONSE_FORMATS = [
    'LONG_TEXT',
    'SHORT_TEXT',
    'CODE_TEXT',
    'NUMERIC',
];
export const ASSIGNMENT_DIFFICULTIES = ['EASY', 'INTERMEDIATE', 'DIFFICULT'];
export const ASSIGNMENT_REVIEW_STATUSES = ['APPROVED', 'NEEDS_REVIEW', 'READY'];
export const ASSIGNMENT_SELECTABLE_STATUSES = ['APPROVED', 'READY'];
export const ASSIGNMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'];
export const ASSIGNMENT_SUBMISSION_STATUSES = [
    'IN_PROGRESS',
    'SUBMITTED',
    'LATE_SUBMITTED',
];
export const ASSIGNMENT_EVALUATION_STATUSES = [
    'PENDING',
    'IN_PROGRESS',
    'EVALUATED',
    'RELEASED',
];
export const CO_VERIFICATION_STATUSES = [
    'VERIFIED_SOURCE',
    'VERIFIED',
    'ACADEMIC_ANALYSIS',
    'NEEDS_REVIEW',
    'CO_MAPPING_BLOCKED',
];
export const SOLUTION_RELEASE_POLICIES = [
    'NEVER',
    'AFTER_DUE_DATE',
    'AFTER_EVALUATION',
    'MANUAL_RELEASE',
];
export const GENERATOR_PRESETS = ['SHORT', 'STANDARD', 'DEEP_DIVE', 'CUSTOM'];
/** Keys that must never appear in public/student assignment payloads. */
export const ANSWER_LEAK_KEYS = [
    'modelSolution',
    'expectedAnswerGuidance',
    'expected_answer_guidance',
    'evaluationRubric',
    'evaluation_rubric',
    'evaluationScheme',
    'evaluation_scheme',
    'expectedKeyPoints',
    'expected_key_points',
    'facultyNotes',
    'faculty_notes',
    'schemeMarks',
    'scheme_marks',
    'correctAnswer',
    'answerKey',
];
export const ASSIGNMENT_QUESTION_TYPE_LABELS = {
    DESCRIPTIVE: 'Descriptive',
    SHORT_ANALYSIS: 'Short Analysis',
    USE_CASE: 'Use Case',
    CASE_STUDY: 'Case Study',
    PROBLEM_SOLVING: 'Problem Solving',
    DESIGN: 'Design',
    COMPARE_JUSTIFY: 'Compare / Justify',
    APPLICATION: 'Application',
    RESEARCH_TASK: 'Research Task',
    CODE_EXPLANATION: 'Code Explanation',
    SCENARIO: 'Scenario',
    ALGORITHM: 'Algorithm',
    INTERPRETATION: 'Interpretation',
};
export const ASSIGNMENT_DIFFICULTY_LABELS = {
    EASY: 'Easy',
    INTERMEDIATE: 'Intermediate',
    DIFFICULT: 'Difficult',
};
export function normalizeAssignmentDifficulty(raw) {
    if (!raw)
        return null;
    const token = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
    if (['easy', 'basic', 'beginner'].includes(token))
        return 'EASY';
    if (['intermediate', 'medium', 'moderate'].includes(token))
        return 'INTERMEDIATE';
    if (['difficult', 'hard', 'advanced'].includes(token))
        return 'DIFFICULT';
    return null;
}
export function normalizeAssignmentQuestionType(raw) {
    if (!raw)
        return null;
    const token = raw
        .trim()
        .toUpperCase()
        .replace(/[\s/-]+/g, '_');
    const aliases = {
        DESCRIPTIVE: 'DESCRIPTIVE',
        DEFINITION: 'DESCRIPTIVE',
        SHORT_NOTES: 'DESCRIPTIVE',
        EXPLAIN: 'DESCRIPTIVE',
        SHORT_ANALYSIS: 'SHORT_ANALYSIS',
        ANALYSIS: 'SHORT_ANALYSIS',
        USE_CASE: 'USE_CASE',
        USECASE: 'USE_CASE',
        CASE: 'CASE_STUDY',
        CASE_STUDY: 'CASE_STUDY',
        PROBLEM: 'PROBLEM_SOLVING',
        PROBLEM_SOLVING: 'PROBLEM_SOLVING',
        NUMERICAL: 'PROBLEM_SOLVING',
        CONSTRUCTION: 'DESIGN',
        DESIGN: 'DESIGN',
        COMPARE: 'COMPARE_JUSTIFY',
        COMPARE_JUSTIFY: 'COMPARE_JUSTIFY',
        JUSTIFY: 'COMPARE_JUSTIFY',
        APPLICATION: 'APPLICATION',
        RESEARCH: 'RESEARCH_TASK',
        RESEARCH_TASK: 'RESEARCH_TASK',
        LAB: 'RESEARCH_TASK',
        CODE: 'CODE_EXPLANATION',
        CODE_EXPLANATION: 'CODE_EXPLANATION',
        SCENARIO: 'SCENARIO',
        LIST: 'SHORT_ANALYSIS',
        PRODUCT: 'PROBLEM_SOLVING',
        PROOF: 'PROBLEM_SOLVING',
        ALGORITHM: 'ALGORITHM',
        PSEUDOCODE: 'ALGORITHM',
        TRACE: 'ALGORITHM',
        INTERPRETATION: 'INTERPRETATION',
        INTERPRET: 'INTERPRETATION',
        DIAGRAM: 'INTERPRETATION',
        CRITIQUE: 'SHORT_ANALYSIS',
        ESSAY: 'DESCRIPTIVE',
        REDUCTION: 'PROBLEM_SOLVING',
        DEBUG: 'CODE_EXPLANATION',
    };
    return aliases[token] ?? (ASSIGNMENT_QUESTION_TYPES.includes(token)
        ? token
        : null);
}
export function isSelectableAssignmentStatus(status) {
    return status === 'APPROVED' || status === 'READY';
}
export function normalizeQuestionText(text) {
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
}
export function defaultMarksForDifficulty(difficulty) {
    if (difficulty === 'EASY')
        return 5;
    if (difficulty === 'DIFFICULT')
        return 15;
    return 10;
}
export function countWords(text) {
    if (!text)
        return 0;
    const trimmed = text.trim();
    if (!trimmed)
        return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}
export function defaultResponseFormatForType(type) {
    if (type === 'CODE_EXPLANATION' || type === 'ALGORITHM')
        return 'CODE_TEXT';
    if (type === 'PROBLEM_SOLVING')
        return 'LONG_TEXT';
    if (type === 'SHORT_ANALYSIS')
        return 'SHORT_TEXT';
    return 'LONG_TEXT';
}
/** Type-appropriate rubric whose criterion marks sum exactly to `marks`. */
export function synthesizeEvaluationRubric(type, marks) {
    const total = marks > 0 ? marks : 10;
    const split = (parts) => {
        const weightSum = parts.reduce((s, p) => s + p.weight, 0) || 1;
        const raw = parts.map((p) => ({
            criterion: p.criterion,
            marks: Math.round((total * p.weight) / weightSum),
            guidance: p.guidance,
        }));
        let allocated = raw.reduce((s, c) => s + c.marks, 0);
        let i = 0;
        while (allocated !== total && raw.length) {
            const idx = i % raw.length;
            if (allocated < total) {
                raw[idx].marks += 1;
                allocated += 1;
            }
            else if (raw[idx].marks > 0) {
                raw[idx].marks -= 1;
                allocated -= 1;
            }
            i += 1;
            if (i > total * 4)
                break;
        }
        return { totalMarks: total, criteria: raw };
    };
    switch (type) {
        case 'PROBLEM_SOLVING':
        case 'ALGORITHM':
            return split([
                { criterion: 'Correct problem formulation / assumptions', weight: 2 },
                { criterion: 'Method / algorithm steps', weight: 3 },
                { criterion: 'Working / intermediate results', weight: 3 },
                { criterion: 'Final result with justification', weight: 2 },
            ]);
        case 'CASE_STUDY':
        case 'SCENARIO':
        case 'USE_CASE':
            return split([
                { criterion: 'Situation understanding', weight: 2 },
                { criterion: 'Relevant concepts applied', weight: 3 },
                { criterion: 'Analysis / trade-offs', weight: 3 },
                { criterion: 'Recommendations / conclusion', weight: 2 },
            ]);
        case 'DESIGN':
            return split([
                { criterion: 'Requirements capture', weight: 2 },
                { criterion: 'Design / construction correctness', weight: 4 },
                { criterion: 'Completeness (edge cases / totality)', weight: 2 },
                { criterion: 'Clarity of diagram or specification', weight: 2 },
            ]);
        case 'COMPARE_JUSTIFY':
            return split([
                { criterion: 'Accurate characterization of each side', weight: 3 },
                { criterion: 'Meaningful comparison dimensions', weight: 3 },
                { criterion: 'Justified conclusion', weight: 4 },
            ]);
        case 'CODE_EXPLANATION':
            return split([
                { criterion: 'Correct reading of code / algorithm', weight: 3 },
                { criterion: 'Explanation of control / data flow', weight: 4 },
                { criterion: 'Complexity / edge-case remarks', weight: 3 },
            ]);
        case 'INTERPRETATION':
            return split([
                { criterion: 'Accurate reading of given artifact', weight: 3 },
                { criterion: 'Correct inference / meaning', weight: 4 },
                { criterion: 'Supported conclusion', weight: 3 },
            ]);
        case 'RESEARCH_TASK':
            return split([
                { criterion: 'Scope and sources', weight: 2 },
                { criterion: 'Technical depth', weight: 4 },
                { criterion: 'Critical synthesis', weight: 3 },
                { criterion: 'Citation / academic honesty', weight: 1 },
            ]);
        case 'APPLICATION':
            return split([
                { criterion: 'Correct concept selection', weight: 3 },
                { criterion: 'Application to the given context', weight: 4 },
                { criterion: 'Limitations / assumptions', weight: 3 },
            ]);
        case 'SHORT_ANALYSIS':
            return split([
                { criterion: 'Key points covered', weight: 5 },
                { criterion: 'Clarity and precision', weight: 5 },
            ]);
        case 'DESCRIPTIVE':
        default:
            return split([
                { criterion: 'Definition / core idea', weight: 3 },
                { criterion: 'Explanation with example', weight: 4 },
                { criterion: 'Completeness and clarity', weight: 3 },
            ]);
    }
}
