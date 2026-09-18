import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { Button, PageHeader, SectionTitle, Skeleton, StatStrip, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const CRIT_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#0ea5e9', LOW: '#10b981' };
const READY_COLORS: Record<string, string> = { READY_NOW: '#10b981', READY_1_YEAR: '#84cc16', READY_2_YEARS: '#f59e0b', DEVELOPING: '#0ea5e9', NOT_READY: '#ef4444' };

const NAV = [
  { to: '/hr/succession', label: 'Dashboard' },
  { to: '/hr/succession/roles', label: 'Critical Roles' },
  { to: '/hr/succession/matrix', label: 'Talent Matrix' },
  { to: '/hr/succession/pools', label: 'Talent Pools' },
  { to: '/hr/succession/actions', label: 'Development' },
  { to: '/hr/succession/reports', label: 'Reports' },
];

function NavChips({ items }: { items: Array<{ to: string; label: string }> }) {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto">
      {items.map((n) => (
        <Link key={n.to} to={n.to}><Button variant={pathname === n.to ? 'primary' : 'secondary'} className="!py-1.5 text-sm">{n.label}</Button></Link>
      ))}
    </div>
  );
}
function Shell({ title, subtitle, nav = NAV, actions, children }: { title: string; subtitle: string; nav?: Array<{ to: string; label: string }>; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <NavChips items={nav} />
      {children}
    </div>
  );
}
function useSucc<T>(path: string | null): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true; setLoading(true); setError(null);
    api<T>(path).then((d) => live && (setData(d), setLoading(false))).catch((e) => live && (setError(e?.message ?? 'Failed'), setLoading(false)));
    return () => { live = false; };
  }, [path]);
  return { data, loading, error };
}
function ChartCard({ title, subtitle, children, height = 240 }: { title: string; subtitle?: string; children: ReactNode; height?: number }) {
  return (
    <Surface className="p-4">
      <SectionTitle title={title} />
      {subtitle && <p className="mb-2 text-xs text-ink-muted">{subtitle}</p>}
      <div style={{ width: '100%', height }}><ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer></div>
    </Surface>
  );
}
const n = (v: unknown): ReactNode => (v == null ? '—' : typeof v === 'number' ? v.toLocaleString() : String(v));

// ── Dashboard ────────────────────────────────────────────────────────────────
type Dashboard = {
  kpis: { criticalRoles: number; coveredRoles: number; rolesWithoutSuccessor: number; readyNowCoveragePct: number; coveragePct: number; talentPools: number; openDevelopmentActions: number; criticalVacancyExposure: number };
  criticalityDistribution: Array<{ criticality: string; count: number }>;
  readinessDistribution: Array<{ readiness: string; count: number }>;
  departmentCoverage: Array<{ department: string; roles: number; covered: number }>;
  developmentActionStatus: Array<{ status: string; count: number }>;
};

export function SuccessionDashboardPage() {
  useDocumentTitle('Succession Planning');
  const { data, loading } = useSucc<Dashboard>('/api/hr/succession/dashboard');
  const deptData = (data?.departmentCoverage ?? []).map((d) => ({ department: d.department, covered: d.covered, uncovered: Math.max(0, d.roles - d.covered) }));
  return (
    <Shell title="Succession Planning" subtitle="Critical-role coverage and talent pipeline">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Critical Roles', value: n(data?.kpis.criticalRoles) },
          { label: 'Covered', value: n(data?.kpis.coveredRoles) },
          { label: 'Coverage %', value: n(data?.kpis.coveragePct) },
          { label: 'Ready-Now %', value: n(data?.kpis.readyNowCoveragePct) },
          { label: 'No Successor', value: n(data?.kpis.rolesWithoutSuccessor) },
          { label: 'Vacancy Exposure', value: n(data?.kpis.criticalVacancyExposure) },
        ]}
      />
      <ChartCard title="Succession coverage by department" subtitle="Covered vs uncovered critical roles (top 15)">
        <BarChart data={deptData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="covered" stackId="a" fill={PALETTE[2]} radius={[0, 0, 0, 0]} />
          <Bar dataKey="uncovered" stackId="a" fill={PALETTE[4]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Readiness distribution" height={220}>
          <PieChart>
            <Pie data={data?.readinessDistribution ?? []} dataKey="count" nameKey="readiness" cx="50%" cy="50%" outerRadius={80}>
              {(data?.readinessDistribution ?? []).map((r, i) => <Cell key={i} fill={READY_COLORS[r.readiness] ?? PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ChartCard>
        <ChartCard title="Criticality distribution" height={220}>
          <BarChart data={data?.criticalityDistribution ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="criticality" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{(data?.criticalityDistribution ?? []).map((r, i) => <Cell key={i} fill={CRIT_COLORS[r.criticality] ?? PALETTE[i % PALETTE.length]} />)}</Bar>
          </BarChart>
        </ChartCard>
      </div>
    </Shell>
  );
}

// ── Critical roles ───────────────────────────────────────────────────────────
type Role = { id: number; code: string; role_title: string; department: string | null; criticality: string; vacancy_risk: string; is_active: number; incumbent_name: string | null };

export function SuccessionRolesPage() {
  useDocumentTitle('Critical Roles');
  const { data, loading } = useSucc<Role[]>('/api/hr/succession/critical-roles');
  return (
    <Shell title="Critical Roles" subtitle="Positions requiring succession coverage">
      <Surface className="overflow-x-auto p-0">
        {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No critical roles defined yet.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="px-4 py-2">Role</th><th className="px-4 py-2">Department</th><th className="px-4 py-2">Incumbent</th><th className="px-4 py-2">Criticality</th><th className="px-4 py-2">Vacancy Risk</th></tr></thead>
            <tbody>{(data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="px-4 py-2"><Link className="font-medium text-indigo-600" to={`/hr/succession/roles/${r.id}`}>{r.role_title}</Link></td>
                <td className="px-4 py-2 text-ink-muted">{r.department ?? '—'}</td>
                <td className="px-4 py-2 text-ink-muted">{r.incumbent_name ?? '—'}</td>
                <td className="px-4 py-2"><span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: CRIT_COLORS[r.criticality] ?? '#64748b' }}>{r.criticality}</span></td>
                <td className="px-4 py-2 text-ink-muted">{r.vacancy_risk}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── Role detail: succession slate ────────────────────────────────────────────
type Candidate = { id: number; employee_id: number; display_name: string; readiness: string; rank: number | null; status: string; strengths: string | null; development_gaps: string | null; employment_status: string };

export function SuccessionRoleDetailPage() {
  const { id } = useParams();
  useDocumentTitle('Succession Slate');
  const role = useSucc<Record<string, unknown>>(id ? `/api/hr/succession/critical-roles/${id}` : null);
  const cands = useSucc<Candidate[]>(id ? `/api/hr/succession/critical-roles/${id}/candidates` : null);
  return (
    <Shell title={String(role.data?.role_title ?? 'Succession Slate')} subtitle="Successors and readiness for this critical role" actions={<Link to="/hr/succession/roles"><Button variant="secondary">Back</Button></Link>}>
      <StatStrip items={[
        { label: 'Criticality', value: (role.data?.criticality as string) ?? '—' },
        { label: 'Vacancy Risk', value: (role.data?.vacancy_risk as string) ?? '—' },
        { label: 'Successors', value: n((cands.data ?? []).length) },
        { label: 'Ready Now', value: n((cands.data ?? []).filter((c) => c.readiness === 'READY_NOW').length) },
      ]} />
      <Surface className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3"><SectionTitle title="Succession slate" /></div>
        {cands.loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : (cands.data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No successors nominated yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="px-4 py-2">Successor</th><th className="px-4 py-2">Readiness</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Development gaps</th></tr></thead>
            <tbody>{(cands.data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="px-4 py-2 font-medium">{c.display_name}</td>
                <td className="px-4 py-2"><span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: READY_COLORS[c.readiness] ?? '#64748b' }}>{c.readiness.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-2 text-ink-muted">{c.status}</td>
                <td className="px-4 py-2 text-ink-muted">{c.development_gaps ?? '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── Talent matrix ────────────────────────────────────────────────────────────
type Matrix = { classifiedEmployees: number; matrix: Array<{ performance: string; potential: string; count: number }>; sources: Record<string, number> };
const BANDS = ['LOW', 'MEDIUM', 'HIGH'] as const;

export function SuccessionMatrixPage() {
  useDocumentTitle('Talent Matrix');
  const { data, loading } = useSucc<Matrix>('/api/hr/succession/matrix');
  const cell = (perf: string, pot: string) => data?.matrix.find((m) => m.performance === perf && m.potential === pot)?.count ?? 0;
  const max = Math.max(1, ...(data?.matrix ?? []).map((m) => m.count));
  const shade = (c: number) => {
    const t = c / max;
    return `rgba(79,70,229,${0.08 + t * 0.55})`;
  };
  return (
    <Shell title="Talent Matrix" subtitle="Performance × Potential (latest finalized assessment per employee)">
      <StatStrip loading={loading} items={[{ label: 'Classified employees', value: n(data?.classifiedEmployees) }, { label: 'From appraisal', value: n(data?.sources?.APPRAISAL ?? 0) }, { label: 'From assessment', value: n(data?.sources?.ASSESSMENT ?? 0) }]} />
      <Surface className="p-4">
        <SectionTitle title="9-box grid" />
        <div className="overflow-x-auto">
          <div className="inline-grid min-w-[420px] grid-cols-[auto_repeat(3,1fr)] gap-1">
            <div />
            {BANDS.map((pot) => <div key={pot} className="px-2 py-1 text-center text-xs font-medium uppercase text-ink-muted">Potential {pot}</div>)}
            {[...BANDS].reverse().map((perf) => (
              <Fragment key={perf}>
                <div className="flex items-center px-2 text-xs font-medium uppercase text-ink-muted">Perf {perf}</div>
                {BANDS.map((pot) => {
                  const c = cell(perf, pot);
                  return <div key={`${perf}-${pot}`} className="flex h-20 items-center justify-center rounded-md text-lg font-semibold text-ink" style={{ background: shade(c) }}>{c}</div>;
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </Surface>
    </Shell>
  );
}

// ── Talent pools ─────────────────────────────────────────────────────────────
type Pool = { id: number; name: string; description: string | null; member_count: number; is_active: number };

export function SuccessionPoolsPage() {
  useDocumentTitle('Talent Pools');
  const { data, loading } = useSucc<Pool[]>('/api/hr/succession/pools');
  return (
    <Shell title="Talent Pools" subtitle="Curated talent groups">
      {loading ? <Skeleton className="h-40 w-full" /> : (data ?? []).length === 0 ? (
        <Surface className="p-8 text-center text-sm text-ink-muted">No talent pools yet.</Surface>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p) => (
            <Surface key={p.id} className="flex flex-col gap-1 p-4">
              <p className="text-sm font-semibold text-ink">{p.name}</p>
              {p.description && <p className="text-xs text-ink-muted line-clamp-2">{p.description}</p>}
              <p className="mt-auto pt-2 text-2xl font-semibold tabular-nums">{p.member_count}<span className="ml-1 text-xs font-normal text-ink-muted">members</span></p>
            </Surface>
          ))}
        </div>
      )}
    </Shell>
  );
}

// ── Development actions ──────────────────────────────────────────────────────
type DevAction = { id: number; display_name: string; action_type: string; description: string; due_date: string | null; status: string };

export function SuccessionActionsPage() {
  useDocumentTitle('Development Actions');
  const { data, loading } = useSucc<DevAction[]>('/api/hr/succession/development-actions');
  return (
    <Shell title="Development Actions" subtitle="Successor development toward readiness">
      <Surface className="overflow-x-auto p-0">
        {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No development actions yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="px-4 py-2">Employee</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Description</th><th className="px-4 py-2">Due</th><th className="px-4 py-2">Status</th></tr></thead>
            <tbody>{(data ?? []).map((a) => (
              <tr key={a.id} className="border-b border-border/60"><td className="px-4 py-2 font-medium">{a.display_name}</td><td className="px-4 py-2 text-ink-muted">{a.action_type}</td><td className="px-4 py-2 text-ink-muted">{a.description}</td><td className="px-4 py-2 text-ink-muted">{a.due_date ?? '—'}</td><td className="px-4 py-2 text-ink-muted">{a.status}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── Reports (coverage) ───────────────────────────────────────────────────────
type CoverageRep = { rows: Array<{ roleTitle: string; department: string; criticality: string; incumbent: string; successors: number; readyNow: number; coverage: string }> };

export function SuccessionReportsPage() {
  useDocumentTitle('Succession Reports');
  const { data, loading } = useSucc<CoverageRep>('/api/hr/succession/reports/coverage');
  return (
    <Shell title="Reports" subtitle="Succession coverage report">
      <Surface className="overflow-x-auto p-0">
        {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (data?.rows ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No data.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="px-4 py-2">Role</th><th className="px-4 py-2">Department</th><th className="px-4 py-2">Criticality</th><th className="px-4 py-2">Incumbent</th><th className="px-4 py-2">Successors</th><th className="px-4 py-2">Ready Now</th><th className="px-4 py-2">Coverage</th></tr></thead>
            <tbody>{(data?.rows ?? []).map((r, i) => (
              <tr key={i} className="border-b border-border/60"><td className="px-4 py-2">{r.roleTitle}</td><td className="px-4 py-2 text-ink-muted">{r.department}</td><td className="px-4 py-2 text-ink-muted">{r.criticality}</td><td className="px-4 py-2 text-ink-muted">{r.incumbent}</td><td className="px-4 py-2 tabular-nums">{r.successors}</td><td className="px-4 py-2 tabular-nums">{r.readyNow}</td><td className="px-4 py-2"><span className={`text-xs font-medium ${r.coverage === 'COVERED' ? 'text-emerald-600' : 'text-red-600'}`}>{r.coverage}</span></td></tr>
            ))}</tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── HOD: Team Talent ─────────────────────────────────────────────────────────
export function SuccessionTeamTalentPage() {
  useDocumentTitle('Team Talent');
  const dash = useSucc<Dashboard>('/api/hr/succession/dashboard');
  const risk = useSucc<{ flags: Array<{ type: string; roleTitle: string; detail: string }>; count: number }>('/api/hr/succession/risk');
  const nav = [{ to: '/hr/succession/team', label: 'Team Talent' }, { to: '/hr/succession/matrix', label: 'Talent Matrix' }, { to: '/hr/succession/actions', label: 'Development' }];
  return (
    <Shell title="Team Talent" subtitle="Your department's succession & talent" nav={nav}>
      <StatStrip loading={dash.loading} items={[
        { label: 'Critical Roles', value: n(dash.data?.kpis.criticalRoles) },
        { label: 'Covered', value: n(dash.data?.kpis.coveredRoles) },
        { label: 'Coverage %', value: n(dash.data?.kpis.coveragePct) },
        { label: 'Open Actions', value: n(dash.data?.kpis.openDevelopmentActions) },
      ]} />
      <Surface className="p-0">
        <div className="border-b border-border px-4 py-3"><SectionTitle title="Talent risk flags" /></div>
        {risk.loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (risk.data?.flags ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No risk flags.</p>
        ) : (
          <ul className="divide-y divide-border">{(risk.data?.flags ?? []).slice(0, 20).map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{f.roleTitle}</p><p className="text-xs text-ink-muted">{f.detail}</p></div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{f.type.replace(/_/g, ' ')}</span>
            </li>
          ))}</ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── Employee: My Development (confidential surface) ──────────────────────────
type MyDev = { linked: boolean; developmentActions: Array<{ id: number; action_type: string; description: string; due_date: string | null; status: string; linked_program: string | null }>; talentPools: Array<{ name: string; entry_date: string }> };

export function SuccessionMyDevelopmentPage() {
  useDocumentTitle('My Development');
  const { data, loading } = useSucc<MyDev>('/api/hr/succession/me/development');
  const nav = [{ to: '/hr/succession/me', label: 'My Development' }];
  return (
    <Shell title="My Development" subtitle="Your assigned development actions and talent groups" nav={nav}>
      <Surface className="p-0">
        <div className="border-b border-border px-4 py-3"><SectionTitle title="Development actions" /></div>
        {loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (data?.developmentActions ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No development actions assigned.</p>
        ) : (
          <ul className="divide-y divide-border">{(data?.developmentActions ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{a.description}</p><p className="text-xs text-ink-muted">{a.action_type}{a.linked_program ? ` · ${a.linked_program}` : ''} · due {a.due_date ?? '—'}</p></div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{a.status}</span>
            </li>
          ))}</ul>
        )}
      </Surface>
      {(data?.talentPools ?? []).length > 0 && (
        <Surface className="p-4">
          <SectionTitle title="Talent groups" />
          <div className="flex flex-wrap gap-2">{(data?.talentPools ?? []).map((p, i) => <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{p.name}</span>)}</div>
        </Surface>
      )}
    </Shell>
  );
}
