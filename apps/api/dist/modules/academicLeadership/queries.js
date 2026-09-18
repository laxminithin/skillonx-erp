import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assignFacultyToSubject, removeFacultyFromSubject } from '../academicClasses/service.js';
import { computePlanProgress } from '../lessonPlans/progress.js';
import { assertDepartmentScope, assertLeadershipCapability, loadDepartmentInCollege, resolveLeadershipContext, todayISO, } from './leadership.js';
import { listAssignments } from './assignments.js';
function ymd(value) {
    if (!value)
        return '';
    const s = String(value);
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s.slice(0, 10);
}
// The database schema does not change during a process lifetime, yet the
// per-department leadership queries call `tableExists` dozens of times per
// request (each a `information_schema` round-trip). Memoize the lookup so the
// existence check is paid once per table, not once per invocation.
const tableExistsCache = new Map();
function tableExists(name) {
    let cached = tableExistsCache.get(name);
    if (!cached) {
        cached = db.schema
            .hasTable(name)
            .catch(() => false)
            .then((exists) => {
            // Only memoize a definitive positive; a transient failure is retried.
            if (!exists)
                tableExistsCache.delete(name);
            return exists;
        });
        tableExistsCache.set(name, cached);
    }
    return cached;
}
export async function resolveScopedDepartmentId(actor, requestedDepartmentId) {
    const { actor: enriched, ctx } = await assertLeadershipCapability(actor, 'academic.department.view');
    // Executive leadership (Management / Chairman) is institution-wide, like the
    // Principal — never a single-department (HOD) scope.
    const isExecutive = actor.role === 'MANAGEMENT' || actor.role === 'CHAIRMAN';
    if (ctx.isPrincipal || isExecutive || isAdminRole(actor.role)) {
        if (requestedDepartmentId) {
            await loadDepartmentInCollege(requestedDepartmentId, actor.collegeId);
            return { departmentId: requestedDepartmentId, actor: enriched, ctx, collegeWide: requestedDepartmentId == null };
        }
        return { departmentId: null, actor: enriched, ctx, collegeWide: true };
    }
    if (requestedDepartmentId) {
        assertDepartmentScope(ctx, requestedDepartmentId, actor.role);
        return { departmentId: requestedDepartmentId, actor: enriched, ctx, collegeWide: false };
    }
    if (ctx.hodDepartmentIds.length === 1) {
        return { departmentId: ctx.hodDepartmentIds[0], actor: enriched, ctx, collegeWide: false };
    }
    if (ctx.hodDepartmentIds.length > 1) {
        return { departmentId: ctx.hodDepartmentIds[0], actor: enriched, ctx, collegeWide: false };
    }
    throw new AppError(403, 'No department leadership scope is active', undefined, 'DEPARTMENT_SCOPE');
}
function employeeBaseQuery(collegeId, departmentId) {
    let q = db('employees as e')
        .leftJoin('hr_designations as dsg', 'dsg.id', 'e.designation_id')
        .leftJoin('departments as d', 'd.id', 'e.department_id')
        .where('e.college_id', collegeId)
        .whereIn('e.employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE']);
    if (departmentId != null)
        q = q.andWhere('e.department_id', departmentId);
    return q;
}
async function facultyCount(collegeId, departmentId) {
    const row = await employeeBaseQuery(collegeId, departmentId)
        .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
        .countDistinct({ c: 'e.id' })
        .first();
    return Number(row?.c ?? 0);
}
async function studentCount(collegeId, departmentId) {
    if (!(await tableExists('academic_class_enrollments')))
        return 0;
    let q = db('academic_class_enrollments as en')
        .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
        .where({ 'en.college_id': collegeId, 'en.status': 'APPROVED' });
    if (departmentId != null)
        q = q.andWhere('ac.department_id', departmentId);
    const row = await q.countDistinct({ c: 'en.student_id' }).first();
    return Number(row?.c ?? 0);
}
async function programCount(collegeId, departmentId) {
    if (!(await tableExists('programs')))
        return 0;
    let q = db('programs').where({ college_id: collegeId });
    if (departmentId != null)
        q = q.andWhere('department_id', departmentId);
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function classCount(collegeId, departmentId) {
    if (!(await tableExists('academic_classes')))
        return 0;
    let q = db('academic_classes').where({ college_id: collegeId });
    if (departmentId != null)
        q = q.andWhere('department_id', departmentId);
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function subjectCount(collegeId, departmentId) {
    if (!(await tableExists('academic_class_subjects')))
        return 0;
    let q = db('academic_class_subjects as s')
        .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .where('ac.college_id', collegeId);
    if (departmentId != null)
        q = q.andWhere('ac.department_id', departmentId);
    const row = await q.countDistinct({ c: 's.course_id' }).first();
    return Number(row?.c ?? 0);
}
async function todayClassCount(collegeId, departmentId) {
    if (!(await tableExists('timetable_slots')))
        return 0;
    const day = new Date().getDay();
    let q = db('timetable_slots as s')
        .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .where({ 's.college_id': collegeId, 's.status': 'ACTIVE', 's.day_of_week': day });
    if (departmentId != null)
        q = q.andWhere('ac.department_id', departmentId);
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function facultyIds(collegeId, departmentId) {
    const rows = await employeeBaseQuery(collegeId, departmentId)
        .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
        .select('e.id');
    return rows.map((r) => Number(r.id));
}
async function facultyAbsentToday(collegeId, departmentId) {
    if (!(await tableExists('employee_attendance_records')))
        return 0;
    const ids = await facultyIds(collegeId, departmentId);
    if (!ids.length)
        return 0;
    const row = await db('employee_attendance_records')
        .where({ college_id: collegeId, attendance_date: todayISO() })
        .whereIn('employee_id', ids)
        .whereIn('attendance_status', ['ABSENT', 'MISSING_PUNCH'])
        .count({ c: '*' })
        .first();
    return Number(row?.c ?? 0);
}
async function facultyOnApprovedLeave(collegeId, departmentId) {
    const ids = await facultyIds(collegeId, departmentId);
    if (!ids.length)
        return 0;
    const today = todayISO();
    const row = await db('hr_leave_requests')
        .where({ college_id: collegeId, status: 'APPROVED' })
        .whereIn('employee_id', ids)
        .andWhere('from_date', '<=', today)
        .andWhere('to_date', '>=', today)
        .count({ c: '*' })
        .first();
    return Number(row?.c ?? 0);
}
async function pendingFacultyLeave(collegeId, departmentId, statuses) {
    let q = db('hr_leave_requests as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .where('r.college_id', collegeId)
        .whereIn('r.status', statuses);
    if (departmentId != null)
        q = q.andWhere('e.department_id', departmentId);
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function pendingFacultyLeaveByDepartment(collegeId, statuses) {
    const out = new Map();
    const rows = await db('hr_leave_requests as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .where('r.college_id', collegeId)
        .whereIn('r.status', statuses)
        .select('e.department_id')
        .count({ c: '*' })
        .groupBy('e.department_id');
    let total = 0;
    for (const raw of rows) {
        const row = raw;
        const departmentId = row.department_id == null ? null : Number(row.department_id);
        const count = Number(row.c ?? 0);
        out.set(departmentId, count);
        total += count;
    }
    out.set(null, total);
    return out;
}
async function facultyCountByDepartment(collegeId) {
    const out = new Map();
    const rows = await employeeBaseQuery(collegeId, null)
        .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
        .select('e.department_id')
        .countDistinct({ c: 'e.id' })
        .groupBy('e.department_id');
    let total = 0;
    for (const raw of rows) {
        const row = raw;
        const departmentId = row.department_id == null ? null : Number(row.department_id);
        const count = Number(row.c ?? 0);
        out.set(departmentId, count);
        total += count;
    }
    out.set(null, total);
    return out;
}
async function studentCountByDepartment(collegeId) {
    const out = new Map();
    if (!(await tableExists('academic_class_enrollments')))
        return out;
    const rows = await db('academic_class_enrollments as en')
        .join('academic_classes as ac', 'ac.id', 'en.academic_class_id')
        .where({ 'en.college_id': collegeId, 'en.status': 'APPROVED' })
        .select('ac.department_id')
        .countDistinct({ c: 'en.student_id' })
        .groupBy('ac.department_id');
    let total = 0;
    for (const raw of rows) {
        const row = raw;
        const departmentId = row.department_id == null ? null : Number(row.department_id);
        const count = Number(row.c ?? 0);
        out.set(departmentId, count);
        total += count;
    }
    out.set(null, total);
    return out;
}
async function facultyAttendancePct(collegeId, departmentId) {
    if (!(await tableExists('employee_attendance_records')))
        return null;
    const ids = await facultyIds(collegeId, departmentId);
    if (!ids.length)
        return null;
    const today = new Date();
    const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const rows = await db('employee_attendance_records')
        .where({ college_id: collegeId })
        .whereIn('employee_id', ids)
        .andWhere('attendance_date', '>=', from)
        .andWhere('attendance_date', '<=', todayISO())
        .select('attendance_status');
    if (!rows.length)
        return null;
    const present = rows.filter((r) => ['PRESENT', 'ON_DUTY', 'WORK_FROM_HOME', 'HALF_DAY'].includes(String(r.attendance_status))).length;
    return Math.round((present / rows.length) * 1000) / 10;
}
async function facultyAttendancePctByDepartment(collegeId) {
    const out = new Map();
    if (!(await tableExists('employee_attendance_records')))
        return out;
    const today = new Date();
    const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const rows = await db('employee_attendance_records as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .where('r.college_id', collegeId)
        .whereIn('e.employment_status', ['ACTIVE', 'PROBATION', 'CONFIRMED', 'ON_NOTICE'])
        .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
        .andWhere('r.attendance_date', '>=', from)
        .andWhere('r.attendance_date', '<=', todayISO())
        .select('e.department_id', 'r.attendance_status')
        .count({ c: '*' })
        .groupBy('e.department_id', 'r.attendance_status');
    const totals = new Map();
    for (const raw of rows) {
        const row = raw;
        const departmentId = row.department_id == null ? null : Number(row.department_id);
        const count = Number(row.c ?? 0);
        const current = totals.get(departmentId) ?? { present: 0, total: 0 };
        current.total += count;
        if (['PRESENT', 'ON_DUTY', 'WORK_FROM_HOME', 'HALF_DAY'].includes(String(row.attendance_status)))
            current.present += count;
        totals.set(departmentId, current);
    }
    let allPresent = 0;
    let allTotal = 0;
    for (const [departmentId, value] of totals) {
        out.set(departmentId, value.total ? Math.round((value.present / value.total) * 1000) / 10 : null);
        allPresent += value.present;
        allTotal += value.total;
    }
    out.set(null, allTotal ? Math.round((allPresent / allTotal) * 1000) / 10 : null);
    return out;
}
async function studentAttendancePct(collegeId, departmentId) {
    if (!(await tableExists('attendance_records')) || !(await tableExists('attendance_sessions')))
        return null;
    try {
        let q = db('attendance_records as r')
            .join('attendance_sessions as s', 's.id', 'r.attendance_session_id')
            .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
            .where('s.college_id', collegeId);
        if (departmentId != null)
            q = q.andWhere('ac.department_id', departmentId);
        const rows = await q.select('r.status').limit(5000);
        if (!rows.length)
            return null;
        const present = rows.filter((r) => ['PRESENT', 'LATE', 'OD'].includes(String(r.status).toUpperCase())).length;
        return Math.round((present / rows.length) * 1000) / 10;
    }
    catch {
        return null;
    }
}
async function academicProgressPct(collegeId, departmentId) {
    if (!(await tableExists('faculty_lesson_plans')) || !(await tableExists('lesson_plan_entries')))
        return null;
    let q = db('faculty_lesson_plans as p')
        .join('faculty_users as f', 'f.id', 'p.created_by')
        .where('p.college_id', collegeId);
    if (departmentId != null)
        q = q.andWhere('f.department_id', departmentId);
    const plans = await q.select('p.id').limit(200);
    if (!plans.length)
        return null;
    const entriesByPlan = await lessonPlanEntriesByPlanIds(plans.map((plan) => Number(plan.id)));
    let total = 0;
    let n = 0;
    for (const plan of plans) {
        const entries = entriesByPlan.get(Number(plan.id)) ?? [];
        if (!entries.length)
            continue;
        const progress = computePlanProgress(entries, todayISO());
        total += Number(progress.percent) || 0;
        n += 1;
    }
    if (!n)
        return null;
    return Math.round((total / n) * 10) / 10;
}
async function academicProgressPctByDepartment(collegeId) {
    const out = new Map();
    if (!(await tableExists('faculty_lesson_plans')) || !(await tableExists('lesson_plan_entries')))
        return out;
    const plans = await db('faculty_lesson_plans as p')
        .join('faculty_users as f', 'f.id', 'p.created_by')
        .where('p.college_id', collegeId)
        .select('p.id', 'f.department_id')
        .limit(200);
    if (!plans.length)
        return out;
    const entriesByPlan = await lessonPlanEntriesByPlanIds(plans.map((plan) => Number(plan.id)));
    const totals = new Map();
    for (const plan of plans) {
        const entries = entriesByPlan.get(Number(plan.id)) ?? [];
        if (!entries.length)
            continue;
        const progress = computePlanProgress(entries, todayISO());
        const departmentId = plan.department_id == null ? null : Number(plan.department_id);
        const current = totals.get(departmentId) ?? { total: 0, count: 0 };
        current.total += Number(progress.percent) || 0;
        current.count += 1;
        totals.set(departmentId, current);
    }
    let allTotal = 0;
    let allCount = 0;
    for (const [departmentId, value] of totals) {
        out.set(departmentId, value.count ? Math.round((value.total / value.count) * 10) / 10 : null);
        allTotal += value.total;
        allCount += value.count;
    }
    out.set(null, allCount ? Math.round((allTotal / allCount) * 10) / 10 : null);
    return out;
}
async function assessmentsPending(collegeId, departmentId) {
    let pending = 0;
    if (await tableExists('quizzes')) {
        let q = db('quizzes as q').where({ 'q.college_id': collegeId }).whereNull('q.deleted_at');
        if (departmentId != null)
            q = q.join('faculty_users as f', 'f.id', 'q.created_by').andWhere('f.department_id', departmentId);
        const row = await q.whereIn('q.status', ['ACTIVE', 'PUBLISHED']).count({ c: '*' }).first();
        pending += Number(row?.c ?? 0);
    }
    if (await tableExists('assignments')) {
        let q = db('assignments as a').where({ 'a.college_id': collegeId }).whereNull('a.deleted_at');
        if (departmentId != null)
            q = q.join('faculty_users as f', 'f.id', 'a.created_by').andWhere('f.department_id', departmentId);
        const row = await q.whereIn('a.status', ['ACTIVE', 'PUBLISHED']).count({ c: '*' }).first();
        pending += Number(row?.c ?? 0);
    }
    return pending;
}
async function assessmentsPendingByDepartment(collegeId) {
    const out = new Map();
    let total = 0;
    if (await tableExists('quizzes')) {
        const rows = await db('quizzes as q')
            .leftJoin('faculty_users as f', 'f.id', 'q.created_by')
            .where({ 'q.college_id': collegeId })
            .whereNull('q.deleted_at')
            .whereIn('q.status', ['ACTIVE', 'PUBLISHED'])
            .select('f.department_id')
            .count({ c: '*' })
            .groupBy('f.department_id');
        for (const raw of rows) {
            const row = raw;
            const departmentId = row.department_id == null ? null : Number(row.department_id);
            const count = Number(row.c ?? 0);
            out.set(departmentId, (out.get(departmentId) ?? 0) + count);
            total += count;
        }
    }
    if (await tableExists('assignments')) {
        const rows = await db('assignments as a')
            .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
            .where({ 'a.college_id': collegeId })
            .whereNull('a.deleted_at')
            .whereIn('a.status', ['ACTIVE', 'PUBLISHED'])
            .select('f.department_id')
            .count({ c: '*' })
            .groupBy('f.department_id');
        for (const raw of rows) {
            const row = raw;
            const departmentId = row.department_id == null ? null : Number(row.department_id);
            const count = Number(row.c ?? 0);
            out.set(departmentId, (out.get(departmentId) ?? 0) + count);
            total += count;
        }
    }
    out.set(null, total);
    return out;
}
async function continuityExceptions(collegeId, departmentId) {
    if (!(await tableExists('hr_leave_academic_coverage')))
        return 0;
    try {
        let q = db('hr_leave_academic_coverage as c')
            .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
            .join('employees as e', 'e.id', 'lr.employee_id')
            .where('c.college_id', collegeId)
            .where((b) => {
            b.whereIn('c.status', ['UNRESOLVED', 'REQUESTED']).orWhere('c.hod_action_required', true);
        });
        if (departmentId != null)
            q = q.andWhere('e.department_id', departmentId);
        const row = await q.count({ c: '*' }).first();
        return Number(row?.c ?? 0);
    }
    catch {
        return 0;
    }
}
async function continuityExceptionsByDepartment(collegeId) {
    const out = new Map();
    if (!(await tableExists('hr_leave_academic_coverage')))
        return out;
    try {
        const rows = await db('hr_leave_academic_coverage as c')
            .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
            .join('employees as e', 'e.id', 'lr.employee_id')
            .where('c.college_id', collegeId)
            .where((b) => {
            b.whereIn('c.status', ['UNRESOLVED', 'REQUESTED']).orWhere('c.hod_action_required', true);
        })
            .select('e.department_id')
            .count({ c: '*' })
            .groupBy('e.department_id');
        let total = 0;
        for (const raw of rows) {
            const row = raw;
            const departmentId = row.department_id == null ? null : Number(row.department_id);
            const count = Number(row.c ?? 0);
            out.set(departmentId, count);
            total += count;
        }
        out.set(null, total);
    }
    catch {
        return out;
    }
    return out;
}
async function substitutionsToday(collegeId, departmentId) {
    if (!(await tableExists('timetable_overrides')))
        return 0;
    let q = db('timetable_overrides as o').where({
        'o.college_id': collegeId,
        'o.status': 'ACTIVE',
        'o.kind': 'SUBSTITUTION',
        'o.override_date': todayISO(),
    });
    if (departmentId != null && (await tableExists('academic_classes'))) {
        q = q.join('academic_classes as ac', 'ac.id', 'o.academic_class_id').andWhere('ac.department_id', departmentId);
    }
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function departmentMeta(departmentId, collegeId) {
    if (!departmentId)
        return { id: null, name: 'Institution', code: null };
    const dept = await loadDepartmentInCollege(departmentId, collegeId);
    return { id: Number(dept.id), name: dept.name, code: dept.code };
}
export async function hodDashboard(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (scoped.departmentId == null) {
        throw new AppError(400, 'HOD dashboard requires a department');
    }
    const collegeId = actor.collegeId;
    const deptId = scoped.departmentId;
    const [department, faculty, students, programs, classes, subjects, todayClasses, absent, onLeave, pendingLeave, attendancePct, studentAtt, progress, assessments, exceptions, substitutions,] = await Promise.all([
        departmentMeta(deptId, collegeId),
        facultyCount(collegeId, deptId),
        studentCount(collegeId, deptId),
        programCount(collegeId, deptId),
        classCount(collegeId, deptId),
        subjectCount(collegeId, deptId),
        todayClassCount(collegeId, deptId),
        facultyAbsentToday(collegeId, deptId),
        facultyOnApprovedLeave(collegeId, deptId),
        pendingFacultyLeave(collegeId, deptId, ['SUBMITTED']),
        facultyAttendancePct(collegeId, deptId),
        studentAttendancePct(collegeId, deptId),
        academicProgressPct(collegeId, deptId),
        assessmentsPending(collegeId, deptId),
        continuityExceptions(collegeId, deptId),
        substitutionsToday(collegeId, deptId),
    ]);
    const alerts = [];
    if (pendingLeave > 0)
        alerts.push({ severity: 'high', title: 'Pending faculty leave requests', count: pendingLeave });
    if (exceptions > 0)
        alerts.push({ severity: 'high', title: 'Academic continuity exceptions', count: exceptions });
    if (absent > 0)
        alerts.push({ severity: 'medium', title: 'Faculty absent today', count: absent });
    if (onLeave > 0)
        alerts.push({ severity: 'medium', title: 'Faculty on approved leave today', count: onLeave });
    if (assessments > 0)
        alerts.push({ severity: 'low', title: 'Active assessments to monitor', count: assessments });
    return {
        department,
        metrics: {
            facultyCount: faculty,
            studentCount: students,
            programCount: programs,
            classCount: classes,
            subjectCount: subjects,
            todayClasses,
            facultyAbsentToday: absent,
            facultyOnApprovedLeave: onLeave,
            pendingFacultyLeave: pendingLeave,
            facultyAttendancePct: attendancePct,
            studentAttendancePct: studentAtt,
            academicProgressPct: progress,
            assessmentsPending: assessments,
            continuityExceptions: exceptions,
            substitutionsToday: substitutions,
            pendingHodActions: pendingLeave + exceptions,
        },
        alerts,
    };
}
export async function principalDashboard(actor) {
    await assertLeadershipCapability(actor, 'academic.institution.view');
    const collegeId = actor.collegeId;
    const [departments, facultyCounts, studentCounts, attendanceByDepartment, progressByDepartment, assessmentCounts, exceptionCounts, pendingLeaveCounts, hods, programs, studentAttendance, absentToday,] = await Promise.all([
        db('departments').where({ college_id: collegeId }).orderBy('name'),
        facultyCountByDepartment(collegeId),
        studentCountByDepartment(collegeId),
        facultyAttendancePctByDepartment(collegeId),
        academicProgressPctByDepartment(collegeId),
        assessmentsPendingByDepartment(collegeId),
        continuityExceptionsByDepartment(collegeId),
        pendingFacultyLeaveByDepartment(collegeId, ['SUBMITTED']),
        listAssignments(collegeId, { role: 'HOD', status: 'ACTIVE' }),
        programCount(collegeId, null),
        studentAttendancePct(collegeId, null),
        facultyAbsentToday(collegeId, null),
    ]);
    const pendingApprovalCounts = await pendingFacultyLeaveByDepartment(collegeId, ['SUBMITTED', 'UNDER_APPROVAL']);
    const comparison = departments.map((dept) => {
        const id = Number(dept.id);
        return {
            departmentId: id,
            departmentName: dept.name,
            departmentCode: dept.code,
            attendancePct: attendanceByDepartment.get(id) ?? null,
            academicProgressPct: progressByDepartment.get(id) ?? null,
            assessmentPending: assessmentCounts.get(id) ?? 0,
            exceptions: exceptionCounts.get(id) ?? 0,
            pendingLeave: pendingLeaveCounts.get(id) ?? 0,
            facultyCount: facultyCounts.get(id) ?? 0,
            studentCount: studentCounts.get(id) ?? 0,
        };
    });
    const today = todayISO();
    const activeHods = hods.filter((h) => h.effectiveFrom <= today && (!h.effectiveTo || h.effectiveTo >= today));
    return {
        metrics: {
            departmentCount: departments.length,
            facultyCount: facultyCounts.get(null) ?? 0,
            studentCount: studentCounts.get(null) ?? 0,
            programCount: programs,
            facultyAttendancePct: attendanceByDepartment.get(null) ?? null,
            studentAttendancePct: studentAttendance,
            academicProgressPct: progressByDepartment.get(null) ?? null,
            assessmentsPending: assessmentCounts.get(null) ?? 0,
            pendingApprovals: pendingApprovalCounts.get(null) ?? 0,
            continuityExceptions: exceptionCounts.get(null) ?? 0,
            facultyAbsentToday: absentToday,
            activeHodCount: activeHods.length,
        },
        departmentComparison: comparison,
        hods: activeHods,
    };
}
export async function departmentOverview(actor, departmentId) {
    await assertLeadershipCapability(actor, 'academic.institution.departments.view');
    const scoped = await resolveScopedDepartmentId(actor, departmentId);
    const dash = await hodDashboard(actor, scoped.departmentId);
    const hods = await listAssignments(actor.collegeId, { role: 'HOD', departmentId, status: 'ACTIVE' });
    const faculty = await listDepartmentFaculty(actor, departmentId);
    return {
        ...dash,
        hods,
        faculty: faculty.slice(0, 12),
    };
}
export async function listDepartmentsForPrincipal(actor) {
    await assertLeadershipCapability(actor, 'academic.institution.departments.view');
    const collegeId = actor.collegeId;
    const today = todayISO();
    // Set-based: one query per metric across all departments instead of the
    // previous per-department fan-out (N departments × 5 sequential queries).
    const [departments, hodAssignments, facultyCounts, studentCounts, pendingLeaveCounts, exceptionCounts] = await Promise.all([
        db('departments').where({ college_id: collegeId }).orderBy('name'),
        listAssignments(collegeId, { role: 'HOD', status: 'ACTIVE' }),
        facultyCountByDepartment(collegeId),
        studentCountByDepartment(collegeId),
        pendingFacultyLeaveByDepartment(collegeId, ['SUBMITTED']),
        continuityExceptionsByDepartment(collegeId),
    ]);
    // Group the active HOD per department in a single pass.
    const hodByDepartment = new Map();
    for (const h of hodAssignments) {
        if (h.departmentId == null)
            continue;
        if (!(h.effectiveFrom <= today && (!h.effectiveTo || h.effectiveTo >= today)))
            continue;
        if (!hodByDepartment.has(h.departmentId))
            hodByDepartment.set(h.departmentId, h);
    }
    return departments.map((dept) => {
        const id = Number(dept.id);
        return {
            id,
            name: dept.name,
            code: dept.code,
            hod: hodByDepartment.get(id) ?? null,
            facultyCount: facultyCounts.get(id) ?? 0,
            studentCount: studentCounts.get(id) ?? 0,
            pendingLeave: pendingLeaveCounts.get(id) ?? 0,
            exceptions: exceptionCounts.get(id) ?? 0,
        };
    });
}
async function currentLeaveStatus(employeeId) {
    const today = todayISO();
    const row = await db('hr_leave_requests as r')
        .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
        .where({ 'r.employee_id': employeeId, 'r.status': 'APPROVED' })
        .andWhere('r.from_date', '<=', today)
        .andWhere('r.to_date', '>=', today)
        .select('r.*', 't.name as leave_type_name', 't.code as leave_type_code')
        .first();
    if (!row)
        return null;
    return {
        requestId: Number(row.id),
        leaveType: row.leave_type_name,
        fromDate: ymd(row.from_date),
        toDate: ymd(row.to_date),
    };
}
async function currentLeaveStatusByEmployeeIds(employeeIds) {
    const out = new Map();
    if (!employeeIds.length)
        return out;
    const today = todayISO();
    const rows = await db('hr_leave_requests as r')
        .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
        .where('r.status', 'APPROVED')
        .whereIn('r.employee_id', employeeIds)
        .andWhere('r.from_date', '<=', today)
        .andWhere('r.to_date', '>=', today)
        .select('r.id', 'r.employee_id', 'r.from_date', 'r.to_date', 't.name as leave_type_name', 't.code as leave_type_code')
        .orderBy('r.from_date', 'desc');
    for (const row of rows) {
        const employeeId = Number(row.employee_id);
        if (out.has(employeeId))
            continue;
        out.set(employeeId, {
            requestId: Number(row.id),
            leaveType: row.leave_type_name,
            fromDate: ymd(row.from_date),
            toDate: ymd(row.to_date),
        });
    }
    return out;
}
async function attendanceToday(employeeId) {
    if (!(await tableExists('employee_attendance_records')))
        return null;
    const row = await db('employee_attendance_records')
        .where({ employee_id: employeeId, attendance_date: todayISO() })
        .first();
    return row ? String(row.attendance_status) : null;
}
async function attendanceTodayByEmployeeIds(employeeIds) {
    const out = new Map();
    if (!employeeIds.length || !(await tableExists('employee_attendance_records')))
        return out;
    const rows = await db('employee_attendance_records')
        .whereIn('employee_id', employeeIds)
        .andWhere('attendance_date', todayISO())
        .select('employee_id', 'attendance_status');
    for (const row of rows)
        out.set(Number(row.employee_id), String(row.attendance_status));
    return out;
}
async function weeklyLoadHours(facultyUserId, collegeId) {
    if (!facultyUserId || !(await tableExists('timetable_slot_faculty')))
        return 0;
    const rows = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .where({ 'sf.faculty_id': facultyUserId, 's.college_id': collegeId, 's.status': 'ACTIVE' })
        .select('s.start_time', 's.end_time');
    let hours = 0;
    for (const r of rows) {
        const start = String(r.start_time || '').slice(0, 5).split(':').map(Number);
        const end = String(r.end_time || '').slice(0, 5).split(':').map(Number);
        if (start.length >= 2 && end.length >= 2) {
            hours += (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
        }
    }
    return Math.round(hours * 10) / 10;
}
async function weeklyLoadHoursByFacultyUserIds(facultyUserIds, collegeId) {
    const out = new Map();
    if (!facultyUserIds.length || !(await tableExists('timetable_slot_faculty')))
        return out;
    const rows = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .whereIn('sf.faculty_id', facultyUserIds)
        .andWhere('s.college_id', collegeId)
        .andWhere('s.status', 'ACTIVE')
        .select('sf.faculty_id', 's.start_time', 's.end_time');
    for (const row of rows) {
        const start = String(row.start_time || '').slice(0, 5).split(':').map(Number);
        const end = String(row.end_time || '').slice(0, 5).split(':').map(Number);
        if (start.length >= 2 && end.length >= 2) {
            const facultyId = Number(row.faculty_id);
            out.set(facultyId, (out.get(facultyId) ?? 0) + (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60);
        }
    }
    for (const [facultyId, hours] of out)
        out.set(facultyId, Math.round(hours * 10) / 10);
    return out;
}
async function teachingAssignments(facultyUserId, collegeId) {
    if (!facultyUserId || !(await tableExists('academic_class_subject_faculty')))
        return [];
    const rows = await db('academic_class_subject_faculty as x')
        .join('courses as c', 'c.id', 'x.course_id')
        .join('academic_classes as ac', 'ac.id', 'x.academic_class_id')
        .where({ 'x.faculty_id': facultyUserId, 'x.college_id': collegeId, 'x.status': 'ACTIVE' })
        .select('c.name as course_name', 'c.code as course_code', 'ac.name as class_name', 'ac.code as class_code');
    return rows.map((r) => ({
        courseName: r.course_name,
        courseCode: r.course_code,
        className: r.class_name,
        classCode: r.class_code,
    }));
}
async function teachingAssignmentsByFacultyUserIds(facultyUserIds, collegeId) {
    const out = new Map();
    if (!facultyUserIds.length || !(await tableExists('academic_class_subject_faculty')))
        return out;
    const rows = await db('academic_class_subject_faculty as x')
        .join('courses as c', 'c.id', 'x.course_id')
        .join('academic_classes as ac', 'ac.id', 'x.academic_class_id')
        .whereIn('x.faculty_id', facultyUserIds)
        .andWhere('x.college_id', collegeId)
        .andWhere('x.status', 'ACTIVE')
        .select('x.faculty_id', 'c.name as course_name', 'c.code as course_code', 'ac.name as class_name', 'ac.code as class_code');
    for (const row of rows) {
        const facultyId = Number(row.faculty_id);
        const items = out.get(facultyId) ?? [];
        items.push({
            courseName: row.course_name,
            courseCode: row.course_code,
            className: row.class_name,
            classCode: row.class_code,
        });
        out.set(facultyId, items);
    }
    return out;
}
async function lessonPlanEntriesByPlanIds(planIds) {
    const out = new Map();
    if (!planIds.length)
        return out;
    const rows = await db('lesson_plan_entries')
        .whereIn('plan_id', planIds)
        .select('plan_id', 'status', 'planned_date as plannedDate', 'actual_date as actualDate', 'planned_hours as plannedHours', 'actual_hours as actualHours', 'module_id as moduleId');
    for (const row of rows) {
        const planId = Number(row.plan_id);
        const items = out.get(planId) ?? [];
        items.push({
            status: String(row.status),
            plannedDate: row.plannedDate ? ymd(row.plannedDate) : null,
            actualDate: row.actualDate ? ymd(row.actualDate) : null,
            plannedHours: Number(row.plannedHours) || 0,
            actualHours: row.actualHours != null ? Number(row.actualHours) : null,
            moduleId: row.moduleId != null ? Number(row.moduleId) : null,
            moduleLabel: null,
            moduleName: null,
        });
        out.set(planId, items);
    }
    return out;
}
export async function listDepartmentFaculty(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    const deptId = scoped.departmentId;
    if (deptId == null && !scoped.ctx.isPrincipal && !isAdminRole(actor.role)) {
        throw new AppError(400, 'Department is required');
    }
    const rows = await employeeBaseQuery(actor.collegeId, deptId)
        .where((b) => b.where('e.employee_category', 'FACULTY').orWhereNotNull('e.faculty_user_id'))
        .select('e.id', 'e.employee_number', 'e.display_name', 'e.employment_status', 'e.faculty_user_id', 'e.department_id', 'dsg.name as designation_name', 'd.name as department_name')
        .orderBy('e.display_name');
    const employeeIds = rows.map((r) => Number(r.id));
    const facultyUserIds = rows.map((r) => (r.faculty_user_id ? Number(r.faculty_user_id) : null)).filter((id) => id != null);
    const [teachingByFaculty, hoursByFaculty, attendanceByEmployee, leaveByEmployee] = await Promise.all([
        teachingAssignmentsByFacultyUserIds(facultyUserIds, actor.collegeId),
        weeklyLoadHoursByFacultyUserIds(facultyUserIds, actor.collegeId),
        attendanceTodayByEmployeeIds(employeeIds),
        currentLeaveStatusByEmployeeIds(employeeIds),
    ]);
    const out = [];
    for (const r of rows) {
        const facultyUserId = r.faculty_user_id ? Number(r.faculty_user_id) : null;
        const employeeId = Number(r.id);
        out.push({
            id: employeeId,
            employeeNumber: r.employee_number,
            name: r.display_name,
            designation: r.designation_name ?? null,
            employmentStatus: r.employment_status,
            departmentId: r.department_id != null ? Number(r.department_id) : null,
            departmentName: r.department_name,
            teaching: facultyUserId ? teachingByFaculty.get(facultyUserId) ?? [] : [],
            weeklyHours: facultyUserId ? hoursByFaculty.get(facultyUserId) ?? 0 : 0,
            attendanceToday: attendanceByEmployee.get(employeeId) ?? null,
            currentLeave: leaveByEmployee.get(employeeId) ?? null,
        });
    }
    return out;
}
export async function listWorkload(actor, departmentId) {
    const faculty = await listDepartmentFaculty(actor, departmentId);
    return faculty.map((f) => ({
        employeeId: f.id,
        name: f.name,
        designation: f.designation,
        assignedSubjects: f.teaching.map((t) => t.courseCode).filter(Boolean),
        classes: f.teaching.map((t) => t.classCode).filter(Boolean),
        weeklyTeachingLoad: f.weeklyHours,
        additionalResponsibilities: [],
        currentLoadHours: f.weeklyHours,
    }));
}
export async function listTeachingAllocation(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (!(await tableExists('academic_class_subject_faculty')))
        return [];
    let q = db('academic_class_subject_faculty as x')
        .join('academic_classes as ac', 'ac.id', 'x.academic_class_id')
        .join('courses as c', 'c.id', 'x.course_id')
        .join('faculty_users as f', 'f.id', 'x.faculty_id')
        .where({ 'x.college_id': actor.collegeId, 'x.status': 'ACTIVE' });
    if (scoped.departmentId != null)
        q = q.andWhere('ac.department_id', scoped.departmentId);
    const rows = await q.select('x.id', 'x.academic_class_id', 'x.class_subject_id', 'x.faculty_id', 'x.is_primary', 'c.name as course_name', 'c.code as course_code', 'ac.name as class_name', 'ac.code as class_code', 'ac.department_id', 'f.name as faculty_name');
    return rows.map((r) => ({
        id: Number(r.id),
        classId: Number(r.academic_class_id),
        classSubjectId: Number(r.class_subject_id),
        facultyId: Number(r.faculty_id),
        facultyName: r.faculty_name,
        courseName: r.course_name,
        courseCode: r.course_code,
        className: r.class_name,
        classCode: r.class_code,
        departmentId: Number(r.department_id),
        isPrimary: !!r.is_primary,
    }));
}
export async function assignTeaching(actor, input) {
    const { ctx } = await assertLeadershipCapability(actor, 'academic.department.allocation.manage');
    const classRow = await db('academic_classes').where({ id: input.classId, college_id: actor.collegeId }).first();
    if (!classRow)
        throw new AppError(404, 'Class not found');
    assertDepartmentScope(ctx, Number(classRow.department_id), actor.role);
    const classActor = {
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        departmentId: Number(classRow.department_id),
        role: 'HOD',
    };
    return assignFacultyToSubject(classActor, input.classId, input.classSubjectId, {
        facultyId: input.facultyId,
        isPrimary: input.isPrimary,
        canManage: input.canManage,
    });
}
export async function unassignTeaching(actor, input) {
    const { ctx } = await assertLeadershipCapability(actor, 'academic.department.allocation.manage');
    const classRow = await db('academic_classes').where({ id: input.classId, college_id: actor.collegeId }).first();
    if (!classRow)
        throw new AppError(404, 'Class not found');
    assertDepartmentScope(ctx, Number(classRow.department_id), actor.role);
    const classActor = {
        facultyUserId: actor.facultyUserId,
        collegeId: actor.collegeId,
        departmentId: Number(classRow.department_id),
        role: 'HOD',
    };
    return removeFacultyFromSubject(classActor, input.classId, input.classSubjectId, input.facultyId);
}
export async function listTimetable(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (!(await tableExists('timetable_slots')))
        return [];
    let q = db('timetable_slots as s')
        .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .join('courses as c', 'c.id', 's.course_id')
        .leftJoin('timetable_slot_faculty as sf', 'sf.slot_id', 's.id')
        .leftJoin('faculty_users as f', 'f.id', 'sf.faculty_id')
        .where({ 's.college_id': actor.collegeId, 's.status': 'ACTIVE' });
    if (scoped.departmentId != null)
        q = q.andWhere('ac.department_id', scoped.departmentId);
    const rows = await q.select('s.id', 's.day_of_week', 's.start_time', 's.end_time', 's.start_period_number', 'ac.name as class_name', 'ac.code as class_code', 'ac.department_id', 'c.name as course_name', 'c.code as course_code', 'f.name as faculty_name').orderBy(['s.day_of_week', 's.start_time']);
    return rows.map((r) => ({
        id: Number(r.id),
        dayOfWeek: Number(r.day_of_week),
        startTime: r.start_time,
        endTime: r.end_time,
        period: r.start_period_number,
        className: r.class_name,
        classCode: r.class_code,
        departmentId: Number(r.department_id),
        courseName: r.course_name,
        courseCode: r.course_code,
        facultyName: r.faculty_name,
    }));
}
export async function listFacultyAttendance(actor, departmentId, from, to) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    await assertLeadershipCapability(actor, 'academic.department.attendance.view');
    if (!(await tableExists('employee_attendance_records')))
        return [];
    const ids = await facultyIds(actor.collegeId, scoped.departmentId);
    if (!ids.length)
        return [];
    const start = from || todayISO();
    const end = to || todayISO();
    const rows = await db('employee_attendance_records as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .where('r.college_id', actor.collegeId)
        .whereIn('r.employee_id', ids)
        .andWhere('r.attendance_date', '>=', start)
        .andWhere('r.attendance_date', '<=', end)
        .select('r.*', 'e.display_name as employee_name', 'e.employee_number')
        .orderBy('r.attendance_date', 'desc');
    return rows.map((r) => ({
        employeeId: Number(r.employee_id),
        employeeName: r.employee_name,
        employeeNumber: r.employee_number,
        date: ymd(r.attendance_date),
        status: r.attendance_status,
        workMinutes: r.work_minutes,
    }));
}
export async function listAcademicProgress(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (!(await tableExists('faculty_lesson_plans')))
        return [];
    let q = db('faculty_lesson_plans as p')
        .join('faculty_users as f', 'f.id', 'p.created_by')
        .leftJoin('courses as c', 'c.id', 'p.course_id')
        .where('p.college_id', actor.collegeId);
    if (scoped.departmentId != null)
        q = q.andWhere('f.department_id', scoped.departmentId);
    const plans = await q.select('p.id', 'p.status', 'f.name as faculty_name', 'c.name as course_name', 'c.code as course_code').limit(200);
    const entriesByPlan = await lessonPlanEntriesByPlanIds(plans.map((plan) => Number(plan.id)));
    const out = [];
    for (const plan of plans) {
        const entries = entriesByPlan.get(Number(plan.id)) ?? [];
        const progress = entries.length
            ? computePlanProgress(entries, todayISO())
            : { percent: 0, expectedPercent: 0, completedUnits: 0, totalUnits: 0 };
        out.push({
            planId: Number(plan.id),
            courseName: plan.course_name,
            courseCode: plan.course_code,
            facultyName: plan.faculty_name,
            plannedProgress: Number(progress.expectedPercent) || 0,
            actualProgress: Number(progress.percent) || 0,
            completionPct: Number(progress.percent) || 0,
            pendingUnits: Math.max(0, Number(progress.totalUnits || 0) - Number(progress.completedUnits || 0)),
            status: plan.status,
        });
    }
    return out;
}
export async function listAssessmentMonitoring(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    const items = [];
    if (await tableExists('quizzes')) {
        let q = db('quizzes as q')
            .leftJoin('faculty_users as f', 'f.id', 'q.created_by')
            .leftJoin('courses as c', 'c.id', 'q.course_id')
            .where('q.college_id', actor.collegeId)
            .whereNull('q.deleted_at');
        if (scoped.departmentId != null)
            q = q.andWhere('f.department_id', scoped.departmentId);
        const rows = await q.select('q.id', 'q.title', 'q.status', 'f.name as faculty_name', 'c.code as course_code').limit(100);
        for (const r of rows) {
            items.push({ kind: 'QUIZ', id: Number(r.id), title: r.title, status: r.status, facultyName: r.faculty_name, courseCode: r.course_code });
        }
    }
    if (await tableExists('assignments')) {
        let q = db('assignments as a')
            .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
            .leftJoin('courses as c', 'c.id', 'a.course_id')
            .where('a.college_id', actor.collegeId)
            .whereNull('a.deleted_at');
        if (scoped.departmentId != null)
            q = q.andWhere('f.department_id', scoped.departmentId);
        const rows = await q.select('a.id', 'a.title', 'a.status', 'f.name as faculty_name', 'c.code as course_code').limit(100);
        for (const r of rows) {
            items.push({ kind: 'ASSIGNMENT', id: Number(r.id), title: r.title, status: r.status, facultyName: r.faculty_name, courseCode: r.course_code });
        }
    }
    return items;
}
export async function listResultsMonitoring(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (!(await tableExists('attainment_runs')))
        return [];
    let q = db('attainment_runs as r')
        .leftJoin('courses as c', 'c.id', 'r.course_id')
        .leftJoin('faculty_users as f', 'f.id', 'r.created_by')
        .where('r.college_id', actor.collegeId);
    if (scoped.departmentId != null) {
        q = q.andWhere((b) => b.where('r.department_id', scoped.departmentId).orWhere('f.department_id', scoped.departmentId));
    }
    const rows = await q.select('r.id', 'r.status', 'c.name as course_name', 'c.code as course_code', 'f.name as faculty_name').limit(100);
    return rows.map((r) => ({
        id: Number(r.id),
        status: r.status,
        courseName: r.course_name,
        courseCode: r.course_code,
        facultyName: r.faculty_name,
    }));
}
export async function listContinuity(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    await assertLeadershipCapability(actor, scoped.ctx.isPrincipal ? 'academic.institution.continuity.view' : 'academic.department.continuity.view');
    if (!(await tableExists('hr_leave_academic_coverage')))
        return [];
    let q = db('hr_leave_academic_coverage as c')
        .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
        .join('employees as e', 'e.id', 'lr.employee_id')
        .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
        .leftJoin('courses as co', 'co.id', 'ts.course_id')
        .where('c.college_id', actor.collegeId);
    if (scoped.departmentId != null)
        q = q.andWhere('e.department_id', scoped.departmentId);
    const rows = await q
        .select('c.id', 'c.status', 'c.coverage_type', 'c.affected_date', 'c.hod_action_required', 'e.display_name as employee_name', 'e.department_id', 'lr.id as leave_request_id', 'lr.status as leave_status', 'co.name as subject_name')
        .orderBy('c.affected_date', 'desc')
        .limit(200);
    return rows.map((r) => ({
        id: Number(r.id),
        status: r.status,
        coverageType: r.coverage_type,
        affectedDate: ymd(r.affected_date),
        hodActionRequired: !!r.hod_action_required,
        employeeName: r.employee_name,
        departmentId: r.department_id != null ? Number(r.department_id) : null,
        leaveRequestId: Number(r.leave_request_id),
        leaveStatus: r.leave_status,
        subjectName: r.subject_name,
    }));
}
export async function listExceptions(actor, departmentId) {
    const continuity = await listContinuity(actor, departmentId);
    const pending = continuity.filter((c) => ['UNRESOLVED', 'REQUESTED', 'HOD_ACTION_REQUIRED'].includes(String(c.status)) || c.hodActionRequired);
    return pending;
}
export async function leadershipReports(actor, departmentId) {
    const dash = departmentId || !(await resolveLeadershipContext(actor)).isPrincipal
        ? await hodDashboard(actor, departmentId)
        : await principalDashboard(actor);
    return { generatedAt: new Date().toISOString(), ...dash };
}
export async function listStudentsOverview(actor, departmentId) {
    const scoped = await resolveScopedDepartmentId(actor, departmentId ?? undefined);
    if (!(await tableExists('academic_class_enrollments')))
        return { count: 0, classes: [] };
    let q = db('academic_classes as ac').where('ac.college_id', actor.collegeId);
    if (scoped.departmentId != null)
        q = q.andWhere('ac.department_id', scoped.departmentId);
    const classes = await q.select('ac.id', 'ac.name', 'ac.code', 'ac.department_id');
    const out = [];
    for (const cls of classes) {
        const row = await db('academic_class_enrollments').where({ academic_class_id: cls.id, status: 'APPROVED' }).count({ c: '*' }).first();
        out.push({
            classId: Number(cls.id),
            className: cls.name,
            classCode: cls.code,
            departmentId: Number(cls.department_id),
            studentCount: Number(row?.c ?? 0),
        });
    }
    return { count: out.reduce((s, r) => s + r.studentCount, 0), classes: out };
}
