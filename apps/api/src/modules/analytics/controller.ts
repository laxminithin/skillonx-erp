import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import * as analytics from './service.js';
import { assertSurveyAccessForActor } from '../surveys/access.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

// Response/analytics/export access follows the same ownership rules as the
// survey itself — a faculty member can never read or export another
// faculty member's responses by guessing the survey id.
analyticsRouter.use(
  '/surveys/:id',
  asyncHandler(async (req: AuthedRequest, _res, next) => {
    await assertSurveyAccessForActor(Number(req.params.id), req.user!);
    next();
  }),
);

analyticsRouter.get(
  '/surveys/:id/responses',
  requirePermission('viewResponses'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = await analytics.listResponses(Number(req.params.id), req.user!.collegeId);
    res.json(data);
  }),
);

analyticsRouter.get(
  '/surveys/:id/responses/:submissionId',
  requirePermission('viewResponses'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = await analytics.getResponseDetail(
      Number(req.params.id),
      req.user!.collegeId,
      Number(req.params.submissionId),
    );
    res.json(data);
  }),
);

analyticsRouter.get(
  '/surveys/:id/analytics',
  requirePermission('viewResponses'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = await analytics.getAnalytics(Number(req.params.id), req.user!.collegeId);
    res.json(data);
  }),
);

analyticsRouter.get(
  '/surveys/:id/export',
  requirePermission('exportReports'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
    const file = await analytics.exportResponses(
      Number(req.params.id),
      req.user!.collegeId,
      format,
    );
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }),
);
