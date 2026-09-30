import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as booking from './booking.js';
import * as reservations from './reservations.js';
import * as svc from './service.js';
import { fromDb } from './time.js';
import type { EventsActor, StudentEventsActor } from './types.js';

type Setup = Awaited<ReturnType<typeof setup>>;

async function setup(tag = `EV${Date.now()}${Math.floor(Math.random() * 100000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Events College ${tag}`, code: `EC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Events College ${tag}`, code: `OEC${tag}`.slice(0, 60) });
  const [cse] = await db('departments').insert({ college_id: collegeId, name: 'CSE', code: `CSE${tag}`.slice(0, 60) });
  const [ece] = await db('departments').insert({ college_id: collegeId, name: 'ECE', code: `ECE${tag}`.slice(0, 60) });

  const staff = async (key: string, role: string, dept: number | null, college = collegeId): Promise<EventsActor> => {
    const [id] = await db('faculty_users').insert({ college_id: college, department_id: dept, name: `${key} ${tag}`, email: `ev.${key}.${tag}@test.edu`, password_hash: 'x', role, is_active: true });
    return { facultyUserId: Number(id), collegeId: Number(college), departmentId: dept != null ? Number(dept) : null, role };
  };
  const admin = await staff('admin', 'COLLEGE_ADMIN', Number(cse));
  const principal = await staff('principal', 'PRINCIPAL', null);
  const facilities = await staff('facilities', 'FACILITIES_OFFICER', null);
  const hodCse = await staff('hodcse', 'HOD', Number(cse));
  const hodEce = await staff('hodece', 'HOD', Number(ece));
  const organizer = await staff('organizer', 'FACULTY', Number(cse));
  const otherFaculty = await staff('otherfac', 'FACULTY', Number(cse));
  const eceFaculty = await staff('ecefac', 'FACULTY', Number(ece));
  const crossAdmin = await staff('crossadmin', 'COLLEGE_ADMIN', null, otherCollegeId);

  const room = async (code: string, type: string, capacity: number, college = collegeId) => {
    const [id] = await db('rooms').insert({ college_id: college, name: `${code} ${tag}`, code: `${code}${tag}`.slice(0, 60), type, capacity, status: 'ACTIVE' });
    return Number(id);
  };
  const hallRoomId = await room('HALL', 'SEMINAR_HALL', 120);
  const labRoomId = await room('LAB', 'LAB', 30);
  const foreignRoomId = await room('XHALL', 'SEMINAR_HALL', 100, otherCollegeId);
  const [projectorAssetId] = await db('campus_assets').insert({ college_id: collegeId, asset_tag: `PRJ-${tag}`.slice(0, 60), name: `Projector ${tag}`, category: 'AV', status: 'IN_STOCK', created_by: admin.facultyUserId });

  const hall = await booking.configureResource(facilities, { resourceKind: 'ROOM', roomId: hallRoomId });
  const lab = await booking.configureResource(facilities, { resourceKind: 'ROOM', roomId: labRoomId });
  const projector = await booking.configureResource(facilities, { resourceKind: 'ASSET', assetId: Number(projectorAssetId), requiresApproval: true });
  const foreignHall = await booking.configureResource(crossAdmin, { resourceKind: 'ROOM', roomId: foreignRoomId });

  const student = async (key: string, dept: number | null, college = collegeId): Promise<StudentEventsActor> => {
    const [id] = await db('students').insert({ college_id: college, department_id: dept, name: `${key} ${tag}`, email: `ev.stu.${key}.${tag}@test.edu`, usn: `USN${key}${tag}`.slice(0, 60) });
    return { studentId: Number(id), collegeId: Number(college) };
  };
  const studentCse = await student('cse', Number(cse));
  const studentEce = await student('ece', Number(ece));
  const crossStudent = await student('cross', null, otherCollegeId);

  return {
    tag, collegeId: Number(collegeId), otherCollegeId: Number(otherCollegeId), cse: Number(cse), ece: Number(ece),
    admin, principal, facilities, hodCse, hodEce, organizer, otherFaculty, eceFaculty, crossAdmin,
    hall, lab, projector, foreignHall, hallRoomId, labRoomId, projectorAssetId: Number(projectorAssetId),
    student, studentCse, studentEce, crossStudent,
  };
}

function eventInput(c: Setup, over: Record<string, unknown> = {}) {
  return {
    title: `Seminar ${c.tag}`,
    eventType: 'SEMINAR',
    organizerUnitType: 'DEPARTMENT' as const,
    departmentId: c.cse,
    startsAt: '2027-03-03T10:00',
    endsAt: '2027-03-03T12:00',
    expectedParticipants: 40,
    visibility: 'INSTITUTION' as const,
    registrationEnabled: true,
    registrationCapacity: 40,
    plannedBudget: 25000,
    ...over,
  } as Parameters<typeof svc.createEvent>[1];
}

/** Creates a department event with the given resources and drives it to SCHEDULED through the real workflow. */
async function scheduledEvent(c: Setup, resourceIds: number[], over: Record<string, unknown> = {}) {
  const ev = await svc.createEvent(c.organizer, eventInput(c, over));
  for (const r of resourceIds) await svc.addEventResource(c.organizer, ev.id, r);
  await svc.submitEvent(c.organizer, ev.id);
  await svc.reviewEvent(c.hodCse, ev.id, { action: 'APPROVE' });
  const out = await svc.reviewEvent(c.principal, ev.id, { action: 'APPROVE' });
  return out as any;
}

async function atPrincipalStep(c: Setup, resourceIds: number[], over: Record<string, unknown> = {}) {
  const ev = await svc.createEvent(c.organizer, eventInput(c, over));
  for (const r of resourceIds) await svc.addEventResource(c.organizer, ev.id, r);
  await svc.submitEvent(c.organizer, ev.id);
  await svc.reviewEvent(c.hodCse, ev.id, { action: 'APPROVE' });
  return ev.id as number;
}

async function confirmedOverlapping(resourceId: number, start: string, end: string) {
  const row = await db('campus_resource_reservations').where({ resource_id: resourceId, status: 'CONFIRMED' })
    .andWhere('block_starts_at', '<', end).andWhere('block_ends_at', '>', start).count({ c: '*' }).first();
  return Number(row?.c ?? 0);
}

function settledCounts(results: PromiseSettledResult<unknown>[]) {
  return { ok: results.filter((r) => r.status === 'fulfilled').length, failed: results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[] };
}

after(async () => {
  svc.setEventsNotifierForTests(null);
});

describe('Campus OS Phase 11: Events, venue & resource booking', () => {
  it('runs the full lifecycle through HOD → Principal → Facilities and protects closed history', async () => {
    const c = await setup();
    const ev = await svc.createEvent(c.organizer, eventInput(c));
    assert.equal(ev.status, 'DRAFT');
    await svc.addEventResource(c.organizer, ev.id, c.hall.id);
    await svc.addEventResource(c.organizer, ev.id, c.projector.id);
    const submitted = await svc.submitEvent(c.organizer, ev.id) as any;
    assert.equal(submitted.status, 'UNDER_REVIEW');
    assert.equal(submitted.workflow.currentStep.key, 'HOD_REVIEW');
    await svc.reviewEvent(c.hodCse, ev.id, { action: 'APPROVE' });
    const atFacilities = await svc.reviewEvent(c.principal, ev.id, { action: 'APPROVE' }) as any;
    assert.equal(atFacilities.status, 'UNDER_REVIEW');
    assert.equal(atFacilities.workflow.currentStep.key, 'FACILITIES_REVIEW');
    // Requested reservations never block until confirmed.
    assert.equal(await confirmedOverlapping(c.hall.id, '2027-03-03 10:00:00', '2027-03-03 12:00:00'), 0);
    const scheduled = await svc.reviewEvent(c.facilities, ev.id, { action: 'APPROVE' }) as any;
    assert.equal(scheduled.status, 'SCHEDULED');
    assert.ok(scheduled.reservations.every((r: any) => r.status === 'CONFIRMED'));
    assert.deepEqual(scheduled.venues, [`HALL ${c.tag}`]);

    const reg = await svc.studentRegister(c.studentCse, ev.id);
    assert.equal(reg.myRegistration?.status, 'REGISTERED');

    // Move the event into the past to exercise post-event steps.
    await db('campus_events').where({ id: ev.id }).update({ starts_at: '2026-01-10 10:00:00', ends_at: '2026-01-10 12:00:00' });
    const regs = await svc.listRegistrations(c.organizer, ev.id);
    await svc.markAttendance(c.organizer, ev.id, { entries: [{ registrationId: regs.items[0].id, attendance: 'ATTENDED' }] });
    await assert.rejects(() => svc.closeEvent(c.principal, ev.id), /Only a completed event/);
    const completed = await svc.completeEvent(c.organizer, ev.id, { outcomeSummary: 'Seminar delivered to 1 participant.' }) as any;
    assert.equal(completed.status, 'COMPLETED');
    assert.equal(completed.actualParticipants, 1);
    await assert.rejects(() => svc.closeEvent(c.organizer, ev.id), (e: any) => e.status === 403);
    const closed = await svc.closeEvent(c.principal, ev.id) as any;
    assert.equal(closed.status, 'CLOSED');
    assert.deepEqual((await svc.closeEvent(c.principal, ev.id) as any).status, 'CLOSED');

    // Closed history cannot change silently.
    await assert.rejects(() => svc.updateEvent(c.organizer, ev.id, eventInput(c, { startsAt: '2027-04-01T10:00', endsAt: '2027-04-01T11:00' })), /cannot be edited/);
    await assert.rejects(() => svc.rescheduleEvent(c.organizer, ev.id, { startsAt: '2027-04-01T10:00', endsAt: '2027-04-01T11:00', reason: 'move it' }), /Cannot reschedule/);
    await assert.rejects(() => svc.cancelEvent(c.organizer, ev.id, 'no longer'), /Cannot cancel/);
    await assert.rejects(() => svc.completeEvent(c.organizer, ev.id, { outcomeSummary: 'Rewriting the closed report.' }), /Cannot complete/);
    await assert.rejects(() => svc.markAttendance(c.organizer, ev.id, { entries: [{ registrationId: regs.items[0].id, attendance: 'ABSENT' }] }), /cannot be marked/);
    await assert.rejects(() => svc.addEventResource(c.organizer, ev.id, c.lab.id), /cannot be changed/);

    const actions = (await db('campus_events_audit_log').where({ entity_type: 'campus_event', entity_id: ev.id }).select('action')).map((r) => r.action);
    for (const a of ['EVENT_CREATED', 'EVENT_RESOURCE_ADDED', 'EVENT_SUBMITTED', 'EVENT_REVIEW_APPROVE', 'EVENT_SCHEDULED', 'EVENT_REGISTRATION_CREATED', 'EVENT_PARTICIPATION_MARKED', 'EVENT_COMPLETED', 'EVENT_CLOSED']) {
      assert.ok(actions.includes(a), `missing audit ${a}`);
    }
    assert.equal(closed.workflow.status, 'APPROVED');
    assert.ok(closed.workflow.history.filter((h: any) => h.action === 'APPROVE').length === 3);
  });

  it('blocks self-approval, wrong-department HOD review, and routes a HOD-organised department event past the HOD step', async () => {
    const c = await setup();
    const inst = await svc.createEvent(c.principal, eventInput(c, { organizerUnitType: 'INSTITUTION', departmentId: null }));
    await svc.submitEvent(c.principal, inst.id);
    await assert.rejects(() => svc.reviewEvent(c.principal, inst.id, { action: 'APPROVE' }), /self-approval is not allowed/);

    const dept = await svc.createEvent(c.organizer, eventInput(c));
    await svc.submitEvent(c.organizer, dept.id);
    await assert.rejects(() => svc.reviewEvent(c.organizer, dept.id, { action: 'APPROVE' }), (e: any) => e.status === 403);
    await assert.rejects(() => svc.reviewEvent(c.hodEce, dept.id, { action: 'APPROVE' }), (e: any) => e.status === 404);
    await assert.rejects(() => svc.reviewEvent(c.hodCse, dept.id, { action: 'RETURN' }), /Remarks are required/);
    // Principal cannot skip the HOD step: the Workflow Engine enforces role-at-step.
    await assert.rejects(() => svc.reviewEvent(c.principal, dept.id, { action: 'APPROVE' }));

    const hodOwn = await svc.createEvent(c.hodCse, eventInput(c));
    const sub = await svc.submitEvent(c.hodCse, hodOwn.id) as any;
    assert.equal(sub.workflow.currentStep.key, 'PRINCIPAL_REVIEW');
    await assert.rejects(() => svc.reviewEvent(c.hodCse, hodOwn.id, { action: 'APPROVE' }), /self-approval/);

    // Return → edit → resubmit uses the same workflow instance.
    const returned = await svc.reviewEvent(c.hodCse, dept.id, { action: 'RETURN', remarks: 'Add objective' }) as any;
    assert.equal(returned.status, 'RETURNED');
    await svc.updateEvent(c.organizer, dept.id, eventInput(c, { objective: 'Industry exposure' }));
    const resub = await svc.submitEvent(c.organizer, dept.id) as any;
    assert.equal(resub.status, 'UNDER_REVIEW');
    assert.equal(resub.workflow.instanceId, returned.workflow.instanceId);
    const queue = await svc.reviewQueue(c.hodCse);
    assert.ok(queue.some((q) => q.id === dept.id));
    assert.ok(!queue.some((q) => q.id === hodOwn.id));
  });

  it('same approval clicked concurrently transitions exactly once', async () => {
    const c = await setup();
    const id = await atPrincipalStep(c, [c.hall.id]);
    const results = await Promise.allSettled([1, 2, 3, 4].map(() => svc.reviewEvent(c.principal, id, { action: 'APPROVE' })));
    const { ok } = settledCounts(results);
    assert.equal(ok, 1);
    const ev = await db('campus_events').where({ id }).first();
    assert.equal(ev.status, 'SCHEDULED');
    const approvals = await db('workflow_instance_history').where({ instance_id: ev.workflow_instance_id, action: 'APPROVE', role_at_action: 'PRINCIPAL' }).count({ c: '*' }).first();
    assert.equal(Number(approvals?.c), 1);
    const scheduledAudits = await db('campus_events_audit_log').where({ entity_id: id, action: 'EVENT_SCHEDULED' }).count({ c: '*' }).first();
    assert.equal(Number(scheduledAudits?.c), 1);
  });

  it('concurrent approvals of overlapping events for the same venue confirm exactly one (Example A for the rest)', async () => {
    const c = await setup();
    const ids: number[] = [];
    for (let i = 0; i < 4; i++) {
      ids.push(await atPrincipalStep(c, [c.hall.id], { title: `Race ${i} ${c.tag}`, startsAt: `2027-03-04T1${i}:00`, endsAt: '2027-03-04T15:00' }));
    }
    await Promise.allSettled(ids.map((id) => svc.reviewEvent(c.principal, id, { action: 'APPROVE' })));
    const rows = await db('campus_events').whereIn('id', ids);
    assert.equal(rows.filter((r) => r.status === 'SCHEDULED').length, 1);
    const unscheduled = rows.filter((r) => r.status === 'APPROVED');
    assert.equal(unscheduled.length, 3);
    assert.ok(unscheduled.every((r) => r.last_scheduling_error));
    assert.equal(await confirmedOverlapping(c.hall.id, '2027-03-04 00:00:00', '2027-03-05 00:00:00'), 1);
    // Example A: approved-but-unscheduled is not published as scheduled anywhere.
    const listed = await svc.studentListEvents(c.studentCse);
    assert.equal(listed.items.filter((e) => ids.includes(e.id)).length, 1);
    await assert.rejects(() => svc.getEvent(c.otherFaculty, unscheduled[0].id), (e: any) => e.status === 404);
    const own = await svc.getEvent(c.organizer, unscheduled[0].id) as any;
    assert.equal(own.status, 'APPROVED');
    assert.ok(own.lastSchedulingError);
    assert.equal(own.venues.length, 0);
  });

  it('concurrent ad-hoc bookings of the same room and the same asset confirm exactly one each', async () => {
    const c = await setup();
    await booking.updateResource(c.facilities, c.projector.id, { requiresApproval: false });
    for (const resourceId of [c.lab.id, c.projector.id]) {
      const results = await Promise.allSettled([0, 1, 2, 3, 4, 5].map((i) => reservations.createReservation(c.organizer, {
        resourceId, startsAt: `2027-03-05T10:${String(i * 5).padStart(2, '0')}`, endsAt: '2027-03-05T11:30', purpose: `Meeting ${i}`,
      })));
      const { ok, failed } = settledCounts(results);
      assert.equal(ok, 1, `resource ${resourceId}`);
      assert.ok(failed.every((f) => f.reason.status === 409 && f.reason.code === 'RESERVATION_CONFLICT'));
      assert.equal(await confirmedOverlapping(resourceId, '2027-03-05 00:00:00', '2027-03-06 00:00:00'), 1);
    }
  });

  it('back-to-back slots are allowed, overlaps are rejected, and configurable buffers extend the blocked window', async () => {
    const c = await setup();
    const book = (start: string, end: string, purpose = 'Class meeting') =>
      reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: start, endsAt: end, purpose });
    await book('2027-03-08T10:00', '2027-03-08T12:00');
    await book('2027-03-08T12:00', '2027-03-08T13:00');
    await book('2027-03-08T09:00', '2027-03-08T10:00');
    await assert.rejects(() => book('2027-03-08T11:59', '2027-03-08T12:30'), (e: any) => e.code === 'RESERVATION_CONFLICT');
    await assert.rejects(() => book('2027-03-08T09:30', '2027-03-08T13:30'), (e: any) => e.code === 'RESERVATION_CONFLICT');

    await booking.updateResource(c.facilities, c.lab.id, { cleanupBufferMinutes: 15 });
    await book('2027-03-09T10:00', '2027-03-09T12:00');
    await assert.rejects(() => book('2027-03-09T12:00', '2027-03-09T13:00'), (e: any) => e.code === 'RESERVATION_CONFLICT');
    await book('2027-03-09T12:15', '2027-03-09T13:00');
    await assert.rejects(() => reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-09T13:00', endsAt: '2027-03-09T12:00', purpose: 'Backwards' }), /must be after start/);
  });

  it('blocks a room occupied by the live academic timetable without writing timetable data', async () => {
    const c = await setup();
    const [yearId] = await db('academic_years').insert({ college_id: c.collegeId, label: `AY${c.tag}`.slice(0, 32) });
    const [semId] = await db('semesters').insert({ college_id: c.collegeId, label: `S${c.tag}`.slice(0, 32) });
    const [progId] = await db('programs').insert({ college_id: c.collegeId, name: 'BE', code: `BE${c.tag}`.slice(0, 60) });
    const [secId] = await db('class_sections').insert({ college_id: c.collegeId, label: `A${c.tag}`.slice(0, 32) });
    const [classId] = await db('academic_classes').insert({ college_id: c.collegeId, academic_year_id: yearId, program_id: progId, department_id: c.cse, semester_id: semId, class_section_id: secId, name: `CSE-A ${c.tag}`, code: `CA${c.tag}`.slice(0, 60) });
    const [courseId] = await db('courses').insert({ college_id: c.collegeId, code: `CS${c.tag}`.slice(0, 60), name: 'Data Structures' });
    const [subjectId] = await db('academic_class_subjects').insert({ college_id: c.collegeId, academic_class_id: classId, course_id: courseId });
    // 2027-03-03 is a Wednesday (day_of_week 3).
    await db('timetable_slots').insert({ college_id: c.collegeId, academic_class_id: classId, class_subject_id: subjectId, course_id: courseId, room_id: c.labRoomId, day_of_week: 3, start_time: '10:00:00', end_time: '11:00:00', effective_from: '2027-01-01', status: 'ACTIVE' });
    const slotCount = async () => Number((await db('timetable_slots').where({ college_id: c.collegeId }).count({ c: '*' }).first())?.c);
    const before = await slotCount();

    await assert.rejects(
      () => reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-03T10:30', endsAt: '2027-03-03T11:30', purpose: 'Workshop' }),
      (e: any) => e.status === 409 && e.code === 'ACADEMIC_TIMETABLE_CONFLICT',
    );
    const avail = await svc.availability(c.organizer, { startsAt: '2027-03-03T10:30', endsAt: '2027-03-03T11:30' });
    const labRow = avail.items.find((i) => i.resource.id === c.lab.id)!;
    assert.equal(labRow.available, false);
    assert.equal(labRow.blockers[0].kind, 'ACADEMIC_TIMETABLE');
    assert.equal(avail.items.find((i) => i.resource.id === c.hall.id)!.available, true);
    // Back-to-back with the class and a different weekday are fine.
    await reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-03T11:00', endsAt: '2027-03-03T12:00', purpose: 'After class' });
    await reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-04T10:00', endsAt: '2027-03-04T11:00', purpose: 'Thursday' });
    assert.equal(await slotCount(), before);
  });

  it('asset and room status block booking; inactive resources are not bookable', async () => {
    const c = await setup();
    await booking.updateResource(c.facilities, c.projector.id, { requiresApproval: false });
    for (const status of ['UNDER_MAINTENANCE', 'RETIRED', 'DISPOSED', 'LOST']) {
      await db('campus_assets').where({ id: c.projectorAssetId }).update({ status });
      await assert.rejects(
        () => reservations.createReservation(c.organizer, { resourceId: c.projector.id, startsAt: '2027-03-10T10:00', endsAt: '2027-03-10T11:00', purpose: 'Talk' }),
        (e: any) => e.code === 'ASSET_STATUS_CONFLICT',
        status,
      );
    }
    await db('rooms').where({ id: c.labRoomId }).update({ status: 'INACTIVE' });
    await assert.rejects(
      () => reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-10T10:00', endsAt: '2027-03-10T11:00', purpose: 'Talk' }),
      (e: any) => e.code === 'ROOM_INACTIVE_CONFLICT',
    );
    await booking.updateResource(c.facilities, c.hall.id, { isActive: false });
    await assert.rejects(
      () => reservations.createReservation(c.organizer, { resourceId: c.hall.id, startsAt: '2027-03-10T10:00', endsAt: '2027-03-10T11:00', purpose: 'Talk' }),
      (e: any) => e.code === 'RESOURCE_INACTIVE_CONFLICT',
    );
    // Scheduling (not just requesting) re-checks status: an asset that breaks after request blocks confirmation.
    await db('campus_assets').where({ id: c.projectorAssetId }).update({ status: 'IN_STOCK' });
    const id = await atPrincipalStep(c, [c.projector.id], { startsAt: '2027-03-11T10:00', endsAt: '2027-03-11T11:00' });
    await db('campus_assets').where({ id: c.projectorAssetId }).update({ status: 'UNDER_MAINTENANCE' });
    const out = await svc.reviewEvent(c.principal, id, { action: 'APPROVE' }) as any;
    assert.equal(out.status, 'APPROVED');
    assert.match(out.lastSchedulingError, /UNDER_MAINTENANCE/);
  });

  it('capacity is server-authoritative; override needs permission, a reason and leaves an audit record', async () => {
    const c = await setup();
    const ev = await svc.createEvent(c.organizer, eventInput(c, { expectedParticipants: 80, registrationCapacity: 80 }));
    await assert.rejects(() => svc.addEventResource(c.organizer, ev.id, c.lab.id), (e: any) => e.code === 'CAPACITY_CONFLICT');
    await assert.rejects(() => svc.overrideCapacity(c.organizer, ev.id, 'Standing room ok'), (e: any) => e.status === 403);
    await assert.rejects(() => svc.overrideCapacity(c.hodEce, ev.id, 'Standing room ok'), (e: any) => e.status === 403);
    const over = await svc.overrideCapacity(c.principal, ev.id, 'Split sessions approved') as any;
    assert.equal(over.capacityOverride, true);
    await svc.addEventResource(c.organizer, ev.id, c.lab.id);
    const audit = await db('campus_events_audit_log').where({ entity_id: ev.id, action: 'EVENT_CAPACITY_OVERRIDDEN' }).first();
    assert.equal(audit.reason, 'Split sessions approved');
    assert.equal(Number(audit.actor_id), c.principal.facultyUserId);
  });

  it('the last registration slot goes to exactly one registrant and double registration is idempotent', async () => {
    const c = await setup();
    const ev = await scheduledEvent(c, [c.hall.id], { registrationCapacity: 3 });
    assert.equal(ev.status, 'SCHEDULED');
    const students = await Promise.all([0, 1, 2, 3, 4, 5, 6].map((i) => c.student(`r${i}`, c.cse)));
    const results = await Promise.allSettled(students.map((s) => svc.studentRegister(s, ev.id)));
    const { ok, failed } = settledCounts(results);
    assert.equal(ok, 3);
    assert.ok(failed.every((f) => f.reason.code === 'REGISTRATION_FULL'));
    const count = await db('campus_event_registrations').where({ event_id: ev.id, status: 'REGISTERED' }).count({ c: '*' }).first();
    assert.equal(Number(count?.c), 3);

    const ev2 = await scheduledEvent(c, [c.lab.id], { title: `Second ${c.tag}`, registrationCapacity: 10, expectedParticipants: 10, startsAt: '2027-03-12T10:00', endsAt: '2027-03-12T11:00' });
    const dup = await Promise.allSettled([1, 2, 3, 4].map(() => svc.studentRegister(c.studentCse, ev2.id)));
    assert.equal(settledCounts(dup).ok, 4);
    const rows = await db('campus_event_registrations').where({ event_id: ev2.id, student_id: c.studentCse.studentId });
    assert.equal(rows.length, 1);
    // Cancel then re-register reuses the row; freed seats are reusable.
    await svc.studentCancelRegistration(c.studentCse, ev2.id);
    const again = await svc.studentRegister(c.studentCse, ev2.id);
    assert.equal(again.myRegistration?.id, Number(rows[0].id));
  });

  it('duplicate submissions create exactly one workflow instance', async () => {
    const c = await setup();
    const ev = await svc.createEvent(c.organizer, eventInput(c));
    const results = await Promise.allSettled([1, 2, 3, 4].map(() => svc.submitEvent(c.organizer, ev.id)));
    assert.equal(settledCounts(results).ok, 4);
    const instances = await db('workflow_instances').where({ college_id: c.collegeId, entity_type: 'campus_event', entity_id: ev.id }).count({ c: '*' }).first();
    assert.equal(Number(instances?.c), 1);
    assert.equal((results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[]).filter((r) => !r.value.idempotentReplay).length, 1);
  });

  it('concurrent reschedules into the same slot: exactly one wins; a conflicting reschedule leaves the original time', async () => {
    const c = await setup();
    const a = await scheduledEvent(c, [c.hall.id], { title: `A ${c.tag}`, startsAt: '2027-03-15T09:00', endsAt: '2027-03-15T10:00' });
    const b = await scheduledEvent(c, [c.hall.id], { title: `B ${c.tag}`, startsAt: '2027-03-15T14:00', endsAt: '2027-03-15T15:00' });
    assert.equal(a.status, 'SCHEDULED');
    assert.equal(b.status, 'SCHEDULED');
    const results = await Promise.allSettled([a, b].map((e) => svc.rescheduleEvent(c.organizer, e.id, { startsAt: '2027-03-16T10:00', endsAt: '2027-03-16T11:00', reason: 'Guest availability' })));
    const { ok, failed } = settledCounts(results);
    assert.equal(ok, 1);
    assert.equal(failed[0].reason.code, 'RESERVATION_CONFLICT');
    assert.equal(await confirmedOverlapping(c.hall.id, '2027-03-16 00:00:00', '2027-03-17 00:00:00'), 1);
    const loser = (await db('campus_events').whereIn('id', [a.id, b.id])).find((r) => Number(r.reschedule_count) === 0)!;
    const loserRes = await db('campus_resource_reservations').where({ event_id: loser.id }).first();
    assert.equal(loserRes.status, 'CONFIRMED');
    assert.ok(String(fromDb(loserRes.starts_at)).startsWith('2027-03-15'));
  });

  it('cancel releases the venue in the same transaction so it can be rebooked; cancel is idempotent', async () => {
    const c = await setup();
    // Both request the hall while it is free (requests never block); the first to be approved holds it.
    const bId = await atPrincipalStep(c, [c.hall.id], { title: `Waiting ${c.tag}`, startsAt: '2027-03-17T11:00', endsAt: '2027-03-17T13:00' });
    const a = await scheduledEvent(c, [c.hall.id], { title: `Holder ${c.tag}`, startsAt: '2027-03-17T10:00', endsAt: '2027-03-17T12:00' });
    // A new request for an already-confirmed slot is refused up front.
    const late = await svc.createEvent(c.organizer, eventInput(c, { title: `Late ${c.tag}`, startsAt: '2027-03-17T11:30', endsAt: '2027-03-17T12:30' }));
    await assert.rejects(() => svc.addEventResource(c.organizer, late.id, c.hall.id), (e: any) => e.code === 'RESERVATION_CONFLICT');
    const b = await svc.reviewEvent(c.principal, bId, { action: 'APPROVE' }) as any;
    assert.equal(b.status, 'APPROVED');
    await assert.rejects(() => svc.scheduleEvent(c.organizer, bId), (e: any) => e.code === 'RESERVATION_CONFLICT');

    const cancelled = await svc.cancelEvent(c.organizer, a.id, 'Speaker unavailable') as any;
    assert.equal(cancelled.status, 'CANCELLED');
    assert.ok(cancelled.reservations.every((r: any) => r.status === 'CANCELLED'));
    const replay = await svc.cancelEvent(c.organizer, a.id, 'Speaker unavailable') as any;
    assert.equal(replay.idempotentReplay, true);

    // Example B for events: retrying scheduling after the blocker cleared confirms once, no duplicates.
    const [s1, s2] = await Promise.allSettled([svc.scheduleEvent(c.organizer, bId), svc.scheduleEvent(c.organizer, bId)]);
    assert.equal(s1.status, 'fulfilled');
    assert.equal(s2.status, 'fulfilled');
    const bRes = await db('campus_resource_reservations').where({ event_id: bId });
    assert.equal(bRes.length, 1);
    assert.equal(bRes[0].status, 'CONFIRMED');
    assert.equal((await db('campus_events').where({ id: bId }).first()).last_scheduling_error, null);
  });

  it('reservation retries with the same idempotency key never duplicate (Example B)', async () => {
    const c = await setup();
    const input = { resourceId: c.lab.id, startsAt: '2027-03-18T10:00', endsAt: '2027-03-18T11:00', purpose: 'Board meeting', idempotencyKey: `key-${c.tag}` };
    const results = await Promise.allSettled([1, 2, 3, 4].map(() => reservations.createReservation(c.organizer, input)));
    assert.equal(settledCounts(results).ok, 4);
    const ids = new Set((results as PromiseFulfilledResult<any>[]).map((r) => r.value.id));
    assert.equal(ids.size, 1);
    const rows = await db('campus_resource_reservations').where({ college_id: c.collegeId, idempotency_key: input.idempotencyKey });
    assert.equal(rows.length, 1);
    const retry = await reservations.createReservation(c.organizer, input);
    assert.equal(retry.idempotentReplay, true);
    await assert.rejects(() => reservations.createReservation(c.otherFaculty, input), /Idempotency key already used/);

    const cancelled = await reservations.cancelReservation(c.organizer, retry.id);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal((await reservations.cancelReservation(c.organizer, retry.id)).status, 'CANCELLED');
    await reservations.createReservation(c.otherFaculty, { ...input, idempotencyKey: `key2-${c.tag}` });
  });

  it('approval-required ad-hoc requests stay non-blocking until decided; requester cannot decide their own request', async () => {
    const c = await setup();
    const req = await reservations.createReservation(c.organizer, { resourceId: c.projector.id, startsAt: '2027-03-19T10:00', endsAt: '2027-03-19T11:00', purpose: 'Demo' });
    assert.equal(req.status, 'REQUESTED');
    const other = await reservations.createReservation(c.otherFaculty, { resourceId: c.projector.id, startsAt: '2027-03-19T10:30', endsAt: '2027-03-19T11:30', purpose: 'Demo 2' });
    await assert.rejects(() => reservations.decideReservation(c.organizer, req.id, { action: 'CONFIRM' }), (e: any) => e.status === 403);
    const selfRes = await reservations.createReservation(c.facilities, { resourceId: c.projector.id, startsAt: '2027-03-20T10:00', endsAt: '2027-03-20T11:00', purpose: 'FO demo' });
    await assert.rejects(() => reservations.decideReservation(c.facilities, selfRes.id, { action: 'CONFIRM' }), /self-approval/);
    const results = await Promise.allSettled([req.id, other.id].map((id) => reservations.decideReservation(c.facilities, id, { action: 'CONFIRM' })));
    assert.equal(settledCounts(results).ok, 1);
    assert.equal(await confirmedOverlapping(c.projector.id, '2027-03-19 00:00:00', '2027-03-20 00:00:00'), 1);
    const queue = await reservations.reservationQueue(c.facilities);
    assert.ok(queue.some((q) => q.id === selfRes.id));
  });

  it('a failing notification never rolls back the booking state (Example C)', async () => {
    const c = await setup();
    const ev = await scheduledEvent(c, [c.hall.id], { startsAt: '2027-03-22T10:00', endsAt: '2027-03-22T11:00' });
    await svc.studentRegister(c.studentCse, ev.id);
    svc.setEventsNotifierForTests({
      faculty: async () => { throw new Error('notification outage'); },
      student: async () => { throw new Error('notification outage'); },
    });
    try {
      const cancelled = await svc.cancelEvent(c.organizer, ev.id, 'Venue flooded') as any;
      assert.equal(cancelled.status, 'CANCELLED');
      assert.equal(await confirmedOverlapping(c.hall.id, '2027-03-22 00:00:00', '2027-03-23 00:00:00'), 0);
      const again = await reservations.createReservation(c.otherFaculty, { resourceId: c.hall.id, startsAt: '2027-03-22T10:00', endsAt: '2027-03-22T11:00', purpose: 'Rebook' });
      assert.equal(again.status, 'CONFIRMED');
    } finally {
      svc.setEventsNotifierForTests(null);
    }
  });

  it('tenant isolation: another college can neither read nor mutate', async () => {
    const c = await setup();
    const ev = await scheduledEvent(c, [c.hall.id], { startsAt: '2027-03-23T10:00', endsAt: '2027-03-23T11:00' });
    const is404 = (e: any) => e.status === 404;
    await assert.rejects(() => svc.getEvent(c.crossAdmin, ev.id), is404);
    await assert.rejects(() => svc.cancelEvent(c.crossAdmin, ev.id, 'cross tenant'), is404);
    await assert.rejects(() => svc.reviewEvent(c.crossAdmin, ev.id, { action: 'APPROVE' }), is404);
    await assert.rejects(() => svc.listRegistrations(c.crossAdmin, ev.id), is404);
    await assert.rejects(() => svc.addEventResource(c.organizer, ev.id, c.foreignHall.id), is404);
    await assert.rejects(() => reservations.createReservation(c.organizer, { resourceId: c.foreignHall.id, startsAt: '2027-03-23T10:00', endsAt: '2027-03-23T11:00', purpose: 'Cross' }), is404);
    await assert.rejects(async () => booking.configureResource(c.facilities, { resourceKind: 'ROOM', roomId: (await db('campus_bookable_resources').where({ id: c.foreignHall.id }).first()).room_id }), is404);
    await assert.rejects(() => svc.studentGetEvent(c.crossStudent, ev.id), is404);
    await assert.rejects(() => svc.studentRegister(c.crossStudent, ev.id), is404);
    const crossList = await svc.listEvents(c.crossAdmin);
    assert.ok(!crossList.items.some((i) => i.id === ev.id));
    const crossCal = await svc.calendar(c.crossAdmin, '2027-03-01', '2027-03-31');
    assert.equal(crossCal.reservations.length, 0);
  });

  it('same-tenant IDOR: other department and unrelated staff cannot read drafts, participants, or mutate', async () => {
    const c = await setup();
    const draft = await svc.createEvent(c.organizer, eventInput(c, { visibility: 'DEPARTMENT' }));
    const is404 = (e: any) => e.status === 404;
    await assert.rejects(() => svc.getEvent(c.otherFaculty, draft.id), is404);
    await assert.rejects(() => svc.getEvent(c.eceFaculty, draft.id), is404);
    await assert.rejects(() => svc.updateEvent(c.otherFaculty, draft.id, eventInput(c)), is404);
    await assert.rejects(() => svc.submitEvent(c.eceFaculty, draft.id), is404);
    await assert.rejects(() => svc.cancelEvent(c.otherFaculty, draft.id, 'not mine'), is404);

    const ev = await scheduledEvent(c, [c.hall.id], { visibility: 'DEPARTMENT', startsAt: '2027-03-24T10:00', endsAt: '2027-03-24T11:00' });
    await svc.studentRegister(c.studentCse, ev.id);
    const pub = await svc.getEvent(c.otherFaculty, ev.id) as any;
    assert.equal(pub.view, 'PUBLIC');
    await assert.rejects(() => svc.getEvent(c.eceFaculty, ev.id), is404);
    await assert.rejects(() => svc.studentGetEvent(c.studentEce, ev.id), is404);
    await assert.rejects(() => svc.listRegistrations(c.otherFaculty, ev.id), is404);
    await assert.rejects(() => svc.cancelEvent(c.otherFaculty, ev.id, 'not mine'), (e: any) => e.status === 403);
    await assert.rejects(() => svc.rescheduleEvent(c.otherFaculty, ev.id, { startsAt: '2027-04-24T10:00', endsAt: '2027-04-24T11:00', reason: 'mine now' }), (e: any) => e.status === 403);
    await assert.rejects(() => svc.closeEvent(c.hodEce, ev.id), is404);
    await assert.rejects(() => svc.eventsReport(c.organizer), (e: any) => e.status === 403);
    const hodReport = await svc.eventsReport(c.hodEce);
    assert.equal(hodReport.scope, 'DEPARTMENT');
    assert.equal(hodReport.byStatus.length, 0);
    await assert.rejects(async () => reservations.cancelReservation(c.otherFaculty, (await db('campus_resource_reservations').where({ event_id: ev.id }).first()).id), is404);
  });

  it('public, student and calendar views never leak internal notes, budgets or participant data', async () => {
    const c = await setup();
    const ev = await svc.createEvent(c.organizer, eventInput(c, { plannedBudget: 7777777, startsAt: '2027-03-25T10:00', endsAt: '2027-03-25T11:00' }));
    await svc.addEventResource(c.organizer, ev.id, c.hall.id);
    await svc.submitEvent(c.organizer, ev.id);
    await svc.reviewEvent(c.hodCse, ev.id, { action: 'RETURN', remarks: 'INTERNAL: budget too high' });
    await svc.submitEvent(c.organizer, ev.id);
    await svc.reviewEvent(c.hodCse, ev.id, { action: 'APPROVE' });
    await svc.reviewEvent(c.principal, ev.id, { action: 'APPROVE', remarks: 'INTERNAL: approved with conditions' });
    await svc.studentRegister(c.studentCse, ev.id);
    await reservations.createReservation(c.organizer, { resourceId: c.lab.id, startsAt: '2027-03-25T14:00', endsAt: '2027-03-25T15:00', purpose: 'SECRET purpose' });

    const forbidden = ['plannedBudget', 'reviewRemarks', 'lastSchedulingError', 'capacityOverrideReason', 'reservations', 'workflow', 'registeredCount', 'organizerFacultyId'];
    const pub = await svc.getEvent(c.otherFaculty, ev.id) as any;
    const stu = await svc.studentGetEvent(c.studentEce, ev.id) as any;
    for (const view of [pub, stu]) {
      for (const k of forbidden) assert.equal(k in view, false, `leaked ${k}`);
      assert.ok(!JSON.stringify(view).includes('INTERNAL:'));
      assert.ok(!JSON.stringify(view).includes('7777777'));
    }
    assert.equal(stu.myRegistration, null);
    const internal = await svc.getEvent(c.organizer, ev.id) as any;
    assert.equal(internal.plannedBudget, 7777777);
    const cal = await svc.calendar(c.otherFaculty, '2027-03-01', '2027-03-31');
    assert.ok(!JSON.stringify(cal).includes('SECRET purpose'));
    const staffOnly = await scheduledEvent(c, [c.lab.id], { title: `Staff only ${c.tag}`, registrationAudience: 'STAFF', expectedParticipants: 20, registrationCapacity: 20, startsAt: '2027-03-26T10:00', endsAt: '2027-03-26T11:00' });
    assert.equal(staffOnly.status, 'SCHEDULED');
    await assert.rejects(() => svc.studentGetEvent(c.studentCse, staffOnly.id), (e: any) => e.status === 404);
    const listed = await svc.studentListEvents(c.studentCse);
    assert.ok(!listed.items.some((i) => i.id === staffOnly.id));
    assert.ok(listed.items.some((i) => i.id === ev.id));
  });

  it('event documents cannot be read by guessing ids or through another event', async () => {
    const c = await setup();
    const a = await svc.createEvent(c.organizer, eventInput(c));
    const b = await svc.createEvent(c.otherFaculty, eventInput(c, { title: `Other ${c.tag}` }));
    const doc = await svc.uploadEventDocument(c.organizer, a.id, { category: 'BROCHURE', fileName: 'brochure.txt', mimeType: 'text/plain', contentBase64: Buffer.from('brochure').toString('base64') }) as any;
    const own = await svc.downloadEventDocument(c.organizer, a.id, Number(doc.id));
    assert.equal(own.buffer.toString(), 'brochure');
    assert.equal((await svc.listEventDocuments(c.organizer, a.id)).length, 1);
    const is404 = (e: any) => e.status === 404;
    await assert.rejects(() => svc.downloadEventDocument(c.otherFaculty, b.id, Number(doc.id)), is404);
    await assert.rejects(() => svc.downloadEventDocument(c.otherFaculty, a.id, Number(doc.id)), is404);
    await assert.rejects(() => svc.listEventDocuments(c.eceFaculty, a.id), is404);
    await assert.rejects(() => svc.downloadEventDocument(c.crossAdmin, a.id, Number(doc.id)), is404);
    await assert.rejects(() => svc.uploadEventDocument(c.otherFaculty, a.id, { category: 'PHOTO', fileName: 'x.txt', mimeType: 'text/plain', contentBase64: 'eA==' }), is404);
  });
});
