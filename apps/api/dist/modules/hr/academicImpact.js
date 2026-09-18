import { db } from '../../db/index.js';
import { facultyTimetable } from '../timetable/service.js';
function sessionOverlapsPeriod(session, periodNumber, startTime) {
    if (session === 'FULL_DAY')
        return true;
    const pn = periodNumber ?? inferPeriodFromTime(startTime);
    if (session === 'FIRST_HALF')
        return pn <= 4;
    if (session === 'SECOND_HALF')
        return pn >= 5;
    return true;
}
function inferPeriodFromTime(startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins < 12 * 60)
        return 2;
    return 6;
}
function dateInLeaveRange(date, fromDate, toDate, fromSession, toSession) {
    if (date < fromDate || date > toDate)
        return false;
    if (date === fromDate && date === toDate)
        return true;
    if (date === fromDate)
        return fromSession !== 'SECOND_HALF' || true;
    if (date === toDate)
        return toSession !== 'FIRST_HALF' || true;
    return true;
}
function occurrenceToSession(occ, facultyUserId) {
    const isOriginal = occ.originalFaculty.some((f) => f.facultyId === facultyUserId)
        || (occ.originalFaculty.length === 0 && occ.faculty.some((f) => f.facultyId === facultyUserId));
    if (!isOriginal || occ.state === 'CANCELLED' || occ.state === 'HOLIDAY')
        return null;
    if (occ.state === 'SUBSTITUTED')
        return null;
    if (!occ.courseId)
        return null;
    return {
        timetableSlotId: occ.slotId ?? null,
        overrideId: occ.overrideId ?? null,
        date: occ.date,
        startTime: occ.startTime,
        endTime: occ.endTime,
        periodNumber: occ.startPeriodNumber ?? null,
        classId: occ.academicClassId,
        className: occ.className,
        subjectId: occ.courseId,
        subjectCode: occ.courseCode ?? '',
        subjectName: occ.courseName ?? '',
        room: occ.roomName ?? null,
        originalFacultyId: facultyUserId,
    };
}
export async function getLeaveAcademicImpact(collegeId, facultyUserId, fromDate, toDate, fromSession = 'FULL_DAY', toSession = 'FULL_DAY', options) {
    if (!(await db.schema.hasTable('timetable_slots'))) {
        return { affectedSessions: [], totalAffected: 0, coverageRequired: false };
    }
    const actor = {
        facultyUserId,
        collegeId,
        role: 'FACULTY',
        departmentId: null,
    };
    const timetable = await facultyTimetable(actor, fromDate, toDate);
    const affectedSessions = [];
    for (const occ of timetable.occurrences) {
        if (!dateInLeaveRange(occ.date, fromDate, toDate, fromSession, toSession))
            continue;
        const session = occ.date === fromDate ? fromSession : occ.date === toDate ? toSession : 'FULL_DAY';
        if (!sessionOverlapsPeriod(session, occ.startPeriodNumber ?? null, occ.startTime))
            continue;
        const mapped = occurrenceToSession(occ, facultyUserId);
        if (mapped)
            affectedSessions.push(mapped);
    }
    let finalSessions = affectedSessions;
    if (options?.emergencyRemainingOnly && affectedSessions.length) {
        const tz = options.timeZone ?? 'Asia/Kolkata';
        const today = new Date().toLocaleDateString('en-CA', { timeZone: tz });
        const nowParts = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(new Date());
        const nowClock = `${nowParts.find((p) => p.type === 'hour')?.value ?? '00'}:${nowParts.find((p) => p.type === 'minute')?.value ?? '00'}`;
        finalSessions = affectedSessions.filter((s) => {
            if (s.date > today)
                return true;
            if (s.date < today)
                return false;
            return s.endTime > nowClock;
        });
    }
    return {
        affectedSessions: finalSessions,
        totalAffected: finalSessions.length,
        coverageRequired: finalSessions.length > 0,
    };
}
export async function facultyHasTeachingAssignment(facultyUserId, collegeId) {
    if (await db.schema.hasTable('timetable_slot_faculty')) {
        const slot = await db('timetable_slot_faculty as sf')
            .join('timetable_slots as s', 's.id', 'sf.slot_id')
            .where({ 'sf.faculty_id': facultyUserId, 's.college_id': collegeId, 's.status': 'ACTIVE' })
            .first();
        if (slot)
            return true;
    }
    if (await db.schema.hasTable('academic_class_subject_faculty')) {
        const mapping = await db('academic_class_subject_faculty').where({ faculty_id: facultyUserId }).first();
        if (mapping)
            return true;
    }
    return false;
}
