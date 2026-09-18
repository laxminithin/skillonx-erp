import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { recordServicesAudit } from '../studentServices/audit.js';
import { getRiskConfig } from './riskEngine.js';
import type { MentoringActor } from './types.js';
import type { z } from 'zod';
import type { riskConfigSchema } from './types.js';

export async function getRiskConfigView(collegeId: number) {
  const custom = (await db.schema.hasTable('mentoring_risk_config'))
    ? await db('mentoring_risk_config').where({ college_id: collegeId }).first()
    : null;
  const effective = await getRiskConfig(collegeId);
  return { effective, isCustom: !!custom };
}

/** Only SUPER_ADMIN / COLLEGE_ADMIN may alter institution-wide risk rules. */
export async function updateRiskConfig(actor: MentoringActor, input: z.infer<typeof riskConfigSchema>) {
  if (!isAdminRole(actor.role)) {
    throw new AppError(403, 'Only administrators may change institution risk configuration');
  }
  const existing = await db('mentoring_risk_config').where({ college_id: actor.collegeId }).first();
  const map: Record<string, unknown> = {
    attendance_attention_pct: input.attendanceAttentionPct,
    attendance_high_pct: input.attendanceHighPct,
    cie_attention_pct: input.cieAttentionPct,
    assignment_miss_attention: input.assignmentMissAttention,
    assignment_miss_high: input.assignmentMissHigh,
    backlog_watch: input.backlogWatch,
    backlog_attention: input.backlogAttention,
    backlog_high: input.backlogHigh,
    followup_overdue_days: input.followupOverdueDays,
  };
  const patch: Record<string, unknown> = { updated_by_faculty_id: actor.facultyUserId, updated_at: db.fn.now() };
  for (const [k, v] of Object.entries(map)) if (v !== undefined) patch[k] = v;

  if (existing) {
    await db('mentoring_risk_config').where({ id: existing.id }).update(patch);
  } else {
    await db('mentoring_risk_config').insert({ college_id: actor.collegeId, ...patch });
  }

  await recordServicesAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    actorType: 'FACULTY',
    actorName: actor.name,
    action: 'MENTORING_RISK_CONFIG_CHANGED',
    entityType: 'mentoring_risk_config',
    entityId: existing ? Number(existing.id) : null,
    afterState: patch,
  });

  return getRiskConfigView(actor.collegeId);
}
