/**
 * Succession Planning — HTTP router. Mounted at /api/hr/succession.
 */
import { Router } from 'express';
import { asyncHandler } from '../../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../../middleware/auth.js';
import type { HrActor } from '../types.js';
import { enrichHrActor } from '../../academicLeadership/leadership.js';
import * as roles from './criticalRoles.js';
import * as talent from './talent.js';
import * as slate from './slate.js';
import * as dash from './dashboard.js';
import {
  criticalRoleSchema, criticalRoleUpdateSchema, assessmentSchema, assessmentUpdateSchema, poolSchema, poolMemberSchema,
  nominateSchema, candidateDecisionSchema, readinessReviewSchema, devActionSchema, devActionStatusSchema, eventSchema, eventDecisionSchema,
} from './types.js';

function baseActor(req: AuthedRequest): HrActor {
  return { facultyUserId: req.user!.facultyUserId, collegeId: req.user!.collegeId, departmentId: req.user!.departmentId ?? null, role: req.user!.role, name: req.user!.name };
}
function actor(req: AuthedRequest): HrActor {
  return (req as AuthedRequest & { hrActor?: HrActor }).hrActor ?? baseActor(req);
}
async function attachHrLeadership(req: AuthedRequest, _res: unknown, next: (err?: unknown) => void) {
  try { (req as AuthedRequest & { hrActor?: HrActor }).hrActor = await enrichHrActor(baseActor(req)); next(); } catch (err) { next(err); }
}

export const successionRouter = Router();
successionRouter.use(requireAuth);
successionRouter.use(attachHrLeadership);

const j = (fn: (req: AuthedRequest) => Promise<unknown> | unknown) => asyncHandler(async (req: AuthedRequest, res) => res.json(await fn(req)));
const num = (v: unknown) => (v == null || v === '' ? undefined : Number(v));

// ── Dashboard / coverage / risk / reports ────────────────────────────────────
successionRouter.get('/dashboard', j((req) => dash.dashboard(actor(req))));
successionRouter.get('/coverage', j((req) => dash.coverageMetrics(actor(req))));
successionRouter.get('/risk', j((req) => dash.talentRisk(actor(req))));
successionRouter.get('/reports/coverage', j((req) => dash.coverageReport(actor(req))));
successionRouter.get('/me/development', j((req) => dash.myDevelopment(actor(req))));

// ── Critical roles ───────────────────────────────────────────────────────────
successionRouter.get('/critical-roles', j((req) => roles.listRoles(actor(req), { criticality: req.query.criticality as string, active: req.query.active === undefined ? undefined : req.query.active === 'true', departmentId: num(req.query.departmentId) })));
successionRouter.post('/critical-roles', j((req) => roles.createRole(actor(req), criticalRoleSchema.parse(req.body))));
successionRouter.get('/critical-roles/:id', j((req) => roles.getRole(actor(req), Number(req.params.id))));
successionRouter.patch('/critical-roles/:id', j((req) => roles.updateRole(actor(req), Number(req.params.id), criticalRoleUpdateSchema.parse(req.body))));
successionRouter.post('/critical-roles/:id/active', j((req) => roles.setRoleActive(actor(req), Number(req.params.id), (req.body as { active?: boolean }).active !== false)));
successionRouter.get('/critical-roles/:id/candidates', j((req) => slate.listCandidates(actor(req), Number(req.params.id))));

// ── Talent assessments / matrix ──────────────────────────────────────────────
successionRouter.get('/assessments', j((req) => talent.listAssessments(actor(req), { employeeId: num(req.query.employeeId), period: req.query.period as string, status: req.query.status as string })));
successionRouter.post('/assessments', j((req) => talent.createAssessment(actor(req), assessmentSchema.parse(req.body))));
successionRouter.patch('/assessments/:id', j((req) => talent.updateAssessment(actor(req), Number(req.params.id), assessmentUpdateSchema.parse(req.body))));
successionRouter.post('/assessments/:id/finalize', j((req) => talent.finalizeAssessment(actor(req), Number(req.params.id))));
successionRouter.post('/assessments/:id/correct', j((req) => talent.correctAssessment(actor(req), Number(req.params.id))));
successionRouter.get('/matrix', j((req) => talent.talentMatrix(actor(req))));

// ── Talent pools ─────────────────────────────────────────────────────────────
successionRouter.get('/pools', j((req) => talent.listPools(actor(req))));
successionRouter.post('/pools', j((req) => talent.createPool(actor(req), poolSchema.parse(req.body))));
successionRouter.get('/pools/:id/members', j((req) => talent.listPoolMembers(actor(req), Number(req.params.id))));
successionRouter.post('/pools/:id/members', j((req) => talent.addPoolMember(actor(req), Number(req.params.id), poolMemberSchema.parse(req.body))));
successionRouter.post('/pools/:id/members/:memberId/remove', j((req) => talent.removePoolMember(actor(req), Number(req.params.id), Number(req.params.memberId))));

// ── Slate: nominations / approvals / readiness ───────────────────────────────
successionRouter.post('/nominations', j((req) => slate.nominate(actor(req), nominateSchema.parse(req.body))));
successionRouter.post('/candidates/:id/approve', j((req) => slate.decideCandidate(actor(req), Number(req.params.id), 'APPROVE', candidateDecisionSchema.parse(req.body).remarks)));
successionRouter.post('/candidates/:id/reject', j((req) => slate.decideCandidate(actor(req), Number(req.params.id), 'REJECT', candidateDecisionSchema.parse(req.body).remarks)));
successionRouter.post('/candidates/:id/withdraw', j((req) => slate.withdrawCandidate(actor(req), Number(req.params.id))));
successionRouter.post('/candidates/:id/readiness', j((req) => slate.reviewReadiness(actor(req), Number(req.params.id), readinessReviewSchema.parse(req.body))));
successionRouter.get('/candidates/:id/readiness', j((req) => slate.readinessHistory(actor(req), Number(req.params.id))));

// ── Development actions ──────────────────────────────────────────────────────
successionRouter.get('/development-actions', j((req) => slate.listDevActions(actor(req), { employeeId: num(req.query.employeeId), candidateId: num(req.query.candidateId), status: req.query.status as string })));
successionRouter.post('/development-actions', j((req) => slate.createDevAction(actor(req), devActionSchema.parse(req.body))));
successionRouter.post('/development-actions/:id/status', j((req) => slate.setDevActionStatus(actor(req), Number(req.params.id), devActionStatusSchema.parse(req.body))));

// ── Succession events ────────────────────────────────────────────────────────
successionRouter.get('/events', j((req) => slate.listEvents(actor(req), req.query.status as string)));
successionRouter.post('/events', j((req) => slate.openEvent(actor(req), eventSchema.parse(req.body))));
successionRouter.post('/events/:id/decision', j((req) => slate.decideEvent(actor(req), Number(req.params.id), eventDecisionSchema.parse(req.body))));
successionRouter.post('/events/:id/close', j((req) => slate.closeEvent(actor(req), Number(req.params.id))));

// ── Exports ──────────────────────────────────────────────────────────────────
successionRouter.get('/export/:report', asyncHandler(async (req: AuthedRequest, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
  const file = await dash.exportReport(actor(req), String(req.params.report), format);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.body);
}));
