import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import * as bank from './service.js';

export const questionBankRouter = Router();
questionBankRouter.use(requireAuth);

questionBankRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const items = await bank.listBankItems(req.user!.collegeId, tag, q);
    res.json({ items });
  }),
);

questionBankRouter.post(
  '/',
  requirePermission('manageQuestionBank'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(bank.bankItemSchema, req.body);
    const item = await bank.createBankItem(req.user!.collegeId, req.user!.facultyUserId, body);
    res.status(201).json({ item });
  }),
);

questionBankRouter.patch(
  '/:id',
  requirePermission('manageQuestionBank'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(bank.bankItemSchema.partial(), req.body);
    const item = await bank.updateBankItem(req.user!.collegeId, Number(req.params.id), body);
    res.json({ item });
  }),
);

questionBankRouter.delete(
  '/:id',
  requirePermission('manageQuestionBank'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const result = await bank.deleteBankItem(req.user!.collegeId, Number(req.params.id));
    res.json(result);
  }),
);
