import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import { isAdminRole } from '../../utils/permissions.js';
import * as surveys from './service.js';
import { recordSurveyAudit, type SurveyAuditAction } from './audit.js';
import { assertSurveyAccessForActor } from './access.js';

export const surveysRouter = Router();
surveysRouter.use(requireAuth);

// Ownership/scope gate: every survey-scoped route (`/:id...`) must belong to
// the caller — their own survey, or any institution survey for admins.
surveysRouter.use(
  '/:id',
  asyncHandler(async (req: AuthedRequest, _res, next) => {
    await assertSurveyAccessForActor(Number(req.params.id), req.user!);
    next();
  }),
);

function audit(
  req: AuthedRequest,
  surveyId: number,
  action: SurveyAuditAction,
  metadata?: Record<string, unknown>,
) {
  return recordSurveyAudit({
    collegeId: req.user!.collegeId,
    surveyId,
    actorId: req.user!.facultyUserId,
    actorName: req.user!.name,
    action,
    metadata,
  });
}

surveysRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    // Non-admin faculty see only the surveys they created (My Surveys).
    const createdBy = isAdminRole(req.user!.role) ? undefined : req.user!.facultyUserId;
    const list = await surveys.listSurveys(req.user!.collegeId, { status, createdBy });
    res.json({ surveys: list });
  }),
);

surveysRouter.post(
  '/',
  requirePermission('createSurvey'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.surveyMetaSchema, req.body);
    const survey = await surveys.createSurvey(req.user!.collegeId, req.user!.facultyUserId, body);
    await audit(req, Number(survey.id), 'CREATED', { title: survey.title });
    res.status(201).json({ survey });
  }),
);

surveysRouter.get(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.getSurvey(Number(req.params.id), req.user!.collegeId);
    res.json({ survey });
  }),
);

surveysRouter.patch(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.surveyMetaSchema.partial(), req.body);
    const survey = await surveys.updateSurvey(Number(req.params.id), req.user!.collegeId, body);
    if (body.startAt !== undefined || body.endAt !== undefined) {
      await audit(req, Number(req.params.id), 'SCHEDULE_CHANGED', {
        startAt: survey.startAt,
        endAt: survey.endAt,
      });
    }
    res.json({ survey });
  }),
);

surveysRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await surveys.softDeleteSurvey(Number(req.params.id), req.user!.collegeId);
    await audit(req, Number(req.params.id), 'DELETED');
    res.json(result);
  }),
);

surveysRouter.post(
  '/:id/sections',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.sectionSchema, req.body);
    const section = await surveys.addSection(Number(req.params.id), req.user!.collegeId, body);
    res.status(201).json({ section });
  }),
);

surveysRouter.patch(
  '/:id/sections/:sectionId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.sectionSchema.partial(), req.body);
    const section = await surveys.updateSection(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.sectionId),
      body,
    );
    res.json({ section });
  }),
);

surveysRouter.delete(
  '/:id/sections/:sectionId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await surveys.deleteSection(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.sectionId),
    );
    res.json(result);
  }),
);

surveysRouter.post(
  '/:id/questions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.questionSchema, req.body);
    const survey = await surveys.addQuestion(Number(req.params.id), req.user!.collegeId, body);
    res.status(201).json({ survey });
  }),
);

surveysRouter.patch(
  '/:id/questions/:questionId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.questionSchema.partial(), req.body);
    const survey = await surveys.updateQuestion(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.questionId),
      body,
    );
    res.json({ survey });
  }),
);

surveysRouter.delete(
  '/:id/questions/:questionId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await surveys.deleteQuestion(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.questionId),
    );
    res.json(result);
  }),
);

surveysRouter.post(
  '/:id/questions/from-bank',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(
      z.object({
        sectionId: z.number().int().positive(),
        bankItemIds: z.array(z.number().int().positive()).min(1),
      }),
      req.body,
    );
    const survey = await surveys.addFromQuestionBank(
      Number(req.params.id),
      req.user!.collegeId,
      body.sectionId,
      body.bankItemIds,
    );
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/questions/:questionId/duplicate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.duplicateQuestion(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.questionId),
    );
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/reorder',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(surveys.reorderSchema, req.body);
    const survey = await surveys.reorderSurvey(Number(req.params.id), req.user!.collegeId, body);
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/publish',
  requirePermission('publishSurvey'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await surveys.publishSurvey(Number(req.params.id), req.user!.collegeId);
    await audit(req, Number(req.params.id), 'PUBLISHED', {
      effectiveStatus: result.survey.effectiveStatus,
    });
    res.json(result);
  }),
);

surveysRouter.post(
  '/:id/close',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.closeSurvey(Number(req.params.id), req.user!.collegeId);
    await audit(req, Number(req.params.id), 'CLOSED');
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.reopenSurvey(Number(req.params.id), req.user!.collegeId);
    await audit(req, Number(req.params.id), 'REOPENED');
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/extend',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(
      z.object({
        endAt: z.string().datetime().optional(),
        days: z.number().int().positive().max(365).optional(),
        reopen: z.boolean().optional(),
      }),
      req.body,
    );
    const survey = body.endAt
      ? await surveys.extendSurvey(Number(req.params.id), req.user!.collegeId, body.endAt, {
          reopen: body.reopen,
        })
      : await surveys.extendSurveyByDays(
          Number(req.params.id),
          req.user!.collegeId,
          body.days ?? 14,
          { reopen: body.reopen },
        );
    await audit(req, Number(req.params.id), body.reopen ? 'REOPENED' : 'EXTENDED', {
      endAt: survey.endAt,
      reopen: Boolean(body.reopen),
    });
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/archive',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.archiveSurvey(Number(req.params.id), req.user!.collegeId);
    await audit(req, Number(req.params.id), 'ARCHIVED');
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const survey = await surveys.duplicateSurvey(
      Number(req.params.id),
      req.user!.collegeId,
      req.user!.facultyUserId,
    );
    await audit(req, Number(survey.id), 'DUPLICATED', { fromSurveyId: Number(req.params.id) });
    res.status(201).json({ survey });
  }),
);

surveysRouter.get(
  '/:id/audit',
  asyncHandler(async (req: AuthedRequest, res) => {
    const events = await surveys.getSurveyAudit(Number(req.params.id), req.user!.collegeId);
    res.json({ events });
  }),
);
