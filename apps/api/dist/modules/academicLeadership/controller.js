import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAdmin, requireAuth, resolveAdminCollegeId } from '../../middleware/auth.js';
import { assignFacultySchema, createAssignmentSchema, updateAssignmentSchema } from './types.js';
import * as assignments from './assignments.js';
import * as queries from './queries.js';
import * as leaveInbox from './leaveInbox.js';
import { assertLeadershipCapability, serializeMeLeadership, enrichHrActor } from './leadership.js';
import { ensureQaLeadershipUsers } from './qaUsers.js';
function actor(req) {
    const attached = req.hrActor;
    if (attached)
        return attached;
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
async function attachActor(req, _res, next) {
    try {
        req.hrActor = await enrichHrActor(actor(req));
        next();
    }
    catch (err) {
        next(err);
    }
}
export const academicLeadershipRouter = Router();
academicLeadershipRouter.use(requireAuth);
academicLeadershipRouter.use(attachActor);
academicLeadershipRouter.get('/me', asyncHandler(async (req, res) => {
    res.json(await serializeMeLeadership(actor(req)));
}));
academicLeadershipRouter.get('/hod/dashboard', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.hodDashboard(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/faculty', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listDepartmentFaculty(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/workload', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listWorkload(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/allocation', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listTeachingAllocation(actor(req), departmentId));
}));
academicLeadershipRouter.post('/hod/allocation', asyncHandler(async (req, res) => {
    const body = validate(assignFacultySchema, req.body);
    res.json(await queries.assignTeaching(actor(req), body));
}));
academicLeadershipRouter.delete('/hod/allocation', asyncHandler(async (req, res) => {
    const classId = Number(req.query.classId ?? req.body?.classId);
    const classSubjectId = Number(req.query.classSubjectId ?? req.body?.classSubjectId);
    const facultyId = Number(req.query.facultyId ?? req.body?.facultyId);
    res.json(await queries.unassignTeaching(actor(req), { classId, classSubjectId, facultyId }));
}));
academicLeadershipRouter.get('/hod/timetable', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listTimetable(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/attendance', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const from = req.query.from;
    const to = req.query.to;
    res.json(await queries.listFacultyAttendance(actor(req), departmentId, from, to));
}));
academicLeadershipRouter.get('/hod/progress', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listAcademicProgress(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/assessments', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listAssessmentMonitoring(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/results', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listResultsMonitoring(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/continuity', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listContinuity(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/exceptions', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listExceptions(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/reports', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.leadershipReports(actor(req), departmentId));
}));
academicLeadershipRouter.get('/hod/leave', asyncHandler(async (req, res) => {
    const tab = req.query.tab || 'pending';
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await leaveInbox.listLeadershipLeaveInbox(actor(req), tab, departmentId));
}));
academicLeadershipRouter.get('/hod/leave/:id', asyncHandler(async (req, res) => {
    res.json(await leaveInbox.getLeadershipLeaveDetail(actor(req), Number(req.params.id)));
}));
academicLeadershipRouter.get('/principal/dashboard', asyncHandler(async (req, res) => {
    res.json(await queries.principalDashboard(actor(req)));
}));
academicLeadershipRouter.get('/principal/departments', asyncHandler(async (req, res) => {
    res.json(await queries.listDepartmentsForPrincipal(actor(req)));
}));
academicLeadershipRouter.get('/principal/departments/:id', asyncHandler(async (req, res) => {
    res.json(await queries.departmentOverview(actor(req), Number(req.params.id)));
}));
academicLeadershipRouter.get('/principal/hods', asyncHandler(async (req, res) => {
    await assertLeadershipCapability(actor(req), 'academic.institution.departments.view');
    res.json(await assignments.listAssignments(req.user.collegeId, { role: 'HOD', status: 'ACTIVE' }));
}));
academicLeadershipRouter.get('/principal/faculty', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listDepartmentFaculty(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/students', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listStudentsOverview(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/progress', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listAcademicProgress(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/attendance', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listFacultyAttendance(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/timetable', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listTimetable(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/assessments', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listAssessmentMonitoring(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/results', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listResultsMonitoring(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/continuity', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listContinuity(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/exceptions', asyncHandler(async (req, res) => {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    res.json(await queries.listExceptions(actor(req), departmentId));
}));
academicLeadershipRouter.get('/principal/reports', asyncHandler(async (req, res) => {
    res.json(await queries.leadershipReports(actor(req)));
}));
academicLeadershipRouter.get('/principal/approvals', asyncHandler(async (req, res) => {
    const tab = req.query.tab || 'pending';
    res.json(await leaveInbox.listLeadershipLeaveInbox(actor(req), tab));
}));
academicLeadershipRouter.get('/principal/approvals/:id', asyncHandler(async (req, res) => {
    res.json(await leaveInbox.getLeadershipLeaveDetail(actor(req), Number(req.params.id)));
}));
academicLeadershipRouter.get('/admin/assignments', requireAdmin, asyncHandler(async (req, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    res.json(await assignments.listAssignments(collegeId, {
        role: req.query.role,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
        status: req.query.status,
    }));
}));
academicLeadershipRouter.post('/admin/assignments', requireAdmin, asyncHandler(async (req, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const body = validate(createAssignmentSchema, req.body);
    const a = { ...actor(req), collegeId };
    res.status(201).json(await assignments.createAssignment(a, body));
}));
academicLeadershipRouter.patch('/admin/assignments/:id', requireAdmin, asyncHandler(async (req, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const body = validate(updateAssignmentSchema, req.body);
    const a = { ...actor(req), collegeId };
    res.json(await assignments.updateAssignment(a, Number(req.params.id), body));
}));
academicLeadershipRouter.post('/admin/qa-users', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await ensureQaLeadershipUsers(actor(req)));
}));
