import bcrypt from 'bcrypt';
import { db } from '../src/db/index.js';
import * as booking from '../src/modules/events/booking.js';
import * as reservations from '../src/modules/events/reservations.js';
import * as svc from '../src/modules/events/service.js';
import type { EventsActor, StudentEventsActor } from '../src/modules/events/types.js';

const CODE = 'P11QA';
const PASSWORD = 'Phase11!QA';

async function main() {
  const existing = await db('colleges').where({ code: CODE }).first();
  if (existing) {
    console.log(`QA college already seeded (id ${existing.id})`);
    return;
  }
  const hash = await bcrypt.hash(PASSWORD, 10);
  const [collegeId] = await db('colleges').insert({ name: 'Phase 11 QA Institute of Technology', code: CODE });
  const [cse] = await db('departments').insert({ college_id: collegeId, name: 'Computer Science & Engineering', code: `${CODE}CSE` });
  const [ece] = await db('departments').insert({ college_id: collegeId, name: 'Electronics & Communication', code: `${CODE}ECE` });
  const staff = async (key: string, name: string, role: string, dept: number | null): Promise<EventsActor> => {
    const [id] = await db('faculty_users').insert({ college_id: collegeId, department_id: dept, name, email: `p11.${key}@qa.test`, password_hash: hash, role, is_active: true });
    return { facultyUserId: Number(id), collegeId: Number(collegeId), departmentId: dept, role, name };
  };
  const organizer = await staff('organizer', 'Dr. Asha Rao', 'FACULTY', Number(cse));
  const hod = await staff('hod', 'Prof. Vikram Iyer', 'HOD', Number(cse));
  const principal = await staff('principal', 'Dr. Meera Krishnan', 'PRINCIPAL', null);
  const facilities = await staff('facilities', 'Ravi Kumar', 'FACILITIES_OFFICER', null);
  const admin = await staff('admin', 'QA College Admin', 'COLLEGE_ADMIN', null);
  await staff('ecefaculty', 'Dr. Sunil Patil', 'FACULTY', Number(ece));

  const room = async (name: string, code: string, type: string, capacity: number, building: string) => {
    const [id] = await db('rooms').insert({ college_id: collegeId, name, code: `${CODE}-${code}`, type, capacity, building, status: 'ACTIVE' });
    return Number(id);
  };
  const hallId = await room('Seminar Hall A', 'SHA', 'SEMINAR_HALL', 120, 'Main Block');
  const audiId = await room('Sir M.V. Auditorium', 'AUD', 'AUDITORIUM', 400, 'Admin Block');
  const confId = await room('Conference Room 1', 'CR1', 'OTHER', 20, 'Admin Block');
  await room('CSE Lab 3', 'LAB3', 'LAB', 30, 'CSE Block');
  const [projId] = await db('campus_assets').insert({ college_id: collegeId, asset_tag: `${CODE}-PRJ-01`, name: 'Epson Projector EB-X51', category: 'AV Equipment', status: 'IN_STOCK', created_by: admin.facultyUserId });
  const [paId] = await db('campus_assets').insert({ college_id: collegeId, asset_tag: `${CODE}-PA-01`, name: 'Portable PA System', category: 'AV Equipment', status: 'UNDER_MAINTENANCE', created_by: admin.facultyUserId });

  const hall = await booking.configureResource(facilities, { resourceKind: 'ROOM', roomId: hallId, cleanupBufferMinutes: 15 });
  const audi = await booking.configureResource(facilities, { resourceKind: 'ROOM', roomId: audiId, setupBufferMinutes: 30, cleanupBufferMinutes: 30 });
  const conf = await booking.configureResource(facilities, { resourceKind: 'ROOM', roomId: confId });
  const proj = await booking.configureResource(facilities, { resourceKind: 'ASSET', assetId: Number(projId), requiresApproval: true });
  await booking.configureResource(facilities, { resourceKind: 'ASSET', assetId: Number(paId) });

  const students: StudentEventsActor[] = [];
  for (let i = 1; i <= 6; i++) {
    const [sid] = await db('students').insert({ college_id: collegeId, department_id: cse, name: i === 1 ? 'Ananya Sharma' : `Student ${i}`, email: `p11.student${i === 1 ? '' : i}@qa.test`, usn: `1QA23CS00${i}`, password_hash: hash, is_active: true });
    students.push({ studentId: Number(sid), collegeId: Number(collegeId) });
  }

  const base = {
    eventType: 'GUEST_LECTURE', organizerUnitType: 'DEPARTMENT' as const, departmentId: Number(cse), visibility: 'INSTITUTION' as const,
  };
  // 1. Scheduled, with registrations.
  const e1 = await svc.createEvent(organizer, { ...base, title: 'AI in Healthcare — Guest Lecture', description: 'Dr. Kavitha Menon (NIMHANS) on clinical decision support and responsible AI.', objective: 'Expose final-year students to applied AI research.', startsAt: '2026-10-14T10:00', endsAt: '2026-10-14T12:30', expectedParticipants: 100, registrationEnabled: true, registrationCapacity: 100, plannedBudget: 15000 });
  await svc.addEventResource(organizer, e1.id, hall.id);
  await svc.submitEvent(organizer, e1.id);
  await svc.reviewEvent(hod, e1.id, { action: 'APPROVE', remarks: 'Good fit for the department calendar.' });
  await svc.reviewEvent(principal, e1.id, { action: 'APPROVE' });
  for (const s of students.slice(1, 5)) await svc.studentRegister(s, e1.id);

  // 2. At principal step.
  const e2 = await svc.createEvent(organizer, { ...base, eventType: 'HACKATHON', title: 'CodeSprint 2026 — 24h Hackathon', description: 'Inter-college hackathon on sustainability.', startsAt: '2026-10-24T09:00', endsAt: '2026-10-25T09:00', expectedParticipants: 300, registrationEnabled: true, registrationCapacity: 300, hasExternalParticipants: true, plannedBudget: 120000 });
  await svc.addEventResource(organizer, e2.id, audi.id);
  await svc.submitEvent(organizer, e2.id);
  await svc.reviewEvent(hod, e2.id, { action: 'APPROVE', remarks: 'Recommend; please confirm sponsor list.' });

  // 3. At HOD step.
  const e3 = await svc.createEvent(organizer, { ...base, eventType: 'WORKSHOP', title: 'Hands-on IoT Workshop', startsAt: '2026-10-17T14:00', endsAt: '2026-10-17T17:00', expectedParticipants: 18 });
  await svc.addEventResource(organizer, e3.id, conf.id);
  await svc.submitEvent(organizer, e3.id);

  // 4. Draft.
  await svc.createEvent(organizer, { ...base, eventType: 'SEMINAR', title: 'Alumni Talk: Careers in Chip Design', startsAt: '2026-11-05T15:00', endsAt: '2026-11-05T16:30', expectedParticipants: 60 });

  // 5. Approved-but-unscheduled (venue taken by a competing approval).
  const e5 = await svc.createEvent(organizer, { ...base, eventType: 'CULTURAL_EVENT', title: 'Rangotsava Cultural Evening', startsAt: '2026-10-31T17:00', endsAt: '2026-10-31T20:00', expectedParticipants: 350 });
  await svc.addEventResource(organizer, e5.id, audi.id);
  await svc.submitEvent(organizer, e5.id);
  await svc.reviewEvent(hod, e5.id, { action: 'APPROVE' });
  const rival = await svc.createEvent(hod, { ...base, eventType: 'ORIENTATION', title: 'First-year Parents Orientation', startsAt: '2026-10-31T16:00', endsAt: '2026-10-31T18:00', expectedParticipants: 300 });
  await svc.addEventResource(hod, rival.id, audi.id);
  await svc.submitEvent(hod, rival.id);
  await svc.reviewEvent(principal, rival.id, { action: 'APPROVE' });
  await svc.reviewEvent(principal, e5.id, { action: 'APPROVE' });

  // 6. Completed event (moved into the past) with attendance and report.
  const e6 = await svc.createEvent(organizer, { ...base, eventType: 'TECHNICAL_EVENT', title: 'Cloud Computing Bootcamp', startsAt: '2026-10-02T10:00', endsAt: '2026-10-02T13:00', expectedParticipants: 40, registrationEnabled: true, registrationCapacity: 40 });
  await svc.addEventResource(organizer, e6.id, hall.id);
  await svc.submitEvent(organizer, e6.id);
  await svc.reviewEvent(hod, e6.id, { action: 'APPROVE' });
  await svc.reviewEvent(principal, e6.id, { action: 'APPROVE' });
  for (const s of students.slice(0, 3)) await svc.studentRegister(s, e6.id);
  await db('campus_events').where({ id: e6.id }).update({ starts_at: '2026-09-20 10:00:00', ends_at: '2026-09-20 13:00:00' });
  await db('campus_resource_reservations').where({ event_id: e6.id }).update({ starts_at: '2026-09-20 10:00:00', ends_at: '2026-09-20 13:00:00', block_starts_at: '2026-09-20 10:00:00', block_ends_at: '2026-09-20 13:15:00' });
  const regs = await svc.listRegistrations(organizer, e6.id);
  await svc.markAttendance(organizer, e6.id, { entries: regs.items.map((r, i) => ({ registrationId: r.id, attendance: i < 2 ? 'ATTENDED' as const : 'ABSENT' as const })) });
  await svc.completeEvent(organizer, e6.id, { outcomeSummary: 'Covered AWS fundamentals, IAM and serverless labs. 2 of 3 registered students attended; feedback averaged 4.4/5.' });

  // 7. Ad-hoc bookings.
  await reservations.createReservation(organizer, { resourceId: conf.id, startsAt: '2026-10-15T11:00', endsAt: '2026-10-15T12:00', purpose: 'Project review with industry mentor', idempotencyKey: `${CODE}-seed-conf` });
  await reservations.createReservation(organizer, { resourceId: proj.id, startsAt: '2026-10-16T10:00', endsAt: '2026-10-16T12:00', purpose: 'Department faculty meeting presentation', idempotencyKey: `${CODE}-seed-proj` });

  console.log(JSON.stringify({ collegeId: Number(collegeId), password: PASSWORD, staff: ['p11.organizer@qa.test', 'p11.hod@qa.test', 'p11.principal@qa.test', 'p11.facilities@qa.test', 'p11.admin@qa.test'], student: 'p11.student@qa.test', events: { scheduled: e1.id, principalStep: e2.id, hodStep: e3.id, approvedUnscheduled: e5.id, completed: e6.id } }, null, 2));
}

main().then(() => db.destroy()).catch(async (e) => {
  console.error(e);
  await db.destroy();
  process.exit(1);
});
