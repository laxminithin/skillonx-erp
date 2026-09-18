/**
 * Public careers board and candidate portal (token-based).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const PUBLIC_BASE = '/api/public/recruitment';
const TOKEN_KEY = 'recruitment_candidate_token';

type PublicJob = {
  id: number;
  title: string;
  code?: string;
  location?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  qualification?: string | null;
  experience?: string | null;
  skills?: string | string[] | null;
  applicationDeadline?: string | null;
  jobCategory?: string | null;
  departmentId?: number;
  status?: string;
};

type PortalOffer = {
  id: number;
  offerNumber?: string;
  status: string;
  proposedJoiningDate?: string | null;
  validUntil?: string | null;
  compensationSummary?: string | null;
  terms?: string | null;
};

type PortalApplication = {
  id: number;
  status: string;
  openingId: number;
  openingTitle?: string;
};

type PortalMe = {
  candidate?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  applications?: PortalApplication[];
};

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-surface-muted text-ink">
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function asArray<T>(res: T[] | { items?: T[]; jobs?: T[]; data?: T[] } | null | undefined): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.jobs)) return res.jobs;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function storeToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function publicApi<T>(
  path: string,
  options: RequestInit & { token?: string; auth?: boolean } = {},
): Promise<T> {
  const { token, auth = false, headers, ...rest } = options;
  const h = new Headers(headers);
  if (token) h.set('X-Candidate-Token', token);
  return api<T>(path, { ...rest, auth, headers: h });
}

async function fetchJobs(collegeId: string): Promise<PublicJob[]> {
  const q = collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : '';
  try {
    return asArray(await publicApi<PublicJob[] | { items: PublicJob[] }>(`${PUBLIC_BASE}/jobs${q}`, { auth: false }));
  } catch {
    try {
      return asArray(
        await publicApi<PublicJob[] | { items: PublicJob[] }>(`${PUBLIC_BASE}/openings${q}`, { auth: false }),
      );
    } catch {
      return [];
    }
  }
}

async function fetchJob(id: string, collegeId: string): Promise<PublicJob | null> {
  const q = collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : '';
  try {
    return await publicApi<PublicJob>(`${PUBLIC_BASE}/jobs/${id}${q}`, { auth: false });
  } catch {
    try {
      return await publicApi<PublicJob>(`${PUBLIC_BASE}/openings/${id}${q}`, { auth: false });
    } catch {
      return null;
    }
  }
}

export function PublicCareersPage() {
  const [searchParams] = useSearchParams();
  const collegeId = searchParams.get('collegeId') || '';
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeInput, setCollegeInput] = useState(collegeId);
  const navigate = useNavigate();
  useDocumentTitle('Careers');

  useEffect(() => {
    setLoading(true);
    fetchJobs(collegeId)
      .then(setJobs)
      .finally(() => setLoading(false));
  }, [collegeId]);

  function applyCollege() {
    const next = new URLSearchParams(searchParams);
    if (collegeInput) next.set('collegeId', collegeInput);
    else next.delete('collegeId');
    navigate(`/careers?${next.toString()}`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl animate-fade-in space-y-6 px-4 py-8">
      <PageHeader
        title="Careers"
        subtitle="Open roles at SkillonX institutions"
        actions={<Link to="/careers/portal"><Button variant="secondary">Candidate portal</Button></Link>}
      />
      <Surface className="flex flex-wrap items-end gap-2 p-4">
        <label className="grow text-sm sm:max-w-xs">
          <span className="mb-1 block text-ink-muted">College ID</span>
          <Input value={collegeInput} onChange={(e) => setCollegeInput(e.target.value)} placeholder="Required for listings" />
        </label>
        <Button onClick={applyCollege}>Load jobs</Button>
      </Surface>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Surface key={job.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    className="text-lg font-semibold underline"
                    to={`/careers/${job.id}${collegeId ? `?collegeId=${collegeId}` : ''}`}
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {[job.location, job.jobCategory, job.code].filter(Boolean).join(' · ') || 'Open role'}
                  </p>
                </div>
                <Link to={`/careers/${job.id}${collegeId ? `?collegeId=${collegeId}` : ''}`}>
                  <Button size="sm">View & apply</Button>
                </Link>
              </div>
              {job.applicationDeadline ? (
                <p className="text-xs text-ink-muted">
                  Apply by {String(job.applicationDeadline).slice(0, 10)}
                </p>
              ) : null}
            </Surface>
          ))}
          {jobs.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {collegeId ? 'No published jobs right now.' : 'Enter a college ID to view open positions.'}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function PublicJobDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const collegeId = searchParams.get('collegeId') || '';
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    qualificationSummary: '',
    experienceSummary: '',
    coverLetter: '',
    salaryExpectation: '',
    resumeText: '',
    consent: true,
  });
  useDocumentTitle(job?.title || 'Job');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJob(id, collegeId)
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id, collegeId]);

  async function apply() {
    if (!id || !form.fullName || !form.email || !form.consent) return;
    setBusy(true);
    setError(null);
    setDone(null);
    const body = {
      openingId: Number(id),
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || null,
      location: form.location || null,
      qualificationSummary: form.qualificationSummary || null,
      experienceSummary: form.experienceSummary || null,
      coverLetter: form.coverLetter || null,
      salaryExpectation: form.salaryExpectation ? Number(form.salaryExpectation) : null,
      resumeText: form.resumeText || null,
      consent: form.consent,
      collegeId: collegeId ? Number(collegeId) : undefined,
    };
    try {
      let res: { portalToken?: string };
      try {
        res = await publicApi(`${PUBLIC_BASE}/jobs/${id}/apply${collegeId ? `?collegeId=${collegeId}` : ''}`, {
          method: 'POST',
          auth: false,
          body: JSON.stringify(body),
        });
      } catch {
        res = await publicApi(`${PUBLIC_BASE}/apply${collegeId ? `?collegeId=${collegeId}` : ''}`, {
          method: 'POST',
          auth: false,
          body: JSON.stringify(body),
        });
      }
      if (res.portalToken) {
        storeToken(res.portalToken);
        setDone('Application submitted. Portal access token saved — open the candidate portal to track progress.');
      } else {
        setDone('Application submitted successfully.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><Skeleton className="h-40 w-full" /></div>;
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <PageHeader title="Job not found" subtitle="This listing may be closed or unavailable" />
        <Link to={`/careers${collegeId ? `?collegeId=${collegeId}` : ''}`}><Button variant="secondary">Back to careers</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 px-4 py-8">
      <PageHeader
        title={job.title}
        subtitle={[job.location, job.code].filter(Boolean).join(' · ') || 'Open role'}
        actions={
          <Link to={`/careers${collegeId ? `?collegeId=${collegeId}` : ''}`}>
            <Button variant="secondary">All jobs</Button>
          </Link>
        }
      />
      {job.description ? (
        <Surface className="space-y-2 p-4">
          <h2 className="text-sm font-semibold">About the role</h2>
          <p className="whitespace-pre-wrap text-sm">{job.description}</p>
        </Surface>
      ) : null}
      {job.responsibilities ? (
        <Surface className="space-y-2 p-4">
          <h2 className="text-sm font-semibold">Responsibilities</h2>
          <p className="whitespace-pre-wrap text-sm">{job.responsibilities}</p>
        </Surface>
      ) : null}
      {job.qualification || job.experience ? (
        <Surface className="space-y-2 p-4">
          {job.qualification ? <p className="text-sm"><span className="text-ink-muted">Qualification:</span> {job.qualification}</p> : null}
          {job.experience ? <p className="text-sm"><span className="text-ink-muted">Experience:</span> {job.experience}</p> : null}
        </Surface>
      ) : null}

      <Surface className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Apply</h2>
        {!collegeId ? (
          <p className="text-sm text-ink-muted">Add ?collegeId= to the URL for applications to reach the right campus.</p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Full name</span>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Email</span>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Phone</span>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Location</span>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Qualification summary</span>
            <Input value={form.qualificationSummary} onChange={(e) => setForm((f) => ({ ...f, qualificationSummary: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Experience summary</span>
            <Input value={form.experienceSummary} onChange={(e) => setForm((f) => ({ ...f, experienceSummary: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Cover letter</span>
            <Input value={form.coverLetter} onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Salary expectation</span>
            <Input type="number" value={form.salaryExpectation} onChange={(e) => setForm((f) => ({ ...f, salaryExpectation: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Resume (paste text)</span>
            <Input value={form.resumeText} onChange={(e) => setForm((f) => ({ ...f, resumeText: e.target.value }))} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          />
          I consent to processing of my application data
        </label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !form.fullName || !form.email || !form.consent} onClick={apply}>
            Submit application
          </Button>
          <Button variant="secondary" onClick={() => navigate('/careers/portal')}>Open portal</Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {done ? <p className="text-sm text-ink">{done}</p> : null}
      </Surface>
    </div>
  );
}

export function CandidatePortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState(() => searchParams.get('token') || getStoredToken());
  const [tokenInput, setTokenInput] = useState(token);
  const [me, setMe] = useState<PortalMe | null>(null);
  const [offers, setOffers] = useState<PortalOffer[]>([]);
  const [apps, setApps] = useState<PortalApplication[]>([]);
  const [prejoining, setPrejoining] = useState<Array<{ id: number; name: string; status: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyOffer, setBusyOffer] = useState<number | null>(null);
  useDocumentTitle('Candidate Portal');

  const load = useCallback(async (t: string) => {
    if (!t) {
      setMe(null);
      setOffers([]);
      setApps([]);
      setPrejoining([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile = await publicApi<PortalMe>(`${PUBLIC_BASE}/portal/me`, { auth: false, token: t });
      setMe(profile);
      const fromMe = profile.applications ?? [];
      try {
        const listed = asArray(
          await publicApi<PortalApplication[] | { items: PortalApplication[] }>(
            `${PUBLIC_BASE}/portal/applications`,
            { auth: false, token: t },
          ),
        );
        setApps(listed.length ? listed : fromMe);
      } catch {
        setApps(fromMe);
      }
      try {
        const offerList = asArray(
          await publicApi<PortalOffer[] | { items: PortalOffer[] }>(`${PUBLIC_BASE}/portal/offers`, {
            auth: false,
            token: t,
          }),
        );
        setOffers(offerList);
      } catch {
        setOffers([]);
      }
      try {
        const firstApp = fromMe[0]?.id;
        if (firstApp) {
          try {
            const tasks = asArray(
              await publicApi<Array<{ id: number; name: string; status: string }> | { items: Array<{ id: number; name: string; status: string }> }>(
                `${PUBLIC_BASE}/portal/prejoining`,
                { auth: false, token: t },
              ),
            );
            if (tasks.length) {
              setPrejoining(tasks);
            } else {
              throw new Error('empty');
            }
          } catch {
            const alt = asArray(
              await publicApi(
                `${PUBLIC_BASE}/portal/applications/${firstApp}/prejoining`,
                { auth: false, token: t },
              ),
            ) as Array<{ id: number; name: string; status: string }>;
            setPrejoining(alt);
          }
        } else {
          setPrejoining([]);
        }
      } catch {
        setPrejoining([]);
      }
    } catch (e) {
      setMe(null);
      setError(e instanceof Error ? e.message : 'Unable to load portal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get('token');
    if (fromQuery) {
      storeToken(fromQuery);
      setToken(fromQuery);
      setTokenInput(fromQuery);
      const next = new URLSearchParams(searchParams);
      next.delete('token');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  function saveToken() {
    const t = tokenInput.trim();
    storeToken(t);
    setToken(t);
  }

  async function respondOffer(offerId: number, action: 'accept' | 'decline') {
    if (!token) return;
    setBusyOffer(offerId);
    setError(null);
    try {
      await publicApi(`${PUBLIC_BASE}/portal/offers/${offerId}/${action}`, {
        method: 'POST',
        auth: false,
        token,
        body: '{}',
      });
      await load(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} offer`);
    } finally {
      setBusyOffer(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 px-4 py-8">
      <PageHeader
        title="Candidate Portal"
        subtitle="Track applications, offers and pre-joining tasks"
        actions={<Link to="/careers"><Button variant="secondary">Careers</Button></Link>}
      />
      <Surface className="flex flex-wrap items-end gap-2 p-4">
        <label className="grow text-sm">
          <span className="mb-1 block text-ink-muted">Access token</span>
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste token from application email / apply response"
          />
        </label>
        <Button onClick={saveToken}>Save & load</Button>
      </Surface>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <Skeleton className="h-40 w-full" /> : null}
      {!loading && me?.candidate ? (
        <>
          <Surface className="space-y-1 p-4">
            <p className="text-lg font-semibold">{me.candidate.fullName}</p>
            <p className="text-sm text-ink-muted">{me.candidate.email}</p>
            {me.candidate.phone ? <p className="text-sm">{me.candidate.phone}</p> : null}
          </Surface>
          <Surface className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Applications</h2>
            {apps.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
                <div>
                  <p className="text-sm font-medium">{a.openingTitle || `Opening #${a.openingId}`}</p>
                  <p className="text-xs text-ink-muted">Application #{a.id}</p>
                </div>
                <StatusPill value={a.status} />
              </div>
            ))}
            {apps.length === 0 ? <p className="text-sm text-ink-muted">No applications</p> : null}
          </Surface>
          <Surface className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Offers</h2>
            {offers.map((o) => (
              <div key={o.id} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{o.offerNumber || `Offer #${o.id}`}</p>
                  <StatusPill value={o.status} />
                </div>
                {o.compensationSummary ? <p className="text-sm">{o.compensationSummary}</p> : null}
                {o.proposedJoiningDate ? (
                  <p className="text-xs text-ink-muted">Joining {String(o.proposedJoiningDate).slice(0, 10)}</p>
                ) : null}
                {o.status === 'ISSUED' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={busyOffer === o.id} onClick={() => respondOffer(o.id, 'accept')}>Accept</Button>
                    <Button size="sm" variant="secondary" disabled={busyOffer === o.id} onClick={() => respondOffer(o.id, 'decline')}>Decline</Button>
                  </div>
                ) : null}
              </div>
            ))}
            {offers.length === 0 ? <p className="text-sm text-ink-muted">No offers yet</p> : null}
          </Surface>
          <Surface className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Pre-joining</h2>
            {prejoining.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
                <p className="text-sm">{t.name}</p>
                <StatusPill value={t.status} />
              </div>
            ))}
            {prejoining.length === 0 ? <p className="text-sm text-ink-muted">No pre-joining tasks</p> : null}
          </Surface>
        </>
      ) : !loading && token ? (
        <p className="text-sm text-ink-muted">Could not load portal data for this token.</p>
      ) : !loading ? (
        <p className="text-sm text-ink-muted">Enter your candidate access token to continue.</p>
      ) : null}
    </div>
  );
}
