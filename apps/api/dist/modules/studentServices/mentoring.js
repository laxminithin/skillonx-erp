import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from './audit.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { studentAcademicRecord } from '../examination/result.js';
export async function getStudentMentor(studentId, collegeId) {
    const assignment = await db('mentor_assignments as ma')
        .join('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
        .leftJoin('departments as d', 'd.id', 'f.department_id')
        .where({
        'ma.student_id': studentId,
        'ma.college_id': collegeId,
        'ma.status': 'ACTIVE',
        'ma.is_primary': true,
    })
        .select('ma.*', 'f.name as mentor_name', 'f.email as mentor_email', 'd.name as department_name')
        .first();
    if (!assignment)
        return { mentor: null };
    const meetings = await db('mentor_meetings')
        .where({ student_id: studentId, mentor_faculty_id: assignment.mentor_faculty_id })
        .whereNotNull('student_visible_notes')
        .orderBy('scheduled_at', 'desc')
        .limit(5);
    return {
        mentor: {
            assignmentId: Number(assignment.id),
            name: assignment.mentor_name,
            email: assignment.mentor_email,
            department: assignment.department_name,
            effectiveFrom: assignment.effective_from,
        },
        recentNotes: meetings.map((m) => ({
            id: Number(m.id),
            scheduledAt: m.scheduled_at,
            status: m.status,
            notes: m.student_visible_notes,
        })),
    };
}
export async function listStudentMeetings(studentId, collegeId) {
    const rows = await db('mentor_meetings')
        .where({ student_id: studentId, college_id: collegeId })
        .orderBy('created_at', 'desc');
    return rows.map((m) => ({
        id: Number(m.id),
        status: m.status,
        meetingType: m.meeting_type,
        scheduledAt: m.scheduled_at,
        agenda: m.agenda,
        studentVisibleNotes: m.student_visible_notes,
        followUpDate: m.follow_up_date,
        createdAt: m.created_at,
    }));
}
export async function requestMeeting(actor, input) {
    const mentor = await db('mentor_assignments')
        .where({ student_id: actor.studentId, college_id: actor.collegeId, status: 'ACTIVE', is_primary: true })
        .first();
    if (!mentor)
        throw new AppError(400, 'No mentor assigned');
    const [id] = await db('mentor_meetings').insert({
        college_id: actor.collegeId,
        student_id: actor.studentId,
        mentor_faculty_id: mentor.mentor_faculty_id,
        mentor_assignment_id: mentor.id,
        status: 'REQUESTED',
        meeting_type: input.meetingType ?? 'GENERAL',
        agenda: input.agenda,
        scheduled_at: input.preferredDate ? new Date(input.preferredDate) : null,
    });
    await notifyStudent({
        studentId: actor.studentId,
        collegeId: actor.collegeId,
        type: 'MEETING_REQUESTED',
        title: 'Meeting request sent',
        body: 'Your mentor will review your meeting request.',
        link: '/lms/services/mentor',
        relatedType: 'mentor_meeting',
        relatedId: id,
    });
    return { meeting: { id: Number(id), status: 'REQUESTED' } };
}
export async function mentorListMentees(actor) {
    const assignments = await db('mentor_assignments as ma')
        .join('students as s', 's.id', 'ma.student_id')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
        .where({
        'ma.mentor_faculty_id': actor.facultyUserId,
        'ma.college_id': actor.collegeId,
        'ma.status': 'ACTIVE',
    })
        .select('ma.*', 's.name', 's.usn', 's.id as student_id', 'd.name as department_name', 'sem.label as semester_label', 'cs.label as section_label');
    const mentees = [];
    for (const a of assignments) {
        const insights = await mentorStudentInsights(Number(a.student_id), actor.collegeId);
        const pendingMeetings = await db('mentor_meetings')
            .where({ student_id: a.student_id, mentor_faculty_id: actor.facultyUserId, status: 'REQUESTED' })
            .count({ c: '*' })
            .first();
        const pendingRequests = await db('student_service_requests')
            .where({ student_id: a.student_id, college_id: actor.collegeId })
            .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'DRAFT'])
            .count({ c: '*' })
            .first();
        mentees.push({
            studentId: Number(a.student_id),
            name: a.name,
            usn: a.usn,
            department: a.department_name,
            semester: a.semester_label,
            section: a.section_label,
            assignmentId: Number(a.id),
            pendingMeetings: Number(pendingMeetings?.c ?? 0),
            pendingRequests: Number(pendingRequests?.c ?? 0),
            insights,
        });
    }
    return mentees;
}
export async function mentorStudentInsights(studentId, collegeId) {
    const record = await studentAcademicRecord(studentId, collegeId);
    const attendance = await db('attendance_records as ar')
        .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
        .where({ 'ar.student_id': studentId, 's.college_id': collegeId })
        .select('ar.status');
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePct = total ? Math.round((present / total) * 100) : null;
    const policy = await db('college_attendance_policies').where({ college_id: collegeId }).first();
    const threshold = policy?.minimum_percentage != null ? Number(policy.minimum_percentage) : 75;
    const alerts = [];
    if (attendancePct != null && attendancePct < threshold) {
        alerts.push(`Attendance at ${attendancePct}% (below ${threshold}% threshold)`);
    }
    if (record.backlogs.length > 0) {
        alerts.push(`${record.backlogs.length} backlog subject(s)`);
    }
    if (record.cgpa != null && record.cgpa < 5) {
        alerts.push(`CGPA ${record.cgpa} — academic attention recommended`);
    }
    return {
        attendance: attendancePct,
        cgpa: record.cgpa,
        backlogs: record.backlogs,
        alerts,
    };
}
export async function scheduleMeeting(actor, meetingId, input) {
    const meeting = await db('mentor_meetings')
        .where({ id: meetingId, mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId })
        .first();
    if (!meeting)
        throw new AppError(404, 'Meeting not found');
    await db('mentor_meetings').where({ id: meetingId }).update({
        status: 'SCHEDULED',
        scheduled_at: new Date(input.scheduledAt),
        meeting_type: input.meetingType ?? meeting.meeting_type,
        student_visible_notes: input.studentVisibleNotes ?? null,
        updated_at: db.fn.now(),
    });
    await notifyStudent({
        studentId: Number(meeting.student_id),
        collegeId: actor.collegeId,
        type: 'MEETING_SCHEDULED',
        title: 'Mentor meeting scheduled',
        body: `Your meeting is scheduled for ${new Date(input.scheduledAt).toLocaleString()}.`,
        link: '/lms/services/mentor',
        relatedType: 'mentor_meeting',
        relatedId: meetingId,
    });
    return { id: meetingId, status: 'SCHEDULED' };
}
export async function completeMeeting(actor, meetingId, input) {
    const meeting = await db('mentor_meetings')
        .where({ id: meetingId, mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId })
        .first();
    if (!meeting)
        throw new AppError(404, 'Meeting not found');
    await db('mentor_meetings').where({ id: meetingId }).update({
        status: 'COMPLETED',
        student_visible_notes: input.studentVisibleNotes ?? null,
        private_notes: input.privateNotes ?? null,
        follow_up_date: input.followUpDate ?? null,
        referral_status: input.referralStatus ?? null,
        updated_at: db.fn.now(),
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        action: 'MEETING_COMPLETED',
        entityType: 'mentor_meeting',
        entityId: meetingId,
    });
    return { id: meetingId, status: 'COMPLETED' };
}
export async function assignMentor(actor, studentId, mentorFacultyId, academicYearId) {
    const student = await db('students').where({ id: studentId, college_id: actor.collegeId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    await db('mentor_assignments')
        .where({ student_id: studentId, college_id: actor.collegeId, status: 'ACTIVE', is_primary: true })
        .update({ status: 'INACTIVE', effective_to: db.fn.now(), updated_at: db.fn.now() });
    const [id] = await db('mentor_assignments').insert({
        college_id: actor.collegeId,
        student_id: studentId,
        mentor_faculty_id: mentorFacultyId,
        academic_year_id: academicYearId ?? student.academic_year_id,
        status: 'ACTIVE',
        is_primary: true,
        effective_from: db.fn.now(),
        assigned_by_faculty_id: actor.facultyUserId,
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        action: 'MENTOR_ASSIGNED',
        entityType: 'mentor_assignment',
        entityId: id,
        afterState: { studentId, mentorFacultyId },
    });
    await notifyStudent({
        studentId,
        collegeId: actor.collegeId,
        type: 'MENTOR_ASSIGNED',
        title: 'Mentor assigned',
        body: 'A faculty mentor has been assigned to you.',
        link: '/lms/services/mentor',
        relatedType: 'mentor_assignment',
        relatedId: id,
    });
    return { assignmentId: Number(id) };
}
export async function mentorGetMeeting(actor, meetingId) {
    const meeting = await db('mentor_meetings as m')
        .join('students as s', 's.id', 'm.student_id')
        .where({ 'm.id': meetingId, 'm.mentor_faculty_id': actor.facultyUserId, 'm.college_id': actor.collegeId })
        .select('m.*', 's.name as student_name', 's.usn')
        .first();
    if (!meeting)
        throw new AppError(404, 'Meeting not found');
    return {
        id: Number(meeting.id),
        studentName: meeting.student_name,
        usn: meeting.usn,
        status: meeting.status,
        meetingType: meeting.meeting_type,
        scheduledAt: meeting.scheduled_at,
        agenda: meeting.agenda,
        studentVisibleNotes: meeting.student_visible_notes,
        privateNotes: meeting.private_notes,
        followUpDate: meeting.follow_up_date,
        referralStatus: meeting.referral_status,
    };
}
