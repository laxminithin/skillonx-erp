import { z } from 'zod';
/**
 * Campus OS Phase 7 — IQAC, Accreditation, Compliance & Institutional
 * Quality (thin evidence/snapshot/orchestration layer). See
 * docs/CAMPUS_OS_PHASE7_PREIMPLEMENTATION_AUDIT.md for the approved scope
 * boundary. This module never duplicates CO/PO/PSO (`copo`), attainment
 * (`attainment`), survey capture (`surveys`), Faculty Academic Record
 * (`facultyProfile`), Research (`research`), or document storage
 * (`documentEngine`) — all remain authoritative.
 */
export type IqacActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
    hodDepartmentIds?: number[] | null;
};
export type IqacPermission = 'iqac.framework.manage' | 'iqac.framework.view' | 'iqac.metric.manage' | 'iqac.metric.override' | 'iqac.metric.view' | 'iqac.cycle.manage' | 'iqac.cycle.approve' | 'iqac.evidence.submit' | 'iqac.evidence.verify' | 'iqac.evidence.view' | 'iqac.actionPlan.manage' | 'iqac.actionPlan.close' | 'iqac.actionPlan.reopen' | 'iqac.audit.manage' | 'iqac.audit.view' | 'iqac.committee.manage' | 'iqac.committee.view' | 'iqac.meeting.manage' | 'iqac.compliance.manage' | 'iqac.compliance.view' | 'iqac.dashboard.view';
export declare const FRAMEWORK_VERSION_STATUSES: readonly ["DRAFT", "ACTIVE", "RETIRED"];
export type FrameworkVersionStatus = (typeof FRAMEWORK_VERSION_STATUSES)[number];
export declare const CRITERION_LEVELS: readonly ["CRITERION", "KEY_INDICATOR"];
export type CriterionLevel = (typeof CRITERION_LEVELS)[number];
export declare const METRIC_SOURCE_TYPES: readonly ["SYSTEM_DERIVED", "MANUAL"];
export type MetricSourceType = (typeof METRIC_SOURCE_TYPES)[number];
/** Never silently converted to 0/PASS/COMPLETE/COMPLIANT — prompt §18. */
export declare const METRIC_VALUE_STATUSES: readonly ["OK", "ZERO", "NO_DATA", "NOT_APPLICABLE", "NOT_CONFIGURED", "SOURCE_ERROR", "PENDING_VERIFICATION"];
export type MetricValueStatus = (typeof METRIC_VALUE_STATUSES)[number];
export declare const CYCLE_STATUSES: readonly ["DRAFT", "DATA_COLLECTION", "REVIEW", "APPROVED", "FROZEN", "SUBMITTED", "CLOSED"];
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
/** Terminal states protected from any further transition. */
export declare const CYCLE_TERMINAL_STATUSES: CycleStatus[];
export declare const EVIDENCE_PROVENANCE: readonly ["SYSTEM_DERIVED", "SYSTEM_DOCUMENT", "MANUAL_UPLOAD", "EXTERNAL_REFERENCE"];
export type EvidenceProvenance = (typeof EVIDENCE_PROVENANCE)[number];
export declare const EVIDENCE_VERIFICATION_STATUSES: readonly ["SUBMITTED", "REVIEWED", "VERIFIED", "RETURNED", "REJECTED"];
export type EvidenceVerificationStatus = (typeof EVIDENCE_VERIFICATION_STATUSES)[number];
export declare const ACTION_PLAN_SOURCE_TYPES: readonly ["NBA_ATTAINMENT_GAP", "NAAC_OBSERVATION", "ACADEMIC_AUDIT", "SURVEY_FEEDBACK", "MANAGEMENT_REVIEW", "IQAC_MEETING", "COMPLIANCE_GAP", "OTHER"];
export type ActionPlanSourceType = (typeof ACTION_PLAN_SOURCE_TYPES)[number];
export declare const ACTION_PLAN_STATUSES: readonly ["PLANNED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"];
export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];
export declare const ACTION_PLAN_TERMINAL_STATUSES: ActionPlanStatus[];
export declare const AUDIT_STATUSES: readonly ["DRAFT", "IN_PROGRESS", "COMPLETED", "CLOSED"];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export declare const FINDING_SEVERITIES: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export declare const FINDING_STATUSES: readonly ["OPEN", "ACTION_PLANNED", "IN_PROGRESS", "CLOSED"];
export type FindingStatus = (typeof FINDING_STATUSES)[number];
export declare const COMMITTEE_TYPES: readonly ["IQAC", "ACADEMIC", "RESEARCH", "STATUTORY", "OTHER"];
export type CommitteeType = (typeof COMMITTEE_TYPES)[number];
export declare const COMMITTEE_MEMBER_ROLES: readonly ["CHAIRPERSON", "COORDINATOR", "MEMBER", "EXTERNAL_MEMBER"];
export type CommitteeMemberRole = (typeof COMMITTEE_MEMBER_ROLES)[number];
export declare const MEETING_STATUSES: readonly ["SCHEDULED", "HELD", "CANCELLED"];
export type MeetingStatus = (typeof MEETING_STATUSES)[number];
export declare const COMPLIANCE_STATUSES: readonly ["PENDING", "SUBMITTED", "OVERDUE", "WAIVED", "COMPLETED"];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export declare const frameworkSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | null | undefined;
}, {
    code: string;
    name: string;
    description?: string | null | undefined;
}>;
export declare const frameworkVersionSchema: z.ZodObject<{
    versionLabel: z.ZodString;
    effectiveFrom: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    effectiveTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    versionLabel: string;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}, {
    versionLabel: string;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}>;
export declare const criterionSchema: z.ZodObject<{
    parentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    level: z.ZodOptional<z.ZodEnum<["CRITERION", "KEY_INDICATOR"]>>;
    code: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    weight: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    code: string;
    title: string;
    description?: string | null | undefined;
    level?: "CRITERION" | "KEY_INDICATOR" | undefined;
    sortOrder?: number | undefined;
    weight?: number | null | undefined;
    parentId?: number | null | undefined;
}, {
    code: string;
    title: string;
    description?: string | null | undefined;
    level?: "CRITERION" | "KEY_INDICATOR" | undefined;
    sortOrder?: number | undefined;
    weight?: number | null | undefined;
    parentId?: number | null | undefined;
}>;
export declare const metricSchema: z.ZodEffects<z.ZodObject<{
    frameworkVersionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    criterionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceType: z.ZodEnum<["SYSTEM_DERIVED", "MANUAL"]>;
    sourceModule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unit: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetValue: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    ownerDepartmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
    sourceType: "MANUAL" | "SYSTEM_DERIVED";
    description?: string | null | undefined;
    unit?: string | null | undefined;
    sourceModule?: string | null | undefined;
    targetValue?: number | null | undefined;
    criterionId?: number | null | undefined;
    frameworkVersionId?: number | null | undefined;
    ownerDepartmentId?: number | null | undefined;
}, {
    code: string;
    name: string;
    sourceType: "MANUAL" | "SYSTEM_DERIVED";
    description?: string | null | undefined;
    unit?: string | null | undefined;
    sourceModule?: string | null | undefined;
    targetValue?: number | null | undefined;
    criterionId?: number | null | undefined;
    frameworkVersionId?: number | null | undefined;
    ownerDepartmentId?: number | null | undefined;
}>, {
    code: string;
    name: string;
    sourceType: "MANUAL" | "SYSTEM_DERIVED";
    description?: string | null | undefined;
    unit?: string | null | undefined;
    sourceModule?: string | null | undefined;
    targetValue?: number | null | undefined;
    criterionId?: number | null | undefined;
    frameworkVersionId?: number | null | undefined;
    ownerDepartmentId?: number | null | undefined;
}, {
    code: string;
    name: string;
    sourceType: "MANUAL" | "SYSTEM_DERIVED";
    description?: string | null | undefined;
    unit?: string | null | undefined;
    sourceModule?: string | null | undefined;
    targetValue?: number | null | undefined;
    criterionId?: number | null | undefined;
    frameworkVersionId?: number | null | undefined;
    ownerDepartmentId?: number | null | undefined;
}>;
export declare const manualMetricValueSchema: z.ZodObject<{
    periodLabel: z.ZodString;
    value: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    valueStatus: z.ZodOptional<z.ZodEnum<["OK", "ZERO", "NO_DATA", "NOT_APPLICABLE", "NOT_CONFIGURED", "SOURCE_ERROR", "PENDING_VERIFICATION"]>>;
    cycleId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    periodLabel: string;
    value?: number | null | undefined;
    cycleId?: number | null | undefined;
    valueStatus?: "NOT_APPLICABLE" | "SOURCE_ERROR" | "OK" | "NO_DATA" | "PENDING_VERIFICATION" | "NOT_CONFIGURED" | "ZERO" | undefined;
}, {
    periodLabel: string;
    value?: number | null | undefined;
    cycleId?: number | null | undefined;
    valueStatus?: "NOT_APPLICABLE" | "SOURCE_ERROR" | "OK" | "NO_DATA" | "PENDING_VERIFICATION" | "NOT_CONFIGURED" | "ZERO" | undefined;
}>;
export declare const metricOverrideSchema: z.ZodObject<{
    value: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    valueStatus: z.ZodEnum<["OK", "ZERO", "NO_DATA", "NOT_APPLICABLE", "NOT_CONFIGURED", "SOURCE_ERROR", "PENDING_VERIFICATION"]>;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    valueStatus: "NOT_APPLICABLE" | "SOURCE_ERROR" | "OK" | "NO_DATA" | "PENDING_VERIFICATION" | "NOT_CONFIGURED" | "ZERO";
    value?: number | null | undefined;
}, {
    reason: string;
    valueStatus: "NOT_APPLICABLE" | "SOURCE_ERROR" | "OK" | "NO_DATA" | "PENDING_VERIFICATION" | "NOT_CONFIGURED" | "ZERO";
    value?: number | null | undefined;
}>;
export declare const cycleSchema: z.ZodObject<{
    frameworkVersionId: z.ZodNumber;
    name: z.ZodString;
    academicYear: z.ZodString;
}, "strict", z.ZodTypeAny, {
    name: string;
    academicYear: string;
    frameworkVersionId: number;
}, {
    name: string;
    academicYear: string;
    frameworkVersionId: number;
}>;
export declare const cycleFreezeSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const cycleSubmitSchema: z.ZodObject<{
    submissionReference: z.ZodString;
}, "strict", z.ZodTypeAny, {
    submissionReference: string;
}, {
    submissionReference: string;
}>;
export declare const cycleReviseSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const evidenceSchema: z.ZodEffects<z.ZodObject<{
    cycleId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    criterionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    metricId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    provenance: z.ZodEnum<["SYSTEM_DERIVED", "SYSTEM_DOCUMENT", "MANUAL_UPLOAD", "EXTERNAL_REFERENCE"]>;
    sourceModule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceRecordType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceRecordId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    documentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    externalReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    periodLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    provenance: "SYSTEM_DERIVED" | "SYSTEM_DOCUMENT" | "MANUAL_UPLOAD" | "EXTERNAL_REFERENCE";
    academicYear?: string | null | undefined;
    cycleId?: number | null | undefined;
    externalReference?: string | null | undefined;
    sourceModule?: string | null | undefined;
    periodLabel?: string | null | undefined;
    criterionId?: number | null | undefined;
    documentId?: number | null | undefined;
    metricId?: number | null | undefined;
    sourceRecordType?: string | null | undefined;
    sourceRecordId?: number | null | undefined;
}, {
    provenance: "SYSTEM_DERIVED" | "SYSTEM_DOCUMENT" | "MANUAL_UPLOAD" | "EXTERNAL_REFERENCE";
    academicYear?: string | null | undefined;
    cycleId?: number | null | undefined;
    externalReference?: string | null | undefined;
    sourceModule?: string | null | undefined;
    periodLabel?: string | null | undefined;
    criterionId?: number | null | undefined;
    documentId?: number | null | undefined;
    metricId?: number | null | undefined;
    sourceRecordType?: string | null | undefined;
    sourceRecordId?: number | null | undefined;
}>, {
    provenance: "SYSTEM_DERIVED" | "SYSTEM_DOCUMENT" | "MANUAL_UPLOAD" | "EXTERNAL_REFERENCE";
    academicYear?: string | null | undefined;
    cycleId?: number | null | undefined;
    externalReference?: string | null | undefined;
    sourceModule?: string | null | undefined;
    periodLabel?: string | null | undefined;
    criterionId?: number | null | undefined;
    documentId?: number | null | undefined;
    metricId?: number | null | undefined;
    sourceRecordType?: string | null | undefined;
    sourceRecordId?: number | null | undefined;
}, {
    provenance: "SYSTEM_DERIVED" | "SYSTEM_DOCUMENT" | "MANUAL_UPLOAD" | "EXTERNAL_REFERENCE";
    academicYear?: string | null | undefined;
    cycleId?: number | null | undefined;
    externalReference?: string | null | undefined;
    sourceModule?: string | null | undefined;
    periodLabel?: string | null | undefined;
    criterionId?: number | null | undefined;
    documentId?: number | null | undefined;
    metricId?: number | null | undefined;
    sourceRecordType?: string | null | undefined;
    sourceRecordId?: number | null | undefined;
}>;
export declare const evidenceVerifySchema: z.ZodObject<{
    status: z.ZodEnum<["REVIEWED", "VERIFIED", "RETURNED", "REJECTED"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    status: "VERIFIED" | "REJECTED" | "REVIEWED" | "RETURNED";
    remarks?: string | null | undefined;
}, {
    status: "VERIFIED" | "REJECTED" | "REVIEWED" | "RETURNED";
    remarks?: string | null | undefined;
}>;
export declare const actionPlanSchema: z.ZodObject<{
    sourceType: z.ZodEnum<["NBA_ATTAINMENT_GAP", "NAAC_OBSERVATION", "ACADEMIC_AUDIT", "SURVEY_FEEDBACK", "MANAGEMENT_REVIEW", "IQAC_MEETING", "COMPLIANCE_GAP", "OTHER"]>;
    sourceRef: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    finding: z.ZodString;
    action: z.ZodString;
    ownerUserId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    targetDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: string;
    sourceType: "OTHER" | "SURVEY_FEEDBACK" | "NBA_ATTAINMENT_GAP" | "NAAC_OBSERVATION" | "ACADEMIC_AUDIT" | "MANAGEMENT_REVIEW" | "IQAC_MEETING" | "COMPLIANCE_GAP";
    finding: string;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    sourceRef?: Record<string, any> | null | undefined;
    ownerUserId?: number | null | undefined;
}, {
    action: string;
    sourceType: "OTHER" | "SURVEY_FEEDBACK" | "NBA_ATTAINMENT_GAP" | "NAAC_OBSERVATION" | "ACADEMIC_AUDIT" | "MANAGEMENT_REVIEW" | "IQAC_MEETING" | "COMPLIANCE_GAP";
    finding: string;
    departmentId?: number | null | undefined;
    targetDate?: string | null | undefined;
    sourceRef?: Record<string, any> | null | undefined;
    ownerUserId?: number | null | undefined;
}>;
export declare const actionPlanUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["IN_PROGRESS", "COMPLETED"]>>;
    action: z.ZodOptional<z.ZodString>;
    targetDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceDocumentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    status?: "COMPLETED" | "IN_PROGRESS" | undefined;
    targetDate?: string | null | undefined;
    action?: string | undefined;
    evidenceDocumentId?: number | null | undefined;
}, {
    status?: "COMPLETED" | "IN_PROGRESS" | undefined;
    targetDate?: string | null | undefined;
    action?: string | undefined;
    evidenceDocumentId?: number | null | undefined;
}>;
export declare const actionPlanCloseSchema: z.ZodObject<{
    reviewRemarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reviewRemarks?: string | null | undefined;
}, {
    reviewRemarks?: string | null | undefined;
}>;
export declare const actionPlanReopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const auditSchema: z.ZodObject<{
    name: z.ZodString;
    academicYear: z.ZodString;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    auditorUserId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    checklist: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        text: string;
    }, {
        code: string;
        text: string;
    }>, "many">;
    scheduledDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    academicYear: string;
    checklist: {
        code: string;
        text: string;
    }[];
    departmentId?: number | null | undefined;
    auditorUserId?: number | null | undefined;
    scheduledDate?: string | null | undefined;
}, {
    name: string;
    academicYear: string;
    checklist: {
        code: string;
        text: string;
    }[];
    departmentId?: number | null | undefined;
    auditorUserId?: number | null | undefined;
    scheduledDate?: string | null | undefined;
}>;
export declare const findingSchema: z.ZodObject<{
    checklistItemCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    finding: z.ZodString;
    severity: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
}, "strict", z.ZodTypeAny, {
    finding: string;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    checklistItemCode?: string | null | undefined;
}, {
    finding: string;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    checklistItemCode?: string | null | undefined;
}>;
export declare const committeeSchema: z.ZodObject<{
    name: z.ZodString;
    committeeType: z.ZodOptional<z.ZodEnum<["IQAC", "ACADEMIC", "RESEARCH", "STATUTORY", "OTHER"]>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    description?: string | null | undefined;
    committeeType?: "OTHER" | "ACADEMIC" | "RESEARCH" | "STATUTORY" | "IQAC" | undefined;
}, {
    name: string;
    description?: string | null | undefined;
    committeeType?: "OTHER" | "ACADEMIC" | "RESEARCH" | "STATUTORY" | "IQAC" | undefined;
}>;
export declare const committeeMemberSchema: z.ZodEffects<z.ZodObject<{
    userId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    externalName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    externalDesignation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    roleInCommittee: z.ZodOptional<z.ZodEnum<["CHAIRPERSON", "COORDINATOR", "MEMBER", "EXTERNAL_MEMBER"]>>;
    termStart: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    termEnd: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    userId?: number | null | undefined;
    externalName?: string | null | undefined;
    externalDesignation?: string | null | undefined;
    roleInCommittee?: "COORDINATOR" | "CHAIRPERSON" | "MEMBER" | "EXTERNAL_MEMBER" | undefined;
    termStart?: string | null | undefined;
    termEnd?: string | null | undefined;
}, {
    userId?: number | null | undefined;
    externalName?: string | null | undefined;
    externalDesignation?: string | null | undefined;
    roleInCommittee?: "COORDINATOR" | "CHAIRPERSON" | "MEMBER" | "EXTERNAL_MEMBER" | undefined;
    termStart?: string | null | undefined;
    termEnd?: string | null | undefined;
}>, {
    userId?: number | null | undefined;
    externalName?: string | null | undefined;
    externalDesignation?: string | null | undefined;
    roleInCommittee?: "COORDINATOR" | "CHAIRPERSON" | "MEMBER" | "EXTERNAL_MEMBER" | undefined;
    termStart?: string | null | undefined;
    termEnd?: string | null | undefined;
}, {
    userId?: number | null | undefined;
    externalName?: string | null | undefined;
    externalDesignation?: string | null | undefined;
    roleInCommittee?: "COORDINATOR" | "CHAIRPERSON" | "MEMBER" | "EXTERNAL_MEMBER" | undefined;
    termStart?: string | null | undefined;
    termEnd?: string | null | undefined;
}>;
export declare const meetingSchema: z.ZodObject<{
    meetingDate: z.ZodString;
    agenda: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    meetingDate: string;
    agenda?: string | null | undefined;
}, {
    meetingDate: string;
    agenda?: string | null | undefined;
}>;
export declare const meetingRecordSchema: z.ZodObject<{
    minutes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    minutesDocumentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    minutes?: string | null | undefined;
    minutesDocumentId?: number | null | undefined;
}, {
    minutes?: string | null | undefined;
    minutesDocumentId?: number | null | undefined;
}>;
export declare const complianceItemSchema: z.ZodObject<{
    requirement: z.ZodString;
    authority: z.ZodString;
    periodLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodString;
    ownerUserId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    dueDate: string;
    authority: string;
    requirement: string;
    periodLabel?: string | null | undefined;
    ownerUserId?: number | null | undefined;
}, {
    dueDate: string;
    authority: string;
    requirement: string;
    periodLabel?: string | null | undefined;
    ownerUserId?: number | null | undefined;
}>;
export declare const complianceUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "SUBMITTED", "OVERDUE", "WAIVED", "COMPLETED"]>;
    submissionReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceDocumentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    status: "COMPLETED" | "SUBMITTED" | "PENDING" | "WAIVED" | "OVERDUE";
    evidenceDocumentId?: number | null | undefined;
    submissionReference?: string | null | undefined;
}, {
    status: "COMPLETED" | "SUBMITTED" | "PENDING" | "WAIVED" | "OVERDUE";
    evidenceDocumentId?: number | null | undefined;
    submissionReference?: string | null | undefined;
}>;
