/**
 * Payroll reports — register, summaries, LOP, arrears, variance, finance posting summary.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
import { addMoney, toMoney } from './payrollMoney.js';
async function loadRun(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const run = await db('payroll_runs as r')
        .join('payroll_periods as p', 'p.id', 'r.period_id')
        .where({ 'r.id': payrollRunId, 'r.college_id': actor.collegeId })
        .select('r.*', 'p.label as period_label', 'p.start_date', 'p.end_date')
        .first();
    if (!run)
        throw new AppError(404, 'Payroll run not found');
    return run;
}
export async function payrollRegisterReport(actor, payrollRunId) {
    const run = await loadRun(actor, payrollRunId);
    const rows = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .select('pre.*', 'e.employee_number', 'e.display_name', 'd.name as department_name')
        .orderBy('e.display_name');
    return {
        report: 'PAYROLL_REGISTER',
        runId: Number(run.id),
        periodLabel: run.period_label,
        status: run.status,
        rows: rows.map((r) => ({
            employeeNumber: r.employee_number,
            employeeName: r.display_name,
            departmentName: r.department_name,
            workingDays: r.working_days != null ? Number(r.working_days) : null,
            payableDays: r.payable_days != null ? Number(r.payable_days) : null,
            lopDays: r.lop_days != null ? Number(r.lop_days) : null,
            gross: Number(r.gross_amount),
            deductions: Number(r.deduction_amount),
            net: Number(r.net_amount),
            status: r.calculation_status,
        })),
    };
}
export async function departmentSummaryReport(actor, payrollRunId) {
    await loadRun(actor, payrollRunId);
    const rows = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .whereNot('pre.calculation_status', 'SKIPPED')
        .select('d.id as department_id', 'd.name as department_name', 'pre.gross_amount', 'pre.deduction_amount', 'pre.net_amount', 'pre.lop_days');
    const map = new Map();
    for (const r of rows) {
        const key = String(r.department_id ?? 'none');
        const cur = map.get(key) ?? {
            departmentName: String(r.department_name ?? 'Unassigned'),
            employees: 0,
            gross: '0.00',
            deductions: '0.00',
            net: '0.00',
            lopDays: 0,
        };
        cur.employees += 1;
        cur.gross = addMoney(cur.gross, r.gross_amount);
        cur.deductions = addMoney(cur.deductions, r.deduction_amount);
        cur.net = addMoney(cur.net, r.net_amount);
        cur.lopDays += Number(r.lop_days ?? 0);
        map.set(key, cur);
    }
    return { report: 'DEPARTMENT_SUMMARY', runId: payrollRunId, rows: [...map.values()] };
}
export async function earningsDeductionSummary(actor, payrollRunId) {
    await loadRun(actor, payrollRunId);
    const comps = await db('payroll_run_components as prc')
        .join('payroll_run_employees as pre', 'pre.id', 'prc.payroll_run_employee_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .select('prc.component_code', 'prc.component_name', 'prc.component_type', 'prc.amount');
    const earnings = {};
    const deductions = {};
    for (const c of comps) {
        const code = String(c.component_code || 'UNKNOWN');
        const bucket = c.component_type === 'DEDUCTION' ? deductions : earnings;
        if (c.component_type === 'EMPLOYER_CONTRIBUTION')
            continue;
        const cur = bucket[code] ?? { code, name: String(c.component_name || code), total: '0.00' };
        cur.total = addMoney(cur.total, c.amount);
        bucket[code] = cur;
    }
    return {
        report: 'EARNINGS_DEDUCTION_SUMMARY',
        runId: payrollRunId,
        earnings: Object.values(earnings),
        deductions: Object.values(deductions),
    };
}
export async function lopSummaryReport(actor, payrollRunId) {
    await loadRun(actor, payrollRunId);
    const rows = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .where('pre.lop_days', '>', 0)
        .select('e.employee_number', 'e.display_name', 'pre.lop_days', 'pre.payable_days', 'pre.working_days', 'pre.net_amount')
        .orderBy('pre.lop_days', 'desc');
    return {
        report: 'LOP_SUMMARY',
        runId: payrollRunId,
        rows: rows.map((r) => ({
            employeeNumber: r.employee_number,
            employeeName: r.display_name,
            lopDays: Number(r.lop_days),
            payableDays: Number(r.payable_days),
            workingDays: Number(r.working_days),
            net: Number(r.net_amount),
        })),
    };
}
export async function arrearsReport(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.view');
    let q = db('payroll_adjustments as pa')
        .join('employees as e', 'e.id', 'pa.employee_id')
        .where({ 'pa.college_id': actor.collegeId })
        .whereIn('pa.adjustment_type', ['ARREAR', 'RECOVERY'])
        .select('pa.*', 'e.display_name', 'e.employee_number')
        .orderBy('pa.created_at', 'desc');
    if (payrollRunId)
        q = q.andWhere({ 'pa.payroll_run_id': payrollRunId });
    const rows = await q.limit(500);
    return {
        report: 'ARREARS',
        rows: rows.map((r) => ({
            id: Number(r.id),
            employeeNumber: r.employee_number,
            employeeName: r.display_name,
            type: r.adjustment_type,
            amount: Number(r.amount),
            reason: r.reason,
            sourcePeriodId: r.source_period_id ? Number(r.source_period_id) : null,
            sourcePayrollRunId: r.source_payroll_run_id ? Number(r.source_payroll_run_id) : null,
            payrollRunId: r.payroll_run_id ? Number(r.payroll_run_id) : null,
            status: r.status,
        })),
    };
}
export async function financePostingSummary(actor, payrollRunId) {
    const run = await loadRun(actor, payrollRunId);
    const posting = await db('finance_payroll_postings')
        .where({ payroll_run_id: payrollRunId, college_id: actor.collegeId })
        .first();
    if (!posting) {
        return {
            report: 'FINANCE_POSTING_SUMMARY',
            runId: payrollRunId,
            financePostingStatus: run.finance_posting_status,
            posting: null,
            lines: [],
        };
    }
    const lines = await db('finance_payroll_posting_lines as l')
        .join('finance_gl_accounts as a', 'a.id', 'l.account_id')
        .where({ 'l.posting_id': posting.id })
        .select('l.*', 'a.code as account_code', 'a.name as account_name');
    return {
        report: 'FINANCE_POSTING_SUMMARY',
        runId: payrollRunId,
        financePostingStatus: run.finance_posting_status,
        posting: {
            id: Number(posting.id),
            postingNumber: posting.posting_number,
            status: posting.status,
            debitTotal: Number(posting.debit_total),
            creditTotal: Number(posting.credit_total),
            postedAt: posting.posted_at,
        },
        lines: lines.map((l) => ({
            accountCode: l.account_code,
            accountName: l.account_name,
            side: l.side,
            amount: Number(l.amount),
            lineKey: l.line_key,
            description: l.description,
        })),
    };
}
export async function payrollVarianceReport(actor, payrollRunId) {
    const run = await loadRun(actor, payrollRunId);
    const prev = await db('payroll_runs as r')
        .join('payroll_periods as p', 'p.id', 'r.period_id')
        .where({ 'r.college_id': actor.collegeId })
        .where('p.end_date', '<', run.start_date)
        .whereIn('r.status', ['LOCKED', 'POSTED', 'CALCULATED', 'APPROVED'])
        .orderBy('p.end_date', 'desc')
        .select('r.*', 'p.label as period_label')
        .first();
    const current = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .select('pre.*', 'e.employee_number', 'e.display_name');
    const prevMap = new Map();
    if (prev) {
        const prevRows = await db('payroll_run_employees').where({ payroll_run_id: prev.id });
        for (const r of prevRows)
            prevMap.set(Number(r.employee_id), r);
    }
    const flags = [];
    const currentIds = new Set();
    for (const c of current) {
        const empId = Number(c.employee_id);
        currentIds.add(empId);
        const p = prevMap.get(empId);
        if (!p) {
            flags.push({
                type: 'NEW_EMPLOYEE',
                employeeNumber: c.employee_number,
                employeeName: c.display_name,
                net: Number(c.net_amount),
            });
            continue;
        }
        const netDelta = Number(toMoney(c.net_amount)) - Number(toMoney(p.net_amount));
        const grossDelta = Number(toMoney(c.gross_amount)) - Number(toMoney(p.gross_amount));
        if (Number(c.lop_days) >= 5) {
            flags.push({
                type: 'HIGH_LOP',
                employeeNumber: c.employee_number,
                employeeName: c.display_name,
                lopDays: Number(c.lop_days),
            });
        }
        if (Math.abs(netDelta) >= 5000) {
            flags.push({
                type: 'NET_CHANGE',
                employeeNumber: c.employee_number,
                employeeName: c.display_name,
                previousNet: Number(p.net_amount),
                currentNet: Number(c.net_amount),
                delta: netDelta,
            });
        }
        if (Math.abs(grossDelta) >= 5000) {
            flags.push({
                type: 'GROSS_CHANGE',
                employeeNumber: c.employee_number,
                employeeName: c.display_name,
                previousGross: Number(p.gross_amount),
                currentGross: Number(c.gross_amount),
                delta: grossDelta,
            });
        }
        const snap = typeof c.input_snapshot === 'string' ? JSON.parse(String(c.input_snapshot)) : c.input_snapshot;
        const prevSnap = typeof p.input_snapshot === 'string' ? JSON.parse(String(p.input_snapshot)) : p.input_snapshot;
        if (snap?.assignment?.structureId && prevSnap?.assignment?.structureId && snap.assignment.structureId !== prevSnap.assignment.structureId) {
            flags.push({
                type: 'SALARY_REVISION',
                employeeNumber: c.employee_number,
                employeeName: c.display_name,
                previousStructureId: prevSnap.assignment.structureId,
                currentStructureId: snap.assignment.structureId,
            });
        }
    }
    if (prev) {
        for (const [empId, p] of prevMap) {
            if (!currentIds.has(empId)) {
                const emp = await db('employees').where({ id: empId }).first();
                flags.push({
                    type: 'SEPARATED_EMPLOYEE',
                    employeeNumber: emp?.employee_number,
                    employeeName: emp?.display_name,
                    previousNet: Number(p.net_amount),
                });
            }
        }
    }
    const arrears = await db('payroll_adjustments')
        .where({ college_id: actor.collegeId, payroll_run_id: payrollRunId, adjustment_type: 'ARREAR' });
    for (const a of arrears) {
        if (Number(a.amount) >= 2000) {
            const emp = await db('employees').where({ id: a.employee_id }).first();
            flags.push({
                type: 'LARGE_ARREAR',
                employeeNumber: emp?.employee_number,
                employeeName: emp?.display_name,
                amount: Number(a.amount),
                reason: a.reason,
            });
        }
    }
    return {
        report: 'PAYROLL_VARIANCE',
        runId: payrollRunId,
        previousRunId: prev ? Number(prev.id) : null,
        previousPeriodLabel: prev?.period_label ?? null,
        flags,
    };
}
