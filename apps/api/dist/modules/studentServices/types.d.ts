import { z } from 'zod';
export declare const REQUEST_STATUSES: readonly ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "APPROVED", "REJECTED", "PROCESSING", "READY", "COMPLETED", "CANCELLED"];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export declare const GRIEVANCE_STATUSES: readonly ["DRAFT", "SUBMITTED", "TRIAGED", "ASSIGNED", "UNDER_REVIEW", "PENDING_INFORMATION", "REFERRED", "ACTION_IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED", "REJECTED", "WITHDRAWN"];
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];
export declare const GRIEVANCE_CATEGORIES: readonly ["GENERAL_GRIEVANCE", "ACADEMIC", "ADMINISTRATIVE", "EXAMINATION", "FINANCE", "ATTENDANCE", "FACULTY", "FACILITIES", "LIBRARY", "HOSTEL", "TRANSPORT", "PLACEMENT", "STUDENT_WELFARE", "MENTORING_REFERRAL", "DISCIPLINE_RELATED", "SAFETY_CONCERN", "ANTI_RAGGING", "HARASSMENT", "LAB", "OTHER"];
export declare const DOCUMENT_STATUSES: readonly ["VALID", "REVOKED", "SUPERSEDED"];
export declare const MEETING_STATUSES: readonly ["REQUESTED", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
export declare const STUDENT_SERVICES_PERMISSIONS: readonly ["student_services.view", "student_services.process", "certificate.approve", "certificate.issue", "profile_correction.approve", "grievance.assign", "grievance.resolve", "grievance.triage", "grievance.note", "grievance.refer", "mentor.manage"];
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
export declare const createRequestSchema: z.ZodObject<{
    requestTypeCode: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    formData: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    requestTypeCode: string;
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    formData?: Record<string, unknown> | null | undefined;
}, {
    title: string;
    requestTypeCode: string;
    description?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    formData?: Record<string, unknown> | null | undefined;
}>;
export declare const submitRequestSchema: z.ZodObject<{
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    remarks?: string | null | undefined;
}, {
    remarks?: string | null | undefined;
}>;
export declare const respondRequestSchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export declare const actionRequestSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REJECT", "REQUEST_ACTION", "PROCESS", "COMPLETE"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalRemarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "APPROVE" | "COMPLETE" | "REJECT" | "REQUEST_ACTION" | "PROCESS";
    remarks?: string | null | undefined;
    internalRemarks?: string | null | undefined;
}, {
    action: "APPROVE" | "COMPLETE" | "REJECT" | "REQUEST_ACTION" | "PROCESS";
    remarks?: string | null | undefined;
    internalRemarks?: string | null | undefined;
}>;
export declare const createGrievanceSchema: z.ZodObject<{
    category: z.ZodEnum<["GENERAL_GRIEVANCE", "ACADEMIC", "ADMINISTRATIVE", "EXAMINATION", "FINANCE", "ATTENDANCE", "FACULTY", "FACILITIES", "LIBRARY", "HOSTEL", "TRANSPORT", "PLACEMENT", "STUDENT_WELFARE", "MENTORING_REFERRAL", "DISCIPLINE_RELATED", "SAFETY_CONCERN", "ANTI_RAGGING", "HARASSMENT", "LAB", "OTHER"]>;
    subject: z.ZodString;
    description: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    confidentiality: z.ZodOptional<z.ZodEnum<["STANDARD", "NORMAL", "CONFIDENTIAL", "SENSITIVE", "RESTRICTED"]>>;
    sourceModule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceEntityType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceEntityId: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    studentUrgencyReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    anonymous: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: "FACULTY" | "OTHER" | "ACADEMIC" | "PLACEMENT" | "LAB" | "ATTENDANCE" | "FINANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "GENERAL_GRIEVANCE" | "ADMINISTRATIVE" | "EXAMINATION" | "FACILITIES" | "STUDENT_WELFARE" | "MENTORING_REFERRAL" | "DISCIPLINE_RELATED" | "SAFETY_CONCERN" | "ANTI_RAGGING" | "HARASSMENT";
    subject: string;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    confidentiality?: "RESTRICTED" | "STANDARD" | "CONFIDENTIAL" | "NORMAL" | "SENSITIVE" | undefined;
    sourceModule?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: string | number | null | undefined;
    studentUrgencyReason?: string | null | undefined;
    anonymous?: boolean | undefined;
}, {
    description: string;
    category: "FACULTY" | "OTHER" | "ACADEMIC" | "PLACEMENT" | "LAB" | "ATTENDANCE" | "FINANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "GENERAL_GRIEVANCE" | "ADMINISTRATIVE" | "EXAMINATION" | "FACILITIES" | "STUDENT_WELFARE" | "MENTORING_REFERRAL" | "DISCIPLINE_RELATED" | "SAFETY_CONCERN" | "ANTI_RAGGING" | "HARASSMENT";
    subject: string;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    confidentiality?: "RESTRICTED" | "STANDARD" | "CONFIDENTIAL" | "NORMAL" | "SENSITIVE" | undefined;
    sourceModule?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: string | number | null | undefined;
    studentUrgencyReason?: string | null | undefined;
    anonymous?: boolean | undefined;
}>;
export declare const assignGrievanceSchema: z.ZodObject<{
    facultyId: z.ZodNumber;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    facultyId: number;
    remarks?: string | null | undefined;
}, {
    facultyId: number;
    remarks?: string | null | undefined;
}>;
export declare const resolveGrievanceSchema: z.ZodObject<{
    resolutionSummary: z.ZodString;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    resolutionSummary: string;
    remarks?: string | null | undefined;
}, {
    resolutionSummary: string;
    remarks?: string | null | undefined;
}>;
export declare const triageGrievanceSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["GENERAL_GRIEVANCE", "ACADEMIC", "ADMINISTRATIVE", "EXAMINATION", "FINANCE", "ATTENDANCE", "FACULTY", "FACILITIES", "LIBRARY", "HOSTEL", "TRANSPORT", "PLACEMENT", "STUDENT_WELFARE", "MENTORING_REFERRAL", "DISCIPLINE_RELATED", "SAFETY_CONCERN", "ANTI_RAGGING", "HARASSMENT", "LAB", "OTHER"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    confidentiality: z.ZodOptional<z.ZodEnum<["NORMAL", "CONFIDENTIAL", "RESTRICTED", "STANDARD", "SENSITIVE"]>>;
    severity: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
    category?: "FACULTY" | "OTHER" | "ACADEMIC" | "PLACEMENT" | "LAB" | "ATTENDANCE" | "FINANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "GENERAL_GRIEVANCE" | "ADMINISTRATIVE" | "EXAMINATION" | "FACILITIES" | "STUDENT_WELFARE" | "MENTORING_REFERRAL" | "DISCIPLINE_RELATED" | "SAFETY_CONCERN" | "ANTI_RAGGING" | "HARASSMENT" | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    severity?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    confidentiality?: "RESTRICTED" | "STANDARD" | "CONFIDENTIAL" | "NORMAL" | "SENSITIVE" | undefined;
}, {
    reason?: string | null | undefined;
    category?: "FACULTY" | "OTHER" | "ACADEMIC" | "PLACEMENT" | "LAB" | "ATTENDANCE" | "FINANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "GENERAL_GRIEVANCE" | "ADMINISTRATIVE" | "EXAMINATION" | "FACILITIES" | "STUDENT_WELFARE" | "MENTORING_REFERRAL" | "DISCIPLINE_RELATED" | "SAFETY_CONCERN" | "ANTI_RAGGING" | "HARASSMENT" | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    severity?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    confidentiality?: "RESTRICTED" | "STANDARD" | "CONFIDENTIAL" | "NORMAL" | "SENSITIVE" | undefined;
}>;
export declare const clarificationSchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export declare const internalNoteSchema: z.ZodObject<{
    body: z.ZodString;
    visibility: z.ZodOptional<z.ZodEnum<["TEAM", "RESTRICTED"]>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    visibility?: "RESTRICTED" | "TEAM" | undefined;
}, {
    body: string;
    visibility?: "RESTRICTED" | "TEAM" | undefined;
}>;
export declare const referralSchema: z.ZodObject<{
    targetModule: z.ZodEnum<["MAINTENANCE", "MENTORING", "OFFICE", "FINANCE", "COE", "HOSTEL", "TRANSPORT", "LIBRARY", "LAB", "PLACEMENT", "OTHER"]>;
    targetEntityType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetEntityId: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    safeReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    safeSummary: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    targetModule: "COE" | "OTHER" | "PLACEMENT" | "LAB" | "FINANCE" | "MAINTENANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "MENTORING" | "OFFICE";
    targetEntityType?: string | null | undefined;
    targetEntityId?: string | number | null | undefined;
    safeReference?: string | null | undefined;
    safeSummary?: string | null | undefined;
}, {
    targetModule: "COE" | "OTHER" | "PLACEMENT" | "LAB" | "FINANCE" | "MAINTENANCE" | "LIBRARY" | "HOSTEL" | "TRANSPORT" | "MENTORING" | "OFFICE";
    targetEntityType?: string | null | undefined;
    targetEntityId?: string | number | null | undefined;
    safeReference?: string | null | undefined;
    safeSummary?: string | null | undefined;
}>;
export declare const appealSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const reopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const feedbackSchema: z.ZodObject<{
    feedback: z.ZodEnum<["ACCEPTED", "UNRESOLVED"]>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    feedback: "UNRESOLVED" | "ACCEPTED";
    reason?: string | null | undefined;
}, {
    feedback: "UNRESOLVED" | "ACCEPTED";
    reason?: string | null | undefined;
}>;
export declare const createMeetingSchema: z.ZodObject<{
    meetingType: z.ZodOptional<z.ZodEnum<["GENERAL", "ACADEMIC", "CAREER", "PERSONAL"]>>;
    agenda: z.ZodString;
    preferredDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    agenda: string;
    meetingType?: "ACADEMIC" | "PERSONAL" | "GENERAL" | "CAREER" | undefined;
    preferredDate?: string | null | undefined;
}, {
    agenda: string;
    meetingType?: "ACADEMIC" | "PERSONAL" | "GENERAL" | "CAREER" | undefined;
    preferredDate?: string | null | undefined;
}>;
export declare const scheduleMeetingSchema: z.ZodObject<{
    scheduledAt: z.ZodString;
    meetingType: z.ZodOptional<z.ZodEnum<["GENERAL", "ACADEMIC", "CAREER", "PERSONAL"]>>;
    studentVisibleNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
    meetingType?: "ACADEMIC" | "PERSONAL" | "GENERAL" | "CAREER" | undefined;
    studentVisibleNotes?: string | null | undefined;
}, {
    scheduledAt: string;
    meetingType?: "ACADEMIC" | "PERSONAL" | "GENERAL" | "CAREER" | undefined;
    studentVisibleNotes?: string | null | undefined;
}>;
export declare const completeMeetingSchema: z.ZodObject<{
    studentVisibleNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    privateNotes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    followUpDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    referralStatus: z.ZodNullable<z.ZodOptional<z.ZodEnum<["REFERRED", "CONTACTED", "CLOSED"]>>>;
}, "strip", z.ZodTypeAny, {
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    followUpDate?: string | null | undefined;
    referralStatus?: "CLOSED" | "REFERRED" | "CONTACTED" | null | undefined;
}, {
    studentVisibleNotes?: string | null | undefined;
    privateNotes?: string | null | undefined;
    followUpDate?: string | null | undefined;
    referralStatus?: "CLOSED" | "REFERRED" | "CONTACTED" | null | undefined;
}>;
export type FormFieldSchema = {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'file';
    required?: boolean;
    options?: string[];
    placeholder?: string;
};
