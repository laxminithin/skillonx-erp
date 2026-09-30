import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { WorkflowActor } from './types.js';

export const workflowRouter = Router();
workflowRouter.use(requireAuth);

function actor(req: AuthedRequest): WorkflowActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

workflowRouter.get('/definitions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listDefinitions(actor(req)));
}));

workflowRouter.post('/definitions', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createDefinition(actor(req), validate(svc.createDefinitionSchema, req.body)));
}));

workflowRouter.get('/definitions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getDefinition(actor(req), Number(req.params.id)));
}));

workflowRouter.post('/definitions/:id/publish', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.publishDefinition(actor(req), Number(req.params.id)));
}));

workflowRouter.get('/instances', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listInstances(actor(req), {
    entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  }));
}));

workflowRouter.post('/instances', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.startInstance(actor(req), validate(svc.startInstanceSchema, req.body)));
}));

workflowRouter.get('/instances/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getInstance(actor(req), Number(req.params.id)));
}));

workflowRouter.post('/instances/:id/actions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.performAction(actor(req), Number(req.params.id), validate(svc.actionSchema, req.body)));
}));
