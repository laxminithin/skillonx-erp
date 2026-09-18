import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { parseJson } from './json.js';

export async function recordAttainmentAudit(
  entry: {
    collegeId: number;
    runId?: number | null;
    cycleId?: number | null;
    sheetId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    action: string;
    metadata?: Record<string, unknown> | null;
  },
  trx?: Knex.Transaction,
) {
  const q = trx || db;
  try {
    await q('attainment_audit_log').insert({
      college_id: entry.collegeId,
      run_id: entry.runId ?? null,
      cycle_id: entry.cycleId ?? null,
      sheet_id: entry.sheetId ?? null,
      actor_id: entry.actorId ?? null,
      actor_name: entry.actorName ?? null,
      action: entry.action,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });
  } catch (err) {
    console.error('[attainment-audit] failed to record event', entry.action, err);
  }
}

export async function listAttainmentAudit(collegeId: number, opts: { runId?: number; cycleId?: number }) {
  const q = db('attainment_audit_log as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.actor_id')
    .where({ 'a.college_id': collegeId })
    .orderBy('a.created_at', 'desc')
    .limit(300)
    .select(
      'a.id',
      'a.action',
      'a.metadata',
      'a.created_at as createdAt',
      'a.run_id as runId',
      'a.cycle_id as cycleId',
      'a.actor_name as actorName',
      'f.name as actorCurrentName',
    );
  if (opts.runId) q.andWhere('a.run_id', opts.runId);
  if (opts.cycleId) q.andWhere('a.cycle_id', opts.cycleId);
  const rows = await q;
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    createdAt: r.createdAt,
    runId: r.runId == null ? null : Number(r.runId),
    cycleId: r.cycleId == null ? null : Number(r.cycleId),
    actor: r.actorCurrentName ?? r.actorName ?? 'System',
    metadata: parseJson<Record<string, unknown> | null>(r.metadata, null),
  }));
}
