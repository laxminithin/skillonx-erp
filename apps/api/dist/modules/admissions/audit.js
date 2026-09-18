import { db } from '../../db/index.js';
export async function recordAdmissionAudit(input) {
    if (!(await db.schema.hasTable('admission_audit_log')))
        return;
    await db('admission_audit_log').insert({
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
    return recordAdmissionAudit({
        collegeId: actor.collegeId,
        actorType: actor.kind,
        actorId: actor.kind === 'FACULTY' ? actor.facultyUserId : actor.applicantId,
        action,
        entityType,
        entityId,
        beforeState: extra?.before,
        afterState: extra?.after,
        reason: extra?.reason ?? null,
    });
}
