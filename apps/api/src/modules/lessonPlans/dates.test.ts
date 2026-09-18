import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, compareISODate, parseISODate, toISODate } from './dates.js';
import { enumeratePeriods, periodsFromDate, scheduleEntries } from './scheduler.js';

describe('planned vs actual dates', () => {
  it('keeps planned dates untouched when shifting subsequent actual dates', () => {
    const slots = [{ weekday: 1, startTime: '10:00', endTime: '11:00', hours: 1 }];
    const periods = enumeratePeriods({
      startDate: '2026-08-17',
      endDate: '2026-09-28',
      slots,
      blockedDates: [],
    });
    const generated = scheduleEntries(
      [
        { key: 'a', hours: 1 },
        { key: 'b', hours: 1 },
        { key: 'c', hours: 1 },
      ],
      periods,
    );
    assert.equal(generated.ok, true);
    if (!generated.ok) return;
    const planned = generated.scheduled.map((s) => s.plannedDate);
    const future = periodsFromDate(periods, addDays(generated.scheduled[1].actualDate, 7), { includeFromDate: true });
    const shifted = scheduleEntries(
      generated.scheduled.slice(1).map((s) => ({ key: s.key, hours: 1 })),
      future,
    );
    assert.equal(shifted.ok, true);
    if (!shifted.ok) return;
    assert.deepEqual(
      generated.scheduled.slice(1).map((s) => s.plannedDate),
      planned.slice(1),
    );
    assert.notEqual(shifted.scheduled[0].actualDate, generated.scheduled[1].actualDate);
    assert.equal(generated.scheduled[0].plannedDate, generated.scheduled[0].actualDate);
  });

  it('does not shift a completed historical entry', () => {
    const completed = { plannedDate: '2026-08-17', actualDate: '2026-08-17', status: 'COMPLETED' };
    const later = { plannedDate: '2026-08-24', actualDate: '2026-08-31', status: 'RESCHEDULED' };
    assert.equal(completed.plannedDate, '2026-08-17');
    assert.equal(later.plannedDate, '2026-08-24');
    assert.notEqual(later.plannedDate, later.actualDate);
  });
});

describe('date helpers', () => {
  it('parses ISO dates in local time', () => {
    const d = parseISODate('2026-08-18');
    assert.equal(toISODate(d), '2026-08-18');
    assert.equal(compareISODate('2026-08-18', '2026-08-19'), -1);
  });
});
