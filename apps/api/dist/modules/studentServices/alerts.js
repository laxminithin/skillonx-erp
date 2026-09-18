import { db } from '../../db/index.js';
export async function generateAcademicAlerts(collegeId, studentId) {
    if (!(await db.schema.hasTable('student_academic_alerts')))
        return [];
    const policy = await db('college_attendance_policies').where({ college_id: collegeId }).first();
    const threshold = policy?.minimum_percentage != null ? Number(policy.minimum_percentage) : 75;
    let studentsQ = db('students').where({ college_id: collegeId, is_active: true });
    if (studentId)
        studentsQ = studentsQ.where({ id: studentId });
    const students = await studentsQ.select('id', 'name');
    const created = [];
    for (const student of students) {
        const sid = Number(student.id);
        const attendance = await db('attendance_records as ar')
            .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
            .join('courses as c', 'c.id', 's.course_id')
            .where({ 'ar.student_id': sid, 's.college_id': collegeId })
            .select('ar.status', 'c.name as course_name', 'c.id as course_id');
        const byCourse = new Map();
        for (const r of attendance) {
            const cid = Number(r.course_id);
            if (!byCourse.has(cid))
                byCourse.set(cid, { name: r.course_name, total: 0, present: 0 });
            const entry = byCourse.get(cid);
            entry.total++;
            if (r.status === 'PRESENT' || r.status === 'LATE')
                entry.present++;
        }
        for (const [courseId, stats] of byCourse) {
            const pct = stats.total ? Math.round((stats.present / stats.total) * 100) : 100;
            if (pct < threshold) {
                const dedupeKey = `ATTENDANCE_LOW:${courseId}`;
                const alert = await upsertAlert({
                    collegeId,
                    studentId: sid,
                    alertType: 'ATTENDANCE_LOW',
                    severity: pct < threshold - 10 ? 'WARNING' : 'INFO',
                    title: 'Attendance attention',
                    message: `Your attendance in ${stats.name} is below the recommended level (${pct}%).`,
                    relatedType: 'course',
                    relatedId: courseId,
                    dedupeKey,
                });
                if (alert)
                    created.push(alert);
            }
        }
        const failed = await db('subject_results')
            .where({ student_id: sid, college_id: collegeId, result_status: 'FAIL' })
            .count({ c: '*' })
            .first();
        const failCount = Number(failed?.c ?? 0);
        if (failCount >= 2) {
            const alert = await upsertAlert({
                collegeId,
                studentId: sid,
                alertType: 'MULTIPLE_FAILURES',
                severity: 'WARNING',
                title: 'Academic attention',
                message: `You have ${failCount} failed subject(s). Please meet your mentor regarding your academic performance.`,
                dedupeKey: `FAILURES:${failCount}`,
                visibleToMentor: true,
            });
            if (alert)
                created.push(alert);
        }
        const overdue = await db('assignment_submissions as sub')
            .join('assignments as a', 'a.id', 'sub.assignment_id')
            .where({ 'sub.student_id': sid, 'sub.status': 'STARTED' })
            .where('a.due_at', '<', db.fn.now())
            .count({ c: '*' })
            .first();
        if (Number(overdue?.c ?? 0) > 0) {
            const alert = await upsertAlert({
                collegeId,
                studentId: sid,
                alertType: 'OVERDUE_ASSIGNMENTS',
                severity: 'INFO',
                title: 'Overdue assignments',
                message: `You have ${overdue.c} overdue assignment(s).`,
                dedupeKey: 'OVERDUE_ASSIGNMENTS',
            });
            if (alert)
                created.push(alert);
        }
    }
    return created;
}
async function upsertAlert(input) {
    const existing = await db('student_academic_alerts')
        .where({ student_id: input.studentId, dedupe_key: input.dedupeKey, status: 'ACTIVE' })
        .first();
    if (existing)
        return null;
    try {
        const [id] = await db('student_academic_alerts').insert({
            college_id: input.collegeId,
            student_id: input.studentId,
            alert_type: input.alertType,
            severity: input.severity,
            title: input.title,
            message: input.message,
            related_type: input.relatedType ?? null,
            related_id: input.relatedId ?? null,
            visible_to_student: input.visibleToStudent ?? true,
            visible_to_mentor: input.visibleToMentor ?? true,
            status: 'ACTIVE',
            dedupe_key: input.dedupeKey,
        });
        return { id: Number(id), ...input };
    }
    catch {
        return null;
    }
}
export async function listStudentAlerts(studentId, collegeId) {
    const rows = await db('student_academic_alerts')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE', visible_to_student: true })
        .orderBy('created_at', 'desc');
    return rows.map((a) => ({
        id: Number(a.id),
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        createdAt: a.created_at,
    }));
}
export async function listMenteeAlerts(actor, studentId) {
    const assignment = await db('mentor_assignments')
        .where({
        student_id: studentId,
        mentor_faculty_id: actor.facultyUserId,
        college_id: actor.collegeId,
        status: 'ACTIVE',
    })
        .first();
    if (!assignment && actor.role === 'FACULTY')
        throw new Error('Not your mentee');
    const rows = await db('student_academic_alerts')
        .where({ student_id: studentId, college_id: actor.collegeId, status: 'ACTIVE', visible_to_mentor: true })
        .orderBy('created_at', 'desc');
    return rows.map((a) => ({
        id: Number(a.id),
        alertType: a.alert_type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        createdAt: a.created_at,
    }));
}
