import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertAssignmentAccessForActor } from './access.js';
import { recordAssignmentAudit } from './audit.js';
import * as assignments from './service.js';
import * as generator from './generatorService.js';
import { evaluateSubmissionSchema, evaluationZodToAppError } from './evaluation.js';
import { exportAssignment } from './exportService.js';
import { getAssignmentCoPerformance } from './coPerformance.js';
import { ZodError } from 'zod';
export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);
function audit(req, assignmentId, action, metadata) {
    return recordAssignmentAudit({
        collegeId: req.user.collegeId,
        assignmentId,
        actorId: req.user.facultyUserId,
        actorName: req.user.name,
        action,
        metadata,
    });
}
assignmentsRouter.get('/', asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const createdBy = isAdminRole(req.user.role) ? undefined : req.user.facultyUserId;
    const list = await assignments.listAssignments(req.user.collegeId, { status, createdBy });
    res.json({ assignments: list });
}));
assignmentsRouter.post('/', requirePermission('createSurvey'), asyncHandler(async (req, res) => {
    const body = validate(assignments.assignmentMetaSchema, req.body);
    const assignment = await assignments.createAssignment(req.user.collegeId, req.user.facultyUserId, body);
    await audit(req, Number(assignment.id), 'CREATED', { title: assignment.title });
    res.status(201).json({ assignment });
}));
assignmentsRouter.post('/generate', requirePermission('createSurvey'), asyncHandler(async (req, res) => {
    const body = validate(generator.generateAssignmentSchema, req.body);
    const assignment = await generator.generateAssignment(req.user.collegeId, req.user.facultyUserId, body);
    await audit(req, Number(assignment.id), 'CREATED', { title: assignment.title, generated: true });
    res.status(201).json({ assignment });
}));
assignmentsRouter.use('/:id', asyncHandler(async (req, _res, next) => {
    if (req.params.id === 'undefined' || Number.isNaN(Number(req.params.id))) {
        return next();
    }
    await assertAssignmentAccessForActor(Number(req.params.id), {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        role: req.user.role,
    });
    next();
}));
assignmentsRouter.get('/:id', asyncHandler(async (req, res) => {
    const assignment = await assignments.getAssignment(Number(req.params.id), req.user.collegeId);
    res.json({ assignment });
}));
assignmentsRouter.patch('/:id', asyncHandler(async (req, res) => {
    const body = validate(assignments.assignmentMetaSchema.partial(), req.body);
    const assignment = await assignments.updateAssignment(Number(req.params.id), req.user.collegeId, body);
    if (body.startAt !== undefined || body.dueAt !== undefined) {
        await audit(req, Number(req.params.id), 'SCHEDULE_CHANGED', {
            startAt: assignment.startAt,
            dueAt: assignment.dueAt,
        });
    }
    res.json({ assignment });
}));
assignmentsRouter.delete('/:id', asyncHandler(async (req, res) => {
    const result = await assignments.softDeleteAssignment(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'DELETED');
    res.json(result);
}));
assignmentsRouter.post('/:id/questions', asyncHandler(async (req, res) => {
    const body = validate(assignments.assignmentQuestionSchema, req.body);
    const assignment = await assignments.addQuestion(Number(req.params.id), req.user.collegeId, body);
    await audit(req, Number(req.params.id), 'QUESTION_ADDED');
    res.status(201).json({ assignment });
}));
assignmentsRouter.patch('/:id/questions/:questionId', asyncHandler(async (req, res) => {
    const body = validate(assignments.assignmentQuestionSchema.partial(), req.body);
    const assignment = await assignments.updateQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId), body);
    res.json({ assignment });
}));
assignmentsRouter.delete('/:id/questions/:questionId', asyncHandler(async (req, res) => {
    const assignment = await assignments.deleteQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId));
    await audit(req, Number(req.params.id), 'QUESTION_REMOVED');
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/questions/from-bank', asyncHandler(async (req, res) => {
    const body = validate(z.object({ bankQuestionIds: z.array(z.number().int().positive()).min(1) }), req.body);
    const assignment = await assignments.addFromBank(Number(req.params.id), req.user.collegeId, body.bankQuestionIds);
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/questions/:questionId/replace', asyncHandler(async (req, res) => {
    const assignment = await generator.replaceAssignmentQuestion(Number(req.params.id), req.user.collegeId, Number(req.params.questionId));
    await audit(req, Number(req.params.id), 'QUESTION_ADDED', {
        replaced: Number(req.params.questionId),
    });
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/reorder', asyncHandler(async (req, res) => {
    const body = validate(assignments.reorderSchema, req.body);
    const assignment = await assignments.reorderQuestions(Number(req.params.id), req.user.collegeId, body.questions);
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/publish', requirePermission('publishSurvey'), asyncHandler(async (req, res) => {
    const result = await assignments.publishAssignment(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'PUBLISHED', {
        effectiveStatus: result.assignment.effectiveStatus,
    });
    res.json(result);
}));
assignmentsRouter.post('/:id/close', asyncHandler(async (req, res) => {
    const assignment = await assignments.closeAssignment(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'CLOSED');
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/reopen', asyncHandler(async (req, res) => {
    const assignment = await assignments.reopenAssignment(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'REOPENED');
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/archive', asyncHandler(async (req, res) => {
    const assignment = await assignments.archiveAssignment(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'ARCHIVED');
    res.json({ assignment });
}));
assignmentsRouter.post('/:id/duplicate', asyncHandler(async (req, res) => {
    const assignment = await assignments.duplicateAssignment(Number(req.params.id), req.user.collegeId, req.user.facultyUserId);
    await audit(req, Number(assignment.id), 'DUPLICATED', {
        fromAssignmentId: Number(req.params.id),
    });
    res.status(201).json({ assignment });
}));
assignmentsRouter.post('/:id/release-solutions', asyncHandler(async (req, res) => {
    const assignment = await assignments.releaseSolutions(Number(req.params.id), req.user.collegeId);
    await audit(req, Number(req.params.id), 'RESULTS_RELEASED', { solutions: true });
    res.json({ assignment });
}));
assignmentsRouter.get('/:id/audit', asyncHandler(async (req, res) => {
    const events = await assignments.getAssignmentAudit(Number(req.params.id), req.user.collegeId);
    res.json({ events });
}));
assignmentsRouter.get('/:id/activity', asyncHandler(async (req, res) => {
    const events = await assignments.getAssignmentAudit(Number(req.params.id), req.user.collegeId);
    res.json({ events });
}));
assignmentsRouter.get('/:id/submissions', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await assignments.listSubmissions(Number(req.params.id), req.user.collegeId);
    res.json(data);
}));
assignmentsRouter.get('/:id/submissions/:token', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await assignments.getSubmissionDetail(Number(req.params.id), req.user.collegeId, req.params.token);
    res.json(data);
}));
assignmentsRouter.post('/:id/submissions/:token/evaluate', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    let body;
    try {
        body = evaluateSubmissionSchema.parse(req.body);
    }
    catch (err) {
        if (err instanceof ZodError)
            throw evaluationZodToAppError(err);
        throw err;
    }
    const data = await assignments.evaluateSubmission(Number(req.params.id), req.user.collegeId, req.params.token, req.user.facultyUserId, body);
    const auditAction = body.mode === 'RELEASE' || (body.mode === 'FINALIZE' && body.releaseResults)
        ? 'RESULTS_RELEASED'
        : 'EVALUATED';
    await audit(req, Number(req.params.id), auditAction, {
        submissionToken: req.params.token,
        mode: body.mode,
        releaseResults: body.releaseResults,
    });
    res.json(data);
}));
assignmentsRouter.post('/:id/submissions/:token/release-results', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await assignments.releaseSubmissionResults(Number(req.params.id), req.user.collegeId, req.params.token, req.user.facultyUserId);
    await audit(req, Number(req.params.id), 'RESULTS_RELEASED', {
        submissionToken: req.params.token,
    });
    res.json(data);
}));
assignmentsRouter.get('/:id/co-performance', requirePermission('viewResponses'), asyncHandler(async (req, res) => {
    const data = await getAssignmentCoPerformance(Number(req.params.id), req.user.collegeId);
    res.json(data);
}));
assignmentsRouter.get('/:id/print-model', asyncHandler(async (req, res) => {
    const model = await assignments.buildPrintModel(Number(req.params.id), req.user.collegeId);
    res.json({ printModel: model });
}));
assignmentsRouter.get('/:id/export', requirePermission('exportReports'), asyncHandler(async (req, res) => {
    const file = await exportAssignment(Number(req.params.id), req.user.collegeId, 'xlsx');
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
}));
