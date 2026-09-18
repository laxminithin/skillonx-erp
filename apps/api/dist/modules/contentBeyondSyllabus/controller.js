import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { assertCbsPlanAccess } from './access.js';
import * as cbs from './service.js';
import { exportCbsPlanXlsx, buildPrintModel } from './exportService.js';
import { importCbsMaster } from './importService.js';
import { discoverCbsMasterFiles } from './workbookParser.js';
export const contentBeyondSyllabusRouter = Router();
contentBeyondSyllabusRouter.use(requireAuth);
function actorFrom(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        role: req.user.role,
        departmentId: req.user.departmentId ?? null,
    };
}
contentBeyondSyllabusRouter.get('/', asyncHandler(async (req, res) => {
    const a = actorFrom(req);
    res.json(await cbs.listPlans(a, {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
contentBeyondSyllabusRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json(await cbs.getCatalog(req.user.collegeId));
}));
contentBeyondSyllabusRouter.post('/preview', asyncHandler(async (req, res) => {
    const body = validate(cbs.createPlanSchema, req.body);
    res.json(await cbs.previewGeneration(actorFrom(req), body));
}));
contentBeyondSyllabusRouter.post('/', asyncHandler(async (req, res) => {
    const body = validate(cbs.createPlanSchema, req.body);
    const created = body.allowEmptyCustom
        ? await cbs.createEmptyCustomPlan(actorFrom(req), body)
        : await cbs.createFromMaster(actorFrom(req), body);
    res.status(201).json({ plan: created });
}));
contentBeyondSyllabusRouter.post('/from-gap', asyncHandler(async (req, res) => {
    const body = validate(cbs.fromGapSchema, req.body);
    res.json(await cbs.addFromGap(actorFrom(req), body));
}));
contentBeyondSyllabusRouter.get('/admin/monitoring', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await cbs.listPlans(actorFrom(req), {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
contentBeyondSyllabusRouter.get('/admin/master', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await cbs.listMasterRecommendations(req.user.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
    }));
}));
contentBeyondSyllabusRouter.post('/admin/master/import', requireAdmin, asyncHandler(async (req, res) => {
    const dryRun = Boolean(req.body?.dryRun);
    let buffer;
    let fileName = 'upload.xlsx';
    if (req.body?.workbookBase64) {
        buffer = Buffer.from(String(req.body.workbookBase64), 'base64');
        fileName = String(req.body.fileName || fileName);
    }
    else {
        const masters = await discoverCbsMasterFiles();
        if (!masters.length)
            throw new AppError(404, 'No Beyond-Syllabus master workbook found');
        buffer = await readFile(masters[0].filePath);
        fileName = masters[0].fileName;
    }
    const summary = await importCbsMaster(req.user.collegeId, { facultyUserId: req.user.facultyUserId }, buffer, fileName, { dryRun });
    res.json({ summary });
}));
contentBeyondSyllabusRouter.param('id', async (req, _res, next, raw) => {
    try {
        const id = Number(raw);
        await assertCbsPlanAccess(id, actorFrom(req), 'read');
        next();
    }
    catch (err) {
        next(err);
    }
});
contentBeyondSyllabusRouter.get('/:id', asyncHandler(async (req, res) => {
    res.json({ plan: await cbs.getPlan(Number(req.params.id), req.user.collegeId) });
}));
contentBeyondSyllabusRouter.get('/:id/print-model', asyncHandler(async (req, res) => {
    const plan = await cbs.getPlan(Number(req.params.id), req.user.collegeId);
    res.json({ print: buildPrintModel(plan) });
}));
contentBeyondSyllabusRouter.get('/:id/audit', asyncHandler(async (req, res) => {
    res.json(await cbs.getAudit(Number(req.params.id), req.user.collegeId));
}));
contentBeyondSyllabusRouter.get('/:id/export', asyncHandler(async (req, res) => {
    const file = await exportCbsPlanXlsx(Number(req.params.id), req.user.collegeId);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
}));
contentBeyondSyllabusRouter.post('/:id/items', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    if (req.body?.cbsIds) {
        const body = validate(cbs.recommendedItemsSchema, req.body);
        res.json({ plan: await cbs.addRecommendedItems(Number(req.params.id), actorFrom(req), body) });
        return;
    }
    const body = validate(cbs.customItemSchema, req.body);
    res.json({ plan: await cbs.addCustomItem(Number(req.params.id), actorFrom(req), body) });
}));
contentBeyondSyllabusRouter.patch('/:id/items/:itemId', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.updateItemSchema, req.body);
    res.json({
        plan: await cbs.updateItem(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
contentBeyondSyllabusRouter.post('/:id/items/:itemId/deliver', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.deliverSchema, req.body);
    res.json({
        plan: await cbs.markDelivered(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
contentBeyondSyllabusRouter.post('/:id/items/:itemId/complete', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.completeSchema, req.body);
    res.json({
        plan: await cbs.completeItem(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
contentBeyondSyllabusRouter.post('/:id/items/:itemId/evidence', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.evidenceSchema, { ...req.body, itemId: Number(req.params.itemId) });
    res.json({ plan: await cbs.addEvidence(Number(req.params.id), actorFrom(req), body) });
}));
contentBeyondSyllabusRouter.post('/:id/items/:itemId/link-quiz', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.linkQuizSchema, req.body);
    res.json({
        plan: await cbs.linkQuiz(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
contentBeyondSyllabusRouter.post('/:id/items/:itemId/link-assignment', asyncHandler(async (req, res) => {
    await assertCbsPlanAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(cbs.linkAssignmentSchema, req.body);
    res.json({
        plan: await cbs.linkAssignment(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
contentBeyondSyllabusRouter.get('/:id/items/:itemId/quiz-prefill', asyncHandler(async (req, res) => {
    res.json(await cbs.quizPrefill(Number(req.params.id), Number(req.params.itemId), req.user.collegeId));
}));
contentBeyondSyllabusRouter.get('/:id/items/:itemId/assignment-prefill', asyncHandler(async (req, res) => {
    res.json(await cbs.assignmentPrefill(Number(req.params.id), Number(req.params.itemId), req.user.collegeId));
}));
