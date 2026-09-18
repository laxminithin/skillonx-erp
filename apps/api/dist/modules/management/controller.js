/**
 * Management & Executive Portal — HTTP surface (/api/management/*).
 *
 * A coherent read + govern API family. Every route is authenticated, attaches
 * a leadership-enriched actor, and requires the executive to hold at least
 * `management.dashboard.view`. Individual aggregation services enforce their
 * finer `management.*` capability and, transitively, the canonical domain
 * capability. Nothing here mutates domain state except the approvals `act`
 * route, which dispatches to the canonical domain service.
 */
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { enrichHrActor } from '../academicLeadership/leadership.js';
import { assertManagementActor, managementCapabilities } from './access.js';
import { domainActor } from './sources.js';
import * as overview from './overview.js';
import * as academics from './academics.js';
import * as workforce from './workforce.js';
import * as finance from './finance.js';
import * as campus from './campus.js';
import * as placement from './placement.js';
import * as approvals from './approvals.js';
import * as exceptions from './exceptions.js';
import * as departments from './departments.js';
import * as reports from './reports.js';
function baseActor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
async function attachActor(req, _res, next) {
    try {
        const enriched = await enrichHrActor(domainActor(baseActor(req)));
        req.mgmtActor = enriched;
        next();
    }
    catch (err) {
        next(err);
    }
}
function actor(req) {
    return req.mgmtActor ?? baseActor(req);
}
function requireManagement(req, _res, next) {
    try {
        assertManagementActor(actor(req));
        next();
    }
    catch (err) {
        next(err);
    }
}
export const managementRouter = Router();
managementRouter.use(requireAuth);
managementRouter.use(attachActor);
managementRouter.use(requireManagement);
managementRouter.get('/me', asyncHandler(async (req, res) => {
    const a = actor(req);
    res.json({ role: a.role, leadershipRoles: a.leadershipRoles ?? [], capabilities: managementCapabilities(a) });
}));
// ── Command Center ──────────────────────────────────────────────────────────
managementRouter.get('/overview', asyncHandler(async (req, res) => {
    res.json(await overview.commandCenter(actor(req)));
}));
// ── Academics ─────────────────────────────────────────────────────────────
managementRouter.get('/academics', asyncHandler(async (req, res) => {
    res.json(await academics.academicOverview(actor(req)));
}));
managementRouter.get('/academics/performance', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await academics.studentPerformance(actor(req), departmentId));
}));
managementRouter.get('/academics/delivery', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await academics.courseDelivery(actor(req), departmentId));
}));
managementRouter.get('/academics/outcomes', asyncHandler(async (req, res) => {
    res.json(await academics.outcomeAttainment(actor(req)));
}));
// ── People / HR ───────────────────────────────────────────────────────────
managementRouter.get('/workforce', asyncHandler(async (req, res) => {
    res.json(await workforce.workforceOverview(actor(req)));
}));
managementRouter.get('/recruitment', asyncHandler(async (req, res) => {
    res.json(await workforce.recruitmentOverview(actor(req)));
}));
managementRouter.get('/performance', asyncHandler(async (req, res) => {
    res.json(await workforce.performanceOverview(actor(req)));
}));
managementRouter.get('/ld', asyncHandler(async (req, res) => {
    res.json(await workforce.ldOverview(actor(req)));
}));
managementRouter.get('/succession', asyncHandler(async (req, res) => {
    res.json(await workforce.successionOverview(actor(req)));
}));
// ── Career Outcomes ─────────────────────────────────────────────────────────
managementRouter.get('/placement', asyncHandler(async (req, res) => {
    const seasonId = req.query.seasonId ? Number(req.query.seasonId) : undefined;
    res.json(await placement.placementOverview(actor(req), seasonId));
}));
// ── Finance ─────────────────────────────────────────────────────────────────
managementRouter.get('/finance', asyncHandler(async (req, res) => {
    res.json(await finance.financeOverview(actor(req)));
}));
managementRouter.get('/payroll/summary', asyncHandler(async (req, res) => {
    res.json(await finance.payrollSummary(actor(req)));
}));
// ── Campus ──────────────────────────────────────────────────────────────────
managementRouter.get('/campus', asyncHandler(async (req, res) => {
    res.json(await campus.campusOverview(actor(req)));
}));
managementRouter.get('/campus/library', asyncHandler(async (req, res) => {
    res.json(await campus.libraryOverview(actor(req)));
}));
managementRouter.get('/campus/hostel', asyncHandler(async (req, res) => {
    res.json(await campus.hostelOverview(actor(req)));
}));
managementRouter.get('/campus/transport', asyncHandler(async (req, res) => {
    res.json(await campus.transportOverview(actor(req)));
}));
// ── Governance: Approvals ─────────────────────────────────────────────────────
managementRouter.get('/approvals', asyncHandler(async (req, res) => {
    res.json(await approvals.listApprovals(actor(req)));
}));
const approvalActionSchema = z.object({
    domain: z.enum(['LEAVE', 'RECRUITMENT']),
    id: z.number().int().positive(),
    action: z.enum(['APPROVE', 'REJECT']),
    notes: z.string().max(2000).optional(),
});
managementRouter.post('/approvals/act', asyncHandler(async (req, res) => {
    const body = validate(approvalActionSchema, req.body);
    res.json(await approvals.actOnApproval(actor(req), body));
}));
// ── Governance: Risks & Exceptions ────────────────────────────────────────────
managementRouter.get('/exceptions', asyncHandler(async (req, res) => {
    res.json(await exceptions.listExceptions(actor(req)));
}));
// ── Department Scorecards ─────────────────────────────────────────────────────
managementRouter.get('/departments', asyncHandler(async (req, res) => {
    res.json(await departments.departmentScorecards(actor(req)));
}));
managementRouter.get('/departments/:id', asyncHandler(async (req, res) => {
    res.json(await departments.departmentDetail(actor(req), Number(req.params.id)));
}));
// ── Reports ───────────────────────────────────────────────────────────────────
managementRouter.get('/reports', asyncHandler(async (_req, res) => {
    res.json({ reports: reports.availableReports() });
}));
managementRouter.get('/reports/snapshot', asyncHandler(async (req, res) => {
    res.json(await reports.executiveSnapshot(actor(req)));
}));
managementRouter.get('/reports/snapshot.csv', asyncHandler(async (req, res) => {
    const { filename, csv } = await reports.exportSnapshotCsv(actor(req));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
}));
