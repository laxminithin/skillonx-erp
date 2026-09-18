import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { randomBytes } from 'node:crypto';
import {
  REQUISITION_TRANSITIONS,
  type RequisitionStatus,
  type Row,
  createRequisitionSchema,
  updateRequisitionSchema,
} from './recruitmentTypes.js';
import {
  assertDeptScope,
  assertRecruitmentTransition,
  ensureRecruitmentDefaults,
  hodDepartmentIds,
  isHodActor,
} from './recruitmentAccess.js';

function nextRequisitionCode() {
  return `REQ-${Date.now()}-${randomBytes(3).toString('hex')}`.slice(0, 48);
}

export function serializeRequisition(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    code: row.code,
    departmentId: Number(row.department_id),
    designationId: Number(row.designation_id),
    employmentTypeId: Number(row.employment_type_id),
    requestedHeadcount: Number(row.requested_headcount),
    approvedHeadcount: row.approved_headcount != null ? Number(row.approved_headcount) : null,
    reason: row.reason,
    positionType: row.position_type,
    replacementEmployeeId: row.replacement_employee_id != null ? Number(row.replacement_employee_id) : null,
    budgetReference: row.budget_reference,
    desiredJoiningDate: row.desired_joining_date,
    requestedBy: row.requested_by != null ? Number(row.requested_by) : null,
    status: row.status,
    departmentApprovedBy: row.department_approved_by != null ? Number(row.department_approved_by) : null,
    departmentApprovedAt: row.department_approved_at,
    hrReviewedBy: row.hr_reviewed_by != null ? Number(row.hr_reviewed_by) : null,
    hrReviewedAt: row.hr_reviewed_at,
    approvedBy: row.approved_by != null ? Number(row.approved_by) : null,
    approvedAt: row.approved_at,
    rejectedBy: row.rejected_by != null ? Number(row.rejected_by) : null,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadReq(actor: HrActor, id: number) {
  const row = await db('hr_recruitment_requisitions').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Requisition not found');
  return row;
}

export async function createRequisition(actor: HrActor, raw: unknown) {
  if (!hasHrPermission(actor, 'hr.recruitment.manage')) {
    if (!(isHodActor(actor) && hasHrPermission(actor, 'hr.recruitment.view'))) {
      assertHrPermission(actor, 'hr.recruitment.manage');
    }
  }
  await ensureRecruitmentDefaults(actor.collegeId);
  const input = createRequisitionSchema.parse(raw);
  assertDeptScope(actor, input.departmentId, 'hr.recruitment.view');

  const dept = await db('departments').where({ id: input.departmentId, college_id: actor.collegeId }).first();
  if (!dept) throw new AppError(400, 'Invalid department');
  const des = await db('hr_designations').where({ id: input.designationId, college_id: actor.collegeId }).first();
  if (!des) throw new AppError(400, 'Invalid designation');
  const et = await db('employment_types').where({ id: input.employmentTypeId, college_id: actor.collegeId }).first();
  if (!et) throw new AppError(400, 'Invalid employment type');

  return db.transaction(async (trx) => {
    const code = input.code ?? nextRequisitionCode();
    const [id] = await trx('hr_recruitment_requisitions').insert({
      college_id: actor.collegeId,
      code,
      department_id: input.departmentId,
      designation_id: input.designationId,
      employment_type_id: input.employmentTypeId,
      requested_headcount: input.requestedHeadcount,
      reason: input.reason ?? null,
      position_type: input.positionType,
      replacement_employee_id: input.replacementEmployeeId ?? null,
      budget_reference: input.budgetReference ?? null,
      desired_joining_date: input.desiredJoiningDate ?? null,
      requested_by: actor.facultyUserId,
      status: 'DRAFT',
    });
    const row = await trx('hr_recruitment_requisitions').where({ id }).first();
    await recordHrAudit({
      actor,
      action: 'REQUISITION_CREATED',
      entityType: 'hr_recruitment_requisitions',
      entityId: id,
      after: serializeRequisition(row!),
    });
    return serializeRequisition(row!);
  });
}

export async function updateRequisition(actor: HrActor, id: number, raw: unknown) {
  assertHrPermission(actor, 'hr.recruitment.manage');
  const existing = await loadReq(actor, id);
  if (String(existing.status) !== 'DRAFT') {
    throw new AppError(400, 'Only draft requisitions can be edited', undefined, 'REQUISITION_NOT_EDITABLE');
  }
  const input = updateRequisitionSchema.parse(raw);
  const updates: Row = {};
  if (input.departmentId != null) updates.department_id = input.departmentId;
  if (input.designationId != null) updates.designation_id = input.designationId;
  if (input.employmentTypeId != null) updates.employment_type_id = input.employmentTypeId;
  if (input.requestedHeadcount != null) updates.requested_headcount = input.requestedHeadcount;
  if (input.reason !== undefined) updates.reason = input.reason;
  if (input.positionType != null) updates.position_type = input.positionType;
  if (input.replacementEmployeeId !== undefined) updates.replacement_employee_id = input.replacementEmployeeId;
  if (input.budgetReference !== undefined) updates.budget_reference = input.budgetReference;
  if (input.desiredJoiningDate !== undefined) updates.desired_joining_date = input.desiredJoiningDate;
  if (Object.keys(updates).length) await db('hr_recruitment_requisitions').where({ id }).update(updates);
  return serializeRequisition(await loadReq(actor, id));
}

async function transitionRequisition(
  actor: HrActor,
  id: number,
  to: RequisitionStatus,
  permission: 'hr.recruitment.manage' | 'hr.recruitment.approve' | 'hr.recruitment.view',
  extra: Row = {},
) {
  assertHrPermission(actor, permission);
  const row = await loadReq(actor, id);
  assertDeptScope(actor, Number(row.department_id), permission);
  const from = String(row.status) as RequisitionStatus;
  assertRecruitmentTransition('REQUISITION', from, to, REQUISITION_TRANSITIONS[from] ?? []);
  await db('hr_recruitment_requisitions').where({ id }).update({ status: to, ...extra });
  const after = await loadReq(actor, id);
  await recordHrAudit({
    actor,
    action: `REQUISITION_${to}`,
    entityType: 'hr_recruitment_requisitions',
    entityId: id,
    before: { status: from },
    after: serializeRequisition(after),
  });
  return serializeRequisition(after);
}

export async function submitRequisition(actor: HrActor, id: number) {
  const row = await loadReq(actor, id);
  if (!hasHrPermission(actor, 'hr.recruitment.manage')) {
    if (!(isHodActor(actor) && hasHrPermission(actor, 'hr.recruitment.view'))) {
      assertHrPermission(actor, 'hr.recruitment.manage');
    }
    assertDeptScope(actor, Number(row.department_id), 'hr.recruitment.view');
  }
  return transitionRequisition(actor, id, 'SUBMITTED', isHodActor(actor) && !hasHrPermission(actor, 'hr.recruitment.manage') ? 'hr.recruitment.view' : 'hr.recruitment.manage');
}

export async function departmentApproveRequisition(actor: HrActor, id: number) {
  const canApprove =
    hasHrPermission(actor, 'hr.recruitment.approve') ||
    hasHrPermission(actor, 'hr.recruitment.manage') ||
    isHodActor(actor);
  if (!canApprove) throw new AppError(403, 'You do not have permission for this HR action');
  const row = await loadReq(actor, id);
  if (isHodActor(actor) && !hasHrPermission(actor, 'hr.recruitment.manage')) {
    const depts = hodDepartmentIds(actor);
    if (!depts.includes(Number(row.department_id))) {
      throw new AppError(403, 'Outside your department scope', undefined, 'RECRUITMENT_DEPT_SCOPE');
    }
  }
  return transitionRequisition(actor, id, 'DEPARTMENT_APPROVED', isHodActor(actor) ? 'hr.recruitment.view' : 'hr.recruitment.approve', {
    department_approved_by: actor.facultyUserId,
    department_approved_at: db.fn.now(),
  });
}

export async function moveToHrReview(actor: HrActor, id: number) {
  return transitionRequisition(actor, id, 'HR_REVIEW', 'hr.recruitment.manage', {
    hr_reviewed_by: actor.facultyUserId,
    hr_reviewed_at: db.fn.now(),
  });
}

export async function approveRequisition(actor: HrActor, id: number, raw?: unknown) {
  assertHrPermission(actor, 'hr.recruitment.approve');
  const row = await loadReq(actor, id);
  const body = (raw ?? {}) as { approvedHeadcount?: number };
  const approvedHeadcount = body.approvedHeadcount ?? Number(row.requested_headcount);
  return transitionRequisition(actor, id, 'APPROVED', 'hr.recruitment.approve', {
    approved_headcount: approvedHeadcount,
    approved_by: actor.facultyUserId,
    approved_at: db.fn.now(),
  });
}

export async function openRequisition(actor: HrActor, id: number) {
  return transitionRequisition(actor, id, 'OPENED', 'hr.recruitment.manage');
}

export async function closeRequisition(actor: HrActor, id: number) {
  return transitionRequisition(actor, id, 'CLOSED', 'hr.recruitment.manage');
}

export async function rejectRequisition(actor: HrActor, id: number, reason?: string) {
  assertHrPermission(actor, 'hr.recruitment.approve');
  return transitionRequisition(actor, id, 'REJECTED', 'hr.recruitment.approve', {
    rejected_by: actor.facultyUserId,
    rejected_at: db.fn.now(),
    rejection_reason: reason ?? null,
  });
}

export async function cancelRequisition(actor: HrActor, id: number, reason?: string) {
  return transitionRequisition(actor, id, 'CANCELLED', 'hr.recruitment.manage', {
    rejection_reason: reason ?? null,
  });
}

export async function getRequisition(actor: HrActor, id: number) {
  assertHrPermission(actor, 'hr.recruitment.view');
  const row = await loadReq(actor, id);
  assertDeptScope(actor, Number(row.department_id));
  return serializeRequisition(row);
}

export async function listRequisitions(actor: HrActor, status?: string) {
  assertHrPermission(actor, 'hr.recruitment.view');
  let q = db('hr_recruitment_requisitions').where({ college_id: actor.collegeId });
  if (status) q = q.andWhere({ status });
  if (isHodActor(actor) && !hasHrPermission(actor, 'hr.recruitment.manage')) {
    const depts = hodDepartmentIds(actor);
    if (!depts.length) return [];
    q = q.whereIn('department_id', depts);
  }
  const rows = await q.orderBy('id', 'desc');
  return rows.map(serializeRequisition);
}
