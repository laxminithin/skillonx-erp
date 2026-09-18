/**
 * HRMS Recruitment — requisitions, openings, pipeline, interviews, offers, joining.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const BASE = '/api/hr/recruitment';

const PIPELINE_STAGES = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'OFFERED',
  'ACCEPTED',
  'PRE_JOINING',
  'JOINED',
] as const;

type StatusMap = Record<string, number>;

type Requisition = {
  id: number;
  code?: string;
  status: string;
  departmentId?: number;
  designationId?: number;
  employmentTypeId?: number;
  requestedHeadcount?: number;
  approvedHeadcount?: number | null;
  reason?: string | null;
  positionType?: string;
  desiredJoiningDate?: string | null;
  budgetReference?: string | null;
  rejectionReason?: string | null;
};

type Opening = {
  id: number;
  code?: string;
  title: string;
  status: string;
  departmentId?: number;
  designationId?: number;
  employmentTypeId?: number;
  requisitionId?: number | null;
  headcount?: number;
  joinedCount?: number;
  remainingHeadcount?: number;
  location?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  qualification?: string | null;
  experience?: string | null;
  skills?: string | string[] | null;
  applicationDeadline?: string | null;
  jobCategory?: string | null;
  rounds?: Array<{ id: number; name: string; sequence: number; roundType?: string }>;
};

type Candidate = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  qualificationSummary?: string | null;
  experienceSummary?: string | null;
  source?: string;
  status?: string;
};

type Application = {
  id: number;
  status: string;
  candidateId: number;
  openingId: number;
  source?: string | null;
  salaryExpectation?: number | null;
  coverLetter?: string | null;
  screeningNotes?: string | null;
  screeningDecision?: string | null;
  shortlistReason?: string | null;
  selectionReason?: string | null;
  candidateName?: string;
  openingTitle?: string;
  departmentId?: number;
  candidate?: Candidate | null;
  opening?: Opening | null;
};

type Interview = {
  id: number;
  applicationId: number;
  roundId?: number;
  scheduledAt?: string;
  timezone?: string;
  mode?: string;
  locationOrLink?: string | null;
  status: string;
  notes?: string | null;
};

type Offer = {
  id: number;
  applicationId: number;
  candidateId?: number;
  openingId?: number;
  offerNumber?: string;
  versionNo?: number;
  status: string;
  proposedJoiningDate?: string | null;
  offerDate?: string | null;
  validUntil?: string | null;
  compensationSummary?: string | null;
  terms?: string | null;
  designationId?: number;
  departmentId?: number;
  employmentTypeId?: number;
};

type PrejoiningTask = {
  id: number;
  applicationId: number;
  itemCode?: string;
  name: string;
  status: string;
  mandatory?: boolean;
  notes?: string | null;
  bgvStatus?: string | null;
};

type Dash = {
  openRequisitions?: number;
  publishedOpenings?: number;
  activeApplications?: number;
  issuedOffers?: number;
  acceptedOffers?: number;
  joined?: number;
  interviewsScheduled?: number;
  byStatus?: StatusMap;
};

function asArray<T>(res: T[] | { items?: T[]; data?: T[] } | null | undefined): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-surface-muted text-ink">
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function errMsg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

async function postAction(path: string, body: Record<string, unknown> = {}) {
  return api(path, { method: 'POST', body: JSON.stringify(body) });
}

function RecruitmentNav() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/hr/recruitment"><Button variant="secondary" size="sm">Dashboard</Button></Link>
      <Link to="/hr/recruitment/requisitions"><Button variant="secondary" size="sm">Requisitions</Button></Link>
      <Link to="/hr/recruitment/openings"><Button variant="secondary" size="sm">Openings</Button></Link>
      <Link to="/hr/recruitment/pipeline"><Button variant="secondary" size="sm">Pipeline</Button></Link>
      <Link to="/hr/recruitment/interviews"><Button variant="secondary" size="sm">Interviews</Button></Link>
      <Link to="/hr/recruitment/offers"><Button variant="secondary" size="sm">Offers</Button></Link>
      <Link to="/hr/recruitment/reports"><Button variant="secondary" size="sm">Reports</Button></Link>
      <Link to="/hr/recruitment/hod"><Button variant="secondary" size="sm">HOD</Button></Link>
      <Link to="/hr/recruitment/my-interviews"><Button variant="secondary" size="sm">My Interviews</Button></Link>
    </div>
  );
}

function SummaryCards({ items }: { items: Array<{ label: string; value: number | string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => (
        <Surface key={c.label} className="p-4">
          <p className="text-xs uppercase text-ink-muted">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
        </Surface>
      ))}
    </div>
  );
}

function StageCounts({ rows }: { rows: Application[] }) {
  const counts = useMemo(() => {
    const map: StatusMap = {};
    for (const s of PIPELINE_STAGES) map[s] = 0;
    for (const r of rows) {
      const key = String(r.status || 'APPLIED');
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [rows]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PIPELINE_STAGES.map((s) => (
        <Surface key={s} className="min-w-[7.5rem] shrink-0 p-3">
          <p className="text-[10px] uppercase tracking-wide text-ink-muted">{s.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{counts[s] ?? 0}</p>
        </Surface>
      ))}
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export function HrRecruitmentDashboardPage() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Recruitment');

  useEffect(() => {
    api<Dash>(`${BASE}/dashboard`)
      .then(setDash)
      .catch(() =>
        setDash({
          openRequisitions: 0,
          publishedOpenings: 0,
          activeApplications: 0,
          issuedOffers: 0,
          acceptedOffers: 0,
          joined: 0,
          interviewsScheduled: 0,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading || !dash) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Recruitment"
        subtitle="Requisitions, openings, pipeline, interviews and offers"
      />
      <RecruitmentNav />
      <SummaryCards
        items={[
          { label: 'Open requisitions', value: dash.openRequisitions ?? 0 },
          { label: 'Published openings', value: dash.publishedOpenings ?? 0 },
          { label: 'Active applications', value: dash.activeApplications ?? 0 },
          { label: 'Interviews scheduled', value: dash.interviewsScheduled ?? 0 },
          { label: 'Issued offers', value: dash.issuedOffers ?? 0 },
          { label: 'Accepted offers', value: dash.acceptedOffers ?? 0 },
          { label: 'Joined', value: dash.joined ?? 0 },
        ]}
      />
      {dash.byStatus && Object.keys(dash.byStatus).length > 0 ? (
        <Surface className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Application status mix</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(dash.byStatus).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs uppercase text-ink-muted">{label.replace(/_/g, ' ')}</p>
                <p className="text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

// ── Requisitions ────────────────────────────────────────────────────────────

export function HrRecruitmentRequisitionsPage() {
  const [rows, setRows] = useState<Requisition[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    departmentId: '',
    designationId: '',
    employmentTypeId: '',
    requestedHeadcount: '1',
    reason: '',
    positionType: 'NEW',
    desiredJoiningDate: '',
    budgetReference: '',
  });
  useDocumentTitle('Requisitions');

  const load = useCallback(() => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    api<Requisition[] | { items: Requisition[] }>(`${BASE}/requisitions${q}`)
      .then((res) => setRows(asArray(res)))
      .catch(() => setRows([]));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!form.departmentId || !form.designationId || !form.employmentTypeId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${BASE}/requisitions`, {
        method: 'POST',
        body: JSON.stringify({
          departmentId: Number(form.departmentId),
          designationId: Number(form.designationId),
          employmentTypeId: Number(form.employmentTypeId),
          requestedHeadcount: Number(form.requestedHeadcount) || 1,
          reason: form.reason || null,
          positionType: form.positionType,
          desiredJoiningDate: form.desiredJoiningDate || null,
          budgetReference: form.budgetReference || null,
        }),
      });
      setForm({
        departmentId: '',
        designationId: '',
        employmentTypeId: '',
        requestedHeadcount: '1',
        reason: '',
        positionType: 'NEW',
        desiredJoiningDate: '',
        budgetReference: '',
      });
      load();
    } catch (e) {
      setError(errMsg(e, 'Failed to create requisition'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Requisitions" subtitle="Raise and track hiring requests" actions={<RecruitmentNav />} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create requisition</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Department ID</span>
            <Input value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Designation ID</span>
            <Input value={form.designationId} onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Employment type ID</span>
            <Input value={form.employmentTypeId} onChange={(e) => setForm((f) => ({ ...f, employmentTypeId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Headcount</span>
            <Input type="number" min={1} value={form.requestedHeadcount} onChange={(e) => setForm((f) => ({ ...f, requestedHeadcount: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Reason</span>
            <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Desired joining</span>
            <Input type="date" value={form.desiredJoiningDate} onChange={(e) => setForm((f) => ({ ...f, desiredJoiningDate: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Budget ref</span>
            <Input value={form.budgetReference} onChange={(e) => setForm((f) => ({ ...f, budgetReference: e.target.value }))} />
          </label>
        </div>
        <Button disabled={busy || !form.departmentId || !form.designationId || !form.employmentTypeId} onClick={create}>
          Create
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Status filter</span>
          <select
            className="min-h-10 rounded border border-border bg-surface px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            {['DRAFT', 'SUBMITTED', 'DEPARTMENT_APPROVED', 'HR_REVIEW', 'APPROVED', 'OPENED', 'CLOSED', 'REJECTED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Dept / Desig</th>
              <th className="px-4 py-3">Headcount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="font-mono text-xs underline" to={`/hr/recruitment/requisitions/${r.id}`}>
                    {r.code || `#${r.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  D{r.departmentId ?? '—'} / Des{r.designationId ?? '—'}
                </td>
                <td className="px-4 py-3 tabular-nums">{r.requestedHeadcount ?? '—'}</td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">No requisitions</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <Link className="font-mono text-xs underline" to={`/hr/recruitment/requisitions/${r.id}`}>{r.code || `#${r.id}`}</Link>
            <p className="mt-1 text-sm text-ink-muted">Headcount {r.requestedHeadcount ?? '—'}</p>
            <div className="mt-2"><StatusPill value={r.status} /></div>
          </Surface>
        ))}
        {rows.length === 0 ? <p className="text-sm text-ink-muted">No requisitions</p> : null}
      </div>
    </div>
  );
}

export function HrRecruitmentRequisitionDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Requisition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  useDocumentTitle('Requisition');

  const load = useCallback(() => {
    if (!id) return;
    api<Requisition>(`${BASE}/requisitions/${id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: string, body: Record<string, unknown> = {}) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await postAction(`${BASE}/requisitions/${id}/${action}`, body);
      load();
    } catch (e) {
      setError(errMsg(e, `Failed to ${action}`));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={data.code || `Requisition #${data.id}`}
        subtitle="Hiring request detail and approvals"
        actions={<Link to="/hr/recruitment/requisitions"><Button variant="secondary">All requisitions</Button></Link>}
      />
      <RecruitmentNav />
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill value={data.status} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Department</p>
          <p className="mt-1 font-medium">{data.departmentId ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Designation</p>
          <p className="mt-1 font-medium">{data.designationId ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Headcount</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.requestedHeadcount ?? '—'}</p>
        </Surface>
      </div>
      {data.reason ? <Surface className="p-4 text-sm">{data.reason}</Surface> : null}
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Workflow actions</p>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Decision reason (reject / cancel / approve)</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => act('submit')}>Submit</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('department-approve')}>Dept approve</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('hr-review')}>HR review</Button>
          <Button size="sm" disabled={busy} onClick={() => act('approve', { reason: reason || undefined, approvedHeadcount: data.requestedHeadcount })}>Approve</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('open')}>Open</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('close')}>Close</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('reject', { reason })}>Reject</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('cancel', { reason })}>Cancel</Button>
        </div>
      </Surface>
    </div>
  );
}

// ── Openings ────────────────────────────────────────────────────────────────

export function HrRecruitmentOpeningsPage() {
  const [rows, setRows] = useState<Opening[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    departmentId: '',
    designationId: '',
    employmentTypeId: '',
    requisitionId: '',
    headcount: '1',
    location: '',
    description: '',
  });
  useDocumentTitle('Job Openings');

  const load = useCallback(() => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    api<Opening[] | { items: Opening[] }>(`${BASE}/openings${q}`)
      .then((res) => setRows(asArray(res)))
      .catch(() => setRows([]));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!form.title || !form.departmentId || !form.designationId || !form.employmentTypeId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${BASE}/openings`, {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          departmentId: Number(form.departmentId),
          designationId: Number(form.designationId),
          employmentTypeId: Number(form.employmentTypeId),
          requisitionId: form.requisitionId ? Number(form.requisitionId) : null,
          headcount: Number(form.headcount) || 1,
          location: form.location || null,
          description: form.description || null,
        }),
      });
      setForm({
        title: '',
        departmentId: '',
        designationId: '',
        employmentTypeId: '',
        requisitionId: '',
        headcount: '1',
        location: '',
        description: '',
      });
      load();
    } catch (e) {
      setError(errMsg(e, 'Failed to create opening'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Job Openings" subtitle="Publish and manage vacancies" actions={<RecruitmentNav />} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create opening</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Title</span>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Headcount</span>
            <Input type="number" min={1} value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Department ID</span>
            <Input value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Designation ID</span>
            <Input value={form.designationId} onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Employment type ID</span>
            <Input value={form.employmentTypeId} onChange={(e) => setForm((f) => ({ ...f, employmentTypeId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Requisition ID (optional)</span>
            <Input value={form.requisitionId} onChange={(e) => setForm((f) => ({ ...f, requisitionId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Location</span>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-ink-muted">Description</span>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
        </div>
        <Button
          disabled={busy || !form.title || !form.departmentId || !form.designationId || !form.employmentTypeId}
          onClick={create}
        >
          Create opening
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <label className="inline-block text-sm">
        <span className="mb-1 block text-ink-muted">Status filter</span>
        <select
          className="min-h-10 rounded border border-border bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          {['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Opening</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Headcount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="font-medium underline" to={`/hr/recruitment/openings/${r.id}`}>{r.title}</Link>
                  <div className="font-mono text-xs text-ink-muted">{r.code || `#${r.id}`}</div>
                </td>
                <td className="px-4 py-3">{r.location || '—'}</td>
                <td className="px-4 py-3 tabular-nums">{r.headcount ?? '—'}</td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">No openings</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <Link className="font-medium underline" to={`/hr/recruitment/openings/${r.id}`}>{r.title}</Link>
            <p className="mt-1 text-xs text-ink-muted">{r.location || '—'} · HC {r.headcount ?? '—'}</p>
            <div className="mt-2"><StatusPill value={r.status} /></div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrRecruitmentOpeningDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Opening | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Opening');

  const load = useCallback(() => {
    if (!id) return;
    api<Opening>(`${BASE}/openings/${id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: string) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await postAction(`${BASE}/openings/${id}/${action}`);
      load();
    } catch (e) {
      setError(errMsg(e, `Failed to ${action}`));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={data.title}
        subtitle={data.code || `Opening #${data.id}`}
        actions={<Link to="/hr/recruitment/openings"><Button variant="secondary">All openings</Button></Link>}
      />
      <RecruitmentNav />
      <StatusPill value={data.status} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Headcount</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.headcount ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Joined</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.joinedCount ?? 0}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Remaining</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.remainingHeadcount ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Location</p>
          <p className="mt-1 font-medium">{data.location || '—'}</p>
        </Surface>
      </div>
      {data.description ? <Surface className="p-4 text-sm whitespace-pre-wrap">{data.description}</Surface> : null}
      {(data.rounds?.length ?? 0) > 0 ? (
        <Surface className="space-y-2 p-4">
          <p className="text-sm font-medium">Interview rounds</p>
          <ul className="space-y-1 text-sm">
            {data.rounds!.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-2">
                <span className="font-mono text-xs text-ink-muted">#{r.sequence}</span>
                <span>{r.name}</span>
                <StatusPill value={r.roundType || 'ROUND'} />
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => act('publish')}>Publish</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('pause')}>Pause</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('resume')}>Resume</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('close')}>Close</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('cancel')}>Cancel</Button>
        <Link to={`/hr/recruitment/pipeline?openingId=${data.id}`}>
          <Button size="sm" variant="secondary">View pipeline</Button>
        </Link>
      </div>
    </div>
  );
}

// ── Pipeline ────────────────────────────────────────────────────────────────

export function HrRecruitmentPipelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const status = searchParams.get('status') || '';
  const openingId = searchParams.get('openingId') || '';
  const departmentId = searchParams.get('departmentId') || '';
  const stage = searchParams.get('stage') || '';
  useDocumentTitle('Recruitment Pipeline');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (openingId) params.set('openingId', openingId);
    if (departmentId) params.set('departmentId', departmentId);
    if (stage) params.set('stage', stage);
    const q = params.toString() ? `?${params}` : '';
    api<Application[] | { items: Application[] }>(`${BASE}/applications${q}`)
      .then((res) => {
        let list = asArray(res);
        if (stage) list = list.filter((a) => a.status === stage);
        if (departmentId) {
          list = list.filter(
            (a) =>
              String(a.departmentId ?? a.opening?.departmentId ?? '') === departmentId,
          );
        }
        setRows(list);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status, openingId, departmentId, stage]);

  useEffect(() => {
    load();
  }, [load]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  async function act(appId: number, action: 'screen' | 'shortlist' | 'select', body: Record<string, unknown>) {
    setBusyId(appId);
    setError(null);
    try {
      await postAction(`${BASE}/applications/${appId}/${action}`, body);
      load();
    } catch (e) {
      setError(errMsg(e, `Failed to ${action}`));
    } finally {
      setBusyId(null);
    }
  }

  const byStage = useMemo(() => {
    const map: Record<string, Application[]> = {};
    for (const s of PIPELINE_STAGES) map[s] = [];
    for (const r of rows) {
      const key = PIPELINE_STAGES.includes(r.status as (typeof PIPELINE_STAGES)[number])
        ? r.status
        : 'APPLIED';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [rows]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Recruitment Pipeline" subtitle="Screen, shortlist and select candidates" actions={<RecruitmentNav />} />
      <StageCounts rows={rows} />
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Status</span>
          <select
            className="min-h-10 rounded border border-border bg-surface px-3 text-sm"
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
          >
            <option value="">All</option>
            {[...PIPELINE_STAGES, 'REJECTED', 'WITHDRAWN', 'OFFER_DECLINED', 'NO_SHOW', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Stage board</span>
          <select
            className="min-h-10 rounded border border-border bg-surface px-3 text-sm"
            value={stage}
            onChange={(e) => setFilter('stage', e.target.value)}
          >
            <option value="">All stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Opening ID</span>
          <Input value={openingId} onChange={(e) => setFilter('openingId', e.target.value)} className="w-28" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Department ID</span>
          <Input value={departmentId} onChange={(e) => setFilter('departmentId', e.target.value)} className="w-28" />
        </label>
        <label className="text-sm grow sm:max-w-xs">
          <span className="mb-1 block text-ink-muted">Action notes</span>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / notes" />
        </label>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="hidden gap-3 overflow-x-auto pb-2 lg:flex">
            {PIPELINE_STAGES.map((s) => (
              <div key={s} className="w-64 shrink-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase text-ink-muted">{s.replace(/_/g, ' ')}</p>
                  <span className="tabular-nums text-xs text-ink-muted">{byStage[s]?.length ?? 0}</span>
                </div>
                <div className="min-h-[12rem] space-y-2 rounded border border-border bg-surface-muted/40 p-2">
                  {(byStage[s] ?? []).map((a) => (
                    <Surface key={a.id} className="space-y-2 p-3">
                      <Link className="text-sm font-medium underline" to={`/hr/recruitment/candidates/${a.candidateId}`}>
                        {a.candidate?.fullName || a.candidateName || `Candidate #${a.candidateId}`}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        App #{a.id} · Opening {a.openingId}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="secondary" disabled={busyId === a.id} onClick={() => act(a.id, 'screen', { decision: 'SHORTLIST', notes: notes || null })}>
                          Screen
                        </Button>
                        <Button size="sm" variant="secondary" disabled={busyId === a.id} onClick={() => act(a.id, 'shortlist', { reason: notes || null })}>
                          Shortlist
                        </Button>
                        <Button size="sm" disabled={busyId === a.id} onClick={() => act(a.id, 'select', { reason: notes || null })}>
                          Select
                        </Button>
                      </div>
                      <Link className="text-xs underline" to={`/hr/recruitment/prejoining/${a.id}`}>Pre-joining</Link>
                    </Surface>
                  ))}
                  {(byStage[s] ?? []).length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-ink-muted">Empty</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 lg:hidden">
            {rows.map((a) => (
              <Surface key={a.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link className="font-medium underline" to={`/hr/recruitment/candidates/${a.candidateId}`}>
                      {a.candidate?.fullName || a.candidateName || `Candidate #${a.candidateId}`}
                    </Link>
                    <p className="text-xs text-ink-muted">App #{a.id} · Opening {a.openingId}</p>
                  </div>
                  <StatusPill value={a.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={busyId === a.id} onClick={() => act(a.id, 'screen', { decision: 'SHORTLIST', notes: notes || null })}>
                    Screen
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busyId === a.id} onClick={() => act(a.id, 'shortlist', { reason: notes || null })}>
                    Shortlist
                  </Button>
                  <Button size="sm" disabled={busyId === a.id} onClick={() => act(a.id, 'select', { reason: notes || null })}>
                    Select
                  </Button>
                </div>
              </Surface>
            ))}
            {rows.length === 0 ? <p className="text-sm text-ink-muted">No applications in pipeline</p> : null}
          </div>

          <div className="hidden overflow-x-auto rounded border border-border md:block lg:hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Opening</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">#{a.id}</td>
                    <td className="px-4 py-3">
                      <Link className="underline" to={`/hr/recruitment/candidates/${a.candidateId}`}>
                        {a.candidate?.fullName || a.candidateName || a.candidateId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{a.opening?.title || a.openingTitle || a.openingId}</td>
                    <td className="px-4 py-3"><StatusPill value={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Candidates ──────────────────────────────────────────────────────────────

export function HrRecruitmentCandidateDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Candidate | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  useDocumentTitle('Candidate');

  useEffect(() => {
    if (!id) return;
    api<Candidate>(`${BASE}/candidates/${id}`)
      .then(setData)
      .catch(() => setData(null));
    api<Application[] | { items: Application[] }>(`${BASE}/applications?candidateId=${id}`)
      .then((res) => setApps(asArray(res)))
      .catch(() => setApps([]));
  }, [id]);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={data.fullName}
        subtitle={data.email}
        actions={<Link to="/hr/recruitment/pipeline"><Button variant="secondary">Pipeline</Button></Link>}
      />
      <RecruitmentNav />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Phone</p>
          <p className="mt-1">{data.phone || '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Location</p>
          <p className="mt-1">{data.location || '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Source</p>
          <p className="mt-1">{data.source || '—'}</p>
        </Surface>
      </div>
      {data.qualificationSummary ? (
        <Surface className="space-y-1 p-4">
          <p className="text-xs uppercase text-ink-muted">Qualification</p>
          <p className="text-sm whitespace-pre-wrap">{data.qualificationSummary}</p>
        </Surface>
      ) : null}
      {data.experienceSummary ? (
        <Surface className="space-y-1 p-4">
          <p className="text-xs uppercase text-ink-muted">Experience</p>
          <p className="text-sm whitespace-pre-wrap">{data.experienceSummary}</p>
        </Surface>
      ) : null}
      <Surface className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Applications</h2>
        <div className="space-y-2">
          {apps.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
              <div>
                <p className="text-sm font-medium">App #{a.id} · Opening {a.openingId}</p>
                <StatusPill value={a.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/hr/recruitment/prejoining/${a.id}`}><Button size="sm" variant="secondary">Pre-joining</Button></Link>
                <Link to={`/hr/recruitment/joining/${a.id}`}><Button size="sm" variant="secondary">Joining</Button></Link>
              </div>
            </div>
          ))}
          {apps.length === 0 ? <p className="text-sm text-ink-muted">No applications</p> : null}
        </div>
      </Surface>
    </div>
  );
}

// ── Interviews ──────────────────────────────────────────────────────────────

function InterviewsListPage({ title, mine }: { title: string; mine?: boolean }) {
  const [rows, setRows] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleAppId, setScheduleAppId] = useState('');
  const [roundId, setRoundId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState('IN_PERSON');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle(title);

  const load = useCallback(() => {
    setLoading(true);
    const path = mine ? `${BASE}/interviews/mine` : `${BASE}/interviews`;
    api<Interview[] | { items: Interview[] }>(path)
      .then((res) => setRows(asArray(res)))
      .catch(() => {
        if (!mine) {
          api<Interview[] | { items: Interview[] }>(`${BASE}/interviews/mine`)
            .then((res) => setRows(asArray(res)))
            .catch(() => setRows([]));
        } else {
          setRows([]);
        }
      })
      .finally(() => setLoading(false));
  }, [mine]);

  useEffect(() => {
    load();
  }, [load]);

  async function schedule() {
    if (!scheduleAppId || !roundId || !scheduledAt) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${BASE}/applications/${scheduleAppId}/interviews`, {
        method: 'POST',
        body: JSON.stringify({
          roundId: Number(roundId),
          scheduledAt,
          mode,
          locationOrLink: locationOrLink || null,
          panelEmployeeIds: [],
        }),
      });
      setScheduleAppId('');
      setRoundId('');
      setScheduledAt('');
      load();
    } catch (e) {
      setError(errMsg(e, 'Failed to schedule interview'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={title} subtitle="Schedule and evaluate interviews" actions={<RecruitmentNav />} />
      {!mine ? (
        <Surface className="space-y-3 p-4">
          <p className="text-sm font-medium">Schedule interview</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm">
              <span className="mb-1 block text-ink-muted">Application ID</span>
              <Input value={scheduleAppId} onChange={(e) => setScheduleAppId(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-muted">Round ID</span>
              <Input value={roundId} onChange={(e) => setRoundId(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-muted">Scheduled at</span>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-muted">Mode</span>
              <select className="min-h-10 w-full rounded border border-border bg-surface px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="IN_PERSON">In person</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-muted">Location / link</span>
              <Input value={locationOrLink} onChange={(e) => setLocationOrLink(e.target.value)} />
            </label>
          </div>
          <Button disabled={busy || !scheduleAppId || !roundId || !scheduledAt} onClick={schedule}>Schedule</Button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </Surface>
      ) : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded border border-border md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Interview</th>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link className="underline" to={`/hr/recruitment/interviews/${r.id}`}>#{r.id}</Link>
                    </td>
                    <td className="px-4 py-3">{r.applicationId}</td>
                    <td className="px-4 py-3">{r.scheduledAt ? String(r.scheduledAt).slice(0, 16).replace('T', ' ') : '—'}</td>
                    <td className="px-4 py-3">{r.mode || '—'}</td>
                    <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No interviews</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {rows.map((r) => (
              <Surface key={r.id} className="p-4">
                <Link className="font-medium underline" to={`/hr/recruitment/interviews/${r.id}`}>Interview #{r.id}</Link>
                <p className="mt-1 text-xs text-ink-muted">App {r.applicationId} · {r.scheduledAt ? String(r.scheduledAt).slice(0, 16) : '—'}</p>
                <div className="mt-2"><StatusPill value={r.status} /></div>
              </Surface>
            ))}
            {rows.length === 0 ? <p className="text-sm text-ink-muted">No interviews</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

export function HrRecruitmentInterviewsPage() {
  return <InterviewsListPage title="Interviews" />;
}

export function HrRecruitmentMyInterviewsPage() {
  return <InterviewsListPage title="My Interviews" mine />;
}

export function HrRecruitmentInterviewEvaluatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Interview | null>(null);
  const [overallScore, setOverallScore] = useState('');
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('ADVANCE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Evaluate Interview');

  useEffect(() => {
    if (!id) return;
    api<Interview>(`${BASE}/interviews/${id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  async function submit() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await postAction(`${BASE}/interviews/${id}/evaluate`, {
        overallScore: overallScore ? Number(overallScore) : null,
        comments: comments || null,
        recommendation,
      });
      navigate('/hr/recruitment/my-interviews');
    } catch (e) {
      setError(errMsg(e, 'Failed to submit evaluation'));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={`Interview #${data.id}`}
        subtitle={`Application ${data.applicationId}`}
        actions={<Link to="/hr/recruitment/interviews"><Button variant="secondary">All interviews</Button></Link>}
      />
      <StatusPill value={data.status} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm text-ink-muted">
          {data.scheduledAt ? String(data.scheduledAt).slice(0, 16).replace('T', ' ') : '—'} · {data.mode || '—'}
        </p>
        {data.locationOrLink ? <p className="text-sm">{data.locationOrLink}</p> : null}
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Overall score (0–100)</span>
          <Input type="number" min={0} max={100} value={overallScore} onChange={(e) => setOverallScore(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Comments</span>
          <Input value={comments} onChange={(e) => setComments(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Recommendation</span>
          <select
            className="min-h-10 w-full rounded border border-border bg-surface px-3 text-sm"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
          >
            {['ADVANCE', 'HOLD', 'REJECT', 'STRONG_HIRE'].map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
        <Button disabled={busy} onClick={submit}>Submit evaluation</Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
    </div>
  );
}

// ── Offers ──────────────────────────────────────────────────────────────────

export function HrRecruitmentOffersPage() {
  const [rows, setRows] = useState<Offer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    applicationId: '',
    designationId: '',
    departmentId: '',
    employmentTypeId: '',
    proposedJoiningDate: '',
    compensationSummary: '',
    terms: '',
  });
  useDocumentTitle('Offers');

  const load = useCallback(() => {
    api<Offer[] | { items: Offer[] }>(`${BASE}/offers`)
      .then((res) => setRows(asArray(res)))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!form.applicationId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${BASE}/offers`, {
        method: 'POST',
        body: JSON.stringify({
          applicationId: Number(form.applicationId),
          designationId: form.designationId ? Number(form.designationId) : undefined,
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
          employmentTypeId: form.employmentTypeId ? Number(form.employmentTypeId) : undefined,
          proposedJoiningDate: form.proposedJoiningDate || null,
          compensationSummary: form.compensationSummary || null,
          terms: form.terms || null,
        }),
      });
      setForm({
        applicationId: '',
        designationId: '',
        departmentId: '',
        employmentTypeId: '',
        proposedJoiningDate: '',
        compensationSummary: '',
        terms: '',
      });
      load();
    } catch (e) {
      setError(errMsg(e, 'Failed to create offer'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Offers" subtitle="Draft, approve and issue offer letters" actions={<RecruitmentNav />} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create offer</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Application ID</span>
            <Input value={form.applicationId} onChange={(e) => setForm((f) => ({ ...f, applicationId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Department ID</span>
            <Input value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Designation ID</span>
            <Input value={form.designationId} onChange={(e) => setForm((f) => ({ ...f, designationId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Employment type ID</span>
            <Input value={form.employmentTypeId} onChange={(e) => setForm((f) => ({ ...f, employmentTypeId: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Proposed joining</span>
            <Input type="date" value={form.proposedJoiningDate} onChange={(e) => setForm((f) => ({ ...f, proposedJoiningDate: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Compensation summary</span>
            <Input value={form.compensationSummary} onChange={(e) => setForm((f) => ({ ...f, compensationSummary: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-ink-muted">Terms</span>
            <Input value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} />
          </label>
        </div>
        <Button disabled={busy || !form.applicationId} onClick={create}>Create offer</Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Joining</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="underline" to={`/hr/recruitment/offers/${r.id}`}>
                    {r.offerNumber || `#${r.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.applicationId}</td>
                <td className="px-4 py-3">{r.proposedJoiningDate ? String(r.proposedJoiningDate).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">No offers</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <Link className="font-medium underline" to={`/hr/recruitment/offers/${r.id}`}>{r.offerNumber || `Offer #${r.id}`}</Link>
            <p className="mt-1 text-xs text-ink-muted">App {r.applicationId}</p>
            <div className="mt-2"><StatusPill value={r.status} /></div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrRecruitmentOfferDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Offer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  useDocumentTitle('Offer');

  const load = useCallback(() => {
    if (!id) return;
    api<Offer>(`${BASE}/offers/${id}`)
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: string, body: Record<string, unknown> = {}) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      // Prefer contract path; fall back to submit-approval for drafts.
      try {
        await postAction(`${BASE}/offers/${id}/${action}`, body);
      } catch (e) {
        if (action === 'submit') {
          await postAction(`${BASE}/offers/${id}/submit-approval`, body);
        } else {
          throw e;
        }
      }
      load();
    } catch (e) {
      setError(errMsg(e, `Failed to ${action}`));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={data.offerNumber || `Offer #${data.id}`}
        subtitle={`Application ${data.applicationId}`}
        actions={<Link to="/hr/recruitment/offers"><Button variant="secondary">All offers</Button></Link>}
      />
      <RecruitmentNav />
      <StatusPill value={data.status} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Proposed joining</p>
          <p className="mt-1">{data.proposedJoiningDate ? String(data.proposedJoiningDate).slice(0, 10) : '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Valid until</p>
          <p className="mt-1">{data.validUntil ? String(data.validUntil).slice(0, 10) : '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Version</p>
          <p className="mt-1 tabular-nums">{data.versionNo ?? 1}</p>
        </Surface>
      </div>
      {data.compensationSummary ? (
        <Surface className="p-4 text-sm">{data.compensationSummary}</Surface>
      ) : null}
      {data.terms ? <Surface className="p-4 text-sm whitespace-pre-wrap">{data.terms}</Surface> : null}
      <Surface className="space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Reason (withdraw)</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => act('submit')}>Submit</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('approve')}>Approve</Button>
          <Button size="sm" disabled={busy} onClick={() => act('issue')}>Issue</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => act('withdraw', { reason })}>Withdraw</Button>
        </div>
        <Link to={`/hr/recruitment/prejoining/${data.applicationId}`}>
          <Button size="sm" variant="secondary">Pre-joining checklist</Button>
        </Link>
      </Surface>
    </div>
  );
}

// ── Pre-joining & Joining ───────────────────────────────────────────────────

export function HrRecruitmentPreJoiningPage() {
  const { applicationId } = useParams();
  const [tasks, setTasks] = useState<PrejoiningTask[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Pre-joining');

  const load = useCallback(() => {
    if (!applicationId) return;
    api<PrejoiningTask[] | { items: PrejoiningTask[] }>(`${BASE}/applications/${applicationId}/prejoining`)
      .then((res) => setTasks(asArray(res)))
      .catch(() => setTasks([]));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateTask(taskId: number, status: string) {
    setBusyId(taskId);
    setError(null);
    try {
      try {
        await api(`${BASE}/prejoining/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      } catch {
        await api(`${BASE}/prejoining-tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      }
      load();
    } catch (e) {
      setError(errMsg(e, 'Failed to update task'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Pre-joining checklist"
        subtitle={`Application ${applicationId}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/hr/recruitment/joining/${applicationId}`}><Button variant="secondary">Complete joining</Button></Link>
            <Link to="/hr/recruitment/pipeline"><Button variant="secondary">Pipeline</Button></Link>
          </div>
        }
      />
      <RecruitmentNav />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="space-y-3">
        {tasks.map((t) => (
          <Surface key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-ink-muted">{t.itemCode || ''}{t.mandatory ? ' · Mandatory' : ''}</p>
              <div className="mt-1"><StatusPill value={t.status} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={busyId === t.id} onClick={() => updateTask(t.id, 'VERIFIED')}>Verify</Button>
              <Button size="sm" variant="secondary" disabled={busyId === t.id} onClick={() => updateTask(t.id, 'REJECTED')}>Reject</Button>
              <Button size="sm" variant="secondary" disabled={busyId === t.id} onClick={() => updateTask(t.id, 'WAIVED')}>Waive</Button>
            </div>
          </Surface>
        ))}
        {tasks.length === 0 ? <p className="text-sm text-ink-muted">No pre-joining tasks yet</p> : null}
      </div>
    </div>
  );
}

export function HrRecruitmentJoiningPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeCategory, setEmployeeCategory] = useState('FACULTY');
  useDocumentTitle('Complete Joining');

  async function complete() {
    if (!applicationId) return;
    setBusy(true);
    setError(null);
    try {
      try {
        await postAction(`${BASE}/applications/${applicationId}/join`, {
          employeeCategory,
          markJoined: true,
        });
      } catch {
        await postAction(`${BASE}/applications/${applicationId}/complete-joining`, {
          employeeCategory,
          markJoined: true,
        });
      }
      navigate('/hr/recruitment/pipeline');
    } catch (e) {
      setError(errMsg(e, 'Failed to complete joining'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Complete joining"
        subtitle={`Application ${applicationId}`}
        actions={<Link to={`/hr/recruitment/prejoining/${applicationId}`}><Button variant="secondary">Pre-joining</Button></Link>}
      />
      <RecruitmentNav />
      <Surface className="space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Employee category</span>
          <select
            className="min-h-10 w-full rounded border border-border bg-surface px-3 text-sm"
            value={employeeCategory}
            onChange={(e) => setEmployeeCategory(e.target.value)}
          >
            {['FACULTY', 'NON_TEACHING', 'MANAGEMENT', 'CONTRACTUAL', 'OTHER'].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
        <p className="text-sm text-ink-muted">
          Marks the candidate as joined and creates / links the employee record per HR policy.
        </p>
        <Button disabled={busy} onClick={complete}>Complete joining</Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
    </div>
  );
}

// ── Reports ─────────────────────────────────────────────────────────────────

export function HrRecruitmentReportsPage() {
  const [kind, setKind] = useState('pipeline');
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  useDocumentTitle('Recruitment Reports');

  useEffect(() => {
    setLoading(true);
    api<unknown>(`${BASE}/reports/${kind}`)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [kind]);

  const rows = useMemo(() => {
    if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: Array<Record<string, unknown>> }).items;
    }
    return [];
  }, [data]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Recruitment Reports" subtitle="Pipeline, time-to-hire and source effectiveness" actions={<RecruitmentNav />} />
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'time-to-hire', label: 'Time to hire' },
          { id: 'sources', label: 'Sources' },
        ].map((k) => (
          <Button
            key={k.id}
            size="sm"
            variant={kind === k.id ? 'primary' : 'secondary'}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </Button>
        ))}
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
              <tr>
                {rows[0]
                  ? Object.keys(rows[0]).map((k) => (
                      <th key={k} className="px-4 py-3">{k}</th>
                    ))
                  : <th className="px-4 py-3">Result</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {Object.values(r).map((v, j) => (
                    <td key={j} className="px-4 py-3">{v == null ? '—' : String(v)}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-ink-muted" colSpan={8}>No report data</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── HOD scoped view ─────────────────────────────────────────────────────────

export function HrRecruitmentHodPage() {
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  useDocumentTitle('Department Recruitment');

  useEffect(() => {
    api<Requisition[] | { items: Requisition[] }>(`${BASE}/requisitions`)
      .then((res) => setReqs(asArray(res)))
      .catch(() => setReqs([]));
    api<Opening[] | { items: Opening[] }>(`${BASE}/openings`)
      .then((res) => setOpenings(asArray(res)))
      .catch(() => setOpenings([]));
    api<Application[] | { items: Application[] }>(`${BASE}/applications`)
      .then((res) => setApps(asArray(res)))
      .catch(() => setApps([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Department Recruitment"
        subtitle="HOD view of requisitions, openings and pipeline (department-scoped by API)"
        actions={<RecruitmentNav />}
      />
      <SummaryCards
        items={[
          { label: 'Requisitions', value: reqs.length },
          { label: 'Openings', value: openings.length },
          { label: 'Applications', value: apps.length },
        ]}
      />
      <StageCounts rows={apps} />
      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Openings</h2>
          <Link to="/hr/recruitment/openings"><Button size="sm" variant="secondary">Manage</Button></Link>
        </div>
        <div className="space-y-2">
          {openings.slice(0, 8).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
              <Link className="underline" to={`/hr/recruitment/openings/${o.id}`}>{o.title}</Link>
              <StatusPill value={o.status} />
            </div>
          ))}
          {openings.length === 0 ? <p className="text-sm text-ink-muted">No openings in scope</p> : null}
        </div>
      </Surface>
      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Requisitions needing action</h2>
          <Link to="/hr/recruitment/requisitions"><Button size="sm" variant="secondary">All</Button></Link>
        </div>
        <div className="space-y-2">
          {reqs.filter((r) => ['SUBMITTED', 'DRAFT', 'DEPARTMENT_APPROVED'].includes(r.status)).slice(0, 8).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
              <Link className="font-mono text-xs underline" to={`/hr/recruitment/requisitions/${r.id}`}>{r.code || `#${r.id}`}</Link>
              <StatusPill value={r.status} />
            </div>
          ))}
          {reqs.length === 0 ? <p className="text-sm text-ink-muted">No requisitions in scope</p> : null}
        </div>
      </Surface>
    </div>
  );
}
