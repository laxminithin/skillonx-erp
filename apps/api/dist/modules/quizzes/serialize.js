import { ANSWER_KEY_LEAK_KEYS } from '../../types/quiz.js';
const FORBIDDEN = new Set(ANSWER_KEY_LEAK_KEYS);
export function toPublicQuestion(question) {
    return {
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        marks: Number(question.marks),
        options: question.options.map((o) => ({ id: o.id, label: o.label })),
    };
}
export function toReviewQuestion(question, answer, includeKey) {
    const base = {
        ...toPublicQuestion(question),
        yourOptionIds: answer.selectedOptionIds,
        yourNumericAnswer: answer.numericAnswer,
        yourTextAnswer: answer.textAnswer,
        awardedMarks: answer.awardedMarks,
        isCorrect: includeKey ? answer.isCorrect : null,
        unanswered: answer.unanswered,
    };
    if (!includeKey)
        return base;
    return {
        ...base,
        correctOptionIds: question.correctOptionIds,
        explanation: question.explanation ?? null,
        numericAnswer: question.numericAnswer ?? null,
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
export function assertNoAnswerKeyLeak(payload, context) {
    const leaks = collectForbiddenKeys(payload);
    if (leaks.length) {
        throw new Error(`Answer-key leak in ${context}: ${leaks.join(', ')}`);
    }
}
export function canShowScore(params) {
    return params.showScoreImmediately || params.quizEnded;
}
export function canShowCorrectAnswers(params) {
    if (params.visibility === 'IMMEDIATELY')
        return true;
    if (params.visibility === 'AFTER_END')
        return params.quizEnded;
    return false;
}
