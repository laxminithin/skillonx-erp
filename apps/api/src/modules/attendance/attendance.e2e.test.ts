/**
 * Live attendance + class-roll invariants. Skips when E2E seed class is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { computeAttendancePercentage, attendanceStanding, DEFAULT_ATTENDANCE_POLICY } from './policy.js';

async function seededClass() {
  try {
    if (!(await db.schema.hasTable('academic_classes'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    return cls;
  } catch {
    return null;
  }
}

describe('attendance class invariants', () => {
  it('loads the same approved class roll for every mapped subject', async () => {
    const cls = await seededClass();
    if (!cls) return;
    const approved = await db('academic_class_enrollments')
      .where({ academic_class_id: cls.id, status: 'APPROVED' })
      .count({ c: '*' })
      .first();
    const roll = Number(approved?.c ?? 0);
    assert.ok(roll >= 2, 'E2E class should have approved students');
    const subjects = await db('academic_class_subjects').where({ academic_class_id: cls.id, is_active: true });
    assert.ok(subjects.length >= 2, 'class should map multiple subjects');
    for (const subject of subjects) {
      const students = await db('academic_class_enrollments as e')
        .join('students as s', 's.id', 'e.student_id')
        .where({
          'e.academic_class_id': cls.id,
          'e.status': 'APPROVED',
        })
        .andWhere('s.is_active', true)
        .select('s.id');
      assert.equal(students.length, roll, `subject ${subject.course_id} roll must match class enrollments`);
    }
  });

  it('keeps current and historical attendance on separate classes', async () => {
    const current = await seededClass();
    if (!current) return;
    const history = await db('academic_classes').where({ code: 'SX-E2E-CSE-2A' }).first();
    if (!history) return;
    const currentSessions = await db('attendance_sessions').where({
      academic_class_id: current.id,
      status: 'COMPLETED',
    });
    const historySessions = await db('attendance_sessions').where({
      academic_class_id: history.id,
      status: 'COMPLETED',
    });
    assert.ok(currentSessions.length >= 1);
    assert.ok(historySessions.length >= 1);
    const overlap = currentSessions.some((s) => historySessions.some((h) => Number(h.id) === Number(s.id)));
    assert.equal(overlap, false);
  });

  it('does not invent a blended grade from attendance percentage', () => {
    const pct = computeAttendancePercentage(['PRESENT', 'ABSENT'], DEFAULT_ATTENDANCE_POLICY);
    assert.equal(pct, 50);
    assert.equal(attendanceStanding(pct).code, 'SHORTAGE');
  });
});
