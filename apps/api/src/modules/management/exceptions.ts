/**
 * Management & Executive Portal — Risks & Exceptions Center.
 *
 * Aggregates DETERMINISTIC exceptions across domains. These are rule-based
 * thresholds, never "AI". Every item carries: reason, metric, rule/threshold,
 * scope, timestamp and a drilldown target (contract §30). Department signals
 * come from the efficient set-based metric provider (no N+1); finance and
 * succession from canonical single-pass reads.
 */
import * as financeReports from '../finance/reports.js';
import * as successionDash from '../hr/succession/dashboard.js';
import * as appraisalReports from '../hr/appraisalReports.js';
import { assertManagementPermission } from './access.js';
import { domainActor, num } from './sources.js';
import { departmentComparison } from './metrics.js';
import type { ManagementActor } from './types.js';

export const THRESHOLDS = {
  LOW_ATTENDANCE_PCT: 75,
  LOW_PLACEMENT_PCT: 40,
} as const;

export type ExceptionItem = {
  id: string;
  category: 'ACADEMICS' | 'HR' | 'FINANCE' | 'PLACEMENT' | 'CAMPUS';
  severity: 'HIGH' | 'MEDIUM';
  reason: string;
  metric: string;
  rule: string;
  scope: string;
  timestamp: string;
  drilldown: string;
};

export async function listExceptions(actor: ManagementActor): Promise<{
  items: ExceptionItem[];
  total: number;
  byCategory: Record<string, number>;
  generatedAt: string;
}> {
  assertManagementPermission(actor, 'management.exceptions.view');
  const a = domainActor(actor);
  const now = new Date().toISOString();
  const items: ExceptionItem[] = [];

  // ── Department-level academic/placement signals (set-based) ──────────────
  try {
    const comparison = await departmentComparison(a.collegeId);
    for (const d of comparison) {
      if (d.studentAttendancePct != null && d.studentAttendancePct < THRESHOLDS.LOW_ATTENDANCE_PCT) {
        items.push({
          id: `ACAD_ATT_${d.departmentId}`,
          category: 'ACADEMICS',
          severity: d.studentAttendancePct < 60 ? 'HIGH' : 'MEDIUM',
          reason: `Low student attendance in ${d.departmentName}`,
          metric: `${d.studentAttendancePct}%`,
          rule: `student attendance < ${THRESHOLDS.LOW_ATTENDANCE_PCT}%`,
          scope: `Department: ${d.departmentName}`,
          timestamp: now,
          drilldown: `/management/academics/attendance?departmentId=${d.departmentId}`,
        });
      }
      if (d.continuityExceptions > 0) {
        items.push({
          id: `ACAD_CONT_${d.departmentId}`,
          category: 'ACADEMICS',
          severity: 'MEDIUM',
          reason: `Academic continuity exceptions in ${d.departmentName}`,
          metric: `${d.continuityExceptions} open`,
          rule: 'unresolved coverage exceptions > 0',
          scope: `Department: ${d.departmentName}`,
          timestamp: now,
          drilldown: `/management/academics?departmentId=${d.departmentId}`,
        });
      }
      if (d.registered > 0 && d.placementRate != null && d.placementRate < THRESHOLDS.LOW_PLACEMENT_PCT) {
        items.push({
          id: `PLACE_LOW_${d.departmentId}`,
          category: 'PLACEMENT',
          severity: d.placementRate < 20 ? 'HIGH' : 'MEDIUM',
          reason: `Low placement rate in ${d.departmentName}`,
          metric: `${d.placementRate}%`,
          rule: `placement rate < ${THRESHOLDS.LOW_PLACEMENT_PCT}% (of registered)`,
          scope: `Department: ${d.departmentName}`,
          timestamp: now,
          drilldown: `/management/placement?departmentId=${d.departmentId}`,
        });
      }
    }
  } catch { /* academic/placement domains not provisioned */ }

  // ── Finance ────────────────────────────────────────────────────────────
  try {
    const fin = await financeReports.financeDashboard(a);
    const overdue = num(fin.overdueAmount);
    if (overdue > 0) {
      items.push({
        id: 'FIN_OVERDUE',
        category: 'FINANCE',
        severity: overdue > 100000 ? 'HIGH' : 'MEDIUM',
        reason: 'Overdue fee collections outstanding',
        metric: `₹${overdue.toLocaleString('en-IN')}`,
        rule: 'overdue fee amount > 0',
        scope: 'Institution',
        timestamp: now,
        drilldown: '/management/finance/outstanding',
      });
    }
  } catch { /* finance not provisioned */ }

  // ── HR / Succession ────────────────────────────────────────────────────
  try {
    const cov = await successionDash.coverageMetrics(a);
    if (num(cov.criticalVacancyExposure) > 0) {
      items.push({
        id: 'HR_SUCC_VACANCY',
        category: 'HR',
        severity: 'HIGH',
        reason: 'Critical roles without an active successor',
        metric: `${num(cov.criticalVacancyExposure)} role(s)`,
        rule: 'critical/high roles with no active successor > 0',
        scope: 'Institution',
        timestamp: now,
        drilldown: '/management/succession',
      });
    }
  } catch { /* succession not provisioned */ }

  try {
    const pending = await appraisalReports.pendingReviews(a);
    const count = Array.isArray(pending) ? pending.length : num((pending as { total?: unknown })?.total);
    if (count > 0) {
      items.push({
        id: 'HR_APPRAISAL_PENDING',
        category: 'HR',
        severity: 'MEDIUM',
        reason: 'Appraisal reviews pending completion',
        metric: `${count} pending`,
        rule: 'pending appraisal reviews > 0',
        scope: 'Institution',
        timestamp: now,
        drilldown: '/management/performance',
      });
    }
  } catch { /* appraisal not provisioned */ }

  items.sort((x, y) => (x.severity === y.severity ? 0 : x.severity === 'HIGH' ? -1 : 1));
  const byCategory: Record<string, number> = {};
  for (const it of items) byCategory[it.category] = (byCategory[it.category] ?? 0) + 1;
  return { items, total: items.length, byCategory, generatedAt: now };
}
