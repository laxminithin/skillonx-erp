import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enumeratePeriods, scheduleEntries } from './scheduler.js';

const slots = [
  { weekday: 1, startTime: '10:00', endTime: '11:00', hours: 1 },
  { weekday: 3, startTime: '11:00', endTime: '12:00', hours: 1 },
  { weekday: 4, startTime: '14:00', endTime: '15:00', hours: 1 },
];

describe('lesson plan scheduler', () => {
  it('schedules Monday/Wednesday/Thursday and skips holidays', () => {
    const periods = enumeratePeriods({
      startDate: '2026-08-17',
      endDate: '2026-08-28',
      slots,
      blockedDates: ['2026-08-19'],
    });
    assert.ok(periods.every((p) => p.date !== '2026-08-19'));
    assert.ok(periods.some((p) => p.date === '2026-08-17' && p.weekday === 1));
    assert.ok(periods.some((p) => p.date === '2026-08-20' && p.weekday === 4));
    assert.ok(!periods.some((p) => p.weekday === 2));
  });

  it('sets plannedDate equal to actualDate on generation', () => {
    const periods = enumeratePeriods({
      startDate: '2026-08-17',
      endDate: '2026-12-18',
      slots,
      blockedDates: ['2026-10-02'],
    });
    const result = scheduleEntries(
      [
        { key: '1', hours: 1 },
        { key: '2', hours: 2 },
      ],
      periods,
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    for (const row of result.scheduled) {
      assert.equal(row.plannedDate, row.actualDate);
    }
  });

  it('reports a shortfall instead of dropping topics', () => {
    const periods = enumeratePeriods({
      startDate: '2026-08-17',
      endDate: '2026-08-20',
      slots,
      blockedDates: [],
    });
    const result = scheduleEntries(
      Array.from({ length: 20 }, (_, i) => ({ key: String(i), hours: 1 })),
      periods,
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, 'SHORTFALL');
    assert.ok(result.shortfallHours > 0);
    assert.ok(result.requiredHours > result.availableHours);
  });

  it('does not invent extra topics when spare teaching hours exist', () => {
    const periods = enumeratePeriods({
      startDate: '2026-08-17',
      endDate: '2026-12-18',
      slots,
      blockedDates: [],
    });
    const result = scheduleEntries([{ key: 'only', hours: 1 }], periods);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.scheduled.length, 1);
    assert.ok(result.unusedHours > 0);
  });

  it('respects semester start and blocked dates', () => {
    const periods = enumeratePeriods({
      startDate: '2026-08-18',
      endDate: '2026-08-20',
      slots,
      blockedDates: ['2026-08-19'],
    });
    assert.ok(!periods.some((p) => p.date === '2026-08-17'));
    assert.ok(!periods.some((p) => p.date === '2026-08-19'));
  });
});
