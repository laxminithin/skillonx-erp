import { createHash } from 'node:crypto';
import { db } from '../../db/index.js';
import { normalizeQuestionText, normalizeSubjectName } from '../../types/quiz.js';
import { AppError } from '../../utils/errors.js';
import { scanQuestionFiles } from './importService.js';
import { resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../questions/coMapping.js';
import { syncQuizQuestionCoLinks } from '../questions/coValidation.js';
function courseCodeFromSubject(name, existing) {
    const words = name.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    let code = words
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 8);
    if (code.length < 2)
        code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'SUBJ';
    let candidate = code;
    let n = 2;
    while (existing.has(candidate)) {
        candidate = `${code.slice(0, 6)}${n}`;
        n += 1;
    }
    existing.add(candidate);
    return candidate;
}
function moduleNumberKey(name) {
    const match = name.match(/\b(module|unit)\s*0*(\d+)/i);
    if (!match)
        return null;
    return `${match[1].toLowerCase()}:${Number(match[2])}`;
}
function difficultyBucket(d, reviewStatus) {
    if (reviewStatus === 'NEEDS_REVIEW')
        return 'needsReview';
    if (d === 'EASY')
        return 'easy';
    if (d === 'INTERMEDIATE')
        return 'intermediate';
    if (d === 'DIFFICULT')
        return 'difficult';
    return 'needsReview';
}
export async function applyQuestionBankImport(opts) {
    const scan = await scanQuestionFiles();
    const batchId = `import-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
    const createMissing = opts.createMissingSubjects !== false;
    const courses = await db('courses').where({ college_id: opts.collegeId }).select('id', 'name', 'code');
    const byName = new Map(courses.map((c) => [normalizeSubjectName(c.name), c]));
    const usedCodes = new Set(courses.map((c) => String(c.code).toUpperCase()));
    const unmatchedSubjects = [];
    const createdSubjects = [];
    const courseBySubject = new Map();
    const uniqueSubjects = [...new Set(scan.candidates.map((c) => c.subjectHint).filter(Boolean))];
    for (const subject of uniqueSubjects) {
        const existing = byName.get(normalizeSubjectName(subject));
        if (existing) {
            courseBySubject.set(subject, { id: existing.id, name: existing.name, mapping: 'matched' });
            continue;
        }
        if (!createMissing || opts.dryRun) {
            unmatchedSubjects.push(subject);
            courseBySubject.set(subject, { id: 0, name: subject, mapping: 'unmatched' });
            continue;
        }
        const code = courseCodeFromSubject(subject, usedCodes);
        const [id] = await db('courses').insert({
            college_id: opts.collegeId,
            name: subject,
            code,
        });
        createdSubjects.push(subject);
        courseBySubject.set(subject, { id, name: subject, mapping: 'created' });
        byName.set(normalizeSubjectName(subject), { id, name: subject, code });
    }
    const modulesByCourse = new Map();
    async function resolveModule(courseId, moduleHint) {
        let list = modulesByCourse.get(courseId);
        if (!list) {
            const rows = await db('subject_modules')
                .where({ college_id: opts.collegeId, course_id: courseId })
                .select('id', 'name');
            list = rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
            modulesByCourse.set(courseId, list);
        }
        const exact = list.find((m) => m.name.toLowerCase() === moduleHint.toLowerCase());
        if (exact)
            return exact.id;
        const key = moduleNumberKey(moduleHint);
        if (key) {
            const byNumber = list.find((m) => moduleNumberKey(m.name) === key);
            if (byNumber) {
                if (byNumber.name !== moduleHint && !opts.dryRun) {
                    await db('subject_modules').where({ id: byNumber.id }).update({ name: moduleHint });
                    byNumber.name = moduleHint;
                }
                return byNumber.id;
            }
        }
        if (opts.dryRun)
            return -1;
        const sort = Number(key?.split(':')[1] ?? list.length + 1);
        try {
            const [id] = await db('subject_modules').insert({
                college_id: opts.collegeId,
                course_id: courseId,
                name: moduleHint,
                code: key ? key.replace(':', '').toUpperCase().slice(0, 8) : null,
                sort_order: sort,
                created_by: opts.createdBy,
            });
            list.push({ id, name: moduleHint });
            return id;
        }
        catch {
            const again = await db('subject_modules')
                .where({ college_id: opts.collegeId, course_id: courseId, name: moduleHint })
                .first();
            if (!again)
                throw new AppError(409, `Could not create module ${moduleHint}`);
            list.push({ id: again.id, name: again.name });
            return again.id;
        }
    }
    const summaries = new Map();
    let imported = 0;
    let skippedDup = 0;
    const grouped = new Map();
    for (const candidate of scan.candidates) {
        const subject = candidate.subjectHint || 'Unknown subject';
        const list = grouped.get(subject) ?? [];
        list.push(candidate);
        grouped.set(subject, list);
    }
    for (const [subject, items] of grouped) {
        const mapping = courseBySubject.get(subject) ?? {
            id: 0,
            name: subject,
            mapping: 'unmatched',
        };
        const moduleNames = [...new Set(items.map((i) => i.moduleHint || 'Unassigned'))];
        const moduleRows = moduleNames.map((name) => ({
            name,
            easy: 0,
            intermediate: 0,
            difficult: 0,
            needsReview: 0,
            imported: 0,
        }));
        const moduleIndex = new Map(moduleRows.map((m) => [m.name, m]));
        const existing = mapping.mapping === 'unmatched' || opts.dryRun
            ? []
            : await db('quiz_bank_questions')
                .where({ college_id: opts.collegeId, course_id: mapping.id, is_active: true })
                .select('id', 'module_id', 'normalized_text', 'primary_co_code', 'verification_status');
        const existingByKey = new Map(existing.map((e) => [`${e.module_id}|${e.normalized_text}`, e]));
        await db.transaction(async (trx) => {
            for (const candidate of items) {
                const moduleName = candidate.moduleHint || 'Unassigned';
                const row = moduleIndex.get(moduleName);
                const bucket = difficultyBucket(candidate.difficulty, candidate.reviewStatus);
                row[bucket] += 1;
                if (opts.dryRun || mapping.mapping === 'unmatched' || !candidate.moduleHint)
                    continue;
                const moduleId = await resolveModule(mapping.id, candidate.moduleHint);
                const normalized = normalizeQuestionText(candidate.questionText);
                const dupKey = `${moduleId}|${normalized}`;
                const prior = existingByKey.get(dupKey);
                // Resolve CO from source when present (idempotent re-import preserves existing mapping)
                let coFields = {};
                if (candidate.primaryCoCode) {
                    const co = await trx('course_outcomes')
                        .where({
                        college_id: opts.collegeId,
                        course_id: mapping.id,
                        is_current: true,
                    })
                        .andWhereRaw('UPPER(co_code) = ?', [candidate.primaryCoCode.toUpperCase()])
                        .first();
                    if (co) {
                        const derived = await resolveDerivedOutcomes({
                            collegeId: opts.collegeId,
                            courseId: mapping.id,
                            primaryCoCode: String(co.co_code),
                            primaryCoId: Number(co.id),
                        });
                        coFields = {
                            primary_co_code: String(co.co_code).toUpperCase(),
                            primary_co_id: Number(co.id),
                            course_outcome_id: Number(co.id),
                            mapping_basis: candidate.mappingBasis ?? null,
                            mapping_source: candidate.mappingSource ?? 'QUIZ_MD_IMPORT',
                            verification_status: candidate.verificationStatus ??
                                (candidate.mappingSource ? 'VERIFIED_SOURCE' : 'ACADEMIC_ANALYSIS'),
                            secondary_co_codes: candidate.secondaryCoCodes?.length
                                ? JSON.stringify(candidate.secondaryCoCodes)
                                : null,
                            co_mapping_blocked: false,
                            co_mapping_block_reason: null,
                            derived_outcomes_snapshot: JSON.stringify(snapshotDerivedOutcomes(derived)),
                        };
                    }
                }
                if (prior) {
                    skippedDup += 1;
                    // Preserve existing Primary CO; only fill if previously unmapped and source has CO
                    if (!prior.primary_co_code && coFields.primary_co_code) {
                        await trx('quiz_bank_questions').where({ id: prior.id }).update(coFields);
                        await syncQuizQuestionCoLinks(Number(prior.id), coFields.primary_co_id, coFields.primary_co_code, candidate.secondaryCoCodes ?? []);
                    }
                    continue;
                }
                existingByKey.set(dupKey, {
                    id: -1,
                    module_id: moduleId,
                    normalized_text: normalized,
                    primary_co_code: coFields.primary_co_code ?? null,
                    verification_status: coFields.verification_status ?? null,
                });
                const [id] = await trx('quiz_bank_questions').insert({
                    college_id: opts.collegeId,
                    course_id: mapping.id,
                    module_id: moduleId,
                    created_by: opts.createdBy,
                    question_text: candidate.questionText,
                    question_type: candidate.questionType,
                    marks: candidate.marks,
                    difficulty: candidate.difficulty,
                    explanation: candidate.explanation,
                    source: candidate.relativePath,
                    source_file: candidate.relativePath,
                    source_reference: candidate.sourceReference,
                    original_module: candidate.moduleHint,
                    original_difficulty: candidate.originalDifficulty,
                    import_batch: batchId,
                    duplicate_group: createHash('sha1').update(normalized).digest('hex').slice(0, 16),
                    review_status: candidate.reviewStatus,
                    review_notes: candidate.reviewNotes.length ? candidate.reviewNotes.join('; ') : null,
                    numeric_answer: candidate.numericAnswer,
                    numeric_tolerance: candidate.numericTolerance,
                    normalized_text: normalized,
                    is_active: true,
                    ...coFields,
                });
                if (candidate.options.length) {
                    await trx('quiz_bank_options').insert(candidate.options.map((opt, i) => ({
                        question_id: id,
                        label: opt.label,
                        is_correct: opt.isCorrect,
                        sort_order: i,
                    })));
                }
                if (coFields.primary_co_id) {
                    await syncQuizQuestionCoLinks(id, coFields.primary_co_id, coFields.primary_co_code, candidate.secondaryCoCodes ?? []);
                }
                imported += 1;
                row.imported += 1;
            }
        });
        summaries.set(subject, {
            subject,
            courseId: mapping.id || null,
            mapping: mapping.mapping,
            modules: moduleRows,
        });
    }
    return {
        batchId,
        dryRun: Boolean(opts.dryRun),
        filesDiscovered: scan.filesDiscovered.filter((f) => /quiz\.md$/i.test(f) || f.endsWith('.csv') || f.endsWith('.json')).length
            || scan.filesDiscovered.length,
        subjectsFound: uniqueSubjects.length,
        questionsDiscovered: scan.questionsFound,
        validated: scan.validQuestions,
        imported: opts.dryRun ? 0 : imported,
        needsReview: scan.needsReview,
        duplicates: scan.duplicates + skippedDup,
        missingAnswer: scan.missingAnswerKeys,
        malformed: scan.candidates.filter((c) => c.reviewNotes.some((n) => /malformed|empty|invalid option|duplicate options/i.test(n))).length,
        unmatchedSubjects,
        createdSubjects,
        subjects: [...summaries.values()],
    };
}
