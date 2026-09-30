import { z } from 'zod';

export type SecurityActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
};

export type SecurityPermission =
  | 'security.gate.manage'
  | 'security.gate.view'
  | 'security.visitor.request'
  | 'security.visitor.approve'
  | 'security.visitor.checkinout'
  | 'security.visitor.view'
  | 'security.incident.report'
  | 'security.incident.manage'
  | 'security.incident.view';

export const VISIT_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'EXPIRED',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

/** Terminal statuses: no further transition is legal from here. */
export const TERMINAL_VISIT_STATUSES: ReadonlySet<VisitStatus> = new Set([
  'REJECTED',
  'CANCELLED',
  'CHECKED_OUT',
  'EXPIRED',
]);

/** Explicit allowed status transitions. Anything not listed here is rejected. */
export const VISIT_STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  APPROVED: ['CHECKED_IN', 'CANCELLED', 'EXPIRED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export const VISIT_TYPES = ['GUEST', 'VENDOR', 'CONTRACTOR', 'OFFICIAL', 'OTHER'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_EVENT_TYPES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'EXPIRED',
] as const;

export const INCIDENT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

/** Terminal incident statuses cannot transition further. */
export const TERMINAL_INCIDENT_STATUSES: ReadonlySet<IncidentStatus> = new Set(['CLOSED']);

export const INCIDENT_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ['INVESTIGATING', 'RESOLVED', 'CLOSED'],
  INVESTIGATING: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: [],
};

export const gateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().max(32).optional().nullable(),
  gateType: z.string().trim().min(1).max(32).optional(),
  locationNote: z.string().trim().max(255).optional().nullable(),
}).strict();

export const gateStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

export const visitorRequestSchema = z.object({
  visitorName: z.string().trim().min(1).max(255),
  phone: z.string().trim().max(32).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable(),
  idType: z.string().trim().max(32).optional().nullable(),
  idReferenceMasked: z.string().trim().max(64).optional().nullable(),
  photoDocumentId: z.number().int().positive().optional().nullable(),
  visitType: z.enum(VISIT_TYPES).optional(),
  purpose: z.string().trim().max(2000).optional().nullable(),
  hostType: z.enum(['FACULTY', 'STUDENT']).optional(),
  hostFacultyId: z.number().int().positive().optional().nullable(),
  hostStudentId: z.number().int().positive().optional().nullable(),
  vendorId: z.number().int().positive().optional().nullable(),
  gateId: z.number().int().positive().optional().nullable(),
  expectedEntryAt: z.string().trim().optional().nullable(),
  expectedExitAt: z.string().trim().optional().nullable(),
  validUntil: z.string().trim().optional().nullable(),
}).strict();

export const visitDecisionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const visitCheckInSchema = z.object({
  gateId: z.number().int().positive().optional().nullable(),
  remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const visitCheckOutSchema = z.object({
  gateId: z.number().int().positive().optional().nullable(),
  remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const visitCancelSchema = z.object({
  reason: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const incidentSchema = z.object({
  category: z.string().trim().min(1).max(64),
  gateId: z.number().int().positive().optional().nullable(),
  locationNote: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().min(1).max(4000),
  severity: z.enum(INCIDENT_SEVERITIES).optional(),
  occurredAt: z.string().trim().optional().nullable(),
  evidenceDocumentId: z.number().int().positive().optional().nullable(),
}).strict();

export const incidentStatusSchema = z.object({
  status: z.enum(INCIDENT_STATUSES),
  resolutionNotes: z.string().trim().max(4000).optional().nullable(),
}).strict();
