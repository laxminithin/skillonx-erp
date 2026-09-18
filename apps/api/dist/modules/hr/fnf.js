/**
 * Final Settlement orchestration.
 * Lifecycle owns separation. Leave owns balances. Attendance owns LOP.
 * Payroll owns salary history. Finance owns accounting. Library owns liabilities.
 * F&F snapshots those facts, calculates, posts, and locks.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, hasHrPermission, requireEmployeeForActor, resolveEmployeeForActor, } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { nextFnfCaseNumber } from './numbers.js';
import { asISODate } from '../timetable/time.js';
import { toMoney } from './payrollMoney.js';
import { ensureFnfPolicy } from './fnfPolicy.js';
import { FNF_LOCKED_STATUSES, FNF_SNAPSHOT_VERSION, FNF_TRANSITIONS, } from './fnfTypes.js';
import { listClearances, syncClearances, unresolvedMandatory } from './fnfClearance.js';
import { getEmployeeLibraryObligations, getFinanceDuesSnapshot, getLastLockedPayroll, getLeaveBalanceSnapshot, getSalaryBasisAsOf, parseJson, } from './fnfSources.js';
import { computeGratuity, computeLeaveEncashment, computeNoticePay, computeUnpaidSalary, summarizeComponents, } from './fnfCalc.js';
export async function fnfSchemaReady() {
    try {
        return ((await db.schema.hasTable('hr_final_settlements')) &&
            (await db.schema.hasTable('hr_fnf_clearances')) &&
            (await db.schema.hasTable('employee_finance_dues')));
    }
    catch {
        return false;
    }
}
function assertTransition(from, to) {
    const allowed = FNF_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
        throw new AppError(400, `Invalid settlement transition ${from} → ${to}`, undefined, 'FNF_INVALID_TRANSITION');
    }
}
function assertUnlocked(row) {
    if (FNF_LOCKED_STATUSES.includes(String(row.status)) && String(row.status) !== 'APPROVED') {
        throw new AppError(400, 'Settlement is locked', undefined, 'FNF_LOCKED');
    }
    if (String(row.status) === 'APPROVED' && String(row.finance_posting_status) === 'POSTED') {
        throw new AppError(400, 'Settlement is locked', undefined, 'FNF_LOCKED');
    }
}
async function loadCase(actor, id) {
    const row = await db('hr_final_settlements').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Settlement not found');
    return row;
}
function financialViewAllowed(actor) {
    return hasHrPermission(actor, 'hr.fnf.approve') || hasHrPermission(actor, 'hr.fnf.calculate') || hasHrPermission(actor, 'hr.payroll.view');
}
function stripFinancials(payload, actor) {
    if (financialViewAllowed(actor))
        return payload;
    const clone = { ...payload };
    delete clone.grossPayable;
    delete clone.totalRecoveries;
    delete clone.netAmount;
    delete clone.settlementDirection;
    delete clone.components;
    delete clone.payables;
    delete clone.recoveries;
    delete clone.inputSnapshot;
    delete clone.adjustments;
    return clone;
}
export async function createSettlementCase(actor, separationRequestId) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const sep = await db('employee_separation_requests')
        .where({ id: separationRequestId, college_id: actor.collegeId })
        .first();
    if (!sep)
        throw new AppError(404, 'Separation request not found');
    const emp = await db('employees').where({ id: sep.employee_id, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const lwd = asISODate(sep.last_working_date ?? sep.approved_last_working_date ?? emp.last_working_date);
    if (!lwd)
        throw new AppError(400, 'Last working date is required before Final Settlement', undefined, 'FNF_NO_LWD');
    const eligibleStatuses = ['ACCEPTED', 'CLEARANCE_PENDING', 'COMPLETED'];
    if (!eligibleStatuses.includes(String(sep.status))) {
        throw new AppError(400, 'Separation must be accepted before Final Settlement', undefined, 'FNF_NOT_ELIGIBLE');
    }
    const existing = await db('hr_final_settlements')
        .where({
        college_id: actor.collegeId,
        employee_id: Number(sep.employee_id),
        separation_request_id: Number(sep.id),
    })
        .first();
    if (existing) {
        return { ...await presentCase(actor, Number(existing.id)), idempotent: true };
    }
    const policy = await ensureFnfPolicy(actor.collegeId, lwd);
    let id;
    try {
        id = await db.transaction(async (trx) => {
            const caseNumber = await nextFnfCaseNumber(trx, actor.collegeId);
            const [inserted] = await trx('hr_final_settlements').insert({
                college_id: actor.collegeId,
                employee_id: Number(sep.employee_id),
                separation_request_id: Number(sep.id),
                case_number: caseNumber,
                version_no: 1,
                status: 'CLEARANCE_PENDING',
                separation_type: sep.separation_type,
                last_working_date: lwd,
                notice_date: asISODate(sep.created_at) || null,
                notice_required_days: sep.notice_period_days ?? emp.notice_period_days ?? 0,
                notice_waived: false,
                policy_id: policy.id,
                created_by: actor.facultyUserId,
            });
            return Number(inserted);
        });
    }
    catch (err) {
        const e = err;
        if (e?.code === 'ER_DUP_ENTRY' || /Duplicate/i.test(String(e?.message))) {
            const dup = await db('hr_final_settlements')
                .where({
                college_id: actor.collegeId,
                employee_id: Number(sep.employee_id),
                separation_request_id: Number(sep.id),
            })
                .first();
            if (dup)
                return { ...await presentCase(actor, Number(dup.id)), idempotent: true };
        }
        throw err;
    }
    await syncClearances(id, Number(sep.employee_id), actor.collegeId);
    await recordHrAudit({
        actor,
        action: 'FNF_CASE_CREATED',
        entityType: 'hr_final_settlements',
        entityId: id,
        after: { separationRequestId, employeeId: Number(sep.employee_id) },
    });
    await notifyEmployee({
        employeeId: Number(sep.employee_id),
        collegeId: actor.collegeId,
        type: 'FNF_CASE_CREATED',
        title: 'Final settlement initiated',
        relatedType: 'hr_final_settlements',
        relatedId: id,
        dedupeKey: `fnf-created-${id}`,
    });
    return presentCase(actor, id);
}
export async function syncSettlementSources(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertUnlocked(row);
    await syncClearances(settlementId, Number(row.employee_id), actor.collegeId);
    await recordHrAudit({ actor, action: 'FNF_CLEARANCE_SYNC', entityType: 'hr_final_settlements', entityId: settlementId });
    return presentCase(actor, settlementId);
}
export async function setNoticeWaiver(actor, settlementId, waived, reason) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertUnlocked(row);
    await db('hr_final_settlements').where({ id: settlementId }).update({
        notice_waived: waived,
        notice_waiver_reason: reason,
    });
    await recordHrAudit({
        actor,
        action: 'FNF_NOTICE_WAIVER',
        entityType: 'hr_final_settlements',
        entityId: settlementId,
        after: { waived, reason },
        reason,
    });
    return presentCase(actor, settlementId);
}
export async function addAssetItem(actor, settlementId, input) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertUnlocked(row);
    await db('hr_fnf_asset_items').insert({
        settlement_id: settlementId,
        college_id: actor.collegeId,
        item_code: input.itemCode,
        item_name: input.itemName,
        status: 'PENDING',
        recovery_amount: toMoney(input.recoveryAmount ?? 0),
    });
    await syncClearances(settlementId, Number(row.employee_id), actor.collegeId);
    return presentCase(actor, settlementId);
}
export async function updateAssetItem(actor, settlementId, itemId, input) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertUnlocked(row);
    const item = await db('hr_fnf_asset_items').where({ id: itemId, settlement_id: settlementId }).first();
    if (!item)
        throw new AppError(404, 'Asset item not found');
    await db('hr_fnf_asset_items').where({ id: itemId }).update({
        status: input.status,
        recovery_amount: input.recoveryAmount != null ? toMoney(input.recoveryAmount) : item.recovery_amount,
        remarks: input.remarks ?? item.remarks,
    });
    await syncClearances(settlementId, Number(row.employee_id), actor.collegeId);
    return presentCase(actor, settlementId);
}
export async function addManualAdjustment(actor, settlementId, input) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertUnlocked(row);
    if (FNF_LOCKED_STATUSES.includes(String(row.status))) {
        throw new AppError(400, 'Cannot add adjustments to a locked settlement', undefined, 'FNF_LOCKED');
    }
    const [id] = await db('hr_fnf_adjustments').insert({
        settlement_id: settlementId,
        college_id: actor.collegeId,
        side: input.side,
        code: input.code ?? 'MANUAL',
        amount: toMoney(input.amount),
        reason: input.reason,
        supporting_reference: input.supportingReference ?? null,
        status: 'APPROVED',
        created_by: actor.facultyUserId,
        approved_by: actor.facultyUserId,
        approved_at: db.fn.now(),
    });
    await recordHrAudit({
        actor,
        action: 'FNF_MANUAL_ADJUSTMENT',
        entityType: 'hr_fnf_adjustments',
        entityId: Number(id),
        after: input,
        reason: input.reason,
    });
    return presentCase(actor, settlementId);
}
export async function calculateSettlement(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.calculate');
    const row = await loadCase(actor, settlementId);
    if (FNF_LOCKED_STATUSES.includes(String(row.status))) {
        throw new AppError(400, 'Cannot recalculate a locked settlement', undefined, 'FNF_LOCKED');
    }
    if (!['CLEARANCE_PENDING', 'READY_FOR_CALCULATION', 'CALCULATED', 'REVIEW', 'REOPENED', 'DRAFT'].includes(String(row.status))) {
        throw new AppError(400, `Cannot calculate from status ${row.status}`, undefined, 'FNF_INVALID_TRANSITION');
    }
    await syncClearances(settlementId, Number(row.employee_id), actor.collegeId);
    const lwd = asISODate(row.last_working_date);
    if (!lwd)
        throw new AppError(400, 'Last working date is required', undefined, 'FNF_NO_LWD');
    const emp = await db('employees').where({ id: row.employee_id }).first();
    const policy = await ensureFnfPolicy(actor.collegeId, lwd);
    const year = Number(lwd.slice(0, 4));
    const [salary, leaves, payroll, library, financeDues, adjustments, assets] = await Promise.all([
        getSalaryBasisAsOf(Number(row.employee_id), actor.collegeId, lwd),
        getLeaveBalanceSnapshot(Number(row.employee_id), actor.collegeId, year),
        getLastLockedPayroll(Number(row.employee_id), actor.collegeId),
        getEmployeeLibraryObligations(Number(row.employee_id), actor.collegeId),
        getFinanceDuesSnapshot(Number(row.employee_id), actor.collegeId),
        db('hr_fnf_adjustments').where({ settlement_id: settlementId, status: 'APPROVED' }),
        db('hr_fnf_asset_items').where({ settlement_id: settlementId }),
    ]);
    const notice = computeNoticePay(policy, {
        requiredDays: Number(row.notice_required_days ?? 0),
        noticeDate: row.notice_date ? asISODate(row.notice_date) : asISODate(row.created_at),
        lastWorkingDate: lwd,
        waived: !!row.notice_waived,
        waiverReason: row.notice_waiver_reason ? String(row.notice_waiver_reason) : null,
    }, salary);
    const components = [];
    const unpaid = computeUnpaidSalary(payroll, lwd, salary, policy.noticeDailyDivisor);
    if (unpaid)
        components.push(unpaid);
    components.push(...computeLeaveEncashment(policy, leaves, salary));
    if (notice.component)
        components.push(notice.component);
    const gratuity = computeGratuity(policy, salary, emp?.date_of_joining ? asISODate(emp.date_of_joining) : null, lwd);
    if (gratuity)
        components.push(gratuity);
    for (const due of financeDues.dues) {
        if (due.settledByPayrollRunId)
            continue;
        components.push({
            side: 'RECOVERY',
            code: `FINANCE_${due.dueType}`,
            name: `Finance due (${due.dueType})`,
            source: 'finance',
            basis: due.sourceRef ?? `due:${due.id}`,
            quantity: 1,
            rate: due.outstanding,
            amount: due.outstanding,
            ruleReference: `employee_finance_dues:${due.id}`,
            sourceRef: `DUE:${due.id}`,
            trace: { dueId: due.id, dueType: due.dueType, payrollAlreadyRecovered: false },
        });
    }
    if (Number(library.fineAmount) > 0) {
        components.push({
            side: 'RECOVERY',
            code: 'LIBRARY_FINE',
            name: 'Library fine recovery',
            source: 'library',
            basis: `member:${library.memberId}`,
            quantity: 1,
            rate: library.fineAmount,
            amount: library.fineAmount,
            ruleReference: `library_member:${library.memberId}`,
            sourceRef: `LIBRARY:${library.memberId}`,
            trace: library,
        });
    }
    for (const a of assets) {
        if (Number(a.recovery_amount) <= 0)
            continue;
        components.push({
            side: 'RECOVERY',
            code: 'ASSET_RECOVERY',
            name: `Asset recovery (${a.item_code})`,
            source: 'fnf_assets',
            basis: String(a.item_code),
            quantity: 1,
            rate: toMoney(a.recovery_amount),
            amount: toMoney(a.recovery_amount),
            ruleReference: `asset:${a.id}`,
            sourceRef: `ASSET:${a.id}`,
        });
    }
    for (const adj of adjustments) {
        components.push({
            side: adj.side,
            code: String(adj.code),
            name: `Manual adjustment (${adj.code})`,
            source: 'manual',
            basis: String(adj.reason),
            quantity: 1,
            rate: toMoney(adj.amount),
            amount: toMoney(adj.amount),
            ruleReference: `adjustment:${adj.id}`,
            sourceRef: `ADJ:${adj.id}`,
            trace: { reason: adj.reason, supportingReference: adj.supporting_reference },
        });
    }
    // Deduplicate by sourceRef (same recovery must not appear twice)
    const seen = new Set();
    const unique = [];
    for (const c of components) {
        const key = `${c.side}:${c.sourceRef ?? c.code}:${c.amount}`;
        if (c.sourceRef && seen.has(`${c.side}:${c.sourceRef}`))
            continue;
        if (c.sourceRef)
            seen.add(`${c.side}:${c.sourceRef}`);
        else if (seen.has(key))
            continue;
        else
            seen.add(key);
        unique.push(c);
    }
    const totals = summarizeComponents(unique);
    const nextVersion = Number(row.calculation_version ?? 0) + 1;
    const snapshot = {
        version: FNF_SNAPSHOT_VERSION,
        calculatedAt: new Date().toISOString(),
        employee: {
            employeeId: Number(emp.id),
            employeeNumber: emp.employee_number,
            displayName: emp.display_name,
            departmentId: emp.department_id,
            designationId: emp.designation_id,
            dateOfJoining: emp.date_of_joining ? asISODate(emp.date_of_joining) : null,
            lastWorkingDate: lwd,
            employmentStatus: emp.employment_status,
        },
        separation: {
            id: Number(row.separation_request_id),
            type: row.separation_type,
            lastWorkingDate: lwd,
            noticeRequiredDays: Number(row.notice_required_days ?? 0),
            noticeServedDays: notice.served,
            noticeShortfallDays: notice.shortfall,
            noticeWaived: !!row.notice_waived,
        },
        policy,
        salary,
        leaves,
        payroll,
        library,
        financeDues,
        notice: { served: notice.served, shortfall: notice.shortfall, waived: !!row.notice_waived },
    };
    await db.transaction(async (trx) => {
        const fresh = await trx('hr_final_settlements').where({ id: settlementId }).forUpdate().first();
        if (!fresh)
            throw new AppError(404, 'Settlement not found');
        if (FNF_LOCKED_STATUSES.includes(String(fresh.status))) {
            throw new AppError(400, 'Cannot recalculate a locked settlement', undefined, 'FNF_LOCKED');
        }
        const version = Number(fresh.calculation_version ?? 0) + 1;
        await trx('hr_fnf_components').where({ settlement_id: settlementId, calculation_version: version }).del();
        for (const c of unique) {
            await trx('hr_fnf_components').insert({
                settlement_id: settlementId,
                college_id: actor.collegeId,
                calculation_version: version,
                side: c.side,
                code: c.code,
                name: c.name,
                source: c.source,
                basis: c.basis ?? null,
                quantity: c.quantity ?? null,
                rate: c.rate ?? null,
                amount: c.amount,
                rule_reference: c.ruleReference ?? null,
                source_ref: c.sourceRef ?? null,
                trace: JSON.stringify(c.trace ?? null),
                locked: false,
            });
        }
        const nextStatus = ['REVIEW', 'CALCULATED'].includes(String(fresh.status)) ? 'CALCULATED' : 'CALCULATED';
        await trx('hr_final_settlements').where({ id: settlementId }).update({
            status: nextStatus,
            calculation_version: version,
            input_snapshot: JSON.stringify(snapshot),
            snapshot_version: FNF_SNAPSHOT_VERSION,
            calculated_at: trx.fn.now(),
            gross_payable: totals.grossPayable,
            total_recoveries: totals.totalRecoveries,
            net_amount: totals.netAmount,
            settlement_direction: totals.direction,
            notice_served_days: notice.served,
            notice_shortfall_days: notice.shortfall,
            policy_id: policy.id,
        });
    });
    await recordHrAudit({
        actor,
        action: 'FNF_CALCULATED',
        entityType: 'hr_final_settlements',
        entityId: settlementId,
        after: { version: nextVersion, ...totals },
    });
    await notifyEmployee({
        employeeId: Number(row.employee_id),
        collegeId: actor.collegeId,
        type: 'FNF_CALCULATED',
        title: 'Final settlement calculated',
        relatedType: 'hr_final_settlements',
        relatedId: settlementId,
        dedupeKey: `fnf-calc-${settlementId}-${nextVersion}`,
    });
    return presentCase(actor, settlementId);
}
export async function submitForReview(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertTransition(String(row.status), 'REVIEW');
    await db('hr_final_settlements').where({ id: settlementId }).update({ status: 'REVIEW' });
    await recordHrAudit({ actor, action: 'FNF_REVIEW', entityType: 'hr_final_settlements', entityId: settlementId });
    return presentCase(actor, settlementId);
}
export async function approveSettlement(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.approve');
    const row = await loadCase(actor, settlementId);
    if (String(row.status) === 'APPROVED') {
        return { ...await presentCase(actor, settlementId), idempotent: true };
    }
    if (!['CALCULATED', 'REVIEW'].includes(String(row.status))) {
        throw new AppError(400, `Cannot approve from status ${row.status}`, undefined, 'FNF_INVALID_TRANSITION');
    }
    if (Number(row.created_by) === actor.facultyUserId) {
        throw new AppError(403, 'Creator cannot approve their own settlement', undefined, 'FNF_SELF_APPROVAL');
    }
    await syncClearances(settlementId, Number(row.employee_id), actor.collegeId);
    const items = await listClearances(settlementId);
    const blocking = unresolvedMandatory(items);
    if (blocking.length) {
        throw new AppError(400, 'Mandatory clearances unresolved', { blocking: blocking.map((b) => b.domain) }, 'FNF_CLEARANCE_BLOCKED');
    }
    if (!Number(row.calculation_version)) {
        throw new AppError(400, 'Settlement has not been calculated');
    }
    await db.transaction(async (trx) => {
        const fresh = await trx('hr_final_settlements').where({ id: settlementId }).forUpdate().first();
        if (!fresh)
            throw new AppError(404, 'Settlement not found');
        if (String(fresh.status) === 'APPROVED')
            return;
        if (!['CALCULATED', 'REVIEW'].includes(String(fresh.status))) {
            throw new AppError(400, `Cannot approve from status ${fresh.status}`, undefined, 'FNF_INVALID_TRANSITION');
        }
        if (Number(fresh.created_by) === actor.facultyUserId) {
            throw new AppError(403, 'Creator cannot approve their own settlement', undefined, 'FNF_SELF_APPROVAL');
        }
        await trx('hr_final_settlements').where({ id: settlementId }).update({
            status: 'APPROVED',
            approved_by: actor.facultyUserId,
            approved_at: trx.fn.now(),
            locked_at: trx.fn.now(),
        });
        await trx('hr_fnf_components')
            .where({ settlement_id: settlementId, calculation_version: fresh.calculation_version })
            .update({ locked: true });
    });
    await recordHrAudit({ actor, action: 'FNF_APPROVED', entityType: 'hr_final_settlements', entityId: settlementId });
    await notifyEmployee({
        employeeId: Number(row.employee_id),
        collegeId: actor.collegeId,
        type: 'FNF_APPROVED',
        title: 'Final settlement approved',
        relatedType: 'hr_final_settlements',
        relatedId: settlementId,
        dedupeKey: `fnf-approved-${settlementId}`,
    });
    return presentCase(actor, settlementId);
}
export async function rejectSettlement(actor, settlementId, reason) {
    assertHrPermission(actor, 'hr.fnf.approve');
    const row = await loadCase(actor, settlementId);
    assertTransition(String(row.status), 'REJECTED');
    await db('hr_final_settlements').where({ id: settlementId }).update({
        status: 'REJECTED',
        reject_reason: reason,
    });
    await recordHrAudit({ actor, action: 'FNF_REJECTED', entityType: 'hr_final_settlements', entityId: settlementId, reason });
    return presentCase(actor, settlementId);
}
export async function holdSettlement(actor, settlementId, reason) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    assertTransition(String(row.status), 'ON_HOLD');
    await db('hr_final_settlements').where({ id: settlementId }).update({ status: 'ON_HOLD', hold_reason: reason });
    await recordHrAudit({ actor, action: 'FNF_ON_HOLD', entityType: 'hr_final_settlements', entityId: settlementId, reason });
    return presentCase(actor, settlementId);
}
export async function postSettlementToFinance(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.post');
    const row = await loadCase(actor, settlementId);
    const { postFnfSettlement } = await import('../finance/fnfPosting.js');
    const result = await postFnfSettlement({ facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, role: actor.role, name: actor.name }, row);
    if (String(result.status) === 'POSTED' && !result.idempotent) {
        await db('hr_final_settlements').where({ id: settlementId }).update({
            status: 'FINANCE_POSTED',
            finance_posting_status: 'POSTED',
            finance_posting_id: result.id,
            finance_posting_key: result.postingKey,
            posted_at: db.fn.now(),
        });
        await notifyEmployee({
            employeeId: Number(row.employee_id),
            collegeId: actor.collegeId,
            type: 'FNF_POSTED',
            title: 'Final settlement posted to Finance',
            relatedType: 'hr_final_settlements',
            relatedId: settlementId,
            dedupeKey: `fnf-posted-${settlementId}`,
        });
    }
    return { ...await presentCase(actor, settlementId), posting: result };
}
export async function markSettled(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    if (String(row.status) === 'SETTLED' || String(row.status) === 'CLOSED') {
        return { ...await presentCase(actor, settlementId), idempotent: true };
    }
    assertTransition(String(row.status), 'SETTLED');
    if (String(row.finance_posting_status) !== 'POSTED') {
        throw new AppError(400, 'Finance posting required before settlement');
    }
    await db('hr_final_settlements').where({ id: settlementId }).update({
        status: 'SETTLED',
        settled_at: db.fn.now(),
    });
    await recordHrAudit({ actor, action: 'FNF_SETTLED', entityType: 'hr_final_settlements', entityId: settlementId });
    return presentCase(actor, settlementId);
}
export async function closeSettlement(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.manage');
    const row = await loadCase(actor, settlementId);
    if (String(row.status) === 'CLOSED')
        return { ...await presentCase(actor, settlementId), idempotent: true };
    assertTransition(String(row.status), 'CLOSED');
    await db('hr_final_settlements').where({ id: settlementId }).update({
        status: 'CLOSED',
        closed_at: db.fn.now(),
    });
    await recordHrAudit({ actor, action: 'FNF_CLOSED', entityType: 'hr_final_settlements', entityId: settlementId });
    await notifyEmployee({
        employeeId: Number(row.employee_id),
        collegeId: actor.collegeId,
        type: 'FNF_CLOSED',
        title: 'Final settlement closed',
        relatedType: 'hr_final_settlements',
        relatedId: settlementId,
        dedupeKey: `fnf-closed-${settlementId}`,
    });
    return presentCase(actor, settlementId);
}
export async function reopenSettlement(actor, settlementId, reason) {
    assertHrPermission(actor, 'hr.fnf.reopen');
    const row = await loadCase(actor, settlementId);
    if (String(row.finance_posting_status) === 'POSTED') {
        const { reverseFnfPosting } = await import('../finance/fnfPosting.js');
        await reverseFnfPosting({ facultyUserId: actor.facultyUserId, collegeId: actor.collegeId, role: actor.role, name: actor.name }, row, reason);
    }
    await db('hr_final_settlements').where({ id: settlementId }).update({
        status: 'REOPENED',
        reopen_reason: reason,
        approved_by: null,
        approved_at: null,
        locked_at: null,
        finance_posting_status: 'NOT_POSTED',
    });
    await db('hr_fnf_components').where({ settlement_id: settlementId }).update({ locked: false });
    await recordHrAudit({ actor, action: 'FNF_REOPENED', entityType: 'hr_final_settlements', entityId: settlementId, reason });
    return presentCase(actor, settlementId);
}
export async function mutateLockedBlocked(settlementId) {
    const row = await db('hr_final_settlements').where({ id: settlementId }).first();
    if (!row)
        throw new AppError(404, 'Settlement not found');
    if (!FNF_LOCKED_STATUSES.includes(String(row.status))) {
        return { blocked: false };
    }
    throw new AppError(400, 'Direct mutation of locked settlement is blocked', undefined, 'FNF_LOCKED');
}
export async function dashboard(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_final_settlements').where({ college_id: actor.collegeId });
    const count = (status) => rows.filter((r) => r.status === status).length;
    const payables = rows
        .filter((r) => r.settlement_direction === 'PAYABLE_TO_EMPLOYEE')
        .reduce((s, r) => s + Number(r.net_amount ?? 0), 0);
    const recoverables = rows
        .filter((r) => r.settlement_direction === 'RECEIVABLE_FROM_EMPLOYEE')
        .reduce((s, r) => s + Math.abs(Number(r.net_amount ?? 0)), 0);
    return {
        pendingCases: count('DRAFT') + count('CLEARANCE_PENDING') + count('REOPENED'),
        clearancePending: count('CLEARANCE_PENDING'),
        readyForCalculation: count('READY_FOR_CALCULATION'),
        calculated: count('CALCULATED'),
        awaitingApproval: count('REVIEW') + count('CALCULATED'),
        awaitingFinancePosting: count('APPROVED'),
        settled: count('SETTLED') + count('CLOSED'),
        onHold: count('ON_HOLD'),
        netPayables: financialViewAllowed(actor) ? toMoney(payables) : null,
        netRecoverables: financialViewAllowed(actor) ? toMoney(recoverables) : null,
    };
}
export async function listCases(actor, status) {
    assertHrPermission(actor, 'hr.fnf.view');
    let q = db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId })
        .select('s.id', 's.case_number', 's.status', 's.separation_type', 's.last_working_date', 's.net_amount', 's.settlement_direction', 's.finance_posting_status', 's.updated_at', 'e.display_name', 'e.employee_number')
        .orderBy('s.updated_at', 'desc');
    if (status)
        q = q.andWhere('s.status', status);
    const rows = await q;
    return rows.map((r) => {
        const item = {
            id: Number(r.id),
            caseNumber: r.case_number,
            status: r.status,
            separationType: r.separation_type,
            lastWorkingDate: r.last_working_date,
            financePostingStatus: r.finance_posting_status,
            employeeName: r.display_name,
            employeeNumber: r.employee_number,
            updatedAt: r.updated_at,
        };
        if (financialViewAllowed(actor)) {
            item.netAmount = toMoney(r.net_amount);
            item.settlementDirection = r.settlement_direction;
        }
        return item;
    });
}
export async function getCase(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.view');
    return presentCase(actor, settlementId);
}
export async function getPostingPreview(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.view');
    const row = await loadCase(actor, settlementId);
    const { buildFnfPostingPreview } = await import('../finance/fnfPosting.js');
    return buildFnfPostingPreview(actor.collegeId, row);
}
export async function presentCase(actor, settlementId) {
    const row = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.id': settlementId, 's.college_id': actor.collegeId })
        .select('s.*', 'e.display_name', 'e.employee_number', 'e.department_id', 'e.date_of_joining')
        .first();
    if (!row)
        throw new AppError(404, 'Settlement not found');
    const clearances = await listClearances(settlementId);
    const components = await db('hr_fnf_components')
        .where({ settlement_id: settlementId, calculation_version: row.calculation_version || 0 })
        .orderBy('id');
    const adjustments = await db('hr_fnf_adjustments').where({ settlement_id: settlementId }).orderBy('id');
    const documents = await db('hr_fnf_documents').where({ settlement_id: settlementId }).orderBy('id');
    const assets = await db('hr_fnf_asset_items').where({ settlement_id: settlementId }).orderBy('id');
    const payables = components.filter((c) => c.side === 'PAYABLE').map(mapComponent);
    const recoveries = components.filter((c) => c.side === 'RECOVERY').map(mapComponent);
    const payload = {
        id: Number(row.id),
        caseNumber: row.case_number,
        status: row.status,
        versionNo: Number(row.version_no),
        calculationVersion: Number(row.calculation_version),
        employeeId: Number(row.employee_id),
        employeeName: row.display_name,
        employeeNumber: row.employee_number,
        departmentId: Number(row.department_id),
        separationRequestId: Number(row.separation_request_id),
        separationType: row.separation_type,
        lastWorkingDate: row.last_working_date,
        dateOfJoining: row.date_of_joining,
        noticeRequiredDays: row.notice_required_days,
        noticeServedDays: row.notice_served_days,
        noticeShortfallDays: row.notice_shortfall_days,
        noticeWaived: !!row.notice_waived,
        financePostingStatus: row.finance_posting_status,
        financePostingId: row.finance_posting_id,
        financePostingKey: row.finance_posting_key,
        createdBy: row.created_by,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        lockedAt: row.locked_at,
        postedAt: row.posted_at,
        settledAt: row.settled_at,
        closedAt: row.closed_at,
        clearances,
        assets: assets.map((a) => ({
            id: Number(a.id),
            itemCode: a.item_code,
            itemName: a.item_name,
            status: a.status,
            recoveryAmount: toMoney(a.recovery_amount),
        })),
        documents: documents.map((d) => ({
            id: Number(d.id),
            docType: d.doc_type,
            releaseStatus: d.release_status,
            releasedAt: d.released_at,
        })),
        adjustments: adjustments.map((a) => ({
            id: Number(a.id),
            side: a.side,
            code: a.code,
            amount: toMoney(a.amount),
            reason: a.reason,
            supportingReference: a.supporting_reference,
        })),
    };
    if (financialViewAllowed(actor)) {
        payload.grossPayable = toMoney(row.gross_payable);
        payload.totalRecoveries = toMoney(row.total_recoveries);
        payload.netAmount = toMoney(row.net_amount);
        payload.settlementDirection = row.settlement_direction;
        payload.payables = payables;
        payload.recoveries = recoveries;
        payload.components = [...payables, ...recoveries];
        payload.inputSnapshot = parseJson(row.input_snapshot, null);
    }
    return payload;
}
function mapComponent(c) {
    return {
        id: Number(c.id),
        side: c.side,
        code: c.code,
        name: c.name,
        source: c.source,
        basis: c.basis,
        quantity: c.quantity != null ? Number(c.quantity) : null,
        rate: c.rate != null ? toMoney(c.rate) : null,
        amount: toMoney(c.amount),
        ruleReference: c.rule_reference,
        sourceRef: c.source_ref,
        trace: parseJson(c.trace, null),
        locked: !!c.locked,
    };
}
export async function getMySettlement(actor) {
    const emp = await requireEmployeeForActor(actor);
    const row = await db('hr_final_settlements')
        .where({ employee_id: emp.id, college_id: actor.collegeId })
        .orderBy('id', 'desc')
        .first();
    if (!row)
        return null;
    const docs = await db('hr_fnf_documents')
        .where({ settlement_id: row.id, release_status: 'RELEASED' })
        .select('id', 'doc_type', 'release_status', 'released_at');
    const clearances = await listClearances(Number(row.id));
    return {
        id: Number(row.id),
        caseNumber: row.case_number,
        status: row.status,
        lastWorkingDate: row.last_working_date,
        separationType: row.separation_type,
        clearances: clearances.map((c) => ({
            domain: c.domain,
            status: c.status,
            dueAmount: c.dueAmount,
        })),
        documents: docs.map((d) => ({
            id: Number(d.id),
            docType: d.doc_type,
            releasedAt: d.released_at,
        })),
        netAmount: ['SETTLED', 'CLOSED', 'FINANCE_POSTED', 'APPROVED'].includes(String(row.status))
            ? toMoney(row.net_amount)
            : null,
        settlementDirection: ['SETTLED', 'CLOSED', 'FINANCE_POSTED', 'APPROVED'].includes(String(row.status))
            ? row.settlement_direction
            : null,
    };
}
export async function assertEmployeeOwnsSettlement(actor, settlementId) {
    const emp = await resolveEmployeeForActor(actor);
    const row = await db('hr_final_settlements').where({ id: settlementId }).first();
    if (!row || Number(row.college_id) !== actor.collegeId)
        throw new AppError(404, 'Settlement not found');
    if (!emp || Number(emp.id) !== Number(row.employee_id)) {
        if (!hasHrPermission(actor, 'hr.fnf.view'))
            throw new AppError(404, 'Settlement not found');
        if (Number(row.college_id) !== actor.collegeId)
            throw new AppError(404, 'Settlement not found');
    }
    return row;
}
export async function getAudit(actor, settlementId) {
    assertHrPermission(actor, 'hr.fnf.view');
    await loadCase(actor, settlementId);
    const rows = await db('hr_audit_log')
        .where({ college_id: actor.collegeId, entity_id: settlementId })
        .whereIn('entity_type', ['hr_final_settlements', 'hr_fnf_clearances', 'hr_fnf_adjustments', 'hr_fnf_documents'])
        .orderBy('id', 'desc')
        .limit(200);
    return rows.map((r) => ({
        id: Number(r.id),
        action: r.action,
        entityType: r.entity_type,
        actorFacultyId: r.actor_faculty_id,
        reason: r.reason,
        createdAt: r.created_at,
    }));
}
