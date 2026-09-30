import { api } from './api';

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

export type EventsMeta = {
  role: string;
  facultyUserId: number;
  departmentId: number | null;
  hodDepartmentIds: number[];
  permissions: EventsPermission[];
};

export type EventStatus = 'DRAFT' | 'UNDER_REVIEW' | 'RETURNED' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'CLOSED' | 'REJECTED' | 'CANCELLED';

export type Resource = {
  id: number;
  resourceKind: 'ROOM' | 'ASSET';
  roomId: number | null;
  assetId: number | null;
  name: string;
  code: string | null;
  roomType: string | null;
  building: string | null;
  floor: string | null;
  capacity: number | null;
  sourceStatus: string | null;
  isActive: boolean;
  requiresApproval: boolean;
  setupBufferMinutes: number;
  cleanupBufferMinutes: number;
  notes: string | null;
};

export type Blocker = { kind: string; message: string; resourceId: number; startsAt?: string | null; endsAt?: string | null };

export type Reservation = {
  id: number;
  resourceId: number;
  resourceName: string | null;
  resourceKind: 'ROOM' | 'ASSET' | null;
  eventId: number | null;
  purpose: string | null;
  startsAt: string;
  endsAt: string;
  blockStartsAt: string;
  blockEndsAt: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  requestedBy: number;
  decisionRemarks: string | null;
  requesterName?: string | null;
  idempotentReplay?: boolean;
};

export type EventListItem = {
  id: number;
  title: string;
  eventType: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  departmentId: number | null;
  departmentName: string | null;
  organizerUnitType: string;
  organizerUnitName: string | null;
  organizerName: string | null;
  visibility: 'DEPARTMENT' | 'INSTITUTION';
  registrationEnabled: boolean;
  isMine: boolean;
};

export type EventPublic = {
  id: number;
  title: string;
  eventType: string;
  description: string | null;
  objective: string | null;
  organizerUnitType: string;
  organizerUnitName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  organizerName: string | null;
  startsAt: string;
  endsAt: string;
  venues: string[];
  externalVenue: string | null;
  visibility: 'DEPARTMENT' | 'INSTITUTION';
  status: EventStatus;
  registrationEnabled: boolean;
  registrationAudience: 'ALL' | 'STUDENTS' | 'STAFF';
  registrationCapacity: number | null;
  registrationClosesAt: string | null;
  seatsRemaining: number | null;
};

export type WorkflowView = {
  instanceId: number;
  status: string;
  currentStep: { key: string; name: string; allowedRoles: string[] } | null;
  history: Array<{ action: string; role: string; actorName: string | null; remarks: string | null; resultingStatus: string; at: string }>;
};

export type EventInternal = EventPublic & {
  view: 'INTERNAL';
  organizerFacultyId: number;
  expectedParticipants: number | null;
  hasExternalParticipants: boolean;
  plannedBudget: number | null;
  reviewRemarks: string | null;
  lastSchedulingError: string | null;
  capacityOverride: boolean;
  capacityOverrideReason: string | null;
  outcomeSummary: string | null;
  actualParticipants: number | null;
  cancellationReason: string | null;
  rescheduleCount: number;
  registeredCount: number;
  attendedCount: number;
  reservations: Reservation[];
  workflow: WorkflowView | null;
  canManage: boolean;
};

export type EventDetail = EventInternal | (EventPublic & { view: 'PUBLIC' });

export type EventInput = {
  title: string;
  eventType: string;
  description?: string | null;
  objective?: string | null;
  organizerUnitType: string;
  organizerUnitName?: string | null;
  departmentId?: number | null;
  startsAt: string;
  endsAt: string;
  externalVenue?: string | null;
  expectedParticipants?: number | null;
  visibility?: 'DEPARTMENT' | 'INSTITUTION';
  registrationEnabled?: boolean;
  registrationAudience?: 'ALL' | 'STUDENTS' | 'STAFF';
  registrationCapacity?: number | null;
  registrationClosesAt?: string | null;
  hasExternalParticipants?: boolean;
  plannedBudget?: number | null;
};

export type Registration = {
  id: number;
  participantType: 'STUDENT' | 'STAFF' | 'EXTERNAL';
  name: string | null;
  usn: string | null;
  externalEmail: string | null;
  externalOrganization: string | null;
  status: 'REGISTERED' | 'CANCELLED';
  attendanceStatus: 'NOT_MARKED' | 'ATTENDED' | 'ABSENT';
  registeredVia: string;
};

export type EventDocument = { id: number; category: string; originalFilename?: string; fileName?: string; mimeType: string; sizeBytes?: number; createdAt?: string };

export type Paged<T> = { page: number; pageSize: number; total: number; items: T[] };

export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : '';
}

const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const eventsApi = {
  meta: () => api<EventsMeta>('/api/events/meta'),
  types: () => api<Array<{ id: number; code: string; name: string; isActive: boolean }>>('/api/events/types'),
  saveType: (body: { code: string; name: string; isActive?: boolean }) => post<Array<{ id: number; code: string; name: string; isActive: boolean }>>('/api/events/types', body),
  list: (params: { status?: string; eventType?: string; q?: string; mine?: boolean; from?: string; to?: string; page?: number; pageSize?: number }) =>
    api<Paged<EventListItem>>(`/api/events${qs(params)}`),
  get: (id: number) => api<EventDetail>(`/api/events/${id}`),
  create: (body: EventInput) => post<EventInternal>('/api/events', body),
  update: (id: number, body: EventInput) => api<EventInternal>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  addResource: (id: number, resourceId: number) => post<EventInternal>(`/api/events/${id}/resources`, { resourceId }),
  removeReservation: (id: number, reservationId: number) => api<EventInternal>(`/api/events/${id}/reservations/${reservationId}`, { method: 'DELETE' }),
  submit: (id: number) => post<EventInternal>(`/api/events/${id}/submit`),
  review: (id: number, action: 'APPROVE' | 'RETURN' | 'REJECT', remarks?: string) => post<EventInternal>(`/api/events/${id}/review`, { action, remarks: remarks || null }),
  schedule: (id: number) => post<EventInternal>(`/api/events/${id}/schedule`),
  reschedule: (id: number, body: { startsAt: string; endsAt: string; reason: string }) => post<EventInternal>(`/api/events/${id}/reschedule`, body),
  cancel: (id: number, reason: string) => post<EventInternal>(`/api/events/${id}/cancel`, { reason }),
  overrideCapacity: (id: number, reason: string) => post<EventInternal>(`/api/events/${id}/capacity-override`, { reason }),
  complete: (id: number, outcomeSummary: string) => post<EventInternal>(`/api/events/${id}/complete`, { outcomeSummary }),
  close: (id: number) => post<EventInternal>(`/api/events/${id}/close`),
  registrations: (id: number, page = 1) => api<Paged<Registration>>(`/api/events/${id}/registrations${qs({ page })}`),
  register: (id: number) => post<{ registrationId: number; created: boolean }>(`/api/events/${id}/register`),
  unregister: (id: number) => post<{ ok: true }>(`/api/events/${id}/unregister`),
  addExternal: (id: number, body: { name: string; email?: string | null; organization?: string | null }) => post(`/api/events/${id}/external-participants`, body),
  markAttendance: (id: number, entries: Array<{ registrationId: number; attendance: 'ATTENDED' | 'ABSENT' }>) => post<Paged<Registration>>(`/api/events/${id}/attendance`, { entries }),
  documents: (id: number) => api<EventDocument[]>(`/api/events/${id}/documents`),
  uploadDocument: (id: number, body: { category: string; fileName: string; mimeType: string; contentBase64: string; description?: string | null }) => post<EventDocument>(`/api/events/${id}/documents`, body),
  documentUrl: (id: number, documentId: number) => `/api/events/${id}/documents/${documentId}/content`,
  queue: () => api<Array<{ id: number; title: string; eventType: string; startsAt: string; endsAt: string; departmentName: string | null; organizerName: string | null; step: { key: string; name: string }; submittedAt: string }>>('/api/events/review-queue'),
  resources: (params: { kind?: string; activeOnly?: boolean } = {}) => api<Resource[]>(`/api/events/resources${qs(params)}`),
  candidates: () => api<{ rooms: Array<{ id: number; name: string; code: string; type: string; building: string | null; capacity: number | null; status: string }>; assets: Array<{ id: number; name: string; assetTag: string; category: string; status: string }> }>('/api/events/resources/candidates'),
  configureResource: (body: { resourceKind: 'ROOM' | 'ASSET'; roomId?: number; assetId?: number; requiresApproval?: boolean; setupBufferMinutes?: number; cleanupBufferMinutes?: number }) => post<Resource>('/api/events/resources', body),
  updateResource: (id: number, body: Partial<Pick<Resource, 'isActive' | 'requiresApproval' | 'setupBufferMinutes' | 'cleanupBufferMinutes' | 'notes'>>) =>
    api<Resource>(`/api/events/resources/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  availability: (params: { startsAt: string; endsAt: string; kind?: string; roomType?: string; minCapacity?: number }) =>
    api<{ startsAt: string; endsAt: string; items: Array<{ resource: Resource; available: boolean; blockers: Blocker[] }> }>(`/api/events/availability${qs(params)}`),
  calendar: (from: string, to: string) => api<{ from: string; to: string; events: EventListItem[]; reservations: Reservation[] }>(`/api/events/calendar${qs({ from, to })}`),
  report: (params: { from?: string; to?: string } = {}) => api<{
    scope: 'INSTITUTION' | 'DEPARTMENT';
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ eventType: string; count: number }>;
    byDepartment: Array<{ departmentId: number | null; name: string; count: number }>;
    completedEvents: number;
    totalParticipants: number;
    resourceUtilization: Array<{ resourceId: number; kind: string; name: string; bookings: number; hours: number }>;
  }>(`/api/events/reports/summary${qs(params)}`),
  myReservations: () => api<Reservation[]>('/api/events/reservations/mine'),
  reservationQueue: () => api<Reservation[]>('/api/events/reservations/queue'),
  createReservation: (body: { resourceId: number; startsAt: string; endsAt: string; purpose: string; idempotencyKey: string }) => post<Reservation>('/api/events/reservations', body),
  decideReservation: (id: number, action: 'CONFIRM' | 'REJECT', remarks?: string) => post<Reservation>(`/api/events/reservations/${id}/decision`, { action, remarks: remarks || null }),
  cancelReservation: (id: number) => post<Reservation>(`/api/events/reservations/${id}/cancel`),
};

export type StudentEventItem = {
  id: number;
  title: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  organizerUnitType: string;
  organizerUnitName: string | null;
  departmentName: string | null;
  registrationEnabled: boolean;
  registrationClosesAt: string | null;
  myRegistrationStatus: 'REGISTERED' | 'CANCELLED' | null;
};

export type StudentEventDetail = EventPublic & { myRegistration: { id: number; status: 'REGISTERED' | 'CANCELLED'; attendanceStatus: string } | null };

export const studentEventsApi = {
  list: (page = 1) => api<Paged<StudentEventItem>>(`/api/student/events${qs({ page })}`),
  get: (id: number) => api<StudentEventDetail>(`/api/student/events/${id}`),
  register: (id: number) => post<StudentEventDetail>(`/api/student/events/${id}/register`),
  cancel: (id: number) => post<StudentEventDetail>(`/api/student/events/${id}/cancel-registration`),
  mine: () => api<Array<{ registrationId: number; status: string; attendanceStatus: string; event: { id: number; title: string; eventType: string; status: EventStatus; startsAt: string; endsAt: string } }>>('/api/student/events/registrations'),
};

export function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatWhen(startsAt: string, endsAt: string) {
  const s = new Date(`${startsAt}:00`);
  const e = new Date(`${endsAt}:00`);
  const date = s.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const sameDay = startsAt.slice(0, 10) === endsAt.slice(0, 10);
  return sameDay ? `${date} · ${t(s)}–${t(e)}` : `${date} ${t(s)} → ${e.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${t(e)}`;
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  RETURNED: 'Returned',
  APPROVED: 'Approved — not scheduled',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};
