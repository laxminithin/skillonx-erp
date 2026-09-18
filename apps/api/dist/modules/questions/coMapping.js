import { db } from '../../db/index.js';
function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    return value;
}
/**
 * Resolve PO/PSO/SDG from existing CO→outcome academic mapping.
 * Never invents independent per-question mappings.
 */
export async function resolveDerivedOutcomes(opts) {
    const empty = {
        pos: [],
        psos: [],
        sdgs: [],
        provenance: 'DERIVED_FROM_CO_MAPPING',
        mappingVersionId: null,
        blocked: false,
        blockReason: null,
    };
    const cos = await db('course_outcomes')
        .where({ college_id: opts.collegeId, course_id: opts.courseId, is_current: true })
        .select('id', 'co_code', 'statement');
    if (!cos.length) {
        return {
            ...empty,
            blocked: true,
            blockReason: 'Subject lacks current course outcomes (CO_MAPPING_BLOCKED)',
        };
    }
    const coCode = (opts.primaryCoCode || '').trim().toUpperCase();
    if (!coCode && !opts.primaryCoId) {
        return { ...empty, blocked: false, blockReason: 'No primary CO on question' };
    }
    const co = (opts.primaryCoId ? cos.find((c) => Number(c.id) === Number(opts.primaryCoId)) : null) ??
        cos.find((c) => String(c.co_code).toUpperCase() === coCode);
    if (!co) {
        return {
            ...empty,
            blocked: false,
            blockReason: `CO ${coCode || opts.primaryCoId} not found for subject`,
        };
    }
    // Prefer finalized operational mapping; fall back to master (source_mapping_version_id IS NULL)
    let version = await db('copo_mapping_versions as v')
        .where({ 'v.college_id': opts.collegeId, 'v.course_id': opts.courseId })
        .whereNotNull('v.source_mapping_version_id')
        .whereIn('v.status', ['APPROVED', 'SUBMITTED'])
        .orderBy('v.updated_at', 'desc')
        .first();
    if (!version) {
        version = await db('copo_mapping_versions as v')
            .where({ 'v.college_id': opts.collegeId, 'v.course_id': opts.courseId })
            .whereNull('v.source_mapping_version_id')
            .orderBy('v.updated_at', 'desc')
            .first();
    }
    if (!version) {
        return {
            ...empty,
            blocked: false,
            blockReason: 'No academic mapping version for subject',
        };
    }
    const items = await db('copo_mapping_items as i')
        .where({ 'i.mapping_version_id': version.id, 'i.course_outcome_id': co.id })
        .leftJoin('program_outcomes as po', 'po.id', 'i.program_outcome_id')
        .leftJoin('program_specific_outcomes as pso', 'pso.id', 'i.program_specific_outcome_id')
        .leftJoin('sustainable_development_goals as sdg', 'sdg.id', 'i.sdg_id')
        .select('i.correlation_strength', 'i.master_strength', 'po.po_code', 'po.official_statement as po_statement', 'po.short_title as po_short_title', 'pso.pso_code', 'pso.official_statement as pso_statement', 'pso.short_title as pso_short_title', 'sdg.sdg_code as sdg_code', 'sdg.official_title as sdg_title');
    const pos = [];
    const psos = [];
    const sdgs = [];
    const seen = { po: new Set(), pso: new Set(), sdg: new Set() };
    for (const item of items) {
        const strength = item.correlation_strength ?? item.master_strength ?? null;
        if (item.po_code && !seen.po.has(String(item.po_code))) {
            seen.po.add(String(item.po_code));
            pos.push({
                code: String(item.po_code),
                statement: item.po_statement ?? item.po_short_title,
                strength,
            });
        }
        if (item.pso_code && !seen.pso.has(String(item.pso_code))) {
            seen.pso.add(String(item.pso_code));
            psos.push({
                code: String(item.pso_code),
                statement: item.pso_statement ?? item.pso_short_title,
                strength,
            });
        }
        if (item.sdg_code && !seen.sdg.has(String(item.sdg_code))) {
            seen.sdg.add(String(item.sdg_code));
            sdgs.push({ code: String(item.sdg_code), statement: item.sdg_title, strength });
        }
    }
    return {
        pos,
        psos,
        sdgs,
        provenance: 'DERIVED_FROM_CO_MAPPING',
        mappingVersionId: Number(version.id),
        blocked: false,
        blockReason: null,
    };
}
export function snapshotDerivedOutcomes(derived) {
    return {
        provenance: derived.provenance,
        mappingVersionId: derived.mappingVersionId,
        pos: derived.pos.map((p) => p.code),
        psos: derived.psos.map((p) => p.code),
        sdgs: derived.sdgs.map((p) => p.code),
    };
}
export function parseSecondaryCos(value) {
    const arr = parseJson(value, []);
    if (!Array.isArray(arr))
        return [];
    return arr.map((v) => String(v).toUpperCase()).filter(Boolean);
}
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'from',
    'is', 'are', 'be', 'as', 'at', 'it', 'its', 'this', 'that', 'these', 'those', 'into',
    'using', 'use', 'used', 'via', 'over', 'under', 'between', 'about', 'than', 'then',
    'their', 'them', 'they', 'will', 'can', 'may', 'must', 'should', 'have', 'has', 'had',
    'given', 'various', 'related', 'basic', 'concepts', 'concept', 'explain', 'describe',
    'apply', 'design', 'analyse', 'analyze', 'develop', 'understand', 'write', 'prove',
]);
export function tokenizeAcademicText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9+\-./\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
        .flatMap((t) => {
        // light plural folding so "machine" matches "machines"
        if (t.length >= 5 && t.endsWith('s') && !t.endsWith('ss'))
            return [t, t.slice(0, -1)];
        if (t.length >= 5 && t.endsWith('es'))
            return [t, t.slice(0, -2)];
        return [t];
    });
}
/**
 * Map a question to a Primary CO by intent keyword overlap with CO statements.
 * Never uses Module N → CO N positional mapping.
 */
export function inferPrimaryCoFromIntent(opts) {
    if (!opts.outcomes.length) {
        return {
            primaryCoCode: null,
            primaryCoId: null,
            score: 0,
            runnerUpScore: 0,
            mappingBasis: null,
            verificationStatus: 'CO_MAPPING_BLOCKED',
            coMappingBlocked: true,
            coMappingBlockReason: 'Subject lacks current course outcomes (CO_MAPPING_BLOCKED)',
            needsReview: false,
        };
    }
    // Intent comes from the question itself — module title is only a weak tie-breaker
    // (never Module N ⇒ CO N).
    const questionTokens = new Set([
        ...tokenizeAcademicText(opts.questionText || ''),
        ...tokenizeAcademicText(opts.modelAnswer || ''),
    ]);
    const moduleTokens = new Set(tokenizeAcademicText((opts.moduleHint || '').replace(/\b(module|unit)\s*\d+\b/gi, '')));
    const scored = opts.outcomes.map((co) => {
        const coTokens = tokenizeAcademicText(`${co.coCode} ${co.statement}`);
        let hits = 0;
        let moduleHits = 0;
        const matched = [];
        for (const token of coTokens) {
            if (questionTokens.has(token)) {
                hits += token.length >= 6 ? 1.35 : 1;
                matched.push(token);
            }
            else if (moduleTokens.has(token)) {
                moduleHits += 0.15;
            }
        }
        const score = hits + Math.min(0.4, moduleHits);
        return { co, score, matched: [...new Set(matched)].slice(0, 8) };
    });
    scored.sort((a, b) => b.score - a.score || a.co.coCode.localeCompare(b.co.coCode));
    const best = scored[0];
    const runner = scored[1];
    const minScore = 1.0;
    const clearLead = best && (!runner || best.score - runner.score >= 0.35 || best.score >= 2.5);
    if (!best || best.score < minScore) {
        // Still attach the best available CO for faculty review when any positive overlap exists
        if (best && best.score > 0) {
            return {
                primaryCoCode: best.co.coCode.toUpperCase(),
                primaryCoId: best.co.id,
                score: best.score,
                runnerUpScore: runner?.score ?? 0,
                mappingBasis: `Weak keyword overlap with ${best.co.coCode} (${best.matched.join(', ') || 'minimal'}); needs faculty review`,
                verificationStatus: 'NEEDS_REVIEW',
                coMappingBlocked: false,
                coMappingBlockReason: null,
                needsReview: true,
            };
        }
        return {
            primaryCoCode: null,
            primaryCoId: null,
            score: best?.score ?? 0,
            runnerUpScore: runner?.score ?? 0,
            mappingBasis: 'Insufficient keyword overlap with CO statements; needs faculty review',
            verificationStatus: 'NEEDS_REVIEW',
            coMappingBlocked: false,
            coMappingBlockReason: null,
            needsReview: true,
        };
    }
    if (!clearLead) {
        return {
            primaryCoCode: best.co.coCode.toUpperCase(),
            primaryCoId: best.co.id,
            score: best.score,
            runnerUpScore: runner?.score ?? 0,
            mappingBasis: `Ambiguous CO match (${best.co.coCode} vs ${runner?.co.coCode}); keywords: ${best.matched.join(', ')}`,
            verificationStatus: 'NEEDS_REVIEW',
            coMappingBlocked: false,
            coMappingBlockReason: null,
            needsReview: true,
        };
    }
    return {
        primaryCoCode: best.co.coCode.toUpperCase(),
        primaryCoId: best.co.id,
        score: best.score,
        runnerUpScore: runner?.score ?? 0,
        mappingBasis: `Intent keywords matched CO statement (${best.matched.join(', ') || 'overlap'})`,
        verificationStatus: 'ACADEMIC_ANALYSIS',
        coMappingBlocked: false,
        coMappingBlockReason: null,
        needsReview: false,
    };
}
