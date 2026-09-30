import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Network,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth, type User } from '../../auth/AuthContext';
import { BrandMark } from '../../components/Brand';
import { Button, Field, Input, PageHeader, PasswordInput, Select, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { cn } from '../../lib/utils';
import { StatusPill, statusToneFor } from '../lms/studentUi';

type AlumniProfile = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  usn: string;
  departmentName?: string | null;
  programName?: string | null;
  batchLabel?: string | null;
  graduationYear: number;
  lifecycleState: string;
  verificationState: string;
  headline?: string | null;
  biography?: string | null;
  currentCity?: string | null;
  currentCountry?: string | null;
  skills?: string[];
  interests?: string[];
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  networkingAvailable?: boolean;
  mentorshipAvailable?: boolean;
  mentorshipAreas?: string[];
  privacy?: Record<string, string>;
};

const nav = [
  { to: '/alumni', label: 'Home', icon: LayoutDashboard },
  { to: '/alumni/360', label: 'My 360', icon: UserRound },
  { to: '/alumni/profile', label: 'Profile', icon: UserRound },
  { to: '/alumni/network', label: 'Network', icon: Network },
  { to: '/alumni/events', label: 'Events', icon: CalendarDays },
  { to: '/alumni/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/alumni/recognition', label: 'Recognition', icon: Award },
  { to: '/alumni/contributions', label: 'Contributions', icon: HandCoins },
];

export function AlumniLoginPage() {
  useDocumentTitle('Alumni Login');
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
      const res = await api<{ token: string; user: User }>('/api/alumni-auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(form),
      });
      applySession(res.token, res.user);
      navigate('/alumni', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[minmax(340px,42%)_1fr]">
      <aside className="hidden bg-sidebar p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandMark inverted product="Alumni Portal" />
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">SkillonX ERP</p>
          <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight">
            Verified alumni access for profiles, events, opportunities, and institutional engagement.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Sign-in is limited to institution-verified graduates.
          </p>
        </div>
        <p className="text-xs text-white/35">Alumni Management Web</p>
      </aside>
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 lg:hidden">
            <BrandMark product="Alumni Portal" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">Verified alumni</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Sign in</h2>
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
        </form>
      </main>
    </div>
  );
}

export function AlumniPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[236px_1fr]">
      <aside className="border-b border-border bg-sidebar text-white md:min-h-screen md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:block">
          <BrandMark inverted product="Alumni" />
          <button
            type="button"
            className="md:hidden"
            onClick={() => {
              logout();
              navigate('/alumni/login');
            }}
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/alumni'}
                className={({ isActive }) => cn(
                  'flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition',
                  isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white',
                )}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="hidden p-4 text-xs text-white/45 md:block">
          <p>{user?.name}</p>
          <p className="mt-1 break-all">{user?.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/alumni/login');
            }}
            className="mt-4 inline-flex items-center gap-2 text-white/70 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Surface className="p-4">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Surface>
  );
}

export function AlumniDashboardPage() {
  useDocumentTitle('Alumni Home');
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api('/api/alumni/dashboard').then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Skeleton className="h-48 w-full" />;
  const profile: AlumniProfile = data.profile;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile.name}`}
        subtitle={[profile.headline, profile.departmentName, profile.graduationYear].filter(Boolean).join(' · ')}
        actions={<Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni/360">Open My 360</Link>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Profile completion" value={`${data.profileCompletion}%`} />
        <Metric label="Verification" value={profile.verificationState.replace(/_/g, ' ')} />
        <Metric label="Events" value={data.events?.length ?? 0} />
        <Metric label="Opportunities" value={data.opportunities?.length ?? 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="text-sm font-semibold">Network</h2>
          <p className="mt-2 text-sm text-ink-muted">{profile.currentCity || 'Location not shared'} · {profile.networkingAvailable ? 'Open to connect' : 'Not open to networking'}</p>
          <div className="mt-3 flex flex-wrap gap-2">{profile.skills?.slice(0, 8).map((s) => <StatusPill key={s} tone="muted">{s}</StatusPill>)}</div>
        </Surface>
        <Surface>
          <h2 className="text-sm font-semibold">Upcoming Events</h2>
          <div className="mt-3 space-y-3">
            {(data.events ?? []).slice(0, 3).map((e: any) => (
              <div key={e.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div><p className="font-medium">{e.title}</p><p className="text-sm text-ink-muted">{new Date(e.starts_at).toLocaleString()}</p></div>
                <StatusPill tone="muted">{e.registration_status ?? 'Open'}</StatusPill>
              </div>
            ))}
            {!(data.events ?? []).length ? <p className="text-sm text-ink-muted">No published alumni events.</p> : null}
          </div>
        </Surface>
      </div>
      <Surface>
        <h2 className="text-sm font-semibold">Notices</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(data.notices ?? []).map((n: any) => (
            <div key={n.id} className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{n.body}</p>
            </div>
          ))}
          {!(data.notices ?? []).length ? <p className="text-sm text-ink-muted">No alumni notices.</p> : null}
        </div>
      </Surface>
    </div>
  );
}

const visibilityOptions = ['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC'];

export function AlumniProfilePage() {
  useDocumentTitle('Alumni Profile');
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState('');
  useEffect(() => {
    api<{ profile: AlumniProfile }>('/api/alumni/profile').then((res) => {
      setProfile(res.profile);
      setForm({
        headline: res.profile.headline ?? '',
        biography: res.profile.biography ?? '',
        currentCity: res.profile.currentCity ?? '',
        currentCountry: res.profile.currentCountry ?? '',
        skills: (res.profile.skills ?? []).join(', '),
        interests: (res.profile.interests ?? []).join(', '),
        linkedinUrl: res.profile.linkedinUrl ?? '',
        websiteUrl: res.profile.websiteUrl ?? '',
        networkingAvailable: Boolean(res.profile.networkingAvailable),
        mentorshipAvailable: Boolean(res.profile.mentorshipAvailable),
        mentorshipAreas: (res.profile.mentorshipAreas ?? []).join(', '),
        emailVisibility: res.profile.privacy?.email ?? 'INSTITUTION_ONLY',
        phoneVisibility: res.profile.privacy?.phone ?? 'PRIVATE',
        bioVisibility: res.profile.privacy?.biography ?? 'ALUMNI_NETWORK',
        employmentVisibility: res.profile.privacy?.employment ?? 'ALUMNI_NETWORK',
        socialVisibility: res.profile.privacy?.social ?? 'ALUMNI_NETWORK',
        networkingVisibility: res.profile.privacy?.networking ?? 'ALUMNI_NETWORK',
      });
    });
  }, []);
  const save = async () => {
    const payload = {
      ...form,
      skills: String(form.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      interests: String(form.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
      mentorshipAreas: String(form.mentorshipAreas || '').split(',').map((s) => s.trim()).filter(Boolean),
      linkedinUrl: form.linkedinUrl || null,
      websiteUrl: form.websiteUrl || null,
    };
    const res = await api<{ profile: AlumniProfile }>('/api/alumni/profile', { method: 'PATCH', body: JSON.stringify(payload) });
    setProfile(res.profile);
    setMessage('Profile saved.');
  };
  if (!profile) return <Skeleton className="h-52 w-full" />;
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle={`${profile.usn} · ${profile.departmentName ?? 'Department unavailable'} · ${profile.graduationYear}`} actions={<Button onClick={save}>Save</Button>} />
      {message ? <div className="rounded-[var(--radius-md)] border border-success/20 bg-success-soft p-3 text-sm text-success">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Surface className="space-y-4">
          <Field label="Professional headline"><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
          <Field label="Biography"><Textarea value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current city"><Input value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} /></Field>
            <Field label="Current country"><Input value={form.currentCountry} onChange={(e) => setForm({ ...form, currentCountry: e.target.value })} /></Field>
          </div>
          <Field label="Skills"><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></Field>
          <Field label="Interests"><Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn URL"><Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} /></Field>
            <Field label="Website URL"><Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} /></Field>
          </div>
        </Surface>
        <Surface className="space-y-4">
          <h2 className="text-sm font-semibold">Privacy & Mentorship</h2>
          {[
            ['emailVisibility', 'Email'],
            ['phoneVisibility', 'Phone'],
            ['bioVisibility', 'Biography'],
            ['employmentVisibility', 'Employment'],
            ['socialVisibility', 'Social links'],
            ['networkingVisibility', 'Networking'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                {visibilityOptions.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
          ))}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.networkingAvailable} onChange={(e) => setForm({ ...form, networkingAvailable: e.target.checked })} /> Open to networking</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.mentorshipAvailable} onChange={(e) => setForm({ ...form, mentorshipAvailable: e.target.checked })} /> Open to mentoring</label>
          <Field label="Mentorship areas"><Input value={form.mentorshipAreas} onChange={(e) => setForm({ ...form, mentorshipAreas: e.target.value })} /></Field>
        </Surface>
      </div>
      <EmploymentStudiesPanel />
    </div>
  );
}

function EmploymentStudiesPanel() {
  const [employment, setEmployment] = useState<any[]>([]);
  const [studies, setStudies] = useState<any[]>([]);
  const [emp, setEmp] = useState({ organization: '', designation: '', industry: '', location: '', isCurrent: true });
  const [study, setStudy] = useState({ institution: '', programName: '', country: '', status: 'CURRENT' });
  const reload = () => {
    api<{ employment: any[] }>('/api/alumni/employment').then((r) => setEmployment(r.employment));
    api<{ higherStudies: any[] }>('/api/alumni/higher-studies').then((r) => setStudies(r.higherStudies));
  };
  useEffect(reload, []);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Surface>
        <h2 className="text-sm font-semibold">Employment</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="Organization" value={emp.organization} onChange={(e) => setEmp({ ...emp, organization: e.target.value })} />
          <Input placeholder="Designation" value={emp.designation} onChange={(e) => setEmp({ ...emp, designation: e.target.value })} />
          <Input placeholder="Industry" value={emp.industry} onChange={(e) => setEmp({ ...emp, industry: e.target.value })} />
          <Input placeholder="Location" value={emp.location} onChange={(e) => setEmp({ ...emp, location: e.target.value })} />
        </div>
        <Button className="mt-3" size="sm" onClick={async () => { await api('/api/alumni/employment', { method: 'POST', body: JSON.stringify(emp) }); setEmp({ organization: '', designation: '', industry: '', location: '', isCurrent: true }); reload(); }}>Add employment</Button>
        <div className="mt-4 space-y-3">{employment.map((e) => <div key={e.id} className="border-t border-border pt-3"><p className="font-medium">{e.organization}</p><p className="text-sm text-ink-muted">{e.designation || 'Role'} · {e.industry || 'Industry'} · {e.location || 'Location'}</p></div>)}</div>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">Higher Studies</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="Institution" value={study.institution} onChange={(e) => setStudy({ ...study, institution: e.target.value })} />
          <Input placeholder="Program" value={study.programName} onChange={(e) => setStudy({ ...study, programName: e.target.value })} />
          <Input placeholder="Country" value={study.country} onChange={(e) => setStudy({ ...study, country: e.target.value })} />
          <Select value={study.status} onChange={(e) => setStudy({ ...study, status: e.target.value })}><option>CURRENT</option><option>COMPLETED</option><option>DEFERRED</option></Select>
        </div>
        <Button className="mt-3" size="sm" onClick={async () => { await api('/api/alumni/higher-studies', { method: 'POST', body: JSON.stringify(study) }); setStudy({ institution: '', programName: '', country: '', status: 'CURRENT' }); reload(); }}>Add study</Button>
        <div className="mt-4 space-y-3">{studies.map((s) => <div key={s.id} className="border-t border-border pt-3"><p className="font-medium">{s.institution}</p><p className="text-sm text-ink-muted">{s.program_name || 'Program'} · {s.country || 'Location'} · {s.status}</p></div>)}</div>
      </Surface>
    </div>
  );
}

export function AlumniNetworkPage() {
  useDocumentTitle('Alumni Network');
  const [q, setQ] = useState('');
  const [data, setData] = useState<any>({ alumni: [] });
  const search = () => api(`/api/alumni/directory?q=${encodeURIComponent(q)}`).then(setData);
  useEffect(() => { search(); }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Network" subtitle="Verified alumni directory with backend privacy filtering." />
      <Surface className="flex flex-col gap-2 sm:flex-row"><Input placeholder="Search by name, headline, or city" value={q} onChange={(e) => setQ(e.target.value)} /><Button onClick={search}>Search</Button></Surface>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data.alumni ?? []).map((a: AlumniProfile) => (
          <Surface key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{a.name}</p><p className="text-sm text-ink-muted">{a.headline || a.programName || 'Alumnus'}</p></div>
              <StatusPill tone="success">{a.graduationYear}</StatusPill>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{[a.currentCity, a.departmentName].filter(Boolean).join(' · ') || 'Institutional profile'}</p>
            <div className="mt-3 flex flex-wrap gap-2">{a.skills?.slice(0, 5).map((s) => <StatusPill key={s} tone="muted">{s}</StatusPill>)}</div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function AlumniEventsPage() {
  useDocumentTitle('Alumni Events');
  const [events, setEvents] = useState<any[]>([]);
  const reload = () => api<{ events: any[] }>('/api/alumni/events').then((r) => setEvents(r.events));
  useEffect(() => {
    void reload();
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Events" subtitle="Published alumni events and registrations." />
      <div className="grid gap-3 lg:grid-cols-2">
        {events.map((event) => (
          <Surface key={event.id}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{event.title}</p><p className="text-sm text-ink-muted">{new Date(event.starts_at).toLocaleString()} · {event.venue || 'Venue TBA'}</p></div>
              <StatusPill tone={event.registration_status ? 'success' : 'muted'}>{event.registration_status ?? 'Open'}</StatusPill>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-ink-muted">{event.description}</p>
            <Button className="mt-4" size="sm" disabled={Boolean(event.registration_status)} onClick={async () => { await api(`/api/alumni/events/${event.id}/register`, { method: 'POST' }); reload(); }}>Register</Button>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function AlumniOpportunitiesPage() {
  useDocumentTitle('Alumni Opportunities');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', opportunityType: 'JOB', organization: '', location: '', description: '', applicationUrl: '' });
  const reload = () => api<{ opportunities: any[] }>('/api/alumni/opportunities').then((r) => setOpportunities(r.opportunities));
  useEffect(() => {
    void reload();
  }, []);
  const submit = async () => {
    await api('/api/alumni/opportunities', { method: 'POST', body: JSON.stringify({ ...form, applicationUrl: form.applicationUrl || null }) });
    setForm({ title: '', opportunityType: 'JOB', organization: '', location: '', description: '', applicationUrl: '' });
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Opportunities" subtitle="Approved opportunities are visible to the alumni network." />
      <Surface className="space-y-3">
        <h2 className="text-sm font-semibold">Submit for moderation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.opportunityType} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}><option>JOB</option><option>INTERNSHIP</option><option>REFERRAL</option><option>MENTORSHIP</option><option>PROJECT</option><option>COLLABORATION</option></Select>
          <Input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input placeholder="Application URL" value={form.applicationUrl} onChange={(e) => setForm({ ...form, applicationUrl: e.target.value })} />
        <Button onClick={submit}>Submit</Button>
      </Surface>
      <div className="grid gap-3 md:grid-cols-2">
        {opportunities.map((o) => <Surface key={o.id}><p className="font-semibold">{o.title}</p><p className="mt-1 text-sm text-ink-muted">{o.opportunity_type} · {o.organization || 'Organization'} · {o.location || 'Location'}</p><p className="mt-3 line-clamp-3 text-sm text-ink-muted">{o.description}</p></Surface>)}
      </div>
    </div>
  );
}

export function AlumniMentorshipPage() {
  useDocumentTitle('Alumni Mentorship');
  return <AlumniProfilePage />;
}

export function AlumniContributionsPage() {
  useDocumentTitle('Alumni Contributions');
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ purpose: 'GENERAL', amount: '', note: '' });
  const reload = () => api<{ contributions: any[] }>('/api/alumni/contributions').then((r) => setRows(r.contributions));
  useEffect(() => {
    void reload();
  }, []);
  const submit = async () => {
    await api('/api/alumni/contributions', { method: 'POST', body: JSON.stringify({ ...form, amount: form.amount ? Number(form.amount) : null, idempotencyKey: `web-${Date.now()}` }) });
    setForm({ purpose: 'GENERAL', amount: '', note: '' });
    reload();
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Contributions" subtitle="Contribution intents are recorded here; Finance remains canonical for payments and receipts." />
      <Surface className="grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto]">
        <Select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}><option>GENERAL</option><option>SCHOLARSHIP</option><option>DEPARTMENT_DEVELOPMENT</option><option>LAB_SUPPORT</option><option>STUDENT_SUPPORT</option><option>EVENT_SPONSORSHIP</option></Select>
        <Input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <Input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <Button onClick={submit}>Record</Button>
      </Surface>
      <Surface className="overflow-x-auto" padded={false}>
        <table className="w-full min-w-[620px] text-sm">
          <thead><tr className="border-b text-left text-ink-muted"><th className="p-3">Purpose</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Receipt</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="p-3">{r.purpose}</td><td className="p-3">{r.amount ?? '—'}</td><td className="p-3">{r.status}</td><td className="p-3">{r.finance_receipt_id ?? 'Finance pending'}</td></tr>)}</tbody>
        </table>
      </Surface>
    </div>
  );
}

export function AlumniAdminPage() {
  useDocumentTitle('Alumni Administration');
  const [overview, setOverview] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const reload = () => {
    api('/api/alumni-admin/overview').then(setOverview);
    api<{ profiles: any[] }>('/api/alumni-admin/profiles?verificationState=PENDING').then((r) => setProfiles(r.profiles));
    api<{ profiles: any[] }>('/api/alumni-admin/profiles?limit=30').then((r) => setAllProfiles(r.profiles));
  };
  useEffect(reload, []);
  const totals = overview?.totals ?? {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Administration"
        subtitle="Verification, Alumni 360, relationship CRM, and lifecycle controls."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/recognition">Recognition</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/assistant">Assistant</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/engagement">Engagement</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM workspace</Link>
          </div>
        )}
      />
      {message ? <div className="rounded-[var(--radius-md)] border border-success/20 bg-success-soft p-3 text-sm text-success">{message}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total alumni" value={totals.alumni ?? 0} />
        <Metric label="Verified" value={totals.verified ?? 0} />
        <Metric label="Pending" value={totals.pendingVerification ?? 0} />
        <Metric label="Employed" value={totals.employed ?? 0} />
      </div>
      <Surface>
        <h2 className="text-sm font-semibold">Verification Queue</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left text-ink-muted"><th className="p-3">Name</th><th className="p-3">USN</th><th className="p-3">Program</th><th className="p-3">Year</th><th className="p-3">Action</th></tr></thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">{p.name}</td><td className="p-3">{p.usn}</td><td className="p-3">{p.programName ?? '—'}</td><td className="p-3">{p.graduationYear}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={async () => { await api(`/api/alumni-admin/profiles/${p.id}/verify`, { method: 'POST' }); setMessage('Profile verified.'); reload(); }}><ShieldCheck size={14} /> Verify</Button>
                      <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted" to={`/alumni-admin/profiles/${p.id}/360`}>360</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!profiles.length ? <tr><td className="p-3 text-ink-muted" colSpan={5}>No pending alumni profiles.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">Alumni 360 directory</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left text-ink-muted"><th className="p-3">Name</th><th className="p-3">USN</th><th className="p-3">Status</th><th className="p-3">Year</th><th className="p-3">View</th></tr></thead>
            <tbody>
              {allProfiles.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.usn}</td>
                  <td className="p-3">{p.verificationState}</td>
                  <td className="p-3">{p.graduationYear}</td>
                  <td className="p-3"><Link className="text-sm font-medium underline-offset-2 hover:underline" to={`/alumni-admin/profiles/${p.id}/360`}>Open 360</Link></td>
                </tr>
              ))}
              {!allProfiles.length ? <tr><td className="p-3 text-ink-muted" colSpan={5}>No alumni profiles.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Surface>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="text-sm font-semibold">By Department</h2>
          <div className="mt-3 space-y-2">{(overview?.byDepartment ?? []).map((r: any) => <p key={r.name ?? 'Unknown'} className="flex justify-between text-sm"><span>{r.name ?? 'Unknown'}</span><span>{r.count}</span></p>)}</div>
        </Surface>
        <Surface>
          <h2 className="text-sm font-semibold">By Graduation Year</h2>
          <div className="mt-3 space-y-2">{(overview?.byGraduationYear ?? []).map((r: any) => <p key={r.graduation_year} className="flex justify-between text-sm"><span>{r.graduation_year}</span><span>{r.count}</span></p>)}</div>
        </Surface>
      </div>
    </div>
  );
}
