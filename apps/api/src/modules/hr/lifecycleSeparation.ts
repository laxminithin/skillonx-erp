import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrCollege, assertHrPermission, assertManagerScope, requireEmployeeForActor } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { getOperationalAssignments } from './employees.js';
import {
  closeActiveEmploymentRecord,
  recordServiceEvent,
  transitionEmploymentStatus,
} from './lifecycleCore.js';

type Row = Record<string, unknown>;

const CLEARANCE_DOMAINS = ['DEPARTMENT', 'HR', 'FINANCE', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'IT', 'INVENTORY'] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getEmployeeLibraryClearance(_employeeId: number, _collegeId: number) {
  return { domain: 'LIBRARY', status: 'NOT_APPLICABLE' as const };
}

export async function getEmployeeTransportClearance(employeeId: number, collegeId: number) {
  if (!(await db.schema.hasTable('transport_personnel'))) {
    return { domain: 'TRANSPORT', status: 'NOT_APPLICABLE' as const };
  }
  const row = await db('transport_personnel').where({ employee_id: employeeId }).first();
  if (!row) return { domain: 'TRANSPORT', status: 'NOT_APPLICABLE' as const };
  const active = await db('transport_staff_assignments')
    .where({ personnel_id: row.id, status: 'ACTIVE' })
    .first()
    .catch(() => null);
  return { domain: 'TRANSPORT', status: active ? ('PENDING' as const) : ('CLEAR' as const) };
}

export async function getEmployeeHostelClearance(employeeId: number, collegeId: number) {
  const emp = await db('employees').where({ id: employeeId }).first();
  if (!emp?.faculty_user_id || !(await db.schema.hasTable('hostel_warden_assignments'))) {
    return { domain: 'HOSTEL', status: 'NOT_APPLICABLE' as const };
  }
  const active = await db('hostel_warden_assignments')
    .where({ faculty_user_id: emp.faculty_user_id, status: 'ACTIVE' })
    .first();
  return { domain: 'HOSTEL', status: active ? ('PENDING' as const) : ('CLEAR' as const) };
}

export async function getEmployeeFinanceClearance(_employeeId: number, _collegeId: number) {
  return { domain: 'FINANCE', status: 'NOT_APPLICABLE' as const };
}

export async function initializeClearance(separationRequestId: number, employeeId: number) {
  const checks = await Promise.all([
    getEmployeeLibraryClearance(employeeId, 0),
    getEmployeeTransportClearance(employeeId, 0),
    getEmployeeHostelClearance(employeeId, 0),
    getEmployeeFinanceClearance(employeeId, 0),
  ]);
  for (const check of checks) {
    if (check.status === 'NOT_APPLICABLE') continue;
    const existing = await db('employee_separation_clearance')
      .where({ separation_request_id: separationRequestId, domain: check.domain })
      .first();
    if (!existing) {
      await db('employee_separation_clearance').insert({
        separation_request_id: separationRequestId,
        domain: check.domain,
        status: check.status,
      });
    }
  }
  for (const domain of ['DEPARTMENT', 'HR', 'IT'] as const) {
    const existing = await db('employee_separation_clearance')
      .where({ separation_request_id: separationRequestId, domain })
      .first();
    if (!existing) {
      await db('employee_separation_clearance').insert({
        separation_request_id: separationRequestId,
        domain,
        status: 'PENDING',
      });
    }
  }
}

export async function submitResignation(actor: HrActor, input: {
  proposedLastWorkingDate: string;
  reason?: string;
  remarks?: string;
}) {
  const emp = await requireEmployeeForActor(actor);
  if (!['ACTIVE', 'CONFIRMED', 'PROBATION'].includes(String(emp.employment_status))) {
    throw new AppError(400, 'Resignation not permitted in current status');
  }
  const existing = await db('employee_separation_requests')
    .where({ employee_id: emp.id })
    .whereIn('status', ['SUBMITTED', 'MANAGER_REVIEW', 'HR_REVIEW', 'ACCEPTED', 'CLEARANCE_PENDING'])
    .first();
  if (existing) throw new AppError(409, 'An active separation request already exists');

  const noticeDays = emp.notice_period_days ?? 30;
  const [id] = await db('employee_separation_requests').insert({
    college_id: actor.collegeId,
    employee_id: emp.id,
    separation_type: 'RESIGNATION',
    requested_last_working_date: input.proposedLastWorkingDate,
    reason: input.reason ?? null,
    status: 'SUBMITTED',
    notice_period_days: noticeDays,
  });

  await recordHrAudit({ actor, action: 'RESIGNATION_SUBMITTED', entityType: 'employee_separation_requests', entityId: id });
  await notifyEmployee({
    employeeId: Number(emp.id),
    collegeId: actor.collegeId,
    type: 'RESIGNATION_SUBMITTED',
    title: 'Resignation submitted',
    dedupeKey: `resign-${id}`,
  });
  return { id, status: 'SUBMITTED' };
}

export async function getMyResignation(actor: HrActor) {
  const emp = await requireEmployeeForActor(actor);
  const row = await db('employee_separation_requests').where({ employee_id: emp.id }).orderBy('created_at', 'desc').first();
  if (!row) return null;
  const clearance = await db('employee_separation_clearance').where({ separation_request_id: row.id });
  return { ...row, clearance };
}

export async function withdrawResignation(actor: HrActor, requestId: number) {
  const emp = await requireEmployeeForActor(actor);
  const row = await db('employee_separation_requests').where({ id: requestId, employee_id: emp.id }).first();
  if (!row) throw new AppError(404, 'Resignation not found');
  if (!['SUBMITTED', 'MANAGER_REVIEW'].includes(String(row.status))) {
    throw new AppError(400, 'Cannot withdraw resignation in current status');
  }
  await db('employee_separation_requests').where({ id: requestId }).update({ status: 'WITHDRAWN', withdrawn_at: db.fn.now() });
  await recordHrAudit({ actor, action: 'RESIGNATION_WITHDRAWN', entityType: 'employee_separation_requests', entityId: requestId });
  return { id: requestId, status: 'WITHDRAWN' };
}

export async function managerRecommendSeparation(actor: HrActor, requestId: number, input: { recommendation: 'ACCEPT' | 'REJECT'; remarks?: string }) {
  const row = await db('employee_separation_requests').where({ id: requestId }).first();
  if (!row) throw new AppError(404, 'Separation request not found');
  await assertHrCollege('employees', Number(row.employee_id), actor.collegeId);
  await assertManagerScope(actor, Number(row.employee_id));
  const status = input.recommendation === 'ACCEPT' ? 'HR_REVIEW' : 'REJECTED';
  await db('employee_separation_requests').where({ id: requestId }).update({
    status,
    manager_recommendation: input.recommendation,
    hr_notes: input.remarks ?? null,
  });
  await recordHrAudit({ actor, action: 'SEPARATION_MANAGER_RECOMMEND', entityType: 'employee_separation_requests', entityId: requestId });
  return { id: requestId, status };
}

export async function hrInitiateSeparation(actor: HrActor, employeeId: number, input: {
  separationType: string;
  lastWorkingDate: string;
  reason: string;
  noticePeriodDays?: number;
}) {
  assertHrPermission(actor, 'hr.employee.separate');
  await assertHrCollege('employees', employeeId, actor.collegeId);
  const [id] = await db('employee_separation_requests').insert({
    college_id: actor.collegeId,
    employee_id: employeeId,
    separation_type: input.separationType,
    requested_last_working_date: input.lastWorkingDate,
    approved_last_working_date: input.lastWorkingDate,
    last_working_date: input.lastWorkingDate,
    reason: input.reason,
    status: 'ACCEPTED',
    notice_period_days: input.noticePeriodDays ?? null,
    initiated_by_faculty_id: actor.facultyUserId,
  });
  await initializeClearance(id, employeeId);
  await db.transaction(async (trx) => {
    await trx('employees').where({ id: employeeId }).update({ employment_status: 'ON_NOTICE', last_working_date: input.lastWorkingDate });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'NOTICE_STARTED',
      effectiveDate: todayISO(),
      details: { separationRequestId: id, idempotencyKey: `notice-${id}` },
      recordedBy: actor.facultyUserId,
    });
  });
  await recordHrAudit({ actor, action: 'SEPARATION_INITIATED', entityType: 'employee_separation_requests', entityId: id, reason: input.reason });
  return { id, status: 'ACCEPTED' };
}

export async function approveSeparation(actor: HrActor, requestId: number, input: { approvedLastWorkingDate: string; notes?: string }) {
  assertHrPermission(actor, 'hr.employee.separate');
  const row = await db('employee_separation_requests').where({ id: requestId }).first();
  if (!row || Number(row.college_id) !== actor.collegeId) throw new AppError(404, 'Separation request not found');
  const employeeId = Number(row.employee_id);

  await db('employee_separation_requests').where({ id: requestId }).update({
    status: 'CLEARANCE_PENDING',
    approved_last_working_date: input.approvedLastWorkingDate,
    last_working_date: input.approvedLastWorkingDate,
    hr_notes: input.notes ?? row.hr_notes,
  });
  await db('employees').where({ id: employeeId }).update({
    employment_status: 'ON_NOTICE',
    last_working_date: input.approvedLastWorkingDate,
  });
  await initializeClearance(requestId, employeeId);
  await db.transaction(async (trx) => {
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'RESIGNATION_ACCEPTED',
      effectiveDate: todayISO(),
      details: { requestId, idempotencyKey: `res-accept-${requestId}` },
      recordedBy: actor.facultyUserId,
    });
  });
  await notifyEmployee({
    employeeId,
    collegeId: actor.collegeId,
    type: 'RESIGNATION_ACCEPTED',
    title: 'Resignation accepted',
    dedupeKey: `res-accept-${requestId}`,
  });
  return { id: requestId, status: 'CLEARANCE_PENDING' };
}

export async function rejectSeparation(actor: HrActor, requestId: number, reason: string) {
  assertHrPermission(actor, 'hr.employee.separate');
  const row = await db('employee_separation_requests').where({ id: requestId }).first();
  if (!row || Number(row.college_id) !== actor.collegeId) throw new AppError(404, 'Separation request not found');
  await db('employee_separation_requests').where({ id: requestId }).update({ status: 'REJECTED', hr_notes: reason });
  await recordHrAudit({ actor, action: 'SEPARATION_REJECTED', entityType: 'employee_separation_requests', entityId: requestId, reason });
  return { id: requestId, status: 'REJECTED' };
}

export async function updateClearance(actor: HrActor, requestId: number, domain: string, input: { status: string; notes?: string; waive?: boolean }) {
  assertHrPermission(actor, 'hr.employee.separate');
  const row = await db('employee_separation_requests').where({ id: requestId }).first();
  if (!row || Number(row.college_id) !== actor.collegeId) throw new AppError(404, 'Separation request not found');
  const status = input.waive ? 'WAIVED' : input.status;
  const existing = await db('employee_separation_clearance').where({ separation_request_id: requestId, domain }).first();
  if (existing) {
    await db('employee_separation_clearance').where({ id: existing.id }).update({
      status,
      notes: input.notes ?? null,
      cleared_by: actor.facultyUserId,
      cleared_at: ['CLEAR', 'WAIVED'].includes(status) ? db.fn.now() : null,
    });
  } else {
    await db('employee_separation_clearance').insert({
      separation_request_id: requestId,
      domain,
      status,
      notes: input.notes ?? null,
      cleared_by: actor.facultyUserId,
      cleared_at: ['CLEAR', 'WAIVED'].includes(status) ? db.fn.now() : null,
    });
  }
  await recordHrAudit({
    actor,
    action: input.waive ? 'CLEARANCE_WAIVED' : 'CLEARANCE_UPDATED',
    entityType: 'employee_separation_clearance',
    entityId: requestId,
    reason: input.notes,
  });
  return { requestId, domain, status };
}

export async function checkClearanceComplete(requestId: number) {
  const items = await db('employee_separation_clearance').where({ separation_request_id: requestId });
  const blocking = items.filter((i: Row) => ['PENDING', 'DUE', 'BLOCKED'].includes(String(i.status)));
  return { complete: blocking.length === 0, blocking: blocking.map((b: Row) => b.domain) };
}

export async function getSeparationAssignmentSummary(actor: HrActor, employeeId: number) {
  const ops = await getOperationalAssignments(actor, employeeId);
  return {
    academic: (ops.academic as unknown[]).length > 0 ? 'ACTION_REQUIRED' : 'CLEAR',
    hostel: (ops.hostel as unknown[]).length > 0 ? 'ACTION_REQUIRED' : 'NOT_APPLICABLE',
    transport: (ops.transport as unknown[]).length > 0 ? 'ACTION_REQUIRED' : 'NOT_APPLICABLE',
    placement: (ops.placement as unknown[]).length > 0 ? 'ACTION_REQUIRED' : 'NOT_APPLICABLE',
    library: 'NOT_APPLICABLE',
  };
}

export async function completeSeparation(actor: HrActor, requestId: number) {
  assertHrPermission(actor, 'hr.employee.separate');
  const row = await db('employee_separation_requests').where({ id: requestId }).first();
  if (!row || Number(row.college_id) !== actor.collegeId) throw new AppError(404, 'Separation request not found');
  const employeeId = Number(row.employee_id);
  const clearance = await checkClearanceComplete(requestId);
  if (!clearance.complete) {
    throw new AppError(400, 'Mandatory clearance incomplete', { blocking: clearance.blocking }, 'EMPLOYEE_CLEARANCE_INCOMPLETE');
  }

  const lwd = String(row.last_working_date ?? row.approved_last_working_date ?? todayISO());
  const finalStatus = row.separation_type === 'RETIREMENT' ? 'RETIRED' : row.separation_type === 'TERMINATION' ? 'TERMINATED' : 'SEPARATED';
  const eventType = finalStatus === 'RETIRED' ? 'RETIRED' : 'SEPARATED';

  return db.transaction(async (trx) => {
    await trx('employee_separation_requests').where({ id: requestId }).update({ status: 'COMPLETED' });
    await trx('employees').where({ id: employeeId }).update({
      employment_status: finalStatus,
      last_working_date: lwd,
    });
    await closeActiveEmploymentRecord(trx, employeeId, lwd);
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType,
      effectiveDate: lwd,
      details: { requestId, idempotencyKey: `sep-complete-${requestId}` },
      recordedBy: actor.facultyUserId,
    });

    const emp = await trx('employees').where({ id: employeeId }).first();
    if (emp?.faculty_user_id) {
      await trx('faculty_users').where({ id: emp.faculty_user_id }).update({ is_active: false });
    }

    await recordHrAudit({ actor, action: 'SEPARATION_COMPLETED', entityType: 'employee_separation_requests', entityId: requestId });
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'SEPARATION_COMPLETED',
      title: 'Separation completed',
      dedupeKey: `sep-done-${requestId}`,
    });
    return { requestId, employeeId, status: finalStatus };
  });
}

export async function listSeparations(actor: HrActor, scope: 'admin' | 'manager') {
  if (scope === 'admin') assertHrPermission(actor, 'hr.employee.separate');
  let q = db('employee_separation_requests as s')
    .join('employees as e', 'e.id', 's.employee_id')
    .where({ 's.college_id': actor.collegeId })
    .select('s.*', 'e.display_name', 'e.employee_number');
  if (scope === 'manager') {
    const self = await db('employees').where({ faculty_user_id: actor.facultyUserId }).first();
    if (!self) return [];
    q = q.andWhere('e.reporting_manager_employee_id', self.id);
  }
  return q.orderBy('s.updated_at', 'desc');
}

export async function getSeparation(actor: HrActor, requestId: number) {
  assertHrPermission(actor, 'hr.employee.separate');
  const row = await db('employee_separation_requests as s')
    .join('employees as e', 'e.id', 's.employee_id')
    .where({ 's.id': requestId, 's.college_id': actor.collegeId })
    .select('s.*', 'e.display_name', 'e.employee_number')
    .first();
  if (!row) throw new AppError(404, 'Separation request not found');
  const clearance = await db('employee_separation_clearance').where({ separation_request_id: requestId });
  const assignments = await getSeparationAssignmentSummary(actor, Number(row.employee_id));
  return { ...row, clearance, operationalAssignments: assignments };
}
