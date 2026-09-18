export const PROGRESS_WEIGHTS = {
    topics: 40,
    assignments: 25,
    quizzes: 25,
    activities: 10,
};
export function ratio(counts) {
    if (!counts.total)
        return null;
    return Math.min(1, Math.max(0, counts.done / counts.total));
}
export function combineProgress(input) {
    const parts = [];
    const topic = ratio(input.topics);
    const assignment = ratio(input.assignments);
    const quiz = ratio(input.quizzes);
    const activity = ratio(input.activities);
    if (topic != null)
        parts.push({ weight: PROGRESS_WEIGHTS.topics, value: topic });
    if (assignment != null)
        parts.push({ weight: PROGRESS_WEIGHTS.assignments, value: assignment });
    if (quiz != null)
        parts.push({ weight: PROGRESS_WEIGHTS.quizzes, value: quiz });
    if (activity != null)
        parts.push({ weight: PROGRESS_WEIGHTS.activities, value: activity });
    if (!parts.length)
        return 0;
    const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
    return Math.round((parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum) * 100);
}
export function coBand(percentage) {
    if (percentage == null)
        return { label: 'Not yet assessed', tone: 'muted' };
    if (percentage >= 75)
        return { label: 'Strong', tone: 'success' };
    if (percentage >= 50)
        return { label: 'Developing', tone: 'warning' };
    return { label: 'Needs attention', tone: 'danger' };
}
export function mapAssignmentStatus(row) {
    if (row.resultsReleased && row.evaluationStatus === 'RETURNED')
        return 'RETURNED';
    if (row.resultsReleased)
        return 'EVALUATED';
    if (row.submittedAt && row.isLate)
        return 'LATE';
    if (row.status === 'SUBMITTED' || row.status === 'LATE_SUBMITTED')
        return 'SUBMITTED';
    if (row.status === 'IN_PROGRESS')
        return 'DRAFT';
    return 'NOT_STARTED';
}
export function mapAssessmentStatus(row) {
    if (row.frozen && row.hasScore)
        return 'RESULT_RELEASED';
    if (row.frozen && !row.hasScore)
        return 'RESULT_PENDING';
    if (row.hasScore && !row.frozen)
        return 'RESULT_PENDING';
    const when = row.date ? new Date(row.date) : null;
    if (when && when.getTime() > Date.now())
        return 'UPCOMING';
    if (when && when.getTime() <= Date.now() && !row.frozen)
        return 'COMPLETED';
    return 'UPCOMING';
}
