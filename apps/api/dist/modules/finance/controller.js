import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { feeHeadSchema, createFeeStructureSchema, bulkAssignSchema, bulkDemandSchema, manualPaymentSchema, initiatePaymentSchema, concessionSchema, scholarshipSchema, refundSchema, voidReceiptSchema, } from './types.js';
import * as feeHeads from './feeHeads.js';
import * as feeStructures from './feeStructures.js';
import * as demands from './demands.js';
import * as payments from './payments.js';
import * as receipts from './receipts.js';
import * as scholarships from './scholarships.js';
import * as applications from './scholarshipApplications.js';
import * as reports from './reports.js';
import { verifyAndCompletePayment } from './gateway.js';
import { createEligibilityPolicySchema, draftApplicationSchema, applicationActionSchema, sanctionApplicationSchema, completeApplicationSchema, applicationDocumentUploadSchema, } from './types.js';
function studentActor(req) {
    return { studentId: req.user.studentId, collegeId: req.user.collegeId };
}
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
export const financeRouter = Router();
financeRouter.use(requireAuth);
// Dashboard
financeRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await reports.financeDashboard(actor(req)));
}));
// Fee heads
financeRouter.get('/fee-heads', asyncHandler(async (req, res) => {
    res.json({ feeHeads: await feeHeads.listFeeHeads(req.user.collegeId) });
}));
financeRouter.post('/fee-heads', asyncHandler(async (req, res) => {
    const body = validate(feeHeadSchema, req.body);
    res.status(201).json(await feeHeads.createFeeHead(actor(req), body));
}));
financeRouter.patch('/fee-heads/:id', asyncHandler(async (req, res) => {
    res.json(await feeHeads.updateFeeHead(actor(req), Number(req.params.id), req.body ?? {}));
}));
// Fee structures
financeRouter.get('/fee-structures', asyncHandler(async (req, res) => {
    res.json({
        structures: await feeStructures.listFeeStructures(actor(req), {
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        }),
    });
}));
financeRouter.post('/fee-structures', asyncHandler(async (req, res) => {
    const body = validate(createFeeStructureSchema, req.body);
    res.status(201).json(await feeStructures.createFeeStructure(actor(req), body));
}));
financeRouter.get('/fee-structures/:id', asyncHandler(async (req, res) => {
    res.json(await feeStructures.getFeeStructure(actor(req), Number(req.params.id)));
}));
financeRouter.post('/fee-structures/:id/activate', asyncHandler(async (req, res) => {
    res.json(await feeStructures.activateFeeStructure(actor(req), Number(req.params.id)));
}));
financeRouter.post('/fee-structures/:id/archive', asyncHandler(async (req, res) => {
    res.json(await feeStructures.archiveFeeStructure(actor(req), Number(req.params.id)));
}));
financeRouter.post('/fee-structures/assign', asyncHandler(async (req, res) => {
    const body = validate(bulkAssignSchema, req.body);
    res.json(await feeStructures.bulkAssignFeeStructure(actor(req), body));
}));
// Demands
financeRouter.post('/demands/generate', asyncHandler(async (req, res) => {
    const body = validate(bulkDemandSchema, req.body);
    res.json(await demands.bulkGenerateDemands(actor(req), body));
}));
financeRouter.get('/demands/:id', asyncHandler(async (req, res) => {
    res.json(await demands.getDemand(actor(req), Number(req.params.id)));
}));
// Payments
financeRouter.get('/payments', asyncHandler(async (req, res) => {
    res.json({
        payments: await payments.listPayments(actor(req), {
            studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
            toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
        }),
    });
}));
financeRouter.post('/payments/manual', asyncHandler(async (req, res) => {
    const body = validate(manualPaymentSchema, req.body);
    res.status(201).json(await payments.recordManualPayment(actor(req), body));
}));
financeRouter.get('/payments/:id', asyncHandler(async (req, res) => {
    res.json(await payments.getPayment(actor(req), Number(req.params.id)));
}));
financeRouter.post('/payments/:id/cheque-status', asyncHandler(async (req, res) => {
    const status = validate(z.object({ status: z.enum(['CLEARED', 'BOUNCED']) }), req.body).status;
    res.json(await payments.completeChequePayment(actor(req), Number(req.params.id), status));
}));
// Receipts
financeRouter.get('/receipts', asyncHandler(async (req, res) => {
    res.json({
        receipts: await receipts.listReceipts(actor(req), {
            studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
            fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
            toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
            receiptNumber: typeof req.query.receiptNumber === 'string' ? req.query.receiptNumber : undefined,
        }),
    });
}));
financeRouter.get('/receipts/:id', asyncHandler(async (req, res) => {
    res.json(await receipts.getReceipt(actor(req), Number(req.params.id)));
}));
financeRouter.post('/receipts/:id/void', asyncHandler(async (req, res) => {
    const body = validate(voidReceiptSchema, req.body);
    res.json(await receipts.voidReceipt(actor(req), Number(req.params.id), body.reason));
}));
// Scholarships & concessions
financeRouter.get('/scholarship-schemes', asyncHandler(async (req, res) => {
    res.json({ schemes: await scholarships.listScholarshipSchemes(req.user.collegeId) });
}));
financeRouter.get('/scholarships', asyncHandler(async (req, res) => {
    res.json({
        scholarships: await scholarships.listScholarships(actor(req), {
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
        }),
    });
}));
financeRouter.post('/scholarships', asyncHandler(async (req, res) => {
    const body = validate(scholarshipSchema, req.body);
    res.status(201).json(await scholarships.createStudentScholarship(actor(req), body));
}));
financeRouter.post('/scholarships/:id/sanction', asyncHandler(async (req, res) => {
    const body = validate(z.object({ sanctionedAmount: z.number().positive() }), req.body);
    res.json(await scholarships.sanctionScholarship(actor(req), Number(req.params.id), body.sanctionedAmount));
}));
financeRouter.get('/concessions', asyncHandler(async (req, res) => {
    res.json({ concessions: await scholarships.listConcessions(actor(req)) });
}));
financeRouter.post('/concessions', asyncHandler(async (req, res) => {
    const body = validate(concessionSchema, req.body);
    res.status(201).json(await scholarships.createConcession(actor(req), body));
}));
// Scholarship eligibility policies
financeRouter.get('/scholarship-eligibility-policies', asyncHandler(async (req, res) => {
    res.json({ policies: await applications.listEligibilityPolicies(actor(req), req.query.schemeId ? Number(req.query.schemeId) : undefined) });
}));
financeRouter.post('/scholarship-eligibility-policies', asyncHandler(async (req, res) => {
    const body = validate(createEligibilityPolicySchema, req.body);
    res.status(201).json(await applications.createEligibilityPolicy(actor(req), body));
}));
// Scholarship applications — staff processing queue
financeRouter.get('/scholarship-applications', asyncHandler(async (req, res) => {
    res.json({
        applications: await applications.listApplicationsForStaff(actor(req), {
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            schemeId: req.query.schemeId ? Number(req.query.schemeId) : undefined,
        }),
    });
}));
financeRouter.get('/scholarship-applications/:id', asyncHandler(async (req, res) => {
    res.json(await applications.getApplicationForStaff(actor(req), Number(req.params.id)));
}));
financeRouter.get('/scholarship-applications/:id/documents', asyncHandler(async (req, res) => {
    res.json({ documents: await applications.listApplicationDocumentsForStaff(actor(req), Number(req.params.id)) });
}));
financeRouter.post('/scholarship-applications/:id/start-verification', asyncHandler(async (req, res) => {
    res.json(await applications.startVerification(actor(req), Number(req.params.id)));
}));
financeRouter.post('/scholarship-applications/:id/return', asyncHandler(async (req, res) => {
    const body = validate(applicationActionSchema, req.body);
    res.json(await applications.returnApplication(actor(req), Number(req.params.id), body.remarks ?? ''));
}));
financeRouter.post('/scholarship-applications/:id/verify', asyncHandler(async (req, res) => {
    const body = validate(applicationActionSchema, req.body ?? {});
    res.json(await applications.verifyApplication(actor(req), Number(req.params.id), body.remarks));
}));
financeRouter.post('/scholarship-applications/:id/approve', asyncHandler(async (req, res) => {
    const body = validate(applicationActionSchema, req.body ?? {});
    res.json(await applications.approveApplication(actor(req), Number(req.params.id), body.remarks));
}));
financeRouter.post('/scholarship-applications/:id/reject', asyncHandler(async (req, res) => {
    const body = validate(applicationActionSchema, req.body);
    res.json(await applications.rejectApplication(actor(req), Number(req.params.id), body.remarks ?? ''));
}));
financeRouter.post('/scholarship-applications/:id/cancel', asyncHandler(async (req, res) => {
    const body = validate(applicationActionSchema, req.body);
    res.json(await applications.cancelApplication(actor(req), Number(req.params.id), body.remarks ?? ''));
}));
financeRouter.post('/scholarship-applications/:id/sanction', asyncHandler(async (req, res) => {
    const body = validate(sanctionApplicationSchema, req.body);
    res.json(await applications.sanctionApplication(actor(req), Number(req.params.id), body.sanctionedAmount));
}));
financeRouter.post('/scholarship-applications/:id/complete', asyncHandler(async (req, res) => {
    const body = validate(completeApplicationSchema, req.body);
    res.json(await applications.completeApplication(actor(req), Number(req.params.id), body.evidenceReference));
}));
// Refunds
financeRouter.get('/refunds', asyncHandler(async (req, res) => {
    res.json({
        refunds: await scholarships.listRefunds(actor(req), {
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
        }),
    });
}));
financeRouter.post('/refunds', asyncHandler(async (req, res) => {
    const body = validate(refundSchema, req.body);
    res.status(201).json(await scholarships.createRefund(actor(req), body));
}));
financeRouter.post('/refunds/:id/approve', asyncHandler(async (req, res) => {
    res.json(await scholarships.approveRefund(actor(req), Number(req.params.id)));
}));
financeRouter.post('/refunds/:id/process', asyncHandler(async (req, res) => {
    const ref = typeof req.body?.paymentReference === 'string' ? req.body.paymentReference : undefined;
    res.json(await scholarships.processRefund(actor(req), Number(req.params.id), ref));
}));
// Reports
financeRouter.get('/reports/daily-collection', asyncHandler(async (req, res) => {
    res.json(await reports.dailyCollectionReport(actor(req), {
        date: typeof req.query.date === 'string' ? req.query.date : undefined,
        paymentMethod: typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined,
        recordedBy: req.query.recordedBy ? Number(req.query.recordedBy) : undefined,
    }));
}));
financeRouter.get('/reports/outstanding', asyncHandler(async (req, res) => {
    res.json(await reports.outstandingReport(actor(req), {
        academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
        programId: req.query.programId ? Number(req.query.programId) : undefined,
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        classId: req.query.classId ? Number(req.query.classId) : undefined,
    }));
}));
financeRouter.get('/reconciliation', asyncHandler(async (req, res) => {
    res.json(await reports.reconciliationWorkspace(actor(req)));
}));
// Student search & profile
financeRouter.get('/students/search', asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ students: await reports.searchStudentFinance(actor(req), q) });
}));
financeRouter.get('/students/:studentId', asyncHandler(async (req, res) => {
    res.json(await reports.getStudentFinanceProfile(actor(req), Number(req.params.studentId)));
}));
// Gateway webhook (staff-authenticated for mock; real webhooks would use signature verification)
financeRouter.post('/webhooks/:provider', asyncHandler(async (req, res) => {
    const provider = req.params.provider.toUpperCase();
    const body = req.body ?? {};
    const eventId = String(body.eventId ?? body.event_id ?? `evt_${Date.now()}`);
    const orderId = String(body.orderId ?? body.order_id ?? '');
    const result = await verifyAndCompletePayment(provider, eventId, orderId, body);
    res.json(result);
}));
// Student finance routes
export const studentFinanceRouter = Router();
studentFinanceRouter.use(requireStudentAuth);
import { getStudentFinancialStatus, getStudentNoDueStatus } from './clearance.js';
import { initiateOnlinePayment } from './gateway.js';
studentFinanceRouter.get('/finance', asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const collegeId = req.user.collegeId;
    const summary = await getStudentFinancialStatus(studentId, collegeId);
    const demandList = await demands.listStudentDemands(studentId, collegeId);
    res.json({ summary, demands: demandList });
}));
studentFinanceRouter.get('/finance/demands', asyncHandler(async (req, res) => {
    res.json({
        demands: await demands.listStudentDemands(req.user.studentId, req.user.collegeId),
    });
}));
studentFinanceRouter.get('/finance/payments', asyncHandler(async (req, res) => {
    res.json({
        payments: await payments.listStudentPayments(req.user.studentId, req.user.collegeId),
    });
}));
studentFinanceRouter.get('/finance/receipts', asyncHandler(async (req, res) => {
    res.json({
        receipts: await receipts.listStudentReceipts(req.user.studentId, req.user.collegeId),
    });
}));
studentFinanceRouter.get('/finance/receipts/:id', asyncHandler(async (req, res) => {
    res.json(await receipts.getStudentReceipt(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentFinanceRouter.get('/finance/scholarships', asyncHandler(async (req, res) => {
    res.json({
        scholarships: await scholarships.listStudentScholarships(req.user.studentId, req.user.collegeId),
    });
}));
studentFinanceRouter.get('/finance/scholarship-schemes', asyncHandler(async (req, res) => {
    res.json({ schemes: await applications.listApplicableSchemes(req.user.collegeId) });
}));
studentFinanceRouter.get('/finance/scholarship-applications', asyncHandler(async (req, res) => {
    res.json({ applications: await applications.listStudentApplications(studentActor(req)) });
}));
studentFinanceRouter.post('/finance/scholarship-applications', asyncHandler(async (req, res) => {
    const body = validate(draftApplicationSchema, req.body);
    res.status(201).json(await applications.createDraftApplication(studentActor(req), body));
}));
studentFinanceRouter.get('/finance/scholarship-applications/:id', asyncHandler(async (req, res) => {
    res.json(await applications.getStudentApplication(studentActor(req), Number(req.params.id)));
}));
studentFinanceRouter.patch('/finance/scholarship-applications/:id', asyncHandler(async (req, res) => {
    const body = validate(draftApplicationSchema.partial(), req.body ?? {});
    res.json(await applications.updateDraftApplication(studentActor(req), Number(req.params.id), body));
}));
studentFinanceRouter.post('/finance/scholarship-applications/:id/submit', asyncHandler(async (req, res) => {
    res.json(await applications.submitApplication(studentActor(req), Number(req.params.id)));
}));
studentFinanceRouter.post('/finance/scholarship-applications/:id/withdraw', asyncHandler(async (req, res) => {
    res.json(await applications.withdrawApplication(studentActor(req), Number(req.params.id)));
}));
studentFinanceRouter.get('/finance/scholarship-applications/:id/documents', asyncHandler(async (req, res) => {
    res.json({ documents: await applications.listApplicationDocuments(studentActor(req), Number(req.params.id)) });
}));
studentFinanceRouter.post('/finance/scholarship-applications/:id/documents', asyncHandler(async (req, res) => {
    const body = validate(applicationDocumentUploadSchema, req.body);
    res.status(201).json(await applications.uploadApplicationDocument(studentActor(req), Number(req.params.id), body));
}));
studentFinanceRouter.get('/finance/no-due', asyncHandler(async (req, res) => {
    res.json(await getStudentNoDueStatus(req.user.studentId, req.user.collegeId));
}));
studentFinanceRouter.post('/finance/payments/initiate', asyncHandler(async (req, res) => {
    const body = validate(initiatePaymentSchema, req.body);
    res.status(201).json(await initiateOnlinePayment(req.user.studentId, req.user.collegeId, body));
}));
studentFinanceRouter.post('/finance/payments/verify', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        provider: z.string(),
        eventId: z.string(),
        orderId: z.string(),
        paymentData: z.record(z.unknown()).optional(),
    }), req.body);
    res.json(await verifyAndCompletePayment(body.provider.toUpperCase(), body.eventId, body.orderId, body.paymentData ?? { status: 'success' }));
}));
// APPROVED CROSS-MODULE RECEIVER: Examination remuneration -> Finance posting.
// Finance-owned actions require Finance permissions (COE cannot post/reverse) (§10).
import * as examRemun from './examRemunerationPosting.js';
financeRouter.get('/exam-remuneration/:itemId', asyncHandler(async (req, res) => {
    res.json(await examRemun.getExamRemunerationReadback(actor(req).collegeId, Number(req.params.itemId)));
}));
financeRouter.get('/exam-remuneration/:itemId/preview', asyncHandler(async (req, res) => {
    res.json(await examRemun.previewExamRemunerationPosting(actor(req).collegeId, Number(req.params.itemId)));
}));
financeRouter.post('/exam-remuneration/:itemId/post', asyncHandler(async (req, res) => {
    res.status(201).json(await examRemun.postExamRemuneration(actor(req), Number(req.params.itemId)));
}));
financeRouter.post('/exam-remuneration/:itemId/reverse', asyncHandler(async (req, res) => {
    const body = validate(z.object({ reason: z.string().trim().min(5).max(1000) }), req.body);
    res.json(await examRemun.reverseExamRemuneration(actor(req), Number(req.params.itemId), body.reason));
}));
