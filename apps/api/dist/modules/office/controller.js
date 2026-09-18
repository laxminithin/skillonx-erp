import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler, AppError } from '../../utils/errors.js';
import { db } from '../../db/index.js';
import * as requests from '../studentServices/requestEngine.js';
import * as certificates from '../studentServices/certificates.js';
import { assertServicesPermission } from '../studentServices/permissions.js';
import { recordServicesAudit } from '../studentServices/audit.js';
import { managementOfficeAnalytics } from './analytics.js';
import { assertOfficeCapability } from './access.js';
const OFFICE_ROLES = new Set(['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT', 'PRINCIPAL', 'MANAGEMENT', 'HOD', 'COLLEGE_ADMIN', 'SUPER_ADMIN']);
const OFFICE_OPERATORS = new Set(['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT', 'COLLEGE_ADMIN', 'SUPER_ADMIN']);
function actor(req) {
    const user = req.user;
    if (!OFFICE_ROLES.has(user.role))
        throw new AppError(403, 'Office Administration access required');
    return { facultyUserId: user.facultyUserId, collegeId: user.collegeId, departmentId: user.departmentId, role: user.role, name: user.name };
}
function operator(req) {
    const a = actor(req);
    if (!OFFICE_OPERATORS.has(a.role))
        throw new AppError(403, 'Office operational mutation required');
    return a;
}
function nextNumber(prefix, n) { return `${prefix}/${new Date().getFullYear()}/${String(n).padStart(6, '0')}`; }
export async function nextOfficeNumber(trx, collegeId, series) {
    const lockKey = `office-number:${collegeId}:${series}`;
    await trx.raw('select get_lock(?, 10)', [lockKey]);
    try {
        await trx('office_number_sequences').insert({ college_id: collegeId, series, last_number: 0 }).onConflict(['college_id', 'series']).ignore();
        await trx('office_number_sequences').where({ college_id: collegeId, series }).increment('last_number', 1);
        const row = await trx('office_number_sequences').where({ college_id: collegeId, series }).first();
        const next = Number(row.last_number);
        return nextNumber(series, next);
    }
    finally {
        await trx.raw('select release_lock(?)', [lockKey]).catch(() => undefined);
    }
}
export const officeRouter = Router();
officeRouter.use(requireAuth);
officeRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const a = actor(req);
    const count = async (table, where = {}) => Number((await db(table).where({ college_id: a.collegeId, ...where }).count({ c: '*' }).first())?.c ?? 0);
    const [newRequests, pendingReview, clarification, ready, issued, inward, outward, files] = await Promise.all([
        count('student_service_requests', { status: 'SUBMITTED' }), count('student_service_requests', { status: 'UNDER_REVIEW' }),
        count('student_service_requests', { status: 'ACTION_REQUIRED' }), count('student_service_requests', { status: 'APPROVED' }),
        count('student_service_documents'), count('office_inward_register', { status: 'RECEIVED' }), count('office_outward_register', { dispatch_state: 'PREPARED' }), count('office_file_records', { status: 'OPEN' }),
    ]);
    res.json({ actionRequired: { newRequests, pendingReview, clarification, ready, inward, outward }, today: { issued }, files });
}));
officeRouter.get('/requests', asyncHandler(async (req, res) => {
    const a = actor(req);
    assertOfficeCapability(a.role, 'request.view');
    assertServicesPermission(a, 'student_services.view');
    res.json(await requests.staffListRequests(a, { status: typeof req.query.status === 'string' ? req.query.status : undefined, requestType: typeof req.query.requestType === 'string' ? req.query.requestType : undefined, page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 50) }));
}));
officeRouter.get('/requests/:id', asyncHandler(async (req, res) => { const a = actor(req); assertOfficeCapability(a.role, 'request.view'); assertServicesPermission(a, 'student_services.view'); res.json(await requests.staffGetRequest(a, Number(req.params.id))); }));
officeRouter.post('/requests/:id/action', asyncHandler(async (req, res) => { const a = actor(req); assertOfficeCapability(a.role, 'request.process'); assertServicesPermission(a, 'student_services.process'); res.json(await requests.staffActionOnRequest(a, Number(req.params.id), req.body ?? {})); }));
officeRouter.post('/requests/:id/issue', asyncHandler(async (req, res) => { const a = actor(req); assertOfficeCapability(a.role, 'document.issue'); assertServicesPermission(a, 'certificate.issue'); res.json({ document: await certificates.generateCertificateForRequest(a.collegeId, Number(req.params.id), a.facultyUserId) }); }));
officeRouter.post('/requests/:id/assign', asyncHandler(async (req, res) => { const a = operator(req); res.json(await requests.assignRequest(a, Number(req.params.id), Number(req.body?.facultyId), req.body?.reason)); }));
officeRouter.get('/requests/:id/assignments', asyncHandler(async (req, res) => { const a = operator(req); res.json({ assignments: await requests.assignmentHistory(a, Number(req.params.id)) }); }));
officeRouter.post('/documents/:id/reissue', asyncHandler(async (req, res) => { const a = operator(req); res.json({ document: await certificates.reissueDocument(a.collegeId, Number(req.params.id), a.facultyUserId, String(req.body?.reason ?? 'Reissued by Office')) }); }));
officeRouter.get('/analytics', asyncHandler(async (req, res) => { const a = actor(req); assertOfficeCapability(a.role, 'analytics.view'); res.json(await managementOfficeAnalytics(a)); }));
officeRouter.get('/documents', asyncHandler(async (req, res) => { const a = actor(req); res.json({ items: await db('student_service_documents').where({ college_id: a.collegeId }).orderBy('issued_at', 'desc').limit(100).select('id', 'certificate_number', 'document_type', 'status', 'issued_at') }); }));
officeRouter.get('/inward', asyncHandler(async (req, res) => { const a = actor(req); const rows = await db('office_inward_register').where({ college_id: a.collegeId }).orderBy('received_at', 'desc').limit(100); res.json({ items: rows }); }));
officeRouter.post('/inward', asyncHandler(async (req, res) => {
    const a = operator(req);
    const input = req.body ?? {};
    if (!input.sender || !input.subject)
        throw new AppError(400, 'sender and subject are required');
    const id = await db.transaction(async (trx) => { const number = await nextOfficeNumber(trx, a.collegeId, 'INW'); const [newId] = await trx('office_inward_register').insert({ college_id: a.collegeId, inward_number: number, sender: input.sender, organization: input.organization ?? null, subject: input.subject, mode: input.mode ?? 'HAND', recipient_department: input.recipientDepartment ?? null, remarks: input.remarks ?? null, created_by_faculty_id: a.facultyUserId }); return newId; });
    res.status(201).json(await db('office_inward_register').where({ id, college_id: a.collegeId }).first());
    await recordServicesAudit({ collegeId: a.collegeId, actorId: a.facultyUserId, actorType: 'FACULTY', actorName: a.name, action: 'INWARD_REGISTERED', entityType: 'office_inward', entityId: id });
}));
officeRouter.post('/inward/:id/status', asyncHandler(async (req, res) => { const a = operator(req); const status = String(req.body?.status ?? ''); const allowed = { RECEIVED: ['FORWARDED', 'CLOSED'], REGISTERED: ['FORWARDED', 'CLOSED'], FORWARDED: ['ACKNOWLEDGED', 'CLOSED'], ACKNOWLEDGED: ['CLOSED'], CLOSED: [] }; if (!Object.prototype.hasOwnProperty.call(allowed, status))
    throw new AppError(400, 'Invalid inward status'); const id = Number(req.params.id); const current = await db('office_inward_register').where({ id, college_id: a.collegeId }).first(); if (!current)
    throw new AppError(404, 'Inward record not found'); if (!allowed[String(current.status)]?.includes(status))
    throw new AppError(400, `Invalid inward transition: ${current.status} to ${status}`); await db('office_inward_register').where({ id, college_id: a.collegeId }).update({ status, acknowledged_at: status === 'ACKNOWLEDGED' ? db.fn.now() : current.acknowledged_at, updated_at: db.fn.now() }); await db('office_register_events').insert({ college_id: a.collegeId, register_type: 'INWARD', register_id: id, from_state: current.status, to_state: status, actor_faculty_id: a.facultyUserId }); await recordServicesAudit({ collegeId: a.collegeId, actorId: a.facultyUserId, actorType: 'FACULTY', actorName: a.name, action: `INWARD_${status}`, entityType: 'office_inward', entityId: id }); res.json(await db('office_inward_register').where({ id, college_id: a.collegeId }).first()); }));
officeRouter.get('/outward', asyncHandler(async (req, res) => { const a = actor(req); res.json({ items: await db('office_outward_register').where({ college_id: a.collegeId }).orderBy('outward_date', 'desc').limit(100) }); }));
officeRouter.post('/outward', asyncHandler(async (req, res) => {
    const a = operator(req);
    const input = req.body ?? {};
    if (!input.recipient || !input.subject)
        throw new AppError(400, 'recipient and subject are required');
    const id = await db.transaction(async (trx) => { const number = await nextOfficeNumber(trx, a.collegeId, 'OUT'); const [newId] = await trx('office_outward_register').insert({ college_id: a.collegeId, outward_number: number, outward_date: input.outwardDate ?? new Date(), recipient: input.recipient, organization: input.organization ?? null, address: input.address ?? null, subject: input.subject, dispatch_mode: input.dispatchMode ?? 'HAND_DELIVERY', tracking_reference: input.trackingReference ?? null, department_id: input.departmentId ?? null, prepared_by_faculty_id: a.facultyUserId, remarks: input.remarks ?? null }); return newId; });
    res.status(201).json(await db('office_outward_register').where({ id, college_id: a.collegeId }).first());
    await recordServicesAudit({ collegeId: a.collegeId, actorId: a.facultyUserId, actorType: 'FACULTY', actorName: a.name, action: 'OUTWARD_REGISTERED', entityType: 'office_outward', entityId: id });
}));
officeRouter.post('/outward/:id/state', asyncHandler(async (req, res) => { const a = operator(req); const state = String(req.body?.state ?? ''); const allowed = { PREPARED: ['APPROVED', 'FAILED'], APPROVED: ['DISPATCHED', 'FAILED'], DISPATCHED: ['DELIVERED', 'RETURNED', 'FAILED'], DELIVERED: [], RETURNED: ['DISPATCHED', 'FAILED'], FAILED: ['PREPARED'] }; if (!Object.prototype.hasOwnProperty.call(allowed, state))
    throw new AppError(400, 'Invalid dispatch state'); const id = Number(req.params.id); const current = await db('office_outward_register').where({ id, college_id: a.collegeId }).first(); if (!current)
    throw new AppError(404, 'Outward record not found'); if (!allowed[String(current.dispatch_state)]?.includes(state))
    throw new AppError(400, `Invalid outward transition: ${current.dispatch_state} to ${state}`); await db('office_outward_register').where({ id, college_id: a.collegeId }).update({ dispatch_state: state, approved_by_faculty_id: state === 'APPROVED' ? a.facultyUserId : current.approved_by_faculty_id, dispatched_at: state === 'DISPATCHED' ? db.fn.now() : current.dispatched_at, delivered_at: state === 'DELIVERED' ? db.fn.now() : current.delivered_at, updated_at: db.fn.now() }); await db('office_register_events').insert({ college_id: a.collegeId, register_type: 'OUTWARD', register_id: id, from_state: current.dispatch_state, to_state: state, actor_faculty_id: a.facultyUserId }); await recordServicesAudit({ collegeId: a.collegeId, actorId: a.facultyUserId, actorType: 'FACULTY', actorName: a.name, action: `OUTWARD_${state}`, entityType: 'office_outward', entityId: id }); res.json(await db('office_outward_register').where({ id, college_id: a.collegeId }).first()); }));
officeRouter.get('/files', asyncHandler(async (req, res) => { const a = actor(req); res.json({ items: await db('office_file_records').where({ college_id: a.collegeId }).orderBy('updated_at', 'desc').limit(100) }); }));
officeRouter.get('/files/:id/movements', asyncHandler(async (req, res) => { const a = actor(req); const fileId = Number(req.params.id); const file = await db('office_file_records').where({ id: fileId, college_id: a.collegeId }).first(); if (!file)
    throw new AppError(404, 'File not found'); res.json({ currentCustodian: file.current_custodian, status: file.status, movements: await db('office_file_movements').where({ file_id: fileId, college_id: a.collegeId }).orderBy('sent_at') }); }));
officeRouter.post('/files', asyncHandler(async (req, res) => { const a = operator(req); const input = req.body ?? {}; if (!input.fileNumber || !input.title)
    throw new AppError(400, 'fileNumber and title are required'); const [id] = await db('office_file_records').insert({ college_id: a.collegeId, file_number: input.fileNumber, title: input.title, category: input.category ?? null, current_custodian: input.currentCustodian ?? null, department: input.department ?? null, remarks: input.remarks ?? null }); res.status(201).json(await db('office_file_records').where({ id, college_id: a.collegeId }).first()); }));
officeRouter.post('/files/:id/movements', asyncHandler(async (req, res) => { const a = operator(req); const input = req.body ?? {}; if (!input.sentTo)
    throw new AppError(400, 'sentTo is required'); const fileId = Number(req.params.id); const file = await db('office_file_records').where({ id: fileId, college_id: a.collegeId }).first(); if (!file)
    throw new AppError(404, 'File not found'); const [id] = await db('office_file_movements').insert({ file_id: fileId, college_id: a.collegeId, sent_by: file.current_custodian, sent_to: input.sentTo, purpose: input.purpose ?? null, created_by_faculty_id: a.facultyUserId }); await db('office_file_records').where({ id: fileId, college_id: a.collegeId }).update({ current_custodian: input.sentTo, status: 'IN_TRANSIT', updated_at: db.fn.now() }); await recordServicesAudit({ collegeId: a.collegeId, actorId: a.facultyUserId, actorType: 'FACULTY', actorName: a.name, action: 'FILE_MOVED', entityType: 'office_file', entityId: fileId }); res.status(201).json(await db('office_file_movements').where({ id, college_id: a.collegeId }).first()); }));
