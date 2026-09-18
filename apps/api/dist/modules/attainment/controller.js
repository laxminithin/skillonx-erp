import { Router } from 'express';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { assertCycleAccess, assertRunAccess, assertSheetAccess } from './access.js';
import * as svc from './service.js';
import * as marks from './marksService.js';
import { buildPrintModel, exportAttainmentXlsx } from './exportService.js';
import { listAttainmentAudit } from './audit.js';
import { CI_STATES } from './types.js';
export const attainmentRouter = Router();
attainmentRouter.use(requireAuth);
function actorFrom(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        role: req.user.role,
        departmentId: req.user.departmentId ?? null,
    };
}
attainmentRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json(await svc.getCatalog(req.user.collegeId));
}));
attainmentRouter.get('/libraries', asyncHandler(async (_req, res) => {
    res.json(await svc.listLibraries());
}));
attainmentRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await svc.dashboard(actorFrom(req)));
}));
attainmentRouter.get('/programme', asyncHandler(async (req, res) => {
    res.json(await svc.programmeHealth(actorFrom(req)));
}));
attainmentRouter.get('/runs', asyncHandler(async (req, res) => {
    res.json(await svc.listRuns(actorFrom(req), {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
    }));
}));
attainmentRouter.post('/preview', asyncHandler(async (req, res) => {
    const body = validate(svc.calculateSchema, req.body);
    res.json(await svc.previewCalculation(actorFrom(req), body));
}));
attainmentRouter.post('/calculate', asyncHandler(async (req, res) => {
    const body = validate(svc.calculateSchema, req.body);
    const result = await svc.commitCalculation(actorFrom(req), body);
    res.status(201).json(result);
}));
attainmentRouter.get('/reports/8.1.1', asyncHandler(async (req, res) => {
    res.json(await svc.nba811(actorFrom(req), req.query.courseId ? Number(req.query.courseId) : undefined));
}));
attainmentRouter.get('/reports/8.1.2', asyncHandler(async (req, res) => {
    res.json(await svc.nba812(actorFrom(req)));
}));
attainmentRouter.get('/admin/monitoring', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await svc.programmeHealth(actorFrom(req)));
}));
attainmentRouter.get('/sheets', asyncHandler(async (req, res) => {
    res.json(await marks.listSheets(actorFrom(req), req.query.courseId ? Number(req.query.courseId) : undefined));
}));
attainmentRouter.post('/sheets', asyncHandler(async (req, res) => {
    const body = validate(marks.createSheetSchema, req.body);
    const created = await marks.createSheet(actorFrom(req), body);
    res.status(201).json(created);
}));
attainmentRouter.post('/sheets/from-paper/:paperId', asyncHandler(async (req, res) => {
    res.status(201).json(await marks.createSheetFromInternalPaper(actorFrom(req), Number(req.params.paperId)));
}));
attainmentRouter.param('sheetId', async (req, _res, next, raw) => {
    try {
        await assertSheetAccess(Number(raw), actorFrom(req), req.method === 'GET' ? 'read' : 'mutate');
        next();
    }
    catch (err) {
        next(err);
    }
});
attainmentRouter.get('/sheets/:sheetId', asyncHandler(async (req, res) => {
    res.json(await marks.getSheet(Number(req.params.sheetId), req.user.collegeId));
}));
attainmentRouter.get('/sheets/:sheetId/template', asyncHandler(async (req, res) => {
    const file = await marks.marksTemplate(Number(req.params.sheetId), req.user.collegeId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
}));
attainmentRouter.get('/sheets/:sheetId/export', asyncHandler(async (req, res) => {
    const file = await marks.exportMarksSheet(Number(req.params.sheetId), req.user.collegeId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
}));
attainmentRouter.post('/sheets/:sheetId/import/preview', asyncHandler(async (req, res) => {
    if (!req.body?.workbookBase64)
        throw new AppError(400, 'workbookBase64 is required');
    res.json(await marks.previewMarksImport(actorFrom(req), Number(req.params.sheetId), String(req.body.workbookBase64)));
}));
attainmentRouter.post('/sheets/:sheetId/import', asyncHandler(async (req, res) => {
    if (!req.body?.workbookBase64)
        throw new AppError(400, 'workbookBase64 is required');
    res.json(await marks.commitMarksImport(actorFrom(req), Number(req.params.sheetId), String(req.body.workbookBase64)));
}));
attainmentRouter.post('/sheets/:sheetId/marks', asyncHandler(async (req, res) => {
    const body = validate(marks.manualMarksSchema, req.body);
    res.json(await marks.upsertManualMarks(actorFrom(req), Number(req.params.sheetId), body));
}));
attainmentRouter.post('/sheets/:sheetId/freeze', asyncHandler(async (req, res) => {
    res.json(await marks.freezeSheet(actorFrom(req), Number(req.params.sheetId)));
}));
attainmentRouter.param('id', async (req, _res, next, raw) => {
    try {
        await assertRunAccess(Number(raw), actorFrom(req), 'read');
        next();
    }
    catch (err) {
        next(err);
    }
});
attainmentRouter.get('/runs/:id', asyncHandler(async (req, res) => {
    res.json(await svc.getRunDetail(Number(req.params.id), req.user.collegeId, typeof req.query.co === 'string' ? req.query.co : undefined));
}));
attainmentRouter.get('/runs/:id/audit', asyncHandler(async (req, res) => {
    res.json({ events: await listAttainmentAudit(req.user.collegeId, { runId: Number(req.params.id) }) });
}));
attainmentRouter.get('/runs/:id/print-model', asyncHandler(async (req, res) => {
    const detail = await svc.getRunDetail(Number(req.params.id), req.user.collegeId);
    const kind = typeof req.query.kind === 'string' ? req.query.kind : 'CO ATTAINMENT REPORT';
    const nba = kind.includes('8.1.1')
        ? await svc.nba811(actorFrom(req), detail.run.courseId)
        : kind.includes('8.1.2')
            ? await svc.nba812(actorFrom(req))
            : null;
    res.json(buildPrintModel(detail, { kind, nba }));
}));
attainmentRouter.get('/runs/:id/export', asyncHandler(async (req, res) => {
    const detail = await svc.getRunDetail(Number(req.params.id), req.user.collegeId);
    const nba811 = await svc.nba811(actorFrom(req), detail.run.courseId);
    const nba812 = await svc.nba812(actorFrom(req));
    const buf = await exportAttainmentXlsx(detail, { nba811, nba812 });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${detail.run.courseCode || 'attainment'}-obe.xlsx"`);
    res.send(buf);
}));
attainmentRouter.param('cycleId', async (req, _res, next, raw) => {
    try {
        const review = req.path.includes('/transition');
        const mutate = req.method !== 'GET';
        await assertCycleAccess(Number(raw), actorFrom(req), review ? 'review' : mutate ? 'mutate' : 'read');
        next();
    }
    catch (err) {
        next(err);
    }
});
attainmentRouter.get('/cycles/:cycleId', asyncHandler(async (req, res) => {
    res.json(await svc.getCycle(Number(req.params.cycleId), req.user.collegeId));
}));
attainmentRouter.post('/cycles/:cycleId/plan', asyncHandler(async (req, res) => {
    const body = validate(svc.planSchema, req.body);
    res.json(await svc.acceptPlan(actorFrom(req), Number(req.params.cycleId), body));
}));
attainmentRouter.post('/cycles/:cycleId/transition', asyncHandler(async (req, res) => {
    const to = String(req.body?.to || '');
    if (!CI_STATES.includes(to))
        throw new AppError(400, 'Invalid state');
    res.json(await svc.transitionCycle(actorFrom(req), Number(req.params.cycleId), to, req.body?.comment));
}));
attainmentRouter.patch('/cycles/:cycleId/evidence', asyncHandler(async (req, res) => {
    const body = validate(svc.evidencePatchSchema, req.body);
    res.json(await svc.patchEvidence(actorFrom(req), Number(req.params.cycleId), body));
}));
attainmentRouter.post('/cycles/:cycleId/reassess', asyncHandler(async (req, res) => {
    const body = validate(svc.reassessSchema, req.body);
    res.json(await svc.recordReassessment(actorFrom(req), Number(req.params.cycleId), body));
}));
attainmentRouter.get('/surveys/:surveyId/co-links', asyncHandler(async (req, res) => {
    res.json(await svc.getSurveyIndirectLinks(actorFrom(req), Number(req.params.surveyId)));
}));
attainmentRouter.put('/surveys/:surveyId/co-links', asyncHandler(async (req, res) => {
    const body = validate(svc.surveyLinksSchema, req.body);
    res.json(await svc.saveSurveyIndirectLinks(actorFrom(req), Number(req.params.surveyId), body));
}));
