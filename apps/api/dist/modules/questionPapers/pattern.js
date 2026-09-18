export const STANDARD_IA_PATTERN_CODE = 'STANDARD_IA_50';
export const STANDARD_IA_SECTIONS = [
    {
        key: 'Q1',
        label: 'Question / Section 1',
        requiredMarks: 20,
        questionNumber: 1,
        defaultSplit: [10, 10],
        allowedSplits: [
            [20],
            [10, 10],
            [12, 8],
            [8, 12],
            [5, 5, 10],
        ],
        allowOr: true,
    },
    {
        key: 'Q2',
        label: 'Question / Section 2',
        requiredMarks: 20,
        questionNumber: 2,
        defaultSplit: [10, 10],
        allowedSplits: [
            [20],
            [10, 10],
            [12, 8],
            [8, 12],
            [5, 5, 10],
        ],
        allowOr: true,
    },
    {
        key: 'Q3',
        label: 'Question / Section 3',
        requiredMarks: 10,
        questionNumber: 3,
        defaultSplit: [10],
        allowedSplits: [[10], [5, 5], [4, 6], [6, 4]],
        allowOr: true,
    },
];
export const STANDARD_IA_PATTERN = {
    code: STANDARD_IA_PATTERN_CODE,
    name: 'STANDARD IA — 50 MARKS',
    maxMarks: 50,
    requiredAnswerMarks: 50,
    durationMinutes: 90,
    allowOrChoices: true,
    isDefault: true,
    sections: STANDARD_IA_SECTIONS,
};
export function parseSections(raw) {
    if (!raw)
        return STANDARD_IA_SECTIONS;
    let value = raw;
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw);
        }
        catch {
            return STANDARD_IA_SECTIONS;
        }
    }
    if (!Array.isArray(value) || !value.length)
        return STANDARD_IA_SECTIONS;
    return value.map((s, i) => ({
        key: String(s.key || `Q${i + 1}`),
        label: String(s.label || `Question / Section ${i + 1}`),
        requiredMarks: Number(s.requiredMarks || 0),
        questionNumber: Number(s.questionNumber || i + 1),
        defaultSplit: Array.isArray(s.defaultSplit) ? s.defaultSplit.map(Number) : [Number(s.requiredMarks || 0)],
        allowedSplits: Array.isArray(s.allowedSplits)
            ? s.allowedSplits.map((split) => split.map(Number))
            : [[Number(s.requiredMarks || 0)]],
        allowOr: s.allowOr !== false,
    }));
}
export function splitLetters(split) {
    if (split.length <= 1)
        return [''];
    return split.map((_, i) => String.fromCharCode(97 + i));
}
export function normalizeSplit(split, requiredMarks, allowed) {
    const sum = split.reduce((n, m) => n + m, 0);
    if (sum === requiredMarks) {
        const match = allowed.find((a) => a.length === split.length && a.every((v, i) => v === split[i]));
        if (match)
            return match;
        return split;
    }
    const fallback = allowed.find((a) => a.reduce((n, m) => n + m, 0) === requiredMarks);
    return fallback || [requiredMarks];
}
export function patternLabel(pattern) {
    return pattern.sections.map((s) => String(s.requiredMarks)).join(' + ') + ` = ${pattern.requiredAnswerMarks}`;
}
export function buildPatternSlots(input) {
    const slots = [];
    for (const section of input.pattern.sections) {
        const split = normalizeSplit(input.splits?.[section.key] || section.defaultSplit, section.requiredMarks, section.allowedSplits);
        const letters = splitLetters(split);
        const alternatives = input.includeOr && section.allowOr && input.pattern.allowOrChoices ? ['A', 'B'] : ['A'];
        for (const alt of alternatives) {
            const isOr = alternatives.length > 1;
            split.forEach((marks, i) => {
                const letter = letters[i] || null;
                const letterPart = letter ? `-${letter}` : '';
                slots.push({
                    key: `${section.key}-${alt}${letterPart}`,
                    section: section.key,
                    questionNumber: section.questionNumber,
                    subLetter: letter || null,
                    marks,
                    orGroupId: isOr ? section.key : null,
                    isOrChoice: isOr,
                    orAlternative: isOr ? alt : null,
                    countsTowardRequired: alt === 'A',
                });
            });
        }
    }
    return slots;
}
export function requiredAnswerMarks(slots) {
    return slots
        .filter((s) => s.countsTowardRequired !== false && (s.orAlternative == null || s.orAlternative === 'A'))
        .reduce((n, s) => n + Number(s.marks || 0), 0);
}
export function printedMarks(slots) {
    return slots.reduce((n, s) => n + Number(s.marks || 0), 0);
}
export function examTypeLabel(examType) {
    if (examType === 'IA-1')
        return 'Internal Assessment 1';
    if (examType === 'IA-2')
        return 'Internal Assessment 2';
    if (examType === 'IA-3')
        return 'Internal Assessment 3';
    if (examType === 'CIE')
        return 'Continuous Internal Evaluation';
    if (examType === 'MODEL_INTERNAL')
        return 'Model Internal';
    if (examType === 'MAKEUP')
        return 'Makeup Internal';
    return examType.replace(/_/g, ' ');
}
