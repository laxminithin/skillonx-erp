import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import * as svc from './service.js';
import type { ProcurementActor } from './types.js';

export const procurementRouter = Router();
procurementRouter.use(requireAuth);

function actor(req: AuthedRequest): ProcurementActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

procurementRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.dashboard(actor(req)));
}));

procurementRouter.get('/masters', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listMasters(actor(req)));
}));

procurementRouter.post('/units', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.upsertUnit(actor(req), validate(svc.unitSchema, req.body)));
}));

procurementRouter.post('/categories', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.upsertCategory(actor(req), validate(svc.categorySchema, req.body)));
}));

procurementRouter.post('/stores', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createStore(actor(req), validate(svc.storeSchema, req.body)));
}));

procurementRouter.post('/items', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createItem(actor(req), validate(svc.itemSchema, req.body)));
}));

procurementRouter.post('/vendors', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createVendor(actor(req), validate(svc.vendorSchema, req.body)));
}));

// Campus OS Phase 0 — Vendor Master directory, for cross-module consumers (e.g. Asset Management).
procurementRouter.get('/vendors', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listVendorDirectory(actor(req), { activeOnly: req.query.activeOnly === 'true' }));
}));

procurementRouter.get('/indents', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listIndents(actor(req)));
}));

procurementRouter.post('/indents', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createIndent(actor(req), validate(svc.indentSchema, req.body)));
}));

procurementRouter.get('/indents/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getIndent(actor(req), Number(req.params.id)));
}));

procurementRouter.post('/indents/:id/decision', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.decideIndent(actor(req), Number(req.params.id), validate(svc.decisionSchema, req.body)));
}));

procurementRouter.post('/rfqs', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createRfq(actor(req), validate(svc.rfqSchema, req.body)));
}));

procurementRouter.post('/rfqs/:id/issue', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.issueRfq(actor(req), Number(req.params.id)));
}));

procurementRouter.get('/rfqs/:id/comparison', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getRfqComparison(actor(req), Number(req.params.id)));
}));

procurementRouter.post('/rfqs/:id/quotations', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.recordQuotation(actor(req), Number(req.params.id), validate(svc.quotationSchema, req.body)));
}));

procurementRouter.post('/rfqs/:rfqId/quotations/:quotationId/select', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.selectQuotation(actor(req), Number(req.params.rfqId), Number(req.params.quotationId), validate(svc.selectQuotationSchema, req.body)));
}));

procurementRouter.get('/purchase-orders', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listPos(actor(req)));
}));

procurementRouter.post('/purchase-orders', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createPo(actor(req), validate(svc.poSchema, req.body)));
}));

procurementRouter.get('/purchase-orders/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getPo(actor(req), Number(req.params.id)));
}));

procurementRouter.post('/purchase-orders/:id/:action', asyncHandler(async (req: AuthedRequest, res) => {
  const action = String(req.params.action);
  if (!['approve', 'issue', 'cancel'].includes(action)) {
    res.status(400).json({ error: 'Invalid PO action' });
    return;
  }
  res.json(await svc.transitionPo(actor(req), Number(req.params.id), action as 'approve' | 'issue' | 'cancel', req.body?.reason));
}));

procurementRouter.get('/grns', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listGrns(actor(req)));
}));

procurementRouter.post('/purchase-orders/:id/grns', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createGrn(actor(req), Number(req.params.id), validate(svc.grnSchema, req.body)));
}));

procurementRouter.post('/grns/:id/finance-handoff', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.financeHandoff(actor(req), Number(req.params.id), validate(svc.financeHandoffSchema, req.body)));
}));

// Campus OS Phase 1 — governed GRN-line-to-Asset handoff (asset registration lives in P0.2).
procurementRouter.post('/grn-items/:id/asset-handoff', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.handoffGrnItemToAssets(actor(req), Number(req.params.id), validate(svc.assetHandoffSchema, req.body)));
}));

procurementRouter.get('/grn-items/:id/asset-handoff', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getAssetHandoff(actor(req), Number(req.params.id)));
}));

procurementRouter.get('/inventory', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listInventory(actor(req)));
}));

procurementRouter.get('/ledger', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.ledger(actor(req), {
    itemId: req.query.itemId ? Number(req.query.itemId) : undefined,
    storeId: req.query.storeId ? Number(req.query.storeId) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  }));
}));

procurementRouter.post('/issues', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createIssue(actor(req), validate(svc.issueSchema, req.body)));
}));

procurementRouter.post('/returns', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createReturn(actor(req), validate(svc.returnSchema, req.body)));
}));

procurementRouter.post('/transfers', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createTransfer(actor(req), validate(svc.transferSchema, req.body)));
}));

procurementRouter.post('/adjustments', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createAdjustment(actor(req), validate(svc.adjustmentSchema, req.body)));
}));

procurementRouter.get('/reconciliation', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.reconcile(actor(req)));
}));

procurementRouter.get('/reports', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.reports(actor(req)));
}));
