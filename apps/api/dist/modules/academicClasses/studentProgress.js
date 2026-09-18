import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { combineProgress } from './studentProgressMath.js';
import { accessibleCourseIds, assertSubjectAccess, currentClassContext } from './studentAccess.js';
async function tableReady() {
    return db.schema.hasTable('student_learning_progress');
}
export async function recordProgress(input) {
    if (!(await tableReady()))
        return;
    const activityId = String(input.activityId);
    const existing = await db('student_learning_progress')
        .where({
        student_id: input.studentId,
        course_id: input.courseId,
        activity_type: input.activityType,
        activity_id: activityId,
    })
        .first();
    const completed = (input.status ?? 'COMPLETED') === 'COMPLETED';
    const patch = {
        college_id: input.collegeId,
        academic_class_id: input.classId ?? null,
        module_id: input.moduleId ?? null,
        topic_id: input.topicId ?? null,
        status: input.status ?? 'COMPLETED',
        progress_percentage: input.progressPercentage ?? (completed ? 100 : 0),
        completed_at: completed ? db.fn.now() : null,
        updated_at: db.fn.now(),
    };
    if (existing) {
        if (existing.status === 'COMPLETED' && completed)
            return;
        await db('student_learning_progress').where({ id: existing.id }).update(patch);
        return;
    }
    try {
        await db('student_learning_progress').insert({
            student_id: input.studentId,
            course_id: input.courseId,
            activity_type: input.activityType,
            activity_id: activityId,
            ...patch,
        });
    }
    catch (err) {
        const dbErr = err;
        if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062)
            return;
        throw err;
    }
}
export async function rememberPosition(input) {
    if (!(await db.schema.hasTable('student_learning_positions')))
        return;
    const existing = await db('student_learning_positions')
        .where({ student_id: input.studentId, course_id: input.courseId })
        .first();
    const patch = {
        college_id: input.collegeId,
        academic_class_id: input.classId ?? null,
        module_id: input.moduleId ?? null,
        topic_id: input.topicId ?? null,
        path: input.path,
        label: input.label.slice(0, 255),
        updated_at: db.fn.now(),
    };
    if (existing) {
        await db('student_learning_positions').where({ id: existing.id }).update(patch);
        return;
    }
    try {
        await db('student_learning_positions').insert({
            student_id: input.studentId,
            course_id: input.courseId,
            ...patch,
        });
    }
    catch (err) {
        const dbErr = err;
        if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
            await db('student_learning_positions')
                .where({ student_id: input.studentId, course_id: input.courseId })
                .update(patch);
        }
        else {
            throw err;
        }
    }
}
async function publishedWork(collegeId, courseIds, classSectionId) {
    if (!courseIds.length) {
        return { assignments: [], quizzes: [] };
    }
    let assignments = [];
    let quizzes = [];
    try {
        assignments = await db('assignments as a')
            .where('a.college_id', collegeId)
            .whereIn('a.course_id', courseIds)
            .whereNull('a.deleted_at')
            .whereNotNull('a.published_at')
            .whereNotIn('a.status', ['DRAFT', 'ARCHIVED'])
            .andWhere((q) => q.whereNull('a.class_section_id').orWhere('a.class_section_id', classSectionId))
            .select('a.id', 'a.course_id', 'a.module_id', 'a.status', 'a.due_at', 'a.published_at', 'a.title');
    }
    catch {
        assignments = [];
    }
    try {
        quizzes = await db('quizzes as q')
            .where('q.college_id', collegeId)
            .whereIn('q.course_id', courseIds)
            .whereNull('q.deleted_at')
            .whereNotNull('q.published_at')
            .whereNotIn('q.status', ['DRAFT', 'ARCHIVED'])
            .andWhere((inner) => inner.whereNull('q.class_section_id').orWhere('q.class_section_id', classSectionId))
            .select('q.id', 'q.course_id', 'q.module_id', 'q.status', 'q.end_at', 'q.published_at', 'q.title');
    }
    catch {
        quizzes = [];
    }
    return { assignments, quizzes };
}
async function topicTotals(collegeId, courseIds) {
    const map = new Map();
    if (!courseIds.length)
        return map;
    const rows = (await db('lesson_topics')
        .where({ college_id: collegeId })
        .whereIn('course_id', courseIds)
        .groupBy('course_id')
        .select('course_id')
        .count({ c: '*' }));
    for (const row of rows)
        map.set(Number(row.course_id), Number(row.c ?? 0));
    return map;
}
async function cbsTotals(collegeId, courseIds) {
    const map = new Map();
    if (!courseIds.length || !(await db.schema.hasTable('faculty_cbs_plan_items')))
        return map;
    const rows = (await db('faculty_cbs_plan_items as i')
        .join('faculty_cbs_plans as p', 'p.id', 'i.plan_id')
        .where('p.college_id', collegeId)
        .whereIn('p.course_id', courseIds)
        .whereNot('p.status', 'DRAFT')
        .whereNull('p.archived_at')
        .groupBy('p.course_id')
        .select('p.course_id')
        .count({ c: '*' }));
    for (const row of rows)
        map.set(Number(row.course_id), Number(row.c ?? 0));
    return map;
}
function counts(done, total) {
    return { done: Math.min(done, total), total };
}
export async function progressForCourses(studentId, collegeId, classId, courseIds, classSectionId) {
    const ready = await tableReady();
    const [topics, work, cbs, events, submissions, attempts] = await Promise.all([
        topicTotals(collegeId, courseIds),
        publishedWork(collegeId, courseIds, classSectionId),
        cbsTotals(collegeId, courseIds),
        ready
            ? db('student_learning_progress').where({ student_id: studentId, college_id: collegeId }).select('*')
            : Promise.resolve([]),
        courseIds.length
            ? db('assignment_submissions')
                .where({ student_id: studentId, college_id: collegeId })
                .whereIn('status', ['SUBMITTED', 'LATE_SUBMITTED'])
                .select('assignment_id')
            : Promise.resolve([]),
        courseIds.length
            ? db('quiz_attempts')
                .where({ student_id: studentId, college_id: collegeId })
                .whereIn('status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
                .select('quiz_id')
            : Promise.resolve([]),
    ]);
    const submittedAssignments = new Set(submissions.map((r) => Number(r.assignment_id)));
    const submittedQuizzes = new Set(attempts.map((r) => Number(r.quiz_id)));
    const completedTopics = new Map();
    const completedCbs = new Map();
    for (const event of events) {
        if (event.status !== 'COMPLETED')
            continue;
        const courseId = Number(event.course_id);
        if (event.activity_type === 'TOPIC') {
            completedTopics.set(courseId, (completedTopics.get(courseId) ?? 0) + 1);
        }
        if (event.activity_type === 'CBS') {
            completedCbs.set(courseId, (completedCbs.get(courseId) ?? 0) + 1);
        }
    }
    const byCourse = new Map();
    for (const courseId of courseIds) {
        const courseAssignments = work.assignments.filter((a) => Number(a.course_id) === courseId);
        const courseQuizzes = work.quizzes.filter((q) => Number(q.course_id) === courseId);
        const topicCount = topics.get(courseId) ?? 0;
        const assignmentDone = courseAssignments.filter((a) => submittedAssignments.has(Number(a.id))).length;
        const quizDone = courseQuizzes.filter((q) => submittedQuizzes.has(Number(q.id))).length;
        const topicDone = completedTopics.get(courseId) ?? 0;
        const cbsTotal = cbs.get(courseId) ?? 0;
        const cbsDone = completedCbs.get(courseId) ?? 0;
        const input = {
            topics: counts(topicDone, topicCount),
            assignments: counts(assignmentDone, courseAssignments.length),
            quizzes: counts(quizDone, courseQuizzes.length),
            activities: counts(cbsDone, cbsTotal),
        };
        const pendingTasks = Math.max(0, courseAssignments.length - assignmentDone) + Math.max(0, courseQuizzes.length - quizDone);
        byCourse.set(courseId, {
            progress: combineProgress(input),
            topics: input.topics,
            assignments: input.assignments,
            quizzes: input.quizzes,
            activities: input.activities,
            pendingTasks,
        });
    }
    const overall = courseIds.length === 0
        ? 0
        : Math.round(courseIds.reduce((sum, id) => sum + (byCourse.get(id)?.progress ?? 0), 0) / courseIds.length);
    return { byCourse, overall, work };
}
export async function continueLearning(studentId, classId) {
    if (!(await db.schema.hasTable('student_learning_positions')))
        return null;
    const q = db('student_learning_positions as p')
        .join('courses as c', 'c.id', 'p.course_id')
        .leftJoin('subject_modules as m', 'm.id', 'p.module_id')
        .leftJoin('lesson_topics as t', 't.id', 'p.topic_id')
        .where('p.student_id', studentId)
        .select('p.course_id', 'p.module_id', 'p.topic_id', 'p.path', 'p.label', 'c.name as course_name', 'c.code as course_code', 'm.name as module_name', 't.name as topic_name')
        .orderBy('p.updated_at', 'desc');
    if (classId)
        q.andWhere((inner) => inner.where('p.academic_class_id', classId).orWhereNull('p.academic_class_id'));
    const row = await q.first();
    if (!row)
        return null;
    return {
        courseId: Number(row.course_id),
        courseName: row.course_name,
        courseCode: row.course_code,
        moduleId: row.module_id != null ? Number(row.module_id) : null,
        moduleName: row.module_name,
        topicId: row.topic_id != null ? Number(row.topic_id) : null,
        topicName: row.topic_name,
        path: row.path,
        label: row.label,
    };
}
export async function completeTopic(studentId, courseId, topicId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const topic = await db('lesson_topics')
        .where({ id: topicId, course_id: courseId, college_id: access.collegeId })
        .first();
    if (!topic)
        throw new AppError(404, 'Topic not found');
    await recordProgress({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId,
        moduleId: topic.module_id != null ? Number(topic.module_id) : null,
        topicId,
        activityType: 'TOPIC',
        activityId: topicId,
        status: 'COMPLETED',
    });
    await rememberPosition({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId,
        moduleId: topic.module_id != null ? Number(topic.module_id) : null,
        topicId,
        path: `/lms/subjects/${courseId}/topics/${topicId}`,
        label: String(topic.name),
    });
    return { completed: true, topicId };
}
export async function dashboardProgress(studentId) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack || !ctx.classRow) {
        return { overall: 0, byCourse: new Map(), work: { assignments: [], quizzes: [] }, continueLearning: null };
    }
    const courseIds = accessibleCourseIds(ctx.pack);
    const progress = await progressForCourses(studentId, ctx.collegeId, ctx.classId, courseIds, Number(ctx.classRow.class_section_id));
    const cont = await continueLearning(studentId, ctx.classId);
    return { ...progress, continueLearning: cont };
}
