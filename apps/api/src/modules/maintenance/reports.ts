import { db } from '../../db/index.js';
import type { MaintActor } from './types.js';
import { OPEN_STATUSES } from './types.js';
import { assertMaintPermission, hodDepartmentIds } from './access.js';

/**
 * Operational reports + recurring-issue analytics. All deterministic aggregated
 * SQL — evidence and counts only, NO opaque AI. HOD reports are scoped to their
 * department(s); manager/principal/management see the whole college.
 */
export async function reports(actor: MaintActor) {
  assertMaintPermission(actor, 'maint.report.view');
  const collegeId = actor.collegeId;
  let deptFilter: number[] | null = null;
  if (actor.role === 'HOD') {
    deptFilter = await hodDepartmentIds(actor);
    if (deptFilter.length === 0) deptFilter = [-1];
  }
  const scoped = <Q extends { whereIn: (c: string, v: number[]) => Q }>(q: Q, col = 't.department_id') => (deptFilter ? q.whereIn(col, deptFilter) : q);

  const base = () => scoped(db('service_tickets as t').where('t.college_id', collegeId));

  const totals = await base().select('status').count<{ status: string; n: number }[]>('* as n').groupBy('status');
  const byStatus: Record<string, number> = {};
  for (const r of totals) byStatus[String(r.status)] = Number(r.n);
  const open = Object.entries(byStatus).filter(([s]) => OPEN_STATUSES.includes(s as never)).reduce((a, [, n]) => a + n, 0);

  const byCategory = await scoped(db('service_tickets as t').leftJoin('service_categories as c', 'c.id', 't.category_id').where('t.college_id', collegeId))
    .select('c.name as category', 'c.kind as kind').count<{ category: string; kind: string; n: number }[]>('* as n').groupBy('c.name', 'c.kind').orderBy('n', 'desc');

  const byPriority = await base().select('priority').count<{ priority: string; n: number }[]>('* as n').groupBy('priority');

  const byTeam = await scoped(db('service_tickets as t').leftJoin('service_teams as tm', 'tm.id', 't.team_id').where('t.college_id', collegeId))
    .select('tm.name as team')
    .count<{ team: string; n: number; open_n: number; resolved_n: number }[]>('* as n')
    .select(db.raw(`SUM(CASE WHEN t.status IN ('OPEN','TRIAGED','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','WAITING_PARTS','WAITING_APPROVAL','WAITING_REQUESTER','REOPENED') THEN 1 ELSE 0 END) as open_n`))
    .select(db.raw(`SUM(CASE WHEN t.status IN ('RESOLVED','CONFIRMED','CLOSED') THEN 1 ELSE 0 END) as resolved_n`))
    .groupBy('tm.name');

  // Average resolution time (hours) for resolved tickets.
  const avgRow = await base().whereNotNull('t.resolved_at')
    .select(db.raw('AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.resolved_at)) as avg_min')).first();
  const avgResolutionHours = avgRow?.avg_min != null ? Math.round((Number(avgRow.avg_min) / 60) * 10) / 10 : null;

  // SLA compliance (resolved within stored due, accounting for pause).
  const slaRows = await base().whereNotNull('t.resolved_at').whereNotNull('t.sla_resolve_due_at')
    .select('t.resolved_at', 't.sla_resolve_due_at', 't.sla_paused_ms');
  let met = 0; let missed = 0;
  for (const r of slaRows) {
    const due = new Date(r.sla_resolve_due_at).getTime() + Number(r.sla_paused_ms ?? 0);
    if (new Date(r.resolved_at).getTime() <= due) met += 1; else missed += 1;
  }
  const slaCompliance = slaRows.length ? Math.round((met / slaRows.length) * 1000) / 10 : null;

  const reopened = await base().where('t.reopen_count', '>', 0).count<{ n: number }[]>('* as n');
  const pendingParts = await scoped(db('service_part_requests as p').join('service_tickets as t', 't.id', 'p.ticket_id').where('p.college_id', collegeId))
    .where('p.status', 'REQUESTED').count<{ n: number }[]>('* as n');

  const byLocation = await scoped(db('service_tickets as t').leftJoin('rooms as r', 'r.id', 't.room_id').where('t.college_id', collegeId))
    .whereNotNull('t.room_id').select('r.name as room', 'r.building as building')
    .count<{ room: string; building: string; n: number }[]>('* as n').groupBy('r.name', 'r.building').orderBy('n', 'desc').limit(15);

  const itVsFacilities = await scoped(db('service_tickets as t').leftJoin('service_categories as c', 'c.id', 't.category_id').where('t.college_id', collegeId))
    .select('c.kind as kind').count<{ kind: string; n: number }[]>('* as n').groupBy('c.kind');

  return {
    summary: { open, byStatus, avgResolutionHours, slaCompliance, slaSampleSize: slaRows.length, reopened: Number(reopened[0]?.n ?? 0), pendingParts: Number(pendingParts[0]?.n ?? 0) },
    byCategory: byCategory.map((r) => ({ category: r.category ?? 'Uncategorized', kind: r.kind ?? null, count: Number(r.n) })),
    byPriority: byPriority.map((r) => ({ priority: r.priority, count: Number(r.n) })),
    byTeam: byTeam.map((r) => ({ team: r.team ?? 'Unassigned', total: Number(r.n), open: Number(r.open_n), resolved: Number(r.resolved_n) })),
    byLocation: byLocation.map((r) => ({ room: r.room, building: r.building, count: Number(r.n) })),
    itVsFacilities: itVsFacilities.map((r) => ({ kind: r.kind ?? 'UNKNOWN', count: Number(r.n) })),
    recurring: await recurringIssues(actor, deptFilter),
  };
}

/**
 * Recurring-issue detection — deterministic. Surfaces repeated failures with
 * evidence (counts), never a black-box score.
 */
export async function recurringIssues(actor: MaintActor, deptFilter?: number[] | null) {
  const collegeId = actor.collegeId;
  const depts = deptFilter === undefined ? (actor.role === 'HOD' ? await hodDepartmentIds(actor) : null) : deptFilter;
  const scoped = <Q extends { whereIn: (c: string, v: number[]) => Q }>(q: Q) => (depts ? q.whereIn('t.department_id', depts.length ? depts : [-1]) : q);

  // Same asset repeated failures.
  const byAsset = await scoped(db('service_tickets as t').where('t.college_id', collegeId).whereNotNull('t.asset_ref'))
    .select('t.asset_ref').count<{ asset_ref: string; n: number }[]>('* as n').groupBy('t.asset_ref').having(db.raw('COUNT(*) >= 2')).orderBy('n', 'desc').limit(20);

  // Same room + category recurrence.
  const byRoomCat = await scoped(db('service_tickets as t').leftJoin('rooms as r', 'r.id', 't.room_id').leftJoin('service_categories as c', 'c.id', 't.category_id').where('t.college_id', collegeId).whereNotNull('t.room_id'))
    .select('r.name as room', 'r.building as building', 'c.name as category')
    .count<{ room: string; building: string; category: string; n: number }[]>('* as n')
    .groupBy('r.name', 'r.building', 'c.name').having(db.raw('COUNT(*) >= 2')).orderBy('n', 'desc').limit(20);

  return {
    byAsset: byAsset.map((r) => ({ assetRef: r.asset_ref, failures: Number(r.n) })),
    byRoomCategory: byRoomCat.map((r) => ({ room: r.room, building: r.building, category: r.category, occurrences: Number(r.n) })),
  };
}
