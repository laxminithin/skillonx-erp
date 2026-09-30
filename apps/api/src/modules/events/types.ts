import { z } from 'zod';

/**
 * Campus OS Phase 11 — Events, Venue & Institutional Resource Booking. See
 * docs/CAMPUS_OS_PHASE11_PREIMPLEMENTATION_AUDIT.md. This module owns only the
 * institutional event record, bookability configuration, reservations and
 * event registrations/participation. Venue identity is `rooms`, equipment is
 * `campus_assets`, approval is the Workflow Engine, documents are the Document
 * Engine.
 *
 * All event/reservation times are college-local wall-clock datetimes
 * ("YYYY-MM-DDTHH:MM"), the same convention the Academic Timetable uses for
 * its HH:MM periods, so academic occupancy can be compared without tz math.
 */

export type EventsActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
  hodDepartmentIds?: number[] | null;
};

export type StudentEventsActor = {
  studentId: number;
  collegeId: number;
};

export type EventsPermission =
  | 'events.event.create'
  | 'events.event.view'
  | 'events.event.viewAll'
  | 'events.event.review'
  | 'events.event.close'
  | 'events.capacity.override'
  | 'events.resource.manage'
  | 'events.reservation.request'
  | 'events.reservation.decide'
  | 'events.report.view';

export const DEFAULT_EVENT_TYPES: Array<{ code: string; name: string }> = [
  { code: 'SEMINAR', name: 'Seminar' },
  { code: 'WORKSHOP', name: 'Workshop' },
  { code: 'CONFERENCE', name: 'Conference' },
  { code: 'GUEST_LECTURE', name: 'Guest Lecture' },
  { code: 'HACKATHON', name: 'Hackathon' },
  { code: 'TECHNICAL_EVENT', name: 'Technical Event' },
  { code: 'CULTURAL_EVENT', name: 'Cultural Event' },
  { code: 'SPORTS_EVENT', name: 'Sports Event' },
  { code: 'ORIENTATION', name: 'Orientation' },
  { code: 'OTHER', name: 'Other' },
];

export const ORGANIZER_UNIT_TYPES = ['INSTITUTION', 'DEPARTMENT', 'CLUB', 'CELL', 'COMMITTEE', 'OTHER'] as const;
export const EVENT_VISIBILITIES = ['DEPARTMENT', 'INSTITUTION'] as const;
export const REGISTRATION_AUDIENCES = ['STUDENTS', 'STAFF', 'ALL'] as const;

export const EVENT_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'RETURNED',
  'APPROVED',
  'SCHEDULED',
  'COMPLETED',
  'CLOSED',
  'REJECTED',
  'CANCELLED',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EDITABLE_EVENT_STATUSES: ReadonlySet<string> = new Set(['DRAFT', 'RETURNED']);
export const TERMINAL_EVENT_STATUSES: ReadonlySet<string> = new Set(['CLOSED', 'REJECTED', 'CANCELLED']);
/** Statuses whose record is historical: no reschedule/cancel/resource/registration change. */
export const FROZEN_EVENT_STATUSES: ReadonlySet<string> = new Set(['COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED']);

export const RESOURCE_KINDS = ['ROOM', 'ASSET'] as const;
export const RESERVATION_STATUSES = ['REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'] as const;
export const ACTIVE_RESERVATION_STATUSES = ['REQUESTED', 'CONFIRMED'] as const;

/** Asset statuses that make equipment unavailable for booking (authoritative in P0.2). */
export const UNBOOKABLE_ASSET_STATUSES: ReadonlySet<string> = new Set([
  'UNDER_MAINTENANCE',
  'LOST',
  'DAMAGED',
  'RETIRED',
  'DISPOSED',
]);

export const MAX_EVENT_DAYS = 14;
export const MAX_CALENDAR_DAYS = 62;

export const REVIEW_ACTIONS = ['APPROVE', 'REJECT', 'RETURN'] as const;

const wallDateTime = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/, 'Use YYYY-MM-DDTHH:MM');

export const eventTypeSchema = z.object({
  code: z.string().trim().min(2).max(48).regex(/^[A-Z0-9_]+$/, 'Use UPPER_SNAKE_CASE'),
  name: z.string().trim().min(1).max(128),
  isActive: z.boolean().optional(),
}).strict();

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(255),
  eventType: z.string().trim().min(2).max(48),
  description: z.string().trim().max(10000).optional().nullable(),
  objective: z.string().trim().max(5000).optional().nullable(),
  organizerUnitType: z.enum(ORGANIZER_UNIT_TYPES),
  organizerUnitName: z.string().trim().max(191).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  startsAt: wallDateTime,
  endsAt: wallDateTime,
  externalVenue: z.string().trim().max(255).optional().nullable(),
  expectedParticipants: z.number().int().positive().max(100000).optional().nullable(),
  visibility: z.enum(EVENT_VISIBILITIES).optional(),
  registrationEnabled: z.boolean().optional(),
  registrationAudience: z.enum(REGISTRATION_AUDIENCES).optional(),
  registrationCapacity: z.number().int().positive().max(100000).optional().nullable(),
  registrationClosesAt: wallDateTime.optional().nullable(),
  hasExternalParticipants: z.boolean().optional(),
  plannedBudget: z.number().nonnegative().max(1e11).optional().nullable(),
}).strict();

export const reviewSchema = z.object({
  action: z.enum(REVIEW_ACTIONS),
  remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const reasonSchema = z.object({
  reason: z.string().trim().min(3).max(500),
}).strict();

export const rescheduleSchema = z.object({
  startsAt: wallDateTime,
  endsAt: wallDateTime,
  reason: z.string().trim().min(3).max(500),
}).strict();

export const capacityOverrideSchema = z.object({
  reason: z.string().trim().min(5).max(500),
}).strict();

export const eventResourceSchema = z.object({
  resourceId: z.number().int().positive(),
}).strict();

export const resourceConfigSchema = z.object({
  resourceKind: z.enum(RESOURCE_KINDS),
  roomId: z.number().int().positive().optional().nullable(),
  assetId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  setupBufferMinutes: z.number().int().min(0).max(240).optional(),
  cleanupBufferMinutes: z.number().int().min(0).max(240).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
}).strict().superRefine((v, ctx) => {
  if (v.resourceKind === 'ROOM' && (!v.roomId || v.assetId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['roomId'], message: 'A ROOM resource needs roomId only' });
  }
  if (v.resourceKind === 'ASSET' && (!v.assetId || v.roomId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['assetId'], message: 'An ASSET resource needs assetId only' });
  }
});

export const resourceConfigUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  setupBufferMinutes: z.number().int().min(0).max(240).optional(),
  cleanupBufferMinutes: z.number().int().min(0).max(240).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
}).strict();

export const reservationSchema = z.object({
  resourceId: z.number().int().positive(),
  startsAt: wallDateTime,
  endsAt: wallDateTime,
  purpose: z.string().trim().min(3).max(255),
  idempotencyKey: z.string().trim().min(8).max(96).optional().nullable(),
}).strict();

export const reservationDecisionSchema = z.object({
  action: z.enum(['CONFIRM', 'REJECT']),
  remarks: z.string().trim().max(500).optional().nullable(),
}).strict();

export const externalParticipantSchema = z.object({
  name: z.string().trim().min(2).max(191),
  email: z.string().trim().email().max(191).optional().nullable(),
  organization: z.string().trim().max(191).optional().nullable(),
}).strict();

export const attendanceSchema = z.object({
  entries: z.array(z.object({
    registrationId: z.number().int().positive(),
    attendance: z.enum(['ATTENDED', 'ABSENT']),
  }).strict()).min(1).max(2000),
}).strict();

export const completeSchema = z.object({
  outcomeSummary: z.string().trim().min(10).max(10000),
}).strict();

export const eventDocumentSchema = z.object({
  category: z.enum(['BROCHURE', 'APPROVAL', 'PHOTO', 'ATTENDANCE_EVIDENCE', 'REPORT', 'OUTCOME', 'OTHER']),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(128),
  contentBase64: z.string().min(1),
  description: z.string().trim().max(2000).optional().nullable(),
}).strict();
