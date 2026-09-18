import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import type { FinanceActor } from './types.js';
import {
  feeHeadSchema,
  createFeeStructureSchema,
  bulkAssignSchema,
  bulkDemandSchema,
  manualPaymentSchema,
  initiatePaymentSchema,
  concessionSchema,
  scholarshipSchema,
  refundSchema,
  voidReceiptSchema,
} from './types.js';
import * as feeHeads from './feeHeads.js';
import * as feeStructures from './feeStructures.js';
import * as demands from './demands.js';
import * as payments from './payments.js';
import * as receipts from './receipts.js';
import * as scholarships from './scholarships.js';
import * as reports from './reports.js';
import { verifyAndCompletePayment } from './gateway.js';

function actor(req: AuthedRequest): FinanceActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

export const financeRouter = Router();
financeRouter.use(requireAuth);

// Dashboard
financeRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await reports.financeDashboard(actor(req)));
  }),
);

// Fee heads
financeRouter.get(
  '/fee-heads',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ feeHeads: await feeHeads.listFeeHeads(req.user!.collegeId) });
  }),
);

financeRouter.post(
  '/fee-heads',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(feeHeadSchema, req.body);
    res.status(201).json(await feeHeads.createFeeHead(actor(req), body));
  }),
);

financeRouter.patch(
  '/fee-heads/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await feeHeads.updateFeeHead(actor(req), Number(req.params.id), req.body ?? {}));
  }),
);

// Fee structures
financeRouter.get(
  '/fee-structures',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      structures: await feeStructures.listFeeStructures(actor(req), {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
      }),
    });
  }),
);

financeRouter.post(
  '/fee-structures',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createFeeStructureSchema, req.body);
    res.status(201).json(await feeStructures.createFeeStructure(actor(req), body));
  }),
);

financeRouter.get(
  '/fee-structures/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await feeStructures.getFeeStructure(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/fee-structures/:id/activate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await feeStructures.activateFeeStructure(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/fee-structures/:id/archive',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await feeStructures.archiveFeeStructure(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/fee-structures/assign',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(bulkAssignSchema, req.body);
    res.json(await feeStructures.bulkAssignFeeStructure(actor(req), body));
  }),
);

// Demands
financeRouter.post(
  '/demands/generate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(bulkDemandSchema, req.body);
    res.json(await demands.bulkGenerateDemands(actor(req), body));
  }),
);

financeRouter.get(
  '/demands/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await demands.getDemand(actor(req), Number(req.params.id)));
  }),
);

// Payments
financeRouter.get(
  '/payments',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      payments: await payments.listPayments(actor(req), {
        studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
        toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
      }),
    });
  }),
);

financeRouter.post(
  '/payments/manual',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(manualPaymentSchema, req.body);
    res.status(201).json(await payments.recordManualPayment(actor(req), body));
  }),
);

financeRouter.get(
  '/payments/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payments.getPayment(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/payments/:id/cheque-status',
  asyncHandler(async (req: AuthedRequest, res) => {
    const status = validate(z.object({ status: z.enum(['CLEARED', 'BOUNCED']) }), req.body).status;
    res.json(await payments.completeChequePayment(actor(req), Number(req.params.id), status));
  }),
);

// Receipts
financeRouter.get(
  '/receipts',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      receipts: await receipts.listReceipts(actor(req), {
        studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
        fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
        toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
        receiptNumber: typeof req.query.receiptNumber === 'string' ? req.query.receiptNumber : undefined,
      }),
    });
  }),
);

financeRouter.get(
  '/receipts/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await receipts.getReceipt(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/receipts/:id/void',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(voidReceiptSchema, req.body);
    res.json(await receipts.voidReceipt(actor(req), Number(req.params.id), body.reason));
  }),
);

// Scholarships & concessions
financeRouter.get(
  '/scholarship-schemes',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ schemes: await scholarships.listScholarshipSchemes(req.user!.collegeId) });
  }),
);

financeRouter.get(
  '/scholarships',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      scholarships: await scholarships.listScholarships(actor(req), {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      }),
    });
  }),
);

financeRouter.post(
  '/scholarships',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(scholarshipSchema, req.body);
    res.status(201).json(await scholarships.createStudentScholarship(actor(req), body));
  }),
);

financeRouter.post(
  '/scholarships/:id/sanction',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(z.object({ sanctionedAmount: z.number().positive() }), req.body);
    res.json(await scholarships.sanctionScholarship(actor(req), Number(req.params.id), body.sanctionedAmount));
  }),
);

financeRouter.get(
  '/concessions',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ concessions: await scholarships.listConcessions(actor(req)) });
  }),
);

financeRouter.post(
  '/concessions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(concessionSchema, req.body);
    res.status(201).json(await scholarships.createConcession(actor(req), body));
  }),
);

// Refunds
financeRouter.get(
  '/refunds',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      refunds: await scholarships.listRefunds(actor(req), {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      }),
    });
  }),
);

financeRouter.post(
  '/refunds',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(refundSchema, req.body);
    res.status(201).json(await scholarships.createRefund(actor(req), body));
  }),
);

financeRouter.post(
  '/refunds/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await scholarships.approveRefund(actor(req), Number(req.params.id)));
  }),
);

financeRouter.post(
  '/refunds/:id/process',
  asyncHandler(async (req: AuthedRequest, res) => {
    const ref = typeof req.body?.paymentReference === 'string' ? req.body.paymentReference : undefined;
    res.json(await scholarships.processRefund(actor(req), Number(req.params.id), ref));
  }),
);

// Reports
financeRouter.get(
  '/reports/daily-collection',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await reports.dailyCollectionReport(actor(req), {
        date: typeof req.query.date === 'string' ? req.query.date : undefined,
        paymentMethod: typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined,
        recordedBy: req.query.recordedBy ? Number(req.query.recordedBy) : undefined,
      }),
    );
  }),
);

financeRouter.get(
  '/reports/outstanding',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await reports.outstandingReport(actor(req), {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        classId: req.query.classId ? Number(req.query.classId) : undefined,
      }),
    );
  }),
);

financeRouter.get(
  '/reconciliation',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await reports.reconciliationWorkspace(actor(req)));
  }),
);

// Student search & profile
financeRouter.get(
  '/students/search',
  asyncHandler(async (req: AuthedRequest, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ students: await reports.searchStudentFinance(actor(req), q) });
  }),
);

financeRouter.get(
  '/students/:studentId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await reports.getStudentFinanceProfile(actor(req), Number(req.params.studentId)));
  }),
);

// Gateway webhook (staff-authenticated for mock; real webhooks would use signature verification)
financeRouter.post(
  '/webhooks/:provider',
  asyncHandler(async (req: AuthedRequest, res) => {
    const provider = req.params.provider.toUpperCase();
    const body = req.body ?? {};
    const eventId = String(body.eventId ?? body.event_id ?? `evt_${Date.now()}`);
    const orderId = String(body.orderId ?? body.order_id ?? '');
    const result = await verifyAndCompletePayment(provider, eventId, orderId, body);
    res.json(result);
  }),
);

// Student finance routes
export const studentFinanceRouter = Router();
studentFinanceRouter.use(requireStudentAuth);

import { getStudentFinancialStatus, getStudentNoDueStatus } from './clearance.js';
import { initiateOnlinePayment } from './gateway.js';

studentFinanceRouter.get(
  '/finance',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const studentId = req.user!.studentId;
    const collegeId = req.user!.collegeId;
    const summary = await getStudentFinancialStatus(studentId, collegeId);
    const demandList = await demands.listStudentDemands(studentId, collegeId);
    res.json({ summary, demands: demandList });
  }),
);

studentFinanceRouter.get(
  '/finance/demands',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      demands: await demands.listStudentDemands(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentFinanceRouter.get(
  '/finance/payments',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      payments: await payments.listStudentPayments(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentFinanceRouter.get(
  '/finance/receipts',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      receipts: await receipts.listStudentReceipts(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentFinanceRouter.get(
  '/finance/receipts/:id',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json(
      await receipts.getStudentReceipt(
        req.user!.studentId,
        req.user!.collegeId,
        Number(req.params.id),
      ),
    );
  }),
);

studentFinanceRouter.get(
  '/finance/scholarships',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      scholarships: await scholarships.listStudentScholarships(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentFinanceRouter.get(
  '/finance/no-due',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json(await getStudentNoDueStatus(req.user!.studentId, req.user!.collegeId));
  }),
);

studentFinanceRouter.post(
  '/finance/payments/initiate',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const body = validate(initiatePaymentSchema, req.body);
    res.status(201).json(
      await initiateOnlinePayment(req.user!.studentId, req.user!.collegeId, body),
    );
  }),
);

studentFinanceRouter.post(
  '/finance/payments/verify',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const body = validate(
      z.object({
        provider: z.string(),
        eventId: z.string(),
        orderId: z.string(),
        paymentData: z.record(z.unknown()).optional(),
      }),
      req.body,
    );
    res.json(
      await verifyAndCompletePayment(
        body.provider.toUpperCase(),
        body.eventId,
        body.orderId,
        body.paymentData ?? { status: 'success' },
      ),
    );
  }),
);
