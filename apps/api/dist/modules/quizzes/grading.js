import { AUTO_GRADABLE_TYPES } from '../../types/quiz.js';
export function isAnswered(question, answer) {
    if (!answer)
        return false;
    if (question.questionType === 'SHORT_ANSWER' || question.questionType === 'NUMERIC') {
        if (question.questionType === 'NUMERIC') {
            return answer.numericAnswer != null && Number.isFinite(Number(answer.numericAnswer));
        }
        return Boolean(answer.textAnswer?.trim());
    }
    const ids = answer.selectedOptionIds ?? [];
    return ids.length > 0;
}
function optionSetsEqual(a, b) {
    if (a.length !== b.length)
        return false;
    const set = new Set(a);
    return b.every((id) => set.has(id));
}
export function gradeQuestion(question, answer) {
    const selected = [...(answer?.selectedOptionIds ?? [])].map(Number).filter(Number.isFinite);
    const numeric = answer?.numericAnswer == null || answer.numericAnswer === ''
        ? null
        : Number(answer.numericAnswer);
    const text = answer?.textAnswer?.trim() ? answer.textAnswer.trim() : null;
    const unanswered = !isAnswered(question, answer);
    const maxMarks = Number(question.maxMarks ?? question.marks ?? 1);
    const base = {
        questionId: question.id,
        selectedOptionIds: selected,
        numericAnswer: Number.isFinite(numeric) ? numeric : null,
        textAnswer: text,
        awardedMarks: 0,
        maxMarks,
        primaryCoCode: question.primaryCoCode ? String(question.primaryCoCode).toUpperCase() : null,
        primaryCoId: question.primaryCoId != null ? Number(question.primaryCoId) : null,
        isCorrect: false,
        needsManualGrading: false,
        unanswered,
    };
    if (unanswered) {
        return { ...base, isCorrect: false, awardedMarks: 0 };
    }
    if (question.questionType === 'SHORT_ANSWER') {
        return {
            ...base,
            awardedMarks: 0,
            isCorrect: null,
            needsManualGrading: true,
        };
    }
    if (!AUTO_GRADABLE_TYPES.has(question.questionType)) {
        return { ...base, isCorrect: null, needsManualGrading: true };
    }
    let correct = false;
    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        const expected = question.correctOptionIds[0];
        correct = selected.length === 1 && selected[0] === expected;
    }
    else if (question.questionType === 'MULTIPLE_SELECT') {
        correct = optionSetsEqual(selected, question.correctOptionIds);
    }
    else if (question.questionType === 'NUMERIC') {
        const target = Number(question.numericAnswer);
        const tol = Number(question.numericTolerance ?? 0);
        const value = Number(numeric);
        correct = Number.isFinite(target) && Number.isFinite(value) && Math.abs(value - target) <= (Number.isFinite(tol) ? tol : 0);
    }
    return {
        ...base,
        isCorrect: correct,
        awardedMarks: correct ? maxMarks : 0,
    };
}
export function gradeAttempt(questions, answers, passPercentage) {
    const byId = new Map(answers.map((a) => [a.questionId, a]));
    const graded = questions.map((q) => gradeQuestion(q, byId.get(q.id)));
    const totalMarks = questions.reduce((sum, q) => sum + Number(q.maxMarks ?? q.marks), 0);
    const obtainedMarks = graded.reduce((sum, a) => sum + a.awardedMarks, 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;
    const passed = percentage + 1e-9 >= Number(passPercentage);
    return {
        answers: graded,
        obtainedMarks: Math.round(obtainedMarks * 100) / 100,
        totalMarks: Math.round(totalMarks * 100) / 100,
        percentage,
        passed,
        needsManualGrading: graded.some((a) => a.needsManualGrading),
    };
}
export function remainingSeconds(expiresAt, now = new Date()) {
    if (expiresAt == null)
        return null;
    const end = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (Number.isNaN(end.getTime()))
        return null;
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}
export function isAttemptExpired(expiresAt, now = new Date()) {
    const remaining = remainingSeconds(expiresAt, now);
    return remaining != null && remaining <= 0;
}
export function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export function pickRandom(items, count) {
    if (count >= items.length)
        return shuffled(items);
    return shuffled(items).slice(0, Math.max(0, count));
}
export function computeExpiresAt(startedAt, durationMinutes) {
    if (durationMinutes == null || durationMinutes <= 0)
        return null;
    return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}
export function canStartNewAttempt(params) {
    if (params.inProgressCount > 0)
        return { ok: false, reason: 'IN_PROGRESS' };
    if (params.attemptsAllowed > 0 && params.submittedCount >= params.attemptsAllowed) {
        return { ok: false, reason: 'LIMIT' };
    }
    return { ok: true };
}
