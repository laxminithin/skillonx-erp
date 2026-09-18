import { db } from '../../db/index.js';
export async function recordQuizAudit(entry) {
    try {
        await db('quiz_audit_log').insert({
            college_id: entry.collegeId,
            quiz_id: entry.quizId,
            actor_id: entry.actorId ?? null,
            actor_name: entry.actorName ?? null,
            action: entry.action,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        });
    }
    catch (err) {
        console.error('[quiz-audit] failed to record event', entry.action, err);
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
export async function listQuizAudit(quizId, collegeId) {
    const rows = await db('quiz_audit_log as a')
        .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
        .where({ 'a.quiz_id': quizId, 'a.college_id': collegeId })
        .orderBy('a.created_at', 'desc')
        .limit(100)
        .select('a.id', 'a.action', 'a.metadata', 'a.created_at as createdAt', 'a.actor_name as actorName', 'f.name as actorCurrentName');
    return rows.map((r) => ({
        id: r.id,
        action: r.action,
        createdAt: r.createdAt,
        actor: r.actorCurrentName ?? r.actorName ?? 'System',
        metadata: parseJson(r.metadata),
    }));
}
