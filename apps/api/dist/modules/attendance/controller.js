import { Router } from 'express';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { asyncHandler, validate } from '../../utils/errors.js';
import * as attendance from './service.js';
function facultyActor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
    };
}
export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);
attendanceRouter.get('/courses/:courseId/sessions', asyncHandler(async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const data = await attendance.listFacultySessions(facultyActor(req), Number(req.params.courseId), classId);
    res.json(data);
}));
attendanceRouter.post('/sessions', asyncHandler(async (req, res) => {
    const body = validate(attendance.createSessionSchema, req.body);
    const data = await attendance.createSession(facultyActor(req), body);
    res.status(201).json(data);
}));
attendanceRouter.get('/sessions/:id', asyncHandler(async (req, res) => {
    const data = await attendance.getSession(facultyActor(req), Number(req.params.id));
    res.json(data);
}));
attendanceRouter.patch('/sessions/:id/records', asyncHandler(async (req, res) => {
    const body = validate(attendance.markRecordsSchema, req.body);
    const data = await attendance.markRecords(facultyActor(req), Number(req.params.id), body);
    res.json(data);
}));
attendanceRouter.post('/sessions/:id/mark-all-present', asyncHandler(async (req, res) => {
    const data = await attendance.markAllPresent(facultyActor(req), Number(req.params.id));
    res.json(data);
}));
attendanceRouter.post('/sessions/:id/finalize', asyncHandler(async (req, res) => {
    const data = await attendance.finalizeSession(facultyActor(req), Number(req.params.id));
    res.json(data);
}));
attendanceRouter.get('/courses/:courseId/classes/:classId/analytics', asyncHandler(async (req, res) => {
    const data = await attendance.courseAnalytics(facultyActor(req), Number(req.params.courseId), Number(req.params.classId));
    res.json(data);
}));
attendanceRouter.get('/courses/:courseId/classes/:classId/analytics.csv', asyncHandler(async (req, res) => {
    const data = await attendance.courseAnalytics(facultyActor(req), Number(req.params.courseId), Number(req.params.classId));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    res.send(attendance.analyticsToCsv(data));
}));
attendanceRouter.get('/admin/overview', asyncHandler(async (req, res) => {
    const data = await attendance.adminAttendanceOverview(facultyActor(req));
    res.json(data);
}));
export const studentAttendanceRouter = Router();
studentAttendanceRouter.use(requireStudentAuth);
studentAttendanceRouter.get('/', asyncHandler(async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const data = await attendance.studentAttendanceSummary(req.user.studentId, classId);
    res.json(data);
}));
studentAttendanceRouter.get('/subjects/:courseId', asyncHandler(async (req, res) => {
    const data = await attendance.studentSubjectAttendance(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
