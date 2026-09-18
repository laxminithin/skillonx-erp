/**
 * Canonical payroll calculation engine.
 * Owns all monetary computation; controllers/UI only render persisted results.
 *
 * Snapshot lifecycle:
 *   DRAFT            → inputs may be refreshed on next calculate
 *   CALCULATE        → snapshot canonical inputs per payroll_run + employee
 *   RECALCULATE      → intentionally refresh snapshot from current valid sources (pre-lock only)
 *   APPROVED/LOCKED  → snapshot immutable
 */
import { toMoney, addMoney, subtractMoney, percentOf, multiplyMoney } from './payrollMoney.js';
export const PAYROLL_SNAPSHOT_VERSION = '1';
function prorationFactor(payableDays, workingDays) {
    if (workingDays <= 0)
        return 0;
    const f = payableDays / workingDays;
    if (!Number.isFinite(f))
        return 0;
    return Math.max(0, Math.min(1, f));
}
/**
 * Resolve component base amounts in order: FIXED first, then PERCENTAGE of resolved bases.
 */
function resolveBaseAmounts(components) {
    const bases = new Map();
    const fixed = components.filter((c) => c.calculationType === 'FIXED' || c.calculationType === 'MANUAL' || c.calculationType === 'STATUTORY');
    const pct = components.filter((c) => c.calculationType === 'PERCENTAGE' || c.calculationType === 'FORMULA');
    for (const c of fixed) {
        bases.set(c.componentId, Number(c.amount ?? 0));
    }
    // Percentage of another component (default BASIC if unspecified)
    for (const c of pct) {
        const ofId = c.percentageOfComponentId;
        let base = 0;
        if (ofId && bases.has(ofId)) {
            base = bases.get(ofId);
        }
        else {
            // Prefer BASIC, else sum of FIXED earnings already resolved
            const basic = components.find((x) => x.code === 'BASIC');
            if (basic && bases.has(basic.componentId))
                base = bases.get(basic.componentId);
            else {
                base = components
                    .filter((x) => (x.componentType === 'EARNING' || x.componentType === 'REIMBURSEMENT') && bases.has(x.componentId))
                    .reduce((s, x) => s + (bases.get(x.componentId) ?? 0), 0);
            }
        }
        const pctVal = c.percentage != null ? Number(c.percentage) : Number(c.amount ?? 0);
        bases.set(c.componentId, Number(percentOf(base, pctVal)));
    }
    return bases;
}
export function calculateEmployeePayroll(snapshot) {
    const steps = [];
    const errors = [];
    const { attendance, components, adjustments } = snapshot;
    if (!snapshot.assignment?.structureId) {
        errors.push('Missing salary structure assignment');
    }
    if (components.length === 0) {
        errors.push('Salary structure has no components');
    }
    if (attendance.closureId == null) {
        errors.push('Missing attendance payroll handoff');
    }
    const factor = prorationFactor(attendance.payableDays, attendance.workingDays);
    steps.push(`Proration factor = payableDays(${attendance.payableDays}) / workingDays(${attendance.workingDays}) = ${factor.toFixed(6)}`);
    const bases = resolveBaseAmounts(components);
    const results = [];
    let gross = '0.00';
    let deductions = '0.00';
    let employer = '0.00';
    // Skip synthetic LOP component from structure — LOP money is derived from LOP-affected earnings
    for (const c of components) {
        if (c.code === 'LOP')
            continue;
        const base = bases.get(c.componentId) ?? Number(c.amount ?? 0);
        let amount = base;
        const detail = {
            baseAmount: toMoney(base),
            calculationType: c.calculationType,
            percentage: c.percentage,
        };
        if (c.isProratable || c.lopAffected) {
            amount = Number(multiplyMoney(base, factor));
            detail.prorationFactor = factor;
            detail.prorated = true;
            steps.push(`${c.code}: base ${toMoney(base)} × ${factor.toFixed(4)} = ${toMoney(amount)}`);
        }
        else {
            steps.push(`${c.code}: fixed ${toMoney(base)} (not LOP/proratable)`);
        }
        const money = toMoney(amount);
        results.push({
            componentId: c.componentId,
            code: c.code,
            name: c.name,
            componentType: c.componentType,
            calculationType: c.calculationType,
            lopAffected: c.lopAffected,
            isProratable: c.isProratable,
            baseAmount: toMoney(base),
            amount: money,
            calcDetail: detail,
        });
        if (c.componentType === 'EARNING' || c.componentType === 'REIMBURSEMENT') {
            gross = addMoney(gross, money);
        }
        else if (c.componentType === 'DEDUCTION') {
            deductions = addMoney(deductions, money);
        }
        else if (c.componentType === 'EMPLOYER_CONTRIBUTION') {
            employer = addMoney(employer, money);
        }
    }
    // Explicit LOP monetary effect = full gross of LOP-affected earnings − prorated amount
    let lopMoney = '0.00';
    for (const c of components) {
        if (c.code === 'LOP' || !c.lopAffected)
            continue;
        if (!(c.componentType === 'EARNING' || c.componentType === 'REIMBURSEMENT'))
            continue;
        const base = bases.get(c.componentId) ?? 0;
        const full = toMoney(base);
        const paid = results.find((r) => r.componentId === c.componentId)?.amount ?? '0.00';
        lopMoney = addMoney(lopMoney, subtractMoney(full, paid));
    }
    if (Number(lopMoney) > 0) {
        const lopComp = components.find((c) => c.code === 'LOP');
        results.push({
            componentId: lopComp?.componentId ?? 0,
            code: 'LOP',
            name: lopComp?.name ?? 'Loss of Pay',
            componentType: 'DEDUCTION',
            calculationType: 'STATUTORY',
            lopAffected: false,
            isProratable: false,
            baseAmount: lopMoney,
            amount: lopMoney,
            calcDetail: { derivedFromLopAffectedEarnings: true, lopDays: attendance.lopDays },
        });
        // LOP is already reflected via proration of earnings — do NOT double-count as deduction.
        // Trace only for explainability.
        steps.push(`LOP monetary impact (explainability): ${lopMoney} for ${attendance.lopDays} LOP days (already applied via proration)`);
    }
    for (const adj of adjustments) {
        const amt = toMoney(adj.amount);
        const type = String(adj.adjustmentType || 'EARNING_ADJUSTMENT').toUpperCase();
        const isEarning = type === 'EARNING_ADJUSTMENT' || type === 'ARREAR';
        const isDeduction = type === 'DEDUCTION_ADJUSTMENT' || type === 'RECOVERY';
        results.push({
            componentId: adj.componentId ?? 0,
            code: type,
            name: adj.reason.slice(0, 64),
            componentType: isEarning ? 'EARNING' : 'DEDUCTION',
            calculationType: 'MANUAL',
            lopAffected: false,
            isProratable: false,
            baseAmount: amt,
            amount: isDeduction ? toMoney(Math.abs(Number(amt))) : amt,
            calcDetail: {
                adjustmentId: adj.id,
                adjustmentType: type,
                sourcePeriodId: adj.sourcePeriodId,
                sourceComponentId: adj.sourceComponentId,
            },
        });
        if (isEarning) {
            gross = addMoney(gross, amt);
            steps.push(`Adjustment ${type}: +${amt} (${adj.reason})`);
        }
        else if (isDeduction) {
            deductions = addMoney(deductions, Math.abs(Number(amt)));
            steps.push(`Adjustment ${type}: −${toMoney(Math.abs(Number(amt)))} (${adj.reason})`);
        }
    }
    const net = subtractMoney(gross, deductions);
    if (Number(net) < 0) {
        errors.push(`Negative net pay: ${net}`);
    }
    return {
        gross,
        deductions,
        employerContributions: employer,
        net,
        components: results,
        trace: {
            workingDays: attendance.workingDays,
            payableDays: attendance.payableDays,
            lopDays: attendance.lopDays,
            prorationFactor: factor,
            steps,
        },
        validationErrors: errors,
        calculationStatus: errors.length ? 'ERROR' : 'OK',
    };
}
