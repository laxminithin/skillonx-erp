import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { CanteenActor } from './types.js';

export const canteenRouter = Router();
canteenRouter.use(requireAuth);

function actor(req: AuthedRequest): CanteenActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

canteenRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.dashboard(actor(req)));
}));

canteenRouter.get('/menu', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listMenu(actor(req), { availableOnly: req.query.availableOnly === 'true' }));
}));

canteenRouter.post('/menu', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.upsertMenuItem(actor(req), validate(svc.menuItemSchema, req.body)));
}));

canteenRouter.get('/orders', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listOrders(actor(req), {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    counterStoreId: req.query.counterStoreId ? Number(req.query.counterStoreId) : undefined,
  }));
}));

canteenRouter.post('/orders', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createOrder(actor(req), validate(svc.createOrderSchema, req.body)));
}));

canteenRouter.get('/orders/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getOrder(actor(req), Number(req.params.id)));
}));

canteenRouter.post('/orders/:id/pay', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.payOrder(actor(req), Number(req.params.id), validate(svc.payOrderSchema, req.body)));
}));

canteenRouter.post('/orders/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.cancelOrder(actor(req), Number(req.params.id), validate(svc.cancelOrderSchema, req.body)));
}));

canteenRouter.post('/orders/:id/refund', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.refundOrder(actor(req), Number(req.params.id), validate(svc.refundOrderSchema, req.body)));
}));

canteenRouter.post('/settlements', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.generateDailySettlement(actor(req), validate(svc.settlementSchema, req.body)));
}));

canteenRouter.get('/settlements', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listSettlements(actor(req), req.query.counterStoreId ? Number(req.query.counterStoreId) : undefined));
}));
