import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { actionRequestSchema, assignGrievanceSchema, appealSchema, clarificationSchema, internalNoteSchema, referralSchema, reopenSchema, resolveGrievanceSchema, scheduleMeetingSchema, completeMeetingSchema, triageGrievanceSchema, } from './types.js';
import * as requests from './requestEngine.js';
import * as certificates from './certificates.js';
import * as grievances from './grievances.js';
import * as mentoring from './mentoring.js';
import * as alerts from './alerts.js';
import { assertServicesPermission } from './permissions.js';
import { readGrievanceAttachment, readRequestAttachment } from './attachmentAccess.js';
function staffActor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId,
        role: req.user.role,
        name: req.user.name,
    };
}
export const staffServicesRouter = Router();
staffServicesRouter.use(requireAuth);
staffServicesRouter.get('/attachments/:id/download', asyncHandler(async (req, res) => {
    const result = await readRequestAttachment({ role: req.user.role, collegeId: req.user.collegeId, facultyUserId: req.user.facultyUserId }, Number(req.params.id));
    res.setHeader('Content-Type', result.attachment.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(result.attachment.file_name).replace(/[\\"\r\n]/g, '_')}"`);
    res.send(result.body);
}));
staffServicesRouter.get('/grievance-attachments/:id/download', asyncHandler(async (req, res) => {
    const result = await readGrievanceAttachment({ role: req.user.role, collegeId: req.user.collegeId, facultyUserId: req.user.facultyUserId, departmentId: req.user.departmentId }, Number(req.params.id));
    res.setHeader('Content-Type', result.attachment.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(result.attachment.file_name).replace(/[\\"\r\n]/g, '_')}"`);
    res.send(result.body);
}));
staffServicesRouter.get('/action-center', asyncHandler(async (req, res) => {
    res.json(await requests.staffPendingActions(staffActor(req)));
}));
staffServicesRouter.get('/requests', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const requestType = typeof req.query.requestType === 'string' ? req.query.requestType : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json(await requests.staffListRequests(staffActor(req), { status, requestType, page, limit }));
}));
staffServicesRouter.get('/requests/:id', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    res.json(await requests.staffGetRequest(staffActor(req), Number(req.params.id)));
}));
staffServicesRouter.post('/requests/:id/action', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.process');
    const body = validate(actionRequestSchema, req.body);
    res.json(await requests.staffActionOnRequest(staffActor(req), Number(req.params.id), body));
}));
// ── Lecturer / mentor / coordinator inbox (relationship-scoped) ──────────────
// No office-wide `student_services.view` gate here: authorization is by the
// mentor/coordinator relationship, resolved inside the engine.
staffServicesRouter.get('/mentor-inbox', asyncHandler(async (req, res) => {
    const tab = typeof req.query.tab === 'string' ? req.query.tab : undefined;
    res.json(await requests.mentorInboxRequests(staffActor(req), tab));
}));
staffServicesRouter.get('/mentor-inbox/:id', asyncHandler(async (req, res) => {
    res.json(await requests.mentorGetRequest(staffActor(req), Number(req.params.id)));
}));
staffServicesRouter.post('/mentor-inbox/:id/action', asyncHandler(async (req, res) => {
    const body = validate(actionRequestSchema, req.body);
    res.json(await requests.mentorActionOnRequest(staffActor(req), Number(req.params.id), body));
}));
staffServicesRouter.post('/requests/:id/generate', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'certificate.issue');
    const doc = await certificates.generateCertificateForRequest(req.user.collegeId, Number(req.params.id), req.user.facultyUserId);
    res.json({ document: doc });
}));
staffServicesRouter.get('/grievance-categories', asyncHandler(async (req, res) => {
    res.json({ categories: await grievances.listCategories(req.user.collegeId) });
}));
staffServicesRouter.get('/grievance-dashboard', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    res.json(await grievances.dashboard(staffActor(req)));
}));
staffServicesRouter.get('/grievance-analytics', asyncHandler(async (req, res) => {
    res.json(await grievances.managementAnalytics(staffActor(req)));
}));
staffServicesRouter.get('/grievances', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const queue = typeof req.query.queue === 'string' ? req.query.queue : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json({ grievances: await grievances.staffListGrievances(staffActor(req), { status, category, queue, search }) });
}));
staffServicesRouter.get('/grievances/:id', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    res.json(await grievances.staffGetGrievance(staffActor(req), Number(req.params.id)));
}));
staffServicesRouter.post('/grievances/:id/triage', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.triage');
    const body = validate(triageGrievanceSchema, req.body);
    res.json(await grievances.triageGrievance(staffActor(req), Number(req.params.id), body));
}));
staffServicesRouter.post('/grievances/:id/assign', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.assign');
    const body = validate(assignGrievanceSchema, req.body);
    res.json(await grievances.assignGrievance(staffActor(req), Number(req.params.id), body.facultyId, body.remarks));
}));
staffServicesRouter.post('/grievances/:id/clarification', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.resolve');
    const body = validate(clarificationSchema, req.body);
    res.json(await grievances.requestClarification(staffActor(req), Number(req.params.id), body.body));
}));
staffServicesRouter.post('/grievances/:id/internal-notes', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.note');
    const body = validate(internalNoteSchema, req.body);
    res.json(await grievances.addInternalNote(staffActor(req), Number(req.params.id), body.body, body.visibility));
}));
staffServicesRouter.post('/grievances/:id/referrals', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.refer');
    const body = validate(referralSchema, req.body);
    res.json(await grievances.createReferral(staffActor(req), Number(req.params.id), body));
}));
staffServicesRouter.post('/grievances/:id/resolve', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.resolve');
    const body = validate(resolveGrievanceSchema, req.body);
    res.json(await grievances.resolveGrievance(staffActor(req), Number(req.params.id), body.resolutionSummary, body.remarks));
}));
staffServicesRouter.post('/grievances/:id/reopen', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.resolve');
    const body = validate(reopenSchema, req.body);
    res.json(await grievances.reopenCase(staffActor(req), Number(req.params.id), body.reason));
}));
staffServicesRouter.post('/grievances/:id/appeal', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'grievance.resolve');
    const body = validate(appealSchema, req.body);
    res.json(await grievances.appealCase(staffActor(req), Number(req.params.id), body.reason));
}));
staffServicesRouter.get('/mentees', asyncHandler(async (req, res) => {
    res.json({ mentees: await mentoring.mentorListMentees(staffActor(req)) });
}));
staffServicesRouter.get('/mentees/:studentId/insights', asyncHandler(async (req, res) => {
    res.json(await mentoring.mentorStudentInsights(Number(req.params.studentId), req.user.collegeId));
}));
staffServicesRouter.get('/mentees/:studentId/alerts', asyncHandler(async (req, res) => {
    res.json({ alerts: await alerts.listMenteeAlerts(staffActor(req), Number(req.params.studentId)) });
}));
staffServicesRouter.post('/mentor/assign', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'mentor.manage');
    const { studentId, mentorFacultyId, academicYearId } = req.body ?? {};
    res.json(await mentoring.assignMentor(staffActor(req), Number(studentId), Number(mentorFacultyId), academicYearId ? Number(academicYearId) : null));
}));
staffServicesRouter.post('/meetings/:id/schedule', asyncHandler(async (req, res) => {
    const body = validate(scheduleMeetingSchema, req.body);
    res.json(await mentoring.scheduleMeeting(staffActor(req), Number(req.params.id), body));
}));
staffServicesRouter.post('/meetings/:id/complete', asyncHandler(async (req, res) => {
    const body = validate(completeMeetingSchema, req.body);
    res.json(await mentoring.completeMeeting(staffActor(req), Number(req.params.id), body));
}));
staffServicesRouter.get('/meetings/:id', asyncHandler(async (req, res) => {
    res.json(await mentoring.mentorGetMeeting(staffActor(req), Number(req.params.id)));
}));
staffServicesRouter.post('/documents/:id/revoke', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'certificate.issue');
    const reason = String(req.body?.reason ?? 'Revoked by administrator');
    res.json(await certificates.revokeDocument(req.user.collegeId, Number(req.params.id), req.user.facultyUserId, reason));
}));
staffServicesRouter.get('/dashboard', asyncHandler(async (req, res) => {
    assertServicesPermission(staffActor(req), 'student_services.view');
    const actor = staffActor(req);
    const pending = await dbCount('student_service_requests', {
        college_id: actor.collegeId,
        status: 'UNDER_REVIEW',
    });
    const approvedToday = await dbCountToday('student_service_requests', {
        college_id: actor.collegeId,
        status: 'COMPLETED',
    });
    const ready = await dbCount('student_service_requests', {
        college_id: actor.collegeId,
        status: 'READY',
    });
    const openGrievances = await dbCount('student_grievances', {
        college_id: actor.collegeId,
    }, ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW']);
    res.json({ pending, approvedToday, ready, openGrievances });
}));
async function dbCount(table, where, statusIn) {
    const { db } = await import('../../db/index.js');
    let q = db(table).where(where);
    if (statusIn)
        q = q.whereIn('status', statusIn);
    const row = await q.count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
async function dbCountToday(table, where) {
    const { db } = await import('../../db/index.js');
    const row = await db(table)
        .where(where)
        .where('completed_at', '>=', db.raw('CURDATE()'))
        .count({ c: '*' })
        .first();
    return Number(row?.c ?? 0);
}
