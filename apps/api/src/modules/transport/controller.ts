import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import type { TransportActor } from './types.js';
import {
  assertTransportPermission,
  getDriverPersonnelId,
  assertDriverTripAccess,
} from './access.js';
import { getStudentTransportAccess } from './studentAccess.js';
import * as applications from './applications.js';
import * as assignments from './assignments.js';
import * as passes from './passes.js';
import * as trips from './trips.js';
import * as boarding from './boarding.js';
import * as routes from './routes.js';
import * as vehicles from './vehicles.js';
import * as complaints from './complaints.js';
import * as changes from './changes.js';
import * as clearance from './clearance.js';
import * as integration from './integration.js';
import * as dashboard from './dashboard.js';
import { listStops as listPublicStops } from './defaults.js';
import {
  transportApplicationSchema,
  changeRequestSchema,
  complaintSchema,
  stopSchema,
  routeSchema,
  vehicleSchema,
  assignmentSchema,
} from './types.js';

const passVerifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function actor(req: AuthedRequest): TransportActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

// ── Student router ──────────────────────────────────────────────────────
export const studentTransportRouter = Router();
studentTransportRouter.use(requireStudentAuth);

studentTransportRouter.get('/transport/access', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId));
}));

studentTransportRouter.get('/transport', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  const application = await applications.getStudentApplication(req.user!.studentId, req.user!.collegeId);
  const assignment = access.canAccessOperations
    ? await assignments.getStudentAssignment(req.user!.studentId, req.user!.collegeId)
    : null;
  const pass = access.canAccessOperations
    ? await passes.getStudentPass(req.user!.studentId, req.user!.collegeId)
    : null;
  const dues = await integration.getStudentTransportDues(req.user!.studentId, req.user!.collegeId);
  const todayTrips = access.canAccessOperations
    ? await trips.getTodayTripsForStudent(req.user!.studentId, req.user!.collegeId)
    : [];
  res.json({ access, application, assignment, pass, dues, todayTrips, gpsConfigured: false });
}));

studentTransportRouter.get('/transport/application', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({
    application: await applications.getStudentApplication(req.user!.studentId, req.user!.collegeId),
    stops: await listPublicStops(req.user!.collegeId),
  });
}));

studentTransportRouter.post('/transport/application', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const body = validate(transportApplicationSchema, req.body);
  res.status(201).json(await applications.createOrUpdateApplication(req.user!.studentId, req.user!.collegeId, body));
}));

studentTransportRouter.patch('/transport/application/:id', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const body = validate(transportApplicationSchema, req.body);
  res.json(await applications.createOrUpdateApplication(req.user!.studentId, req.user!.collegeId, body, Number(req.params.id)));
}));

studentTransportRouter.post('/transport/application/:id/submit', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await applications.submitApplication(req.user!.studentId, req.user!.collegeId, Number(req.params.id)));
}));

studentTransportRouter.post('/transport/application/:id/cancel', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await applications.cancelApplication(req.user!.studentId, req.user!.collegeId, Number(req.params.id)));
}));

studentTransportRouter.get('/transport/assignment', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Transport access required' });
  res.json({ assignment: await assignments.getStudentAssignment(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.get('/transport/route', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Transport access required' });
  res.json({ assignment: await assignments.getStudentAssignment(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.get('/transport/pass', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Transport access required' });
  res.json({ pass: await passes.getStudentPass(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.get('/transport/trips/today', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Transport access required' });
  res.json({ trips: await trips.getTodayTripsForStudent(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.get('/transport/changes', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ changes: await changes.listStudentChanges(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.post('/transport/changes', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Active transport required' });
  const body = validate(changeRequestSchema, req.body);
  res.status(201).json(await changes.createChangeRequest(req.user!.studentId, req.user!.collegeId, body));
}));

studentTransportRouter.get('/transport/complaints', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ complaints: await complaints.listStudentComplaints(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.post('/transport/complaints', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const body = validate(complaintSchema, req.body);
  res.status(201).json(await complaints.createStudentComplaint(req.user!.studentId, req.user!.collegeId, body));
}));

studentTransportRouter.get('/transport/dues', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await integration.getStudentTransportDues(req.user!.studentId, req.user!.collegeId));
}));

studentTransportRouter.get('/transport/clearance', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await clearance.getStudentClearance(req.user!.studentId, req.user!.collegeId));
}));

studentTransportRouter.get('/transport/history', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json({ history: await assignments.getAssignmentHistory(req.user!.studentId, req.user!.collegeId) });
}));

studentTransportRouter.post('/transport/cancellation', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const access = await getStudentTransportAccess(req.user!.studentId, req.user!.collegeId);
  if (!access.canAccessOperations) return res.status(403).json({ error: 'Active transport required' });
  const body = validate(z.object({ reason: z.string().min(1), effectiveDate: z.string().optional() }), req.body);
  res.status(201).json(await changes.requestCancellation(req.user!.studentId, req.user!.collegeId, body.reason, body.effectiveDate));
}));

// ── Staff transport router ──────────────────────────────────────────────
export const transportRouter = Router();
transportRouter.use(requireAuth);

transportRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getAdminDashboard(actor(req)));
}));

transportRouter.get('/applications', asyncHandler(async (req: AuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  res.json({ applications: await applications.listApplications(actor(req), { status, cycleId }) });
}));

transportRouter.post('/applications/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({
    decision: z.enum(['APPROVE', 'REJECT', 'WAITLIST']),
    rejectionReason: z.string().optional(),
    routeId: z.number().optional(),
  }), req.body);
  res.json(await applications.reviewApplication(actor(req), Number(req.params.id), body.decision, body));
}));

transportRouter.post('/assignments', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(assignmentSchema, req.body);
  res.status(201).json(await assignments.assignRoute(actor(req), body));
}));

transportRouter.post('/assignments/dry-run', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({
    assignments: z.array(z.object({
      applicationId: z.number(),
      routeId: z.number(),
      pickupStopId: z.number(),
      dropStopId: z.number(),
    })),
  }), req.body);
  res.json(await assignments.bulkAssignDryRun(actor(req), body.assignments));
}));

transportRouter.get('/stops', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ stops: await routes.listStops(actor(req)) });
}));

transportRouter.post('/stops', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(stopSchema, req.body);
  res.status(201).json(await routes.createStop(actor(req), body));
}));

transportRouter.get('/routes', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ routes: await routes.listRoutes(actor(req)) });
}));

transportRouter.post('/routes', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(routeSchema, req.body);
  res.status(201).json(await routes.createRoute(actor(req), body));
}));

transportRouter.get('/routes/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await routes.getRouteWithStops(Number(req.params.id), actor(req).collegeId));
}));

transportRouter.put('/routes/:id/stops', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({
    stops: z.array(z.object({
      stopId: z.number(),
      sequenceNumber: z.number(),
      scheduledPickupTime: z.string().optional(),
      scheduledDropTime: z.string().optional(),
      boardingAllowed: z.boolean().optional(),
      alightingAllowed: z.boolean().optional(),
    })),
  }), req.body);
  res.json(await routes.setRouteStops(actor(req), Number(req.params.id), body.stops));
}));

transportRouter.post('/routes/:id/activate', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await routes.activateRoute(actor(req), Number(req.params.id)));
}));

transportRouter.get('/vehicles', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ vehicles: await vehicles.listVehicles(actor(req)) });
}));

transportRouter.post('/vehicles', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(vehicleSchema, req.body);
  res.status(201).json(await vehicles.createVehicle(actor(req), body));
}));

transportRouter.get('/compliance', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await vehicles.getComplianceDashboard(actor(req)));
}));

transportRouter.post('/route-vehicle-assignments', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({ routeId: z.number(), vehicleId: z.number(), shiftType: z.string().optional() }), req.body);
  res.status(201).json(await vehicles.assignVehicleToRoute(actor(req), body.routeId, body.vehicleId, body.shiftType));
}));

transportRouter.get('/trips', asyncHandler(async (req: AuthedRequest, res) => {
  const { db } = await import('../../db/index.js');
  const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10);
  const rows = await db('transport_trips as t')
    .leftJoin('transport_routes as r', 'r.id', 't.route_id')
    .where({ 't.college_id': actor(req).collegeId, 't.trip_date': date })
    .select('t.*', 'r.name as route_name')
    .orderBy('t.scheduled_start_at');
  res.json({ trips: rows });
}));

transportRouter.post('/trips/generate', asyncHandler(async (req: AuthedRequest, res) => {
  assertTransportPermission(actor(req), 'transport.trip.manage');
  const date = typeof req.body?.date === 'string' ? req.body.date : new Date().toISOString().slice(0, 10);
  res.json({ trips: await trips.generateDailyTrips(actor(req).collegeId, date) });
}));

transportRouter.get('/complaints', asyncHandler(async (req: AuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json({ complaints: await complaints.listComplaints(actor(req), status) });
}));

transportRouter.post('/complaints/:id/resolve', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({ resolutionNotes: z.string().min(1) }), req.body);
  res.json(await complaints.resolveComplaint(actor(req), Number(req.params.id), body.resolutionNotes));
}));

transportRouter.get('/incidents', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ incidents: await complaints.listIncidents(actor(req)) });
}));

transportRouter.post('/incidents', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({
    incidentType: z.string(),
    description: z.string().min(1),
    routeId: z.number().optional(),
    tripId: z.number().optional(),
    vehicleId: z.number().optional(),
    severity: z.string().optional(),
  }), req.body);
  res.status(201).json(await complaints.createIncident(actor(req), body));
}));

transportRouter.post('/changes/:id/approve', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await changes.approveChangeRequest(actor(req), Number(req.params.id)));
}));

transportRouter.post('/cancellations/:id/complete', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await changes.completeCancellation(actor(req), Number(req.params.id)));
}));

transportRouter.post('/passes/:id/revoke', asyncHandler(async (req: AuthedRequest, res) => {
  assertTransportPermission(actor(req), 'transport.pass.manage');
  res.json(await passes.revokePass(actor(req).collegeId, Number(req.params.id), actor(req).facultyUserId));
}));

transportRouter.get('/reports/demand', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getRouteDemandReport(actor(req)));
}));

// ── Driver / conductor router ───────────────────────────────────────────
export const transportTripRouter = Router();
transportTripRouter.use(requireAuth);

transportTripRouter.get('/today', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  res.json({ trips: await trips.getDriverTodayTrips(personnelId, req.user!.collegeId) });
}));

transportTripRouter.get('/:tripId', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  const { trip } = await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  res.json({ trip });
}));

transportTripRouter.get('/:tripId/manifest', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  res.json(await trips.getTripManifest(Number(req.params.tripId), req.user!.collegeId));
}));

transportTripRouter.post('/:tripId/start', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  res.json(await trips.startTrip(Number(req.params.tripId), req.user!.collegeId, req.user!.facultyUserId));
}));

transportTripRouter.post('/:tripId/complete', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  res.json(await trips.completeTrip(Number(req.params.tripId), req.user!.collegeId));
}));

transportTripRouter.post('/:tripId/boarding', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  const body = validate(z.object({
    studentId: z.number(),
    routeStopId: z.number().optional(),
    idempotencyKey: z.string().optional(),
  }), req.body);
  res.status(201).json(await boarding.recordBoarding({
    tripId: Number(req.params.tripId),
    studentId: body.studentId,
    collegeId: req.user!.collegeId,
    routeStopId: body.routeStopId,
    recordedBy: req.user!.facultyUserId,
    source: 'MANUAL',
    idempotencyKey: body.idempotencyKey,
  }));
}));

transportTripRouter.post('/:tripId/alighting', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  const body = validate(z.object({
    studentId: z.number(),
    routeStopId: z.number().optional(),
    idempotencyKey: z.string().optional(),
  }), req.body);
  res.status(201).json(await boarding.recordAlighting({
    tripId: Number(req.params.tripId),
    studentId: body.studentId,
    collegeId: req.user!.collegeId,
    routeStopId: body.routeStopId,
    recordedBy: req.user!.facultyUserId,
    source: 'MANUAL',
    idempotencyKey: body.idempotencyKey,
  }));
}));

transportTripRouter.post('/:tripId/incident', asyncHandler(async (req: AuthedRequest, res) => {
  const personnelId = await getDriverPersonnelId(req.user!.facultyUserId, req.user!.collegeId);
  if (!personnelId) return res.status(403).json({ error: 'Driver/conductor access required' });
  await assertDriverTripAccess(personnelId, Number(req.params.tripId), req.user!.collegeId);
  const body = validate(z.object({ incidentType: z.string(), description: z.string().min(1) }), req.body);
  res.status(201).json(await complaints.createIncident(
    { collegeId: req.user!.collegeId, reportedBy: req.user!.facultyUserId, reportedByType: 'DRIVER' },
    { ...body, tripId: Number(req.params.tripId) },
  ));
}));

// ── Operations router ─────────────────────────────────────────────────────
export const transportOperationsRouter = Router();
transportOperationsRouter.use(requireAuth);

transportOperationsRouter.get('/today', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getOperationsDashboard(actor(req)));
}));

// ── Management router ───────────────────────────────────────────────────
export const transportManagementRouter = Router();
transportManagementRouter.use(requireAuth);

transportManagementRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getManagementDashboard(actor(req)));
}));

// ── Public pass verification ──────────────────────────────────────────────
export const transportVerifyRouter = Router();

transportVerifyRouter.get('/transport-pass/:token', passVerifyLimiter, asyncHandler(async (req, res) => {
  const collegeId = req.query.collegeId ? Number(req.query.collegeId) : undefined;
  res.json(await passes.verifyPass(req.params.token, collegeId));
}));
