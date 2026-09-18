/**
 * Payroll orchestration — runs, calculate, approve, lock, immutability, payslips, reports handoff.
 * Calculation math lives in payrollCalc.ts. Finance posting lives in finance/payrollPosting.ts.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, hasHrPermission, requireEmployeeForActor } from './access.js';
import { nextPayrollRunNumber, nextPayslipNumber } from './numbers.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { getPayrollAttendanceHandoff } from './attendancePayrollHandoff.js';
import { PAYROLL_SNAPSHOT_VERSION, calculateEmployeePayroll, } from './payrollCalc.js';
import { addMoney, toMoney } from './payrollMoney.js';
import { asISODate } from '../timetable/time.js';
const MUTABLE_STATUSES = new Set(['DRAFT', 'CALCULATED', 'UNDER_REVIEW']);
const LOCKED_LIKE = new Set(['LOCKED', 'POSTED']);
export async function payrollSchemaReady() {
    return ((await db.schema.hasTable('payroll_runs')) &&
        (await db.schema.hasColumn('payroll_run_employees', 'input_snapshot')));
}
/** Hard write guard — every mutation path must resolve run state. */
export async function assertPayrollRunMutable(run, opts = {}) {
    const status = String(run.status);
    if (LOCKED_LIKE.has(status)) {
        throw new AppError(400, `Payroll run is ${status} and immutable` + (opts.action ? ` (${opts.action})` : ''));
    }
    if (status === 'APPROVED' && !opts.allowApproved) {
        throw new AppError(400, 'Payroll run is APPROVED — reopen required before mutation');
    }
    if (status === 'CANCELLED') {
        throw new AppError(400, 'Payroll run is cancelled');
    }
    if (String(run.finance_posting_status) === 'POSTED' || String(run.finance_posting_status) === 'POSTING') {
        throw new AppError(400, 'Payroll has a Finance posting — reverse Finance before mutating');
    }
}
async function loadRunForActor(actor, payrollRunId) {
    const run = await db('payroll_runs').where({ id: payrollRunId, college_id: actor.collegeId }).first();
    if (!run)
        throw new AppError(404, 'Payroll run not found');
    return run;
}
function periodYearMonth(startDate) {
    const iso = asISODate(startDate) || String(startDate).slice(0, 10);
    const [y, m] = iso.split('-').map(Number);
    return { year: y, month: m };
}
export async function listPayslips(actor) {
    const emp = await requireEmployeeForActor(actor);
    const rows = await db('payslips as p')
        .join('payroll_runs as r', 'r.id', 'p.payroll_run_id')
        .join('payroll_periods as pp', 'pp.id', 'r.period_id')
        .where({ 'p.employee_id': emp.id })
        .whereIn('r.status', ['LOCKED', 'POSTED'])
        .select('p.*', 'pp.label as period_label', 'r.status as run_status')
        .orderBy('p.created_at', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        payslipNumber: r.payslip_number,
        periodLabel: r.period_label,
        grossAmount: Number(r.gross_amount),
        deductionAmount: Number(r.deduction_amount),
        netAmount: Number(r.net_amount),
        breakdown: typeof r.breakdown === 'string' ? JSON.parse(String(r.breakdown)) : r.breakdown,
        createdAt: r.created_at,
    }));
}
export async function getPayslip(actor, payslipId) {
    const emp = await requireEmployeeForActor(actor);
    const row = await db('payslips as p')
        .join('payroll_runs as r', 'r.id', 'p.payroll_run_id')
        .where({ 'p.id': payslipId, 'p.employee_id': emp.id })
        .whereIn('r.status', ['LOCKED', 'POSTED'])
        .select('p.*')
        .first();
    if (!row)
        throw new AppError(404, 'Payslip not found');
    return {
        id: Number(row.id),
        payslipNumber: row.payslip_number,
        grossAmount: Number(row.gross_amount),
        deductionAmount: Number(row.deduction_amount),
        netAmount: Number(row.net_amount),
        breakdown: typeof row.breakdown === 'string' ? JSON.parse(String(row.breakdown)) : row.breakdown,
        employeeSnapshot: typeof row.employee_snapshot === 'string' ? JSON.parse(String(row.employee_snapshot)) : row.employee_snapshot,
    };
}
/** Admin payslip read — requires payroll view; college scoped. */
export async function getPayslipAdmin(actor, payslipId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const row = await db('payslips').where({ id: payslipId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Payslip not found');
    return {
        id: Number(row.id),
        employeeId: Number(row.employee_id),
        payslipNumber: row.payslip_number,
        grossAmount: Number(row.gross_amount),
        deductionAmount: Number(row.deduction_amount),
        netAmount: Number(row.net_amount),
        breakdown: typeof row.breakdown === 'string' ? JSON.parse(String(row.breakdown)) : row.breakdown,
        employeeSnapshot: typeof row.employee_snapshot === 'string' ? JSON.parse(String(row.employee_snapshot)) : row.employee_snapshot,
    };
}
export async function listPayrollRuns(actor) {
    assertHrPermission(actor, 'hr.payroll.view');
    const rows = await db('payroll_runs as r')
        .join('payroll_periods as p', 'p.id', 'r.period_id')
        .where({ 'r.college_id': actor.collegeId })
        .select('r.*', 'p.label as period_label', 'p.start_date', 'p.end_date')
        .orderBy('r.created_at', 'desc');
    return rows.map(serializeRun);
}
function serializeRun(r) {
    return {
        id: Number(r.id),
        runNumber: r.run_number,
        status: r.status,
        periodId: Number(r.period_id),
        periodLabel: r.period_label,
        startDate: r.start_date,
        endDate: r.end_date,
        employeeCount: Number(r.employee_count ?? 0),
        validationStatus: r.validation_status ?? 'PENDING',
        validationErrorCount: Number(r.validation_error_count ?? 0),
        grossTotal: Number(r.gross_total ?? 0),
        deductionTotal: Number(r.deduction_total ?? 0),
        netTotal: Number(r.net_total ?? 0),
        lopDaysTotal: Number(r.lop_days_total ?? 0),
        financePostingStatus: r.finance_posting_status ?? 'NOT_POSTED',
        financePostingId: r.finance_posting_id ? Number(r.finance_posting_id) : null,
        lockedAt: r.locked_at,
        approvedAt: r.approved_at,
        postedAt: r.posted_at,
    };
}
export async function getPayrollRun(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const run = await db('payroll_runs as r')
        .join('payroll_periods as p', 'p.id', 'r.period_id')
        .where({ 'r.id': payrollRunId, 'r.college_id': actor.collegeId })
        .select('r.*', 'p.label as period_label', 'p.start_date', 'p.end_date')
        .first();
    if (!run)
        throw new AppError(404, 'Payroll run not found');
    const employees = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where({ 'pre.payroll_run_id': payrollRunId })
        .select('pre.*', 'e.employee_number', 'e.display_name', 'd.name as department_name')
        .orderBy('e.display_name');
    return {
        ...serializeRun(run),
        validationSummary: run.validation_summary,
        employees: employees.map((e) => ({
            id: Number(e.id),
            employeeId: Number(e.employee_id),
            employeeNumber: e.employee_number,
            employeeName: e.display_name,
            departmentName: e.department_name,
            grossAmount: Number(e.gross_amount),
            deductionAmount: Number(e.deduction_amount),
            netAmount: Number(e.net_amount),
            workingDays: e.working_days != null ? Number(e.working_days) : null,
            payableDays: e.payable_days != null ? Number(e.payable_days) : null,
            lopDays: e.lop_days != null ? Number(e.lop_days) : null,
            calculationStatus: e.calculation_status ?? e.status,
            validationErrors: typeof e.validation_errors === 'string'
                ? JSON.parse(String(e.validation_errors))
                : e.validation_errors,
        })),
    };
}
export async function getPayrollRunEmployee(actor, payrollRunId, employeeId) {
    assertHrPermission(actor, 'hr.payroll.view');
    await loadRunForActor(actor, payrollRunId);
    const row = await db('payroll_run_employees as pre')
        .join('employees as e', 'e.id', 'pre.employee_id')
        .where({ 'pre.payroll_run_id': payrollRunId, 'pre.employee_id': employeeId })
        .select('pre.*', 'e.employee_number', 'e.display_name')
        .first();
    if (!row)
        throw new AppError(404, 'Employee payroll result not found');
    const components = await db('payroll_run_components').where({ payroll_run_employee_id: row.id });
    const snapshot = typeof row.input_snapshot === 'string' ? JSON.parse(String(row.input_snapshot)) : row.input_snapshot;
    const trace = typeof row.calculation_trace === 'string' ? JSON.parse(String(row.calculation_trace)) : row.calculation_trace;
    return {
        id: Number(row.id),
        employeeId: Number(row.employee_id),
        employeeNumber: row.employee_number,
        employeeName: row.display_name,
        grossAmount: Number(row.gross_amount),
        deductionAmount: Number(row.deduction_amount),
        netAmount: Number(row.net_amount),
        workingDays: row.working_days != null ? Number(row.working_days) : null,
        payableDays: row.payable_days != null ? Number(row.payable_days) : null,
        lopDays: row.lop_days != null ? Number(row.lop_days) : null,
        structureId: row.structure_id ? Number(row.structure_id) : null,
        assignmentId: row.assignment_id ? Number(row.assignment_id) : null,
        snapshotVersion: row.snapshot_version,
        inputSnapshot: snapshot,
        calculationTrace: trace,
        calculationStatus: row.calculation_status,
        validationErrors: typeof row.validation_errors === 'string'
            ? JSON.parse(String(row.validation_errors))
            : row.validation_errors,
        components: components.map((c) => ({
            componentId: Number(c.component_id),
            code: c.component_code,
            name: c.component_name,
            type: c.component_type,
            calculationType: c.calculation_type,
            lopAffected: c.lop_affected,
            isProratable: c.is_proratable,
            baseAmount: c.base_amount != null ? Number(c.base_amount) : null,
            amount: Number(c.amount),
            calcDetail: typeof c.calc_detail === 'string' ? JSON.parse(String(c.calc_detail)) : c.calc_detail,
        })),
    };
}
export async function createPayrollRun(actor, periodId) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const period = await db('payroll_periods').where({ id: periodId, college_id: actor.collegeId }).first();
    if (!period)
        throw new AppError(404, 'Payroll period not found');
    try {
        const id = await db.transaction(async (trx) => {
            const existing = await trx('payroll_runs')
                .where({ college_id: actor.collegeId, period_id: periodId })
                .whereNot('status', 'CANCELLED')
                .first();
            if (existing)
                throw new AppError(409, 'Payroll run already exists for this period');
            const runNumber = await nextPayrollRunNumber(trx, actor.collegeId);
            const [insertedId] = await trx('payroll_runs').insert({
                college_id: actor.collegeId,
                period_id: periodId,
                run_number: runNumber,
                status: 'DRAFT',
                finance_posting_status: 'NOT_POSTED',
                validation_status: 'PENDING',
            });
            return Number(insertedId);
        });
        await recordHrAudit({ actor, action: 'PAYROLL_RUN_CREATED', entityType: 'payroll_runs', entityId: id });
        return { id, status: 'DRAFT' };
    }
    catch (err) {
        const e = err;
        if (e?.code === 'ER_DUP_ENTRY' || /Duplicate/i.test(String(e?.message))) {
            throw new AppError(409, 'Payroll run already exists for this period');
        }
        throw err;
    }
}
async function resolveAssignmentAsOf(trx, employeeId, asOfDate) {
    return ((await trx('employee_salary_structures')
        .where({ employee_id: employeeId })
        .where('effective_from', '<=', asOfDate)
        .andWhere((qb) => {
        qb.whereNull('effective_to').orWhere('effective_to', '>=', asOfDate);
    })
        .orderBy('effective_from', 'desc')
        .first()) ?? null);
}
async function buildEmployeeSnapshot(trx, actor, emp, period, handoff, handoffEmp) {
    const errors = [];
    const asOf = asISODate(period.end_date) || String(period.end_date).slice(0, 10);
    const { year, month } = periodYearMonth(period.start_date);
    const assignment = await resolveAssignmentAsOf(trx, Number(emp.id), asOf);
    if (!assignment)
        errors.push('Missing salary structure assignment');
    let structure = null;
    let components = [];
    if (assignment) {
        structure = await trx('salary_structures')
            .where({ id: assignment.structure_id, college_id: actor.collegeId })
            .first();
        if (!structure)
            errors.push('Salary structure not found');
        else {
            const rows = await trx('salary_structure_components as ssc')
                .join('salary_components as sc', 'sc.id', 'ssc.component_id')
                .where({ 'ssc.structure_id': structure.id })
                .select('ssc.*', 'sc.code', 'sc.name', 'sc.component_type', 'sc.is_statutory', 'sc.lop_affected', 'sc.is_proratable');
            components = rows.map((r) => ({
                componentId: Number(r.component_id),
                code: String(r.code),
                name: String(r.name),
                componentType: String(r.component_type),
                calculationType: String(r.calculation_type || 'FIXED'),
                amount: r.amount != null ? Number(r.amount) : null,
                percentage: r.percentage != null ? Number(r.percentage) : null,
                percentageOfComponentId: r.percentage_of_component_id ? Number(r.percentage_of_component_id) : null,
                lopAffected: r.lop_affected == null ? true : Boolean(r.lop_affected),
                isProratable: r.is_proratable == null ? true : Boolean(r.is_proratable),
                isStatutory: Boolean(r.is_statutory),
            }));
            if (components.length === 0)
                errors.push('Invalid component configuration — empty structure');
        }
    }
    const overlaps = await trx('employee_salary_structures')
        .where({ employee_id: emp.id })
        .where('effective_from', '<=', asOf)
        .andWhere((qb) => {
        qb.whereNull('effective_to').orWhere('effective_to', '>=', asOf);
    });
    if (overlaps.length > 1)
        errors.push('Overlapping salary assignments');
    const doj = asISODate(emp.date_of_joining);
    const lwd = asISODate(emp.last_working_date);
    const periodStart = asISODate(period.start_date);
    const periodEnd = asISODate(period.end_date);
    if (doj && doj > periodEnd) {
        errors.push('Future joiner — not eligible for this payroll period');
    }
    if (lwd && lwd < periodStart) {
        errors.push('Separated before period start');
    }
    if (!handoffEmp) {
        errors.push('Missing attendance handoff for employee');
    }
    const adjRows = await trx('payroll_adjustments')
        .where({
        college_id: actor.collegeId,
        employee_id: emp.id,
        status: 'APPROVED',
    })
        .where((qb) => {
        qb.whereNull('payroll_run_id').orWhere('payroll_run_id', 0);
    });
    const dept = emp.department_id
        ? await trx('departments').where({ id: emp.department_id }).first()
        : null;
    const des = emp.designation_id
        ? await trx('hr_designations').where({ id: emp.designation_id }).first()
        : null;
    const snapshot = {
        version: PAYROLL_SNAPSHOT_VERSION,
        calculatedAt: new Date().toISOString(),
        employee: {
            employeeId: Number(emp.id),
            employeeNumber: emp.employee_number ? String(emp.employee_number) : null,
            displayName: emp.display_name ? String(emp.display_name) : null,
            employmentStatus: String(emp.employment_status),
            departmentId: emp.department_id ? Number(emp.department_id) : null,
            departmentName: dept?.name ? String(dept.name) : null,
            designationId: emp.designation_id ? Number(emp.designation_id) : null,
            designationName: des?.name ? String(des.name) : null,
            dateOfJoining: doj,
            lastWorkingDate: lwd,
        },
        assignment: {
            assignmentId: assignment ? Number(assignment.id) : 0,
            structureId: structure ? Number(structure.id) : 0,
            structureCode: structure ? String(structure.code) : '',
            structureName: structure ? String(structure.name) : '',
            effectiveFrom: assignment ? String(asISODate(assignment.effective_from) || assignment.effective_from) : '',
            effectiveTo: assignment?.effective_to
                ? String(asISODate(assignment.effective_to) || assignment.effective_to)
                : null,
        },
        components,
        attendance: {
            closureId: handoff.closureId,
            calculationVersion: handoff.calculationVersion,
            year,
            month,
            workingDays: handoffEmp?.workingDays ?? 0,
            payableDays: handoffEmp?.payableDays ?? 0,
            lopDays: handoffEmp?.lopDays ?? 0,
            employmentApplicableDays: handoffEmp?.employmentApplicableDays ?? 0,
        },
        adjustments: adjRows.map((a) => ({
            id: Number(a.id),
            adjustmentType: String(a.adjustment_type || 'EARNING_ADJUSTMENT'),
            componentId: a.component_id ? Number(a.component_id) : null,
            amount: Number(a.amount),
            reason: String(a.reason),
            sourcePeriodId: a.source_period_id ? Number(a.source_period_id) : null,
            sourceComponentId: a.source_component_id ? Number(a.source_component_id) : null,
        })),
    };
    return { snapshot, errors };
}
export async function calculatePayrollRun(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.calculate');
    const run = await loadRunForActor(actor, payrollRunId);
    await assertPayrollRunMutable(run, { action: 'calculate' });
    const period = await db('payroll_periods').where({ id: run.period_id, college_id: actor.collegeId }).first();
    if (!period)
        throw new AppError(404, 'Payroll period not found');
    const { year, month } = periodYearMonth(period.start_date);
    let handoff;
    try {
        handoff = await getPayrollAttendanceHandoff(actor.collegeId, year, month);
    }
    catch (err) {
        throw new AppError(400, `Attendance month not eligible for payroll: ${err.message}`);
    }
    const handoffByEmp = new Map(handoff.employees.map((e) => [e.employeeId, e]));
    const employees = await db('employees')
        .where({ college_id: actor.collegeId })
        .whereIn('employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE', 'ON_LONG_LEAVE', 'SUSPENDED'])
        .select('*');
    const result = await db.transaction(async (trx) => {
        // Re-check status inside transaction
        const fresh = await trx('payroll_runs').where({ id: payrollRunId }).forUpdate().first();
        if (!fresh)
            throw new AppError(404, 'Payroll run not found');
        await assertPayrollRunMutable(fresh, { action: 'calculate' });
        await trx('payroll_run_components')
            .whereIn('payroll_run_employee_id', trx('payroll_run_employees').select('id').where({ payroll_run_id: payrollRunId }))
            .delete();
        await trx('payroll_run_employees').where({ payroll_run_id: payrollRunId }).delete();
        let grossTotal = '0.00';
        let dedTotal = '0.00';
        let netTotal = '0.00';
        let lopTotal = 0;
        let errorCount = 0;
        const summaryErrors = [];
        for (const emp of employees) {
            const he = handoffByEmp.get(Number(emp.id)) ?? null;
            const { snapshot, errors: snapErrors } = await buildEmployeeSnapshot(trx, actor, emp, period, handoff, he);
            // Future joiners / fully ineligible — skip with SKIPPED status if no assignment and future
            const doj = asISODate(emp.date_of_joining);
            const periodEnd = asISODate(period.end_date);
            if (doj && doj > periodEnd) {
                errorCount += 1;
                summaryErrors.push(`Employee ${emp.employee_number}: future joiner`);
                await trx('payroll_run_employees').insert({
                    payroll_run_id: payrollRunId,
                    employee_id: emp.id,
                    gross_amount: 0,
                    deduction_amount: 0,
                    net_amount: 0,
                    status: 'SKIPPED',
                    calculation_status: 'SKIPPED',
                    validation_errors: JSON.stringify(['Future joiner — not eligible']),
                    input_snapshot: JSON.stringify(snapshot),
                    snapshot_version: PAYROLL_SNAPSHOT_VERSION,
                    working_days: he?.workingDays ?? 0,
                    payable_days: 0,
                    lop_days: 0,
                });
                continue;
            }
            const calc = calculateEmployeePayroll(snapshot);
            const allErrors = [...snapErrors, ...calc.validationErrors];
            const status = allErrors.length ? 'ERROR' : calc.calculationStatus;
            if (status === 'ERROR') {
                errorCount += 1;
                summaryErrors.push(`Employee ${emp.employee_number}: ${allErrors.join('; ')}`);
            }
            const [preId] = await trx('payroll_run_employees').insert({
                payroll_run_id: payrollRunId,
                employee_id: emp.id,
                gross_amount: calc.gross,
                deduction_amount: calc.deductions,
                net_amount: calc.net,
                status: status === 'OK' ? 'CALCULATED' : status,
                calculation_status: status,
                validation_errors: allErrors.length ? JSON.stringify(allErrors) : null,
                input_snapshot: JSON.stringify(snapshot),
                snapshot_version: PAYROLL_SNAPSHOT_VERSION,
                working_days: snapshot.attendance.workingDays,
                payable_days: snapshot.attendance.payableDays,
                lop_days: snapshot.attendance.lopDays,
                structure_id: snapshot.assignment.structureId || null,
                assignment_id: snapshot.assignment.assignmentId || null,
                calculation_trace: JSON.stringify(calc.trace),
                exception_notes: allErrors.length ? allErrors.join('; ') : null,
            });
            for (const item of calc.components) {
                if (!item.componentId && item.code !== 'LOP' && !['EARNING_ADJUSTMENT', 'DEDUCTION_ADJUSTMENT', 'ARREAR', 'RECOVERY'].includes(item.code)) {
                    continue;
                }
                const compId = item.componentId ||
                    (await trx('salary_components')
                        .where({ college_id: actor.collegeId, code: item.code === 'LOP' ? 'LOP' : 'BASIC' })
                        .first())?.id;
                if (!compId)
                    continue;
                await trx('payroll_run_components').insert({
                    payroll_run_employee_id: preId,
                    component_id: compId,
                    amount: item.amount,
                    component_code: item.code,
                    component_name: item.name,
                    component_type: item.componentType,
                    calculation_type: item.calculationType,
                    lop_affected: item.lopAffected,
                    is_proratable: item.isProratable,
                    base_amount: item.baseAmount,
                    calc_detail: JSON.stringify(item.calcDetail),
                });
            }
            // Bind approved adjustments to this run
            if (snapshot.adjustments.length) {
                await trx('payroll_adjustments')
                    .whereIn('id', snapshot.adjustments.map((a) => a.id))
                    .update({ payroll_run_id: payrollRunId });
            }
            if (status === 'OK') {
                grossTotal = addMoney(grossTotal, calc.gross);
                dedTotal = addMoney(dedTotal, calc.deductions);
                netTotal = addMoney(netTotal, calc.net);
                lopTotal += snapshot.attendance.lopDays;
            }
        }
        const validationStatus = errorCount > 0 ? 'FAILED' : 'PASSED';
        await trx('payroll_runs').where({ id: payrollRunId }).update({
            status: 'CALCULATED',
            calculated_by: actor.facultyUserId,
            validation_status: validationStatus,
            validation_error_count: errorCount,
            employee_count: employees.length,
            gross_total: grossTotal,
            deduction_total: dedTotal,
            net_total: netTotal,
            lop_days_total: lopTotal,
            attendance_closure_id: handoff.closureId,
            attendance_calc_version: handoff.calculationVersion,
            validation_summary: summaryErrors.slice(0, 50).join('\n') || null,
        });
        return { validationStatus, errorCount, employeeCount: employees.length };
    });
    await recordHrAudit({
        actor,
        action: 'PAYROLL_CALCULATED',
        entityType: 'payroll_runs',
        entityId: payrollRunId,
        after: result,
    });
    return {
        id: payrollRunId,
        status: 'CALCULATED',
        validationStatus: result.validationStatus,
        validationErrorCount: result.errorCount,
        employeeCount: result.employeeCount,
    };
}
export async function approvePayrollRun(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.approve');
    const run = await loadRunForActor(actor, payrollRunId);
    if (run.status === 'APPROVED' || LOCKED_LIKE.has(String(run.status))) {
        throw new AppError(400, `Payroll run is already ${run.status}`);
    }
    if (run.status !== 'CALCULATED' && run.status !== 'UNDER_REVIEW') {
        throw new AppError(400, 'Payroll must be calculated before approval');
    }
    if (String(run.validation_status) === 'FAILED' || Number(run.validation_error_count) > 0) {
        throw new AppError(400, 'Cannot approve payroll with validation errors');
    }
    await db.transaction(async (trx) => {
        const fresh = await trx('payroll_runs').where({ id: payrollRunId }).forUpdate().first();
        if (!fresh)
            throw new AppError(404, 'Payroll run not found');
        if (fresh.status === 'APPROVED' || LOCKED_LIKE.has(String(fresh.status))) {
            throw new AppError(400, `Payroll run is already ${fresh.status}`);
        }
        await trx('payroll_runs').where({ id: payrollRunId }).update({
            status: 'APPROVED',
            approved_by: actor.facultyUserId,
            approved_at: trx.fn.now(),
        });
    });
    await recordHrAudit({ actor, action: 'PAYROLL_APPROVED', entityType: 'payroll_runs', entityId: payrollRunId });
    // Notify payroll officers / HR (via employee notifications for actor's peers is noisy — notify run creator path skipped)
    return { id: payrollRunId, status: 'APPROVED' };
}
export async function lockPayrollRun(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.lock');
    const run = await loadRunForActor(actor, payrollRunId);
    if (run.status === 'LOCKED' || run.status === 'POSTED') {
        throw new AppError(400, 'Already locked');
    }
    if (!['CALCULATED', 'APPROVED'].includes(String(run.status))) {
        throw new AppError(400, 'Payroll must be calculated before locking');
    }
    if (String(run.validation_status) === 'FAILED' || Number(run.validation_error_count) > 0) {
        throw new AppError(400, 'Cannot lock payroll with validation errors');
    }
    await db.transaction(async (trx) => {
        const fresh = await trx('payroll_runs').where({ id: payrollRunId }).forUpdate().first();
        if (!fresh)
            throw new AppError(404, 'Payroll run not found');
        if (fresh.status === 'LOCKED' || fresh.status === 'POSTED') {
            throw new AppError(400, 'Already locked');
        }
        await trx('payroll_runs').where({ id: payrollRunId }).update({
            status: 'LOCKED',
            locked_by: actor.facultyUserId,
            locked_at: trx.fn.now(),
        });
        const runEmployees = await trx('payroll_run_employees').where({ payroll_run_id: payrollRunId });
        for (const re of runEmployees) {
            if (String(re.calculation_status) === 'SKIPPED' || String(re.calculation_status) === 'ERROR')
                continue;
            const existing = await trx('payslips').where({ payroll_run_id: payrollRunId, employee_id: re.employee_id }).first();
            if (existing)
                continue;
            const payslipNumber = await nextPayslipNumber(trx, actor.collegeId);
            const components = await trx('payroll_run_components').where({ payroll_run_employee_id: re.id });
            const snapshot = typeof re.input_snapshot === 'string' ? JSON.parse(String(re.input_snapshot)) : re.input_snapshot;
            const empSnap = snapshot?.employee ?? null;
            await trx('payslips').insert({
                college_id: actor.collegeId,
                employee_id: re.employee_id,
                payroll_run_id: payrollRunId,
                payroll_run_employee_id: re.id,
                payslip_number: payslipNumber,
                gross_amount: re.gross_amount,
                deduction_amount: re.deduction_amount,
                net_amount: re.net_amount,
                breakdown: JSON.stringify(components.map((c) => ({
                    code: c.component_code,
                    name: c.component_name,
                    type: c.component_type,
                    amount: Number(c.amount),
                }))),
                employee_snapshot: empSnap ? JSON.stringify(empSnap) : null,
                release_status: 'RELEASED',
            });
            await notifyEmployee({
                employeeId: Number(re.employee_id),
                collegeId: actor.collegeId,
                type: 'PAYSLIP_RELEASED',
                title: 'Payslip released',
                body: `Your payslip ${payslipNumber} is now available.`,
                link: '/hr/payslips',
                relatedType: 'payslips',
                relatedId: undefined,
                dedupeKey: `payslip-released-${payrollRunId}-${re.employee_id}`,
            });
        }
    });
    await recordHrAudit({ actor, action: 'PAYROLL_LOCKED', entityType: 'payroll_runs', entityId: payrollRunId });
    return { id: payrollRunId, status: 'LOCKED' };
}
/**
 * Reopen policy:
 *   - Block if Finance posting is POSTED (must reverse first).
 *   - Only COLLEGE_ADMIN / payroll lock permission from LOCKED → APPROVED (pre-post) is not allowed;
 *     reopen only from APPROVED back to CALCULATED when not posted.
 */
export async function reopenPayrollRun(actor, payrollRunId, reason) {
    assertHrPermission(actor, 'hr.payroll.lock');
    if (!reason || reason.trim().length < 5)
        throw new AppError(400, 'Reason required to reopen payroll');
    const run = await loadRunForActor(actor, payrollRunId);
    if (String(run.finance_posting_status) === 'POSTED') {
        throw new AppError(400, 'Cannot reopen — Finance posting exists. Reverse Finance posting first.');
    }
    if (LOCKED_LIKE.has(String(run.status))) {
        throw new AppError(400, 'Cannot reopen a LOCKED payroll. Reverse Finance (if any) is required; locked payroll is immutable.');
    }
    if (run.status !== 'APPROVED') {
        throw new AppError(400, 'Only APPROVED (unposted) payroll can be reopened to CALCULATED');
    }
    await db('payroll_runs').where({ id: payrollRunId }).update({
        status: 'CALCULATED',
        approved_by: null,
        approved_at: null,
    });
    await recordHrAudit({
        actor,
        action: 'PAYROLL_REOPENED',
        entityType: 'payroll_runs',
        entityId: payrollRunId,
        reason,
    });
    return { id: payrollRunId, status: 'CALCULATED' };
}
/** Block direct mutation of locked run employee/component rows. */
export async function assertCanMutateRunEmployee(actor, payrollRunEmployeeId) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const row = await db('payroll_run_employees as pre')
        .join('payroll_runs as r', 'r.id', 'pre.payroll_run_id')
        .where({ 'pre.id': payrollRunEmployeeId, 'r.college_id': actor.collegeId })
        .select('pre.*', 'r.status as run_status', 'r.finance_posting_status')
        .first();
    if (!row)
        throw new AppError(404, 'Payroll employee result not found');
    await assertPayrollRunMutable({ status: row.run_status, finance_posting_status: row.finance_posting_status }, { action: 'mutate employee result' });
    return row;
}
export async function mutateLockedPayrollComponentBlocked(actor, payrollRunEmployeeId, _patch) {
    await assertCanMutateRunEmployee(actor, payrollRunEmployeeId);
    // If we get here run is mutable — still prefer recalculate over ad-hoc patch
    throw new AppError(400, 'Direct component mutation is not allowed — recalculate the run instead');
}
/**
 * Build Finance posting batch preview — real entries from locked payroll + mappings.
 * College-scoped; requires payroll view.
 */
export async function getPayrollPostingBatch(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const run = await loadRunForActor(actor, payrollRunId);
    const { buildPayrollPostingPreview } = await import('../finance/payrollPosting.js');
    return buildPayrollPostingPreview(actor.collegeId, run);
}
export async function postPayrollToFinance(actor, payrollRunId) {
    assertHrPermission(actor, 'hr.payroll.lock');
    const run = await loadRunForActor(actor, payrollRunId);
    const { postPayrollRun } = await import('../finance/payrollPosting.js');
    return postPayrollRun({
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        role: actor.role,
        name: actor.name,
    }, run);
}
export async function reversePayrollFinance(actor, payrollRunId, reason) {
    assertHrPermission(actor, 'hr.payroll.lock');
    const run = await loadRunForActor(actor, payrollRunId);
    const { reversePayrollPosting } = await import('../finance/payrollPosting.js');
    return reversePayrollPosting({
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        role: actor.role,
        name: actor.name,
    }, run, reason);
}
export async function listPayrollPeriods(actor) {
    assertHrPermission(actor, 'hr.payroll.view');
    const rows = await db('payroll_periods').where({ college_id: actor.collegeId }).orderBy('start_date', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        label: r.label,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
    }));
}
export async function ensurePayrollPeriod(actor, input) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const existing = await db('payroll_periods')
        .where({ college_id: actor.collegeId, label: input.label })
        .first();
    if (existing)
        return { id: Number(existing.id), label: existing.label, created: false };
    const [id] = await db('payroll_periods').insert({
        college_id: actor.collegeId,
        label: input.label,
        start_date: input.startDate,
        end_date: input.endDate,
        status: 'OPEN',
    });
    return { id: Number(id), label: input.label, created: true };
}
export function canViewPayrollCompensation(actor) {
    return hasHrPermission(actor, 'hr.payroll.view');
}
export { MUTABLE_STATUSES, toMoney };
