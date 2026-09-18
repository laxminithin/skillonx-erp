import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import * as bank from './bankService.js';
import { scanQuestionFiles } from './importService.js';
import { applyQuestionBankImport } from './importApply.js';
export const quizBankRouter = Router();
quizBankRouter.use(requireAuth);
quizBankRouter.use(requirePermission('manageQuestionBank'));
quizBankRouter.get('/overview', asyncHandler(async (req, res) => {
    const data = await bank.bankOverview(req.user.collegeId);
    res.json(data);
}));
quizBankRouter.get('/modules', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const modules = await bank.listModules(req.user.collegeId, courseId);
    res.json({ modules });
}));
quizBankRouter.post('/modules', asyncHandler(async (req, res) => {
    const body = validate(bank.moduleSchema, req.body);
    const module = await bank.createModule(req.user.collegeId, req.user.facultyUserId, body);
    res.status(201).json({ module });
}));
quizBankRouter.patch('/modules/:id', asyncHandler(async (req, res) => {
    const body = validate(bank.moduleSchema.partial(), req.body);
    const module = await bank.updateModule(req.user.collegeId, Number(req.params.id), body);
    res.json({ module });
}));
quizBankRouter.delete('/modules/:id', asyncHandler(async (req, res) => {
    const result = await bank.deleteModule(req.user.collegeId, Number(req.params.id));
    res.json(result);
}));
quizBankRouter.get('/questions', asyncHandler(async (req, res) => {
    const data = await bank.listBankQuestions(req.user.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        moduleId: req.query.moduleId ? Number(req.query.moduleId) : undefined,
        questionType: typeof req.query.questionType === 'string' ? req.query.questionType : undefined,
        difficulty: typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined,
        reviewStatus: typeof req.query.reviewStatus === 'string' ? req.query.reviewStatus : undefined,
        coCode: typeof req.query.coCode === 'string' ? req.query.coCode : undefined,
        verificationStatus: typeof req.query.verificationStatus === 'string' ? req.query.verificationStatus : undefined,
        needsCoReview: req.query.needsCoReview === '1' || req.query.needsCoReview === 'true',
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    });
    res.json(data);
}));
quizBankRouter.post('/questions', asyncHandler(async (req, res) => {
    const body = validate(bank.bankQuestionSchema, req.body);
    const question = await bank.createBankQuestion(req.user.collegeId, req.user.facultyUserId, body, {
        allowNeedsReview: true,
    });
    res.status(201).json({ question });
}));
quizBankRouter.get('/questions/:id', asyncHandler(async (req, res) => {
    const question = await bank.getBankQuestion(req.user.collegeId, Number(req.params.id));
    res.json({ question });
}));
quizBankRouter.patch('/questions/:id', asyncHandler(async (req, res) => {
    const body = validate(bank.bankQuestionSchema.partial(), req.body);
    const { question } = await bank.updateBankQuestion(req.user.collegeId, Number(req.params.id), body);
    res.json({ question });
}));
quizBankRouter.delete('/questions/:id', asyncHandler(async (req, res) => {
    const result = await bank.deleteBankQuestion(req.user.collegeId, Number(req.params.id));
    res.json(result);
}));
quizBankRouter.get('/inventory', asyncHandler(async (req, res) => {
    const courseId = Number(req.query.courseId);
    if (!courseId) {
        res.json({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 }, byModule: {} });
        return;
    }
    const moduleIds = typeof req.query.moduleIds === 'string' && req.query.moduleIds.trim()
        ? req.query.moduleIds.split(',').map(Number).filter(Boolean)
        : undefined;
    const data = await bank.bankInventory(req.user.collegeId, { courseId, moduleIds });
    res.json(data);
}));
quizBankRouter.get('/needs-review', asyncHandler(async (req, res) => {
    const data = await bank.listNeedsReview(req.user.collegeId);
    res.json(data);
}));
quizBankRouter.get('/co-qa-report', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const data = await bank.coMappingQaReport(req.user.collegeId, courseId);
    res.json(data);
}));
quizBankRouter.post('/co-mapping-pass', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        courseId: z.number().int().positive().optional(),
        force: z.boolean().optional(),
        dryRun: z.boolean().optional(),
    }), req.body ?? {});
    const { runQuizCoMappingPass } = await import('../questions/quizCoMappingPass.js');
    const report = await runQuizCoMappingPass({
        collegeId: req.user.collegeId,
        courseId: body.courseId,
        force: body.force,
        dryRun: body.dryRun,
    });
    res.json(report);
}));
quizBankRouter.get('/import/scan', asyncHandler(async (_req, res) => {
    const report = await scanQuestionFiles();
    res.json({
        rootsInspected: report.rootsInspected,
        filesDiscovered: report.filesDiscovered,
        subjectsDetected: report.subjectsDetected,
        modulesDetected: report.modulesDetected,
        questionsFound: report.questionsFound,
        validQuestions: report.validQuestions,
        needsReview: report.needsReview,
        missingAnswerKeys: report.missingAnswerKeys,
        duplicates: report.duplicates,
        skippedFiles: report.skippedFiles,
        candidates: report.candidates,
    });
}));
quizBankRouter.post('/import/commit', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        courseId: z.number().int().positive(),
        questions: z.array(z.object({
            key: z.string(),
            moduleId: z.number().int().positive(),
            questionText: z.string().min(1),
            questionType: z.enum(['SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'NUMERIC', 'SHORT_ANSWER']),
            options: z.array(z.object({ label: z.string(), isCorrect: z.boolean() })),
            numericAnswer: z.number().finite().optional().nullable(),
            numericTolerance: z.number().min(0).optional().nullable(),
            marks: z.number().positive().optional(),
            explanation: z.string().optional().nullable(),
            difficulty: z.enum(['EASY', 'INTERMEDIATE', 'DIFFICULT']).optional().nullable(),
            source: z.string().optional().nullable(),
            importNeedsReview: z.boolean().optional(),
        })),
    }), req.body);
    const imported = [];
    const skipped = [];
    for (const q of body.questions) {
        try {
            const created = await bank.createBankQuestion(req.user.collegeId, req.user.facultyUserId, {
                courseId: body.courseId,
                moduleId: q.moduleId,
                questionText: q.questionText,
                questionType: q.questionType,
                marks: q.marks ?? 1,
                difficulty: q.difficulty ?? null,
                explanation: q.explanation ?? null,
                source: q.source ?? 'public-import',
                numericAnswer: q.numericAnswer ?? null,
                numericTolerance: q.numericTolerance ?? 0,
                options: q.options,
                reviewStatus: q.importNeedsReview ? 'NEEDS_REVIEW' : undefined,
            }, { allowNeedsReview: true });
            imported.push({ key: q.key, id: created.id, reviewStatus: created.reviewStatus });
        }
        catch (err) {
            skipped.push({
                key: q.key,
                reason: err instanceof Error ? err.message : 'Import failed',
            });
        }
    }
    res.json({
        importedCount: imported.length,
        skippedCount: skipped.length,
        imported,
        skipped,
    });
}));
quizBankRouter.post('/import/apply', asyncHandler(async (req, res) => {
    const body = validate(z
        .object({
        createMissingSubjects: z.boolean().optional(),
        dryRun: z.boolean().optional(),
    })
        .optional()
        .default({}), req.body ?? {});
    const report = await applyQuestionBankImport({
        collegeId: req.user.collegeId,
        createdBy: req.user.facultyUserId,
        createMissingSubjects: body.createMissingSubjects,
        dryRun: body.dryRun,
    });
    res.json(report);
}));
