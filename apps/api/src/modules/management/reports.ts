/**
 * Management & Executive Portal — Executive Reports & Snapshot.
 *
 * Reports are generated from canonical data (via the aggregation modules).
 * The snapshot is a concise, printable/exportable institution summary — not a
 * raw-data dump. Export uses a simple CSV serializer (the project's established
 * lightweight export pattern) with the KPI provenance intact.
 */
import { assertManagementPermission } from './access.js';
import { commandCenter } from './overview.js';
import type { ExecutiveMetric, ManagementActor } from './types.js';

export async function executiveSnapshot(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.reports.view');
  const cc = await commandCenter(actor);
  return {
    generatedAt: cc.generatedAt,
    collegeId: actor.collegeId,
    kpis: cc.kpis,
    academicHealth: cc.academicHealth,
    finance: cc.finance,
    succession: cc.succession,
    risks: cc.exceptions,
    approvals: cc.approvals,
    departmentComparison: cc.departmentComparison,
  };
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportSnapshotCsv(actor: ManagementActor): Promise<{ filename: string; csv: string }> {
  assertManagementPermission(actor, 'management.reports.export');
  const cc = await commandCenter(actor);
  const header = ['metric', 'label', 'value', 'unit', 'source', 'noData'];
  const lines = [header.join(',')];
  for (const k of cc.kpis as ExecutiveMetric[]) {
    lines.push([
      csvCell(k.key),
      csvCell(k.label),
      csvCell(k.value),
      csvCell(k.unit),
      csvCell(k.sourceDomain),
      csvCell(k.noData ? 'NO_DATA' : ''),
    ].join(','));
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return { filename: `executive-snapshot-${stamp}.csv`, csv: lines.join('\n') };
}

export function availableReports() {
  return [
    { key: 'INSTITUTIONAL_SNAPSHOT', label: 'Institutional Snapshot', capability: 'management.reports.view' },
    { key: 'ACADEMIC_PERFORMANCE', label: 'Academic Performance', capability: 'management.academics.view' },
    { key: 'HR_WORKFORCE', label: 'HR Workforce', capability: 'management.hr.view' },
    { key: 'RECRUITMENT', label: 'Recruitment', capability: 'management.recruitment.view' },
    { key: 'PERFORMANCE', label: 'Performance', capability: 'management.performance.view' },
    { key: 'EMPLOYEE_LD', label: 'Employee L&D', capability: 'management.ld.view' },
    { key: 'SUCCESSION', label: 'Succession Coverage', capability: 'management.succession.view' },
    { key: 'PLACEMENT', label: 'Placement', capability: 'management.placement.view' },
    { key: 'FEE_COLLECTION', label: 'Fee Collection', capability: 'management.finance.view' },
    { key: 'PAYROLL_SUMMARY', label: 'Payroll Summary', capability: 'management.payroll.summary' },
    { key: 'CAMPUS', label: 'Campus Services', capability: 'management.campus.view' },
  ];
}
