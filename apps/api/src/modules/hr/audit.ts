import { db } from '../../db/index.js';
import type { HrActor } from './types.js';

export async function recordHrAudit(params: {
  actor: HrActor;
  action: string;
  entityType: string;
  entityId?: number | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
}) {
  if (!(await db.schema.hasTable('hr_audit_log'))) return;
  await db('hr_audit_log').insert({
    college_id: params.actor.collegeId,
    actor_faculty_id: params.actor.facultyUserId,
    actor_employee_id: params.actor.employeeId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before_state: params.before ? JSON.stringify(params.before) : null,
    after_state: params.after ? JSON.stringify(params.after) : null,
    reason: params.reason ?? null,
  });
}
