/**
 * HRMS Performance & Appraisal — employee, HOD/manager, HR, and Principal experiences.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type StatusMap = Record<string, number>;

type AppraisalRow = {
  id: number;
  cycleId?: number;
  cycleName?: string;
  cycleCode?: string;
  status: string;
  finalScore?: number | null;
  finalRatingLabel?: string | null;
  employeeName?: string;
  employeeNumber?: string;
  employeeId?: number;
  selfScore?: number | null;
  reviewerScore?: number | null;
  calibratedScore?: number | null;
};

type Goal = {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  target?: string | null;
  weight: number;
  status: string;
  selfProgress?: number | null;
  selfRating?: number | null;
  selfComments?: string | null;
  reviewerRating?: number | null;
  reviewerComments?: string | null;
};

type CriterionResp = {
  criterionId: number;
  name?: string;
  code?: string;
  weight?: number;
  selfRatingAllowed?: boolean;
  selfRating?: number | null;
  selfComments?: string | null;
  reviewerRating?: number | null;
  reviewerComments?: string | null;
  systemValue?: number | null;
  systemDisplay?: string | null;
};

type EvidenceItem = {
  id?: number;
  source?: string;
  label?: string;
  displayValue?: string;
  systemValue?: number | null;
  payload?: unknown;
};

type AppraisalDetail = AppraisalRow & {
  employeeSummary?: string | null;
  reviewerSummary?: string | null;
  goals?: Goal[];
  criteria?: CriterionResp[];
  evidence?: EvidenceItem[];
  templateId?: number;
  promotionRecommendation?: string | null;
  incrementRecommendation?: string | null;
  probationRecommendation?: string | null;
  recommendationNotes?: string | null;
};

type Cycle = {
  id: number;
  name: string;
  code: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  defaultTemplateId?: number | null;
};

type Template = {
  id: number;
  code: string;
  name: string;
  status: string;
  versionNo?: number;
  totalWeight?: number;
  sections?: Array<{
    code: string;
    name: string;
    weight: number;
    criteria: Array<{ code: string; name: string; weight: number }>;
  }>;
};

type DevPlan = {
  id: number;
  status: string;
  summary?: string | null;
  actions: Array<{
    id: number;
    developmentArea: string;
    recommendedTraining?: string | null;
    targetCompetency?: string | null;
    action?: string | null;
    dueDate?: string | null;
    status: string;
  }>;
};

const APPRAISAL_STEPS = [
  'NOT_STARTED',
  'GOALS_PENDING',
  'GOALS_APPROVED',
  'SELF_REVIEW_IN_PROGRESS',
  'SELF_SUBMITTED',
  'REVIEW_IN_PROGRESS',
  'REVIEW_SUBMITTED',
  'CALIBRATION',
  'FINALIZED',
  'LOCKED',
];

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-surface-muted text-ink">
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function ProgressSteps({ status }: { status: string }) {
  const idx = Math.max(0, APPRAISAL_STEPS.indexOf(status));
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {APPRAISAL_STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 min-w-[2rem] flex-1 rounded ${i <= idx ? 'bg-accent' : 'bg-surface-muted'}`}
          title={s.replace(/_/g, ' ')}
        />
      ))}
    </div>
  );
}

function HrPerfNav() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/hr/performance"><Button variant="secondary" size="sm">Dashboard</Button></Link>
      <Link to="/hr/performance/cycles"><Button variant="secondary" size="sm">Cycles</Button></Link>
      <Link to="/hr/performance/templates"><Button variant="secondary" size="sm">Templates</Button></Link>
      <Link to="/hr/performance/employees"><Button variant="secondary" size="sm">Employees</Button></Link>
      <Link to="/hr/performance/calibration"><Button variant="secondary" size="sm">Calibration</Button></Link>
      <Link to="/hr/performance/reports"><Button variant="secondary" size="sm">Reports</Button></Link>
    </div>
  );
}

function TeamPerfNav() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/hr/performance/team"><Button variant="secondary" size="sm">Team</Button></Link>
      <Link to="/hr/performance/team/goals"><Button variant="secondary" size="sm">Pending Goals</Button></Link>
      <Link to="/hr/performance/team/reviews"><Button variant="secondary" size="sm">Pending Reviews</Button></Link>
      <Link to="/hr/performance/department"><Button variant="secondary" size="sm">Department</Button></Link>
    </div>
  );
}

function RatingInput({
  value,
  onChange,
  disabled,
  max = 5,
}: {
  value: number | null | undefined;
  onChange: (n: number | null) => void;
  disabled?: boolean;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={`min-h-9 min-w-9 rounded border text-sm font-medium ${
            value === n ? 'border-accent bg-accent text-white' : 'border-border bg-surface'
          } disabled:opacity-50`}
          onClick={() => onChange(value === n ? null : n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function StatusCards({ byStatus }: { byStatus: StatusMap }) {
  const entries = Object.entries(byStatus);
  if (!entries.length) {
    return <p className="text-sm text-ink-muted">No appraisals in this view yet.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([label, value]) => (
        <Surface key={label} className="p-4">
          <p className="text-xs uppercase text-ink-muted">{label.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </Surface>
      ))}
    </div>
  );
}

function AppraisalTable({
  rows,
  linkPrefix,
  empty = 'No appraisals',
}: {
  rows: AppraisalRow[];
  linkPrefix: string;
  empty?: string;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Appraisal</th>
              <th className="px-4 py-3">Cycle / Employee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="font-mono text-xs underline" to={`${linkPrefix}/${r.id}`}>
                    #{r.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.cycleName || r.employeeName || '—'}
                  <div className="text-xs text-ink-muted">
                    {r.cycleCode || r.employeeNumber || ''}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                <td className="px-4 py-3 tabular-nums">
                  {r.finalScore != null ? r.finalScore : r.selfScore != null ? r.selfScore : '—'}
                  {r.finalRatingLabel ? (
                    <span className="ml-2 text-xs text-ink-muted">{r.finalRatingLabel}</span>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">{empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <Link className="font-mono text-xs underline" to={`${linkPrefix}/${r.id}`}>#{r.id}</Link>
            <p className="mt-1 font-medium">{r.cycleName || r.employeeName || 'Appraisal'}</p>
            <p className="text-xs text-ink-muted">{r.cycleCode || r.employeeNumber || ''}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <StatusPill value={r.status} />
              <span className="tabular-nums text-sm">
                {r.finalScore != null ? r.finalScore : '—'}
              </span>
            </div>
          </Surface>
        ))}
        {rows.length === 0 ? <p className="text-sm text-ink-muted">{empty}</p> : null}
      </div>
    </>
  );
}

// ── Employee ────────────────────────────────────────────────────────────────

export function HrMyPerformancePage() {
  const [data, setData] = useState<{ appraisals: AppraisalRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('My Performance');

  useEffect(() => {
    api<{ appraisals: AppraisalRow[] } | AppraisalRow[]>('/api/hr/me/performance')
      .then((res) => {
        if (Array.isArray(res)) setData({ appraisals: res });
        else setData(res);
      })
      .catch(() => setData({ appraisals: [] }))
      .finally(() => setLoading(false));
  }, []);

  const current = useMemo(
    () =>
      (data?.appraisals ?? []).filter(
        (a) => !['FINALIZED', 'LOCKED'].includes(a.status),
      ),
    [data],
  );
  const past = useMemo(
    () =>
      (data?.appraisals ?? []).filter((a) =>
        ['FINALIZED', 'LOCKED'].includes(a.status),
      ),
    [data],
  );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Performance"
        subtitle="Goals, self-appraisal and development plans"
        actions={<Link to="/hr"><Button variant="secondary">My HR</Button></Link>}
      />
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Surface className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Current appraisals</h2>
            <AppraisalTable rows={current} linkPrefix="/hr/me/performance" empty="No active appraisals" />
          </Surface>
          <Surface className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Past appraisals</h2>
            <AppraisalTable rows={past} linkPrefix="/hr/me/performance" empty="No past appraisals" />
          </Surface>
        </>
      )}
    </div>
  );
}

export function HrMyAppraisalDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<AppraisalDetail | null>(null);
  const [dev, setDev] = useState<DevPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target: '',
    weight: '10',
    category: '',
  });
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [summary, setSummary] = useState('');
  const [criteriaDraft, setCriteriaDraft] = useState<
    Record<number, { selfRating: number | null; selfComments: string }>
  >({});
  useDocumentTitle('My Appraisal');

  const load = useCallback(() => {
    if (!id) return;
    api<AppraisalDetail>(`/api/hr/me/performance/${id}`)
      .then((d) => {
        setData(d);
        setSummary(d.employeeSummary ?? '');
        const draft: Record<number, { selfRating: number | null; selfComments: string }> = {};
        for (const c of d.criteria ?? []) {
          draft[c.criterionId] = {
            selfRating: c.selfRating ?? null,
            selfComments: c.selfComments ?? '',
          };
        }
        setCriteriaDraft(draft);
      })
      .catch(() => setData(null));
    api<DevPlan | null>(`/api/hr/me/performance/${id}/development`)
      .then(setDev)
      .catch(() => setDev(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = ['overview', 'goals', 'self', 'evidence', 'review', 'development'] as const;
  const canEditGoals = data && ['NOT_STARTED', 'GOALS_PENDING', 'GOALS_APPROVED'].includes(data.status);
  const canSelf = data && ['GOALS_APPROVED', 'SELF_REVIEW_IN_PROGRESS', 'GOALS_PENDING', 'NOT_STARTED'].includes(data.status)
    && !['SELF_SUBMITTED', 'REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED', 'CALIBRATION', 'FINALIZED', 'LOCKED'].includes(data.status);

  async function saveGoal() {
    if (!id || !goalForm.title) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        title: goalForm.title,
        description: goalForm.description || null,
        target: goalForm.target || null,
        category: goalForm.category || null,
        weight: Number(goalForm.weight) || 0,
      };
      if (editingGoalId) {
        await api(`/api/hr/me/performance/goals/${editingGoalId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/api/hr/me/performance/${id}/goals`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      setGoalForm({ title: '', description: '', target: '', weight: '10', category: '' });
      setEditingGoalId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save goal');
    } finally {
      setBusy(false);
    }
  }

  async function submitGoals() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/hr/me/performance/${id}/goals/submit`, { method: 'POST', body: '{}' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit goals');
    } finally {
      setBusy(false);
    }
  }

  async function saveSelf(submit = false) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const criteria = Object.entries(criteriaDraft).map(([criterionId, v]) => ({
        criterionId: Number(criterionId),
        selfRating: v.selfRating,
        selfComments: v.selfComments || null,
      }));
      await api(`/api/hr/me/performance/${id}/self`, {
        method: 'PUT',
        body: JSON.stringify({ employeeSummary: summary || null, criteria }),
      });
      if (submit) {
        await api(`/api/hr/me/performance/${id}/self/submit`, { method: 'POST', body: '{}' });
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save self-appraisal');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={`Appraisal #${data.id}`}
        subtitle={[data.cycleName, data.cycleCode].filter(Boolean).join(' · ') || 'My appraisal'}
        actions={<Link to="/hr/me/performance"><Button variant="secondary">All appraisals</Button></Link>}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill value={data.status} />
          {data.finalRatingLabel ? <span className="text-sm">{data.finalRatingLabel}</span> : null}
        </div>
        <ProgressSteps status={data.status} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`min-h-9 shrink-0 rounded px-3 py-1 text-sm capitalize ${
              tab === t ? 'bg-accent text-white' : 'bg-surface-muted'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'self' ? 'Self Appraisal' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Surface className="p-4">
            <p className="text-xs uppercase text-ink-muted">Status</p>
            <p className="mt-1 font-medium">{data.status.replace(/_/g, ' ')}</p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase text-ink-muted">Self score</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{data.selfScore ?? '—'}</p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase text-ink-muted">Final score</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{data.finalScore ?? '—'}</p>
          </Surface>
          <Surface className="p-4">
            <p className="text-xs uppercase text-ink-muted">Rating</p>
            <p className="mt-1 text-lg font-semibold">{data.finalRatingLabel ?? '—'}</p>
          </Surface>
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {(data.goals ?? []).map((g) => (
              <Surface key={g.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.title}</p>
                    <p className="text-xs text-ink-muted">Weight {g.weight}% · {g.category || 'General'}</p>
                  </div>
                  <StatusPill value={g.status} />
                </div>
                {g.description ? <p className="text-sm text-ink-muted">{g.description}</p> : null}
                {g.target ? <p className="text-sm">Target: {g.target}</p> : null}
                {canEditGoals && ['DRAFT', 'REJECTED'].includes(g.status) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingGoalId(g.id);
                      setGoalForm({
                        title: g.title,
                        description: g.description ?? '',
                        target: g.target ?? '',
                        weight: String(g.weight),
                        category: g.category ?? '',
                      });
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </Surface>
            ))}
            {(data.goals ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">No goals yet.</p>
            ) : null}
          </div>
          {canEditGoals ? (
            <Surface className="space-y-3 p-4">
              <p className="text-sm font-medium">{editingGoalId ? 'Edit goal' : 'Add goal'}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-ink-muted">Title</span>
                  <Input value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-ink-muted">Weight %</span>
                  <Input value={goalForm.weight} onChange={(e) => setGoalForm((f) => ({ ...f, weight: e.target.value }))} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-ink-muted">Category</span>
                  <Input value={goalForm.category} onChange={(e) => setGoalForm((f) => ({ ...f, category: e.target.value }))} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-ink-muted">Target</span>
                  <Input value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-ink-muted">Description</span>
                  <textarea
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
                    rows={3}
                    value={goalForm.description}
                    onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy || !goalForm.title} onClick={saveGoal}>
                  {editingGoalId ? 'Update goal' : 'Add goal'}
                </Button>
                {editingGoalId ? (
                  <Button variant="secondary" onClick={() => { setEditingGoalId(null); setGoalForm({ title: '', description: '', target: '', weight: '10', category: '' }); }}>
                    Cancel
                  </Button>
                ) : null}
                <Button variant="secondary" disabled={busy} onClick={submitGoals}>Submit goals</Button>
              </div>
            </Surface>
          ) : null}
        </div>
      )}

      {tab === 'self' && (
        <div className="space-y-4">
          <Surface className="space-y-3 p-4">
            <p className="text-sm font-medium">Employee summary</p>
            <textarea
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
              rows={4}
              disabled={!canSelf}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Surface>
          {(data.criteria ?? []).map((c) => (
            <Surface key={c.criterionId} className="space-y-3 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{c.name || `Criterion #${c.criterionId}`}</p>
                {c.weight != null ? <span className="text-xs text-ink-muted">Weight {c.weight}</span> : null}
              </div>
              {c.systemDisplay || c.systemValue != null ? (
                <div className="rounded bg-surface-muted px-3 py-2 text-sm">
                  <p className="text-xs uppercase text-ink-muted">System evidence (read-only)</p>
                  <p className="mt-1">{c.systemDisplay ?? String(c.systemValue)}</p>
                </div>
              ) : null}
              <div>
                <p className="mb-1 text-xs text-ink-muted">Self rating</p>
                <RatingInput
                  value={criteriaDraft[c.criterionId]?.selfRating}
                  disabled={!canSelf}
                  onChange={(n) =>
                    setCriteriaDraft((d) => ({
                      ...d,
                      [c.criterionId]: {
                        selfRating: n,
                        selfComments: d[c.criterionId]?.selfComments ?? '',
                      },
                    }))
                  }
                />
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-ink-muted">Comments</span>
                <textarea
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
                  rows={2}
                  disabled={!canSelf}
                  value={criteriaDraft[c.criterionId]?.selfComments ?? ''}
                  onChange={(e) =>
                    setCriteriaDraft((d) => ({
                      ...d,
                      [c.criterionId]: {
                        selfRating: d[c.criterionId]?.selfRating ?? null,
                        selfComments: e.target.value,
                      },
                    }))
                  }
                />
              </label>
            </Surface>
          ))}
          {(data.criteria ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No criteria loaded for this appraisal.</p>
          ) : null}
          {canSelf ? (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => saveSelf(false)}>Save draft</Button>
              <Button disabled={busy} onClick={() => saveSelf(true)}>Submit self-appraisal</Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Self-appraisal is locked for the current status.</p>
          )}
        </div>
      )}

      {tab === 'evidence' && (
        <div className="space-y-3">
          {(data.evidence ?? []).map((e, i) => (
            <Surface key={e.id ?? i} className="p-4">
              <p className="text-xs uppercase text-ink-muted">{e.source || 'Evidence'}</p>
              <p className="mt-1 font-medium">{e.label || 'System evidence'}</p>
              <p className="mt-1 text-sm">{e.displayValue ?? (e.systemValue != null ? String(e.systemValue) : '—')}</p>
            </Surface>
          ))}
          {(data.evidence ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No evidence snapshots yet.</p>
          ) : null}
        </div>
      )}

      {tab === 'review' && (
        <Surface className="space-y-3 p-4">
          <p className="text-sm font-medium">Reviewer feedback</p>
          <p className="text-sm whitespace-pre-wrap">
            {data.reviewerSummary || 'Reviewer comments will appear here after review is submitted.'}
          </p>
          {data.finalScore != null ? (
            <p className="text-sm">
              Final score: <span className="font-semibold tabular-nums">{data.finalScore}</span>
              {data.finalRatingLabel ? ` · ${data.finalRatingLabel}` : ''}
            </p>
          ) : null}
        </Surface>
      )}

      {tab === 'development' && (
        <div className="space-y-3">
          {dev ? (
            <>
              <Surface className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Development plan</p>
                  <StatusPill value={dev.status} />
                </div>
                {dev.summary ? <p className="mt-2 text-sm">{dev.summary}</p> : null}
              </Surface>
              {dev.actions.map((a) => (
                <Surface key={a.id} className="space-y-1 p-4">
                  <p className="font-medium">{a.developmentArea}</p>
                  {a.action ? <p className="text-sm">{a.action}</p> : null}
                  {a.recommendedTraining ? (
                    <p className="text-xs text-ink-muted">Training: {a.recommendedTraining}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill value={a.status} />
                    {a.dueDate ? (
                      <span className="text-xs text-ink-muted">Due {String(a.dueDate).slice(0, 10)}</span>
                    ) : null}
                  </div>
                </Surface>
              ))}
            </>
          ) : (
            <p className="text-sm text-ink-muted">No development plan yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── HOD / Manager ───────────────────────────────────────────────────────────

export function HrTeamPerformancePage() {
  const [dash, setDash] = useState<{
    pendingReviews?: number;
    total?: number;
    byStatus?: StatusMap;
  } | null>(null);
  useDocumentTitle('Team Performance');

  useEffect(() => {
    api<typeof dash>('/api/hr/performance/team/dashboard')
      .then(setDash)
      .catch(() => setDash({ pendingReviews: 0, total: 0, byStatus: {} }));
  }, []);

  if (!dash) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Team Performance"
        subtitle="Goals approval and manager reviews"
        actions={<TeamPerfNav />}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Pending reviews</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dash.pendingReviews ?? 0}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Team appraisals</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dash.total ?? 0}</p>
        </Surface>
      </div>
      <StatusCards byStatus={dash.byStatus ?? {}} />
    </div>
  );
}

export function HrTeamPendingGoalsPage() {
  const [rows, setRows] = useState<Array<AppraisalRow & { goalId?: number; goalTitle?: string }>>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  useDocumentTitle('Pending Goals');

  const load = useCallback(() => {
    api<typeof rows>('/api/hr/performance/team/pending-goals')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(goalId: number, decision: 'APPROVE' | 'REJECT') {
    setBusyId(goalId);
    try {
      await api(`/api/hr/performance/team/goals/${goalId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason: decision === 'REJECT' ? 'Needs revision' : undefined }),
      });
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Pending Goals" subtitle="Approve or reject team goals" actions={<TeamPerfNav />} />
      <div className="space-y-3">
        {rows.map((r) => (
          <Surface key={`${r.id}-${r.goalId ?? 0}`} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{r.goalTitle || r.employeeName || `Appraisal #${r.id}`}</p>
              <p className="text-xs text-ink-muted">
                {r.employeeName} · {r.employeeNumber} · Appraisal #{r.id}
              </p>
              <div className="mt-2"><StatusPill value={r.status} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/hr/performance/team/appraisals/${r.id}`}>
                <Button size="sm" variant="secondary">Open</Button>
              </Link>
              {r.goalId ? (
                <>
                  <Button size="sm" disabled={busyId === r.goalId} onClick={() => decide(r.goalId!, 'APPROVE')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger-soft" disabled={busyId === r.goalId} onClick={() => decide(r.goalId!, 'REJECT')}>
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          </Surface>
        ))}
        {rows.length === 0 ? <p className="text-sm text-ink-muted">No goals awaiting approval.</p> : null}
      </div>
    </div>
  );
}

export function HrTeamPendingReviewsPage() {
  const [rows, setRows] = useState<AppraisalRow[]>([]);
  useDocumentTitle('Pending Reviews');

  useEffect(() => {
    api<AppraisalRow[]>('/api/hr/performance/team/pending-reviews')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Pending Reviews" subtitle="Self-submitted appraisals awaiting manager review" actions={<TeamPerfNav />} />
      <AppraisalTable rows={rows} linkPrefix="/hr/performance/team/appraisals" empty="No pending reviews" />
    </div>
  );
}

export function HrTeamReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AppraisalDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [promo, setPromo] = useState('');
  const [increment, setIncrement] = useState('');
  const [criteriaDraft, setCriteriaDraft] = useState<
    Record<number, { reviewerRating: number | null; reviewerComments: string }>
  >({});
  useDocumentTitle('Team Review');

  const load = useCallback(() => {
    if (!id) return;
    api<AppraisalDetail>(`/api/hr/performance/team/appraisals/${id}`)
      .then((d) => {
        setData(d);
        setSummary(d.reviewerSummary ?? '');
        const draft: Record<number, { reviewerRating: number | null; reviewerComments: string }> = {};
        for (const c of d.criteria ?? []) {
          draft[c.criterionId] = {
            reviewerRating: c.reviewerRating ?? null,
            reviewerComments: c.reviewerComments ?? '',
          };
        }
        setCriteriaDraft(draft);
      })
      .catch(() => setData(null));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save(submit = false) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const criteria = Object.entries(criteriaDraft).map(([criterionId, v]) => ({
        criterionId: Number(criterionId),
        reviewerRating: v.reviewerRating,
        reviewerComments: v.reviewerComments || null,
      }));
      await api(`/api/hr/performance/team/appraisals/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          reviewerSummary: summary || null,
          reviewerPrivateNotes: privateNotes || null,
          promotionRecommendation: promo || null,
          incrementRecommendation: increment || null,
          criteria,
        }),
      });
      if (submit) {
        await api(`/api/hr/performance/team/appraisals/${id}/review/submit`, {
          method: 'POST',
          body: '{}',
        });
        navigate('/hr/performance/team/reviews');
        return;
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save review');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={`Review · ${data.employeeName ?? `#${data.id}`}`}
        subtitle={`${data.employeeNumber ?? ''} · ${data.cycleName ?? ''}`}
        actions={<Link to="/hr/performance/team/reviews"><Button variant="secondary">Pending reviews</Button></Link>}
      />
      <div className="flex flex-wrap gap-2">
        <StatusPill value={data.status} />
        <ProgressSteps status={data.status} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Surface className="space-y-2 p-4">
        <p className="text-sm font-medium">Employee self summary</p>
        <p className="text-sm whitespace-pre-wrap text-ink-muted">{data.employeeSummary || '—'}</p>
      </Surface>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Goals</h2>
        {(data.goals ?? []).map((g) => (
          <Surface key={g.id} className="p-4">
            <p className="font-medium">{g.title}</p>
            <p className="text-xs text-ink-muted">
              Self: {g.selfRating ?? '—'} · Progress {g.selfProgress ?? '—'}%
            </p>
            {g.selfComments ? <p className="mt-1 text-sm">{g.selfComments}</p> : null}
          </Surface>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Criteria ratings</h2>
        {(data.criteria ?? []).map((c) => (
          <Surface key={c.criterionId} className="space-y-3 p-4">
            <p className="font-medium">{c.name || `Criterion #${c.criterionId}`}</p>
            <p className="text-xs text-ink-muted">Self rating: {c.selfRating ?? '—'}</p>
            {c.systemDisplay ? (
              <div className="rounded bg-surface-muted px-3 py-2 text-sm">
                <p className="text-xs uppercase text-ink-muted">Evidence (read-only)</p>
                <p>{c.systemDisplay}</p>
              </div>
            ) : null}
            <RatingInput
              value={criteriaDraft[c.criterionId]?.reviewerRating}
              onChange={(n) =>
                setCriteriaDraft((d) => ({
                  ...d,
                  [c.criterionId]: {
                    reviewerRating: n,
                    reviewerComments: d[c.criterionId]?.reviewerComments ?? '',
                  },
                }))
              }
            />
            <textarea
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
              rows={2}
              placeholder="Reviewer comments"
              value={criteriaDraft[c.criterionId]?.reviewerComments ?? ''}
              onChange={(e) =>
                setCriteriaDraft((d) => ({
                  ...d,
                  [c.criterionId]: {
                    reviewerRating: d[c.criterionId]?.reviewerRating ?? null,
                    reviewerComments: e.target.value,
                  },
                }))
              }
            />
          </Surface>
        ))}
      </div>

      <Surface className="space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Reviewer summary (employee-visible)</span>
          <textarea
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Private notes (reviewer only)</span>
          <textarea
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            rows={3}
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Promotion</span>
            <select
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
            >
              <option value="">—</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="DEFER">Defer</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Increment</span>
            <select
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
              value={increment}
              onChange={(e) => setIncrement(e.target.value)}
            >
              <option value="">—</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="DEFER">Defer</option>
            </select>
          </label>
        </div>
      </Surface>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => save(false)}>Save draft</Button>
        <Button disabled={busy} onClick={() => save(true)}>Submit review</Button>
      </div>
    </div>
  );
}

export function HrDepartmentPerformancePage() {
  const [rows, setRows] = useState<Array<{ departmentId?: number | null; departmentName?: string; count?: number; avgScore?: number | null; byStatus?: StatusMap }>>([]);
  useDocumentTitle('Department Performance');

  useEffect(() => {
    api<typeof rows | { departments: typeof rows }>('/api/hr/performance/department')
      .then((res) => setRows(Array.isArray(res) ? res : res.departments ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Department Performance" subtitle="Department appraisal summary" actions={<TeamPerfNav />} />
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Avg score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.departmentId ?? i} className="border-t border-border">
                <td className="px-4 py-3">{r.departmentName || `Dept ${r.departmentId ?? '—'}`}</td>
                <td className="px-4 py-3 tabular-nums">{r.count ?? 0}</td>
                <td className="px-4 py-3 tabular-nums">{r.avgScore ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-muted">No department data</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <Surface key={r.departmentId ?? i} className="p-4">
            <p className="font-medium">{r.departmentName || `Dept ${r.departmentId ?? '—'}`}</p>
            <p className="text-sm text-ink-muted">Count {r.count ?? 0} · Avg {r.avgScore ?? '—'}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

// ── HR Admin ────────────────────────────────────────────────────────────────

export function HrPerformanceDashboardPage() {
  const [dash, setDash] = useState<{ total?: number; byStatus?: StatusMap } | null>(null);
  useDocumentTitle('Performance Dashboard');

  useEffect(() => {
    api<typeof dash>('/api/hr/performance/dashboard')
      .then(setDash)
      .catch(() => setDash({ total: 0, byStatus: {} }));
  }, []);

  if (!dash) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Performance & Appraisal"
        subtitle="Cycles, templates, enrollment, calibration and reports"
      />
      <HrPerfNav />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Total appraisals</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{dash.total ?? 0}</p>
        </Surface>
      </div>
      <StatusCards byStatus={dash.byStatus ?? {}} />
    </div>
  );
}

export function HrAppraisalCyclesPage() {
  const [rows, setRows] = useState<Cycle[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    periodStart: '',
    periodEnd: '',
  });
  useDocumentTitle('Appraisal Cycles');

  const load = useCallback(() => {
    api<Cycle[]>('/api/hr/performance/cycles').then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name || !form.code || !form.periodStart || !form.periodEnd) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/hr/performance/cycles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', code: '', periodStart: '', periodEnd: '' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create cycle');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Appraisal Cycles" actions={<HrPerfNav />} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create cycle</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Name</span>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Code</span>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Period start</span>
            <Input type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Period end</span>
            <Input type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} />
          </label>
        </div>
        <Button disabled={busy || !form.name || !form.code} onClick={create}>Create cycle</Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Cycle</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{r.code}</p>
                </td>
                <td className="px-4 py-3 text-sm">
                  {r.periodStart ? String(r.periodStart).slice(0, 10) : '—'} –{' '}
                  {r.periodEnd ? String(r.periodEnd).slice(0, 10) : '—'}
                </td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-muted">No cycles yet</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <p className="font-medium">{r.name}</p>
            <p className="font-mono text-xs text-ink-muted">{r.code}</p>
            <div className="mt-2"><StatusPill value={r.status} /></div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrAppraisalTemplatesPage() {
  const [rows, setRows] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    sectionName: 'Performance',
    sectionWeight: '100',
    criterionName: 'Overall contribution',
    criterionWeight: '100',
  });
  useDocumentTitle('Appraisal Templates');

  const load = useCallback(() => {
    api<Template[]>('/api/hr/performance/templates').then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.code || !form.name) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/hr/performance/templates', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          totalWeight: 100,
          sections: [
            {
              code: 'SEC1',
              name: form.sectionName || 'Performance',
              weight: Number(form.sectionWeight) || 100,
              criteria: [
                {
                  code: 'C1',
                  name: form.criterionName || 'Overall contribution',
                  weight: Number(form.criterionWeight) || 100,
                  measurementType: 'RATING',
                  selfRatingAllowed: true,
                  reviewerRatingAllowed: true,
                },
              ],
            },
          ],
        }),
      });
      setForm({
        code: '',
        name: '',
        sectionName: 'Performance',
        sectionWeight: '100',
        criterionName: 'Overall contribution',
        criterionWeight: '100',
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Appraisal Templates" actions={<HrPerfNav />} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create template</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Code</span>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-ink-muted">Name</span>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Section name</span>
            <Input value={form.sectionName} onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Section weight</span>
            <Input value={form.sectionWeight} onChange={(e) => setForm((f) => ({ ...f, sectionWeight: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Criterion name</span>
            <Input value={form.criterionName} onChange={(e) => setForm((f) => ({ ...f, criterionName: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Criterion weight</span>
            <Input value={form.criterionWeight} onChange={(e) => setForm((f) => ({ ...f, criterionWeight: e.target.value }))} />
          </label>
        </div>
        <Button disabled={busy || !form.code || !form.name} onClick={create}>Create template</Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <div className="space-y-3">
        {rows.map((r) => (
          <Surface key={r.id} className="flex flex-wrap items-start justify-between gap-2 p-4">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="font-mono text-xs text-ink-muted">{r.code} · v{r.versionNo ?? 1}</p>
            </div>
            <StatusPill value={r.status} />
          </Surface>
        ))}
        {rows.length === 0 ? <p className="text-sm text-ink-muted">No templates yet.</p> : null}
      </div>
    </div>
  );
}

export function HrAppraisalEmployeesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rows, setRows] = useState<AppraisalRow[]>([]);
  const [employeeIds, setEmployeeIds] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Appraisal Employees');

  const load = useCallback(() => {
    api<Cycle[]>('/api/hr/performance/cycles').then(setCycles).catch(() => setCycles([]));
    api<Template[]>('/api/hr/performance/templates').then(setTemplates).catch(() => setTemplates([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = cycleId ? `?cycleId=${cycleId}` : '';
    api<AppraisalRow[]>(`/api/hr/performance/employees${q}`).then(setRows).catch(() => setRows([]));
  }, [cycleId]);

  async function enroll(allEligible: boolean) {
    if (!cycleId) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        allEligible,
        templateId: templateId ? Number(templateId) : undefined,
      };
      if (!allEligible) {
        body.employeeIds = employeeIds
          .split(/[,\s]+/)
          .map((s) => Number(s.trim()))
          .filter((n) => n > 0);
      }
      await api(`/api/hr/performance/cycles/${cycleId}/enroll`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const q = `?cycleId=${cycleId}`;
      setRows(await api<AppraisalRow[]>(`/api/hr/performance/employees${q}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enroll failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Appraisal Employees" subtitle="List and enroll employees into a cycle" actions={<HrPerfNav />} />
      <Surface className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Cycle</span>
            <select
              className="w-full min-w-[12rem] rounded border border-border bg-surface px-3 py-2 text-sm"
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
            >
              <option value="">All cycles</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Template</span>
            <select
              className="w-full min-w-[12rem] rounded border border-border bg-surface px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Cycle default</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-1">
            <span className="mb-1 block text-ink-muted">Employee IDs (comma-separated)</span>
            <Input value={employeeIds} onChange={(e) => setEmployeeIds(e.target.value)} />
          </label>
          <Button disabled={!cycleId || busy} onClick={() => enroll(false)}>Enroll selected</Button>
          <Button variant="secondary" disabled={!cycleId || busy} onClick={() => enroll(true)}>Enroll all eligible</Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>
      <AppraisalTable rows={rows} linkPrefix="/hr/me/performance" empty="No enrolled appraisals" />
    </div>
  );
}

export function HrCalibrationPage() {
  const [rows, setRows] = useState<AppraisalRow[]>([]);
  const [selected, setSelected] = useState<AppraisalRow | null>(null);
  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Calibration');

  const load = useCallback(() => {
    api<AppraisalRow[]>('/api/hr/performance/calibration')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function calibrate() {
    if (!selected || !score || reason.trim().length < 5) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/hr/performance/appraisals/${selected.id}/calibrate`, {
        method: 'POST',
        body: JSON.stringify({ calibratedScore: Number(score), reason }),
      });
      setSelected(null);
      setScore('');
      setReason('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calibration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Calibration" subtitle="Adjust scores with a documented reason" actions={<HrPerfNav />} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left"
              onClick={() => {
                setSelected(r);
                setScore(String(r.reviewerScore ?? r.selfScore ?? ''));
              }}
            >
              <Surface
                className={`p-4 ${selected?.id === r.id ? 'ring-2 ring-accent' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.employeeName || `Appraisal #${r.id}`}</p>
                    <p className="text-xs text-ink-muted">{r.employeeNumber} · {r.cycleName}</p>
                  </div>
                  <StatusPill value={r.status} />
                </div>
                <p className="mt-2 text-sm tabular-nums">
                  Reviewer {r.reviewerScore ?? '—'} · Final {r.finalScore ?? '—'}
                </p>
              </Surface>
            </button>
          ))}
          {rows.length === 0 ? <p className="text-sm text-ink-muted">No appraisals ready for calibration.</p> : null}
        </div>
        <Surface className="space-y-3 p-4 h-fit">
          <p className="text-sm font-medium">
            {selected ? `Calibrate #${selected.id}` : 'Select an appraisal'}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Calibrated score (0–100)</span>
            <Input
              value={score}
              disabled={!selected}
              onChange={(e) => setScore(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Reason (required)</span>
            <textarea
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
              rows={4}
              disabled={!selected}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button
            disabled={!selected || busy || !score || reason.trim().length < 5}
            onClick={calibrate}
          >
            Apply calibration
          </Button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </Surface>
      </div>
    </div>
  );
}

export function HrPerformanceReportsPage() {
  const [kind, setKind] = useState('completion');
  const [cycleId, setCycleId] = useState('');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [rows, setRows] = useState<unknown[]>([]);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Performance Reports');

  useEffect(() => {
    api<Cycle[]>('/api/hr/performance/cycles').then(setCycles).catch(() => setCycles([]));
  }, []);

  async function run() {
    setBusy(true);
    try {
      const q = cycleId ? `?cycleId=${cycleId}` : '';
      const res = await api<unknown>(`/api/hr/performance/reports/${kind}${q}`);
      setRows(Array.isArray(res) ? res : [res]);
    } catch {
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Performance Reports" actions={<HrPerfNav />} />
      <Surface className="flex flex-wrap items-end gap-2 p-4">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Report</span>
          <select
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="completion">Completion</option>
            <option value="rating-distribution">Rating distribution</option>
            <option value="department-summary">Department summary</option>
            <option value="goal-completion">Goal completion</option>
            <option value="pending-reviews">Pending reviews</option>
            <option value="calibration-changes">Calibration changes</option>
            <option value="development-needs">Development needs</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Cycle</span>
          <select
            className="rounded border border-border bg-surface px-3 py-2 text-sm"
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
          >
            <option value="">All</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <Button disabled={busy} onClick={run}>Run report</Button>
      </Surface>
      <Surface className="overflow-x-auto p-4">
        <pre className="max-h-[28rem] overflow-auto text-xs">{JSON.stringify(rows, null, 2)}</pre>
      </Surface>
    </div>
  );
}

// ── Principal ───────────────────────────────────────────────────────────────

export function HrPrincipalPerformancePage() {
  const [dash, setDash] = useState<{
    total?: number;
    byDepartment?: Record<string, number>;
    byRating?: Record<string, number>;
    hodAppraisals?: AppraisalRow[];
  } | null>(null);
  useDocumentTitle('Institution Performance');

  useEffect(() => {
    api<typeof dash>('/api/hr/performance/principal')
      .then(setDash)
      .catch(() => setDash({ total: 0, byDepartment: {}, byRating: {}, hodAppraisals: [] }));
  }, []);

  if (!dash) return <Skeleton className="h-40 w-full" />;

  const depts = Object.entries(dash.byDepartment ?? {});
  const ratings = Object.entries(dash.byRating ?? {});

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Institution Performance"
        subtitle="Overview, HOD appraisals and department comparison"
      />
      <Surface className="p-4">
        <p className="text-xs uppercase text-ink-muted">Total appraisals</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{dash.total ?? 0}</p>
      </Surface>
      <div>
        <h2 className="mb-3 text-sm font-semibold">Department comparison</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map(([id, count]) => (
            <Surface key={id} className="p-4">
              <p className="text-xs uppercase text-ink-muted">Department {id}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
            </Surface>
          ))}
          {depts.length === 0 ? <p className="text-sm text-ink-muted">No department data.</p> : null}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold">Rating distribution</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ratings.map(([label, count]) => (
            <Surface key={label} className="p-4">
              <p className="text-xs uppercase text-ink-muted">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
            </Surface>
          ))}
          {ratings.length === 0 ? <p className="text-sm text-ink-muted">No ratings yet.</p> : null}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold">HOD appraisals</h2>
        <AppraisalTable
          rows={dash.hodAppraisals ?? []}
          linkPrefix="/hr/performance/team/appraisals"
          empty="No HOD appraisals listed"
        />
      </div>
    </div>
  );
}
