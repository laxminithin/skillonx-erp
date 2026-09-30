import type { IqacActor } from './types.js';
import { frameworkSchema, frameworkVersionSchema, criterionSchema, metricSchema, manualMetricValueSchema, metricOverrideSchema, cycleSchema, cycleFreezeSchema, cycleSubmitSchema, cycleReviseSchema, evidenceSchema, evidenceVerifySchema, actionPlanSchema, actionPlanUpdateSchema, actionPlanCloseSchema, actionPlanReopenSchema, auditSchema, findingSchema, committeeSchema, committeeMemberSchema, meetingSchema, meetingRecordSchema, complianceItemSchema, complianceUpdateSchema } from './types.js';
export { frameworkSchema, frameworkVersionSchema, criterionSchema, metricSchema, manualMetricValueSchema, metricOverrideSchema, cycleSchema, cycleFreezeSchema, cycleSubmitSchema, cycleReviseSchema, evidenceSchema, evidenceVerifySchema, actionPlanSchema, actionPlanUpdateSchema, actionPlanCloseSchema, actionPlanReopenSchema, auditSchema, findingSchema, committeeSchema, committeeMemberSchema, meetingSchema, meetingRecordSchema, complianceItemSchema, complianceUpdateSchema, };
export declare function listFrameworks(actor: IqacActor): Promise<any[]>;
export declare function createFramework(actor: IqacActor, input: ReturnType<typeof frameworkSchema.parse>): Promise<any>;
export declare function listFrameworkVersions(actor: IqacActor, frameworkId: number): Promise<any[]>;
export declare function createFrameworkVersion(actor: IqacActor, frameworkId: number, input: ReturnType<typeof frameworkVersionSchema.parse>): Promise<any>;
/**
 * Activates a version. Any other ACTIVE version of the same framework is
 * retired — but this never mutates a cycle's already-recorded
 * `framework_version_id`, so historical cycles keep the version they were
 * actually run against (prompt §8/§13).
 */
export declare function activateFrameworkVersion(actor: IqacActor, versionId: number): Promise<any>;
export declare function listCriteria(actor: IqacActor, frameworkVersionId: number): Promise<any[]>;
export declare function createCriterion(actor: IqacActor, frameworkVersionId: number, input: ReturnType<typeof criterionSchema.parse>): Promise<any>;
export declare function listMetrics(actor: IqacActor, filters: {
    frameworkVersionId?: number;
    criterionId?: number;
}): Promise<any[]>;
export declare function createMetric(actor: IqacActor, input: ReturnType<typeof metricSchema.parse>): Promise<any>;
export declare function setManualMetricValue(actor: IqacActor, metricId: number, input: ReturnType<typeof manualMetricValueSchema.parse>): Promise<any>;
/**
 * Recomputes a SYSTEM_DERIVED metric via its registered connector. Missing-
 * data semantics are never collapsed into `0`/`PASS`/`COMPLETE` (prompt
 * §18): no connector -> NOT_CONFIGURED; connector throws -> SOURCE_ERROR
 * (with the error captured in `raw_value` for diagnosis, never hidden).
 */
export declare function recomputeSystemMetric(actor: IqacActor, metricId: number, periodLabel: string, cycleId?: number | null): Promise<any>;
/** Manual override of any metric value (system-derived or manual) — always requires a reason, records old/new, never silent (prompt §19). */
export declare function overrideMetricValue(actor: IqacActor, metricId: number, periodLabel: string, input: ReturnType<typeof metricOverrideSchema.parse>): Promise<any>;
export declare function listMetricValues(actor: IqacActor, filters: {
    metricId?: number;
    cycleId?: number;
    periodLabel?: string;
}): Promise<any[]>;
export declare function listCycles(actor: IqacActor): Promise<any[]>;
export declare function getCycle(actor: IqacActor, cycleId: number): Promise<any>;
export declare function createCycle(actor: IqacActor, input: ReturnType<typeof cycleSchema.parse>): Promise<any>;
/**
 * Advances DRAFT->DATA_COLLECTION->REVIEW, and REVIEW->APPROVED (the latter
 * requires `iqac.cycle.approve`, a Principal/Management/Admin sign-off — a
 * real two-party control, since IQAC_COORDINATOR does not hold that
 * permission). FROZEN/SUBMITTED/CLOSED have their own dedicated functions
 * because they carry extra side effects (snapshot, submission reference).
 * Row-locked so a concurrent duplicate call sees the post-transition status
 * and is rejected, not double-applied.
 */
export declare function advanceCycle(actor: IqacActor, cycleId: number, toStatus: 'DATA_COLLECTION' | 'REVIEW' | 'APPROVED'): Promise<any>;
/**
 * Freezes an APPROVED cycle: row-locks the cycle, verifies it is still
 * APPROVED (blocks a concurrent double-freeze — the loser sees FROZEN and
 * gets a 409, not a second snapshot), snapshots every metric value and
 * evidence row scoped to this cycle as revision 1, and marks the cycle
 * FROZEN. If snapshot insertion fails, the whole transaction rolls back —
 * the cycle is never left in a false "successfully frozen with no
 * snapshot" state (prompt §71 Example A/B).
 */
export declare function freezeCycle(actor: IqacActor, cycleId: number, _input: ReturnType<typeof cycleFreezeSchema.parse>): Promise<any>;
/**
 * Records a revision to an already-frozen submission. Never mutates the
 * original snapshot row — appends a new revision, requires a mandatory
 * reason, and is fully attributed (prompt §14, §29 DVV-style preservation
 * of the original).
 */
export declare function reviseCycleSnapshot(actor: IqacActor, cycleId: number, input: ReturnType<typeof cycleReviseSchema.parse>): Promise<any>;
export declare function listSnapshots(actor: IqacActor, cycleId: number): Promise<any[]>;
/** Idempotent: a retry with the same submissionReference after a lost response returns the existing SUBMITTED state instead of erroring (prompt §70/§71 Example D). */
export declare function submitCycle(actor: IqacActor, cycleId: number, input: ReturnType<typeof cycleSubmitSchema.parse>): Promise<any>;
/** Idempotent close — retrying on an already-CLOSED cycle is a safe no-op, never a second closure event. */
export declare function closeCycle(actor: IqacActor, cycleId: number): Promise<any>;
export declare function listEvidence(actor: IqacActor, filters: {
    cycleId?: number;
    criterionId?: number;
    metricId?: number;
    verificationStatus?: string;
}): Promise<any[]>;
export declare function submitEvidence(actor: IqacActor, input: ReturnType<typeof evidenceSchema.parse>): Promise<any>;
/** Self-verification is hard-blocked (prompt §63) via `assertNotSelfVerifying`. */
export declare function verifyEvidence(actor: IqacActor, evidenceId: number, input: ReturnType<typeof evidenceVerifySchema.parse>): Promise<any>;
export declare function listActionPlans(actor: IqacActor, filters: {
    status?: string;
    sourceType?: string;
    departmentId?: number;
}): Promise<any[]>;
export declare function createActionPlan(actor: IqacActor, input: ReturnType<typeof actionPlanSchema.parse>): Promise<any>;
/** Forward-only progression (PLANNED -> IN_PROGRESS -> COMPLETED); cannot mutate a terminal (CLOSED/CANCELLED) plan. */
export declare function updateActionPlan(actor: IqacActor, planId: number, input: ReturnType<typeof actionPlanUpdateSchema.parse>): Promise<any>;
/** Closure requires the review permission and COMPLETED status — protects against closing a plan whose action never actually happened. */
export declare function closeActionPlan(actor: IqacActor, planId: number, input: ReturnType<typeof actionPlanCloseSchema.parse>): Promise<any>;
export declare function cancelActionPlan(actor: IqacActor, planId: number, reason: string | null): Promise<any>;
/** Reopening a closed plan requires elevated permission + mandatory reason + audit trail (prompt §26). */
export declare function reopenActionPlan(actor: IqacActor, planId: number, input: ReturnType<typeof actionPlanReopenSchema.parse>): Promise<any>;
export declare function listAudits(actor: IqacActor, filters: {
    departmentId?: number;
}): Promise<any[]>;
export declare function createAudit(actor: IqacActor, input: ReturnType<typeof auditSchema.parse>): Promise<any>;
export declare function addFinding(actor: IqacActor, auditId: number, input: ReturnType<typeof findingSchema.parse>): Promise<any>;
/** Feeds the SAME continuous-improvement engine as NBA/NAAC/survey findings — no separate `audit_tasks` table (prompt §53). */
export declare function raiseActionPlanFromFinding(actor: IqacActor, findingId: number, input: ReturnType<typeof actionPlanSchema.parse>): Promise<any>;
export declare function closeAudit(actor: IqacActor, auditId: number): Promise<any>;
export declare function listCommittees(actor: IqacActor): Promise<any[]>;
export declare function createCommittee(actor: IqacActor, input: ReturnType<typeof committeeSchema.parse>): Promise<any>;
export declare function addCommitteeMember(actor: IqacActor, committeeId: number, input: ReturnType<typeof committeeMemberSchema.parse>): Promise<any>;
export declare function listCommitteeMembers(actor: IqacActor, committeeId: number): Promise<any[]>;
export declare function scheduleMeeting(actor: IqacActor, committeeId: number, input: ReturnType<typeof meetingSchema.parse>): Promise<any>;
/** Records minutes and marks the meeting HELD. Minutes attachments reuse `documentEngine` by id — no separate file store here (prompt §50). */
export declare function recordMeetingMinutes(actor: IqacActor, meetingId: number, input: ReturnType<typeof meetingRecordSchema.parse>): Promise<any>;
export declare function listMeetings(actor: IqacActor, committeeId: number): Promise<any[]>;
export declare function listComplianceItems(actor: IqacActor): Promise<any[]>;
export declare function createComplianceItem(actor: IqacActor, input: ReturnType<typeof complianceItemSchema.parse>): Promise<any>;
export declare function updateComplianceItem(actor: IqacActor, itemId: number, input: ReturnType<typeof complianceUpdateSchema.parse>): Promise<any>;
/** Efficient server-side aggregation — COUNT queries only, never one query per record (prompt §81). */
export declare function getDashboard(actor: IqacActor): Promise<{
    evidencePendingVerification: number;
    metricsNeedingAttention: number;
    actionPlansOverdue: number;
    auditFindingsOpen: number;
    complianceDeadlinesOverdue: number;
    activeCycles: any[];
}>;
