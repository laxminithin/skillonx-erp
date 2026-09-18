import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { recordServicesAudit } from '../studentServices/audit.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
/** Departments the actor may administer allocation for. null ⇒ all (college-wide). */
function allocationDepartmentScope(actor, ctx) {
    if (isAdminRole(actor.role) || ctx.isPrincipal || actor.role === 'PRINCIPAL')
        return null;
    if (ctx.isHod)
        return ctx.hodDepartmentIds;
    return [];
}
async function assertStudentInScope(actor, ctx, studentId) {
    const student = await db('students').where({ id: studentId, college_id: actor.collegeId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    const scope = allocationDepartmentScope(actor, ctx);
    if (scope !== null) {
        if (scope.length === 0 || !scope.includes(Number(student.department_id))) {
            throw new AppError(403, 'Student is outside your department scope');
        }
    }
    return student;
}
async function assertMentorInScope(actor, ctx, mentorFacultyId) {
    const mentor = await db('faculty_users').where({ id: mentorFacultyId, college_id: actor.collegeId }).first();
    if (!mentor)
        throw new AppError(404, 'Mentor faculty not found');
    const scope = allocationDepartmentScope(actor, ctx);
    if (scope !== null && mentor.department_id != null) {
        if (scope.length === 0 || !scope.includes(Number(mentor.department_id))) {
            throw new AppError(403, 'Mentor is outside your department scope');
        }
    }
    return mentor;
}
/** Assign (or reassign) a primary mentor. Preserves history — prior active row is closed, not deleted. */
export async function assignMentor(actor, ctx, studentId, mentorFacultyId, academicYearId) {
    const student = await assertStudentInScope(actor, ctx, studentId);
    await assertMentorInScope(actor, ctx, mentorFacultyId);
    const existing = await db('mentor_assignments')
        .where({ student_id: studentId, college_id: actor.collegeId, status: 'ACTIVE', is_primary: true })
        .first();
    if (existing && Number(existing.mentor_faculty_id) === mentorFacultyId) {
        return { assignmentId: Number(existing.id), reassigned: false };
    }
    // Close the prior active primary assignment — history is preserved.
    if (existing) {
        await db('mentor_assignments')
            .where({ id: existing.id })
            .update({ status: 'INACTIVE', effective_to: db.fn.now(), updated_at: db.fn.now() });
    }
    const [id] = await db('mentor_assignments').insert({
        college_id: actor.collegeId,
        student_id: studentId,
        mentor_faculty_id: mentorFacultyId,
        academic_year_id: academicYearId ?? student.academic_year_id,
        status: 'ACTIVE',
        is_primary: true,
        effective_from: db.fn.now(),
        assigned_by_faculty_id: actor.facultyUserId,
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: existing ? 'MENTOR_REASSIGNED' : 'MENTOR_ASSIGNED',
        entityType: 'mentor_assignment',
        entityId: Number(id),
        beforeState: existing ? { mentorFacultyId: existing.mentor_faculty_id } : null,
        afterState: { studentId, mentorFacultyId },
    });
    await notifyStudent({
        studentId,
        collegeId: actor.collegeId,
        type: 'MENTOR_ASSIGNED',
        title: existing ? 'Mentor updated' : 'Mentor assigned',
        body: 'A faculty mentor has been assigned to you.',
        link: '/lms/services/mentor',
        relatedType: 'mentor_assignment',
        relatedId: id,
        dedupeKeyOverride: `MENTOR_ASSIGNED:${id}`,
    });
    return { assignmentId: Number(id), reassigned: !!existing };
}
export async function bulkAssignMentor(actor, ctx, studentIds, mentorFacultyId, academicYearId) {
    let assigned = 0;
    let reassigned = 0;
    let skipped = 0;
    for (const sid of studentIds) {
        try {
            const r = await assignMentor(actor, ctx, sid, mentorFacultyId, academicYearId);
            if (r.reassigned)
                reassigned++;
            else
                assigned++;
        }
        catch {
            skipped++;
        }
    }
    return { assigned, reassigned, skipped };
}
/** Mentor workload rollup for a department (or the whole college). */
export async function mentorWorkload(actor, departmentIds) {
    let q = db('mentor_assignments as ma')
        .join('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
        .leftJoin('departments as d', 'd.id', 'f.department_id')
        .where({ 'ma.college_id': actor.collegeId, 'ma.status': 'ACTIVE', 'ma.is_primary': true });
    if (departmentIds !== null) {
        if (departmentIds.length === 0)
            return [];
        q = q.whereIn('f.department_id', departmentIds);
    }
    const rows = (await q
        .groupBy('ma.mentor_faculty_id', 'f.name', 'd.name')
        .select('ma.mentor_faculty_id', 'f.name as mentor_name', 'd.name as department_name')
        .count({ mentees: 'ma.id' }));
    const list = rows.map((r) => ({
        mentorFacultyId: Number(r.mentor_faculty_id),
        mentorName: r.mentor_name,
        department: r.department_name,
        mentees: Number(r.mentees),
    }));
    const counts = list.map((l) => l.mentees);
    const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    return list.map((l) => ({
        ...l,
        // Simple, transparent imbalance indicator relative to the department average.
        imbalance: avg > 0 && l.mentees > avg * 1.5 ? 'OVERLOADED' : avg > 0 && l.mentees < avg * 0.5 ? 'LIGHT' : 'BALANCED',
    }));
}
/** Students in scope with no active primary mentor. */
export async function unassignedStudents(actor, departmentIds, limit = 100) {
    let q = db('students as s')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .where({ 's.college_id': actor.collegeId, 's.is_active': true })
        .whereNotExists(function () {
        this.select('*')
            .from('mentor_assignments as ma')
            .whereRaw('ma.student_id = s.id')
            .andWhere('ma.status', 'ACTIVE')
            .andWhere('ma.is_primary', true);
    });
    if (departmentIds !== null) {
        if (departmentIds.length === 0)
            return { total: 0, students: [] };
        q = q.whereIn('s.department_id', departmentIds);
    }
    const totalRow = await q.clone().count({ c: 's.id' }).first();
    const students = await q
        .select('s.id', 's.name', 's.usn', 'd.name as department_name', 'sem.label as semester_label')
        .orderBy('s.usn')
        .limit(limit);
    return {
        total: Number(totalRow?.c ?? 0),
        students: students.map((s) => ({
            studentId: Number(s.id),
            name: s.name,
            usn: s.usn,
            department: s.department_name,
            semester: s.semester_label,
        })),
    };
}
/** Full assignment history for a student (all assignments, newest first). */
export async function assignmentHistory(collegeId, studentId) {
    const rows = await db('mentor_assignments as ma')
        .leftJoin('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
        .where({ 'ma.student_id': studentId, 'ma.college_id': collegeId })
        .orderBy('ma.created_at', 'desc')
        .select('ma.*', 'f.name as mentor_name');
    return rows.map((r) => ({
        id: Number(r.id),
        mentorFacultyId: Number(r.mentor_faculty_id),
        mentorName: r.mentor_name,
        status: r.status,
        isPrimary: !!r.is_primary,
        effectiveFrom: r.effective_from,
        effectiveTo: r.effective_to,
        createdAt: r.created_at,
    }));
}
