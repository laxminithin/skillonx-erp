import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertGapAnalysisAccess } from './access.js';
import * as gap from './service.js';
import { exportGapAnalysisXlsx, buildPrintModel } from './exportService.js';
import { importGapMaster } from './importService.js';
import { discoverGapMasterFiles } from './workbookParser.js';
export const gapAnalysisRouter = Router();
gapAnalysisRouter.use(requireAuth);
function actorFrom(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        role: req.user.role,
        departmentId: req.user.departmentId ?? null,
    };
}
gapAnalysisRouter.get('/', asyncHandler(async (req, res) => {
    const a = actorFrom(req);
    res.json(await gap.listAnalyses(a, {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
gapAnalysisRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json(await gap.getCatalog(req.user.collegeId));
}));
gapAnalysisRouter.post('/preview', asyncHandler(async (req, res) => {
    const body = validate(gap.createGapSchema, req.body);
    res.json(await gap.previewGeneration(actorFrom(req), body));
}));
gapAnalysisRouter.post('/', asyncHandler(async (req, res) => {
    const body = validate(gap.createGapSchema, req.body);
    const created = await gap.createFromMaster(actorFrom(req), body);
    res.status(201).json({ analysis: created });
}));
gapAnalysisRouter.get('/admin/monitoring', requireAdmin, asyncHandler(async (req, res) => {
    const a = actorFrom(req);
    res.json(await gap.listAnalyses(a, {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
gapAnalysisRouter.get('/admin/master', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await gap.listMasterGaps(req.user.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
    }));
}));
gapAnalysisRouter.post('/admin/master/import', requireAdmin, asyncHandler(async (req, res) => {
    const dryRun = Boolean(req.body?.dryRun);
    let buffer;
    let fileName = 'upload.xlsx';
    if (req.body?.workbookBase64) {
        buffer = Buffer.from(String(req.body.workbookBase64), 'base64');
        fileName = String(req.body.fileName || fileName);
    }
    else {
        const masters = await discoverGapMasterFiles();
        if (!masters.length)
            throw new AppError(404, 'No Gap master workbook found');
        buffer = await readFile(masters[0].filePath);
        fileName = masters[0].fileName;
    }
    const summary = await importGapMaster(req.user.collegeId, { facultyUserId: req.user.facultyUserId }, buffer, fileName, { dryRun });
    res.json({ summary });
}));
gapAnalysisRouter.param('id', async (req, _res, next, raw) => {
    try {
        const id = Number(raw);
        await assertGapAnalysisAccess(id, actorFrom(req), 'read');
        next();
    }
    catch (err) {
        next(err);
    }
});
gapAnalysisRouter.get('/:id', asyncHandler(async (req, res) => {
    res.json({ analysis: await gap.getAnalysis(Number(req.params.id), req.user.collegeId) });
}));
gapAnalysisRouter.get('/:id/print-model', asyncHandler(async (req, res) => {
    const analysis = await gap.getAnalysis(Number(req.params.id), req.user.collegeId);
    res.json({ print: buildPrintModel(analysis) });
}));
gapAnalysisRouter.get('/:id/audit', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'read');
    res.json(await gap.getAudit(Number(req.params.id), req.user.collegeId));
}));
gapAnalysisRouter.get('/:id/export', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'read');
    const file = await exportGapAnalysisXlsx(Number(req.params.id), req.user.collegeId);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
}));
gapAnalysisRouter.patch('/:id/items/:itemId/coverage', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.coverageSchema, req.body);
    res.json({
        analysis: await gap.updateCoverage(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
gapAnalysisRouter.patch('/:id/items/:itemId/applicability', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.applicabilitySchema, req.body);
    res.json({
        analysis: await gap.updateApplicability(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
gapAnalysisRouter.post('/:id/items/:itemId/actions', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.actionCreateSchema, req.body);
    res.status(201).json({
        analysis: await gap.addAction(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
gapAnalysisRouter.patch('/:id/actions/:actionId', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.actionUpdateSchema, req.body);
    res.json({
        analysis: await gap.updateAction(Number(req.params.id), Number(req.params.actionId), actorFrom(req), body),
    });
}));
gapAnalysisRouter.post('/:id/evidence', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.evidenceSchema, req.body);
    res.status(201).json({ analysis: await gap.addEvidence(Number(req.params.id), actorFrom(req), body) });
}));
gapAnalysisRouter.post('/:id/actions/:actionId/evidence', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.evidenceSchema, {
        ...req.body,
        actionId: Number(req.params.actionId),
    });
    res.status(201).json({ analysis: await gap.addEvidence(Number(req.params.id), actorFrom(req), body) });
}));
gapAnalysisRouter.get('/:id/evidence/:evidenceId/download', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'read');
    const { db } = await import('../../db/index.js');
    const row = await db('gap_evidence')
        .where({
        id: Number(req.params.evidenceId),
        analysis_id: Number(req.params.id),
        college_id: req.user.collegeId,
    })
        .first();
    if (!row?.storage_key)
        throw new AppError(404, 'Evidence file not found');
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/gap-evidence');
    const full = path.join(root, String(row.storage_key));
    if (!full.startsWith(root))
        throw new AppError(404, 'Evidence file not found');
    const buf = await readFile(full);
    res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${row.file_name || 'evidence'}"`);
    res.send(buf);
}));
gapAnalysisRouter.post('/:id/items/:itemId/close', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    const body = validate(gap.closeGapSchema, req.body);
    res.json({
        analysis: await gap.closeGap(Number(req.params.id), Number(req.params.itemId), actorFrom(req), body),
    });
}));
gapAnalysisRouter.post('/:id/items/:itemId/reopen', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ analysis: await gap.reopenGap(Number(req.params.id), Number(req.params.itemId), actorFrom(req)) });
}));
gapAnalysisRouter.post('/:id/complete', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ analysis: await gap.completeAnalysis(Number(req.params.id), actorFrom(req)) });
}));
gapAnalysisRouter.post('/:id/archive', asyncHandler(async (req, res) => {
    await assertGapAnalysisAccess(Number(req.params.id), actorFrom(req), 'mutate');
    res.json({ analysis: await gap.archiveAnalysis(Number(req.params.id), actorFrom(req)) });
}));
void isAdminRole;
