/**
 * Employee L&D — HTTP router. Mounted at /api/hr/ld.
 */
import { Router } from 'express';
import { asyncHandler } from '../../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../../middleware/auth.js';
import type { HrActor } from '../types.js';
import { enrichHrActor } from '../../academicLeadership/leadership.js';
import * as catalogue from './catalogue.js';
import * as needs from './needs.js';
import * as enrollment from './enrollment.js';
import * as delivery from './delivery.js';
import * as history from './history.js';
import {
  providerSchema, courseSchema, courseUpdateSchema, programSchema, programUpdateSchema, programStatusSchema, sessionSchema,
  devNeedSchema, devNeedTransitionSchema, nominationSchema, nominationDecisionSchema, enrollSchema,
  attendanceSchema, completionSchema, certificateIssueSchema, externalCertSchema, certVerifySchema, feedbackSchema, managerReviewSchema,
} from './types.js';

function baseActor(req: AuthedRequest): HrActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}
function actor(req: AuthedRequest): HrActor {
  return (req as AuthedRequest & { hrActor?: HrActor }).hrActor ?? baseActor(req);
}
async function attachHrLeadership(req: AuthedRequest, _res: unknown, next: (err?: unknown) => void) {
  try {
    (req as AuthedRequest & { hrActor?: HrActor }).hrActor = await enrichHrActor(baseActor(req));
    next();
  } catch (err) {
    next(err);
  }
}

export const ldRouter = Router();
ldRouter.use(requireAuth);
ldRouter.use(attachHrLeadership);

const j = (fn: (req: AuthedRequest) => Promise<unknown> | unknown) =>
  asyncHandler(async (req: AuthedRequest, res) => res.json(await fn(req)));
const num = (v: unknown) => (v == null || v === '' ? undefined : Number(v));

// ── Providers / catalogue / programs ─────────────────────────────────────────
ldRouter.get('/providers', j((req) => catalogue.listProviders(actor(req))));
ldRouter.post('/providers', j((req) => catalogue.createProvider(actor(req), providerSchema.parse(req.body))));

ldRouter.get('/courses', j((req) => catalogue.listCourses(actor(req), { category: req.query.category as string, status: req.query.status as string })));
ldRouter.post('/courses', j((req) => catalogue.createCourse(actor(req), courseSchema.parse(req.body))));
ldRouter.patch('/courses/:id', j((req) => catalogue.updateCourse(actor(req), Number(req.params.id), courseUpdateSchema.parse(req.body))));
ldRouter.post('/courses/:id/archive', j((req) => catalogue.archiveCourse(actor(req), Number(req.params.id))));

ldRouter.get('/catalogue', j((req) => catalogue.browseCatalogue(actor(req))));
ldRouter.get('/programs', j((req) => catalogue.listPrograms(actor(req), { status: req.query.status as string, category: req.query.category as string })));
ldRouter.post('/programs', j((req) => catalogue.createProgram(actor(req), programSchema.parse(req.body))));
ldRouter.get('/programs/:id', j((req) => catalogue.getProgram(actor(req), Number(req.params.id))));
ldRouter.patch('/programs/:id', j((req) => catalogue.updateProgram(actor(req), Number(req.params.id), programUpdateSchema.parse(req.body))));
ldRouter.post('/programs/:id/status', j((req) => {
  const b = programStatusSchema.parse(req.body);
  return catalogue.changeProgramStatus(actor(req), Number(req.params.id), b.status, b.reason);
}));
ldRouter.post('/programs/:id/sessions', j((req) => catalogue.addSession(actor(req), Number(req.params.id), sessionSchema.parse(req.body))));

// ── Development needs ────────────────────────────────────────────────────────
ldRouter.get('/needs', j((req) => needs.listNeeds(actor(req), { employeeId: num(req.query.employeeId), status: req.query.status as string })));
ldRouter.post('/needs', j((req) => needs.createNeed(actor(req), devNeedSchema.parse(req.body))));
ldRouter.post('/needs/:id/transition', j((req) => {
  const b = devNeedTransitionSchema.parse(req.body);
  return needs.transitionNeed(actor(req), Number(req.params.id), b.status, b.reason);
}));

// ── Nominations & enrollment ─────────────────────────────────────────────────
ldRouter.post('/nominations', j((req) => enrollment.createNomination(actor(req), nominationSchema.parse(req.body))));
ldRouter.post('/nominations/:id/approve', j((req) => enrollment.decideNomination(actor(req), Number(req.params.id), 'APPROVE', nominationDecisionSchema.parse(req.body).reason)));
ldRouter.post('/nominations/:id/reject', j((req) => enrollment.decideNomination(actor(req), Number(req.params.id), 'REJECT', nominationDecisionSchema.parse(req.body).reason)));
ldRouter.post('/nominations/:id/withdraw', j((req) => enrollment.withdrawNomination(actor(req), Number(req.params.id))));

ldRouter.post('/enroll', j((req) => {
  const b = enrollSchema.parse(req.body);
  return enrollment.enroll(actor(req), b.programId, num((req.body as Record<string, unknown>).employeeId));
}));
ldRouter.post('/enrollments/:id/cancel', j((req) => enrollment.cancelEnrollment(actor(req), Number(req.params.id))));
ldRouter.get('/programs/:id/enrollments', j((req) => enrollment.listProgramEnrollments(actor(req), Number(req.params.id))));
ldRouter.get('/me/enrollments', j((req) => enrollment.listMyEnrollments(actor(req))));

// ── Attendance & completion ──────────────────────────────────────────────────
ldRouter.post('/programs/:id/attendance', j((req) => delivery.recordAttendance(actor(req), Number(req.params.id), attendanceSchema.parse(req.body))));
ldRouter.post('/programs/:id/attendance/finalize', j((req) => delivery.finalizeAttendance(actor(req), Number(req.params.id), num((req.body as Record<string, unknown>).sessionId) ?? null)));
ldRouter.post('/programs/:id/completion', j((req) => delivery.recordCompletion(actor(req), Number(req.params.id), completionSchema.parse(req.body))));

// ── Certificates ─────────────────────────────────────────────────────────────
ldRouter.post('/programs/:id/certificate', j((req) => delivery.issueCertificate(actor(req), Number(req.params.id), certificateIssueSchema.parse(req.body))));
ldRouter.post('/certificates/external', j((req) => delivery.submitExternalCertificate(actor(req), externalCertSchema.parse(req.body))));
ldRouter.post('/certificates/:id/verify', j((req) => delivery.verifyCertificate(actor(req), Number(req.params.id), certVerifySchema.parse(req.body))));
ldRouter.get('/me/certificates', j((req) => delivery.listMyCertificates(actor(req))));
ldRouter.get('/certificates/:id', j((req) => delivery.getCertificate(actor(req), Number(req.params.id))));

// ── Effectiveness ────────────────────────────────────────────────────────────
ldRouter.post('/feedback', j((req) => delivery.submitFeedback(actor(req), feedbackSchema.parse(req.body))));
ldRouter.post('/manager-review', j((req) => delivery.managerReview(actor(req), managerReviewSchema.parse(req.body))));

// ── History / dashboards / reports ───────────────────────────────────────────
ldRouter.get('/me/overview', j((req) => history.employeeOverview(actor(req))));
ldRouter.get('/me/history', j((req) => history.developmentHistory(actor(req))));
ldRouter.get('/history/:employeeId', j((req) => history.developmentHistory(actor(req), Number(req.params.employeeId))));
ldRouter.get('/dashboard', j((req) => history.adminDashboard(actor(req))));
ldRouter.get('/mandatory-compliance', j((req) => history.mandatoryCompliance(actor(req))));
ldRouter.get('/metrics', j((req) => history.ldMetrics(actor(req))));
ldRouter.get('/reports/certificate-expiry', j((req) => history.certificateExpiry(actor(req), num(req.query.withinDays) ?? 90)));

ldRouter.get('/export/:report', asyncHandler(async (req: AuthedRequest, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
  const file = await history.exportReport(actor(req), String(req.params.report), format, num(req.query.programId));
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.send(file.body);
}));
