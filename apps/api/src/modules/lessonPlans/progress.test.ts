import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computePlanProgress } from './progress.js';

const base = {
  plannedDate: '2026-08-18',
  actualDate: '2026-08-18',
  plannedHours: 1,
  actualHours: 1,
  moduleId: 1,
  moduleLabel: 'Module 1',
  moduleName: 'Intro',
};

describe('lesson plan progress', () => {
  it('is zero when nothing is complete', () => {
    const p = computePlanProgress(
      [
        { ...base, status: 'PLANNED' },
        { ...base, status: 'PLANNED', moduleId: 2, moduleLabel: 'Module 2' },
      ],
      '2026-08-18',
    );
    assert.equal(p.percent, 0);
    assert.equal(p.completedHours, 0);
    assert.equal(p.modules.length, 2);
  });

  it('computes partial and complete progress without NaN', () => {
    const p = computePlanProgress(
      [
        { ...base, status: 'COMPLETED' },
        { ...base, status: 'PLANNED', plannedDate: '2026-08-20', actualDate: '2026-08-20' },
      ],
      '2026-08-18',
    );
    assert.equal(p.completedUnits, 1);
    assert.equal(p.percent, 50);
    assert.equal(Number.isNaN(p.hoursPercent), false);
    const done = computePlanProgress(
      [
        { ...base, status: 'COMPLETED' },
        { ...base, status: 'COMPLETED' },
      ],
      '2026-08-18',
    );
    assert.equal(done.percent, 100);
    assert.equal(done.hoursPercent, 100);
  });

  it('reports behind and ahead of plan', () => {
    const behind = computePlanProgress(
      [
        { ...base, status: 'PLANNED', plannedDate: '2026-08-10', actualDate: '2026-08-10' },
        { ...base, status: 'COMPLETED', plannedDate: '2026-08-12', actualDate: '2026-08-12' },
      ],
      '2026-08-18',
    );
    assert.ok((behind.statusLabel || '').includes('behind'));
    const ahead = computePlanProgress(
      [
        { ...base, status: 'COMPLETED', plannedDate: '2026-08-10', actualDate: '2026-08-10' },
        { ...base, status: 'COMPLETED', plannedDate: '2026-08-20', actualDate: '2026-08-18' },
      ],
      '2026-08-18',
    );
    assert.ok((ahead.statusLabel || '').includes('ahead'));
  });

  it('does not divide by zero on an empty plan', () => {
    const p = computePlanProgress([], '2026-08-18');
    assert.equal(p.percent, 0);
    assert.equal(p.hoursPercent, 0);
    assert.equal(p.expectedPercent, 0);
  });
});
