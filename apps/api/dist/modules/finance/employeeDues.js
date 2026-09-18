import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertFinancePermission } from './access.js';
import { toMoney } from './money.js';
import { recordFinanceAudit } from './audit.js';
export async function registerEmployeeDue(actor, input) {
    assertFinancePermission(actor, 'finance.payment.record');
    const emp = await db('employees').where({ id: input.employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const amount = toMoney(input.amount);
    const [id] = await db('employee_finance_dues').insert({
        college_id: actor.collegeId,
        employee_id: input.employeeId,
        due_type: input.dueType,
        source_ref: input.sourceRef ?? null,
        amount,
        outstanding: amount,
        status: 'OPEN',
        remarks: input.remarks ?? null,
        created_by: actor.facultyUserId,
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EMPLOYEE_DUE_REGISTERED',
        entityType: 'employee_finance_dues',
        entityId: Number(id),
        afterState: { employeeId: input.employeeId, dueType: input.dueType, amount },
    });
    return { id: Number(id), amount, outstanding: amount, status: 'OPEN' };
}
export async function listOpenEmployeeDues(collegeId, employeeId) {
    if (!(await db.schema.hasTable('employee_finance_dues')))
        return [];
    const rows = await db('employee_finance_dues')
        .where({ college_id: collegeId, employee_id: employeeId, status: 'OPEN' })
        .orderBy('id', 'asc');
    return rows.map((r) => ({
        id: Number(r.id),
        dueType: String(r.due_type),
        sourceRef: r.source_ref ? String(r.source_ref) : null,
        amount: toMoney(r.amount),
        outstanding: toMoney(r.outstanding),
        status: String(r.status),
        settledByPayrollRunId: r.settled_by_payroll_run_id ? Number(r.settled_by_payroll_run_id) : null,
        remarks: r.remarks ? String(r.remarks) : null,
    }));
}
export async function getEmployeeFinanceDueTotal(collegeId, employeeId) {
    const dues = await listOpenEmployeeDues(collegeId, employeeId);
    const total = dues.reduce((acc, d) => acc + Number(d.outstanding), 0);
    return { dues, total: toMoney(total) };
}
export async function markDuesSettledBySettlement(trx, collegeId, employeeId, settlementId, dueIds) {
    if (!dueIds.length)
        return;
    await trx('employee_finance_dues')
        .where({ college_id: collegeId, employee_id: employeeId })
        .whereIn('id', dueIds)
        .where({ status: 'OPEN' })
        .update({
        status: 'SETTLED',
        outstanding: 0,
        settled_by_settlement_id: settlementId,
    });
}
