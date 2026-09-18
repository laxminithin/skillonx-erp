import { QUALITY_SCORE_VERSION } from './types.js';
import { schemeComponentsValid } from './marksValidation.js';
const WEIGHTS = {
    MARKS_TOTAL: 12,
    MARKS_PRESENT: 8,
    CO_MAPPED: 12,
    NO_DUPLICATES: 10,
    SCHEME_COMPLETE: 10,
    SCHEME_TOTALS: 10,
    SOLUTION_COMPLETE: 10,
    CO_COVERAGE: 8,
    MODULE_COVERAGE: 6,
    BLOOM_SPREAD: 6,
    DIFFICULTY_SPREAD: 5,
    RECENT_REPEATS: 3,
};
function check(code, label, severity, passed, detail) {
    return { code, label, severity, passed, detail, weight: WEIGHTS[code] ?? 0 };
}
export function evaluatePaperQuality(input) {
    const items = input.items;
    const requiredItems = items.filter((i) => i.orAlternative !== 'B');
    const total = requiredItems.reduce((s, i) => s + Number(i.maxMarks || 0), 0);
    const expected = input.requiredAnswerMarks ?? input.maxMarks;
    const marksTotal = Math.abs(total - Number(expected)) <= 0.05;
    const marksPresent = items.length > 0 && items.every((i) => Number(i.maxMarks) > 0);
    const coMapped = items.length > 0 && items.every((i) => Boolean(i.primaryCo));
    const fps = items.map((i) => i.fingerprint).filter(Boolean);
    const noDup = new Set(fps).size === fps.length;
    const schemePresent = items.filter((i) => i.scheme && i.scheme.length);
    const schemeComplete = items.length > 0 && schemePresent.length === items.length;
    const schemeTotals = items.every((i) => {
        if (!i.scheme?.length)
            return true;
        return schemeComponentsValid(i.maxMarks, i.scheme).ok;
    });
    const solutionComplete = items.length > 0 && items.every((i) => Boolean(String(i.modelAnswer || '').trim()));
    const coveredCos = new Set(items.map((i) => (i.primaryCo || '').toUpperCase()).filter(Boolean));
    const requiredCos = input.courseCoCodes.map((c) => c.toUpperCase()).filter(Boolean);
    const coCoverage = requiredCos.length === 0 || requiredCos.every((c) => coveredCos.has(c));
    const coveredModules = new Set(items.map((i) => i.module).filter(Boolean));
    const moduleCoverage = !input.courseModules?.length || input.courseModules.every((m) => coveredModules.has(m));
    const blooms = new Set(items.map((i) => (i.bloomLevel || '').toUpperCase()).filter(Boolean));
    const bloomSpread = blooms.size >= 2 || items.length < 3;
    const diffs = new Set(items.map((i) => (i.difficulty || '').toUpperCase()).filter(Boolean));
    const difficultySpread = diffs.size >= 2 || items.length < 3;
    const cutoff = new Date().getFullYear() - (input.recentYearExclusion ?? 1);
    const recentRepeats = items.filter((i) => i.sourceExamYear && i.sourceExamYear >= cutoff).length;
    const noRecentRepeats = recentRepeats === 0;
    const checks = [
        check('MARKS_TOTAL', 'Marks distribution', 'CRITICAL', marksTotal, marksTotal ? `Required answer marks ${total} match ${expected}` : `Required answer marks ${total} must equal ${expected}`),
        check('MARKS_PRESENT', 'Every question has marks', 'CRITICAL', marksPresent, marksPresent ? 'All questions have marks' : 'One or more questions are missing marks'),
        check('CO_MAPPED', 'CO coverage of questions', 'CRITICAL', coMapped, coMapped ? 'Every question has a primary CO' : 'One or more questions have no primary CO'),
        check('NO_DUPLICATES', 'Duplicate questions', 'CRITICAL', noDup, noDup ? 'No duplicate questions detected' : 'Duplicate questions are not allowed'),
        check('SCHEME_TOTALS', 'Scheme totals', 'CRITICAL', schemeTotals, schemeTotals ? 'Each scheme sums to question marks' : 'One or more schemes do not sum to question marks'),
        check('SCHEME_COMPLETE', 'Scheme completeness', 'CRITICAL', schemeComplete, schemeComplete
            ? 'Every question has a marking scheme'
            : `${items.length - schemePresent.length} question(s) missing a marking scheme`),
        check('SOLUTION_COMPLETE', 'Solution completeness', 'CRITICAL', solutionComplete, solutionComplete ? 'Every question has a model solution' : 'One or more questions are missing a model solution'),
        check('CO_COVERAGE', 'Syllabus CO coverage', 'WARNING', coCoverage, coCoverage
            ? 'All course COs appear in the paper'
            : `Missing COs: ${requiredCos.filter((c) => !coveredCos.has(c)).join(', ')}`),
        check('MODULE_COVERAGE', 'Module coverage', 'WARNING', moduleCoverage, moduleCoverage ? 'Configured modules are represented' : 'One or more modules are not represented'),
        check('BLOOM_SPREAD', "Bloom's distribution", 'WARNING', bloomSpread, bloomSpread ? `Bloom levels present: ${[...blooms].join(', ') || 'n/a'}` : 'Paper uses a single Bloom level'),
        check('DIFFICULTY_SPREAD', 'Difficulty distribution', 'WARNING', difficultySpread, difficultySpread ? `Difficulties present: ${[...diffs].join(', ') || 'n/a'}` : 'Paper uses a single difficulty'),
        check('RECENT_REPEATS', 'Recently used questions', 'WARNING', noRecentRepeats, noRecentRepeats ? 'No recently used source questions' : `${recentRepeats} recently used question(s)`),
    ];
    const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
    const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
    const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
    const criticalFailures = checks.filter((c) => c.severity === 'CRITICAL' && !c.passed);
    return {
        version: QUALITY_SCORE_VERSION,
        okToPublish: criticalFailures.length === 0,
        score,
        criticalFailures,
        warnings: checks.filter((c) => c.severity === 'WARNING' && !c.passed),
        checks,
    };
}
