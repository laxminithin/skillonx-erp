import { db } from '../../db/index.js';
export async function recordFinanceAudit(params) {
    try {
        await db('finance_audit_log').insert({
            college_id: params.collegeId,
            actor_id: params.actorId ?? null,
            actor_type: params.actorType ?? 'FACULTY',
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId ?? null,
            before_state: params.beforeState != null ? JSON.stringify(params.beforeState) : null,
            after_state: params.afterState != null ? JSON.stringify(params.afterState) : null,
            reason: params.reason ?? null,
        });
    }
    catch {
        /* non-blocking */
    }
}
