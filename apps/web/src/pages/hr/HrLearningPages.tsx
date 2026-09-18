import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, SectionTitle, Skeleton, StatStrip, Surface, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

// ── Shared ───────────────────────────────────────────────────────────────────
function useLd<T>(path: string | null, deps: unknown[] = []): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setLoading(true);
    setError(null);
    api<T>(path)
      .then((d) => live && (setData(d), setLoading(false)))
      .catch((e) => live && (setError(e?.message ?? 'Failed'), setLoading(false)));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);
  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}

const EMP_NAV = [
  { to: '/hr/learning', label: 'My Learning' },
  { to: '/hr/learning/plan', label: 'Development Plan' },
  { to: '/hr/learning/catalogue', label: 'Catalogue' },
  { to: '/hr/learning/programs', label: 'My Programs' },
  { to: '/hr/learning/certificates', label: 'Certificates' },
  { to: '/hr/learning/history', label: 'History' },
];
const ADMIN_NAV = [
  { to: '/hr/ld', label: 'Dashboard' },
  { to: '/hr/ld/programs', label: 'Programs' },
  { to: '/hr/ld/compliance', label: 'Mandatory' },
];

function NavChips({ items }: { items: Array<{ to: string; label: string }> }) {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto">
      {items.map((n) => (
        <Link key={n.to} to={n.to}>
          <Button variant={pathname === n.to ? 'primary' : 'secondary'} className="!py-1.5 text-sm">{n.label}</Button>
        </Link>
      ))}
    </div>
  );
}

function Shell({ title, subtitle, nav = EMP_NAV, actions, children }: { title: string; subtitle: string; nav?: Array<{ to: string; label: string }>; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <NavChips items={nav} />
      {children}
    </div>
  );
}

function num(v: unknown): ReactNode { return v == null ? '—' : typeof v === 'number' ? v.toLocaleString() : String(v); }

// ── Employee: My Learning overview ───────────────────────────────────────────
type Overview = { linked: boolean; developmentNeedsOpen: number; programsInProgress: number; completedThisYear: number; certificates: number; mandatoryDue: number };
type Enrollment = { id: number; status: string; completion_status: string; program_id: number; title: string; start_date: string | null; program_status: string };

export function LdMyLearningPage() {
  useDocumentTitle('My Learning');
  const { data, loading } = useLd<Overview>('/api/hr/ld/me/overview');
  const enr = useLd<Enrollment[]>('/api/hr/ld/me/enrollments');
  return (
    <Shell title="My Learning" subtitle="Your development — needs, programs, certificates and history">
      <StatStrip
        loading={loading}
        items={[
          { label: 'Development Needs', value: num(data?.developmentNeedsOpen) },
          { label: 'In Progress', value: num(data?.programsInProgress) },
          { label: 'Completed (year)', value: num(data?.completedThisYear) },
          { label: 'Certificates', value: num(data?.certificates) },
          { label: 'Mandatory Due', value: num(data?.mandatoryDue) },
        ]}
      />
      <Surface className="p-4">
        <SectionTitle title="Current & upcoming programs" />
        {enr.loading ? <Skeleton className="h-24 w-full" /> : (enr.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">You are not enrolled in any programs yet. Browse the <Link className="text-indigo-600" to="/hr/learning/catalogue">catalogue</Link>.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(enr.data ?? []).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{e.title}</p>
                  <p className="text-xs text-ink-muted">{e.start_date ?? 'Unscheduled'} · {e.program_status}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${e.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : e.status === 'WAITLISTED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{e.completion_status === 'COMPLETED' ? 'Completed' : e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── Employee: Development Plan (needs) ───────────────────────────────────────
type Need = { id: number; development_area: string; target_competency: string | null; priority: string; status: string; source_type: string };

export function LdDevelopmentPlanPage() {
  useDocumentTitle('Development Plan');
  const { toast } = useToast();
  const { data, loading, reload } = useLd<Need[]>('/api/hr/ld/needs');
  const [area, setArea] = useState('');
  const [saving, setSaving] = useState(false);
  const add = async () => {
    if (!area.trim()) return;
    setSaving(true);
    try {
      await api('/api/hr/ld/needs', { method: 'POST', body: JSON.stringify({ developmentArea: area.trim(), priority: 'MEDIUM' }) });
      setArea('');
      reload();
      toast('Development need added', 'success');
    } catch (e) { toast((e as Error).message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Shell title="Development Plan" subtitle="Development needs from appraisal, self, manager or HR">
      <Surface className="p-4">
        <SectionTitle title="Add a self-identified need" />
        <div className="flex flex-wrap items-center gap-2">
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Advanced data structures" className="max-w-md flex-1" />
          <Button onClick={add} disabled={saving || !area.trim()}>Add need</Button>
        </div>
      </Surface>
      <Surface className="p-0">
        {loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No development needs yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{n.development_area}</p>
                  <p className="text-xs text-ink-muted">{n.source_type} · {n.priority}{n.target_competency ? ` · ${n.target_competency}` : ''}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{n.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── Employee: Catalogue ──────────────────────────────────────────────────────
type CatProgram = { id: number; title: string; delivery_mode: string; start_date: string | null; registrationOpen: boolean; provider_type: string };

export function LdCataloguePage() {
  useDocumentTitle('Training Catalogue');
  const { toast } = useToast();
  const { data, loading, reload } = useLd<{ programs: CatProgram[] }>('/api/hr/ld/catalogue');
  const [busy, setBusy] = useState<number | null>(null);
  const enroll = async (p: CatProgram) => {
    setBusy(p.id);
    try {
      const r = await api<{ status: string }>('/api/hr/ld/enroll', { method: 'POST', body: JSON.stringify({ programId: p.id }) });
      toast(r.status === 'CONFIRMED' ? 'Enrolled' : `Added to ${r.status.toLowerCase()}`, 'success');
      reload();
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(null); }
  };
  return (
    <Shell title="Training Catalogue" subtitle="Programs you are eligible for">
      {loading ? <Skeleton className="h-40 w-full" /> : (data?.programs ?? []).length === 0 ? (
        <Surface className="p-8 text-center text-sm text-ink-muted">No eligible programs open right now.</Surface>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.programs ?? []).map((p) => (
            <Surface key={p.id} className="flex flex-col gap-2 p-4">
              <p className="text-sm font-semibold text-ink">{p.title}</p>
              <p className="text-xs text-ink-muted">{p.delivery_mode} · {p.provider_type} · {p.start_date ?? 'Unscheduled'}</p>
              <div className="mt-auto pt-2">
                {p.registrationOpen ? (
                  <Button className="w-full !py-1.5 text-sm" onClick={() => enroll(p)} disabled={busy === p.id}>{busy === p.id ? 'Enrolling…' : 'Enroll'}</Button>
                ) : (
                  <span className="text-xs text-ink-muted">Registration not open</span>
                )}
              </div>
            </Surface>
          ))}
        </div>
      )}
    </Shell>
  );
}

// ── Employee: My Programs ────────────────────────────────────────────────────
export function LdMyProgramsPage() {
  useDocumentTitle('My Programs');
  const { data, loading } = useLd<Enrollment[]>('/api/hr/ld/me/enrollments');
  return (
    <Shell title="My Programs" subtitle="Programs you are enrolled in">
      <Surface className="p-0">
        {loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No enrollments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{e.title}</p><p className="text-xs text-ink-muted">{e.program_status}</p></div>
                <span className="shrink-0 text-xs font-medium text-ink-muted">{e.completion_status === 'COMPLETED' ? 'Completed' : e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── Employee: Certificates ───────────────────────────────────────────────────
type Cert = { id: number; title: string; certificate_type: string; certificate_number: string | null; status: string; issued_on: string | null; expires_on: string | null };

export function LdCertificatesPage() {
  useDocumentTitle('My Certificates');
  const { data, loading } = useLd<Cert[]>('/api/hr/ld/me/certificates');
  return (
    <Shell title="Certificates" subtitle="Internal and verified external training certificates">
      <Surface className="p-0">
        {loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No certificates yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                  <p className="text-xs text-ink-muted">{c.certificate_type}{c.certificate_number ? ` · ${c.certificate_number}` : ''} · {c.issued_on ?? '—'}{c.expires_on ? ` → ${c.expires_on}` : ''}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── Employee: History ────────────────────────────────────────────────────────
type Hist = { completions: Array<{ id: number; title: string; result: string; completed_at: string; category: string | null }>; certificates: Cert[] };

export function LdHistoryPage() {
  useDocumentTitle('Learning History');
  const { data, loading } = useLd<Hist>('/api/hr/ld/me/history');
  return (
    <Shell title="Learning History" subtitle="Your completed development activities">
      <Surface className="p-0">
        {loading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : (data?.completions ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No completed programs yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data?.completions ?? []).map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{h.title}</p><p className="text-xs text-ink-muted">{h.category ?? 'Training'} · {h.completed_at?.slice(0, 10)}</p></div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{h.result}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </Shell>
  );
}

// ── HR admin: Dashboard ──────────────────────────────────────────────────────
type AdminDash = { activePrograms: number; upcomingPrograms: number; employeesEnrolled: number; completions: number; certificatesIssued: number; developmentNeedsOpen: number; effectivenessReviewsPending: number; completionRate: number };

export function LdAdminDashboardPage() {
  useDocumentTitle('L&D Dashboard');
  const { data, loading } = useLd<AdminDash>('/api/hr/ld/dashboard');
  return (
    <Shell title="Learning & Development" subtitle="Institution-wide employee development" nav={ADMIN_NAV}>
      <StatStrip
        loading={loading}
        items={[
          { label: 'Active Programs', value: num(data?.activePrograms) },
          { label: 'Upcoming', value: num(data?.upcomingPrograms) },
          { label: 'Enrolled', value: num(data?.employeesEnrolled) },
          { label: 'Completions', value: num(data?.completions) },
          { label: 'Completion %', value: num(data?.completionRate) },
          { label: 'Certificates', value: num(data?.certificatesIssued) },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatStrip loading={loading} items={[{ label: 'Development Needs Open', value: num(data?.developmentNeedsOpen) }]} />
        <StatStrip loading={loading} items={[{ label: 'Effectiveness Reviews Pending', value: num(data?.effectivenessReviewsPending) }]} />
        <Surface className="flex items-center justify-center p-4"><Link to="/hr/ld/programs"><Button>Manage programs</Button></Link></Surface>
      </div>
    </Shell>
  );
}

// ── HR admin: Programs list ──────────────────────────────────────────────────
type Program = { id: number; code: string; title: string; status: string; delivery_mode: string; start_date: string | null; capacity: number | null; is_mandatory: number };

export function LdProgramsPage() {
  useDocumentTitle('L&D Programs');
  const { data, loading } = useLd<Program[]>('/api/hr/ld/programs');
  return (
    <Shell title="Programs" subtitle="Scheduled employee training programs" nav={ADMIN_NAV}>
      <Surface className="overflow-x-auto p-0">
        {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No programs yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
              <th className="px-4 py-2">Program</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">Start</th><th className="px-4 py-2">Capacity</th>
            </tr></thead>
            <tbody>
              {(data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="px-4 py-2"><Link className="font-medium text-indigo-600" to={`/hr/ld/programs/${p.id}`}>{p.title}</Link>{p.is_mandatory ? <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">MANDATORY</span> : null}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.status}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.delivery_mode}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.start_date ?? '—'}</td>
                  <td className="px-4 py-2 tabular-nums text-ink-muted">{p.capacity ?? '∞'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── HR admin: Program detail ─────────────────────────────────────────────────
type ProgramDetail = { program: Program & { title: string }; sessions: Array<{ id: number; title: string; session_date: string | null }>; seats: { capacity: number | null; confirmed: number; waitlisted: number; remaining: number | null } };

export function LdProgramDetailPage() {
  const { id } = useParams();
  useDocumentTitle('Program');
  const { data, loading } = useLd<ProgramDetail>(id ? `/api/hr/ld/programs/${id}` : null);
  const enr = useLd<Array<{ id: number; display_name: string; status: string; completion_status: string }>>(id ? `/api/hr/ld/programs/${id}/enrollments` : null);
  return (
    <Shell title={data?.program?.title ?? 'Program'} subtitle="Program detail, sessions and participants" nav={ADMIN_NAV} actions={<Link to="/hr/ld/programs"><Button variant="secondary">Back</Button></Link>}>
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <>
          <StatStrip items={[
            { label: 'Status', value: data?.program.status ?? '—' },
            { label: 'Capacity', value: data?.seats.capacity ?? '∞' },
            { label: 'Confirmed', value: num(data?.seats.confirmed) },
            { label: 'Waitlisted', value: num(data?.seats.waitlisted) },
          ]} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Surface className="p-4">
              <SectionTitle title="Sessions" />
              {(data?.sessions ?? []).length === 0 ? <p className="text-sm text-ink-muted">No sessions.</p> : (
                <ul className="divide-y divide-border">{(data?.sessions ?? []).map((s) => (<li key={s.id} className="flex justify-between py-2 text-sm"><span>{s.title}</span><span className="text-ink-muted">{s.session_date ?? '—'}</span></li>))}</ul>
              )}
            </Surface>
            <Surface className="p-4">
              <SectionTitle title="Participants" />
              {(enr.data ?? []).length === 0 ? <p className="text-sm text-ink-muted">No participants.</p> : (
                <ul className="divide-y divide-border">{(enr.data ?? []).map((e) => (<li key={e.id} className="flex justify-between py-2 text-sm"><span className="truncate">{e.display_name}</span><span className="text-ink-muted">{e.completion_status === 'COMPLETED' ? 'Completed' : e.status}</span></li>))}</ul>
              )}
            </Surface>
          </div>
        </>
      )}
    </Shell>
  );
}

// ── HR admin: Mandatory compliance ───────────────────────────────────────────
type Compliance = { programs: Array<{ programId: number; title: string; assigned: number; completed: number; overdue: number; complianceRate: number }> };

export function LdCompliancePage() {
  useDocumentTitle('Mandatory Training');
  const { data, loading } = useLd<Compliance>('/api/hr/ld/mandatory-compliance');
  return (
    <Shell title="Mandatory Training Compliance" subtitle="Assigned vs completed for mandatory programs" nav={ADMIN_NAV}>
      <Surface className="overflow-x-auto p-0">
        {loading ? <div className="p-4"><Skeleton className="h-32 w-full" /></div> : (data?.programs ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No mandatory programs.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="px-4 py-2">Program</th><th className="px-4 py-2">Assigned</th><th className="px-4 py-2">Completed</th><th className="px-4 py-2">Overdue</th><th className="px-4 py-2">Compliance</th></tr></thead>
            <tbody>{(data?.programs ?? []).map((p) => (
              <tr key={p.programId} className="border-b border-border/60"><td className="px-4 py-2">{p.title}</td><td className="px-4 py-2 tabular-nums">{p.assigned}</td><td className="px-4 py-2 tabular-nums">{p.completed}</td><td className="px-4 py-2 tabular-nums text-red-600">{p.overdue}</td><td className="px-4 py-2 tabular-nums font-medium">{p.complianceRate}%</td></tr>
            ))}</tbody>
          </table>
        )}
      </Surface>
    </Shell>
  );
}

// ── HOD: Team Development ─────────────────────────────────────────────────────
export function LdTeamDevelopmentPage() {
  useDocumentTitle('Team Development');
  const dash = useLd<AdminDash>('/api/hr/ld/dashboard');
  const comp = useLd<Compliance>('/api/hr/ld/mandatory-compliance');
  return (
    <Shell title="Team Development" subtitle="Your department's learning & development" nav={[{ to: '/hr/learning/team', label: 'Overview' }, ...ADMIN_NAV.slice(1)]}>
      <StatStrip loading={dash.loading} items={[
        { label: 'Active Programs', value: num(dash.data?.activePrograms) },
        { label: 'Enrolled', value: num(dash.data?.employeesEnrolled) },
        { label: 'Completions', value: num(dash.data?.completions) },
        { label: 'Needs Open', value: num(dash.data?.developmentNeedsOpen) },
      ]} />
      <Surface className="overflow-x-auto p-4">
        <SectionTitle title="Mandatory compliance" />
        {comp.loading ? <Skeleton className="h-24 w-full" /> : (comp.data?.programs ?? []).length === 0 ? <p className="text-sm text-ink-muted">No mandatory programs.</p> : (
          <ul className="divide-y divide-border">{(comp.data?.programs ?? []).map((p) => (<li key={p.programId} className="flex justify-between py-2 text-sm"><span className="truncate">{p.title}</span><span className="tabular-nums text-ink-muted">{p.complianceRate}%</span></li>))}</ul>
        )}
      </Surface>
    </Shell>
  );
}
