import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
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

function pageParams(req: AuthedRequest) {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const rawSize = Number(req.query.pageSize ?? 25) || 25;
  const pageSize = Math.min(100, Math.max(1, rawSize));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

function paged<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
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

transportRouter.get('/operations/today', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getOperationsDashboard(actor(req)));
}));

transportRouter.get('/management/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await dashboard.getManagementDashboard(actor(req)));
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

transportRouter.get('/personnel', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertTransportPermission(a, 'transport.view');
  const { page, pageSize, offset } = pageParams(req);
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  let q = db('transport_personnel').where({ college_id: a.collegeId });
  if (type) q = q.andWhere({ personnel_type: type });
  if (search) q = q.andWhere((b) => b.whereLike('name', `%${search}%`).orWhereLike('phone', `%${search}%`).orWhereLike('license_number', `%${search}%`));
  const countRow = await q.clone().count({ c: '*' }).first();
  const rows = await q.orderBy('personnel_type').orderBy('name').limit(pageSize).offset(offset);
  res.json(paged(rows.map((p) => ({
    id: Number(p.id),
    name: p.name,
    phone: p.phone,
    personnelType: p.personnel_type,
    licenseNumber: p.license_number,
    licenseExpiry: p.license_expiry,
    status: p.status,
    facultyUserId: p.faculty_user_id ? Number(p.faculty_user_id) : null,
  })), Number(countRow?.c ?? 0), page, pageSize));
}));

transportRouter.get('/members', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertTransportPermission(a, 'transport.view');
  const { page, pageSize, offset } = pageParams(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  let q = db('transport_members as m')
    .leftJoin('students as s', 's.id', 'm.student_id')
    .leftJoin('student_transport_assignments as assn', function () {
      this.on('assn.transport_member_id', '=', 'm.id').andOn('assn.status', '=', db.raw('?', ['ACTIVE']));
    })
    .leftJoin('transport_routes as r', 'r.id', 'assn.route_id')
    .leftJoin('transport_stops as ps', 'ps.id', 'assn.pickup_stop_id')
    .leftJoin('transport_passes as p', function () {
      this.on('p.transport_member_id', '=', 'm.id').andOn('p.status', '=', db.raw('?', ['ACTIVE']));
    })
    .where({ 'm.college_id': a.collegeId });
  if (status) q = q.andWhere('m.status', status);
  if (search) q = q.andWhere((b) => b.whereLike('s.name', `%${search}%`).orWhereLike('s.usn', `%${search}%`).orWhereLike('m.member_number', `%${search}%`));
  const countRow = await q.clone().clearSelect().clearOrder().countDistinct({ c: 'm.id' }).first();
  const rows = await q
    .select('m.*', 's.name as student_name', 's.usn', 'r.name as route_name', 'r.code as route_code', 'ps.name as pickup_stop_name', 'p.pass_number', 'p.status as pass_status')
    .orderBy('m.created_at', 'desc')
    .limit(pageSize)
    .offset(offset);
  res.json(paged(rows.map((m) => ({
    id: Number(m.id),
    memberNumber: m.member_number,
    status: m.status,
    studentId: Number(m.student_id),
    studentName: m.student_name,
    usn: m.usn,
    routeName: m.route_name,
    routeCode: m.route_code,
    pickupStopName: m.pickup_stop_name,
    passNumber: m.pass_number,
    passStatus: m.pass_status,
    activatedAt: m.activated_at,
  })), Number(countRow?.c ?? 0), page, pageSize));
}));

transportRouter.get('/passes', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertTransportPermission(a, 'transport.view');
  const { page, pageSize, offset } = pageParams(req);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  let q = db('transport_passes as p')
    .leftJoin('students as s', 's.id', 'p.student_id')
    .leftJoin('student_transport_assignments as assn', 'assn.id', 'p.route_assignment_id')
    .leftJoin('transport_routes as r', 'r.id', 'assn.route_id')
    .where({ 'p.college_id': a.collegeId });
  if (status) q = q.andWhere('p.status', status);
  const countRow = await q.clone().count({ c: '*' }).first();
  const rows = await q.select('p.*', 's.name as student_name', 's.usn', 'r.name as route_name', 'r.code as route_code').orderBy('p.issued_at', 'desc').limit(pageSize).offset(offset);
  res.json(paged(rows.map((p) => ({
    id: Number(p.id),
    passNumber: p.pass_number,
    status: p.status,
    studentName: p.student_name,
    usn: p.usn,
    routeName: p.route_name,
    routeCode: p.route_code,
    validFrom: p.valid_from,
    validUntil: p.valid_until,
    issuedAt: p.issued_at,
  })), Number(countRow?.c ?? 0), page, pageSize));
}));

transportRouter.get('/finance-status', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertTransportPermission(a, 'transport.view');
  const { page, pageSize, offset } = pageParams(req);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  let q = db('student_fee_demands as d')
    .leftJoin('students as s', 's.id', 'd.student_id')
    .where({ 'd.college_id': a.collegeId })
    .whereIn('d.demand_type', ['TRANSPORT_FEE', 'TRANSPORT_ADMISSION_FEE', 'TRANSPORT_DEPOSIT', 'TRANSPORT_ROUTE_CHANGE_FEE', 'TRANSPORT_DAMAGE_CHARGE', 'TRANSPORT_FINE'])
    .whereNot('d.status', 'CANCELLED');
  if (search) q = q.andWhere((b) => b.whereLike('s.name', `%${search}%`).orWhereLike('s.usn', `%${search}%`));
  const countRow = await q.clone().count({ c: '*' }).first();
  const rows = await q.select('d.*', 's.name as student_name', 's.usn').orderBy('d.created_at', 'desc').limit(pageSize).offset(offset);
  res.json(paged(rows.map((d) => ({
    id: Number(d.id),
    studentName: d.student_name,
    usn: d.usn,
    demandType: d.demand_type,
    netAmount: Number(d.net_amount),
    paidAmount: Number(d.paid_amount),
    outstandingAmount: Number(d.outstanding_amount),
    status: d.status,
    dueDate: d.due_date,
  })), Number(countRow?.c ?? 0), page, pageSize));
}));

transportRouter.get('/clearance', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  assertTransportPermission(a, 'transport.view');
  const { page, pageSize, offset } = pageParams(req);
  const rows = await db('transport_members as m')
    .leftJoin('students as s', 's.id', 'm.student_id')
    .where({ 'm.college_id': a.collegeId })
    .select('m.*', 's.name as student_name', 's.usn')
    .orderBy('m.created_at', 'desc')
    .limit(pageSize)
    .offset(offset);
  const countRow = await db('transport_members').where({ college_id: a.collegeId }).count({ c: '*' }).first();
  const items = await Promise.all(rows.map(async (m) => {
    const status = await clearance.getTransportNoDueStatus(Number(m.student_id), a.collegeId);
    return {
      id: Number(m.id),
      studentName: m.student_name,
      usn: m.usn,
      memberStatus: m.status,
      clearanceStatus: status.status,
      reasons: status.reasons,
    };
  }));
  res.json(paged(items, Number(countRow?.c ?? 0), page, pageSize));
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
