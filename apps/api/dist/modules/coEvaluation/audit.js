import { db } from '../../db/index.js';
export async function recordCoEvalAudit(entry, trx) {
    const q = trx || db;
    try {
        await q('co_evaluation_audit_log').insert({
            college_id: entry.collegeId,
            evaluation_id: entry.evaluationId,
            cell_id: entry.cellId ?? null,
            co_row_id: entry.coRowId ?? null,
            actor_id: entry.actorId ?? null,
            actor_name: entry.actorName ?? null,
            action: entry.action,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        });
    }
    catch (err) {
        console.error('[co-eval-audit] failed to record event', entry.action, err);
    }
}
function parseJson(value) {
    if (value == null)
        return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
export async function listCoEvalAudit(evaluationId, collegeId) {
    const rows = await db('co_evaluation_audit_log as a')
        .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
        .where({ 'a.evaluation_id': evaluationId, 'a.college_id': collegeId })
        .orderBy('a.created_at', 'desc')
        .limit(300)
        .select('a.id', 'a.action', 'a.metadata', 'a.created_at as createdAt', 'a.cell_id as cellId', 'a.co_row_id as coRowId', 'a.actor_name as actorName', 'f.name as actorCurrentName');
    return rows.map((r) => ({
        id: r.id,
        action: r.action,
        createdAt: r.createdAt,
        cellId: r.cellId == null ? null : Number(r.cellId),
        coRowId: r.coRowId == null ? null : Number(r.coRowId),
        actor: r.actorCurrentName ?? r.actorName ?? 'System',
        metadata: parseJson(r.metadata),
    }));
}
