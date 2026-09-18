import { Router } from 'express';
import { asyncHandler, validate, AppError } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import type { LabActor } from './types.js';
import {
  labSchema, assignmentSchema, assetSchema, assetStatusSchema, stockItemSchema, stockMovementSchema,
  issueSchema, returnSchema, sessionReadinessSchema, faultSchema, faultStatusSchema, repairSchema,
  repairUpdateSchema, softwareSchema, softwareRequestSchema, softwareRequestReviewSchema,
  requirementSchema, requirementDecisionSchema, maintenanceSchema, maintenanceCompleteSchema,
  LAB_PERMISSIONS, ASSET_CATEGORIES, OPERATIONAL_STATUSES, CONDITIONS, MOVEMENT_TYPES,
} from './types.js';
import { labPermissionsForRole } from './access.js';
import * as labs from './labs.js';
import * as assets from './assets.js';
import * as stock from './stock.js';
import * as issues from './issues.js';
import * as sessions from './sessions.js';
import * as faults from './faults.js';
import * as repairs from './repairs.js';
import * as software from './software.js';
import * as requirements from './requirements.js';
import * as maintenance from './maintenance.js';
import { labAssistantDashboard } from './dashboard.js';
import { oversight } from './oversight.js';
import { runReport, REPORT_TYPES } from './reports.js';

function actor(req: AuthedRequest): LabActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const bool = (v: unknown) => v === '1' || v === 'true' || v === true;

export const labRouter = Router();
labRouter.use(requireAuth);

// ── Meta / capabilities ──────────────────────────────────────────────────
labRouter.get('/meta', asyncHandler(async (req: AuthedRequest, res) => {
  const a = actor(req);
  res.json({
    permissions: labPermissionsForRole(a.role),
    allPermissions: LAB_PERMISSIONS,
    categories: ASSET_CATEGORIES,
    operationalStatuses: OPERATIONAL_STATUSES,
    conditions: CONDITIONS,
    movementTypes: MOVEMENT_TYPES,
    reportTypes: REPORT_TYPES,
    role: a.role,
  });
}));

labRouter.get('/dashboard', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labAssistantDashboard(actor(req)));
}));

labRouter.get('/oversight', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await oversight(actor(req)));
}));

// ── Labs ─────────────────────────────────────────────────────────────────
labRouter.get('/labs', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labs.listLabs(actor(req), { status: req.query.status as string, departmentId: num(req.query.departmentId), q: req.query.q as string }));
}));
labRouter.get('/labs/rooms', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labs.listLabRooms(actor(req)));
}));
labRouter.post('/labs', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(labSchema, req.body);
  res.status(201).json(await labs.createLab(actor(req), body));
}));
labRouter.get('/labs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labs.getLab(actor(req), Number(req.params.id)));
}));
labRouter.patch('/labs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(labSchema.partial(), req.body);
  res.json(await labs.updateLab(actor(req), Number(req.params.id), body));
}));
labRouter.get('/labs/:id/assignments', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labs.listAssignments(actor(req), Number(req.params.id), bool(req.query.includeEnded)));
}));
labRouter.post('/labs/:id/assignments', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(assignmentSchema, req.body);
  res.status(201).json(await labs.assignLab(actor(req), Number(req.params.id), body));
}));
labRouter.delete('/assignments/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await labs.endAssignment(actor(req), Number(req.params.id)));
}));

// ── Assets ─────────────────────────────────────────────────────────────────
labRouter.get('/assets', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await assets.listAssets(actor(req), {
    labId: num(req.query.labId), category: req.query.category as string, status: req.query.status as string,
    condition: req.query.condition as string, assetClass: req.query.assetClass as string, q: req.query.q as string,
    page: num(req.query.page), pageSize: num(req.query.pageSize),
  }));
}));
labRouter.post('/assets', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(assetSchema, req.body);
  res.status(201).json(await assets.createAsset(actor(req), body));
}));
labRouter.get('/assets/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await assets.getAsset(actor(req), Number(req.params.id)));
}));
labRouter.patch('/assets/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(assetSchema.partial(), req.body);
  res.json(await assets.updateAsset(actor(req), Number(req.params.id), body));
}));
labRouter.post('/assets/:id/status', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(assetStatusSchema, req.body);
  res.json(await assets.changeAssetStatus(actor(req), Number(req.params.id), body));
}));

// ── Stock ─────────────────────────────────────────────────────────────────
labRouter.get('/stock', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await stock.listStock(actor(req), { labId: num(req.query.labId), lowOnly: bool(req.query.lowOnly), q: req.query.q as string, category: req.query.category as string }));
}));
labRouter.post('/stock', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(stockItemSchema, req.body);
  res.status(201).json(await stock.createStockItem(actor(req), body));
}));
labRouter.post('/stock/:id/movements', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(stockMovementSchema, req.body);
  res.status(201).json(await stock.recordMovement(actor(req), Number(req.params.id), body));
}));
labRouter.get('/stock/:id/ledger', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await stock.itemLedger(actor(req), Number(req.params.id)));
}));

// ── Issue / return ──────────────────────────────────────────────────────────
labRouter.get('/issues', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await issues.listIssues(actor(req), { labId: num(req.query.labId), status: req.query.status as string, overdueOnly: bool(req.query.overdueOnly), recipientType: req.query.recipientType as string }));
}));
labRouter.post('/issues', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(issueSchema, req.body);
  res.status(201).json(await issues.createIssue(actor(req), body));
}));
labRouter.post('/issues/:id/return', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(returnSchema, req.body);
  res.json(await issues.returnIssue(actor(req), Number(req.params.id), body));
}));

// ── Sessions / readiness ────────────────────────────────────────────────────
labRouter.get('/sessions/upcoming', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.upcomingSessions(actor(req), num(req.query.days) ?? 7));
}));
labRouter.post('/sessions/prepare', asyncHandler(async (req: AuthedRequest, res) => {
  const slotId = num(req.body?.slotId); const sessionDate = req.body?.sessionDate;
  if (!slotId || !sessionDate) throw new AppError(400, 'slotId and sessionDate are required');
  res.status(201).json(await sessions.prepareSession(actor(req), { slotId, sessionDate }));
}));
labRouter.get('/sessions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await sessions.getSession(actor(req), Number(req.params.id)));
}));
labRouter.patch('/sessions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(sessionReadinessSchema, req.body);
  res.json(await sessions.updateReadiness(actor(req), Number(req.params.id), body));
}));

// ── Faults ─────────────────────────────────────────────────────────────────
labRouter.get('/faults', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await faults.listFaults(actor(req), { labId: num(req.query.labId), status: req.query.status as string, severity: req.query.severity as string, assetId: num(req.query.assetId) }));
}));
labRouter.post('/faults', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(faultSchema, req.body);
  res.status(201).json(await faults.createFault(actor(req), body));
}));
labRouter.patch('/faults/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(faultStatusSchema, req.body);
  res.json(await faults.updateFaultStatus(actor(req), Number(req.params.id), body));
}));

// ── Repairs ─────────────────────────────────────────────────────────────────
labRouter.get('/repairs', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await repairs.listRepairs(actor(req), { labId: num(req.query.labId), status: req.query.status as string, approvalStatus: req.query.approvalStatus as string }));
}));
labRouter.post('/repairs', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(repairSchema, req.body);
  res.status(201).json(await repairs.createRepair(actor(req), body));
}));
labRouter.patch('/repairs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(repairUpdateSchema, req.body);
  res.json(await repairs.updateRepair(actor(req), Number(req.params.id), body));
}));

// ── Software ─────────────────────────────────────────────────────────────────
labRouter.get('/software', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await software.listSoftware(actor(req), { labId: num(req.query.labId), q: req.query.q as string }));
}));
labRouter.post('/software', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(softwareSchema, req.body);
  res.status(201).json(await software.createSoftware(actor(req), body));
}));
labRouter.patch('/software/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(softwareSchema.partial(), req.body);
  res.json(await software.updateSoftware(actor(req), Number(req.params.id), body));
}));
labRouter.get('/software-requests', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await software.listSoftwareRequests(actor(req), { labId: num(req.query.labId), status: req.query.status as string }));
}));
labRouter.post('/software-requests', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(softwareRequestSchema, req.body);
  res.status(201).json(await software.createSoftwareRequest(actor(req), body));
}));
labRouter.patch('/software-requests/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(softwareRequestReviewSchema, req.body);
  res.json(await software.reviewSoftwareRequest(actor(req), Number(req.params.id), body));
}));

// ── Requirements ──────────────────────────────────────────────────────────
labRouter.get('/requirements', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await requirements.listRequirements(actor(req), { labId: num(req.query.labId), status: req.query.status as string, departmentId: num(req.query.departmentId) }));
}));
labRouter.post('/requirements', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(requirementSchema, req.body);
  res.status(201).json(await requirements.createRequirement(actor(req), body));
}));
labRouter.post('/requirements/:id/decision', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(requirementDecisionSchema, req.body);
  res.json(await requirements.decideRequirement(actor(req), Number(req.params.id), body));
}));

// ── Preventive maintenance ──────────────────────────────────────────────────
labRouter.get('/maintenance', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await maintenance.listMaintenance(actor(req), { labId: num(req.query.labId), status: req.query.status as string }));
}));
labRouter.post('/maintenance', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(maintenanceSchema, req.body);
  res.status(201).json(await maintenance.createMaintenance(actor(req), body));
}));
labRouter.post('/maintenance/:id/complete', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(maintenanceCompleteSchema, req.body);
  res.json(await maintenance.completeMaintenance(actor(req), Number(req.params.id), body));
}));

// ── Reports ─────────────────────────────────────────────────────────────────
labRouter.get('/reports/:type', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await runReport(actor(req), req.params.type, { labId: num(req.query.labId) }));
}));

// ── Student router — limited practical/issue visibility ──────────────────────
export const studentLabRouter = Router();
studentLabRouter.use(requireStudentAuth);

studentLabRouter.get('/lab/issues', asyncHandler(async (req: StudentAuthedRequest, res) => {
  const rows = await db('lab_issues as i')
    .leftJoin('labs as l', 'l.id', 'i.lab_id')
    .leftJoin('lab_assets as a', 'a.id', 'i.asset_id')
    .where('i.college_id', req.user!.collegeId)
    .where('i.recipient_student_id', req.user!.studentId)
    .select('i.id', 'l.name as lab_name', 'a.asset_tag', 'i.description', 'i.issue_date', 'i.expected_return', 'i.actual_return', 'i.status')
    .orderBy('i.issue_date', 'desc');
  res.json(rows.map((r) => ({
    id: Number(r.id), labName: r.lab_name, assetTag: r.asset_tag, description: r.description,
    issueDate: r.issue_date, expectedReturn: r.expected_return, actualReturn: r.actual_return, status: r.status,
  })));
}));
