import { toMoney, addMoney, subtractMoney } from './payrollMoney.js';
import { daysBetween } from './fnfSources.js';
function dailyRate(basis, kind, divisor) {
    const monthly = kind === 'GROSS' ? basis.gross : basis.basic;
    const d = divisor > 0 ? divisor : 30;
    return toMoney(Number(monthly) / d);
}
export function computeLeaveEncashment(policy, leaves, salary) {
    const rate = dailyRate(salary, policy.encashmentSalaryBasis, policy.encashmentDailyDivisor);
    const allowed = new Set(policy.encashableLeaveCodes.map((c) => c.toUpperCase()));
    const out = [];
    let remainingCap = policy.maxEncashableDays;
    for (const lv of leaves) {
        if (!allowed.has(lv.leaveTypeCode.toUpperCase()))
            continue;
        if (!lv.encashmentEligible && allowed.size > 0) {
            // F&F policy listing is sufficient when leave-policy flag is off but code is configured
        }
        let days = Math.max(0, Number(lv.availableBalance));
        if (remainingCap != null) {
            days = Math.min(days, remainingCap);
            remainingCap = Math.max(0, remainingCap - days);
        }
        if (days <= 0)
            continue;
        const amount = toMoney(days * Number(rate));
        out.push({
            side: 'PAYABLE',
            code: 'LEAVE_ENCASHMENT',
            name: `Leave encashment (${lv.leaveTypeCode})`,
            source: 'leave',
            basis: `${policy.encashmentSalaryBasis}/${policy.encashmentDailyDivisor}`,
            quantity: days,
            rate,
            amount,
            ruleReference: `fnf-policy:${policy.id}`,
            sourceRef: `LEAVE:${lv.leaveTypeId}`,
            trace: {
                leaveType: lv.leaveTypeCode,
                availableBalance: lv.availableBalance,
                encashedDays: days,
                salaryBasis: policy.encashmentSalaryBasis,
                monthly: policy.encashmentSalaryBasis === 'GROSS' ? salary.gross : salary.basic,
                dailyRate: rate,
            },
        });
    }
    return out;
}
export function computeNoticePay(policy, input, salary) {
    const served = input.noticeDate
        ? Math.max(0, daysBetween(input.noticeDate, input.lastWorkingDate) + 1)
        : input.requiredDays;
    const shortfall = Math.max(0, input.requiredDays - served);
    if (input.waived) {
        return {
            served,
            shortfall,
            component: {
                side: 'RECOVERY',
                code: 'NOTICE_PAY',
                name: 'Notice pay (waived)',
                source: 'lifecycle',
                basis: 'WAIVED',
                quantity: shortfall,
                rate: '0.00',
                amount: '0.00',
                ruleReference: `fnf-policy:${policy.id}`,
                sourceRef: 'NOTICE',
                trace: {
                    requiredDays: input.requiredDays,
                    servedDays: served,
                    shortfallDays: shortfall,
                    waived: true,
                    reason: input.waiverReason,
                },
            },
        };
    }
    if (shortfall <= 0 || input.requiredDays <= 0) {
        return { served, shortfall: 0, component: null };
    }
    const rate = dailyRate(salary, policy.noticeSalaryBasis, policy.noticeDailyDivisor);
    const amount = toMoney(shortfall * Number(rate));
    return {
        served,
        shortfall,
        component: {
            side: 'RECOVERY',
            code: 'NOTICE_PAY',
            name: 'Notice pay recovery',
            source: 'lifecycle',
            basis: `${policy.noticeSalaryBasis}/${policy.noticeDailyDivisor}`,
            quantity: shortfall,
            rate,
            amount,
            ruleReference: `fnf-policy:${policy.id}`,
            sourceRef: 'NOTICE',
            trace: {
                requiredDays: input.requiredDays,
                servedDays: served,
                shortfallDays: shortfall,
                waived: false,
                monthly: policy.noticeSalaryBasis === 'GROSS' ? salary.gross : salary.basic,
            },
        },
    };
}
export function computeUnpaidSalary(lastPayroll, lastWorkingDate, salary, divisor) {
    if (!lastWorkingDate)
        return null;
    if (lastPayroll && lastPayroll.periodEnd >= lastWorkingDate) {
        // Final payroll month already locked/paid through LWD — do not pay again.
        return {
            side: 'PAYABLE',
            code: 'UNPAID_SALARY',
            name: 'Unpaid salary (already included in payroll)',
            source: 'payroll',
            basis: 'ALREADY_PAID',
            quantity: 0,
            rate: '0.00',
            amount: '0.00',
            ruleReference: `payroll_run:${lastPayroll.payrollRunId}`,
            sourceRef: `PAYROLL:${lastPayroll.payrollRunId}`,
            trace: {
                lastPayrollRunId: lastPayroll.payrollRunId,
                periodEnd: lastPayroll.periodEnd,
                lastWorkingDate,
                doublePayPrevented: true,
                lopDaysConsumedInPayroll: lastPayroll.lopDays,
            },
        };
    }
    const start = lastPayroll ? addDays(lastPayroll.periodEnd, 1) : monthStart(lastWorkingDate);
    const days = Math.max(0, daysBetween(start, lastWorkingDate) + 1);
    if (days <= 0)
        return null;
    const rate = dailyRate(salary, 'BASIC', divisor);
    const amount = toMoney(days * Number(rate));
    return {
        side: 'PAYABLE',
        code: 'UNPAID_SALARY',
        name: 'Unpaid residual salary',
        source: 'payroll',
        basis: `BASIC/${divisor}`,
        quantity: days,
        rate,
        amount,
        ruleReference: lastPayroll ? `after_payroll:${lastPayroll.payrollRunId}` : 'no_prior_payroll',
        sourceRef: lastPayroll ? `PAYROLL_RESIDUAL:${lastPayroll.payrollRunId}` : 'PAYROLL_RESIDUAL:NONE',
        trace: {
            from: start,
            to: lastWorkingDate,
            days,
            lastPayrollRunId: lastPayroll?.payrollRunId ?? null,
            doublePayPrevented: true,
            lopNotRecalculated: true,
        },
    };
}
function addDays(iso, n) {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthStart(iso) {
    return `${iso.slice(0, 7)}-01`;
}
export function computeGratuity(policy, salary, dateOfJoining, lastWorkingDate) {
    if (!policy.gratuityEnabled)
        return null;
    if (!dateOfJoining || !lastWorkingDate)
        return null;
    if (policy.gratuityMinYears == null || policy.gratuityDaysPerYear == null)
        return null;
    const years = daysBetween(dateOfJoining, lastWorkingDate) / 365;
    const eligible = years >= Number(policy.gratuityMinYears);
    const wage = policy.gratuityWageBasis === 'GROSS' ? salary.gross : salary.basic;
    const daily = Number(wage) / (policy.noticeDailyDivisor || 30);
    const amount = eligible ? toMoney(years * Number(policy.gratuityDaysPerYear) * daily) : '0.00';
    return {
        side: 'PAYABLE',
        code: 'GRATUITY',
        name: eligible ? 'Gratuity (policy)' : 'Gratuity (not eligible)',
        source: 'fnf_policy',
        basis: policy.gratuityRuleVersion ?? `policy:${policy.id}`,
        quantity: Number(years.toFixed(4)),
        rate: toMoney(daily),
        amount,
        ruleReference: policy.gratuityRuleVersion ?? `fnf-policy:${policy.id}`,
        sourceRef: 'GRATUITY',
        trace: {
            enabled: true,
            eligible,
            serviceYears: years,
            minYears: policy.gratuityMinYears,
            daysPerYear: policy.gratuityDaysPerYear,
            wageBasis: policy.gratuityWageBasis ?? 'BASIC',
            wage,
        },
    };
}
export function summarizeComponents(components) {
    const payables = components.filter((c) => c.side === 'PAYABLE');
    const recoveries = components.filter((c) => c.side === 'RECOVERY');
    const grossPayable = payables.reduce((s, c) => addMoney(s, c.amount), '0.00');
    const totalRecoveries = recoveries.reduce((s, c) => addMoney(s, c.amount), '0.00');
    const net = subtractMoney(grossPayable, totalRecoveries);
    const direction = Number(net) >= 0 ? 'PAYABLE_TO_EMPLOYEE' : 'RECEIVABLE_FROM_EMPLOYEE';
    return { grossPayable, totalRecoveries, netAmount: net, direction };
}
