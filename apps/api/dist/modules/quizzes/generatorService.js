import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { CORRECT_ANSWER_VISIBILITY, QUIZ_DIFFICULTIES, QUIZ_SELECTABLE_STATUSES, } from '../../types/quiz.js';
import { assertCourseInCollege, assertModuleInCourse } from './bankService.js';
import { pickReplacement, selectQuestions, } from './generator.js';
import { addFromBank, createQuiz, deleteQuestion, getQuiz, quizMetaSchema, } from './service.js';
export const generateQuizSchema = quizMetaSchema.extend({
    courseId: z.number().int().positive(),
    moduleIds: z.array(z.number().int().positive()).min(1),
    easyCount: z.number().int().min(0).max(200),
    intermediateCount: z.number().int().min(0).max(200),
    difficultCount: z.number().int().min(0).max(200),
    distribution: z.enum(['BALANCED', 'RANDOM']).optional().default('BALANCED'),
    marksPerQuestion: z.number().positive().max(100).optional().default(1),
    title: z.string().min(1).max(255).optional(),
}).refine((v) => v.easyCount + v.intermediateCount + v.difficultCount >= 1, { message: 'Select at least one question' });
function parseGeneration(value) {
    const raw = typeof value === 'string' ? (() => { try {
        return JSON.parse(value);
    }
    catch {
        return null;
    } })() : value;
    if (!raw || typeof raw !== 'object')
        return null;
    const obj = raw;
    if (obj.mode !== 'GENERATED')
        return null;
    return obj;
}
async function loadPool(collegeId, courseId, moduleIds) {
    const rows = await db('quiz_bank_questions')
        .where({
        college_id: collegeId,
        course_id: courseId,
        is_active: true,
    })
        .whereIn('module_id', moduleIds)
        .whereIn('review_status', [...QUIZ_SELECTABLE_STATUSES])
        .select('id', 'course_id as courseId', 'module_id as moduleId', 'difficulty', 'normalized_text as fingerprint', 'review_status as reviewStatus', 'primary_co_code as primaryCoCode');
    return rows.map((r) => ({
        id: Number(r.id),
        courseId: Number(r.courseId),
        moduleId: Number(r.moduleId),
        difficulty: r.difficulty === 'MEDIUM'
            ? 'INTERMEDIATE'
            : r.difficulty === 'HARD'
                ? 'DIFFICULT'
                : r.difficulty,
        fingerprint: String(r.fingerprint || `id:${r.id}`),
        reviewStatus: String(r.reviewStatus),
        primaryCoCode: r.primaryCoCode ? String(r.primaryCoCode).toUpperCase() : null,
    }));
}
async function defaultTitle(courseId, moduleIds) {
    const course = await db('courses').where({ id: courseId }).first();
    const modules = await db('subject_modules').whereIn('id', moduleIds).orderBy('sort_order');
    const labels = modules.map((m) => {
        const match = String(m.name).match(/\b(Module|Unit)\s+(\d+)/i);
        return match ? `${match[1]} ${match[2]}` : m.name;
    });
    const subject = course?.name ?? 'Quiz';
    if (!labels.length)
        return `${subject} Quiz`;
    return `${subject} — ${labels.join(' & ')} Quiz`;
}
export async function generateQuiz(collegeId, createdBy, input) {
    await assertCourseInCollege(input.courseId, collegeId);
    for (const moduleId of input.moduleIds) {
        await assertModuleInCourse(moduleId, input.courseId, collegeId);
    }
    const criteria = {
        courseId: input.courseId,
        moduleIds: input.moduleIds,
        easyCount: input.easyCount,
        intermediateCount: input.intermediateCount,
        difficultCount: input.difficultCount,
        distribution: input.distribution,
    };
    const pool = await loadPool(collegeId, input.courseId, input.moduleIds);
    const selection = selectQuestions(pool, criteria);
    const title = input.title?.trim() || (await defaultTitle(input.courseId, input.moduleIds));
    const generation = {
        mode: 'GENERATED',
        courseId: input.courseId,
        moduleIds: input.moduleIds,
        easyCount: input.easyCount,
        intermediateCount: input.intermediateCount,
        difficultCount: input.difficultCount,
        distribution: input.distribution,
        marksPerQuestion: input.marksPerQuestion ?? 1,
        manuallyReplacedBankIds: [],
    };
    const quiz = await createQuiz(collegeId, createdBy, {
        title,
        description: input.description ?? null,
        instructions: input.instructions ?? null,
        courseId: input.courseId,
        moduleId: input.moduleIds.length === 1 ? input.moduleIds[0] : null,
        academicYearId: input.academicYearId ?? null,
        semesterId: input.semesterId ?? null,
        departmentId: input.departmentId ?? null,
        classSectionId: input.classSectionId ?? null,
        durationMinutes: input.durationMinutes ?? 20,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        attemptsAllowed: input.attemptsAllowed ?? 1,
        shuffleQuestions: input.shuffleQuestions ?? true,
        shuffleOptions: input.shuffleOptions ?? true,
        showScoreImmediately: input.showScoreImmediately ?? true,
        showCorrectAnswers: input.showCorrectAnswers ?? 'AFTER_END',
        showExplanation: input.showExplanation ?? true,
        passPercentage: input.passPercentage ?? 40,
        randomSelection: null,
    });
    await addFromBank(Number(quiz.id), collegeId, selection.selectedIds);
    if ((input.marksPerQuestion ?? 1) !== 1) {
        await db('quiz_questions')
            .where({ quiz_id: quiz.id })
            .update({ marks: input.marksPerQuestion ?? 1 });
    }
    await db('quizzes')
        .where({ id: quiz.id })
        .update({ random_selection: JSON.stringify(generation) });
    const detail = await getQuiz(Number(quiz.id), collegeId);
    return {
        ...detail,
        academicCoverage: detail.academicCoverage,
        generationNote: 'Default selection is module + difficulty. QUIZ ACADEMIC COVERAGE is reported; CO-balanced generation is optional and not mandatory in V1.',
    };
}
export async function regenerateQuizQuestions(quizId, collegeId, opts = {}) {
    const quiz = await getQuiz(quizId, collegeId);
    if (quiz.structureLocked) {
        throw new AppError(400, 'This quiz structure is locked because students have already started attempting it.');
    }
    const stored = parseGeneration(quiz.randomSelection);
    if (!stored)
        throw new AppError(400, 'This quiz was not created with Quick Generate');
    if (stored.manuallyReplacedBankIds.length && !opts.confirmManualReplacements) {
        throw new AppError(409, 'Some questions were replaced manually. Regenerating will discard those replacements.', { replacedCount: stored.manuallyReplacedBankIds.length }, 'NEEDS_CONFIRM');
    }
    const pool = await loadPool(collegeId, stored.courseId, stored.moduleIds);
    const selection = selectQuestions(pool, stored);
    const existing = await db('quiz_questions').where({ quiz_id: quizId }).select('id');
    for (const row of existing) {
        await deleteQuestion(quizId, collegeId, row.id);
    }
    await addFromBank(quizId, collegeId, selection.selectedIds);
    if (stored.marksPerQuestion !== 1) {
        await db('quiz_questions').where({ quiz_id: quizId }).update({ marks: stored.marksPerQuestion });
    }
    await db('quizzes')
        .where({ id: quizId })
        .update({
        random_selection: JSON.stringify({ ...stored, manuallyReplacedBankIds: [] }),
    });
    return getQuiz(quizId, collegeId);
}
export async function replaceQuizQuestion(quizId, collegeId, questionId, bankQuestionId) {
    const quiz = await getQuiz(quizId, collegeId);
    if (quiz.structureLocked) {
        throw new AppError(400, 'This quiz structure is locked because students have already started attempting it.');
    }
    const stored = parseGeneration(quiz.randomSelection);
    const current = quiz.questions.find((q) => q.id === questionId);
    if (!current)
        throw new AppError(404, 'Question not found on this quiz');
    const difficulty = (current.difficulty === 'MEDIUM'
        ? 'INTERMEDIATE'
        : current.difficulty === 'HARD'
            ? 'DIFFICULT'
            : current.difficulty);
    if (!difficulty || !QUIZ_DIFFICULTIES.includes(difficulty)) {
        throw new AppError(400, 'This question has no difficulty to preserve');
    }
    const usedBankIds = quiz.questions.map((q) => q.bankQuestionId).filter(Boolean);
    const moduleIds = stored?.moduleIds?.length
        ? stored.moduleIds
        : [...new Set(quiz.questions.map((q) => q.moduleId).filter(Boolean))];
    const courseId = Number(stored?.courseId ?? quiz.courseId);
    if (!Number.isFinite(courseId) || courseId < 1)
        throw new AppError(400, 'Quiz is missing a subject');
    const pool = await loadPool(collegeId, courseId, moduleIds);
    let nextId = bankQuestionId;
    if (nextId) {
        const candidate = pool.find((p) => p.id === nextId);
        if (!candidate) {
            throw new AppError(400, 'That question is not eligible for this quiz');
        }
        if (candidate.difficulty !== difficulty) {
            throw new AppError(400, 'Replacement must keep the same difficulty');
        }
        if (usedBankIds.includes(nextId) && nextId !== current.bankQuestionId) {
            throw new AppError(400, 'That question is already in this quiz');
        }
    }
    else {
        const picked = pickReplacement(pool, {
            courseId,
            moduleIds,
            difficulty,
            excludeIds: usedBankIds,
            preferredModuleId: current.moduleId ? Number(current.moduleId) : null,
            preferredPrimaryCo: current.primaryCoCode ?? null,
        });
        if (!picked) {
            throw new AppError(400, 'No unused question matching Module, Difficulty, and Primary CO (where possible) is available in the inventory.', {
                moduleId: current.moduleId,
                difficulty,
                primaryCoCode: current.primaryCoCode,
            }, 'INSUFFICIENT_INVENTORY');
        }
        nextId = picked.id;
    }
    if (nextId == null)
        throw new AppError(400, 'Could not select a replacement');
    const sortOrder = current.sortOrder ?? 0;
    await deleteQuestion(quizId, collegeId, questionId);
    await addFromBank(quizId, collegeId, [nextId]);
    const latest = await db('quiz_questions').where({ quiz_id: quizId, bank_question_id: nextId }).first();
    if (latest) {
        await db('quiz_questions').where({ id: latest.id }).update({
            sort_order: sortOrder,
            marks: stored?.marksPerQuestion ?? current.marks,
        });
    }
    if (stored) {
        await db('quizzes')
            .where({ id: quizId })
            .update({
            random_selection: JSON.stringify({
                ...stored,
                manuallyReplacedBankIds: [...new Set([...(stored.manuallyReplacedBankIds ?? []), nextId])],
            }),
        });
    }
    return getQuiz(quizId, collegeId);
}
export async function listReplacementCandidates(quizId, collegeId, questionId) {
    const quiz = await getQuiz(quizId, collegeId);
    const current = quiz.questions.find((q) => q.id === questionId);
    if (!current)
        throw new AppError(404, 'Question not found on this quiz');
    const stored = parseGeneration(quiz.randomSelection);
    const courseId = Number(stored?.courseId ?? quiz.courseId);
    const moduleIds = stored?.moduleIds?.length
        ? stored.moduleIds
        : [...new Set(quiz.questions.map((q) => q.moduleId).filter(Boolean))];
    if (!Number.isFinite(courseId) || courseId < 1)
        throw new AppError(400, 'Quiz is missing a subject');
    const used = new Set(quiz.questions.map((q) => q.bankQuestionId).filter(Boolean));
    const difficulty = current.difficulty === 'MEDIUM' ? 'INTERMEDIATE' : current.difficulty === 'HARD' ? 'DIFFICULT' : current.difficulty;
    const rows = await db('quiz_bank_questions as q')
        .join('subject_modules as m', 'm.id', 'q.module_id')
        .where({
        'q.college_id': collegeId,
        'q.course_id': courseId,
        'q.is_active': true,
        'q.difficulty': difficulty,
    })
        .whereIn('q.module_id', moduleIds)
        .whereIn('q.review_status', [...QUIZ_SELECTABLE_STATUSES])
        .select('q.id', 'q.question_text as questionText', 'q.difficulty', 'q.marks', 'q.primary_co_code as primaryCoCode', 'm.name as moduleName', 'q.module_id as moduleId')
        .orderBy('q.id', 'asc')
        .limit(200);
    const options = rows.length
        ? await db('quiz_bank_options').whereIn('question_id', rows.map((r) => r.id)).orderBy('sort_order')
        : [];
    const byQ = new Map();
    for (const opt of options) {
        const list = byQ.get(opt.question_id) ?? [];
        list.push(opt);
        byQ.set(opt.question_id, list);
    }
    const preferredCo = current.primaryCoCode ? String(current.primaryCoCode).toUpperCase() : null;
    return {
        preferredModuleId: current.moduleId,
        preferredDifficulty: difficulty,
        preferredPrimaryCo: preferredCo,
        questions: rows
            .filter((r) => !used.has(r.id))
            .map((r) => ({
            id: r.id,
            questionText: r.questionText,
            difficulty: r.difficulty,
            marks: Number(r.marks),
            moduleId: r.moduleId,
            moduleName: r.moduleName,
            primaryCoCode: r.primaryCoCode ? String(r.primaryCoCode).toUpperCase() : null,
            preservesCo: preferredCo
                ? String(r.primaryCoCode || '').toUpperCase() === preferredCo
                : true,
            options: (byQ.get(r.id) ?? []).map((o) => ({
                id: o.id,
                label: o.label,
                isCorrect: !!o.is_correct,
            })),
        })),
    };
}
export { CORRECT_ANSWER_VISIBILITY };
