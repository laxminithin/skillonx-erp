/**
 * Employee L&D — development needs. May REFERENCE appraisal development actions
 * read-only; never mutates any appraisal record.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import type { HrActor } from '../types.js';
import { recordHrAudit } from '../audit.js';
import {
  assertHrPermission,
  hasHrPermission,
  requireSelfEmployee,
  selfEmployee,
  employeeInCollege,
  assertManagesEmployee,
  isSelf,
} from './access.js';
import { DEV_NEED_TRANSITIONS, canTransition } from './types.js';
import type { z } from 'zod';
import type { devNeedSchema } from './types.js';

export async function createNeed(actor: HrActor, input: z.infer<typeof devNeedSchema>) {
  assertHrPermission(actor, 'hr.ld.self');
  const self = await selfEmployee(actor);

  let employeeId: number;
  if (input.employeeId == null || (self && input.employeeId === self.id)) {
    employeeId = (await requireSelfEmployee(actor)).id;
  } else {
    // Creating for another employee requires management scope.
    const target = await employeeInCollege(actor, input.employeeId);
    await assertManagesEmployee(actor, target);
    employeeId = target.id;
  }

  // If sourced from appraisal, verify the referenced action exists in this college
  // (read-only — appraisal remains frozen and untouched).
  if (input.sourceType === 'APPRAISAL' && input.sourceRefId != null) {
    const action = await db('hr_appraisal_development_actions')
      .where({ id: input.sourceRefId, college_id: actor.collegeId })
      .first();
    if (!action) throw new AppError(400, 'Referenced appraisal development action not found');
  }

  const [id] = await db('ld_development_needs').insert({
    college_id: actor.collegeId,
    employee_id: employeeId,
    source_type: input.sourceType,
    source_ref_id: input.sourceRefId ?? null,
    development_area: input.developmentArea,
    target_competency: input.targetCompetency ?? null,
    priority: input.priority,
    target_period: input.targetPeriod ?? null,
    status: 'IDENTIFIED',
    created_by: actor.facultyUserId,
  });
  await recordHrAudit({ actor, action: 'LD_NEED_CREATED', entityType: 'ld_development_needs', entityId: id });
  return { id };
}

export async function listNeeds(actor: HrActor, opts: { employeeId?: number; status?: string } = {}) {
  assertHrPermission(actor, 'hr.ld.self');
  const self = await selfEmployee(actor);
  let q = db('ld_development_needs as n').where('n.college_id', actor.collegeId);

  if (opts.employeeId != null && !isSelf(self, opts.employeeId)) {
    const target = await employeeInCollege(actor, opts.employeeId);
    await assertManagesEmployee(actor, target);
    q = q.where('n.employee_id', opts.employeeId);
  } else if (opts.employeeId != null) {
    q = q.where('n.employee_id', opts.employeeId);
  } else if (!hasHrPermission(actor, 'hr.ld.view')) {
    // No target and not an admin viewer → own needs only.
    if (!self) return [];
    q = q.where('n.employee_id', self.id);
  }
  if (opts.status) q = q.where('n.status', opts.status);
  return q.orderBy('n.created_at', 'desc').select('n.*');
}

export async function transitionNeed(actor: HrActor, needId: number, status: string, reason?: string) {
  assertHrPermission(actor, 'hr.ld.self');
  const need = await db('ld_development_needs').where({ id: needId, college_id: actor.collegeId }).first();
  if (!need) throw new AppError(404, 'Development need not found');
  const self = await selfEmployee(actor);
  const target = await employeeInCollege(actor, Number(need.employee_id));
  const manages = hasHrPermission(actor, 'hr.ld.manage') || (await managesQuiet(actor, target));

  // Closing (COMPLETED / WAIVED) requires authorized confirmation — never self-only (§44).
  if ((status === 'COMPLETED' || status === 'WAIVED') && !manages) {
    throw new AppError(403, 'Only a manager/HR may complete or waive a development need');
  }
  // Other transitions: self on own need, or a manager.
  if (!isSelf(self, Number(need.employee_id)) && !manages) {
    throw new AppError(403, 'Development need is outside your scope');
  }
  const from = String(need.status);
  if (!canTransition(DEV_NEED_TRANSITIONS, from, status)) {
    throw new AppError(409, `Invalid development-need transition ${from} → ${status}`);
  }
  const patch: Record<string, unknown> = { status, updated_at: db.fn.now() };
  if (status === 'COMPLETED' || status === 'WAIVED' || status === 'CANCELLED') {
    patch.closed_by = actor.facultyUserId;
    patch.closed_at = db.fn.now();
    patch.close_reason = reason ?? null;
  }
  await db('ld_development_needs').where({ id: needId }).update(patch);
  await recordHrAudit({ actor, action: `LD_NEED_${status}`, entityType: 'ld_development_needs', entityId: needId, before: { status: from }, after: { status }, reason });
  return { id: needId, status };
}

async function managesQuiet(actor: HrActor, target: { id: number; college_id: number; department_id: number | null; reporting_manager_employee_id: number | null } & Record<string, unknown>): Promise<boolean> {
  try {
    await assertManagesEmployee(actor, target as never);
    return true;
  } catch {
    return false;
  }
}
