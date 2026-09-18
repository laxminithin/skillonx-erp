import { z } from 'zod';
/** Actor abstraction — a ticket requester or operator is EITHER a faculty user or a student. */
export type MaintActor = {
    kind: 'FACULTY' | 'STUDENT';
    facultyUserId?: number;
    studentId?: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name: string;
};
export declare const MAINT_PERMISSIONS: readonly ["maint.ticket.create", "maint.ticket.view.own", "maint.queue.view", "maint.triage", "maint.assign", "maint.work", "maint.parts.request", "maint.parts.approve", "maint.config", "maint.report.view", "maint.oversight.view"];
export type MaintPermission = (typeof MAINT_PERMISSIONS)[number];
export declare const PRIORITIES: readonly ["LOW", "NORMAL", "HIGH", "CRITICAL"];
export type Priority = (typeof PRIORITIES)[number];
export declare const STATUSES: readonly ["OPEN", "TRIAGED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL", "WAITING_REQUESTER", "RESOLVED", "CONFIRMED", "CLOSED", "CANCELLED", "REOPENED"];
export type TicketStatus = (typeof STATUSES)[number];
export declare const WAITING_STATUSES: TicketStatus[];
export declare const OPEN_STATUSES: TicketStatus[];
export declare const TERMINAL_STATUSES: TicketStatus[];
export declare const SOURCE_MODULES: readonly ["GENERAL", "LAB", "HOSTEL", "LIBRARY", "TRANSPORT", "CLASSROOM", "ERP"];
export type SourceModule = (typeof SOURCE_MODULES)[number];
export declare const TEAM_KINDS: readonly ["FACILITIES", "IT"];
/** Default configurable categories (seeded per college on first config bootstrap). */
export declare const DEFAULT_CATEGORIES: Array<{
    code: string;
    name: string;
    kind: 'FACILITIES' | 'IT';
    priority: Priority;
    ackMins: number;
    resolveMins: number;
    team: string;
}>;
export declare const DEFAULT_TEAMS: Array<{
    code: string;
    name: string;
    kind: 'FACILITIES' | 'IT';
    triage?: boolean;
}>;
export declare const createTicketSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    categoryCode: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodNumber>;
    subcategory: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "CRITICAL"]>>;
    roomId: z.ZodOptional<z.ZodNumber>;
    building: z.ZodOptional<z.ZodString>;
    locationNote: z.ZodOptional<z.ZodString>;
    sourceModule: z.ZodOptional<z.ZodEnum<["GENERAL", "LAB", "HOSTEL", "LIBRARY", "TRANSPORT", "CLASSROOM", "ERP"]>>;
    sourceEntityType: z.ZodOptional<z.ZodString>;
    sourceEntityId: z.ZodOptional<z.ZodNumber>;
    assetRef: z.ZodOptional<z.ZodString>;
    erpModule: z.ZodOptional<z.ZodString>;
    erpRoute: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        mimeType: z.ZodOptional<z.ZodString>;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
        dataUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filename: string;
        mimeType?: string | undefined;
        sizeBytes?: number | undefined;
        dataUrl?: string | undefined;
    }, {
        filename: string;
        mimeType?: string | undefined;
        sizeBytes?: number | undefined;
        dataUrl?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    roomId?: number | undefined;
    description?: string | undefined;
    building?: string | undefined;
    priority?: "HIGH" | "LOW" | "CRITICAL" | "NORMAL" | undefined;
    sourceModule?: "LAB" | "CLASSROOM" | "GENERAL" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "ERP" | undefined;
    sourceEntityType?: string | undefined;
    sourceEntityId?: number | undefined;
    attachments?: {
        filename: string;
        mimeType?: string | undefined;
        sizeBytes?: number | undefined;
        dataUrl?: string | undefined;
    }[] | undefined;
    categoryCode?: string | undefined;
    categoryId?: number | undefined;
    subcategory?: string | undefined;
    locationNote?: string | undefined;
    assetRef?: string | undefined;
    erpModule?: string | undefined;
    erpRoute?: string | undefined;
}, {
    title: string;
    roomId?: number | undefined;
    description?: string | undefined;
    building?: string | undefined;
    priority?: "HIGH" | "LOW" | "CRITICAL" | "NORMAL" | undefined;
    sourceModule?: "LAB" | "CLASSROOM" | "GENERAL" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "ERP" | undefined;
    sourceEntityType?: string | undefined;
    sourceEntityId?: number | undefined;
    attachments?: {
        filename: string;
        mimeType?: string | undefined;
        sizeBytes?: number | undefined;
        dataUrl?: string | undefined;
    }[] | undefined;
    categoryCode?: string | undefined;
    categoryId?: number | undefined;
    subcategory?: string | undefined;
    locationNote?: string | undefined;
    assetRef?: string | undefined;
    erpModule?: string | undefined;
    erpRoute?: string | undefined;
}>;
export declare const commentSchema: z.ZodObject<{
    body: z.ZodString;
    visibility: z.ZodOptional<z.ZodEnum<["REQUESTER", "INTERNAL"]>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    visibility?: "INTERNAL" | "REQUESTER" | undefined;
}, {
    body: string;
    visibility?: "INTERNAL" | "REQUESTER" | undefined;
}>;
export declare const workLogSchema: z.ZodObject<{
    workPerformed: z.ZodString;
    diagnosis: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    partsUsed: z.ZodOptional<z.ZodString>;
    nextStep: z.ZodOptional<z.ZodString>;
    minutesSpent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    workPerformed: string;
    action?: string | undefined;
    diagnosis?: string | undefined;
    partsUsed?: string | undefined;
    nextStep?: string | undefined;
    minutesSpent?: number | undefined;
}, {
    workPerformed: string;
    action?: string | undefined;
    diagnosis?: string | undefined;
    partsUsed?: string | undefined;
    nextStep?: string | undefined;
    minutesSpent?: number | undefined;
}>;
export declare const assignSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodNumber>;
    technicianId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    teamId?: number | undefined;
    technicianId?: number | null | undefined;
}, {
    reason?: string | undefined;
    teamId?: number | undefined;
    technicianId?: number | null | undefined;
}>;
export declare const prioritySchema: z.ZodObject<{
    priority: z.ZodEnum<["LOW", "NORMAL", "HIGH", "CRITICAL"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    priority: "HIGH" | "LOW" | "CRITICAL" | "NORMAL";
    reason?: string | undefined;
}, {
    priority: "HIGH" | "LOW" | "CRITICAL" | "NORMAL";
    reason?: string | undefined;
}>;
export declare const statusSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "TRIAGED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL", "WAITING_REQUESTER", "RESOLVED", "CONFIRMED", "CLOSED", "CANCELLED", "REOPENED"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "CLOSED" | "CONFIRMED" | "CANCELLED" | "REOPENED" | "IN_PROGRESS" | "OPEN" | "RESOLVED" | "ACKNOWLEDGED" | "TRIAGED" | "ASSIGNED" | "WAITING_PARTS" | "WAITING_APPROVAL" | "WAITING_REQUESTER";
    note?: string | undefined;
}, {
    status: "CLOSED" | "CONFIRMED" | "CANCELLED" | "REOPENED" | "IN_PROGRESS" | "OPEN" | "RESOLVED" | "ACKNOWLEDGED" | "TRIAGED" | "ASSIGNED" | "WAITING_PARTS" | "WAITING_APPROVAL" | "WAITING_REQUESTER";
    note?: string | undefined;
}>;
export declare const resolveSchema: z.ZodObject<{
    resolutionSummary: z.ZodString;
    closureOutcome: z.ZodOptional<z.ZodEnum<["RESOLVED", "NOT_REPRODUCIBLE", "DUPLICATE", "REJECTED"]>>;
}, "strip", z.ZodTypeAny, {
    resolutionSummary: string;
    closureOutcome?: "DUPLICATE" | "REJECTED" | "RESOLVED" | "NOT_REPRODUCIBLE" | undefined;
}, {
    resolutionSummary: string;
    closureOutcome?: "DUPLICATE" | "REJECTED" | "RESOLVED" | "NOT_REPRODUCIBLE" | undefined;
}>;
export declare const partRequestSchema: z.ZodObject<{
    item: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    estimatedCost: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    item: string;
    reason?: string | undefined;
    unit?: string | undefined;
    quantity?: number | undefined;
    estimatedCost?: number | undefined;
}, {
    item: string;
    reason?: string | undefined;
    unit?: string | undefined;
    quantity?: number | undefined;
    estimatedCost?: number | undefined;
}>;
export declare const partDecisionSchema: z.ZodObject<{
    status: z.ZodEnum<["APPROVED", "REJECTED", "FULFILLED"]>;
    note: z.ZodOptional<z.ZodString>;
    storeRef: z.ZodOptional<z.ZodString>;
    purchaseRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "APPROVED" | "REJECTED" | "FULFILLED";
    note?: string | undefined;
    purchaseRef?: string | undefined;
    storeRef?: string | undefined;
}, {
    status: "APPROVED" | "REJECTED" | "FULFILLED";
    note?: string | undefined;
    purchaseRef?: string | undefined;
    storeRef?: string | undefined;
}>;
export declare const reopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const confirmSchema: z.ZodObject<{
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    note?: string | undefined;
}, {
    note?: string | undefined;
}>;
export declare const escalateSchema: z.ZodObject<{
    level: z.ZodEnum<["MANAGER", "PRINCIPAL"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    level: "PRINCIPAL" | "MANAGER";
    reason?: string | undefined;
}, {
    level: "PRINCIPAL" | "MANAGER";
    reason?: string | undefined;
}>;
export declare const vendorSchema: z.ZodObject<{
    vendorName: z.ZodOptional<z.ZodString>;
    vendorRef: z.ZodOptional<z.ZodString>;
    vendorSentDate: z.ZodOptional<z.ZodString>;
    vendorExpectedReturn: z.ZodOptional<z.ZodString>;
    vendorStatus: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vendorRef?: string | undefined;
    vendorName?: string | undefined;
    vendorSentDate?: string | undefined;
    vendorExpectedReturn?: string | undefined;
    vendorStatus?: string | undefined;
}, {
    vendorRef?: string | undefined;
    vendorName?: string | undefined;
    vendorSentDate?: string | undefined;
    vendorExpectedReturn?: string | undefined;
    vendorStatus?: string | undefined;
}>;
export declare const categorySchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    kind: z.ZodOptional<z.ZodEnum<["FACILITIES", "IT"]>>;
    defaultTeamId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    defaultPriority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "CRITICAL"]>>;
    ackSlaMins: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    resolveSlaMins: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
    kind?: "FACILITIES" | "IT" | undefined;
    isActive?: boolean | undefined;
    defaultTeamId?: number | null | undefined;
    defaultPriority?: "HIGH" | "LOW" | "CRITICAL" | "NORMAL" | undefined;
    ackSlaMins?: number | null | undefined;
    resolveSlaMins?: number | null | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    sortOrder?: number | undefined;
    kind?: "FACILITIES" | "IT" | undefined;
    isActive?: boolean | undefined;
    defaultTeamId?: number | null | undefined;
    defaultPriority?: "HIGH" | "LOW" | "CRITICAL" | "NORMAL" | undefined;
    ackSlaMins?: number | null | undefined;
    resolveSlaMins?: number | null | undefined;
}>;
export declare const teamSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    kind: z.ZodOptional<z.ZodEnum<["FACILITIES", "IT"]>>;
    isTriage: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
    description: z.ZodOptional<z.ZodString>;
    memberFacultyIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    description?: string | undefined;
    kind?: "FACILITIES" | "IT" | undefined;
    isTriage?: boolean | undefined;
    memberFacultyIds?: number[] | undefined;
}, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    description?: string | undefined;
    kind?: "FACILITIES" | "IT" | undefined;
    isTriage?: boolean | undefined;
    memberFacultyIds?: number[] | undefined;
}>;
export declare const routingRuleSchema: z.ZodObject<{
    name: z.ZodString;
    priority: z.ZodOptional<z.ZodNumber>;
    matchCategoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    matchSourceModule: z.ZodOptional<z.ZodNullable<z.ZodEnum<["GENERAL", "LAB", "HOSTEL", "LIBRARY", "TRANSPORT", "CLASSROOM", "ERP"]>>>;
    matchBuilding: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    matchDepartmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    targetTeamId: z.ZodNumber;
    isActive: z.ZodOptional<z.ZodBoolean>;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    targetTeamId: number;
    explanation?: string | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    matchCategoryId?: number | null | undefined;
    matchSourceModule?: "LAB" | "CLASSROOM" | "GENERAL" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "ERP" | null | undefined;
    matchBuilding?: string | null | undefined;
    matchDepartmentId?: number | null | undefined;
}, {
    name: string;
    targetTeamId: number;
    explanation?: string | undefined;
    isActive?: boolean | undefined;
    priority?: number | undefined;
    matchCategoryId?: number | null | undefined;
    matchSourceModule?: "LAB" | "CLASSROOM" | "GENERAL" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "ERP" | null | undefined;
    matchBuilding?: string | null | undefined;
    matchDepartmentId?: number | null | undefined;
}>;
