import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { createTicketSchema, commentSchema, workLogSchema, assignSchema, prioritySchema, statusSchema, resolveSchema, partRequestSchema, partDecisionSchema, reopenSchema, confirmSchema, escalateSchema, vendorSchema, categorySchema, teamSchema, routingRuleSchema, preventivePlanSchema, preventivePlanUpdateSchema, preventiveGenerateSchema, MAINT_PERMISSIONS, PRIORITIES, STATUSES, SOURCE_MODULES, } from './types.js';
import { maintPermissionsForRole, isManager, hasMaintPermission } from './access.js';
import * as tickets from './tickets.js';
import * as config from './config.js';
import * as integrations from './integrations.js';
import * as preventive from './preventive.js';
import { managerDashboard, technicianDashboard } from './dashboard.js';
import { reports } from './reports.js';
function facultyActor(req) {
    return {
        kind: 'FACULTY', facultyUserId: req.user.facultyUserId, collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null, role: req.user.role, name: req.user.name,
    };
}
function studentActor(req) {
    return {
        kind: 'STUDENT', studentId: req.user.studentId, collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null, role: 'STUDENT', name: req.user.name,
    };
}
const num = (v) => {
    if (v === undefined || v === null || v === '')
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
// ═══════════════════════ FACULTY / STAFF ROUTER ═══════════════════════════
export const maintenanceRouter = Router();
maintenanceRouter.use(requireAuth);
maintenanceRouter.get('/meta', asyncHandler(async (req, res) => {
    const a = facultyActor(req);
    const categories = await config.listCategories(a, { activeOnly: true });
    res.json({
        role: a.role,
        permissions: maintPermissionsForRole(a.role),
        allPermissions: MAINT_PERMISSIONS,
        isManager: isManager(a),
        canWork: hasMaintPermission(a, 'maint.work'),
        priorities: PRIORITIES, statuses: STATUSES, sourceModules: SOURCE_MODULES,
        categories,
    });
}));
maintenanceRouter.get('/rooms', asyncHandler(async (req, res) => {
    const a = facultyActor(req);
    const rows = await db('rooms').where({ college_id: a.collegeId }).select('id', 'name', 'building', 'floor', 'type').orderBy('name');
    res.json(rows.map((r) => ({ id: Number(r.id), name: r.name, building: r.building, floor: r.floor, type: r.type })));
}));
maintenanceRouter.get('/source-options', asyncHandler(async (req, res) => {
    res.json(await integrations.sourceOptions(facultyActor(req), String(req.query.module ?? 'LAB')));
}));
// Dashboards
maintenanceRouter.get('/dashboard/manager', asyncHandler(async (req, res) => {
    res.json(await managerDashboard(facultyActor(req)));
}));
maintenanceRouter.get('/dashboard/technician', asyncHandler(async (req, res) => {
    res.json(await technicianDashboard(facultyActor(req)));
}));
maintenanceRouter.get('/reports', asyncHandler(async (req, res) => {
    res.json(await reports(facultyActor(req)));
}));
// Tickets
maintenanceRouter.get('/tickets', asyncHandler(async (req, res) => {
    res.json(await tickets.listTickets(facultyActor(req), {
        status: req.query.status, statusGroup: req.query.statusGroup, priority: req.query.priority,
        categoryId: num(req.query.categoryId), teamId: num(req.query.teamId), assignedTo: num(req.query.assignedTo),
        sourceModule: req.query.sourceModule, departmentId: num(req.query.departmentId), slaState: req.query.slaState,
        mine: req.query.mine === '1' || req.query.mine === 'true', q: req.query.q,
        page: num(req.query.page), pageSize: num(req.query.pageSize),
    }));
}));
maintenanceRouter.post('/tickets', asyncHandler(async (req, res) => {
    const body = validate(createTicketSchema, req.body);
    res.status(201).json(await tickets.createTicket(facultyActor(req), body));
}));
maintenanceRouter.get('/tickets/:id', asyncHandler(async (req, res) => {
    res.json(await tickets.getTicket(facultyActor(req), Number(req.params.id)));
}));
maintenanceRouter.post('/tickets/:id/assign', asyncHandler(async (req, res) => {
    res.json(await tickets.assignTicket(facultyActor(req), Number(req.params.id), validate(assignSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/acknowledge', asyncHandler(async (req, res) => {
    res.json(await tickets.acknowledgeTicket(facultyActor(req), Number(req.params.id)));
}));
maintenanceRouter.post('/tickets/:id/start', asyncHandler(async (req, res) => {
    res.json(await tickets.startWork(facultyActor(req), Number(req.params.id)));
}));
maintenanceRouter.post('/tickets/:id/status', asyncHandler(async (req, res) => {
    res.json(await tickets.setStatus(facultyActor(req), Number(req.params.id), validate(statusSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/priority', asyncHandler(async (req, res) => {
    res.json(await tickets.setPriority(facultyActor(req), Number(req.params.id), validate(prioritySchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/resolve', asyncHandler(async (req, res) => {
    res.json(await tickets.resolveTicket(facultyActor(req), Number(req.params.id), validate(resolveSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/confirm', asyncHandler(async (req, res) => {
    res.json(await tickets.confirmResolution(facultyActor(req), Number(req.params.id), validate(confirmSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/reopen', asyncHandler(async (req, res) => {
    res.json(await tickets.reopenTicket(facultyActor(req), Number(req.params.id), validate(reopenSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/comments', asyncHandler(async (req, res) => {
    res.status(201).json(await tickets.addComment(facultyActor(req), Number(req.params.id), validate(commentSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/work-logs', asyncHandler(async (req, res) => {
    res.status(201).json(await tickets.addWorkLog(facultyActor(req), Number(req.params.id), validate(workLogSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/parts', asyncHandler(async (req, res) => {
    res.status(201).json(await tickets.requestPart(facultyActor(req), Number(req.params.id), validate(partRequestSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/parts/:partId', asyncHandler(async (req, res) => {
    res.json(await tickets.decidePart(facultyActor(req), Number(req.params.id), Number(req.params.partId), validate(partDecisionSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/escalate', asyncHandler(async (req, res) => {
    res.json(await tickets.escalateTicket(facultyActor(req), Number(req.params.id), validate(escalateSchema, req.body)));
}));
maintenanceRouter.post('/tickets/:id/vendor', asyncHandler(async (req, res) => {
    res.json(await tickets.updateVendor(facultyActor(req), Number(req.params.id), validate(vendorSchema, req.body)));
}));
// Lab integration
maintenanceRouter.post('/integrations/lab-fault/:faultId', asyncHandler(async (req, res) => {
    res.status(201).json(await integrations.linkLabFault(facultyActor(req), Number(req.params.faultId), req.body ?? {}));
}));
// Config
maintenanceRouter.get('/config/categories', asyncHandler(async (req, res) => {
    res.json(await config.listCategories(facultyActor(req)));
}));
maintenanceRouter.post('/config/categories', asyncHandler(async (req, res) => {
    res.status(201).json(await config.createCategory(facultyActor(req), validate(categorySchema, req.body)));
}));
maintenanceRouter.patch('/config/categories/:id', asyncHandler(async (req, res) => {
    res.json(await config.updateCategory(facultyActor(req), Number(req.params.id), validate(categorySchema.partial(), req.body)));
}));
maintenanceRouter.get('/config/teams', asyncHandler(async (req, res) => {
    res.json(await config.listTeams(facultyActor(req)));
}));
maintenanceRouter.post('/config/teams', asyncHandler(async (req, res) => {
    res.status(201).json(await config.createTeam(facultyActor(req), validate(teamSchema, req.body)));
}));
maintenanceRouter.patch('/config/teams/:id', asyncHandler(async (req, res) => {
    res.json(await config.updateTeam(facultyActor(req), Number(req.params.id), validate(teamSchema.partial(), req.body)));
}));
maintenanceRouter.get('/config/routing-rules', asyncHandler(async (req, res) => {
    res.json(await config.listRoutingRules(facultyActor(req)));
}));
maintenanceRouter.post('/config/routing-rules', asyncHandler(async (req, res) => {
    res.status(201).json(await config.createRoutingRule(facultyActor(req), validate(routingRuleSchema, req.body)));
}));
maintenanceRouter.patch('/config/routing-rules/:id', asyncHandler(async (req, res) => {
    res.json(await config.updateRoutingRule(facultyActor(req), Number(req.params.id), validate(routingRuleSchema.partial(), req.body)));
}));
maintenanceRouter.delete('/config/routing-rules/:id', asyncHandler(async (req, res) => {
    res.json(await config.deleteRoutingRule(facultyActor(req), Number(req.params.id)));
}));
// Preventive maintenance
maintenanceRouter.get('/preventive/plans', asyncHandler(async (req, res) => {
    res.json(await preventive.listPlans(facultyActor(req), { status: req.query.status, assetId: num(req.query.assetId) }));
}));
maintenanceRouter.post('/preventive/plans', asyncHandler(async (req, res) => {
    res.status(201).json(await preventive.createPlan(facultyActor(req), validate(preventivePlanSchema, req.body)));
}));
maintenanceRouter.get('/preventive/plans/:id', asyncHandler(async (req, res) => {
    res.json(await preventive.getPlan(facultyActor(req), Number(req.params.id)));
}));
maintenanceRouter.patch('/preventive/plans/:id', asyncHandler(async (req, res) => {
    res.json(await preventive.updatePlan(facultyActor(req), Number(req.params.id), validate(preventivePlanUpdateSchema, req.body)));
}));
maintenanceRouter.get('/preventive/plans/:id/occurrences', asyncHandler(async (req, res) => {
    res.json(await preventive.listOccurrences(facultyActor(req), Number(req.params.id)));
}));
maintenanceRouter.post('/preventive/generate', asyncHandler(async (req, res) => {
    res.json(await preventive.generateDue(facultyActor(req), validate(preventiveGenerateSchema, req.body ?? {})));
}));
maintenanceRouter.post('/preventive/occurrences/:id/generate-ticket', asyncHandler(async (req, res) => {
    res.status(201).json(await preventive.retryOccurrenceTicket(facultyActor(req), Number(req.params.id)));
}));
// ═══════════════════════ STUDENT ROUTER ═══════════════════════════════════
export const studentMaintenanceRouter = Router();
studentMaintenanceRouter.use(requireStudentAuth);
studentMaintenanceRouter.get('/maintenance/meta', asyncHandler(async (req, res) => {
    const a = studentActor(req);
    const categories = await config.listCategories(a, { activeOnly: true });
    res.json({ role: 'STUDENT', priorities: PRIORITIES, sourceModules: ['GENERAL', 'CLASSROOM', 'HOSTEL', 'LIBRARY'], categories });
}));
studentMaintenanceRouter.get('/maintenance/rooms', asyncHandler(async (req, res) => {
    const a = studentActor(req);
    const rows = await db('rooms').where({ college_id: a.collegeId }).select('id', 'name', 'building', 'type').orderBy('name');
    res.json(rows.map((r) => ({ id: Number(r.id), name: r.name, building: r.building, type: r.type })));
}));
studentMaintenanceRouter.get('/maintenance/tickets', asyncHandler(async (req, res) => {
    res.json(await tickets.listTickets(studentActor(req), { statusGroup: req.query.statusGroup, page: num(req.query.page), pageSize: num(req.query.pageSize) }));
}));
studentMaintenanceRouter.post('/maintenance/tickets', asyncHandler(async (req, res) => {
    res.status(201).json(await tickets.createTicket(studentActor(req), validate(createTicketSchema, req.body)));
}));
studentMaintenanceRouter.get('/maintenance/tickets/:id', asyncHandler(async (req, res) => {
    res.json(await tickets.getTicket(studentActor(req), Number(req.params.id)));
}));
studentMaintenanceRouter.post('/maintenance/tickets/:id/comments', asyncHandler(async (req, res) => {
    res.status(201).json(await tickets.addComment(studentActor(req), Number(req.params.id), validate(commentSchema.omit({ visibility: true }), req.body)));
}));
studentMaintenanceRouter.post('/maintenance/tickets/:id/confirm', asyncHandler(async (req, res) => {
    res.json(await tickets.confirmResolution(studentActor(req), Number(req.params.id), validate(confirmSchema, req.body)));
}));
studentMaintenanceRouter.post('/maintenance/tickets/:id/reopen', asyncHandler(async (req, res) => {
    res.json(await tickets.reopenTicket(studentActor(req), Number(req.params.id), validate(reopenSchema, req.body)));
}));
