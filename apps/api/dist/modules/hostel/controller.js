import { Router } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { assertHostelPermission, assertWardenHostelAccess, getWardenHostelIds, hostelPermissionsForRole } from './access.js';
import { getStudentHostelAccess } from './studentAccess.js';
import * as applications from './applications.js';
import * as allocations from './allocations.js';
import * as outpasses from './outpasses.js';
import * as leaves from './leaves.js';
import * as complaints from './complaints.js';
import * as mess from './mess.js';
import * as visitors from './visitors.js';
import * as vacating from './vacating.js';
import * as clearance from './clearance.js';
import * as integration from './integration.js';
import * as dashboard from './dashboard.js';
import * as gate from './gate.js';
import { listHostels } from './defaults.js';
import { hostelApplicationSchema, outpassSchema, leaveSchema, complaintSchema, visitorRequestSchema, messFeedbackSchema } from './types.js';
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
async function resolveHostelPortalContext(req, _res, next) {
    try {
        const requested = String(req.headers['x-portal-context'] ?? '').toUpperCase();
        if (requested !== 'WARDEN' || !req.user || hostelPermissionsForRole(req.user.role).length > 0)
            return next();
        const { db } = await import('../../db/index.js');
        const assignment = await db('hostel_warden_assignments')
            .where({ faculty_user_id: req.user.facultyUserId, college_id: req.user.collegeId, status: 'ACTIVE' })
            .first();
        if (!assignment)
            return next(new AppError(403, 'Active Warden assignment required'));
        req.user = { ...req.user, role: 'WARDEN' };
        next();
    }
    catch (error) {
        next(error);
    }
}
// ── Student router ──────────────────────────────────────────────────────
export const studentHostelRouter = Router();
studentHostelRouter.use(requireStudentAuth);
studentHostelRouter.get('/hostel/access', asyncHandler(async (req, res) => {
    res.json(await getStudentHostelAccess(req.user.studentId, req.user.collegeId));
}));
studentHostelRouter.get('/hostel', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    const application = await applications.getStudentApplication(req.user.studentId, req.user.collegeId);
    const room = access.canAccessResidentFeatures
        ? await allocations.getStudentRoom(req.user.studentId, req.user.collegeId)
        : null;
    const messInfo = access.canAccessResidentFeatures
        ? await mess.getStudentMess(req.user.studentId, req.user.collegeId)
        : null;
    const dues = await integration.getStudentHostelDues(req.user.studentId, req.user.collegeId);
    res.json({ access, application, room, mess: messInfo, dues });
}));
studentHostelRouter.get('/hostel/application', asyncHandler(async (req, res) => {
    res.json({ application: await applications.getStudentApplication(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.post('/hostel/application', asyncHandler(async (req, res) => {
    const body = validate(hostelApplicationSchema, req.body);
    res.status(201).json(await applications.createOrUpdateApplication(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.patch('/hostel/application/:id', asyncHandler(async (req, res) => {
    const body = validate(hostelApplicationSchema, req.body);
    res.json(await applications.createOrUpdateApplication(req.user.studentId, req.user.collegeId, body, Number(req.params.id)));
}));
studentHostelRouter.post('/hostel/application/:id/submit', asyncHandler(async (req, res) => {
    res.json(await applications.submitApplication(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentHostelRouter.post('/hostel/application/:id/cancel', asyncHandler(async (req, res) => {
    res.json(await applications.cancelApplication(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentHostelRouter.get('/hostel/room', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    res.json({ room: await allocations.getStudentRoom(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.get('/hostel/history', asyncHandler(async (req, res) => {
    res.json({ history: await allocations.getAllocationHistory(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.get('/hostel/outpasses', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    res.json({ outpasses: await outpasses.listStudentOutpasses(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.post('/hostel/outpasses', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    const body = validate(outpassSchema, req.body);
    res.status(201).json(await outpasses.createOutpass(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.post('/hostel/outpasses/:id/cancel', asyncHandler(async (req, res) => {
    res.json(await outpasses.cancelOutpass(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentHostelRouter.get('/hostel/leaves', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    res.json({ leaves: await leaves.listStudentLeaves(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.post('/hostel/leaves', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    const body = validate(leaveSchema, req.body);
    res.status(201).json(await leaves.createLeave(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.post('/hostel/leaves/:id/cancel', asyncHandler(async (req, res) => {
    res.json(await leaves.cancelLeave(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentHostelRouter.get('/hostel/mess', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    res.json(await mess.getStudentMess(req.user.studentId, req.user.collegeId));
}));
studentHostelRouter.get('/hostel/mess/menu', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    res.json(await mess.getMessMenu(req.user.collegeId, access.hostelId, date));
}));
studentHostelRouter.post('/hostel/mess/feedback', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    const body = validate(messFeedbackSchema, req.body);
    res.status(201).json(await mess.submitMessFeedback(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.get('/hostel/visitors', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    res.json({ visitors: await visitors.listStudentVisitors(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.post('/hostel/visitors', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures)
        return res.status(403).json({ error: 'Resident access required' });
    const body = validate(visitorRequestSchema, req.body);
    res.status(201).json(await visitors.requestVisitor(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.get('/hostel/complaints', asyncHandler(async (req, res) => {
    res.json({ complaints: await complaints.listStudentComplaints(req.user.studentId, req.user.collegeId) });
}));
studentHostelRouter.post('/hostel/complaints', asyncHandler(async (req, res) => {
    const body = validate(complaintSchema, req.body);
    res.status(201).json(await complaints.createComplaint(req.user.studentId, req.user.collegeId, body));
}));
studentHostelRouter.get('/hostel/complaints/:id', asyncHandler(async (req, res) => {
    res.json(await complaints.getComplaint(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentHostelRouter.get('/hostel/dues', asyncHandler(async (req, res) => {
    res.json(await integration.getStudentHostelDues(req.user.studentId, req.user.collegeId));
}));
studentHostelRouter.get('/hostel/clearance', asyncHandler(async (req, res) => {
    res.json(await clearance.getStudentClearance(req.user.studentId, req.user.collegeId));
}));
studentHostelRouter.post('/hostel/vacating', asyncHandler(async (req, res) => {
    const access = await getStudentHostelAccess(req.user.studentId, req.user.collegeId);
    if (!access.canAccessResidentFeatures && access.visibility !== 'VACATING') {
        return res.status(403).json({ error: 'Resident access required' });
    }
    const body = validate(z.object({ reason: z.string().min(1), requestedVacateAt: z.string().optional() }), req.body);
    res.status(201).json(await vacating.requestVacating(req.user.studentId, req.user.collegeId, body.reason, body.requestedVacateAt));
}));
// ── Staff warden router ─────────────────────────────────────────────────
export const hostelRouter = Router();
hostelRouter.use(requireAuth);
hostelRouter.use(resolveHostelPortalContext);
hostelRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json(await dashboard.wardenDashboard(actor(req), hostelId));
}));
hostelRouter.get('/hostels', asyncHandler(async (req, res) => {
    const a = actor(req);
    assertHostelPermission(a, 'hostel.view');
    const hostelIds = await getWardenHostelIds(a);
    const hostels = (await listHostels(a.collegeId)).filter((h) => hostelIds.includes(Number(h.id)));
    res.json({ hostels });
}));
hostelRouter.get('/applications/pending', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ applications: await applications.listPendingApplications(actor(req), hostelId) });
}));
hostelRouter.post('/applications/:id/review', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        action: z.enum(['APPROVE', 'WAITLIST', 'REJECT']),
        reason: z.string().optional(),
    }), req.body);
    res.json(await applications.reviewApplication(actor(req), Number(req.params.id), body.action, body.reason));
}));
hostelRouter.get('/waitlist', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ waitlist: await dashboard.listWaitlist(actor(req), hostelId) });
}));
hostelRouter.get('/residents', asyncHandler(async (req, res) => {
    res.json(await dashboard.listResidents(actor(req), {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        hostelId: req.query.hostelId ? Number(req.query.hostelId) : undefined,
        blockId: req.query.blockId ? Number(req.query.blockId) : undefined,
        floorId: req.query.floorId ? Number(req.query.floorId) : undefined,
        roomId: req.query.roomId ? Number(req.query.roomId) : undefined,
        programme: typeof req.query.programme === 'string' ? req.query.programme : undefined,
        semester: typeof req.query.semester === 'string' ? req.query.semester : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
    }));
}));
hostelRouter.get('/residents/:id', asyncHandler(async (req, res) => {
    const profile = await dashboard.getResidentProfile(actor(req), Number(req.params.id));
    if (!profile)
        return res.status(404).json({ error: 'Resident not found' });
    res.json(profile);
}));
hostelRouter.post('/allocations', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        applicationId: z.number().optional(),
        residentId: z.number().optional(),
        studentId: z.number(),
        bedId: z.number(),
        reason: z.string().optional(),
    }), req.body);
    res.status(201).json(await allocations.allocateBed(actor(req), body));
}));
hostelRouter.post('/transfers', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        residentId: z.number(),
        newBedId: z.number(),
        transferType: z.string().optional(),
        reason: z.string().optional(),
    }), req.body);
    res.json(await allocations.transferBed(actor(req), body.residentId, body.newBedId, body.transferType ?? 'STUDENT_REQUEST', body.reason));
}));
hostelRouter.get('/rooms/occupancy', asyncHandler(async (req, res) => {
    const hostelId = Number(req.query.hostelId);
    res.json({ occupancy: await allocations.getRoomOccupancy(actor(req), hostelId) });
}));
hostelRouter.get('/capacity', asyncHandler(async (req, res) => {
    const a = actor(req);
    assertHostelPermission(a, 'hostel.view');
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    if (hostelId) {
        await assertWardenHostelAccess(a, hostelId);
        return res.json(await allocations.getHostelCapacity(a.collegeId, hostelId));
    }
    const hostelIds = await getWardenHostelIds(a);
    const capacities = await Promise.all(hostelIds.map((id) => allocations.getHostelCapacity(a.collegeId, id)));
    const capacity = capacities.reduce((acc, c) => ({
        totalBeds: acc.totalBeds + c.totalBeds,
        usableBeds: acc.usableBeds + c.usableBeds,
        occupiedBeds: acc.occupiedBeds + c.occupiedBeds,
        reservedBeds: acc.reservedBeds + c.reservedBeds,
        availableBeds: acc.availableBeds + c.availableBeds,
        maintenanceBeds: acc.maintenanceBeds + c.maintenanceBeds,
        blockedBeds: acc.blockedBeds + c.blockedBeds,
        occupancyPercent: 0,
    }), { totalBeds: 0, usableBeds: 0, occupiedBeds: 0, reservedBeds: 0, availableBeds: 0, maintenanceBeds: 0, blockedBeds: 0, occupancyPercent: 0 });
    capacity.occupancyPercent = capacity.usableBeds > 0 ? Math.round((capacity.occupiedBeds / capacity.usableBeds) * 100) : 0;
    res.json(capacity);
}));
hostelRouter.get('/reports/summary', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json(await dashboard.wardenReportSummary(actor(req), hostelId));
}));
hostelRouter.get('/reports/residents.csv', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    assertHostelPermission(actor(req), 'hostel.report.view');
    const result = await dashboard.listResidents(actor(req), { hostelId, pageSize: 100 });
    const rows = result.residents;
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
        ['USN', 'Student', 'Hostel', 'Room', 'Bed', 'Status'].map(quote).join(','),
        ...rows.map((row) => [row.usn, row.studentName, row.hostelName, row.roomNumber, row.bedCode, row.status].map(quote).join(',')),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hostel-residents.csv"');
    res.send(csv);
}));
hostelRouter.get('/outpasses', asyncHandler(async (req, res) => {
    assertHostelPermission(actor(req), 'hostel.outpass.approve');
    const status = typeof req.query.status === 'string' ? req.query.status : 'REQUESTED';
    const rows = await import('../../db/index.js').then(({ db }) => db('hostel_outpasses as o')
        .join('students as s', 's.id', 'o.student_id')
        .where({ 'o.college_id': actor(req).collegeId, 'o.status': status })
        .select('o.*', 's.usn', 's.name as student_name')
        .orderBy('o.created_at', 'desc')
        .limit(100));
    res.json({ outpasses: rows });
}));
hostelRouter.post('/outpasses/:id/review', asyncHandler(async (req, res) => {
    const body = validate(z.object({ action: z.enum(['APPROVE', 'REJECT']), reason: z.string().optional() }), req.body);
    res.json(await outpasses.approveOutpass(actor(req), Number(req.params.id), body.action, body.reason));
}));
hostelRouter.get('/leaves', asyncHandler(async (req, res) => {
    assertHostelPermission(actor(req), 'hostel.leave.approve');
    const { db } = await import('../../db/index.js');
    const rows = await db('hostel_leave_requests as l')
        .join('students as s', 's.id', 'l.student_id')
        .where({ 'l.college_id': actor(req).collegeId, 'l.status': 'SUBMITTED' })
        .select('l.*', 's.usn', 's.name as student_name')
        .orderBy('l.created_at', 'desc');
    res.json({ leaves: rows });
}));
hostelRouter.post('/leaves/:id/review', asyncHandler(async (req, res) => {
    const body = validate(z.object({ action: z.enum(['APPROVE', 'REJECT']), reason: z.string().optional() }), req.body);
    res.json(await leaves.approveLeave(actor(req), Number(req.params.id), body.action, body.reason));
}));
hostelRouter.get('/complaints', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({ complaints: await complaints.listHostelComplaints(actor(req), hostelId, status) });
}));
hostelRouter.patch('/complaints/:id', asyncHandler(async (req, res) => {
    const body = validate(z.object({ status: z.string(), resolutionNotes: z.string().optional() }), req.body);
    res.json(await complaints.updateComplaintStatus(actor(req), Number(req.params.id), body.status, body.resolutionNotes));
}));
hostelRouter.get('/vacating', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ vacating: await vacating.listVacatingRequests(actor(req), hostelId) });
}));
hostelRouter.patch('/vacating/:id/checklist', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        keysReturned: z.boolean().optional(),
        assetsVerified: z.boolean().optional(),
        damageChecked: z.boolean().optional(),
        messCleared: z.boolean().optional(),
        financeChecked: z.boolean().optional(),
    }), req.body);
    res.json(await vacating.updateVacatingChecklist(actor(req), Number(req.params.id), body));
}));
hostelRouter.post('/vacating/:id/complete', asyncHandler(async (req, res) => {
    res.json(await vacating.completeVacating(actor(req), Number(req.params.id)));
}));
hostelRouter.post('/damage', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        residentId: z.number(),
        roomId: z.number().optional(),
        assetId: z.number().optional(),
        description: z.string().min(1),
        estimatedAmount: z.number().optional(),
    }), req.body);
    res.status(201).json(await vacating.assessDamage(actor(req), body));
}));
hostelRouter.post('/damage/:id/charge', asyncHandler(async (req, res) => {
    const body = validate(z.object({ finalAmount: z.number().positive() }), req.body);
    res.json(await vacating.approveDamageCharge(actor(req), Number(req.params.id), body.finalAmount));
}));
// ── Gate router ─────────────────────────────────────────────────────────
export const hostelGateRouter = Router();
hostelGateRouter.use(requireAuth);
hostelGateRouter.use(resolveHostelPortalContext);
hostelGateRouter.use((req, _res, next) => {
    try {
        assertHostelPermission(actor(req), 'hostel.gate.manage');
        next();
    }
    catch (error) {
        next(error);
    }
});
hostelGateRouter.get('/residents/search', asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!q)
        return res.json({ residents: [] });
    res.json({ residents: await gate.searchResident(actor(req).collegeId, q) });
}));
hostelGateRouter.get('/outpass/verify/:token', asyncHandler(async (req, res) => {
    res.json(await gate.verifyOutpassByToken(actor(req), req.params.token));
}));
hostelGateRouter.post('/exit', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        residentId: z.number(),
        outpassId: z.number().optional(),
        leaveId: z.number().optional(),
        gate: z.string().optional(),
        source: z.string().optional(),
        remarks: z.string().optional(),
    }), req.body);
    res.json(await gate.recordGateExit(actor(req), body));
}));
hostelGateRouter.post('/entry', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        residentId: z.number(),
        outpassId: z.number().optional(),
        leaveId: z.number().optional(),
        gate: z.string().optional(),
        remarks: z.string().optional(),
    }), req.body);
    res.json(await gate.recordGateEntry(actor(req), body));
}));
hostelGateRouter.get('/outside', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ residents: await gate.listResidentsOutside(actor(req), hostelId) });
}));
hostelGateRouter.get('/overdue', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ residents: await gate.listOverdueReturns(actor(req), hostelId) });
}));
hostelGateRouter.get('/visitors/active', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ visitors: await visitors.listActiveVisitors(actor(req), hostelId) });
}));
hostelGateRouter.post('/visitors/:id/check-in', asyncHandler(async (req, res) => {
    res.json(await visitors.checkInVisitor(actor(req), Number(req.params.id)));
}));
hostelGateRouter.post('/visitors/:id/check-out', asyncHandler(async (req, res) => {
    res.json(await visitors.checkOutVisitor(actor(req), Number(req.params.id)));
}));
hostelGateRouter.post('/emergency-override', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        residentId: z.number(),
        movementType: z.enum(['EXIT', 'ENTRY']),
        reason: z.string().min(1),
        gate: z.string().optional(),
    }), req.body);
    res.json(await gate.emergencyOverride(actor(req), body.residentId, body.movementType, body.reason, body.gate));
}));
// ── Operations (mess) router ────────────────────────────────────────────
export const hostelOperationsRouter = Router();
hostelOperationsRouter.use(requireAuth);
hostelOperationsRouter.use(resolveHostelPortalContext);
hostelOperationsRouter.get('/dashboard', asyncHandler(async (req, res) => {
    assertHostelPermission(actor(req), 'hostel.mess.manage');
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    const menu = await mess.getMessMenu(actor(req).collegeId, hostelId);
    const plans = await mess.listMessPlans(actor(req), hostelId);
    res.json({ menu, plans });
}));
hostelOperationsRouter.get('/mess/plans', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ plans: await mess.listMessPlans(actor(req), hostelId) });
}));
hostelOperationsRouter.post('/mess/plans', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        name: z.string().min(1),
        planType: z.string(),
        monthlyAmount: z.number().optional(),
        hostelId: z.number().optional(),
    }), req.body);
    res.status(201).json(await mess.createMessPlan(actor(req), body));
}));
hostelOperationsRouter.get('/mess/menu', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    res.json(await mess.getMessMenu(actor(req).collegeId, hostelId, date));
}));
hostelOperationsRouter.get('/mess/menu/weekly', asyncHandler(async (req, res) => {
    const hostelId = req.query.hostelId ? Number(req.query.hostelId) : undefined;
    res.json({ weeks: await mess.getWeeklyMenu(actor(req).collegeId, hostelId) });
}));
// ── Management router ───────────────────────────────────────────────────
export const hostelManagementRouter = Router();
hostelManagementRouter.use(requireAuth);
hostelManagementRouter.use(resolveHostelPortalContext);
hostelManagementRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await dashboard.managementDashboard(actor(req)));
}));
hostelManagementRouter.get('/occupancy', asyncHandler(async (req, res) => {
    assertHostelPermission(actor(req), 'hostel.management.view');
    res.json(await allocations.getHostelCapacity(actor(req).collegeId));
}));
