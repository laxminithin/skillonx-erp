import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireAdmin, type AuthedRequest } from '../../middleware/auth.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertLessonPlanAccess } from './access.js';
import * as lessonPlans from './service.js';
import { exportLessonPlanXlsx } from './exportService.js';

export const lessonPlansRouter = Router();
lessonPlansRouter.use(requireAuth);

lessonPlansRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const createdBy = isAdminRole(req.user!.role) ? undefined : req.user!.facultyUserId;
    const plans = await lessonPlans.listPlans(req.user!.collegeId, {
      createdBy,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
    });
    res.json({ plans });
  }),
);

lessonPlansRouter.get(
  '/today',
  asyncHandler(async (req: AuthedRequest, res) => {
    const lessons = await lessonPlans.todayLessons(req.user!.collegeId, req.user!.facultyUserId);
    res.json({ lessons });
  }),
);

lessonPlansRouter.get(
  '/catalog',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.catalog(req.user!.collegeId));
  }),
);

lessonPlansRouter.get(
  '/catalog/:courseId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.catalogSubject(req.user!.collegeId, Number(req.params.courseId)));
  }),
);

lessonPlansRouter.get(
  '/calendars',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ calendars: await lessonPlans.listCalendars(req.user!.collegeId) });
  }),
);

lessonPlansRouter.post(
  '/preview',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.createPlanSchema, req.body);
    res.json(await lessonPlans.previewGenerate(req.user!.collegeId, body));
  }),
);

lessonPlansRouter.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.createPlanSchema, req.body);
    const created = await lessonPlans.createAndGenerate(req.user!.collegeId, req.user!.facultyUserId, body);
    res.status(201).json({ plan: await lessonPlans.getPlan(created.id, req.user!.collegeId) });
  }),
);

lessonPlansRouter.get(
  '/admin/plans',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const plans = await lessonPlans.listPlans(req.user!.collegeId, {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
      departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
      facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
      semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
      sectionId: req.query.sectionId ? Number(req.query.sectionId) : undefined,
    });
    res.json({ plans });
  }),
);

lessonPlansRouter.get(
  '/admin/master',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.catalog(req.user!.collegeId));
  }),
);

lessonPlansRouter.get(
  '/admin/master/:courseId',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.catalogSubject(req.user!.collegeId, Number(req.params.courseId)));
  }),
);

lessonPlansRouter.patch(
  '/admin/subtopics/:id',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(
      z.object({
        name: z.string().min(1).max(2000).optional(),
        suggestedHours: z.number().positive().max(8).optional(),
        notes: z.string().max(4000).optional().nullable(),
        classification: z.enum(['CORE', 'SUPPLEMENTARY']).optional(),
      }),
      req.body,
    );
    res.json(await lessonPlans.updateMasterSubtopic(req.user!.collegeId, Number(req.params.id), body));
  }),
);

lessonPlansRouter.get(
  '/admin/calendars',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ calendars: await lessonPlans.listCalendars(req.user!.collegeId) });
  }),
);

lessonPlansRouter.post(
  '/admin/calendars',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.calendarSchema, req.body);
    res.status(201).json(await lessonPlans.createCalendar(req.user!.collegeId, body));
  }),
);

lessonPlansRouter.patch(
  '/admin/calendars/:id',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.calendarSchema.partial(), req.body);
    res.json(await lessonPlans.updateCalendar(req.user!.collegeId, Number(req.params.id), body));
  }),
);

lessonPlansRouter.post(
  '/admin/calendars/:id/exceptions',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.exceptionSchema, req.body);
    res.json(await lessonPlans.addException(req.user!.collegeId, Number(req.params.id), body));
  }),
);

lessonPlansRouter.delete(
  '/admin/calendars/:id/exceptions/:exceptionId',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lessonPlans.deleteException(req.user!.collegeId, Number(req.params.id), Number(req.params.exceptionId)),
    );
  }),
);

lessonPlansRouter.use(
  '/:id',
  asyncHandler(async (req: AuthedRequest, _res, next) => {
    if (
      req.params.id === 'admin' ||
      req.params.id === 'catalog' ||
      req.params.id === 'today' ||
      req.params.id === 'calendars' ||
      req.params.id === 'preview'
    ) {
      return next();
    }
    if (Number.isNaN(Number(req.params.id))) return next();
    await assertLessonPlanAccess(Number(req.params.id), req.user!);
    next();
  }),
);

lessonPlansRouter.get(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.getPlan(Number(req.params.id), req.user!.collegeId));
  }),
);

lessonPlansRouter.get(
  '/:id/export',
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = await exportLessonPlanXlsx(Number(req.params.id), req.user!.collegeId);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }),
);

lessonPlansRouter.post(
  '/:id/archive',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.archivePlan(Number(req.params.id), req.user!.collegeId, req.user!.facultyUserId));
  }),
);

lessonPlansRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lessonPlans.deletePlan(Number(req.params.id), req.user!.collegeId, req.user!.facultyUserId));
  }),
);

lessonPlansRouter.post(
  '/:id/entries',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.addEntrySchema, req.body);
    res.status(201).json(
      await lessonPlans.addEntry(Number(req.params.id), req.user!.collegeId, req.user!.facultyUserId, body),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/complete',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.completeSchema, req.body ?? {});
    res.json(
      await lessonPlans.completeEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        body,
      ),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/reschedule',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.rescheduleSchema, req.body);
    res.json(
      await lessonPlans.rescheduleEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        body,
      ),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/skip',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lessonPlans.skipEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        typeof req.body?.remarks === 'string' ? req.body.remarks : undefined,
      ),
    );
  }),
);

lessonPlansRouter.patch(
  '/:id/entries/:entryId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.editEntrySchema, req.body);
    res.json(
      await lessonPlans.editEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        body,
      ),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/split',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(lessonPlans.splitSchema, req.body);
    res.json(
      await lessonPlans.splitEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        body,
      ),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/merge',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(z.object({ otherEntryId: z.number().int().positive() }), req.body);
    res.json(
      await lessonPlans.mergeEntries(
        Number(req.params.id),
        Number(req.params.entryId),
        body.otherEntryId,
        req.user!.collegeId,
        req.user!.facultyUserId,
      ),
    );
  }),
);

lessonPlansRouter.post(
  '/:id/entries/:entryId/move',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(z.object({ direction: z.enum(['up', 'down']) }), req.body);
    res.json(
      await lessonPlans.moveEntry(
        Number(req.params.id),
        Number(req.params.entryId),
        req.user!.collegeId,
        req.user!.facultyUserId,
        body.direction,
      ),
    );
  }),
);
