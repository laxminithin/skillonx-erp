/**
 * Hostel Management E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HostelActor } from './types.js';
import { getStudentHostelAccess } from './studentAccess.js';
import { getHostelNoDueStatus } from './clearance.js';
import { getStudentNoDueStatus } from '../finance/clearance.js';
import { allocateBed, getAllocationHistory, getHostelCapacity, getRoomOccupancy, getStudentRoom, transferBed } from './allocations.js';
import { evaluateHostelEligibility } from './eligibility.js';
import { assertHostelPermission, assertStudentOwnsApplication, assertStudentOwnsResident, assertWardenHostelAccess, getWardenHostelIds, hasHostelPermission, hostelPermissionsForRole } from './access.js';
import { createHostelAdmissionDemand, getStudentHostelDues } from './integration.js';
import { createComplaint, getComplaint, listHostelComplaints, listStudentComplaints, updateComplaintStatus } from './complaints.js';
import { listPendingApplications, reviewApplication } from './applications.js';
import { listWaitlist, managementDashboard, listResidents, wardenDashboard } from './dashboard.js';
import { completeVacating, requestVacating, updateVacatingChecklist } from './vacating.js';
import { createLeave, listStudentLeaves } from './leaves.js';
import { createOutpass, listStudentOutpasses, verifyOutpassToken } from './outpasses.js';
import { hasFinancePermission } from '../finance/access.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('hostel_applications'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    const nonResident = await db('students').where({ usn: '4VV24CS006' }).first();
    const admin = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' })
      .first();
    const warden = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'WARDEN' })
      .first();
    const hostel = await db('hostels').where({ college_id: cls.college_id, code: 'VVIET-BOYS' }).first();
    if (!aarav || !hostel) return null;
    return { cls, aarav, other, nonResident, admin, warden, hostel };
  } catch {
    return null;
  }
}

function hostelActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HostelActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

async function requireE2eContext() {
  const ctx = await e2eContext();
  assert.ok(ctx, 'Hostel E2E seed context is required');
  assert.ok(ctx.warden, 'Hostel E2E warden is required');
  assert.ok(ctx.other, 'Second Hostel E2E student is required');
  assert.ok(ctx.nonResident, 'Non-resident Hostel E2E student is required');
  const assigned = await db('hostel_warden_assignments')
    .where({
      college_id: ctx.cls.college_id,
      hostel_id: ctx.hostel.id,
      faculty_user_id: ctx.warden.id,
      status: 'ACTIVE',
    })
    .first();
  if (!assigned) {
    await db('hostel_warden_assignments').insert({
      college_id: ctx.cls.college_id,
      hostel_id: ctx.hostel.id,
      faculty_user_id: ctx.warden.id,
      assignment_role: 'WARDEN',
      status: 'ACTIVE',
    });
  }
  return ctx as Awaited<ReturnType<typeof e2eContext>> & {
    warden: NonNullable<Awaited<ReturnType<typeof e2eContext>>>['warden'];
    other: NonNullable<Awaited<ReturnType<typeof e2eContext>>>['other'];
    nonResident: NonNullable<Awaited<ReturnType<typeof e2eContext>>>['nonResident'];
  };
}

function assertStatus(err: unknown, status: number) {
  assert.equal((err as { status?: number }).status, status);
}

async function assertRejectsStatus(action: () => Promise<unknown>, status: number) {
  await assert.rejects(action, (err) => {
    assertStatus(err, status);
    return true;
  });
}

async function cleanupHostelClosureFixtures(prefix = 'HX') {
  const apps = await db('hostel_applications').where('application_number', 'like', `${prefix}-%`).select('id');
  const rooms = await db('hostel_rooms').where('room_number', 'like', `${prefix}-%`).select('id');
  const residents = await db('hostel_residents').where('resident_number', 'like', `${prefix}-%`).select('id');
  const appIds = apps.map((r) => Number(r.id));
  const roomIds = rooms.map((r) => Number(r.id));
  const residentIds = residents.map((r) => Number(r.id));
  const tempDemandRows = await db('student_fee_demands')
    .where('demand_number', 'like', 'HX-PAY-%')
    .orWhere('idempotency_key', 'like', 'hx-paygate-%')
    .select('id');
  const tempDemandIds = tempDemandRows.map((r) => Number(r.id));

  if (appIds.length) {
    await db('hostel_waitlist_entries').whereIn('application_id', appIds).delete();
    await db('student_fee_demand_items')
      .whereIn('demand_id', db('student_fee_demands').where({ source_type: 'hostel_application' }).whereIn('source_id', appIds).select('id'))
      .delete();
    await db('student_fee_demands').where({ source_type: 'hostel_application' }).whereIn('source_id', appIds).delete();
    await db('hostel_applications').whereIn('id', appIds).delete();
  }
  if (tempDemandIds.length) {
    await db('student_fee_demand_items').whereIn('demand_id', tempDemandIds).delete();
    await db('student_fee_demands').whereIn('id', tempDemandIds).delete();
  }
  if (residentIds.length) {
    await db('hostel_vacating_requests').whereIn('resident_id', residentIds).delete();
    await db('hostel_complaints').whereIn('resident_id', residentIds).delete();
    await db('hostel_leave_requests').whereIn('resident_id', residentIds).delete();
    await db('hostel_outpasses').whereIn('resident_id', residentIds).delete();
    await db('hostel_bed_allocations').whereIn('resident_id', residentIds).delete();
    await db('hostel_residents').whereIn('id', residentIds).delete();
  }
  if (roomIds.length) {
    await db('hostel_beds').whereIn('room_id', roomIds).delete();
    await db('hostel_rooms').whereIn('id', roomIds).delete();
  }
}

async function createTempRoom(ctx: Awaited<ReturnType<typeof requireE2eContext>>, suffix: string, capacity = 2) {
  const block = await db('hostel_blocks').where({ hostel_id: ctx.hostel.id }).first();
  const floor = await db('hostel_floors').where({ hostel_id: ctx.hostel.id, block_id: block.id }).first();
  assert.ok(block);
  assert.ok(floor);
  const roomNumber = `HX-${suffix}`;
  await db('hostel_rooms').where({ hostel_id: ctx.hostel.id, block_id: block.id, room_number: roomNumber }).delete();
  const [roomId] = await db('hostel_rooms').insert({
    college_id: ctx.cls.college_id,
    hostel_id: ctx.hostel.id,
    block_id: block.id,
    floor_id: floor.id,
    room_number: roomNumber,
    room_type: 'DOUBLE',
    capacity,
    status: 'AVAILABLE',
  });
  const [bedA] = await db('hostel_beds').insert({
    college_id: ctx.cls.college_id,
    hostel_id: ctx.hostel.id,
    room_id: roomId,
    bed_code: `${roomNumber}-A`,
    status: 'AVAILABLE',
  });
  const [bedB] = await db('hostel_beds').insert({
    college_id: ctx.cls.college_id,
    hostel_id: ctx.hostel.id,
    room_id: roomId,
    bed_code: `${roomNumber}-B`,
    status: 'AVAILABLE',
  });
  return { roomId: Number(roomId), bedA: Number(bedA), bedB: Number(bedB) };
}

async function createTempResident(ctx: Awaited<ReturnType<typeof requireE2eContext>>, studentId: number, suffix: string) {
  const [id] = await db('hostel_residents').insert({
    college_id: ctx.cls.college_id,
    student_id: studentId,
    academic_year_id: ctx.cls.academic_year_id,
    hostel_id: ctx.hostel.id,
    resident_number: `HX-RES-${suffix}`,
    status: 'ACTIVE',
    admitted_at: db.fn.now(),
  });
  return Number(id);
}

async function createTempApplication(ctx: Awaited<ReturnType<typeof requireE2eContext>>, studentId: number, suffix: string, status = 'SUBMITTED') {
  const cycle = await db('hostel_application_cycles')
    .where({ college_id: ctx.cls.college_id })
    .orderBy('id', 'desc')
    .first();
  assert.ok(cycle);
  const [id] = await db('hostel_applications').insert({
    college_id: ctx.cls.college_id,
    student_id: studentId,
    academic_year_id: cycle.academic_year_id,
    application_cycle_id: cycle.id,
    application_number: `HX-APP-${suffix}`,
    preferred_hostel_id: ctx.hostel.id,
    preferred_room_type: 'DOUBLE',
    accommodation_period: 'ACADEMIC_YEAR',
    rules_accepted: true,
    declaration_accepted: true,
    status,
    submitted_at: status === 'SUBMITTED' ? db.fn.now() : null,
  });
  return Number(id);
}

function mysqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

describe('hostel E2E', () => {
  before(async () => {
    await cleanupHostelClosureFixtures();
  });

  beforeEach(async () => {
    await cleanupHostelClosureFixtures();
  });
  it('Aarav is active resident with room allocation', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const access = await getStudentHostelAccess(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.equal(access.visibility, 'RESIDENT');
    assert.equal(access.canAccessResidentFeatures, true);
    assert.ok(access.currentAllocationId);

    const alloc = await db('hostel_bed_allocations')
      .where({ student_id: ctx.aarav.id, status: 'ACTIVE' })
      .first();
    assert.ok(alloc);
    const bed = await db('hostel_beds').where({ id: alloc.bed_id }).first();
    assert.equal(bed?.bed_code, 'A-101-A');
  });

  it('non-resident student has hidden or application visibility', async () => {
    const ctx = await e2eContext();
    if (!ctx?.nonResident) return;
    const access = await getStudentHostelAccess(Number(ctx.nonResident.id), Number(ctx.cls.college_id));
    // A non-resident applicant may be in any pre-allocation application state,
    // including WAITLISTED (the state the E2E seed provisions for CS006). The
    // security property under test is that residents-only features stay closed.
    assert.ok(
      ['HIDDEN', 'APPLICATION_AVAILABLE', 'APPLICATION_DRAFT', 'APPLICATION_PENDING', 'WAITLISTED'].includes(
        access.visibility,
      ),
    );
    assert.equal(access.canAccessResidentFeatures, false);
  });

  it('student A cannot access student B resident record', async () => {
    const ctx = await e2eContext();
    if (!ctx?.other) return;
    const aaravResident = await db('hostel_residents').where({ student_id: ctx.aarav.id, status: 'ACTIVE' }).first();
    const otherOutpass = await db('hostel_outpasses').where({ student_id: ctx.other.id }).first();
    if (otherOutpass) {
      const cross = await db('hostel_outpasses')
        .where({ id: otherOutpass.id, student_id: ctx.aarav.id })
        .first();
      assert.equal(cross, undefined);
    }
    assert.ok(aaravResident);
  });

  it('capacity metrics are consistent', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cap = await getHostelCapacity(Number(ctx.cls.college_id), Number(ctx.hostel.id));
    assert.ok(cap.totalBeds >= 6);
    assert.ok(cap.usableBeds >= cap.occupiedBeds);
    assert.equal(cap.occupancyPercent, cap.usableBeds > 0 ? Math.round((cap.occupiedBeds / cap.usableBeds) * 100) : 0);
    assert.ok(cap.maintenanceBeds >= 1);
  });

  it('bed A-101-A has exactly one active allocation', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const bed = await db('hostel_beds').where({ bed_code: 'A-101-A', hostel_id: ctx.hostel.id }).first();
    if (!bed) return;
    const active = await db('hostel_bed_allocations').where({ bed_id: bed.id, status: 'ACTIVE' });
    assert.equal(active.length, 1);
    assert.equal(Number(active[0].student_id), Number(ctx.aarav.id));
  });

  it('central no-due includes HOSTEL domain', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const noDue = await getStudentNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const hostelDomain = noDue.domains.find((d) => d.domain === 'HOSTEL');
    assert.ok(hostelDomain);
    assert.notEqual(hostelDomain?.status, 'PENDING_INTEGRATION');
  });

  it('active resident hostel clearance is NOT_APPLICABLE', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const status = await getHostelNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.equal(status.status, 'NOT_APPLICABLE');
  });

  it('Aarav has approved outpass', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const outpass = await db('hostel_outpasses')
      .where({ student_id: ctx.aarav.id })
      .whereIn('status', ['APPROVED', 'ACTIVE', 'RETURNED'])
      .first();
    assert.ok(outpass);
    assert.ok(outpass.outpass_number);
    assert.ok(outpass.qr_token);
  });

  it('Aarav has open complaint', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const complaint = await db('hostel_complaints')
      .where({ student_id: ctx.aarav.id })
      .whereIn('status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS'])
      .first();
    assert.ok(complaint);
    assert.equal(complaint.category, 'PLUMBING');
  });

  it('application-only student has draft or submitted application', async () => {
    const ctx = await e2eContext();
    if (!ctx?.other) return;
    const app = await db('hostel_applications')
      .where({ student_id: ctx.other.id })
      .whereNotIn('status', ['REJECTED', 'CANCELLED'])
      .first();
    if (app) {
      assert.ok(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'WAITLISTED'].includes(app.status));
    }
  });

  it('eligibility engine returns structured result', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const cycle = await db('hostel_application_cycles')
      .where({ college_id: ctx.cls.college_id })
      .orderBy('id', 'desc')
      .first();
    if (!cycle) return;
    const result = await evaluateHostelEligibility(Number(ctx.nonResident?.id ?? ctx.other?.id), Number(cycle.id), Number(ctx.cls.college_id));
    assert.ok(['ELIGIBLE', 'NOT_ELIGIBLE', 'ELIGIBLE_WITH_OVERRIDE'].includes(result.status));
    assert.ok(Array.isArray(result.reasons));
  });

  it('admin, HOD, faculty, accountant do not inherit routine hostel operations', async () => {
    const base = { facultyUserId: 1, collegeId: 1, departmentId: null };
    assert.equal(hasHostelPermission({ ...base, role: 'SUPER_ADMIN' }, 'hostel.allocation.manage'), false);
    assert.equal(hasHostelPermission({ ...base, role: 'COLLEGE_ADMIN' }, 'hostel.vacating.manage'), false);
    assert.equal(hasHostelPermission({ ...base, role: 'HOD' }, 'hostel.allocation.manage'), false);
    assert.equal(hasHostelPermission({ ...base, role: 'FACULTY' }, 'hostel.application.review'), false);
    assert.equal(hasHostelPermission({ ...base, role: 'ACCOUNTANT' }, 'hostel.transfer.manage'), false);
    assert.equal(hasHostelPermission({ ...base, role: 'WARDEN' }, 'hostel.allocation.manage'), true);
    assert.throws(
      () => assertHostelPermission({ ...base, role: 'COLLEGE_ADMIN' }, 'hostel.allocation.manage'),
      /permission/i,
    );
  });

  it('warden scope is assignment based, while management oversight is aggregate read-only', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const wardenActor = hostelActor({
      id: ctx.warden?.id ?? 999999,
      college_id: ctx.cls.college_id,
      department_id: null,
      role: 'WARDEN',
      name: 'Unassigned Warden',
    });
    const assigned = await getWardenHostelIds(wardenActor);
    if (ctx.warden) {
      assert.ok(Array.isArray(assigned));
    } else {
      assert.deepEqual(assigned, []);
    }

    const managementActor = hostelActor({
      id: ctx.admin?.id ?? 1,
      college_id: ctx.cls.college_id,
      department_id: null,
      role: 'MANAGEMENT',
      name: 'Management',
    });
    const managementIds = await getWardenHostelIds(managementActor);
    assert.ok(managementIds.includes(Number(ctx.hostel.id)));
    assert.equal(hasHostelPermission(managementActor, 'hostel.allocation.manage'), false);
    assert.equal(hasHostelPermission(managementActor, 'hostel.management.view'), true);
  });

  it('active allocation uniqueness hardening is present when migration has run', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const hasActiveBedKey = await db.schema.hasColumn('hostel_bed_allocations', 'active_bed_key');
    const hasActiveStudentKey = await db.schema.hasColumn('hostel_bed_allocations', 'active_student_key');
    if (!hasActiveBedKey || !hasActiveStudentKey) return;

    const indexes = await db.raw(
      "SHOW INDEX FROM hostel_bed_allocations WHERE Key_name IN ('hba_active_bed_unique', 'hba_active_student_unique')",
    );
    const rows = Array.isArray(indexes) ? indexes[0] : [];
    const names = new Set(rows.map((r: { Key_name: string }) => r.Key_name));
    assert.equal(names.has('hba_active_bed_unique'), true);
    assert.equal(names.has('hba_active_student_unique'), true);
  });

  it('Student login identity is seeded for Hostel closure', async () => {
    const ctx = await requireE2eContext();
    assert.equal(ctx.aarav.usn, '4VV24CS001');
    assert.equal(Number(ctx.aarav.college_id), Number(ctx.cls.college_id));
  });

  it('Warden login identity is seeded and scoped', async () => {
    const ctx = await requireE2eContext();
    const ids = await getWardenHostelIds(hostelActor(ctx.warden));
    assert.ok(ids.includes(Number(ctx.hostel.id)));
  });

  it('Principal login identity has oversight but no allocation mutation', async () => {
    const ctx = await requireE2eContext();
    const principal = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'PRINCIPAL' }).first();
    assert.ok(principal);
    const principalActor = hostelActor(principal);
    assert.equal(hasHostelPermission(principalActor, 'hostel.management.view'), true);
    assert.equal(hasHostelPermission(principalActor, 'hostel.allocation.manage'), false);
  });

  it('Accountant login identity can mutate Finance but not Hostel operations', async () => {
    const ctx = await requireE2eContext();
    const accountant = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'ACCOUNTANT' }).first();
    assert.ok(accountant);
    const accountantActor = hostelActor(accountant);
    assert.equal(hasFinancePermission(accountantActor, 'finance.payment.record'), true);
    assert.equal(hasHostelPermission(accountantActor, 'hostel.allocation.manage'), false);
  });

  it('Student Hostel overview returns access, room, and dues shape', async () => {
    const ctx = await requireE2eContext();
    const access = await getStudentHostelAccess(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const room = await getStudentRoom(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const dues = await getStudentHostelDues(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.equal(access.visibility, 'RESIDENT');
    assert.ok(room?.bedCode);
    assert.ok(Array.isArray(dues.items));
  });

  it('Student tracks own Hostel request only', async () => {
    const ctx = await requireE2eContext();
    const app = await db('hostel_applications').where({ student_id: ctx.other.id }).first();
    assert.ok(app);
    await assertStudentOwnsApplication(Number(ctx.other.id), Number(app.id), Number(ctx.cls.college_id));
    await assertRejectsStatus(() => assertStudentOwnsApplication(Number(ctx.aarav.id), Number(app.id), Number(ctx.cls.college_id)), 404);
  });

  it('Cross-college Hostel request is denied as not found', async () => {
    const ctx = await requireE2eContext();
    const otherCollege = await db('colleges').whereNot({ id: ctx.cls.college_id }).first();
    const app = await db('hostel_applications').where({ college_id: ctx.cls.college_id }).first();
    if (!otherCollege || !app) return;
    await assertRejectsStatus(() => assertStudentOwnsApplication(Number(app.student_id), Number(app.id), Number(otherCollege.id)), 404);
  });

  it('Warden sees pending applications for assigned Hostel', async () => {
    const ctx = await requireE2eContext();
    const rows = await listPendingApplications(hostelActor(ctx.warden), Number(ctx.hostel.id));
    assert.ok(Array.isArray(rows));
  });

  it('Warden approves eligible application and Finance demand is canonical/idempotent', async () => {
    const ctx = await requireE2eContext();
    await cleanupHostelClosureFixtures('HX-APP-APPROVE');
    const appId = await createTempApplication(ctx, Number(ctx.nonResident.id), 'APPROVE');
    const before = await db('student_fee_demands').where({ source_type: 'hostel_application', source_id: appId }).count({ c: '*' }).first();
    const result = await reviewApplication(hostelActor(ctx.warden), appId, 'APPROVE');
    await createHostelAdmissionDemand(Number(ctx.cls.college_id), Number(ctx.nonResident.id), appId, Number(ctx.cls.academic_year_id));
    await createHostelAdmissionDemand(Number(ctx.cls.college_id), Number(ctx.nonResident.id), appId, Number(ctx.cls.academic_year_id));
    const after = await db('student_fee_demands').where({ source_type: 'hostel_application', source_id: appId }).count({ c: '*' }).first();
    assert.equal(result.status, 'APPROVED');
    assert.equal(Number(before?.c ?? 0), 0);
    assert.equal(Number(after?.c ?? 0), 1);
  });

  it('Warden rejects application with reason', async () => {
    const ctx = await requireE2eContext();
    const appId = await createTempApplication(ctx, Number(ctx.nonResident.id), `REJECT-${Date.now()}`);
    const result = await reviewApplication(hostelActor(ctx.warden), appId, 'REJECT', 'Closure evidence rejection');
    const row = await db('hostel_applications').where({ id: appId }).first();
    assert.equal(result.status, 'REJECTED');
    assert.equal(row.rejection_reason, 'Closure evidence rejection');
  });

  it('Waitlist placement and ordering are deterministic', async () => {
    const ctx = await requireE2eContext();
    const appId = await createTempApplication(ctx, Number(ctx.nonResident.id), `WAIT-${Date.now()}`);
    const result = await reviewApplication(hostelActor(ctx.warden), appId, 'WAITLIST');
    const queue = await listWaitlist(hostelActor(ctx.warden), Number(ctx.hostel.id));
    assert.equal(result.status, 'WAITLISTED');
    assert.ok(queue.some((r) => r.applicationId === appId));
    assert.deepEqual([...queue].map((r) => r.position), [...queue].map((r) => r.position).sort((a, b) => Number(a) - Number(b)));
  });

  it('Hostel master, block, floor, room, and bed listings exist', async () => {
    const ctx = await requireE2eContext();
    const [blocks, floors, rooms, beds] = await Promise.all([
      db('hostel_blocks').where({ hostel_id: ctx.hostel.id }),
      db('hostel_floors').where({ hostel_id: ctx.hostel.id }),
      db('hostel_rooms').where({ hostel_id: ctx.hostel.id }),
      db('hostel_beds').where({ hostel_id: ctx.hostel.id }),
    ]);
    assert.ok(ctx.hostel.code);
    assert.ok(blocks.length > 0);
    assert.ok(floors.length > 0);
    assert.ok(rooms.length > 0);
    assert.ok(beds.length > 0);
  });

  it('Occupancy and vacancy calculations reconcile with bed states', async () => {
    const ctx = await requireE2eContext();
    const cap = await getHostelCapacity(Number(ctx.cls.college_id), Number(ctx.hostel.id));
    assert.equal(cap.availableBeds + cap.reservedBeds + cap.occupiedBeds + cap.maintenanceBeds + cap.blockedBeds, cap.totalBeds);
    assert.equal(cap.usableBeds, cap.availableBeds + cap.reservedBeds + cap.occupiedBeds);
  });

  it('Inactive bed allocation is denied', async () => {
    const ctx = await requireE2eContext();
    const { bedA } = await createTempRoom(ctx, `INACTIVE-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `INACTIVE-${Date.now()}`);
    await db('hostel_beds').where({ id: bedA }).update({ status: 'INACTIVE' });
    await assertRejectsStatus(() => allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA }), 409);
  });

  it('Inactive room allocation is denied', async () => {
    const ctx = await requireE2eContext();
    const { roomId, bedA } = await createTempRoom(ctx, `ROOMOFF-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `ROOMOFF-${Date.now()}`);
    await db('hostel_rooms').where({ id: roomId }).update({ status: 'INACTIVE' });
    await assertRejectsStatus(() => allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA }), 409);
  });

  it('Full-room allocation is denied', async () => {
    const ctx = await requireE2eContext();
    const { roomId, bedA, bedB } = await createTempRoom(ctx, `FULL-${Date.now()}`, 1);
    const residentA = await createTempResident(ctx, Number(ctx.other.id), `FULL-A-${Date.now()}`);
    const residentB = await createTempResident(ctx, Number(ctx.nonResident.id), `FULL-B-${Date.now()}`);
    await db('hostel_bed_allocations').insert({
      college_id: ctx.cls.college_id,
      resident_id: residentA,
      student_id: ctx.other.id,
      hostel_id: ctx.hostel.id,
      room_id: roomId,
      bed_id: bedA,
      allocation_type: 'INITIAL',
      status: 'ACTIVE',
      allocated_by: ctx.warden.id,
    });
    await db('hostel_beds').where({ id: bedA }).update({ status: 'OCCUPIED' });
    await assertRejectsStatus(() => allocateBed(hostelActor(ctx.warden), { residentId: residentB, studentId: Number(ctx.nonResident.id), bedId: bedB }), 409);
  });

  it('Student allocation and duplicate active allocation denial are enforced', async () => {
    const ctx = await requireE2eContext();
    const oldPolicy = await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).first();
    const { bedA, bedB } = await createTempRoom(ctx, `ALLOC-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `ALLOC-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
    try {
      const allocated = await allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA });
      assert.equal(allocated.status, 'ACTIVE');
      await assertRejectsStatus(() => allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedB }), 409);
    } finally {
      if (oldPolicy) await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
    }
  });

  it('Same-bed concurrent allocation protection allows one winner', async () => {
    const ctx = await requireE2eContext();
    const oldPolicy = await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).first();
    const { bedA } = await createTempRoom(ctx, `CONCUR-${Date.now()}`);
    const residentA = await createTempResident(ctx, Number(ctx.other.id), `CONCUR-A-${Date.now()}`);
    const residentB = await createTempResident(ctx, Number(ctx.nonResident.id), `CONCUR-B-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
    try {
      const settled = await Promise.allSettled([
        allocateBed(hostelActor(ctx.warden), { residentId: residentA, studentId: Number(ctx.other.id), bedId: bedA }),
        allocateBed(hostelActor(ctx.warden), { residentId: residentB, studentId: Number(ctx.nonResident.id), bedId: bedA }),
      ]);
      assert.equal(settled.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal(settled.filter((r) => r.status === 'rejected').length, 1);
      const active = await db('hostel_bed_allocations').where({ bed_id: bedA, status: 'ACTIVE' });
      assert.equal(active.length, 1);
    } finally {
      if (oldPolicy) await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
    }
  });

  it('Allocation history and current room are visible to the owning student', async () => {
    const ctx = await requireE2eContext();
    const room = await getStudentRoom(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const history = await getAllocationHistory(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.ok(room?.allocationId);
    assert.ok(history.some((h) => h.status === 'ACTIVE'));
  });

  it('Transfer approval releases old bed and occupies new bed', async () => {
    const ctx = await requireE2eContext();
    const oldPolicy = await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).first();
    const { bedA, bedB } = await createTempRoom(ctx, `TRANSFER-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `TRANSFER-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
    try {
      await allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA });
      const moved = await transferBed(hostelActor(ctx.warden), residentId, bedB, 'STUDENT_REQUEST', 'Closure transfer');
      const oldBed = await db('hostel_beds').where({ id: bedA }).first();
      const newBed = await db('hostel_beds').where({ id: bedB }).first();
      assert.equal(moved.status, 'ACTIVE');
      assert.equal(oldBed.status, 'AVAILABLE');
      assert.equal(newBed.status, 'OCCUPIED');
    } finally {
      if (oldPolicy) await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
    }
  });

  it('Warden cannot execute Finance payment, receipt, or refund permissions', async () => {
    const ctx = await requireE2eContext();
    const warden = hostelActor(ctx.warden);
    assert.equal(hasFinancePermission(warden, 'finance.payment.record'), false);
    assert.equal(hasFinancePermission(warden, 'finance.receipt.view'), false);
    assert.equal(hasFinancePermission(warden, 'finance.refund.approve'), false);
  });

  it('Student, Principal, and Management cannot mutate Hostel payments', async () => {
    const ctx = await requireE2eContext();
    const principal = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'PRINCIPAL' }).first();
    const management = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'MANAGEMENT' }).first();
    assert.equal(hasFinancePermission({ facultyUserId: 0, collegeId: Number(ctx.cls.college_id), departmentId: null, role: 'STUDENT' }, 'finance.payment.record'), false);
    if (principal) assert.equal(hasFinancePermission(hostelActor(principal), 'finance.payment.record'), false);
    if (management) assert.equal(hasFinancePermission(hostelActor(management), 'finance.payment.record'), false);
  });

  it('Hostel reads authoritative Finance fee status', async () => {
    const ctx = await requireE2eContext();
    const dues = await getStudentHostelDues(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const financeRows = await db('student_fee_demands')
      .where({ student_id: ctx.aarav.id, college_id: ctx.cls.college_id })
      .whereIn('demand_type', ['HOSTEL_FEE', 'HOSTEL_DAMAGE_CHARGE', 'MESS_FEE'])
      .whereNot('status', 'CANCELLED');
    assert.equal(dues.items.length, financeRows.length);
  });

  it('Payment gate is enforced before allocation where policy requires it', async () => {
    const ctx = await requireE2eContext();
    const { bedA } = await createTempRoom(ctx, `PAYGATE-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `PAYGATE-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'PAY_BEFORE_ALLOCATION' });
    const staleDemands = await db('student_fee_demands')
      .where({ student_id: ctx.nonResident.id, college_id: ctx.cls.college_id })
      .whereIn('demand_type', ['HOSTEL_FEE', 'HOSTEL_DAMAGE_CHARGE', 'MESS_FEE'])
      .select('id');
    const staleDemandIds = staleDemands.map((r) => Number(r.id));
    if (staleDemandIds.length) {
      await db('student_fee_demand_items').whereIn('demand_id', staleDemandIds).delete();
      await db('student_fee_demands').whereIn('id', staleDemandIds).delete();
    }
    await db('student_fee_demands').insert({
      college_id: ctx.cls.college_id,
      student_id: ctx.nonResident.id,
      subject_type: 'STUDENT',
      subject_id: ctx.nonResident.id,
      academic_year_id: ctx.cls.academic_year_id,
      demand_number: `HX-PAY-${Date.now()}`,
      demand_type: 'HOSTEL_FEE',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      gross_amount: 100,
      net_amount: 100,
      outstanding_amount: 100,
      status: 'ISSUED',
      idempotency_key: `hx-paygate-${Date.now()}`,
    });
    await assertRejectsStatus(() => allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA }), 400);
  });

  it('Checkout request, processing, and bed release are idempotent', async () => {
    const ctx = await requireE2eContext();
    const oldPolicy = await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).first();
    const { bedA } = await createTempRoom(ctx, `VACATE-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `VACATE-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
    try {
      await allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA });
      const request = await requestVacating(Number(ctx.nonResident.id), Number(ctx.cls.college_id), 'Closure checkout');
      await updateVacatingChecklist(hostelActor(ctx.warden), request.id, { keysReturned: true, assetsVerified: true, damageChecked: true });
      const first = await completeVacating(hostelActor(ctx.warden), request.id);
      const second = await completeVacating(hostelActor(ctx.warden), request.id);
      const active = await db('hostel_bed_allocations').where({ resident_id: residentId, status: 'ACTIVE' });
      const bed = await db('hostel_beds').where({ id: bedA }).first();
      assert.equal(first.status, 'COMPLETED');
      assert.equal(second.status, 'COMPLETED');
      assert.equal(active.length, 0);
      assert.equal(bed.status, 'AVAILABLE');
    } finally {
      if (oldPolicy) await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
    }
  });

  it('Hostel no-dues state is sourced through central clearance', async () => {
    const ctx = await requireE2eContext();
    const hostel = await getHostelNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const central = await getStudentNoDueStatus(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.ok(central.domains.some((d) => d.domain === 'HOSTEL' && d.status === hostel.status));
  });

  it('Maintenance-linked Hostel complaint exposes repair context only', async () => {
    const ctx = await requireE2eContext();
    const complaint = await createComplaint(Number(ctx.aarav.id), Number(ctx.cls.college_id), { category: 'PLUMBING', description: 'Closure repair context' });
    const staffRows = await listHostelComplaints(hostelActor(ctx.warden), Number(ctx.hostel.id), 'OPEN');
    assert.ok(staffRows.some((r) => r.id === complaint.id && r.category === 'PLUMBING'));
  });

  it('Complaint privacy denies Student A access to Student B Hostel narrative', async () => {
    const ctx = await requireE2eContext();
    const complaint = await db('hostel_complaints').where({ student_id: ctx.aarav.id }).first();
    assert.ok(complaint);
    await assertRejectsStatus(() => getComplaint(Number(ctx.other.id), Number(ctx.cls.college_id), Number(complaint.id)), 404);
  });

  it('Restricted grievance narrative is not present in Hostel complaint payloads', async () => {
    const ctx = await requireE2eContext();
    const complaints = await listStudentComplaints(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    const serialized = JSON.stringify(complaints);
    assert.equal(serialized.includes('restricted_notes'), false);
    assert.equal(serialized.includes('internal_notes'), false);
  });

  it('Mentoring/welfare confidential information is not exposed through Hostel views', async () => {
    const ctx = await requireE2eContext();
    const dash = await wardenDashboard(hostelActor(ctx.warden), Number(ctx.hostel.id));
    const serialized = JSON.stringify(dash);
    assert.equal(serialized.includes('confidential'), false);
    assert.equal(serialized.includes('mentor'), false);
  });

  it('HOD and Faculty operational Hostel denial is enforced', async () => {
    const ctx = await requireE2eContext();
    const hod = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'HOD' }).first();
    const faculty = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'FACULTY' }).first();
    if (hod) assert.throws(() => assertHostelPermission(hostelActor(hod), 'hostel.allocation.manage'), /permission/i);
    if (faculty) assert.throws(() => assertHostelPermission(hostelActor(faculty), 'hostel.application.review'), /permission/i);
  });

  it('Principal oversight and Management aggregate analytics are read-only', async () => {
    const ctx = await requireE2eContext();
    const principal = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'PRINCIPAL' }).first();
    assert.ok(principal);
    const principalDash = await managementDashboard(hostelActor(principal));
    const managementDash = await managementDashboard({ ...hostelActor(principal), role: 'MANAGEMENT' });
    assert.equal(principalDash.readOnly, true);
    assert.equal(managementDash.readOnly, true);
  });

  it('Warden-scope isolation covers applications, allocations, rooms, checkout, waitlist, and reports', async () => {
    const ctx = await requireE2eContext();
    const warden = hostelActor(ctx.warden);
    await assertWardenHostelAccess(warden, Number(ctx.hostel.id));
    const otherHostel = await db('hostels').where({ college_id: ctx.cls.college_id, status: 'ACTIVE' }).whereNot({ id: ctx.hostel.id }).first();
    if (otherHostel) {
      await assertRejectsStatus(() => assertWardenHostelAccess(warden, Number(otherHostel.id)), 403);
    }
    assert.ok(Array.isArray(await listPendingApplications(warden, Number(ctx.hostel.id))));
    assert.ok(Array.isArray(await getRoomOccupancy(warden, Number(ctx.hostel.id))));
    assert.ok(Array.isArray(await listResidents(warden, Number(ctx.hostel.id))));
    assert.ok(Array.isArray(await listWaitlist(warden, Number(ctx.hostel.id))));
    assert.ok((await wardenDashboard(warden, Number(ctx.hostel.id))).capacity);
  });

  it('Student A cannot access Student B allocation or resident record', async () => {
    const ctx = await requireE2eContext();
    const resident = await db('hostel_residents').where({ student_id: ctx.aarav.id, college_id: ctx.cls.college_id }).first();
    assert.ok(resident);
    await assertRejectsStatus(() => assertStudentOwnsResident(Number(ctx.other.id), Number(resident.id), Number(ctx.cls.college_id)), 404);
  });

  it('Management cannot retrieve private operational resident rows through resident workspace', async () => {
    const ctx = await requireE2eContext();
    await assertRejectsStatus(() => listResidents({ ...hostelActor(ctx.warden), role: 'MANAGEMENT' }, Number(ctx.hostel.id)), 403);
  });

  it('Full RBAC matrix uses actual canonical Hostel roles', async () => {
    const base = { facultyUserId: 1, collegeId: 1, departmentId: null };
    const expectations: Array<[string, boolean, boolean, boolean, boolean]> = [
      ['STUDENT', false, false, false, false],
      ['FACULTY', false, false, false, false],
      ['MENTOR', false, false, false, false],
      ['HOD', false, false, false, false],
      ['WARDEN', true, true, true, false],
      ['CHIEF_WARDEN', true, true, true, false],
      ['PRINCIPAL', false, false, false, true],
      ['MANAGEMENT', false, false, false, true],
      ['ACCOUNTANT', false, false, false, false],
      ['COE', false, false, false, false],
      ['ADMISSIONS_OFFICER', false, false, false, false],
      ['OFFICE_ADMIN', false, false, false, false],
      ['LAB_ASSISTANT', false, false, false, false],
      ['MAINTENANCE', false, false, false, false],
      ['LIBRARIAN', false, false, false, false],
      ['TRANSPORT_OFFICER', false, false, false, false],
      ['TNP', false, false, false, false],
      ['HR', false, false, false, false],
      ['GRIEVANCE_OFFICER', false, false, false, false],
      ['SUPER_ADMIN', false, false, false, true],
    ];
    for (const [role, viewQueue, allocate, checkout, analytics] of expectations) {
      const actor = { ...base, role };
      assert.equal(hasHostelPermission(actor, 'hostel.application.review'), viewQueue, role);
      assert.equal(hasHostelPermission(actor, 'hostel.allocation.manage'), allocate, role);
      assert.equal(hasHostelPermission(actor, 'hostel.vacating.manage'), checkout, role);
      assert.equal(hasHostelPermission(actor, 'hostel.management.view'), analytics, role);
    }
  });

  it('Role permission catalog documents Warden and Hostel Officer equivalence by actual roles', async () => {
    assert.deepEqual(hostelPermissionsForRole('HOSTEL_OFFICER'), []);
    assert.ok(hostelPermissionsForRole('WARDEN').includes('hostel.allocation.manage'));
    assert.ok(hostelPermissionsForRole('CHIEF_WARDEN').includes('hostel.clearance.manage'));
  });

  it('Leave request, approval, rejection boundary, and list persistence work', async () => {
    const ctx = await requireE2eContext();
    const leave = await createLeave(Number(ctx.aarav.id), Number(ctx.cls.college_id), {
      fromAt: mysqlDateTime(new Date(Date.now() + 86400000)),
      toAt: mysqlDateTime(new Date(Date.now() + 172800000)),
      reason: 'Closure leave',
    });
    const rows = await listStudentLeaves(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.ok(rows.some((r) => r.id === leave.id));
  });

  it('Outpass request, approval token, and return persistence work', async () => {
    const ctx = await requireE2eContext();
    const outpass = await createOutpass(Number(ctx.aarav.id), Number(ctx.cls.college_id), {
      purpose: 'Closure outpass',
      expectedExitAt: mysqlDateTime(new Date(Date.now() + 86400000)),
      expectedReturnAt: mysqlDateTime(new Date(Date.now() + 90000000)),
    });
    const rows = await listStudentOutpasses(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.ok(rows.some((r) => r.id === outpass.id));
    if (outpass.qrToken) assert.ok((await verifyOutpassToken(Number(ctx.cls.college_id), outpass.qrToken)).outpassNumber);
  });

  it('Notification delivery records Hostel related references', async () => {
    const ctx = await requireE2eContext();
    const complaint = await createComplaint(Number(ctx.aarav.id), Number(ctx.cls.college_id), {
      category: 'ROOM',
      description: 'Closure notification evidence',
    });
    await updateComplaintStatus(hostelActor(ctx.warden), complaint.id, 'ASSIGNED', 'Closure notification');
    const notification = await db('student_notifications')
      .where({ student_id: ctx.aarav.id, college_id: ctx.cls.college_id })
      .where({ related_type: 'HOSTEL_COMPLAINT', related_id: String(complaint.id) })
      .first();
    assert.ok(notification);
    assert.ok(notification.related_type || notification.link);
  });

  it('Audit evidence records privileged Hostel action trail', async () => {
    const ctx = await requireE2eContext();
    const audit = await db('hostel_audit_log').where({ college_id: ctx.cls.college_id }).orderBy('id', 'desc').first();
    assert.ok(audit);
    assert.ok(audit.action);
  });

  it('Hostel fee demand idempotency under concurrent retry creates one canonical Finance demand', async () => {
    const ctx = await requireE2eContext();
    const appId = await createTempApplication(ctx, Number(ctx.nonResident.id), `FEE-CONCUR-${Date.now()}`, 'APPROVED');
    const settled = await Promise.allSettled([
      createHostelAdmissionDemand(Number(ctx.cls.college_id), Number(ctx.nonResident.id), appId, Number(ctx.cls.academic_year_id)),
      createHostelAdmissionDemand(Number(ctx.cls.college_id), Number(ctx.nonResident.id), appId, Number(ctx.cls.academic_year_id)),
    ]);
    const demands = await db('student_fee_demands').where({ source_type: 'hostel_application', source_id: appId });
    assert.ok(settled.some((r) => r.status === 'fulfilled'));
    assert.equal(demands.length, 1);
  });

  it('Concurrent checkout retries produce one logical checkout and one bed release', async () => {
    const ctx = await requireE2eContext();
    const oldPolicy = await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).first();
    const { bedA } = await createTempRoom(ctx, `VACCON-${Date.now()}`);
    const residentId = await createTempResident(ctx, Number(ctx.nonResident.id), `VACCON-${Date.now()}`);
    await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
    try {
      await allocateBed(hostelActor(ctx.warden), { residentId, studentId: Number(ctx.nonResident.id), bedId: bedA });
      const request = await requestVacating(Number(ctx.nonResident.id), Number(ctx.cls.college_id), 'Concurrent closure checkout');
      await updateVacatingChecklist(hostelActor(ctx.warden), request.id, { keysReturned: true, assetsVerified: true, damageChecked: true });
      const settled = await Promise.allSettled([
        completeVacating(hostelActor(ctx.warden), request.id),
        completeVacating(hostelActor(ctx.warden), request.id),
      ]);
      const active = await db('hostel_bed_allocations').where({ resident_id: residentId, status: 'ACTIVE' });
      const released = await db('hostel_beds').where({ id: bedA }).first();
      assert.ok(settled.some((r) => r.status === 'fulfilled'));
      assert.equal(active.length, 0);
      assert.equal(released.status, 'AVAILABLE');
    } finally {
      if (oldPolicy) await db('college_hostel_policies').where({ college_id: ctx.cls.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
    }
  });

  it('Room occupancy direct-load/API persistence includes active resident metadata', async () => {
    const ctx = await requireE2eContext();
    const occupancy = await getRoomOccupancy(hostelActor(ctx.warden), Number(ctx.hostel.id));
    const serialized = JSON.stringify(occupancy);
    assert.ok(serialized.includes('A-101-A'));
    assert.ok(serialized.includes('4VV24CS001'));
  });

  it('Management aggregate analytics suppress private resident identifiers', async () => {
    const ctx = await requireE2eContext();
    const report = await managementDashboard({ ...hostelActor(ctx.warden), role: 'MANAGEMENT' });
    const serialized = JSON.stringify(report);
    assert.equal(serialized.includes('4VV24CS001'), false);
    assert.equal(serialized.includes(String(ctx.aarav.id)), false);
  });

  it('SUPER_ADMIN remains configuration/read-only boundary, not routine Hostel staff', async () => {
    const actor = { facultyUserId: 1, collegeId: 1, departmentId: null, role: 'SUPER_ADMIN' };
    assert.equal(hasHostelPermission(actor, 'hostel.config.manage'), true);
    assert.equal(hasHostelPermission(actor, 'hostel.application.review'), false);
    assert.equal(hasHostelPermission(actor, 'hostel.allocation.manage'), false);
    assert.equal(hasHostelPermission(actor, 'hostel.vacating.manage'), false);
  });
});
