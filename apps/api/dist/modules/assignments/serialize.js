import { ANSWER_LEAK_KEYS } from '../../types/assignment.js';
const FORBIDDEN = new Set(ANSWER_LEAK_KEYS);
function parseJsonValue(value) {
    if (value == null)
        return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
/**
 * Submission snapshots are stored as a flat question array.
 * Published assignment snapshots use `{ questions: [...] }`.
 * Accept both shapes so evaluate/detail never silently see zero questions.
 */
export function parseSnapshotQuestions(raw) {
    const parsed = parseJsonValue(raw);
    if (Array.isArray(parsed))
        return parsed;
    if (parsed && typeof parsed === 'object') {
        const wrapped = parsed;
        if (Array.isArray(wrapped.questions))
            return wrapped.questions;
    }
    return [];
}
export function toPublicAssignmentQuestion(question) {
    return {
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        responseFormat: question.responseFormat,
        marks: Number(question.marks),
        difficulty: question.difficulty ?? null,
        sortOrder: question.sortOrder,
    };
}
export function collectForbiddenKeys(value, found = new Set()) {
    if (value == null)
        return [...found];
    if (Array.isArray(value)) {
        for (const item of value)
            collectForbiddenKeys(item, found);
        return [...found];
    }
    if (typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
            if (FORBIDDEN.has(key))
                found.add(key);
            collectForbiddenKeys(child, found);
        }
    }
    return [...found];
}
export function assertNoAnswerLeak(payload, context) {
    const leaks = collectForbiddenKeys(payload);
    if (leaks.length) {
        throw new Error(`Answer leak in ${context}: ${leaks.join(', ')}`);
    }
}
export function canShowAssignmentSolutions(params) {
    const now = params.now ?? new Date();
    const policy = params.policy || 'MANUAL_RELEASE';
    if (policy === 'NEVER')
        return false;
    if (policy === 'MANUAL_RELEASE')
        return Boolean(params.solutionsReleasedAt);
    if (policy === 'AFTER_DUE_DATE') {
        if (!params.dueAt)
            return false;
        return now.getTime() >= new Date(params.dueAt).getTime();
    }
    if (policy === 'AFTER_EVALUATION')
        return params.evaluationComplete;
    return false;
}
export function canShowAssignmentMarks(params) {
    if (params.resultsReleased || params.evaluationStatus === 'RELEASED')
        return true;
    if (params.showMarksImmediately && params.evaluationStatus === 'EVALUATED')
        return true;
    return false;
}
