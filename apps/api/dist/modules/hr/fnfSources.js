import { db } from '../../db/index.js';
import { toMoney, addMoney } from './payrollMoney.js';
import { asISODate } from '../timetable/time.js';
import { getEmployeeFinanceDueTotal } from '../finance/employeeDues.js';
import { getEmployeeHostelClearance, getEmployeeTransportClearance } from './lifecycleSeparation.js';
export function parseJson(raw, fallback) {
    if (raw == null)
        return fallback;
    if (typeof raw === 'object')
        return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    return fallback;
}
export async function getEmployeeLibraryObligations(employeeId, collegeId) {
    const empty = {
        applicable: false,
        memberId: null,
        activeLoans: 0,
        overdueLoans: 0,
        lostLoans: 0,
        fineAmount: toMoney(0),
        loanRefs: [],
        status: 'NOT_APPLICABLE',
    };
    if (!(await db.schema.hasTable('library_members')))
        return empty;
    const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
    if (!emp?.faculty_user_id)
        return empty;
    const member = await db('library_members')
        .where({ faculty_id: emp.faculty_user_id, college_id: collegeId })
        .first();
    if (!member)
        return empty;
    const loans = await db('library_loans')
        .where({ member_id: member.id, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'OVERDUE', 'LOST']);
    const fines = await db('library_fines')
        .where({ member_id: member.id, college_id: collegeId })
        .whereIn('status', ['DUE', 'PARTIALLY_PAID']);
    const fineAmount = fines.reduce((acc, f) => addMoney(acc, f.outstanding_amount ?? f.amount ?? 0), '0.00');
    const activeLoans = loans.filter((l) => l.status === 'ACTIVE').length;
    const overdueLoans = loans.filter((l) => l.status === 'OVERDUE').length;
    const lostLoans = loans.filter((l) => l.status === 'LOST').length;
    const due = loans.length > 0 || Number(fineAmount) > 0;
    return {
        applicable: true,
        memberId: Number(member.id),
        activeLoans,
        overdueLoans,
        lostLoans,
        fineAmount,
        loanRefs: loans.map((l) => ({ id: Number(l.id), status: String(l.status) })),
        status: due ? 'DUE' : 'CLEARED',
    };
}
export async function getLastLockedPayroll(employeeId, collegeId) {
    if (!(await db.schema.hasTable('payroll_run_employees')))
        return null;
    const row = await db('payroll_run_employees as pre')
        .join('payroll_runs as pr', 'pr.id', 'pre.payroll_run_id')
        .join('payroll_periods as pp', 'pp.id', 'pr.period_id')
        .where({ 'pre.employee_id': employeeId, 'pr.college_id': collegeId })
        .whereIn('pr.status', ['LOCKED', 'POSTED'])
        .orderBy('pp.end_date', 'desc')
        .select('pre.id as payroll_run_employee_id', 'pre.payroll_run_id', 'pre.net_amount', 'pre.gross_amount', 'pre.lop_days', 'pre.input_snapshot', 'pr.status as run_status', 'pr.period_id', 'pp.label as period_label', 'pp.start_date', 'pp.end_date')
        .first();
    if (!row)
        return null;
    return {
        payrollRunId: Number(row.payroll_run_id),
        payrollRunEmployeeId: Number(row.payroll_run_employee_id),
        periodId: Number(row.period_id),
        periodLabel: String(row.period_label),
        periodStart: asISODate(row.start_date),
        periodEnd: asISODate(row.end_date),
        netAmount: toMoney(row.net_amount),
        grossAmount: toMoney(row.gross_amount),
        lopDays: Number(row.lop_days ?? 0),
        runStatus: String(row.run_status),
        snapshot: parseJson(row.input_snapshot, null),
    };
}
export async function getSalaryBasisAsOf(employeeId, collegeId, asOf) {
    const assignment = await db('employee_salary_structures as ess')
        .join('salary_structures as ss', 'ss.id', 'ess.structure_id')
        .where({ 'ess.employee_id': employeeId, 'ss.college_id': collegeId })
        .andWhere('ess.effective_from', '<=', asOf)
        .andWhere((q) => q.whereNull('ess.effective_to').orWhere('ess.effective_to', '>=', asOf))
        .orderBy('ess.effective_from', 'desc')
        .select('ess.*', 'ss.code as structure_code', 'ss.name as structure_name', 'ss.college_id')
        .first();
    if (!assignment) {
        return {
            assignmentId: null,
            structureId: null,
            structureCode: null,
            basic: toMoney(0),
            gross: toMoney(0),
            components: [],
        };
    }
    const comps = await db('salary_structure_components as ssc')
        .join('salary_components as sc', 'sc.id', 'ssc.component_id')
        .where({ 'ssc.structure_id': assignment.structure_id })
        .select('ssc.*', 'sc.code', 'sc.name', 'sc.component_type');
    const bases = new Map();
    const fixed = comps.filter((c) => ['FIXED', 'MANUAL', 'STATUTORY'].includes(String(c.calculation_type)));
    const pct = comps.filter((c) => ['PERCENTAGE', 'FORMULA'].includes(String(c.calculation_type)));
    for (const c of fixed)
        bases.set(Number(c.component_id), Number(c.amount ?? 0));
    for (const c of pct) {
        const ofId = c.percentage_of_component_id ? Number(c.percentage_of_component_id) : null;
        let base = ofId && bases.has(ofId) ? bases.get(ofId) : 0;
        if (!base) {
            const basic = comps.find((x) => x.code === 'BASIC');
            if (basic && bases.has(Number(basic.component_id)))
                base = bases.get(Number(basic.component_id));
        }
        const pctVal = c.percentage != null ? Number(c.percentage) : Number(c.amount ?? 0);
        bases.set(Number(c.component_id), Number(toMoney((base * pctVal) / 100)));
    }
    let basic = '0.00';
    let gross = '0.00';
    const mapped = comps.map((c) => {
        const amt = toMoney(bases.get(Number(c.component_id)) ?? 0);
        if (c.code === 'BASIC')
            basic = amt;
        if (c.component_type === 'EARNING' || c.component_type === 'REIMBURSEMENT') {
            gross = addMoney(gross, amt);
        }
        return { code: String(c.code), type: String(c.component_type), amount: amt };
    });
    if (Number(basic) === 0 && mapped.length) {
        const firstEarn = mapped.find((m) => m.type === 'EARNING');
        if (firstEarn)
            basic = firstEarn.amount;
    }
    return {
        assignmentId: Number(assignment.id),
        structureId: Number(assignment.structure_id),
        structureCode: String(assignment.structure_code),
        basic,
        gross,
        components: mapped,
    };
}
export async function getLeaveBalanceSnapshot(employeeId, collegeId, year) {
    if (!(await db.schema.hasTable('employee_leave_balances')))
        return [];
    const rows = await db('employee_leave_balances as b')
        .join('hr_leave_types as t', 't.id', 'b.leave_type_id')
        .where({ 'b.employee_id': employeeId, 'b.college_id': collegeId, 'b.year': year })
        .select('b.*', 't.code as leave_type_code', 't.name as leave_type_name', 't.is_paid');
    const policies = await db('hr_leave_policies')
        .where({ college_id: collegeId, is_active: true })
        .select('leave_type_id', 'encashment_eligible', 'negative_balance_allowed');
    const polByType = new Map(policies.map((p) => [Number(p.leave_type_id), p]));
    return rows.map((r) => {
        const pol = polByType.get(Number(r.leave_type_id));
        return {
            leaveTypeId: Number(r.leave_type_id),
            leaveTypeCode: String(r.leave_type_code),
            leaveTypeName: String(r.leave_type_name),
            year,
            availableBalance: Number(r.available_balance ?? 0),
            isPaid: !!r.is_paid,
            encashmentEligible: pol ? !!pol.encashment_eligible : false,
            negativeAllowed: pol ? !!pol.negative_balance_allowed : false,
        };
    });
}
export async function getHostelClearanceSnapshot(employeeId, collegeId) {
    const src = await getEmployeeHostelClearance(employeeId, collegeId);
    return {
        domain: 'HOSTEL',
        status: src.status === 'PENDING' ? 'PENDING' : src.status === 'CLEAR' ? 'CLEARED' : 'NOT_APPLICABLE',
        source: 'hostel_warden_assignments',
    };
}
export async function getTransportClearanceSnapshot(employeeId, collegeId) {
    const src = await getEmployeeTransportClearance(employeeId, collegeId);
    return {
        domain: 'TRANSPORT',
        status: src.status === 'PENDING' ? 'PENDING' : src.status === 'CLEAR' ? 'CLEARED' : 'NOT_APPLICABLE',
        source: 'transport_staff_assignments',
    };
}
export async function getFinanceDuesSnapshot(employeeId, collegeId) {
    const { dues, total } = await getEmployeeFinanceDueTotal(collegeId, employeeId);
    return {
        dues,
        total,
        status: dues.length === 0 ? 'NOT_APPLICABLE' : Number(total) > 0 ? 'DUE' : 'CLEARED',
    };
}
export function daysBetween(from, to) {
    const a = new Date(`${from}T00:00:00`);
    const b = new Date(`${to}T00:00:00`);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}
