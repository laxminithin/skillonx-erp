import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { SecurityActor } from './types.js';

export const securityRouter = Router();
securityRouter.use(requireAuth);

function actor(req: AuthedRequest): SecurityActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

// ── Gate / Location master ──────────────────────────────────────────────
securityRouter.get('/gates', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listGates(actor(req), { activeOnly: req.query.activeOnly === 'true' }));
}));

securityRouter.post('/gates', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createGate(actor(req), validate(svc.gateSchema, req.body)));
}));

securityRouter.get('/gates/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getGate(actor(req), Number(req.params.id)));
}));

securityRouter.post('/gates/:id/status', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.setGateStatus(actor(req), Number(req.params.id), validate(svc.gateStatusSchema, req.body)));
}));

// ── Visitor / Visit lifecycle ────────────────────────────────────────────
securityRouter.get('/visits', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listVisits(actor(req), {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    gateId: req.query.gateId ? Number(req.query.gateId) : undefined,
    visitType: typeof req.query.visitType === 'string' ? req.query.visitType : undefined,
  }));
}));

securityRouter.post('/visits', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.requestVisit(actor(req), validate(svc.visitorRequestSchema, req.body)));
}));

securityRouter.get('/visits/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getVisit(actor(req), Number(req.params.id)));
}));

securityRouter.post('/visits/:id/decision', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.decideVisit(actor(req), Number(req.params.id), validate(svc.visitDecisionSchema, req.body)));
}));

securityRouter.post('/visits/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.cancelVisit(actor(req), Number(req.params.id), validate(svc.visitCancelSchema, req.body)));
}));

securityRouter.post('/visits/:id/check-in', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.checkInVisit(actor(req), Number(req.params.id), validate(svc.visitCheckInSchema, req.body)));
}));

securityRouter.post('/visits/:id/check-out', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.checkOutVisit(actor(req), Number(req.params.id), validate(svc.visitCheckOutSchema, req.body)));
}));

// ── Security Incident log ────────────────────────────────────────────────
securityRouter.get('/incidents', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listIncidents(actor(req), {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
  }));
}));

securityRouter.post('/incidents', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.reportIncident(actor(req), validate(svc.incidentSchema, req.body)));
}));

securityRouter.get('/incidents/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getIncident(actor(req), Number(req.params.id)));
}));

securityRouter.post('/incidents/:id/status', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.updateIncidentStatus(actor(req), Number(req.params.id), validate(svc.incidentStatusSchema, req.body)));
}));
