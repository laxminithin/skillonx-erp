import { nanoid } from 'nanoid';
import { db } from '../../db/index.js';
import { catalog as copoCatalog } from '../copo/masters.js';
import { resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../questions/coMapping.js';
import { extractAllPapers, buildMasterPayload, writeMasterWorkbook } from './extractPipeline.js';
import { persistQuestionSolution, refreshQuestionReadiness } from './solutionPipeline.js';
import { MASTER_QUESTION_SOURCE_TYPE } from './sourcePolicy.js';
import { rbtFromBloom } from './rbt.js';
import { defaultMasterPath, defaultQpRoot } from './discover.js';
import { normalizeCourseCode } from './types.js';
import { normalizeSubjectName } from '../../types/quiz.js';
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
export async function makeEnricher(collegeId) {
    const courses = await db('courses').where({ college_id: collegeId }).select('id', 'code', 'name');
    const modules = await db('subject_modules').where({ college_id: collegeId }).select('id', 'course_id', 'name', 'code', 'description');
    const outcomes = await db('course_outcomes')
        .where({ college_id: collegeId, is_current: true })
        .select('id', 'course_id', 'co_code', 'statement');
    const byCode = new Map(courses.map((c) => [normalizeCourseCode(String(c.code)), c]));
    const byName = new Map(courses.map((c) => [normalizeSubjectName(String(c.name)), c]));
    return (courseCode, subjectName) => {
        const code = courseCode ? normalizeCourseCode(courseCode) : '';
        const course = (code ? byCode.get(code) : null) ||
            (subjectName ? byName.get(normalizeSubjectName(subjectName)) : null) ||
            null;
        if (!course) {
            return {
                courseId: null,
                courseCode: code,
                subjectName: subjectName || '',
                modules: [],
                outcomes: [],
                coBlocked: false,
            };
        }
        const courseOutcomes = outcomes
            .filter((o) => Number(o.course_id) === Number(course.id))
            .map((o) => ({ id: Number(o.id), coCode: String(o.co_code).toUpperCase(), statement: String(o.statement || '') }));
        return {
            courseId: Number(course.id),
            courseCode: String(course.code),
            subjectName: String(course.name),
            modules: modules
                .filter((m) => Number(m.course_id) === Number(course.id))
                .map((m) => ({
                id: Number(m.id),
                name: String(m.name),
                code: m.code ? String(m.code) : null,
                description: m.description ? String(m.description) : null,
            })),
            outcomes: courseOutcomes,
            coBlocked: courseOutcomes.length === 0,
        };
    };
}
export async function applyPreviousYearImport(opts) {
    const batchId = `QP-${new Date().toISOString().slice(0, 10)}-${nanoid(8)}`;
    const extracted = await extractAllPapers(opts.root || defaultQpRoot());
    const enricher = await makeEnricher(opts.collegeId);
    const payload = buildMasterPayload(extracted, enricher);
    const masterPath = defaultMasterPath();
    if (opts.writeWorkbook !== false && !opts.dryRun) {
        await writeMasterWorkbook(payload, masterPath);
    }
    const unmatched = [
        ...new Set(payload.papers
            .filter((p) => p.metadata.courseCode && !enricher(p.metadata.courseCode, p.metadata.subjectName)?.courseId)
            .map((p) => `${p.metadata.courseCode} ${p.metadata.subjectName || ''}`.trim())),
    ];
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    if (!opts.dryRun) {
        await db.transaction(async (trx) => {
            await trx('qp_import_batches').insert({
                college_id: opts.collegeId,
                batch_id: batchId,
                source_file: masterPath,
                dry_run: false,
                imported_by: opts.importedBy ?? null,
                report: JSON.stringify({
                    files: extracted.sources.length,
                    papers: payload.papers.length,
                    questions: payload.questions.length,
                }),
            });
            const sourceIdByPath = new Map();
            for (const src of payload.sources) {
                const existing = await trx('previous_year_source_files')
                    .where({ college_id: opts.collegeId, relative_path: src.relativePath })
                    .first();
                const row = {
                    folder: src.folder,
                    file_name: src.fileName,
                    program_hint: src.programHint,
                    source_type: src.sourceType,
                    byte_size: src.byteSize,
                    page_count: src.pageCount,
                    extraction_status: src.extractionStatus,
                    paper_count: src.paperCount,
                    ocr_required: src.ocrRequired,
                    notes: src.notes,
                    import_batch: batchId,
                    updated_at: trx.fn.now(),
                };
                if (existing) {
                    await trx('previous_year_source_files').where({ id: existing.id }).update(row);
                    sourceIdByPath.set(src.relativePath, Number(existing.id));
                }
                else {
                    const [id] = await trx('previous_year_source_files').insert({
                        college_id: opts.collegeId,
                        relative_path: src.relativePath,
                        ...row,
                    });
                    sourceIdByPath.set(src.relativePath, Number(id));
                }
            }
            const paperRowByKey = new Map();
            for (const paper of payload.papers) {
                const m = paper.metadata;
                const ctx = enricher(m.courseCode, m.subjectName);
                const existing = await trx('previous_year_papers')
                    .where({ college_id: opts.collegeId, paper_id: m.paperId })
                    .first();
                const row = {
                    course_id: ctx?.courseId ?? null,
                    subject_name: m.subjectName,
                    course_code: m.courseCode,
                    scheme_label: m.scheme,
                    program_name: m.program,
                    semester_label: m.semester,
                    exam_type: m.examType,
                    academic_year: m.academicYear,
                    exam_month: m.examMonth,
                    exam_year: m.examYear,
                    exam_date: m.examDate,
                    max_marks: m.maxMarks,
                    duration_minutes: m.durationMinutes,
                    university: m.university,
                    source_file: m.sourceFile,
                    source_type: m.sourceType,
                    source_file_id: sourceIdByPath.get(m.sourceFile) ?? null,
                    start_page: m.startPage,
                    end_page: m.endPage,
                    extraction_status: m.extractionStatus,
                    verification_status: m.verificationStatus,
                    notes: m.notes,
                    question_count: paper.questions.length,
                    import_batch: batchId,
                    is_active: true,
                    updated_at: trx.fn.now(),
                };
                if (existing) {
                    await trx('previous_year_papers').where({ id: existing.id }).update(row);
                    paperRowByKey.set(m.paperId, Number(existing.id));
                    updated += 1;
                }
                else {
                    const [id] = await trx('previous_year_papers').insert({
                        college_id: opts.collegeId,
                        paper_id: m.paperId,
                        ...row,
                    });
                    paperRowByKey.set(m.paperId, Number(id));
                    inserted += 1;
                }
            }
            const hasOrPairCol = await trx.schema.hasColumn('previous_year_questions', 'or_pair_id');
            const hasAssignCol = await trx.schema.hasColumn('previous_year_questions', 'module_assignment_method');
            for (const q of payload.questions) {
                const paperRowId = paperRowByKey.get(q.paperId);
                if (!paperRowId)
                    continue;
                const paper = payload.papers.find((p) => p.metadata.paperId === q.paperId);
                const ctx = enricher(paper?.metadata.courseCode || null, paper?.metadata.subjectName || null);
                let derived = null;
                if (ctx?.courseId && q.primaryCo) {
                    derived = snapshotDerivedOutcomes(await resolveDerivedOutcomes({
                        collegeId: opts.collegeId,
                        courseId: ctx.courseId,
                        primaryCoCode: q.primaryCo,
                    }));
                }
                const module = ctx?.modules.find((m) => m.name === q.moduleOrUnit) || null;
                const outcome = ctx?.outcomes.find((o) => o.coCode === q.primaryCo) || null;
                const existing = await trx('previous_year_questions')
                    .where({ college_id: opts.collegeId, question_id: q.questionId })
                    .first();
                const row = {
                    paper_id: paperRowId,
                    question_number: q.questionNumber,
                    sub_letter: null,
                    section: q.section,
                    question_text: q.questionText,
                    original_question_text: q.originalQuestionText || q.questionText,
                    display_question_text: q.questionText,
                    question_type: q.questionType,
                    max_marks: q.maxMarks,
                    printed_marks: q.maxMarks,
                    marks_missing: q.marksStatus === 'MARKS_UNRESOLVED' || q.notes === 'MARKS_UNRESOLVED' || q.notes === 'MARKS_MISSING',
                    marks_status: q.marksStatus || (q.maxMarks == null ? 'MARKS_UNRESOLVED' : 'RESOLVED'),
                    module_or_unit: q.moduleOrUnit,
                    module_id: module?.id ?? null,
                    topic_name: q.topicName ?? null,
                    module_mapping_confidence: q.moduleMappingConfidence ?? null,
                    module_mapping_status: q.moduleMappingStatus ?? null,
                    primary_co_code: q.primaryCo,
                    primary_co_id: outcome?.id ?? null,
                    printed_co: q.printedCo ?? null,
                    derived_co: q.derivedCo ?? q.primaryCo,
                    printed_po: q.printedPo ?? null,
                    printed_pso: q.printedPso ?? null,
                    printed_rbt: q.printedRbt ?? null,
                    rbt_level: q.rbtLevel || rbtFromBloom(q.bloomLevel),
                    derived_po: (derived?.pos || []).map((p) => (typeof p === 'string' ? p : p.code)).join(',') || q.printedPo || null,
                    derived_pso: (derived?.psos || []).map((p) => (typeof p === 'string' ? p : p.code)).join(',') || q.printedPso || null,
                    co_mapping_status: q.coMappingStatus ?? null,
                    difficulty: q.difficulty,
                    bloom_level: q.bloomLevel,
                    is_or_choice: q.isOrChoice === 'YES',
                    or_group_id: q.orPairId || q.orGroupId,
                    ...(hasOrPairCol
                        ? { or_pair_id: q.orPairId || q.orGroupId, or_alternative: q.orAlternative }
                        : {}),
                    ...(hasAssignCol ? { module_assignment_method: q.moduleAssignmentMethod } : {}),
                    source_page: q.sourcePage,
                    source_reference: q.sourceReference,
                    source_type: MASTER_QUESTION_SOURCE_TYPE,
                    mapping_basis: q.mappingBasis,
                    verification_status: q.verificationStatus,
                    readiness_status: q.readinessStatus || 'PYQ_EXTRACTED',
                    extraction_timestamp: trx.fn.now(),
                    co_mapping_blocked: q.coMappingStatus === 'CO_MAPPING_BLOCKED' || q.verificationStatus === 'CO_MAPPING_BLOCKED',
                    derived_outcomes_snapshot: derived ? JSON.stringify(derived) : null,
                    fingerprint: q.fingerprint,
                    notes: q.notes,
                    import_batch: batchId,
                    is_active: true,
                    updated_at: trx.fn.now(),
                };
                let questionRowId;
                if (existing) {
                    await trx('previous_year_questions').where({ id: existing.id }).update(row);
                    questionRowId = Number(existing.id);
                    unchanged += 1;
                }
                else {
                    const [id] = await trx('previous_year_questions').insert({
                        college_id: opts.collegeId,
                        question_id: q.questionId,
                        parent_id: null,
                        ...row,
                    });
                    questionRowId = Number(id);
                }
                await trx('previous_year_question_co_links').where({ question_row_id: questionRowId }).del();
                if (q.primaryCo) {
                    await trx('previous_year_question_co_links').insert({
                        college_id: opts.collegeId,
                        question_row_id: questionRowId,
                        co_code: q.primaryCo,
                        role: 'PRIMARY',
                        provenance: q.printedCo ? 'PYQ_SOURCE_MAPPING' : 'DERIVED_FROM_CO_MAPPING',
                    });
                }
                const parsed = payload.papers.find((p) => p.metadata.paperId === q.paperId)?.questions.find((qq) => qq.questionNumber === q.questionNumber);
                for (const sub of parsed?.subquestions || []) {
                    const subId = `${q.paperId}-Q${q.questionNumber}${sub.letter}`;
                    const subExisting = await trx('previous_year_questions')
                        .where({ college_id: opts.collegeId, question_id: subId })
                        .first();
                    const subRow = {
                        paper_id: paperRowId,
                        parent_id: questionRowId,
                        question_number: q.questionNumber,
                        sub_letter: sub.letter,
                        section: q.section,
                        question_text: sub.questionText,
                        question_type: q.questionType,
                        max_marks: sub.maxMarks,
                        marks_missing: sub.marksMissing,
                        module_or_unit: q.moduleOrUnit,
                        module_id: module?.id ?? null,
                        primary_co_code: q.primaryCo,
                        primary_co_id: outcome?.id ?? null,
                        difficulty: sub.difficulty,
                        bloom_level: sub.bloomLevel,
                        is_or_choice: q.isOrChoice === 'YES',
                        or_group_id: q.orPairId || q.orGroupId,
                        ...(hasOrPairCol
                            ? { or_pair_id: q.orPairId || q.orGroupId, or_alternative: q.orAlternative }
                            : {}),
                        ...(hasAssignCol ? { module_assignment_method: q.moduleAssignmentMethod } : {}),
                        source_page: sub.sourcePage,
                        source_reference: q.sourceReference,
                        source_type: MASTER_QUESTION_SOURCE_TYPE,
                        original_question_text: sub.originalText || sub.questionText,
                        display_question_text: sub.questionText,
                        parent_question_number: q.questionNumber,
                        subquestion_identifier: sub.letter,
                        printed_marks: sub.maxMarks,
                        marks_status: sub.marksMissing ? 'MARKS_UNRESOLVED' : 'RESOLVED',
                        printed_co: sub.printedCo || q.printedCo,
                        printed_po: sub.printedPo || q.printedPo,
                        printed_pso: sub.printedPso || q.printedPso,
                        printed_rbt: sub.printedRbt || q.printedRbt,
                        rbt_level: sub.printedRbt || q.rbtLevel,
                        mapping_basis: q.mappingBasis,
                        verification_status: sub.marksMissing ? 'MARKS_MISSING' : q.verificationStatus,
                        co_mapping_blocked: q.verificationStatus === 'CO_MAPPING_BLOCKED',
                        fingerprint: q.fingerprint + sub.letter,
                        notes: sub.marksMissing ? 'MARKS_MISSING' : null,
                        import_batch: batchId,
                        is_active: true,
                        updated_at: trx.fn.now(),
                    };
                    if (subExisting) {
                        await trx('previous_year_questions').where({ id: subExisting.id }).update(subRow);
                    }
                    else {
                        await trx('previous_year_questions').insert({
                            college_id: opts.collegeId,
                            question_id: subId,
                            ...subRow,
                        });
                    }
                }
            }
            await trx('qp_review_queue').where({ college_id: opts.collegeId }).del();
            let ri = 1;
            for (const rev of payload.reviews) {
                await trx('qp_review_queue').insert({
                    college_id: opts.collegeId,
                    review_id: `REV-${batchId}-${ri}`,
                    issue_type: rev.issueType,
                    reason: rev.reason,
                    paper_id: rev.paperId ?? null,
                    question_ref: rev.questionRef ?? null,
                    source_file: rev.sourceFile ?? null,
                    source_page: rev.sourcePage ?? null,
                    priority: rev.priority,
                    review_status: 'NEEDS_REVIEW',
                    import_batch: batchId,
                });
                ri += 1;
            }
        });
    }
    if (!opts.dryRun) {
        await rebuildQuestionOccurrences(opts.collegeId);
        await enrichImportedSolutions(opts.collegeId, batchId);
        await hydrateMasterBankFromLibrary(opts.collegeId, payload);
        if (opts.writeWorkbook !== false) {
            await writeMasterWorkbook(payload, masterPath);
        }
    }
    return {
        batchId,
        dryRun: Boolean(opts.dryRun),
        filesDiscovered: payload.sources.length,
        papers: payload.papers.length,
        questions: payload.questions.length,
        subquestions: payload.subquestions.length,
        orGroups: new Set(payload.questions.filter((q) => q.orGroupId).map((q) => q.orGroupId)).size,
        coMapped: payload.coMappings.filter((c) => c.primaryCo && c.blocked !== 'YES').length,
        blocked: payload.coMappings.filter((c) => c.blocked === 'YES').length,
        needsReview: payload.reviews.length,
        ocrRequired: payload.sources.filter((s) => s.ocrRequired).length,
        unmatchedSubjects: unmatched,
        inserted,
        updated,
        unchanged,
        masterPath,
    };
}
export async function ensurePreviousYearLibrary(collegeId, importedBy) {
    const has = await db.schema.hasTable('previous_year_papers');
    if (!has)
        return null;
    const row = await db('previous_year_papers').where({ college_id: collegeId }).count({ c: '*' }).first();
    if (Number(row?.c ?? 0) > 0)
        return null;
    return applyPreviousYearImport({ collegeId, importedBy, writeWorkbook: true });
}
export async function rebuildQuestionOccurrences(collegeId) {
    if (!(await db.schema.hasTable('qp_question_source_occurrences')))
        return;
    const rows = await db('previous_year_questions as q')
        .join('previous_year_papers as p', 'p.id', 'q.paper_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true })
        .whereNull('q.parent_id')
        .select('q.id', 'q.fingerprint', 'q.question_text', 'q.college_id', 'p.id as paper_row_id', 'p.paper_id', 'p.exam_type', 'p.academic_year', 'p.exam_year', 'p.exam_month', 'p.course_id');
    const byFp = new Map();
    for (const r of rows) {
        const fp = String(r.fingerprint || '');
        if (!fp)
            continue;
        const list = byFp.get(fp) ?? [];
        list.push(r);
        byFp.set(fp, list);
    }
    for (const [fp, list] of byFp) {
        const years = list.map((r) => Number(r.exam_year || 0)).filter(Boolean);
        const latest = list.slice().sort((a, b) => Number(b.exam_year || 0) - Number(a.exam_year || 0))[0];
        let canonicalId = null;
        if (await db.schema.hasTable('qp_canonical_questions')) {
            const existing = await db('qp_canonical_questions').where({ college_id: collegeId, fingerprint: fp }).first();
            const payload = {
                course_id: latest.course_id ?? null,
                canonical_text: String(latest.question_text),
                times_asked: list.length,
                most_recent_year: years.length ? Math.max(...years) : null,
                most_recent_exam: latest.exam_type,
                updated_at: db.fn.now(),
            };
            if (existing) {
                await db('qp_canonical_questions').where({ id: existing.id }).update(payload);
                canonicalId = Number(existing.id);
            }
            else {
                const [id] = await db('qp_canonical_questions').insert({
                    college_id: collegeId,
                    fingerprint: fp,
                    ...payload,
                });
                canonicalId = Number(id);
            }
        }
        for (const r of list) {
            const occ = {
                college_id: collegeId,
                canonical_id: canonicalId,
                paper_row_id: Number(r.paper_row_id),
                paper_id: String(r.paper_id),
                exam_type: r.exam_type,
                academic_year: r.academic_year,
                exam_year: r.exam_year,
                exam_month: r.exam_month,
                fingerprint: fp,
                updated_at: db.fn.now(),
            };
            const existingOcc = await db('qp_question_source_occurrences').where({ question_row_id: r.id }).first();
            if (existingOcc) {
                await db('qp_question_source_occurrences').where({ id: existingOcc.id }).update(occ);
            }
            else {
                await db('qp_question_source_occurrences').insert({ question_row_id: r.id, ...occ });
            }
            if (canonicalId) {
                await db('previous_year_questions').where({ id: r.id }).update({ canonical_question_id: canonicalId });
            }
        }
    }
}
async function enrichImportedSolutions(collegeId, batchId) {
    const questions = await db('previous_year_questions as q')
        .join('previous_year_papers as p', 'p.id', 'q.paper_id')
        .where({ 'q.college_id': collegeId })
        .andWhere((b) => {
        b.where('q.import_batch', batchId).orWhereNull('q.solution_status');
    })
        .select('q.id', 'q.parent_id', 'q.question_text', 'q.max_marks', 'q.rbt_level', 'q.bloom_level', 'q.printed_rbt', 'p.course_id');
    for (const q of questions) {
        await persistQuestionSolution({
            collegeId,
            questionRowId: Number(q.id),
            courseId: q.course_id ? Number(q.course_id) : null,
            questionText: String(q.question_text),
            marks: q.max_marks != null ? Number(q.max_marks) : null,
            rbt: q.rbt_level || q.printed_rbt,
            bloomLevel: q.bloom_level,
        });
        await refreshQuestionReadiness(Number(q.id));
    }
    const parents = questions.filter((q) => !q.parent_id);
    for (const p of parents) {
        await refreshQuestionReadiness(Number(p.id));
    }
    if (await db.schema.hasColumn('previous_year_papers', 'ready_question_count')) {
        const papers = await db('previous_year_papers').where({ college_id: collegeId }).select('id');
        for (const p of papers) {
            const ready = await db('previous_year_questions')
                .where({ paper_id: p.id })
                .whereNull('parent_id')
                .whereIn('readiness_status', ['READY', 'READY_FOR_INTERNAL_PAPER'])
                .count({ c: '*' })
                .first();
            await db('previous_year_papers').where({ id: p.id }).update({
                ready_question_count: Number(ready?.c ?? 0),
                pipeline_status: 'EXTRACTED',
            });
        }
    }
}
export async function classifyLegacyQuestionSources(collegeId) {
    const pyq = await db('previous_year_questions').where({ college_id: collegeId }).whereNull('parent_id').count({ c: '*' }).first();
    let assignmentBank = 0;
    let quizBank = 0;
    if (await db.schema.hasTable('assignment_bank_questions')) {
        if (await db.schema.hasColumn('assignment_bank_questions', 'source_classification')) {
            await db('assignment_bank_questions')
                .where({ college_id: collegeId })
                .update({ source_classification: 'LECTURER_OR_BANK_LEGACY', eligible_for_internal_paper: false });
        }
        const row = await db('assignment_bank_questions').where({ college_id: collegeId }).count({ c: '*' }).first();
        assignmentBank = Number(row?.c ?? 0);
    }
    if (await db.schema.hasTable('quiz_bank_questions')) {
        if (await db.schema.hasColumn('quiz_bank_questions', 'source_classification')) {
            await db('quiz_bank_questions')
                .where({ college_id: collegeId })
                .update({ source_classification: 'LECTURER_OR_BANK_LEGACY', eligible_for_internal_paper: false });
        }
        const row = await db('quiz_bank_questions').where({ college_id: collegeId }).count({ c: '*' }).first();
        quizBank = Number(row?.c ?? 0);
    }
    if (await db.schema.hasColumn('previous_year_questions', 'source_type')) {
        await db('previous_year_questions')
            .where({ college_id: collegeId })
            .update({ source_type: MASTER_QUESTION_SOURCE_TYPE });
    }
    return {
        previousYearQuestions: Number(pyq?.c ?? 0),
        assignmentBankQuestions: assignmentBank,
        quizBankQuestions: quizBank,
        note: 'Non-PYQ questions were classified, not deleted. They remain ineligible for Internal Question Paper auto-generation.',
    };
}
export { parseJson, copoCatalog };
async function hydrateMasterBankFromLibrary(collegeId, payload) {
    if (!payload.masterBank.length)
        return;
    if (!(await db.schema.hasTable('previous_year_questions')))
        return;
    const rows = await db('previous_year_questions as q')
        .join('previous_year_papers as p', 'p.id', 'q.paper_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true })
        .select('q.question_id', 'q.readiness_status', 'q.solution_status', 'q.scheme_status', 'q.textbook_id', 'q.fingerprint', 'p.exam_year');
    const byId = new Map(rows.map((r) => [String(r.question_id), r]));
    const solutions = (await db.schema.hasTable('qp_master_solutions'))
        ? await db('qp_master_solutions as s')
            .join('previous_year_questions as q', 'q.id', 's.question_row_id')
            .where({ 'q.college_id': collegeId })
            .select('q.question_id', 's.textbook_id', 's.textbook_title', 's.chapter', 's.section', 's.page_range', 's.model_solution', 's.expected_key_points', 's.textbook_grounded')
        : [];
    const solByQid = new Map(solutions.map((s) => [String(s.question_id), s]));
    const schemes = (await db.schema.hasTable('qp_master_scheme_components'))
        ? await db('qp_master_scheme_components as c')
            .join('previous_year_questions as q', 'q.id', 'c.question_row_id')
            .where({ 'q.college_id': collegeId })
            .orderBy('c.sort_order')
            .select('q.question_id', 'c.label', 'c.max_marks')
        : [];
    const schemeByQid = new Map();
    for (const s of schemes) {
        const list = schemeByQid.get(String(s.question_id)) ?? [];
        list.push(`${s.label} — ${s.max_marks}`);
        schemeByQid.set(String(s.question_id), list);
    }
    const fpYears = new Map();
    for (const r of rows) {
        const fp = String(r.fingerprint || '');
        if (!fp || !r.exam_year)
            continue;
        const list = fpYears.get(fp) ?? [];
        list.push(Number(r.exam_year));
        fpYears.set(fp, list);
    }
    for (const row of payload.masterBank) {
        const dbRow = byId.get(row.questionId);
        const sol = solByQid.get(row.questionId);
        if (sol) {
            row.textbookId = sol.textbook_id ?? row.textbookId;
            row.textbookTitle = sol.textbook_title || row.textbookTitle;
            row.textbookChapter = sol.chapter || row.textbookChapter;
            row.textbookSection = sol.section || row.textbookSection;
            row.textbookPageReference = sol.page_range || row.textbookPageReference;
            row.modelSolution = sol.textbook_grounded && String(sol.model_solution || '').trim() ? String(sol.model_solution) : 'SOLUTION_PENDING';
            row.expectedKeyPoints = sol.expected_key_points || row.expectedKeyPoints;
        }
        const scheme = schemeByQid.get(row.questionId);
        if (scheme?.length)
            row.schemeOfEvaluation = scheme.join('\n');
        if (dbRow) {
            row.verificationStatus = dbRow.readiness_status || row.verificationStatus;
            const fp = String(dbRow.fingerprint || '');
            const years = [...new Set(fpYears.get(fp) || [])].sort();
            row.timesAsked = years.length || row.timesAsked;
            row.lastAskedYear = years.length ? years[years.length - 1] : row.lastAskedYear;
            row.yearsAppeared = years.length ? years.join(', ') : row.yearsAppeared;
        }
        row.readyForInternalPaper = String(row.verificationStatus) === 'READY_FOR_INTERNAL_PAPER' && row.modelSolution !== 'SOLUTION_PENDING' && Boolean(row.schemeOfEvaluation) ? 'YES' : 'NO';
        if (row.readyForInternalPaper === 'NO' && !row.readinessReason) {
            row.readinessReason = row.verificationStatus || 'Incomplete';
        }
        if (row.readyForInternalPaper === 'YES')
            row.readinessReason = null;
    }
}
