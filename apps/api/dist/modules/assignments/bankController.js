import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import * as bank from './bankService.js';
export const assignmentBankRouter = Router();
assignmentBankRouter.use(requireAuth);
assignmentBankRouter.use(requirePermission('manageQuestionBank'));
assignmentBankRouter.get('/overview', asyncHandler(async (req, res) => {
    const data = await bank.bankOverview(req.user.collegeId);
    res.json(data);
}));
assignmentBankRouter.get('/modules', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const modules = await bank.listModules(req.user.collegeId, courseId);
    res.json({ modules });
}));
assignmentBankRouter.post('/modules', asyncHandler(async (req, res) => {
    const body = validate(bank.moduleSchema, req.body);
    const module = await bank.createModule(req.user.collegeId, req.user.facultyUserId, body);
    res.status(201).json({ module });
}));
assignmentBankRouter.patch('/modules/:id', asyncHandler(async (req, res) => {
    const body = validate(bank.moduleSchema.partial(), req.body);
    const module = await bank.updateModule(req.user.collegeId, Number(req.params.id), body);
    res.json({ module });
}));
assignmentBankRouter.delete('/modules/:id', asyncHandler(async (req, res) => {
    const result = await bank.deleteModule(req.user.collegeId, Number(req.params.id));
    res.json(result);
}));
assignmentBankRouter.get('/questions', asyncHandler(async (req, res) => {
    const data = await bank.listBankQuestions(req.user.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        moduleId: req.query.moduleId ? Number(req.query.moduleId) : undefined,
        questionType: typeof req.query.questionType === 'string' ? req.query.questionType : undefined,
        difficulty: typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined,
        coCode: typeof req.query.coCode === 'string' ? req.query.coCode : undefined,
        reviewStatus: typeof req.query.reviewStatus === 'string' ? req.query.reviewStatus : undefined,
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    });
    res.json(data);
}));
assignmentBankRouter.get('/questions/:id', asyncHandler(async (req, res) => {
    const question = await bank.getBankQuestion(Number(req.params.id), req.user.collegeId);
    res.json({ question });
}));
assignmentBankRouter.post('/questions', asyncHandler(async (req, res) => {
    const body = validate(bank.bankQuestionSchema, req.body);
    const question = await bank.createBankQuestion(req.user.collegeId, req.user.facultyUserId, body, {
        allowNeedsReview: true,
    });
    res.status(201).json({ question });
}));
assignmentBankRouter.patch('/questions/:id', asyncHandler(async (req, res) => {
    const body = validate(bank.bankQuestionSchema.partial(), req.body);
    const { question } = await bank.updateBankQuestion(req.user.collegeId, Number(req.params.id), body);
    res.json({ question });
}));
assignmentBankRouter.delete('/questions/:id', asyncHandler(async (req, res) => {
    const result = await bank.deleteBankQuestion(req.user.collegeId, Number(req.params.id));
    res.json(result);
}));
assignmentBankRouter.get('/inventory', asyncHandler(async (req, res) => {
    const courseId = Number(req.query.courseId);
    if (!courseId) {
        res.json({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 }, byModule: {}, modules: [] });
        return;
    }
    const moduleIds = typeof req.query.moduleIds === 'string' && req.query.moduleIds.trim()
        ? req.query.moduleIds.split(',').map(Number).filter(Boolean)
        : undefined;
    const data = await bank.bankInventory(req.user.collegeId, { courseId, moduleIds });
    res.json(data);
}));
assignmentBankRouter.get('/needs-review', asyncHandler(async (req, res) => {
    const data = await bank.listNeedsReview(req.user.collegeId);
    res.json(data);
}));
