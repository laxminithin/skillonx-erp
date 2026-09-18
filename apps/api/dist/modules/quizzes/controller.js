import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertQuizAccessForActor } from './access.js';
import { recordQuizAudit } from './audit.js';
import * as quizzes from './service.js';
import * as analytics from './analyticsService.js';
import * as generator from './generatorService.js';
export const quizzesRouter = Router();
quizzesRouter.use(requireAuth);
function audit(req, quizId, action, metadata) {
    return recordQuizAudit({
        collegeId: req.user.collegeId,
        quizId,
        actorId: req.user.facultyUserId,
        actorName: req.user.name,
        action,
        metadata,
    });
}
quizzesRouter.get('/', asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const createdBy = isAdminRole(req.user.role) ? undefined : req.user.facultyUserId;
    const list = await quizzes.listQuizzes(req.user.collegeId, { status, createdBy });
    res.json({ quizzes: list });
}));
quizzesRouter.post('/', requirePermission('createSurvey'), asyncHandler(async (req, res) => {
    const body = validate(quizzes.quizMetaSchema, req.body);
    const quiz = await quizzes.createQuiz(req.user.collegeId, req.user.facultyUserId, body);
    await audit(req, Number(quiz.id), 'CREATED', { title: quiz.title });
    res.status(201).json({ quiz });
}));
quizzesRouter.post('/generate', requirePermission('createSurvey'), asyncHandler(async (req, res) => {
    const body = validate(generator.generateQuizSchema, req.body);
    const quiz = await generator.generateQuiz(req.user.collegeId, req.user.facultyUserId, body);
    await audit(req, Number(quiz.id), 'CREATED', { title: quiz.title, generated: true });
    res.status(201).json({ quiz });
}));
quizzesRouter.use('/:id', asyncHandler(async (req, _res, next) => {
    if (req.params.id === 'undefined' || Number.isNaN(Number(req.params.id))) {
        return next();
    }
    await assertQuizAccessForActor(Number(req.params.id), req.user);
    next();
}));
quizzesRouter.get('/:id', asyncHandler(async (req, res) => {
    const quiz = await quizzes.getQuiz(Number(req.params.id), req.user.collegeId);
    res.json({ quiz });
}));
quizzesRouter.patch('/:id', asyncHandler(async (req, res) => {
    const body = validate(quizzes.quizMetaSchema.partial(), req.body);
    const quiz = await quizzes.updateQuiz(Number(req.params.id), req.user.collegeId, body);
    if (body.startAt !== undefined || body.endAt !== undefined) {
        await audit(req, Number(req.params.id), 'SCHEDULE_CHANGED', {
            startAt: quiz.startAt,
            endAt: quiz.endAt,
        });
    }
    res.json({ quiz });
}));
quizzesRouter.delete('/:id', asyncHandler(async (req, res) => {
    const result = await quizzes.softDeleteQuiz(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'DELETED');
    res.json(result);
}));
quizzesRouter.post('/:id/questions', asyncHandler(async (req, res) => {
    const body = validate(quizzes.quizQuestionSchema, req.body);
    const quiz = await quizzes.addQuestion(Number(req.params.id), req.user.collegeId, body);
    await audit(req, Number(req.params.id), 'QUESTION_ADDED');
    res.status(201).json({ quiz });
}));
quizzesRouter.patch('/:id/questions/:questionId', asyncHandler(async (req, res) => {
    const body = validate(quizzes.quizQuestionSchema.partial(), req.body);
    const before = await quizzes.getQuiz(Number(req.params.id), req.user.collegeId);
    const quiz = await quizzes.updateQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId), body);
    if (body.options || body.numericAnswer !== undefined) {
        await audit(req, Number(req.params.id), 'ANSWER_KEY_CHANGED', {
            questionId: Number(req.params.questionId),
            previousLocked: before.structureLocked,
        });
    }
    res.json({ quiz });
}));
quizzesRouter.delete('/:id/questions/:questionId', asyncHandler(async (req, res) => {
    const quiz = await quizzes.deleteQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId));
    await audit(req, Number(req.params.id), 'QUESTION_REMOVED');
    res.json({ quiz });
}));
quizzesRouter.post('/:id/questions/from-bank', asyncHandler(async (req, res) => {
    const body = validate(z.object({ bankQuestionIds: z.array(z.number().int().positive()).min(1) }), req.body);
    const quiz = await quizzes.addFromBank(Number(req.params.id), req.user.collegeId, body.bankQuestionIds);
    res.json({ quiz });
}));
quizzesRouter.post('/:id/questions/random', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        selections: z.array(z.object({
            moduleId: z.number().int().positive(),
            count: z.number().int().positive().max(100),
        })),
    }), req.body);
    const quiz = await quizzes.addRandomFromBank(Number(req.params.id), req.user.collegeId, body.selections);
    res.json({ quiz });
}));
quizzesRouter.post('/:id/questions/:questionId/replace', asyncHandler(async (req, res) => {
    const body = validate(z.object({ bankQuestionId: z.number().int().positive().optional() }).optional().default({}), req.body ?? {});
    const quiz = await generator.replaceQuizQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId), body.bankQuestionId);
    await audit(req, Number(req.params.id), 'QUESTION_ADDED', { replaced: Number(req.params.questionId) });
    res.json({ quiz });
}));
quizzesRouter.get('/:id/questions/:questionId/replacements', asyncHandler(async (req, res) => {
    const data = await generator.listReplacementCandidates(Number(req.params.id), req.user.collegeId, Number(req.params.questionId));
    res.json(data);
}));
quizzesRouter.post('/:id/regenerate', asyncHandler(async (req, res) => {
    const body = validate(z.object({ confirmManualReplacements: z.boolean().optional() }).optional().default({}), req.body ?? {});
    const quiz = await generator.regenerateQuizQuestions(Number(req.params.id), req.user.collegeId, body);
    await audit(req, Number(req.params.id), 'QUESTION_ADDED', { regenerated: true });
    res.json({ quiz });
}));
quizzesRouter.post('/:id/reorder', asyncHandler(async (req, res) => {
    const body = validate(quizzes.reorderSchema, req.body);
    const quiz = await quizzes.reorderQuestions(Number(req.params.id), req.user.collegeId, body);
    res.json({ quiz });
}));
quizzesRouter.post('/:id/publish', requirePermission('publishSurvey'), asyncHandler(async (req, res) => {
    const result = await quizzes.publishQuiz(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'PUBLISHED', {
        effectiveStatus: result.quiz.effectiveStatus,
    });
    res.json(result);
}));
quizzesRouter.post('/:id/close', asyncHandler(async (req, res) => {
    const body = validate(z.object({ terminateActiveAttempts: z.boolean().optional() }).optional().default({}), req.body ?? {});
    const quiz = await quizzes.closeQuiz(Number(req.params.id), req.user.collegeId, body);
    await audit(req, Number(req.params.id), 'CLOSED', {
        terminateActiveAttempts: Boolean(body.terminateActiveAttempts),
    });
    res.json({ quiz });
}));
quizzesRouter.post('/:id/reopen', asyncHandler(async (req, res) => {
    const quiz = await quizzes.reopenQuiz(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'REOPENED');
    res.json({ quiz });
}));
quizzesRouter.post('/:id/extend', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        endAt: z.string().datetime(),
        reopen: z.boolean().optional(),
    }), req.body);
    const quiz = await quizzes.extendQuiz(Number(req.params.id), req.user.collegeId, body.endAt, {
        reopen: body.reopen,
    });
    await audit(req, Number(req.params.id), body.reopen ? 'REOPENED' : 'EXTENDED', { endAt: quiz.endAt });
    res.json({ quiz });
}));
quizzesRouter.post('/:id/archive', asyncHandler(async (req, res) => {
    const quiz = await quizzes.archiveQuiz(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'ARCHIVED');
    res.json({ quiz });
}));
quizzesRouter.post('/:id/duplicate', asyncHandler(async (req, res) => {
    const quiz = await quizzes.duplicateQuiz(Number(req.params.id), req.user.collegeId, req.user.facultyUserId);
    await audit(req, Number(quiz.id), 'DUPLICATED', { fromQuizId: Number(req.params.id) });
    res.status(201).json({ quiz });
}));
quizzesRouter.get('/:id/audit', asyncHandler(async (req, res) => {
    const events = await quizzes.getQuizAudit(Number(req.params.id), req.user.collegeId);
    res.json({ events });
}));
quizzesRouter.get('/:id/results', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await analytics.listResults(Number(req.params.id), req.user.collegeId);
    res.json(data);
}));
quizzesRouter.get('/:id/results/:token', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await analytics.getAttemptDetail(Number(req.params.id), req.user.collegeId, req.params.token);
    res.json(data);
}));
quizzesRouter.get('/:id/analytics', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await analytics.getQuizAnalytics(Number(req.params.id), req.user.collegeId);
    res.json(data);
}));
quizzesRouter.get('/:id/co-performance', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const { getQuizCoPerformance } = await import('../assignments/coPerformance.js');
    const data = await getQuizCoPerformance(Number(req.params.id), req.user.collegeId);
    res.json(data);
}));
quizzesRouter.get('/:id/export', requirePermission('exportReports'), asyncHandler(async (req, res) => {
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
    const file = await analytics.exportResults(Number(req.params.id), req.user.collegeId, format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
}));
