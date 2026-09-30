import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import * as svc from './service.js';
export const iqacRouter = Router();
iqacRouter.use(requireAuth);
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
        hodDepartmentIds: req.user?.hodDepartmentIds ?? null,
    };
}
// ── Dashboard ──────────────────────────────────────────────────────────────
iqacRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await svc.getDashboard(actor(req)));
}));
// ── Frameworks / versions / criteria ───────────────────────────────────────
iqacRouter.get('/frameworks', asyncHandler(async (req, res) => {
    res.json(await svc.listFrameworks(actor(req)));
}));
iqacRouter.post('/frameworks', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createFramework(actor(req), validate(svc.frameworkSchema, req.body)));
}));
iqacRouter.get('/frameworks/:id/versions', asyncHandler(async (req, res) => {
    res.json(await svc.listFrameworkVersions(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/frameworks/:id/versions', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createFrameworkVersion(actor(req), Number(req.params.id), validate(svc.frameworkVersionSchema, req.body)));
}));
iqacRouter.post('/framework-versions/:id/activate', asyncHandler(async (req, res) => {
    res.json(await svc.activateFrameworkVersion(actor(req), Number(req.params.id)));
}));
iqacRouter.get('/framework-versions/:id/criteria', asyncHandler(async (req, res) => {
    res.json(await svc.listCriteria(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/framework-versions/:id/criteria', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createCriterion(actor(req), Number(req.params.id), validate(svc.criterionSchema, req.body)));
}));
// ── Metrics ────────────────────────────────────────────────────────────────
iqacRouter.get('/metrics', asyncHandler(async (req, res) => {
    res.json(await svc.listMetrics(actor(req), {
        frameworkVersionId: req.query.frameworkVersionId ? Number(req.query.frameworkVersionId) : undefined,
        criterionId: req.query.criterionId ? Number(req.query.criterionId) : undefined,
    }));
}));
iqacRouter.post('/metrics', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createMetric(actor(req), validate(svc.metricSchema, req.body)));
}));
iqacRouter.get('/metrics/values', asyncHandler(async (req, res) => {
    res.json(await svc.listMetricValues(actor(req), {
        metricId: req.query.metricId ? Number(req.query.metricId) : undefined,
        cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
        periodLabel: typeof req.query.periodLabel === 'string' ? req.query.periodLabel : undefined,
    }));
}));
iqacRouter.post('/metrics/:id/manual-value', asyncHandler(async (req, res) => {
    res.json(await svc.setManualMetricValue(actor(req), Number(req.params.id), validate(svc.manualMetricValueSchema, req.body)));
}));
iqacRouter.post('/metrics/:id/recompute', asyncHandler(async (req, res) => {
    const periodLabel = String(req.body?.periodLabel ?? '');
    const cycleId = req.body?.cycleId ? Number(req.body.cycleId) : null;
    res.json(await svc.recomputeSystemMetric(actor(req), Number(req.params.id), periodLabel, cycleId));
}));
iqacRouter.post('/metrics/:id/override', asyncHandler(async (req, res) => {
    const periodLabel = String(req.body?.periodLabel ?? '');
    res.json(await svc.overrideMetricValue(actor(req), Number(req.params.id), periodLabel, validate(svc.metricOverrideSchema, req.body)));
}));
// ── Cycles ─────────────────────────────────────────────────────────────────
iqacRouter.get('/cycles', asyncHandler(async (req, res) => {
    res.json(await svc.listCycles(actor(req)));
}));
iqacRouter.post('/cycles', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createCycle(actor(req), validate(svc.cycleSchema, req.body)));
}));
iqacRouter.get('/cycles/:id', asyncHandler(async (req, res) => {
    res.json(await svc.getCycle(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/cycles/:id/advance', asyncHandler(async (req, res) => {
    const toStatus = String(req.body?.toStatus ?? '');
    res.json(await svc.advanceCycle(actor(req), Number(req.params.id), toStatus));
}));
iqacRouter.post('/cycles/:id/freeze', asyncHandler(async (req, res) => {
    res.json(await svc.freezeCycle(actor(req), Number(req.params.id), validate(svc.cycleFreezeSchema, req.body)));
}));
iqacRouter.post('/cycles/:id/revise', asyncHandler(async (req, res) => {
    res.json(await svc.reviseCycleSnapshot(actor(req), Number(req.params.id), validate(svc.cycleReviseSchema, req.body)));
}));
iqacRouter.get('/cycles/:id/snapshots', asyncHandler(async (req, res) => {
    res.json(await svc.listSnapshots(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/cycles/:id/submit', asyncHandler(async (req, res) => {
    res.json(await svc.submitCycle(actor(req), Number(req.params.id), validate(svc.cycleSubmitSchema, req.body)));
}));
iqacRouter.post('/cycles/:id/close', asyncHandler(async (req, res) => {
    res.json(await svc.closeCycle(actor(req), Number(req.params.id)));
}));
// ── Evidence ───────────────────────────────────────────────────────────────
iqacRouter.get('/evidence', asyncHandler(async (req, res) => {
    res.json(await svc.listEvidence(actor(req), {
        cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
        criterionId: req.query.criterionId ? Number(req.query.criterionId) : undefined,
        metricId: req.query.metricId ? Number(req.query.metricId) : undefined,
        verificationStatus: typeof req.query.verificationStatus === 'string' ? req.query.verificationStatus : undefined,
    }));
}));
iqacRouter.post('/evidence', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.submitEvidence(actor(req), validate(svc.evidenceSchema, req.body)));
}));
iqacRouter.post('/evidence/:id/verify', asyncHandler(async (req, res) => {
    res.json(await svc.verifyEvidence(actor(req), Number(req.params.id), validate(svc.evidenceVerifySchema, req.body)));
}));
// ── Action plans ───────────────────────────────────────────────────────────
iqacRouter.get('/action-plans', asyncHandler(async (req, res) => {
    res.json(await svc.listActionPlans(actor(req), {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        sourceType: typeof req.query.sourceType === 'string' ? req.query.sourceType : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    }));
}));
iqacRouter.post('/action-plans', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createActionPlan(actor(req), validate(svc.actionPlanSchema, req.body)));
}));
iqacRouter.patch('/action-plans/:id', asyncHandler(async (req, res) => {
    res.json(await svc.updateActionPlan(actor(req), Number(req.params.id), validate(svc.actionPlanUpdateSchema, req.body)));
}));
iqacRouter.post('/action-plans/:id/close', asyncHandler(async (req, res) => {
    res.json(await svc.closeActionPlan(actor(req), Number(req.params.id), validate(svc.actionPlanCloseSchema, req.body)));
}));
iqacRouter.post('/action-plans/:id/cancel', asyncHandler(async (req, res) => {
    res.json(await svc.cancelActionPlan(actor(req), Number(req.params.id), req.body?.reason ?? null));
}));
iqacRouter.post('/action-plans/:id/reopen', asyncHandler(async (req, res) => {
    res.json(await svc.reopenActionPlan(actor(req), Number(req.params.id), validate(svc.actionPlanReopenSchema, req.body)));
}));
// ── Academic / internal audits ─────────────────────────────────────────────
iqacRouter.get('/audits', asyncHandler(async (req, res) => {
    res.json(await svc.listAudits(actor(req), { departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined }));
}));
iqacRouter.post('/audits', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createAudit(actor(req), validate(svc.auditSchema, req.body)));
}));
iqacRouter.post('/audits/:id/findings', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.addFinding(actor(req), Number(req.params.id), validate(svc.findingSchema, req.body)));
}));
iqacRouter.post('/audit-findings/:id/action-plan', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.raiseActionPlanFromFinding(actor(req), Number(req.params.id), validate(svc.actionPlanSchema, req.body)));
}));
iqacRouter.post('/audits/:id/close', asyncHandler(async (req, res) => {
    res.json(await svc.closeAudit(actor(req), Number(req.params.id)));
}));
// ── Committees / meetings ──────────────────────────────────────────────────
iqacRouter.get('/committees', asyncHandler(async (req, res) => {
    res.json(await svc.listCommittees(actor(req)));
}));
iqacRouter.post('/committees', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createCommittee(actor(req), validate(svc.committeeSchema, req.body)));
}));
iqacRouter.get('/committees/:id/members', asyncHandler(async (req, res) => {
    res.json(await svc.listCommitteeMembers(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/committees/:id/members', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.addCommitteeMember(actor(req), Number(req.params.id), validate(svc.committeeMemberSchema, req.body)));
}));
iqacRouter.get('/committees/:id/meetings', asyncHandler(async (req, res) => {
    res.json(await svc.listMeetings(actor(req), Number(req.params.id)));
}));
iqacRouter.post('/committees/:id/meetings', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.scheduleMeeting(actor(req), Number(req.params.id), validate(svc.meetingSchema, req.body)));
}));
iqacRouter.post('/meetings/:id/minutes', asyncHandler(async (req, res) => {
    res.json(await svc.recordMeetingMinutes(actor(req), Number(req.params.id), validate(svc.meetingRecordSchema, req.body)));
}));
// ── Compliance calendar ────────────────────────────────────────────────────
iqacRouter.get('/compliance-items', asyncHandler(async (req, res) => {
    res.json(await svc.listComplianceItems(actor(req)));
}));
iqacRouter.post('/compliance-items', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createComplianceItem(actor(req), validate(svc.complianceItemSchema, req.body)));
}));
iqacRouter.patch('/compliance-items/:id', asyncHandler(async (req, res) => {
    res.json(await svc.updateComplianceItem(actor(req), Number(req.params.id), validate(svc.complianceUpdateSchema, req.body)));
}));
