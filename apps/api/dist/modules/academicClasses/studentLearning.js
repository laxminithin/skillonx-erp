import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { catalogSubject } from '../lessonPlans/service.js';
import { listPapers, getPaper } from '../questionPapers/service.js';
import { accessibleCourseIds, assertSubjectAccess, currentClassContext, facultyName, } from './studentAccess.js';
import { recordProgress, rememberPosition } from './studentProgress.js';
import { unreadAnnouncementIds } from './studentNotifications.js';
import { listAnnouncements } from './service.js';
export const bookmarkSchema = z.object({
    kind: z.enum(['TOPIC', 'MATERIAL', 'PYQ', 'ANNOUNCEMENT']),
    refId: z.union([z.string().min(1).max(64), z.number().int().positive()]),
    courseId: z.number().int().positive().optional().nullable(),
    title: z.string().trim().min(1).max(255),
    path: z.string().trim().min(1).max(255),
});
export const searchSchema = z.object({
    q: z.string().trim().min(2).max(120),
});
function publishedOnly(rows) {
    return rows.filter((row) => {
        const status = String(row.status || '').toUpperCase();
        return status !== 'DRAFT';
    });
}
export async function subjectModules(studentId, courseId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const catalog = await catalogSubject(access.collegeId, courseId);
    const events = (await db.schema.hasTable('student_learning_progress'))
        ? await db('student_learning_progress')
            .where({ student_id: studentId, course_id: courseId, activity_type: 'TOPIC', status: 'COMPLETED' })
            .select('activity_id')
        : [];
    const done = new Set(events.map((r) => String(r.activity_id)));
    const modules = catalog.modules.map((mod) => {
        const topics = mod.topics.map((topic) => ({
            ...topic,
            completed: done.has(String(topic.id)),
        }));
        const completedCount = topics.filter((t) => t.completed).length;
        return {
            ...mod,
            topics,
            completedTopics: completedCount,
            progress: topics.length ? Math.round((completedCount / topics.length) * 100) : 0,
        };
    });
    return {
        course: catalog.course,
        historical: access.historical,
        moduleCount: catalog.moduleCount,
        topicCount: catalog.topicCount,
        hours: catalog.hours,
        modules,
    };
}
export async function subjectTopic(studentId, courseId, topicId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const topic = await db('lesson_topics')
        .where({ id: topicId, course_id: courseId, college_id: access.collegeId })
        .first();
    if (!topic)
        throw new AppError(404, 'Topic not found');
    const moduleRow = await db('subject_modules').where({ id: topic.module_id, college_id: access.collegeId }).first();
    const subtopics = await db('lesson_subtopics').where({ topic_id: topicId }).orderBy('sort_order');
    const hours = subtopics.reduce((sum, s) => sum + Number(s.suggested_hours ?? 0), 0);
    const completed = (await db.schema.hasTable('student_learning_progress'))
        ? Boolean(await db('student_learning_progress')
            .where({
            student_id: studentId,
            course_id: courseId,
            activity_type: 'TOPIC',
            activity_id: String(topicId),
            status: 'COMPLETED',
        })
            .first())
        : false;
    const siblings = await db('lesson_topics')
        .where({ course_id: courseId, college_id: access.collegeId, module_id: topic.module_id })
        .orderBy('sort_order')
        .select('id', 'name', 'sort_order');
    const index = siblings.findIndex((s) => Number(s.id) === topicId);
    const prev = index > 0 ? siblings[index - 1] : null;
    const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
    const assignments = await db('assignments')
        .where({ college_id: access.collegeId, course_id: courseId, module_id: topic.module_id })
        .whereNull('deleted_at')
        .whereNotNull('published_at')
        .whereNotIn('status', ['DRAFT', 'ARCHIVED'])
        .select('id', 'title', 'due_at', 'status');
    const quizzes = await db('quizzes')
        .where({ college_id: access.collegeId, course_id: courseId, module_id: topic.module_id })
        .whereNull('deleted_at')
        .whereNotNull('published_at')
        .whereNotIn('status', ['DRAFT', 'ARCHIVED'])
        .select('id', 'title', 'end_at', 'status');
    await rememberPosition({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId,
        moduleId: topic.module_id != null ? Number(topic.module_id) : null,
        topicId,
        path: `/lms/subjects/${courseId}/topics/${topicId}`,
        label: `${moduleRow?.name ?? 'Module'} · ${topic.name}`,
    });
    return {
        historical: access.historical,
        topic: {
            id: Number(topic.id),
            name: topic.name,
            moduleId: topic.module_id != null ? Number(topic.module_id) : null,
            moduleName: moduleRow?.name ?? null,
            hours,
            completed,
            subtopics: subtopics.map((s) => ({
                id: Number(s.id),
                name: s.name,
                hours: Number(s.suggested_hours ?? 0),
                classification: s.classification,
            })),
        },
        previous: prev ? { id: Number(prev.id), name: prev.name } : null,
        next: next ? { id: Number(next.id), name: next.name } : null,
        assignments: assignments.map((a) => ({ id: Number(a.id), title: a.title, dueAt: a.due_at })),
        quizzes: quizzes.map((q) => ({ id: Number(q.id), title: q.title, endAt: q.end_at })),
    };
}
function materialType(row) {
    const text = `${row.kind ?? ''} ${row.title ?? ''} ${row.resources ?? ''}`.toLowerCase();
    if (text.includes('video'))
        return 'Video';
    if (text.includes('ppt') || text.includes('slide'))
        return 'PPT/PDF';
    if (text.includes('pdf') || text.includes('note'))
        return 'Notes';
    if (text.includes('lab'))
        return 'Lab Material';
    if (text.includes('http') || text.includes('link'))
        return 'Link';
    if (text.includes('beyond'))
        return 'Beyond Syllabus';
    return 'Reference';
}
export async function subjectMaterials(studentId, courseId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const catalog = await catalogSubject(access.collegeId, courseId);
    const items = [];
    for (const mod of catalog.modules) {
        for (const topic of mod.topics) {
            items.push({
                id: `topic-${topic.id}`,
                title: topic.name,
                type: 'Notes',
                moduleName: mod.name,
                topicName: topic.name,
                date: null,
                kind: 'TOPIC',
                path: `/lms/subjects/${courseId}/topics/${topic.id}`,
            });
        }
    }
    if (await db.schema.hasTable('faculty_cbs_plan_items')) {
        const cbs = await db('faculty_cbs_plan_items as i')
            .join('faculty_cbs_plans as p', 'p.id', 'i.plan_id')
            .where({ 'p.college_id': access.collegeId, 'p.course_id': courseId })
            .whereNot('p.status', 'DRAFT')
            .whereNull('p.archived_at')
            .select('i.id', 'i.title', 'i.resources', 'i.module_unit', 'i.updated_at', 'i.created_at')
            .orderBy('i.serial_no');
        for (const row of cbs) {
            items.push({
                id: `cbs-${row.id}`,
                title: row.title,
                type: materialType(row),
                moduleName: row.module_unit,
                date: row.updated_at || row.created_at,
                kind: 'CBS',
                path: `/lms/subjects/${courseId}?tab=beyond`,
            });
        }
    }
    return { historical: access.historical, materials: items };
}
export async function subjectBeyondSyllabus(studentId, courseId) {
    const access = await assertSubjectAccess(studentId, courseId);
    if (!(await db.schema.hasTable('faculty_cbs_plan_items'))) {
        return { items: [] };
    }
    const rows = await db('faculty_cbs_plan_items as i')
        .join('faculty_cbs_plans as p', 'p.id', 'i.plan_id')
        .where({ 'p.college_id': access.collegeId, 'p.course_id': courseId })
        .whereNot('p.status', 'DRAFT')
        .whereNull('p.archived_at')
        .select('i.id', 'i.title', 'i.content_description', 'i.rationale', 'i.expected_benefit', 'i.resources', 'i.suggested_delivery_method', 'i.module_unit', 'i.related_topic', 'i.planned_hours')
        .orderBy('i.serial_no');
    return {
        historical: access.historical,
        items: publishedOnly(rows).map((row) => ({
            id: Number(row.id),
            title: row.title,
            whyItMatters: row.rationale || row.expected_benefit,
            learningObjective: row.content_description,
            resources: row.resources,
            activity: row.suggested_delivery_method,
            module: row.module_unit,
            relatedTopic: row.related_topic,
            hours: row.planned_hours != null ? Number(row.planned_hours) : null,
        })),
    };
}
export async function subjectOutcomes(studentId, courseId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const rows = await db('course_outcomes')
        .where({ college_id: access.collegeId, course_id: courseId, is_current: true })
        .orderBy('co_number')
        .select('id', 'co_code', 'statement', 'co_number');
    return {
        outcomes: rows.map((row) => ({
            id: Number(row.id),
            code: row.co_code,
            statement: row.statement,
            number: row.co_number != null ? Number(row.co_number) : null,
        })),
    };
}
export async function subjectAnnouncements(studentId, courseId) {
    const access = await assertSubjectAccess(studentId, courseId);
    const rows = await listAnnouncements(access.classId, courseId);
    const unread = await unreadAnnouncementIds(studentId, rows.map((r) => r.id));
    return {
        announcements: rows.map((row) => ({
            ...row,
            unread: unread.has(row.id),
            faculty: row.authorName,
        })),
    };
}
export async function studentPyqs(studentId, filters = {}) {
    const ctx = await currentClassContext(studentId);
    const allowed = new Set(ctx.pack ? accessibleCourseIds(ctx.pack) : []);
    if (filters.courseId) {
        await assertSubjectAccess(studentId, filters.courseId);
    }
    const result = await listPapers(ctx.collegeId, {
        courseId: filters.courseId,
        year: filters.year,
        scheme: filters.scheme,
        examType: filters.examType,
        semester: filters.semester,
    });
    const papers = result.papers.filter((p) => {
        if (!p.courseId)
            return !filters.courseId;
        return allowed.has(p.courseId) || p.courseId === filters.courseId;
    });
    return {
        papers: papers.map((p) => ({
            id: p.id,
            paperId: p.paperId,
            subjectName: p.subjectName,
            courseCode: p.courseCode,
            courseId: p.courseId,
            scheme: p.scheme,
            semester: p.semester,
            examType: p.examType,
            examYear: p.examYear,
            academicYear: p.academicYear,
            sourceUrl: null,
        })),
    };
}
export async function studentPyq(studentId, paperId) {
    const ctx = await currentClassContext(studentId);
    const paper = await getPaper(ctx.collegeId, paperId);
    const courseId = paper.paper.courseId;
    if (courseId)
        await assertSubjectAccess(studentId, courseId);
    const allowed = new Set(ctx.pack ? accessibleCourseIds(ctx.pack) : []);
    if (courseId && !allowed.has(courseId)) {
        throw new AppError(403, 'This paper is not part of your class LMS');
    }
    return {
        paper: {
            id: paper.paper.id,
            paperId: paper.paper.paperId,
            subjectName: paper.paper.subjectName,
            courseCode: paper.paper.courseCode,
            scheme: paper.paper.scheme,
            examType: paper.paper.examType,
            examYear: paper.paper.examYear,
            sourceUrl: paper.paper.sourceUrl,
            questions: paper.questions.map((q) => ({
                id: q.id,
                questionNumber: q.questionNumber,
                questionText: q.questionText,
                maxMarks: q.maxMarks,
                moduleOrUnit: q.moduleOrUnit,
            })),
        },
    };
}
export async function searchStudentContent(studentId, query) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.pack)
        return { results: [] };
    const courseIds = accessibleCourseIds(ctx.pack);
    if (!courseIds.length)
        return { results: [] };
    const term = `%${query.trim()}%`;
    const collegeId = ctx.collegeId;
    const [topics, modules, assignments, announcements, papers] = await Promise.all([
        db('lesson_topics as t')
            .join('courses as c', 'c.id', 't.course_id')
            .leftJoin('subject_modules as m', 'm.id', 't.module_id')
            .where('t.college_id', collegeId)
            .whereIn('t.course_id', courseIds)
            .andWhere('t.name', 'like', term)
            .select('t.id', 't.name', 't.course_id', 'c.name as course_name', 'm.name as module_name')
            .limit(8),
        db('subject_modules as m')
            .join('courses as c', 'c.id', 'm.course_id')
            .where('m.college_id', collegeId)
            .whereIn('m.course_id', courseIds)
            .andWhere('m.name', 'like', term)
            .select('m.id', 'm.name', 'm.course_id', 'c.name as course_name')
            .limit(6),
        db('assignments as a')
            .join('courses as c', 'c.id', 'a.course_id')
            .where('a.college_id', collegeId)
            .whereIn('a.course_id', courseIds)
            .whereNull('a.deleted_at')
            .whereNotNull('a.published_at')
            .whereNotIn('a.status', ['DRAFT', 'ARCHIVED'])
            .andWhere('a.title', 'like', term)
            .select('a.id', 'a.title', 'a.course_id', 'c.name as course_name')
            .limit(6),
        db('academic_class_announcements as a')
            .where('a.academic_class_id', ctx.classId)
            .andWhere('a.is_active', true)
            .andWhere((q) => q.where('a.title', 'like', term).orWhere('a.body', 'like', term))
            .select('a.id', 'a.title', 'a.course_id')
            .limit(6),
        db('previous_year_papers as p')
            .where('p.college_id', collegeId)
            .where('p.is_active', true)
            .where((q) => q.whereIn('p.course_id', courseIds).orWhereNull('p.course_id'))
            .andWhere((q) => q.where('p.subject_name', 'like', term).orWhere('p.course_code', 'like', term))
            .select('p.id', 'p.subject_name', 'p.course_code', 'p.course_id', 'p.exam_year')
            .limit(6),
    ]);
    const results = [
        ...modules.map((row) => ({
            kind: 'MODULE',
            id: Number(row.id),
            title: row.name,
            subtitle: row.course_name,
            path: `/lms/subjects/${row.course_id}?tab=modules`,
        })),
        ...topics.map((row) => ({
            kind: 'TOPIC',
            id: Number(row.id),
            title: row.name,
            subtitle: [row.course_name, row.module_name].filter(Boolean).join(' · '),
            path: `/lms/subjects/${row.course_id}/topics/${row.id}`,
        })),
        ...assignments.map((row) => ({
            kind: 'ASSIGNMENT',
            id: Number(row.id),
            title: row.title,
            subtitle: row.course_name,
            path: `/lms/assignments/${row.id}`,
        })),
        ...announcements.map((row) => ({
            kind: 'ANNOUNCEMENT',
            id: Number(row.id),
            title: row.title,
            subtitle: 'Announcement',
            path: row.course_id ? `/lms/subjects/${row.course_id}` : '/lms',
        })),
        ...papers.map((row) => ({
            kind: 'PYQ',
            id: Number(row.id),
            title: `${row.subject_name} ${row.exam_year ?? ''}`.trim(),
            subtitle: row.course_code,
            path: `/lms/papers/${row.id}`,
        })),
    ];
    return { results };
}
export async function listBookmarks(studentId) {
    if (!(await db.schema.hasTable('student_bookmarks')))
        return { bookmarks: [] };
    const rows = await db('student_bookmarks').where({ student_id: studentId }).orderBy('created_at', 'desc');
    return {
        bookmarks: rows.map((row) => ({
            id: Number(row.id),
            kind: row.kind,
            refId: row.ref_id,
            courseId: row.course_id != null ? Number(row.course_id) : null,
            title: row.title,
            path: row.path,
            createdAt: row.created_at,
        })),
    };
}
export async function addBookmark(studentId, input) {
    const student = await db('students').where({ id: studentId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    if (input.courseId)
        await assertSubjectAccess(studentId, input.courseId);
    const refId = String(input.refId);
    const existing = await db('student_bookmarks')
        .where({ student_id: studentId, kind: input.kind, ref_id: refId })
        .first();
    if (existing) {
        return { bookmark: { id: Number(existing.id), kind: existing.kind, title: existing.title, path: existing.path } };
    }
    const [id] = await db('student_bookmarks').insert({
        college_id: student.college_id,
        student_id: studentId,
        course_id: input.courseId ?? null,
        kind: input.kind,
        ref_id: refId,
        title: input.title,
        path: input.path,
    });
    return { bookmark: { id, kind: input.kind, title: input.title, path: input.path, refId } };
}
export async function removeBookmark(studentId, id) {
    const row = await db('student_bookmarks').where({ id, student_id: studentId }).first();
    if (!row)
        throw new AppError(404, 'Saved item not found');
    await db('student_bookmarks').where({ id }).delete();
    return { ok: true };
}
export async function markMaterialViewed(studentId, courseId, materialId) {
    const access = await assertSubjectAccess(studentId, courseId);
    await recordProgress({
        studentId,
        collegeId: access.collegeId,
        classId: access.classId,
        courseId,
        activityType: materialId.startsWith('cbs-') ? 'CBS' : 'MATERIAL',
        activityId: materialId,
        status: 'COMPLETED',
    });
    return { ok: true };
}
export { facultyName };
