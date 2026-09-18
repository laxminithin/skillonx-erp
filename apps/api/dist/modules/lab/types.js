import { z } from 'zod';
export const LAB_PERMISSIONS = [
    'lab.view',
    'lab.master.manage',
    'lab.assignment.manage',
    'lab.asset.manage',
    'lab.stock.manage',
    'lab.issue.manage',
    'lab.session.manage',
    'lab.fault.manage',
    'lab.repair.manage',
    'lab.repair.approve',
    'lab.software.manage',
    'lab.software.request',
    'lab.requirement.create',
    'lab.requirement.approve',
    'lab.oversight.view',
    'lab.report.view',
];
export const ASSET_CATEGORIES = [
    'DESKTOP', 'LAPTOP', 'MONITOR', 'UPS', 'PRINTER', 'PROJECTOR', 'NETWORK',
    'BOARD', 'INSTRUMENT', 'TOOL', 'FURNITURE', 'PERIPHERAL', 'EQUIPMENT', 'OTHER',
];
export const OPERATIONAL_STATUSES = [
    'AVAILABLE', 'IN_USE', 'FAULTY', 'UNDER_REPAIR', 'RESERVED', 'RETIRED', 'LOST',
];
export const CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED'];
export const MOVEMENT_TYPES = [
    'RECEIPT', 'ISSUE', 'RETURN', 'CONSUMPTION', 'TRANSFER', 'ADJUSTMENT', 'SCRAP',
];
export const READINESS_STATES = [
    'NOT_STARTED', 'IN_PREPARATION', 'READY', 'ISSUE_REPORTED', 'COMPLETED',
];
export const FAULT_STATES = [
    'OPEN', 'ACKNOWLEDGED', 'UNDER_DIAGNOSIS', 'UNDER_REPAIR', 'RESOLVED', 'CLOSED',
];
export const REPAIR_STATES = ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const REQUIREMENT_STATES = [
    'SUBMITTED', 'INCHARGE_APPROVED', 'HOD_APPROVED', 'PRINCIPAL_APPROVED', 'REJECTED', 'FULFILLED',
];
export const REQUIREMENT_TYPES = [
    'NEW_ASSET', 'REPLACEMENT', 'CONSUMABLES', 'SOFTWARE', 'REPAIR', 'UPGRADE',
];
// ── Zod schemas ────────────────────────────────────────────────────────
export const labSchema = z.object({
    name: z.string().min(2).max(160),
    code: z.string().min(1).max(48),
    departmentId: z.number().int().positive().nullable().optional(),
    roomId: z.number().int().positive().nullable().optional(),
    labType: z.string().max(48).optional(),
    capacity: z.number().int().nonnegative().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    description: z.string().max(2000).nullable().optional(),
});
export const assignmentSchema = z.object({
    facultyId: z.number().int().positive(),
    assignmentRole: z.enum(['LAB_ASSISTANT', 'LAB_INCHARGE']),
    isPrimary: z.boolean().optional(),
    remarks: z.string().max(500).nullable().optional(),
});
export const assetSchema = z.object({
    labId: z.number().int().positive().nullable().optional(),
    assetTag: z.string().min(1).max(64),
    serialNumber: z.string().max(128).nullable().optional(),
    category: z.enum(ASSET_CATEGORIES).optional(),
    assetClass: z.enum(['ASSET', 'COMPUTER', 'ACCESSORY']).optional(),
    name: z.string().min(1).max(160),
    make: z.string().max(96).nullable().optional(),
    model: z.string().max(96).nullable().optional(),
    purchaseDate: z.string().nullable().optional(),
    cost: z.number().nonnegative().nullable().optional(),
    vendor: z.string().max(160).nullable().optional(),
    warrantyStart: z.string().nullable().optional(),
    warrantyEnd: z.string().nullable().optional(),
    amcStart: z.string().nullable().optional(),
    amcEnd: z.string().nullable().optional(),
    condition: z.enum(CONDITIONS).optional(),
    custodianFacultyId: z.number().int().positive().nullable().optional(),
    hostname: z.string().max(96).nullable().optional(),
    systemNumber: z.string().max(48).nullable().optional(),
    processor: z.string().max(96).nullable().optional(),
    ram: z.string().max(48).nullable().optional(),
    storage: z.string().max(96).nullable().optional(),
    os: z.string().max(96).nullable().optional(),
    remarks: z.string().max(2000).nullable().optional(),
});
export const assetStatusSchema = z.object({
    operationalStatus: z.enum(OPERATIONAL_STATUSES).optional(),
    condition: z.enum(CONDITIONS).optional(),
    labId: z.number().int().positive().nullable().optional(),
    custodianFacultyId: z.number().int().positive().nullable().optional(),
    note: z.string().max(500).nullable().optional(),
}).refine((v) => v.operationalStatus || v.condition || v.labId !== undefined || v.custodianFacultyId !== undefined, {
    message: 'At least one change is required',
});
export const stockItemSchema = z.object({
    labId: z.number().int().positive(),
    name: z.string().min(1).max(160),
    code: z.string().max(48).nullable().optional(),
    category: z.string().max(48).optional(),
    unit: z.string().max(24).optional(),
    openingStock: z.number().nonnegative().optional(),
    minThreshold: z.number().nonnegative().optional(),
});
export const stockMovementSchema = z.object({
    movementType: z.enum(MOVEMENT_TYPES),
    quantity: z.number().positive(),
    reason: z.string().max(255).nullable().optional(),
    reference: z.string().max(96).nullable().optional(),
    toLabId: z.number().int().positive().nullable().optional(),
});
export const issueSchema = z.object({
    labId: z.number().int().positive(),
    itemKind: z.enum(['ASSET', 'ACCESSORY', 'STOCK']),
    assetId: z.number().int().positive().nullable().optional(),
    stockItemId: z.number().int().positive().nullable().optional(),
    description: z.string().max(200).nullable().optional(),
    quantity: z.number().positive().optional(),
    recipientType: z.enum(['FACULTY', 'STUDENT', 'LAB', 'DEPARTMENT']),
    recipientFacultyId: z.number().int().positive().nullable().optional(),
    recipientStudentId: z.number().int().positive().nullable().optional(),
    recipientNote: z.string().max(200).nullable().optional(),
    issueDate: z.string(),
    expectedReturn: z.string().nullable().optional(),
    conditionOut: z.enum(CONDITIONS).nullable().optional(),
    remarks: z.string().max(500).nullable().optional(),
});
export const returnSchema = z.object({
    actualReturn: z.string().optional(),
    conditionIn: z.enum(CONDITIONS).nullable().optional(),
    status: z.enum(['RETURNED', 'LOST']).optional(),
    remarks: z.string().max(500).nullable().optional(),
});
export const sessionReadinessSchema = z.object({
    readinessStatus: z.enum(READINESS_STATES).optional(),
    checklist: z.array(z.object({ key: z.string(), label: z.string(), done: z.boolean() })).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
});
export const faultSchema = z.object({
    labId: z.number().int().positive(),
    assetId: z.number().int().positive().nullable().optional(),
    faultCategory: z.string().max(48).optional(),
    description: z.string().min(2).max(2000),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    impact: z.string().max(200).nullable().optional(),
});
export const faultStatusSchema = z.object({
    status: z.enum(FAULT_STATES),
    note: z.string().max(500).nullable().optional(),
});
export const repairSchema = z.object({
    labId: z.number().int().positive(),
    assetId: z.number().int().positive().nullable().optional(),
    faultId: z.number().int().positive().nullable().optional(),
    requestedAction: z.string().min(2).max(2000),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    vendor: z.string().max(160).nullable().optional(),
    estimatedCost: z.number().nonnegative().nullable().optional(),
});
export const repairUpdateSchema = z.object({
    status: z.enum(REPAIR_STATES).optional(),
    approvalStatus: z.enum(['APPROVED', 'REJECTED']).optional(),
    actualCost: z.number().nonnegative().nullable().optional(),
    postRepairCondition: z.enum(CONDITIONS).nullable().optional(),
    vendor: z.string().max(160).nullable().optional(),
    remarks: z.string().max(500).nullable().optional(),
});
export const softwareSchema = z.object({
    labId: z.number().int().positive(),
    name: z.string().min(1).max(160),
    version: z.string().max(48).nullable().optional(),
    licenseType: z.enum(['FREE', 'PROPRIETARY', 'SUBSCRIPTION', 'ACADEMIC', 'TRIAL']).optional(),
    licenseCount: z.number().int().nonnegative().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    installationStatus: z.enum(['INSTALLED', 'PENDING', 'PARTIAL']).optional(),
    vendorRef: z.string().max(160).nullable().optional(),
    remarks: z.string().max(500).nullable().optional(),
});
export const softwareRequestSchema = z.object({
    labId: z.number().int().positive(),
    softwareName: z.string().min(1).max(160),
    version: z.string().max(48).nullable().optional(),
    courseId: z.number().int().positive().nullable().optional(),
    reason: z.string().max(2000).nullable().optional(),
    neededBy: z.string().nullable().optional(),
});
export const softwareRequestReviewSchema = z.object({
    status: z.enum(['UNDER_REVIEW', 'COMPLETED', 'REJECTED']),
    resolution: z.string().max(1000).nullable().optional(),
});
export const requirementSchema = z.object({
    labId: z.number().int().positive(),
    requestType: z.enum(REQUIREMENT_TYPES),
    item: z.string().min(1).max(200),
    quantity: z.number().positive().optional(),
    reason: z.string().max(2000).nullable().optional(),
    academicJustification: z.string().max(2000).nullable().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    estimatedCost: z.number().nonnegative().nullable().optional(),
    courseId: z.number().int().positive().nullable().optional(),
    semester: z.string().max(24).nullable().optional(),
    studentStrength: z.number().int().nonnegative().nullable().optional(),
    currentStock: z.number().nonnegative().nullable().optional(),
});
export const requirementDecisionSchema = z.object({
    decision: z.enum(['APPROVE', 'REJECT', 'FULFILL']),
    remarks: z.string().max(500).nullable().optional(),
    purchaseRef: z.string().max(96).nullable().optional(),
});
export const maintenanceSchema = z.object({
    labId: z.number().int().positive(),
    assetId: z.number().int().positive().nullable().optional(),
    maintenanceType: z.string().min(1).max(96),
    dueDate: z.string(),
});
export const maintenanceCompleteSchema = z.object({
    result: z.string().max(1000).nullable().optional(),
});
