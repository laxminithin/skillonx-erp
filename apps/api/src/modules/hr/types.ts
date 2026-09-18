import { z } from 'zod';

export const EMPLOYMENT_STATUSES = [
  'DRAFT',
  'PRE_JOINING',
  'ACTIVE',
  'PROBATION',
  'CONFIRMED',
  'ON_NOTICE',
  'SUSPENDED',
  'ON_LONG_LEAVE',
  'SEPARATED',
  'RETIRED',
  'TERMINATED',
  'INACTIVE',
] as const;

export const LEAVE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'COVERAGE_PENDING',
  'UNDER_APPROVAL',
  'ACTION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'WITHDRAWN',
  'COMPLETED',
] as const;

export const LEAVE_SESSIONS = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] as const;

export const COVERAGE_TYPES = [
  'SUBSTITUTE_FACULTY',
  'CLASS_SWAP',
  'RESCHEDULE',
  'TEAM_TEACHING',
  'ALREADY_COVERED',
  'HOD_ARRANGEMENT',
  'CANCELLED_WITH_AUTHORIZATION',
] as const;

export const COVERAGE_STATUSES = [
  'UNRESOLVED',
  'REQUESTED',
  'ACCEPTED',
  'DECLINED',
  'VERIFIED',
  'COMPLETED',
  'CANCELLED',
  'HOD_ACTION_REQUIRED',
] as const;

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'ABSENT',
  'HALF_DAY',
  'ON_LEAVE',
  'HOLIDAY',
  'WEEKLY_OFF',
  'WORK_FROM_HOME',
  'ON_DUTY',
  'MISSING_PUNCH',
  'OTHER',
] as const;

export const PAYROLL_RUN_STATUSES = [
  'DRAFT',
  'CALCULATED',
  'UNDER_REVIEW',
  'APPROVED',
  'LOCKED',
  'POSTED',
  'CANCELLED',
] as const;

export type HrPermission =
  | 'hr.self.view'
  | 'hr.self.leave.apply'
  | 'hr.self.attendance.view'
  | 'hr.self.payslip.view'
  | 'hr.employee.view'
  | 'hr.employee.manage'
  | 'hr.employee.onboard'
  | 'hr.employee.transfer'
  | 'hr.employee.promote'
  | 'hr.employee.separate'
  | 'hr.attendance.view'
  | 'hr.attendance.manage'
  | 'hr.attendance.adjust'
  | 'hr.leave.view'
  | 'hr.leave.approve'
  | 'hr.leave.override'
  | 'hr.leave.balance.adjust'
  | 'hr.payroll.view'
  | 'hr.payroll.manage'
  | 'hr.payroll.calculate'
  | 'hr.payroll.approve'
  | 'hr.payroll.lock'
  | 'hr.fnf.view'
  | 'hr.fnf.manage'
  | 'hr.fnf.calculate'
  | 'hr.fnf.approve'
  | 'hr.fnf.post'
  | 'hr.fnf.override'
  | 'hr.fnf.document.release'
  | 'hr.fnf.reopen'
  | 'hr.fnf.clearance.department'
  | 'hr.performance.view'
  | 'hr.performance.manage'
  | 'hr.performance.calibrate'
  | 'hr.performance.finalize'
  | 'hr.performance.reopen'
  | 'hr.performance.report'
  | 'hr.recruitment.view'
  | 'hr.recruitment.manage'
  | 'hr.recruitment.approve'
  | 'hr.recruitment.offer'
  | 'hr.recruitment.join'
  | 'hr.recruitment.report'
  | 'hr.document.view'
  | 'hr.document.manage'
  | 'hr.config.manage'
  | 'hr.report.view'
  | 'hr.management.view'
  | 'hr.analytics.view'
  | 'hr.analytics.payroll.aggregate'
  | 'hr.analytics.payroll.detail'
  | 'hr.analytics.export'
  | 'hr.ld.self'
  | 'hr.ld.view'
  | 'hr.ld.manage'
  | 'hr.ld.nominate'
  | 'hr.ld.approve'
  | 'hr.ld.report'
  | 'hr.succession.self'
  | 'hr.succession.view'
  | 'hr.succession.manage'
  | 'hr.succession.nominate'
  | 'hr.succession.assess'
  | 'hr.succession.approve'
  | 'hr.succession.report'
  | 'academic.leave.coverage.manage';

export type HrActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string;
  employeeId?: number | null;
  leadershipRoles?: string[];
  hodDepartmentIds?: number[];
};

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(128),
  middleName: z.string().trim().max(128).nullable().optional(),
  lastName: z.string().trim().min(1).max(128),
  title: z.string().trim().max(16).nullable().optional(),
  officialEmail: z.string().email().nullable().optional(),
  personalEmail: z.string().email().nullable().optional(),
  officialPhone: z.string().trim().max(32).nullable().optional(),
  personalPhone: z.string().trim().max(32).nullable().optional(),
  employeeCategory: z.enum(['FACULTY', 'NON_TEACHING', 'MANAGEMENT', 'CONTRACTUAL', 'OTHER']).default('NON_TEACHING'),
  departmentId: z.number().int().positive().nullable().optional(),
  designationId: z.number().int().positive().nullable().optional(),
  employmentTypeId: z.number().int().positive().nullable().optional(),
  reportingManagerEmployeeId: z.number().int().positive().nullable().optional(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  facultyUserId: z.number().int().positive().nullable().optional(),
  authMode: z.enum(['LINK_EXISTING', 'CREATE_LOGIN', 'NO_LOGIN']).optional(),
  manualEmployeeNumber: z.string().max(64).nullable().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gender: z.string().max(16).nullable().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const joinEmployeeSchema = z.object({
  overrideOnboarding: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

export const linkUserSchema = z.object({
  facultyUserId: z.number().int().positive(),
});

export const promotionSchema = z.object({
  newDesignationId: z.number().int().positive(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newGradeId: z.number().int().positive().nullable().optional(),
  reason: z.string().max(2000).optional(),
  approvalReference: z.string().max(128).optional(),
});

export const transferSchema = z.object({
  toDepartmentId: z.number().int().positive(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newReportingManagerEmployeeId: z.number().int().positive().nullable().optional(),
  newDesignationId: z.number().int().positive().nullable().optional(),
  reason: z.string().max(2000).optional(),
});

export const reportingChangeSchema = z.object({
  reportingManagerEmployeeId: z.number().int().positive().nullable(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(2000).optional(),
});

export const designationChangeSchema = z.object({
  newDesignationId: z.number().int().positive(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(2000),
});

export const contractSchema = z.object({
  contractType: z.string().max(32),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  noticePeriodDays: z.number().int().positive().optional(),
  reference: z.string().max(128).optional(),
  remarks: z.string().max(2000).optional(),
});

export const resignationSchema = z.object({
  proposedLastWorkingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(2000).optional(),
  remarks: z.string().max(2000).optional(),
});

export const separationInitiateSchema = z.object({
  separationType: z.string().max(32),
  lastWorkingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(2000),
  noticePeriodDays: z.number().int().positive().optional(),
});

export const clearanceUpdateSchema = z.object({
  status: z.string().max(32),
  notes: z.string().max(2000).optional(),
  waive: z.boolean().optional(),
});

export const probationRecommendSchema = z.object({
  recommendation: z.string().max(64),
  performanceSummary: z.string().max(5000).optional(),
  remarks: z.string().max(2000).optional(),
});

export const probationConfirmSchema = z.object({
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reference: z.string().max(128).optional(),
});

export const probationExtendSchema = z.object({
  newEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(2000),
});

export const personalProfileSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gender: z.string().max(16).nullable().optional(),
  maritalStatus: z.string().max(32).nullable().optional(),
  bloodGroup: z.string().max(8).nullable().optional(),
  nationality: z.string().max(64).nullable().optional(),
  personalEmail: z.string().email().nullable().optional(),
  personalPhone: z.string().trim().max(32).nullable().optional(),
  currentAddress: z.string().max(4000).nullable().optional(),
  permanentAddress: z.string().max(4000).nullable().optional(),
  photoReference: z.string().max(512).nullable().optional(),
});

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(255),
  relationship: z.string().trim().min(1).max(64),
  phone: z.string().trim().min(1).max(32),
  alternatePhone: z.string().trim().max(32).nullable().optional(),
  address: z.string().max(4000).nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export const emergencyContactUpdateSchema = emergencyContactSchema.partial();

export const leaveRequestSchema = z.object({
  leaveTypeId: z.number().int().positive(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fromSession: z.enum(LEAVE_SESSIONS).default('FULL_DAY'),
  toSession: z.enum(LEAVE_SESSIONS).default('FULL_DAY'),
  reason: z.string().trim().max(2000).nullable().optional(),
  isEmergency: z.boolean().optional(),
});

export const coverageRequestSchema = z.object({
  coverageId: z.number().int().positive(),
  substituteEmployeeId: z.number().int().positive(),
  coverageType: z.enum(COVERAGE_TYPES).default('SUBSTITUTE_FACULTY'),
  message: z.string().trim().max(500).nullable().optional(),
});

export const hodArrangementSchema = z.object({
  coverageId: z.number().int().positive(),
  reason: z.string().trim().max(500).nullable().optional(),
});

export const classSwapSchema = z.object({
  coverageId: z.number().int().positive(),
  swapEmployeeId: z.number().int().positive(),
  targetTimetableSlotId: z.number().int().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message: z.string().trim().max(500).nullable().optional(),
});

export const rescheduleSchema = z.object({
  coverageId: z.number().int().positive(),
  makeupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  roomId: z.number().int().positive().nullable().optional(),
  makeupKind: z.enum(['RESCHEDULE', 'MAKEUP', 'EXTRA_CLASS']).optional(),
});

export const managerSubstituteSchema = z.object({
  substituteEmployeeId: z.number().int().positive(),
  skipConsent: z.boolean().optional(),
  reason: z.string().trim().max(500).nullable().optional(),
});

export const authorizedCancelSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const REGULARIZATION_REASONS = [
  'MISSED_PUNCH',
  'DEVICE_FAILURE',
  'OFFICIAL_WORK',
  'WRONG_SHIFT',
  'APPROVED_LATE_ARRIVAL',
  'APPROVED_EARLY_DEPARTURE',
  'OTHER',
] as const;

export const regularizationSchema = z.object({
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  regularizationReason: z.enum(REGULARIZATION_REASONS),
  requestedInAt: z.string().nullable().optional(),
  requestedOutAt: z.string().nullable().optional(),
  reason: z.string().trim().min(3).max(2000),
  newStatus: z.enum(ATTENDANCE_STATUSES).optional(),
});

export const attendanceOverrideSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES),
  reason: z.string().trim().min(3).max(2000),
});

export const attendanceSettingsSchema = z.object({
  defaultWorkScheduleId: z.number().int().positive().nullable().optional(),
  defaultShiftId: z.number().int().positive().nullable().optional(),
  sandwichLeavePolicy: z.enum(['DISABLED', 'WEEKLY_OFF', 'HOLIDAY', 'BOTH']).optional(),
  lateMarksCountAsLop: z.boolean().optional(),
  autoFlagMissingPunch: z.boolean().optional(),
  missingPunchGraceHours: z.number().int().positive().optional(),
  requireRegularizationApproval: z.boolean().optional(),
});

export const shiftSchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(128),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  breakDurationMinutes: z.number().int().nonnegative().optional(),
  graceInMinutes: z.number().int().nonnegative().optional(),
  graceOutMinutes: z.number().int().nonnegative().optional(),
  minimumFullDayMinutes: z.number().int().positive().optional(),
  minimumHalfDayMinutes: z.number().int().positive().optional(),
  crossesMidnight: z.boolean().optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const holidaySchema = z.object({
  name: z.string().trim().min(1).max(128),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  holidayType: z.enum(['NATIONAL', 'STATE', 'INSTITUTION', 'RESTRICTED']).optional(),
  description: z.string().max(2000).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  employeeCategory: z.string().max(32).nullable().optional(),
});

export const monthReopenSchema = z.object({
  reason: z.string().trim().min(5).max(2000),
});

export const punchImportSchema = z.object({
  employeeId: z.number().int().positive(),
  punchAt: z.string(),
  punchType: z.string().max(16).nullable().optional(),
  externalEventId: z.string().max(128).nullable().optional(),
  deviceId: z.string().max(64).nullable().optional(),
});
