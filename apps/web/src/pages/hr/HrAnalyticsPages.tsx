import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, SectionTitle, Skeleton, StatStrip, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

// ── Shared analytics chrome ──────────────────────────────────────────────────
const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const NAV: Array<{ to: string; label: string }> = [
  { to: '/hr/analytics', label: 'Overview' },
  { to: '/hr/analytics/workforce', label: 'Workforce' },
  { to: '/hr/analytics/attendance', label: 'Attendance & Leave' },
  { to: '/hr/analytics/payroll', label: 'Payroll' },
  { to: '/hr/analytics/recruitment', label: 'Recruitment' },
  { to: '/hr/analytics/performance', label: 'Performance' },
  { to: '/hr/analytics/separation', label: 'Separation & F&F' },
  { to: '/hr/analytics/data-quality', label: 'Data Quality' },
];

function AnalyticsNav() {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto">
      {NAV.map((n) => {
        const active = pathname === n.to;
        return (
          <Link key={n.to} to={n.to}>
            <Button variant={active ? 'primary' : 'secondary'} className="!py-1.5 text-sm">
              {n.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

type Filters = { from: string; to: string };

function FiltersBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        From
        <Input type="date" value={filters.from} onChange={(e) => onChange({ ...filters, from: e.target.value })} className="!py-1.5" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        To
        <Input type="date" value={filters.to} onChange={(e) => onChange({ ...filters, to: e.target.value })} className="!py-1.5" />
      </label>
    </div>
  );
}

function useAnalytics<T>(path: string, filters?: Filters): { data: T | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const qs = useMemo(() => {
    if (!filters) return '';
    const p = new URLSearchParams();
    if (filters.from) p.set('from', filters.from);
    if (filters.to) p.set('to', filters.to);
    return p.toString() ? `?${p.toString()}` : '';
  }, [filters?.from, filters?.to]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api<T>(`${path}${qs}`)
      .then((d) => live && (setData(d), setLoading(false)))
      .catch((e) => live && (setError(e?.message ?? 'Failed to load'), setLoading(false)));
    return () => {
      live = false;
    };
  }, [path, qs]);
  return { data, error, loading };
}

function ChartCard({ title, subtitle, children, height = 260 }: { title: string; subtitle?: string; children: ReactNode; height?: number }) {
  return (
    <Surface className="p-4">
      <SectionTitle title={title} />
      {subtitle && <p className="mb-2 text-xs text-ink-muted">{subtitle}</p>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </Surface>
  );
}

function Restricted() {
  return <span className="text-ink-muted" title="Restricted by permission">—</span>;
}

function kpiValue(v: unknown): ReactNode {
  if (v === 'RESTRICTED') return <Restricted />;
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}

function AnalyticsShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={title} subtitle={subtitle} />
      <AnalyticsNav />
      {children}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
type Overview = {
  headcount: number;
  facultyStaffMix: { faculty: number; staff: number };
  joiners: number;
  separations: number;
  attritionRate: number;
  attendanceRate: number | string | null;
  openVacancies: number | null;
  payrollNet: number | string | null;
  appraisalCompletion: number | string | null;
  pendingFnf: number | string | null;
  recruitmentPipeline: Array<{ stage: string; count: number }> | string | null;
};

export function HrAnalyticsOverviewPage() {
  useDocumentTitle('HR Analytics — Overview');
  const { data, loading } = useAnalytics<Overview>('/api/hr/analytics/overview');
  const pipeline = Array.isArray(data?.recruitmentPipeline) ? data!.recruitmentPipeline : [];
  return (
    <AnalyticsShell title="HR Analytics" subtitle="Executive workforce overview — read-only, permission-scoped">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Headcount', value: kpiValue(data?.headcount) },
          { label: 'Joiners', value: kpiValue(data?.joiners) },
          { label: 'Separations', value: kpiValue(data?.separations) },
          { label: 'Attrition %', value: kpiValue(data?.attritionRate) },
          { label: 'Attendance %', value: kpiValue(data?.attendanceRate) },
          { label: 'Open Vacancies', value: kpiValue(data?.openVacancies) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatStrip
          loading={loading}
          items={[
            { label: 'Payroll Net', value: kpiValue(data?.payrollNet) },
            { label: 'Appraisal %', value: kpiValue(data?.appraisalCompletion) },
            { label: 'Pending F&F', value: kpiValue(data?.pendingFnf) },
          ]}
        />
        <div className="lg:col-span-2">
          {pipeline.length > 0 ? (
            <ChartCard title="Recruitment pipeline" height={220}>
              <BarChart data={pipeline} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={PALETTE[0]} />
              </BarChart>
            </ChartCard>
          ) : (
            <Surface className="flex h-full items-center justify-center p-8 text-sm text-ink-muted">
              Recruitment pipeline not available for your permissions.
            </Surface>
          )}
        </div>
      </div>
    </AnalyticsShell>
  );
}

// ── Workforce ────────────────────────────────────────────────────────────────
type Headcount = {
  total: number;
  facultyStaffMix: { faculty: number; staff: number };
  byDepartment: Array<{ label: string; count: number }>;
  byEmploymentType: Array<{ label: string; count: number }>;
};
type Trend = { total: number; byMonth: Array<{ month: string; count: number }> };
type Tenure = { bands: Array<{ label: string; count: number }> };

export function HrWorkforceAnalyticsPage() {
  useDocumentTitle('HR Analytics — Workforce');
  const [filters, setFilters] = useState<Filters>({ from: '', to: '' });
  const hc = useAnalytics<Headcount>('/api/hr/analytics/workforce/headcount');
  const joiners = useAnalytics<Trend>('/api/hr/analytics/workforce/joiners', filters);
  const seps = useAnalytics<Trend>('/api/hr/analytics/workforce/separations', filters);
  const tenure = useAnalytics<Tenure>('/api/hr/analytics/workforce/tenure');

  const movement = useMemo(() => {
    const map = new Map<string, { month: string; joiners: number; separations: number }>();
    for (const m of joiners.data?.byMonth ?? []) map.set(m.month, { month: m.month, joiners: m.count, separations: 0 });
    for (const m of seps.data?.byMonth ?? []) {
      const e = map.get(m.month) ?? { month: m.month, joiners: 0, separations: 0 };
      e.separations = m.count;
      map.set(m.month, e);
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [joiners.data, seps.data]);

  const mix = hc.data ? [
    { label: 'Faculty', count: hc.data.facultyStaffMix.faculty },
    { label: 'Staff', count: hc.data.facultyStaffMix.staff },
  ] : [];
  const topDepartments = useMemo(
    () => [...(hc.data?.byDepartment ?? [])].sort((a, b) => b.count - a.count).slice(0, 15),
    [hc.data],
  );

  return (
    <AnalyticsShell title="Workforce Analytics" subtitle="Headcount, movement and tenure — reconciled to Employee Lifecycle">
      <FiltersBar filters={filters} onChange={setFilters} />
      <StatStrip
        loading={hc.loading}
        items={[
          { label: 'Headcount', value: kpiValue(hc.data?.total) },
          { label: 'Faculty', value: kpiValue(hc.data?.facultyStaffMix.faculty) },
          { label: 'Staff', value: kpiValue(hc.data?.facultyStaffMix.staff) },
          { label: 'Joiners', value: kpiValue(joiners.data?.total) },
          { label: 'Separations', value: kpiValue(seps.data?.total) },
          { label: 'Departments', value: kpiValue(hc.data?.byDepartment.length) },
        ]}
      />
      <ChartCard title="Joiners vs Separations" subtitle="Monthly workforce movement">
        <LineChart data={movement} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="joiners" stroke={PALETTE[2]} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="separations" stroke={PALETTE[4]} strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Headcount by department" subtitle="Top 15 by headcount" height={280}>
          <BarChart data={topDepartments} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={90} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={PALETTE[1]} />
          </BarChart>
        </ChartCard>
        <div className="grid gap-4">
          <ChartCard title="Faculty / staff mix" height={130}>
            <PieChart>
              <Pie data={mix} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                {mix.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>
          <ChartCard title="Tenure distribution" height={130}>
            <BarChart data={tenure.data?.bands ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={PALETTE[5]} />
            </BarChart>
          </ChartCard>
        </div>
      </div>
    </AnalyticsShell>
  );
}

// ── Attendance & Leave ───────────────────────────────────────────────────────
type Attendance = { byMonth: Array<{ month: string; attendanceRate: number; lopDays: number; leaveDays: number; employees: number }> };
type Leave = { byType: Array<{ leaveType: string; days: number }>; totalApprovedDays: number; pending: number };

export function HrAttendanceAnalyticsPage() {
  useDocumentTitle('HR Analytics — Attendance & Leave');
  const [filters, setFilters] = useState<Filters>({ from: '', to: '' });
  const at = useAnalytics<Attendance>('/api/hr/analytics/attendance', filters);
  const lv = useAnalytics<Leave>('/api/hr/analytics/leave', filters);
  const latest = at.data?.byMonth?.[at.data.byMonth.length - 1];
  return (
    <AnalyticsShell title="Attendance & Leave Analytics" subtitle="From canonical monthly attendance & leave — reasons never surfaced">
      <FiltersBar filters={filters} onChange={setFilters} />
      <StatStrip
        loading={at.loading}
        items={[
          { label: 'Latest attendance %', value: kpiValue(latest?.attendanceRate) },
          { label: 'Latest LOP days', value: kpiValue(latest?.lopDays) },
          { label: 'Approved leave days', value: kpiValue(lv.data?.totalApprovedDays) },
          { label: 'Pending leave', value: kpiValue(lv.data?.pending) },
        ]}
      />
      <ChartCard title="Attendance rate trend" subtitle="Present ÷ payable days, %">
        <LineChart data={at.data?.byMonth ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="attendanceRate" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="LOP days trend">
          <BarChart data={at.data?.byMonth ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="lopDays" radius={[4, 4, 0, 0]} fill={PALETTE[3]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Leave by type (approved days)">
          <BarChart data={lv.data?.byType ?? []} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="leaveType" tick={{ fontSize: 10 }} width={90} />
            <Tooltip />
            <Bar dataKey="days" radius={[0, 4, 4, 0]} fill={PALETTE[6]} />
          </BarChart>
        </ChartCard>
      </div>
    </AnalyticsShell>
  );
}

// ── Payroll ──────────────────────────────────────────────────────────────────
type PayrollCost = { byPeriod: Array<{ period: string; gross: number; deduction: number; net: number; employees: number }>; totals: { gross: number; net: number; deduction: number } };

export function HrPayrollAnalyticsPage() {
  useDocumentTitle('HR Analytics — Payroll');
  const [filters, setFilters] = useState<Filters>({ from: '', to: '' });
  const { data, error, loading } = useAnalytics<PayrollCost>('/api/hr/analytics/payroll/cost', filters);
  return (
    <AnalyticsShell title="Payroll Analytics" subtitle="Aggregate cost from locked payroll runs — confidential">
      <FiltersBar filters={filters} onChange={setFilters} />
      {error ? (
        <Surface className="p-8 text-center text-sm text-ink-muted">
          Payroll analytics require aggregate payroll permission.
        </Surface>
      ) : (
        <>
          <StatStrip
            loading={loading}
            items={[
              { label: 'Gross', value: kpiValue(data?.totals.gross) },
              { label: 'Deductions', value: kpiValue(data?.totals.deduction) },
              { label: 'Net', value: kpiValue(data?.totals.net) },
            ]}
          />
          <ChartCard title="Payroll cost trend" subtitle="Gross vs net by period">
            <LineChart data={data?.byPeriod ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="gross" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="net" stroke={PALETTE[2]} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
        </>
      )}
    </AnalyticsShell>
  );
}

// ── Recruitment ──────────────────────────────────────────────────────────────
type Funnel = { stages: Array<{ stage: string; count: number }> };
type TTF = { filled: number; avgDays: number | null };
type Offer = { acceptanceRate: number; accepted: number; issued: number };
type Vacancy = { approvedOpenPositions: number; publishedOpenings: number };

export function HrRecruitmentAnalyticsPage() {
  useDocumentTitle('HR Analytics — Recruitment');
  const [filters, setFilters] = useState<Filters>({ from: '', to: '' });
  const funnel = useAnalytics<Funnel>('/api/hr/analytics/recruitment/funnel', filters);
  const ttf = useAnalytics<TTF>('/api/hr/analytics/recruitment/time-to-fill', filters);
  const offer = useAnalytics<Offer>('/api/hr/analytics/recruitment/offer-acceptance', filters);
  const vac = useAnalytics<Vacancy>('/api/hr/analytics/recruitment/vacancy');
  return (
    <AnalyticsShell title="Recruitment Analytics" subtitle="Pipeline reconciled to Recruitment; JOINED = actual Lifecycle conversion">
      <FiltersBar filters={filters} onChange={setFilters} />
      <StatStrip
        loading={funnel.loading}
        items={[
          { label: 'Open positions', value: kpiValue(vac.data?.approvedOpenPositions) },
          { label: 'Published openings', value: kpiValue(vac.data?.publishedOpenings) },
          { label: 'Time to fill (d)', value: kpiValue(ttf.data?.avgDays) },
          { label: 'Offer accept %', value: kpiValue(offer.data?.acceptanceRate) },
        ]}
      />
      <ChartCard title="Hiring funnel" subtitle="Distinct candidates by furthest stage">
        <BarChart data={funnel.data?.stages ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {(funnel.data?.stages ?? []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ChartCard>
    </AnalyticsShell>
  );
}

// ── Performance ──────────────────────────────────────────────────────────────
type Completion = { total: number; selfSubmitted: number; reviewed: number; finalized: number; completionRate: number };
type Distribution = { total: number; suppressed: boolean; buckets: Array<{ label: string; count: number }> };

export function HrPerformanceAnalyticsPage() {
  useDocumentTitle('HR Analytics — Performance');
  const comp = useAnalytics<Completion>('/api/hr/analytics/performance/completion');
  const dist = useAnalytics<Distribution>('/api/hr/analytics/performance/distribution');
  const funnelData = comp.data ? [
    { stage: 'Enrolled', count: comp.data.total },
    { stage: 'Self', count: comp.data.selfSubmitted },
    { stage: 'Reviewed', count: comp.data.reviewed },
    { stage: 'Finalized', count: comp.data.finalized },
  ] : [];
  return (
    <AnalyticsShell title="Performance Analytics" subtitle="Finalized ratings only — reviewer notes never exposed">
      <StatStrip
        loading={comp.loading}
        items={[
          { label: 'Appraisals', value: kpiValue(comp.data?.total) },
          { label: 'Reviewed', value: kpiValue(comp.data?.reviewed) },
          { label: 'Finalized', value: kpiValue(comp.data?.finalized) },
          { label: 'Completion %', value: kpiValue(comp.data?.completionRate) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cycle completion">
          <BarChart data={funnelData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={PALETTE[0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Rating distribution">
          {dist.data?.suppressed ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">Insufficient group size — suppressed</div>
          ) : (
            <PieChart>
              <Pie data={dist.data?.buckets ?? []} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                {(dist.data?.buckets ?? []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ChartCard>
      </div>
    </AnalyticsShell>
  );
}

// ── Separation & F&F ─────────────────────────────────────────────────────────
type Fnf = { pending: number; settled: number; byStatus: Array<{ status: string; count: number }>; payableTotal: number; receivableTotal: number };

export function HrSeparationAnalyticsPage() {
  useDocumentTitle('HR Analytics — Separation & F&F');
  const { data, loading } = useAnalytics<Fnf>('/api/hr/analytics/separation/fnf');
  return (
    <AnalyticsShell title="Separation & Final Settlement Analytics" subtitle="Case aging and settlement totals from canonical F&F">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Pending', value: kpiValue(data?.pending) },
          { label: 'Settled', value: kpiValue(data?.settled) },
          { label: 'Payable', value: kpiValue(data?.payableTotal) },
          { label: 'Receivable', value: kpiValue(data?.receivableTotal) },
        ]}
      />
      <ChartCard title="F&F cases by status">
        <BarChart data={data?.byStatus ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="status" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={PALETTE[7]} />
        </BarChart>
      </ChartCard>
    </AnalyticsShell>
  );
}

// ── Data quality ─────────────────────────────────────────────────────────────
type DataQuality = { flags: Array<{ key: string; label: string; count: number }>; totalIssues: number; clean: boolean };

export function HrDataQualityPage() {
  useDocumentTitle('HR Analytics — Data Quality');
  const { data, loading } = useAnalytics<DataQuality>('/api/hr/analytics/data-quality');
  return (
    <AnalyticsShell title="Data Quality" subtitle="Deterministic integrity checks — analytics never mutates source records">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Total issues', value: kpiValue(data?.totalIssues) },
          { label: 'Status', value: data ? (data.clean ? 'Clean' : 'Needs review') : '—' },
        ]}
      />
      <Surface className="divide-y divide-border p-0">
        {loading ? (
          <div className="p-4"><Skeleton className="h-24 w-full" /></div>
        ) : (
          (data?.flags ?? []).map((f) => (
            <div key={f.key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink">{f.label}</span>
              <span className={`tabular-nums text-sm font-semibold ${f.count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{f.count}</span>
            </div>
          ))
        )}
      </Surface>
    </AnalyticsShell>
  );
}
