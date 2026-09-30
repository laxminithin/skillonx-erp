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

// Shape matches `WorkflowActor`/`ResearchActor` (facultyUserId, collegeId,
// role) so an IqacActor can reuse the same conventions across the codebase.
export type IqacActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
  hodDepartmentIds?: number[] | null;
};

export type IqacPermission =
  | 'iqac.framework.manage'
  | 'iqac.framework.view'
  | 'iqac.metric.manage'
  | 'iqac.metric.override'
  | 'iqac.metric.view'
  | 'iqac.cycle.manage'
  | 'iqac.cycle.approve'
  | 'iqac.evidence.submit'
  | 'iqac.evidence.verify'
  | 'iqac.evidence.view'
  | 'iqac.actionPlan.manage'
  | 'iqac.actionPlan.close'
  | 'iqac.actionPlan.reopen'
  | 'iqac.audit.manage'
  | 'iqac.audit.view'
  | 'iqac.committee.manage'
  | 'iqac.committee.view'
  | 'iqac.meeting.manage'
  | 'iqac.compliance.manage'
  | 'iqac.compliance.view'
  | 'iqac.dashboard.view';

// ── Enums ────────────────────────────────────────────────────────────────

export const FRAMEWORK_VERSION_STATUSES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const;
export type FrameworkVersionStatus = (typeof FRAMEWORK_VERSION_STATUSES)[number];

export const CRITERION_LEVELS = ['CRITERION', 'KEY_INDICATOR'] as const;
export type CriterionLevel = (typeof CRITERION_LEVELS)[number];

export const METRIC_SOURCE_TYPES = ['SYSTEM_DERIVED', 'MANUAL'] as const;
export type MetricSourceType = (typeof METRIC_SOURCE_TYPES)[number];

/** Never silently converted to 0/PASS/COMPLETE/COMPLIANT — prompt §18. */
export const METRIC_VALUE_STATUSES = [
  'OK',
  'ZERO',
  'NO_DATA',
  'NOT_APPLICABLE',
  'NOT_CONFIGURED',
  'SOURCE_ERROR',
  'PENDING_VERIFICATION',
] as const;
export type MetricValueStatus = (typeof METRIC_VALUE_STATUSES)[number];

export const CYCLE_STATUSES = ['DRAFT', 'DATA_COLLECTION', 'REVIEW', 'APPROVED', 'FROZEN', 'SUBMITTED', 'CLOSED'] as const;
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
/** Terminal states protected from any further transition. */
export const CYCLE_TERMINAL_STATUSES: CycleStatus[] = ['CLOSED'];

export const EVIDENCE_PROVENANCE = ['SYSTEM_DERIVED', 'SYSTEM_DOCUMENT', 'MANUAL_UPLOAD', 'EXTERNAL_REFERENCE'] as const;
export type EvidenceProvenance = (typeof EVIDENCE_PROVENANCE)[number];

export const EVIDENCE_VERIFICATION_STATUSES = ['SUBMITTED', 'REVIEWED', 'VERIFIED', 'RETURNED', 'REJECTED'] as const;
export type EvidenceVerificationStatus = (typeof EVIDENCE_VERIFICATION_STATUSES)[number];

export const ACTION_PLAN_SOURCE_TYPES = [
  'NBA_ATTAINMENT_GAP',
  'NAAC_OBSERVATION',
  'ACADEMIC_AUDIT',
  'SURVEY_FEEDBACK',
  'MANAGEMENT_REVIEW',
  'IQAC_MEETING',
  'COMPLIANCE_GAP',
  'OTHER',
] as const;
export type ActionPlanSourceType = (typeof ACTION_PLAN_SOURCE_TYPES)[number];

export const ACTION_PLAN_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'] as const;
export type ActionPlanStatus = (typeof ACTION_PLAN_STATUSES)[number];
export const ACTION_PLAN_TERMINAL_STATUSES: ActionPlanStatus[] = ['CLOSED', 'CANCELLED'];

export const AUDIT_STATUSES = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const FINDING_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const FINDING_STATUSES = ['OPEN', 'ACTION_PLANNED', 'IN_PROGRESS', 'CLOSED'] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const COMMITTEE_TYPES = ['IQAC', 'ACADEMIC', 'RESEARCH', 'STATUTORY', 'OTHER'] as const;
export type CommitteeType = (typeof COMMITTEE_TYPES)[number];

export const COMMITTEE_MEMBER_ROLES = ['CHAIRPERSON', 'COORDINATOR', 'MEMBER', 'EXTERNAL_MEMBER'] as const;
export type CommitteeMemberRole = (typeof COMMITTEE_MEMBER_ROLES)[number];

export const MEETING_STATUSES = ['SCHEDULED', 'HELD', 'CANCELLED'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const COMPLIANCE_STATUSES = ['PENDING', 'SUBMITTED', 'OVERDUE', 'WAIVED', 'COMPLETED'] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Zod schemas ─────────────────────────────────────────────────────────────

export const frameworkSchema = z.object({
  name: z.string().trim().min(1).max(255),
  code: z.string().trim().min(1).max(32),
  description: z.string().trim().max(4000).optional().nullable(),
}).strict();

export const frameworkVersionSchema = z.object({
  versionLabel: z.string().trim().min(1).max(64),
  effectiveFrom: z.string().trim().min(1).optional().nullable(),
  effectiveTo: z.string().trim().min(1).optional().nullable(),
}).strict();

export const criterionSchema = z.object({
  parentId: z.number().int().positive().optional().nullable(),
  level: z.enum(CRITERION_LEVELS).optional(),
  code: z.string().trim().min(1).max(32),
  title: z.string().trim().min(1).max(512),
  description: z.string().trim().max(4000).optional().nullable(),
  weight: z.number().nonnegative().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
}).strict();

export const metricSchema = z.object({
  frameworkVersionId: z.number().int().positive().optional().nullable(),
  criterionId: z.number().int().positive().optional().nullable(),
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4000).optional().nullable(),
  sourceType: z.enum(METRIC_SOURCE_TYPES),
  sourceModule: z.string().trim().max(64).optional().nullable(),
  unit: z.string().trim().max(32).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  ownerDepartmentId: z.number().int().positive().optional().nullable(),
}).strict().superRefine((val, ctx) => {
  if (val.sourceType === 'SYSTEM_DERIVED' && !val.sourceModule) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceModule'], message: 'sourceModule is required for a SYSTEM_DERIVED metric' });
  }
});

export const manualMetricValueSchema = z.object({
  periodLabel: z.string().trim().min(1).max(32),
  value: z.number().optional().nullable(),
  valueStatus: z.enum(METRIC_VALUE_STATUSES).optional(),
  cycleId: z.number().int().positive().optional().nullable(),
}).strict();

export const metricOverrideSchema = z.object({
  value: z.number().optional().nullable(),
  valueStatus: z.enum(METRIC_VALUE_STATUSES),
  reason: z.string().trim().min(1).max(2000),
}).strict();

export const cycleSchema = z.object({
  frameworkVersionId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  academicYear: z.string().trim().min(1).max(16),
}).strict();

export const cycleFreezeSchema = z.object({
  reason: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const cycleSubmitSchema = z.object({
  submissionReference: z.string().trim().min(1).max(128),
}).strict();

export const cycleReviseSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
}).strict();

export const evidenceSchema = z.object({
  cycleId: z.number().int().positive().optional().nullable(),
  criterionId: z.number().int().positive().optional().nullable(),
  metricId: z.number().int().positive().optional().nullable(),
  provenance: z.enum(EVIDENCE_PROVENANCE),
  sourceModule: z.string().trim().max(64).optional().nullable(),
  sourceRecordType: z.string().trim().max(64).optional().nullable(),
  sourceRecordId: z.number().int().positive().optional().nullable(),
  documentId: z.number().int().positive().optional().nullable(),
  externalReference: z.string().trim().max(512).optional().nullable(),
  periodLabel: z.string().trim().max(32).optional().nullable(),
  academicYear: z.string().trim().max(16).optional().nullable(),
}).strict().superRefine((val, ctx) => {
  if (val.provenance === 'MANUAL_UPLOAD' && !val.documentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['documentId'], message: 'documentId is required for MANUAL_UPLOAD evidence' });
  }
  if (val.provenance === 'EXTERNAL_REFERENCE' && !val.externalReference) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['externalReference'], message: 'externalReference is required for EXTERNAL_REFERENCE evidence' });
  }
});

export const evidenceVerifySchema = z.object({
  status: z.enum(['REVIEWED', 'VERIFIED', 'RETURNED', 'REJECTED']),
  remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const actionPlanSchema = z.object({
  sourceType: z.enum(ACTION_PLAN_SOURCE_TYPES),
  sourceRef: z.record(z.any()).optional().nullable(),
  finding: z.string().trim().min(1).max(4000),
  action: z.string().trim().min(1).max(4000),
  ownerUserId: z.number().int().positive().optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  targetDate: z.string().trim().min(1).optional().nullable(),
}).strict();

export const actionPlanUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  action: z.string().trim().min(1).max(4000).optional(),
  targetDate: z.string().trim().min(1).optional().nullable(),
  evidenceDocumentId: z.number().int().positive().optional().nullable(),
}).strict();

export const actionPlanCloseSchema = z.object({
  reviewRemarks: z.string().trim().max(2000).optional().nullable(),
}).strict();

export const actionPlanReopenSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
}).strict();

export const auditSchema = z.object({
  name: z.string().trim().min(1).max(255),
  academicYear: z.string().trim().min(1).max(16),
  departmentId: z.number().int().positive().optional().nullable(),
  auditorUserId: z.number().int().positive().optional().nullable(),
  checklist: z.array(z.object({ code: z.string().trim().min(1).max(32), text: z.string().trim().min(1).max(500) })).min(1).max(200),
  scheduledDate: z.string().trim().min(1).optional().nullable(),
}).strict();

export const findingSchema = z.object({
  checklistItemCode: z.string().trim().max(32).optional().nullable(),
  finding: z.string().trim().min(1).max(4000),
  severity: z.enum(FINDING_SEVERITIES).optional(),
}).strict();

export const committeeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  committeeType: z.enum(COMMITTEE_TYPES).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
}).strict();

export const committeeMemberSchema = z.object({
  userId: z.number().int().positive().optional().nullable(),
  externalName: z.string().trim().max(255).optional().nullable(),
  externalDesignation: z.string().trim().max(255).optional().nullable(),
  roleInCommittee: z.enum(COMMITTEE_MEMBER_ROLES).optional(),
  termStart: z.string().trim().min(1).optional().nullable(),
  termEnd: z.string().trim().min(1).optional().nullable(),
}).strict().superRefine((val, ctx) => {
  if (!val.userId && !val.externalName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['userId'], message: 'Either userId or externalName is required' });
  }
});

export const meetingSchema = z.object({
  meetingDate: z.string().trim().min(1),
  agenda: z.string().trim().max(8000).optional().nullable(),
}).strict();

export const meetingRecordSchema = z.object({
  minutes: z.string().trim().max(20000).optional().nullable(),
  minutesDocumentId: z.number().int().positive().optional().nullable(),
}).strict();

export const complianceItemSchema = z.object({
  requirement: z.string().trim().min(1).max(512),
  authority: z.string().trim().min(1).max(128),
  periodLabel: z.string().trim().max(32).optional().nullable(),
  dueDate: z.string().trim().min(1),
  ownerUserId: z.number().int().positive().optional().nullable(),
}).strict();

export const complianceUpdateSchema = z.object({
  status: z.enum(COMPLIANCE_STATUSES),
  submissionReference: z.string().trim().max(128).optional().nullable(),
  evidenceDocumentId: z.number().int().positive().optional().nullable(),
}).strict();
