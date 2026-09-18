/**
 * Maintenance / Facilities / IT Helpdesk deterministic E2E seed.
 *
 * Idempotent. Reuses the Student-LMS E2E college (SX-E2E-CSE-3A → college 4),
 * its rooms, departments and faculty (anita, ravi, qa.hod.cse, qa.principal,
 * qa.labassistant) and a student. Run AFTER:
 *   npm run seed:student-lms-e2e  &&  npm run seed:lab-management
 *
 * Adds:
 *   - MAINTENANCE_MANAGER, MAINTENANCE_STAFF (electrical + plumbing),
 *     IT_SUPPORT users + team membership
 *   - baseline config (teams / categories / routing rules) via ensureMaintenanceConfig
 *   - tickets across every operational state: triage/unassigned, assigned IT,
 *     electrical, plumbing, lab-linked, classroom, hostel, library, high
 *     priority, SLA approaching, SLA breached, waiting-for-parts, resolved,
 *     reopened, student-raised.
 */
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import type { MaintActor } from '../modules/maintenance/types.js';
import { ensureMaintenanceConfig } from '../modules/maintenance/config.js';
import { createTicket, assignTicket, acknowledgeTicket, startWork, requestPart, resolveTicket, reopenTicket, setStatus } from '../modules/maintenance/tickets.js';

const QA_PASSWORD_HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq'; // Password123

async function ensureFaculty(collegeId: number, departmentId: number | null, email: string, name: string, role: string, employeeNo: string, designation?: string) {
  let user = await db('faculty_users').where({ email }).first();
  if (!user) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId, department_id: departmentId, name, email,
      password_hash: QA_PASSWORD_HASH, role, is_active: true, employee_id: employeeNo, designation: designation ?? null,
    });
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update({ role, is_active: true, department_id: departmentId, password_hash: QA_PASSWORD_HASH });
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user!;
}

function facActor(row: Record<string, unknown>, role?: string): MaintActor {
  return {
    kind: 'FACULTY', facultyUserId: Number(row.id), collegeId: Number(row.college_id),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    role: (role ?? row.role) as string, name: String(row.name),
  };
}

async function ensureTeamMember(collegeId: number, teamCode: string, facultyId: number, isLead = false) {
  const team = await db('service_teams').where({ college_id: collegeId, code: teamCode }).first();
  if (!team) return;
  const existing = await db('service_team_members').where({ team_id: team.id, faculty_id: facultyId }).first();
  if (existing) {
    await db('service_team_members').where({ id: existing.id }).update({ status: 'ACTIVE', is_lead: isLead });
  } else {
    await db('service_team_members').insert({ college_id: collegeId, team_id: Number(team.id), faculty_id: facultyId, is_lead: isLead, status: 'ACTIVE' });
  }
}

async function findTicket(collegeId: number, title: string) {
  return db('service_tickets').where({ college_id: collegeId, title }).first();
}

export async function seedMaintenance(options: { closeDb?: boolean } = {}) {
  if (!(await db.schema.hasTable('service_tickets'))) {
    console.log('service tables absent — run migrations first; skipping maintenance seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  if (!cls) {
    console.log('SX-E2E-CSE-3A class absent — run seed:student-lms-e2e first; skipping maintenance seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const collegeId = Number(cls.college_id);
  const cse = await db('departments').where({ college_id: collegeId, code: 'CSE' }).first();
  const cseId = cse ? Number(cse.id) : null;
  const lab2Room = await db('rooms').where({ college_id: collegeId, code: 'LAB2' }).first();
  const anyRoom = lab2Room ?? (await db('rooms').where({ college_id: collegeId }).first());

  await ensureMaintenanceConfig(collegeId);

  // ── Operator identities ────────────────────────────────────────────────
  const manager = await ensureFaculty(collegeId, null, 'qa.maint.manager@vviet.edu.in', 'QA Maintenance Manager', 'MAINTENANCE_MANAGER', 'QA-MNT-MGR', 'Maintenance Manager');
  const electrician = await ensureFaculty(collegeId, null, 'qa.maint.electrician@vviet.edu.in', 'QA Electrician', 'MAINTENANCE_STAFF', 'QA-MNT-ELEC', 'Electrical Technician');
  const plumber = await ensureFaculty(collegeId, null, 'qa.maint.plumber@vviet.edu.in', 'QA Plumber', 'MAINTENANCE_STAFF', 'QA-MNT-PLM', 'Plumbing Technician');
  const itSupport = await ensureFaculty(collegeId, null, 'qa.itsupport@vviet.edu.in', 'QA IT Support', 'IT_SUPPORT', 'QA-IT-SUP', 'IT Support Engineer');

  await ensureTeamMember(collegeId, 'IT_SUPPORT', Number(itSupport.id), true);
  await ensureTeamMember(collegeId, 'ELECTRICAL', Number(electrician.id), true);
  await ensureTeamMember(collegeId, 'PLUMBING', Number(plumber.id), true);

  // ── Requester identities (reuse) ─────────────────────────────────────────
  const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita@vviet.edu.in' }).first();
  const ravi = await db('faculty_users').where({ college_id: collegeId, email: 'ravi@vviet.edu.in' }).first();
  const student = await db('students').where({ college_id: collegeId, usn: '4VV24CS001' }).first();

  const managerActor = facActor(manager);
  const faculty = anita ? facActor(anita, 'FACULTY') : managerActor;

  // Helper to create a ticket only once (idempotent on title).
  async function ensure(actor: MaintActor, input: Record<string, unknown>) {
    const existing = await findTicket(collegeId, String(input.title));
    if (existing) return existing;
    const t = await createTicket(actor, input);
    return db('service_tickets').where({ id: t.id }).first();
  }

  // 1. Unassigned / triage (category OTHER routes to triage).
  await ensure(faculty, { title: 'QA: Unlabelled issue near reception', description: 'Something is not working near the reception desk.', categoryCode: 'OTHER', roomId: anyRoom ? Number(anyRoom.id) : undefined });

  // 2. IT ticket (routes to IT_SUPPORT), then assign + acknowledge.
  const itTicket = await ensure(faculty, { title: 'QA: Wi-Fi down in CSE block', description: 'No internet on the third floor.', categoryCode: 'NETWORK', roomId: anyRoom ? Number(anyRoom.id) : undefined });
  if (itTicket) {
    const itTeam = await db('service_teams').where({ college_id: collegeId, code: 'IT_SUPPORT' }).first();
    if (itTeam && !itTicket.assigned_to) {
      await assignTicket(managerActor, Number(itTicket.id), { teamId: Number(itTeam.id), technicianId: Number(itSupport.id), reason: 'Network specialist' });
      await acknowledgeTicket(facActor(itSupport), Number(itTicket.id));
    }
  }

  // 3. Electrical (assigned to electrician, in progress + work started).
  const elec = await ensure(faculty, { title: 'QA: Classroom fan not working', description: 'Ceiling fan in the classroom is dead.', categoryCode: 'ELECTRICAL', sourceModule: 'CLASSROOM', roomId: anyRoom ? Number(anyRoom.id) : undefined });
  if (elec && !elec.started_at) {
    const elecTeam = await db('service_teams').where({ college_id: collegeId, code: 'ELECTRICAL' }).first();
    if (elecTeam) {
      await assignTicket(managerActor, Number(elec.id), { teamId: Number(elecTeam.id), technicianId: Number(electrician.id) });
      await startWork(facActor(electrician), Number(elec.id));
    }
  }

  // 4. Plumbing, waiting for parts.
  const plumb = await ensure(faculty, { title: 'QA: Washroom tap leaking', description: 'Continuous leak in the ground-floor washroom.', categoryCode: 'PLUMBING' });
  if (plumb && plumb.status !== 'WAITING_PARTS') {
    const plumbTeam = await db('service_teams').where({ college_id: collegeId, code: 'PLUMBING' }).first();
    if (plumbTeam) {
      await assignTicket(managerActor, Number(plumb.id), { teamId: Number(plumbTeam.id), technicianId: Number(plumber.id) });
      await requestPart(facActor(plumber), Number(plumb.id), { item: 'Tap washer set', quantity: 2, reason: 'Replace worn washers', estimatedCost: 150 });
    }
  }

  // 5. High-priority + SLA-approaching (backdate created_at to near due).
  const high = await ensure(faculty, { title: 'QA: Projector failure during class', description: 'Projector will not power on in a live class.', categoryCode: 'PROJECTOR', priority: 'HIGH', sourceModule: 'CLASSROOM', roomId: anyRoom ? Number(anyRoom.id) : undefined });
  if (high) {
    // push resolve due to ~30 min from now → APPROACHING; created 8h ago.
    await db('service_tickets').where({ id: high.id }).update({
      created_at: new Date(Date.now() - 8 * 3600000), sla_resolve_due_at: new Date(Date.now() + 30 * 60000),
    });
  }

  // 6. SLA breached (resolve due in the past, still open).
  const breach = await ensure(faculty, { title: 'QA: Main gate light out (overdue)', description: 'Security light at the main gate has been out for days.', categoryCode: 'ELECTRICAL', priority: 'HIGH' });
  if (breach) {
    await db('service_tickets').where({ id: breach.id }).update({
      created_at: new Date(Date.now() - 3 * 86400000), sla_ack_due_at: new Date(Date.now() - 2 * 86400000), sla_resolve_due_at: new Date(Date.now() - 86400000),
    });
  }

  // 7. Lab-linked ticket via the frozen Lab fault (maintenance_ref).
  if (await db.schema.hasTable('lab_faults')) {
    const fault = await db('lab_faults').where({ college_id: collegeId }).whereNull('maintenance_ref').orderBy('id', 'asc').first();
    if (fault && await db('service_tickets').where({ college_id: collegeId, source_module: 'LAB', source_entity_type: 'LAB_FAULT', source_entity_id: fault.id }).first() == null) {
      const { linkLabFault } = await import('../modules/maintenance/integrations.js');
      const labAssistant = await db('faculty_users').where({ college_id: collegeId, email: 'qa.labassistant@vviet.edu.in' }).first();
      if (labAssistant) await linkLabFault(facActor(labAssistant, 'LAB_ASSISTANT'), Number(fault.id));
    }
  }

  // 8. Hostel-linked.
  await ensure(faculty, { title: 'QA: Hostel room light fitting broken', description: 'Tube light fitting broken in hostel block B.', categoryCode: 'HOSTEL_FACILITY', sourceModule: 'HOSTEL', sourceEntityType: 'ROOM' });

  // 9. Library-linked.
  await ensure(faculty, { title: 'QA: Library reading-room AC not cooling', description: 'AC in the reading room is not cooling.', categoryCode: 'LIBRARY_EQUIPMENT', sourceModule: 'LIBRARY' });

  // 10. Resolved (awaiting confirmation).
  const resolved = await ensure(faculty, { title: 'QA: Broken chair in seminar hall', description: 'One chair is broken.', categoryCode: 'FURNITURE' });
  if (resolved && resolved.status !== 'RESOLVED' && resolved.status !== 'CLOSED') {
    const civilTeam = await db('service_teams').where({ college_id: collegeId, code: 'CIVIL' }).first();
    if (civilTeam) {
      await assignTicket(managerActor, Number(resolved.id), { teamId: Number(civilTeam.id) });
      await resolveTicket(managerActor, Number(resolved.id), { resolutionSummary: 'Chair replaced with a spare from stores.' });
    }
  }

  // 11. Reopened.
  const reopened = await ensure(faculty, { title: 'QA: Smart board touch not responding', description: 'Smart board touch is intermittent.', categoryCode: 'PROJECTOR', sourceModule: 'CLASSROOM' });
  if (reopened && reopened.reopen_count === 0) {
    const itTeam = await db('service_teams').where({ college_id: collegeId, code: 'IT_SUPPORT' }).first();
    if (itTeam) {
      await assignTicket(managerActor, Number(reopened.id), { teamId: Number(itTeam.id), technicianId: Number(itSupport.id) });
      await resolveTicket(facActor(itSupport), Number(reopened.id), { resolutionSummary: 'Recalibrated the touch panel.' });
      await reopenTicket(faculty, Number(reopened.id), { reason: 'Problem returned after two hours.' });
    }
  }

  // 12. ERP application ticket (IT).
  await ensure(faculty, { title: 'QA: Marks entry page throws an error', description: 'Saving marks fails with a server error.', categoryCode: 'ERP_APP', sourceModule: 'ERP', erpModule: 'Examination', erpRoute: '/examinations/marks' });

  // 13. Student-raised.
  if (student) {
    const stuActor: MaintActor = { kind: 'STUDENT', studentId: Number(student.id), collegeId, departmentId: student.department_id ? Number(student.department_id) : null, role: 'STUDENT', name: String(student.name) };
    await ensure(stuActor, { title: 'QA: Classroom projector blurry (student)', description: 'The projector image is blurry in our classroom.', categoryCode: 'PROJECTOR', sourceModule: 'CLASSROOM', roomId: anyRoom ? Number(anyRoom.id) : undefined });
  }

  const summary = {
    collegeId,
    accounts: {
      manager: 'qa.maint.manager@vviet.edu.in',
      electrician: 'qa.maint.electrician@vviet.edu.in',
      plumber: 'qa.maint.plumber@vviet.edu.in',
      itSupport: 'qa.itsupport@vviet.edu.in',
      facultyRequester: 'anita@vviet.edu.in',
      facultyRequester2: 'ravi@vviet.edu.in',
      hod: 'qa.hod.cse@vviet.edu.in',
      principal: 'qa.principal@vviet.edu.in',
      student: student ? '4VV24CS001' : null,
    },
    tickets: Number((await db('service_tickets').where({ college_id: collegeId }).count<{ n: number }[]>('* as n'))[0].n),
  };
  console.log('\nMaintenance / IT Helpdesk E2E seed complete.\n');
  console.log(JSON.stringify(summary, null, 2));
  if (options.closeDb) await db.destroy();
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedMaintenance({ closeDb: true }).catch(async (err) => {
    console.error(err);
    try { await db.destroy(); } catch { /* ignore */ }
    process.exit(1);
  });
}
