import { db } from '../../db/index.js';
import { assertHrPermission } from './access.js';
import { asISODate } from '../timetable/time.js';
function parseCodes(raw) {
    if (Array.isArray(raw))
        return raw.map(String);
    if (typeof raw === 'string') {
        try {
            const v = JSON.parse(raw);
            return Array.isArray(v) ? v.map(String) : ['EL'];
        }
        catch {
            return ['EL'];
        }
    }
    return ['EL'];
}
function mapPolicy(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        effectiveFrom: asISODate(row.effective_from),
        encashableLeaveCodes: parseCodes(row.encashable_leave_codes),
        maxEncashableDays: row.max_encashable_days != null ? Number(row.max_encashable_days) : null,
        encashmentSalaryBasis: (row.encashment_salary_basis === 'GROSS' ? 'GROSS' : 'BASIC'),
        encashmentDailyDivisor: Number(row.encashment_daily_divisor ?? 30) || 30,
        noticeSalaryBasis: (row.notice_salary_basis === 'GROSS' ? 'GROSS' : 'BASIC'),
        noticeDailyDivisor: Number(row.notice_daily_divisor ?? 30) || 30,
        gratuityEnabled: !!row.gratuity_enabled,
        gratuityMinYears: row.gratuity_min_years != null ? Number(row.gratuity_min_years) : null,
        gratuityDaysPerYear: row.gratuity_days_per_year != null ? Number(row.gratuity_days_per_year) : null,
        gratuityWageBasis: row.gratuity_wage_basis ? String(row.gratuity_wage_basis) : null,
        gratuityRuleVersion: row.gratuity_rule_version ? String(row.gratuity_rule_version) : null,
    };
}
export async function ensureFnfPolicy(collegeId, asOf) {
    if (!(await db.schema.hasTable('hr_fnf_policies'))) {
        throw new Error('hr_fnf_policies missing');
    }
    const date = asOf ?? asISODate(new Date());
    const existing = await db('hr_fnf_policies')
        .where({ college_id: collegeId, is_active: true })
        .andWhere('effective_from', '<=', date)
        .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', date))
        .orderBy('effective_from', 'desc')
        .first();
    if (existing)
        return mapPolicy(existing);
    const [id] = await db('hr_fnf_policies').insert({
        college_id: collegeId,
        effective_from: date,
        is_active: true,
        encashable_leave_codes: JSON.stringify(['EL']),
        max_encashable_days: null,
        encashment_salary_basis: 'BASIC',
        encashment_daily_divisor: 30,
        notice_salary_basis: 'BASIC',
        notice_daily_divisor: 30,
        gratuity_enabled: false,
    });
    const row = await db('hr_fnf_policies').where({ id }).first();
    return mapPolicy(row);
}
export async function getFnfPolicy(actor, asOf) {
    assertHrPermission(actor, 'hr.fnf.view');
    return ensureFnfPolicy(actor.collegeId, asOf);
}
