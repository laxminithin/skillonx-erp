import { db } from '../../db/index.js';
import type { MaintActor } from './types.js';
import { OPEN_STATUSES } from './types.js';
import { assertMaintPermission, hasMaintPermission, actorTeamIds } from './access.js';
import { shapeTicket } from './tickets.js';
import { upcomingDue } from './preventive.js';

const openTicketQuery = (collegeId: number) => db('service_tickets as t')
  .leftJoin('service_categories as c', 'c.id', 't.category_id')
  .leftJoin('service_teams as tm', 'tm.id', 't.team_id')
  .leftJoin('departments as d', 'd.id', 't.department_id')
  .leftJoin('rooms as r', 'r.id', 't.room_id')
  .leftJoin('faculty_users as af', 'af.id', 't.assigned_to')
  .leftJoin('faculty_users as rf', 'rf.id', 't.requester_faculty_id')
  .leftJoin('students as rs', 'rs.id', 't.requester_student_id')
  .where('t.college_id', collegeId)
  .select(
    't.*', 'c.name as category_name', 'c.kind as category_kind', 'tm.name as team_name',
    'd.name as department_name', 'r.name as room_name', 'af.name as assignee_name',
    db.raw('COALESCE(rf.name, rs.name) as requester_name'),
  );

/**
 * Maintenance Manager operational dashboard. Aggregated — a bounded set of
 * open tickets is fetched ONCE and SLA state computed in JS; counts come from
 * grouped SQL. No per-ticket / per-team round trips.
 */
export async function managerDashboard(actor: MaintActor) {
  assertMaintPermission(actor, 'maint.queue.view');
  const collegeId = actor.collegeId;

  // One pass over open tickets (bounded).
  const openRaw = await openTicketQuery(collegeId).whereIn('t.status', OPEN_STATUSES).orderBy('t.created_at', 'asc').limit(1000);
  const open = openRaw.map((r) => shapeTicket(r, 'FULL'));

  const triageTeam = await db('service_teams').where({ college_id: collegeId, is_triage: true }).first();
  const unassigned = open.filter((t) => !t.assignedTo && (t.status === 'TRIAGED' || t.status === 'OPEN' || (triageTeam && t.teamId === Number(triageTeam.id))));
  const critical = open.filter((t) => t.priority === 'CRITICAL');
  const breached = open.filter((t) => t.sla.overall === 'BREACHED');
  const approaching = open.filter((t) => t.sla.overall === 'APPROACHING');
  const reopened = open.filter((t) => t.status === 'REOPENED' || t.reopenCount > 0);
  const waitingParts = open.filter((t) => t.status === 'WAITING_PARTS');
  const waitingApproval = open.filter((t) => t.status === 'WAITING_APPROVAL');

  // Queue health counts (grouped SQL).
  const statusCounts = await db('service_tickets').where({ college_id: collegeId })
    .select('status').count<{ status: string; n: number }[]>('* as n').groupBy('status');
  const health: Record<string, number> = {};
  for (const s of statusCounts) health[String(s.status)] = Number(s.n);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const resolvedToday = await db('service_tickets').where({ college_id: collegeId }).where('resolved_at', '>=', today).count<{ n: number }[]>('* as n');
  const closedToday = await db('service_tickets').where({ college_id: collegeId }).where('closed_at', '>=', today).count<{ n: number }[]>('* as n');

  // By team (open only).
  const byTeamRaw = await db('service_tickets as t')
    .leftJoin('service_teams as tm', 'tm.id', 't.team_id')
    .where('t.college_id', collegeId).whereIn('t.status', OPEN_STATUSES)
    .select('tm.id as team_id', 'tm.name as team_name', 'tm.kind as kind')
    .count<{ team_id: number; team_name: string; kind: string; n: number }[]>('* as n')
    .groupBy('tm.id', 'tm.name', 'tm.kind');
  const byTeam = byTeamRaw.map((r) => ({ teamId: r.team_id ? Number(r.team_id) : null, teamName: r.team_name ?? 'Unassigned', kind: r.kind ?? null, open: Number(r.n) }));

  const preventiveDue = hasMaintPermission(actor, 'maint.preventive.manage') ? await upcomingDue(collegeId, 14) : [];

  const recent = await db('service_ticket_events as e')
    .join('service_tickets as t', 't.id', 'e.ticket_id')
    .where('e.college_id', collegeId).where('e.visibility', 'PUBLIC')
    .orderBy('e.created_at', 'desc').limit(15)
    .select('e.id', 'e.event_type', 'e.actor_name', 'e.note', 'e.created_at', 't.ticket_no', 't.id as ticket_id');

  const lite = (t: ReturnType<typeof shapeTicket>) => ({
    id: t.id, ticketNo: t.ticketNo, title: t.title, priority: t.priority, status: t.status,
    categoryName: t.categoryName, teamName: t.teamName, assigneeName: t.assigneeName,
    createdAt: t.createdAt, sla: t.sla,
  });

  return {
    actionRequired: {
      unassigned: unassigned.map(lite),
      critical: critical.map(lite),
      slaBreached: breached.map(lite),
      slaApproaching: approaching.map(lite),
      reopened: reopened.map(lite),
      waitingParts: waitingParts.map(lite),
      waitingApproval: waitingApproval.map(lite),
    },
    counts: {
      open: open.length, unassigned: unassigned.length, critical: critical.length,
      slaBreached: breached.length, slaApproaching: approaching.length, reopened: reopened.length,
      waitingParts: waitingParts.length, waitingApproval: waitingApproval.length,
      resolvedToday: Number(resolvedToday[0]?.n ?? 0), closedToday: Number(closedToday[0]?.n ?? 0),
      preventiveDue: preventiveDue.length,
    },
    preventiveDue,
    queueHealth: health,
    byTeam,
    recentActivity: recent.map((r) => ({
      id: Number(r.id), type: r.event_type, actorName: r.actor_name, note: r.note,
      ticketNo: r.ticket_no, ticketId: Number(r.ticket_id), createdAt: r.created_at,
    })),
  };
}

/** Technician / IT-support workspace: only assigned / team tickets. */
export async function technicianDashboard(actor: MaintActor) {
  assertMaintPermission(actor, 'maint.work');
  const collegeId = actor.collegeId;
  const teamIds = await actorTeamIds(actor);

  const raw = await openTicketQuery(collegeId)
    .where(function () {
      this.where('t.assigned_to', actor.facultyUserId!);
      if (teamIds.length) this.orWhereIn('t.team_id', teamIds);
    })
    .whereIn('t.status', OPEN_STATUSES)
    .orderBy('t.created_at', 'asc').limit(500);
  const mine = raw.map((r) => shapeTicket(r, 'FULL'));

  const now = Date.now();
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const dueMs = (t: ReturnType<typeof shapeTicket>) => (t.sla.resolveDueAt ? new Date(t.sla.resolveDueAt).getTime() : null);

  const overdue = mine.filter((t) => { const d = dueMs(t); return d != null && d < now && String(t.status) !== 'RESOLVED'; });
  const dueToday = mine.filter((t) => { const d = dueMs(t); return d != null && d >= now && d <= endOfDay.getTime(); });
  const highPriority = mine.filter((t) => ['HIGH', 'CRITICAL'].includes(String(t.priority)));
  const waiting = mine.filter((t) => ['WAITING_PARTS', 'WAITING_APPROVAL', 'WAITING_REQUESTER'].includes(String(t.status)));

  const recentlyCompleted = (await openTicketQuery(collegeId)
    .where('t.assigned_to', actor.facultyUserId!).where('t.status', 'RESOLVED')
    .orderBy('t.resolved_at', 'desc').limit(10)).map((r) => shapeTicket(r, 'FULL'));

  const lite = (t: ReturnType<typeof shapeTicket>) => ({
    id: t.id, ticketNo: t.ticketNo, title: t.title, priority: t.priority, status: t.status,
    categoryName: t.categoryName, roomName: t.roomName, building: t.building, createdAt: t.createdAt, sla: t.sla,
  });

  return {
    counts: { assigned: mine.length, overdue: overdue.length, dueToday: dueToday.length, highPriority: highPriority.length, waiting: waiting.length },
    overdue: overdue.map(lite),
    dueToday: dueToday.map(lite),
    highPriority: highPriority.map(lite),
    waiting: waiting.map(lite),
    assigned: mine.map(lite),
    recentlyCompleted: recentlyCompleted.map(lite),
  };
}
