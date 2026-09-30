import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import { isAdminRole } from '../../utils/permissions.js';
import { eventsPermissionsForRole, hodDepartmentIds } from './access.js';
import * as booking from './booking.js';
import * as reservations from './reservations.js';
import * as svc from './service.js';
import {
  attendanceSchema,
  capacityOverrideSchema,
  completeSchema,
  eventDocumentSchema,
  eventResourceSchema,
  eventSchema,
  eventTypeSchema,
  externalParticipantSchema,
  reasonSchema,
  rescheduleSchema,
  reservationDecisionSchema,
  reservationSchema,
  resourceConfigSchema,
  resourceConfigUpdateSchema,
  reviewSchema,
  type EventsActor,
  type StudentEventsActor,
} from './types.js';

function actor(req: AuthedRequest): EventsActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
    hodDepartmentIds: (req.user as any)?.hodDepartmentIds ?? null,
  };
}

function str(v: unknown) {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function num(v: unknown) {
  return v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined;
}

const id = (req: AuthedRequest | StudentAuthedRequest, key = 'id') => Number(req.params[key]);

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

// ── Configuration ──────────────────────────────────────────────────────────
eventsRouter.get('/meta', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  const permissions = isAdminRole(a.role) ? eventsPermissionsForRole('SUPER_ADMIN') : eventsPermissionsForRole(a.role);
  res.json({ role: a.role, facultyUserId: a.facultyUserId, departmentId: a.departmentId, hodDepartmentIds: hodDepartmentIds(a), permissions });
}));
eventsRouter.get('/types', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listEventTypes(actor(req)));
}));
eventsRouter.post('/types', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.saveEventType(actor(req), validate(eventTypeSchema, req.body)));
}));
eventsRouter.get('/resources', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await booking.listResources(actor(req), { kind: str(req.query.kind), activeOnly: req.query.activeOnly === 'true' }));
}));
eventsRouter.get('/resources/candidates', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await booking.listResourceCandidates(actor(req)));
}));
eventsRouter.post('/resources', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await booking.configureResource(actor(req), validate(resourceConfigSchema, req.body)));
}));
eventsRouter.patch('/resources/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await booking.updateResource(actor(req), id(req), validate(resourceConfigUpdateSchema, req.body)));
}));
eventsRouter.get('/availability', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.availability(actor(req), {
    startsAt: String(req.query.startsAt ?? ''),
    endsAt: String(req.query.endsAt ?? ''),
    kind: str(req.query.kind),
    roomType: str(req.query.roomType),
    minCapacity: num(req.query.minCapacity),
  }));
}));
eventsRouter.get('/calendar', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.calendar(actor(req), String(req.query.from ?? ''), String(req.query.to ?? '')));
}));
eventsRouter.get('/reports/summary', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.eventsReport(actor(req), { from: str(req.query.from), to: str(req.query.to) }));
}));
eventsRouter.get('/review-queue', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.reviewQueue(actor(req)));
}));

// ── Ad-hoc reservations ────────────────────────────────────────────────────
eventsRouter.get('/reservations/mine', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await reservations.listMyReservations(actor(req)));
}));
eventsRouter.get('/reservations/queue', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await reservations.reservationQueue(actor(req)));
}));
eventsRouter.post('/reservations', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await reservations.createReservation(actor(req), validate(reservationSchema, req.body)));
}));
eventsRouter.post('/reservations/:id/decision', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await reservations.decideReservation(actor(req), id(req), validate(reservationDecisionSchema, req.body)));
}));
eventsRouter.post('/reservations/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await reservations.cancelReservation(actor(req), id(req)));
}));

// ── Events ─────────────────────────────────────────────────────────────────
eventsRouter.get('/', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listEvents(actor(req), {
    status: str(req.query.status),
    eventType: str(req.query.eventType),
    departmentId: num(req.query.departmentId),
    from: str(req.query.from),
    to: str(req.query.to),
    q: str(req.query.q),
    mine: req.query.mine === 'true',
    page: num(req.query.page),
    pageSize: num(req.query.pageSize),
  }));
}));
eventsRouter.post('/', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.createEvent(actor(req), validate(eventSchema, req.body)));
}));
eventsRouter.get('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.getEvent(actor(req), id(req)));
}));
eventsRouter.put('/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.updateEvent(actor(req), id(req), validate(eventSchema, req.body)));
}));
eventsRouter.post('/:id/resources', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.addEventResource(actor(req), id(req), validate(eventResourceSchema, req.body).resourceId));
}));
eventsRouter.delete('/:id/reservations/:reservationId', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.removeEventResource(actor(req), id(req), id(req, 'reservationId')));
}));
eventsRouter.post('/:id/capacity-override', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.overrideCapacity(actor(req), id(req), validate(capacityOverrideSchema, req.body).reason));
}));
eventsRouter.post('/:id/submit', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.submitEvent(actor(req), id(req)));
}));
eventsRouter.post('/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.reviewEvent(actor(req), id(req), validate(reviewSchema, req.body)));
}));
eventsRouter.post('/:id/schedule', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.scheduleEvent(actor(req), id(req)));
}));
eventsRouter.post('/:id/reschedule', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.rescheduleEvent(actor(req), id(req), validate(rescheduleSchema, req.body)));
}));
eventsRouter.post('/:id/cancel', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.cancelEvent(actor(req), id(req), validate(reasonSchema, req.body).reason));
}));
eventsRouter.post('/:id/complete', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.completeEvent(actor(req), id(req), validate(completeSchema, req.body)));
}));
eventsRouter.post('/:id/close', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.closeEvent(actor(req), id(req)));
}));
eventsRouter.get('/:id/registrations', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listRegistrations(actor(req), id(req), { page: num(req.query.page), pageSize: num(req.query.pageSize) }));
}));
eventsRouter.post('/:id/register', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.staffRegister(actor(req), id(req)));
}));
eventsRouter.post('/:id/unregister', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.staffCancelRegistration(actor(req), id(req)));
}));
eventsRouter.post('/:id/external-participants', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.addExternalParticipant(actor(req), id(req), validate(externalParticipantSchema, req.body)));
}));
eventsRouter.post('/:id/attendance', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.markAttendance(actor(req), id(req), validate(attendanceSchema, req.body)));
}));
eventsRouter.get('/:id/documents', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await svc.listEventDocuments(actor(req), id(req)));
}));
eventsRouter.post('/:id/documents', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await svc.uploadEventDocument(actor(req), id(req), validate(eventDocumentSchema, req.body)));
}));
eventsRouter.get('/:id/documents/:documentId/content', asyncHandler(async (req: AuthedRequest, res) => {
  const { metadata, buffer } = await svc.downloadEventDocument(actor(req), id(req), id(req, 'documentId'));
  res.setHeader('Content-Type', String((metadata as any).mimeType));
  res.setHeader('Content-Length', String(buffer.length));
  res.send(buffer);
}));

// ── Student portal ────────────────────────────────────────────────────────
export const studentEventsRouter = Router();
studentEventsRouter.use(requireStudentAuth);

function student(req: StudentAuthedRequest): StudentEventsActor {
  return { studentId: req.user!.studentId, collegeId: req.user!.collegeId };
}

studentEventsRouter.get('/events', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await svc.studentListEvents(student(req), { page: num(req.query.page), pageSize: num(req.query.pageSize) }));
}));
studentEventsRouter.get('/events/registrations', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await svc.studentMyRegistrations(student(req)));
}));
studentEventsRouter.get('/events/:id', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await svc.studentGetEvent(student(req), id(req)));
}));
studentEventsRouter.post('/events/:id/register', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await svc.studentRegister(student(req), id(req)));
}));
studentEventsRouter.post('/events/:id/cancel-registration', asyncHandler(async (req: StudentAuthedRequest, res) => {
  res.json(await svc.studentCancelRegistration(student(req), id(req)));
}));
