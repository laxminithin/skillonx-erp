import { ACTIONS, CAUSE_ACTION_LINKS, ROOT_CAUSES } from './libraries.js';
const HIGHER_ORDER = new Set(['ANALYZE', 'ANALYSE', 'EVALUATE', 'CREATE', 'APPLY', 'APPLICATION']);
export function suggestRootCauses(input) {
    const merged = input.sourceDiagnostics;
    const bloomWeak = merged.flatMap((s) => s.bloomWeakness);
    const topicWeak = merged.flatMap((s) => s.topicWeakness);
    const questions = merged.flatMap((s) => s.weakQuestions);
    const suggestions = [];
    const add = (code, rationale) => {
        const def = ROOT_CAUSES.find((c) => c.code === code);
        if (!def || suggestions.some((s) => s.code === code))
            return;
        suggestions.push({
            code,
            label: def.label,
            rationale,
            confidence: 'SUGGESTED',
            disclaimer: 'Suggested based on assessment evidence',
        });
    };
    const applyBloom = bloomWeak.filter((b) => HIGHER_ORDER.has(b.bloomLevel));
    if (applyBloom.length) {
        add('ASSESSMENT_APPLICATION', `Weakness concentrated in ${applyBloom.map((b) => b.bloomLevel).join(', ')} questions.`);
        add('ASSESSMENT_PROBLEM_SOLVING', 'Application / problem-solving items are the weakest cluster.');
    }
    if (bloomWeak.some((b) => b.bloomLevel === 'ANALYZE' || b.bloomLevel === 'EVALUATE' || b.bloomLevel === 'CREATE')) {
        add('ASSESSMENT_HIGHER_ORDER', 'Higher-order Bloom items underperformed relative to the threshold.');
    }
    if (questions.length >= 2) {
        add('ASSESSMENT_PRACTICE', `${questions.length} questions in this CO scored below the expected threshold.`);
    }
    const topic = topicWeak.sort((a, b) => a.averagePercent - b.averagePercent)[0];
    if (topic && topic.topic !== 'UNKNOWN') {
        add('CONCEPTUAL_CORE', `Lowest topic performance: ${topic.topic}.`);
    }
    if ((input.assignmentNonCompletionRatio ?? 0) >= 0.25) {
        add('STUDENT_ASSIGNMENT', 'A meaningful share of students did not complete the mapped assignment.');
    }
    if (!suggestions.length && input.attainment != null && input.attainment < input.target) {
        add('CONCEPTUAL_REINFORCEMENT', 'Class attainment is below target without a more specific pattern.');
    }
    return suggestions;
}
export function recommendPlan(causes) {
    const actionCodes = new Set();
    for (const cause of causes) {
        const link = CAUSE_ACTION_LINKS.find((l) => l.cause === cause.code);
        for (const code of link?.actions ?? [])
            actionCodes.add(code);
    }
    if (!actionCodes.has('CO_REASSESSMENT'))
        actionCodes.add('CO_REASSESSMENT');
    const actions = [...actionCodes]
        .map((code) => ACTIONS.find((a) => a.code === code))
        .filter((a) => Boolean(a))
        .map((a) => ({ code: a.code, label: a.label, description: a.description }));
    const summary = causes.length
        ? `Suggested based on assessment evidence: ${causes.map((c) => c.label).join('; ')}.`
        : 'Suggested based on assessment evidence: general reinforcement and reassessment.';
    return { causes, actions, summary };
}
