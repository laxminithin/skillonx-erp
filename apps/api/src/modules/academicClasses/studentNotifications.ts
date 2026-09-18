import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { accessibleCourseIds, currentClassContext, loadActiveStudent } from './studentAccess.js';
import { listAnnouncements } from './service.js';

type NotifyInput = {
  studentId: number;
  collegeId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: string | number | null;
  classId?: number | null;
  courseId?: number | null;
  dedupeKeyOverride?: string | null;
};

function dedupeKey(input: NotifyInput) {
  if (input.dedupeKeyOverride) return input.dedupeKeyOverride.slice(0, 191);
  return `${input.type}:${input.relatedType ?? ''}:${input.relatedId ?? ''}:${input.courseId ?? ''}`;
}

export async function notifyStudent(input: NotifyInput) {
  if (!(await db.schema.hasTable('student_notifications'))) return;
  const key = dedupeKey(input).slice(0, 191);
  const existing = await db('student_notifications')
    .where({ student_id: input.studentId, dedupe_key: key })
    .first();
  if (existing) return existing;
  try {
    const [id] = await db('student_notifications').insert({
      college_id: input.collegeId,
      student_id: input.studentId,
      academic_class_id: input.classId ?? null,
      course_id: input.courseId ?? null,
      type: input.type,
      title: input.title.slice(0, 255),
      body: input.body ?? null,
      link: input.link ?? null,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId != null ? String(input.relatedId) : null,
      dedupe_key: key,
      status: 'UNREAD',
    });
    return db('student_notifications').where({ id }).first();
  } catch (err) {
    const dbErr = err as { code?: string; errno?: number };
    if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) return;
    throw err;
  }
}

export async function notifyEnrollmentApproved(studentId: number, collegeId: number, classId: number, className: string) {
  await notifyStudent({
    studentId,
    collegeId,
    classId,
    type: 'CLASS_APPROVED',
    title: 'Class enrollment approved',
    body: `You now have access to every subject in ${className}.`,
    link: '/lms',
    relatedType: 'CLASS',
    relatedId: classId,
  });
}

async function syncFromClass(studentId: number) {
  const ctx = await currentClassContext(studentId);
  if (!ctx.classId || !ctx.pack || !ctx.classRow) return;
  const courseIds = accessibleCourseIds(ctx.pack);
  const collegeId = ctx.collegeId;
  const classId = ctx.classId;
  const sectionId = Number(ctx.classRow.class_section_id);

  const announcements = await listAnnouncements(classId);
  for (const item of announcements.slice(0, 20)) {
    await notifyStudent({
      studentId,
      collegeId,
      classId,
      courseId: item.courseId,
      type: 'ANNOUNCEMENT',
      title: item.title,
      body: item.body,
      link: item.courseId ? `/lms/subjects/${item.courseId}` : '/lms',
      relatedType: 'ANNOUNCEMENT',
      relatedId: item.id,
    });
  }

  if (courseIds.length) {
    const assignments = await db('assignments')
      .where({ college_id: collegeId })
      .whereIn('course_id', courseIds)
      .whereNull('deleted_at')
      .whereNotNull('published_at')
      .whereNotIn('status', ['DRAFT', 'ARCHIVED'])
      .andWhere((q) => q.whereNull('class_section_id').orWhere('class_section_id', sectionId))
      .orderBy('published_at', 'desc')
      .limit(30);
    for (const row of assignments) {
      await notifyStudent({
        studentId,
        collegeId,
        classId,
        courseId: Number(row.course_id),
        type: 'NEW_ASSIGNMENT',
        title: `New assignment: ${row.title}`,
        link: `/lms/assignments/${row.id}`,
        relatedType: 'ASSIGNMENT',
        relatedId: row.id,
      });
    }
    const quizzes = await db('quizzes')
      .where({ college_id: collegeId })
      .whereIn('course_id', courseIds)
      .whereNull('deleted_at')
      .whereNotNull('published_at')
      .whereNotIn('status', ['DRAFT', 'ARCHIVED'])
      .andWhere((q) => q.whereNull('class_section_id').orWhere('class_section_id', sectionId))
      .orderBy('published_at', 'desc')
      .limit(30);
    for (const row of quizzes) {
      await notifyStudent({
        studentId,
        collegeId,
        classId,
        courseId: Number(row.course_id),
        type: 'NEW_QUIZ',
        title: `New quiz: ${row.title}`,
        link: `/lms/quizzes/${row.id}`,
        relatedType: 'QUIZ',
        relatedId: row.id,
      });
    }
  }
}

function serialize(row: Record<string, any>) {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    courseId: row.course_id != null ? Number(row.course_id) : null,
    status: row.status,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function listNotifications(studentId: number, opts: { page?: number; limit?: number } = {}) {
  await loadActiveStudent(studentId);
  if (!(await db.schema.hasTable('student_notifications'))) {
    return { notifications: [], unread: 0, page: 1, limit: 30, total: 0 };
  }
  await syncFromClass(studentId);
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 30));
  const q = db('student_notifications').where({ student_id: studentId });
  const totalRow = await q.clone().count({ c: '*' }).first();
  const unreadRow = await q.clone().where({ status: 'UNREAD' }).count({ c: '*' }).first();
  const rows = await q.clone().orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);
  return {
    notifications: rows.map(serialize),
    unread: Number(unreadRow?.c ?? 0),
    page,
    limit,
    total: Number(totalRow?.c ?? 0),
  };
}

export async function markNotificationRead(studentId: number, id: number) {
  const row = await db('student_notifications').where({ id, student_id: studentId }).first();
  if (!row) throw new AppError(404, 'Notification not found');
  await db('student_notifications').where({ id }).update({ status: 'READ', read_at: db.fn.now() });
  return { ok: true };
}

export async function markAllNotificationsRead(studentId: number) {
  await db('student_notifications').where({ student_id: studentId, status: 'UNREAD' }).update({
    status: 'READ',
    read_at: db.fn.now(),
  });
  return { ok: true };
}

export async function markAnnouncementRead(studentId: number, announcementId: number) {
  if (!(await db.schema.hasTable('student_announcement_reads'))) return { ok: true };
  const existing = await db('student_announcement_reads')
    .where({ student_id: studentId, announcement_id: announcementId })
    .first();
  if (existing) return { ok: true };
  try {
    await db('student_announcement_reads').insert({
      student_id: studentId,
      announcement_id: announcementId,
    });
  } catch (err) {
    const dbErr = err as { code?: string; errno?: number };
    if (dbErr?.code !== 'ER_DUP_ENTRY' && dbErr?.errno !== 1062) throw err;
  }
  return { ok: true };
}

export async function notifyApprovedClass(input: {
  collegeId: number;
  classId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: string | number | null;
  courseId?: number | null;
  dedupeKeyPrefix?: string | null;
}) {
  const rows = await db('academic_class_enrollments')
    .where({ academic_class_id: input.classId, college_id: input.collegeId, status: 'APPROVED' })
    .select('student_id');
  for (const row of rows) {
    const studentId = Number(row.student_id);
    const dedupeKeyOverride = input.dedupeKeyPrefix
      ? `${input.dedupeKeyPrefix}:${studentId}`.slice(0, 191)
      : null;
    await notifyStudent({
      studentId,
      collegeId: input.collegeId,
      classId: input.classId,
      courseId: input.courseId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      dedupeKeyOverride,
    });
  }
  return { notified: rows.length };
}

export async function unreadAnnouncementIds(studentId: number, announcementIds: number[]) {
  if (!announcementIds.length || !(await db.schema.hasTable('student_announcement_reads'))) {
    return new Set(announcementIds);
  }
  const rows = await db('student_announcement_reads')
    .where({ student_id: studentId })
    .whereIn('announcement_id', announcementIds)
    .select('announcement_id');
  const read = new Set(rows.map((r) => Number(r.announcement_id)));
  return new Set(announcementIds.filter((id) => !read.has(id)));
}
