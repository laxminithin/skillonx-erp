import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface, Button } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'PROGRAMS', label: 'Programs' },
  { id: 'NOMINATIONS', label: 'Nominations' },
  { id: 'REVIEW_QUEUE', label: 'Review Queue' },
  { id: 'RECOGNITIONS', label: 'Recognitions' },
  { id: 'SPOTLIGHTS', label: 'Spotlights' },
  { id: 'VALUE_OFFERINGS', label: 'Value Offerings' },
  { id: 'COMMUNITIES', label: 'Communities' },
  { id: 'RECIPROCITY', label: 'Reciprocity' },
  { id: 'SUGGESTIONS', label: 'Suggestions' },
] as const;

const CATEGORIES = [
  'PROFESSIONAL_ACHIEVEMENT', 'ENTREPRENEURSHIP', 'RESEARCH_INNOVATION', 'PUBLICATION',
  'PATENT_IP', 'LEADERSHIP', 'SOCIAL_IMPACT', 'ACADEMIC_ACHIEVEMENT', 'HIGHER_EDUCATION',
  'INDUSTRY_ACHIEVEMENT', 'MENTORSHIP_CONTRIBUTION', 'RECRUITMENT_CONTRIBUTION',
  'INTERNSHIP_SUPPORT', 'EXPERT_CONTRIBUTION', 'PROJECT_SUPPORT', 'RESEARCH_COLLABORATION',
  'STARTUP_SUPPORT', 'INSTITUTIONAL_SERVICE', 'COMMUNITY_SERVICE', 'DISTINGUISHED_ALUMNUS',
  'YOUNG_ACHIEVER', 'OTHER',
];

const VALUE_CATEGORIES = [
  'PROFESSIONAL_NETWORKING', 'CONTINUOUS_LEARNING', 'EXPERT_VISIBILITY', 'SPEAKING_OPPORTUNITY',
  'MENTOR_RECOGNITION', 'FOUNDER_SHOWCASE', 'STARTUP_NETWORK', 'RESEARCH_COLLABORATION',
  'FACULTY_COLLABORATION', 'TALENT_ACCESS', 'RECRUITMENT_ACCESS', 'CAREER_NETWORKING',
  'INSTITUTIONAL_FACILITY_ACCESS', 'EVENT_ACCESS', 'ALUMNI_COMMUNITY', 'VOLUNTEERING', 'OTHER',
];

const COMMUNITY_TYPES = [
  'BATCH', 'DEPARTMENT', 'INDUSTRY', 'LOCATION', 'FOUNDER', 'RESEARCH', 'MENTOR', 'CHAPTER', 'OTHER',
];

const REVIEW_STAGES = [
  'NOMINATION', 'DEPARTMENT_REVIEW', 'ALUMNI_COMMITTEE', 'INSTITUTIONAL_APPROVAL', 'RECOGNITION_ISSUED',
];

const REVIEW_DECISIONS = ['APPROVE', 'REJECT', 'REQUEST_EVIDENCE', 'SHORTLIST', 'ABSTAIN', 'COMMENT'];

export function AlumniRecognitionWorkspacePage() {
  useDocumentTitle('Alumni Recognition');
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') || 'OVERVIEW').toUpperCase();
  const nominationIdParam = params.get('nominationId');
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [reciprocity, setReciprocity] = useState<any>(null);
  const [reciprocityId, setReciprocityId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [showCreateNomination, setShowCreateNomination] = useState(false);
  const [showCreateValue, setShowCreateValue] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [programForm, setProgramForm] = useState({ name: '', category: 'OTHER', description: '' });
  const [nomForm, setNomForm] = useState({
    alumniProfileId: '',
    title: '',
    category: 'OTHER',
    reason: '',
  });
  const [reviewForm, setReviewForm] = useState({
    stageCode: 'ALUMNI_COMMITTEE',
    decision: 'APPROVE',
    comments: '',
  });
  const [valueForm, setValueForm] = useState({
    title: '',
    category: 'OTHER',
    description: '',
  });
  const [communityForm, setCommunityForm] = useState({
    name: '',
    type: 'CHAPTER',
    description: '',
  });

  function setView(v: string) {
    setParams({ view: v });
    setDetail(null);
    setReciprocity(null);
  }

  function loadWorkspace() {
    setLoading(true);
    setError('');
    api(`/api/alumni-admin/recognition?view=${view}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recognition workspace'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadWorkspace();
  }, [view]);

  useEffect(() => {
    if (nominationIdParam) openNomination(Number(nominationIdParam));
  }, [nominationIdParam]);

  async function openNomination(id: number) {
    setBusy(`nom-${id}`);
    setError('');
    try {
      const d = await api(`/api/alumni-admin/recognition/nominations/${id}`);
      setDetail(d);
      setParams({ view, nominationId: String(id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load nomination');
    } finally {
      setBusy('');
    }
  }

  async function createProgram() {
    setBusy('create-program');
    setError('');
    try {
      await api('/api/alumni-admin/recognition/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: programForm.name,
          category: programForm.category,
          description: programForm.description || null,
          status: 'NOMINATIONS_OPEN',
        }),
      });
      setShowCreateProgram(false);
      setProgramForm({ name: '', category: 'OTHER', description: '' });
      if (view === 'PROGRAMS') loadWorkspace();
      else setView('PROGRAMS');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create program failed');
    } finally {
      setBusy('');
    }
  }

  async function createNomination() {
    setBusy('create-nomination');
    setError('');
    try {
      const res = await api<{ nomination: { id: number } }>('/api/alumni-admin/recognition/nominations', {
        method: 'POST',
        body: JSON.stringify({
          alumniProfileId: Number(nomForm.alumniProfileId),
          title: nomForm.title,
          category: nomForm.category,
          reason: nomForm.reason || null,
          status: 'SUBMITTED',
        }),
      });
      setShowCreateNomination(false);
      setNomForm({ alumniProfileId: '', title: '', category: 'OTHER', reason: '' });
      await openNomination(res.nomination.id);
      loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create nomination failed');
    } finally {
      setBusy('');
    }
  }

  async function submitReview() {
    if (!detail?.nomination?.id) return;
    setBusy('review');
    setError('');
    try {
      const body: Record<string, unknown> = {
        stageCode: reviewForm.stageCode,
        decision: reviewForm.decision,
        comments: reviewForm.comments || null,
      };
      if (reviewForm.decision === 'APPROVE') {
        body.nextNominationStatus = 'APPROVED';
      }
      await api(`/api/alumni-admin/recognition/nominations/${detail.nomination.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await openNomination(detail.nomination.id);
      loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setBusy('');
    }
  }

  async function issueRecognition() {
    if (!detail?.nomination?.id) return;
    setBusy('issue');
    setError('');
    try {
      await api('/api/alumni-admin/recognition/issue', {
        method: 'POST',
        body: JSON.stringify({
          nominationId: detail.nomination.id,
          title: detail.nomination.title,
          category: detail.nomination.category,
          citation: detail.nomination.reason || null,
          issueCertificate: true,
        }),
      });
      await openNomination(detail.nomination.id);
      loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Issue recognition failed');
    } finally {
      setBusy('');
    }
  }

  async function createValueOffering() {
    setBusy('create-value');
    setError('');
    try {
      await api('/api/alumni-admin/recognition/value-offerings', {
        method: 'POST',
        body: JSON.stringify({
          title: valueForm.title,
          category: valueForm.category,
          description: valueForm.description || null,
          status: 'OPEN',
        }),
      });
      setShowCreateValue(false);
      setValueForm({ title: '', category: 'OTHER', description: '' });
      if (view === 'VALUE_OFFERINGS') loadWorkspace();
      else setView('VALUE_OFFERINGS');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create value offering failed');
    } finally {
      setBusy('');
    }
  }

  async function createCommunity() {
    setBusy('create-community');
    setError('');
    try {
      await api('/api/alumni-admin/recognition/communities', {
        method: 'POST',
        body: JSON.stringify({
          name: communityForm.name,
          type: communityForm.type,
          description: communityForm.description || null,
        }),
      });
      setShowCreateCommunity(false);
      setCommunityForm({ name: '', type: 'CHAPTER', description: '' });
      if (view === 'COMMUNITIES') loadWorkspace();
      else setView('COMMUNITIES');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create community failed');
    } finally {
      setBusy('');
    }
  }

  async function loadReciprocity(profileId?: string) {
    const id = Number(profileId ?? reciprocityId);
    if (!id) return;
    setReciprocityId(String(id));
    setBusy('reciprocity');
    setError('');
    try {
      const res = await api(`/api/alumni-admin/recognition/reciprocity/${id}`);
      setReciprocity(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reciprocity');
      setReciprocity(null);
    } finally {
      setBusy('');
    }
  }

  const metrics = data?.metrics;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Alumni Recognition"
        subtitle="Human recognition decisions only — nomination ≠ award. No popularity or donor ranking."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowCreateProgram(true)}>Create Program</Button>
            <Button size="sm" onClick={() => setShowCreateNomination(true)}>Create Nomination</Button>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/engagement">Engagement</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni admin</Link>
          </div>
        )}
      />

      {metrics ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-8 text-sm">
          {[
            ['Pending noms', metrics.pendingNominations],
            ['Evidence needed', metrics.evidenceRequired],
            ['Review due', metrics.reviewDue],
            ['Issued', metrics.approvedRecognitions],
            ['Programs', metrics.upcomingPrograms],
            ['Value open', metrics.openValueOfferings],
            ['Suggestions', metrics.recentContributionSuggestions],
            ['Reciprocity', metrics.reciprocityGuardrailCount],
          ].map(([label, value]) => (
            <Surface key={String(label)} className="p-3">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </Surface>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm ${view === v.id ? 'border-ink bg-ink text-white' : 'border-border hover:bg-surface-muted'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {showCreateProgram ? (
        <div data-testid="create-program-form">
          <Surface className="space-y-3">
            <h3 className="font-medium">Create recognition program</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Name
                <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} />
              </label>
              <label className="text-sm">
                Category
                <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={programForm.category} onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                Description
                <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!programForm.name || busy === 'create-program'} onClick={createProgram}>Save program</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateProgram(false)}>Cancel</Button>
            </div>
          </Surface>
        </div>
      ) : null}

      {showCreateNomination ? (
        <div data-testid="create-nomination-form">
          <Surface className="space-y-3">
            <h3 className="font-medium">Create nomination (does not issue recognition)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Alumni profile ID
                <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={nomForm.alumniProfileId} onChange={(e) => setNomForm({ ...nomForm, alumniProfileId: e.target.value })} />
              </label>
              <label className="text-sm">
                Category
                <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={nomForm.category} onChange={(e) => setNomForm({ ...nomForm, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                Title
                <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={nomForm.title} onChange={(e) => setNomForm({ ...nomForm, title: e.target.value })} />
              </label>
              <label className="text-sm sm:col-span-2">
                Reason
                <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={nomForm.reason} onChange={(e) => setNomForm({ ...nomForm, reason: e.target.value })} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!nomForm.alumniProfileId || !nomForm.title || busy === 'create-nomination'} onClick={createNomination}>Save nomination</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateNomination(false)}>Cancel</Button>
            </div>
          </Surface>
        </div>
      ) : null}

      {showCreateValue ? (
        <Surface className="space-y-3">
          <h3 className="font-medium">Create value offering</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Title
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={valueForm.title} onChange={(e) => setValueForm({ ...valueForm, title: e.target.value })} />
            </label>
            <label className="text-sm">
              Category
              <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={valueForm.category} onChange={(e) => setValueForm({ ...valueForm, category: e.target.value })}>
                {VALUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={valueForm.description} onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!valueForm.title || busy === 'create-value'} onClick={createValueOffering}>Save offering</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateValue(false)}>Cancel</Button>
          </div>
        </Surface>
      ) : null}

      {showCreateCommunity ? (
        <Surface className="space-y-3">
          <h3 className="font-medium">Create community</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={communityForm.name} onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })} />
            </label>
            <label className="text-sm">
              Type
              <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={communityForm.type} onChange={(e) => setCommunityForm({ ...communityForm, type: e.target.value })}>
                {COMMUNITY_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={communityForm.description} onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!communityForm.name || busy === 'create-community'} onClick={createCommunity}>Save community</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreateCommunity(false)}>Cancel</Button>
          </div>
        </Surface>
      ) : null}

      {!loading && !detail && view === 'OVERVIEW' && data?.summary ? (
        <Surface className="space-y-2">
          <h3 className="font-medium">Operational summary</h3>
          <p className="text-sm text-ink-muted">{data.summary.note || 'Recognition decisions remain human; not institutional impact reporting.'}</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-ink-muted">Pending nominations:</span> {metrics?.pendingNominations ?? '—'}</p>
            <p><span className="text-ink-muted">Review due:</span> {metrics?.reviewDue ?? '—'}</p>
            <p><span className="text-ink-muted">Issued recognitions:</span> {metrics?.approvedRecognitions ?? '—'}</p>
            <p><span className="text-ink-muted">Reciprocity reminders:</span> {metrics?.reciprocityGuardrailCount ?? '—'}</p>
          </div>
        </Surface>
      ) : null}

      {!loading && !detail && view === 'PROGRAMS' && data?.programs ? (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setShowCreateProgram(true)}>Create Program</Button>
          <Surface className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-ink-muted">
                  <th className="p-2">Program</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Award date</th>
                </tr>
              </thead>
              <tbody>
                {data.programs.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-ink-muted">No programs yet.</td></tr>
                ) : data.programs.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2">{p.category}</td>
                    <td className="p-2"><StatusPill tone="muted">{p.status}</StatusPill></td>
                    <td className="p-2">{p.awardDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>
      ) : null}

      {!loading && !detail && (view === 'NOMINATIONS' || view === 'REVIEW_QUEUE') && data?.nominations ? (
        <div className="space-y-3">
          {view === 'NOMINATIONS' ? (
            <Button size="sm" onClick={() => setShowCreateNomination(true)}>Create Nomination</Button>
          ) : null}
          <Surface className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-ink-muted">
                  <th className="p-2">Title</th>
                  <th className="p-2">Alumni</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Source</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {data.nominations.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-ink-muted">No nominations in this view.</td></tr>
                ) : data.nominations.map((n: any) => (
                  <tr key={n.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">{n.title}</td>
                    <td className="p-2">{n.alumniName || `#${n.alumniProfileId}`}</td>
                    <td className="p-2">{n.category}</td>
                    <td className="p-2"><StatusPill tone="muted">{n.status}</StatusPill></td>
                    <td className="p-2">{n.source}</td>
                    <td className="p-2">
                      <Button size="sm" variant="ghost" disabled={busy === `nom-${n.id}`} onClick={() => openNomination(n.id)}>Open</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>
      ) : null}

      {!loading && !detail && view === 'RECOGNITIONS' && data?.recognitions ? (
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-muted">
                <th className="p-2">Title</th>
                <th className="p-2">Alumni</th>
                <th className="p-2">Category</th>
                <th className="p-2">Status</th>
                <th className="p-2">Award date</th>
              </tr>
            </thead>
            <tbody>
              {data.recognitions.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-ink-muted">No issued recognitions yet.</td></tr>
              ) : data.recognitions.map((r: any) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="p-2 font-medium">{r.title}</td>
                  <td className="p-2">{r.alumniName || `#${r.alumniProfileId}`}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2"><StatusPill tone="success">{r.status}</StatusPill></td>
                  <td className="p-2">{r.awardDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}

      {!loading && !detail && view === 'SPOTLIGHTS' && data?.spotlights ? (
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-muted">
                <th className="p-2">Headline</th>
                <th className="p-2">Alumni</th>
                <th className="p-2">Status</th>
                <th className="p-2">Consent</th>
              </tr>
            </thead>
            <tbody>
              {data.spotlights.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-ink-muted">No spotlights yet.</td></tr>
              ) : data.spotlights.map((s: any) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="p-2 font-medium">{s.headline}</td>
                  <td className="p-2">{s.alumniName || `#${s.alumniProfileId}`}</td>
                  <td className="p-2"><StatusPill tone="muted">{s.publicationStatus}</StatusPill></td>
                  <td className="p-2">{s.publicationConsent ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}

      {!loading && !detail && view === 'VALUE_OFFERINGS' && data?.offerings ? (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setShowCreateValue(true)}>Create Value Offering</Button>
          <Surface className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-ink-muted">
                  <th className="p-2">Title</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.offerings.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-ink-muted">No value offerings yet.</td></tr>
                ) : data.offerings.map((o: any) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">{o.title}</td>
                    <td className="p-2">{o.category}</td>
                    <td className="p-2"><StatusPill tone="muted">{o.status}</StatusPill></td>
                    <td className="p-2">{o.registeredCount}{o.capacity != null ? ` / ${o.capacity}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>
      ) : null}

      {!loading && !detail && view === 'COMMUNITIES' && data?.communities ? (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setShowCreateCommunity(true)}>Create Community</Button>
          <Surface className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-ink-muted">
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">City</th>
                </tr>
              </thead>
              <tbody>
                {data.communities.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-ink-muted">No communities yet.</td></tr>
                ) : data.communities.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/60">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2">{c.type}</td>
                    <td className="p-2"><StatusPill tone="muted">{c.status}</StatusPill></td>
                    <td className="p-2">{c.city || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </div>
      ) : null}

      {!loading && !detail && view === 'SUGGESTIONS' && data?.suggestions ? (
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-muted">
                <th className="p-2">Suggestion</th>
                <th className="p-2">Alumni</th>
                <th className="p-2">Type</th>
                <th className="p-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {data.suggestions.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-ink-muted">No open suggestions.</td></tr>
              ) : data.suggestions.map((s: any) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="p-2">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-ink-muted">{s.rationale}</p>
                  </td>
                  <td className="p-2">{s.alumniName || `#${s.alumniProfileId}`}</td>
                  <td className="p-2"><StatusPill tone="muted">{s.suggestionType}</StatusPill></td>
                  <td className="p-2">{s.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}

      {!loading && !detail && view === 'RECIPROCITY' ? (
        <div className="space-y-4">
          {(data?.reciprocityReminders || []).length ? (
            <Surface className="space-y-2">
              <h3 className="font-medium">Reciprocity reminders</h3>
              <p className="text-xs text-ink-muted">{data.note || 'Factual reminders only — never an automatic eligibility block.'}</p>
              <ul className="divide-y divide-border text-sm">
                {data.reciprocityReminders.map((r: any) => (
                  <li key={r.alumniProfileId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{r.alumniName || `Alumni #${r.alumniProfileId}`}</p>
                      <p className="text-xs text-ink-muted">{r.guardrail?.message || 'Guardrail triggered'}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => loadReciprocity(String(r.alumniProfileId))}>View</Button>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : (
            <Surface className="text-sm text-ink-muted">No reciprocity reminders in the current window.</Surface>
          )}

          <Surface className="space-y-3">
            <h3 className="font-medium">Look up alumni reciprocity (factual lists, no score)</h3>
            <div className="flex flex-wrap gap-2">
              <input
                className="rounded border border-border px-2 py-1.5 text-sm"
                placeholder="Alumni profile ID"
                value={reciprocityId}
                onChange={(e) => setReciprocityId(e.target.value)}
              />
              <Button size="sm" disabled={!reciprocityId || busy === 'reciprocity'} onClick={() => loadReciprocity()}>Load</Button>
            </div>
            {reciprocity ? (
              <div className="grid gap-4 sm:grid-cols-2 text-sm" data-testid="reciprocity-detail">
                <div>
                  <p className="text-xs font-medium text-ink-muted">Alumni → Institution</p>
                  <ul className="mt-1 space-y-1">
                    {(reciprocity.alumniToInstitution || []).length === 0 ? (
                      <li className="text-ink-muted">None recorded</li>
                    ) : reciprocity.alumniToInstitution.map((i: any, idx: number) => (
                      <li key={`${i.kind}-${idx}`}>{i.label} · count {i.count}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Institution → Alumni</p>
                  <ul className="mt-1 space-y-1">
                    {(reciprocity.institutionToAlumni || []).length === 0 ? (
                      <li className="text-ink-muted">None recorded</li>
                    ) : reciprocity.institutionToAlumni.map((i: any, idx: number) => (
                      <li key={`${i.kind}-${idx}`}>{i.label} · count {i.count}</li>
                    ))}
                  </ul>
                </div>
                {reciprocity.guardrail?.triggered ? (
                  <p className="sm:col-span-2 text-sm text-danger">{reciprocity.guardrail.message}</p>
                ) : null}
                <p className="sm:col-span-2 text-xs text-ink-muted">{reciprocity.note}</p>
              </div>
            ) : null}
          </Surface>
        </div>
      ) : null}

      {detail?.nomination ? (
        <div className="space-y-4" data-testid="nomination-detail">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDetail(null); setParams({ view }); }}>← Back to list</Button>
            <StatusPill tone="muted">{detail.nomination.status}</StatusPill>
            <StatusPill tone="muted">{detail.nomination.category}</StatusPill>
          </div>

          <Surface className="space-y-2">
            <h2 className="text-lg font-semibold">{detail.nomination.title}</h2>
            <p className="text-sm text-ink-muted">{detail.nomination.reason || 'No reason provided'}</p>
            <p className="text-sm">
              <span className="text-ink-muted">Alumni:</span>{' '}
              <Link className="underline" to={`/alumni-admin/profiles/${detail.nomination.alumniProfileId}/360`}>
                #{detail.nomination.alumniProfileId}
              </Link>
              {' · '}source {detail.nomination.source}
            </p>
            {detail.nomination.status === 'APPROVED' ? (
              <div className="pt-2">
                <Button size="sm" disabled={busy === 'issue'} onClick={issueRecognition}>
                  Issue recognition
                </Button>
                <p className="mt-1 text-xs text-ink-muted">Review does not issue — use this button to create the recognition record.</p>
              </div>
            ) : null}
          </Surface>

          {(detail.evidence || []).length ? (
            <Surface className="space-y-2">
              <h3 className="font-medium">Evidence</h3>
              <ul className="divide-y divide-border text-sm">
                {detail.evidence.map((e: any) => (
                  <li key={e.id} className="py-2">
                    {e.sourceType} · {e.label || e.sourceReference || '—'} · {e.verificationStatus}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {(detail.reviews || []).length ? (
            <Surface className="space-y-2">
              <h3 className="font-medium">Reviews</h3>
              <ul className="divide-y divide-border text-sm">
                {detail.reviews.map((r: any) => (
                  <li key={r.id} className="py-2">
                    {r.stageCode} · {r.decision} {r.comments ? `· ${r.comments}` : ''}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {!['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(detail.nomination.status) ? (
            <div data-testid="review-form">
              <Surface className="space-y-3">
                <h3 className="font-medium">Review nomination (does not issue recognition)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Stage
                    <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={reviewForm.stageCode} onChange={(e) => setReviewForm({ ...reviewForm, stageCode: e.target.value })}>
                      {REVIEW_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    Decision
                    <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={reviewForm.decision} onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}>
                      {REVIEW_DECISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Comments
                    <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} />
                  </label>
                </div>
                <Button size="sm" disabled={busy === 'review'} onClick={submitReview}>Submit review</Button>
              </Surface>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
