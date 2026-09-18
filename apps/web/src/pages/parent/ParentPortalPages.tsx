import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  Bell,
  BookOpenCheck,
  Bus,
  GraduationCap,
  Home,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { api, setToken } from '../../lib/api';
import { useAuth, type User } from '../../auth/AuthContext';
import { BrandMark } from '../../components/Brand';
import { Button, Field, Input, PasswordInput, Select } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { cn } from '../../lib/utils';

type Child = {
  id: number;
  name: string;
  usn: string;
  relationshipType: string;
  programName?: string | null;
  departmentName?: string | null;
  semesterLabel?: string | null;
  sectionLabel?: string | null;
  academicYearLabel?: string | null;
};

type ParentCtx = {
  children: Child[];
  activeChild: Child | null;
  childId: number | null;
  setChildId: (id: number) => void;
  reloadChildren: () => Promise<void>;
};

function useParentCtx() {
  return useOutletContext<ParentCtx>();
}

export function ParentLoginPage() {
  useDocumentTitle('Parent Portal Login');
  const { applySession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string; user: User }>('/api/parent-auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(form),
      });
      applySession(res.token, res.user);
      navigate('/parent', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[minmax(340px,42%)_1fr]">
      <aside className="hidden bg-sidebar p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandMark inverted product="Parent Portal" />
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">SkillonX ERP</p>
          <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight">
            A verified guardian view of academics, fees, and campus services.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Access is limited to institution-verified parent-student relationships.
          </p>
        </div>
        <p className="text-xs text-white/35">Parent / Guardian Web Portal</p>
      </aside>
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 lg:hidden">
            <BrandMark product="Parent Portal" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">Parent / Guardian</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">Use the account verified by the institution.</p>
          {error ? <div className="mt-5 rounded-[var(--radius-md)] border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div> : null}
          <div className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password">
              <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in...' : 'Sign in'}</Button>
          </div>
          <Link to="/parent/forgot-password" className="mt-4 inline-block text-sm text-accent">Forgot password?</Link>
        </form>
      </main>
    </div>
  );
}

export function ParentForgotPasswordPage() {
  useDocumentTitle('Parent Password Reset');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await api<{ message: string }>('/api/parent-auth/forgot-password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email }),
    });
    setMessage(res.message);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm">
        <BrandMark product="Parent Portal" />
        <h1 className="mt-6 text-2xl font-semibold">Reset password</h1>
        <div className="mt-5 space-y-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">Send reset instructions</Button>
          {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
        </div>
      </form>
    </div>
  );
}

const nav = [
  { to: '/parent', label: 'Home', icon: Home },
  { to: '/parent/academics', label: 'Academics', icon: BookOpenCheck },
  { to: '/parent/attendance', label: 'Attendance', icon: GraduationCap },
  { to: '/parent/results', label: 'Results', icon: ShieldCheck },
  { to: '/parent/fees', label: 'Fees', icon: Banknote },
  { to: '/parent/campus', label: 'Campus Services', icon: Bus },
  { to: '/parent/notices', label: 'Notices', icon: Bell },
  { to: '/parent/profile', label: 'Profile', icon: UserRound },
];

export function ParentPortalLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState<number | null>(() => Number(localStorage.getItem('parent_child_id')) || null);
  const [loading, setLoading] = useState(true);

  const reloadChildren = async () => {
    const res = await api<{ children: Child[] }>('/api/parent/children');
    setChildren(res.children);
    const current = Number(localStorage.getItem('parent_child_id')) || childId;
    if ((!current || !res.children.some((c) => c.id === current)) && res.children[0]) setChildId(res.children[0].id);
  };

  useEffect(() => {
    reloadChildren().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (childId) localStorage.setItem('parent_child_id', String(childId));
  }, [childId]);

  const activeChild = useMemo(() => children.find((c) => c.id === childId) ?? children[0] ?? null, [children, childId]);
  const value = { children, activeChild, childId: activeChild?.id ?? null, setChildId, reloadChildren };

  const signOut = () => {
    logout();
    setToken(null);
    navigate('/parent/login', { replace: true });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading parent portal...</div>;

  return (
    <div className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-sidebar text-white lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between p-4 lg:block lg:p-5">
          <BrandMark inverted product="Parent" />
          <button className="lg:hidden" onClick={signOut} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:block lg:space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/parent'} className={({ isActive }) => cn('flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white', isActive && 'bg-white/15 text-white')}>
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Parent Portal</p>
              <h1 className="text-xl font-semibold">{activeChild ? activeChild.name : 'No linked child'}</h1>
              {activeChild ? <p className="text-sm text-ink-muted">{activeChild.usn} · {activeChild.programName || 'Program'} · {activeChild.semesterLabel || 'Semester'} {activeChild.sectionLabel || ''}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Select aria-label="Select child" value={activeChild?.id ?? ''} onChange={(e) => setChildId(Number(e.target.value))}>
                {children.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.relationshipType})</option>)}
              </Select>
              <Button variant="secondary" onClick={signOut}><LogOut size={16} /> Sign out</Button>
            </div>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-6">
          {activeChild ? <Outlet context={value} /> : <EmptyState title="No verified child links" text="Contact the institution to activate your parent-student relationship." />}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-ink-muted">{text}</p></div>;
}

function Metric({ label, value, tone }: { label: string; value: string | number | null | undefined; tone?: string }) {
  return <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"><p className="text-sm text-ink-muted">{label}</p><p className={cn('mt-2 text-2xl font-semibold', tone)}>{value ?? '-'}</p></div>;
}

function useChildData<T>(path: (childId: number) => string) {
  const { childId } = useParentCtx();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    setError('');
    api<T>(path(childId)).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load')).finally(() => setLoading(false));
  }, [childId]);
  return { data, loading, error };
}

export function ParentDashboardPage() {
  useDocumentTitle('Parent Dashboard');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/dashboard`);
  if (loading) return <EmptyState title="Loading dashboard" text="Fetching the latest verified information." />;
  if (error) return <EmptyState title="Could not load dashboard" text={error} />;
  const a = data?.attendance;
  const f = data?.finance;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Overall attendance" value={a?.overall != null ? `${a.overall}%` : '-'} tone={a?.overall < a?.policy?.minimumPercentage ? 'text-danger' : ''} />
        <Metric label="Below-threshold subjects" value={a?.belowCount ?? 0} />
        <Metric label="Outstanding fees" value={f?.summary?.totalOutstanding ?? f?.summary?.outstandingAmount ?? '0.00'} />
        <Metric label="Published results" value={data?.results?.length ?? 0} />
      </div>
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <h2 className="font-semibold">Action / Attention Required</h2>
        <div className="mt-3 grid gap-2">
          {data?.attention?.length ? data.attention.map((x: any) => <div key={`${x.kind}-${x.title}`} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface-muted p-3"><AlertTriangle className="mt-0.5 text-warning" size={18} /><div><p className="font-medium">{x.title}</p><p className="text-sm text-ink-muted">{x.detail}</p></div></div>) : <p className="text-sm text-ink-muted">No current parent-visible alerts.</p>}
        </div>
      </section>
    </div>
  );
}

export function ParentAttendancePage() {
  useDocumentTitle('Parent Attendance');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/attendance`);
  if (loading) return <EmptyState title="Loading attendance" text="Calculating from finalized attendance sessions." />;
  if (error) return <EmptyState title="Could not load attendance" text={error} />;
  return (
    <div className="space-y-4">
      <Metric label="Overall attendance" value={data?.overall != null ? `${data.overall}%` : '-'} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data?.subjects ?? []).map((s: any) => <div key={s.courseId} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"><p className="font-medium">{s.code} · {s.name}</p><p className="mt-2 text-2xl font-semibold">{s.percentage ?? '-'}%</p><p className="mt-1 text-sm text-ink-muted">Held {s.held ?? 0} · Present {s.present ?? 0} · Absent {s.absent ?? 0}</p></div>)}
      </div>
    </div>
  );
}

export function ParentAcademicsPage() {
  useDocumentTitle('Parent Academics');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/academics`);
  if (loading) return <EmptyState title="Loading academics" text="Reading published academic progress." />;
  if (error) return <EmptyState title="Could not load academics" text={error} />;
  const subjects = data?.performance?.subjects ?? [];
  return <ListPage title="Academic Snapshot" items={subjects.map((s: any) => ({ title: `${s.code ?? ''} ${s.name ?? ''}`, meta: `Performance ${s.percentage ?? s.score ?? '-'}` }))} empty="No parent-visible academic performance yet." />;
}

export function ParentResultsPage() {
  useDocumentTitle('Parent Results');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/results`);
  if (loading) return <EmptyState title="Loading results" text="Only officially published results are shown." />;
  if (error) return <EmptyState title="Could not load results" text={error} />;
  return <ListPage title="Published Results" items={(data?.results ?? []).map((r: any) => ({ title: `${r.examName} · ${r.semesterLabel}`, meta: `SGPA ${r.sgpa ?? '-'} · ${r.status}` }))} empty="No released results are available." />;
}

export function ParentFeesPage() {
  useDocumentTitle('Parent Fees');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/fees`);
  if (loading) return <EmptyState title="Loading fees" text="Reading Finance as the source of truth." />;
  if (error) return <EmptyState title="Could not load fees" text={error} />;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Demanded" value={data?.summary?.totalDemanded ?? data?.summary?.totalDemand ?? '-'} />
        <Metric label="Paid" value={data?.summary?.totalPaid ?? '-'} />
        <Metric label="Outstanding" value={data?.summary?.totalOutstanding ?? data?.summary?.outstandingAmount ?? '-'} />
      </div>
      <ListPage title="Recent Receipts" items={(data?.receipts ?? []).map((r: any) => ({ title: r.receiptNumber, meta: `${r.receiptDate} · ${r.amount} · ${r.status}` }))} empty="No receipts available." />
    </div>
  );
}

export function ParentCampusPage() {
  useDocumentTitle('Parent Campus Services');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/campus-services`);
  if (loading) return <EmptyState title="Loading campus services" text="Reading hostel and transport status." />;
  if (error) return <EmptyState title="Could not load campus services" text={error} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"><h2 className="font-semibold">Hostel</h2><p className="mt-2 text-sm text-ink-muted">{data?.hostel?.room ? `${data.hostel.room.hostelName} · Room ${data.hostel.room.roomNumber}` : 'No active parent-visible hostel allocation.'}</p></div>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"><h2 className="font-semibold">Transport</h2><p className="mt-2 text-sm text-ink-muted">{data?.transport?.assignment ? `${data.transport.assignment.routeName} · ${data.transport.assignment.pickupStop?.name ?? 'Pickup stop'}` : 'No active parent-visible transport assignment.'}</p></div>
    </div>
  );
}

export function ParentNoticesPage() {
  useDocumentTitle('Parent Notices');
  const { data, loading, error } = useChildData<any>((id) => `/api/parent/students/${id}/notices`);
  if (loading) return <EmptyState title="Loading notices" text="Fetching relevant announcements." />;
  if (error) return <EmptyState title="Could not load notices" text={error} />;
  return <ListPage title="Notices" items={(data?.notices ?? []).map((n: any) => ({ title: n.title, meta: n.body }))} empty="No notices available." />;
}

export function ParentProfilePage() {
  useDocumentTitle('Parent Profile');
  const { user } = useAuth();
  const { children } = useParentCtx();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"><h2 className="font-semibold">Profile</h2><p className="mt-3">{user?.name}</p><p className="text-sm text-ink-muted">{user?.email}</p></div>
      <ListPage title="Linked Students" items={children.map((c) => ({ title: c.name, meta: `${c.usn} · ${c.relationshipType}` }))} empty="No linked students." />
    </div>
  );
}

function ListPage({ title, items, empty }: { title: string; items: Array<{ title: string; meta?: string }>; empty: string }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 divide-y divide-border">
        {items.length ? items.map((item, idx) => <div key={`${item.title}-${idx}`} className="py-3"><p className="font-medium">{item.title}</p>{item.meta ? <p className="mt-1 text-sm text-ink-muted">{item.meta}</p> : null}</div>) : <p className="py-3 text-sm text-ink-muted">{empty}</p>}
      </div>
    </section>
  );
}
