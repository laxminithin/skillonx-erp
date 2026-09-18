import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { loadClassRow, listClassSubjects } from '../academicClasses/service.js';
import { isClassAdmin, type ClassActor } from '../academicClasses/access.js';
import {
  assertSubjectAccess,
  currentClassContext,
  loadActiveStudent,
  subjectsForStudent,
} from '../academicClasses/studentAccess.js';
import {
  attendanceStanding,
  computeAttendancePercentage,
  DEFAULT_ATTENDANCE_POLICY,
  summarizeStatuses,
  type AttendancePolicy,
  type AttendanceStatus,
} from './policy.js';
import { sqlDate } from '../lessonPlans/dates.js';

type Row = Record<string, any>;

export const createSessionSchema = z.object({
  academicClassId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodNumber: z.number().int().positive().nullable().optional(),
  startTime: z.string().max(16).nullable().optional(),
  endTime: z.string().max(16).nullable().optional(),
  topicId: z.number().int().positive().nullable().optional(),
  topicLabel: z.string().trim().max(255).nullable().optional(),
  lessonPlanEntryId: z.number().int().positive().nullable().optional(),
  timetableSlotId: z.number().int().positive().nullable().optional(),
  timetableOverrideId: z.number().int().positive().nullable().optional(),
});

export const markRecordsSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.number().int().positive(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .min(1),
  reason: z.string().trim().max(500).optional(),
});

async function policyForCollege(collegeId: number): Promise<AttendancePolicy> {
  if (!(await db.schema.hasTable('college_attendance_policies'))) return DEFAULT_ATTENDANCE_POLICY;
  const row = await db('college_attendance_policies').where({ college_id: collegeId }).first();
  if (!row) return DEFAULT_ATTENDANCE_POLICY;
  return {
    minimumPercentage: Number(row.minimum_percentage ?? DEFAULT_ATTENDANCE_POLICY.minimumPercentage),
    countLateAsPresent: row.count_late_as_present == null ? true : Boolean(row.count_late_as_present),
    countExcusedInDenominator:
      row.count_excused_in_denominator == null ? true : Boolean(row.count_excused_in_denominator),
  };
}

export async function ensureCollegePolicy(collegeId: number) {
  if (!(await db.schema.hasTable('college_attendance_policies'))) return DEFAULT_ATTENDANCE_POLICY;
  const existing = await db('college_attendance_policies').where({ college_id: collegeId }).first();
  if (existing) return policyForCollege(collegeId);
  await db('college_attendance_policies').insert({
    college_id: collegeId,
    minimum_percentage: DEFAULT_ATTENDANCE_POLICY.minimumPercentage,
    count_late_as_present: DEFAULT_ATTENDANCE_POLICY.countLateAsPresent,
    count_excused_in_denominator: DEFAULT_ATTENDANCE_POLICY.countExcusedInDenominator,
  });
  return DEFAULT_ATTENDANCE_POLICY;
}

async function approvedClassStudents(classId: number, collegeId: number) {
  return db('academic_class_enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .where({
      'e.academic_class_id': classId,
      'e.college_id': collegeId,
      'e.status': 'APPROVED',
    })
    .andWhere('s.is_active', true)
    .select('s.id', 's.usn', 's.name', 's.email')
    .orderBy('s.usn');
}

async function isAuthorizedSubstitute(
  actor: ClassActor,
  classId: number,
  courseId: number,
  sessionDate: string,
) {
  if (!(await db.schema.hasTable('timetable_overrides'))) return false;
  const onDate = sqlDate(sessionDate);
  if (!onDate) return false;
  const row = await db('timetable_overrides')
    .where({
      college_id: actor.collegeId,
      academic_class_id: classId,
      override_date: onDate,
      substitute_faculty_id: actor.facultyUserId,
      kind: 'SUBSTITUTION',
      status: 'ACTIVE',
    })
    .andWhere((q) => q.where({ course_id: courseId }).orWhereNull('course_id'))
    .first();
  return Boolean(row);
}

async function assertCancelledOverride(
  collegeId: number,
  classId: number,
  courseId: number,
  sessionDate: string,
  slotId?: number | null,
) {
  if (!(await db.schema.hasTable('timetable_overrides'))) return;
  const onDate = sqlDate(sessionDate);
  if (!onDate) return;
  let q = db('timetable_overrides').where({
    college_id: collegeId,
    academic_class_id: classId,
    override_date: onDate,
    kind: 'CANCELLED',
    status: 'ACTIVE',
  });
  if (slotId) q = q.andWhere({ timetable_slot_id: slotId });
  else q = q.andWhere((inner) => inner.where({ course_id: courseId }).orWhereNull('course_id'));
  const row = await q.first();
  if (row) {
    throw new AppError(400, 'Attendance cannot be finalized for a cancelled class without an authorized override');
  }
}

async function assertFacultySubjectClass(
  actor: ClassActor,
  classId: number,
  courseId: number,
  sessionDate?: string,
) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  if (Number(classRow.college_id) !== actor.collegeId) {
    throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
  }
  const subjects = await listClassSubjects(classId);
  const subject = subjects.find((s) => s.courseId === courseId);
  if (!subject) throw new AppError(404, 'Subject is not mapped to this class');
  const isAssigned = subject.faculty.some((f) => f.facultyId === actor.facultyUserId);
  const isCoordinator = Number(classRow.coordinator_id) === actor.facultyUserId;
  const substitute = sessionDate ? await isAuthorizedSubstitute(actor, classId, courseId, sessionDate) : false;
  if (!isAssigned && !isCoordinator && !substitute && !isClassAdmin(actor.role)) {
    throw new AppError(403, 'You are not assigned to this class subject');
  }
  return { classRow, subject, substitute };
}

async function resolveSubstituteOriginalFaculty(
  classId: number,
  courseId: number,
  sessionDate: string,
  substituteFacultyId: number,
) {
  if (!(await db.schema.hasTable('timetable_overrides'))) return null;
  const row = await db('timetable_overrides')
    .where({
      academic_class_id: classId,
      override_date: sqlDate(sessionDate),
      substitute_faculty_id: substituteFacultyId,
      kind: 'SUBSTITUTION',
      status: 'ACTIVE',
    })
    .andWhere((q) => q.where({ course_id: courseId }).orWhereNull('course_id'))
    .first();
  return row?.original_faculty_id ? Number(row.original_faculty_id) : null;
}

function serializeSession(row: Row, extras: Record<string, unknown> = {}) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    academicClassId: Number(row.academic_class_id),
    courseId: Number(row.course_id),
    facultyId: Number(row.faculty_id),
      sessionDate: sqlDate(row.session_date),
    periodNumber: row.period_number != null ? Number(row.period_number) : null,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    topicId: row.topic_id != null ? Number(row.topic_id) : null,
    topicLabel: row.topic_label ?? null,
    lessonPlanEntryId: row.lesson_plan_entry_id != null ? Number(row.lesson_plan_entry_id) : null,
    status: row.status,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    ...extras,
  };
}

export async function listFacultySessions(actor: ClassActor, courseId: number, classId?: number) {
  let q = db('attendance_sessions as s')
    .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
    .join('courses as c', 'c.id', 's.course_id')
    .where({ 's.college_id': actor.collegeId, 's.course_id': courseId })
    .select(
      's.*',
      'ac.name as class_name',
      'ac.code as class_code',
      'c.name as course_name',
      'c.code as course_code',
    )
    .orderBy('s.session_date', 'desc')
    .orderBy('s.id', 'desc');
  if (classId) q = q.andWhere('s.academic_class_id', classId);
  if (!isClassAdmin(actor.role)) {
    const taught = await db('academic_class_subject_faculty')
      .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId, course_id: courseId, status: 'ACTIVE' })
      .select('academic_class_id');
    const classIds = taught.map((r) => Number(r.academic_class_id));
    if (!classIds.length) return { sessions: [], policy: await policyForCollege(actor.collegeId) };
    q = q.whereIn('s.academic_class_id', classIds);
  }
  const rows = await q.limit(100);
  return {
    policy: await policyForCollege(actor.collegeId),
    sessions: rows.map((r) =>
      serializeSession(r, {
        className: r.class_name,
        classCode: r.class_code,
        courseName: r.course_name,
        courseCode: r.course_code,
      }),
    ),
  };
}

export async function createSession(actor: ClassActor, input: z.infer<typeof createSessionSchema>) {
  await ensureCollegePolicy(actor.collegeId);
  const { classRow, subject, substitute } = await assertFacultySubjectClass(
    actor,
    input.academicClassId,
    input.courseId,
    input.sessionDate,
  );
  const originalFacultyId = substitute
    ? await resolveSubstituteOriginalFaculty(input.academicClassId, input.courseId, input.sessionDate, actor.facultyUserId)
    : actor.facultyUserId;
  if (input.timetableSlotId || input.timetableOverrideId) {
    await assertCancelledOverride(
      actor.collegeId,
      input.academicClassId,
      input.courseId,
      input.sessionDate,
      input.timetableSlotId,
    );
  }
  const students = await approvedClassStudents(input.academicClassId, actor.collegeId);
  if (!students.length) throw new AppError(400, 'This class has no approved students yet');

  const payload: Record<string, unknown> = {
    college_id: actor.collegeId,
    academic_class_id: input.academicClassId,
    course_id: input.courseId,
    faculty_id: actor.facultyUserId,
    academic_year_id: classRow.academic_year_id,
    semester_id: classRow.semester_id,
    session_date: sqlDate(input.sessionDate) ?? input.sessionDate,
    period_number: input.periodNumber ?? null,
    start_time: input.startTime ?? null,
    end_time: input.endTime ?? null,
    topic_id: input.topicId ?? null,
    topic_label: input.topicLabel ?? subject.name,
    lesson_plan_entry_id: input.lessonPlanEntryId ?? null,
    status: 'DRAFT',
    created_by: actor.facultyUserId,
  };
  if (await db.schema.hasColumn('attendance_sessions', 'timetable_slot_id')) {
    payload.timetable_slot_id = input.timetableSlotId ?? null;
    payload.timetable_override_id = input.timetableOverrideId ?? null;
  }
  if (await db.schema.hasColumn('attendance_sessions', 'original_faculty_id')) {
    payload.original_faculty_id = originalFacultyId ?? actor.facultyUserId;
    payload.delivered_by_faculty_id = actor.facultyUserId;
    payload.session_source = substitute ? 'LEAVE_SUBSTITUTION' : null;
  }

  try {
    const [id] = await db('attendance_sessions').insert(payload);
    await db('attendance_records').insert(
      students.map((s) => ({
        attendance_session_id: id,
        college_id: actor.collegeId,
        student_id: Number(s.id),
        status: 'PRESENT',
        marked_at: null,
        marked_by: null,
      })),
    );
    return getSession(actor, Number(id));
  } catch (err) {
    const dbErr = err as { code?: string; errno?: number };
    if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
      throw new AppError(409, 'An attendance session already exists for this class, subject, date, and period');
    }
    throw err;
  }
}

export async function getSession(actor: ClassActor, sessionId: number) {
  const session = await db('attendance_sessions').where({ id: sessionId, college_id: actor.collegeId }).first();
  if (!session) throw new AppError(404, 'Attendance session not found');
  await assertFacultySubjectClass(
    actor,
    Number(session.academic_class_id),
    Number(session.course_id),
    session.session_date ? sqlDate(session.session_date) ?? undefined : undefined,
  );
  const records = await db('attendance_records as r')
    .join('students as s', 's.id', 'r.student_id')
    .where({ 'r.attendance_session_id': sessionId })
    .select('r.*', 's.usn', 's.name', 's.email')
    .orderBy('s.usn');
  const classRow = await loadClassRow(Number(session.academic_class_id), actor.collegeId);
  const course = await db('courses').where({ id: session.course_id }).first();
  const statuses = records.map((r) => String(r.status) as AttendanceStatus);
  const policy = await policyForCollege(actor.collegeId);
  return {
    session: serializeSession(session, {
      className: classRow.name,
      courseName: course?.name,
      courseCode: course?.code,
    }),
    policy,
    summary: {
      ...summarizeStatuses(statuses),
      percentage: computeAttendancePercentage(statuses, policy),
    },
    records: records.map((r) => ({
      id: Number(r.id),
      studentId: Number(r.student_id),
      usn: r.usn,
      name: r.name,
      email: r.email,
      status: r.status,
      remarks: r.remarks,
      markedAt: r.marked_at,
    })),
  };
}

export async function markRecords(actor: ClassActor, sessionId: number, input: z.infer<typeof markRecordsSchema>) {
  const detail = await getSession(actor, sessionId);
  if (detail.session.status === 'CANCELLED') throw new AppError(400, 'Cancelled sessions cannot be edited');
  const finalized = detail.session.status === 'COMPLETED';
  if (finalized && !input.reason?.trim()) {
    throw new AppError(400, 'Provide a reason when editing finalized attendance');
  }

  await db.transaction(async (trx) => {
    for (const item of input.records) {
      const current = detail.records.find((r) => r.studentId === item.studentId);
      if (!current) throw new AppError(400, `Student ${item.studentId} is not in this attendance session`);
      if (current.status === item.status && (item.remarks ?? null) === (current.remarks ?? null)) continue;
      await trx('attendance_records')
        .where({ attendance_session_id: sessionId, student_id: item.studentId })
        .update({
          status: item.status,
          remarks: item.remarks ?? null,
          marked_at: trx.fn.now(),
          marked_by: actor.facultyUserId,
          updated_at: trx.fn.now(),
        });
      if (finalized || current.status !== item.status) {
        await trx('attendance_record_audits').insert({
          attendance_record_id: current.id,
          attendance_session_id: sessionId,
          student_id: item.studentId,
          from_status: current.status,
          to_status: item.status,
          reason: input.reason ?? (finalized ? 'Edited after finalize' : 'Draft update'),
          changed_by: actor.facultyUserId,
        });
      }
    }
    if (detail.session.status === 'DRAFT') {
      await trx('attendance_sessions').where({ id: sessionId }).update({ status: 'OPEN', updated_at: trx.fn.now() });
    }
  });
  return getSession(actor, sessionId);
}

export async function markAllPresent(actor: ClassActor, sessionId: number) {
  const detail = await getSession(actor, sessionId);
  return markRecords(actor, sessionId, {
    records: detail.records.map((r) => ({ studentId: r.studentId, status: 'PRESENT' as const })),
  });
}

export async function finalizeSession(actor: ClassActor, sessionId: number) {
  const detail = await getSession(actor, sessionId);
  if (detail.session.status === 'COMPLETED') return detail;
  if (detail.session.status === 'CANCELLED') throw new AppError(400, 'Cancelled sessions cannot be finalized');
  const session = await db('attendance_sessions').where({ id: sessionId }).first();
  await assertCancelledOverride(
    actor.collegeId,
    Number(session.academic_class_id),
    Number(session.course_id),
    sqlDate(session.session_date) ?? '',
    session.timetable_slot_id != null ? Number(session.timetable_slot_id) : null,
  );
  await db('attendance_sessions').where({ id: sessionId }).update({
    status: 'COMPLETED',
    completed_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await db('attendance_records')
    .where({ attendance_session_id: sessionId })
    .whereNull('marked_at')
    .update({ marked_at: db.fn.now(), marked_by: actor.facultyUserId });
  return getSession(actor, sessionId);
}

export async function courseAnalytics(actor: ClassActor, courseId: number, classId: number) {
  await assertFacultySubjectClass(actor, classId, courseId);
  const policy = await policyForCollege(actor.collegeId);
  const sessions = await db('attendance_sessions')
    .where({
      college_id: actor.collegeId,
      academic_class_id: classId,
      course_id: courseId,
      status: 'COMPLETED',
    })
    .select('id');
  const sessionIds = sessions.map((s) => Number(s.id));
  const students = await approvedClassStudents(classId, actor.collegeId);
  if (!sessionIds.length) {
    return {
      policy,
      sessions: 0,
      average: null,
      belowThreshold: [],
      students: students.map((s) => ({
        studentId: Number(s.id),
        usn: s.usn,
        name: s.name,
        percentage: null,
        standing: attendanceStanding(null, policy),
      })),
    };
  }
  const records = await db('attendance_records').whereIn('attendance_session_id', sessionIds).select('*');
  const byStudent = new Map<number, AttendanceStatus[]>();
  for (const row of records) {
    const id = Number(row.student_id);
    const list = byStudent.get(id) ?? [];
    list.push(String(row.status) as AttendanceStatus);
    byStudent.set(id, list);
  }
  const studentStats = students.map((s) => {
    const id = Number(s.id);
    const percentage = computeAttendancePercentage(byStudent.get(id) ?? [], policy);
    return {
      studentId: id,
      usn: s.usn,
      name: s.name,
      percentage,
      standing: attendanceStanding(percentage, policy),
    };
  });
  const withPct = studentStats.filter((s) => s.percentage != null);
  const average = withPct.length
    ? Math.round((withPct.reduce((sum, s) => sum + Number(s.percentage), 0) / withPct.length) * 10) / 10
    : null;
  return {
    policy,
    sessions: sessionIds.length,
    average,
    belowThreshold: studentStats.filter(
      (s) => s.percentage != null && s.percentage < policy.minimumPercentage,
    ),
    students: studentStats,
  };
}

function canViewCollegeAttendance(actor: ClassActor) {
  return isClassAdmin(actor.role) || actor.role === 'HOD' || actor.role === 'PRINCIPAL';
}

export async function adminAttendanceOverview(actor: ClassActor) {
  if (!canViewCollegeAttendance(actor)) {
    throw new AppError(403, 'Attendance overview is limited to college administrators and HODs');
  }
  if (!(await db.schema.hasTable('attendance_sessions'))) {
    return { policy: DEFAULT_ATTENDANCE_POLICY, classes: [], subjects: [], faculty: [] };
  }
  const policy = await policyForCollege(actor.collegeId);
  let classQuery = db('academic_classes').where({ college_id: actor.collegeId });
  if (actor.role === 'HOD' && actor.departmentId) {
    classQuery = classQuery.andWhere({ department_id: actor.departmentId });
  }
  const classes = await classQuery.select('id', 'name', 'code', 'status', 'department_id');
  const classIds = classes.map((c) => Number(c.id));
  if (!classIds.length) return { policy, classes: [], subjects: [], faculty: [] };

  const enrollCounts = await db('academic_class_enrollments')
    .whereIn('academic_class_id', classIds)
    .whereIn('status', ['APPROVED', 'COMPLETED'])
    .groupBy('academic_class_id')
    .select('academic_class_id')
    .count({ c: '*' });
  const enrollMap = new Map(
    enrollCounts.map((r) => [Number((r as { academic_class_id: number }).academic_class_id), Number(r.c)]),
  );

  const sessions = await db('attendance_sessions as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('faculty_users as f', 'f.id', 's.faculty_id')
    .where({ 's.college_id': actor.collegeId })
    .whereIn('s.academic_class_id', classIds)
    .select(
      's.id',
      's.academic_class_id',
      's.course_id',
      's.faculty_id',
      's.status',
      'c.code as course_code',
      'c.name as course_name',
      'f.name as faculty_name',
    );

  const completedIds = sessions.filter((s) => s.status === 'COMPLETED').map((s) => Number(s.id));
  const records = completedIds.length
    ? await db('attendance_records').whereIn('attendance_session_id', completedIds).select('attendance_session_id', 'status')
    : [];
  const bySession = new Map<number, AttendanceStatus[]>();
  for (const row of records) {
    const list = bySession.get(Number(row.attendance_session_id)) ?? [];
    list.push(String(row.status) as AttendanceStatus);
    bySession.set(Number(row.attendance_session_id), list);
  }

  const classStats = classes.map((cls) => {
    const id = Number(cls.id);
    const classSessions = sessions.filter((s) => Number(s.academic_class_id) === id);
    const completed = classSessions.filter((s) => s.status === 'COMPLETED');
    const percentages = completed
      .map((s) => computeAttendancePercentage(bySession.get(Number(s.id)) ?? [], policy))
      .filter((p): p is number => p != null);
    const average = percentages.length
      ? Math.round((percentages.reduce((sum, n) => sum + n, 0) / percentages.length) * 10) / 10
      : null;
    return {
      classId: id,
      name: cls.name,
      code: cls.code,
      status: cls.status,
      approvedStudents: enrollMap.get(id) ?? 0,
      sessions: completed.length,
      draftSessions: classSessions.filter((s) => s.status === 'DRAFT' || s.status === 'OPEN').length,
      average,
    };
  });

  const subjectMap = new Map<
    string,
    { courseId: number; code: string; name: string; sessions: number; percentages: number[] }
  >();
  for (const session of sessions.filter((s) => s.status === 'COMPLETED')) {
    const key = String(session.course_id);
    const pct = computeAttendancePercentage(bySession.get(Number(session.id)) ?? [], policy);
    const cur = subjectMap.get(key) ?? {
      courseId: Number(session.course_id),
      code: String(session.course_code),
      name: String(session.course_name),
      sessions: 0,
      percentages: [],
    };
    cur.sessions += 1;
    if (pct != null) cur.percentages.push(pct);
    subjectMap.set(key, cur);
  }

  const facultyMap = new Map<
    number,
    { facultyId: number; name: string; completed: number; open: number }
  >();
  for (const session of sessions) {
    const id = Number(session.faculty_id);
    const cur = facultyMap.get(id) ?? {
      facultyId: id,
      name: String(session.faculty_name),
      completed: 0,
      open: 0,
    };
    if (session.status === 'COMPLETED') cur.completed += 1;
    else if (session.status !== 'CANCELLED') cur.open += 1;
    facultyMap.set(id, cur);
  }

  return {
    policy,
    classes: classStats,
    subjects: [...subjectMap.values()].map((s) => ({
      courseId: s.courseId,
      code: s.code,
      name: s.name,
      sessions: s.sessions,
      average: s.percentages.length
        ? Math.round((s.percentages.reduce((sum, n) => sum + n, 0) / s.percentages.length) * 10) / 10
        : null,
    })),
    faculty: [...facultyMap.values()],
  };
}

export function analyticsToCsv(data: Awaited<ReturnType<typeof courseAnalytics>>) {
  const header = 'USN,Name,Percentage,Standing';
  const rows = data.students.map((s) =>
    [s.usn, `"${String(s.name).replaceAll('"', '""')}"`, s.percentage ?? '', s.standing.label].join(','),
  );
  return [header, ...rows].join('\n');
}

export async function studentAttendanceSummary(studentId: number, classId?: number) {
  const student = await loadActiveStudent(studentId);
  const collegeId = Number(student.college_id);
  const policy = await policyForCollege(collegeId);
  const ctx = await currentClassContext(studentId);
  const targetClassId = classId ?? ctx.classId;
  if (!targetClassId) {
    return { policy, overall: null, subjects: [], standing: attendanceStanding(null, policy) };
  }
  if (classId) await assertClassReadable(studentId, classId, collegeId);
  const pack =
    classId && classId !== ctx.classId ? await subjectsForStudent(studentId, targetClassId) : ctx.pack;
  if (!pack) {
    return { policy, overall: null, subjects: [], standing: attendanceStanding(null, policy) };
  }

  const courseIds = pack.current.map((s) => s.courseId);
  const sessions = await db('attendance_sessions')
    .where({
      college_id: collegeId,
      academic_class_id: targetClassId,
      status: 'COMPLETED',
    })
    .whereIn('course_id', courseIds.length ? courseIds : [-1])
    .select('id', 'course_id');
  const sessionIds = sessions.map((s) => Number(s.id));
  const records = sessionIds.length
    ? await db('attendance_records').whereIn('attendance_session_id', sessionIds).andWhere({ student_id: studentId })
    : [];
  const byCourse = new Map<number, AttendanceStatus[]>();
  for (const session of sessions) {
    const rec = records.find((r) => Number(r.attendance_session_id) === Number(session.id));
    if (!rec) continue;
    const list = byCourse.get(Number(session.course_id)) ?? [];
    list.push(String(rec.status) as AttendanceStatus);
    byCourse.set(Number(session.course_id), list);
  }
  const subjects = pack.current.map((s) => {
    const statuses = byCourse.get(s.courseId) ?? [];
    const percentage = computeAttendancePercentage(statuses, policy);
    const counts = summarizeStatuses(statuses);
    return {
      courseId: s.courseId,
      code: s.code,
      name: s.name,
      percentage,
      standing: attendanceStanding(percentage, policy),
      ...counts,
    };
  });
  const all = subjects.flatMap((s) => byCourse.get(s.courseId) ?? []);
  const overall = computeAttendancePercentage(all, policy);
  return {
    policy,
    overall,
    standing: attendanceStanding(overall, policy),
    belowCount: subjects.filter((s) => s.percentage != null && s.percentage < policy.minimumPercentage).length,
    subjects,
  };
}

async function assertClassReadable(studentId: number, classId: number, collegeId: number) {
  const enrollment = await db('academic_class_enrollments')
    .where({ student_id: studentId, academic_class_id: classId })
    .whereIn('status', ['APPROVED', 'COMPLETED'])
    .first();
  if (!enrollment) throw new AppError(403, 'You are not a member of this class');
  const classRow = await loadClassRow(classId);
  if (Number(classRow.college_id) !== collegeId) {
    throw new AppError(403, 'You cannot access this class', undefined, 'TENANT_MISMATCH');
  }
  return { enrollment, classRow };
}

export async function studentSubjectAttendance(studentId: number, courseId: number) {
  const access = await assertSubjectAccess(studentId, courseId);
  const policy = await policyForCollege(access.collegeId);
  const sessions = await db('attendance_sessions as s')
    .where({
      's.college_id': access.collegeId,
      's.academic_class_id': access.classId,
      's.course_id': courseId,
      's.status': 'COMPLETED',
    })
    .leftJoin('attendance_records as r', function join() {
      this.on('r.attendance_session_id', 's.id').andOn('r.student_id', db.raw('?', [studentId]));
    })
    .select(
      's.id',
      's.session_date',
      's.period_number',
      's.topic_label',
      's.topic_id',
      'r.status as record_status',
      'r.remarks',
    )
    .orderBy('s.session_date', 'desc');

  const statuses = sessions
    .filter((s) => s.record_status)
    .map((s) => String(s.record_status) as AttendanceStatus);
  const percentage = computeAttendancePercentage(statuses, policy);
  const counts = summarizeStatuses(statuses);
  return {
    historical: access.historical,
    course: { id: courseId, code: access.subject.code, name: access.subject.name },
    policy,
    percentage,
    standing: attendanceStanding(percentage, policy),
    ...counts,
    history: sessions.map((s) => ({
      sessionId: Number(s.id),
      date: s.session_date,
      periodNumber: s.period_number != null ? Number(s.period_number) : null,
      topicLabel: s.topic_label,
      status: s.record_status ?? 'ABSENT',
      remarks: s.remarks ?? null,
    })),
  };
}
