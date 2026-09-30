import { db } from '../../db/index.js';
/** Mirrors `admissions/audit.ts`'s exact pattern, backed by `research_audit_log`. */
export async function recordResearchAudit(input) {
    if (!(await db.schema.hasTable('research_audit_log')))
        return;
    await db('research_audit_log').insert({
        college_id: input.collegeId,
        actor_type: input.actorType ?? 'FACULTY',
        actor_id: input.actorId ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        before_state: input.beforeState != null ? JSON.stringify(input.beforeState) : null,
        after_state: input.afterState != null ? JSON.stringify(input.afterState) : null,
        reason: input.reason ?? null,
    });
}
export function auditFromActor(actor, action, entityType, entityId, extra) {
    return recordResearchAudit({
        collegeId: actor.collegeId,
        actorType: 'FACULTY',
        actorId: actor.facultyUserId,
        action,
        entityType,
        entityId,
        beforeState: extra?.before,
        afterState: extra?.after,
        reason: extra?.reason ?? null,
    });
}
