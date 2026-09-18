import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { assertCoEvaluationAccess } from './access.js';
import * as coEval from './service.js';
import { exportCoEvaluationXlsx, buildPrintModel } from './exportService.js';
import { importCoEvalMaster } from './importService.js';
import { discoverCoEvalMasterFiles } from './workbookParser.js';
export const coEvaluationRouter = Router();
coEvaluationRouter.use(requireAuth);
function actorFrom(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        role: req.user.role,
        departmentId: req.user.departmentId ?? null,
    };
}
coEvaluationRouter.get('/', asyncHandler(async (req, res) => {
    const a = actorFrom(req);
    res.json(await coEval.listEvaluations(a, {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
coEvaluationRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json(await coEval.getCatalog(req.user.collegeId));
}));
coEvaluationRouter.post('/preview', asyncHandler(async (req, res) => {
    const body = validate(coEval.createCoEvalSchema, req.body);
    res.json(await coEval.previewGeneration(actorFrom(req), body));
}));
coEvaluationRouter.post('/', asyncHandler(async (req, res) => {
    const body = validate(coEval.createCoEvalSchema, req.body);
    const created = await coEval.createFromMaster(actorFrom(req), body);
    res.status(201).json({ evaluation: created });
}));
coEvaluationRouter.get('/admin/monitoring', requireAdmin, asyncHandler(async (req, res) => {
    const a = actorFrom(req);
    res.json(await coEval.listEvaluations(a, {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
coEvaluationRouter.get('/admin/master', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await coEval.listMasterSubjects(req.user.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
    }));
}));
coEvaluationRouter.post('/admin/master/import', requireAdmin, asyncHandler(async (req, res) => {
    const dryRun = Boolean(req.body?.dryRun);
    let buffer;
    let fileName = 'upload.xlsx';
    if (req.body?.workbookBase64) {
        buffer = Buffer.from(String(req.body.workbookBase64), 'base64');
        fileName = String(req.body.fileName || fileName);
    }
    else {
        const masters = await discoverCoEvalMasterFiles();
        if (!masters.length)
            throw new AppError(404, 'No CO Evaluation master workbook found');
        buffer = await readFile(masters[0].filePath);
        fileName = masters[0].fileName;
    }
    const summary = await importCoEvalMaster(req.user.collegeId, { facultyUserId: req.user.facultyUserId }, buffer, fileName, { dryRun });
    res.json({ summary });
}));
coEvaluationRouter.param('id', async (req, _res, next, raw) => {
    try {
        const id = Number(raw);
        await assertCoEvaluationAccess(id, actorFrom(req), 'read');
        next();
    }
    catch (err) {
        next(err);
    }
});
coEvaluationRouter.get('/:id', asyncHandler(async (req, res) => {
    res.json({ evaluation: await coEval.getEvaluation(Number(req.params.id), req.user.collegeId) });
}));
coEvaluationRouter.get('/:id/print-model', asyncHandler(async (req, res) => {
    const evaluation = await coEval.getEvaluation(Number(req.params.id), req.user.collegeId);
    res.json({ print: buildPrintModel(evaluation) });
}));
coEvaluationRouter.get('/:id/audit', asyncHandler(async (req, res) => {
    res.json(await coEval.getAudit(Number(req.params.id), req.user.collegeId));
}));
coEvaluationRouter.get('/:id/export', asyncHandler(async (req, res) => {
    const evaluation = await coEval.getEvaluation(Number(req.params.id), req.user.collegeId);
    const { buffer, fileName } = await exportCoEvaluationXlsx(evaluation);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
}));
coEvaluationRouter.patch('/:id/cells/:cellId', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(coEval.cellUpdateSchema, req.body);
    const evaluation = await coEval.updateCell(actorFrom(req), Number(req.params.id), Number(req.params.cellId), body);
    res.json({ evaluation });
}));
coEvaluationRouter.patch('/:id/cos/:coRowId/percent', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(coEval.percentUpdateSchema, req.body);
    const evaluation = await coEval.updateEvaluationPercent(actorFrom(req), Number(req.params.id), Number(req.params.coRowId), body);
    res.json({ evaluation });
}));
coEvaluationRouter.post('/:id/reset', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ evaluation: await coEval.resetToStandard(actorFrom(req), Number(req.params.id)) });
}));
coEvaluationRouter.post('/:id/cells/:cellId/reset', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({
        evaluation: await coEval.resetCell(actorFrom(req), Number(req.params.id), Number(req.params.cellId)),
    });
}));
coEvaluationRouter.post('/:id/save-draft', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ evaluation: await coEval.saveDraft(actorFrom(req), Number(req.params.id)) });
}));
coEvaluationRouter.post('/:id/finalize', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ evaluation: await coEval.finalizeEvaluation(actorFrom(req), Number(req.params.id)) });
}));
coEvaluationRouter.post('/:id/reopen', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ evaluation: await coEval.reopenEvaluation(actorFrom(req), Number(req.params.id)) });
}));
coEvaluationRouter.post('/:id/archive', asyncHandler(async (req, res) => {
    await assertCoEvaluationAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ evaluation: await coEval.archiveEvaluation(actorFrom(req), Number(req.params.id)) });
}));
