import { z } from 'zod';
export type SecurityActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
};
export type SecurityPermission = 'security.gate.manage' | 'security.gate.view' | 'security.visitor.request' | 'security.visitor.approve' | 'security.visitor.checkinout' | 'security.visitor.view' | 'security.incident.report' | 'security.incident.manage' | 'security.incident.view';
export declare const VISIT_STATUSES: readonly ["REQUESTED", "APPROVED", "REJECTED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT", "EXPIRED"];
export type VisitStatus = (typeof VISIT_STATUSES)[number];
/** Terminal statuses: no further transition is legal from here. */
export declare const TERMINAL_VISIT_STATUSES: ReadonlySet<VisitStatus>;
/** Explicit allowed status transitions. Anything not listed here is rejected. */
export declare const VISIT_STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]>;
export declare const VISIT_TYPES: readonly ["GUEST", "VENDOR", "CONTRACTOR", "OFFICIAL", "OTHER"];
export type VisitType = (typeof VISIT_TYPES)[number];
export declare const VISIT_EVENT_TYPES: readonly ["REQUESTED", "APPROVED", "REJECTED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT", "EXPIRED"];
export declare const INCIDENT_SEVERITIES: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];
export declare const INCIDENT_STATUSES: readonly ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
/** Terminal incident statuses cannot transition further. */
export declare const TERMINAL_INCIDENT_STATUSES: ReadonlySet<IncidentStatus>;
export declare const INCIDENT_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]>;
export declare const gateSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gateType: z.ZodOptional<z.ZodString>;
    locationNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    code?: string | null | undefined;
    locationNote?: string | null | undefined;
    gateType?: string | undefined;
}, {
    name: string;
    code?: string | null | undefined;
    locationNote?: string | null | undefined;
    gateType?: string | undefined;
}>;
export declare const gateStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
export declare const visitorRequestSchema: z.ZodObject<{
    visitorName: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idReferenceMasked: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    photoDocumentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    visitType: z.ZodOptional<z.ZodEnum<["GUEST", "VENDOR", "CONTRACTOR", "OFFICIAL", "OTHER"]>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hostType: z.ZodOptional<z.ZodEnum<["FACULTY", "STUDENT"]>>;
    hostFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    hostStudentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    vendorId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gateId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    expectedEntryAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedExitAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    validUntil: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    visitorName: string;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    purpose?: string | null | undefined;
    expectedExitAt?: string | null | undefined;
    vendorId?: number | null | undefined;
    validUntil?: string | null | undefined;
    idType?: string | null | undefined;
    idReferenceMasked?: string | null | undefined;
    photoDocumentId?: number | null | undefined;
    visitType?: "OTHER" | "OFFICIAL" | "CONTRACTOR" | "VENDOR" | "GUEST" | undefined;
    hostType?: "STUDENT" | "FACULTY" | undefined;
    hostFacultyId?: number | null | undefined;
    hostStudentId?: number | null | undefined;
    gateId?: number | null | undefined;
    expectedEntryAt?: string | null | undefined;
}, {
    visitorName: string;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    purpose?: string | null | undefined;
    expectedExitAt?: string | null | undefined;
    vendorId?: number | null | undefined;
    validUntil?: string | null | undefined;
    idType?: string | null | undefined;
    idReferenceMasked?: string | null | undefined;
    photoDocumentId?: number | null | undefined;
    visitType?: "OTHER" | "OFFICIAL" | "CONTRACTOR" | "VENDOR" | "GUEST" | undefined;
    hostType?: "STUDENT" | "FACULTY" | undefined;
    hostFacultyId?: number | null | undefined;
    hostStudentId?: number | null | undefined;
    gateId?: number | null | undefined;
    expectedEntryAt?: string | null | undefined;
}>;
export declare const visitDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REJECT"]>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "APPROVE" | "REJECT";
    reason?: string | null | undefined;
}, {
    action: "APPROVE" | "REJECT";
    reason?: string | null | undefined;
}>;
export declare const visitCheckInSchema: z.ZodObject<{
    gateId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    remarks?: string | null | undefined;
    gateId?: number | null | undefined;
}, {
    remarks?: string | null | undefined;
    gateId?: number | null | undefined;
}>;
export declare const visitCheckOutSchema: z.ZodObject<{
    gateId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    remarks?: string | null | undefined;
    gateId?: number | null | undefined;
}, {
    remarks?: string | null | undefined;
    gateId?: number | null | undefined;
}>;
export declare const visitCancelSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const incidentSchema: z.ZodObject<{
    category: z.ZodString;
    gateId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodString;
    severity: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    occurredAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceDocumentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    description: string;
    category: string;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    locationNote?: string | null | undefined;
    occurredAt?: string | null | undefined;
    gateId?: number | null | undefined;
    evidenceDocumentId?: number | null | undefined;
}, {
    description: string;
    category: string;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    locationNote?: string | null | undefined;
    occurredAt?: string | null | undefined;
    gateId?: number | null | undefined;
    evidenceDocumentId?: number | null | undefined;
}>;
export declare const incidentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]>;
    resolutionNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    status: "CLOSED" | "OPEN" | "RESOLVED" | "INVESTIGATING";
    resolutionNotes?: string | null | undefined;
}, {
    status: "CLOSED" | "OPEN" | "RESOLVED" | "INVESTIGATING";
    resolutionNotes?: string | null | undefined;
}>;
