import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { serializeClass, listAnnouncements } from './service.js';
import { activeClassForStudent, courseTypeLabel, currentClassContext, facultyName, isCoreKind, subjectsForStudent, } from './studentAccess.js';
import { dashboardProgress } from './studentProgress.js';
import { unreadAnnouncementIds } from './studentNotifications.js';
import { listStudentAssignments, listStudentQuizzes, listStudentAssessments } from './studentWork.js';
import { studentCoPerformance } from './studentPerformance.js';
import { subjectAnnouncements, subjectBeyondSyllabus, subjectModules, subjectOutcomes } from './studentLearning.js';
import { studentAttendanceSummary, studentSubjectAttendance } from '../attendance/service.js';
export { activeClassForStudent, subjectsForStudent, isCoreKind };
function nextActivity(subject) {
    if (subject.nextAssignment?.dueAt) {
        return { kind: 'assignment', title: subject.nextAssignment.title, at: subject.nextAssignment.dueAt };
    }
    if (subject.nextQuiz?.endAt) {
        return { kind: 'quiz', title: subject.nextQuiz.title, at: subject.nextQuiz.endAt };
    }
    if (subject.pendingTasks > 0)
        return { kind: 'task', title: `${subject.pendingTasks} pending activities`, at: null };
    return { kind: 'learn', title: 'Continue learning', at: null };
}
export async function studentDashboard(studentId) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack || !ctx.classRow) {
        return {
            class: null,
            pending: ctx.pending,
            subjects: [],
            backlogs: [],
            additional: [],
            announcements: [],
            upcoming: { assignments: 0, quizzes: 0, assessments: 0, materials: 0, items: [] },
            recentlyAdded: [],
            performance: null,
            continueLearning: null,
            todayClasses: [],
            progress: 0,
            electiveOptions: [],
            selectedElectiveIds: [],
        };
    }
    const progress = await dashboardProgress(studentId);
    const [assignments, quizzes, assessments, announcements, attendance, todayClasses] = await Promise.all([
        listStudentAssignments(studentId),
        listStudentQuizzes(studentId),
        listStudentAssessments(studentId),
        listAnnouncements(ctx.classId),
        studentAttendanceSummary(studentId, ctx.classId).catch(() => null),
        import('../timetable/service.js')
            .then((m) => m.studentTimetable(studentId))
            .then((tt) => tt.occurrences.filter((o) => o.date === tt.today))
            .catch(() => []),
    ]);
    const unread = await unreadAnnouncementIds(studentId, announcements.map((a) => a.id));
    const now = Date.now();
    const week = 14 * 24 * 60 * 60 * 1000;
    const upcomingItems = [
        ...assignments.assignments
            .filter((a) => a.studentStatus === 'NOT_STARTED' || a.studentStatus === 'DRAFT')
            .map((a) => ({
            kind: 'assignment',
            id: a.id,
            title: a.title,
            endAt: a.dueAt,
            courseId: a.courseId,
            courseName: a.courseName,
            path: `/lms/assignments/${a.id}`,
        })),
        ...quizzes.quizzes
            .filter((q) => q.bucket !== 'COMPLETED')
            .map((q) => ({
            kind: 'quiz',
            id: q.id,
            title: q.title,
            endAt: q.endAt,
            courseId: q.courseId,
            courseName: q.courseName,
            path: `/lms/quizzes/${q.id}`,
        })),
        ...assessments.assessments
            .filter((a) => a.status === 'UPCOMING')
            .map((a) => ({
            kind: 'assessment',
            id: a.id,
            title: a.title,
            endAt: a.date,
            courseId: a.courseId,
            courseName: a.courseName,
            path: '/lms/assessments',
        })),
    ]
        .filter((item) => item.endAt)
        .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
        .slice(0, 6);
    const recentlyAdded = [
        ...assignments.assignments
            .filter((a) => a.publishedAt && now - new Date(a.publishedAt).getTime() < week)
            .map((a) => ({ kind: 'assignment', id: a.id, title: a.title, at: a.publishedAt, path: `/lms/assignments/${a.id}` })),
        ...quizzes.quizzes
            .filter((q) => q.startAt && now - new Date(q.startAt).getTime() < week)
            .map((q) => ({ kind: 'quiz', id: q.id, title: q.title, at: q.startAt, path: `/lms/quizzes/${q.id}` })),
        ...announcements.slice(0, 5).map((a) => ({
            kind: 'announcement',
            id: a.id,
            title: a.title,
            at: a.publishedAt,
            path: a.courseId ? `/lms/subjects/${a.courseId}` : '/lms',
        })),
    ]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 5);
    const subjects = ctx.pack.current.map((s) => {
        const p = progress.byCourse.get(s.courseId);
        const nextA = assignments.assignments.find((a) => a.courseId === s.courseId && (a.studentStatus === 'NOT_STARTED' || a.studentStatus === 'DRAFT'));
        const nextQ = quizzes.quizzes.find((q) => q.courseId === s.courseId && q.bucket !== 'COMPLETED');
        const pending = p?.pendingTasks ?? 0;
        const card = {
            courseId: s.courseId,
            code: s.code,
            name: s.name,
            kind: s.kind,
            courseType: courseTypeLabel(s.kind),
            credits: s.credits,
            facultyName: facultyName(s),
            faculty: s.faculty,
            progress: p?.progress ?? 0,
            pendingTasks: pending,
            nextAssignment: nextA ? { title: nextA.title, dueAt: nextA.dueAt } : null,
            nextQuiz: nextQ ? { title: nextQ.title, endAt: nextQ.endAt } : null,
        };
        return { ...card, nextActivity: nextActivity(card) };
    });
    const aMarks = assignments.assignments.filter((a) => a.obtainedMarks != null);
    const qMarks = quizzes.quizzes.filter((q) => q.obtainedMarks != null);
    const iaMarks = assessments.assessments.filter((a) => a.marks != null);
    return {
        class: serializeClass(ctx.classRow),
        pending: ctx.pending,
        subjects,
        electiveOptions: ctx.pack.electives,
        selectedElectiveIds: ctx.pack.selectedElectiveIds,
        backlogs: ctx.pack.backlogs,
        additional: ctx.pack.overrides,
        announcements: announcements.slice(0, 5).map((a) => ({ ...a, unread: unread.has(a.id) })),
        upcoming: {
            assignments: assignments.assignments.filter((a) => a.studentStatus === 'NOT_STARTED' || a.studentStatus === 'DRAFT').length,
            quizzes: quizzes.quizzes.filter((q) => q.bucket !== 'COMPLETED').length,
            assessments: assessments.assessments.filter((a) => a.status === 'UPCOMING').length,
            materials: recentlyAdded.length,
            items: upcomingItems,
        },
        recentlyAdded,
        continueLearning: progress.continueLearning,
        todayClasses,
        progress: progress.overall,
        performance: {
            assignments: {
                obtained: aMarks.reduce((s, a) => s + Number(a.obtainedMarks ?? 0), 0),
                max: aMarks.reduce((s, a) => s + Number(a.totalMarks ?? 0), 0),
            },
            quizzes: {
                obtained: qMarks.reduce((s, q) => s + Number(q.obtainedMarks ?? 0), 0),
                max: qMarks.reduce((s, q) => s + Number(q.totalMarks ?? 0), 0),
            },
            internals: {
                obtained: iaMarks.reduce((s, a) => s + Number(a.marks ?? 0), 0),
                max: iaMarks.reduce((s, a) => s + Number(a.maxMarks ?? 0), 0),
            },
            attendance: attendance?.overall ?? null,
            attendanceStanding: attendance?.standing ?? null,
            attendanceBelowCount: attendance?.belowCount ?? 0,
        },
        attendance,
    };
}
export async function studentSubjects(studentId) {
    const data = await studentDashboard(studentId);
    return {
        class: data.class,
        subjects: data.subjects,
        backlogs: data.backlogs,
        additional: data.additional,
        electiveOptions: data.electiveOptions,
        selectedElectiveIds: data.selectedElectiveIds,
    };
}
export async function studentCurrentClass(studentId) {
    const ctx = await currentClassContext(studentId);
    return {
        class: ctx.class,
        pending: ctx.pending,
        subjectCount: ctx.pack ? ctx.pack.current.length : 0,
    };
}
export async function studentSubject(studentId, courseId) {
    const { assertSubjectAccess } = await import('./studentAccess.js');
    const access = await assertSubjectAccess(studentId, courseId);
    const progress = await dashboardProgress(studentId);
    const p = progress.byCourse.get(courseId);
    const [modules, outcomes, announcements, beyond, assignments, quizzes, assessments, cos, attendance] = await Promise.all([
        subjectModules(studentId, courseId),
        subjectOutcomes(studentId, courseId),
        subjectAnnouncements(studentId, courseId),
        subjectBeyondSyllabus(studentId, courseId),
        listStudentAssignments(studentId, courseId),
        listStudentQuizzes(studentId, courseId),
        listStudentAssessments(studentId, courseId),
        studentCoPerformance(studentId, courseId),
        studentSubjectAttendance(studentId, courseId).catch(() => null),
    ]);
    const s = access.subject;
    return {
        class: serializeClass(access.classRow),
        historical: access.historical,
        source: access.source,
        subject: {
            courseId: s.courseId || courseId,
            code: s.code,
            name: s.name,
            kind: s.kind,
            courseType: courseTypeLabel(s.kind),
            credits: s.credits ?? null,
            facultyName: facultyName(s),
            faculty: s.faculty ?? [],
            progress: p?.progress ?? 0,
            pendingTasks: p?.pendingTasks ?? 0,
        },
        modules: modules.modules,
        outcomes: outcomes.outcomes,
        announcements: announcements.announcements,
        beyondSyllabus: beyond.items,
        assignments: assignments.assignments,
        quizzes: quizzes.quizzes,
        assessments: assessments.assessments,
        coPerformance: cos.outcomes,
        attendance: attendance
            ? {
                percentage: attendance.percentage,
                standing: attendance.standing,
                PRESENT: attendance.PRESENT,
                ABSENT: attendance.ABSENT,
                total: attendance.total,
            }
            : null,
        continueLearning: progress.continueLearning?.courseId === courseId ? progress.continueLearning : null,
    };
}
export async function selectElective(studentId, classId, classSubjectId) {
    const enrollment = await db('academic_class_enrollments')
        .where({ student_id: studentId, academic_class_id: classId, status: 'APPROVED' })
        .first();
    if (!enrollment)
        throw new AppError(403, 'Join this class before selecting an elective');
    const subject = await db('academic_class_subjects')
        .where({ id: classSubjectId, academic_class_id: classId, is_active: true })
        .first();
    if (!subject)
        throw new AppError(404, 'Elective not found in this class');
    if (!['ELECTIVE', 'OPEN_ELECTIVE'].includes(String(subject.kind))) {
        throw new AppError(400, 'This subject is a core class subject and does not need a separate selection');
    }
    if (subject.elective_group) {
        const groupSubjects = await db('academic_class_subjects')
            .where({ academic_class_id: classId, elective_group: subject.elective_group, is_active: true })
            .select('id');
        await db('student_elective_selections')
            .where({ student_id: studentId, academic_class_id: classId })
            .whereIn('class_subject_id', groupSubjects.map((r) => r.id))
            .update({ status: 'WITHDRAWN', updated_at: db.fn.now() });
    }
    const existing = await db('student_elective_selections')
        .where({ student_id: studentId, academic_class_id: classId, class_subject_id: classSubjectId })
        .first();
    if (existing) {
        await db('student_elective_selections').where({ id: existing.id }).update({ status: 'ACTIVE', updated_at: db.fn.now() });
    }
    else {
        await db('student_elective_selections').insert({
            college_id: enrollment.college_id,
            student_id: studentId,
            academic_class_id: classId,
            class_subject_id: classSubjectId,
            course_id: subject.course_id,
            elective_group: subject.elective_group,
            status: 'ACTIVE',
        });
    }
    return studentDashboard(studentId);
}
