/**
 * HR Analytics service — the single read/analysis layer over the frozen HR
 * domains. It NEVER mutates canonical records and NEVER re-owns transactional
 * semantics; it reads Employee Lifecycle, Attendance, Payroll, Recruitment,
 * Appraisal and Final Settlement and derives dashboards, trends and
 * reconciliation.
 *
 * All metric definitions, status sets and date semantics come from
 * ./analyticsCatalog so a metric is computed one way everywhere.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import ExcelJS from 'exceljs';
import { buildExportFilename } from '../../utils/filename.js';
import type { Knex } from 'knex';
import type { HrActor } from './types.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import * as payrollReports from './payrollReports.js';
import {
  IN_SERVICE_STATUSES,
  SEPARATED_STATUSES,
  PRE_SERVICE_STATUSES,
  FACULTY_CATEGORIES,
  TENURE_BANDS,
  MIN_GROUP_SIZE,
  resolveRange,
  monthsInRange,
  todayISO,
  assertDate,
  resolveAnalyticsScope,
  applyDepartmentFilter,
  isEmptyScope,
  getMetricCatalog,
  pct,
  round,
  toNum,
  type AnalyticsScope,
} from './analyticsCatalog.js';

// ── Common filter parsing / scoping ──────────────────────────────────────────
export type AnalyticsFilters = {
  from?: string;
  to?: string;
  asOf?: string;
  academicYear?: string;
  financialYear?: string;
  departmentId?: number | null;
  employmentTypeId?: number | null;
  employeeCategory?: string | null;
};

type ResolvedContext = {
  scope: AnalyticsScope;
  departmentIds: number[] | null;
  empty: boolean;
};

/** Resolve scope + apply an optional requested department filter. */
function contextFor(actor: HrActor, filters: AnalyticsFilters): ResolvedContext {
  const scope = resolveAnalyticsScope(actor);
  const departmentIds = applyDepartmentFilter(scope, filters.departmentId ?? null);
  return { scope, departmentIds, empty: isEmptyScope(departmentIds) };
}

/** Base employees query scoped to college + (optional) departments + filters. */
function employeesBase(
  collegeId: number,
  departmentIds: number[] | null,
  filters?: AnalyticsFilters,
): Knex.QueryBuilder {
  let q = db('employees as e').where('e.college_id', collegeId);
  if (departmentIds) q = q.whereIn('e.department_id', departmentIds);
  if (filters?.employmentTypeId) q = q.where('e.employment_type_id', filters.employmentTypeId);
  if (filters?.employeeCategory) q = q.where('e.employee_category', filters.employeeCategory);
  return q;
}

// ── Metric catalog passthrough ───────────────────────────────────────────────
export function metricCatalog(actor: HrActor) {
  assertHrPermission(actor, 'hr.analytics.view');
  return { metrics: getMetricCatalog() };
}

// ── Workforce: headcount ─────────────────────────────────────────────────────
/** Current in-service headcount as of a date, with breakdowns. */
export async function currentHeadcount(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const asOf = assertDate(filters.asOf ?? todayISO(), 'asOf');
  if (ctx.empty) return emptyHeadcount(asOf);

  const scoped = () =>
    employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
      .whereIn('e.employment_status', IN_SERVICE_STATUSES as unknown as string[])
      .whereNotNull('e.date_of_joining')
      .where('e.date_of_joining', '<=', asOf);

  const [total, byDept, byDesignation, byType, byCategory] = await Promise.all([
    scoped().count<{ c: number }>('e.id as c').first(),
    scoped()
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .groupBy('e.department_id', 'd.name')
      .select('e.department_id as departmentId', 'd.name as department')
      .count('e.id as count'),
    scoped()
      .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
      .groupBy('e.designation_id', 'des.name')
      .select('des.name as designation')
      .count('e.id as count'),
    scoped()
      .leftJoin('employment_types as et', 'et.id', 'e.employment_type_id')
      .groupBy('e.employment_type_id', 'et.name')
      .select('et.name as employmentType')
      .count('e.id as count'),
    scoped().groupBy('e.employee_category').select('e.employee_category as category').count('e.id as count'),
  ]);

  const facultyCount = await scoped()
    .whereIn('e.employee_category', FACULTY_CATEGORIES as unknown as string[])
    .count<{ c: number }>('e.id as c')
    .first();

  const totalN = toNum(total?.c);
  const facultyN = toNum(facultyCount?.c);
  return {
    asOf,
    total: totalN,
    facultyStaffMix: { faculty: facultyN, staff: totalN - facultyN },
    byDepartment: normalizeGroups(byDept, 'department'),
    byDesignation: normalizeGroups(byDesignation, 'designation'),
    byEmploymentType: normalizeGroups(byType, 'employmentType'),
    byCategory: normalizeGroups(byCategory, 'category'),
  };
}

function emptyHeadcount(asOf: string) {
  return {
    asOf,
    total: 0,
    facultyStaffMix: { faculty: 0, staff: 0 },
    byDepartment: [],
    byDesignation: [],
    byEmploymentType: [],
    byCategory: [],
  };
}

function normalizeGroups(rows: Array<Record<string, unknown>>, labelKey: string) {
  return rows.map((r) => ({
    label: (r[labelKey] as string) ?? 'Unassigned',
    departmentId: r.departmentId != null ? Number(r.departmentId) : undefined,
    count: toNum(r.count),
  }));
}

/**
 * Historical in-service headcount as of a past date, derived purely from
 * effective employment dates — joined on/before the date and not yet separated
 * as of the date. Never inferred from today's active list.
 */
async function historicalHeadcountAsOf(
  collegeId: number,
  departmentIds: number[] | null,
  asOf: string,
  filters?: AnalyticsFilters,
): Promise<number> {
  if (isEmptyScope(departmentIds)) return 0;
  const row = await employeesBase(collegeId, departmentIds, filters)
    .whereNotNull('e.date_of_joining')
    .where('e.date_of_joining', '<=', asOf)
    .whereNotIn('e.employment_status', PRE_SERVICE_STATUSES as unknown as string[])
    .where((qb) => {
      qb.whereNull('e.last_working_date').orWhere('e.last_working_date', '>', asOf);
    })
    .count<{ c: number }>('e.id as c')
    .first();
  return toNum(row?.c);
}

export async function historicalHeadcount(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const asOf = assertDate(filters.asOf ?? todayISO(), 'asOf');
  const total = await historicalHeadcountAsOf(ctx.scope.collegeId, ctx.departmentIds, asOf, filters);
  return { asOf, total, basis: 'effective-employment-dates' };
}

// ── Workforce: joiners / separations / trends ────────────────────────────────
export async function joinersTrend(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, total: 0, byMonth: [], byDepartment: [] };

  const base = () =>
    employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
      .whereNotNull('e.date_of_joining')
      .whereBetween('e.date_of_joining', [from, to]);

  const [rows, byDept, total] = await Promise.all([
    base()
      .select(db.raw('DATE_FORMAT(e.date_of_joining, "%Y-%m") as ym'))
      .count('e.id as count')
      .groupBy('ym'),
    base()
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .groupBy('e.department_id', 'd.name')
      .select('e.department_id as departmentId', 'd.name as department')
      .count('e.id as count'),
    base().count<{ c: number }>('e.id as c').first(),
  ]);

  return {
    from,
    to,
    basis,
    total: toNum(total?.c),
    byMonth: fillMonths(from, to, rows as Array<Record<string, unknown>>),
    byDepartment: normalizeGroups(byDept as Array<Record<string, unknown>>, 'department'),
  };
}

export async function separationsTrend(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, total: 0, byMonth: [], byType: [], byDepartment: [] };

  // Canonical separations: COMPLETED separation requests, dated by last working day.
  const base = () => {
    let q = db('employee_separation_requests as sr')
      .join('employees as e', 'e.id', 'sr.employee_id')
      .where('sr.college_id', ctx.scope.collegeId)
      .where('sr.status', 'COMPLETED')
      .whereNotNull('sr.last_working_date')
      .whereBetween('sr.last_working_date', [from, to]);
    if (ctx.departmentIds) q = q.whereIn('e.department_id', ctx.departmentIds);
    if (filters.employmentTypeId) q = q.where('e.employment_type_id', filters.employmentTypeId);
    if (filters.employeeCategory) q = q.where('e.employee_category', filters.employeeCategory);
    return q;
  };

  const [rows, byType, byDept, total] = await Promise.all([
    base().select(db.raw('DATE_FORMAT(sr.last_working_date, "%Y-%m") as ym')).count('sr.id as count').groupBy('ym'),
    base().groupBy('sr.separation_type').select('sr.separation_type as type').count('sr.id as count'),
    base()
      .leftJoin('departments as d', 'd.id', 'e.department_id')
      .groupBy('e.department_id', 'd.name')
      .select('e.department_id as departmentId', 'd.name as department')
      .count('sr.id as count'),
    base().count<{ c: number }>('sr.id as c').first(),
  ]);

  return {
    from,
    to,
    basis,
    total: toNum(total?.c),
    byMonth: fillMonths(from, to, rows as Array<Record<string, unknown>>),
    byType: (byType as Array<Record<string, unknown>>).map((r) => ({ label: (r.type as string) ?? 'OTHER', count: toNum(r.count) })),
    byDepartment: normalizeGroups(byDept as Array<Record<string, unknown>>, 'department'),
  };
}

function fillMonths(from: string, to: string, rows: Array<Record<string, unknown>>) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r.ym), toNum(r.count));
  return monthsInRange(from, to).map((m) => ({ month: m.key, count: map.get(m.key) ?? 0 }));
}

// ── Workforce: attrition / retention / tenure ────────────────────────────────
export async function attrition(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, separations: 0, avgHeadcount: 0, attritionRate: 0, definition: 'separations / average headcount * 100' };

  const startHc = await historicalHeadcountAsOf(ctx.scope.collegeId, ctx.departmentIds, from, filters);
  const endHc = await historicalHeadcountAsOf(ctx.scope.collegeId, ctx.departmentIds, to, filters);
  const avgHeadcount = (startHc + endHc) / 2;

  let sep = db('employee_separation_requests as sr')
    .join('employees as e', 'e.id', 'sr.employee_id')
    .where('sr.college_id', ctx.scope.collegeId)
    .where('sr.status', 'COMPLETED')
    .whereNotNull('sr.last_working_date')
    .whereBetween('sr.last_working_date', [from, to]);
  if (ctx.departmentIds) sep = sep.whereIn('e.department_id', ctx.departmentIds);
  if (filters.employmentTypeId) sep = sep.where('e.employment_type_id', filters.employmentTypeId);
  if (filters.employeeCategory) sep = sep.where('e.employee_category', filters.employeeCategory);
  const sepRow = await sep.count<{ c: number }>('sr.id as c').first();
  const separations = toNum(sepRow?.c);

  return {
    from,
    to,
    basis,
    separations,
    headcountStart: startHc,
    headcountEnd: endHc,
    avgHeadcount: round(avgHeadcount, 2),
    attritionRate: pct(separations, avgHeadcount, 2),
    definition: 'separations during period / average headcount (start+end)/2 * 100',
  };
}

export async function retention(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, baseAtStart: 0, retained: 0, retentionRate: 0, definition: 'retained / in-service at start * 100' };

  // In service at start: joined on/before `from`, not separated as of `from`.
  const inServiceAtStart = () =>
    employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
      .whereNotNull('e.date_of_joining')
      .where('e.date_of_joining', '<=', from)
      .whereNotIn('e.employment_status', PRE_SERVICE_STATUSES as unknown as string[])
      .where((qb) => qb.whereNull('e.last_working_date').orWhere('e.last_working_date', '>', from));

  const baseRow = await inServiceAtStart().count<{ c: number }>('e.id as c').first();
  const retainedRow = await inServiceAtStart()
    .where((qb) => qb.whereNull('e.last_working_date').orWhere('e.last_working_date', '>', to))
    .count<{ c: number }>('e.id as c')
    .first();

  const baseAtStart = toNum(baseRow?.c);
  const retained = toNum(retainedRow?.c);
  return {
    from,
    to,
    basis,
    baseAtStart,
    retained,
    retentionRate: pct(retained, baseAtStart, 2),
    definition: 'employees in service at start still in service at end / in service at start * 100',
  };
}

export async function tenureBands(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const asOf = assertDate(filters.asOf ?? todayISO(), 'asOf');
  if (ctx.empty) return { asOf, bands: TENURE_BANDS.map((b) => ({ key: b.key, label: b.label, count: 0 })) };

  const rows = await employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
    .whereIn('e.employment_status', IN_SERVICE_STATUSES as unknown as string[])
    .whereNotNull('e.date_of_joining')
    .where('e.date_of_joining', '<=', asOf)
    .select(db.raw('TIMESTAMPDIFF(YEAR, e.date_of_joining, ?) as years', [asOf]))
    .then((r: Array<{ years: number }>) => r);

  const counts = TENURE_BANDS.map((b) => ({ key: b.key, label: b.label, count: 0 }));
  for (const r of rows) {
    const y = toNum(r.years);
    const idx = TENURE_BANDS.findIndex((b) => y >= b.minYears && (b.maxYears === null || y < b.maxYears));
    if (idx >= 0) counts[idx].count += 1;
  }
  return { asOf, bands: counts };
}

/** Department workforce distribution: headcount + faculty/staff + joiners/separations. */
export async function departmentDistribution(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to } = resolveRange(filters);
  const asOf = assertDate(filters.asOf ?? todayISO(), 'asOf');
  if (ctx.empty) return { asOf, from, to, departments: [] };

  const hc = await employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .whereIn('e.employment_status', IN_SERVICE_STATUSES as unknown as string[])
    .whereNotNull('e.date_of_joining')
    .where('e.date_of_joining', '<=', asOf)
    .groupBy('e.department_id', 'd.name')
    .select(
      'e.department_id as departmentId',
      'd.name as department',
      db.raw('count(*) as headcount'),
      db.raw(`sum(case when e.employee_category = 'FACULTY' then 1 else 0 end) as faculty`),
    );

  const joiners = await employeesBase(ctx.scope.collegeId, ctx.departmentIds, filters)
    .whereBetween('e.date_of_joining', [from, to])
    .groupBy('e.department_id')
    .select('e.department_id as departmentId')
    .count('e.id as count');

  let sepQ = db('employee_separation_requests as sr')
    .join('employees as e', 'e.id', 'sr.employee_id')
    .where('sr.college_id', ctx.scope.collegeId)
    .where('sr.status', 'COMPLETED')
    .whereBetween('sr.last_working_date', [from, to]);
  if (ctx.departmentIds) sepQ = sepQ.whereIn('e.department_id', ctx.departmentIds);
  const seps = await sepQ.groupBy('e.department_id').select('e.department_id as departmentId').count('sr.id as count');

  const joinMap = new Map<number, number>();
  for (const r of joiners as Array<Record<string, unknown>>) joinMap.set(Number(r.departmentId), toNum(r.count));
  const sepMap = new Map<number, number>();
  for (const r of seps as Array<Record<string, unknown>>) sepMap.set(Number(r.departmentId), toNum(r.count));

  return {
    asOf,
    from,
    to,
    departments: (hc as Array<Record<string, unknown>>).map((r) => {
      const id = r.departmentId != null ? Number(r.departmentId) : 0;
      const headcount = toNum(r.headcount);
      const faculty = toNum(r.faculty);
      return {
        departmentId: id || undefined,
        department: (r.department as string) ?? 'Unassigned',
        headcount,
        faculty,
        staff: headcount - faculty,
        joiners: joinMap.get(id) ?? 0,
        separations: sepMap.get(id) ?? 0,
      };
    }),
  };
}

/** Internal workforce movement from canonical career actions. */
export async function workforceMovement(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, byType: [] };

  let q = db('employee_career_actions as ca')
    .join('employees as e', 'e.id', 'ca.employee_id')
    .where('ca.college_id', ctx.scope.collegeId)
    .where('ca.status', 'APPLIED')
    .whereBetween('ca.effective_date', [from, to]);
  if (ctx.departmentIds) q = q.whereIn('e.department_id', ctx.departmentIds);
  const rows = await q.groupBy('ca.action_type').select('ca.action_type as type').count('ca.id as count');

  return {
    from,
    to,
    basis,
    byType: (rows as Array<Record<string, unknown>>).map((r) => ({ label: (r.type as string) ?? 'OTHER', count: toNum(r.count) })),
  };
}

// ── Attendance & Leave ───────────────────────────────────────────────────────
export async function attendanceTrend(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.attendance.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, byMonth: [] };

  let q = db('employee_monthly_attendance as ma')
    .join('employees as e', 'e.id', 'ma.employee_id')
    .where('ma.college_id', ctx.scope.collegeId)
    .whereRaw('STR_TO_DATE(CONCAT(ma.year,"-",LPAD(ma.month,2,"0"),"-01"), "%Y-%m-%d") BETWEEN ? AND ?', [
      `${from.slice(0, 7)}-01`,
      `${to.slice(0, 7)}-01`,
    ]);
  if (ctx.departmentIds) q = q.whereIn('e.department_id', ctx.departmentIds);
  if (filters.employmentTypeId) q = q.where('e.employment_type_id', filters.employmentTypeId);
  if (filters.employeeCategory) q = q.where('e.employee_category', filters.employeeCategory);

  const rows = await q
    .groupBy('ma.year', 'ma.month')
    .orderBy('ma.year')
    .orderBy('ma.month')
    .select(
      'ma.year',
      'ma.month',
      db.raw('sum(ma.present_days) as present'),
      db.raw('sum(ma.payable_days) as payable'),
      db.raw('sum(ma.absence_days) as absence'),
      db.raw('sum(ma.lop_days) as lop'),
      db.raw('sum(ma.paid_leave_days + ma.unpaid_leave_days) as leave_days'),
      db.raw('count(distinct ma.employee_id) as employees'),
    );

  return {
    from,
    to,
    basis,
    byMonth: (rows as Array<Record<string, unknown>>).map((r) => {
      const present = toNum(r.present);
      const payable = toNum(r.payable);
      return {
        month: `${r.year}-${String(r.month).padStart(2, '0')}`,
        present: round(present, 2),
        payable: round(payable, 2),
        absence: round(toNum(r.absence), 2),
        lopDays: round(toNum(r.lop), 2),
        leaveDays: round(toNum(r.leave_days), 2),
        employees: toNum(r.employees),
        attendanceRate: pct(present, payable, 2),
      };
    }),
  };
}

export async function leaveUtilisation(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.leave.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, byType: [], totalApprovedDays: 0, pending: 0 };

  let q = db('hr_leave_requests as lr')
    .join('employees as e', 'e.id', 'lr.employee_id')
    .leftJoin('hr_leave_types as lt', 'lt.id', 'lr.leave_type_id')
    .where('lr.college_id', ctx.scope.collegeId)
    .whereIn('lr.status', ['APPROVED', 'COMPLETED'])
    .whereBetween('lr.from_date', [from, to]);
  if (ctx.departmentIds) q = q.whereIn('e.department_id', ctx.departmentIds);

  const byType = await q
    .clone()
    .groupBy('lr.leave_type_id', 'lt.name', 'lt.is_paid')
    .select('lt.name as leaveType', 'lt.is_paid as isPaid')
    .sum('lr.requested_days as days')
    .count('lr.id as requests');

  // Pending approvals (aggregate only — no reasons surfaced).
  let pq = db('hr_leave_requests as lr')
    .join('employees as e', 'e.id', 'lr.employee_id')
    .where('lr.college_id', ctx.scope.collegeId)
    .whereIn('lr.status', ['SUBMITTED', 'COVERAGE_PENDING', 'UNDER_APPROVAL', 'ACTION_REQUIRED']);
  if (ctx.departmentIds) pq = pq.whereIn('e.department_id', ctx.departmentIds);
  const pending = await pq.count<{ c: number }>('lr.id as c').first();

  const typeRows = (byType as Array<Record<string, unknown>>).map((r) => ({
    leaveType: (r.leaveType as string) ?? 'Unspecified',
    isPaid: Boolean(r.isPaid),
    days: round(toNum(r.days), 2),
    requests: toNum(r.requests),
  }));
  return {
    from,
    to,
    basis,
    byType: typeRows,
    totalApprovedDays: round(typeRows.reduce((s, r) => s + r.days, 0), 2),
    pending: toNum(pending?.c),
  };
}

// ── Payroll (sensitive — aggregate/detail split) ─────────────────────────────
export async function payrollCostTrend(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.payroll.aggregate');
  const collegeId = actor.collegeId;
  const { from, to, basis } = resolveRange(filters);

  const runs = await db('payroll_runs as r')
    .join('payroll_periods as p', 'p.id', 'r.period_id')
    .where('r.college_id', collegeId)
    .whereIn('r.status', ['APPROVED', 'LOCKED', 'POSTED'])
    .whereBetween('p.end_date', [from, to])
    .orderBy('p.end_date')
    .select(
      'r.id as runId',
      'p.label as period',
      'p.end_date as endDate',
      'r.gross_total as gross',
      'r.deduction_total as deduction',
      'r.net_total as net',
      'r.lop_days_total as lopDays',
      'r.employee_count as employees',
      'r.status',
    );

  const byPeriod = (runs as Array<Record<string, unknown>>).map((r) => ({
    runId: Number(r.runId),
    period: r.period as string,
    endDate: r.endDate,
    gross: toNum(r.gross),
    deduction: toNum(r.deduction),
    net: toNum(r.net),
    lopDays: toNum(r.lopDays),
    employees: toNum(r.employees),
    status: r.status as string,
  }));

  const totals = byPeriod.reduce(
    (a, r) => ({ gross: a.gross + r.gross, deduction: a.deduction + r.deduction, net: a.net + r.net, lopDays: a.lopDays + r.lopDays }),
    { gross: 0, deduction: 0, net: 0, lopDays: 0 },
  );

  return {
    from,
    to,
    basis,
    byPeriod,
    totals: {
      gross: round(totals.gross, 2),
      deduction: round(totals.deduction, 2),
      net: round(totals.net, 2),
      lopDays: round(totals.lopDays, 2),
    },
    note: 'Totals sourced from locked/approved payroll runs; never recalculated.',
  };
}

/**
 * Department-level payroll cost aggregate, with small-group suppression to
 * prevent trivial inference of an individual's salary.
 */
export async function payrollByDepartment(actor: HrActor, payrollRunId: number) {
  assertHrPermission(actor, 'hr.analytics.payroll.aggregate');
  const run = await db('payroll_runs').where({ id: payrollRunId, college_id: actor.collegeId }).first();
  if (!run) throw new AppError(404, 'Payroll run not found');
  const canSeeDetail = hasHrPermission(actor, 'hr.analytics.payroll.detail');

  const rows = await db('payroll_run_employees as pre')
    .join('employees as e', 'e.id', 'pre.employee_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .where('pre.payroll_run_id', payrollRunId)
    .groupBy('e.department_id', 'd.name')
    .select(
      'e.department_id as departmentId',
      'd.name as department',
      db.raw('count(*) as employees'),
      db.raw('sum(pre.gross_amount) as gross'),
      db.raw('sum(pre.deduction_amount) as deduction'),
      db.raw('sum(pre.net_amount) as net'),
    );

  return {
    payrollRunId,
    departments: (rows as Array<Record<string, unknown>>).map((r) => {
      const employees = toNum(r.employees);
      const suppressed = !canSeeDetail && employees > 0 && employees < MIN_GROUP_SIZE;
      return {
        departmentId: r.departmentId != null ? Number(r.departmentId) : undefined,
        department: (r.department as string) ?? 'Unassigned',
        employees,
        gross: suppressed ? null : toNum(r.gross),
        deduction: suppressed ? null : toNum(r.deduction),
        net: suppressed ? null : toNum(r.net),
        suppressed,
        suppressionReason: suppressed ? `Group smaller than ${MIN_GROUP_SIZE}` : undefined,
      };
    }),
    minGroupSize: MIN_GROUP_SIZE,
  };
}

export async function payrollVariance(actor: HrActor, payrollRunId: number) {
  assertHrPermission(actor, 'hr.analytics.payroll.aggregate');
  // Delegate to Payroll's own variance engine — analytics never re-derives it.
  return payrollReports.payrollVarianceReport(actor, payrollRunId);
}

// ── Recruitment ──────────────────────────────────────────────────────────────
const FUNNEL_STAGES: Array<{ key: string; statuses: string[] }> = [
  { key: 'applied', statuses: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'screened', statuses: ['SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'shortlisted', statuses: ['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'interviewed', statuses: ['INTERVIEW', 'SELECTED', 'OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'selected', statuses: ['SELECTED', 'OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'offered', statuses: ['OFFERED', 'ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'accepted', statuses: ['ACCEPTED', 'PRE_JOINING', 'JOINED'] },
  { key: 'joined', statuses: ['JOINED'] },
];

export async function recruitmentFunnel(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.recruitment.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, stages: FUNNEL_STAGES.map((s) => ({ stage: s.key, count: 0 })) };

  // Each application belongs to a candidate; count distinct applications reaching
  // each stage (an application is counted once, at its furthest stage).
  const base = () => {
    let q = db('hr_recruitment_applications as a')
      .join('hr_job_openings as o', 'o.id', 'a.opening_id')
      .where('a.college_id', ctx.scope.collegeId)
      .whereBetween('a.created_at', [`${from} 00:00:00`, `${to} 23:59:59`]);
    if (ctx.departmentIds) q = q.whereIn('o.department_id', ctx.departmentIds);
    return q;
  };

  const stages = await Promise.all(
    FUNNEL_STAGES.map(async (s) => {
      const row = await base().whereIn('a.status', s.statuses).count<{ c: number }>('a.id as c').first();
      return { stage: s.key, count: toNum(row?.c) };
    }),
  );
  return { from, to, basis, stages };
}

export async function timeToFill(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.recruitment.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, filled: 0, avgDays: null as number | null };

  // Requisition approval → actual Lifecycle joining (joined_at on the application,
  // which is set only when Recruitment converts to an employee).
  let q = db('hr_recruitment_applications as a')
    .join('hr_job_openings as o', 'o.id', 'a.opening_id')
    .join('hr_recruitment_requisitions as rq', 'rq.id', 'o.requisition_id')
    .where('a.college_id', ctx.scope.collegeId)
    .whereNotNull('a.joined_at')
    .whereNotNull('a.employee_id')
    .whereNotNull('rq.approved_at')
    .whereRaw('DATE(a.joined_at) BETWEEN ? AND ?', [from, to]);
  if (ctx.departmentIds) q = q.whereIn('o.department_id', ctx.departmentIds);

  const row = await q
    .select(
      db.raw('count(*) as filled'),
      db.raw('avg(datediff(a.joined_at, rq.approved_at)) as avg_days'),
    )
    .first();

  const filled = toNum((row as Record<string, unknown>)?.filled);
  const avg = (row as Record<string, unknown>)?.avg_days;
  return {
    from,
    to,
    basis,
    filled,
    avgDays: avg == null ? null : round(toNum(avg), 1),
    definition: 'avg(days from requisition.approved_at to application.joined_at) for joins in period',
  };
}

export async function offerAcceptance(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.recruitment.view');
  const ctx = contextFor(actor, filters);
  const { from, to, basis } = resolveRange(filters);
  if (ctx.empty) return { from, to, basis, issued: 0, accepted: 0, declined: 0, expired: 0, acceptanceRate: 0 };

  // Consider only the latest (highest version) offer per application to avoid
  // double-counting superseded offer versions.
  let q = db('hr_recruitment_offers as of')
    .join('hr_job_openings as o', 'o.id', 'of.opening_id')
    .where('of.college_id', ctx.scope.collegeId)
    .whereNotNull('of.issued_at')
    .whereRaw('DATE(of.issued_at) BETWEEN ? AND ?', [from, to])
    // latest version per application
    .whereNotExists(function () {
      this.select('*')
        .from('hr_recruitment_offers as of2')
        .whereRaw('of2.application_id = of.application_id')
        .whereRaw('of2.version_no > of.version_no');
    });
  if (ctx.departmentIds) q = q.whereIn('o.department_id', ctx.departmentIds);

  const rows = await q.groupBy('of.status').select('of.status').count('of.id as count');
  const map = new Map<string, number>();
  for (const r of rows as Array<Record<string, unknown>>) map.set(String(r.status), toNum(r.count));
  const accepted = (map.get('ACCEPTED') ?? 0) + (map.get('OFFER_ACCEPTED') ?? 0);
  const declined = (map.get('DECLINED') ?? 0) + (map.get('OFFER_DECLINED') ?? 0);
  const expired = (map.get('EXPIRED') ?? 0) + (map.get('OFFER_EXPIRED') ?? 0);
  const decided = accepted + declined + expired;
  const issued = [...map.values()].reduce((a, b) => a + b, 0);
  return {
    from,
    to,
    basis,
    issued,
    accepted,
    declined,
    expired,
    acceptanceRate: pct(accepted, decided, 2),
    definition: 'accepted / (accepted + declined + expired) * 100 over latest offer per application',
  };
}

/** Approved open positions (vacancy) vs published openings. */
export async function vacancyOverview(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.recruitment.view');
  const ctx = contextFor(actor, filters);
  if (ctx.empty) return { approvedOpenPositions: 0, publishedOpenings: 0 };

  let rq = db('hr_recruitment_requisitions as rq').where('rq.college_id', ctx.scope.collegeId).whereIn('rq.status', ['APPROVED', 'OPENED']);
  if (ctx.departmentIds) rq = rq.whereIn('rq.department_id', ctx.departmentIds);
  const approved = await rq.sum<{ s: number }>(db.raw('COALESCE(rq.approved_headcount, rq.requested_headcount)') as unknown as string).first();

  let op = db('hr_job_openings as o').where('o.college_id', ctx.scope.collegeId).where('o.status', 'PUBLISHED');
  if (ctx.departmentIds) op = op.whereIn('o.department_id', ctx.departmentIds);
  const openings = await op.count<{ c: number }>('o.id as c').first();

  return {
    approvedOpenPositions: toNum((approved as Record<string, unknown>)?.s),
    publishedOpenings: toNum(openings?.c),
    note: 'Approved open positions reflect recruitment requisitions, not a full position-control system.',
  };
}

// ── Performance / Appraisal ──────────────────────────────────────────────────
export async function performanceCompletion(actor: HrActor, cycleId: number | undefined, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.performance.view');
  const ctx = contextFor(actor, filters);
  if (ctx.empty) return { cycleId: cycleId ?? null, total: 0, selfSubmitted: 0, reviewed: 0, finalized: 0 };

  let q = db('hr_employee_appraisals as a').where('a.college_id', ctx.scope.collegeId).whereNull('a.parent_appraisal_id');
  if (cycleId) q = q.where('a.cycle_id', cycleId);
  if (ctx.departmentIds) q = q.whereIn('a.department_id', ctx.departmentIds);

  const row = await q
    .select(
      db.raw('count(*) as total'),
      db.raw('sum(case when a.self_submitted_at is not null then 1 else 0 end) as self_submitted'),
      db.raw('sum(case when a.review_submitted_at is not null then 1 else 0 end) as reviewed'),
      db.raw('sum(case when a.finalized_at is not null then 1 else 0 end) as finalized'),
    )
    .first();

  const r = row as Record<string, unknown>;
  const total = toNum(r?.total);
  return {
    cycleId: cycleId ?? null,
    total,
    selfSubmitted: toNum(r?.self_submitted),
    reviewed: toNum(r?.reviewed),
    finalized: toNum(r?.finalized),
    completionRate: pct(toNum(r?.finalized), total, 2),
  };
}

export async function ratingDistribution(actor: HrActor, cycleId: number | undefined, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.performance.view');
  const ctx = contextFor(actor, filters);
  if (ctx.empty) return { cycleId: cycleId ?? null, buckets: [], suppressed: false };

  let q = db('hr_employee_appraisals as a')
    .where('a.college_id', ctx.scope.collegeId)
    .whereNull('a.parent_appraisal_id')
    .whereNotNull('a.finalized_at'); // FINALIZED ratings only
  if (cycleId) q = q.where('a.cycle_id', cycleId);
  if (ctx.departmentIds) q = q.whereIn('a.department_id', ctx.departmentIds);

  const rows = await q.groupBy('a.final_rating_label').select('a.final_rating_label as label').count('a.id as count');
  const total = (rows as Array<Record<string, unknown>>).reduce((s, r) => s + toNum(r.count), 0);
  // Suppress the whole distribution if too few finalized ratings to protect individuals.
  const suppressed = total > 0 && total < MIN_GROUP_SIZE;
  return {
    cycleId: cycleId ?? null,
    total,
    suppressed,
    minGroupSize: MIN_GROUP_SIZE,
    buckets: suppressed
      ? []
      : (rows as Array<Record<string, unknown>>).map((r) => ({ label: (r.label as string) ?? 'Unrated', count: toNum(r.count) })),
  };
}

// ── Final Settlement (F&F) ───────────────────────────────────────────────────
export async function fnfAnalytics(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.fnf.view');
  const ctx = contextFor(actor, filters);
  if (ctx.empty) return { pending: 0, settled: 0, byStatus: [], payableTotal: 0, receivableTotal: 0 };

  let q = db('hr_final_settlements as s').join('employees as e', 'e.id', 's.employee_id').where('s.college_id', ctx.scope.collegeId);
  if (ctx.departmentIds) q = q.whereIn('e.department_id', ctx.departmentIds);

  const byStatus = await q.clone().groupBy('s.status').select('s.status').count('s.id as count');
  // Payable to employee (net_amount > 0) vs receivable from employee (net_amount < 0).
  const totals = await q
    .clone()
    .select(
      db.raw('sum(case when s.net_amount > 0 then s.net_amount else 0 end) as payable'),
      db.raw('sum(case when s.net_amount < 0 then -s.net_amount else 0 end) as receivable'),
    )
    .first();

  const statusRows = (byStatus as Array<Record<string, unknown>>).map((r) => ({ status: String(r.status), count: toNum(r.count) }));
  const settledStatuses = new Set(['SETTLED', 'CLOSED']);
  const pending = statusRows.filter((r) => !settledStatuses.has(r.status) && r.status !== 'CANCELLED').reduce((s, r) => s + r.count, 0);
  const settled = statusRows.filter((r) => settledStatuses.has(r.status)).reduce((s, r) => s + r.count, 0);

  return {
    pending,
    settled,
    byStatus: statusRows,
    payableTotal: round(toNum((totals as Record<string, unknown>)?.payable), 2),
    receivableTotal: round(toNum((totals as Record<string, unknown>)?.receivable), 2),
    note: 'Amounts and case states sourced from canonical Final Settlement; never recalculated.',
  };
}

// ── Cross-domain reconciliation ──────────────────────────────────────────────
export async function reconciliation(actor: HrActor) {
  assertHrPermission(actor, 'hr.analytics.view');
  const collegeId = actor.collegeId;

  const [recruitJoined, recruitJoinedLinked, fnfOrphans, apprInService, apprEmployees] = await Promise.all([
    db('hr_recruitment_applications').where({ college_id: collegeId, status: 'JOINED' }).count<{ c: number }>('id as c').first(),
    db('hr_recruitment_applications').where({ college_id: collegeId, status: 'JOINED' }).whereNotNull('employee_id').whereNotNull('joined_at').count<{ c: number }>('id as c').first(),
    // F&F cases whose separation_request_id has no matching canonical separation request.
    db('hr_final_settlements as s')
      .where('s.college_id', collegeId)
      .whereNotNull('s.separation_request_id')
      .whereNotExists(function () {
        this.select('*').from('employee_separation_requests as sr').whereRaw('sr.id = s.separation_request_id');
      })
      .count<{ c: number }>('s.id as c')
      .first(),
    db('employees').where({ college_id: collegeId }).whereIn('employment_status', IN_SERVICE_STATUSES as unknown as string[]).count<{ c: number }>('id as c').first(),
    db('hr_employee_appraisals').where({ college_id: collegeId }).whereNull('parent_appraisal_id').countDistinct<{ c: number }>('employee_id as c').first(),
  ]);

  const checks = [
    reconcileCheck('recruitment.joined_are_linked', toNum(recruitJoined?.c), toNum(recruitJoinedLinked?.c),
      'Recruitment JOINED applications all linked to a Lifecycle employee (must be equal)'),
    reconcileCheck('fnf.no_orphan_cases', toNum(fnfOrphans?.c), 0,
      'F&F cases all reference a canonical separation request (must be zero)'),
    reconcileCheck('appraisal.employees_within_in_service', toNum(apprEmployees?.c), toNum(apprInService?.c),
      'Distinct appraised employees do not exceed in-service employees', 'lte'),
  ];

  return { checks, ok: checks.every((c) => c.ok) };
}

function reconcileCheck(key: string, a: number, b: number, description: string, mode: 'eq' | 'lte' = 'eq') {
  const ok = mode === 'eq' ? a === b : a <= b;
  return { key, description, valueA: a, valueB: b, mode, ok, delta: a - b };
}

/** Payroll reconciliation: run header totals must equal the sum of employee lines. */
export async function payrollReconciliation(actor: HrActor, payrollRunId: number) {
  assertHrPermission(actor, 'hr.analytics.payroll.aggregate');
  const run = await db('payroll_runs').where({ id: payrollRunId, college_id: actor.collegeId }).first();
  if (!run) throw new AppError(404, 'Payroll run not found');
  const agg = await db('payroll_run_employees')
    .where({ payroll_run_id: payrollRunId })
    .select(
      db.raw('count(*) as employees'),
      db.raw('sum(gross_amount) as gross'),
      db.raw('sum(deduction_amount) as deduction'),
      db.raw('sum(net_amount) as net'),
    )
    .first();
  const a = agg as Record<string, unknown>;
  const checks = [
    reconcileCheck('payroll.employee_count', toNum(a?.employees), toNum(run.employee_count), 'Employee lines vs run employee_count'),
    reconcileCheck('payroll.gross', Math.round(toNum(a?.gross) * 100), Math.round(toNum(run.gross_total) * 100), 'Sum of employee gross vs run gross_total'),
    reconcileCheck('payroll.deduction', Math.round(toNum(a?.deduction) * 100), Math.round(toNum(run.deduction_total) * 100), 'Sum of employee deductions vs run deduction_total'),
    reconcileCheck('payroll.net', Math.round(toNum(a?.net) * 100), Math.round(toNum(run.net_total) * 100), 'Sum of employee net vs run net_total'),
  ];
  return { payrollRunId, status: run.status, checks, ok: checks.every((c) => c.ok) };
}

// ── Data quality ─────────────────────────────────────────────────────────────
export async function dataQuality(actor: HrActor) {
  assertHrPermission(actor, 'hr.analytics.view');
  const collegeId = actor.collegeId;

  const [noDept, noJoinDate, badSepRange, recruitNoLink, apprNoReviewer] = await Promise.all([
    db('employees').where({ college_id: collegeId }).whereIn('employment_status', IN_SERVICE_STATUSES as unknown as string[]).whereNull('department_id').count<{ c: number }>('id as c').first(),
    db('employees').where({ college_id: collegeId }).whereIn('employment_status', IN_SERVICE_STATUSES as unknown as string[]).whereNull('date_of_joining').count<{ c: number }>('id as c').first(),
    db('employee_separation_requests').where({ 'employee_separation_requests.college_id': collegeId }).whereNotNull('employee_separation_requests.last_working_date').join('employees', 'employees.id', 'employee_separation_requests.employee_id').whereRaw('employee_separation_requests.last_working_date < employees.date_of_joining').count<{ c: number }>('employee_separation_requests.id as c').first(),
    db('hr_recruitment_applications').where({ college_id: collegeId, status: 'JOINED' }).whereNull('employee_id').count<{ c: number }>('id as c').first(),
    db('hr_employee_appraisals').where({ college_id: collegeId }).whereNull('parent_appraisal_id').whereNotNull('review_submitted_at').whereNull('reviewer_employee_id').count<{ c: number }>('id as c').first(),
  ]);

  const flags = [
    { key: 'employee.missing_department', label: 'In-service employees without a department', count: toNum(noDept?.c) },
    { key: 'employee.missing_join_date', label: 'In-service employees without a joining date', count: toNum(noJoinDate?.c) },
    { key: 'separation.invalid_range', label: 'Separations with last working date before joining', count: toNum(badSepRange?.c) },
    { key: 'recruitment.joined_without_employee', label: 'Recruitment JOINED without a linked employee', count: toNum(recruitNoLink?.c) },
    { key: 'appraisal.reviewed_without_reviewer', label: 'Reviewed appraisals without a reviewer', count: toNum(apprNoReviewer?.c) },
  ];
  return { flags, totalIssues: flags.reduce((s, f) => s + f.count, 0), clean: flags.every((f) => f.count === 0) };
}

// ── Overview (management/HR/HOD summary, permission-suppressed) ───────────────
export async function overview(actor: HrActor, filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  const { from, to } = resolveRange(filters);
  const asOf = todayISO();

  const [hc, joiners, seps, attr, vac] = await Promise.all([
    currentHeadcount(actor, { ...filters, asOf }),
    joinersTrend(actor, filters),
    separationsTrend(actor, filters),
    attrition(actor, filters),
    hasHrPermission(actor, 'hr.recruitment.view') ? vacancyOverview(actor, filters).catch(() => null) : Promise.resolve(null),
  ]);

  const cards: Record<string, unknown> = {
    period: { from, to },
    headcount: hc.total,
    facultyStaffMix: hc.facultyStaffMix,
    joiners: joiners.total,
    separations: seps.total,
    attritionRate: attr.attritionRate,
  };

  // Attendance (latest closed month) — only if permitted.
  if (hasHrPermission(actor, 'hr.attendance.view')) {
    const at = await attendanceTrend(actor, filters).catch(() => null);
    const last = at?.byMonth?.[at.byMonth.length - 1];
    cards.attendanceRate = last?.attendanceRate ?? null;
  } else {
    cards.attendanceRate = 'RESTRICTED';
  }

  // Recruitment pipeline totals — only if permitted.
  if (hasHrPermission(actor, 'hr.recruitment.view')) {
    const funnel = await recruitmentFunnel(actor, filters).catch(() => null);
    cards.recruitmentPipeline = funnel?.stages ?? null;
    cards.openVacancies = vac?.approvedOpenPositions ?? null;
  } else {
    cards.recruitmentPipeline = 'RESTRICTED';
  }

  // Payroll cost — only aggregate-permitted actors.
  if (hasHrPermission(actor, 'hr.analytics.payroll.aggregate')) {
    const cost = await payrollCostTrend(actor, filters).catch(() => null);
    cards.payrollNet = cost?.totals.net ?? null;
  } else {
    cards.payrollNet = 'RESTRICTED';
  }

  // Appraisal completion (across active cycles) — only if permitted.
  if (hasHrPermission(actor, 'hr.performance.view')) {
    const comp = await performanceCompletion(actor, undefined, filters).catch(() => null);
    cards.appraisalCompletion = comp?.completionRate ?? null;
  } else {
    cards.appraisalCompletion = 'RESTRICTED';
  }

  // Pending F&F — only if permitted.
  if (hasHrPermission(actor, 'hr.fnf.view')) {
    const ff = await fnfAnalytics(actor, filters).catch(() => null);
    cards.pendingFnf = ff?.pending ?? null;
  } else {
    cards.pendingFnf = 'RESTRICTED';
  }

  return cards;
}

// ── Exports (independent permission; scope enforced via the same services) ────
type Table = { title: string; columns: string[]; rows: Array<Array<string | number>> };

const EXPORT_REPORTS: Record<string, (actor: HrActor, filters: AnalyticsFilters) => Promise<Table>> = {
  workforce: async (actor, filters) => {
    const hc = await currentHeadcount(actor, filters);
    return {
      title: 'Workforce Headcount',
      columns: ['Department', 'Headcount'],
      rows: hc.byDepartment.map((d) => [d.label, d.count]),
    };
  },
  'joiners-separations': async (actor, filters) => {
    const j = await joinersTrend(actor, filters);
    const s = await separationsTrend(actor, filters);
    const map = new Map<string, { j: number; s: number }>();
    for (const m of j.byMonth) map.set(m.month, { j: m.count, s: 0 });
    for (const m of s.byMonth) map.set(m.month, { j: map.get(m.month)?.j ?? 0, s: m.count });
    return {
      title: 'Joiners and Separations',
      columns: ['Month', 'Joiners', 'Separations'],
      rows: [...map.entries()].sort().map(([month, v]) => [month, v.j, v.s]),
    };
  },
  attendance: async (actor, filters) => {
    const at = await attendanceTrend(actor, filters);
    return {
      title: 'Attendance Trend',
      columns: ['Month', 'Attendance %', 'LOP Days', 'Leave Days', 'Employees'],
      rows: at.byMonth.map((m) => [m.month, m.attendanceRate, m.lopDays, m.leaveDays, m.employees]),
    };
  },
  'payroll-cost': async (actor, filters) => {
    const cost = await payrollCostTrend(actor, filters); // asserts payroll.aggregate
    return {
      title: 'Payroll Cost',
      columns: ['Period', 'Gross', 'Deduction', 'Net', 'Employees'],
      rows: cost.byPeriod.map((p) => [p.period, p.gross, p.deduction, p.net, p.employees]),
    };
  },
  'recruitment-funnel': async (actor, filters) => {
    const f = await recruitmentFunnel(actor, filters);
    return { title: 'Recruitment Funnel', columns: ['Stage', 'Count'], rows: f.stages.map((s) => [s.stage, s.count]) };
  },
  'performance-completion': async (actor, filters) => {
    const c = await performanceCompletion(actor, undefined, filters);
    return {
      title: 'Appraisal Completion',
      columns: ['Metric', 'Value'],
      rows: [['Total', c.total], ['Self submitted', c.selfSubmitted], ['Reviewed', c.reviewed], ['Finalized', c.finalized]],
    };
  },
  'fnf-aging': async (actor, filters) => {
    const ff = await fnfAnalytics(actor, filters);
    return { title: 'F&F Aging', columns: ['Status', 'Count'], rows: ff.byStatus.map((r) => [r.status, r.count]) };
  },
};

export async function exportReport(actor: HrActor, report: string, format: 'csv' | 'xlsx', filters: AnalyticsFilters = {}) {
  assertHrPermission(actor, 'hr.analytics.view');
  assertHrPermission(actor, 'hr.analytics.export');
  const builder = EXPORT_REPORTS[report];
  if (!builder) throw new AppError(404, `Unknown export report: ${report}`);
  const table = await builder(actor, filters);

  const meta: Array<[string, string]> = [
    ['Report', table.title],
    ['College', String(actor.collegeId)],
    ['Generated by', actor.name ?? String(actor.facultyUserId)],
    ['Generated at', new Date().toISOString()],
    ['Date range', `${filters.from ?? ''} .. ${filters.to ?? filters.asOf ?? todayISO()}`],
    ['Department filter', filters.departmentId != null ? String(filters.departmentId) : 'all-in-scope'],
  ];
  const filename = buildExportFilename(`HR-${table.title}`, format);

  if (format === 'csv') {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ...meta.map(([k, v]) => `${esc(k)},${esc(v)}`),
      '',
      table.columns.map(esc).join(','),
      ...table.rows.map((r) => r.map(esc).join(',')),
    ];
    return { contentType: 'text/csv', filename, body: lines.join('\n') };
  }

  const workbook = new ExcelJS.Workbook();
  const info = workbook.addWorksheet('Info');
  info.addRows(meta);
  const sheet = workbook.addWorksheet(table.title.slice(0, 28) || 'Report');
  sheet.addRow(table.columns);
  for (const r of table.rows) sheet.addRow(r);
  const body = Buffer.from(await workbook.xlsx.writeBuffer());
  return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, body };
}
