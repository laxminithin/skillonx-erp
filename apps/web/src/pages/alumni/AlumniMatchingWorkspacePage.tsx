import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface, Button } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'OPEN_NEEDS', label: 'Open Needs' },
  { id: 'MATCHING', label: 'Matching' },
  { id: 'SHORTLISTED', label: 'Shortlisted' },
  { id: 'ENGAGEMENT_IN_PROGRESS', label: 'Engagement in Progress' },
  { id: 'PARTIALLY_FULFILLED', label: 'Partially Fulfilled' },
  { id: 'FULFILLED', label: 'Fulfilled' },
  { id: 'NEEDS_ATTENTION', label: 'Needs Attention' },
] as const;

const NEED_TYPES = [
  'MENTORSHIP', 'RECRUITMENT', 'INTERNSHIP', 'EXPERT_SESSION', 'RESOURCE_PERSON',
  'PROJECT_MENTORING', 'INDUSTRY_PROJECT', 'RESEARCH_COLLABORATION', 'BOS_ADVISORY',
  'CURRICULUM_REVIEW', 'STARTUP_MENTORING', 'INDUSTRIAL_VISIT', 'MOU_COLLABORATION',
  'CAREER_GUIDANCE', 'MOCK_INTERVIEW', 'TECHNICAL_REVIEW', 'HACKATHON_JUDGE',
  'PROJECT_EVALUATOR', 'OTHER',
];

export function AlumniMatchingWorkspacePage() {
  useDocumentTitle('Alumni Matching');
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') || 'OPEN_NEEDS').toUpperCase();
  const needIdParam = params.get('needId');
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    type: 'MENTORSHIP',
    title: '',
    description: '',
    domain: '',
    skillsTopics: '',
    quantityRequired: '',
    mode: 'ANY',
    priority: 'NORMAL',
    deadline: '',
  });

  function setView(v: string) {
    setParams({ view: v });
    setDetail(null);
    setCandidates([]);
  }

  function loadWorkspace() {
    setLoading(true);
    setError('');
    api(`/api/alumni-admin/matching?view=${view}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load matching workspace'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadWorkspace();
  }, [view]);

  useEffect(() => {
    if (needIdParam) openNeed(Number(needIdParam));
  }, [needIdParam]);

  async function openNeed(id: number) {
    setBusy(`need-${id}`);
    setError('');
    try {
      const d = await api(`/api/alumni-admin/matching/needs/${id}`);
      setDetail(d);
      setParams({ view, needId: String(id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load need');
    } finally {
      setBusy('');
    }
  }

  async function createNeed() {
    setBusy('create');
    setError('');
    try {
      const body: Record<string, unknown> = {
        type: form.type,
        title: form.title,
        description: form.description || null,
        domain: form.domain || null,
        skillsTopics: form.skillsTopics
          ? form.skillsTopics.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
          : [],
        mode: form.mode === 'ANY' ? null : form.mode,
        priority: form.priority,
        deadline: form.deadline || null,
        status: 'OPEN',
      };
      if (form.quantityRequired) body.quantityRequired = Number(form.quantityRequired);
      const res = await api<{ need: { id: number } }>('/api/alumni-admin/matching/needs', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowCreate(false);
      setForm({ type: 'MENTORSHIP', title: '', description: '', domain: '', skillsTopics: '', quantityRequired: '', mode: 'ANY', priority: 'NORMAL', deadline: '' });
      await openNeed(res.need.id);
      loadWorkspace();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy('');
    }
  }

  async function evaluate() {
    if (!detail?.need?.id) return;
    setBusy('evaluate');
    setError('');
    try {
      const res = await api<{ candidates: any[] }>(`/api/alumni-admin/matching/needs/${detail.need.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ includeLimited: true, limit: 40 }),
      });
      setCandidates(res.candidates || []);
      const d = await api(`/api/alumni-admin/matching/needs/${detail.need.id}`);
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluate failed');
    } finally {
      setBusy('');
    }
  }

  async function shortlist(alumniProfileId: number, snapshot?: any) {
    if (!detail?.need?.id) return;
    setBusy(`sl-${alumniProfileId}`);
    try {
      await api(`/api/alumni-admin/matching/needs/${detail.need.id}/shortlist`, {
        method: 'POST',
        body: JSON.stringify({ alumniProfileId, matchSnapshot: snapshot || null }),
      });
      const d = await api(`/api/alumni-admin/matching/needs/${detail.need.id}`);
      setDetail(d);
      setCandidates((prev) => prev.filter((c) => c.alumniProfileId !== alumniProfileId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Shortlist failed');
    } finally {
      setBusy('');
    }
  }

  async function dismiss(alumniProfileId: number) {
    if (!detail?.need?.id) return;
    setBusy(`di-${alumniProfileId}`);
    try {
      await api(`/api/alumni-admin/matching/needs/${detail.need.id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ alumniProfileId, reason: 'NOT_RELEVANT' }),
      });
      setCandidates((prev) => prev.filter((c) => c.alumniProfileId !== alumniProfileId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed');
    } finally {
      setBusy('');
    }
  }

  async function engage(shortlistId: number) {
    setBusy(`eng-${shortlistId}`);
    try {
      await api(`/api/alumni-admin/matching/shortlist/${shortlistId}/engage`, {
        method: 'POST',
        body: JSON.stringify({ channel: 'MANUAL', createProgramIfMissing: true }),
      });
      if (detail?.need?.id) {
        const d = await api(`/api/alumni-admin/matching/needs/${detail.need.id}`);
        setDetail(d);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Engagement handoff failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Alumni Matching"
        subtitle="Connect institutional needs with suitable alumni — human shortlist required. Matching never auto-contacts."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowCreate(true)}>Create Need</Button>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/recognition">Recognition</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/engagement">Engagement</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni admin</Link>
          </div>
        )}
      />

      {data?.metrics ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 text-sm">
          {[
            ['Open needs', data.metrics.openNeeds],
            ['With matches', data.metrics.needsWithMatches],
            ['Without matches', data.metrics.needsWithoutSuitableMatches],
            ['Shortlisted', data.metrics.shortlistedAlumni],
            ['Engagement initiated', data.metrics.engagementInitiated],
            ['Fulfilled', data.metrics.fulfilled],
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

      {showCreate ? (
        <div data-testid="create-need-form">
        <Surface className="space-y-3">
          <h3 className="font-medium">Create institutional need (structured matching)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Type
              <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {NEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Title
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="text-sm sm:col-span-2">
              Description
              <textarea className="mt-1 w-full rounded border border-border px-2 py-1.5" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="text-sm">
              Domain
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="e.g. Cybersecurity" />
            </label>
            <label className="text-sm">
              Skills / topics
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.skillsTopics} onChange={(e) => setForm({ ...form, skillsTopics: e.target.value })} placeholder="comma-separated" />
            </label>
            <label className="text-sm">
              Quantity
              <input className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.quantityRequired} onChange={(e) => setForm({ ...form, quantityRequired: e.target.value })} />
            </label>
            <label className="text-sm">
              Mode
              <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="ANY">ANY</option>
                <option value="ONLINE">ONLINE</option>
                <option value="IN_PERSON">IN_PERSON</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </label>
            <label className="text-sm">
              Priority
              <select className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </label>
            <label className="text-sm">
              Deadline
              <input type="date" className="mt-1 w-full rounded border border-border px-2 py-1.5" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!form.title || busy === 'create'} onClick={createNeed}>Save need</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Surface>
        </div>
      ) : null}

      {!loading && !detail && view === 'NEEDS_ATTENTION' && data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="space-y-2">
            <h3 className="font-medium">Open tasks</h3>
            {(data.tasks || []).length === 0 ? (
              <p className="text-sm text-ink-muted">No open matching tasks.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.tasks.map((t: any) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-ink-muted">{t.taskType} · {t.needTitle || '—'}</p>
                    </div>
                    {t.needId ? (
                      <Button size="sm" variant="ghost" onClick={() => openNeed(t.needId)}>Open</Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Surface>
          <Surface className="space-y-2">
            <h3 className="font-medium">Deadlines approaching</h3>
            {(data.deadlineSoon || []).length === 0 ? (
              <p className="text-sm text-ink-muted">None in the next 14 days.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.deadlineSoon.map((n: any) => (
                  <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-ink-muted">{n.type} · deadline {n.deadline}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openNeed(n.id)}>Open</Button>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>
      ) : null}

      {!loading && !detail && view !== 'NEEDS_ATTENTION' && data?.needs ? (
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-muted">
                <th className="p-2">Need</th>
                <th className="p-2">Type</th>
                <th className="p-2">Status</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Deadline</th>
                <th className="p-2">Shortlist</th>
                <th className="p-2">Fulfilment</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {data.needs.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-ink-muted">No needs in this view.</td></tr>
              ) : data.needs.map((n: any) => (
                <tr key={n.id} className="border-b border-border/60">
                  <td className="p-2 font-medium">{n.title}</td>
                  <td className="p-2">{n.type}</td>
                  <td className="p-2"><StatusPill tone="muted">{n.status}</StatusPill></td>
                  <td className="p-2">{n.priority}</td>
                  <td className="p-2">{n.deadline || '—'}</td>
                  <td className="p-2">{n.shortlistCount}</td>
                  <td className="p-2">
                    {n.quantityRequired != null
                      ? `${n.quantityVerified}/${n.quantityRequired} verified`
                      : `${n.quantityVerified} verified`}
                  </td>
                  <td className="p-2">
                    <Button size="sm" variant="ghost" disabled={busy === `need-${n.id}`} onClick={() => openNeed(n.id)}>Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}

      {detail?.need ? (
        <div className="space-y-4" data-testid="need-detail">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDetail(null); setCandidates([]); setParams({ view }); }}>← Back to list</Button>
            <StatusPill tone="muted">{detail.need.status}</StatusPill>
            <StatusPill tone="muted">{detail.need.type}</StatusPill>
          </div>

          <Surface className="space-y-2">
            <h2 className="text-lg font-semibold">{detail.need.title}</h2>
            <p className="text-sm text-ink-muted">{detail.need.description || 'No description'}</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><span className="text-ink-muted">Source:</span> {detail.source?.type} {detail.source?.reference ? `· ${detail.source.reference}` : ''}</p>
              <p><span className="text-ink-muted">Domain:</span> {detail.need.domain || '—'}</p>
              <p><span className="text-ink-muted">Owner:</span> {detail.ownerName || '—'}</p>
              <p><span className="text-ink-muted">Mode:</span> {detail.need.mode || '—'}</p>
              <p><span className="text-ink-muted">Deadline:</span> {detail.need.deadline || '—'}</p>
              <p>
                <span className="text-ink-muted">Quantity:</span>{' '}
                required {detail.need.quantityRequired ?? '—'} · confirmed {detail.need.quantityConfirmed} · verified {detail.need.quantityVerified}
              </p>
            </div>
            {(detail.need.skillsTopics || []).length ? (
              <p className="text-sm"><span className="text-ink-muted">Skills/topics:</span> {detail.need.skillsTopics.join(', ')}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" disabled={busy === 'evaluate'} onClick={evaluate}>Evaluate candidates</Button>
            </div>
          </Surface>

          {(detail.shortlist || []).length ? (
            <div data-testid="shortlist-panel">
            <Surface className="space-y-2">
              <h3 className="font-medium">Shortlisted alumni</h3>
              <ul className="divide-y divide-border text-sm">
                {detail.shortlist.map((s: any) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{s.alumniName || `Alumni #${s.alumniProfileId}`}</p>
                      <p className="text-xs text-ink-muted">{s.status} · allocated {s.allocatedQuantity ?? '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link className="inline-flex items-center rounded border border-border px-2 py-1 text-xs" to={`/alumni-admin/profiles/${s.alumniProfileId}/360`}>View 360</Link>
                      {s.status === 'SHORTLISTED' ? (
                        <Button size="sm" disabled={busy === `eng-${s.id}`} onClick={() => engage(s.id)}>Initiate Engagement</Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Surface>
            </div>
          ) : null}

          {candidates.length ? (
            <div data-testid="candidate-results">
            <Surface className="space-y-3">
              <h3 className="font-medium">Matched alumni (explainable)</h3>
              <ul className="space-y-4">
                {candidates.map((c) => (
                  <li key={c.alumniProfileId} className="rounded border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{c.identity?.name || `Alumni #${c.alumniProfileId}`}</p>
                        <p className="text-xs text-ink-muted">
                          {c.currentRole || '—'}{c.currentOrganization ? ` · ${c.currentOrganization}` : ''}
                          {c.industry ? ` · ${c.industry}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <StatusPill tone={c.matchQuality === 'STRONG' ? 'success' : 'muted'}>MATCH {c.matchQuality}</StatusPill>
                        <StatusPill tone="muted">CAPABILITY {c.capabilityStrength}</StatusPill>
                        <StatusPill tone="muted">WILLINGNESS {c.willingness}</StatusPill>
                        <StatusPill tone="muted">{c.matchStatus}</StatusPill>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm" data-testid="explain-why">
                      <div>
                        <p className="text-xs font-medium text-ink-muted">WHY MATCHED</p>
                        <ul className="mt-1 space-y-0.5">
                          {(c.whyMatched || []).map((w: any) => (
                            <li key={w.code}>✓ {w.label}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink-muted">CONSIDERATIONS</p>
                        {(c.considerations || []).length === 0 ? (
                          <p className="mt-1 text-ink-muted">None</p>
                        ) : (
                          <ul className="mt-1 space-y-0.5">
                            {c.considerations.map((w: any) => (
                              <li key={w.code}>• {w.label}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                      Relationship: {c.relationship?.stage || '—'} · load {c.engagementLoad?.activeOpportunities?.length || 0} active opps · C4 {c.engagementEligibility?.eligibility || '—'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy === `sl-${c.alumniProfileId}`} onClick={() => shortlist(c.alumniProfileId, c)}>Shortlist</Button>
                      <Button size="sm" variant="ghost" disabled={busy === `di-${c.alumniProfileId}`} onClick={() => dismiss(c.alumniProfileId)}>Dismiss</Button>
                      <Link className="inline-flex items-center rounded border border-border px-2.5 py-1.5 text-xs font-medium" to={`/alumni-admin/profiles/${c.alumniProfileId}/360`}>View 360</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Surface>
            </div>
          ) : null}

          {(detail.fulfilment || []).length ? (
            <div data-testid="fulfilment-panel">
            <Surface className="space-y-2">
              <h3 className="font-medium">Fulfilment allocations</h3>
              <ul className="divide-y divide-border text-sm">
                {detail.fulfilment.map((f: any) => (
                  <li key={f.id} className="py-2">
                    Alumni #{f.alumniProfileId} · promised {f.promisedQuantity} · confirmed {f.confirmedQuantity} · verified {f.verifiedQuantity} · {f.status}
                  </li>
                ))}
              </ul>
            </Surface>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
