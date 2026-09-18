import { tokenizeAcademicText } from '../questions/coMapping.js';
export const MODULE_ASSIGNMENT_METHODS = [
    'SOURCE_EXPLICIT',
    'VTU_STANDARD_PAIR_PATTERN',
    'SYLLABUS_TOPIC_VERIFIED',
    'MANUAL_REVIEW',
];
export const VTU_STANDARD_PAIRS = [
    { module: 1, questions: [1, 2], pairId: 'M1_PAIR_01' },
    { module: 2, questions: [3, 4], pairId: 'M2_PAIR_01' },
    { module: 3, questions: [5, 6], pairId: 'M3_PAIR_01' },
    { module: 4, questions: [7, 8], pairId: 'M4_PAIR_01' },
    { module: 5, questions: [9, 10], pairId: 'M5_PAIR_01' },
];
export function vtuPairForQuestion(questionNumber) {
    return VTU_STANDARD_PAIRS.find((p) => p.questions.includes(questionNumber)) ?? null;
}
export function moduleNumberFromLabel(label) {
    if (!label)
        return null;
    const m = String(label).match(/module\s*[-–—]?\s*(\d+)/i) || String(label).match(/\bM\s*(\d+)\b/i);
    return m ? Number(m[1]) : null;
}
export function looksLikeStandardFiveModulePaper(questions) {
    if (!questions.length)
        return false;
    if (questions.some((q) => q.questionType === 'MCQ'))
        return false;
    const nums = questions.map((q) => q.questionNumber).filter((n) => n >= 1 && n <= 10);
    const unique = [...new Set(nums)];
    const moduleNums = [
        ...new Set(questions.map((q) => moduleNumberFromLabel(q.moduleOrUnit)).filter((n) => n != null && n >= 1 && n <= 5)),
    ];
    const orCount = questions.filter((q) => q.isOrChoice).length;
    const hasFiveModules = moduleNums.length >= 5;
    const hasNearlyFullQn = unique.filter((n) => n <= 10).length >= 8;
    if (hasFiveModules && (orCount >= 3 || hasNearlyFullQn))
        return true;
    if (!hasNearlyFullQn)
        return false;
    const max = Math.max(...unique);
    if (max > 12)
        return false;
    return orCount >= 4 || moduleNums.length >= 4;
}
function pairIdForModule(moduleNo, seq = 1) {
    return `M${moduleNo}_PAIR_${String(seq).padStart(2, '0')}`;
}
/**
 * Inspect a VTU paper and attach module / OR-pair metadata.
 * Prefers printed module headings. Uses Q1/Q2→M1 … Q9/Q10→M5 only when the paper
 * matches the standard five-module shape. Never invents missing alternatives.
 */
export function assignVtuOrStructure(questions) {
    if (!questions.length)
        return questions;
    if (questions.every((q) => q.questionType === 'MCQ'))
        return questions;
    const standard = looksLikeStandardFiveModulePaper(questions);
    for (const q of questions) {
        const pair = vtuPairForQuestion(q.questionNumber);
        if (q.moduleOrUnit) {
            q.moduleAssignmentMethod = q.moduleAssignmentMethod || 'SOURCE_EXPLICIT';
        }
        else if (standard && pair) {
            q.moduleOrUnit = `Module ${pair.module}`;
            q.section = q.section || 'MODULE';
            q.moduleAssignmentMethod = 'VTU_STANDARD_PAIR_PATTERN';
        }
        else {
            q.moduleAssignmentMethod = q.moduleAssignmentMethod || 'MANUAL_REVIEW';
        }
    }
    // For standard five-module papers, always rewrite provisional OR-GROUP-* ids to
    // explicit M1_PAIR_01 … M5_PAIR_01. Module follows the Q1/Q2 pattern unless a
    // printed heading already matches that pair.
    if (standard) {
        // Prefer one canonical record per question number (richest subquestions / marks).
        const bestByNumber = new Map();
        for (const q of questions) {
            if (q.questionNumber < 1 || q.questionNumber > 10)
                continue;
            const prev = bestByNumber.get(q.questionNumber);
            const score = q.subquestions.length * 3 +
                (q.maxMarks != null ? 2 : 0) +
                (q.questionText?.length || 0) / 100;
            const prevScore = prev
                ? prev.subquestions.length * 3 + (prev.maxMarks != null ? 2 : 0) + (prev.questionText?.length || 0) / 100
                : -1;
            if (!prev || score > prevScore)
                bestByNumber.set(q.questionNumber, q);
        }
        for (const q of questions) {
            const pair = vtuPairForQuestion(q.questionNumber);
            if (!pair)
                continue;
            // Drop fragment rows that lost to a richer duplicate of the same Q number.
            if (bestByNumber.get(q.questionNumber) !== q && bestByNumber.has(q.questionNumber)) {
                continue;
            }
            const headingModule = moduleNumberFromLabel(q.moduleOrUnit);
            if (headingModule === pair.module) {
                q.moduleAssignmentMethod = q.moduleAssignmentMethod || 'SOURCE_EXPLICIT';
            }
            else {
                q.moduleOrUnit = `Module ${pair.module}`;
                q.moduleAssignmentMethod = headingModule ? 'VTU_STANDARD_PAIR_PATTERN' : 'VTU_STANDARD_PAIR_PATTERN';
            }
            q.section = q.section || 'MODULE';
            q.isOrChoice = true;
            q.orPairId = pair.pairId;
            q.orGroupId = pair.pairId;
            q.orAlternative = pair.questions[0] === q.questionNumber ? 'A' : 'B';
        }
        // Clear spurious OR metadata on non-canonical duplicates / out-of-range fragments.
        for (const q of questions) {
            if (q.questionNumber >= 1 && q.questionNumber <= 10 && bestByNumber.get(q.questionNumber) === q)
                continue;
            if (vtuPairForQuestion(q.questionNumber) && bestByNumber.get(q.questionNumber) !== q) {
                q.orPairId = null;
                q.orGroupId = null;
                q.orAlternative = null;
                q.isOrChoice = false;
            }
        }
    }
    else {
        const byModule = new Map();
        for (const q of questions) {
            const n = moduleNumberFromLabel(q.moduleOrUnit);
            if (!n)
                continue;
            const list = byModule.get(n) ?? [];
            list.push(q);
            byModule.set(n, list);
        }
        for (const [moduleNo, group] of byModule) {
            const standardPair = VTU_STANDARD_PAIRS.find((p) => p.module === moduleNo);
            const canonical = standardPair
                ? group.filter((q) => standardPair.questions.includes(q.questionNumber))
                : [];
            const ordered = canonical.length === 2
                ? [...canonical].sort((a, b) => a.questionNumber - b.questionNumber)
                : [...group].sort((a, b) => a.questionNumber - b.questionNumber).slice(0, 2);
            if (ordered.length === 2 && (canonical.length === 2 || ordered.some((q) => q.isOrChoice))) {
                const pid = standardPair?.pairId || pairIdForModule(moduleNo);
                ordered[0].isOrChoice = true;
                ordered[1].isOrChoice = true;
                ordered[0].orPairId = pid;
                ordered[1].orPairId = pid;
                ordered[0].orGroupId = pid;
                ordered[1].orGroupId = pid;
                ordered[0].orAlternative = 'A';
                ordered[1].orAlternative = 'B';
            }
        }
    }
    return questions;
}
export function missingOrAlternatives(questions) {
    const byPair = new Map();
    for (const q of questions) {
        if (!q.orPairId)
            continue;
        const list = byPair.get(q.orPairId) ?? [];
        list.push(q);
        byPair.set(q.orPairId, list);
    }
    const reviews = [];
    for (const [pairId, group] of byPair) {
        const alts = new Set(group.map((q) => q.orAlternative || 'A'));
        if (alts.size < 2) {
            const present = group[0];
            reviews.push({
                issueType: 'OR_STRUCTURE_AMBIGUOUS',
                reason: `OR pair ${pairId} is missing an alternative (only Q${present.questionNumber} / ${present.orAlternative || 'A'} found)`,
                questionRef: String(present.questionNumber),
                sourcePage: present.sourcePage,
                priority: 'HIGH',
            });
        }
    }
    return reviews;
}
export function marksMismatchReviews(questions) {
    const reviews = [];
    for (const q of questions) {
        if (!q.subquestions.length)
            continue;
        const printed = q.subquestions.reduce((n, s) => n + (s.maxMarks ?? 0), 0);
        const allKnown = q.subquestions.every((s) => s.maxMarks != null);
        if (!allKnown)
            continue;
        if (q.maxMarks != null && Math.abs(printed - q.maxMarks) > 0.05) {
            reviews.push({
                issueType: 'MARKS_MISSING',
                reason: `Q${q.questionNumber} subquestion marks ${printed} do not equal main total ${q.maxMarks}`,
                questionRef: String(q.questionNumber),
                sourcePage: q.sourcePage,
                priority: 'HIGH',
            });
        }
    }
    return reviews;
}
export function scoreModuleTopicOverlap(question, mod) {
    const text = [question.questionText, ...question.subquestions.map((s) => s.questionText)].join(' ');
    const qTokens = new Set(tokenizeAcademicText(text));
    const blob = `${mod.name} ${mod.code || ''} ${mod.description || ''}`.replace(/\b(module|unit)\s*\d+\b/gi, '');
    const tokens = tokenizeAcademicText(blob);
    let score = 0;
    const matched = [];
    for (const token of tokens) {
        if (qTokens.has(token)) {
            score += token.length >= 6 ? 1.4 : 1;
            matched.push(token);
        }
    }
    return { score, matched: [...new Set(matched)].slice(0, 8) };
}
/**
 * After paper-position assignment, verify topics against the subject syllabus.
 * Explicit paper headings stay. Standard-pair guesses may be overridden.
 */
export function verifyModuleAgainstSyllabus(question, modules) {
    const paperModule = question.moduleOrUnit;
    const paperNum = moduleNumberFromLabel(paperModule);
    const paperMethod = question.moduleAssignmentMethod || (paperModule ? 'SOURCE_EXPLICIT' : 'MANUAL_REVIEW');
    if (!modules.length) {
        return {
            moduleName: paperModule,
            moduleId: null,
            assignmentMethod: paperModule ? paperMethod : 'MANUAL_REVIEW',
            needsReview: true,
            mappingBasis: paperModule
                ? `Paper ${paperMethod} "${paperModule}" (subject modules not loaded)`
                : 'No syllabus modules available',
            confidence: paperModule ? 0.35 : 0,
            topicName: paperModule,
        };
    }
    const scored = modules
        .map((mod) => {
        const overlap = scoreModuleTopicOverlap(question, mod);
        const modNum = moduleNumberFromLabel(mod.name);
        return { mod, modNum, ...overlap };
    })
        .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const named = paperNum != null ? scored.find((s) => s.modNum === paperNum) : null;
    const conflict = best &&
        named &&
        best.mod.id !== named.mod.id &&
        best.score >= 2 &&
        best.score - named.score >= 1.5;
    if (paperMethod === 'SOURCE_EXPLICIT' && named) {
        const verified = named.score >= 1.2;
        return {
            moduleName: named.mod.name,
            moduleId: named.mod.id,
            assignmentMethod: verified ? 'SOURCE_EXPLICIT' : 'SOURCE_EXPLICIT',
            needsReview: !verified && named.score < 0.4,
            mappingBasis: verified
                ? `Paper heading "${paperModule}" matched syllabus ${named.mod.name} (${named.matched.join(', ') || 'module number'})`
                : `Paper heading "${paperModule}" kept; syllabus topic overlap was weak`,
            confidence: verified ? 0.9 : 0.55,
            topicName: named.mod.name,
        };
    }
    if (paperMethod === 'VTU_STANDARD_PAIR_PATTERN') {
        if (conflict && best) {
            return {
                moduleName: best.mod.name,
                moduleId: best.mod.id,
                assignmentMethod: 'SYLLABUS_TOPIC_VERIFIED',
                needsReview: false,
                mappingBasis: `Standard pair Q${question.questionNumber}→${paperModule} overridden: topics matched ${best.mod.name} (${best.matched.join(', ')})`,
                confidence: Math.min(0.95, 0.55 + best.score / 8),
                topicName: best.mod.name,
            };
        }
        if (named && named.score >= 1.0) {
            return {
                moduleName: named.mod.name,
                moduleId: named.mod.id,
                assignmentMethod: 'SYLLABUS_TOPIC_VERIFIED',
                needsReview: false,
                mappingBasis: `VTU standard pair Q${question.questionNumber} verified against ${named.mod.name} (${named.matched.join(', ') || 'module number'})`,
                confidence: 0.85,
                topicName: named.mod.name,
            };
        }
        if (named) {
            return {
                moduleName: named.mod.name,
                moduleId: named.mod.id,
                assignmentMethod: 'VTU_STANDARD_PAIR_PATTERN',
                needsReview: named.score < 0.4,
                mappingBasis: `VTU standard pair Q${question.questionNumber}→${named.mod.name}; syllabus overlap was weak`,
                confidence: 0.45,
                topicName: named.mod.name,
            };
        }
    }
    if (best && best.score >= 1.2 && (!scored[1] || best.score - scored[1].score >= 0.35)) {
        return {
            moduleName: best.mod.name,
            moduleId: best.mod.id,
            assignmentMethod: 'SYLLABUS_TOPIC_VERIFIED',
            needsReview: false,
            mappingBasis: `Question intent matched ${best.mod.name} (${best.matched.join(', ')})`,
            confidence: Math.min(0.95, 0.5 + best.score / 8),
            topicName: best.mod.name,
        };
    }
    return {
        moduleName: named?.mod.name || paperModule || best?.mod.name || null,
        moduleId: named?.mod.id ?? best?.mod.id ?? null,
        assignmentMethod: 'MANUAL_REVIEW',
        needsReview: true,
        mappingBasis: paperModule
            ? `Paper "${paperModule}" used; syllabus verification needs review`
            : 'Insufficient overlap with syllabus modules',
        confidence: named ? 0.35 : 0.15,
        topicName: named?.mod.name || paperModule || null,
    };
}
