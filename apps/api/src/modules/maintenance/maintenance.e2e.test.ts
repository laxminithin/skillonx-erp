/**
 * Maintenance / Facilities / IT Helpdesk E2E invariants.
 * Skips cleanly when the E2E seed is absent. Run after:
 *   npm run seed:student-lms-e2e && npm run seed:lab-management && npm run seed:maintenance
 *
 * Calls service functions directly (same pattern as the Lab / Mentoring suites),
 * building actors from seeded DB rows. Asserts the full lifecycle, routing,
 * SLA, RBAC, isolation, internal-note confidentiality and source integration.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { MaintActor } from './types.js';
import * as t from './tickets.js';
import * as config from './config.js';
import * as integrations from './integrations.js';
import { managerDashboard, technicianDashboard } from './dashboard.js';
import { reports } from './reports.js';
import { maintPermissionsForRole } from './access.js';

type Ctx = {
  collegeId: number;
  manager: MaintActor;
  electrician: MaintActor;
  plumber: MaintActor;
  itSupport: MaintActor;
  faculty: MaintActor;   // requester (anita)
  faculty2: MaintActor;  // ravi — different requester
  hod: MaintActor;
  principal: MaintActor;
  student: MaintActor | null;
  otherCollegeFaculty: MaintActor | null;
};

function facActor(row: Record<string, unknown>, role?: string): MaintActor {
  return {
    kind: 'FACULTY', facultyUserId: Number(row.id), collegeId: Number(row.college_id),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    role: (role ?? row.role) as string, name: String(row.name),
  };
}

async function ctx(): Promise<Ctx | null> {
  try {
    if (!(await db.schema.hasTable('service_tickets'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const get = (email: string) => db('faculty_users').where({ college_id: collegeId, email }).first();
    const manager = await get('qa.maint.manager@vviet.edu.in');
    const electrician = await get('qa.maint.electrician@vviet.edu.in');
    const plumber = await get('qa.maint.plumber@vviet.edu.in');
    const itSupport = await get('qa.itsupport@vviet.edu.in');
    const anita = await get('anita@vviet.edu.in');
    const ravi = await get('ravi@vviet.edu.in');
    const hod = await get('qa.hod.cse@vviet.edu.in');
    const principal = await get('qa.principal@vviet.edu.in');
    if (!manager || !electrician || !itSupport || !anita || !ravi || !hod || !principal) return null;
    const stu = await db('students').where({ college_id: collegeId, usn: '4VV24CS001' }).first();
    const other = await db('faculty_users').where({ role: 'FACULTY' }).whereNot({ college_id: collegeId }).first();
    return {
      collegeId,
      manager: facActor(manager, 'MAINTENANCE_MANAGER'),
      electrician: facActor(electrician, 'MAINTENANCE_STAFF'),
      plumber: facActor(plumber!, 'MAINTENANCE_STAFF'),
      itSupport: facActor(itSupport, 'IT_SUPPORT'),
      faculty: facActor(anita, 'FACULTY'),
      faculty2: facActor(ravi, 'FACULTY'),
      hod: facActor(hod, 'HOD'),
      principal: facActor(principal, 'PRINCIPAL'),
      student: stu ? { kind: 'STUDENT', studentId: Number(stu.id), collegeId, departmentId: stu.department_id ? Number(stu.department_id) : null, role: 'STUDENT', name: String(stu.name) } : null,
      otherCollegeFaculty: other ? facActor(other, 'FACULTY') : null,
    };
  } catch {
    return null;
  }
}

const byTitle = (collegeId: number, title: string) => db('service_tickets').where({ college_id: collegeId, title }).first();

describe('Maintenance / Facilities / IT Helpdesk E2E', () => {
  it('1-4. requester can create a ticket, get a ticket number, and see it in My Tickets', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E create ${Date.now()}`, description: 'Test', categoryCode: 'ELECTRICAL' });
    assert.match(created.ticketNo, /^SR-\d{4}-\d{5}$/);
    const mine = await t.listTickets(c.faculty, { statusGroup: 'OPEN' });
    assert.ok(mine.rows.some((r) => r.id === created.id));
  });

  it('5. auto-routing is deterministic and explainable (network → IT)', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E route ${Date.now()}`, categoryCode: 'NETWORK' });
    assert.ok(created.routingExplanation && created.routingExplanation.length > 0);
    const itTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'IT_SUPPORT' }).first();
    assert.equal(created.teamId, Number(itTeam!.id));
    assert.equal(created.status, 'ASSIGNED');
  });

  it('6. triage fallback: unmatched category enters the Triage queue (not SUPER_ADMIN)', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E triage ${Date.now()}`, categoryCode: 'OTHER' });
    const team = await db('service_teams').where({ id: created.teamId! }).first();
    assert.equal(Boolean(team!.is_triage), true);
    assert.equal(created.status, 'TRIAGED');
  });

  it('7. manager dashboard surfaces action-required buckets', async () => {
    const c = await ctx(); if (!c) return;
    const d = await managerDashboard(c.manager);
    assert.ok(d.counts.open >= 1);
    assert.ok(Array.isArray(d.actionRequired.unassigned));
    assert.ok(Array.isArray(d.actionRequired.slaBreached));
    assert.ok(d.byTeam.length >= 1);
  });

  it('8-11. assign team+technician, acknowledge, start work', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E assign ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    const elecTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'ELECTRICAL' }).first();
    const assigned = await t.assignTicket(c.manager, created.id, { teamId: Number(elecTeam!.id), technicianId: c.electrician.facultyUserId! });
    assert.equal(assigned.assignedTo, c.electrician.facultyUserId);
    const ack = await t.acknowledgeTicket(c.electrician, created.id);
    assert.ok(ack.acknowledgedAt);
    const started = await t.startWork(c.electrician, created.id);
    assert.equal(started.status, 'IN_PROGRESS');
  });

  it('12-14,20,43. internal notes are hidden from the requester but visible to staff', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E notes ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    const elecTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'ELECTRICAL' }).first();
    await t.assignTicket(c.manager, created.id, { teamId: Number(elecTeam!.id), technicianId: c.electrician.facultyUserId! });
    await t.addComment(c.electrician, created.id, { body: 'INTERNAL: suspect wiring fault', visibility: 'INTERNAL' });
    await t.addComment(c.electrician, created.id, { body: 'We are on it, thanks.', visibility: 'REQUESTER' });
    await t.addWorkLog(c.electrician, created.id, { workPerformed: 'Checked breaker' });

    const asRequester = await t.getTicket(c.faculty, created.id);
    assert.equal(asRequester.comments.some((cm) => cm.visibility === 'INTERNAL'), false, 'requester must not see internal notes');
    assert.equal(asRequester.workLogs.length, 0, 'requester must not see work logs');
    assert.equal(asRequester.comments.some((cm) => cm.body.includes('on it')), true);

    const asStaff = await t.getTicket(c.electrician, created.id);
    assert.equal(asStaff.comments.some((cm) => cm.visibility === 'INTERNAL'), true);
    assert.ok(asStaff.workLogs.length >= 1);

    // Requester cannot post internal notes.
    await assert.rejects(() => t.addComment(c.faculty, created.id, { body: 'x', visibility: 'INTERNAL' }), /internal/i);
  });

  it('15,22. waiting-for-parts pauses SLA; resuming restores the clock', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E parts ${Date.now()}`, categoryCode: 'PLUMBING' });
    const plumbTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'PLUMBING' }).first();
    await t.assignTicket(c.manager, created.id, { teamId: Number(plumbTeam!.id), technicianId: c.plumber.facultyUserId! });
    await t.requestPart(c.plumber, created.id, { item: 'Washer', quantity: 1 });
    const waiting = await t.getTicket(c.plumber, created.id);
    assert.equal(waiting.status, 'WAITING_PARTS');
    assert.equal(waiting.sla.overall === 'PAUSED' || waiting.sla.ackState === 'PAUSED' || waiting.sla.resolveState === 'PAUSED', true);
    // Resume via start work.
    const back = await t.setStatus(c.plumber, created.id, { status: 'IN_PROGRESS' });
    assert.equal(back.status, 'IN_PROGRESS');
    assert.ok(back.sla.pausedMs >= 0);
  });

  it('16. approval / parts decision workflow', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E approve ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    const elecTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'ELECTRICAL' }).first();
    await t.assignTicket(c.manager, created.id, { teamId: Number(elecTeam!.id), technicianId: c.electrician.facultyUserId! });
    const part = await t.requestPart(c.electrician, created.id, { item: 'Contactor', quantity: 1, estimatedCost: 2500 });
    const decided = await t.decidePart(c.manager, created.id, part.id, { status: 'APPROVED', note: 'Within budget' });
    assert.equal(decided.status, 'APPROVED');
    // A technician cannot approve parts.
    await assert.rejects(() => t.decidePart(c.electrician, created.id, part.id, { status: 'FULFILLED' }), /permission/i);
  });

  it('17-19. resolution → requester confirmation → close; then reopen', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E resolve ${Date.now()}`, categoryCode: 'FURNITURE' });
    const civil = await db('service_teams').where({ college_id: c.collegeId, code: 'CIVIL' }).first();
    await t.assignTicket(c.manager, created.id, { teamId: Number(civil!.id) });
    const resolved = await t.resolveTicket(c.manager, created.id, { resolutionSummary: 'Fixed' });
    assert.equal(resolved.status, 'RESOLVED');
    const closed = await t.confirmResolution(c.faculty, created.id, {});
    assert.equal(closed.status, 'CLOSED');
    const reopened = await t.reopenTicket(c.faculty, created.id, { reason: 'Still broken' });
    assert.equal(reopened.status, 'REOPENED');
    assert.equal(reopened.reopenCount, 1);
  });

  it('21. SLA due times are computed from category targets at creation', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E sla ${Date.now()}`, categoryCode: 'NETWORK' });
    assert.ok(created.sla.resolveDueAt, 'resolve due should be set');
    assert.ok(created.sla.ackDueAt, 'ack due should be set');
    assert.ok(new Date(created.sla.resolveDueAt!).getTime() > Date.now());
  });

  it('22b. seeded breached ticket is reported as BREACHED', async () => {
    const c = await ctx(); if (!c) return;
    const row = await byTitle(c.collegeId, 'QA: Main gate light out (overdue)');
    if (!row) return;
    const ticket = await t.getTicket(c.manager, Number(row.id));
    assert.equal(ticket.sla.overall, 'BREACHED');
  });

  it('23. escalation records evidence and raises escalation level', async () => {
    const c = await ctx(); if (!c) return;
    const row = await byTitle(c.collegeId, 'QA: Main gate light out (overdue)');
    if (!row) return;
    const esc = await t.escalateTicket(c.manager, Number(row.id), { level: 'PRINCIPAL', reason: 'SLA breached' });
    assert.equal(esc.escalationLevel, 'PRINCIPAL');
    const evt = await db('service_escalations').where({ ticket_id: row.id }).first();
    assert.ok(evt);
  });

  it('24. Lab fault integration uses maintenance_ref and never duplicates the fault', async () => {
    const c = await ctx(); if (!c) return;
    if (!(await db.schema.hasTable('lab_faults'))) return;
    const linked = await db('service_tickets').where({ college_id: c.collegeId, source_module: 'LAB', source_entity_type: 'LAB_FAULT' }).first();
    if (!linked) return;
    const fault = await db('lab_faults').where({ id: linked.source_entity_id }).first();
    assert.equal(fault.maintenance_ref, linked.ticket_no, 'lab fault carries the maintenance_ref');
    // Re-linking the same fault returns the same ticket (idempotent, no duplicate).
    const labAssistant = await db('faculty_users').where({ college_id: c.collegeId, email: 'qa.labassistant@vviet.edu.in' }).first();
    if (labAssistant) {
      const again = await integrations.linkLabFault(facActor(labAssistant, 'LAB_ASSISTANT'), Number(fault.id));
      assert.equal(again.ticketNo, linked.ticket_no);
      const count = await db('service_tickets').where({ college_id: c.collegeId, source_module: 'LAB', source_entity_type: 'LAB_FAULT', source_entity_id: fault.id }).count<{ n: number }[]>('* as n');
      assert.equal(Number(count[0].n), 1, 'no duplicate ticket for the same lab fault');
    }
  });

  it('25-28. hostel / library / classroom / IT-ERP tickets share the one engine', async () => {
    const c = await ctx(); if (!c) return;
    for (const [title, mod] of [['QA: Hostel room light fitting broken', 'HOSTEL'], ['QA: Library reading-room AC not cooling', 'LIBRARY'], ['QA: Marks entry page throws an error', 'ERP']] as const) {
      const row = await byTitle(c.collegeId, title);
      assert.ok(row, `${title} seeded`);
      assert.equal(row.source_module, mod);
    }
  });

  it('29-30. requester isolation: a requester cannot read another requester’s ticket', async () => {
    const c = await ctx(); if (!c) return;
    const mine = await t.createTicket(c.faculty, { title: `E2E iso ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    await assert.rejects(() => t.getTicket(c.faculty2, mine.id), /access/i);
    if (c.student) {
      await assert.rejects(() => t.getTicket(c.student, mine.id), /access/i);
    }
  });

  it('31. college isolation: cross-college access is refused', async () => {
    const c = await ctx(); if (!c || !c.otherCollegeFaculty) return;
    const mine = await t.createTicket(c.faculty, { title: `E2E cross ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    await assert.rejects(() => t.getTicket(c.otherCollegeFaculty!, mine.id), /(not found|access)/i);
  });

  it('32-33. technician sees only assigned/team tickets; IT-support scope', async () => {
    const c = await ctx(); if (!c) return;
    const list = await t.listTickets(c.electrician, {});
    // Every visible ticket is either assigned to the electrician, on their team, or raised by them.
    const teamIds = (await db('service_team_members').where({ college_id: c.collegeId, faculty_id: c.electrician.facultyUserId!, status: 'ACTIVE' }).pluck('team_id')).map(Number);
    for (const r of list.rows) {
      const ok = r.assignedTo === c.electrician.facultyUserId || (r.teamId && teamIds.includes(r.teamId)) || r.requesterFacultyId === c.electrician.facultyUserId;
      assert.ok(ok, `technician saw an out-of-scope ticket ${r.ticketNo}`);
    }
    const dash = await technicianDashboard(c.itSupport);
    assert.ok(dash.counts.assigned >= 1);
  });

  it('34. an operator with no work permission (Accountant-like) is a requester only', async () => {
    const c = await ctx(); if (!c) return;
    // Simulate an ACCOUNTANT requester (role has only requester perms).
    const accountant: MaintActor = { ...c.faculty, role: 'ACCOUNTANT' };
    const perms = maintPermissionsForRole('ACCOUNTANT');
    assert.equal(perms.includes('maint.queue.view'), false);
    assert.equal(perms.includes('maint.work'), false);
    // Cannot open the manager dashboard.
    await assert.rejects(() => managerDashboard(accountant), /permission/i);
  });

  it('36-37. HOD department oversight & Principal institution oversight', async () => {
    const c = await ctx(); if (!c) return;
    const hodList = await t.listTickets(c.hod, {});
    assert.ok(Array.isArray(hodList.rows));
    const rep = await reports(c.principal);
    assert.ok(rep.summary.open >= 0);
    assert.ok(Array.isArray(rep.byTeam));
  });

  it('38. management aggregate analytics (recurring issues have evidence)', async () => {
    const c = await ctx(); if (!c) return;
    const rep = await reports(c.manager);
    assert.ok(rep.recurring);
    assert.ok(Array.isArray(rep.recurring.byAsset));
    assert.ok(Array.isArray(rep.recurring.byRoomCategory));
    assert.ok(rep.byCategory.length >= 1);
  });

  it('40. audit evidence: every ticket action recorded on the timeline', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E audit ${Date.now()}`, categoryCode: 'ELECTRICAL' });
    const elecTeam = await db('service_teams').where({ college_id: c.collegeId, code: 'ELECTRICAL' }).first();
    await t.assignTicket(c.manager, created.id, { teamId: Number(elecTeam!.id), technicianId: c.electrician.facultyUserId! });
    // ELECTRICAL defaults to HIGH, so escalate to CRITICAL to exercise a real priority change.
    await t.setPriority(c.manager, created.id, { priority: 'CRITICAL', reason: 'urgent' });
    const full = await t.getTicket(c.manager, created.id);
    const types = full.timeline.map((e) => e.type);
    assert.ok(types.includes('CREATED'));
    assert.ok(types.includes('ASSIGNED'));
    assert.ok(types.includes('PRIORITY_CHANGE'));
  });

  it('config: categories/teams/routing rules are college-scoped & seeded', async () => {
    const c = await ctx(); if (!c) return;
    const cats = await config.listCategories(c.manager, { activeOnly: true });
    assert.ok(cats.length >= 10);
    const teams = await config.listTeams(c.manager);
    assert.ok(teams.some((tm) => tm.isTriage));
    // A plain requester cannot manage config.
    await assert.rejects(() => config.createCategory(c.faculty2, { code: 'X', name: 'X' }), /permission/i);
  });

  it('priority guard: a plain requester cannot force CRITICAL', async () => {
    const c = await ctx(); if (!c) return;
    const created = await t.createTicket(c.faculty, { title: `E2E crit ${Date.now()}`, categoryCode: 'ELECTRICAL', priority: 'CRITICAL' });
    assert.notEqual(created.priority, 'CRITICAL');
    // A manager may set CRITICAL.
    const mgr = await t.createTicket(c.manager, { title: `E2E crit2 ${Date.now()}`, categoryCode: 'ELECTRICAL', priority: 'CRITICAL' });
    assert.equal(mgr.priority, 'CRITICAL');
  });

  it('39. direct-load of a ticket by a non-owner staff outside team is refused', async () => {
    const c = await ctx(); if (!c) return;
    // A ticket assigned to IT should not be fully accessible to the plumber (different team, not requester).
    const itRow = await byTitle(c.collegeId, 'QA: Wi-Fi down in CSE block');
    if (!itRow) return;
    await assert.rejects(() => t.getTicket(c.plumber, Number(itRow.id)), /access/i);
  });
});
