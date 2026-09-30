import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'MENTORSHIP', label: 'Mentorship' },
  { id: 'RECRUITMENT', label: 'Recruitment' },
  { id: 'INTERNSHIPS', label: 'Internships' },
  { id: 'EXPERTS', label: 'Experts' },
  { id: 'PROJECTS', label: 'Projects' },
  { id: 'RESEARCH', label: 'Research' },
  { id: 'BOS', label: 'BoS' },
  { id: 'STARTUPS', label: 'Startups' },
  { id: 'INDUSTRY_CONNECT', label: 'Industry Connect' },
  { id: 'REACTIVATION', label: 'Reactivation' },
  { id: 'DATA_REFRESH', label: 'Data Refresh' },
] as const;

type Workspace = {
  view: string;
  results: any[];
  segments?: any[];
  presets?: string[];
  totalMatchedInWindow?: number;
  note?: string;
  matrix?: Record<string, number>;
};

export function AlumniIntelligenceWorkspacePage() {
  useDocumentTitle('Alumni Intelligence');
  const [view, setView] = useState('MENTORSHIP');
  const [data, setData] = useState<Workspace | null>(null);
  const [matrix, setMatrix] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [explainId, setExplainId] = useState<number | null>(null);
  const [explain, setExplain] = useState<any>(null);
  const [segName, setSegName] = useState('');
  const [segMsg, setSegMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    api<Workspace>(`/api/alumni-admin/intelligence?view=${view}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load intelligence'))
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => {
    api('/api/alumni-admin/intelligence/matrix')
      .then(setMatrix)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!explainId) {
      setExplain(null);
      return;
    }
    api(`/api/alumni-admin/profiles/${explainId}/intelligence`)
      .then(setExplain)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load explain-why'));
  }, [explainId]);

  async function saveCurrentAsSegment() {
    if (!segName.trim()) return;
    const dimension =
      view === 'INTERNSHIPS' ? 'INTERNSHIP'
        : view === 'EXPERTS' ? 'EXPERT_SESSION'
          : view === 'PROJECTS' ? 'PROJECT_MENTORING'
            : view === 'RESEARCH' ? 'RESEARCH_COLLABORATION'
              : view === 'BOS' ? 'BOS_ADVISORY'
                : view === 'STARTUPS' ? 'STARTUP_SUPPORT'
                  : view === 'INDUSTRY_CONNECT' ? 'INDUSTRIAL_VISIT'
                    : view === 'REACTIVATION' || view === 'DATA_REFRESH' ? null
                      : view;
    try {
      const ruleDefinition = view === 'REACTIVATION'
        ? { combinator: 'AND' as const, filters: [{ field: 'relationshipReadiness' as const, value: 'NEEDS_REACTIVATION' }, { field: 'evidenceState' as const, op: 'in' as const, value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE'] }] }
        : view === 'DATA_REFRESH'
          ? { combinator: 'AND' as const, filters: [{ field: 'freshnessState' as const, value: 'STALE' }] }
          : {
              combinator: 'AND' as const,
              filters: [
                { field: 'dimension' as const, value: dimension! },
                { field: 'evidenceState' as const, op: 'in' as const, value: ['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'] },
                { field: 'willingnessState' as const, op: 'neq' as const, value: 'NOT_WILLING' },
              ],
            };
      await api('/api/alumni-admin/segments', {
        method: 'POST',
        body: JSON.stringify({
          name: segName.trim(),
          description: `Saved from ${view} workspace view`,
          ruleDefinition,
          scope: 'PERSONAL',
        }),
      });
      setSegMsg('Segment saved (rules only — membership recomputed on evaluate).');
      setSegName('');
      const refreshed = await api<Workspace>(`/api/alumni-admin/intelligence?view=${view}`);
      setData(refreshed);
    } catch (e) {
      setSegMsg(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Alumni Intelligence"
        subtitle="Explainable capability & opportunity fit from Alumni 360 + CRM. No opaque scores. No automated outreach."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni admin</Link>
          </div>
        )}
      />

      {matrix?.matrix ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 text-sm">
          {[
            ['High + Willing', matrix.matrix.HIGH_EVIDENCE_WILLING],
            ['High + Not asked', matrix.matrix.HIGH_EVIDENCE_NOT_ASKED],
            ['High + Not willing', matrix.matrix.HIGH_EVIDENCE_NOT_WILLING],
            ['Limited + Willing', matrix.matrix.LIMITED_EVIDENCE_WILLING],
            ['Insufficient data', matrix.matrix.INSUFFICIENT_DATA],
            ['Sampled', matrix.matrix.sampled],
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
            onClick={() => { setView(v.id); setExplainId(null); }}
            className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm ${view === v.id ? 'border-ink bg-ink text-white' : 'border-border hover:bg-surface-muted'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Surface className="space-y-3">
        <p className="text-sm font-semibold">Segment builder</p>
        <p className="text-xs text-ink-muted">Saved segments store filter rules — not alumni lists. Evaluate dynamically.</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Segment name (e.g. CSE alumni willing to mentor)"
            value={segName}
            onChange={(e) => setSegName(e.target.value)}
          />
          <Button type="button" onClick={saveCurrentAsSegment}>Save current view rules</Button>
        </div>
        {segMsg ? <p className="text-xs text-ink-muted">{segMsg}</p> : null}
        {data?.segments?.length ? (
          <ul className="space-y-1 text-sm">
            {data.segments.slice(0, 8).map((s: any) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{s.name} <span className="text-xs text-ink-muted">({s.scope})</span></span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={async () => {
                    const r = await api<any>(`/api/alumni-admin/segments/${s.id}/evaluate`, { method: 'POST', body: '{}' });
                    setData((prev) => prev ? { ...prev, results: r.results, totalMatchedInWindow: r.totalMatchedInWindow, note: `Evaluated: ${s.name}` } : prev);
                  }}
                >
                  Evaluate
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Surface>

      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {!loading && data ? (
        <Surface className="space-y-3 overflow-x-auto">
          <p className="text-xs text-ink-muted">{data.note} · Matched in window: {data.totalMatchedInWindow ?? data.results.length}</p>
          {!data.results?.length ? (
            <p className="text-sm text-ink-muted">No alumni match this intelligence view yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.results.map((item: any) => (
                <li key={item.alumniProfileId} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {[item.usn, item.department, item.graduationYear, item.focus?.dimension]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {item.focus ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusPill tone="muted">{String(item.focus.evidenceState).replace(/_/g, ' ')}</StatusPill>
                        <StatusPill tone={item.focus.willingnessState === 'WILLING' ? 'success' : 'muted'}>
                          {String(item.focus.willingnessState).replace(/_/g, ' ')}
                        </StatusPill>
                        <StatusPill tone="warning">{String(item.focus.relationshipReadiness).replace(/_/g, ' ')}</StatusPill>
                      </div>
                    ) : null}
                    {item.focus?.why?.length ? (
                      <p className="mt-2 text-xs text-ink-muted">Why: {item.focus.why.slice(0, 2).join('; ')}</p>
                    ) : null}
                    {item.focus?.cautions?.length ? (
                      <p className="mt-1 text-xs text-warning">Caution: {item.focus.cautions[0]}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-[var(--radius-md)] border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                      onClick={() => setExplainId(item.alumniProfileId)}
                    >
                      Explain why
                    </button>
                    <Link
                      className="rounded-[var(--radius-md)] border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                      to={`/alumni-admin/profiles/${item.alumniProfileId}/360`}
                    >
                      Open 360
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ) : null}

      {explainId && explain?.dimensions ? (
        <Surface className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Explain why — profile #{explainId}</h3>
            <button type="button" className="text-xs underline" onClick={() => setExplainId(null)}>Close</button>
          </div>
          <p className="text-xs text-ink-muted">
            Owner: {explain.relationshipContext?.ownerName || 'Unassigned'} · Last contact: {explain.relationshipContext?.lastContactAt || '—'}
          </p>
          {explain.dimensions.filter((d: any) => d.qualifies || d.willingnessState !== 'NOT_ASKED').slice(0, 6).map((d: any) => (
            <div key={d.dimension} className="rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <p className="font-medium">{d.dimension.replace(/_/g, ' ')}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Evidence {d.evidenceState.replace(/_/g, ' ')} · Willingness {d.willingnessState.replace(/_/g, ' ')} · {d.relationshipReadiness.replace(/_/g, ' ')}
              </p>
              <ul className="mt-2 list-disc pl-5 text-xs">
                {d.why.map((w: string) => <li key={w}>{w}</li>)}
              </ul>
              {d.sources?.length ? (
                <p className="mt-2 text-xs text-ink-muted">Sources: {d.sources.slice(0, 4).map((s: any) => s.sourceReference || s.sourceType).join(', ')}</p>
              ) : null}
            </div>
          ))}
        </Surface>
      ) : null}
    </div>
  );
}
