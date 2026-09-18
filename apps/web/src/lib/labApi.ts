import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────
export type LabMeta = {
  permissions: string[];
  allPermissions: string[];
  categories: string[];
  operationalStatuses: string[];
  conditions: string[];
  movementTypes: string[];
  reportTypes: string[];
  role: string;
};

export type Lab = {
  id: number; name: string; code: string; departmentId: number | null; departmentName: string | null;
  roomId: number | null; roomName: string | null; building: string | null; labType: string;
  capacity: number | null; status: string; description: string | null;
  assignments?: LabAssignment[];
};

export type LabAssignment = {
  id: number; facultyId: number; facultyName: string; facultyEmail: string; designation: string | null;
  assignmentRole: string; isPrimary: boolean; status: string; effectiveFrom: string | null; effectiveTo: string | null;
};

export type LabAsset = {
  id: number; assetTag: string; serialNumber: string | null; category: string; assetClass: string;
  name: string; make: string | null; model: string | null; labId: number | null; labName: string | null;
  purchaseDate: string | null; cost: number | null; vendor: string | null;
  warrantyStart: string | null; warrantyEnd: string | null; amcStart: string | null; amcEnd: string | null;
  operationalStatus: string; condition: string; custodianFacultyId: number | null; custodianName: string | null;
  hostname: string | null; systemNumber: string | null; processor: string | null; ram: string | null;
  storage: string | null; os: string | null; remarks: string | null;
  history?: { id: number; action: string; fromStatus: string | null; toStatus: string | null; note: string | null; createdAt: string }[];
};

export type StockItem = {
  id: number; labId: number; labName: string | null; name: string; code: string | null; category: string;
  unit: string; openingStock: number; currentStock: number; minThreshold: number; lowStock: boolean; status: string;
};

export type LabIssue = {
  id: number; labId: number; labName: string | null; itemKind: string; assetId: number | null; assetTag: string | null;
  stockItemId: number | null; description: string | null; quantity: number; recipientType: string;
  recipientName: string | null; issueDate: string; expectedReturn: string | null; actualReturn: string | null;
  conditionOut: string | null; conditionIn: string | null; status: string; overdue: boolean; remarks: string | null;
};

export type LabSession = {
  slotId: number; labId: number; labName: string; sessionDate: string; startTime: string; endTime: string;
  courseTitle: string | null; facultyName: string | null; batchName: string | null; className: string | null;
  readinessId: number | null; readinessStatus: string; checklist: { key: string; label: string; done: boolean }[]; notes: string | null;
};

export type LabFault = {
  id: number; labId: number; labName: string | null; assetId: number | null; assetTag: string | null;
  reporterName: string | null; faultCategory: string; description: string; severity: string; impact: string | null;
  status: string; maintenanceRef: string | null; resolvedAt: string | null; createdAt: string;
};

export type LabRepair = {
  id: number; labId: number; labName: string | null; assetId: number | null; assetTag: string | null; faultId: number | null;
  requestedAction: string; priority: string; vendor: string | null; estimatedCost: number | null; actualCost: number | null;
  approvalStatus: string; status: string; postRepairCondition: string | null; maintenanceRef: string | null;
  requesterName: string | null; completedAt: string | null; createdAt: string;
};

export type LabSoftware = {
  id: number; labId: number; labName: string | null; name: string; version: string | null; licenseType: string;
  licenseCount: number | null; expiryDate: string | null; installationStatus: string; vendorRef: string | null; remarks: string | null;
};

export type LabSoftwareRequest = {
  id: number; labId: number; labName: string | null; softwareName: string; version: string | null;
  reason: string | null; neededBy: string | null; status: string; requesterName: string | null; resolution: string | null; createdAt: string;
};

export type LabRequirement = {
  id: number; labId: number; labName: string | null; departmentId: number | null; requestType: string; item: string;
  quantity: number; reason: string | null; academicJustification: string | null; priority: string; estimatedCost: number | null;
  semester: string | null; studentStrength: number | null; currentStock: number | null; shortfall: number | null;
  status: string; requesterName: string | null; purchaseRef: string | null; remarks: string | null; createdAt: string;
};

export type LabDashboard = {
  summary: Record<string, number>;
  actionRequired: { faultyAssets: any[]; overdueItems: any[]; lowStock: any[]; sessionsNeedingPrep: any[] };
  todaySessions: LabSession[];
  upcomingSessions: LabSession[];
  health: Record<string, number>;
  labHealth: { labId: number; labName: string; total: number; available: number; faulty: number; underRepair: number; readinessPct: number }[];
  recentActivity: { action: string; entityType: string; entityId: number; at: string }[];
};

export type LabOversight = {
  scope: string;
  summary: Record<string, number>;
  departments: any[];
  labs: any[];
  faults: any[];
  pendingApprovals: any[];
  lowStock: any[];
};

const qs = (params: Record<string, unknown>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const labApi = {
  meta: () => api<LabMeta>('/api/lab/meta'),
  dashboard: () => api<LabDashboard>('/api/lab/dashboard'),
  oversight: () => api<LabOversight>('/api/lab/oversight'),

  labs: (f: Record<string, unknown> = {}) => api<Lab[]>(`/api/lab/labs${qs(f)}`),
  lab: (id: number) => api<Lab>(`/api/lab/labs/${id}`),
  rooms: () => api<{ id: number; name: string; code: string; building: string | null; type: string; capacity: number | null }[]>('/api/lab/labs/rooms'),
  createLab: (body: unknown) => api<Lab>('/api/lab/labs', { method: 'POST', body: JSON.stringify(body) }),
  updateLab: (id: number, body: unknown) => api<Lab>(`/api/lab/labs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  assignLab: (id: number, body: unknown) => api(`/api/lab/labs/${id}/assignments`, { method: 'POST', body: JSON.stringify(body) }),
  endAssignment: (id: number) => api(`/api/lab/assignments/${id}`, { method: 'DELETE' }),

  assets: (f: Record<string, unknown> = {}) => api<{ rows: LabAsset[]; total: number; page: number; pageSize: number }>(`/api/lab/assets${qs(f)}`),
  asset: (id: number) => api<LabAsset>(`/api/lab/assets/${id}`),
  createAsset: (body: unknown) => api<LabAsset>('/api/lab/assets', { method: 'POST', body: JSON.stringify(body) }),
  updateAsset: (id: number, body: unknown) => api<LabAsset>(`/api/lab/assets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  changeAssetStatus: (id: number, body: unknown) => api<LabAsset>(`/api/lab/assets/${id}/status`, { method: 'POST', body: JSON.stringify(body) }),

  stock: (f: Record<string, unknown> = {}) => api<StockItem[]>(`/api/lab/stock${qs(f)}`),
  createStock: (body: unknown) => api<StockItem>('/api/lab/stock', { method: 'POST', body: JSON.stringify(body) }),
  moveStock: (id: number, body: unknown) => api(`/api/lab/stock/${id}/movements`, { method: 'POST', body: JSON.stringify(body) }),
  ledger: (id: number) => api<{ item: StockItem; movements: any[] }>(`/api/lab/stock/${id}/ledger`),

  issues: (f: Record<string, unknown> = {}) => api<LabIssue[]>(`/api/lab/issues${qs(f)}`),
  createIssue: (body: unknown) => api<LabIssue>('/api/lab/issues', { method: 'POST', body: JSON.stringify(body) }),
  returnIssue: (id: number, body: unknown) => api<LabIssue>(`/api/lab/issues/${id}/return`, { method: 'POST', body: JSON.stringify(body) }),

  upcomingSessions: (days = 7) => api<LabSession[]>(`/api/lab/sessions/upcoming?days=${days}`),
  prepareSession: (body: unknown) => api<any>('/api/lab/sessions/prepare', { method: 'POST', body: JSON.stringify(body) }),
  updateReadiness: (id: number, body: unknown) => api<any>(`/api/lab/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  faults: (f: Record<string, unknown> = {}) => api<LabFault[]>(`/api/lab/faults${qs(f)}`),
  createFault: (body: unknown) => api<LabFault>('/api/lab/faults', { method: 'POST', body: JSON.stringify(body) }),
  updateFault: (id: number, body: unknown) => api<LabFault>(`/api/lab/faults/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  repairs: (f: Record<string, unknown> = {}) => api<LabRepair[]>(`/api/lab/repairs${qs(f)}`),
  createRepair: (body: unknown) => api<LabRepair>('/api/lab/repairs', { method: 'POST', body: JSON.stringify(body) }),
  updateRepair: (id: number, body: unknown) => api<LabRepair>(`/api/lab/repairs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  software: (f: Record<string, unknown> = {}) => api<LabSoftware[]>(`/api/lab/software${qs(f)}`),
  createSoftware: (body: unknown) => api<LabSoftware>('/api/lab/software', { method: 'POST', body: JSON.stringify(body) }),
  softwareRequests: (f: Record<string, unknown> = {}) => api<LabSoftwareRequest[]>(`/api/lab/software-requests${qs(f)}`),
  createSoftwareRequest: (body: unknown) => api<LabSoftwareRequest>('/api/lab/software-requests', { method: 'POST', body: JSON.stringify(body) }),
  reviewSoftwareRequest: (id: number, body: unknown) => api<LabSoftwareRequest>(`/api/lab/software-requests/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  requirements: (f: Record<string, unknown> = {}) => api<LabRequirement[]>(`/api/lab/requirements${qs(f)}`),
  createRequirement: (body: unknown) => api<LabRequirement>('/api/lab/requirements', { method: 'POST', body: JSON.stringify(body) }),
  decideRequirement: (id: number, body: unknown) => api<LabRequirement>(`/api/lab/requirements/${id}/decision`, { method: 'POST', body: JSON.stringify(body) }),

  report: (type: string, f: Record<string, unknown> = {}) => api<{ type: string; columns: string[]; rows: any[]; generatedAt: string }>(`/api/lab/reports/${type}${qs(f)}`),
};

export const canLab = (meta: LabMeta | null, perm: string) => !!meta && (meta.permissions.includes(perm) || meta.role === 'SUPER_ADMIN' || meta.role === 'COLLEGE_ADMIN');
