import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireStudentAuth } from '../../middleware/auth.js';
import { createRequestSchema, respondRequestSchema, createGrievanceSchema, appealSchema, feedbackSchema, reopenSchema, createMeetingSchema, } from './types.js';
import * as requests from './requestEngine.js';
import * as certificates from './certificates.js';
import * as grievances from './grievances.js';
import * as mentoring from './mentoring.js';
import * as alerts from './alerts.js';
import { readGrievanceAttachment, readRequestAttachment } from './attachmentAccess.js';
function studentActor(req) {
    return { studentId: req.user.studentId, collegeId: req.user.collegeId };
}
export const studentServicesRouter = Router();
studentServicesRouter.use(requireStudentAuth);
studentServicesRouter.get('/attachments/:id/download', asyncHandler(async (req, res) => {
    const result = await readRequestAttachment({ role: 'STUDENT', collegeId: req.user.collegeId, studentId: req.user.studentId }, Number(req.params.id));
    res.setHeader('Content-Type', result.attachment.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(result.attachment.file_name).replace(/[\\"\r\n]/g, '_')}"`);
    res.send(result.body);
}));
studentServicesRouter.get('/grievance-attachments/:id/download', asyncHandler(async (req, res) => {
    const result = await readGrievanceAttachment({ role: 'STUDENT', collegeId: req.user.collegeId, studentId: req.user.studentId }, Number(req.params.id));
    res.setHeader('Content-Type', result.attachment.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(result.attachment.file_name).replace(/[\\"\r\n]/g, '_')}"`);
    res.send(result.body);
}));
studentServicesRouter.get('/services', asyncHandler(async (req, res) => {
    res.json(await requests.studentServicesHome(req.user.studentId, req.user.collegeId));
}));
studentServicesRouter.get('/requests', asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const list = await requests.listStudentRequests(req.user.studentId, req.user.collegeId, status);
    res.json({ requests: list });
}));
studentServicesRouter.get('/requests/drafts', asyncHandler(async (req, res) => {
    res.json({ requests: await requests.listDraftRequests(req.user.studentId, req.user.collegeId) });
}));
studentServicesRouter.post('/requests', asyncHandler(async (req, res) => {
    const body = validate(createRequestSchema, req.body);
    const result = await requests.createRequest(studentActor(req), body);
    res.status(201).json(result);
}));
studentServicesRouter.get('/requests/:id', asyncHandler(async (req, res) => {
    res.json(await requests.getStudentRequest(studentActor(req), Number(req.params.id)));
}));
studentServicesRouter.patch('/requests/:id', asyncHandler(async (req, res) => {
    res.json(await requests.updateDraftRequest(studentActor(req), Number(req.params.id), req.body ?? {}));
}));
studentServicesRouter.post('/requests/:id/submit', asyncHandler(async (req, res) => {
    res.json(await requests.submitRequest(studentActor(req), Number(req.params.id)));
}));
studentServicesRouter.post('/requests/:id/cancel', asyncHandler(async (req, res) => {
    res.json(await requests.cancelRequest(studentActor(req), Number(req.params.id)));
}));
studentServicesRouter.post('/requests/:id/respond', asyncHandler(async (req, res) => {
    const body = validate(respondRequestSchema, req.body);
    res.json(await requests.respondToRequest(studentActor(req), Number(req.params.id), body.body));
}));
studentServicesRouter.get('/certificates', asyncHandler(async (req, res) => {
    res.json({
        certificates: await certificates.listStudentCertificates(req.user.studentId, req.user.collegeId),
    });
}));
studentServicesRouter.get('/certificates/:id', asyncHandler(async (req, res) => {
    res.json(await certificates.getStudentCertificate(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentServicesRouter.get('/grievance-categories', asyncHandler(async (req, res) => {
    res.json({ categories: await grievances.listCategories(req.user.collegeId) });
}));
studentServicesRouter.get('/grievances', asyncHandler(async (req, res) => {
    res.json({
        grievances: await grievances.listStudentGrievances(req.user.studentId, req.user.collegeId),
    });
}));
studentServicesRouter.post('/grievances', asyncHandler(async (req, res) => {
    const body = validate(createGrievanceSchema, req.body);
    res.status(201).json(await grievances.createGrievance(studentActor(req), body));
}));
studentServicesRouter.get('/grievances/:id', asyncHandler(async (req, res) => {
    res.json(await grievances.getStudentGrievance(studentActor(req), Number(req.params.id)));
}));
studentServicesRouter.post('/grievances/:id/respond', asyncHandler(async (req, res) => {
    const body = validate(respondRequestSchema, req.body);
    res.json(await grievances.studentRespond(studentActor(req), Number(req.params.id), body.body));
}));
studentServicesRouter.post('/grievances/:id/acknowledge', asyncHandler(async (req, res) => {
    res.json(await grievances.acknowledgeGrievance(studentActor(req), Number(req.params.id)));
}));
studentServicesRouter.post('/grievances/:id/feedback', asyncHandler(async (req, res) => {
    const body = validate(feedbackSchema, req.body);
    res.json(await grievances.studentFeedback(studentActor(req), Number(req.params.id), body));
}));
studentServicesRouter.post('/grievances/:id/appeal', asyncHandler(async (req, res) => {
    const body = validate(appealSchema, req.body);
    res.json(await grievances.appealCase(studentActor(req), Number(req.params.id), body.reason));
}));
studentServicesRouter.post('/grievances/:id/reopen', asyncHandler(async (req, res) => {
    const body = validate(reopenSchema, req.body);
    res.json(await grievances.reopenCase(studentActor(req), Number(req.params.id), body.reason));
}));
studentServicesRouter.get('/mentor', asyncHandler(async (req, res) => {
    res.json(await mentoring.getStudentMentor(req.user.studentId, req.user.collegeId));
}));
studentServicesRouter.get('/mentor/meetings', asyncHandler(async (req, res) => {
    res.json({
        meetings: await mentoring.listStudentMeetings(req.user.studentId, req.user.collegeId),
    });
}));
studentServicesRouter.post('/mentor/meetings', asyncHandler(async (req, res) => {
    const body = validate(createMeetingSchema, req.body);
    res.status(201).json(await mentoring.requestMeeting(studentActor(req), body));
}));
studentServicesRouter.get('/alerts', asyncHandler(async (req, res) => {
    res.json({ alerts: await alerts.listStudentAlerts(req.user.studentId, req.user.collegeId) });
}));
