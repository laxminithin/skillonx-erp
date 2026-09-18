import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, StatusBadge, Surface, Textarea, useToast } from '../../components/ui';

type CycleDetail = {
  cycle: {
    id: number;
    courseName: string;
    courseCode: string;
    outcomeCode: string;
    state: string;
    target: number | null;
    actual: number | null;
    gap: number | null;
    improvement: number | null;
    revisedAttainment: number | null;
    studentsIdentified: number | null;
    suggestedRootCause: string | null;
    createdBy: number;
    recommendation: {
      summary?: string;
      causes?: Array<{ code: string; label: string; rationale: string }>;
      actions?: Array<{ code: string; label: string }>;
    } | null;
  };
  actions: Array<{ id: number; code: string; label: string; implemented: boolean }>;
  evidence: {
    percent: number;
    complete: boolean;
    requiredSatisfied: number;
    requiredTotal: number;
    items: Array<{ code: string; label: string; required: boolean; satisfied: boolean; autoLinked?: boolean }>;
  };
};

export function ImprovementCyclePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<CycleDetail | null>(null);
  const [libs, setLibs] = useState<{ causes: Array<{ code: string; label: string }>; actions: Array<{ code: string; label: string }> } | null>(null);
  const [cause, setCause] = useState('');
  const [other, setOther] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<CycleDetail>(`/api/attainment/cycles/${id}`)
      .then((d) => {
        setData(d);
        setCause(d.cycle.suggestedRootCause || d.cycle.recommendation?.causes?.[0]?.code || '');
        setSelected(d.cycle.recommendation?.actions?.map((a) => a.code) || d.actions.map((a) => a.code));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load cycle', 'error'));

  useEffect(() => {
    load();
    api<{ causes: Array<{ code: string; label: string }>; actions: Array<{ code: string; label: string }> }>(
      '/api/attainment/libraries',
    )
      .then(setLibs)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useDocumentTitle(data ? `${data.cycle.outcomeCode} improvement` : 'Improvement cycle');

  const act = async (path: string, body?: unknown) => {
    setBusy(true);
    try {
      await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-ink-muted">Loading…</p>;
  const c = data.cycle;
  const rec = c.recommendation;

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/attainment" className="hover:text-accent">
            Attainment
          </Link>
        }
        title={`${c.courseCode} — ${c.outcomeCode} requires improvement`}
        subtitle={c.courseName}
        actions={<StatusBadge status={c.state} />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Surface className="!p-3">
          <p className="text-[11px] uppercase text-ink-muted">Target</p>
          <p className="font-semibold">{c.target ?? '—'}</p>
        </Surface>
        <Surface className="!p-3">
          <p className="text-[11px] uppercase text-ink-muted">Actual</p>
          <p className="font-semibold">{c.actual ?? '—'}</p>
        </Surface>
        <Surface className="!p-3">
          <p className="text-[11px] uppercase text-ink-muted">Gap</p>
          <p className="font-semibold">{c.gap ?? '—'}</p>
        </Surface>
        <Surface className="!p-3">
          <p className="text-[11px] uppercase text-ink-muted">Students identified</p>
          <p className="font-semibold">{c.studentsIdentified ?? '—'}</p>
        </Surface>
      </div>

      <Surface className="mb-4 space-y-2">
        <h2 className="font-semibold">Suggested based on assessment evidence</h2>
        <p className="text-sm">{rec?.summary}</p>
        {rec?.causes?.map((x) => (
          <p key={x.code} className="text-sm text-ink-muted">
            {x.label}: {x.rationale}
          </p>
        ))}
      </Surface>

      {c.state === 'FACULTY_REVIEW_REQUIRED' || c.state === 'REOPENED' ? (
        <Surface className="mb-4 space-y-3">
          <Field label="Root cause">
            <Select value={cause} onChange={(e) => setCause(e.target.value)}>
              <option value="">Select</option>
              {libs?.causes.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>
          {cause === 'OTHER' ? (
            <Field label="Justification (required)">
              <Textarea value={other} onChange={(e) => setOther(e.target.value)} />
            </Field>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(rec?.actions || libs?.actions || []).map((a) => {
              const on = selected.includes(a.code);
              return (
                <button
                  key={a.code}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-accent bg-accent-soft text-accent' : 'border-border'}`}
                  onClick={() => setSelected((s) => (s.includes(a.code) ? s.filter((x) => x !== a.code) : [...s, a.code]))}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={busy || !cause || !selected.length}
              onClick={() =>
                act(`/api/attainment/cycles/${id}/plan`, {
                  rootCauseCode: cause,
                  rootCauseOther: other,
                  actions: selected.map((code) => ({ code, label: libs?.actions.find((a) => a.code === code)?.label || code })),
                })
              }
            >
              Accept recommended plan
            </Button>
          </div>
        </Surface>
      ) : null}

      <Surface className="mb-4">
        <h2 className="font-semibold">Evidence completeness: {data.evidence.percent}%</h2>
        <p className="text-xs text-ink-muted">
          {data.evidence.requiredSatisfied}/{data.evidence.requiredTotal} required items. Optional photos never count as sufficient proof.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {data.evidence.items.map((e) => (
            <li key={e.code} className="flex justify-between">
              <span>
                {e.label} {e.autoLinked ? <span className="text-xs text-ink-muted">(auto-linked)</span> : null}
              </span>
              <span>{e.satisfied ? '✓' : e.required ? 'Missing' : 'Optional'}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-muted">
          Evidence automatically linked: {data.evidence.items.filter((i) => i.autoLinked && i.required).length}/
          {data.evidence.items.filter((i) => i.required).length}
        </p>
      </Surface>

      {c.revisedAttainment != null ? (
        <Surface className="mb-4">
          <p className="text-sm">
            Improvement = {c.revisedAttainment} − {c.actual} = {c.improvement}
            {c.target != null && c.revisedAttainment < c.target ? ' — target still not attained' : ''}
          </p>
        </Surface>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {c.state === 'ACTION_PLANNED' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'APPROVED_FOR_IMPLEMENTATION' })}>
            Submit for implementation approval
          </Button>
        ) : null}
        {c.state === 'APPROVED_FOR_IMPLEMENTATION' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'IN_PROGRESS' })}>
            Start implementation
          </Button>
        ) : null}
        {c.state === 'IN_PROGRESS' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'IMPLEMENTED' })}>
            Mark implemented
          </Button>
        ) : null}
        {c.state === 'READY_FOR_REASSESSMENT' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'REASSESSED' })}>
            Record reassessment complete
          </Button>
        ) : null}
        {c.state === 'TARGET_ACHIEVED' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'SUBMITTED_FOR_REVIEW' })}>
            Submit for review
          </Button>
        ) : null}
        {c.state === 'SUBMITTED_FOR_REVIEW' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'APPROVED' })}>
            Approve
          </Button>
        ) : null}
        {c.state === 'APPROVED' ? (
          <Button disabled={busy} onClick={() => act(`/api/attainment/cycles/${id}/transition`, { to: 'CLOSED' })}>
            Close cycle
          </Button>
        ) : null}
      </div>
    </div>
  );
}
