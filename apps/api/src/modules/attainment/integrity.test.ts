import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canApproveClosure, canTransition, nextAfterImplemented, nextAfterReassessed } from './workflow.js';
import { evidenceCompleteness } from './evidence.js';
import { schemeComponentsValid, validateMarksImport } from './marksValidation.js';
import { evaluatePaperQuality } from './qualityGate.js';
import { decideAttainmentAccess, decideAttainmentMutateAccess, type AttainmentActor } from './access.js';
import { parsePolicy, SKILLONX_STANDARD_V1 } from './policy.js';
import { FORMULA_VERSION } from './types.js';

describe('continuous improvement state machine', () => {
  it('allows the documented happy path', () => {
    const path = [
      'DETECTED',
      'FACULTY_REVIEW_REQUIRED',
      'ACTION_PLANNED',
      'APPROVED_FOR_IMPLEMENTATION',
      'IN_PROGRESS',
      'IMPLEMENTED',
      'READY_FOR_REASSESSMENT',
      'REASSESSED',
      'TARGET_ACHIEVED',
      'SUBMITTED_FOR_REVIEW',
      'APPROVED',
      'CLOSED',
    ] as const;
    for (let i = 0; i < path.length - 1; i++) {
      assert.equal(canTransition(path[i], path[i + 1]), true, `${path[i]} → ${path[i + 1]}`);
    }
    assert.equal(canTransition('IN_PROGRESS', 'EVIDENCE_INCOMPLETE'), true);
  });

  it('rejects faculty self-close and invalid jumps', () => {
    assert.equal(canTransition('FACULTY_REVIEW_REQUIRED', 'CLOSED'), false);
    assert.equal(canTransition('IMPLEMENTED', 'CLOSED'), false);
    assert.equal(
      canApproveClosure({ facultyUserId: 1, role: 'FACULTY' }, { createdBy: 1 }),
      false,
    );
    assert.equal(canApproveClosure({ facultyUserId: 1, role: 'HOD' }, { createdBy: 1 }), false);
    assert.equal(canApproveClosure({ facultyUserId: 2, role: 'HOD' }, { createdBy: 1 }), true);
  });

  it('requires evidence completeness before reassessment', () => {
    assert.equal(nextAfterImplemented(false), 'EVIDENCE_INCOMPLETE');
    assert.equal(nextAfterImplemented(true), 'READY_FOR_REASSESSMENT');
    assert.equal(nextAfterReassessed(false), 'TARGET_NOT_ACHIEVED');
    assert.equal(nextAfterReassessed(true), 'TARGET_ACHIEVED');
  });
});

describe('evidence completeness', () => {
  it('uses required items only', () => {
    const result = evidenceCompleteness([
      { code: 'ATTENDANCE', label: 'Attendance', required: true, satisfied: true },
      { code: 'REPORT', label: 'Report', required: true, satisfied: false },
      { code: 'PHOTOS', label: 'Photos', required: false, satisfied: false },
    ]);
    assert.equal(result.percent, 50);
    assert.equal(result.complete, false);
    const done = evidenceCompleteness([
      { code: 'ATTENDANCE', label: 'Attendance', required: true, satisfied: true },
      { code: 'REPORT', label: 'Report', required: true, satisfied: true },
      { code: 'PHOTOS', label: 'Photos', required: false, satisfied: false },
    ]);
    assert.equal(done.percent, 100);
    assert.equal(done.complete, true);
  });
});

describe('marks import integrity', () => {
  const questions = [
    { questionKey: 'Q1', label: 'Q1', maxMarks: 10 },
    { questionKey: 'Q2', label: 'Q2', maxMarks: 10 },
  ];
  it('rejects marks above maximum, unknown USNs and total mismatches', () => {
    const preview = validateMarksImport({
      questions,
      knownUsns: new Set(['1AB']),
      rows: [
        { usn: '1AB', questionMarks: { Q1: 11, Q2: 5 }, total: 16 },
        { usn: 'UNKNOWN', questionMarks: { Q1: 5, Q2: 5 }, total: 10 },
        { usn: '1AB', questionMarks: { Q1: 5, Q2: 5 }, total: 9 },
      ],
    });
    assert.equal(preview.ok, false);
    assert.ok(preview.issues.some((i) => i.code === 'MARKS_EXCEED_MAX'));
    assert.ok(preview.issues.some((i) => i.code === 'UNKNOWN_USN'));
    assert.ok(preview.issues.some((i) => i.code === 'DUPLICATE_STUDENT'));
  });

  it('accepts absent tokens and valid totals', () => {
    const preview = validateMarksImport({
      questions,
      knownUsns: new Set(['1AB']),
      rows: [{ usn: '1ab', name: 'A', questionMarks: { Q1: 'ABSENT', Q2: 'A' } }],
    });
    assert.equal(preview.ok, true);
    assert.equal(preview.parsed[0].status, 'ABSENT');
  });
});

describe('scheme totals', () => {
  it('requires component sum to equal question marks', () => {
    assert.equal(schemeComponentsValid(10, [{ maxMarks: 2 }, { maxMarks: 3 }, { maxMarks: 3 }, { maxMarks: 2 }]).ok, true);
    assert.equal(schemeComponentsValid(10, [{ maxMarks: 4 }, { maxMarks: 4 }]).ok, false);
  });
});

describe('question paper quality gate', () => {
  it('blocks publish on critical failures and uses a versioned score', () => {
    const report = evaluatePaperQuality({
      maxMarks: 20,
      courseCoCodes: ['CO1', 'CO2'],
      items: [
        {
          questionKey: '1',
          questionText: 'Q',
          maxMarks: 10,
          primaryCo: 'CO1',
          fingerprint: 'a',
          bloomLevel: 'REMEMBER',
          difficulty: 'EASY',
        },
      ],
    });
    assert.equal(report.okToPublish, false);
    assert.equal(report.version, 'skillonx-qp-quality-v1.0');
    assert.ok(report.criticalFailures.some((c) => c.code === 'MARKS_TOTAL'));
    assert.ok(report.criticalFailures.some((c) => c.code === 'SCHEME_COMPLETE'));
    assert.ok(report.criticalFailures.some((c) => c.code === 'SOLUTION_COMPLETE'));
  });
});

describe('access isolation', () => {
  const owner: AttainmentActor = { facultyUserId: 1, collegeId: 10, role: 'FACULTY', departmentId: 5 };
  const peer: AttainmentActor = { facultyUserId: 2, collegeId: 10, role: 'FACULTY', departmentId: 5 };
  const cross: AttainmentActor = { facultyUserId: 3, collegeId: 99, role: 'FACULTY', departmentId: 1 };
  const record = { collegeId: 10, createdBy: 1, departmentId: 5 };

  it('hides cross-institution records and forbids peer mutation', () => {
    assert.equal(decideAttainmentAccess(cross, record), 'NOT_FOUND');
    assert.equal(decideAttainmentMutateAccess(peer, record), 'FORBIDDEN');
    assert.equal(decideAttainmentMutateAccess(owner, record), 'ALLOW');
  });
});

describe('historical policy snapshot', () => {
  it('keeps a frozen policy independent of later default edits', () => {
    const snapshot = parsePolicy({ ...SKILLONX_STANDARD_V1, defaultCoTarget: 2.0, formulaVersion: FORMULA_VERSION });
    const later = parsePolicy({ ...SKILLONX_STANDARD_V1, defaultCoTarget: 2.8 });
    assert.equal(snapshot.defaultCoTarget, 2.0);
    assert.equal(later.defaultCoTarget, 2.8);
    assert.equal(snapshot.formulaVersion, FORMULA_VERSION);
  });
});
