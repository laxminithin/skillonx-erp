import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertFacultyIsolation,
  countReadyPlans,
  facultyScopeFilter,
  mapMappingStatus,
  pendingEvaluationTotal,
  resolveAcademicContext,
  sortAttentionItems,
  sortUpcomingItems,
} from './helpers.js';

describe('facultyScopeFilter', () => {
  it('scopes faculty to their own created_by', () => {
    assert.deepEqual(facultyScopeFilter('FACULTY', 42), { createdBy: 42 });
    assert.deepEqual(facultyScopeFilter('HOD', 7), { createdBy: 7 });
  });

  it('does not force createdBy for admin roles', () => {
    assert.deepEqual(facultyScopeFilter('COLLEGE_ADMIN', 1), { createdBy: null });
    assert.deepEqual(facultyScopeFilter('SUPER_ADMIN', 1), { createdBy: null });
  });
});

describe('assertFacultyIsolation', () => {
  it('passes when every resource belongs to the faculty', () => {
    assert.equal(assertFacultyIsolation(10, [10, 10, 10]), true);
  });

  it('fails when another faculty id appears', () => {
    assert.equal(assertFacultyIsolation(10, [10, 11]), false);
  });
});

describe('mapMappingStatus', () => {
  it('maps finalized and draft states', () => {
    assert.equal(mapMappingStatus('APPROVED'), 'FINALIZED');
    assert.equal(mapMappingStatus('SUBMITTED'), 'FINALIZED');
    assert.equal(mapMappingStatus('DRAFT'), 'DRAFT');
    assert.equal(mapMappingStatus(null), 'MISSING');
  });
});

describe('pendingEvaluationTotal', () => {
  it('sums actionable pending work', () => {
    assert.equal(
      pendingEvaluationTotal({
        assignmentPending: 28,
        quizManual: 2,
        coEvalDrafts: 1,
        openGaps: 3,
      }),
      34,
    );
  });
});

describe('countReadyPlans', () => {
  it('caps ready counts by course count', () => {
    const result = countReadyPlans({
      courseCount: 3,
      lessonPlansCreated: 5,
      mappingsFinalized: 3,
      gapCompleted: 1,
      cbsCompleted: 0,
      coEvalFinalized: 2,
    });
    assert.equal(result.total, 15);
    assert.equal(result.ready, 3 + 3 + 1 + 0 + 2);
  });
});

describe('resolveAcademicContext', () => {
  it('returns single context when faculty teaches one program/semester', () => {
    const ctx = resolveAcademicContext([
      {
        academicYearId: 1,
        academicYearLabel: '2026–27',
        programId: 2,
        programName: 'ISE',
        semesterId: 7,
        semesterLabel: 'VII',
      },
      {
        academicYearId: 1,
        academicYearLabel: '2026–27',
        programId: 2,
        programName: 'ISE',
        semesterId: 7,
        semesterLabel: 'VII',
      },
    ]);
    assert.equal(ctx.multiContext, false);
    assert.equal(ctx.academicYearLabel, '2026–27');
    assert.equal(ctx.programName, 'ISE');
    assert.equal(ctx.semesterLabel, 'VII');
  });

  it('flags multi-context and clears singular fields', () => {
    const ctx = resolveAcademicContext([
      {
        academicYearId: 1,
        academicYearLabel: '2026–27',
        programId: 2,
        programName: 'ISE',
        semesterId: 7,
        semesterLabel: 'VII',
      },
      {
        academicYearId: 1,
        academicYearLabel: '2026–27',
        programId: 3,
        programName: 'CSE',
        semesterId: 5,
        semesterLabel: 'V',
      },
    ]);
    assert.equal(ctx.multiContext, true);
    assert.equal(ctx.programName, null);
    assert.equal(ctx.semesterLabel, null);
  });
});

describe('sortAttentionItems', () => {
  it('orders high severity first', () => {
    const sorted = sortAttentionItems([
      { kind: 'A', severity: 'low', title: 'low', href: '/' },
      { kind: 'B', severity: 'high', title: 'high', count: 2, href: '/' },
      { kind: 'C', severity: 'medium', title: 'med', href: '/' },
    ]);
    assert.equal(sorted[0].severity, 'high');
    assert.equal(sorted[1].severity, 'medium');
    assert.equal(sorted[2].severity, 'low');
  });
});

describe('sortUpcomingItems', () => {
  it('sorts by date ascending and limits', () => {
    const sorted = sortUpcomingItems(
      [
        { at: '2026-08-24T10:00:00.000Z', kind: 'QUIZ', title: 'b', href: '/' },
        { at: '2026-08-22T10:00:00.000Z', kind: 'QUIZ', title: 'a', href: '/' },
        { at: '2026-08-26T10:00:00.000Z', kind: 'QUIZ', title: 'c', href: '/' },
      ],
      2,
    );
    assert.equal(sorted.length, 2);
    assert.equal(sorted[0].title, 'a');
    assert.equal(sorted[1].title, 'b');
  });
});
