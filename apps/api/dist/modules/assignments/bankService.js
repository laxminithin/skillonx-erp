import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { ASSIGNMENT_DIFFICULTIES, ASSIGNMENT_QUESTION_TYPES, ASSIGNMENT_RESPONSE_FORMATS, ASSIGNMENT_REVIEW_STATUSES, ASSIGNMENT_SELECTABLE_STATUSES, normalizeQuestionText, } from '../../types/assignment.js';
import { parseSecondaryCos, resolveDerivedOutcomes, snapshotDerivedOutcomes } from '../questions/coMapping.js';
import { listModules, createModule, updateModule, deleteModule, moduleSchema, assertCourseInCollege, assertModuleInCourse, } from '../quizzes/bankService.js';
import { hasModelSolution, parseEvaluationScheme, validateSchemeMatchesMarks, buildDefaultScheme, } from './scheme.js';
export { listModules, createModule, updateModule, deleteModule, moduleSchema };
export const bankQuestionSchema = z.object({
    courseId: z.number().int().positive(),
    moduleId: z.number().int().positive(),
    questionText: z.string().min(1),
    questionType: z.enum(ASSIGNMENT_QUESTION_TYPES).optional().default('DESCRIPTIVE'),
    responseFormat: z.enum(ASSIGNMENT_RESPONSE_FORMATS).optional().default('LONG_TEXT'),
    marks: z.number().positive().max(100).optional().default(10),
    difficulty: z.enum(ASSIGNMENT_DIFFICULTIES).optional().nullable(),
    expectedAnswerGuidance: z.string().optional().nullable(),
    evaluationRubric: z.any().optional().nullable(),
    source: z.string().max(512).optional().nullable(),
    sourceFile: z.string().max(512).optional().nullable(),
    sourceReference: z.string().max(128).optional().nullable(),
    importBatch: z.string().max(64).optional().nullable(),
    originalDifficulty: z.string().max(64).optional().nullable(),
    reviewStatus: z.enum(ASSIGNMENT_REVIEW_STATUSES).optional(),
    reviewNotes: z.string().optional().nullable(),
    primaryCoCode: z.string().max(32).optional().nullable(),
    secondaryCoCodes: z.array(z.string()).optional().nullable(),
    mappingBasis: z.string().max(512).optional().nullable(),
    mappingSource: z.string().max(255).optional().nullable(),
    verificationStatus: z.string().max(32).optional().nullable(),
});
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
function mapBankQuestion(row) {
    return {
        id: row.id,
        courseId: row.course_id,
        moduleId: row.module_id,
        courseName: row.course_name,
        moduleName: row.module_name,
        questionText: row.question_text,
        questionType: row.question_type,
        responseFormat: row.response_format,
        marks: Number(row.marks),
        difficulty: row.difficulty,
        expectedAnswerGuidance: row.expected_answer_guidance,
        modelSolution: row.expected_answer_guidance,
        evaluationRubric: parseJson(row.evaluation_rubric, null),
        evaluationScheme: parseEvaluationScheme(row.evaluation_rubric),
        source: row.source,
        reviewStatus: row.review_status,
        reviewNotes: row.review_notes,
        primaryCoCode: row.primary_co_code,
        primaryCoId: row.primary_co_id,
        secondaryCoCodes: parseSecondaryCos(row.secondary_co_codes),
        mappingBasis: row.mapping_basis,
        mappingSource: row.mapping_source,
        verificationStatus: row.verification_status,
        coMappingBlocked: !!row.co_mapping_blocked,
        coMappingBlockReason: row.co_mapping_block_reason,
        derivedOutcomes: parseJson(row.derived_outcomes_snapshot, null),
        sourceFile: row.source_file,
        sourceReference: row.source_reference,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export function validateAssignmentBankQuestion(input) {
    const notes = [];
    if (!hasModelSolution(input.expectedAnswerGuidance)) {
        notes.push('Model solution / expected answer guidance is required');
    }
    try {
        if (input.evaluationRubric != null) {
            validateSchemeMatchesMarks(input.evaluationRubric, input.marks);
        }
        else if (input.requireComplete) {
            notes.push('Evaluation scheme is required');
        }
    }
    catch (err) {
        notes.push(err instanceof Error ? err.message : 'Invalid evaluation scheme');
    }
    return {
        ok: notes.length === 0,
        reviewStatus: notes.length ? 'NEEDS_REVIEW' : 'READY',
        notes,
    };
}
async function findDuplicate(collegeId, courseId, moduleId, questionText, excludeId) {
    const normalized = normalizeQuestionText(questionText);
    let q = db('assignment_bank_questions').where({
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
async function resolveCo(collegeId, courseId, primaryCoCode) {
    if (!primaryCoCode) {
        return {
            primaryCoId: null,
            snapshot: null,
            blocked: false,
            blockReason: null,
        };
    }
    const co = await db('course_outcomes')
        .where({
        college_id: collegeId,
        course_id: courseId,
        is_current: true,
        co_code: primaryCoCode.toUpperCase(),
    })
        .first();
    const derived = await resolveDerivedOutcomes({
        collegeId,
        courseId,
        primaryCoCode,
        primaryCoId: co ? Number(co.id) : null,
    });
    return {
        primaryCoId: co ? Number(co.id) : null,
        snapshot: snapshotDerivedOutcomes(derived),
        blocked: derived.blocked,
        blockReason: derived.blockReason,
    };
}
export async function listBankQuestions(collegeId, opts = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
    let query = db('assignment_bank_questions as q')
        .leftJoin('courses as c', 'c.id', 'q.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true });
    if (opts.courseId)
        query = query.andWhere('q.course_id', opts.courseId);
    if (opts.moduleId)
        query = query.andWhere('q.module_id', opts.moduleId);
    if (opts.difficulty)
        query = query.andWhere('q.difficulty', opts.difficulty);
    if (opts.questionType)
        query = query.andWhere('q.question_type', opts.questionType);
    if (opts.coCode)
        query = query.andWhere('q.primary_co_code', opts.coCode.toUpperCase());
    if (opts.reviewStatus)
        query = query.andWhere('q.review_status', opts.reviewStatus);
    if (opts.q?.trim()) {
        query = query.andWhere('q.question_text', 'like', `%${opts.q.trim()}%`);
    }
    const countRow = await query.clone().count({ c: '*' }).first();
    const total = Number(countRow?.c ?? 0);
    const rows = await query
        .clone()
        .select('q.*', 'c.name as course_name', 'm.name as module_name')
        .orderBy([
        { column: 'c.name', order: 'asc' },
        { column: 'm.sort_order', order: 'asc' },
        { column: 'q.id', order: 'asc' },
    ])
        .limit(pageSize)
        .offset((page - 1) * pageSize);
    return {
        total,
        page,
        pageSize,
        questions: rows.map((r) => mapBankQuestion(r)),
    };
}
export async function getBankQuestion(id, collegeId) {
    const row = await db('assignment_bank_questions as q')
        .leftJoin('courses as c', 'c.id', 'q.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.id': id, 'q.college_id': collegeId })
        .select('q.*', 'c.name as course_name', 'm.name as module_name')
        .first();
    if (!row)
        throw new AppError(404, 'Question not found');
    const mapped = mapBankQuestion(row);
    let liveDerived = mapped.derivedOutcomes;
    if (mapped.primaryCoCode && mapped.courseId) {
        liveDerived = await resolveDerivedOutcomes({
            collegeId,
            courseId: Number(mapped.courseId),
            primaryCoCode: String(mapped.primaryCoCode),
            primaryCoId: mapped.primaryCoId ? Number(mapped.primaryCoId) : null,
        });
    }
    return { ...mapped, derivedOutcomes: liveDerived };
}
export async function createBankQuestion(collegeId, createdBy, raw, opts = {}) {
    await assertCourseInCollege(raw.courseId, collegeId);
    await assertModuleInCourse(raw.moduleId, raw.courseId, collegeId);
    const marks = raw.marks ?? 10;
    let rubric = raw.evaluationRubric;
    if (rubric == null) {
        rubric = buildDefaultScheme(raw.questionType, marks);
    }
    else {
        validateSchemeMatchesMarks(rubric, marks);
    }
    const validation = validateAssignmentBankQuestion({
        questionType: raw.questionType,
        marks,
        expectedAnswerGuidance: raw.expectedAnswerGuidance,
        evaluationRubric: rubric,
    });
    const reviewStatus = raw.reviewStatus ?? validation.reviewStatus;
    if (reviewStatus === 'NEEDS_REVIEW' && !opts.allowNeedsReview && !raw.reviewStatus) {
        throw new AppError(400, 'Complete the model solution and evaluation scheme before saving', {
            notes: validation.notes,
        });
    }
    const duplicate = await findDuplicate(collegeId, raw.courseId, raw.moduleId, raw.questionText);
    const notes = [...validation.notes];
    if (duplicate)
        notes.push(`Possible duplicate of question #${duplicate.id}`);
    const co = await resolveCo(collegeId, raw.courseId, raw.primaryCoCode);
    const [id] = await db('assignment_bank_questions').insert({
        college_id: collegeId,
        course_id: raw.courseId,
        module_id: raw.moduleId,
        created_by: createdBy,
        question_text: raw.questionText.trim(),
        question_type: raw.questionType,
        response_format: raw.responseFormat,
        marks,
        difficulty: raw.difficulty ?? null,
        expected_answer_guidance: raw.expectedAnswerGuidance ?? null,
        evaluation_rubric: JSON.stringify(rubric),
        source: raw.source ?? null,
        source_file: raw.sourceFile ?? null,
        source_reference: raw.sourceReference ?? null,
        import_batch: raw.importBatch ?? null,
        original_difficulty: raw.originalDifficulty ?? null,
        review_status: notes.length && reviewStatus === 'READY' && duplicate
            ? 'NEEDS_REVIEW'
            : ASSIGNMENT_SELECTABLE_STATUSES.includes(reviewStatus)
                ? reviewStatus
                : reviewStatus,
        review_notes: raw.reviewNotes ?? (notes.length ? notes.join('; ') : null),
        normalized_text: normalizeQuestionText(raw.questionText),
        primary_co_code: raw.primaryCoCode ? raw.primaryCoCode.toUpperCase() : null,
        primary_co_id: co.primaryCoId,
        secondary_co_codes: raw.secondaryCoCodes ? JSON.stringify(raw.secondaryCoCodes) : null,
        mapping_basis: raw.mappingBasis ?? null,
        mapping_source: raw.mappingSource ?? 'FACULTY_CUSTOM',
        verification_status: raw.verificationStatus ?? 'ACADEMIC_ANALYSIS',
        derived_outcomes_snapshot: co.snapshot ? JSON.stringify(co.snapshot) : null,
        co_mapping_blocked: co.blocked,
        co_mapping_block_reason: co.blockReason,
        is_active: true,
    });
    return getBankQuestion(Number(id), collegeId);
}
export async function updateBankQuestion(collegeId, id, raw) {
    const existing = await db('assignment_bank_questions')
        .where({ id, college_id: collegeId, is_active: true })
        .first();
    if (!existing)
        throw new AppError(404, 'Question not found');
    if (raw.courseId)
        await assertCourseInCollege(raw.courseId, collegeId);
    const courseId = raw.courseId ?? existing.course_id;
    const moduleId = raw.moduleId ?? existing.module_id;
    if (raw.moduleId || raw.courseId)
        await assertModuleInCourse(moduleId, courseId, collegeId);
    const marks = raw.marks ?? Number(existing.marks);
    const questionType = (raw.questionType ?? existing.question_type);
    const guidance = raw.expectedAnswerGuidance !== undefined
        ? raw.expectedAnswerGuidance
        : existing.expected_answer_guidance;
    let rubric = raw.evaluationRubric !== undefined ? raw.evaluationRubric : parseJson(existing.evaluation_rubric, null);
    if (rubric != null) {
        validateSchemeMatchesMarks(rubric, marks);
    }
    const validation = validateAssignmentBankQuestion({
        questionType,
        marks,
        expectedAnswerGuidance: guidance,
        evaluationRubric: rubric,
    });
    const primaryCoCode = raw.primaryCoCode !== undefined ? raw.primaryCoCode : existing.primary_co_code;
    const co = await resolveCo(collegeId, courseId, primaryCoCode);
    await db('assignment_bank_questions')
        .where({ id })
        .update({
        course_id: courseId,
        module_id: moduleId,
        question_text: raw.questionText?.trim() ?? existing.question_text,
        question_type: questionType,
        response_format: raw.responseFormat ?? existing.response_format,
        marks,
        difficulty: raw.difficulty !== undefined ? raw.difficulty : existing.difficulty,
        expected_answer_guidance: guidance,
        evaluation_rubric: rubric != null ? JSON.stringify(rubric) : existing.evaluation_rubric,
        source: raw.source !== undefined ? raw.source : existing.source,
        review_status: raw.reviewStatus ?? validation.reviewStatus,
        review_notes: raw.reviewNotes !== undefined
            ? raw.reviewNotes
            : validation.notes.length
                ? validation.notes.join('; ')
                : null,
        normalized_text: normalizeQuestionText(raw.questionText ?? existing.question_text),
        primary_co_code: primaryCoCode ? String(primaryCoCode).toUpperCase() : null,
        primary_co_id: co.primaryCoId,
        secondary_co_codes: raw.secondaryCoCodes !== undefined
            ? raw.secondaryCoCodes
                ? JSON.stringify(raw.secondaryCoCodes)
                : null
            : existing.secondary_co_codes,
        mapping_basis: raw.mappingBasis !== undefined ? raw.mappingBasis : existing.mapping_basis,
        mapping_source: raw.mappingSource !== undefined ? raw.mappingSource : existing.mapping_source,
        verification_status: raw.verificationStatus !== undefined ? raw.verificationStatus : existing.verification_status,
        derived_outcomes_snapshot: co.snapshot
            ? JSON.stringify(co.snapshot)
            : existing.derived_outcomes_snapshot,
        co_mapping_blocked: co.blocked,
        co_mapping_block_reason: co.blockReason,
        updated_at: db.fn.now(),
    });
    return { question: await getBankQuestion(id, collegeId) };
}
export async function deleteBankQuestion(collegeId, id) {
    const existing = await db('assignment_bank_questions').where({ id, college_id: collegeId }).first();
    if (!existing)
        throw new AppError(404, 'Question not found');
    await db('assignment_bank_questions').where({ id }).update({ is_active: false });
    return { ok: true };
}
export async function bankOverview(collegeId) {
    const rows = await db('assignment_bank_questions as q')
        .leftJoin('courses as c', 'c.id', 'q.course_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true })
        .groupBy('q.course_id', 'c.name', 'c.code')
        .select('q.course_id as courseId', 'c.name as courseName', 'c.code as courseCode', db.raw('count(*) as questionCount'), db.raw(`sum(case when q.difficulty = 'EASY' then 1 else 0 end) as easy`), db.raw(`sum(case when q.difficulty = 'INTERMEDIATE' then 1 else 0 end) as intermediate`), db.raw(`sum(case when q.difficulty = 'DIFFICULT' then 1 else 0 end) as difficult`), db.raw(`sum(case when q.primary_co_code is null then 1 else 0 end) as needsCo`))
        .orderBy('c.name');
    return {
        subjects: rows.map((r) => ({
            courseId: Number(r.courseId),
            courseName: r.courseName,
            courseCode: r.courseCode,
            questionCount: Number(r.questionCount),
            easy: Number(r.easy),
            intermediate: Number(r.intermediate),
            difficult: Number(r.difficult),
            needsCo: Number(r.needsCo),
        })),
    };
}
export async function bankInventory(collegeId, opts) {
    const modules = await db('subject_modules')
        .where({ college_id: collegeId, course_id: opts.courseId })
        .modify((qb) => {
        if (opts.moduleIds?.length)
            qb.whereIn('id', opts.moduleIds);
    })
        .orderBy('sort_order');
    let countQuery = db('assignment_bank_questions')
        .where({ college_id: collegeId, course_id: opts.courseId, is_active: true })
        .whereIn('review_status', [...ASSIGNMENT_SELECTABLE_STATUSES]);
    if (opts.moduleIds?.length)
        countQuery = countQuery.whereIn('module_id', opts.moduleIds);
    const counts = await countQuery
        .groupBy('module_id', 'difficulty')
        .select('module_id as moduleId', 'difficulty', db.raw('count(*) as c'));
    const byModule = {};
    const totals = { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 };
    for (const row of counts) {
        const mid = String(row.moduleId);
        const bucket = byModule[mid] ?? { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0, TOTAL: 0 };
        const d = String(row.difficulty || 'UNKNOWN');
        bucket[d] = Number(row.c);
        bucket.TOTAL += Number(row.c);
        byModule[mid] = bucket;
        if (d === 'EASY' || d === 'INTERMEDIATE' || d === 'DIFFICULT') {
            totals[d] += Number(row.c);
        }
    }
    return {
        totals,
        byModule,
        modules: modules.map((m) => ({
            id: m.id,
            name: m.name,
            counts: byModule[String(m.id)] ?? { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0, TOTAL: 0 },
        })),
    };
}
export async function listNeedsReview(collegeId) {
    const rows = await db('assignment_bank_questions as q')
        .leftJoin('courses as c', 'c.id', 'q.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where({ 'q.college_id': collegeId, 'q.is_active': true, 'q.review_status': 'NEEDS_REVIEW' })
        .select('q.*', 'c.name as course_name', 'm.name as module_name')
        .orderBy('q.updated_at', 'desc')
        .limit(200);
    return { questions: rows.map((r) => mapBankQuestion(r)) };
}
