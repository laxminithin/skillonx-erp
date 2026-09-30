import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertIqacPermission, canActOnDepartmentScopedRecord, assertNotSelfVerifying, isInstitutionWideViewer, } from './access.js';
import { auditFromActor } from './audit.js';
import { CYCLE_TERMINAL_STATUSES, ACTION_PLAN_TERMINAL_STATUSES, frameworkSchema, frameworkVersionSchema, criterionSchema, metricSchema, manualMetricValueSchema, metricOverrideSchema, cycleSchema, cycleFreezeSchema, cycleSubmitSchema, cycleReviseSchema, evidenceSchema, evidenceVerifySchema, actionPlanSchema, actionPlanUpdateSchema, actionPlanCloseSchema, actionPlanReopenSchema, auditSchema, findingSchema, committeeSchema, committeeMemberSchema, meetingSchema, meetingRecordSchema, complianceItemSchema, complianceUpdateSchema, } from './types.js';
export { frameworkSchema, frameworkVersionSchema, criterionSchema, metricSchema, manualMetricValueSchema, metricOverrideSchema, cycleSchema, cycleFreezeSchema, cycleSubmitSchema, cycleReviseSchema, evidenceSchema, evidenceVerifySchema, actionPlanSchema, actionPlanUpdateSchema, actionPlanCloseSchema, actionPlanReopenSchema, auditSchema, findingSchema, committeeSchema, committeeMemberSchema, meetingSchema, meetingRecordSchema, complianceItemSchema, complianceUpdateSchema, };
function today() {
    return new Date().toISOString().slice(0, 10);
}
/** mysql2 returns DATE columns as JS Date objects, not strings — normalize before any string comparison. */
function dateStr(value) {
    if (value instanceof Date)
        return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
}
async function mustFindInCollege(table, id, collegeId) {
    const row = await db(table).where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, `${table} record not found`);
    return row;
}
const SYSTEM_METRIC_CONNECTORS = {};
// ── Frameworks / Versions / Criteria ──────────────────────────────────────
export async function listFrameworks(actor) {
    assertIqacPermission(actor, 'iqac.framework.view');
    return db('iqac_frameworks').where({ college_id: actor.collegeId }).orderBy('name');
}
export async function createFramework(actor, input) {
    assertIqacPermission(actor, 'iqac.framework.manage');
    const [id] = await db('iqac_frameworks').insert({
        college_id: actor.collegeId,
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description ?? null,
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_frameworks', id, actor.collegeId);
    await auditFromActor(actor, 'FRAMEWORK_CREATE', 'iqac_framework', id, { after: row });
    return row;
}
export async function listFrameworkVersions(actor, frameworkId) {
    assertIqacPermission(actor, 'iqac.framework.view');
    await mustFindInCollege('iqac_frameworks', frameworkId, actor.collegeId);
    return db('iqac_framework_versions').where({ framework_id: frameworkId, college_id: actor.collegeId }).orderBy('created_at', 'desc');
}
export async function createFrameworkVersion(actor, frameworkId, input) {
    assertIqacPermission(actor, 'iqac.framework.manage');
    await mustFindInCollege('iqac_frameworks', frameworkId, actor.collegeId);
    const [id] = await db('iqac_framework_versions').insert({
        college_id: actor.collegeId,
        framework_id: frameworkId,
        version_label: input.versionLabel,
        effective_from: input.effectiveFrom ?? null,
        effective_to: input.effectiveTo ?? null,
        status: 'DRAFT',
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_framework_versions', id, actor.collegeId);
    await auditFromActor(actor, 'FRAMEWORK_VERSION_CREATE', 'iqac_framework_version', id, { after: row });
    return row;
}
/**
 * Activates a version. Any other ACTIVE version of the same framework is
 * retired — but this never mutates a cycle's already-recorded
 * `framework_version_id`, so historical cycles keep the version they were
 * actually run against (prompt §8/§13).
 */
export async function activateFrameworkVersion(actor, versionId) {
    assertIqacPermission(actor, 'iqac.framework.manage');
    const version = await mustFindInCollege('iqac_framework_versions', versionId, actor.collegeId);
    return db.transaction(async (trx) => {
        await trx('iqac_framework_versions')
            .where({ framework_id: version.framework_id, college_id: actor.collegeId, status: 'ACTIVE' })
            .update({ status: 'RETIRED' });
        await trx('iqac_framework_versions').where({ id: versionId }).update({ status: 'ACTIVE' });
        const after = await trx('iqac_framework_versions').where({ id: versionId }).first();
        await auditFromActor(actor, 'FRAMEWORK_VERSION_ACTIVATE', 'iqac_framework_version', versionId, { before: version, after });
        return after;
    });
}
export async function listCriteria(actor, frameworkVersionId) {
    assertIqacPermission(actor, 'iqac.framework.view');
    await mustFindInCollege('iqac_framework_versions', frameworkVersionId, actor.collegeId);
    return db('iqac_criteria').where({ framework_version_id: frameworkVersionId, college_id: actor.collegeId }).orderBy(['parent_id', 'sort_order']);
}
export async function createCriterion(actor, frameworkVersionId, input) {
    assertIqacPermission(actor, 'iqac.framework.manage');
    await mustFindInCollege('iqac_framework_versions', frameworkVersionId, actor.collegeId);
    if (input.parentId != null)
        await mustFindInCollege('iqac_criteria', input.parentId, actor.collegeId);
    const [id] = await db('iqac_criteria').insert({
        college_id: actor.collegeId,
        framework_version_id: frameworkVersionId,
        parent_id: input.parentId ?? null,
        level: input.level ?? 'CRITERION',
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        weight: input.weight ?? null,
        sort_order: input.sortOrder ?? 0,
    });
    const row = await mustFindInCollege('iqac_criteria', id, actor.collegeId);
    await auditFromActor(actor, 'CRITERION_CREATE', 'iqac_criterion', id, { after: row });
    return row;
}
// ── Metrics ────────────────────────────────────────────────────────────────
export async function listMetrics(actor, filters) {
    assertIqacPermission(actor, 'iqac.metric.view');
    let q = db('iqac_metrics').where({ college_id: actor.collegeId, is_active: true });
    if (filters.frameworkVersionId)
        q = q.where({ framework_version_id: filters.frameworkVersionId });
    if (filters.criterionId)
        q = q.where({ criterion_id: filters.criterionId });
    return q.orderBy('code');
}
export async function createMetric(actor, input) {
    assertIqacPermission(actor, 'iqac.metric.manage');
    if (input.frameworkVersionId != null)
        await mustFindInCollege('iqac_framework_versions', input.frameworkVersionId, actor.collegeId);
    if (input.criterionId != null)
        await mustFindInCollege('iqac_criteria', input.criterionId, actor.collegeId);
    const [id] = await db('iqac_metrics').insert({
        college_id: actor.collegeId,
        framework_version_id: input.frameworkVersionId ?? null,
        criterion_id: input.criterionId ?? null,
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        source_type: input.sourceType,
        source_module: input.sourceModule ?? null,
        unit: input.unit ?? null,
        target_value: input.targetValue ?? null,
        owner_department_id: input.ownerDepartmentId ?? null,
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_metrics', id, actor.collegeId);
    await auditFromActor(actor, 'METRIC_CREATE', 'iqac_metric', id, { after: row });
    return row;
}
function assertMetricDepartmentScope(actor, metric) {
    if (metric.owner_department_id == null)
        return;
    if (!canActOnDepartmentScopedRecord(actor, metric.owner_department_id)) {
        throw new AppError(403, 'You cannot enter values for a metric owned by a department you do not lead');
    }
}
export async function setManualMetricValue(actor, metricId, input) {
    assertIqacPermission(actor, 'iqac.metric.manage');
    const metric = await mustFindInCollege('iqac_metrics', metricId, actor.collegeId);
    if (metric.source_type !== 'MANUAL') {
        throw new AppError(400, 'This metric is SYSTEM_DERIVED — use the recompute endpoint, not manual entry');
    }
    assertMetricDepartmentScope(actor, metric);
    const status = input.valueStatus ?? (input.value != null ? (input.value === 0 ? 'ZERO' : 'OK') : 'NO_DATA');
    return upsertMetricValue(actor, metric, input.periodLabel, {
        value: input.value ?? null,
        valueStatus: status,
        rawValue: null,
        sourceRef: { module: 'MANUAL', enteredBy: actor.facultyUserId },
        cycleId: input.cycleId ?? null,
    });
}
/**
 * Recomputes a SYSTEM_DERIVED metric via its registered connector. Missing-
 * data semantics are never collapsed into `0`/`PASS`/`COMPLETE` (prompt
 * §18): no connector -> NOT_CONFIGURED; connector throws -> SOURCE_ERROR
 * (with the error captured in `raw_value` for diagnosis, never hidden).
 */
export async function recomputeSystemMetric(actor, metricId, periodLabel, cycleId) {
    assertIqacPermission(actor, 'iqac.metric.manage');
    const metric = await mustFindInCollege('iqac_metrics', metricId, actor.collegeId);
    if (metric.source_type !== 'SYSTEM_DERIVED') {
        throw new AppError(400, 'This metric is MANUAL — use manual value entry, not recompute');
    }
    assertMetricDepartmentScope(actor, metric);
    const connector = metric.source_module ? SYSTEM_METRIC_CONNECTORS[metric.source_module] : undefined;
    if (!connector) {
        return upsertMetricValue(actor, metric, periodLabel, {
            value: null,
            valueStatus: 'NOT_CONFIGURED',
            rawValue: { reason: `No connector registered for source module '${metric.source_module}'` },
            sourceRef: { module: metric.source_module, connector: 'not_registered' },
            cycleId: cycleId ?? null,
        });
    }
    try {
        const result = await connector(actor.collegeId, periodLabel);
        const value = result.value;
        const status = value == null ? 'NO_DATA' : value === 0 ? 'ZERO' : 'OK';
        return upsertMetricValue(actor, metric, periodLabel, {
            value,
            valueStatus: status,
            rawValue: result.raw ?? null,
            sourceRef: { module: metric.source_module, connector: 'ok' },
            cycleId: cycleId ?? null,
        });
    }
    catch (err) {
        return upsertMetricValue(actor, metric, periodLabel, {
            value: null,
            valueStatus: 'SOURCE_ERROR',
            rawValue: { error: String(err?.message ?? err) },
            sourceRef: { module: metric.source_module, connector: 'error' },
            cycleId: cycleId ?? null,
        });
    }
}
async function upsertMetricValue(actor, metric, periodLabel, data) {
    return db.transaction(async (trx) => {
        const existing = await trx('iqac_metric_values').where({ metric_id: metric.id, period_label: periodLabel }).forUpdate().first();
        const base = {
            college_id: actor.collegeId,
            metric_id: metric.id,
            cycle_id: data.cycleId,
            period_label: periodLabel,
            value_status: data.valueStatus,
            value: data.value,
            raw_value: data.rawValue != null ? JSON.stringify(data.rawValue) : null,
            source_ref: data.sourceRef != null ? JSON.stringify(data.sourceRef) : null,
            is_override: false,
            computed_by: actor.facultyUserId,
            computed_at: trx.fn.now(),
        };
        let id;
        if (existing) {
            await trx('iqac_metric_values').where({ id: existing.id }).update(base);
            id = existing.id;
        }
        else {
            [id] = await trx('iqac_metric_values').insert(base);
        }
        const after = await trx('iqac_metric_values').where({ id }).first();
        await auditFromActor(actor, existing ? 'METRIC_VALUE_UPDATE' : 'METRIC_VALUE_CREATE', 'iqac_metric_value', id, { before: existing, after });
        return after;
    });
}
/** Manual override of any metric value (system-derived or manual) — always requires a reason, records old/new, never silent (prompt §19). */
export async function overrideMetricValue(actor, metricId, periodLabel, input) {
    assertIqacPermission(actor, 'iqac.metric.override');
    const metric = await mustFindInCollege('iqac_metrics', metricId, actor.collegeId);
    assertMetricDepartmentScope(actor, metric);
    return db.transaction(async (trx) => {
        const existing = await trx('iqac_metric_values').where({ metric_id: metricId, period_label: periodLabel }).forUpdate().first();
        if (!existing)
            throw new AppError(404, 'No metric value exists yet for this period to override');
        await trx('iqac_metric_values').where({ id: existing.id }).update({
            is_override: true,
            previous_value: existing.value,
            previous_status: existing.value_status,
            override_reason: input.reason,
            override_by: actor.facultyUserId,
            override_at: trx.fn.now(),
            value: input.value ?? null,
            value_status: input.valueStatus,
        });
        const after = await trx('iqac_metric_values').where({ id: existing.id }).first();
        await auditFromActor(actor, 'METRIC_VALUE_OVERRIDE', 'iqac_metric_value', existing.id, { before: existing, after, reason: input.reason });
        return after;
    });
}
export async function listMetricValues(actor, filters) {
    assertIqacPermission(actor, 'iqac.metric.view');
    let q = db('iqac_metric_values').where({ college_id: actor.collegeId });
    if (filters.metricId)
        q = q.where({ metric_id: filters.metricId });
    if (filters.cycleId)
        q = q.where({ cycle_id: filters.cycleId });
    if (filters.periodLabel)
        q = q.where({ period_label: filters.periodLabel });
    return q.orderBy('period_label', 'desc');
}
// ── Accreditation cycles ───────────────────────────────────────────────────
const CYCLE_TRANSITIONS = {
    DRAFT: 'DATA_COLLECTION',
    DATA_COLLECTION: 'REVIEW',
    REVIEW: 'APPROVED',
    APPROVED: 'FROZEN',
    FROZEN: 'SUBMITTED',
    SUBMITTED: 'CLOSED',
    CLOSED: null,
};
export async function listCycles(actor) {
    assertIqacPermission(actor, 'iqac.dashboard.view');
    return db('iqac_cycles').where({ college_id: actor.collegeId }).orderBy('created_at', 'desc');
}
export async function getCycle(actor, cycleId) {
    assertIqacPermission(actor, 'iqac.dashboard.view');
    return mustFindInCollege('iqac_cycles', cycleId, actor.collegeId);
}
export async function createCycle(actor, input) {
    assertIqacPermission(actor, 'iqac.cycle.manage');
    await mustFindInCollege('iqac_framework_versions', input.frameworkVersionId, actor.collegeId);
    const [id] = await db('iqac_cycles').insert({
        college_id: actor.collegeId,
        framework_version_id: input.frameworkVersionId,
        name: input.name,
        academic_year: input.academicYear,
        status: 'DRAFT',
        started_by: actor.facultyUserId,
        started_at: db.fn.now(),
    });
    const row = await mustFindInCollege('iqac_cycles', id, actor.collegeId);
    await auditFromActor(actor, 'CYCLE_CREATE', 'iqac_cycle', id, { after: row });
    return row;
}
/**
 * Advances DRAFT->DATA_COLLECTION->REVIEW, and REVIEW->APPROVED (the latter
 * requires `iqac.cycle.approve`, a Principal/Management/Admin sign-off — a
 * real two-party control, since IQAC_COORDINATOR does not hold that
 * permission). FROZEN/SUBMITTED/CLOSED have their own dedicated functions
 * because they carry extra side effects (snapshot, submission reference).
 * Row-locked so a concurrent duplicate call sees the post-transition status
 * and is rejected, not double-applied.
 */
export async function advanceCycle(actor, cycleId, toStatus) {
    return db.transaction(async (trx) => {
        const cycle = await trx('iqac_cycles').where({ id: cycleId, college_id: actor.collegeId }).forUpdate().first();
        if (!cycle)
            throw new AppError(404, 'Cycle not found');
        if (CYCLE_TERMINAL_STATUSES.includes(cycle.status))
            throw new AppError(409, `Cycle is ${cycle.status} and cannot be advanced`);
        if (CYCLE_TRANSITIONS[cycle.status] !== toStatus) {
            throw new AppError(409, `Cycle in status ${cycle.status} cannot move to ${toStatus}`);
        }
        assertIqacPermission(actor, toStatus === 'APPROVED' ? 'iqac.cycle.approve' : 'iqac.cycle.manage');
        const update = { status: toStatus };
        if (toStatus === 'APPROVED') {
            update.approved_by = actor.facultyUserId;
            update.approved_at = trx.fn.now();
        }
        await trx('iqac_cycles').where({ id: cycleId }).update(update);
        const after = await trx('iqac_cycles').where({ id: cycleId }).first();
        await auditFromActor(actor, `CYCLE_${toStatus}`, 'iqac_cycle', cycleId, { before: cycle, after });
        return after;
    });
}
/**
 * Freezes an APPROVED cycle: row-locks the cycle, verifies it is still
 * APPROVED (blocks a concurrent double-freeze — the loser sees FROZEN and
 * gets a 409, not a second snapshot), snapshots every metric value and
 * evidence row scoped to this cycle as revision 1, and marks the cycle
 * FROZEN. If snapshot insertion fails, the whole transaction rolls back —
 * the cycle is never left in a false "successfully frozen with no
 * snapshot" state (prompt §71 Example A/B).
 */
export async function freezeCycle(actor, cycleId, _input) {
    assertIqacPermission(actor, 'iqac.cycle.manage');
    return db.transaction(async (trx) => {
        const cycle = await trx('iqac_cycles').where({ id: cycleId, college_id: actor.collegeId }).forUpdate().first();
        if (!cycle)
            throw new AppError(404, 'Cycle not found');
        if (cycle.status !== 'APPROVED')
            throw new AppError(409, `Cycle must be APPROVED to freeze (currently ${cycle.status})`);
        const metricValues = await trx('iqac_metric_values').where({ cycle_id: cycleId });
        const evidence = await trx('iqac_evidence').where({ cycle_id: cycleId });
        await trx('iqac_snapshots').insert({
            college_id: actor.collegeId,
            cycle_id: cycleId,
            revision: 1,
            metric_values_snapshot: JSON.stringify(metricValues),
            evidence_index_snapshot: JSON.stringify(evidence),
            reason: null,
            taken_by: actor.facultyUserId,
            taken_at: trx.fn.now(),
        });
        await trx('iqac_cycles').where({ id: cycleId }).update({ status: 'FROZEN', frozen_by: actor.facultyUserId, frozen_at: trx.fn.now() });
        const after = await trx('iqac_cycles').where({ id: cycleId }).first();
        await auditFromActor(actor, 'CYCLE_FREEZE', 'iqac_cycle', cycleId, { before: cycle, after });
        return after;
    });
}
/**
 * Records a revision to an already-frozen submission. Never mutates the
 * original snapshot row — appends a new revision, requires a mandatory
 * reason, and is fully attributed (prompt §14, §29 DVV-style preservation
 * of the original).
 */
export async function reviseCycleSnapshot(actor, cycleId, input) {
    assertIqacPermission(actor, 'iqac.cycle.manage');
    return db.transaction(async (trx) => {
        const cycle = await trx('iqac_cycles').where({ id: cycleId, college_id: actor.collegeId }).forUpdate().first();
        if (!cycle)
            throw new AppError(404, 'Cycle not found');
        if (!['FROZEN', 'SUBMITTED'].includes(cycle.status))
            throw new AppError(409, 'Only a FROZEN or SUBMITTED cycle can be revised');
        const [{ maxRev }] = await trx('iqac_snapshots').where({ cycle_id: cycleId }).max({ maxRev: 'revision' });
        const nextRevision = Number(maxRev ?? 0) + 1;
        const metricValues = await trx('iqac_metric_values').where({ cycle_id: cycleId });
        const evidence = await trx('iqac_evidence').where({ cycle_id: cycleId });
        const [id] = await trx('iqac_snapshots').insert({
            college_id: actor.collegeId,
            cycle_id: cycleId,
            revision: nextRevision,
            metric_values_snapshot: JSON.stringify(metricValues),
            evidence_index_snapshot: JSON.stringify(evidence),
            reason: input.reason,
            taken_by: actor.facultyUserId,
            taken_at: trx.fn.now(),
        });
        const snapshot = await trx('iqac_snapshots').where({ id }).first();
        await auditFromActor(actor, 'CYCLE_SNAPSHOT_REVISE', 'iqac_snapshot', id, { after: snapshot, reason: input.reason });
        return snapshot;
    });
}
export async function listSnapshots(actor, cycleId) {
    assertIqacPermission(actor, 'iqac.dashboard.view');
    await mustFindInCollege('iqac_cycles', cycleId, actor.collegeId);
    return db('iqac_snapshots').where({ cycle_id: cycleId, college_id: actor.collegeId }).orderBy('revision', 'desc');
}
/** Idempotent: a retry with the same submissionReference after a lost response returns the existing SUBMITTED state instead of erroring (prompt §70/§71 Example D). */
export async function submitCycle(actor, cycleId, input) {
    assertIqacPermission(actor, 'iqac.cycle.manage');
    return db.transaction(async (trx) => {
        const cycle = await trx('iqac_cycles').where({ id: cycleId, college_id: actor.collegeId }).forUpdate().first();
        if (!cycle)
            throw new AppError(404, 'Cycle not found');
        if (cycle.status === 'SUBMITTED' && cycle.submission_reference === input.submissionReference)
            return cycle;
        if (cycle.status !== 'FROZEN')
            throw new AppError(409, `Cycle must be FROZEN to submit (currently ${cycle.status})`);
        await trx('iqac_cycles').where({ id: cycleId }).update({
            status: 'SUBMITTED',
            submitted_by: actor.facultyUserId,
            submitted_at: trx.fn.now(),
            submission_reference: input.submissionReference,
        });
        const after = await trx('iqac_cycles').where({ id: cycleId }).first();
        await auditFromActor(actor, 'CYCLE_SUBMIT', 'iqac_cycle', cycleId, { before: cycle, after });
        return after;
    });
}
/** Idempotent close — retrying on an already-CLOSED cycle is a safe no-op, never a second closure event. */
export async function closeCycle(actor, cycleId) {
    assertIqacPermission(actor, 'iqac.cycle.manage');
    return db.transaction(async (trx) => {
        const cycle = await trx('iqac_cycles').where({ id: cycleId, college_id: actor.collegeId }).forUpdate().first();
        if (!cycle)
            throw new AppError(404, 'Cycle not found');
        if (cycle.status === 'CLOSED')
            return cycle;
        if (cycle.status !== 'SUBMITTED')
            throw new AppError(409, `Cycle must be SUBMITTED to close (currently ${cycle.status})`);
        await trx('iqac_cycles').where({ id: cycleId }).update({ status: 'CLOSED', closed_by: actor.facultyUserId, closed_at: trx.fn.now() });
        const after = await trx('iqac_cycles').where({ id: cycleId }).first();
        await auditFromActor(actor, 'CYCLE_CLOSE', 'iqac_cycle', cycleId, { before: cycle, after });
        return after;
    });
}
// ── Evidence ───────────────────────────────────────────────────────────────
export async function listEvidence(actor, filters) {
    assertIqacPermission(actor, 'iqac.evidence.view');
    let q = db('iqac_evidence').where({ college_id: actor.collegeId });
    if (filters.cycleId)
        q = q.where({ cycle_id: filters.cycleId });
    if (filters.criterionId)
        q = q.where({ criterion_id: filters.criterionId });
    if (filters.metricId)
        q = q.where({ metric_id: filters.metricId });
    if (filters.verificationStatus)
        q = q.where({ verification_status: filters.verificationStatus });
    return q.orderBy('submitted_at', 'desc');
}
export async function submitEvidence(actor, input) {
    assertIqacPermission(actor, 'iqac.evidence.submit');
    const [id] = await db('iqac_evidence').insert({
        college_id: actor.collegeId,
        cycle_id: input.cycleId ?? null,
        criterion_id: input.criterionId ?? null,
        metric_id: input.metricId ?? null,
        provenance: input.provenance,
        source_module: input.sourceModule ?? null,
        source_record_type: input.sourceRecordType ?? null,
        source_record_id: input.sourceRecordId ?? null,
        document_id: input.documentId ?? null,
        external_reference: input.externalReference ?? null,
        period_label: input.periodLabel ?? null,
        academic_year: input.academicYear ?? null,
        verification_status: 'SUBMITTED',
        submitted_by: actor.facultyUserId,
        submitted_at: db.fn.now(),
    });
    const row = await mustFindInCollege('iqac_evidence', id, actor.collegeId);
    await auditFromActor(actor, 'EVIDENCE_SUBMIT', 'iqac_evidence', id, { after: row });
    return row;
}
/** Self-verification is hard-blocked (prompt §63) via `assertNotSelfVerifying`. */
export async function verifyEvidence(actor, evidenceId, input) {
    assertIqacPermission(actor, 'iqac.evidence.verify');
    const evidence = await mustFindInCollege('iqac_evidence', evidenceId, actor.collegeId);
    await assertNotSelfVerifying(actor, evidenceId);
    await db('iqac_evidence').where({ id: evidenceId }).update({
        verification_status: input.status,
        verified_by: actor.facultyUserId,
        verified_at: db.fn.now(),
        remarks: input.remarks ?? null,
    });
    const after = await mustFindInCollege('iqac_evidence', evidenceId, actor.collegeId);
    await auditFromActor(actor, 'EVIDENCE_VERIFY', 'iqac_evidence', evidenceId, { before: evidence, after });
    return after;
}
// ── Continuous improvement / action plans ─────────────────────────────────
export async function listActionPlans(actor, filters) {
    assertIqacPermission(actor, 'iqac.actionPlan.manage');
    let q = db('iqac_action_plans').where({ college_id: actor.collegeId });
    if (filters.status)
        q = q.where({ status: filters.status });
    if (filters.sourceType)
        q = q.where({ source_type: filters.sourceType });
    if (filters.departmentId)
        q = q.where({ department_id: filters.departmentId });
    if (!isInstitutionWideViewer(actor.role) && actor.role !== 'HOD') {
        q = q.where({ owner_user_id: actor.facultyUserId });
    }
    else if (actor.role === 'HOD') {
        q = q.where((b) => b.where({ department_id: null }).orWhereIn('department_id', [...(actor.hodDepartmentIds ?? []), actor.departmentId].filter((v) => v != null)));
    }
    return q.orderBy('created_at', 'desc');
}
export async function createActionPlan(actor, input) {
    assertIqacPermission(actor, 'iqac.actionPlan.manage');
    const ownerUserId = actor.role === 'FACULTY' ? actor.facultyUserId : (input.ownerUserId ?? null);
    const departmentId = input.departmentId ?? actor.departmentId ?? null;
    const [id] = await db('iqac_action_plans').insert({
        college_id: actor.collegeId,
        source_type: input.sourceType,
        source_ref: input.sourceRef != null ? JSON.stringify(input.sourceRef) : null,
        finding: input.finding,
        action: input.action,
        owner_user_id: ownerUserId,
        department_id: departmentId,
        target_date: input.targetDate ?? null,
        status: 'PLANNED',
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_action_plans', id, actor.collegeId);
    await auditFromActor(actor, 'ACTION_PLAN_CREATE', 'iqac_action_plan', id, { after: row });
    return row;
}
function assertActionPlanAccess(actor, plan) {
    if (isAdminOrInstitutionWide(actor))
        return;
    if (canActOnDepartmentScopedRecord(actor, plan.department_id))
        return;
    if (Number(plan.owner_user_id) === Number(actor.facultyUserId))
        return;
    throw new AppError(403, 'You do not have access to this action plan');
}
function isAdminOrInstitutionWide(actor) {
    return isInstitutionWideViewer(actor.role) || actor.role === 'SUPER_ADMIN' || actor.role === 'COLLEGE_ADMIN';
}
/** Forward-only progression (PLANNED -> IN_PROGRESS -> COMPLETED); cannot mutate a terminal (CLOSED/CANCELLED) plan. */
export async function updateActionPlan(actor, planId, input) {
    return db.transaction(async (trx) => {
        const plan = await trx('iqac_action_plans').where({ id: planId, college_id: actor.collegeId }).forUpdate().first();
        if (!plan)
            throw new AppError(404, 'Action plan not found');
        assertActionPlanAccess(actor, plan);
        if (ACTION_PLAN_TERMINAL_STATUSES.includes(plan.status))
            throw new AppError(409, `Action plan is ${plan.status} and cannot be updated`);
        const update = {};
        if (input.status) {
            const forward = { PLANNED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED', COMPLETED: null, CLOSED: null, CANCELLED: null };
            if (forward[plan.status] !== input.status) {
                throw new AppError(409, `Action plan in status ${plan.status} cannot move to ${input.status}`);
            }
            update.status = input.status;
        }
        if (input.action !== undefined)
            update.action = input.action;
        if (input.targetDate !== undefined)
            update.target_date = input.targetDate;
        if (input.evidenceDocumentId !== undefined)
            update.evidence_document_id = input.evidenceDocumentId;
        if (Object.keys(update).length === 0)
            return plan;
        await trx('iqac_action_plans').where({ id: planId }).update(update);
        const after = await trx('iqac_action_plans').where({ id: planId }).first();
        await auditFromActor(actor, 'ACTION_PLAN_UPDATE', 'iqac_action_plan', planId, { before: plan, after });
        return after;
    });
}
/** Closure requires the review permission and COMPLETED status — protects against closing a plan whose action never actually happened. */
export async function closeActionPlan(actor, planId, input) {
    assertIqacPermission(actor, 'iqac.actionPlan.close');
    return db.transaction(async (trx) => {
        const plan = await trx('iqac_action_plans').where({ id: planId, college_id: actor.collegeId }).forUpdate().first();
        if (!plan)
            throw new AppError(404, 'Action plan not found');
        if (plan.status === 'CLOSED')
            return plan;
        if (plan.status !== 'COMPLETED')
            throw new AppError(409, `Action plan must be COMPLETED before closing (currently ${plan.status})`);
        await trx('iqac_action_plans').where({ id: planId }).update({
            status: 'CLOSED', review_remarks: input.reviewRemarks ?? null, closed_by: actor.facultyUserId, closed_at: trx.fn.now(),
        });
        const after = await trx('iqac_action_plans').where({ id: planId }).first();
        await auditFromActor(actor, 'ACTION_PLAN_CLOSE', 'iqac_action_plan', planId, { before: plan, after });
        return after;
    });
}
export async function cancelActionPlan(actor, planId, reason) {
    assertIqacPermission(actor, 'iqac.actionPlan.manage');
    return db.transaction(async (trx) => {
        const plan = await trx('iqac_action_plans').where({ id: planId, college_id: actor.collegeId }).forUpdate().first();
        if (!plan)
            throw new AppError(404, 'Action plan not found');
        assertActionPlanAccess(actor, plan);
        if (ACTION_PLAN_TERMINAL_STATUSES.includes(plan.status))
            throw new AppError(409, `Action plan is already ${plan.status}`);
        await trx('iqac_action_plans').where({ id: planId }).update({ status: 'CANCELLED', closed_by: actor.facultyUserId, closed_at: trx.fn.now(), review_remarks: reason });
        const after = await trx('iqac_action_plans').where({ id: planId }).first();
        await auditFromActor(actor, 'ACTION_PLAN_CANCEL', 'iqac_action_plan', planId, { before: plan, after, reason });
        return after;
    });
}
/** Reopening a closed plan requires elevated permission + mandatory reason + audit trail (prompt §26). */
export async function reopenActionPlan(actor, planId, input) {
    assertIqacPermission(actor, 'iqac.actionPlan.reopen');
    return db.transaction(async (trx) => {
        const plan = await trx('iqac_action_plans').where({ id: planId, college_id: actor.collegeId }).forUpdate().first();
        if (!plan)
            throw new AppError(404, 'Action plan not found');
        if (plan.status !== 'CLOSED')
            throw new AppError(409, `Only a CLOSED action plan can be reopened (currently ${plan.status})`);
        await trx('iqac_action_plans').where({ id: planId }).update({
            status: 'IN_PROGRESS', reopen_count: Number(plan.reopen_count) + 1, reopen_reason: input.reason, closed_by: null, closed_at: null,
        });
        const after = await trx('iqac_action_plans').where({ id: planId }).first();
        await auditFromActor(actor, 'ACTION_PLAN_REOPEN', 'iqac_action_plan', planId, { before: plan, after, reason: input.reason });
        return after;
    });
}
// ── Academic / internal audits ────────────────────────────────────────────
export async function listAudits(actor, filters) {
    assertIqacPermission(actor, 'iqac.audit.view');
    let q = db('iqac_audits').where({ college_id: actor.collegeId });
    if (filters.departmentId)
        q = q.where({ department_id: filters.departmentId });
    if (actor.role === 'HOD') {
        q = q.where((b) => b.where({ department_id: null }).orWhereIn('department_id', hodDeptScope(actor)));
    }
    return q.orderBy('created_at', 'desc');
}
function hodDeptScope(actor) {
    return [...(actor.hodDepartmentIds ?? []), actor.departmentId].filter((v) => v != null);
}
export async function createAudit(actor, input) {
    assertIqacPermission(actor, 'iqac.audit.manage');
    const [id] = await db('iqac_audits').insert({
        college_id: actor.collegeId,
        name: input.name,
        academic_year: input.academicYear,
        department_id: input.departmentId ?? null,
        auditor_user_id: input.auditorUserId ?? null,
        checklist: JSON.stringify(input.checklist),
        status: 'DRAFT',
        scheduled_date: input.scheduledDate ?? null,
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_audits', id, actor.collegeId);
    await auditFromActor(actor, 'AUDIT_CREATE', 'iqac_audit', id, { after: row });
    return row;
}
export async function addFinding(actor, auditId, input) {
    assertIqacPermission(actor, 'iqac.audit.manage');
    const audit = await mustFindInCollege('iqac_audits', auditId, actor.collegeId);
    const [id] = await db('iqac_audit_findings').insert({
        college_id: actor.collegeId,
        audit_id: auditId,
        checklist_item_code: input.checklistItemCode ?? null,
        finding: input.finding,
        severity: input.severity ?? 'MEDIUM',
        status: 'OPEN',
        created_by: actor.facultyUserId,
    });
    if (audit.status === 'DRAFT')
        await db('iqac_audits').where({ id: auditId }).update({ status: 'IN_PROGRESS' });
    const row = await mustFindInCollege('iqac_audit_findings', id, actor.collegeId);
    await auditFromActor(actor, 'AUDIT_FINDING_CREATE', 'iqac_audit_finding', id, { after: row });
    return row;
}
/** Feeds the SAME continuous-improvement engine as NBA/NAAC/survey findings — no separate `audit_tasks` table (prompt §53). */
export async function raiseActionPlanFromFinding(actor, findingId, input) {
    assertIqacPermission(actor, 'iqac.audit.manage');
    const finding = await mustFindInCollege('iqac_audit_findings', findingId, actor.collegeId);
    return db.transaction(async (trx) => {
        const [planId] = await trx('iqac_action_plans').insert({
            college_id: actor.collegeId,
            source_type: 'ACADEMIC_AUDIT',
            source_ref: JSON.stringify({ auditId: finding.audit_id, findingId }),
            finding: input.finding,
            action: input.action,
            owner_user_id: input.ownerUserId ?? null,
            department_id: input.departmentId ?? null,
            target_date: input.targetDate ?? null,
            status: 'PLANNED',
            created_by: actor.facultyUserId,
        });
        await trx('iqac_audit_findings').where({ id: findingId }).update({ status: 'ACTION_PLANNED', action_plan_id: planId });
        const plan = await trx('iqac_action_plans').where({ id: planId }).first();
        await auditFromActor(actor, 'AUDIT_FINDING_ACTION_PLANNED', 'iqac_audit_finding', findingId, { after: plan });
        return plan;
    });
}
export async function closeAudit(actor, auditId) {
    assertIqacPermission(actor, 'iqac.audit.manage');
    const audit = await mustFindInCollege('iqac_audits', auditId, actor.collegeId);
    if (audit.status === 'CLOSED')
        return audit;
    await db('iqac_audits').where({ id: auditId }).update({ status: 'CLOSED', completed_at: db.fn.now() });
    const after = await mustFindInCollege('iqac_audits', auditId, actor.collegeId);
    await auditFromActor(actor, 'AUDIT_CLOSE', 'iqac_audit', auditId, { before: audit, after });
    return after;
}
// ── Committees / meetings ─────────────────────────────────────────────────
export async function listCommittees(actor) {
    assertIqacPermission(actor, 'iqac.committee.view');
    return db('iqac_committees').where({ college_id: actor.collegeId, is_active: true }).orderBy('name');
}
export async function createCommittee(actor, input) {
    assertIqacPermission(actor, 'iqac.committee.manage');
    const [id] = await db('iqac_committees').insert({
        college_id: actor.collegeId, name: input.name, committee_type: input.committeeType ?? 'IQAC', description: input.description ?? null, created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_committees', id, actor.collegeId);
    await auditFromActor(actor, 'COMMITTEE_CREATE', 'iqac_committee', id, { after: row });
    return row;
}
export async function addCommitteeMember(actor, committeeId, input) {
    assertIqacPermission(actor, 'iqac.committee.manage');
    await mustFindInCollege('iqac_committees', committeeId, actor.collegeId);
    const [id] = await db('iqac_committee_members').insert({
        college_id: actor.collegeId,
        committee_id: committeeId,
        user_id: input.userId ?? null,
        external_name: input.externalName ?? null,
        external_designation: input.externalDesignation ?? null,
        role_in_committee: input.roleInCommittee ?? 'MEMBER',
        term_start: input.termStart ?? null,
        term_end: input.termEnd ?? null,
    });
    const row = await mustFindInCollege('iqac_committee_members', id, actor.collegeId);
    await auditFromActor(actor, 'COMMITTEE_MEMBER_ADD', 'iqac_committee_member', id, { after: row });
    return row;
}
export async function listCommitteeMembers(actor, committeeId) {
    assertIqacPermission(actor, 'iqac.committee.view');
    await mustFindInCollege('iqac_committees', committeeId, actor.collegeId);
    return db('iqac_committee_members').where({ committee_id: committeeId, college_id: actor.collegeId }).orderBy('role_in_committee');
}
export async function scheduleMeeting(actor, committeeId, input) {
    assertIqacPermission(actor, 'iqac.meeting.manage');
    await mustFindInCollege('iqac_committees', committeeId, actor.collegeId);
    const [id] = await db('iqac_meetings').insert({
        college_id: actor.collegeId, committee_id: committeeId, meeting_date: input.meetingDate, agenda: input.agenda ?? null, status: 'SCHEDULED', created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_meetings', id, actor.collegeId);
    await auditFromActor(actor, 'MEETING_SCHEDULE', 'iqac_meeting', id, { after: row });
    return row;
}
/** Records minutes and marks the meeting HELD. Minutes attachments reuse `documentEngine` by id — no separate file store here (prompt §50). */
export async function recordMeetingMinutes(actor, meetingId, input) {
    assertIqacPermission(actor, 'iqac.meeting.manage');
    const meeting = await mustFindInCollege('iqac_meetings', meetingId, actor.collegeId);
    await db('iqac_meetings').where({ id: meetingId }).update({
        status: 'HELD', minutes: input.minutes ?? null, minutes_document_id: input.minutesDocumentId ?? null,
    });
    const after = await mustFindInCollege('iqac_meetings', meetingId, actor.collegeId);
    await auditFromActor(actor, 'MEETING_RECORD_MINUTES', 'iqac_meeting', meetingId, { before: meeting, after });
    return after;
}
export async function listMeetings(actor, committeeId) {
    assertIqacPermission(actor, 'iqac.committee.view');
    await mustFindInCollege('iqac_committees', committeeId, actor.collegeId);
    return db('iqac_meetings').where({ committee_id: committeeId, college_id: actor.collegeId }).orderBy('meeting_date', 'desc');
}
// ── Compliance calendar ───────────────────────────────────────────────────
export async function listComplianceItems(actor) {
    assertIqacPermission(actor, 'iqac.compliance.view');
    const rows = await db('iqac_compliance_items').where({ college_id: actor.collegeId }).orderBy('due_date');
    const now = today();
    // Derived-only "overdue" flag for display — never silently mutates the stored status (prompt §34 spirit / §18).
    return rows.map((r) => ({ ...r, isOverdue: ['PENDING', 'SUBMITTED'].includes(r.status) && dateStr(r.due_date) < now }));
}
export async function createComplianceItem(actor, input) {
    assertIqacPermission(actor, 'iqac.compliance.manage');
    const [id] = await db('iqac_compliance_items').insert({
        college_id: actor.collegeId,
        requirement: input.requirement,
        authority: input.authority,
        period_label: input.periodLabel ?? null,
        due_date: input.dueDate,
        owner_user_id: input.ownerUserId ?? null,
        status: 'PENDING',
        created_by: actor.facultyUserId,
    });
    const row = await mustFindInCollege('iqac_compliance_items', id, actor.collegeId);
    await auditFromActor(actor, 'COMPLIANCE_ITEM_CREATE', 'iqac_compliance_item', id, { after: row });
    return row;
}
export async function updateComplianceItem(actor, itemId, input) {
    assertIqacPermission(actor, 'iqac.compliance.manage');
    const item = await mustFindInCollege('iqac_compliance_items', itemId, actor.collegeId);
    await db('iqac_compliance_items').where({ id: itemId }).update({
        status: input.status,
        submission_reference: input.submissionReference ?? item.submission_reference,
        evidence_document_id: input.evidenceDocumentId ?? item.evidence_document_id,
    });
    const after = await mustFindInCollege('iqac_compliance_items', itemId, actor.collegeId);
    await auditFromActor(actor, 'COMPLIANCE_ITEM_UPDATE', 'iqac_compliance_item', itemId, { before: item, after });
    return after;
}
// ── Dashboard ──────────────────────────────────────────────────────────────
/** Efficient server-side aggregation — COUNT queries only, never one query per record (prompt §81). */
export async function getDashboard(actor) {
    assertIqacPermission(actor, 'iqac.dashboard.view');
    const collegeId = actor.collegeId;
    const now = today();
    const [evidencePending, metricsNeedingAttention, actionPlansOverdue, findingsOpen, complianceOverdue, activeCycles,] = await Promise.all([
        db('iqac_evidence').where({ college_id: collegeId, verification_status: 'SUBMITTED' }).count({ c: 'id' }).first(),
        db('iqac_metric_values').where({ college_id: collegeId }).whereIn('value_status', ['NO_DATA', 'NOT_CONFIGURED', 'SOURCE_ERROR']).count({ c: 'id' }).first(),
        db('iqac_action_plans').where({ college_id: collegeId }).whereNotIn('status', ACTION_PLAN_TERMINAL_STATUSES).where('target_date', '<', now).count({ c: 'id' }).first(),
        db('iqac_audit_findings').where({ college_id: collegeId }).whereIn('status', ['OPEN', 'ACTION_PLANNED', 'IN_PROGRESS']).count({ c: 'id' }).first(),
        db('iqac_compliance_items').where({ college_id: collegeId }).whereIn('status', ['PENDING', 'SUBMITTED']).where('due_date', '<', now).count({ c: 'id' }).first(),
        db('iqac_cycles').where({ college_id: collegeId }).whereNotIn('status', CYCLE_TERMINAL_STATUSES).select('id', 'name', 'status', 'academic_year'),
    ]);
    return {
        evidencePendingVerification: Number(evidencePending?.c ?? 0),
        metricsNeedingAttention: Number(metricsNeedingAttention?.c ?? 0),
        actionPlansOverdue: Number(actionPlansOverdue?.c ?? 0),
        auditFindingsOpen: Number(findingsOpen?.c ?? 0),
        complianceDeadlinesOverdue: Number(complianceOverdue?.c ?? 0),
        activeCycles,
    };
}
