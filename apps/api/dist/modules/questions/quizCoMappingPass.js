/**
 * Controlled Quiz question → Primary CO mapping pass.
 * Prefers shared inferPrimaryCoFromIntent (no Module N = CO N).
 * Subjects without COs → CO_MAPPING_BLOCKED (no fabricated COs).
 */
import { db } from '../../db/index.js';
import { inferPrimaryCoFromIntent, resolveDerivedOutcomes, snapshotDerivedOutcomes, } from './coMapping.js';
import { syncQuizQuestionCoLinks } from './coValidation.js';
const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'be',
    'by', 'as', 'at', 'from', 'that', 'this', 'it', 'its', 'into', 'which', 'what', 'how',
    'when', 'where', 'who', 'whom', 'whose', 'can', 'will', 'would', 'should', 'may',
    'their', 'they', 'them', 'than', 'then', 'also', 'using', 'use', 'used', 'able',
    'describe', 'explain', 'define', 'identify', 'list', 'state', 'write', 'choose',
    'best', 'option', 'following', 'about', 'does', 'stand', 'means', 'meaning',
]);
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9+\-#.\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !STOP.has(t));
}
function jaccard(a, b) {
    if (!a.size || !b.size)
        return 0;
    let inter = 0;
    for (const x of a)
        if (b.has(x))
            inter += 1;
    const union = a.size + b.size - inter;
    return union ? inter / union : 0;
}
const SHALLOW_RECALL = /\b(stand for|full form|abbreviation|acronym|expand|means what|what does .+ stand)\b/i;
/** Test / quality-gate helper: score question cognitive intent vs CO statement. */
export function scoreQuestionAgainstCo(questionText, coStatement, moduleName) {
    const qTokens = new Set(tokenize(questionText));
    const cTokens = new Set(tokenize(coStatement));
    const mTokens = moduleName ? new Set(tokenize(moduleName)) : new Set();
    const overlap = jaccard(qTokens, cTokens);
    const moduleBoost = jaccard(qTokens, mTokens) * 0.15 + jaccard(cTokens, mTokens) * 0.1;
    let score = overlap * 0.75 + moduleBoost;
    const basisParts = [];
    const shared = [...qTokens].filter((t) => cTokens.has(t));
    if (shared.length) {
        score += Math.min(0.25, shared.length * 0.04);
        basisParts.push(`shared terms: ${shared.slice(0, 8).join(', ')}`);
    }
    const designHeavy = /\b(design|develop|implement|construct|normalize|architect|optimize|evaluate|analyze|apply)\b/i.test(coStatement);
    if (designHeavy && SHALLOW_RECALL.test(questionText)) {
        score *= 0.25;
        basisParts.push('penalized: shallow recall vs design/apply CO');
    }
    const definitionalCo = /\b(define|understand|explain|describe|recall|fundamentals|basic concepts|introduction)\b/i.test(coStatement);
    if (definitionalCo && /\b(define|describe|best describes|is known as|refers to)\b/i.test(questionText)) {
        score += 0.08;
        basisParts.push('definitional intent alignment');
    }
    return {
        score: Math.round(score * 1000) / 1000,
        basis: basisParts.join('; ') || 'token overlap with CO statement',
    };
}
export function suggestPrimaryCo(questionText, cos, moduleName) {
    if (!cos.length) {
        return {
            primaryCoCode: null,
            primaryCoId: null,
            verificationStatus: 'CO_MAPPING_BLOCKED',
            mappingBasis: 'Subject has no current Course Outcomes',
            score: 0,
        };
    }
    // Prefer quiz-tuned scorer (definitional boost, shallow-recall penalty), then shared inferrer.
    const ranked = cos
        .map((c) => {
        const { score, basis } = scoreQuestionAgainstCo(questionText, String(c.statement || ''), moduleName);
        return { c, score, basis };
    })
        .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const runner = ranked[1];
    if (best && best.score >= 0.12 && (!runner || best.score - runner.score >= 0.02 || best.score >= 0.25)) {
        return {
            primaryCoCode: String(best.c.co_code).toUpperCase(),
            primaryCoId: Number(best.c.id),
            verificationStatus: best.score >= 0.2 ? 'ACADEMIC_ANALYSIS' : 'NEEDS_REVIEW',
            mappingBasis: best.basis,
            score: best.score,
        };
    }
    const inference = inferPrimaryCoFromIntent({
        questionText,
        moduleHint: moduleName,
        outcomes: cos.map((c) => ({
            id: Number(c.id),
            coCode: String(c.co_code).toUpperCase(),
            statement: String(c.statement || ''),
        })),
    });
    return {
        primaryCoCode: inference.primaryCoCode,
        primaryCoId: inference.primaryCoId,
        verificationStatus: inference.verificationStatus,
        mappingBasis: inference.mappingBasis,
        score: inference.score,
    };
}
/**
 * Map entire quiz bank (or one course). Preserves existing VERIFIED_* mappings unless force=true.
 */
export async function runQuizCoMappingPass(opts) {
    let q = db('quiz_bank_questions as q')
        .join('courses as c', 'c.id', 'q.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.college_id': opts.collegeId, 'q.is_active': true })
        .select('q.id', 'q.course_id as courseId', 'c.name as courseName', 'q.question_text as questionText', 'q.explanation as explanation', 'q.primary_co_code as primaryCoCode', 'q.verification_status as verificationStatus', 'm.name as moduleName');
    if (opts.courseId)
        q = q.andWhere('q.course_id', opts.courseId);
    const questions = await q;
    const cosByCourse = new Map();
    async function loadCos(courseId) {
        if (cosByCourse.has(courseId))
            return cosByCourse.get(courseId);
        const rows = await db('course_outcomes')
            .where({ college_id: opts.collegeId, course_id: courseId, is_current: true })
            .select('id', 'co_code', 'statement')
            .orderBy('co_number');
        const mapped = rows.map((r) => ({
            id: Number(r.id),
            coCode: String(r.co_code).toUpperCase(),
            statement: String(r.statement || ''),
        }));
        cosByCourse.set(courseId, mapped);
        return mapped;
    }
    const perSubject = new Map();
    let mapped = 0;
    let needsReview = 0;
    let blocked = 0;
    let skippedAlreadyMapped = 0;
    for (const row of questions) {
        const courseId = Number(row.courseId);
        const entry = perSubject.get(courseId) ??
            {
                courseId,
                courseName: String(row.courseName),
                total: 0,
                mapped: 0,
                needsReview: 0,
                blocked: 0,
                coDistribution: {},
            };
        entry.total += 1;
        const existingStatus = String(row.verificationStatus || '');
        const hasVerified = existingStatus === 'VERIFIED_SOURCE' ||
            existingStatus === 'VERIFIED' ||
            (row.primaryCoCode && existingStatus === 'ACADEMIC_ANALYSIS' && !opts.force);
        if (hasVerified && !opts.force) {
            skippedAlreadyMapped += 1;
            const co = String(row.primaryCoCode).toUpperCase();
            entry.mapped += 1;
            entry.coDistribution[co] = (entry.coDistribution[co] ?? 0) + 1;
            mapped += 1;
            perSubject.set(courseId, entry);
            continue;
        }
        const cos = await loadCos(courseId);
        const inference = inferPrimaryCoFromIntent({
            questionText: String(row.questionText || ''),
            modelAnswer: row.explanation != null ? String(row.explanation) : null,
            moduleHint: row.moduleName != null ? String(row.moduleName) : null,
            outcomes: cos,
        });
        if (inference.coMappingBlocked || !cos.length) {
            blocked += 1;
            entry.blocked += 1;
            if (!opts.dryRun) {
                await db('quiz_bank_questions').where({ id: row.id }).update({
                    primary_co_code: null,
                    primary_co_id: null,
                    course_outcome_id: null,
                    verification_status: 'CO_MAPPING_BLOCKED',
                    co_mapping_blocked: true,
                    co_mapping_block_reason: inference.coMappingBlockReason,
                    mapping_basis: inference.mappingBasis,
                    mapping_source: 'CONTROLLED_MAPPING_PASS',
                    derived_outcomes_snapshot: null,
                });
                await syncQuizQuestionCoLinks(Number(row.id), null, null, []);
            }
            perSubject.set(courseId, entry);
            continue;
        }
        let derivedSnapshot = null;
        if (inference.primaryCoId && inference.primaryCoCode) {
            const derived = await resolveDerivedOutcomes({
                collegeId: opts.collegeId,
                courseId,
                primaryCoCode: inference.primaryCoCode,
                primaryCoId: inference.primaryCoId,
            });
            derivedSnapshot = JSON.stringify(snapshotDerivedOutcomes(derived));
        }
        if (inference.needsReview || !inference.primaryCoCode) {
            needsReview += 1;
            entry.needsReview += 1;
            if (inference.primaryCoCode) {
                entry.coDistribution[inference.primaryCoCode] =
                    (entry.coDistribution[inference.primaryCoCode] ?? 0) + 1;
            }
        }
        else {
            mapped += 1;
            entry.mapped += 1;
            if (inference.primaryCoCode) {
                entry.coDistribution[inference.primaryCoCode] =
                    (entry.coDistribution[inference.primaryCoCode] ?? 0) + 1;
            }
        }
        if (!opts.dryRun) {
            await db('quiz_bank_questions').where({ id: row.id }).update({
                primary_co_code: inference.primaryCoCode,
                primary_co_id: inference.primaryCoId,
                course_outcome_id: inference.primaryCoId,
                verification_status: inference.verificationStatus,
                co_mapping_blocked: false,
                co_mapping_block_reason: null,
                mapping_basis: inference.mappingBasis,
                mapping_source: 'CONTROLLED_MAPPING_PASS',
                derived_outcomes_snapshot: derivedSnapshot,
            });
            await syncQuizQuestionCoLinks(Number(row.id), inference.primaryCoId, inference.primaryCoCode, []);
        }
        perSubject.set(courseId, entry);
    }
    const total = questions.length;
    return {
        total,
        mapped,
        needsReview,
        blocked,
        attainmentReady: blocked === 0 && needsReview === 0 && mapped === total && total > 0 ? 'YES' : 'NO',
        skippedAlreadyMapped,
        perSubject: [...perSubject.values()].sort((a, b) => a.courseName.localeCompare(b.courseName)),
    };
}
