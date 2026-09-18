import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamPermission, assertExamSubjectCollege } from './access.js';
import { recordExamAudit } from './audit.js';
export const invigilationSchema = z.object({
    facultyId: z.number().int().positive(),
    roomId: z.number().int().positive().nullable().optional(),
    role: z.enum(['CHIEF', 'INVIGILATOR', 'RELIEVER', 'SQUAD', 'OTHER']).default('INVIGILATOR'),
    dutyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    startTime: z.string().max(16).nullable().optional(),
    endTime: z.string().max(16).nullable().optional(),
});
function serializeDuty(row, faculty, room, course) {
    return {
        id: Number(row.id),
        examSubjectId: Number(row.exam_subject_id),
        facultyId: Number(row.faculty_id),
        facultyName: faculty?.name ?? null,
        roomId: row.room_id != null ? Number(row.room_id) : null,
        roomName: room?.name ?? null,
        roomCode: room?.code ?? null,
        role: row.role,
        dutyDate: row.duty_date,
        startTime: row.start_time,
        endTime: row.end_time,
        courseName: course?.name ?? null,
        calendarEventId: row.calendar_event_id != null ? Number(row.calendar_event_id) : null,
    };
}
export async function assignInvigilation(actor, examSubjectId, body) {
    assertExamPermission(actor, 'exam.invigilation');
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const faculty = await db('faculty_users')
        .where({ id: body.facultyId, college_id: actor.collegeId })
        .first();
    if (!faculty)
        throw new AppError(404, 'Faculty not found');
    const dutyDate = body.dutyDate ?? subject.exam_date;
    const startTime = body.startTime ?? subject.start_time;
    const endTime = body.endTime ?? subject.end_time;
    if (dutyDate && startTime && endTime) {
        const conflict = await db('exam_invigilation_duties')
            .where({ college_id: actor.collegeId, faculty_id: body.facultyId, duty_date: dutyDate })
            .whereNot({ exam_subject_id: examSubjectId })
            .where((q) => q.where('start_time', '<', endTime).andWhere('end_time', '>', startTime))
            .first();
        if (conflict)
            throw new AppError(400, 'Faculty has overlapping invigilation duty');
    }
    const [id] = await db('exam_invigilation_duties').insert({
        college_id: actor.collegeId,
        exam_subject_id: examSubjectId,
        room_id: body.roomId ?? null,
        faculty_id: body.facultyId,
        role: body.role,
        duty_date: dutyDate,
        start_time: startTime,
        end_time: endTime,
    });
    let calendarEventId = null;
    if (dutyDate && (await db.schema.hasTable('academic_calendar_events'))) {
        const course = await db('courses').where({ id: subject.course_id }).first();
        const [evId] = await db('academic_calendar_events').insert({
            college_id: actor.collegeId,
            event_type: 'INVIGILATION',
            title: `Invigilation: ${course?.name ?? 'Exam'}`,
            start_date: dutyDate,
            end_date: dutyDate,
            blocks_teaching: false,
            notes: `${body.role} — ${startTime} to ${endTime}`,
            created_by: actor.facultyUserId,
        });
        calendarEventId = Number(evId);
        await db('exam_invigilation_duties').where({ id }).update({ calendar_event_id: calendarEventId });
    }
    const created = await db('exam_invigilation_duties').where({ id }).first();
    const room = body.roomId ? await db('rooms').where({ id: body.roomId }).first() : null;
    const course = await db('courses').where({ id: subject.course_id }).first();
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'INVIGILATION_ASSIGNED',
        entityType: 'exam_invigilation',
        entityId: Number(id),
        afterState: serializeDuty(created, faculty, room ?? undefined, course),
    });
    return serializeDuty(created, faculty, room ?? undefined, course);
}
export async function listInvigilationDuties(actor, examSubjectId) {
    let q = db('exam_invigilation_duties as d')
        .join('faculty_users as f', 'f.id', 'd.faculty_id')
        .leftJoin('rooms as r', 'r.id', 'd.room_id')
        .join('examination_subjects as es', 'es.id', 'd.exam_subject_id')
        .join('courses as c', 'c.id', 'es.course_id')
        .where('d.college_id', actor.collegeId)
        .select('d.*', 'f.name as faculty_name', 'r.name as room_name', 'r.code as room_code', 'c.name as course_name');
    if (examSubjectId)
        q = q.andWhere('d.exam_subject_id', examSubjectId);
    const rows = await q.orderBy('d.duty_date').orderBy('d.start_time');
    return rows.map((r) => serializeDuty(r, { name: r.faculty_name }, { name: r.room_name, code: r.room_code }, { name: r.course_name }));
}
export async function facultyDuties(facultyId, collegeId) {
    const rows = await db('exam_invigilation_duties as d')
        .join('examination_subjects as es', 'es.id', 'd.exam_subject_id')
        .join('examinations as e', 'e.id', 'es.exam_id')
        .join('courses as c', 'c.id', 'es.course_id')
        .leftJoin('rooms as r', 'r.id', 'd.room_id')
        .where({ 'd.faculty_id': facultyId, 'd.college_id': collegeId })
        .select('d.*', 'e.name as exam_name', 'c.name as course_name', 'c.code as course_code', 'r.name as room_name', 'r.code as room_code')
        .orderBy('d.duty_date')
        .orderBy('d.start_time');
    return rows.map((r) => ({
        ...serializeDuty(r, undefined, { name: r.room_name, code: r.room_code }, { name: r.course_name }),
        examName: r.exam_name,
        courseCode: r.course_code,
    }));
}
