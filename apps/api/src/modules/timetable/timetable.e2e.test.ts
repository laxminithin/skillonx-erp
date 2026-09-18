/**
 * Live timetable + attendance-from-schedule checks. Skips when E2E seed class is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ClassActor } from '../academicClasses/access.js';
import * as timetable from './service.js';

async function seedContext() {
  try {
    if (!(await db.schema.hasTable('timetable_slots'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    const history = await db('academic_classes').where({ code: 'SX-E2E-CSE-2A' }).first();
    const faculty = await db('faculty_users').where({ email: 'anita@vviet.edu.in' }).first();
    if (!cls || !faculty) return null;
    const actor: ClassActor = {
      facultyUserId: Number(faculty.id),
      collegeId: Number(faculty.college_id),
      departmentId: faculty.department_id != null ? Number(faculty.department_id) : null,
      role: String(faculty.role || 'COLLEGE_ADMIN'),
    };
    const ds = await db('academic_class_subjects').where({ academic_class_id: cls.id }).orderBy('sort_order').first();
    return { cls, history, actor, ds };
  } catch {
    return null;
  }
}

describe('timetable e2e', () => {
  it('loads the seeded class weekly timetable for students and faculty', async () => {
    const ctx = await seedContext();
    if (!ctx) return;
    const week = await timetable.classWeek(ctx.actor, Number(ctx.cls.id));
    assert.ok(week.occurrences.length >= 1, 'seeded timetable should produce class occurrences');
    const student = await db('students').where({ usn: '4VV24CS001', college_id: ctx.actor.collegeId }).first();
    if (!student) return;
    const studentWeek = await timetable.studentTimetable(Number(student.id));
    assert.equal(studentWeek.class?.id, Number(ctx.cls.id));
    const facultyWeek = await timetable.facultyTimetable(ctx.actor);
    assert.ok(facultyWeek.timezone);
  });

  it('rejects a faculty teaching two classes in the same period', async () => {
    const ctx = await seedContext();
    if (!ctx?.history || !ctx.ds) return;
    const periods = await timetable.listPeriods(ctx.actor.collegeId);
    const p1 = periods.find((p) => p.periodNumber === 1);
    if (!p1) return;
    const historySubject = await db('academic_class_subjects')
      .where({ academic_class_id: ctx.history.id })
      .first();
    if (!historySubject) return;
    let threw = false;
    try {
      await timetable.createSlot(ctx.actor, {
        academicClassId: Number(ctx.history.id),
        classSubjectId: Number(historySubject.id),
        facultyIds: [ctx.actor.facultyUserId],
        dayOfWeek: 1,
        startPeriodId: p1.id,
        endPeriodId: p1.id,
        effectiveFrom: '2026-08-17',
      });
    } catch (err) {
      threw = true;
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).status, 409);
      assert.equal((err as AppError).code, 'FACULTY_CONFLICT');
    }
    assert.equal(threw, true, 'same faculty / same Monday period 1 must conflict');
  });

  it('rejects two subjects in the same class period', async () => {
    const ctx = await seedContext();
    if (!ctx) return;
    const periods = await timetable.listPeriods(ctx.actor.collegeId);
    const p1 = periods.find((p) => p.periodNumber === 1);
    const subjects = await db('academic_class_subjects').where({ academic_class_id: ctx.cls.id }).orderBy('sort_order');
    if (!p1 || subjects.length < 2) return;
    const second = subjects[1];
    const faculty = await db('academic_class_subject_faculty')
      .where({ class_subject_id: second.id, status: 'ACTIVE' })
      .first();
    if (!faculty) return;
    let threw = false;
    try {
      await timetable.createSlot(ctx.actor, {
        academicClassId: Number(ctx.cls.id),
        classSubjectId: Number(second.id),
        facultyIds: [Number(faculty.faculty_id)],
        dayOfWeek: 1,
        startPeriodId: p1.id,
        endPeriodId: p1.id,
        effectiveFrom: '2026-08-17',
      });
    } catch (err) {
      threw = true;
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).code, 'CLASS_CONFLICT');
    }
    assert.equal(threw, true);
  });

  it('shows holiday / no class without deleting the recurring slot', async () => {
    const ctx = await seedContext();
    if (!ctx) return;
    const calendars = await db('academic_calendars')
      .where({ college_id: ctx.actor.collegeId, academic_year_id: ctx.cls.academic_year_id })
      .select('id');
    if (!calendars.length) return;
    const date = '2026-10-05';
    const existing = await db('academic_calendar_exceptions')
      .where({ calendar_id: calendars[0].id, exception_date: date })
      .first();
    if (!existing) {
      await db('academic_calendar_exceptions').insert({
        calendar_id: calendars[0].id,
        exception_date: date,
        exception_type: 'HOLIDAY',
        label: 'E2E Holiday',
      });
    }
    const week = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), date, date);
    const holiday = week.occurrences.filter((o) => o.state === 'HOLIDAY');
    assert.ok(holiday.length >= 1);
    assert.equal(holiday.every((o) => o.attendanceExpected === false), true);
    const slots = await db('timetable_slots').where({ academic_class_id: ctx.cls.id, status: 'ACTIVE' });
    assert.ok(slots.length >= 1, 'recurring slots remain configured');
  });

  it('cancels one date, notifies students, and blocks attendance', async () => {
    const ctx = await seedContext();
    if (!ctx) return;
    const week = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), '2026-09-07', '2026-09-07');
    const slotOcc = week.occurrences.find((o) => o.slotId && o.state === 'SCHEDULED');
    if (!slotOcc?.slotId) return;
    await timetable.createOverride(ctx.actor, {
      slotId: slotOcc.slotId,
      academicClassId: slotOcc.academicClassId,
      classSubjectId: slotOcc.classSubjectId,
      date: '2026-09-07',
      kind: 'CANCELLED',
      reason: 'E2E cancellation',
    });
    const after = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), '2026-09-07', '2026-09-07');
    const cancelled = after.occurrences.find((o) => o.slotId === slotOcc.slotId);
    assert.equal(cancelled?.state, 'CANCELLED');
    const note = await db('student_notifications')
      .where({ type: 'CLASS_CANCELLED', related_type: 'TIMETABLE_OVERRIDE' })
      .orderBy('id', 'desc')
      .first();
    assert.ok(note);
    let blocked = false;
    try {
      await timetable.takeAttendanceFromOccurrence(ctx.actor, {
        date: '2026-09-07',
        slotId: slotOcc.slotId,
      });
    } catch (err) {
      blocked = true;
      assert.ok(err instanceof AppError);
    }
    assert.equal(blocked, true);
  });

  it('adds an extra class without changing the recurring timetable', async () => {
    const ctx = await seedContext();
    if (!ctx?.ds) return;
    const extraDate = '2026-09-26';
    const before = await db('timetable_slots').where({ academic_class_id: ctx.cls.id }).count({ c: '*' }).first();
    const existingExtra = await db('timetable_overrides')
      .where({ academic_class_id: ctx.cls.id, override_date: extraDate, kind: 'EXTRA', status: 'ACTIVE' })
      .first();
    if (!existingExtra) {
      await timetable.createOverride(ctx.actor, {
        academicClassId: Number(ctx.cls.id),
        classSubjectId: Number(ctx.ds.id),
        courseId: Number(ctx.ds.course_id),
        facultyId: ctx.actor.facultyUserId,
        date: extraDate,
        kind: 'EXTRA',
        startTime: '16:30',
        endTime: '17:30',
        reason: 'Makeup extra class',
      });
    }
    const after = await db('timetable_slots').where({ academic_class_id: ctx.cls.id }).count({ c: '*' }).first();
    assert.equal(Number(before?.c ?? 0), Number(after?.c ?? 0));
    const week = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), extraDate, extraDate);
    assert.ok(week.occurrences.some((o) => o.state === 'EXTRA'));
  });

  it('rejects two classes booking the same room in the same period', async () => {
    const ctx = await seedContext();
    if (!ctx?.history) return;
    const periods = await timetable.listPeriods(ctx.actor.collegeId);
    const p3 = periods.find((p) => p.periodNumber === 3);
    const room = await db('rooms').where({ college_id: ctx.actor.collegeId, code: 'R301' }).first();
    const historySubject = await db('academic_class_subjects')
      .where({ academic_class_id: ctx.history.id })
      .first();
    const mapped = historySubject
      ? await db('academic_class_subject_faculty')
          .where({ class_subject_id: historySubject.id, status: 'ACTIVE' })
          .first()
      : null;
    if (!p3 || !room || !historySubject || !mapped) return;
    let threw = false;
    try {
      await timetable.createSlot(ctx.actor, {
        academicClassId: Number(ctx.history.id),
        classSubjectId: Number(historySubject.id),
        facultyIds: [Number(mapped.faculty_id)],
        roomId: Number(room.id),
        dayOfWeek: 1,
        startPeriodId: p3.id,
        endPeriodId: p3.id,
        effectiveFrom: '2026-08-17',
      });
    } catch (err) {
      threw = true;
      assert.ok(err instanceof AppError);
      assert.equal((err as AppError).code, 'ROOM_CONFLICT');
    }
    assert.equal(threw, true, 'same room / same Monday period 3 must conflict');
  });

  it('creates attendance from a timetable slot, loads the class roll, and finalizes', async () => {
    const ctx = await seedContext();
    if (!ctx) return;
    const date = '2026-09-14';
    const week = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), date, date);
    const occ = week.occurrences.find((o) => o.slotId && o.state === 'SCHEDULED' && o.courseId);
    if (!occ?.slotId || !occ.courseId) return;
    const attendance = await import('../attendance/service.js');
    const created = await timetable.takeAttendanceFromOccurrence(ctx.actor, {
      date,
      slotId: occ.slotId,
      topicLabel: occ.plannedTopic?.topicName ?? occ.courseName,
      lessonPlanEntryId: occ.plannedTopic?.entryId,
      topicId: occ.plannedTopic?.topicId,
    });
    assert.ok(created.records.length >= 1, 'approved class roll must load');
    if (created.session.status === 'DRAFT') {
      assert.equal(created.records.every((r) => r.status === 'PRESENT'), true);
    }
    const reused = await timetable.takeAttendanceFromOccurrence(ctx.actor, { date, slotId: occ.slotId });
    assert.equal(reused.session.id, created.session.id, 'must not create a duplicate session');
    if (created.session.status !== 'COMPLETED') {
      const absent = created.records.find((r) => r.usn === '4VV24CS006') ?? created.records[created.records.length - 1];
      await attendance.markRecords(ctx.actor, created.session.id, {
        records: [{ studentId: absent.studentId, status: 'ABSENT' }],
      });
      const finalized = await attendance.finalizeSession(ctx.actor, created.session.id);
      assert.equal(finalized.session.status, 'COMPLETED');
    }
    const after = await timetable.classWeek(ctx.actor, Number(ctx.cls.id), date, date);
    const done = after.occurrences.find((o) => o.slotId === occ.slotId);
    assert.equal(done?.attendanceStatus, 'COMPLETED');
    const student = await db('students').where({ usn: '4VV24CS001', college_id: ctx.actor.collegeId }).first();
    if (!student) return;
    const summary = await attendance.studentAttendanceSummary(Number(student.id), Number(ctx.cls.id));
    assert.ok(summary.subjects.some((s) => s.percentage != null));
  });
});
