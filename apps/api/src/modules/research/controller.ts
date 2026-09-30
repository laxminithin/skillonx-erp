import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { ResearchActor } from './types.js';

export const researchRouter = Router();
researchRouter.use(requireAuth);

function actor(req: AuthedRequest): ResearchActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
    hodDepartmentIds: (req.user as any)?.hodDepartmentIds ?? null,
  };
}

// ── Funding agencies ────────────────────────────────────────────────────
researchRouter.get('/funding-agencies', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listFundingAgencies(actor(req), { activeOnly: req.query.activeOnly === 'true' }));
}));

researchRouter.post('/funding-agencies', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createFundingAgency(actor(req), validate(svc.fundingAgencySchema, req.body)));
}));

// ── Proposals ──────────────────────────────────────────────────────────
researchRouter.get('/proposals', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listProposals(actor(req), {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  }));
}));

researchRouter.post('/proposals', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createProposal(actor(req), validate(svc.proposalSchema, req.body)));
}));

researchRouter.get('/proposals/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getProposal(actor(req), Number(req.params.id)));
}));

researchRouter.post('/proposals/:id/submit', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.submitProposalForReview(actor(req), Number(req.params.id)));
}));

researchRouter.post('/proposals/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.reviewProposal(actor(req), Number(req.params.id), validate(svc.reviewSchema, req.body)));
}));

researchRouter.post('/proposals/:id/withdraw', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.withdrawProposal(actor(req), Number(req.params.id), validate(svc.withdrawSchema, req.body)));
}));

researchRouter.post('/proposals/:id/award', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.recordAward(actor(req), Number(req.params.id), validate(svc.awardSchema, req.body)));
}));

researchRouter.post('/proposals/:id/convert', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.convertToProject(actor(req), Number(req.params.id)));
}));

// ── Projects ───────────────────────────────────────────────────────────
researchRouter.get('/projects', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listProjects(actor(req), {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  }));
}));

researchRouter.get('/projects/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getProject(actor(req), Number(req.params.id)));
}));

researchRouter.post('/projects/:id/utilization', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.addUtilizationEntry(actor(req), Number(req.params.id), validate(svc.utilizationEntrySchema, req.body)));
}));

researchRouter.post('/projects/:id/close', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.closeProject(actor(req), Number(req.params.id), validate(svc.projectClosureSchema, req.body)));
}));
