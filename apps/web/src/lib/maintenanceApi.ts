import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────
export type SlaSnapshot = {
  ackState: string; ackDueAt: string | null; resolveState: string; resolveDueAt: string | null;
  overall: string; pausedMs: number;
};

export type Ticket = {
  id: number; ticketNo: string; title: string; description: string | null;
  categoryId: number | null; categoryName: string | null; categoryKind: string | null; subcategory: string | null;
  requesterType: string; requesterName: string | null; requesterFacultyId: number | null; requesterStudentId: number | null;
  departmentId: number | null; departmentName: string | null;
  roomId: number | null; roomName: string | null; building: string | null; locationNote: string | null;
  sourceModule: string; sourceEntityType: string | null; sourceEntityId: number | null; assetRef: string | null;
  erpModule: string | null; erpRoute: string | null;
  priority: string; status: string;
  teamId: number | null; teamName: string | null; assignedTo: number | null; assigneeName: string | null;
  routingExplanation: string | null;
  createdAt: string; acknowledgedAt: string | null; startedAt: string | null; resolvedAt: string | null;
  confirmedAt: string | null; closedAt: string | null;
  resolutionSummary: string | null; closureOutcome: string | null; reopenCount: number; escalationLevel: string;
  sla: SlaSnapshot;
  vendorName?: string | null; vendorStatus?: string | null;
};

export type TimelineEvent = { id: number; type: string; visibility: string; actorName: string | null; fromValue: string | null; toValue: string | null; note: string | null; createdAt: string };
export type Comment = { id: number; visibility: string; authorName: string | null; authorType: string; body: string; createdAt: string };
export type WorkLog = { id: number; technicianName: string | null; workPerformed: string; diagnosis: string | null; action: string | null; partsUsed: string | null; nextStep: string | null; minutesSpent: number | null; createdAt: string };
export type PartRequest = { id: number; item: string; quantity: number; unit: string | null; reason: string | null; estimatedCost: number | null; status: string; storeRef: string | null; purchaseRef: string | null; decisionNote: string | null; createdAt: string };
export type Attachment = { id: number; filename: string; mimeType: string | null; sizeBytes: number | null; visibility: string; dataUrl: string | null; createdAt: string };

export type TicketDetail = Ticket & {
  canWork: boolean; isRequester: boolean;
  timeline: TimelineEvent[]; comments: Comment[]; workLogs: WorkLog[]; parts: PartRequest[]; attachments: Attachment[];
};

export type Category = { id: number; code: string; name: string; kind: string; defaultTeamId: number | null; defaultTeamName: string | null; defaultPriority: string; ackSlaMins: number | null; resolveSlaMins: number | null; isActive: boolean; sortOrder: number; description: string | null };
export type Team = { id: number; code: string; name: string; kind: string; isTriage: boolean; status: string; description: string | null; members: { id: number; facultyId: number; name: string | null; role: string | null; isLead: boolean }[] };
export type RoutingRule = { id: number; name: string; priority: number; matchCategoryId: number | null; matchCategoryName: string | null; matchSourceModule: string | null; matchBuilding: string | null; matchDepartmentId: number | null; targetTeamId: number; targetTeamName: string | null; isActive: boolean; explanation: string | null };
export type Room = { id: number; name: string; building: string | null; floor?: string | null; type: string | null };

export type MaintMeta = {
  role: string; permissions: string[]; allPermissions: string[]; isManager: boolean; canWork: boolean;
  priorities: string[]; statuses: string[]; sourceModules: string[]; categories: Category[];
};

export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number };

export type ManagerDashboard = {
  actionRequired: Record<string, Ticket[]>;
  counts: Record<string, number>;
  queueHealth: Record<string, number>;
  byTeam: { teamId: number | null; teamName: string; kind: string | null; open: number }[];
  recentActivity: { id: number; type: string; actorName: string | null; note: string | null; ticketNo: string; ticketId: number; createdAt: string }[];
};

export type TechnicianDashboard = {
  counts: Record<string, number>;
  overdue: Ticket[]; dueToday: Ticket[]; highPriority: Ticket[]; waiting: Ticket[]; assigned: Ticket[]; recentlyCompleted: Ticket[];
};

export type Reports = {
  summary: { open: number; byStatus: Record<string, number>; avgResolutionHours: number | null; slaCompliance: number | null; slaSampleSize: number; reopened: number; pendingParts: number };
  byCategory: { category: string; kind: string | null; count: number }[];
  byPriority: { priority: string; count: number }[];
  byTeam: { team: string; total: number; open: number; resolved: number }[];
  byLocation: { room: string; building: string | null; count: number }[];
  itVsFacilities: { kind: string; count: number }[];
  recurring: { byAsset: { assetRef: string; failures: number }[]; byRoomCategory: { room: string; building: string | null; category: string; occurrences: number }[] };
};

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const maintApi = {
  meta: () => api<MaintMeta>('/api/maintenance/meta'),
  rooms: () => api<Room[]>('/api/maintenance/rooms'),
  sourceOptions: (module: string) => api<{ id: number; type: string; label: string }[]>(`/api/maintenance/source-options?module=${module}`),

  tickets: (f: Record<string, unknown> = {}) => api<Paged<Ticket>>(`/api/maintenance/tickets${qs(f)}`),
  ticket: (id: number) => api<TicketDetail>(`/api/maintenance/tickets/${id}`),
  createTicket: (body: Record<string, unknown>) => api<Ticket>('/api/maintenance/tickets', { method: 'POST', body: JSON.stringify(body) }),
  assign: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(body) }),
  acknowledge: (id: number) => api<Ticket>(`/api/maintenance/tickets/${id}/acknowledge`, { method: 'POST', body: '{}' }),
  start: (id: number) => api<Ticket>(`/api/maintenance/tickets/${id}/start`, { method: 'POST', body: '{}' }),
  setStatus: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/status`, { method: 'POST', body: JSON.stringify(body) }),
  setPriority: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/priority`, { method: 'POST', body: JSON.stringify(body) }),
  resolve: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
  confirm: (id: number, body: Record<string, unknown> = {}) => api<Ticket>(`/api/maintenance/tickets/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) }),
  reopen: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/reopen`, { method: 'POST', body: JSON.stringify(body) }),
  comment: (id: number, body: Record<string, unknown>) => api(`/api/maintenance/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  workLog: (id: number, body: Record<string, unknown>) => api(`/api/maintenance/tickets/${id}/work-logs`, { method: 'POST', body: JSON.stringify(body) }),
  requestPart: (id: number, body: Record<string, unknown>) => api(`/api/maintenance/tickets/${id}/parts`, { method: 'POST', body: JSON.stringify(body) }),
  decidePart: (id: number, partId: number, body: Record<string, unknown>) => api(`/api/maintenance/tickets/${id}/parts/${partId}`, { method: 'POST', body: JSON.stringify(body) }),
  escalate: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/escalate`, { method: 'POST', body: JSON.stringify(body) }),
  vendor: (id: number, body: Record<string, unknown>) => api<Ticket>(`/api/maintenance/tickets/${id}/vendor`, { method: 'POST', body: JSON.stringify(body) }),
  linkLabFault: (faultId: number, body: Record<string, unknown> = {}) => api<Ticket>(`/api/maintenance/integrations/lab-fault/${faultId}`, { method: 'POST', body: JSON.stringify(body) }),

  managerDashboard: () => api<ManagerDashboard>('/api/maintenance/dashboard/manager'),
  technicianDashboard: () => api<TechnicianDashboard>('/api/maintenance/dashboard/technician'),
  reports: () => api<Reports>('/api/maintenance/reports'),

  categories: () => api<Category[]>('/api/maintenance/config/categories'),
  createCategory: (b: Record<string, unknown>) => api<Category>('/api/maintenance/config/categories', { method: 'POST', body: JSON.stringify(b) }),
  updateCategory: (id: number, b: Record<string, unknown>) => api<Category>(`/api/maintenance/config/categories/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  teams: () => api<Team[]>('/api/maintenance/config/teams'),
  createTeam: (b: Record<string, unknown>) => api<Team>('/api/maintenance/config/teams', { method: 'POST', body: JSON.stringify(b) }),
  updateTeam: (id: number, b: Record<string, unknown>) => api<Team>(`/api/maintenance/config/teams/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  routingRules: () => api<RoutingRule[]>('/api/maintenance/config/routing-rules'),
  createRoutingRule: (b: Record<string, unknown>) => api<RoutingRule>('/api/maintenance/config/routing-rules', { method: 'POST', body: JSON.stringify(b) }),
  updateRoutingRule: (id: number, b: Record<string, unknown>) => api<RoutingRule>(`/api/maintenance/config/routing-rules/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteRoutingRule: (id: number) => api(`/api/maintenance/config/routing-rules/${id}`, { method: 'DELETE' }),
};

export const canMaint = (meta: MaintMeta | null, perm: string) => !!meta && (meta.permissions.includes(perm) || meta.role === 'SUPER_ADMIN' || meta.role === 'COLLEGE_ADMIN');

export const SLA_TONE: Record<string, string> = {
  BREACHED: 'bg-danger-soft text-danger', APPROACHING: 'bg-warning-soft text-warning',
  WITHIN: 'bg-success-soft text-success', MET: 'bg-success-soft text-success',
  PAUSED: 'bg-surface-muted text-ink-muted', NONE: 'bg-surface-muted text-ink-muted',
};
export const PRIORITY_TONE: Record<string, string> = {
  CRITICAL: 'bg-danger-soft text-danger', HIGH: 'bg-warning-soft text-warning',
  NORMAL: 'bg-surface-muted text-ink', LOW: 'bg-surface-muted text-ink-muted',
};

export function fmtDateTime(s: string | null | undefined) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function relDue(s: string | null | undefined) {
  if (!s) return '—';
  const ms = new Date(s).getTime() - Date.now();
  const abs = Math.abs(ms); const h = Math.round(abs / 3600000); const d = Math.round(abs / 86400000);
  const unit = abs >= 86400000 ? `${d}d` : h >= 1 ? `${h}h` : `${Math.round(abs / 60000)}m`;
  return ms >= 0 ? `in ${unit}` : `${unit} ago`;
}
