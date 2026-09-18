import { rbtFromBloom } from './rbt.js';
import { itemLabel, inSelectedScope, isBlockedForFinalize, orPairBalance, crossModuleMessage } from './generator.js';
import { isAllowedInternalSource } from './sourcePolicy.js';
import { schemeComponentsValid } from '../attainment/marksValidation.js';
function labelOf(item) {
    return itemLabel({
        questionNumber: item.questionNumber,
        subLetter: item.subLetter,
        orAlternative: item.orAlternative,
    });
}
function requiredItems(items) {
    return items.filter((i) => i.orAlternative !== 'B');
}
export function validateInternalPaper(input) {
    const issues = [];
    const required = input.requiredAnswerMarks ?? input.blueprint?.requiredAnswerMarks ?? input.maxMarks;
    const printed = input.items.reduce((n, i) => n + Number(i.maxMarks || 0), 0);
    const answerable = requiredItems(input.items).reduce((n, i) => n + Number(i.maxMarks || 0), 0);
    const pattern = input.patternMarks?.length
        ? input.patternMarks
        : input.blueprint?.workflowVersion === 2
            ? [20, 20, 10]
            : null;
    if (Math.abs(required - input.maxMarks) > 0.05) {
        issues.push({
            code: 'MAX_MARKS',
            severity: 'CRITICAL',
            message: `Maximum marks ${input.maxMarks} must equal required answer marks ${required}.`,
        });
    }
    if (Math.abs(answerable - required) > 0.05) {
        issues.push({
            code: 'REQUIRED_MARKS',
            severity: 'CRITICAL',
            message: `Required answer marks ${answerable} must equal ${required}.`,
        });
    }
    if (pattern) {
        const byQ = new Map();
        for (const item of requiredItems(input.items)) {
            byQ.set(item.questionNumber, (byQ.get(item.questionNumber) || 0) + item.maxMarks);
        }
        const got = [...byQ.entries()].sort((a, b) => a[0] - b[0]).map(([, m]) => m);
        const patternOk = got.length === pattern.length && got.every((m, i) => Math.abs(m - pattern[i]) < 0.05);
        if (!patternOk) {
            issues.push({
                code: 'PATTERN',
                severity: 'CRITICAL',
                message: `Pattern must be ${pattern.join(' + ')} = ${pattern.reduce((n, m) => n + m, 0)}. Found ${got.join(' + ') || 'no questions'}.`,
            });
        }
    }
    const fps = input.items.map((i) => i.fingerprint).filter(Boolean);
    if (new Set(fps).size !== fps.length) {
        issues.push({ code: 'DUPLICATES', severity: 'CRITICAL', message: 'Duplicate questions are not allowed.' });
    }
    const bp = input.blueprint;
    if (bp && ((bp.selectedModuleIds?.length || 0) > 0 || (bp.modules?.length || 0) > 0)) {
        for (const item of input.items) {
            const fake = {
                id: String(item.itemKey),
                source: 'CUSTOM',
                sourceQuestionId: null,
                questionText: '',
                marks: item.maxMarks,
                moduleName: item.moduleOrUnit ?? null,
                moduleId: item.moduleId ?? null,
                topicId: item.topicId ?? null,
                coCode: item.primaryCo ?? null,
                difficulty: null,
                bloomLevel: null,
                fingerprint: String(item.fingerprint || item.itemKey),
                examYear: null,
                appearanceCount: 1,
                lastAppeared: null,
                isOrChoice: false,
                orGroupId: null,
                eligible: true,
            };
            if (!inSelectedScope(fake, bp)) {
                issues.push({
                    code: 'SYLLABUS',
                    severity: 'CRITICAL',
                    itemKey: item.itemKey,
                    questionLabel: labelOf(item),
                    message: crossModuleMessage(labelOf(item), item.moduleOrUnit),
                });
            }
        }
    }
    for (const item of input.items) {
        if (isBlockedForFinalize({
            id: item.itemKey,
            source: item.sourceKind ?? 'CUSTOM',
            sourceType: item.sourceType ?? (item.sourceKind === 'PREVIOUS_YEAR' ? 'PREVIOUS_YEAR_QUESTION_PAPER' : item.sourceKind ?? null),
            sourceQuestionId: null,
            questionText: '',
            marks: item.maxMarks,
            moduleName: null,
            moduleId: null,
            coCode: item.primaryCo ?? null,
            difficulty: null,
            bloomLevel: null,
            fingerprint: String(item.fingerprint || item.itemKey),
            examYear: null,
            appearanceCount: 1,
            lastAppeared: null,
            isOrChoice: false,
            orGroupId: null,
            eligible: true,
            readinessStatus: item.readinessStatus ?? item.verificationStatus ?? null,
            verificationStatus: item.verificationStatus,
            coMappingBlocked: item.coMappingBlocked,
            needsReview: item.needsFacultyVerification,
        })) {
            issues.push({
                code: 'INVALID_QUESTION',
                severity: 'CRITICAL',
                itemKey: item.itemKey,
                questionLabel: labelOf(item),
                message: `${labelOf(item)} is ${item.coMappingBlocked ? 'CO_MAPPING_BLOCKED' : 'NEEDS_REVIEW'} and cannot be used in a finalized paper without faculty verification.`,
            });
        }
        if (!item.primaryCo) {
            issues.push({
                code: 'CO',
                severity: 'CRITICAL',
                itemKey: item.itemKey,
                questionLabel: labelOf(item),
                message: `${labelOf(item)} has no primary CO.`,
            });
        }
        // Source priority: every component must be VTU SEE PYQ or the Module Question
        // Bank fallback — never AI/custom/quiz/assignment/other (spec §5, §30).
        if (item.sourceKind && !isAllowedInternalSource(item.sourceKind)) {
            issues.push({
                code: 'SOURCE_NOT_ALLOWED_FOR_INTERNAL',
                severity: 'CRITICAL',
                itemKey: item.itemKey,
                questionLabel: labelOf(item),
                message: `${labelOf(item)} has source ${item.sourceKind}. Only VTU SEE PYQ or Module Question Bank questions are allowed.`,
            });
        }
        if (!item.scheme?.length) {
            issues.push({
                code: 'SCHEME_MISSING',
                severity: 'CRITICAL',
                itemKey: item.itemKey,
                questionLabel: labelOf(item),
                message: `${labelOf(item)} has no marking scheme.`,
            });
        }
        else {
            const check = schemeComponentsValid(item.maxMarks, item.scheme);
            if (!check.ok) {
                const schemeTotal = item.scheme.reduce((n, c) => n + Number(c.maxMarks || 0), 0);
                issues.push({
                    code: 'SCHEME_TOTAL',
                    severity: 'CRITICAL',
                    itemKey: item.itemKey,
                    questionLabel: labelOf(item),
                    message: `${labelOf(item)}: Scheme totals ${schemeTotal} marks but question carries ${item.maxMarks} marks.`,
                });
            }
        }
        if (!String(item.modelAnswer || '').trim()) {
            issues.push({
                code: 'SOLUTION',
                severity: 'CRITICAL',
                itemKey: item.itemKey,
                questionLabel: labelOf(item),
                message: `${labelOf(item)} has no model solution.`,
            });
        }
    }
    const orRequired = Boolean(input.blueprint?.allowOrChoices);
    if (orRequired) {
        // Every main question slot must be an OR pair: Q1(A) OR Q1(B) is one slot and
        // the student answers exactly one alternative (OR-pair spec §3). A slot printed
        // without its second alternative is not a valid internal paper.
        const byQuestion = new Map();
        for (const item of input.items) {
            const list = byQuestion.get(item.questionNumber) ?? [];
            list.push(item);
            byQuestion.set(item.questionNumber, list);
        }
        for (const [questionNumber, group] of byQuestion) {
            const hasA = group.some((i) => i.orAlternative == null || i.orAlternative === 'A');
            const hasB = group.some((i) => i.orAlternative === 'B');
            if (hasA && !hasB) {
                issues.push({
                    code: 'OR_MISSING_ALTERNATIVE',
                    severity: 'CRITICAL',
                    message: `Q${questionNumber} has no OR alternative. Every question slot must offer two alternatives (Q${questionNumber}(A) OR Q${questionNumber}(B)).`,
                });
            }
        }
    }
    const groups = new Map();
    for (const item of input.items) {
        if (!item.orGroupId)
            continue;
        const list = groups.get(item.orGroupId) ?? [];
        list.push(item);
        groups.set(item.orGroupId, list);
    }
    for (const [groupId, group] of groups) {
        const a = group.filter((i) => i.orAlternative !== 'B');
        const b = group.filter((i) => i.orAlternative === 'B');
        if (!b.length)
            continue;
        const aMarks = a.reduce((n, i) => n + i.maxMarks, 0);
        const bMarks = b.reduce((n, i) => n + i.maxMarks, 0);
        const balance = orPairBalance({
            marks: aMarks,
            coCode: a[0]?.primaryCo,
            difficulty: a[0]?.difficulty,
            bloomLevel: a[0]?.bloomLevel,
            rbtLevel: a[0]?.rbtLevel,
            moduleId: a[0]?.moduleId,
        }, {
            marks: bMarks,
            coCode: b[0]?.primaryCo,
            difficulty: b[0]?.difficulty,
            bloomLevel: b[0]?.bloomLevel,
            rbtLevel: b[0]?.rbtLevel,
            moduleId: b[0]?.moduleId,
        });
        if (!balance.marksBalanced) {
            issues.push({
                code: 'OR_MARKS',
                severity: 'CRITICAL',
                message: `OR pair ${groupId}: marks are not balanced (${aMarks} vs ${bMarks}).`,
            });
        }
        if (!balance.moduleCompatible) {
            issues.push({
                code: 'OR_MODULE',
                severity: 'CRITICAL',
                message: `OR pair ${groupId}: both alternatives must come from the same module (${a[0]?.moduleOrUnit ?? 'unmapped'} vs ${b[0]?.moduleOrUnit ?? 'unmapped'}).`,
            });
        }
        if (!balance.coCompatible || !balance.rbtCompatible || !balance.difficultyCompatible) {
            issues.push({
                code: 'OR_BALANCE',
                severity: 'WARNING',
                message: `OR pair ${groupId} is mismatched (${[
                    !balance.coCompatible ? 'CO' : null,
                    !balance.rbtCompatible ? 'RBT' : null,
                    !balance.difficultyCompatible ? 'difficulty' : null,
                ]
                    .filter(Boolean)
                    .join(', ')}).`,
            });
        }
    }
    const rbtCounts = new Map();
    for (const item of requiredItems(input.items)) {
        const rbt = rbtFromBloom(item.rbtLevel || item.bloomLevel) || 'UNSET';
        rbtCounts.set(rbt, (rbtCounts.get(rbt) || 0) + item.maxMarks);
    }
    const concentrated = [...rbtCounts.entries()].find(([, marks]) => marks / Math.max(answerable, 1) >= 0.85);
    if (concentrated && requiredItems(input.items).length >= 3 && concentrated[0] !== 'UNSET') {
        issues.push({
            code: 'RBT_CONCENTRATION',
            severity: 'WARNING',
            message: `Paper is concentrated at ${concentrated[0]} (${concentrated[1]} marks). Consider replacements at other RBT levels.`,
        });
    }
    const critical = issues.filter((i) => i.severity === 'CRITICAL');
    return {
        ok: issues.length === 0,
        canFinalize: critical.length === 0 && input.items.length > 0,
        issues,
        requiredAnswerMarks: answerable,
        printedMarks: printed,
        patternOk: !issues.some((i) => i.code === 'PATTERN'),
    };
}
