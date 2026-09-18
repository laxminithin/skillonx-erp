import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrCollege, assertHrPermission, assertManagerScope } from './access.js';
import { recordHrAudit } from './audit.js';
import { notifyEmployee } from './notifications.js';
import { serializeEmployee, getOperationalAssignments } from './employees.js';
import {
  closeActiveEmploymentRecord,
  createEmploymentRecord,
  recordServiceEvent,
  resolveProbationPolicy,
  transitionEmploymentStatus,
  validateCollegeRefs,
} from './lifecycleCore.js';

type Row = Record<string, unknown>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureDate(date: string) {
  return date > todayISO();
}

export async function recommendProbation(actor: HrActor, reviewId: number, input: {
  recommendation: string;
  performanceSummary?: string;
  remarks?: string;
}) {
  const review = await db('employee_probation_reviews').where({ id: reviewId }).first();
  if (!review) throw new AppError(404, 'Probation review not found');
  await assertHrCollege('employees', Number(review.employee_id), actor.collegeId);
  await assertManagerScope(actor, Number(review.employee_id));
  await db('employee_probation_reviews').where({ id: reviewId }).update({
    manager_recommendation: input.recommendation,
    performance_summary: input.performanceSummary ?? null,
    manager_notes: input.remarks ?? null,
    status: 'RECOMMENDED_CONFIRM',
    reviewed_by: actor.facultyUserId,
  });
  await recordHrAudit({ actor, action: 'PROBATION_RECOMMENDED', entityType: 'employee_probation_reviews', entityId: reviewId });
  return { reviewId, recommendation: input.recommendation };
}

export async function confirmEmployee(actor: HrActor, reviewId: number, input: { effectiveDate?: string; reference?: string }) {
  assertHrPermission(actor, 'hr.employee.manage');
  const review = await db('employee_probation_reviews').where({ id: reviewId }).first();
  if (!review) throw new AppError(404, 'Probation review not found');
  const employeeId = Number(review.employee_id);
  await assertHrCollege('employees', employeeId, actor.collegeId);
  const effectiveDate = input.effectiveDate ?? todayISO();

  return db.transaction(async (trx) => {
    await trx('employee_probation_reviews').where({ id: reviewId }).update({
      status: 'CONFIRMED',
      final_decision: 'CONFIRMED',
      decision_date: effectiveDate,
      hr_recommendation: 'CONFIRMED',
    });
    await trx('employees').where({ id: employeeId }).update({
      employment_status: 'CONFIRMED',
      confirmation_date: effectiveDate,
    });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'CONFIRMED',
      effectiveDate,
      details: { reviewId, reference: input.reference, idempotencyKey: `confirm-${reviewId}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'EMPLOYEE_CONFIRMED', entityType: 'employees', entityId: employeeId });
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'CONFIRMATION',
      title: 'Employment confirmed',
      dedupeKey: `confirm-${employeeId}-${effectiveDate}`,
    });
    return { employeeId, status: 'CONFIRMED' };
  });
}

export async function extendProbation(actor: HrActor, reviewId: number, input: { newEndDate: string; reason: string }) {
  assertHrPermission(actor, 'hr.employee.manage');
  const review = await db('employee_probation_reviews').where({ id: reviewId }).first();
  if (!review) throw new AppError(404, 'Probation review not found');
  const employeeId = Number(review.employee_id);
  await assertHrCollege('employees', employeeId, actor.collegeId);

  return db.transaction(async (trx) => {
    await trx('employee_probation_reviews').where({ id: reviewId }).update({
      current_end_date: input.newEndDate,
      extension_reason: input.reason,
      status: 'EXTENDED',
    });
    await trx('employees').where({ id: employeeId }).update({ probation_end_date: input.newEndDate });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'PROBATION_EXTENDED',
      effectiveDate: todayISO(),
      details: {
        originalEnd: review.original_end_date,
        newEnd: input.newEndDate,
        idempotencyKey: `extend-${reviewId}-${input.newEndDate}`,
      },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'PROBATION_EXTENDED', entityType: 'employee_probation_reviews', entityId: reviewId, reason: input.reason });
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'PROBATION_EXTENDED',
      title: 'Probation extended',
      body: input.reason,
      dedupeKey: `probation-ext-${reviewId}`,
    });
    return { reviewId, newEndDate: input.newEndDate };
  });
}

export async function listProbation(actor: HrActor, scope: 'admin' | 'manager') {
  if (scope === 'admin') assertHrPermission(actor, 'hr.employee.view');
  if (!(await db.schema.hasTable('employee_probation_reviews'))) return [];
  let q = db('employee_probation_reviews as p')
    .join('employees as e', 'e.id', 'p.employee_id')
    .where({ 'p.college_id': actor.collegeId })
    .select('p.*', 'e.display_name', 'e.employee_number', 'e.department_id');
  if (await db.schema.hasColumn('employee_probation_reviews', 'status')) {
    q = q.whereIn('p.status', ['ACTIVE', 'REVIEW_DUE']);
  }
  if (scope === 'manager') {
    const self = await db('employees').where({ faculty_user_id: actor.facultyUserId }).first();
    if (!self) return [];
    q = q.andWhere('e.reporting_manager_employee_id', self.id);
  }
  if (await db.schema.hasColumn('employee_probation_reviews', 'current_end_date')) {
    return q.orderBy('p.current_end_date', 'asc');
  }
  return q.orderBy('p.review_date', 'asc');
}

async function scheduleOrApplyCareerAction(
  actor: HrActor,
  employeeId: number,
  actionType: string,
  effectiveDate: string,
  payload: Row,
  reason?: string,
) {
  const emp = await assertHrCollege('employees', employeeId, actor.collegeId);
  if (['SEPARATED', 'RETIRED', 'TERMINATED', 'INACTIVE'].includes(String(emp.employment_status))) {
    throw new AppError(400, 'Employee is not active');
  }

  const pending = await db('employee_career_actions')
    .where({ employee_id: employeeId, status: 'PENDING' })
    .first()
    .catch(() => null);
  if (pending) throw new AppError(409, 'Employee has a pending career action', undefined, 'PENDING_CAREER_ACTION');

  if (isFutureDate(effectiveDate) && (await db.schema.hasTable('employee_career_actions'))) {
    const [id] = await db('employee_career_actions').insert({
      college_id: actor.collegeId,
      employee_id: employeeId,
      action_type: actionType,
      status: 'SCHEDULED',
      effective_date: effectiveDate,
      payload: JSON.stringify(payload),
      reason: reason ?? null,
      approved_by: actor.facultyUserId,
    });
    return { scheduled: true, careerActionId: id, effectiveDate };
  }

  return { scheduled: false, effectiveDate, payload };
}

export async function promoteEmployee(actor: HrActor, employeeId: number, input: {
  newDesignationId: number;
  effectiveDate: string;
  newGradeId?: number | null;
  reason?: string;
  approvalReference?: string;
}) {
  assertHrPermission(actor, 'hr.employee.promote');
  const emp = await assertHrCollege('employees', employeeId, actor.collegeId);
  await validateCollegeRefs(actor.collegeId, { designationId: input.newDesignationId });

  const schedule = await scheduleOrApplyCareerAction(actor, employeeId, 'PROMOTION', input.effectiveDate, input, input.reason);
  if (schedule.scheduled) return schedule;

  return db.transaction(async (trx) => {
    const oldDesId = emp.designation_id;
    await closeActiveEmploymentRecord(trx, employeeId, input.effectiveDate);
    await createEmploymentRecord(trx, {
      collegeId: actor.collegeId,
      employeeId,
      employmentTypeId: emp.employment_type_id as number,
      departmentId: emp.department_id as number,
      designationId: input.newDesignationId,
      reportingManagerEmployeeId: emp.reporting_manager_employee_id as number | null,
      effectiveFrom: input.effectiveDate,
      createdBy: actor.facultyUserId,
      remarks: input.reason ?? 'Promotion',
    });
    await trx('employees').where({ id: employeeId }).update({ designation_id: input.newDesignationId });
    const [promoId] = await trx('employee_promotion_records').insert({
      college_id: actor.collegeId,
      employee_id: employeeId,
      old_designation_id: oldDesId,
      new_designation_id: input.newDesignationId,
      effective_date: input.effectiveDate,
      reason: input.reason ?? null,
      approved_by: actor.facultyUserId,
      status: 'APPLIED',
    });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'PROMOTED',
      effectiveDate: input.effectiveDate,
      details: { promotionId: promoId, idempotencyKey: `promo-${promoId}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'PROMOTION', entityType: 'employees', entityId: employeeId, reason: input.reason });
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'PROMOTION',
      title: 'Promotion recorded',
      dedupeKey: `promo-${promoId}`,
    });
    return { promotionId: promoId, effectiveDate: input.effectiveDate };
  });
}

export async function transferEmployee(actor: HrActor, employeeId: number, input: {
  toDepartmentId: number;
  effectiveDate: string;
  newReportingManagerEmployeeId?: number | null;
  newDesignationId?: number | null;
  reason?: string;
}) {
  assertHrPermission(actor, 'hr.employee.transfer');
  const emp = await assertHrCollege('employees', employeeId, actor.collegeId);
  await validateCollegeRefs(actor.collegeId, {
    departmentId: input.toDepartmentId,
    reportingManagerEmployeeId: input.newReportingManagerEmployeeId,
    designationId: input.newDesignationId,
  });

  const ops = await getOperationalAssignments(actor, employeeId);
  const academicActive = (ops.academic as unknown[]).length > 0;

  const schedule = await scheduleOrApplyCareerAction(actor, employeeId, 'TRANSFER', input.effectiveDate, input, input.reason);
  if (schedule.scheduled) return { ...schedule, academicAssignmentWarning: academicActive };

  return db.transaction(async (trx) => {
    const oldDept = emp.department_id;
    const oldMgr = emp.reporting_manager_employee_id;
    const designationId = input.newDesignationId ?? emp.designation_id;
    await closeActiveEmploymentRecord(trx, employeeId, input.effectiveDate);
    await createEmploymentRecord(trx, {
      collegeId: actor.collegeId,
      employeeId,
      employmentTypeId: emp.employment_type_id as number,
      departmentId: input.toDepartmentId,
      designationId: designationId as number,
      reportingManagerEmployeeId: input.newReportingManagerEmployeeId ?? (oldMgr as number | null),
      effectiveFrom: input.effectiveDate,
      createdBy: actor.facultyUserId,
      remarks: input.reason ?? 'Transfer',
    });
    await trx('employees').where({ id: employeeId }).update({
      department_id: input.toDepartmentId,
      reporting_manager_employee_id: input.newReportingManagerEmployeeId ?? oldMgr,
      designation_id: designationId,
    });
    const [transferId] = await trx('employee_transfer_records').insert({
      college_id: actor.collegeId,
      employee_id: employeeId,
      from_department_id: oldDept,
      to_department_id: input.toDepartmentId,
      old_reporting_manager_id: oldMgr,
      new_reporting_manager_id: input.newReportingManagerEmployeeId ?? oldMgr,
      effective_date: input.effectiveDate,
      reason: input.reason ?? null,
      approved_by: actor.facultyUserId,
      status: 'APPLIED',
    });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'DEPARTMENT_TRANSFERRED',
      effectiveDate: input.effectiveDate,
      details: { transferId, idempotencyKey: `transfer-${transferId}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'TRANSFER', entityType: 'employees', entityId: employeeId, reason: input.reason });
    await notifyEmployee({
      employeeId,
      collegeId: actor.collegeId,
      type: 'TRANSFER',
      title: 'Department transfer recorded',
      dedupeKey: `transfer-${transferId}`,
    });
    return { transferId, effectiveDate: input.effectiveDate, academicAssignmentWarning: academicActive };
  });
}

export async function changeReportingManager(actor: HrActor, employeeId: number, input: {
  reportingManagerEmployeeId: number | null;
  effectiveDate: string;
  reason?: string;
}) {
  assertHrPermission(actor, 'hr.employee.transfer');
  const emp = await assertHrCollege('employees', employeeId, actor.collegeId);
  await validateCollegeRefs(actor.collegeId, { reportingManagerEmployeeId: input.reportingManagerEmployeeId });

  const schedule = await scheduleOrApplyCareerAction(actor, employeeId, 'REPORTING_CHANGE', input.effectiveDate, input, input.reason);
  if (schedule.scheduled) return schedule;

  return db.transaction(async (trx) => {
    const oldMgr = emp.reporting_manager_employee_id;
    await trx('employees').where({ id: employeeId }).update({ reporting_manager_employee_id: input.reportingManagerEmployeeId });
    if (await db.schema.hasTable('employee_reporting_assignments')) {
      await trx('employee_reporting_assignments')
        .where({ employee_id: employeeId })
        .whereNull('effective_to')
        .update({ effective_to: input.effectiveDate });
      await trx('employee_reporting_assignments').insert({
        college_id: actor.collegeId,
        employee_id: employeeId,
        reporting_manager_employee_id: input.reportingManagerEmployeeId,
        effective_from: input.effectiveDate,
        reason: input.reason ?? null,
        created_by: actor.facultyUserId,
      });
    }
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'REPORTING_MANAGER_CHANGED',
      effectiveDate: input.effectiveDate,
      details: { from: oldMgr, to: input.reportingManagerEmployeeId, idempotencyKey: `mgr-${employeeId}-${input.effectiveDate}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'REPORTING_CHANGED', entityType: 'employees', entityId: employeeId, reason: input.reason });
    return { employeeId, reportingManagerEmployeeId: input.reportingManagerEmployeeId };
  });
}

export async function changeDesignation(actor: HrActor, employeeId: number, input: {
  newDesignationId: number;
  effectiveDate: string;
  reason: string;
}) {
  assertHrPermission(actor, 'hr.employee.promote');
  await validateCollegeRefs(actor.collegeId, { designationId: input.newDesignationId });
  const emp = await assertHrCollege('employees', employeeId, actor.collegeId);

  const schedule = await scheduleOrApplyCareerAction(actor, employeeId, 'DESIGNATION_CHANGE', input.effectiveDate, input, input.reason);
  if (schedule.scheduled) return schedule;

  return db.transaction(async (trx) => {
    const oldDes = emp.designation_id;
    await closeActiveEmploymentRecord(trx, employeeId, input.effectiveDate);
    await createEmploymentRecord(trx, {
      collegeId: actor.collegeId,
      employeeId,
      employmentTypeId: emp.employment_type_id as number,
      departmentId: emp.department_id as number,
      designationId: input.newDesignationId,
      reportingManagerEmployeeId: emp.reporting_manager_employee_id as number | null,
      effectiveFrom: input.effectiveDate,
      createdBy: actor.facultyUserId,
      remarks: input.reason,
    });
    await trx('employees').where({ id: employeeId }).update({ designation_id: input.newDesignationId });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'DESIGNATION_CHANGED',
      effectiveDate: input.effectiveDate,
      details: { from: oldDes, to: input.newDesignationId, idempotencyKey: `des-${employeeId}-${input.effectiveDate}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'DESIGNATION_CHANGED', entityType: 'employees', entityId: employeeId, reason: input.reason });
    return { employeeId, newDesignationId: input.newDesignationId };
  });
}

export async function listCareerActions(actor: HrActor, employeeId: number) {
  await assertHrCollege('employees', employeeId, actor.collegeId);
  assertHrPermission(actor, 'hr.employee.view');
  if (!(await db.schema.hasTable('employee_career_actions'))) return [];
  return db('employee_career_actions').where({ employee_id: employeeId }).orderBy('effective_date', 'desc');
}

export async function createContract(actor: HrActor, employeeId: number, input: {
  contractType: string;
  startDate: string;
  endDate: string;
  noticePeriodDays?: number;
  reference?: string;
  remarks?: string;
}) {
  assertHrPermission(actor, 'hr.employee.manage');
  await assertHrCollege('employees', employeeId, actor.collegeId);
  const [id] = await db('employee_contracts').insert({
    college_id: actor.collegeId,
    employee_id: employeeId,
    contract_type: input.contractType,
    start_date: input.startDate,
    end_date: input.endDate,
    notice_period_days: input.noticePeriodDays ?? null,
    reference: input.reference ?? null,
    remarks: input.remarks ?? null,
    status: 'ACTIVE',
    renewal_status: 'ACTIVE',
    created_by: actor.facultyUserId,
  });
  await recordHrAudit({ actor, action: 'CONTRACT_CREATED', entityType: 'employee_contracts', entityId: id });
  return { id };
}

export async function renewContract(actor: HrActor, contractId: number, input: { startDate: string; endDate: string; reference?: string }) {
  assertHrPermission(actor, 'hr.employee.manage');
  const old = await db('employee_contracts').where({ id: contractId }).first();
  if (!old) throw new AppError(404, 'Contract not found');
  if (Number(old.college_id) !== actor.collegeId) throw new AppError(404, 'Contract not found');
  const employeeId = Number(old.employee_id);

  return db.transaction(async (trx) => {
    await trx('employee_contracts').where({ id: contractId }).update({ status: 'RENEWED', renewal_status: 'RENEWED' });
    const [newId] = await trx('employee_contracts').insert({
      college_id: actor.collegeId,
      employee_id: employeeId,
      contract_type: old.contract_type,
      start_date: input.startDate,
      end_date: input.endDate,
      notice_period_days: old.notice_period_days,
      reference: input.reference ?? old.reference,
      status: 'ACTIVE',
      renewal_status: 'ACTIVE',
      created_by: actor.facultyUserId,
    });
    await recordServiceEvent(trx, {
      collegeId: actor.collegeId,
      employeeId,
      eventType: 'CONTRACT_RENEWED',
      effectiveDate: input.startDate,
      details: { oldContractId: contractId, newContractId: newId, idempotencyKey: `renew-${contractId}-${newId}` },
      recordedBy: actor.facultyUserId,
    });
    await recordHrAudit({ actor, action: 'CONTRACT_RENEWED', entityType: 'employee_contracts', entityId: newId });
    return { oldContractId: contractId, newContractId: newId };
  });
}

export async function terminateContract(actor: HrActor, contractId: number, reason: string) {
  assertHrPermission(actor, 'hr.employee.manage');
  const contract = await db('employee_contracts').where({ id: contractId }).first();
  if (!contract || Number(contract.college_id) !== actor.collegeId) throw new AppError(404, 'Contract not found');
  await db('employee_contracts').where({ id: contractId }).update({ status: 'TERMINATED', renewal_status: 'TERMINATED' });
  await recordHrAudit({ actor, action: 'CONTRACT_TERMINATED', entityType: 'employee_contracts', entityId: contractId, reason });
  return { contractId, status: 'TERMINATED' };
}

export async function listContracts(actor: HrActor, employeeId: number) {
  await assertHrCollege('employees', employeeId, actor.collegeId);
  assertHrPermission(actor, 'hr.employee.view');
  return db('employee_contracts').where({ employee_id: employeeId }).orderBy('start_date', 'desc');
}

export async function suspendEmployee(actor: HrActor, employeeId: number, input: { effectiveDate: string; reason: string }) {
  assertHrPermission(actor, 'hr.employee.separate');
  return db.transaction(async (trx) => {
    await transitionEmploymentStatus(trx, actor, employeeId, 'SUSPENDED', input.effectiveDate, 'SUSPENDED', { reason: input.reason }, input.reason);
    return { employeeId, status: 'SUSPENDED' };
  });
}

export async function reinstateEmployee(actor: HrActor, employeeId: number, input: { effectiveDate: string; reason: string; toStatus?: string }) {
  assertHrPermission(actor, 'hr.employee.manage');
  const toStatus = input.toStatus ?? 'ACTIVE';
  return db.transaction(async (trx) => {
    await transitionEmploymentStatus(trx, actor, employeeId, toStatus, input.effectiveDate, 'REINSTATED', {}, input.reason);
    return { employeeId, status: toStatus };
  });
}
