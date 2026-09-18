import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

export function PlacementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Placement Dashboard');

  useEffect(() => {
    api<any>('/api/placements/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const cards = [
    { label: 'Registered Students', value: data.registeredStudents },
    { label: 'Applications', value: data.applications },
    { label: 'Unique Students Placed', value: data.uniqueStudentsPlaced },
    { label: 'Total Offers', value: data.totalOffers },
    { label: 'Open Opportunities', value: data.openOpportunities },
    { label: 'Companies', value: data.companyCount },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Training & Placement" subtitle="College-wide training and placement operations" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </Surface>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/placements/companies"><Button variant="secondary">Companies</Button></Link>
        <Link to="/placements/opportunities"><Button variant="secondary">Drives</Button></Link>
        <Link to="/placements/applications"><Button variant="secondary">Applications</Button></Link>
        <Link to="/placements/offers"><Button variant="secondary">Offers</Button></Link>
        <Link to="/placements/training"><Button variant="secondary">Training</Button></Link>
        <Link to="/placements/coordinators"><Button variant="secondary">Coordinators</Button></Link>
        <Link to="/placements/management"><Button variant="secondary">Analytics</Button></Link>
      </div>
    </div>
  );
}

export function PlacementCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [name, setName] = useState('');
  useDocumentTitle('Companies');

  const load = () => api<{ companies: any[] }>('/api/placements/companies').then((d) => setCompanies(d.companies)).catch(() => setCompanies([]));
  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Companies" subtitle="Placement company master" />
      <Surface className="flex flex-wrap gap-2 p-4">
        <Field label="Company name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Button className="self-end" onClick={() => api('/api/placements/companies', { method: 'POST', body: JSON.stringify({ name }) }).then(() => { setName(''); load(); })}>
          Add company
        </Button>
      </Surface>
      <div className="grid gap-3 md:grid-cols-2">
        {companies.map((c) => (
          <Surface key={c.id} className="p-4">
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-ink-muted">{c.industry || c.companyType}</p>
            <StatusPill tone="muted">{c.status}</StatusPill>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function PlacementOpportunitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('Opportunities');

  useEffect(() => {
    api<{ opportunities: any[] }>('/api/placements/opportunities').then((d) => setItems(d.opportunities)).catch(() => setItems([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Opportunities" subtitle="Manage placement drives" />
      {items.map((o) => (
        <Surface key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{o.companyName} — {o.title}</p>
            <p className="text-sm text-ink-muted">{o.role}</p>
          </div>
          <StatusPill tone="muted">{o.status}</StatusPill>
        </Surface>
      ))}
    </div>
  );
}

export function PlacementApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('Applications');

  useEffect(() => {
    api<{ applications: any[] }>('/api/placements/applications').then((d) => setItems(d.applications)).catch(() => setItems([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Applications" subtitle="Review and manage student applications" />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-ink-muted"><th className="p-2">USN</th><th className="p-2">Student</th><th className="p-2">Company</th><th className="p-2">Status</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.usn}</td>
                <td className="p-2">{a.studentName}</td>
                <td className="p-2">{a.companyName}</td>
                <td className="p-2"><StatusPill tone="muted">{a.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PlacementOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  useDocumentTitle('Offers');

  useEffect(() => {
    api<{ offers: any[] }>('/api/placements/offers').then((d) => setOffers(d.offers)).catch(() => setOffers([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Offers" subtitle="Placement offer management" />
      {offers.map((o: any) => (
        <Surface key={o.id} className="p-4">
          <p className="font-medium">{o.student_name} ({o.usn}) — {o.company_name}</p>
          <p className="text-sm">{o.role} · {o.ctc ? `₹${o.ctc}` : '—'}</p>
          <StatusPill tone="muted">{o.offer_status}</StatusPill>
        </Surface>
      ))}
    </div>
  );
}

export function PlacementTrainingAdminPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  useDocumentTitle('Training Admin');

  useEffect(() => {
    api<{ programs: any[] }>('/api/placements/training/programs').then((d) => setPrograms(d.programs)).catch(() => setPrograms([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Training Programs" subtitle="Placement readiness training" />
      {programs.map((p: any) => (
        <Surface key={p.id} className="p-4">
          <p className="font-medium">{p.title}</p>
          <p className="text-sm text-ink-muted">{p.category} · {p.mode}</p>
        </Surface>
      ))}
    </div>
  );
}

export function CoordinatorPlacementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Department Placement');

  useEffect(() => {
    api<any>('/api/placements/coordinator/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Department Coordinator" subtitle="Department-scoped placement progress" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Department Students', value: data.departmentStudentCount },
          { label: 'Profile Incomplete', value: data.profileIncomplete },
          { label: 'Placed', value: data.placedStudents },
          { label: 'Unplaced', value: data.unplacedStudents },
        ].map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold">{c.value}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function TrainerPlacementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Training Coordinator');

  useEffect(() => {
    api<any>('/api/placements/training-admin/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Trainer Dashboard" subtitle="Assigned training programs" />
      <p className="text-sm text-ink-muted">{data.programs?.length ?? 0} programs · {data.enrollments} enrollments · {data.sessions} sessions</p>
      {data.programs?.map((p: any) => (
        <Surface key={p.id} className="p-4">{p.title} · {p.category}</Surface>
      ))}
    </div>
  );
}

export function ManagementPlacementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Placement Analytics');

  useEffect(() => {
    api<any>('/api/placements/management/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Executive Placement Analytics" subtitle="Read-only institution metrics" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Registered (denominator)', value: data.registeredPlacementSeeking },
          { label: 'Unique Students Placed', value: data.uniqueStudentsPlaced },
          { label: 'Total Offers', value: data.totalOffers },
          { label: 'Placement %', value: `${data.placementPercentage}%` },
          { label: 'Highest CTC', value: data.highestCtc ?? '—' },
          { label: 'Average CTC', value: data.averageCtc ?? '—' },
          { label: 'Median CTC', value: data.medianCtc ?? '—' },
          { label: 'Joined', value: data.joined },
        ].map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{c.value}</p>
          </Surface>
        ))}
      </div>
      <p className="text-xs text-ink-muted">Placement rate denominator: {data.denominator}</p>
    </div>
  );
}

export function PlacementCoordinatorsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useDocumentTitle('T&P Coordinators');
  useEffect(() => {
    api<{ assignments: any[] }>('/api/placements/coordinators')
      .then((d) => setRows(d.assignments ?? []))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="T&P Coordinators" subtitle="Employee + T&P capability. Faculty identity is never replaced." />
      {rows.map((r) => (
        <Surface key={r.id} className="p-4">
          <p className="font-medium">{r.employeeName} · {r.role}</p>
          <p className="text-sm text-ink-muted">{r.departmentName || 'College scope'} · {r.effectiveFrom} → {r.effectiveTo || 'open'} · {r.status}</p>
        </Surface>
      ))}
    </div>
  );
}

export function HodPlacementOversightPage() {
  return <CoordinatorPlacementDashboardPage />;
}

export function PrincipalPlacementOversightPage() {
  const [data, setData] = useState<any>(null);
  const [depts, setDepts] = useState<any>(null);
  useDocumentTitle('T&P Oversight');
  useEffect(() => {
    api<any>('/api/placements/management/dashboard').then(setData).catch(() => setData(null));
    api<any>('/api/placements/reports/departments').then(setDepts).catch(() => setDepts(null));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Training & Placement oversight" subtitle="College-wide analytics — read only" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Placement %', value: `${data.placementPercentage}%` },
          { label: 'Unique placed', value: data.uniqueStudentsPlaced },
          { label: 'Offers', value: data.totalOffers },
          { label: 'Highest CTC', value: data.highestCtc ?? '—' },
        ].map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{c.value}</p>
          </Surface>
        ))}
      </div>
      {(depts?.departments ?? []).map((d: any) => (
        <Surface key={d.departmentId} className="p-4">
          <p className="font-medium">{d.departmentName}</p>
          <p className="text-sm text-ink-muted">{d.placed}/{d.registered} placed · {d.placementRate}%</p>
        </Surface>
      ))}
    </div>
  );
}

export function RecruiterPlacementPage() {
  const [status, setStatus] = useState<any>(null);
  useDocumentTitle('Recruiter Portal');

  useEffect(() => {
    api<any>('/api/recruiter/status').then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Recruiter Portal" subtitle="Controlled company access" />
      <Surface className="p-4 text-sm">
        <p>{status?.message ?? 'Recruiter portal is feature-flagged. RBAC architecture and schema are in place.'}</p>
        <p className="mt-2 text-ink-muted">Enable via college placement policy when secure recruiter authentication is ready.</p>
      </Surface>
    </div>
  );
}
