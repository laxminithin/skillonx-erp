import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamCollege, assertExamPermission, canManageExams } from './access.js';
import { recordExamAudit } from './audit.js';
import { resolvePolicy } from './policy.js';
export const createExamSchema = z.object({
    academicYearId: z.number().int().positive(),
    programId: z.number().int().positive().nullable().optional(),
    semesterId: z.number().int().positive(),
    schemeId: z.number().int().positive().nullable().optional(),
    examPolicyId: z.number().int().positive().nullable().optional(),
    examType: z.enum(['CIE', 'SEE', 'SUPPLEMENTARY', 'MAKEUP', 'IMPROVEMENT', 'PRACTICAL', 'VIVA', 'PROJECT']),
    name: z.string().trim().min(1).max(255),
    code: z.string().trim().min(1).max(64),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export const examSubjectSchema = z.object({
    courseId: z.number().int().positive(),
    academicClassId: z.number().int().positive().nullable().optional(),
    maximumMarks: z.number().positive(),
    minimumPassMarks: z.number().min(0).nullable().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    startTime: z.string().max(16).nullable().optional(),
    endTime: z.string().max(16).nullable().optional(),
});
export const scheduleSubjectSchema = examSubjectSchema.extend({
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
});
function serializeExam(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        academicYearId: Number(row.academic_year_id),
        programId: row.program_id != null ? Number(row.program_id) : null,
        semesterId: Number(row.semester_id),
        schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
        examPolicyId: row.exam_policy_id != null ? Number(row.exam_policy_id) : null,
        examType: row.exam_type,
        name: row.name,
        code: row.code,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        createdBy: row.created_by != null ? Number(row.created_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function serializeExamSubject(row, course) {
    return {
        id: Number(row.id),
        examId: Number(row.exam_id),
        courseId: Number(row.course_id),
        courseCode: course?.code ?? null,
        courseName: course?.name ?? null,
        academicClassId: row.academic_class_id != null ? Number(row.academic_class_id) : null,
        maximumMarks: Number(row.maximum_marks),
        minimumPassMarks: row.minimum_pass_marks != null ? Number(row.minimum_pass_marks) : null,
        durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
        examDate: row.exam_date,
        startTime: row.start_time,
        endTime: row.end_time,
        roomAllocationMode: row.room_allocation_mode,
        status: row.status,
        seatsLocked: Boolean(row.seats_locked),
        calendarEventId: row.calendar_event_id != null ? Number(row.calendar_event_id) : null,
    };
}
export async function listExams(actor, filters) {
    let q = db('examinations').where({ college_id: actor.collegeId });
    if (filters?.semesterId)
        q = q.andWhere({ semester_id: filters.semesterId });
    if (filters?.status)
        q = q.andWhere({ status: filters.status });
    if (filters?.examType)
        q = q.andWhere({ exam_type: filters.examType });
    const rows = await q.orderBy('start_date', 'desc').orderBy('id', 'desc');
    return rows.map(serializeExam);
}
async function countRows(table, collegeId, where = {}) {
    if (!(await db.schema.hasTable(table)))
        return 0;
    const row = await db(table)
        .where({ college_id: collegeId, ...where })
        .count({ c: '*' })
        .first();
    return Number(row?.c ?? 0);
}
async function countByStatus(table, collegeId, statusColumn = 'status') {
    if (!(await db.schema.hasTable(table)))
        return {};
    const rows = (await db(table)
        .where({ college_id: collegeId })
        .select(`${statusColumn} as status`)
        .count({ count: '*' })
        .groupBy(statusColumn));
    return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}
export async function coeDashboard(actor) {
    assertExamPermission(actor, 'exam.create');
    const today = new Date().toISOString().slice(0, 10);
    const exams = await db('examinations')
        .where({ college_id: actor.collegeId })
        .orderBy('start_date', 'desc')
        .orderBy('id', 'desc')
        .limit(8);
    const upcomingSubjects = await db('examination_subjects as es')
        .join('examinations as e', 'e.id', 'es.exam_id')
        .leftJoin('courses as c', 'c.id', 'es.course_id')
        .where('es.college_id', actor.collegeId)
        .andWhere('es.exam_date', '>=', today)
        .select('es.*', 'e.name as exam_name', 'c.code as course_code', 'c.name as course_name')
        .orderBy('es.exam_date')
        .orderBy('es.start_time')
        .limit(8);
    const scheduledSubjects = await countRows('examination_subjects', actor.collegeId, { status: 'SCHEDULED' });
    const totalSubjects = await countRows('examination_subjects', actor.collegeId);
    const lockedMarksSheets = await countRows('exam_marks_sheets', actor.collegeId, { locked: true });
    const totalMarksSheets = await countRows('exam_marks_sheets', actor.collegeId);
    return {
        kpis: {
            activeExams: await db('examinations')
                .where({ college_id: actor.collegeId })
                .whereIn('status', ['DRAFT', 'SCHEDULED', 'ONGOING', 'RESULT_PROCESSING'])
                .count({ c: '*' })
                .first()
                .then((row) => Number(row?.c ?? 0)),
            scheduledSubjects,
            unscheduledSubjects: Math.max(totalSubjects - scheduledSubjects, 0),
            pendingEligibility: (await countRows('exam_eligibility', actor.collegeId, { status: 'NOT_ELIGIBLE' })) +
                (await countRows('exam_eligibility', actor.collegeId, { status: 'WITHHELD' })),
            lockedMarksSheets,
            unlockedMarksSheets: Math.max(totalMarksSheets - lockedMarksSheets, 0),
            pendingRevaluations: await countRows('exam_revaluation_requests', actor.collegeId, { status: 'REQUESTED' }),
            questionPapersReady: await countRows('internal_question_papers', actor.collegeId, { status: 'FINALIZED' }),
        },
        examsByStatus: await countByStatus('examinations', actor.collegeId),
        eligibilityByStatus: await countByStatus('exam_eligibility', actor.collegeId),
        marksSheetsByStatus: await countByStatus('exam_marks_sheets', actor.collegeId),
        revaluationsByStatus: await countByStatus('exam_revaluation_requests', actor.collegeId),
        recentExams: exams.map(serializeExam),
        upcomingSubjects: upcomingSubjects.map((row) => ({
            id: Number(row.id),
            examId: Number(row.exam_id),
            examName: row.exam_name,
            courseCode: row.course_code,
            courseName: row.course_name,
            examDate: row.exam_date,
            startTime: row.start_time,
            status: row.status,
            seatsLocked: Boolean(row.seats_locked),
        })),
    };
}
export async function questionPaperStatus(actor) {
    assertExamPermission(actor, 'exam.schedule');
    if (!(await db.schema.hasTable('internal_question_papers'))) {
        return { papers: [], byStatus: {}, total: 0 };
    }
    const rows = await db('internal_question_papers as p')
        .leftJoin('courses as c', 'c.id', 'p.course_id')
        .where('p.college_id', actor.collegeId)
        .select('p.id', 'p.title', 'p.status', 'p.exam_type', 'p.exam_date', 'p.total_marks', 'p.duration_minutes', 'p.created_at', 'c.code as course_code', 'c.name as course_name')
        .orderBy('p.created_at', 'desc')
        .limit(50);
    const byStatus = await countByStatus('internal_question_papers', actor.collegeId);
    return {
        total: rows.length,
        byStatus,
        papers: rows.map((row) => ({
            id: Number(row.id),
            title: row.title,
            status: row.status,
            examType: row.exam_type,
            examDate: row.exam_date,
            courseCode: row.course_code,
            courseName: row.course_name,
            totalMarks: row.total_marks != null ? Number(row.total_marks) : null,
            durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
            createdAt: row.created_at,
        })),
    };
}
export async function getExam(actor, examId) {
    const row = await assertExamCollege(examId, actor.collegeId);
    const subjects = await listExamSubjects(actor, examId);
    return { ...serializeExam(row), subjects };
}
export async function listExamSubjects(actor, examId) {
    await assertExamCollege(examId, actor.collegeId);
    const rows = await db('examination_subjects as es')
        .leftJoin('courses as c', 'c.id', 'es.course_id')
        .where('es.exam_id', examId)
        .select('es.*', 'c.code as course_code', 'c.name as course_name')
        .orderBy('es.exam_date')
        .orderBy('es.start_time');
    return rows.map((r) => serializeExamSubject(r, { code: r.course_code, name: r.course_name }));
}
export async function createExam(actor, body) {
    assertExamPermission(actor, 'exam.create');
    const dup = await db('examinations').where({ college_id: actor.collegeId, code: body.code }).first();
    if (dup)
        throw new AppError(400, 'Exam code already exists');
    let policyId = body.examPolicyId ?? null;
    if (!policyId) {
        const policy = await resolvePolicy(actor.collegeId, body.schemeId ?? null, body.programId ?? null);
        policyId = policy.id;
    }
    const [id] = await db('examinations').insert({
        college_id: actor.collegeId,
        academic_year_id: body.academicYearId,
        program_id: body.programId ?? null,
        semester_id: body.semesterId,
        scheme_id: body.schemeId ?? null,
        exam_policy_id: policyId,
        exam_type: body.examType,
        name: body.name,
        code: body.code,
        start_date: body.startDate ?? null,
        end_date: body.endDate ?? null,
        status: 'DRAFT',
        created_by: actor.facultyUserId,
    });
    const created = await db('examinations').where({ id }).first();
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EXAM_CREATED',
        entityType: 'examination',
        entityId: Number(id),
        afterState: serializeExam(created),
    });
    return serializeExam(created);
}
export async function addExamSubject(actor, examId, body) {
    assertExamPermission(actor, 'exam.create');
    const exam = await assertExamCollege(examId, actor.collegeId);
    if (exam.status === 'RESULT_PUBLISHED')
        throw new AppError(400, 'Cannot modify published exam');
    const course = await db('courses').where({ id: body.courseId, college_id: actor.collegeId }).first();
    if (!course)
        throw new AppError(404, 'Course not found');
    const [id] = await db('examination_subjects').insert({
        college_id: actor.collegeId,
        exam_id: examId,
        course_id: body.courseId,
        academic_class_id: body.academicClassId ?? null,
        maximum_marks: body.maximumMarks,
        minimum_pass_marks: body.minimumPassMarks ?? null,
        duration_minutes: body.durationMinutes ?? null,
        exam_date: body.examDate ?? null,
        start_time: body.startTime ?? null,
        end_time: body.endTime ?? null,
        status: 'DRAFT',
    });
    await db('exam_marks_sheets').insert({
        college_id: actor.collegeId,
        exam_subject_id: id,
        faculty_id: actor.facultyUserId,
        status: 'DRAFT',
    });
    const created = await db('examination_subjects').where({ id }).first();
    return serializeExamSubject(created, course);
}
export async function scheduleExamSubject(actor, examSubjectId, body) {
    assertExamPermission(actor, 'exam.schedule');
    const subject = await db('examination_subjects as es')
        .join('examinations as e', 'e.id', 'es.exam_id')
        .where('es.id', examSubjectId)
        .andWhere('e.college_id', actor.collegeId)
        .select('es.*', 'e.academic_year_id', 'e.semester_id', 'e.name as exam_name', 'e.status as exam_status')
        .first();
    if (!subject)
        throw new AppError(404, 'Exam subject not found');
    if (subject.exam_status === 'RESULT_PUBLISHED')
        throw new AppError(400, 'Cannot reschedule published exam');
    const conflicts = await detectScheduleConflicts(actor.collegeId, examSubjectId, body);
    if (conflicts.length) {
        throw new AppError(400, `Schedule conflicts detected: ${conflicts.join('; ')}`);
    }
    await db('examination_subjects').where({ id: examSubjectId }).update({
        exam_date: body.examDate,
        start_time: body.startTime,
        end_time: body.endTime,
        duration_minutes: body.durationMinutes ?? subject.duration_minutes,
        status: 'SCHEDULED',
        updated_at: db.fn.now(),
    });
    const course = await db('courses').where({ id: subject.course_id }).first();
    const calendarEventId = await pushCalendarEvent(actor, subject, body, course);
    if (calendarEventId) {
        await db('examination_subjects').where({ id: examSubjectId }).update({ calendar_event_id: calendarEventId });
    }
    if (subject.exam_status === 'DRAFT') {
        await db('examinations').where({ id: subject.exam_id }).update({ status: 'SCHEDULED' });
    }
    const updated = await db('examination_subjects').where({ id: examSubjectId }).first();
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EXAM_SCHEDULED',
        entityType: 'examination_subject',
        entityId: examSubjectId,
        afterState: serializeExamSubject(updated, course),
    });
    return serializeExamSubject(updated, course);
}
async function detectScheduleConflicts(collegeId, examSubjectId, body) {
    const conflicts = [];
    const current = await db('examination_subjects').where({ id: examSubjectId }).first();
    if (!current)
        return conflicts;
    const sameSlot = await db('examination_subjects')
        .where({ college_id: collegeId, exam_date: body.examDate })
        .whereNot({ id: examSubjectId })
        .where((q) => {
        q.where('start_time', '<', body.endTime).andWhere('end_time', '>', body.startTime);
    });
    if (sameSlot.length && current.academic_class_id) {
        for (const other of sameSlot) {
            if (other.academic_class_id === current.academic_class_id) {
                conflicts.push(`Class has overlapping exam on ${body.examDate}`);
            }
        }
    }
    return conflicts;
}
async function pushCalendarEvent(actor, subject, body, course) {
    if (!(await db.schema.hasTable('academic_calendar_events')))
        return null;
    const title = `${subject.exam_name}: ${course?.name ?? 'Exam'}`;
    const [id] = await db('academic_calendar_events').insert({
        college_id: actor.collegeId,
        academic_year_id: subject.academic_year_id,
        semester_id: subject.semester_id,
        event_type: 'EXAM',
        title,
        start_date: body.examDate,
        end_date: body.examDate,
        blocks_teaching: true,
        notes: `${body.startTime} - ${body.endTime}`,
        created_by: actor.facultyUserId,
    });
    return Number(id);
}
export async function updateExamStatus(actor, examId, status) {
    if (!canManageExams(actor))
        throw new AppError(403, 'Not authorized');
    const exam = await assertExamCollege(examId, actor.collegeId);
    const allowed = ['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'RESULT_PROCESSING', 'RESULT_PUBLISHED', 'CANCELLED'];
    if (!allowed.includes(status))
        throw new AppError(400, 'Invalid status');
    if (status === 'RESULT_PUBLISHED')
        assertExamPermission(actor, 'exam.result.publish');
    await db('examinations').where({ id: examId }).update({ status, updated_at: db.fn.now() });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EXAM_STATUS_CHANGED',
        entityType: 'examination',
        entityId: examId,
        beforeState: { status: exam.status },
        afterState: { status },
    });
    const updated = await db('examinations').where({ id: examId }).first();
    return serializeExam(updated);
}
export async function autoPopulateSubjectsFromClass(actor, examId, classId) {
    assertExamPermission(actor, 'exam.create');
    await assertExamCollege(examId, actor.collegeId);
    const exam = await db('examinations').where({ id: examId }).first();
    const policy = await resolvePolicy(actor.collegeId, exam?.scheme_id, exam?.program_id);
    const subjects = await db('academic_class_subjects')
        .where({ academic_class_id: classId, is_active: true })
        .whereIn('kind', ['CORE', 'LAB', 'ABILITY_ENHANCEMENT']);
    const added = [];
    for (const s of subjects) {
        const existing = await db('examination_subjects')
            .where({ exam_id: examId, course_id: s.course_id, academic_class_id: classId })
            .first();
        if (existing)
            continue;
        const created = await addExamSubject(actor, examId, {
            courseId: Number(s.course_id),
            academicClassId: classId,
            maximumMarks: policy.seeMaximum,
        });
        added.push(created);
    }
    return added;
}
