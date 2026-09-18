import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { getSurveyAvailabilityStatus } from '../../utils/surveyStatus.js';
import * as quizPublic from '../quizzes/attemptService.js';
import * as assignmentPublic from '../assignments/submissionService.js';
import { accessibleCourseIds, assertSubjectAccess, currentClassContext, loadActiveStudent, } from './studentAccess.js';
import { recordProgress } from './studentProgress.js';
import { mapAssessmentStatus, mapAssignmentStatus } from './studentProgressMath.js';
import { addDays } from '../lessonPlans/dates.js';
import { collegeTimezone, todayInTimezone } from '../timetable/time.js';
export const quizAnswerBodySchema = quizPublic.saveAnswersSchema.omit({ attemptToken: true }).extend({
    attemptToken: z.string().min(8).max(32),
});
export const quizSubmitBodySchema = quizPublic.submitSchema;
export const assignmentSaveBodySchema = assignmentPublic.saveAnswersSchema;
export const assignmentSubmitBodySchema = assignmentPublic.submitSchema;
function identity(student) {
    return {
        name: String(student.name),
        usn: String(student.usn),
        email: String(student.email),
    };
}
async function shareCode(table, idField, id) {
    const link = await db(table).where({ [idField]: id, is_active: true }).orderBy('id', 'desc').first();
    if (!link)
        throw new AppError(404, table === 'quiz_links' ? 'Quiz is not available' : 'Assignment is not available');
    return String(link.code);
}
function isOpenStatus(status) {
    return status === 'ACTIVE' || status === 'SCHEDULED';
}
function assignmentEffective(row) {
    return getSurveyAvailabilityStatus({
        status: row.status,
        startAt: row.start_at ?? null,
        endAt: row.due_at ?? row.end_at ?? null,
        closedAt: row.closed_at ?? null,
        archivedAt: row.archived_at ?? null,
    });
}
function quizEffective(row) {
    return getSurveyAvailabilityStatus({
        status: row.status,
        startAt: row.start_at ?? null,
        endAt: row.end_at ?? null,
        closedAt: row.closed_at ?? null,
        archivedAt: row.archived_at ?? null,
    });
}
async function assertPublishedAssignment(studentId, assignmentId) {
    const assignment = await db('assignments').where({ id: assignmentId }).whereNull('deleted_at').first();
    if (!assignment || assignment.status === 'DRAFT' || assignment.status === 'ARCHIVED' || !assignment.published_at) {
        throw new AppError(404, 'Assignment not found');
    }
    if (!assignment.course_id)
        throw new AppError(404, 'Assignment not found');
    const access = await assertSubjectAccess(studentId, Number(assignment.course_id));
    if (Number(assignment.college_id) !== access.collegeId) {
        throw new AppError(403, 'You cannot access this assignment', undefined, 'TENANT_MISMATCH');
    }
    if (assignment.class_section_id &&
        Number(assignment.class_section_id) !== Number(access.classRow.class_section_id)) {
        throw new AppError(403, 'This assignment is not assigned to your class');
    }
    return { assignment, access };
}
async function assertPublishedQuiz(studentId, quizId) {
    const quiz = await db('quizzes').where({ id: quizId }).whereNull('deleted_at').first();
    if (!quiz || quiz.status === 'DRAFT' || quiz.status === 'ARCHIVED' || !quiz.published_at) {
        throw new AppError(404, 'Quiz not found');
    }
    if (!quiz.course_id)
        throw new AppError(404, 'Quiz not found');
    const access = await assertSubjectAccess(studentId, Number(quiz.course_id));
    if (Number(quiz.college_id) !== access.collegeId) {
        throw new AppError(403, 'You cannot access this quiz', undefined, 'TENANT_MISMATCH');
    }
    if (quiz.class_section_id && Number(quiz.class_section_id) !== Number(access.classRow.class_section_id)) {
        throw new AppError(403, 'This quiz is not assigned to your class');
    }
    return { quiz, access };
}
async function ownAssignmentSubmission(studentId, assignmentId, token) {
    const submission = await db('assignment_submissions')
        .where({ public_token: token, assignment_id: assignmentId })
        .first();
    if (!submission)
        throw new AppError(404, 'Submission not found');
    if (Number(submission.student_id) !== studentId) {
        throw new AppError(403, 'You cannot access this submission');
    }
    return submission;
}
async function ownQuizAttempt(studentId, quizId, token) {
    const attempt = await db('quiz_attempts').where({ public_token: token, quiz_id: quizId }).first();
    if (!attempt)
        throw new AppError(404, 'Attempt not found');
    if (Number(attempt.student_id) !== studentId) {
        throw new AppError(403, 'You cannot access this attempt');
    }
    return attempt;
}
function courseNameMap(subjects) {
    return new Map(subjects.map((s) => [s.courseId, { name: s.name, code: s.code }]));
}
export async function listStudentAssignments(studentId, courseId) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack || !ctx.classRow)
        return { assignments: [] };
    if (courseId)
        await assertSubjectAccess(studentId, courseId);
    const courseIds = courseId ? [courseId] : accessibleCourseIds(ctx.pack);
    const names = courseNameMap([...ctx.pack.current, ...ctx.pack.backlogs, ...ctx.pack.overrides]);
    const rows = await db('assignments as a')
        .leftJoin('subject_modules as m', 'm.id', 'a.module_id')
        .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
        .where('a.college_id', ctx.collegeId)
        .whereIn('a.course_id', courseIds)
        .whereNull('a.deleted_at')
        .whereNotNull('a.published_at')
        .whereNotIn('a.status', ['DRAFT', 'ARCHIVED'])
        .andWhere((q) => q.whereNull('a.class_section_id').orWhere('a.class_section_id', ctx.classRow.class_section_id))
        .select('a.id', 'a.title', 'a.course_id', 'a.module_id', 'a.start_at', 'a.due_at', 'a.published_at', 'a.status', 'a.attempts_allowed', 'a.late_submission_allowed', 'm.name as module_name', 'f.name as faculty_name')
        .orderBy('a.due_at', 'asc');
    const submissions = rows.length
        ? await db('assignment_submissions')
            .where({ student_id: studentId })
            .whereIn('assignment_id', rows.map((r) => r.id))
            .orderBy('attempt_number', 'desc')
        : [];
    const latest = new Map();
    for (const row of submissions) {
        const id = Number(row.assignment_id);
        if (!latest.has(id))
            latest.set(id, row);
    }
    return {
        assignments: rows.map((row) => {
            const sub = latest.get(Number(row.id));
            const course = names.get(Number(row.course_id));
            return {
                id: Number(row.id),
                title: row.title,
                courseId: Number(row.course_id),
                courseName: course?.name,
                courseCode: course?.code,
                moduleName: row.module_name,
                facultyName: row.faculty_name,
                startAt: row.start_at,
                dueAt: row.due_at,
                publishedAt: row.published_at,
                attemptsAllowed: Number(row.attempts_allowed ?? 1),
                lateSubmissionAllowed: Boolean(row.late_submission_allowed),
                effectiveStatus: assignmentEffective(row),
                studentStatus: mapAssignmentStatus({
                    status: sub?.status,
                    submittedAt: sub?.submitted_at,
                    isLate: Boolean(sub?.is_late),
                    evaluationStatus: sub?.evaluation_status,
                    resultsReleased: Boolean(sub?.results_released),
                }),
                obtainedMarks: sub?.results_released ? Number(sub.obtained_marks) : null,
                totalMarks: sub?.results_released ? Number(sub.total_marks) : null,
            };
        }),
    };
}
export async function getStudentAssignment(studentId, assignmentId) {
    const { assignment, access } = await assertPublishedAssignment(studentId, assignmentId);
    const stats = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .count({ c: '*' })
        .sum({ marks: 'marks' })
        .first();
    const moduleRow = assignment.module_id
        ? await db('subject_modules').where({ id: assignment.module_id }).first()
        : null;
    const faculty = await db('faculty_users').where({ id: assignment.created_by }).first();
    const submission = await db('assignment_submissions')
        .where({ assignment_id: assignmentId, student_id: studentId })
        .orderBy('attempt_number', 'desc')
        .first();
    const questions = await db('assignment_questions')
        .where({ assignment_id: assignmentId })
        .orderBy('sort_order')
        .select('id', 'question_text', 'marks', 'primary_co_code', 'response_format', 'question_type');
    const course = await db('courses').where({ id: assignment.course_id, college_id: access.collegeId }).first();
    return {
        historical: access.historical,
        assignment: {
            id: Number(assignment.id),
            title: assignment.title,
            description: assignment.description,
            instructions: assignment.instructions,
            courseId: Number(assignment.course_id),
            courseName: course?.name,
            courseCode: course?.code,
            moduleName: moduleRow?.name ?? null,
            facultyName: faculty?.name ?? null,
            assignedAt: assignment.published_at || assignment.start_at,
            dueAt: assignment.due_at,
            maxMarks: Number(stats?.marks ?? 0),
            questionCount: Number(stats?.c ?? 0),
            attemptsAllowed: Number(assignment.attempts_allowed ?? 1),
            lateSubmissionAllowed: Boolean(assignment.late_submission_allowed),
            lateDeadlineAt: assignment.late_deadline_at,
            cos: [...new Set(questions.map((q) => q.primary_co_code).filter(Boolean))],
            questions: questions.map((q) => ({
                id: Number(q.id),
                questionText: q.question_text,
                marks: Number(q.marks),
                co: q.primary_co_code,
                responseFormat: q.response_format,
            })),
            effectiveStatus: assignmentEffective(assignment),
        },
        submission: submission
            ? {
                id: Number(submission.id),
                token: submission.public_token,
                status: mapAssignmentStatus({
                    status: submission.status,
                    submittedAt: submission.submitted_at,
                    isLate: Boolean(submission.is_late),
                    evaluationStatus: submission.evaluation_status,
                    resultsReleased: Boolean(submission.results_released),
                }),
                submittedAt: submission.submitted_at,
                isLate: Boolean(submission.is_late),
                obtainedMarks: submission.results_released ? Number(submission.obtained_marks) : null,
                totalMarks: submission.results_released ? Number(submission.total_marks) : null,
                percentage: submission.results_released ? Number(submission.percentage) : null,
                feedbackReleased: Boolean(submission.results_released),
            }
            : null,
    };
}
export async function startStudentAssignment(studentId, assignmentId, meta) {
    const { assignment, access } = await assertPublishedAssignment(studentId, assignmentId);
    if (access.historical)
        throw new AppError(403, 'This assignment is read-only in academic history');
    const student = await loadActiveStudent(studentId);
    const code = await shareCode('assignment_links', 'assignment_id', assignmentId);
    const result = await assignmentPublic.startSubmission(code, identity(student), meta);
    const token = result.submissionToken;
    if (token)
        await ownAssignmentSubmission(studentId, assignmentId, token);
    return result;
}
export async function saveStudentAssignment(studentId, assignmentId, body) {
    await assertPublishedAssignment(studentId, assignmentId);
    await ownAssignmentSubmission(studentId, assignmentId, body.submissionToken);
    const code = await shareCode('assignment_links', 'assignment_id', assignmentId);
    return assignmentPublic.saveSubmissionAnswers(code, body);
}
export async function submitStudentAssignment(studentId, assignmentId, body) {
    const { assignment, access } = await assertPublishedAssignment(studentId, assignmentId);
    await ownAssignmentSubmission(studentId, assignmentId, body.submissionToken);
    const code = await shareCode('assignment_links', 'assignment_id', assignmentId);
    const result = await assignmentPublic.submitAssignment(code, body);
    await recordProgress({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId: Number(assignment.course_id),
        moduleId: assignment.module_id != null ? Number(assignment.module_id) : null,
        activityType: 'ASSIGNMENT',
        activityId: assignmentId,
        status: 'COMPLETED',
    });
    return result;
}
export async function getStudentAssignmentSubmission(studentId, assignmentId, token) {
    await assertPublishedAssignment(studentId, assignmentId);
    await ownAssignmentSubmission(studentId, assignmentId, token);
    const code = await shareCode('assignment_links', 'assignment_id', assignmentId);
    return assignmentPublic.getSubmission(code, token);
}
export async function listStudentQuizzes(studentId, courseId) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack || !ctx.classRow)
        return { quizzes: [] };
    if (courseId)
        await assertSubjectAccess(studentId, courseId);
    const courseIds = courseId ? [courseId] : accessibleCourseIds(ctx.pack);
    const names = courseNameMap([...ctx.pack.current, ...ctx.pack.backlogs, ...ctx.pack.overrides]);
    const rows = await db('quizzes as q')
        .leftJoin('subject_modules as m', 'm.id', 'q.module_id')
        .where('q.college_id', ctx.collegeId)
        .whereIn('q.course_id', courseIds)
        .whereNull('q.deleted_at')
        .whereNotNull('q.published_at')
        .whereNotIn('q.status', ['DRAFT', 'ARCHIVED'])
        .andWhere((inner) => inner.whereNull('q.class_section_id').orWhere('q.class_section_id', ctx.classRow.class_section_id))
        .select('q.id', 'q.title', 'q.course_id', 'q.module_id', 'q.start_at', 'q.end_at', 'q.published_at', 'q.status', 'q.duration_minutes', 'q.attempts_allowed', 'q.show_score_immediately', 'm.name as module_name')
        .orderBy('q.end_at', 'asc');
    const attempts = rows.length
        ? await db('quiz_attempts')
            .where({ student_id: studentId })
            .whereIn('quiz_id', rows.map((r) => r.id))
            .orderBy('attempt_number', 'desc')
        : [];
    const latest = new Map();
    const submittedCount = new Map();
    for (const row of attempts) {
        const id = Number(row.quiz_id);
        if (!latest.has(id))
            latest.set(id, row);
        if (row.status === 'SUBMITTED' || row.status === 'EXPIRED_SUBMITTED') {
            submittedCount.set(id, (submittedCount.get(id) ?? 0) + 1);
        }
    }
    const now = Date.now();
    const classified = rows.map((row) => {
        const attempt = latest.get(Number(row.id));
        const course = names.get(Number(row.course_id));
        const effective = quizEffective(row);
        const submitted = Boolean(attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED_SUBMITTED'));
        const start = row.start_at ? new Date(row.start_at).getTime() : 0;
        let bucket = 'AVAILABLE';
        if (submitted)
            bucket = 'COMPLETED';
        else if (start > now || effective === 'SCHEDULED')
            bucket = 'UPCOMING';
        return {
            id: Number(row.id),
            title: row.title,
            courseId: Number(row.course_id),
            courseName: course?.name,
            courseCode: course?.code,
            moduleName: row.module_name,
            startAt: row.start_at,
            endAt: row.end_at,
            durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
            attemptsAllowed: Number(row.attempts_allowed ?? 1),
            attemptsUsed: submittedCount.get(Number(row.id)) ?? 0,
            effectiveStatus: effective,
            bucket,
            inProgress: attempt?.status === 'IN_PROGRESS',
            scoreReleased: Boolean(submitted && row.show_score_immediately),
            obtainedMarks: submitted && row.show_score_immediately ? Number(attempt?.obtained_marks) : null,
            totalMarks: attempt ? Number(attempt.total_marks) : null,
        };
    });
    return { quizzes: classified };
}
export async function getStudentQuiz(studentId, quizId) {
    const { quiz, access } = await assertPublishedQuiz(studentId, quizId);
    const stats = await db('quiz_questions')
        .where({ quiz_id: quizId })
        .count({ c: '*' })
        .sum({ marks: 'marks' })
        .first();
    const moduleRow = quiz.module_id ? await db('subject_modules').where({ id: quiz.module_id }).first() : null;
    const course = await db('courses').where({ id: quiz.course_id, college_id: access.collegeId }).first();
    const attempt = await db('quiz_attempts')
        .where({ quiz_id: quizId, student_id: studentId })
        .orderBy('attempt_number', 'desc')
        .first();
    const submitted = await db('quiz_attempts')
        .where({ quiz_id: quizId, student_id: studentId })
        .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
        .count({ c: '*' })
        .first();
    const code = await shareCode('quiz_links', 'quiz_id', quizId);
    const publicView = await quizPublic.getPublicQuiz(code);
    return {
        historical: access.historical,
        accessible: publicView.accessible,
        message: 'message' in publicView ? publicView.message : undefined,
        quiz: {
            id: Number(quiz.id),
            title: quiz.title,
            description: quiz.description,
            instructions: quiz.instructions,
            courseId: Number(quiz.course_id),
            courseName: course?.name,
            courseCode: course?.code,
            moduleName: moduleRow?.name ?? null,
            durationMinutes: quiz.duration_minutes != null ? Number(quiz.duration_minutes) : null,
            attemptsAllowed: Number(quiz.attempts_allowed ?? 1),
            attemptsUsed: Number(submitted?.c ?? 0),
            questionCount: Number(stats?.c ?? 0),
            totalMarks: Number(stats?.marks ?? 0),
            startAt: quiz.start_at,
            endAt: quiz.end_at,
            showScoreImmediately: quiz.show_score_immediately == null ? true : Boolean(quiz.show_score_immediately),
            effectiveStatus: quizEffective(quiz),
        },
        attempt: attempt
            ? {
                token: attempt.public_token,
                status: attempt.status,
                obtainedMarks: attempt.status !== 'IN_PROGRESS' && (quiz.show_score_immediately == null || quiz.show_score_immediately)
                    ? Number(attempt.obtained_marks)
                    : null,
            }
            : null,
    };
}
export async function startStudentQuiz(studentId, quizId, meta) {
    const { access } = await assertPublishedQuiz(studentId, quizId);
    if (access.historical)
        throw new AppError(403, 'This quiz is read-only in academic history');
    const student = await loadActiveStudent(studentId);
    const code = await shareCode('quiz_links', 'quiz_id', quizId);
    const result = await quizPublic.startAttempt(code, identity(student), meta);
    const token = result.attemptToken;
    if (token)
        await ownQuizAttempt(studentId, quizId, token);
    return result;
}
export async function saveStudentQuiz(studentId, quizId, body) {
    await assertPublishedQuiz(studentId, quizId);
    await ownQuizAttempt(studentId, quizId, body.attemptToken);
    const code = await shareCode('quiz_links', 'quiz_id', quizId);
    return quizPublic.saveAttemptAnswers(code, body);
}
export async function submitStudentQuiz(studentId, quizId, body) {
    const { quiz, access } = await assertPublishedQuiz(studentId, quizId);
    await ownQuizAttempt(studentId, quizId, body.attemptToken);
    const code = await shareCode('quiz_links', 'quiz_id', quizId);
    const result = await quizPublic.submitAttempt(code, body);
    await recordProgress({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId: Number(quiz.course_id),
        moduleId: quiz.module_id != null ? Number(quiz.module_id) : null,
        activityType: 'QUIZ',
        activityId: quizId,
        status: 'COMPLETED',
    });
    return result;
}
export async function getStudentQuizAttempt(studentId, quizId, token) {
    await assertPublishedQuiz(studentId, quizId);
    await ownQuizAttempt(studentId, quizId, token);
    const code = await shareCode('quiz_links', 'quiz_id', quizId);
    return quizPublic.getAttempt(code, token);
}
export async function listStudentAssessments(studentId, courseId) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack || !ctx.classRow)
        return { assessments: [] };
    if (courseId)
        await assertSubjectAccess(studentId, courseId);
    const courseIds = courseId ? [courseId] : accessibleCourseIds(ctx.pack);
    const names = courseNameMap([...ctx.pack.current, ...ctx.pack.backlogs, ...ctx.pack.overrides]);
    const student = await loadActiveStudent(studentId);
    if (!(await db.schema.hasTable('assessment_mark_sheets')))
        return { assessments: [] };
    const sheets = await db('assessment_mark_sheets as s')
        .leftJoin('courses as c', 'c.id', 's.course_id')
        .where('s.college_id', ctx.collegeId)
        .whereIn('s.course_id', courseIds)
        .whereIn('s.source_kind', ['INTERNAL_PAPER', 'LAB', 'PROJECT', 'REASSESSMENT'])
        .andWhere((q) => q.whereNull('s.class_section_id').orWhere('s.class_section_id', ctx.classRow.class_section_id))
        .select('s.*', 'c.name as course_name', 'c.code as course_code')
        .orderBy('s.created_at', 'desc');
    const usn = String(student.usn).toUpperCase();
    const assessments = [];
    for (const sheet of sheets) {
        const row = await db('assessment_student_rows')
            .where({ sheet_id: sheet.id })
            .andWhere((q) => q.where({ student_id: studentId }).orWhere({ usn }))
            .first();
        const released = Boolean(sheet.frozen) || String(sheet.status).toUpperCase() === 'FROZEN';
        const questions = released && row
            ? await db('assessment_student_question_marks as m')
                .join('assessment_mark_questions as q', 'q.id', 'm.question_id')
                .where({ 'm.student_row_id': row.id })
                .select('q.primary_co_code', 'q.max_marks', 'm.awarded_marks')
            : [];
        const coMap = new Map();
        for (const q of questions) {
            if (!q.primary_co_code)
                continue;
            const cur = coMap.get(String(q.primary_co_code)) ?? { awarded: 0, max: 0 };
            cur.awarded += Number(q.awarded_marks ?? 0);
            cur.max += Number(q.max_marks ?? 0);
            coMap.set(String(q.primary_co_code), cur);
        }
        assessments.push({
            id: Number(sheet.id),
            title: sheet.title || names.get(Number(sheet.course_id))?.name || 'Internal Assessment',
            courseId: Number(sheet.course_id),
            courseName: sheet.course_name,
            courseCode: sheet.course_code,
            sourceKind: sheet.source_kind,
            date: sheet.created_at,
            maxMarks: Number(sheet.max_marks ?? 0),
            marks: released && row?.total_awarded != null ? Number(row.total_awarded) : null,
            percentage: released && row?.total_awarded != null && Number(sheet.max_marks)
                ? Math.round((Number(row.total_awarded) / Number(sheet.max_marks)) * 100)
                : null,
            status: mapAssessmentStatus({
                frozen: released,
                hasScore: row?.total_awarded != null,
                date: sheet.created_at,
            }),
            coBreakup: released
                ? [...coMap.entries()].map(([code, v]) => ({
                    code,
                    awarded: v.awarded,
                    max: v.max,
                    percentage: v.max ? Math.round((v.awarded / v.max) * 100) : null,
                }))
                : [],
        });
    }
    return { assessments };
}
export async function listStudentTasks(studentId, tab = 'ALL') {
    const [assignments, quizzes, assessments] = await Promise.all([
        listStudentAssignments(studentId),
        listStudentQuizzes(studentId),
        listStudentAssessments(studentId),
    ]);
    const items = [
        ...assignments.assignments.map((a) => ({
            id: `assignment-${a.id}`,
            kind: 'ASSIGNMENT',
            title: a.title,
            courseName: a.courseName,
            dueAt: a.dueAt,
            status: a.studentStatus,
            path: `/lms/assignments/${a.id}`,
            completed: ['SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED'].includes(a.studentStatus),
        })),
        ...quizzes.quizzes.map((q) => ({
            id: `quiz-${q.id}`,
            kind: 'QUIZ',
            title: q.title,
            courseName: q.courseName,
            dueAt: q.endAt,
            status: q.bucket,
            path: `/lms/quizzes/${q.id}`,
            completed: q.bucket === 'COMPLETED',
        })),
        ...assessments.assessments.map((a) => ({
            id: `assessment-${a.id}`,
            kind: 'ASSESSMENT',
            title: a.title,
            courseName: a.courseName,
            dueAt: a.date,
            status: a.status,
            path: `/lms/assessments`,
            completed: a.status === 'RESULT_RELEASED' || a.status === 'COMPLETED',
        })),
    ];
    const soon = Date.now() + 7 * 24 * 60 * 60 * 1000;
    let filtered = items;
    if (tab === 'DUE_SOON') {
        filtered = items.filter((i) => !i.completed && i.dueAt && new Date(i.dueAt).getTime() <= soon);
    }
    else if (tab === 'ASSIGNMENTS')
        filtered = items.filter((i) => i.kind === 'ASSIGNMENT');
    else if (tab === 'QUIZZES')
        filtered = items.filter((i) => i.kind === 'QUIZ');
    else if (tab === 'ASSESSMENTS')
        filtered = items.filter((i) => i.kind === 'ASSESSMENT');
    else if (tab === 'COMPLETED')
        filtered = items.filter((i) => i.completed);
    filtered.sort((a, b) => {
        const da = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
    });
    return { tasks: filtered };
}
export async function studentCalendar(studentId) {
    const ctx = await currentClassContext(studentId);
    const [assignments, quizzes, assessments] = await Promise.all([
        listStudentAssignments(studentId),
        listStudentQuizzes(studentId),
        listStudentAssessments(studentId),
    ]);
    const events = [
        ...assignments.assignments.map((a) => ({
            id: `assignment-${a.id}`,
            kind: 'ASSIGNMENT',
            title: a.title,
            date: a.dueAt,
            path: `/lms/assignments/${a.id}`,
        })),
        ...quizzes.quizzes.map((q) => ({
            id: `quiz-${q.id}`,
            kind: 'QUIZ',
            title: q.title,
            date: q.endAt,
            path: `/lms/quizzes/${q.id}`,
        })),
        ...assessments.assessments.map((a) => ({
            id: `assessment-${a.id}`,
            kind: 'ASSESSMENT',
            title: a.title,
            date: a.date,
            path: '/lms/assessments',
        })),
    ];
    if (ctx.classRow && (await db.schema.hasTable('academic_calendar_exceptions'))) {
        const calendars = await db('academic_calendars')
            .where({ college_id: ctx.collegeId, academic_year_id: ctx.classRow.academic_year_id })
            .select('id', 'name');
        if (calendars.length) {
            const exceptions = await db('academic_calendar_exceptions')
                .whereIn('calendar_id', calendars.map((c) => c.id))
                .select('*');
            for (const ex of exceptions) {
                events.push({
                    id: `cal-${ex.id}`,
                    kind: String(ex.exception_type || 'ACADEMIC').toUpperCase() === 'HOLIDAY' ? 'HOLIDAY' : 'ACADEMIC',
                    title: ex.label || ex.exception_type,
                    date: ex.exception_date,
                    path: '/lms/calendar',
                });
            }
        }
    }
    if (ctx.classId && (await db.schema.hasTable('academic_calendar_events'))) {
        const calEvents = await db('academic_calendar_events')
            .where({ college_id: ctx.collegeId })
            .modify((q) => {
            if (ctx.classRow?.academic_year_id) {
                q.andWhere((inner) => inner.where({ academic_year_id: ctx.classRow.academic_year_id }).orWhereNull('academic_year_id'));
            }
        })
            .select('*');
        for (const ev of calEvents) {
            events.push({
                id: `event-${ev.id}`,
                kind: String(ev.event_type),
                title: ev.title,
                date: ev.start_date,
                path: '/lms/calendar',
            });
        }
    }
    if (ctx.classId) {
        try {
            const { studentTimetable } = await import('../timetable/service.js');
            const college = await db('colleges').where({ id: ctx.collegeId }).select('timezone').first();
            const today = todayInTimezone(collegeTimezone(college?.timezone));
            const tt = await studentTimetable(studentId, addDays(today, -7), addDays(today, 70));
            for (const o of tt.occurrences) {
                events.push({
                    id: o.id,
                    kind: o.state === 'HOLIDAY' ? 'HOLIDAY' : o.state === 'CANCELLED' ? 'CANCELLED' : 'CLASS',
                    title: o.state === 'HOLIDAY'
                        ? o.holidayLabel || 'Holiday / No Class'
                        : o.state === 'CANCELLED'
                            ? `${o.courseName} (cancelled)`
                            : `${o.courseName} · ${o.startTime}–${o.endTime}`,
                    date: o.date,
                    path: '/lms/timetable',
                    startTime: o.startTime,
                    endTime: o.endTime,
                });
            }
        }
        catch {
            /* timetable schema may not be installed */
        }
    }
    events.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
    });
    return { events };
}
export { isOpenStatus };
