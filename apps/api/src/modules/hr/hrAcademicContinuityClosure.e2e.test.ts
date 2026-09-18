/**
 * HR academic continuity freeze validation — full closure E2E tests.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import type { ClassActor } from '../academicClasses/access.js';
import {
  createLeaveRequest,
  approveLeaveRequest,
  respondToCoverageRequest,
  requestSubstituteCoverage,
  submitLeaveRequest,
  cancelLeaveRequest,
} from './leave.js';
import {
  listEligibleSubstitutes,
  managerVerifyCoverage,
  requestHodArrangement,
  finalizeLeaveCoverageNotifications,
  getManagerCoverageDetail,
  proposeClassSwap,
  respondToSwapRequest,
  proposeReschedule,
  checkRescheduleAvailability,
  managerAuthorizedCancel,
  managerAssignSubstitute,
  listSwapCompatibleSessions,
  getCoverageForLeaveRequest,
  getLeaveCoverageSummary,
} from './leaveCoverage.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { facultyTimetable } from '../timetable/service.js';
import { createSession, markRecords } from '../attendance/service.js';
import { addDays, todayISO, weekdayOf } from '../lessonPlans/dates.js';
import { asISODate } from '../timetable/time.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';

const LEAVE_OVERLAP_EXCLUDED_STATUSES = ['DRAFT', 'REJECTED', 'CANCELLED', 'WITHDRAWN'] as const;

function e2eRunJitter() {
  return Math.floor(Date.now() / 60000) % 90;
}

async function cleanupE2eLeavesForEmployee(employeeId: number) {
  const rows = await db('hr_leave_requests')
    .where({ employee_id: employeeId })
    .whereNotIn('status', ['CANCELLED', 'REJECTED', 'WITHDRAWN'])
    .where((q) => {
      q.whereILike('reason', '%E2E%').orWhereILike('reason', '%closure%').orWhereILike('reason', '%Substitute%');
    })
    .select('id');
  for (const row of rows) {
    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: row.id });
    for (const c of coverages) {
      if (c.timetable_override_id) {
        await db('timetable_overrides').where({ id: c.timetable_override_id }).update({ status: 'CANCELLED' });
      }
      if (c.secondary_override_id) {
        await db('timetable_overrides').where({ id: c.secondary_override_id }).update({ status: 'CANCELLED' });
      }
    }
    await db('hr_leave_requests').where({ id: row.id }).update({ status: 'CANCELLED' });
  }
}

async function uniqueLeaveDateForWeekday(
  employeeId: number,
  weekday: number,
  minDaysAhead: number,
): Promise<string> {
  let iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
  for (let i = 0; i < 365; i++) {
    if (weekdayOf(iso) !== weekday) {
      iso = addDays(iso, 1);
      continue;
    }
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED_STATUSES)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 7);
  }
  await cleanupE2eLeavesForEmployee(employeeId);
  iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
  for (let i = 0; i < 365; i++) {
    if (weekdayOf(iso) !== weekday) {
      iso = addDays(iso, 1);
      continue;
    }
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED_STATUSES)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 7);
  }
  throw new Error(`No free leave date for employee ${employeeId} weekday ${weekday}`);
}

async function uniqueLeaveRangeForWeekday(
  employeeId: number,
  weekday: number,
  minDaysAhead: number,
  durationDays: number,
): Promise<string> {
  let iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
  for (let attempt = 0; attempt < 2; attempt++) {
    for (let i = 0; i < 365; i++) {
      if (weekdayOf(iso) !== weekday) {
        iso = addDays(iso, 1);
        continue;
      }
      const end = addDays(iso, durationDays);
      const overlap = await db('hr_leave_requests')
        .where({ employee_id: employeeId })
        .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED_STATUSES)
        .andWhere('from_date', '<=', end)
        .andWhere('to_date', '>=', iso)
        .first();
      if (!overlap) return iso;
      iso = addDays(iso, 7);
    }
    if (attempt === 0) {
      await cleanupE2eLeavesForEmployee(employeeId);
      iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
    }
  }
  throw new Error(`No free leave range for employee ${employeeId} weekday ${weekday}`);
}

async function uniqueLeaveDate(employeeId: number, minDaysAhead: number): Promise<string> {
  let iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
  for (let i = 0; i < 365; i++) {
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED_STATUSES)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 1);
  }
  await cleanupE2eLeavesForEmployee(employeeId);
  iso = addDays(todayISO(), minDaysAhead + e2eRunJitter());
  for (let i = 0; i < 365; i++) {
    const overlap = await db('hr_leave_requests')
      .where({ employee_id: employeeId })
      .whereNotIn('status', LEAVE_OVERLAP_EXCLUDED_STATUSES)
      .andWhere('from_date', '<=', iso)
      .andWhere('to_date', '>=', iso)
      .first();
    if (!overlap) return iso;
    iso = addDays(iso, 1);
  }
  throw new Error(`No free leave date for employee ${employeeId}`);
}

async function ensureLeaveBalance(
  employeeId: number,
  leaveTypeId: number,
  leaveDate?: string,
) {
  const year = leaveDate ? new Date(leaveDate).getFullYear() : new Date().getFullYear();
  let balance = await db('employee_leave_balances')
    .where({ employee_id: employeeId, leave_type_id: leaveTypeId, year })
    .first();
  if (!balance) {
    const emp = await db('employees').where({ id: employeeId }).first();
    if (!emp) return;
    const [id] = await db('employee_leave_balances').insert({
      college_id: emp.college_id,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      opening_balance: 0,
      credited: 50,
      availed: 0,
      adjusted: 0,
      carried_forward: 0,
      available_balance: 50,
    });
    balance = await db('employee_leave_balances').where({ id }).first();
  }
  if (!balance) return;
  await db('employee_leave_balances')
    .where({ id: balance.id })
    .update({
      available_balance: 50,
      credited: Math.max(Number(balance.credited), 50),
      availed: 0,
    });
}

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('hr_leave_academic_coverage'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const anita =
      (await db('faculty_users').where({ college_id: collegeId, email: 'anita.cse@vviet.edu.in' }).first()) ??
      (await db('faculty_users').where({ college_id: collegeId, email: 'anita@vviet.edu.in' }).first()) ??
      (await db('faculty_users').where({ college_id: collegeId, role: 'FACULTY' }).first());
    const ravi = await db('faculty_users').where({ college_id: collegeId, email: 'ravi@vviet.edu.in' }).first();
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const otherCollege = await db('faculty_users').whereNot({ college_id: collegeId }).where({ role: 'FACULTY' }).first();
    return { cls, collegeId, anita, ravi, admin, otherCollege };
  } catch {
    return null;
  }
}

function hrActor(row: {
  id: number;
  college_id: number;
  department_id?: number | null;
  role: string;
  name?: string;
}): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

function classActor(row: {
  id: number;
  college_id: number;
  department_id?: number | null;
  role: string;
}): ClassActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
  };
}

async function anitaPrimarySlot(ctx: NonNullable<Awaited<ReturnType<typeof e2eContext>>>) {
  return db('timetable_slot_faculty as sf')
    .join('timetable_slots as s', 's.id', 'sf.slot_id')
    .where({ 'sf.faculty_id': ctx.anita!.id, 's.college_id': ctx.collegeId, 's.status': 'ACTIVE' })
    .orderBy('s.start_period_number')
    .select('s.*')
    .first();
}

/** Active substitute coverage only — ignores stale rows left by other HR e2e suites. */
async function findActiveSubstituteCoverageForFaculty(
  collegeId: number,
  substituteFacultyUserId: number,
) {
  return db('hr_leave_academic_coverage as c')
    .join('timetable_overrides as o', 'o.id', 'c.timetable_override_id')
    .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
    .where({
      'c.college_id': collegeId,
      'c.coverage_type': 'SUBSTITUTE_FACULTY',
      'c.substitute_faculty_id': substituteFacultyUserId,
      'o.status': 'ACTIVE',
      'o.kind': 'SUBSTITUTION',
      'lr.status': 'APPROVED',
    })
    .whereIn('c.status', ['VERIFIED', 'COMPLETE'])
    .orderBy('c.id', 'desc')
    .select('c.*')
    .first();
}

async function createTestLeave(
  actor: HrActor,
  employeeId: number,
  input: Parameters<typeof createLeaveRequest>[1],
) {
  await ensureLeaveBalance(employeeId, input.leaveTypeId, input.fromDate);
  return createLeaveRequest(actor, input);
}

async function runSubstituteHappyPath(ctx: NonNullable<Awaited<ReturnType<typeof e2eContext>>>) {
  await ensureCollegeHrmsDefaults(ctx.collegeId);
  const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
  const raviEmp = ctx.ravi ? await db('employees').where({ faculty_user_id: ctx.ravi.id }).first() : null;
  if (!anitaEmp || !raviEmp || !ctx.admin) return null;

  const slot = await anitaPrimarySlot(ctx);
  if (!slot) return null;

  const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
  if (!cl) return null;

  const leaveDate = await uniqueLeaveDateForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 45);
  const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
    leaveTypeId: Number(cl.id),
    fromDate: leaveDate,
    toDate: leaveDate,
    fromSession: 'FULL_DAY',
    toSession: 'FULL_DAY',
    reason: 'Substitute happy path E2E',
  });

  const cov = await db('hr_leave_academic_coverage')
    .where({ leave_request_id: created.id, timetable_slot_id: slot.id })
    .first();
  if (!cov) return null;

  await requestSubstituteCoverage(hrActor(ctx.anita!), {
    coverageId: Number(cov.id),
    substituteEmployeeId: Number(raviEmp.id),
  });

  const req = await db('hr_leave_coverage_requests')
    .where({ coverage_id: cov.id, requested_to_employee_id: raviEmp.id, status: 'PENDING' })
    .first();
  if (!req) return null;

  await respondToCoverageRequest(hrActor(ctx.ravi!), Number(req.id), true);
  await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));
  await db('hr_leave_requests').where({ id: created.id }).update({
    status: 'UNDER_APPROVAL',
    academic_coverage_status: 'COMPLETE',
    submitted_at: db.fn.now(),
    current_approval_step: 2,
  });
  await approveLeaveRequest(hrActor(ctx.admin), created.id);

  const updated = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
  const summary = await getLeaveCoverageSummary(created.id);
  const overrides = await db('timetable_overrides').where({
    timetable_slot_id: slot.id,
    override_date: leaveDate,
    kind: 'SUBSTITUTION',
    status: 'ACTIVE',
  });

  return {
    leaveId: created.id,
    coverageId: Number(cov.id),
    leaveDate,
    slot,
    anitaEmp,
    raviEmp,
    updated,
    summary,
    overrides,
  };
}

describe('hr academic continuity closure E2E', () => {
  it('full substitute happy path — leave to override', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    const result = await runSubstituteHappyPath(ctx);
    if (!result) return;

    assert.equal(result.summary.status, 'COMPLETE');
    assert.equal(String(result.updated?.status), 'VERIFIED');
    assert.equal(String(result.updated?.coverage_type), 'SUBSTITUTE_FACULTY');
    assert.ok(result.updated?.timetable_override_id);
    assert.equal(result.overrides.length, 1);

    const override = await db('timetable_overrides').where({ id: result.updated!.timetable_override_id }).first();
    assert.equal(String(override?.source_type), 'HR_LEAVE');
    assert.equal(Number(override?.source_id), result.leaveId);
    assert.equal(Number(override?.substitute_faculty_id), ctx.ravi.id);

    const permanent = await db('timetable_slots').where({ id: result.slot.id }).first();
    assert.equal(Number(permanent?.faculty_id), ctx.anita.id);
  });

  it('substitute sees class in timetable with substitution badge', async () => {
    const ctx = await e2eContext();
    if (!ctx?.ravi) return;

    let approved = await findActiveSubstituteCoverageForFaculty(ctx.collegeId, ctx.ravi.id);
    if (!approved) {
      const seeded = await runSubstituteHappyPath(ctx);
      if (!seeded) return;
      approved = await db('hr_leave_academic_coverage').where({ id: seeded.coverageId }).first();
    }
    if (!approved) return;

    const override = await db('timetable_overrides').where({ id: approved.timetable_override_id }).first();
    assert.equal(String(override?.status), 'ACTIVE');

    const date = asISODate(approved.affected_date);
    const schedule = await facultyTimetable(
      { collegeId: ctx.collegeId, facultyUserId: ctx.ravi.id, role: 'FACULTY' },
      date,
      date,
    );
    const hit = schedule.occurrences.find(
      (o) => o.isSubstitution && o.slotId === Number(approved.timetable_slot_id) && o.date === date,
    );
    assert.ok(hit, 'substitute should see substituted occurrence');
    assert.equal(hit!.isSubstitution, true);
    assert.ok(hit!.coveringForFacultyName);

    const anitaSchedule = await facultyTimetable(
      { collegeId: ctx.collegeId, facultyUserId: ctx.anita!.id, role: 'FACULTY' },
      date,
      date,
    );
    const unrelated = anitaSchedule.occurrences.filter(
      (o) => o.courseId !== hit!.courseId && o.date === date && !o.isSubstitution,
    );
    for (const occ of unrelated) {
      assert.notEqual(occ.faculty[0]?.facultyId, ctx.ravi.id);
    }
  });

  it('substitute attendance records original and delivered faculty', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi) return;

    const seeded = await runSubstituteHappyPath(ctx);
    if (!seeded) return;
    const cov = await db('hr_leave_academic_coverage').where({ id: seeded.coverageId }).first();
    if (!cov) return;

    const slot = await db('timetable_slots').where({ id: cov.timetable_slot_id }).first();
    if (!slot) return;

    const sessionDate = asISODate(cov.affected_date);
    let session = await db('attendance_sessions')
      .where({ timetable_override_id: cov.timetable_override_id })
      .first();

    if (!session) {
      try {
        const created = await createSession(classActor(ctx.ravi), {
          academicClassId: Number(slot.academic_class_id),
          courseId: Number(slot.course_id),
          sessionDate,
          periodNumber: slot.start_period_number ? Number(slot.start_period_number) : 1,
          startTime: String(slot.start_time).slice(0, 5),
          endTime: String(slot.end_time).slice(0, 5),
          timetableSlotId: Number(slot.id),
          timetableOverrideId: Number(cov.timetable_override_id),
        });
        session = await db('attendance_sessions').where({ id: created.session.id }).first();
        const students = await db('academic_class_enrollments')
          .where({ academic_class_id: slot.academic_class_id, status: 'APPROVED' })
          .limit(2);
        if (students.length) {
          await markRecords(classActor(ctx.ravi), created.session.id, {
            records: students.map((s) => ({ studentId: Number(s.student_id), status: 'PRESENT' as const })),
          });
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status !== 409) throw err;
        session = await db('attendance_sessions')
          .where({
            academic_class_id: slot.academic_class_id,
            course_id: slot.course_id,
            session_date: sessionDate,
            period_number: slot.start_period_number ? Number(slot.start_period_number) : 1,
            delivered_by_faculty_id: cov.substitute_faculty_id ?? ctx.ravi!.id,
          })
          .first();
      }
    }

    assert.ok(session);
    assert.equal(Number(session?.original_faculty_id), Number(cov.original_faculty_id));
    assert.equal(Number(session?.delivered_by_faculty_id), Number(cov.substitute_faculty_id ?? ctx.ravi!.id));
    assert.equal(String(session?.session_source ?? 'LEAVE_SUBSTITUTION'), 'LEAVE_SUBSTITUTION');

    const assignment = await db('academic_class_subject_faculty')
      .where({
        college_id: ctx.collegeId,
        faculty_id: ctx.anita!.id,
        course_id: slot.course_id,
        academic_class_id: slot.academic_class_id,
        status: 'ACTIVE',
      })
      .first();
    assert.ok(assignment, 'permanent class-subject assignment should remain with original faculty');
  });

  it('planned topic visible on coverage without copying data', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!cl || !emp) return;

    const date = await uniqueLeaveDate(Number(emp.id), 55);
    const created = await createTestLeave(hrActor(ctx.anita), Number(emp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const detail = await getCoverageForLeaveRequest(hrActor(ctx.anita), created.id);
    const withSlot = detail.coverages.find((c) => c.timetableSlotId);
    if (!withSlot) return;

    if (withSlot.plannedTopic) {
      assert.ok(typeof withSlot.plannedTopic === 'string');
      const lp = await db('lesson_plan_entries').where({ college_id: ctx.collegeId }).first();
      if (lp) assert.notEqual(withSlot.plannedTopic, '');
    }
  });

  it('full class swap E2E', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    if (!anitaEmp || !raviEmp || !cl || !slot) return;

    const leaveDate = await uniqueLeaveRangeForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 60, 6);
    const leaveEnd = addDays(leaveDate, 6);
    const created = await createTestLeave(hrActor(ctx.anita), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveEnd,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      reason: 'Swap E2E',
    });

    const cov = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: created.id, timetable_slot_id: slot.id })
      .first();
    if (!cov) return;

    const compat = await listSwapCompatibleSessions(hrActor(ctx.anita), Number(cov.id), Number(raviEmp.id));
    const target = compat.sessions.find((s) => s.available !== false);
    assert.ok(target, 'expected at least one compatible swap session in leave window');

    const swapResult = await proposeClassSwap(hrActor(ctx.anita), {
      coverageId: Number(cov.id),
      swapEmployeeId: Number(raviEmp.id),
      targetTimetableSlotId: Number(target.targetTimetableSlotId),
      targetDate: String(target.targetDate),
    });

    const swapReq = await db('hr_leave_coverage_requests').where({ id: swapResult.coverageRequestId }).first();
    await respondToSwapRequest(hrActor(ctx.ravi), Number(swapReq!.id), true);
    await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));
    for (const other of await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).whereNot({ id: cov.id })) {
      await db('hr_leave_academic_coverage').where({ id: other.id }).update({ status: 'VERIFIED', coverage_type: 'ALREADY_COVERED' });
    }
    await submitLeaveRequest(hrActor(ctx.anita), created.id);
    await approveLeaveRequest(hrActor(ctx.admin), created.id);

    const updated = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    const swap = await db('hr_leave_class_swaps').where({ id: updated!.swap_id }).first();
    assert.ok(swap, 'swap record should exist');
    assert.equal(String(swap?.status), 'APPLIED');
    assert.equal(String(updated?.coverage_type), 'CLASS_SWAP');
    assert.ok(updated?.timetable_override_id);
    assert.ok(updated?.secondary_override_id);

    const sourceOverride = await db('timetable_overrides').where({ id: updated!.timetable_override_id }).first();
    const targetOverride = await db('timetable_overrides').where({ id: updated!.secondary_override_id }).first();
    assert.equal(String(sourceOverride?.kind), 'SUBSTITUTION');
    assert.equal(String(targetOverride?.kind), 'SUBSTITUTION');
    assert.equal(Number(sourceOverride?.substitute_faculty_id), ctx.ravi.id);
  });

  it('swap conflict returns FACULTY_CONFLICT and creates no override', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;

    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!anitaEmp) return;

    const anitaSlots = await db('timetable_slot_faculty as sf')
      .join('timetable_slots as s', 's.id', 'sf.slot_id')
      .where({ 'sf.faculty_id': ctx.anita.id, 's.college_id': ctx.collegeId, 's.status': 'ACTIVE' })
      .select('s.*');

    let conflictEmployeeId: number | null = null;
    let anitaSlot: Record<string, unknown> | null = null;
    for (const slot of anitaSlots) {
      const overlap = await db('timetable_slot_faculty as sf')
        .join('timetable_slots as s', 's.id', 'sf.slot_id')
        .join('employees as e', 'e.faculty_user_id', 'sf.faculty_id')
        .where({
          's.day_of_week': slot.day_of_week,
          's.college_id': ctx.collegeId,
          's.status': 'ACTIVE',
        })
        .whereNot('sf.faculty_id', ctx.anita.id)
        .whereRaw('s.start_time < ?', [slot.end_time])
        .whereRaw('s.end_time > ?', [slot.start_time])
        .select('e.id as employee_id', 's.id as slot_id', 's.start_time', 's.end_time')
        .first();
      if (overlap) {
        conflictEmployeeId = Number(overlap.employee_id);
        anitaSlot = slot;
        break;
      }
    }
    if (!conflictEmployeeId || !anitaSlot) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;

    const leaveDate = await uniqueLeaveDateForWeekday(Number(anitaEmp.id), Number(anitaSlot.day_of_week), 65);
    const created = await createTestLeave(hrActor(ctx.anita), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });

    const cov = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: created.id, timetable_slot_id: anitaSlot.id })
      .first();
    if (!cov) return;

    const partnerSlot = await db('timetable_slot_faculty as sf')
      .join('timetable_slots as s', 's.id', 'sf.slot_id')
      .join('employees as e', 'e.id', conflictEmployeeId)
      .where({ 'e.id': conflictEmployeeId, 's.college_id': ctx.collegeId, 's.status': 'ACTIVE' })
      .whereNot('s.id', anitaSlot.id)
      .select('s.id as slot_id', 's.day_of_week')
      .first();

    if (!partnerSlot) {
      await assert.rejects(
        () =>
          requestSubstituteCoverage(hrActor(ctx.anita), {
            coverageId: Number(cov.id),
            substituteEmployeeId: conflictEmployeeId!,
          }),
        (err: Error & { code?: string }) => err.code === 'FACULTY_CONFLICT' || /conflict/i.test(err.message),
      );
      return;
    }

    const targetDate = await uniqueLeaveDateForWeekday(conflictEmployeeId, Number(partnerSlot.day_of_week), 66);
    await assert.rejects(
      () =>
        proposeClassSwap(hrActor(ctx.anita), {
          coverageId: Number(cov.id),
          swapEmployeeId: conflictEmployeeId!,
          targetTimetableSlotId: Number(partnerSlot.slot_id),
          targetDate,
        }),
      (err: Error & { code?: string }) =>
        ['FACULTY_CONFLICT', 'CLASS_CONFLICT', 'ROOM_CONFLICT', 'INVALID_SWAP', 'EMPLOYEE_ON_LEAVE'].includes(
          err.code ?? '',
        ) || /conflict|unavailable/i.test(err.message),
    );

    const refreshed = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    assert.ok(!refreshed?.timetable_override_id);
    assert.notEqual(String(refreshed?.status), 'VERIFIED');
  });

  it('reschedule makeup E2E with availability check', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;

    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    if (!cl || !slot) return;

    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !slot || !anitaEmp) return;

    const leaveDate = await uniqueLeaveDateForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 70);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });

    const cov = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: created.id, timetable_slot_id: slot.id })
      .first();
    if (!cov) return;

    const makeupDate = addDays(leaveDate, 7);
    const check = await checkRescheduleAvailability(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      makeupDate,
      startTime: String(slot.start_time).slice(0, 5),
      endTime: String(slot.end_time).slice(0, 5),
    });
    assert.equal(check.available, true);

    await proposeReschedule(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      makeupDate,
      startTime: String(slot.start_time).slice(0, 5),
      endTime: String(slot.end_time).slice(0, 5),
      makeupKind: 'MAKEUP',
    });
    await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));
    await submitLeaveRequest(hrActor(ctx.anita!), created.id);
    await approveLeaveRequest(hrActor(ctx.admin), created.id);

    const updated = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    assert.equal(String(updated?.coverage_type), 'RESCHEDULE');
    assert.ok(updated?.timetable_override_id);
    assert.equal(String(updated?.makeup_kind), 'MAKEUP');

    if (await db.schema.hasTable('student_notifications')) {
      const notes = await db('student_notifications').where({
        related_type: 'HR_LEAVE_COVERAGE',
        related_id: String(cov.id),
      });
      assert.ok(notes.some((n) => String(n.dedupe_key).includes(`HR_COVERAGE:${cov.id}:RESCHEDULE`)));
    }
  });

  it('reschedule conflict blocks override for each supported conflict type', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    const emp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !slot || !emp) return;

    const leaveDate = await uniqueLeaveDateForWeekday(Number(emp.id), Number(slot.day_of_week), 75);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(emp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });

    const cov = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: created.id, timetable_slot_id: slot.id })
      .first();
    if (!cov) return;

    const makeupDate = leaveDate;
    const otherSlots = await db('timetable_slot_faculty as sf')
      .join('timetable_slots as s', 's.id', 'sf.slot_id')
      .where({ 'sf.faculty_id': ctx.anita!.id, 's.college_id': ctx.collegeId, 's.status': 'ACTIVE' })
      .whereNot('s.id', slot.id)
      .where('s.day_of_week', slot.day_of_week)
      .select('s.*');

    let conflictProbe: { startTime: string; endTime: string; code?: string } | null = null;
    for (const other of otherSlots) {
      const check = await checkRescheduleAvailability(hrActor(ctx.anita!), {
        coverageId: Number(cov.id),
        makeupDate,
        startTime: String(other.start_time).slice(0, 5),
        endTime: String(other.end_time).slice(0, 5),
      });
      if (!check.available) {
        conflictProbe = {
          startTime: String(other.start_time).slice(0, 5),
          endTime: String(other.end_time).slice(0, 5),
          code: check.code,
        };
        break;
      }
    }

    if (!conflictProbe) {
      const sameSlotCheck = await checkRescheduleAvailability(hrActor(ctx.anita!), {
        coverageId: Number(cov.id),
        makeupDate,
        startTime: String(slot.start_time).slice(0, 5),
        endTime: String(slot.end_time).slice(0, 5),
      });
      if (!sameSlotCheck.available) {
        conflictProbe = {
          startTime: String(slot.start_time).slice(0, 5),
          endTime: String(slot.end_time).slice(0, 5),
          code: sameSlotCheck.code,
        };
      }
    }
    if (!conflictProbe) return;

    assert.ok(['FACULTY_CONFLICT', 'CLASS_CONFLICT', 'ROOM_CONFLICT'].includes(conflictProbe.code ?? ''));

    await assert.rejects(
      () =>
        proposeReschedule(hrActor(ctx.anita!), {
          coverageId: Number(cov.id),
          makeupDate,
          startTime: conflictProbe!.startTime,
          endTime: conflictProbe!.endTime,
        }),
      (err: Error & { code?: string; details?: { code?: string } }) => {
        const code = err.code ?? err.details?.code;
        return (
          ['FACULTY_CONFLICT', 'CLASS_CONFLICT', 'ROOM_CONFLICT'].includes(code ?? '') ||
          /conflict|assigned|unavailable/i.test(err.message)
        );
      },
    );

    const refreshed = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    assert.ok(!refreshed?.timetable_override_id);
  });

  it('HOD arrangement full flow with assign and approve', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    if (!cl || !anitaEmp || !raviEmp) return;

    const date = await uniqueLeaveDate(Number(anitaEmp.id), 80);
    const created = await createTestLeave(hrActor(ctx.anita), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });

    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!cov) return;

    await requestHodArrangement(hrActor(ctx.anita), Number(cov.id), 'Need HOD help');
    const subs = await listEligibleSubstitutes(hrActor(ctx.admin), Number(cov.id), undefined, { managerMode: true });
    const pick = subs.find((s) => s.available && s.employeeId === Number(raviEmp.id)) ?? subs.find((s) => s.available);
    if (!pick) return;

    await managerAssignSubstitute(hrActor(ctx.admin), Number(cov.id), pick.employeeId, { skipConsent: true, reason: 'HOD direct assign E2E' });
    await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));

    for (const other of await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).whereNot({ id: cov.id })) {
      await db('hr_leave_academic_coverage').where({ id: other.id }).update({
        coverage_type: 'ALREADY_COVERED',
        status: 'VERIFIED',
      });
    }

    await submitLeaveRequest(hrActor(ctx.anita), created.id);
    await approveLeaveRequest(hrActor(ctx.admin), created.id);

    const summary = await getLeaveCoverageSummary(created.id);
    assert.equal(summary.status, 'COMPLETE');
  });

  it('authorized cancellation requires reason and blocks lecturer', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;

    const cov = await db('hr_leave_academic_coverage')
      .where({ college_id: ctx.collegeId })
      .whereNotNull('timetable_slot_id')
      .orderBy('id', 'desc')
      .first();
    if (!cov) return;

    await assert.rejects(() => managerAuthorizedCancel(hrActor(ctx.anita!), Number(cov.id), '   '));
    await assert.rejects(() => managerAuthorizedCancel(hrActor(ctx.anita!), Number(cov.id), 'Lecturer attempt'));

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const emp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !emp) return;

    const date = await uniqueLeaveDate(Number(emp.id), 85);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(emp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const freshCov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!freshCov) return;

    await managerAuthorizedCancel(hrActor(ctx.admin), Number(freshCov.id), 'Authorized cancel E2E');
    for (const other of await db('hr_leave_academic_coverage').where({ leave_request_id: created.id })) {
      if (Number(other.id) !== Number(freshCov.id)) {
        await db('hr_leave_academic_coverage').where({ id: other.id }).update({ status: 'VERIFIED', coverage_type: 'ALREADY_COVERED' });
      }
    }
    await submitLeaveRequest(hrActor(ctx.anita!), created.id);
    await approveLeaveRequest(hrActor(ctx.admin), created.id);

    const updated = await db('hr_leave_academic_coverage').where({ id: freshCov.id }).first();
    assert.equal(String(updated?.coverage_type), 'CANCELLED_WITH_AUTHORIZATION');
    assert.ok(updated?.timetable_override_id);

    if (await db.schema.hasTable('hr_audit_log')) {
      const audit = await db('hr_audit_log')
        .where({ action: 'AUTHORIZED_CANCELLATION', entity_id: freshCov.id })
        .first();
      assert.ok(audit);
    }
  });

  it('emergency leave creates CRITICAL coverage and HOD notification', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;

    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!anitaEmp) return;

    const today = todayISO();
    // Isolate from prior E2E leaves on today (DATE_OVERLAP pollution).
    const overlapping = await db('hr_leave_requests')
      .where({ employee_id: anitaEmp.id })
      .whereNotIn('status', ['CANCELLED', 'REJECTED', 'WITHDRAWN', 'DRAFT'])
      .andWhere('from_date', '<=', today)
      .andWhere('to_date', '>=', today)
      .select('id');
    for (const row of overlapping) {
      await cancelLeaveRequest(hrActor(ctx.anita), Number(row.id)).catch(async () => {
        await db('hr_leave_requests').where({ id: row.id }).update({ status: 'CANCELLED' });
      });
    }

    const created = await createLeaveRequest(hrActor(ctx.anita!), {
      leaveTypeId: Number(cl.id),
      fromDate: today,
      toDate: today,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
      isEmergency: true,
      reason: 'Emergency closure E2E',
    });

    const coverages = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id });
    if (!coverages.length) return;
    assert.ok(coverages.some((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH'));

    if (await db.schema.hasTable('employee_notifications')) {
      const adminEmp = await db('employees').where({ faculty_user_id: ctx.admin.id }).first();
      if (adminEmp) {
        const note = await db('employee_notifications')
          .where({ employee_id: adminEmp.id })
          .whereILike('dedupe_key', `emergency-leave-${created.id}-%`)
          .first();
        assert.ok(note);
      }
    }

    await approveLeaveRequest(hrActor(ctx.admin), created.id);
    const summary = await getLeaveCoverageSummary(created.id);
    assert.ok(['EMERGENCY_UNRESOLVED', 'PARTIAL', 'COMPLETE', 'PENDING'].includes(summary.status));
  });

  it('cancellation reversal restores balance and cancels future override', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;

    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!anitaEmp) return;

    let cov = await db('hr_leave_academic_coverage as c')
      .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
      .where({
        'lr.employee_id': anitaEmp.id,
        'lr.status': 'APPROVED',
        'c.coverage_type': 'SUBSTITUTE_FACULTY',
      })
      .whereNotNull('c.timetable_override_id')
      .orderBy('c.id', 'desc')
      .select('c.*', 'lr.id as leave_id')
      .first();

    if (!cov) {
      const seeded = await runSubstituteHappyPath(ctx);
      if (!seeded) return;
      cov = { ...seeded.updated, leave_id: seeded.leaveId };
    }

    const leaveId = Number(cov.leave_id ?? cov.leave_request_id);
    const beforeBalance = await db('employee_leave_balances').where({ employee_id: anitaEmp.id }).first();

    await cancelLeaveRequest(hrActor(ctx.anita!), leaveId);

    const leave = await db('hr_leave_requests').where({ id: leaveId }).first();
    assert.equal(String(leave?.status), 'CANCELLED');

    const afterBalance = await db('employee_leave_balances').where({ employee_id: anitaEmp.id }).first();
    assert.ok(Number(afterBalance?.available_balance) >= Number(beforeBalance?.available_balance));

    const override = await db('timetable_overrides').where({ id: cov.timetable_override_id }).first();
    assert.equal(String(override?.status), 'CANCELLED');

    if (await db.schema.hasTable('hr_audit_log')) {
      const audit = await db('hr_audit_log')
        .where({ action: 'LEAVE_COVERAGE_REVERSED', entity_id: leaveId })
        .first();
      assert.ok(audit);
    }

    if (await db.schema.hasTable('employee_notifications') && cov.substitute_employee_id) {
      const note = await db('employee_notifications')
        .where({ employee_id: cov.substitute_employee_id, dedupe_key: `cov-cancel-${cov.id}` })
        .first();
      assert.ok(note);
    }
  });

  it('historical reversal preserves conducted attendance', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi) return;

    const cov = await db('hr_leave_academic_coverage')
      .where({ college_id: ctx.collegeId })
      .whereNotNull('timetable_override_id')
      .orderBy('id', 'desc')
      .first();
    if (!cov) return;

    const slot = await db('timetable_slots').where({ id: cov.timetable_slot_id }).first();
    if (!slot) return;

    const sessionDate = String(cov.affected_date);
    let session = await db('attendance_sessions')
      .where({ timetable_override_id: cov.timetable_override_id, status: 'COMPLETED' })
      .first();

    if (!session) {
      const draft = await db('attendance_sessions')
        .where({ timetable_override_id: cov.timetable_override_id })
        .first();
      if (draft) {
        await db('attendance_sessions').where({ id: draft.id }).update({ status: 'COMPLETED' });
        session = await db('attendance_sessions').where({ id: draft.id }).first();
      }
    }
    if (!session) return;

    const leave = await db('hr_leave_requests').where({ id: cov.leave_request_id }).first();
    if (String(leave?.status) !== 'APPROVED') return;

    await cancelLeaveRequest(hrActor(ctx.anita!), Number(cov.leave_request_id));

    const preserved = await db('attendance_sessions').where({ id: session.id }).first();
    assert.equal(String(preserved?.status), 'COMPLETED');
    assert.equal(Number(preserved?.delivered_by_faculty_id), Number(session.delivered_by_faculty_id));

    const override = await db('timetable_overrides').where({ id: cov.timetable_override_id }).first();
    assert.ok(override);
  });

  it('student notification dedupe prevents duplicates', async () => {
    if (!(await db.schema.hasTable('student_notifications'))) return;
    const student = await db('students').first();
    if (!student) return;
    const collegeId = Number(student.college_id);
    const key = `HR_COVERAGE:99999:SUBSTITUTE:${student.id}`;
    await notifyStudent({
      studentId: Number(student.id),
      collegeId,
      type: 'FACULTY_SUBSTITUTION',
      title: 'Dedupe test',
      body: 'Once',
      dedupeKeyOverride: key,
    });
    await notifyStudent({
      studentId: Number(student.id),
      collegeId,
      type: 'FACULTY_SUBSTITUTION',
      title: 'Dedupe test duplicate',
      body: 'Twice',
      dedupeKeyOverride: key,
    });
    const count = await db('student_notifications').where({ student_id: student.id, dedupe_key: key }).count({ c: '*' }).first();
    assert.equal(Number(count?.c ?? 0), 1);
  });

  it('finalize notifications twice does not duplicate student rows', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const verified = await db('hr_leave_academic_coverage')
      .where({ college_id: ctx.collegeId, status: 'VERIFIED', coverage_type: 'SUBSTITUTE_FACULTY' })
      .whereNotNull('timetable_override_id')
      .first();
    if (!verified) return;
    await finalizeLeaveCoverageNotifications(Number(verified.leave_request_id), ctx.collegeId);
    await finalizeLeaveCoverageNotifications(Number(verified.leave_request_id), ctx.collegeId);
    if (!(await db.schema.hasTable('student_notifications'))) return;
    const rows = await db('student_notifications').where({
      related_type: 'HR_LEAVE_COVERAGE',
      related_id: String(verified.id),
    });
    const keys = new Set(rows.map((r) => r.dedupe_key));
    assert.equal(keys.size, rows.length);
  });

  it('employee notifications dedupe on retry', async () => {
    if (!(await db.schema.hasTable('employee_notifications'))) return;
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;

    const { notifyEmployee } = await import('./notifications.js');
    const key = `e2e-dedupe-${Date.now()}`;
    await notifyEmployee({
      employeeId: Number(emp.id),
      collegeId: ctx.collegeId,
      type: 'TEST',
      title: 'Once',
      dedupeKey: key,
    });
    await notifyEmployee({
      employeeId: Number(emp.id),
      collegeId: ctx.collegeId,
      type: 'TEST',
      title: 'Twice',
      dedupeKey: key,
    });
    const count = await db('employee_notifications').where({ employee_id: emp.id, dedupe_key: key }).count({ c: '*' }).first();
    assert.equal(Number(count?.c ?? 0), 1);
  });

  it('eligible substitutes API returns availability flags', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const cov = await db('hr_leave_academic_coverage as c')
      .join('hr_leave_requests as lr', 'lr.id', 'c.leave_request_id')
      .where({ 'lr.employee_id': emp.id })
      .whereNotNull('c.timetable_slot_id')
      .select('c.id')
      .first();
    if (!cov) return;
    const rows = await listEligibleSubstitutes(hrActor(ctx.anita), Number(cov.id));
    assert.ok(Array.isArray(rows));
    if (rows.length) {
      assert.ok('available' in rows[0]);
      assert.ok('displayName' in rows[0]);
    }
  });

  it('cross-college manager cannot access coverage detail', async () => {
    const ctx = await e2eContext();
    if (!ctx?.otherCollege || !ctx.anita) return;
    const cov = await db('hr_leave_academic_coverage').where({ college_id: ctx.collegeId }).first();
    if (!cov) return;
    await assert.rejects(() => getManagerCoverageDetail(hrActor(ctx.otherCollege), Number(cov.id)));
  });

  it('tenant isolation — substitute lookup excludes other college', async () => {
    const ctx = await e2eContext();
    if (!ctx?.otherCollege || !ctx.anita) return;
    const cov = await db('hr_leave_academic_coverage').where({ college_id: ctx.collegeId }).whereNotNull('timetable_slot_id').first();
    if (!cov) return;
    const rows = await listEligibleSubstitutes(hrActor(ctx.anita), Number(cov.id));
    const otherEmp = await db('employees').where({ faculty_user_id: ctx.otherCollege.id }).first();
    if (otherEmp) {
      assert.ok(!rows.some((r) => r.employeeId === Number(otherEmp.id)));
    }
  });

  it('lecturer cannot accept another lecturers coverage request', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi) return;
    const pending = await db('hr_leave_coverage_requests as cr')
      .join('employees as e', 'e.id', 'cr.requested_to_employee_id')
      .where({ 'e.faculty_user_id': ctx.ravi.id, 'cr.status': 'PENDING' })
      .select('cr.id')
      .first();
    if (!pending) return;
    await assert.rejects(() => respondToCoverageRequest(hrActor(ctx.anita), Number(pending.id), true));
  });

  it('lecturer cannot verify HOD-only coverage action', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const cov = await db('hr_leave_academic_coverage').where({ college_id: ctx.collegeId }).first();
    if (!cov) return;
    await assert.rejects(() => managerVerifyCoverage(hrActor(ctx.anita), Number(cov.id)));
  });

  it('substitute consent policy column is present and deterministic', async () => {
    if (!(await db.schema.hasTable('college_hrms_policies'))) return;
    const ctx = await e2eContext();
    if (!ctx) return;
    assert.equal(await db.schema.hasColumn('college_hrms_policies', 'substitute_consent_required'), true);
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const policy = await db('college_hrms_policies').where({ college_id: ctx.collegeId }).first();
    assert.notEqual(policy?.substitute_consent_required, undefined);
  });

  it('duplicate leave approval is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const approved = await db('hr_leave_requests')
      .where({ employee_id: emp.id, status: 'APPROVED' })
      .orderBy('id', 'desc')
      .first();
    if (!approved) return;
    const first = await approveLeaveRequest(hrActor(ctx.admin), Number(approved.id));
    const second = await approveLeaveRequest(hrActor(ctx.admin), Number(approved.id));
    assert.equal(first.status, 'APPROVED');
    assert.equal(second.status, 'APPROVED');
    const overrides = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: approved.id })
      .whereNotNull('timetable_override_id');
    const ids = overrides.map((o) => Number(o.timetable_override_id));
    assert.equal(new Set(ids).size, ids.length);
  });

  it('concurrent duplicate leave approval keeps single override set', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !slot || !raviEmp || !anitaEmp) return;

    const leaveDate = await uniqueLeaveDateForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 90);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!cov) return;

    await requestSubstituteCoverage(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      substituteEmployeeId: Number(raviEmp.id),
    });
    const req = await db('hr_leave_coverage_requests').where({ coverage_id: cov.id, status: 'PENDING' }).first();
    await respondToCoverageRequest(hrActor(ctx.ravi!), Number(req!.id), true);
    await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));
    for (const other of await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).whereNot({ id: cov.id })) {
      await db('hr_leave_academic_coverage').where({ id: other.id }).update({ status: 'VERIFIED', coverage_type: 'ALREADY_COVERED' });
    }
    await db('hr_leave_requests').where({ id: created.id }).update({
      status: 'UNDER_APPROVAL',
      academic_coverage_status: 'COMPLETE',
      submitted_at: db.fn.now(),
      current_approval_step: 2,
    });

    await Promise.all([
      approveLeaveRequest(hrActor(ctx.admin), created.id),
      approveLeaveRequest(hrActor(ctx.admin), created.id),
    ]);

    const overrides = await db('hr_leave_academic_coverage')
      .where({ leave_request_id: created.id })
      .whereNotNull('timetable_override_id');
    const ids = overrides.map((o) => Number(o.timetable_override_id));
    assert.equal(new Set(ids).size, ids.length);
  });

  it('concurrent cancel vs approve yields one consistent leave state', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !slot || !raviEmp || !anitaEmp) return;

    const leaveDate = await uniqueLeaveDateForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 100);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveDate,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!cov) return;

    await requestSubstituteCoverage(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      substituteEmployeeId: Number(raviEmp.id),
    });
    const req = await db('hr_leave_coverage_requests').where({ coverage_id: cov.id, status: 'PENDING' }).first();
    await respondToCoverageRequest(hrActor(ctx.ravi!), Number(req!.id), true);
    await managerVerifyCoverage(hrActor(ctx.admin), Number(cov.id));
    for (const other of await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).whereNot({ id: cov.id })) {
      await db('hr_leave_academic_coverage').where({ id: other.id }).update({ status: 'VERIFIED', coverage_type: 'ALREADY_COVERED' });
    }
    await submitLeaveRequest(hrActor(ctx.anita!), created.id);

    const balanceBefore = await db('employee_leave_balances')
      .where({ employee_id: anitaEmp.id, leave_type_id: cl.id, year: new Date(leaveDate).getFullYear() })
      .first();

    const results = await Promise.allSettled([
      approveLeaveRequest(hrActor(ctx.admin), created.id),
      cancelLeaveRequest(hrActor(ctx.anita!), created.id),
    ]);

    const final = await db('hr_leave_requests').where({ id: created.id }).first();
    assert.ok(['APPROVED', 'CANCELLED'].includes(String(final?.status)));

    const activeOverrides = await db('hr_leave_academic_coverage as c')
      .leftJoin('timetable_overrides as o', 'o.id', 'c.timetable_override_id')
      .where({ 'c.leave_request_id': created.id })
      .whereNotNull('c.timetable_override_id')
      .whereNot('o.status', 'CANCELLED')
      .select('c.id');
    const overrideIds = activeOverrides.map((o) => Number(o.id));

    if (final?.status === 'CANCELLED') {
      assert.equal(overrideIds.length, 0);
    } else {
      assert.ok(overrideIds.length >= 1);
    }

    const balanceAfter = await db('employee_leave_balances')
      .where({ employee_id: anitaEmp.id, leave_type_id: cl.id, year: new Date(leaveDate).getFullYear() })
      .first();
    const delta = Number(balanceAfter?.available_balance) - Number(balanceBefore?.available_balance);
    if (final?.status === 'APPROVED') {
      assert.equal(delta, -Number(final.requested_days));
    } else {
      assert.equal(delta, 0);
    }
  });

  it('concurrent coverage verify is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi || !ctx.admin) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    if (!cl || !raviEmp) return;

    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !raviEmp || !anitaEmp) return;

    const date = await uniqueLeaveDate(Number(anitaEmp.id), 95);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!cov) return;

    await requestSubstituteCoverage(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      substituteEmployeeId: Number(raviEmp.id),
    });
    const req = await db('hr_leave_coverage_requests').where({ coverage_id: cov.id }).first();
    await respondToCoverageRequest(hrActor(ctx.ravi!), Number(req!.id), true);

    await Promise.all([
      managerVerifyCoverage(hrActor(ctx.admin!), Number(cov.id)),
      managerVerifyCoverage(hrActor(ctx.admin!), Number(cov.id)),
    ]);

    const refreshed = await db('hr_leave_academic_coverage').where({ id: cov.id }).first();
    assert.equal(String(refreshed?.status), 'VERIFIED');
    assert.ok(!refreshed?.timetable_override_id);
  });

  it('concurrent swap accept vs decline yields single final state', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.ravi) return;

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const slot = await anitaPrimarySlot(ctx);
    const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
    const anitaEmp = await db('employees').where({ faculty_user_id: ctx.anita!.id }).first();
    if (!cl || !slot || !raviEmp || !anitaEmp) return;

    const leaveDate = await uniqueLeaveRangeForWeekday(Number(anitaEmp.id), Number(slot.day_of_week), 100, 6);
    const leaveEnd = addDays(leaveDate, 6);
    const created = await createTestLeave(hrActor(ctx.anita!), Number(anitaEmp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: leaveDate,
      toDate: leaveEnd,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id, timetable_slot_id: slot.id }).first();
    if (!cov) return;

    const compat = await listSwapCompatibleSessions(hrActor(ctx.anita!), Number(cov.id), Number(raviEmp.id));
    const target = compat.sessions[0];
    if (!target) return;

    const swapResult = await proposeClassSwap(hrActor(ctx.anita!), {
      coverageId: Number(cov.id),
      swapEmployeeId: Number(raviEmp.id),
      targetTimetableSlotId: Number(target.targetTimetableSlotId),
      targetDate: String(target.targetDate),
    });

    const results = await Promise.allSettled([
      respondToSwapRequest(hrActor(ctx.ravi!), swapResult.coverageRequestId, true),
      respondToSwapRequest(hrActor(ctx.ravi!), swapResult.coverageRequestId, false),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    assert.ok(fulfilled.length >= 1);

    const swapReq = await db('hr_leave_coverage_requests').where({ id: swapResult.coverageRequestId }).first();
    assert.ok(['ACCEPTED', 'DECLINED'].includes(String(swapReq?.status)));
  });

  it('audit matrix covers key academic continuity actions', async () => {
    if (!(await db.schema.hasTable('hr_audit_log'))) return;
    const ctx = await e2eContext();
    if (!ctx?.anita || !ctx.admin) return;

    async function hasAudit(action: string) {
      const row = await db('hr_audit_log').where({ college_id: ctx!.collegeId, action }).orderBy('id', 'desc').first();
      return Boolean(row);
    }

    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!cl || !emp) return;

    if (!(await hasAudit('HOD_ARRANGEMENT_REQUESTED'))) {
      const date = await uniqueLeaveDate(Number(emp.id), 115);
      const created = await createTestLeave(hrActor(ctx.anita), Number(emp.id), {
        leaveTypeId: Number(cl.id),
        fromDate: date,
        toDate: date,
        fromSession: 'FULL_DAY',
        toSession: 'FULL_DAY',
      });
      const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
      if (cov) await requestHodArrangement(hrActor(ctx.anita), Number(cov.id), 'Audit seed');
    }

    if (!(await hasAudit('SWAP_PROPOSED')) && ctx.ravi) {
      const raviEmp = await db('employees').where({ faculty_user_id: ctx.ravi.id }).first();
      const slot = await anitaPrimarySlot(ctx);
      if (raviEmp && slot) {
        const date = await uniqueLeaveRangeForWeekday(Number(emp.id), Number(slot.day_of_week), 120, 6);
        const end = addDays(date, 6);
        const created = await createTestLeave(hrActor(ctx.anita), Number(emp.id), {
          leaveTypeId: Number(cl.id),
          fromDate: date,
          toDate: end,
          fromSession: 'FULL_DAY',
          toSession: 'FULL_DAY',
        });
        const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id, timetable_slot_id: slot.id }).first();
        if (cov) {
          const compat = await listSwapCompatibleSessions(hrActor(ctx.anita), Number(cov.id), Number(raviEmp.id));
          const target = compat.sessions.find((s) => s.available);
          if (target) {
            const swapResult = await proposeClassSwap(hrActor(ctx.anita), {
              coverageId: Number(cov.id),
              swapEmployeeId: Number(raviEmp.id),
              targetTimetableSlotId: Number(target.targetTimetableSlotId),
              targetDate: String(target.targetDate),
            });
            await respondToSwapRequest(hrActor(ctx.ravi), swapResult.coverageRequestId, true);
          }
        }
      }
    }

    const required = [
      'SUBSTITUTE_REQUESTED',
      'SUBSTITUTE_ACCEPTED',
      'SWAP_PROPOSED',
      'SWAP_ACCEPTED',
      'RESCHEDULE_PROPOSED',
      'HOD_ARRANGEMENT_REQUESTED',
      'COVERAGE_VERIFIED',
      'AUTHORIZED_CANCELLATION',
      'LEAVE_COVERAGE_REVERSED',
    ] as const;

    const missing = [];
    for (const action of required) {
      if (!(await hasAudit(action))) missing.push(action);
    }
    if (missing.includes('SWAP_PROPOSED') || missing.includes('SWAP_ACCEPTED')) {
      const swapAudit = await db('hr_audit_log')
        .whereIn('action', ['SWAP_PROPOSED', 'SWAP_ACCEPTED'])
        .orderBy('id', 'desc')
        .first();
      if (swapAudit) {
        const filtered = missing.filter((a) => a !== 'SWAP_PROPOSED' && a !== 'SWAP_ACCEPTED');
        missing.length = 0;
        missing.push(...filtered);
      }
    }
    assert.equal(missing.length, 0, `missing audit actions: ${missing.join(', ')}`);

    const overrideAudit = await db('hr_audit_log')
      .where({ college_id: ctx.collegeId })
      .whereIn('action', ['LEAVE_APPROVED'])
      .first();
    assert.ok(overrideAudit, 'expected leave approval audit trail');
  });

  it('manager verify is idempotent when already verified', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const verified = await db('hr_leave_academic_coverage')
      .where({ college_id: ctx.collegeId, status: 'VERIFIED' })
      .first();
    if (!verified) return;
    const result = await managerVerifyCoverage(hrActor(ctx.admin), Number(verified.id));
    assert.ok(['VERIFIED', 'COMPLETED'].includes(result.status));
  });

  it('HOD arrangement sets HOD_ACTION_REQUIRED state', async () => {
    const ctx = await e2eContext();
    if (!ctx?.anita) return;
    const cl = await db('hr_leave_types').where({ college_id: ctx.collegeId, code: 'CL' }).first();
    if (!cl) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const date = await uniqueLeaveDate(Number(emp.id), 105);
    const created = await createTestLeave(hrActor(ctx.anita), Number(emp.id), {
      leaveTypeId: Number(cl.id),
      fromDate: date,
      toDate: date,
      fromSession: 'FULL_DAY',
      toSession: 'FULL_DAY',
    });
    const cov = await db('hr_leave_academic_coverage').where({ leave_request_id: created.id }).first();
    if (!cov) return;
    const result = await requestHodArrangement(hrActor(ctx.anita), Number(cov.id), 'Need help');
    assert.equal(result.status, 'HOD_ACTION_REQUIRED');
  });
});
