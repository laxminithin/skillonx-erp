import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { Button, PageHeader, Surface, Badge, EmptyState, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { SimpleTable } from '../leadership/leadershipUi';
import { useResource, KpiCards, ExecPanel, SeverityDot, Unavailable, formatValue } from './managementUi';

type Kpi = { key: string; label: string; value: number | string | null; unit?: string; noData?: boolean; sourceDomain?: string };
type DeptRow = {
  departmentId: number;
  departmentName: string;
  departmentCode: string | null;
  students: number;
  faculty: number;
  studentAttendancePct: number | null;
  facultyAttendancePct: number | null;
  continuityExceptions: number;
  placementRate: number | null;
};
type Overview = {
  capabilities: string[];
  kpis: Kpi[];
  academicHealth: Record<string, number | null> | null;
  departmentComparison: DeptRow[];
  finance: Record<string, unknown> | null;
  succession: Record<string, unknown> | null;
  exceptions: { total: number; byCategory: Record<string, number>; top: ExceptionItem[] } | null;
  approvals: { total: number; byDomain: Record<string, number>; top: ApprovalItem[] } | null;
};
type ExceptionItem = {
  id: string;
  category: string;
  severity: string;
  reason: string;
  metric: string;
  rule: string;
  scope: string;
  drilldown: string;
};
type ApprovalItem = {
  domain: string;
  type: string;
  id: number;
  reference: string | null;
  requester: string | null;
  department: string | null;
  ageDays: number | null;
  summary: string;
  status: string;
  priority: string;
  allowedActions: Array<'APPROVE' | 'REJECT'>;
};

/* -------------------------------------------------------------------------- */
/* Command Center                                                             */
/* -------------------------------------------------------------------------- */

export function ManagementOverviewPage() {
  useDocumentTitle('Command Center');
  const { data, error, loading } = useResource<Overview>('/api/management/overview');

  const comparison = (data?.departmentComparison ?? []).slice(0, 12).map((d) => ({
    name: d.departmentCode || d.departmentName?.slice(0, 8) || '—',
    Attendance: d.studentAttendancePct ?? 0,
    Placement: d.placementRate ?? 0,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Institution Command Center" subtitle="Observe · Compare · Drill down · Approve · Act" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <KpiCards kpis={data?.kpis ?? []} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecPanel title="Department comparison" actions={<Link className="text-sm text-primary" to="/management/departments">All scorecards →</Link>}>
            {comparison.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Attendance" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Placement" fill="var(--info)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Unavailable label="No department data yet" />
            )}
          </ExecPanel>
        </div>

        <div className="space-y-4">
          <ExecPanel title="Risks & exceptions" actions={<Link className="text-sm text-primary" to="/management/exceptions">View all →</Link>}>
            {data?.exceptions?.total ? (
              <ul className="divide-y divide-border">
                {data.exceptions.top.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-2 py-2.5">
                    <span className="flex min-w-0 items-start text-sm text-ink">
                      <SeverityDot severity={e.severity} />
                      <span className="min-w-0">{e.reason}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{e.metric}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No open risks.</p>
            )}
          </ExecPanel>

          <ExecPanel title="Pending approvals" actions={<Link className="text-sm text-primary" to="/management/approvals">Inbox →</Link>}>
            {data?.approvals?.total ? (
              <ul className="divide-y divide-border">
                {data.approvals.top.map((a) => (
                  <li key={`${a.domain}-${a.id}`} className="flex items-start justify-between gap-2 py-2.5">
                    <span className="flex min-w-0 items-start text-sm text-ink">
                      <SeverityDot severity={a.priority} />
                      <span className="min-w-0 truncate">{a.summary}</span>
                    </span>
                    <Badge>{a.domain}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nothing awaiting a decision.</p>
            )}
          </ExecPanel>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Department scorecards                                                       */
/* -------------------------------------------------------------------------- */

export function ManagementDepartmentsPage() {
  useDocumentTitle('Department scorecards');
  const { data, error, loading } = useResource<{ departments: DeptRow[]; count: number }>('/api/management/departments');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Department Scorecards" subtitle="Transparent per-department comparison" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Surface className="p-5">
        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <SimpleTable
            headers={['Department', 'Students', 'Faculty', 'Student Att.', 'Faculty Att.', 'Continuity', 'Placement']}
            empty="No departments with activity"
            rows={(data?.departments ?? []).map((d) => [
              <Link key="n" className="text-primary" to={`/management/departments/${d.departmentId}`}>{d.departmentName}</Link>,
              d.students,
              d.faculty,
              d.studentAttendancePct == null ? '—' : `${d.studentAttendancePct}%`,
              d.facultyAttendancePct == null ? '—' : `${d.facultyAttendancePct}%`,
              d.continuityExceptions,
              d.placementRate == null ? '—' : `${d.placementRate}%`,
            ])}
          />
        )}
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Risks & exceptions                                                         */
/* -------------------------------------------------------------------------- */

export function ManagementExceptionsPage() {
  useDocumentTitle('Risks & exceptions');
  const { data, error, loading } = useResource<{ items: ExceptionItem[]; total: number; byCategory: Record<string, number> }>(
    '/api/management/exceptions',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Risks & Exceptions" subtitle="Deterministic, rule-based — never AI" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Surface className="p-5">
        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : data?.items.length ? (
          <ul className="divide-y divide-border">
            {data.items.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center text-sm font-medium text-ink">
                    <SeverityDot severity={e.severity} />
                    {e.reason}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {e.scope} · Rule: {e.rule}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-ink">{e.metric}</span>
                  <Link className="text-xs text-primary" to={e.drilldown}>Drill down →</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open risks" body="Every deterministic rule is within threshold." />
        )}
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Approvals inbox                                                            */
/* -------------------------------------------------------------------------- */

export function ManagementApprovalsPage() {
  useDocumentTitle('Approvals');
  const { data, error, loading, setData } = useResource<{ items: ApprovalItem[]; total: number; byDomain: Record<string, number> }>(
    '/api/management/approvals',
  );
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [canAct, setCanAct] = useState<boolean>(true);

  async function act(item: ApprovalItem, action: 'APPROVE' | 'REJECT') {
    const key = `${item.domain}-${item.id}`;
    setBusy(key);
    try {
      await api('/api/management/approvals/act', {
        method: 'POST',
        body: JSON.stringify({ domain: item.domain, id: item.id, action }),
      });
      toast(`${action === 'APPROVE' ? 'Approved' : 'Rejected'} via canonical workflow`, 'success');
      setData((prev) => (prev ? { ...prev, items: prev.items.filter((i) => `${i.domain}-${i.id}` !== key), total: prev.total - 1 } : prev));
    } catch (err) {
      const msg = (err as Error).message || 'Action failed';
      if (/access|permission|forbidden/i.test(msg)) setCanAct(false);
      toast(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Executive Approval Inbox" subtitle="One place for cross-domain decisions — executed on the canonical workflow" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!canAct ? (
        <Surface className="border-warning/40 bg-warning/5 p-3 text-sm text-ink">
          You can review the inbox, but acting requires approval authority on the source domain.
        </Surface>
      ) : null}
      <Surface className="p-5">
        {loading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : data?.items.length ? (
          <ul className="divide-y divide-border">
            {data.items.map((a) => {
              const key = `${a.domain}-${a.id}`;
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center text-sm font-medium text-ink">
                      <SeverityDot severity={a.priority} />
                      {a.summary}
                      <Badge className="ml-2">{a.domain}</Badge>
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {a.reference ?? '—'} · {a.requester ?? a.department ?? 'Institution'} · {a.ageDays ?? 0}d old · {a.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" disabled={busy === key} onClick={() => act(a, 'REJECT')}>
                      Reject
                    </Button>
                    <Button disabled={busy === key} onClick={() => act(a, 'APPROVE')}>
                      Approve
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Inbox zero" body="No pending cross-domain approvals." />
        )}
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic domain section (KPIs + optional table)                             */
/* -------------------------------------------------------------------------- */

function pickNumbers(obj: unknown, max = 8): Kpi[] {
  const out: Kpi[] = [];
  const walk = (o: unknown, prefix = '') => {
    if (!o || typeof o !== 'object' || out.length >= max) return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (out.length >= max) break;
      if (typeof v === 'number') {
        const isPct = /pct|percent|rate|coverage/i.test(k);
        out.push({ key: prefix + k, label: humanize(k), value: v, unit: isPct ? 'percent' : undefined });
      }
    }
  };
  const d = (obj as { data?: unknown })?.data ?? obj;
  walk(d);
  return out;
}
function humanize(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function SectionPage({ title, subtitle, path }: { title: string; subtitle: string; path: string }) {
  useDocumentTitle(title);
  const { data, error, loading } = useResource<Record<string, unknown>>(path);
  const kpis: Kpi[] = [];
  if (data) {
    for (const v of Object.values(data)) {
      for (const kpi of pickNumbers(v, 6)) if (kpis.length < 12) kpis.push(kpi);
    }
    if (!kpis.length) for (const kpi of pickNumbers(data, 12)) kpis.push(kpi);
  }
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <KpiCards kpis={[]} loading />
      ) : kpis.length ? (
        <KpiCards kpis={kpis} />
      ) : (
        <Unavailable />
      )}
    </div>
  );
}

export const ManagementAcademicsPage = () => <SectionPage title="Academic Overview" subtitle="Institution academic health" path="/api/management/academics" />;
export const ManagementWorkforcePage = () => <SectionPage title="Workforce" subtitle="Headcount, movement and attendance" path="/api/management/workforce" />;
export const ManagementRecruitmentPage = () => <SectionPage title="Recruitment" subtitle="Requisition-to-joining funnel" path="/api/management/recruitment" />;
export const ManagementPerformancePage = () => <SectionPage title="Performance" subtitle="Appraisal completion and ratings" path="/api/management/performance" />;
export const ManagementLdPage = () => <SectionPage title="Learning & Development" subtitle="Participation, completion and compliance" path="/api/management/ld" />;
export const ManagementSuccessionPage = () => <SectionPage title="Succession" subtitle="Critical-role coverage and readiness" path="/api/management/succession" />;
export const ManagementPlacementPage = () => <SectionPage title="Training & Placement" subtitle="Career outcomes" path="/api/management/placement" />;
export const ManagementFinancePage = () => <SectionPage title="Institutional Finance" subtitle="Fee demand, collection and outstanding" path="/api/management/finance" />;
export const ManagementCampusPage = () => <SectionPage title="Campus Services" subtitle="Library · Hostel · Transport" path="/api/management/campus" />;

export function ManagementPayrollPage() {
  useDocumentTitle('Payroll Summary');
  const { data, error, loading } = useResource<{
    trend: { available: boolean; data?: { totals?: Record<string, number>; byPeriod?: Array<Record<string, unknown>> } };
    canSeeDetail: boolean;
    classification: string;
  }>('/api/management/payroll/summary');
  const totals = data?.trend.available ? data.trend.data?.totals : undefined;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Payroll Executive Summary" subtitle="Aggregate cost only — individual salaries are restricted" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <KpiCards kpis={[]} loading />
      ) : totals ? (
        <>
          <KpiCards
            kpis={[
              { key: 'gross', label: 'Gross', value: totals.gross ?? 0, unit: 'currency', sourceDomain: 'payroll' },
              { key: 'deduction', label: 'Deductions', value: totals.deduction ?? 0, unit: 'currency', sourceDomain: 'payroll' },
              { key: 'net', label: 'Net Payroll', value: totals.net ?? 0, unit: 'currency', sourceDomain: 'payroll' },
            ]}
          />
          <Surface className="p-3 text-xs text-ink-muted">
            Classification: {data?.classification}. Sourced from locked/approved payroll runs — never recalculated.
          </Surface>
        </>
      ) : (
        <Unavailable label="No payroll for the selected period" />
      )}
    </div>
  );
}

export function ManagementReportsPage() {
  useDocumentTitle('Executive Reports');
  const { data, error, loading } = useResource<{ reports: Array<{ key: string; label: string; capability: string }> }>(
    '/api/management/reports',
  );
  const { toast } = useToast();
  async function exportCsv() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/management/reports/snapshot.csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('survey_token') ?? ''}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'executive-snapshot.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Executive Reports"
        subtitle="Generated from canonical data"
        actions={<Button onClick={exportCsv}>Export snapshot (CSV)</Button>}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.reports ?? []).map((r) => (
          <Surface key={r.key} className="p-4">
            <p className="font-medium text-ink">{r.label}</p>
            <p className="mt-1 text-xs text-ink-muted">{formatValue(r.capability)}</p>
          </Surface>
        ))}
        {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
      </div>
    </div>
  );
}

export function ManagementDepartmentDetailPage() {
  useDocumentTitle('Department detail');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Department Detail" subtitle="Canonical academic-leadership overview" />
      <DeptDetailInner />
    </div>
  );
}

function DeptDetailInner() {
  const id = window.location.pathname.split('/').pop();
  const { data, error, loading } = useResource<Record<string, unknown>>(id ? `/api/management/departments/${id}` : null);
  const kpis = data ? pickNumbers((data as { data?: unknown }).data ?? data, 12) : [];
  if (loading) return <KpiCards kpis={[]} loading />;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  return kpis.length ? <KpiCards kpis={kpis} /> : <Unavailable />;
}
