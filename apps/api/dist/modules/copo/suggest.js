import { BLOOMS_LABELS } from './types.js';
const STOP = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'onto', 'using', 'able',
    'students', 'student', 'course', 'outcome', 'programme', 'program', 'engineering',
    'will', 'can', 'are', 'was', 'were', 'have', 'has', 'apply', 'an', 'of', 'to', 'in',
    'on', 'a', 'or', 'by', 'as', 'be', 'is', 'at', 'it',
]);
function tokens(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w));
}
function overlapScore(a, b) {
    const left = new Set(tokens(a));
    const right = tokens(b);
    if (!left.size || !right.length)
        return 0;
    let hits = 0;
    for (const w of right)
        if (left.has(w))
            hits += 1;
    return hits / Math.max(right.length, 1);
}
function bloomsBias(level, poCode) {
    const n = Number(String(poCode).replace(/\D/g, '')) || 0;
    const key = String(level || '').toUpperCase();
    if (key === 'L1' || key === 'L2')
        return n === 1 ? 0.25 : n <= 2 ? 0.1 : 0;
    if (key === 'L3')
        return n === 3 || n === 5 ? 0.2 : n === 1 ? 0.1 : 0;
    if (key === 'L4')
        return n === 2 || n === 4 ? 0.25 : n === 1 ? 0.1 : 0;
    if (key === 'L5' || key === 'L6')
        return n === 3 || n === 12 ? 0.2 : 0.05;
    return 0;
}
function toStrength(score) {
    if (score >= 0.28)
        return { suggested: 3, confidence: 'High' };
    if (score >= 0.16)
        return { suggested: 2, confidence: score >= 0.22 ? 'High' : 'Medium' };
    if (score >= 0.08)
        return { suggested: 1, confidence: 'Low' };
    return null;
}
export function suggestMappings(cos, pos) {
    const out = [];
    for (const co of cos) {
        for (const po of pos) {
            const poText = `${po.shortTitle || ''} ${po.statement || ''}`;
            const score = overlapScore(co.statement, poText) + bloomsBias(co.bloomsLevel, po.code);
            const mapped = toStrength(score);
            if (!mapped)
                continue;
            out.push({
                courseOutcomeId: co.id,
                programOutcomeId: po.id,
                coCode: co.code,
                poCode: po.code,
                suggested: mapped.suggested,
                confidence: mapped.confidence,
                rationale: 'Suggested from CO wording, Bloom’s level, and PO definition overlap. Not approved.',
            });
        }
    }
    return out.sort((a, b) => b.suggested - a.suggested || a.coCode.localeCompare(b.coCode));
}
export function suggestJustification(input) {
    const strengthLabel = input.strength === 3 ? 'High' : input.strength === 2 ? 'Moderate' : 'Low';
    const bloomKey = String(input.bloomsLevel || '').toUpperCase();
    const bloom = BLOOMS_LABELS[bloomKey] ? `${bloomKey} (${BLOOMS_LABELS[bloomKey]})` : null;
    const poName = input.poTitle?.trim() || input.poCode;
    const subject = input.subjectName ? ` in ${input.subjectName}` : '';
    const bloomClause = bloom
        ? ` The outcome is specified at Bloom’s ${bloom}, which aligns with the cognitive demand of this contribution.`
        : '';
    const degree = input.strength === 3
        ? 'directly and substantially'
        : input.strength === 2
            ? 'meaningfully'
            : 'in a supporting way';
    return (`${input.coCode} requires learners${subject} to demonstrate the competencies described by this outcome, which ${degree} contributes to ${input.poCode} (${poName}).` +
        bloomClause +
        ` Mapping strength is therefore ${input.strength} — ${strengthLabel}. Review and edit this draft so it explains the specific learning tasks, not a restatement of the official CO or PO text.`);
}
