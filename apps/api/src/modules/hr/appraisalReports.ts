/**
 * HRMS Performance & Appraisal reports — tenant-scoped; HOD filtered to hodDepartmentIds.
 */
import { db } from '../../db/index.js';
import type { HrActor, HrPermission } from './types.js';
import { assertHrPermission, hasHrPermission } from './access.js';

type Row = Record<string, unknown>;

const PERF_REPORT = 'hr.performance.report' as HrPermission;
const PERF_VIEW = 'hr.performance.view' as HrPermission;

function requireReportAccess(actor: HrActor) {
  if (hasHrPermission(actor, PERF_REPORT) || hasHrPermission(actor, PERF_VIEW)) return;
  assertHrPermission(actor, PERF_REPORT);
}

function hodDepartmentIds(actor: HrActor): number[] | null {
  if (hasHrPermission(actor, 'hr.performance.manage' as HrPermission)) return null;
  if (actor.role === 'PRINCIPAL' || (actor.leadershipRoles ?? []).includes('PRINCIPAL')) return null;
  const isHod = actor.role === 'HOD' || (actor.leadershipRoles ?? []).includes('HOD');
  if (!isHod) return null;
  if (actor.hodDepartmentIds?.length) return actor.hodDepartmentIds.map(Number);
  if (actor.departmentId != null) return [Number(actor.departmentId)];
  return [];
}

function applyDeptScope(
  q: import('knex').Knex.QueryBuilder,
  actor: HrActor,
  col = 'a.department_id',
) {
  const depts = hodDepartmentIds(actor);
  if (depts === null) return q;
  if (!depts.length) return q.whereRaw('1 = 0');
  return q.whereIn(col, depts);
}

function baseAppraisalQuery(actor: HrActor, cycleId?: number) {
  let q = db('hr_employee_appraisals as a').where({ 'a.college_id': actor.collegeId });
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  return applyDeptScope(q, actor);
}

export async function completionReport(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  const rows = await baseAppraisalQuery(actor, cycleId).select('a.status');
  const byStatus: Record<string, number> = {};
  for (const r of rows as Row[]) {
    const s = String(r.status);
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  const total = rows.length;
  const completed = (byStatus.FINALIZED ?? 0) + (byStatus.LOCKED ?? 0);
  const selfDone =
    (byStatus.SELF_SUBMITTED ?? 0) +
    (byStatus.REVIEW_IN_PROGRESS ?? 0) +
    (byStatus.REVIEW_SUBMITTED ?? 0) +
    (byStatus.CALIBRATION ?? 0) +
    completed;
  const reviewDone = (byStatus.REVIEW_SUBMITTED ?? 0) + (byStatus.CALIBRATION ?? 0) + completed;
  return {
    total,
    byStatus,
    completionPct: total ? Math.round((completed / total) * 1000) / 10 : 0,
    selfSubmitPct: total ? Math.round((selfDone / total) * 1000) / 10 : 0,
    reviewSubmitPct: total ? Math.round((reviewDone / total) * 1000) / 10 : 0,
  };
}

export async function ratingDistribution(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  const rows = await baseAppraisalQuery(actor, cycleId)
    .whereIn('a.status', ['FINALIZED', 'LOCKED', 'CALIBRATION'])
    .whereNotNull('a.final_rating_label')
    .select('a.final_rating_label', 'a.final_rating_value', 'a.final_score');

  const byLabel: Record<string, number> = {};
  for (const r of rows as Row[]) {
    const label = String(r.final_rating_label);
    byLabel[label] = (byLabel[label] ?? 0) + 1;
  }
  return {
    total: rows.length,
    byLabel,
    scores: (rows as Row[]).map((r) => ({
      label: r.final_rating_label,
      value: r.final_rating_value != null ? Number(r.final_rating_value) : null,
      score: r.final_score != null ? Number(r.final_score) : null,
    })),
  };
}

export async function departmentSummary(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  const rows = await baseAppraisalQuery(actor, cycleId)
    .leftJoin('departments as d', 'd.id', 'a.department_id')
    .select(
      'a.department_id',
      'd.name as department_name',
      'a.status',
      'a.final_score',
      'a.final_rating_label',
    );

  const map = new Map<
    string,
    {
      departmentId: number | null;
      departmentName: string | null;
      total: number;
      finalized: number;
      avgFinalScore: number | null;
      scoreSum: number;
      scoreCount: number;
    }
  >();

  for (const r of rows as Row[]) {
    const key = r.department_id != null ? String(r.department_id) : 'none';
    let entry = map.get(key);
    if (!entry) {
      entry = {
        departmentId: r.department_id != null ? Number(r.department_id) : null,
        departmentName: (r.department_name as string) ?? null,
        total: 0,
        finalized: 0,
        avgFinalScore: null,
        scoreSum: 0,
        scoreCount: 0,
      };
      map.set(key, entry);
    }
    entry.total += 1;
    if (['FINALIZED', 'LOCKED'].includes(String(r.status))) entry.finalized += 1;
    if (r.final_score != null) {
      entry.scoreSum += Number(r.final_score);
      entry.scoreCount += 1;
    }
  }

  return [...map.values()].map((e) => ({
    departmentId: e.departmentId,
    departmentName: e.departmentName,
    total: e.total,
    finalized: e.finalized,
    avgFinalScore: e.scoreCount ? Math.round((e.scoreSum / e.scoreCount) * 100) / 100 : null,
  }));
}

export async function goalCompletion(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  let q = db('hr_appraisal_goals as g')
    .join('hr_employee_appraisals as a', 'a.id', 'g.appraisal_id')
    .where({ 'g.college_id': actor.collegeId });
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  q = applyDeptScope(q, actor);

  const rows = await q.select('g.status', 'g.self_progress');
  const byStatus: Record<string, number> = {};
  let progressSum = 0;
  let progressCount = 0;
  for (const r of rows as Row[]) {
    const s = String(r.status);
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (r.self_progress != null) {
      progressSum += Number(r.self_progress);
      progressCount += 1;
    }
  }
  return {
    total: rows.length,
    byStatus,
    avgSelfProgress: progressCount ? Math.round((progressSum / progressCount) * 100) / 100 : null,
    approved: byStatus.APPROVED ?? 0,
    completed: byStatus.COMPLETED ?? 0,
    locked: byStatus.LOCKED ?? 0,
  };
}

export async function pendingReviews(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  let q = baseAppraisalQuery(actor, cycleId)
    .join('employees as e', 'e.id', 'a.employee_id')
    .leftJoin('employees as r', 'r.id', 'a.reviewer_employee_id')
    .whereIn('a.status', ['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS'])
    .select(
      'a.id',
      'a.status',
      'a.employee_id',
      'a.reviewer_employee_id',
      'a.department_id',
      'a.self_submitted_at',
      'e.display_name as employee_name',
      'e.employee_number',
      'r.display_name as reviewer_name',
    )
    .orderBy('a.self_submitted_at', 'asc');

  const rows = await q;
  return (rows as Row[]).map((r) => ({
    appraisalId: Number(r.id),
    status: r.status,
    employeeId: Number(r.employee_id),
    employeeName: r.employee_name,
    employeeNumber: r.employee_number,
    reviewerEmployeeId: r.reviewer_employee_id != null ? Number(r.reviewer_employee_id) : null,
    reviewerName: r.reviewer_name ?? null,
    departmentId: r.department_id != null ? Number(r.department_id) : null,
    selfSubmittedAt: r.self_submitted_at,
  }));
}

export async function calibrationChanges(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  let q = db('hr_appraisal_calibrations as c')
    .join('hr_employee_appraisals as a', 'a.id', 'c.appraisal_id')
    .join('employees as e', 'e.id', 'a.employee_id')
    .where({ 'c.college_id': actor.collegeId })
    .select(
      'c.id',
      'c.appraisal_id',
      'c.reviewer_score_before',
      'c.calibrated_score',
      'c.calibrated_rating_label',
      'c.reason',
      'c.actor_faculty_id',
      'c.created_at',
      'e.display_name as employee_name',
      'e.employee_number',
      'a.department_id',
      'a.cycle_id',
    )
    .orderBy('c.created_at', 'desc');
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  q = applyDeptScope(q, actor);

  const rows = await q;
  return (rows as Row[]).map((r) => {
    const before = r.reviewer_score_before != null ? Number(r.reviewer_score_before) : null;
    const after = Number(r.calibrated_score);
    return {
      id: Number(r.id),
      appraisalId: Number(r.appraisal_id),
      employeeName: r.employee_name,
      employeeNumber: r.employee_number,
      departmentId: r.department_id != null ? Number(r.department_id) : null,
      reviewerScoreBefore: before,
      calibratedScore: after,
      delta: before != null ? Math.round((after - before) * 100) / 100 : null,
      calibratedRatingLabel: r.calibrated_rating_label,
      reason: r.reason,
      actorFacultyId: r.actor_faculty_id != null ? Number(r.actor_faculty_id) : null,
      createdAt: r.created_at,
    };
  });
}

export async function developmentNeeds(actor: HrActor, cycleId?: number) {
  requireReportAccess(actor);
  let q = db('hr_appraisal_development_actions as da')
    .join('hr_appraisal_development_plans as p', 'p.id', 'da.plan_id')
    .join('hr_employee_appraisals as a', 'a.id', 'p.appraisal_id')
    .join('employees as e', 'e.id', 'a.employee_id')
    .where({ 'da.college_id': actor.collegeId })
    .select(
      'da.id',
      'da.development_area',
      'da.recommended_training',
      'da.target_competency',
      'da.status',
      'da.due_date',
      'p.appraisal_id',
      'e.display_name as employee_name',
      'e.employee_number',
      'a.department_id',
      'a.final_rating_label',
    )
    .orderBy('da.due_date', 'asc');
  if (cycleId) q = q.andWhere('a.cycle_id', cycleId);
  q = applyDeptScope(q, actor);

  const rows = await q;
  const byArea: Record<string, number> = {};
  for (const r of rows as Row[]) {
    const area = String(r.development_area);
    byArea[area] = (byArea[area] ?? 0) + 1;
  }

  return {
    total: rows.length,
    byArea,
    items: (rows as Row[]).map((r) => ({
      id: Number(r.id),
      appraisalId: Number(r.appraisal_id),
      employeeName: r.employee_name,
      employeeNumber: r.employee_number,
      departmentId: r.department_id != null ? Number(r.department_id) : null,
      developmentArea: r.development_area,
      recommendedTraining: r.recommended_training,
      targetCompetency: r.target_competency,
      status: r.status,
      dueDate: r.due_date,
      finalRatingLabel: r.final_rating_label,
    })),
  };
}
