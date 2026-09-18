import { z } from 'zod';
export const MAINT_PERMISSIONS = [
    'maint.ticket.create', // raise a ticket
    'maint.ticket.view.own', // see own tickets
    'maint.queue.view', // central queue / all tickets
    'maint.triage', // triage / route
    'maint.assign', // assign team + technician
    'maint.work', // acknowledge / start / worklog / resolve on assigned tickets
    'maint.parts.request', // request parts
    'maint.parts.approve', // approve parts / maintenance
    'maint.config', // categories / teams / routing rules
    'maint.report.view', // reports
    'maint.oversight.view', // department / institution oversight
];
export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
export const STATUSES = [
    'OPEN', 'TRIAGED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS',
    'WAITING_PARTS', 'WAITING_APPROVAL', 'WAITING_REQUESTER',
    'RESOLVED', 'CONFIRMED', 'CLOSED', 'CANCELLED', 'REOPENED',
];
export const WAITING_STATUSES = ['WAITING_PARTS', 'WAITING_APPROVAL', 'WAITING_REQUESTER'];
export const OPEN_STATUSES = [
    'OPEN', 'TRIAGED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS',
    'WAITING_PARTS', 'WAITING_APPROVAL', 'WAITING_REQUESTER', 'REOPENED',
];
export const TERMINAL_STATUSES = ['CLOSED', 'CANCELLED'];
export const SOURCE_MODULES = ['GENERAL', 'LAB', 'HOSTEL', 'LIBRARY', 'TRANSPORT', 'CLASSROOM', 'ERP'];
export const TEAM_KINDS = ['FACILITIES', 'IT'];
/** Default configurable categories (seeded per college on first config bootstrap). */
export const DEFAULT_CATEGORIES = [
    { code: 'IT_SYSTEMS', name: 'IT / Systems', kind: 'IT', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'IT_SUPPORT' },
    { code: 'NETWORK', name: 'Network / Internet', kind: 'IT', priority: 'HIGH', ackMins: 60, resolveMins: 480, team: 'IT_SUPPORT' },
    { code: 'COMPUTER', name: 'Computer / Peripheral', kind: 'IT', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'IT_SUPPORT' },
    { code: 'PROJECTOR', name: 'Projector / Smart Classroom', kind: 'IT', priority: 'HIGH', ackMins: 60, resolveMins: 480, team: 'IT_SUPPORT' },
    { code: 'ERP_APP', name: 'ERP Application', kind: 'IT', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'IT_SUPPORT' },
    { code: 'ELECTRICAL', name: 'Electrical', kind: 'FACILITIES', priority: 'HIGH', ackMins: 60, resolveMins: 480, team: 'ELECTRICAL' },
    { code: 'PLUMBING', name: 'Plumbing / Water', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 120, resolveMins: 720, team: 'PLUMBING' },
    { code: 'CIVIL', name: 'Civil', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 240, resolveMins: 2880, team: 'CIVIL' },
    { code: 'FURNITURE', name: 'Furniture', kind: 'FACILITIES', priority: 'LOW', ackMins: 480, resolveMins: 2880, team: 'CIVIL' },
    { code: 'HOUSEKEEPING', name: 'Housekeeping', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 120, resolveMins: 720, team: 'FACILITIES' },
    { code: 'LAB_EQUIPMENT', name: 'Lab Equipment', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'FACILITIES' },
    { code: 'LIBRARY_EQUIPMENT', name: 'Library Equipment', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'FACILITIES' },
    { code: 'HOSTEL_FACILITY', name: 'Hostel Facility', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 120, resolveMins: 1440, team: 'FACILITIES' },
    { code: 'TRANSPORT_FACILITY', name: 'Transport Facility / IT', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 240, resolveMins: 2880, team: 'FACILITIES' },
    { code: 'GENERAL', name: 'General Infrastructure', kind: 'FACILITIES', priority: 'NORMAL', ackMins: 240, resolveMins: 2880, team: 'FACILITIES' },
    { code: 'OTHER', name: 'Other', kind: 'FACILITIES', priority: 'LOW', ackMins: 480, resolveMins: 2880, team: 'TRIAGE' },
];
export const DEFAULT_TEAMS = [
    { code: 'TRIAGE', name: 'Triage / Unassigned', kind: 'FACILITIES', triage: true },
    { code: 'IT_SUPPORT', name: 'IT Support', kind: 'IT' },
    { code: 'ELECTRICAL', name: 'Electrical Maintenance', kind: 'FACILITIES' },
    { code: 'PLUMBING', name: 'Plumbing / Water', kind: 'FACILITIES' },
    { code: 'CIVIL', name: 'Civil / Furniture', kind: 'FACILITIES' },
    { code: 'FACILITIES', name: 'General Facilities', kind: 'FACILITIES' },
];
// ── Zod schemas ────────────────────────────────────────────────────────────
const dataUrl = z.string().max(4_000_000);
const attachmentSchema = z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().max(128).optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
    dataUrl: dataUrl.optional(),
});
export const createTicketSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(5000).optional(),
    categoryCode: z.string().max(48).optional(),
    categoryId: z.number().int().positive().optional(),
    subcategory: z.string().max(96).optional(),
    priority: z.enum(PRIORITIES).optional(),
    roomId: z.number().int().positive().optional(),
    building: z.string().max(96).optional(),
    locationNote: z.string().max(200).optional(),
    sourceModule: z.enum(SOURCE_MODULES).optional(),
    sourceEntityType: z.string().max(48).optional(),
    sourceEntityId: z.number().int().positive().optional(),
    assetRef: z.string().max(96).optional(),
    erpModule: z.string().max(64).optional(),
    erpRoute: z.string().max(200).optional(),
    attachments: z.array(attachmentSchema).max(5).optional(),
});
export const commentSchema = z.object({
    body: z.string().min(1).max(4000),
    visibility: z.enum(['REQUESTER', 'INTERNAL']).optional(),
});
export const workLogSchema = z.object({
    workPerformed: z.string().min(1).max(4000),
    diagnosis: z.string().max(2000).optional(),
    action: z.string().max(2000).optional(),
    partsUsed: z.string().max(2000).optional(),
    nextStep: z.string().max(2000).optional(),
    minutesSpent: z.number().int().nonnegative().max(100000).optional(),
});
export const assignSchema = z.object({
    teamId: z.number().int().positive().optional(),
    technicianId: z.number().int().positive().nullable().optional(),
    reason: z.string().max(500).optional(),
});
export const prioritySchema = z.object({
    priority: z.enum(PRIORITIES),
    reason: z.string().max(500).optional(),
});
export const statusSchema = z.object({
    status: z.enum(STATUSES),
    note: z.string().max(2000).optional(),
});
export const resolveSchema = z.object({
    resolutionSummary: z.string().min(3).max(4000),
    closureOutcome: z.enum(['RESOLVED', 'NOT_REPRODUCIBLE', 'DUPLICATE', 'REJECTED']).optional(),
});
export const partRequestSchema = z.object({
    item: z.string().min(1).max(200),
    quantity: z.number().positive().max(100000).optional(),
    unit: z.string().max(24).optional(),
    reason: z.string().max(2000).optional(),
    estimatedCost: z.number().nonnegative().optional(),
});
export const partDecisionSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'FULFILLED']),
    note: z.string().max(2000).optional(),
    storeRef: z.string().max(64).optional(),
    purchaseRef: z.string().max(64).optional(),
});
export const reopenSchema = z.object({ reason: z.string().min(1).max(2000) });
export const confirmSchema = z.object({ note: z.string().max(2000).optional() });
export const escalateSchema = z.object({
    level: z.enum(['MANAGER', 'PRINCIPAL']),
    reason: z.string().max(2000).optional(),
});
export const vendorSchema = z.object({
    vendorName: z.string().max(160).optional(),
    vendorRef: z.string().max(96).optional(),
    vendorSentDate: z.string().max(32).optional(),
    vendorExpectedReturn: z.string().max(32).optional(),
    vendorStatus: z.string().max(24).optional(),
});
// Config
export const categorySchema = z.object({
    code: z.string().min(2).max(48),
    name: z.string().min(2).max(160),
    kind: z.enum(TEAM_KINDS).optional(),
    defaultTeamId: z.number().int().positive().nullable().optional(),
    defaultPriority: z.enum(PRIORITIES).optional(),
    ackSlaMins: z.number().int().nonnegative().nullable().optional(),
    resolveSlaMins: z.number().int().nonnegative().nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
    description: z.string().max(1000).optional(),
});
export const teamSchema = z.object({
    code: z.string().min(2).max(48),
    name: z.string().min(2).max(160),
    kind: z.enum(TEAM_KINDS).optional(),
    isTriage: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    description: z.string().max(1000).optional(),
    memberFacultyIds: z.array(z.number().int().positive()).optional(),
});
export const routingRuleSchema = z.object({
    name: z.string().min(2).max(160),
    priority: z.number().int().nonnegative().optional(),
    matchCategoryId: z.number().int().positive().nullable().optional(),
    matchSourceModule: z.enum(SOURCE_MODULES).nullable().optional(),
    matchBuilding: z.string().max(96).nullable().optional(),
    matchDepartmentId: z.number().int().positive().nullable().optional(),
    targetTeamId: z.number().int().positive(),
    isActive: z.boolean().optional(),
    explanation: z.string().max(500).optional(),
});
