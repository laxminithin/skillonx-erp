import { createHash } from 'node:crypto';
import { normalizeQuestionFingerprint } from './types.js';
export function tokens(text) {
    return new Set(text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 4));
}
export function jaccard(a, b) {
    let inter = 0;
    for (const x of a)
        if (b.has(x))
            inter += 1;
    const union = a.size + b.size - inter;
    return union ? inter / union : 0;
}
/** Near-duplicate wording check used to avoid weak OR alternatives (same stem, different years). */
export function questionsNearDuplicate(a, b, threshold = 0.82) {
    if (!a?.trim() || !b?.trim())
        return false;
    if (fingerprintQuestion(a) === fingerprintQuestion(b))
        return true;
    return jaccard(tokens(a), tokens(b)) >= threshold;
}
export function fingerprintQuestion(text) {
    const norm = normalizeQuestionFingerprint(text);
    return createHash('sha1').update(norm).digest('hex').slice(0, 16);
}
export function analyzeRepeats(papers, questionIds) {
    const byExact = new Map();
    for (const q of questionIds) {
        const fp = fingerprintQuestion(q.text);
        const existing = byExact.get(fp);
        if (!existing) {
            byExact.set(fp, {
                fingerprint: fp,
                canonicalText: q.text.slice(0, 400),
                count: 1,
                years: q.year ? [q.year] : [],
                papers: [q.paperId],
                questionIds: [q.questionId],
                similarity: 'EXACT',
            });
        }
        else {
            existing.count += 1;
            existing.questionIds.push(q.questionId);
            if (q.year && !existing.years.includes(q.year))
                existing.years.push(q.year);
            if (!existing.papers.includes(q.paperId))
                existing.papers.push(q.paperId);
        }
    }
    const exact = [...byExact.values()].filter((c) => c.count > 1);
    const near = [];
    const items = questionIds.map((q) => ({ ...q, tok: tokens(q.text) }));
    for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
            if (fingerprintQuestion(items[i].text) === fingerprintQuestion(items[j].text))
                continue;
            const sim = jaccard(items[i].tok, items[j].tok);
            if (sim >= 0.82) {
                near.push({
                    fingerprint: `${items[i].questionId}~${items[j].questionId}`,
                    canonicalText: items[i].text.slice(0, 400),
                    count: 2,
                    years: [items[i].year, items[j].year].filter((y) => y != null),
                    papers: [items[i].paperId, items[j].paperId],
                    questionIds: [items[i].questionId, items[j].questionId],
                    similarity: 'NEAR',
                });
            }
        }
    }
    const moduleFreq = new Map();
    const coFreq = new Map();
    const marksFreq = new Map();
    for (const paper of papers) {
        for (const q of paper.questions) {
            const mod = q.moduleOrUnit || 'UNMAPPED';
            moduleFreq.set(mod, (moduleFreq.get(mod) || 0) + 1);
            const marks = q.maxMarks == null ? 'MISSING' : String(q.maxMarks);
            marksFreq.set(marks, (marksFreq.get(marks) || 0) + 1);
        }
    }
    return {
        exactRepeats: exact.sort((a, b) => b.count - a.count),
        nearRepeats: near.slice(0, 200),
        moduleFrequency: [...moduleFreq.entries()].map(([module, count]) => ({ module, count })),
        coFrequency: [...coFreq.entries()].map(([co, count]) => ({ co, count })),
        marksFrequency: [...marksFreq.entries()].map(([marks, count]) => ({ marks, count })),
    };
}
export function appearancesFor(text, questionIds) {
    const fp = fingerprintQuestion(text);
    const hits = questionIds.filter((q) => fingerprintQuestion(q.text) === fp);
    const years = [...new Set(hits.map((h) => h.year).filter((y) => y != null))].sort();
    return {
        count: hits.length,
        years,
        lastAppeared: hits
            .map((h) => h.examDate || String(h.year || ''))
            .filter(Boolean)
            .sort()
            .at(-1) ?? null,
        paperIds: hits.map((h) => h.paperId),
    };
}
