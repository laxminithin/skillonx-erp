import { Router } from 'express';
import { AppError, asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { leaveRequestSchema, coverageRequestSchema, classSwapSchema, rescheduleSchema, hodArrangementSchema, managerSubstituteSchema, authorizedCancelSchema, createEmployeeSchema, updateEmployeeSchema, joinEmployeeSchema, linkUserSchema, promotionSchema, transferSchema, reportingChangeSchema, designationChangeSchema, contractSchema, resignationSchema, separationInitiateSchema, clearanceUpdateSchema, probationRecommendSchema, probationConfirmSchema, probationExtendSchema, personalProfileSchema, emergencyContactSchema, emergencyContactUpdateSchema, regularizationSchema, attendanceOverrideSchema, attendanceSettingsSchema, shiftSchema, holidaySchema, monthReopenSchema, punchImportSchema } from './types.js';
import * as lifecycleEmployee from './lifecycleEmployee.js';
import * as lifecycleCareer from './lifecycleCareer.js';
import * as lifecycleSeparation from './lifecycleSeparation.js';
import { runHrLifecycleJobs, hrReports } from './lifecycleJobs.js';
import * as employees from './employees.js';
import * as leave from './leave.js';
import * as leaveCoverage from './leaveCoverage.js';
import * as attendance from './attendance.js';
import * as attendanceConfig from './attendanceConfig.js';
import * as attendanceRegularization from './attendanceRegularization.js';
import * as attendanceClosure from './attendanceClosure.js';
import * as attendancePunches from './attendancePunches.js';
import * as attendancePayrollHandoff from './attendancePayrollHandoff.js';
import * as payroll from './payroll.js';
import * as salaryStructures from './salaryStructures.js';
import * as payrollAdjustments from './payrollAdjustments.js';
import * as payrollReports from './payrollReports.js';
import * as fnf from './fnf.js';
import * as fnfClearance from './fnfClearance.js';
import * as fnfDocuments from './fnfDocuments.js';
import * as fnfReports from './fnfReports.js';
import * as fnfPolicy from './fnfPolicy.js';
import {
  createFnfCaseSchema,
  clearanceDecisionSchema,
  noticeWaiverSchema,
  fnfAdjustmentSchema,
  fnfRejectSchema,
  fnfReopenSchema,
  fnfHoldSchema,
  fnfAssetItemSchema,
} from './fnfTypes.js';
import * as appraisal from './appraisal.js';
import * as appraisalReports from './appraisalReports.js';
import {
  createCycleSchema,
  updateCycleStatusSchema,
  createTemplateSchema,
  createGoalSchema,
  updateGoalSchema,
  goalDecisionSchema,
  selfAppraisalSchema,
  reviewAppraisalSchema,
  calibrateSchema,
  reopenSchema,
  developmentPlanSchema,
  pipSchema,
  enrollEmployeesSchema,
} from './appraisalTypes.js';
import * as recruitmentRequisitions from './recruitmentRequisitions.js';
import * as recruitmentOpenings from './recruitmentOpenings.js';
import * as recruitmentCandidates from './recruitmentCandidates.js';
import * as recruitmentApplications from './recruitmentApplications.js';
import * as recruitmentScreening from './recruitmentScreening.js';
import * as recruitmentInterviews from './recruitmentInterviews.js';
import * as recruitmentOffers from './recruitmentOffers.js';
import * as recruitmentPreJoining from './recruitmentPreJoining.js';
import * as recruitmentJoining from './recruitmentJoining.js';
import * as recruitmentDocuments from './recruitmentDocuments.js';
import * as recruitmentReports from './recruitmentReports.js';
import {
  createRequisitionSchema,
  updateRequisitionSchema,
  requisitionDecisionSchema,
  createOpeningSchema,
  updateOpeningSchema,
  createCandidateSchema,
  screenApplicationSchema,
  shortlistSchema,
  selectCandidateSchema,
  scheduleInterviewSchema,
  evaluateInterviewSchema,
  createOfferSchema,
  offerDecisionSchema,
  updatePrejoiningTaskSchema,
  completeJoiningSchema,
  uploadDocumentSchema,
} from './recruitmentTypes.js';
import * as management from './management.js';
import * as analytics from './analytics.js';
import type { AnalyticsFilters } from './analytics.js';
import { ldRouter } from './ld/controller.js';
import { successionRouter } from './succession/controller.js';
import * as notifications from './notifications.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { backfillFacultyToEmployees } from './employees.js';
import { enrichHrActor } from '../academicLeadership/leadership.js';
import { ensurePayrollFinanceDefaults } from '../finance/payrollPosting.js';

function actor(req: AuthedRequest): HrActor {
  const attached = (req as AuthedRequest & { hrActor?: HrActor }).hrActor;
  if (attached) return attached;
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

async function attachHrLeadership(req: AuthedRequest, _res: unknown, next: (err?: unknown) => void) {
  try {
    (req as AuthedRequest & { hrActor?: HrActor }).hrActor = await enrichHrActor(actor(req));
    next();
  } catch (err) {
    next(err);
  }
}

// ── Employee self-service ───────────────────────────────────────────────────
export const hrSelfRouter = Router();
hrSelfRouter.use(requireAuth);

hrSelfRouter.get(
  '/profile',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await employees.getEmployeeProfile(actor(req)));
  }),
);

hrSelfRouter.get(
  '/attendance',
  asyncHandler(async (req: AuthedRequest, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    res.json(await attendance.getMyAttendance(actor(req), from, to));
  }),
);

hrSelfRouter.get(
  '/attendance/summary',
  asyncHandler(async (req: AuthedRequest, res) => {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    res.json(await attendance.getMyAttendanceSummary(actor(req), year, month));
  }),
);

hrSelfRouter.post(
  '/attendance/regularizations',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(regularizationSchema, req.body);
    res.status(201).json(await attendanceRegularization.submitRegularization(actor(req), body));
  }),
);

hrSelfRouter.get(
  '/attendance/regularizations',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceRegularization.listMyRegularizations(actor(req)));
  }),
);

hrSelfRouter.get(
  '/attendance/:date',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendance.getMyAttendanceForDate(actor(req), req.params.date));
  }),
);

hrSelfRouter.get(
  '/leave/types',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listLeaveTypes(req.user!.collegeId));
  }),
);

hrSelfRouter.get(
  '/leave/balances',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.getLeaveBalances(actor(req)));
  }),
);

hrSelfRouter.get(
  '/leave/requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listMyLeaveRequests(actor(req)));
  }),
);

hrSelfRouter.post(
  '/leave/requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(leaveRequestSchema, req.body);
    res.status(201).json(await leave.createLeaveRequest(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/requests/:id/submit',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.submitLeaveRequest(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.post(
  '/leave/requests/:id/cancel',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.cancelLeaveRequest(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/leave/requests/:id/academic-impact',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.getLeaveAcademicImpactForRequest(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/leave/requests/:id/coverage',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leaveCoverage.getCoverageForLeaveRequest(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/leave/requests/:id/coverage-summary',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leaveCoverage.getLeaveCoverageSummary(Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/leave/coverage/:id/eligible-substitutes',
  asyncHandler(async (req: AuthedRequest, res) => {
    const search = req.query.search as string | undefined;
    res.json(await leaveCoverage.listEligibleSubstitutes(actor(req), Number(req.params.id), search));
  }),
);

hrSelfRouter.get(
  '/leave/coverage/:id/swap-sessions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const swapEmployeeId = Number(req.query.swapEmployeeId);
    if (!swapEmployeeId) throw new AppError(400, 'swapEmployeeId is required');
    res.json(await leaveCoverage.listSwapCompatibleSessions(actor(req), Number(req.params.id), swapEmployeeId));
  }),
);

hrSelfRouter.post(
  '/leave/coverage/:id/substitute',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(coverageRequestSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leave.requestSubstituteCoverage(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/coverage/:id/swap',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(classSwapSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leaveCoverage.proposeClassSwap(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/coverage/:id/reschedule',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(rescheduleSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leaveCoverage.proposeReschedule(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/coverage/:id/reschedule/check',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(rescheduleSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leaveCoverage.checkRescheduleAvailability(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/coverage/:id/request-hod',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(hodArrangementSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leaveCoverage.requestHodArrangement(actor(req), Number(req.params.id), body.reason));
  }),
);

hrSelfRouter.get(
  '/leave/coverage-requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listCoverageRequestsForActor(actor(req)));
  }),
);

hrSelfRouter.post(
  '/leave/coverage-requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(coverageRequestSchema, req.body);
    res.json(await leave.requestSubstituteCoverage(actor(req), body));
  }),
);

hrSelfRouter.post(
  '/leave/coverage-requests/:id/accept',
  asyncHandler(async (req: AuthedRequest, res) => {
    const covReq = await leave.getCoverageRequestType(Number(req.params.id));
    if (covReq === 'CLASS_SWAP') {
      res.json(await leaveCoverage.respondToSwapRequest(actor(req), Number(req.params.id), true));
    } else {
      res.json(await leave.respondToCoverageRequest(actor(req), Number(req.params.id), true));
    }
  }),
);

hrSelfRouter.post(
  '/leave/coverage-requests/:id/decline',
  asyncHandler(async (req: AuthedRequest, res) => {
    const covReq = await leave.getCoverageRequestType(Number(req.params.id));
    if (covReq === 'CLASS_SWAP') {
      res.json(await leaveCoverage.respondToSwapRequest(actor(req), Number(req.params.id), false));
    } else {
      res.json(await leave.respondToCoverageRequest(actor(req), Number(req.params.id), false));
    }
  }),
);

hrSelfRouter.get(
  '/payslips',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.listPayslips(actor(req)));
  }),
);

hrSelfRouter.get(
  '/payslips/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.getPayslip(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/service-history',
  asyncHandler(async (req: AuthedRequest, res) => {
    const emp = await employees.getEmployeeProfile(actor(req));
    res.json(await employees.getEmployeeServiceHistory(actor(req), emp.id));
  }),
);

hrSelfRouter.get(
  '/notifications',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await notifications.listEmployeeNotifications(actor(req)));
  }),
);

hrSelfRouter.get(
  '/documents',
  asyncHandler(async (req: AuthedRequest, res) => {
    const emp = await employees.getEmployeeProfile(actor(req));
    const docs = await db('employee_documents').where({ employee_id: emp.id }).orderBy('created_at', 'desc');
    res.json(docs);
  }),
);

hrSelfRouter.get(
  '/requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    const emp = await employees.getEmployeeProfile(actor(req));
    const rows = await db('hr_employee_requests').where({ employee_id: emp.id }).orderBy('created_at', 'desc');
    res.json(rows);
  }),
);

hrSelfRouter.post(
  '/resignation',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(resignationSchema, req.body);
    res.status(201).json(await lifecycleSeparation.submitResignation(actor(req), body));
  }),
);

hrSelfRouter.get(
  '/resignation',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.getMyResignation(actor(req)));
  }),
);

hrSelfRouter.post(
  '/resignation/:id/withdraw',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.withdrawResignation(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.get(
  '/fnf',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.getMySettlement(actor(req)));
  }),
);

hrSelfRouter.get(
  '/fnf/documents/:docType',
  asyncHandler(async (req: AuthedRequest, res) => {
    const mine = await fnf.getMySettlement(actor(req));
    if (!mine) throw new AppError(404, 'Settlement not found');
    res.json(await fnfDocuments.getDocument(actor(req), mine.id, String(req.params.docType)));
  }),
);

hrSelfRouter.get(
  '/performance',
  asyncHandler(async (req: AuthedRequest, res) => {
    const dash = await appraisal.employeeDashboard(actor(req));
    const list = await appraisal.getMyAppraisals(actor(req));
    res.json({ ...dash, items: list });
  }),
);

hrSelfRouter.get(
  '/performance/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getAppraisalDetail(actor(req), Number(req.params.id), 'employee'));
  }),
);

hrSelfRouter.post(
  '/performance/:id/goals',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createGoalSchema, req.body);
    res.status(201).json(await appraisal.createGoal(actor(req), Number(req.params.id), body));
  }),
);

hrSelfRouter.patch(
  '/performance/:id/goals/:goalId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(updateGoalSchema, req.body);
    res.json(await appraisal.updateGoal(actor(req), Number(req.params.goalId), body));
  }),
);

hrSelfRouter.post(
  '/performance/:id/goals/submit',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.submitGoals(actor(req), Number(req.params.id)));
  }),
);

hrSelfRouter.post(
  '/performance/:id/self',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(selfAppraisalSchema, req.body);
    res.json(await appraisal.saveSelfAppraisal(actor(req), Number(req.params.id), body));
  }),
);

hrSelfRouter.get(
  '/performance/:id/development',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getDevelopmentPlan(actor(req), Number(req.params.id)));
  }),
);

// ── Manager panel ───────────────────────────────────────────────────────────
export const hrManagerRouter = Router();
hrManagerRouter.use(requireAuth);
hrManagerRouter.use(attachHrLeadership);

hrManagerRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const pending = await leave.listPendingLeaveForManager(actor(req));
    const today = new Date().toISOString().slice(0, 10);
    const teamAttendance = await attendance.listTeamAttendance(actor(req), today);
    const unresolved = await leave.listUnresolvedCoverage(actor(req));
    const pendingRegularizations = await attendanceRegularization.listPendingRegularizations(actor(req));
    res.json({ pendingLeave: pending, teamAttendance, unresolvedCoverage: unresolved, pendingRegularizations });
  }),
);

hrManagerRouter.get(
  '/attendance/team',
  asyncHandler(async (req: AuthedRequest, res) => {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
    res.json(await attendance.listTeamAttendance(actor(req), date));
  }),
);

hrManagerRouter.get(
  '/attendance/regularizations',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceRegularization.listPendingRegularizations(actor(req)));
  }),
);

hrManagerRouter.post(
  '/attendance/regularizations/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceRegularization.approveRegularization(actor(req), Number(req.params.id), req.body?.remarks));
  }),
);

hrManagerRouter.post(
  '/attendance/regularizations/:id/reject',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceRegularization.rejectRegularization(actor(req), Number(req.params.id), req.body?.remarks));
  }),
);

hrManagerRouter.get(
  '/leave/pending',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listPendingLeaveForManager(actor(req)));
  }),
);

hrManagerRouter.get(
  '/leave/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.getLeaveRequestDetail(actor(req), Number(req.params.id)));
  }),
);

hrManagerRouter.post(
  '/leave/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.approveLeaveRequest(actor(req), Number(req.params.id), req.body?.notes));
  }),
);

hrManagerRouter.post(
  '/leave/:id/reject',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.rejectLeaveRequest(actor(req), Number(req.params.id), req.body?.notes));
  }),
);

hrManagerRouter.get(
  '/coverage',
  asyncHandler(async (req: AuthedRequest, res) => {
    const filter = req.query.filter as 'attention' | 'today' | 'upcoming' | 'resolved' | undefined;
    res.json(await leaveCoverage.listManagerCoverage(actor(req), filter));
  }),
);

hrManagerRouter.get(
  '/coverage/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leaveCoverage.getManagerCoverageDetail(actor(req), Number(req.params.id)));
  }),
);

hrManagerRouter.get(
  '/coverage/:id/eligible-substitutes',
  asyncHandler(async (req: AuthedRequest, res) => {
    const search = req.query.search as string | undefined;
    res.json(
      await leaveCoverage.listEligibleSubstitutes(actor(req), Number(req.params.id), search, { managerMode: true }),
    );
  }),
);

hrManagerRouter.post(
  '/coverage/:id/assign-substitute',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(managerSubstituteSchema, req.body);
    res.json(await leaveCoverage.managerAssignSubstitute(actor(req), Number(req.params.id), body.substituteEmployeeId, body));
  }),
);

hrManagerRouter.post(
  '/coverage/:id/reschedule',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(rescheduleSchema, { ...req.body, coverageId: Number(req.params.id) });
    res.json(await leaveCoverage.managerReschedule(actor(req), Number(req.params.id), body));
  }),
);

hrManagerRouter.post(
  '/coverage/:id/verify',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leaveCoverage.managerVerifyCoverage(actor(req), Number(req.params.id), req.body?.notes));
  }),
);

hrManagerRouter.post(
  '/coverage/:id/authorized-cancel',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(authorizedCancelSchema, req.body);
    res.json(await leaveCoverage.managerAuthorizedCancel(actor(req), Number(req.params.id), body.reason));
  }),
);

hrManagerRouter.post(
  '/coverage/:id/team-teaching',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leaveCoverage.managerMarkTeamTeaching(actor(req), Number(req.params.id), req.body?.notes));
  }),
);

hrManagerRouter.get(
  '/coverage/unresolved',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listUnresolvedCoverage(actor(req)));
  }),
);

hrManagerRouter.get(
  '/probation',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.listProbation(actor(req), 'manager'));
  }),
);

hrManagerRouter.post(
  '/probation/:id/recommend',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(probationRecommendSchema, req.body);
    res.json(await lifecycleCareer.recommendProbation(actor(req), Number(req.params.id), body));
  }),
);

hrManagerRouter.get(
  '/separations',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.listSeparations(actor(req), 'manager'));
  }),
);

hrManagerRouter.post(
  '/separations/:id/recommend',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await lifecycleSeparation.managerRecommendSeparation(actor(req), Number(req.params.id), req.body),
    );
  }),
);

hrManagerRouter.get(
  '/team',
  asyncHandler(async (req: AuthedRequest, res) => {
    const self = await db('employees').where({ faculty_user_id: req.user!.facultyUserId }).first();
    if (!self) return res.json([]);
    const team = await db('employees as e')
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
      .where({ 'e.reporting_manager_employee_id': self.id, 'e.college_id': actor(req).collegeId })
      .select('e.id', 'e.display_name', 'e.employee_number', 'e.employment_status', 'd.name as department_name', 'des.name as designation_name');
    res.json(team);
  }),
);

// ── HR Admin panel ──────────────────────────────────────────────────────────
export const hrAdminRouter = Router();
hrAdminRouter.use(requireAuth);

hrAdminRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await employees.hrAdminDashboard(actor(req)));
  }),
);

hrAdminRouter.get(
  '/employees',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await employees.listEmployees(actor(req), {
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
        designationId: req.query.designationId ? Number(req.query.designationId) : undefined,
        employmentTypeId: req.query.employmentTypeId ? Number(req.query.employmentTypeId) : undefined,
        status: req.query.status as string | undefined,
        employeeCategory: req.query.employeeCategory as string | undefined,
        search: req.query.search as string | undefined,
        reportingManagerEmployeeId: req.query.reportingManagerEmployeeId ? Number(req.query.reportingManagerEmployeeId) : undefined,
        probation: req.query.probation === 'true',
        contractExpiring: req.query.contractExpiring === 'true',
        onNotice: req.query.onNotice === 'true',
        joiningFrom: req.query.joiningFrom as string | undefined,
        joiningTo: req.query.joiningTo as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortDir: req.query.sortDir as 'asc' | 'desc' | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      }),
    );
  }),
);

hrAdminRouter.post(
  '/employees',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createEmployeeSchema, req.body);
    res.status(201).json(await lifecycleEmployee.createEmployee(actor(req), body));
  }),
);

hrAdminRouter.patch(
  '/employees/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(updateEmployeeSchema, req.body);
    res.json(await lifecycleEmployee.updateEmployee(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/employees/:id/personal-profile',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.getPersonalProfile(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.put(
  '/employees/:id/personal-profile',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(personalProfileSchema, req.body);
    res.json(await lifecycleEmployee.upsertPersonalProfile(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/employees/:id/emergency-contacts',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.listEmergencyContacts(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/employees/:id/emergency-contacts',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(emergencyContactSchema, req.body);
    res.status(201).json(await lifecycleEmployee.createEmergencyContact(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.patch(
  '/employees/:id/emergency-contacts/:contactId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(emergencyContactUpdateSchema, req.body);
    res.json(await lifecycleEmployee.updateEmergencyContact(actor(req), Number(req.params.id), Number(req.params.contactId), body));
  }),
);

hrAdminRouter.delete(
  '/employees/:id/emergency-contacts/:contactId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.deleteEmergencyContact(actor(req), Number(req.params.id), Number(req.params.contactId)));
  }),
);

hrAdminRouter.get(
  '/employees/:id/360',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.getEmployee360(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/employees/:id/link-user',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(linkUserSchema, req.body);
    res.json(await lifecycleEmployee.linkEmployeeUser(actor(req), Number(req.params.id), body.facultyUserId));
  }),
);

hrAdminRouter.post(
  '/employees/:id/join',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(joinEmployeeSchema, req.body ?? {});
    res.json(await lifecycleEmployee.markEmployeeJoined(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/employees/:id/service-history',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await employees.getEmployeeServiceHistory(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.get(
  '/employees/:id/operational-assignments',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await employees.getOperationalAssignments(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.get(
  '/employees/:id/career-actions',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.listCareerActions(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/employees/:id/promotions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(promotionSchema, req.body);
    res.status(201).json(await lifecycleCareer.promoteEmployee(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.post(
  '/employees/:id/transfers',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(transferSchema, req.body);
    res.status(201).json(await lifecycleCareer.transferEmployee(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.post(
  '/employees/:id/designation-change',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(designationChangeSchema, req.body);
    res.json(await lifecycleCareer.changeDesignation(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.post(
  '/employees/:id/reporting-change',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(reportingChangeSchema, req.body);
    res.json(await lifecycleCareer.changeReportingManager(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/employees/:id/contracts',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.listContracts(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/employees/:id/contracts',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(contractSchema, req.body);
    res.status(201).json(await lifecycleCareer.createContract(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.post(
  '/employees/:id/suspend',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.suspendEmployee(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.post(
  '/employees/:id/reinstate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.reinstateEmployee(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.post(
  '/contracts/:id/renew',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.renewContract(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.post(
  '/contracts/:id/terminate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.terminateContract(actor(req), Number(req.params.id), req.body.reason ?? 'Terminated'));
  }),
);

hrAdminRouter.get(
  '/onboarding',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.listOnboarding(actor(req)));
  }),
);

hrAdminRouter.get(
  '/onboarding/:employeeId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.getOnboarding(actor(req), Number(req.params.employeeId)));
  }),
);

hrAdminRouter.post(
  '/onboarding/:employeeId/tasks/:taskId/complete',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.completeOnboardingTask(actor(req), Number(req.params.employeeId), Number(req.params.taskId)));
  }),
);

hrAdminRouter.post(
  '/onboarding/:employeeId/tasks/:taskId/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleEmployee.reopenOnboardingTask(actor(req), Number(req.params.employeeId), Number(req.params.taskId), req.body?.reason));
  }),
);

hrAdminRouter.get(
  '/probation',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleCareer.listProbation(actor(req), 'admin'));
  }),
);

hrAdminRouter.post(
  '/probation/:id/confirm',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(probationConfirmSchema, req.body ?? {});
    res.json(await lifecycleCareer.confirmEmployee(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.post(
  '/probation/:id/extend',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(probationExtendSchema, req.body);
    res.json(await lifecycleCareer.extendProbation(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/separations',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.listSeparations(actor(req), 'admin'));
  }),
);

hrAdminRouter.get(
  '/separations/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.getSeparation(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/separations/initiate/:employeeId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(separationInitiateSchema, req.body);
    res.status(201).json(await lifecycleSeparation.hrInitiateSeparation(actor(req), Number(req.params.employeeId), body));
  }),
);

hrAdminRouter.post(
  '/separations/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.approveSeparation(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.post(
  '/separations/:id/reject',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.rejectSeparation(actor(req), Number(req.params.id), req.body.reason ?? 'Rejected'));
  }),
);

hrAdminRouter.post(
  '/separations/:id/clearance/:domain',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(clearanceUpdateSchema, req.body);
    res.json(await lifecycleSeparation.updateClearance(actor(req), Number(req.params.id), req.params.domain, body));
  }),
);

hrAdminRouter.post(
  '/separations/:id/complete',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await lifecycleSeparation.completeSeparation(actor(req), Number(req.params.id)));
  }),
);

hrAdminRouter.post(
  '/lifecycle-jobs/run',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await runHrLifecycleJobs(actor(req).collegeId));
  }),
);

hrAdminRouter.get(
  '/reports/:type',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await hrReports(actor(req), req.params.type));
  }),
);

hrAdminRouter.get(
  '/employees/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const emp = await employees.getEmployee(actor(req), Number(req.params.id));
    const history = await employees.getEmployeeServiceHistory(actor(req), Number(req.params.id));
    const ops = await employees.getOperationalAssignments(actor(req), Number(req.params.id));
    res.json({ ...emp, serviceHistory: history, operationalAssignments: ops });
  }),
);

hrAdminRouter.post(
  '/backfill-faculty',
  asyncHandler(async (req: AuthedRequest, res) => {
    await ensureCollegeHrmsDefaults(req.user!.collegeId);
    res.json(await backfillFacultyToEmployees(req.user!.collegeId));
  }),
);

hrAdminRouter.get(
  '/leave-requests',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await leave.listPendingLeaveForManager(actor(req)));
  }),
);

hrAdminRouter.get(
  '/attendance',
  asyncHandler(async (req: AuthedRequest, res) => {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
    res.json(await attendance.listTeamAttendance(actor(req), date));
  }),
);

hrAdminRouter.get(
  '/attendance/register',
  asyncHandler(async (req: AuthedRequest, res) => {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    res.json(await attendance.listAdminAttendanceRegister(actor(req), year, month, { departmentId, employeeId }));
  }),
);

hrAdminRouter.get(
  '/attendance/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendance.getAttendanceDashboardStats(actor(req)));
  }),
);

hrAdminRouter.get(
  '/attendance/employees/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const year = Number(req.query.year ?? new Date().getFullYear());
    const month = Number(req.query.month ?? new Date().getMonth() + 1);
    res.json(await attendance.getEmployeeAttendanceAdmin(actor(req), Number(req.params.id), year, month));
  }),
);

hrAdminRouter.post(
  '/attendance/recalculate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { employeeId, fromDate, toDate } = req.body;
    if (!fromDate || !toDate) throw new AppError(400, 'fromDate and toDate are required');
    res.json(await attendance.recalculateAttendance(actor(req), { employeeId, fromDate, toDate }));
  }),
);

hrAdminRouter.patch(
  '/attendance/:id/override',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(attendanceOverrideSchema, req.body);
    res.json(await attendance.overrideAttendance(actor(req), Number(req.params.id), body));
  }),
);

hrAdminRouter.get(
  '/attendance/months/:year/:month',
  asyncHandler(async (req: AuthedRequest, res) => {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const closure = await attendanceClosure.getMonthClosure(actor(req), year, month);
    const exceptions = await attendance.getAttendanceExceptions(actor(req), year, month);
    res.json({ closure, exceptions });
  }),
);

hrAdminRouter.post(
  '/attendance/months/:year/:month/process',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceClosure.processMonth(actor(req), Number(req.params.year), Number(req.params.month)));
  }),
);

hrAdminRouter.post(
  '/attendance/months/:year/:month/finalize',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceClosure.finalizeMonth(actor(req), Number(req.params.year), Number(req.params.month)));
  }),
);

hrAdminRouter.post(
  '/attendance/months/:year/:month/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceClosure.lockMonth(actor(req), Number(req.params.year), Number(req.params.month)));
  }),
);

hrAdminRouter.post(
  '/attendance/months/:year/:month/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(monthReopenSchema, req.body);
    res.json(await attendanceClosure.reopenMonth(actor(req), Number(req.params.year), Number(req.params.month), body.reason));
  }),
);

hrAdminRouter.get(
  '/attendance/settings',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.getAttendanceSettingsFull(actor(req)));
  }),
);

hrAdminRouter.patch(
  '/attendance/settings',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(attendanceSettingsSchema, req.body);
    res.json(await attendanceConfig.updateAttendanceSettings(actor(req), body));
  }),
);

hrAdminRouter.get(
  '/attendance/shifts',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.listShifts(actor(req)));
  }),
);

hrAdminRouter.post(
  '/attendance/shifts',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(shiftSchema, req.body);
    res.status(201).json(await attendanceConfig.createShift(actor(req), body));
  }),
);

hrAdminRouter.patch(
  '/attendance/shifts/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.updateShift(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.get(
  '/attendance/work-schedules',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.listWorkSchedules(actor(req)));
  }),
);

hrAdminRouter.patch(
  '/attendance/work-schedules/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.updateWorkSchedule(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.get(
  '/attendance/holidays',
  asyncHandler(async (req: AuthedRequest, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    res.json(await attendanceConfig.listHolidays(actor(req), year));
  }),
);

hrAdminRouter.post(
  '/attendance/holidays',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(holidaySchema, req.body);
    res.status(201).json(await attendanceConfig.createHoliday(actor(req), body));
  }),
);

hrAdminRouter.patch(
  '/attendance/holidays/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.updateHoliday(actor(req), Number(req.params.id), req.body));
  }),
);

hrAdminRouter.post(
  '/attendance/punches',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(punchImportSchema, req.body);
    res.status(201).json(await attendancePunches.recordManualPunch(actor(req), { employeeId: body.employeeId, punchAt: body.punchAt, punchType: body.punchType ?? 'IN' }));
  }),
);

hrAdminRouter.post(
  '/attendance/employees/:id/shift-assignment',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendanceConfig.assignShift(actor(req), Number(req.params.id), req.body));
  }),
);

// ── Payroll panel ───────────────────────────────────────────────────────────
export const hrPayrollRouter = Router();
hrPayrollRouter.use(requireAuth);
hrPayrollRouter.use(attachHrLeadership);

hrPayrollRouter.get(
  '/attendance-handoff/:year/:month',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await attendancePayrollHandoff.payrollHandoffForActor(actor(req), Number(req.params.year), Number(req.params.month)));
  }),
);

hrPayrollRouter.get(
  '/periods',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.listPayrollPeriods(actor(req)));
  }),
);

hrPayrollRouter.post(
  '/periods',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(
      await payroll.ensurePayrollPeriod(actor(req), {
        label: String(req.body.label),
        startDate: String(req.body.startDate),
        endDate: String(req.body.endDate),
      }),
    );
  }),
);

hrPayrollRouter.get(
  '/runs',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.listPayrollRuns(actor(req)));
  }),
);

hrPayrollRouter.post(
  '/runs',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(await payroll.createPayrollRun(actor(req), Number(req.body.periodId)));
  }),
);

hrPayrollRouter.get(
  '/runs/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.getPayrollRun(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.get(
  '/runs/:id/employees/:employeeId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await payroll.getPayrollRunEmployee(actor(req), Number(req.params.id), Number(req.params.employeeId)),
    );
  }),
);

hrPayrollRouter.post(
  '/runs/:id/calculate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.calculatePayrollRun(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/runs/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.approvePayrollRun(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/runs/:id/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.lockPayrollRun(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/runs/:id/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.reopenPayrollRun(actor(req), Number(req.params.id), String(req.body.reason || '')));
  }),
);

hrPayrollRouter.get(
  '/runs/:id/posting-batch',
  asyncHandler(async (req: AuthedRequest, res) => {
    await ensurePayrollFinanceDefaults(actor(req).collegeId);
    res.json(await payroll.getPayrollPostingBatch(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/runs/:id/post-finance',
  asyncHandler(async (req: AuthedRequest, res) => {
    await ensurePayrollFinanceDefaults(actor(req).collegeId);
    res.json(await payroll.postPayrollToFinance(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/runs/:id/reverse-finance',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await payroll.reversePayrollFinance(actor(req), Number(req.params.id), String(req.body.reason || '')),
    );
  }),
);

hrPayrollRouter.post(
  '/runs/:id/employees/:preId/mutate-component',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await payroll.mutateLockedPayrollComponentBlocked(actor(req), Number(req.params.preId), {
        amount: req.body.amount != null ? Number(req.body.amount) : undefined,
      }),
    );
  }),
);

// Salary structures
hrPayrollRouter.get(
  '/components',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await salaryStructures.listSalaryComponents(actor(req)));
  }),
);

hrPayrollRouter.patch(
  '/components/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await salaryStructures.updateSalaryComponentFlags(actor(req), Number(req.params.id), {
        lopAffected: req.body.lopAffected,
        isProratable: req.body.isProratable,
        isActive: req.body.isActive,
      }),
    );
  }),
);

hrPayrollRouter.get(
  '/structures',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await salaryStructures.listSalaryStructures(actor(req)));
  }),
);

hrPayrollRouter.get(
  '/structures/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await salaryStructures.getSalaryStructure(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/structures',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(await salaryStructures.createSalaryStructure(actor(req), req.body));
  }),
);

hrPayrollRouter.put(
  '/structures/:id/components',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await salaryStructures.updateSalaryStructureComponents(
        actor(req),
        Number(req.params.id),
        req.body.components || [],
      ),
    );
  }),
);

hrPayrollRouter.get(
  '/employees/:id/salary',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await salaryStructures.listEmployeeSalaryAssignments(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.post(
  '/employees/:id/salary',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(
      await salaryStructures.assignEmployeeSalary(actor(req), Number(req.params.id), {
        structureId: Number(req.body.structureId),
        effectiveFrom: String(req.body.effectiveFrom),
        reason: req.body.reason,
        generateArrear: req.body.generateArrear,
      }),
    );
  }),
);

// Adjustments
hrPayrollRouter.get(
  '/adjustments',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await payrollAdjustments.listAdjustments(actor(req), {
        employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
        payrollRunId: req.query.payrollRunId ? Number(req.query.payrollRunId) : undefined,
      }),
    );
  }),
);

hrPayrollRouter.post(
  '/adjustments',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(await payrollAdjustments.createAdjustment(actor(req), req.body));
  }),
);

hrPayrollRouter.post(
  '/adjustments/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollAdjustments.approveAdjustment(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.delete(
  '/adjustments/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollAdjustments.deleteAdjustment(actor(req), Number(req.params.id)));
  }),
);

hrPayrollRouter.get(
  '/payslips/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payroll.getPayslipAdmin(actor(req), Number(req.params.id)));
  }),
);

// Reports
hrPayrollRouter.get(
  '/reports/register/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.payrollRegisterReport(actor(req), Number(req.params.runId)));
  }),
);

hrPayrollRouter.get(
  '/reports/department-summary/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.departmentSummaryReport(actor(req), Number(req.params.runId)));
  }),
);

hrPayrollRouter.get(
  '/reports/earnings-deductions/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.earningsDeductionSummary(actor(req), Number(req.params.runId)));
  }),
);

hrPayrollRouter.get(
  '/reports/lop/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.lopSummaryReport(actor(req), Number(req.params.runId)));
  }),
);

hrPayrollRouter.get(
  '/reports/arrears',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await payrollReports.arrearsReport(
        actor(req),
        req.query.runId ? Number(req.query.runId) : undefined,
      ),
    );
  }),
);

hrPayrollRouter.get(
  '/reports/finance/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.financePostingSummary(actor(req), Number(req.params.runId)));
  }),
);

hrPayrollRouter.get(
  '/reports/variance/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await payrollReports.payrollVarianceReport(actor(req), Number(req.params.runId)));
  }),
);

// ── Management panel ────────────────────────────────────────────────────────
export const hrManagementRouter = Router();
hrManagementRouter.use(requireAuth);

hrManagementRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await management.managementDashboard(actor(req)));
  }),
);

// ── Final Settlement / F&F ──────────────────────────────────────────────────
export const hrFnfRouter = Router();
hrFnfRouter.use(requireAuth);
hrFnfRouter.use(attachHrLeadership);

hrFnfRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.dashboard(actor(req)));
  }),
);

hrFnfRouter.get(
  '/policy',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfPolicy.getFnfPolicy(actor(req)));
  }),
);

hrFnfRouter.get(
  '/cases',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.listCases(actor(req), req.query.status ? String(req.query.status) : undefined));
  }),
);

hrFnfRouter.post(
  '/cases',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createFnfCaseSchema, req.body);
    res.status(201).json(await fnf.createSettlementCase(actor(req), body.separationRequestId));
  }),
);

hrFnfRouter.get(
  '/cases/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.getCase(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/sync',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.syncSettlementSources(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/calculate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.calculateSettlement(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/review',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.submitForReview(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.approveSettlement(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/reject',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(fnfRejectSchema, req.body);
    res.json(await fnf.rejectSettlement(actor(req), Number(req.params.id), body.reason));
  }),
);

hrFnfRouter.post(
  '/cases/:id/hold',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(fnfHoldSchema, req.body);
    res.json(await fnf.holdSettlement(actor(req), Number(req.params.id), body.reason));
  }),
);

hrFnfRouter.post(
  '/cases/:id/post',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.postSettlementToFinance(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.get(
  '/cases/:id/posting-preview',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.getPostingPreview(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/settle',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.markSettled(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/close',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.closeSettlement(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.post(
  '/cases/:id/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(fnfReopenSchema, req.body);
    res.json(await fnf.reopenSettlement(actor(req), Number(req.params.id), body.reason));
  }),
);

hrFnfRouter.post(
  '/cases/:id/notice-waiver',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(noticeWaiverSchema, req.body);
    res.json(await fnf.setNoticeWaiver(actor(req), Number(req.params.id), body.waived, body.reason));
  }),
);

hrFnfRouter.post(
  '/cases/:id/adjustments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(fnfAdjustmentSchema, req.body);
    res.json(await fnf.addManualAdjustment(actor(req), Number(req.params.id), body));
  }),
);

hrFnfRouter.post(
  '/cases/:id/clearance/:domain',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(clearanceDecisionSchema, req.body);
    res.json(await fnfClearance.decideClearance(actor(req), Number(req.params.id), String(req.params.domain), body));
  }),
);

hrFnfRouter.post(
  '/cases/:id/assets',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(fnfAssetItemSchema, req.body);
    res.json(await fnf.addAssetItem(actor(req), Number(req.params.id), body));
  }),
);

hrFnfRouter.post(
  '/cases/:id/documents',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfDocuments.generateDocuments(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.get(
  '/cases/:id/documents/:docType',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfDocuments.getDocument(actor(req), Number(req.params.id), String(req.params.docType)));
  }),
);

hrFnfRouter.get(
  '/cases/:id/audit',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnf.getAudit(actor(req), Number(req.params.id)));
  }),
);

hrFnfRouter.get(
  '/hod/clearances',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfClearance.listHodClearanceInbox(actor(req)));
  }),
);

hrFnfRouter.get(
  '/hod/clearances/:settlementId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfClearance.getHodClearanceDetail(actor(req), Number(req.params.settlementId)));
  }),
);

hrFnfRouter.post(
  '/hod/clearances/:settlementId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(clearanceDecisionSchema, req.body);
    res.json(await fnfClearance.decideClearance(actor(req), Number(req.params.settlementId), 'DEPARTMENT', body));
  }),
);

hrFnfRouter.get(
  '/reports/register',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.settlementRegister(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/pending-clearance',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.pendingClearanceReport(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/outstanding-recoveries',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.outstandingRecoveries(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/payables',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.employeePayables(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/receivables',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.employeeReceivables(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/leave-encashment',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.leaveEncashmentSummary(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/notice-pay',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.noticePaySummary(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/aging',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.settlementAging(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/finance-posting',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.financePostingStatusReport(actor(req)));
  }),
);
hrFnfRouter.get(
  '/reports/closed',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await fnfReports.closedSeparationReport(actor(req)));
  }),
);

// ── Performance & Appraisal ─────────────────────────────────────────────────
export const hrPerformanceRouter = Router();
hrPerformanceRouter.use(requireAuth);
hrPerformanceRouter.use(attachHrLeadership);

hrPerformanceRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisal.hrDashboard(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/cycles',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.listCycles(actor(req)));
  }),
);

hrPerformanceRouter.post(
  '/cycles',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createCycleSchema, req.body);
    res.status(201).json(await appraisal.createCycle(actor(req), body));
  }),
);

hrPerformanceRouter.get(
  '/cycles/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getCycle(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/cycles/:id/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(updateCycleStatusSchema, req.body);
    res.json(await appraisal.updateCycleStatus(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.post(
  '/cycles/:id/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.lockCycle(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/cycles/:id/enroll',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(enrollEmployeesSchema, req.body);
    res.status(201).json(await appraisal.enrollEligibleEmployees(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.get(
  '/templates',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.listTemplates(actor(req)));
  }),
);

hrPerformanceRouter.post(
  '/templates',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(createTemplateSchema, req.body);
    res.status(201).json(await appraisal.createTemplate(actor(req), body));
  }),
);

hrPerformanceRouter.get(
  '/templates/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getTemplate(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/templates/:id/publish',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.publishTemplate(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/templates/:id/version',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(await appraisal.versionTemplate(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.get(
  '/rating-scales',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.listRatingScales(actor(req)));
  }),
);

hrPerformanceRouter.get(
  '/appraisals',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await appraisal.listAppraisals(actor(req), {
        cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
      }),
    );
  }),
);

hrPerformanceRouter.get(
  '/appraisals/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getAppraisalDetail(actor(req), Number(req.params.id), 'hr'));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/calibrate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(calibrateSchema, req.body);
    res.json(await appraisal.calibrateAppraisal(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/finalize',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.finalizeAppraisal(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.lockAppraisal(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/reopen',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(reopenSchema, req.body);
    res.json(await appraisal.reopenAppraisal(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/development',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(developmentPlanSchema, req.body);
    res.json(await appraisal.upsertDevelopmentPlan(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.post(
  '/appraisals/:id/pip',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(pipSchema, req.body);
    res.status(201).json(await appraisal.createPip(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.get(
  '/reports/completion',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.completionReport(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/ratings',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.ratingDistribution(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/departments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.departmentSummary(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/goals',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.goalCompletion(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/pending',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.pendingReviews(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/calibration',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.calibrationChanges(actor(req), cycleId));
  }),
);
hrPerformanceRouter.get(
  '/reports/development',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.developmentNeeds(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/team/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisal.teamDashboard(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/team/pending-goals',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.listPendingGoals(actor(req)));
  }),
);

hrPerformanceRouter.get(
  '/team/pending-reviews',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.listPendingReviews(actor(req)));
  }),
);

hrPerformanceRouter.get(
  '/team/appraisals/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.getAppraisalDetail(actor(req), Number(req.params.id), 'reviewer'));
  }),
);

hrPerformanceRouter.post(
  '/team/appraisals/:id/goals/:goalId/decide',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(goalDecisionSchema, req.body);
    res.json(await appraisal.decideGoal(actor(req), Number(req.params.goalId), body));
  }),
);

hrPerformanceRouter.post(
  '/team/appraisals/:id/goals/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await appraisal.lockGoals(actor(req), Number(req.params.id)));
  }),
);

hrPerformanceRouter.post(
  '/team/appraisals/:id/review',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(reviewAppraisalSchema, req.body);
    res.json(await appraisal.saveReview(actor(req), Number(req.params.id), body));
  }),
);

hrPerformanceRouter.post(
  '/team/appraisals/:id/review/submit',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = req.body && Object.keys(req.body).length
      ? validate(reviewAppraisalSchema, { ...req.body, submit: true })
      : null;
    if (body) await appraisal.saveReview(actor(req), Number(req.params.id), body);
    res.json(await appraisal.submitReview(actor(req), Number(req.params.id)));
  }),
);

// UI aliases
hrPerformanceRouter.post(
  '/team/goals/:goalId/decide',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(goalDecisionSchema, req.body);
    res.json(await appraisal.decideGoal(actor(req), Number(req.params.goalId), body));
  }),
);

hrPerformanceRouter.get(
  '/employees',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await appraisal.listAppraisals(actor(req), {
        cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
      }),
    );
  }),
);

hrPerformanceRouter.get(
  '/calibration',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await appraisal.listAppraisals(actor(req), {
        cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
        status: 'REVIEW_SUBMITTED',
      }),
    );
  }),
);

hrPerformanceRouter.get(
  '/department',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.departmentSummary(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/principal',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisal.principalDashboard(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/principal/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisal.principalDashboard(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/principal/departments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisalReports.departmentSummary(actor(req), cycleId));
  }),
);

hrPerformanceRouter.get(
  '/principal/hod-appraisals',
  asyncHandler(async (req: AuthedRequest, res) => {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    res.json(await appraisal.listPrincipalHodAppraisals(actor(req), cycleId));
  }),
);

// ── Recruitment ─────────────────────────────────────────────────────────────
export const hrRecruitmentRouter = Router();
hrRecruitmentRouter.use(requireAuth);
hrRecruitmentRouter.use(attachHrLeadership);

hrRecruitmentRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentReports.recruitmentDashboard(actor(req)));
  }),
);

hrRecruitmentRouter.get(
  '/requisitions',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.listRequisitions(actor(req), req.query.status ? String(req.query.status) : undefined));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(createRequisitionSchema, req.body);
    res.status(201).json(await recruitmentRequisitions.createRequisition(actor(req), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/requisitions/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.getRequisition(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.patch(
  '/requisitions/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(updateRequisitionSchema, req.body);
    res.json(await recruitmentRequisitions.updateRequisition(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/submit',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.submitRequisition(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/department-approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.departmentApproveRequisition(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/hr-review',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.moveToHrReview(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(requisitionDecisionSchema, req.body ?? {});
    res.json(await recruitmentRequisitions.approveRequisition(actor(req), Number(req.params.id), body));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/open',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentRequisitions.openRequisition(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/reject',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(requisitionDecisionSchema, req.body ?? {});
    res.json(await recruitmentRequisitions.rejectRequisition(actor(req), Number(req.params.id), body.reason));
  }),
);

hrRecruitmentRouter.post(
  '/requisitions/:id/cancel',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(requisitionDecisionSchema, req.body ?? {});
    res.json(await recruitmentRequisitions.cancelRequisition(actor(req), Number(req.params.id), body.reason));
  }),
);

hrRecruitmentRouter.get(
  '/openings',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.listOpenings(actor(req), req.query.status ? String(req.query.status) : undefined));
  }),
);

hrRecruitmentRouter.post(
  '/openings',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(createOpeningSchema, req.body);
    res.status(201).json(await recruitmentOpenings.createOpening(actor(req), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/openings/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.getOpening(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.patch(
  '/openings/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(updateOpeningSchema, req.body);
    res.json(await recruitmentOpenings.updateOpening(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/openings/:id/publish',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.publishOpening(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/openings/:id/pause',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.pauseOpening(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/openings/:id/resume',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.resumeOpening(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/openings/:id/close',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOpenings.closeOpening(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.get(
  '/candidates',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentCandidates.listCandidates(actor(req), req.query.q ? String(req.query.q) : undefined));
  }),
);

hrRecruitmentRouter.post(
  '/candidates',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(createCandidateSchema, req.body);
    res.status(201).json(await recruitmentCandidates.createCandidate(actor(req), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/candidates/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentCandidates.getCandidate(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/candidates/:id/portal-token',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.status(201).json(await recruitmentCandidates.issueCandidatePortalToken(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/applications',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await recruitmentApplications.listApplications(actor(req), {
        openingId: req.query.openingId ? Number(req.query.openingId) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        candidateId: req.query.candidateId ? Number(req.query.candidateId) : undefined,
      }),
    );
  }),
);

hrRecruitmentRouter.get(
  '/applications/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentApplications.getApplication(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/applications/:id/screen',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(screenApplicationSchema, req.body);
    res.json(await recruitmentScreening.screenApplication(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/applications/:id/shortlist',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(shortlistSchema, req.body ?? {});
    res.json(await recruitmentScreening.shortlistApplication(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/applications/:id/select',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(selectCandidateSchema, req.body ?? {});
    res.json(await recruitmentScreening.selectApplication(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/applications/:id/interviews',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(scheduleInterviewSchema, req.body);
    res.status(201).json(await recruitmentInterviews.scheduleInterview(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/applications/:id/interviews',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentInterviews.listInterviewsForApplication(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.get(
  '/interviews/mine',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentInterviews.listMyPanelInterviews(actor(req)));
  }),
);

hrRecruitmentRouter.get(
  '/interviews/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentInterviews.getInterview(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/interviews/:id/evaluate',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(evaluateInterviewSchema, req.body);
    res.json(await recruitmentInterviews.submitEvaluation(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/interviews/:id/complete',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentInterviews.completeInterview(actor(req), Number(req.params.id), req.body?.outcome));
  }),
);

hrRecruitmentRouter.post(
  '/offers',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(createOfferSchema, req.body);
    res.status(201).json(await recruitmentOffers.createOffer(actor(req), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/offers',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await recruitmentOffers.listOffers(
        actor(req),
        req.query.applicationId ? Number(req.query.applicationId) : undefined,
      ),
    );
  }),
);

hrRecruitmentRouter.get(
  '/offers/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOffers.getOffer(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/offers/:id/submit-approval',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOffers.submitOfferForApproval(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/offers/:id/approve',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOffers.approveOffer(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/offers/:id/issue',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentOffers.issueOffer(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.post(
  '/offers/:id/accept',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(offerDecisionSchema, req.body ?? {});
    res.json(await recruitmentOffers.acceptOffer(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/offers/:id/decline',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(offerDecisionSchema, req.body ?? {});
    res.json(await recruitmentOffers.declineOffer(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/applications/:id/prejoining',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentPreJoining.listPrejoiningTasks(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.patch(
  '/prejoining-tasks/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(updatePrejoiningTaskSchema, req.body);
    res.json(await recruitmentPreJoining.updatePrejoiningTask(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/applications/:id/complete-joining',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(completeJoiningSchema, req.body ?? {});
    res.json(await recruitmentJoining.completeJoining(actor(req), Number(req.params.id), req.body));
  }),
);

hrRecruitmentRouter.post(
  '/documents',
  asyncHandler(async (req: AuthedRequest, res) => {
    validate(uploadDocumentSchema, req.body);
    res.status(201).json(await recruitmentDocuments.uploadDocument(actor(req), req.body));
  }),
);

hrRecruitmentRouter.get(
  '/documents/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentDocuments.getDocument(actor(req), Number(req.params.id)));
  }),
);

hrRecruitmentRouter.get(
  '/reports/pipeline',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(
      await recruitmentReports.pipelineReport(
        actor(req),
        req.query.openingId ? Number(req.query.openingId) : undefined,
      ),
    );
  }),
);

hrRecruitmentRouter.get(
  '/reports/time-to-hire',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentReports.timeToHireReport(actor(req)));
  }),
);

hrRecruitmentRouter.get(
  '/reports/sources',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await recruitmentReports.sourceEffectivenessReport(actor(req)));
  }),
);

// ── HR Analytics ─────────────────────────────────────────────────────────────
function analyticsFilters(req: AuthedRequest): AnalyticsFilters {
  const q = req.query;
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v));
  return {
    from: (q.from as string) || undefined,
    to: (q.to as string) || undefined,
    asOf: (q.asOf as string) || undefined,
    academicYear: (q.academicYear as string) || undefined,
    financialYear: (q.financialYear as string) || undefined,
    departmentId: num(q.departmentId),
    employmentTypeId: num(q.employmentTypeId),
    employeeCategory: (q.employeeCategory as string) || null,
  };
}

export const hrAnalyticsRouter = Router();
hrAnalyticsRouter.use(requireAuth);
hrAnalyticsRouter.use(attachHrLeadership);

const analyticsRoutes: Array<[string, (req: AuthedRequest) => Promise<unknown> | unknown]> = [
  ['/catalog', (req) => analytics.metricCatalog(actor(req))],
  ['/overview', (req) => analytics.overview(actor(req), analyticsFilters(req))],
  ['/workforce/headcount', (req) => analytics.currentHeadcount(actor(req), analyticsFilters(req))],
  ['/workforce/headcount/historical', (req) => analytics.historicalHeadcount(actor(req), analyticsFilters(req))],
  ['/workforce/joiners', (req) => analytics.joinersTrend(actor(req), analyticsFilters(req))],
  ['/workforce/separations', (req) => analytics.separationsTrend(actor(req), analyticsFilters(req))],
  ['/workforce/attrition', (req) => analytics.attrition(actor(req), analyticsFilters(req))],
  ['/workforce/retention', (req) => analytics.retention(actor(req), analyticsFilters(req))],
  ['/workforce/tenure', (req) => analytics.tenureBands(actor(req), analyticsFilters(req))],
  ['/workforce/departments', (req) => analytics.departmentDistribution(actor(req), analyticsFilters(req))],
  ['/workforce/movement', (req) => analytics.workforceMovement(actor(req), analyticsFilters(req))],
  ['/attendance', (req) => analytics.attendanceTrend(actor(req), analyticsFilters(req))],
  ['/leave', (req) => analytics.leaveUtilisation(actor(req), analyticsFilters(req))],
  ['/payroll/cost', (req) => analytics.payrollCostTrend(actor(req), analyticsFilters(req))],
  ['/recruitment/funnel', (req) => analytics.recruitmentFunnel(actor(req), analyticsFilters(req))],
  ['/recruitment/time-to-fill', (req) => analytics.timeToFill(actor(req), analyticsFilters(req))],
  ['/recruitment/offer-acceptance', (req) => analytics.offerAcceptance(actor(req), analyticsFilters(req))],
  ['/recruitment/vacancy', (req) => analytics.vacancyOverview(actor(req), analyticsFilters(req))],
  ['/performance/completion', (req) => analytics.performanceCompletion(actor(req), req.query.cycleId ? Number(req.query.cycleId) : undefined, analyticsFilters(req))],
  ['/performance/distribution', (req) => analytics.ratingDistribution(actor(req), req.query.cycleId ? Number(req.query.cycleId) : undefined, analyticsFilters(req))],
  ['/separation/fnf', (req) => analytics.fnfAnalytics(actor(req), analyticsFilters(req))],
  ['/reconciliation', (req) => analytics.reconciliation(actor(req))],
  ['/data-quality', (req) => analytics.dataQuality(actor(req))],
];
for (const [path, handler] of analyticsRoutes) {
  hrAnalyticsRouter.get(path, asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await handler(req));
  }));
}

// Payroll drilldowns keyed by run id (aggregate/detail split enforced in service).
hrAnalyticsRouter.get(
  '/payroll/departments/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await analytics.payrollByDepartment(actor(req), Number(req.params.runId)));
  }),
);
hrAnalyticsRouter.get(
  '/payroll/variance/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await analytics.payrollVariance(actor(req), Number(req.params.runId)));
  }),
);
hrAnalyticsRouter.get(
  '/payroll/reconciliation/:runId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await analytics.payrollReconciliation(actor(req), Number(req.params.runId)));
  }),
);

hrAnalyticsRouter.get(
  '/export/:report',
  asyncHandler(async (req: AuthedRequest, res) => {
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    const file = await analytics.exportReport(actor(req), String(req.params.report), format, analyticsFilters(req));
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.body);
  }),
);

// ── Combined router ─────────────────────────────────────────────────────────
export const hrRouter = Router();
hrRouter.use('/me', hrSelfRouter);
hrRouter.use('/manager', hrManagerRouter);
hrRouter.use('/admin', hrAdminRouter);
hrRouter.use('/payroll', hrPayrollRouter);
hrRouter.use('/fnf', hrFnfRouter);
hrRouter.use('/performance', hrPerformanceRouter);
hrRouter.use('/recruitment', hrRecruitmentRouter);
hrRouter.use('/management', hrManagementRouter);
hrRouter.use('/analytics', hrAnalyticsRouter);
hrRouter.use('/ld', ldRouter);
hrRouter.use('/succession', successionRouter);
