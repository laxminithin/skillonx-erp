import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrCollege, assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { nextEmployeeNumber } from './numbers.js';
import { serializeEmployee, getOperationalAssignments } from './employees.js';
import { buildDisplayName, checkOnboardingComplete, closeActiveEmploymentRecord, createEmploymentRecord, ensureOnboardingTemplate, initializeOnboarding, recordServiceEvent, resolveProbationPolicy, validateCollegeRefs, validateDuplicateEmployee, getActiveEmploymentRecord, } from './lifecycleCore.js';
/**
 * Core employee insert without permission check.
 * Used by createEmployee (after assert) and recruitment joining handoff.
 */
export async function createEmployeeRecord(actor, input, existingTrx) {
    await ensureCollegeHrmsDefaults(actor.collegeId);
    await ensureOnboardingTemplate(actor.collegeId);
    await validateCollegeRefs(actor.collegeId, input);
    await validateDuplicateEmployee(actor.collegeId, {
        officialEmail: input.officialEmail,
        facultyUserId: input.facultyUserId,
    });
    const displayName = buildDisplayName(input.firstName, input.middleName, input.lastName, input.title);
    const status = input.employmentStatus ?? 'PRE_JOINING';
    const today = new Date().toISOString().slice(0, 10);
    const hasCategory = await db.schema.hasColumn('employees', 'employee_category');
    const run = async (trx) => {
        const employeeNumber = input.manualEmployeeNumber
            ? input.manualEmployeeNumber
            : await nextEmployeeNumber(trx, actor.collegeId);
        const dupNum = await trx('employees').where({ college_id: actor.collegeId, employee_number: employeeNumber }).first();
        if (dupNum)
            throw new AppError(409, 'Employee number already exists', undefined, 'DUPLICATE_EMPLOYEE_NUMBER');
        let facultyUserId = input.facultyUserId ?? null;
        if (input.authMode === 'CREATE_LOGIN' && input.officialEmail && !facultyUserId) {
            const email = input.officialEmail.toLowerCase().trim();
            const existing = await trx('faculty_users').where({ email }).first();
            if (existing)
                throw new AppError(409, 'Login email already exists');
            const tempPassword = randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            const des = input.designationId
                ? await trx('hr_designations').where({ id: input.designationId }).first()
                : null;
            const [fuId] = await trx('faculty_users').insert({
                college_id: actor.collegeId,
                department_id: input.departmentId ?? null,
                name: displayName,
                email,
                password_hash: passwordHash,
                role: 'FACULTY',
                is_active: true,
                employee_id: employeeNumber,
                phone: input.officialPhone ?? null,
                designation: des?.name ?? null,
            });
            facultyUserId = fuId;
        }
        const [employeeId] = await trx('employees').insert({
            college_id: actor.collegeId,
            employee_number: employeeNumber,
            faculty_user_id: facultyUserId,
            title: input.title ?? null,
            first_name: input.firstName,
            middle_name: input.middleName ?? null,
            last_name: input.lastName,
            display_name: displayName,
            official_email: input.officialEmail?.toLowerCase() ?? null,
            personal_email: input.personalEmail?.toLowerCase() ?? null,
            official_phone: input.officialPhone ?? null,
            personal_phone: input.personalPhone ?? null,
            gender: input.gender ?? null,
            date_of_birth: input.dateOfBirth ?? null,
            date_of_joining: input.dateOfJoining ?? null,
            department_id: input.departmentId ?? null,
            designation_id: input.designationId ?? null,
            employment_type_id: input.employmentTypeId ?? null,
            reporting_manager_employee_id: input.reportingManagerEmployeeId ?? null,
            employment_status: status,
            ...(hasCategory ? { employee_category: input.employeeCategory } : {}),
        });
        await createEmploymentRecord(trx, {
            collegeId: actor.collegeId,
            employeeId,
            employmentTypeId: input.employmentTypeId,
            departmentId: input.departmentId,
            designationId: input.designationId,
            reportingManagerEmployeeId: input.reportingManagerEmployeeId,
            effectiveFrom: input.dateOfJoining ?? today,
            createdBy: actor.facultyUserId || null,
            remarks: 'Initial employment record',
        });
        await recordServiceEvent(trx, {
            collegeId: actor.collegeId,
            employeeId,
            eventType: 'EMPLOYEE_CREATED',
            effectiveDate: today,
            details: { idempotencyKey: `create-${employeeId}` },
            recordedBy: actor.facultyUserId || null,
        });
        await initializeOnboarding(trx, actor.collegeId, employeeId);
        const row = await trx('employees').where({ id: employeeId }).first();
        await recordHrAudit({
            actor,
            action: 'EMPLOYEE_CREATED',
            entityType: 'employees',
            entityId: employeeId,
            after: serializeEmployee(row),
            reason: input.manualEmployeeNumber ? 'Manual employee number override' : null,
        });
        // Avoid nested transactions / lock contention when called under an outer trx (e.g. joining).
        if (!existingTrx) {
            await notifyEmployee({
                employeeId,
                collegeId: actor.collegeId,
                type: 'EMPLOYEE_CREATED',
                title: 'Welcome — employee record created',
                body: `Your employee number is ${employeeNumber}.`,
                dedupeKey: `employee-created-${employeeId}`,
            });
        }
        return serializeEmployee(row);
    };
    if (existingTrx)
        return run(existingTrx);
    return db.transaction(run);
}
export async function createEmployee(actor, input) {
    assertHrPermission(actor, 'hr.employee.manage');
    if (input.manualEmployeeNumber) {
        assertHrPermission(actor, 'hr.employee.manage');
    }
    return createEmployeeRecord(actor, input);
}
export async function updateEmployee(actor, employeeId, input) {
    assertHrPermission(actor, 'hr.employee.manage');
    const existing = await assertHrCollege('employees', employeeId, actor.collegeId);
    await validateCollegeRefs(actor.collegeId, input);
    await validateDuplicateEmployee(actor.collegeId, {
        officialEmail: input.officialEmail,
        facultyUserId: input.facultyUserId,
        excludeId: employeeId,
    });
    const updates = {};
    if (input.firstName)
        updates.first_name = input.firstName;
    if (input.middleName !== undefined)
        updates.middle_name = input.middleName;
    if (input.lastName)
        updates.last_name = input.lastName;
    if (input.title !== undefined)
        updates.title = input.title;
    if (input.officialEmail !== undefined)
        updates.official_email = input.officialEmail?.toLowerCase() ?? null;
    if (input.personalEmail !== undefined)
        updates.personal_email = input.personalEmail?.toLowerCase() ?? null;
    if (input.officialPhone !== undefined)
        updates.official_phone = input.officialPhone;
    if (input.personalPhone !== undefined)
        updates.personal_phone = input.personalPhone;
    if (input.departmentId !== undefined)
        updates.department_id = input.departmentId;
    if (input.designationId !== undefined)
        updates.designation_id = input.designationId;
    if (input.employmentTypeId !== undefined)
        updates.employment_type_id = input.employmentTypeId;
    if (input.reportingManagerEmployeeId !== undefined)
        updates.reporting_manager_employee_id = input.reportingManagerEmployeeId;
    if (input.dateOfJoining !== undefined)
        updates.date_of_joining = input.dateOfJoining;
    if (input.employeeCategory)
        updates.employee_category = input.employeeCategory;
    if (input.gender !== undefined)
        updates.gender = input.gender;
    if (input.dateOfBirth !== undefined)
        updates.date_of_birth = input.dateOfBirth;
    if (input.firstName || input.lastName) {
        updates.display_name = buildDisplayName(String(input.firstName ?? existing.first_name), (input.middleName ?? existing.middle_name), String(input.lastName ?? existing.last_name), (input.title ?? existing.title));
    }
    if (Object.keys(updates).length === 0)
        return serializeEmployee(existing);
    await db('employees').where({ id: employeeId }).update(updates);
    const after = await db('employees').where({ id: employeeId }).first();
    await recordHrAudit({
        actor,
        action: 'EMPLOYEE_UPDATED',
        entityType: 'employees',
        entityId: employeeId,
        before: serializeEmployee(existing),
        after: serializeEmployee(after),
    });
    return serializeEmployee(after);
}
export async function linkEmployeeUser(actor, employeeId, facultyUserId) {
    assertHrPermission(actor, 'hr.employee.manage');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const faculty = await db('faculty_users').where({ id: facultyUserId, college_id: actor.collegeId }).first();
    if (!faculty)
        throw new AppError(400, 'Faculty user not found in this college');
    await validateDuplicateEmployee(actor.collegeId, { facultyUserId, excludeId: employeeId });
    const before = await db('employees').where({ id: employeeId }).first();
    await db('employees').where({ id: employeeId }).update({ faculty_user_id: facultyUserId });
    await recordHrAudit({
        actor,
        action: 'AUTH_LINKED',
        entityType: 'employees',
        entityId: employeeId,
        before: { facultyUserId: before?.faculty_user_id },
        after: { facultyUserId },
    });
    return { employeeId, facultyUserId };
}
export async function markEmployeeJoined(actor, employeeId, opts = {}) {
    assertHrPermission(actor, 'hr.employee.onboard');
    const emp = await assertHrCollege('employees', employeeId, actor.collegeId);
    if (!['PRE_JOINING', 'DRAFT'].includes(String(emp.employment_status))) {
        throw new AppError(400, 'Employee is not in pre-joining state', undefined, 'INVALID_JOIN_STATE');
    }
    if (!emp.department_id || !emp.designation_id || !emp.employment_type_id) {
        throw new AppError(400, 'Department, designation and employment type are required before joining');
    }
    const onboardingCheck = await checkOnboardingComplete(employeeId, opts.overrideOnboarding);
    if (!onboardingCheck.complete) {
        throw new AppError(400, 'Mandatory onboarding tasks incomplete', { missing: onboardingCheck.missing }, 'ONBOARDING_INCOMPLETE');
    }
    const today = emp.date_of_joining ?? new Date().toISOString().slice(0, 10);
    const policy = await resolveProbationPolicy(actor.collegeId, emp);
    const probationEnd = new Date(today);
    probationEnd.setDate(probationEnd.getDate() + policy.defaultDurationDays);
    const probationEndStr = probationEnd.toISOString().slice(0, 10);
    const targetStatus = policy.probationRequired ? 'PROBATION' : 'ACTIVE';
    return db.transaction(async (trx) => {
        await trx('employees').where({ id: employeeId }).update({
            employment_status: targetStatus,
            date_of_joining: today,
            probation_end_date: policy.probationRequired ? probationEndStr : null,
        });
        await closeActiveEmploymentRecord(trx, employeeId, today);
        await createEmploymentRecord(trx, {
            collegeId: actor.collegeId,
            employeeId,
            employmentTypeId: emp.employment_type_id,
            departmentId: emp.department_id,
            designationId: emp.designation_id,
            reportingManagerEmployeeId: emp.reporting_manager_employee_id,
            effectiveFrom: today,
            createdBy: actor.facultyUserId,
            remarks: 'Joined',
        });
        await recordServiceEvent(trx, {
            collegeId: actor.collegeId,
            employeeId,
            eventType: 'JOINED',
            effectiveDate: today,
            details: { idempotencyKey: `joined-${employeeId}-${today}` },
            recordedBy: actor.facultyUserId,
        });
        if (policy.probationRequired) {
            await recordServiceEvent(trx, {
                collegeId: actor.collegeId,
                employeeId,
                eventType: 'PROBATION_STARTED',
                effectiveDate: today,
                details: { endDate: probationEndStr, idempotencyKey: `probation-${employeeId}-${today}` },
                recordedBy: actor.facultyUserId,
            });
            if (await db.schema.hasTable('employee_probation_reviews')) {
                const reviewRow = {
                    college_id: actor.collegeId,
                    employee_id: employeeId,
                    recommendation: 'PENDING',
                    review_date: today,
                };
                if (await db.schema.hasColumn('employee_probation_reviews', 'probation_start')) {
                    reviewRow.probation_start = today;
                    reviewRow.original_end_date = probationEndStr;
                    reviewRow.current_end_date = probationEndStr;
                    reviewRow.status = 'ACTIVE';
                }
                await trx('employee_probation_reviews').insert(reviewRow);
            }
        }
        await trx('employee_onboarding_records').where({ employee_id: employeeId }).update({
            status: 'COMPLETED',
            completed_at: today,
        });
        const schedule = await trx('hr_work_schedules').where({ college_id: actor.collegeId, code: 'GENERAL' }).first();
        if (schedule && (await db.schema.hasTable('employee_work_schedule_assignments'))) {
            const has = await trx('employee_work_schedule_assignments').where({ employee_id: employeeId }).first();
            if (!has) {
                await trx('employee_work_schedule_assignments').insert({
                    employee_id: employeeId,
                    work_schedule_id: schedule.id,
                    effective_from: today,
                });
            }
        }
        await recordHrAudit({
            actor,
            action: 'EMPLOYEE_JOINED',
            entityType: 'employees',
            entityId: employeeId,
            after: { status: targetStatus, dateOfJoining: today },
            reason: opts.reason,
        });
        await notifyEmployee({
            employeeId,
            collegeId: actor.collegeId,
            type: 'JOINING_REMINDER',
            title: 'Welcome aboard',
            body: `You have joined effective ${today}.`,
            dedupeKey: `joined-${employeeId}`,
        });
        const row = await trx('employees').where({ id: employeeId }).first();
        return serializeEmployee(row);
    });
}
export async function getEmployee360(actor, employeeId) {
    await assertHrCollege('employees', employeeId, actor.collegeId);
    assertHrPermission(actor, 'hr.employee.view');
    const emp = await db('employees as e')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
        .leftJoin('employment_types as et', 'et.id', 'e.employment_type_id')
        .leftJoin('employees as mgr', 'mgr.id', 'e.reporting_manager_employee_id')
        .where({ 'e.id': employeeId })
        .select('e.*', 'd.name as department_name', 'des.name as designation_name', 'et.name as employment_type_name', 'mgr.display_name as reporting_manager_name')
        .first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    const canViewSensitive = canViewSensitiveHr(actor);
    const hasEmploymentRecords = await db.schema.hasTable('employee_employment_records');
    const hasContracts = await db.schema.hasTable('employee_contracts');
    const hasProbation = await db.schema.hasTable('employee_probation_reviews');
    const hasEmergency = await db.schema.hasTable('employee_emergency_contacts');
    const hasPersonal = await db.schema.hasTable('employee_personal_profiles');
    const hasCareerActions = await db.schema.hasTable('employee_career_actions');
    const [serviceHistory, operationalAssignments, employmentRecords, onboarding, contracts, probation, separation, documents, emergencyContacts, personalProfile, careerActionsList] = await Promise.all([
        db('employee_service_events').where({ employee_id: employeeId }).orderBy('effective_date', 'desc').limit(100),
        getOperationalAssignments(actor, employeeId),
        hasEmploymentRecords
            ? db('employee_employment_records').where({ employee_id: employeeId }).orderBy('effective_from', 'desc')
            : Promise.resolve([]),
        db('employee_onboarding_records').where({ employee_id: employeeId }).first(),
        hasContracts
            ? db('employee_contracts').where({ employee_id: employeeId }).orderBy('start_date', 'desc')
            : Promise.resolve([]),
        hasProbation
            ? db('employee_probation_reviews').where({ employee_id: employeeId }).orderBy('review_date', 'desc')
            : Promise.resolve([]),
        db('employee_separation_requests').where({ employee_id: employeeId }).orderBy('created_at', 'desc').first(),
        db('employee_documents').where({ employee_id: employeeId }).orderBy('created_at', 'desc'),
        canViewSensitive && hasEmergency
            ? db('employee_emergency_contacts').where({ employee_id: employeeId })
            : Promise.resolve([]),
        canViewSensitive && hasPersonal
            ? db('employee_personal_profiles').where({ employee_id: employeeId }).first()
            : Promise.resolve(null),
        hasCareerActions
            ? db('employee_career_actions').where({ employee_id: employeeId }).orderBy('effective_date', 'desc')
            : Promise.resolve([]),
    ]);
    let facultyLink = null;
    if (emp.faculty_user_id) {
        const fu = await db('faculty_users').where({ id: emp.faculty_user_id }).first();
        facultyLink = fu ? { id: Number(fu.id), email: fu.email, name: fu.name, role: fu.role } : null;
    }
    let onboardingTasks = [];
    if (onboarding) {
        onboardingTasks = await db('employee_onboarding_tasks').where({ onboarding_id: onboarding.id }).orderBy('id');
    }
    const activeRecord = await getActiveEmploymentRecord(employeeId);
    const canViewPayroll = hasHrPermission(actor, 'hr.payroll.view');
    let salaryCompensation = null;
    if (canViewPayroll) {
        const assignments = await db.schema.hasTable('employee_salary_structures')
            ? await db('employee_salary_structures as ess')
                .join('salary_structures as ss', 'ss.id', 'ess.structure_id')
                .where({ 'ess.employee_id': employeeId })
                .select('ess.id', 'ess.effective_from', 'ess.effective_to', 'ess.is_active', 'ss.code', 'ss.name')
                .orderBy('ess.effective_from', 'desc')
                .limit(20)
            : [];
        const recentPayslips = await db.schema.hasTable('payslips')
            ? await db('payslips')
                .where({ employee_id: employeeId, college_id: actor.collegeId })
                .orderBy('created_at', 'desc')
                .limit(6)
                .select('id', 'payslip_number', 'gross_amount', 'net_amount', 'created_at')
            : [];
        salaryCompensation = {
            assignments: assignments.map((a) => ({
                id: Number(a.id),
                structureCode: a.code,
                structureName: a.name,
                effectiveFrom: a.effective_from,
                effectiveTo: a.effective_to,
                isActive: Boolean(a.is_active),
            })),
            recentPayslips: recentPayslips.map((p) => ({
                id: Number(p.id),
                payslipNumber: p.payslip_number,
                grossAmount: Number(p.gross_amount),
                netAmount: Number(p.net_amount),
                createdAt: p.created_at,
            })),
        };
    }
    return {
        ...serializeEmployee(emp),
        employeeCategory: emp.employee_category,
        departmentName: emp.department_name,
        designationName: emp.designation_name,
        employmentTypeName: emp.employment_type_name,
        reportingManagerName: emp.reporting_manager_name,
        noticePeriodDays: emp.notice_period_days,
        lastWorkingDate: emp.last_working_date,
        facultyLink,
        serviceHistory: serviceHistory.map((r) => ({
            id: Number(r.id),
            eventType: r.event_type,
            effectiveDate: r.effective_date,
            details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
            notes: r.notes,
        })),
        operationalAssignments,
        employmentRecords,
        activeEmploymentRecord: activeRecord,
        onboarding: onboarding
            ? { ...onboarding, tasks: onboardingTasks }
            : null,
        contracts,
        probation,
        separation,
        documents,
        emergencyContacts: canViewSensitive ? emergencyContacts : [],
        personalProfile: canViewSensitive && personalProfile
            ? {
                id: Number(personalProfile.id),
                dateOfBirth: personalProfile.date_of_birth,
                gender: personalProfile.gender,
                maritalStatus: personalProfile.marital_status,
                bloodGroup: personalProfile.blood_group,
                nationality: personalProfile.nationality,
                personalEmail: personalProfile.personal_email,
                personalPhone: personalProfile.personal_phone,
                currentAddress: personalProfile.current_address,
                permanentAddress: personalProfile.permanent_address,
                photoReference: personalProfile.photo_reference,
            }
            : null,
        careerActions: careerActionsList,
        // Payroll compensation is permission-gated — HOD/Principal without hr.payroll.view get null
        salaryCompensation,
    };
}
export async function listOnboarding(actor) {
    assertHrPermission(actor, 'hr.employee.onboard');
    const rows = await db('employee_onboarding_records as o')
        .join('employees as e', 'e.id', 'o.employee_id')
        .where({ 'o.college_id': actor.collegeId })
        .select('o.*', 'e.display_name', 'e.employee_number', 'e.employment_status')
        .orderBy('o.updated_at', 'desc');
    return rows;
}
export async function getOnboarding(actor, employeeId) {
    assertHrPermission(actor, 'hr.employee.onboard');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const record = await db('employee_onboarding_records').where({ employee_id: employeeId }).first();
    if (!record)
        throw new AppError(404, 'Onboarding record not found');
    const tasks = await db('employee_onboarding_tasks').where({ onboarding_id: record.id }).orderBy('id');
    return { ...record, tasks };
}
export async function completeOnboardingTask(actor, employeeId, taskId) {
    assertHrPermission(actor, 'hr.employee.onboard');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const record = await db('employee_onboarding_records').where({ employee_id: employeeId }).first();
    if (!record)
        throw new AppError(404, 'Onboarding not found');
    const task = await db('employee_onboarding_tasks').where({ id: taskId, onboarding_id: record.id }).first();
    if (!task)
        throw new AppError(404, 'Task not found');
    await db('employee_onboarding_tasks').where({ id: taskId }).update({ status: 'COMPLETED', completed_at: db.fn.now() });
    await db('employee_onboarding_records').where({ id: record.id }).update({ status: 'IN_PROGRESS' });
    await recordHrAudit({ actor, action: 'ONBOARDING_TASK_COMPLETED', entityType: 'employee_onboarding_tasks', entityId: taskId });
    return { taskId, status: 'COMPLETED' };
}
export async function reopenOnboardingTask(actor, employeeId, taskId, reason) {
    assertHrPermission(actor, 'hr.employee.onboard');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const record = await db('employee_onboarding_records').where({ employee_id: employeeId }).first();
    if (!record)
        throw new AppError(404, 'Onboarding not found');
    await db('employee_onboarding_tasks').where({ id: taskId, onboarding_id: record.id }).update({ status: 'PENDING', completed_at: null });
    await recordHrAudit({ actor, action: 'ONBOARDING_TASK_REOPENED', entityType: 'employee_onboarding_tasks', entityId: taskId, reason });
    return { taskId, status: 'PENDING' };
}
function canViewSensitiveHr(actor) {
    return ['COLLEGE_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'PRINCIPAL'].includes(actor.role);
}
async function assertEmployeePersonalAccess(actor, employeeId) {
    await assertHrCollege('employees', employeeId, actor.collegeId);
    if (canViewSensitiveHr(actor))
        return;
    const emp = await db('employees').where({ id: employeeId }).first();
    if (Number(emp?.faculty_user_id) === actor.facultyUserId)
        return;
    throw new AppError(403, 'Not allowed to access this employee profile');
}
export async function getPersonalProfile(actor, employeeId) {
    await assertEmployeePersonalAccess(actor, employeeId);
    if (!(await db.schema.hasTable('employee_personal_profiles')))
        return null;
    const row = await db('employee_personal_profiles').where({ employee_id: employeeId }).first();
    if (!row)
        return null;
    return {
        id: Number(row.id),
        employeeId,
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        maritalStatus: row.marital_status,
        bloodGroup: row.blood_group,
        nationality: row.nationality,
        personalEmail: row.personal_email,
        personalPhone: row.personal_phone,
        currentAddress: row.current_address,
        permanentAddress: row.permanent_address,
        photoReference: row.photo_reference,
    };
}
export async function upsertPersonalProfile(actor, employeeId, input) {
    assertHrPermission(actor, 'hr.employee.manage');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    if (!(await db.schema.hasTable('employee_personal_profiles'))) {
        throw new AppError(400, 'Personal profile schema not available');
    }
    const existing = await db('employee_personal_profiles').where({ employee_id: employeeId }).first();
    const fieldMap = [
        ['dateOfBirth', 'date_of_birth'],
        ['gender', 'gender'],
        ['maritalStatus', 'marital_status'],
        ['bloodGroup', 'blood_group'],
        ['nationality', 'nationality'],
        ['personalEmail', 'personal_email'],
        ['personalPhone', 'personal_phone'],
        ['currentAddress', 'current_address'],
        ['permanentAddress', 'permanent_address'],
        ['photoReference', 'photo_reference'],
    ];
    const updates = {};
    for (const [key, col] of fieldMap) {
        if (input[key] !== undefined) {
            updates[col] = key === 'personalEmail' && input[key] ? String(input[key]).toLowerCase() : input[key];
        }
    }
    if (existing) {
        if (Object.keys(updates).length) {
            await db('employee_personal_profiles').where({ id: existing.id }).update(updates);
        }
        await recordHrAudit({
            actor,
            action: 'PERSONAL_PROFILE_UPDATED',
            entityType: 'employee_personal_profiles',
            entityId: Number(existing.id),
            before: existing,
            after: updates,
        });
        return getPersonalProfile(actor, employeeId);
    }
    const payload = {
        college_id: actor.collegeId,
        employee_id: employeeId,
        date_of_birth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        marital_status: input.maritalStatus ?? null,
        blood_group: input.bloodGroup ?? null,
        nationality: input.nationality ?? null,
        personal_email: input.personalEmail?.toLowerCase() ?? null,
        personal_phone: input.personalPhone ?? null,
        current_address: input.currentAddress ?? null,
        permanent_address: input.permanentAddress ?? null,
        photo_reference: input.photoReference ?? null,
    };
    const [id] = await db('employee_personal_profiles').insert(payload);
    await recordHrAudit({
        actor,
        action: 'PERSONAL_PROFILE_CREATED',
        entityType: 'employee_personal_profiles',
        entityId: id,
        after: payload,
    });
    return getPersonalProfile(actor, employeeId);
}
export async function listEmergencyContacts(actor, employeeId) {
    await assertEmployeePersonalAccess(actor, employeeId);
    if (!(await db.schema.hasTable('employee_emergency_contacts')))
        return [];
    const rows = await db('employee_emergency_contacts').where({ employee_id: employeeId }).orderBy('is_primary', 'desc').orderBy('id');
    return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        relationship: r.relationship,
        phone: r.phone,
        alternatePhone: r.alternate_phone,
        address: r.address,
        isPrimary: Boolean(r.is_primary),
    }));
}
export async function createEmergencyContact(actor, employeeId, input) {
    assertHrPermission(actor, 'hr.employee.manage');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    if (!(await db.schema.hasTable('employee_emergency_contacts'))) {
        throw new AppError(400, 'Emergency contacts schema not available');
    }
    if (input.isPrimary) {
        await db('employee_emergency_contacts').where({ employee_id: employeeId }).update({ is_primary: false });
    }
    const [id] = await db('employee_emergency_contacts').insert({
        college_id: actor.collegeId,
        employee_id: employeeId,
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        alternate_phone: input.alternatePhone ?? null,
        address: input.address ?? null,
        is_primary: input.isPrimary ?? false,
    });
    await recordHrAudit({
        actor,
        action: 'EMERGENCY_CONTACT_CREATED',
        entityType: 'employee_emergency_contacts',
        entityId: id,
        after: input,
    });
    return { id, ...input };
}
export async function updateEmergencyContact(actor, employeeId, contactId, input) {
    assertHrPermission(actor, 'hr.employee.manage');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const contact = await db('employee_emergency_contacts').where({ id: contactId, employee_id: employeeId }).first();
    if (!contact)
        throw new AppError(404, 'Emergency contact not found');
    if (input.isPrimary) {
        await db('employee_emergency_contacts').where({ employee_id: employeeId }).update({ is_primary: false });
    }
    const updates = {};
    if (input.name)
        updates.name = input.name;
    if (input.relationship)
        updates.relationship = input.relationship;
    if (input.phone)
        updates.phone = input.phone;
    if (input.alternatePhone !== undefined)
        updates.alternate_phone = input.alternatePhone;
    if (input.address !== undefined)
        updates.address = input.address;
    if (input.isPrimary !== undefined)
        updates.is_primary = input.isPrimary;
    if (Object.keys(updates).length) {
        await db('employee_emergency_contacts').where({ id: contactId }).update(updates);
    }
    await recordHrAudit({
        actor,
        action: 'EMERGENCY_CONTACT_UPDATED',
        entityType: 'employee_emergency_contacts',
        entityId: contactId,
        before: contact,
        after: updates,
    });
    const row = await db('employee_emergency_contacts').where({ id: contactId }).first();
    return {
        id: contactId,
        name: row.name,
        relationship: row.relationship,
        phone: row.phone,
        alternatePhone: row.alternate_phone,
        address: row.address,
        isPrimary: Boolean(row.is_primary),
    };
}
export async function deleteEmergencyContact(actor, employeeId, contactId) {
    assertHrPermission(actor, 'hr.employee.manage');
    await assertHrCollege('employees', employeeId, actor.collegeId);
    const contact = await db('employee_emergency_contacts').where({ id: contactId, employee_id: employeeId }).first();
    if (!contact)
        throw new AppError(404, 'Emergency contact not found');
    await db('employee_emergency_contacts').where({ id: contactId }).delete();
    await recordHrAudit({
        actor,
        action: 'EMERGENCY_CONTACT_DELETED',
        entityType: 'employee_emergency_contacts',
        entityId: contactId,
        before: contact,
    });
    return { id: contactId, deleted: true };
}
