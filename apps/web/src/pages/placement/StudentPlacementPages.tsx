import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill, statusToneFor } from '../lms/studentUi';

type HomeData = {
  profileCompletion: number;
  placementStatus: string;
  academicSummary: { usn: string; program: string | null; cgpa: number | null; activeBacklogs: number };
  applicationCount: number;
  offerCount: number;
  openOpportunityCount: number;
};

export function StudentPlacementsHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  useDocumentTitle('Career & Placements');

  useEffect(() => {
    api<HomeData>('/api/student/placements').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Career & Placements" subtitle="Your placement journey at a glance" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Profile completion</p>
          <p className="mt-1 text-2xl font-semibold">{data.profileCompletion}%</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Status</p>
          <StatusPill tone={statusToneFor(data.placementStatus)}>{data.placementStatus.replace(/_/g, ' ')}</StatusPill>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">CGPA</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.academicSummary.cgpa ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Open opportunities</p>
          <p className="mt-1 text-2xl font-semibold">{data.openOpportunityCount}</p>
        </Surface>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/lms/placements/profile"><Button variant="secondary">Career Profile</Button></Link>
        <Link to="/lms/placements/opportunities"><Button variant="secondary">Opportunities</Button></Link>
        <Link to="/lms/placements/applications"><Button variant="secondary">Applications ({data.applicationCount})</Button></Link>
        <Link to="/lms/placements/offers"><Button variant="secondary">Offers ({data.offerCount})</Button></Link>
        <Link to="/lms/placements/training"><Button variant="secondary">Training</Button></Link>
      </div>
    </div>
  );
}

export function StudentCareerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [headline, setHeadline] = useState('');
  const [objective, setObjective] = useState('');
  const [skillName, setSkillName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  useDocumentTitle('Career Profile');

  const load = () => api<any>('/api/student/placements/profile').then((d) => {
    setProfile(d);
    setHeadline(d.profile?.headline ?? '');
    setObjective(d.profile?.careerObjective ?? '');
  });

  useEffect(() => { load(); }, []);

  if (!profile) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Career Profile" subtitle="Build your placement-ready profile" />
      <Surface className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Academic Summary (read-only)</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><span className="text-ink-muted">USN:</span> {profile.academic.usn}</div>
          <div><span className="text-ink-muted">Program:</span> {profile.academic.program}</div>
          <div><span className="text-ink-muted">CGPA:</span> {profile.academic.cgpa ?? '—'}</div>
          <div><span className="text-ink-muted">Active backlogs:</span> {profile.academic.activeBacklogs}</div>
        </div>
      </Surface>
      <Surface className="space-y-3 p-4">
        <Field label="Headline"><Input value={headline} onChange={(e) => setHeadline(e.target.value)} /></Field>
        <Field label="Career objective"><Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={4} /></Field>
        <Button onClick={() => api('/api/student/placements/profile', { method: 'PUT', body: JSON.stringify({ headline, careerObjective: objective }) }).then(load)}>
          Save profile
        </Button>
      </Surface>
      <Surface className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((s: any) => (
            <StatusPill key={s.id} tone="muted">{s.skill_name} · {s.level}</StatusPill>
          ))}
        </div>
        <div className="flex gap-2">
          <Field label="Add skill"><Input value={skillName} onChange={(e) => setSkillName(e.target.value)} /></Field>
          <Button className="self-end" onClick={() => api('/api/student/placements/skills', { method: 'POST', body: JSON.stringify({ skillName }) }).then(() => { setSkillName(''); load(); })}>
            Add
          </Button>
        </div>
      </Surface>
      <Surface className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Projects</h2>
        <ul className="space-y-2 text-sm">
          {profile.projects?.map((p: any) => <li key={p.id}><strong>{p.title}</strong> — {p.project_type}</li>)}
        </ul>
        <div className="flex gap-2">
          <Field label="Project title"><Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} /></Field>
          <Button className="self-end" onClick={() => api('/api/student/placements/projects', { method: 'POST', body: JSON.stringify({ title: projectTitle }) }).then(() => { setProjectTitle(''); load(); })}>
            Add
          </Button>
        </div>
      </Surface>
      <Link to="/lms/placements/resume"><Button>Preview Resume</Button></Link>
    </div>
  );
}

export function StudentResumePage() {
  const [resume, setResume] = useState<any>(null);
  useDocumentTitle('Resume');

  useEffect(() => {
    api<any>('/api/student/placements/resume').then(setResume).catch(() => setResume(null));
  }, []);

  if (!resume) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Resume Preview" subtitle="Generated from your canonical profile data" />
      <Surface className="resume-print mx-auto max-w-[210mm] space-y-4 p-8 print:shadow-none">
        <div>
          <h1 className="text-2xl font-bold">{resume.personal.name}</h1>
          <p className="text-sm text-ink-muted">{resume.personal.usn} · {resume.personal.email}</p>
        </div>
        {resume.sections.headline ? <p className="font-medium">{resume.sections.headline}</p> : null}
        {resume.sections.careerObjective ? <p className="text-sm">{resume.sections.careerObjective}</p> : null}
        <section>
          <h2 className="border-b pb-1 text-sm font-semibold uppercase">Education</h2>
          <p className="text-sm">{resume.sections.academic.program} · CGPA {resume.sections.academic.cgpa ?? '—'}</p>
        </section>
        <section>
          <h2 className="border-b pb-1 text-sm font-semibold uppercase">Skills</h2>
          <p className="text-sm">{resume.sections.skills?.map((s: any) => s.skill_name).join(', ')}</p>
        </section>
        <section>
          <h2 className="border-b pb-1 text-sm font-semibold uppercase">Projects</h2>
          <ul className="text-sm">
            {resume.sections.projects?.map((p: any) => <li key={p.id}>{p.title}</li>)}
          </ul>
        </section>
      </Surface>
      <Button onClick={() => window.print()}>Print / Save PDF</Button>
    </div>
  );
}

export function StudentOpportunitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  useDocumentTitle('Placement Opportunities');

  useEffect(() => {
    const q = filter ? `?filter=${filter}` : '';
    api<{ opportunities: any[] }>(`/api/student/placements/opportunities${q}`).then((d) => setItems(d.opportunities)).catch(() => setItems([]));
  }, [filter]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Opportunities" subtitle="Discover eligible campus drives" />
      <div className="flex flex-wrap gap-2">
        {['', 'eligible', 'applied'].map((f) => (
          <Button key={f || 'all'} variant={filter === f ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(f)}>
            {f === '' ? 'All Open' : f === 'eligible' ? 'Eligible' : 'Applied'}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((o) => (
          <Link key={o.id} to={`/lms/placements/opportunities/${o.id}`}>
            <Surface className="h-full p-4 transition hover:border-brand/40">
              <p className="text-xs text-ink-muted">{o.companyName}</p>
              <h3 className="font-semibold">{o.role || o.title}</h3>
              <p className="mt-1 text-sm tabular-nums">
                {o.ctcMin != null ? `₹${o.ctcMin}${o.ctcMax ? `–${o.ctcMax}` : ''} LPA` : o.stipend ? `₹${o.stipend} stipend` : '—'}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <StatusPill tone={o.eligibilityStatus === 'ELIGIBLE' || o.eligibilityStatus === 'ELIGIBLE_WITH_OVERRIDE' ? 'success' : 'warning'}>
                  {o.eligibilityStatus.replace(/_/g, ' ')}
                </StatusPill>
                {o.deadline ? <span className="text-xs text-ink-muted">Due {o.deadline}</span> : null}
              </div>
            </Surface>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StudentOpportunityDetailPage() {
  const { id } = useParams();
  const [opp, setOpp] = useState<any>(null);
  useDocumentTitle('Opportunity');

  useEffect(() => {
    api<any>(`/api/student/placements/opportunities/${id}`).then(setOpp).catch(() => setOpp(null));
  }, [id]);

  if (!opp) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={opp.role || opp.title} subtitle={opp.companyName} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm whitespace-pre-wrap">{opp.description}</p>
        <h3 className="text-sm font-semibold">Your eligibility</h3>
        <ul className="space-y-1 text-sm">
          {opp.eligibility?.reasons?.map((r: any) => (
            <li key={r.code} className={r.passed ? 'text-success' : 'text-danger'}>
              {r.passed ? '✓' : '✕'} {r.message}
            </li>
          ))}
        </ul>
        {!opp.application ? (
          <Button
            disabled={opp.eligibility?.status === 'NOT_ELIGIBLE'}
            onClick={() => api(`/api/student/placements/opportunities/${id}/apply`, { method: 'POST', body: JSON.stringify({}) }).then(() => { window.location.href = '/lms/placements/applications'; })}
          >
            Apply now
          </Button>
        ) : (
          <StatusPill tone="muted">Applied · {opp.application.status}</StatusPill>
        )}
      </Surface>
    </div>
  );
}

export function StudentApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('My Applications');

  useEffect(() => {
    api<{ applications: any[] }>('/api/student/placements/applications').then((d) => setItems(d.applications)).catch(() => setItems([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Applications" subtitle="Track your placement applications" />
      <div className="space-y-3">
        {items.map((a) => (
          <Link key={a.id} to={`/lms/placements/applications/${a.id}`}>
            <Surface className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{a.companyName} — {a.title}</p>
                <p className="text-xs text-ink-muted">{a.applicationNumber}</p>
              </div>
              <StatusPill tone={statusToneFor(a.status)}>{a.status}</StatusPill>
            </Surface>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StudentApplicationDetailPage() {
  const { id } = useParams();
  const [app, setApp] = useState<any>(null);
  useDocumentTitle('Application');

  useEffect(() => {
    api<any>(`/api/student/placements/applications/${id}`).then(setApp).catch(() => setApp(null));
  }, [id]);

  if (!app) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={app.applicationNumber} subtitle={`${app.companyName} · ${app.title}`} />
      <StatusPill tone={statusToneFor(app.status)}>{app.status}</StatusPill>
      {app.rounds?.length ? (
        <Surface className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Hiring rounds</h2>
          <ul className="space-y-2 text-sm">
            {app.rounds.map((r: any, i: number) => (
              <li key={i}>{r.roundName} — {r.status} {r.result ? `· ${r.result}` : ''}</li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}

export function StudentOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  useDocumentTitle('Placement Offers');

  const load = () => api<{ offers: any[] }>('/api/student/placements/offers').then((d) => setOffers(d.offers)).catch(() => setOffers([]));
  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Offers" subtitle="Review and respond to placement offers" />
      {offers.map((o) => (
        <Surface key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{o.companyName}</p>
            <p className="text-sm">{o.role} · {o.ctc ? `₹${o.ctc} LPA` : '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={statusToneFor(o.offerStatus)}>{o.offerStatus}</StatusPill>
            {o.offerStatus === 'OFFERED' ? (
              <>
                <Button size="sm" onClick={() => api(`/api/student/placements/offers/${o.id}/accept`, { method: 'POST' }).then(load)}>Accept</Button>
                <Button size="sm" variant="secondary" onClick={() => api(`/api/student/placements/offers/${o.id}/decline`, { method: 'POST' }).then(load)}>Decline</Button>
              </>
            ) : null}
          </div>
        </Surface>
      ))}
    </div>
  );
}

export function StudentPlacementTrainingPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  useDocumentTitle('Placement Training');

  useEffect(() => {
    api<{ programs: any[] }>('/api/student/placements/training').then((d) => setPrograms(d.programs)).catch(() => setPrograms([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Training" subtitle="Placement readiness programs" />
      {programs.map((p) => (
        <Surface key={p.id} className="p-4">
          <p className="font-medium">{p.title}</p>
          <p className="text-sm text-ink-muted">{p.category} · {p.mode}</p>
          <StatusPill tone="muted">{p.completionStatus}</StatusPill>
        </Surface>
      ))}
    </div>
  );
}

export function StudentInternshipsPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('Internships');

  useEffect(() => {
    api<{ internships: any[] }>('/api/student/placements/internships').then((d) => setItems(d.internships)).catch(() => setItems([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Internships" subtitle="Internship applications and outcomes" />
      {items.map((i) => (
        <Surface key={i.id} className="p-4">
          <p className="font-medium">{i.company_name}</p>
          <p className="text-sm">{i.title}</p>
          <StatusPill tone={statusToneFor(i.status)}>{i.status}</StatusPill>
        </Surface>
      ))}
    </div>
  );
}

export function StudentPlacementCalendarPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Placement Calendar');

  useEffect(() => {
    api<any>('/api/student/placements/calendar').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Placement Calendar" subtitle="Deadlines, interviews, and training" />
      <Surface className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Application deadlines</h2>
        <ul className="space-y-1 text-sm">
          {data.deadlines?.map((d: any) => <li key={d.id}>{d.title} — {d.deadline}</li>)}
        </ul>
      </Surface>
      <Surface className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Interview rounds</h2>
        <ul className="space-y-1 text-sm">
          {data.rounds?.map((r: any, i: number) => <li key={i}>{r.name} — {r.scheduled_at ?? 'TBD'}</li>)}
        </ul>
      </Surface>
    </div>
  );
}
