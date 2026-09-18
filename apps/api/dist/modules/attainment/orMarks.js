/**
 * Ordered spreadsheet columns for a mark sheet. For OR slots this emits an
 * "Attempted" column (A/B) followed by both alternatives' mark columns, e.g.
 * `Q1 Attempted | Q1A Marks | Q1B Marks`. Shared by the template writer and the
 * import parser so they never drift apart.
 */
export function buildMarkColumns(questions) {
    const columns = [];
    const seenGroups = new Set();
    const orderedGroups = [];
    const groupIndex = new Map();
    for (const q of questions) {
        if (!q.orGroupId)
            continue;
        if (!groupIndex.has(q.orGroupId))
            groupIndex.set(q.orGroupId, []);
        groupIndex.get(q.orGroupId).push(q);
    }
    for (const q of questions) {
        if (q.orGroupId) {
            if (seenGroups.has(q.orGroupId))
                continue;
            seenGroups.add(q.orGroupId);
            orderedGroups.push({ groupId: q.orGroupId, members: groupIndex.get(q.orGroupId) });
            const slot = slotLabel(groupIndex.get(q.orGroupId));
            columns.push({ kind: 'ATTEMPT', orGroupId: q.orGroupId, header: `${slot} Attempted` });
            for (const member of groupIndex.get(q.orGroupId)) {
                const alt = String(member.orAlternative || 'A').toUpperCase();
                columns.push({
                    kind: 'QUESTION',
                    questionKey: member.questionKey,
                    orGroupId: q.orGroupId,
                    orAlternative: alt,
                    maxMarks: member.maxMarks,
                    header: `${slot}${alt} Marks (max ${member.maxMarks})`,
                });
            }
        }
        else {
            columns.push({
                kind: 'QUESTION',
                questionKey: q.questionKey,
                orGroupId: null,
                orAlternative: null,
                maxMarks: q.maxMarks,
                header: `${q.label || q.questionKey} Marks (max ${q.maxMarks})`,
            });
        }
    }
    return columns;
}
function slotLabel(group) {
    const n = group.find((q) => q.questionNumber != null)?.questionNumber;
    return n != null ? `Q${n}` : group[0]?.orGroupId || 'this slot';
}
/**
 * Resolve one student's question marks against the OR structure of a mark sheet.
 *
 * Rules (see the mandatory-OR academic standard):
 * - Every OR slot must have exactly one attempted alternative selected.
 * - The unchosen alternative is recorded NOT_ATTEMPTED_DUE_TO_OR with NO marks —
 *   never zero — so it cannot depress CO attainment.
 * - Marks may not be entered against the unchosen alternative.
 * - The attempted alternative (and any of its sub-questions) must carry marks
 *   within [0, maxMarks].
 *
 * When the whole row is ABSENT / EXEMPT / NOT_EVALUATED the OR attempt is not
 * required and every question inherits that status with no marks.
 */
export function resolveOrMarkEntry(input) {
    const issues = [];
    const perQuestion = [];
    const rowStatus = (input.rowStatus || 'PRESENT');
    const rowExcluded = rowStatus === 'ABSENT' || rowStatus === 'EXEMPT' || rowStatus === 'NOT_EVALUATED';
    const groups = new Map();
    const standalone = [];
    for (const q of input.questions) {
        if (q.orGroupId) {
            const list = groups.get(q.orGroupId) ?? [];
            list.push(q);
            groups.set(q.orGroupId, list);
        }
        else {
            standalone.push(q);
        }
    }
    const clampMark = (q) => {
        const raw = input.marks[q.questionKey];
        if (raw == null)
            return null;
        const n = Number(raw);
        if (!Number.isFinite(n))
            return null;
        if (n < 0) {
            issues.push({ code: 'NEGATIVE_MARK', questionKey: q.questionKey, message: `${q.label || q.questionKey}: marks cannot be negative` });
        }
        if (n > q.maxMarks + 0.001) {
            issues.push({ code: 'MARKS_EXCEED_MAX', questionKey: q.questionKey, message: `${q.label || q.questionKey}: ${n} exceeds maximum ${q.maxMarks}` });
        }
        return n;
    };
    for (const q of standalone) {
        if (rowExcluded) {
            perQuestion.push({ questionKey: q.questionKey, awarded: null, status: rowStatus });
            continue;
        }
        perQuestion.push({ questionKey: q.questionKey, awarded: clampMark(q), status: 'ATTEMPTED' });
    }
    for (const [groupId, group] of groups) {
        if (rowExcluded) {
            for (const q of group)
                perQuestion.push({ questionKey: q.questionKey, awarded: null, status: rowStatus });
            continue;
        }
        const selectedRaw = input.attempts?.[groupId];
        const selected = selectedRaw ? String(selectedRaw).toUpperCase() : null;
        const alternatives = new Set(group.map((q) => String(q.orAlternative || 'A').toUpperCase()));
        if (!selected) {
            // No explicit attempt — infer from where marks were entered, else flag.
            const marked = [...alternatives].filter((alt) => group.some((q) => String(q.orAlternative || 'A').toUpperCase() === alt && input.marks[q.questionKey] != null));
            if (marked.length > 1) {
                issues.push({
                    code: 'OR_BOTH_MARKED',
                    orGroupId: groupId,
                    message: `${slotLabel(group)} has marks entered for both OR alternatives. Select only one attempted alternative.`,
                });
                for (const q of group)
                    perQuestion.push({ questionKey: q.questionKey, awarded: clampMark(q), status: 'ATTEMPTED' });
                continue;
            }
            if (marked.length === 0) {
                issues.push({
                    code: 'OR_NO_ATTEMPT',
                    orGroupId: groupId,
                    message: `${slotLabel(group)}: select the attempted OR alternative (A or B).`,
                });
                for (const q of group)
                    perQuestion.push({ questionKey: q.questionKey, awarded: null, status: 'NOT_ATTEMPTED_DUE_TO_OR' });
                continue;
            }
            return resolveOrMarkEntry({ ...input, attempts: { ...input.attempts, [groupId]: marked[0] } });
        }
        if (!alternatives.has(selected)) {
            issues.push({
                code: 'OR_INVALID_ALTERNATIVE',
                orGroupId: groupId,
                message: `${slotLabel(group)}: attempted alternative "${selectedRaw}" is not one of ${[...alternatives].join('/')}.`,
            });
        }
        let anyAttemptedMark = false;
        for (const q of group) {
            const alt = String(q.orAlternative || 'A').toUpperCase();
            if (alt === selected) {
                const awarded = clampMark(q);
                if (awarded != null)
                    anyAttemptedMark = true;
                perQuestion.push({ questionKey: q.questionKey, awarded, status: 'ATTEMPTED' });
            }
            else {
                if (input.marks[q.questionKey] != null) {
                    issues.push({
                        code: 'OR_UNSELECTED_HAS_MARKS',
                        questionKey: q.questionKey,
                        orGroupId: groupId,
                        message: `${slotLabel(group)}: alternative ${alt} was not attempted but has marks. Clear it or change the attempted alternative.`,
                    });
                }
                perQuestion.push({ questionKey: q.questionKey, awarded: null, status: 'NOT_ATTEMPTED_DUE_TO_OR' });
            }
        }
        if (!anyAttemptedMark) {
            issues.push({
                code: 'OR_MISSING_MARKS',
                orGroupId: groupId,
                message: `${slotLabel(group)}: enter marks for attempted alternative ${selected}.`,
            });
        }
    }
    const total = perQuestion.reduce((sum, p) => sum + (p.status === 'ATTEMPTED' && p.awarded != null ? p.awarded : 0), 0);
    return {
        ok: issues.length === 0,
        perQuestion,
        total: rowExcluded ? null : total,
        issues,
    };
}
