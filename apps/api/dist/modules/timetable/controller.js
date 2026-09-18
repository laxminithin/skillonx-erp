import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import * as timetable from './service.js';
function facultyActor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
    };
}
export const timetableRouter = Router();
timetableRouter.use(requireAuth);
timetableRouter.get('/periods', asyncHandler(async (req, res) => {
    const yearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    res.json({ periods: await timetable.listPeriods(req.user.collegeId, yearId) });
}));
timetableRouter.post('/periods/defaults', asyncHandler(async (req, res) => {
    res.json(await timetable.ensureDefaultPeriods(facultyActor(req)));
}));
timetableRouter.post('/periods', asyncHandler(async (req, res) => {
    const body = validate(timetable.periodSchema, req.body);
    res.status(201).json(await timetable.savePeriod(facultyActor(req), body));
}));
timetableRouter.patch('/periods/:id', asyncHandler(async (req, res) => {
    const body = validate(timetable.periodSchema, req.body);
    res.json(await timetable.savePeriod(facultyActor(req), body, Number(req.params.id)));
}));
timetableRouter.get('/rooms', asyncHandler(async (req, res) => {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    res.json({ rooms: await timetable.listRooms(facultyActor(req), type) });
}));
timetableRouter.post('/rooms', asyncHandler(async (req, res) => {
    const body = validate(timetable.roomSchema, req.body);
    res.status(201).json(await timetable.saveRoom(facultyActor(req), body));
}));
timetableRouter.patch('/rooms/:id', asyncHandler(async (req, res) => {
    const body = validate(timetable.roomSchema, req.body);
    res.json(await timetable.saveRoom(facultyActor(req), body, Number(req.params.id)));
}));
timetableRouter.get('/calendar', asyncHandler(async (req, res) => {
    const yearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    res.json(await timetable.listCalendarEvents(facultyActor(req), yearId));
}));
timetableRouter.post('/calendar/events', asyncHandler(async (req, res) => {
    const body = validate(timetable.calendarEventSchema, req.body);
    const row = await timetable.createCalendarEvent(facultyActor(req), body);
    res.status(201).json(row);
}));
timetableRouter.get('/overview', asyncHandler(async (req, res) => {
    res.json(await timetable.timetableOverview(facultyActor(req)));
}));
timetableRouter.get('/workload', asyncHandler(async (req, res) => {
    const facultyId = req.query.facultyId ? Number(req.query.facultyId) : undefined;
    res.json(await timetable.facultyWorkload(facultyActor(req), facultyId));
}));
timetableRouter.get('/delivery', asyncHandler(async (req, res) => {
    res.json(await timetable.courseDelivery(facultyActor(req), Number(req.query.classId), Number(req.query.courseId)));
}));
timetableRouter.get('/export', asyncHandler(async (req, res) => {
    const kind = req.query.kind || 'class';
    const data = await timetable.exportTimetableCsv(facultyActor(req), kind, Number(req.query.id));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
    res.send(data.csv);
}));
timetableRouter.get('/classes/:classId/context', asyncHandler(async (req, res) => {
    res.json(await timetable.classTimetableContext(facultyActor(req), Number(req.params.classId)));
}));
timetableRouter.get('/classes/:classId/slots', asyncHandler(async (req, res) => {
    res.json({ slots: await timetable.listClassSlots(facultyActor(req), Number(req.params.classId)) });
}));
timetableRouter.get('/classes/:classId/week', asyncHandler(async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(await timetable.classWeek(facultyActor(req), Number(req.params.classId), from, to));
}));
timetableRouter.post('/slots', asyncHandler(async (req, res) => {
    const body = validate(timetable.slotSchema, req.body);
    res.status(201).json(await timetable.createSlot(facultyActor(req), body));
}));
timetableRouter.patch('/slots/:id', asyncHandler(async (req, res) => {
    const body = validate(timetable.slotSchema, req.body);
    res.json(await timetable.updateSlot(facultyActor(req), Number(req.params.id), body));
}));
timetableRouter.delete('/slots/:id', asyncHandler(async (req, res) => {
    res.json(await timetable.deactivateSlot(facultyActor(req), Number(req.params.id)));
}));
timetableRouter.post('/overrides', asyncHandler(async (req, res) => {
    const body = validate(timetable.overrideSchema, req.body);
    res.status(201).json(await timetable.createOverride(facultyActor(req), body));
}));
timetableRouter.post('/attendance', asyncHandler(async (req, res) => {
    const body = validate(timetable.attendanceFromSlotSchema, req.body);
    const data = await timetable.takeAttendanceFromOccurrence(facultyActor(req), body);
    res.status(201).json(data);
}));
export const facultyTimetableRouter = Router();
facultyTimetableRouter.use(requireAuth);
facultyTimetableRouter.get('/timetable/today', asyncHandler(async (req, res) => {
    const tzWeek = await timetable.facultyTimetable(facultyActor(req));
    const today = tzWeek.occurrences.filter((o) => o.date === tzWeek.today);
    res.json({ ...tzWeek, occurrences: today });
}));
facultyTimetableRouter.get('/timetable/week', asyncHandler(async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(await timetable.facultyTimetable(facultyActor(req), from, to));
}));
facultyTimetableRouter.get('/calendar', asyncHandler(async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(await timetable.facultyCalendar(facultyActor(req), from, to));
}));
facultyTimetableRouter.get('/workload', asyncHandler(async (req, res) => {
    res.json(await timetable.facultyWorkload(facultyActor(req)));
}));
export const studentTimetableRouter = Router();
studentTimetableRouter.use(requireStudentAuth);
studentTimetableRouter.get('/timetable/today', asyncHandler(async (req, res) => {
    const week = await timetable.studentTimetable(req.user.studentId);
    res.json({ ...week, occurrences: week.occurrences.filter((o) => o.date === week.today) });
}));
studentTimetableRouter.get('/timetable/week', asyncHandler(async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    res.json(await timetable.studentTimetable(req.user.studentId, from, to));
}));
