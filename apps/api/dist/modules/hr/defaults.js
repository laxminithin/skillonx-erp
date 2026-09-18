import { db } from '../../db/index.js';
const DEFAULT_EMPLOYMENT_TYPES = [
    { code: 'PERMANENT', name: 'Permanent' },
    { code: 'PROBATION', name: 'Probation' },
    { code: 'CONTRACT', name: 'Contract' },
    { code: 'VISITING', name: 'Visiting' },
    { code: 'ADHOC', name: 'Ad-hoc' },
    { code: 'PART_TIME', name: 'Part Time' },
    { code: 'TRAINEE', name: 'Trainee' },
    { code: 'CONSULTANT', name: 'Consultant' },
];
const DEFAULT_DESIGNATIONS = [
    { code: 'PROF', name: 'Professor', category: 'FACULTY' },
    { code: 'APROF', name: 'Associate Professor', category: 'FACULTY' },
    { code: 'ASST_PROF', name: 'Assistant Professor', category: 'FACULTY' },
    { code: 'LAB_INSTR', name: 'Lab Instructor', category: 'FACULTY' },
    { code: 'PRINCIPAL', name: 'Principal', category: 'ADMIN' },
    { code: 'DEAN', name: 'Dean', category: 'ADMIN' },
    { code: 'HOD', name: 'HOD', category: 'ADMIN' },
    { code: 'LIBRARIAN', name: 'Librarian', category: 'STAFF' },
    { code: 'ASST_LIBRARIAN', name: 'Assistant Librarian', category: 'STAFF' },
    { code: 'HR_MANAGER', name: 'HR Manager', category: 'HR' },
    { code: 'HR_EXEC', name: 'HR Executive', category: 'HR' },
    { code: 'TRANSPORT_OFFICER', name: 'Transport Officer', category: 'STAFF' },
    { code: 'DRIVER', name: 'Driver', category: 'STAFF' },
    { code: 'WARDEN', name: 'Warden', category: 'STAFF' },
    { code: 'ACCOUNTANT', name: 'Accountant', category: 'STAFF' },
    { code: 'OFFICE_ASST', name: 'Office Assistant', category: 'STAFF' },
    { code: 'TECHNICIAN', name: 'Technician', category: 'STAFF' },
    { code: 'SECURITY', name: 'Security Staff', category: 'STAFF' },
];
const DEFAULT_LEAVE_TYPES = [
    { code: 'CL', name: 'Casual Leave', isPaid: true },
    { code: 'EL', name: 'Earned Leave', isPaid: true },
    { code: 'SL', name: 'Sick Leave', isPaid: true },
    { code: 'ML', name: 'Maternity Leave', isPaid: true },
    { code: 'PL', name: 'Paternity Leave', isPaid: true },
    { code: 'LOP', name: 'Loss of Pay', isPaid: false },
    { code: 'OD', name: 'On Duty', isPaid: true },
    { code: 'COMP_OFF', name: 'Compensatory Off', isPaid: true },
    { code: 'STUDY_LEAVE', name: 'Study Leave', isPaid: true },
    { code: 'SPECIAL_LEAVE', name: 'Special Leave', isPaid: true },
];
const DEFAULT_SALARY_COMPONENTS = [
    { code: 'BASIC', name: 'Basic', componentType: 'EARNING' },
    { code: 'DA', name: 'Dearness Allowance', componentType: 'EARNING' },
    { code: 'HRA', name: 'House Rent Allowance', componentType: 'EARNING' },
    { code: 'SPECIAL', name: 'Special Allowance', componentType: 'EARNING' },
    { code: 'PF', name: 'Provident Fund', componentType: 'DEDUCTION', isStatutory: true },
    { code: 'ESI', name: 'ESI', componentType: 'DEDUCTION', isStatutory: true },
    { code: 'PT', name: 'Professional Tax', componentType: 'DEDUCTION', isStatutory: true },
    { code: 'TDS', name: 'TDS', componentType: 'DEDUCTION', isStatutory: true },
    { code: 'LOP', name: 'Loss of Pay', componentType: 'DEDUCTION' },
];
export async function ensureCollegeHrmsDefaults(collegeId) {
    if (!(await db.schema.hasTable('college_hrms_policies')))
        return;
    const existing = await db('college_hrms_policies').where({ college_id: collegeId }).first();
    if (!existing) {
        await db('college_hrms_policies').insert({
            college_id: collegeId,
            employee_number_series: 'EMP',
            leave_request_series: 'HR/LV',
            emergency_leave_enabled: true,
            academic_coverage_required: true,
            substitute_consent_required: true,
        });
    }
    for (const et of DEFAULT_EMPLOYMENT_TYPES) {
        const found = await db('employment_types').where({ college_id: collegeId, code: et.code }).first();
        if (!found) {
            await db('employment_types').insert({ college_id: collegeId, code: et.code, name: et.name, is_active: true });
        }
    }
    for (const d of DEFAULT_DESIGNATIONS) {
        const found = await db('hr_designations').where({ college_id: collegeId, code: d.code }).first();
        if (!found) {
            await db('hr_designations').insert({
                college_id: collegeId,
                code: d.code,
                name: d.name,
                category: d.category,
                is_active: true,
            });
        }
    }
    for (const lt of DEFAULT_LEAVE_TYPES) {
        const found = await db('hr_leave_types').where({ college_id: collegeId, code: lt.code }).first();
        if (!found) {
            await db('hr_leave_types').insert({
                college_id: collegeId,
                code: lt.code,
                name: lt.name,
                is_paid: lt.isPaid,
                is_active: true,
            });
        }
    }
    for (const sc of DEFAULT_SALARY_COMPONENTS) {
        const found = await db('salary_components').where({ college_id: collegeId, code: sc.code }).first();
        if (!found) {
            await db('salary_components').insert({
                college_id: collegeId,
                code: sc.code,
                name: sc.name,
                component_type: sc.componentType,
                is_statutory: sc.isStatutory ?? false,
                is_active: true,
            });
        }
    }
    const workflow = await db('hr_approval_workflows')
        .where({ college_id: collegeId, code: 'DEFAULT_LEAVE' })
        .first();
    if (!workflow) {
        const [workflowId] = await db('hr_approval_workflows').insert({
            college_id: collegeId,
            code: 'DEFAULT_LEAVE',
            name: 'Default Leave Approval',
            workflow_type: 'LEAVE',
            is_active: true,
        });
        await db('hr_approval_workflow_steps').insert([
            { workflow_id: workflowId, step_order: 1, approver_type: 'REPORTING_MANAGER', is_active: true },
            { workflow_id: workflowId, step_order: 2, approver_type: 'HR', role_code: 'HR_EXECUTIVE', is_active: true },
        ]);
    }
    const schedule = await db('hr_work_schedules').where({ college_id: collegeId, code: 'GENERAL' }).first();
    if (!schedule) {
        await db('hr_work_schedules').insert({
            college_id: collegeId,
            code: 'GENERAL',
            name: 'General Office Hours',
            working_days: JSON.stringify([1, 2, 3, 4, 5, 6]),
            start_time: '09:00:00',
            end_time: '17:00:00',
            grace_minutes: 15,
            half_day_threshold_minutes: 240,
            full_day_minutes: 480,
            weekly_off: JSON.stringify([0]),
            is_active: true,
        });
    }
    if (await db.schema.hasTable('hr_attendance_settings')) {
        const attSettings = await db('hr_attendance_settings').where({ college_id: collegeId }).first();
        const ws = await db('hr_work_schedules').where({ college_id: collegeId, code: 'GENERAL' }).first();
        if (!attSettings) {
            await db('hr_attendance_settings').insert({
                college_id: collegeId,
                default_work_schedule_id: ws?.id ?? null,
                sandwich_leave_policy: 'DISABLED',
                late_marks_count_as_lop: false,
                auto_flag_missing_punch: true,
                missing_punch_grace_hours: 24,
                require_regularization_approval: true,
            });
        }
        const { ensureDefaultShift } = await import('./attendanceConfig.js');
        await ensureDefaultShift(collegeId);
    }
}
export async function getHrmsPolicy(collegeId) {
    await ensureCollegeHrmsDefaults(collegeId);
    const policy = await db('college_hrms_policies').where({ college_id: collegeId }).first();
    return {
        employeeNumberSeries: policy?.employee_number_series ?? 'EMP',
        leaveRequestSeries: policy?.leave_request_series ?? 'HR/LV',
        emergencyLeaveEnabled: !!policy?.emergency_leave_enabled,
        academicCoverageRequired: !!policy?.academic_coverage_required,
    };
}
