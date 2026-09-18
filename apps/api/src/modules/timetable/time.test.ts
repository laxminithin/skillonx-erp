import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  asHHMM,
  dateInRange,
  dateRangesOverlap,
  hoursBetween,
  startOfWeek,
  timesOverlap,
  todayInTimezone,
  weekdayInTimezone,
} from './time.js';

describe('timetable time helpers', () => {
  it('detects overlapping clock times without treating adjacent periods as conflicts', () => {
    assert.equal(timesOverlap('09:00', '09:55', '09:55', '10:50'), false);
    assert.equal(timesOverlap('09:00', '10:50', '09:55', '10:50'), true);
    assert.equal(timesOverlap('13:45', '16:30', '14:40', '15:35'), true);
  });

  it('computes hours for multi-period lab blocks', () => {
    assert.equal(hoursBetween('13:45', '16:30'), 2.75);
    assert.equal(asHHMM('9:00:00'), '09:00');
  });

  it('treats open-ended effective ranges as overlapping later versions', () => {
    assert.equal(dateRangesOverlap('2026-08-01', '2026-08-31', '2026-09-01', null), false);
    assert.equal(dateRangesOverlap('2026-08-01', null, '2026-09-01', null), true);
    assert.equal(dateInRange('2026-09-01', '2026-08-01', '2026-08-31'), false);
    assert.equal(dateInRange('2026-08-15', '2026-08-01', '2026-08-31'), true);
  });

  it('uses the institution timezone rather than the server local calendar', () => {
    const tz = 'Asia/Kolkata';
    const monday = '2026-08-31';
    assert.equal(weekdayInTimezone(monday, tz), 1);
    assert.equal(startOfWeek('2026-09-01', tz), '2026-08-31');
    assert.match(todayInTimezone(tz), /^\d{4}-\d{2}-\d{2}$/);
  });
});
