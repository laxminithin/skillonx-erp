import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { canManageOfficialMasters, canReviewMappings } from './access.js';
import * as masters from './masters.js';
import * as mapping from './mappingService.js';
import * as instances from './instanceService.js';
import * as importer from './importService.js';
import * as exporter from './exportService.js';
import * as analytics from './analytics.js';
import { isMappingKind } from './types.js';
import { ACADEMIC_MAPPING_TYPES, isAcademicMappingType } from './academicMappingTypes.js';
import { db } from '../../db/index.js';
export const copoRouter = Router();
copoRouter.use(requireAuth);
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
    };
}
function assertMaster(req) {
    if (!canManageOfficialMasters(req.user.role)) {
        throw new AppError(403, 'Official academic master data can only be changed by an administrator');
    }
}
function sendFile(res, file) {
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
}
copoRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json(await masters.catalog(req.user.collegeId));
}));
copoRouter.get('/schemes', asyncHandler(async (req, res) => {
    res.json({ schemes: await masters.listSchemes(req.user.collegeId) });
}));
copoRouter.post('/schemes', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.schemeSchema, req.body);
    res.status(201).json({ scheme: await masters.createScheme(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/schemes/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.schemeSchema.partial(), req.body);
    res.json({ scheme: await masters.updateScheme(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.get('/programs', asyncHandler(async (req, res) => {
    const schemeId = req.query.schemeId ? Number(req.query.schemeId) : undefined;
    res.json({ programs: await masters.listPrograms(req.user.collegeId, schemeId) });
}));
copoRouter.post('/programs', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.programSchema, req.body);
    res.status(201).json({ program: await masters.createProgram(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/programs/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.programSchema.partial(), req.body);
    res.json({ program: await masters.updateProgram(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.get('/subjects', asyncHandler(async (req, res) => {
    res.json({
        subjects: await masters.listSubjects(req.user.collegeId, {
            schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
            programId: req.query.programId ? Number(req.query.programId) : undefined,
            semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        }),
    });
}));
copoRouter.post('/subjects', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.subjectSchema, req.body);
    res.status(201).json({ subject: await masters.createSubject(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/subjects/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.subjectSchema.partial(), req.body);
    res.json({ subject: await masters.updateSubject(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.get('/course-outcomes', asyncHandler(async (req, res) => {
    const courseId = Number(req.query.courseId);
    if (!courseId)
        throw new AppError(400, 'courseId is required');
    res.json({
        outcomes: await masters.listCourseOutcomes(req.user.collegeId, courseId, req.query.history === '1'),
    });
}));
copoRouter.post('/course-outcomes', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.courseOutcomeSchema, req.body);
    res.status(201).json({ outcome: await masters.createCourseOutcome(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/course-outcomes/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(z.object({
        statement: z.string().min(8).max(4000).optional(),
        bloomsLevel: z.string().optional().nullable(),
        knowledgeLevel: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        sourcePage: z.string().optional().nullable(),
        mode: z.enum(['IN_PLACE', 'NEW_VERSION']).optional(),
    }), req.body);
    res.json({ outcome: await masters.updateCourseOutcome(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.get('/program-outcomes', asyncHandler(async (req, res) => {
    res.json({
        frameworks: await masters.listPoFrameworks(req.user.collegeId, req.query.schemeId ? Number(req.query.schemeId) : undefined),
    });
}));
copoRouter.post('/program-outcomes', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.programOutcomeSchema, req.body);
    res.status(201).json({ outcome: await masters.createProgramOutcome(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/program-outcomes/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.programOutcomeSchema.partial(), req.body);
    res.json({ outcome: await masters.updateProgramOutcome(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.get('/assignments', asyncHandler(async (req, res) => {
    if (!canManageOfficialMasters(req.user.role) && !canReviewMappings(req.user.role)) {
        throw new AppError(403, 'Not allowed');
    }
    res.json({
        assignments: await masters.listAssignments(req.user.collegeId, {
            facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
            courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        }),
    });
}));
copoRouter.post('/assignments', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.assignmentSchema, req.body);
    res.status(201).json({ assignment: await masters.createAssignment(req.user.collegeId, actor(req), body) });
}));
copoRouter.delete('/assignments/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    res.json(await masters.deleteAssignment(req.user.collegeId, Number(req.params.id), actor(req)));
}));
copoRouter.get('/operational-mappings', asyncHandler(async (req, res) => {
    const kind = typeof req.query.mappingKind === 'string' && ['PO', 'PSO', 'SDG', 'ALL'].includes(req.query.mappingKind)
        ? req.query.mappingKind
        : undefined;
    res.json(await instances.listInstances(actor(req), {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        mappingKind: kind,
        mappingType: isAcademicMappingType(req.query.mappingType) ? req.query.mappingType : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : req.query.subject ? Number(req.query.subject) : undefined,
    }));
}));
copoRouter.get('/academic-mappings', asyncHandler(async (req, res) => {
    res.json(await instances.listInstances(actor(req), {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        mappingKind: isMappingKind(req.query.mappingKind) ? req.query.mappingKind : req.query.mappingKind === 'ALL' ? 'ALL' : undefined,
        mappingType: isAcademicMappingType(req.query.mappingType) ? req.query.mappingType : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : req.query.subject ? Number(req.query.subject) : undefined,
    }));
}));
copoRouter.get('/academic-mappings/availability', asyncHandler(async (req, res) => {
    res.json(await instances.listSubjectAvailability(actor(req), {
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
    }));
}));
copoRouter.post('/operational-mappings/preview', asyncHandler(async (req, res) => {
    const body = validate(instances.createInstanceSchema, req.body);
    res.json(await instances.previewGeneration(actor(req), body));
}));
copoRouter.post('/academic-mappings/preview', asyncHandler(async (req, res) => {
    const body = validate(instances.createInstanceSchema, req.body);
    res.json(await instances.previewGeneration(actor(req), body));
}));
copoRouter.post('/operational-mappings', asyncHandler(async (req, res) => {
    const body = validate(instances.createInstanceSchema, req.body);
    res.status(201).json(await instances.createFromMaster(actor(req), body));
}));
copoRouter.post('/academic-mappings', asyncHandler(async (req, res) => {
    const body = validate(instances.createInstanceSchema, req.body);
    res.status(201).json(await instances.createFromMaster(actor(req), body));
}));
copoRouter.post('/academic-mappings/:id/upgrade', asyncHandler(async (req, res) => {
    const body = validate(z.object({ mappingType: z.enum(ACADEMIC_MAPPING_TYPES) }), req.body);
    res.json(await instances.upgradeMapping(actor(req), Number(req.params.id), body.mappingType));
}));
copoRouter.get('/academic-mappings/:id', asyncHandler(async (req, res) => {
    res.json(await instances.getInstance(actor(req), Number(req.params.id)));
}));
copoRouter.patch('/academic-mappings/:id/value', asyncHandler(async (req, res) => {
    const body = validate(instances.setValueSchema, req.body);
    res.json(await instances.updateValue(actor(req), Number(req.params.id), body));
}));
copoRouter.post('/academic-mappings/:id/save-draft', asyncHandler(async (req, res) => {
    res.json(await instances.saveDraft(actor(req), Number(req.params.id)));
}));
copoRouter.post('/academic-mappings/:id/reset', asyncHandler(async (req, res) => {
    const body = validate(z.object({ domain: z.enum(['PO', 'PSO', 'SDG']).optional() }), req.body ?? {});
    res.json(await instances.resetToMaster(actor(req), Number(req.params.id), body.domain));
}));
copoRouter.post('/academic-mappings/:id/finalize', asyncHandler(async (req, res) => {
    res.json(await instances.finalize(actor(req), Number(req.params.id)));
}));
copoRouter.delete('/academic-mappings/:id', asyncHandler(async (req, res) => {
    res.json(await instances.deleteInstance(actor(req), Number(req.params.id)));
}));
copoRouter.post('/academic-mappings/:id/show-all-sdgs', asyncHandler(async (req, res) => {
    const body = validate(z.object({ showAll: z.boolean() }), req.body);
    res.json(await instances.setShowAllSdgs(actor(req), Number(req.params.id), body.showAll));
}));
copoRouter.get('/operational-mappings/:id', asyncHandler(async (req, res) => {
    res.json(await instances.getInstance(actor(req), Number(req.params.id)));
}));
copoRouter.patch('/operational-mappings/:id/value', asyncHandler(async (req, res) => {
    const body = validate(instances.setValueSchema, req.body);
    res.json(await instances.updateValue(actor(req), Number(req.params.id), body));
}));
copoRouter.post('/operational-mappings/:id/save-draft', asyncHandler(async (req, res) => {
    res.json(await instances.saveDraft(actor(req), Number(req.params.id)));
}));
copoRouter.post('/operational-mappings/:id/reset', asyncHandler(async (req, res) => {
    const body = validate(z.object({ domain: z.enum(['PO', 'PSO', 'SDG']).optional() }), req.body ?? {});
    res.json(await instances.resetToMaster(actor(req), Number(req.params.id), body.domain));
}));
copoRouter.post('/operational-mappings/:id/finalize', asyncHandler(async (req, res) => {
    res.json(await instances.finalize(actor(req), Number(req.params.id)));
}));
copoRouter.delete('/operational-mappings/:id', asyncHandler(async (req, res) => {
    res.json(await instances.deleteInstance(actor(req), Number(req.params.id)));
}));
copoRouter.post('/operational-mappings/:id/show-all-sdgs', asyncHandler(async (req, res) => {
    const body = validate(z.object({ showAll: z.boolean() }), req.body);
    res.json(await instances.setShowAllSdgs(actor(req), Number(req.params.id), body.showAll));
}));
copoRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await mapping.listDashboard(actor(req), {
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
    }));
}));
copoRouter.get('/review-queue', asyncHandler(async (req, res) => {
    res.json(await mapping.listReviewQueue(actor(req), {
        mappingKind: typeof req.query.mappingKind === 'string' ? req.query.mappingKind : undefined,
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
    }));
}));
copoRouter.get('/workspace', asyncHandler(async (req, res) => {
    const query = validate(mapping.workspaceQuerySchema, {
        courseId: Number(req.query.courseId),
        programId: req.query.programId ? Number(req.query.programId) : null,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : null,
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : null,
        mappingKind: isMappingKind(req.query.kind) ? req.query.kind : isMappingKind(req.query.mappingKind) ? req.query.mappingKind : 'PO',
    });
    res.json(await mapping.getWorkspace(actor(req), query));
}));
copoRouter.post('/workspace', asyncHandler(async (req, res) => {
    const body = validate(mapping.workspaceQuerySchema, req.body);
    const version = await mapping.ensureDraftVersion(actor(req), body);
    res.status(201).json(await mapping.getWorkspaceByVersion(actor(req), Number(version.id)));
}));
copoRouter.get('/mappings/:id', asyncHandler(async (req, res) => {
    res.json(await mapping.getWorkspaceByVersion(actor(req), Number(req.params.id)));
}));
copoRouter.get('/mappings/:id/versions', asyncHandler(async (req, res) => {
    const ws = await mapping.getWorkspaceByVersion(actor(req), Number(req.params.id));
    res.json({ versions: await mapping.listVersions(actor(req), ws.course.id) });
}));
copoRouter.patch('/mappings/:id/cells', asyncHandler(async (req, res) => {
    const body = validate(mapping.cellSchema, req.body);
    res.json(await mapping.setCell(actor(req), Number(req.params.id), body));
}));
copoRouter.patch('/mappings/:id/justifications', asyncHandler(async (req, res) => {
    const body = validate(mapping.justificationSchema, req.body);
    res.json(await mapping.setJustification(actor(req), Number(req.params.id), body));
}));
copoRouter.post('/mappings/:id/justifications/bulk', asyncHandler(async (req, res) => {
    const body = validate(z.object({ items: z.array(mapping.justificationSchema) }), req.body);
    res.json(await mapping.bulkJustifications(actor(req), Number(req.params.id), body.items));
}));
copoRouter.post('/mappings/:id/submit', asyncHandler(async (req, res) => {
    res.json(await mapping.submitMapping(actor(req), Number(req.params.id)));
}));
copoRouter.post('/mappings/:id/return', asyncHandler(async (req, res) => {
    const body = validate(z.object({ comment: z.string().min(8).max(4000) }), req.body);
    res.json(await mapping.returnMapping(actor(req), Number(req.params.id), body.comment));
}));
copoRouter.post('/mappings/:id/approve', asyncHandler(async (req, res) => {
    const body = validate(z.object({ comment: z.string().max(4000).optional() }), req.body ?? {});
    res.json(await mapping.approveMapping(actor(req), Number(req.params.id), body.comment));
}));
copoRouter.post('/mappings/:id/reopen', asyncHandler(async (req, res) => {
    res.json(await mapping.reopenMapping(actor(req), Number(req.params.id)));
}));
copoRouter.get('/mappings/:id/copy-preview', asyncHandler(async (req, res) => {
    const ws = await mapping.getWorkspaceByVersion(actor(req), Number(req.params.id));
    res.json(await mapping.previewCopy(actor(req), ws.course.id, ws.academicYear?.id, ws.program?.id, ws.mappingKind));
}));
copoRouter.post('/mappings/:id/copy', asyncHandler(async (req, res) => {
    const body = validate(z.object({ fromVersionId: z.number().int().positive() }), req.body);
    res.json(await mapping.copyPrevious(actor(req), Number(req.params.id), body.fromVersionId));
}));
copoRouter.get('/mappings/:id/suggestions', asyncHandler(async (req, res) => {
    res.json(await mapping.suggestForVersion(actor(req), Number(req.params.id)));
}));
copoRouter.post('/mappings/:id/suggestions/accept', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        items: z.array(z.object({
            courseOutcomeId: z.number().int().positive(),
            programOutcomeId: z.number().int().positive().optional(),
            programSpecificOutcomeId: z.number().int().positive().optional(),
            sdgId: z.number().int().positive().optional(),
            strength: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        })),
    }), req.body);
    res.json(await mapping.acceptSuggestions(actor(req), Number(req.params.id), body.items));
}));
copoRouter.get('/mappings/:id/justification-draft', asyncHandler(async (req, res) => {
    const targetId = Number(req.query.targetId || req.query.programOutcomeId || req.query.programSpecificOutcomeId || req.query.sdgId);
    res.json(await mapping.justificationDraft(actor(req), Number(req.params.id), Number(req.query.courseOutcomeId), targetId));
}));
copoRouter.get('/coverage', asyncHandler(async (req, res) => {
    const schemeId = Number(req.query.schemeId);
    const programId = Number(req.query.programId);
    if (!schemeId || !programId)
        throw new AppError(400, 'schemeId and programId are required');
    res.json(await mapping.programCoverage(actor(req), schemeId, programId, req.query.academicYearId ? Number(req.query.academicYearId) : undefined));
}));
copoRouter.get('/blooms', asyncHandler(async (req, res) => {
    res.json(await mapping.bloomsDistribution(req.user.collegeId, {
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
    }));
}));
copoRouter.get('/audit', asyncHandler(async (req, res) => {
    if (!canReviewMappings(req.user.role) && !canManageOfficialMasters(req.user.role)) {
        throw new AppError(403, 'Not allowed');
    }
    res.json({
        events: await mapping.listAudit(req.user.collegeId, {
            courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
            mappingVersionId: req.query.mappingVersionId ? Number(req.query.mappingVersionId) : undefined,
        }),
    });
}));
copoRouter.post('/import/preview', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(importer.importPayloadSchema, req.body);
    res.json(await importer.previewImport(req.user.collegeId, actor(req), body));
}));
copoRouter.post('/import/commit', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(z.object({
        batchId: z.string().min(4),
        resolutions: z
            .array(z.object({
            courseId: z.number().int().positive(),
            coCode: z.string(),
            action: z.enum(['KEEP_EXISTING', 'CREATE_NEW_VERSION', 'REVIEW_LATER']),
        }))
            .optional(),
    }), req.body);
    res.json(await importer.commitImport(req.user.collegeId, actor(req), body.batchId, body.resolutions));
}));
copoRouter.post('/import/workbook/preview', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(z.object({
        fileName: z.string().min(1).max(255).default('VTU_CO_PO_MASTER.xlsx'),
        workbookBase64: z.string().min(24),
    }), req.body);
    const buffer = Buffer.from(body.workbookBase64, 'base64');
    res.json(await importer.previewWorkbookImport(req.user.collegeId, actor(req), buffer, body.fileName));
}));
copoRouter.post('/import/workbook/commit', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(z.object({
        batchId: z.string().min(4),
        resolutions: z
            .array(z.object({
            courseId: z.number().int().positive(),
            coCode: z.string(),
            action: z.enum(['KEEP_EXISTING', 'CREATE_NEW_VERSION', 'REVIEW_LATER']),
        }))
            .optional(),
    }), req.body);
    res.json(await importer.commitWorkbookImport(req.user.collegeId, actor(req), body.batchId, body.resolutions));
}));
copoRouter.get('/import/workbook/:batchId/errors.txt', asyncHandler(async (req, res) => {
    assertMaster(req);
    const batch = await db('syllabus_import_batches')
        .where({ college_id: req.user.collegeId, batch_id: req.params.batchId })
        .first();
    if (!batch)
        throw new AppError(404, 'Import preview not found');
    const preview = typeof batch.preview === 'string' ? JSON.parse(batch.preview) : batch.preview;
    const body = importer.workbookErrorReport(preview);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="CO-PO-import-errors-${req.params.batchId}.txt"`);
    res.send(body);
}));
copoRouter.get('/reports/:id/xlsx', asyncHandler(async (req, res) => {
    // Operational instances: creator-owned snapshot export.
    // Legacy workspace masters: falls back inside exportKindWorkbook.
    sendFile(res, await exporter.exportKindWorkbook(actor(req), Number(req.params.id)));
}));
copoRouter.get('/reports/coverage.xlsx', asyncHandler(async (req, res) => {
    const file = await exporter.exportCoverageWorkbook(actor(req), Number(req.query.schemeId), Number(req.query.programId), req.query.academicYearId ? Number(req.query.academicYearId) : undefined);
    sendFile(res, file);
}));
copoRouter.get('/reports/blooms.xlsx', asyncHandler(async (req, res) => {
    const file = await exporter.exportBloomsWorkbook(req.user.collegeId, req.query.schemeId ? Number(req.query.schemeId) : undefined, req.query.semesterId ? Number(req.query.semesterId) : undefined);
    sendFile(res, file);
}));
copoRouter.get('/program-specific-outcomes', asyncHandler(async (req, res) => {
    res.json({
        outcomes: await masters.listProgramSpecificOutcomes(req.user.collegeId, {
            schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
            programId: req.query.programId ? Number(req.query.programId) : undefined,
            history: req.query.history === '1',
        }),
    });
}));
copoRouter.post('/program-specific-outcomes', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.psoSchema, req.body);
    res.status(201).json({ outcome: await masters.createProgramSpecificOutcome(req.user.collegeId, actor(req), body) });
}));
copoRouter.patch('/program-specific-outcomes/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    const body = validate(masters.psoSchema.partial().extend({ mode: z.enum(['IN_PLACE', 'NEW_VERSION']).optional() }), req.body);
    res.json({ outcome: await masters.updateProgramSpecificOutcome(req.user.collegeId, Number(req.params.id), actor(req), body) });
}));
copoRouter.post('/program-specific-outcomes/:id/archive', asyncHandler(async (req, res) => {
    assertMaster(req);
    res.json({ outcome: await masters.archiveProgramSpecificOutcome(req.user.collegeId, Number(req.params.id), actor(req)) });
}));
copoRouter.delete('/program-specific-outcomes/:id', asyncHandler(async (req, res) => {
    assertMaster(req);
    res.json(await masters.deleteProgramSpecificOutcome(req.user.collegeId, Number(req.params.id), actor(req)));
}));
copoRouter.get('/program-specific-outcomes/:id/usage', asyncHandler(async (req, res) => {
    res.json(await masters.psoMappingUsage(req.user.collegeId, Number(req.params.id)));
}));
copoRouter.get('/program-specific-outcomes/:id/history', asyncHandler(async (req, res) => {
    const current = (await masters.listProgramSpecificOutcomes(req.user.collegeId, { history: true })).find((p) => p.id === Number(req.params.id));
    if (!current)
        throw new AppError(404, 'PSO not found');
    res.json({ outcomes: await masters.psoHistory(req.user.collegeId, current.schemeId, current.programId, current.code) });
}));
copoRouter.get('/sdgs', asyncHandler(async (req, res) => {
    res.json({ sdgs: await masters.listSdgs() });
}));
copoRouter.get('/outcome-workspace', asyncHandler(async (req, res) => {
    const query = validate(mapping.workspaceQuerySchema, {
        courseId: Number(req.query.courseId),
        programId: req.query.programId ? Number(req.query.programId) : null,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : null,
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : null,
    });
    res.json(await mapping.getUnifiedWorkspace(actor(req), query));
}));
copoRouter.post('/outcome-workspace/submit-all', asyncHandler(async (req, res) => {
    const body = validate(mapping.workspaceQuerySchema.extend({ confirm: z.boolean().optional() }), req.body);
    res.json(await mapping.submitAllOutcomeMappings(actor(req), body, Boolean(body.confirm)));
}));
copoRouter.patch('/mappings/:id/relevant-sdgs', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        sdgIds: z.array(z.number().int().positive()),
        showAll: z.boolean().optional(),
    }), req.body);
    res.json(await mapping.setRelevantSdgs(actor(req), Number(req.params.id), body.sdgIds, Boolean(body.showAll)));
}));
copoRouter.get('/coverage/pso', asyncHandler(async (req, res) => {
    res.json(await analytics.psoCoverage(actor(req), Number(req.query.schemeId), Number(req.query.programId), req.query.academicYearId ? Number(req.query.academicYearId) : undefined));
}));
copoRouter.get('/coverage/sdg', asyncHandler(async (req, res) => {
    res.json(await analytics.sdgCoverage(actor(req), {
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
    }));
}));
copoRouter.get('/coverage/sdg-semester', asyncHandler(async (req, res) => {
    res.json(await analytics.semesterSdgMap(actor(req), {
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
    }));
}));
copoRouter.get('/coverage/derived-po-sdg', asyncHandler(async (req, res) => {
    res.json(await analytics.derivedPoSdg(actor(req), Number(req.query.schemeId), Number(req.query.programId), req.query.academicYearId ? Number(req.query.academicYearId) : undefined));
}));
copoRouter.get('/coverage/derived-pso-sdg', asyncHandler(async (req, res) => {
    res.json(await analytics.derivedPsoSdg(actor(req), Number(req.query.schemeId), Number(req.query.programId), req.query.academicYearId ? Number(req.query.academicYearId) : undefined));
}));
copoRouter.get('/reports/pso-coverage.xlsx', asyncHandler(async (req, res) => {
    const file = await exporter.exportPsoCoverageWorkbook(actor(req), Number(req.query.schemeId), Number(req.query.programId), req.query.academicYearId ? Number(req.query.academicYearId) : undefined);
    sendFile(res, file);
}));
copoRouter.get('/reports/sdg-coverage.xlsx', asyncHandler(async (req, res) => {
    const file = await exporter.exportSdgCoverageWorkbook(actor(req), {
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
    });
    sendFile(res, file);
}));
copoRouter.get('/reports/alignment.xlsx', asyncHandler(async (req, res) => {
    const file = await exporter.exportAlignmentWorkbook(actor(req), {
        courseId: Number(req.query.courseId),
        programId: req.query.programId ? Number(req.query.programId) : null,
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : null,
        schemeId: req.query.schemeId ? Number(req.query.schemeId) : null,
    });
    sendFile(res, file);
}));
