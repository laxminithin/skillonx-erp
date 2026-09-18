import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { QUIZ_CO_VERIFICATION_STATUSES, QUIZ_DIFFICULTIES, QUIZ_QUESTION_TYPES, QUIZ_REVIEW_STATUSES, QUIZ_SELECTABLE_STATUSES, normalizeQuestionText, } from '../../types/quiz.js';
import { parseSecondaryCos } from '../questions/coMapping.js';
import { computeAcademicCoverage, resolvePrimaryCoForSubject, syncQuizQuestionCoLinks, } from '../questions/coValidation.js';
export const moduleSchema = z.object({
    courseId: z.number().int().positive(),
    name: z.string().min(1).max(255),
    code: z.string().max(64).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    sortOrder: z.number().int().optional(),
});
export const bankOptionSchema = z.object({
    label: z.string().min(1).max(500),
    isCorrect: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional(),
});
export const bankQuestionSchema = z.object({
    courseId: z.number().int().positive(),
    moduleId: z.number().int().positive(),
    questionText: z.string().min(1),
    questionType: z.enum(QUIZ_QUESTION_TYPES),
    marks: z.number().positive().max(100).optional().default(1),
    difficulty: z.enum(QUIZ_DIFFICULTIES).optional().nullable(),
    explanation: z.string().optional().nullable(),
    source: z.string().max(512).optional().nullable(),
    sourceFile: z.string().max(512).optional().nullable(),
    sourceReference: z.string().max(64).optional().nullable(),
    originalModule: z.string().max(255).optional().nullable(),
    originalDifficulty: z.string().max(64).optional().nullable(),
    importBatch: z.string().max(64).optional().nullable(),
    duplicateGroup: z.string().max(64).optional().nullable(),
    reviewStatus: z.enum(QUIZ_REVIEW_STATUSES).optional(),
    reviewNotes: z.string().optional().nullable(),
    numericAnswer: z.number().finite().optional().nullable(),
    numericTolerance: z.number().min(0).optional().nullable(),
    options: z.array(bankOptionSchema).optional().default([]),
    primaryCoCode: z.string().max(32).optional().nullable(),
    secondaryCoCodes: z.array(z.string().max(32)).optional().nullable(),
    mappingBasis: z.string().max(512).optional().nullable(),
    mappingSource: z.string().max(255).optional().nullable(),
    verificationStatus: z.enum(QUIZ_CO_VERIFICATION_STATUSES).optional().nullable(),
});
export function validateGradableQuestion(input) {
    const notes = [];
    const labels = input.options.map((o) => o.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length)
        notes.push('Duplicate options');
    if (input.questionType === 'TRUE_FALSE') {
        if (input.options.length !== 2)
            notes.push('True/False must have exactly two options');
    }
    if (input.questionType === 'SINGLE_CHOICE' || input.questionType === 'TRUE_FALSE') {
        const correct = input.options.filter((o) => o.isCorrect);
        if (correct.length !== 1)
            notes.push('Exactly one correct option is required');
        if (input.options.length < 2)
            notes.push('At least two options are required');
    }
    if (input.questionType === 'MULTIPLE_SELECT') {
        const correct = input.options.filter((o) => o.isCorrect);
        if (correct.length < 1)
            notes.push('At least one correct option is required');
        if (input.options.length < 2)
            notes.push('At least two options are required');
    }
    if (input.questionType === 'NUMERIC') {
        if (input.numericAnswer == null || !Number.isFinite(Number(input.numericAnswer))) {
            notes.push('Numeric answer is required');
        }
    }
    if (input.questionType === 'SHORT_ANSWER') {
        return { ok: true, reviewStatus: 'APPROVED', notes: [] };
    }
    return { ok: notes.length === 0, reviewStatus: notes.length ? 'NEEDS_REVIEW' : 'APPROVED', notes };
}
function parseJson(value) {
    if (value == null)
        return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
export async function assertCourseInCollege(courseId, collegeId) {
    const course = await db('courses').where({ id: courseId, college_id: collegeId }).first();
    if (!course)
        throw new AppError(400, 'Subject was not found in this institution');
    return course;
}
export async function assertModuleInCourse(moduleId, courseId, collegeId) {
    const mod = await db('subject_modules')
        .where({ id: moduleId, course_id: courseId, college_id: collegeId })
        .first();
    if (!mod)
        throw new AppError(400, 'Module does not belong to the selected subject');
    return mod;
}
export async function listModules(collegeId, courseId) {
    let q = db('subject_modules as m')
        .join('courses as c', 'c.id', 'm.course_id')
        .where('m.college_id', collegeId)
        .select('m.id', 'm.course_id as courseId', 'm.name', 'm.code', 'm.description', 'm.sort_order as sortOrder', 'c.name as courseName', 'c.code as courseCode')
        .orderBy([
        { column: 'c.name', order: 'asc' },
        { column: 'm.sort_order', order: 'asc' },
        { column: 'm.name', order: 'asc' },
    ]);
    if (courseId)
        q = q.andWhere('m.course_id', courseId);
    const modules = await q;
    const counts = await db('quiz_bank_questions')
        .where({ college_id: collegeId, is_active: true })
        .groupBy('module_id', 'difficulty', 'review_status')
        .select('module_id as moduleId', 'difficulty', 'review_status as reviewStatus')
        .count({ c: '*' });
    const byModule = new Map();
    for (const r of counts) {
        const id = Number(r.moduleId);
        const entry = byModule.get(id) ?? {
            total: 0,
            easy: 0,
            intermediate: 0,
            difficult: 0,
            needsReview: 0,
            approved: 0,
        };
        const n = Number(r.c);
        entry.total += n;
        const status = String(r.reviewStatus);
        if (status === 'NEEDS_REVIEW')
            entry.needsReview += n;
        else
            entry.approved += n;
        const diff = String(r.difficulty);
        if (status !== 'NEEDS_REVIEW') {
            if (diff === 'EASY')
                entry.easy += n;
            else if (diff === 'INTERMEDIATE' || diff === 'MEDIUM')
                entry.intermediate += n;
            else if (diff === 'DIFFICULT' || diff === 'HARD')
                entry.difficult += n;
        }
        byModule.set(id, entry);
    }
    return modules.map((m) => ({
        ...m,
        questionCount: byModule.get(Number(m.id))?.total ?? 0,
        difficultyCounts: byModule.get(Number(m.id)) ?? {
            total: 0,
            easy: 0,
            intermediate: 0,
            difficult: 0,
            needsReview: 0,
            approved: 0,
        },
    }));
}
export async function createModule(collegeId, createdBy, input) {
    await assertCourseInCollege(input.courseId, collegeId);
    try {
        const [id] = await db('subject_modules').insert({
            college_id: collegeId,
            course_id: input.courseId,
            name: input.name.trim(),
            code: input.code?.trim() || null,
            description: input.description ?? null,
            sort_order: input.sortOrder ?? 0,
            created_by: createdBy,
        });
        const list = await listModules(collegeId, input.courseId);
        return list.find((m) => m.id === id);
    }
    catch {
        throw new AppError(409, 'A module with this name already exists for the subject');
    }
}
export async function updateModule(collegeId, id, input) {
    const existing = await db('subject_modules').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Module not found');
    await db('subject_modules')
        .where({ id })
        .update({
        name: input.name?.trim() ?? existing.name,
        code: input.code !== undefined ? input.code?.trim() || null : existing.code,
        description: input.description !== undefined ? input.description : existing.description,
        sort_order: input.sortOrder ?? existing.sort_order,
    });
    const list = await listModules(collegeId, existing.course_id);
    return list.find((m) => m.id === id);
}
export async function deleteModule(collegeId, id) {
    const existing = await db('subject_modules').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Module not found');
    const used = await db('quiz_bank_questions').where({ module_id: id, is_active: true }).first();
    if (used)
        throw new AppError(400, 'Remove or move questions in this module before deleting it');
    await db('subject_modules').where({ id }).del();
    return { ok: true };
}
function mapBankQuestion(row, options) {
    return {
        id: row.id,
        courseId: row.course_id,
        moduleId: row.module_id,
        questionText: row.question_text,
        questionType: row.question_type,
        marks: Number(row.marks),
        difficulty: row.difficulty,
        explanation: row.explanation,
        source: row.source,
        sourceFile: row.source_file,
        sourceReference: row.source_reference,
        originalModule: row.original_module,
        originalDifficulty: row.original_difficulty,
        importBatch: row.import_batch,
        duplicateGroup: row.duplicate_group,
        reviewStatus: row.review_status === 'READY' ? 'APPROVED' : row.review_status,
        reviewNotes: row.review_notes,
        numericAnswer: row.numeric_answer != null ? Number(row.numeric_answer) : null,
        numericTolerance: row.numeric_tolerance != null ? Number(row.numeric_tolerance) : null,
        createdBy: row.created_by,
        createdAt: row.created_at,
        courseName: row.course_name,
        courseCode: row.course_code,
        moduleName: row.module_name,
        primaryCoCode: row.primary_co_code ? String(row.primary_co_code).toUpperCase() : null,
        primaryCoId: row.primary_co_id != null ? Number(row.primary_co_id) : null,
        secondaryCoCodes: parseSecondaryCos(row.secondary_co_codes),
        mappingBasis: row.mapping_basis ?? null,
        mappingSource: row.mapping_source ?? null,
        verificationStatus: row.verification_status ?? null,
        coMappingBlocked: !!row.co_mapping_blocked,
        coMappingBlockReason: row.co_mapping_block_reason ?? null,
        derivedOutcomes: parseJson(row.derived_outcomes_snapshot),
        options: options.map((o) => ({
            id: o.id,
            label: o.label,
            isCorrect: !!o.is_correct,
            sortOrder: o.sort_order,
        })),
    };
}
export async function listBankQuestions(collegeId, filters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(250, Math.max(1, filters.pageSize ?? 40));
    let query = db('quiz_bank_questions as q')
        .join('courses as c', 'c.id', 'q.course_id')
        .join('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true });
    if (filters.courseId)
        query = query.andWhere('q.course_id', filters.courseId);
    if (filters.moduleId)
        query = query.andWhere('q.module_id', filters.moduleId);
    if (filters.questionType)
        query = query.andWhere('q.question_type', filters.questionType);
    if (filters.difficulty)
        query = query.andWhere('q.difficulty', filters.difficulty);
    if (filters.coCode)
        query = query.andWhere('q.primary_co_code', filters.coCode.toUpperCase());
    if (filters.verificationStatus) {
        query = query.andWhere('q.verification_status', filters.verificationStatus);
    }
    if (filters.needsCoReview) {
        query = query.andWhere((builder) => {
            builder
                .where('q.verification_status', 'NEEDS_REVIEW')
                .orWhereNull('q.primary_co_code')
                .orWhere('q.co_mapping_blocked', true);
        });
    }
    if (filters.reviewStatus === 'APPROVED') {
        query = query.whereIn('q.review_status', ['APPROVED', 'READY']);
    }
    else if (filters.reviewStatus) {
        query = query.andWhere('q.review_status', filters.reviewStatus);
    }
    if (filters.q)
        query = query.andWhere('q.question_text', 'like', `%${filters.q.trim()}%`);
    const countRow = await query.clone().count({ c: '*' }).first();
    const total = Number(countRow?.c ?? 0);
    const rows = await query
        .clone()
        .select('q.*', 'c.name as course_name', 'c.code as course_code', 'm.name as module_name')
        .orderBy([
        { column: 'c.name', order: 'asc' },
        { column: 'm.sort_order', order: 'asc' },
        { column: 'q.difficulty', order: 'asc' },
        { column: 'q.primary_co_code', order: 'asc' },
        { column: 'q.id', order: 'asc' },
    ])
        .limit(pageSize)
        .offset((page - 1) * pageSize);
    const ids = rows.map((r) => r.id);
    const options = ids.length
        ? await db('quiz_bank_options').whereIn('question_id', ids).orderBy('sort_order', 'asc')
        : [];
    const byQ = new Map();
    for (const opt of options) {
        const list = byQ.get(opt.question_id) ?? [];
        list.push(opt);
        byQ.set(opt.question_id, list);
    }
    return {
        total,
        page,
        pageSize,
        questions: rows.map((r) => mapBankQuestion(r, byQ.get(r.id) ?? [])),
    };
}
export async function getBankQuestion(collegeId, id) {
    const row = await db('quiz_bank_questions as q')
        .join('courses as c', 'c.id', 'q.course_id')
        .join('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.id': id, 'q.college_id': collegeId, 'q.is_active': true })
        .select('q.*', 'c.name as course_name', 'c.code as course_code', 'm.name as module_name')
        .first();
    if (!row)
        throw new AppError(404, 'Question not found');
    const options = await db('quiz_bank_options').where({ question_id: id }).orderBy('sort_order', 'asc');
    const mapped = mapBankQuestion(row, options);
    let liveDerived = mapped.derivedOutcomes;
    let coStatement = null;
    if (mapped.primaryCoCode && mapped.courseId) {
        const resolved = await resolvePrimaryCoForSubject({
            collegeId,
            courseId: Number(mapped.courseId),
            primaryCoCode: String(mapped.primaryCoCode),
            primaryCoId: mapped.primaryCoId,
            strict: false,
        });
        liveDerived = resolved.derivedFull ?? mapped.derivedOutcomes;
        coStatement = resolved.coStatement;
    }
    return { ...mapped, derivedOutcomes: liveDerived, coStatement };
}
async function findDuplicate(collegeId, courseId, moduleId, text, excludeId) {
    const normalized = normalizeQuestionText(text);
    let q = db('quiz_bank_questions').where({
        college_id: collegeId,
        course_id: courseId,
        module_id: moduleId,
        is_active: true,
        normalized_text: normalized,
    });
    if (excludeId)
        q = q.andWhereNot('id', excludeId);
    return q.first();
}
export async function createBankQuestion(collegeId, createdBy, raw, opts = {}) {
    await assertCourseInCollege(raw.courseId, collegeId);
    await assertModuleInCourse(raw.moduleId, raw.courseId, collegeId);
    const validation = validateGradableQuestion({
        questionType: raw.questionType,
        options: raw.options ?? [],
        numericAnswer: raw.numericAnswer,
    });
    const reviewStatus = raw.reviewStatus ?? (validation.ok ? 'APPROVED' : 'NEEDS_REVIEW');
    if (reviewStatus === 'NEEDS_REVIEW' && !opts.allowNeedsReview && !raw.reviewStatus) {
        throw new AppError(400, 'This question cannot be auto-graded until the answer key is complete', {
            notes: validation.notes,
        });
    }
    const duplicate = await findDuplicate(collegeId, raw.courseId, raw.moduleId, raw.questionText);
    if (duplicate && opts.skipIfDuplicate) {
        throw new AppError(409, `Possible duplicate of question #${duplicate.id}`, undefined, 'DUPLICATE_QUESTION');
    }
    const notes = [...validation.notes];
    if (duplicate)
        notes.push(`Possible duplicate of question #${duplicate.id}`);
    // Faculty-created bank questions require a valid subject CO when provided or when strict custom path
    const resolved = await resolvePrimaryCoForSubject({
        collegeId,
        courseId: raw.courseId,
        primaryCoCode: raw.primaryCoCode,
        strict: Boolean(raw.primaryCoCode),
    });
    const verificationStatus = raw.verificationStatus ??
        (resolved.blocked
            ? 'CO_MAPPING_BLOCKED'
            : resolved.primaryCoCode
                ? 'ACADEMIC_ANALYSIS'
                : null);
    const [id] = await db('quiz_bank_questions').insert({
        college_id: collegeId,
        course_id: raw.courseId,
        module_id: raw.moduleId,
        created_by: createdBy,
        question_text: raw.questionText.trim(),
        question_type: raw.questionType,
        marks: raw.marks ?? 1,
        difficulty: raw.difficulty ?? null,
        explanation: raw.explanation ?? null,
        source: raw.sourceFile ?? raw.source ?? null,
        source_file: raw.sourceFile ?? raw.source ?? null,
        source_reference: raw.sourceReference ?? null,
        original_module: raw.originalModule ?? null,
        original_difficulty: raw.originalDifficulty ?? null,
        import_batch: raw.importBatch ?? null,
        duplicate_group: raw.duplicateGroup ?? null,
        review_status: notes.length && reviewStatus === 'APPROVED' && duplicate ? 'NEEDS_REVIEW' : reviewStatus,
        review_notes: raw.reviewNotes ?? (notes.length ? notes.join('; ') : null),
        numeric_answer: raw.numericAnswer ?? null,
        numeric_tolerance: raw.numericTolerance ?? 0,
        normalized_text: normalizeQuestionText(raw.questionText),
        is_active: true,
        primary_co_code: resolved.primaryCoCode,
        primary_co_id: resolved.primaryCoId,
        secondary_co_codes: raw.secondaryCoCodes
            ? JSON.stringify(parseSecondaryCos(raw.secondaryCoCodes))
            : null,
        mapping_basis: raw.mappingBasis ?? null,
        mapping_source: raw.mappingSource ?? (raw.primaryCoCode ? 'FACULTY_CUSTOM' : null),
        verification_status: verificationStatus,
        co_mapping_blocked: resolved.blocked,
        co_mapping_block_reason: resolved.blockReason,
        derived_outcomes_snapshot: resolved.derived ? JSON.stringify(resolved.derived) : null,
        course_outcome_id: resolved.primaryCoId,
    });
    for (const [i, opt] of (raw.options ?? []).entries()) {
        await db('quiz_bank_options').insert({
            question_id: id,
            label: opt.label.trim(),
            is_correct: !!opt.isCorrect,
            sort_order: opt.sortOrder ?? i,
        });
    }
    await syncQuizQuestionCoLinks(id, resolved.primaryCoId, resolved.primaryCoCode, parseSecondaryCos(raw.secondaryCoCodes));
    return getBankQuestion(collegeId, id);
}
export async function updateBankQuestion(collegeId, id, raw) {
    const existing = await db('quiz_bank_questions').where({ id, college_id: collegeId, is_active: true }).first();
    if (!existing)
        throw new AppError(404, 'Question not found');
    const nextType = (raw.questionType ?? existing.question_type);
    const nextOptions = raw.options ??
        (await db('quiz_bank_options').where({ question_id: id }).orderBy('sort_order')).map((o) => ({
            label: o.label,
            isCorrect: !!o.is_correct,
        }));
    const nextNumeric = raw.numericAnswer !== undefined ? raw.numericAnswer : existing.numeric_answer;
    const validation = validateGradableQuestion({
        questionType: nextType,
        options: nextOptions,
        numericAnswer: nextNumeric != null ? Number(nextNumeric) : null,
    });
    if (raw.courseId)
        await assertCourseInCollege(raw.courseId, collegeId);
    const courseId = raw.courseId ?? existing.course_id;
    const moduleId = raw.moduleId ?? existing.module_id;
    if (raw.moduleId || raw.courseId)
        await assertModuleInCourse(moduleId, courseId, collegeId);
    const answerKeyChanged = raw.options !== undefined ||
        raw.numericAnswer !== undefined ||
        (raw.questionType && raw.questionType !== existing.question_type);
    let coPatch = {};
    if (raw.primaryCoCode !== undefined ||
        raw.secondaryCoCodes !== undefined ||
        raw.mappingBasis !== undefined ||
        raw.mappingSource !== undefined ||
        raw.verificationStatus !== undefined) {
        const resolved = await resolvePrimaryCoForSubject({
            collegeId,
            courseId,
            primaryCoCode: raw.primaryCoCode !== undefined ? raw.primaryCoCode : existing.primary_co_code,
            strict: Boolean((raw.primaryCoCode !== undefined ? raw.primaryCoCode : existing.primary_co_code)),
        });
        coPatch = {
            primary_co_code: resolved.primaryCoCode,
            primary_co_id: resolved.primaryCoId,
            secondary_co_codes: raw.secondaryCoCodes !== undefined
                ? JSON.stringify(parseSecondaryCos(raw.secondaryCoCodes))
                : existing.secondary_co_codes,
            mapping_basis: raw.mappingBasis !== undefined ? raw.mappingBasis : existing.mapping_basis,
            mapping_source: raw.mappingSource !== undefined ? raw.mappingSource : existing.mapping_source,
            verification_status: raw.verificationStatus !== undefined
                ? raw.verificationStatus
                : resolved.blocked
                    ? 'CO_MAPPING_BLOCKED'
                    : existing.verification_status ?? (resolved.primaryCoCode ? 'ACADEMIC_ANALYSIS' : null),
            co_mapping_blocked: resolved.blocked,
            co_mapping_block_reason: resolved.blockReason,
            derived_outcomes_snapshot: resolved.derived ? JSON.stringify(resolved.derived) : null,
            course_outcome_id: resolved.primaryCoId,
        };
    }
    await db('quiz_bank_questions')
        .where({ id })
        .update({
        course_id: courseId,
        module_id: moduleId,
        question_text: raw.questionText?.trim() ?? existing.question_text,
        question_type: nextType,
        marks: raw.marks ?? existing.marks,
        difficulty: raw.difficulty !== undefined ? raw.difficulty : existing.difficulty,
        explanation: raw.explanation !== undefined ? raw.explanation : existing.explanation,
        source: raw.source !== undefined ? raw.source : existing.source,
        review_status: raw.reviewStatus ?? (validation.ok ? 'APPROVED' : 'NEEDS_REVIEW'),
        review_notes: raw.reviewNotes !== undefined ? raw.reviewNotes : validation.notes.join('; ') || null,
        numeric_answer: raw.numericAnswer !== undefined ? raw.numericAnswer : existing.numeric_answer,
        numeric_tolerance: raw.numericTolerance !== undefined ? raw.numericTolerance : existing.numeric_tolerance,
        normalized_text: normalizeQuestionText(raw.questionText ?? existing.question_text),
        ...coPatch,
    });
    if (raw.options) {
        await db('quiz_bank_options').where({ question_id: id }).del();
        for (const [i, opt] of raw.options.entries()) {
            await db('quiz_bank_options').insert({
                question_id: id,
                label: opt.label.trim(),
                is_correct: !!opt.isCorrect,
                sort_order: opt.sortOrder ?? i,
            });
        }
    }
    if (Object.keys(coPatch).length) {
        await syncQuizQuestionCoLinks(id, coPatch.primary_co_id, coPatch.primary_co_code, parseSecondaryCos(raw.secondaryCoCodes !== undefined ? raw.secondaryCoCodes : existing.secondary_co_codes));
    }
    return { question: await getBankQuestion(collegeId, id), answerKeyChanged };
}
export async function deleteBankQuestion(collegeId, id) {
    const existing = await db('quiz_bank_questions').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Question not found');
    await db('quiz_bank_questions').where({ id }).update({ is_active: false });
    return { ok: true };
}
export async function bankOverview(collegeId) {
    const modules = await listModules(collegeId);
    const byCourse = new Map();
    for (const m of modules) {
        const counts = m.difficultyCounts ?? {
            easy: 0,
            intermediate: 0,
            difficult: 0,
            needsReview: 0,
        };
        const entry = byCourse.get(Number(m.courseId)) ?? {
            courseId: Number(m.courseId),
            courseName: String(m.courseName),
            courseCode: String(m.courseCode),
            modules: [],
            questionCount: 0,
            easy: 0,
            intermediate: 0,
            difficult: 0,
            needsReview: 0,
        };
        entry.modules.push(m);
        entry.questionCount += Number(m.questionCount);
        entry.easy += counts.easy;
        entry.intermediate += counts.intermediate;
        entry.difficult += counts.difficult;
        entry.needsReview += counts.needsReview;
        byCourse.set(Number(m.courseId), entry);
    }
    return { subjects: [...byCourse.values()] };
}
export async function bankInventory(collegeId, filters) {
    await assertCourseInCollege(filters.courseId, collegeId);
    let query = db('quiz_bank_questions')
        .where({
        college_id: collegeId,
        course_id: filters.courseId,
        is_active: true,
    })
        .whereIn('review_status', [...QUIZ_SELECTABLE_STATUSES]);
    if (filters.moduleIds?.length)
        query = query.whereIn('module_id', filters.moduleIds);
    const rows = await query.select('id', 'module_id as moduleId', 'difficulty', 'normalized_text as fingerprint');
    const totals = { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 };
    const seen = new Set();
    const byModule = new Map();
    for (const row of rows) {
        const key = `${row.fingerprint}|${row.difficulty}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        const d = (row.difficulty === 'MEDIUM' ? 'INTERMEDIATE' : row.difficulty === 'HARD' ? 'DIFFICULT' : row.difficulty);
        if (!(d in totals))
            continue;
        totals[d] += 1;
        const bucket = byModule.get(Number(row.moduleId)) ?? { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 };
        bucket[d] += 1;
        byModule.set(Number(row.moduleId), bucket);
    }
    return { totals, byModule: Object.fromEntries(byModule) };
}
export async function listNeedsReview(collegeId) {
    return listBankQuestions(collegeId, { reviewStatus: 'NEEDS_REVIEW', pageSize: 250 });
}
/** QA report: CO mapping readiness for question bank (not final attainment). */
export async function coMappingQaReport(collegeId, courseId) {
    let query = db('quiz_bank_questions as q')
        .join('courses as c', 'c.id', 'q.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true });
    if (courseId)
        query = query.andWhere('q.course_id', courseId);
    const rows = await query.select('q.id', 'q.course_id as courseId', 'c.name as courseName', 'c.code as courseCode', 'q.module_id as moduleId', 'm.name as moduleName', 'q.primary_co_code as primaryCoCode', 'q.verification_status as verificationStatus', 'q.co_mapping_blocked as coMappingBlocked');
    const bySubject = new Map();
    for (const r of rows) {
        const cid = Number(r.courseId);
        const entry = bySubject.get(cid) ??
            {
                courseId: cid,
                courseName: String(r.courseName),
                courseCode: String(r.courseCode ?? ''),
                total: 0,
                mapped: 0,
                needsReview: 0,
                blocked: 0,
                byCo: {},
                byModule: new Map(),
            };
        entry.total += 1;
        const co = r.primaryCoCode ? String(r.primaryCoCode).toUpperCase() : null;
        const status = String(r.verificationStatus || '');
        const blocked = !!r.coMappingBlocked || status === 'CO_MAPPING_BLOCKED';
        if (blocked)
            entry.blocked += 1;
        else if (!co || status === 'NEEDS_REVIEW')
            entry.needsReview += 1;
        else
            entry.mapped += 1;
        if (co)
            entry.byCo[co] = (entry.byCo[co] ?? 0) + 1;
        const modKey = String(r.moduleId ?? 'none');
        const mod = entry.byModule.get(modKey) ??
            {
                moduleName: String(r.moduleName || 'Unassigned'),
                questions: 0,
                mapped: 0,
                unmapped: 0,
                byCo: {},
            };
        mod.questions += 1;
        if (co && !blocked && status !== 'NEEDS_REVIEW') {
            mod.mapped += 1;
            mod.byCo[co] = (mod.byCo[co] ?? 0) + 1;
        }
        else {
            mod.unmapped += 1;
        }
        entry.byModule.set(modKey, mod);
        bySubject.set(cid, entry);
    }
    const subjects = [...bySubject.values()].map((s) => {
        const attainmentReady = s.blocked === 0 && s.needsReview === 0 && s.mapped === s.total && s.total > 0;
        return {
            courseId: s.courseId,
            courseName: s.courseName,
            courseCode: s.courseCode,
            total: s.total,
            mapped: s.mapped,
            needsReview: s.needsReview,
            blocked: s.blocked,
            attainmentReady: attainmentReady ? 'YES' : 'NO',
            coMappingStatus: s.blocked === s.total && s.total > 0 ? 'BLOCKED' : attainmentReady ? 'READY' : 'PARTIAL',
            coDistribution: s.byCo,
            modules: [...s.byModule.values()].map((m) => ({
                moduleName: m.moduleName,
                questions: m.questions,
                mapped: m.mapped,
                unmapped: m.unmapped,
                coCoverage: m.byCo,
            })),
        };
    });
    const totals = subjects.reduce((acc, s) => {
        acc.total += s.total;
        acc.mapped += s.mapped;
        acc.needsReview += s.needsReview;
        acc.blocked += s.blocked;
        return acc;
    }, { total: 0, mapped: 0, needsReview: 0, blocked: 0 });
    return {
        kind: 'QUIZ_CO_MAPPING_QA',
        note: 'CO Assessment Performance readiness — not final CO Attainment.',
        totals: {
            ...totals,
            attainmentReady: totals.blocked === 0 && totals.needsReview === 0 && totals.mapped === totals.total && totals.total > 0
                ? 'YES'
                : 'NO',
        },
        subjects: subjects.sort((a, b) => a.courseName.localeCompare(b.courseName)),
        coverage: computeAcademicCoverage(rows.map((r) => ({ primaryCoCode: r.primaryCoCode }))),
    };
}
export { parseJson };
