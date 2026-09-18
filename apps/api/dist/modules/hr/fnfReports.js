import { db } from '../../db/index.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { toMoney } from './payrollMoney.js';
function canSeeMoney(actor) {
    return (hasHrPermission(actor, 'hr.fnf.approve') ||
        hasHrPermission(actor, 'hr.fnf.calculate') ||
        hasHrPermission(actor, 'hr.payroll.view'));
}
export async function settlementRegister(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId })
        .select('s.*', 'e.display_name', 'e.employee_number')
        .orderBy('s.updated_at', 'desc');
    const money = canSeeMoney(actor);
    return rows.map((r) => ({
        id: Number(r.id),
        caseNumber: r.case_number,
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
        status: r.status,
        lastWorkingDate: r.last_working_date,
        separationType: r.separation_type,
        financePostingStatus: r.finance_posting_status,
        ...(money
            ? {
                grossPayable: toMoney(r.gross_payable),
                totalRecoveries: toMoney(r.total_recoveries),
                netAmount: toMoney(r.net_amount),
                direction: r.settlement_direction,
            }
            : {}),
    }));
}
export async function pendingClearanceReport(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_fnf_clearances as c')
        .join('hr_final_settlements as s', 's.id', 'c.settlement_id')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 'c.college_id': actor.collegeId })
        .whereIn('c.status', ['PENDING', 'DUE'])
        .whereNotIn('s.status', ['CANCELLED', 'CLOSED'])
        .select('c.domain', 'c.status', 'c.due_amount', 'c.blocking', 's.case_number', 's.id as settlement_id', 'e.display_name', 'e.employee_number');
    return rows.map((r) => ({
        settlementId: Number(r.settlement_id),
        caseNumber: r.case_number,
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
        domain: r.domain,
        status: r.status,
        blocking: !!r.blocking,
        dueAmount: canSeeMoney(actor) ? toMoney(r.due_amount) : null,
    }));
}
export async function outstandingRecoveries(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    if (!canSeeMoney(actor))
        return [];
    const rows = await db('hr_fnf_components as c')
        .join('hr_final_settlements as s', 's.id', 'c.settlement_id')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 'c.college_id': actor.collegeId, 'c.side': 'RECOVERY' })
        .whereNotIn('s.status', ['CANCELLED'])
        .select('c.*', 's.case_number', 's.status as case_status', 'e.display_name', 'e.employee_number');
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        code: r.code,
        amount: toMoney(r.amount),
        source: r.source,
        caseStatus: r.case_status,
    }));
}
export async function employeePayables(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    if (!canSeeMoney(actor))
        return [];
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId, 's.settlement_direction': 'PAYABLE_TO_EMPLOYEE' })
        .select('s.case_number', 's.net_amount', 's.status', 'e.display_name', 'e.employee_number');
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
        netAmount: toMoney(r.net_amount),
        status: r.status,
    }));
}
export async function employeeReceivables(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    if (!canSeeMoney(actor))
        return [];
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId, 's.settlement_direction': 'RECEIVABLE_FROM_EMPLOYEE' })
        .select('s.case_number', 's.net_amount', 's.status', 'e.display_name', 'e.employee_number');
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
        netAmount: toMoney(Math.abs(Number(r.net_amount))),
        status: r.status,
    }));
}
export async function leaveEncashmentSummary(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    if (!canSeeMoney(actor))
        return [];
    const rows = await db('hr_fnf_components as c')
        .join('hr_final_settlements as s', 's.id', 'c.settlement_id')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 'c.college_id': actor.collegeId, 'c.code': 'LEAVE_ENCASHMENT' });
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        amount: toMoney(r.amount),
        quantity: r.quantity,
    }));
}
export async function noticePaySummary(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    if (!canSeeMoney(actor))
        return [];
    const rows = await db('hr_fnf_components as c')
        .join('hr_final_settlements as s', 's.id', 'c.settlement_id')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 'c.college_id': actor.collegeId, 'c.code': 'NOTICE_PAY' });
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        amount: toMoney(r.amount),
        quantity: r.quantity,
    }));
}
export async function financePostingStatusReport(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId })
        .select('s.case_number', 's.status', 's.finance_posting_status', 's.finance_posting_key', 'e.display_name');
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        status: r.status,
        financePostingStatus: r.finance_posting_status,
        postingKey: r.finance_posting_key,
    }));
}
export async function closedSeparationReport(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId })
        .whereIn('s.status', ['SETTLED', 'CLOSED'])
        .select('s.*', 'e.display_name', 'e.employee_number');
    return rows.map((r) => ({
        caseNumber: r.case_number,
        employeeName: r.display_name,
        employeeNumber: r.employee_number,
        lastWorkingDate: r.last_working_date,
        status: r.status,
        closedAt: r.closed_at,
    }));
}
export async function settlementAging(actor) {
    assertHrPermission(actor, 'hr.fnf.view');
    const rows = await db('hr_final_settlements as s')
        .join('employees as e', 'e.id', 's.employee_id')
        .where({ 's.college_id': actor.collegeId })
        .whereNotIn('s.status', ['CLOSED', 'CANCELLED']);
    const now = Date.now();
    return rows.map((r) => {
        const created = new Date(String(r.created_at)).getTime();
        const days = Number.isFinite(created) ? Math.floor((now - created) / 86400000) : 0;
        return {
            caseNumber: r.case_number,
            employeeName: r.display_name,
            status: r.status,
            ageDays: days,
        };
    });
}
