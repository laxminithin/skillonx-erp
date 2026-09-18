import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from '../studentServices/audit.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { assertMentorOf } from './permissions.js';
async function activeAssignmentId(actor, studentId) {
    const a = await db('mentor_assignments')
        .where({ student_id: studentId, mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId, status: 'ACTIVE' })
        .first();
    return a ? Number(a.id) : null;
}
function serializeSession(m, includePrivate) {
    return {
        id: Number(m.id),
        studentId: Number(m.student_id),
        status: m.status,
        meetingType: m.meeting_type,
        sessionCategory: m.session_category ?? null,
        visibility: m.visibility ?? 'MENTORING_TEAM',
        scheduledAt: m.scheduled_at,
        agenda: m.agenda,
        observations: m.observations ?? null,
        outcome: m.outcome ?? null,
        studentVisibleNotes: m.student_visible_notes ?? null,
        privateNotes: includePrivate ? (m.private_notes ?? null) : null,
        followUpDate: m.follow_up_date ?? null,
        followUpStatus: m.follow_up_status ?? null,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
    };
}
export async function listSessions(actor, studentId) {
    await assertMentorOf(actor, studentId);
    const rows = await db('mentor_meetings')
        .where({ student_id: studentId, college_id: actor.collegeId })
        .orderBy('created_at', 'desc');
    return rows.map((m) => serializeSession(m, true));
}
export async function getSession(actor, sessionId) {
    const m = await db('mentor_meetings as m')
        .join('students as s', 's.id', 'm.student_id')
        .where({ 'm.id': sessionId, 'm.college_id': actor.collegeId })
        .select('m.*', 's.name as student_name', 's.usn')
        .first();
    if (!m)
        throw new AppError(404, 'Session not found');
    await assertMentorOf(actor, Number(m.student_id));
    return { ...serializeSession(m, true), studentName: m.student_name, usn: m.usn };
}
export async function createSession(actor, input) {
    await assertMentorOf(actor, input.studentId);
    const assignmentId = await activeAssignmentId(actor, input.studentId);
    const status = input.status ?? (input.scheduledAt ? 'SCHEDULED' : 'COMPLETED');
    const followUpStatus = input.followUpDate ? 'PENDING' : null;
    const [id] = await db('mentor_meetings').insert({
        college_id: actor.collegeId,
        student_id: input.studentId,
        mentor_faculty_id: actor.facultyUserId,
        mentor_assignment_id: assignmentId,
        status,
        meeting_type: input.meetingType ?? 'GENERAL',
        session_category: input.sessionCategory ?? null,
        visibility: input.visibility ?? 'MENTORING_TEAM',
        scheduled_at: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
        agenda: input.agenda,
        observations: input.observations ?? input.summary ?? null,
        student_visible_notes: input.studentVisibleNotes ?? null,
        private_notes: input.privateNotes ?? null,
        follow_up_date: input.followUpDate ?? null,
        follow_up_status: followUpStatus,
        created_by_faculty_id: actor.facultyUserId,
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: 'MENTORING_SESSION_CREATED',
        entityType: 'mentor_meeting',
        entityId: Number(id),
        afterState: { studentId: input.studentId, status, category: input.sessionCategory },
    });
    if (input.studentVisibleNotes || status === 'SCHEDULED') {
        await notifyStudent({
            studentId: input.studentId,
            collegeId: actor.collegeId,
            type: status === 'SCHEDULED' ? 'MEETING_SCHEDULED' : 'MENTORING_UPDATE',
            title: status === 'SCHEDULED' ? 'Mentoring session scheduled' : 'Mentoring session recorded',
            body: 'Your mentor has updated your mentoring record.',
            link: '/lms/services/mentor',
            relatedType: 'mentor_meeting',
            relatedId: id,
            dedupeKeyOverride: `MENTORING_SESSION:${id}`,
        });
    }
    return { id: Number(id), status };
}
export async function updateSession(actor, sessionId, input) {
    const m = await db('mentor_meetings').where({ id: sessionId, college_id: actor.collegeId }).first();
    if (!m)
        throw new AppError(404, 'Session not found');
    await assertMentorOf(actor, Number(m.student_id));
    const patch = { updated_at: db.fn.now() };
    if (input.meetingType !== undefined)
        patch.meeting_type = input.meetingType;
    if (input.sessionCategory !== undefined)
        patch.session_category = input.sessionCategory;
    if (input.visibility !== undefined)
        patch.visibility = input.visibility;
    if (input.scheduledAt !== undefined)
        patch.scheduled_at = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (input.agenda !== undefined)
        patch.agenda = input.agenda;
    if (input.observations !== undefined)
        patch.observations = input.observations;
    if (input.summary !== undefined && input.observations === undefined)
        patch.observations = input.summary;
    if (input.studentVisibleNotes !== undefined)
        patch.student_visible_notes = input.studentVisibleNotes;
    if (input.privateNotes !== undefined)
        patch.private_notes = input.privateNotes;
    if (input.outcome !== undefined)
        patch.outcome = input.outcome;
    if (input.status !== undefined)
        patch.status = input.status;
    if (input.followUpDate !== undefined) {
        patch.follow_up_date = input.followUpDate;
        patch.follow_up_status = input.followUpDate ? 'PENDING' : null;
    }
    await db('mentor_meetings').where({ id: sessionId }).update(patch);
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: input.visibility !== undefined ? 'MENTORING_SESSION_VISIBILITY_CHANGED' : 'MENTORING_SESSION_UPDATED',
        entityType: 'mentor_meeting',
        entityId: sessionId,
        beforeState: { visibility: m.visibility, status: m.status },
        afterState: patch,
    });
    return { id: sessionId, status: patch.status ?? m.status };
}
/** Complete a pending follow-up without destroying the originating session. */
export async function completeFollowUp(actor, sessionId, outcome) {
    const m = await db('mentor_meetings').where({ id: sessionId, college_id: actor.collegeId }).first();
    if (!m)
        throw new AppError(404, 'Session not found');
    await assertMentorOf(actor, Number(m.student_id));
    if (m.follow_up_status !== 'PENDING')
        throw new AppError(400, 'No pending follow-up on this session');
    await db('mentor_meetings').where({ id: sessionId }).update({
        follow_up_status: 'DONE',
        follow_up_completed_at: db.fn.now(),
        outcome: outcome ?? m.outcome ?? null,
        updated_at: db.fn.now(),
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: 'MENTORING_FOLLOWUP_COMPLETED',
        entityType: 'mentor_meeting',
        entityId: sessionId,
    });
    return { id: sessionId, followUpStatus: 'DONE' };
}
/** Follow-ups across the mentor's mentees, bucketed for the dashboard. */
export async function listFollowUps(actor) {
    const rows = await db('mentor_meetings as m')
        .join('students as s', 's.id', 'm.student_id')
        .where({ 'm.mentor_faculty_id': actor.facultyUserId, 'm.college_id': actor.collegeId, 'm.follow_up_status': 'PENDING' })
        .whereNotNull('m.follow_up_date')
        .orderBy('m.follow_up_date', 'asc')
        .select('m.id', 'm.student_id', 'm.follow_up_date', 'm.agenda', 's.name', 's.usn');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = { overdue: [], dueToday: [], upcoming: [] };
    for (const r of rows) {
        const item = {
            sessionId: Number(r.id),
            studentId: Number(r.student_id),
            studentName: r.name,
            usn: r.usn,
            followUpDate: r.follow_up_date,
            agenda: r.agenda,
        };
        const d = new Date(r.follow_up_date);
        d.setHours(0, 0, 0, 0);
        if (d < today)
            buckets.overdue.push(item);
        else if (d.getTime() === today.getTime())
            buckets.dueToday.push(item);
        else
            buckets.upcoming.push(item);
    }
    return buckets;
}
// ── Action plan items ───────────────────────────────────────────────────
function serializeAction(a) {
    return {
        id: Number(a.id),
        studentId: Number(a.student_id),
        meetingId: a.meeting_id != null ? Number(a.meeting_id) : null,
        title: a.title,
        description: a.description ?? null,
        owner: a.owner,
        status: a.status,
        priority: a.priority,
        dueDate: a.due_date ?? null,
        completedAt: a.completed_at ?? null,
        outcome: a.outcome ?? null,
        studentVisible: !!a.student_visible,
        createdAt: a.created_at,
    };
}
export async function listActions(actor, studentId) {
    await assertMentorOf(actor, studentId);
    const rows = await db('mentoring_actions')
        .where({ student_id: studentId, college_id: actor.collegeId })
        .orderBy('created_at', 'desc');
    return rows.map(serializeAction);
}
export async function createAction(actor, input) {
    await assertMentorOf(actor, input.studentId);
    const [id] = await db('mentoring_actions').insert({
        college_id: actor.collegeId,
        student_id: input.studentId,
        mentor_faculty_id: actor.facultyUserId,
        meeting_id: input.meetingId ?? null,
        title: input.title,
        description: input.description ?? null,
        owner: input.owner ?? 'STUDENT',
        status: 'OPEN',
        priority: input.priority ?? 'NORMAL',
        due_date: input.dueDate ?? null,
        student_visible: input.studentVisible ?? true,
        created_by_faculty_id: actor.facultyUserId,
    });
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: 'MENTORING_ACTION_CREATED',
        entityType: 'mentoring_action',
        entityId: Number(id),
        afterState: { studentId: input.studentId, title: input.title },
    });
    if ((input.owner ?? 'STUDENT') === 'STUDENT' && (input.studentVisible ?? true)) {
        await notifyStudent({
            studentId: input.studentId,
            collegeId: actor.collegeId,
            type: 'MENTORING_ACTION',
            title: 'New action item from your mentor',
            body: input.title,
            link: '/lms/services/mentor',
            relatedType: 'mentoring_action',
            relatedId: id,
            dedupeKeyOverride: `MENTORING_ACTION:${id}`,
        });
    }
    return { id: Number(id), status: 'OPEN' };
}
export async function updateAction(actor, actionId, input) {
    const a = await db('mentoring_actions').where({ id: actionId, college_id: actor.collegeId }).first();
    if (!a)
        throw new AppError(404, 'Action not found');
    await assertMentorOf(actor, Number(a.student_id));
    const patch = { updated_at: db.fn.now() };
    if (input.title !== undefined)
        patch.title = input.title;
    if (input.description !== undefined)
        patch.description = input.description;
    if (input.owner !== undefined)
        patch.owner = input.owner;
    if (input.priority !== undefined)
        patch.priority = input.priority;
    if (input.dueDate !== undefined)
        patch.due_date = input.dueDate;
    if (input.outcome !== undefined)
        patch.outcome = input.outcome;
    if (input.studentVisible !== undefined)
        patch.student_visible = input.studentVisible;
    if (input.status !== undefined) {
        patch.status = input.status;
        patch.completed_at = input.status === 'COMPLETED' ? db.fn.now() : null;
    }
    await db('mentoring_actions').where({ id: actionId }).update(patch);
    await recordServicesAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        actorType: 'FACULTY',
        actorName: actor.name,
        action: input.status === 'COMPLETED' ? 'MENTORING_ACTION_COMPLETED' : 'MENTORING_ACTION_UPDATED',
        entityType: 'mentoring_action',
        entityId: actionId,
        afterState: patch,
    });
    return { id: actionId, status: patch.status ?? a.status };
}
