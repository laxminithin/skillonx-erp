export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendancePolicy = {
  minimumPercentage: number;
  countLateAsPresent: boolean;
  countExcusedInDenominator: boolean;
};

export const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy = {
  minimumPercentage: 85,
  countLateAsPresent: true,
  countExcusedInDenominator: true,
};

export function countsAsAttended(status: AttendanceStatus, policy: AttendancePolicy) {
  if (status === 'PRESENT') return true;
  if (status === 'LATE') return policy.countLateAsPresent;
  return false;
}

export function countsInDenominator(status: AttendanceStatus, policy: AttendancePolicy) {
  if (status === 'EXCUSED') return policy.countExcusedInDenominator;
  return true;
}

export function computeAttendancePercentage(
  statuses: AttendanceStatus[],
  policy: AttendancePolicy = DEFAULT_ATTENDANCE_POLICY,
) {
  let attended = 0;
  let denominator = 0;
  for (const status of statuses) {
    if (!countsInDenominator(status, policy)) continue;
    denominator += 1;
    if (countsAsAttended(status, policy)) attended += 1;
  }
  if (!denominator) return null;
  return Math.round((attended / denominator) * 1000) / 10;
}

export function attendanceStanding(
  percentage: number | null,
  policy: AttendancePolicy = DEFAULT_ATTENDANCE_POLICY,
) {
  if (percentage == null) {
    return { label: 'Not yet recorded', tone: 'muted' as const, code: 'NONE' };
  }
  if (percentage >= policy.minimumPercentage) {
    return { label: 'Good standing', tone: 'success' as const, code: 'GOOD' };
  }
  if (percentage >= policy.minimumPercentage - 10) {
    return { label: 'Below recommended level', tone: 'warning' as const, code: 'BELOW' };
  }
  return { label: 'Attendance shortage', tone: 'danger' as const, code: 'SHORTAGE' };
}

export function summarizeStatuses(statuses: AttendanceStatus[]) {
  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, total: statuses.length };
  for (const status of statuses) {
    if (status in counts) counts[status as AttendanceStatus] += 1;
  }
  return counts;
}
