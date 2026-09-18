import { isAttemptedMarkStatus, isExcludedMarkStatus, } from './types.js';
export function round4(n) {
    return Math.round(n * 10000) / 10000;
}
export function round2(n) {
    return Math.round(n * 100) / 100;
}
export function percentToLevel(percent, policy) {
    const sorted = [...policy.studentLevelThresholds].sort((a, b) => b.minPercent - a.minPercent);
    for (const t of sorted) {
        if (percent >= t.minPercent)
            return t.level;
    }
    return 0;
}
export function average(values) {
    if (!values.length)
        return null;
    return round4(values.reduce((s, n) => s + n, 0) / values.length);
}
export function weightedAverage(parts) {
    const mapped = parts.map((p) => ({
        ...p,
        included: p.value != null && Number.isFinite(p.value) && p.weight > 0,
    }));
    const used = mapped.filter((p) => p.included);
    const usedWeight = used.reduce((s, p) => s + p.weight, 0);
    const missing = mapped.filter((p) => !p.included && p.weight > 0).map((p) => p.key);
    if (!used.length || usedWeight <= 0) {
        return {
            result: null,
            usedWeight: 0,
            missing,
            formula: 'No contributing parts with both a value and a positive weight.',
            parts: mapped,
        };
    }
    const result = round4(used.reduce((s, p) => s + p.value * p.weight, 0) / usedWeight);
    const formula = used.map((p) => `${p.label} (${p.value}) × ${p.weight}`).join(' + ') + ` / ${round4(usedWeight)}`;
    return { result, usedWeight: round4(usedWeight), missing, formula, parts: mapped };
}
export function classifyCoStatus(input, policy) {
    if (input.actual == null || !Number.isFinite(input.actual))
        return 'INSUFFICIENT_DATA';
    if (input.actual < policy.defaultCoTarget && input.actual < input.target) {
        return 'RED';
    }
    if (input.actual < input.target)
        return 'RED';
    const weakIndicators = input.weakStudentRatio >= policy.amberWeakStudentRatio ||
        input.weakComponentGap >= policy.amberComponentGap ||
        (input.previousActual != null &&
            input.previousActual - input.actual >= policy.deteriorationThreshold);
    if (weakIndicators)
        return 'AMBER';
    if (input.actual < input.target + policy.greenComfortMargin)
        return 'AMBER';
    return 'GREEN';
}
export function gap(actual, target) {
    if (actual == null)
        return null;
    return round4(target - actual);
}
export function improvementDelta(revised, previous) {
    if (revised == null || previous == null)
        return null;
    return round4(revised - previous);
}
export function isEvaluatedStatus(status) {
    return isAttemptedMarkStatus(status);
}
function groupBy(items, key) {
    const map = new Map();
    for (const item of items) {
        const k = key(item);
        const list = map.get(k) ?? [];
        list.push(item);
        map.set(k, list);
    }
    return map;
}
export function computeSourceCoAttainment(source, policy) {
    const evaluated = new Set(source.students.filter((s) => isEvaluatedStatus(s.status)).map((s) => s.studentKey));
    const questionsByKey = new Map(source.questions.map((q) => [q.questionKey, q]));
    const coCodes = new Set();
    for (const q of source.questions) {
        if (q.coCode)
            coCodes.add(q.coCode.toUpperCase());
    }
    const rows = [];
    for (const coCode of [...coCodes].sort()) {
        const coQuestions = source.questions.filter((q) => (q.coCode || '').toUpperCase() === coCode);
        const availableMarks = coQuestions.reduce((s, q) => s + Number(q.maxMarks || 0), 0);
        const studentScores = [];
        const byStudent = groupBy(source.marks.filter((m) => evaluated.has(m.studentKey) && (m.coCode || '').toUpperCase() === coCode), (m) => m.studentKey);
        for (const studentKey of evaluated) {
            const marks = byStudent.get(studentKey) ?? [];
            let obtained = 0;
            let maxMarks = 0;
            for (const q of coQuestions) {
                const mark = marks.find((m) => m.questionKey === q.questionKey);
                // Excluded statuses (ABSENT / EXEMPT / NOT_EVALUATED / NOT_ATTEMPTED_DUE_TO_OR)
                // drop the question from BOTH numerator and denominator. The unchosen OR
                // alternative is NOT_ATTEMPTED_DUE_TO_OR, so it never depresses attainment.
                if (mark && isExcludedMarkStatus(mark.status)) {
                    continue;
                }
                maxMarks += q.maxMarks;
                obtained += mark?.awarded != null ? Number(mark.awarded) : 0;
            }
            if (maxMarks <= 0)
                continue;
            const percent = round2((obtained / maxMarks) * 100);
            studentScores.push({
                studentKey,
                coCode,
                obtained: round2(obtained),
                maxMarks: round2(maxMarks),
                percent,
                level: percentToLevel(percent, policy),
                belowThreshold: percent < policy.studentWeakPercent,
            });
        }
        const attainment = average(studentScores.map((s) => s.level));
        const weakStudentCount = studentScores.filter((s) => s.belowThreshold).length;
        const questionPercents = new Map();
        for (const mark of source.marks) {
            if (!evaluated.has(mark.studentKey))
                continue;
            if ((mark.coCode || '').toUpperCase() !== coCode)
                continue;
            if (mark.awarded == null || mark.maxMarks <= 0)
                continue;
            if (!isAttemptedMarkStatus(mark.status))
                continue;
            const list = questionPercents.get(mark.questionKey) ?? [];
            list.push((mark.awarded / mark.maxMarks) * 100);
            questionPercents.set(mark.questionKey, list);
        }
        const weakQuestions = [...questionPercents.entries()]
            .map(([questionKey, percents]) => {
            const q = questionsByKey.get(questionKey);
            return {
                questionKey,
                averagePercent: average(percents) ?? 0,
                bloomLevel: q?.bloomLevel ?? null,
                difficulty: q?.difficulty ?? null,
                topic: q?.topic ?? q?.module ?? null,
            };
        })
            .filter((q) => q.averagePercent < policy.studentWeakPercent)
            .sort((a, b) => a.averagePercent - b.averagePercent);
        const bloomGroups = groupBy([...questionPercents.entries()].map(([questionKey, percents]) => ({
            bloom: questionsByKey.get(questionKey)?.bloomLevel || 'UNKNOWN',
            percent: average(percents) ?? 0,
        })), (x) => String(x.bloom).toUpperCase());
        const bloomWeakness = [...bloomGroups.entries()]
            .map(([bloomLevel, items]) => ({
            bloomLevel,
            averagePercent: average(items.map((i) => i.percent)) ?? 0,
        }))
            .filter((b) => b.averagePercent < policy.studentWeakPercent);
        const diffGroups = groupBy([...questionPercents.entries()].map(([questionKey, percents]) => ({
            difficulty: questionsByKey.get(questionKey)?.difficulty || 'UNKNOWN',
            percent: average(percents) ?? 0,
        })), (x) => String(x.difficulty).toUpperCase());
        const difficultyWeakness = [...diffGroups.entries()]
            .map(([difficulty, items]) => ({
            difficulty,
            averagePercent: average(items.map((i) => i.percent)) ?? 0,
        }))
            .filter((d) => d.averagePercent < policy.studentWeakPercent);
        const topicGroups = groupBy([...questionPercents.entries()].map(([questionKey, percents]) => ({
            topic: questionsByKey.get(questionKey)?.topic || questionsByKey.get(questionKey)?.module || 'UNKNOWN',
            percent: average(percents) ?? 0,
        })), (x) => String(x.topic));
        const topicWeakness = [...topicGroups.entries()]
            .map(([topic, items]) => ({
            topic,
            averagePercent: average(items.map((i) => i.percent)) ?? 0,
        }))
            .filter((t) => t.averagePercent < policy.studentWeakPercent)
            .sort((a, b) => a.averagePercent - b.averagePercent);
        rows.push({
            coCode,
            attainment,
            studentCount: studentScores.length,
            weakStudentCount,
            weakStudentRatio: studentScores.length ? round4(weakStudentCount / studentScores.length) : 0,
            availableMarks: round2(availableMarks),
            questionCount: coQuestions.length,
            studentScores,
            weakQuestions,
            bloomWeakness,
            difficultyWeakness,
            topicWeakness,
        });
    }
    return rows;
}
export function combineDirect(cie, see, cieWeight, seeWeight) {
    return weightedAverage([
        { key: 'CIE', label: 'CIE CO attainment', value: cie, weight: cieWeight },
        { key: 'SEE', label: 'SEE CO attainment', value: see, weight: seeWeight },
    ]);
}
export function combineFinal(direct, indirect, policy) {
    const combined = weightedAverage([
        { key: 'DIRECT', label: 'Direct CO attainment', value: direct, weight: policy.directWeight },
        { key: 'INDIRECT', label: 'Indirect CO attainment', value: indirect, weight: policy.indirectWeight },
    ]);
    return { ...combined, indirectMissing: indirect == null };
}
export function rollupOutcomes(coAttainments, mappings) {
    const byOutcome = groupBy(mappings.filter((m) => m.strength > 0), (m) => m.outcomeCode.toUpperCase());
    const coMap = new Map(coAttainments.map((c) => [c.coCode.toUpperCase(), c.attainment]));
    const rows = [];
    for (const [outcomeCode, cells] of [...byOutcome.entries()].sort()) {
        const contributing = [];
        for (const cell of cells) {
            const coAttainment = coMap.get(cell.coCode.toUpperCase());
            if (coAttainment == null)
                continue;
            contributing.push({
                coCode: cell.coCode.toUpperCase(),
                strength: cell.strength,
                coAttainment,
                weighted: round4(coAttainment * cell.strength),
            });
        }
        const denom = contributing.reduce((s, c) => s + c.strength, 0);
        const attainment = denom > 0 ? round4(contributing.reduce((s, c) => s + c.weighted, 0) / denom) : null;
        const formula = denom > 0
            ? contributing.map((c) => `${c.coCode}(${c.coAttainment})×${c.strength}`).join(' + ') + ` / ${denom}`
            : 'No mapped COs with attainment';
        rows.push({ outcomeCode, attainment, contributing, formula });
    }
    return rows;
}
export function courseHealthPercent(statuses) {
    if (!statuses.length)
        return null;
    const scored = statuses.filter((s) => s !== 'INSUFFICIENT_DATA');
    if (!scored.length)
        return null;
    const points = scored.reduce((s, st) => s + (st === 'GREEN' ? 1 : st === 'AMBER' ? 0.5 : 0), 0);
    return round2((points / scored.length) * 100);
}
