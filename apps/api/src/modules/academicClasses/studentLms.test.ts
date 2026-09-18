import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { combineProgress, coBand, mapAssignmentStatus, mapAssessmentStatus } from './studentProgressMath.js';
import { isCoreKind, courseTypeLabel } from './studentAccess.js';

describe('student progress engine', () => {
  it('weights real activity completion, not page opens', () => {
    const progress = combineProgress({
      topics: { done: 2, total: 4 },
      assignments: { done: 1, total: 2 },
      quizzes: { done: 0, total: 1 },
      activities: { done: 0, total: 0 },
    });
    assert.equal(progress, 36);
  });

  it('redistributes weights when a category has no work', () => {
    const onlyTopics = combineProgress({
      topics: { done: 3, total: 3 },
      assignments: { done: 0, total: 0 },
      quizzes: { done: 0, total: 0 },
      activities: { done: 0, total: 0 },
    });
    assert.equal(onlyTopics, 100);
  });

  it('returns zero when nothing is configured', () => {
    assert.equal(
      combineProgress({
        topics: { done: 0, total: 0 },
        assignments: { done: 0, total: 0 },
        quizzes: { done: 0, total: 0 },
        activities: { done: 0, total: 0 },
      }),
      0,
    );
  });
});

describe('student-facing CO bands', () => {
  it('maps percentages to learning feedback without exposing thresholds as admin tools', () => {
    assert.equal(coBand(90).label, 'Strong');
    assert.equal(coBand(60).label, 'Developing');
    assert.equal(coBand(20).label, 'Needs attention');
    assert.equal(coBand(null).label, 'Not yet assessed');
  });
});

describe('assignment and assessment statuses', () => {
  it('does not expose marks before release', () => {
    assert.equal(mapAssignmentStatus({ status: 'SUBMITTED', submittedAt: new Date() }), 'SUBMITTED');
    assert.equal(
      mapAssignmentStatus({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        resultsReleased: false,
        evaluationStatus: 'EVALUATED',
        obtainedMarks: 18,
      }),
      'SUBMITTED',
    );
    assert.equal(
      mapAssignmentStatus({
        status: 'SUBMITTED',
        submittedAt: new Date(),
        resultsReleased: true,
        evaluationStatus: 'EVALUATED',
      }),
      'EVALUATED',
    );
    assert.equal(
      mapAssignmentStatus({
        submittedAt: new Date(),
        isLate: true,
        resultsReleased: false,
      }),
      'LATE',
    );
    assert.equal(mapAssignmentStatus({ status: 'IN_PROGRESS' }), 'DRAFT');
    assert.equal(mapAssignmentStatus({}), 'NOT_STARTED');
  });

  it('maps internal assessment release states', () => {
    assert.equal(mapAssessmentStatus({ frozen: true, hasScore: true }), 'RESULT_RELEASED');
    assert.equal(mapAssessmentStatus({ frozen: true, hasScore: false }), 'RESULT_PENDING');
    assert.equal(mapAssessmentStatus({ frozen: false, hasScore: false, date: new Date(Date.now() + 86400000) }), 'UPCOMING');
  });
});

describe('class subject access kinds', () => {
  it('treats core, lab, and AEC as class-derived subjects', () => {
    assert.equal(isCoreKind('CORE'), true);
    assert.equal(isCoreKind('LAB'), true);
    assert.equal(isCoreKind('ELECTIVE'), false);
    assert.equal(isCoreKind('OPEN_ELECTIVE'), false);
  });

  it('labels course types for student cards', () => {
    assert.equal(courseTypeLabel('CORE'), 'Theory');
    assert.equal(courseTypeLabel('LAB'), 'Laboratory');
    assert.equal(courseTypeLabel('ELECTIVE'), 'Elective');
  });
});
