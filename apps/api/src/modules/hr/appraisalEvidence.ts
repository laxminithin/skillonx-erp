import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { EVIDENCE_CALC_VERSION } from './appraisalTypes.js';
import { roundScore } from './appraisalScore.js';

type Row = Record<string, unknown>;

export type AppraisalEvidenceItem = {
  evidenceKey: string;
  sourceModule: string;
  sourceRef?: string | null;
  sourcePeriod?: string | null;
  valueNumeric?: number | null;
  valueDisplay?: string | null;
  payload?: Record<string, unknown> | null;
  criterionId?: number | null;
};

const SURVEY_MIN_RESPONSES = 3;

function monthsInPeriod(periodStart: string, periodEnd: string): { year: number; month: number }[] {
  const start = new Date(`${periodStart.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${periodEnd.slice(0, 10)}T00:00:00Z`);
  const out: { year: number; month: number }[] = [];
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cur <= endMonth) {
    out.push({ year: cur.getUTCFullYear(), month: cur.getUTCMonth() + 1 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

async function collectAttendance(
  collegeId: number,
  employeeId: number,
  periodStart: string,
  periodEnd: string,
): Promise<AppraisalEvidenceItem[]> {
  if (!(await db.schema.hasTable('employee_monthly_attendance'))) return [];
  const months = monthsInPeriod(periodStart, periodEnd);
  if (!months.length) return [];

  const rows = await db('employee_monthly_attendance')
    .where({ college_id: collegeId, employee_id: employeeId })
    .where((qb) => {
      for (const m of months) {
        qb.orWhere({ year: m.year, month: m.month });
      }
    });

  let present = 0;
  let working = 0;
  for (const r of rows as Row[]) {
    present += Number(r.present_days ?? 0) + Number(r.od_wfh_days ?? 0) + Number(r.half_days ?? 0) * 0.5;
    working += Number(r.working_days ?? 0);
  }
  const pct = roundScore((present / (working || 1)) * 100);
  return [
    {
      evidenceKey: 'ATTENDANCE_PCT',
      sourceModule: 'ATTENDANCE',
      sourcePeriod: `${periodStart.slice(0, 10)}..${periodEnd.slice(0, 10)}`,
      valueNumeric: pct,
      valueDisplay: `${pct}%`,
      payload: {
        presentDays: roundScore(present),
        workingDays: working,
        monthCount: rows.length,
        // Leave reasons / medical details intentionally omitted (privacy).
      },
    },
  ];
}

async function collectAcademicWorkload(
  collegeId: number,
  facultyUserId: number | null,
): Promise<AppraisalEvidenceItem[]> {
  if (!facultyUserId || !(await db.schema.hasTable('academic_class_subject_faculty'))) return [];
  let q = db('academic_class_subject_faculty').where({ faculty_id: facultyUserId });
  if (await db.schema.hasColumn('academic_class_subject_faculty', 'college_id')) {
    q = q.andWhere({ college_id: collegeId });
  }
  const countRow = await q.count({ c: '*' }).first();
  const count = Number(countRow?.c ?? 0);
  return [
    {
      evidenceKey: 'ACADEMIC_CLASSES_ASSIGNED',
      sourceModule: 'ACADEMIC_WORKLOAD',
      valueNumeric: count,
      valueDisplay: `${count} class-subject assignment(s)`,
      payload: { facultyUserId },
    },
  ];
}

async function collectLessonPlan(
  collegeId: number,
  facultyUserId: number | null,
): Promise<AppraisalEvidenceItem[]> {
  if (!facultyUserId || !(await db.schema.hasTable('faculty_lesson_plans'))) return [];
  const plans = await db('faculty_lesson_plans')
    .where({ college_id: collegeId, created_by: facultyUserId })
    .whereNot('status', 'ARCHIVED')
    .select('id', 'status');
  if (!plans.length) {
    return [
      {
        evidenceKey: 'LESSON_PLAN_COMPLETION',
        sourceModule: 'LESSON_PLAN',
        valueNumeric: null,
        valueDisplay: 'N/A',
        payload: { planCount: 0 },
      },
    ];
  }

  if (!(await db.schema.hasTable('lesson_plan_entries'))) {
    const published = plans.filter((p: Row) => ['PUBLISHED', 'ACTIVE', 'COMPLETED'].includes(String(p.status))).length;
    const pct = roundScore((published / plans.length) * 100);
    return [
      {
        evidenceKey: 'LESSON_PLAN_COMPLETION',
        sourceModule: 'LESSON_PLAN',
        valueNumeric: pct,
        valueDisplay: `${pct}%`,
        payload: { planCount: plans.length, publishedCount: published },
      },
    ];
  }

  let totalEntries = 0;
  let completedEntries = 0;
  for (const plan of plans) {
    const entries = await db('lesson_plan_entries').where({ plan_id: plan.id }).select('status');
    totalEntries += entries.length;
    completedEntries += entries.filter((e: Row) =>
      ['COMPLETED', 'DONE', 'TAUGHT'].includes(String(e.status).toUpperCase()),
    ).length;
  }
  const pct = totalEntries > 0 ? roundScore((completedEntries / totalEntries) * 100) : null;
  return [
    {
      evidenceKey: 'LESSON_PLAN_COMPLETION',
      sourceModule: 'LESSON_PLAN',
      valueNumeric: pct,
      valueDisplay: pct != null ? `${pct}%` : 'N/A',
      payload: { planCount: plans.length, totalEntries, completedEntries },
    },
  ];
}

/**
 * Aggregate anonymous faculty feedback only: averageRating + responseCount.
 * Never includes student identities or raw responses.
 */
async function collectSurveyFeedback(
  collegeId: number,
  facultyUserId: number | null,
  periodStart: string,
  periodEnd: string,
): Promise<AppraisalEvidenceItem[]> {
  if (!facultyUserId || !(await db.schema.hasTable('surveys'))) return [];
  if (!(await db.schema.hasTable('survey_submissions'))) return [];

  const surveys = await db('surveys')
    .where({
      college_id: collegeId,
      subject_faculty_id: facultyUserId,
      identity_mode: 'ANONYMOUS',
    })
    .whereNull('deleted_at')
    .select('id');

  if (!surveys.length) {
    return [
      {
        evidenceKey: 'SURVEY_FEEDBACK_AVG',
        sourceModule: 'SURVEY_FEEDBACK',
        valueNumeric: null,
        valueDisplay: 'N/A',
        payload: { responseCount: 0 },
      },
    ];
  }

  const surveyIds = surveys.map((s: Row) => Number(s.id));
  const submissions = await db('survey_submissions')
    .whereIn('survey_id', surveyIds)
    .andWhere({ status: 'COMPLETED' })
    .andWhere('submitted_at', '>=', `${periodStart.slice(0, 10)} 00:00:00`)
    .andWhere('submitted_at', '<=', `${periodEnd.slice(0, 10)} 23:59:59`)
    .select('id', 'survey_id');

  const responseCount = submissions.length;
  if (responseCount < SURVEY_MIN_RESPONSES) {
    return [
      {
        evidenceKey: 'SURVEY_FEEDBACK_AVG',
        sourceModule: 'SURVEY_FEEDBACK',
        valueNumeric: null,
        valueDisplay: 'Insufficient responses',
        payload: { responseCount },
      },
    ];
  }

  if (!(await db.schema.hasTable('survey_answers')) || !(await db.schema.hasTable('questions'))) {
    return [
      {
        evidenceKey: 'SURVEY_FEEDBACK_AVG',
        sourceModule: 'SURVEY_FEEDBACK',
        valueNumeric: null,
        valueDisplay: `${responseCount} responses`,
        payload: { responseCount },
      },
    ];
  }

  const submissionIds = submissions.map((s: Row) => Number(s.id));
  const ratingTypes = ['LIKERT', 'RATING', 'STAR_RATING', 'SMILE_RATING', 'NUMERICAL'];
  const questions = await db('questions').whereIn('survey_id', surveyIds).whereIn('question_type', ratingTypes).select('id');
  const questionIds = questions.map((q: Row) => Number(q.id));

  let averageRating: number | null = null;
  if (questionIds.length && submissionIds.length) {
    const avgRow = await db('survey_answers')
      .whereIn('submission_id', submissionIds)
      .whereIn('question_id', questionIds)
      .whereNotNull('numeric_answer')
      .avg({ avg: 'numeric_answer' })
      .first();
    if (avgRow?.avg != null) {
      averageRating = roundScore(Number(avgRow.avg));
    } else if (await db.schema.hasTable('question_options')) {
      // Fallback: option values for selected options (no student identity)
      const answers = await db('survey_answers as sa')
        .join('question_options as qo', 'qo.id', 'sa.selected_option_id')
        .whereIn('sa.submission_id', submissionIds)
        .whereIn('sa.question_id', questionIds)
        .whereNotNull('qo.value')
        .select('qo.value');
      if (answers.length) {
        const sum = answers.reduce((s: number, a: Row) => s + Number(a.value), 0);
        averageRating = roundScore(sum / answers.length);
      }
    }
  }

  return [
    {
      evidenceKey: 'SURVEY_FEEDBACK_AVG',
      sourceModule: 'SURVEY_FEEDBACK',
      valueNumeric: averageRating,
      valueDisplay:
        averageRating != null
          ? `${averageRating} (${responseCount} responses)`
          : `${responseCount} responses`,
      payload: { responseCount, averageRating },
    },
  ];
}

async function collectTp(
  collegeId: number,
  employeeId: number,
  periodStart: string,
  periodEnd: string,
): Promise<AppraisalEvidenceItem[]> {
  if (!(await db.schema.hasTable('tp_leadership_assignments'))) return [];
  const start = periodStart.slice(0, 10);
  const end = periodEnd.slice(0, 10);
  const rows = await db('tp_leadership_assignments')
    .where({ college_id: collegeId, employee_id: employeeId })
    .andWhere('effective_from', '<=', end)
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', start))
    .select('id', 'tp_role', 'status');

  if (!rows.length) return [];

  return [
    {
      evidenceKey: 'TP_COORDINATOR_ASSIGNMENT',
      sourceModule: 'TP',
      valueNumeric: rows.length,
      valueDisplay: `Active T&P role(s): ${rows.map((r: Row) => r.tp_role).join(', ')}`,
      payload: {
        assignmentCount: rows.length,
        roles: rows.map((r: Row) => r.tp_role),
      },
    },
  ];
}

/**
 * Collect read-only evidence from Attendance / Academic / Survey / T&P.
 * Does not invent RESULTS aggregates — returns N/A when no safe source exists.
 * Does not accept arbitrary client source IDs.
 */
export async function collectEvidenceForEmployee(
  collegeId: number,
  employeeId: number,
  periodStart: string,
  periodEnd: string,
  facultyUserId: number | null,
): Promise<AppraisalEvidenceItem[]> {
  const emp = await db('employees').where({ id: employeeId, college_id: collegeId }).first();
  if (!emp) throw new AppError(404, 'Employee not found');

  const linkedFaculty =
    facultyUserId ?? (emp.faculty_user_id != null ? Number(emp.faculty_user_id) : null);

  const [attendance, workload, lesson, survey, tp] = await Promise.all([
    collectAttendance(collegeId, employeeId, periodStart, periodEnd),
    collectAcademicWorkload(collegeId, linkedFaculty),
    collectLessonPlan(collegeId, linkedFaculty),
    collectSurveyFeedback(collegeId, linkedFaculty, periodStart, periodEnd),
    collectTp(collegeId, employeeId, periodStart, periodEnd),
  ]);

  // RESULTS: no safe college-scoped pass-% aggregate without inventing — skip with N/A marker.
  const results: AppraisalEvidenceItem[] = [
    {
      evidenceKey: 'RESULTS_PASS_PCT',
      sourceModule: 'RESULTS',
      valueNumeric: null,
      valueDisplay: 'N/A',
      payload: { reason: 'No safe aggregate available' },
    },
  ];

  return [...attendance, ...workload, ...lesson, ...results, ...survey, ...tp];
}

export async function snapshotEvidence(
  appraisalId: number,
  collegeId: number,
  employeeId: number,
  items: AppraisalEvidenceItem[],
  snapshotVersion: number,
): Promise<number> {
  if (!(await db.schema.hasTable('hr_appraisal_evidence_snapshots'))) {
    throw new AppError(503, 'Appraisal evidence schema not ready');
  }
  const now = new Date();
  const rows = items.map((item) => ({
    appraisal_id: appraisalId,
    college_id: collegeId,
    employee_id: employeeId,
    criterion_id: item.criterionId ?? null,
    source_module: item.sourceModule,
    evidence_key: item.evidenceKey,
    source_ref: item.sourceRef ?? null,
    source_period: item.sourcePeriod ?? null,
    value_numeric: item.valueNumeric ?? null,
    value_display: item.valueDisplay ?? null,
    payload: item.payload ? JSON.stringify(item.payload) : null,
    calculation_version: EVIDENCE_CALC_VERSION,
    snapshot_version: snapshotVersion,
    snapshot_at: now,
  }));

  if (rows.length) {
    await db('hr_appraisal_evidence_snapshots').insert(rows);
  }
  await db('hr_employee_appraisals').where({ id: appraisalId, college_id: collegeId }).update({
    evidence_snapshot_version: snapshotVersion,
    updated_at: db.fn.now(),
  });
  return snapshotVersion;
}

export async function getSnapshots(appraisalId: number) {
  if (!(await db.schema.hasTable('hr_appraisal_evidence_snapshots'))) return [];
  const rows = await db('hr_appraisal_evidence_snapshots')
    .where({ appraisal_id: appraisalId })
    .orderBy('snapshot_version', 'desc')
    .orderBy('id', 'asc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    appraisalId: Number(r.appraisal_id),
    collegeId: Number(r.college_id),
    employeeId: Number(r.employee_id),
    criterionId: r.criterion_id != null ? Number(r.criterion_id) : null,
    sourceModule: String(r.source_module),
    evidenceKey: String(r.evidence_key),
    sourceRef: (r.source_ref as string) ?? null,
    sourcePeriod: (r.source_period as string) ?? null,
    valueNumeric: r.value_numeric != null ? Number(r.value_numeric) : null,
    valueDisplay: (r.value_display as string) ?? null,
    payload:
      typeof r.payload === 'string'
        ? JSON.parse(r.payload)
        : (r.payload as Record<string, unknown> | null) ?? null,
    calculationVersion: String(r.calculation_version),
    snapshotVersion: Number(r.snapshot_version),
    snapshotAt: r.snapshot_at,
  }));
}
