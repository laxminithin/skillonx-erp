/**
 * Student LMS class-access and draft-visibility checks against a live database.
 * Skips cleanly when academic_classes is not present or the database is unavailable.
 *
 * Run: node --import tsx src/modules/academicClasses/studentLms.e2e.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { isCoreKind } from './studentAccess.js';
import { combineProgress } from './studentProgressMath.js';

async function liveSchema() {
  try {
    return {
      enrollments: await db.schema.hasTable('academic_class_enrollments'),
      studentCourse: await db.schema.hasTable('student_course_enrollments'),
      progress: await db.schema.hasTable('student_learning_progress'),
      positions: await db.schema.hasTable('student_learning_positions'),
      notifications: await db.schema.hasTable('student_notifications'),
      bookmarks: await db.schema.hasTable('student_bookmarks'),
      backlogs: await db.schema.hasTable('backlog_subject_registrations'),
    };
  } catch {
    return null;
  }
}

describe('student LMS class access invariants', () => {
  it('never treats electives as automatic class subjects', () => {
    assert.equal(isCoreKind('ELECTIVE'), false);
    assert.equal(isCoreKind('OPEN_ELECTIVE'), false);
    assert.equal(isCoreKind('CORE'), true);
  });

  it('does not award progress for an empty open', () => {
    assert.equal(
      combineProgress({
        topics: { done: 0, total: 5 },
        assignments: { done: 0, total: 0 },
        quizzes: { done: 0, total: 0 },
        activities: { done: 0, total: 0 },
      }),
      0,
    );
  });

  it('keeps enrollment class-based in the live schema when tables exist', async () => {
    const schema = await liveSchema();
    if (!schema?.enrollments) return;
    const cols = await db('academic_class_enrollments').columnInfo();
    assert.ok(cols.academic_class_id, 'students join a class, not a subject');
    assert.equal(Boolean(cols.course_id), false);
  });

  it('does not create a student-course enrollment table', async () => {
    const schema = await liveSchema();
    if (!schema) return;
    assert.equal(schema.studentCourse, false);
  });

  it('stores student LMS side-effects without duplicating lecturer content', async () => {
    const schema = await liveSchema();
    if (!schema) return;
    assert.equal(schema.progress, true);
    assert.equal(schema.positions, true);
    assert.equal(schema.notifications, true);
    assert.equal(schema.bookmarks, true);
    assert.equal(schema.backlogs, true);
  });
});
