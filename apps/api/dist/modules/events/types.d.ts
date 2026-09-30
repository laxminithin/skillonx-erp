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
export type EventsPermission = 'events.event.create' | 'events.event.view' | 'events.event.viewAll' | 'events.event.review' | 'events.event.close' | 'events.capacity.override' | 'events.resource.manage' | 'events.reservation.request' | 'events.reservation.decide' | 'events.report.view';
export declare const DEFAULT_EVENT_TYPES: Array<{
    code: string;
    name: string;
}>;
export declare const ORGANIZER_UNIT_TYPES: readonly ["INSTITUTION", "DEPARTMENT", "CLUB", "CELL", "COMMITTEE", "OTHER"];
export declare const EVENT_VISIBILITIES: readonly ["DEPARTMENT", "INSTITUTION"];
export declare const REGISTRATION_AUDIENCES: readonly ["STUDENTS", "STAFF", "ALL"];
export declare const EVENT_STATUSES: readonly ["DRAFT", "UNDER_REVIEW", "RETURNED", "APPROVED", "SCHEDULED", "COMPLETED", "CLOSED", "REJECTED", "CANCELLED"];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export declare const EDITABLE_EVENT_STATUSES: ReadonlySet<string>;
export declare const TERMINAL_EVENT_STATUSES: ReadonlySet<string>;
/** Statuses whose record is historical: no reschedule/cancel/resource/registration change. */
export declare const FROZEN_EVENT_STATUSES: ReadonlySet<string>;
export declare const RESOURCE_KINDS: readonly ["ROOM", "ASSET"];
export declare const RESERVATION_STATUSES: readonly ["REQUESTED", "CONFIRMED", "REJECTED", "CANCELLED"];
export declare const ACTIVE_RESERVATION_STATUSES: readonly ["REQUESTED", "CONFIRMED"];
/** Asset statuses that make equipment unavailable for booking (authoritative in P0.2). */
export declare const UNBOOKABLE_ASSET_STATUSES: ReadonlySet<string>;
export declare const MAX_EVENT_DAYS = 14;
export declare const MAX_CALENDAR_DAYS = 62;
export declare const REVIEW_ACTIONS: readonly ["APPROVE", "REJECT", "RETURN"];
export declare const eventTypeSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
    isActive?: boolean | undefined;
}, {
    code: string;
    name: string;
    isActive?: boolean | undefined;
}>;
export declare const eventSchema: z.ZodObject<{
    title: z.ZodString;
    eventType: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    objective: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    organizerUnitType: z.ZodEnum<["INSTITUTION", "DEPARTMENT", "CLUB", "CELL", "COMMITTEE", "OTHER"]>;
    organizerUnitName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    externalVenue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedParticipants: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    visibility: z.ZodOptional<z.ZodEnum<["DEPARTMENT", "INSTITUTION"]>>;
    registrationEnabled: z.ZodOptional<z.ZodBoolean>;
    registrationAudience: z.ZodOptional<z.ZodEnum<["STUDENTS", "STAFF", "ALL"]>>;
    registrationCapacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    registrationClosesAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hasExternalParticipants: z.ZodOptional<z.ZodBoolean>;
    plannedBudget: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    eventType: string;
    startsAt: string;
    endsAt: string;
    organizerUnitType: "OTHER" | "INSTITUTION" | "COMMITTEE" | "DEPARTMENT" | "CLUB" | "CELL";
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    visibility?: "INSTITUTION" | "DEPARTMENT" | undefined;
    registrationClosesAt?: string | null | undefined;
    objective?: string | null | undefined;
    organizerUnitName?: string | null | undefined;
    externalVenue?: string | null | undefined;
    expectedParticipants?: number | null | undefined;
    registrationEnabled?: boolean | undefined;
    registrationAudience?: "ALL" | "STAFF" | "STUDENTS" | undefined;
    registrationCapacity?: number | null | undefined;
    hasExternalParticipants?: boolean | undefined;
    plannedBudget?: number | null | undefined;
}, {
    title: string;
    eventType: string;
    startsAt: string;
    endsAt: string;
    organizerUnitType: "OTHER" | "INSTITUTION" | "COMMITTEE" | "DEPARTMENT" | "CLUB" | "CELL";
    departmentId?: number | null | undefined;
    description?: string | null | undefined;
    visibility?: "INSTITUTION" | "DEPARTMENT" | undefined;
    registrationClosesAt?: string | null | undefined;
    objective?: string | null | undefined;
    organizerUnitName?: string | null | undefined;
    externalVenue?: string | null | undefined;
    expectedParticipants?: number | null | undefined;
    registrationEnabled?: boolean | undefined;
    registrationAudience?: "ALL" | "STAFF" | "STUDENTS" | undefined;
    registrationCapacity?: number | null | undefined;
    hasExternalParticipants?: boolean | undefined;
    plannedBudget?: number | null | undefined;
}>;
export declare const reviewSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REJECT", "RETURN"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "RETURN" | "APPROVE" | "REJECT";
    remarks?: string | null | undefined;
}, {
    action: "RETURN" | "APPROVE" | "REJECT";
    remarks?: string | null | undefined;
}>;
export declare const reasonSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const rescheduleSchema: z.ZodObject<{
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    startsAt: string;
    endsAt: string;
}, {
    reason: string;
    startsAt: string;
    endsAt: string;
}>;
export declare const capacityOverrideSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const eventResourceSchema: z.ZodObject<{
    resourceId: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    resourceId: number;
}, {
    resourceId: number;
}>;
export declare const resourceConfigSchema: z.ZodEffects<z.ZodObject<{
    resourceKind: z.ZodEnum<["ROOM", "ASSET"]>;
    roomId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    assetId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    requiresApproval: z.ZodOptional<z.ZodBoolean>;
    setupBufferMinutes: z.ZodOptional<z.ZodNumber>;
    cleanupBufferMinutes: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    resourceKind: "ROOM" | "ASSET";
    notes?: string | null | undefined;
    roomId?: number | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    assetId?: number | null | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}, {
    resourceKind: "ROOM" | "ASSET";
    notes?: string | null | undefined;
    roomId?: number | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    assetId?: number | null | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}>, {
    resourceKind: "ROOM" | "ASSET";
    notes?: string | null | undefined;
    roomId?: number | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    assetId?: number | null | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}, {
    resourceKind: "ROOM" | "ASSET";
    notes?: string | null | undefined;
    roomId?: number | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    assetId?: number | null | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}>;
export declare const resourceConfigUpdateSchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodBoolean>;
    requiresApproval: z.ZodOptional<z.ZodBoolean>;
    setupBufferMinutes: z.ZodOptional<z.ZodNumber>;
    cleanupBufferMinutes: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    notes?: string | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}, {
    notes?: string | null | undefined;
    isActive?: boolean | undefined;
    requiresApproval?: boolean | undefined;
    setupBufferMinutes?: number | undefined;
    cleanupBufferMinutes?: number | undefined;
}>;
export declare const reservationSchema: z.ZodObject<{
    resourceId: z.ZodNumber;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    purpose: z.ZodString;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    purpose: string;
    resourceId: number;
    startsAt: string;
    endsAt: string;
    idempotencyKey?: string | null | undefined;
}, {
    purpose: string;
    resourceId: number;
    startsAt: string;
    endsAt: string;
    idempotencyKey?: string | null | undefined;
}>;
export declare const reservationDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<["CONFIRM", "REJECT"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "REJECT" | "CONFIRM";
    remarks?: string | null | undefined;
}, {
    action: "REJECT" | "CONFIRM";
    remarks?: string | null | undefined;
}>;
export declare const externalParticipantSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    organization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    email?: string | null | undefined;
    organization?: string | null | undefined;
}, {
    name: string;
    email?: string | null | undefined;
    organization?: string | null | undefined;
}>;
export declare const attendanceSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        registrationId: z.ZodNumber;
        attendance: z.ZodEnum<["ATTENDED", "ABSENT"]>;
    }, "strict", z.ZodTypeAny, {
        attendance: "ABSENT" | "ATTENDED";
        registrationId: number;
    }, {
        attendance: "ABSENT" | "ATTENDED";
        registrationId: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    entries: {
        attendance: "ABSENT" | "ATTENDED";
        registrationId: number;
    }[];
}, {
    entries: {
        attendance: "ABSENT" | "ATTENDED";
        registrationId: number;
    }[];
}>;
export declare const completeSchema: z.ZodObject<{
    outcomeSummary: z.ZodString;
}, "strict", z.ZodTypeAny, {
    outcomeSummary: string;
}, {
    outcomeSummary: string;
}>;
export declare const eventDocumentSchema: z.ZodObject<{
    category: z.ZodEnum<["BROCHURE", "APPROVAL", "PHOTO", "ATTENDANCE_EVIDENCE", "REPORT", "OUTCOME", "OTHER"]>;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    contentBase64: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    category: "OTHER" | "REPORT" | "BROCHURE" | "APPROVAL" | "PHOTO" | "ATTENDANCE_EVIDENCE" | "OUTCOME";
    fileName: string;
    mimeType: string;
    contentBase64: string;
    description?: string | null | undefined;
}, {
    category: "OTHER" | "REPORT" | "BROCHURE" | "APPROVAL" | "PHOTO" | "ATTENDANCE_EVIDENCE" | "OUTCOME";
    fileName: string;
    mimeType: string;
    contentBase64: string;
    description?: string | null | undefined;
}>;
