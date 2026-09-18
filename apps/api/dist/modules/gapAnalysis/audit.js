import { db } from '../../db/index.js';
export async function recordGapAudit(entry, trx) {
    const q = trx || db;
    try {
        await q('gap_analysis_audit_log').insert({
            college_id: entry.collegeId,
            analysis_id: entry.analysisId,
            item_id: entry.itemId ?? null,
            action_id: entry.actionId ?? null,
            actor_id: entry.actorId ?? null,
            actor_name: entry.actorName ?? null,
            action: entry.action,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        });
    }
    catch (err) {
        console.error('[gap-audit] failed to record event', entry.action, err);
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
export async function listGapAudit(analysisId, collegeId) {
    const rows = await db('gap_analysis_audit_log as a')
        .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
        .where({ 'a.analysis_id': analysisId, 'a.college_id': collegeId })
        .orderBy('a.created_at', 'desc')
        .limit(200)
        .select('a.id', 'a.action', 'a.metadata', 'a.created_at as createdAt', 'a.item_id as itemId', 'a.action_id as actionId', 'a.actor_name as actorName', 'f.name as actorCurrentName');
    return rows.map((r) => ({
        id: r.id,
        action: r.action,
        createdAt: r.createdAt,
        itemId: r.itemId == null ? null : Number(r.itemId),
        actionId: r.actionId == null ? null : Number(r.actionId),
        actor: r.actorCurrentName ?? r.actorName ?? 'System',
        metadata: parseJson(r.metadata),
    }));
}
