import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { addDays, compareISODate } from '../lessonPlans/dates.js';
import { isClassAdmin } from '../academicClasses/access.js';
import { listClassSubjects, listClasses, loadClassRow } from '../academicClasses/service.js';
import { notifyApprovedClass } from '../academicClasses/studentNotifications.js';
import { currentClassContext } from '../academicClasses/studentAccess.js';
import { assertCanScheduleClass, assertCanViewClassSchedule, assertPeriodAdmin, canScheduleTimetable, } from './access.js';
import { BLOCKING_EVENT_TYPES, CALENDAR_EVENT_TYPES, DEFAULT_PERIODS, OVERRIDE_KINDS, ROOM_TYPES, } from './types.js';
import { asHHMM, asISODate, collegeTimezone, dateInRange, dateRangesOverlap, dayLabel, eachDate, hoursBetween, timesOverlap, todayInTimezone, weekRange, weekdayInTimezone, } from './time.js';
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^\d{1,2}:\d{2}(?::\d{2})?/);
export const periodSchema = z.object({
    name: z.string().trim().min(1).max(64),
    periodNumber: z.number().int().positive().nullable().optional(),
    startTime: hhmm,
    endTime: hhmm,
    kind: z.enum(['PERIOD', 'BREAK', 'LUNCH']).default('PERIOD'),
    sortOrder: z.number().int().optional(),
    academicYearId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
});
export const roomSchema = z.object({
    name: z.string().trim().min(1).max(128),
    code: z.string().trim().min(1).max(64),
    building: z.string().trim().max(128).nullable().optional(),
    floor: z.string().trim().max(32).nullable().optional(),
    type: z.enum(ROOM_TYPES).default('CLASSROOM'),
    capacity: z.number().int().positive().nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export const slotSchema = z.object({
    academicClassId: z.number().int().positive(),
    classSubjectId: z.number().int().positive(),
    facultyIds: z.array(z.number().int().positive()).min(1),
    roomId: z.number().int().positive().nullable().optional(),
    batchId: z.number().int().positive().nullable().optional(),
    dayOfWeek: z.number().int().min(0).max(6),
    startPeriodId: z.number().int().positive().nullable().optional(),
    endPeriodId: z.number().int().positive().nullable().optional(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    effectiveFrom: isoDate,
    effectiveTo: isoDate.nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export const overrideSchema = z.object({
    slotId: z.number().int().positive().nullable().optional(),
    academicClassId: z.number().int().positive(),
    classSubjectId: z.number().int().positive().nullable().optional(),
    courseId: z.number().int().positive().nullable().optional(),
    date: isoDate,
    kind: z.enum(OVERRIDE_KINDS),
    facultyId: z.number().int().positive().nullable().optional(),
    substituteFacultyId: z.number().int().positive().nullable().optional(),
    roomId: z.number().int().positive().nullable().optional(),
    startPeriodId: z.number().int().positive().nullable().optional(),
    endPeriodId: z.number().int().positive().nullable().optional(),
    startTime: hhmm.nullable().optional(),
    endTime: hhmm.nullable().optional(),
    reason: z.string().trim().max(500).nullable().optional(),
});
export const calendarEventSchema = z.object({
    calendarId: z.number().int().positive().nullable().optional(),
    academicYearId: z.number().int().positive().nullable().optional(),
    semesterId: z.number().int().positive().nullable().optional(),
    eventType: z.enum(CALENDAR_EVENT_TYPES),
    title: z.string().trim().min(1).max(255),
    startDate: isoDate,
    endDate: isoDate,
    notes: z.string().trim().max(2000).nullable().optional(),
});
export const attendanceFromSlotSchema = z.object({
    date: isoDate,
    slotId: z.number().int().positive().nullable().optional(),
    overrideId: z.number().int().positive().nullable().optional(),
    lessonPlanEntryId: z.number().int().positive().nullable().optional(),
    topicId: z.number().int().positive().nullable().optional(),
    topicLabel: z.string().trim().max(255).nullable().optional(),
});
function serializePeriod(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        academicYearId: row.academic_year_id != null ? Number(row.academic_year_id) : null,
        name: String(row.name),
        periodNumber: row.period_number != null ? Number(row.period_number) : null,
        startTime: asHHMM(row.start_time),
        endTime: asHHMM(row.end_time),
        kind: row.kind,
        sortOrder: Number(row.sort_order ?? 0),
        isActive: Boolean(row.is_active),
    };
}
async function collegeTz(collegeId) {
    const row = await db('colleges').where({ id: collegeId }).select('timezone').first();
    return collegeTimezone(row?.timezone);
}
async function hasTimetable() {
    return db.schema.hasTable('timetable_slots');
}
export async function listPeriods(collegeId, academicYearId) {
    if (!(await db.schema.hasTable('timetable_periods')))
        return [];
    let q = db('timetable_periods').where({ college_id: collegeId, is_active: true });
    if (academicYearId) {
        q = q.andWhere((inner) => inner.where({ academic_year_id: academicYearId }).orWhereNull('academic_year_id'));
    }
    const rows = await q.orderBy('sort_order').orderBy('start_time');
    return rows.map(serializePeriod);
}
export async function ensureDefaultPeriods(actor) {
    const existing = await listPeriods(actor.collegeId);
    if (existing.length)
        return { periods: existing, created: false };
    assertPeriodAdmin(actor);
    if (!(await db.schema.hasTable('timetable_periods'))) {
        throw new AppError(503, 'Timetable schema is not installed');
    }
    await db('timetable_periods').insert(DEFAULT_PERIODS.map((p) => ({
        college_id: actor.collegeId,
        name: p.name,
        period_number: p.periodNumber,
        start_time: p.startTime,
        end_time: p.endTime,
        kind: p.kind,
        sort_order: p.sortOrder,
        is_active: true,
    })));
    return { periods: await listPeriods(actor.collegeId), created: true };
}
export async function savePeriod(actor, input, id) {
    assertPeriodAdmin(actor);
    if (minutesInvalid(input.startTime, input.endTime)) {
        throw new AppError(400, 'Period end time must be after start time');
    }
    const payload = {
        college_id: actor.collegeId,
        academic_year_id: input.academicYearId ?? null,
        name: input.name,
        period_number: input.kind === 'PERIOD' ? input.periodNumber ?? null : null,
        start_time: asHHMM(input.startTime),
        end_time: asHHMM(input.endTime),
        kind: input.kind,
        sort_order: input.sortOrder ?? input.periodNumber ?? 0,
        is_active: input.isActive ?? true,
        updated_at: db.fn.now(),
    };
    if (id) {
        const row = await db('timetable_periods').where({ id, college_id: actor.collegeId }).first();
        if (!row)
            throw new AppError(404, 'Period not found');
        await db('timetable_periods').where({ id }).update(payload);
        return serializePeriod(await db('timetable_periods').where({ id }).first());
    }
    const [created] = await db('timetable_periods').insert(payload);
    return serializePeriod(await db('timetable_periods').where({ id: created }).first());
}
export async function listRooms(actor, type) {
    if (!(await db.schema.hasTable('rooms')))
        return [];
    let q = db('rooms').where({ college_id: actor.collegeId });
    if (type)
        q = q.andWhere({ type });
    const rows = await q.orderBy('building').orderBy('name');
    return rows.map(serializeRoom);
}
export async function saveRoom(actor, input, id) {
    if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL' && actor.role !== 'HOD') {
        throw new AppError(403, 'You are not authorized to manage rooms');
    }
    const payload = {
        college_id: actor.collegeId,
        name: input.name,
        code: input.code.trim().toUpperCase(),
        building: input.building ?? null,
        floor: input.floor ?? null,
        type: input.type,
        capacity: input.capacity ?? null,
        status: input.status ?? 'ACTIVE',
        updated_at: db.fn.now(),
    };
    try {
        if (id) {
            const row = await db('rooms').where({ id, college_id: actor.collegeId }).first();
            if (!row)
                throw new AppError(404, 'Room not found');
            await db('rooms').where({ id }).update(payload);
            return serializeRoom(await db('rooms').where({ id }).first());
        }
        const [created] = await db('rooms').insert(payload);
        return serializeRoom(await db('rooms').where({ id: created }).first());
    }
    catch (err) {
        const dbErr = err;
        if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
            throw new AppError(409, 'A room with this code already exists');
        }
        throw err;
    }
}
function serializeRoom(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        name: String(row.name),
        code: String(row.code),
        building: row.building ?? null,
        floor: row.floor ?? null,
        type: row.type,
        capacity: row.capacity != null ? Number(row.capacity) : null,
        status: row.status,
    };
}
function minutesInvalid(start, end) {
    return hoursBetween(start, end) <= 0;
}
async function loadPeriod(collegeId, id) {
    const row = await db('timetable_periods').where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(400, 'Period not found');
    return serializePeriod(row);
}
async function resolveSlotTimes(actor, input) {
    let startTime = input.startTime ? asHHMM(input.startTime) : '';
    let endTime = input.endTime ? asHHMM(input.endTime) : '';
    let startPeriodNumber = null;
    let endPeriodNumber = null;
    let startPeriodId = 'startPeriodId' in input ? input.startPeriodId ?? null : null;
    let endPeriodId = 'endPeriodId' in input ? input.endPeriodId ?? null : startPeriodId;
    if (startPeriodId) {
        const start = await loadPeriod(actor.collegeId, startPeriodId);
        startTime = startTime || start.startTime;
        startPeriodNumber = start.periodNumber;
        if (start.kind !== 'PERIOD')
            throw new AppError(400, 'Breaks and lunch cannot be assigned as teaching periods');
    }
    if (endPeriodId) {
        const end = await loadPeriod(actor.collegeId, endPeriodId);
        endTime = endTime || end.endTime;
        endPeriodNumber = end.periodNumber;
        if (end.kind !== 'PERIOD')
            throw new AppError(400, 'Breaks and lunch cannot be assigned as teaching periods');
    }
    else if (startPeriodNumber != null) {
        endPeriodNumber = startPeriodNumber;
        endPeriodId = startPeriodId;
    }
    if (!startTime || !endTime)
        throw new AppError(400, 'Start and end time are required');
    if (minutesInvalid(startTime, endTime))
        throw new AppError(400, 'End time must be after start time');
    return { startTime, endTime, startPeriodId, endPeriodId, startPeriodNumber, endPeriodNumber };
}
export async function classTimetableContext(actor, classId) {
    const { classRow, access } = await assertCanViewClassSchedule(actor, classId);
    const [subjects, periods, rooms, batches] = await Promise.all([
        listClassSubjects(classId),
        listPeriods(actor.collegeId, Number(classRow.academic_year_id)),
        listRooms(actor),
        db.schema.hasTable('academic_class_batches').then((ok) => ok ? db('academic_class_batches').where({ academic_class_id: classId }).orderBy('sort_order') : []),
    ]);
    return {
        class: {
            id: Number(classRow.id),
            name: classRow.name,
            code: classRow.code,
            academicYearId: Number(classRow.academic_year_id),
            programId: Number(classRow.program_id),
            departmentId: Number(classRow.department_id),
            semesterId: Number(classRow.semester_id),
            sectionLabel: classRow.section_label ?? classRow.sectionLabel,
        },
        canEdit: canScheduleTimetable(actor, access),
        subjects: subjects.map((s) => ({
            id: s.id,
            courseId: s.courseId,
            code: s.code,
            name: s.name,
            faculty: s.faculty,
            facultyAssigned: s.faculty.length > 0,
        })),
        unassignedSubjects: subjects.filter((s) => !s.faculty.length).map((s) => ({ id: s.id, code: s.code, name: s.name })),
        periods,
        rooms,
        batches: batches.map((b) => ({ id: Number(b.id), name: b.name, code: b.code })),
    };
}
async function loadSlotFaculty(slotIds) {
    const map = new Map();
    if (!slotIds.length)
        return map;
    const rows = await db('timetable_slot_faculty as sf')
        .join('faculty_users as u', 'u.id', 'sf.faculty_id')
        .whereIn('sf.slot_id', slotIds)
        .select('sf.slot_id', 'sf.faculty_id', 'sf.is_primary', 'u.name');
    for (const row of rows) {
        const id = Number(row.slot_id);
        const list = map.get(id) ?? [];
        list.push({ facultyId: Number(row.faculty_id), name: String(row.name), isPrimary: Boolean(row.is_primary) });
        map.set(id, list);
    }
    return map;
}
function serializeSlot(row, faculty = []) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        academicClassId: Number(row.academic_class_id),
        classSubjectId: Number(row.class_subject_id),
        courseId: Number(row.course_id),
        facultyId: row.faculty_id != null ? Number(row.faculty_id) : null,
        faculty,
        roomId: row.room_id != null ? Number(row.room_id) : null,
        batchId: row.batch_id != null ? Number(row.batch_id) : null,
        dayOfWeek: Number(row.day_of_week),
        startPeriodId: row.start_period_id != null ? Number(row.start_period_id) : null,
        endPeriodId: row.end_period_id != null ? Number(row.end_period_id) : null,
        startPeriodNumber: row.start_period_number != null ? Number(row.start_period_number) : null,
        endPeriodNumber: row.end_period_number != null ? Number(row.end_period_number) : null,
        startTime: asHHMM(row.start_time),
        endTime: asHHMM(row.end_time),
        effectiveFrom: asISODate(row.effective_from),
        effectiveTo: row.effective_to ? asISODate(row.effective_to) : null,
        status: String(row.status),
        className: row.class_name,
        classCode: row.class_code,
        courseName: row.course_name,
        courseCode: row.course_code,
        roomName: row.room_name ?? null,
        roomCode: row.room_code ?? null,
        batchName: row.batch_name ?? null,
    };
}
function slotsQuery(collegeId) {
    return db('timetable_slots as s')
        .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .join('courses as c', 'c.id', 's.course_id')
        .leftJoin('rooms as r', 'r.id', 's.room_id')
        .leftJoin('academic_class_batches as b', 'b.id', 's.batch_id')
        .where('s.college_id', collegeId)
        .select('s.*', 'ac.name as class_name', 'ac.code as class_code', 'c.name as course_name', 'c.code as course_code', 'r.name as room_name', 'r.code as room_code', 'b.name as batch_name');
}
export async function listClassSlots(actor, classId) {
    await assertCanViewClassSchedule(actor, classId);
    if (!(await hasTimetable()))
        return [];
    const rows = await slotsQuery(actor.collegeId).andWhere('s.academic_class_id', classId).orderBy('s.day_of_week').orderBy('s.start_time');
    const faculty = await loadSlotFaculty(rows.map((r) => Number(r.id)));
    return rows.map((r) => serializeSlot(r, faculty.get(Number(r.id)) ?? []));
}
async function assertMappedFaculty(classId, classSubjectId, facultyIds) {
    const subjects = await listClassSubjects(classId);
    const subject = subjects.find((s) => s.id === classSubjectId);
    if (!subject)
        throw new AppError(400, 'Subject is not mapped to this class');
    if (!subject.faculty.length) {
        throw new AppError(400, 'Faculty Not Assigned', { subject: subject.name }, 'FACULTY_NOT_ASSIGNED');
    }
    const mapped = new Set(subject.faculty.map((f) => f.facultyId));
    for (const id of facultyIds) {
        if (!mapped.has(id)) {
            throw new AppError(400, 'Timetable can only use faculty mapped to this class subject', {
                facultyId: id,
                subject: subject.name,
            });
        }
    }
    return subject;
}
async function assertAcademicRange(classRow, from, to) {
    const calendar = await db('academic_calendars')
        .where({ college_id: classRow.college_id, academic_year_id: classRow.academic_year_id })
        .orderBy('is_default', 'desc')
        .first();
    if (!calendar)
        return;
    const start = asISODate(calendar.start_date);
    const end = asISODate(calendar.end_date);
    if (compareISODate(from, start) < 0 || (to && compareISODate(to, end) > 0) || compareISODate(from, end) > 0) {
        throw new AppError(400, `Timetable dates must fall within the academic calendar (${start} – ${end})`);
    }
}
export async function findConflicts(collegeId, probe) {
    if (!(await hasTimetable()))
        return [];
    const hits = [];
    const rows = await slotsQuery(collegeId).andWhere('s.status', 'ACTIVE').andWhere('s.day_of_week', probe.dayOfWeek);
    const facultyMap = await loadSlotFaculty(rows.map((r) => Number(r.id)));
    for (const row of rows) {
        if (probe.excludeSlotId && Number(row.id) === probe.excludeSlotId)
            continue;
        const slot = serializeSlot(row, facultyMap.get(Number(row.id)) ?? []);
        if (!dateRangesOverlap(probe.effectiveFrom, probe.effectiveTo, slot.effectiveFrom, slot.effectiveTo))
            continue;
        if (!timesOverlap(probe.startTime, probe.endTime, slot.startTime, slot.endTime))
            continue;
        if (probe.date && !dateInRange(probe.date, slot.effectiveFrom, slot.effectiveTo))
            continue;
        const sameBatch = (probe.batchId ?? null) === (slot.batchId ?? null) || probe.batchId == null || slot.batchId == null;
        if (slot.academicClassId === probe.academicClassId && sameBatch) {
            hits.push({
                kind: 'CLASS',
                message: `This class already has ${slot.courseName} at ${slot.startTime}–${slot.endTime} on ${dayLabel(slot.dayOfWeek)}`,
                slotId: slot.id,
                academicClassId: slot.academicClassId,
                className: slot.className,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dayOfWeek: slot.dayOfWeek,
            });
        }
        const slotFacultyIds = new Set(slot.faculty.map((f) => f.facultyId));
        for (const facultyId of probe.facultyIds) {
            if (slotFacultyIds.has(facultyId)) {
                const name = slot.faculty.find((f) => f.facultyId === facultyId)?.name;
                hits.push({
                    kind: 'FACULTY',
                    message: `${name || 'Faculty'} is already teaching ${slot.className} (${slot.courseName}) at this time`,
                    slotId: slot.id,
                    academicClassId: slot.academicClassId,
                    className: slot.className,
                    facultyId,
                    facultyName: name,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    dayOfWeek: slot.dayOfWeek,
                });
            }
        }
        if (probe.roomId && slot.roomId === probe.roomId) {
            hits.push({
                kind: 'ROOM',
                message: `${slot.roomName || 'This room'} is already booked by ${slot.className} at this time`,
                slotId: slot.id,
                academicClassId: slot.academicClassId,
                className: slot.className,
                roomId: slot.roomId,
                roomName: slot.roomName,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dayOfWeek: slot.dayOfWeek,
            });
        }
    }
    if (probe.date && (await db.schema.hasTable('timetable_overrides'))) {
        const extras = await db('timetable_overrides as o')
            .join('academic_classes as ac', 'ac.id', 'o.academic_class_id')
            .leftJoin('courses as c', 'c.id', 'o.course_id')
            .leftJoin('rooms as r', 'r.id', 'o.room_id')
            .leftJoin('faculty_users as fu', 'fu.id', 'o.faculty_id')
            .leftJoin('faculty_users as su', 'su.id', 'o.substitute_faculty_id')
            .where({ 'o.college_id': collegeId, 'o.override_date': probe.date, 'o.status': 'ACTIVE' })
            .whereNotIn('o.kind', ['CANCELLED'])
            .select('o.*', 'ac.name as class_name', 'c.name as course_name', 'r.name as room_name', 'fu.name as faculty_name', 'su.name as substitute_name');
        for (const row of extras) {
            if (probe.excludeOverrideId && Number(row.id) === probe.excludeOverrideId)
                continue;
            const start = row.start_time ? asHHMM(row.start_time) : null;
            const end = row.end_time ? asHHMM(row.end_time) : null;
            if (!start || !end || !timesOverlap(probe.startTime, probe.endTime, start, end))
                continue;
            if (Number(row.academic_class_id) === probe.academicClassId) {
                hits.push({
                    kind: 'CLASS',
                    message: `This class already has a ${String(row.kind).toLowerCase()} session at ${start}–${end}`,
                    overrideId: Number(row.id),
                    academicClassId: Number(row.academic_class_id),
                    className: row.class_name,
                    startTime: start,
                    endTime: end,
                });
            }
            const ids = [row.faculty_id, row.substitute_faculty_id].filter(Boolean).map(Number);
            for (const facultyId of probe.facultyIds) {
                if (ids.includes(facultyId)) {
                    hits.push({
                        kind: 'FACULTY',
                        message: `Faculty is already assigned to ${row.class_name} at this time`,
                        overrideId: Number(row.id),
                        facultyId,
                        className: row.class_name,
                        startTime: start,
                        endTime: end,
                    });
                }
            }
            if (probe.roomId && row.room_id && Number(row.room_id) === probe.roomId) {
                hits.push({
                    kind: 'ROOM',
                    message: `${row.room_name || 'This room'} is already booked at this time`,
                    overrideId: Number(row.id),
                    roomId: probe.roomId,
                    roomName: row.room_name,
                    startTime: start,
                    endTime: end,
                });
            }
        }
    }
    return hits;
}
function throwConflicts(hits) {
    if (!hits.length)
        return;
    throw new AppError(409, hits[0].message, { conflicts: hits }, `${hits[0].kind}_CONFLICT`);
}
export async function createSlot(actor, input) {
    const { classRow } = await assertCanScheduleClass(actor, input.academicClassId);
    const subject = await assertMappedFaculty(input.academicClassId, input.classSubjectId, input.facultyIds);
    const times = await resolveSlotTimes(actor, input);
    await assertAcademicRange(classRow, input.effectiveFrom, input.effectiveTo);
    const hits = await findConflicts(actor.collegeId, {
        academicClassId: input.academicClassId,
        facultyIds: input.facultyIds,
        roomId: input.roomId ?? null,
        batchId: input.batchId ?? null,
        dayOfWeek: input.dayOfWeek,
        startTime: times.startTime,
        endTime: times.endTime,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
    });
    throwConflicts(hits);
    const [id] = await db('timetable_slots').insert({
        college_id: actor.collegeId,
        academic_class_id: input.academicClassId,
        class_subject_id: input.classSubjectId,
        course_id: subject.courseId,
        faculty_id: input.facultyIds[0],
        room_id: input.roomId ?? null,
        batch_id: input.batchId ?? null,
        start_period_id: times.startPeriodId,
        end_period_id: times.endPeriodId,
        start_period_number: times.startPeriodNumber,
        end_period_number: times.endPeriodNumber,
        day_of_week: input.dayOfWeek,
        start_time: times.startTime,
        end_time: times.endTime,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo ?? null,
        status: input.status ?? 'ACTIVE',
        kind: 'REGULAR',
        created_by: actor.facultyUserId,
    });
    await replaceSlotFaculty(Number(id), input.facultyIds);
    return getSlot(actor, Number(id));
}
async function replaceSlotFaculty(slotId, facultyIds) {
    await db('timetable_slot_faculty').where({ slot_id: slotId }).del();
    if (!facultyIds.length)
        return;
    await db('timetable_slot_faculty').insert(facultyIds.map((facultyId, i) => ({
        slot_id: slotId,
        faculty_id: facultyId,
        is_primary: i === 0,
    })));
}
export async function getSlot(actor, slotId) {
    const row = await slotsQuery(actor.collegeId).andWhere('s.id', slotId).first();
    if (!row)
        throw new AppError(404, 'Timetable slot not found');
    await assertCanViewClassSchedule(actor, Number(row.academic_class_id));
    const faculty = await loadSlotFaculty([slotId]);
    return serializeSlot(row, faculty.get(slotId) ?? []);
}
export async function updateSlot(actor, slotId, input) {
    const existing = await getSlot(actor, slotId);
    await assertCanScheduleClass(actor, existing.academicClassId);
    const subject = await assertMappedFaculty(input.academicClassId, input.classSubjectId, input.facultyIds);
    const classRow = await loadClassRow(existing.academicClassId, actor.collegeId);
    const times = await resolveSlotTimes(actor, input);
    await assertAcademicRange(classRow, input.effectiveFrom, input.effectiveTo);
    const hits = await findConflicts(actor.collegeId, {
        excludeSlotId: slotId,
        academicClassId: input.academicClassId,
        facultyIds: input.facultyIds,
        roomId: input.roomId ?? null,
        batchId: input.batchId ?? null,
        dayOfWeek: input.dayOfWeek,
        startTime: times.startTime,
        endTime: times.endTime,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
    });
    throwConflicts(hits);
    const completed = await db.schema.hasTable('attendance_sessions')
        ? await db('attendance_sessions')
            .where({ timetable_slot_id: slotId, status: 'COMPLETED' })
            .count({ c: '*' })
            .first()
        : { c: 0 };
    const hasHistory = Number(completed?.c ?? 0) > 0;
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    if (hasHistory && compareISODate(existing.effectiveFrom, today) < 0) {
        const splitFrom = compareISODate(input.effectiveFrom, today) < 0 ? today : input.effectiveFrom;
        await db('timetable_slots')
            .where({ id: slotId })
            .update({ effective_to: addDays(splitFrom, -1), updated_at: db.fn.now() });
        const created = await createSlot(actor, { ...input, effectiveFrom: splitFrom });
        return created;
    }
    await db('timetable_slots').where({ id: slotId }).update({
        academic_class_id: input.academicClassId,
        class_subject_id: input.classSubjectId,
        course_id: subject.courseId,
        faculty_id: input.facultyIds[0],
        room_id: input.roomId ?? null,
        batch_id: input.batchId ?? null,
        start_period_id: times.startPeriodId,
        end_period_id: times.endPeriodId,
        start_period_number: times.startPeriodNumber,
        end_period_number: times.endPeriodNumber,
        day_of_week: input.dayOfWeek,
        start_time: times.startTime,
        end_time: times.endTime,
        effective_from: input.effectiveFrom,
        effective_to: input.effectiveTo ?? null,
        status: input.status ?? existing.status,
        updated_at: db.fn.now(),
    });
    await replaceSlotFaculty(slotId, input.facultyIds);
    return getSlot(actor, slotId);
}
export async function deactivateSlot(actor, slotId) {
    const existing = await getSlot(actor, slotId);
    await assertCanScheduleClass(actor, existing.academicClassId);
    const tz = await collegeTz(actor.collegeId);
    await db('timetable_slots').where({ id: slotId }).update({
        status: 'INACTIVE',
        effective_to: todayInTimezone(tz),
        updated_at: db.fn.now(),
    });
    return getSlot(actor, slotId);
}
export async function teachingDayMap(collegeId, academicYearId, from, to) {
    const map = new Map();
    const calendars = academicYearId
        ? await db('academic_calendars').where({ college_id: collegeId, academic_year_id: academicYearId }).select('*')
        : await db('academic_calendars').where({ college_id: collegeId, is_default: true }).select('*');
    const working = new Set(String(calendars[0]?.working_weekdays || '1,2,3,4,5,6')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n)));
    const exceptions = calendars.length
        ? await db('academic_calendar_exceptions').whereIn('calendar_id', calendars.map((c) => c.id))
        : [];
    const events = (await db.schema.hasTable('academic_calendar_events'))
        ? await db('academic_calendar_events')
            .where({ college_id: collegeId })
            .andWhere('start_date', '<=', to)
            .andWhere('end_date', '>=', from)
            .modify((q) => {
            if (academicYearId)
                q.andWhere((inner) => inner.where({ academic_year_id: academicYearId }).orWhereNull('academic_year_id'));
        })
        : [];
    for (const date of eachDate(from, to)) {
        const weekday = weekdayInTimezone(date);
        let teaching = working.has(weekday);
        let holiday = false;
        let label = null;
        for (const ex of exceptions) {
            if (asISODate(ex.exception_date) !== date)
                continue;
            const type = String(ex.exception_type).toUpperCase();
            if (type === 'WORKING_DAY') {
                teaching = true;
                holiday = false;
                label = ex.label || 'Working day';
            }
            else if (BLOCKING_EVENT_TYPES.has(type) || type === 'NON_WORKING' || type === 'NON_TEACHING' || type === 'BLOCKED') {
                teaching = false;
                holiday = true;
                label = ex.label || type;
            }
        }
        for (const ev of events) {
            if (!dateInRange(date, asISODate(ev.start_date), asISODate(ev.end_date)))
                continue;
            const type = String(ev.event_type).toUpperCase();
            if (type === 'WORKING_DAY') {
                teaching = true;
                holiday = false;
                label = ev.title;
            }
            else if (ev.blocks_teaching || BLOCKING_EVENT_TYPES.has(type)) {
                teaching = false;
                holiday = true;
                label = ev.title || type;
            }
        }
        map.set(date, { teaching, holiday, label });
    }
    return map;
}
export async function listCalendarEvents(actor, academicYearId) {
    const calendars = (await db('academic_calendars as c')
        .leftJoin('academic_years as y', 'y.id', 'c.academic_year_id')
        .where('c.college_id', actor.collegeId)
        .modify((q) => {
        if (academicYearId)
            q.andWhere('c.academic_year_id', academicYearId);
    })
        .select('c.*', 'y.label as academic_year_label')
        .orderBy('c.start_date', 'desc'));
    const calendarIds = calendars.map((c) => Number(c.id));
    const exceptions = (calendarIds.length ? await db('academic_calendar_exceptions').whereIn('calendar_id', calendarIds) : []);
    const events = ((await db.schema.hasTable('academic_calendar_events'))
        ? await db('academic_calendar_events')
            .where({ college_id: actor.collegeId })
            .modify((q) => {
            if (academicYearId)
                q.andWhere({ academic_year_id: academicYearId });
        })
            .orderBy('start_date')
        : []);
    return {
        calendars: calendars.map((c) => ({
            id: Number(c.id),
            name: c.name,
            academicYearId: Number(c.academic_year_id),
            academicYearLabel: c.academic_year_label,
            startDate: asISODate(c.start_date),
            endDate: asISODate(c.end_date),
            workingWeekdays: c.working_weekdays,
            isDefault: Boolean(c.is_default),
            exceptions: exceptions
                .filter((e) => Number(e.calendar_id) === Number(c.id))
                .map((e) => ({
                id: Number(e.id),
                date: asISODate(e.exception_date),
                type: e.exception_type,
                label: e.label,
            })),
        })),
        events: events.map((e) => ({
            id: Number(e.id),
            calendarId: e.calendar_id != null ? Number(e.calendar_id) : null,
            academicYearId: e.academic_year_id != null ? Number(e.academic_year_id) : null,
            semesterId: e.semester_id != null ? Number(e.semester_id) : null,
            eventType: e.event_type,
            title: e.title,
            startDate: asISODate(e.start_date),
            endDate: asISODate(e.end_date),
            blocksTeaching: Boolean(e.blocks_teaching),
            notes: e.notes,
        })),
    };
}
export async function createCalendarEvent(actor, input) {
    if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL' && actor.role !== 'HOD') {
        throw new AppError(403, 'You are not authorized to edit the academic calendar');
    }
    const blocksTeaching = BLOCKING_EVENT_TYPES.has(input.eventType);
    const [id] = await db('academic_calendar_events').insert({
        college_id: actor.collegeId,
        calendar_id: input.calendarId ?? null,
        academic_year_id: input.academicYearId ?? null,
        semester_id: input.semesterId ?? null,
        event_type: input.eventType,
        title: input.title,
        start_date: input.startDate,
        end_date: input.endDate,
        blocks_teaching: blocksTeaching,
        notes: input.notes ?? null,
        created_by: actor.facultyUserId,
    });
    if (blocksTeaching && input.calendarId) {
        for (const date of eachDate(input.startDate, input.endDate)) {
            const existing = await db('academic_calendar_exceptions')
                .where({ calendar_id: input.calendarId, exception_date: date })
                .first();
            if (!existing) {
                await db('academic_calendar_exceptions').insert({
                    calendar_id: input.calendarId,
                    exception_date: date,
                    exception_type: input.eventType,
                    label: input.title,
                });
            }
        }
    }
    if (input.eventType === 'WORKING_DAY' && input.calendarId) {
        const existing = await db('academic_calendar_exceptions')
            .where({ calendar_id: input.calendarId, exception_date: input.startDate })
            .first();
        if (!existing) {
            await db('academic_calendar_exceptions').insert({
                calendar_id: input.calendarId,
                exception_date: input.startDate,
                exception_type: 'WORKING_DAY',
                label: input.title,
            });
        }
    }
    const row = await db('academic_calendar_events').where({ id }).first();
    return row;
}
async function plannedTopics(collegeId, items) {
    const map = new Map();
    if (!(await db.schema.hasTable('lesson_plan_entries')))
        return map;
    const courseIds = [...new Set(items.map((i) => i.courseId).filter((v) => v != null))];
    const facultyIds = [...new Set(items.flatMap((i) => i.facultyIds))];
    if (!courseIds.length || !facultyIds.length)
        return map;
    const plans = await db('faculty_lesson_plans')
        .where({ college_id: collegeId })
        .whereIn('course_id', courseIds)
        .whereIn('created_by', facultyIds)
        .whereNot('status', 'ARCHIVED')
        .select('id', 'course_id', 'created_by');
    if (!plans.length)
        return map;
    const dates = [...new Set(items.map((i) => i.date))];
    const entries = await db('lesson_plan_entries')
        .whereIn('plan_id', plans.map((p) => p.id))
        .whereIn('planned_date', dates)
        .select('id', 'plan_id', 'topic_id', 'topic_name', 'planned_date');
    const planById = new Map(plans.map((p) => [Number(p.id), p]));
    for (const e of entries) {
        const plan = planById.get(Number(e.plan_id));
        if (!plan)
            continue;
        const key = `${plan.course_id}:${plan.created_by}:${asISODate(e.planned_date)}`;
        if (!map.has(key)) {
            map.set(key, {
                entryId: Number(e.id),
                topicId: e.topic_id != null ? Number(e.topic_id) : null,
                topicName: String(e.topic_name),
            });
        }
    }
    return map;
}
async function attendanceByKeys(collegeId, from, to, classIds) {
    const map = new Map();
    if (!classIds.length || !(await db.schema.hasTable('attendance_sessions')))
        return map;
    const rows = await db('attendance_sessions')
        .where({ college_id: collegeId })
        .whereIn('academic_class_id', classIds)
        .andWhere('session_date', '>=', from)
        .andWhere('session_date', '<=', to)
        .select('id', 'academic_class_id', 'course_id', 'session_date', 'period_number', 'timetable_slot_id', 'timetable_override_id', 'status');
    for (const row of rows) {
        const date = asISODate(row.session_date);
        if (row.timetable_slot_id)
            map.set(`slot:${row.timetable_slot_id}:${date}`, { id: Number(row.id), status: String(row.status) });
        if (row.timetable_override_id) {
            map.set(`override:${row.timetable_override_id}:${date}`, { id: Number(row.id), status: String(row.status) });
        }
        map.set(`period:${row.academic_class_id}:${row.course_id}:${date}:${row.period_number ?? ''}`, { id: Number(row.id), status: String(row.status) });
    }
    return map;
}
function attendanceState(row, expected = true) {
    if (!expected)
        return 'NOT_EXPECTED';
    if (!row)
        return 'NOT_TAKEN';
    if (row.status === 'COMPLETED')
        return 'COMPLETED';
    if (row.status === 'OPEN')
        return 'OPEN';
    if (row.status === 'DRAFT')
        return 'DRAFT';
    return 'NOT_TAKEN';
}
async function expandSlots(collegeId, slots, from, to, yearId, extraClassIds = []) {
    const classIds = [...new Set([...slots.map((s) => s.academicClassId), ...extraClassIds])];
    const dayMap = await teachingDayMap(collegeId, yearId, from, to);
    const overrides = classIds.length
        ? await db('timetable_overrides as o')
            .leftJoin('rooms as r', 'r.id', 'o.room_id')
            .leftJoin('faculty_users as fu', 'fu.id', 'o.faculty_id')
            .leftJoin('faculty_users as su', 'su.id', 'o.substitute_faculty_id')
            .leftJoin('faculty_users as ou', 'ou.id', 'o.original_faculty_id')
            .leftJoin('courses as c', 'c.id', 'o.course_id')
            .leftJoin('academic_classes as ac', 'ac.id', 'o.academic_class_id')
            .where('o.college_id', collegeId)
            .whereIn('o.academic_class_id', classIds)
            .andWhere('o.override_date', '>=', from)
            .andWhere('o.override_date', '<=', to)
            .andWhere('o.status', 'ACTIVE')
            .select('o.*', 'r.name as room_name', 'r.code as room_code', 'fu.name as faculty_name', 'su.name as substitute_name', 'ou.name as original_name', 'c.name as course_name', 'c.code as course_code', 'ac.name as class_name', 'ac.code as class_code')
        : [];
    const bySlotDate = new Map();
    const extras = [];
    for (const o of overrides) {
        if (o.timetable_slot_id)
            bySlotDate.set(`${o.timetable_slot_id}:${asISODate(o.override_date)}`, o);
        else
            extras.push(o);
    }
    const att = await attendanceByKeys(collegeId, from, to, classIds);
    const topicProbe = [];
    const out = [];
    for (const date of eachDate(from, to)) {
        const weekday = weekdayInTimezone(date);
        const flags = dayMap.get(date) ?? { teaching: weekday >= 1 && weekday <= 6, holiday: false, label: null };
        for (const slot of slots) {
            if (slot.status !== 'ACTIVE')
                continue;
            if (slot.dayOfWeek !== weekday)
                continue;
            if (!dateInRange(date, slot.effectiveFrom, slot.effectiveTo))
                continue;
            const override = bySlotDate.get(`${slot.id}:${date}`);
            const originalFaculty = slot.faculty;
            let state = 'SCHEDULED';
            let faculty = originalFaculty;
            let roomId = slot.roomId;
            let roomName = slot.roomName ?? null;
            let roomCode = slot.roomCode ?? null;
            let startTime = slot.startTime;
            let endTime = slot.endTime;
            let reason = null;
            let overrideId = null;
            let attendanceExpected = flags.teaching && !flags.holiday;
            if (!flags.teaching || flags.holiday) {
                state = 'HOLIDAY';
                attendanceExpected = false;
            }
            let isSubstitution = false;
            let coveringForFacultyName = null;
            if (override) {
                overrideId = Number(override.id);
                reason = override.reason ?? null;
                const kind = String(override.kind);
                if (kind === 'CANCELLED') {
                    state = 'CANCELLED';
                    attendanceExpected = false;
                }
                else if (kind === 'SUBSTITUTION' && override.substitute_faculty_id) {
                    state = 'SUBSTITUTED';
                    isSubstitution = true;
                    coveringForFacultyName = override.original_name
                        ? String(override.original_name)
                        : originalFaculty[0]?.name ?? null;
                    faculty = [
                        {
                            facultyId: Number(override.substitute_faculty_id),
                            name: String(override.substitute_name || 'Substitute'),
                            isPrimary: true,
                        },
                    ];
                }
                else if (kind === 'ROOM_CHANGE') {
                    state = 'ROOM_CHANGED';
                    if (override.room_id) {
                        roomId = Number(override.room_id);
                        roomName = override.room_name ?? roomName;
                        roomCode = override.room_code ?? roomCode;
                    }
                }
                else if (kind === 'SPECIAL')
                    state = 'SPECIAL';
                if (override.start_time)
                    startTime = asHHMM(override.start_time);
                if (override.end_time)
                    endTime = asHHMM(override.end_time);
                if (override.room_id && kind !== 'CANCELLED') {
                    roomId = Number(override.room_id);
                    roomName = override.room_name ?? roomName;
                }
            }
            const attKey = overrideId
                ? att.get(`override:${overrideId}:${date}`) ?? att.get(`slot:${slot.id}:${date}`)
                : att.get(`slot:${slot.id}:${date}`) ??
                    att.get(`period:${slot.academicClassId}:${slot.courseId}:${date}:${slot.startPeriodNumber ?? ''}`);
            topicProbe.push({ courseId: slot.courseId, facultyIds: faculty.map((f) => f.facultyId), date });
            out.push({
                id: overrideId ? `override:${overrideId}:${date}` : `slot:${slot.id}:${date}`,
                date,
                dayOfWeek: weekday,
                dayLabel: dayLabel(weekday),
                state,
                holidayLabel: state === 'HOLIDAY' ? flags.label || 'Holiday / No Class' : null,
                slotId: slot.id,
                overrideId,
                academicClassId: slot.academicClassId,
                className: slot.className || '',
                classCode: slot.classCode || '',
                classSubjectId: slot.classSubjectId,
                courseId: slot.courseId,
                courseCode: slot.courseCode ?? null,
                courseName: slot.courseName ?? null,
                faculty,
                originalFaculty,
                roomId,
                roomName,
                roomCode,
                startPeriodNumber: slot.startPeriodNumber,
                endPeriodNumber: slot.endPeriodNumber,
                startTime,
                endTime,
                hours: hoursBetween(startTime, endTime),
                batchId: slot.batchId,
                batchName: slot.batchName ?? null,
                reason,
                attendanceExpected,
                attendanceSessionId: attKey?.id ?? null,
                attendanceStatus: attendanceState(attKey, attendanceExpected),
                plannedTopic: null,
                isSubstitution,
                coveringForFacultyName,
            });
        }
        for (const extra of extras.filter((e) => asISODate(e.override_date) === date)) {
            const kind = String(extra.kind);
            if (!['EXTRA', 'MAKEUP', 'SPECIAL'].includes(kind))
                continue;
            const startTime = extra.start_time ? asHHMM(extra.start_time) : '09:00';
            const endTime = extra.end_time ? asHHMM(extra.end_time) : '10:00';
            const faculty = extra.faculty_id
                ? [{ facultyId: Number(extra.faculty_id), name: String(extra.faculty_name || 'Faculty'), isPrimary: true }]
                : extra.substitute_faculty_id
                    ? [{ facultyId: Number(extra.substitute_faculty_id), name: String(extra.substitute_name || 'Faculty'), isPrimary: true }]
                    : [];
            const attKey = att.get(`override:${extra.id}:${date}`);
            const teaching = flags.teaching && !flags.holiday;
            topicProbe.push({ courseId: extra.course_id != null ? Number(extra.course_id) : null, facultyIds: faculty.map((f) => f.facultyId), date });
            out.push({
                id: `override:${extra.id}:${date}`,
                date,
                dayOfWeek: weekday,
                dayLabel: dayLabel(weekday),
                state: kind === 'MAKEUP' ? 'MAKEUP' : kind === 'SPECIAL' ? 'SPECIAL' : 'EXTRA',
                holidayLabel: null,
                slotId: extra.timetable_slot_id != null ? Number(extra.timetable_slot_id) : null,
                overrideId: Number(extra.id),
                academicClassId: Number(extra.academic_class_id),
                className: extra.class_name || '',
                classCode: extra.class_code || '',
                classSubjectId: extra.class_subject_id != null ? Number(extra.class_subject_id) : null,
                courseId: extra.course_id != null ? Number(extra.course_id) : null,
                courseCode: extra.course_code ?? null,
                courseName: extra.course_name ?? null,
                faculty,
                originalFaculty: faculty,
                roomId: extra.room_id != null ? Number(extra.room_id) : null,
                roomName: extra.room_name ?? null,
                roomCode: extra.room_code ?? null,
                startPeriodNumber: extra.start_period_number != null ? Number(extra.start_period_number) : null,
                endPeriodNumber: extra.end_period_number != null ? Number(extra.end_period_number) : null,
                startTime,
                endTime,
                hours: hoursBetween(startTime, endTime),
                batchId: extra.batch_id != null ? Number(extra.batch_id) : null,
                batchName: null,
                reason: extra.reason ?? null,
                attendanceExpected: teaching,
                attendanceSessionId: attKey?.id ?? null,
                attendanceStatus: attendanceState(attKey, teaching),
                plannedTopic: null,
            });
        }
    }
    const topics = await plannedTopics(collegeId, topicProbe);
    for (const occ of out) {
        for (const f of occ.faculty) {
            const hit = topics.get(`${occ.courseId}:${f.facultyId}:${occ.date}`);
            if (hit) {
                occ.plannedTopic = hit;
                break;
            }
        }
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    return out;
}
async function slotsForClasses(collegeId, classIds) {
    if (!classIds.length || !(await hasTimetable()))
        return [];
    const rows = await slotsQuery(collegeId).whereIn('s.academic_class_id', classIds).andWhere('s.status', 'ACTIVE');
    const faculty = await loadSlotFaculty(rows.map((r) => Number(r.id)));
    return rows.map((r) => serializeSlot(r, faculty.get(Number(r.id)) ?? []));
}
/**
 * Read-only academic room occupancy for other modules (Campus OS Phase 11
 * venue booking). Timetable stays authoritative: this only expands existing
 * slots/overrides through `expandSlots` (holidays, cancellations, room changes
 * and extra/makeup sessions applied) and never writes anything.
 */
export async function roomAcademicOccupancy(collegeId, roomIds, from, to) {
    const ids = [...new Set(roomIds.filter((id) => Number.isFinite(id) && id > 0))];
    if (!ids.length || !(await hasTimetable()))
        return [];
    const overrideRows = (await db.schema.hasTable('timetable_overrides'))
        ? await db('timetable_overrides')
            .where({ college_id: collegeId, status: 'ACTIVE' })
            .whereIn('room_id', ids)
            .andWhere('override_date', '>=', from)
            .andWhere('override_date', '<=', to)
            .select('timetable_slot_id', 'academic_class_id')
        : [];
    const movedInSlotIds = overrideRows.filter((r) => r.timetable_slot_id != null).map((r) => Number(r.timetable_slot_id));
    const extraClassIds = overrideRows.filter((r) => r.timetable_slot_id == null).map((r) => Number(r.academic_class_id));
    const rows = await slotsQuery(collegeId)
        .andWhere('s.status', 'ACTIVE')
        .andWhere((q) => {
        q.whereIn('s.room_id', ids);
        if (movedInSlotIds.length)
            q.orWhereIn('s.id', movedInSlotIds);
    });
    const faculty = await loadSlotFaculty(rows.map((r) => Number(r.id)));
    const slots = rows.map((r) => serializeSlot(r, faculty.get(Number(r.id)) ?? []));
    const occurrences = await expandSlots(collegeId, slots, from, to, null, [...new Set(extraClassIds)]);
    const wanted = new Set(ids);
    return occurrences
        .filter((o) => o.roomId != null && wanted.has(o.roomId) && o.state !== 'CANCELLED' && o.state !== 'HOLIDAY')
        .map((o) => ({
        roomId: Number(o.roomId),
        date: o.date,
        startTime: o.startTime,
        endTime: o.endTime,
        state: o.state,
        className: o.className,
        courseName: o.courseName,
    }));
}
export async function classWeek(actor, classId, from, to) {
    const { classRow } = await assertCanViewClassSchedule(actor, classId);
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const range = from && to ? { from, to } : weekRange(today, tz);
    const slots = await slotsForClasses(actor.collegeId, [classId]);
    const occurrences = await expandSlots(actor.collegeId, slots, range.from, range.to, Number(classRow.academic_year_id), [classId]);
    const periods = await listPeriods(actor.collegeId, Number(classRow.academic_year_id));
    return { timezone: tz, today, from: range.from, to: range.to, periods, occurrences };
}
export async function facultyTimetable(actor, from, to) {
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const range = from && to ? { from, to } : weekRange(today, tz);
    if (!(await hasTimetable()))
        return { timezone: tz, today, from: range.from, to: range.to, periods: [], occurrences: [] };
    const owned = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .where({ 'sf.faculty_id': actor.facultyUserId, 's.college_id': actor.collegeId, 's.status': 'ACTIVE' })
        .select('s.academic_class_id');
    const extra = await db('timetable_overrides')
        .where({ college_id: actor.collegeId, status: 'ACTIVE' })
        .andWhere((q) => q.where('faculty_id', actor.facultyUserId).orWhere('substitute_faculty_id', actor.facultyUserId))
        .select('academic_class_id');
    const classIds = [...new Set([...owned, ...extra].map((r) => Number(r.academic_class_id)))];
    const slots = await slotsForClasses(actor.collegeId, classIds);
    const yearId = slots[0] ? Number((await loadClassRow(slots[0].academicClassId, actor.collegeId)).academic_year_id) : null;
    const all = await expandSlots(actor.collegeId, slots, range.from, range.to, yearId, classIds);
    const occurrences = all.filter((o) => {
        const ids = [...o.faculty, ...o.originalFaculty].map((f) => f.facultyId);
        return ids.includes(actor.facultyUserId) || isClassAdmin(actor.role);
    });
    return {
        timezone: tz,
        today,
        from: range.from,
        to: range.to,
        periods: await listPeriods(actor.collegeId),
        occurrences,
        nextClass: nextOccurrence(occurrences, today, tz),
    };
}
function nowHHMM(timeZone, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${h}:${m}`;
}
function nextOccurrence(occurrences, today, tz) {
    const clock = nowHHMM(tz);
    const upcoming = occurrences
        .filter((o) => o.attendanceExpected && o.state !== 'CANCELLED' && o.state !== 'HOLIDAY')
        .filter((o) => o.date > today || (o.date === today && o.endTime > clock));
    return upcoming[0] ?? null;
}
export async function studentTimetable(studentId, from, to) {
    const ctx = await currentClassContext(studentId);
    if (!ctx.classId || !ctx.classRow) {
        return { class: null, timezone: 'Asia/Kolkata', today: null, from: null, to: null, periods: [], occurrences: [] };
    }
    const tz = await collegeTz(ctx.collegeId);
    const today = todayInTimezone(tz);
    const range = from && to ? { from, to } : weekRange(today, tz);
    const slots = await slotsForClasses(ctx.collegeId, [ctx.classId]);
    const occurrences = await expandSlots(ctx.collegeId, slots, range.from, range.to, Number(ctx.classRow.academic_year_id), [ctx.classId]);
    return {
        class: { id: ctx.classId, name: ctx.classRow.name, code: ctx.classRow.code },
        timezone: tz,
        today,
        from: range.from,
        to: range.to,
        periods: await listPeriods(ctx.collegeId, Number(ctx.classRow.academic_year_id)),
        occurrences,
    };
}
export async function createOverride(actor, input) {
    let slot = null;
    if (input.slotId)
        slot = await getSlot(actor, input.slotId);
    const ownSlot = Boolean(slot?.faculty.some((f) => f.facultyId === actor.facultyUserId));
    const extraOwn = (input.kind === 'EXTRA' || input.kind === 'MAKEUP' || input.kind === 'SPECIAL') &&
        (input.facultyId === actor.facultyUserId || !input.facultyId);
    if (ownSlot && (input.kind === 'CANCELLED' || input.kind === 'ROOM_CHANGE' || extraOwn)) {
        await assertCanViewClassSchedule(actor, input.academicClassId);
    }
    else if (extraOwn && input.classSubjectId) {
        await assertCanViewClassSchedule(actor, input.academicClassId);
        await assertMappedFaculty(input.academicClassId, input.classSubjectId, [actor.facultyUserId]);
    }
    else {
        await assertCanScheduleClass(actor, input.academicClassId);
    }
    if (input.kind === 'EXTRA' || input.kind === 'MAKEUP' || input.kind === 'SPECIAL') {
        const mappedFaculty = input.facultyId ? [input.facultyId] : slot?.faculty.map((f) => f.facultyId) ?? [];
        if (input.classSubjectId && mappedFaculty.length) {
            await assertMappedFaculty(input.academicClassId, input.classSubjectId, mappedFaculty);
        }
    }
    const times = input.kind === 'CANCELLED'
        ? {
            startTime: slot?.startTime ?? input.startTime ?? null,
            endTime: slot?.endTime ?? input.endTime ?? null,
            startPeriodId: slot?.startPeriodId ?? null,
            endPeriodId: slot?.endPeriodId ?? null,
            startPeriodNumber: slot?.startPeriodNumber ?? null,
            endPeriodNumber: slot?.endPeriodNumber ?? null,
        }
        : await resolveSlotTimes(actor, {
            ...input,
            startTime: input.startTime ?? slot?.startTime,
            endTime: input.endTime ?? slot?.endTime,
            startPeriodId: input.startPeriodId ?? slot?.startPeriodId,
            endPeriodId: input.endPeriodId ?? slot?.endPeriodId,
        });
    if (input.kind !== 'CANCELLED') {
        const facultyIds = [
            ...(input.substituteFacultyId ? [input.substituteFacultyId] : []),
            ...(input.facultyId ? [input.facultyId] : slot?.faculty.map((f) => f.facultyId) ?? []),
        ];
        const hits = await findConflicts(actor.collegeId, {
            excludeSlotId: input.kind === 'EXTRA' ? null : input.slotId,
            academicClassId: input.academicClassId,
            facultyIds,
            roomId: input.roomId ?? slot?.roomId ?? null,
            dayOfWeek: weekdayInTimezone(input.date),
            startTime: times.startTime || '00:00',
            endTime: times.endTime || '23:59',
            effectiveFrom: input.date,
            effectiveTo: input.date,
            date: input.date,
        });
        throwConflicts(hits);
    }
    if (input.kind === 'SUBSTITUTION' && input.substituteFacultyId && input.classSubjectId) {
        await assertMappedFaculty(input.academicClassId, input.classSubjectId, [input.substituteFacultyId]);
    }
    const [id] = await db('timetable_overrides').insert({
        college_id: actor.collegeId,
        timetable_slot_id: input.slotId ?? null,
        academic_class_id: input.academicClassId,
        class_subject_id: input.classSubjectId ?? slot?.classSubjectId ?? null,
        course_id: input.courseId ?? slot?.courseId ?? null,
        override_date: input.date,
        kind: input.kind,
        original_faculty_id: slot?.faculty[0]?.facultyId ?? null,
        faculty_id: input.facultyId ?? slot?.faculty[0]?.facultyId ?? null,
        substitute_faculty_id: input.substituteFacultyId ?? null,
        room_id: input.roomId ?? slot?.roomId ?? null,
        start_period_id: times.startPeriodId,
        end_period_id: times.endPeriodId,
        start_period_number: times.startPeriodNumber,
        end_period_number: times.endPeriodNumber,
        start_time: times.startTime,
        end_time: times.endTime,
        reason: input.reason ?? null,
        created_by: actor.facultyUserId,
        approved_by: actor.facultyUserId,
        cancelled_by: input.kind === 'CANCELLED' ? actor.facultyUserId : null,
        cancelled_at: input.kind === 'CANCELLED' ? db.fn.now() : null,
        status: 'ACTIVE',
    });
    const courseName = slot?.courseName || 'Class';
    const link = '/lms/timetable';
    if (input.kind === 'CANCELLED') {
        await notifyApprovedClass({
            collegeId: actor.collegeId,
            classId: input.academicClassId,
            courseId: slot?.courseId,
            type: 'CLASS_CANCELLED',
            title: `${courseName} cancelled on ${input.date}`,
            body: input.reason || 'This scheduled class will not be held.',
            link,
            relatedType: 'TIMETABLE_OVERRIDE',
            relatedId: id,
        });
    }
    else if (input.kind === 'ROOM_CHANGE') {
        await notifyApprovedClass({
            collegeId: actor.collegeId,
            classId: input.academicClassId,
            courseId: slot?.courseId,
            type: 'ROOM_CHANGED',
            title: `${courseName} room changed on ${input.date}`,
            body: input.reason,
            link,
            relatedType: 'TIMETABLE_OVERRIDE',
            relatedId: id,
        });
    }
    else if (input.kind === 'EXTRA' || input.kind === 'MAKEUP' || input.kind === 'SPECIAL') {
        await notifyApprovedClass({
            collegeId: actor.collegeId,
            classId: input.academicClassId,
            courseId: input.courseId ?? slot?.courseId,
            type: 'SPECIAL_CLASS',
            title: `Special class added on ${input.date}`,
            body: input.reason,
            link,
            relatedType: 'TIMETABLE_OVERRIDE',
            relatedId: id,
        });
    }
    else if (input.kind === 'SUBSTITUTION') {
        await notifyApprovedClass({
            collegeId: actor.collegeId,
            classId: input.academicClassId,
            courseId: slot?.courseId,
            type: 'FACULTY_SUBSTITUTION',
            title: `${courseName} has a substitute faculty on ${input.date}`,
            body: input.reason,
            link,
            relatedType: 'TIMETABLE_OVERRIDE',
            relatedId: id,
        });
    }
    return db('timetable_overrides').where({ id }).first();
}
export async function authorizedForOccurrence(actor, occ) {
    if (isClassAdmin(actor.role) || actor.role === 'PRINCIPAL')
        return true;
    if (occ.faculty.some((f) => f.facultyId === actor.facultyUserId))
        return true;
    if (occ.originalFaculty.some((f) => f.facultyId === actor.facultyUserId))
        return true;
    const { access } = await assertCanViewClassSchedule(actor, occ.academicClassId);
    return access.manage || access.mapped;
}
export async function takeAttendanceFromOccurrence(actor, input) {
    const occ = await loadOccurrence(actor, input);
    if (occ.state === 'HOLIDAY') {
        throw new AppError(400, 'Attendance is not expected on a holiday');
    }
    if (occ.state === 'CANCELLED') {
        if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL') {
            throw new AppError(400, 'Attendance cannot be finalized for a cancelled class without an authorized override');
        }
    }
    if (!occ.courseId)
        throw new AppError(400, 'This timetable slot has no subject');
    if (!(await authorizedForOccurrence(actor, occ))) {
        throw new AppError(403, 'You are not assigned to this scheduled class');
    }
    const { createSession, getSession } = await import('../attendance/service.js');
    if (occ.attendanceSessionId)
        return getSession(actor, occ.attendanceSessionId);
    const topic = input.topicLabel ?? occ.plannedTopic?.topicName ?? occ.courseName;
    try {
        return await createSession(actor, {
            academicClassId: occ.academicClassId,
            courseId: occ.courseId,
            sessionDate: asISODate(occ.date),
            periodNumber: occ.startPeriodNumber,
            startTime: occ.startTime,
            endTime: occ.endTime,
            topicId: input.topicId ?? occ.plannedTopic?.topicId ?? null,
            topicLabel: topic,
            lessonPlanEntryId: input.lessonPlanEntryId ?? occ.plannedTopic?.entryId ?? null,
            timetableSlotId: occ.slotId,
            timetableOverrideId: occ.overrideId,
        });
    }
    catch (err) {
        if (err instanceof AppError && err.status === 409 && occ.slotId) {
            const existing = await db('attendance_sessions')
                .where({
                academic_class_id: occ.academicClassId,
                course_id: occ.courseId,
                session_date: occ.date,
                period_number: occ.startPeriodNumber,
            })
                .first();
            if (existing)
                return getSession(actor, Number(existing.id));
        }
        throw err;
    }
}
async function loadOccurrence(actor, input) {
    if (input.slotId) {
        const slot = await getSlot(actor, input.slotId);
        const occs = await expandSlots(actor.collegeId, [slot], input.date, input.date, null, [slot.academicClassId]);
        const hit = occs.find((o) => o.slotId === input.slotId && o.date === input.date);
        if (!hit)
            throw new AppError(404, 'No scheduled class on this date');
        return hit;
    }
    if (input.overrideId) {
        const row = await db('timetable_overrides').where({ id: input.overrideId, college_id: actor.collegeId }).first();
        if (!row)
            throw new AppError(404, 'Special class not found');
        const slots = await slotsForClasses(actor.collegeId, [Number(row.academic_class_id)]);
        const occs = await expandSlots(actor.collegeId, slots, input.date, input.date, null, [Number(row.academic_class_id)]);
        const hit = occs.find((o) => o.overrideId === input.overrideId);
        if (!hit)
            throw new AppError(404, 'No scheduled class on this date');
        return hit;
    }
    throw new AppError(400, 'slotId or overrideId is required');
}
export async function facultyWorkload(actor, facultyId) {
    const target = facultyId ?? actor.facultyUserId;
    if (facultyId && facultyId !== actor.facultyUserId && !isClassAdmin(actor.role) && actor.role !== 'HOD' && actor.role !== 'PRINCIPAL') {
        throw new AppError(403, 'You can only view your own teaching workload');
    }
    if (!(await hasTimetable()))
        return { facultyId: target, rows: [], totalPeriods: 0, totalHours: 0 };
    const rows = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .join('academic_classes as ac', 'ac.id', 's.academic_class_id')
        .join('courses as c', 'c.id', 's.course_id')
        .join('faculty_users as u', 'u.id', 'sf.faculty_id')
        .where({ 'sf.faculty_id': target, 's.college_id': actor.collegeId, 's.status': 'ACTIVE' })
        .select('s.id', 's.start_period_number', 's.end_period_number', 's.start_time', 's.end_time', 'ac.name as class_name', 'ac.code as class_code', 'c.name as course_name', 'c.code as course_code', 'u.name as faculty_name');
    const grouped = new Map();
    for (const row of rows) {
        const periods = row.start_period_number && row.end_period_number
            ? Number(row.end_period_number) - Number(row.start_period_number) + 1
            : 1;
        const hours = hoursBetween(asHHMM(row.start_time), asHHMM(row.end_time));
        const key = `${row.course_code}:${row.class_code}`;
        const cur = grouped.get(key) ?? {
            subject: `${row.course_code} ${row.course_name}`,
            className: row.class_name,
            classCode: row.class_code,
            periods: 0,
            hours: 0,
        };
        cur.periods += periods;
        cur.hours += hours;
        grouped.set(key, cur);
    }
    const list = [...grouped.values()];
    let substitutionHours = 0;
    let makeupHours = 0;
    if (await hasTimetable()) {
        const overrideRows = await db('timetable_overrides')
            .where({ college_id: actor.collegeId, status: 'ACTIVE' })
            .andWhere((q) => q.where('substitute_faculty_id', target).orWhere('faculty_id', target))
            .select('kind', 'start_time', 'end_time', 'substitute_faculty_id', 'faculty_id');
        for (const o of overrideRows) {
            const hrs = hoursBetween(asHHMM(o.start_time), asHHMM(o.end_time));
            if (String(o.kind) === 'SUBSTITUTION' && Number(o.substitute_faculty_id) === target)
                substitutionHours += hrs;
            else if (['MAKEUP', 'EXTRA', 'SPECIAL'].includes(String(o.kind)) && Number(o.faculty_id) === target)
                makeupHours += hrs;
        }
    }
    return {
        facultyId: target,
        facultyName: rows[0]?.faculty_name ?? null,
        rows: list,
        totalPeriods: list.reduce((s, r) => s + r.periods, 0),
        totalHours: Math.round(list.reduce((s, r) => s + r.hours, 0) * 100) / 100,
        workloadBreakdown: {
            normalAssigned: Math.round(list.reduce((s, r) => s + r.hours, 0) * 100) / 100,
            substitution: Math.round(substitutionHours * 100) / 100,
            makeup: Math.round(makeupHours * 100) / 100,
            extra: 0,
        },
    };
}
export async function courseDelivery(actor, classId, courseId) {
    await assertCanViewClassSchedule(actor, classId);
    const classRow = await loadClassRow(classId, actor.collegeId);
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const calendar = await db('academic_calendars')
        .where({ college_id: actor.collegeId, academic_year_id: classRow.academic_year_id })
        .orderBy('is_default', 'desc')
        .first();
    const from = calendar ? asISODate(calendar.start_date) : today;
    const to = calendar ? asISODate(calendar.end_date) : today;
    const slots = (await slotsForClasses(actor.collegeId, [classId])).filter((s) => s.courseId === courseId);
    const occs = await expandSlots(actor.collegeId, slots, from, compareISODate(to, today) <= 0 ? to : today, Number(classRow.academic_year_id), [classId]);
    const expected = occs.filter((o) => o.state !== 'CANCELLED');
    const delivered = occs.filter((o) => o.attendanceStatus === 'COMPLETED');
    const remaining = expected.filter((o) => o.date >= today && o.attendanceExpected && o.attendanceStatus !== 'COMPLETED');
    let topicCompletion = { planned: 0, completed: 0 };
    if (await db.schema.hasTable('lesson_plan_entries')) {
        const plan = await db('faculty_lesson_plans')
            .where({ college_id: actor.collegeId, course_id: courseId })
            .whereNot('status', 'ARCHIVED')
            .orderBy('id', 'desc')
            .first();
        if (plan) {
            const entries = await db('lesson_plan_entries').where({ plan_id: plan.id }).select('status');
            topicCompletion = {
                planned: entries.length,
                completed: entries.filter((e) => String(e.status) === 'COMPLETED').length,
            };
        }
    }
    return {
        scheduledHours: Math.round(expected.reduce((s, o) => s + o.hours, 0) * 100) / 100,
        deliveredHours: Math.round(delivered.reduce((s, o) => s + o.hours, 0) * 100) / 100,
        remainingHours: Math.round(remaining.reduce((s, o) => s + o.hours, 0) * 100) / 100,
        attendanceSessions: delivered.length,
        topicCompletion,
    };
}
export async function timetableOverview(actor) {
    const classes = await listClasses(actor);
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const classIds = classes.map((c) => c.id);
    const slots = await slotsForClasses(actor.collegeId, classIds);
    const byClass = new Map();
    for (const s of slots) {
        const list = byClass.get(s.academicClassId) ?? [];
        list.push(s);
        byClass.set(s.academicClassId, list);
    }
    const todayOccs = await expandSlots(actor.collegeId, slots, today, today, null, classIds);
    const missing = classes.filter((c) => !(byClass.get(c.id)?.length));
    const complete = classes.filter((c) => (byClass.get(c.id)?.length ?? 0) > 0);
    const unassigned = [];
    for (const c of classes) {
        const ctx = await listClassSubjects(c.id);
        for (const s of ctx) {
            if (!s.faculty.length)
                unassigned.push({ classId: c.id, className: c.name, subject: s.name, code: s.code });
        }
    }
    const facultyHits = [];
    for (const slot of slots) {
        const hits = await findConflicts(actor.collegeId, {
            excludeSlotId: slot.id,
            academicClassId: slot.academicClassId,
            facultyIds: slot.faculty.map((f) => f.facultyId),
            roomId: slot.roomId,
            batchId: slot.batchId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            effectiveFrom: slot.effectiveFrom,
            effectiveTo: slot.effectiveTo,
        });
        facultyHits.push(...hits.filter((h) => h.kind === 'FACULTY' || h.kind === 'ROOM'));
    }
    const uniqueConflicts = facultyHits.filter((h, i, arr) => arr.findIndex((x) => x.slotId === h.slotId && x.kind === h.kind && x.facultyId === h.facultyId) === i);
    return {
        timezone: tz,
        today,
        classesWithTimetable: complete.length,
        classesMissingTimetable: missing.map((c) => ({ id: c.id, name: c.name, code: c.code })),
        unassignedSubjects: unassigned,
        conflicts: uniqueConflicts.slice(0, 50),
        attendanceNotTakenToday: todayOccs.filter((o) => o.attendanceExpected && o.attendanceStatus === 'NOT_TAKEN' && o.state === 'SCHEDULED'),
    };
}
export async function exportTimetableCsv(actor, kind, id) {
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const range = weekRange(today, tz);
    let occs = [];
    let title = 'Timetable';
    if (kind === 'class') {
        const week = await classWeek(actor, id, range.from, range.to);
        occs = week.occurrences;
        title = week.occurrences[0]?.className || 'Class timetable';
    }
    else if (kind === 'faculty') {
        const data = await facultyTimetable(actor, range.from, range.to);
        occs = data.occurrences.filter((o) => o.faculty.some((f) => f.facultyId === id) || id === actor.facultyUserId);
        title = 'Faculty timetable';
    }
    else {
        const classes = await listClasses(actor);
        const slots = await slotsForClasses(actor.collegeId, classes.map((c) => c.id));
        occs = (await expandSlots(actor.collegeId, slots, range.from, range.to, null, classes.map((c) => c.id))).filter((o) => o.roomId === id);
        title = occs[0]?.roomName || 'Room timetable';
    }
    const header = 'Date,Day,Start,End,Subject,Class,Faculty,Room,State';
    const lines = occs.map((o) => `${o.date},${o.dayLabel},${o.startTime},${o.endTime},"${o.courseName || ''}","${o.className}","${o.faculty.map((f) => f.name).join('; ')}","${o.roomName || ''}",${o.state}`);
    return { filename: `${title.replace(/\s+/g, '-').toLowerCase()}.csv`, csv: [header, ...lines].join('\n') };
}
export async function facultyCalendar(actor, from, to) {
    const tz = await collegeTz(actor.collegeId);
    const today = todayInTimezone(tz);
    const range = from && to ? { from, to } : { from: addDays(today, -7), to: addDays(today, 70) };
    const tt = await facultyTimetable(actor, range.from, range.to);
    const events = tt.occurrences.map((o) => ({
        id: o.id,
        kind: o.state === 'HOLIDAY' ? 'HOLIDAY' : 'CLASS',
        title: o.state === 'HOLIDAY' ? o.holidayLabel || 'Holiday' : `${o.startTime} ${o.courseName} · ${o.className}`,
        date: o.date,
        path: o.courseId ? `/courses/${o.courseId}` : '/timetable',
    }));
    const cal = await listCalendarEvents(actor);
    for (const e of cal.events) {
        events.push({
            id: `event-${e.id}`,
            kind: e.eventType,
            title: e.title,
            date: e.startDate,
            path: '/timetable',
        });
    }
    return { timezone: tt.timezone, from: tt.from, to: tt.to, events };
}
export { sqlDate } from '../lessonPlans/dates.js';
