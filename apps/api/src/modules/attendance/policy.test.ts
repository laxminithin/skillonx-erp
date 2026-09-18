import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendanceStanding,
  computeAttendancePercentage,
  DEFAULT_ATTENDANCE_POLICY,
  summarizeStatuses,
} from './policy.js';

describe('attendance policy math', () => {
  it('counts late as present by default', () => {
    const pct = computeAttendancePercentage(
      ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
      DEFAULT_ATTENDANCE_POLICY,
    );
    // denominator 4 (excused counted), attended 2 → 50%
    assert.equal(pct, 50);
  });

  it('can exclude excused from denominator', () => {
    const pct = computeAttendancePercentage(['PRESENT', 'ABSENT', 'EXCUSED'], {
      ...DEFAULT_ATTENDANCE_POLICY,
      countExcusedInDenominator: false,
    });
    assert.equal(pct, 50);
  });

  it('maps shortage bands using institution threshold', () => {
    assert.equal(attendanceStanding(91).code, 'GOOD');
    assert.equal(attendanceStanding(82).code, 'BELOW');
    assert.equal(attendanceStanding(74).code, 'SHORTAGE');
    assert.equal(attendanceStanding(null).code, 'NONE');
  });

  it('summarizes statuses for student history cards', () => {
    assert.deepEqual(summarizeStatuses(['PRESENT', 'PRESENT', 'ABSENT', 'LATE']), {
      PRESENT: 2,
      ABSENT: 1,
      LATE: 1,
      EXCUSED: 0,
      total: 4,
    });
  });
});
