import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../../middleware/auth.js';
import { assertInternalPaperAccess, type QpActor } from './access.js';
import * as lib from './service.js';
import * as internal from './internalService.js';
import * as textbooks from './textbookService.js';
import { persistQuestionSolution, refreshQuestionReadiness } from './solutionPipeline.js';
import { classifyLegacyQuestionSources } from './importService.js';
import { buildPrintModel, exportInternalPaperXlsx, filenameForPaper } from './exportService.js';

export const questionPapersRouter = Router();
questionPapersRouter.use(requireAuth);

function actorFrom(req: AuthedRequest): QpActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    role: req.user!.role,
    departmentId: req.user!.departmentId ?? null,
  };
}

questionPapersRouter.get(
  '/catalog',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lib.getCatalog(
        req.user!.collegeId,
        actorFrom(req),
        req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
      ),
    );
  }),
);

questionPapersRouter.get(
  '/library',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lib.listPapers(req.user!.collegeId, {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
        scheme: typeof req.query.scheme === 'string' ? req.query.scheme : undefined,
        semester: typeof req.query.semester === 'string' ? req.query.semester : undefined,
        program: typeof req.query.program === 'string' ? req.query.program : undefined,
        academicYear: typeof req.query.academicYear === 'string' ? req.query.academicYear : undefined,
        examType: typeof req.query.examType === 'string' ? req.query.examType : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
      }),
    );
  }),
);

questionPapersRouter.get(
  '/library/module-bank',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lib.listModuleBank(req.user!.collegeId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
        subject: typeof req.query.subject === 'string' ? req.query.subject : undefined,
      }),
    );
  }),
);

questionPapersRouter.get(
  '/library/questions',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lib.searchQuestions(req.user!.collegeId, {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        courseCode: typeof req.query.courseCode === 'string' ? req.query.courseCode : undefined,
        module: typeof req.query.module === 'string' ? req.query.module : undefined,
        co: typeof req.query.co === 'string' ? req.query.co : undefined,
        marks: req.query.marks ? Number(req.query.marks) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        difficulty: typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined,
        bloom: typeof req.query.bloom === 'string' ? req.query.bloom : undefined,
        repeated: req.query.repeated === '1' || req.query.repeated === 'true',
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      }),
    );
  }),
);

questionPapersRouter.get(
  '/library/questions/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ question: await lib.getQuestion(req.user!.collegeId, Number(req.params.id)) });
  }),
);

questionPapersRouter.get(
  '/library/analytics',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lib.frequencyAnalysis(req.user!.collegeId, req.query.courseId ? Number(req.query.courseId) : undefined));
  }),
);

questionPapersRouter.get(
  '/library/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lib.getPaper(req.user!.collegeId, Number(req.params.id)));
  }),
);

questionPapersRouter.get(
  '/internal',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await internal.listInternalPapers(actorFrom(req), {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        examType: typeof req.query.examType === 'string' ? req.query.examType : undefined,
      }),
    );
  }),
);

questionPapersRouter.get(
  '/internal/patterns',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ patterns: await internal.listPatterns(req.user!.collegeId) });
  }),
);

questionPapersRouter.post(
  '/internal/preview',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(internal.createInternalSchema, req.body);
    res.json(await internal.previewInternalContext(actorFrom(req), body));
  }),
);

questionPapersRouter.post(
  '/internal',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(internal.createInternalSchema, req.body);
    const created = await internal.createInternalPaper(actorFrom(req), body);
    res.status(201).json(created);
  }),
);

questionPapersRouter.patch(
  '/internal/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    const body = validate(internal.patchInternalSchema, req.body);
    res.json(await internal.patchInternalPaper(actorFrom(req), id, body));
  }),
);

questionPapersRouter.get(
  '/internal/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'read');
    res.json(await internal.getInternalPaper(id, req.user!.collegeId));
  }),
);

questionPapersRouter.get(
  '/internal/:id/eligible',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'read');
    res.json(await internal.listEligibleQuestions(actorFrom(req), id));
  }),
);

questionPapersRouter.post(
  '/internal/:id/generate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    const body = req.body?.mode || req.body?.includeOr != null ? validate(internal.generateInternalSchema, req.body || {}) : {};
    res.json(await internal.generateInternalPaper(actorFrom(req), id, undefined, body));
  }),
);

questionPapersRouter.post(
  '/internal/:id/schemes/generate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    res.json(await internal.generateSchemesAndSolutions(actorFrom(req), id));
  }),
);

questionPapersRouter.post(
  '/internal/:id/custom',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    const body = validate(internal.customQuestionSchema, req.body);
    res.json(await internal.addCustomQuestion(actorFrom(req), id, body));
  }),
);

questionPapersRouter.post(
  '/internal/:id/add',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    res.json(
      await internal.addExistingQuestion(actorFrom(req), id, {
        kind: req.body.kind,
        id: Number(req.body.id),
      }),
    );
  }),
);

questionPapersRouter.get(
  '/internal/:id/items/:itemId/replacements',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'read');
    res.json(await internal.listItemReplacements(actorFrom(req), id, Number(req.params.itemId)));
  }),
);

questionPapersRouter.post(
  '/internal/:id/items/:itemId/replace',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    res.json(
      await internal.replaceItem(actorFrom(req), id, Number(req.params.itemId), {
        kind: req.body?.kind,
        id: req.body?.id ? Number(req.body.id) : undefined,
      }),
    );
  }),
);

questionPapersRouter.post(
  '/internal/:id/items/:itemId/scheme',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    const body = validate(internal.itemSchemeSchema, req.body);
    res.json(await internal.setItemScheme(actorFrom(req), id, Number(req.params.itemId), body));
  }),
);

questionPapersRouter.delete(
  '/internal/:id/items/:itemId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    res.json(await internal.removeItem(actorFrom(req), id, Number(req.params.itemId)));
  }),
);

questionPapersRouter.post(
  '/internal/:id/finalize',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'mutate');
    res.json(await internal.finalizeInternalPaper(actorFrom(req), id));
  }),
);

questionPapersRouter.get(
  '/internal/:id/print-model',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'read');
    const variant = String(req.query.variant || 'PAPER').toUpperCase() as 'PAPER' | 'SCHEME' | 'MAPPING' | 'FACULTY' | 'SOLUTION' | 'PROVENANCE';
    res.json({ print: await buildPrintModel(id, req.user!.collegeId, variant) });
  }),
);

questionPapersRouter.get(
  '/internal/:id/export',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    await assertInternalPaperAccess(id, actorFrom(req), 'read');
    const detail = await internal.getInternalPaper(id, req.user!.collegeId);
    const wb = await exportInternalPaperXlsx(id, req.user!.collegeId);
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameForPaper(detail)}"`);
    res.send(Buffer.from(buf));
  }),
);

questionPapersRouter.get(
  '/admin/master',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lib.adminMaster(req.user!.collegeId));
  }),
);

questionPapersRouter.post(
  '/admin/master/classify',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await classifyLegacyQuestionSources(req.user!.collegeId));
  }),
);

questionPapersRouter.get(
  '/textbooks',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await textbooks.listTextbooks(req.user!.collegeId, req.query.courseId ? Number(req.query.courseId) : undefined));
  }),
);

questionPapersRouter.post(
  '/textbooks',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(textbooks.textbookSchema, req.body);
    const created = await textbooks.createTextbook(req.user!.collegeId, req.user!.facultyUserId, body);
    res.status(201).json({ textbook: created });
  }),
);

questionPapersRouter.get(
  '/textbooks/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ textbook: await textbooks.getTextbook(req.user!.collegeId, Number(req.params.id)) });
  }),
);

questionPapersRouter.patch(
  '/textbooks/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ textbook: await textbooks.updateTextbook(req.user!.collegeId, Number(req.params.id), req.body) });
  }),
);

questionPapersRouter.post(
  '/textbooks/:id/primary',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ textbook: await textbooks.markPrimary(req.user!.collegeId, Number(req.params.id)) });
  }),
);

questionPapersRouter.post(
  '/textbooks/:id/excerpts',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(textbooks.excerptSchema, req.body);
    res.status(201).json(await textbooks.addExcerpt(req.user!.collegeId, Number(req.params.id), body));
  }),
);

questionPapersRouter.post(
  '/library/questions/:id/enrich-solution',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const q = await lib.getQuestion(req.user!.collegeId, Number(req.params.id));
    const grounded = await persistQuestionSolution({
      collegeId: req.user!.collegeId,
      questionRowId: Number(req.params.id),
      courseId: q.paper.courseId ? Number(q.paper.courseId) : null,
      questionText: String(q.questionText),
      marks: q.maxMarks,
      rbt: q.rbtLevel || q.printedRbt,
      bloomLevel: q.bloomLevel,
    });
    const readiness = await refreshQuestionReadiness(Number(req.params.id));
    res.json({ solution: grounded, readiness });
  }),
);

questionPapersRouter.post(
  '/admin/master/import',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const report = await lib.adminReimport(req.user!.collegeId, req.user!.facultyUserId, Boolean(req.body?.dryRun));
    res.json({ summary: report });
  }),
);

questionPapersRouter.get(
  '/admin/monitoring',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await internal.listInternalPapers(actorFrom(req), {}));
  }),
);
