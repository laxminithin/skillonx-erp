import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { requireStudentAuth, type StudentAuthedRequest } from '../../middleware/auth.js';
import {
  assignMentorSchema,
  bulkAssignMentorSchema,
  createSessionSchema,
  updateSessionSchema,
  completeFollowUpSchema,
  createActionSchema,
  updateActionSchema,
  createEscalationSchema,
  resolveEscalationSchema,
  createReferralSchema,
  closeReferralSchema,
  createParentInteractionSchema,
  riskConfigSchema,
  type MentoringActor,
} from './types.js';
import * as allocation from './allocation.js';
import * as sessions from './sessions.js';
import * as escalations from './escalations.js';
import * as student360 from './student360.js';
import * as dashboard from './dashboard.js';
import * as oversight from './oversight.js';
import * as config from './config.js';
import * as studentView from './student.js';
import {
  assertAllocationPermission,
  assertMentorOf,
  leadershipContext,
  assertHodOrAbove,
  assertPrincipalOrAbove,
} from './permissions.js';
import { isAdminRole } from '../../utils/permissions.js';
import { AppError } from '../../utils/errors.js';

function actor(req: AuthedRequest): MentoringActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId,
    role: req.user!.role,
    name: req.user!.name,
  };
}

function qNum(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new AppError(400, 'A valid studentId is required');
  return n;
}

// ── Faculty / mentor / leadership router ────────────────────────────────
export const mentoringRouter = Router();
mentoringRouter.use(requireAuth);

mentoringRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.mentorDashboard(actor(req)));
}));

mentoringRouter.get('/mentees', asyncHandler(async (req: AuthedRequest, res) => {
  const q = req.query;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
  const bool = (v: unknown) => v === '1' || v === 'true';
  const filters = {
    semester: str(q.semester),
    section: str(q.section),
    riskLevel: str(q.riskLevel),
    attendanceShortage: bool(q.attendanceShortage),
    academicPerformance: str(q.academicPerformance),
    pendingAction: bool(q.pendingAction),
  };
  res.json({ mentees: await dashboard.listMentees(actor(req), filters) });
}));

mentoringRouter.get('/follow-ups', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.listFollowUps(actor(req)));
}));

mentoringRouter.get('/students/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await student360.student360(actor(req), Number(req.params.id)));
}));

// Sessions
mentoringRouter.get('/sessions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ sessions: await sessions.listSessions(actor(req), qNum(req.query.studentId)) });
}));
mentoringRouter.post('/sessions', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await sessions.createSession(actor(req), validate(createSessionSchema, req.body)));
}));
mentoringRouter.get('/sessions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.getSession(actor(req), Number(req.params.id)));
}));
mentoringRouter.patch('/sessions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.updateSession(actor(req), Number(req.params.id), validate(updateSessionSchema, req.body)));
}));
mentoringRouter.post('/sessions/:id/follow-up/complete', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(completeFollowUpSchema, req.body ?? {});
  res.json(await sessions.completeFollowUp(actor(req), Number(req.params.id), body.outcome));
}));

// Actions
mentoringRouter.get('/actions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ actions: await sessions.listActions(actor(req), qNum(req.query.studentId)) });
}));
mentoringRouter.post('/actions', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await sessions.createAction(actor(req), validate(createActionSchema, req.body)));
}));
mentoringRouter.patch('/actions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.updateAction(actor(req), Number(req.params.id), validate(updateActionSchema, req.body)));
}));

// Escalations (mentor-raised)
mentoringRouter.get('/escalations', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ escalations: await escalations.listMentorEscalations(actor(req)) });
}));
mentoringRouter.post('/escalations', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await escalations.createEscalation(actor(req), validate(createEscalationSchema, req.body)));
}));

// Referrals
mentoringRouter.get('/referrals', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ referrals: await escalations.listReferrals(actor(req), qNum(req.query.studentId)) });
}));
mentoringRouter.post('/referrals', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await escalations.createReferral(actor(req), validate(createReferralSchema, req.body)));
}));
mentoringRouter.post('/referrals/:id/close', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await escalations.closeReferral(actor(req), Number(req.params.id), validate(closeReferralSchema, req.body ?? {})));
}));

// Parent interactions
mentoringRouter.get('/parent-interactions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ interactions: await escalations.listParentInteractions(actor(req), qNum(req.query.studentId)) });
}));
mentoringRouter.post('/parent-interactions', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await escalations.createParentInteraction(actor(req), validate(createParentInteractionSchema, req.body)));
}));

// ── Allocation (HOD / Principal / Admin) ────────────────────────────────
mentoringRouter.post('/allocation/assign', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertAllocationPermission(a);
  const body = validate(assignMentorSchema, req.body);
  const ctx = await leadershipContext(a);
  res.json(await allocation.assignMentor(a, ctx, body.studentId, body.mentorFacultyId, body.academicYearId));
}));
mentoringRouter.post('/allocation/bulk-assign', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertAllocationPermission(a);
  const body = validate(bulkAssignMentorSchema, req.body);
  const ctx = await leadershipContext(a);
  res.json(await allocation.bulkAssignMentor(a, ctx, body.studentIds, body.mentorFacultyId, body.academicYearId));
}));
mentoringRouter.get('/allocation/workload', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertAllocationPermission(a);
  const ctx = await leadershipContext(a);
  const scope = isAdminRole(a.role) || ctx.isPrincipal || a.role === 'PRINCIPAL' ? null : ctx.hodDepartmentIds;
  res.json({ workload: await allocation.mentorWorkload(a, scope) });
}));
mentoringRouter.get('/allocation/unassigned', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertAllocationPermission(a);
  const ctx = await leadershipContext(a);
  const scope = isAdminRole(a.role) || ctx.isPrincipal || a.role === 'PRINCIPAL' ? null : ctx.hodDepartmentIds;
  res.json(await allocation.unassignedStudents(a, scope));
}));
mentoringRouter.get('/allocation/history', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const studentId = qNum(req.query.studentId);
  // Mentor of the student, or allocation admin, may view history.
  if (!isAdminRole(a.role) && !allocationAdmin(a)) {
    await assertMentorOf(a, studentId);
  }
  res.json({ history: await allocation.assignmentHistory(a.collegeId, studentId) });
}));

function allocationAdmin(a: MentoringActor) {
  return ['PRINCIPAL', 'HOD'].includes(a.role);
}

// ── Leadership oversight ────────────────────────────────────────────────
mentoringRouter.get('/hod', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const ctx = await leadershipContext(a);
  assertHodOrAbove(ctx, a);
  const requested = req.query.departmentId ? [Number(req.query.departmentId)] : null;
  let deptIds: number[];
  if (isAdminRole(a.role) || ctx.isPrincipal) {
    deptIds = requested ?? (await allDepartmentIds(a.collegeId));
  } else {
    deptIds = requested ? requested.filter((d) => ctx.hodDepartmentIds.includes(d)) : ctx.hodDepartmentIds;
    if (deptIds.length === 0) throw new AppError(403, 'No department in your scope');
  }
  res.json(await oversight.hodMentoring(a, deptIds));
}));

mentoringRouter.get('/principal', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const ctx = await leadershipContext(a);
  assertPrincipalOrAbove(ctx, a);
  res.json(await oversight.principalMentoring(a));
}));

mentoringRouter.get('/management', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  // Institution executives (Management/Chairman/admins) and the Principal may
  // view the de-identified aggregate analytics; department/faculty roles cannot.
  if (a.role === 'MANAGEMENT' || a.role === 'CHAIRMAN' || isAdminRole(a.role)) {
    // fast path — no leadership lookup needed
  } else {
    const ctx = await leadershipContext(a);
    assertPrincipalOrAbove(ctx, a);
  }
  res.json(await oversight.managementMentoring(a));
}));

mentoringRouter.get('/oversight/escalations', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const ctx = await leadershipContext(a);
  assertHodOrAbove(ctx, a);
  const scope = isAdminRole(a.role) || ctx.isPrincipal ? null : ctx.hodDepartmentIds;
  const level = req.query.level === 'PRINCIPAL' ? 'PRINCIPAL' : req.query.level === 'HOD' ? 'HOD' : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json({ escalations: await escalations.listLeadershipEscalations(a, { departmentIds: scope, level, status }) });
}));

mentoringRouter.post('/oversight/escalations/:id/resolve', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const ctx = await leadershipContext(a);
  assertHodOrAbove(ctx, a);
  const scope = isAdminRole(a.role) || ctx.isPrincipal ? null : ctx.hodDepartmentIds;
  res.json(await escalations.resolveEscalation(a, Number(req.params.id), scope, validate(resolveEscalationSchema, req.body)));
}));

// ── Risk configuration ──────────────────────────────────────────────────
mentoringRouter.get('/config', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const ctx = await leadershipContext(a);
  assertHodOrAbove(ctx, a); // HOD / Principal / Management / Admin may view
  res.json(await config.getRiskConfigView(a.collegeId));
}));
mentoringRouter.put('/config', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await config.updateRiskConfig(actor(req), validate(riskConfigSchema, req.body)));
}));

async function allDepartmentIds(collegeId: number): Promise<number[]> {
  const { db } = await import('../../db/index.js');
  const rows = await db('departments').where({ college_id: collegeId }).select('id');
  return rows.map((r) => Number(r.id));
}

// ── Student-facing router ────────────────────────────────────────────────
export const studentMentoringRouter = Router();
studentMentoringRouter.use(requireStudentAuth);

studentMentoringRouter.get('/mentoring/mentor', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await studentView.myMentor(req.user!.studentId, req.user!.collegeId));
}));
studentMentoringRouter.get('/mentoring/meetings', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ meetings: await studentView.myMeetings(req.user!.studentId, req.user!.collegeId) });
}));
studentMentoringRouter.get('/mentoring/actions', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ actions: await studentView.myActions(req.user!.studentId, req.user!.collegeId) });
}));
studentMentoringRouter.get('/mentoring/follow-ups', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ followUps: await studentView.myFollowUps(req.user!.studentId, req.user!.collegeId) });
}));
