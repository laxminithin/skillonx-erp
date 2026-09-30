import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { AssetActor } from './types.js';

export const assetManagementRouter = Router();
assetManagementRouter.use(requireAuth);

function actor(req: AuthedRequest): AssetActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

assetManagementRouter.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listAssets(actor(req), {
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    custodianFacultyId: req.query.custodianFacultyId ? Number(req.query.custodianFacultyId) : undefined,
  }));
}));

assetManagementRouter.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.registerAsset(actor(req), validate(svc.registerAssetSchema, req.body)));
}));

assetManagementRouter.get('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getAsset(actor(req), Number(req.params.id)));
}));

assetManagementRouter.post('/:id/assign', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.assignAsset(actor(req), Number(req.params.id), validate(svc.assignSchema, req.body)));
}));

assetManagementRouter.post('/:id/transfer', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.transferAsset(actor(req), Number(req.params.id), validate(svc.transferSchema, req.body)));
}));

assetManagementRouter.post('/:id/condition', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.updateCondition(actor(req), Number(req.params.id), validate(svc.conditionSchema, req.body)));
}));

assetManagementRouter.post('/:id/status', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.changeStatus(actor(req), Number(req.params.id), validate(svc.statusSchema, req.body)));
}));
