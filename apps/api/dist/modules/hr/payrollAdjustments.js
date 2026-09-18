/**
 * Controlled payroll adjustments / arrears / recoveries.
 * Immutable once attached to a LOCKED payroll run.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { assertPayrollRunMutable } from './payroll.js';
const ADJUSTMENT_TYPES = ['EARNING_ADJUSTMENT', 'DEDUCTION_ADJUSTMENT', 'ARREAR', 'RECOVERY'];
export async function listAdjustments(actor, filters) {
    assertHrPermission(actor, 'hr.payroll.view');
    let q = db('payroll_adjustments as pa')
        .join('employees as e', 'e.id', 'pa.employee_id')
        .where({ 'pa.college_id': actor.collegeId })
        .select('pa.*', 'e.display_name', 'e.employee_number')
        .orderBy('pa.created_at', 'desc');
    if (filters?.employeeId)
        q = q.andWhere({ 'pa.employee_id': filters.employeeId });
    if (filters?.payrollRunId)
        q = q.andWhere({ 'pa.payroll_run_id': filters.payrollRunId });
    const rows = await q.limit(200);
    return rows.map(serializeAdj);
}
function serializeAdj(r) {
    return {
        id: Number(r.id),
        employeeId: Number(r.employee_id),
        employeeNumber: r.employee_number,
        employeeName: r.display_name,
        payrollRunId: r.payroll_run_id ? Number(r.payroll_run_id) : null,
        componentId: r.component_id ? Number(r.component_id) : null,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        adjustmentType: r.adjustment_type || 'EARNING_ADJUSTMENT',
        sourcePeriodId: r.source_period_id ? Number(r.source_period_id) : null,
        sourceComponentId: r.source_component_id ? Number(r.source_component_id) : null,
        sourcePayrollRunId: r.source_payroll_run_id ? Number(r.source_payroll_run_id) : null,
        createdBy: r.created_by ? Number(r.created_by) : null,
        approvedBy: r.approved_by ? Number(r.approved_by) : null,
        createdAt: r.created_at,
    };
}
export async function createAdjustment(actor, input) {
    assertHrPermission(actor, 'hr.payroll.manage');
    if (!ADJUSTMENT_TYPES.includes(input.adjustmentType)) {
        throw new AppError(400, 'Invalid adjustment type');
    }
    const emp = await db('employees').where({ id: input.employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    if (!input.reason || input.reason.trim().length < 3)
        throw new AppError(400, 'Reason required');
    if (!Number.isFinite(input.amount) || input.amount === 0)
        throw new AppError(400, 'Amount required');
    if (input.payrollRunId) {
        const run = await db('payroll_runs').where({ id: input.payrollRunId, college_id: actor.collegeId }).first();
        if (!run)
            throw new AppError(404, 'Payroll run not found');
        await assertPayrollRunMutable(run, { action: 'add adjustment' });
    }
    const auto = input.autoApprove !== false;
    const [id] = await db('payroll_adjustments').insert({
        college_id: actor.collegeId,
        employee_id: input.employeeId,
        payroll_run_id: input.payrollRunId ?? null,
        component_id: input.componentId ?? null,
        amount: Math.abs(input.amount),
        reason: input.reason.trim(),
        status: auto ? 'APPROVED' : 'PENDING',
        adjustment_type: input.adjustmentType,
        source_period_id: input.sourcePeriodId ?? null,
        source_component_id: input.sourceComponentId ?? null,
        source_payroll_run_id: input.sourcePayrollRunId ?? null,
        created_by: actor.facultyUserId,
        approved_by: auto ? actor.facultyUserId : null,
        approved_at: auto ? db.fn.now() : null,
    });
    await recordHrAudit({
        actor,
        action: 'PAYROLL_ADJUSTMENT_CREATED',
        entityType: 'payroll_adjustments',
        entityId: Number(id),
        reason: input.reason,
        after: input,
    });
    const rows = await listAdjustments(actor, { employeeId: input.employeeId });
    return rows.find((r) => r.id === Number(id));
}
export async function approveAdjustment(actor, adjustmentId) {
    assertHrPermission(actor, 'hr.payroll.approve');
    const row = await db('payroll_adjustments').where({ id: adjustmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Adjustment not found');
    if (row.payroll_run_id) {
        const run = await db('payroll_runs').where({ id: row.payroll_run_id }).first();
        if (run)
            await assertPayrollRunMutable(run, { action: 'approve adjustment' });
    }
    if (row.status === 'APPROVED')
        return serializeAdj({ ...row });
    await db('payroll_adjustments').where({ id: adjustmentId }).update({
        status: 'APPROVED',
        approved_by: actor.facultyUserId,
        approved_at: db.fn.now(),
    });
    await recordHrAudit({
        actor,
        action: 'PAYROLL_ADJUSTMENT_APPROVED',
        entityType: 'payroll_adjustments',
        entityId: adjustmentId,
    });
    const updated = await db('payroll_adjustments as pa')
        .join('employees as e', 'e.id', 'pa.employee_id')
        .where({ 'pa.id': adjustmentId })
        .select('pa.*', 'e.display_name', 'e.employee_number')
        .first();
    return serializeAdj(updated);
}
export async function deleteAdjustment(actor, adjustmentId) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const row = await db('payroll_adjustments').where({ id: adjustmentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Adjustment not found');
    if (row.payroll_run_id) {
        const run = await db('payroll_runs').where({ id: row.payroll_run_id }).first();
        if (run)
            await assertPayrollRunMutable(run, { action: 'delete adjustment' });
    }
    await db('payroll_adjustments').where({ id: adjustmentId }).delete();
    await recordHrAudit({
        actor,
        action: 'PAYROLL_ADJUSTMENT_DELETED',
        entityType: 'payroll_adjustments',
        entityId: adjustmentId,
    });
    return { deleted: true };
}
