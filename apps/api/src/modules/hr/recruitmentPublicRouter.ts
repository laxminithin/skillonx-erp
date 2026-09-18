import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { applySchema } from './recruitmentTypes.js';
import * as recruitmentPublic from './recruitmentPublic.js';

export const publicRecruitmentRouter = Router();

function collegeIdFrom(req: { query: Record<string, unknown>; body?: Record<string, unknown>; params: Record<string, string> }) {
  const raw = req.query.collegeId ?? req.body?.collegeId ?? req.params.collegeId;
  return Number(raw);
}

function candidateToken(req: { headers: Record<string, unknown>; query: Record<string, unknown> }) {
  const header = req.headers['x-candidate-token'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  if (typeof req.query.token === 'string') return req.query.token;
  return '';
}

publicRecruitmentRouter.get(
  '/openings',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.listPublicOpenings(collegeIdFrom(req)));
  }),
);

publicRecruitmentRouter.get(
  '/openings/:id',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.getPublicOpening(collegeIdFrom(req), Number(req.params.id)));
  }),
);

publicRecruitmentRouter.post(
  '/apply',
  asyncHandler(async (req, res) => {
    const collegeId = collegeIdFrom(req);
    validate(applySchema, req.body);
    res.status(201).json(await recruitmentPublic.publicApply(collegeId, req.body));
  }),
);

publicRecruitmentRouter.get(
  '/portal/me',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalMe(candidateToken(req)));
  }),
);

publicRecruitmentRouter.get(
  '/portal/offers/:id',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalGetOffer(candidateToken(req), Number(req.params.id)));
  }),
);

publicRecruitmentRouter.post(
  '/portal/offers/:id/accept',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalAcceptOffer(candidateToken(req), Number(req.params.id)));
  }),
);

publicRecruitmentRouter.get(
  '/portal/applications/:id/prejoining',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalPrejoining(candidateToken(req), Number(req.params.id)));
  }),
);

publicRecruitmentRouter.get(
  '/portal/documents/:id',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalGetDocument(candidateToken(req), Number(req.params.id)));
  }),
);

publicRecruitmentRouter.get(
  '/portal/notifications',
  asyncHandler(async (req, res) => {
    res.json(await recruitmentPublic.portalListNotifications(candidateToken(req)));
  }),
);
