import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLabPermission, assertLabAccess, scopedLabIds } from './access.js';
import { auditFromActor } from './audit.js';
import { addDays, sqlDate, toISODate, weekdayOf } from '../lessonPlans/dates.js';
const DEFAULT_CHECKLIST = [
    { key: 'power', label: 'Systems powered / checked', done: false },
    { key: 'software', label: 'Required software available', done: false },
    { key: 'equipment', label: 'Equipment available & working', done: false },
    { key: 'network', label: 'Internet / network checked', done: false },
    { key: 'consumables', label: 'Consumables available', done: false },
];
/**
 * Upcoming practical sessions derived from the academic timetable.
 * A timetable slot counts as a lab session when its room maps to a managed lab.
 * We never duplicate the timetable — readiness records overlay it by (slot, date).
 */
export async function upcomingSessions(actor, days = 7) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    if (ids !== 'ALL' && ids.length === 0)
        return [];
    // Labs (id + room) in scope.
    let labQ = db('labs').where({ college_id: actor.collegeId }).whereNotNull('room_id').select('id', 'name', 'room_id', 'department_id');
    if (ids !== 'ALL')
        labQ = labQ.whereIn('id', ids);
    const labs = await labQ;
    if (labs.length === 0)
        return [];
    const roomToLab = new Map();
    for (const l of labs)
        roomToLab.set(Number(l.room_id), { id: Number(l.id), name: String(l.name) });
    const roomIds = [...roomToLab.keys()];
    const start = toISODate(new Date());
    const slots = await db('timetable_slots as s')
        .leftJoin('courses as c', 'c.id', 's.course_id')
        .leftJoin('faculty_users as f', 'f.id', 's.faculty_id')
        .leftJoin('academic_class_batches as b', 'b.id', 's.batch_id')
        .leftJoin('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .where('s.college_id', actor.collegeId)
        .whereIn('s.room_id', roomIds)
        .where('s.status', 'ACTIVE')
        .select('s.*', 'c.name as course_title', 'c.code as course_code', 'f.name as faculty_name', 'b.name as batch_name', 'ac.name as class_name');
    const readiness = await db('lab_sessions')
        .where('college_id', actor.collegeId)
        .whereBetween('session_date', [start, addDays(start, days)]);
    const rMap = new Map();
    for (const r of readiness)
        rMap.set(`${r.timetable_slot_id}|${String(r.session_date).slice(0, 10)}`, r);
    const out = [];
    for (let i = 0; i <= days; i++) {
        const date = addDays(start, i);
        const wd = weekdayOf(date);
        for (const s of slots) {
            if (Number(s.day_of_week) !== wd)
                continue;
            const from = sqlDate(s.effective_from);
            const to = sqlDate(s.effective_to);
            if (from && date < from)
                continue;
            if (to && date > to)
                continue;
            const lab = roomToLab.get(Number(s.room_id));
            const key = `${s.id}|${date}`;
            const r = rMap.get(key);
            out.push({
                slotId: Number(s.id),
                labId: lab.id,
                labName: lab.name,
                sessionDate: date,
                startTime: s.start_time,
                endTime: s.end_time,
                courseId: s.course_id ? Number(s.course_id) : null,
                courseTitle: s.course_title ?? s.course_code ?? null,
                facultyId: s.faculty_id ? Number(s.faculty_id) : null,
                facultyName: s.faculty_name ?? null,
                batchId: s.batch_id ? Number(s.batch_id) : null,
                batchName: s.batch_name ?? null,
                className: s.class_name ?? null,
                readinessId: r ? Number(r.id) : null,
                readinessStatus: r ? r.readiness_status : 'NOT_STARTED',
                checklist: r?.checklist ? (typeof r.checklist === 'string' ? JSON.parse(r.checklist) : r.checklist) : DEFAULT_CHECKLIST,
                notes: r?.notes ?? null,
            });
        }
    }
    out.sort((a, b) => String(a.sessionDate).localeCompare(String(b.sessionDate)) || String(a.startTime).localeCompare(String(b.startTime)));
    return out;
}
/** Create or fetch the readiness record for a timetable slot on a date. */
export async function prepareSession(actor, input) {
    assertLabPermission(actor, 'lab.session.manage');
    const slot = await db('timetable_slots').where({ id: input.slotId, college_id: actor.collegeId }).first();
    if (!slot)
        throw new AppError(404, 'Timetable slot not found');
    const lab = await db('labs').where({ college_id: actor.collegeId, room_id: slot.room_id }).first();
    if (!lab)
        throw new AppError(400, 'This slot is not scheduled in a managed lab');
    await assertLabAccess(actor, Number(lab.id), 'operate');
    const existing = await db('lab_sessions')
        .where({ college_id: actor.collegeId, timetable_slot_id: input.slotId, session_date: input.sessionDate }).first();
    if (existing)
        return getSession(actor, Number(existing.id));
    const [id] = await db('lab_sessions').insert({
        college_id: actor.collegeId, lab_id: Number(lab.id), timetable_slot_id: input.slotId,
        course_id: slot.course_id ?? null, academic_class_id: slot.academic_class_id ?? null,
        batch_id: slot.batch_id ?? null, faculty_id: slot.faculty_id ?? null,
        session_date: input.sessionDate, start_time: slot.start_time, end_time: slot.end_time,
        readiness_status: 'IN_PREPARATION', checklist: JSON.stringify(DEFAULT_CHECKLIST), prepared_by: actor.facultyUserId,
    });
    await auditFromActor(actor, 'SESSION_PREPARE', 'lab_session', Number(id), { after: input });
    return getSession(actor, Number(id));
}
export async function getSession(actor, sessionId) {
    assertLabPermission(actor, 'lab.view');
    const row = await db('lab_sessions as ls')
        .leftJoin('labs as l', 'l.id', 'ls.lab_id')
        .leftJoin('courses as c', 'c.id', 'ls.course_id')
        .leftJoin('faculty_users as f', 'f.id', 'ls.faculty_id')
        .where('ls.id', sessionId).where('ls.college_id', actor.collegeId)
        .select('ls.*', 'l.name as lab_name', 'c.name as course_title', 'f.name as faculty_name')
        .first();
    if (!row)
        throw new AppError(404, 'Session not found');
    return {
        id: Number(row.id), labId: Number(row.lab_id), labName: row.lab_name,
        slotId: row.timetable_slot_id ? Number(row.timetable_slot_id) : null,
        sessionDate: row.session_date, startTime: row.start_time, endTime: row.end_time,
        courseTitle: row.course_title ?? null, facultyName: row.faculty_name ?? null,
        readinessStatus: row.readiness_status,
        checklist: row.checklist ? (typeof row.checklist === 'string' ? JSON.parse(row.checklist) : row.checklist) : DEFAULT_CHECKLIST,
        notes: row.notes ?? null,
    };
}
export async function updateReadiness(actor, sessionId, input) {
    assertLabPermission(actor, 'lab.session.manage');
    const row = await db('lab_sessions').where({ id: sessionId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Session not found');
    await assertLabAccess(actor, Number(row.lab_id), 'operate');
    const patch = { updated_at: db.fn.now() };
    if (input.readinessStatus)
        patch.readiness_status = input.readinessStatus;
    if (input.checklist !== undefined)
        patch.checklist = input.checklist ? JSON.stringify(input.checklist) : null;
    if (input.notes !== undefined)
        patch.notes = input.notes;
    await db('lab_sessions').where({ id: sessionId }).update(patch);
    await auditFromActor(actor, 'SESSION_READINESS', 'lab_session', sessionId, { before: row, after: patch });
    return getSession(actor, sessionId);
}
