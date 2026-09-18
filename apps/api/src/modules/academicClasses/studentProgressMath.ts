export type ProgressCounts = {
  done: number;
  total: number;
};

export type ProgressInputs = {
  topics: ProgressCounts;
  assignments: ProgressCounts;
  quizzes: ProgressCounts;
  activities: ProgressCounts;
};

export const PROGRESS_WEIGHTS = {
  topics: 40,
  assignments: 25,
  quizzes: 25,
  activities: 10,
} as const;

export function ratio(counts: ProgressCounts) {
  if (!counts.total) return null;
  return Math.min(1, Math.max(0, counts.done / counts.total));
}

export function combineProgress(input: ProgressInputs) {
  const parts: Array<{ weight: number; value: number }> = [];
  const topic = ratio(input.topics);
  const assignment = ratio(input.assignments);
  const quiz = ratio(input.quizzes);
  const activity = ratio(input.activities);
  if (topic != null) parts.push({ weight: PROGRESS_WEIGHTS.topics, value: topic });
  if (assignment != null) parts.push({ weight: PROGRESS_WEIGHTS.assignments, value: assignment });
  if (quiz != null) parts.push({ weight: PROGRESS_WEIGHTS.quizzes, value: quiz });
  if (activity != null) parts.push({ weight: PROGRESS_WEIGHTS.activities, value: activity });
  if (!parts.length) return 0;
  const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
  return Math.round((parts.reduce((sum, part) => sum + part.value * part.weight, 0) / weightSum) * 100);
}

export function coBand(percentage: number | null) {
  if (percentage == null) return { label: 'Not yet assessed', tone: 'muted' as const };
  if (percentage >= 75) return { label: 'Strong', tone: 'success' as const };
  if (percentage >= 50) return { label: 'Developing', tone: 'warning' as const };
  return { label: 'Needs attention', tone: 'danger' as const };
}

export function mapAssignmentStatus(row: {
  status?: string | null;
  submittedAt?: Date | string | null;
  isLate?: boolean;
  evaluationStatus?: string | null;
  resultsReleased?: boolean;
  obtainedMarks?: number | null;
}) {
  if (row.resultsReleased && row.evaluationStatus === 'RETURNED') return 'RETURNED';
  if (row.resultsReleased) return 'EVALUATED';
  if (row.submittedAt && row.isLate) return 'LATE';
  if (row.status === 'SUBMITTED' || row.status === 'LATE_SUBMITTED') return 'SUBMITTED';
  if (row.status === 'IN_PROGRESS') return 'DRAFT';
  return 'NOT_STARTED';
}

export function mapAssessmentStatus(row: {
  frozen?: boolean;
  hasScore?: boolean;
  date?: Date | string | null;
}) {
  if (row.frozen && row.hasScore) return 'RESULT_RELEASED';
  if (row.frozen && !row.hasScore) return 'RESULT_PENDING';
  if (row.hasScore && !row.frozen) return 'RESULT_PENDING';
  const when = row.date ? new Date(row.date) : null;
  if (when && when.getTime() > Date.now()) return 'UPCOMING';
  if (when && when.getTime() <= Date.now() && !row.frozen) return 'COMPLETED';
  return 'UPCOMING';
}
