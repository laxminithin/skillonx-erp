export const DEFAULT_ATTENDANCE_POLICY = {
    minimumPercentage: 85,
    countLateAsPresent: true,
    countExcusedInDenominator: true,
};
export function countsAsAttended(status, policy) {
    if (status === 'PRESENT')
        return true;
    if (status === 'LATE')
        return policy.countLateAsPresent;
    return false;
}
export function countsInDenominator(status, policy) {
    if (status === 'EXCUSED')
        return policy.countExcusedInDenominator;
    return true;
}
export function computeAttendancePercentage(statuses, policy = DEFAULT_ATTENDANCE_POLICY) {
    let attended = 0;
    let denominator = 0;
    for (const status of statuses) {
        if (!countsInDenominator(status, policy))
            continue;
        denominator += 1;
        if (countsAsAttended(status, policy))
            attended += 1;
    }
    if (!denominator)
        return null;
    return Math.round((attended / denominator) * 1000) / 10;
}
export function attendanceStanding(percentage, policy = DEFAULT_ATTENDANCE_POLICY) {
    if (percentage == null) {
        return { label: 'Not yet recorded', tone: 'muted', code: 'NONE' };
    }
    if (percentage >= policy.minimumPercentage) {
        return { label: 'Good standing', tone: 'success', code: 'GOOD' };
    }
    if (percentage >= policy.minimumPercentage - 10) {
        return { label: 'Below recommended level', tone: 'warning', code: 'BELOW' };
    }
    return { label: 'Attendance shortage', tone: 'danger', code: 'SHORTAGE' };
}
export function summarizeStatuses(statuses) {
    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, total: statuses.length };
    for (const status of statuses) {
        if (status in counts)
            counts[status] += 1;
    }
    return counts;
}
