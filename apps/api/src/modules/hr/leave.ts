import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import {
  assertHrPermission,
  assertManagerScope,
  hasHrPermission,
  requireEmployeeForActor,
  resolveEmployeeForActor,
} from './access.js';
import { recordHrAudit } from './audit.js';
import { getLeaveAcademicImpact } from './academicImpact.js';
import { calculateLeaveDays } from './leaveCalc.js';
import { nextLeaveRequestNumber } from './numbers.js';
import { notifyEmployee } from './notifications.js';
import { findConflicts } from '../timetable/service.js';
import { asISODate, weekdayInTimezone, todayInTimezone } from '../timetable/time.js';
import { isAdminRole } from '../../utils/permissions.js';
import { enrichHrActor } from '../academicLeadership/leadership.js';
import { tryResolveLeaveAcademicApprover } from '../academicLeadership/leaveApprover.js';
import { notifyAcademicApprover, notifyHrStaff } from '../academicLeadership/notifyLeaders.js';
import { asDateOnly } from '../academicLeadership/types.js';
import {
  applyCoverageOverrides,
  finalizeLeaveCoverageNotifications,
  getLeaveCoverageSummary,
  RESOLVED_COVERAGE_STATUSES,
  reverseLeaveCoverageOnCancel,
  syncLeaveCoverageStatus,
} from './leaveCoverage.js';

type Row = Record<string, unknown>;

const VERIFIED_COVERAGE_STATUSES = RESOLVED_COVERAGE_STATUSES;

function serializeLeaveRequest(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    employeeId: Number(row.employee_id),
    requestNumber: row.request_number,
    leaveTypeId: Number(row.leave_type_id),
    fromDate: row.from_date,
    toDate: row.to_date,
    fromSession: row.from_session,
    toSession: row.to_session,
    requestedDays: Number(row.requested_days),
    reason: row.reason,
    isEmergency: !!row.is_emergency,
    status: row.status,
    submittedAt: row.submitted_at,
    currentApprovalStep: row.current_approval_step,
    academicCoverageStatus: row.academic_coverage_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    leaveTypeName: row.leave_type_name,
    leaveTypeCode: row.leave_type_code,
    employeeName: row.employee_name,
    academicApproverEmployeeId: row.academic_approver_employee_id != null ? Number(row.academic_approver_employee_id) : null,
    academicApprovedByEmployeeId: row.academic_approved_by_employee_id != null ? Number(row.academic_approved_by_employee_id) : null,
    academicApprovedAt: row.academic_approved_at ?? null,
    approvalStage:
      row.status === 'APPROVED' ? 'COMPLETE'
      : row.status === 'UNDER_APPROVAL' ? 'HR_PENDING'
      : row.status === 'SUBMITTED' ? 'ACADEMIC_PENDING'
      : null,
  };
}

export async function getLeaveBalances(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const year = new Date().getFullYear();
  const rows = await db('employee_leave_balances as b')
    .join('hr_leave_types as t', 't.id', 'b.leave_type_id')
    .where({ 'b.employee_id': emp.id, 'b.year': year })
    .select('b.*', 't.code as leave_type_code', 't.name as leave_type_name');
  return rows.map((r: Row) => ({
    leaveTypeId: Number(r.leave_type_id),
    leaveTypeCode: r.leave_type_code,
    leaveTypeName: r.leave_type_name,
    year: Number(r.year),
    openingBalance: Number(r.opening_balance),
    credited: Number(r.credited),
    availed: Number(r.availed),
    adjusted: Number(r.adjusted),
    carriedForward: Number(r.carried_forward),
    availableBalance: Number(r.available_balance),
  }));
}

export async function listLeaveTypes(collegeId: number) {
  const rows = await db('hr_leave_types').where({ college_id: collegeId, is_active: true }).orderBy('code');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    isPaid: !!r.is_paid,
    requiresDocument: !!r.requires_document,
  }));
}

async function getApplicablePolicy(collegeId: number, leaveTypeId: number, employmentTypeId: number | null) {
  let q = db('hr_leave_policies')
    .where({ college_id: collegeId, leave_type_id: leaveTypeId, is_active: true });
  if (employmentTypeId) {
    q = q.andWhere((b) => b.where({ employment_type_id: employmentTypeId }).orWhereNull('employment_type_id'));
  }
  return q.orderBy('employment_type_id', 'desc').first();
}

async function ensureBalance(employeeId: number, leaveTypeId: number, collegeId: number, year: number) {
  let balance = await db('employee_leave_balances')
    .where({ employee_id: employeeId, leave_type_id: leaveTypeId, year })
    .first();
  if (!balance) {
    const emp = await db('employees').where({ id: employeeId }).first();
    const policy = await getApplicablePolicy(collegeId, leaveTypeId, emp?.employment_type_id ?? null);
    const entitlement = Number(policy?.annual_entitlement ?? 0);
    const [id] = await db('employee_leave_balances').insert({
      college_id: collegeId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      opening_balance: 0,
      credited: entitlement,
      availed: 0,
      adjusted: 0,
      carried_forward: 0,
      available_balance: entitlement,
    });
    balance = await db('employee_leave_balances').where({ id }).first();
    if (balance) {
      await db('employee_leave_balance_transactions').insert({
        balance_id: id,
        transaction_type: 'OPENING',
        amount: entitlement,
        balance_after: entitlement,
        notes: 'Initial credit from policy',
      });
    }
  }
  return balance;
}

export async function createLeaveRequest(
  actor: HrActor,
  input: {
    leaveTypeId: number;
    fromDate: string;
    toDate: string;
    fromSession: string;
    toSession: string;
    reason?: string | null;
    isEmergency?: boolean;
  },
) {
  const emp = await requireEmployeeForActor(actor);
  if (!['ACTIVE', 'PROBATION', 'CONFIRMED'].includes(String(emp.employment_status))) {
    throw new AppError(400, 'Employee is not eligible for leave');
  }

  const requestedDays = calculateLeaveDays(
    input.fromDate,
    input.toDate,
    input.fromSession as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
    input.toSession as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
  );
  if (requestedDays <= 0) throw new AppError(400, 'Invalid leave date range');

  const policy = await getApplicablePolicy(actor.collegeId, input.leaveTypeId, emp.employment_type_id ?? null);
  const year = new Date(input.fromDate).getFullYear();
  const balance = await ensureBalance(Number(emp.id), input.leaveTypeId, actor.collegeId, year);
  const available = Number(balance.available_balance);
  if (!policy?.negative_balance_allowed && available < requestedDays && !input.isEmergency) {
    throw new AppError(400, 'Insufficient leave balance', { code: 'INSUFFICIENT_BALANCE' });
  }

  const overlapping = await db('hr_leave_requests')
    .where({ employee_id: emp.id })
    .whereNotIn('status', ['DRAFT', 'REJECTED', 'CANCELLED', 'WITHDRAWN'])
    .andWhere((q) => {
      q.where((b) => b.where('from_date', '<=', input.toDate).andWhere('to_date', '>=', input.fromDate));
    })
    .first();
  if (overlapping) throw new AppError(400, 'Leave dates overlap with existing request', { code: 'DATE_OVERLAP' });

  const facultyUserId = emp.faculty_user_id ? Number(emp.faculty_user_id) : null;
  let academicCoverageStatus: string | null = null;
  let impact = { affectedSessions: [] as unknown[], totalAffected: 0, coverageRequired: false };

  if (facultyUserId) {
    impact = await getLeaveAcademicImpact(
      actor.collegeId,
      facultyUserId,
      input.fromDate,
      input.toDate,
      input.fromSession as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
      input.toSession as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
      input.isEmergency ? { emergencyRemainingOnly: true } : undefined,
    );
    if (impact.coverageRequired && policy?.academic_coverage_required !== false && !input.isEmergency) {
      academicCoverageStatus = 'PENDING';
    } else if (impact.coverageRequired && input.isEmergency) {
      academicCoverageStatus = 'UNRESOLVED';
    }
  }

  const result = await db.transaction(async (trx) => {
    const requestNumber = await nextLeaveRequestNumber(trx, actor.collegeId);
    const [id] = await trx('hr_leave_requests').insert({
      college_id: actor.collegeId,
      employee_id: emp.id,
      request_number: requestNumber,
      leave_type_id: input.leaveTypeId,
      from_date: input.fromDate,
      to_date: input.toDate,
      from_session: input.fromSession,
      to_session: input.toSession,
      requested_days: requestedDays,
      reason: input.reason ?? null,
      is_emergency: !!input.isEmergency,
      status: 'DRAFT',
      academic_coverage_status: academicCoverageStatus,
    });

    const today = todayInTimezone('Asia/Kolkata');
    for (const session of impact.affectedSessions as Array<{
      timetableSlotId: number | null;
      date: string;
      originalFacultyId: number;
      classId: number;
      startTime?: string;
    }>) {
      let priority: string | null = null;
      if (input.isEmergency) {
        if (session.date === today) priority = 'CRITICAL';
        else if (session.date > today) {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          priority = session.date <= tomorrow.toISOString().slice(0, 10) ? 'HIGH' : 'NORMAL';
        }
      }
      await trx('hr_leave_academic_coverage').insert({
        college_id: actor.collegeId,
        leave_request_id: id,
        timetable_slot_id: session.timetableSlotId,
        affected_date: session.date,
        original_faculty_id: session.originalFacultyId,
        original_faculty_employee_id: emp.id,
        status: 'UNRESOLVED',
        priority,
      });
    }

    let emergencyManagerIds: number[] = [];
    if (input.isEmergency && impact.affectedSessions.length > 0) {
      const managers = await trx('employees as e')
        .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
        .where({ 'e.college_id': actor.collegeId })
        .whereIn('f.role', ['HOD', 'PRINCIPAL', 'COLLEGE_ADMIN'])
        .select('e.id')
        .limit(5);
      emergencyManagerIds = managers.map((manager) => Number(manager.id));
    }

    await trx('hr_leave_actions').insert({
      leave_request_id: id,
      action: 'CREATED',
      actor_employee_id: emp.id,
      actor_faculty_id: actor.facultyUserId,
    });

    return { id: Number(id), requestNumber, academicImpact: impact, emergencyManagerIds };
  });

  for (const employeeId of result.emergencyManagerIds) {
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'EMERGENCY_LEAVE_COVERAGE',
      title: 'CRITICAL: Emergency leave coverage required',
      body: `${emp.display_name || 'A lecturer'} submitted emergency leave affecting ${impact.totalAffected} session(s).`,
      relatedType: 'hr_leave_requests',
      relatedId: result.id,
      dedupeKey: `emergency-leave-${result.id}-${employeeId}`,
    });
  }

  await recordHrAudit({
    actor,
    action: 'LEAVE_CREATED',
    entityType: 'hr_leave_requests',
    entityId: result.id,
    after: input,
  });

  const { emergencyManagerIds: _emergencyManagerIds, ...created } = result;
  return { ...created, requestedDays };
}

export async function getLeaveAcademicImpactForRequest(actor: HrActor, leaveRequestId: number) {
  const emp = await requireEmployeeForActor(actor);
  const req = await db('hr_leave_requests').where({ id: leaveRequestId, employee_id: emp.id }).first();
  if (!req) throw new AppError(404, 'Leave request not found');
  const facultyUserId = emp.faculty_user_id ? Number(emp.faculty_user_id) : null;
  if (!facultyUserId) return { affectedSessions: [], totalAffected: 0, coverageRequired: false };

  return getLeaveAcademicImpact(
    actor.collegeId,
    facultyUserId,
    String(req.from_date),
    String(req.to_date),
    String(req.from_session) as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
    String(req.to_session) as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF',
  );
}

export async function listMyLeaveRequests(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const rows = await db('hr_leave_requests as r')
    .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
    .where({ 'r.employee_id': emp.id })
    .select('r.*', 't.name as leave_type_name', 't.code as leave_type_code')
    .orderBy('r.created_at', 'desc');
  return rows.map(serializeLeaveRequest);
}

async function isCoverageComplete(leaveRequestId: number): Promise<boolean> {
  const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: leaveRequestId });
  if (!coverages.length) return true;
  return coverages.every((c: Row) => VERIFIED_COVERAGE_STATUSES.has(String(c.status)));
}

export async function submitLeaveRequest(actor: HrActor, leaveRequestId: number) {
  const emp = await requireEmployeeForActor(actor);
  const req = await db('hr_leave_requests').where({ id: leaveRequestId, employee_id: emp.id }).first();
  if (!req) throw new AppError(404, 'Leave request not found');
  if (req.status !== 'DRAFT' && req.status !== 'ACTION_REQUIRED') {
    throw new AppError(400, 'Leave request cannot be submitted in current status');
  }

  const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: leaveRequestId });
  let status = 'SUBMITTED';
  let academicCoverageStatus = req.academic_coverage_status;

  if (coverages.length > 0 && !req.is_emergency) {
    const summary = await getLeaveCoverageSummary(leaveRequestId);
    if (summary.status !== 'COMPLETE') {
      throw new AppError(409, 'Academic coverage is incomplete', {
        code: 'ACADEMIC_COVERAGE_INCOMPLETE',
        unresolvedCoverageIds: summary.unresolvedCoverageIds,
        summary,
      });
    }
    academicCoverageStatus = 'COMPLETE';
  } else if (coverages.length > 0 && req.is_emergency) {
    status = 'SUBMITTED';
    academicCoverageStatus = 'EMERGENCY_UNRESOLVED';
  }

  await db('hr_leave_requests').where({ id: leaveRequestId }).update({
    status,
    academic_coverage_status: academicCoverageStatus,
    submitted_at: db.fn.now(),
    current_approval_step: 1,
  });

  await db('hr_leave_actions').insert({
    leave_request_id: leaveRequestId,
    action: 'SUBMITTED',
    actor_employee_id: emp.id,
    actor_faculty_id: actor.facultyUserId,
  });

  if (await db.schema.hasColumn('hr_leave_requests', 'academic_approver_employee_id')) {
    const resolved = await tryResolveLeaveAcademicApprover(Number(emp.id), actor.collegeId, asDateOnly(req.from_date));
    if (resolved.error && ['MULTIPLE_ACTIVE_HOD', 'MULTIPLE_ACTIVE_PRINCIPAL', 'NO_PRINCIPAL_CONFIGURED'].includes(String(resolved.error.code))) {
      throw resolved.error;
    }
    if (resolved.approver) {
      await db('hr_leave_requests').where({ id: leaveRequestId }).update({
        academic_approver_employee_id: resolved.approver.employeeId,
      });
      await notifyAcademicApprover(resolved.approver.employeeId, actor.collegeId, {
        type: resolved.approver.role === 'PRINCIPAL' ? 'HOD_LEAVE_SUBMITTED' : 'FACULTY_LEAVE_SUBMITTED',
        title: resolved.approver.role === 'PRINCIPAL' ? 'HOD leave needs your approval' : 'Faculty leave needs your approval',
        body: `${emp.display_name || 'A faculty member'} submitted leave from ${asDateOnly(req.from_date)} to ${asDateOnly(req.to_date)}.`,
        relatedId: leaveRequestId,
        link: resolved.approver.role === 'PRINCIPAL' ? '/principal/approvals' : '/hod/leave',
      });
    }
  }

  return { id: leaveRequestId, status };
}

export async function requestSubstituteCoverage(
  actor: HrActor,
  input: { coverageId: number; substituteEmployeeId: number; message?: string | null },
) {
  const emp = await requireEmployeeForActor(actor);
  const coverage = await db('hr_leave_academic_coverage').where({ id: input.coverageId }).first();
  if (!coverage) throw new AppError(404, 'Coverage record not found');
  if (Number(coverage.original_faculty_employee_id) !== Number(emp.id)) {
    throw new AppError(403, 'Only the requesting lecturer can arrange coverage');
  }

  const subEmp = await db('employees').where({ id: input.substituteEmployeeId, college_id: actor.collegeId }).first();
  if (!subEmp?.faculty_user_id) throw new AppError(400, 'Substitute must be a teaching faculty member');

  const facultyUserId = Number(subEmp.faculty_user_id);
  const slot = coverage.timetable_slot_id
    ? await db('timetable_slots').where({ id: coverage.timetable_slot_id }).first()
    : null;

  if (slot) {
    const affectedDate = asISODate(coverage.affected_date);
    const hits = await findConflicts(actor.collegeId, {
      academicClassId: Number(slot.academic_class_id),
      facultyIds: [facultyUserId],
      roomId: slot.room_id ?? null,
      dayOfWeek: weekdayInTimezone(affectedDate),
      startTime: String(slot.start_time).slice(0, 5),
      endTime: String(slot.end_time).slice(0, 5),
      effectiveFrom: affectedDate,
      effectiveTo: affectedDate,
      date: affectedDate,
    });
    const facultyConflict = hits.find((h) => h.kind === 'FACULTY');
    if (facultyConflict) {
      throw new AppError(400, facultyConflict.message, { code: 'FACULTY_CONFLICT' });
    }
  }

  const onLeave = await db('hr_leave_requests')
    .where({ employee_id: input.substituteEmployeeId, status: 'APPROVED' })
    .andWhere('from_date', '<=', coverage.affected_date)
    .andWhere('to_date', '>=', coverage.affected_date)
    .first();
  if (onLeave) throw new AppError(400, 'Substitute faculty is on approved leave', { code: 'FACULTY_ON_LEAVE' });

  await db.transaction(async (trx) => {
    await trx('hr_leave_academic_coverage').where({ id: input.coverageId }).update({
      coverage_type: 'SUBSTITUTE_FACULTY',
      substitute_employee_id: input.substituteEmployeeId,
      substitute_faculty_id: facultyUserId,
      status: 'REQUESTED',
      requested_at: trx.fn.now(),
    });

    await trx('hr_leave_coverage_requests').insert({
      coverage_id: input.coverageId,
      requested_to_employee_id: input.substituteEmployeeId,
      requested_by_employee_id: emp.id,
      status: 'PENDING',
      message: input.message ?? null,
    });
  });

  await notifyEmployee({
    employeeId: input.substituteEmployeeId,
    collegeId: actor.collegeId,
    type: 'LEAVE_COVERAGE_REQUEST',
    title: 'Class Coverage Request',
    body: input.message ?? 'You have been requested to cover a class',
    relatedType: 'hr_leave_academic_coverage',
    relatedId: input.coverageId,
    dedupeKey: `coverage-req-${input.coverageId}-${input.substituteEmployeeId}`,
  });

  await recordHrAudit({
    actor,
    action: 'SUBSTITUTE_REQUESTED',
    entityType: 'hr_leave_academic_coverage',
    entityId: input.coverageId,
    after: { substituteEmployeeId: input.substituteEmployeeId },
  });

  return { coverageId: input.coverageId, status: 'REQUESTED' };
}

export async function respondToCoverageRequest(
  actor: HrActor,
  coverageRequestId: number,
  accept: boolean,
) {
  const emp = await requireEmployeeForActor(actor);
  const req = await db('hr_leave_coverage_requests').where({ id: coverageRequestId }).first();
  if (!req) throw new AppError(404, 'Coverage request not found');
  if (Number(req.requested_to_employee_id) !== Number(emp.id)) {
    throw new AppError(403, 'This coverage request is not addressed to you');
  }
  if (req.status !== 'PENDING') throw new AppError(400, 'Coverage request already responded');

  const newStatus = accept ? 'ACCEPTED' : 'DECLINED';
  await db.transaction(async (trx) => {
    const locked = await trx('hr_leave_coverage_requests').where({ id: coverageRequestId }).forUpdate().first();
    if (!locked) throw new AppError(404, 'Coverage request not found');
    if (Number(locked.requested_to_employee_id) !== Number(emp.id)) {
      throw new AppError(403, 'This coverage request is not addressed to you');
    }
    if (locked.status !== 'PENDING') throw new AppError(400, 'Coverage request already responded');

    await trx('hr_leave_coverage_requests').where({ id: coverageRequestId }).update({
      status: newStatus,
      responded_at: trx.fn.now(),
    });
    await trx('hr_leave_academic_coverage').where({ id: locked.coverage_id }).update({
      status: accept ? 'ACCEPTED' : 'UNRESOLVED',
      accepted_at: accept ? trx.fn.now() : null,
      substitute_employee_id: accept ? emp.id : null,
      substitute_faculty_id: accept ? actor.facultyUserId : null,
      coverage_type: accept ? 'SUBSTITUTE_FACULTY' : null,
    });
    const cov = await trx('hr_leave_academic_coverage').where({ id: locked.coverage_id }).first();
    await trx('hr_leave_actions').insert({
      leave_request_id: cov?.leave_request_id,
      action: accept ? 'COVERAGE_ACCEPTED' : 'COVERAGE_DECLINED',
      actor_employee_id: emp.id,
      actor_faculty_id: actor.facultyUserId,
    });
  });

  await recordHrAudit({
    actor,
    action: accept ? 'SUBSTITUTE_ACCEPTED' : 'SUBSTITUTE_DECLINED',
    entityType: 'hr_leave_coverage_requests',
    entityId: coverageRequestId,
  });

  const cov = await db('hr_leave_academic_coverage').where({ id: req.coverage_id }).first();
  if (cov) await syncLeaveCoverageStatus(Number(cov.leave_request_id));
  return { coverageRequestId, status: newStatus };
}

export async function getCoverageRequestType(coverageRequestId: number): Promise<string | null> {
  const req = await db('hr_leave_coverage_requests').where({ id: coverageRequestId }).first();
  return req ? String(req.request_type || 'SUBSTITUTE') : null;
}

export async function listCoverageRequestsForActor(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const hasSwaps = await db.schema.hasTable('hr_leave_class_swaps');
  let q = db('hr_leave_coverage_requests as cr')
    .join('hr_leave_academic_coverage as c', 'c.id', 'cr.coverage_id')
    .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
    .join('employees as req', 'req.id', 'cr.requested_by_employee_id')
    .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
    .leftJoin('courses as co', 'co.id', 'ts.course_id')
    .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id');
  if (hasSwaps) {
    q = q
      .leftJoin('hr_leave_class_swaps as sw', 'sw.id', 'cr.swap_id')
      .leftJoin('timetable_slots as tts', 'tts.id', 'sw.target_timetable_slot_id')
      .leftJoin('courses as tco', 'tco.id', 'tts.course_id')
      .leftJoin('academic_classes as tac', 'tac.id', 'tts.academic_class_id');
  }
  const rows = await q
    .where({ 'cr.requested_to_employee_id': emp.id, 'cr.status': 'PENDING' })
    .select(
      'cr.*',
      'c.affected_date',
      'c.timetable_slot_id',
      'req.display_name as requested_by_name',
      'co.name as subject_name',
      'co.code as subject_code',
      'ac.name as class_name',
      'ts.start_time',
      'ts.end_time',
      ...(hasSwaps
        ? ['sw.target_date', 'tco.name as swap_subject_name', 'tac.name as swap_class_name', 'tts.start_time as swap_start_time', 'tts.end_time as swap_end_time']
        : []),
    );
  return rows.map((r: Row) => ({
    id: Number(r.id),
    coverageId: Number(r.coverage_id),
    requestType: r.request_type || 'SUBSTITUTE',
    status: r.status,
    message: r.message,
    affectedDate: r.affected_date,
    startTime: r.start_time,
    endTime: r.end_time,
    className: r.class_name,
    subjectName: r.subject_name,
    subjectCode: r.subject_code,
    requestedByName: r.requested_by_name,
    swapTargetDate: r.target_date,
    swapClassName: r.swap_class_name,
    swapSubjectName: r.swap_subject_name,
    swapStartTime: r.swap_start_time,
    swapEndTime: r.swap_end_time,
  }));
}

export async function listPendingLeaveForManager(actor: HrActor) {
  const actorX = await enrichHrActor(actor);
  assertHrPermission(actorX, 'hr.leave.approve');
  const self = await resolveEmployeeForActor(actorX);
  let q = db('hr_leave_requests as r')
    .join('employees as e', 'e.id', 'r.employee_id')
    .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
    .where({ 'r.college_id': actorX.collegeId })
    .whereIn('r.status', ['SUBMITTED', 'UNDER_APPROVAL', 'COVERAGE_PENDING']);

  const hrFinal = isHrFinalApprover(actorX);
  const isPrincipal = actorX.role === 'PRINCIPAL' || (actorX.leadershipRoles ?? []).includes('PRINCIPAL');
  const isHod = actorX.role === 'HOD' || (actorX.leadershipRoles ?? []).includes('HOD');

  if (hrFinal) {
    /* college-wide pending including academic-approved HR queue */
  } else if (isPrincipal && !isHod) {
    q = q.andWhere('r.status', 'SUBMITTED').where(function hodRequesters() {
      this.whereExists(function assigned() {
        this.select(db.raw('1'))
          .from('academic_leadership_assignments as ala')
          .whereRaw('ala.employee_id = r.employee_id')
          .andWhere('ala.college_id', actorX.collegeId)
          .andWhere('ala.leadership_role', 'HOD')
          .andWhere('ala.status', 'ACTIVE');
      }).orWhereExists(function legacy() {
        this.select(db.raw('1'))
          .from('employees as he')
          .join('faculty_users as hf', 'hf.id', 'he.faculty_user_id')
          .whereRaw('he.id = r.employee_id')
          .andWhere('hf.role', 'HOD');
      });
    });
  } else if (isHod) {
    const depts = actorX.hodDepartmentIds?.length
      ? actorX.hodDepartmentIds
      : actorX.departmentId
        ? [actorX.departmentId]
        : [];
    q = q.andWhere('r.status', 'SUBMITTED');
    if (depts.length) q = q.whereIn('e.department_id', depts);
    if (self) q = q.andWhereNot('r.employee_id', self.id);
  } else if (self) {
    q = q.andWhere('e.reporting_manager_employee_id', self.id);
  }

  const rows = await q.select('r.*', 'e.display_name as employee_name', 't.name as leave_type_name', 't.code as leave_type_code')
    .orderBy('r.submitted_at', 'desc');
  return rows.map(serializeLeaveRequest);
}

function isHrFinalApprover(actor: HrActor) {
  if (isAdminRole(actor.role)) return true;
  if (['HR_MANAGER', 'HR_EXECUTIVE'].includes(actor.role)) return true;
  return hasHrPermission(actor, 'hr.employee.manage');
}

export async function getLeaveRequestDetail(actor: HrActor, leaveRequestId: number) {
  const actorX = await enrichHrActor(actor);
  const row = await db('hr_leave_requests as r')
    .join('employees as e', 'e.id', 'r.employee_id')
    .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
    .where({ 'r.id': leaveRequestId, 'r.college_id': actorX.collegeId })
    .select('r.*', 'e.display_name as employee_name', 'e.department_id as employee_department_id', 't.name as leave_type_name', 't.code as leave_type_code')
    .first();
  if (!row) throw new AppError(404, 'Leave request not found');

  const self = await resolveEmployeeForActor(actorX);
  const hrFinal = isHrFinalApprover(actorX);
  const isPrincipal = actorX.role === 'PRINCIPAL' || (actorX.leadershipRoles ?? []).includes('PRINCIPAL');
  const isHod = actorX.role === 'HOD' || (actorX.leadershipRoles ?? []).includes('HOD');
  if (!hrFinal && isHod && !isPrincipal) {
    const depts = actorX.hodDepartmentIds?.length
      ? actorX.hodDepartmentIds
      : actorX.departmentId
        ? [actorX.departmentId]
        : [];
    if (!depts.includes(Number(row.employee_department_id))) {
      throw new AppError(404, 'Leave request not found', undefined, 'DEPARTMENT_SCOPE');
    }
  } else if (!hrFinal && !isPrincipal && !isHod && self && Number(row.employee_id) !== Number(self.id)) {
    await assertManagerScope(actorX, Number(row.employee_id));
  }

  const coverages = await db('hr_leave_academic_coverage as c')
    .leftJoin('employees as sub', 'sub.id', 'c.substitute_employee_id')
    .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
    .leftJoin('courses as co', 'co.id', 'ts.course_id')
    .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
    .where({ 'c.leave_request_id': leaveRequestId })
    .select('c.*', 'sub.display_name as substitute_name', 'co.name as subject_name', 'ac.name as class_name', 'ts.start_time', 'ts.end_time');

  const balance = await db('employee_leave_balances')
    .where({ employee_id: row.employee_id, leave_type_id: row.leave_type_id, year: new Date(String(row.from_date)).getFullYear() })
    .first();

  return {
    ...serializeLeaveRequest(row),
    coverages: coverages.map((c: Row) => ({
      id: Number(c.id),
      affectedDate: c.affected_date,
      coverageType: c.coverage_type,
      status: c.status,
      substituteName: c.substitute_name,
      subjectName: c.subject_name,
      className: c.class_name,
      startTime: c.start_time,
      endTime: c.end_time,
    })),
    availableBalance: balance ? Number(balance.available_balance) : null,
  };
}

export async function approveLeaveRequest(actor: HrActor, leaveRequestId: number, notes?: string) {
  const actorX = await enrichHrActor(actor);
  assertHrPermission(actorX, 'hr.leave.approve');
  const req = await db('hr_leave_requests').where({ id: leaveRequestId, college_id: actorX.collegeId }).first();
  if (!req) throw new AppError(404, 'Leave request not found');

  const self = await resolveEmployeeForActor(actorX);
  if (self && Number(req.employee_id) === Number(self.id)) {
    throw new AppError(403, 'You cannot approve your own leave', undefined, 'SELF_APPROVAL');
  }

  const hrFinal = isHrFinalApprover(actorX);
  if (hrFinal) {
    await assertManagerScope(actorX, Number(req.employee_id));
  } else {
    await assertAcademicApproverForRequest(actorX, req);
  }

  if (req.status === 'APPROVED') {
    return { id: leaveRequestId, status: 'APPROVED' };
  }

  if (!req.is_emergency) {
    const summary = await getLeaveCoverageSummary(leaveRequestId);
    if (summary.totalAffected > 0 && summary.status !== 'COMPLETE') {
      throw new AppError(409, 'Academic coverage is incomplete', {
        code: 'ACADEMIC_COVERAGE_INCOMPLETE',
        unresolvedCoverageIds: summary.unresolvedCoverageIds,
        summary,
      });
    }
  }

  if (!hrFinal) {
    await db.transaction(async (trx) => {
      const lockedReq = await trx('hr_leave_requests').where({ id: leaveRequestId }).forUpdate().first();
      if (!lockedReq) throw new AppError(404, 'Leave request not found');
      if (lockedReq.status === 'APPROVED' || lockedReq.status === 'UNDER_APPROVAL') {
        return;
      }
      if (!['SUBMITTED', 'DRAFT'].includes(String(lockedReq.status))) {
        throw new AppError(409, 'Leave cannot be academically approved in current status');
      }
      const patch: Record<string, unknown> = { status: 'UNDER_APPROVAL', current_approval_step: 2 };
      if (await db.schema.hasColumn('hr_leave_requests', 'academic_approved_by_employee_id')) {
        patch.academic_approved_by_employee_id = self?.id ?? null;
        patch.academic_approved_at = trx.fn.now();
      }
      await trx('hr_leave_requests').where({ id: leaveRequestId }).update(patch);
      await trx('hr_leave_actions').insert({
        leave_request_id: leaveRequestId,
        action: 'ACADEMIC_APPROVED',
        actor_employee_id: self?.id ?? null,
        actor_faculty_id: actorX.facultyUserId,
        notes: notes ?? null,
      });
    });

    const emp = await db('employees').where({ id: req.employee_id }).first();
    if (emp) {
      await notifyEmployee({
        employeeId: Number(emp.id),
        collegeId: actorX.collegeId,
        type: 'LEAVE_ACADEMIC_APPROVED',
        title: 'Leave approved by academic leadership',
        body: 'Your leave was approved by academic leadership and is now with HR.',
        relatedType: 'hr_leave_requests',
        relatedId: leaveRequestId,
        dedupeKey: `leave-acad-ok-${leaveRequestId}`,
      });
    }
    await notifyHrStaff(actorX.collegeId, {
      type: 'LEAVE_HR_PENDING',
      title: 'Leave pending HR approval',
      body: `${emp?.display_name || 'A faculty member'} leave is academically approved and awaits HR.`,
      relatedType: 'hr_leave_requests',
      relatedId: leaveRequestId,
      dedupePrefix: `leave-hr-pending-${leaveRequestId}`,
      link: '/hr/admin/leave',
    });
    await recordHrAudit({ actor: actorX, action: 'LEAVE_ACADEMIC_APPROVED', entityType: 'hr_leave_requests', entityId: leaveRequestId });
    return { id: leaveRequestId, status: 'UNDER_APPROVAL' };
  }

  await db.transaction(async (trx) => {
    const lockedReq = await trx('hr_leave_requests').where({ id: leaveRequestId }).forUpdate().first();
    if (!lockedReq) throw new AppError(404, 'Leave request not found');
    if (lockedReq.status === 'APPROVED') return;

    if (!['SUBMITTED', 'DRAFT', 'UNDER_APPROVAL'].includes(String(lockedReq.status))) {
      throw new AppError(409, 'Leave cannot be approved in current status');
    }

    const year = new Date(String(lockedReq.from_date)).getFullYear();
    const balance = await trx('employee_leave_balances')
      .where({ employee_id: lockedReq.employee_id, leave_type_id: lockedReq.leave_type_id, year })
      .forUpdate()
      .first();

    if (balance) {
      const newAvailed = Number(balance.availed) + Number(lockedReq.requested_days);
      const newAvailable = Number(balance.available_balance) - Number(lockedReq.requested_days);
      await trx('employee_leave_balances').where({ id: balance.id }).update({
        availed: newAvailed,
        available_balance: newAvailable,
      });
      await trx('employee_leave_balance_transactions').insert({
        balance_id: balance.id,
        transaction_type: 'APPLICATION',
        amount: -Number(lockedReq.requested_days),
        balance_after: newAvailable,
        reference_type: 'hr_leave_requests',
        reference_id: leaveRequestId,
        recorded_by: actorX.facultyUserId,
      });
    }

    await trx('hr_leave_requests').where({ id: leaveRequestId }).update({ status: 'APPROVED' });

    await applyCoverageOverrides(trx, {
      collegeId: actorX.collegeId,
      leaveRequestId,
      createdBy: actorX.facultyUserId,
    });

    await trx('hr_leave_actions').insert({
      leave_request_id: leaveRequestId,
      action: 'APPROVED',
      actor_faculty_id: actorX.facultyUserId,
      actor_employee_id: self?.id ?? null,
      notes: notes ?? null,
    });
  });

  await finalizeLeaveCoverageNotifications(leaveRequestId, actorX.collegeId);
  await syncLeaveCoverageStatus(leaveRequestId);
  await recordHrAudit({ actor: actorX, action: 'LEAVE_APPROVED', entityType: 'hr_leave_requests', entityId: leaveRequestId });

  const approvedReq = await db('hr_leave_requests').where({ id: leaveRequestId }).first();
  if (approvedReq) {
    try {
      const { attendanceSchemaReady, recalculateEmployeeRange } = await import('./attendanceEngine.js');
      if (await attendanceSchemaReady()) {
        await recalculateEmployeeRange(
          Number(approvedReq.employee_id),
          String(approvedReq.from_date).slice(0, 10),
          String(approvedReq.to_date).slice(0, 10),
        );
      }
    } catch {
      /* attendance sync is non-fatal */
    }
  }

  return { id: leaveRequestId, status: 'APPROVED' };
}

async function assertAcademicApproverForRequest(actor: HrActor, req: Row) {
  const resolved = await tryResolveLeaveAcademicApprover(
    Number(req.employee_id),
    Number(req.college_id),
    asDateOnly(req.from_date),
  );
  if (resolved.error && ['MULTIPLE_ACTIVE_HOD', 'MULTIPLE_ACTIVE_PRINCIPAL'].includes(String(resolved.error.code))) {
    throw resolved.error;
  }
  if (!resolved.approver) {
    throw new AppError(403, 'No academic approver is configured for this leave', undefined, 'NO_HOD_CONFIGURED');
  }
  const self = await resolveEmployeeForActor(actor);
  if (!self || Number(self.id) !== Number(resolved.approver.employeeId)) {
    throw new AppError(403, 'You are not the academic approver for this leave request', undefined, 'WRONG_APPROVER');
  }
  if (Number(req.employee_id) === Number(self.id)) {
    throw new AppError(403, 'You cannot approve your own leave', undefined, 'SELF_APPROVAL');
  }
}

export async function rejectLeaveRequest(actor: HrActor, leaveRequestId: number, notes?: string) {
  const actorX = await enrichHrActor(actor);
  assertHrPermission(actorX, 'hr.leave.approve');
  const req = await db('hr_leave_requests').where({ id: leaveRequestId, college_id: actorX.collegeId }).first();
  if (!req) throw new AppError(404, 'Leave request not found');

  const self = await resolveEmployeeForActor(actorX);
  if (self && Number(req.employee_id) === Number(self.id)) {
    throw new AppError(403, 'You cannot reject your own leave as the approver', undefined, 'SELF_APPROVAL');
  }

  const hrFinal = isHrFinalApprover(actorX);
  if (hrFinal) {
    await assertManagerScope(actorX, Number(req.employee_id));
  } else {
    await assertAcademicApproverForRequest(actorX, req);
    if (!['SUBMITTED', 'DRAFT'].includes(String(req.status))) {
      throw new AppError(409, 'Leave cannot be academically rejected in current status');
    }
  }

  const action = hrFinal ? 'REJECTED' : 'ACADEMIC_REJECTED';
  await db('hr_leave_requests').where({ id: leaveRequestId }).update({ status: 'REJECTED' });
  await db('hr_leave_actions').insert({
    leave_request_id: leaveRequestId,
    action,
    actor_faculty_id: actorX.facultyUserId,
    actor_employee_id: self?.id ?? null,
    notes: notes ?? null,
  });

  await notifyEmployee({
    employeeId: Number(req.employee_id),
    collegeId: actorX.collegeId,
    type: 'LEAVE_REJECTED',
    title: 'Leave request rejected',
    body: notes ? `Your leave request was rejected: ${notes}` : 'Your leave request was rejected.',
    relatedType: 'hr_leave_requests',
    relatedId: leaveRequestId,
    dedupeKey: `leave-rejected-${leaveRequestId}`,
  });

  await recordHrAudit({ actor: actorX, action: hrFinal ? 'LEAVE_REJECTED' : 'LEAVE_ACADEMIC_REJECTED', entityType: 'hr_leave_requests', entityId: leaveRequestId, reason: notes ?? null });
  return { id: leaveRequestId, status: 'REJECTED' };
}

export async function cancelLeaveRequest(actor: HrActor, leaveRequestId: number) {
  const emp = await requireEmployeeForActor(actor);
  const req = await db('hr_leave_requests').where({ id: leaveRequestId, employee_id: emp.id }).first();
  if (!req) throw new AppError(404, 'Leave request not found');
  if (!['DRAFT', 'SUBMITTED', 'UNDER_APPROVAL', 'APPROVED'].includes(String(req.status))) {
    throw new AppError(400, 'Leave cannot be cancelled in current status');
  }

  let reverseCoverage = false;

  await db.transaction(async (trx) => {
    const locked = await trx('hr_leave_requests').where({ id: leaveRequestId, employee_id: emp.id }).forUpdate().first();
    if (!locked) throw new AppError(404, 'Leave request not found');
    if (locked.status === 'CANCELLED') return;
    if (!['DRAFT', 'SUBMITTED', 'UNDER_APPROVAL', 'APPROVED'].includes(String(locked.status))) {
      throw new AppError(400, 'Leave cannot be cancelled in current status');
    }

    if (locked.status === 'APPROVED') {
      reverseCoverage = true;
      const year = new Date(String(locked.from_date)).getFullYear();
      const balance = await trx('employee_leave_balances')
        .where({ employee_id: locked.employee_id, leave_type_id: locked.leave_type_id, year })
        .forUpdate()
        .first();
      if (balance) {
        const restored = Number(balance.available_balance) + Number(locked.requested_days);
        await trx('employee_leave_balances').where({ id: balance.id }).update({
          availed: Number(balance.availed) - Number(locked.requested_days),
          available_balance: restored,
        });
        await trx('employee_leave_balance_transactions').insert({
          balance_id: balance.id,
          transaction_type: 'CANCELLATION',
          amount: Number(locked.requested_days),
          balance_after: restored,
          reference_type: 'hr_leave_requests',
          reference_id: leaveRequestId,
        });
      }
    }

    await trx('hr_leave_requests').where({ id: leaveRequestId }).update({ status: 'CANCELLED' });
    await trx('hr_leave_actions').insert({
      leave_request_id: leaveRequestId,
      action: 'CANCELLED',
      actor_employee_id: emp.id,
      actor_faculty_id: actor.facultyUserId,
    });
  });

  if (reverseCoverage) {
    await reverseLeaveCoverageOnCancel(leaveRequestId, actor);
  }

  const cancelledReq = await db('hr_leave_requests').where({ id: leaveRequestId }).first();
  if (cancelledReq) {
    try {
      const { attendanceSchemaReady, recalculateEmployeeRange } = await import('./attendanceEngine.js');
      if (await attendanceSchemaReady()) {
        await recalculateEmployeeRange(
          Number(cancelledReq.employee_id),
          String(cancelledReq.from_date).slice(0, 10),
          String(cancelledReq.to_date).slice(0, 10),
        );
      }
    } catch {
      /* attendance sync is non-fatal */
    }
  }

  return { id: leaveRequestId, status: 'CANCELLED' };
}

export async function listUnresolvedCoverage(actor: HrActor) {
  assertHrPermission(actor, 'academic.leave.coverage.manage');
  const rows = await db('hr_leave_academic_coverage as c')
    .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
    .join('employees as e', 'e.id', 'lr.employee_id')
    .leftJoin('timetable_slots as ts', 'ts.id', 'c.timetable_slot_id')
    .leftJoin('courses as co', 'co.id', 'ts.course_id')
    .leftJoin('academic_classes as ac', 'ac.id', 'ts.academic_class_id')
    .where({ 'c.college_id': actor.collegeId })
    .whereIn('c.status', ['UNRESOLVED', 'REQUESTED'])
    .select('c.*', 'e.display_name as employee_name', 'lr.is_emergency', 'co.name as subject_name', 'ac.name as class_name', 'ts.start_time', 'ts.end_time')
    .orderBy('c.affected_date');
  return rows;
}
