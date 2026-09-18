import { eachDate } from '../timetable/time.js';
import type { LEAVE_SESSIONS } from './types.js';

export type LeaveSession = (typeof LEAVE_SESSIONS)[number];

const SESSION_UNITS: Record<LeaveSession, number> = {
  FULL_DAY: 1,
  FIRST_HALF: 0.5,
  SECOND_HALF: 0.5,
};

export function calculateLeaveDays(
  fromDate: string,
  toDate: string,
  fromSession: LeaveSession,
  toSession: LeaveSession,
): number {
  if (fromDate > toDate) return 0;
  if (fromDate === toDate) {
    if (fromSession === 'FULL_DAY' || toSession === 'FULL_DAY') return 1;
    if (fromSession === toSession) return 0.5;
    return 1;
  }

  let total = 0;
  const dates = eachDate(fromDate, toDate);
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date === fromDate && date === toDate) continue;
    if (date === fromDate) {
      total += fromSession === 'SECOND_HALF' ? 0.5 : 1;
    } else if (date === toDate) {
      total += toSession === 'FIRST_HALF' ? 0.5 : 1;
    } else {
      total += 1;
    }
  }
  return total;
}

export function datesOverlap(
  aFrom: string,
  aTo: string,
  bFrom: string,
  bTo: string,
): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}
