import { db } from '../../db/index.js';
export async function recordPlacementAudit(input) {
    if (!(await db.schema.hasTable('placement_audit_log')))
        return;
    await db('placement_audit_log').insert({
        college_id: input.collegeId,
        actor_id: input.actorId ?? null,
        actor_type: input.actorType ?? 'FACULTY',
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        before_state: input.beforeState != null ? JSON.stringify(input.beforeState) : null,
        after_state: input.afterState != null ? JSON.stringify(input.afterState) : null,
        reason: input.reason ?? null,
    });
}
