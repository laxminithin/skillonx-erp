import { db } from '../../db/index.js';
import { assertHrPermission } from './access.js';
import { notifyEmployee } from './notifications.js';
import { completeSeparation, checkClearanceComplete } from './lifecycleSeparation.js';
import * as career from './lifecycleCareer.js';
let separationLwdColumn = null;
async function separationLwdField() {
    if (separationLwdColumn)
        return separationLwdColumn;
    if (await db.schema.hasColumn('employee_separation_requests', 'last_working_date')) {
        separationLwdColumn = 'last_working_date';
    }
    else {
        separationLwdColumn = 'approved_last_working_date';
    }
    return separationLwdColumn;
}
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}
async function applyCareerAction(action, systemActor) {
    const payload = (typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload ?? {});
    const employeeId = Number(action.employee_id);
    const effectiveDate = String(action.effective_date);
    const reason = action.reason != null ? String(action.reason) : undefined;
    if (action.action_type === 'PROMOTION') {
        await career.promoteEmployee(systemActor, employeeId, {
            newDesignationId: Number(payload.newDesignationId),
            effectiveDate,
            reason,
        });
    }
    else if (action.action_type === 'TRANSFER') {
        await career.transferEmployee(systemActor, employeeId, {
            toDepartmentId: Number(payload.toDepartmentId),
            effectiveDate,
            newReportingManagerEmployeeId: payload.newReportingManagerEmployeeId != null ? Number(payload.newReportingManagerEmployeeId) : null,
            newDesignationId: payload.newDesignationId != null ? Number(payload.newDesignationId) : null,
            reason,
        });
    }
    else if (action.action_type === 'REPORTING_CHANGE') {
        await career.changeReportingManager(systemActor, employeeId, {
            reportingManagerEmployeeId: payload.reportingManagerEmployeeId != null ? Number(payload.reportingManagerEmployeeId) : null,
            effectiveDate,
            reason,
        });
    }
    else if (action.action_type === 'DESIGNATION_CHANGE') {
        await career.changeDesignation(systemActor, employeeId, {
            newDesignationId: Number(payload.newDesignationId),
            effectiveDate,
            reason: reason ?? 'Scheduled designation change',
        });
    }
    await db('employee_career_actions').where({ id: action.id }).update({
        status: 'APPLIED',
        applied_at: db.fn.now(),
    });
}
export async function runHrLifecycleJobs(collegeId) {
    const today = todayISO();
    const results = {
        careerActionsApplied: 0,
        separationsFinalized: 0,
        contractsMarkedExpiring: 0,
        probationAlerts: 0,
        contractAlerts: 0,
        retirementAlerts: 0,
    };
    const systemActor = {
        facultyUserId: 0,
        collegeId: collegeId ?? 0,
        departmentId: null,
        role: 'COLLEGE_ADMIN',
        name: 'System',
    };
    if (await db.schema.hasTable('employee_career_actions')) {
        let q = db('employee_career_actions').where({ status: 'SCHEDULED' }).andWhere('effective_date', '<=', today);
        if (collegeId)
            q = q.andWhere({ college_id: collegeId });
        const actions = await q;
        for (const action of actions) {
            systemActor.collegeId = Number(action.college_id);
            try {
                await applyCareerAction(action, systemActor);
                results.careerActionsApplied++;
            }
            catch {
                /* idempotent skip on failure */
            }
        }
    }
    const lwdField = await separationLwdField();
    const sepQ = db('employee_separation_requests')
        .where({ status: 'CLEARANCE_PENDING' })
        .whereNotNull(lwdField)
        .andWhere(lwdField, '<=', today);
    if (collegeId)
        sepQ.andWhere({ college_id: collegeId });
    const separations = await sepQ;
    for (const sep of separations) {
        systemActor.collegeId = Number(sep.college_id);
        const clearance = await checkClearanceComplete(Number(sep.id));
        if (!clearance.complete)
            continue;
        try {
            await completeSeparation(systemActor, Number(sep.id));
            results.separationsFinalized++;
        }
        catch {
            /* skip */
        }
    }
    if (await db.schema.hasTable('employee_contracts')) {
        let cq = db('employee_contracts').where({ status: 'ACTIVE' }).andWhere('end_date', '<=', addDays(today, 30));
        if (collegeId)
            cq = cq.andWhere({ college_id: collegeId });
        const contracts = await cq;
        for (const c of contracts) {
            if (c.status !== 'EXPIRING') {
                await db('employee_contracts').where({ id: c.id }).update({ status: 'EXPIRING', renewal_status: 'RENEWAL_PENDING' });
                results.contractsMarkedExpiring++;
            }
            await notifyEmployee({
                employeeId: Number(c.employee_id),
                collegeId: Number(c.college_id),
                type: 'CONTRACT_EXPIRY',
                title: 'Contract expiring soon',
                body: `Contract ends ${c.end_date}`,
                dedupeKey: `contract-expiry-${c.id}-${today.slice(0, 7)}`,
            });
            results.contractAlerts++;
        }
    }
    if (await db.schema.hasTable('employee_probation_reviews') && (await db.schema.hasColumn('employee_probation_reviews', 'current_end_date'))) {
        let pq = db('employee_probation_reviews').andWhere('current_end_date', '<=', addDays(today, 30));
        if (await db.schema.hasColumn('employee_probation_reviews', 'status')) {
            pq = pq.whereIn('status', ['ACTIVE', 'REVIEW_DUE']);
        }
        if (collegeId)
            pq = pq.andWhere({ college_id: collegeId });
        const reviews = await pq;
        for (const r of reviews) {
            await notifyEmployee({
                employeeId: Number(r.employee_id),
                collegeId: Number(r.college_id),
                type: 'PROBATION_DUE',
                title: 'Probation review due',
                dedupeKey: `prob-due-${r.id}-${today.slice(0, 7)}`,
            });
            results.probationAlerts++;
        }
    }
    let eq = db('employees').whereNotNull('retirement_date').andWhere('retirement_date', '<=', addDays(today, 90));
    if (collegeId)
        eq = eq.andWhere({ college_id: collegeId });
    const retiring = await eq;
    for (const e of retiring) {
        await notifyEmployee({
            employeeId: Number(e.id),
            collegeId: Number(e.college_id),
            type: 'RETIREMENT_REMINDER',
            title: 'Upcoming retirement',
            dedupeKey: `retire-${e.id}`,
        });
        results.retirementAlerts++;
    }
    return results;
}
export async function hrActionQueue(actor) {
    assertHrPermission(actor, 'hr.employee.view');
    const collegeId = actor.collegeId;
    const today = todayISO();
    const items = [];
    const probationDue = await db('employee_probation_reviews')
        .where({ college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'REVIEW_DUE'])
        .andWhere('current_end_date', '<=', addDays(today, 14));
    for (const p of probationDue) {
        items.push({
            type: 'PROBATION_REVIEW_DUE',
            priority: String(p.current_end_date) <= today ? 'OVERDUE' : 'UPCOMING',
            label: `Probation review due`,
            employeeId: Number(p.employee_id),
            relatedId: Number(p.id),
        });
    }
    const onboarding = await db('employee_onboarding_records')
        .where({ college_id: collegeId })
        .whereIn('status', ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_HR']);
    for (const o of onboarding) {
        items.push({
            type: 'ONBOARDING_PENDING',
            priority: 'NORMAL',
            label: 'Onboarding incomplete',
            employeeId: Number(o.employee_id),
            relatedId: Number(o.id),
        });
    }
    const separations = await db('employee_separation_requests')
        .where({ college_id: collegeId })
        .whereIn('status', ['SUBMITTED', 'HR_REVIEW', 'CLEARANCE_PENDING']);
    for (const s of separations) {
        items.push({
            type: 'SEPARATION_PENDING',
            priority: s.status === 'CLEARANCE_PENDING' ? 'DUE_TODAY' : 'NORMAL',
            label: `Separation ${s.status}`,
            employeeId: Number(s.employee_id),
            relatedId: Number(s.id),
        });
    }
    if (await db.schema.hasTable('employee_career_actions')) {
        const scheduled = await db('employee_career_actions')
            .where({ college_id: collegeId, status: 'SCHEDULED', effective_date: today });
        for (const a of scheduled) {
            items.push({
                type: `${a.action_type}_EFFECTIVE_TODAY`,
                priority: 'DUE_TODAY',
                label: `${a.action_type} effective today`,
                employeeId: Number(a.employee_id),
                relatedId: Number(a.id),
            });
        }
    }
    const priorityOrder = { OVERDUE: 0, DUE_TODAY: 1, UPCOMING: 2, NORMAL: 3 };
    items.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
    return items;
}
export async function enhancedHrAdminDashboard(actor) {
    assertHrPermission(actor, 'hr.employee.view');
    const collegeId = actor.collegeId;
    const today = todayISO();
    const hasCategory = await db.schema.hasColumn('employees', 'employee_category');
    const hasContractsTable = await db.schema.hasTable('employee_contracts');
    const counts = async (where) => Number((await db('employees').where({ college_id: collegeId, ...where }).count('* as c').first())?.c ?? 0);
    const [total, faculty, nonTeaching, active, probation, onNotice, preJoining, contractsExpiring, incompleteOnboarding, clearancePending,] = await Promise.all([
        counts({}),
        hasCategory ? counts({ employee_category: 'FACULTY' }) : Promise.resolve(0),
        hasCategory ? counts({ employee_category: 'NON_TEACHING' }) : Promise.resolve(0),
        counts({ employment_status: 'ACTIVE' }),
        counts({ employment_status: 'PROBATION' }),
        counts({ employment_status: 'ON_NOTICE' }),
        counts({ employment_status: 'PRE_JOINING' }),
        hasContractsTable
            ? db('employee_contracts')
                .where({ college_id: collegeId, status: 'ACTIVE' })
                .andWhere('end_date', '<=', addDays(today, 90))
                .count('* as c')
                .first()
                .then((r) => Number(r?.c ?? 0))
            : Promise.resolve(0),
        db('employee_onboarding_records')
            .where({ college_id: collegeId })
            .whereNot('status', 'COMPLETED')
            .count('* as c')
            .first()
            .then((r) => Number(r?.c ?? 0))
            .catch(() => 0),
        db('employee_separation_requests')
            .where({ college_id: collegeId, status: 'CLEARANCE_PENDING' })
            .count('* as c')
            .first()
            .then((r) => Number(r?.c ?? 0))
            .catch(() => 0),
    ]);
    const actionQueue = await hrActionQueue(actor);
    return {
        totalEmployees: total,
        facultyEmployees: faculty,
        nonTeachingEmployees: nonTeaching,
        activeEmployees: active,
        probationEmployees: probation,
        employeesOnNotice: onNotice,
        joiningSoon: preJoining,
        contractsExpiring,
        incompleteOnboarding,
        clearancePending,
        openHrActions: actionQueue.length,
        actionQueue: actionQueue.slice(0, 20),
    };
}
export async function hrReports(actor, reportType) {
    assertHrPermission(actor, 'hr.report.view');
    const collegeId = actor.collegeId;
    let q = db('employees as e')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
        .leftJoin('employment_types as et', 'et.id', 'e.employment_type_id')
        .where({ 'e.college_id': collegeId })
        .select('e.*', 'd.name as department_name', 'des.name as designation_name', 'et.name as employment_type_name');
    switch (reportType) {
        case 'active':
            q = q.andWhere('e.employment_status', 'ACTIVE');
            break;
        case 'faculty':
            q = q.andWhere('e.employee_category', 'FACULTY');
            break;
        case 'non-teaching':
            q = q.andWhere('e.employee_category', 'NON_TEACHING');
            break;
        case 'probation':
            q = q.andWhere('e.employment_status', 'PROBATION');
            break;
        case 'on-notice':
            q = q.andWhere('e.employment_status', 'ON_NOTICE');
            break;
        case 'separated':
            q = q.whereIn('e.employment_status', ['SEPARATED', 'RETIRED', 'TERMINATED']);
            break;
        default:
            break;
    }
    const rows = await q.orderBy('e.display_name');
    return {
        reportType,
        generatedAt: new Date().toISOString(),
        count: rows.length,
        rows: rows.map((r) => ({
            employeeNumber: r.employee_number,
            displayName: r.display_name,
            department: r.department_name,
            designation: r.designation_name,
            employmentType: r.employment_type_name,
            status: r.employment_status,
            category: r.employee_category,
            dateOfJoining: r.date_of_joining,
        })),
    };
}
