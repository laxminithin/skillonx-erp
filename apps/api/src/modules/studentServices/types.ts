import { z } from 'zod';

export const REQUEST_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const GRIEVANCE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'TRIAGED',
  'ASSIGNED',
  'UNDER_REVIEW',
  'PENDING_INFORMATION',
  'REFERRED',
  'ACTION_IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
  'WITHDRAWN',
] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export const GRIEVANCE_CATEGORIES = [
  'GENERAL_GRIEVANCE',
  'ACADEMIC',
  'ADMINISTRATIVE',
  'EXAMINATION',
  'FINANCE',
  'ATTENDANCE',
  'FACULTY',
  'FACILITIES',
  'LIBRARY',
  'HOSTEL',
  'TRANSPORT',
  'PLACEMENT',
  'STUDENT_WELFARE',
  'MENTORING_REFERRAL',
  'DISCIPLINE_RELATED',
  'SAFETY_CONCERN',
  'ANTI_RAGGING',
  'HARASSMENT',
  'LAB',
  'OTHER',
] as const;

export const DOCUMENT_STATUSES = ['VALID', 'REVOKED', 'SUPERSEDED'] as const;

export const MEETING_STATUSES = ['REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export const STUDENT_SERVICES_PERMISSIONS = [
  'student_services.view',
  'student_services.process',
  'certificate.approve',
  'certificate.issue',
  'profile_correction.approve',
  'grievance.assign',
  'grievance.resolve',
  'grievance.triage',
  'grievance.note',
  'grievance.refer',
  'mentor.manage',
] as const;
export type StudentServicesPermission = (typeof STUDENT_SERVICES_PERMISSIONS)[number];

export type ServicesActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId?: number | null;
  role: string;
  name?: string | null;
};

export type StudentActor = {
  studentId: number;
  collegeId: number;
};

export type FacultyRequesterActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId?: number | null;
  role: string;
  name?: string | null;
};

export const createRequestSchema = z.object({
  requestTypeCode: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  formData: z.record(z.unknown()).optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

export const submitRequestSchema = z.object({
  remarks: z.string().trim().max(2000).optional().nullable(),
});

export const respondRequestSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const actionRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_ACTION', 'PROCESS', 'COMPLETE']),
  remarks: z.string().trim().max(2000).optional().nullable(),
  internalRemarks: z.string().trim().max(2000).optional().nullable(),
});

export const createGrievanceSchema = z.object({
  category: z.enum(GRIEVANCE_CATEGORIES),
  subject: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(10000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  confidentiality: z.enum(['STANDARD', 'NORMAL', 'CONFIDENTIAL', 'SENSITIVE', 'RESTRICTED']).optional(),
  sourceModule: z.string().trim().max(64).optional().nullable(),
  sourceEntityType: z.string().trim().max(64).optional().nullable(),
  sourceEntityId: z.union([z.string().trim().max(64), z.number().int().positive()]).optional().nullable(),
  studentUrgencyReason: z.string().trim().max(1000).optional().nullable(),
  anonymous: z.boolean().optional(),
});

export const assignGrievanceSchema = z.object({
  facultyId: z.number().int().positive(),
  remarks: z.string().trim().max(2000).optional().nullable(),
});

export const resolveGrievanceSchema = z.object({
  resolutionSummary: z.string().trim().min(1).max(5000),
  remarks: z.string().trim().max(2000).optional().nullable(),
});

export const triageGrievanceSchema = z.object({
  category: z.enum(GRIEVANCE_CATEGORIES).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  confidentiality: z.enum(['NORMAL', 'CONFIDENTIAL', 'RESTRICTED', 'STANDARD', 'SENSITIVE']).optional(),
  severity: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const clarificationSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const internalNoteSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  visibility: z.enum(['TEAM', 'RESTRICTED']).optional(),
});

export const referralSchema = z.object({
  targetModule: z.enum(['MAINTENANCE', 'MENTORING', 'OFFICE', 'FINANCE', 'COE', 'HOSTEL', 'TRANSPORT', 'LIBRARY', 'LAB', 'PLACEMENT', 'OTHER']),
  targetEntityType: z.string().trim().max(64).optional().nullable(),
  targetEntityId: z.union([z.string().trim().max(64), z.number().int().positive()]).optional().nullable(),
  safeReference: z.string().trim().max(128).optional().nullable(),
  safeSummary: z.string().trim().max(2000).optional().nullable(),
});

export const appealSchema = z.object({
  reason: z.string().trim().min(1).max(3000),
});

export const reopenSchema = z.object({
  reason: z.string().trim().min(1).max(3000),
});

export const feedbackSchema = z.object({
  feedback: z.enum(['ACCEPTED', 'UNRESOLVED']),
  reason: z.string().trim().max(3000).optional().nullable(),
});

export const createMeetingSchema = z.object({
  meetingType: z.enum(['GENERAL', 'ACADEMIC', 'CAREER', 'PERSONAL']).optional(),
  agenda: z.string().trim().min(1).max(2000),
  preferredDate: z.string().optional().nullable(),
});

export const scheduleMeetingSchema = z.object({
  scheduledAt: z.string(),
  meetingType: z.enum(['GENERAL', 'ACADEMIC', 'CAREER', 'PERSONAL']).optional(),
  studentVisibleNotes: z.string().trim().max(5000).optional().nullable(),
});

export const completeMeetingSchema = z.object({
  studentVisibleNotes: z.string().trim().max(5000).optional().nullable(),
  privateNotes: z.string().trim().max(5000).optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  referralStatus: z.enum(['REFERRED', 'CONTACTED', 'CLOSED']).optional().nullable(),
});

export type FormFieldSchema = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'file';
  required?: boolean;
  options?: string[];
  placeholder?: string;
};
