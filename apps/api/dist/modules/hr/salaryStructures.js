/**
 * Salary structures, components, employee assignments, and effective-dated revisions.
 * Historical payroll never rewrites — locked runs use snapshots; revisions create arrears.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { asISODate } from '../timetable/time.js';
import { calculateEmployeePayroll } from './payrollCalc.js';
import { subtractMoney, toMoney } from './payrollMoney.js';
export async function listSalaryComponents(actor) {
    assertHrPermission(actor, 'hr.payroll.view');
    const rows = await db('salary_components').where({ college_id: actor.collegeId }).orderBy('code');
    return rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
        componentType: r.component_type,
        isStatutory: Boolean(r.is_statutory),
        lopAffected: r.lop_affected == null ? true : Boolean(r.lop_affected),
        isProratable: r.is_proratable == null ? true : Boolean(r.is_proratable),
        isActive: Boolean(r.is_active),
    }));
}
export async function updateSalaryComponentFlags(actor, componentId, patch) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const row = await db('salary_components').where({ id: componentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Component not found');
    const updates = {};
    if (patch.lopAffected !== undefined)
        updates.lop_affected = patch.lopAffected;
    if (patch.isProratable !== undefined)
        updates.is_proratable = patch.isProratable;
    if (patch.isActive !== undefined)
        updates.is_active = patch.isActive;
    if (Object.keys(updates).length) {
        await db('salary_components').where({ id: componentId }).update(updates);
    }
    await recordHrAudit({
        actor,
        action: 'SALARY_COMPONENT_UPDATED',
        entityType: 'salary_components',
        entityId: componentId,
        after: patch,
    });
    return listSalaryComponents(actor).then((all) => all.find((c) => c.id === componentId));
}
export async function listSalaryStructures(actor) {
    assertHrPermission(actor, 'hr.payroll.view');
    const rows = await db('salary_structures').where({ college_id: actor.collegeId }).orderBy('code');
    return rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
        isActive: Boolean(r.is_active),
    }));
}
export async function getSalaryStructure(actor, structureId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const structure = await db('salary_structures')
        .where({ id: structureId, college_id: actor.collegeId })
        .first();
    if (!structure)
        throw new AppError(404, 'Salary structure not found');
    const components = await db('salary_structure_components as ssc')
        .join('salary_components as sc', 'sc.id', 'ssc.component_id')
        .where({ 'ssc.structure_id': structureId })
        .select('ssc.*', 'sc.code', 'sc.name', 'sc.component_type', 'sc.lop_affected', 'sc.is_proratable');
    return {
        id: Number(structure.id),
        code: structure.code,
        name: structure.name,
        isActive: Boolean(structure.is_active),
        components: components.map((c) => ({
            id: Number(c.id),
            componentId: Number(c.component_id),
            code: c.code,
            name: c.name,
            componentType: c.component_type,
            calculationType: c.calculation_type,
            amount: c.amount != null ? Number(c.amount) : null,
            percentage: c.percentage != null ? Number(c.percentage) : null,
            percentageOfComponentId: c.percentage_of_component_id ? Number(c.percentage_of_component_id) : null,
            lopAffected: c.lop_affected == null ? true : Boolean(c.lop_affected),
            isProratable: c.is_proratable == null ? true : Boolean(c.is_proratable),
        })),
    };
}
export async function createSalaryStructure(actor, input) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const existing = await db('salary_structures')
        .where({ college_id: actor.collegeId, code: input.code })
        .first();
    if (existing)
        throw new AppError(409, 'Salary structure code already exists');
    const id = await db.transaction(async (trx) => {
        const [sid] = await trx('salary_structures').insert({
            college_id: actor.collegeId,
            code: input.code,
            name: input.name,
            is_active: true,
        });
        for (const c of input.components) {
            const comp = await trx('salary_components')
                .where({ id: c.componentId, college_id: actor.collegeId })
                .first();
            if (!comp)
                throw new AppError(400, `Invalid component ${c.componentId}`);
            await trx('salary_structure_components').insert({
                structure_id: sid,
                component_id: c.componentId,
                calculation_type: c.calculationType || 'FIXED',
                amount: c.amount ?? null,
                percentage: c.percentage ?? null,
                percentage_of_component_id: c.percentageOfComponentId ?? null,
            });
        }
        return Number(sid);
    });
    await recordHrAudit({ actor, action: 'SALARY_STRUCTURE_CREATED', entityType: 'salary_structures', entityId: id });
    return getSalaryStructure(actor, id);
}
export async function updateSalaryStructureComponents(actor, structureId, components) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const structure = await db('salary_structures')
        .where({ id: structureId, college_id: actor.collegeId })
        .first();
    if (!structure)
        throw new AppError(404, 'Salary structure not found');
    // Changing live structure must NOT rewrite locked payroll (snapshots). Documented.
    await db.transaction(async (trx) => {
        await trx('salary_structure_components').where({ structure_id: structureId }).delete();
        for (const c of components) {
            await trx('salary_structure_components').insert({
                structure_id: structureId,
                component_id: c.componentId,
                calculation_type: c.calculationType || 'FIXED',
                amount: c.amount ?? null,
                percentage: c.percentage ?? null,
                percentage_of_component_id: c.percentageOfComponentId ?? null,
            });
        }
    });
    await recordHrAudit({
        actor,
        action: 'SALARY_STRUCTURE_UPDATED',
        entityType: 'salary_structures',
        entityId: structureId,
    });
    return getSalaryStructure(actor, structureId);
}
export async function listEmployeeSalaryAssignments(actor, employeeId) {
    assertHrPermission(actor, 'hr.payroll.view');
    const emp = await db('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const rows = await db('employee_salary_structures as ess')
        .join('salary_structures as ss', 'ss.id', 'ess.structure_id')
        .where({ 'ess.employee_id': employeeId })
        .select('ess.*', 'ss.code as structure_code', 'ss.name as structure_name')
        .orderBy('ess.effective_from', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        structureId: Number(r.structure_id),
        structureCode: r.structure_code,
        structureName: r.structure_name,
        effectiveFrom: r.effective_from,
        effectiveTo: r.effective_to,
        isActive: Boolean(r.is_active),
    }));
}
/**
 * Assign or revise salary structure with effective dating.
 * Closes prior open assignment (effective_to = day before new effective_from).
 * If revision is backdated against a locked prior payroll, generate ARREAR into open run or pending adjustment.
 */
export async function assignEmployeeSalary(actor, employeeId, input) {
    assertHrPermission(actor, 'hr.payroll.manage');
    const emp = await db('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const structure = await db('salary_structures')
        .where({ id: input.structureId, college_id: actor.collegeId })
        .first();
    if (!structure)
        throw new AppError(404, 'Salary structure not found');
    const effectiveFrom = input.effectiveFrom;
    const dayBefore = (() => {
        const d = new Date(effectiveFrom + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        return asISODate(d);
    })();
    const assignmentId = await db.transaction(async (trx) => {
        const open = await trx('employee_salary_structures')
            .where({ employee_id: employeeId })
            .whereNull('effective_to')
            .orderBy('effective_from', 'desc');
        for (const prev of open) {
            const prevFrom = String(asISODate(prev.effective_from) || prev.effective_from);
            if (prevFrom > effectiveFrom) {
                // Future-dated open assignment — close it out before the new revision window
                await trx('employee_salary_structures').where({ id: prev.id }).update({
                    effective_to: dayBefore,
                    is_active: false,
                });
            }
            else if (prevFrom === effectiveFrom) {
                // Same-day / retroactive supersede — deactivate prior row; locked payroll snapshots remain untouched
                await trx('employee_salary_structures').where({ id: prev.id }).update({
                    effective_to: effectiveFrom,
                    is_active: false,
                });
            }
            else {
                await trx('employee_salary_structures').where({ id: prev.id }).update({
                    effective_to: dayBefore,
                    is_active: false,
                });
            }
        }
        // Also close any active rows that span into the new period
        await trx('employee_salary_structures')
            .where({ employee_id: employeeId, is_active: true })
            .where('effective_from', '<', effectiveFrom)
            .andWhere((qb) => {
            qb.whereNull('effective_to').orWhere('effective_to', '>=', effectiveFrom);
        })
            .update({ effective_to: dayBefore, is_active: false });
        const [id] = await trx('employee_salary_structures').insert({
            employee_id: employeeId,
            structure_id: input.structureId,
            effective_from: effectiveFrom,
            effective_to: null,
            is_active: true,
        });
        return Number(id);
    });
    await recordHrAudit({
        actor,
        action: 'SALARY_ASSIGNMENT',
        entityType: 'employee_salary_structures',
        entityId: assignmentId,
        reason: input.reason,
        after: { employeeId, structureId: input.structureId, effectiveFrom },
    });
    let arrear = null;
    if (input.generateArrear !== false) {
        arrear = await maybeGenerateRevisionArrear(actor, employeeId, effectiveFrom, input.structureId, input.reason);
    }
    return {
        assignment: (await listEmployeeSalaryAssignments(actor, employeeId)).find((a) => a.id === assignmentId),
        arrear,
    };
}
/**
 * If there are locked payrolls after the revision effective date that used the old structure,
 * do NOT mutate them — create an APPROVED ARREAR adjustment for the difference in a later open period.
 */
async function maybeGenerateRevisionArrear(actor, employeeId, revisionFrom, newStructureId, reason) {
    const lockedRuns = await db('payroll_runs as r')
        .join('payroll_periods as p', 'p.id', 'r.period_id')
        .join('payroll_run_employees as pre', 'pre.payroll_run_id', 'r.id')
        .where({
        'r.college_id': actor.collegeId,
        'pre.employee_id': employeeId,
    })
        .whereIn('r.status', ['LOCKED', 'POSTED'])
        .where('p.end_date', '>=', revisionFrom)
        .select('r.id as run_id', 'r.period_id', 'p.label', 'p.start_date', 'p.end_date', 'pre.*');
    if (!lockedRuns.length)
        return null;
    // Compute simple arrear: difference in gross for first locked period after revision (explainability)
    const sample = lockedRuns[0];
    const snapshot = typeof sample.input_snapshot === 'string'
        ? JSON.parse(String(sample.input_snapshot))
        : sample.input_snapshot;
    if (!snapshot)
        return null;
    const newComponents = await db('salary_structure_components as ssc')
        .join('salary_components as sc', 'sc.id', 'ssc.component_id')
        .where({ 'ssc.structure_id': newStructureId })
        .select('ssc.*', 'sc.code', 'sc.name', 'sc.component_type', 'sc.is_statutory', 'sc.lop_affected', 'sc.is_proratable');
    const comps = newComponents.map((r) => ({
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
    const hypothetical = {
        ...snapshot,
        components: comps,
        assignment: {
            ...snapshot.assignment,
            structureId: newStructureId,
        },
        adjustments: [],
    };
    const newCalc = calculateEmployeePayroll(hypothetical);
    const oldNet = toMoney(sample.net_amount);
    const diff = subtractMoney(newCalc.net, oldNet);
    if (Number(diff) === 0)
        return null;
    const basic = await db('salary_components').where({ college_id: actor.collegeId, code: 'BASIC' }).first();
    const [adjId] = await db('payroll_adjustments').insert({
        college_id: actor.collegeId,
        employee_id: employeeId,
        payroll_run_id: null,
        component_id: basic?.id ?? null,
        amount: Math.abs(Number(diff)),
        reason: reason ||
            `Arrear for salary revision effective ${revisionFrom} vs locked period ${sample.label}`,
        status: 'APPROVED',
        adjustment_type: Number(diff) >= 0 ? 'ARREAR' : 'RECOVERY',
        source_period_id: sample.period_id,
        source_component_id: basic?.id ?? null,
        source_payroll_run_id: sample.run_id,
        created_by: actor.facultyUserId,
        approved_by: actor.facultyUserId,
        approved_at: db.fn.now(),
    });
    await recordHrAudit({
        actor,
        action: 'PAYROLL_ARREAR_CREATED',
        entityType: 'payroll_adjustments',
        entityId: Number(adjId),
        reason: `Retroactive revision — locked run ${sample.run_id} unchanged`,
        after: { amount: diff, sourceRunId: sample.run_id },
    });
    return { id: Number(adjId), amount: diff };
}
