import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordHrAudit } from './audit.js';
import { serializeEmployee } from './employees.js';
export const STATUS_TRANSITIONS = {
    DRAFT: ['PRE_JOINING', 'INACTIVE'],
    PRE_JOINING: ['ACTIVE', 'PROBATION', 'INACTIVE'],
    PROBATION: ['CONFIRMED', 'ACTIVE', 'SEPARATED', 'SUSPENDED'],
    ACTIVE: ['ON_NOTICE', 'SUSPENDED', 'ON_LONG_LEAVE', 'SEPARATED', 'RETIRED', 'TERMINATED', 'CONFIRMED'],
    CONFIRMED: ['ON_NOTICE', 'SUSPENDED', 'ON_LONG_LEAVE', 'SEPARATED', 'RETIRED', 'TERMINATED', 'ACTIVE'],
    ON_NOTICE: ['SEPARATED', 'ACTIVE', 'RETIRED', 'TERMINATED'],
    SUSPENDED: ['ACTIVE', 'CONFIRMED', 'SEPARATED', 'TERMINATED'],
    ON_LONG_LEAVE: ['ACTIVE', 'CONFIRMED'],
    SEPARATED: [],
    RETIRED: [],
    TERMINATED: [],
    INACTIVE: ['PRE_JOINING', 'DRAFT'],
};
export function assertStatusTransition(from, to) {
    const allowed = STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
        throw new AppError(400, `Cannot transition employment status from ${from} to ${to}`, undefined, 'INVALID_STATUS_TRANSITION');
    }
}
export async function recordServiceEvent(trx, params) {
    const existing = await trx('employee_service_events')
        .where({
        employee_id: params.employeeId,
        event_type: params.eventType,
        effective_date: params.effectiveDate,
    })
        .whereRaw("JSON_UNQUOTE(JSON_EXTRACT(details, '$.idempotencyKey')) = ?", [
        params.details?.idempotencyKey ?? '',
    ])
        .first()
        .catch(() => null);
    if (existing && params.details?.idempotencyKey)
        return existing;
    const [id] = await trx('employee_service_events').insert({
        college_id: params.collegeId,
        employee_id: params.employeeId,
        event_type: params.eventType,
        effective_date: params.effectiveDate,
        details: params.details ? JSON.stringify(params.details) : null,
        notes: params.notes ?? null,
        recorded_by: params.recordedBy ?? null,
    });
    return { id };
}
export async function closeActiveEmploymentRecord(trx, employeeId, effectiveTo) {
    if (!(await db.schema.hasTable('employee_employment_records')))
        return;
    await trx('employee_employment_records')
        .where({ employee_id: employeeId })
        .whereNull('effective_to')
        .update({ effective_to: effectiveTo, status: 'CLOSED' });
}
export async function createEmploymentRecord(trx, params) {
    if (!(await db.schema.hasTable('employee_employment_records')))
        return null;
    const [id] = await trx('employee_employment_records').insert({
        college_id: params.collegeId,
        employee_id: params.employeeId,
        employment_type_id: params.employmentTypeId ?? null,
        department_id: params.departmentId ?? null,
        designation_id: params.designationId ?? null,
        reporting_manager_employee_id: params.reportingManagerEmployeeId ?? null,
        effective_from: params.effectiveFrom,
        effective_to: null,
        status: params.status ?? 'ACTIVE',
        created_by: params.createdBy ?? null,
        remarks: params.remarks ?? null,
    });
    return id;
}
export async function resolveProbationPolicy(collegeId, employee) {
    if (!(await db.schema.hasTable('hr_probation_policies'))) {
        return { probationRequired: true, defaultDurationDays: 180, reviewBeforeDays: 30, extensionsAllowed: true, maxExtensions: 2 };
    }
    let policy = await db('hr_probation_policies')
        .where({ college_id: collegeId, is_active: true })
        .where(function () {
        this.where({ employee_category: employee.employee_category }).orWhereNull('employee_category');
    })
        .orderByRaw('employee_category IS NULL ASC')
        .first();
    if (!policy && employee.employment_type_id) {
        policy = await db('hr_probation_policies')
            .where({ college_id: collegeId, employment_type_id: employee.employment_type_id, is_active: true })
            .first();
    }
    return {
        probationRequired: policy?.probation_required ?? true,
        defaultDurationDays: Number(policy?.default_duration_days ?? 180),
        reviewBeforeDays: Number(policy?.review_before_days ?? 30),
        extensionsAllowed: policy?.extensions_allowed ?? true,
        maxExtensions: Number(policy?.max_extensions ?? 2),
    };
}
export async function ensureOnboardingTemplate(collegeId) {
    if (!(await db.schema.hasTable('hr_onboarding_template_items')))
        return;
    const defaults = [
        { task_code: 'EMP_RECORD', title: 'Employee record created', owner_role: 'HR', is_mandatory: true, sort_order: 1 },
        { task_code: 'PERSONAL_DETAILS', title: 'Personal details submitted', owner_role: 'EMPLOYEE', is_mandatory: false, sort_order: 2 },
        { task_code: 'EMERGENCY_CONTACT', title: 'Emergency contact added', owner_role: 'EMPLOYEE', is_mandatory: false, sort_order: 3 },
        { task_code: 'DEPT_ASSIGNED', title: 'Department assigned', owner_role: 'HR', is_mandatory: true, sort_order: 4 },
        { task_code: 'DESIGNATION_ASSIGNED', title: 'Designation assigned', owner_role: 'HR', is_mandatory: true, sort_order: 5 },
        { task_code: 'LOGIN_LINKED', title: 'System login linked', owner_role: 'IT/ADMIN', is_mandatory: false, sort_order: 6 },
        { task_code: 'WORK_SCHEDULE', title: 'Work schedule assigned', owner_role: 'HR', is_mandatory: false, sort_order: 7 },
        { task_code: 'ORIENTATION', title: 'Orientation completed', owner_role: 'HR', is_mandatory: false, sort_order: 8 },
    ];
    for (const item of defaults) {
        const found = await db('hr_onboarding_template_items').where({ college_id: collegeId, task_code: item.task_code }).first();
        if (!found)
            await db('hr_onboarding_template_items').insert({ college_id: collegeId, ...item });
    }
}
export async function initializeOnboarding(trx, collegeId, employeeId) {
    if (!(await db.schema.hasTable('employee_onboarding_records')))
        return null;
    const existing = await trx('employee_onboarding_records').where({ employee_id: employeeId }).first();
    if (existing)
        return existing.id;
    const [onboardingId] = await trx('employee_onboarding_records').insert({
        college_id: collegeId,
        employee_id: employeeId,
        status: 'NOT_STARTED',
    });
    if (await db.schema.hasTable('hr_onboarding_template_items')) {
        const items = await trx('hr_onboarding_template_items').where({ college_id: collegeId, is_active: true }).orderBy('sort_order');
        for (const item of items) {
            const row = {
                onboarding_id: onboardingId,
                task_code: item.task_code,
                title: item.title,
                status: item.task_code === 'EMP_RECORD' ? 'COMPLETED' : 'PENDING',
                completed_at: item.task_code === 'EMP_RECORD' ? trx.fn.now() : null,
            };
            if (await db.schema.hasColumn('employee_onboarding_tasks', 'owner_role'))
                row.owner_role = item.owner_role;
            if (await db.schema.hasColumn('employee_onboarding_tasks', 'is_mandatory'))
                row.is_mandatory = item.is_mandatory;
            await trx('employee_onboarding_tasks').insert(row);
        }
    }
    return onboardingId;
}
export async function checkOnboardingComplete(employeeId, allowOverride = false) {
    const onboarding = await db('employee_onboarding_records').where({ employee_id: employeeId }).first();
    if (!onboarding)
        return { complete: true, missing: [] };
    const tasks = await db('employee_onboarding_tasks').where({ onboarding_id: onboarding.id });
    const hasMandatory = await db.schema.hasColumn('employee_onboarding_tasks', 'is_mandatory');
    const missing = tasks
        .filter((t) => (hasMandatory ? t.is_mandatory : t.task_code !== 'EMP_RECORD') && t.status !== 'COMPLETED')
        .map((t) => String(t.title));
    return { complete: missing.length === 0 || allowOverride, missing };
}
export async function transitionEmploymentStatus(trx, actor, employeeId, toStatus, effectiveDate, eventType, details, reason) {
    const emp = await trx('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    assertStatusTransition(String(emp.employment_status), toStatus);
    const before = serializeEmployee(emp);
    await trx('employees').where({ id: employeeId }).update({ employment_status: toStatus });
    await recordServiceEvent(trx, {
        collegeId: actor.collegeId,
        employeeId,
        eventType,
        effectiveDate,
        details,
        recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({
        actor,
        action: 'EMPLOYMENT_STATUS_CHANGED',
        entityType: 'employees',
        entityId: employeeId,
        before,
        after: { ...before, employmentStatus: toStatus },
        reason,
    });
}
export async function validateDuplicateEmployee(collegeId, params) {
    if (params.officialEmail) {
        let q = db('employees').where({ college_id: collegeId, official_email: params.officialEmail.toLowerCase() });
        if (params.excludeId)
            q = q.whereNot('id', params.excludeId);
        const dup = await q.first();
        if (dup)
            throw new AppError(409, 'An employee with this official email already exists', undefined, 'DUPLICATE_EMAIL');
    }
    if (params.facultyUserId) {
        let q = db('employees').where({ faculty_user_id: params.facultyUserId });
        if (params.excludeId)
            q = q.whereNot('id', params.excludeId);
        const dup = await q.first();
        if (dup)
            throw new AppError(409, 'Faculty user is already linked to another employee', undefined, 'DUPLICATE_FACULTY_LINK');
    }
}
export async function validateCollegeRefs(collegeId, params) {
    if (params.departmentId) {
        const d = await db('departments').where({ id: params.departmentId, college_id: collegeId }).first();
        if (!d)
            throw new AppError(400, 'Invalid department for this college');
    }
    if (params.designationId) {
        const d = await db('hr_designations').where({ id: params.designationId, college_id: collegeId }).first();
        if (!d)
            throw new AppError(400, 'Invalid designation for this college');
    }
    if (params.employmentTypeId) {
        const d = await db('employment_types').where({ id: params.employmentTypeId, college_id: collegeId }).first();
        if (!d)
            throw new AppError(400, 'Invalid employment type for this college');
    }
    if (params.reportingManagerEmployeeId) {
        const d = await db('employees').where({ id: params.reportingManagerEmployeeId, college_id: collegeId }).first();
        if (!d)
            throw new AppError(400, 'Invalid reporting manager for this college');
    }
}
export function buildDisplayName(first, middle, last, title) {
    const name = [first, middle, last].filter(Boolean).join(' ');
    return title ? `${title} ${name}`.trim() : name;
}
export async function getActiveEmploymentRecord(employeeId) {
    if (!(await db.schema.hasTable('employee_employment_records')))
        return null;
    return db('employee_employment_records')
        .where({ employee_id: employeeId })
        .whereNull('effective_to')
        .orderBy('effective_from', 'desc')
        .first();
}
